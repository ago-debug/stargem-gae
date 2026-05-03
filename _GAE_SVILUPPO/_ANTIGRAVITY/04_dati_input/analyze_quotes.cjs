const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

const inputDir = "/Users/gaetano1/SVILUPPO/StarGem_manager/_GAE_SVILUPPO/_ANTIGRAVITY/04_dati_input";
const files = fs.readdirSync(inputDir).filter(f => f.startsWith("quote_") && f.endsWith(".xlsx"));

const report = {};

for (const file of files) {
  console.log("Analyzing", file);
  const filePath = path.join(inputDir, file);
  const workbook = xlsx.readFile(filePath);
  
  report[file] = {};
  
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    // Extract data as JSON, up to 5 rows to see headers and a bit of data
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
    report[file][sheetName] = data.slice(0, 8); // first 8 rows
  }
}

fs.writeFileSync(path.join(inputDir, "quotes_analysis.json"), JSON.stringify(report, null, 2));
console.log("Done. Output saved to quotes_analysis.json");
