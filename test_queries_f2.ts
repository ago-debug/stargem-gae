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
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("PARTE A");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await r(`SELECT id, title, event_type, start_date, end_date, affects_calendar, affects_planning, created_at FROM strategic_events ORDER BY id`);
    await r(`SELECT id, title, event_type FROM strategic_events WHERE title IN ('acs','dsaad','Ferie Demo','Prova Fitness','Prova Tabella','test','Test Zod Drizzle') ORDER BY title, id`);
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("PARTE B");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await r(`SHOW COLUMNS FROM activities`);
    await r(`SELECT COUNT(*) as totale FROM activities`);
    await r(`SELECT activity_type, COUNT(*) as n FROM activities GROUP BY activity_type ORDER BY n DESC`);
    // 'category' may not exist but we will attempt:
    await r(`SELECT category_id, COUNT(*) as n FROM activities GROUP BY category_id ORDER BY n DESC`); 
    await r(`SELECT * FROM activities ORDER BY id ASC LIMIT 5`);
    await r(`SELECT * FROM activities ORDER BY id DESC LIMIT 5`);
    await r(`SELECT MIN(created_at) as primo_record, MAX(created_at) as ultimo_record, COUNT(*) as totale FROM activities`);
    
    await r(`
      SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = 'stargem_v2' AND (TABLE_NAME = 'activities' OR REFERENCED_TABLE_NAME = 'activities')
    `);
    
    await r(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'stargem_v2' AND table_name LIKE '%activit%'
    `);

    process.exit(0);
}
run();
