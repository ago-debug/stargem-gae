import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";
async function main() {
  const res = await db.execute(sql`SELECT category_id, COUNT(*) as tot FROM courses WHERE activity_type IS NULL GROUP BY category_id ORDER BY tot DESC LIMIT 10;`);
  console.log(JSON.stringify(res[0], null, 2));
  process.exit();
}
main().catch(console.error);
