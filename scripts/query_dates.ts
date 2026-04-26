import 'dotenv/config';
import { pool } from '../server/db';
async function run() {
  const [shiftsDates] = await pool.query('SELECT data, COUNT(*) as count FROM team_scheduled_shifts GROUP BY data ORDER BY data DESC;');
  console.log("Shifts by date:", shiftsDates);
  process.exit(0);
}
run();
