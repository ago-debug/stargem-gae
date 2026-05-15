import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("No DATABASE_URL");
    process.exit(1);
  }
  
  const connection = await mysql.createConnection(url);
  
  const fileContent = fs.readFileSync('migrations/_f1_021b_import_lotto1.sql', 'utf-8');
  const queries = fileContent.split(';').filter(q => q.trim().length > 0);
  
  for (let q of queries) {
    try {
      await connection.query(q);
      console.log('Executed:', q.slice(0, 50));
    } catch (e: any) {
      console.error('Failed:', q.slice(0, 50), e.message);
    }
  }
  
  await connection.end();
  process.exit(0);
}
run();
