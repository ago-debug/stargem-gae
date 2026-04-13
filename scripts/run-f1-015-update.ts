import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1', port: 3307, user: 'gaetano_admin', password: 'StarGem2026!Secure', database: 'stargem_v2',
  });
  try {
    await connection.execute(`
      UPDATE users 
      SET email = 'gaechacha@gmail.com',
          username = 'gaechacha@gmail.com'
      WHERE id = 'faaf36de-3d6c-429c-92ae-d2e38dccb715';
    `);

    await connection.execute(`
      UPDATE members 
      SET email = 'gaechacha@gmail.com'
      WHERE id = 9555;
    `);

    const [users] = await connection.execute(`
      SELECT id, email, username, otp_token 
      FROM users 
      WHERE id = 'faaf36de-3d6c-429c-92ae-d2e38dccb715';
    `);
    console.log("=== UPDATE VERIFICATION ===");
    console.log(users);

  } catch(e: any) {
    console.error(e.message);
  }
  await connection.end();
}
run();
