import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
    try {
        await db.execute(sql`ALTER TABLE members ADD COLUMN attachment_metadata JSON;`);
        console.log("Success: Added attachment_metadata column to members table");
    } catch (err: any) {
        if (err.message.includes("Duplicate column name")) {
            console.log("Column already exists. Skipping.");
        } else {
            console.error("Error:", err);
        }
    }
    process.exit(0);
}

run();
