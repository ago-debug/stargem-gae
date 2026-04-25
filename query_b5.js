import 'dotenv/config';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function run() {
  console.log("SHOW COLUMNS FROM courses;");
  const res1 = await db.execute(sql`SHOW COLUMNS FROM courses`);
  console.table(res1[0] || res1);

  console.log("\ninformation_schema.columns:");
  const res2 = await db.execute(sql`
SELECT column_name FROM information_schema.columns
WHERE table_schema='stargem_v2' 
  AND table_name='courses'
  AND (column_name LIKE '%occurr%' 
   OR column_name LIKE '%count%'
   OR column_name LIKE '%repeat%'
   OR column_name LIKE '%settiman%');
  `);
  console.table(res2[0] || res2);
  process.exit(0);
}
run().catch(console.error);
