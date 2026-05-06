import { db } from "../server/db";
import { sql } from "drizzle-orm";
async function main() {
  const res = await db.execute(sql`SELECT id, name, sku FROM courses WHERE name = 'Acrobatica' OR name = 'Pilates' OR name = 'Total Body'`);
  console.log("Matched Courses by Name:", res[0]);
  process.exit(0);
}
main();
