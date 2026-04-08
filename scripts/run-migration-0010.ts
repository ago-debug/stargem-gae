import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function runMigration() {
  console.log("🚀 Esecuzione migrazione 0010...");
  try {
    await db.execute(
      sql`ALTER TABLE \`courses\` ADD \`activity_type\` varchar(50);`
    );
    console.log("✅ Migrazione completata!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Errore:", error);
    process.exit(1);
  }
}
runMigration();
