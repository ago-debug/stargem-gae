import { db } from "../server/db";
import { courses } from "../shared/schema";
import { desc } from "drizzle-orm";

async function run() {
    const res = await db.select().from(courses).orderBy(desc(courses.id)).limit(5);
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
}
run();
