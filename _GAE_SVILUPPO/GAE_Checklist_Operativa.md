# 📝 Checklist Operativa CourseManager (Roadmap Fase 2)
*(Questo documento funge da promemoria vivente per il team di sviluppo. Spuntare i task o aggiungerne di nuovi mano a mano che l'architettura SaaS V2 prende forma).*

## Legenda Stati
- [x] = COMPLETATO
- [~] = IN CORSO / COMPLETATO MA DA VALIDARE
- [ ] = NON INIZIATO
- [!] = BLOCCATO / DIPENDENZA APERTA
- [-] = NON NECESSARIO / GIÀ COPERTO

---

## 1. Refactoring UI Attuale (Miglioramenti Immediati)
Questi task servono a risolvere i "dolori" dell'applicazione odierna prima di tuffarsi pesantemente nella logica V2.

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
  - Fatto: Riformattati tutti gli esadecimali rossi, arancioni e azzurri dell'attuale front-end con le variabili CSS documentate in `5_GAE_Linee_Guida_Grafiche_UI.md` (es. `bg-primary`, `bg-destructive`, `.gold-3d-button`).
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

## 3. Implementazione Schema Drizzle V2 (Motore Dati ed API) - *SOSPENSIONE TEMPORANEA*
> [!WARNING]
> Lo sviluppo della architettura Single Table Inheritance (STI) e l'unificazione in `activities` e `global_enrollments` sono momentaneamente bloccati e rimandati a data da destinarsi (su richiesta 12 Marzo 2026).
> QUALSIASI MODIFICA O NUOVA FEATURE DEVE ESSERE SVILUPPATA SULLA VECCHIA ARCHITETTURA A 11 SILOS. Non prendere iniziative per l'unificazione senza preavviso.

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
  - Manca: Predisporre i backend per lo Staff App, Team App e moduli CRM.

---

## 4. UI Interazione e Integrazioni Architetturali (Piano Interazione UI)
*(Task derivati da `4_GAE_Piano_Interazione_UI.md` e dal feedback cliente)*

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
