import 'dotenv/config';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function run() {
  const timestamp = new Date().toISOString().replace(/[:\-T]/g, '_').slice(0, 15);
  const backupTableName = `courses_pre_internaltags_${timestamp}`;
  
  console.log(`[A] Backup: Creating table ${backupTableName}...`);
  await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS ${backupTableName} AS SELECT * FROM courses`));
  
  console.log("[B] ALTER TABLE: Adding internal_tags...");
  try {
    await db.execute(sql`ALTER TABLE courses ADD COLUMN internal_tags JSON DEFAULT NULL AFTER status_tags;`);
  } catch (err) {
    if (!err.message.includes("Duplicate column name")) throw err;
    console.log("Column already exists.");
  }

  console.log("\n[D] Verifica Colonna internal_tags...");
  const resCol = await db.execute(sql`
    SHOW COLUMNS FROM courses WHERE Field = 'internal_tags';
  `);
  console.table(resCol[0] || resCol);

  process.exit(0);
}
run().catch(console.error);
