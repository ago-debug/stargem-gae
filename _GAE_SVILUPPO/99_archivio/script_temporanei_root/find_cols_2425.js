import xlsx from 'xlsx';

const wbE = xlsx.readFile('temp_import/estrap_20260415_ElencoIscrizioni.xlsx');
const dataE = xlsx.utils.sheet_to_json(wbE.Sheets[wbE.SheetNames[0]], { defval: null });

let cols = new Set();
for (let r of dataE) {
    for (let k in r) {
        if (r[k] && typeof r[k] === 'string' && r[k].includes('2425')) {
            cols.add(k);
        }
    }
}
console.log("Columns containing 2425 in Elenco:", Array.from(cols));
