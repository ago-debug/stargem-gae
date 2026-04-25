const fs = require('fs');

let content = fs.readFileSync('scripts/import_soci.ts', 'utf8');

// 1. Aggiungi payments agli import
content = content.replace(
  "import { members, memberships, courses, enrollments } from '../shared/schema';",
  "import { members, memberships, courses, enrollments, payments } from '../shared/schema';"
);

// 2. Modifica controlli passata
content = content.replace("passata > 3", "passata > 4");
content = content.replace("o 2 o 3)", "o 2 o 3 o 4)");

// 3. Aggiungi contatori P4
content = content.replace(
  "let countCorsiPlaceholderCreati = 0;",
  "let countCorsiPlaceholderCreati = 0;\n  let countP4PersoneNuove = 0;\n  let countP4EnrollmentCreati = 0;\n  let countP4PagamentiCreati = 0;"
);

// 4. Aggiungi stampe P4 in finally
const p4Stats = `    if (passata === 4) {
      console.log(\`--- Statistiche P4 (Workshop) ---\`);
      console.log(\`CF unici: \${new Set(notFoundCFs).size + countProcessed}\`); // grossomodo
      console.log(\`Persone trovate in members: \${countProcessed - countP4PersoneNuove}\`);
      console.log(\`Persone nuove da creare: \${countP4PersoneNuove}\`);
      console.log(\`Enrollments workshop da creare: \${countP4EnrollmentCreati}\`);
      console.log(\`Pagamenti da creare: \${countP4PagamentiCreati}\`);
    }`;
content = content.replace("process.exit(0);", p4Stats + "\n    process.exit(0);");

// 5. Aggiungi il blocco passata === 4 prima del catch
const p4Block = `
    if (passata === 4) {
      const file = 'temp_import/estrap_20260316_estrapolazione_ISCRITTI WORKSHOP.xlsx';
      if (!fs.existsSync(file)) throw new Error(\`File non trovato: \${file}\`);
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
            const insertedId = created.insertId;
            m = (await db.select().from(members).where(eq(members.id, insertedId)).limit(1))[0];
            logRow(cf, 'INSERT', \`Anagrafica nuova da P4 (id: \${m.id})\`);
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
                const placeholderSku = \`WS2526\${skuRaw.toUpperCase().replace(/\\s/g, '')}\`;
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
                    courseId = res.insertId;
                  } else {
                    courseId = 88888;
                  }
                  logRow(cf, 'INSERT', \`Workshop placeholder \${placeholderSku} creato\`);
                } else {
                  courseId = courseRaw[0].id;
                  courseSeasonId = courseRaw[0].seasonId;
                }
              }
            }

            if (courseId !== null) {
              // Enrollment
              const notesParts = [];
              if (row['note']) notesParts.push(\`Note: \${row['note']}\`);
              if (row['presenza']) notesParts.push(\`Presenza: \${row['presenza']}\`);
              if (row['inserito_su_athena']) notesParts.push(\`Su Athena: \${row['inserito_su_athena']}\`);
              if (row['ricevuta_fatta']) notesParts.push(\`Ricevuta: \${row['ricevuta_fatta']}\`);
              if (row['fattura_fatta']) notesParts.push(\`Fattura: \${row['fattura_fatta']}\`);
              if (row['verifica_pagamento']) notesParts.push(\`Verifica Pagamento: \${row['verifica_pagamento']}\`);

              const insertEnrollment: any = {
                memberId: m.id,
                courseId: courseId,
                status: 'confirmed',
                enrollmentDate: new Date(), // Non abbiamo data iscrizione certa
                seasonId: courseSeasonId,
                sourceFile: 'estrapolazione_ISCRITTI WORKSHOP',
                notes: notesParts.join(' | ') || null
              };

              let enrollmentId = 77777;
              if (!dryRun) {
                const res = await db.insert(enrollments).values(insertEnrollment);
                enrollmentId = res.insertId;
              }
              countP4EnrollmentCreati++;
              logRow(cf, 'INSERT', \`Enrollment WS \${skuRaw} creato\`);

              // Payment
              const quotaRaw = row['quota'];
              const quotaFinale = row['importo\\nfinale'];
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
                  notes: row['codice_sconto'] ? \`Sconto: \${row['codice_sconto']}\` : null
                };

                if (!dryRun) {
                  await db.insert(payments).values(insertPayment);
                }
                countP4PagamentiCreati++;
                logRow(cf, 'INSERT', \`Pagamento WS creato (\${amount}€)\`);
              }
            }
          }
        } catch (e: any) {
          countErrors++;
          logRow(cf, 'ERROR', e.message);
        }
      }
    }
`;

content = content.replace("  } catch (error: any) {", p4Block + "\n  } catch (error: any) {");

fs.writeFileSync('scripts/import_soci.ts', content, 'utf8');
console.log('PATCH APPLICATA');
