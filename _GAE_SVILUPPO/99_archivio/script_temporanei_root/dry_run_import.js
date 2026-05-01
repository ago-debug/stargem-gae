import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import xlsx from 'xlsx';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

  // Load files
  console.log("Reading files...");
  const wbA = xlsx.readFile('temp_import/estrap_20260415_ElencoIscrizioni.xlsx');
  const dataIscrizioni = xlsx.utils.sheet_to_json(wbA.Sheets[wbA.SheetNames[0]], { header: "A", defval: null });
  
  const wbB = xlsx.readFile('temp_import/estrap_20260316_estrapolazione_ISCRITTI WORKSHOP.xlsx');
  const dataWS = xlsx.utils.sheet_to_json(wbB.Sheets[wbB.SheetNames[0]]);

  // --- ANALYSIS 1: MISSING SKUs ---
  // Extract all unique SKUs from ElencoIscrizioni (AG)
  const skuMap = new Map(); // SKU -> Set of Names
  let noSkuCount = 0;
  
  for (let i = 1; i < dataIscrizioni.length; i++) {
     let sku = dataIscrizioni[i]['AG'];
     let name = dataIscrizioni[i]['AH'];
     if (!sku || String(sku).trim() === '') {
        noSkuCount++;
     } else {
        sku = String(sku).trim().toUpperCase();
        if (!skuMap.has(sku)) skuMap.set(sku, new Set());
        if (name) skuMap.get(sku).add(String(name).trim());
     }
  }
  
  // From WS file
  dataWS.forEach(row => {
     let sku = row['SKU/codice'];
     let name = row['ws'];
     if (sku) {
        sku = String(sku).trim().toUpperCase();
        if (!skuMap.has(sku)) skuMap.set(sku, new Set());
        if (name) skuMap.get(sku).add(String(name).trim());
     }
  });

  // Check against DB
  const [dbCourses] = await connection.execute(`SELECT sku, name FROM courses WHERE sku IS NOT NULL AND sku != ''`);
  const dbSkus = new Set(dbCourses.map(c => c.sku.trim().toUpperCase()));
  
  let newSkus = [];
  let knownSkus = [];
  for (const [sku, names] of skuMap.entries()) {
     if (dbSkus.has(sku)) {
        knownSkus.push(sku);
     } else {
        newSkus.push({ sku, names: Array.from(names).join(' | ') });
     }
  }

  // --- ANALYSIS 2: MISSING IDENTITY ---
  let noIdentityCount = 0;
  let matchedByName = 0;
  let matchedByFC = 0;
  
  for (let i = 1; i < dataIscrizioni.length; i++) {
     let fc = dataIscrizioni[i]['F'];
     let cognome = dataIscrizioni[i]['D'];
     let nome = dataIscrizioni[i]['E'];
     
     if (fc && String(fc).trim() !== '') {
        matchedByFC++;
     } else if (cognome && nome && String(cognome).trim() !== '' && String(nome).trim() !== '') {
        matchedByName++;
     } else {
        noIdentityCount++;
     }
  }

  console.log("=== DRY RUN ANALYSIS ===");
  console.log(`Total Enrollments Analyzed: ${dataIscrizioni.length - 1}`);
  console.log(`Records with NO SKU: ${noSkuCount}`);
  console.log(`Unique SKUs found: ${skuMap.size} (${knownSkus.length} known in DB, ${newSkus.length} new/unknown)`);
  console.log(`\nRecords matched by Fiscal Code: ${matchedByFC}`);
  console.log(`Records matched by Name+Surname: ${matchedByName}`);
  console.log(`Records with NO Identity (will be skipped): ${noIdentityCount}`);
  
  if (newSkus.length > 0) {
     console.log("\n--- UNKNOWN SKUS TO BE CREATED ---");
     newSkus.slice(0, 15).forEach(s => console.log(`SKU: ${s.sku} => Names: ${s.names}`));
     if (newSkus.length > 15) console.log(`...and ${newSkus.length - 15} more.`);
  }

  await connection.end();
}
main().catch(console.error);
