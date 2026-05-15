# 📋 RECAP_09_Workshop — StarGem Suite
> Chat: 09_Workshop
> Stato: 🔴 Da iniziare (audit F1-001 non ancora eseguito)
> Ultima sessione: 05/05/2026
> Da leggere insieme a: MASTER_STATUS.md · ANALISI_MASTER.md

---

## 1. OBIETTIVO DI QUESTA CHAT

Costruire in StarGem il modulo **Workshop completo**, che oggi manca quasi totalmente.
Il gestionale ha solo `courses` (activity_type='workshop') e `enrollments` generici.
Manca tutto il resto: business plan, canale vendita, operatrice, presenze, iscritti non tesserati, P&L.

---

## 2. FILE EXCEL ANALIZZATI

### FILE 1 — `workshop_2526_ISCRITTI_WORKSHOP.xlsx`
**27 fogli totali:**
- 1 foglio per WS con lista iscritti
- `ResocontoWS` — aggregato stagionale per operatrice
- `RIEPILOGO ISCRITTI WS` — struttura intestazioni (dati vuoti nel file)
- Fogli test/elenchi (test_WS_QUOTE, elenchi, elenchi2, elenchi3, ordini_WS)

**Struttura colonne per ogni foglio WS:**

| Campo | Valori esempio | Note |
|---|---|---|
| CHI SCRIVE | Joel / Nura / Estefany / Alexandra / Giuditta / Sara / Massi / Santo | Operatrice che ha gestito |
| VENDITA | ONLINE / SEDE Nura / SEDE Alexandra / BONIFICO / EMAIL | Canale vendita |
| DATA INSERIMENTO/RICHIESTA | 2025-12-15 | Data inserimento nel gestionale |
| ID ANAGRAFICA | ID-000963 / **NaN** | ~70% senza ID = non tesserati |
| COGNOME / NOME | testo | |
| TELEFONO | numero | |
| CODICE FISCALE | stringa | sempre presente (obbligo SSDRL) |
| EMAIL | stringa | |
| DATA PAGAMENTO/RICEVUTA | data | |
| QUOTA | 45 | prezzo base |
| CODICE SCONTO | NURA02WS / JOEL02WS / ALEXANDRA02WS / ESTEFANY02WS / GIUDITTA02WS / SARA02WS / NaN | Codice promo applicato |
| IMPORTO FINALE | 43 (con sconto) / 45 (pieno) | |
| DIGIT/CASH - TESS/NON TESS | "DIGIT - TESSERATO" / "DIGIT - NON TESSERATO" / "CASH - TESSERATO" / "CASH - NON TESSERATO" | 4 combinazioni reali |
| PRESENZA | True / False | |
| NOTE | testo libero | "ha pagato la mamma", "si è spostato", "su ok gae (b/b)" |
| INSERITO SU ATHENA | "INSERITO" / NaN | flag gestionale vecchio |
| RICEVUTA FATTA | bool | tracciamento admin |
| FATTURA FATTA | bool | tracciamento admin |
| VERIFICA PAGAMENTO | bool | |

**WS con più dati analizzati:** `WS_EMANUELLO` (22-feb-2026)
- 91 iscritti totali (slot 1: 64 + slot 2: 27)
- 6 in sede / 85 online
- 15 tesserati / 64 non tesserati (70% senza tessera)
- Entrate reali: €3.784

**ResocontoWS — 16 WS stagione 25/26:**

| Data | WS | Totale iscritti |
|---|---|---|
| 19-ott-25 | WS_BANANA | 19 |
| 26-ott-25 | WS_TIMOR | 18 |
| 26-ott-25 | WS_LULU | 12 |
| 09-nov-25 | WS_KUMO | 11 |
| 09-nov-25 | WS_LELI | 5 |
| 16-nov-25 | WS_DEBORAHESPOSITO | 21 |
| 16-nov-25 | WS_DEANGELIS | 10 |
| 14-dic-25 | WS_NEREA | 8 |
| 14-dic-25 | WS_FESTA NATALE | 105 |
| 14-dic-25 | SOLO SERATA_FESTA NATALE | 154 |
| 01-feb-26 | WS_ALESSIOCAVALIERE | 6 |
| 22-feb-26 | WS_EMANUELLO | 43 |
| 01-mar-26 | OC_ANAHITA | 24 |
| 15-mar-26 | WS_DIA_EN_CUBA | 26 |
| 15-mar-26 | OC_AMBERALDRIN | 10 |
| 19-apr-26 | WS_JASMINE_ANDRIANO | 3 |

---

### FILE 2 — `workshop_2526_BUSINESS_PLAN_WORKSHOP.xlsx`
**20 fogli totali:**
- 1 foglio per WS con struttura P&L completa
- `RIEPILOGO BP WS` — stagione 25/26 aggregata
- `elenchi` — dati di supporto

**Struttura P&L per ogni WS:**

**USCITE ARTISTA:**
- Fee artista (es. -€550 per Claudia Laruccia)
- Spese di viaggio
- Taxi da/per aeroporto
- Hotel
- Pranzi / Cene
- Merch Adidas (es. -€18 t-shirt)
- Merch Freddy (quando applicabile)
- TOTALE USCITE ARTISTA (calcolato)

**USCITE EXTRA:**
- Affitto spazio (quando non usato studio proprio)
- Personale (es. -€100)
- Video maker (es. -€200)
- Volantini (es. -€10)
- Manifesti
- Fish singolo per vendita (es. -€20)
- Bonus team per vendita (es. -€20)
- Pranzo per team
- Sponsorizzate social (es. -€200)
- Resi
- Commissioni online 1.5% (calcolate su media iscritti × prezzo medio)
- TOTALE USCITE EXTRA (calcolato)

**TOTALE USCITE** = Artista + Extra

**STIMA CONTRIBUTI/INCASSI:**
- Prezzo early bird / prezzo standard / prezzo day-of
- Stima MIN partecipanti × prezzo min → ricavo stimato min
- Stima MAX partecipanti × prezzo max → ricavo stimato max
- Stima MEDIA → ricavo atteso

**ENTRATE REALI:**
- Breakdown SEDE (prezzo A) vs ONLINE (prezzo B per fascia)
- Subtotale sede / subtotale online
- TOTALE ENTRATE

**RISULTATO:** ENTRATE - USCITE = PERDITA/RICAVO

**RIEPILOGO stagionale 25/26 — 13 WS completati + futuri in programma:**

| Artista | Data | Genere | Entrate | Uscite | Risultato |
|---|---|---|---|---|---|
| BANANA | 19-ott-25 | Afrofusion | €2.607 | -€1.595 | **+€1.011** |
| TIMOR STEFFENS | 26-ott-25 | Commercial | €2.925 | -€2.650 | **+€274** |
| LULU KULOVA | 26-ott-25 | Heels Fusion | €1.659 | -€1.151 | **+€867** |
| KUMO | 09-nov-25 | Urban | €2.223 | -€1.611 | **+€611** |
| LELI | 09-nov-25 | Indian Fusion | €272 | -€238 | **+€33** |
| NICOLO DE ANGELIS | 16-nov-25 | Salsa Musicality | €1.112 | -€720 | **+€391** |
| DEBORAH ESPOSITO | 23-nov-25 | Heels | €2.089 | -€1.128 | **+€961** |
| NEREA | 14-dic-25 | Salsa Flamenco | €427 | -€465 | **-€38** ⚠️ |
| ALESSIO CAVALIERE | 01-feb-26 | Urban | €849 | -€1.107 | **-€258** ⚠️ |
| EMANUEL LO | 22-feb-26 | HipHop | €3.784 | -€3.323 | **+€460** |
| ANAHITA | 01-mar-26 | Heels | €896 | -€289 | **+€606** |
| DIA EN CUBA | 15-mar-26 | Salsa Cubana | €1.700 | -€858 | **+€841** |
| AMBER & ALDRIN | 15-mar-26 | Urban Coreografico | €526 | -€350 | **+€175** |
| **TOTALE** | | | **€21.069** | **-€15.492** | **+€5.937** |

---

## 3. ANALISI GAP — COSA MANCA IN STARGEM

### Cosa esiste già
- `courses` con `activity_type='workshop'` — anagrafica base (titolo, prezzo, data, max_students, instructor_id)
- `enrollments` — iscrizioni generiche
- `payments` — pagamenti collegati
- `promo_rules` — codici NURA02WS, JOEL02WS ecc. già in DB da Quote & Promo

### Cosa NON esiste (gap completo)
1. ❌ Nessuna tabella Business Plan / P&L per WS
2. ❌ Nessun campo `sale_channel` / `operator_name` negli enrollments
3. ❌ Nessuna gestione iscritti guest (non tesserati senza member_id)
4. ❌ Nessun campo `presenza`, `ricevuta_fatta`, `fattura_fatta`, `verifica_pagamento`
5. ❌ Nessun breakdown entrate sede vs online
6. ❌ Nessun riepilogo economico stagionale WS

---

## 4. ARCHITETTURA PROPOSTA

### Nuova tabella: `workshop_budget`
Una riga per WS (FK su `courses.id`):

```sql
-- IDENTIFICATIVO
course_id           INT FK → courses.id  UNIQUE

-- USCITE ARTISTA
fee_artista         DECIMAL(10,2) DEFAULT 0
spese_viaggio       DECIMAL(10,2) DEFAULT 0
taxi_arrivo         DECIMAL(10,2) DEFAULT 0
taxi_partenza       DECIMAL(10,2) DEFAULT 0
hotel               DECIMAL(10,2) DEFAULT 0
pranzi              DECIMAL(10,2) DEFAULT 0
cene                DECIMAL(10,2) DEFAULT 0
merch_adidas        DECIMAL(10,2) DEFAULT 0
merch_freddy        DECIMAL(10,2) DEFAULT 0
merch_altro         DECIMAL(10,2) DEFAULT 0
totale_uscite_artista DECIMAL(10,2) GENERATED  -- calcolato

-- USCITE EXTRA
affitto_spazio      DECIMAL(10,2) DEFAULT 0
personale           DECIMAL(10,2) DEFAULT 0
video_maker         DECIMAL(10,2) DEFAULT 0
volantini           DECIMAL(10,2) DEFAULT 0
manifesti           DECIMAL(10,2) DEFAULT 0
fish_singolo        DECIMAL(10,2) DEFAULT 0
bonus_team          DECIMAL(10,2) DEFAULT 0
pranzo_team         DECIMAL(10,2) DEFAULT 0
sponsorizzate       DECIMAL(10,2) DEFAULT 0
resi                DECIMAL(10,2) DEFAULT 0
commissioni_online  DECIMAL(10,2) DEFAULT 0
totale_uscite_extra DECIMAL(10,2) GENERATED  -- calcolato

-- STIMA
stima_min_persone   INT DEFAULT 0
stima_max_persone   INT DEFAULT 0
stima_prezzo_min    DECIMAL(10,2) DEFAULT 0
stima_prezzo_max    DECIMAL(10,2) DEFAULT 0
stima_prezzo_medio  DECIMAL(10,2) DEFAULT 0

-- RISULTATO REALE
entrate_sede        DECIMAL(10,2) DEFAULT 0
entrate_online      DECIMAL(10,2) DEFAULT 0
entrate_totali      DECIMAL(10,2) GENERATED  -- calcolato
uscite_totali       DECIMAL(10,2) GENERATED  -- calcolato
perdita_ricavo      DECIMAL(10,2) GENERATED  -- calcolato

-- META
metodo_pagamento_artista VARCHAR(100)
note                TEXT
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP ON UPDATE NOW()
```

### ALTER `enrollments` — colonne WS-specifiche da aggiungere
```sql
ALTER TABLE enrollments
  ADD COLUMN sale_channel       VARCHAR(50)   NULL,  -- 'online'/'sede'/'bonifico'/'email'
  ADD COLUMN operator_name      VARCHAR(100)  NULL,  -- nome operatrice
  ADD COLUMN presenza           BOOLEAN       DEFAULT FALSE,
  ADD COLUMN ricevuta_fatta     BOOLEAN       DEFAULT FALSE,
  ADD COLUMN fattura_fatta      BOOLEAN       DEFAULT FALSE,
  ADD COLUMN verifica_pagamento BOOLEAN       DEFAULT FALSE,
  ADD COLUMN import_note        TEXT          NULL,
  -- campi guest (iscritti senza tessera)
  ADD COLUMN guest_first_name   VARCHAR(100)  NULL,
  ADD COLUMN guest_last_name    VARCHAR(100)  NULL,
  ADD COLUMN guest_cf           VARCHAR(20)   NULL,
  ADD COLUMN guest_email        VARCHAR(255)  NULL,
  ADD COLUMN guest_phone        VARCHAR(50)   NULL;
```

---

## 5. GESTIONE ISCRITTI NON TESSERATI — DECISIONE ARCHITETTURALE

**Regola business SSDRL confermata dai file:** i WS si vendono senza tessera obbligatoria.
Nei file reali: ~70% degli iscritti sono NON TESSERATI (64 su 91 al WS_EMANUELLO).

**Soluzione adottata:**
- `member_id` negli enrollments rimane **nullable** (da verificare con audit F1-001)
- Quando `member_id` è NULL → si popolano i campi `guest_*`
- Il CF viene sempre registrato (obbligo SSDRL)
- Nessun account utente creato per i guest
- Nessuna tessera emessa
- Solo ricevuta/fattura se richiesta

**Phase 2 futura (non in scope ora):** usare il CF guest per proporre tessera via Clarissa CRM.

---

## 6. PIANO PROTOCOLLI

| # | Chi | Cosa | Dipendenze |
|---|---|---|---|
| F1-001 | AG-Backend | AUDIT — solo SELECT, verifica struttura attuale | nessuna |
| F2-001 | AG-Frontend | Audit route `/workshop` o `/attivita/workshop` esistente | nessuna |
| F1-002 | AG-Backend | ALTER enrollments (12 colonne) + CREATE workshop_budget | dopo F1-001 |
| F2-002 | AG-Frontend | Scheda WS: Tab Iscritti con canale/operatrice/presenza/stato admin | dopo F1-002 |
| F1-003 | AG-Backend | API routes: GET/POST workshop_budget, GET iscritti WS arricchiti | dopo F1-002 |
| F2-003 | AG-Frontend | Tab Business Plan (form P&L) + Tab Riepilogo stagionale | dopo F1-003 |

F1-001 e F2-001 partono **in parallelo** senza aspettarsi.

---

## 7. PROMPT F1-001 — PRONTO DA INVIARE

```
PER AG-F1 (BACKEND)

# F1-PROTOCOLLO-001 — AUDIT WORKSHOP
# Chat: Chat_09_Workshop
# Solo SELECT — nessuna modifica al DB

PRIMA AZIONE OBBLIGATORIA: leggi
- _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md
- _GAE_SVILUPPO/_CLAUDE/03_recap_chat/RECAP_09_Workshop.md

## 1. Workshop esistenti nel DB
SELECT id, title, activity_type, price, max_students,
       start_date, instructor_id, studio_id, status
FROM courses
WHERE activity_type = 'workshop'
ORDER BY start_date DESC LIMIT 10;

## 2. Conteggio WS e iscrizioni totali
SELECT 
  COUNT(DISTINCT c.id) AS totale_ws,
  COUNT(e.id) AS totale_iscrizioni
FROM courses c
LEFT JOIN enrollments e ON e.course_id = c.id
WHERE c.activity_type = 'workshop';

## 3. Struttura completa enrollments
DESCRIBE enrollments;

## 4. Sample enrollment WS con dati member (LEFT JOIN per vedere anche i NULL)
SELECT e.*, m.firstName, m.lastName, m.email
FROM enrollments e
JOIN courses c ON e.course_id = c.id
LEFT JOIN members m ON e.member_id = m.id
WHERE c.activity_type = 'workshop'
LIMIT 5;

## 5. member_id è nullable in enrollments?
SELECT IS_NULLABLE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'stargem_v2'
  AND TABLE_NAME = 'enrollments'
  AND COLUMN_NAME = 'member_id';

## 6. Esiste già tabella P&L / budget WS?
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'stargem_v2'
AND (table_name LIKE '%workshop%'
  OR table_name LIKE '%business%'
  OR table_name LIKE '%budget%'
  OR table_name LIKE '%pnl%'
  OR table_name LIKE '%costo%');

## 7. Campi canale vendita / operatrice già presenti in enrollments?
SELECT COLUMN_NAME FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'stargem_v2'
  AND TABLE_NAME = 'enrollments'
  AND COLUMN_NAME IN (
    'sale_channel','channel','source','operator_id',
    'operator_name','payment_source','presenza','presence',
    'ricevuta_fatta','fattura_fatta','verifica_pagamento'
  );

## 8. Enrollments con member_id NULL oggi
SELECT COUNT(*) AS enrollments_senza_member
FROM enrollments
WHERE member_id IS NULL;

## 9. Campi guest già presenti in enrollments?
SELECT COLUMN_NAME FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'stargem_v2'
  AND TABLE_NAME = 'enrollments'
  AND COLUMN_NAME IN (
    'guest_first_name','guest_last_name','guest_cf',
    'guest_email','guest_phone'
  );

▶ F1-PROTOCOLLO-001 IN ESECUZIONE
Attendo tutti i risultati prima di procedere.
Nessuna modifica al DB in questo protocollo.
Prossimo atteso: F1-PROTOCOLLO-002
```

---

## 8. STATO MASTER_STATUS — DA AGGIORNARE

```
## 09_Workshop — aggiornato 05/05/2026
Stato: 🔴 Da iniziare
Ultimo protocollo: F1-000 / F2-000 (audit non ancora eseguito)
Tabelle DB toccate: nessuna
Pendenti:
  - Inviare F1-001 ad Antigravity (prompt pronto in questo RECAP sezione 7)
  - Inviare F2-001 ad Antigravity (audit frontend route /workshop)
  - Dopo audit: decidere ALTER enrollments + CREATE workshop_budget (F1-002)
  - Architettura proposta: vedere sezione 4 di questo RECAP
  - Decisione iscritti non tesserati: vedere sezione 5 di questo RECAP
```

---

## 9. DATI CHIAVE DA RICORDARE

```
Stagione 25/26 WS:
  - 13 WS completati, 3+ in programma
  - Entrate totali: €21.069
  - Uscite totali: €15.492
  - Ricavo netto: €5.937
  - 2 WS in perdita: Nerea (-€38) e Alessio Cavaliere (-€258)

WS più grande: Festa Natale (105 iscritti WS + 154 solo serata)
WS più redditizio: BANANA (+€1.011 su €2.607 entrate)

Colore WS in StarGem: #c2410c (arancione bruciato)
activity_type DB: 'workshop'

Operatrici WS stagione 25/26:
  Alexandra / Estefany / Giuditta / Nura / Joel / Sara / Massi / 
  Staff / Staff2 / Anahita / Andrea / Cinzia / Fergie / Carlos / Santo

Codici promo WS operatrici (già in DB da Quote&Promo):
  NURA02WS / JOEL02WS / ALEXANDRA02WS / ESTEFANY02WS / 
  GIUDITTA02WS / SARA02WS
```

---

*RECAP_09_Workshop · generato 05/05/2026 · Chat_09_Workshop*
*Prossima azione: inviare F1-001 + F2-001 ad Antigravity*
