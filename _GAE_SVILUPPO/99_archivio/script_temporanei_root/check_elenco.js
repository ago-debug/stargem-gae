import mysql from 'mysql2/promise';
import xlsx from 'xlsx';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

  const [dbCourses] = await connection.execute(`SELECT id, sku, activity_type FROM courses WHERE sku IS NOT NULL AND sku != ''`);
  const courseBySku = new Map();
  dbCourses.forEach(c => courseBySku.set(c.sku.trim().toUpperCase(), c));

  const wbA = xlsx.readFile('temp_import/estrap_20260415_ElencoIscrizioni.xlsx');
  const sheetA = wbA.Sheets[wbA.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheetA, { header: "A", defval: null });

  const activityCounts = {};

  for (let i = 1; i < data.length; i++) {
      let sku = data[i]['AG'] ? String(data[i]['AG']).trim().toUpperCase() : null;
      if (sku && courseBySku.has(sku)) {
          const type = courseBySku.get(sku).activity_type;
          activityCounts[type] = (activityCounts[type] || 0) + 1;
      }
  }

  console.log("Activity distribution in ElencoIscrizioni.xlsx:");
  console.log(activityCounts);
  
  await connection.end();
}
main().catch(console.error);
