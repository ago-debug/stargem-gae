import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  const team = await db.execute(sql`
    SELECT id, user_id, display_name, role
    FROM team_employees
    WHERE LOWER(display_name) LIKE '%maccari%' OR LOWER(display_name) LIKE '%bruzzese%'
  `);
  console.log("Found in team_employees:", team[0]);

  process.exit(0);
}
run();
