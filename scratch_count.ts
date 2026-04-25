import * as XLSX from 'xlsx';
import * as fs from 'fs';

const buf = fs.readFileSync('temp_import/estrap_20260417_estrapolazione_Master_per_importazione_Bitrix.xlsx');
const wb = XLSX.read(buf, { type: 'buffer' });
const ws = wb.Sheets['Anagrafica2'] || wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { defval: null }) as any[];

if (rows.length > 0) {
  console.log("Colonne trovate: ", Object.keys(rows[0]).filter(k => k.includes('tessera')));
}

let count = 0;
for (const row of rows) {
  if (row['n_tessera'] && String(row['n_tessera']).trim() !== '') {
    count++;
  }
}
console.log('Righe MASTER con n_tessera: ' + count);
