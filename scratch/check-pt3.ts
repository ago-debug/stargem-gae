import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  const members = await db.execute(sql`
    SELECT id, first_name, last_name, participant_type, qualifications, corsi, specialization
    FROM members
    WHERE participant_type = 'INSEGNANTE'
    LIMIT 10
  `);
  console.log("Insegnanti sample:", members[0]);

  process.exit(0);
}
run();
