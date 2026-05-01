import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

  const [res] = await connection.execute(`
    SELECT sku, count(*) as count 
    FROM courses 
    WHERE sku LIKE '%.'
    GROUP BY sku
  `);
  console.log("SKUs with dots at the end:");
  console.log(res.slice(0, 5));

  const [res2] = await connection.execute(`
    SELECT sku, count(*) as count 
    FROM courses 
    WHERE sku LIKE '%.%'
    GROUP BY sku
  `);
  console.log("\nSKUs with dots anywhere:");
  console.log(res2.slice(0, 5));

  await connection.end();
}
main().catch(console.error);
