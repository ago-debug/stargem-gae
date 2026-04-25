const mysql = require('mysql2/promise');
async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'gaetano_admin',
    password: 'Verona2026stargem2026',
    database: 'stargem_v2'
  });
  const [members] = await connection.execute('SELECT * FROM members WHERE last_name LIKE "%Cifarelli%"');
  console.log(members);
  await connection.end();
}
main().catch(console.error);
