---
aggiornato: 2026-05-15T08:00
ultima_verifica_vs_codice: 2026-05-15T08:00
validita_prevista: aggiornata ad ogni cambio di stato (continuo)
tipo: checklist-progetto
prompt_di_riferimento: tutti
---

# 📋 Checklist Progetto StarGem — vista d'insieme

> Aggiornata ad ogni cambio di stato (regola 19 del 00_LEGGIMI).
> Consultare PRIMA di iniziare qualunque task per evitare duplicati e vedere dipendenze.

---

## ✅ Completato

### Riorganizzazione e setup Cowork
- [x] 11/05 — **Reset totale** 69 file canonici archiviati in `99_archivio/2026_05_11_RESET_TOTALE/`
- [x] 11/05 17:09 — **Articolo 17** 00_LEGGIMI: timestamp con ora obbligatorio nel frontmatter
- [x] 11/05 19:30 — **Articolo 18** 00_LEGGIMI: numerazione progressiva prompt F1-NNN/F2-NNN
- [x] 12/05 01:00 — **Articoli 19+20** 00_LEGGIMI: checklist progetto + domande con opzioni
- [x] 11/05 — Setup Obsidian come vault sul progetto + indice + templates + daily notes

### Audit strategici post-reset
- [x] 11/05 mattina — **Strategic Review F1+F2** (parere onesto su debito tecnico)
- [x] 11/05 16:39 — **Audit Stato di Fatto Reale F2** (frontend)
- [x] 11/05 17:00 — **Audit Stato di Fatto Reale F1** (backend, 5 macro-sezioni rilevate)
- [x] 11/05 17:15 — **Audit Performance Backend** (file pesanti, N+1, indici mancanti, googleapis 189MB)
- [x] 11/05 19:07-19:11 — **Ricostruzione Faro AG** (9 file vivi in `_ANTIGRAVITY/01_status_continui/`)

### Fix bloccanti
- [x] 11/05 19:11 — **Fix 4 errori TypeScript** CRM (`TabAnagrafica`, `TabGift`, `maschera-input-generale`). `npx tsc --noEmit` = 0 errori.

### Anagrafica
- [x] 12/05 00:15 — **F2-001** Audit Anagrafica frontend approfondito (Context Hell, no Zod, payload mostruoso)
- [x] 12/05 00:18 — **F1-001** Audit Anagrafica backend approfondito (dual-write, 27 FK, schema 170+ colonne mappato)
- [x] 12/05 00:35 — **Piano refactor Anagrafica convergente** scritto in [[piano_refactor_anagrafica_2026_05_11]] (6 step parallelizzabili F1+F2)
- [x] **F1-002** Refactor Anagrafica Fase 1 — ✅ COMPLETATO 12/05 02:25 (tutti e 4 i fix applicati, tsc 0)
  - [x] Fix 1: `getMember()` LEFT JOIN — 12/05 01:18
  - [x] Fix 2: `getMembers()` LEFT JOIN — 12/05 01:30
  - [x] Fix 3: `getMembersPaginated()` SQL raw + JOIN — 12/05 01:55
  - [x] Fix 4: `getMembersWithEntityCards()` + `routes.ts:9619` cardNumber — 12/05 02:25

- [x] **F2-002** Refactor Anagrafica Step 1 (Zustand migration) — ✅ COMPLETATO 12/05 13:05 (TabAnagrafica migrata e check tsc 0 errori)
  - [x] Step 1: `mascheraStore.ts` creato, persist + partialize
  - [x] Step 2: `CrmFormContext` → Thin Wrapper, rimosse 110 righe useState/useEffect
  - [x] Step 3: migrazione `TabAnagrafica.tsx`
  - [x] Step 4: validazione finale `tsc` + isolamento re-render verificato

- [x] **F1-003** Quick Wins Performance Backend (indici + N+1 GemTeam) — ✅ COMPLETATO 12/05 13:52
  - [x] Analisi tabelle e creazione migration `0016_windy_killraven.sql` con 9 indici
  - [x] Apply migration eseguita su DB dev locale
  - [x] Diff N+1 fix applicato su `routes.ts` per `/api/gemteam/dipendenti` (49 query → 1 query aggregata)
  - [x] Test curl + misurazione timing: delta netto ~189ms, dati intatti

- [x] **F2-003** Megaaudit Flusso Iscrizioni Frontend — ✅ CHIUSO 13/05 12:00 — vedi [[audit_F2-003_flusso_iscrizioni_frontend_2026_05_12]]. Mappate 16 aree A-P + Sintesi finale + Piano Fase 3 frontend. 3 macigni strutturali emersi: memory leak Base64, Tabs vs Wizard, convergenze negative cross-asse col backend.

- [x] **F1-004** Megaaudit Flusso Iscrizioni Backend — ✅ CHIUSO 13/05 16:39 — vedi [[audit_F1-004_flusso_iscrizioni_backend_2026_05_12]]. Mappate 16 aree A-P + Sintesi finale + Top 5 problemi + Piano Fase 3 backend stimato 7 settimane uomo.

- [x] **F1-005** Mini-task validazione formula tessera vs Google Sheets — ✅ CHIUSO 13/05 18:00 — vedi [[report_F1-005_validazione_formula_tessera_2026_05_13]]. 🚨 **VERDETTO: DIVERGENTE + BUG GRAVE**: (1) padding ID sdoppiato (4 cifre `/api/memberships` vs 6 cifre `/api/gempass/tessere`); (2) BUG CRITICO `/api/gempass/tessere` passa "CORRENTE"/"SUCCESSIVA" a `calculateMembershipExpiry()` → tessere con ID corrotto tipo "CORRENTE-000042" + Invalid Date in DB; (3) CF doppio "Silent Merge" senza avvisi. Decisioni Gaetano: tessere fisiche = 6 cifre, StarGem master Excel storico → standardizzare a 6 cifre + deprecare endpoint duplicato.

- [x] **F2-004** MC1 Memory Leak Base64 FRONTEND — Fase 1 ANALISI+PIANO — ✅ CHIUSO 13/05 19:30 — vedi [[piano_F2-004_memory_leak_base64_frontend_2026_05_13]]. Componenti coinvolti: TabAllegati.tsx, utenti-permessi.tsx, user-profile-dialog.tsx. Target: Multipart FormData + pre-upload asincrono + URL relative. Decisioni prodotto (13/05 19:35): progress bar minimale in-place, preview PDF apri-in-nuova-tab, cleanup file orfani cron notturno backend.

- [x] **F1-008** Unificazione tessere 6 cifre + deprecazione `/api/gempass/tessere` — ✅ CHIUSO 13/05 20:00 — vedi [[report_F1-008_unificazione_tessere_2026_05_13]]. Patch 1 (padding 6 cifre `season.ts`, eliminato `membership.ts`) + Patch 3 (deprecazione strategia B con console.warn, 4 chiamate `client/src/pages/gempass.tsx` da migrare in F2 successivo). tsc 0, test season verdi.

- [x] **Documento classificazione utenti v2** caricato da Gaetano 13/05 — vedi [[classificazione_utenti_2026_05_13bis]]. Aggiunge: scenari concreti (scuola danza paga workshop a 5 allieve, congregazione paga corso a 2 ragazze), 2 welfare reali (Fitprime/Wellhub, Pellegrini/WAI), pagamenti multipli (UN ricevuta + collegamento DB nominativi), Gift Card (metodo pagamento, quota tessera separata), foglio detrazione fiscale. **Fonte autoritativa per futuro MC3 Pagamenti relazionali.**

- [x] **F1-006** MC1 Memory Leak Base64 BACKEND — Fase 1 ANALISI+PIANO — ✅ CHIUSO 13/05 21:30 — vedi [[piano_F1-006_memory_leak_base64_backend_2026_05_13]].

## ✅ Fase 3 — MC1 + MC2 + MC3 (14-15/05)

### 🎯 MC1 Memory Leak Base64 — CHIUSO end-to-end ✅
- [x] **F1-009** Rimozione fisica `/api/gempass/tessere` (4 endpoint deprecati eliminati) — ✅ 13/05 22:30
- [x] **F1-010 + F1-012 + F1-014** MC1 BE Fase 2 esecuzione: schema migration + endpoint POST upload multipart + GET auth misto (sessione + signed URL JWT) + script bulk migration + cron cleanup + fix DB GemTeam + compat FE/BE photoUrl/avatarUrl — ✅ 14/05 05:30 — vedi [[report_F1-014_endpoint_upload_auth_misto_2026_05_13]]
- [x] **F2-007** MC1 FE Fase 2 esecuzione: hook useFileUpload + FileUploadInput + refactor TabAllegati/TabTessere/utenti-permessi/user-profile-dialog (sostituiti FileReader+canvas.toDataURL+Base64 con FormData multipart + URL relative) — ✅ 14/05 06:30 — vedi [[report_F2-007_memory_leak_base64_frontend_2026_05_13]]

### 🎯 MC2 Pratica/Stepper — CHIUSO end-to-end ✅
- [x] **F1-013** MC3 Pagamenti relazionali ANALISI+PIANO — ✅ 14/05 01:00 (5 domande commercialista in coda) — vedi [[piano_F1-013_mc3_pagamenti_relazionali_2026_05_13]]
- [x] **F1-015** MC2 Pratica/Stepper BE ANALISI+PIANO — ✅ 14/05 07:30 (5 domande operative, tutte risposte) — vedi [[piano_F1-015_mc2_pratica_stepper_be_2026_05_13]]
- [x] **F1-016** MC2 BE Fase A ESECUZIONE: schema dossiers + dossier_steps + dossier_audit_log + endpoint CRUD (POST/GET/PATCH/DELETE) + business rules hard-coded + script migration retroattivo 12 mesi — ✅ 14/05 13:30 — vedi [[report_F1-016_mc2_fase_a_esecuzione_2026_05_14]]
- [x] **F2-012** MC2 Stepper UI FE ANALISI+PIANO — ✅ 14/05 13:00 (3 decisioni prodotto: convivenza 2 settimane, auto-save 30 sec, scorciatoie Ctrl+S/Ctrl+Enter) — vedi [[piano_F2-012_mc2_stepper_ui_2026_05_14]]
- [x] **F2-013** MC2 Stepper UI ESECUZIONE: WizardStepper + useDossierWizard + 6 step (AnagraficaStep/TutoriStep/TesseramentoStep/DocumentiStep/CertificatoMedicoStep/PagamentoStep) + DashboardDossiers + routing /dossiers/:id/wizard + sidebar aggiornato + banner dismissione maschera classica — ✅ 14/05 18:50 — vedi [[esecuzione_F2-013_mc2_stepper_ui_2026_05_14]]

### 🎯 MC3 Pagamenti relazionali Fase A — CHIUSO BE ✅ (FE da fare)
- [x] **F1-017** MC3 Fase A esecuzione: schema external_payers + societies + payment_participants + payments expanded (payer_id/billing_subject_id/document_type/payment_group_id/gift_card_amount) + helper documentType + endpoint /api/payments/multi-participant + 4 scenari test OK (madre 2 figlie / scuola danza / Comune / gift card) — ✅ 14/05 18:10 — vedi [[report_F1-017_mc3_fase_a_esecuzione_2026_05_14]]
- [ ] **MC3 Fase A FE** — NuovoPagamentoModal multi-participant + Society + ExternalPayer + Gift Card UI (in coda, ~6-8h)
- [ ] **MC3 Fase B/C BE** — foglio detrazione fiscale + welfare formule Fitprime/Pellegrini (richiede commercialista)

### 🎯 Quick Win UI cross-pagina ✅
- [x] **F2-006/F2-008** SEG-001: ListPageHeader + splitFullName + applicazione 4 pagine — ✅ 13/05 22:45
- [x] **F2-009 + F2-011** SortableHeader colonne globale + Quick Win Pack 4 task (SEG-004 telefoni PhoneBadge + SortableHeader propagazione + SEG-002 rinomina Anagrafica→Utente + 3 HelpTooltip) — ✅ 14/05 08:30 — vedi [[report_F2-011_quick_win_pack_ui_2026_05_13]]

### ✅ Bug critici post-test (15/05)
- [x] **F1-018** Verifica operativa BE MC1+MC2+MC3 — 3 bug critici emersi (attachments_url, MC3 snake_case, /api/health mancante) — ✅ 14/05 20:25 — vedi [[verifica_F1-018_BE_post_fase3_2026_05_14]]
- [x] **F2-014** Verifica operativa FE — 11 errori TS + HelpTooltip mancante + Banner dismissione — ✅ 14/05 20:25 — vedi [[verifica_F2-014_FE_post_fase3_2026_05_14]]
- [x] **F1-019** FIX 3 bug critici BE — attachments_url rinominata da attachment_metadata (row size limit), createdBy/performedBy INT→VARCHAR(255), MC3 snake/camel mapping, /api/health attivo — ✅ 14/05 20:50 — vedi [[report_F1-019_fix_bug_critici_BE_2026_05_14]]
- [x] **F2-015** FIX 11 errori TS + HelpTooltip creato + Banner dismissione con bottone "Provala ora" — ✅ 14/05 20:55 — tsc 0 + npm build OK — vedi [[report_F2-015_fix_ts_helptooltip_banner_2026_05_14]]
- [x] **F2-016** TEST INTEGRATO Wizard E2E (7 scenari + screenshot) — 2 bug critici emersi: PATCH step "not found" + upload mkdir non ricorsivo — ✅ 14/05 22:00 — vedi [[test_F2-016_integrato_wizard_e2e_2026_05_14]]
- [x] **F1-020** Verifica /importa + Decision Pack STRADA A/B/A+B — ✅ 14/05 21:30 (raccomandata STRADA B + CF→warning + fix Lotto 1) — vedi [[report_F1-020_verifica_importa_decision_pack_2026_05_14]]
- [ ] **F1-022** 🟡 IN CORSO — FIX 2 bug critici Test E2E (PATCH step + upload mkdir recursive)
- [ ] **F1-021** 📋 IN CODA — Fix /importa Lotto 1 anagrafica: CF placeholder stranieri + CF warning minorenni + duplicato Liv. 1 audit (riempi vuoti + log cambi in audit_logs + badge "Verifica dati" UI) + estensione MEMBER_FIELDS con campi CSV Athena (header reali da Gaetano)

- [x] **F2-005** Migrazione 4 chiamate `/api/gempass/tessere` → `/api/memberships` — ✅ CHIUSO 13/05 21:30 — vedi [[report_F2-005_migrazione_gempass_to_memberships_2026_05_13]]. tsc 0, grep frontend = 0 match. Backend deprecato pronto per rimozione fisica nel prossimo F1.

- [x] **F1-007** Bug fix `/api/gempass/tessere` + censimento + script bonifica — ✅ CHIUSO 13/05 19:30 — vedi [[report_F1-007_bugfix_gempass_e_bonifica_2026_05_13]]. Patch 2 applicato (tsc 0). Censimento dev: 0 record corrotti (DB svuotato dopo reset). Script bonifica dry-run creato in [[script_bonifica_F1-007_tessere_corrotte]] con `db.update` commentate per safety. ⚠️ **Da eseguire censimento + bonifica su STAGING/PROD** per verifica impatto reale.

---

## 🟡 In corso

*(nessun task in corso — entrambi i megaaudit F1-004 e F2-003 chiusi, in attesa di pianificazione Fase 3 unificata)*

---

## 📋 Backlog prossimi (in ordine di priorità)

### Priorità #1 — Anagrafica (lavoro convergente F1+F2)
- [ ] 🎯 **F1-004 + F2-003 — AUDIT FLUSSO ISCRIZIONI/RINNOVI/ACQUISTI** (cross-modulo, megaaudit)
  - **Scope:** 16 aree (A-P) — identità, ruoli multipli, duplicati, verifica link, minorenni/tutori, pratica/workflow, pagamenti, tessere, certificati, documenti/firme, area B2C, canali, blocchi, non tesserati/società, notifiche, sicurezza
  - **Output:** mappa stato 1-5 per ogni area + tabella flussi reali vs desiderati + piano operativo in 3 fasi
  - **Allineamento:** classificazione StarGem del PDF `2026_04_20_classificazione_stargem_v2.pdf`
  - **Stima:** F1 ~10-15h + F2 ~10-15h (megaaudit, NON eseguibile in 1 sessione)
  - **Tipo:** read-only, ZERO modifiche
  - **Prompt salvato in:** [[03_PROMPT_AUDIT_FLUSSO_ISCRIZIONI_2026_05_12]]
  - **Stato:** F1-004 Sess.2/4 chiusa (Aree A-H, 12/05 17:00 — vedi [[audit_F1-004_flusso_iscrizioni_backend_2026_05_12]]); F2-003 Sess.3/4 chiusa (Aree A-L, 12/05 16:00 — vedi [[audit_F2-003_flusso_iscrizioni_frontend_2026_05_12]]). In attesa Stop&Go Gaetano per Sess.3 backend / Sess.4 frontend.
- [x] **F1-002**: Backend Fase 1 — sostituire letture piatte con LEFT JOIN su `memberships`/`medical_certificates` (3-4 ore, rischio basso)
- [x] **F2-002**: Frontend Step 1 — migrazione `CrmFormContext` → Zustand store (Completato)
- [x] **F1-003**: Backend Fase 2 — quick wins performance (indici + N+1) (Completato ✅)
- [ ] **F2-003**: Frontend Step 2 — schemi Zod condivisi in `shared/` + `react-hook-form` (4-6 ore, dopo F2-002)
- [ ] **F2-004**: Frontend Step 3 — chunked saves debounced (8-12 ore, dopo F2-003)
- [ ] **F1-004**: Backend Fase 3 — DROP colonne piatte (DISTRUTTIVA, DOPO re-import dati, 3-6 ore)

### Priorità #2 — Quick wins performance backend
- [x] **Aggiunta indici SQL** su `members.last_name/email`, `enrollments.status/enrollmentDate/targetDate`, `payments.status/paid_date/due_date` — ✅ COMPLETATO 12/05 13:52 con F1-003
- [x] **Fix N+1** in `/api/gemteam/dipendenti` — ✅ COMPLETATO 12/05 13:52 con F1-003 (49 query → 1 query, 189ms in dev)
- [ ] 🆕 **PhotoUrl Base64 nel payload `/api/gemteam/dipendenti`** — payload da 2.8MB causa avatar Base64 inline. Refactor: spostare foto in static asset + servire URL relativo. Stima ~2-3 ore F1+F2. (Emerso durante test F1-003)
- [ ] 🆕 **Memory Leak Base64 strutturale** — cross-asse F1-004 I/J + F2-003 J: payload Base64 in 'attachmentMetadata' JSON dentro members (backend) + Base64 in state React caricato direttamente (frontend). Causa rischio crash Node.js a scala + freeze browser con 4-5 file. Refactor: spostare upload su endpoint dedicato che salva file in static asset + servire URL relativo. Stima F1+F2 ~10-15h. Cross-link a [[audit_F1-004_flusso_iscrizioni_backend_2026_05_12]] e [[audit_F2-003_flusso_iscrizioni_frontend_2026_05_12]].

### Priorità #3 — Pagamenti & Calendario (audit + refactor)
- [ ] **Audit approfondito Pagamenti** F1+F2 (stesso schema usato per Anagrafica)
- [ ] **Audit approfondito Calendario/Planning** F1+F2
- [ ] Refactor Pagamenti (state machine carrello + disaccoppiamento PaymentModuleConnector)
- [ ] Refactor Calendario (estrazione hook `useTemporalGrid`, fix bug raggruppamento Planning, rimozione UI FREEZE)

### Priorità #3.5 — 🎯 Listino Prezzi Parametrico (Quote_Param) — IMPORTANTE
- [ ] **Costruire la sezione listino prezzi parametrico (QUOTE_PARAM + QUOTE_CORSI)** — Gaetano l'ha caricato come priorità il 11/05.

  > **NOTA 2026-05-12T15:30** — Proposal consolidato prodotto da Subagent Ricerca (A): vedi [[proposal_Quote_Param_2026_05_12]]. Include modello dati `price_rules` + `price_rule_tiers` + `price_rule_components`, endpoint backend, UI frontend, roadmap a 3 fasi e 5 domande aperte (Q1-Q5) per Gaetano. Da riverificare contro `shared/schema.ts` prima di emettere prompt F1-NNN.

  **Fonti di riferimento** (i 3 file sono attualmente in `99_archivio/2026_05_11_RESET_TOTALE/_CLAUDE/03_recap_chat/` post-reset; valutare se "ripescarli" in `_CLAUDE/02_moduli_analisi/` come riferimento vivo per agganciarli al grafo Obsidian):
  - [[16_RECAP_COMPLETO_QUOTE_PARAM_E_QUOTE_CORSI]] — 23 KB di ricostruzione dettagliata della chat: obiettivo, decisioni prese, struttura QUOTE_PARAM, formule, layout QUOTE_CORSI, codici, problemi risolti, test finali
  - [[17_PROMPT_HANDOFF_PER_NUOVA_CHAT_ANALISI_QUOTE_PARAM]] — 8 KB, prompt pronto per riprendere il lavoro da zero
  - [[18_SCHEMA_OPERATIVO_QUOTE_PARAM_PRONTO_USO]] — 3.7 KB, checklist + campi + formule concettuali + decisioni aperte (operativo)
  
  **Allineamento già implementato lato codice (audit F1 backend del 11/05):**
  - Migrations `0012` → `0015` (Quote/Promo/Agevolazioni/Carnet) di aprile hanno creato la base
  - Tabelle popolate: `course_quotes_grid` (60 record), `promo_rules` (24), `company_agreements` (21)
  - `NuovoPagamentoModal` blindato readOnly (04/05) — l'importo viene precompilato dalla riga ufficiale del listino, gli sconti solo via codici promo
  - Listini con `seasonId` introdotti il 04/05
  
  **Cosa manca / da decidere con Gaetano:**
  - UI di gestione QUOTE_PARAM (creare/modificare righe del listino parametrico) — esiste già o va costruita?
  - Layout QUOTE_CORSI specifico — è il pattern PARAMETRICO definitivo o ha bisogno di rivisitazione?
  - Integrazione con i pattern attuali (course_quotes_grid + promo_rules + carnet_wallets + welfare_providers + company_agreements)
  - Decisione architetturale STRADA A/B/A+B su `/importa` campi dinamici (vecchia, ancora aperta) — è collegata
  
  **Tipo task:** decisione architetturale + UI + backend. Richiede prima un audit approfondito tipo SEG-NNN ma sul listino esistente, per capire dove siamo. Inseribile come priorità #3.5 perché incrocia Pagamenti.

### Priorità #4 — Performance frontend
- [ ] **Audit Performance Frontend** (Step P.2 mai lanciato — bundle size, re-render, dipendenze npm)
- [ ] Eliminare `googleapis` (sostituire con `fetch` puri)
- [ ] Spacchettare `shared/schema.ts` (2.728 righe → 5 file logici)

### Priorità #5 — Smantellamento monolite
- [ ] **Big bet:** smantellamento `routes.ts` (12.259 righe → split per dominio, modulo per modulo, supervisione manuale)
- [ ] **Big bet 2:** `maschera-input-generale.tsx` 4.500 righe → split per dominio (sostituita gradualmente dal Wizard MC2, ma legacy resta)
- [ ] **Big bet 3:** `calendar.tsx` 3.500 righe → estrazione hook `useTemporalGrid` + componenti
- [ ] **Big bet 4:** `members` table 170+ colonne → split su `members_extended`/`memberships_extended`/`fiscal_data` (parzialmente avviato F1-026)

### 🧹 Priorità #7 — Pulizia & Igiene Codebase (da recap Cowork hub 15/05)

- [ ] **Pulizia root**: ~80 file scratch_*.ts, fix_*.cjs, audit_*.json, test_*.ts, update_*.cjs accumulati in root del repo. Spostare in `scratch/` o cancellare. ~30-60 min, rischio zero. (Vedi [[RECAP_DIAGNOSTICA_HUB_COWORK_2026_05_15]] §4.2)
- [ ] **Pulizia `scripts/`**: >100 file. Archiviare i one-shot già usati in `scripts/_archive/`. Riduzione stimata 50-70 file. ~1h.
- [ ] **Bonifica `.env.*` multipli**: `.env`, `.env.bak`, `.env.example`, `.env.planetscale`, `.env.vps`. Mantenere solo `.env` (vivo) + `.env.example` (template SENZA segreti). Eliminare/archiviare altri.
- [ ] **Log rotation Winston**: `server.log` 5.7MB attivo + 1882 file in `logs/`. Configurare `winston-daily-rotate-file` con `maxFiles: '14d'` + `zippedArchive: true`. ~30 min.
- [ ] **Doc deployment frammentati**: 12 file MD in root (DEPLOYMENT.md, DEPLOY_PLESK.md, PLANETSCALE_SETUP.md, RAILWAY_SETUP.md, MYSQL_MIGRATION.md, ecc.). Mantenere `INIZIA_QUI.md` + 1 deploy ufficiale, archiviare resto in `_GAE_SVILUPPO/99_archivio/docs_storiche_root/`.
- [ ] **Anomalia F_*_ULTIMI_AGGIORNAMENTI duplicato**: 2 file F_ vivi nello stesso giorno (15/05). Regola 15 chiede UN solo file F_ vivo per giorno. Da archiviare il vecchio.

### 🔐 Priorità #8 — Sicurezza pre-go-live (da recap Cowork hub 15/05)

- [ ] 🔴 **Revocare GitHub PAT esposto**: token in chiaro in `.git/config` del repo. Da revocare su https://github.com/settings/tokens. Riconfigurare remote con credential helper o SSH. **Decisione Gaetano**: revisione a fine progetto.
- [ ] 🔴 **Revocare Anthropic API key esposta**: chiave in chiaro in `.env.example`. NON committata (coperta da `.gitignore`), ma rotabile. Da revocare su https://console.claude.com/settings/keys. Tenere key reale SOLO in `.env`. **Decisione Gaetano**: revisione a fine progetto.
- (Plus Security Audit Mythos pre-go-live → vedi Priorità FINALE sotto)

### 🔴 Priorità FINALE — Security Audit pre go-live SaaS (BLOCCANTE)

- [ ] 🛡️ **Security Audit con Claude Mythos via Project Glasswing** — ULTIMO task prima del go-live pubblico SaaS. 
  - **Quando**: appena StarGem è pronto per distribuzione esterna (oltre Geos SSDRL/Studio Gem Milano).
  - **Cosa**: richiedere accesso invitation-only a Project Glasswing di Anthropic (https://www.anthropic.com/glasswing). Mythos ha già identificato migliaia di zero-day vulnerabilities in software critici mondiali.
  - **Materiale da preparare**: codice sorgente (BE+FE), schema DB pseudo-anonimizzato, lista endpoint API + auth flow, architettura multi-tenant, schema OAuth/SSO/JWT se attivo.
  - **Workflow**: submit a Mythos → audit → implementare fix vulnerabilità → re-audit fino a clearance.
  - **Riferimenti**: [Mythos Preview](https://red.anthropic.com/2026/mythos-preview/) · [Project Glasswing](https://www.anthropic.com/glasswing).
  - **NON usare Mythos per**: sviluppo quotidiano (Opus 4.7 va bene), refactoring, architettura. SOLO security audit pre-rilascio.
  - **Decisione**: codificata in memoria persistente Cowork il 15/05/2026.

---

### Priorità #6 — Segnalazioni dal sito live (bug e migliorie note da Gaetano)

> Cartella screenshot/file: `_CLAUDE/05_allegati/_segnalazioni/`
> Convenzione: `SEG-NNN_<area>_<descrizione>.png`. AG legge i file in sola lettura.
> Stati: 🟡 aperta · 🔍 in indagine · 🔧 in fix · ✅ chiusa (con rif. F1-NNN o F2-NNN)

- [ ] 🟡 **SEG-001** GemStaff > Personal Trainer — Aperta 12/05/2026
  - **Cosa segnala Gaetano:**
    1. Manca il **contatore "n. record trovati"** in alto a destra della tabella
    2. La colonna **"Nome"** è unica ("MARCO MACCARI"): splittarla in **Cognome | Nome** + ordinamento ASC per cognome
  - **Screenshot:** `_CLAUDE/05_allegati/_segnalazioni/SEG-001_gemstaff_pt_contatore_e_split_cognome_nome.png`
  - **Pagina:** `/gemstaff` tab "Personal Trainer"
  - ⚠️ **Probabile pattern globale**: entrambi i problemi (contatore + split nome/cognome) si applicano potenzialmente a TUTTE le liste/tabelle del gestionale (Anagrafica, GemStaff Insegnanti, GemTeam, ecc.). Da considerare se fixare solo qui o produrre un componente riusabile (`<ListHeader>` con counter built-in + utility `splitFullName()`).

- [ ] 🟡 **SEG-002** Anagrafica Generale — Rinominare in "Utente" + classificazione — Aperta 12/05/2026 — 🆕 **modello concettuale tracciato 13/05 in [[classificazione_utenti_2026_05_13]]** (22 domande poste, risposte di Gaetano, caselle aperte per team e commercialista). Schema dati proposto: 3 entità radice (Person/Society/ExternalPayer), 3 ruoli transazione (Participant/Payer/BillingSubject), tessera unica stagionale, listino 2 livelli + override.
  - **Cosa segnala Gaetano:**
    1. Cambiare la parola **"Anagrafica"** con **"Utente"** in tutto il gestionale
    2. Classificazione utente (da PDF `2026_04_20_classificazione_stargem_v2.pdf`):
       - L'utente può essere: **persona fisica** o **società**
       - Può essere **tesserato** o **non tesserato**
       - Il tesserato può essere **partecipante/attivo** o **non partecipante/non attivo**
  - **Screenshot:** `_CLAUDE/05_allegati/_segnalazioni/SEG-002_anagrafica_rinominare_utente_classificazione.png`
  - **Pagina:** `/anagrafica-generale`
  - ⚠️ **Pattern globale + decisione architetturale**: rinominazione tocca menu, route, label, breadcrumb. La classificazione tocca lo schema dati (members + memberships + flags). Discussione di approfondimento prevista con Gaetano (vedi PDF in cartella `_segnalazioni/`).

- [ ] 🟡 **SEG-003** Pattern globale — Ordinamento alfabetico colonne in tutte le liste — Aperta 12/05/2026
  - **Cosa segnala Gaetano:** "Creare l'ordine alfabetico in tutte le colonne di tutte le sezioni del gestionale. Esiste già una regola applicata in altre sezioni (es. Anagrafica Generale): va estesa ovunque."
  - **Screenshot:** `_CLAUDE/05_allegati/_segnalazioni/SEG-003_pattern_globale_ordine_alfabetico_colonne.png`
  - **Pagina che ha attivato la segnalazione:** `/gempass` (Tesseramenti)
  - ⚠️ **Pattern globale, alta priorità UX**: serve un componente `<SortableHeader>` riusabile o estensione del DataTable corrente con sort default su ogni colonna. Sovrapposizione con SEG-001 (contatore record): valutare un unico componente `<ListPageHeader>` unificato.

- [ ] 🟡 **SEG-004** Anagrafica — Numeri telefono malformati (data quality) — Aperta 12/05/2026
  - **Cosa segnala Gaetano:** "Esempi di errori da segnalare e sistemare". Nel listing di `/anagrafica-generale` si vedono numeri di telefono in formato anomalo (es. `+3503058564668` 13+ cifre, `+3939999500086`, ecc.) — chiaramente sporcizia da import Athena.
  - **Screenshot:** `_CLAUDE/05_allegati/_segnalazioni/SEG-004_anagrafica_telefoni_errati_data_quality.png`
  - **Pagina:** `/anagrafica-generale` (lista)
  - ⚠️ **Data quality**: serve (1) validazione formato `+39XXXXXXXXXX` (10 cifre dopo prefisso) all'inserimento + (2) script di normalizzazione retroattiva sui record esistenti + (3) badge "telefono malformato" come pattern `data_quality_flag` (esiste già `tessera_mancante` ecc.).

- [ ] 🟡 **SEG-005** GemTeam Team > Collaboratori — Iniziali avatar nell'ordine sbagliato — Aperta 12/05/2026
  - **Cosa segnala Gaetano:** Cerchio rosso intorno alle iniziali avatar di "P. Agostino" che mostrano **"AP"** invece di **"PA"** (le iniziali sembrano nell'ordine errato).
  - **Screenshot:** `_CLAUDE/05_allegati/_segnalazioni/SEG-005_gemteam_avatar_iniziali_ordine_sbagliato.png`
  - **Pagina:** `/gemteam` tab "Team" filtro "Collaboratori"
  - 🔍 **DA CHIARIRE con Gaetano**: confermare l'interpretazione (è davvero un bug di ordinamento iniziali, o ha cerchiato per un altro motivo?). Plus: il nome "P. Agostino" è un caso speciale (nome puntato + cognome) che potrebbe richiedere logica dedicata.

- [ ] 🟡 **SEG-006** Utenti e Permessi — Account "agro" da bonificare — Aperta 12/05/2026
  - **Cosa segnala Gaetano:** Cerchio rosso e icona alert su un utente con username `agro`, nome completo "Genio Ago", cellulare incompleto. Sembra account di test/spazzatura da bonificare.
  - **Screenshot:** `_CLAUDE/05_allegati/_segnalazioni/SEG-006_utenti_permessi_account_agro_da_chiarire.png`
  - **Pagina:** `/utenti-permessi` sezione "Team e Personale Interno"
  - 🔍 **DA CHIARIRE con Gaetano**: confermare che l'account vada eliminato o solo segnalato + verificare se ci sono altri account simili da pulire (probabile pattern di data quality cleanup).

- [ ] 🟡 **SEG-007** GemStaff PT — Riferimento produzione (link con SEG-001) — Aperta 12/05/2026
  - **Cosa segnala Gaetano:** Screenshot della pagina `/personal` su `stargem.studio-gem.it` (PRODUZIONE) della stessa lista Personal Trainer di SEG-001. In produzione **Cognome e Nome sono già separati** e l'ordine è **ASC per cognome** (Bruzzese, Cattaneo, Maccari, Notaro, Palamara, Pallavenel).
  - **Screenshot:** `_CLAUDE/05_allegati/_segnalazioni/SEG-007_gemstaff_pt_produzione_riferimento.png`
  - 🔍 **DA CHIARIRE con Gaetano**: questo è un riferimento per dire "la produzione lo fa, il dev locale (SEG-001) deve essere allineato"? Oppure mostra che il fix è già parzialmente fatto in produzione e va portato anche in dev? Plus c'è una divergenza di UI sidebar tra le due versioni (potrebbe essere un'app diversa o branch diverso).

---

## 🚫 Bloccato / Decisioni pendenti

- [ ] **STRADA A/B/A+B per `/importa`** (campi dinamici JSON vs mappatore intelligente vs entrambi) — decisione Gaetano, vecchia dal 04/05
- [ ] **Re-import members/memberships/payments** — Gaetano sta organizzando i dati per re-import pulito
- [ ] **Drop colonne piatte F1-004** — bloccato fino a re-import + test approfondito post-refactor
- [ ] **UI FREEZE 12_Gemdario** — bloccato fino a fix bug raggruppamento Planning

---

## 🗑️ Archiviato / Cancellato

- ❌ **Reimport turni GemTeam** (Task 5 vecchia lista) — cancellato 11/05: Gaetano ha rimesso turni manualmente
- ❌ **Tab "Incolla Testo" in `/importa`** — bocciato 11/05 da F2 come inutile complicazione UX
- ❌ **Claude Code Agent Teams in parallelo** — bocciato 11/05 unanime F1+F2 per coupling troppo alto (merge conflict certi su routes.ts + maschera-input)
- ❌ **3 cartelle in `99_archivio/`** (`script_temporanei_root/`, `temp_import_root/`, `temp_project_complete_root/`) — lasciate dove sono come backup pre-pruning 01/05

---

*Aggiornata da Claude (Cowork) al 2026-05-13T17:00 (Subagent Documentazione — sync post F1-004 CHIUSO definitivamente, entrambi megaaudit Aree A-P completi)*
