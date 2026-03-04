
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function fixSchema() {
    try {
        console.log("Fixing schema in production...");

        // 1. Create booking_service_categories if not exists
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS booking_service_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(20),
        active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        console.log("Ensured booking_service_categories exists.");

        // 2. Add category_id to booking_services if not exists
        const [columns]: any = await db.execute(sql`DESCRIBE booking_services`);
        const hasCategoryId = columns.some((c: any) => c.Field === 'category_id');

        if (!hasCategoryId) {
            console.log("Adding category_id to booking_services...");
            await db.execute(sql`
        ALTER TABLE booking_services 
        ADD COLUMN category_id INT NULL,
        ADD INDEX idx_booking_services_category (category_id);
      `);
            console.log("Added category_id column.");
        } else {
            console.log("booking_services already has category_id.");
        }

        console.log("Schema fix completed successfully.");
    } catch (error) {
        console.error("Error fixing schema:", error);
    } finally {
        process.exit(0);
    }
}

fixSchema();
