import { db } from "../server/db";
import { sql } from "drizzle-orm";
import fs from "fs";

async function runMigration() {
  try {
    const migrationPath = "migrations/_mc2_dossiers.sql";
    const sqlContent = fs.readFileSync(migrationPath, "utf-8");
    
    // Split by semicolons for multiple statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const stmt of statements) {
      console.log(`Executing: ${stmt.substring(0, 50).replace(/\n/g, ' ')}...`);
      await db.execute(sql.raw(stmt));
    }
    
    console.log("Migration executed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
