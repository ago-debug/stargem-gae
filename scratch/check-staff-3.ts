import 'dotenv/config';
import { db } from "../server/db";
import * as schema from "../shared/schema";
import { sql } from "drizzle-orm";

async function run() {
  const q = await db.execute(sql`
    SELECT id, first_name, last_name, participant_type, active, staff_status
    FROM members
    WHERE id = 1
  `);
  console.log(q[0]);
  process.exit(0);
}
run();
