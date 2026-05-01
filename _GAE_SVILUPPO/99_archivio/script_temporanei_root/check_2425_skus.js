import xlsx from 'xlsx';

function find2425(file) {
    const wb = xlsx.readFile(file);
    const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null });
    let count = 0;
    for(let r of data) {
        for(let key in r) {
            if(r[key] && typeof r[key] === 'string' && r[key].toUpperCase().includes('2425')) {
                count++;
                break;
            }
        }
    }
    return count;
}

console.log("Bitrix:", find2425('temp_import/estrap_20260417_estrapolazione_Master_per_importazione_Bitrix.xlsx'));
console.log("Elenco:", find2425('temp_import/estrap_20260415_ElencoIscrizioni.xlsx'));
