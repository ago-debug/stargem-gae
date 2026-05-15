# RECAP_15_Saggi — Chat Saggi
> StarGem Suite · Chat numero: 15
> Data sessione: 05/05/2026
> Stato: 🔴 Da iniziare — nessun protocollo eseguito
> Redatto da: Claude (Chat Analisi / Chat 15_Saggi)

---

## 1. IDENTITÀ DELLA CHAT

| Campo | Valore |
|-------|--------|
| Numero chat | 15 |
| Nome | Saggi |
| AG-Backend | F1 — da F1-001 |
| AG-Frontend | F2 — da F2-001 |
| Stato | 🔴 Da iniziare |
| Ultimo protocollo eseguito | nessuno |
| Tabelle DB toccate | nessuna |
| Backup richiesto | non ancora eseguito |

---

## 2. CONTESTO BUSINESS

I Saggi sono spettacoli teatrali di fine stagione in cui i corsi di danza della scuola si esibiscono davanti al pubblico.

**Caratteristiche operative:**
- Si svolgono in teatro esterno (non in sede)
- Vendita biglietti al pubblico con posti assegnati
- Ogni saggio può avere più repliche (es. sabato + domenica)
- I corsisti di più corsi partecipano come cast
- Incasso botteghino da tracciare
- Comunicazioni di convocazione agli insegnanti e agli allievi
- Lista partecipanti per corso/numero stampabile per gli insegnanti

**Colore STI assegnato:** `#be185d` (rosa scuro)
**Badge:** `SAG`

---

## 3. STATO TECNICO ATTUALE NEL DB

I Saggi **esistono già come tipo STI** nella tabella `courses`:

```sql
activity_type = 'saggi'
```

La tabella `courses` è la super-tabella STI condivisa da tutti i tipi di attività
(corsi, workshop, allenamenti, saggi, vacanze, campus, domeniche, ecc.).

**Non esistono ancora** tabelle dedicate per:
- Teatro / venue
- Settori / mappa posti
- Biglietti
- Cast / partecipanti al saggio

La pagina `/saggi` è già scaffaldata nel frontend da lavori STI precedenti,
ma è priva di contenuto specifico.

---

## 4. ANALISI ARCHITETTURALE — PIANO MODULO

Il modulo è stato scomposto in **4 macro-domini**:

### Dominio 1 — Teatro & Settori (DB + API)
Gestione della venue e della mappa dei posti.
- Un saggio si svolge in un teatro
- Il teatro ha settori (platea A, platea B, galleria, palco...)
- Ogni settore ha N posti con prezzo configurabile per settore

### Dominio 2 — Biglietteria (DB + API + UI)
Vendita dei biglietti al pubblico.
- Un biglietto lega: `member` + `evento_saggio` (corso STI) + `seat`
- Integrazione con `payments` per tracciare l'incasso
- Stati biglietto: disponibile / prenotato / venduto / omaggio / annullato
- Botteghino in sede e canale online (futuro)

### Dominio 3 — Lista Partecipanti / Cast (DB + API + UI)
Gestione dei corsisti che si esibiscono.
- Ogni corso di danza può partecipare a uno o più saggi
- Ogni corsista del corso diventa partecipante a un numero/pezzo
- Lista stampabile per insegnante con nomi, costume, ordine di entrata

### Dominio 4 — Comunicazioni & Report (UI + API)
- Email/SMS di convocazione al cast
- Lista definitiva con posto assegnato (per il pubblico)
- Report incassi per Elisa (contabilità)

---

## 5. ARCHITETTURA DB PROPOSTA — 6 TABELLE

```
saggi_venues
  id, name, address, city, total_capacity, notes

saggi_sectors
  id, venue_id (FK), name, label, capacity, price_default, color_hex

saggi_seats
  id, sector_id (FK), row_label, seat_number, price_override, is_active

saggi_tickets
  id, course_id (FK → courses, activity_type='saggi'),
  member_id (FK → members),
  seat_id (FK → saggi_seats),
  payment_id (FK → payments, nullable),
  status ENUM(disponibile/prenotato/venduto/omaggio/annullato),
  sold_at, notes

saggi_cast_lists
  id, course_saggio_id (FK → courses, il saggio),
  course_id (FK → courses, il corso partecipante),
  piece_title, piece_order, instructor_notes

saggi_cast_members
  id, cast_list_id (FK → saggi_cast_lists),
  member_id (FK → members),
  role_in_piece, costume_note, confirmed
```

**Opzionale (se saggi con repliche multiple):**
```
saggi_shows
  id, course_id (FK → courses), show_date, show_time, notes
  (e i ticket si legano a saggi_shows invece che direttamente al corso)
```

---

## 6. PROMPT F1-001 — PRONTO DA INVIARE

Il seguente prompt è stato preparato ma **non ancora inviato** ad Antigravity.
Va copiato e incollato in **AG-BACKEND** per avviare il modulo.

---

```
PER AG-F1 (BACKEND)

Sei AG-BACKEND del progetto StarGem Suite.
Stack: Node.js / MariaDB 11.4 / Drizzle ORM
DB: stargem_v2 — accesso via SSH tunnel porta 3307
Protocollo: F1-PROTOCOLLO-001 — Chat 15_Saggi
Regola: STOP & GO — solo SELECT e SHOW, ZERO modifiche.

PRIMA AZIONE OBBLIGATORIA: leggi
- _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md
- (RECAP_15_Saggi.md se disponibile in _GAE_SVILUPPO/_CLAUDE/03_recap_chat/)
Poi esegui l'audit.

MISSIONE: Audit completo stato attuale tabelle e dati Saggi.
Esegui in sequenza queste query e riportami TUTTI i risultati:

-- 1. Quanti e quali saggi esistono in courses
SELECT id, name, activity_type, status, start_date, end_date, notes
FROM courses
WHERE activity_type = 'saggi'
ORDER BY id DESC;

-- 2. Struttura completa tabella courses
SHOW COLUMNS FROM courses;

-- 3. Enrollments per i saggi
SELECT e.id, e.course_id, e.member_id, c.name AS saggio_name
FROM enrollments e
JOIN courses c ON e.course_id = c.id
WHERE c.activity_type = 'saggi'
ORDER BY e.course_id;

-- 4. Tabelle già esistenti legate a teatro/biglietti/saggi
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'stargem_v2'
  AND (table_name LIKE '%saggi%'
    OR table_name LIKE '%teatro%'
    OR table_name LIKE '%bigliett%'
    OR table_name LIKE '%ticket%'
    OR table_name LIKE '%seat%'
    OR table_name LIKE '%venue%')
ORDER BY table_name;

-- 5. Lista completa tabelle DB con conteggio righe
SELECT table_name, table_rows
FROM information_schema.tables
WHERE table_schema = 'stargem_v2'
ORDER BY table_name;

Riportami il risultato di ogni query con il suo numero.
NON eseguire nessuna modifica. Solo lettura.
Report finale: STOP — attendo istruzioni PM prima di procedere.
```

---

## 7. SEQUENZA PROTOCOLLI PREVISTA

| Protocollo | Finestra | Descrizione |
|-----------|---------|-------------|
| F1-001 | Backend | Audit DB (query di sola lettura) |
| F1-002 | Backend | Creazione 6 tabelle saggi_* + schema Drizzle |
| F2-001 | Frontend | Scaffold pagina /saggi con tab placeholder |
| F1-003 | Backend | Route API CRUD venues + sectors + seats |
| F2-002 | Frontend | UI gestione venue e mappa settori |
| F1-004 | Backend | Route API biglietteria (tickets + integrazione payments) |
| F2-003 | Frontend | UI vendita biglietti e stato disponibilità |
| F1-005 | Backend | Route API cast_lists + cast_members |
| F2-004 | Frontend | UI gestione partecipanti per corso + lista stampabile |
| F1-006 | Backend | Route API report incassi + statistiche |
| F2-005 | Frontend | Dashboard saggio (posti, incasso, cast) |

---

## 8. DIPENDENZE E VINCOLI

- `courses` (STI) — non toccare struttura, solo leggere
- `enrollments` — non toccare, fonte dati per auto-populate cast
- `members` — solo FK, non modificare
- `payments` — MAI DROP, solo ADD COLUMN se necessario
- Backup obbligatorio dopo F1-002 (prima creazione tabelle)

---

## 9. DECISIONI APERTE — DA PRENDERE DOPO F1-001

**D1 — Repliche multiple**
Un saggio può avere più date (es. sabato sera + domenica pomeriggio)?
- Sì → aggiungere `saggi_shows`, i biglietti si legano allo show
- No → i biglietti si legano direttamente al corso STI

**D2 — Vendita online**
I biglietti si vendono solo in botteghino (in sede) o anche online (WooCommerce)?
- Solo botteghino → gestione interna StarGem
- Anche online → integrazione WooCommerce + webhook (fase futura)

**D3 — Posti numerati vs settore generico**
- Posti numerati (fila + numero) → serve mappa completa
- Solo settore generico (platea, galleria) → più semplice, ma meno preciso

---

## 10. TEMPLATE MASTER_STATUS — DA USARE A FINE PRIMA SESSIONE OPERATIVA

```
## 15_Saggi — aggiornato [DATA]
Stato: 🟡 In corso
Ultimo protocollo: F1-001 / F2-000
Tabelle DB toccate: nessuna (solo audit)
Pendenti: risposta F1-001 + decisioni D1/D2/D3 + F1-002 creazione tabelle
```

---

*Fine RECAP_15_Saggi — pronto per importazione in _GAE_SVILUPPO/_CLAUDE/03_recap_chat/*
