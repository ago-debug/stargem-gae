import 'dotenv/config';
import { db } from './server/db';
import { sql } from 'drizzle-orm';
async function run() {
  try {
    const res = await db.execute(sql`
      SELECT id, first_name, last_name, fiscal_code
      FROM members 
      WHERE UPPER(last_name) IN ('BELLONI', 'BOCCHETTI MALTSEVA', 'BURANI', 'CIONI', 'GIACOSA', 'GULIZIA', 'MONTANI', 'MOUTIQ')
    `);
    console.log("Members:", res[0]);
    const columns = await db.execute(sql`SHOW COLUMNS FROM members LIKE 'data_quality_flag'`);
    console.log("Has data_quality_flag?", columns[0].length > 0);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
