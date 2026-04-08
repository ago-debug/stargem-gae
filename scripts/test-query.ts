import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  const result = await db.execute(sql`SELECT 1`);
  console.log(result);
  process.exit(0);
}
main().catch(console.error);
