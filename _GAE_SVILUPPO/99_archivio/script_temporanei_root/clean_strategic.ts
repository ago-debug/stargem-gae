import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function run() {
    try {
        const query = `
            DELETE FROM strategic_events 
            WHERE id IN (3,4,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25)
        `;
        const [result] = await db.execute(sql.raw(query));
        console.log("Deleted count:", (result as any).affectedRows);
        
        const [count] = await db.execute(sql.raw(`SELECT COUNT(*) as c FROM strategic_events`));
        console.log("Remaining count:", (count as any)[0].c);

    } catch(e: any) {
        console.error("ERROR:", e.message);
    }
    process.exit(0);
}
run();
