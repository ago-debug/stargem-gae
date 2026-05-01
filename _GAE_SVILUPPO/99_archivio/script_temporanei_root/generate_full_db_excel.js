import mysql from 'mysql2/promise';
import xlsx from 'xlsx';

const frontendMap = {
  "members": "Anagrafica (Profili Utenti / CRM)",
  "enrollments": "Iscritti per Attività (Partecipazioni ai Corsi/Workshop)",
  "payments": "Scheda Contabile / Lista Pagamenti",
  "courses": "Attività / Planning (Corsi, Workshop, Prove, ecc.)",
  "memberships": "Gestione Tessere (GemPass)",
  "medical_certificates": "Scadenze Mediche (in Anagrafica)",
  "cities": "Menu a tendina Comuni/Province",
  "users": "Account di Accesso (Utenti del gestionale)",
  "user_roles": "Ruoli e Permessi degli account",
  "user_activity_logs": "Log delle attività (Sicurezza)",
  "team_employees": "Risorse Umane (GemStaff / Dipendenti)",
  "team_scheduled_shifts": "Planning Turni Staff",
  "team_attendance_logs": "Timbrature / Check-in Staff",
  "team_monthly_reports": "Report Mensili Staff",
  "studio_bookings": "Prenotazioni Affitto Sale",
  "studios": "Impostazioni Sale (Studios)",
  "strategic_events": "Planning Stagionale (Eventi e Chiusure)",
  "seasons": "Gestione Stagioni (Anni accademici)",
  "quotes": "Preventivi e Contratti",
  "promo_rules": "Regole Promozionali / Sconti",
  "price_lists": "Listini Prezzi",
  "pagodil_tiers": "Rateizzazioni PagoDIL",
  "custom_list_items": "Voci personalizzate dei menu a tendina",
  "custom_lists": "Configurazione Liste menu a tendina",
  "accounting_periods": "Periodi Contabili",
  "webhook_logs": "Log integrazioni esterne (Webhooks)"
};

function getFrontendSection(tableName) {
  if (frontendMap[tableName]) return frontendMap[tableName];
  if (tableName.startsWith('team_')) return "Modulo GemStaff (Risorse Umane / Operatività)";
  return "Backend / Sistema Interno";
}

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  
  const [tablesResult] = await connection.execute("SHOW TABLES;");
  const wb = xlsx.utils.book_new();
  
  const mapData = [];

  for (const tRow of tablesResult) {
    const tableName = Object.values(tRow)[0];
    const [rows] = await connection.execute(`SELECT * FROM \`${tableName}\``);
    
    // Add to mapping
    mapData.push({
      "Nome Tabella": tableName,
      "Record Attuali": rows.length,
      "Sezione Frontend (Dove si usa)": getFrontendSection(tableName)
    });

    const sheetName = tableName.substring(0, 31);
    
    let ws;
    if (rows.length > 0) {
      // Truncate fields > 32000 chars
      const safeRows = rows.map(r => {
          let newRow = {};
          for(let key in r) {
              if (typeof r[key] === 'string' && r[key].length > 32000) {
                  newRow[key] = r[key].substring(0, 32000) + '...[TRUNCATED]';
              } else {
                  newRow[key] = r[key];
              }
          }
          return newRow;
      });
      ws = xlsx.utils.json_to_sheet(safeRows);
    } else {
      // Create empty sheet with just headers
      const [cols] = await connection.execute(`SHOW COLUMNS FROM \`${tableName}\`;`);
      const headers = cols.map(c => c.Field);
      ws = xlsx.utils.json_to_sheet([], { header: headers });
    }
    xlsx.utils.book_append_sheet(wb, ws, sheetName);
    console.log(`Added sheet ${sheetName}`);
  }

  // Create Map Sheet
  const wsMap = xlsx.utils.json_to_sheet(mapData);
  
  // Create a new workbook to put the Map as the FIRST sheet
  const finalWb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(finalWb, wsMap, "00_MAPPA_COLLEGAMENTI");
  
  for (const sheetName of wb.SheetNames) {
    xlsx.utils.book_append_sheet(finalWb, wb.Sheets[sheetName], sheetName);
  }

  xlsx.writeFile(finalWb, 'dump_db/Database_Completo_StarGem.xlsx');
  console.log("Excel dump created at dump_db/Database_Completo_StarGem.xlsx");
  
  await connection.end();
}
main().catch(console.error);
