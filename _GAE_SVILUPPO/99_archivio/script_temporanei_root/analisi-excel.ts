import * as XLSX from "xlsx";
import * as fs from "fs";

const path = "/Users/gaetano1/Desktop/Sviluppo_doc/chat e file per gestionale/03_GemTeam/caricati/team_TURNI.xlsx";
const buffer = fs.readFileSync(path);
const workbook = XLSX.read(buffer, { type: 'buffer' });
console.log(`Fogli totali: ${workbook.SheetNames.length}`);
console.log(`Nomi fogli: ${workbook.SheetNames.join(', ')}`);

const firstSheetName = workbook.SheetNames[0];
const firstSheet = workbook.Sheets[firstSheetName];
const data: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

console.log("\n[Primo foglio - Prime 5 righe]:");
data.slice(0, 5).forEach((row, i) => console.log(`Riga ${i}:`, row));

let dipendenti = [];
let dipendentiRow = -1;
for (let i = 0; i < 5; i++) {
  const row = data[i];
  if (row && row.length > 2 && row.includes("ALEXANDRA")) {
      dipendenti = row.filter((v: any) => v && typeof v === 'string' && v.trim().length > 1 && v.trim() !== 'ORARIO' && v.trim() !== 'SALA');
      dipendentiRow = i;
      break;
  }
}
console.log(`\nDipendenti trovati: ${dipendenti.length}`);
console.log(dipendenti);

let totalRows = 0;
let postazioniSet = new Set<string>();

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const sheetData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  totalRows += sheetData.length;
  
  sheetData.forEach((row, rIdx) => {
    if (rIdx > dipendentiRow && dipendentiRow !== -1) {
      row.forEach((cell, cIdx) => {
        if (cIdx >= 2 && cell && typeof cell === 'string') {
          const val = cell.trim();
          if (val && val !== 'PAUSA' && isNaN(Number(val)) && val.length >= 4 && !val.includes(':')) {
             postazioniSet.add(val.toUpperCase());
          }
        }
      });
    }
  });
});

console.log(`\nRighe dati totali in tutti i fogli (incluse intestazioni e vuote): ${totalRows}`);
console.log(`Postazioni distinte in Excel:`, Array.from(postazioniSet).sort());
