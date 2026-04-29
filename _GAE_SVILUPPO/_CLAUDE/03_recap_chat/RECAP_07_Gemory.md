# RECAP_07_Gemory
> Aggiornato: 2026_04_28_1700 (convertito da originale 2026_04_13_1338)
> Stato chat: 🔴 Da iniziare — consultazione architetturale fatta, F1/F2 mai emessi
> Ultimo protocollo: F1-000 / F2-000

---

## 1. SCOPO E PERIMETRO

Modulo di project management interno tipo Kanban (ispirato a Trello Premium).
Trasforma l'attuale base (`todos` + `team_notes` + `team_comments`) in un
sistema completo con bacheche, liste, card, assegnatari, commenti,
checklist, allegati, e 7 viste (Bacheca, Tabella, Calendario, Timeline,
Gantt, Dashboard, Mappa).

NON gestisce: comunicazioni B2C tesserati (vedi GemChat in Chat_10),
notifiche di sistema (vedi `notifications`), task amministrativi medicali
(vedi Chat_04).

Visibile a: tutti i ruoli interni (admin, operator, segreteria, ecc.).
Online booking: predisposto, non ancora attivo.

Visione futura: `tenant_id` su ogni tabella → estraibile come SaaS standalone.

---

## 2. STATO ATTUALE

### Cosa è già fatto
- Consultazione architetturale del 13/04/2026 con 5 domande aperte
  per Gaetano (vedi sezione 5)
- Analizzati i 2 screenshot Trello reali (`gemory_esempio1.png`,
  `gemory_esempio2.png`) — 15 bacheche identificate

### Cosa è in corso
- Niente di operativo. La chat è ferma in attesa di risposte alle 5 decisioni
  per emettere F1-001 e F2-001.

### Cosa è bloccato
- L'emissione di F1-001 dipende da decisioni 1, 2, 3, 5
- L'emissione di F2-001 dipende dalla decisione 4

---

## 3. TABELLE DB COINVOLTE

### Tabelle ESISTENTI (da decidere il destino)

| Tabella | Record | Ruolo storico | Decisione D2 |
|---|---|---|---|
| `todos` | 6 | Lista to-do globale | preserva o migra |
| `team_notes` | 28 | Note team | preserva o migra |
| `team_comments` | 16 | Commenti team | preserva (usata da altri moduli?) |

### Tabelle DA CREARE (con F1-001)

| Tabella | Ruolo |
|---|---|
| `kanban_boards` | Bacheche del workspace |
| `kanban_lists` | Colonne all'interno di una bacheca |
| `kanban_cards` | Card singole (con titolo, descrizione, allegati) |
| `kanban_card_assignees` | Assegnatari multipli per card |
| `kanban_card_comments` | Thread commenti per card |

---

## 4. FILE CHIAVE NEL CODEBASE (da creare/modificare)

- `client/src/pages/gemory.tsx` — pagina principale (DA CREARE)
- `client/src/components/GemoryGlobalButton.tsx` — pulsante "G" globale (DA CREARE)
- `server/routes/gemory.ts` — API (DA CREARE)
- `shared/schema.ts` § kanban_*
- File di layout globale (D4 da decidere): probabilmente `App.tsx` o
  `app-sidebar.tsx`

---

## 5. DECISIONI ARCHITETTURALI APERTE — 5 DOMANDE

### Decisione 1 — Stack ORM
- **Domanda:** definire le tabelle `kanban_*` in `shared/schema.ts` con Drizzle
  (come GemPass) oppure usare query MySQL raw (come altre rotte)?
- **Stato:** ⏳ aperta
- **Raccomandazione:** Drizzle, per coerenza con GemPass / Quote & Promo.

### Decisione 2 — Destino di `todos`, `team_notes`, `team_comments`
- **Opzioni:**
  - **A — Additivo**: tabelle vecchie restano, kanban aggiuntivo, `/todo-list`
    e `/commenti` continuano
  - **B — Rimpiazzo progressivo**: `/gemory` diventa l'unica home, dati
    migrati nelle card
- **Stato:** ⏳ aperta
- **Nota:** `team_comments` potrebbe essere usata da altri moduli — verificare
  prima di toccarla.

### Decisione 3 — Tabella `maintenance_tickets`
- **Domanda:** esistono già tabelle per i ticket di manutenzione, oppure
  sono gestiti dentro `todos` con un campo tipo? Va creata una tabella
  `maintenance_tickets` separata in Chat_07 oppure è prevista in Chat_03_GemTeam?
- **Stato:** ⏳ aperta
- **Verifica DB**: tabella `team_maintenance_tickets` ESISTE già (record=0).
  Probabile da usare/integrare con kanban via FK.

### Decisione 4 — Pulsante globale "G"
- **Domanda:** in quale file iniettare il pulsante fisso (blu/gold) con
  badge notifiche? `app-sidebar.tsx`, `App.tsx`, o un layout root specifico?
- **Stato:** ⏳ aperta
- **Azione:** AG deve fare audit del routing globale prima della scelta.

### Decisione 5 — Migrazione bacheche da Trello
- **Bacheche identificate da `gemory_esempio2.png`:**
  - EVENTI - PROGETTI (accordi e dettagli)
  - COMUNICAZIONE ONLINE-OFFLINE
  - AMMINISTRAZIONE
  - COLLABORAZIONI, CONVENZIONI, FORNITORI
  - TEAM - FORMAZIONE
  - PUB - IN VENDITA SG
  - AFFITTI E LEZIONI INDIVIDUALI
  - SITO SG e WP
  - SG_ASSISTENZE, MANUTENZIONE, ACQUISTI, PULIZIE
  - (CHIUSO) TEAM - SEGRETERIA e UFFICIO
  - SHOP - PUNTO VENDITA - COSTUMI SHOW in sede
  - CONDOMINIO VIGEN. GESTIONE E LAVORI
  - (CHIUSO) CORSI, ATTIVITÀ e GESTIONE STAFF
  - ACCORDI direzione
  - Squadra Organizzata: Efficienza che Brilla
- **Categorie utenti:** UFFICIO · SEGRETERIA · CONDOMINIO
- **Opzioni:**
  - A — Pre-popolate automaticamente come bacheche default (seed SQL)
  - B — Importate con contenuti (export JSON da Trello API)
  - C — Ripartenza da zero (utente crea bacheche manualmente)
- **Stato:** ⏳ aperta
- **Raccomandazione:** Opzione A — la lista è già pronta nei nomi, le card
  storiche non servono in v1.

---

## 6. PROTOCOLLI ESEGUITI

### Backend (F1)
*Nessuno. Il prossimo sarà F1-001 (creazione 5 tabelle kanban_* +
seed bacheche default se opzione A su D5).*

### Frontend (F2)
*Nessuno. Il prossimo sarà F2-001 (struttura `/gemory` vista bacheche
+ pulsante globale "G").*

---

## 7. PENDENTI

1. [ ] Risposta alle 5 decisioni architetturali (sezione 5)
2. [ ] **F1-001** — definizione schema Drizzle 5 tabelle kanban + migrazioni
   + seed bacheche default + backup pre-intervento
3. [ ] **F2-001** — pagina `/gemory` vista Bacheche + pulsante globale "G"
   + hook React Query base
4. [ ] Implementazione 7 viste (Bacheca, Tabella, Calendario, Timeline,
   Gantt, Dashboard, Mappa)
5. [ ] Drag & drop con `@dnd-kit`
6. [ ] Read receipts, checklist tracciate, allegati
7. [ ] Gestione assegnatari multipli e commenti per card
8. [ ] Decidere se migrare i record di `todos` (6) e `team_notes` (28)
   nelle card

---

## 8. INTERSEZIONI CON ALTRE CHAT

- **Chat_03_GemTeam** — `team_maintenance_tickets` è già nello schema
  (record=0). Definire se Gemory userà questa tabella o ne creerà una propria.
- **Chat_04_MedGem** — possibili card collegate a `medical_appointments`
  via `linked_activity_id`.
- **Chat_08_Corsi** — possibili card collegate a `courses` o `enrollments`.
- **Chat_14_BookGem** — possibili card collegate a `studio_bookings`.

---

## 9. NOTE PER LA PROSSIMA SESSIONE

- **`gemory_esempio1.png`** = riferimento UI bacheca (card ricche, labels,
  checklist, allegati)
- **`gemory_esempio2.png`** = riferimento UI workspace (15 bacheche
  con copertine + 3 categorie utente)
- **F2 deve replicare fedelmente questo layout**.
- **Visione SaaS**: tutte le tabelle `kanban_*` devono avere `tenant_id`
  fin dall'inizio per essere multi-tenant.
- **Ultimo backup pre-Chat_07**: `pre_nuove_chat_20260412_1901.sql` (8.9 MB).
- **Regola DROP tabelle**: prima di qualsiasi DROP — `COUNT=0` + grep codebase
  + nessuna route attiva.

---

*Aggiornato l'ultima volta da: Claude (chat di Analisi) in data 2026_04_28_1700
basato su: RECAP_Consulta_07_Gemory_2026_04_13_1338 (consultazione)*
