import 'dotenv/config';
import { db } from './server/db';
import { sql } from 'drizzle-orm';
async function run() {
  try {
    const res = await db.execute(sql`
      UPDATE members 
      SET data_quality_flag = 'mancano_dati_obbligatori'
      WHERE fiscal_code IS NULL
      AND (
         (UPPER(last_name) = 'BELLONI' AND UPPER(first_name) = 'HELLEN')
         OR (UPPER(last_name) = 'BOCCHETTI MALTSEVA' AND UPPER(first_name) = 'EKATERINA')
         OR (UPPER(last_name) = 'BURANI' AND UPPER(first_name) = 'SARA')
         OR (UPPER(last_name) = 'CIONI' AND UPPER(first_name) = 'BIANCA')
         OR (UPPER(last_name) = 'GIACOSA' AND UPPER(first_name) = 'CHIARA')
         OR (UPPER(last_name) = 'GULIZIA' AND UPPER(first_name) = 'GABRIELE')
         OR (UPPER(last_name) = 'MONTANI' AND UPPER(first_name) = 'FRANCESCA')
         OR (UPPER(last_name) = 'MOUTIQ' AND UPPER(first_name) = 'JAMILIA')
      )
    `);
    console.log("Updated rows:", res[0].affectedRows);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
