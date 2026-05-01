import xlsx from 'xlsx';

const wb = xlsx.readFile('temp_import/estrap_20260417_estrapolazione_Master_per_importazione_Bitrix.xlsx');
const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null });

let sumGbrh = 0;
let count = 0;
for(let row of data) {
    const val = row['gbrh_valore_importo'];
    if(val) {
        const s = String(val).replace('€', '').replace(/\s/g, '').replace(',', '.');
        const f = parseFloat(s);
        if(!isNaN(f) && f > 0) {
            sumGbrh += f;
            count++;
        }
    }
}
console.log(`Found ${count} GBRH values, total: €${sumGbrh}`);
