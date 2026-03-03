import "dotenv/config";
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function addActivityType() {
    try {
        console.log("Adding activity_type to course_quotes_grid...");
        await db.execute(sql`
        ALTER TABLE course_quotes_grid 
        ADD COLUMN activity_type VARCHAR(50) NOT NULL DEFAULT 'corsi' AFTER id
    `);
        console.log("Column added successfully.");
    } catch (err: any) {
        if (err.message && err.message.includes("Duplicate column name")) {
            console.log("Column activity_type already exists.");
        } else {
            console.error("Error adding column:", err);
        }
    }
    process.exit(0);
}

addActivityType();
