import 'dotenv/config';
import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log("=== FIX 1 - UPDATE SEASON ===");
  const [q1] = await connection.query(`
    UPDATE members
    SET season = '2025-2026'
    WHERE (season IS NULL OR season = '')
      AND (active != 0 OR active IS NULL);
  `);
  console.log(q1);
  
  const [q1Ver] = await connection.query(`SELECT COUNT(*) as con_stagione FROM members WHERE season = '2025-2026';`);
  console.log(JSON.stringify(q1Ver, null, 2));

  console.log("\n=== FIX 2 - ALTER TABLE ENROLLMENT_STATUS ===");
  const [q2] = await connection.query(`
    ALTER TABLE members
    ADD COLUMN enrollment_status ENUM('attivo','non_attivo') DEFAULT 'non_attivo' AFTER active;
  `);
  console.log(q2);

  await connection.end();
}

run().catch(console.error);
