import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";
import fs from "fs";

async function run() {
  const members = await db.execute(sql`
    SELECT id, first_name, last_name, participant_type, staff_status
    FROM members
  `);
  fs.writeFileSync("scratch/members-dump.json", JSON.stringify(members[0], null, 2));
  console.log("Dumped to scratch/members-dump.json. Total count:", (members[0] as any[]).length);
  process.exit(0);
}
run();
