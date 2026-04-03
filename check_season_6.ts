import { db } from "./server/db";
import { courses } from "@shared/schema";

async function main() {
  const allCourses = await db.select().from(courses);
  console.log(`Total courses: ${allCourses.length}`);
  
  const seasonCounts: any = {};
  for (const c of allCourses) {
    const sId = c.seasonId === null ? "null" : c.seasonId;
    seasonCounts[sId] = (seasonCounts[sId] || 0) + 1;
  }
  console.log("Season counts:", seasonCounts);

  const duplicateTest = allCourses.filter(c => c.name.toLowerCase().includes("heels"));
  console.log("HEELS courses:");
  console.log(duplicateTest.map(c => ({ id: c.id, name: c.name, seasonId: c.seasonId, dayOfWeek: c.dayOfWeek, startTime: c.startTime })));
  
  // terminate
  process.exit(0);
}

main().catch(console.error);
