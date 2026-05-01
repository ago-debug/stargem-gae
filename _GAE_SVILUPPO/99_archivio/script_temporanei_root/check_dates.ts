import { db } from "./server/db";
import { courses } from "./shared/schema";

async function main() {
    console.log("Checking courses dates...");
    const allCourses = await db.query.courses.findMany({ limit: 10 });
    console.log("Sample courses dates:", allCourses.map(c => ({ id: c.id, name: c.name, start: c.startDate, end: c.endDate })));
    process.exit(0);
}
main().catch(console.error);
