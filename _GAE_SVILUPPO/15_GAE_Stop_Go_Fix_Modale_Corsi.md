# 🛑 STOP & GO: [AG-FIX-006G] e [AG-FIX-006H]
## Uniformazione Modali Interni (Pennini) e Drop "Stato Operativo"

Come richiesto dal protocollo **[AG-RULE-0001]**, di seguito l'analisi formale e la proposta di intervento chirurgico per la UX del Modale Corsi, prima di alterare la codebase.

### 1. Modifica Proposta
**A) Per i Pennini ([AG-FIX-006G])**
- Eliminerò i redirect esterni (`setLocation('/elenchi...')` e `/categorie-attivita`) dai 3 pennini incriminati (Genere, Categoria, Posti Disponibili).
- Creerò un componente React specializzato (`CustomListManagerModal` o includerò la logica nativa per dialoghi sovrapposti) che si aprirà **sopra** il Modale Corsi in formato *Popup Dialog*, esattamente come fa già il modulo `<MultiSelectStatus>` dello Stato.
- Assicurò allineamento estetico CSS su tutto il blocco (icone color oro, padding identico, nessuna discordanza).

**B) Per "Stato Operativo" ([AG-FIX-006H])**
- Eliminerò dal JSX la riga `Stato Operativo:` e il suo input/select collegato in `CourseUnifiedModal.tsx`.
- Lancerò un cleanup nel file backend/payload per assicurarmi che il salvataggio non si astenga dal lavorare solo su `statusTags`.
- La UI rimarrà sguarnita dal vecchio selettore e presidierà la singola fonte di verità: il badge multi-colore "Stato".

### 2. Perché Serve
Per evitare il de-railing dell'utente: attualmente, un operatore che sta compilando a metà un nuovo corso, cliccando per caso un pennino "Genere", perde tutto il form e viene scaraventato alla pagina Elenchi. La modifica trattiene l'utente nel flusso di produttività. Eliminare il dualismo dello "Stato" risolve data-inconsistencies.

### 3. File Coinvolti
- `client/src/components/CourseUnifiedModal.tsx` (Verranno staccate le rotte wouter e innestati sub-state React per i popup, drop di "Stato Operativo")
- Eventuale refactor o estensione limitata di un helper di UI (come un popup manager minimale) da inserire in cartella components.
- Nessun file del backend Database viene toccato.

### 4. Impatti Previsti
L'operatore clicca la matita Genere -> lo schermo oscura in modal layer 2, si apre il gestore del vocabolario, l'operatore aggiunge la voce, chiude il Gestore, e si ritrova nel Corso con la nuova voce disponibile a tendina. Mantenimento perfetto del layout.

### 5. Rischi / Regressioni
- **Overlap Layer**: Radix-UI (shadcn) gestisce nativamente i "Nested Dialogs", quindi il click per chiudere un popup non chiuderà il modale principale. Ne garantirò l'uso corretto.
- **Legacy Status**: Eliminando la Select 'Stato Operativo', i vecchi corsi su DB non subiranno variazioni finché non salvati nuovamente (`statusTags` assorbirà lo stato predefinito se l'utente lo aggiorna).

### 6. Cosa NON Verrà Toccato
- Routing globale.
- Logiche backend di affitti, fatturazione e tessere.
- Database schemi (nessuna db migration).
- Tutti gli altri modali (i.e. Pagamenti, Master Generale).

---
**STATO:** IN ATTESA DI LUCE VERDE 🚦
Puoi scrivermi "Approvo" per sbloccare l'esecuzione della fase `[AG-FIX-006G/H] e procedere ai test integrati su Localhost.
