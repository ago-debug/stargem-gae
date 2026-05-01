import xlsx from 'xlsx';

const wbB = xlsx.readFile('temp_import/estrap_20260417_estrapolazione_Master_per_importazione_Bitrix.xlsx');
const dataB = xlsx.utils.sheet_to_json(wbB.Sheets[wbB.SheetNames[0]], { defval: null });

let skus = new Set();
for (let row of dataB) {
    if (row['codici_corso_iscrizioni'] && String(row['codici_corso_iscrizioni']).includes('2425')) {
        skus.add(row['codici_corso_iscrizioni']);
    }
    if (row['codici_corso_prove_e_lezioni'] && String(row['codici_corso_prove_e_lezioni']).includes('2425')) {
        skus.add(row['codici_corso_prove_e_lezioni']);
    }
}
console.log("2425 SKUs in Bitrix:", Array.from(skus).slice(0, 10));
console.log("Total unique 2425 SKUs:", skus.size);
