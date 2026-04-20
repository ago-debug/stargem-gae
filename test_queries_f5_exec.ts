import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function run() {
    try {
        console.log("=== EXECUTING DELETES ===");
        await db.execute(sql.raw(`DELETE FROM strategic_events WHERE id IN (2, 6)`));

        console.log("=== FINAL VERIFICATION ===");
        const [result] = await db.execute(sql.raw(`
            SELECT id, title, event_type, start_date, end_date, season_id
            FROM strategic_events ORDER BY season_id, start_date;
        `));
        console.log(JSON.stringify(result, null, 2));
    } catch(e: any) {
        console.error("ERROR:", e.message);
    }
    process.exit(0);
}
run();
