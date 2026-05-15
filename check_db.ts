import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    const res = await db.execute(sql`SHOW TABLES LIKE 'dossiers'`);
    console.log("Tables:", res);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
main();
