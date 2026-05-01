import { db } from "./server/db";
import { courses } from "./shared/schema";

async function main() {
    const allCourses = await db.query.courses.findMany();
    const julyCourses = allCourses.filter((c: any) => c.endDate && new Date(c.endDate) > new Date("2026-06-30T23:59:59.000Z"));
    console.log("Courses ending AFTER June 30:", julyCourses.map((c: any) => ({ id: c.id, name: c.name, start: c.startDate, end: c.endDate })));
    process.exit(0);
}
main().catch(console.error);
