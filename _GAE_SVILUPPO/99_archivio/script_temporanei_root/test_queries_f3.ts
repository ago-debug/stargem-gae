import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function r(query: string) {
    try {
        console.log(`\n=== QUERY: ${query.substring(0, 80).replace(/\n/g, ' ')}... === `);
        const [result] = await db.execute(sql.raw(query));
        console.log(JSON.stringify(result, null, 2));
    } catch(e: any) {
        console.error("ERROR:", e.message);
    }
}

async function run() {
    await r(`SELECT id, title, event_type, start_date, end_date, affects_calendar, affects_planning FROM strategic_events ORDER BY start_date`);
    await r(`SELECT id, name, start_date, end_date FROM seasons ORDER BY id`);
    await r(`SHOW COLUMNS FROM strategic_events`);
    process.exit(0);
}
run();
