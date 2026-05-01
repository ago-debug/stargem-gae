import xlsx from 'xlsx';
const wb = xlsx.readFile('temp_import/estrap_20260316_estrapolazione_ISCRITTI WORKSHOP.xlsx');
const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
console.log(data[0]);
