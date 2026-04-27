import mysql from "mysql2/promise";
async function main() {
  const connection = await mysql.createConnection("mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2");
  const [rows] = await connection.execute("SELECT m.first_name, m.last_name, m.gender, e.course_id FROM members m JOIN enrollments e ON m.id = e.member_id WHERE m.gender = 'M' LIMIT 5");
  console.log(rows);
  process.exit(0);
}
main();
