const XLSX = require('xlsx');

const filePath = '/Users/gaetano1/Desktop/Sviluppo_doc/file per gestionale/GemTeam/caricati/team_2025-2026_PRESENZE TEAM.xlsx';
const workbook = XLSX.readFile(filePath);

const worksheet = workbook.Sheets['Settembre25'];
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

for (let i = 0; i < Math.min(10, jsonData.length); i++) {
  console.log(`Row ${i}:`, jsonData[i]);
}
