import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

  // Fetch all seasons
  const [seasons] = await connection.execute(`SELECT id, name FROM seasons`);
  console.log("Seasons in DB:");
  console.log(seasons);

  // Fetch SKUs and check prefixes
  const [skuPrefixes] = await connection.execute(`
    SELECT LEFT(sku, 4) as prefix, count(*) as count 
    FROM courses 
    WHERE sku IS NOT NULL AND sku != ''
    GROUP BY prefix
    ORDER BY count DESC
  `);
  console.log("\nTop Course SKU Prefixes:");
  console.log(skuPrefixes.slice(0, 10));

  await connection.end();
}
main().catch(console.error);
