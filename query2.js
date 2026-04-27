import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  const [rows] = await connection.execute("SHOW COLUMNS FROM custom_lists;");
  console.log("Columns of custom_lists:");
  console.log(rows);
  const [rows2] = await connection.execute("SELECT * FROM custom_lists LIMIT 5;");
  console.log("Samples:");
  console.log(rows2);
  await connection.end();
}
main().catch(console.error);
