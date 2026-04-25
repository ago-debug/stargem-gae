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

          if (!membershipNumber) {
            logRow(cf, 'SKIP', 'Tessera mancante nel file');
            countTessereMancanti++;
            if (!dryRun) {
              // Se la tessera è mancante, non creiamo la membership, ma flaggiamo il member se non ha già un flag peggiore
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
              .where(sql\`member_id = \${m.id} AND season_id = \${seasonId}\`).limit(1);
            
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
                barcode: \`B-\${membershipNumber}-\${Math.floor(Math.random()*10000)}\`,
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
              logRow(cf, 'INSERT', \`Tessera \${membershipNumber} creata (stagione \${seasonId})\`);
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
            
            // Cerca corso per SKU
            const foundCourse = await db.select().from(courses).where(eq(courses.sku, skuRaw)).limit(1);
            if (foundCourse.length > 0) {
              courseId = foundCourse[0].id;
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
              logRow(cf, 'INSERT', \`Corso placeholder \${skuRaw} creato\`);
            }

            if (courseId !== null) {
              // Controlla duplicato
              const existingEnrollment = await db.select().from(enrollments)
                .where(sql\`member_id = \${m.id} AND course_id = \${courseId}\`).limit(1);
              
              if (existingEnrollment.length > 0) {
                logRow(cf, 'SKIP', \`Enrollment per \${skuRaw} già presente\`);
                countEnrollmentSaltati++;
              } else {
                const statusStr = String(row['Stato'] || '').trim().toLowerCase();
                let enrStatus = 'active'; // Default
                if (statusStr.includes('confermato')) enrStatus = 'confirmed';
                else if (statusStr.includes('attesa')) enrStatus = 'pending';
                else if (statusStr.includes('annullato')) enrStatus = 'cancelled';
                
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
                logRow(cf, 'INSERT', \`Enrollment \${skuRaw} creato\`);
              }
            }
          } else {
            logRow(cf, 'SKIP', 'Nessuna sigla corso (SKU) presente');
          }
          // === FINE LOGICA TESSERE E ENROLLMENTS ===
