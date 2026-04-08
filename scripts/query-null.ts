import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";
async function main() {
  const res = await db.execute(sql`SELECT id, name, lesson_type FROM courses WHERE activity_type IS NULL AND category_id IS NULL LIMIT 20;`);
  console.log(JSON.stringify(res[0], null, 2));
  process.exit();
}
main().catch(console.error);
