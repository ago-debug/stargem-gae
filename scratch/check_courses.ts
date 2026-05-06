import { db } from "../server/db";
import { sql } from "drizzle-orm";
async function main() {
  const res = await db.execute(sql`SELECT id, name FROM courses WHERE active = 1 LIMIT 50`);
  console.log("Corsi Attivi:", res[0]);
  process.exit(0);
}
main();
