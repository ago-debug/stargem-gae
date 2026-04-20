import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function r(query: string) {
    try {
        console.log(`\n=== QUERY: ${query.substring(0, 80)}... === `);
        const [result] = await db.execute(sql.raw(query));
        console.log(JSON.stringify(result, null, 2));
    } catch(e) {
        console.error("ERROR:", e.message);
    }
}

async function run() {
    await r("SHOW COLUMNS FROM courses");
    await r("SHOW COLUMNS FROM activities");
    await r("SELECT COUNT(*) FROM courses");
    await r("SELECT COUNT(*) FROM activities");
    await r("SELECT * FROM activities LIMIT 3");
    await r("SELECT * FROM courses LIMIT 3");

    await r(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'stargem_v2' AND (table_name LIKE '%programm%' OR table_name LIKE '%chiusur%' OR table_name LIKE '%festivi%' OR table_name LIKE '%exception%' OR table_name LIKE '%closure%' OR table_name LIKE '%date_config%')`);
    await r("SHOW COLUMNS FROM strategic_events");
    await r("SELECT * FROM strategic_events LIMIT 5");

    await r(`SELECT id, title, name, description, created_at FROM strategic_events WHERE LOWER(title) LIKE '%prova%' OR LOWER(title) LIKE '%test%' OR LOWER(title) LIKE '%fitness%' OR LOWER(name) LIKE '%prova%'`);
    await r(`SELECT id, name, title, created_at FROM activities WHERE LOWER(name) LIKE '%prova%' OR LOWER(name) LIKE '%test%' LIMIT 10`);
    await r(`SELECT title, COUNT(*) as n FROM strategic_events GROUP BY title HAVING n > 1`);

    await r(`SELECT participant_type, COUNT(*) as n FROM members GROUP BY participant_type`);
    await r(`SELECT id, first_name, last_name, role, team as department, is_active FROM team_employees ORDER BY id`); // NOTE: 'department' is probably 'team'
    await r(`SELECT id, first_name, last_name, role, email FROM users ORDER BY id`);

    process.exit(0);
}
run();
