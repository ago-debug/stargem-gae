import { db } from '/Users/gaetano1/SVILUPPO/StarGem_manager/server/db';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    console.log("=== STEP 1 ===");
    console.log("notifications:");
    const [dNotif] = await db.execute(sql`DESCRIBE notifications`);
    console.table(dNotif);
    
    console.log("team_notifications:");
    const [dTeamNotif] = await db.execute(sql`DESCRIBE team_notifications`);
    console.table(dTeamNotif);

    const [cNotif] = await db.execute(sql`SELECT COUNT(*) as totale FROM notifications`);
    console.log("Totale notifications:", cNotif);

    const [cTeamNotif] = await db.execute(sql`SELECT COUNT(*) as totale FROM team_notifications`);
    console.log("Totale team_notifications:", cTeamNotif);

    console.log("=== STEP 2 ===");
    const [cEnr] = await db.execute(sql`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'enrollments'
        AND TABLE_SCHEMA = 'stargem_v2'
      ORDER BY ORDINAL_POSITION
    `);
    console.table(cEnr);

    console.log("=== STEP 3 ===");
    const [cMem] = await db.execute(sql`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'members'
        AND TABLE_SCHEMA = 'stargem_v2'
        AND COLUMN_NAME IN (
          'user_id','email','phone',
          'participant_type','staff_status',
          'first_name','last_name','fiscal_code'
        )
      ORDER BY ORDINAL_POSITION
    `);
    console.table(cMem);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
