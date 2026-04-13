import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1', port: 3307, user: 'gaetano_admin', password: 'StarGem2026!Secure', database: 'stargem_v2',
  });
  try {
    const [users] = await connection.execute(`
      SELECT id, email, username, role,
             email_verified, otp_token, otp_expires_at
      FROM users
      WHERE email LIKE '%gaechacha%'
         OR username LIKE '%gaechacha%'
         OR email LIKE '%cavallo%';
    `);
    console.log("=== USERS ===");
    console.log(users);

    const [members] = await connection.execute(`
      SELECT id, first_name, last_name, email,
             user_id, participant_type
      FROM members
      WHERE email LIKE '%gaechacha%'
         OR first_name LIKE '%CAVALLO%'
         OR last_name LIKE '%PAZZO%';
    `);
    console.log("\n=== MEMBERS ===");
    console.log(members);
  } catch(e: any) {
    console.error(e.message);
  }
  await connection.end();
}
run();
