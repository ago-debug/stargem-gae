---
tags: [briefing, antigravity, ripresa]
aggiornato: 2026-05-05
tipo: briefing
---

# BRIEFING DI RIPRESA — Antigravity F1 e F2
## Data: 2026_05_05
## Da: Claude (Cowork) — coordinatore globale
## Per: AG-F1 (Backend) + AG-F2 (Frontend)

> Collegati: [[00_INDEX]] · [[MASTER_STATUS]] · [[ANALISI_MASTER]] · [[ISTRUZIONI_COWORK_2026_05_05]] · [[01_PROMPT_APERTURA_AG]]


---

## CONTESTO DELLA PAUSA

Antigravity è stato fermato per qualche giorno mentre Gaetano e Claude riorganizzavano il sistema di coordinamento. Cose successe nel frattempo (importanti per AG):

1. **Le 27 chat di Claude.ai sono state cancellate.** Il coordinamento globale si è spostato in **Cowork** (singola sessione persistente con accesso filesystem diretto a `_GAE_SVILUPPO/`).
2. **Tutti i RECAP** sono stati consolidati in `_CLAUDE/03_recap_chat/` (31 file: 1 template + 25 RECAP modulo + 5 RECAP ChatAnalisi).
3. **MASTER_STATUS è stato riscritto al 05/05** con tutto il lavoro AG fino al 04/05 (versione precedente archiviata in `99_archivio/2026_05_05_0858_MASTER_STATUS.md`).
4. È stata creata `_CLAUDE/05_allegati/` per Excel/PDF/screenshot che Claude consulta.
5. È stato spostato in `_CLAUDE/02_moduli_analisi/Anagrafica_FixUI_NuoviCampi_2026_05_05.md` un documento tematico utile per i fix UI di 10_Utenti.

Antigravity continua ad essere l'unico esecutore di codice. Nessuna delle regole del `00_LEGGIMI.md` è cambiata.

---

## PRIMA AZIONE OBBLIGATORIA — sincronizzazione

Quando AG riparte, prima di qualunque altro task, leggi nell'ordine:

1. `_GAE_SVILUPPO/00_LEGGIMI.md` — regole permanenti (12 articoli)
2. `_GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md` — versione 2026_05_05_0858 (riscritta da Cowork)
3. `_GAE_SVILUPPO/_CLAUDE/01_canonici/ANALISI_MASTER.md` — analisi strategica (invariata dal 25/04)
4. Questo briefing (lo stai leggendo)
5. Il `RECAP_NN_NomeChat.md` del modulo specifico su cui Gaetano ti chiede di lavorare

Poi conferma in chat:
- "Letti i 4 file canonici + briefing"
- "Comprendo lo stato del DB al 05/05" (numeri record, AI Integration, Pruning)
- "Comprendo le DOMANDE APERTE DI GAETANO" (sezione dedicata in MASTER_STATUS)

Fino alla conferma, non eseguire alcun task.

---

## STATO SINTETICO AL 05/05

In produzione e funzionante (StarGem live su `stargem.studio-gem.it`):

- **DB**: 4.489 members · 3.305 memberships · 13.584 enrollments · 3.775 payments · 561 courses (post-pruning 25 fantasmi)
- **AI Integration enterprise** (01/05): Sentry, PostHog, Vercel AI SDK gpt-4o-mini, tool Hard-RBAC, Magic Promo Button, Assistente Teo online
- **Infrastruttura** (01/05): winston logger in `server/logger.ts` con rotazione giornaliera, `scripts/backup-db.sh` notturno (.tar.gz, retention 30 giorni), rate limiting in `server/auth.ts`
- **Pruning chirurgico** (01/05): 7 tabelle orfane rimosse, 14 route fantasma cancellate, 270+ script test archiviati, ZERO errori TypeScript
- **Sicurezza pagamenti rinforzata** (02/05): blocco backend+frontend importi negativi, coerenza obbligatoria Metodo/Data quando stato=Paid
- **Performance** (02/05): `/api/stats/dashboard` e `/api/stats/alerts` riscritti con SQL Aggregation diretta
- **Registro di Classe + Appello** (04/05): API bulk `/api/attendances/bulk`, vista pivot in `CourseUnifiedModal.tsx`, dialog "Fai l'Appello"
- **Listini Multi-Stagione + Checkout bloccato** (04/05): `courseQuotesGrid` con `season_id`, `NuovoPagamentoModal` readOnly, sconti solo via codici promo
- **PDF Ricevute/Fatture** (04/05): jsPDF in `TabRicevute`, prefissi 2526-R/S/F
- **Calculated Lessons** (04/05): courses ha `calculated_lessons` che esclude vacanze/chiusure

Suspended per sicurezza (non toccare):
- `routes.ts` (12k righe) — smantellamento sospeso 02/05 per dipendenze incrociate
- `maschera-input-generale.tsx` (4.5k righe) — stesso motivo

---

## PROTOCOLLI EMESSI MA NON ANCORA ESEGUITI

Pre-pausa erano stati emessi due protocolli che AG non ha ancora eseguito. Sono entrambi audit READ-ONLY (zero rischio).

### 05_GemPass — F1-001 (audit memberships)
- File: `_CLAUDE/03_recap_chat/RECAP_05_GemPass.md` § PROTOCOLLI EMESSI
- Cosa fa: SHOW COLUMNS memberships + SELECT campionario + COUNT non-NULL per i 4 campi muti (`membership_type`, `season_id`, `issue_date`, `fee`) + grep route GET `/api/memberships` + analisi `client/src/pages/gempass.tsx`
- Output atteso: 3 blocchi descrittivi, zero modifiche

### 06_Contabilità — F1-001 + F2-001 (ricognizione payments + UI)
- File: `_CLAUDE/03_recap_chat/RECAP_06_Contabilita.md` § PROTOCOLLI EMESSI
- F1-001: DESCRIBE payments + COUNT campi nuovi (`operator_name`, `source`, `transfer_confirmation_date`, `quota_description`, `period`, `total_quota`, `deposit`, `receipts_count`, `discount_code`, `discount_value`) + grep route API
- F2-001: analisi `accounting-sheet.tsx` + `payments.tsx` (campi mostrati, tipo TypeScript Payment, conferma se i 10 campi sono già nel tipo)
- ATTENZIONE: 06_Contabilità ha 6 decisioni architetturali aperte (A-F). La **F è BLOCCANTE per il DDL** delle nuove tabelle `cash_registers` e `bank_deposits`. Dopo F1-001 fermati e attendi che Gaetano decida la F (struttura piatta vs normalizzata).

---

## ALTRI LAVORI PENDENTI

### Domande aperte di Gaetano (DB Monitor — 04/05)
Vedi MASTER_STATUS § "DOMANDE APERTE DI GAETANO". 4 domande architetturali sulla tabella `members`:
1. Perché dati tessere in `members` (intervallo colonne O-U)? Non dovrebbero essere in `memberships`?
2. Perché certificati medici in `members` (intervallo V-W)? Non dovrebbero essere in `medical_certificates`?
3. Colonna A — a cosa serve? Numeri presi da dove?
4. Colonna BA — serve? "Eliminiamo id vecchi non servono"

Sono questioni architetturali. Gaetano vuole capirne la logica prima di permettere ulteriori modifiche a `members`. Se ti pone come priorità, indaga in autonomia (lettura schema + grep codice). Non scrivere migrazioni senza il suo OK esplicito.

### Reimport turni GemTeam (PRIORITA 2)
- `team_scheduled_shifts` = 17 (cancellati durante test E2E, dovrebbero essere ~225)
- `team_shift_templates` = 1 (cancellati, dovrebbero essere ~550)
- Reimportare da `team_TURNI.xlsx` (file Excel reale)
- Vedi `_CLAUDE/03_recap_chat/RECAP_03_GemTeam.md` per il pattern di import storico (F1-030/F1-031 già documentati)
- Atomic, una sessione

### Bug Master 12_Gemdario (UI FREEZE)
- "Raggruppamento corsi nel Planning sparito" — bug master da investigare
- ⚠️ UI FREEZE in vigore: NON modificare estetica, NON toccare `calendar.tsx` e `attivita.tsx` fino a collaudo end-to-end completato
- Vedi `RECAP_12B_Gemdario.md`

### PRIORITA 1b — Fix UI campi nascosti
Spread su 4 chat. F1-001 di GemPass e Contabilità (sopra) coprono 2 di queste 4. Per le altre 2:
- 10_Utenti: leggi `_CLAUDE/02_moduli_analisi/Anagrafica_FixUI_NuoviCampi_2026_05_05.md` per il dettaglio dei 54+ campi Athena da esporre
- 08_Corsi: già parzialmente coperto dalla chiusura massiva 30/04, restano badge status colorati e uniformazione `participation_type` ('corso' vs 'STANDARD_COURSE')

---

## RACCOMANDAZIONE OPERATIVA

Se Gaetano ti chiede "da dove riparti?", il task **più sicuro e più atomico** è il **F1-001 di 05_GemPass**:
- Audit READ-ONLY (zero rischio)
- Già scritto e pronto da copia-incolla nel RECAP
- Sblocca direttamente la PRIORITA 1b (fix UI memberships)
- Completable in poche ore in singola sessione

Alternative valide se Gaetano preferisce:
- **Reimport turni GemTeam** (atomico, sblocca operatività team)
- **F1-001 di 06_Contabilità** (ma poi ti blocchi su decisione F prima del DDL)
- **Domande aperte tabella members** (impegnativo, architetturale, può richiedere più sessioni)

NON consigliato per ripartire:
- 12_Gemdario (UI FREEZE attivo, rischio regressione)
- routes.ts smantellamento (sospeso per sicurezza)

---

## REGOLE CHE RESTANO INVIOLABILI

Riepilogo per memoria:
- AG scrive solo in `_GAE_SVILUPPO/_ANTIGRAVITY/` — Claude/Cowork scrive solo in `_GAE_SVILUPPO/_CLAUDE/`
- Deploy: `git commit` + `git push origin main` → STOP. Gaetano pubblica manualmente su Plesk
- AG non esegue mai: `deploy-vps.sh`, ssh VPS, npm build VPS, pm2 restart, chown/chmod VPS
- Backup obbligatorio dopo ogni F1 che tocca il DB
- DB inviolabili: `payments` mai DROP (solo ADD COLUMN), `members` mai modificare colonne esistenti, `courses` mai toccare struttura STI, `enrollments` tabella ufficiale (universal_enrollments droppata)
- 3 SKU storico intoccabili (contenitori import): `2526QUOTATESSERA`, `2526DTYURI`, `2526DTNELLA`
- Categorie: `custom_lists` + `custom_list_items` (no nuove tabelle `*_cats`)
- Smart Routing import: `QUOTATESSERA → memberships`, `DTYURI/DTNELLA → medical_certificates`
- Formato tessera: `2526-000042` (con trattino)
- `user_roles.name` (NON `roleName`)
- `members.user_id` → FK varchar(255) verso `users.id` (onDelete: set null)
- Stop & Go SEMPRE prima di modificare DB o file critici
- Max 1 numero di distanza tra F1 e F2 per ogni chat
- Claude descrive COSA e PERCHÉ — AG decide COME (non anticipare codice)

---

*Briefing generato da Claude (Cowork) — 2026_05_05_0958 — atteso primo prompt operativo da Gaetano*
