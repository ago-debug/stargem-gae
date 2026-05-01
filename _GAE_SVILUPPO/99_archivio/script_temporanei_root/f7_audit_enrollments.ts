import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function run() {
    try {
        console.log("=== SHOW TABLES ===");
        const [tables] = await db.execute(sql.raw(`SHOW TABLES LIKE '%enrollment%'`));
        console.log(tables);
    } catch(e: any) {
        console.error("ERROR:", e.message);
    }
    process.exit(0);
}
run();
