import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  const [cols] = await db.execute(sql`SHOW COLUMNS FROM members`);
  console.log(cols.map((c: any) => c.Field).join(', '));
  process.exit(0);
}
run();
