import mysql from 'mysql2/promise';

async function run() {
  const c = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  
  const [tables] = await c.query('SHOW TABLES');
  const result = [];
  
  for (const row of tables) {
    const tableName = Object.values(row)[0];
    const [[{ count }]] = await c.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    const [columns] = await c.query(`SHOW COLUMNS FROM ${tableName}`);
    
    result.push({
      table: tableName,
      count: count,
      columns: columns.map(c => `${c.Field} (${c.Type})`)
    });
  }
  
  // Sort by count descending
  result.sort((a, b) => b.count - a.count);
  
  console.log(JSON.stringify(result, null, 2));
  c.end();
}

run().catch(console.error);
