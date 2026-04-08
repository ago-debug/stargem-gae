import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    const res = await db.execute(sql`
      SELECT DISTINCT category_id FROM courses
      WHERE category_id IS NOT NULL
      ORDER BY category_id LIMIT 20;
    `);
    console.log("Distinct category IDs in courses:");
    console.log(JSON.stringify((res as any)?.[0] || res, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}
run();
