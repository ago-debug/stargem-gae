import 'dotenv/config';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function run() {
  console.log("--- QUERY 1: I 32 QUOTATESSERA orfani ---");
  const res1 = await db.execute(sql`
    SELECT e.id as enrollment_id,
           e.member_id,
           m.last_name, m.first_name,
           m.fiscal_code,
           e.enrollment_date,
           e.season_id
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    LEFT JOIN memberships ms ON ms.member_id = e.member_id
    JOIN members m ON m.id = e.member_id
    WHERE c.sku LIKE '%QUOTATESSERA%'
    AND c.activity_type = 'storico'
    AND ms.id IS NULL
    ORDER BY m.last_name;
  `);
  console.table(res1[0] || res1);

  console.log("\n--- QUERY 2: I 97 DTYURI/DTNELLA orfani ---");
  const res2 = await db.execute(sql`
    SELECT e.id as enrollment_id,
           e.member_id,
           m.last_name, m.first_name,
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
  console.table(res2[0] || res2);

  console.log("\n--- QUERY 3: Classificazione SKU feste/workshop ---");
  const res3 = await db.execute(sql`
    SELECT c.sku,
           COUNT(*) as totale,
           COUNT(DISTINCT e.member_id) as membri
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE c.activity_type = 'storico'
    AND c.sku NOT LIKE '%QUOTATESSERA%'
    AND c.sku NOT LIKE '%DTYURI%'
    AND c.sku NOT LIKE '%DTNELLA%'
    GROUP BY c.sku
    ORDER BY totale DESC;
  `);
  console.table(res3[0] || res3);

  console.log("\n--- QUERY 4: I 929 record season_id NULL ---");
  const res4 = await db.execute(sql`
    SELECT c.sku, c.activity_type,
           COUNT(*) as totale
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.season_id IS NULL
    GROUP BY c.sku, c.activity_type
    ORDER BY totale DESC
    LIMIT 30;
  `);
  console.table(res4[0] || res4);

  console.log("\n--- QUERY 5A: ALLENAMENTO (Sample) ---");
  const res5a = await db.execute(sql`
    SELECT e.id, e.member_id,
           m.last_name, m.first_name,
           c.sku, c.name as corso_nome,
           e.enrollment_date, e.season_id,
           e.status
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    JOIN members m ON m.id = e.member_id
    WHERE c.sku LIKE '%ALLENAMENTO%'
    AND c.activity_type = 'storico'
    LIMIT 20;
  `);
  console.table(res5a[0] || res5a);

  console.log("\n--- QUERY 5B: Corsi allenamenti attivi ---");
  const res5b = await db.execute(sql`
    SELECT COUNT(*) as tot_allenamenti_attivi,
           activity_type
    FROM courses
    WHERE activity_type = 'allenamenti'
       OR name LIKE '%llenamento%'
    GROUP BY activity_type;
  `);
  console.table(res5b[0] || res5b);

  process.exit(0);
}
run().catch(console.error);
