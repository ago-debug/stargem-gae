import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  const users = await db.execute(sql`
    SELECT id, username, role, full_name
    FROM users
  `);
  console.log("Users:", users[0]);
  process.exit(0);
}
run();
