import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import { pool } from '../server/db';

async function run() {
  try {
    const [counts] = await pool.query(`
      SELECT cl.system_code as code, COUNT(cli.id) as totale
      FROM custom_lists cl
      JOIN custom_list_items cli ON cli.list_id = cl.id
      WHERE cl.system_code IN (
        'generi_corsi','livello','fascia_eta',
        'posti_disponibili','numero_persone',
        'stato_corso','tag_interni'
      )
      GROUP BY cl.system_code ORDER BY totale DESC;
    `);
    console.table(counts);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

run();
