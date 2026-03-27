# Mappa Globale: Pagine UI vs Tabelle Database

Questo documento mappa criticamente ogni singola rotta / pagina dell'applicazione web alle esatte tabelle del database su cui va a scrivere (o da cui legge i dati fondamentali). 
È stata aggiunta un'indicazione in **giallo** per far capire *da quale Menu Laterale (Sidebar)* si accede fisicamente a quella schermata.

---

### ⚠️ Differenza Importante con il file "01_GAE_Database_Attuale.md"
Mentre questo documento (File 3) mappa il viaggio dei dati **"Dal click dell'utente nella Schermata React -> A quale Tabella finisco"**, il file `01_GAE_Database_Attuale.md` è il puro dizionario tecnico Backend (ERD).
* Usa **questo file (3)** per capire: *"Dov'è il codice React che gestisce i pagamenti?"* o *"Da dove leggo le presenze in UI?"*
* Usa **l'altro file (1)** per capire: *"Quali foreign keys devo unire (JOIN) su Drizzle per estrarre la tabella payments?"*

## La Logica dei 5 Moduli (73 Tabelle Fisiche)
Il gestionale poggia su un solido database relazionale (scritto tramite Drizzle ORM su database MySQL) che conta attualmente un totale di **73 Tabelle Fisiche**. 
Per evitare di interagire con un elenco dispersivo, piatto e di difficile manutenzione, l'architettura tecnica è stata logicamente segmentata in **5 Macro-Aree**. 

Questa astrazione strategica permette agli sviluppatori di ragionare per "compartimenti" quando si implementano nuove funzionalità o si standardizza l'interfaccia:
1. **Moduli Core (22 Tabelle separate):** Gestisce l'erogazione delle attività vere e proprie. Ingloba le 11 tabelle matrice clonate (es. `courses`, `workshops`) e le 11 rispettive gerarchie di categoria.
2. **Moduli Amministrativi e Finanziari (21 Tabelle corollarie):** Il portafoglio del sistema. Centralizza tutto ciò che sfocia in una transazione: i carrelli, la fatturazione, l'iscrizione logica e il Libro Mastro Contabile (`payments`).
3. **Gestione Anagrafica (7 Tabelle root):** I soggetti fisici. Include l'anagrafica cliente (`members`), le relazioni tutore-minorenne (`member_relationships`), gli istruttori logici e gli account della segreteria (`users`).
4. **Struttura e Utility (19 Tabelle di supporto):** Funzioni orizzontali ad uso del team. Prenotazione delle stanze fisiche (`studios`), TodoList, chat della portineria e i dizionari a tendina (`custom_lists`).
5. **Dashboard e Reportistica (4 Tabelle native + Interrogazione globale):** Il vero cervello analitico. Legge e aggrega i dati prodotti in tempo reale dalle restanti 69 tabelle per restituire i KPI.

---

## 1. Segreteria Operativa (Check-in Rapido)
*L'ordine di cosa serve a chi sta al Front-Desk.*
| Pagina Web | Rotta React | Menu Sidebar (UI) | Tabelle Database Target | Note |
|---|---|---|---|---|
| **Pannello Iscrizioni Rapide** | `/maschera-input` | 🟡 **Maschera Input** | `members`, `[x]_enrollments`, `payments`, `price_list_items` | Central Bank: Il vero concentratore del Carrello Unificato multi-persona. Ex home-page. |
| **Iscritti/Anagrafica** | `/anagrafica-generale` | 🟡 **Anagrafica Generale** | Lettura: `members`, `memberships` | Elenco puro (Ex Anagrafica a Lista). |
| **Dashboard Membro Singolo** | `/membro/:id` | (Si apre da Anagrafica) | Lettura: `members`, `member_relationships`, `medical_certificates` | Hub di gestione scheda singola (es. genitore/figlio). Legge i Certificati Medici. |
| **Generazione Tessere** | `/generazione-tessere`| 🟡 **Tessere & Certificati** | Lettura: `members`, `memberships` | Creazione stampe/PDF. Applica fallback ibrido tra il nodo *activeMembership* reale e i campi ombra obsoleti dell'anagrafica per back-compatibility. |
| **Controllo Ingressi** | `/accessi` | 🟡 **Controllo Accessi** | Lettura/Scrittura gate passaggi tornello/tablet. |

---

## 2. Amministrazione & Cassa
*Posizionata in area ad altissima visibilità per chi opera il check-in e incassa.*
> **Nota UI Pagamenti:** Il modulo "Nuovo Pagamento" non è più bindato alle sole 12 tabelle/DB legacy didattici. La Select "Attività" espone dinamicamente le **14 voci dell'`ACTIVITY_REGISTRY`**, permettendo vendite custom ("Merchandising" o "Eventi Esterni") scrivendo genericamente in `payments` bypassando i silos classici.
| Pagina Web | Rotta React | Menu Sidebar (UI) | Tabelle Database Target | Note |
|---|---|---|---|---|
| **Nuovo Pagamento** | `/pagamenti` | 🟡 **Lista Pagamenti** | `payments`, `payment_methods`, `pay_notes` | Scrive in `payments`, lega una FK al memberId. Storico Ricevute e cassa reale. |
| **Scheda Contabile** | `/scheda-contabile` | 🟡 **Scheda Contabile** | Lettura: `payments`, `price_list_items`, `members` | Sola LETTURA. Incrocia il dovuto col versato. Controllo posizioni debitorie. |
| **Iscrizioni e Pagamenti** | `/iscrizioni-pagamenti` | 🟡 (Pulsante interno) | Lettura `members`, `enrollments` | Interfaccia d'appoggio per logistica interna. |
| **Dashboard Statistiche** | `/` (Home) e `/dashboard` | 🟡 **Dashboard & Statistiche** | Aggregazione Dati | Vera pagina di approdo all'apertura del gestionale. Aggregazione KPI iscritti e cassa. |
| **Report Avanzato** | `/report` | 🟡 **(Tab interno Reportistica)** | `custom_reports` | SQL Custom in lettura su richiesta e salvataggio query. |

---

## 3. Attività e Didattica
*Le Viste restano intatte (sui rispettivi Silos Tabellari), ma raggruppate per separare l'erogazione dalla pianificazione strategica.*
| Pagina Web | Rotta React | Menu Sidebar (UI) | Tabelle Database Target | Note |
|---|---|---|---|---|
| **Area Corsi** | `/attivita` | 🟡 **Attività** | Vari silos db (courses, workshop, ecc.) | Gestione erogabile: Anagrafica Corsi e Listini base. |
| **Calendario Corsi (Vista Tattica)** | `/calendario-attivita` | 🟡 **Calendario Attività** | Lettura combinata | **Mappa a Slot (Day-by-Day).** Operativa oraria strutturata a 5 righe (Orario, Titolo, Istruttori, Stato, Codice). Menu Nuovo Inserimento limitato a: Corsi, Workshop, Prove, Lezioni, Domeniche, Allenamenti, Affitti, Campus. |
| **Planning di Regia** | `/planning` | 🟡 **Planning** | Lettura combinata | **Mappa Plurigiornaliera (Stagionale).** Sintetica annuale (Set-Ago). Evidenzia Oggi e Mese Corrente. Include aggregati Corsi(N); e in blocchi estesi: Workshop, Domenica, Campus, Saggi, Vacanze, Esterni. |
| **Dashboard Iscrizioni** | `/iscritti_per_attivita` | 🟡 **Iscritti per Attività** | Lettura `enrollments` + joins | Vista appelli testuale/listare (Monitor visuale lista iscritti). |
| **Lista Sale e Patrimonio** | `/studios` | 🟡 **Studios/Sale** | `studios` | Scrive la sala (Capienza, Orari Base). |
| **Gestione Esterni (Spazi e Servizi)**| `/prenotazioni-sale`| 🟡 **Prenotazione Sale / Esterni** | `studio_bookings`, `booking_services` | **Debito Tecnico Temporaneo:** Area attualmente molto confusa che incrocia Booking per Affitti esterni di Sale, e tab random di "Servizi Prenotabili" rimossi transitoriamente dal menu Sidebar (rotta `/booking-services` silente finché non unificata in SaaS V2). |

---

## 4. Risorse Umane & Team
*Materiale orizzontale non destinato al cliente ma allo staff o all'admin framework.*  
| Pagina Web | Rotta React | Menu Sidebar (UI) | Tabelle Database Target | Note |
|---|---|---|---|---|
| **Insegnanti** | `/insegnanti` | 🟡 **Staff / Insegnanti** | `members` (STI), `instr_rates` | Anagrafica Docenti e listino compensi. (Ruolo flessibile: un tesserato può anche esssere Staff in contemporanea). |
| **Chat e Task Condivisi** | `/todo-list` | 🟡 **Comunicazioni Team** | `todos`, `team_comments`, `notes`, `messages` | Lavagna interna operativa (Fusi i vecchi sottomenu Todo, Log e Post-It in un'unica dashboard di raccordo team per snellire). |
| **Manuali e Linee Guida**| `/knowledge-base`| 🟡 **Knowledge Base** | Tabella wiki | Manuali d'uso / Wiki per operatori nuovi al desk. |
| **Importazione Dati** | `/importa` | 🟡 **Importa CSV** | Scrittura massiva + `import_configs` | Importazione di massa di DB legacy e mapping CSV. |
| **Utenti System / Permessi** | `/utenti-permessi` | 🟡 **Utenti e Permessi** | `users`, `user_roles` | Account per accesso al Gestionale via login. |
| **Admin Panel Global** | `/admin` | 🟡 **Pannello Admin Global** | `system_configs`, `knowledge`, `user_activity_logs` | Settaggi globali, tooltips base, audit del gestionale e svuotamento/Reset della Stagione Logica (`seasons`). |
| **AI Layer & Assistant** | `/copilot` | 🟡 **StarGem Copilot** | `N/D` | Modulo di interazione AI (posizionato sotto il blocco Admin). |

---

## 5. Configurazioni Core
*Tariffe e Strumenti di Business Tecnici per il management.*
| Pagina Web | Rotta React | Menu Sidebar (UI) | Tabelle Database Target | Note |
|---|---|---|---|---|
| **Gestione Listini Rate** | `/listini` | 🟡 **Listini e Quote** | `price_lists`, `price_list_items`, `quotes` | Configuratore abbonamenti economico SaaS, sia rateali che slegati (Indipendenti). |
| **Categorie Anagrafiche** | `/categoria-partecipante` | 🟡 **Categorie Attività**| `cli_cats` | Tab UI per categorie clienti. Messo dentro un mega-menu "Categorie". |
| **Categorie Attività Multi**| `/categorie-*` | 🟡 **(Dentro Categorie Attività)** | Tutte le `*_cats`, `booking_service_categories`, `rental_categories`, `merchandising_categories` | Gestisce gli alberi divisori didattici e fisici (Corsi, Workshop, Campus, Domeniche, Affitti Sale, Merchandising...). |
| **Elenchi Dropdown Custom**| `/elenchi` | 🟢 **(Cross-Modale Centrale)** | `custom_lists`, `custom_list_items` | Controlla menù a tendina custom via DB. Supporta Inserimento Rapido (`useQuickAdd`) dai modali senza reload. Sostituisce i fallback espliciti (ex. Livelli CRM e Marketing). |
| **Dizionari Promo**| `/promo-sconti` | 🟡 **Servizi e Sconti** | Ticket/Coupon | Database codici sconto. |

---

### Centralizzazione UI/Orari e Debito Tecnico
La tabella sopra mostra chiaramente la vastità orizzontale del gestionale: decine di pagine interrogano e scrivono in tabelle SQL identiche strutturalmente. Le differenze visive o asimmetrie nel salvataggio dei **campi Orario** (giorno, HH:MM inizio, HH:MM fine) o nella **scelta dei moduli pagamento**, se presenti, sono anomalie unicamente imputabili ai **componenti Frontend React** ("le tendine della web app") non unificati nel tempo. 

Il backend SQL aspetta standard rigidi. Pertanto, l'implementazione visiva deve convergere verso "Micro Form" (o Componenti) Centralizzati Singoli da importare identici all'interno di ognuna delle pagine elencate, scongiurando bug di salvataggio.

> **Aggiornamento Architetturale (Naming Consistency):** Il termine legacy "Nomi Corsi" è completamente deprecato in favore di **"Genere"** (System Code: `genere`). Tutte le 14 attività implementano la tendina dinamica `Combobox` agganciata a questa singola sorgente lista.
