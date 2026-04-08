import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    const res = await db.execute(sql`
      SELECT e.id, e.member_id, m.first_name, m.last_name
      FROM enrollments e
      JOIN members m ON m.id = e.member_id
      WHERE e.course_id = 441
      LIMIT 5;
    `);
    console.log("SQL Results:", res[0]);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
