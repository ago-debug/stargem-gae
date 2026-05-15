import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  const members = await db.execute(sql`
    SELECT id, first_name, last_name, participant_type, staff_status
    FROM members
    WHERE last_name LIKE '%MACCARI%' 
       OR last_name LIKE '%CATTANEO%' 
       OR last_name LIKE '%PALAMARA%'
       OR last_name LIKE '%BRUZZESE%'
       OR last_name LIKE '%NOTARO%'
       OR last_name LIKE '%PALLIKUNNEL%'
  `);
  console.log("Found members:", members[0]);

  process.exit(0);
}
run();
