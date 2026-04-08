import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    const res = await db.execute(sql`
      SELECT column_default 
      FROM information_schema.columns
      WHERE table_name = 'courses' 
      AND column_name = 'active';
    `);
    console.log("SQL Results:", res[0]);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
