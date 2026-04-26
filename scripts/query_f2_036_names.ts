import 'dotenv/config';
import { pool } from '../server/db';
async function run() {
  const [lists] = await pool.query('SELECT system_code, system_name FROM custom_lists WHERE system_code IN ("stato_corso", "tag_interni");');
  console.log("Lists:", lists);
  process.exit(0);
}
run();
