import fs from 'fs';
import xlsx from 'xlsx';

const args = process.argv.slice(2);

function main() {
  console.log(`Starting Excel Generation for CF Typos`);

  let raw = '[]';
  try {
    raw = fs.readFileSync('/tmp/cf_typo_report.json', 'utf8');
  } catch (e) {
    console.error("Non trovo /tmp/cf_typo_report.json. Ricorda di eseguire prima lo script cf_typo_finder.ts");
    process.exit(1);
  }

  const reports = JSON.parse(raw);

  const excelData = reports.map((r: any) => ({
    'ID_RECORD_1': r.id_winner,
    'NOME_1': r.nome_winner,
    'CF_1': r.cf_winner,
    'SCORE_1': r.score_winner,
    'FONTE_CF_1': r.fonte_winner,
    'ID_RECORD_2': r.id_loser,
    'NOME_2': r.nome_loser,
    'CF_2': r.cf_loser,
    'SCORE_2': r.score_loser,
    'FONTE_CF_2': 'N/A', // O assente o non in master list
    'DISTANZA_CF': r.edit_distance,
    'MOTIVO_MATCH': r.match_reason,
    'CF_CONSIGLIATO': r.cf_winner,
    'AZIONE': r.azione_consigliata
  }));

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(excelData);
  xlsx.utils.book_append_sheet(wb, ws, "CF DA VERIFICARE");

  xlsx.writeFile(wb, '/tmp/cf_typo_da_verificare.xlsx');
  
  console.log(`Finito! Creato /tmp/cf_typo_da_verificare.xlsx con ${excelData.length} coppie da revisionare.`);
}

main();
