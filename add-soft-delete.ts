import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    await db.execute(sql`ALTER TABLE team_notes ADD COLUMN deleted_at TIMESTAMP NULL;`);
    await db.execute(sql`ALTER TABLE team_notes ADD COLUMN deleted_by VARCHAR(255) NULL;`);
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
