import xlsx from 'xlsx';

const wb = xlsx.readFile('temp_import/estrap_20260417_estrapolazione_Master_per_importazione_Bitrix.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
console.log("=== FILE HEADERS ===");
console.log(data[0]);

console.log("\n=== FIRST 2 ROWS OF DATA ===");
console.log(data[1]);
console.log(data[2]);
