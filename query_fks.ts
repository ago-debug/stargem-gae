import 'dotenv/config';
import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function main() {
  const query = sql`
    SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE REFERENCED_TABLE_NAME = 'members' AND REFERENCED_COLUMN_NAME = 'id'
      AND TABLE_SCHEMA = 'stargem_v2'
  `;
  const res = await db.execute(query);
  console.log(res[0]);
}
main().catch(console.error).finally(() => process.exit(0));
