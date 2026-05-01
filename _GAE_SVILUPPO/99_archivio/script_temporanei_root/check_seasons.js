import mysql from 'mysql2/promise';
async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  const [seasons] = await connection.execute("SELECT id, name, active FROM seasons;");
  console.log(seasons);
  await connection.end();
}
main().catch(console.error);
