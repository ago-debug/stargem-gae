import { db } from './server/db';
import { enrollments, courses } from './shared/schema';

async function run() {
  const data = await db.select().from(enrollments);
  const cData = await db.select().from(courses);
  console.log("Enrollments:", data.slice(0, 2)); // Show just first two
  console.log("Total Enrollments:", data.length);
  console.log("Total Courses:", cData.length);
  process.exit(0);
}
run();
