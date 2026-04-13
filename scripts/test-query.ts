import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1', port: 3307, user: 'gaetano_admin', password: 'StarGem2026!Secure', database: 'stargem_v2',
  });
  try {
    const [rows] = await connection.execute(`
      SELECT u.email, m.id, m.first_name, m.last_name,
             m.user_id, m.participant_type
      FROM users u
      LEFT JOIN members m ON m.user_id = u.id
      WHERE u.email = 'gaechacha@gmail.com';
    `);
    console.log(rows);
  } catch(e: any) {
    console.error(e.message);
  }
  await connection.end();
}
run();
