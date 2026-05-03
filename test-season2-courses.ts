import { db } from "./server/db";
import { courses } from "./shared/schema";
import { eq } from "drizzle-orm";

async function checkSeason2() {
  const season2Courses = await db.select().from(courses).where(eq(courses.seasonId, 2));
  
  console.log(`Total courses in Season 2: ${season2Courses.length}`);
  
  if (season2Courses.length > 0) {
    console.log("\nCourses in Season 2 (2026-2027):");
    season2Courses.forEach(c => {
      console.log(`ID: ${c.id} | Name: ${c.name} | Day: ${c.dayOfWeek} | Time: ${c.startTime}`);
    });
  }
  process.exit(0);
}

checkSeason2().catch(console.error);
