import fs from 'fs';
import { parse } from 'csv-parse/sync';

const pathMaster = '_GAE_SVILUPPO/_CLAUDE/05_allegati/22_Import_Export_dati/estrap_2026-05-04_estrapolazione_Master_Gsheet - anagrafica.csv';
const pathAthena = '_GAE_SVILUPPO/_CLAUDE/05_allegati/22_Import_Export_dati/estrap_2026-05-05_anagrafica_Athena_stagione25-26 - anagrafica25-26.csv';

function loadCSV(path: string) {
  const content = fs.readFileSync(path, 'utf8');
  return parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true });
}

function normalizeStr(str: string) {
  return (str || '').toString().trim().toUpperCase().replace(/\s+/g, ' ');
}

try {
  const masterData = loadCSV(pathMaster);
  const athenaData = loadCSV(pathAthena);

  console.log(`Master rows: ${masterData.length}`);
  console.log(`Athena rows: ${athenaData.length}`);

  // We can match by CF, or by Nome+Cognome if CF is missing
  const masterKeys = new Set();
  masterData.forEach((row: any) => {
    // Try CF first. If no CF, use Nome+Cognome
    const cf = normalizeStr(row['CODICE FISCALE'] || row['codiceFiscale'] || row['cf'] || '');
    const nome = normalizeStr(row['NOME'] || row['nome'] || '');
    const cognome = normalizeStr(row['COGNOME'] || row['cognome'] || '');
    
    if (cf) masterKeys.add(cf);
    masterKeys.add(`${nome} ${cognome}`);
  });

  const athenaExtra = [];
  athenaData.forEach((row: any) => {
    const cf = normalizeStr(row['CodiceFiscale'] || row['CODICE FISCALE'] || row['codiceFiscale'] || row['cf'] || '');
    const nome = normalizeStr(row['Nome'] || row['NOME'] || row['nome'] || '');
    const cognome = normalizeStr(row['Cognome'] || row['COGNOME'] || row['cognome'] || '');
    
    if (cf && masterKeys.has(cf)) return;
    if (masterKeys.has(`${nome} ${cognome}`)) return;
    
    athenaExtra.push(row);
  });

  console.log(`Athena Extra Records: ${athenaExtra.length}`);
  if (athenaExtra.length > 0) {
    console.log("Sample of extra records:");
    console.log(athenaExtra.slice(0, 3));
  }

  // Print columns to help with TASK 2 & 3
  console.log("\n--- Master Columns ---");
  console.log(Object.keys(masterData[0] || {}));
  console.log("\n--- Athena Columns ---");
  console.log(Object.keys(athenaData[0] || {}));
} catch(e) {
  console.error("Error reading CSV:", e.message);
}
