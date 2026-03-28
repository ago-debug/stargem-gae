import { db } from "../db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Adding columns to individual_lessons...");
    await db.execute(sql`ALTER TABLE individual_lessons ADD COLUMN member_id INT;`);
    await db.execute(sql`ALTER TABLE individual_lessons ADD COLUMN target_purpose TEXT;`);
    
    // Non aggiungo la foreign key stringente come da fix 11.5 per evitare lock, l'ID basta
    
    console.log("Adding columns to trainings...");
    await db.execute(sql`ALTER TABLE trainings ADD COLUMN difficulty_level VARCHAR(100);`);
    await db.execute(sql`ALTER TABLE trainings ADD COLUMN equipment VARCHAR(255);`);
    
    console.log("Migration columns added successfully.");
    process.exit(0);
  } catch (err: any) {
    if (err.message && err.message.includes("Duplicate column name")) {
      console.log("Columns already exist, skipping.");
      process.exit(0);
    }
    console.error("Migration error:", err);
    process.exit(1);
  }
}

main();
