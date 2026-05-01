import xlsx from 'xlsx';

const wb = xlsx.readFile('temp_import/estrap_20260417_estrapolazione_Master_per_importazione_Bitrix.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const head = data[0];

// Let's print the headers at these indices:
const colT = 19; // T is 19th (0-indexed)
const colBO = 66; // BO is 66th
const colBY = 76; // BY is 76th

console.log(`Column T (index 19): ${head[19]}`);
console.log(`Column BO (index 66): ${head[66]}`);
console.log(`Column BY (index 76): ${head[76]}`);

console.log("\nRow 4 (index 3):");
const row4 = data[3];
console.log(`Name: ${row4[head.indexOf('an_nome')]} ${row4[head.indexOf('an_cognome')]}`);
console.log(`T: ${row4[19]}`);
console.log(`BO: ${row4[66]}`);
console.log(`BY: ${row4[76]}`);
console.log(`sz1_totale_quota: ${row4[head.indexOf('sz1_totale_quota')]}`);
console.log(`sz1_codice_sconto: ${row4[head.indexOf('sz1_codice_sconto')]}`);
