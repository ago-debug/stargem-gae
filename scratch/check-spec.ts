import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  const spec = await db.execute(sql`
    SELECT specialization, COUNT(*) as count
    FROM members
    GROUP BY specialization
  `);
  console.log("Specializations:", spec[0]);
  process.exit(0);
}
run();
