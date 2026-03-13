import { db } from "./db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Starting DB schema update for memberships...");
  try {
    await db.execute(sql`
      ALTER TABLE memberships 
      ADD COLUMN IF NOT EXISTS renewal_type varchar(50),
      ADD COLUMN IF NOT EXISTS entity_card_number varchar(100),
      ADD COLUMN IF NOT EXISTS entity_card_expiry_date date;
    `);
    console.log("Successfully added new columns to memberships table!");
  } catch (error) {
    console.error("Error updating DB schema:", error);
  } finally {
    process.exit(0);
  }
}

main();
