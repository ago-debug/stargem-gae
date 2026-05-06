import { db } from "../server/db";
import { sql } from "drizzle-orm";
async function main() {
  const res = await db.execute(sql`SELECT sku FROM courses WHERE active = 1 AND sku IS NOT NULL LIMIT 20`);
  console.log("DB SKUs:", res[0]);
  process.exit(0);
}
main();
