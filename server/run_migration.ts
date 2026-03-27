import "dotenv/config";
import { db } from "./db";
import { courses } from "../shared/schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("--- Executing Strict Migration ---");
  try {
    await db.execute(sql`
      ALTER TABLE courses 
      ADD COLUMN level varchar(100),
      ADD COLUMN age_group varchar(100);
    `);
    console.log("Migration executed successfully. Columns added.");
  } catch (err: any) {
    if (err.message.includes("Duplicate column name")) {
      console.log("Columns already exist, proceeding...");
    } else {
      console.error("Migration failed:", err.message);
      process.exit(1);
    }
  }

  console.log("\n--- Verification: DESCRIBE courses ---");
  try {
    const rawSchema = await db.execute(sql`DESCRIBE courses`);
    const relevantCols = (rawSchema[0] as unknown as any[]).filter(c => c.Field === 'level' || c.Field === 'age_group');
    console.log(relevantCols);
  } catch (err: any) {
    console.error("Describe failed:", err.message);
  }

  console.log("\n--- Verification: COUNT(*) ---");
  try {
    const rawCount = await db.execute(sql`SELECT COUNT(*) as count FROM courses`);
    console.log("Count:", rawCount[0]);
  } catch (err: any) {
    console.error("Count failed:", err.message);
  }

  console.log("\n--- Verification: Drizzle Endpoint Test ---");
  try {
    const drizzleData = await db.select().from(courses);
    console.log(`Drizzle fetch via endpoint schema succeeded! Fetched ${drizzleData.length} courses.`);
  } catch (err: any) {
    console.error("Endpoint schema still failing:", err.message);
  }

  process.exit(0);
}

main();
