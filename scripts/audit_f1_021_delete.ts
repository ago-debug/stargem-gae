import 'dotenv/config';
import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log("=== CANCELLAZIONE ===");
  const [qDel] = await connection.query(`
    DELETE FROM members
    WHERE id IN (5133, 6154, 7177);
  `);
  console.log(qDel);

  console.log("\n=== VERIFICA 1 ===");
  const [q1] = await connection.query(`
    SELECT COUNT(*) as rimanenti FROM members
    WHERE id IN (5133, 6154, 7177);
  `);
  console.log(JSON.stringify(q1, null, 2));

  console.log("\n=== VERIFICA 2 (TOTALE ATTIVI) ===");
  const [q2] = await connection.query(`
    SELECT COUNT(*) as totale_attivi
    FROM members WHERE active != 0 OR active IS NULL;
  `);
  console.log(JSON.stringify(q2, null, 2));

  await connection.end();
}

run().catch(console.error);
