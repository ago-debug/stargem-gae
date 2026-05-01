import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  const [cols] = await connection.execute("SHOW COLUMNS FROM members;");
  console.log(cols.map(c => c.Field).join(', '));
  await connection.end();
}
main().catch(console.error);
