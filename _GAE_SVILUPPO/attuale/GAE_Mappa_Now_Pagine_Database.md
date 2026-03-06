# Mappa Globale: Pagine UI vs Tabelle Database

Questo documento mappa criticamente ogni singola rotta / pagina dell'applicazione web alle esatte tabelle del database su cui va a scrivere (o da cui legge i dati fondamentali). 
È stata aggiunta un'indicazione in **giallo** per far capire *da quale Menu Laterale (Sidebar)* si accede fisicamente a quella schermata.

---

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

## 1. Moduli Core (Attività, Corsi e Lezioni) *(22 Tabelle)*
Queste 11 pagine gestiscono la configurazione delle attività erogate nel centro. Tutte condividono l'identica struttura logica e salvano gli orari allo stesso modo (`dayOfWeek`, `startTime`, `endTime`).

| Pagina Web | Rotta React | Menu Sidebar (UI) | Tabella Database Target | Note |
|---|---|---|---|---|
| **Corsi** | `/attivita/corsi` | 🟡 **Attività** (Tab Corsi) | `courses` | Modello matrice clonata 10 volte |
| **Workshop** | `/attivita/workshops` | 🟡 **Attività** (Tab Workshop) | `workshops` | |
| **Prove a Pagamento** | `/attivita/prove-pagamento` | 🟡 **Attività** (Tab Prove) | `paid_trials` | |
| **Prove Gratuite** | `/attivita/prove-gratuite` | 🟡 **Attività** (Tab Prove) | `free_trials` | |
| **Lezioni Singole** | `/attivita/lezioni-singole` | 🟡 **Attività** (Tab Lez. Sing.) | `single_lessons` | |
| **Attività Domenicali** | `/attivita/domeniche-movimento`| 🟡 **Attività** (Tab Domeniche) | `sunday_activities` | |
| **Allenamenti** | `/attivita/allenamenti` | 🟡 **Attività** (Tab Allenam.) | `trainings` | |
| **Lez. Individuali** | `/attivita/lezioni-individuali` | 🟡 **Attività** (Tab Lez. Indiv.) | `individual_lessons` | |
| **Campus** | `/attivita/campus` | 🟡 **Attività** (Tab Campus) | `campus_activities` | |
| **Saggi / Spettacoli** | `/attivita/saggi` | 🟡 **Attività** (Tab Saggi) | `recitals` | |
| **Vacanze Studio** | `/attivita/vacanze-studio` | 🟡 **Attività** (Tab Vacanze) | `vacation_studies` | |
| **Servizi Extras** | `/booking-services` | 🟡 **Servizi Prenotabili** | `booking_services` | Tabella specifica per extra / studi |

---

## 2. Moduli Amministrativi e Finanziari *(21 Tabelle)*
| Pagina Web | Rotta React | Menu Sidebar (UI) | Tabelle Database Target | Note |
|---|---|---|---|---|
| **Pannello Iscrizioni Rapide** | `/maschera-generale` | 🟡 **Maschera Input** | `members`, `[x]_enrollments`, `payments`, `price_list_items` | Il vero concentratore di azioni. (Es. scrive l'anagrafica, la collega al corso, genera il dovuto e incassa). |
| **Iscrizioni e Pagamenti** | `/iscrizioni-pagamenti` | 🟡 **Iscrizioni e Pagamenti** | Lettura combinata `members`, `enrollments` | Interfaccia d'appoggio per gestione logistica |
| **Nuovo Pagamento** | `/pagamenti` | 🟡 **Lista Pagamenti** | `payments` (Master) | Scrive in `payments`, lega una FK al memberId. |
| **Scheda Contabile** | `/scheda-contabile` | 🟡 **Scheda Contabile** | Lettura: `payments`, `price_list_items`, `members` | Sola LETTURA. Incrocia il dovuto col versato. |
| **Gestione Listini** | `/listini` | 🟡 **Listini e Quote** | `price_lists`, `price_list_items` | Scrive i "template" economici (le rate) per le attività. |
| **Tessere Nazionali** | `/tessere` | 🟡 **Tessere & Certificati** | `memberships` | Tessere CSEN, FGI, ecc. Indipendente dall'anagrafica. |

---

## 3. Gestione Anagrafica (Utenti e Staff) *(7 Tabelle)*
| Pagina Web | Rotta React | Menu Sidebar (UI) | Tabelle Database Target | Note |
|---|---|---|---|---|
| **Elenco Anagrafiche** | `/anagrafica_a_lista` | 🟡 **Anagrafica a Lista** | `members` | Lista passiva e ricerca soci / tesserati. |
| **Dashboard Membro Singolo** | `/membro/:id` | (Si apre da Anagrafica) | Lettura: `members`, `member_relationships`, `*_enrollments` | Hub di gestione scheda singola (es. genitore/figlio). |
| **Insegnanti** | `/insegnanti` | 🟡 **Staff/Insegnanti** | `instructors`, `instr_rates` | Anagrafica Docenti e listino compensi. |
| **Utenti System / Permessi** | `/utenti-permessi` | 🟡 **Utenti e Permessi** | `users`, `user_roles` | Account per accesso al Gestionale. (Email + Password) |

---

## 4. Gestione Struttura e Utility *(19 Tabelle)*
| Pagina Web | Rotta React | Menu Sidebar (UI) | Tabelle Database Target | Note |
|---|---|---|---|---|
| **Sale e Aule** | `/studios` | 🟡 **Studios/Sale** | `studios` | Scrive la sala (Capienza, Orari Base). |
| **Prenotazioni Sale** | `/prenotazioni-sale` | 🟡 **Prenotazioni Sale** | `studio_bookings` | Booking eventi spot. |
| **Calendario Planning** | `/calendario` | 🟡 **Calendario Corsi** | Lettura: 11 tabelle attività + `studios` | Sola lettura grafica delle ore programmate. |
| **Todo List Task** | `/todo-list` | 🟡 **ToDoList** | `todos` | Task collaborative per lo staff. |
| **Note Team / Chat** | `/commenti` | 🟡 **Commenti Team** | `teamComments` | Chat intercom della segreteria. |
| **Inserisci Nota** | `/inserisci-nota` | 🟡 **Inserisci Nota** | `teamComments` | Inserimento rapido ticket. |
| **Categorie Anagrafiche** | `/categoria-partecipante` | 🟡 **Categoria Partecipante**| `client_categories` | Scrive gerarchie su cui raggruppare i clienti. |
| **Categorie Attività** | `/categorie-attivita` | 🟡 **Categorie Attività** | `categories` e affini | Classificazione delle materie. |
| **Elenchi Dropdown Custom**| `/elenchi` | 🟡 **Elenchi** | `custom_lists`, `custom_list_items` | Controlla i menù a tendina custom in tutto il gestionale. |
| **Log Ingressi Badge** | `/accessi` | 🟡 **Controllo Accessi** | `access_logs` | Lettura/Scrittura gate passaggi tornello/tablet. |

---

## 5. Dashboard e Reportistica *(4 Tabelle Logiche)*
| Pagina Web | Rotta React | Menu Sidebar (UI) | Tabelle Database Target | Note |
|---|---|---|---|---|
| **Dashboard Iniziale** | `/dashboard` | 🟡 **Dashboard Statistiche** | Tutte le entità (Lettura) | Statistiche in tempo reale, incassi, kpi. |
| **Iscritti Per Attività** | `/iscritti_per_attivita`| 🟡 **Iscritti per Attività** | 11 Tabelle `*_enrollments` | Aggregazione degli iscritti ispezionando tutto il database. |
| **Report Avanzato** | `/report` | 🟡 **Report & Statistiche** | Interrogazione incrociata DB | SQL Custom in lettura su richiesta. |
| **Admin Panel** | `/admin` | 🟡 **Pannello Admin** | Controllo di sistema | |

---

### Centralizzazione UI/Orari e Debito Tecnico
La tabella sopra mostra chiaramente la vastità orizzontale del gestionale: decine di pagine interrogano e scrivono in tabelle SQL identiche strutturalmente. Le differenze visive o asimmetrie nel salvataggio dei **campi Orario** (giorno, HH:MM inizio, HH:MM fine) o nella **scelta dei moduli pagamento**, se presenti, sono anomalie unicamente imputabili ai **componenti Frontend React** ("le tendine della web app") non unificati nel tempo. 

Il backend SQL aspetta standard rigidi. Pertanto, l'implementazione visiva deve convergere verso "Micro Form" (o Componenti) Centralizzati Singoli da importare identici all'interno di ognuna delle pagine elencate, scongiurando bug di salvataggio.
