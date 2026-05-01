import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  
  const [tables] = await connection.execute("SHOW TABLES;");
  
  console.log("=== TABELLE E CONTEGGI ===");
  for (const tRow of tables) {
    const tableName = Object.values(tRow)[0];
    const [countRes] = await connection.execute(`SELECT COUNT(*) as cnt FROM \`${tableName}\``);
    console.log(`${tableName}: ${countRes[0].cnt} records`);
  }

  await connection.end();
}
main().catch(console.error);
