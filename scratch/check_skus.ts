import { db } from "../server/db";
import { sql } from "drizzle-orm";
async function main() {
  const res = await db.execute(sql`SELECT id, name, sku FROM courses WHERE sku LIKE '2526FELLERMER21%' OR sku LIKE '2526PUGGIONILUN20%'`);
  console.log("Matched Courses:", res[0]);
  process.exit(0);
}
main();
