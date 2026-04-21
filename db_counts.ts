import "dotenv/config";
import { db } from "./server/db";
import { courses, enrollments, strategicEvents } from "./shared/schema";
import { sql } from "drizzle-orm";

async function main() {
  const c = await db.select({ count: sql<number>`count(*)` }).from(courses);
  const e = await db.select({ count: sql<number>`count(*)` }).from(enrollments);
  const s = await db.select({ count: sql<number>`count(*)` }).from(strategicEvents);
  console.log(`Courses: ${c[0].count}`);
  console.log(`Enrollments: ${e[0].count}`);
  console.log(`Strategic Events: ${s[0].count}`);
  process.exit(0);
}
main();
