import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Adding CRM columns to members table...");
    await db.execute(sql`ALTER TABLE members ADD COLUMN crm_profile_level VARCHAR(20)`);
    await db.execute(sql`ALTER TABLE members ADD COLUMN crm_profile_score INT DEFAULT 0`);
    await db.execute(sql`ALTER TABLE members ADD COLUMN crm_profile_override BOOLEAN DEFAULT FALSE`);
    await db.execute(sql`ALTER TABLE members ADD COLUMN crm_profile_reason VARCHAR(255)`);
    console.log("Successfully added CRM columns to members.");
  } catch (err: any) {
    console.error("Error modifying table (they might already exist):");
    console.error(err.message);
  }
  process.exit(0);
}

main();
