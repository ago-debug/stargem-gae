# RECAP_06_Contabilita
> Aggiornato: 2026_04_28_1700 (convertito da originale 2026_04_26_1800)
> Stato chat: 🔴 Da iniziare — briefing pronto, F1/F2 mai emessi
> Ultimo protocollo: F1-000 / F2-000

---

## 1. SCOPO E PERIMETRO

Modulo per la gestione della cassa operativa, dei pagamenti e delle ricevute.
Governa la UI di contabilità (cash_registers, bank_deposits), il rollback
import pagamenti, i campi metadati pagamenti (operator, source, periodo,
quota, sconti, gbrh), la sezione buoni regalo (2526GIFT).

NON gestisce: pagamenti tessera (collegati ma gestiti tramite GemPass —
vedi Chat_05), pagamenti corsi (collegati a iscrizioni — vedi Chat_08),
schema base `payments` (già stabile, non si tocca struttura — solo ADD COLUMN).

Visibile a: admin, operator (segreteria con ruolo cassa).

---

## 2. STATO ATTUALE

### Cosa è già fatto
- Tabella `payments` con 12.062 record (al 28/04 — significativamente
  cresciuta rispetto al 25/04 quando erano 3.775; verificare con AG)
- ExportWizard integrato in `accounting-sheet.tsx` e `payments.tsx`
- Strong typing colonne attivo
- Smart Routing nell'import: QUOTATESSERA e visite mediche non finiscono
  più in `enrollments` per errore (passano alle tabelle dedicate)
- Classificazione `2526GIFT='buono_regalo'` (21 iscrizioni)
- `sanitizer.ts` attivo su tutti i salvataggi

### ⚠️ Da verificare all'apertura della chat
- Tra 25/04 (`payments=3.775`) e 28/04 (`payments=12.062`) `payments` è
  cresciuto di **+8.287 record**. Questo aumento NON è documentato in
  nessun recap. Possibile import massivo o riconciliazione automatica.
  AUDIT IMMEDIATO RICHIESTO prima di toccare qualsiasi cosa.

### Cosa è in corso
- Niente di operativo. La chat è ferma in attesa di partenza.

### Cosa è bloccato
- Apertura operativa bloccata fino a chiarimento del delta `payments` +8.287.

---

## 3. TABELLE DB COINVOLTE

| Tabella | Ruolo | Record (28/04) | Note |
|---|---|---|---|
| `payments` | TABELLA PRINCIPALE | 12.062 | era 3.775 il 25/04 — delta +8.287 da chiarire |
| `cost_centers` | centri di costo | 7 | configurati |
| `accounting_periods` | periodi contabili | 30 | configurati |
| `journal_entries` | scritture contabili | 1 | scaffolding ready |
| `cash_registers` | DA CREARE — UI cassa | — | |
| `bank_deposits` | DA CREARE — versamenti banca | — | |
| `pay_notes` | etichette pagamento | 28 | configurati |
| `welfare_providers` | enti welfare | 4 | Edenred ecc. |
| `pagodil_tiers` | rateizzazione | 3 | configurati |

---

## 4. FILE CHIAVE NEL CODEBASE

- `client/src/pages/accounting-sheet.tsx` — vista contabilità mensile
- `client/src/pages/payments.tsx` — lista pagamenti con ExportWizard
- `client/src/components/PaymentModuleConnector.tsx` — ⚠️ SENSIBILE — 14 route
- `server/routes/payments.ts` — API pagamenti
- `server/routes/import.ts` — import storico (Smart Routing attivo)
- `shared/schema.ts` § payments + § accounting_*

---

## 5. DECISIONI ARCHITETTURALI APERTE

### Decisione 1 — Architettura rollback import pagamenti
- **Cosa decidere:** strategia per "Annulla ultimo import" pagamenti
- **Stato:** ⏳ aperta — ALTA PRIORITÀ
- **Note:** opzioni:
  - transazione `BEGIN/COMMIT` su ogni import + funzione `ROLLBACK`
    dell'ultimo batch (identificato da `import_batch_id` o timestamp)
  - finestra temporale (es. 30 minuti) per confermare/annullare
  - **REGOLA INVIOLABILE:** pagamenti NON si droppano mai, usare
    soft-delete o flag annullato

### Decisione 2 — Quali campi `payments` rendere visibili in UI
- **Cosa decidere:** ordine, layout e filtri per i campi nascosti
  - `operator_name` → chi ha inserito il pagamento
  - `source` → canale/sede di vendita
  - `transfer_confirmation_date` → data entrata sul conto
  - `quota_description` → descrizione (es. "2 CORSI ADULTI, 1 QUOTA TESSERA")
  - `period` → periodo (es. "SET-OTT 2025")
  - `total_quota` → totale lordo
  - `deposit` → acconto versato
  - `receipts_count` → numero ricevute
  - `discount_code` + `discount_value` + `discount_percentage`
  - `promo_code` + `promo_value` + `promo_percentage`
  - `gbrh_numero` + `gbrh_data_*` + `gbrh_iban` (buoni gift)
- **Stato:** ⏳ aperta

### Decisione 3 — Architettura sezione Buoni Regalo
- **Cosa decidere:** UI dedicata per gestione buoni regalo (2526GIFT)
  - emissione (con codice e importo)
  - utilizzo (collegato a un pagamento)
  - scadenza
  - report disponibilità
- **Stato:** ⏳ aperta — 21 iscrizioni già classificate `buono_regalo`

---

## 6. PROTOCOLLI ESEGUITI

### Backend (F1)
*Nessuno specifico per Chat_06. I lavori su payments fatti da Chat_22 e
Chat_22b non vanno conteggiati qui.*

### Frontend (F2)
*Nessuno specifico per Chat_06.*

---

## 7. PENDENTI

In ordine di priorità:

1. [ ] **AUDIT pre-operativo**: chiarire delta `payments` +8.287 tra 25/04
   e 28/04 (priorità ZERO — possibile import non documentato)
2. [ ] **Rollback import pagamenti** (alta priorità) — protezione operativa
3. [ ] Mostrare 10+ campi nascosti in UI accounting-sheet/payments
4. [ ] Sezione UI dedicata Buoni Regalo (2526GIFT)
5. [ ] UI cassa operativa: `cash_registers`, `bank_deposits`
6. [ ] Riconciliazione automatica conti (3 banche dai file
   `conta_Movimenti_BPM/POSTE/POSTEPAY/SOLDO`)

---

## 8. INTERSEZIONI CON ALTRE CHAT

- **Chat_22b_ImportExport** — ha modificato strumenti import e ExportWizard.
  Sanitizer.ts attivo anche su payments.
- **Chat_22b_Bonifica** — ha creato 24 tessere e mosso quote dal "storico".
  I pagamenti non sono ancora stati ripuliti.
- **Chat_05_GemPass** — `payments.membership_id` per quote tessera.
- **Chat_08_Corsi** — `payments.enrollment_id` per quote corso.
  Tabella enrollments −1.350 record (delta da chiarire) — verificare
  se ci sono pagamenti orfani.
- **Chat_24_DB_Monitor** — utile per tracciare crescita payments in tempo reale.

---

## 9. NOTE PER LA PROSSIMA SESSIONE

- **REGOLA INVIOLABILE — `payments`**: MAI DROP, solo `ADD COLUMN`.
  PaymentModuleConnector impatta 14 route — non toccare.
- **Smart Routing attivo nell'import**: QUOTATESSERA → memberships
  automatico, DTYURI/DTNELLA → medical_certificates automatico.
- **`2526GIFT` = buoni regalo** (21 iscrizioni). Categoria `buono_regalo`
  in `courses.activity_type`.
- **3 SKU storico contenitori NON toccare**: QUOTATESSERA, DTYURI, DTNELLA.
- **TZ=Europe/Rome** sul VPS — date pagamenti sempre in fuso italiano.
- **3 conti correnti** dal mondo reale (BPM, Poste, Postepay, Soldo) —
  serve riconciliazione automatica con `payments.transfer_confirmation_date`.

---

*Aggiornato l'ultima volta da: Claude (chat di Analisi) in data 2026_04_28_1700
basato su: RECAP_Chat06_Contabilita_2026_04_26_1800 + audit DB 28/04*
