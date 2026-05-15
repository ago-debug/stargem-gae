import 'dotenv/config';
import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function main() {
  const tables = ['members', 'memberships', 'enrollments', 'payments', 'courses'];
  for (const t of tables) {
    try {
       console.log(`\n--- INDEXES per ${t} ---`);
       const res = await db.execute(sql`SHOW INDEXES FROM ${sql.identifier(t)}`);
       res[0].forEach(r => console.log(`- ${r.Key_name} (${r.Column_name})`));
    } catch (e) {
       console.log(`Errore su ${t}: ${e.message}`);
    }
  }
}
main().catch(console.error).finally(() => process.exit(0));
