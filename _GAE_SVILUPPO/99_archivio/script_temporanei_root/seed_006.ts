import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("=== FIX 1: RINOMINA PROMO ===");
  await db.execute(sql`
    UPDATE promo_rules
    SET code = '2526DIREZPERS20', label = 'Direzione Personale -20%'
    WHERE code = '2526DIREZIONE20.PERS' AND tenant_id = 1;
  `);

  const [fix1] = await db.execute(sql`
    SELECT code, label, target_type, value 
    FROM promo_rules 
    WHERE code IN ('2526DIREZIONE20','2526DIREZPERS20')
    ORDER BY code;
  `);
  console.log("Verifica FIX 1:", fix1);

  console.log("\\n=== FIX 2: INSERIMENTO ISTRUTTORI === ");
  // INSERIMENTO COMPLETATO NELLA PRECEDENTE ESECUZIONE
  const [members] = await db.execute(sql`
    SELECT id, first_name, last_name 
    FROM members
    WHERE first_name IN ('Filly', 'Yuri', 'Mamacita')
    ORDER BY id DESC LIMIT 3;
  `);
  console.log("Istruttori creati:", members);

  // Mappa member IDs
  let idFilly, idYuri, idMamacita;
  for (let m of (members as any[])) {
      if (m.first_name === 'Filly') idFilly = m.id;
      if (m.first_name === 'Yuri') idYuri = m.id;
      if (m.first_name === 'Mamacita') idMamacita = m.id;
  }

  console.log("\\n=== FIX 3: INSERIMENTO ACCORDI === ");
  const [studios] = await db.execute(sql`
    SELECT id, name FROM studios 
    WHERE name LIKE '%Studio 22%' OR name LIKE '%Studio 4%' OR name LIKE '%Studio 04%'
  `);
  let idStudio22 = null;
  let idStudio04 = null;
  for(let s of (studios as any[])) {
      if (s.name.includes("22")) idStudio22 = s.id;
      if (s.name.includes("4") || s.name.includes("04") || s.name.includes("14") || s.name.includes("24")) idStudio04 = s.id; // Just fallback
  }

  const [seasonsRes] = await db.execute(sql`
    SELECT id FROM seasons 
    ORDER BY id DESC LIMIT 1;
  `);
  const seasonId = (seasonsRes as any[])[0]?.id || 1;

  if (idFilly) {
    const [agrFillyRes] = await db.execute(sql`
      INSERT INTO instructor_agreements
        (tenant_id, member_id, season_id, agreement_type, base_monthly_amount, spese_mensili, billing_day, payment_mode, studio_id, schedule_notes, notes, is_active)
      VALUES
      (1, ${idFilly}, ${seasonId}, 'variable_monthly', 550.00, 0, 1, 'contanti', ${idStudio22}, 'Martedì 12:00-14:00, Giovedì 12:00-14:00, Mercoledì 11:30-13:00', 'Quota variabile per mese. Base 550€/mese standard.', true);
    `);
    const fillyAgreementId = (agrFillyRes as any).insertId;
    
    await db.execute(sql`
      INSERT INTO agreement_monthly_overrides
        (agreement_id, season_id, month, override_amount, notes)
      VALUES
      (${fillyAgreementId}, ${seasonId}, 9,  300.00, 'Settembre: dal 15 al 30 settembre'),
      (${fillyAgreementId}, ${seasonId}, 12, 400.00, 'Dicembre: quota ridotta'),
      (${fillyAgreementId}, ${seasonId}, 1,  450.00, 'Gennaio: quota intermedia');
    `);
  }

  if (idYuri) {
      await db.execute(sql`
        INSERT INTO instructor_agreements
          (tenant_id, member_id, season_id, agreement_type, base_monthly_amount, spese_mensili, billing_day, payment_mode, studio_id, notes, is_active)
        VALUES
        (1, ${idYuri}, ${seasonId}, 'flat_monthly', 250.00, 20.00, 1, 'bonifico', null, 'Mensile 250€ + 20€ spese = 270€ totali.', true);
      `);
  }

  if (idMamacita) {
      await db.execute(sql`
        INSERT INTO instructor_agreements
          (tenant_id, member_id, season_id, agreement_type, base_monthly_amount, pack_hours, billing_day, payment_mode, notes, is_active)
        VALUES
        (1, ${idMamacita}, ${seasonId}, 'pack_hours', 350.00, 20, 1, 'fattura', 'Pack 20 ore gruppo = 350€ + IVA. Solo carta, bancomat o bonifico. Con fattura.', true);
      `);
  }

  console.log("\\n=== STEP 4: VERIFICA FINALE === ");
  const [v1] = await db.execute(sql`SELECT agreement_type, COUNT(*) as totale FROM instructor_agreements GROUP BY agreement_type;`);
  console.log("Totale accordi per tipo (deve essere 9):", v1);

  const [v2] = await db.execute(sql`
      SELECT 
        ia.id,
        ia.agreement_type,
        ia.base_monthly_amount,
        ia.pack_hours,
        CONCAT(m.first_name,' ',m.last_name) as maestro
      FROM instructor_agreements ia
      JOIN members m ON ia.member_id = m.id
      WHERE ia.is_active = true
      ORDER BY ia.agreement_type, maestro;
  `);
  console.log("Accordi con nome istruttore:");
  console.table(v2);

  if (idFilly) {
      const [v3] = await db.execute(sql`
        SELECT month, override_amount, notes
        FROM agreement_monthly_overrides
        WHERE agreement_id = (SELECT id FROM instructor_agreements WHERE member_id = ${idFilly} LIMIT 1)
        ORDER BY month;
      `);
      console.log("Override Filly:");
      console.table(v3);
  }

  const [v4] = await db.execute(sql`
    SELECT target_type, COUNT(*) as totale
    FROM promo_rules
    GROUP BY target_type
    ORDER BY totale DESC;
  `);
  console.log("Totale promo per tipo aggiornato:", v4);

  process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
