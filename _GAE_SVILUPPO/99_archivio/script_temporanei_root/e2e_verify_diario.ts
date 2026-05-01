import { db } from '/Users/gaetano1/SVILUPPO/StarGem_manager/server/db';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    const [d] = await db.execute(sql`SELECT * FROM team_shift_diary_entries ORDER BY id DESC LIMIT 3`);
    console.log("Diaries Verify:");
    console.table(d);

    await db.execute(sql`DELETE FROM team_shift_diary_entries WHERE attivita_libera = 'Test E2E fix diario'`);
    console.log("Cleanup eseguito.");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
