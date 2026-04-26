import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  const result = await db.execute(sql`SELECT id, name, system_code, system_name FROM custom_lists ORDER BY id`);
  console.log(result.rows);
  process.exit(0);
}
run();
