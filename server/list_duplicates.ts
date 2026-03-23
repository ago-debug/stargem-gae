import "dotenv/config";
import { db } from "./db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    const duplicates = await db.execute(sql`
      SELECT id, name, system_name FROM custom_lists WHERE name LIKE '%cancellare%';
    `);
    console.log(JSON.stringify(duplicates[0], null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
