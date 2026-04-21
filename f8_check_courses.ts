import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function run() {
    try {
        const [types] = await db.execute(sql.raw(`SELECT DISTINCT activity_type FROM courses`));
        console.log("Distinct Activity Types in COURSES:");
        console.log(types);
    } catch(err) {
        console.error(err);
    }
    process.exit(0);
}
run();
