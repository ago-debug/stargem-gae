import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    const [result] = await db.execute(sql`DESCRIBE booking_service_categories`);
    console.log("Columns:", result);
    process.exit(0);
  } catch (err) {
    console.error("DB Error:", err);
    process.exit(1);
  }
}

run();
