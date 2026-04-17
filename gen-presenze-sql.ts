import fs from 'fs';
import { parsePresenzeXlsx } from './server/scripts/import-presenze';

const buffer = fs.readFileSync("/Users/gaetano1/Desktop/Sviluppo_doc/chat e file per gestionale/03_GemTeam/caricati/team_2025-2026_PRESENZE TEAM.xlsx");
const records = parsePresenzeXlsx(buffer);

let sql = "";
records.forEach(r => {
  const ore = r.ore_lavorate === null ? 'NULL' : r.ore_lavorate;
  const tipo = r.tipo_assenza === null ? 'NULL' : `'${r.tipo_assenza}'`;
  sql += `INSERT INTO team_attendance_logs (employee_id, data, ore_lavorate, tipo_assenza) VALUES (${r.employee_id}, '${r.data}', ${ore}, ${tipo}) ON DUPLICATE KEY UPDATE ore_lavorate=VALUES(ore_lavorate), tipo_assenza=VALUES(tipo_assenza);\n`;
});

fs.writeFileSync('/tmp/import_presenze.sql', sql);
console.log("SQL scritto in /tmp/import_presenze.sql con " + records.length + " record.");
