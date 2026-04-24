import 'dotenv/config';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import { db } from '../server/db';
import { members, memberships, courses, enrollments, payments, medicalCertificates, seasons } from '../shared/schema';
import { eq, inArray, isNull, or, sql, like, and } from 'drizzle-orm';

function logRow(cf: string | null, action: string, reason: string) {
  const safeCf = cf || 'NOCF';
  console.log(`[CF: ${safeCf.padEnd(16, ' ')}] | ${action.padEnd(6, ' ')} | ${reason}`);
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


async function findMemberByName(firstName: string, lastName: string) {
  if (!firstName || !lastName) return null;
  const fn = firstName.toLowerCase().trim();
  const ln = lastName.toLowerCase().trim();
  const existing = await db.select().from(members).where(
    sql`LOWER(TRIM(${members.firstName})) = ${fn} AND LOWER(TRIM(${members.lastName})) = ${ln}`
  ).limit(2);
  
  if (existing.length === 1) return existing[0];
  return null; // Trovati 0 o più di 1
}

function countFilledFields(obj: any, fields: string[]) {
  let c = 0;
  for (const f of fields) {
    if (obj[f] !== undefined && obj[f] !== null && String(obj[f]).trim() !== '') c++;
  }
  return c;
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

  if (!fs.existsSync('.env')) {
    console.log("File .env non trovato!");
    process.exit(1);
  }
  if (passata < 1 || passata > 5) {
    console.log("Specificare --passata=1 (o 2 o 3 o 4 o 5)");
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
  
  // Contatori specifici P1/P3
  let countTessereCreate = 0;
  let countTessereSaltate = 0;
  let countCertificatiCreati = 0;
  let countTessereMancanti = 0;
  let countEnrollmentCreate = 0;
  let countEnrollmentSaltati = 0;
  let countCorsiPlaceholderCreati = 0;
  let countP4PersoneNuove = 0;
  let countP4EnrollmentCreati = 0;
  let countP4PagamentiCreati = 0;
  let countCorsiMatchEsatto = 0;
  let countCorsiMatchPrefisso = 0;
  let updatedFieldsStats: Record<string, number> = {};
  let notFoundCFs: string[] = [];

  let countP5PagamentiSZ = 0;
  let countP5PagamentiGBRH = 0;
  let countP5SenzaEnrollment = 0;

  try {
    if (passata === 1) {
      const file = 'temp_import/estrap_20260417_estrapolazione_Master_per_importazione_Bitrix.xlsx';
      if (!fs.existsSync(file)) throw new Error(`File non trovato: ${file}`);
      const wb = xlsx.read(fs.readFileSync(file), { cellDates: true });
      const rows = xlsx.utils.sheet_to_json<any>(wb.Sheets['importazione'] || wb.Sheets[wb.SheetNames[0]]);
      
      const dedupMap = new Map<string, any>();
      const p1Fields = ['an_cod_fiscale', 'an_nome', 'an_cognome', 'an_email', 'an_telefono', 'an_sesso', 'an2_data_di_nascita', 'an2_luogo_di_nascita', 'an2_provincia_di_nascita', 'note', 'data_scad_cert_medico', 'come_ci_hai_conosciuto'];
      for (const row of rows) {
        const cf = normalizeCF(row.an_cod_fiscale);
        const namePart = (String(row.an_nome||'') + String(row.an_cognome||'') + String(row.an_telefono||'')).toLowerCase().replace(/\s+/g, '');
        const key = cf ? cf : (namePart ? '_NOCF_' + namePart : null);
        
        if (!key) {
          countSkipped++;
          continue;
        }

        if (dedupMap.has(key)) {
          const exist = dedupMap.get(key);
          const oldC = countFilledFields(exist, p1Fields);
          const newC = countFilledFields(row, p1Fields);
          
          if (newC > oldC) {
            dedupMap.set(key, row);
            countDupes++;
          } else if (newC === oldC) {
            const oldD = parseExcelDate(exist.an_data_inserimento) || '1970-01-01';
            const newD = parseExcelDate(row.an_data_inserimento) || '1970-01-01';
            if (new Date(newD) > new Date(oldD)) {
              dedupMap.set(key, row);
            }
            countDupes++;
          } else {
            countDupes++;
          }
        } else {
          dedupMap.set(key, row);
        }
      }

      const uniqueRows = Array.from(dedupMap.values()).slice(0, limit);
      countProcessed = uniqueRows.length;

      for (const row of uniqueRows) {
        const cf = normalizeCF(row.an_cod_fiscale)!;
        try {
          const existing = await db.select().from(members).where(eq(members.fiscalCode, cf)).limit(1);
          let m = existing.length > 0 ? existing[0] : null;
          if (m) {
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
            checkField(m.dateOfBirth, parseExcelDate(row.an2_data_di_nascita), 'dateOfBirth');
            checkField(m.placeOfBirth, row.an2_luogo_di_nascita, 'placeOfBirth');
            checkField(m.birthProvince, row.an2_provincia_di_nascita, 'birthProvince');
            checkField(m.tutor1FiscalCode, normalizeCF(row['an2_codice_fiscale\ngenitore']), 'tutor1FiscalCode');
            checkField(m.motherLastName, row.an_cognome_gen, 'motherLastName');
            checkField(m.motherFirstName, row.an_nome_gen, 'motherFirstName');
            checkField(m.adminNotes, row.conclusione, 'adminNotes');
            
            const isFatturaFatta = String(row.an2_fattura_fatta || '').trim().toUpperCase() === 'SI' || String(row.an2_fattura_fatta || '').trim() !== '' ? true : false;
            checkField(m.fatturaFatta, isFatturaFatta, 'fatturaFatta');
            
            // Per le notes, c'è già una logica che le accoda sotto. La facciamo usando checkString?
            // Il prompt dice: aggiungi checkField per gli stessi campi. Lo aggiungiamo per notes in modo da non sovrascrivere se c'è già.
            if (!m.notes && row.note) checkField(m.notes, row.note, 'notes');

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
              participantType: 'SOCIO',
              fromWhere: 'gsheets_import',
              dateOfBirth: parseExcelDate(row.an2_data_di_nascita) ? new Date(parseExcelDate(row.an2_data_di_nascita)!) : null,
              placeOfBirth: row.an2_luogo_di_nascita || null,
              birthProvince: row.an2_provincia_di_nascita || null,
              tutor1FiscalCode: normalizeCF(row['an2_codice_fiscale\ngenitore']),
              motherLastName: row.an_cognome_gen || null,
              motherFirstName: row.an_nome_gen || null,
              notes: row.note || null,
              adminNotes: row.conclusione || null,
              fatturaFatta: String(row.an2_fattura_fatta || '').trim().toUpperCase() === 'SI' || String(row.an2_fattura_fatta || '').trim() !== '' ? true : false
            };
            let currentMemberId = m ? m.id : null;
            if (!dryRun) {
              const res = await db.insert(members).values(insertData);
              currentMemberId = res[0].insertId;
            } else {
              currentMemberId = 999999;
            }
            countInserted++;
            logRow(cf, 'INSERT', 'Nuovo membro da GSheets');
            m = { id: currentMemberId } as any; // Mock per il blocco successivo se inserito
          }

          const currentMemberId = m.id;

          // --- AGGIUNTA 1: TESSERE IN P1 ---
          const nTessera = String(row.n_tessera || '').trim();
          if (nTessera && nTessera.length >= 8 && (nTessera.startsWith('2526') || nTessera.startsWith('2425'))) {
            const is2526 = nTessera.startsWith('2526');
            const targetSeasonId = is2526 ? 1 : 3;
            
            const existingMembership = await db.select().from(memberships)
              .where(and(eq(memberships.memberId, currentMemberId), eq(memberships.seasonId, targetSeasonId)));
            
            if (existingMembership.length > 0) {
              countTessereSaltate++;
              // logRow(cf, 'SKIP', `Tessera ${nTessera} già presente`);
            } else {
              const tesseraEnte = String(row.tessera_ente || '').trim();
              const quotaTessera = row.quota_tessera ? parseFloat(String(row.quota_tessera).replace(',', '.')) : 25;
              const dataEmissione = parseExcelDate(row['data_emissione\\npagamento_tessera']) || new Date().toISOString().split('T')[0];
              const dataScadenzaTessera = parseExcelDate(row.data_scad_quota_tessera) || (is2526 ? '2026-08-31' : '2025-08-31');
              const isRenewal = String(row.nuovo_o_rinnovo || '').toLowerCase().includes('rinnovo');
              
              if (!dryRun) {
                await db.insert(memberships).values({
                  memberId: currentMemberId,
                  membershipNumber: nTessera,
                  issueDate: new Date(dataEmissione),
                  expiryDate: new Date(dataScadenzaTessera),
                  fee: quotaTessera.toString(),
                  isRenewal: isRenewal,
                  seasonId: targetSeasonId,
                  status: is2526 ? 'active' : 'expired',
                  barcode: nTessera,
                  entityCardNumber: tesseraEnte || null,
                  sourceFile: 'gsheets_master'
                } as any);
              }
              countTessereCreate++;
              logRow(cf, 'INSERT', `Creata tessera ${nTessera}`);
            }
          }

          // --- AGGIUNTA 2: CERTIFICATI MEDICI IN P1 ---
          const certDateRaw = row.data_scad_cert_medico;
          if (certDateRaw) {
            const certExpiryStr = parseExcelDate(certDateRaw);
            if (certExpiryStr) {
              const certExpiry = new Date(certExpiryStr);
              if (certExpiry.getFullYear() >= 2020) {
                const certIssue = new Date(certExpiry);
                certIssue.setFullYear(certIssue.getFullYear() - 1);
                
                const certStatus = certExpiry > new Date() ? 'valid' : 'expired';
                
                if (!dryRun) {
                  await db.insert(medicalCertificates).values({
                    memberId: currentMemberId,
                    issueDate: certIssue,
                    expiryDate: certExpiry,
                    status: certStatus,
                    notes: 'importato da gsheets_master'
                  });
                }
                countCertificatiCreati++;
                logRow(cf, 'INSERT', `Certificato medico scad. ${certExpiryStr}`);
              }
            }
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
        const namePart = (String(row['Nome']||'') + String(row['Cognome']||'') + String(row['Telefono Lavoro']||'')).toLowerCase().replace(/\s+/g, '');
        const key = cf ? cf : (namePart ? '_NOCF_' + namePart : null);
        
        if (!key) { countSkipped++; continue; }
        if (!dedupMap.has(key)) {
          dedupMap.set(key, row);
        } else {
          countDupes++;
        }
      }

      const uniqueRows = Array.from(dedupMap.values()).slice(0, limit);
      countProcessed = uniqueRows.length;

      for (const row of uniqueRows) {
        let cf = normalizeCF(row['Cod. Fiscale']);
        try {
          let m: any = null;
          let matchType = '';
          
          if (cf) {
            const existing = await db.select().from(members).where(eq(members.fiscalCode, cf)).limit(1);
            if (existing.length > 0) m = existing[0];
          }
          
          if (!m && row['Nome'] && row['Cognome']) {
            const found = await findMemberByName(row['Nome'], row['Cognome']);
            if (found) {
              m = found;
              matchType = 'nome_match';
            }
          }

          if (m) {
            const updates: any = {};
            let emptyFieldsFilled = false;
            
            const track = (key: string, val: any) => {
              updates[key] = val;
              emptyFieldsFilled = true;
              updatedFieldsStats[key] = (updatedFieldsStats[key] || 0) + 1;
            };

            if (!m.dateOfBirth && row['Data di Nascita']) track('dateOfBirth', parseExcelDate(row['Data di Nascita']));
            if (!m.placeOfBirth && row['Città Nasc.']) track('placeOfBirth', row['Città Nasc.']);
            if (!m.address && row['Indirizzo']) track('address', row['Indirizzo']);
            if (!m.postalCode && row['CAP']) track('postalCode', String(row['CAP']));
            if (!m.city && row['Citta Resid.']) track('city', row['Citta Resid.']);
            if (!m.province && row['Provincia']) track('province', row['Provincia']);
            if (!m.internalId && row['Codice']) track('internalId', `ATH-${row['Codice']}`);
            if (!m.athenaId && row['Codice']) track('athenaId', String(row['Codice']));
            if (!m.tutor1FiscalCode && row['Cod.Fisc. Tutore']) track('tutor1FiscalCode', normalizeCF(row['Cod.Fisc. Tutore']));
            if (!m.tutor1Phone && row['Telefono Tutore']) track('tutor1Phone', String(row['Telefono Tutore']));
            if (!m.tutor1Email && row['Email Tutore']) track('tutor1Email', row['Email Tutore']);
            if (!m.tutor2FiscalCode && row['Cod.Fisc. Tutore 2']) track('tutor2FiscalCode', normalizeCF(row['Cod.Fisc. Tutore 2']));
            if (!m.tutor2Phone && row['Telefono Tutore 2']) track('tutor2Phone', String(row['Telefono Tutore 2']));
            if (!m.tutor2Email && row['Email Tutore 2']) track('tutor2Email', row['Email Tutore 2']);
            if (!m.nationality && row['Cittadinanza']) track('nationality', row['Cittadinanza']);
            if (!m.region && row['Regione']) track('region', row['Regione']);
            
            // Consensi (si aggiornano SEMPRE, sovrascrivendo)
            if (row['Cons. Immag.'] !== undefined) track('consentImage', row['Cons. Immag.'] === 'Sì' || row['Cons. Immag.'] === 'Si' || row['Cons. Immag.'] === '1' || row['Cons. Immag.'] === 1);
            if (row['Consenso Invio'] !== undefined) track('consentMarketing', row['Consenso Invio'] === 'Sì' || row['Consenso Invio'] === 'Si' || row['Consenso Invio'] === '1' || row['Consenso Invio'] === 1);
            if (row['News'] !== undefined || row['Con. Invio mail 2'] !== undefined) track('consentNewsletter', (row['News'] === 'Sì' || row['News'] === 'Si' || row['Con. Invio mail 2'] === 'Sì') ? 1 : 0);

            // 13 Campi Nuovi (F1-002b)
            if (!m.birthNation && row['Nazione Nasc.']) track('birthNation', row['Nazione Nasc.'].trim());
            if (!m.secondaryEmail && row['E-Mail 2']) track('secondaryEmail', row['E-Mail 2'].trim().toLowerCase());
            if (!m.profession && row['Professione']) track('profession', row['Professione'].trim());
            if (!m.documentType && row['Documento']) track('documentType', row['Documento'].trim());
            if (!m.documentExpiry && row['Scadenza Documento'] && parseExcelDate(row['Scadenza Documento'])) track('documentExpiry', new Date(parseExcelDate(row['Scadenza Documento'])!));
            if (!m.privacyDate && row['Data privacy'] && parseExcelDate(row['Data privacy'])) track('privacyDate', new Date(parseExcelDate(row['Data privacy'])!));
            if (!m.adminNotes && row['Note Aministrative']) track('adminNotes', row['Note Aministrative'].trim());
            if (!m.healthNotes && row['Note Sanitarie / Alimentari']) track('healthNotes', row['Note Sanitarie / Alimentari'].trim());
            if (!m.foodAlerts && row['Segnalaz. Alim. Sanit.']) track('foodAlerts', row['Segnalaz. Alim. Sanit.'].trim());
            if (!m.tags && row['Tags']) track('tags', row['Tags'].trim());
            if (!m.residencePermit && row['Permesso Soggiorno']) track('residencePermit', row['Permesso Soggiorno'].trim());
            if (!m.residencePermitExpiry && row['Scadenza Permesso Sog.'] && parseExcelDate(row['Scadenza Permesso Sog.'])) track('residencePermitExpiry', new Date(parseExcelDate(row['Scadenza Permesso Sog.'])!));

            if (!m.title && row['Titolo']) track('title', row['Titolo']);
            if (row['SMS'] !== undefined) track('consentSms', row['SMS'] === 'Si' ? 1 : 0);
            if (row['Mail PEC'] !== undefined) track('emailPec', row['Mail PEC']);
            if (!m.familyCode && row['Sigla Famiglia']) track('familyCode', row['Sigla Famiglia']);
            if (!m.athenaGroup && row['Gruppo']) track('athenaGroup', row['Gruppo']);
            if (!m.alias && row['Alias']) track('alias', row['Alias']);
            if (!m.cancellationDate && row['Data Cancellaz.']) track('cancellationDate', new Date(parseExcelDate(row['Data Cancellaz.'])!));
            if (!m.companyName && row['Ragione Sociale Lavoro']) track('companyName', row['Ragione Sociale Lavoro']);
            if (!m.companyFiscalCode && row['Cod. Fiscale Lavoro']) track('companyFiscalCode', normalizeCF(row['Cod. Fiscale Lavoro']));
            if (!m.companyAddress && row['Indirizzo Lavoro']) track('companyAddress', row['Indirizzo Lavoro']);
            if (!m.companyCap && row['CAP Lavoro']) track('companyCap', String(row['CAP Lavoro']));
            if (!m.companyCity && row['Città Lavoro']) track('companyCity', row['Città Lavoro']);
            if (!m.companyProvince && row['Prv. Lavoro']) track('companyProvince', row['Prv. Lavoro']);
            if (!m.companyPhone && row['Telefono Lavoro']) track('companyPhone', String(row['Telefono Lavoro']));
            if (!m.companyEmail && row['Mail Lavoro']) track('companyEmail', row['Mail Lavoro']);
            if (!m.documentIssuedBy && row['Documento rilasciato da']) track('documentIssuedBy', row['Documento rilasciato da']);
            if (!m.documentIssueDate && row['Data Ril. Doc.']) track('documentIssueDate', new Date(parseExcelDate(row['Data Ril. Doc.'])!));
            if (!m.bankName && row['Banca']) track('bankName', row['Banca']);
            if (!m.iban && row['IBAN']) track('iban', row['IBAN']);
            if (!m.sizeShirt && row['Taglia Maglia']) track('sizeShirt', row['Taglia Maglia']);
            if (!m.sizePants && row['Taglia pantaloni']) track('sizePants', row['Taglia pantaloni']);
            if (!m.sizeShoes && row['Taglia Scarpe']) track('sizeShoes', String(row['Taglia Scarpe']));
            if (!m.height && row['Altezza']) track('height', String(row['Altezza']));
            if (!m.weight && row['Peso']) track('weight', String(row['Peso']));
            if (!m.socialFacebook && row['ID Facebook']) track('socialFacebook', String(row['ID Facebook']));
            if (!m.website && row['Sito']) track('website', row['Sito']);
            if (!m.emergencyContact1Name && row['Contatto1']) track('emergencyContact1Name', row['Contatto1']);
            if (!m.emergencyContact1Phone && row['Tel Cont 1']) track('emergencyContact1Phone', String(row['Tel Cont 1']));
            if (!m.emergencyContact1Email && row['E-Mail Cont 1']) track('emergencyContact1Email', row['E-Mail Cont 1']);
            if (!m.emergencyContact2Name && row['Contatto2']) track('emergencyContact2Name', row['Contatto2']);
            if (!m.emergencyContact2Phone && row['Tel Cont 2']) track('emergencyContact2Phone', String(row['Tel Cont 2']));
            if (!m.emergencyContact2Email && row['E-Mail Cont 2']) track('emergencyContact2Email', row['E-Mail Cont 2']);
            if (!m.emergencyContact3Name && row['Contatto3']) track('emergencyContact3Name', row['Contatto3']);
            if (!m.emergencyContact3Phone && row['Tel Cont 3']) track('emergencyContact3Phone', String(row['Tel Cont 3']));
            if (!m.emergencyContact3Email && row['E-Mail Cont 3']) track('emergencyContact3Email', row['E-Mail Cont 3']);
            if (!m.sedeRiferimento && row['Sede Riferimento']) track('sedeRiferimento', row['Sede Riferimento']);
            if (!m.athenaMemberType && row['Tipo']) track('athenaMemberType', row['Tipo']);
            if (!m.firstEnrollmentDate && row['Data Richi. Iscri.']) track('firstEnrollmentDate', new Date(parseExcelDate(row['Data Richi. Iscri.'])!));
            if (row['Cons. Certif. Sanit.'] !== undefined) track('consentCertificate', row['Cons. Certif. Sanit.'] === 'Si' ? 1 : 0);
            if (row['Cons. Modulo'] !== undefined) track('consentModule', row['Cons. Modulo'] ? 1 : 0);
            if (!m.codiceCatastale && row['Cod. comune']) track('codiceCatastale', String(row['Cod. comune']));
            if (!m.mastroC && row['Mastro C.']) track('mastroC', String(row['Mastro C.']));
            if (!m.mastroCol && row['Mastro Col.']) track('mastroCol', String(row['Mastro Col.']));
            if (!m.codiceFe && row['Cod. Id. per FE']) track('codiceFe', String(row['Cod. Id. per FE']));
            if (!m.tutor1BirthDate && row['Data Nascita Tutore']) track('tutor1BirthDate', new Date(parseExcelDate(row['Data Nascita Tutore'])!));
            if (!m.tutor1BirthPlace && row['Luogo Nascita Tutore']) track('tutor1BirthPlace', row['Luogo Nascita Tutore']);
            if (!m.educationTitle && row['Titolo di studio']) track('educationTitle', row['Titolo di studio']);
            if (!m.educationInstitute && row['Istituto']) track('educationInstitute', row['Istituto']);
            if (!m.educationDate && row['Data titolo di studio']) track('educationDate', new Date(parseExcelDate(row['Data titolo di studio'])!));

            // update matchType
            if (matchType === 'nome_match') track('dataQualityFlag', 'nome_match');

            if (Object.keys(updates).length > 0) {
              if (emptyFieldsFilled) countEmptyFieldsFilled++;
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
              athenaId: row['Codice'] ? String(row['Codice']) : null,
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
              consentMarketing: row['Consenso Invio'] === 'Sì' || row['Consenso Invio'] === 'Si' || row['Consenso Invio'] === '1' || row['Consenso Invio'] === 1,
              consentNewsletter: (row['News'] === 'Sì' || row['News'] === 'Si' || row['Con. Invio mail 2'] === 'Sì') ? 1 : 0,

              birthNation: row['Nazione Nasc.']?.trim() || null,
              secondaryEmail: row['E-Mail 2']?.trim()?.toLowerCase() || null,
              profession: row['Professione']?.trim() || null,
              documentType: row['Documento']?.trim() || null,
              documentExpiry: row['Scadenza Documento'] && parseExcelDate(row['Scadenza Documento']) ? new Date(parseExcelDate(row['Scadenza Documento'])!) : null,
              privacyDate: row['Data privacy'] && parseExcelDate(row['Data privacy']) ? new Date(parseExcelDate(row['Data privacy'])!) : null,
              adminNotes: row['Note Aministrative']?.trim() || null,
              healthNotes: row['Note Sanitarie / Alimentari']?.trim() || null,
              foodAlerts: row['Segnalaz. Alim. Sanit.']?.trim() || null,
              tags: row['Tags']?.trim() || null,
              residencePermit: row['Permesso Soggiorno']?.trim() || null,
              residencePermitExpiry: row['Scadenza Permesso Sog.'] && parseExcelDate(row['Scadenza Permesso Sog.']) ? new Date(parseExcelDate(row['Scadenza Permesso Sog.'])!) : null,

              title: row['Titolo'] || null,
              consentSms: row['SMS'] === 'Si' ? 1 : 0,
              emailPec: row['Mail PEC'] || null,
              familyCode: row['Sigla Famiglia'] || null,
              athenaGroup: row['Gruppo'] || null,
              alias: row['Alias'] || null,
              cancellationDate: row['Data Cancellaz.'] && parseExcelDate(row['Data Cancellaz.']) ? new Date(parseExcelDate(row['Data Cancellaz.'])!) : null,
              companyName: row['Ragione Sociale Lavoro'] || null,
              companyFiscalCode: normalizeCF(row['Cod. Fiscale Lavoro']),
              companyAddress: row['Indirizzo Lavoro'] || null,
              companyCap: row['CAP Lavoro'] ? String(row['CAP Lavoro']) : null,
              companyCity: row['Città Lavoro'] || null,
              companyProvince: row['Prv. Lavoro'] || null,
              companyPhone: row['Telefono Lavoro'] ? String(row['Telefono Lavoro']) : null,
              companyEmail: row['Mail Lavoro'] || null,
              documentIssuedBy: row['Documento rilasciato da'] || null,
              documentIssueDate: row['Data Ril. Doc.'] && parseExcelDate(row['Data Ril. Doc.']) ? new Date(parseExcelDate(row['Data Ril. Doc.'])!) : null,
              bankName: row['Banca'] || null,
              iban: row['IBAN'] || null,
              sizeShirt: row['Taglia Maglia'] || null,
              sizePants: row['Taglia pantaloni'] || null,
              sizeShoes: row['Taglia Scarpe'] ? String(row['Taglia Scarpe']) : null,
              height: row['Altezza'] ? String(row['Altezza']) : null,
              weight: row['Peso'] ? String(row['Peso']) : null,
              socialFacebook: row['ID Facebook'] ? String(row['ID Facebook']) : null,
              website: row['Sito'] || null,
              emergencyContact1Name: row['Contatto1'] || null,
              emergencyContact1Phone: row['Tel Cont 1'] ? String(row['Tel Cont 1']) : null,
              emergencyContact1Email: row['E-Mail Cont 1'] || null,
              emergencyContact2Name: row['Contatto2'] || null,
              emergencyContact2Phone: row['Tel Cont 2'] ? String(row['Tel Cont 2']) : null,
              emergencyContact2Email: row['E-Mail Cont 2'] || null,
              emergencyContact3Name: row['Contatto3'] || null,
              emergencyContact3Phone: row['Tel Cont 3'] ? String(row['Tel Cont 3']) : null,
              emergencyContact3Email: row['E-Mail Cont 3'] || null,
              sedeRiferimento: row['Sede Riferimento'] || null,
              athenaMemberType: row['Tipo'] || null,
              firstEnrollmentDate: row['Data Richi. Iscri.'] && parseExcelDate(row['Data Richi. Iscri.']) ? new Date(parseExcelDate(row['Data Richi. Iscri.'])!) : null,
              consentCertificate: row['Cons. Certif. Sanit.'] === 'Si' ? 1 : 0,
              consentModule: row['Cons. Modulo'] ? 1 : 0,
              codiceCatastale: row['Cod. comune'] ? String(row['Cod. comune']) : null,
              mastroC: row['Mastro C.'] ? String(row['Mastro C.']) : null,
              mastroCol: row['Mastro Col.'] ? String(row['Mastro Col.']) : null,
              codiceFe: row['Cod. Id. per FE'] ? String(row['Cod. Id. per FE']) : null,
              tutor1BirthDate: row['Data Nascita Tutore'] && parseExcelDate(row['Data Nascita Tutore']) ? new Date(parseExcelDate(row['Data Nascita Tutore'])!) : null,
              tutor1BirthPlace: row['Luogo Nascita Tutore'] || null,
              educationTitle: row['Titolo di studio'] || null,
              educationInstitute: row['Istituto'] || null,
              educationDate: row['Data titolo di studio'] && parseExcelDate(row['Data titolo di studio']) ? new Date(parseExcelDate(row['Data titolo di studio'])!) : null,
              
              dataQualityFlag: (matchType === '') && !cf && row['Nome'] && row['Cognome'] ? 'incompleto' : (matchType === '' && row['Nome'] ? 'omonimo_da_verificare' : null)
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
        
        try {
          let m: any = null;
          if (cf) {
            const existing = await db.select().from(members).where(eq(members.fiscalCode, cf)).limit(1);
            if (existing.length > 0) m = existing[0];
          }
          
          if (!m && row['Nome'] && row['Cognome']) {
            const found = await findMemberByName(row['Nome'], row['Cognome']);
            if (found) m = found;
          }

          if (!m) {
            // C3: Crea anagrafica base da P3
            if (!dryRun) {
              const [newM] = await db.insert(members).values({
                fiscalCode: cf || null,
                firstName: row['Nome'] || 'Sconosciuto',
                lastName: row['Cognome'] || 'Sconosciuto',
                phone: row['Cell.'] ? String(row['Cell.']) : null,
                email: row['E-mail'] || null,
                participantType: 'SOCIO',
                dataQualityFlag: 'creato_da_iscrizioni',
                fromWhere: 'athena_iscrizioni'
              });
              const created = await db.select().from(members).where(eq(members.id, newM.insertId)).limit(1);
              m = created[0];
            } else {
              m = { id: 99999 }; // Dummy per dry-run
            }
            logRow(cf || 'NOCF', 'INSERT', 'Anagrafica base creata da P3');
            notFoundCFs.push(cf || 'NOCF');
            countInserted++;
          }
          // === INIZIO LOGICA TESSERE E ENROLLMENTS ===
          const membershipNumber = row['Tessera'] ? String(row['Tessera']).trim() : '';
          let seasonId: number | null = null;
          let isValidTessera = false;
          let tesseraIs2526 = false;

          if (!membershipNumber || membershipNumber.length < 8 || membershipNumber === '2526-' || membershipNumber === '2425-') {
            logRow(cf, 'SKIP', 'Tessera mancante o fittizia nel file');
            countTessereMancanti++;
            if (!dryRun) {
              if (m.dataQualityFlag !== 'omonimo_da_verificare' && m.dataQualityFlag !== 'incompleto') {
                await db.update(members).set({ dataQualityFlag: 'tessera_mancante_da_assegnare' }).where(eq(members.id, m.id));
              }
            }
          } else if (/^\d+$/.test(membershipNumber) && !membershipNumber.startsWith('2526') && !membershipNumber.startsWith('2425')) {
            logRow(cf, 'SKIP', 'tessera_athena_storica');
            countTessereMancanti++; // Ai fini della stagione in corso manca
            if (!dryRun) {
              await db.update(members).set({ previousMembershipNumber: membershipNumber }).where(eq(members.id, m.id));
              if (m.dataQualityFlag !== 'omonimo_da_verificare' && m.dataQualityFlag !== 'incompleto') {
                await db.update(members).set({ dataQualityFlag: 'tessera_mancante_da_assegnare' }).where(eq(members.id, m.id));
              }
            }
          } else {
            if (membershipNumber.startsWith('2526')) {
              seasonId = 1;
              tesseraIs2526 = true;
              isValidTessera = true;
            } else if (membershipNumber.startsWith('2425')) {
              seasonId = 3;
              tesseraIs2526 = false;
              isValidTessera = true;
            } else {
              logRow(cf, 'SKIP', `Tessera ${membershipNumber} ignorata (stagione non gestita)`);
              countTessereSaltate++;
            }
          }

          if (isValidTessera && seasonId !== null) {
            // Controlla se esiste già una tessera per member_id + season_id
            const existingTessera = await db.select().from(memberships)
              .where(sql`member_id = ${m.id} AND season_id = ${seasonId}`).limit(1);
            
            if (existingTessera.length > 0) {
              logRow(cf, 'SKIP', `Tessera ${membershipNumber} già su DB per stagione ${seasonId}`);
              countTessereSaltate++;
            } else {
              const fallbackDate = new Date(); fallbackDate.setFullYear(fallbackDate.getFullYear() - 1);
              const expiryRaw = parseExcelDate(row['Scad. Tessera']);
              let issueDateObj = expiryRaw ? new Date(expiryRaw) : fallbackDate;
              issueDateObj.setFullYear(issueDateObj.getFullYear() - 1);
              const issueDateStr = issueDateObj.toISOString().split('T')[0];
              
              const insertTessera: any = {
                memberId: m.id,
                membershipNumber: membershipNumber,
                barcode: `B-${membershipNumber}-${Math.floor(Math.random()*10000)}`,
                issueDate: issueDateStr,
                expiryDate: expiryRaw || fallbackDate.toISOString().split('T')[0],
                previousMembershipNumber: String(row['Matricola'] || ''),
                status: tesseraIs2526 ? 'active' : 'expired',
                type: 'standard',
                seasonId: seasonId,
                isRenewal: false
              };
              if (!dryRun) {
                await db.insert(memberships).values(insertTessera);
              }
              countTessereCreate++;
              countInserted++;
              logRow(cf, 'INSERT', `Tessera ${membershipNumber} creata (stagione ${seasonId})`);
            }
          }

          // === LOGICA ENROLLMENTS ===
          const skuRaw = row['Sigla'] ? String(row['Sigla']).trim() : '';
          const courseName = row['Corso'] ? String(row['Corso']).trim() : 'Corso Sconosciuto';
          
          if (skuRaw) {
            let courseSeasonId: number | null = null;
            if (skuRaw.startsWith('2526')) courseSeasonId = 1;
            else if (skuRaw.startsWith('2425')) courseSeasonId = 3;
            else courseSeasonId = null;

            let courseId: number | null = null;
            
            // Cerca corso per SKU (Esatto)
            const exactCourse = await db.select().from(courses).where(eq(courses.sku, skuRaw)).limit(1);
            if (exactCourse.length > 0) {
              courseId = exactCourse[0].id;
              countCorsiMatchEsatto++;
            } else {
              // Cerca corso per SKU (Prefisso)
              const prefixCourses = await db.select().from(courses).where(like(courses.sku, `${skuRaw}%`));
              if (prefixCourses.length > 0) {
                courseId = prefixCourses[0].id;
                countCorsiMatchPrefisso++;
                if (prefixCourses.length > 1) {
                  logRow(cf, 'MATCH', `Corso match_prefisso_multiplo: ${skuRaw} -> ${prefixCourses[0].sku}`);
                }
              } else {
                // Crea placeholder
                if (!dryRun) {
                  const [newCourse] = await db.insert(courses).values({
                    sku: skuRaw,
                    name: courseName,
                    activityType: 'storico',
                    seasonId: courseSeasonId,
                    active: false
                  });
                  courseId = newCourse.insertId;
                } else {
                  courseId = 99999 + countCorsiPlaceholderCreati; // Dummy
                }
                countCorsiPlaceholderCreati++;
                logRow(cf, 'INSERT', `Corso placeholder ${skuRaw} creato`);
              }
            }

            if (courseId !== null) {
              // Controlla duplicato
              const existingEnrollment = await db.select().from(enrollments)
                .where(sql`member_id = ${m.id} AND course_id = ${courseId}`).limit(1);
              
              if (existingEnrollment.length > 0) {
                logRow(cf, 'SKIP', `Enrollment per ${skuRaw} già presente`);
                countEnrollmentSaltati++;
              } else {
                const statusStr = String(row['Stato Iscrizione'] || '').trim().toLowerCase();
                let enrStatus = 'active'; // Default
                if (statusStr.includes('confermato')) enrStatus = 'active';
                else if (statusStr.includes('attesa')) enrStatus = 'pending';
                else if (statusStr.includes('annullato') || statusStr.includes('ritirato')) enrStatus = 'cancelled';
                
                const enrDate = parseExcelDate(row['Data Iscri.']) || new Date().toISOString().split('T')[0];

                const insertEnrollment: any = {
                  memberId: m.id,
                  courseId: courseId,
                  status: enrStatus,
                  enrollmentDate: new Date(enrDate),
                  seasonId: courseSeasonId,
                  sourceFile: 'athena_iscrizioni',
                  notes: String(row['Note interne'] || '').trim() || null
                };

                if (!dryRun) {
                  await db.insert(enrollments).values(insertEnrollment);
                }
                countEnrollmentCreate++;
                countInserted++;
                logRow(cf, 'INSERT', `Enrollment ${skuRaw} creato`);
              }
            }
          } else {
            logRow(cf, 'SKIP', 'Nessuna sigla corso (SKU) presente');
          }
          // === FINE LOGICA TESSERE E ENROLLMENTS ===
        } catch (e: any) {
          countErrors++;
          logRow(cf, 'ERROR', e.message);
        }
      }
    }


    if (passata === 4) {
      const file = 'temp_import/estrap_20260316_estrapolazione_ISCRITTI WORKSHOP.xlsx';
      if (!fs.existsSync(file)) throw new Error(`File non trovato: ${file}`);
      const wb = xlsx.read(fs.readFileSync(file), { cellDates: true });
      const rows = xlsx.utils.sheet_to_json<any>(wb.Sheets['WS_master_dati'] || wb.Sheets[wb.SheetNames[0]]);
      
      const toProcess = rows.slice(0, limit);
      countProcessed = toProcess.length;

      for (const row of toProcess) {
        const cfRaw = row['codice_fiscale'];
        const cf = normalizeCF(cfRaw);
        
        try {
          let m: any = null;
          if (cf) {
            const existing = await db.select().from(members).where(eq(members.fiscalCode, cf)).limit(1);
            if (existing.length > 0) m = existing[0];
          }

          if (!m && !dryRun) {
            countP4PersoneNuove++;
            // Dummy logic if we want to create a new member, but user says "Persone nuove da creare", so we create a dummy one or real one.
            const name = String(row['nome'] || '').trim();
            const lastName = String(row['cognome'] || '').trim();
            const email = String(row['email'] || '').trim();
            const phone = String(row['telefono'] || '').trim();
            
            const insertData: any = {
              firstName: name || 'Sconosciuto',
              lastName: lastName || 'Sconosciuto',
              fiscalCode: cf,
              email: email || null,
              phone: phone || null,
              sourceFile: 'estrapolazione_ISCRITTI WORKSHOP',
              dataQualityFlag: 'mancano_dati_obbligatori'
            };
            const created = await db.insert(members).values(insertData);
            const insertedId = created[0].insertId;
            m = (await db.select().from(members).where(eq(members.id, insertedId)).limit(1))[0];
            logRow(cf, 'INSERT', `Anagrafica nuova da P4 (id: ${m.id})`);
          } else if (!m && dryRun) {
            countP4PersoneNuove++;
            m = { id: 99999 + countP4PersoneNuove }; // Dummy
          }

          if (m) {
            // Find or create course
            const skuRaw = String(row['SKU/codice'] || '').trim();
            let courseId = null;
            let courseSeasonId = null;

            if (skuRaw) {
              let courseRaw = await db.select().from(courses).where(eq(courses.sku, skuRaw)).limit(1);
              if (courseRaw.length === 0) {
                courseRaw = await db.select().from(courses).where(like(courses.sku, skuRaw + '%')).limit(1);
              }
              if (courseRaw.length > 0) {
                courseId = courseRaw[0].id;
                courseSeasonId = courseRaw[0].seasonId;
              } else {
                const placeholderSku = `WS2526${skuRaw.toUpperCase().replace(/\s/g, '')}`;
                courseRaw = await db.select().from(courses).where(eq(courses.sku, placeholderSku)).limit(1);
                if (courseRaw.length === 0) {
                  if (!dryRun) {
                    const insertCourse: any = {
                      name: String(row['ws'] || placeholderSku).substring(0, 100),
                      sku: placeholderSku,
                      activityType: 'storico',
                      isActive: false
                    };
                    const res = await db.insert(courses).values(insertCourse);
                    courseId = res[0].insertId;
                  } else {
                    courseId = 88888;
                  }
                  logRow(cf, 'INSERT', `Workshop placeholder ${placeholderSku} creato`);
                } else {
                  courseId = courseRaw[0].id;
                  courseSeasonId = courseRaw[0].seasonId;
                }
              }
            }

            if (courseId !== null) {
              // Enrollment
              const notesParts = [];
              if (row['note']) notesParts.push(`Note: ${row['note']}`);
              if (row['presenza']) notesParts.push(`Presenza: ${row['presenza']}`);
              if (row['inserito_su_athena']) notesParts.push(`Su Athena: ${row['inserito_su_athena']}`);
              if (row['ricevuta_fatta']) notesParts.push(`Ricevuta: ${row['ricevuta_fatta']}`);
              if (row['fattura_fatta']) notesParts.push(`Fattura: ${row['fattura_fatta']}`);
              if (row['verifica_pagamento']) notesParts.push(`Verifica Pagamento: ${row['verifica_pagamento']}`);

              const insertEnrollment: any = {
                memberId: m.id,
                courseId: courseId,
                status: 'active',
                enrollmentDate: new Date(), // Non abbiamo data iscrizione certa
                seasonId: courseSeasonId,
                sourceFile: 'estrapolazione_ISCRITTI WORKSHOP',
                notes: notesParts.join(' | ') || null
              };

              let enrollmentId = 77777;
              if (!dryRun) {
                const res = await db.insert(enrollments).values(insertEnrollment);
                enrollmentId = res[0].insertId;
              }
              countP4EnrollmentCreati++;
              logRow(cf, 'INSERT', `Enrollment WS ${skuRaw} creato`);

              // Payment
              const quotaRaw = row['quota'];
              const quotaFinale = row['importo\nfinale'];
              const amount = parseFloat(quotaFinale !== undefined ? quotaFinale : quotaRaw) || 0;
              
              if (amount > 0 || quotaRaw) {
                const payMethodStr = String(row['digit_cash_tess_non_tess'] || '').toLowerCase();
                let method = 'contanti';
                if (payMethodStr.includes('bonifico')) method = 'bonifico';
                else if (payMethodStr.includes('pos') || payMethodStr.includes('carta')) method = 'carta';

                const payDateRaw = row['data_pagamento_ricevuta'];
                let payDate = null;
                if (payDateRaw) {
                   const d = parseExcelDate(payDateRaw);
                   if (d) payDate = new Date(d);
                }

                const insertPayment: any = {
                  memberId: m.id,
                  enrollmentId: enrollmentId,
                  amount: amount.toString(),
                  type: 'course',
                  status: 'paid',
                  paidDate: payDate,
                  paymentMethod: method,
                  notes: row['codice_sconto'] ? `Sconto: ${row['codice_sconto']}` : null
                };

                if (!dryRun) {
                  await db.insert(payments).values(insertPayment);
                }
                countP4PagamentiCreati++;
                logRow(cf, 'INSERT', `Pagamento WS creato (${amount}€)`);
              }
            }
          }
        } catch (e: any) {
          countErrors++;
          logRow(cf, 'ERROR', e.message);
        }
      }
    }

    if (passata === 5) {
      const file = 'temp_import/estrap_20260417_estrapolazione_Master_per_importazione_Bitrix.xlsx';
      if (!fs.existsSync(file)) throw new Error(`File non trovato: ${file}`);
      const wb = xlsx.read(fs.readFileSync(file), { cellDates: true });
      const rows = xlsx.utils.sheet_to_json<any>(wb.Sheets['importazione'] || wb.Sheets[wb.SheetNames[0]]);
      
      const toProcess = rows.slice(0, limit);
      countProcessed = toProcess.length;

      for (const row of toProcess) {
        const cfRaw = row['an_cod_fiscale'];
        const cf = normalizeCF(cfRaw);
        
        try {
          let m: any = null;
          if (cf) {
            const existing = await db.select().from(members).where(eq(members.fiscalCode, cf)).limit(1);
            if (existing.length > 0) m = existing[0];
          }

          if (m) {
            // Analizza SZ1-SZ4
            for (let i = 1; i <= 4; i++) {
              const quotaRaw = row[`sz${i}_totale_quota`];
              const amount = parseFloat(quotaRaw) || 0;
              
              if (amount > 0) {
                // Trova enrollment
                const descCorso = String(row[`sz${i}_seleziona_il_corso`] || '').trim();
                let enrollmentId = null;
                
                if (descCorso) {
                   const courseList = await db.select().from(courses).where(like(courses.name, `%${descCorso.substring(0, 15)}%`)).limit(10);
                   if (courseList.length > 0) {
                     const courseIds = courseList.map(c => c.id);
                     const enr = await db.select().from(enrollments).where(and(eq(enrollments.memberId, m.id), inArray(enrollments.courseId, courseIds))).limit(1);
                     if (enr.length > 0) {
                       enrollmentId = enr[0].id;
                     }
                   }
                }
                
                if (!enrollmentId) countP5SenzaEnrollment++;
                
                const methodStr = String(row[`sz${i}_note_pagamenti`] || row['consegna_wk_e_bm'] || '').toUpperCase();
                let method = 'cash';
                if (methodStr.includes('WELCOMEKIT')) method = 'welcomekit';
                else if (methodStr.includes('POSTE')) method = 'bonifico_poste';
                else if (methodStr.includes('BPM')) method = 'bonifico_bpm';
                else if (methodStr.includes('BONIFICO')) method = 'bonifico';
                else if (methodStr.includes('POS')) method = 'pos';
                else if (methodStr.includes('ONLINE')) method = 'online';

                let payDate = null;
                const payDateRaw = row[`sz${i}_data_pag__saldo_ann_`] || row[`sz${i}_data_pag_lez_prova`];
                if (payDateRaw) {
                   const d = parseExcelDate(payDateRaw);
                   if (d) payDate = new Date(d);
                }

                let confDate = null;
                if (row[`sz${i}_entrato_sul_conto_il`]) {
                   const d = parseExcelDate(row[`sz${i}_entrato_sul_conto_il`]);
                   if (d) confDate = new Date(d);
                }
                
                const operatorStr = row['chi_scrive'] ? String(row['chi_scrive']).trim() : null;
                const rawSource = row['vendita'] ? String(row['vendita']).trim() : 'gsheets_master';
                const sourceStr = rawSource.length > 20 ? rawSource.substring(0, 20) : rawSource;

                const tipoSconto = row[`sz${i}_tipo_di_sconto`] ? `Tipo sconto: ${row[`sz${i}_tipo_di_sconto`]}` : '';
                let notesArray = [];
                if (tipoSconto) notesArray.push(tipoSconto);
                const notesStr = notesArray.length > 0 ? notesArray.join(' | ') : null;

                const parseDec = (v: any) => {
                  const p = parseFloat(v);
                  return isNaN(p) ? null : p.toString();
                };

                const depositRaw = parseDec(row[`sz${i}_acconto_lez_prova`]) || parseDec(row[`sz${i}_acconto_o_credito`]) || null;

                const insertPayment: any = {
                  memberId: m.id,
                  enrollmentId: enrollmentId,
                  amount: amount.toString(),
                  paidDate: payDate,
                  status: payDate ? 'paid' : 'pending',
                  paymentMethod: method,
                  discountCode: row[`sz${i}_codice_sconto`] || null,
                  discountValue: parseDec(row[`sz${i}_valore_scontato`]),
                  annualBalance: parseDec(row[`sz${i}_saldo_annuale`]),
                  source: sourceStr,
                  operatorName: operatorStr,
                  type: 'course',
                  transferConfirmationDate: confDate,
                  period: row[`sz${i}_periodo`] || null,
                  deposit: depositRaw,
                  totalQuota: parseDec(row['saldo_totale']),
                  receiptsCount: row['numero_ricevute_fatte'] && !isNaN(parseInt(row['numero_ricevute_fatte'], 10)) ? parseInt(row['numero_ricevute_fatte'], 10) : null,
                  quotaDescription: row[`sz${i}_descrizione_quota`] || null,
                  notes: notesStr
                };

                if (!dryRun) await db.insert(payments).values(insertPayment);
                countP5PagamentiSZ++;
                logRow(cf, 'INSERT', `Pagamento SZ${i} creato (${amount}€)`);
              }
            }

            // Analizza GBRH
            const gbrhAmount = parseFloat(row['gbrh_valore_importo']) || 0;
            if (gbrhAmount > 0) {
              const operatorStr = row['chi_scrive'] ? String(row['chi_scrive']).trim() : null;
              const rawSource = row['vendita'] ? String(row['vendita']).trim() : 'gsheets_master';
              const sourceStr = rawSource.length > 20 ? rawSource.substring(0, 20) : rawSource;
              const typeStr = row['gbrh_tipo'] ? String(row['gbrh_tipo']).trim().toLowerCase() : 'voucher';

              const insertPaymentGBRH: any = {
                memberId: m.id,
                amount: gbrhAmount.toString(),
                type: typeStr || 'voucher',
                status: 'paid',
                notes: row['gbrh_acquistato_utilizzato_per_motivazione'] || null,
                source: sourceStr,
                operatorName: operatorStr
              };

              if (!dryRun) await db.insert(payments).values(insertPaymentGBRH);
              countP5PagamentiGBRH++;
              logRow(cf, 'INSERT', `Pagamento GBRH creato (${gbrhAmount}€)`);
            }
          }
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
    if (passata === 1) {
      console.log(`--- Statistiche P1 (Master) ---`);
      console.log(`Tessere Create: ${countTessereCreate}`);
      console.log(`Tessere Saltate (duplicati): ${countTessereSaltate}`);
      console.log(`Certificati Creati: ${countCertificatiCreati}`);
    }
    if (passata === 3) {
      console.log(`--- Statistiche P3 (Iscrizioni) ---`);
      console.log(`Tessere Create: ${countTessereCreate}`);
      console.log(`Tessere Saltate (duplicati): ${countTessereSaltate}`);
      console.log(`Tessere Mancanti (segnalate): ${countTessereMancanti}`);
      console.log(`Enrollments Creati: ${countEnrollmentCreate}`);
      console.log(`Enrollments Saltati (duplicati): ${countEnrollmentSaltati}`);
      console.log(`Corsi con match esatto: ${countCorsiMatchEsatto}`);
      console.log(`Corsi con match prefisso: ${countCorsiMatchPrefisso}`);
      console.log(`Corsi Placeholder Creati: ${countCorsiPlaceholderCreati}`);
    }
    if (passata === 4) {
      console.log(`--- Statistiche P4 (Workshop) ---`);
      // CF unici: non abbiamo notFoundCfs in P4 popolate bene, ma countProcessed per riga è sufficiente (il file è già per persona teoricamente o con duplicati ma usiamo Sets se necessario. Per ora lasciamo così)
      console.log(`Righe file: ${countProcessed}`);
      console.log(`Persone trovate in members: ${countProcessed - countP4PersoneNuove}`);
      console.log(`Persone nuove da creare: ${countP4PersoneNuove}`);
      console.log(`Enrollments workshop da creare: ${countP4EnrollmentCreati}`);
      console.log(`Pagamenti da creare: ${countP4PagamentiCreati}`);
    }
    if (passata === 5) {
      console.log(`--- Statistiche P5 (Pagamenti MASTER) ---`);
      console.log(`Processati: ${countProcessed}`);
      console.log(`Pagamenti sz creati: ${countP5PagamentiSZ}`);
      console.log(`Pagamenti gbrh creati: ${countP5PagamentiGBRH}`);
      console.log(`Senza enrollment: ${countP5SenzaEnrollment}`);
    }
  }
}
run();
