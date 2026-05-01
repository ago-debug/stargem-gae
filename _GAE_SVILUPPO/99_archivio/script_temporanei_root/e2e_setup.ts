import { db } from '/Users/gaetano1/SVILUPPO/StarGem_manager/server/db';
import { sql } from 'drizzle-orm';
import { hashPassword } from '/Users/gaetano1/SVILUPPO/StarGem_manager/server/auth';

async function run() {
  try {
    const pw = await hashPassword('botAI123!');
    await db.execute(sql`UPDATE users SET password = ${pw} WHERE username = 'botAI'`);
    
    const [q] = await db.execute(sql`
      SELECT te.id, m.firstName, m.lastName, u.username
      FROM team_employees te
      JOIN members m ON m.id = te.member_id
      JOIN users u ON u.id = te.user_id
      WHERE u.username IN ('botAI','admin','Gaetano', 'Alexandra')
    `);
    
    console.table(q);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
