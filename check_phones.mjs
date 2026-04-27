import mysql from "mysql2/promise";
async function main() {
  const connection = await mysql.createConnection("mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2");
  const [rows] = await connection.execute("SELECT id, mobile, phone FROM members WHERE mobile LIKE '=%' OR phone LIKE '=%' LIMIT 10");
  console.log(rows);
  process.exit(0);
}
main();
