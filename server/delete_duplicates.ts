import "dotenv/config";
import { db } from "./db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    await db.execute(sql`
      DELETE FROM custom_lists WHERE name LIKE '%cancellare%';
    `);
    console.log("Successfully deleted duplicate custom lists.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
