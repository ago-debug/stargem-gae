import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("Creating activities_unified...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS activities_unified (
        id INT AUTO_INCREMENT PRIMARY KEY,
        legacy_source_type VARCHAR(50),
        legacy_source_id INT,
        activity_family VARCHAR(50),
        activity_type VARCHAR(50),
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        description TEXT,
        season_id INT,
        start_datetime TIMESTAMP NULL,
        end_datetime TIMESTAMP NULL,
        recurrence_type VARCHAR(50),
        instructor_id INT,
        studio_id INT,
        max_participants INT,
        base_price DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'active',
        visibility VARCHAR(50) DEFAULT 'public',
        extra_config_json JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log("Created activities_unified.");

    console.log("Creating enrollments_unified...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS enrollments_unified (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_id INT NOT NULL,
        activity_unified_id INT,
        participation_type VARCHAR(50) NOT NULL,
        target_date TIMESTAMP NULL,
        payment_status VARCHAR(50),
        notes TEXT,
        season_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log("Created enrollments_unified.");

    console.log("Shadow tables successfully created.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();
