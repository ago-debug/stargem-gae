import "dotenv/config";
import { db } from "./db";
import { courses } from "../shared/schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("--- 1. Verification with Raw SQL ---");
  try {
    const rawCount = await db.execute(sql`SELECT COUNT(*) as count FROM courses`);
    console.log("Raw count:", rawCount[0]);
    const rawData = await db.execute(sql`SELECT id, name, level, age_group FROM courses LIMIT 3`);
    console.log("Raw data sample:", rawData[0]);
  } catch (err: any) {
    console.error("Raw SQL error:", err.message);
  }

  console.log("\n--- 2. Verification with Drizzle ORM ---");
  try {
    const drizzleData = await db.select().from(courses);
    console.log("Drizzle total matched courses:", drizzleData.length);
    console.log("Drizzle data sample:", drizzleData.slice(0, 1));
  } catch (err: any) {
    console.error("Drizzle ORM error:", err.message);
  }

  process.exit(0);
}

main();
