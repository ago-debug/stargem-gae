import { db } from "../db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Creating strategic_events table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS strategic_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_type VARCHAR(100) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        all_day BOOLEAN DEFAULT TRUE,
        season_id INT,
        status VARCHAR(50) DEFAULT 'active',
        affects_calendar BOOLEAN DEFAULT TRUE,
        affects_planning BOOLEAN DEFAULT TRUE,
        affects_payments BOOLEAN DEFAULT FALSE,
        studio_id INT,
        color VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    console.log("Strategic events table created successfully.");
    process.exit(0);
  } catch (err: any) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

main();
