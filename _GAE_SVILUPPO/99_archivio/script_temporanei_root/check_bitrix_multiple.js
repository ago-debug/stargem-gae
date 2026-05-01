import xlsx from 'xlsx';

const wb = xlsx.readFile('temp_import/estrap_20260417_estrapolazione_Master_per_importazione_Bitrix.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const headerRow = data[0];
const colIscrizioniIdx = headerRow.indexOf('codici_corso_iscrizioni');
const colProveIdx = headerRow.indexOf('codici_corso_prove_e_lezioni');

let multipleIscr = 0;
let totalIscr = 0;

for (let i = 1; i < data.length; i++) {
    const iscr = data[i][colIscrizioniIdx];
    if (iscr && typeof iscr === 'string') {
        const parts = iscr.split(',').map(s => s.trim()).filter(s => s.length > 0);
        totalIscr += parts.length;
        if (parts.length > 1) multipleIscr++;
    }
    
    const prov = data[i][colProveIdx];
    if (prov && typeof prov === 'string') {
        const parts = prov.split(',').map(s => s.trim()).filter(s => s.length > 0);
        totalIscr += parts.length;
    }
}

console.log(`Total SKUs extracted from Bitrix: ${totalIscr}`);
console.log(`Members with multiple courses: ${multipleIscr}`);
