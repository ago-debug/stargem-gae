---
tags: [canonico, stato-globale, post-reset]
aggiornato: 2026-05-11
ultima_verifica_vs_codice: 2026-05-11
validita_prevista: 7 giorni (scade 2026-05-18 → richiede re-audit prima di guidare interventi)
tipo: canonico
fonti_verificate:
  - _ANTIGRAVITY/02_output_protocolli/stato_di_fatto_F1_backend_2026_05_11.md (audit AG F1 del 11/05)
  - _ANTIGRAVITY/02_output_protocolli/stato_di_fatto_F2_frontend_2026_05_11.md (audit AG F2 del 11/05)
---

# MASTER_STATUS — StarGem Suite

> Versione: **2026-05-11 post reset totale**
> Fonti esclusive: gli audit `stato_di_fatto_F1_backend_2026_05_11.md` e `stato_di_fatto_F2_frontend_2026_05_11.md` prodotti da AG il 11/05/2026 ispezionando direttamente codebase e DB.
> Tutta la documentazione precedente è archiviata in `99_archivio/2026_05_11_RESET_TOTALE/`.

---

## 🔗 File collegati

- [[ISTRUZIONI_COWORK_2026_05_05]] — regole Cowork
- `00_LEGGIMI.md` (root) — regole permanenti AG/Claude (15 articoli, ultimi aggiunti il 11/05)
- `_ANTIGRAVITY/02_output_protocolli/stato_di_fatto_F1_backend_2026_05_11.md` — audit F1
- `_ANTIGRAVITY/02_output_protocolli/stato_di_fatto_F2_frontend_2026_05_11.md` — audit F2

---

## 1. STATO DB ATTUALE (ambiente DEV, porta 3307)

⚠️ **DB DEV SVUOTATO DI PROPOSITO** da Gaetano per preparare una **re-importazione completa con mappatura pulita**. I dati storici di produzione (VPS IONOS porta 3306) sono ancora intatti, ma non sono stati ispezionati in questo audit.

| Tabella | Record (dev) | Note |
|---|---|---|
| `members` | 92 | Aspettavamo 4.489 (azzerato di proposito) |
| `memberships` | 0 | Aspettavamo 3.305 (azzerato) |
| `medical_certificates` | 0 | Aspettavamo 2.770 (azzerato) |
| `enrollments` | 0 | Aspettavamo 13.584 (azzerato) |
| `payments` | 0 | Aspettavamo 3.775 (azzerato) |
| `team_scheduled_shifts` | 0 | Wipe test (mai re-importato in dev) |
| `team_shift_templates` | 0 | Wipe test |
| `team_attendance_logs` | 0 | Wipe test |
| `team_employees` | 16 | OK |
| `team_postazioni` | 25 | OK |
| `team_week_assignments` | 3 | OK |
| `courses` | 842 | STI unificato, ok |
| `strategic_events` | 74 | OK |
| `course_quotes_grid` | 60 | OK (listini popolati) |
| `promo_rules` | 24 | OK |
| `company_agreements` | 21 | OK |
| `users` | 19 | account staff |
| `user_roles` | 7 | ruoli definiti |
| `user_session_segments` | 2.650 | log sessioni live |
| `user_activity_logs` | 3.235 | log attività live |

**Anomalia rilevata:** `global_enrollments` lancia errore "Table doesn't exist" — droppata/mai creata. Residuo del pruning. Va indagato.

---

## 2. ⛔ 4 ERRORI TYPESCRIPT BLOCCANTI (priorità #0 — bloccano deploy)

Confermati da entrambi gli audit (`npx tsc --noEmit` fallisce con codice 1/2):

1. **`client/src/components/crm/TabAnagrafica.tsx:167`** — Type error: usato `"phone"` invece di `"telefono"` (campo non esiste con quel nome).
2. **`client/src/components/crm/TabGift.tsx:47`** — `Parameter 'prev' implicitly has an 'any' type`.
3. **`client/src/components/crm/TabGift.tsx:51`** — Stesso problema di tipizzazione implicita.
4. **`client/src/pages/maschera-input-generale.tsx:2005`** — Type error sul `Dispatch<SetStateAction>` di `setVerificaStato` (mismatch interfaccia Record vs Oggetto tipizzato in `CrmFormContext`).

Tutti e 4 nel comparto **CRM / Maschera Input**, area che entrambi gli audit identificano come la più fragile.

---

## 3. LE 3 SEZIONI PRIORITARIE (Gaetano 11/05)

### 3.1 🎯 ANAGRAFICA & CRM (priorità #1)

**Stato Backend (F1):**
- 🟢 IN PRODUZIONE: gestione anagrafica cruda, API di lettura
- 🟡 In dev: DB svuotato di proposito (92 members vs 4.489 attesi)
- Tabella `members` con 170+ colonne — F1 conferma "oggettivamente ingestibile", necessario disaccoppiamento da `memberships` e `medical_certificates`
- API: `GET|POST|PATCH /api/members`, `GET /api/memberships`, `POST /api/gempass`

**Stato Frontend (F2):**
- 🟢 IN PRODUZIONE ma "estremamente fragile"
- File chiave: `client/src/pages/maschera-input-generale.tsx` (4.500 righe — monolite), `client/src/components/crm/` (TabAnagrafica, TabIscrizioni, CrmFormContext), `client/src/pages/members.tsx`
- ⚠️ Wizard multi-step con coupling di stato altissimo — se fallisce validazione Zod su una tab nascosta, il form intero si paralizza senza feedback all'utente
- 4 errori TS qui dentro (vedi §2)

**Diagnosi convergente:** stesso problema visto da due lati — Anagrafica è funzionale ma costruita su due monoliti (tabella `members` 170 col + `maschera-input-generale.tsx` 4.5k righe) accoppiati tra loro. F2 raccomanda pattern "auto-save per tab" con Zustand + spacchettamento. F1 raccomanda refactor JOIN su `memberships`/`medical_certificates` prima di poter migliorare la UI.

---

### 3.2 🎯 PAGAMENTI & CASSA (priorità #2)

**Stato Backend (F1):**
- 🟢 IN PRODUZIONE: motore quote/convenzioni/welfare configurato a livello dati
- 🔴 RISCHIO ALTO: codice monolitico, no disaccoppiamento checkout
- File: `server/routes/payments.ts`, route `course-quotes-grid` e `promo-rules` in `routes.ts`
- API: `GET|POST /api/payments`, `GET /api/course-quotes-grid`, `POST /api/checkout`
- Migrazioni recentissime: `0012` → `0015` (Quote/Promo/Agevolazioni/Carnet, aprile 2026)
- Validazione `routes.ts:6124` attiva: blocca `Pagato` senza Metodo (sicurezza nuova OK)

**Stato Frontend (F2):**
- 🟡 IN COLLAUDO per integrazioni ricevute / 🟢 IN PRODUZIONE per storico
- File: `payments.tsx`, `accounting-sheet.tsx`, `listini.tsx`, `nuovo-pagamento-modal.tsx`, `PaymentModuleConnector.tsx`
- "Accoppiamento pericoloso tra listini (`courseQuotesGrid`) e logiche interne di ricalcolo frontend"
- `PaymentModuleConnector` ha "diramazioni difficili da tracciare"
- F2 osserva: **manca uno state-machine manager puro** (Redux/Zustand slice dedicato) per il carrello
- "I pagamenti sono l'area a più alto rischio di regressione business"

**Diagnosi convergente:** pricing engine configurato OK (60 quote + 24 promo + 21 agreements in DB), ma il flusso checkout è accoppiato su 14 route + frontend ricalcola pezzi del prezzo invece di fidarsi del backend. Servono: state machine carrello frontend + disaccoppiamento PaymentModuleConnector backend.

---

### 3.3 🎯 CALENDARIO & PLANNING (priorità #3)

**Stato Backend (F1):**
- Compreso nella sezione "Corsi & Calendario (STI & Gemdario)"
- 🟢 IN PRODUZIONE: STI su `courses` unifica tutte le tipologie, regge il carico
- File: `shared/schema.ts` (STI), `server/routes.ts` (route /api/courses, /api/enrollments, /api/attendances)
- ⚠️ `enrollments` a 0 record in dev (svuotato) → impossibile riprodurre bug calendario in locale senza re-import

**Stato Frontend (F2):**
- 🟡 IN COLLAUDO / UI FREEZE attivo
- File: `client/src/pages/calendar.tsx` (3.500 righe — monolite), `planning.tsx`, `CourseUnifiedModal.tsx`, `CourseDuplicationWizard.tsx`
- "Mix di flexbox e posizionamento assoluto interpolato con `ResizeObserver` (Phase 19 Time-Space elastico)" — denso ma manutenibilità precaria
- "Presentation logic e business logic si fondono → regressioni silenziose"
- Bug master noto: raggruppamento corsi sul planning sparito
- Auto-advance stagionale già commentato (fix operativo recente, verificato in sessione precedente)
- F2 raccomanda: estrarre hook `useTemporalGrid` (engine headless di griglia pre-calcolata)

**Diagnosi convergente:** calendario è funzionale ma è una "bomba a orologeria" (parole F2). Il fix immediato del bug raggruppamento Planning richiede prima di poter testare in locale (DB svuotato). Il refactor strutturale (hook headless) è il lavoro vero di stabilizzazione.

---

## 4. ALTRE MACRO-SEZIONI (sintesi rapida)

### 4.1 Auth & IAM
🟢 STABILE. Passport + sessions, 2.650 sessioni tracciate, 3.235 activity log. F1: "Non tocco nulla qui". Solidamente costruito.

### 4.2 GemTeam (HR interno)
🟡 Infrastruttura completa (16 dipendenti, 25 postazioni, route /api/gemteam/* esistenti) ma dati operativi a zero (turni/presenze svuotati). Inutilizzabile in UI senza dati. TODO STI-cleanup pendenti sull'enum `tipo_assenza`.

### 4.3 Corsi & Attività Didattiche
🟢 IL MIGLIORE in produzione (F2: "abbattuto il debito tecnico visivo"). STI unificato, 842 corsi in DB, `activity-management-page` modulare, badge coerenti, "pennini A/B" (`inline-list-editor`) pattern UX consolidato. **Da estendere al Planning.**

### 4.4 Quote, Promo, Listini, Convenzioni
🟢 Configurazione popolata: 60 `course_quotes_grid`, 24 `promo_rules`, 21 `company_agreements`. Migrazioni `0012`→`0015` di aprile hanno strutturato il modulo. Manca il volume vendite (payments a 0).

### 4.5 Utilità Globali & AI
🟢 Snello e disaccoppiato. `teo-copilot.tsx`, `command-palette.tsx`, `ExportWizard.tsx` (componente unificato che standardizza ogni export). Vercel AI SDK integrato senza inquinare i layout. Nessun debito rilevante.

---

## 5. DEBITO TECNICO CONSOLIDATO (a 11/05)

Confermato dai due audit:

| Debito | File | Severità | Note |
|---|---|---|---|
| Monolite routes.ts | `server/routes.ts` (12k righe, ~5.300 solo /api/gemteam/*) | 🔴 Alta | ~40 commenti `TODO: route categorie legacy` + `TODO: STI-cleanup` |
| Monolite maschera-input | `client/src/pages/maschera-input-generale.tsx` (4.500 righe) | 🔴 Alta | Coupling Zod + Context, 4 errori TS attivi |
| Monolite calendar | `client/src/pages/calendar.tsx` (3.500 righe) | 🔴 Alta | Presentation+business fuse |
| Tabella members 170+ col | `shared/schema.ts` § members | 🔴 Alta | Include colonne tessere/certificati che dovrebbero stare altrove |
| PaymentModuleConnector accoppiato | `client/src/components/PaymentModuleConnector.tsx` + 14 route backend | 🟡 Media | Diramazioni complesse, no state machine |
| global_enrollments dropped/mai creata | DB | 🟡 Media | Errore "Table doesn't exist", da indagare |
| Suspended smantellamenti | routes.ts + maschera-input | — | Decisione esplicita 02/05: refactor solo modulo-per-modulo manuale |

---

## 6. REGOLE DB INVIOLABILI (riepilogo dal 00_LEGGIMI)

- `payments` → MAI DROP, solo ADD COLUMN
- `members` → solo ADD COLUMN, mai modificare colonne esistenti
- `courses` → non toccare struttura STI
- `enrollments` → tabella iscrizioni UFFICIALE
- Categorie → `custom_lists` + `custom_list_items` (no nuove tabelle `*_cats`)
- 3 SKU storico INTOCCABILI: `2526QUOTATESSERA`, `2526DTYURI`, `2526DTNELLA`
- Formato tessera: `2526-000042` (con trattino)
- `user_roles.name` (NON `roleName`)
- Smart Routing import: QUOTATESSERA → memberships, DTYURI/DTNELLA → medical_certificates
- Nuove tabelle: includere `tenant_id` default `'1'` (regola 13 del LEGGIMI)
- Backup obbligatorio dopo ogni F1 che modifica il DB

---

## 7. PROSSIMI PASSI SUGGERITI (basati su F1+F2 + priorità Gaetano)

In ordine di priorità:

### #0 — Fix 4 errori TypeScript bloccanti (PRIMA di qualunque altra cosa)
- Tipo: F2 frontend
- Stima: 1-2 ore
- Output atteso: `npx tsc --noEmit` → 0 errori
- File: `TabAnagrafica.tsx`, `TabGift.tsx`, `maschera-input-generale.tsx`, `CrmFormContext` (eventualmente)

### #1 — Audit approfondito SEZIONE ANAGRAFICA (priorità Gaetano)
- F1 mappa tutte le route + DTO + JOIN su `members` / `memberships` / `medical_certificates`
- F2 mappa tutti i componenti CRM + state flow
- Output: piano dettagliato di refactor JOIN backend + spacchettamento maschera input frontend
- NON eseguire fix qui — solo mappatura e proposta

### #2 — Audit approfondito SEZIONE PAGAMENTI (priorità Gaetano)
- F1 mappa flusso checkout end-to-end + PaymentModuleConnector + 14 route accoppiate
- F2 mappa state del carrello + ricalcoli frontend + Listini
- Output: piano per state machine carrello (Zustand) + disaccoppiamento backend

### #3 — Audit approfondito SEZIONE CALENDARIO/PLANNING (priorità Gaetano)
- F1 conferma route + query pertinenti
- F2 propone refactor `useTemporalGrid` headless + fix bug raggruppamento Planning
- Output: piano per rimuovere UI FREEZE in sicurezza

### Da attendere
- Re-import members/memberships/payments (decisione Gaetano: prima mappatura, poi import)
- Decisione STRADA A/B per `/importa` (campi dinamici) — vecchia, ancora aperta

---

*Documento canonico — Claude (Cowork) — 2026_05_11. Da aggiornare DOPO ogni audit approfondito delle 3 sezioni prioritarie. Versione precedente in `99_archivio/2026_05_11_RESET_TOTALE/`.*
