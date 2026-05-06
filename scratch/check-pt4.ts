import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  const members = await db.execute(sql`
    SELECT id, first_name, last_name, participant_type, staff_status
    FROM members
    WHERE LOWER(first_name) LIKE '%pt%' OR LOWER(last_name) LIKE '%pt%'
  `);
  console.log("Names with pt:", members[0]);

  process.exit(0);
}
run();
