import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const xlsx = require('xlsx');

const filePath = '/Users/gaetano1/Desktop/Sviluppo_doc/file per gestionale/GemTeam/caricati/team_2025-2026_PRESENZE TEAM.xlsx';
const workbook = xlsx.readFile(filePath, { cellDates: true });

const targetSheets = ["Settembre25", "Ottobre25", "Novembre25", "Dicembre25", "Gennaio26", "Febbraio26", "Marzo26"];

const excelNames = ["ALEXANDRA", "DIEGO", "ELISA", "ESTEFANY", "GAETANO", "GIUDITTA", "JASIR", "JOEL", "KEVIN", "MASSI", "NURA", "SANTO", "SARA", "STEFANO", "ZOILA"];

async function run() {
  try {
    const res = await db.execute(sql`
      SELECT te.id as employee_id, m.first_name, m.last_name 
      FROM team_employees te
      JOIN members m ON m.id = te.member_id
    `);
    const dbEmployees = res[0] as any[];

    const nameToEmpId = new Map<string, number>();
    for (const name of excelNames) {
      if (name === 'ZOILA') continue;
      let match = dbEmployees.find(e => {
        const fn = (e.first_name || '').toUpperCase();
        const exN = name.toUpperCase();
        return fn.includes(exN) || exN.includes(fn) || (exN === 'MASSI' && fn.startsWith('MASSIMILIANO'));
      });
      if (match) {
        nameToEmpId.set(name, match.employee_id);
      }
    }

    let totalInserted = 0;
    const insertedPerMonth: Record<string, number> = {};

    console.log("Inizio Import in corso...");

    for (const sheetName of targetSheets) {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) continue;
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[];

      let headerRow = -1;
      for (let i=0; i<Math.min(5, jsonData.length); i++) {
        const rowStr = JSON.stringify(jsonData[i]);
        if (rowStr.includes('GAETANO') || rowStr.includes('GIUDITTA') || rowStr.includes('ESTEFANY')) {
            headerRow = i;
            break;
        }
      }
      if (headerRow === -1) continue;

      const headers = jsonData[headerRow];
      let monthInserted = 0;

      for (let r = headerRow + 1; r < jsonData.length; r++) {
        const row = jsonData[r];
        if (!row || row.length === 0) continue;
        
        let dateVal = row[0];
        let isValidDate = false;
        
        if (dateVal instanceof Date) {
            isValidDate = true;
        } else if (typeof dateVal === 'number' && dateVal > 40000) {
            // Excel dates correctly parsed without timezone issues
            let utc_days  = Math.floor(dateVal - 25569);
            let utc_value = utc_days * 86400;                                        
            dateVal = new Date(utc_value * 1000);
            isValidDate = true;
        } else if (typeof dateVal === 'string') {
           let parsed = new Date(dateVal);
           if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2020) {
              dateVal = parsed;
              isValidDate = true;
           }
        }

        if (isValidDate) {
          // Normalizza data per MySQL senza fusi orari
          // sometimes the date from cellDates has 23:00:00. Use local boundary.
          const d = new Date(dateVal);
          d.setHours(12, 0, 0, 0); // avoid tz shifts
          const dataStr = d.toISOString().split('T')[0];

          for (let c = 1; c < row.length; c++) {
            const headerCell = headers[c];
            if (typeof headerCell === 'string' && headerCell.trim().length > 0) {
                const headName = headerCell.trim().toUpperCase();
                const empId = nameToEmpId.get(headName);
                if (!empId) continue;

                const cellValue = row[c];
                if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
                   const strVal = String(cellValue).trim().toUpperCase();
                   
                   let ore = null;
                   let tipoAssenza = null;

                   if (!isNaN(Number(strVal))) {
                     ore = Number(strVal);
                   } else if (strVal === 'ML') {
                     tipoAssenza = 'ML';
                   } else if (strVal === 'PE') {
                     tipoAssenza = 'PE';
                   } else if (strVal === 'FE') {
                     tipoAssenza = 'FE';
                   } else if (strVal === 'F') {
                     tipoAssenza = 'F';
                   } else if (strVal === 'AI' || strVal === 'NO') {
                     tipoAssenza = 'AI';
                   } else {
                     continue;
                   }

                   await db.execute(sql`
                     INSERT INTO team_attendance_logs (employee_id, data, ore_lavorate, tipo_assenza, note, created_at)
                     VALUES (${empId}, ${dataStr}, ${ore}, ${tipoAssenza}, 'Import storico Excel', NOW())
                     ON DUPLICATE KEY UPDATE 
                       ore_lavorate = VALUES(ore_lavorate), 
                       tipo_assenza = VALUES(tipo_assenza),
                       note = 'Aggiornato da Import Storico Excel',
                       modified_at = NOW()
                   `);

                   monthInserted++;
                   totalInserted++;
                }
            }
          }
        }
      }
      insertedPerMonth[sheetName] = monthInserted;
    }

    console.log("--- Risultati Import ---");
    for (const [m, count] of Object.entries(insertedPerMonth)) {
       console.log(`${m}: ${count} righe importate/aggiornate`);
    }
    console.log(`\nTOTALE COMPLESSIVO: ${totalInserted} righe operato in upsert.`);
    
  } catch(e) {
    console.error("ERRORE:", e);
    process.exit(1);
  }
  process.exit(0);
}

run();
