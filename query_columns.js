import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  const [rows] = await connection.query('SHOW COLUMNS FROM team_attendance_logs');
  console.log(rows);
  await connection.end();
}

main().catch(console.error);
