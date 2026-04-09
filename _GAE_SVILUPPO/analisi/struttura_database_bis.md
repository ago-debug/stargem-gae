# Tabella Unica di Roadmap: I 15 Moduli del Gestionale (Struttura Bis)

In questo documento ho integrato le voci presenti nella schermata di **Login (La Suite StarGem)** con l'architettura tecnica del database (tabelle attuali *e* sviluppi futuri). 

Contando esattamente le aree logiche, questo gestionale possiede il potenziale per essere suddiviso in **15 MACRO-SEZIONI** distinte, coprendo ogni singola esigenza di un'Accademia moderna. 

Usa questa tabella come Checklist (Step di Avanzamento) per decidere a cosa lavorare.

---

## L'Ecosistema a 15 Sezioni

| # | Sezione / Modulo (Suite) | Scopo Operativo | Architettura DB (Attuale / Futura) | Checklist (Avanzamento) |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Core Anagrafica** | Il nucleo centrale. Contiene i profili completi di tutti, genitori e figli. | **Esistente:** `members`, `member_relationships`, `cli_cats`.<br>**Sviluppo:** Già maturo. | ✅ Stabile |
| **2** | **Gemdario (Calendario)** | Erogazione dei corsi, iscrizioni settimanali, presenze in aula e orari. | **Esistente:** `courses`, `enrollments` (Motore STI unificato).<br>**Sviluppo:** Visualizzazione tattica migliorata per presenze rapide. | ✅ Operativo |
| **3** | **BookGem (Booking)** | Prenotazioni, affitti spazi esterni (es. sale mediche, affitti per feste). | **Esistente:** `studios`, `studio_bookings`.<br>**Sviluppo:** Aggancio perfetto lato UI al calendario generale. | ✅ Operativo |
| **4** | **MedGem (Medico)** | Pannello dedicato alle idoneità sportive, blocco prenotazioni automatico. | **Esistente:** `medical_certificates` intrecciata a `members`.<br>**Sviluppo:** Cruscotto rapido per la visione delle scadenze mensili. | ✅ Stabile |
| **5** | **Clarissa (CRM & IA)** | Marketing automation. Manda comunicazioni mirate in base a trigger. | **Esistente:** Base tag attiva.<br>**Futuro:** Aggiunta `marketing_campaigns`, `automation_rules` (email scadenze/compleanni), `email_logs`. | ⬜ Da Progettare |
| **6** | **GemStaff (Burocrazia)** | Conformità dell'Accademia, contrattualistica docenti, marketing HR. | **Esistente:** `staff_rates`.<br>**Futuro:** Aggiunta `staff_contracts_compliance` per scadenze accordi, DURC e assunzioni. | ⬜ In Attivazione |
| **7** | **GemTeam (HR Operativo)** | Tracking lavorativo quotidiano, monitoraggio ore e presenze collaboratori. | **Esistente:** `users`, sessioni e log d'accesso.<br>**Futuro:** Aggiunta `staff_shifts` (turni) e `payslips` (calcolo automatico cedolino/busta paga a fine mese). | ⬜ Da Progettare |
| **8** | **Gemory (Project Mgr)** | Comunicazione p2p tra segretari. Post-it, compiti e thread integrati. | **Esistente:** `todos`, `team_notes`, `team_comments`.<br>**Sviluppo:** Generazione automatica to-do dal sistema. | ✅ Operativo |
| **9** | **TeoCopilot (AI Bot)** | L'intelligenza a supporto della segreteria per estrarre o filtrare dati. | **Esistente:** Lettura read-only e Tooltip.<br>**Sviluppo:** Integrazione in maschere complesse per assistenza UI. | ✅ Operativo |
| **10** | **Contabilità & Cassa** | Libro mastro, quote, registri fatture, sconti e convenzioni aziendali. | **Esistente:** `payments`, `quotes`, `cost_centers`, `carnet_wallets`.<br>**Sviluppo:** Export massivo per commercialisti e Modulo di **Controllo di Gestione** (budget, stime e marginalità). | ⏳ Lavorazioni Parziali |
| **11** | **Kiosk: Firma Digitale** | Eliminazione carta. Tablet su stand al front-desk per far firmare l'utente. | **Futuro:** Aggiunta `member_forms_submissions` (payload JSON + firma digitale per Privacy e GDPR). | ⬜ Da Sviluppare |
| **12** | **Buvette, Scorte & POS** | Venditorio fisico: integratori, acqua, merchandising. | **Futuro:** Aggiunta `inventory_items` (Magazzino), `stock_movements`. Cassa volante per scarico prodotti. | ⬜ Da Valutare |
| **13** | **Tornelli & Check-In** | Ingressi fisici automatizzati (Lettori Barcode o App). | **Esistente:** `access_logs`, `memberships` (Tessere).<br>**Futuro:** API endpoint `/api/checkin` sblocco relè hardware e verifica `MedGem`. | ⬜ Da Definire |
| **14** | **Area Clienti (Self)** | Portale Web Mobile User-Facing (Lato Cliente) e non segreteria. | **Futuro:** Dashboard per permettere all'allievo di auto-prenotare la lezione del _Gemdario_ e pagare con `Stripe`. | ⬜ Progetto Futuro |
| **15** | **SysAdmin & Log** | Backend invisibile. Configurazione tendine (Custom Lists) e tracciabilità errori. | **Esistente:** `custom_lists`, `system_configs`, `user_activity_logs`.<br>**Sviluppo:** Silenzioso e sempre attivo. | ✅ Stabile |

---

## Moduli Extra "Nascosti" (Da GSheet al Digitale)
Per stimolare la tua analisi e aiutarti a svuotare le innumerevoli cartelle Excel o GSheet che la segreteria usa quotidianamente, ecco **ulteriori 7 Sezioni Strategiche** che solitamente le Accademie tengono su file separati e che potremmo integrare come moduli nativi nel Gestionale (portando il sistema a ben **22 Sezioni**):

| # | Sezione / Modulo Extra | Scopo Operativo (Il GSheet da sostituire) | Ipotesi di Architettura DB Futura |
| :---: | :--- | :--- | :--- |
| **16** | **Chiusura Cassa e Ripartizione Banche** | GSheet della fine turno. Tracciamento versamenti contanti in banca, fondo cassa reale e chiusura del POS fisico. | Aggancio a *Contabilità*. Tabelle: `cash_registers`, `bank_deposits`. |
| **17** | **Gruppi Agonistici, Casting e Gare** | Gestione delle "Crew", convocazioni alle gare regionali/nazionali, quote concorso e prenotazione Hotel/Bus. | Tabelle: `competitions`, `competition_crews`, `travel_expenses`. |
| **18** | **Facility e Manutenzioni (GemFix)** | Il classico gruppo WhatsApp "S'è rotta la cassa in Sala A". Gestione pulizie e segnalazione guasti in palestra. | Tabelle: `maintenance_tickets` con stati (Aperto, Risolto), `inventory_assets`. |
| **19** | **Pre-Iscrizioni, Lead e Open Day** | Gestione dei contatti (prospect) in arrivo dalle campagne Facebook o "Open Day", che non hanno ancora pagato nulla. | Estensione di *Clarissa*. Tabelle: `leads_pipeline`, `trial_bookings`. |
| **20** | **Costumeria e Prestito Attrezzature** | Foglio di calcolo per chi ha noleggiato o preso in prestito i costumi dei Saggi, microfoni o chiavi dell'Accademia. | Tabelle: `equipment_items`, `equipment_loans` con data di rientro prevista. |
| **21** | **Programmazione Didattica e Pagelle** | I docenti segnano quali coreografie hanno spiegato o danno i voti (Verdi/Gialli/Rossi) agli allievi per il passaggio di livello. | Tabelle: `course_diaries`, `student_evaluations`. |
| **22** | **Bandi, Scadenze e Sponsor B2B** | Calendario burocratico della direzione (scadenza affitto, bando comunale sportivo, estintori, SIAE). | Estensione di *Gemory*. Tabelle: `corporate_deadlines`, `sponsorships`. |

---

## Metodo di Lettura
Questa griglia allinea ufficialmente la **Suite Commerciale StarGem** (presente sulla schermata UI di login) con le Tabelle Database, includendo ora tutto ciò che potrebbe provenire dal vostro **ecosistema frammentato su Google Sheets**. Possiamo approcciare queste 22 sezioni una ad una seguendo questa lista!
