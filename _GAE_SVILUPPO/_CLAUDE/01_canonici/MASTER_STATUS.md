# MASTER_STATUS — StarGem Suite
# Aggiornato: 2026_05_05_0858 (da Cowork/Claude — sessione di sincronizzazione)
# File di scambio centrale tra tutte le chat / sessioni.
# Fonte: file GAE_SVILUPPO A→G+Z (stato AG al 04/05) + MASTER_STATUS precedente (26/04) + audit DB 25/04
# Versione precedente archiviata: 99_archivio/2026_05_05_0858_MASTER_STATUS.md

---

## CHANGELOG 28/04 → 04/05 (NOVITÀ DA RECEPIRE)

> Ogni chat che apre una sessione DEVE leggere questa sezione prima di procedere.
> Le novità sotto sono già IMPLEMENTATE in produzione o in collaudo.

### 28/04 — Chat_24_DB_Monitor (chiusura F1-001 / F2-001)
- Monitoraggio DB e UI in tempo reale operativo
- Decisioni architetturali approvate:
  - Cattura modifiche AG → strategia IBRIDA (wrapper DB Pool + lettura binary log)
  - Mappa Frontend↔DB → strategia IBRIDA (`db-map-config.ts` statico in RAM + verifica notturna)
- DB Monitor genera ora segnalazioni che AG raccoglie in `_ANTIGRAVITY/01_status_continui/E_Segnalazioni_DB.md`

### 29-30/04 — Chat_08_Corsi (chiusura massiva)
- **18 protocolli F1 chiusi**:
  - F1-013-LIGHT: bonifica DT → visita_medica (2 record DT + 1.011 enrollments)
  - F1-015: magic strings DB-coerenti, riallineamento endpoints, fix filtro stagione
  - F1-017: 3 fix mirati su query calcolo numeri
  - F1-019: nuovo endpoint `/api/dashboard/attivita-panoramica`
  - F1-021: audit + mapping campi schede dominio (Domenica, Lezione Individuale, Campus)
  - Eliminato `/api/workshops` → sostituito da pattern flat
  - Aggiornato `/api/activities-summary` con filtro `seasonId`
- **23 protocolli F2 chiusi**:
  - F2-022 → F2-028
  - 6 tab accordion canoniche in `/iscritti_per_attivita`
  - Panoramica `/attivita` con tile alti
  - 6 pagine wrapper unificate
  - 5 schede dettaglio pattern `scheda-corso.tsx`
  - Fix anti-crash su contenitori generici (`2526ALLENAMENTO`)
- **Centralizzazione UI Liste**: `/elenchi` è ora hub di verità con 5 Aree Funzionali
  - Sync etichette tra maschera modifica e pannello gestione
  - Pagina `/elenchi` rimossa dal menu (rotta ancora attiva)

### 01/05 — Pruning Chirurgico (Knip + Graphviz)
- **270+ script test** spostati in `99_archivio/script_temporanei_root`
- **Cartelle orfane archiviate**: `temp_import`, `temp_project_complete`
- **7 tabelle orfane droppate** da `shared/schema.ts`:
  - `crmLeads`, `crmCampaigns`, ticket manutenzione (4 tabelle)
- **14 route fantasma rimosse** da `server/routes.ts`:
  - es. `pagodil-tiers`, `member-discounts`, relazioni varie
- **2 file inutilizzati** eliminati in `client/src/pages/`
- `npm run check` passato senza regressioni
- Dettaglio completo in `_ANTIGRAVITY/01_status_continui/Z_02_05_26_1130_Architettura_Pruned.md`

### 01/05 — Integrazione AI Enterprise (Fasi 1-4)
- **Fase 1 Osservabilità**: Sentry + PostHog live con API keys connesse (telemetria remota)
- **Fase 1 Backend AI**: Vercel AI SDK installato (`gpt-4o-mini`), tool configurati `searchMembers`, `searchCourses`
- **Fase 2 Frontend AI/UX**: Command Palette UX affinata, Magic Promo Button, Assistente Teo online, 404 unificate
- **Fase 3 Hard-RBAC**: i tool dell'assistente ereditano FISICAMENTE i permessi utente dal DB → blocco fughe dati sensibili (accesso bloccato ai client)
- **Fase 4 Logging Centralizzato**: `server/logger.ts` con winston, rotazione log JSON giornaliera in `/logs`
- **Fase 4 Disaster Recovery**: `scripts/backup-db.sh` notturno `.tar.gz`, retention 30 giorni
- **Fase 4 Anti-Bruteforce**: rate limiting operativo in `server/auth.ts`

### 02/05 — Operazioni Notturne (performance + sicurezza)
- **Performance**: `/api/stats/dashboard` e `/api/stats/alerts` riscritti con SQL Aggregation diretta → prevenzione OOM su dataset >5000 righe
- **Build TS**: 18 errori bonificati in `server/storage.ts` (join/alias) e `workshops.tsx` → `npx tsc --noEmit` ora **ZERO ERRORI**
- **Sospesi per sicurezza**: smantellamento `routes.ts` (12k righe) e `maschera-input-generale.tsx` (4.5k righe). Rischio corruzione dipendenze incrociate troppo alto. I file restano integri, si procederà modulo per modulo con supervisione manuale
- **Sicurezza Pagamenti**: blocco backend+frontend contro importi negativi, coerenza obbligatoria `Metodo/Data` quando stato è `Paid`

### 04/05 — Registro di Classe + Appello Veloce
- **API Bulk**: `POST /api/attendances/bulk` + `createAttendancesBulk` (inserimento massivo in singola transazione)
- **Vista Pivot**: refactor totale tab Presenze in `CourseUnifiedModal.tsx` — righe = allievi, colonne = ultime 5 date di lezione, eliminazione hover istantanea
- **Dialog "Fai l'Appello"**: registra classe intera con 1 click
- **Trigger Routing Rapido**: badge "0 presenze" in `scheda-attivita.tsx` apre modale con `defaultTab="attendances"` popolando subset iscritti attivi

### 04/05 — Listini Multi-Stagione + Checkout Bloccato
- **`courseQuotesGrid`**: aggiunta `season_id` (default 1) per isolare tariffari fiscalmente
- **`activity_types`**: sganciate dal frontend, collegate a `customLists` nel DB
- **`NuovoPagamentoModal`**: importo precompilato dal listino ufficiale e blindato in sola lettura (`readOnly`). Sconti applicabili SOLO via codici promozionali
- **Quote e Promo hub**: ora esclusivo per Listino, Promo, Welfare, Carnet, Convenzioni, Accordi. Prop drilling `seasonId` dal Root alle Tab figlie. `seasonId` introdotto anche in `promoRules`, `staffRates`, `welfareProviders`, `companyAgreements`

### 04/05 — Pagamenti Online estratti
- `OnlineTab` estratta in rotta indipendente `/pagamenti-online`
- AppSidebar: menu espandibile "Pagamenti Online" (Transazioni, Webhook Status, WC Mapping) sotto "Amministrazione & Cassa"

### 04/05 — Generazione PDF Ricevute/Fatture
- **jsPDF integrato client-side** in `TabRicevute`
- **Prefissi PDF**:
  - `2526-Rxxxxxx` → Ricevuta Istituzionale (Tessere, Quote Sociali)
  - `2526-Sxxxxxx` → Ricevuta Semplice (Corsi Commerciali, Servizi)
  - `2526-Fxxxxxx` → Fatture (Richieste esplicite / Aziende)
- Intestazione ufficiale Studio Gem (GEOS ssdrl, SDI, P.IVA) + Logo via DOM elements

### 04/05 — Calculated Lessons + Pacchetti Open
- `courses`: nuova colonna `calculated_lessons` (numero netto incontri didattici, esclude vacanze/ferie da `strategicEvents`)
- **25 record fantasma** rimossi da `courses` (privi di coordinate temporali) → `CourseDuplicationWizard` legge solo dati puliti
- **Pacchetti Open**: spostati a livello Prodotti Commerciali (`promoRules` + Liste `Quote`). L'iscrizione alle aule fisiche è disaccoppiata dall'incasso (carrello calcola 0€ se Pacchetto Open valido)

---

## DOMANDE APERTE DI GAETANO (DB Monitor — 04/05)

Da `_ANTIGRAVITY/01_status_continui/E_Segnalazioni_DB.md`. Antigravity deve rispondere a queste prima di procedere con altre cose:

1. **Dati tessere in tabella `members`** (intervallo colonne O-U) — perché non sono nella tabella preposta `memberships`?
2. **Certificati medici in tabella `members`** (intervallo V-W) — perché non sono nella tabella preposta `medical_certificates`?
3. **Colonna A** in `members` — a cosa serve? Numeri presi da dove?
4. **Colonna BA** in `members` — serve? "Eliminiamo id vecchi non servono"

Queste sono domande architetturali, non bug. Vanno indirizzate prima di toccare la tabella `members` (ricordo: regola DB → solo ADD COLUMN, mai modificare esistenti senza ordine esplicito).

---

## PROTOCOLLO AGGIORNAMENTO

Inizio sessione: leggi questo file + ANALISI_MASTER + tutti i file GAE_SVILUPPO (A→G+Z) + il `RECAP_NN_NomeChat.md` proprio (se esiste).

Fine sessione — template 4 campi obbligatori:

  ## [N]_[NomeChat] — aggiornato YYYY_MM_DD_HHMM
  Stato: [verde/giallo/rosso]
  Ultimo protocollo: F1-[NNN] / F2-[NNN]
  Tabelle DB toccate: [elenco]
  Pendenti: [cosa resta aperto]

---

## CONVENZIONE NOMI FILE

Formato: `YYYY_MM_DD_HHMM_nomefile.ext`
Il file più recente = data più alta nel nome.
Claude e Antigravity usano questo formato per TUTTI i file prodotti.
File "vivi" (MASTER_STATUS, A→Z, RECAP) hanno nome fisso senza timestamp; il timestamp lo metti solo quando archivi in `99_archivio/`.

---

## DEPLOY — REGOLA ASSOLUTA

1. Antigravity: `git commit` + `git push origin main` → STOP
2. Gaetano: `git pull` manualmente su Plesk → pubblica
Antigravity NON esegue mai `deploy-vps.sh`, ssh VPS, npm build VPS, pm2 restart.

---

## CLASSIFICAZIONE UTENTI (fonte: 2026_04_20_classificazione_stargem_v2.pdf)

```
UTENTE → members (tesserato / non tesserato / partecipante)
STAFF  → participantType INSEGNANTE | PERSONAL | PERSONAL_TRAINER (tessera obbligatoria)
TEAM   → team_employees con ruolo + mansione (tessera obbligatoria)
Sovrapposizione Staff+Team = 2 account separati (policy due cappelli)
```

---

## 14 ATTIVITÀ UFFICIALI

```
1.Corsi  2.Workshop  3.Prove a pagamento  4.Prove gratuite
5.Lezioni singole  6.Lezioni individuali  7.Domenica in movimento
8.Allenamenti  9.Affitti  10.Campus  11.Saggi
12.Vacanze studio  13.Eventi esterni  14.Merchandising

Calendario → attività con orario/spazio puntuale
Planning   → attività strategiche stagionali
Merchandising → escluso da calendari
```

---

## STATO DB — aggiornato 2026_05_05 (post-Pruning + Bonifica Chat_08)

Tabelle principali con record reali:
  members: 4.489 (import completo ✅)
    · 174 colonne totali (resta da chiarire utilità di intervalli O-U, V-W e colonne A, BA)
    · +13 nuove (albo, patente, tutor2, p_iva)
    · +52 campi Athena (P2)
    · +fattura_fatta, athena_id
  memberships: 3.305 (3.281 + 24 da bonifica) ✅
    · Tessere Athena duplicate rimosse (342)
    · Tessere Athena spostate in previous_membership_number (77)
    · Vincolo unicità: member_id + season_id
  enrollments: 13.584 ✅
    · 929 prove con season_id=1 assegnato
    · 1.011 record DT bonificati → visita_medica (Chat_08 F1-013-LIGHT)
    · 285 SKU riclassificati da storico
    · participation_type da uniformare (`corso` vs `STANDARD_COURSE`)
  payments: 3.775 ✅
    · Metodi: bonifico_poste 1.299 · bonifico_bpm 1.220 · cash 616 · contanti 518 · welcomekit 35 · online 32 · gbrh 55
    · Sicurezza pagamenti rinforzata 02/05: blocco importi negativi + coerenza Metodo/Data
  medical_certificates: 2.770 (+97 da bonifica) ✅
  courses: **561** (era 586, -25 record fantasma rimossi 04/05)
    · +calculated_lessons (esclude vacanze da strategicEvents)
  courseQuotesGrid: ✅ aggiunta season_id (default 1)
  users: 19 (account staff)
  seasons: 3 (24/25 · 25/26 · 26/27)
  team_employees: 16
  team_attendance_logs: 2.078
  team_scheduled_shifts: 17 (⚠️ wipe test — reimportare)
  team_shift_templates: 1 (⚠️ stesso problema)
  strategic_events: 74 (+ marcatura is_public_holiday)
  custom_list_items: 235 (post-Hard Wipe categorie)
  cities: 8.062 | provinces: 107
  promo_rules: 50 (+ seasonId) | price_matrix: 22 | company_agreements: 11 (+ seasonId)
  instructor_agreements: 8 | user_roles: 7
  studios: 13 | booking_services: 3
  audit_logs · access_logs · user_activity_logs (2.084 record): attive ✅

Tabelle DROPPED (Pruning chirurgico 01/05):
  crmLeads, crmCampaigns, ticket-related (4 tabelle) — totale 7 tabelle orfane

Tabelle a zero da tenere (moduli in sviluppo):
  studio_bookings · staff_presenze · staff_sostituzioni · payslips
  gem_conversations · gem_messages
  staff_contracts_compliance · staff_document_signatures

Flag qualità members da bonificare:
  tessera_mancante_da_assegnare: 1.322
  omonimo_da_verificare: 407
  mancano_dati_obbligatori: 198 (di cui 8 con CF totalmente mancante)
  nome_match: 179
  incompleto: 20
  CF mancante esplicito: BELLONI, BOCCHETTI, BURANI, CIONI, GIACOSA, GULIZIA, MONTANI, MOUTIQ

Backup recenti:
  CHAT22_CHIUSURA_DEFINITIVA_20260425_1005.sql (13MB)
  CHAT22B_PRE_CAPITALIZZAZIONE_20260425.sql
  CHAT22B_BONIFICA_OP1235_20260426.sql
  scripts/backup-db.sh notturno attivo (retention 30 giorni)

Criticità aperte:
  1. team_scheduled_shifts = 17 → reimportare turni reali da team_TURNI.xlsx
  2. team_shift_templates = 1 → stesso problema
  3. enrollmentId = null su ~3.200 pagamenti (collegati a persona ma non al corso specifico)
  4. participation_type non uniforme: 'corso' e 'STANDARD_COURSE' coesistono → uniformare in Chat_08
  5. routes.ts (12k righe) e maschera-input-generale.tsx (4.5k righe) — smantellamento sospeso per sicurezza

---

## OSSERVABILITÀ E SICUREZZA (NEW — 01/05/2026)

- **Sentry** + **PostHog**: telemetria remota live
- **Vercel AI SDK** (gpt-4o-mini): tool `searchMembers`, `searchCourses` operativi
- **Hard-RBAC** sui tool AI: ereditano permessi utente dal DB
- **winston logger** in `server/logger.ts`: log JSON giornalieri in `/logs`
- **Rate Limiting** in `server/auth.ts` (anti-bruteforce)
- **Backup notturno** automatico via `scripts/backup-db.sh` (retention 30 giorni)
- **TypeScript**: `npx tsc --noEmit` ZERO ERRORI

---

## EXPORT WIZARD — implementato 25/04/2026

  Componente: `client/src/components/ExportWizard.tsx`
  Formati: CSV + Excel XLSX (streaming ExcelJS, chunk 500 record)
  Strong typing colonne attivo (5 file)
  PDF: implementato 04/05 via jsPDF (TabRicevute) per ricevute/fatture
  Route backend: POST /api/export (streaming)
  Sezioni con ExportWizard: 10/10
    members · payments · accounting-sheet · courses · workshops · studio-bookings
    reports · gemteam · maschera-input · anagrafica-home
  REGOLA: ogni nuova sezione deve includere ExportWizard dall'inizio

---

## IMPORT UNIFICATO — aggiornato 26/04/2026

  Pagina: `/importa`
  Logica: file aggiornato vince sul DB per anagrafica
  Dry-run: ✅ anteprima prima di eseguire
  Report CSV: ✅ scaricabile post-import (con colonna Modifiche Applicate)
  Banner avviso normalizzazione step finale
  Smart Routing attivo:
    - QUOTATESSERA → memberships automatico
    - DTYURI / DTNELLA → medical_certificates auto
    - altri → enrollments con season_id forzato
  CF validator italiano (algoritmo checksum) attivo:
    - CF obbligatorio: blocco import se mancante
    - CF invalido: blocco import + warning dry-run
    - CF valido ma incongruente: warning
  Banner UI:
    - rosso: CF mancante/invalido
    - arancio: stagione mancante (+ pulsante assegna 25/26)
    - blu: Smart Routing stats
  Sanitizer attivo (`server/utils/sanitizer.ts`) su 5 route + webhook WC
  TZ=Europe/Rome su VPS

---

## STATO COMPLETO DI TUTTE LE CHAT

=== COMPLETATE / STABILI ===

00_errori — CHIUSA
  Protocolli: F1-099 / F2-113
  Lavori: STI completo, 0 errori TypeScript, fix multipli calendario/modal
  Tabelle: courses (DROP 16 silos legacy), categories migrate

00_DB_Cleanup — CHIUSA
  Lavori: activities svuotata (F1-006), universal_enrollments svuotata (F1-007),
          team_shift_templates_BAK_F1_030 rimossa (F1-032),
          16 tabelle silos legacy droppate (F1-063 da chat 00_errori),
          7 tabelle orfane droppate (Pruning 01/05)

01_quote e promozioni — FASE 1 CHIUSA (Fase 2 da fare)
  Protocolli: F1-014 / F2-011
  Lavori: 18 tabelle, 50 promo, 9 accordi insegnanti, 11 convenzioni,
          4 welfare provider, carnet_wallets, price_matrix (22), webhook WooCommerce
  AGGIORNAMENTI 04/05:
    - seasonId introdotto in promoRules, staffRates, welfareProviders, companyAgreements
    - Listino Multi-Stagione (courseQuotesGrid + season_id)
    - NuovoPagamentoModal: importo readOnly, sconti SOLO via codici promo
    - Hub /quote-promo con prop drilling seasonId
  Pendenti: F1-015 — StarGem → WooCommerce (catalogo in uscita)

02_GemStaff — COMPLETATA 13-14/04/2026
  Protocolli: F1-001→016 / F2-001→019
  Backup: gemstaff_DEFINITIVO
  Tabelle (6 create): staff_presenze, staff_sostituzioni, payslips,
    staff_contracts_compliance, staff_document_signatures, staff_disciplinary_log
  members: 5 colonne aggiunte (staff_status, lezioni_private_autorizzate, ecc.)
  users: 3 colonne auth (email_verified, otp_token, otp_expires_at)
  65 insegnanti + 6 PERSONAL_TRAINER mappati con staff_status = attivo
  /gemstaff con 6 Tab + /gemstaff/me + Email automatiche (in attesa SMTP)
  Deprecation warnings su /api/instructors

03_GemTeam — COMPLETATA (turni da reimportare)
  Protocolli: F1-023→035 / F2-015→016
  Lavori: Import turni, Dashboard 5 KPI, Check-in/Check-out, Full-Width Shift Grid,
          Esclusione silente botAI/admin, team_shift_templates_BAK_F1_030 rimossa
  PENDENTE CRITICO: team_scheduled_shifts = 17 (erano 225) e team_shift_templates = 1 (erano 550)
    Cancellati durante test E2E — reimportare da team_TURNI.xlsx

05_GemPass — COMPLETATA 12/04/2026
  Protocolli: F1-001→007 / F2-001→007 — 22/22 test superati
  Lavori: memberships ALTER (+is_renewal, +renewed_from_id, +notes),
          backfill 2218 record season_competence=2526,
          member_forms_submissions CREATE,
          API pubblica /api/public/membership-status/:code,
          formato tessera: 2526-000042 (con trattino)
  Pendenti: firma kiosk tablet (Phase 2), Fix UI campi nascosti (PRIORITA 1b)

08_corsi — RIPARTITA E CHIUSURA MASSIVA 29-30/04/2026
  Protocolli: F1-013-LIGHT → F1-021 (18 chiusi) + F2-022 → F2-028 (23 chiusi)
  Lavori: bonifica DT, magic strings, /api/dashboard/attivita-panoramica,
          6 tab accordion /iscritti_per_attivita, 6 wrapper pages,
          5 schede pattern scheda-corso.tsx, 3 schede ad hoc (Domeniche/LI/Campus),
          fix anti-crash 2526ALLENAMENTO, /elenchi hub di verità (5 Aree Funzionali)
  Pendenti: uniformare participation_type 'corso' vs 'STANDARD_COURSE'

10_Utenti / GemPortal — COMPLETATA 15/04/2026
  Protocolli: F1-001→014 / F2-001→012
  Backup: gemportal_COMPLETO_20260415_0759.sql (11MB)
  Lavori AUTH: 7 ruoli, login email|username, forgot-password anti user-enumeration,
    first-login redirect per ruolo, 14 staff @studio-gem.it email_verified
  Lavori GEMPORTAL: gem_conversations, gem_messages, member_uploads,
    TeoBot Claude SDK attivo (potenziato 01/05 con Vercel AI SDK + Hard-RBAC),
    7 route GemChat (A-G), badge GemChatBadge, /area-tesserati live
  Lavori ONBOARDING: F1-014 + F2-012, /registrati, GDPR, Tutori Minori,
    Age checking dinamico (TIMESTAMPDIFF server-side)
  NOTA: members reali = 4.489 (post Chat_22). L'import 9.400 e cancellato (dati sporchi) appartiene al passato

12_Gemdario — IN COLLAUDO (UI FREEZE)
  Protocolli ultimi: F1-016 / F2-031 (in corso)
  Lavori completati: STI 303 corsi migrati, bridge unifiedEvents, Calendario colori pieni
    Planning multi-stagione (Set-Ago), modal CourseUnifiedModal, TimeSlotPicker,
    PaymentModuleConnector con PIN, COPIA con campi rossi, conflitto anti-overlap rimosso (F1-094)
  AGGIORNAMENTI:
    - courses: +total_occurrences +active_on_holidays +internal_tags +calculated_lessons (04/05)
    - 25 record fantasma rimossi → courses ora 561
    - strategic_events: +is_public_holiday, +26 festività 25/26 e 26/27
    - custom_lists: stato_corso(13), tag_interni(6), tipo_partecipante(7), metodi_pagamento(1) + 10 nuove liste
    - InlineListEditor (Pennino A/B) standard globale
    - Pennini inline: stato_corso, interno_corso, categorie, metodi_pagamento, canale_acquisizione
    - 04/05: API bulk attendances + vista pivot Registro di Classe + Dialog "Fai l'Appello"
  Pendenti:
    - F2-031: 8 pennini rimanenti + rimozione /elenchi sidebar
    - Deploy Plesk + verifica visiva completa
    - B3bis: Planning corsi su festivi (verifica dopo deploy)
    - Stato Iscrizione: voci da popolare
    - Refactoring calendar.tsx (3.500 righe → sessione dedicata)
    - Navigazione history + breadcrumb tutte le pagine
    - Raggruppamento corsi Planning (bug MASTER) — ANCORA APERTO
    - Ricorrenza bisettimanale/mensile → Chat_08
  CONTINUARE IN: Chat_12B_Gemdario
  ATTENZIONE UI FREEZE — non modificare estetica fino a collaudo completato

22_Import_Export_dati — ✅ CHIUSA 25/04/2026
  Protocolli: F1-001→054
  Backup: CHAT22_CHIUSURA_DEFINITIVA_20260425_1005.sql (13MB)
  Logica import: MASTER > WORKSHOP > ATHENA > ElencoIscrizioni
  Lavori: import storico completo, ExportWizard 10 sezioni,
          /importa con dry-run, route legacy deprecate

22b_Bonifica_Dati — ✅ CHIUSA 26/04/2026 ore 18:00
  Protocolli: F1-001→010 / F2-001→007
  Backup: CHAT22B_BONIFICA_OP1235_20260426.sql
  Lavori: Audit 7.351 enrollments, 24 tessere create, 97 medical_certificates creati,
    285 SKU riclassificati, Smart Routing import (CF validator, season_id forzato),
    UI: Banner CF/stagione/Smart Routing, Badge CF MANCANTE in UI

24_DB_Monitor — ✅ AVVIATA E CHIUSURA F1/F2-001 — 28/04/2026
  Protocolli: F1-001 / F2-001
  Lavori: monitoraggio DB e UI in tempo reale
  Decisioni: cattura modifiche AG → IBRIDA (wrapper Pool + binary log),
             mappa Frontend↔DB → IBRIDA (db-map-config.ts + verifica notturna)
  Genera segnalazioni che AG raccoglie in E_Segnalazioni_DB.md

23_Log_Verifiche — 🟡 APERTA 24/04/2026
  Obiettivo: collegare audit_log UI, tracciamento azioni in tempo reale
  Tabelle esistenti: audit_logs · access_logs · user_activity_logs (2.084) · team_employee_activity_log · webhook_logs
  Pendenti: analisi struttura log, UI visualizzazione, popolamento automatico

INFRASTRUTTURA AI/OBSERVABILITY — ✅ ATTIVA 01/05/2026
  Sentry + PostHog · Vercel AI SDK (gpt-4o-mini) · Hard-RBAC tool · winston logger
  Rate Limiting auth · Backup-db.sh notturno
  Cross-cutting su Chat_21_TeoCopilot e tutti i tool AI

=== DA COMPLETARE / DA AVVIARE ===

PRIORITA 1b — Fix UI campi nascosti (chat dedicate)
  Vedi sezione "INFO SPECIFICHE PER CHAT DEDICATE" sotto

PRIORITA 2 — Reimportare turni GemTeam
  team_scheduled_shifts e team_shift_templates cancellati durante test
  Da reimportare da team_TURNI.xlsx prima dell'uso reale

PRIORITA 3 — 06_Contabilita_Cassa
  payments = 3.775 (storico importato ✅)
  Da fare: collegare UI cassa operativa, cash_registers, bank_deposits
  Sicurezza pagamenti rinforzata 02/05 ma UI cassa ancora da fare

PRIORITA 4 — 09_Workshop, 14_BookGem
  Stagione in apertura — schede WS urgenti (08_Corsi appena chiuso)

PRIORITA 5 — 04_MedGem, 07_Gemory
PRIORITA 6 — 11_Campus, 13_Domeniche, 15_Saggi, 16_VacanzeStudio
PRIORITA 7 — 17_Clarissa, 18_GemEvent, 19_GemNight, 20_MerchSG, 25_KB, 26_Dashboard, 27_TV

---

## ARCHITETTURA AUTH DEFINITIVA

```
members.user_id → FK → users.id (onDelete: set null)
user_id NULL = nessun account / user_id pieno = login attiva
Flusso: INSERT users → PATCH members.user_id = UUID
Ruoli (users.role testo libero): operator, admin, client, medico, insegnante, dipendente
user_roles: colonna si chiama 'name' (NON 'roleName')
Login: email O username + password
Policy due cappelli: doppio ruolo = 2 account separati
Hard-RBAC sui tool AI: ereditano permessi dal DB
```

---

## REGOLE DB INVIOLABILI

```
payments / PaymentModuleConnector → SENSIBILE — non toccare (14 route collegate)
members → solo ADD COLUMN (mai modificare esistenti)
courses → non toccare struttura STI
enrollments → tabella iscrizioni UFFICIALE (universal_enrollments droppata)
Categorie → custom_lists + custom_list_items (no nuove tabelle *_cats)
Backup → obbligatorio dopo ogni F1 che modifica il DB
3 SKU storico INTOCCABILI: 2526QUOTATESSERA, 2526DTYURI, 2526DTNELLA (contenitori import)
```

---

## AREE SENSIBILI — NON TOCCARE

```
PaymentModuleConnector — impatta 14 route
Tessere / parser barcode — non modificare
Calendario — UI FREEZE — non abbellire fino a collaudo completato
routes.ts (12k righe) — smantellamento SOSPESO 02/05 per dipendenze incrociate
maschera-input-generale.tsx (4.5k righe) — stesso motivo
```

---

## INFRASTRUTTURA

```
VPS: IONOS 82.165.35.145
DB: stargem_v2 su MariaDB 11.4 port 3306 (VPS) / 3307 (SSH tunnel locale)
App: pm2 porta 5001, nome app: stargem
Nginx: reverse proxy su stargem.studio-gem.it
Deploy: git push → Plesk git pull manuale → npm run build → pm2 reload stargem
Backup path: /root/backups/ sul VPS (via SSH mysqldump)
Backup notturno automatico: scripts/backup-db.sh (.tar.gz, retention 30 giorni)
TZ=Europe/Rome su VPS (.env + pm2)
Logging: winston in server/logger.ts → /logs (rotazione giornaliera JSON)
Rate Limiting: server/auth.ts attivo
Telemetria: Sentry + PostHog live
```

---

## INFO SPECIFICHE PER CHAT DEDICATE

→ **Chat_05_GemPass**:
  Leggi: D_2026_04_25_1215_Stato_DB_Reale.md, D2_2026_04_25_1215_Stato_Mappa_Frontend.md
  memberships ora ha 3.305 record
    membership_type (ENDAS/OPES/LIBERTAS) · issue_date · season_id · fee
  DA CREARE: tabella membership_events
  DA CREARE: bottone "Dati da verificare" (1.322 tessere mancanti)
  DA CREARE: funzione "Assegna Tessera" rapida
  season_id FK: seasons.id (1=25/26, 2=26/27, 3=24/25)
  Badge CF MANCANTE attivo (8 membri: BELLONI, BOCCHETTI, BURANI, CIONI, GIACOSA, GULIZIA, MONTANI, MOUTIQ)

→ **Chat_10_Utenti/Anagrafica** (DOPO Chat_05):
  CF validator algoritmo italiano in shared/utils/cf-validator.ts
  Validazione CF obbligatoria all'import
  sanitizer.ts: UPPER/LOWER/TITLE CASE attivo su members
  members ha 174 colonne — 54+ non mostrate in UI (vedi PRIORITA 1b)
  Badge flag qualità da implementare per bonifica dati
  ATTENZIONE: domande aperte di Gaetano sulla struttura tabella (intervalli O-U, V-W, colonne A, BA)

→ **Chat_06_Contabilità** (AGGIORNA):
  payments ha 3.775 record con 10+ campi non visibili in UI (vedi PRIORITA 1b)
  Sicurezza pagamenti rinforzata 02/05: blocco importi negativi, coerenza Metodo/Data
  ExportWizard già integrato in accounting-sheet.tsx e payments.tsx
  Generazione PDF Ricevute/Fatture attiva (jsPDF, prefissi R/S/F)
  2526GIFT (21 iscrizioni) = buono_regalo (sezione dedicata da fare)
  Rollback import pagamenti pendente (ALTA PRIORITÀ)
  Smart Routing: pagamenti NON passano più per enrollments per errore
  /pagamenti-online estratta in rotta indipendente

→ **Chat_08_Corsi/Iscritti** (APPENA CHIUSA chiusura massiva 29-30/04):
  enrollments ha 13.584 record — status tutti 'active'
  participation_type 'corso' e 'STANDARD_COURSE' da uniformare
  285 SKU riclassificati da storico (27 workshop, 19 dom_mov, 14 corso, ecc.)
  3 SKU storico contenitori: QUOTATESSERA, DTYURI, DTNELLA — non toccare
  Smart Routing attivo
  6 tab accordion in /iscritti_per_attivita
  6 wrapper pages + 5 schede dettaglio pattern scheda-corso.tsx
  Vista Pivot Registro di Classe + API bulk attendances (04/05)

→ **Chat_12_Gemdario** (IN COLLAUDO):
  ⚠️ UI FREEZE — non modificare estetica
  Raggruppamento corsi nel Planning sparito — da investigare (BUG MASTER)
  Non toccare calendar.tsx, attivita.tsx fino a collaudo
  courses ora 561 (post-pruning fantasmi)
  Dialog "Fai l'Appello" attivo

→ **Chat_23_Log** (APERTA):
  Tabelle log esistenti: audit_logs · access_logs · user_activity_logs (2.084)
  team_employee_activity_log · webhook_logs
  Prima azione: analizza struttura, verifica popolamento da routes, costruisci UI

→ **Chat_24_DB_Monitor** (CHIUSA F1/F2-001):
  Cattura modifiche AG: wrapper Pool + binary log (IBRIDA)
  Mappa Frontend↔DB: db-map-config.ts statico + verifica notturna (IBRIDA)
  Segnalazioni operatore in E_Segnalazioni_DB.md (4 domande aperte di Gaetano sulla tabella members)

→ **Chat_21_TeoCopilot** (POTENZIATA 01/05):
  Vercel AI SDK gpt-4o-mini + tool searchMembers/searchCourses
  Hard-RBAC: tool ereditano permessi utente dal DB
  Magic Promo Button + Command Palette + Assistente Teo online
  RBAC blocca fughe dati sensibili (client non vede dati altri)

→ **FUTURO — Delta import metà maggio**:
  Fonte: GSheets aggiornato (stesso formato MASTER)
  Modalità: --solo-nuovi (salta CF già presenti)
  Sezione /importa già pronta con logica aggiornamento

→ **FUTURO — P5 STAFF insegnanti**:
  File: STAFF__PERSONAL__ALTRI.xlsx
  Campi: social, diploma, drive folder
  Da fare in sessione separata
