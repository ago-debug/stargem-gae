import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("Fixing row size limit...");
    // Let's modify a bunch of varchar(255) to text to free up row size
    await db.execute(sql`ALTER TABLE members 
      MODIFY email TEXT,
      MODIFY father_email TEXT,
      MODIFY mother_email TEXT,
      MODIFY place_of_birth TEXT,
      MODIFY address TEXT,
      MODIFY document_issued_by TEXT,
      MODIFY bank_name TEXT,
      MODIFY company_name TEXT,
      MODIFY sdi_code TEXT,
      MODIFY photo_url LONGTEXT,
      MODIFY note TEXT
    `);
    console.log("Adding columns...");
    await db.execute(sql`ALTER TABLE members DROP COLUMN attachment_metadata`);
    await db.execute(sql`ALTER TABLE members DROP COLUMN photo_url`);
    await db.execute(sql`ALTER TABLE members ADD COLUMN attachments_url JSON`);
    await db.execute(sql`ALTER TABLE team_employees ADD COLUMN avatar_url VARCHAR(500)`);
    console.log("Migration completed.");
  } catch (error) {
    console.error("Migration error:", error);
  }
  process.exit(0);
}

run();
