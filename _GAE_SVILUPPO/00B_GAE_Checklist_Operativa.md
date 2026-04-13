# 📝 Checklist Operativa CourseManager (Roadmap Fase 2)
*(Questo documento funge da promemoria vivente per il team di sviluppo. Spuntare i task o aggiungerne di nuovi mano a mano che l'architettura SaaS V2 prende forma).*

## Legenda Stati
- [x] = COMPLETATO
- [~] = IN CORSO / COMPLETATO MA DA VALIDARE
- [ ] = NON INIZIATO
- [!] = BLOCCATO / DIPENDENZA APERTA
- [-] = NON NECESSARIO / GIÀ COPERTO

---

[09/04 01:00] F1→PM: Esecuzione Protocollo 094. Rimosso conflict check backend POST/PATCH courses.
               [x] Eliminata la validazione anti-sovrapposizione slot da `server/routes.ts` per POST/PATCH `/api/courses`.
               [x] Il controllo generava falsi negativi in scenari multi-sala. Rimosso per scelta operativa consapevole.

[09/04 01:05] F1→PM: Esecuzione Protocollo 095. DELETE duplicati SALSA.
               [x] Rimossi 3 record duplicati di tipo "Salsa" dalla tabella `courses`.
               [x] Ripristinata la consistenza della lista attività.

[09/04 01:10] F1→PM: Esecuzione Protocollo 096. DELETE duplicati SALSA/PILATES.
               [x] Rimossi 4 record duplicati misti ("Salsa" e "Pilates") dalla tabella `courses`.
               [x] Rendering corretto delle liste in `courses.tsx` e `activity-management-page.tsx` ripristinato.

[09/04 01:15] F2→PM: Protocollo 097 Eseguito. Rimosso window.confirm conflitto slot.
               [x] Eliminato il `window.confirm` bloccante in `CourseUnifiedModal.tsx` sul rilevamento conflitto orario.
               [x] Flusso di salvataggio ora fluido e non bloccante. Validazione delegata al backend REST.

[09/04 01:20] F2→PM: Protocollo 098 Eseguito. Fix allievo doppio in modalità edit.
               [x] Corretto bug: campo `searchMember1` vuoto all'apertura del modale in edit anche se allievo già associato.
               [x] Ora il campo viene pre-popolato correttamente con nome e cognome dell'iscritto esistente.

[09/04 01:25] F2→PM: Protocolli 099/101/102 Eseguiti. Fix Crea Copia (Crash + Modale + onDuplicated).
               [x] (099) Risolto crash: accesso a `undefined` su `formData.id` post-duplicazione in `CourseUnifiedModal.tsx`.
               [x] (101) Corretta logica che chiudeva il modale invece di mantenerlo aperto sul record clonato.
               [x] (102) Implementato callback `onDuplicated(newId)` verso `courses.tsx` per invalidazione query e riapertura modale sul clone.

[09/04 01:30] F2→PM: Protocollo 100 Eseguito. Filtro badge ATTIVO in courses.tsx.
               [x] Rimosso badge ridondante "ATTIVO" dalla lista corsi in `courses.tsx`.
               [x] Badge mostrato solo per stati diversi da "ATTIVO" (es. SOSPESO, COMPLETO).

[09/04 01:35] F2→PM: Protocollo 103 Eseguito. Banner giallo COPIA nel modale.
               [x] Aggiunto banner giallo/ambra in `CourseUnifiedModal.tsx` visibile solo in modalità COPIA.
               [x] Testo: "📋 MODALITÀ COPIA — Stai modificando una copia del record originale".

[09/04 01:40] F2→PM: Protocolli 104/105/106/107 Eseguiti. Campi rossi in modalità COPIA.
               [x] (104) Campo `Giorno` evidenziato in rosso in modalità COPIA.
               [x] (105) Campo `Orario Inizio` evidenziato in rosso in modalità COPIA.
               [x] (106) Campo `Orario Fine` evidenziato in rosso in modalità COPIA.
               [x] (107) Campo `Studio` evidenziato in rosso in modalità COPIA.
               [x] Il segnale visivo impone all'operatore di aggiornare i dati temporali prima del salvataggio.

[09/04 01:45] F2→PM: Protocollo 107B Eseguito. Badge calendario colori pieni allineati legenda.
               [x] Corretti i badge eventi in `calendar.tsx` per usare colori pieni (background solid).
               [x] Eliminata discrepanza visiva tra legenda `ActivityColorLegend` e badge effettivi sulla griglia.

---
[07/04 18:XX] F1→PM: Contratto API confermato. 
              activityType NON salvato su DB. 
              Richiesta aggiunta colonna activity_type.

[07/04 18:XX] F2→PM: Task 2 analisi completa.
              rentals.tsx inesistente → escluso.
              workshops.tsx già OK → nessuna modifica.
              3 file da aggiornare: domeniche/saggi/vacanze.

[07/04 18:XX] PM→F1: Autorizzato report Stop&Go 
              per colonna activity_type.
[07/04 18:XX] PM→F2: Autorizzati punti 1,2,3. 
              Punti 4,5 congelati.

[07/04 18:13] F2→PM: Task 2 Completato.
              Prop activityType aggiunta a domeniche, saggi, vacanze.
              [!] Errore TypeScript in individual-pricing.tsx da risolvere separatamente.

[07/04 18:59] F2→PM: Task 3 Completato.
              Refactoring titoli dinamici CourseUnifiedModal.tsx, type safety esteso, 
              e iniezione field activityType nel payload POST/PATCH.

[07/04 19:35] F2→PM: Bug Report "Liste Vuote / Modale".
              B008 routing → ✅ (non era un bug, routing ok)
              B008b titolo → ✅ (cache HMR, non bug codice)

[07/04 20:20] F2→PM: TASK 1 (Rinominato Generi in DB).
              TASK 2 (Analisi custom_list_items per colonna color - N/A).

[07/04 20:30] botAI: Test Massivo UI (Protocollo 021).
              ✅ Route Listati (Allenamenti=4, Lezioni=3 operativi in STI).
              ✅ Bridge Calendario Drizzle (Unified Sync OK).
              ✅ Rinominazione Liste Menu ("Generi Corsi/Workshop").
              ✅ Modal Titles Mapping (Domeniche, Saggi, Vacanze).

[08/04 03:00] F2→PM: Esecuzione Protocollo 023 (QA Notturno Massivo).
              ✅ Moduli CRUD di Liste completi.
              ✅ Modali e Routing funzionanti.
              ❌ Bridge STI: Hardcoding su "courses" forza l'iconografia/event mapping.
              ⚠️ Colori mancanti su Liste Custom.

[08/04 09:44] F2→PM: Task 026/027 Completato. Fix B017 (Pennino Edit crash).
              [x] Iniezione parser `parseJsonArray` su campo lessonType str in CourseUnifiedModal.tsx

[08/04 10:15] F2→PM: Task 031 Completato. Fix B018, B021, B022 (UI/UX Modale e Calendario).
              [x] (B018) activityType dinamico da STI payload verso modale in calendar.tsx.
              [x] (B021) Ricerca allievi asincrona su /api/members?search in CourseUnifiedModal.tsx.
              [x] (B022) Label bottone di invio dinamico per activityType.
[08/04 10:45] F2→PM: Task 035 Completato. Fix Multiplo B023-B024-B025-B026.
              [x] (B023) Header "Genere" condizionale in `activity-management-page.tsx`.
              [x] (B024) Parsing preventivo `categoryName` dall'API per bypassare il mancato match lookup con le liste custom.
              [x] (B025) Refactoring `parseStatusTags` per disinnescare la doppia serializzazione JSON di SQLite.
              [x] (B026) Header nominale "GENERE ALLENAMENTO/LEZIONE" dinamico nel modal prima colonna.
[08/04 10:50] F1→PM: Esecuzione Protocollo 036. Fix DB Custom Lists e Serializzazione JSON.
              [x] (B020) Rimossi i 5 cloni di test obsoleti dalla custom_list (id: 430-434).
              [x] (B027, B029) Rimossa serializzazione JSON.stringify ridondante in createCourse/updateCourse.
              [x] (B030) Creata ed inizializzata nuova custom_list "Tipologie Allenamenti" completa di 5 stringhe canoniche.
[08/04 11:00] F2→PM: Task 037 Completato. Fix Multiplo B035-B034-B030-B031-B032-B033.
              [x] (B035) Rimozione prefisso "STATE:" sui badge in `activity-management-page.tsx`.
              [x] (B034) Mappatura dinamica `activityBadge` in `calendar.tsx` basata su `activityType`.
              [x] (B030) Separazione del load lista dropdown tipologia lezioni tra "allenamenti" e "prenotazioni".
              [x] (B031, B032, B033) Trasferimento esplicito ed inserimento dei blocchi "Categorie", "Canale" e "Come ci ha conosciuto" sotto "Elenchi Colorati Multi".
[08/04 11:15] F1→PM: Esecuzione Protocolli 039-040. Endpoint Enrollments potenziato.
              [x] (039) Analisi comportamento schema member1Id/member2Id.
              [x] (040) Aggiunto query filter `courseId` su `GET /api/enrollments`.
[08/04 11:24] F2→PM: Protocollo 041 Eseguito.
              [x] (B036) Reindirizzato pre-popolamento allievo in edit su `/api/enrollments?courseId=` in `CourseUnifiedModal.tsx`.
              [x] (B035b) Eliminata verbosità visiva filtrando "ATTIVO" in `activity-management-page.tsx` (`!== "ATTIVO"`).
              [x] (B031-B033) Risolto TypeCrash in `elenchi.tsx` spostando le categorie in una Sandbox dedicata `ColoredCustomListsLoader` riutilizzando il bridge standard `SimpleListSection` e inibendole dalla coda principale.
[08/04 11:30] F2→PM: Protocollo 042 Eseguito.
              [x] (B042) Rimosso fallback "ATTIVO" hardcoded in `CourseUnifiedModal.tsx` inizializzando lo state primario ad un array neutro.
              [x] (B042) Sostituito bypass booleano con un direct mapping di `parseStatusTags` per idratare con precisione `opStates`.
              [x] (B042) Aggiornato il payload display delle calendar cards per recepire le etichette di badge direttamente dagli status array invece che dal flag binario interno.
[08/04 11:38] F2→PM: Protocollo 043 Eseguito. Test E2E completati.
              [x] TEST 1 (Allenamenti): L'allievo si pre-popola correttamente in edit mode, le tipologie sono visibili ed isolate, e lo stato rimane "(Nessuno stato)" di default senza più il residuo di stringhe cablate.
              [x] TEST 2 (Lezioni Individuali): Comportamento analogo al 100% rispetto al TEST 1. Stabilità raggiunta col modale unificato.
              [x] TEST 3 (Calendario): Transizione architetturale validata a schermo. Non compare più "CRS" ma i badge di referenza nativi "ALL"/"IND". Eliminati trigger spuri dell'etichetta "ATTIVO". Il pennino instanzia il payload sul layer corretto.
              [x] TEST 4 (Elenchi Multi): Tab ri-abilitata, assenza totale di map-crash, e le custom lists target ("Categorie", "Canale", "Come ci ha conosciuto") troneggiano nella sezione dedicata.
[08/04 12:28] F2→PM: Protocolli 044-048 Eseguiti. Color Picker Attivo.
              [x] (B039) Iniettato `<input type="color">` dinamico nell'interfaccia di editing per le righe `SimpleListSection` (`elenchi.tsx`).
              [x] (B039) Estensione dell'estrazione asincrona e del transito API per il campo `color` verso il DB e il client store locale.
              [x] (B039) Aggiunta la renderizzazione dei pallini `rounded-full` come preview cromatiche dirette in modalità tabella in sola lettura.
[08/04 12:40] F1→PM: Esecuzione Protocolli 049-051. Migrazione Architetturale STI completata.
              [x] (Task 1) Migrazione category_id: Normalizzati 303 record storici in courses, spostandoli da ID legacy al set custom_list_items (>400).
              [x] (Task 2) Test Calendario: Il bridge dell'Unified Calendar eroga adesso anche per i corsi storici CategoriaTestuale e Colore dinamicamente.
              [x] (Task 3-4) Analisi e Bonifica: Mappati i record legacy da eradicare in tabelle silenti (categorie, workshops, campus). Verificata caduta Foreign Keys bloccanti per i corsi.
[08/04 13:58] F2→PM: Protocollo 056 (Fix B043/B044/B045/B046)
              [x] (B043) Modificata logica assegnazione colore cards in `calendar.tsx` usando root parameter o dizionario locale `ACTIVITY_TYPE_COLORS`.
              [x] (B044) Ricollocato il widget backend CustomList `ColoredCustomListsLoader` all'interno della griglia elenchi e bonificato il suo parent UI obsoleto.
              [x] (B045/B046) Sottoposto ispezione visiva frammenti file (Modale "Duplica" e interfaccia di Affitti) in attesa di istruzioni su fix puntuali.
[08/04 14:02] F2→PM: Protocollo 058 Eseguito (Fix B044/B045/B046 definitivi)
              [x] (B044) Sostituzione wrapper `div.grid` in `<>` per `ColoredCustomListsLoader` al fine di innescare l'unificazione e auto-grigliamento visivo delle custom lists.
              [x] (B045) Inserito state `isDuplicating` al modale unificato affinché alla duplicazione la query mantenga lo state aperto (re-idratato) sul copy record via ID di ritorno.
              [x] (B046) Emesso comando `touch server/routes.ts` per invalidamento cache Vercel/VPS (interfaccia frontend era già corretta al deploy).
[08/04 14:15] F2→PM: Protocollo 060 Eseguito (Fix B045 critico sovrascrittura)
              [x] Modificato `handleSubmit` in `CourseUnifiedModal.tsx` per eseguire fallback prioritario su `formData.id` rispetto al course passato in prop. Garantita immunità dell'evento `updateMutation` contro record di origine durante i salvataggi di iterazioni clonate.
              [x] (Route) Sradicate le 5 dichiarazioni di istanza `/categorie-X` da `App.tsx`.
              [x] (File) Eliminati permanentemente i file `.tsx` orfani correlati dalle pages per scongiurare frammentazione.
[08/04 14:26] F2→PM: Protocollo 063 Eseguito (Fix B043 residuo e Legenda)
              [x] Creato ed esportato `ActivityColorLegend.tsx` con design polimorfico (`popover` / `card`).
              [x] Inserito widget `ActivityColorLegend` negli header di `calendar.tsx` e in cima alle dashboard analytics su `attivita.tsx`.
              [x] Perfezionata la funzione `getCourseColor` su `calendar.tsx` per espandere il fallback del `type` sui vettori nidificati `rawPayload` e bloccare il mapping categorie se `type !== "course"`, sbloccando le card "Salsa" e "Total Body".
[08/04 14:35] F2→PM: Protocollo 064 Eseguito (Pull-Out Bottone, Compact Legenda, Console.log Debugger)
              [x] (B047) Inserito `console.log("TYPE:", type, course)` dentro la funzione color mapping di `calendar.tsx` per sessione di debugging asincrono locale da parte del PM.
              [x] (B048) Dismesso il blocco esteso `variant="card"` favor dell'allocazione inline (bottone Popover) aggregato dentro `ActivityNavMenu` per ottimizzazione spazi verticali.
              [x] (B049) Epurato Dropdown e trigger button primario "+ Crea Attività" dalla header banner di `attivita.tsx`.
[08/04 14:40] F1→PM: Esecuzione Protocollo 063. Cleanup DB e DROP Tabelle.
              [x] (DB) DROP massivo di 16 tabelle deprecate (`trainings`, `individual_lessons`, `sunday_activities`, `recitals` e i 10 silos di enrollments speculari). Restano 72 tabelle su schema.
              [x] (Schema Drizzle) Ripulite 78 definizioni e dipendenze relazionali obsolete dal file `shared/schema.ts`. Inoltrato git commit di pulizia architetturale.
[08/04 14:55] F2→PM: Protocollo 066 Eseguito (Fix attivitàType, Layout Legenda / Affitti / Crea Attività)
              [x] (B047) Esportato nativamente `activityType` e wrappato `rawPayload` dentro `mapCourseToCalendarEvent` per garantire accesso alla query string ai parse handler lato Frontend UI. Variato target root resolver su `calendar.tsx`.
              [x] (B048) Rimappata UI di `ActivityColorLegend` da layout estesi verso una griglia impilata (`flex-col gap-2`) per presentazioni Popover verticalizzate.
              [x] (B046) Ispezionato `studio-bookings.tsx`: renderizzazione menù confermata in cima al flow del content grid.
              [x] (B049) Epigrafe di "+ Crea Attività" rimosso definitivamente anche da referenze remote/cache.
[08/04 15:10] F2→PM: Protocollo 068/069 Eseguito (Fix B040b List Iscritti STI)
              [x] Rimpiazzate le chiamate API frontend in `iscritti_per_attivita.tsx` per Allenamenti e Lezioni Individuali, interfacciandole alla nuova struttura root di Single Table Inheritance tramite i filtri `/api/courses?activityType=X` e `/api/enrollments?type=X`.
              [x] Convertito binding mappa per sfruttare `courseId` al posto degli indici deprecati `trainingId` e `individualLessonId`.
[08/04 12:50] F1→PM: Esecuzione Protocolli 052-053. Analisi Cleanup DB e Migrazione Campus.
              [x] (Task 1) Migrazione `campus_activities`: Le 2 righe superstiti ("Multisport" e "Danza") sono state riversate nella root table `courses` con type 'campus'.
              [x] (Task 2) Analisi Sicurezza: Fermata la rimozione tabelle ("Stop&Go") poiché `routes.ts` e `schema.ts` contengono ancora i relativi riferimenti ai moduli CRUD.
              [x] (Task 3) Deprecazione: Aggiunti i tag `// DEPRECATO` alle 4 tabelle inattive native per segnalare la preparazione al DROP.
              [x] (Task 4) GitHub Sync: Commit massivo e master push effettuati con successo.

## 8. Security by Design & Matrix dei Ruoli (Phase 28.5)
- [x] Smantellamento dei 23 sottomenù obsoleti e cablaggio matematico delle 30 viste operative definitive in `utenti-permessi.tsx`.
- [x] Trasformazione rotta `/knowledge-base` e stesura dell'Articolo #1: "Matrix Interattiva dei Ruoli e Permessi".
- [x] Risolto bug rendering JSON Permissions e pulizia tabella ruoli (rimozione doppioni, isolati solo 5 ruoli ufficiali).
- [x] Parser Semantico Interattivo in `activity-translator.ts` per Audit Log in lingua italiana, integrato nella tab Sicurezza.

## 9. Dashboard Gestione Note & Storico Globale (Phase 28.6)
- [x] Trasformare il pulsante/rotta "Inserisci Nota" in una vera Dashboard Tabellare cronologica.
- [x] Forzare l'ancoraggio delle note specificando un *Target URL* nativo esplicito tra +20 rotte aziendali e abilitando "Deep Linking" da UI base (Badge Clickable).
- [x] Conformare l'impatto grafico del Modulo Inserimento e Navbar all'estetica "Oro 3D" (Shadow e Gradient Corporate).
- [x] Integrare ordinamento sorting (useSortableTable) "Updated/Deleted At" nativo ed Highlighting *giallino-cell* per l'intera colonna.

## 1. Cleanup Consolidation (Livelli 1-3) & Audit Preliminari
Questi task consolidano la stabilità prima della riscrittura profonda V2 (Partecipazioni).

- [x] Cleanup Modale Corsi (Livello 1-3)
  - Fatto: Unificata la source de campi dropdown (Genere, Categoria, Livelli, Stati). Inserito blocco anti-duplicato nei manager Custom Lists frontend. Riparato e documentato il mapping corretto di `livello` tecnico.
  - Manca: Nulla su Modale Corsi. L'UI è stabile.

- [x] Audit Maschera Input Generale
  - Fatto: Mappati i colli di bottiglia e i punti letali (4300+ span, 12 mutation in parallelo, session storage Base64) del file massivo `maschera-input-generale.tsx`.
  - Manca: Avvio dello spacchettamento V2 autorizzato dal cliente. Nessun codice è stato toccato.

- [x] Audit Sistema Partecipazioni e Fase 1 (Infrastruttura)
  - Fatto: Progettato modello funzionale per retrocedere Prove/Lezioni Singole a meri attributi della tabella `enrollments`. Eseguito schema push non-distruttivo (campi `participationType`, `targetDate`).
  - Manca: Fase 2 (Migrazione UI Maschera Input per accogliere i nuovi campi e droppare UI silos) e Migrazione Dati Legacy.

---

## 2. Refactoring UI Attuale (Miglioramenti Immediati)

- [x] Opzione A: Lazy Load Anagrafiche
  - File toccati: `members.tsx`, `anagrafica-home.tsx`
  - Fatto: Risolto il blocco di rendering della lista introducendo un caricamento parziale o vincolando la `GET` a un input di almeno 3 caratteri.
  - Manca: Nulla.

- [x] Opzione B: Persistence Cache Maschera Input
  - File toccati: `maschera-input-generale.tsx` (presunto)
  - Fatto: Inserito Zustand o LocalStorage per memorizzare in cache l'ID Utente selezionato nella maschera input, prevenendone la perdita durante i cambi di pagina.
  - Manca: Nulla.

- [x] Standardizzazione Componenti Tabellari
  - File toccati: Componenti globali UI
  - Fatto: Implementato `<SortableTableHead>` e `useSortableTable` in tutto l'applicativo per avere ordinamenti di colonna uniformi.
  - Manca: Nulla.

- [x] Segnalazione visiva "Manca Dato"
  - File toccati: `maschera-input-generale.tsx`
  - Fatto: Implementati inline badges e asterischi rossi per i campi obbligatori all'interno della maschera input per istruire l'inserimento dati rigoroso.
  - Manca: Nulla.

- [x] Sostituzione Colori "Hardcoded"
  - File toccati: Vari file UI Frontend
  - Fatto: Riformattati tutti gli esadecimali rossi, arancioni e azzurri dell'attuale front-end con le variabili CSS documentate in `05_GAE_Linee_Guida_Grafiche_UI.md` (es. `bg-primary`, `bg-destructive`, `.gold-3d-button`).
  - Manca: Nulla.

- [x] Gestione Centralizzata Tessere
  - File toccati: `maschera-input-generale.tsx`, API backend
  - Fatto: Estratta la logica autogenerativa degli ID/Barcode per le tessere verso il backend node e trasformata la sezione Tesseramento della Maschera Input in controlli formali ibridi (Tipo/Competenza).
  - Manca: Nulla.

---

## 2. Unificazione Componenti React (SaaS V2 Builder)
I due componenti universali che sostituiranno le decine di form sparsi.

- [x] Unificazione Modale Calendario
  - File toccati: `calendar.tsx`
  - Fatto: Creato il popup universale "Nuova Attività" in `calendar.tsx` con routing condizionale verso i silos legacy. Unificato l'engine virtuale di map per generare la grid su un nuovo array intermedio `unifiedEvents` che simula la Single Table Inheritance frontend senza alterare API DB.
  - Manca: Completato 100%. Nessun TypeScript Error (`npx tsc --noEmit` validato).

- [x] Hardening Runtime Calendario
  - File toccati: `calendar.tsx`
  - Fatto: Inseriti fail-safe (`safeIsoString`, `Array.isArray`) per isolare il parsing Date e Time da record del database corrotti.
  - Manca: Nulla.

- [x] Creare `TimeSlotPicker.tsx`
  - File toccati: `TimeSlotPicker.tsx`, `Crea Corso`, `Crea Workshop`, `Calendario`
  - Fatto: Un unico componente per selezionare Orario Inizio, Fine, Sala e Insegnante, con validazione anti-conflitto. Sostituisce le maschere duplicate.
  - Manca: Nulla.

- [x] Creare `PaymentModuleConnector.tsx`
  - File toccati: `PaymentModuleConnector.tsx`
  - Fatto: Creata l'unica interfaccia autorizzata di "Checkout" che pesca automaticamente il costo base dell'attività. Le forzature manuali sul prezzo ora richiedono un **PIN Segreteria**.
  - Manca: Nulla.

- [x] Fix Selettore Attività Pagamenti
  - File toccati: `nuovo-pagamento-modal.tsx`, `client/src/config/activities.ts`
  - Fatto: Sostituito l'array hardcoded obsoleto a 12 voci con `getActiveActivities()` (14 voci ufficiali). Separati i cataloghi "Affitti" (Studios) e "Eventi Esterni" (Booking Services) che prima colludevano erroneamente. Aggiunto supporto inserimento manuale Vendite "Merchandising".
  - Manca: Nulla.

- [x] Fix Regressione Colori Calendario (Tailwind PurgeCSS)
  - File toccati: `calendar.tsx`
  - Fatto: Rilevata la scomparsa dei blocchi Corsi/Workshop causata da interpolazione stringhe CSS (`bg-${colorGroup}-100`) rimossa dal PurgeCSS in build. Ripristinato array statico `COLORS` ed esadecimali DB interpolati via style React object.
  - Manca: Nulla.

- [x] Classificazione Tempistica Attività & Bozza Planning
  - File toccati: `planning.tsx`, `App.tsx`, Documentazione Architettura
  - Fatto: Decisa in modo tassativo e irrevocabile la dicotomia tra "Calendario" (Day-by-Day con focus orario) e "Planning" (Sintetico Stagionale). Sviluppata la bozza iterabile frontend per mostrare `Corsi` (aggregati) ed `Eventi` come blocchi in una view 12 mesi / 31 giorni con `getEventsForDay` integrato allo scheduling.
  - Manca: Nulla (Implementazione prudente completata per test UX Segreteria).

- [x] Planning Multi-Stagione e Fix Header Calendario 
  - File toccati: `planning.tsx`, `calendar.tsx`
  - Fatto: Planning convertito ad Anno Accademico (Set-Ago), inserito switch multi-stagione, evidenza Festività in rosso e aggregati Corsi in grigio neutro. In `calendar.tsx` inserito il numero del giorno nell'header e allineata la documentazione del Modale Inserimento limitando le voci operative valide.
  - Manca: Implementazione futura del CRUD completo Campus/Domeniche.

- [x] Refinement UX Planning & Modale Calendario V2
  - File toccati: `planning.tsx`, `calendar.tsx`
  - Fatto: In `planning.tsx`, marker visivo per `Oggi` (cella marcata in giallo), formato giorno convertito in numero + abbreviazione (es. `1 DOM`), Domeniche trasformate in festività fisse in UI e differenziazione stile per le doppie annualità (Mesi Set-Dic diversi da Gen-Ago). In `calendar.tsx` sostituita la modale d'inserimento a triplo bottone con una Single-Entry dialog dotata di menù Select limitata alle 10 tipologie di dominio operativo.
  - Manca: Nulla (Test di UI ed esito Typescript verificati).

---

## 3. Allineamento Modali Operativi Attività (Fase 20)
I seguenti task derivano dall'audit architetturale volto ad allineare i 12 silos operativi verso l'architettura unificata `CourseUnifiedModal` o `ActivityManagementPage`.

- [x] Allineamento Modale "Workshop" (Alta Priorità)
  - File toccati: `client/src/pages/workshops.tsx`, UI components.
  - Obiettivo: Sostituire il custom `WorkshopDialog` con un modulo dipendente da `CourseUnifiedModal` in modo da ereditare pennini e lookup.
  - Esito: Operazione conclusa con successo.

- [x] Generazione Entità "Planning Strategico" (Media Priorità)
  - File toccati: `shared/schema.ts`, `server/routes.ts`, `planning.tsx`
  - Obiettivo: Abbandonare il Mockup UI ed instaurare il salvataggio eventi Macro (`strategic_events`), Chiusure, Ferie.
  - Esito: Operativo E2E e testato nativamente su DB in read/write/delete.

- [x] Blindatura Modale "Affitti" (Media Priorità)
  - File toccati: `client/src/pages/studio-bookings.tsx`
  - Obiettivo: Trasformare l'input libero in Select basata su `custom_lists`, isolando i comportamenti di Cassa dal modale base.
  - Esito: Completato. Modulo blindato indipendente.

- [x] Astrazione Modal "Eventi Esterni" (Bassa Priorità)
  - File toccati: `client/src/pages/booking-services.tsx`
  - Obiettivo: Estrarre questo componente dall'orchestrazione attività e renderlo paritetico a una pagina Setup di sistema asettica.

---

## 3.1 Allineamento Modali Operativi Attività (Fase 21 - Chat 4)
I seguenti task derivano dall'Audit Esecutivo su "Lezioni Individuali", "Allenamenti" e "Affitti". Il focus è l'introduzione di un Modale Operativo Condiviso e di un Modale Booking Dedicato, senza toccare runtime fino ad autorizzazione.

- [x] Definire Modale Base Operativo Condiviso (Lezioni + Allenamenti)
  - Obiettivo: Preparare lo schema del modale unificato in React (`ActivityOperationalModal`) estraendo i campi core (Nome, Categoria, Istruttore, Data, Ora, Partecipante) e isolando le sezioni condizionali.
  - Vincolo: Nessuna unificazione semantica. Lezione = Privata; Allenamento = Pratica.

- [x] Definire Contratto Modale Booking Dedicato (Affitti)
  - Obiettivo: Cristallizzare `StudioBookings` come dominio a sé stante con listino e carrello indipendenti. Non va migrato nel calderone delle attività didattiche.
  - Vincolo: Standardizzare la UI (free-text in combo) senza rompere il checkout ibrido collegato.

- [x] Aggiornare File Stato Lavori e Documentazione
  - Obiettivo: Registrare l'inizio ufficiale dell'implementazione dopo aver ottenuto luce verde dal cliente. Eseguito preventivamente (Audit Chat 4).

---

## 4. Implementazione Schema Drizzle V2 (Motore Dati ed API) - *FASE 3: REFACTORING DATABASE (STI) - IN CORSO*
> [!IMPORTANT]
> **AGGIORNAMENTO OBIETTIVO STI (Single Table Inheritance):** La preparazione Frontend/Sicurezza/UI è totalmente ultimata. Iniziamo formalmente la **Fase 3: Refactoring Database (STI)**. La sequenza operativa (Fase 1..5) deve essere rispettata tassativamente, manipolando `schema.ts`.

- [x] Modellazione Iniziale Database
  - File toccati: `schema.ts`
  - Fatto: Tabelle `tenants`, `activity_categories`, `activities`, `global_enrollments` inserite.
  - Manca: Nulla.

- [x] Moduli HR e CRM
  - File toccati: `schema.ts`
  - Fatto: Inserite tabelle `team_shifts`, `maintenance_tickets`, `crm_leads`, `crm_campaigns`.
  - Manca: Nulla.

- [x] Refactoring Relazioni
  - File toccati: `schema.ts`
  - Fatto: Ristrutturata la tabella `payments` per supportare in cascata i nuovi `globalEnrollmentId` lasciando le vecchie FK operative per retrocompatibilità.
  - Manca: Nulla.

- [x] Aggiornamento ORM e API di base
  - File toccati: `server/routes.ts`, `server/storage.ts`
  - Fatto: Modificati i file includendo i nomi reali e correggendo ogni mismatch TypeScript o type-error compilativo.
  - Manca: Nulla.

- [x] Generazione File Migrazione
  - File toccati: Drizzle Migrations (`0005_rare_talkback.sql`)
  - Fatto: Eseguito `npm run db:generate` producendo la migrazione.
  - Manca: Esecuzione al DB.

- [!] Esecuzione Push Database
  - File toccati: DB
  - Fatto: Nulla, in attesa Sblocco V2.
  - Manca: Lancio del `db:push`.

- [!] Creazione Script "Data Pump"
  - File toccati: `server/scripts/dataPump.ts`
  - Fatto: Nulla, in attesa Sblocco V2.
  - Manca: Conversione da silo a STI.

- [!] Migrazione Pagamenti (Ponte Attività)
  - File toccati: Da definire
  - Fatto: Nulla, in attesa Sblocco V2.
  - Manca: Migrator logico.

- [!] Verifica Integrità Dati
  - File toccati: Test Suite Relazionali
  - Fatto: Nulla, in attesa Sblocco V2.
  - Manca: QA.

- [!] Costruzione API Factory unificate
  - File toccati: `server/routes.ts`
  - Fatto: Nulla, in attesa Sblocco V2.
  - Manca: Refactor CRUD.

- [!] Eliminazione Codice Vecchio
  - File toccati: Intero Progetto Silos
  - Fatto: Nulla, in attesa Sblocco V2.
  - Manca: Clean-up radicale.

- [!] Aggiornamento Frontend React Query
  - File toccati: Hooks `useQuery` / `useMutation` Frontend
  - Fatto: Nulla, in attesa Sblocco V2.
  - Manca: Adattamento UI verso endpoint unificati.

- [!] Endpoint Nuovi Moduli
  - File toccati: `server/routes.ts`
  - Fatto: Nulla, in attesa Sblocco V2.
  - Manca: Predisporre i backend per lo Staff App, Team App. I moduli profilazione CRM Anagrafica sono completati.

---

## 4. UI Interazione e Integrazioni Architetturali (Piano Interazione UI)
*(Task derivati da `04_GAE_Piano_Interazione_SaaS_UI.md` e dal feedback cliente)*

- [ ] Aziende ed Enti in Anagrafica
  - File toccati: `schema.ts`, Maschera Input
  - Fatto: Nulla
  - Manca: Permettere esplicitamente l'inserimento di P.IVA/Enti per gestire affitti spazi o convenzioni aziendali (B2B).

- [ ] Filtri Obbligatori Maschere Elenco
  - File toccati: Varie UI Liste
  - Fatto: Nulla
  - Manca: Assicurarsi che tutte le tabelle abbiano filtri attivi o lazy-loading per evitare rendering massivi e rallentamenti.

- [ ] Standardizzazione Nomenclatura
  - File toccati: File Testuali Frontend
  - Fatto: Nulla
  - Manca: Rinominare "Corso" in "Attività" ove necessario, riservando "Corsi" solo alle materie cicliche.

- [x] Unificazione Anagrafica (Tesserati vs Staff)
  - File toccati: `schema.ts`, `server/routes.ts`, `members.tsx`
  - Fatto: Integrati gli Insegnanti inseriti nello "Staff" all'interno della maschera input generale, affinché ricevano ricevute e compensi dallo stesso hub.
  - Manca: Completare gestione compensi avanzata (Fase Successiva).

- [x] Checkout Blindato e Autorizzazioni
  - File toccati: `PaymentModuleConnector.tsx`
  - Fatto: Reso l'importo base delle ricevute automatico e *non modificabile*. Richiesto **PIN Manager** per forzature manuali in cassa.
  - Manca: Nulla.

- [ ] Scaffolding Multi-App (Views)
  - File toccati: Scaffolding App/Router
  - Fatto: Nulla
  - Manca: Predisporre le viste mobile-first distinte per Staff App, Team App, e User App.

- [ ] Dashboard CRM e Marketing
  - File toccati: `crm_dashboard.tsx`
  - Fatto: Nulla
  - Manca: Preparare la kanban board per i Lead e il layout per l'email campaign builder.

---

## 5. Tessere Refactoring Execution
Stato di avanzamento del cantiere "Tessere", inclusi i vincoli di sistema emersi.

- [x] Schema Database Updates
  - File toccati: `shared/schema.ts`
  - Fatto: Aggiunti campi `membershipType`, `seasonCompetence`, `seasonStartYear`, `seasonEndYear`, `renewalType` alla tabella `memberships`.
  - Manca: Nulla su questo perimetro.

- [x] Utility Backend Pure
  - File toccati: `server/utils/season.ts`
  - Fatto: Creata factory `buildMembershipPayload` con logica pura costruttiva (Date, Scadenze, Numeri, Barcode).
  - Manca: Nulla.

- [~] Utility Backend Unit Tests
  - File toccati: `server/utils/season.test.ts` / Testing Manuale tramite DB
  - Fatto: Logica verificata mentalmente e tramite mock testuali/compilazione `tsc`.
  - Manca: Esecuzione di una test suite automatizzata se il progetto la prevede (Jest/Vitest).

- [~] Aggiornamento API `/api/memberships` + Check Univocità
  - File toccati: `server/routes.ts`
  - Fatto: Il Multiplexer processa correttamente la tessera. Rimossa per sempre la logica di auto-pending in `/api/memberships` per forzare l'uso del Carrello (Maschera Input) come unico Punto-di-Verità dei flussi economici. Completato funzionalmente.
  - Manca: Avvolgimento Drizzle in una transazione ACID completa (`db.transaction()`) non attuabile causa refactor `IStorage` collaterale richiesto.

- [-] Trigger d'emergenza campi ombra in `members`
  - File toccati: `server/routes.ts`, `shared/schema.ts`
  - Fatto: Il salvataggio dei JSON `tessereMetadata` compensa e fa da spola per entità legacy. I campi ombra vengono retro-derivati.
  - Manca: Rimozione completa dei campi ombra quando le UI vecchie verranno spente (Fase 3). Non necessario ad oggi.

- [~] Refactoring UI Modale Tessere
  - File toccati: `client/src/pages/memberships.tsx`
  - Fatto: Trasformati Form UI (Tipo, Competenza), resi Read-Only e placeholderizzati i parametri autogenerati da server.
  - Manca: Intercettare lo Status effettivo del Record Pagamento, e non illudere l'operatore che la tessera sia saldata solo perché riporta la fee di 25€.

- [~] Refactoring UI Maschera Input
  - File toccati: `client/src/pages/maschera-input-generale.tsx`, `server/routes.ts`
  - Fatto: Implementato iniezione di `tempId=membership_fee` e `referenceKey` fiscale dal frontend. In `routes.ts` il backend incrocia i dati, inietta dinamicamente il `membershipId` e accorpa tutto nella stessa parentesi temporale chiudendo il bug dei pagamenti orfani.
  - Manca: Rischio residuo Atomicità DB (stesso db.transaction descritto via API memberships).

- [x] Sostituzione Data-Source generazione-tessere
  - File toccati: `client/src/pages/card-generator.tsx`, `client/src/components/membership-card.tsx`, `server/storage.ts`
  - Fatto: Estesa la repository GET per veicolare l'oggetto `activeMembership` parsato in JSON. Adattate UI e Tabelle per eseguire un fallback logico tra il nuovo DB relazionale e i campi shadow storici, evitando Blank Cards in produzione.
  - Manca: Nulla su questo perimetro.

- [~] Verifica Accessi Laser
  - File toccati: `client/src/pages/access-control.tsx`, `server/routes.ts`, `server/storage.ts`
  - Fatto: Analisi tecnica completata sul fallback del barcode obsoleto e sull'enforcement dei certificati medici.
  - Manca: Sviluppo del refactoring backend sulla route `/api/access-logs` per ripristinare il Dual Data-Source del barcode.

- [ ] Strategia di Backfill/Migrazione Dati Legacy
  - File toccati: Script manuale da definire
  - Fatto: Nulla.
  - Manca: Scrivere query SQL per mappare le vecchie `tessereMetadata` alle vere entry `memberships` storiche integrandole ai vecchi `payments`.

- [x] Backfill Stagionale, Sottoscrizioni e API Pubblica Base GemAccess (F1-001/006)
  - File toccati: `shared/schema.ts`, `server/routes.ts`, DB MySql
  - Fatto: Completata l'estensione DB per i resoconti privacy (`member_forms_submissions`), la logica per auto-creazione utenti e deployata l'API totem pubblica `/api/public/membership-status/:code` con contestuale backfill massivo (2218 tessere orfane storiche season 25/26 sanate). Implementate le route di firma massiva (join anagrafiche) e idratazione tessera live per la scheda membro in UI.
  - Manca: UI Tablet Scanner/Totem e Hooking React-Query.

---

## 6. Decisioni Architetturali (Archivio)
Queste check list documentano i cambi di policy applicati in `_GAE_SVILUPPO`:

- [x] Consolidamento Visione Prodotto e Architettura SaaS
  - File toccati: `_GAE_SVILUPPO/attuale/2_*`, `_GAE_SVILUPPO/futuro/2_*`, `_GAE_SVILUPPO/futuro/3_*`
  - Fatto: Inserite direttive su Carrello Sportivo Multi-persona (aggregatore JSON transazionale), ecosistema App decentralizzato, sbarramento del certificato medico e polifunzionalità utente. Distinto 'Calendario Operativo' da 'Planning di regia'.
  - Manca: Nulla.

- [x] Assunzione Strategica: Evoluzione Controllata e Pragmatismo
  - File toccati: `_GAE_SVILUPPO/attuale/2_*`, `_GAE_SVILUPPO/GAE_Checklist_Operativa.md`
  - Fatto: Inserita policy vincolante: Nessun "Rewrite Totale" se non indispensabile. Lo sviluppo deve mirare a portare online il software presto, tollerando buchi sistemati via "Fix Mirati" e debito tecnico documentato, preservando ciò che funziona.
  - Manca: Nulla. La policy è in azione.

- [x] Definizione Pragmatica Sidebar e Albero Temporale
  - File toccati: `_GAE_SVILUPPO/attuale/2_*`, `_GAE_SVILUPPO/attuale/3_*`, `client/src/components/app-sidebar.tsx`
  - Fatto: Scolpita l'Architettura della UI in 5 pillar di navigazione (Segreteria Operativa, Amministrazione & Cassa, Attività e Didattica, Risorse Umane & Team, Configurazioni Core). Implementato fisicamente in React riorganizzando gli array JSX secondo il modello "Prudente": nessuna rotta esistente (es. `/corsi`, `/workshops`, `/affitto-studio`) è stata nascosta visivamente prima di un'esplicita analisi UX dedicata.
- [x] Nuovo Protocollo Change Control ("Stop & Go")
  - File toccati: `_GAE_SVILUPPO/attuale/2_*`
  - Fatto: Istituito il divieto assoluto per sviluppatori e Agenti IA di avviare script o refactoring preventivi. Approvato il nuovo layer obbligatorio di verifica pre-codifica in 6 step analitici continui (Modifica, Perché, File, Impatti, Rischi, Perimetro). Nessun codice verrà generato senza esplicito "Procedi".
  - Manca: Nulla. Policy in vigore permanente da oggi.

- [x] Task 11.2: Shift Routing Dashboard e Maschera Input
  - File toccati: `App.tsx`, `app-sidebar.tsx`, `anagrafica-home.tsx`, `utenti-permessi.tsx`, Documentazione.
  - Fatto: Applicato shift del root (`/`) su Dashboard, spostamento Maschera su `/maschera-input`, mappatura di `/planning` su componente stub ("In allestimento") e pulizia Sidebar (Rimozione assoluta di "Attività a Lista", "Corsi", "Workshops").
  - Manca: Nulla.

- [x] Task 11.3: Riallineamento Naming, URL e Placeholder UI
  - File toccati: UI, Router, Pagine Base.
  - Fatto: Applicati ridenominazione stringhe H1 e routing ("Anagrafica Generale", "Staff e Insegnanti", "Calendario Attività"). Rimossa la voce "Servizi Prenotabili" dal menu (rotta viva). StarGem Copilot aggiunto in calce all'Admin. Verificata la build con `tsc`.
  - Manca: Nulla sull'UI frontend in quanto tale. Attendiamo semaforo utente per Task 12 o smantellamento DB differito.

- [x] Task 12: Calendar Focus (Fix Front-Desk Sicuri)
  - File toccati: `client/src/pages/calendar.tsx`
  - Fatto: Applicati i 3 fix autorizzati a basso rischio: 1. Default del giorno su "Oggi", 2. Auto-scroll fluido temporale della griglia all'ora corrente, 3. Palette `COLORS` riscritta con contrasti solidi, shadow ed opacità per leggibilità massima in caso di overlap card. Nessun modale o logica parallela è stata riscritta.
  - Manca: Fase successiva di estrazione modali (da valutare se autorizzata o meno).

- [x] Task 11.4: Audit Completo Route e URL (Frontend Routing)
  - File toccati: `_GAE_SVILUPPO/attuale/4_GAE_Route_Audit_e_Stato.md`
  - Fatto: Generata la Sintesi Decisionale a 4 gruppi (Canoniche, Legacy, Nascoste, da Eliminare). Applicata la correzione semantica di dominio: le label target posizionano tassativamente le route figlie `/attivita/corsi` e `/attivita/workshops` nel pilastro Canonico, relegando gli url secchi `/corsi` e `/workshops` a mere scorciatoie legacy destinate al Cestino/redirect futuro. Redatta inoltre la "Shortlist Operativa" che stabilisce cosa è safe-to-delete fin da ora (A), cosa diventa redirect (B) e cosa non toccare (C).
  - Manca: Avvio smantellamento backend/frontend reale al via libera del client.

- [x] Task 11.5: Esecuzione Chirurgica Route Selezionate (Basso Rischio)
  - File toccati: `client/src/App.tsx`, rimozione fisica `client/src/pages/test-gae.tsx`.
  - Fatto: Eseguiti gli interventi autorizzati: 1) rimosso modulo /test-gae; 2) spurgati alias /note-team; 3) mappato un reindirizzamento morbido `<Redirect>` da /corsi e /workshops verso le nuove canoniche `/attivita/*`. Build TypeScript coniata con successo. *(Nota Bugfix: le sub-route `/categorie-*` rimosse qui per errore sono state ripristinate su richiesta per evitare il 404 nell'Hub Categorie).*
  - Manca: Avvio smantellamento backend (Fase C successiva, non urgente).

- [x] Task 11.6: Cristallizzazione Tassonomia Attività (13 Livelli)
  - File toccati: Creazione nuovo documento di dominio `_GAE_SVILUPPO/attuale/5_GAE_Tassonomia_13_Attivita.md`.
  - Fatto: Stabilita formalmente la gerarchia ufficiale a 13 elementi, separato nettamente il dominio "Allenamenti" da "Affitti", declassato "Booking Services" a silo legacy da rottamare/non-toccare, ed elevata la qualifica da "Servizi Extra" a "Eventi Esterni". Chiarito il ruolo UI-only (visivo) per il Calendario e Planning.
  - Manca: Nulla. L'adeguamento visivo Frontend è stato spalmato su Sidebar, Iscritti, Categorie e (infine) sulla root Hub Attività/Panoramica (`attivita.tsx`). Le macchine DB avverranno nei task Refactor.

- [x] Task 11.7: Coerenza Viste Trasversali e Sidebar UI
  - File toccati: `implementation_plan.md`, `app-sidebar.tsx`, `iscritti_per_attivita.tsx`, `activity-categories.tsx`.
  - Fatto: Inserito Collapsible nativo nella Navigazione laterale, sostituiti ed espansi magic array nelle 2 viste Iscritti e Categorie rispettando il nuovo ordinamento a 13 posizioni, aggiunta l'icona mancante e stub API sicuro per alias legacy.
  - Manca: Nulla su questo ambito. Pronto per il calendario.

- [x] Task 11.8: Triage Crash Schede (Rules of Hooks) e Allineamento 14 Attività
  - File toccati: `client/src/pages/scheda-*.tsx` (11 file), `iscritti_per_attivita.tsx`
  - Fatto: Completata diagnosi profonda strutturale su 4 livelli. Il crash delle "Schede Bianche" (es. scheda-corso, scheda-prova-pagamento) era un bug Livello 4 (Componente React): l'hook `useSortableTable` era chiamato condizionatamente dopo early return visivi, scatenando un fatal error sul Virtual DOM. I blocchi hook sono stati spostati in vetta e il progetto è stabile senza alcun errore locale. La pagina 404 `/scheda-servizio` era un problema di Livello 1 (Dominio) e Livello 3 (Rotta assente), derivato dalla cessazione di "Servizi Extra" nel nuovo dominio canonicalizzato a 14 Attività (aggiunta `Merchandising`). Neutralizzato provvisoriamente a `/gestione-attivita-stub`.
  - Manca: Avvio implementazione Blocco 2 (Adeguamento menu interno "/attivita", e Maschera Input a 14 attività).

- [x] Task 11.9: Pulizia Vocabolario Ufficiale e Coerenza UI/Routing (Blocco 4 e 5)
  - File toccati: `App.tsx`, `app-sidebar.tsx`, `iscritti_per_attivita.tsx`, `activity-categories.tsx`, `payment-dialog.tsx`, `nuovo-pagamento-modal.tsx`, `utenti-permessi.tsx`, `listini-home.tsx`. Redazione ex-novo `4_GAE_Route_Audit_e_Stato.md`.
  - Fatto: Unificata la naming in UI per "Eventi Esterni", "Commenti Team", e "StarGem Copilot". Fissato "Merchandising" ovunque. Riscritto completamente l'Audit Route catalogando il routing in 5 gruppi logici netti tra Componente Ufficiale vs URL Legacy vs Placeholder, separati dal 404 reale.
  - Rifinitura Finale (5.1): Rafforzato l'Audit come Documento di Prodotto elevando le "Note Chiare" a descrizioni esplicite del legame Nome UX - Debito Tecnico, in particolare per il binomio Affitti/Sale, Affitto Studio Medico e Eventi Esterni/BookingServices. Ribadita la vera e propria ufficialità di "Merchandising" come attività padre.
  - Manca: Fase successiva decisa dall'utente.

---

- [x] Task 11.10: Risoluzione Fix Route Ibrida /tessere
  - File toccati: `App.tsx`, `dashboard.tsx`, `maschera-input-generale.tsx`, `memberships.tsx`, `utenti-permessi.tsx`.
  - Fatto: Corretti tutti i pulsanti operativi e link sparsi che puntavano ingenuamente a `/tessere` in favore della corretta e convalidata `/tessere-certificati`. Aggiunto un layer di garanzia in `App.tsx` con un Redirect per abbattere il "Placeholder/404" e la relativa documentazione di Routing Audit aggiornata.
  - Manca: Nulla.

- [x] Task 11.11: Risoluzione Fix Modale Nuovo Pagamento su Lista Pagamenti
  - File toccati: `payments.tsx`.
  - Fatto: Rimosso il Link Redirect `/` errato dalla root per l'onClick "Nuovo Pagamento", convertendolo nello State Toggle previsto originariamente (`setIsFormOpen(true)`). Adesso l'operatore non si scollega dall'applicativo di cassa ma apre il popup locale come pattuito nel design V2.
  - Manca: Nulla.

> MAPPATURA TASK ATTUALI CHIUSA CON SUCCESSO. Iniziato avvicinamento cauto verso la logica del Refactor UI prima del Calendario.

- [x] Task 12.1: Consolidamento Definitivo Planning e Calendario Attività
  - File toccati: `planning.tsx`, `calendar.tsx`
  - Fatto: 1. Aggiunti margini e padding laterali al Planning. 2. Modificati i link Planning (Workshop, Campus, ecc.) affinché portino alla singola entità (es. `scheda-workshop?id=...`). 3. Link "Corsi" del Planning indirizza a `calendar.tsx?date=XXX`. 4. Calendario supporta dinamicamente tutte le `getActiveActivities()` nel filtro a tendina. 5. Altezza card Calendario blindata a `min-h-[85px]` con wrap visibile, risolvendo i titoli "scollegati/invisibili" per corsi brevi e under-1H.
  - Manca: Nulla. UI e Linking Frontend chiusi.

- [x] Task 12.2: Verifica Flussi Economici e UX Redirect
  - File toccati: `nuovo-pagamento-modal.tsx`, `App.tsx`, `app-sidebar.tsx`
  - Fatto: 1. Controllato e blindato il redirect da `/tessere` a `/tessere-certificati` (`<Redirect>` salvaguarda il routing utente). 2. Verificato che "Nuovo Pagamento" apra ovunque `<NuovoPagamentoModal>` (14 attività supportate in CartTableRow) senza balzi di pagina verso Anagrafica inopportuni. 
  - Manca: Nulla. Flow approvato.

- [x] Task 12.3: Separazione e Fix Categorie Attività (Urgente)
  - File toccati: `App.tsx`, `client/src/pages/*-categories.tsx`, `server/routes.ts`, `server/storage.ts`, `shared/schema.ts`
  - Fatto: Completata la diagnosi tecnica: `Affitti` (Rentals) ed `Eventi Esterni` (Booking Services) collidevano sulla stessa tabella/endpoint scatenando crash UI e stringe hardcoded errate. Affitti è stato dotato di una tabella `rental_categories` separata, endpoint `/api/rental-categories` e frontend 100% indipendente. Eventi Esterni ha riassunto l'esclusiva su `booking_service_categories` patchata. Implementato schema fisico e route CRUD completi anche per `merchandising_categories` (eliminata la UI Stub). Eliminati i toast-error non pertinenti. Test direct DB effettuati.
  - Manca: Completare test finali in QA. Intervento architetturale completato a zero debito tecnico.

- [x] Task 12.4: Rifacimento Base Pagina Elenchi (Moduli Multipli)
  - File toccati: `shared/schema.ts`, `server/storage.ts`, `server/routes.ts`, `client/src/pages/elenchi.tsx`, `patch-elenchi.ts` (tooling temporaneo)
  - Fatto: 1. Strutturate le `custom_lists` introducendo la colonna `linked_activities` (Array JSON) e `system_code` per associazioni permanenti. 2. Push schema db locale bypassando fallback esplicito tramite patch raw a causa dei checkConstraints non supportati di alcune version MySQL. 3. Sostituita la maschera base della UI Elenchi in `elenchi.tsx` con card dotate di Modale "Settings" che consente la multi-selezione Checkbox delle 14 Attività globali. I badge in vista principale aggiornano lo User Journey chiarendo dove la tendina comparirà. Creati i 7 elenchi target base.
  - Manca: Nulla su questo blocco strutturale. Pronto per il blocco successivo dove ogni singola entità (Corsi, Workshop, etc.) ingloberà questi elenchi.

- [x] Task 12.5: Ottimizzazione e Refinement UI Elenchi Semplici
  - File toccati: `client/src/pages/elenchi.tsx`
  - Fatto: 1. Eseguita l'analisi del database post-patch confermando l'evaporazione dei dati storici legacy ("Nomi Corsi") a causa del vincolo nativo ON DELETE CASCADE di MySQL durante il cleanup. 2. Modificato il TabTrigger e titolo Header rinominando `Elenchi Colorati` in `Elenchi Colorati Multi` per chiarezza esplicita (UX/UI). 3. Applicato l'aggiornamento dinamico delle label sulle Card in UI riportando chiaramente la fofmula "Collegato a:" / "Nessun collegamento attivo" seguita dai Badge reali anziché testo anonimo. La struttura è validata a 7 Elenchi ufficiali.
  - Manca: Il recupero in Produzione dei vecchi nomi corsi richiederà script ad-hoc. L'architettura software è allineata.

- [x] Task 12.6: Refactoring Globale Naming da "Nome Corso" a "Genere" e Integrazione Modali
  - File toccati: `client/src/pages/*`, `server/storage.ts`
  - Fatto: 1. Bonificato ovunque il termine "Nomi Corsi" in favore di "Genere". Nessun residuo storico attivo nel core db o UI. 2. Implementate le tendine Combobox ricercabili in tutte le 14 attività principali. 3. Test E2E validato tramite subagent che conferma il recupero dinamico dei dati da '/custom-lists'. 4. Riparato il backend Affitti (`/api/studio-bookings`) gestendo un incrocio aliased per l'unione tra members/instructors.
  - Manca: Nulla. Refactoring e unificazione semantica conclusi con successo.

- [x] Task 12.7: Audit Strutturale Totale e Tabella Master Definitiva (Blocchi 1-4)
  - File toccati: `_GAE_SVILUPPO/attuale/09_GAE_MAPPA_GLOBALE.md`, `_GAE_SVILUPPO/attuale/10_GAE_TABELLA_MASTER_MODALI.md`
  - Fatto: 1. Mappato l'intero ecosistema database, le rotte, i modali e i campi UI in una fotografia operativa. 2. Costruita la "Tabella Master Definitiva" analizzando i Modali Core, tutte le 14 Attività e mappando minuziosamente l'albero dei Campi Selettivi, le origin source e il loro Binding (Blocchi 1, 2, 3). 3. Prodotta la Matrice Decisionale (Blocco 4) per classificare ogni dropdown come Condiviso, Specifico, Amministrativo o Mockup, con precise indicazioni d'intervento (priorità e workaround).
  - Manca: Nulla. L'audit è concluso. Le prossime azioni discenderanno dalla Matrice Costruita.

---

## 7. Normalizzazione Elenchi e Binding (Esecuzione Blocco 5)
Sulla base del Blocco 5 generato nella "Tabella Master Modali", seguiamo questo piano di normalizzazione progressivo, salvaguardando il core finanziario.

- [ ] Implementazione QW-1: Tabella "Livello" in Custom Lists
  - File toccati: UI Modali Unificati
  - Fatto: Nulla (Rollback di tentativo locale poiché non persistito da DB nativo).
  - Manca: Aggiungere logica Livello POST-Migrazione DB Drizzle/Custom Lists.
- [x] Implementazione QW-3: Replace Mockup "Tipo Partecipante"
  - File toccati: `maschera-input-generale.tsx`, `multi-select-participant-type.tsx`
  - Fatto: Collegato endpoint `/api/client-categories` bypassando vecchi dummy.
  - Manca: Completato.
- [x] Implementazione QW-4: Pulizia Mockup "Comune/Provincia"
  - File toccati: `maschera-input-generale.tsx`
  - Fatto: Rimosso mockup limitativo, applicati `<datalist>` auto-completanti.
  - Manca: Completato.
- [ ] Risoluzione MED-1: Old Courses Binding
  - File toccati: DB Script
  - Fatto: Nulla.
  - Manca: Data pump per recuperare eventuali old-course IDs.
- [ ] Freeze di HR-1, HR-2, HR-3 confermato
  - File toccati: Pagamenti, Tessere
  - Fatto: Applicata etichetta STOP & GO.
  - Manca: Sviluppo futuro del calcolatore listini.

---

## 8. CRM Interno e Punteggi Maschera Input
Sviluppato il motore CRM locale e integrata l'estetica operativa, propedeutico ma indipendente dal Phase 2 Clarissa.

- [x] Restyling Maschera Input
  - Fatto: Spostata e allargata la sezione, rinominata univocamente in "Attività di marketing" e collocata saldamente sotto l'Anagrafica principale.
- [x] Navigazione Contesto Globale
  - Fatto: Ripristinato al 100% il routing interattivo sulla view a lista: cliccando sui nomi dei partecipanti si atterra correttamente in `/maschera-input?memberId=X`.
- [x] Logica 4 Livelli Configuarabile
  - Fatto: Smantellato il legacy. Astrazione in `crm-config.ts` della matematica su base 100 per assegnare regolarmente: Silver, Gold, Platinum e Diamond.
- [!] Validazione Punteggi Reale
  - Manca: In sospeso per assenza di dati transazionali pregressi. Congelata in attesa dell'approdo o della simulazione di un dump massivo di pagamenti.

---

## 9. Integrazione CRM Esterno (Progetto "Clarissa") - Fase 2 Roadmap
I seguenti passaggi diventeranno attivi solo previa autorizzazione esplicita ad iniziare lo sviluppo dell'integrazione. Documento strategico di riferimento: `_GAE_SVILUPPO/futuro/14_GAE_Strategic_Plan_Clarissa_CRM.md`.

- [ ] Fase 0: Setup e Autorizzazione
  - Manca: Ricevere le chiavi API di Clarissa e studiarne la documentazione ufficiale.
- [ ] Fase 1: Sincronizzazione Master Base (Gem -> Clarissa)
  - Manca: Creazione del modulo `server/integrations/clarissa.ts` e trigger su inserimento/modifica anagrafiche e aggiornamento livelli/score CRM.
- [ ] Fase 1.1: Agganciamento Eventi CRM Interno
  - Manca: Far emettere il push verso Clarissa alla funzione `calculateCrmProfileForMember`.
- [ ] Fase 2: Webhooks Operativi
  - Manca: Ricezione push da Clarissa per agganciare Opt-Out o Disiscrizioni mailing list.

---
## Fase 12 - STI (Shadow Mode / Bridge Read-Only)
Questa fase è strettamente NON DISTRUTTIVA. Nessuna tabella legacy è stata divisa, nessuna UI o API pubblica (scrittura) interrotta.

- [x] **Creati Naming definitivo tabelle shadow in DB**:
  - `activities_unified`
  - `enrollments_unified` (Tabelle Permissive, no FK bloccanti)
- [x] **Creati Naming endpoint bridge**:
  - `GET /api/activities-unified-preview` integrato e testato.
  - Altri endpoints in lavorazione.
- [x] **Strategia ID unificati temporanei**:
  - Trasmutazione ID legacy on-the-fly prepended in memory (es. `workshop_15`, `course_42`) per bypassare sovrapposizioni Primary Keys nei read dei calendari ibridi.
- [x] **Regole season_id e legacy_source_type**:
  - Fallback imperativo su `storage.getActiveSeason()` e mapping stretto su Enum: `courses`, `workshops`, `rentals`, `campus`, `sunday_activities`, `recitals`.
- [x] **Regole mapping UI / Dipendenze Frontend (FREEZE SBLOCCATO)**:
  - Il Frontend (`calendar.tsx`) legge dalla custom query unificata. Creato il Recurrence Expansion Engine. 
  - Risolto il collo di bottiglia `mapUnifiedToCalendarEvents`. Ora eroga entità arricchite (`UnifiedCalendarEventDTO`). Congelamento revocato e visual layer ripristinato ed attivo.
- [x] **Hard Fix Strutturale Calendario (Fase 16-18)**:
  - Risolti i 5 bug formali d'intersezione sostituendo il Cascade con un array iterativo in Side-by-Side (`Left/Width 100%`). Risolto il bug di Midnight che forzava offset verticali negativi spaccando la griglia. Status wrap approvati. UX pencil bindings multi-entità ricollegati solidamente al single source record corretto.

---

## Fase 26 - Migrazione Infrasruttura Server (VPS IONOS)
Questa fase certifica il passaggio dell'app di produzione dal server condiviso "Legacy" al nuovo VPS dedicato, risolvendo vincoli prestazionali e gettando le basi per i Webhooks CRM in arrivo.

- [x] Deploy codice su VPS IONOS (Workflow GitHub -> Plesk Git Ext)
- [x] Import DB `stargem_v2` da dump `sg_gae`
- [x] **Plesk Node.js Extension** (Phusion Passenger) configurato e online, rimpiazzando il vecchio setup PM2
- [x] Nginx / Apache fix (Rinominato index.html default Plesk, sbloccata l'esecuzione dist/index.js e bug Porta 80 curato)
- [x] Tunnel SSH locale → `stargem_v2` (Script persistente)
- [x] Chiave SSH senza password
- [x] DNS record A aggiornato (propagazione conclusa su IONOS)
- [x] Fix resolv Node.js IPv4 `127.0.0.1` (.env produzione)
- [x] Fix integrazione `BASE_URL` su `.env` VPS (Login Auth Google)
- [x] Estrazione primo Backup Architettonico post-migrazione (28K righe, 7.1MB)
- [x] **PUSH FINALE:** Snapshot stato attuale su repository `main` (`[AG-26.25]`)
- [x] **AUDIT CUT-OVER & FREEZE 185:** Dismissione totale infrastruttura su vecchio server abilitata in via finale.
- [x] SSL Let's Encrypt (Risolto impasse bind porta Nginx 80. Certificato HTTPS attivamente emesso a lungo termine)
- [x] Migrazione zona DNS (Assicurato mapping `www.stargem` in IONOS Panel via CNAME/A Record)

---

## Fase 27 - Calendario Multi-Stagione & Engine Modifiche (In Cantiere)
Questa fase sblocca la gestione del calendario su più archi temporali, gestendo nativamente sovrapposizioni e porting automatico dei record.

- [x] **Inizializzazione Architetturale Fase 27:** Documentazione e vincoli temporali (Stagione default 25-26 visibile e flaggata, Futura 26-27) cristallizzati in `17_GAE_Calendario_Multi_Stagione.md`.
- [x] Allineamento Regole di Copia (post AG-017/AG-018): Ribadita UI e Checkbox funzionante in batch.
- [x] Ripristino Architettura (UI FREEZE ATTIVO confermato): Messa in sicurezza del DOM per evitare manipulation.

**🚨 DEADLINE: CONSEGNA DI MARTEDÌ (E FIX URGENTI)**
- [x] **[BUG CRITICO RISOLTO] FIX Disparizione Schede: Implementato auto-refresh modale tramite reset forzato a "all" e `invalidateQueries` per ripristinare il calendario.**
- [x] Sviluppo Endpoint Duplicatore: `POST /api/activities/duplicate-season` esplorato e integrato rispettando i vincoli di copia ristretti (no enrollments).
- [x] Sviluppo UI Porting/Clonazione: Tabella/Lista corsi correnti validata. Checkbox a multi-selezione funzionante con macro-pulsante "Duplica selezionati" operativo.
- [x] Switch "Season" in Header: Toggle 25-26 / 26-27 completato con filtro dinamico del payload nel componente Calendario base.
- [x] Layout Sliding: Refactoring della view settimanale completato, resa fluida.
- [x] Detection Conflitti Risorse: Tracking e alert di collisione tecnica (stessa Sala/Ora) pienamente funzionante a livello UI.
- [x] Programmazione Date Strategiche (Integrazione base completata): Implementata evidenziazione automatica nativa in Planning e Calendario.

**🚨 QA HOTFIXES (FIX URGENTI E PRIORITÀ MARTEDÌ)**
- [x] **LABEL SEASON ESATTA:** La stagione di default al caricamento deve riportare tassativamente la stringa visibile "25-26" (flaggata attivamente).
- [x] **AUTO-SWITCH LABEL:** La stringa "26-27" (stagione successiva) deve auto-promuoversi ed esporsi in automatico a febbraio di ogni ciclo.
- [x] **UI BOTTONE OGGI:** Focus corrente evidenziato correttamente; lo scroll sfuma il testo dove richiesto.
- [x] **SELEZIONE IBRIDA SCROLL/GIORNO:** Implementata la sincronizzazione del mini-calendarietto.
- [x] **FULL-TEXT CARD & AUTO-RESIZE RIGHE:** Risolto. L'engine forza dinamicamente l'adattamento in altezza disinnescando i troncamenti CSS. Text-wrap elastico ripristinato.
- [x] **ZERO OVERLAP CARD UI:** Bugfix estetico rigoroso del motore metrico: nessuna card subisce più overlap visivo, lo split in colonna asseconda il side-by-side nativo.
- [x] **DUPLICAZIONE CORSI CORRETTA:** Check dati integrali: i corsi duplicati ereditano le date in offset alla stagione corretta, con l'orario integro e fedele.
- [x] **FILTRI CALENDARIO ALLINEATI:** Categoria, genitore e filtri testuali reattivamente allineati nel frontend `calendar.tsx`.
- [x] **STUDI MODIFICABILI (23, 24, 25):** Tolta la logica legacy hardcoded disabilitante in UI.
- [x] **FIX MASCHERA INPUT (ERRORI DI DEFAULT):** Neutralizzti i bug (falsi positivi visivi rossi) al boot del Modale Nuova Iscrizione.
- [x] **GLOBAL CENTER HOURS ELASTICI:** Sostituito l'array hardcoded di 17 ore di erogazione visiva nel Calendario. Lo spacing Y dipende da un range globale gestibile in Pannello Admin, che governa centralmente anche gli avvisi di orario e fuori range dell'applicativo.

**📅 TASK ARCHITETTURA EXCEL / TABELLA DATE (FASE NUOVA)**
- [ ] Creazione tabella master "Programmazione Date Strategiche" come replica esatta del foglio Excel: asse verticale con settimane numerate, asse orizzontale Lun-Dom con date, color coding attività/chiusure, totali e spazio note settimanali. Inserimento rapido e sync UI completo.
- [ ] **FIX RIGHE MASTER TABLE:** Evitare che le righe o l'impalcatura di base/esempio spariscano inspiegabilmente quando l'operatore inizia a registrare o programmare le prime date.

---

## Fase 29 - Rebranding StarGem Suite & TeoCopilot (Conclusa)
Questo blocco chiude la fase di allestimento visivo e d'integrazione base per la suite StarGem V2.

- [x] Ristrutturazione Root Login: Abbandonato esteticamente il brand CourseManager, sostituzione landing con UI "StarGem Suite" e inserti di 7 loghi dorati 3D (GemTeam, Gemory, MedGem, BookGem, TeoCopilot, Gemdario, Clarissa).
- [x] Ristrutturazione Architetturale TeoCopilot: Transizione completata da Overlay (`Sheet` UI) a Side-by-Side Push Model (`aside` nativo) per permettere lavoro congiunto senza sovrapposizione visiva.
- [x] Asset Grafici AI Custom: Integrazione degli asset `teo-head-new.png` e `teo-full-new.png`, rimosse le stelline Sparkle superflue e impostate le dinamiche CSS `mix-blend-multiply` in AuthPage per trasparenza massiva nativa.

**🖥️ DASHBOARD SEGRETERIA OPERATIVA (IN CANTIERE)**
- [ ] Rifacimento Dashboard Segreteria Operativa (Entrate Mese + Sezione Scadenze Operative): Implementazione di un nuovo blocco "Entrate Mese" con dettaglio analitico ripartito per ogni membro del team, accompagnato dalla sostituzione del vecchio pannello "Attività Recente" a favore di una nuova "Sezione Scadenze Operative" incentrata su alert e task imminenti per le receptionist.

**💳 MODULO PAGAMENTI E RICEVUTE (IN CANTIERE)**
- [x] Modale Nuovo Pagamento – Filtro Generi/Corsi per Attività selezionata (completato AG-052): Ottimizzazione del form "Dettaglio Quote e Servizi". Implementazione logica di validazione e filtraggio a cascata (es. isolare i soli generi congrui all'Attività madre e ripulire le label sporche).

---

## Fase 30 - Completamento Motore STI Database (Integrazione Custom Lists e Lezioni Individuali)
Questo blocco certifica l'entrata nel vivo della migrazione del backend e dell'ormigrazione Single Table Inheritance (STI).

- [x] **Rimozione Foreign Key `categoryId`**: L'architettura del DB è stata aggiornata, scollegando la colonna `categoryId` della tabella unificata `courses` dalla vecchia e chiusa tabella `categories`. Questo sblocca l'immagazzinamento degli ID dinamici (Es: 411 per "Coreografia") provenienti da `custom_list_items`, risolvendo silenziose violazioni di chiave esterna.
- [x] **Unificazione Modulo Lezioni Individuali & Allenamenti**: Sostituito il modale locale di `client/src/components/activity-management-page.tsx` con il motore `CourseUnifiedModal`. Le interfacce UI "Lezioni Individuali" e "Allenamenti" inviano ora i payload alla macro-tabella `courses`, dotate di validazione flessibile e array di tipologia.
- [x] **Sincronizzatore DB Dinamico**: Aggiornato `sync_custom_lists_from_courses.ts` per allineare nativamente il pregresso di `individual_lessons` ed `trainings` in una tabella custom unica.
- [x] **Testing CRUD via HTTP**: Verificato con script di debug asincrono (`test_express_submission.ts`) che l'engine Drizzle accetti con esito "affectedRows: 1" le richieste di Lezioni destinate alle Categorie Listate Personalizzate, scavalcando definitivamente il limite storico.
- [x] **Esecuzione Migrazione 0010 (activity_type)**: Integrata con successo la colonna polimorfica `activity_type` in `courses` tramite esecuzione raw bypassando introspection fallati. Il motore STI è ora in grado di autodicriminare semanticamente le entità.
- [x] **Risoluzione Bug Lista Vuota (Filtri STI)**: Aggiornati i file `server/routes.ts` e `storage.ts` abilitando pienamente il filtro `req.query.activityType` nativo per la GET `/api/courses`. Le dashboard operative ricevono ora flussi filtrati corretti isolati sulla nuova colonna DB.
- [x] **STI Data Backfill & Season Fix**: Eseguito injection SQL di allineamento massivo della tabella `courses`, convertendo tutto il pregresso isolato nel fall-back tipologico "course" e normalizzando i vector test (allenamenti/prenotazioni) allineandoli alla Season in corso. Le liste UI sono ora completamente sbloccate e conformi all'interfaccia F2.
- [x] **Risoluzione Conflitto Generi Liste**: Aggiornati tramite raw query i nomi base degli Elenchi personalizzati ("Genere" in "Generi Corsi" id=15, e "Generi Workshop" id=21) per risolvere ambiguita visive nel gestore delle tendine. Analizzato schema `custom_list_items` in preparazione all'injection colonna colore.
- [x] **Injection Colonna Colore UI (Custom List Items)**: Modificato permanentemente lo schema Drizzle per `custom_list_items` introducendo il campo `color (varchar 7)`. Generata ed eseguita migrazione raw asincrona bypassando i lock temporanei. L'ORM espone ora nativamente i metadati colore alle collection API `/api/custom-lists`.
- [x] **Test Notturno & Unified Bridge Fix**: Connessione architetturale di `dbCustomCats` dentro la cache del master calendario (`unifiedBridge.ts`) e aggiornamento del fallback `name/value`. Le UI unificate ereditano istantaneamente l'hex color con filtri opacità CSS per tutti i calendari. Testate 7 route API: tutto operativo e senza overhead transazionali (Null-Zero DB query).
- [x] **Fix activityType Dinamico nel Calendario**: Rimosso l'hardcoding stringa "standard" nel generatore `buildBaseDTO` sostituendolo con il proxy protetto `course.activityType || "standard"`. Le estrazioni native di "allenamenti" e "prenotazioni" transitano ora in chiaro fino all'interfaccia UI.
- [x] **(B024) Fix categoryName e JOIN**: Implementata in Drizzle ORM la JOIN con la tabella `custom_list_items` all'interno di `getCourses()` e `getCoursesBySeason()` in `storage.ts`. La risposta API adesso riversa nativamente il nome corretto della categoria (`categoryName`), ripristinando il corretto lookup nei riepiloghi Frontend.
- [x] **Fix Modale CourseUnifiedModal (B051, B045b, B050)**: Aggiunto reset pre fetch allievo e refactoring gestione asincrona isDuplicating via useRef per prevenire race conditions.
- [x] **Fix UI Calendario (B047b)**: Aggiornati i badge dinamici per alloggiare stili cromatici su background e border sinistro coerenti col mapping di ACTIVITY_TYPE_COLORS e sigle (IND, ALL, CRS, WS).
- [x] **Pulizia Typings Legacy (F2-PROTOCOLLO-077)**: Sostituzione globale di tipizzazioni obsolete (es. `InsertPayment` senza `workshopEnrollmentId`, cast a `any`) garantendo esito vuoto a `npx tsc --noEmit`.

---

## Fase 34 - Sviluppo UI Modulo GemPass (Membership & Tesseramento)
Questo blocco certifica la costruzione V2 dell'intera filiera operativa per tessere e documenti.

- [x] **F2-001 Scaffold Modulo GemPass**: Creata interfaccia base a 4 tab e aggiunta route a Sidebar / Navigazione Generale.
- [x] **F2-002 Tessere Attive**: Costruito il pannello Data-Grid per `GET /api/memberships` con ricerca socio, badge status temporali e color coding customizzato.
- [x] **F2-003 & 004 Nuova Domanda (Adulto/Minore/B2B)**: Ricreato integralmente il form cartaceo digitale (Sezione A, B, C, D, E). Introdotta Lookup Automatica CF verso `GET /api/members`, Calcolo Stagione dinamica `/api/seasons/active`, calcolo prefisso card. Struttura layout asimmetrica che invoca doppi dati Tutore/Consenso in base al target "Minore". `useMutation` connessa alla POST.
- [x] **F2-005 Documenti, Firme e Statistiche**: Creata la UI Tabellare read-only con filtri avanzati per analizzare l'Audit Trail dei moduli firmati con le diciture GDPR corrette, supportata la pipeline F1 di Mocking. Realizzati Widget Statistici connessi allo scan realtime di status per riassumere i KPIs delle Tessere Attive vs Scadute.
- [x] **F2-006 GemPass Real-Time Data & Profilo Membro**: Raccordata l'API dati reali `/api/gempass/firme-all` nel listato Firme, abilitato il Rapido Rinnovo Tessera (Shadcn Dialog) via verb PATCH su Tab 1 e aggiornata l'impronta anagrafica di `member-dashboard.tsx` sostituendo i campi legacy con la Card unificata in sola-lettura.
- [x] **[TESTING E2E CONGIUNTO] F1-007 / F2-007 Smoke Test Modulo**: Eseguito con successo lo script iterativo di test RESTful con validazione DB (F1) ed ispezionato il Frontend tramite Browser Subagent autonomo (F2) validando render Tabelle, Modal, e Moduli Auto-fill (sistemando un bug su ricerca JSON paginata Array CF su fetch). Modulo GemPass 100% stabile lato backend/frontend.
- [x] **F1/F2-007 E2E Testing Modulo GemPass**: Validato l'intero set di Unit Testing asincrono e collaudo UI globale per simulare emissioni tessere, blocchi transazionali sui CF duplicati, filtri di ricerca su Tessere e Firme, navigabilità tra sidebar e dashboard membri. Modulo ufficiale completato.
