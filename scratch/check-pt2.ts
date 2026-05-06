import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  const members = await db.execute(sql`
    SELECT id, first_name, last_name, participant_type, staff_status, specialization
    FROM members
    WHERE specialization LIKE '%PT%' OR specialization LIKE '%PERSONAL%'
  `);
  console.log("PT match in specialization:", members[0]);

  process.exit(0);
}
run();
