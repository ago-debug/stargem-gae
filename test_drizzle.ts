import { db } from "./server/db";
import { courses } from "./shared/schema";

async function test() {
    console.log("Testing courses query...");
    const res = await db.select().from(courses).limit(1);
    console.log("Row keys:");
    console.log(Object.keys(res[0]));
    console.log("Row output:");
    console.log(res[0]);
    process.exit(0);
}

test();
