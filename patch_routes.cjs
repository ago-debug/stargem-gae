const fs = require('fs');
const file = './server/routes.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('import { validateCF }')) {
  code = `import { validateCF } from "../shared/utils/cf-validator";\n` + code;
}

// 1. Add missing properties to the routing output
code = code.replace(
  `let unchanged = 0;
      const errors: { row: number; message: string }[] = [];
      const previewRows: any[] = [];`,
  `let unchanged = 0;
      const errors: { row: number; message: string }[] = [];
      const previewRows: any[] = [];
      const missingCfRecords: any[] = [];
      const invalidCfRecords: any[] = [];
      const cfWarnings: any[] = [];
      const routingStats = {
        tessere: 0,
        certificati: 0,
        enrollments: 0
      };
      const missingSeasonRecords: any[] = [];`
);

// 2. CF Validation block in 'members'
code = code.replace(
  `if (!memberData.firstName && !memberData.lastName) {
              skipped++;
              continue;
            }

            // --- INIZIO: F1-PROTOCOLLO-005 Sanitizzazione e Tracking ---`,
  `if (!memberData.firstName && !memberData.lastName) {
              skipped++;
              continue;
            }

            let cfBloccante = false;
            if (memberData.fiscalCode) {
              const cfInfo = validateCF(memberData.fiscalCode);
              if (!cfInfo.isValid) {
                errors.push({ row: rowNum, message: "CF Formalmente Invalido o Checksum errato" });
                const pr = {
                   cf: memberData.fiscalCode,
                   nome: memberData.firstName || "-",
                   cognome: memberData.lastName || "-",
                   azione: 'BLOCCO_CF_INVALIDO',
                   campiModificati: ["CF Invalido"],
                   modificheCasing: []
                };
                previewRows.push(pr);
                invalidCfRecords.push(pr);
                cfBloccante = true;
                skipped++;
              } else {
                if (memberData.gender && cfInfo.computedGender !== memberData.gender) {
                  cfWarnings.push({ row: rowNum, cf: memberData.fiscalCode, issue: "Sesso discordante rispetto al CF" });
                }
                if (memberData.dateOfBirth) {
                  const csvDob = memberData.dateOfBirth instanceof Date ? memberData.dateOfBirth.toISOString().split('T')[0] : String(memberData.dateOfBirth).split('T')[0];
                  if (csvDob !== cfInfo.computedDob) {
                    cfWarnings.push({ row: rowNum, cf: memberData.fiscalCode, issue: "Data Nascita discordante rispetto al CF" });
                  }
                }
              }
            } else {
              errors.push({ row: rowNum, message: "Codice Fiscale mancante" });
              const pr = {
                 cf: "-",
                 nome: memberData.firstName || "-",
                 cognome: memberData.lastName || "-",
                 azione: 'BLOCCO_CF_MANCANTE',
                 campiModificati: ["CF Mancante"],
                 modificheCasing: []
              };
              previewRows.push(pr);
              missingCfRecords.push(pr);
              cfBloccante = true;
              skipped++;
            }

            if (cfBloccante) continue;

            // --- INIZIO: F1-PROTOCOLLO-005 Sanitizzazione e Tracking ---`
);

// 3. DryRun return for members
code = code.replace(
  `        if (dryRun) {
          return res.json({
            success: true,
            toInsert: toInsert.length,
            toUpdate: toUpdate.length,
            unchanged,
            errors: errors.length,
            preview: previewRows
          });
        }`,
  `        if (dryRun) {
          return res.json({
            success: true,
            toInsert: toInsert.length,
            toUpdate: toUpdate.length,
            unchanged,
            errors: errors.length,
            preview: previewRows,
            missingCfRecords,
            invalidCfRecords,
            cfWarnings,
            routingStats,
            missingSeasonRecords
          });
        }`
);

// 4. Enrollments Smart Routing Setup
code = code.replace(
  `const allEnrollments = await storage.getEnrollments();
        
        for (let i = 0; i < dataRows.length; i++) {`,
  `const allEnrollments = await storage.getEnrollments();
        const allMemberships = await storage.getMemberships();
        const allMedicalCerts = await storage.getMedicalCertificates();
        const activeSeason = await storage.getActiveSeason();
        const fallbackSeasonId = activeSeason ? activeSeason.id : 1;
        
        let maxMembershipNum = 0;
        allMemberships.forEach(m => {
          if (m.seasonId === 1 && m.membershipNumber && m.membershipNumber.startsWith('2526-')) {
            const num = parseInt(m.membershipNumber.substring(5), 10);
            if (!isNaN(num) && num > maxMembershipNum) {
              maxMembershipNum = num;
            }
          }
        });
        
        for (let i = 0; i < dataRows.length; i++) {`
);

// 5. Enrollments Smart Routing Inner Loop
code = code.replace(
  `            const existing = allEnrollments.find(e => e.memberId === member.id && e.courseId === course.id);
            if (existing) {
               unchanged++; 
               previewRows.push({ cf: rowData.fiscalCode, nome: member.firstName, cognome: member.lastName, azione: "INVARIATO", campiModificati: [] });
               continue;
            } else {
               if (!dryRun) {
                 await storage.createEnrollment({
                   memberId: member.id,
                   courseId: course.id,
                   status: rowData.status || "active",
                   sourceFile: "import",
                 });
               }
               imported++;
               previewRows.push({ cf: rowData.fiscalCode, nome: member.firstName, cognome: member.lastName, azione: "INSERISCI", campiModificati: ["Iscrizione creata"] });
            }`,
  `            const sku = course.sku.toUpperCase();

            if (sku.includes('QUOTATESSERA')) {
               const existingMem = allMemberships.find(m => m.memberId === member.id && m.seasonId === 1);
               if (existingMem) {
                  unchanged++;
                  previewRows.push({ cf: rowData.fiscalCode, nome: member.firstName, cognome: member.lastName, azione: "INVARIATO", campiModificati: [] });
               } else {
                  if (!dryRun) {
                     maxMembershipNum++;
                     const mNum = '2526-' + String(maxMembershipNum).padStart(6, '0');
                     await storage.createMembership({
                        memberId: member.id,
                        seasonId: 1,
                        membershipNumber: mNum,
                        barcode: mNum,
                        status: 'active',
                        membershipType: 'ENDAS',
                        issueDate: new Date(),
                        expiryDate: new Date('2026-08-31T00:00:00Z'),
                        notes: 'smart routing import',
                        dataQualityFlag: 'da_verificare'
                     });
                  }
                  imported++;
                  routingStats.tessere++;
                  previewRows.push({ cf: rowData.fiscalCode, nome: member.firstName, cognome: member.lastName, azione: "SMART ROUTING: TESSERA", campiModificati: ["Membership creata"] });
               }
               continue;
            }

            if (sku.includes('DTYURI') || sku.includes('DTNELLA')) {
               const existingMed = allMedicalCerts.find(mc => mc.memberId === member.id);
               if (existingMed) {
                  unchanged++;
                  previewRows.push({ cf: rowData.fiscalCode, nome: member.firstName, cognome: member.lastName, azione: "INVARIATO", campiModificati: [] });
               } else {
                  if (!dryRun) {
                     const issueDate = rowData.enrollmentDate ? new Date(rowData.enrollmentDate) : new Date();
                     const expiryDate = new Date(issueDate);
                     expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                     await storage.createMedicalCertificate({
                        memberId: member.id,
                        issueDate,
                        expiryDate,
                        status: 'valid',
                        notes: 'smart routing import'
                     });
                  }
                  imported++;
                  routingStats.certificati++;
                  previewRows.push({ cf: rowData.fiscalCode, nome: member.firstName, cognome: member.lastName, azione: "SMART ROUTING: VISITA MEDICA", campiModificati: ["Certificato creato"] });
               }
               continue;
            }

            const targetSeasonId = rowData.seasonId || fallbackSeasonId;
            if (!rowData.seasonId && !activeSeason) {
               errors.push({ row: rowNum, message: "Season ID mancante e nessuna stagione attiva trovata" });
               const pr = { cf: rowData.fiscalCode, nome: member.firstName, cognome: member.lastName, azione: "BLOCCO_SEASON_MANCANTE", campiModificati: ["Manca Stagione"] };
               previewRows.push(pr);
               missingSeasonRecords.push(pr);
               skipped++;
               continue;
            }

            const existing = allEnrollments.find(e => e.memberId === member.id && e.courseId === course.id);
            if (existing) {
               unchanged++; 
               previewRows.push({ cf: rowData.fiscalCode, nome: member.firstName, cognome: member.lastName, azione: "INVARIATO", campiModificati: [] });
               continue;
            } else {
               if (!dryRun) {
                 await storage.createEnrollment({
                   memberId: member.id,
                   courseId: course.id,
                   seasonId: targetSeasonId,
                   status: rowData.status || "active",
                   sourceFile: "import",
                 });
               }
               imported++;
               routingStats.enrollments++;
               previewRows.push({ cf: rowData.fiscalCode, nome: member.firstName, cognome: member.lastName, azione: "INSERISCI", campiModificati: ["Iscrizione creata"] });
            }`
);

// 6. DryRun return for enrollments
code = code.replace(
  `        if (dryRun) {
           return res.json({ success: true, toInsert: imported, toUpdate: 0, unchanged, errors: errors.length, preview: previewRows });
        }`,
  `        if (dryRun) {
           return res.json({
             success: true,
             toInsert: imported,
             toUpdate: 0,
             unchanged,
             errors: errors.length,
             preview: previewRows,
             missingCfRecords,
             invalidCfRecords,
             cfWarnings,
             routingStats,
             missingSeasonRecords
           });
        }`
);

fs.writeFileSync(file, code);
console.log("Patch applied.");
