import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  
  // Update PR... to prova_gratuita (but only if it's currently storico to avoid messing up actual courses)
  const [res1] = await connection.execute(`
    UPDATE courses 
    SET activity_type = 'prova_gratuita' 
    WHERE sku LIKE 'PR25%' AND activity_type = 'storico'
  `);
  console.log("Updated PR to prova_gratuita:", res1.affectedRows);
  
  const [storico] = await connection.execute("SELECT sku, name FROM courses WHERE activity_type = 'storico'");
  console.log("Remaining storico:", storico);

  await connection.end();
}
main().catch(console.error);
