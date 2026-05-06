import { db } from "../server/db";
import { sql } from "drizzle-orm";
async function main() {
  const res = await db.execute(sql`SELECT COUNT(*) FROM members`);
  console.log("Count:", res[0]);
  process.exit(0);
}
main();
