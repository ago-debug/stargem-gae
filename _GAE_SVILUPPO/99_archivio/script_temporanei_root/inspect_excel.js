import xlsx from 'xlsx';

// Read File A
const wbA = xlsx.readFile('temp_import/estrap_20260415_ElencoIscrizioni.xlsx');
const sheetA = wbA.Sheets[wbA.SheetNames[0]];
const dataA = xlsx.utils.sheet_to_json(sheetA, { header: "A" });

console.log("=== FILE A (ElencoIscrizioni) - First 5 rows ===");
for (let i = 0; i < 5; i++) {
  if (dataA[i]) {
     console.log(`Row ${i+1}: AG: ${dataA[i]['AG']}, AH: ${dataA[i]['AH']}`);
  }
}

// Check how many have "workshop" in AG or something
const wsRowsA = dataA.filter(r => r['AG'] && String(r['AG']).toLowerCase().includes('ws'));
console.log(`\nFound ${wsRowsA.length} rows with 'ws' in column AG in File A`);
if (wsRowsA.length > 0) {
  console.log("Samples:");
  for (let i = 0; i < Math.min(5, wsRowsA.length); i++) {
     console.log(`Row: AG: ${wsRowsA[i]['AG']}, AH: ${wsRowsA[i]['AH']}`);
  }
}

// Read File B
const wbB = xlsx.readFile('temp_import/estrap_20260316_estrapolazione_ISCRITTI WORKSHOP.xlsx');
const sheetB = wbB.Sheets[wbB.SheetNames[0]];
const dataB = xlsx.utils.sheet_to_json(sheetB, { header: "A" });

console.log("\n=== FILE B (ISCRITTI WORKSHOP) - First 5 rows ===");
for (let i = 0; i < 5; i++) {
  if (dataB[i]) {
     console.log(`Row ${i+1}: A: ${dataB[i]['A']}, B: ${dataB[i]['B']}`);
  }
}
