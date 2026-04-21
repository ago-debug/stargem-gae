import { db } from "./server/db";
import { courses } from "./shared/schema";
import { gt } from "drizzle-orm";

async function main() {
    console.log("Deleting test courses...");
    await db.delete(courses).where(gt(courses.startDate, "2026-06-30" as any));
    console.log("Deleted successfully.");
    process.exit(0);
}
main().catch(console.error);
