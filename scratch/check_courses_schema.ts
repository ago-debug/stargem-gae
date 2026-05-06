import { db } from "../server/db";
import { sql } from "drizzle-orm";
async function main() {
  const res = await db.execute(sql`SHOW COLUMNS FROM courses`);
  console.log("Courses columns:", res[0]);
  process.exit(0);
}
main();
