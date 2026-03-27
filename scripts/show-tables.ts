import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  const [tables] = await db.execute(sql`SHOW TABLES;`);
  console.log(tables);
  process.exit(0);
}
run();
