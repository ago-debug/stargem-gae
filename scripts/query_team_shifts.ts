import 'dotenv/config';
import { pool } from '../server/db';
async function run() {
  console.log("=== TEAM SHIFTS ANALYSIS ===");
  try {
    const [shiftsCount] = await pool.query('SELECT COUNT(*) as total FROM team_shifts;');
    console.log("Total team_shifts currently:", shiftsCount);
    
    const [shiftsDates] = await pool.query('SELECT DATE(shift_start) as shift_date, COUNT(*) as count FROM team_shifts GROUP BY DATE(shift_start) ORDER BY shift_date DESC;');
    console.log("Shifts by date:", shiftsDates);
    
    // check if there's an is_deleted column or something similar
    const [columns] = await pool.query('SHOW COLUMNS FROM team_shifts;');
    console.log("Columns:", columns.map((c: any) => c.Field));
    
    // check team_shift_templates
    const [templatesCount] = await pool.query('SELECT COUNT(*) as total FROM team_shift_templates;');
    console.log("Total team_shift_templates:", templatesCount);
  } catch(e) {
    console.log("Error querying team_shifts table:", e.message);
  }
  process.exit(0);
}
run();
