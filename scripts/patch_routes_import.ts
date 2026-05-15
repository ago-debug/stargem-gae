import fs from 'fs';

let content = fs.readFileSync('server/routes.ts', 'utf8');

const regex = /app\.post\("\/api\/import\/mapped", isAuthenticated, upload\.single\('file'\), async \(req, res\) => \{([\s\S]*?)\}\);/g;
let match = regex.exec(content);
if (!match) {
  console.error("Route not found");
  process.exit(1);
}
const oldRouteBody = match[1];

const newRoute = `
  app.post("/api/import/mapped", isAuthenticated, (req, res, next) => {
    if (req.is('multipart/form-data')) {
      upload.single('file')(req, res, next);
    } else {
      next();
    }
  }, async (req, res) => {
    try {
      const isChunked = req.is('application/json');
      const { fieldMapping, importKey, entityType, autoCreateRecords, isDryRun, chunk_index, total_chunks, batch_id, records } = req.body;
      const mapping = typeof fieldMapping === 'string' ? JSON.parse(fieldMapping) : fieldMapping;
      const autoCreate = autoCreateRecords === 'true' || autoCreateRecords === true;
      const dryRun = isDryRun === 'true' || isDryRun === true;
      const entity = entityType || 'members';
      
      let dataRows: any[] = [];
      
      if (isChunked) {
        dataRows = records || [];
      } else {
        if (!req.file) return res.status(400).json({ message: "Nessun file caricato" });
        const fileContent = req.file.buffer.toString('utf-8');
        const Papa = await import('papaparse');
        const firstLine = fileContent.split('\\n')[0] || '';
        const detectedSep = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ';' : ',';
        const parsed = Papa.default.parse(fileContent, { header: false, skipEmptyLines: true, delimiter: detectedSep });
        dataRows = (parsed.data as any[][]).slice(1);
      }
      
      if (dataRows.length === 0) return res.status(400).json({ message: "File senza dati" });
      
      let imported = 0; let updated = 0; let skipped = 0; let unchanged = 0;
      const errors: any[] = [];
      const previewRows: any[] = [];
      const missingCfRecords: any[] = []; const invalidCfRecords: any[] = []; const cfWarnings: any[] = [];
      const routingStats = { tessere: 0, certificati: 0, enrollments: 0 };
      const missingSeasonRecords: any[] = [];
      
      if (entity === 'members') {
        const allMembers = await db.select().from(schema.members);
        const memberLookup = new Map<string, any>();
        for (const member of allMembers) {
           if (member.fiscalCode) memberLookup.set(member.fiscalCode.toUpperCase(), member);
        }
        
        const cfHelpers = await import('./utils/cfPlaceholder.js').catch(()=>null);
        const performedBy = (req.user as any)?.id || 'botAI';
        
        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const rowNum = i + 2;
          
          try {
            const memberData: any = {};
            const extraData: any = {};
            
            for (const [field, colIndex] of Object.entries(mapping)) {
              if (colIndex !== null && colIndex !== undefined && (colIndex as number) >= 0) {
                let value = row[colIndex as number]?.trim();
                if (value === undefined || value === "") continue;
                
                // date fields
                if (["dateOfBirth", "cardIssueDate", "cardExpiryDate", "entityCardIssueDate", "entityCardExpiryDate", "medicalCertificateExpiry"].includes(field)) {
                  const match = value.match(/(\\d{2})\\/(\\d{2})\\/(\\d{4})/);
                  if (match) memberData[field] = new Date(\`\${match[3]}-\${match[2]}-\${match[1]}\`);
                  else memberData[field] = new Date(value);
                } else if (field === "gender") {
                  memberData[field] = value.toUpperCase() === 'M' || value.toUpperCase() === 'UOMO' ? 'M' : 'F';
                } else {
                  memberData[field] = value;
                }
              }
            }
            
            // Map unmapped fields to extraData
            for(let j=0; j<row.length; j++) {
              let mapped = false;
              for(const colIndex of Object.values(mapping)) { if(colIndex === j) mapped = true; }
              if(!mapped && row[j]) extraData[\`col_\${j}\`] = row[j];
            }
            
            const dataQualityFlag: any = {};
            
            // CF Policy
            let cf = memberData.fiscalCode ? memberData.fiscalCode.toUpperCase() : null;
            if (!cf) {
              const country = (memberData.country || '').toLowerCase();
              const isEster = country && country !== 'italia' && country !== 'italy';
              
              if (isEster) {
                cf = cfHelpers ? await cfHelpers.generateStranieroPlaceholder() : \`PLC-STR-\${Math.random().toString().slice(2,8)}\`;
                dataQualityFlag.cf_placeholder = true;
              } else if (memberData.dateOfBirth) {
                const age = new Date().getFullYear() - memberData.dateOfBirth.getFullYear();
                if (age < 18) {
                  cf = null;
                  dataQualityFlag.minore_senza_cf = true;
                }
              }
              // non-bloccante
            } else {
              // check invalid
              if (cf.length !== 16) {
                 dataQualityFlag.cf_malformato = true;
              }
            }
            memberData.fiscalCode = cf;
            memberData.extraData = extraData;
            memberData.importedLotto = isChunked ? 'lotto1_chunked' : 'lotto1_dryrun';
            memberData.importedSourceRowIndex = rowNum;
            memberData.importedBy = performedBy;
            memberData.importedAt = new Date();
            
            let hasConflict = false;
            let existingMember = cf ? memberLookup.get(cf) : null;
            
            if (existingMember) {
               // Update logic (Liv 1 audit)
               const updatedData: any = {};
               for (const key of Object.keys(memberData)) {
                 if(['extraData','importedLotto','importedSourceRowIndex','importedBy','importedAt'].includes(key)) continue;
                 const fileVal = memberData[key];
                 const dbVal = existingMember[key];
                 
                 if (fileVal) {
                   if (!dbVal) {
                     updatedData[key] = fileVal; // fill empty
                   } else if (String(fileVal) !== String(dbVal)) {
                     hasConflict = true;
                     dataQualityFlag.has_conflict = true;
                     if (!dryRun) {
                       await db.insert(schema.auditLogs).values({
                         entityId: existingMember.id,
                         entityType: 'members',
                         action: 'UPDATE',
                         changes: { field: key, old: dbVal, new: fileVal },
                         performedBy: performedBy,
                         tenantId: '1'
                       });
                     }
                   }
                 }
               }
               updatedData.dataQualityFlag = dataQualityFlag;
               if (!dryRun) {
                  await db.update(schema.members).set(updatedData).where(eq(schema.members.id, existingMember.id));
               }
               updated++;
            } else {
               // Insert logic
               memberData.dataQualityFlag = dataQualityFlag;
               memberData.active = true;
               if (!dryRun) {
                 await db.insert(schema.members).values(memberData);
               }
               imported++;
            }
            
          } catch (e: any) {
            errors.push({ row: rowNum, message: e.message });
            skipped++;
          }
        }
      }
      
      if (dryRun) {
        return res.json({ success: true, toInsert: imported, toUpdate: updated, unchanged, errors: errors.length, preview: previewRows });
      }
      
      // Update batch if chunked
      if (isChunked && batch_id) {
        // We use insert ... on duplicate key update if possible, or just raw sql
        await db.execute(sql\`
          INSERT INTO import_batches (batch_id, total_chunks, completed_chunks, records_imported, records_skipped, records_updated)
          VALUES (\${batch_id}, \${total_chunks}, 1, \${imported}, \${skipped}, \${updated})
          ON DUPLICATE KEY UPDATE 
            completed_chunks = completed_chunks + 1,
            records_imported = records_imported + \${imported},
            records_skipped = records_skipped + \${skipped},
            records_updated = records_updated + \${updated}
        \`);
      }
      
      return res.json({ success: true, inserted: imported, updated, skipped, errors });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ message: e.message });
    }
  });
`;

content = content.replace(regex, newRoute);
fs.writeFileSync('server/routes.ts', content);
console.log("Routes modified");
