import { db } from './server/db';
import { sql } from 'drizzle-orm';
async function test() {
  const [result]: any = await db.execute(sql`
    SELECT i.first_name, i.last_name, m.id as member_id, i.id as instr_id
    FROM instructors i
    INNER JOIN members m ON LOWER(m.first_name) = LOWER(i.first_name) AND LOWER(m.last_name) = LOWER(i.last_name)
  `);
  console.log("Found matches between members and instructors:", result);
  process.exit(0);
}
test();
