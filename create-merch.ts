import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS merchandising_categories (
        id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name varchar(255) NOT NULL,
        description text,
        color varchar(50),
        sort_order int DEFAULT 0,
        active tinyint(1) DEFAULT 1,
        parent_id int,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    await db.execute(sql.raw(query));
    console.log("Merchandising categories table created successfully.");
    process.exit(0);
  } catch (err) {
    console.error("DB Error:", err);
    process.exit(1);
  }
}

run();
