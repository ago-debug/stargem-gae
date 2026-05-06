import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  const members = await db.execute(sql`
    SELECT id, first_name, last_name, participant_type, staff_status
    FROM members
    WHERE first_name LIKE '%PT%' OR last_name LIKE '%PT%'
       OR email LIKE '%PT%' OR phone LIKE '%PT%'
  `);
  console.log("PT match in name/email/phone:", members[0]);

  process.exit(0);
}
run();
