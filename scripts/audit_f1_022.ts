import 'dotenv/config';
import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log("=== STEP 1 - Season NULL vs compilata ===");
  const [q1] = await connection.query(`
    SELECT
      COUNT(*) as senza_stagione,
      COUNT(CASE WHEN season IS NOT NULL
        AND season != '' THEN 1 END) as con_stagione
    FROM members WHERE active != 0 OR active IS NULL;
  `);
  console.log(JSON.stringify(q1, null, 2));

  console.log("\n=== STEP 2 - Valori season esistenti ===");
  const [q2] = await connection.query(`
    SELECT DISTINCT season, COUNT(*) as n
    FROM members
    WHERE season IS NOT NULL AND season != ''
    GROUP BY season ORDER BY n DESC LIMIT 10;
  `);
  console.log(JSON.stringify(q2, null, 2));

  await connection.end();
}

run().catch(console.error);
