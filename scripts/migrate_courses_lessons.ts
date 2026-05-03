import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";
async function run() {
  try {
    await db.execute(sql`ALTER TABLE courses ADD COLUMN calculated_lessons INT`);
    console.log("Migration successful");
  } catch (e: any) {
    console.error("Migration error:", e.message);
  }
  process.exit(0);
}
run();
