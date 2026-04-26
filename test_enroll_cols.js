import 'dotenv/config';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function run() {
  const query = sql`SHOW COLUMNS FROM enrollments`;
  const res = await db.execute(query);
  console.table(res[0] || res);
  process.exit(0);
}
run().catch(console.error);
