import 'dotenv/config';
import { pool } from '../server/db';
async function run() {
  const [res] = await pool.query('SELECT id, name, system_code FROM custom_lists ORDER BY id;');
  console.table(res);
  process.exit(0);
}
run();
