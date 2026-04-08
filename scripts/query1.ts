import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";
async function main() {
  const res = await db.execute(sql`SELECT id, name, lesson_type, category_id, instructor_id, activity_type FROM courses WHERE activity_type IS NULL AND (lesson_type != '[]' OR name LIKE '%Salsa%' OR name LIKE '%Personal%' OR name LIKE '%Privat%' OR name LIKE '%Allenamento%') LIMIT 15;`);
  console.log(JSON.stringify(res[0], null, 2));
  process.exit();
}
main().catch(console.error);
