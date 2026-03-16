import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function addCol(query: string) {
  try {
    await db.execute(sql.raw(query));
    console.log("Success:", query);
  } catch(e) {
    if (e.message && e.message.includes("Duplicate column name")) {
      console.log("Already exists:", query.split('ADD COLUMN ')[1]?.split(' ')[0]);
    } else {
      console.error("Error for:", query, e.message);
    }
  }
}

async function run() {
  await addCol("ALTER TABLE booking_service_categories ADD COLUMN icon varchar(50)");
  await addCol("ALTER TABLE booking_service_categories ADD COLUMN sort_order int DEFAULT 0");
  await addCol("ALTER TABLE booking_service_categories ADD COLUMN active boolean DEFAULT true");
  await addCol("ALTER TABLE booking_service_categories ADD COLUMN parent_id int");
  await addCol("ALTER TABLE booking_service_categories ADD COLUMN created_at timestamp DEFAULT CURRENT_TIMESTAMP");
  await addCol("ALTER TABLE booking_service_categories ADD COLUMN updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
  
  console.log("Database patch finished.");
  process.exit(0);
}

run();
