import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function run() {
    try {
        const [e] = await db.execute(sql.raw(`SELECT COUNT(*) as c FROM enrollments`));
        console.log("enrollments count:", e);
        
        const [ue] = await db.execute(sql.raw(`SELECT COUNT(*) as c FROM universal_enrollments`));
        console.log("universal_enrollments count:", ue);

        const [m] = await db.execute(sql.raw(`SELECT COUNT(*) as c FROM members`));
        console.log("members count:", m);

        const [ms] = await db.execute(sql.raw(`SELECT COUNT(*) as c FROM memberships`));
        console.log("memberships count:", ms);

    } catch(err) {
        console.error(err);
    }
    process.exit(0);
}
run();
