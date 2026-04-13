import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'gaetano_admin',
    password: 'StarGem2026!Secure',
    database: 'stargem_v2',
  });

  console.log("=== FASE B: UPDATE ===");
  await connection.execute(`
    UPDATE members
      SET participant_type = 'INSEGNANTE'
      WHERE id IN (1, 2490, 2488, 3);
  `);
  
  const [q1] = await connection.execute(`
    SELECT id, first_name, last_name, participant_type
      FROM members WHERE id IN (1, 2490, 2488, 3);
  `);
  console.table(q1);

  await connection.end();
}

run().catch(console.error);
