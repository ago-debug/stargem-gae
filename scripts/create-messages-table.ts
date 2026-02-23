
import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Creating messages table...");
    try {
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id VARCHAR(50) NOT NULL,
        receiver_id VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log("Messages table created/verified.");
    } catch (error) {
        console.error("Error creating messages table:", error);
        process.exit(1);
    }
    process.exit(0);
}

main();
