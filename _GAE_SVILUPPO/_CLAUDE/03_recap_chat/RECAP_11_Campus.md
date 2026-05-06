# RECAP_11_Campus — StarGem Suite
> Chat: **Chat_11_Campus**
> Stato: 🔴 Da iniziare (F1-001 pronto, non ancora eseguito)
> Ultimo aggiornamento: 05/05/2026
> Redatto da: Claude (Chat Analisi coordinamento)

---

## 1. CONTESTO MODULO

**Campus** = settimane intensive lun-ven per bambini e ragazzi, tipicamente a giugno.
In StarGem è `activity_type = 'campus'` nella tabella `courses` (STI — Single Table Inheritance).

**Tipi campus identificati dal file Excel 24/25:**
- `CAMPUS_ESTIVO` — attività multisport/ricreativa, fasce d'età 6-13 anni
- `CAMPUS_DANZA` — settimana danza, profilo più tecnico

**Stagione di riferimento analizzata:** 2024/2025 (giugno 2025)
**Settimane eseguite:** 3 (9-13 giu · 16-20 giu · 23-27 giu)
**Totale iscritti:** 136 (dal foglio RIEPILOGO: 39+50+34 estivo + 8+5 danza = 136)
**Incasso totale:** €9.789

---

## 2. STATO DB AL MOMENTO DI QUESTA CHAT

### Cosa esiste già
- Tabella `courses` con colonna `activity_type` → contiene 2 record `activity_type='campus'` (migrati dalla vecchia `campus_activities` durante Phase 31 — aprile 2026, task F1-052/053)
- Tabella `enrollments` = iscrizioni STI unificata per tutti i tipi di attività
- Colore Campus: `#0369a1`

### Cosa NON esiste ancora
- Nessuna tabella dedicata per le settimane campus
- Nessuna estensione iscrizioni con i dati specifici campus (età, scuola, delega ritiro, ecc.)
- Nessuna tabella presenze giornaliere per i bambini
- Nessuna pagina frontend `/campus`

### Vecchie tabelle — state droppate
- `campus_activities` → droppata in Phase 31 (aprile 2026)
- `ca_enrollments` → droppata insieme agli altri silos legacy

---

## 3. ANALISI FILE EXCEL campus_2425_CAMPUS.xlsx

### Fogli presenti
| Foglio | Contenuto |
|--------|-----------|
| RIEPILOGO CAMPUS | Totali per settimana: iscritti, quota, totale, periodo |
| CAMPUS_ESTIVO | Lista iscritti settimana estiva (3 settimane) |
| CAMPUS_DANZA | Lista iscritti settimana danza (2 settimane) |
| PRESENZE CLASSI DIVISE PER COLO | Presenze sett. 1 (9-13 giu) con entrata+uscita bool |
| PRESENZE CLASSI DIVISE PER COL | Presenze sett. 2 (16-20 giu) |
| Foglio8 | Presenze sett. 3 (23-27 giu) |
| ResocontoCampus | Bonus team vendita per operatore e codice promo |
| elenchi | Vocabolari: come ci ha conosciuto, tipo richiesta, chi scrive, codici promo |

### Campi per ogni iscrizione (da Excel)
```
CHI SCRIVE          → operatore segreteria (Alexandra, Joel, Giuditta, ecc.)
VENDITA E PAGAMENTO → ONLINE / SEDE [nome operatore]
DATA PAGAMENTO
COGNOME / NOME
TELEFONO
ETA'
CLASSE
SCUOLA
QUOTA TESS.         → quota tessera pagata (0 se già tesserato)
SCADENZA TESSERA
QUOTA CAMPUS        → importo pagato per il campus
CODICE SCONTO       → es. GIUDITTA05CAMPUS
CERTIFICATO         → bool (certificato medico presente)
MODULO              → bool (modulo firmato presente)
PARCO               → bool (autorizzazione parco)
EMAIL
DELEGA x RITIRO     → testo libero (nome delegato al ritiro)
CONTATTO/I RITIRANTE/I → telefono/i dei ritiranti
NOTE
```

### Campi presenze giornaliere (da Excel)
```
Per ogni giorno (lun-ven):
  ENTRATA → bool
  USCITA  → bool
RITIRO (delega) → testo libero
NOTE
```

### Quote storiche rilevate
**Campus Estivo:**
- Early bird (fino 30/04): 1 sett €70 · 2 sett €130 · 3 sett €195
- Late (dal 01/05): 1 sett €100 · 2 sett €160 · 3 sett €210

**Campus Danza:**
- Early bird: 1 sett €85 · 2 sett €155
- Late: 1 sett €120 · 2 sett €180

### Codici promo utilizzati
```
ALEXANDRA05CAMPUS · ESTEFANY05CAMPUS · GIUDITTA05CAMPUS
JOEL05CAMPUS · NURA05CAMPUS · SARA05CAMPUS
SANTO05CAMPUS · MASSI05CAMPUS · STAFF05CAMPUS
```

---

## 4. ARCHITETTURA DB PROPOSTA

### 3 nuove tabelle da creare

#### `campus_weeks`
Rappresenta ogni settimana campus configurata (una riga = una settimana di un tipo di campus).

```sql
id              INT PK AUTO_INCREMENT
course_id       INT FK → courses.id
season_id       INT FK → seasons.id
week_number     TINYINT          -- 1, 2, 3 ...
campus_type     VARCHAR(50)      -- 'estivo' | 'danza'
start_date      DATE
end_date        DATE
max_capacity    INT
price_early     DECIMAL(10,2)    -- quota early bird
price_late      DECIMAL(10,2)    -- quota late
early_deadline  DATE             -- data limite early bird
notes           TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### `campus_enrollments_ext`
Estensione dell'enrollment standard con tutti i dati specifici campus (1:1 con enrollments).

```sql
id                    INT PK AUTO_INCREMENT
enrollment_id         INT FK → enrollments.id  UNIQUE
week_id               INT FK → campus_weeks.id
eta                   TINYINT
classe                VARCHAR(20)
scuola                VARCHAR(100)
quota_tessera         DECIMAL(10,2)   DEFAULT 0
quota_campus          DECIMAL(10,2)
codice_sconto         VARCHAR(50)
certificato           BOOLEAN         DEFAULT FALSE
modulo_firmato        BOOLEAN         DEFAULT FALSE
autorizzazione_parco  BOOLEAN         DEFAULT FALSE
delega_ritiro         TEXT
contatti_ritiranti    TEXT            -- può contenere più numeri
sold_by               VARCHAR(100)    -- nome operatore
canale_vendita        VARCHAR(50)     -- 'online' | 'sede'
note                  TEXT
created_at            TIMESTAMP
updated_at            TIMESTAMP
```

#### `campus_attendances`
Presenze giornaliere per ogni bambino iscritto.

```sql
id              INT PK AUTO_INCREMENT
enrollment_id   INT FK → enrollments.id
attendance_date DATE
entrata         BOOLEAN   DEFAULT FALSE
uscita          BOOLEAN   DEFAULT FALSE
note            TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
UNIQUE KEY (enrollment_id, attendance_date)
```

---

## 5. PIANO MODULARE DI SVILUPPO

### Fase 1 — Audit + Design (F1-001 → F1-003)
- F1-001: Audit DB — SHOW COLUMNS courses, SELECT campus esistenti, struttura enrollments, tabelle legacy residue, tabella attendances esistente, seasons
- F1-002: Design finale tabelle + migration script (dopo risultati audit)
- F1-003: Creazione tabelle + backup pre-migrazione

### Fase 2 — Backend API (F1-004 → F1-008)
- CRUD campus_weeks (lista settimane, crea, modifica, elimina)
- CRUD iscrizioni campus (con ext)
- CRUD presenze giornaliere
- API riepilogo per settimana (count iscritti, totale incassato)
- API lista presenze del giorno (per uso in sede la mattina)

### Fase 3 — Frontend (F2-001 → F2-008)
Pagina `/campus` con 4 tab:
- **Tab 1 — Settimane**: lista settimane configurate, badge tipo/stato, crea nuova settimana
- **Tab 2 — Iscrizioni**: per settimana selezionata, lista bambini, filtri età/classe/scuola, checklist documenti (certificato/modulo/parco)
- **Tab 3 — Presenze**: griglia giornaliera lun-ven, check entrata/uscita, note ritiro
- **Tab 4 — Riepilogo**: contatori (iscritti, incasso, documenti mancanti), breakdown per operatore

### Fase 4 — Import storico (opzionale, bassa priorità)
Import dati 24/25 dall'Excel campuses_2425_CAMPUS.xlsx dopo che il modulo è operativo.

---

## 6. PROTOCOLLO F1-001 — PRONTO MA NON ESEGUITO

Prompt da inviare ad **AG-F1 (BACKEND)**:

```
PER AG-F1 (BACKEND)

▶ F1-PROTOCOLLO-001 — AUDIT CAMPUS DB
Modalità: SOLO SELECT/SHOW — ZERO modifiche al DB

Sei AG-BACKEND nel progetto StarGem Suite.
Campus = settimane intensive per bambini, activity_type='campus' in courses (STI).

PRIMA AZIONE OBBLIGATORIA: leggi
- _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md
- _GAE_SVILUPPO/_CLAUDE/03_recap_chat/RECAP_11_Campus.md
Poi esegui queste query in sequenza e riporta i risultati completi:

1. STRUTTURA tabella courses (colonne rilevanti per campus):
   SHOW COLUMNS FROM courses;

2. RECORD CAMPUS esistenti:
   SELECT id, name, activity_type, season_id, start_date, end_date, status, created_at
   FROM courses
   WHERE activity_type = 'campus';

3. STRUTTURA tabella enrollments:
   SHOW COLUMNS FROM enrollments;

4. ISCRIZIONI campus se esistono:
   SELECT e.*
   FROM enrollments e
   JOIN courses c ON e.course_id = c.id
   WHERE c.activity_type = 'campus';

5. TABELLE campus legacy residue (verifica che siano sparite):
   SHOW TABLES LIKE '%campus%';

6. TABELLA attendances (verifica esistenza e struttura):
   SHOW TABLES LIKE '%attendance%';
   -- Se esiste: SHOW COLUMNS FROM attendances;

7. SEASONS attive:
   SELECT id, name, start_date, end_date, is_active
   FROM seasons
   ORDER BY id DESC LIMIT 5;

Stop. Riporta tutti i risultati prima di procedere.
```

---

## 7. DECISIONI ARCHITETTURALI PRESE

| Decisione | Scelta | Motivazione |
|-----------|--------|-------------|
| Dove vivono i campus | `courses` STI con `activity_type='campus'` | Già migrato, coerente con tutto il resto |
| Iscrizioni | Estendere `enrollments` con tabella `campus_enrollments_ext` | Non rompe il modello STI, aggiunge solo i campi extra campus |
| Presenze | Tabella dedicata `campus_attendances` | Struttura giornaliera, non compatibile con `enrollments` base |
| Import storico | Bassa priorità, dopo operatività modulo | Solo 136 record, non bloccante |
| Quote | Gestite nel form iscrizione (non in `pricing_rules`) | Le quote campus sono semplici e stagionali |

---

## 8. CAMPI OPERATIVI DA RICORDARE

- **Colore Campus:** `#0369a1`
- **Route frontend prevista:** `/campus`
- **2 tipi campus:** `estivo` · `danza`
- **Struttura settimana:** sempre lun-ven (5 giorni)
- **Documenti obbligatori per ogni bambino:** certificato medico + modulo firmato + (opzionale) autorizzazione parco
- **Delega al ritiro:** campo critico per tutela minori — testo libero con nomi e contatti
- **Codici promo per operatore:** formato `[NOME]05CAMPUS` (es. JOEL05CAMPUS)

---

## 9. CHAT CORRELATE

| Chat | Relazione |
|------|-----------|
| **Chat_08_Corsi** | STI condiviso — stessa tabella `courses` |
| **Chat_09_Workshop** | STI condiviso — struttura iscrizioni analoga |
| **Chat_GemPass** | Tessere — campus richiede tessera valida |
| **Chat_06_Contabilità** | Quote campus confluiscono in `payments` |
| **Chat_12_Gemdario** | Settimane campus visibili nel calendario/planning |

---

## 10. TEMPLATE FINE SESSIONE (da aggiornare dopo protocolli)

```
Stato: 🔴 Da iniziare
Ultimo protocollo: — / —
Tabelle DB toccate: nessuna
Pendenti: F1-001 audit da eseguire → poi F1-002 design tabelle
```

---

*RECAP_11_Campus.md — StarGem Suite*
*Generato: 05/05/2026 — Prima sessione operativa*
*Nessun protocollo eseguito — F1-001 pronto per AG-Backend*
