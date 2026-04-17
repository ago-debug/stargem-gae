import fs from 'fs';
import * as XLSX from "xlsx";

const buffer = fs.readFileSync("/Users/gaetano1/Desktop/Sviluppo_doc/chat e file per gestionale/03_GemTeam/caricati/team_TURNI.xlsx");
const workbook = XLSX.read(buffer, { type: 'buffer' });
console.log(workbook.SheetNames);
