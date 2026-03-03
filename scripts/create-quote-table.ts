import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
    try {
        console.log("Creating course_quotes_grid table...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS course_quotes_grid (
                id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
                activity_type varchar(50) NOT NULL DEFAULT 'corsi',
                category VARCHAR(100) NOT NULL,
                description VARCHAR(255) NOT NULL,
                details TEXT,
                corsi_week INT,
                months_data JSON NOT NULL,
                sort_order INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `);
        console.log("Table created successfully.");
    } catch (e) {
        console.error("Error creating table:", e);
    }
    process.exit(0);
}

run();
