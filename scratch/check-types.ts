import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  const types = await db.execute(sql`
    SELECT participant_type, COUNT(*) as count
    FROM members
    GROUP BY participant_type
  `);
  console.log("Types in members:", types[0]);

  process.exit(0);
}
run();
