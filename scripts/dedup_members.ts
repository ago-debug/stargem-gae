import { db } from '../server/db';
import { sql } from 'drizzle-orm';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

async function main() {
  console.log(`Starting dedup script (dry-run: ${isDryRun})`);

  // A) Trovare gruppi
  const resEmail = await db.execute(sql`
    SELECT first_name, last_name, email, GROUP_CONCAT(id ORDER BY id SEPARATOR ',') as ids
    FROM members WHERE active = 1 AND email IS NOT NULL AND email != ''
    GROUP BY first_name, last_name, email HAVING COUNT(*) > 1
  `);
  
  const resDob = await db.execute(sql`
    SELECT first_name, last_name, date_of_birth, GROUP_CONCAT(id ORDER BY id SEPARATOR ',') as ids
    FROM members WHERE active = 1 AND date_of_birth IS NOT NULL
    GROUP BY first_name, last_name, date_of_birth HAVING COUNT(*) > 1
  `);

  const resPhone = await db.execute(sql`
    SELECT first_name, last_name, phone, GROUP_CONCAT(id ORDER BY id SEPARATOR ',') as ids
    FROM members WHERE active = 1 AND phone IS NOT NULL AND phone != ''
    GROUP BY first_name, last_name, phone HAVING COUNT(*) > 1
  `);

  const groupsMap = new Map<string, { idsTxt: string, reason: string, first_name: string, last_name: string }>();

  function processRows(rows: any[], reason: string) {
    for (const r of rows) {
      if (!groupsMap.has(r.ids)) {
        groupsMap.set(r.ids, { idsTxt: r.ids, reason, first_name: r.first_name, last_name: r.last_name });
      } else {
        const existing = groupsMap.get(r.ids)!;
        if (!existing.reason.includes(reason)) {
          existing.reason += `+${reason}`;
        }
      }
    }
  }

  processRows(resEmail[0] as any[], 'email');
  processRows(resDob[0] as any[], 'dob');
  processRows(resPhone[0] as any[], 'phone');

  const groups = Array.from(groupsMap.values());
  console.log(`\nGruppi trovati per tipo:`);
  console.log(`  email: ${(resEmail[0] as any[]).length} gruppi`);
  console.log(`  dob: ${(resDob[0] as any[]).length} gruppi`);
  console.log(`  phone: ${(resPhone[0] as any[]).length} gruppi`);
  console.log(`  totale unici: ${groups.length}`);

  let totalRecordsToDelete = 0;
  let totalFkMigrated = 0;
  let anomaliCount = 0;

  const FK_TABLES = [
    { t: 'staff_contracts_compliance', c: 'member_id' },
    { t: 'staff_document_signatures', c: 'member_id' },
    { t: 'staff_presenze', c: 'member_id' },
    { t: 'member_packages', c: 'member_id' },
    { t: 'gem_conversations', c: 'participant_id' },
    { t: 'payments', c: 'member_id' },
    { t: 'instructor_agreements', c: 'member_id' },
    { t: 'team_documents', c: 'member_id' },
    { t: 'memberships', c: 'member_id' },
    { t: 'carnet_wallets', c: 'member_id' },
    { t: 'staff_disciplinary_log', c: 'member_id' },
    { t: 'member_uploads', c: 'member_id' },
    { t: 'access_logs', c: 'member_id' },
    { t: 'member_relationships', c: 'member_id' },
    { t: 'member_relationships', c: 'related_member_id' },
    { t: 'payslips', c: 'member_id' },
    { t: 'member_forms_submissions', c: 'member_id' },
    { t: 'medical_certificates', c: 'member_id' },
    { t: 'team_employees', c: 'member_id' },
    { t: 'studio_bookings', c: 'member_id' },
    { t: 'enrollments', c: 'member_id' },
    { t: 'member_discounts', c: 'member_id' },
    { t: 'attendances', c: 'member_id' },
    { t: 'promo_rules', c: 'member_id' },
    { t: 'staff_sostituzioni', c: 'absent_member_id' },
    { t: 'staff_sostituzioni', c: 'substitute_member_id' }
  ];

  const MERGE_FIELDS = [
    'email', 'phone', 'mobile', 'address', 'city', 'postal_code', 'province',
    'birth_place', 'birth_nation', 'date_of_birth', 'fiscal_code', 'nationality',
    'region', 'notes', 'internal_id', 'insertion_date', 'privacy_date',
    'consent_newsletter', 'tutor1_fiscal_code', 'tutor1_phone', 'tutor1_email'
  ];

  let i = 0;
  for (const group of groups) {
    i++;
    const ids = group.idsTxt.split(',').map(x => parseInt(x));
    const placeholders = ids.join(',');
    const membersRes = await db.execute(sql.raw(`SELECT * FROM members WHERE id IN (${placeholders})`));
    const members = membersRes[0] as any[];

    // Calculate scores
    const SCORING_FIELDS = [
      'email', 'phone', 'mobile', 'fiscal_code', 'date_of_birth', 'birth_place',
      'address', 'city', 'postal_code', 'province', 'nationality', 'region',
      'birth_nation', 'secondary_email', 'privacy_date', 'consent_newsletter',
      'notes', 'tutor1_fiscal_code', 'internal_id', 'insertion_date'
    ];

    let winner = null;
    let maxScore = -1;

    for (const m of members) {
      m._score = 0;
      for (const sf of SCORING_FIELDS) {
        if (m[sf] !== null && m[sf] !== undefined && m[sf] !== '') {
          m._score++;
        }
      }
      if (m._score > maxScore) {
        maxScore = m._score;
        winner = m;
      } else if (m._score === maxScore) {
         if (m.id < winner.id) {
           winner = m;
         }
      }
    }

    const losers = members.filter(m => m.id !== winner.id);
    let isAnomalous = false;

    // Check for anomalies: varying fiscal_codes
    for (const l of losers) {
      if (winner.fiscal_code && l.fiscal_code && winner.fiscal_code !== l.fiscal_code) {
        isAnomalous = true;
      }
    }

    if (isAnomalous) {
      console.log(`\nGRUPPO [${i}/${groups.length}]: ${group.first_name} ${group.last_name}`);
      console.log(`[ANOMALIA] CF in conflitto tra winner e loser. Segnalato e NON processato.`);
      anomaliCount++;
      continue;
    }

    totalRecordsToDelete += losers.length;
    let fkMigratedInGroup = 0;
    let fkTablesAffected = 0;
    const mergeSet = new Set<string>();

    for (const l of losers) {
      if (!isDryRun) {
        await db.execute(sql`START TRANSACTION;`);
        try {
          // 1. Move FKs
          for (const tbl of FK_TABLES) {
            const countRes = await db.execute(sql.raw(`SELECT COUNT(*) as c FROM ${tbl.t} WHERE ${tbl.c} = ${l.id};`));
            const c = (countRes[0] as any[])[0].c;
            if (c > 0) {
              await db.execute(sql.raw(`UPDATE ${tbl.t} SET ${tbl.c} = ${winner.id} WHERE ${tbl.c} = ${l.id};`));
              fkMigratedInGroup += c;
              totalFkMigrated += c;
              fkTablesAffected++;
            }
          }

          // 2. Merge data string logic
          const updateParts: string[] = [];
          for (const mf of MERGE_FIELDS) {
            const wVal = winner[mf];
            const lVal = l[mf];
            if ((wVal === null || wVal === '' || wVal === undefined) && lVal !== null && lVal !== undefined && lVal !== '') {
              // we need to set this in DB
              const valStr = typeof lVal === 'string' ? `'${lVal.replace(/'/g, "\\'")}'` : (lVal instanceof Date ? `'${lVal.toISOString().slice(0, 19).replace('T', ' ')}'` : lVal);
              updateParts.push(`${mf} = ${valStr}`);
              winner[mf] = lVal; // Update winner in memory
              mergeSet.add(mf);
            }
          }

          if (updateParts.length > 0) {
            const upQuery = `UPDATE members SET ${updateParts.join(', ')} WHERE id = ${winner.id}`;
            await db.execute(sql.raw(upQuery));
          }

          // 3. Delete loser
          await db.execute(sql.raw(`DELETE FROM members WHERE id = ${l.id}`));
          await db.execute(sql`COMMIT;`);
        } catch (err: any) {
          await db.execute(sql`ROLLBACK;`);
          console.error(`Error processing loser ${l.id} in group ${group.idsTxt}: ${err.message}`);
          throw err;
        }
      } else {
        // DRY RUN mode computation of FKs and empty fields
        for (const tbl of FK_TABLES) {
          const countRes = await db.execute(sql.raw(`SELECT COUNT(*) as c FROM ${tbl.t} WHERE ${tbl.c} = ${l.id};`));
          const c = (countRes[0] as any[])[0].c;
          if (c > 0) {
            fkMigratedInGroup += c;
            totalFkMigrated += c;
            fkTablesAffected++;
          }
        }
        for (const mf of MERGE_FIELDS) {
          const wVal = winner[mf];
          const lVal = l[mf];
          if ((wVal === null || wVal === '' || wVal === undefined) && lVal !== null && lVal !== undefined && lVal !== '') {
             winner[mf] = lVal; // Update in memory so multiple losers can stack correctly
             mergeSet.add(mf);
          }
        }
      }
    }

    console.log(`\nGRUPPO [${i}/${groups.length}]: ${group.first_name} ${group.last_name}`);
    console.log(`Winner: ID [${winner.id}] score=[${winner._score}] cf=[${winner.fiscal_code || 'NO-CF'}]`);
    let loserStr = losers.map(l => `ID [${l.id}] score=[${l._score}] cf=[${l.fiscal_code || 'NO-CF'}]`).join(' | ');
    console.log(`Loser:  ${loserStr}`);
    console.log(`Motivo: ${group.reason}`);
    console.log(`FK migrati: ${fkMigratedInGroup} riferimenti in ${fkTablesAffected} tabelle`);
    console.log(`Campi mergiati: ${mergeSet.size > 0 ? Array.from(mergeSet).join(', ') : 'nessuno'}`);
    console.log(`Azione: ${isDryRun ? 'DRY-RUN' : 'ELIMINATO'}`);
  }

  console.log(`\n=== RIEPILOGO ===`);
  console.log(`Total duplicated records to delete: ${totalRecordsToDelete}`);
  console.log(`Total FKs migrated: ${totalFkMigrated}`);
  console.log(`Anomalies (conflicting CFs skipped): ${anomaliCount}`);
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
