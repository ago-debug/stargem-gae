---
aggiornato: 2026-05-15T12:10
ultima_verifica_vs_codice: 2026-05-15T12:10
validita_prevista: 3 giorni (scade 2026-05-18T12:10)
tipo: recap-sessione-cowork
fonti_verificate:
  - "[[MASTER_STATUS]] (2026-05-11)"
  - "[[CHECKLIST_PROGETTO]] (2026-05-15T08:00)"
  - "[[F_2026_05_15_1158_ULTIMI_AGGIORNAMENTI]]"
  - "[[F_2026_05_15_1150_ULTIMI_AGGIORNAMENTI]]"
  - "[[00_LEGGIMI]] (22 regole)"
  - "package.json + .gitignore + .env.example + git remote (letti vs codice)"
---

# RECAP — Sessione Cowork Diagnostica HUB — 2026-05-15

> Aggiornato: 2026_05_15_1210
> Stato sessione: ✅ Diagnostica completata, decisione prossima mossa in mano a Gaetano
> Ultimo protocollo eseguito da AG: **F1-023** (Diagnostica parsing CSV Athena + ottimizzazione Auto-Mapping, chiuso 12:38)

---

## 1. SCOPO E PERIMETRO

Sessione Cowork (chat "StarGem · Cowork operativo") aperta da Gaetano per:
1. Ricevere accesso diretto in lettura al monorepo `StarGem_manager/` (cartella `_GAE_SVILUPPO/` inclusa)
2. Fare diagnostica reale dello stato del progetto basata su codice + file vivi del vault (non più ipotesi a memoria)
3. Produrre questo recap da consegnare all'altra chat Cowork ("StarGem · Setup Cowork e ripresa AG") che parla operativamente ad AG

**Non perimetro:** scrittura codice, modifica file di `_GAE_SVILUPPO/` (questa Cowork ha fatto SOLO lettura su tutto + scrittura SOLO di questo recap su esplicita richiesta).

---

## 2. STATO ATTUALE DEL PROGETTO (al 2026-05-15T12:38)

### ✅ Chiuso nelle ultime 24-48h (catena di valore alta)

- **MC1 Memory Leak Base64** chiuso end-to-end (BE+FE). Eradicati Base64+canvas+FileReader dal core, sostituiti con FormData multipart + URL relative + cron cleanup orfani. Auth misto sessione+JWT signed URL su `/uploads/*`.
- **MC2 Pratica/Stepper Wizard** chiuso end-to-end. Schema `dossiers` + `dossier_steps` + `dossier_audit_log`, endpoint CRUD, business rules hard-coded, WizardStepper UI con 6 step, DashboardDossiers, banner dismissione maschera classica con bottone "Provala ora".
- **MC3 Pagamenti Relazionali Fase A BE** chiusa. Schema `external_payers` + `societies` + `payment_participants` + `payments` esteso (payer_id/billing_subject_id/document_type/payment_group_id/gift_card_amount). Endpoint `/api/payments/multi-participant`. 4 scenari test verdi (madre 2 figlie, scuola danza, Comune, gift card).
- **Quick Win UI cross-pagina**: `ListPageHeader` + `splitFullName` + `SortableHeader` + `PhoneBadge` + `HelpTooltip` propagati su 4 pagine principali CRM.
- **/importa Lotto 1 UI** chiuso oggi 11:58 (F2-018: chunking 500 righe + progress bar + `onbeforeunload` + componente `StoriaProvenienzaTab.tsx` che unisce import batch + legacy Athena/Master + audit logs).
- **F1-023 Auto-Mapping CSV Athena** chiuso oggi 12:38: dizionario alias + normalizzazione + Levenshtein ≤2 → 35/40 colonne mappate auto.
- Validazione: `npx tsc --noEmit` = 0 errori, `npm run build` OK.

### 🟡 In corso

- **F1-022** — Fix 2 bug critici emersi nel test E2E [[test_F2-016_integrato_wizard_e2e_2026_05_14]]:
  - `PATCH /step` "not found" (mancato inserimento iniziale steps in Drizzle o disallineamento parametri)
  - Upload referenzia URL corretti ma file finiscono in `404` per `mkdir` non ricorsivo su `uploads/`
  - Bloccante per chiusura validazione E2E MC1+MC2+MC3 completa.

### 📋 In coda — Priorità ordinate

**P1 — Anagrafica refactor Fase 3** (megaaudit chiusi, refactor 6 step parallelizzabili)
- F2-003 Step 2 (schemi Zod condivisi in `shared/` + react-hook-form)
- F2-004 Step 3 (chunked saves debounced)
- F1-004 Backend Fase 3 (DROP colonne piatte — DISTRUTTIVA, post re-import)

**P2 — Quick wins performance backend**
- PhotoUrl Base64 nel payload `/api/gemteam/dipendenti` (payload 2.8MB, refactor 2-3h F1+F2)

**P3 — MC3 Fase A FE** (6-8h) — `NuovoPagamentoModal` multi-participant + Society + ExternalPayer + Gift Card UI. **Catena monca: BE pronta, FE assente.**

**P3 — Audit Pagamenti F1+F2** (stesso schema usato per Anagrafica)
**P3 — Audit Calendario/Planning F1+F2** + fix bug raggruppamento Planning + UI FREEZE 12_Gemdario

**P3.5 — 🎯 Listino Prezzi Parametrico (Quote_Param) — IMPORTANTE**
Priorità dichiarata di Gaetano dell'11/05, FERMA da 4 giorni. Le 3 fonti chiave ancora in `99_archivio/2026_05_11_RESET_TOTALE/_CLAUDE/03_recap_chat/`:
- [[16_RECAP_COMPLETO_QUOTE_PARAM_E_QUOTE_CORSI]]
- [[17_PROMPT_HANDOFF_PER_NUOVA_CHAT_ANALISI_QUOTE_PARAM]]
- [[18_SCHEMA_OPERATIVO_QUOTE_PARAM_PRONTO_USO]]

Proposal Subagent del 12/05 in [[proposal_Quote_Param_2026_05_12]] con 5 domande aperte (Q1-Q5) per Gaetano, da riverificare contro `shared/schema.ts` (128KB) prima di emettere prompt F1-NNN.

**P4 — Performance frontend**: bundle size, eliminazione `googleapis` 189MB, spacchettamento `shared/schema.ts` 128KB in 5 file logici

**P5 — Smantellamento monolite `routes.ts`** (12.259 righe, ~5.300 solo `/api/gemteam/*`) — big bet a beneficio enorme

**FINAL — 🔴 Security Audit Mythos pre-go-live SaaS** (bloccante go-live pubblico)

### 🚫 Bloccato — Decisioni pendenti per Gaetano

- **STRADA A/B/A+B per `/importa`** — vecchia dal 04/05. F1-020 (14/05) raccomanda **STRADA B**. Manca OK esplicito.
- **Re-import members/memberships/payments** dal VPS IONOS porta 3306 (dati produzione intatti) verso DEV porta 3307 (svuotato di proposito). Gaetano sta organizzando i dati.
- **DROP colonne piatte F1-004** — bloccato fino a re-import + test post-refactor
- **UI FREEZE 12_Gemdario** — bloccato fino a fix bug raggruppamento Planning

### 📌 Segnalazioni utente in coda (SEG)

7 segnalazioni aperte (SEG-001 → SEG-007) dal sito live in `_CLAUDE/05_allegati/_segnalazioni/`. SEG-005, SEG-006, SEG-007 richiedono chiarimenti da Gaetano.

---

## 3. STACK CONFERMATO (vs codice reale)

**Backend** Express 4 + tsx + Drizzle ORM + MySQL (mysql2) + Redis (ioredis) + Passport + JWT + Winston (+ daily rotate) + Nodemailer + Multer + Sentry
**Frontend** React 18 + Vite + Tailwind + Radix UI (shadcn) + TanStack Query + Zustand + Wouter + React Hook Form + Zod + Framer Motion + Recharts + DnD Kit
**AI** Anthropic SDK + OpenAI SDK + Vercel AI SDK + Google APIs
**File** ExcelJS + XLSX + jsPDF + PapaParse + html2canvas + multer
**Test** Playwright (E2E) + Vitest
**Quality** ESLint + Prettier + Husky + lint-staged + Knip (dead code) + Madge (architettura) + ts-morph
**Analytics** PostHog

**Conclusione:** setup professionale completo. I fondamentali engineering ci sono tutti. Lavoro mancante è prodotto/architettura, non tooling.

---

## 4. PULIZIE & MIGLIORIE IDENTIFICATE (non urgenti ma da fare)

### 4.1 🔴 SICUREZZA — Segreti esposti (decisione Gaetano: revocare a fine progetto)

- **GitHub PAT in chiaro** in `.git/config` del repo, remote `github`:
  ```
  https://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@github.com/ago-debug/stargem-gae.git
  ```
  Da revocare su https://github.com/settings/tokens. Riconfigurare remote con credential helper o SSH.
- **Anthropic API key in chiaro** in `.env.example` riga 12 (`sk-ant-api03-yJUUF4Ll95sbjxUgqOGltwDdRhj6...`). NON committato (coperto da `.env.*` in `.gitignore`), ma comunque rotabile. Da revocare su https://console.anthropic.com/settings/keys. Tenere key reale SOLO in `.env`, mai in `.env.example`.

Aggiungere a [[CHECKLIST_PROGETTO]] sotto "Sicurezza pre-go-live".

### 4.2 🟡 IGIENE CODEBASE — Root inquinata

Decine di file scratch/test/fix/audit/patch lasciati a livello root del repo (visibili da `ls`):
- `scratch.ts`, `scratch.tsx`, `scratch_attendances.tsx`, `scratch_diff.txt`, `scratch_read_excel.ts`, `scratch_ui.tsx`, `scratch2.ts`
- `fix_import_route.ts`, `fix_schema.cjs`, `fix_schema2.cjs`, `fix_upload_route.ts`
- `patch_routes.cjs`, `modify_routes.cjs`, `replace_anagrafica.cjs`
- `update_f.cjs`, `update_f_fix.cjs`, `update_f_import.cjs`, `update_f_verify.cjs`, `update_schema.cjs`
- `update_docs.py`, `add_imports.py`, `split_routes.py`
- `audit_output.json`, `audit_output.txt`, `audit_output5.txt`, `audit_pagamenti.md`, `audit_pagamenti_ricalcolato.md`
- `count_courses.ts`, `count_tables.ts`, `check_db.ts`, `backup_tables.ts`, `query_fks.ts`, `show_indexes.ts`, `parse_members.ts`, `route_list.ts`, `run-sql.ts`, `desc.ts`
- `generate_mappings.ts`, `generate_mappings_from_json.cjs`, `get_db_info.ts`, `list-dirty-markdown.ts`
- `test-all-no-sku.ts`, `test-dirty-*.ts`, `test-no-sku.ts`, `test-query.ts`, `test-rbac.js`, `test-season2-courses.ts`, `test.js`, `test.mjs`, `test.pdf`, `tmp_test.pdf`, `test_api.sh`, `test_count.ts`, `test_drizzle_*.ts`, `test_generic_select.ts`, `test_stats.ts`
- `temp_diff.patch`
- `db_fks.tsv`, `db_map.json`, `db_monitor_output.json`, `out.json`, `step1_003.json`
- `ts_errors.txt`, `ts_errors_after.log`, `ts_errors_all.log`, `ts_errors_server.log`, `tsc_errors.txt`
- `_drop_base64_add_url.sql`
- 5 file `cookie*.txt`/`cookie.jar` (test sessione, da pulire)
- `database.sqlite` (0 byte), `local.db` (0 byte), `sqlite.db` (0 byte), `db_backup_pre_mc2_dossiers.sql` (0 byte) — vuoti, residui
- `new_turni.tsx`, `new_turni_markup.tsx` — residui anagrafica
- `CourseManager_Export_Latest.zip` (81 MB) in root — pesante, da spostare o cancellare

**Proposta:** prompt F1 di sola pulizia: spostare tutto in `scratch/` (già esiste) o cancellare gli inutili. Beneficio: navigazione repo + onboarding (anche per AG che fatica con file mischiati). Stima 30-60 min.

### 4.3 🟡 IGIENE — Cartella `scripts/` esplosa (>100 file)

Molti `patch_*.cjs`, `run-f1-*`, `query_f2_*` accumulati. Archiviabili in `scripts/_archive/` (cartella già esistente) i one-shot già usati. Probabile riduzione ~50-70 file. Stima 1h F1 (read-only + archiviazione, no rischio codice).

### 4.4 🟡 IGIENE — File `.env` multipli

`.env`, `.env.bak`, `.env.example`, `.env.planetscale`, `.env.vps`. Confusione storica su quale environment è attivo. Bonifica suggerita:
- `.env` (vivo, segreto)
- `.env.example` (template SENZA segreti — placeholder vuoti)
- Eliminare `.env.bak`, `.env.planetscale`, `.env.vps` (o spostare in `99_archivio/` se servono come riferimento storico)

### 4.5 🟡 IGIENE — Logs gigante

`server.log` 5.7MB attivo + 1882 file in `logs/`. Log rotation Winston probabilmente sotto-configurata (rate trattiene troppo a lungo o non comprime).
**Proposta:** verificare config `winston-daily-rotate-file` su `server/index.ts` (o dove sta), impostare `maxFiles: '14d'` + `zippedArchive: true`. Stima 30 min.

### 4.6 🟢 DOCUMENTAZIONE — Doc deployment frammentati

6 file deployment in root (`DEPLOYMENT.md`, `DEPLOYMENT_VPS.md`, `DEPLOY_PLESK.md`, `PLANETSCALE_SETUP.md`, `PLESK_SETUP.md`, `RAILWAY_SETUP.md`, `MYSQL_MIGRATION.md`, `EXTERNAL_MYSQL.md`, `STATO_MYSQL.md`, `GUIDA_AVVIO.md`, `INIZIA_QUI.md`, `SMTP_SETUP.md`). Storia di tentativi diversi. **Verità attuale unclear.**
**Proposta:** mantenere SOLO `INIZIA_QUI.md` (entry point) e `DEPLOY_PLESK.md` (se Plesk è il deploy ufficiale). Spostare gli altri in `_GAE_SVILUPPO/99_archivio/docs_storiche_root/` con un README di indicizzazione. Stima 20 min.

### 4.7 🟢 ANOMALIA NEL VAULT — Timestamp errato nel nome file F_

In `_ANTIGRAVITY/01_status_continui/` esistono due file F_ di oggi:
- `F_2026_05_15_1150_ULTIMI_AGGIORNAMENTI.md` (597 B, salvato 10:37, contiene SOLO F1-023 ore 12:38) ← **incongruenza data/ora vs contenuto**
- `F_2026_05_15_1158_ULTIMI_AGGIORNAMENTI.md` (33.8 KB, salvato 09:59, contiene cronaca completa fino a F2-018 ore 11:58)

Il primo sembra essere il "nuovo" file vivo del giorno con solo l'ultimo aggiornamento; il secondo è il file vivo precedente cumulativo. Per regola 15 del [[00_LEGGIMI]], il file F_ precedente andrebbe **archiviato in `99_archivio/`** con timestamp e si dovrebbe avere UN SOLO file F_ vivo al giorno. **Da chiarire con AG e ripulire.** Stima 5 min.

### 4.8 🟢 DEBITO TECNICO consolidato (già in [[MASTER_STATUS]] §5)

Per completezza ricordo i 7 debiti maggiori, in ordine di severità:
1. 🔴 `server/routes.ts` monolite 12.259 righe (~5.300 solo /api/gemteam/*) — ~40 TODO `STI-cleanup`
2. 🔴 `client/src/pages/maschera-input-generale.tsx` monolite 4.500 righe
3. 🔴 `client/src/pages/calendar.tsx` monolite 3.500 righe
4. 🔴 Tabella `members` con 170+ colonne (include certificati/tessere che andrebbero altrove)
5. 🟡 `PaymentModuleConnector` accoppiato a 14 route backend, no state machine carrello
6. 🟡 `global_enrollments` errore "Table doesn't exist" da indagare (residuo pruning)
7. — Suspended smantellamenti (decisione esplicita 02/05: refactor modulo-per-modulo manuale)

---

## 5. DECISIONI ARCHITETTURALI APERTE (per Gaetano)

- **D1** — STRADA `/importa` (A campi dinamici JSON / B mappatore intelligente / A+B entrambi)
  - Stato: ⏳ aperta dal 04/05
  - Raccomandazione: F1-020 (14/05) consiglia **STRADA B** + CF→warning + fix Lotto 1
  - **Azione richiesta:** OK esplicito di Gaetano per procedere con F1-021

- **D2** — Apertura operativa **Quote_Param**
  - Stato: ⏳ aperta dall'11/05 (priorità Gaetano dichiarata)
  - Bloccante: 5 domande Q1-Q5 nel [[proposal_Quote_Param_2026_05_12]]
  - **Azione richiesta:** Gaetano risponde a Q1-Q5 o autorizza un mini-audit per riverificare proposal vs schema attuale

- **D3** — Re-import members/memberships/payments
  - Stato: ⏳ aperta (Gaetano sta organizzando dati)
  - Bloccante per: F1-004 (DROP colonne piatte), reproducibilità bug Calendario in dev
  - **Azione richiesta:** Gaetano comunica quando i dati saranno pronti

- **D4** — Smantellamento `routes.ts`
  - Stato: ⏳ priorità #5, non ancora aperta
  - **Azione richiesta:** decisione strategica se anticiparla ora (beneficio velocità futura) o tenerla in coda

---

## 6. 4 MOSSE POSSIBILI PER L'ALTRA CHAT COWORK (in ordine di valore strategico)

> Ordine F1 sopra / F2 sotto rispettato dove serve (regola 21 [[00_LEGGIMI]])

### 🥇 Mossa A — **Aprire Quote_Param (priorità #3.5)**

**Perché:** è il vero buco di PRODOTTO non ancora aperto. Gaetano l'ha messa come priorità dichiarata, ma è ferma da 4 giorni. È un blocco mentale, non tecnico.

**Step proposti:**
1. Gaetano risponde a Q1-Q5 di [[proposal_Quote_Param_2026_05_12]] (15 min)
2. Prompt **F1-024** ad AG: ripescare le 3 fonti da `99_archivio/2026_05_11_RESET_TOTALE/_CLAUDE/03_recap_chat/` portandole in `_CLAUDE/02_moduli_analisi/quote_param/` come riferimento vivo. Mini-audit (read-only) di `shared/schema.ts` § course_quotes_grid + promo_rules + company_agreements + carnet_wallets + welfare_providers. Confrontare con proposal. Confermare/rivedere modello dati `price_rules` + `price_rule_tiers` + `price_rule_components`. Output: piano definitivo Quote_Param in `_ANTIGRAVITY/02_output_protocolli/`.

### 🥈 Mossa B — **Decidere STRADA B su /importa + lanciare F1-021**

**Perché:** decisione vecchia di 11 giorni che blocca refactor Anagrafica completo. Costo decisione: 5 minuti.

**Step proposti:**
1. Gaetano dice "OK STRADA B" nell'altra chat
2. Prompt **F1-021** ad AG: implementazione fix /importa Lotto 1 (CF placeholder stranieri + CF warning minorenni + duplicato Liv. 1 audit + estensione MEMBER_FIELDS con campi CSV Athena)

### 🥉 Mossa C — **Chiudere F1-022 + lanciare MC3 Fase A FE**

**Perché:** tecnico/tattico. F1-022 sblocca validazione E2E completa, MC3 FE chiude la catena monca BE→FE dei pagamenti relazionali.

**Step proposti:**
1. Prompt **F1-022** già in corso ad AG: fix `PATCH /step` "not found" + `mkdir recursive` per `uploads/`
2. Dopo: Prompt **F2-019** ad AG (FE): `NuovoPagamentoModal` multi-participant + Society + ExternalPayer + Gift Card UI (6-8h)

### 🏅 Mossa D — **Pianificare smantellamento `routes.ts` (big bet)**

**Perché:** strategico/big bet. 12.259 righe sono il singolo collo di bottiglia architetturale. Tutto il futuro accelera quando questo file è spezzato.

**Step proposti:**
1. Prompt **F1-025** ad AG: piano READ-ONLY di smantellamento `routes.ts` per dominio. Output: matrice "route → dominio → file destinazione" + ordine di estrazione modulo-per-modulo + rischi per ogni step. NO implementazione, solo piano.
2. Dopo Gaetano valida, esecuzione modulo-per-modulo con sessioni dedicate.

### 🧹 Mossa E (parallela, bassa priorità) — **Pulizie codebase**

In qualunque momento di "respiro" tra mosse pesanti, prompt **F1-026** ad AG: pulizia root + cartella `scripts/` + bonifica `.env.*` + log rotation. Stima 2-3h totali, rischio zero, beneficio onboarding+navigazione+sicurezza.

---

## 7. NOTE PER LA PROSSIMA SESSIONE

- **Cowork hub** (questa chat) ha letto direttamente codice via mount `/Users/gaetano1/SVILUPPO/StarGem_manager/` da oggi. Decisione 11/05 di lettura "parcheggiata" superata.
- Vincoli operativi mantenuti: lettura chirurgica, non panoramica. Evitare aperture di `routes.ts` o `schema.ts` per intero (12k e 128KB rispettivamente).
- Regola 4 [[00_LEGGIMI]] rispettata: Claude (Cowork) NON ha scritto codice del progetto, solo questo recap dentro `_GAE_SVILUPPO/_CLAUDE/03_recap_chat/`.
- Regola 8 [[00_LEGGIMI]] rispettata: comunicazione con l'altra chat passa ESCLUSIVAMENTE per questo file.
- I 2 segreti esposti restano on-the-shelf fino a fine progetto per decisione esplicita di Gaetano del 15/05.
- Per regola 14 [[00_LEGGIMI]]: qualunque Stop&Go futuro DEVE includere validazione `npx tsc --noEmit` + `npm run lint` + `npm test` + `npm run build` se modifica codice.

---

## 8. RACCOMANDAZIONE FINALE COWORK (sintesi 1 riga)

> **Mossa A (Quote_Param) è quella di maggior valore strategico, Mossa C (F1-022 + MC3 FE) quella di maggior urgenza tecnica.** Mossa B (decisione /importa) è gratuita e va presa comunque. Mossa D (routes.ts) è il moltiplicatore di velocità futura.

---

*Aggiornato l'ultima volta da: Claude (Cowork — chat StarGem · Cowork operativo) il 2026_05_15_1210. Per usare questo recap nell'altra chat: leggere integralmente, poi seguire formato regola 10 [[00_LEGGIMI]] per ogni prompt verso AG (con header "PRIMA AZIONE OBBLIGATORIA: leggi [[MASTER_STATUS]] + [[CHECKLIST_PROGETTO]] + questo recap").*
