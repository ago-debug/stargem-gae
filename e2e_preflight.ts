import { db } from '/Users/gaetano1/SVILUPPO/StarGem_manager/server/db';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    const [q] = await db.execute(sql`
      SELECT id, username, email, role 
      FROM users WHERE username = 'botAI'
    `);
    console.table(q);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
