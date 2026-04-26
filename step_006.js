import 'dotenv/config';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function run() {
  const query = sql`
    SELECT id, sku, name, activity_type,
           (SELECT COUNT(*) FROM enrollments e
            WHERE e.course_id = courses.id) as tot_iscritti
    FROM courses
    WHERE activity_type = 'storico'
    AND sku LIKE '2526%'
    ORDER BY tot_iscritti DESC;
  `;
  const res = await db.execute(query);
  console.table(res[0] || res);
  process.exit(0);
}
run().catch(console.error);
