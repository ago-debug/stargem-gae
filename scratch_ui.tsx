
  return (
    <div className="p-6 md:p-8 space-y-6 mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Importazione Dati</h1>
          <p className="text-muted-foreground">Wizard di caricamento massivo dati</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 max-w-3xl mx-auto px-4 relative">
        <div className={`flex flex-col items-center z-10 ${wizardStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-colors ${wizardStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>1</div>
          <span className="text-sm font-medium">Carica</span>
        </div>
        <div className={`flex-1 h-1 mx-4 rounded transition-colors ${wizardStep >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
        <div className={`flex flex-col items-center z-10 ${wizardStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-colors ${wizardStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>2</div>
          <span className="text-sm font-medium">Mappa e Anteprima</span>
        </div>
        <div className={`flex-1 h-1 mx-4 rounded transition-colors ${wizardStep >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
        <div className={`flex flex-col items-center z-10 ${wizardStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-colors ${wizardStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>3</div>
          <span className="text-sm font-medium">Esegui e Report</span>
        </div>
      </div>

      {wizardStep === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {[
              { type: "members", label: "Anagrafica", icon: Users, desc: "Importa soci" },
              { type: "payments", label: "Pagamenti", icon: CreditCard, desc: "Storico pagamenti" },
              { type: "enrollments", label: "Iscrizioni", icon: BookOpen, desc: "Iscrizioni corsi" },
              { type: "memberships", label: "Tessere", icon: CreditCard, desc: "Tessere associati" },
              { type: "accounting", label: "Contabilità", icon: BarChart2, desc: "Movimenti banco" }
            ].map(t => {
              const Icon = t.icon;
              return (
                <Card 
                  key={t.type}
                  className={`cursor-pointer transition-colors shadow-sm hover:border-primary/50 ${entityType === t.type ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''}`}
                  onClick={() => setEntityType(t.type as any)}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                    <Icon className={`w-8 h-8 ${entityType === t.type ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="font-semibold">{t.label}</div>
                    <div className="text-xs text-muted-foreground">{t.desc}</div>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); downloadTemplate(t.type); }}>Template</Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sorgente Dati</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={sourceType} onValueChange={(v) => setSourceType(v as "file" | "google_sheets")} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file">File Locale (.csv, .xlsx)</TabsTrigger>
                  <TabsTrigger value="google_sheets">Google Sheets</TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-4 pt-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/20">
                    <input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                      <Upload className="w-12 h-12 mb-4 text-muted-foreground" />
                      {selectedFile ? (
                        <>
                          <p className="text-sm font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium">Clicca per selezionare un file CSV o Excel</p>
                          <p className="text-xs text-muted-foreground mt-1">Intestazioni in prima riga</p>
                        </>
                      )}
                    </label>
                  </div>
                  <Button 
                    className="w-full" 
                    disabled={!selectedFile || filePreviewMutation.isPending}
                    onClick={() => {
                        if (!selectedFile) return;
                        filePreviewMutation.mutate({ file: selectedFile, delimiter: csvDelimiter });
                    }}
                  >
                    {filePreviewMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Procedi al Mapping"}
                  </Button>
                </TabsContent>

                <TabsContent value="google_sheets" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>ID Foglio Google</Label>
                      <Input value={spreadsheetId} onChange={(e) => setSpreadsheetId(e.target.value)} placeholder="1A2B3C..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Range (es. Foglio1!A1:Z1000)</Label>
                      <Input value={sheetRange} onChange={(e) => setSheetRange(e.target.value)} placeholder="Foglio1!A1:Z1000" />
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    disabled={!spreadsheetId || previewHeadersMutation.isPending}
                    onClick={handlePreviewHeaders}
                  >
                    {previewHeadersMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Procedi al Mapping"}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {wizardStep === 2 && (
        <div className="space-y-6">
          <div className="flex gap-4 flex-wrap">
            <Button variant="outline" onClick={handleBackToInput}>Indietro</Button>
            <Button variant="outline" onClick={handleSaveMapping}><Save className="w-4 h-4 mr-2" /> Salva config locale</Button>
            <Button variant="outline" onClick={handleAutoMap}><Settings2 className="w-4 h-4 mr-2"/> Auto-Mappa tutto</Button>
            <Button className="ml-auto" onClick={() => setWizardStep(3)}><ArrowRight className="w-4 h-4 mr-2"/> Continua allo Step 3</Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tabella di Mappatura</CardTitle>
              <CardDescription>
                  Seleziona la corrispondenza corretta. Trovate {sampleData.length} righe. Le colonne ignorate non saranno considerate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-0 text-sm">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-2 bg-muted rounded-t-md font-semibold font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  <div>Colonna Excel / CSV</div>
                  <div className="w-24 text-center">Stato</div>
                  <div>Campo DB</div>
                </div>
                <div className="border border-t-0 rounded-b-md divide-y overflow-hidden">
                  {sheetHeaders.map(header => {
                    const mappedDbFieldKey = Object.keys(fieldMapping).find(k => fieldMapping[k] === header.index);
                    const isMapped = !!mappedDbFieldKey;
                    
                    return (
                      <div key={header.index} className={`grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3 transition-colors ${isMapped ? 'bg-background' : 'bg-muted/30'}`}>
                        <div className="font-medium truncate" title={header.name}>{header.index + 1}. {header.name}</div>
                        <div className="w-24 flex justify-center">
                            {isMapped ? (
                              <Badge className="bg-green-600/10 text-green-700 hover:bg-green-600/20 border-green-600/20 shadow-none"><CheckCircle className="w-3 h-3 mr-1" /> Mappato</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground"><AlertCircle className="w-3 h-3 mr-1" /> Ignorato</Badge>
                            )}
                        </div>
                        <div>
                          <Select 
                            value={mappedDbFieldKey || "__none__"}
                            onValueChange={(val) => {
                                const newMap = {...fieldMapping};
                                if (mappedDbFieldKey) newMap[mappedDbFieldKey] = null;
                                if (val !== "__none__") newMap[val] = header.index;
                                setFieldMapping(newMap);
                            }}
                          >
                            <SelectTrigger className={`h-8 font-medium ${!isMapped && 'opacity-70'}`}>
                              <SelectValue placeholder="[Ignora questa colonna]" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              <SelectItem value="__none__" className="text-muted-foreground italic">Ignora questa colonna</SelectItem>
                              {currentFields.map(cf => (
                                <SelectItem key={cf.key} value={cf.key}>
                                  {cf.label} {cf.required ? <span className="text-destructive">*</span> : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Anteprima Dati Riorganizzati (Prime 5 Righe)</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full pb-4">
                <Table className="border min-w-max">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {currentFields.filter(f => fieldMapping[f.key] !== null).map(f => (
                        <TableHead key={f.key} className="font-semibold text-primary/80 whitespace-nowrap">{f.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleData.slice(0, 5).map((row, idx) => (
                      <TableRow key={idx}>
                        {currentFields.filter(f => fieldMapping[f.key] !== null).map(f => (
                          <TableCell key={f.key} className="whitespace-nowrap max-w-[250px] truncate">
                            {row[fieldMapping[f.key] as number] || <span className="text-muted-foreground/30 italic">-vuoto-</span>}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    {sampleData.length === 0 && (
                      <TableRow>
                         <TableCell colSpan={currentFields.length} className="text-center py-8 text-muted-foreground">Nessun dato in anteprima</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="mt-4 text-sm text-muted-foreground text-center">
                  Vengono visualizzate le prime righe tradotte secondo la mappatura aggiornata in tempo reale.
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {wizardStep === 3 && (
        <div className="space-y-6">
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setWizardStep(2)}>Indietro</Button>
          </div>

          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="text-primary">Esecuzione Import : {entityType.toUpperCase()}</CardTitle>
              <CardDescription>Il sistema processeerà {sampleData.length} righe ignorando gli ID duplicati primari.</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-10 space-y-6">
              
              {!importResult && (
                  <Button
                    size="lg"
                    className="h-14 px-8 text-lg"
                    onClick={handleMappedImport}
                    disabled={isImporting}
                  >
                    {isImporting ? <Loader2 className="w-6 h-6 mr-3 animate-spin" /> : <Settings2 className="w-6 h-6 mr-3" />}
                    {isImporting ? "Elaborazione in corso..." : "CONFERMA E AVVIA IMPORTAZIONE"}
                  </Button>
              )}

              {importResult && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-xl flex flex-col items-center justify-center">
                      <p className="text-4xl font-black text-green-600 mb-1">{importResult.inserted || importResult.imported || 0}</p>
                      <p className="text-sm font-semibold text-green-700 uppercase tracking-widest">Inseriti</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-xl flex flex-col items-center justify-center">
                      <p className="text-4xl font-black text-blue-600 mb-1">{importResult.updated || 0}</p>
                      <p className="text-sm font-semibold text-blue-700 uppercase tracking-widest">Aggiornati</p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-xl flex flex-col items-center justify-center">
                      <p className="text-4xl font-black text-amber-600 mb-1">{importResult.skipped || 0}</p>
                      <p className="text-sm font-semibold text-amber-700 uppercase tracking-widest">Saltati</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl flex flex-col items-center justify-center">
                      <p className="text-4xl font-black text-destructive mb-1">{importResult.errors?.length || 0}</p>
                      <p className="text-sm font-semibold text-red-700 uppercase tracking-widest">Errori</p>
                    </div>
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="text-center">
                         <div className="inline-block bg-destructive/10 text-destructive px-4 py-2 rounded-lg font-medium text-sm mb-4">
                             Attenzione: Si sono verificati {importResult.errors.length} errori durante la procedura.
                         </div>
                         <br/>
                         <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-white" onClick={() => {
                            const csv = "riga,CF,motivo_errore\n" + importResult.errors!.map(e => `${e.row},NA,"${e.message.replace(/"/g, '""')}"`).join("\n");
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `error_report_${entityType}.csv`;
                            a.click();
                         }}>
                            <Download className="w-4 h-4 mr-2" /> Scarica CSV Report Errori
                         </Button>
                    </div>
                  )}

                  {!importResult.errors?.length && (
                      <div className="inline-flex items-center justify-center text-green-600 font-medium bg-green-50 px-6 py-3 rounded-full">
                          <CheckCircle className="w-5 h-5 mr-2" /> Importazione conclusa con successo senza alcun errore.
                      </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
