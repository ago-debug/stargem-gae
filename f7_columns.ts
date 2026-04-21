import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function run() {
    try {
        const [u] = await db.execute(sql.raw(`SHOW COLUMNS FROM universal_enrollments`));
        console.log("=== COLUMNS universal_enrollments ===", u);

        const [u_data] = await db.execute(sql.raw(`SELECT * FROM universal_enrollments LIMIT 1`));
        console.log("=== DATA universal_enrollments ===", JSON.stringify(u_data));

        const [e] = await db.execute(sql.raw(`SHOW COLUMNS FROM enrollments`));
        console.log("=== COLUMNS enrollments ===", e);

        const [e_data] = await db.execute(sql.raw(`SELECT * FROM enrollments LIMIT 1`));
        console.log("=== DATA enrollments ===", JSON.stringify(e_data));

    } catch(e: any) {
        console.error("ERROR:", e.message);
    }
    process.exit(0);
}
run();
