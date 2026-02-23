import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function syncSchema() {
    console.log("Adding missing columns to 'studios' table...");
    try {
        await db.execute(sql.raw(`ALTER TABLE studios ADD COLUMN google_calendar_id VARCHAR(255)`));
        console.log("Success: Added google_calendar_id to studios");
    } catch (e: any) {
        console.log("Skipped/Error studios:", e.message);
    }

    // Also ensure our new JSON fields in schema.ts are compatible with TEXT in DB 
    // (In MySQL/MariaDB, JSON is often an alias for LONGTEXT or similar, but TEXT works fine for Drizzle JSON-core if we handle serialization).
    // Actually MariaDB 11+ supports JSON type properly.

    console.log("\nSchema sync completed.");
    process.exit(0);
}

syncSchema();
