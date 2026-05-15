import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  const team = await db.execute(sql`
    SELECT *
    FROM team_employees
  `);
  console.log("Team:", team[0]);

  process.exit(0);
}
run();
