import fs from "fs";
import Papa from "papaparse";
import path from "path";

async function main() {
  const FILE_4 = path.join(process.cwd(), "_GAE_SVILUPPO/_ANTIGRAVITY/04_dati_input/estrap_2026-03-16_estrapolazione_WORKSHOP_Gsheet - WS_master_dati copia.csv");
  const content = fs.readFileSync(FILE_4, "utf-8");
  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });

  const skus = new Set();
  for (const row of parsed.data as any) {
    if (row["SKU/codice"]) skus.add(row["SKU/codice"]);
  }
  console.log("WS Unique SKUs:", Array.from(skus).slice(0, 10));
}
main();
