import 'dotenv/config';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function run() {
  console.log("--- QUERY 1: Da aggiornare ---");
  const res1 = await db.execute(sql`SELECT COUNT(*) as totale_da_aggiornare FROM courses WHERE sku LIKE '%.%';`);
  console.table(res1[0] || res1);

  console.log("\n--- QUERY 2: Esempi ---");
  const res2 = await db.execute(sql`SELECT id, sku FROM courses WHERE sku LIKE '%.%' LIMIT 10;`);
  console.table(res2[0] || res2);

  console.log("\n--- QUERY 3: Già puliti ---");
  const res3 = await db.execute(sql`SELECT COUNT(*) as gia_puliti FROM courses WHERE sku NOT LIKE '%.%';`);
  console.table(res3[0] || res3);
  
  process.exit(0);
}
run().catch(console.error);
