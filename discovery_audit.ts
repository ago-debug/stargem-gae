import { db } from '/Users/gaetano1/SVILUPPO/StarGem_manager/server/db';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    console.log("=== STEP 1 ===");
    const [t1] = await db.execute(sql`
      SELECT TABLE_NAME, TABLE_ROWS, CREATE_TIME, TABLE_COMMENT 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'stargem_v2' 
      ORDER BY TABLE_NAME
    `);
    console.table(t1);

    console.log("\n=== STEP 2 ===");
    const tables = ['messages', 'notifications', 'team_notifications', 'team_document_alerts', 'todos', 'team_notes', 'team_comments'];
    for (const t of tables) {
        let res: any;
        try {
            res = await db.execute(sql.raw(`DESCRIBE ${t}`));
            console.log(`DESCRIBE ${t}:`);
            console.table(res[0]);
        } catch (e: any) {
            console.log(`Table ${t} error: ${e.message}`);
        }
    }

    console.log("\n=== STEP 3 ===");
    try {
      const [d] = await db.execute(sql`DESCRIBE member_forms_submissions`);
      console.log(`DESCRIBE member_forms_submissions:`);
      console.table(d);
    } catch {
      console.log("Table member_forms_submissions non trovata.");
    }

    const [c] = await db.execute(sql`
      SELECT TABLE_NAME, COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'stargem_v2' 
        AND COLUMN_NAME IN ('file_url','attachment','document','upload','certificate','file_path','filename','file_name')
    `);
    console.log("Columns related to upload:");
    console.table(c);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
