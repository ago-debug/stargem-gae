import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("=== TASK 1: Migrate campus_activities ===");

    const insRes = await db.execute(sql`
      INSERT INTO courses (name, activity_type, active)
      SELECT name, 'campus', active
      FROM campus_activities
      WHERE id IN (4, 5);
    `);
    console.log("Inserted:", (insRes as any)?.[0]?.affectedRows, "rows");

    const checkRes = await db.execute(sql`
      SELECT id, name, activity_type FROM courses
      WHERE activity_type = 'campus'
      ORDER BY created_at DESC LIMIT 5;
    `);
    console.log(JSON.stringify((checkRes as any)?.[0] || checkRes, null, 2));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}
run();
