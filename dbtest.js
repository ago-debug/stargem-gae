import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'gaetano_admin',
    password: 'Verona2026stargem2026',
    database: 'stargem_v2'
  });

  const [rows] = await connection.execute('SELECT employee_id, COUNT(*) as count FROM team_scheduled_shifts GROUP BY employee_id WITH ROLLUP;');
  console.log(rows);
  await connection.end();
}

run();
