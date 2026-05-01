import { db } from '/Users/gaetano1/SVILUPPO/StarGem_manager/server/db';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    const [q] = await db.execute(sql`
      UPDATE users
      SET email_verified = 1
      WHERE email LIKE '%@studio-gem.it'
    `);
    console.log("Righe modificate:", q.affectedRows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
