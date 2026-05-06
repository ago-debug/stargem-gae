import { db } from "../server/db";
import { sql } from "drizzle-orm";
async function main() {
  const res = await db.execute(sql`SELECT id, name, season_id FROM courses WHERE active = 1 LIMIT 5`);
  console.log("Active Courses:", res[0]);
  process.exit(0);
}
main();
