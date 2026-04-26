import 'dotenv/config';
import { pool } from '../server/db';

async function run() {
  try {
    const [res] = await pool.query("SELECT id, name, day_of_week, start_time FROM courses WHERE season_id = 1 AND active = 1 AND (day_of_week IN ('DOM','SAB','domenica','sabato') OR day_of_week LIKE '%DOM%');");
    console.table(res);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
