# Ultimi Aggiornamenti Progetto "CourseManager"
**Periodo di riferimento:** 23 Febbraio 2026 - 27 Marzo 2026

Di seguito è riportato il riepilogo dettagliato di tutti i lavori di sviluppo, refactoring e bug fixing effettuati nel progetto, suddivisi giorno per giorno a partire dal più recente.

---

### 03 Aprile 2026 (Phase 28: Code Freeze Strategico e Perfezionamento Qualitativo)
* **Totali Lezioni GSheet-compliant:** Finalizzata l'integrazione della logica di calcolo nel `StrategicProgrammingTable.tsx`. Costruito l'engine che sottrae massivamente le giornate taggate come `chisura`, `ferie`, `no corsi` in base al parsing testo (`include()`) replicando la logica originale del Google Sheet.
* **Forzatura 52 Settimane:** Modificata la genesi temporale della grid `Planning Strategico`. Passando a un calcolo assoluto di 365 giorni dal kick-off di stagione, si assicura una copertura visiva perfetta fino a fine agosto indepdendentemente dalle end-date ereditate.
* **Fix UI Header Planning (`planning.tsx`):** Unificato l'header sparso della pagina Planning, raggruppando `Annuale/Mensile/Settimanale` in un selettore solido ed enfatizzando coerentemente il blocco navigazione ("Oggi" e "Nuovo Evento").
* **Sblocco Altezza Celle e Layout Titoli Calendario:** Rimosso il difetto grafico del "Testo Troncato e Schiacciato" sulla griglia mensile. Attivato lo stretch flessibile delle righe senza limite `max-h` e sostituita la regex `truncate` nei titoli pill con `break-words`.
* **Sync Filtra-Giorno in Calendario:** Il mini-ShadCN Datepicker del modulo calendario sincronizza ora fluidamente la macro-vista day sul click (Es. l'utente seleziona 15 Aprile da tendina = Il sistema si focalizza su "Mercoledì" in automatico). Allineamento perfetto dell'UX.
* **Refactoring Dashboard (API e UI):** Riscrittura strategica della Dashboard in `client/src/pages/dashboard.tsx` con logica API safe-read (`server/routes.ts`):
  * **Alert Operativi Didattici:** Sostituzione delle liste inutili con alert predittivi per Corsi in Avvicinamento (< 14 giorni) e Workshop in Scadenza (< 14 giorni). Modificata API `/api/stats/alerts`.
  * **Gestione Incassi Profilata (Tendina):** La card degli incassi è divisa in "Incasso Globale (Mese)" e "Incasso per Operatore" (breakdown via `users` e `createdById`). All'accesso l'operatore vede nativamente il SUO incasso in un layer prioritario, nascondendo gli incassi degli altri colleghi all'interno di una moderna chiusura a tendina `Collapsible` di ShadCN.
  * **Ripristino Log Attività:** Reinserito il blocco `Attività Recente` sul bottom-page del layout (minimizzando lo spazio ma senza perdere l'informazione storica).
* **[AG-052] Modale Nuovo Pagamento – Filtro corretto per attività e pulizia etichette:** Intervento risolutivo (e definitivamente completato) sulla modale di Checkout (sezione "Dettaglio Quote e Servizi"). La logica cascade è stata blindata: il field "Genere/Corso" resta sigillato (`disabled=true`) fintanto che non viene estratta una selezione valida dal dropdown "Attività" madre. L'azione sblocca il filtro secondario che ora risulta severamente purgato da placeholder corrotti e reindirizza unicamente options ereditate dalla root selezionata (Parent-Targeting protetto).
* **[AG-053] Fix urgenti Calendario + Duplicazione + Filtri + Maschera Input + Studi 23-24-25:** Inseriti in agenda i fix operativi bloccanti per stabilizzare il gestionale prima del go-live: 1) Garanzia di consistenza date (inizio/fine) e orari in fase di Duplicazione Corsi massiva. 2) Armonizzazione filtri front-end del calendario (es. "Corsi", categoria "Fitness"). 3) Rimozione blocco UI per la modifica degli studi 23, 24, e 25. 4) Risoluzione breakdown/falsi positivi (errori di default rossi) all'apertura silente della Maschera Input.

### 02 Aprile 2026 (Phase 27: Kickoff Calendario Multi-Stagione & Duplicazione)
* **Status Architetturale (UI FREEZE):** Il modulo Calendario si trova nel mezzo del "Bridge STI". L'interfaccia utente (UI) è stata cautelativamente ri-messa in stato di **FREEZE** per non destabilizzare le API legacy durante lo sviluppo delle nuove query per le stagioni multiple.
* **Progettazione Calendario Multi-Stagione:** Pianificato l'avanzamento radicale della logica temporale. Il sistema lavora su base Duale (Stagione Corrente 25-26 e Stagione Prossima 26-27), isolandone gli iscritti al 100%.
* **Duplicazione Intelligente e Massiva (Febbraio):** Fissata la logica per il rinnovo corsi di metà anno. L'operatore visualizzerà una tabella con **Checkbox multi-selezione** collegate al macro-pulsante **"Duplica selezionati"**. Avverrà una *clonazione stretta*: saranno duplicati **esclusivamente** i campi: Genere, Insegnante, Giorno, Orario, Studio.
* **UX/UI Revision: Layout Sliding e Conflitti:** Autorizzato il refactoring della visualizzazione oraria da statica a "sliding" (carrellata flessibile settimanale) e imposta la costruzione di Engine di avviso visivo automatico per conflitti operativi su stessa Sala/Orario o collisione diretta con Modulo Affitti.
* **Chiusura Assoluta Finale (AG-017):** Archiviata definitivamente la documentazione per l'inizio dei lavori. L'ultimo requirement impone l'adozione stringente della "Stagione default 25-26" apertamente flaggata sulla UI, unita alla logica della checkbox multi-selezione categoricamente *"funzionante"* assieme al pulsante "Duplica selezionati". Lo sprint completo (Clonazione via Multi-Checkbox, Sliding settimanale e Alert Conflitti Sala) è blindato. **Consegna garantita per Martedì**. Istruzioni tecniche in `17_GAE_Calendario_Multi_Stagione.md`.
* **[URGENTE] Bugfix Modale Calendario (AG-019):** Intercettato un bug critico di rendering. Durante l'uso del Calendario, alla chiusura del modale di inserimento o modifica, le schede degli eventi spariscono dal DOM, costringendo l'utente a un refresh manuale della pagina. Questo refetch fallito spezza in modo drastico l'UX ed è stato aggiunto come ticket bloccante in testa alla to-do list per lo sprint di Martedì.
* **[CHIUSURA BUG] Operazione Modale (AG-027):** Il problema della sparizione schede post-modale è archiviato in via definitiva. Lo stack software è stato stabilizzato tramite il reset forzato della view state a `"all"` unito all'esecuzione di `queryClient.invalidateQueries`. Il calendario attinge ora i dati freschi in background al momento dell'`onClose`, preservando integralmente la UI a video.
* **[NEW FEATURE] Programmazione Date Strategiche (AG-031):** Autorizzata e inserita in roadmap l'implementazione della gestione eccezioni calendariali (festività, ferie, ponti, eventi speciali). L'operatore potrà caricare date rilevanti tratte dai 3 file storici "programmazione date", e il sistema dovrà evidenziarle nativamente allocando pattern visivi dedicati (sfondi grigi per chiusure, colore d'alert per eventi) in sync automatico tra vista Planning e Calendario settimanale.
* **[CONCLUSIONE SPRINT] Chiusura Fase 27 e Consegna (AG-033):** Sprint completato con successo. Tutte le milestone architetturali relative al Calendario Multi-Stagione sono state sviluppate e ultimate. L'endpoint di duplicazione massiva, la checkbox a UI, il refactoring del Layout Sliding fluido, il tracking dei conflitti sala e l'integrazione visiva completa della Programmazione Date Strategiche sono certificati online e verificati. Obiettivo Consegna di Martedì ampiamente raggiunto.
* **[TABELLA MASTER] Architettura Copia-conforme (AG-037 / AG-041):** Rafforzate e confermate in via definitiva le specifiche architetturali per la nuova sezione Programmazione Date. La "Tabella Master dedicata" dovrà riprodurre fedelmente la matrice visiva usata storicamente su Excel dalla direzione: settimane numerate sull'asse verticale, date esatte per ogni singola colonna Lun-Dom, color coding massimalista per chiusure/attività, totalizzatori lezioni adulti e bambini, con *spazio obbligatorio dedicato alle note per settimana*. Questa form veloce di programmazione originerà le esclusioni a cascata che comunicheranno nativamente sia col Planning stagionale sia col Calendario.
* **[QA VISUALE POST-TEST] Fix Emergenziali per Martedì (AG-043 / AG-049):** A seguito del collaudo visivo e funzionale del layer Calendario/Date, l'elenco massivo di priorità per Martedì è stato codificato e chiuso definitivamente: 1) Labeling rigoroso della season di default a "25-26"; 2) Auto-switch testuale della "26-27" programmato per febbraio; 3) Refactoring UI "OGGI" dinamico (colore evidenziatore solo sul tile realtime, testuale nascosto nello scroll off-day); 4) Naviga temporale ibrida elastica (scroll/select); 5) Zero-overlap categorico su tutte le attività in griglia incrociate; 6) Dinamismo elastico UI delle card (Box sufficientemente ampi in altezza per contenere zero-troncamenti dell'intero payload, U/D/D, Codice SKU e status estesi, pilotando un *auto-resize delle righe orarie* che vi si adatteranno fluidamente); 7) Fedeltà UI 1:1 della Master Table Date Strategiche (righe d'esempio incise in modo permanente al typing parziale). Tracker bloccati e pronti all'implementazione codice.

### 2 Aprile 2026 (Phase 26.5: Completamento Cut-over IONOS e Plesk Node.js)
* **Architectural Pivot (Gestione Processo Node):**
  * Eseguito un Audit definitivo sulle macchine server e certificato l'abbandono di PM2 puro da riga di comando. Il deployment workflow ufficiale si basa ora fermamente su **Plesk Git Extension** + **Plesk Node.js (Phusion Passenger)**.
  * **Fix Nginx / Passenger Fallback Bug:** Risolto un bug critico di bind della porta 80 di Plesk Nginx (Zombie Process) forzando il reload del demone. Rinominato forzatamente l'`index.html` statico civetta di Plesk che scavalcava le direttive di Phusion Passenger (Plesk "Smart static files" bug). Il Web server ora dialoga perfettamente con l'app Vite/Express passando la richiesta HTTP in sicurezza.
* **Certificati SSL & DNS:**
  * Risolto blocco di certificazione SSL. Let's Encrypt adesso genera e mantiene attivi i certificati per `stargem.studio-gem.it` integrandosi nativamente in Plesk, grazie allo sblocco formale della porta 80 da parte di Nginx.
  * Definito e comunicato setup DNS finale nel nuovo pannello IONOS per l'inclusione del record CNAME (o A V4) per `www.stargem`, facente rotta al server di Node.js principale.
* **Dismissione Legacy 185:** Fissate le linee guida per la distruzione completa (Tear-down) della vecchia virtual host sul server 185.48.116.156, azzerando le code di debito tecnico passate.

### 30 Marzo 2026 (Phase 26: Migrazione VPS IONOS)
* **Infrastruttura e Server:** Migrazione completa del progetto verso un nuovo VPS indipendente.
  * **Database:** `sg_gae` duplicato e rinominato `stargem_v2` allocato nativamente sul nuovo VPS IONOS.
  * **Server Specifics:** IP `82.165.35.145` — Ubuntu 24.04 — Node.js 25.8.2.
  * **Erogazione:** Build produzione completata. L'app Node viene servita internamente sulla porta `5001` e mantenuta viva tramite PM2.
  * **Configurazione Nginx:** Il web server Nginx è stato configurato come reverse proxy su 5001. Aggiunto modulo specifico Exception Path per `/ /.well-known/acme-challenge/` garantendo l'emissione del certificato Let's Encrypt, bypassando Node.js.
* **Chiusura della Fase:** È stato eseguito un Push finale Architetturale al repository `main` (`[AG-26.25] Phase 26: Tunnel SSH, fix nginx acme-challenge...`), congelando la migrazione con tutte le chiavi sensibili (`.env`, `backups/`, `tunnel-db.sh`) rigidamente tracciate e tenute distanti da GitHub via `.gitignore`. Le fondamenta VPS sono pronte.
* **Sicurezza e Networking (Tunnel SSH):**
  * La porta 3306 del VPS è saggiamente blindata al traffico esterno. Il dev server locale (Mac) si collega ora al DB in produzione tramite un tunnel SSH configurato sullo script `scripts/tunnel-db.sh`, che mappa `127.0.0.1:3307` direttamente al MariaDB remoto.
  * Autenticazione Mac → VPS configurata via chiave SSH (password-less).
  * Il file `.env` locale e quello del VPS sono allineati ai nuovi parametri e protetti tramite `.gitignore`.
  * **Variabili d'ambiente (Fix):** Aggiunta la stringa vitale `BASE_URL=https://stargem.studio-gem.it` in produzione, evitando di far crashare il mapping delle URI Auth/Google su domini legacy obsoleti.
* **Risoluzione DNS e Cut-Over:** Rilevato blocco lato NameServer autoritativi su SiteGround. Finché il record A non rifletterà il nuovo IP 82.x mondiale, Let's Encrypt rimane in standby bloccato.
  * **Freeze Applicativo:** L'App Server Node.js sul legacy 185 è stato ibernato dal pannello di Plesk (redirezione locale `login.php`) riducendo a zero il rischio di "Split-Brain" dei database da parte dei visitatori pubblici in transito incrociato sui vecchi DNS.

### 27 Marzo 2026 (Phase 25: Allineamento e Audit Finale 13 Attività)
* **Certificazione Stato Attività:** Eseguito ed emesso il verdetto tecnico finale sullo status dei 13 silos di attività:
  * **Pienamente Operativi (7):** Corsi, Workshop, Lezioni Individuali, Allenamenti, Affitti, Domeniche, Campus, Saggi, Vacanze. Ciascuno è coperto dalle factory universali `CourseUnifiedModal` e `ActivityOperationalModal`.
  * **Architettura Partecipazioni V2 (3):** Prove Gratuite, Prove a Pagamento, Lezioni Singole. Questi moduli "legacy" sono sfociati in via definitiva come logiche ibride nella tabella base `enrollments`. Nessun endpoint di recupero o salvataggio risulta orfano o troncato nella rotta *Maschera Input / Nuove Iscrizioni*. Il loop architetturale salva correttamente custom types ed extra-dates senza null values.
  * **Moduli Setup (1):** Eventi Esterni. Architetturalmente isolato dalla didattica a Settings tecnico.
* **Allineamento Documentale:** Convalidata l'assenza totale di Mockup di base. I Documenti di Progetto (`00B_GAE`, `11_GAE` e `task.md`) sono stati aggiornati per documentare la convergenza dell'Area UI Attività e i prossimi test architetturali.

### 28 Marzo 2026 (Fix E2E Planning e Restituzione Validazione)
* **Testing E2E Modulo Planning:**
  * Eseguito il restart pulito del dev server per forzare in memoria il Router `POST /api/strategic-events` rimasto latente causa avvio senza watchmode (tsx).
  * Validazione visiva del Salvataggio, Modifica e Cancellazione record in tabella `strategic_events`.
  * Smoke test eseguito sui Moduli Attività: l'apertura e il salvataggio del Planning extra-didattico non invalida la SPA di Calendar, Corsi, e prenotazioni.

### 27 Marzo 2026 (Phase 20: Master Allineamento Modali - Workshop)
* **Convergenza Architetturale Modale Workshop:**
  * Sradicata la vecchia UI duplicata e frammentata di `workshops.tsx` (ridotta da ~1600 righe a ~700).
  * Iniettato con successo il `CourseUnifiedModal` istanziandolo in modalità polimorfica (`activityType="workshop"`).
  * Il modale Workshop ora eredita gratuitamente e in modo nativo tutte le feature master dei Corsi: Tabelline Iscritti/Presenze unificate, Pennini Edit rapidi, Lookup Anagrafici (Colori, Categorie) e salvataggi multi-livello.
* **Fix Binding e Type Safety (TypeScript):**
  * Sbloccate e iniettate le properties retrocompatibili del DTO in Drizzle `participationType` e `targetDate` nelle select query di `server/storage.ts` riferite alle iscrizioni (`workshop_enrollments`).
  * Risolti molteplici cast TS in `run_migration.ts` portando i Type Error a Zero Assoluto.
* **Collaudo E2E Automazione Browser:**
  * L'Agent Browser ha validato l'efficacia del nuovo Modale Workshop creando slot di test, compilando le ComboBox per SKU e Categoria e navigando le interfacce annidate senza crash di Virtual DOM.

---

### 24-25 Marzo 2026 (Fase 1-5 Architettura STI e Data-Aware Calendar)
* **Shadow Database Creazione (Fase 2 STI):**
  * Create in esecuzione le nuove super-tabelle unificate `activities_unified` ed `enrollments_unified` nel database fisico di sviluppo.
  * **[SAFETY POLICY]** Sono state concepite in modo "Strictly Permissivo": nessuna *Foreign Key* bloccante reale o clausola `CASCADE` a livello DB per impedire rotture o impatti sul database Legacy ancora in produzione e per salvaguardare il dual-write.
* **Bridge API in sola lettura (Fase 3 STI):**
  * Sviluppato `server/services/unifiedBridge.ts`. Il layer preleva in RAM dai 6 Silos Legacy (Corsi, Workshop, Campus, ecc.), formattandoli su `legacy_source_type` come se fossero già nel database STI.
  * Generata ed esposta l'API `GET /api/activities-unified-preview`.
* **Recurrence Expansion Engine (Fase 4-5 STI):**
  * I vecchi "corsi" legacy avevano un concetto di tempo primitivo (solo `dayOfWeek`). Per poter passare al layout Calendario vero, è stato creato il *Recurrence Engine* nel Bridge. Il motore trasforma un singolo record di database (lunedì h18) in istanze multiple di date reali per un corridoio temporale esteso (-30/+60 gg sulla data richiesta) simulando un motore eventi perfetto.
* **Data-Aware Calendar Switch (Fase 4-5 STI):**
  * Refactoring esplorativo di `client/src/pages/calendar.tsx` da filtri `lunedì/martedì/etc` a logica "Data-Aware" (`isEventOnDate`), appoggiandosi unicamente sull'API Bridge Read-Only.
  * **[UI FREEZE E ROLLBACK]**: A seguito di regressioni estetiche (fallaci sovrascritture CSS) sulle card, causate dalla mancata risoluzione dei Mapping Legacy (nomi Categorie e Istruttori assenti via Bridge e convertiti forzatamente via frontend-mapper ciechi), la UI e i colori della griglia del Calendario **sono stati congelati e ripristinati allo stato originario**. La prossima micro-fase richiede la soluzione di tali mancanze mappali lato API Bridge.

---

### 26-27 Marzo 2026 (Phase 19: Time-Space Elastico Calendario e Fine Bug Bloccanti)
* **Algoritmo Geometrico a Doppia Passata (Phase 19):**
  * Creato l'engine definitivo per il Layout Calendario dinamico, superando il vincolo delle righe ad altezza fissa che forzavano il clipping dei contenuti.
  * Il componente `calendar.tsx` prima usa il `ResizeObserver` per "pesare" l'altezza testuale *richiesta* di tutte le schedine per formattare i wrap in altezza, popolando il dizionario in memoria `measuredHeights`.
  * La stringa cumulativa `cumulativeTops` spalma l'Height reale DOM su tutti i minuti interessati per quel record, dislocando e deformando dolcemente lo "spazio" tempo a livello di griglia.
* **Side-by-Side Completo e Validato:**
  * Sradicata definitivamente l'illusione di *overlap* tra carte con stesso orario: tramite l'algoritmo geometrico aggregativo, ogni cluster di overlap assegna un `maxConcurrent` pari al reale numero di percorsi sovrapponibili paralleli. Nessuna sovrapposizione orizzontale o verticale esiste in assoluto, onorando strettamente la direttiva utente.
* **Collaudo QA Visuale:**
  * L'Agent Browser ha ispezionato con successo la deformazione della griglia senza clip su badge "U/D/D, Sku, Status", testando i filtri incrociati Giorno, Attività (Sale) e le aperture dei Modali Pennino (Total Body Modale).

---

### 25-26 Marzo 2026 (Phase 16-18: Sblocco Calendario e Refactor Strutturale)
* **Canonical DTO e Sblocco UI (Phase 16-17):**
  * Superata l'impasse data-aware (`UI FREEZE`) trasferendo il potere di enrichment al backend (`server/services/unifiedBridge.ts`). Al posto di ID vuoti per istruttori e categorie, il bridge emette l'oggetto monolitico e pienamente risolto: `UnifiedCalendarEventDTO`.
  * La Single Source of Truth nel DB RAM permette a `client/src/pages/calendar.tsx` di ignorare logiche di lookup costose, garantendo color-coding e testi esatti out-of-the-box.
* **Modal Binding Restoration:**
  * Ricostruito l'aggancio millimetrico tra i DTO fusi (in cui più tipologie convivono nella stessa matrice es. `courses` e `rentals`) e i modali React di modifica isolati (il click dell'icona *Pencil Edit*). Mappata l'assegnazione parametrica dinamica: se l'attività proviene dal silo "corsi" scatterà automaticamente il Componente Modale relativo pre-popolato con `.sourceRecord`.
* **Hard Fix Strutturale Griglia (True Side-by-Side - Phase 18):**
  * Sradicato per sempre l'algoritmo visivo "Cascade/Overlap" per le collissioni d'orario. La libreria UI `calendar.tsx` adesso interseca lo Start e l'End pixels per innescare un calcolo algebrico (se due record si toccano, dividono lo schermo asse-x `width = 100/N%`). Nessuna schedina potrà più soffocare la consorella dietro di sé.
  * Risolti **5 Bug Cromatici Reali**: (1) Fixata la corruzione di Midnight (00:00 non riconosciuta da `timeToMinutes` spingeva le card verso Pixel negativi); (2) Introdotto `overflow:hidden` nativo sulla plancia oraria per prevenire card-bleed in `Header`; (3) Risolto il troncamento invisibile dei Moduli Status Multipli ("ATTIVO" + "ULTIMI POSTI") applicando nativamente un `flex-wrap gap-1`; (4) Assicurato lo spreading `100% width` alle card isolate; (5) Completati i QA con automation screenshotting sui reali affiancamenti in Week View.

---

### 23-24 Marzo 2026 (Consolidamento Modali, Audit Maschera e Preparazione Partecipazioni V2)
* **Cleanup Livello 1, 2, 3 (Consolidamento Modale Corsi):**
  * Eseguito un ciclo di bonifica profonda per eliminare hardcoding e duplicazioni (`elenchi.tsx`, `calendar.tsx`, `planning.tsx`).
  * Il blocco `CourseUnifiedModal` è ora un monoblocco stabile. Tutte le dropdown (Stati, Categorie, Liste Custom come Genere, Livello, Fascia d'età) leggono da *Single Source of Truth* reattive, riordinando nativamente i valori in ordine alfanumerico (IT locale).
  * **Anti-Duplicazioni Totale:** Implementato un blocco ferreo in frontend nei form "Pennini" (Manager Categorie, Manager Stati, Liste Custom). Se l'utente digita una voce già esistente (case-insensitive), il sistema blocca il salvataggio prevenendo record doppi a monte nella maschera input.
* **Correzione Binding Livello Modale Corsi:**
  * Risolto in via definitiva l'equivoco semantico forzando l'aggancio del campo "Livello" nel modale corsi al suo dizionario tecnico reale `livello` (Es. Base, Intermedio), vietando letture incrociate verso `livello_crm` (Marketing).
* **Audit Architetturale "Maschera Input Generale":**
  * Eseguita una fotografia passiva (Audit) del monolite `maschera-input-generale.tsx` (4300+ righe). 
  * Identificati i punti di estrazione futura (Componenti Foto, Allegati, Accounting) e i colli di bottiglia (useQuery massive). **Nessuna modifica è stata ancora eseguita al codice di runtime**.
* **Audit Architetturale "Partecipazioni" e Fase 1 (Preparazione Non Distruttiva):**
  * Congelato l'abuso dei "Silos-Prove" (Prove Gratuite, Prove a Pagamento, Lezioni Singole come cloni autonomi dei corsi).
  * Stabilito il modello funzionale core: **Le prove sono modalità di iscrizione, non corsi separati**.
  * **Esecuzione Fase 1:** Aggiunti in `shared/schema.ts` e nel DB remoto MySQL i campi estensivi `participationType` (Default: `STANDARD_COURSE`) e `targetDate` alla tabella core `enrollments`. Questa fase **non distruttiva** getta le basi dati senza alterare UI (`maschera-input-generale.tsx` intoccata), senza migrare il legacy e senza rompere i pagamenti attuali (nessuna tabelle dropped).

### 23 Marzo 2026 (Fix Nomenclatura Livelli Corsi vs Livelli CRM)

### 23 Marzo 2026 (Redirect Parametrico & Stati Operativi Multipli - [AG-ELENCHI-002] & [AG-NAV-001])
* **Nuovo Flusso Modifica Corsi (Redirect Parametrico):**
  * Implementato il pulsante Edit (Pennino) in `scheda-corso.tsx`.
  * Il click reindirizza in modo non invasivo alla root della tabella principale (`/attivita/corsi?editId=xxx`).
  * Inserito un listener automatizzato in `courses.tsx` che apre il `CourseUnifiedModal` al caricamento della query URL e ne pulisce la cronologia alla chiusura (`onOpenChange`), prevenendo auto-aperture ricorsive.
* **Componente CourseUnifiedModal**:
  * Inserite icone "Pencil" di fianco alle `Label` Genere e Categoria, intercettando il click per sbloccare l'inoltro ai rispettivi pannelli di lookup anagrafico (`/elenchi` e `/categorie-attivita`).
* **Sostituzione Engine Stati Operativi (Corsi):**
  * Rimosso l'hardcoding in `CourseUnifiedModal.tsx` per la dropdown di Stato (legacy logic `Select`).
  * Adottata logica array-native tramite `MultiSelectStatus`, così che il corso legga array colori e opzioni direttamente dal core API (sorgente `activity_statuses`). E' ora possibile far convivere più marker strutturali (es. `COMPLETO`, `ULTIMI POSTI`).
* **Allineamento Colori e Badge Multi-Stato in Calendario:**
  * Bonificato `calendar.tsx` dall'if-else fallace che deduceva solo "Attivo/Inattivo".
  * **[BUGFIX AG-FIX-006D]**: Le card della Grid Settimanale e del List View facevano fallire silenziosamente `Array.isArray` perché Postgres restituiva l'array `statusTags` come JSON serializzato. L'errore causava una ricaduta forzata sul dummy "ATTIVO". Risolto implementando nativamente `parseStatusTags()` e sbloccando i Multi-Badge colorati direttamente all'interno della griglia per tutti gli appuntamenti.

### 23 Marzo 2026 (Centralizzazione Elenchi e Universal Quick-Add - [AG-ELENCHI-001])
* **Masterizzazione Area Elenchi (Source of Truth):**
  * Spostata totalmente la logica di fallback Hardcoded sulle chiamate in vivo da `useCustomList()`.
  * **Deep Linking / Tab Routing (Elenchi):**
  * **[BUGFIX AG-FIX-006E / 006F]**: La pagina `/elenchi` è stata dotata dell'hook `useLocation` e di un `useEffect` nativo in grado di interpretare i query params dal GET HTTP (`?tab=colorati`, `?tab=semplici`) e agganciati ad Anchor ID (`?focus=list-genere`) per invocare lo *smooth scroll* esatto sul componente a schermo in base alla stringa passata.
  * Questo ha sbloccato il "salto volante in-place" nel modulo `CourseUnifiedModal.tsx`, di cui contestualmente si sono armonizzate e uniformate le Icone Edit ("Pennini") – estendendole anche a *Posti Disponibili* – per fargli puntare le destinazioni millimetriche all'interno dei listini.
  * Eseguito un mini-audit che ha sancito due classi di elenchi a database: le *Core Custom Lists* (es. genere, canali acquisizione, destrutturate in `custom_lists`) e i *System Vocabularies Multi-Color* (es. stati, tipopartecipante, su logiche dedicate).
  * Risolti gli orfani testuali all'interno dei modali principali (`maschera-input-generale.tsx`), rimuovendo i valori nativi di fallback per i Canali Acquisizione ("Web", "Passaparola") e per i gradi CRM ("Silver", "Gold"). Sostituiti in favore degli hook `useCustomListValues`. 
* **Componente Combobox Intelligente (Quick-Add Orizzontale):**
  * Integrato un behaviour astratto `<Combobox onQuickAdd />` in grado di catchare stringhe non presenti in tendina, visualizzando un action button "+ Crea nuova voce: [testo]". All'uso, una mutation pusha in background la voce alla tabella specifica (`customListItems` / systemName) senza distruggere i dati dirty del form o esigere il ricaricamento della pagina.
  * Inclusa la hook helper `useQuickAddCustomList` accessibile globalmente.
* **Seeding Dinamico System Custom Lists:**
  * Implementato eseguibile isolato lato server `seed-custom-lists.ts` per far nascere automaticamente stringhe vincolanti (Es: "livello_crm" / "provenienza_marketing") al fine di mantenere il DB robusto ancor prima dell'integrazione SAAS aziendale reale.


### 23 Marzo 2026 (Rifinitura UX e Nuovo Algoritmo Motore CRM)
* **Nuovo Algoritmo Base 100 per CRM (`server/utils/crm-profiling.ts`):**
  * Sostituita la precedente logica di calcolo del livello di marketing con un algoritmo a pesi centesimali: Spesa Recente (MAX 40pt), Frequenza (MAX 25pt), Servizi Attivi (MAX 20pt) e Recency (MAX 15pt).
  * Interpolarizzate le nuove soglie d'acciaio per l'assegnazione: Silver (<40), Gold (40-64), Platinum (65-84) e Diamond (85-100).
* **Affinamento Modale Forzatura CRM (`maschera-input-generale.tsx`):**
  * Rinominato ID e label in "Forzatura livello marketing", debellando visivamente le sigle "CRM" da tooltip intestazione.
  * Inserito un banner informativo ad alta visibilità nel popup di override per mostrare all'operatore lo status corrente calcolato dal backend (Tier attuale e Score crudo).
  * Aggiunto il livello Diamond tra le opzioni manuali.
  * Irrobustita l'interfaccia rendendo la Motivazione di override un dato categoricamente obbligatorio prima del root POST di salvataggio.
* **Recalibration Task:** Lanciato in background il worker `recalc-crm.ts` per l'allineamento storico di +9000 righe sulla base dei nuovi paramentri scalari.
* **Status Check Validazione:** La logica di scoring è stata preparata e resa scalabile (Silver, Gold, Platinum, Diamond). La navigazione (routing corretto `/maschera-input`) e la UI "Attività di marketing" sotto l'Anagrafica sono funzionanti chiudendo l'interfaccia. Tuttavia, **la validazione reale e l'assessment dei livelli calcolati sono congelati in attesa dell'import storico massivo** dei dati economici e di frequenza, insufficienti nell'attuale DB di sviluppo.

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
*   **Architettura SaaS e Database V2:** Conclusa l'analisi strategica per risolvere la frammentazione a "11 Silos". Codificata la mappa futura (`12_GAE_Database_Futuro_STI.md`) e splittato l'immenso schema ERD in 3 mini-diagrammi Mermaid (Anagrafiche, Motore Attività, Pagamenti).
*   **Draft Schema Drizzle:** Scritto il `6_schema_v2_draft.ts`, un mock-up isolato contenente le nuove super-tabelle unificate (es. `activities`, `enrollments`) e il nuovo "Modulo 6" per CRM Leads e App Insegnanti/Team.
*   **Piano UI e Linee Guida:** Redatto `04_GAE_Piano_Interazione_SaaS_UI.md` catalogando i difetti storici (UX listini bloccanti in Cassa, fix Lazy Load Anagrafica) e le funzioni per le 3 App (Staff, Team, User).
*   **Codifica Cromatica Realistica:** Creato `05_GAE_Linee_Guida_Grafiche_UI.md` estraendo le vere variabili CSS Tailwind del progetto (es. `--primary`, `.gold-3d-button`) per standardizzare lo sviluppo dei futuri form.

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
*Documento generato e aggiornato al 23 Marzo 2026 sulla base dello storico conversazioni con l'AI e modifiche di GIT.*
