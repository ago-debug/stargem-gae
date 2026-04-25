import 'dotenv/config';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function run() {
  console.log("--- STEP 1: Verifica esistenza colonna internal_tags ---");
  const res = await db.execute(sql`
    SELECT column_name 
    FROM information_schema.columns
    WHERE table_schema='stargem_v2' 
      AND table_name='courses'
      AND column_name='internal_tags';
  `);
  console.table(res[0] || res);
  process.exit(0);
}
run().catch(console.error);
