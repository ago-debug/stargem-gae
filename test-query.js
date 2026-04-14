import { db } from "./server/db.js";
import { sql } from "drizzle-orm";
async function run() {
  try {
    await db.execute(sql`SELECT dummy_column FROM users`);
  } catch (e) {
    console.log("Name:", e.name);
    console.log("Message:", e.message);
  }
  process.exit(0);
}
run();
