import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import xlsx from 'xlsx';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

  const wbA = xlsx.readFile('temp_import/estrap_20260415_ElencoIscrizioni.xlsx');
  const sheetA = wbA.Sheets[wbA.SheetNames[0]];
  const dataA = xlsx.utils.sheet_to_json(sheetA, { header: "A", defval: null });
  
  // Extract File A expected enrollments
  // Key: "FISCALCODE_SKU"
  const expectedEnrollments = new Set();
  
  for (let i = 1; i < dataA.length; i++) {
    const row = dataA[i];
    const fiscalCode = row['F'] ? row['F'].trim().toUpperCase() : null;
    const sku = row['AG'] ? row['AG'].trim().toUpperCase() : null;
    
    if (fiscalCode && sku) {
       expectedEnrollments.add(`${fiscalCode}_${sku}`);
    }
  }
  
  // Get all DB enrollments
  const [dbEnrollments] = await connection.execute(`
    SELECT e.id, m.fiscal_code, c.sku
    FROM enrollments e
    JOIN members m ON e.member_id = m.id
    JOIN courses c ON e.course_id = c.id
    WHERE e.status = 'active' OR e.status IS NULL
  `);
  
  let validDbEnrolls = 0;
  let matches = 0;
  let orphans = 0;
  
  const dbEnrollmentSet = new Set();
  
  dbEnrollments.forEach(e => {
     const fc = e.fiscal_code ? e.fiscal_code.trim().toUpperCase() : null;
     const sku = e.sku ? e.sku.trim().toUpperCase() : null;
     if (fc && sku) {
         validDbEnrolls++;
         const key = `${fc}_${sku}`;
         dbEnrollmentSet.add(key);
         if (expectedEnrollments.has(key)) {
             matches++;
         } else {
             orphans++;
         }
     }
  });
  
  console.log(`Expected enrollments from File A: ${expectedEnrollments.size}`);
  console.log(`Valid DB enrollments (with FC and SKU): ${validDbEnrolls}`);
  console.log(`Matches found: ${matches}`);
  console.log(`DB Enrollments NOT in File A (Orphans): ${orphans}`);
  
  // Check how many from File A are missing in DB
  let missing = 0;
  expectedEnrollments.forEach(key => {
     if (!dbEnrollmentSet.has(key)) missing++;
  });
  console.log(`File A Enrollments MISSING in DB: ${missing}`);
  
  await connection.end();
}
main().catch(console.error);
