import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import xlsx from 'xlsx';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

  const wbA = xlsx.readFile('temp_import/estrap_20260415_ElencoIscrizioni.xlsx');
  const sheetA = wbA.Sheets[wbA.SheetNames[0]];
  const dataA = xlsx.utils.sheet_to_json(sheetA, { header: "A", defval: null });
  
  const expectedEnrollments = new Set();
  for (let i = 1; i < dataA.length; i++) {
    const row = dataA[i];
    const fiscalCode = row['F'] ? row['F'].trim().toUpperCase() : null;
    const sku = row['AG'] ? row['AG'].trim().toUpperCase() : null;
    if (fiscalCode && sku) expectedEnrollments.add(`${fiscalCode}_${sku}`);
  }
  
  const [dbEnrollments] = await connection.execute(`
    SELECT e.id, m.fiscal_code, c.sku, c.activity_type, e.status
    FROM enrollments e
    JOIN members m ON e.member_id = m.id
    JOIN courses c ON e.course_id = c.id
    WHERE e.status = 'active' OR e.status IS NULL
  `);
  
  let orphansByType = {};
  
  dbEnrollments.forEach(e => {
     const fc = e.fiscal_code ? e.fiscal_code.trim().toUpperCase() : null;
     const sku = e.sku ? e.sku.trim().toUpperCase() : null;
     if (fc && sku) {
         const key = `${fc}_${sku}`;
         if (!expectedEnrollments.has(key)) {
             const type = e.activity_type || 'null';
             orphansByType[type] = (orphansByType[type] || 0) + 1;
         }
     }
  });
  
  console.log("Orphans by Activity Type:");
  console.log(orphansByType);
  
  await connection.end();
}
main().catch(console.error);
