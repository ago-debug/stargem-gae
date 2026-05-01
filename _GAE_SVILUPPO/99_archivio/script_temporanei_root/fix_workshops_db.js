import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  
  // Fix PROVA... that are currently workshop
  await connection.execute("UPDATE courses SET activity_type = 'prova_gratuita' WHERE sku LIKE 'PROV%' AND activity_type = 'workshop'");
  
  // Fix regular courses that are mistakenly workshop
  const courseSkus = [
    '2526ALMEIDAGIO18', '2526ALMEIDAGIO19', '2526BELLAYGIO20', '2526BONNILUN21', 
    '2526GARIANOGIO18', '2526CARIZZONILUN18', '2526GALLUZZOMAR17', '2526FERGIELUN20',
    '2526ESPOSITO16NOV' // Actually 16NOV sounds like a WS
  ];
  await connection.execute(`UPDATE courses SET activity_type = 'course' WHERE sku IN ('2526ALMEIDAGIO18', '2526ALMEIDAGIO19', '2526BELLAYGIO20', '2526BONNILUN21', '2526GARIANOGIO18', '2526CARIZZONILUN18', '2526GALLUZZOMAR17', '2526FERGIELUN20') AND activity_type = 'workshop'`);

  await connection.end();
}
main().catch(console.error);
