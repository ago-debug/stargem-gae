import { db } from '/Users/gaetano1/SVILUPPO/StarGem_manager/server/db';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    console.log("=== STEP 1 ===");
    const [desc] = await db.execute(sql`DESCRIBE messages`);
    console.table(desc);
    
    const [tot] = await db.execute(sql`SELECT COUNT(*) as totale FROM messages`);
    console.table(tot);

    const [cols] = await db.execute(sql`
      SELECT DISTINCT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'messages' AND TABLE_SCHEMA = 'stargem_v2'
    `);
    console.table(cols);

    console.log("=== STEP 2 ===");
    const [t1] = await db.execute(sql`SHOW TABLES LIKE '%notif%'`);
    console.table(t1);
    const [t2] = await db.execute(sql`SHOW TABLES LIKE '%inbox%'`);
    console.table(t2);
    const [t3] = await db.execute(sql`SHOW TABLES LIKE '%alert%'`);
    console.table(t3);

    console.log("=== STEP 5 ===");
    const [enr] = await db.execute(sql`
      SELECT e.id, e.course_id, e.member_id, e.enrollment_type, e.status, c.name as corso, c.lesson_type 
      FROM enrollments e 
      JOIN courses c ON c.id = e.course_id 
      LIMIT 5
    `);
    console.table(enr);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
