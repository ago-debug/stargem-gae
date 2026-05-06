import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  const inst = await db.execute(sql`
    SELECT id, first_name, last_name, specialization
    FROM instructors
    WHERE specialization LIKE '%PT%' OR specialization LIKE '%Personal Trainer%'
  `);
  console.log("Instructors PT:", inst[0]);
  process.exit(0);
}
run();
