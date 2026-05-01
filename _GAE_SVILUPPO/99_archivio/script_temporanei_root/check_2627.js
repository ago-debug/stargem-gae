import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

  const [res] = await connection.execute(`
    SELECT c.sku, COUNT(e.id) as count
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE c.sku LIKE '%2627%' OR c.sku LIKE '%2324%'
    GROUP BY c.sku
  `);
  console.log("Enrollments for other SKUs:");
  console.log(res);

  await connection.end();
}
main().catch(console.error);
