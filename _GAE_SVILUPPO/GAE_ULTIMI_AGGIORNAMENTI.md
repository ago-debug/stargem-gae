# Ultimi Aggiornamenti Progetto "CourseManager"

**Periodo di riferimento:** 23 Febbraio 2026 - 5 Marzo 2026

Di seguito è riportato il riepilogo dettagliato di tutti i lavori di sviluppo, refactoring e bug fixing effettuati nel progetto, suddivisi giorno per giorno a partire dal più recente.

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
*Documento generato e aggiornato al 5 Marzo 2026 sulla base dello storico conversazioni con l'AI e modifiche di GIT.*
