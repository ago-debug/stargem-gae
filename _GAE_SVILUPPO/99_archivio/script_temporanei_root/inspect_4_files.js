import xlsx from 'xlsx';

const files = [
  'temp_import/estrap_20260415_ElencoIscrizioni.xlsx',
  'temp_import/estrap_20260417_estrapolazione_Master_per_importazione_Bitrix.xlsx',
  'temp_import/estrap_20260316_estrapolazione_ISCRITTI WORKSHOP.xlsx',
  'temp_import/estrap_20260415_AnaPersoneFullExcel.xlsx'
];

files.forEach(f => {
   try {
     const wb = xlsx.readFile(f);
     const sheet = wb.Sheets[wb.SheetNames[0]];
     const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
     console.log(`\n=== FILE: ${f.split('/').pop()} ===`);
     console.log("ROWS:", data.length);
     console.log("HEADERS:", data[0].slice(0, 10)); // just first 10 columns
   } catch (e) {
     console.error(`Error reading ${f}: ${e.message}`);
   }
});
