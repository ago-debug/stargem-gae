import fs from "fs";
import Papa from "papaparse";
import path from "path";

async function main() {
  const FILE_2 = path.join(process.cwd(), "_GAE_SVILUPPO/_ANTIGRAVITY/04_dati_input/estrap_2026-05-04_estrapolazione_Master_Gsheet - importazione copia.csv");
  const content = fs.readFileSync(FILE_2, "utf-8");
  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });

  const codes = new Set();
  for (const row of parsed.data as any) {
    if (row["codici_corso_iscrizioni"]) codes.add(row["codici_corso_iscrizioni"]);
  }
  console.log("Master Gsheet Unique codici_corso_iscrizioni:", Array.from(codes).slice(0, 10));
}
main();
