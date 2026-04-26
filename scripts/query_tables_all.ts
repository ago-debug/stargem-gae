import 'dotenv/config';
import { pool } from '../server/db';
async function run() {
  const [tables] = await pool.query('SHOW TABLES;');
  const tableNames = tables.map((t: any) => Object.values(t)[0]);
  console.log("All tables containing 'team':", tableNames.filter((t: string) => t.includes('team')));
  console.log("All tables containing 'backup':", tableNames.filter((t: string) => t.includes('backup')));
  console.log("All tables containing 'shift':", tableNames.filter((t: string) => t.includes('shift')));
  process.exit(0);
}
run();
