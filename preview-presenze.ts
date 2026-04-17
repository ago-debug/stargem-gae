import fs from 'fs';
import { parsePresenzeXlsx } from './server/scripts/import-presenze';

const buffer = fs.readFileSync("/Users/gaetano1/Desktop/Sviluppo_doc/chat e file per gestionale/03_GemTeam/caricati/team_2025-2026_PRESENZE TEAM.xlsx");
const records = parsePresenzeXlsx(buffer);

console.log(`Totale record validi trovati nelle tabelle presenze: ${records.length}`);

// optionally sample them
if (records.length > 0) {
  console.log("Esempio primo record:", JSON.stringify(records[0]));
}
