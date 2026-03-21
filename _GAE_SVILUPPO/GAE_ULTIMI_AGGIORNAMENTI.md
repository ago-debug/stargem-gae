# Ultimi Aggiornamenti Progetto "CourseManager"
**Periodo di riferimento:** 23 Febbraio 2026 - 21 Marzo 2026

Di seguito è riportato il riepilogo dettagliato di tutti i lavori di sviluppo, refactoring e bug fixing effettuati nel progetto, suddivisi giorno per giorno a partire dal più recente.

---

### 21 Marzo 2026 (Attivazione Profilazione CRM su Scheda Cliente)
* **Sblocco e Ricalcolo Backfill Motore CRM:**
  * Diagnosticato lo stato di inattività del modulo CRM: i campi (`crmProfileLevel`, `crmProfileScore`, ecc.) erano correttamente posati su Drizzle ma totalmente vuoti nel DB locale. Eseguito un job node di backfill avviando la funzione nativa `recalculateAllActiveMembers()` calcolando lo storico per tutti i ~9500 contatti attivi.
  * Fix Algoritmo: rimosso un lookup fallace su `globalEnrollments` dentro `server/utils/crm-profiling.ts` che generava `DrizzleQueryError` non trovando la fantomatica tabella STI non ancora migrata.
* **UI/UX Interattiva CRM su Scheda Cliente (`member-dashboard.tsx`):**
  * Aggiunto bottone "Forzatura" che scatena una nuova Dialog nativa collegata all'endpoint React Query `POST /api/crm/profile/:memberId/override`. Permette l'impostazione manuale del livello, isolando il record dai calcoli automatici notturni (flag `crmProfileOverride = true`).
  * Creata nuova rotta selettiva `POST /api/crm/profile/:memberId/recalculate` nel backend (`server/routes.ts`) ed esposta via Bottone "Ricalcola" in HUD. Permette di saggiare lo score utente singolo in tempo reale in O(1) anziché richiamare pesanti /recalculate-all indiscriminati su 9000 righe.
* **Fix Bloccante Navigazione UX (Anagrafica Generale):**
  * Risolto il bug di reindirizzamento errato verso la Dashboard cliccando i clienti in Anagrafica. Tutte le invocazioni di route sul `<TableRow>`, `<Link>` testuale (Nome/Cognome) e bottone "Modifica Completa" (`/?memberId=X`) in `members.tsx` sono state corrette puntando in modo chirurgico all'unica vera scheda partecipante (`/maschera-input?memberId=X`).
  * Implementata la cliccabilità dell'intera griglia (Row Clickable) con `cursor-pointer` per migliorare l'UX, proteggendo contestualmente i Checkbox di selezione multipla tramite un `stopPropagation()` sull'evento. Non ci sono stati impatti né modifiche al backend.
* **Integrazione Definitiva CRM in Maschera Input (`maschera-input-generale.tsx`):**
  * Spostata con successo tutta la logica di profilazione visiva e operativa (Livello, Punteggio, Motivazione) dalla vecchia dashboard alla scheda cliente ufficiale ("Maschera Input").
  * Iniettata una query dedicata (`/api/members/current`) per mantenere i dati CRM sincronizzati in tempo reale senza intaccare il massivo stato persistente dei form legacy `formData`.
  * La sezione "Attività di marketing" è stata reimpaginata con un respiro a larghezza piena, uscendo dalla stretta colonna sinistra degli Allegati, ed è ora disposta orizzontalmente in fondo al blocco Anagrafica. Questa visualizzazione widescreen permette ai badge, alle motivazioni e ai bottoni interattivi di affiancarsi ordinatamente senza compressioni.
  * L'algoritmo CRM scala a **4 livelli**: `Silver`, `Gold`, `Platinum`, e `Diamond` (Score >= 100).
  * Inserito un Tooltip di spiegazione vicino all'etichetta Livello per demotivare la forzatura manuale ove non necessaria, educando il team alla profilazione automatica.

---

### 18 Marzo 2026 (Quick Wins UI Elenchi e Hardening Calendario)
* **Quick Wins UI e Selettori Anagrafici (`calendar.tsx`, `maschera-input-generale.tsx`, `multi-select-participant-type.tsx`):**
  * Dirottato il componente MultiSelect `Tipo Partecipante` dalla vecchia logica stub/errata `participant-types` alla corretta API `/api/client-categories`.
  * Rimosso il mockup massivo sui campi testuali `Comune di Residenza` e `Provincia`, agganciando nativamente tag auto-completanti HTML5 `<datalist>` snelli e JSON-costanti per i Capoluoghi principali e Sigle Provinciali, in ottica zero-fetch sulle librerie.
* **Evoluzione UX, Mapping e Navigazione Calendario (V3.1):**
  * Divelti i cruscotti asfittici: rimosso l'`overflow-hidden` e l'`height` fissa dalle Card a favore di un perimetro elastico (`max-content`) con base `min-height` proporzionale al tempo. Le card esplodono verticalmente permettendo a 6 righe di testo di esistere senza troncamenti (`hover:z-50`).
  * Architettura Doppio Click introdotta: il box gigante esegue *Deep Linking* routerato agganciando le Schede Attività singole (`/scheda-corso`, `/prenotazioni-sale`), ma senza rubare l'Edit rapido, mappato alla Matita isolata (`stopPropagation`).
  * Restaurata la gerarchia semantica Genere/Categoria: Il Titolo torna ad essere nativamente il "Genere" (che risiede testualmente in `course.name` via ComboBox). La "Categoria" non asfalta più il Genere ma sale elegantemente al rango di Badge identificativo nell'angolo testuale della Card al posto dei vetusti stub "CRS/WKS".
  * Potenziamento del Motore di Ricerca In-Memory (`searchQuery`): Il text parser front-end scorre ora agilmente anche su "SKU" e "Stato Verbale", coprendo il 100% dell'esigenza di filtro rapido da segreteria.
  * Restaurato l'`ACTIVITY_REGISTRY` esatto per la Whitelist: i menu a tendina rispettano rigidamente i 7 slug ufficiali (`corsi`, `workshop`, `lezioni-individuali`, `domeniche-movimento`, `allenamenti`, `affitti`, `campus`), sbloccando le query.
  * UI dello SKU incrementata di taglia e intensità luminosa (`opacity-80 font-semibold text-[8px]`) scollata fisicamente dal blocco capienze U/D.
* **Standardizzazione Event Card Calendario (`client/src/pages/calendar.tsx`, V2 Definitiva):**
  * Risolto il bug "Titoli Codificati": a seguito dell'adozione tecnica architetturale del "Refactor Genere", il nome delle attività non giace più nel label fallback `name`, bensì viene ora estratto in reactive join sull'anagrafica centralizzata delle `Categories`.
  * Ristabilita la dignità del Primo Insegnante: corretto il fetch monco che prelevava il solo cognome, allineandolo alla formula (Nome + Cognome) esattamente come per il secondo, restituendo uniformità alla cattedra.
  * Fixato chirurgicamente l'ingombro dello SKU/Lotto: rimosso dal contenitore centrale delle notifiche e ri-proiettato come *absolute watermark* isolato a sinistra in miniatura (6px opaco), azzerando l'invasività grafica.
  * (Si confermano attivi anche i fix precedenti: `secondaryInstructor1Id` per il modulo supplenti, auto-collasso orizzontale al posto del dummy "Nessun ins." e Color-Coding di Status su testo Verde/Rosso).
* **Prevenzione Crash di Rendering (`client/src/pages/calendar.tsx`):**
  * Risolto in via definitiva il bug critico della schermata bianca frameless ("White Screen of Death") sulla rotte del calendario. Il crash derivava da eccezioni sincrone in `useMemo` dovute a `Temporal Dead Zone` di helper non allocati e al parsing forzato di `Invalid Date` da database con `toISOString()`.
  * Inniettata la function failure-safe diagnostica `safeIsoString` integrata agli algoritmi base di date-picking per intercettare costrutti malformati/nulli senza far propagare l'errore al master component.
  * Assicurato i pool mapper dei backend fall-back `filteredCourses` ed `studioBookings` al vincolo stringente `Array.isArray` per gestire serenamente responsi network vuoti o disallineati.

---

### 15 Marzo 2026 (Refactoring Architettura Tessere & Maschera Input - Task 7)
* **Centralizzazione Logica Stagionale (`server/utils/season.ts`):**
  * Spostata tutta la logica di calcolo delle date, degli anni di inizio/fine della stagione sportiva (1 Settembre - 31 Agosto), e la generazione formale dei Codici Tessera (`2526-XYZ`) e Barcode (`T2526XYZ`) dal client React ad una Factory unificata e pura nel backend.
* **Multiplexer Controller Tessere (`/api/memberships` & `/api/maschera-generale/save`):**
  * Entrambi gli endpoint di salvataggio ora utilizzano la stessa identica *Source of Truth* (`buildMembershipPayload`). Questo azzera la possibilità di regressioni o differenze semantiche tra chi emette la tessera da Checkout e chi lo fa dalla UI Anagrafica.
  * Aggiunto un layer di sicurezza che impedisce la creazione di più tessere attive per un singolo membro per lo stesso specifico anno di competenza.
* **Revisione Frontend Maschera Input (`maschera-input-generale.tsx`):**
  * Sostituiti gli input e logiche legacy di "Nuovo/Rinnovo" con due `Select` formali per inviare i flag stringata al server: **Tipo** (`NUOVO`, `RINNOVO`) e **Competenza** (`CORRENTE`, `SUCCESSIVA`).
  * Inibita visivamente (Read-Only) la manipolazione manuale e fuorviante lato UI di "N. Tessera", "Barcode" e "Scadenza", inserendovi dei segnaposti che spiegano l'autogenerazione lato server post-salvataggio.

---

### 13 Marzo 2026 (Refactoring Calendario & Unificazione Modali Attività - Mimetismo STI)
* **Unificazione Interfaccia Calendario:**
  * Sostituiti i molteplici popup frammentati ("Nuovo Corso", "Nuova Prenotazione") con un'unica modale centralizzata **"Nuova Attività"**.
  * Introdotta una Select Dinamica "Categoria Attività" (Corso, Workshop, Prenotazione) che adatta condizionalmente l'interfaccia mostrando solo i campi strettamente necessari alla specifica tipologia.
  * Mimetismo Architetturale (STI Phase 1): La nuova UI unificata simula l'esperienza utente finale del Single Table Inheritance, ma l'inoltro dati mantiene la retrocompatibilità disaccoppiando il payload e re-indirizzandolo trasparentemente ai 3 legacy endpoint corretti (`/api/courses`, `/api/workshops`, `/api/studio-bookings`) preservando l'integrità dei dati a "11 Silos".
* **Supporto Workshop su Griglia:** Aggiunto il supporto nativo per la visualizzazione e creazione di Workshop direttamente con click rapido sugli slot vuoti del calendario.
* **Aggiornamento Nomenclatura:** Rinominata l'etichetta del menu laterale e delle direttrici da "Calendario Corsi" a "Calendario Attività", per riflettere la natura generalista del nuovo hub.

---

### 12 - 13 Marzo 2026 (Refactoring Tessere, Modal UX & Fix Routing)
*   **Fix Routing & Modal Auto-Open (`/tessere`):** Risolto il bug 404 (Pagina in allestimento) causato dal reindirizzamento legacy a `/memberships`. Ora, cliccando il pulsante "+ Nuova Tessera" in Maschera Input o cliccando sull'intera riga di un partecipante nella tabella Tessere, la Single Page Application esegue un salto istantaneo al Modale "Nuova Tessera", pre-caricando i dati dell'utente specifico senza ricaricare la pagina.
*   **Restyling UI Badge "Scaduta/Attiva":** Rimosso il badge grigio standard e introdotto un design custom (sfondi pastello rosso/verde, bordi e testi ad alto contrasto) per lo stato delle tessere nell'Intestazione (Maschera Input) e all'interno del Modale Tessere, perfettamente allineato al mockup grafico richiesto.
*   **Sicurezza Eliminazione Righe (Codice Admin):** Aggiunto un layer di sicurezza per il pulsante cestino (Trash) nella tabella Tessere. L'eliminazione diretta ora richiede esplicitamente l'inserimento del PIN di sicurezza (`1234`) tramite prompt prima di lanciare la mutation `DELETE`.
*   **Historical Data Interceptor (Fix Date Modale):** Corretto un bug logico in `memberships.tsx` dove l'apertura del modale sovrascriveva le date di tessere *scadute* con finte date future auto-generate. Ora il popup pesca sempre cronologicamente la vera "ultima tessera" registrata nel DB per quel membro (attiva o meno), rispettando lo storico esatto.

---

### 9 - 10 Marzo 2026 (Standardizzazione UI Tabelle, Maschera Input & Refactoring Duplicati)
*   **Standardizzazione Tabelle (SortableTableHead):** Implementato il componente universale `SortableTableHead` e l'hook `useSortableTable` per standardizzare l'ordinamento delle colonne con indicatori visivi coerenti (`ArrowUpDown`, `ArrowUp`, `ArrowDown`) in tutte le tabelle dell'applicazione (es. `/attivita/corsi`, Anagrafica, ecc.). Standardizzata la larghezza e l'allineamento.
*   **Affinamenti Maschera Input & Alert "Manca Dato":**
    *   Aggiunti asterischi rossi (`text-destructive`) dinamici per segnalare visibilmente tutti i campi di input non opzionali.
    *   Rimossi i vecchi suffissi testuali (C) e (J) dalle label, pulendo l'interfaccia.
    *   Introdotto un Badge inline "Manca Dato" (rosso/oro) che compare *dentro* il campo di input vuoto se il dato è obbligatorio, guidando visivamente l'operatore alla compilazione.
    *   Logica condizionale avanzata: "Codice Fiscale", "Cellulare" ed "Email" diventano istantaneamente obbligatori se l'utente inizia a compilare i dati di "Genitore 1" o "Genitore 2", garantendo la solidità dei contatti per i minorenni.
*   **Fix Crash Bloccante Server (5001):** Risolto un crash silente del server Vite/Express causato da un errore di tipizzazione TypeScript (`editingPayment` mancante nelle props) nel componente `<NuovoPagamentoModal>` all'interno di `client/src/pages/payments.tsx`, che lasciava la porta 5001 appesa in stato `EADDRINUSE`.
*   **Checkout Unificato & Payment Module:** Consolidato l'utilizzo del componente `PaymentModuleConnector.tsx` come unica interfaccia autorizzata di checkout.
*   **Motore Rilevamento Duplicati Intelligente:** Riscritto totalmente l'algoritmo di individuazione duplicati in `server/storage.ts` passando dal semplice conteggio campi a un clustering avanzato. Introdotti filtri rigidi **Anti-Famiglie** (ignora omonimie parziali di contatto se i nomi propri divergono) e **Anti-Omonimi** (richiede almeno un dato di contatto in comune per nomi identici).
*   **Unione Rapida Duplicati (1-Click):** Ridisegnata la finestra "Report Duplicati" in React. Sostituiti gli alert generici con Card interattive raggruppate per Cluster identificati. Inserito pulsante "Unisci questi X" interno ad ogni card che pre-carica i dati completi dei candidati saltando la selezione manuale dall'elenco paginato.
*   **Fix Backend Merge (`mergeMembers`):** Risolto fatal error SQL durante la funzione di unione anagrafica che bloccava il trasferimento dei pagamenti, migrando la sintassi legacy `entity_id` al nuovo schema `member_id` tramite Drizzle ORM.
*   **Affinamenti Maschera Input & Liste:** 
    * Inserito campo **Stato** (Attivo/Inattivo) nell'header della Maschera Input con pre-compilazione dinamica all'apertura.
    * Inserita label **Tipo Partecipante** visibile.
    * Aggiunto interruttore di stato on/off per il pulsante **Visualizza Tutti** nella vista Anagrafica a Lista, con salvataggio automatico dei filtri precedenti.
    * Aggiunto nuovo parametro logico di filtraggio **Stagione** passabile dall'UI agli endpoint di paginazione.
    * Rinominata voce di menù da "Categorie (Materie)" a **Categorie Attività**.

---

### 8 Marzo 2026 (Progettazione V2 & UI Guidelines)
*   **Architettura SaaS e Database V2:** Conclusa l'analisi strategica per risolvere la frammentazione a "11 Silos". Codificata la mappa futura (`2_database_map_future.md`) e splittato l'immenso schema ERD in 3 mini-diagrammi Mermaid (Anagrafiche, Motore Attività, Pagamenti).
*   **Draft Schema Drizzle:** Scritto il `6_schema_v2_draft.ts`, un mock-up isolato contenente le nuove super-tabelle unificate (es. `activities`, `enrollments`) e il nuovo "Modulo 6" per CRM Leads e App Insegnanti/Team.
*   **Piano UI e Linee Guida:** Redatto `4_GAE_Piano_Interazione_UI.md` catalogando i difetti storici (UX listini bloccanti in Cassa, fix Lazy Load Anagrafica) e le funzioni per le 3 App (Staff, Team, User).
*   **Codifica Cromatica Realistica:** Creato `5_GAE_Linee_Guida_Grafiche_UI.md` estraendo le vere variabili CSS Tailwind del progetto (es. `--primary`, `.gold-3d-button`) per standardizzare lo sviluppo dei futuri form.

---

### 4 - 5 Marzo 2026
* **Mappatura DB e Documentazione Architetturale Definitiva:**
  * Sviluppato il file `database_map.md` con l'Entity-Relationship Diagram (ERD) esatto dell'attuale struttura Drizzle ORM.
  * Creato il file guida `GAE_progetto_architettura_e_collegamenti_database.md` indicando le aree "intoccabili" (tabella pagamenti e i 12 silos delle attività) e le "zone sicure" per lo sviluppo futuro.
  * Stilato il documento visionario `database_map_future.md` (Single Table Inheritance) che illustra come collassare le attuali 12 tabelle di attività in sole 3 macro-tabelle (`activities`, `categories`, `activity_details`) per azzerare il debito tecnico futuro, definendo il vocabolario ufficiale dell'appliance (Macro-Attività -> Categorie -> Singolo Corso/Dettaglio -> Iscritti).
* **Prevenzione "Pagamenti Orfani" (Strict Security):**
  * **Backend:** Implementata una validazione ferrea negli endpoint `POST /api/payments` e `POST /api/maschera-generale/save`. Il server ora blocca e rifiuta fisicamente la transazione (Throw Error) se un pagamento in arrivo ha tutte le 12 chiavi relazionali (Foreign Keys delle attività) vuote/`null`.
  * **Frontend:** Aggiunta una sicurezza visiva dinamica nella `maschera-input-generale.tsx`. Il pulsante "Salva" si disabilita automaticamente (Grigio) scansionando l'array dei pagamenti in tempo reale se rileva transazioni sospese prive di un'attività valida assegnata dalla tendina, avvertendo l'operatore tramite tooltip.

### 3 Marzo 2026
* **Refactoring UI Maschera Input & Badge "Gold 3D" (Progetto Z2):** 
  * Trasformata integralmente la sezione "Attività" della Maschera Input. Rimossi i vecchi e fuorvianti form con menu a tendina per le 10 categorie secondarie (Prove a Pagamento, Campus, Vacanze Studio, ecc).
  * Inserite al loro posto **Tabelle a Elenco Reattive** standardizzate per listare direttamente gli iscritti di un utente, con visualizzazione badge dettagli (`EnrollmentDetailBadge`) e stato ("Attivo").
  * Introdotto un indicatore di Notifica Intelligente (Badge Gold) nell'intestazione di ogni singola categoria e sulla Sidebar di Navigazione, visibile a colpo d'occhio, che si attiva dinamicamente mostrando il conteggio di iscrizioni in essere.
  * Inserite nel ciclo fetch (`useQuery`) e completate con modulo di formattazione unificato tutte le attività compresi i *Servizi Extra*, integrato con API lato client per check asincrono dei pagamenti/prenotazioni. Merchandising commutato in Empty State Table per preservare l'uniformità visiva UX/UI dell'Anagrafica Read-Only.
* **Note "Volanti" (Nuova Nota Qui) Migliorate:** La funzionalità delle note in sovrimpressione nell'app è stata espansa. Ora le note sono **collassabili** (si possono ridurre a icona a forma di "barra" cliccando la freccia per non oscurare i contenuti dietro) ed **editabili** "al volo" tramite un editor inline, cliccando sull'icona della matita.
* **Correzioni Testuali Quote Listini:** Aggiornato il banner precauzionale per i listini, rimuovendo diciture vecchie e fuorvianti su richiesta.

### 2 Marzo 2026
* **Integrazione Totale "Servizi Extra":** Completata la rete di interfacce dell'attività Servizi Extra. Creata la tabella `bookingServiceCategories` per le sue categorie con relativi endpoint CRUD. Inseriti i servizi extra sia in "Attività" che nella gestione "Categorie". Implementato endpoint per lettura iscritti incrociato con i booking.
* **Aggiornamento HomePage Listini (`listini-old` / `listini-home`):** Inserite 4 categorie mancanti di default per le quote: Prove a Pagamento, Prove Gratuite, Lezioni Singole, Servizi Extra.
* **Fix Bug Salvataggio Quote Listini:** Diagnosticato e risolto il problema critico nella griglia "Quote e Agevolazioni" che causava il parziale annullamento e/o la corruzione (sovrapposizione stringhe JSON) delle nuove righe. Implementata validazione e sanificazione dei dati in pre-invio da `quote-listini.tsx` (stripping di `createdAt`/`updatedAt` e re-parsing strict del JSON mensile) impedendo ad ORM Drizzle di generare conflitti sulle Bulk Insert.
* **UI Audit Anagrafiche:** Ottimizzata l'interfaccia nel pannello dell'Anagrafica Partecipante per mostrare in modo pulito e affidabile le info di Audit ("Aggiornato da / Il") dal database.

### 1 Marzo 2026
* **Refactoring Commenti Team "Chat-Like":** 
  * Trasformata la vecchia bacheca dei commenti in un formato "Threaded" introducendo il supporto al campo `parentId` nella tabella `teamComments`.
  * L'Interfaccia ora indentazione delle risposte in stile chat e visualizza un tab "Archiviati". 
  * Rinnovata l'icona della campanellina "Notifiche" in Dashboard con un badge rosso contenente il conteggio effettivo esatto da DB dei messaggi non letti.
  * Inseriti i quick-action e fast-reply sotto ai messaggi.

### 28 Febbraio 2026
* **Backend-Frontend "Iscritti per Attività":** Completato il mega-raccordo che toglie i dati finti e collega il componente `iscritti_per_attivita.tsx` per **TUTTE e 11 le tipologie di attività** ai nuovi endpoint del backend (scaricando le iscrizioni autentiche ed elaborate).
* **Nuovi Pagamenti:** `maschera-input-generale.tsx` configurata per inoltrare i nuovi dati specificando in maniera modulare su quale delle 11 tabelle di attività (e pagamenti) scrivere, aggiornando in parallelo le schermate laterali.

### 27 Febbraio 2026
* **Sistema "Todo List" Collaborativa e AI:** Sviluppata e installata da zero una Todo List "Real". 
  * Schema DB (`todos`) per audit (creato da, completato da, ecc.). 
  * Riscrittura modulo per usare React Query e sync cloud invece che Cache locale. 
  * Notifiche real-time integrate nell'header principale. 
  * Implementato pulsante Intelligenza Artificiale (CoPilot AI) nativo per la generazione smart di reminder.
* **Multi-select & Badge Dinamici:** Resi reattivi i menu a tendina e i badge (`EnrollmentDetailBadge`) per la registrazione ai corsi/workshop permettendo un'organizzazione e selezione visiva fluida e persistente.

### 26 Febbraio 2026
* **Fix Crash Bloccante Server (5001):** Individuato e piallato un fatal error del backend a causa di query malformate (`secondaryInstructor2Id` rimosso). 
* **Controllo Porte Network:** Verificata ed isolata la logica di `app.listen()` su interfaccia `::` e porte fallback, bloccando doppie istanze nodemon che bloccavano il frontend.

### 25 Febbraio 2026
* **Fix Crash White Screen & Router:** Soluzione al glitch dello schermo bianco su `Maschera Input`. Corretta gestione dello stato nel menu radiale a cascata (`Select`) e risincronizzazione del router in `App.tsx`.
* **Rinominazione Rotte Globali:** Adeguati tutti i collegamenti, restrizioni server e stringhe URL da `/maschera-generale` a `/maschera-input` come richiesto.
* **Ottimizzazione UX e Navigazione:** Definitivamente nascosta la scheda laterale "Scheda Iscrizioni". Al suo posto la `courses.tsx` gestisce embedded sia anagrafiche sia registri d'appello passando via bottone id specifici. Modificata UX inserimento nuovi membri per prevenzione doppia anagrafica da input Codice Fiscale.

### 23-24 Febbraio 2026
* **Avvio Refactoring Corsi:** Riorganizzazione della struttura a componente `courses.tsx` per ospitare componenti modulari riutilizzabili ed espansione dati di iscrizione (gettoni, rimborsi, log) a scomparsa, avviando il ciclo di aggiornamenti conclusi il 25 Febbraio.

---
*Documento generato e aggiornato al 21 Marzo 2026 sulla base dello storico conversazioni con l'AI e modifiche di GIT.*
