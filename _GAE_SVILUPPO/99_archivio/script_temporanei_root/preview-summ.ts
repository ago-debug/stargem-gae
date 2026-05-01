import fs from 'fs';
import { parseTurniXlsx } from './server/scripts/import-turni';

const buffer = fs.readFileSync("/Users/gaetano1/Desktop/Sviluppo_doc/chat e file per gestionale/03_GemTeam/caricati/team_TURNI.xlsx");
const records = parseTurniXlsx(buffer);

const summary: any = {};
records.forEach(r => {
    const s = r.settimana_tipo;
    const e = r.employee_id;
    if (!summary[s]) summary[s] = {};
    if (!summary[s][e]) summary[s][e] = 0;
    summary[s][e]++;
});

console.log(`Totale record trovati (compattati): ${records.length}`);
for (const s in summary) {
  console.log(`Settimana ${s}:`);
  for (const e in summary[s]) {
     console.log(`  Dipendente ID ${e}: ${summary[s][e]} turni`);
  }
}
