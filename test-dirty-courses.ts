import { db } from "./server/db";
import { courses } from "./shared/schema";
import { eq, isNull } from "drizzle-orm";

async function checkDirtyCourses() {
  const allCourses = await db.select().from(courses).where(eq(courses.activityType, 'course'));
  const dirtyCourses = allCourses.filter(c => !c.dayOfWeek || !c.startTime);
  console.log(`Dirty courses: ${dirtyCourses.length}`);
  process.exit(0);
}

checkDirtyCourses().catch(console.error);
