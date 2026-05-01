import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  const [res] = await connection.execute("SELECT c.sku, e.season_id, COUNT(*) as cnt FROM enrollments e JOIN courses c ON e.course_id = c.id GROUP BY c.sku, e.season_id ORDER BY cnt DESC LIMIT 10;");
  console.log(res);
  await connection.end();
}
main().catch(console.error);
