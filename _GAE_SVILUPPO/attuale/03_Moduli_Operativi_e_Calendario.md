

<!-- --- INIZIO SORGENTE: attuale/07_GAE_Tassonomia_13_Attivita.md --- -->

# Tassonomia Ufficiale Attività (13 Livelli)
*Documentazione Architetturale - Stato dell'Arte post-Decisione CTO.*

La seguente gerarchia rappresenta la singola verità di dominio del progetto. Qualsiasi interfaccia o logica futura (filtri, modali, hub) deve rispettare **tassativamente questo ordine** e questa suddivisione logica.

## Le 13 Attività Ufficiali
1. **Corsi**
2. **Workshop**
3. **Prove a pagamento** *(Correlato a Corsi)*
4. **Prove gratuite** *(Correlato a Corsi)*
5. **Lezioni singole** *(Correlato a Corsi)*
6. **Lezioni individuali** *(Private autonome)*
7. **Domenica in movimento**
8. **Allenamenti** *(Dominio indipendente, sciolto da Sale/Affitti)*
9. **Affitti** *(Dominio indipendente, assorbe le pure logiche di spazio)*
10. **Campus**
11. **Saggi**
12. **Vacanze studio**
13. **Eventi esterni** *(Erede ricalibrato dei "Servizi extra")*

---

## Gap Analysis e Stato dei Nodi Incongruenti (As-Is)

Questa sezione analizza le discrepanze attuali tra il DB/Codice ereditato e la Nuova Tassonomia Sopra.

### 1. Allenamenti
- **Stato Attuale:** Esiste la rotta legacy `/attivita/allenamenti` (e i component/tabelle `Trainings`).
- **Problema:** Spesso confuso/ibridato a livello logico con la concezione di affitto di uno spazio autogestito.
- **Decisione:** **Dominio Corretto**. Viene santificato come entità a sé stante della sfera "didattica/pratica" (Attività fisica). 

### 2. Affitti
- **Stato Attuale:** Gestito ambiguamente tra `/studios`, `/prenotazioni-sale` (che punta al componente `StudioBookings` e tocca `studio_bookings`).
- **Problema:** Mischia la gestione logistica del patrimonio murario ("La Stanza X ha il pavimento in legno") con il concetto contrattuale dell'Affitto ("Ti cedo la sala per 2 ore").
- **Decisione:** **Dominio da Separare e Chiarire**. "Affitti" diventa il dominio di business erogabile numero 9. `/studios` rimarrà il registry del patrimonio.

### 3. Servizi Extra / Eventi Esterni
- **Stato Attuale:** Storicamente inquadrati come "Servizi" generici o assenti dal radar prioritario.
- **Problema:** Terminologia povera ("Servizi") che finiva per accavallarsi col concetto SaaS (es. quota associativa = servizio).
- **Decisione:** **Dominio Corretto (Rinominato)**. Battezzato ufficialmente come "Eventi esterni". Conterrà l'offerta non-in-sede o speciale.

### 4. Booking Services / Servizi Prenotabili
- **Stato Attuale:** Ha rotte (`/booking-services`, `/attivita/servizi`), ha componenti pesanti (`BookingServices.tsx`) e un castello DB annesso.
- **Problema:** È un "calderone" legacy senza vera entità di dominio didattico. 
- **Decisione:** **Silo Legacy da Riassorbire/Eliminare**. Non fa parte delle 13 essenze. Resterà parcheggiato (nascosto in UI ma vivo a codice) fino alla Fase C, quando il valore delle sue tabelle verrà travasato altrove o purgato. Non va toccato oggi.

### Le Viste: Calendario e Planning
- **Status Dogmatico:** Non sono sorgenti di verità. Sono interfacce di lettura. Non avranno tabelle o CRUD diretti sulla propria natura.

---

## Proposta di Riallineamento Prudente (Action Plan)

Per far aderire l'hub Attività alla nuova tassonomia senza rompere i DB Legacy.

### 1. Azioni Conservative Eseguibili Subito (Basso Rischio)
- Entrare nel componente `app-sidebar.tsx` e **ordinare/rinominare** le voci target all'interno del mega-menu "Attività" copiando **esattamente i 13 punti** in quest'ordine.
- Affettuare un'operazione simile (solo testuale/UI) in eventuali file di raggruppamento (es. l'indici /attivita, se statici).
- Sostituire la label "Servizi extra" in "Eventi esterni" dove visibile in UI.
- Sdoppiare in UI "Allenamenti" da "Affitti", puntando per ora "Affitti" verso la legacy di `prenotazioni-sale` (in attesa del DB).

### 2. Azioni da Rimandare a Task Dedicato (Medio/Alto Rischio)
- Accorpare fisicamente le logiche di "Prove a pagamento", "Prove gratuite" e "Lezioni singole" dentro i form del Dominio Genitore "Corsi" richiede manipolazioni dei `Data-Fetcher` React massivi.
- Creare la tabella/silo per "Eventi esterni" se non vi è l'entità chiara.

### 3. Azioni in "Freeze" (Non toccare ancora)
- La route e il file `BookingServices.tsx` (`/booking-services`). Anche se spariti semanticamente, estirparli ora fa schiantare il backoffice. 
- I database `studio_bookings` e tabelle connesse ibride.


<!-- --- FINE SORGENTE: attuale/07_GAE_Tassonomia_13_Attivita.md --- -->



<!-- --- INIZIO SORGENTE: attuale/09_GAE_MAPPA_GLOBALE.md --- -->

# AUDIT STRUTTURALE TOTALE - StarGem Manager (Stato Attuale)

Questo documento fornisce una fotografia "da satellite" dell'intero ecosistema attuale dell'applicazione, mappando database, pagine, modali e dipendenze per pianificare il consolidamento e le future unificazioni.

---

## 1. MAPPA COMPLETA DATABASE ATTUALE
*Elenco delle tabelle reali, scopo, e stato (candidata a fusione/eliminazione).*

| Tabella | Macro-Area | Scopo / Contenuto | Stato / Note | Candidata Unificazione (V2) |
| :--- | :--- | :--- | :--- | :--- |
| `users` | Auth/Staff | Credenziali accesso, ruoli (admin, operator, instructor) | Core Vivo | No (diventerà cross-tenant) |
| `members` | Anagrafica | Anagrafica centrale clienti (140+ campi) | Core Sensibile | Sì (pulizia campi morti, STI) |
| `instructors` | Anagrafica | Cloni di members per i docenti | **Completato** (Droppata) | **Già Fatto** -> in `members` |
| `courses` | Attività | Dati corsi standard | Silos | **Sì** -> `activities` |
| `workshops` | Attività | Eventi spot / Stage (con orari) | Silos | **Sì** -> `activities` |
| `domeniche_activities`| Attività | Eventi domenicali | Silos | **Sì** -> `activities` |
| `single_lessons` | Attività | Lezioni singole prenotabili | Silos (UI Dismessa, DB Attivo) | **Sì** -> `activities` |
| `trainings` | Attività | Allenamenti liberi / guidati | Silos | **Sì** -> `activities` |
| `individual_lessons`| Attività | Personal training singoli | Silos | **Sì** -> `activities` |
| `campus_activities` | Attività | Centri estivi / Campus | Silos | **Sì** -> `activities` |
| `recitals` | Attività | Saggi fine anno | Silos | **Sì** -> `activities` |
| `vacation_studies` | Attività | Vacanze studio | Silos | **Sì** -> `activities` |
| `paid_trials` | Attività | Prove a pagamento | Silos (UI Dismessa, DB Attivo) | **Sì** -> `activities` |
| `free_trials` | Attività | Prove gratuite (P/G) | Silos (UI Dismessa, DB Attivo) | **Sì** -> `activities` |
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

*(Nota: Le tabelle `activities_unified`, `activity_categories`, `enrollments_unified` sono attualmente abbozzate nel DB schema in modalità READ-ONLY ("Shadow Mode / Data Pump strato Lettura"), alimentando nativamente il nuovo Calendario Multi-Stagione).*

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
| **[X] Categories** | `/*-categories` | Tutte le pagine gestione Categorie e Silos (Workshops, Prove, ecc) | Parzialmente Dismesse (Trials Oscarate) | `/api/*` (es. `/api/workshops`) | Le 11 tabelle Silos |
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
3. **MIGRAZIONE Instructors -> Members (Task):** Operazione **Completata**. Lo script di migrazione ha convertito tutti i docenti in `members` disabilitando la tabella nativa.
4. **BLINDARE Maschera Input:** Rendere intoccabile la transazione SQL di questa maschera finchè non si decide di riscriverla per la V2. Rifiutare richieste del tipo "Aggiungiamo due piccoli campetti" in quel modulo, perchè si spezzano i type in 6 file diversi.
5. **PULIZIA Routing App.tsx:** Eliminare link appesi e menù finti.

---

## 11. PUNTI DI RIFERIMENTO TECNICI / NOTE NASCOSTE

* Eiste un **Intercept brutale** in `routes.ts` (riga 1139) che intercetta i membri con `ID >= 1000000` (1 milione) e li considera `Instructors`, inoltrando la route alla tabella `instructors`. Questa è una patch temporanea per l'UI Unificata. *Questo trucco andrà spezzato quando avverrà il porting fisico per la V2.*
* L'export CSV / Import Google Sheets fa il caching della mappatura sulle variabili di sessione, occhio allo state di `maschera-input` che usa `sessionStorage` in maniera esagerata (meglio passare a `localStorage` in futuro se si sfora il cap o pulirlo regolarmente per non rallentare e crashare browser vecchi con base64 di immagini da 20MB pre-compressione). 

---
**Firma Audit:** AI System, completata fase di esplorazione globale. Il sistema è stabile per l'uso core ma necessita rigidità sui db models fino alla v2.


<!-- --- FINE SORGENTE: attuale/09_GAE_MAPPA_GLOBALE.md --- -->



<!-- --- INIZIO SORGENTE: attuale/10_GAE_TABELLA_MASTER_MODALI.md --- -->

# TABELLA MASTER DEFINITIVA - CORE MODALI E ATTIVITÀ
*(Rev. 27 Marzo 2026 - Master Allineamento Esecutivo Phase 20)*

> **EXECUTIVE SUMMARY:** Sono state tracciate tre macro-chat di attività extra-Corsi per determinare la fattibilità e l'ordine di sviluppo del refactoring unificato (*Ref. Implementation Plan Phase 20*).
> - **Chat 4 (Lez.Ind, Allenam, Affitti) - AUDIT ESEGUITO:** Separazione netta dei domini. 'Affitti' resta isolato con Modale Booking Dedicato (rischio checkout). 'Lezioni Individuali' e 'Allenamenti' confluiranno in un unico "Modale Operativo Condiviso" preservando i campi specifici, senza fonderli semanticamente (Lezione = Prestazione privata; Allenamento = Pratica autonoma didattica).
> - **Chat 2 (Workshop, Campus, DomInMovimento):** Campus e Domeniche ok. Workshop già unificato in Phase 20 a `CourseUnifiedModal`.
> - **Chat 3 (Saggi, Vacanze, Eventi Ext):** Saggi e Vacanze ok. Eventi Esterni derubricato da UI Palinsesto a Tabella Setup Listino.
> - **Planning:** Urgente innesto `strategic_events` database su modale attualmente vuoto.

## 1. MASCHERA INPUT GENERALE
| Area | Pagina | Route canonica | Route legacy / alias | Modale | Campo UI | Label visibile | Tipo campo | Obbligatorio | Multi | Sorgente dati | Elenco / tabella sorgente | Binding | Endpoint lettura | Endpoint scrittura | Tabelle lette | Tabelle scritte | Impatta Calendario | Impatta Planning | Impatta Pagamenti | Impatta Tessere | Impatta Anagrafica | Dominio | Stato architetturale | Priorità | Rischio | Decisione operativa consigliata | Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Anagrafica/Iscrizioni | Maschera Input | `/maschera-input` | - | Form/App | Dati Base | Nome, Cognome, CF, Email, ecc. | Input/Text | Sì (Nome/Cognome) | No | Input Utente (Parse CF) | `members` | Corretto | - | `/api/maschera-generale/save` | - | `members` | No | No | No | No | Sì | Trasversale | Core Legato | Alta | Alto | Non alterare SQL Transaction | Parser CF nativo in UI |
| Anagrafica/Iscrizioni | Maschera Input | `/maschera-input` | - | Form/App | Dati Genitori | Genitore 1, Genitore 2 (Nome, CF...) | Input/Text | Se Minore | Sì | Input Utente | `members` | Corretto | - | `/api/maschera-generale/save` | - | `members`, `member_relationships` | No | No | No | No | Sì | Trasversale | Core Legato | Alta | Alto | Non espandere prima della V2 | Logica subordinata a flag |
| Anagrafica/Iscrizioni | Maschera Input | `/maschera-input` | - | Form/App | Selezione Corsi | Iscrivi Corsi | MultiSelect | No | Sì | Custom List (Silos) | Misto 11 Tabelle | Ambiguo | Frontend Fetch | `/api/maschera-generale/save` | 11 Tabelle Silos | 11 Tabelle `_enrollments` | Sì (Dati) | No | Sì | No | No | Attività | Obsoleto/Silos | Alta | Estremo | Semplificare UI a cascata | Invia payload misto massivo |
| Anagrafica/Iscrizioni | Maschera Input | `/maschera-input` | - | Form/App | Certificato Medico | Tipo, Scadenza, Rilascio | Select/Date | No | No | Costanti UI / Input | `medical_certificates` | Corretto | - | `/api/maschera-generale/save` | - | `medical_certificates`, `members` | No | No | No | No | Sì | Anagrafica | Stabile | Media | Basso | Mantenere | Aggiorna anche riga `members` |
| Anagrafica/Iscrizioni | Maschera Input | `/maschera-input` | - | Form/App | Tessera Associativa | Quota, Scadenza, Numero | Select/Input | No | No | Costanti UI / Input | `memberships` | Corretto | - | `/api/maschera-generale/save` | - | `memberships` | No | No | Sì (Genera Debito) | Sì | No | Fisco/Assoc | Stabile | Alta | Medio | Spostare calcolo quote a backend | Genera riga in `memberships` |


## 2. NUOVO PAGAMENTO
| Area | Pagina | Route canonica | Route legacy / alias | Modale | Campo UI | Label visibile | Tipo campo | Obbligatorio | Multi | Sorgente dati | Elenco / tabella sorgente | Binding | Endpoint lettura | Endpoint scrittura | Tabelle lette | Tabelle scritte | Impatta Calendario | Impatta Planning | Impatta Pagamenti | Impatta Tessere | Impatta Anagrafica | Dominio | Stato architetturale | Priorità | Rischio | Decisione operativa consigliata | Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Cassa/Ricevute | Globale | Globale (Modal) | - | `NuovoPagamentoModal` | Selezione Cliente | Partecipante | Combobox | Sì | No | API Members | `members` | Corretto | `/api/members` | - | `members` | - | No | No | No | No | No | Trasversale | Stabile | Alta | Basso | Unificare hook query di ricerca | Triggera fetch massivo debiti |
| Cassa/Ricevute | Globale | Globale (Modal) | - | `NuovoPagamentoModal` | Categoria Attività | Categoria | Select | Se no debito | No | Oggetto Statico Map | Misto | Ambiguo | `ACTIVITY_REGISTRY` UI | - | Misto | - | No | No | No | No | No | Attività | Obsoleto | Alta | Medio | Risolvere con STI Table Unica | Seleziona DB bersaglio |
| Cassa/Ricevute | Globale | Globale (Modal) | - | `NuovoPagamentoModal` | Elemento Specif. | Nome Attività | Select | Se no debito | No | Fetch dinamico Silos | Una delle 11 Tab. | Ambiguo | `/api/[silos_route]` | - | 1 Tabella Silos | - | No | No | No | No | No | Attività | Obsoleto | Alta | Medio | Traslare a `/api/activities` | Generato dal campo precedente |
| Cassa/Ricevute | Globale | Globale (Modal) | - | `NuovoPagamentoModal` | Sconti & Note | Sconto 1/2, Note | Input % / Text | No | No | Input Utente | - | Corretto | - | `/api/payments` | - | `payments` | No | No | Sì | No | No | Fisco | Stabile | Bassa | Basso | - | Modificatori calcolatore base |
| Cassa/Ricevute | Globale | Globale (Modal) | - | `NuovoPagamentoModal` | Metodo Checkout | Metodo Pagamento | Select | Sì | No | DB / Costanti | `payment_methods` | Corretto | `/api/payment-methods` | `/api/payments` | `payment_methods` | `payments`, `*_enrollments` | No | No | Sì | Sì (se quota sel.) | No | Fisco | Stabile | Alta | Critico | Blindare calcolo e gestione errori | Core transaction hub del sistema |


## 3. TESSERE / NUOVA TESSERA / EDIT TESSERA
| Area | Pagina | Route canonica | Route legacy / alias | Modale | Campo UI | Label visibile | Tipo campo | Obbligatorio | Multi | Sorgente dati | Elenco / tabella sorgente | Binding | Endpoint lettura | Endpoint scrittura | Tabelle lette | Tabelle scritte | Impatta Calendario | Impatta Planning | Impatta Pagamenti | Impatta Tessere | Impatta Anagrafica | Dominio | Stato architetturale | Priorità | Rischio | Decisione operativa consigliata | Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Segreteria | Memberships | `/tessere-certificati` | `/memberships` | `MembershipFormDialog` | Cliente | Partecipante | Combobox (O Readonly) | Sì | No | API Members | `members` | Corretto | `/api/members` | - | `members` | - | No | No | No | No | No | Anagrafica | Stabile | Bassa | Basso | - | Popolato in auto dal link Deep |
| Segreteria | Memberships | `/tessere-certificati` | `/memberships` | `MembershipFormDialog` | Tipo/Stagione | Tipo Rinnovo, Competenza | Select | Sì | No | Costanti UI | - | Corretto | - | `/api/memberships` | - | `memberships` | No | No | No | Sì | No | Tessere | Stabile | Bassa | Basso | - | Inviato al Multiplexer |
| Segreteria | Memberships | `/tessere-certificati` | `/memberships` | `MembershipFormDialog` | Tessera Federale | Ente, Num, Scadenza | Input/Date | No | No | DB Memberships/Metadata | `members`, `memberships` | Corretto | `/api/memberships` | `/api/memberships` | `memberships`, `members` | `memberships`, `members` | No | No | No | Sì | Sì | Tessere | Stabile | Media | Basso | Assicurare propagazione su Tab Membri | Aggiorna anche EntityCardNumber |
| Segreteria | Memberships | `/tessere-certificati` | `/memberships` | `MembershipFormDialog` | Dati Economici | Data Pagamento | Date | Sì | No | Input Utente / Oggi | - | Corretto | - | `/api/memberships` | - | `memberships`, (`payments`) | No | No | Sì | Sì | No | Fisco/Tessere | Complesso | Alta | Medio | Rendere Read-o-Generato Post | La fee non passa da UI formalmente |


## 4. CALENDARIO ATTIVITÀ / NUOVA ATTIVITÀ
| Area | Pagina | Route canonica | Route legacy / alias | Modale | Campo UI | Label visibile | Tipo campo | Obbligatorio | Multi | Sorgente dati | Elenco / tabella sorgente | Binding | Endpoint lettura | Endpoint scrittura | Tabelle lette | Tabelle scritte | Impatta Calendario | Impatta Planning | Impatta Pagamenti | Impatta Tessere | Impatta Anagrafica | Dominio | Stato architetturale | Priorità | Rischio | Decisione operativa consigliata | Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Palinsesto | Calendario | `/calendario-attivita` | `/calendar` | Modale Corso / Dialog | Genere (Nome) | Genere | CustomCombobox | Sì | No | `custom_lists` | `custom_lists` | Corretto | `/api/custom-lists/genere` | `/api/courses` | `custom_lists` | `courses` | Sì | Sì | No | No | No | Attività | Recente Refactoring | Media | Basso | Unificare Modale tra Silos (V2) | Ha sostituito l'input testuale Libero |
| Palinsesto | Calendario | `/calendario-attivita` | `/calendar` | Modale Corso / Dialog | Anagrafica Sala/Cat | Categoria, Sala, Istruttori | Select | No/Sì | Limit. | API Interne | `categories`, `studios`, `instructors` | Corretto | Varie `/api/*` | `/api/courses` | 3 Tabelle | `courses` | Sì | No | No | No | No | Attività | Stabile | Bassa | Basso | Preparazione a STI (OK) | Struttura relazionale pura |
| Palinsesto | Calendario | `/calendario-attivita` | `/calendar` | Modale Corso / Dialog | Dimensioni Temporali | Data Inizio/Fine, Orari, Ricorrenza | Date / Select | Sì | No | Costanti / TimeSlots | - | Corretto | - | `/api/courses` | - | `courses` | Sì | Sì | No | No | No | Attività | Stabile | Bassa | Basso | Unificare orari in DateTime reali (V2) | Attualmente Time-Strings |
| Palinsesto | Calendario | `/calendario-attivita` | `/calendar` | Modale Prenotazione | Sala/Spazio | Servizio | Select (Custom) | Sì | No | API Services | `booking_services` | Corretto | `/api/booking-services` | `/api/studio-bookings` | `booking_services` | `studio_bookings` | Sì | No | No | No | No | Affitti | Stabile | Bassa | Basso | - | Combobox permette "Testo Libero" |
| Palinsesto | Calendario | `/calendario-attivita` | `/calendar` | Modale Prenotazione | Anagrafica Prenotazione | Partecipante, Importo €, Metodo | Selezione/Input | Sì | No | API / DB | `members`, `payment_methods` | Corretto | `/api/members` | `/api/studio-bookings` | `members`, `payment_methods` | `studio_bookings`, (`payments`) | Sì | No | Se Spuntato "Pagato" | No | No | Affitti/Fisco | Ibrido | Media | Medio | Separare Checkout Affitti | Se pagato salva receipt volante. |


## 5. PLANNING (STRATEGICO)
| Area | Pagina | Route canonica | Route legacy / alias | Modale | Campo UI | Label visibile | Tipo campo | Obbligatorio | Multi | Sorgente dati | Elenco / tabella sorgente | Binding | Endpoint lettura | Endpoint scrittura | Tabelle lette | Tabelle scritte | Impatta Calendario | Impatta Planning | Impatta Pagamenti | Impatta Tessere | Impatta Anagrafica | Dominio | Stato architetturale | Priorità | Rischio | Decisione operativa consigliata | Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Direzione | Planning | `/planning` | - | `StrategicEventModal` | Tipologia | Tipologia Evento | Select | Sì | No | API `strategic_events` | `strategic_events` | Corretto | `/api/strategic-events` | `/api/strategic-events` | `strategic_events` | `strategic_events` | No | Sì | No | No | No | Meta | STABILE | Alta | Basso | - | Dati collegati a DB e attivi in backend |

---

# BLOCCO 2: MODALI DELLE ATTIVITÀ PER SILO

## 6. CORSI E WORKSHOP (Modali Custom)
*Questi due silos utilizzano file dedicati (`courses.tsx`, `workshops.tsx`) con logica di form customizzata e gestione tab iscritti integrata nel modale.*

| Area | Pagina | Route canonica | Route legacy / alias | Modale | Campo UI | Label visibile | Tipo campo | Obbligatorio | Multi | Sorgente dati | Elenco / tabella sorgente | Binding | Endpoint lettura | Endpoint scrittura | Tabelle lette | Tabelle scritte | Impatta Calendario | Impatta Planning | Impatta Pagamenti | Impatta Tessere | Impatta Anagrafica | Dominio | Stato architetturale | Priorità | Rischio | Decisione operativa consigliata | Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Attività | Corsi/Workshop | `/corsi`, `/workshop` | - | `CourseDialog`, `WorkshopDialog` | Genere | Genere (Nome) | CustomCombobox | Sì | No | `custom_lists` | `custom_lists` | Corretto | `/api/custom-lists/genere` | `/api/courses`, `/api/workshops` | `custom_lists` | `courses`, `workshops` | Sì | No | No | No | No | Attività | Recente Refac | Media | Basso | Link Pennino a `/elenchi` | Usa Redirect Parametrico SPA |
| Attività | Corsi/Workshop | `/corsi`, `/workshop` | - | `CourseDialog`, `WorkshopDialog` | Codice | SKU/Codice | Input | No | No | Input Utente | - | Corretto | - | `/api/courses`, `/api/workshops` | - | `courses`, `workshops` | No | No | No | No | No | Attività | Stabile | Bassa | Basso | - | - |
| Attività | Corsi/Workshop | `/corsi`, `/workshop` | - | `CourseDialog`, `WorkshopDialog` | Entità Coll. | Categoria, Sala, Staff | Select | No/Sì | Limit. | API Interne | `categories`, `studios`, `instructors` | Corretto | Varie `/api/*` | `/api/courses`, `/api/workshops` | 3 Tabelle | `courses`, `workshops` | Sì | No | No | No | No | Attività | Stabile | Bassa | Basso | - | FK standard |
| Attività | Corsi/Workshop | `/corsi`, `/workshop` | - | `CourseDialog`, `WorkshopDialog` | Etichette | Status | MultiSelectStatus | No | Sì | `activity_statuses` | `activity_statuses` | Corretto | `/api/activity-statuses` | `/api/courses` | `activity_statuses` | DB (Array Text) | Sì | No | No | No | No | Attività | Recente Refac | Bassa | Basso | Modello Badge per Calendario | Abbandonata l'opzione singola |
| Attività | Corsi/Workshop | `/corsi`, `/workshop` | - | `CourseDialog`, `WorkshopDialog` | Prezzo | Prezzo base | Input Number | No | No | Input Utente | - | Corretto | - | `/api/courses`, `/api/workshops` | - | `courses`, `workshops` | No | No | Sì (Base) | No | No | Attività | Stabile | Alta | Medio | Rivedere pricing model | - |
| Attività | Corsi/Workshop | `/corsi`, `/workshop` | - | `CourseDialog`, `WorkshopDialog` | Temporali | Date, Orari, Giorni | Date, Select | Sì | No | Costanti TimeSlots | - | Corretto | - | `/api/courses`, `/api/workshops` | - | `courses`, `workshops` | Sì | No | No | No | No | Attività | Stabile | Media | Basso | Usare Timestamp unici futuri | Orari come string `HH:mm` |


## 7. MODALE OPERATIVO CONDIVISO (Lezioni Individuali, Allenamenti e altre 7 Attività)
*Le seguenti aree utilizzano tutte un file riutilizzabile: `ActivityManagementPage` (`components/activity-management-page.tsx`). Questo semplifica notevolmente l'unificazione futura.*
* **Campi Core Condivisi:** Nome, Categoria, Stato, Istruttore, Sala, Data, Ora Inizio/Fine, Partecipanti, Quota, Note.
* **Campi Lezione Ind.:** Partecipante principale (Obbligatorio), Pacchetto associato, Obiettivo/Sessione.
* **Campi Allenamento:** Gruppo/Partecipanti, Istruttore (Facoltativo/Obbligatorio).

| Area | Pagina | Route canonica | Route legacy / alias | Modale | Campo UI | Label visibile | Tipo campo | Obbligatorio | Multi | Sorgente dati | Elenco / tabella sorgente | Binding | Endpoint lettura | Endpoint scrittura | Tabelle lette | Tabelle scritte | Impatta Calendario | Impatta Planning | Impatta Pagamenti | Impatta Tessere | Impatta Anagrafica | Dominio | Stato architetturale | Priorità | Rischio | Decisione operativa consigliata | Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Misti | (9 Silos) | Variabili | - | `Dialog Form (Unified)`| Genere | Genere * | CustomCombobox | Sì | No | `custom_lists` | `custom_lists` | Corretto | `/api/custom-lists/genere` | Vari endpoints | `custom_lists` | 9 Tabelle DB | Sì | No | No | No | No | Attività | Vantaggioso D.R.Y. | Alta | Basso | Pronti per Single Table Inheritc | Modifica su file base propaga a 9 |
| Misti | (9 Silos) | Variabili | - | `Dialog Form (Unified)`| Dettagli | SKU, Descrizione | Input, Textarea | No | No | Input Utente | - | Corretto | - | Vari endpoints | - | 9 Tabelle DB | No | No | No | No | No | Attività | Stabile | Bassa | Basso | - | - |
| Misti | (9 Silos) | Variabili | - | `Dialog Form (Unified)`| Status | Stati Multipli | MultiSelect | No | Sì | `activity_statuses` | `activity_statuses` | Corretto | `/api/activity-statuses` | Vari endpoints | `activity_statuses` | 9 Tabelle DB | No | No | No | No | No | Attività | Stabile | Bassa | Basso | - | Salvato come Array |
| Misti | (9 Silos) | Variabili | - | `Dialog Form (Unified)`| Relazioni | Categoria, Sala, Staff | Combobox | No | No | API Interne | `categories`, `studios`, `instructors` | Corretto | `/api/(cat|сту|inst)` | Vari endpoints | 3 Tabelle | 9 Tabelle DB | Sì | No | No | No | No | Attività | Stabile | Media | Basso | - | Select/Combobox standard |
| Misti | (9 Silos) | Variabili | - | `Dialog Form (Unified)`| Pricing | Prezzo, Quota | Input, Select | No | No | API Quotes | `quotes` | Corretto | `/api/quotes` | Vari endpoints | `quotes` | 9 Tabelle DB | No | No | Sì | No | No | Attività | Stabile | Media | Basso | Quote Select aggiorna Inp Prezzo | Le `quotes` settano price auto |
| Misti | (9 Silos) | Variabili | - | `Dialog Form (Unified)`| Temporali | Date, Orari, Giorni | Date, Select | No/Sì | No | Costanti TimeSlots | - | Corretto | - | Vari endpoints | - | 9 Tabelle DB | Sì | No | No | No | No | Attività | Stabile | Media | Basso | Da convertire in Timestamp real | Gestione stringhe `HH:mm` |


## 8. AFFITTI (Booking / Rental Modal Dedicato)
*Gestione indipendente e blindata. Modale `StudioBookings` in `studio-bookings.tsx` focalizzato sugli spazi nudi anziché sui corsi. È un dominio di Booking, NON didattico.*
* **Campi Obbligatori:** Servizio, Prenotante, Sala, Data, Ora Inizio/Fine, Importo, Stato Pagamento Immediato (Sì/No).
* **Campi Accessori:** Metodo Pagamento, Note, Contatto, Categoria Affitto.

| Area | Pagina | Route canonica | Route legacy / alias | Modale | Campo UI | Label visibile | Tipo campo | Obbligatorio | Multi | Sorgente dati | Elenco / tabella sorgente | Binding | Endpoint lettura | Endpoint scrittura | Tabelle lette | Tabelle scritte | Impatta Calendario | Impatta Planning | Impatta Pagamenti | Impatta Tessere | Impatta Anagrafica | Dominio | Stato architetturale | Priorità | Rischio | Decisione operativa consigliata | Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Affitti | Studio Bookings | `/affitti` | - | `Edit/New Booking` | Servizio | Servizio * | CustomCombobox | Sì | No | API Services | `booking_services` | Corretto | `/api/booking-services` | `/api/studio-bookings` | `booking_services` | `studio_bookings` | No | No | No | No | No | Affitti | Ibrido | Alta | Medio | Separare listino Extra vs Serviz | Opzione Testo Libero consentita |
| Affitti | Studio Bookings | `/affitti` | - | `Edit/New Booking` | Dati Economici | Importo, Pagamento Immed. | Input, Checkbox | Sì | No | Input Utente | - | Corretto | `/api/payment-methods` | `/api/studio-bookings` | `payment_methods` | `studio_bookings`, (`payments`) | No | No | Sì | No | No | Affitti/Fisco | Ibrido | Massima | Critico | Rendere Checkout Isolato | Crea receipt volante se Pagato=Sì |
| Affitti | Studio Bookings | `/affitti` | - | `Edit/New Booking` | Anagrafica | Partecipante * | Combobox | Sì | No | API Members | `members` | Corretto | `/api/members` | `/api/studio-bookings` | `members` | `studio_bookings` | No | No | No | No | No | Affitti | Stabile | Bassa | Basso | - | Permette Nuova Anagrafica Inline |
| Affitti | Studio Bookings | `/affitti` | - | `Edit/New Booking` | Location & Tempo| Sala*, Data, Ora Inizio/Fine| Select, Date | Sì | No | API / Costanti | `studios`, TIME_SLOTS | Corretto | `/api/studios` | `/api/studio-bookings` | `studios` | `studio_bookings` | Sì | No | No | No | No | Affitti | Stabile | Bassa | Basso | - | - |


## 9. EVENTI ESTERNI E MERCHANDISING
*Strutture di setup per servizi o categorie generiche.*

| Area | Pagina | Route canonica | Route legacy / alias | Modale | Campo UI | Label visibile | Tipo campo | Obbligatorio | Multi | Sorgente dati | Elenco / tabella sorgente | Binding | Endpoint lettura | Endpoint scrittura | Tabelle lette | Tabelle scritte | Impatta Calendario | Impatta Planning | Impatta Pagamenti | Impatta Tessere | Impatta Anagrafica | Dominio | Stato architetturale | Priorità | Rischio | Decisione operativa consigliata | Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Eventi Extra| Eventi Esterni | `/booking-services` | - | `New Service` | Setup Servizio | Nome, Descrizione, Prezzo | Input, Textarea| Sì | No | Input Utente | - | Corretto | - | `/api/booking-services` | - | `booking_services` | No | No | Sì (Setup) | No | No | Setup | Stabile | Bassa | Basso | Mantenere | Alimentano Combobox Affitti |
| Store | Merchandising | `/merchandising` | - | `New Category` | Setup Categoria | Nome, Descrizione, Padre | Input, Select | Sì | No | Auto Riferito | `merchandising_categories` | Corretto | `/api/merch-cat.*` | `/api/merch-cat.*` | `merchandising_categories` | `merchandising_categories` | No | No | No | No | No | Store | Stub / Incompeta | Media | Basso | Introdurre Modale Prodotto (Items)| Solo schema categorie ad albero |

---
**Nota per l'unificazione (Single Table Inheritance):**
I moduli "Corsi", "Workshop" e le "9 Attività Condivise" sono architetturalmente identici per i campi richiesti al backend e generati nella Form UI. Questo conferma la fattibilità al 100% dell'ottimizzazione STI (Single Table Inheritance) spostando i payload su un'unica Route `/api/activities` con un discriminatore logico (`activity_type`). La difformità rimane unicamente sulla gestione checkout (Affitti) e setup listini (Eventi/Merchandising).


# BLOCCO 3: MAPPA COMPLETA CAMPI SELETTIVI E BINDING (CORE E ATTIVITÀ)

## 10. MASCHERA INPUT GENERALE
| Area | Pagina | Route canonica | Modale | Campo UI | Label visibile | Tipo campo selettivo | Dominio attività | Sorgente dati | Elenco / tabella sorgente | Usa custom_lists | Usa custom_list_items | Usa linked_activities | Usa ACTIVITY_REGISTRY | Usa costanti frontend | Usa tabella DB diretta | Binding elenco -> campo | Stato binding | Condiviso o specifico | Se riutilizzabile | Impatto calendari | Impatto planning | Stato architetturale | Note e Rischi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Anagrafica | Maschera Input | `/maschera-input` | Form | Sesso | Sesso * | Select | Trasversale | Costanti Backend | - | No | No | No | No | Sì (Fallback) | No | Statico `['M', 'F', 'Altro']` | Corretto | Condiviso | Sì | No | No | Stabile | - |
| Anagrafica | Maschera Input | `/maschera-input` | Form | Comune / Provincia | Comune di Residenza | MultiSelect (Mock) | Trasversale | Costanti Frontend | - | No | No | No | No | Sì | No | Statico Dummy | Hardcoded | Specifico | No | No | No | MOCKUP | Cambiare in API ISTAT o DB Locale |
| Iscrizioni | Maschera Input | `/maschera-input` | Form | Selezione Corsi | Iscrivi a 1 o più corsi | MultiSelect | Attività | Fetch Dinamico | Misto Silos | No | No | No | No | No | Sì | API Multiple | Ambiguo | Specifico | No | Sì | No | Obsoleto | Effettua fetch n+1 sui silos. Va riscritto STI |
| Anagrafica | Maschera Input | `/maschera-input` | Form | Tipo Certificato | Tipo Certificato | Select | Anagrafica | Costanti Frontend | - | No | No | No | No | Sì | No | Statico `['Sano e Robusto...', 'Agonistico']` | Corretto | Specifico | No | No | No | Stabile | - |

## 11. NUOVO PAGAMENTO
| Area | Pagina | Route canonica | Modale | Campo UI | Label visibile | Tipo campo selettivo | Dominio attività | Sorgente dati | Elenco / tabella sorgente | Usa custom_lists | Usa custom_list_items | Usa linked_activities | Usa ACTIVITY_REGISTRY | Usa costanti frontend | Usa tabella DB diretta | Binding elenco -> campo | Stato binding | Condiviso o specifico | Se riutilizzabile | Impatto calendari | Impatto planning | Stato architetturale | Note e Rischi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Cassa | Globale | Globale | `NuovoPagamentoModal` | Cliente | Cerca Anagrafica Cliente | Combobox | Trasversale | API Members | `members` | No | No | No | No | No | Sì | `/api/members` search | Corretto | Condiviso | Sì | No | No | Stabile | - |
| Cassa | Globale | Globale | `NuovoPagamentoModal` | Listino | Listino | Select | Trasversale | API Price-lists | `price_lists` | No | No | No | No | No | Sì | `/api/price-lists` | Corretto | Condiviso | Sì | No | No | Recente Refac | Raccoglie i periodi contabili |
| Cassa | Globale | Globale | `NuovoPagamentoModal` | Categoria Attività | Attività | Select | Attività | ACTIVITY_REGISTRY | `config/activities` | No | No | No | Sì | Sì | No | `getActiveActivities()` | Corretto | Condiviso | Sì | No | No | Ibrido | Fa da switch per la fetch del catalog |
| Cassa | Globale | Globale | `NuovoPagamentoModal` | Dettaglio SKU | SKU / Dettaglio Attività | Select | Attività | Dinamico per Silo | Tabella Silo target | No | No | No | No | No | Sì | `/api/{silo}` | Ambiguo | Specifico | No | No | No | Obsoleto | Usa switch case per mappare array |
| Cassa | Globale | Globale | `NuovoPagamentoModal` | Dettaglio Iscrizione | Dettagli Iscrizione | MultiSelect | Trasversale | Costanti Backend Mock | - | No | No | No | No | Sì | No | Dati `enrollmentDetails` | Hardcoded | Condiviso | No | No | No | MOCKUP | Cambiare in logica fatturazione reale |

## 12. TESSERE E CERIFICATI
| Area | Pagina | Route canonica | Modale | Campo UI | Label visibile | Tipo campo selettivo | Dominio attività | Sorgente dati | Elenco / tabella sorgente | Usa custom_lists | Usa custom_list_items | Usa linked_activities | Usa ACTIVITY_REGISTRY | Usa costanti frontend | Usa tabella DB diretta | Binding elenco -> campo | Stato binding | Condiviso o specifico | Se riutilizzabile | Impatto calendari | Impatto planning | Stato architetturale | Note e Rischi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Tessere | Memberships | `/tessere-certificati` | `MembershipFormDialog`| Partecipante | Partecipante | Popover/Command | Anagrafica | API Members | `members` | No | No | No | No | No | Sì | `/api/members` search | Corretto | Condiviso | Sì | No | No | Stabile | Custom UI Combobox |
| Tessere | Memberships | `/tessere-certificati` | `MembershipFormDialog`| Tipologia | Tipologia Tessera | Select | Tessere | Costanti Frontend | - | No | No | No | No | Sì | No | Statico `[NUOVO, RINNOVO]` | Corretto | Specifico | No | No | No | Stabile | Pilotato per Multiplexer |
| Tessere | Memberships | `/tessere-certificati` | `MembershipFormDialog`| Stagione | Competenza Stagionale | Select | Tessere | Costanti Frontend | - | No | No | No | No | Sì | No | `[CORRENTE, SUCCESSIVA]` | Corretto | Specifico | No | No | No | Stabile | Pilotato per Multiplexer |
| Tessere | Memberships | `/tessere-certificati` | `CertificatesForm` | Partecipante | Partecipante | Popover/Command | Anagrafica | API Members | `members` | No | No | No | No | No | Sì | `/api/members` search | Corretto | Condiviso | Sì | No | No | Stabile | Custom UI Combobox |

## 13. CALENDARIO E ATTIVITÀ (Corsi, Workshop + 9 Silos Unificati)
| Area | Pagina | Route canonica | Modale | Campo UI | Label visibile | Tipo campo selettivo | Dominio attività | Sorgente dati | Elenco / tabella sorgente | Usa custom_lists | Usa custom_list_items | Usa linked_activities | Usa ACTIVITY_REGISTRY | Usa costanti frontend | Usa tabella DB diretta | Binding elenco -> campo | Stato binding | Condiviso o specifico | Se riutilizzabile | Impatto calendari | Impatto planning | Stato architetturale | Note e Rischi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Calendario| Multi | `/calendario-attivita`...| `CourseDialog`, `Unified` | Genere | Genere * | CustomCombobox | Attività | `custom_lists` via Hook | `custom_lists` | Sì | Sì | No | No | No | Sì | `useCustomListValues("genere")` | Corretto | Condiviso | Sì | Sì | Sì | Recente Refac | Rende dinamico il listino nomi corsi |
| Calendario| Multi | `/calendario-attivita`...| `CourseDialog`, `Unified` | Categoria | Categoria | Combobox | Attività | API Categories | `categories` | No | No | No | No | No | Sì | `/api/categories` | Corretto | Condiviso | Sì | Sì | No | Stabile | Standard FK |
| Calendario| Multi | `/calendario-attivita`...| `CourseDialog`, `Unified` | Sala | Studio/Sala | Combobox | Spazi | API Studios | `studios` | No | No | No | No | No | Sì | `/api/studios` | Corretto | Condiviso | Sì | Sì | No | Stabile | Cruciale per rendering colonne |
| Calendario| Multi | `/calendario-attivita`...| `CourseDialog`, `Unified` | Insegnanti | Princ./Sec 1/Sec 2 | Combobox (x3) | Staff | API Instructors | `instructors` | No | No | No | No | No | Sì | `/api/instructors` | Corretto | Condiviso | Sì | Sì | No | Stabile | Permette 3 docenti max |
| Calendario| Multi | `/calendario-attivita`...| `CourseDialog`, `Unified` | Quota | Quota Listino | Select | Finanza | API Quotes | `quotes` | No | No | No | No | No | Sì | `/api/quotes` | Corretto | Condiviso | Sì | No | No | Stabile | Alimenta campo Prezzo in automatico |
| Calendario| Multi | `/calendario-attivita`...| `CourseDialog`, `Unified` | Giorno | Giorno Settimana | Select | Temporale | Costanti Frontend | - | No | No | No | No | Sì | No | `WEEKDAYS` const | Corretto | Condiviso | Sì | Sì | Sì | Stabile | Map LUN, MAR, MER... |
| Calendario| Multi | `/calendario-attivita`...| `CourseDialog`, `Unified` | Orario | Inizio / Fine | Select | Temporale | Costanti Frontend | - | No | No | No | No | Sì | No | `TIME_SLOTS` (scarti 5 min) | Corretto | Condiviso | Sì | Sì | Sì | Stabile | Gestione Time-Strings HH:mm |
| Calendario| Multi | `/calendario-attivita`...| `CourseDialog`, `Unified` | Ripetizione| Tipo Ricorrenza | Select | Temporale | Costanti Frontend | - | No | No | No | No | Sì | No | `RECURRENCE_TYPES` | Corretto | Condiviso | Sì | Sì | Sì | Base | Supporto ripetizioni (weekly, ecc.) |

## 14. PLANNING STRATEGICO E ALTRI
| Area | Pagina | Route canonica | Modale | Campo UI | Label visibile | Tipo campo selettivo | Dominio attività | Sorgente dati | Elenco / tabella sorgente | Usa custom_lists | Usa custom_list_items | Usa linked_activities | Usa ACTIVITY_REGISTRY | Usa costanti frontend | Usa tabella DB diretta | Binding elenco -> campo | Stato binding | Condiviso o specifico | Se riutilizzabile | Impatto calendari | Impatto planning | Stato architetturale | Note e Rischi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Direzione | Planning | `/planning` | `StrategicEventModal` | Tipologia | Tipologia Evento | Select | Extra | Costanti Frontend | - | No | No | No | No | Sì | No | `[chiusura, ferie, evento]` | Mancante | Specifico | No | No | Sì | MOCKUP | DB Table mancante `strategic_events` |
| Affitti | Studio Book. | `/affitti` | `BookingModal` | Servizio | Servizio | CustomCombobox | Affitti | API Services | `booking_services` | No | No | No | No | No | Sì | `/api/booking-services` | Corretto | Specifico | Sì | Sì | No | Ibrido | Opzione Free-text abilitata |

---
**Riepilogo e Azioni su Campi Selettivi:**
L'analisi del Blocco 3 ha evidenziato che la maggior parte dei selettori relazionali (`Categorie`, `Sale`, `Insegnanti`, `Partecipanti`, `Quote`) è mappata correttamente in modo univoco tramite endpoint API. Costanti di UI gestiscono invece in logica hardcoded ambiti temporali o tipologici (`WEEKDAYS`, `TIME_SLOTS`, `Tipologia Tessera`, `Tipologia Evento Planning`). Il refactoring recente ha rimpiazzato gli originari input liberi "Nome Corso/Attività" con i `CustomCombobox` pilotati dalla tabella dinamica `custom_lists` (valore `genere`), uniformando finalmente i 9 silos condivisi, Corsi e Workshop sotto un unico dizionario gestibile. Da refactorizzare con urgenza (attualmente Mockup o Hardcoded): `Province/Comuni` (Maschera Input), `Dettagli Iscrizioni` (MultiSelect Nuovo Pagamento) e l'insieme di logica e tabella per gli `Eventi Macro` in `Planning` (attualmente finto).

<br/>

# BLOCCO 4: MATRICE DECISIONALE DEGLI ELENCHI E DEI BINDING

## 1. CAMPI CONDIVISI VERI (Riutilizzabili Multi-Modulo)
| Area | Pagina | Modale | Campo UI | Label visibile | Dominio attività | Tipo campo | Sorgente attuale | Binding attuale | Condiviso o specifico | Riutilizzabile cross-modulo | Deve usare custom_lists | Deve usare custom_list_items | Deve usare linked_activities | Serve binding elenco -> attività -> modale -> campo | Va lasciato hardcoded | Va migrato da hardcoded a DB | Va tenuto su tabella relazionale dedicata | Stato decisionale | Priorità | Rischio | Decisione operativa finale | Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Attività | `/calendario-attivita` | `Unified` / `CourseDialog` | Genere | Genere * | Attività | CustomCombobox | `custom_lists` | Corretto | Condiviso | Sì | Sì | Sì | No | Sì | No | No | No | OK | Bassa | Basso | Mantenere implementazione architetturale corrente | Refactoring recente ha stabilizzato questo campo |
| Attività | `/calendario-attivita` | `Unified` / `CourseDialog` | Categoria | Categoria | Combobox | Attività | `categories` | Corretto | Condiviso | Sì | No | No | No | Sì | No | No | Sì | OK | Bassa | Basso | Mantenere su tabella `categories` separata | Ottimo come filtro root relazionale |
| Spazi | `/calendario-attivita` | `Unified` / `BookingModal` | Sala | Studio/Sala | Combobox | Spazi/Affitti | `studios` | Corretto | Condiviso | Sì | No | No | No | Sì | No | No | Sì | OK | Bassa | Basso | Mantenere su DB relazionale dedicato | Entità fisica indipendente |
| Staff | `/calendario-attivita` | `Unified` / `CourseDialog` | Insegnanti | Princ./Sec 1/Sec 2 | Combobox | Staff | `instructors` | Corretto | Condiviso | Sì | No | No | No | Sì | No | No | Sì | Da normalizzare | Media | Basso | Fondere `instructors` dentro `members` con flag ruolo | Attualmente su DB duplicato (Legacy) |
| Anagrafica | Tutti | `NuovoPagamento`, Tessere | Cliente | Partecipante | Combobox | Trasversale | `members` | Corretto | Condiviso | Sì | No | No | No | No | No | No | Sì | OK | Bassa | Basso | Mantenere query di ricerca dinamica | Unificare i componenti UI custom combobox |
| Finanza | `/calendario-attivita` | `Unified` | Quota | Quota Listino | Select | Finanza | `quotes` | Corretto | Condiviso | Sì | No | No | No | No | No | No | Sì | OK | Bassa | Basso | Mantenere tabella `quotes` per pricing flessibile | Lega l'entità corso al breakdown finanziario |
| Attività | `/corsi` / `/workshop` | `Dialog` | Etichette | Status | MultiSelect | Attività | `activity_statuses` | Corretto | Condiviso | Sì | No | No | No | Sì | No | No | Sì | OK | Bassa | Basso | Estendere uso array su tutti i listati | Usato per flaggare "Al Completo", "Novità" |

## 2. CAMPI SPECIFICI DI MODULO (Dominio Chiuso)
| Area | Pagina | Modale | Campo UI | Label visibile | Dominio attività | Tipo campo | Sorgente attuale | Binding attuale | Condiviso o specifico | Riutilizzabile cross-modulo | Deve usare custom_lists | Deve usare custom_list_items | Deve usare linked_activities | Serve binding elenco -> attività -> modale -> campo | Va lasciato hardcoded | Va migrato da hardcoded a DB | Va tenuto su tabella relazionale dedicata | Stato decisionale | Priorità | Rischio | Decisione operativa finale | Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Affitti | `/affitti` | `BookingModal` | Servizio | Servizio * | CustomCombobox | Affitti | `booking_services` | Corretto | Specifico | No | No | No | No | No | No | No | Sì | Da normalizzare | Media | Medio | Impedire free-text per coerenza billing contabile | O associare creazione nuovo ref in background |
| Tessere | `/tessere-certificati` | `MembershipForm` | Tipologia | Tipologia Tessera | Select | Tessere | Costanti Frontend | Corretto | Specifico | No | No | No | No | No | Sì | No | No | OK | Bassa | Basso | Lasciare hardcoded `[NUOVO, RINNOVO]` | Set finito binario non espandibile |
| Tessere | `/tessere-certificati` | `MembershipForm` | Stagione | Competenza Stag. | Select | Tessere | Costanti Frontend | Corretto | Specifico | No | No | No | No | No | Sì | No | No | OK | Bassa | Basso | Lasciare hardcoded `[CORRENTE, SUCC.]` | Logica cablata su algoritmi mensili UI/backend |
| Anagrafica | `/maschera-input` | Form | Tipo Certificato | Tipo Certificato | Select | Anagrafica | Costanti Frontend | Corretto | Specifico | No | No | No | No | No | Sì | No | No | OK | Bassa | Basso | Lasciare hardcoded `[Agon. / Non Agon.]` | Set di validazione normativo ristretto |
| Anagrafica | `/maschera-input` | Form | Sesso | Sesso * | Select | Anagrafica | Costanti Backend | Corretto | Specifico | Sì | No | No | No | No | Sì | No | No | OK | Bassa | Basso | Lasciare Enum Statico API fallback | Pre-compilato dal parser automatico CF |

## 3. CAMPI AMMINISTRATIVI E TEMPORALI
| Area | Pagina | Modale | Campo UI | Label visibile | Dominio attività | Tipo campo | Sorgente attuale | Binding attuale | Condiviso o specifico | Riutilizzabile cross-modulo | Deve usare custom_lists | Deve usare custom_list_items | Deve usare linked_activities | Serve binding elenco -> attività -> modale -> campo | Va lasciato hardcoded | Va migrato da hardcoded a DB | Va tenuto su tabella relazionale dedicata | Stato decisionale | Priorità | Rischio | Decisione operativa finale | Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Cassa | Globale | `NuovoPagamento` | Metodo | Metodo Pagamento | Select | Finanza | DB `payment_methods` | Corretto | Condiviso | Sì | No | No | No | No | No | No | Sì | OK | Bassa | Medio | Configurazione stabile via DB tabel | Fondamenti transazionali ricevute |
| Attività | Tutti | Modali Corsi/Ws | Giorno | Giorno Settimana | Select | Temporale | Costanti Frontend | Corretto | Condiviso | Sì | No | No | No | No | Sì | No | No | OK | Bassa | Basso | Hardcoded Enum UI su `LUN..DOM` | Legato intrinsecamente ad array posizionali JS |
| Attività | Tutti | Modali Corsi/Ws | Orari | Inizio / Fine | Select | Temporale | Costanti Frontend | Corretto | Condiviso | Sì | No | No | No | No | Sì | No | No | Da normalizzare | Bassa | Basso | Convertire in Componente Nativo Native TimePicker | Alleggerisce generazione loop `["08:00", ...]` |
| Attività | `/calendario-attivita` | `CourseDialog` | Ripetizione | Tipo Ricorrenza | Select | Temporale | Costanti Frontend | Corretto | Condiviso | Sì | No | No | No | No | Sì | No | No | OK | Bassa | Basso | Mantenere costante `[weekly, monthly...]` | Logiche di switch interne per motore backend |

## 4. CAMPI MOCKUP, HARDCODED CRITICI E DA RIFARE (Urgenti)
| Area | Pagina | Modale | Campo UI | Label visibile | Dominio attività | Tipo campo | Sorgente attuale | Binding attuale | Condiviso o specifico | Riutilizzabile cross-modulo | Deve usare custom_lists | Deve usare custom_list_items | Deve usare linked_activities | Serve binding elenco -> attività -> modale -> campo | Va lasciato hardcoded | Va migrato da hardcoded a DB | Va tenuto su tabella relazionale dedicata | Stato decisionale | Priorità | Rischio | Decisione operativa finale | Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Anagrafica | `/maschera-input` | Form | Comune/Prov. | Comune Residenza | MultiSelect | Anagrafica | Hardcoded Mock | Errato (Mock) | Specifico | No | No | No | No | No | No | Sì (API) | No | Da rifare | Media | Basso | Sostituire con SDK ISTAT o DB statico Comuni IT | Ora array dummy vuoto/free text pre-config |
| Iscrizioni | `/maschera-input` | Form | Iscrizione | Iscrivi Corsi | MultiSelect | Attività | Fetch Multip. | Ambiguo | Specifico | No | No | No | No | No | No | Sì (STI) | Sì (`_global_enro.`) | Da rifare | Massima | Alto | Refactoring STI verso payload unico `/api/activities` | Blocca la fluidità, spara n-fetch ai Silos |
| Cassa | Globale | `NuovoPagamento` | Dettaglio | Dettagli Iscr. (Mock) | MultiSelect | Trasversale | Hardcoded Mock | Errato (Mock) | Condiviso | No | Sì | Sì | No | No | No | Sì | No | Da rifare | Alta | Medio | Generare `custom_lists` ("Mese", "Trimestre"...) e associarla | Dati "Mensilità", "Annuale" non bindati a backend reale |
| Planning | `/planning` | `StrategicEvent` | Tipologia | Tipologia Evento | Select | Extra | API Reale | Corretto | Specifico | No | No | No | No | No | No | Sì | Sì | OK | Bassa | Basso | - | Modulo strategico E2E Funzionante |
| Tessere | Multiple | Tessere/Input | Ente | Tessera Ente | Input | Associaz. | Libero/Hardc. | Sporco | Condiviso | No | Sì | Sì | No | No | No | Sì | No | Da normalizzare | Bassa | Basso | Sostituire Input con `Select` guidato da `custom_lists` | Spesso si digita free text `Libertas`, genera mis-match |

<br/>

# BLOCCO 5: PIANO ESECUTIVO DI NORMALIZZAZIONE ELENCHI (EXECUTION PLAN)

## 1. QUICK WIN SICURI (Basso Rischio - Eseguibili Subito - No Impatto DB Core)
| ID | Campo / elenco | Area | Pagina | Modale | Dominio attività | Stato architetturale | Problema attuale | Sorgente attuale | Modello target | Usa `custom_lists` | Usa `items` | Usa `linked_act` | Serve binding completo | Tabella relaz. | Hardcoded per ora | Priorità | Rischio | Dipendenze | File da toccare | Decisione operativa | Ordine esecuz. | Note |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| QW-1 | Livello (Corso) | Attività | `/*` | Unified/Course | Attività | Stabile | Standardizzazione completata | `custom_lists` (`livello`) | Dizionario unificato | Sì | Sì | No | Sì | No | No | Alta | Basso | Nessuna | UI Modali | Distinzione netta tra list 'livello' (tecnico) e 'livello_crm' (marketing) con etichette esatte | Eseguito | Assicura che i modali usino `livello` e non peschino dal CRM |
| QW-2 | Stato | Attività | `/*` | Unified/Course | Attività | Stabile | Array text DB, UI parziale | `activity_statuses` | Relazionale multi-select | No | No | No | No | Sì | No | Media | Basso | Nessuna | `activity-management`, schema | Standardizzare UI badge su tutte le tabelle | 2 | Mantieni DB dedicato esistente |
| QW-3 | Tipo partecipante | Anagrafica | `/maschera-input` | Form | Trasversale | Stabile | UI non usa endpoint corretto | `client_categories` API | Selezione dinamica | No | No | No | No | Sì | No | Alta | Basso | Endpoint esistente | `maschera-input-generale.tsx` | Sostituire select statica con fallback a API `/api/client-categories` | 3 | Struttura DB già presente |
| QW-4 | Comune / Provincia | Anagrafica | `/maschera-input` | Form | Trasversale | Mockup | MultiSelect finto vuoto | Hardcoded Mock | JSON / SDK Istat | No | No | No | No | No | Sì (JS) | Bassa | Basso | Nessuna | `maschera-input-generale.tsx` | Ripulire Mockup e mettere input text semplice o JSON locale | 4 | Evitare sovraccarico DB per dati statici ISTAT |

## 2. INTERVENTI MEDI (Medio Rischio - Workflow UI e Relazionali)
| ID | Campo / elenco | Area | Pagina | Modale | Dominio attività | Stato architetturale | Problema attuale | Sorgente attuale | Modello target | Usa `custom_lists` | Usa `items` | Usa `linked_act` | Serve binding completo | Tabella relaz. | Hardcoded per ora | Priorità | Rischio | Dipendenze | File da toccare | Decisione operativa | Ordine esecuz. | Note |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| MED-1 | Genere | Attività | `/*` | Unified/Course | Attività | Recente Refac | UI completata, ma vecchi corsi orfani | `custom_lists` | Consolidamento | Sì | Sì | Sì | Sì | No | No | Massima | Medio | Refactoring Elenchi completato | Nessuno (se base stabile) | Eseguire binding dei vecchi corsi ai nuovi ID lista (Data Pump) | 1 | Rivedere flussi storici |
| MED-2 | Categoria Attività | Attività | `/*` | Unified/Course | Attività | Stabile | Categorie non filtrate per Dominio | `categories` | Filtrate per contesto | No | No | No | No | Sì | No | Media | Medio | `categories` DB | `/api/categories`, Modali UI | Aggiungere parametro tipo dominio al fetch categorie | 2 | Standard FK |
| MED-3 | Tipologia Evento Planning| Planning | `/planning` | StrategicEvent | Extra | Stabile | DB Funzionante | `strategic_events` | DB Entità | No | No | No | No | Sì | No | Bassa | Basso | Nessuna | - | Creazione completata (Phase 24) | Eseguito | Componente UI e Backend perfettamente allineati |

## 3. INTERVENTI AD ALTO RISCHIO DA CONGELARE (STOP & GO - Non toccare)
| ID | Campo / elenco | Area | Pagina | Modale | Dominio attività | Stato architetturale | Problema attuale | Sorgente attuale | Modello target | Usa `custom_lists` | Usa `items` | Usa `linked_act` | Serve binding completo | Tabella relaz. | Hardcoded per ora | Priorità | Rischio | Dipendenze | File da toccare | Decisione operativa | Ordine esecuz. | Note |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| HR-1 | Metodo Pagamento | Cassa | Globale | NuovoPagamento | Finanza | Stabile | Core system delicato | `payment_methods` DB | Nessuna Modifica | No | No | No | No | Sì | No | Alta | Critico | Pagamenti Core | Congelato | **STOP & GO**. Non toccare il perimetro di `payments`. | - | Transazionale |
| HR-2 | Dettaglio Iscrizione | Cassa | Globale | NuovoPagamento | Trasversale | Mockup | MultiSelect Dummy (Mese 1, Mese 2) | Hardcoded Mock | Logica Fatturazione Reale| Sì / No | - | - | - | - | Sì | Alta | Alto | Motore API fatturazione | Congelato | **STOP & GO**. Lasciare Mockup finché non si sviluppano le rate. | - | Potrebbe rompere logiche JSON ricevute |
| HR-3 | Tipologia Tessere / Comp. | Tessere | `/tessere` | MembershipForm | Tessere | Stabile | Costanti cablate nel Multiplexer | Hardcoded Frontend | Hardcoded Frontend | No | No | No | No | No | Sì | Bassa | Medio | Backend Multiplexer | Congelato | **STOP & GO**. Non alterare Enum [Rinnovo, Nuovo]. | - | Pilotato dal BE |


<!-- --- FINE SORGENTE: attuale/10_GAE_TABELLA_MASTER_MODALI.md --- -->



<!-- --- INIZIO SORGENTE: attuale/17_GAE_Calendario_Multi_Stagione.md --- -->

# Specifica Funzionale: Calendario Multi-Stagione, Duplicazione Corsi e Gestione Conflitti (Fase 27)

**[SPRINT CHIUSO CON SUCCESSO E CONSEGNATO]**: Fase 27 completata. Le logiche di Calendario/Multi-Stagione sono pienamente varate. L'endpoint di duplicazione controllata (no enrollments) lavora dinamicamente via UI (Checkbox batch). La **Programmazione Date Strategiche** (chiusure/ferie) è integrata, attingendo la logica dei template storici, risultando prioritaria e visibile sia nel Planning stagionale sia nel Calendario operativo.

**✅ [RISOLTI E COMPLETATI: AG-043 -> AG-049 FEEDBACK E ALLINEAMENTO VISIVO MESE APRILE]**:  
Tutti i requirements di layout UI post-sprint sono stati bonificati:
- **Labeling Default Season (Fatto)**: Fissata la dicitura in UI "25-26" di default.
- **Auto-Switch Label "26-27" (Fatto)**: Switch testuale attivo.
- **UI Card Height & Dinamismo Righe (Fatto)**: Rimosso blocco in `planning.tsx` (max-h-80px) ed eliso l'attributo `truncate`. I nomi testo esplodono elasticamente su multi-riga. Stretch naturale della UI settimanale e mensile.
- **Zero-Overlap Assoluto (Fatto)**: Confermata logica Side-by-Side senza impilamento infido.
- **Indicatore "OGGI" Dinamico (Fatto)**: Scroll highlight e focus coerente.
- **Navigazione Combinata (Scroll/Select) (Fatto)**: Calendarietto mensile sincronizzato al picker settimanale.
- **Pedanteria Tabella Master (Fatto)**: Aggiunta la barra Footer fissa interattiva ("Adulti", "Bambini") nel calcolo GSheet-like delle esclusioni ("PROVA", "NO CORSI"). Forzatura a 365 days / 52 settimane confermata.

~~**[BUG CRITICO RILEVATO]**: Quando si chiude il modale di inserimento o modifica, le schede spariscono visivamente dal calendario e serve un refresh manuale della pagina per ripristinare il rendering.~~  
**[AG-027 CHIUSURA BUG]**: Bug "Sparizione Schede Modale" risolto con successo in UI e state. Il reset forzato della resourceType a `"all"` unito all'esecuzione di `queryClient.invalidateQueries` all'interno dell'`onClose` del modale assicura un re-fetch totale e la persistenza completa della griglia.

## 1. Calendario Multi-Stagione
- **Obiettivo:** Estendere la visualizzazione del calendario per supportare contemporaneamente più stagioni.
- **Logica Architetturale Base (Le Due Stagioni):**
  - Il sistema deve **sempre** ragionare in ottica duale: "Stagione Attuale" (Es. 25-26) e "Stagione Futura" (Es. 26-27).
  - Ogni corso o evento deve essere fortemente vincolato all'anno sportivo o a un range di date circoscritto.
  - Il frontend dovrà includere uno switch globale rapido "Stagione Corrente / Prossima Stagione" nell'header per commutare contestualmente tutti gli endpoint.
  - Non mescolare visivamente le iscrizioni impedendo un data-bleed tra anni consecutivi.

## 2. Duplicazione Intelligente dei Corsi (Season-to-Season)
- **Obiettivo:** Permettere alla segreteria di fare un "porting" massivo o selettivo dei corsi dalla stagione attiva di default (es. 25-26, **visibile e flaggata nel calendario**) alla stagione successiva (es. 26-27).
- **Logica Temporale Tipica:**
  - La duplicazione avviene fisiologicamente **a metà dell'anno sportivo** (Es. a Febbraio 2027, la segreteria clona l'impalcatura per preparare la stagione 27-28 in prevendita).
- **Logica Architetturale e Limitazioni Copia:**
  - Endpoint dedicato: `POST /api/activities/duplicate-season`.
  - La duplicazione creerà **nuovi record** nel DB ma con una policy di copia molto stringente.
  - Verranno copiati ESCLUSIVAMENTE questi 5 metadati: **Genere (Nome Corso), Insegnante, Giorno, Orario, Studio**. *Attenzione operativa (AG-053):* È imperativo che l'engine garantisca la trascrizione **corretta** degli Orari e ricalcoli senza divergenze i campi **Data Inizio / Data Fine**, agganciandoli temporalmente all'alveo della Nuova Stagione creata.
  - **NON** verranno copiati gli iscritti. Lo stack partirà da zero, limitando il bleed.
  - L'interfaccia UI esporrà una lista con **checkbox a multi-selezione funzionante**, controllata da un macro-pulsante **"Duplica selezionati"**, per eseguire in un solo colpo il porting massivo dei corsi verso l'anno sportivo imminente.

## 3. Layout Dinamico "Sliding" Settimanale ed Elasticità Oraria
- **Obiettivo:** Creare un'infrastruttura visiva fluida e reattiva alla componente temporale continua.
- **Logica Architetturale:**
  - Sostituire la griglia rigida mensile/giornaliera pura con un carosello temporale (sliding).
  - Integrazione con l'algoritmo già sviluppato nell'Engine STI (che sfrutta `ResizeObserver` per l'altezza dinamica): le ore scorreranno fluidamente sull'asse orizzontale o verticale calcolate tramite `Temporal` o date-fns.
  - **Dinamismo Orario Globale:** L'array di fasce orarie visualizzate dal calendario non è più costituito da 17 slot hardcoded, ma scala ritagliandosi elasticamente sui limiti fisici (Apertura e Chiusura) stabiliti nel database in `system_configs` dal Pannello di Amministrazione. Le dimensioni e spaziature in pixel (`PX_PER_MIN`) si auto-adeguano, assicurando che l'UX reagisca di conseguenza.

## 4. Supporto Visivo ai Conflitti: Sale e Affitti
- **Obiettivo:** Avvisare immediatamente la segreteria in caso di collisione di risorse fisiche (stessa sala, stessa ora).
- **Logica Architetturale:**
  - Aggiornamento degli algoritmi `calendar.tsx` (Fase 18 - "Side-by-Side"): qualora l'engine rilevi un overlap esatto sulla **stessa Sala** o con un evento proveniente dallo stack **Affitti** (`rentals`), la griglia applicherà un flag `conflict: true`.
  - Livello UI: Renderizzare la scheda del corso con un bordo tratteggiato rosso fosforescente o un'icona "Warning" chiara (Badge Destructive). Il tooltip specificherà: *"Conflitto rilevato in Sala X con Affitto/Corso Y"*.
  - Impedimento al salvataggio (Hard Constraint) solo se configurato come stringente, o semplice alert visivo per permettere overbooking volontario.

## 5. Programmazione Date Strategiche e "Master Table"
- **Obiettivo:** Gestire e pianificare preventivamente tutte le date strategiche della stagione sportiva (chiusure, ferie, ponti, eventi speciali, promozioni) replicando digitalmente il format di pianificazione legacy della dirigenza.
- **Logica Architetturale e Foglio Dedicato (Master Table):**
  - **Sviluppo Area Dedicata:** Deve essere sviluppato uno spazio/tabella isolata all'interno del gestionale (o tab adiacente).
  - **Requisiti di Layout Copia-conforme:** Questa tabella ad inserimento rapido deve replicare fedelmente la matrice architettonica mostrata nei 3 file PDF/Excel storici ("programmazione date" situati nella cartella "file personali"). Tratti salienti obbligatori:
    - Indicizzazioni sull'asse verticale (Settimane Numerate).
    - Colonne da Lunedì a Domenica con tracciamento date esatte.
    - Metriche calcolate o inseribili: Totali lezioni adulti e bambini.
    - Color coding massivo per blocchi di attività o chiusure.
    - Spazio esteso per note settimanali.
  - **Programmazione Veloce:** Da questa tabella, la segreteria tecnica deve poter calendarizzare strategicamente le eccezioni con estrema veloctià e precisione.
  - **Automazione Sistemica:** L'operatore programma le date nella Master Table. Il set generato andrà ad intersecarsi su tutta la suite del gestionale provocando questi trigger autogenerati:
    1. Sul **Planning** stagionale: visualizzazione e disabilitazione di ampi periodi.
    2. Sul **Calendario** settimanale: evidenziazione (es. colonne grigie o rosse d'alert).
    3. Sul **Modale Eventi**: la form rileverà le chiusure impedendo (o wrappando) inserimenti fallaci.

## 6. Business Logic: Ciclo Vitale Multi-Stagione (Regola del 1° Agosto)
- **Obiettivo:** Gestire la transizione ciclica automatica degli anni sportivi senza intervento manuale o disallineamenti db.
- **Logica Architetturale (The Lifetime Rule):**
  1. **Creazione Pre-Stagione (Trigger di Febbraio):** A partire da febbraio di ogni anno, il sistema genera in automatico la `Stagione Successiva` (es. a Febbraio 2026 crea e imposta nel DB la "26-27" come inattiva/programmata ma selezionabile). Questo permette in anticipo la pianificazione strategica (ferie, chiusure, pianificazione corsi).
  2. **Promozione (Scatto del 1° Agosto):** Alla scoccare del 1° agosto di ogni anno solare, la `Stagione Successiva` deve prendere il sopravvento. Diventa ufficialmente la `Stagione Attuale` tramite l'aggiornamento automatico del flag booleano nel DB (`active = true` per la nuova, `false` per la precedente).
  3. **Rigenerazione Continua (1° Agosto):** Contestualmente alla promozione della stagione, il sistema alloca la _nuova_ `Stagione Successiva` per l'anno seguente, permettendo al framework di ruotare perennemente (Lifecycle Loop).

## 7. Storicità Immutabile dei Corsi (Non-Deletion Policy)
- **Obiettivo:** Preservare la memoria storica. I corsi passati non devono MAI essere svuotati o massivamente eliminati dal database alla chiusura della stagione.
- **Logica Architetturale:** 
  - La piattaforma archivia ogni entità corso indissolubilmente legata al proprio `seasonId`.
  - La sovrascrittura o soppressione massiva a fine anno è **severamente vietata** via codice.
  - La funzione di "Duplicazione Stagione" effettua esclusivamente una _clonazione_ dei metadati verso la nuova stagione, associandoli al nuovo `seasonId` e azzerando le partecipazioni (iscritti). L'originale resta intoccabile.
  - Sarà concessa solo l'eliminazione singola manuale di una scheda corso (se inserita per errore), ma il defaticamento annuale avviene lasciando sedimentare i dati come archivio storico in sola consultazione.

## 8. Navigazione Temporale Sincronizzata (Scorrimento Infinito)
- **Obiettivo:** Garantire un'esperienza utente fluida che replichi il comportamento del Planning all'interno del Calendario Operativo.
- **Logica Architetturale:**
  - Il sistema monitora in tempo reale la `viewDate` (data attualmente visualizzata) quando l'utente utilizza le frecce di scorrimento settimanale (`<` e `>`).
  - Non appena la vista temporale sconfina oltre le date di inizio/fine della stagione selezionata nel Dropdown, il calendario esegue un _auto-switch_ della risorsa `seasonId`, agganciando la stagione coerente a quella data.
  - L'UI aggiornerà dinamicamente il nome nel selettore assegnando etichette specifiche come `(Stagione Precedente)` o `(Stagione Successiva)` a ridosso dell'anno, pre-caricando i relativi dati storicizzati del backend.

---

## 9. Dashboard Segreteria Operativa – Nuova Struttura
- **Obiettivo:** Elevare la pragmatica operativa della landing page predefinita interfacciata alla segreteria (Dashboard), estirpando widget passivi in favore di tool reattivi e di contabilità personale.
- **Specifiche Architetturali:**
  1. **Modulo "Entrate Mese":** Inserire highlight contabile per il tracciamento degli incassi, potenziato con la suddivisione esplicita per singolo operatore/membro della segreteria. Un report in tempo reale del venduto personale.
  2. **Sezione "Scadenze Operative":** Disintegrazione totale dell'attuale componente "Attività Recente". Il vuoto lasciato sarà ricolmato da un nuovo pannello di allerta scadenze e compiti operativi in esaurimento, permettendo al team di agire sulle criticità quotidiane.
  3. **Gerarchia Strutturale:** Il design dovrà dare priorità spaziale e visiva a questi due nuovi blocchi, schiacciando in secondo piano eventuali KPI secondari. L'operatore all'accesso (boot) deve poter analizzare istantaneamente le revenue ed evadere le scadenze rossastre.
  4. **Costrutto Cromatico/Stile:** Massimizzare l'uso degli Alert Badge (es. Rosso lucido per ritardi fatali o scadenze odierne, Giallo per task in pending). Il blocco incassi prediligerà invece spaziature clean e neutrali senza saturare l'UI.

---

## 10. Modale Nuovo Pagamento – Filtro Attività/Corso
- **Obiettivo:** Sanitizzare il flusso di inserimento nel Checkout (sezione "Dettaglio Quote e Servizi") impedendo la contaminazione visiva e logica tra categorie disciplinari incompatibili.
- **Specifiche di Modifica Modale:**
  1. **Filtro per Attività (Parent-Targeting):** Il blocco d'acquisizione opererà tramite gerarchia stretta. La prima select (Attività madre - es: Danza) piloterà nativamente le opzioni del select secondario.
  2. **Logica di Dipendenza (Child-Lock):** Il field "Genere/Corso" deve rimanere disabilitato (disabled) finché l'operatore non innesca un'Attività madre valida. Solo dopo tale evento il selettore si abiliterà mostrando *solamente* le discipline afferenti all'id-padre.
  3. **Pulizia Etichette (Sanitizzazione UI):** La UI della tendina "genere/corso" assicurerà la rimozione totale di artefatti visivi, label tecniche rotte o chiavi di sistema non tradotte o non pertinenti ai plain-text.
  4. **Validazione Integrale:** Il vincolo impedisce il submit di quote per associazioni miste fittizie (es. Attività "Sala Musicale" con Genere "Hip-Hop Junior"). Il middleware o la UI React bloccherà l'azione salvaguardando il ledger.

---

## 11. Stabilizzazione Calendario e Bugfix Emergenziali (Pre Go-Live)
Al fine di sbloccare l'operatività di base, sono stati consolidati e protetti in quest'area i seguenti interventi di bonifica UI:

- **11.1 Armonizzazione Filtri Calendario:** Ripristinare il cablaggio funzionale dei filtri a monte calendario. Categorico l'allineamento dei toggle/checkbox (nello specifico, filtro primario "Corsi" e categoria selettiva "Fitness") affinché manipolino reattivamente la griglia dati proiettando il result set conforme.
- **11.2 Edit Form Studi Logici:** Disattivare l'eventuale costrutto statico che blindava le locazioni denominate `Studi 23-24-25`. Tali sale dovranno rendersi inequivocabilmente *modificabili* dall'operatore.
- **11.3 Sanitizzazione Maschera Input:** Il trigger di init che lancia irrazionalmente "errori di default rossi" alla mera apertura del modale deve essere intercettato e neutralizzato. La validation map (Zod o React Hook Form) scatterà esclusivamente a validazione sfidata (onSubmit o onChange post-interazione) e mai al boot visivo neutro.

## 12. Consolidamento Interfaccia STI (Sessione Aprile)
- L'`activityType` viene passato in maniera type-safe dal calendario direttamente al modale anche in fase di edit, sostituendo logiche hardcoded e guidando dinamicamente la customizzazione del popup.
- Le card del calendario (e di listato) presentano ora Badge nativi e referenziali (`ALL`, `IND`, `WS`, `DOM`), calcolati in appoggio all'ecosistema polimorfo piuttosto che alla staticità legacy "CRS".
- La palette cromatica delle categorie pesca e renderizza nativamente i valori esatti estratti dalla colonna `custom_list_items.color`, amministrati attivamente da UI (`/elenchi` -> `SimpleListSection`).
- I colori delle card a calendario vantano un flusso logico rigoroso: il colore semantico/fisso tipico del parent STI (`ALL` = Blu, `IND` = Viola) riceve precedenza assoluta d'esposizione rispetto al colore generico della "Categoria", eliminando le sovrascritture visive (Fix B066).

<!-- --- FINE SORGENTE: attuale/17_GAE_Calendario_Multi_Stagione.md --- -->
