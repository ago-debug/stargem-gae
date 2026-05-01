import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  
  // Update PROVA... to prova_gratuita
  const [res1] = await connection.execute(`
    UPDATE courses 
    SET activity_type = 'prova_gratuita' 
    WHERE sku LIKE 'PROVA%'
  `);
  console.log("Updated PROVA to prova_gratuita:", res1.affectedRows);
  
  // Let's check remaining 'storico'
  const [storico] = await connection.execute("SELECT sku, name FROM courses WHERE activity_type = 'storico'");
  console.log("Remaining storico:", storico.slice(0, 5));
  
  // What about QUOTA TESSERA?
  const [res2] = await connection.execute(`
    UPDATE courses 
    SET activity_type = 'membership' 
    WHERE sku LIKE '%QUOTATESSERA%'
  `);
  console.log("Updated QUOTATESSERA to membership:", res2.affectedRows);

  // Let's check dashboard totals again
  console.log("\n=== ENROLLMENTS BY ACTIVITY TYPE (Season 1) ===");
  const [activities] = await connection.execute(`
    SELECT c.activity_type, COUNT(e.id) as count
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.season_id = 1
    GROUP BY c.activity_type
    ORDER BY count DESC
  `);
  console.log(activities);
  
  await connection.end();
}
main().catch(console.error);
