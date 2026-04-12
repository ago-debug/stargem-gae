import { db } from './server/db';
import { sql } from 'drizzle-orm';
async function run() {
  const [res] = await db.execute(sql`DESCRIBE price_matrix`);
  console.table(res);
  process.exit(0);
}
run();
