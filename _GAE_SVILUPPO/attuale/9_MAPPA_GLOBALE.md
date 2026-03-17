# AUDIT STRUTTURALE TOTALE - CourseManager (Stato Attuale)

Questo documento fornisce una fotografia "da satellite" dell'intero ecosistema attuale dell'applicazione, mappando database, pagine, modali e dipendenze per pianificare il consolidamento e le future unificazioni.

---

## 1. MAPPA COMPLETA DATABASE ATTUALE
*Elenco delle tabelle reali, scopo, e stato (candidata a fusione/eliminazione).*

| Tabella | Macro-Area | Scopo / Contenuto | Stato / Note | Candidata Unificazione (V2) |
| :--- | :--- | :--- | :--- | :--- |
| `users` | Auth/Staff | Credenziali accesso, ruoli (admin, operator, instructor) | Core Vivo | No (diventerà cross-tenant) |
| `members` | Anagrafica | Anagrafica centrale clienti (140+ campi) | Core Sensibile | Sì (pulizia campi morti, STI) |
| `instructors` | Anagrafica | Cloni di members per i docenti | Duplicato/Legacy | **Sì** -> `members` con flag/ruolo |
| `courses` | Attività | Dati corsi standard | Silos | **Sì** -> `activities` |
| `workshops` | Attività | Eventi spot / Stage (con orari) | Silos | **Sì** -> `activities` |
| `domeniche_activities`| Attività | Eventi domenicali | Silos | **Sì** -> `activities` |
| `single_lessons` | Attività | Lezioni singole prenotabili | Silos | **Sì** -> `activities` |
| `trainings` | Attività | Allenamenti liberi / guidati | Silos | **Sì** -> `activities` |
| `individual_lessons`| Attività | Personal training singoli | Silos | **Sì** -> `activities` |
| `campus_activities` | Attività | Centri estivi / Campus | Silos | **Sì** -> `activities` |
| `recitals` | Attività | Saggi fine anno | Silos | **Sì** -> `activities` |
| `vacation_studies` | Attività | Vacanze studio | Silos | **Sì** -> `activities` |
| `paid_trials` | Attività | Prove a pagamento | Silos | **Sì** -> `activities` |
| `free_trials` | Attività | Prove gratuite (P/G) | Silos | **Sì** -> `activities` |
| `studios` / `booking_services` | Risorse/Serv. | Sale affittabili / Servizi generici (Massaggi ecc) | Silos Misto | **Sì** -> parzialmente in `activities` |
| `enrollments` | Iscrizioni | Iscrizione a `courses` | Silos | **Sì** -> `global_enrollments` |
| `workshop_enrollments`| Iscrizioni | Iscrizione a `workshops` | Silos | **Sì** -> `global_enrollments` |
| *(Altre 9 tabelle _enrollments)*| Iscrizioni | Una per ogni silos attività | Silos | **Sì** -> `global_enrollments` |
| `studio_bookings` | Iscrizioni | Prenotazioni sale / servizi | Silos (Usata per checkout) | **Sì** -> `global_enrollments` / bookings |
| `payments` | Fisco | Ricevute, scadenze, rate (core ledger) | Core Sensibile | No, ma estensione poly-morfica |
| `memberships` | Fisco/Assoc | Tessere associative (Nuovo/Rinnovo, Data Scad.) | Core Sensibile | No, ma logica da rivedere |
| `price_lists` / `items`| Listini | Prezzi periodici per le attività | Core Vivo | No (miglioramento UI previsto) |
| `course_quotes_grid` | UI / Admin | Foglio matriciale Quote (Workaround per excel) | Legacy Tollerato | Da astrarre o eliminare col nuovo calcolatore |
| `system_settings` | Config | Variabili globali sistema | Core Vivo | Evoluzione in `tenants` (V2) |
| `member_relationships`| Anagrafica | Legami parentali (Padre, Madre, Tutore) | Core Vivo | - |

*(Nota: Le tabelle `activities`, `activity_categories`, `global_enrollments` sono già abbozzate nel DB schema ma attualmente inattive, in attesa di V2).*

---

## 2. MAPPA COMPLETA DELLE PAGINE FRONTEND (`client/src/App.tsx`)

| Pagina | Route | Scopo Operativo | Stato | Endpoint Principali (Fetch) | Moduli/Tabelle Coinvolte |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Login** | `/login` | Accesso al sistema | Core Vivo | `/api/login` | `users` |
| **Home (Anagrafica)** | `/` | Dashboard e lista iscritti con filtri avanzati | Core Sensibile | `/api/members` (paginated) | `members`, `memberships`, `payments` |
| **Maschera Input Generale** | `/maschera-input` | Form gigante per creazione cliente + iscrizioni multiple + checkout in 1-click | **Core Iper-Sensibile** | `/api/maschera-generale/save`, `/api/members` | *Tutte* (Anagrafica, Tessere, Pagamenti, Enrollments) |
| **Calendario (Planning)** | `/calendar` | Hub Visivo Centralizzato | Core Vivo | `/api/events`, `/api/calendar/*` | Tutti i Silos Attività |
| **Planning Aule** | `/planning` | Gestione aule (vecchio calendario o complementare) | Congelato / Da Unire | `/api/planning/*` | `studios`, Attività |
| **Corsi** | `/courses` | Gestione Silos Corsi | Legacy Parziale | `/api/courses` | `courses` |
| **[X] Categories** | `/*-categories` | Tutte le pagine gestione Categorie e Silos (Workshops, Prove, ecc) | Deprecabili (in futuro) | `/api/*` (es. `/api/workshops`) | Le 11 tabelle Silos |
| **Listini** | `/listini` | Gestione quote e incroci prezzo | Core Vivo | `/api/price-lists`, `/api/course-quotes-grid` | `price_lists`, `items`, `course_quotes_grid` |
| **Pagamenti/Cassa** | `/payments` | Registro entrate (storico) ed export | Core Sensibile | `/api/payments` | `payments` |
| **Tessere/Tesseramenti** | `/memberships` | Elenco storico tessere fisiche emesse | Core Vivo | `/api/memberships` | `memberships`, `members` |
| **Import Data** | `/import-data` | Tool import G-Sheets massivo | Legacy Tollerato | `/api/google-sheets/import-mapped` | `members`, `courses` |
| **Studio Bookings** | `/studio-bookings` | Affitti Sala | Core Vivo | `/api/studio-bookings` | `studio_bookings`, `studios` |
| **Utenti/Privacy** | `/utenti-permessi` | Gestione accessi e ruoli e log privacy | Core Vivo | `/api/users`, `/api/audit-logs` | `users`, `audit_logs` |
| **Membro Singolo** | `/members/:id` | Scheda anagrafica dettaglio profondo | Core Vivo | `/api/members/:id`, pagamenti/iscrizioni bypass | `members` + Relazioni |
| **Report / Export** | `/reports` | Dashboard scaricamento PDF/Excel | Core Vivo | `/api/reports/*` | Tutto il DB (Lettura) |

---

## 3. INVENTARIO DEI MODALI (Popup / Dialog)

| Nome Modale / Componente | Contesto di Richiamo | Scopo | Stato / Rischio | Entità Coinvolte |
| :--- | :--- | :--- | :--- | :--- |
| `MemberEditDialog` | Anagrafica Home -> Click action su riga | Modifica "rapida" dati contatto, parenti (minori) e CF | Basso | `members` (PATCH `/api/members/:id`) |
| `NuovoPagamentoModal` | Anagrafica Home, Scheda Cliente | Flusso Checkout Unificato (Carrello debiti + Nuovi inserimenti) | **Altissimo** | `payments`, tutte le tabelle `*enrollments`, `memberships` |
| `PaymentDialog` | Pagina Payments / Pagina Tessere | Saldo di una *singola* voce già esistente / Modifica pagamento | Alto | `payments` |
| `Dialog` interni in Activities | Pagine Silos (`/courses`, `/workshops`...) | Creazione o Modifica di un'entità del relativo silos | Medio (Duplicati logici 11 volte) | Tabelo silos (`courses`, `workshops`...) |
| Modale Nuovo Membro | Pagine Members (ora reindirizza) | Aggiunta clienti (ora spinta verso `Maschera Input`) | Deprecato UI | - |
| Modali Eliminazione | Ovunque nel gestionale | Conferma Alert Dialog per DELETE (spesso richiede codice admin) | Alto | Logica protetta |

---

## 4. CATALOGO CAMPI PER MODALE PRINCIPALE

### A. Maschera Input Generale (`maschera-input-generale.tsx`)
Questo componente è mastodontico. Combina campi form + Modale interno di checkout.
* **Intestazione:** Stagione, Cod. Tesserato, Info Tessera Ente, Status
* **Anagrafica Base:** Cognome, Nome, CF (con auto-fill Nascita, Sesso, Luogo via parser), Email, Cell, Telefono, Indirizzo esteso.
* **Genitori (se Minore):** Stessi campi anagrafica ripetuti per Genitore 1 e Genitore 2.
* **Sezioni Inferiori (BottomSections):**
  * `tessere`: quota, membershipType, scadenza.
  * `certificatoMedico`: date di rilascio, scadenza, tipo (Agonistico/Non Agonistico).
  * `gift`: array oggetti regalo.
* **Allegati (Base64 file uploader):** Regolamento, Privacy, Certificato, Modello detrazione, ecc.
* **Logiche Nascoste:** Validazione asincrona duplicati CF/Nome. Colori campi dinamici (Giallo=editing, Verde=salvatore, Rosso=mancante obbligatorio). Form submission unica verso `/api/maschera-generale/save` che effettua 5-6 INSERT transazionali.

### B. Nuovo Pagamento Modal (`nuovo-pagamento-modal.tsx`)
Il carrello della spesa del gestionale.
* **Campi:**
  * Ricerca Anagrafica Integrata (ComboBox ricerca remota `searchTerm`).
  * Lista Debiti pregressi (Generata calcolando Iscrizioni esistenti - Pagamenti per quell'Enrollment).
  * Gestione Carrello (Aggiunta righe: Selezione Silos -> Selezione Item -> Quantità/Prezzo base -> Sconti %1, %2 -> Subtotale).
  * Checkbox Extra: Aggiungi "Quota Tessera" (25€), Sottrai "Lezione di Prova" (-20€).
  * Checkout Method (Contanti, Bonifico, Pos, Assegno, ecc).
  * Note di Pagamento.
* **Comportamento Critico:** La form cicla l'array carrello. Se è `isDebt`, effettua POST su `/api/payments`. Se è `isNew`, fa POST prima sul silos enrollment associato, ne ottiene l'ID, e poi POST su `/api/payments`. Genera anche la riga su `memberships` se flaggata la quota tessere.

### C. Member Edit Dialog (`member-edit-dialog.tsx`)
* **Campi:** Upload Foto Rapido, Nome, Cognome, Categoria Client, Tipo Abbonamento, Codice Fiscale, Sesso, Nascita, Contatti (Email, Cell, Telefono), Indirizzo (Via, Cap, Città, Prov, Stato), Info Tessera (Associazione, Ente, SCad., Num), Minorenne Checkbox (se checked, apre blocco Madre/Padre: Dati Base + Contatti), Flag Certificato Medico.
* **Logica:** Non gestisce pagamenti. Pura API di PATCH verso `/api/members/:id`. Usa debounce e parse real-time del CF.

---

## 5. MAPPATURA CAMPI SELETTIVI (Menu a tendina & Relazionali)

| Pagina/Modale | Campo / Selettore | Sorgente Dati | Binding Status | Note Costruzione |
| :--- | :--- | :--- | :--- | :--- |
| `Maschera Input` | Tipi Attività (nel wizard) | DB: Array delle 11 tabelle Silos | Ambiguo/Aggregato | Hardcoded array mappings in frontend (`getActiveActivities`) |
| `Nuovo Pagamento` | Silos Category Dropdown | Statico/Misto | OK | Seleziona prima il silos, poi popola il secondo dropdown |
| `Nuovo Pagamento`| Items Attività Dropdown | Rispettiva tabella DB (es.`/api/courses`) | OK (Reattivo) | Dipende dal primo select. Incrociato lato client col listino. |
| `Tutti` | Metodo di Pagamento | Costante (Contanti, Pos..) | Hardcoded (Frontend) | Standard. Rivedere se servono Banche multiple/Satispay. |
| `Member Edit` | Ente Promozionale | Costante | Hardcoded (`CSEN`, `ACSI`..)| Stringhe rigide |
| `Anagrafica Home`| Filtro Genere, Status.. | DB + Hardcoded | OK | Misto di costanti UI e filtri server-side query |
| `Attività` | Genitore Activity / Genere | Stringhe / Enum | Parzialmente OK | Recente refactoring su "Genere" completato. |

---

## 6. RICOSTRUZIONE DEI FLUSSI CORE

1. **Flusso Anagrafica Centrale (Nuova Iscrizione):**
   Utente entra dalla UI -> Clicca "Aggiungi" -> Apertura Maschera Input. Compila dati (con parser CF real-time) -> Salva. Il backend (transazione massiva in `server/routes.ts` `/maschera-generale/save`) esegue:
   - Check Duplicati (REST).
   - Insert in `members` (Creazione Cliente).
   - Se Genitori -> Insert/Patch in `members`. + Insert `member_relationships`.
   - Se inserisce corsi dal MultiSelect -> Insert X verso `_enrollments` + Insert `payments` pendenti se non paga subito, o saldo se paga.
   - Restituisci il Cliente ID per redirect/scheda.

2. **Flusso Checkout (La vita economica dello studio):**
   Viene richiamato da Anagrafica (Tasto €) o Scheda Cliente -> Apre `NuovoPagamentoModal`. Il frontend contatta *12 endpoint diversi* in parallelo (Query cacheate) per scaricare tutte le iscrizioni del cliente -> Li confronta con i `payments` intestati a quel cliente -> La differenza genera i "Debiti Pendenti". Il cliente paga tramite checkout -> Il backend riceve i dati per i `payments`. Questo metodo di calcolo derivato on-the-fly è **Pesante** lato computazionale e dipendenze.

3. **Flusso Calendario / Planning:**
   Le attività create nei Silos (Corsi, Workshop, etc.) generano entità con `dayOfWeek` o `date`. Il calendario e il planning fanno Fetch massivi di *tutti i silos*, normalizzati lato client (in un formato evento standard) per la renderizzazione. Modificare l'orario sul calendario spara una PATCH all'endpoint del rispettivo silos per aggiornare la tabella sottostante. Al momento è il punto d'incontro primario.

---

## 7. NODI CRITICI E DIPENDENZE FORTI

1. **La frammentazione degli Enrollment e il Calcolatore del Debito:**
   Il calcolo di quanto deve pagare un utente dipende da una equazione eseguita interamente in **Frontend** (in `nuovo-pagamento-modal.tsx`). Se cambia una colonna prezzo in un silos, o cade una query, il carrello va in errore o calcola debito a zero. Modificare la struttura di database dei "pagamenti" fa crollare il checkout. *Rischio Elevatissimo.*

2. **Maschera Generale Transazionale:**
   L'endpoint `/api/maschera-generale/save` è di circa 500+ righe di logiche `if/else`, creazione correlata di ricevute, iscritti e relazioni. Scrive su più tabelle contemporaneamente senza un mapping STI. Un errore nel parser backend o nei controlli dei parentali blocca tutta la segreteria (poiché l'operazione muore al DB rollback). È il colli di bottiglia e il fulcro del business logic.

3. **Duplicati Anagrafica:**
   Il parsing via CF cerca di mitigare il problema, ma le ricerche flessibili (import data) creano conflitti. L'implementazione recente della modal "Duplicates" è cruciale, ma il Merge delle schede (backend) deve aggiornare cascate spaventose in (14 tabelle, tutte le reference `memberId` negli enrollment e payments).

---

## 8. MATRICE DI CLASSIFICAZIONE (Stato Componenti)

| Categoria | Significato e Azione Rilevata |
| :--- | :--- |
| **CORE VIVO E SENSIBILE**| `payments`, `members`, `nuovo-pagamento-modal`, `maschera-input-generale.tsx`, `App.tsx` router, `/api/payments`, Autenticazione. *Non toccare per refactoring estetici, solo fix blindati.* |
| **CORE VIVO DA OTTIMIZZARE**| Calendario e Planning Hub, `MemberEditDialog`, File `schema.ts`. Dobbiamo prepararli all'unificazione. |
| **LEGACY TOLLERATO** | Pagine di gestione dei Silos e Elenchi (`/courses`, `/workshops`..). Fanno il loro sporco lavoro in autonomia. Tollerarli fino alla V2 STI. `course_quotes_grid` e Listini. |
| **LEGACY CONGELATO** | Esportazioni CSV vecchie, stampe ricevute pre-strutturate. Funzionano, non toccare il layout. Moduli Legacy Drizzle migrations a metà. |
| **DUPLICATO DEPRECABILE** | Entità `Instructors` e pagine correlate (i docenti sono/saranno Membri con ruolo specifico). `Rentals`, e parzialmente le Form replicate in ogni file silos al momento della creazione delle `Categories`. |
| **ELIMINABILE ORA** | Codice morto commentato in `routes.ts`, file `.temp` residui, route inutilizzate (es. endpoint superflui o doppi se esistono già i gestori unificati). |

---

## 9. SCHEMA DI UNIFICAZIONE FUTURA (Ponte verso V2)

L'audit conferma la necessità drastica di abbandonare i "Silos". Le definizioni in fondo a `schema.ts` (STI Pattern) sono state confermate corrette come target:

```text
Stato Attuale (11 Tabelle In, 11 Out, 11 Enrollments):
------------------------------------------------------
courses ---------> enrollments
workshops -------> workshop_enrollments
paid_trials -----> paid_trial_enrollments
[...]              [...]

Stato V2 STI (Unificazione a Imbuto):
------------------------------------------------------
activities (Table singola)  --> global_enrollments (Table singola)
  | -> field: categoryId -> Legato a "activityCategories" ("Corsi", "Prove", "Sale")
  | -> field: extraInfoOverrides (JSON per campi variabili es. "numero max ingressi", "scadenza ticket")
```
_Tutte_ le Modali e le chiamate fetch del "Nuovo Pagamento" e "Planning" passeranno da 12 endpoint (fatti in cascata) a **1 SINGOLO endpoint REST (`/api/activities` e `/api/enrollments_global`)**. Questo eliminerà il 60% della logica di loop in `routes.ts`.

---

## 10. SHORTLIST OPERATIVA IMMEDIATA (Priorità Fix & Freeze)

Cosa fare da subito post-audit (prima di lanciare in prod o caricare dati reali):

1. **FREEZE Sviluppo Silos:** Nessuna nuova "Attività" deve essere aggiunta come tabella separata. Qualsiasi richiesta cliente nuova => "Non ci sono i tempi, usiamo un silos esistente adattato (es. _Altro_ o _Vacanze_)".
2. **FIX Carrello Pagamenti:** Stabilizzare il parser dei Debit (se il server risponde lento, il carrello impazzisce, c'è un rischio asincrono in Redux/React Query se spammano fetch). Aggiungere Error Boundary sul componente.
3. **MIGRAZIONE Instructors -> Members (Task):** Procedere con lo script di migrazione per convertire i record di `instructors` in `members` con flag/ruolo in modo che siano cercabili dal calendario come entità uniche. (Già parzialmente gestito dall'intercept in `routes.ts`, completare la bonifica).
4. **BLINDARE Maschera Input:** Rendere intoccabile la transazione SQL di questa maschera finchè non si decide di riscriverla per la V2. Rifiutare richieste del tipo "Aggiungiamo due piccoli campetti" in quel modulo, perchè si spezzano i type in 6 file diversi.
5. **PULIZIA Routing App.tsx:** Eliminare link appesi e menù finti.

---

## 11. PUNTI DI RIFERIMENTO TECNICI / NOTE NASCOSTE

* Eiste un **Intercept brutale** in `routes.ts` (riga 1139) che intercetta i membri con `ID >= 1000000` (1 milione) e li considera `Instructors`, inoltrando la route alla tabella `instructors`. Questa è una patch temporanea per l'UI Unificata. *Questo trucco andrà spezzato quando avverrà il porting fisico per la V2.*
* L'export CSV / Import Google Sheets fa il caching della mappatura sulle variabili di sessione, occhio allo state di `maschera-input` che usa `sessionStorage` in maniera esagerata (meglio passare a `localStorage` in futuro se si sfora il cap o pulirlo regolarmente per non rallentare e crashare browser vecchi con base64 di immagini da 20MB pre-compressione). 

---
**Firma Audit:** AI System, completata fase di esplorazione globale. Il sistema è stabile per l'uso core ma necessita rigidità sui db models fino alla v2.
