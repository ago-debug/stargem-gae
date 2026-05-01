import * as XLSX from 'xlsx';

const filePath = '/Users/gaetano1/Desktop/Sviluppo_doc/file per gestionale/GemTeam/caricati/team_2025-2026_PRESENZE TEAM.xlsx';
const workbook = XLSX.readFile(filePath);

const sheetNames = workbook.SheetNames;
console.log("Fogli trovati:", sheetNames);

// The months requested: Set25, Ott25, Nov25, Dic25, Gen26, Feb26, Mar26
const targetSheets = ["Set25", "Ott25", "Nov25", "Dic25", "Gen26", "Feb26", "Mar26"];

const allValues = new Set<string>();
const employeeColumns = new Set<string>();

for (const sheetName of targetSheets) {
  if (!sheetNames.includes(sheetName)) {
    console.log(`Foglio mancante: ${sheetName}`);
    continue;
  }
  const worksheet = workbook.Sheets[sheetName];
  const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (jsonData.length < 2) continue;
  
  // The first row often contains names, or the second row. Let's find it.
  let headerRow = -1;
  for (let i=0; i<Math.min(5, jsonData.length); i++) {
     if (jsonData[i].includes('Gaetano') || jsonData[i].includes('Diego') || jsonData[i].includes('Giuditta')) {
        headerRow = i;
        break;
     }
  }

  if (headerRow === -1) {
     console.log(`Nomi non trovati nelle prime righe del foglio ${sheetName}`);
     continue;
  }

  const headers = jsonData[headerRow];
  // extract unique headers
  for (let c=0; c<headers.length; c++) {
    if (typeof headers[c] === 'string' && headers[c].trim().length > 0) {
      employeeColumns.add(headers[c].trim());
    }
  }

  let rowCount = 0;
  // Process rows after the header
  for (let r = headerRow + 1; r < jsonData.length; r++) {
    const row = jsonData[r];
    if (!row || row.length === 0) continue;
    // Assume days are rows, so a day usually has a number or date in the first few cols. Let's just collect all cell values
    let hasData = false;
    for (let c = 0; c < row.length; c++) {
      const cellValue = row[c];
      if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
         hasData = true;
         const strVal = String(cellValue).trim();
         // Check if it's a number
         if (isNaN(Number(strVal))) {
           allValues.add(strVal);
         } else {
           allValues.add("[NUMERO: " + strVal + "]");
         }
      }
    }
    if (hasData) rowCount++;
  }
  console.log(`Foglio ${sheetName}: ${rowCount} righe lette (circa giorni lavorativi/dati presenti).`);
}

console.log("\n--- Valori unici non numerici (escluse le intestazioni/giorni se testuali) ---");
const uniqueArr = Array.from(allValues).filter(v => !v.startsWith("[NUMERO:"));
console.log(uniqueArr.sort().join(', '));

console.log("\n--- Colonne (Dipendenti potenziali) trovate nei fogli ---");
console.log(Array.from(employeeColumns).sort().join(', '));
