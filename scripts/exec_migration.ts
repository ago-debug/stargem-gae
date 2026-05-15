import { db } from "../server/db";
import { sql } from "drizzle-orm";
import fs from 'fs';

async function run() {
  const fileContent = fs.readFileSync('migrations/_f1_021b_import_lotto1.sql', 'utf-8');
  const queries = fileContent.split(';').filter(q => q.trim().length > 0);
  for (let q of queries) {
    try {
      await db.execute(sql.raw(q));
      console.log('Executed:', q.slice(0, 50));
    } catch (e: any) {
      console.error('Failed:', q.slice(0, 50), e.message);
    }
  }
  process.exit(0);
}
run();
