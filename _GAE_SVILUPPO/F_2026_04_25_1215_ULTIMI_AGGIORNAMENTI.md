Aggiornato al: 2026-04-25 12:15

# Ultimi Aggiornamenti Progetto "StarGem Manager"
**Periodo di riferimento:** 23 Febbraio 2026 - 21 Aprile 2026

Di seguito è riportato il riepilogo dettagliato di tutti i lavori di sviluppo, refactoring e bug fixing effettuati nel progetto, suddivisi giorno per giorno a partire dal più recente.

---

[2026-04-22] DROP TABLE activity_details (428 record — relitto STI, zero FK, zero route attive)
---

### 21 Aprile 2026 (Consolidamento Architettura Categorie)

* **[DB-001] Hard Wipe Tabelle Categorie:** Eseguita l'eliminazione definitiva di 14 tabelle storiche frammentate (`ws_cats`, `sun_cats`, `cmp_cats`, `rec_cats`, `vac_cats`, `sub_types`, `activity_categories`, `merchandising_categories`, `cli_cats`, `rental_categories`, `booking_service_categories`, `categories`, `trn_cats`, `ind_less_cats`) per azzerare il debito tecnico.
* **[BE-002] Refactoring Storage Level:** Riscritto `server/storage.ts` per dirottare il traffico di tutte le categorie verso la tabella universale `custom_list_items`. Risolto blocco `/api/courses` causato dalla perdita involontaria di mapping.
* **[BE-003] Pulizia Schema Drizzle:** Rimossi da `shared/schema.ts` tutti i riferimenti e le foreign keys associati alle tabelle eliminate.
* **[OPS-001] Stabilizzazione Ambiente:** Riavvio completo del tunnel SSH e del dev server per validare l'integrità architetturale a seguito della pulizia massiva del DB.

---

### 16-17 Aprile 2026 (Completamento Moduli GemTeam & Presenze)

* **[F1-023] Importazione Massiva Turni & Presenze:** Elaborato e schierato lo script nativo `import_turni.ts` per l'assorbimento retroattivo da Excel master dei log operativi Staff (`team_TURNI.xlsx` e `team_20252026_PRESENZE_TEAM.xlsx`). Processate e sanificate su database le ore giacenti e gli orari di ingresso/uscita pregressi, mappando le anagrafiche sul layer relazionale unificato MySQL.
* **[F1-024] Estensione Enum Postazioni:** Modificato in emergenza lo strato database `stargem_v2` integrando dinamicamente nuovi enum (ad esempio `C. CHIAMATE`) sfuggiti al mock originario, bypassando le restrizioni di MariaDB per garantire la coerenza 1:1 dello shift-board con la struttura gestionale.
* **[F2-015 / F2-016] Architettura Core GemTeam Shift & Dashboard:** Trasformata la sezione Staff/Team (`gemteam.tsx`).
  * **Shift Dashboard:** Implementata KPI Bar con metriche live (In Sede, Online, Usciti, Non Pervenuti). Costruite le routines asincrone di polling ed i totalizzatori nativi che distinguono i login cloud.
  * **Self-Service Check-In:** Iniettato nello Sheet Personale il modulo action-based per la timbratura d'ingresso e uscita (`Entra in Sede` / `Esci Sede`), connesso dinamicamente alla route unificata `POST /api/gemteam/checkin/oggi`.
  * **Full-Width Shift Grid (V2):** Disaccoppiato strategicamente il contenitore del calendario settimanale dei turni dal Root Layout Max-Width (`max-w-7xl`). Configurato lo sprawl al 100% dell'asse orizzontale (`w-full`) consentendo alle matrici orarie di riempire i monitor giganti senza compressione o padding.
  * **Sistema Esclusione Silente (Dummy Accounts):** Costruita pipeline di filtering su rendering per decurtare in vivo gli account di root-bot (Admin `15`, AI `16`) rimuovendone le spine di calcolo dalle totalizzazioni "Attesi".

---

### 15 Aprile 2026 (Chat_10_Utenti-GemPortal — Auth + GemPortal)

AUTH & ACCESSI (F1-001 → F1-008 / F2-001 → F2-003):
- user_roles: INSERT operator, admin, insegnante (rinominato da Staff/Insegnante)
- user_roles: descrizione operator corretta (Staff → Team)
- users: email_verified=1 per 14 utenti @studio-gem.it
- server/auth.ts: LocalStrategy accetta email O username (getUserByEmail)
- server/auth.ts: forgot-password anti user-enumeration fix
- server/auth.ts: first-login restituisce user completo + redirectTo per ruolo
- client/src/App.tsx: fix typo admministratore + permesso client /area-tesserati
- client/src/pages/utenti-permessi.tsx: getRoleCategory cleanup
- client/src/components/app-sidebar.tsx: label ruoli standardizzata
- client/src/pages/first-login.tsx: fix cache sessione + redirect per ruolo
- Deploy: script definitivo scripts/deploy-vps.sh creato
- Regola VPS: /opt/plesk/node/24/bin/npm install prima del build

GEMPORTAL (F1-009 → F1-013 / F2-010 → F2-011):
- CREATE TABLE: gem_conversations, gem_messages, member_uploads
- shared/schema.ts: 3 nuove entità Drizzle aggiunte
- server/utils/aiProvider.ts: TeoBot con Claude SDK @anthropic-ai/sdk
- ANTHROPIC_API_KEY: configurata in .env locale e VPS
- server/routes.ts: 7 route GemChat (A-G) + 3 route Area Tesserati
- server/index.ts: static serving /uploads
- client/src/components/gem-chat-badge.tsx: NUOVO badge navbar 2 canali
- client/src/pages/area-tesserati.tsx: NUOVA pagina layout client isolato
- Redirect: tutti area-clienti/area-riservata → area-tesserati
- Account test: martina.ricci3@example.com (member_id 2987, role=client)
- Backup: gemportal_COMPLETO_20260415_0759.sql (11MB)

Commits principali:
  f4a8d5a fix(auth): login email o username
  ccd20d4 fix(first-login): redirect per ruolo
  bf6a59f feat(api): GemChat + TeoBot Claude
  2d2d129 feat(ui): /area-tesserati
  b250c82 feat(api): Area Tesserati profile+upload+documenti
  1c2eab8 chore: script deploy VPS definitivo
  72b2965 fix(auth): permesso client /area-tesserati

---

### 15 Aprile 2026 (Area Tesserati B2C)

* Implementate 3 nuove rotte API protette in `server/routes.ts` (`GET /profile`, `POST /upload-documento`, `GET /documenti`) specifiche per l'erogazione sicura dei servizi frontend ai Tesserati.
* Implementato `multer.diskStorage` asincrono per l'upload persistente su disco dei documenti medici e identità in directory statica.
* Tutte le operazioni sono confinate al layer backend, rispettando in modo assoluto i silos del CRM senza toccare la UI gestionale.

---

### 13 Aprile 2026 (GemStaff — Infrastruttura DB + API + UI)

* [F1-001] Backup DB (9.0M). ADD COLUMN su users (email_verified, otp_token, otp_expires_at) e su members (staff_status, lezioni_private_autorizzate*). Creazione 6 tabelle GemStaff: staff_contracts_compliance, staff_document_signatures, staff_disciplinary_log, staff_presenze, staff_sostituzioni, payslips. Aggiornamento shared/schema.ts. 65 insegnanti impostati staff_status = 'attivo'.
* [F2-001] Scaffold /gemstaff: rotta protetta in App.tsx, voce sidebar, pagina con 6 tab placeholder. Guard ruoli su tab 4 (Accordi) e 6 (Disciplinare).
* [F1-002] Route API GemStaff: GET/POST insegnanti, pt, compliance, firme. Test: 65 insegnanti attivi.
* [F2-002] Tab 1 Anagrafica Insegnanti: lista con filtri, pannello dettaglio laterale, toggle archivio. TS Cleanup frontend: 53 errori rimossi su 18 file.
* [F1-009] Fix participant_type LIKE inclusivo. UPDATE 4 membri anomali → INSEGNANTE. Fix instructorName JOIN in storage.ts: instructorName ora incluso in /api/courses. Architettura calendario consolidata.
* [F1-010] Backup finale gemstaff_CHIUSURA. Git push main. VPS verificato.
* [F1-003] Pulizia duplicati PT nel DB. UPDATE participant_type = 'PERSONAL_TRAINER' su 6 record. Route :id aggiornata con campo tessera GemPass. TS Cleanup server: 0 errori totali raggiunti.
* [F2-003] Sezione tessera GemPass nel pannello dettaglio. Tab 2 PT. Tab 3 Compliance con 6 card e barra avanzamento.
* [F1-004] 16 route GemStaff complete con guard ruoli. Presenze, sostituzioni (doppio visto), disciplinare. 0 errori TypeScript totali.
* [F2-004] Tab 4 Accordi (read-only, link a /quote-promo). Tab 5 Presenze con selettore mese, inserimento manuale, bottone CONFERMA MESE con dialog. Tab 5B Sostituzioni con log visti. File 00A e 00B aggiornati.
* [F2-005] Tab 6 Disciplinare con guard admin, banner riservatezza, form nuovo evento e aggiornamento. GemStaff UI completato.
* [F2-007 S4] Guard ruoli definitivi applicati. Tab 4 e Tab 6 nascoste per operator/segreteria. Redirect insegnante → /gemstaff/me. Filtro Stato aggiunto in Tab 1.
* [F2-007 S5] Verifica finale GemStaff Tab 1. Guard ruoli applicati, filtri completi, /staff mantenuto attivo, instructors.tsx marcato come da deprecare.
* [F2-008/009] Risolto crash pagina bianca (hot reload post modifiche). GemStaff validato visivamente: Tab 1 completa, modale con 3 sezioni funzionante, AMBROSIO e ARRIVABENE ora visibili. GemStaff UI completata e validata dal PM.
* [F2-010] Rimossa pagina /staff. Redirect /staff → /gemstaff in App.tsx. Voce sidebar "Staff e Insegnanti" rimossa. instructors.tsx marcato come deprecato. /api/instructors intatto — calendario OK.
* [F1-011 / F2-011] Deprecation warnings attivi. console.warn + X-Deprecation-Warning header sulle route POST/PATCH /api/instructors. Banner giallo visibile in DEV su instructors.tsx. Tabella deprecation_logs creata nel DB. Trigger su INSERT insegnanti per audit trail.
* [F2-012] Creata pagina /gemstaff/me con 4 sezioni (dati, presenze, documenti, cedolino). Redirect post-login per ruolo insegnante. instructors.tsx eliminato fisicamente.
* [F1-012] Ricognizione: deprecation_logs, instr_rates. DROP instr_rates se vuota. Schema Drizzle aggiornato. Route GET /api/gemstaff/me aggiunta. CourseUnifiedModal verificato OK.
* [F1-013] Route crea account insegnante con OTP. Login hub con redirectTo per ruolo. Route primo login con cambio password.
* [F2-013] Pulsante "Crea Account" nel pannello dettaglio insegnante con dialog OTP. Login hub redirectTo per ruolo. Pagina /first-login per primo accesso insegnanti.
* [F2-014] Test visivo finale superato. /first-login attiva. /gemstaff/me attiva. Chat GemStaff F2 CHIUSA DEFINITIVAMENTE.
* [F2-018] Pagina /forgot-password creata. Link "Password dimenticata?" nel login. /first-login migliorato con link utili.
* [F2-019] Sidebar ridotta per ruolo insegnante. Solo menu personale: area, password, logout. /gemstaff/me: sostituito alert rosso con card "Profilo in configurazione".
* [F1-014] Backup definitivo gemstaff_DEFINITIVO. Git push finale chat GemStaff. VPS verificato. Chat GemStaff CHIUSA.
* [F1-015] Verifica account gaechacha. Fix lookup first-login per email O username. Route POST /api/auth/forgot-password. Mailer utility con template welcome + reset. Invio email automatico su crea-account e forgot-password (richiede config SMTP in .env).
* [F1-016] Variabili SMTP aggiunte a .env e .env.example. Script test-mailer.ts creato. Email automatiche pronte — in attesa config SMTP. Istruzioni: SMTP_USER + SMTP_PASS in .env.

### 12 Aprile 2026 (Phase 34: Infrastruttura GemPass & Sottoscrizioni Documentali)
* **[F1-PROTOCOLLO-001/002] Estensione DB Memberships & Forms:** Audit e alterazione chirurgica della tabella `memberships` con default sicuri (`is_renewal`, `renewed_from_id`, `notes`). Creazione della nuova tabella per tracking digital signatures `member_forms_submissions`. Allineamento Drizzle Schema `shared/schema.ts` e tool di entity generation (`server/utils/membership.ts`).
* **[F1-PROTOCOLLO-003/004] Core Logic & Restful API GemPass:** Iniezione stabile e diretta nel dispatcher `routes.ts` del blocco GEMPASS ROUTES. Deploy e testing delle 4 rotte REST GET/POST per rilascio e rinnovo Tessere con validazione hash numerico e fallback per creazione rapida socio non censito (auto-anagrafica da UI). Deploy e testing UPSERT per liberatorie e documenti cartacei digitalizzati (`firme`).
* **[F1-PROTOCOLLO-005] Backfill Stagionale & API Pubblica (GemAccess):** Sviluppo ed esposizione della route `GET /api/public/membership-status/:code` (unauthenticated) per verifica pass via QR-Code/Barcode. Eseguito backfill massivo mirato lato MySQL su 2218 tessere storiche, popolando la `season_competence` ('2526') orfana per retro-compatibilità con le nuove strict rules.
* **[F1-PROTOCOLLO-006] Completamento API GemPass & Relazioni DB:** Implementate `GET /api/gempass/firme-all` sfruttando nativamente `db.leftJoin` tra `memberFormsSubmissions` e `members` per risoluzione nomi, e integrata l'API single-use `GET /api/gempass/membro/:memberId/tessera` adibita all'idratazione anagrafica profonda in assenza di fetch globale.
* **[F1-PROTOCOLLO-007 / F2-PROTOCOLLO-007] E2E Testing GemPass:** Testing del ciclo vita Tesseramenti da Backend e Frontend via Browser Subagent test automation. Ottenuti ✅ su conformità DB (HTTP Status, Upsert e Firme) sia GUI rendering (Stats, Tabelle filtri). Risolta regressione critica su fetch JSON di auto-fill Codice Fiscale dovuta ad errore di struttura paginazione `Array.find()`. Flusso 100% stabile.


### 09 Aprile 2026 (Phase 33: Stabilizzazione UI Crea-Copia, Calendario & Cleanup Backend Conflict)
* **[F1-PROTOCOLLO-003] Modulo Quote e Promo e Contabilità (DB Schema):** Create e applicate le 10 nuove tabelle (7 per Quote/Promo + 3 per Contabilità Base `cost_centers`, `accounting_periods`, `journal_entries`) in `shared/schema.ts` e DB fisico tramite migrations. Aggiunti campi contabili `accounting_code`, `vat_code`, `cost_center_code` sulla master table `payments`. Completato seed per tipologie listini e periodi contabili.
* **[F1-PROTOCOLLO-004] Modulo Quote e Promo (API Endpoint):** Aggiunte 18+ route REST protette in `server/routes.ts` con validazione `drizzle-zod`. Estesa l'interfaccia `IStorage` per gestire le collection contabili, l'erogazione carnet unificata e l'integrazione pagamenti mensili maestri sulle casse master.
* **[F1-PROTOCOLLO-005 & 006] Seed Dati Reali & Verifica Integrità:** Inseriti record reali nella tabella `promo_rules`, risolto bug omonimie e mappati 9 core-instructor attivi in `instructor_agreements` in joint con member IDs reali. Inseriti override di mensilità variabili e fixate le label errate sul db.
* **[F1-PROTOCOLLO-007] Architettura Sistema Agevolazioni:** Alterata `promo_rules` per tracking authorization. Inserite tre nuove tabelle interrelazionali: `member_discounts` per tessere agevolate private, `company_agreements` per partnership aziendali (Bocconi, UNIMI, Leonardo Da Vinci, Forze dell'Ordine), e `staff_rates` per listino prezzi interno insegnanti e staff, tutte caricate dinamicamente. Aggiunte foreign keys ed esposte 10 nuove micro-route CRUD per l'accesso programmatico.
* **[F1-PROTOCOLLO-008] Architettura Prezzi Dinamici e Carnet Avanzati:** Estesa la tabella `carnet_wallets` con 5 nuovi campi (group_size, location_type, price_per_unit, total_paid, bonus_units) e creata la nuova tabella standalone `pricing_rules`. Inserita price_matrix con tutti i 22 blocchi di prezzo base per affitti e lezioni (in sede, domicilio, personal e aerea). Configurate 7 pricing rules attive per calcolo combinato in tempo reale (maggiorazioni, gratis 11a ora, sconti prova). Iniettati in route le API `/calculate` per il checkout engine e `/lezioni-spot` per erogazioni flash. 9 wallet types attivati.

* **[F2-PROTOCOLLO-109/110] UI Refinement Calendario:** Rimozione icone superflue dalle card del calendario; spostamento badge identificativo ([CRS], [ALL], ecc.) in colonna overlay (vertical-stack) nell'angolo in alto a destra per formattazione responsiva senza collisioni testo.
* **[FRONTEND-FIX] Styling Cromatico Avanzato & Bordi Doppi Calendario:**
  * **Corsi Standard:** Implementata l'ereditarietà di colore tailwind dalla palette card alla pillola Categoria (es. testo Categoria Azzurro su Sfondo Azzurro); assegnato formalmente il grigio morbido `slate-400` al modulo badge Corsi ([CRS]).
  * **Attività Ausiliarie (Non-Corsi):** Isolamento visivo massiccio dalle card ordinarie tramite implementazione dinamica di una **doppia banda tratteggiata** sul fianco sinistro (spessore maggiorato 3px per linea), forzata all'assunzione esatta del colore indicato dalla Legenda Generale.
* **[FRONTEND-FIX] Hydration Glitch Colori (Refresh Calendario):** Disinnescata e distrutta la render logic di fallback `legacy` durante i caricamenti asincroni React Query. La transizione disordinata "Colori Hash Casuali -> Colore Definitivo" visibile al refresh (FOUC visual glitch) è stata bonificata forzando l'attesa stretta dello stream `USE_STI_BRIDGE`, garantendo UI immacolata al boot.
* **[F2-PROTOCOLLO-108] Iscritti Allenamenti:** Aggiunta dinamicamente la colonna "Insegnante" nel modulo `iscritti_per_attivita.tsx` per il sub-tab Allenamenti, valorizzandola direttamente dal payload `courseInstructorName` nativo.
* **[F1-PROTOCOLLO-094] Rimosso Conflict Check Backend (POST/PATCH courses):** Eliminata la validazione anti-sovrapposizione slot dal backend (`server/routes.ts`) sugli endpoint `POST /api/courses` e `PATCH /api/courses/:id`. Il controllo bloccava salvataggi legittimi in scenari multi-sala e generava falsi negativi. Rimosso per consapevole scelta operativa; la validazione visiva resta a carico del frontend.
* **[F1-PROTOCOLLO-095] DELETE Duplicati SALSA (3 record):** Rimossi direttamente dalla tabella `courses` 3 record duplicati di tipo "Salsa" generati da precedenti sessioni di test/duplicazione. Ripristinata la consistenza della lista attività.
* **[F1-PROTOCOLLO-096] DELETE Duplicati SALSA/PILATES (4 record):** Rimossi ulteriori 4 record duplicati misti ("Salsa" e "Pilates") dalla tabella `courses`. La pulizia completa dei duplicati garantisce rendering corretto delle liste in `courses.tsx` e `activity-management-page.tsx`.
* **[F2-PROTOCOLLO-097] Rimosso `window.confirm` Conflitto Slot (Frontend):** Eliminato il `window.confirm` che interrompeva il flusso di salvataggio in `CourseUnifiedModal.tsx` quando veniva rilevato un potenziale conflitto orario. L'UX è ora fluida e non bloccante; la responsabilità di validazione è delegata esclusivamente al backend REST.
* **[F2-PROTOCOLLO-098] Fix Allievo Doppio in Modalità Edit (searchMember1 vuoto):** Corretto bug in `CourseUnifiedModal.tsx` per cui, all'apertura del modale in modalità edit, il campo `searchMember1` risultava vuoto anche se un allievo era già associato. Ora il campo viene pre-popolato correttamente con nome e cognome dell'iscritto esistente, evitando la doppia entry accidentale.
* **[F2-PROTOCOLLO-099/101/102] Fix Crea Copia (Crash + Modale + onDuplicated):** Risolto un crash critico nel workflow "Crea Copia" di `CourseUnifiedModal.tsx`. (099) Il crash derivava da un accesso a `undefined` su `formData.id` dopo la duplicazione. (101) Corretta la logica che chiudeva il modale immediatamente dopo la duplicazione invece di mantenerlo aperto sul record clonato. (102) Implementato il callback `onDuplicated(newId)` per trasmettere l'ID del nuovo record clonato al componente padre (`courses.tsx`), consentendo l'invalidazione corretta della query e la riapertura automatica del modale sul clone.
* **[F2-PROTOCOLLO-100] Filtro Badge ATTIVO in `courses.tsx`:** Rimosso il badge ridondante "ATTIVO" dalla visualizzazione nella lista corsi in `courses.tsx`. I corsi attivi non necessitano di un badge esplicito; il badge viene mostrato solo per stati diversi da "ATTIVO" (es. SOSPESO, COMPLETO), snellendo l'interfaccia visiva.
* **[F2-PROTOCOLLO-103] Banner Giallo COPIA nel Modale:** Aggiunto un banner di avviso di colore giallo/ambra nella parte superiore del `CourseUnifiedModal.tsx` quando il modale si trova in modalità "COPIA". Il banner riporta la dicitura "📋 MODALITÀ COPIA — Stai modificando una copia del record originale" per evitare confusione operativa all'utente.
* **[F2-PROTOCOLLO-104/105/106/107] Campi Rossi in Modalità COPIA:** Implementata la colorazione rosso dei campi chiave (`Giorno`, `Orario Inizio`, `Orario Fine`, `Studio`) nel `CourseUnifiedModal.tsx` quando il modale è in modalità COPIA. Il segnale visivo impone all'operatore di aggiornare consapevolmente i dati temporali prima di salvare il record duplicato, prevenendo conflitti accidentali.
* **[F2-PROTOCOLLO-107B] Badge Calendario Colori Pieni Allineati Legenda:** Corretti i badge degli eventi nel `calendar.tsx` per utilizzare colori pieni (background solid) coerenti con la legenda colori dell'`ActivityColorLegend`. Eliminata la discrepanza visiva tra legenda e badge effettivi sulla griglia settimanale.

---

### 08 Aprile 2026 (Phase 32: Cleanup Massiccio & Unificazione Totale STI)
* **[F1-PROTOCOLLO-067/068] Stabilizzazione TS & Architettura STI:** Eseguito il più vasto cleanup di refactoring TypeScript portando gli errori di compilazione da 228 a 0 (zero assoluto).
* **API `activities-summary` a regime STI:** Disinnescata e rimossa la vecchia logica multi-silos. L'endpoint usa in tempo reale una query aggregata SQL nativa dalla super-tabella `courses`, mappando le chiavi (`corsi`, `allenamenti`, `lezioni-individuali`, ecc.) direttamente al FrontEnd.
* **Deprecazione e DROP Codice Obsoleto:** Piallati **52 endpoint obsoleti** in `routes.ts`, rimossi **120 metodi** silenti in `storage.ts`, e purificato il layer `unifiedBridge.ts`.
* **Mappatura Database STI (16 Tabelle Droppate):** Chiuso e storicizzato il delete massivo dal DB delle sovrastrutture legacy (`workshops`, `trainings`, `individual_lessons`, ecc. compresi gli enrollments). Il perimetro del progetto cala a **72 Tabelle attive**, consacrando ufficialmente la *Single Table Inheritance* (STI) al 100%.


### 08 Aprile 2026 (Phase 31: Migrazione Definitiva Category ID e Semplificazione STI)
* **[F1-PROTOCOLLO-063] Cleanup Schema e DROP Tabelle:** Eseguito DROP massivo dal database MySQL (`stargem_v2`) di 16 tabelle legacy (tutti i vecchi silos `trainings`, `individual_lessons`, ecc., più le viste unificate obsolete `activities_unified` e `enrollments_unified` e le tabelle enrollments speculari). Il numero totale di tabelle scende a 72. Ripulite oltre 78 definizioni e relazioni obsolete in `shared/schema.ts`, eliminando vincoli pregressi. Inoltrato git commit definitivo.
* **[F1-PROTOCOLLO-064] Verifica Dati STI:** Analisi diagnostica (Corsi e Iscritti). Verificata l'integrità del datalayer: certificata la presenza di "allenamenti" (6 corsi, 1 iscritto) e "prenotazioni" (3 corsi, 1 iscritto) nella tabella `courses` e nell'associazione `enrollments`. L'assenza visiva segnalata sulle UI Panoramica (iscritti a zero) è riconducibile esclusivamente al binding frontend/API, isolando la natura del bug fuori dal database.
* **[F1-PROTOCOLLO-048/051/053/054] Migrazione `category_id` (Corsi):** Eseguita la query SQL di cross-reference che ha allineato definitivamente i 303 `courses` attivi: i vecchi flag legacy (ID 1-5) che causavano la rottura grafica nel Bridge STI sono stati re-mappati (via JOIN nome categoria) ai rispetti valori universali nativi dentro `custom_list_items` (ID > 400).
* **Fix UI/UX Calendario STI:** Rimosso il bug dei Box grigi. L'`unifiedBridge` ed il Calendario Front-End comunicano nativamente processando i `colorProps` originali (borderLeftColor) recuperati asincronamente dalla custom list `Categorie`.
* **Shutdown e Unificazione Silos (`campus_activities`):** Analisi quantitativa dei vecchi silos isolati. Migrati al volo i 2 record restanti da `campus_activities` trasferendoli dentro `courses` tramite `activity_type = 'campus'`. Questo convalida compiutamente l'astrazione STI (Single Table Inheritance).
* **Deprecazione Drizzle ORM (`schema.ts`):** Marcatura visuale chiara di `// DEPRECATO` nel file struct per indicare i silos fisici svuotati e desueti: `individualLessons`, `trainings`, `sundayActivities`, `recitals`.
* **Audit per Eliminazione Massiva (DROP TABLE):** Sviluppata l'analisi di sicurezza pre-DROP per la cancellazione delle tabelle (inclusa la tabella root `categories`), la quale verrà finalizzata in via definitiva subordinatamente alla dismissione delle chiavi estranee e pulizia di `routes.ts`.
* **Sync Globale Documentazione:** I manuali operativi e le checklist cronologiche (`01_Architettura`, `04_Stato_Lavori`, `06_Checklist`) sono stati integralmente sincronizzati e riflettono l'azzeramento infrastrutturale e le priorità odierne (Drop Tabelle, Fix B037, Fix B040).

### 07 Aprile 2026 (Phase 30: Completamento Motore STI - Lezioni Individuali & Database Core)

* **Esecuzione Migrazione 0010 (activity_type):** Aggiunta con successo la colonna `activity_type` (varchar 50) alla tabella `courses` tramite script raw TS bypassando il bug di introspezione constraint di Drizzle (MariaDB 11.4). Il flag consente ora di scindere a livello database i tipi `course`, `allenamenti`, `individual_lessons` nello schema unificato STI.
* **Refactoring Filtri API (Fix Lista Vuota):** Ristrutturate `routes.ts` e `storage.ts` abilitando il passaggio nativo di `req.query.activityType` nel blocco unificato `GET /api/courses`, ripristinando la conformità architetturale STI deprecando i vecchi e promiscui parser JSON (`lessonType`).
* **Rimozione Foreign Key `categoryId`:** Disinnescato il vincolo bloccante `courses_category_id_categories_id_fk` dalla tabella `courses` nel database MySQL. Questo sblocca ufficialmente il salvataggio dei record provenienti dalle *Liste Personalizzate Unificate* della web UI (es. ID alti come 411 per "Coreografia"), risolvendo il crash silenzioso `ER_NO_REFERENCED_ROW_2`.
* **Testing & Validazione Backend STI:** Testato e confermato il superamento del blocco d'inserimento. L'API di `CourseUnifiedModal` verso la tabella relazionale unificata (`courses`) è ora al 100% stabile ed accetta regolarmente anche le Liste Custom e array dinamici JSON (es. Tipologia).
* **Operazione Data-Pump & Backfill Storico (STI):** Esplorate a fondo le vecchie tabelle silo (`trainings` e `individual_lessons`) scoprendole attualmente svuotate/orfane. Ipotizzando un disallineamento storico o pregressi fallback dei corsi, sono andato ad aggiornare in batch tutti gli "unassigned courses" settando a livello SQL l'`activity_type = 'course'`. Contestualmente, i vettori di test creati recentemente per Allenamenti e Prenotazioni sono stati ricalibrati con la corretta `seasonId = 1` affinché combacino esattamente col filtro attivo delle query correnti del Frontend, sbloccandone definitivamente la validazione UI.
* **Estensione Metadata UI (Color Props):** Modificato permanentemente lo schema nativo `custom_list_items` estendendolo con la colonna `color`. Il DDL è stato forzato via script asincrono (bypassando i lock server) e la propagazione automatica all'endpoint `GET /api/custom-lists` garantisce a F2 un fetch libero. Iniziata l'analisi di mapping per l'UnifiedBridge.
* **Test Notturno & Unified Bridge Fix (STI-Color):** Riscritta l'iniezione RAM in `unifiedBridge.ts` incorporando `custom_list_items`. La rotta aggregata principale `GET /api/activities-unified-preview` adesso estrae autonomamente e trasforma dinamicamente il colore HEX iniettandolo in `colorProps` (gestendo correttamente il fallback `name/value`). Eseguito audit DB per la coerenza `activity_type` in `courses` su 405 record (nessun orfano). Risolti pienamente tutti gli endpoint `/api/courses?activityType`. L'architettura dati è pronta per le UI Frontend definitive.
* **Mappatura activityType Dinamica:** Risolto bug logico visivo in `unifiedBridge.ts` che forzava l'etichetta `activityType: "standard"` all'oggetto payload dei corsi del Calendario. Lo snippet è stato aggiornato impiegando l'operatore di defer logico per interrogare nativamente il campo salvato a DB. Allenamenti e prenotazioni emergono in chiaro sul FE.
* **Correzione categoryName (Bug B024):** Introdotto `LEFT JOIN` nativo in Drizzle ORM (`storage.ts` per i metodi `getCourses` e `getCoursesBySeason`) per esporre in API il nome testuale della categoria prelevato da `custom_list_items.value`. Il frontend riceve l'informazione in chiaro ripristinando il corretto lookup nei riepiloghi.
* **Bonifica Dati Obsoleti (Bug B020):** Rimossi permanentemente dal database i 5 cloni di test ("test Personal Trainer", ecc.) associati alla lista Allenamenti.
* **Risoluzione Doppia Serializzazione (Bug B027, B029):** Eliminata l'istruzione `JSON.stringify` ridondante sui campi array `lessonType` e `statusTags` nei metodi `createCourse` ed `updateCourse` di `storage.ts`, affidando a Drizzle la corretta e singola codifica JSON, ristabilendo la corretta persistenza e lettura da parte dell'UI.
* **Evoluzione Liste Backend (Bug B030):** Generata la nuova struttura `Tipologie Allenamenti` in `custom_lists` e instanziati i 5 campi canonici (Singola, Coppia, Gruppo, Personal Trainer, Prove) per supportare il refactoring esteso del frontend F2.
* **Estrazione Partecipanti (Bug F1-039, F1-040):** Implementato il filtro `courseId` nell'endpoint `GET /api/enrollments` per permettere a F2 il lookup in realtime degli allievi già iscritti ad una prenotazione/allenamento.
* **Migrazione Architetturale Categorie (STI Phase 3):** Eseguito l'aggiornamento massivo SQL su 303 record della tabella `courses`, migrando il campo `category_id` dai valori legacy 1-5 verso gli ID dinamici >400 allocati in `custom_list_items`. Questo allinea nativamente tutto lo storico ai nuovi listini colorati del Frontend ed elimina incongruenze visive nel bridge unificato del Calendario.
* **Bonifica Database (STI Phase 4 - Deprecazione Silos):** Migrati gli ultimi dati attivi delle tabelle `campus_activities` all'interno dell'aggregatore padre `courses`. Avviata marcatura deprecazione (`DEPRECATO`) in Drizzle per i 4 silos vuoti (Domeniche, Allenamenti, Lezioni e Saggi) e analizzato lo shutdown imminente per le rotte silenti del server.

### 06 Aprile 2026 (Phase 29: Rebranding StarGem Suite & TeoCopilot)
* **Rebranding "StarGem Suite" & Griglia Moduli:** Ristrutturata drasticamente la pagina di Login (`auth-page.tsx`), abbandonando il moniker "StarGem Manager". La root d'accesso ora presenta lo status di suite aziendale, esponendo una griglia luminosa con loghi dorati (Golden Gradient CSS) per tutti i 7 sotto-moduli ufficiali e riservati (GemTeam, Gemory, MedGem, BookGem, TeoCopilot, Gemdario, Clarissa).
* **TeoCopilot (Layout "Push" Side-by-Side):** Disattivato e rimosso l'uso del componente `Sheet` a scorrimento (sovrapposizione grigia) a favore di un layout `aside` nativo stretto tra menu e canvas, ancorato saldamente al root node intermedio (`App.tsx`). L'apertura dell'Assistente AI ora "spreme" elasticamente l'applicativo principale, abilitando nativamente il multitasking e l'ispezione side-by-side senza alcuna occlusione visiva sulla dashboard.
* **Integrazione Asset Avatar Dinamica:** Integrate in `/assets` le due versioni dell'avatar Lottie/PNG di TeoCopilot (Volo Intero e Solo Testa) realizzate esternamente. Applicato l'avanzato filtro strutturale `mix-blend-multiply` in React per generare trasparenza senza Alpha Channel nativo sulla schermata di login, snellendo l'esperienza di login. Sostituita altresì "Bot icon" con la Miniatura Teo per i baloon chat interni ad aumentare il senso di immedesimazione AI.

### 06 Aprile 2026 (Fix Validazione Modali, Smart-Fill UI/UX e Preparazione Refactor Pagamenti)
* **Aggiunta Rapida Anagrafica (Obbligatoria):** Aggiornato il modale `QuickMemberAddModal.tsx`. Rimossa la dicitura "opzionale" e inseriti controlli obbligatori (`required`) per i campi Nome, Cognome, Telefono, Email e Codice Fiscale. Il tasto "Salva e Usa" è ora dinamicamente inibito se manca anche solo uno di questi campi per assicurare dati completi nei momenti di picco alle reception.
* **Smart Fill (Pre-compilazione Eventi):** Implementato script di auto-popolamento dinamico in `CourseUnifiedModal.tsx`. Quando la modale è in fase di creazione (insert/nuovo), rileva il Giorno corrente geolocalizzato (es. LUN), la Stagione primariamente attiva, e l'Orario di sistema (arrotondato a blocchi di 30 minuti) per azzerare i tempi di data-entry.
* **Correzioni Cromatiche & Pennini (Pencil Edit Links):** 
  * Ripulito interamente l'aspetto testuale della sezione prezzi/pacchetti (rimossi messaggi d'errore o label rossi "text-red-600" in favore di placeholder neutri e leggibili). 
  * Installati i link di deep-jump dinamici (pennino Edit) su tutte le etichette anagrafiche, compreso il modulo "Gruppi" dei Campus (`CustomListManagerDialog listType="gruppi_campus"`), permettendo la gestione on-the-fly delle combobox.
* **Progettazione Database (Da Eseguire Mercoledì):** Come stabilito al termine delle verifiche, è stata autorizzata la futura riorganizzazione massiva lato Database. Da Mercoledì mattina il focus sarà esclusivamente indirizzato a uno snellimento categorico delle logiche di memorizzazione in DB, **con assoluta precedenza e rifinitura della questione Pagamenti**, puntando alla stabilità, velocità d'uso e operatività error-free per l'interfaccia di Cassa. 
  * *REQUIREMENT TASSATIVO:* Prima di eseguire le query martedì sera / mercoledì, dovrà essere scattato un backup integrale e parallelo **sia del sorgente (Filesystem) sia dell'engine (MariaDB)** per garanzia di failback.

### 05 Aprile 2026 (Phase 28.6: Gestione Note & Storico Globale)
* **Nuova Dashboard Gestione Note (`/inserisci-nota`):** Trasformato il vecchio link orfano in una Dashboard globale (`gestione-note.tsx`) strutturata a livello estetico ed informativo. Centralizzate le operazioni di monitoraggio visivo per note operative incrociate.
* **Sistema di Ordinamento Nativo e Highlight 3D Oro:** Integrate funzioni di sorting A-Z in testa-tabella (Data, Autore, Sezione, Archiviazione) con colorazione dinamica in giallino delle colonne in focus. Conformato l'impatto visivo all'Oro 3D (Gold gradients: `from-[#FFD700] via-[#D4AF37] to-[#B8860B]`) per l'iconografia madre e i pulsanti d'inserimento/salvataggio primari, rispettando rigorosamente la brand identity. Ordinamento primario forzato sulla recency cronologica d'azione (sia creazione pura che chiusura da parte dell'Admin) per non disperdere storici recenti tra i dati.
* **Targeting Esplicito e Deep Linking UI:** Il modulo di creazione nota adesso ingloba tutte le rotte applicative canoniche attuali, dotando di url intelligenti ogni "post-it". In tabella la stringa URL si tramuta in *Badge Cliccabile* per saltare fluidamente all'anagrafica o pannello relazionato.

### 04 Aprile 2026 (Phase 28.5: Security by Design, "Knowledge Base" e Matrix dei Ruoli)
* **Stabilizzazione Tracking Presenze e "Tempo di Lavoro" (Anti-F5):** Riscritto integralmente l'algoritmo di misurazione temporale degli operatori isolandolo dal browser. Inserita la *Tolleranza Urti* (20 minuti) in `server/routes.ts`: refresh accidentali o cadute wifi non invalidano e non azzerano la sessione (`currentSessionStart`). Uniformata la UI in "Tempo di Lavoro", blindando l'audit senza innescare finti "LOGOUT" al cambio tab. Documentate regole in Knowledge Base.
* **Sincronizzazione Reale Permessi (30 Settori):** Divelto dal componente storico `utenti-permessi.tsx` il tracciamento dei vecchi 23 sottomenù obsoleti. Costruita la mappatura matematica di 30 viste operative definitive affinché i permessi scelti combacino 1:1 con i reali URL presenti sulla Sidebar (es. Attività, Calendario, Affitti, Processi, Admin Root).
* **Introduzione del Modulo "Knowledge Base":** Trasformata in rotta attiva la voce `/knowledge-base` precedentemente dormiente in sidebar. Implementata al suo interno una UI ufficiale per l'intera squadra, di cui il primo "Articolo Base" è una Matrix Interattiva dei Ruoli ("Chi Vede Cosa"). Lo specchietto (creato come artifact `report_accessi_e_ruoli.md`) garantisce che il Super Admin e lo Staff sappiano esplicitamente quali poteri offre ogni qualifica (Super Admin VS Segreteria VS Insegnante).
* **Activity & Audit UI Translator (Tracciabilità Linguistica):** Distrutto l'output JSON bruto e inserito un Parser Semantico Interattivo in `activity-translator.ts`. I vecchi indici `{firstName: xyz}` sono testualmente convertiti da Inglese a Italiano, affiancati dal focus ("Corso", "Accessi"). Adesso la colonna `"Dettagli Info"` del log restituisce stringhe discorsive (es. `Aggiornato Corso. Valori Inseriti: Nome(Gaetano)`). Tab unificati in Dialog unica per snellimento UX.
* **Live Presence Tracker:** Aggiunta una funzionalità di heartbeat silente al backend. Gli utenti collegati mandano un ping ogni minuto.
* **Componente Avatars:** Sulla dashboard in alto a fianco alle notifiche integrato un raggruppatore di Avatars (limite 3 visi prima del trucco "popover" col resto dei loggati live) che mostra graficamente i dev/admin connessi.
* **Sezione Sidebar (Loggati):** In fondo alla Sidebar sotto al Modulo Profilo, l'elenco stringato in realtime del gruppo di lavoro mostra la loro presenza (Verde per live, Grigio off con orario dell'ultimo Heartbeat) filtrando chi supera i 15m.
* **Modale Profilazione Upload Immagine:** Attivato al click sul Profilo utente in Sidebar il modulo d'inserimento foto in Base64 `longtext` rigorosamente clampata a 2MB max, con possibilità rapida di associare i propri recapiti telefonici (integrando `phone` nel db) al proprio set utente in tempo reale, ricaricando lo stack React Query dell'ecosistema per immediato riscontro visivo altrui.


### 03 Aprile 2026 (Phase 28: Code Freeze Strategico e Perfezionamento Qualitativo)
* **Gestione Orari Globali del Centro:** Cambiata l'architettura dei limiti di blocco operativo. Per evitare rigidità legate alle singole Sale (Studios), i validatori di backend (`checkStudioConflict`) ora consultano la configurazione globale `center_operating_hours` da tabella `system_configs`. Il Calendario UI si espande e si stringe elasticamente basandosi su questi orari salvati dall'Admin.
* **Release GitHub Git Push (Auth Success):** Ripristinata e aggiornata l'autenticazione Token e PW su Git; le modifiche integrali a `stargem-gae` sono state pushati con successo nel branch main.
* **Ripristino Ambiente e Scripting (`riavvio-ambiente-wf`):** Rimodellato il tunneling SSH verso Node server e la chiusura parallela in Node PM2 senza incappare nello stato di Sleeping/403.
* **Risoluzione QA HotFixes Calendario & Duplicazione (Consegna Martedì):** Aggiornata e chiusa interamente la check-list di fix strutturali dell'UX Calendario e Duplicazione Stagionale:
  * **Zero-Overlap Dinamico:** Rimosso il difetto grafico del ritardo asincrono (`useEffect`) sul `ResizeObserver` spostando la misurazione altezze in `useLayoutEffect`, stabilizzando lo zero-overlap block-level al 100%. Aggiunto background rosso e `pulse` per i gap temporali sovrapposti sulla stessa sala (`hasTimeOverlap`).
  * **Strict Backend Validation (409 Conflict):** Rinforzata l'API server in `checkStudioConflict` introducendo fallback default (60 mins) in caso di `endTime` assente, prevenendo sovrapposizioni bucate e falsi negativi sul salvataggio.
  * **Tool Duplicazione Massiva (V2):** Esteso il layout del modulo `CourseDuplicationWizard` (`max-w-6xl`), aggiunte checkbox globali per "Select All", ed esposta la funzione atomica ("Salva singolo corso") all'interno di ogni riga per rinnovi iper-granulari. Aggiunte convalide rigorose su Date d'inizio/fine mandatory.
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
* **[AG-053] Fix urgenti Calendario + Duplicazione + Filtri + Maschera Input + Studi 23-24-25 (Risolti):** Completata la garanzia di consistenza date e orari in fase di Duplicazione Corsi massiva. Armonizzazione filtri front-end del calendario ultimata. Rimossi i blocchi UI per la logistica studi 23, 24 e 25. Annullamento errori visuali della root Maschera Input al boot.

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
*Documento generato e aggiornato al 12 Aprile 2026 sulla base dello storico conversazioni con l'AI e modifiche di GIT.*

### 10-12 Aprile 2026 (Completamento Webhook WooCommerce e UI Quote)
* **[F1-PROTOCOLLO-013 / 014] Webhook WooCommerce:** Sviluppato e validato l'engine di acquisizione ordini WooCommerce. Creata API `/api/webhook/woocommerce`, con signature authentication. Architettura transazionale idempotente: gli ordini web creano automaticamente l'utente, inseriscono l'iscrizione (enrollment 'DA_CONFERMARE') e generano i master payments, inibendo duplicati.
* **[F2-PROTOCOLLO-005] UI Modulo Quote e Promo:** Completato design multi-tab in /quote-promo, introducendo la 6a tab "Convenzioni Aziende" per gestire company_agreements e tessere istituzionali. Integrato Pricing Engine nativo per i Carnet Wallets con pre-calcolo dinamico per "Usa 1" (Group/Luogo). Aggiunta "Lezione Spot Dialog" in Carnet per incassi rapidi con rate automatici. Migliorata type-safety estesa in React Query. COMPLETATO ✅ PROSSIMI TASK: Test con operatore reale.

### 12-13 Aprile 2026 (Sviluppo UI Modulo GemPass & Fix Allenamenti)
* **[F2-PROTOCOLLO-113] Fix UI Tab Allenamenti:** Corretto il bug nella componente `iscritti_per_attivita.tsx` per il sub-tab Allenamenti riguardante la colonna Insegnante (mostrata precedentemente a '-'). Introdotto approccio safe con `trim()` e fallback catena array per valorizzare correttamente il `courseInstructorName` nativo.
* **[F2-PROTOCOLLO-001] Scaffold Modulo GemPass:** Creata l'infrastruttura di base protetta per l'interfaccia `/gempass` con 4 Tab applicativi (`Tessere Attive`, `Nuova Domanda`, `Documenti & Firme`, `Statistiche`). Abilitata la rotta in `App.tsx` e integrata in `app-sidebar.tsx` nella sezione "Anagrafica Generale".
* **[F2-PROTOCOLLO-002] Tessere Attive (GemPass Tab 1):** Implementata la tabella dati reattiva per il prelievo via GET `/api/memberships` con binding e ricerca full-text asincrona (Nome e Numero Tessera). Introdotta la semantica di colori/badge a livello client per la profilazione customizzata legacy del database e date logiche come 'In Scadenza' <= 30 gg.
* **[F2-PROTOCOLLO-003 & 004] Nuova Domanda Tesseramento (GemPass Tab 2):** Implementato il modulo UI digitale basato sul format cartaceo GEOS SSDRL correntemente usato in segreteria. Modulo espanso in 5 macrosezioni. Introdotto il **Ricerca Socio Automatica (Sezione A)** per il caching locale del codice fiscale e auto-popolamento. Costruita l'ibridazione dell'Engine temporale tramite GET `/api/seasons/active` per le deduzioni Stagione di competenza e prefisso Card Number. Costruito internamente un Selettore di Flusso dinamico **Adulto / Minore / B2B (Sezione C)**, che adatta le interfacce per la raccolta di moduli Anagrafici di *due Tutori indipendenti* e consensi normativi vincolanti, proteggendo il submit. Connessa via POST la Mutation asincrona a `/api/gempass/tessere`.
* **[F2-PROTOCOLLO-005] Documenti, Firme e Statistiche (GemPass Tab 3 e 4):** Strutturati i layout finali dei due Tab rimanenti. Il Tab 3 dispone ora di un modulo di esplorazione documentale (mockato temporaneamente in attesa dell'API unificata backend) con filtri avanzati per Socio, Tipo Documento e Stagione; sono implementati i color-badge nativi per la validazione digitale. Il Tab 4 incorpora 4 widget statistici ("Tessere Attive", "In Scadenza", "Scadute", "Totale Stagione") calcolati dinamicamente ereditando la store di React Query del Tab 1.
* **[F2-PROTOCOLLO-006] GemPass Real-Time Data & Profilo Membro:** Collegata la route ufficiale `/api/gempass/firme-all` al Tab 3 (Documenti e Firme) per storicizzare le firme in logica reattiva annullando il dict mock; implementata routine per fallback su record null. Attivato in Tab 1 il componente nativo `Dialog` (shadcn) per il Rinnovo Rapido Tessera mediante invio della Mutation di aggiornamento. Sovrascritta all'interno del gestore profilo globale (`member-dashboard.tsx`) la sub-sezione legacy delle Tessere, riadattandola fedelmente in un Widget in sola-lettura connesso alla rotta `GET /api/gempass/membro/:id/tessera` replicante medesimi Badge e Layout del nuovo sistema.
* **[F1/F2-PROTOCOLLO-007] E2E Testing Modulo GemPass:** Condotto il collaudo formale delle pipeline asincrone e dell'UI. I test Backend (T01-T12) verificano le scritture ACID su `memberships` e `member_forms_submissions` (vincolate alla limitazione `isAuthenticated` dei cookie di sessione per le macro-chiamate da terminale HTTP). I test Frontend (T-UI-01-T-UI-10) ratificano il workflow asimmetrico per Minori (con blocco safe-submit sui doppioni CF Tutori), la propagazione realtime nelle card statistiche, l'aggiornamento badge a scadenza <= 30 gg, e la coerenza della navigazione fra Sidebar Anagrafica e Route globale `/gempass`. COMPLETATO ✅.
* **[F1/F2-PROTOCOLLO-017] GemStaff Finalization & Email Infrastructure:** Completato l'end-to-end SMTP e l'autenticazione OTP per insegnanti (porto 465 SSL via `mail.studio-gem.it`) su 3 macro-flussi Node.js (Welcome, Reset Password, Confirm Activation). Architettate route API backend su database unificato (`/api/gemstaff/me`, `forgot-password`). Fix ProtectedRoute. Pull in produzione ed esecuzione absolute safe-backup `mariadb-dump` su server IONOS (9.2MB). GEMSTAFF 100% COMPLETATO ✅ (13/04/2026).
* **[AG-BACKUP-001] Security Backup:** Backup finale GemPass e GemStaff completato.

### 16 Aprile 2026 (Data Integrity, Deduplicazione e GemPortal Schema)
* **[F1-016 / 017] Multi-Pass Import Architecture & GDPR Core:** Architettato e sviluppato lo script `import_soci.ts` (Passata 1 e 2) per consolidamento e merging massivo di anagrafiche Master GSheet e Athena. Ampliata rigorosamente la core table `members` in `shared/schema.ts` aggiungendo 10 nuovi campi dedicati alla tutela minorile (tutori fisio-legali GDPR) e filtri geografici (`region`, `nationality`). Aggiunto tracking unificato assensi Marketing.
* **[F1-018 / 021] Algoritmo di Deduplicazione e Merge Soci (Fase 1-2):** Sviluppati e lanciati in live environment `validate_cf.ts` (Omocodia e ISO check validati con checksum 16 chr italiano) e routines complesse di pulizia doppiette. Eseguita macro-pulizia atomica del DB cancellando **~530 ghost records**, duplicati fonetici telefonici e sovrapposizioni email. Il conteggio attivi è stato scalfito con precisione a **9.400 membri attivi univoci**. Pushed e backuppato con timestamp orario (`/root/backups/`). 
* **[F1-022] Evoluzione Runtime Filtri ed `enrollment_status`:** Aggiunto il flag ENUM nativo `enrollment_status` su `members` disaccoppiando l'eliminazione anagrafica (active) dalla frequentazione stagionale. Standardizzato il timestamp temporale al layer database assegnando d'ufficio la stagione '2025-2026' a tutte le 9.400 utenze attive. Sostituita in `server/storage.ts` `/getMembersPaginated` la logica hardcoded per la verifica Età (`is_minor`) introducendo il calcolo dinamico server-side timestamp diff `TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) < 18` garantendo profilazione età realtime a vita. Completato ciclo di staging e Push in Produzione su IONOS Nginx.


## 2026-04-20 (17:15)
- Sistemato bug UI : aggiunta gestione `pausa` nella griglia e conteggio header.
- Fix variabili report mensile (`firstName`, `ore_totali`).
- Wipe righe fittizie in attendance per avviare tracciamento pulito su produzione.

## 2026-04-21 (20:08)
- **[DB WIPE]** Eliminata mole di dati sporchi dalla tabella `activities` generati durante test STI pregressi, con ricollegamento ufficiale del Calendario Operativo alla tabella nativa `courses`.
- **[DB WIPE]** Azzerata la tabella `universal_enrollments`, riconducendo formalmente le statistiche iscrizioni ai collaudati `enrollments`. Eliminati eventi di Planning fantasma (`strategic_events`).
- **[UI REFACTOR]** Uniformati filtri e popover tra Calendario Operativo e Planning Strategico. Implementato styling CSS (opacità) per mascherare giorni storici o non esistenti.
- **[LOGIC REFACTOR]** Ottimizzato il fetch per contare nativamente gli iscritti tramite aggregazione DB `(count(*))`.
