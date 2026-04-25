const mysql = require('mysql2/promise');
async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'gaetano_admin',
    password: 'Verona2026stargem2026',
    database: 'stargem_v2'
  });
  const [memberships] = await connection.execute('SELECT * FROM memberships WHERE member_id = 14181');
  console.log(memberships);
  await connection.end();
}
main().catch(console.error);
