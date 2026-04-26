import 'dotenv/config';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function run() {
  console.log("--- QUERY 1: SKU distinti con conteggio ('storico') ---");
  const res1 = await db.execute(sql`
    SELECT c.sku as course_code, c.activity_type,
           COUNT(*) as totale,
           COUNT(DISTINCT e.member_id) as membri_unici,
           MIN(e.enrollment_date) as prima_data,
           MAX(e.enrollment_date) as ultima_data
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE c.activity_type = 'storico'
    GROUP BY c.sku, c.activity_type
    ORDER BY totale DESC
    LIMIT 20;
  `);
  console.table(res1[0] || res1);

  console.log("\n--- QUERY 2: Totale record storico ---");
  const res2 = await db.execute(sql`
    SELECT COUNT(*) as tot_storico,
      SUM(CASE WHEN e.season_id IS NULL THEN 1 ELSE 0 END) as senza_stagione,
      SUM(CASE WHEN e.season_id = 1 THEN 1 ELSE 0 END) as stagione_2526
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE c.activity_type = 'storico';
  `);
  console.table(res2[0] || res2);

  console.log("\n--- QUERY 3: Verifica sovrapposizioni QUOTATESSERA con memberships ---");
  const res3 = await db.execute(sql`
    SELECT COUNT(DISTINCT e.member_id) as gia_in_memberships
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    JOIN memberships ms ON ms.member_id = e.member_id
    WHERE c.activity_type = 'storico'
    AND c.sku LIKE '%QUOTATESSERA%';
  `);
  console.table(res3[0] || res3);

  console.log("\n--- QUERY 4: Verifica sovrapposizioni DTYURI/DTNELLA con medical_certificates ---");
  const res4 = await db.execute(sql`
    SELECT COUNT(DISTINCT e.member_id) as gia_in_certs
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    JOIN medical_certificates mc ON mc.member_id = e.member_id
    WHERE c.activity_type = 'storico'
    AND (c.sku LIKE '%DTYURI%' OR c.sku LIKE '%DTNELLA%');
  `);
  console.table(res4[0] || res4);

  process.exit(0);
}
run().catch(console.error);
