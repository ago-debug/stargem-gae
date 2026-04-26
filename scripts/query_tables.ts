import 'dotenv/config';
import { pool } from '../server/db';
async function run() {
  const [tables] = await pool.query('SHOW TABLES;');
  console.log("Tables:", tables.map((t: any) => Object.values(t)[0]));
  process.exit(0);
}
run();
