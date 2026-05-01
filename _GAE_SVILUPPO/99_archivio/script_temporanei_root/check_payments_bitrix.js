import xlsx from 'xlsx';

const wb = xlsx.readFile('temp_import/estrap_20260417_estrapolazione_Master_per_importazione_Bitrix.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const headers = data[0];
console.log("Headers related to payments:");
headers.forEach((h, i) => {
   if (h && (h.toLowerCase().includes('pagam') || h.toLowerCase().includes('importo') || h.toLowerCase().includes('quota') || h.toLowerCase().includes('saldo'))) {
       console.log(`${i}: ${h}`);
   }
});

