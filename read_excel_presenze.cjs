const XLSX = require('xlsx');

const filePath = '/Users/gaetano1/Desktop/Sviluppo_doc/file per gestionale/GemTeam/caricati/team_2025-2026_PRESENZE TEAM.xlsx';
const workbook = XLSX.readFile(filePath, { cellDates: true }); // cellDates will parse them to JS Dates

const targetSheets = ["Settembre25", "Ottobre25", "Novembre25", "Dicembre25", "Gennaio26", "Febbraio26", "Marzo26"];

const allValues = new Set();
const employeeColumns = new Set();
const rowsPerMonth = {};

for (const sheetName of targetSheets) {
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    console.log(`Foglio mancante: ${sheetName}`);
    continue;
  }
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (jsonData.length < 2) continue;
  
  // Find header row (row 0 or 1 usually)
  let headerRow = -1;
  for (let i=0; i<Math.min(5, jsonData.length); i++) {
     const rowStr = JSON.stringify(jsonData[i]);
     if (rowStr.includes('GAETANO') || rowStr.includes('GIUDITTA') || rowStr.includes('ESTEFANY')) {
        headerRow = i;
        break;
     }
  }

  if (headerRow === -1) {
     console.log(`Nomi non trovati nelle prime righe del foglio ${sheetName}`);
     continue;
  }

  const headers = jsonData[headerRow];
  for (let c=0; c<headers.length; c++) {
    if (typeof headers[c] === 'string' && headers[c].trim().length > 0) {
      employeeColumns.add(headers[c].trim().toUpperCase());
    }
  }

  let rowCount = 0;
  for (let r = headerRow + 1; r < jsonData.length; r++) {
    const row = jsonData[r];
    if (!row || row.length === 0) continue;
    
    let isDayRow = false;
    // If the first cell is a Date object or resembles an excel date number
    const firstCell = row[0];
    if (firstCell instanceof Date) {
        isDayRow = true;
    } else if (typeof firstCell === 'number' && firstCell > 40000) {
        isDayRow = true;
    }

    if (isDayRow) {
      rowCount++;
      for (let c = 1; c < row.length; c++) {
        const headerCell = headers[c];
        if (typeof headerCell === 'string' && headerCell.trim().length > 0) {
            const cellValue = row[c];
            if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
               const strVal = String(cellValue).trim();
               if (isNaN(Number(strVal))) {
                 allValues.add(strVal);
               } else {
                 allValues.add("[NUMERO: " + strVal + "]");
               }
            }
        }
      }
    }
  }
  rowsPerMonth[sheetName] = rowCount;
  console.log(`Foglio ${sheetName}: ${rowCount} righe max analizzate.`);
}

console.log("\n--- Valori unici non numerici ---");
const uniqueArr = Array.from(allValues).filter(v => !v.startsWith("[NUMERO:") && !['lun','mar','mer','gio','ven','sab','dom'].some(day => v.toLowerCase().startsWith(day)));
console.log(uniqueArr.sort().join(', '));

console.log("\n--- Colonne (Dipendenti potenziali) trovate nei fogli ---");
const cols = Array.from(employeeColumns).filter(c => c !== 'A' && c !== 'B' && c !== 'GIORNI' && c.length > 1);
console.log(cols.sort().join(', '));

// Print rows per month
console.log("\n--- Righe per mese ---");
for (const [k, v] of Object.entries(rowsPerMonth)) {
   console.log(`${k}: ${v} giorni`);
}
