import { db } from '/Users/gaetano1/SVILUPPO/StarGem_manager/server/db';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    const [q] = await db.execute(sql`
      UPDATE user_roles
      SET description = 'Operatore Team — accesso operativo base. Assegnabile a Back-Office o Front-Desk dal PM.'
      WHERE name = 'operator'
    `);
    console.log("Righe modificate:", q.affectedRows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
