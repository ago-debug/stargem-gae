import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  const members = await db.execute(sql`
    SELECT id, first_name, last_name, participant_type, staff_status
    FROM members
    WHERE LOWER(last_name) LIKE '%macca%' OR LOWER(last_name) LIKE '%cattane%'
  `);
  console.log("Found members:", members[0]);

  process.exit(0);
}
run();
