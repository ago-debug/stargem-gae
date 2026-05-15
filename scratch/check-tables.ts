import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  const tables = await db.execute(sql`
    SHOW TABLES;
  `);
  console.log("Tables:", tables[0]);

  process.exit(0);
}
run();
