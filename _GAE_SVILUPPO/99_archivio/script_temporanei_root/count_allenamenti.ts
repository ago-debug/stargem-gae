import 'dotenv/config';
import { db } from './server/db';
import { sql } from 'drizzle-orm';
async function run() {
  try {
    const res = await db.execute(sql`SELECT count(*) as count FROM courses WHERE activity_type = 'allenamenti'`);
    console.log("Count:", res[0][0].count);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
