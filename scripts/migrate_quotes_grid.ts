import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";
async function run() {
  try {
    await db.execute(sql`ALTER TABLE course_quotes_grid ADD COLUMN season_id INT`);
    await db.execute(sql`ALTER TABLE course_quotes_grid ADD CONSTRAINT fk_course_quotes_season FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE`);
    await db.execute(sql`UPDATE course_quotes_grid SET season_id = 1`);
    console.log("Migration successful");
  } catch (e: any) {
    console.error("Migration error:", e.message);
  }
  process.exit(0);
}
run();
