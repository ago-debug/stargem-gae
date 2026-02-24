
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function migrate() {
    try {
        console.log("Adding instructor_id to studio_bookings...");
        await db.execute(sql`ALTER TABLE studio_bookings ADD COLUMN instructor_id INT REFERENCES instructors(id) ON DELETE SET NULL`);
        console.log("Migration completed successfully!");
    } catch (e) {
        console.error("Migration failed (it might already exist):", e);
    }
    process.exit(0);
}

migrate();
