# RECAP_00_ChatAnalisi — Coordinamento Globale StarGem Suite

> **Chat:** Chat Analisi (senza numero — hub di coordinamento globale)
> **Ruolo:** Produce decisioni, RECAPs e brief per le 21 chat operative. Non genera prompt AG direttamente.
> **Aggiornato:** 05/05/2026
> **Stato:** 🟡 Sessione chiusa — sostituita da nuova chat Analisi

---

## 1. IDENTITÀ E RUOLO DI QUESTA CHAT

La Chat Analisi è il **centro di coordinamento globale** del progetto StarGem Suite. Non ha numero progressivo. Non genera mai prompt per Antigravity direttamente: il suo output sono decisioni architetturali, RECAPs per le chat operative, e brief di apertura per nuovi moduli.

**Regola fondamentale:** Qualsiasi prompt operativo verso AG-F1 o AG-F2 deve partire dalle chat di modulo dedicate, non da qui.

---

## 2. STATO DEL PROGETTO AL MOMENTO DELLA CHIUSURA

Fonte: MASTER_STATUS.md aggiornato al 14/04/2026.

### ✅ Chat completate

| Chat | Protocolli | Note |
|------|-----------|------|
| **05_GemPass** | F1-007 / F2-007 | 22/22 test ✅ · memberships 4.701 record · member_forms_submissions |
| **02_GemStaff** | F1-017 / F2-021 | 6 tabelle staff_* · payslips · email SSL porta 465 · backup gemstaff_ASSOLUTO_20260413_1817.sql |
| **01_Quote e Promo** | F1-014 / F2-011 | Fase 1 ✅ · 18 tabelle · Webhook WooCommerce · STI 303 corsi |
| **00_errori** | F1-099 / F2-113 | Chiusa · 0 errori TypeScript · 0 bug aperti |

### 🟡 Chat in corso

| Chat | Stato | Pendenti |
|------|-------|---------|
| **03_GemTeam** | Test E2E finale | Test con botAI (check-in/out, diario, permessi, report mensile) → poi ✅ |

### 🔴 Chat da iniziare — ordine priorità

| # | Chat | Urgenza | Note |
|---|------|---------|------|
| 1 | **10_Utenti** | 🔴 URGENTE — prod 48h | Login hub per ruolo · reset password produzione · /utenti-permessi · zero tabelle nuove |
| 2 | **08_Corsi** | 🔴 Alta | Stagione in apertura · audit F1-001 · presenze corso |
| 3 | **09_Workshop** | 🔴 Alta | WS già venduti · workshop_costs da creare |
| 4 | **14_BookGem** | 🟠 Media | Calendario disponibilità · prezzi configurabili |
| 5 | **06_Contabilità_Cassa** | 🟠 Media | cash_registers · bank_deposits |
| 6 | **04_MedGem** | 🟠 Media | 4 tabelle medical_* · RECAP pronto |
| 7 | **07_Gemory** | 🟡 Normale | 5 tabelle kanban_* · seed 15 bacheche Trello · risposte D1-D5 già date |
| 8 | **12_Gemdario** | — | Da iniziare |
| 9 | **11_Campus** | — | Da iniziare |
| 10 | **13_DomenikeInMovimento** | — | Da iniziare |
| 11 | **15_Saggi** | — | Da iniziare |
| 12 | **16_VacanzeStudio** | — | Da iniziare |
| 13 | **17_Clarissa** | — | Da iniziare |
| 14 | **18_GemEvent** | — | Da iniziare |
| 15 | **19_GemNight** | — | Da iniziare |
| 16 | **20_MerchSG** | — | Da iniziare |

---

## 3. DECISIONI ARCHITETTURALI CONSOLIDATE

### 3.1 Architettura Auth (confermata 13/04/2026)

```
members.user_id VARCHAR(255) → FK → users.id (onDelete: set null)
user_id NULL   = persona senza account (cliente passivo)
user_id pieno  = persona con login attiva

Tutti accedono con EMAIL + PASSWORD (non username)

Ruoli (users.role — testo libero, NON FK):
  operator / admin  → gestionale completo
  client            → /area-clienti
  medico            → /medgem (solo suo calendario)
  insegnante        → /gemstaff/me (solo cedolino)
  dipendente        → /gemteam/me (workspace personale)

Policy "due cappelli": doppio ruolo = 2 account separati
ATTENZIONE: user_roles colonna si chiama 'name' (non 'roleName')
```

### 3.2 STI — Single Table Inheritance

Tutti i tipi di attività (corsi, workshop, domeniche, campus, vacanze, saggi, ecc.) convergono nella tabella `courses` via campo `category_id` → `custom_list_items`. Migrazione 303 record completata. I 4 silos legacy (Domeniche, Allenamenti, Lezioni, Saggi) sono stati marcati DEPRECATO in Drizzle.

### 3.3 WooCommerce

Piattaforma di vendita permanente. StarGem è source of truth e alimenta WooCommerce (non il contrario). Webhook attivo. Fase 2 Quote&Promo (outbound sync StarGem→WooCommerce) ancora da fare: F1-015 / F2-012 in chat 01.

### 3.4 Classificazione utenti (dal PDF classificazione)

```
UTENTE: società / persona fisica — tesserato (tessera attiva) o non tesserato
  - Partecipante = attivo (frequenta)
  - Non partecipante = non attivo (tessera attiva ma non frequenta)
STAFF: solo tesserati — Insegnanti, Personal, Personal Trainer
TEAM: solo tesserati — Dipendenti (ruolo + mansione + postazione), Collaboratori
Nota: una stessa persona può avere più etichette (Staff ∩ Team possibile)
```

### 3.5 Regole DB intoccabili

```
payments     → MAI DROP, solo ADD COLUMN
members      → solo ADD COLUMN, mai modificare esistenti
courses/enrollments → non si toccano
Prima di DROP qualsiasi tabella: COUNT=0 + grep codice + nessuna route attiva
Backup obbligatorio dopo ogni F1 che modifica il DB
```

### 3.6 3 SKU storici da non toccare mai

```
2526QUOTATESSERA → memberships (Smart Routing attivo)
2526DTYURI       → medical_certificates
2526DTNELLA      → medical_certificates
```

---

## 4. STATO DB AL MOMENTO DELLA CHIUSURA

```
MariaDB stargem_v2 · VPS IONOS 82.165.35.145 · pm2 porta 5001
Ultimo backup: gemstaff_ASSOLUTO_20260413_1817.sql — 9.2MB
Tabelle: ~85+ fisiche

CORE (non toccare):
  members (9.506) · payments · courses (421 STI)
  enrollments · seasons · custom_lists
  users · user_roles

MODULI ATTIVI:
  GemPass:     memberships (4.701) · member_forms_submissions
  GemStaff:    staff_presenze · staff_sostituzioni · payslips
               staff_contracts_compliance · staff_document_signatures · staff_disciplinary_log
  Quote&Promo: promo_rules (50) · welfare_providers (4) · carnet_wallets · carnet_sessions
               instructor_agreements (9) · agreement_monthly_overrides
               pagodil_tiers · pricing_rules · price_matrix
               member_discounts · company_agreements (11) · staff_rates
               cost_centers (7) · accounting_periods (30) · journal_entries
  Gemory base: todos · team_notes · team_comments
  GemTeam:     15 tabelle team_* (employees, shifts, attendance, diary, ecc.)
  Booking:     studios · studio_bookings
  Planning:    strategic_events

TABELLE DA CREARE — prossimi moduli:
  AUTH: ALTER users ADD email_verified, otp_token, otp_expires_at
  MedGem: medical_appointments · medical_visit_types · medical_doctor_config · medical_slot_pricing
  Contabilità: cash_registers · bank_deposits
  Gemory Kanban: kanban_boards · kanban_lists · kanban_cards · kanban_card_assignees · kanban_card_comments
  Workshop: workshop_costs
```

---

## 5. STACK TECNICO

```
Frontend:  React + TypeScript + Tailwind + React Query
Backend:   Node.js + Drizzle ORM
DB:        MariaDB 11.4 / stargem_v2
VPS:       IONOS Ubuntu 24.04
SSH tunnel: porta 3307
Dev server: localhost:5001
Deploy:    Git push → main → Gaetano pubblica manualmente in Plesk
Agenti:    AG-F1 (backend/database) · AG-F2 (frontend/React)
```

---

## 6. COLORI ATTIVITÀ STI

```
Corsi CRS     → categoria variabile
Allenamenti   → #1e40af
Lezioni IND   → #7c3aed
Workshop WS   → #c2410c
Domeniche     → #a16207
Saggi         → #be185d
Vacanze       → #15803d
Campus        → #0369a1
Affitti AFT   → #374151
```

---

## 7. BRIEF CHAT TEOCOPILOT (memo Gaetano — da aprire in futuro)

Testo di apertura già redatto e approvato. Punti chiave:

- **Obiettivo:** trasformare TeoCopilot da mock statico a vero agente AI operativo interno
- **Visibilità:** solo team interno — mai tesserati o insegnanti
- **Capacità target:** lettura PDF (fatture, contratti, certificati), inserimento dati contabili da scansione, accesso dati reali (membri, pagamenti, corsi, compensi), azioni operative guidate
- **Stato attuale:** `teo-copilot.tsx` esistente · route `POST /api/copilot/generate-note` mock con setTimeout · `aiProvider.ts` da creare · layout push side-by-side già implementato (Fase 29) · avatar Teo integrati
- **Provider scelto Fase 1:** Anthropic Claude Sonnet · `ANTHROPIC_API_KEY` già in .env e su Plesk VPS
- **Condizione di apertura:** aprire questa chat solo dopo che la chat **10_Utenti** è completata (GemPortal non è una chat del piano — potrebbe essere alias di Area Clienti/Totem)
- **Protocolli:** ripartono da F1-001 / F2-001
- **Prima azione:** audit completo `teo-copilot.tsx` + route `/api/copilot/generate-note`

---

## 8. REGOLE OPERATIVE ANTIGRAVITY — RIEPILOGO

```
F1 = AG-Backend  → /server/, /shared/schema.ts
F2 = AG-Frontend → /client/src/
Ogni chat nuova → F1-001 / F2-001 (non continuare numerazione di altre chat)
Stop & Go SEMPRE prima di qualsiasi modifica a DB o file critici
Max 1 numero di distanza tra F1 e F2
Nessun protocollo successivo senza risposta di ENTRAMBE le finestre
Backup dopo ogni F1 che tocca il DB:
  mariadb-dump -u gaetano_admin -p'...' stargem_v2 > /root/backups/[chat]_F1-[N]_$(date +%Y%m%d_%H%M).sql
```

**Intestazione obbligatoria ogni prompt AG:**
Prima riga in maiuscolo: `PER AG-F1 (BACKEND)` oppure `PER AG-F2 (FRONTEND)`
Se 2 prompt nello stesso messaggio: F1 PRIMA, poi F2.

**Prima azione obbligatoria in ogni prompt AG:**
```
Leggi:
- _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md
- _GAE_SVILUPPO/_CLAUDE/03_recap_chat/RECAP_NN_NomeChat.md
Poi procedi con...
```

---

## 9. REGOLE UI — TRASVERSALI A TUTTE LE CHAT

```
ACCORDION ATTIVITÀ: cards CHIUSE di default su tutte le pagine iscritti_per_attivita
  → Global "Espandi tutto / Comprimi tutto" in alto
  → Apertura/chiusura singola a controllo utente

CONTATORI HEADER: doppio counter top-right su tutte le pagine lista attività
  → "12 schede · 487 iscritti"
  → Schede inattive: stile attenuato (grigio/strikethrough), non nascoste

COERENZA CALENDARIO ↔ ISCRITTI:
  → Schede attive in /iscritti_per_attivita devono corrispondere esattamente
    alle attività visibili nel Calendario di oggi
  → Ogni fix UI deve verificare questa coerenza post-modifica
```

---

## 10. PROTOCOLLO AGGIORNAMENTO MASTER_STATUS — TEMPLATE

Da usare a fine di ogni sessione operativa:

```
## [NUMERO]_[NomeChat] — aggiornato [DATA]
Stato: [🔴 Da iniziare / 🟡 In corso / ✅ Completata]
Ultimo protocollo: F1-[NNN] / F2-[NNN]
Tabelle DB toccate: [elenco o "nessuna"]
Pendenti: [cosa resta aperto o "nulla"]
```

---

## 11. NOTE SESSIONE CORRENTE (05/05/2026)

- Sessione in **modalità browser/mobile** — MCP filesystem non disponibile
- Gaetano ha condiviso il brief per Chat_TeoCopilot (memo completo salvato in sezione 7)
- Rilevata incongruenza: "GemPortal" citato nel memo non esiste nel piano formale delle 21 chat — probabilmente alias per "Area Clienti / Totem Kiosk" (da chiarire alla riapertura)
- Gaetano ha aggiornato le istruzioni del Progetto Claude con protocollo di aggiornamento integrato automaticamente
- MASTER_STATUS aggiornato al 14/04/2026 letto e recepito
- **Questa chat viene eliminata** — il recap presente in questo file è l'unica fonte di verità per la nuova Chat Analisi

---

*Fine RECAP_00_ChatAnalisi — da caricare in `_GAE_SVILUPPO/_CLAUDE/03_recap_chat/`*
