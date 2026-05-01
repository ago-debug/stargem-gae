import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import xlsx from 'xlsx';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

  const wbB = xlsx.readFile('temp_import/estrap_20260316_estrapolazione_ISCRITTI WORKSHOP.xlsx');
  const sheetB = wbB.Sheets[wbB.SheetNames[0]];
  const dataB = xlsx.utils.sheet_to_json(sheetB);
  
  // Count how many rows per SKU in File B
  const fileBCounts = {};
  dataB.forEach(row => {
     const sku = row['SKU/codice'] ? row['SKU/codice'].trim().toUpperCase() : null;
     if (sku) {
        fileBCounts[sku] = (fileBCounts[sku] || 0) + 1;
     }
  });
  
  // Get counts from DB
  const [dbCounts] = await connection.execute(`
    SELECT c.sku, COUNT(e.id) as enrollments_count
    FROM courses c
    LEFT JOIN enrollments e ON e.course_id = c.id AND (e.status = 'active' OR e.status IS NULL)
    WHERE c.activity_type = 'workshop'
    GROUP BY c.id, c.sku
  `);
  
  const dbCountsMap = {};
  dbCounts.forEach(r => {
      if (r.sku) dbCountsMap[r.sku.trim().toUpperCase()] = r.enrollments_count;
  });
  
  console.log("=== COMPARISON (File B vs DB) ===");
  for (const sku in fileBCounts) {
     const dbCount = dbCountsMap[sku] || 0;
     const fileCount = fileBCounts[sku];
     if (dbCount !== fileCount) {
         console.log(`Mismatch for ${sku}: File B = ${fileCount}, DB = ${dbCount}`);
     } else {
         console.log(`Match for ${sku}: ${fileCount}`);
     }
  }
  
  await connection.end();
}
main().catch(console.error);
