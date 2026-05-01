import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import xlsx from 'xlsx';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

  // Load File A (All Enrollments)
  const wbA = xlsx.readFile('temp_import/estrap_20260415_ElencoIscrizioni.xlsx');
  const sheetA = wbA.Sheets[wbA.SheetNames[0]];
  const dataA = xlsx.utils.sheet_to_json(sheetA, { header: "A", defval: null });
  // Map rows: AG is SKU, AH is course name, F is member Fiscal Code (assuming)
  // Let's find out which column is Fiscal Code in File A. We need to identify members.
  // Actually, I didn't check the headers of File A fully. Let me query a few rows to see where the member identifier is.
  console.log("Headers File A:", dataA[0]);
  
  await connection.end();
}
main().catch(console.error);
