import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Adding season_id columns...");
  
  try {
    await db.execute(sql`ALTER TABLE welfare_providers ADD COLUMN season_id int REFERENCES seasons(id) ON DELETE SET NULL;`);
    console.log("Added season_id to welfare_providers");
  } catch(e: any) {
    console.log("Skipping welfare_providers (might already exist):", e.message);
  }

  try {
    await db.execute(sql`ALTER TABLE staff_rates ADD COLUMN season_id int REFERENCES seasons(id) ON DELETE SET NULL;`);
    console.log("Added season_id to staff_rates");
  } catch(e: any) {
    console.log("Skipping staff_rates (might already exist):", e.message);
  }

  try {
    await db.execute(sql`ALTER TABLE company_agreements ADD COLUMN season_id int REFERENCES seasons(id) ON DELETE SET NULL;`);
    console.log("Added season_id to company_agreements");
  } catch(e: any) {
    console.log("Skipping company_agreements (might already exist):", e.message);
  }

  console.log("Setting default season_id to the active season for existing records...");
  try {
    await db.execute(sql`
      UPDATE welfare_providers 
      SET season_id = (SELECT id FROM seasons WHERE active = 1 LIMIT 1) 
      WHERE season_id IS NULL;
    `);
    await db.execute(sql`
      UPDATE staff_rates 
      SET season_id = (SELECT id FROM seasons WHERE active = 1 LIMIT 1) 
      WHERE season_id IS NULL;
    `);
    await db.execute(sql`
      UPDATE company_agreements 
      SET season_id = (SELECT id FROM seasons WHERE active = 1 LIMIT 1) 
      WHERE season_id IS NULL;
    `);
    console.log("Updated existing records with active season_id.");
  } catch(e: any) {
    console.error("Error setting default season_id:", e.message);
  }

  console.log("Migration completed.");
  process.exit(0);
}

main();
