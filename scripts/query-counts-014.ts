import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  const res = await db.execute(sql`SELECT activity_type, COUNT(*) as tot FROM courses GROUP BY activity_type;`);
  console.log(JSON.stringify(res[0], null, 2));
  process.exit();
}
main().catch(console.error);
