import * as dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("No DATABASE_URL");
  
  const conn = await mysql.createConnection(url);
  console.log("Connected, creating table...");
  
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS member_duplicate_exclusions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      member_id_1 INT NOT NULL,
      member_id_2 INT NOT NULL,
      excluded_by VARCHAR(255),
      excluded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_pair (member_id_1, member_id_2)
    )
  `);
  
  console.log("Done");
  await conn.end();
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
