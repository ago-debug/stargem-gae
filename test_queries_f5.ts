import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function run() {
    try {
        console.log("=== ANOMALIE RESIDUE ===");
        const [result] = await db.execute(sql.raw(`
            SELECT id, title, event_type, start_date, end_date, season_id
            FROM strategic_events
            WHERE title LIKE '%Chiusura EstivaChiusura%'
               OR (title = 'Ferie Agosto 26' AND season_id = 1)
            ORDER BY id;
        `));
        console.log(JSON.stringify(result, null, 2));

        const [ferie] = await db.execute(sql.raw(`
            SELECT id, title, start_date, end_date, season_id 
            FROM strategic_events 
            WHERE title = 'Ferie Agosto 26';
        `));
        console.log("=== DETTAGLIO FERIE ===");
        console.log(JSON.stringify(ferie, null, 2));
    } catch(e: any) {
        console.error("ERROR:", e.message);
    }
    process.exit(0);
}
run();
