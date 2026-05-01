import fs from 'fs';
import * as XLSX from "xlsx";

const buffer = fs.readFileSync("/Users/gaetano1/Desktop/Sviluppo_doc/chat e file per gestionale/03_GemTeam/caricati/team_TURNI.xlsx");
const workbook = XLSX.read(buffer, { type: 'buffer' });
const sheet = workbook.Sheets['LUNEDÌ A'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log(data);
