import fs from 'fs';
import path from 'path';

// This script applies STEP 2 and STEP 3 logic to server/routes.ts and client/src/pages/import-data.tsx

function applyStep2And3() {
  const routesPath = path.join(process.cwd(), "scripts", '..', 'server', 'routes.ts');
  let routesCode = fs.readFileSync(routesPath, 'utf8');

  // We will locate app.post("/api/import/mapped"
  // And replace the internal logic for members, and add enrollments and memberships.

  // First add dryRun to req.body extraction
  routesCode = routesCode.replace(
    /const { fieldMapping, importKey, entityType, autoCreateRecords } = req.body;/,
    "const { fieldMapping, importKey, entityType, autoCreateRecords, isDryRun } = req.body;"
  );
  routesCode = routesCode.replace(
    /const autoCreate = autoCreateRecords === 'true' \|\| autoCreateRecords === true;/,
    "const autoCreate = autoCreateRecords === 'true' || autoCreateRecords === true;\n      const dryRun = isDryRun === 'true' || isDryRun === true;"
  );

  // We need to inject the logic to preview and smart update for members
  const memberLogicStart = routesCode.indexOf("if (existingMember) {");
  const memberLogicEnd = routesCode.indexOf("} catch (err: any) {", memberLogicStart);
  
  if (memberLogicStart === -1 || memberLogicEnd === -1) {
     console.error("Could not find member logic");
     process.exit(1);
  }

  const newMemberLogic = `if (existingMember) {
              const updatedData: any = {};
              const campiModificati: string[] = [];
              let hasChanges = false;
              for (const key of Object.keys(memberData)) {
                if (['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'userId', 'photoUrl'].includes(key)) continue;
                
                let fileValue = memberData[key];
                let dbValue = existingMember[key];
                
                if (fileValue instanceof Date) {
                  const dStr1 = fileValue.toISOString().split('T')[0];
                  const dStr2 = dbValue instanceof Date ? dbValue.toISOString().split('T')[0] : 
                               (typeof dbValue === 'string' ? dbValue.split('T')[0] : null);
                  if (dStr1 !== dStr2) {
                    updatedData[key] = fileValue;
                    campiModificati.push(key);
                    hasChanges = true;
                  }
                } else if (fileValue !== null && fileValue !== undefined && String(fileValue) !== String(dbValue)) {
                   updatedData[key] = fileValue;
                   campiModificati.push(key);
                   hasChanges = true;
                }
              }
              
              if (hasChanges) {
                toUpdate.push({ id: existingMember.id, data: updatedData });
                previewRows.push({
                   cf: importKeyValue || memberData.fiscalCode,
                   nome: memberData.firstName || existingMember.firstName,
                   cognome: memberData.lastName || existingMember.lastName,
                   azione: 'AGGIORNA',
                   campiModificati
                });
              } else {
                unchanged++;
                previewRows.push({
                   cf: importKeyValue || memberData.fiscalCode,
                   nome: memberData.firstName || existingMember.firstName,
                   cognome: memberData.lastName || existingMember.lastName,
                   azione: 'INVARIATO',
                   campiModificati: []
                });
              }
            } else {
              toInsert.push(memberData);
              previewRows.push({
                 cf: importKeyValue || memberData.fiscalCode,
                 nome: memberData.firstName,
                 cognome: memberData.lastName,
                 azione: 'INSERISCI',
                 campiModificati: Object.keys(memberData)
              });
            }`;

  routesCode = routesCode.substring(0, memberLogicStart) + newMemberLogic + "\n            " + routesCode.substring(memberLogicEnd);

  // Define previewRows and unchanged
  routesCode = routesCode.replace(
    /let skipped = 0;\n      const errors: { row: number; message: string }\[\] = \[\];/,
    "let skipped = 0;\n      let unchanged = 0;\n      const errors: { row: number; message: string }[] = [];\n      const previewRows: any[] = [];"
  );

  // Return dryRun early inside members
  const batchProcessStart = routesCode.indexOf("// Process inserts in batches of 100");
  const dryRunReturn = `
        if (dryRun) {
          return res.json({
            success: true,
            toInsert: toInsert.length,
            toUpdate: toUpdate.length,
            unchanged,
            errors: errors.length,
            preview: previewRows
          });
        }
        
        `;
  routesCode = routesCode.substring(0, batchProcessStart) + dryRunReturn + routesCode.substring(batchProcessStart);

  // Insert enrollments and memberships
  const courseElseIf = routesCode.indexOf("} else if (entity === 'courses') {");
  
  const enrollmentsAndMembershipsLogic = `} else if (entity === 'enrollments') {
        const allMembers = await storage.getMembers();
        const allCourses = await storage.getCourses();
        const allEnrollments = await storage.getEnrollments();
        
        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const rowNum = i + 2;
          try {
            const rowData: any = {};
            for (const [field, colIndex] of Object.entries(mapping)) {
              if (colIndex !== null && colIndex !== undefined && (colIndex as number) >= 0) {
                rowData[field] = row[colIndex as number]?.trim();
              }
            }
            if (!rowData.fiscalCode || !rowData.courseCode) {
               skipped++; continue;
            }
            
            const member = allMembers.find(m => m.fiscalCode === rowData.fiscalCode);
            const course = allCourses.find(c => c.sku === rowData.courseCode);
            if (!member || !course) {
               errors.push({ row: rowNum, message: "Membro o corso non trovato" });
               previewRows.push({ cf: rowData.fiscalCode, nome: "-", cognome: "-", azione: "ERRORE", campiModificati: ["Membro o corso mancante"] });
               skipped++; continue;
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
                   status: rowData.status || "active",
                   enrollmentDate: rowData.enrollmentDate ? new Date(rowData.enrollmentDate) : new Date(),
                   sourceFile: "import",
                 });
               }
               imported++;
               previewRows.push({ cf: rowData.fiscalCode, nome: member.firstName, cognome: member.lastName, azione: "INSERISCI", campiModificati: ["Iscrizione creata"] });
            }
          } catch(e: any) {
            errors.push({ row: rowNum, message: e.message });
            previewRows.push({ cf: "-", nome: "-", cognome: "-", azione: "ERRORE", campiModificati: [e.message] });
            skipped++;
          }
        }
        
        if (dryRun) {
           return res.json({ success: true, toInsert: imported, toUpdate: 0, unchanged, errors: errors.length, preview: previewRows });
        }
      } else if (entity === 'memberships') {
        const allMembers = await storage.getMembers();
        const allMemberships = await storage.getMemberships();
        const activeSeason = await storage.getActiveSeason();
        const seasonId = activeSeason ? activeSeason.id : 1;

        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const rowNum = i + 2;
          try {
            const rowData: any = {};
            for (const [field, colIndex] of Object.entries(mapping)) {
              if (colIndex !== null && colIndex !== undefined && (colIndex as number) >= 0) {
                rowData[field] = row[colIndex as number]?.trim();
              }
            }
            if (!rowData.fiscalCode) {
               skipped++; continue;
            }
            
            const member = allMembers.find(m => m.fiscalCode === rowData.fiscalCode);
            if (!member) {
               errors.push({ row: rowNum, message: "Membro non trovato" });
               previewRows.push({ cf: rowData.fiscalCode, nome: "-", cognome: "-", azione: "ERRORE", campiModificati: ["Membro mancante"] });
               skipped++; continue;
            }
            
            const existing = allMemberships.find(m => m.memberId === member.id && m.seasonId === seasonId);
            if (existing) {
               const updateData: any = {};
               const campiModificati: string[] = [];
               if (rowData.expiryDate) {
                  const dStr1 = new Date(rowData.expiryDate).toISOString().split('T')[0];
                  const dStr2 = existing.expiryDate instanceof Date ? existing.expiryDate.toISOString().split('T')[0] : 
                               (typeof existing.expiryDate === 'string' ? existing.expiryDate.split('T')[0] : null);
                  if (dStr1 !== dStr2) {
                     updateData.expiryDate = new Date(rowData.expiryDate);
                     campiModificati.push('expiryDate');
                  }
               }
               if (rowData.status && existing.status !== rowData.status) {
                  updateData.status = rowData.status;
                  campiModificati.push('status');
               }
               
               if (Object.keys(updateData).length > 0) {
                 if (!dryRun) {
                   await storage.updateMembership(existing.id, updateData);
                 }
                 updated++;
                 previewRows.push({ cf: rowData.fiscalCode, nome: member.firstName, cognome: member.lastName, azione: "AGGIORNA", campiModificati });
               } else {
                 unchanged++;
                 previewRows.push({ cf: rowData.fiscalCode, nome: member.firstName, cognome: member.lastName, azione: "INVARIATO", campiModificati: [] });
               }
            } else {
               if (!dryRun) {
                 await storage.createMembership({
                   memberId: member.id,
                   seasonId: seasonId,
                   membershipNumber: rowData.cardNumber || \`AUTO-\${member.id}\`,
                   membershipType: rowData.cardType || "NUOVO",
                   issueDate: rowData.issueDate ? new Date(rowData.issueDate) : new Date(),
                   expiryDate: rowData.expiryDate ? new Date(rowData.expiryDate) : new Date(),
                   status: "active"
                 });
               }
               imported++;
               previewRows.push({ cf: rowData.fiscalCode, nome: member.firstName, cognome: member.lastName, azione: "INSERISCI", campiModificati: ["Tessera creata"] });
            }
          } catch(e: any) {
            errors.push({ row: rowNum, message: e.message });
            previewRows.push({ cf: "-", nome: "-", cognome: "-", azione: "ERRORE", campiModificati: [e.message] });
            skipped++;
          }
        }
        
        if (dryRun) {
           return res.json({ success: true, toInsert: imported, toUpdate: updated, unchanged, errors: errors.length, preview: previewRows });
        }
      `;
      
  routesCode = routesCode.substring(0, courseElseIf) + enrollmentsAndMembershipsLogic + routesCode.substring(courseElseIf);

  // Also include unchanged in the final mapped res.json
  routesCode = routesCode.replace(
    /skipped,([\s\S]+?)total: dataRows\.length,/,
    "skipped,\n        unchanged,\n$1total: dataRows.length,"
  );

  fs.writeFileSync(routesPath, routesCode, 'utf8');

  // Now client/src/pages/import-data.tsx
  const importDataPath = path.join(process.cwd(), "scripts", '..', 'client', 'src', 'pages', 'import-data.tsx');
  let importDataCode = fs.readFileSync(importDataPath, 'utf8');

  // Add dryRun mutation
  const mutationsIndex = importDataCode.indexOf("const mappedImportMutation = useMutation({");
  
  const dryRunMutationCode = `  const dryRunMutation = useMutation({
    mutationFn: async (params: { file: File; fieldMapping: Record<string, number>; importKey: string; entityType: string; delimiter: string }) => {
      const formData = new FormData();
      formData.append('file', params.file);
      formData.append('fieldMapping', JSON.stringify(params.fieldMapping));
      formData.append('importKey', params.importKey);
      formData.append('entityType', params.entityType);
      formData.append('delimiter', params.delimiter);
      formData.append('isDryRun', 'true');
      const response = await fetch('/api/import/mapped', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Errore dry-run');
      return response.json();
    },
    onSuccess: (data: any) => {
      setDryRunData(data);
    },
    onError: (error: Error) => {
      toast({ title: "Errore Dry Run", description: error.message, variant: "destructive" });
    },
  });

  const [dryRunData, setDryRunData] = useState<any>(null);

`;

  importDataCode = importDataCode.substring(0, mutationsIndex) + dryRunMutationCode + importDataCode.substring(mutationsIndex);

  // Call dryRun on entering step 3
  const continueToStep3Btn = importDataCode.indexOf("onClick={() => setWizardStep(3)}");
  const newContinueToStep3 = `onClick={() => {
              setWizardStep(3);
              if (sourceType === "file" && selectedFile) {
                 const activeMapping: Record<string, number> = {};
                 for (const [key, value] of Object.entries(fieldMapping)) {
                   if (value !== null && value >= 0) activeMapping[key] = value;
                 }
                 dryRunMutation.mutate({
                   file: selectedFile,
                   fieldMapping: activeMapping,
                   importKey,
                   entityType,
                   delimiter: csvDelimiter,
                 });
              }
            }}`;
  importDataCode = importDataCode.replace("onClick={() => setWizardStep(3)}", newContinueToStep3);

  // Replace step 3 UI with dryRun and report download
  const step3ContentStart = importDataCode.indexOf("{!importResult && (");
  const step3ContentEnd = importDataCode.indexOf("{importResult && (");

  const newStep3Content = `{!importResult && (
                  <>
                    {dryRunMutation.isPending ? (
                       <div className="flex flex-col items-center justify-center p-8">
                         <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                         <p className="text-muted-foreground">Generazione anteprima azioni (Dry-Run)...</p>
                       </div>
                    ) : dryRunData ? (
                       <div className="animate-in fade-in space-y-6 text-left">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-green-50 p-4 rounded-xl text-center">
                              <p className="text-3xl font-black text-green-600">{dryRunData.toInsert}</p>
                              <p className="text-xs font-semibold text-green-700">DA INSERIRE</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-xl text-center">
                              <p className="text-3xl font-black text-blue-600">{dryRunData.toUpdate}</p>
                              <p className="text-xs font-semibold text-blue-700">DA AGGIORNARE</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl text-center">
                              <p className="text-3xl font-black text-gray-600">{dryRunData.unchanged}</p>
                              <p className="text-xs font-semibold text-gray-700">INVARIATI</p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-xl text-center">
                              <p className="text-3xl font-black text-red-600">{dryRunData.errors}</p>
                              <p className="text-xs font-semibold text-red-700">ERRORI/DA SALTARE</p>
                            </div>
                          </div>
                          
                          <div className="border rounded-md overflow-hidden max-h-60 overflow-y-auto text-sm">
                            <Table>
                              <TableHeader className="bg-muted sticky top-0">
                                <TableRow>
                                  <TableHead>CF</TableHead>
                                  <TableHead>Nominativo</TableHead>
                                  <TableHead>Azione</TableHead>
                                  <TableHead>Dettaglio</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {dryRunData.preview?.slice(0, 50).map((r: any, i: number) => (
                                  <TableRow key={i}>
                                    <TableCell className="font-mono">{r.cf}</TableCell>
                                    <TableCell>{r.cognome} {r.nome}</TableCell>
                                    <TableCell>
                                      <Badge variant={r.azione === 'INSERISCI' ? 'default' : r.azione === 'AGGIORNA' ? 'secondary' : r.azione === 'ERRORE' ? 'destructive' : 'outline'}>{r.azione}</Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{r.campiModificati?.join(', ')}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          
                          <div className="flex justify-center mt-6">
                            <Button
                              size="lg"
                              className="h-14 px-8 text-lg"
                              onClick={handleMappedImport}
                              disabled={isImporting}
                            >
                              {isImporting ? <Loader2 className="w-6 h-6 mr-3 animate-spin" /> : <Settings2 className="w-6 h-6 mr-3" />}
                              {isImporting ? "Elaborazione in corso..." : "CONFERMA E AVVIA IMPORTAZIONE REALE"}
                            </Button>
                          </div>
                       </div>
                    ) : (
                       <Button size="lg" onClick={handleMappedImport}>Forza Importazione Diretta</Button>
                    )}
                  </>
              )}
              
              `;
              
  importDataCode = importDataCode.substring(0, step3ContentStart) + newStep3Content + importDataCode.substring(step3ContentEnd);

  // Add Download CSV report button
  const successMessageIndex = importDataCode.indexOf("Importazione conclusa con successo");
  const downloadReportBtn = `
                        <div className="flex justify-center mt-4">
                           <Button variant="outline" className="gap-2" onClick={() => {
                              const csv = "CF,Nome,Cognome,Azione,CampiModificati\\n" + (dryRunData?.preview || []).map((r:any) => \`\${r.cf || ''},\${r.nome || ''},\${r.cognome || ''},\${r.azione || ''},"\${(r.campiModificati || []).join(',')}"\`).join("\\n");
                              const blob = new Blob([csv], { type: 'text/csv' });
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = \`report_import_\${entityType}.csv\`;
                              a.click();
                           }}>
                              <Download className="w-4 h-4" /> Scarica Report CSV
                           </Button>
                        </div>
  `;
  importDataCode = importDataCode.replace(
    /<CheckCircle className="w-5 h-5 mr-2" \/> Importazione conclusa con successo senza alcun errore.\n                        <\/div>/,
    `<CheckCircle className="w-5 h-5 mr-2" /> Importazione conclusa con successo senza alcun errore.\n                        </div>${downloadReportBtn}`
  );

  fs.writeFileSync(importDataPath, importDataCode, 'utf8');
}

applyStep2And3();
