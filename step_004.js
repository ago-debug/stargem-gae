import 'dotenv/config';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function run() {
  const timestamp = new Date().toISOString().replace(/[:\-T]/g, '_').slice(0, 15);
  const backupTableName = `courses_backup_op4_allenamento_${timestamp}`;
  
  console.log(`--- STEP 1: Backup (Table backup) ---`);
  await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS ${backupTableName} AS SELECT * FROM courses`));
  console.log(`Backup created successfully: ${backupTableName}`);

  console.log("\n--- STEP 2: Verifica pre-update ---");
  const res2 = await db.execute(sql`
    SELECT id, sku, name, activity_type
    FROM courses
    WHERE sku = '2526ALLENAMENTO';
  `);
  console.table(res2[0] || res2);

  console.log("\n--- STEP 3: UPDATE ---");
  const res3 = await db.execute(sql`
    UPDATE courses
    SET activity_type = 'allenamenti'
    WHERE sku = '2526ALLENAMENTO';
  `);
  console.log("Update executed.");

  console.log("\n--- STEP 4: Verifica post-update ---");
  const res4 = await db.execute(sql`
    SELECT id, sku, name, activity_type
    FROM courses
    WHERE sku = '2526ALLENAMENTO';
  `);
  console.table(res4[0] || res4);

  console.log("\n--- Verifica finale iscrizioni ---");
  const resFinal = await db.execute(sql`
    SELECT COUNT(*) as tot_iscrizioni
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE c.sku = '2526ALLENAMENTO';
  `);
  console.table(resFinal[0] || resFinal);

  process.exit(0);
}
run().catch(console.error);
