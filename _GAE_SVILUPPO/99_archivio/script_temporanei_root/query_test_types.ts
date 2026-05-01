import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function main() {
  const res = await db.execute(sql`
    SELECT c.activity_type, COUNT(e.id) as iscritti 
    FROM enrollments e 
    JOIN courses c ON e.course_id = c.id 
    WHERE c.season_id = 1 
    GROUP BY c.activity_type;
  `);
  console.log(JSON.stringify(res[0], null, 2));
  process.exit(0);
}
main();
