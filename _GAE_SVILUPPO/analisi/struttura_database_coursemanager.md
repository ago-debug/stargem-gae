# Architettura Completa del Database CourseManager (Stato Attuale)

Questo documento rappresenta la **mappa completa ed esaustiva** di tutte le sezioni attive del gestionale. Ricorda che recentemente il database ha subìto una massiccia **unificazione (Single Table Inheritance - STI)**: decine di tabelle separate (corsi, workshop, campus) sono state collassate in un unico ecosistema centrale molto più efficiente.

Usa questa guida integrale per estrapolare le logiche e capire esattamente **a chi o a cosa** agganciare le tue future sezioni.

---

## 1. Modulo Anagrafica e Utenti (Core Base)
Tutte le identità fisiche del sistema (allievi, genitori, staff) convergono in un'unica super-tabella.

| Tabella Logica | Ruolo e Funzione | Campi Chiave per Integrazioni |
| :--- | :--- | :--- |
| **`members`** | **Cuore dell'Anagrafica.** Ospita studenti, allievi, minorenni e gli **INSEGNANTI** (`participantType='INSEGNANTE'`). Da qui parte ogni iscrizione o pagamento. | `id`, `firstName`, `fiscalCode`, `isMinor`, `barcode` |
| **`member_relationships`** | Lega i minorenni ai propri genitori (madre, padre o tutore legale), utile per privacy e autorizzazioni firmate. | `member_id`, `related_member_id`, `relationship_type` |
| **`cli_cats`** | Categorie Clienti per classificare l'utenza (es. "Socio Sostenitore", "Allievo Base"). | `id`, `name`, `description` |
| **`users`** | Account di accesso al sistema per lo **Staff** e l'amministrazione, con gestione presenze e tracking. | `id`, `username`, `role_id`, `currentSessionStart` |
| **`user_roles`** | Dizionario dei ruoli e JSON con i permessi specifici dello staff. | `id`, `roleName`, `permissions` |

---

## 2. Modulo Organizzazione Didattica Universale (Motore Unificato STI)
Non esistono più tabelle separate per i Workshop o i Campus. Tutto è un "**Corso / Attività**", distinto solo da un'etichetta (`activityType`). Questo è fondamentale per aggiungere altre sezioni in futuro senza creare nuove tabelle pesanti.

| Tabella Logica | Ruolo e Funzione | Collegamento (FK) |
| :--- | :--- | :--- |
| **`categories` / `custom_lists`** | Le macro-categorie e i Generi (es. Danza, Fitness, Heels). | Gestito tramite `custom_list_items` |
| **`courses`** | Il **Singolo Evento / Classe**. Che sia un corso invernale, un workshop di 2 ore, o una settimana di campus, il dato vive qui. Definisce Insegnante, Luogo, Livello e Orari. | Punta a `members` (Istruttore) e `studios` (Aula) |
| **`enrollments`** | **Iscrizione Fisica.** Dichiara chi (`member`) partecipa a cosa (`course`). Indica stato (Attivo/Ritirato) e contiene la traccia della frequenza. | `member_id`, `course_id` |
| **`studios`** | Aule mediche o sale fisiche. Usate dai `courses` o dalle prenotazioni esterne (es. noleggio). | `id`, `name`, `capacity` |
| **`seasons`** | Anni sportivi (es. "Stagione 2025/2026"). Tutto è vincolato alla stagione corrente per il corretto partizionamento dei dati. | `id`, `name`, `startDate` |

---

## 3. Modulo Dizionari, Liste e Configurazione Sistema
Qualsiasi nuova funzionalità che necessiti di "Menu a tendina" configurabili dalla segreteria deve usare questo modulo per non "hardcodare" valori.

| Tabella Logica | Ruolo e Funzione | Note per Sviluppi |
| :--- | :--- | :--- |
| **`system_configs`** | Impostazioni globali chiave-valore del gestionale (es. Messaggi Insegna, Limiti d'età base). | Chiave e Valore Testuale. |
| **`custom_lists`** | Contenitore di vocabolari (es. "Livelli Difficoltà", "Metodi Pagamento"). | `system_code` per identificazione stabile nel codice. |
| **`custom_list_items`** | Le singole voci dei vocabolari (es. "Principianti", "Intermedi"). Supportano tag extra JSON e colori badge. | Aggancia questi `id` ovunque ti serva una tendina. |
| **`user_activity_logs`** | Log di Audit. Registra ogni modifica o eliminazione eseguita dallo staff. | Nessun record viene cancellato senza lasciare traccia qui. |

---

## 4. Modulo Tesseramenti, Certificati e Ingressi (Check-In)
Perfetto per gestire apparati fisici (tornelli, timbratrici) e la burocrazia obbligatoria (liberatorie, idoneità sportiva).

| Tabella Logica | Ruolo e Funzione | Note per Sviluppi |
| :--- | :--- | :--- |
| **`memberships`** | Tessere associative / Assicurazioni sportive annuali. Sbloccano o bloccano la possibilità di prenotare/pagare le attività. | Richiedono stagione (`season_id`) e membro (`member_id`). |
| **`access_logs`** | Registro fisico dei passaggi. Traccia le entrate e uscite (tornello automatico o check-in front-desk). | Si collega a `members.barcode`. |
| **`medical_certificates`** | Archivio idoneità alla pratica ed erogazione sportiva, con le date di scadenza. | Agisce come semaforo rosso per le prenotazioni manuali/app. |

---

## 5. Modulo Finanziario, Cassa e Contabilità (Cruciale)
Tutto ciò che muove denaro (inclusi carrelli multi-soggetto) confluisce verso la tabella `payments`. Qualunque modulo aggiuntivo tu crei (es. merchandising o vendita snack), DEVE salvare l'incasso qui allegando la Foreign Key appropriata.

| Tabella Logica | Ruolo e Funzione | Regola di Ingaggio |
| :--- | :--- | :--- |
| **`payments`** | **L'Hub di Interscambio.** Il Libro Mastro delle ricevute. Contiene riferimenti (Foreign Keys) verso chi paga, per conto di chi (`referenceKey`) e l'origine dell'acquisto (es. `enrollment_id`, `membership_id`). | Qualsiasi euro in entrata o uscita DEVE avere un record qui. |
| **`quotes` / `course_quotes`** | Quote libere svincolate, listini e debiti in corso che un membro matura (lo scadenziario rate). | `member_id`, `amount`, `status` |
| **`payment_methods`** | Voci come POS, Contanti, Bonifico (le voci provengono attivamente da `custom_lists`). | Integrato nel POS Cassa. |
| **`cost_centers` & `journal_entries`**| Centri di Costo e Prima Nota; schema contabile strutturato per reportistiche avanzate. | Usato dal commercialista per scarico IVA/fatturato lordo. |
| **`management_controls` (Futuro)** | Modulo dedicato al **Controllo di Gestione**: proiezioni, marginalità, budget preventivo/consuntivo, scostamenti e redditività per centro di costo. | Permette alla Direzione un'analisi analitica profonda dei flussi di cassa. |

---

## 6. Modulo Promo, Sconti, Carnet e Prezzi Dinamici 
Gestisce l'engine economico secondario: sconti personalizzati aziendali, carnet prepagati e calcolo dinamico delle tariffe (es. maggiorazioni domiciliari).

| Tabella Logica | Ruolo e Funzione | Campi Chiave |
| :--- | :--- | :--- |
| **`company_agreements`** | Convenzioni ed enti (Bocconi, Inter) con regole fiscali percentuali per sconti su corsi o merch. | `id`, `companyName`, `discountPercent` |
| **`member_discounts`** & **`promo_rules`** | Sconti o regole flat/percentuali applicati d'ufficio ad un utente o globalmente in un periodo (es. Black Friday). | `member_id`, `discount_type`, `approved_by` |
| **`staff_rates`** | Tariffe forfettarie e speciali per docenti e staff interno della scuola. | `role_title`, `amount` |
| **`carnet_wallets`** | Pacchetti ingresso a scalare (es. 10 lezioni), con tracking presenze residue (`usedUnits`, `totalUnits`), eventuali rimborsi/omaggi extra (`bonus_units`). | `member_id`, `wallet_type_id`, `totalUnits` |
| **`pricing_rules` / `price_matrix`** | Engine di maggiorazioni/sconti legati alle dimensioni del gruppo (singolo, coppia, 3+) o distanze chilometriche per sessioni private. | Base Truth per il simulatore preventivi. |

---

## 7. Modulo Operativo Interno, Comunicazioni HR e Planning
Tabelle "non vitali" a livello fiscale, ma essenziali per la fluidità del team interno. Un ottimo posto dove inserire moduli Todo o CRM leggeri senza impattare pesantemente la cassa.

| Tabella Logica | Ruolo e Funzione | Uso Attuale |
| :--- | :--- | :--- |
| **`team_comments`** | Conversazioni a "Thread" simil-chat annidate usate dallo staff per passarsi consegne. | Supporta *nesting* (campi `parentId`). |
| **`team_notes`** | Bacheca testuale o post-it interni, fissabili in alto (pinned). | Gestione del passaggio di consegne "Statico". |
| **`todos`** | Liste condivise delle cose da fare (Task). | Micro-task manager. |
| **`notifications`** | Avvisi su campanellina per l'interfaccia utente dello staff (es. "La visita medica del Sig. X è scaduta"). | Generati da Job schedulati nel backend. |
| **`messages`** | Messaggistica diretta ("DM") peer-to-peer integrata per segretari/manager. | Chat privata interna. |

---

## Dove agganciare Nuove Funzionalità? (Sintesi per Integrazioni)

1. **Gestione Ingressi Fisici (Tornelli o Timbracartellini):**  
   Non occorre creare nuove tabelle se le regole sono semplici. Sfrutta **`access_logs`** per tracciare i passi (ingresso/uscita), verificando prima tramite API se il `barcode` estratto dalla tabella **`members`** ha idoneità attiva (`medical_certificates` valdo + `memberships` status attivo).

2. **Compilazioni Moduli (Es: Scheda Anamnesi/Privacy iPad in segreteria):**  
   Questa è l'unica "area vuota". Dovrai creare una tabella chiamata **`member_forms_submissions`** così strutturata:
   - `id` (PK)
   - `member_id` (FK verso la persona)
   - `form_type` (Es. 'privacy_25', 'anamnesi_base')
   - `payload_data` (Colonna JSON per salvare le checkbox spuntate, flessibile per modifiche future senza rifare il database)
   - `signed_at` (Timestamp della firma)

3. **Integrazione "Altre Sezioni" a Pagamento (Es. Vendita Merchandising o Buvette):**
   Usa un modulo generico nel frontend ma, alla fine dell'inserimento, inoltra sempre il POST alla rotta `/api/payments`. Specifica che stai pagando un `type: "other"` e scrivi nei `notes` l'oggetto. Tutto finirà immacolato nel libro mastro dell'esportazione contabile.

---

## 8. La Suite StarGem (Mappatura Login vs Database)
Quando apri la **pagina di Login** del gestionale, troverai un elenco visivo dei moduli che compongono l'eccellenza della suite ("Questo gestionale contiene..."). Ecco come ogni nome commerciale o "dicitura" front-end è agganciato sotto il cofano alle tabelle reali viste sopra:

| Dicitura Login (Suite) | Descrizione a Schermo | A quali Tabelle DB è agganciato? |
| :--- | :--- | :--- |
| **`GemTeam`** | *Team & HR* | Si appoggia a **`users`** e **`user_roles`** per gli accessi fisici (tracking delle sessioni di lavoro) e in aggiunta a **`staff_rates`** (Modulo 6) per le paghe docenti. |
| **`Gemory`** | *Project Manager* | Tutte le tabelle di comunicazione p2p: **`todos`** (Task), **`team_notes`** (Post-it in bacheca), **`team_comments`** (Chat a thread aziendale). Modulo 7. |
| **`Gemdario`** | *Calendario* | È l'interfaccia visuale (Motore STI). Interroga brutalmente la tabella centrale **`courses`** e i suoi **`enrollments`** per plottare cosa accade ora per ora (Modulo 2). |
| **`BookGem`** | *Aule & Booking* | Interroga **`studios`** (Le aule reali) per verificarne capienza/occupazione, leggendo sia eventi (`courses`) sia noleggi esterni (`studio_bookings`). |
| **`MedGem`** | *Studio Medico* | È alimentato in toto dalla tabella **`medical_certificates`** e dall'anagrafica **`members`**, inibendo iscrizioni se l'idoneità è scaduta (Modulo 4). |
| **`Clarissa`** | *CRM & Marketing* | Attualmente legge da **`members`** filtrando i tag per l'invio DEM. Predisposto in futuro per vere logiche di mailing (da estendere). |
| **`GemStaff`** | *Staff Manager* | Modulo in divenire per automatizzare marketing, amministrazione HR e conformità burocratica dell'Accademia. |
| **`TeoCopilot`** | *AI Aziendale* | Lavora senza schema o interrogando read-only. Genera query SQL o fornisce supporto dinamico all'interno delle videate (`knowledge` e AI chat). |

---

## 9. Il Potenziale Inespresso: Cosa Manca e Cosa Aggiungere (Roadmap Consigliata)

Attualmente il Database ha un "motore centrale" (Iscrizioni e Pagamenti) estremamente solido. Tuttavia, per sprigionare il 100% del potenziale di una piattaforma SaaS moderna, **mancano alcune architetture periferiche**. 
Ecco le 5 aree strategiche che ti consiglio di valutare e strutturare per completare "la rosa" del gestionale:

### 1. CRM e Automazioni Marketing (Evoluzione di "Clarissa")
Attualmente *Clarissa* legge i dati, ma non *agisce* in automatico. 
Oggi manca tutto il comparto del **Marketing Automation**.
- **Cosa aggiungere:** Tabelle come `marketing_campaigns`, `email_logs_history`, e `automation_rules`.
- **Il Potenziale:** Il sistema potrebbe inviare *in automatico* un'email 7 giorni prima della scadenza del certificato medico, un SMS di benvenuto al primo ingresso, o un'email di "Re-engagement" (es. "Ci manchi, ecco un 10% di sconto") per gli utenti che non fanno check-in da 60 giorni.

### 2. Modulistica e Firma Digitale Front-Desk (Kiosk Mode)
La segreteria stampa ancora carta? Manca la digitalizzazione dei consensi.
- **Cosa aggiungere:** La tabella `member_forms_submissions` (citata prima) e una UI in modalità "Kiosk" per iPad.
- **Il Potenziale:** Un nuovo iscritto arriva, la segreteria gli passa il tablet, lui compila la scheda di Anamnesi Sportiva, firma il GDPR col dito, e il PDF si salva direttamente nel database alla riga del suo `member_id`.

### 3. Gestione Scorte, Buvette e POS (Vendita Prodotti)
Sebbene i pagamenti possano gestire la causale "Altro", **manca l'inventario fisico**.
- **Cosa aggiungere:** Tabelle come `inventory_items` (Gatorade, Magliette, Acqua), `stock_movements` (Carico/Scarico).
- **Il Potenziale:** Un vero e proprio POS integrato per vendere al volo la bottiglietta d'acqua scalandola dal magazzino, magari permettendo di pagare scalando il credito da un "Borsellino Elettronico" prepagato del cliente.

### 4. GemStaff (Motore HR e Conformità Collaboratori)
Trasformerà l'attuale gestione manuale dei collaboratori e docenti in un **motore digitale integrato**.
- **Cosa aggiungere:** Tabelle come `staff_shifts` (Turni Segreteria / Pulizie), `payslips` (cedolini presenze), e `staff_contracts_compliance` (per la burocrazia sportiva).
- **Il Potenziale:** Non solo il calcolo della paga, ma un'automazione attiva per amministrazione, reclutamento marketing (HR) e controllo della conformità burocratica dell'Accademia (es. scadenze DURC e accordi di collaborazione).

### 5. L'Area Personale Cliente (Self-Service & Pagamenti Online)
Tutto il gestionale odierno è "Staff-Facing" (rivolto alla segreteria). 
- **Cosa aggiungere:** L'infrastruttura per i **Portali Clienti** e API per l'App Mobile.
- **Il Potenziale:** Se inviamo un link WhatsApp al cliente, lui entra nella sua mini-area, vede i pagamenti arretrati (le quote scadute) e può **pagare autonomamente con Carta di Credito (Stripe/PayPal)** da casa, auto-prenotandosi la singola lezione in base ai posti rimasti liberi nel `course`.

Questi sono i "pezzettini" mancanti. Una volta che avremo chiara la direzione fra queste 5 opzioni, potremo procedere a strutturare le tabelle e fare la magia!
