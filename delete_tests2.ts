import { db } from "./server/db";
import { courses } from "./shared/schema";
import { inArray } from "drizzle-orm";

async function main() {
    console.log("Deleting test courses by season ID...");
    await db.delete(courses).where(inArray(courses.seasonId, [3, 4, 5, 2]));
    console.log("Deleted successfully.");
    process.exit(0);
}
main().catch(console.error);
