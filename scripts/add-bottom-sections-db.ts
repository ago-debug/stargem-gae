import { pool } from "../server/db";

async function run() {
    try {
        console.log("Altering members table to add bottom sections JSON columns...");

        // Allow column additions to gracefully fail if they already exist, but run them sequentially
        try {
            await pool.execute('ALTER TABLE `members` ADD COLUMN `gift_metadata` JSON;');
            console.log("Added gift_metadata.");
        } catch (e: any) {
            console.log("gift_metadata might already exist", e.message);
        }

        try {
            await pool.execute('ALTER TABLE `members` ADD COLUMN `tessere_metadata` JSON;');
            console.log("Added tessere_metadata.");
        } catch (e: any) {
            console.log("tessere_metadata might already exist", e.message);
        }

        try {
            await pool.execute('ALTER TABLE `members` ADD COLUMN `certificato_medico_metadata` JSON;');
            console.log("Added certificato_medico_metadata.");
        } catch (e: any) {
            console.log("certificato_medico_metadata might already exist", e.message);
        }

        console.log("Migration complete.");
    } catch (error) {
        console.error("Fatal error altering table:", error);
    } finally {
        process.exit(0);
    }
}

run();
