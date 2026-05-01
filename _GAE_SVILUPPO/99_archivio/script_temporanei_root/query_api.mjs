import { db, pool } from './server/db.ts';
import { courses } from './shared/schema.ts';
import { getTableColumns } from 'drizzle-orm';
import { config } from 'dotenv';
import mysql from 'mysql2/promise';

config();

async function run() {
  const p = mysql.createPool(process.env.DATABASE_URL);
  const [res] = await p.query('SELECT id, category_id, name FROM courses LIMIT 1');
  console.log(res);
  process.exit(0);
}
run();
