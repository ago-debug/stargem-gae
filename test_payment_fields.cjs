const mysql = require('mysql2/promise');
async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'gaetano_admin',
    password: 'Verona2026stargem2026',
    database: 'stargem_v2'
  });
  const [rows] = await connection.execute('SELECT * FROM payments WHERE member_id = 14181 LIMIT 1');
  console.log(rows);
  const [members] = await connection.execute('SELECT * FROM members WHERE id = 14181');
  console.log("Member:", members[0].medical_certificate_expiry);
  await connection.end();
}
main().catch(console.error);
