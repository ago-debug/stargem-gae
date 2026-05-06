import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  const members = await db.execute(sql`
    SELECT id, first_name, last_name, participant_type, staff_status
    FROM members
    WHERE LOWER(participant_type) LIKE '%personal%'
       OR LOWER(staff_status) LIKE '%personal%'
  `);
  console.log("Any personal in DB:", members[0]);

  process.exit(0);
}
run();
