import mysql from 'mysql2/promise';
import fs from 'fs';
import xlsx from 'xlsx';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  
  if (!fs.existsSync('dump_db')) {
    fs.mkdirSync('dump_db');
  }

  const [tables] = await connection.execute("SHOW TABLES;");
  const wb = xlsx.utils.book_new();
  
  for (const tRow of tables) {
    const tableName = Object.values(tRow)[0];
    const [rows] = await connection.execute(`SELECT * FROM \`${tableName}\``);
    
    if (rows.length > 0) {
      const sheetName = tableName.substring(0, 31);
      // Truncate fields > 32000 chars
      const safeRows = rows.map(r => {
          let newRow = {};
          for(let key in r) {
              if (typeof r[key] === 'string' && r[key].length > 32000) {
                  newRow[key] = r[key].substring(0, 32000) + '...[TRUNCATED]';
              } else {
                  newRow[key] = r[key];
              }
          }
          return newRow;
      });
      const ws = xlsx.utils.json_to_sheet(safeRows);
      xlsx.utils.book_append_sheet(wb, ws, sheetName);
      console.log(`Added sheet ${sheetName}`);
    } else {
      console.log(`Skipped ${tableName} (empty)`);
    }
  }

  xlsx.writeFile(wb, 'dump_db/Database_Completo_StarGem.xlsx');
  console.log("Excel dump created at dump_db/Database_Completo_StarGem.xlsx");
  
  await connection.end();
}
main().catch(console.error);
