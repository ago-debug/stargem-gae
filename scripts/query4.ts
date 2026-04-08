import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";
async function main() {
  const res = await db.execute(sql`SELECT id, name FROM categories WHERE id IN (406, 407, 409);`);
  console.log(JSON.stringify(res[0], null, 2));
  process.exit();
}
main().catch(console.error);
