import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  const result = await db.execute(sql`SELECT id, name, is_active FROM seasons ORDER BY id DESC LIMIT 5;`);
  console.log(JSON.stringify(result[0] || result, null, 2));
  process.exit(0);
}
main().catch(console.error);
