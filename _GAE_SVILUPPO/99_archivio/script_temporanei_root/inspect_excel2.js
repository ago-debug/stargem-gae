import xlsx from 'xlsx';

// Read File B
const wbB = xlsx.readFile('temp_import/estrap_20260316_estrapolazione_ISCRITTI WORKSHOP.xlsx');
const sheetB = wbB.Sheets[wbB.SheetNames[0]];
const dataB = xlsx.utils.sheet_to_json(sheetB, { header: 1 });

console.log("=== FILE B HEADERS ===");
console.log(dataB[0]);

console.log("\n=== FILE B FIRST DATA ROW ===");
console.log(dataB[1]);
