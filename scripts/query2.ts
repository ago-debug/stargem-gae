import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  const [res] = await db.execute(sql`SELECT id, first_name, last_name, email FROM members LIMIT 10;`);
  console.log(res);
  process.exit(0);
}
run();
