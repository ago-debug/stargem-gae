# RECAP — Chat ANALISI Strategica StarGem Suite
**Versione:** 1.0
**Data:** 2026_04_25_1215
**Scopo:** Documento di chiusura e archiviazione della Chat ANALISI.
**Da caricare in:** _GAE_SVILUPPO/_CLAUDE/03_recap_chat/

---

## 1. SCOPO DI QUESTA CHAT

La Chat ANALISI è il cervello centrale del progetto StarGem Suite. Non genera prompt per Antigravity direttamente — produce decisioni architetturali, analisi strategiche e RECAP per le 23 chat operative. Ogni decisione presa qui viene comunicata alle chat dedicate che la implementano tramite Antigravity.

---

## 2. DECISIONI ARCHITETTURALI FISSATE

### 2.1 Sistema Identità Digitale

```
members.user_id VARCHAR(255) → FK → users.id (onDelete: set null)
user_id NULL = persona senza account
user_id pieno = persona con login attiva

Flusso creazione account:
  1. INSERT in users → genera UUID
  2. PATCH members SET user_id = UUID

Login: email O username + password
Ruoli (users.role testo libero):
  operator · admin · client · medico · insegnante · dipendente
user_roles: colonna 'name' (NON roleName)
Policy due cappelli: doppio ruolo = 2 account separati
```

### 2.2 Classificazione Utenti — DEFINITIVA

Fonte: `2026_04_20_classificazione_stargem_v2.pdf`

```
UTENTE → category anagrafica base (members)
  Tesserato → memberships.status = 'attiva'
    Partecipante = frequenta attività
    Non partecipante = tessera attiva, non frequenta
  Non tesserato → no tessera o scaduta
    Può affittare, pagare, ricevere fattura

STAFF → solo tesserati
  participantType: INSEGNANTE | PERSONAL | PERSONAL_TRAINER
  Tessera OBBLIGATORIA

TEAM → solo tesserati in team_employees
  Dipendenti: ruolo + mansione + postazione
  Collaboratori: team senza rapporto dipendente fisso
  Tessera OBBLIGATORIA

Sovrapposizione Staff+Team = 2 account separati
```

### 2.3 Architettura Categorie

```
DECISIONE: custom_list_items è l'UNICO sistema categorie.
14 tabelle legacy droppate definitivamente (21/04/2026):
  ws_cats, sun_cats, cmp_cats, rec_cats, vac_cats, sub_types,
  activity_categories, merchandising_categories, cli_cats,
  rental_categories, booking_service_categories, categories,
  trn_cats, ind_less_cats

storage.ts interroga custom_list_items via JOIN con custom_lists.
Nessuna chat può creare nuove tabelle *_cats.
```

### 2.4 Tabelle Iscrizioni

```
TABELLA UFFICIALE: enrollments
Da ignorare/droppare: global_enrollments, universal_enrollments (vuote)
enroll_details: 13 record legacy — non usare
```

### 2.5 Separazione Sistemi

```
WooCommerce = VENDITA (checkout, carrello — non si tocca mai)
StarGem = OPERATIVO (post-vendita, gestionale)
Integrazione = webhook + API bidirezionale
StarGem alimenta WooCommerce (prezzi, posti, sold-out)
Bitrix → abbandonato → Clarissa (chat 17)
GSheet → eliminati → segreteria lavora in StarGem
```

### 2.6 Deploy

```
REGOLA ASSOLUTA:
1. Antigravity: git commit + git push origin main → STOP
2. Gaetano: git pull manualmente su Plesk → pubblica

Antigravity NON esegue mai:
  deploy-vps.sh · ssh VPS · npm build VPS · pm2 restart
```

### 2.7 14 Attività Ufficiali

```
1.Corsi  2.Workshop  3.Prove a pagamento  4.Prove gratuite
5.Lezioni singole  6.Lezioni individuali  7.Domenica in movimento
8.Allenamenti  9.Affitti  10.Campus  11.Saggi
12.Vacanze studio  13.Eventi esterni  14.Merchandising

Calendario → attività con orario/spazio puntuale
Planning → attività strategiche stagionali
Merchandising → escluso da calendari e planning
```

### 2.8 Convenzione Nomi File

```
Formato: YYYY_MM_DD_HHMM_nomefile.ext
Il file più recente = data più alta nel nome.
Claude e Antigravity usano questo formato per TUTTI i file.
```

---

## 3. STATO DB AL 25/04/2026

### Record reali in produzione

| Tabella | Record | Note |
|---------|--------|------|
| enrollments | 13.584 | Tabella iscrizioni ufficiale |
| members | 4.489 | 174 colonne, flag qualità attivi |
| payments | 3.775 | Importati storici + gbrh |
| memberships | 3.281 | Tessere pulite, duplicate rimosse |
| medical_certificates | 2.770 | Solo validi |
| courses | 586 | 296 reali + 285 storici + 5 P6 |
| team_attendance_logs | 2.078 | Presenze reali GemTeam |
| user_activity_logs | 2.084 | Log sistema |
| cities | 8.062 | Comuni italiani |
| promo_rules | 50 | Codici promo |
| custom_list_items | 235 | Unico sistema categorie |
| price_matrix | 22 | Matrice prezzi |
| company_agreements | 11 | Convenzioni aziendali |
| users | 19 | Account staff |
| team_employees | 16 | Dipendenti attivi |
| team_scheduled_shifts | 17 | ⚠️ Wipe da test E2E |
| team_shift_templates | 1 | ⚠️ Wipe da test E2E |

### Flag qualità members da bonificare
- `tessera_mancante_da_assegnare`: 1.322
- `omonimo_da_verificare`: 407
- `mancano_dati_obbligatori`: 198
- `nome_match`: 179
- `incompleto`: 20
- `creato_da_iscrizioni`: 2
- `NULL` (ok): 2.361

### Backup
`CHAT22_CHIUSURA_DEFINITIVA_20260425_1005.sql` — 13MB sul VPS

### Tabelle droppate definitivamente
- 14 tabelle categorie legacy (21/04/2026)
- `activity_details` (22/04/2026 — 428 record relitto STI)
- `team_shift_templates_BAK_F1_030` (F1-032)
- `universal_enrollments` (svuotata F1-007, da droppare)
- `activities` (svuotata F1-006)

### Tabelle a zero da tenere (moduli futuri)
`payments` · `enrollments` · `studio_bookings` · `attendances`
`staff_presenze` · `staff_sostituzioni` · `payslips`
`medical_certificates` · `gem_conversations` · `gem_messages`
`staff_contracts_compliance` · `staff_document_signatures`
`staff_disciplinary_log`

---

## 4. STATO CHAT — 25/04/2026

### ✅ Completate

| Chat | Protocolli | Lavori principali |
|------|-----------|-------------------|
| **00_errori** | F1-099/F2-113 | STI completo, 0 errori TS |
| **01_quote** | F1-014/F2-011 | 18 tabelle, 50 promo, webhook WC (Fase 2 pendente) |
| **02_GemStaff** | F1-016/F2-019 | 6 tabelle staff_*, 65 insegnanti + 6 PT, /gemstaff 6 tab |
| **03_GemTeam** | F1-035+ | Dashboard 5 KPI, check-in, full-width grid (turni da reimportare) |
| **05_GemPass** | F1-007/F2-007 | 3.281 tessere, formato 2526-000042, 22/22 test |
| **10_Utenti** | F1-014/F2-012 | 7 ruoli, TeoBot Claude SDK, /area-tesserati, onboarding |
| **00_DB_Cleanup** | — | 14 tabelle categorie droppate, refactoring storage.ts |
| **22_ImportExport** | F1-054 | Import completo (P1→P10), ExportWizard 10 sezioni |

### 🟡 In corso / da completare

| Chat | Stato |
|------|-------|
| **12_Gemdario** | UI FREEZE — collaudo Planning pendente, raggruppamento corsi sparito |
| **23_Log_Verifiche** | Aperta 24/04 — UI log azioni da fare |

### 🔴 Da avviare — ordine priorità

```
Priorità 1b (urgente):
  Fix UI campi nascosti in GemPass, Anagrafica, Contabilità, Iscritti

Priorità 2:
  03_GemTeam — reimportare turni da team_TURNI.xlsx

Priorità 3:
  06_Contabilità — UI cassa (cash_registers, bank_deposits)

Priorità 4:
  08_Corsi · 09_Workshop (stagione in apertura)

Priorità 5:
  04_MedGem · 07_Gemory · 14_BookGem

Priorità 6:
  11_Campus · 13_Domeniche · 15_Saggi · 16_Vacanze
  17_Clarissa · 18_GemEvent · 19_GemNight · 20_MerchSG
  21_TeoCopilot (stub attivo)
```

---

## 5. FIX UI URGENTI — PRIORITÀ 1b

### Chat_05_GemPass
- membership_type non mostrato (ENDAS/OPES/LIBERTAS)
- season_id non mostrato (1=25/26, 3=24/25)
- issue_date non visibile
- Bottone "Dati da verificare" per 1.322 tessere
- Funzione "Assegna Tessera" rapida
- Tabella `membership_events` da creare

### Chat_10_Anagrafica
- Badge colorati `data_quality_flag`
- 54+ campi Athena non visibili (contatti, indirizzo, GDPR, tutori, azienda, ecc.)
- Sezione tutori/minori
- Sezione dati azienda
- Sezione emergenza (3 contatti)

### Chat_06_Contabilità
- `operator_name` (chi ha inserito)
- `source` (canale/sede vendita)
- `quota_description` + `period`
- `transfer_confirmation_date`
- `total_quota` + `deposit` + `receipts_count`
- `discount_code` + `discount_value`
- Campi gbrh (numero, date, iban)

### Chat_08_Corsi/Iscritti
- Badge `status` (active/pending/cancelled)
- Badge `participation_type` (corso/prova)
- Uniformare `corso` e `STANDARD_COURSE`
- Filtri: stagione, status, tipo
- Colonna `source_file`

---

## 6. IMPORT STORICO — RIEPILOGO COMPLETO (Chat_22)

### Logica applicata
```
MASTER > WORKSHOP > ATHENA > ElencoIscrizioni
Chiave univoca: fiscal_code (CF)
Regola: mai sovrascrivere campo pieno con vuoto
```

### Passate eseguite
| Passata | Fonte | Cosa ha fatto |
|---------|-------|---------------|
| P1 | MASTER | 3.684 persone + 3.271 tessere + 2.770 certificati |
| P2 | ATHENA | 54+13 campi su 3.940 persone |
| P3 | ElencoIscrizioni | 9.616 iscrizioni + 429 tessere |
| P4 | WORKSHOP | 859 iscrizioni + 518 pagamenti |
| P5 | MASTER | 3.257 pagamenti completi (sz1→sz4 + gbrh) |
| P6 | MASTER | 2.679 iscrizioni corsi + 430 prove |
| P8 | gbrh | 5 campi mancanti completati |
| P9 | AnaPersone | 13 nuovi campi DB su 2.190 persone |
| P10 | Workshop | 536 pagamenti aggiornati |

### Pulizia tessere
- 342 tessere Athena duplicate rimosse
- 77 tessere Athena → `previous_membership_number`
- Vincolo unicità `member_id + season_id` aggiunto

### Nuovi campi aggiunti al DB
- `members`: +fattura_fatta, +athena_id, +p_iva, +albo_*, +patente_*, +car_plate, +tutor2_*, +52 campi Athena
- `memberships`: +season_id, +data_quality_flag
- `payments`: +operator_name, +quota_description, +period, +transfer_confirmation_date, +total_quota, +deposit, +receipts_count, +discount_value, +gbrh_numero, +gbrh_data_emissione, +gbrh_data_scadenza, +gbrh_data_utilizzo, +gbrh_iban

### Metodi pagamento importati
- `bonifico_poste`: 1.299
- `bonifico_bpm`: 1.220
- `cash`: 616
- `contanti`: 518 (workshop)
- `NULL` (gbrh voucher): 55
- `welcomekit`: 35
- `online`: 32

---

## 7. ANALISI DB — SCHEMA RELAZIONALE (sistema Vino)

```
RADICE ASSOLUTA: members (4.489 record — 27 FK in entrata)
│
├── IDENTITÀ: users (via members.user_id)
│
├── DIDATTICA
│   ├── enrollments (13.584) → + courses
│   ├── attendances
│   ├── memberships (3.281)
│   └── studio_bookings
│
├── FINANZIARIO
│   ├── payments (3.775)
│   │   ├── carnet_wallets
│   │   ├── journal_entries
│   │   └── member_discounts
│   └── promo_rules
│
├── HR / STAFF
│   ├── staff_presenze
│   ├── staff_sostituzioni
│   ├── staff_contracts_compliance
│   ├── staff_disciplinary_log
│   ├── payslips
│   └── team_employees (16)
│
└── CRM / DOCUMENTI
    ├── medical_certificates (2.770)
    ├── member_uploads
    └── gem_conversations

SECONDO ALBERO: courses (586)
├── enrollments
├── attendances
├── staff_presenze
└── staff_sostituzioni
```

---

## 8. INFRASTRUTTURA

```
VPS: IONOS 82.165.35.145
DB: stargem_v2 MariaDB port 3306 (VPS) / 3307 (tunnel locale)
App: pm2 porta 5001, nome: stargem
Nginx: reverse proxy → stargem.studio-gem.it
Deploy: git push → Plesk git pull → npm run build → pm2 reload stargem
Backup: /root/backups/ via SSH mysqldump
Ultimo backup: CHAT22_CHIUSURA_DEFINITIVA_20260425_1005.sql (13MB)
```

---

## 9. REGOLE DB INVIOLABILI

```
payments / PaymentModuleConnector → SENSIBILE (14 route) — mai toccare
members → solo ADD COLUMN (mai modificare esistenti)
courses → non toccare struttura STI
enrollments → tabella iscrizioni UFFICIALE
custom_lists + custom_list_items → unico sistema categorie
Backup → obbligatorio dopo ogni F1 che modifica il DB
```

---

## 10. REGOLE OPERATIVE ANTIGRAVITY

```
F1 = AG-Backend → /server/, /shared/schema.ts
F2 = AG-Frontend → /client/src/
Chat nuova → F1-001 / F2-001
Stop & Go SEMPRE prima di modificare DB o file critici
Max 1 numero distanza F1/F2
Claude NON anticipa codice — descrive COSA e PERCHÉ
Antigravity esplora il codebase in autonomia
Anticipare il codice condiziona la ricerca e genera errori
```

---

## 11. FILE DI RIFERIMENTO AGGIORNATI (al 25/04/2026)

| File | Contenuto |
|------|-----------|
| `2026_04_25_1215_MASTER_STATUS.md` | Stato globale tutte le chat |
| `2026_04_25_1215_ANALISI_MASTER.md` | Visione strategica v5.0 |
| `2026_04_25_1215_StarGem_Checklist_Mappa.html` | Mappa visiva interattiva |
| `A_2026_04_24_1151_Architettura_Core_Server.md` | Architettura DB e backend |
| `B_2026_04_24_1151_Frontend_Moduli.md` | Mappa frontend ↔ DB |
| `D_2026_04_25_1215_Stato_DB_Reale.md` | Stato DB post-import |
| `D2_2026_04_24_1200_Stato_Mappa_Frontend.md` | Mappa frontend ↔ DB |
| `F_2026_04_22_1435_ULTIMI_AGGIORNAMENTI.md` | Log aggiornamenti |
| `G_2026_04_22_1435_Checklist_Operativa.md` | Checklist operativa AG |
| `RECAP_Chat22_Import_Export.md` | Recap Chat_22 chiusa |
| `2026_04_20_classificazione_stargem_v2.pdf` | Schema classificazione utenti |

---

*Chat ANALISI Strategica — StarGem Suite*
*Chiusa: 2026_04_25_1215*
*Archiviata in: _GAE_SVILUPPO/_CLAUDE/03_recap_chat/*
