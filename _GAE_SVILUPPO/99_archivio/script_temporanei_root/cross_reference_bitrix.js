import mysql from 'mysql2/promise';
import xlsx from 'xlsx';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

  // Load DB Courses
  const [dbCourses] = await connection.execute(`SELECT id, sku FROM courses WHERE sku IS NOT NULL AND sku != ''`);
  const courseBySku = new Map();
  dbCourses.forEach(c => {
      courseBySku.set(c.sku.trim().toUpperCase(), c.id);
  });

  // Load Bitrix File
  const wb = xlsx.readFile('temp_import/estrap_20260417_estrapolazione_Master_per_importazione_Bitrix.xlsx');
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  const headerRow = data[0];
  const colIscrizioniIdx = headerRow.indexOf('codici_corso_iscrizioni');
  const colProveIdx = headerRow.indexOf('codici_corso_prove_e_lezioni');

  let matchedCourses = 0;
  let unmatchedCourses = 0;
  const unmatchedSkus = new Set();
  let totalExtracted = 0;

  for (let i = 1; i < data.length; i++) {
      const iscr = data[i][colIscrizioniIdx];
      const prov = data[i][colProveIdx];
      
      const allSkus = [];
      if (iscr && typeof iscr === 'string') {
          allSkus.push(...iscr.split(',').map(s => s.trim()).filter(s => s.length > 0));
      }
      if (prov && typeof prov === 'string') {
          allSkus.push(...prov.split(',').map(s => s.trim()).filter(s => s.length > 0));
      }

      for (let rawSku of allSkus) {
          totalExtracted++;
          // Remove the dot and whatever follows it (e.g. .F, .D, .A)
          let cleanSku = rawSku.toUpperCase();
          if (cleanSku.includes('.')) {
              cleanSku = cleanSku.split('.')[0];
          }

          if (courseBySku.has(cleanSku)) {
              matchedCourses++;
          } else {
              unmatchedCourses++;
              unmatchedSkus.add(rawSku + " -> " + cleanSku);
          }
      }
  }

  console.log("=== BITRIX MASTER FILE CROSS-REFERENCE ===");
  console.log(`Total SKUs extracted (Iscrizioni + Prove): ${totalExtracted}`);
  console.log(`Successfully matched with DB Courses: ${matchedCourses}`);
  console.log(`Unmatched SKUs: ${unmatchedCourses}`);
  
  if (unmatchedSkus.size > 0) {
      console.log("\nSample of Unmatched SKUs:");
      console.log(Array.from(unmatchedSkus).slice(0, 10));
  }

  await connection.end();
}
main().catch(console.error);
