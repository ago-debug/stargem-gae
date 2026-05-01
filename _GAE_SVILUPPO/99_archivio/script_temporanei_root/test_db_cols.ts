import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function run() {
  const result = await db.execute(sql`DESCRIBE team_notifications;`);
  console.log(result[0]);
  process.exit(0);
}
run();
