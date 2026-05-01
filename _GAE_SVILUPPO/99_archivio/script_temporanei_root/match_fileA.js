import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import xlsx from 'xlsx';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

  const wbA = xlsx.readFile('temp_import/estrap_20260415_ElencoIscrizioni.xlsx');
  const sheetA = wbA.Sheets[wbA.SheetNames[0]];
  const dataA = xlsx.utils.sheet_to_json(sheetA, { header: "A", defval: null });
  
  // Get all SKUs from DB
  const [dbCourses] = await connection.execute(`SELECT id, name, sku FROM courses WHERE sku IS NOT NULL AND sku != ''`);
  const dbSkuMap = new Map();
  dbCourses.forEach(c => dbSkuMap.set(c.sku.trim().toUpperCase(), c));
  
  let missingSkus = new Map();
  let validRows = 0;
  
  // Start from row 1 (index 1, assuming row 0 is headers)
  for (let i = 1; i < dataA.length; i++) {
    const row = dataA[i];
    const fiscalCode = row['F']; // Cod. Fisc.
    let sku = row['AG']; // Sigla
    const corso = row['AH']; // Corso
    
    if (sku && typeof sku === 'string') {
      sku = sku.trim().toUpperCase();
      validRows++;
      if (!dbSkuMap.has(sku)) {
         if (!missingSkus.has(sku)) {
             missingSkus.set(sku, { count: 1, name: corso });
         } else {
             missingSkus.get(sku).count++;
         }
      }
    }
  }
  
  console.log(`Processed ${validRows} rows with SKU.`);
  console.log(`Found ${missingSkus.size} SKUs in Excel that DO NOT exist in the DB.`);
  
  // Sort missing SKUs by count
  const sortedMissing = [...missingSkus.entries()].sort((a,b) => b[1].count - a[1].count);
  console.log("Top missing SKUs:");
  sortedMissing.slice(0, 20).forEach(([sku, info]) => {
     console.log(`- ${sku}: ${info.count} enrollments (Corso: ${info.name})`);
  });
  
  await connection.end();
}
main().catch(console.error);
