import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function fixDb() {
    const tables = [
        "workshops",
        "paid_trials",
        "free_trials",
        "single_lessons",
        "sunday_activities",
        "trainings",
        "campus_activities",
        "recitals",
        "vacation_studies",
        "individual_lessons"
    ];

    for (const table of tables) {
        console.log(`Fixing table: ${table}`);
        try {
            // Add quote_id if missing
            await db.execute(sql.raw(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS quote_id int(11) NULL`));
            console.log(`  Added quote_id to ${table} (if it was missing)`);

            // Add season_id if missing
            await db.execute(sql.raw(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS season_id int(11) NULL`));
            console.log(`  Added season_id to ${table} (if it was missing)`);

        } catch (error) {
            console.error(`Failed to fix table ${table}:`, error.message);
        }
    }
    console.log("\nDatabase fix completed.");
    process.exit(0);
}

fixDb();
