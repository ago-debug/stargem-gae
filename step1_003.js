import 'dotenv/config';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function run() {
  console.log("--- QUERY 1: I 32 QUOTATESSERA orfani ---");
  const res1 = await db.execute(sql`
    SELECT e.id as enrollment_id,
           m.id as member_id,
           m.last_name, m.first_name,
           m.fiscal_code, m.email,
           e.enrollment_date, e.season_id
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    LEFT JOIN memberships ms ON ms.member_id = e.member_id
    JOIN members m ON m.id = e.member_id
    WHERE c.sku LIKE '%QUOTATESSERA%'
    AND c.activity_type = 'storico'
    AND ms.id IS NULL
    ORDER BY m.last_name;
  `);
  console.log(JSON.stringify(res1[0] || res1, null, 2));

  console.log("\n--- QUERY 2: I 97 DTYURI/DTNELLA orfani ---");
  const res2 = await db.execute(sql`
    SELECT e.id as enrollment_id,
           m.id as member_id,
           m.last_name, m.first_name,
           m.fiscal_code,
           c.sku,
           e.enrollment_date
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    LEFT JOIN medical_certificates mc
      ON mc.member_id = e.member_id
    JOIN members m ON m.id = e.member_id
    WHERE c.activity_type = 'storico'
    AND (c.sku LIKE '%DTYURI%'
      OR c.sku LIKE '%DTNELLA%')
    AND mc.id IS NULL
    ORDER BY m.last_name;
  `);
  console.log(JSON.stringify(res2[0] || res2, null, 2));

  console.log("\n--- QUERY 3: Lista completa SKU feste/workshop ---");
  const res3 = await db.execute(sql`
    SELECT c.sku, c.name as nome_corso,
           c.activity_type,
           COUNT(e.id) as tot_iscrizioni,
           COUNT(DISTINCT e.member_id) as membri_unici,
           MIN(e.enrollment_date) as prima_data,
           MAX(e.enrollment_date) as ultima_data
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE c.activity_type = 'storico'
    AND c.sku NOT LIKE '%QUOTATESSERA%'
    AND c.sku NOT LIKE '%DTYURI%'
    AND c.sku NOT LIKE '%DTNELLA%'
    AND c.sku NOT LIKE '%ALLENAMENTO%'
    GROUP BY c.sku, c.name, c.activity_type
    ORDER BY tot_iscrizioni DESC;
  `);
  console.log(JSON.stringify(res3[0] || res3, null, 2));

  process.exit(0);
}
run().catch(console.error);
