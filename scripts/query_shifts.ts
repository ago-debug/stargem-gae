import 'dotenv/config';
import { pool } from '../server/db';
async function run() {
  console.log("=== SHIFTS ANALYSIS ===");
  try {
    const [shiftsCount] = await pool.query('SELECT COUNT(*) as total FROM shifts;');
    console.log("Total shifts currently:", shiftsCount);
    
    const [shiftsDates] = await pool.query('SELECT DATE(date) as shift_date, COUNT(*) as count FROM shifts GROUP BY DATE(date) ORDER BY shift_date DESC;');
    console.log("Shifts by date:", shiftsDates);
    
    // Check if there's any deleted flag or anything
    const [columns] = await pool.query('SHOW COLUMNS FROM shifts;');
    console.log("Shifts columns:", columns.map((c: any) => c.Field));
    
  } catch(e) {
    console.log("Error querying shifts table:", e.message);
  }
  process.exit(0);
}
run();
