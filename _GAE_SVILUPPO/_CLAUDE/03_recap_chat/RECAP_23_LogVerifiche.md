# RECAP_23 — Chat_Log: Sistema Audit e Tracciamento
**Aggiornato:** 2026-05-05
**Stato:** 🔴 DA AVVIARE — F1-001 emesso, risposta AG non ancora ricevuta
**Ultimo protocollo emesso:** F1-001 (esplorativo, zero modifiche)
**Tabelle DB toccate:** nessuna (solo lettura)
**Chat eliminata:** sì — questo RECAP è la fonte di verità

---

## 1. OBIETTIVO DELLA CHAT

Costruire e collegare al frontend il **sistema di audit log** per tracciare tutte le azioni nel gestionale StarGem Suite.

Ogni azione deve essere tracciata con:
- **Chi** ha fatto l'azione (utente loggato — `users.id` + nome)
- **Cosa** ha fatto (modifica / inserimento / cancellazione / pagamento / login / logout)
- **Su quale record** (es. "Ferrari Matilde" — member_id, enrollment_id, ecc.)
- **Quando** (data e ora esatta)
- **Dettaglio** (campo cambiato: vecchio valore → nuovo valore)

---

## 2. CONTESTO DB AL MOMENTO DI APERTURA CHAT

**Data riferimento:** 24/04/2026
**DB:** `stargem_v2` su MariaDB 11.4 — VPS IONOS / dev localhost:5001

### Tabelle log esistenti nel DB (fotografia iniziale)

| Tabella | Record noti | Stato stimato |
|---|---|---|
| `user_activity_logs` | **2.084** | Attiva — popolata da sessioni/login/logout |
| `audit_logs` | **0** (stimato) | Schema presente, non popolata da nessuna route |
| `access_logs` | nd | Tornelli fisici — uso diverso dall'audit gestionale |
| `team_employee_activity_log` | nd | GemTeam — log granulari dipendenti |
| `webhook_logs` | **2** | Solo webhook WooCommerce |
| `deprecation_logs` | **1** | Solo warning API legacy (`/api/instructors`) |

### Ipotesi di lavoro pre-analisi (non confermate da AG)

- `user_activity_logs` viene usata per tracking sessioni (presenza online, "Tempo di lavoro" dashboard). Non è un audit generale delle azioni CRUD.
- `audit_logs` esiste ma è un guscio vuoto — nessuna route la popola.
- Non esiste alcuna UI frontend dedicata alla visualizzazione dei log.
- Il sistema di audit è da costruire quasi da zero sulle tabelle esistenti.

---

## 3. PROTOCOLLI EMESSI

### F1-PROTOCOLLO-001
**Tipo:** AUDIT ESPLORATIVO — zero modifiche a DB o codice
**Stato:** ⏳ EMESSO — risposta AG non ricevuta (chat eliminata prima)
**Destinatario:** AG-F1 (Backend)

**Contenuto del protocollo (da rieseguire nella nuova chat):**

#### STEP 1 — DESCRIBE tutte le tabelle log
```sql
DESCRIBE audit_logs;
SELECT COUNT(*) AS tot_audit_logs FROM audit_logs;

DESCRIBE user_activity_logs;
SELECT COUNT(*) AS tot_user_activity_logs FROM user_activity_logs;

DESCRIBE access_logs;
SELECT COUNT(*) AS tot_access_logs FROM access_logs;

DESCRIBE team_employee_activity_log;
SELECT COUNT(*) AS tot_team_employee_activity_log FROM team_employee_activity_log;

DESCRIBE webhook_logs;
SELECT COUNT(*) AS tot_webhook_logs FROM webhook_logs;

DESCRIBE deprecation_logs;
SELECT COUNT(*) AS tot_deprecation_logs FROM deprecation_logs;
```

#### STEP 2 — Campione dati reali
```sql
SELECT * FROM user_activity_logs ORDER BY created_at DESC LIMIT 5;
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;
```

#### STEP 3 — Grep nel backend
```bash
grep -rn "audit_log\|insertAuditLog\|createLog\|logAudit" server/
grep -rn "user_activity_logs" server/
grep -rn "team_employee_activity_log" server/
grep -rn "INSERT.*audit\|INSERT.*activity_log\|INSERT.*access_log" server/
```

#### STEP 4 — Grep nel frontend
```bash
grep -rn "audit\|activity.log\|log-attivita\|sistema-log" client/src/
grep -rn "audit\|log\|attivita" client/src/components/Sidebar.tsx
```

#### STEP 5 — Report atteso da AG (formato richiesto)
```
1. SCHEMA audit_logs
   Colonne: [elenco con tipo]
   FK presenti: [sì/no + quali]
   Stato popolamento: [vuota / N record]

2. SCHEMA user_activity_logs
   Colonne: [elenco con tipo]
   Cosa salva realmente: [da dati campione]
   Esempio record reale: [1 riga anonimizzata]

3. ROUTES CHE POPOLANO I LOG
   [elenco route → tabella target]
   oppure: "Nessuna route trovata"

4. UI ESISTENTE
   Esiste pagina visualizzazione log: [Sì/No]
   Se sì: percorso file + URL rotta

5. GAP IDENTIFICATI
   [elenco di cosa manca]
```

---

## 4. PIANO DI LAVORO PIANIFICATO (non ancora eseguito)

Questo era il piano previsto dopo il ritorno di F1-001:

### Fase A — Analisi (F1-001, F2 non ancora coinvolto)
- Fotografia completa struttura tabelle log
- Verifica popolamento da routes
- Verifica esistenza UI

### Fase B — Backend (F1-002 in poi)
- Decidere se usare `audit_logs` come tabella master dell'audit CRUD, oppure potenziare `user_activity_logs`
- Creare helper function `logAudit(userId, action, table, recordId, oldValue, newValue)` nel backend
- Agganciare l'helper alle route critiche: members, enrollments, payments, memberships, courses
- **Regola:** solo ADD COLUMN se serve — mai DROP — backup obbligatorio prima

### Fase C — Frontend (F2-001 in poi)
- Pagina `/log-attivita` o `/sistema/audit` con tabella paginata
- Filtri: per utente, per tipo azione, per data, per record target
- Colonne: Data/ora · Utente · Azione · Modulo · Record · Dettaglio (old→new)
- Accesso solo a ruoli `admin` e `super_admin`

---

## 5. DECISIONI ARCHITETTURALI APERTE

Le seguenti decisioni erano aperte al momento della chiusura della chat e vanno riprese nella nuova sessione:

| # | Decisione | Opzione A | Opzione B | Stato |
|---|---|---|---|---|
| 1 | Tabella master audit | Usare `audit_logs` esistente | Usare `user_activity_logs` potenziata | ⏳ Aspetta report AG |
| 2 | Granularità log | Solo azioni critiche (payments, members) | Tutte le route CRUD | ⏳ Da decidere |
| 3 | Storage old/new value | Colonna JSON `diff` | Colonne separate `old_value` / `new_value` | ⏳ Dipende da schema |
| 4 | UI collocazione | Pagina dedicata `/audit` in sidebar | Tab dentro `/sistema` o `/admin` | ⏳ Da decidere |

---

## 6. CONTESTO GENERALE STARGEM AL 24/04/2026

(Riepilogo stato progetto per orientarsi alla riapertura)

| Chat | Stato |
|---|---|
| 00_errori | ✅ CHIUSA — F1-099/F2-113 |
| 01_quote_promo | 🟡 FASE 1 CHIUSA — F1-015 pendente (WooCommerce sync) |
| 02_GemStaff | ✅ COMPLETATA — F1-016/F2-019 |
| 03_GemTeam | 🟡 COMPLETATA con pendente critico (turni wipe — reimportare) |
| 05_GemPass | ✅ COMPLETATA — F1-007/F2-007 |
| 10_Utenti/GemPortal | ✅ COMPLETATA — F1-014/F2-012 |
| 12_Gemdario | 🟡 IN COLLAUDO — UI FREEZE attivo |
| **23_Log** | 🔴 DA AVVIARE — F1-001 emesso, AG non ha ancora risposto |

**Dati DB al 24/04/2026:**
- members: 4.489 · memberships: 3.700 · enrollments: 10.475
- payments: 3.775 · medical_certificates: 2.770 · courses: 581
- users: 19 (staff) · seasons: 3

**Stack:** React + TypeScript + Tailwind (frontend) · Node.js + Drizzle ORM (backend) · MariaDB 11.4 · VPS IONOS Ubuntu 24.04 · dev localhost:5001

---

## 7. ISTRUZIONI PER LA RIAPERTURA

Quando riapri questa chat (nuova istanza), la **prima azione** è:

1. Caricare questo RECAP nel Project Knowledge o incollarlo nel contesto
2. Inviare ad AG-F1 esattamente il **F1-PROTOCOLLO-001** riportato nella sezione 3 di questo file
3. Attendere il report da AG prima di qualsiasi altra azione
4. Dopo il report: valutare con Gaetano le 4 decisioni architetturali aperte (sezione 5)
5. Solo dopo il VAI esplicito: procedere con F1-002

**Il protocollo F1-001 NON va ri-numericato** — è ancora il 001 perché questa chat parte da zero.

---

## 8. CHAT CORRELATE DA LEGGERE ALLA RIAPERTURA

- `RECAP_10_Utenti_GemPortal.md` — per architettura auth, ruoli, `users.role`
- `RECAP_03_GemTeam.md` — per `team_employee_activity_log` (già parzialmente usata)
- `RECAP_00_errori.md` — per la pulizia STI e tabelle droppate
- `MASTER_STATUS.md` — versione più recente disponibile in `_GAE_SVILUPPO/_CLAUDE/01_canonici/`

---

*RECAP generato il 2026-05-05 — Chat_Log eliminata dopo questa esportazione.*
*Prossimo numero protocollo alla riapertura: F1-001 (da rieseguire) / F2-001 (non ancora emesso).*
