# STRATEGIC REVIEW F2 (FRONTEND) — 11 Maggio 2026
**Ruolo:** Senior Frontend Engineer (Antigravity F2)
**A:** Gaetano (Engineering Lead) / Claude (Coordinamento)
**Contesto:** Analisi onesta, non diplomatica, pre-ripresa sviluppo operativo.

---

## 1. Sintesi onesta dello stato — lato frontend
Il frontend di StarGem oggi è schizofrenico: da un lato abbiamo moduli moderni, veloci e coesi (il pattern `scheda-corso.tsx`, i tab accordion unificati in `/iscritti_per_attivita`, l'`ExportWizard` onnipresente), dall'altro ci portiamo dietro veri e propri "mostri legacy" che incutono terrore a ogni deploy. Il lavoro di unificazione delle 5 schede dettaglio ha ridotto enormemente le divergenze UX, ma le pagine storiche o i contenitori generici (vedi il famigerato `2526ALLENAMENTO`) necessitano di continui `early return` per non causare crash fatali ("white screen of death"). Ho molta paura quando si toccano i flussi di pagamento centralizzati o l'anagrafica, perché i tentacoli di queste UI arrivano ovunque.

## 2. Debito tecnico — i 3 problemi frontend più seri

1. **`maschera-input-generale.tsx` (4.500 righe)**
   - **Perché mi preoccupa:** È il centro nevralgico della segreteria. Gestisce stato incrociato tra 5 domini (anagrafica, tessere, certificati, iscrizioni, carrello). Un errore qui ferma il core business aziendale.
   - **Cosa potrebbe rompersi:** Validazioni incrociate (es. codice fiscale associato a una combo di sconti errata) o rollback UI se una chiamata API su tre fallisce.
   - **Stima sforzo:** Dalle 2 alle 3 settimane in isolamento per spacchettarlo in micro-form governati da un global state (es. Zustand).

2. **`calendar.tsx` (3.500 righe)**
   - **Perché mi preoccupa:** Troppa logica temporale e di calcolo griglia fusa indissolubilmente con la presentazione visiva. Il bug del raggruppamento corsi sparito nel planning strategico ne è l'esempio lampante.
   - **Cosa potrebbe rompersi:** Sovrapposizioni fantasma, offset orari sbagliati per `TimeZone` (se non maneggiati bene da Temporal), crash del modale `CourseUnifiedModal` al drag&drop.
   - **Stima sforzo:** 1 settimana piena per estrarre tutta la logica matematica in hook puri (`useCalendarGrid`, `usePlanningGrouping`) e lasciare al TSX solo il rendering.

3. **`PaymentModuleConnector` e il flusso Checkout (`CartTableRow`)**
   - **Perché mi preoccupa:** Anche se `NuovoPagamentoModal` è stato blindato (readOnly), il connettore ha ramificazioni su 14 route. Non c'è una "State Machine" rigida sul frontend per i pagamenti.
   - **Cosa potrebbe rompersi:** Pagamenti orfani, applicazioni di logiche promo errate, incongruenza tra visivo e backend.
   - **Stima sforzo:** 1-2 settimane per estrarre una vera libreria di prezzaggio frontend (es. `usePricingEngine`) sincronizzata col Listino Stagionale.

*Riguardo ai 5 pattern `scheda-*`: L'unificazione sta tenendo bene, ma le logiche per le "Domeniche" o il "Campus" stanno iniziando a forzare troppo i limiti del pattern base. Se non blindiamo un `ActivityLayout` agnostico definitivo, ricominceranno a divergere per assecondare eccezioni di business.*

## 3. Decisioni frontend che, col senno di poi, riprenderei

- **React Query vs SWR:** TanStack/React Query è la scelta giusta per la mole di dati, ma la gestione manuale delle invalidazioni cache ci ha tradito spesso. Dovremmo standardizzare i "cache keys" in un file di costanti e smettere di invalidare manualmente le liste sperando in bene.
- **Tailwind + shadcn:** Assolutamente confermato. Ci ha fatto correre. L'introduzione recente dei Design Tokens (`stargem-red`, `text-xxs`) e dell'ESLint per gli Arbitrary Values era la pezza che mancava. Senza di essa stava diventando un inferno di magic-strings CSS.
- **Routing:** Coerente, ma la UX è debole sui flussi multi-step. Manca una gestione solida della storia della navigazione: premere "indietro" spesso resetta tab e filtri. Servono parametri URL per tutto lo state condiviso (`?tab=presenze&season=1`).
- **ExportWizard unificato:** La miglior decisione architetturale UI dell'ultimo mese. Ha tolto centinaia di righe di boilerplate. Design perfetto.
- **Pennini A/B (InlineListEditor):** Confermatissimi. La segreteria odia i modali lenti. Il pattern "clicca-modifica-salva inline" è lo standard che ci serve ovunque.

## 4. La maschera-input-generale e routes.ts come "monolite frontend"

- **Perché è pericoloso smantellare `maschera-input-generale.tsx`:** Perché lo stato transazionale non è esplicito. Il frontend assume che se l'utente compila 4 sezioni, il backend digerirà tutto magicamente. I punti di ramificazione critici sono la gestione degli "Errori Parziali" (es. utente creato, ma tessera fallita).
- **Coupling con `routes.ts`:** È asfissiante. `routes.ts` fa da passacarte per payload pachidermici solo perché la maschera frontend non sa fare richieste chirurgiche separate. Confermo al 100%: l'unica via sicura è spacchettare modulo per modulo con supervisione manuale. Qualsiasi refactoring automatico massivo inietterebbe bug logici devastanti non rilevabili dai test.

## 5. Le prossime 6-8 settimane — come le imposteresti TU lato frontend

Se fossi il Lead:

**PRIORITÀ ASSOLUTE:**
1. **Rimuovere UI FREEZE 12_Gemdario:** Il bug del raggruppamento planning va ucciso. Il calendario è la pagina più vista, non può rimanere congelata per test.
2. **Fix UI campi nascosti (PRIORITA 1b):** Quei 54 campi Athena non visti mi terrorizzano. Dobbiamo esporli prima possibile, magari in un tab "Dati Avanzati" o "Storico Athena" in `scheda-utente`, altrimenti rischiamo che vengano inavvertitamente piallati al primo aggiornamento anagrafico.
3. **Refactor `calendar.tsx`:** Almeno un'estrazione delle funzioni helper di calcolo temporale in file `.ts` puri.

**COSA RIMANDEREI CON FORZA:**
- **Tab "Incolla Testo" in /importa (StopAndGo del 05/05):** Inutile complicazione UX. Il flusso CSV/Excel va benissimo. Non bruciamo risorse qui.

## 6. SaaS multi-tenant a 2 anni — blocchi frontend

Siamo lontanissimi da una solidità multi-tenant.
- **White-label:** Usare i Design Tokens Tailwind (`stargem-red`) ci salva oggi, ma per il multi-tenant vero ci serve iniezione di variabili CSS a runtime (CSS custom properties), non classi Tailwind compilate a build-time.
- **Permessi (RBAC):** La nostra matrice è troppo piatta (`if (user.role === 'admin')`). Un multi-tenant richiederà un hook `usePermission(resource, action, tenantId)` onnipresente.
- **Multi-lingua:** Non c'è nulla. Tutte le label sono hardcoded.
- **Urgente ORA:** Integrare un wrapper di base per l'i18n (es. `react-i18next`), anche solo cablato in italiano, e wrappare le stringhe. Se non lo facciamo ora, riscrivere 400 componenti TSX tra un anno sarà un salasso economico.

## 7. Multi-tool: Cowork come regia + tu come esecutore + Claude Code Agent Teams in parallelo

- **Separazione attuale:** Funziona alla perfezione. L'approccio "Claude funzionale, AG esecutore tecnico" impedisce ad AG di allucinare feature fuori contesto di business.
- **Claude Code Agent Teams in parallelo:** **Altamente sconsigliato.** Se io (AG) e un altro Agent operiamo in parallelo sulla stessa `src/client/pages/`, avremo continui lock di file, conflitti Git irrisolvibili (sulle importazioni o sui componenti condivisi come `ActivityManagementPage`) e responsabilità ambigue sui bug. Al massimo, i Team paralleli possono operare su moduli *totalmente* isolati (es. uno fa il CSS puro, l'altro l'integrazione API), ma nel nostro stack Full-Stack React il coupling è troppo alto per agenti paralleli indisciplinati.

## 8. Cleanup file in _ANTIGRAVITY/ (lato frontend)

I file canonici e di status in `01_status_continui` (es. `B_*, H_*, I_*, F_*, D_*`) sono eccellenti e vanno conservati come Bibbia del contesto.

Tuttavia, la cartella `02_output_protocolli/` è inquinata da dozzine di micro-report della chat Corsi di fine aprile, ora totalmente inutili visto che la FASE 2 è chiusa e rendicontata in `MASTER_STATUS`.

**PROPONGO ARCHIVIAZIONE IN `99_archivio/` DELLA SEGUENTE LISTA (Motivazione: Lavoro Chat_08 chiuso, documentato in MASTER, file generano solo rumore nel vector store AI):**
- Tutti i file `audit_F2-*.md` (dal 004 al 023 del 2026_04_29)
- Tutti i file `report_F2-*.md` (dal 001 al 028 del 2026_04_29)

*Fine report. Resto in attesa in modalità STOP & GO.*
