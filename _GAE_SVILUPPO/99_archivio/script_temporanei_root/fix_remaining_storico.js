import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  
  await connection.execute(`UPDATE courses SET activity_type = 'prova_gratuita' WHERE sku LIKE 'PROV25%' AND activity_type = 'storico'`);
  await connection.execute(`UPDATE courses SET activity_type = 'prova_gratuita' WHERE sku LIKE 'PRO25%' AND activity_type = 'storico'`);
  await connection.execute(`UPDATE courses SET activity_type = 'lezione_individuale' WHERE sku LIKE '%DT%' AND activity_type = 'storico'`);
  
  const [activities] = await connection.execute(`
    SELECT c.activity_type, COUNT(e.id) as count
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.season_id = 1
    GROUP BY c.activity_type
    ORDER BY count DESC
  `);
  console.log("FINAL DASHBOARD TOTALS:", activities);

  await connection.end();
}
main().catch(console.error);
