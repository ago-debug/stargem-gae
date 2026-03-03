import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function diagnose() {
    try {
        const tables = ["workshops", "trainings", "courses", "paid_trials", "free_trials"];
        for (const table of tables) {
            console.log(`\n--- Checking ${table} table structure ---`);
            try {
                const [result]: any = await db.execute(sql.raw(`DESCRIBE ${table}`));
                console.log(JSON.stringify(result, null, 2));
            } catch (e) {
                console.log(`Table ${table} error or missing: ${e.message}`);
            }
        }
    } catch (error) {
        console.error("Diagnosis failed:", error);
    } finally {
        process.exit(0);
    }
}

diagnose();
