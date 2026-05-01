import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

  const [res] = await connection.execute(`
    SELECT c.sku, COUNT(e.id) as count
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE c.sku LIKE '%2425%'
    GROUP BY c.sku
  `);
  console.log("Enrollments for 2425 SKUs:");
  console.log(res);

  const [resProv] = await connection.execute(`
    SELECT c.sku, COUNT(e.id) as count
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE c.sku LIKE 'PROV%' OR c.sku LIKE 'PRO2%' OR c.sku LIKE 'PR25%'
    GROUP BY c.sku
  `);
  console.log("\nSample of PROV enrollments:");
  console.log(resProv.slice(0, 5));
  
  await connection.end();
}
main().catch(console.error);
