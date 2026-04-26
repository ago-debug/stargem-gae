import 'dotenv/config';
import { pool } from '../server/db';
async function run() {
  console.log("=== TEAM SCHEDULED SHIFTS ANALYSIS ===");
  try {
    const [shiftsCount] = await pool.query('SELECT COUNT(*) as total FROM team_scheduled_shifts;');
    console.log("Total team_scheduled_shifts currently:", shiftsCount);
    
    const [shiftsDates] = await pool.query('SELECT DATE(shift_date) as shift_day, COUNT(*) as count FROM team_scheduled_shifts GROUP BY shift_day ORDER BY shift_day DESC;');
    console.log("Shifts by date:", shiftsDates);
    
    // look for deleted
    const [columns] = await pool.query('SHOW COLUMNS FROM team_scheduled_shifts;');
    console.log("Columns:", columns.map((c: any) => c.Field));
  } catch(e) {
    console.log("Error querying team_scheduled_shifts table:", e.message);
  }
  process.exit(0);
}
run();
