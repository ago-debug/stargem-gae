import ExcelJS from 'exceljs';
import path from 'path';

async function main() {
  const filePath = path.join(process.cwd(), '_GAE_SVILUPPO/_CLAUDE/05_allegati/03_GemTeam/team_TURNI.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  for (const worksheet of workbook.worksheets) {
    console.log(`\nSheet: ${worksheet.name}`);
    
    // Mostriamo le prime due righe per capire gli header
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= 2) {
        console.log(`Row ${rowNumber}: ${JSON.stringify(row.values)}`);
      }
    });
  }
}

main().catch(console.error);
