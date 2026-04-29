# RECAP_08_Corsi
> Aggiornato: 2026_04_28_1545
> Stato chat: 🟡 Briefing pronto — stato operativo da verificare
> Ultimo protocollo: F1-? / F2-? (vedi sezione 6)

---

## 1. SCOPO E PERIMETRO

Modulo di gestione delle iscrizioni a corsi e workshop. Governa la tabella
`enrollments`, il rapporto member ↔ course, lo `status` dell'iscrizione,
il `participation_type`, il `season_id` di iscrizione e i metadati di
import (`source_file`, `notes`).

NON gestisce: i pagamenti collegati (vedi Chat_06_Contabilità), il
calendario/planning (vedi Chat_12B_Gemdario), le tessere (vedi
Chat_05_GemPass), i certificati medici (vedi Chat_04_MedGem).

Visibile a: segreteria, admin. Non esposto a B2C tesserati.

---

## 2. STATO ATTUALE

### Cosa è già fatto (al 28/04)
- Bonifica preventiva eseguita in Chat_22b/Bonifica:
  - 285 SKU "storico" riclassificati per activity_type
  - 929 prove con `season_id=1` aggiornato
  - Smart Routing import attivo (QUOTATESSERA → memberships,
    DTYURI/DTNELLA → medical_certificates)
  - 3 SKU storico contenitori NON toccare:
    `2526QUOTATESSERA`, `2526DTYURI`, `2526DTNELLA`
- Briefing operativo scritto il 26/04/2026 ore 18:00

### ⚠️ Da verificare all'apertura della chat (priorità ZERO)
- Audit DB: tra il 25/04 (`enrollments=13.584`) e il 28/04
  (`enrollments=12.234`) si è perso un delta di **−1.350 record**.
  Verificare cosa è successo prima di ogni altra operazione.
- Audit DB: tra il 25/04 e il 28/04 `members` è salito da 4.489 a 4.918
  (+429), `courses` da 586 a 602 (+16). Capire se collegato a Chat_08
  o ad altre chat.
- Decisione `participation_type` ('corso' vs 'STANDARD_COURSE'):
  potrebbe essere già stata presa ed attuata. Da verificare con AG.
- Eventuali protocolli F1/F2 eseguiti tra 26/04 e 28/04: mai tracciati.

### Cosa è in corso
- Nessun protocollo aperto noto.

### Cosa è bloccato
- L'apertura operativa della chat è bloccata fino a chiarimento del
  delta DB sopra.

---

## 3. TABELLE DB COINVOLTE

| Tabella | Ruolo | Record (28/04) | Note |
|---|---|---|---|
| `enrollments` | TABELLA PRINCIPALE — iscrizioni | 12.234 | era 13.584 il 25/04 — delta −1.350 da chiarire |
| `courses` | catalogo corsi (STI) | 602 | era 586 il 25/04 — delta +16 da chiarire |
| `seasons` | stagioni di riferimento | 3 | season_id=1 (25/26), 2 (26/27), 3 (24/25) |
| `members` | anagrafica iscritti (FK) | 4.918 | era 4.489 il 25/04 — delta +429 da chiarire |
| `memberships` | tessere (FK indiretta) | 3.305 | da Chat_05 |
| `medical_certificates` | certificati (FK indiretta) | 2.867 | da Chat_04 |

---

## 4. FILE CHIAVE NEL CODEBASE

*Da verificare con AG all'apertura — questi sono i percorsi probabili
basati su MASTER_STATUS e D, non confermati per Chat_08.*

- `server/routes/enrollments.ts` — route iscrizioni (probabile)
- `client/src/pages/courses.tsx` — elenco corsi
- `client/src/pages/scheda-corso.tsx` — scheda dettaglio corso con
  iscritti (JOIN reali tessera + certificato già implementato)
- `shared/schema.ts` § enrollments + § courses
- `server/utils/sanitizer.ts` — attivo su tutti i salvataggi
- `shared/utils/cf-validator.ts` — validatore CF italiano (Chat_22b)

---

## 5. DECISIONI ARCHITETTURALI APERTE

### Decisione 1 — `participation_type` standardizzato
- **Cosa decidere:** se mantenere `'corso'` o `'STANDARD_COURSE'` come
  unico valore standard, e migrare l'altro
- **Stato:** ⏳ aperta (o forse chiusa ed attuata, da verificare)
- **Note:** prima di scegliere, audit:
  ```sql
  SELECT participation_type, COUNT(*)
  FROM enrollments
  GROUP BY participation_type;
  ```

### Decisione 2 — Mappatura badge status iscrizione
- **Cosa decidere:** colori e regole per i badge
  - `active` → 🟢 verde
  - `pending` → 🟡 giallo
  - `cancelled` → 🔴 rosso
- **Stato:** ⏳ aperta — schema concordato il 26/04, mai implementato
- **Note:** al 26/04 tutti i record sono `'active'`, quindi il badge
  in UI non si vede. Implementare comunque per i nuovi flussi.

### Decisione 3 — OPEN* SKU = abbonamenti corsi
- **Cosa decidere:** verificare visualizzazione corretta nei filtri UI
  degli SKU OPEN* (riclassificati come `corso` da Chat_22b)
- **Stato:** ⏳ aperta
- **Note:** verifica visiva, niente DB change

---

## 6. PROTOCOLLI ESEGUITI

### Backend (F1)
*Da verificare con AG all'apertura — possibili protocolli eseguiti
tra 26/04 e 28/04 ma non tracciati in questo recap.*

### Frontend (F2)
*Da verificare con AG all'apertura — possibili protocolli eseguiti
tra 26/04 e 28/04 ma non tracciati in questo recap.*

---

## 7. PENDENTI

In ordine di priorità:

1. [ ] **Audit DB pre-operativo** — capire delta enrollments −1.350,
   members +429, courses +16 tra 25/04 e 28/04 (priorità ZERO)
2. [ ] Decidere e attuare standard `participation_type`
3. [ ] Implementare badge status iscrizione in UI (active/pending/cancelled)
4. [ ] Mostrare campi nascosti in UI:
   - `enrollments.source_file` (fonte import)
   - `enrollments.notes` (note interne)
   - `enrollments.season_id` (stagione iscrizione)
5. [ ] Aggiungere filtri in UI: per stagione, per status, per tipo
6. [ ] Verifica visiva OPEN* (abbonamenti corsi) nei filtri

---

## 8. INTERSEZIONI CON ALTRE CHAT

- **Chat_22b_Bonifica** — ha preparato il terreno: 285 SKU riclassificati,
  929 prove con season_id=1, Smart Routing, sanitizer.ts. Leggere il loro
  RECAP per capire cosa è già stato fatto.
- **Chat_22_ImportExport** — chiusa il 25/04, fonte dei numeri DB iniziali.
- **Chat_05_GemPass** — `enrollments` può avere FK indiretta verso
  `memberships`. Coordinare se si tocca lo schema.
- **Chat_06_Contabilità** — `payments` ha `enrollment_id` come FK.
  Modifiche a enrollments impattano i pagamenti.
- **Chat_12B_Gemdario** — il calendario legge da `courses` e fa JOIN
  con `enrollments`. UI FREEZE attivo.
- **Chat_24_DB_Monitor** — utile per tracciare cambiamenti DB.
- **Chat_25_DB_Cleanup** — preparazione attiva per cleanup tabelle
  backup `enrollments_backup_op1235*`.

---

## 9. NOTE PER LA PROSSIMA SESSIONE

- **3 SKU storico contenitori NON toccare**: `2526QUOTATESSERA`,
  `2526DTYURI`, `2526DTNELLA`. Sono import containers per altre tabelle.
- **Smart Routing attivo nell'import**: nuovi CSV non creano più record
  storico in `enrollments` per errore.
- **`enrollments` NON deve essere mai droppata.** È la tabella iscrizioni
  ufficiale. La defunta `universal_enrollments` (record=0) è da droppare
  in Chat_25_DB_Cleanup.
- **Tutti i pagamenti collegati a iscrizioni** passano via
  `payments.enrollment_id`. Modifiche a enrollments che cambiano gli ID
  rompono PaymentModuleConnector (14 route).
- **OPEN* = abbonamenti corsi**, non singoli corsi. Hanno pricing
  diverso e logica di calcolo separata.
- **Stagione attiva al 28/04**: 25/26 (`season_id=1`).

---

*Aggiornato l'ultima volta da: Claude (chat di Analisi)
in data 2026_04_28_1545 — basato su:
- Briefing originale Chat_08 del 26/04/2026 ore 18:00
- MASTER_STATUS_2026_04_26_1800.md
- D_2026_04_28_1150_Mappa_Dati_e_Frontend.md
- Memoria progetto*
