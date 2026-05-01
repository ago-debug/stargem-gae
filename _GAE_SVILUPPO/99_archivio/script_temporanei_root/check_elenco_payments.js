import xlsx from 'xlsx';

const wbA = xlsx.readFile('temp_import/estrap_20260415_ElencoIscrizioni.xlsx');
const sheetA = wbA.Sheets[wbA.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheetA, { header: "A", defval: null });

const headers = data[0];
console.log("Headers of ElencoIscrizioni:");
let out = [];
for (let key in headers) {
    if (headers[key]) out.push(`${key}: ${headers[key]}`);
}
console.log(out.join('\n'));
