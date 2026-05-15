# RECAP_19_GemNight — Chat StarGem Suite
> **Modulo:** GemNight — Serate a tema  
> **Chat numero:** 19  
> **Suite:** StarGem (Geos SSDRL / studio-gem.it)  
> **Stato attuale:** 🔴 Da iniziare — F1-001 mai eseguito  
> **Ultima sessione:** 05/05/2026  
> **Redatto da:** Claude (Chat Analisi → Chat 19_GemNight)

---

## 1. SCOPO DEL MODULO

GemNight gestisce le **serate a tema** organizzate da Studio Gem per portare
gli allievi a ballare in locali/spazi selezionati.

**Non gestisce:**
- Corsi o lezioni → Gemdario / Chat_08_Corsi
- Affitti sale interne → BookGem
- Workshop con artisti ospiti → Chat_09_Workshop

**Gestisce:**
- Anagrafica location (venue esterne)
- Creazione e gestione serate (data, tema, capienza, stato)
- Lista partecipanti con prenotazione e quota serata
- Incassi quote per serata
- Collaboratori: DJ, locali, partner
- Media post-evento (foto/video)
- Comunicazioni pre/post serata

---

## 2. CONTESTO BUSINESS

Dal file mansioni Team (Presentazione Trello / GAE_SVILUPPO):
- **GAE** e **STEFANO** hanno in carico "Serate" come voce esplicita
  nelle mansioni del Team Amministrazione e Direzione.
- Le serate sono un'attività ricorrente già operativa nella scuola,
  attualmente gestita fuori dal gestionale (fogli, WhatsApp, ecc.).

---

## 3. ANALISI DB — STATO AL MOMENTO DELLA SESSIONE

### Nessuna tabella esistente per il dominio GemNight

Dall'analisi dei file di progetto confermata:

| Tabella | Nota |
|---------|------|
| `strategic_events` | Solo planning interno (ferie, chiusure) — NON riutilizzabile |
| `booking_services` | Affitti sale, dominio diverso — NON riutilizzabile |
| `studio_bookings` | Prenotazioni spazi interni — NON riutilizzabile |

**Conclusione:** GemNight è un dominio separato da creare da zero.

### Struttura DB attuale (dal MASTER_STATUS 14/04/2026)
- Totale tabelle: ~85+ fisiche
- Stack: MariaDB 11.4 · stargem_v2 · VPS IONOS · pm2 porta 5001
- Backup più recente: `gemstaff_ASSOLUTO_20260413_1817.sql` — 9.2MB

---

## 4. ARCHITETTURA PROPOSTA — TABELLE (5-6 nuove)

### 4.1 Tabelle principali

| Tabella | Scopo | Priorità |
|---------|-------|----------|
| `night_venues` | Anagrafica location esterne (nome, indirizzo, capienza, contatto) | Alta |
| `night_events` | Serata: data, titolo, tema, venue_id, capienza max, prezzo quota, stato | Alta |
| `night_attendees` | Partecipanti per serata: FK members + night_events, stato pag. | Alta |
| `night_payments` | Incasso quota serata (collegato a payments core) | Alta |
| `night_collaborators` | DJ, locali, partner: nome, tipo, compenso, note contratto | Media |
| `night_media` | Foto/video post-evento: url, tipo, event_id | Bassa |

### 4.2 Campi chiave ipotizzati

**`night_events`:**
```
id · title · event_date · venue_id (FK night_venues)
theme · description · max_capacity · ticket_price
status: 'bozza' | 'confermata' | 'conclusa' | 'annullata'
dj_notes · dress_code · created_by · created_at · updated_at
```

**`night_venues`:**
```
id · name · address · city · capacity
contact_name · contact_phone · contact_email
notes · active · created_at · updated_at
```

**`night_attendees`:**
```
id · event_id (FK night_events) · member_id (FK members)
status: 'prenotato' | 'pagato' | 'check_in' | 'assente'
payment_id (FK payments, nullable) · amount_paid
notes · created_at · updated_at
```

**`night_collaborators`:**
```
id · event_id (FK night_events) · name · type: 'dj' | 'locale' | 'partner'
fee · fee_type: 'fisso' | 'percentuale' | 'omaggio'
contract_notes · paid · created_at · updated_at
```

### 4.3 Integrazioni con moduli esistenti

| Modulo | Come si collega |
|--------|----------------|
| `members` | Lookup partecipanti — nessuna duplicazione anagrafica |
| `payments` | Incasso quote serata registrato nel core pagamenti |
| Gemdario | Feed serate nel calendario come tipo `GNT` (colore da assegnare) |
| GemStaff | Eventuale insegnante/accompagnatore per la serata |

---

## 5. PIANO UI — 5 TAB

| Tab | Contenuto |
|-----|-----------|
| 1. Serate | Lista eventi (passati / futuri / bozze), badge stato, filtri |
| 2. Location | Anagrafica venue con storico serate per venue |
| 3. Partecipanti | Lista per serata, check-in live, quota pagata/da pagare |
| 4. Collaboratori | DJ e partner per serata, compensi, note |
| 5. Media & Report | Foto post-evento, riepilogo incassi serata |

**Route canonica:** `/gemnight`  
**Colore suggerito:** `#6d28d9` (viola scuro — non in uso da nessuna altra attività)

---

## 6. PROTOCOLLI EMESSI

### F1-001 — Audit DB (EMESSO, MAI ESEGUITO)

Stato: 🔴 Il prompt è stato prodotto ma Gaetano non ha ancora
incollato F1-001 in AG-Backend. Zero modifiche al DB.

**Testo del prompt F1-001:**

```
Sei AG-BACKEND nel progetto StarGem Suite (MariaDB 11.4, VPS IONOS).
Leggi MASTER_STATUS.md e ANALISI_MASTER.md prima di procedere.

▶ F1-PROTOCOLLO-001 IN ESECUZIONE — GemNight Audit

Obiettivo: audit DB per verificare se esistono tabelle, colonne o strutture
riutilizzabili per il modulo GemNight (serate a tema, location esterne,
partecipanti, DJ/collaboratori, media post-evento).

REGOLA: solo SELECT, SHOW, DESCRIBE. Zero modifiche.

Esegui in sequenza — riporta output completo di ogni query:

-- 1. Tabelle esistenti che potrebbero riguardare eventi/serate
SHOW TABLES LIKE '%event%';
SHOW TABLES LIKE '%night%';
SHOW TABLES LIKE '%serata%';
SHOW TABLES LIKE '%venue%';
SHOW TABLES LIKE '%booking%';
SHOW TABLES LIKE '%location%';

-- 2. Struttura tabelle potenzialmente vicine al dominio
DESCRIBE strategic_events;
DESCRIBE booking_services;
DESCRIBE studio_bookings;

-- 3. Struttura payments (per capire come agganciare incassi serata)
DESCRIBE payments;
SELECT DISTINCT payment_type FROM payments LIMIT 20;

-- 4. Struttura members (per capire FK partecipanti)
SHOW COLUMNS FROM members LIKE 'id';
SHOW COLUMNS FROM members LIKE 'member_type';

-- 5. Conteggi utili
SELECT COUNT(*) as tot_strategic_events FROM strategic_events;
SELECT COUNT(*) as tot_booking_services FROM booking_services;

-- 6. Verifica colore/tipo in activities (STI)
SELECT DISTINCT activity_type FROM courses LIMIT 20;

Riporta tutti gli output e attendi istruzioni prima di qualsiasi modifica.

✅ Al termine scrivi:
F1-PROTOCOLLO-001 COMPLETATO
Prossimo atteso: F1-PROTOCOLLO-002
```

---

## 7. PROSSIMI PASSI — QUANDO SI RIAPRE QUESTA CHAT

**Sequenza obbligatoria:**

1. Leggere MASTER_STATUS.md + ANALISI_MASTER.md aggiornati
2. Incollare il prompt F1-001 in AG-Backend (testo nella sezione 6)
3. Ricevere risposta AG con output delle query
4. Claude valuta con Gaetano se esistono strutture riutilizzabili
5. Claude emette F1-002 (CREATE TABLE night_venues + night_events)
6. Claude emette F1-003 (CREATE TABLE night_attendees + night_collaborators)
7. Claude emette F2-001 (scaffold frontend `/gemnight` con 5 tab)

**Nessun codice da anticipare** — AG deve esplorare il DB e proporre
la struttura definitiva delle CREATE dopo l'audit.

---

## 8. DECISIONI ARCHITETTURALI APERTE

| # | Decisione | Opzioni | Stato |
|---|-----------|---------|-------|
| D1 | `night_payments` separata o usare `payments` core con tipo dedicato? | A) tabella nuova · B) ADD COLUMN payment_type='GNT' su payments | ⏳ Da decidere dopo F1-001 |
| D2 | Feed Gemdario: activity_type='GNT' in tabella STI `courses` o evento separato? | A) STI · B) join da night_events | ⏳ Da decidere dopo F1-001 |
| D3 | Colore UI definitivo GemNight | `#6d28d9` proposto | ⏳ Conferma Gaetano |

---

## 9. TEMPLATE MASTER_STATUS — DA USARE A FINE PRIMA VERA SESSIONE

```
## 19_GemNight — aggiornato [DATA]
Stato: 🔴 Da iniziare — F1-001 mai eseguito
Ultimo protocollo: F1-000 / F2-000
Tabelle DB toccate: nessuna
Pendenti: eseguire F1-001 audit · decidere D1/D2/D3 · poi F1-002 CREATE
```

---

## 10. CHAT CORRELATE

| Chat | Relazione |
|------|-----------|
| Chat_Analisi | Questa chat nasce da decisioni prese in Chat Analisi |
| 06_Contabilità | Incassi serate → si coordinano sul dominio `payments` |
| 12_Gemdario | Feed serate nel calendario attività |
| 17_Clarissa | Comunicazioni pre/post serata agli iscritti |

---

*RECAP_19_GemNight · v1.0 · Redatto il 05/05/2026*  
*Chat eliminata dopo produzione di questo documento.*  
*Caricare in: `_GAE_SVILUPPO/_CLAUDE/03_recap_chat/RECAP_19_GemNight.md`*
