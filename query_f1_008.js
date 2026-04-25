import 'dotenv/config';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function run() {
  console.log("--- QUERY 1: Rimasti con punto ---");
  const res1 = await db.execute(sql`SELECT COUNT(*) as rimasti FROM courses WHERE sku LIKE '%.%';`);
  console.table(res1[0] || res1);

  console.log("\n--- QUERY 2: Esempi ---");
  const res2 = await db.execute(sql`SELECT id, sku FROM courses WHERE sku LIKE '%.%' LIMIT 20;`);
  console.table(res2[0] || res2);
  
  process.exit(0);
}
run().catch(console.error);
