import sys

def modify_file():
    with open('client/src/pages/import-data.tsx', 'r') as f:
        content = f.read()

    # Step 2 header replacements
    content = content.replace(
        '<Button variant="outline" onClick={handleSaveMapping}><Save className="w-4 h-4 mr-2" /> Salva config locale</Button>',
        '<Button variant="outline" onClick={handleSaveMapping}><Save className="w-4 h-4 mr-2" /> Salva questa mappatura</Button>'
    )
    content = content.replace(
        '<CardTitle>Tabella di Mappatura</CardTitle>',
        '<CardTitle>Mappa le colonne</CardTitle>'
    )
    content = content.replace(
        '<CardDescription>\n                  Seleziona la corrispondenza corretta. Trovate {sampleData.length} righe. Le colonne ignorate non saranno considerate.\n              </CardDescription>',
        '<CardDescription>\n                  Il sistema ha riconosciuto automaticamente alcune colonne (✅). Per le altre, scegli il campo corrispondente oppure seleziona \'Ignora\'.\n              </CardDescription>'
    )
    
    # Step 2 Select items
    content = content.replace(
        '<SelectValue placeholder="[Ignora questa colonna]" />',
        '<SelectValue placeholder="Seleziona campo..." />'
    )
    content = content.replace(
        '<SelectItem value="__none__" className="text-muted-foreground italic">Ignora questa colonna</SelectItem>',
        '<SelectItem value="__none__" className="text-muted-foreground italic">— Ignora questa colonna —</SelectItem>'
    )

    # Step 2 Preview section
    content = content.replace(
        '<CardTitle>Anteprima Dati Riorganizzati (Prime 5 Righe)</CardTitle>',
        '<CardTitle>Anteprima dati (prime 5 righe)</CardTitle>'
    )
    
    # Add counters under preview
    preview_text_old = """<div className="mt-4 text-sm text-muted-foreground text-center">
                  Vengono visualizzate le prime righe tradotte secondo la mappatura aggiornata in tempo reale.
              </div>"""

    preview_text_new = """<div className="mt-4 text-sm text-muted-foreground text-center space-y-1">
                <div>Vengono visualizzate le prime righe tradotte secondo la mappatura aggiornata in tempo reale.</div>
                <div className="font-medium text-foreground">
                  Trovate {sampleData.length} righe totali &middot;{' '}
                  {fieldMapping["fiscalCode"] !== null && fieldMapping["fiscalCode"] !== undefined ? sampleData.filter(r => r[fieldMapping["fiscalCode"] as number]).length : 0} con Codice Fiscale (verranno importate) &middot;{' '}
                  {fieldMapping["fiscalCode"] !== null && fieldMapping["fiscalCode"] !== undefined ? sampleData.filter(r => !r[fieldMapping["fiscalCode"] as number]).length : sampleData.length} senza CF (verranno saltate)
                </div>
              </div>"""

    content = content.replace(preview_text_old, preview_text_new)

    # Step 3 replacements
    content = content.replace(
        '<CardTitle className="text-primary">Esecuzione Import : {entityType.toUpperCase()}</CardTitle>',
        '<CardTitle className="text-primary">Importazione in corso</CardTitle>'
    )

    import_btn_old = """{isImporting ? "Elaborazione in corso..." : "CONFERMA E AVVIA IMPORTAZIONE"}"""
    import_btn_new = """{isImporting ? "Elaborazione in corso... non chiudere questa finestra." : "CONFERMA E AVVIA IMPORTAZIONE"}"""
    content = content.replace(import_btn_old, import_btn_new)

    # Results area
    content = content.replace(
        '<p className="text-sm font-semibold text-green-700 uppercase tracking-widest">Inseriti</p>',
        '<p className="text-sm font-semibold text-green-700 uppercase tracking-widest">✅ Inseriti</p>'
    )
    content = content.replace(
        '<p className="text-sm font-semibold text-blue-700 uppercase tracking-widest">Aggiornati</p>',
        '<p className="text-sm font-semibold text-blue-700 uppercase tracking-widest">🔄 Aggiornati</p>'
    )
    content = content.replace(
        '<p className="text-sm font-semibold text-amber-700 uppercase tracking-widest">Saltati</p>',
        '<p className="text-sm font-semibold text-amber-700 uppercase tracking-widest">⏭ Saltati</p>'
    )
    content = content.replace(
        '<p className="text-sm font-semibold text-red-700 uppercase tracking-widest">Errori</p>',
        '<p className="text-sm font-semibold text-red-700 uppercase tracking-widest">❌ Errori</p>'
    )

    content = content.replace(
        '<Download className="w-4 h-4 mr-2" /> Scarica CSV Report Errori',
        '<Download className="w-4 h-4 mr-2" /> Scarica report completo'
    )

    # Append report note and "Fai un import"
    btn_report_html = """<Download className="w-4 h-4 mr-2" /> Scarica report completo
                         </Button>"""
    btn_report_new = """<Download className="w-4 h-4 mr-2" /> Scarica report completo
                         </Button>
                         <p className="text-xs text-muted-foreground mt-2">Il file CSV contiene riga, CF, motivo per ogni anomalia</p>
                         <div className="mt-8">
                             <Button onClick={() => setWizardStep(1)}>Fai un altro import</Button>
                         </div>"""
    content = content.replace(btn_report_html, btn_report_new)

    success_msg_old = """<CheckCircle className="w-5 h-5 mr-2" /> Importazione conclusa con successo senza alcun errore.
                      </div>"""
    success_msg_new = """<CheckCircle className="w-5 h-5 mr-2" /> Importazione conclusa con successo senza alcun errore.
                      </div>
                      <div className="mt-8">
                          <Button onClick={() => setWizardStep(1)}>Fai un altro import</Button>
                      </div>"""
    content = content.replace(success_msg_old, success_msg_new)


    # Instructions at the bottom
    instructions_html = """
      {/* Sezione Istruzioni in fondo */}
      <Card className="mt-12 bg-muted/30">
        <CardHeader>
          <CardTitle>Come funziona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Importazione da file:</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Seleziona il tipo di dati da importare cliccando sulla card corrispondente.</li>
              <li>Carica il file (.csv, .xlsx o .xls) oppure inserisci l'ID del foglio Google.</li>
              <li>Verifica la mappatura delle colonne e l'anteprima dei dati.</li>
              <li>Avvia l'import e scarica il report.</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Formati supportati:</h4>
            <p className="text-muted-foreground">
              Il sistema accetta file Excel (.xlsx), CSV con virgola o punto e virgola, 
              e fogli Google Sheets direttamente dall'URL. Le colonne vengono riconosciute 
              automaticamente anche nei formati GSheets (an_cod_fiscale, an_nome...) 
              e Athena (Cod. Fisc., Cognome...).
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Sicurezza dei dati:</h4>
            <p className="text-muted-foreground">
              I dati esistenti non vengono mai sovrascritti. Se una persona è già presente (stesso CF), 
              vengono completati solo i campi vuoti. I pagamenti e i movimenti contabili non possono essere 
              modificati dopo l'import.
            </p>
          </div>
        </CardContent>
      </Card>
      """

    # Inject right before the last closing </div> that wraps the wizard
    # We find the last </div>
    last_div_index = content.rfind("</div>")
    if last_div_index != -1:
        content = content[:last_div_index] + instructions_html + "\n    </div>\n" + content[last_div_index+6:]

    with open('client/src/pages/import-data.tsx', 'w') as f:
        f.write(content)

modify_file()
print("Done texts!")
