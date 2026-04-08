import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  const r1 = await db.execute(sql`SELECT course_id, member_id FROM enrollments WHERE course_id = 473;`);
  console.log("FIX D+L query:");
  console.log(r1[0]);

  const r2 = await db.execute(sql`SELECT activity_type, COUNT(*) as count FROM courses WHERE activity_type IN ('recitals','sunday_activities','vacation_studies') GROUP BY activity_type;`);
  console.log("\nFIX F query:");
  console.log(r2[0]);
  
  process.exit(0);
}
main().catch(console.error);
