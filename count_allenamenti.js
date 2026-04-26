import { db } from './server/db.js';
import { sql } from 'drizzle-orm';
async function run() {
  const res = await db.execute(sql`SELECT count(*) as count FROM courses WHERE activity_type = 'allenamenti'`);
  console.log("Count:", res[0][0].count);
  process.exit(0);
}
run();
