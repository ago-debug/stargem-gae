import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  
  const [res] = await connection.execute(`
    SELECT sku, name, activity_type FROM courses 
    WHERE sku IN ('2526BONNILUN21', 'PROV2526ALMEIDAGIO18', '2526AMBER-ALDRINISMA')
  `);
  console.log(res);

  await connection.end();
}
main().catch(console.error);
