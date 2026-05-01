import { db } from '/Users/gaetano1/SVILUPPO/StarGem_manager/server/db';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    const [c] = await db.execute(sql`SELECT * FROM team_checkin_events WHERE device = 'e2e-test-botai' LIMIT 3`);
    console.log("Check-ins:");
    console.table(c);
    
    const [d] = await db.execute(sql`SELECT * FROM team_shift_diary_entries WHERE attivita_libera = 'Test E2E diario botAI'`);
    console.log("Diaries:");
    console.table(d);
    
    const [p] = await db.execute(sql`SELECT * FROM team_leave_requests WHERE note_dipendente = 'Test E2E permesso botAI'`);
    console.log("Leaves:");
    console.table(p);

    await db.execute(sql`DELETE FROM team_checkin_events WHERE device = 'e2e-test-botai'`);
    await db.execute(sql`DELETE FROM team_shift_diary_entries WHERE attivita_libera = 'Test E2E diario botAI'`);
    await db.execute(sql`DELETE FROM team_leave_requests WHERE note_dipendente = 'Test E2E permesso botAI'`);
    await db.execute(sql`DELETE FROM team_attendance_logs WHERE note = 'Auto-inserito da Approvazione Ferie/Permessi' AND data = '2026-04-15'`);

    console.log("Cleanup executed.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
