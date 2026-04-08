import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function runQueries() {
  const res = await db.execute(sql`SELECT id, name, lesson_type, activity_type FROM courses WHERE name LIKE '%Salsa%' LIMIT 5;`);
  console.log(res[0] || res);
  process.exit(0);
}
runQueries().catch(console.error);
