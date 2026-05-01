import xlsx from 'xlsx';

const wb = xlsx.readFile('temp_import/estrap_20260417_estrapolazione_Master_per_importazione_Bitrix.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const head = data[0];
head.forEach((col, idx) => {
    if(col) console.log(`${idx}: ${col.replace(/\n/g, ' ')}`);
});
