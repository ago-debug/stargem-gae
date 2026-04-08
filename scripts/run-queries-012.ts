import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function runQueries() {
  console.log("--- 1. Trainings ---");
  const countTrainings = await db.execute(sql`SELECT COUNT(*) as tot FROM trainings;`);
  console.log("Count:", countTrainings[0] || countTrainings);
  const sampleTrainings = await db.execute(sql`SELECT * FROM trainings LIMIT 3;`);
  console.log("Sample:", sampleTrainings[0] || sampleTrainings);

  console.log("--- 2. Individual Lessons ---");
  const countIL = await db.execute(sql`SELECT COUNT(*) as tot FROM individual_lessons;`);
  console.log("Count:", countIL[0] || countIL);
  const sampleIL = await db.execute(sql`SELECT * FROM individual_lessons LIMIT 3;`);
  console.log("Sample:", sampleIL[0] || sampleIL);

  console.log("--- 3. Courses Columns ---");
  const cols = await db.execute(sql`SHOW COLUMNS FROM courses;`);
  console.log("Columns:", cols[0] || cols);

  process.exit(0);
}

runQueries().catch(console.error);
