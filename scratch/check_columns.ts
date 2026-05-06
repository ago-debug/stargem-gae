import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    const res = await db.execute(sql`SHOW COLUMNS FROM members LIKE 'gsheet_chi_scrive'`);
    console.log("members columns:", res[0]);
  } catch (e: any) {
    console.log("error:", e);
  }
  process.exit(0);
}
main();
