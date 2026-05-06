# RECAP_17_Clarissa — CRM & Marketing Automation
> Chat: 17_Clarissa
> Aggiornato: 05/05/2026
> Stato: 🔴 Da iniziare — F1-001 NON ancora eseguito

---

## 1. SCOPO DI QUESTA CHAT

Clarissa è il modulo CRM e marketing automation interno di StarGem Suite.
Obiettivo: sostituire Bitrix per la parte CRM, gestendo comunicazioni automatiche
verso i membri (email, SMS) basate su trigger configurabili.

**Nota architetturale importante:**
La decisione finale è che Clarissa è un **modulo INTERNO** a StarGem, NON
un'integrazione verso un SaaS esterno. Il documento strategico precedente
`06_Futuro_Espansione_CRM.md` ipotizzava un'integrazione con un CRM esterno
(tipo Clarissa SaaS) — quella strada è abbandonata. Tutto gira su StarGem.

---

## 2. STATO ALL'APERTURA DELLA CHAT

### Cosa esiste già (confermato da lettura file GAE_SVILUPPO)

| Componente | Stato |
|---|---|
| Stub UI `/copilot` | Esiste ma completamente vuoto |
| Tabella `automation_rules` | ❌ Non creata |
| Tabella `email_logs_history` | ❌ Non creata |
| Tabella `marketing_campaigns` | ❌ Non creata |
| Mailer utility Node.js | ✅ Già esiste (creata in GemStaff F1-015/016) |
| SMTP config in `.env` e `.env.example` | ✅ Scaffolding già presente |
| CRM score in `members` | ✅ Parziale (logica in crm-config.ts, livelli Silver/Gold/Platinum/Diamond) |
| SMS gateway | ❌ Non configurato |
| Route API Clarissa | ❌ Nessuna |

### Contesto DB al momento dell'apertura
- ~85+ tabelle fisiche in `stargem_v2`
- 9.506 members totali, 5.887 con email valida
- Moduli completati: GemPass ✅, GemStaff ✅, Quote&Promo ✅
- SMTP/mailer: pronto per essere riutilizzato senza duplicare codice

---

## 3. ANALISI SVOLTA IN QUESTA CHAT

### 3.1 Lettura documenti di riferimento
- `MASTER_STATUS.md` — letto e analizzato (versione 14/04/2026)
- `ANALISI_MASTER.md` — letto
- `00A_GAE_ULTIMI_AGGIORNAMENTI.md` — letto (fino al 13/04/2026)
- `00B_GAE_Checklist_Operativa.md` — letto (sezione CRM)
- `06_Futuro_Espansione_CRM.md` — letto (piano strategico precedente)
- `01_Architettura_e_Database_Core.md` — letto (sezione Clarissa)
- `04_Stato_Lavori_e_Briefing_Tecnico.md` — letto (stato 🔵 CONGELATO)

### 3.2 Decisioni architetturali prese in questa chat

**A. Clarissa = modulo interno (non SaaS esterno)**
Niente middleware verso API esterne. Tutto il codice vive in StarGem.

**B. Tabelle minime da creare (Fase A)**
```
automation_rules       — trigger configurabili (evento + condizione + azione)
email_logs_history     — log di ogni comunicazione inviata per membro
```
Tabella `marketing_campaigns` rinviata a Fase successiva (non bloccante).

**C. Piano sviluppo in 3 fasi**

| Fase | Contenuto | Finestra |
|------|-----------|---------|
| A — DB Foundation | Crea automation_rules + email_logs_history | F1 |
| B — Backend Engine | Route CRUD + cron trigger engine + log invio | F1 |
| C — Frontend | Pagina /clarissa con 5 tab | F2 |

**D. Frontend — struttura pagina `/clarissa` (5 tab)**
1. **Automazioni** — crea/modifica/attiva trigger
2. **Liste** — segmenti membri per tag/stato
3. **Templates** — editor messaggi email/SMS
4. **Storico** — log comunicazioni per membro
5. **Dashboard** — statistiche aperture/click

**E. Trigger automatici previsti (MVP)**
- Scadenza tessera -30 giorni → email reminder
- Scadenza certificato medico -7 giorni → email/SMS alert
- Compleanno → messaggio personalizzato
- Re-engagement → email dopo N giorni di inattività

---

## 4. PROTOCOLLI ESEGUITI

### Nessun protocollo eseguito in questa chat.
F1-001 è stato preparato (testo completo sotto) ma NON ancora inviato ad AG-BACKEND.
Non ci sono state modifiche al DB, al backend o al frontend.

---

## 5. PROMPT F1-001 PRONTO (DA INVIARE)

Questo è il testo completo del prompt F1-PROTOCOLLO-001 da copiare in AG-BACKEND:

```
PER AG-F1 (BACKEND)

Sei AG-BACKEND nel progetto StarGem Suite (Node.js + MariaDB 11.4).
DB: stargem_v2, tunnel SSH porta 3307.
Protocollo: F1-PROTOCOLLO-001 — AUDIT CLARISSA
Regola: SOLO SELECT e SHOW. Zero modifiche. Riporta tutto prima di agire.

PRIMA AZIONE OBBLIGATORIA: leggi
- _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md
- _GAE_SVILUPPO/_CLAUDE/03_recap_chat/RECAP_17_Clarissa.md

Poi esegui questo audit e riportami i risultati esatti:

1. ROUTE ESISTENTI — Clarissa o copilot:
   grep -r "clarissa\|copilot\|automation_rules\|email_logs" /root/stargem/server/ --include="*.ts" -l

2. FILE FRONTEND — stub /copilot:
   find /root/stargem/client/src -name "*.tsx" | xargs grep -l "copilot\|clarissa" 2>/dev/null

3. TABELLE CRM-CORRELATE già esistenti nel DB:
   SHOW TABLES FROM stargem_v2 LIKE '%email%';
   SHOW TABLES FROM stargem_v2 LIKE '%automation%';
   SHOW TABLES FROM stargem_v2 LIKE '%campaign%';
   SHOW TABLES FROM stargem_v2 LIKE '%log%';
   SHOW TABLES FROM stargem_v2 LIKE '%notification%';

4. MAILER UTILITY — verifica esistenza e contenuto:
   find /root/stargem/server -name "mailer*" -o -name "*mail*" 2>/dev/null
   (poi mostrami il contenuto del file trovato)

5. SMTP CONFIG — verifica .env:
   grep -i "smtp\|mail\|sendgrid\|mailgun" /root/stargem/.env 2>/dev/null || echo "SMTP non configurato"

6. COLONNE CRM su members:
   SHOW COLUMNS FROM members LIKE '%crm%';
   SHOW COLUMNS FROM members LIKE '%marketing%';
   SHOW COLUMNS FROM members LIKE '%consent%';
   SHOW COLUMNS FROM members LIKE '%tag%';

7. CONTA MEMBERS con email valida:
   SELECT COUNT(*) as totale_con_email FROM members
   WHERE email IS NOT NULL AND email != '';

8. VERIFICA crm-config.ts:
   find /root/stargem -name "crm-config*" 2>/dev/null
   (poi mostrami il contenuto)

Riporta ogni risultato in modo esatto. Non modificare nulla.
Stop & Go — aspetta il mio "vai" prima di qualsiasi azione futura.
```

---

## 6. DIPENDENZE DA ALTRI MODULI

| Modulo | Dipendenza | Stato |
|--------|-----------|-------|
| GemPass | Trigger scadenza tessera -30gg → Clarissa | ✅ GemPass completato, campo `expiry_date` in memberships disponibile |
| MedGem | Trigger scadenza cert. medico -7gg → Clarissa | 🔴 MedGem non ancora iniziato |
| members | Email e consenso marketing | ✅ Disponibile (5.887 con email) |
| SMTP/mailer | Invio email | ✅ Già scaffoldato in GemStaff |
| users | Ruolo admin per accesso tab disciplinare | ✅ Disponibile |

---

## 7. TABELLE PREVISTE — SCHEMA IPOTETICO (da validare con F1-001)

### `automation_rules`
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
name            VARCHAR(255) NOT NULL
trigger_type    ENUM('tessera_scadenza','cert_scadenza','compleanno','inattivita','manuale')
trigger_days    INT NULL              -- es. -30 (giorni prima dell'evento)
channel         ENUM('email','sms','whatsapp') DEFAULT 'email'
template_id     INT NULL              -- FK → templates (futura)
subject         VARCHAR(255) NULL     -- per email
body_text       TEXT NULL             -- corpo messaggio (con placeholder)
is_active       BOOLEAN DEFAULT TRUE
created_at      DATETIME DEFAULT NOW()
updated_at      DATETIME DEFAULT NOW() ON UPDATE NOW()
```

### `email_logs_history`
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
member_id       INT NOT NULL          -- FK → members.id
rule_id         INT NULL              -- FK → automation_rules.id
channel         ENUM('email','sms','whatsapp') DEFAULT 'email'
recipient       VARCHAR(255) NOT NULL -- email o telefono destinatario
subject         VARCHAR(255) NULL
body_preview    TEXT NULL             -- primi 500 chars
status          ENUM('sent','failed','bounced','opened','clicked') DEFAULT 'sent'
sent_at         DATETIME DEFAULT NOW()
opened_at       DATETIME NULL
error_message   TEXT NULL             -- in caso di fallimento
```

---

## 8. CHAT CORRELATE DA LEGGERE

| Chat | Perché è rilevante |
|------|-------------------|
| 05_GemPass | Campo `expiry_date` in memberships — trigger tessera |
| 04_MedGem | Campo scadenza cert. medico — trigger certificato (non ancora creato) |
| 02_GemStaff | Mailer utility già esistente — riutilizzare senza duplicare |
| 10_Utenti | Ruoli e permessi — chi può accedere a /clarissa |

---

## 9. STATO MASTER_STATUS — AGGIORNAMENTO DA APPLICARE

```
## 17_Clarissa — aggiornato 05/05/2026
Stato: 🔴 Da iniziare
Ultimo protocollo: F1-000 / F2-000 (nessuno eseguito)
Tabelle DB toccate: nessuna
Pendenti: inviare F1-001 audit a AG-BACKEND · attendere risposta · progettare schema tabelle · poi F2-001
```

---

## 10. NOTE OPERATIVE PER LA PROSSIMA SESSIONE

1. **Prima cosa:** Caricare questo RECAP in `_GAE_SVILUPPO/_CLAUDE/03_recap_chat/RECAP_17_Clarissa.md`
2. **Seconda cosa:** Inviare il prompt F1-001 (sezione 5 di questo documento) ad AG-BACKEND
3. **Terza cosa:** Attendere risposta AG-BACKEND prima di aprire F2-001
4. La chat si chiama **17_Clarissa** — numerazione protocolli riparte da F1-001 / F2-001
5. Il mailer di GemStaff F1-015 va **riutilizzato** — AG deve trovarlo nell'audit e confermarne la struttura
6. Valutare in F1-002 se aggiungere colonna `marketing_consent` su members (check GDPR)

---

*Fine RECAP_17_Clarissa — generato 05/05/2026*
