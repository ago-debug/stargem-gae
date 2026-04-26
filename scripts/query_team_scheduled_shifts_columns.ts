import 'dotenv/config';
import { pool } from '../server/db';
async function run() {
  const [columns] = await pool.query('SHOW COLUMNS FROM team_scheduled_shifts;');
  console.log("Columns:", columns.map((c: any) => c.Field));
  
  const [shiftsDates] = await pool.query('SELECT DATE(shift_start) as shift_day, COUNT(*) as count FROM team_scheduled_shifts GROUP BY shift_day ORDER BY shift_day DESC;');
  console.log("Shifts by date:", shiftsDates);
  process.exit(0);
}
run();
