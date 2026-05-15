---
aggiornato: 2026-05-15T08:00
ultima_verifica_vs_codice: 2026-05-15T08:00
validita_prevista: indice progressivo, sempre attuale
tipo: indice-tracciamento
tags: [index, antigravity, prompt-tracking]
---

# 📑 INDEX PROMPT Claude → Antigravity

> Numerazione progressiva avviata il 2026-05-11 (regola 18 del [[00_LEGGIMI]]).
> AG deve riportare il numero del prompt nelle risposte e nei nomi dei file di output.
> Collegato: [[00_INDEX]] · [[CHECKLIST_PROGETTO]] · [[MASTER_STATUS]]

## Asse F1 (Backend)

| # | Data e ora | Topic | Stato | Output prodotto |
|---|---|---|---|---|
| F1-001 | 2026-05-11T19:30 | Audit Anagrafica Backend approfondito | ✅ CHIUSO 2026-05-12T00:18 | [[audit_F1-002_anagrafica_approfondito_2026_05_11]] (AG ha usato numerazione retrospettiva nel filename, il prompt resta F1-001) |
| F1-002 | 2026-05-12T01:10 | Refactor Anagrafica Fase 1: letture → JOIN | ✅ CHIUSO 2026-05-12T02:25 (4/4 fix) | [[report_F1-002_anagrafica_letture_join_2026_05_12]] |
| F1-003 | 2026-05-12T02:40 | Quick Wins Performance Backend: indici SQL + fix N+1 GemTeam | ✅ CHIUSO 2026-05-12T13:52 (189ms delta in dev) | [[report_F1-003_quick_wins_performance_2026_05_12]] |
| F1-004 | 2026-05-12T14:05 | 🎯 Megaaudit Flusso Iscrizioni/Rinnovi/Acquisti BACKEND (16 aree A-P, ~10-15h, 4 sessioni) | ✅ MEGAAUDIT BACKEND CHIUSO 2026-05-13T16:39 | [[audit_F1-004_flusso_iscrizioni_backend_2026_05_12]] |
| F1-005 | 2026-05-13T17:30 | Mini-task validazione formula numero tessera vs Google Sheet | ✅ CHIUSO 2026-05-13T18:00 — VERDETTO **DIVERGENTE + BUG GRAVE** (padding sdoppiato 4 vs 6 cifre, bug expiry su `/api/gempass/tessere`, CF doppio silent merge) | [[report_F1-005_validazione_formula_tessera_2026_05_13]] |
| F1-007 | 2026-05-13T18:30 | Bug fix critico `/api/gempass/tessere` + censimento dati corrotti + script bonifica dry-run | ✅ CHIUSO 2026-05-13T19:30 — Patch 2 applicato (tsc 0), 0 record corrotti su dev (DB svuotato), script bonifica conservativo creato con db.update commentate | [[report_F1-007_bugfix_gempass_e_bonifica_2026_05_13]] + [[script_bonifica_F1-007_tessere_corrotte]] |
| F1-008 | 2026-05-13T19:30 | Patch 1 (padding 6 cifre unificato) + Patch 3 (depreca `/api/gempass/tessere` strategia B) | ✅ CHIUSO 2026-05-13T20:00 — tsc 0, season.test verdi, 4 chiamate `client/src/pages/gempass.tsx` da migrare in F2 futuro | [[report_F1-008_unificazione_tessere_2026_05_13]] |
| F1-006 | 2026-05-13T20:30 | MC1 Memory Leak Base64 BACKEND Fase 1 ANALISI+PIANO | ✅ CHIUSO 2026-05-13T21:30 — piano refactor 5.5h, 3 decisioni prodotto pendenti (Storage type, Auth, Migration strategy) | [[piano_F1-006_memory_leak_base64_backend_2026_05_13]] |
| F1-009 | 2026-05-13T22:00 | Rimozione fisica endpoint `/api/gempass/tessere` (deprecato) | ✅ CHIUSO 2026-05-13T22:30 | [[report_F1-009_rimozione_gempass_tessere_2026_05_13]] |
| F1-010 | 2026-05-13T23:30 | MC1 BE Fase 2 ESECUZIONE (schema migration + endpoint upload + script bonifica + cron) | ✅ CHIUSO 2026-05-13T23:55 + integrato in F1-014 | [[report_F1-010_mc1_base64_be_fase2_2026_05_13]] |
| F1-012 | 2026-05-13T19:30 | Fix DB GemTeam error + chiusura formale F1-010 + compat FE/BE photoUrl/avatarUrl | ✅ CHIUSO 2026-05-13T19:50 | (integrato in report F1-010) |
| F1-013 | 2026-05-13T NOTTURNO | MC3 Pagamenti Relazionali ANALISI+PIANO | ✅ CHIUSO 2026-05-14T01:00 — 5 domande commercialista in coda | [[piano_F1-013_mc3_pagamenti_relazionali_2026_05_13]] |
| F1-014 | 2026-05-14T02:00 | MC1 BE chiusura: endpoint POST upload + GET auth misto JWT + 410 Gone legacy | ✅ CHIUSO 2026-05-14T05:30 | [[report_F1-014_endpoint_upload_auth_misto_2026_05_13]] |
| F1-015 | 2026-05-14T NOTTURNO | MC2 Pratica/Stepper BACKEND ANALISI+PIANO | ✅ CHIUSO 2026-05-14T07:30 — 5 domande operative | [[piano_F1-015_mc2_pratica_stepper_be_2026_05_13]] |
| F1-016 | 2026-05-14T09:00 | MC2 BE Fase A ESECUZIONE (schema dossiers + endpoint CRUD + business rules + script retroattivo 12 mesi) | ✅ CHIUSO 2026-05-14T13:30 | [[report_F1-016_mc2_fase_a_esecuzione_2026_05_14]] |
| F1-017 | 2026-05-14T16:00 | MC3 Fase A ESECUZIONE (external_payers + societies + payment_participants + payments expanded + helper documentType) | ✅ CHIUSO 2026-05-14T18:10 + 4 scenari test OK (madre 2 figlie, scuola danza, Comune, gift card) | [[report_F1-017_mc3_fase_a_esecuzione_2026_05_14]] |
| F1-018 | 2026-05-14T19:30 | Verifica operativa BE MC1+MC2+MC3 — 3 bug critici emersi | ✅ CHIUSO 2026-05-14T20:25 — pass/fail per test | [[verifica_F1-018_BE_post_fase3_2026_05_14]] |
| F1-019 | 2026-05-14T20:30 | FIX 3 bug critici BE (attachments_url rinomina, createdBy VARCHAR, MC3 snake/camel, /api/health) | ✅ CHIUSO 2026-05-14T20:50 — tsc 0, curl test 200/201 | [[report_F1-019_fix_bug_critici_BE_2026_05_14]] |
| F1-020 | 2026-05-14T21:00 | Verifica /importa + decision pack STRADA A/B/A+B per Lotto 1 anagrafica | ✅ CHIUSO 2026-05-14T21:30 — Raccomandata STRADA B con fix CF | [[report_F1-020_verifica_importa_decision_pack_2026_05_14]] |
| F1-022 | 2026-05-15T08:00 | FIX 2 bug critici Test E2E (PATCH step "not found" + upload mkdir recursive) | 🟡 IN CORSO | (atteso) |

## Asse F2 (Frontend)

| # | Data e ora | Topic | Stato | Output prodotto |
|---|---|---|---|---|
| F2-001 | 2026-05-11T19:30 | Audit Anagrafica Frontend approfondito | ✅ CHIUSO 2026-05-12T00:15 | [[audit_F2-002_anagrafica_approfondito_2026_05_11]] (numerazione retrospettiva) |
| F2-002 | 2026-05-12T01:10 | Refactor Anagrafica Step 1: Zustand migration (dismissione CrmFormContext) | ✅ CHIUSO 2026-05-12T13:05 | [[report_F2-002_anagrafica_zustand_migration_2026_05_12]] |
| F2-003 | 2026-05-12T13:35 | 🎯 Megaaudit Flusso Iscrizioni/Rinnovi/Acquisti FRONTEND (16 aree A-P, ~10-15h, 4 sessioni) | ✅ MEGAAUDIT CHIUSO 2026-05-13T11:54 — vedi [[audit_F2-003_flusso_iscrizioni_frontend_2026_05_12]] + Sintesi finale | [[audit_F2-003_flusso_iscrizioni_frontend_2026_05_12]] |
| F2-004 | 2026-05-13T18:30 | MC1 Memory Leak Base64 FRONTEND — Fase 1 ANALISI+PIANO | ✅ CHIUSO 2026-05-13T19:30 — 3 decisioni prodotto in coda Gaetano | [[piano_F2-004_memory_leak_base64_frontend_2026_05_13]] |
| F2-005 | 2026-05-13T20:30 | Migrazione 4 chiamate `/api/gempass/tessere` → `/api/memberships` | ✅ CHIUSO 2026-05-13T21:30 — tsc 0, grep frontend = 0 match, endpoint deprecato pronto per rimozione fisica BE | [[report_F2-005_migrazione_gempass_to_memberships_2026_05_13]] |
| F2-006 | 2026-05-13T22:00 | SEG-001 ListPageHeader + splitFullName (pattern globale tabelle) | ✅ CHIUSO 2026-05-13T22:45 | [[report_F2-006_seg001_listheader_e_splitname_2026_05_13]] |
| F2-007 | 2026-05-13T NOTTURNO | MC1 Memory Leak Base64 FRONTEND Fase 2 ESECUZIONE (hook useFileUpload + FileUploadInput + refactor 4 componenti) | ✅ CHIUSO 2026-05-14T06:30 — Base64 azzerato end-to-end | [[report_F2-007_memory_leak_base64_frontend_2026_05_13]] |
| F2-008 | 2026-05-13T22:50 | Replica ListPageHeader su 4 call site (members, gemstaff, courses, gemteam) | ✅ CHIUSO 2026-05-13T23:30 | (integrato F2-006) |
| F2-009 | 2026-05-14T NOTTURNO | SortableHeader colonne globale + useSortableList | ✅ CHIUSO 2026-05-14T07:45 + 14 altri call site segnalati | (integrato in F2-011) |
| F2-011 | 2026-05-14T NOTTURNO | Quick Win Pack UI 4 task (SEG-004 telefoni + SortableHeader 4 pagine + SEG-002 label rinomina + 3 HelpTooltip) | ✅ CHIUSO 2026-05-14T08:30 | [[report_F2-011_quick_win_pack_ui_2026_05_13]] |
| F2-012 | 2026-05-14T09:00 | MC2 Stepper UI FRONTEND ANALISI+PIANO | ✅ CHIUSO 2026-05-14T13:00 — 3 decisioni prodotto | [[piano_F2-012_mc2_stepper_ui_2026_05_14]] |
| F2-013 | 2026-05-14T16:00 | MC2 Stepper UI ESECUZIONE (WizardStepper + useDossierWizard + 6 step + DashboardDossiers + routing + sidebar) | ✅ CHIUSO 2026-05-14T18:50 — Wizard end-to-end funzionante | [[esecuzione_F2-013_mc2_stepper_ui_2026_05_14]] |
| F2-014 | 2026-05-14T19:30 | Verifica operativa FE — 11 errori TS + HelpTooltip + Banner | ✅ CHIUSO 2026-05-14T20:25 — pass/fail per test | [[verifica_F2-014_FE_post_fase3_2026_05_14]] |
| F2-015 | 2026-05-14T20:30 | FIX 11 errori TS + crea HelpTooltip + Banner dismissione maschera classica | ✅ CHIUSO 2026-05-14T20:55 — tsc 0, npm build OK | [[report_F2-015_fix_ts_helptooltip_banner_2026_05_14]] |
| F2-016 | 2026-05-14T21:00 | TEST INTEGRATO Wizard E2E (7 scenari + screenshot) — 2 bug critici emersi | ✅ CHIUSO 2026-05-14T22:00 — Verdetto NON pronto uso reale (2 bug) | [[test_F2-016_integrato_wizard_e2e_2026_05_14]] |

---

## Storico pre-regola 18 (numerazione retrospettiva nei nomi file)

Prima di codificare la regola 18, AG aveva già usato numerazione interna nei nomi dei file di output:

- [[stato_di_fatto_F1_backend_2026_05_11]] — audit iniziale F1 post-reset
- [[stato_di_fatto_F2_frontend_2026_05_11]] — audit iniziale F2 post-reset
- [[strategic_review_F1_backend_2026_05_11]] — archivio reset
- [[strategic_review_F2_frontend_2026_05_11]] — archivio reset
- [[report_F2-001_fix_4_errori_ts_2026_05_11]] — fix TS pre-rinumerazione

Plus nei file faro `_ANTIGRAVITY/01_status_continui/`:
- [[A_2026_05_11_Architettura_Core_Server]]
- [[B_2026_05_11_Frontend_Moduli]]
- [[C_2026_05_11_Stato_Lavori_e_Briefing]]
- [[D_2026_05_11_Mappa_Dati_e_Frontend_BACKEND]]
- [[D_2026_05_11_Mappa_Dati_e_Frontend_FRONTEND]]
- F_*_ULTIMI_AGGIORNAMENTI (cambia nome ad ogni aggiornamento per timestamp)
- [[G_2026_05_11_Checklist_Operativa_F1]]
- [[G_2026_05_11_Checklist_Operativa_F2]]
- [[H_2026_05_11_Design_System]]
- [[I_03_05_26_1605_Fase3_Mappatura_Iscrizioni]]
- [[Z_2026_05_11_Performance_File_Pesanti_BACKEND]]

Tutta questa documentazione storica è valida e referenziabile. La nuova numerazione F1-NNN / F2-NNN parte pulita da 001 dopo questo indice.

---

## Prompt aperti

I file in `_CLAUDE/04_per_antigravity/`:

- [[00_PROMPT_STATO_DI_FATTO_2026_05_11]]
- [[01_PROMPT_FIX_TS_E_AUDIT_ANAGRAFICA_2026_05_11]]
- [[02_PROMPT_RICOSTRUZIONE_FARO_E_PERFORMANCE_2026_05_11]]
- [[03_PROMPT_AUDIT_FLUSSO_ISCRIZIONI_2026_05_12]] — F1-004 + F2-003 (megaaudit)
