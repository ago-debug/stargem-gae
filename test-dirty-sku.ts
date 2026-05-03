import { db } from "./server/db";
import { courses } from "./shared/schema";
import { eq } from "drizzle-orm";

async function checkDirtySku() {
  const allCourses = await db.select().from(courses).where(eq(courses.activityType, 'course'));
  
  const dirtyCourses = allCourses.filter(c => !c.dayOfWeek || !c.startTime);
  
  console.log(`Dirty courses: ${dirtyCourses.length}`);
  
  console.log("\nDirty Courses List with SKU:");
  dirtyCourses.forEach(c => {
    console.log(`ID: ${c.id} | SKU: ${c.sku} | Name: ${c.name}`);
  });
  process.exit(0);
}

checkDirtySku().catch(console.error);
