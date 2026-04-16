import 'dotenv/config';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import { db } from '../server/db';
import { members, memberships } from '../shared/schema';
import { eq, inArray, isNull, or } from 'drizzle-orm';

function logRow(cf: string, action: string, reason: string) {
  console.log(`[CF: ${cf.padEnd(16, ' ')}] | ${action.padEnd(6, ' ')} | ${reason}`);
}

function normalizeCF(cf: any): string | null {
  if (!cf || typeof cf !== 'string') return null;
  const val = cf.trim().toUpperCase().replace(/\s/g, '');
  if (val.length !== 16) return null;
  return val;
}

function parseExcelDate(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    return d.toISOString().split('T')[0];
  }
  if (typeof val === 'string') {
    const parts = val.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return null;
}

async function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const isReset = args.includes('--reset');
  const hasForce = args.includes('--force');
  
  let passata = 0;
  const passataArg = args.find(a => a.startsWith('--passata='));
  if (passataArg) passata = parseInt(passataArg.split('=')[1], 10);
  
  let limit = Infinity;
  const limitArg = args.find(a => a.startsWith('--limit='));
  if (limitArg) limit = parseInt(limitArg.split('=')[1], 10);

  if (isReset) {
    if (!hasForce) {
      console.log("ERRORE: Per eseguire il reset è necessario passare anche '--force'");
      process.exit(1);
    }
    console.log("=== ESECUZIONE RESET ===");
    if (dryRun) {
      console.log("[DRY RUN] Simulata eliminazione dei record non staff.");
    } else {
      const res = await db.delete(members).where(
        or(
          isNull(members.participantType),
          inArray(members.participantType, ['SOCIO', 'ALLIEVO', 'ADULTO', 'tesserato'])
        )
      );
      console.log(`[RESET] Completato.`);
    }
    process.exit(0);
  }

  if (passata < 1 || passata > 3) {
    console.log("Specificare --passata=1 (o 2 o 3)");
    process.exit(1);
  }

  console.log(`=== INIZIO PASSATA ${passata} ===`);
  if (dryRun) console.log(`[!] DRY RUN: i cambiamenti NON verranno scritti a db`);
  if (limit !== Infinity) console.log(`[!] LIMIT: ${limit} record`);

  let countProcessed = 0;
  let countUpdated = 0;
  let countInserted = 0;
  let countSkipped = 0;
  let countDupes = 0;
  let countErrors = 0;
  let countFullFields = 0;
  let countEmptyFieldsFilled = 0;
  let updatedFieldsStats: Record<string, number> = {};
  let notFoundCFs: string[] = [];

  try {
    if (passata === 1) {
      const file = 'temp_import/estrap_20260315_estrapolazione_Master_per_importazione_Bitrix.xlsx';
      if (!fs.existsSync(file)) throw new Error(`File non trovato: ${file}`);
      const wb = xlsx.read(fs.readFileSync(file), { cellDates: true });
      const rows = xlsx.utils.sheet_to_json<any>(wb.Sheets['importazione'] || wb.Sheets[wb.SheetNames[0]]);
      
      const dedupMap = new Map<string, any>();
      for (const row of rows) {
        const cf = normalizeCF(row.an_cod_fiscale);
        if (!cf) {
          countSkipped++;
          continue;
        }
        if (dedupMap.has(cf)) {
          const exist = dedupMap.get(cf);
          const oldD = parseExcelDate(exist.an_data_inserimento) || '1970-01-01';
          const newD = parseExcelDate(row.an_data_inserimento) || '1970-01-01';
          if (new Date(newD) > new Date(oldD)) {
            dedupMap.set(cf, row);
            countDupes++;
          } else {
            countDupes++;
          }
        } else {
          dedupMap.set(cf, row);
        }
      }

      const uniqueRows = Array.from(dedupMap.values()).slice(0, limit);
      countProcessed = uniqueRows.length;

      for (const row of uniqueRows) {
        const cf = normalizeCF(row.an_cod_fiscale)!;
        try {
          const existing = await db.select().from(members).where(eq(members.fiscalCode, cf)).limit(1);
          if (existing.length > 0) {
            const m = existing[0];
            const updates: any = {};
            const discrepancies: string[] = [];
            let emptyFieldsFilled = false;

            const checkField = (dbVal: any, excelVal: any, dbKey: string) => {
              if (!excelVal) return;
              if (!dbVal) {
                updates[dbKey] = excelVal;
                emptyFieldsFilled = true;
                updatedFieldsStats[dbKey] = (updatedFieldsStats[dbKey] || 0) + 1;
              } else {
                const cleanDb = String(dbVal).trim().toLowerCase();
                const cleanEx = String(excelVal).trim().toLowerCase();
                // Avoid logging discrepancy for phone numbers differing by spaces/formatting
                if (dbKey === 'phone') {
                  if (cleanDb.replace(/\\s+/g,'') !== cleanEx.replace(/\\s+/g,'')) discrepancies.push(dbKey);
                } else if (dbKey === 'tessereMetadata') {
                    // special check for metadata since string formats differ
                  if (cleanDb.replace(/\\s+/g,'') !== cleanEx.replace(/\\s+/g,'')) discrepancies.push(dbKey);
                } else if (cleanDb !== cleanEx) {
                  discrepancies.push(dbKey);
                }
              }
            };

            checkField(m.firstName, row.an_nome, 'firstName');
            checkField(m.lastName, row.an_cognome, 'lastName');
            checkField(m.email, row.an_email, 'email');
            checkField(m.phone, row.an_telefono, 'phone');
            checkField(m.gender, row.an_sesso === 'M' ? 'M' : (row.an_sesso ? 'F' : null), 'gender');
            checkField(m.insertionDate, parseExcelDate(row.an_data_inserimento), 'insertionDate');
            checkField(m.internalId, row.an_id_anagrafica ? String(row.an_id_anagrafica) : null, 'internalId');
            checkField(m.tessereMetadata, row.n_tessera ? JSON.stringify({ numero: row.n_tessera }) : null, 'tessereMetadata');

            if (discrepancies.length > 0) {
              const checkString = `[IMPORT-CHECK: ${discrepancies.join(',')}]`;
              if (!m.notes || !m.notes.includes(checkString)) {
                updates.notes = m.notes ? `${m.notes}\\n${checkString}` : checkString;
              }
            }

            if (Object.keys(updates).length > 0) {
              if (emptyFieldsFilled) countEmptyFieldsFilled++;
              if (!dryRun) {
                await db.update(members).set(updates).where(eq(members.id, m.id));
              }
              countUpdated++;
              const msg = discrepancies.length > 0 ? `Aggiornati campi + Flag discrepanti: ${discrepancies.join(',')}` : 'Aggiornati campi vuoti';
              logRow(cf, 'UPDATE', msg);
            } else {
              countFullFields++;
              logRow(cf, 'SKIP', 'Record già completo in DB e senza discrepanze');
              countSkipped++;
            }
          } else {
            const insertData: any = {
              fiscalCode: cf,
              firstName: row.an_nome || 'Sconosciuto',
              lastName: row.an_cognome || 'Sconosciuto',
              email: row.an_email || null,
              phone: String(row.an_telefono || ''),
              gender: row.an_sesso === 'M' ? 'M' : 'F',
              insertionDate: parseExcelDate(row.an_data_inserimento),
              internalId: String(row.an_id_anagrafica || ''),
              tessereMetadata: row.n_tessera ? JSON.stringify({ numero: row.n_tessera }) : null,
              participantType: 'SOCIO',
              fromWhere: 'gsheets_import'
            };
            if (!dryRun) {
              await db.insert(members).values(insertData);
            }
            countInserted++;
            logRow(cf, 'INSERT', 'Nuovo membro da GSheets');
          }
        } catch (e: any) {
          countErrors++;
          logRow(cf, 'ERROR', e.message);
        }
      }
    }

    if (passata === 2) {
      const file = 'temp_import/estrap_20260415_AnaPersoneFullExcel.xlsx';
      if (!fs.existsSync(file)) throw new Error(`File non trovato: ${file}`);
      const wb = xlsx.read(fs.readFileSync(file), { cellDates: true });
      const rows = xlsx.utils.sheet_to_json<any>(wb.Sheets['AnaPersoneFullExcel'] || wb.Sheets[wb.SheetNames[0]]);
      
      const dedupMap = new Map<string, any>();
      for (const row of rows) {
        const cf = normalizeCF(row['Cod. Fiscale']);
        if (!cf) { countSkipped++; continue; }
        if (!dedupMap.has(cf)) {
          dedupMap.set(cf, row);
        } else {
          countDupes++;
        }
      }

      const uniqueRows = Array.from(dedupMap.values()).slice(0, limit);
      countProcessed = uniqueRows.length;

      for (const row of uniqueRows) {
        const cf = normalizeCF(row['Cod. Fiscale'])!;
        try {
          const existing = await db.select().from(members).where(eq(members.fiscalCode, cf)).limit(1);
          if (existing.length > 0) {
            const m = existing[0];
            const updates: any = {};
            if (!m.dateOfBirth && row['Data di Nascita']) updates.dateOfBirth = parseExcelDate(row['Data di Nascita']);
            if (!m.placeOfBirth && row['Città Nasc.']) updates.placeOfBirth = row['Città Nasc.'];
            if (!m.address && row['Indirizzo']) updates.address = row['Indirizzo'];
            if (!m.postalCode && row['CAP']) updates.postalCode = String(row['CAP']);
            if (!m.city && row['Citta Resid.']) updates.city = row['Citta Resid.'];
            if (!m.province && row['Provincia']) updates.province = row['Provincia'];
            if (!m.internalId && row['Codice']) updates.internalId = `ATH-${row['Codice']}`;
            if (!m.tutor1FiscalCode && row['Cod.Fisc. Tutore']) updates.tutor1FiscalCode = normalizeCF(row['Cod.Fisc. Tutore']);
            if (!m.tutor1Phone && row['Telefono Tutore']) updates.tutor1Phone = String(row['Telefono Tutore']);
            if (!m.tutor1Email && row['Email Tutore']) updates.tutor1Email = row['Email Tutore'];
            if (!m.tutor2FiscalCode && row['Cod.Fisc. Tutore 2']) updates.tutor2FiscalCode = normalizeCF(row['Cod.Fisc. Tutore 2']);
            if (!m.tutor2Phone && row['Telefono Tutore 2']) updates.tutor2Phone = String(row['Telefono Tutore 2']);
            if (!m.tutor2Email && row['Email Tutore 2']) updates.tutor2Email = row['Email Tutore 2'];
            if (!m.nationality && row['Cittadinanza']) updates.nationality = row['Cittadinanza'];
            if (!m.region && row['Regione']) updates.region = row['Regione'];
            if (!m.consentImage && row['Cons. Immag.']) updates.consentImage = row['Cons. Immag.'] === 'Sì' || row['Cons. Immag.'] === 'Si' || row['Cons. Immag.'] === '1' || row['Cons. Immag.'] === 1;
            if (!m.consentMarketing && row['Consenso Invio']) updates.consentMarketing = row['Consenso Invio'] === 'Sì' || row['Consenso Invio'] === 'Si' || row['Consenso Invio'] === '1' || row['Consenso Invio'] === 1;

            if (Object.keys(updates).length > 0) {
              if (!dryRun) {
                await db.update(members).set(updates).where(eq(members.id, m.id));
              }
              countUpdated++;
              logRow(cf, 'UPDATE', 'Aggiornati campi anagrafici (Athena)');
            } else {
              logRow(cf, 'SKIP', 'Record già completo in DB');
              countSkipped++;
            }
          } else {
            const insertData: any = {
              fiscalCode: cf,
              firstName: row['Nome'] || 'Sconosciuto',
              lastName: row['Cognome'] || 'Sconosciuto',
              gender: row['Sesso'] === 'M' ? 'M' : 'F',
              dateOfBirth: parseExcelDate(row['Data di Nascita']) ? new Date(parseExcelDate(row['Data di Nascita'])!) : null,
              placeOfBirth: row['Città Nasc.'],
              address: row['Indirizzo'],
              postalCode: String(row['CAP'] || ''),
              city: row['Citta Resid.'],
              province: row['Provincia'],
              internalId: `ATH-${row['Codice'] || ''}`,
              participantType: 'SOCIO',
              fromWhere: 'athena_import',
              tutor1FiscalCode: normalizeCF(row['Cod.Fisc. Tutore']),
              tutor1Phone: row['Telefono Tutore'] ? String(row['Telefono Tutore']) : null,
              tutor1Email: row['Email Tutore'] || null,
              tutor2FiscalCode: normalizeCF(row['Cod.Fisc. Tutore 2']),
              tutor2Phone: row['Telefono Tutore 2'] ? String(row['Telefono Tutore 2']) : null,
              tutor2Email: row['Email Tutore 2'] || null,
              nationality: row['Cittadinanza'] || null,
              region: row['Regione'] || null,
              consentImage: row['Cons. Immag.'] === 'Sì' || row['Cons. Immag.'] === 'Si' || row['Cons. Immag.'] === '1' || row['Cons. Immag.'] === 1,
              consentMarketing: row['Consenso Invio'] === 'Sì' || row['Consenso Invio'] === 'Si' || row['Consenso Invio'] === '1' || row['Consenso Invio'] === 1
            };
            if (!dryRun) {
              await db.insert(members).values(insertData);
            }
            countInserted++;
            notFoundCFs.push(cf); // come da richiesta
            logRow(cf, 'INSERT', 'Nuovo membro da Athena');
          }
        } catch (e: any) {
          countErrors++;
          logRow(cf, 'ERROR', e.message);
        }
      }
    }

    if (passata === 3) {
      const file = 'temp_import/estrap_20260415_ElencoIscrizioni.xlsx';
      if (!fs.existsSync(file)) throw new Error(`File non trovato: ${file}`);
      const wb = xlsx.read(fs.readFileSync(file), { cellDates: true });
      const rows = xlsx.utils.sheet_to_json<any>(wb.Sheets['ElencoIscrizioni'] || wb.Sheets[wb.SheetNames[0]]);
      
      const toProcess = rows.slice(0, limit);
      countProcessed = toProcess.length;

      for (const row of toProcess) {
        const cf = normalizeCF(row['Cod. Fisc.']);
        if (!cf) { 
          logRow('VUOTO', 'SKIP', 'CF mancante o non valido');
          countSkipped++; 
          continue; 
        }

        try {
          const existing = await db.select().from(members).where(eq(members.fiscalCode, cf)).limit(1);
          if (existing.length === 0) {
            logRow(cf, 'NOTFND', 'CF non presente in DB');
            notFoundCFs.push(cf);
            countSkipped++;
            continue;
          }
          const m = existing[0];
          const membershipNumber = String(row['Tessera'] || `MEM-${Date.now()}`);

          const existingTessera = await db.select().from(memberships).where(eq(memberships.membershipNumber, membershipNumber)).limit(1);
          if (existingTessera.length > 0) {
            logRow(cf, 'SKIP', `Tessera ${membershipNumber} già su DB`);
            countSkipped++;
            continue;
          }

          const fallbackDate = new Date(); fallbackDate.setFullYear(fallbackDate.getFullYear() - 1);
          const expiryRaw = parseExcelDate(row['Scad. Tessera']);

          const insertTessera: any = {
            memberId: m.id,
            membershipNumber: membershipNumber,
            barcode: `B-${membershipNumber}-${Math.floor(Math.random()*10000)}`,
            issueDate: '2023-01-01',
            expiryDate: expiryRaw || fallbackDate.toISOString().split('T')[0],
            previousMembershipNumber: String(row['Matricola'] || ''),
            status: 'expired',
            type: 'storica',
            isRenewal: false
          };
          if (!dryRun) {
            await db.insert(memberships).values(insertTessera);
          }
          countInserted++;
          logRow(cf, 'INSERT', `Tessera ${membershipNumber} inserita storicamente`);
        } catch (e: any) {
          countErrors++;
          logRow(cf, 'ERROR', e.message);
        }
      }
    }

  } catch (error: any) {
    console.error("ERRORE GENERALE:", error.message);
  } finally {
    console.log("\n=== REPORT FINALE ===");
    console.log(`Processati: ${countProcessed}`);
    console.log(`Inseriti: ${countInserted}`);
    console.log(`Aggiornati: ${countUpdated}`);
    console.log(`  - Di cui con campi vuoti riempiti: ${countEmptyFieldsFilled}`);
    console.log(`  - Statistiche campi riempiti: ${JSON.stringify(updatedFieldsStats)}`);
    console.log(`Saltati totali: ${countSkipped}`);
    console.log(`  - Di cui avevano già tutti i campi pieni: ${countFullFields}`);
    console.log(`Duplicati su File: ${countDupes}`);
    console.log(`Errori: ${countErrors}`);
    if (notFoundCFs.length > 0) {
      console.log(`CF Introvabili/Nuovi da Athena (primi 10):`, notFoundCFs.slice(0, 10).join(', '));
      console.log(`Totale CF introvabili/nuovi athena: ${notFoundCFs.length}`);
    }
    process.exit(0);
  }
}

run();
