import mysql from 'mysql2/promise';
async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  const [types] = await connection.execute("SELECT activity_type, COUNT(*) as count FROM courses GROUP BY activity_type;");
  console.log(types);
  
  const [prova] = await connection.execute("SELECT COUNT(*) as cnt FROM courses WHERE sku LIKE 'PROVA%';");
  console.log("Courses starting with PROVA:", prova[0].cnt);
  
  await connection.end();
}
main().catch(console.error);
