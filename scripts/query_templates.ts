import 'dotenv/config';
import { pool } from '../server/db';
async function run() {
  try {
    const [templatesCount] = await pool.query('SELECT COUNT(*) as total FROM team_shift_templates;');
    console.log("Total team_shift_templates:", templatesCount);
  } catch(e) {
    console.log("Error querying team_shift_templates table:", e.message);
  }
  process.exit(0);
}
run();
