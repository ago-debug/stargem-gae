import "dotenv/config";
import { db } from "./db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Starting DB schema update for courses...");
  try {
    await db.execute(sql`
      ALTER TABLE courses 
      ADD COLUMN IF NOT EXISTS level varchar(100),
      ADD COLUMN IF NOT EXISTS age_group varchar(100);
    `);
    console.log("Successfully added new columns to courses table!");
  } catch (error) {
    console.error("Error updating DB schema:", error);
  } finally {
    process.exit(0);
  }
}

main();
