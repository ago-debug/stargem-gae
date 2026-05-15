# RECAP_16_VacanzeStudio
> Chat: 16_VacanzeStudio — StarGem Suite
> Creato: 05/05/2026
> Stato: 🔴 Da iniziare — nessun protocollo eseguito
> Da caricare in: `_GAE_SVILUPPO/_CLAUDE/03_recap_chat/`

---

## 1. IDENTITÀ CHAT

| Campo | Valore |
|-------|--------|
| Numero chat | 16 |
| Nome | VacanzeStudio |
| Ruolo | Modulo Vacanze — pacchetti soggiorno in location esterne |
| AG-Backend | F1-001 (da eseguire) |
| AG-Frontend | F2-001 (da eseguire) |
| Stato MASTER | 🔴 Da iniziare |
| Backup DB | nessuno (nessuna modifica al DB) |

---

## 2. CONTESTO BUSINESS

**Cos'è il modulo Vacanze:**
Gestione di pacchetti vacanza organizzati da Studio GEM in location esterne (mare, montagna, ecc.) durante i periodi di chiusura scolastica. Si tratta di pacchetti all-inclusive che combinano attività di danza/fitness con trasporto e/o alloggio.

**Differenze rispetto ai corsi standard:**
- Quote **inclusive** (trasporto + alloggio + attività) — non solo quota corso
- **Date di soggiorno** a blocco (data_partenza / data_ritorno), non giorni settimana ricorrenti
- **Caparra + saldo** con scadenze distinte
- **Location esterna** (struttura, città, indirizzo)
- **Posti disponibili** fissi (non ore settimanali)
- Lista partecipanti con tracciamento stato pagamento (caparra versata / saldo versato / totale)

---

## 3. ARCHITETTURA STI — CONTESTO

Il modulo Vacanze è un `activity_type = 'vacanze'` nella tabella STI `courses`.

**Colore assegnato:** `#15803d` (verde) — già registrato in MASTER_STATUS.

**Storia legacy:**
- Esisteva la tabella silo `vacation_studies` (silo pre-STI)
- Nel cleanup massivo F1-063 (08/04/2026) sono state droppate 16 tabelle legacy
- **Non è confermato** se `vacation_studies` sia stata droppata o se contenga ancora dati storici
- Il pattern di migrazione silo → STI è già validato: `campus_activities` → `activity_type = 'campus'` è stato fatto con successo

---

## 4. PROTOCOLLI ESEGUITI

**Nessuno.** Questa chat ha svolto solo analisi e pianificazione. Il prompt F1-001 è stato redatto ma **non ancora inviato ad Antigravity**.

---

## 5. DECISIONI PRESE

### 5A. Piano protocolli

```
F1-001  Audit DB: vacation_studies + courses WHERE activity_type='vacanze'
F1-002  Schema extension: tabella vacation_details (campi specifici vacanze)
F1-003  Migrazione dati storici (se vacation_studies non è vuota o non è stata droppata)
F1-004  API backend: CRUD vacanze + lista partecipanti + stato pagamenti caparra/saldo

F2-001  Audit frontend: vacanze.tsx stato attuale
F2-002  Pagina /vacanze — lista pacchetti
F2-003  Modal creazione/edit pacchetto vacanza
F2-004  Tab iscritti con caparra/saldo tracker
```

### 5B. Campi specifici identificati per vacation_details (ipotesi pre-audit)

| Campo | Tipo | Note |
|-------|------|------|
| `course_id` | FK → courses | Collegamento al record STI padre |
| `location_name` | VARCHAR | Nome struttura/hotel |
| `location_city` | VARCHAR | Città |
| `location_address` | VARCHAR | Indirizzo completo |
| `date_departure` | DATE | Data partenza |
| `date_return` | DATE | Data ritorno |
| `max_participants` | INT | Posti disponibili |
| `price_total` | DECIMAL | Quota totale inclusiva |
| `price_deposit` | DECIMAL | Importo caparra |
| `deposit_deadline` | DATE | Scadenza versamento caparra |
| `balance_deadline` | DATE | Scadenza saldo |
| `includes_transport` | BOOLEAN | Trasporto incluso |
| `includes_accommodation` | BOOLEAN | Alloggio incluso |
| `notes_logistics` | TEXT | Note logistiche |

> ⚠️ Questi campi sono **ipotesi da verificare** — la struttura definitiva deve emergere dall'audit F1-001.

---

## 6. PROMPT F1-001 — PRONTO PER ESECUZIONE

Questo è il prompt da incollare in **AG-BACKEND** per avviare il modulo:

---

```
PER AG-F1 (BACKEND)

Sei Antigravity AG-BACKEND nel progetto StarGem Suite.
Leggi MASTER_STATUS.md. Stack: Node.js/Drizzle/MariaDB 11.4,
DB: stargem_v2, server localhost:5001, tunnel SSH porta 3307.
Questa chat: modulo Vacanze (Chat_16_VacanzeStudio). Protocollo: F1-001.

REGOLA STOP & GO: rispondi SOLO con l'audit. Zero modifiche al DB.

F1-PROTOCOLLO-001 — AUDIT VACANZE

Esegui in sequenza le seguenti query (SELECT/SHOW only, zero modifiche):

-- 1. Verifica esistenza tabella legacy
SHOW TABLES LIKE 'vacation%';

-- 2. Se esiste vacation_studies: struttura + conteggio record
SHOW CREATE TABLE vacation_studies;
SELECT COUNT(*) AS total_records FROM vacation_studies;
SELECT * FROM vacation_studies LIMIT 3;

-- 3. Verifica corsi con activity_type = 'vacanze' nella tabella STI
SELECT COUNT(*) AS vacanze_in_courses
FROM courses
WHERE activity_type = 'vacanze';

SELECT id, name, activity_type, season_id, status, created_at
FROM courses
WHERE activity_type = 'vacanze'
LIMIT 10;

-- 4. Verifica colonne di courses rilevanti per vacanze
SHOW COLUMNS FROM courses;

-- 5. Verifica enrollments legati a eventuali vacanze
SELECT COUNT(*) AS vacanze_enrollments
FROM enrollments e
JOIN courses c ON e.course_id = c.id
WHERE c.activity_type = 'vacanze';

-- 6. Check tabella payments per eventuali pagamenti vacanze
SELECT COUNT(*) AS vacanze_payments
FROM payments
WHERE notes LIKE '%vacanz%' OR description LIKE '%vacanz%'
LIMIT 5;

-- 7. Verifica custom_lists per eventuali liste vacanze
SELECT id, name, system_code
FROM custom_lists
WHERE name LIKE '%vacan%' OR system_code LIKE '%vacan%';

Riporta tutti i risultati con precisione.
Stop & Go: aspetta il mio "vai" prima di qualsiasi modifica.
```

---

## 7. CONTESTO TECNICO DA RICORDARE

- **STI attivo e stabile:** `courses` ha 421 record, `activity_type` già discrimina tutti i tipi
- **Tabelle core da non toccare:** `payments` (solo ADD COLUMN), `members`, `courses`, `enrollments`
- **Pattern iscrizioni:** tutte le iscrizioni vanno in `enrollments` con FK → `courses.id`
- **Pagamenti caparra/saldo:** probabilmente due record `payments` separati con stesso `course_id` / `member_id` e tipo diverso — da decidere dopo audit
- **user_roles:** colonna si chiama `name` (non `roleName`)
- **Backup obbligatorio** dopo ogni F1 che tocca il DB

---

## 8. CHAT CORRELATE DA LEGGERE A INIZIO SESSIONE

| Chat | Motivo |
|------|--------|
| `11_Campus` | Pattern identico — pacchetti multi-giorno con iscrizioni e posti |
| `01_QuotaPromo` | Sistema prezzi, caparre, scadenze pagamento |
| `08_Corsi` | Pattern iscrizioni + lista partecipanti per corso |
| `05_GemPass` | Verifica tessera attiva prima di iscrizione a vacanza |

---

## 9. AGGIORNAMENTO MASTER_STATUS — DA APPLICARE

Alla prima sessione operativa, aggiornare il MASTER_STATUS con:

```
## 16_VacanzeStudio — aggiornato [DATA]
Stato: 🟡 In corso
Ultimo protocollo: F1-001 / F2-000
Tabelle DB toccate: nessuna (solo audit)
Pendenti: valutare risultati audit → definire vacation_details → F1-002
```

---

*Fine RECAP_16_VacanzeStudio.md*
