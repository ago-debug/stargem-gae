# RECAP_10_Utenti-GemPortal
> Documento di riepilogo completo della chat — da conservare in _GAE_SVILUPPO/_CLAUDE/03_recap_chat/
> Sessione: 15-16 Aprile 2026
> Ultimo aggiornamento: 16/04/2026 15:43

---

## 1. IDENTITÀ DELLA CHAT

| Campo | Valore |
|---|---|
| Chat numero | 10 |
| Nome | Utenti-GemPortal |
| Tema | Autenticazione utenti + Area Tesserati + Import dati soci |
| Stato | 🟡 In corso — F1-014 e F2-012 ancora pendenti |
| Ultimo F1 | F1-022 |
| Ultimo F2 | F2-014 (con hotfix fino a F2-014-HOTFIX-5) |
| Stack | React + TypeScript + Tailwind / Node.js + Drizzle ORM / MariaDB 11.4 |
| VPS | IONOS 82.165.35.145 · Plesk Passenger porta 5001 |
| Repository | ago-debug/stargem-gae · branch main |

---

## 2. LAVORO COMPLETATO — CRONOLOGIA PROTOCOLLI

### AUTH & ACCESSI (F1-001 → F1-008 / F2-001 → F2-003)

**F1-001 — Audit user_roles**
- Trovati ruoli con nomi inconsistenti
- INSERT: operator, admin, insegnante in user_roles
- Colonna user_roles: `name` (non `roleName`) — confermato

**F1-002 — Fix LocalStrategy**
- Login accetta EMAIL o USERNAME (non solo email)
- Funzione `getUserByEmail` + `getUserByUsername`
- Fix anti user-enumeration in forgot-password

**F1-003 — First login redirect per ruolo**
- insegnante → /gemstaff/me
- dipendente → /gemteam/me
- client → /area-tesserati
- altri → /calendario-attivita

**F1-004 — email_verified staff**
- UPDATE users SET email_verified=1 per 14 utenti @studio-gem.it

**F2-001 — Fix sidebar label ruoli**
- Standardizzazione nomi ruoli nella UI

**F2-002 — Fix typo hasPermission**
- Corretto `admministratore` → `amministratore`

**F2-003 — Fix post-OTP session cache**
- Fix cache sessione dopo OTP
- Redirect corretto per ruolo post-login

---

### GEMPORTAL AREA TESSERATI (F1-009 → F1-013 / F2-004 → F2-011)

**F1-009 — CREATE TABLE gem_conversations**
```sql
gem_conversations (id, member_id, staff_id, subject, 
  status, priority, created_at, updated_at)
```

**F1-010 — CREATE TABLE gem_messages**
```sql
gem_messages (id, conversation_id, sender_id, 
  sender_type, content, read_at, created_at)
```

**F1-011 — CREATE TABLE member_uploads**
```sql
member_uploads (id, member_id, file_type, file_url, 
  file_name, verified, verified_by, created_at)
```
- 3 entità Drizzle aggiunte in shared/schema.ts

**F1-012 — TeoBot + 7 route GemChat**
- Integrazione Claude SDK `@anthropic-ai/sdk`
- ANTHROPIC_API_KEY configurata in .env locale e VPS
- Route A: GET /api/area-tesserati/conversations
- Route B: POST /api/area-tesserati/conversations
- Route C: GET /api/area-tesserati/conversations/:id/messages
- Route D: POST /api/area-tesserati/conversations/:id/messages
- Route E: POST /api/area-tesserati/conversations/:id/teobot
- Route F: GET /api/area-tesserati/unread-count
- Route G: PATCH /api/area-tesserati/conversations/:id/read

**F1-013 — 3 route Area Tesserati**
- GET /api/area-tesserati/profile
- POST /api/area-tesserati/upload
- GET /api/area-tesserati/documenti

**F2-004 → F2-010 — Badge navbar GemChatBadge**
- Componente `gem-chat-badge.tsx` NUOVO
- 2 canali: member/staff
- Drawer con tab

**F2-011 — Pagina /area-tesserati**
- Layout client isolato (senza sidebar staff)
- Sezioni: profilo · tessera · documenti · iscrizioni · pagamenti · GemChat
- Fix permesso client per /area-tesserati (commit 72b2965)
- Redirect tutti area-clienti/area-riservata → area-tesserati

**Account test verificato in produzione:**
- Email: martina.ricci3@example.com
- Password: Test2026!
- member_id: 2987 · role: client

---

### IMPORT DATI SOCI (F1-015 → F1-022)

**F1-015 — Audit DB pre-import**
- 9.440 members nel DB (tutti da GSheets precedenti)
- 5.897 con email · 5.388 con CF · solo 17 con user_id
- Tabella import_configs esistente
- Pagina /importa esistente con route Google Sheets

**F1-016 — Script import_soci.ts**

File: `scripts/import_soci.ts`
Parametri CLI: `--passata=1|2|3` `--dry-run` `--limit=N` `--reset --force`

*Passata 1 — Master GSheets (20260315):*
- File: estrap_20260315_estrapolazione_Master_per_importazione_Bitrix.xlsx
- Foglio: importazione · 3.560 CF unici
- Risultato: 109 INSERT · 3.451 UPDATE · 0 errori
- from_where = 'gsheets_import'

Mappatura principale P1:
```
an_cod_fiscale → fiscal_code (CHIAVE)
an_nome → first_name
an_cognome → last_name
an_email → email
an_telefono → phone
an_sesso → gender
an_data_inserimento → insertion_date
an_id_anagrafica → internal_id
n_tessera → tessere_metadata (JSON)
```

*Passata 2 — AnaPersone Athena (20260415):*
- File: estrap_20260415_AnaPersoneFullExcel.xlsx
- Foglio: AnaPersoneFullExcel · 3.825 CF unici
- Risultato: 399 INSERT · 3.416 UPDATE · 0 errori
- from_where = 'athena_import'
- Campi aggiornati: address · city · province · postal_code
  birth_date · birth_place · birth_province · nationality

*Passata 3 — ElencoIscrizioni Athena (20260415):*
- File: estrap_20260415_ElencoIscrizioni.xlsx
- Foglio: ElencoIscrizioni · 10.054 righe
- Risultato: 4.938 tessere INSERT in memberships · 0 errori
- Deduplicazione su membership_number

**F1-017 — ALTER TABLE members +10 campi**
```sql
ALTER TABLE members
  ADD COLUMN tutor1_fiscal_code VARCHAR(16) NULL,
  ADD COLUMN tutor1_phone VARCHAR(20) NULL,
  ADD COLUMN tutor1_email VARCHAR(255) NULL,
  ADD COLUMN tutor2_fiscal_code VARCHAR(16) NULL,
  ADD COLUMN tutor2_phone VARCHAR(20) NULL,
  ADD COLUMN tutor2_email VARCHAR(255) NULL,
  ADD COLUMN nationality VARCHAR(100) NULL,
  ADD COLUMN region VARCHAR(100) NULL,
  ADD COLUMN consent_image TINYINT(1) DEFAULT 0,
  ADD COLUMN consent_marketing TINYINT(1) DEFAULT 0;
```

Passata 2 rilasciata con nuovi campi:
- tutor1FiscalCode: 572 · tutor1Phone: 600 · tutor1Email: 560
- tutor2FiscalCode: 414 · tutor2Phone: 486 · tutor2Email: 391
- consentImage: 3.778 · consentMarketing: 3.368

**F1-018 — Validazione CF (scripts/validate_cf.ts)**
- Algoritmo checksum Agenzia Entrate italiano
- Risultati: 5.796 validi · 9 invalidi · 78 sospetti
- Flaggati nel campo notes: `[CF-INVALID]` e `[CF-SOSPETTO]`

**Analisi doppioni (F1-018 → F1-021):**
- Doppioni CF identici trovati: 2 (Martina test + TSTGEN)
- Eliminato id 9541 (Martina test duplicata)
- Flaggati 6758 e 6759 con `[CF-TEST: TSTGEN verificare identità]`
- Doppioni email senza CF: 542 flaggati `active=0`
- Di cui eliminati certi: 526 (stessa email+nome+cognome)
- Rimasti disattivati da revisione manuale: 16
- Doppioni telefono: 3 (filippo nardi dei) eliminati

**F1-019 — Script verify_import.ts (confronto DB vs Excel)**
Risultati finali:
```
Master GSheets: 3.558/3.560 nel DB (2 mancanti = CF typo eliminati)
AnaPersone Athena: 3.824/3.825 nel DB
ElencoIscrizioni: 3.825/3.826 nel DB
CF nel DB non nei file Excel: 1.776
```

**F1-022 — Fix filtri + stagione + enrollment_status**
- UPDATE season='2025-2026' su 9.399 members
- ALTER TABLE members ADD COLUMN enrollment_status ENUM('attivo','non_attivo') DEFAULT 'non_attivo'
- Fix filtro età: TIMESTAMPDIFF dinamico da date_of_birth (non campo statico)
- Fix filtro stato: basato su enrollment_status
- Schema Drizzle aggiornato

---

### UI ANAGRAFICA (F2-013 → F2-014)

**F2-013 — Split Cognome | Nome + Paginazione**
File modificato: `client/src/pages/members.tsx`
- Colonna unica "Cognome e Nome" → due colonne separate "Cognome" | "Nome"
- Ordinamento indipendente per last_name e first_name
- Selettore paginazione: 50 | 100 | 200 per pagina
- Preferenza salvata in localStorage chiave 'anagrafica_page_size'
- commit a83ffb9

**F2-014 — Versioning automatico + data build**
File modificati: `package.json` · `vite.config.ts` · `app-sidebar.tsx`
- package.json version: "2.2.27"
- vite.config.ts: `__APP_VERSION__` e `__BUILD_DATE__` iniettati al build
- Sidebar footer: versione dinamica + data/ora del deploy
- Schema finale footer:
  - Riga 1: `Aggiornato: 16/04/26, 15:42` (grigio chiaro)
  - Riga 2: `Da/Azione: admin (v2.2.27)` (grigio chiaro)
- commit c834c04 → serie hotfix → commit finale d3886e7

---

### DEPLOY PIPELINE (definitiva dal 16/04/2026)

**Script:** `scripts/deploy-vps.sh`
**Tecnologia:** rsync (non SCP) con flag:
```bash
rsync -avz --delete \
  --no-perms --no-owner --no-group \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude 'attached_assets' \
  --exclude 'temp_import' \
  --exclude 'tmp' \
  --exclude '.node-version' \
```

**6 step:**
1. Git push origin main
2. rsync sorgenti → VPS (senza dist/, senza .node-version)
3. SSH rm -rf dist/ + chmod 755
4. SSH npm install + npm run build (/opt/plesk/node/24/bin)
5. SSH touch tmp/restart.txt
6. curl health check (accetta 200, 401, 403)

**Problema risolto:** EACCES Permission denied su dist/public/assets
**Causa:** rsync --delete con flag -a ereditava permessi locali
**Soluzione:** --no-perms --no-owner --no-group + chmod 755 post-rsync

**VPS .node-version:** valore fisso `24` — escluso da rsync

---

## 3. STATO DB POST-SESSIONE (16/04/2026 ore 15:43)

```
Tabella members:
  Totale: 9.416 records (attivi + 16 disattivati)
  Attivi (active != 0): 9.400
  Disattivati da revisione (active=0): 16
  CF unici validi: 5.892
  Senza CF: 4.052
  Con email: ~5.897
  Flaggati totali [CF-INVALID/SOSPETTO/DUPLICATO]: 629
  season: '2025-2026' su tutti i 9.400 attivi
  enrollment_status: 'non_attivo' su tutti (default)
    → verrà aggiornato da Chat_08_Corsi
  from_where: 'gsheets_import' P1 · 'athena_import' P2

Tabella memberships:
  4.938 tessere storiche da Athena (P3)
  + tessere originali GemPass (2.218 da F1-007)

Nuove tabelle create:
  gem_conversations
  gem_messages
  member_uploads

Nuovi campi in members:
  tutor1_fiscal_code · tutor1_phone · tutor1_email
  tutor2_fiscal_code · tutor2_phone · tutor2_email
  nationality · region
  consent_image · consent_marketing
  enrollment_status
```

---

## 4. BACKUP DB ESEGUITI IN SESSIONE

| Nome file | Data | Motivo |
|---|---|---|
| gemportal_COMPLETO_20260415_0759.sql | 15/04 | Pre-chiusura GemPortal |
| pre_import_P1_20260416_1249.sql | 16/04 | Pre-import Passata 1 |
| pre_import_P3_20260416_1300.sql | 16/04 | Pre-import Passata 3 |
| pre_alter_members_F1-017_20260416_1317.sql | 16/04 | Pre-ALTER +10 campi |
| pre_dedup_F1-018_20260416_1329.sql | 16/04 | Pre-pulizia doppioni |
| pre_cleanup_F1-019_20260416_1346.sql | 16/04 | Pre-pulizia email dup |
| pre_delete_dupes_F1-020_20260416_1359.sql | 16/04 | Pre-delete 526 certi |
| pre_delete_phone_dupes_F1-021_20260416_1409.sql | 16/04 | Pre-delete tel dup |
| fix_stagione_F1-022_20260416_1449.sql | 16/04 | Pre-season + enrollment |

**Backup di riferimento più recente:**
`/root/backups/pre_delete_phone_dupes_F1-021_20260416_1409.sql`

---

## 5. SCRIPT CREATI IN QUESTA SESSIONE

| Script | Scopo |
|---|---|
| `scripts/import_soci.ts` | Import P1+P2+P3 con dedup CF, dry-run, reset |
| `scripts/validate_cf.ts` | Validazione checksum CF algoritmo IT |
| `scripts/verify_import.ts` | Confronto bidirezionale DB vs 4 file Excel |
| `scripts/deploy-vps.sh` | Deploy VPS definitivo con rsync |
| `scripts/audit_f1_015.ts` | Audit pre-import (temporaneo) |
| `scripts/audit_f1_018*.ts` | Audit doppioni (temporaneo) |
| `scripts/audit_f1_019*.ts` | Audit pulizia (temporaneo) |
| `scripts/audit_f1_020*.ts` | Audit cancellazione (temporaneo) |
| `scripts/audit_f1_021*.ts` | Audit telefono dup (temporaneo) |
| `scripts/audit_f1_022.ts` | Audit season (temporaneo) |

---

## 6. FILE EXCEL DI RIFERIMENTO (in temp_import/)

| File | Foglio | Righe | CF unici | Destinazione |
|---|---|---|---|---|
| estrap_20260315_*Bitrix.xlsx | importazione | 3.575 | 3.560 | members (P1) |
| estrap_20260415_AnaPersoneFullExcel.xlsx | AnaPersoneFullExcel | 3.956 | 3.829 | members (P2) |
| estrap_20260415_ElencoIscrizioni.xlsx | ElencoIscrizioni | 10.054 | 3.830 | memberships (P3) |
| estrap_20260316_*Workshop.xlsx | WS_master_dati | 1.000 | ~850 | Chat_09_Workshop |

**File mappatura:** `MAPPATURA_IMPORT_COMPLETA.md` nel Progetto Claude
Contiene: tutte le colonne dei 4 file → destinazione DB → chat di competenza

---

## 7. COMMIT PRINCIPALI (git log)

```
d3886e7 fix(ui): footer sidebar tutto grigio uniforme
8cef6c5 fix(ui): ripristina footer sidebar completo con data build sopra
7e8d24b fix(ui): rimuovi data duplicata nel footer sidebar
300f9da fix(deploy): escludi .node-version da rsync
300888f fix(deploy): forza permessi corretti 755 su Plesk post-rsync
2ef2fe3 fix(deploy): accetta 403 come stato valido nel health check
c834c04 feat(ui): versioning automatico + data build in sidebar [F2-014]
78d3496 fix(members): stagione 2025-2026 + enrollment_status + filtro età [F1-022]
0fc9564 feat(import): script import soci + validazione CF + verifica [F1-016/018/019]
3836fce feat(db): ALTER members +10 campi tutori/consensi/nazionalità [F1-017]
a83ffb9 feat(ui): split Cognome|Nome + selettore paginazione anagrafica [F2-013]
1c2eab8 chore: script deploy VPS definitivo [deploy-vps.sh]
72b2965 fix(auth): add client role permission for /area-tesserati [F2-011]
b250c82 feat(api): Area Tesserati profile+upload+documenti [F1-013]
bf6a59f feat(api): GemChat + TeoBot Claude [F1-012]
```

---

## 8. PENDENTI IN QUESTA CHAT

### Da fare (priorità alta):
- **F1-014:** 3 flussi onboarding
  - Self-service: utente si registra da /registrati
  - Segreteria: operatore crea account in presenza
  - WooCommerce: webhook → account automatico
- **F2-012:** Pagina /registrati pubblica

### Da fare (dopo Chat_22):
- Validazione CF con API Agenzia Entrate (piano: entrambe, algoritmo + API)
- Validazione indirizzo con database ISTAT comuni italiani
- OTP email + telefono per verifica account
- Filtro stato (attivo/non_attivo) da testare in UI
- Filtro tesserato/non_tesserato (dopo Chat_GemPass)
- CF fittizio per stranieri/casi speciali (prefisso XX-)
- Flag [VERIFICARE] sui campi non congruenti con CF

### Note architetturali ricordate:
- CF = chiave primaria assoluta per ogni socio
- Dal CF si calcolano: nome, cognome, data nascita, sesso, comune
- I dati già importati mantengono quello che hanno
- Per inserimenti futuri: CF → auto-fill campi anagrafici
- Stranieri senza CF: codice fittizio XX-{datanascita}-{progressivo}

---

## 9. CHAT COLLEGATE E BRIEFING

### Chat_22_Import_Export_dati — 🔴 PRIORITÀ ASSOLUTA
Fare prima di qualsiasi altra chat.
Obiettivo: audit campi DB vs 179 colonne AnaPersone Athena.
Campi probabilmente mancanti: nazione nascita, email secondaria,
cellulare separato, tipo visita medica, numero tessera sanitaria,
consenso newsletter, codice comune catastale.
Riferimento: MAPPATURA_IMPORT_COMPLETA.md

### Chat_06_Contabilità — attendere Chat_22
Pagamenti nei file Excel:
- Colonne sz1/sz2/sz3/sz4_* del Master GSheets
- Metodi: C/C Poste, BPM, CONTANTI, POS, ONLINE
- saldo_totale · numero_ricevute_fatte
Chiave: fiscal_code → member_id

### Chat_08_Corsi — attendere Chat_22
Iscrizioni storiche:
- Master GSheets: codici_corso_iscrizioni (formato 2526MGRANDEMER18.D)
- ElencoIscrizioni Athena: Sigla + Corso + Stato (10.054 righe)
Azione: aggiorna enrollment_status da 'non_attivo' ad 'attivo'

### Chat_09_Workshop — attendere Chat_22
File dedicato: estrap_20260316_estrapolazione_ISCRITTI_WORKSHOP.xlsx
1.000 iscritti · codici formato 2526ANDRIANO19APR

### Chat_GemPass — attendere Chat_22
Tessere Athena già in memberships (4.938)
Attenzione formato: Athena 242501846 → previous_membership_number
StarGem: 2526-003924 → membership_number

---

## 10. VARIABILI E CREDENZIALI DI RIFERIMENTO

```
VPS: root@82.165.35.145
DB: mariadb -u gaetano_admin -p'Verona2026stargem2026' stargem_v2
Tunnel locale: SSH su porta 3307
Dev locale: localhost:5001
Produzione: stargem.studio-gem.it
SMTP: mail.studio-gem.it:465
Account test: martina.ricci3@example.com / Test2026!
Versione app: 2.2.27 (package.json)
Node VPS: /opt/plesk/node/24/bin
Deploy: bash scripts/deploy-vps.sh
```

---

## 11. REGOLE OPERATIVE STABILITE IN QUESTA CHAT

1. **Deploy:** sempre via `bash scripts/deploy-vps.sh` — mai SCP diretto
2. **rsync:** `--no-perms --no-owner --no-group` — obbligatorio
3. **.node-version VPS:** valore fisso `24` — escluso da rsync
4. **CF = chiave assoluta** — mai inserire dati senza CF se possibile
5. **Nessuna email ai soci** — finché non pronti per go-live pubblico
6. **enrollment_status** — aggiornato solo da Chat_08_Corsi
7. **Import pagamenti** — solo da Chat_06_Contabilità dopo Chat_22
8. **Import iscrizioni** — solo da Chat_08_Corsi dopo Chat_22
9. **Versioning:** PATCH per bugfix · MINOR per moduli · MAJOR per go-live

---

*Fine RECAP_10_Utenti-GemPortal — 16/04/2026*
