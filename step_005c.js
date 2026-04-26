import 'dotenv/config';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function run() {
  console.log("\nINIZIO TRANSAZIONE...");
  
  try {
    await db.transaction(async (tx) => {
      // OP1
      const q1 = await tx.execute(sql`
        SELECT m.id as member_id, e.enrollment_date 
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        LEFT JOIN memberships ms ON ms.member_id = e.member_id
        JOIN members m ON m.id = e.member_id
        WHERE c.sku LIKE '%QUOTATESSERA%'
        AND c.activity_type = 'storico'
        AND ms.id IS NULL
        AND m.fiscal_code IS NOT NULL;
      `);
      const members1 = q1[0];

      const qMax = await tx.execute(sql`
        SELECT MAX(CAST(SUBSTRING(membership_number, 6) AS UNSIGNED)) as max_num 
        FROM memberships 
        WHERE season_id = 1 AND membership_number LIKE '2526-%';
      `);
      let currentMax = qMax[0][0].max_num || 0;

      let insertedOp1 = 0;
      for (const row of members1) {
        currentMax++;
        const mNum = '2526-' + String(currentMax).padStart(6, '0');
        await tx.execute(sql`
          INSERT INTO memberships (member_id, membership_number, barcode, season_id, status, membership_type, issue_date, expiry_date, notes, data_quality_flag)
          VALUES (${row.member_id}, ${mNum}, ${mNum}, 1, 'active', 'ENDAS', ${row.enrollment_date}, '2026-08-31 00:00:00', 'importato da bonifica storico Chat22b', 'da_verificare');
        `);
        insertedOp1++;
      }
      console.log(`OP1 (Tessere): Inserite ${insertedOp1} righe.`);

      // OP2
      const q2 = await tx.execute(sql`
        SELECT e.member_id, e.enrollment_date
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        LEFT JOIN medical_certificates mc ON mc.member_id = e.member_id
        JOIN members m ON m.id = e.member_id
        WHERE c.activity_type = 'storico'
        AND (c.sku LIKE '%DTYURI%' OR c.sku LIKE '%DTNELLA%')
        AND mc.id IS NULL;
      `);
      const members2 = q2[0];

      let insertedOp2 = 0;
      for (const row of members2) {
        await tx.execute(sql`
          INSERT INTO medical_certificates (member_id, issue_date, expiry_date, status, notes, data_quality_flag)
          VALUES (
            ${row.member_id}, 
            ${row.enrollment_date}, 
            DATE_ADD(${row.enrollment_date}, INTERVAL 1 YEAR), 
            'valid', 
            'importato da bonifica storico Chat22b — DTYURI/DTNELLA — verificare con segreteria',
            'da_verificare'
          );
        `);
        insertedOp2++;
      }
      console.log(`OP2 (Medici): Inserite ${insertedOp2} righe.`);

      // OP3
      const resOp3 = await tx.execute(sql`
        UPDATE enrollments SET season_id = 1
        WHERE season_id IS NULL
        AND course_id IN (
          SELECT id FROM courses
          WHERE sku LIKE 'PR2526%'
          OR sku LIKE 'PROVA2526%'
          OR sku LIKE 'PRO2526%'
          OR sku LIKE 'PROV2526%'
        );
      `);
      console.log(`OP3 (Prove Season): Aggiornate ${resOp3[0].affectedRows} righe.`);

      // OP5
      const resOp5_ws = await tx.execute(sql`
        UPDATE courses SET activity_type = 'workshop'
        WHERE activity_type = 'storico'
        AND (sku LIKE '%WS%'
          OR sku LIKE '%BANANA%'
          OR sku LIKE '%TIMOR%'
          OR sku LIKE '%KUMO%'
          OR sku LIKE '%EMANUELLO%'
          OR sku LIKE '%ESPOSITO%'
          OR sku LIKE '%UNDIAENCUBA%'
          OR sku LIKE '%ANAHITA%'
          OR sku LIKE '%DEANGELIS%'
          OR sku LIKE '%LULU%'
          OR sku LIKE '%CAVALIERE%'
          OR sku LIKE '%AMBER%'
          OR sku LIKE '%ALMEIDAGIO%'
          OR sku LIKE '%FERGIELUN%'
          OR sku LIKE '%NEREA%'
          OR sku LIKE '%LELI%'
          OR sku LIKE '%NATALE%')
        AND sku NOT LIKE '%QUOTATESSERA%'
        AND sku NOT LIKE '%DTYURI%'
        AND sku NOT LIKE '%DTNELLA%';
      `);
      console.log(`OP5 (Workshop): Aggiornate ${resOp5_ws[0].affectedRows} righe.`);

      const resOp5_corso = await tx.execute(sql`
        UPDATE courses SET activity_type = 'corso'
        WHERE activity_type = 'storico'
        AND (sku LIKE '%OPEN%' OR sku LIKE '%CUGGEGIO%');
      `);
      console.log(`OP5 (Corso): Aggiornate ${resOp5_corso[0].affectedRows} righe.`);

      const resOp5_lez = await tx.execute(sql`
        UPDATE courses SET activity_type = 'lezione_individuale'
        WHERE activity_type = 'storico'
        AND sku LIKE '%LEZINDIVIDUALE%';
      `);
      console.log(`OP5 (Lezione Individuale): Aggiornate ${resOp5_lez[0].affectedRows} righe.`);

      const resOp5_camp = await tx.execute(sql`
        UPDATE courses SET activity_type = 'campus'
        WHERE activity_type = 'storico'
        AND sku LIKE '%CAMPUS%';
      `);
      console.log(`OP5 (Campus): Aggiornate ${resOp5_camp[0].affectedRows} righe.`);

      const resOp5_gift = await tx.execute(sql`
        UPDATE courses SET activity_type = 'buono_regalo'
        WHERE activity_type = 'storico'
        AND sku LIKE '%GIFT%';
      `);
      console.log(`OP5 (Gift): Aggiornate ${resOp5_gift[0].affectedRows} righe.`);
    });
    console.log("TRANSAZIONE COMPLETATA CON SUCCESSO.");

  } catch (err) {
    console.error("ERRORE DURANTE LA TRANSAZIONE:", err);
    process.exit(1);
  }

  const finalCheck = await db.execute(sql`
    SELECT activity_type, COUNT(*) as tot
    FROM courses
    WHERE sku LIKE '2526%'
    GROUP BY activity_type
    ORDER BY tot DESC;
  `);
  console.log("\n--- Verifica finale ---");
  console.table(finalCheck[0] || finalCheck);

  process.exit(0);
}
run().catch(console.error);
