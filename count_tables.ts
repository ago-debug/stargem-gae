import 'dotenv/config';
import { db } from './server/db';
import { sql } from 'drizzle-orm';
import * as schema from './shared/schema';

async function main() {
  console.log("--- TABLE COUNTS ---");
  const tables = Object.keys(schema).filter(k => 
    typeof schema[k] === 'object' && schema[k] !== null && typeof schema[k][Symbol.for('drizzle:Name')] === 'string'
  );
  
  for (const key of tables) {
    const table = schema[key];
    try {
      const res = await db.select({ count: sql`count(*)` }).from(table);
      console.log(`${table[Symbol.for('drizzle:Name')]}: ${res[0].count}`);
    } catch (e) {
      console.log(`${table[Symbol.for('drizzle:Name')]}: ERROR (${e.message})`);
    }
  }
}
main().catch(console.error).finally(() => process.exit(0));
