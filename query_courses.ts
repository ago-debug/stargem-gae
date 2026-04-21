import { db } from "./server/db";
import { courses } from "./shared/schema";

async function run() {
  const allCourses = await db.select().from(courses);
  console.log("Total courses:", allCourses.length);
  
  const courseCountBySeason = allCourses.reduce((acc, c) => {
    acc[c.seasonId] = (acc[c.seasonId] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  console.log("By season_id:", courseCountBySeason);
  
  process.exit(0);
}
run();
