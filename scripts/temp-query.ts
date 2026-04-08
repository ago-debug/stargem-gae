import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  const res = await db.execute(sql`
    SELECT id, name, activity_type, sku
    FROM courses
    WHERE activity_type IN ('recitals','sunday_activities','vacation_studies');
  `);
  // mysql2 execute returns [rows, fields]
  console.log(JSON.stringify(res[0], null, 2));
  process.exit(0);
}
main().catch(console.error);
