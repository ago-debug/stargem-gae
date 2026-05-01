import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  const q1 = await db.execute(sql`SHOW CREATE TABLE users;`);
  console.log(q1[0][0]['Create Table']);
  const q2 = await db.execute(sql`SHOW CREATE TABLE members;`);
  console.log(q2[0][0]['Create Table']);
  process.exit(0);
}
run();
