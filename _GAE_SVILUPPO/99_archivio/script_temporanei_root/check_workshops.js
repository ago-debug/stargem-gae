import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  const [res] = await connection.execute("SELECT id, sku, name FROM courses WHERE activity_type = 'workshop'");
  console.log("Workshops in DB:", res);
  await connection.end();
}
main().catch(console.error);
