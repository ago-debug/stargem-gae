import { pool } from "../server/db";

async function run() {
    try {
        console.log("Altering members table to change photo_url to LONGTEXT...");
        await pool.execute('ALTER TABLE `members` MODIFY COLUMN `photo_url` LONGTEXT;');
        console.log("Success: photo_url is now LONGTEXT.");
    } catch (error) {
        console.error("Error altering table:", error);
    } finally {
        process.exit(0);
    }
}

run();
