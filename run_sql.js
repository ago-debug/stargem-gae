import 'dotenv/config';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function run() {
  const timestamp = new Date().toISOString().replace(/[:\-T]/g, '_').slice(0, 15);
  const backupTableName = `courses_pre_sku_${timestamp}`;
  
  console.log(`Creating backup table: ${backupTableName}...`);
  await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS ${backupTableName} AS SELECT * FROM courses`));
  
  console.log("Updating courses table to remove .X from sku...");
  await db.execute(sql`UPDATE courses SET sku = SUBSTRING_INDEX(sku, '.', 1) WHERE sku LIKE '%.%';`);
  
  console.log("Verifying post-update...");
  const res1 = await db.execute(sql`SELECT COUNT(*) as rimasti_con_punto FROM courses WHERE sku LIKE '%.%';`);
  console.table(res1[0] || res1);
  
  const res2 = await db.execute(sql`SELECT id, sku FROM courses ORDER BY id DESC LIMIT 10;`);
  console.table(res2[0] || res2);

  console.log("Altering table to add total_occurrences...");
  await db.execute(sql`ALTER TABLE courses ADD COLUMN total_occurrences INT NULL DEFAULT NULL AFTER end_date;`);

  const res3 = await db.execute(sql`SHOW COLUMNS FROM courses WHERE Field = 'total_occurrences';`);
  console.table(res3[0] || res3);

  process.exit(0);
}
run().catch(console.error);
