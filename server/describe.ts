import "dotenv/config";
import { db } from "./db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    const rawCount = await db.execute(sql`DESCRIBE courses`);
    console.log("Columns:", rawCount[0]);
  } catch (err: any) {
    console.error("Raw SQL error:", err.message);
  }
  process.exit(0);
}
main();
