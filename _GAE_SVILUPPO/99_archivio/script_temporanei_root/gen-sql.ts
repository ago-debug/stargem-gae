import fs from 'fs';
import { parseTurniXlsx } from './server/scripts/import-turni';

const buffer = fs.readFileSync("/Users/gaetano1/Desktop/Sviluppo_doc/chat e file per gestionale/03_GemTeam/caricati/team_TURNI.xlsx");
const records = parseTurniXlsx(buffer, false); // Assuming I pass false to not group, or actually wait, my parseTurniXlsx signature only has `buffer: Buffer`. The returned `results` is grouped natively inside.

let sql = "DELETE FROM team_shift_templates;\n";
records.forEach(r => {
  sql += `INSERT INTO team_shift_templates (employee_id, settimana_tipo, giorno_settimana, ora_inizio, ora_fine, postazione) VALUES (${r.employee_id}, '${r.settimana_tipo}', ${r.giorno_settimana}, '${r.ora_inizio}', '${r.ora_fine}', '${r.postazione}');\n`;
});

fs.writeFileSync('/tmp/import_turni.sql', sql);
console.log("SQL scritto in /tmp/import_turni.sql");
