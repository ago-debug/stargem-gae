import { db } from "../server/db";
import { courses } from "../shared/schema";
import { sql } from "drizzle-orm";

async function main() {
    const res = await db.execute(sql`SELECT DISTINCT category_id FROM courses`);
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
}
main();
