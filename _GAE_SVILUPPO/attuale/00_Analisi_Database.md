# Master Document: Architettura e Database StarGem Manager (Stato Attuale)

Questo documento rappresenta la mappa completa ed esaustiva di tutte le sezioni del gestionale. Sostituisce i precedenti file frammentati di analisi strutturale e funge da *Source of Truth* (SOT) per l'architettura dati dopo la migrazione a Single Table Inheritance (STI).

---

## PARTE 1: La Suite StarGem (Mappatura Applicativa)

La suite consta potenzialmente di 22 moduli, di cui quelli principali sono già tracciati a database.

| # | Sezione / Modulo (Suite) | Scopo Operativo | Architettura DB (Attuale / Futura) | Checklist |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Core Anagrafica** | Il nucleo centrale per tutti i profili (genitori e figli). | **Esistente:** `members`, `member_relationships`, `cli_cats`. | ✅ Stabile |
| **2** | **Gemdario (Calendario)** | Erogazione dei corsi, iscrizioni e presenze (Motore STI). | **Esistente:** `courses`, `enrollments`. | ✅ Operativo |
| **3** | **BookGem (Booking)** | Prenotazioni, affitti spazi e sale. | **Esistente:** `studios`, `studio_bookings`. | ✅ Operativo |
| **4** | **MedGem (Medico)** | Pannello idoneità sportive e blocco prenotazioni. | **Esistente:** `medical_certificates` intrecciata a `members`. | ✅ Stabile |
| **5** | **Clarissa (CRM & IA)** | Marketing automation. Manda comunicazioni su trigger. | **Futuro:** `marketing_campaigns`, `automation_rules`, `email_logs`. | ⬜ Da Progettare |
| **6** | **GemStaff (Burocrazia)** | Contrattualistica docenti, marketing HR. | **Esistente:** `staff_rates`, `staff_contracts_compliance`. | ✅ In Attivazione |
| **7** | **GemTeam (HR Operativo)** | Tracking lavorativo, monitoraggio ore collaboratori. | **Esistente:** `users`, `staff_presenze`, `payslips`. | ✅ In Attivazione |
| **8** | **Gemory (Project Mgr)** | Comunicazione p2p tra segretari. Post-it, compiti. | **Esistente:** `todos`, `team_notes`, `team_comments`. | ✅ Operativo |
| **9** | **TeoCopilot (AI Bot)** | Assistenza AI per operazioni e query read-only. | **Esistente:** Lettura read-only e Tooltip UI. | ✅ Operativo |
| **10** | **Contabilità & Cassa** | Libro mastro, quote, sconti e convenzioni. | **Esistente:** `payments`, `quotes`, `cost_centers`, `carnet_wallets`. | ⏳ In Lavorazione |
| **11** | **Kiosk: Firma Digitale** | Tablet front-desk per far firmare documenti legali. | **Futuro:** `member_forms_submissions` (payload JSON). | ⬜ Da Sviluppare |
| **12** | **Buvette, Scorte & POS** | Venditorio fisico: integratori, acqua, merchandising. | **Futuro:** `inventory_items` (Magazzino), `stock_movements`. | ⬜ Da Valutare |
| **13** | **Tornelli & Check-In** | Ingressi fisici automatizzati. | **Esistente:** `access_logs`, `memberships` (Tessere). | ⬜ Da Definire |
| **14** | **Area Clienti (Self)** | Portale Web Mobile User-Facing (Lato Cliente) | **Futuro:** Dashboard per auto-prenotazione e pagamento Stripe. | ⬜ Futuro |
| **15** | **SysAdmin & Log** | Core di configurazione liste dinamiche. | **Esistente:** `custom_lists`, `system_configs`, `user_activity_logs`. | ✅ Stabile |

> *Nota: sono presenti ulteriori 7 sottomoduli potenziali (ex-GSheet) per "Cassa", "Gruppi Agonistici", "Facility", "Leads/Open Day", "Costumeria", "Programmazione" e "Sponsor B2B" non ancora architettati pesantemente nel DB.*

---

## PARTE 2: Dimensionamento Corrente (Fotografia in Real-Time)

I volumi di records presenti al termine delle bonifiche e mock dei dati sono i seguenti:

| Entità / Modulo | Tabella Fisica DB | Ruolo e Funzione | Totale Record |
| :--- | :--- | :--- | :---: |
| **Membri e Anagrafiche** | `members` | Profilo centrale di iscritti e staff. | **9.504** |
| **Corsi e Attività STI** | `courses` | Classi, Workshop e Campus fusi. | **421** |
| **Iscrizioni (Enrollments)**| `enrollments` | Aggancio allievo (`member`) e classe (`course`). | **13** |
| **Pagamenti (Mastro)** | `payments` | Registratore globale per ogni transazione economica| **30** |
| **Regole e Promo** | `promo_rules` | Codici promozionali, sconti Black Friday. | **50** |
| **Aule / Spazi Fisici** | `studios` | Le sale della struttura (es. Sala 1). | **13** |
| **Accordi Insegnanti** | `instructor_agreements`| Relazione tra docenti, % paga e stagione. | **9** |

---

## PARTE 3: Struttura Dettagliata delle Tabelle Base

### A. Modulo Anagrafica (Members)
- **`members`**: Custodisce studenti, allievi e docenti (`participantType='INSEGNANTE'`). PK: `id`.
- **`member_relationships`**: Legacy famigliari/minorenni.
- **`users`** e **`user_roles`**: Gli account staff.

### B. Modulo Erogativo STI (Attività/Corsi)
- **`categories`** / **`custom_lists`**: Gestite interamente via UI (vocabolari, livelli, stili).
- **`courses`**: Motore erogativo unitario. Un corso stagionale, uno spot, un campus sono archiviati qui.
- **`enrollments`**: Ponte associativo (many-to-many) tra persona e record in `courses`.
- **`studios`** e **`seasons`**: Definiscono lo spazio e il partizionamento temporale.

### C. Modulo Cassa Cost-Centers e Quote
- La tabella universale è **`payments`**. Ė tassativo appoggiarsi su di essa per qualsiasi incasso futuro per non rompere i report di "Controllo di Gestione" (`cost_centers` e `journal_entries`).
- Estensioni per Engine Sconti: `company_agreements`, `staff_rates`, `pricing_rules`. Esiste un motore di ricarica per logiche massive asincrone.

---

## PARTE 4: Integrazioni Architetturali Future (La Roadmap Tecnica)

Lo schema relazionale è pronto ad accogliere i prossimi blocchi senza causare deadlock o frammentare la logica STI. Di seguito le istruzioni esatte per l'implementazione DB dei 4 blocchi mancanti:

### 4.1. GemStaff e GemTeam (Motore HR e Tracciamento)
Evitare di incrociare lo stipendio degli insegnanti con l'orario di reception. Le seguenti tabelle sono ora attive a sistema:
- **`payslips`** (Busta Paga/Cedolino mensile per i docenti basato su erogazione).
- **`staff_presenze`** e **`staff_sostituzioni`** (Gestione ore dei dipendenti, check-in, tracking sostituzioni e timbrature).
- **`staff_contracts_compliance`** e **`staff_document_signatures`** (Checklist documenti DURC, firme elettroniche, scadenze, sicurezza).
- **`staff_disciplinary_log`** (Registro anomalie e note HR per lo staff protetto da admin).
- **Segmentazione Ruoli:** Il flusso utenti in UI è stato blindato su 3 compartimenti: `Team` (Admin), `Staff` (Insegnanti), `Utenti` (Clienti), impedendo assegnazioni amministrative involontarie agli insegnanti (Policy Due Cappelli).

### 4.2. Kiosk Segreteria (Firma Modulistica Mobile)
La tabella **`member_forms_submissions`** dovrà accogliere flussi dinamici di firma in loco.
Eviteremo colonne Boolean fisse, favorendo uno store flessibile di flag.
Campi futuri previsti: `member_id`, `form_type` (es. "*GDPR*"), `payload_data` (JSON flessibile), `signed_at`.

### 4.3. Buvette e POS Rapido (Micro-Economy)
Se un allievo acquista merchandising/acqua, deve scattare l'integrazione magazzino:
Campi futuri previsti: **`inventory_items`** (SKU prodotti fisici) e **`stock_movements`** (scarichi di cassa che innescano comunque una entry dentro la master table `payments`).

### 4.4. Automazioni Marketing
Campi futuri: **`automation_rules`** con intercettori cron per scadenza Idoneità (Medical) verso mail automatizzate; tracciatura via **`email_logs_history`**.
