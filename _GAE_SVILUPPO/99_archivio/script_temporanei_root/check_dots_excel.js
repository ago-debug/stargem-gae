import xlsx from 'xlsx';

const wbA = xlsx.readFile('temp_import/estrap_20260415_ElencoIscrizioni.xlsx');
const sheetA = wbA.Sheets[wbA.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheetA, { header: "A", defval: null });

let withDots = 0;
let samples = [];

for (let i = 1; i < data.length; i++) {
    const sku = data[i]['AG'];
    if (sku && String(sku).includes('.')) {
        withDots++;
        if (samples.length < 5) samples.push(sku);
    }
}

console.log(`Found ${withDots} SKUs with dots in Excel.`);
console.log(samples);
