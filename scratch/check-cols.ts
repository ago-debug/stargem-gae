import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  const members = await db.execute(sql`
    SHOW COLUMNS FROM members;
  `);
  console.log(members[0]);

  process.exit(0);
}
run();
