# Analisi Interventi Architetturali Database

In base allo stato attuale dell'infrastruttura (unificazione STI completata, Modulo Quote e Promo implementato) e a quanto discusso, ecco l'analisi delle prossime implementazioni suggerite per finalizzare l'efficienza del gestionale e completare la migrazione da Excel.

## 0. Contesto Attuale: Dimensionamento Database

Ecco una "fotografia" cruda e veloce dei numeri attuali del database in tempo reale sul main locale:

| Entità / Modulo | Tabella Fisica DB | Ruolo e Funzione | Totale Record |
| :--- | :--- | :--- | :---: |
| **Membri e Anagrafiche** | `members` | Profilo centrale di tutti gli iscritti, staff, minorenni e PT. | **9.504** |
| **Corsi e Attività STI** | `courses` | Classi, Workshop e Campus fusi nell'unico motore erogativo. | **421** |
| **Iscrizioni (Enrollments)**| `enrollments` | L'aggancio tra l'allievo (`member`) e una classe (`course`). | **13** |
| **Pagamenti (Libro Mastro)** | `payments` | Registratore di cassa globale per qualsiasi transazione economica. | **30** |
| **Regole e Sconti Promo** | `promo_rules` | Codici promozionali, sconti Black Friday o % cumulative. | **50** |
| **Aule / Spazi Fisici** | `studios` | Le sale della struttura (es. Sala 1, Sala Pesi, Studio Medico). | **13** |
| **Accordi Insegnanti** | `instructor_agreements`| Relazione tra `members` (docenti), % di paga e stagione. | **9** |
| **Carnet Prepagati** | `carnet_wallets` | Portafogli ingressi a scalare acquistati dagli iscritti. | **0** |
| **Prenotazioni Aule Extra** | `studio_bookings` | Feste, noleggi sale, ore di personal libere non istituzionali. | **0** |

*(Per un totale di **75 tabelle orizzontali e di snodo strutturale** che configurano il sistema).*

---

## 1. Gestione Risorse Umane (La netta divisione Staff / Team)

Il sistema necessita di un disaccoppiamento logico per gestire due mondi operativi distinti:

### A) GemStaff (Insegnanti e Personal Trainer)
*I professionisti sportivi (~70 persone) soggetti a rendicontazione, presenze in aula e calcolo compensi mensili.*

**Tabelle Esistenti Coinvolte:**
- `members` (dove è specificato `participantType = 'INSEGNANTE'`)
- `staff_rates` (Tariffari base configurati per docente/livello)
- `instructor_agreements` (Accordi stagionali, compensi orari o percentuali creati in Quote e Promo)
- `courses` e `studio_bookings` (Motore STI da cui si estraggono le presenze/ore realmente tenute dal GemStaff)

**Modifiche o Tabelle DB da Integrare:**
- **`payslips` (Cedolini):** Tabella per generare la "busta paga" riepilogativa a fine mese. Si ottiene incrociando matematicamente le `staff_rates` con le ricorrenze lette dallo storico STI.
- **`staff_contracts_compliance`:** Tabella per tracciare la burocrazia obbligatoria (DURC, contrattualistica sportiva Coni, scadenze accordi).

### B) GemTeam (Personale Dipendente / Amministrazione)
*Il gruppo direttivo e di segreteria, che opera dietro le quinte per la gestione dell'Accademia.*

**Tabelle Esistenti Coinvolte:**
- `users` e `user_roles` (Accessi al software e permessi granulari)
- `todos`, `messages`, `team_notes` (Collaborazione e passaggio di consegne in reception)

**Modifiche o Tabelle DB da Integrare:**
- **`staff_shifts` (Turni di Lavoro):** Tabella per organizzare le timbrature, i turni del front-desk o le ore per il personale addetto ai servizi (es. pulizie), senza mai sporcare il calendario didattico del Gemdario o il calcolo paghe del GemStaff.

---

## 2. Digitalizzazione Burocratica (Kiosk Mode & Firme)
L'obiettivo è azzerare la carta in segreteria. Eviteremo di appesantire la tabella `members` con innumerevoli colonne di flag (es. `privacy_accepted`, `gdpr2025_ok`, `foto_ok`) che diventerebbero ingestibili.

**Modifiche DB Necessarie:**
- **`member_forms_submissions` (Nuova Tabella Polimorfica):**
  - `member_id` (Relazione con il firmatario)
  - `form_type` (Identificativo del documento: "Anamnesi Base", "GDPR", "Liberatoria Video Saggio")
  - `payload_data` (Colonna di tipo **JSON**. Conterrà esattamente cosa l'utente ha compilato dal Tablet senza richiedere migrazioni DB in futuro per nuovi moduli)
  - `signed_at` / `signature_hash` (Registrazione della firma digitale eseguita dal Kiosk)

---

## 3. Gestione Contabile Finale (Controllo Cassa e Magazzino)
Tutto sta fluendo in `payments`, ma manca l'astrazione di fine giornata per blindare l'aspetto "contanti" in un'azienda fisica.

**Modifiche DB Necessarie:**
- **`cash_registers` (Chiusure Cassa):** Tracking delle scatole di cassa, fondo cassa iniziale e finale dei turni di segreteria, incrociando i `payments` in contanti per trovare gli scostamenti riga per riga alla fine del turno lavorativo.
- **`bank_deposits` (Distinte Bancarie):** Storico dei versamenti fisici o raggruppamenti su conto corrente per agevolare il Controllo di Gestione.
- **`inventory_items` e `stock_movements` (Opzionale/Futuro):** Da lanciare qualora si voglia contabilizzare la Buvette e scalare automaticamente il Gatorade venduto in reception.

---

## 4. Automazione CRM (Evoluzione di Clarissa)
Rendere proattivo il nostro strumento di tag per permettergli di lavorare di notte alleggerendo il carico del GemTeam.

**Modifiche DB Necessarie:**
- **`automation_rules`:** Gestore Cron (es. Trigger: "se medical_certificates è a -7 giorni dalla scadenza").
- **`email_logs_history`:** Lo storico per capire chi ha ricevuto l'SMS o la mail generata dal Trigger.
