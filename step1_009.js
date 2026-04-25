import 'dotenv/config';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function run() {
  console.log("--- 1a. Corsi attivi stagione 25/26 (season_id = 1) ---");
  const res1 = await db.execute(sql`
    SELECT COUNT(*) as totale
    FROM courses 
    WHERE season_id = 1
      AND (end_date IS NULL OR end_date >= '2025-09-01');
  `);
  console.table(res1[0] || res1);

  console.log("\n--- 1b. Activity types nella stagione 25/26 ---");
  const res2 = await db.execute(sql`
    SELECT activity_type, COUNT(*) as n
    FROM courses
    WHERE season_id = 1
    GROUP BY activity_type
    ORDER BY n DESC;
  `);
  console.table(res2[0] || res2);

  console.log("\n--- 1c. Verifica esistenza colonna active_on_holidays ---");
  const res3 = await db.execute(sql`
    SELECT column_name 
    FROM information_schema.columns
    WHERE table_schema='stargem_v2' 
      AND table_name='courses'
      AND column_name='active_on_holidays';
  `);
  console.table(res3[0] || res3);
  
  process.exit(0);
}
run().catch(console.error);
