import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Adding parent_id column to team_comments table...");
    try {
        await db.execute(sql`
      ALTER TABLE team_comments 
      ADD COLUMN parent_id INT DEFAULT NULL AFTER assigned_to;
    `);
        console.log("Successfully added parent_id column.");
    } catch (error: any) {
        if (error.message && error.message.includes("Duplicate column name")) {
            console.log("Column parent_id already exists. Skipping.");
        } else {
            console.error("Error modifying table:", error);
        }
    }
    process.exit(0);
}

main();
