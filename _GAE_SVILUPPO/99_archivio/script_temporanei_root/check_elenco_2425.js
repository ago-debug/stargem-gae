import xlsx from 'xlsx';

const wbE = xlsx.readFile('temp_import/estrap_20260415_ElencoIscrizioni.xlsx');
const dataE = xlsx.utils.sheet_to_json(wbE.Sheets[wbE.SheetNames[0]], { header: "A", defval: null });

let counts = {};
for (let i = 1; i < dataE.length; i++) {
    const row = dataE[i];
    const sku = String(row['AG'] || '').trim().toUpperCase();
    if (sku.includes('2425')) {
        counts[sku] = (counts[sku] || 0) + 1;
    }
}
console.log("2425 SKUs in Elenco:", counts);
