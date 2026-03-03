import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    await db.execute(sql`ALTER TABLE team_notes ADD COLUMN target_url VARCHAR(255);`);
    console.log("Migration successful");
  } catch (e: any) {
    if (e.message.includes("Duplicate column name")) {
      console.log("Column already exists");
    } else {
      console.error(e);
    }
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
