# RECAP_06_Contabilità_Cassa
> Chat: 06_Contabilità_Cassa — StarGem Suite
> Stato: 🟡 In corso — F1-001 / F2-001 emessi, non ancora eseguiti
> Ultima sessione: 05/05/2026
> Prossima azione: attendere output F1-001 + F2-001 da Antigravity

---

## 1. SCOPO DEL MODULO

Digitalizzare tutto ciò che oggi vive su Excel separati e AthenaPortal.
Quattro aree operative:

1. **Chiusura cassa giornaliera** per operatrice (oggi: `conta_chiusura_giornaliera.xlsx`)
2. **Movimenti bancari unificati** — BPM + PostePay + Soldo
3. **Prima nota e controllo di gestione** (13 fogli Excel → StarGem)
4. **Esposizione UI dei campi payment già importati** (priorità immediata)

---

## 2. STATO DB AL MOMENTO DELLA CHAT

```
MariaDB stargem_v2 · VPS IONOS · porta 3307 (tunnel SSH)
Dev: localhost:5001

Tabelle già esistenti rilevanti per questo modulo:
  journal_entries       ← creata in Chat_01_Quote&Promo
  cost_centers          ← 7 record configurati
  accounting_periods    ← 30 periodi (3 stagioni)
  payment_methods       ← popolata
  payments              ← 3.775 record totali
                           · 3.257 da MASTER storico (import Chat_22)
                           · 518 da Workshop

Tabelle da creare (ancora non esistenti):
  cash_registers        ← chiusura cassa giornaliera
  bank_deposits         ← movimenti bancari unificati
  [cash_register_lines] ← solo se si sceglie struttura normalizzata (decisione F aperta)

REGOLE ASSOLUTE:
  payments     → MAI DROP, solo ADD COLUMN
  members      → MAI modificare colonne esistenti
  Prima di DROP: COUNT=0 + grep codice + nessuna route attiva
  Backup obbligatorio dopo ogni F1 che tocca DB
```

---

## 3. NOVITÀ CRITICA — CAMPI PAYMENT GIÀ NEL DB, NON VISIBILI IN UI

Importati da Chat_22 (import storico), presenti nel DB ma **non esposti né in API né in UI**:

| Campo | Descrizione | Esempio |
|-------|-------------|---------|
| `operator_name` | Chi ha inserito il pagamento | "Estefany", "Joel", "sito" |
| `source` | Canale vendita | "SEDE Nura", "BONIFICO" |
| `transfer_confirmation_date` | Data entrata sul conto | 2025-10-15 |
| `quota_description` | Descrizione quota | "2 CORSI ADULTI, 1 QUOTA TESSERA" |
| `period` | Periodo pagamento | "SETTEMBRE - OTTOBRE 2025" |
| `total_quota` | Totale quota lorda | 320.00 |
| `deposit` | Acconto versato | 100.00 |
| `receipts_count` | Numero ricevute fatte | 3 |
| `discount_code` | Codice sconto applicato | "BF2025" |
| `discount_value` | Valore sconto | 30.00 |

**Distribuzione metodi pagamento in payments:**
```
bonifico_poste:  1.299
bonifico_bpm:    1.220
cash:              616
welcomekit:         35
online:             32
```

---

## 4. PRIORITÀ UI — 3 LIVELLI

### Priorità 1 — Scheda Contabile (`/scheda-contabile`, `accounting-sheet.tsx`)
Aggiungere: `operator_name`, `source`, `quota_description`, `period`

### Priorità 2 — Lista Pagamenti (`/pagamenti`, `payments.tsx`)
Aggiungere:
- Filtro per metodo pagamento
- Colonna operatore (`operator_name`)

### Priorità 3 — Statistiche / Dashboard
Grafico per metodo di pagamento e canale vendita (`source`)

---

## 5. ANALISI EXCEL COMPLETATA

File analizzati nella prima sessione:

| File | Contenuto chiave |
|------|-----------------|
| `conta_chiusura_giornaliera.xlsx` | 1 foglio per operatrice + GENERALE. Ogni operatrice ha **12 metodi pagamento × 2 sub-colonne (CORSI + QUOTA TESS.) = 24 colonne** |
| `conta_Movimenti_BPM_dal_01set2025_al_07apr2026.xlsx` | Colonne: Data Contabile, Data Valuta, Importo, Athena(True/False), Divisa, Causale, Descrizione |
| `conta_Movimenti_POSTEPAY_dal_01set2025_al_14gen2026.xlsx` | Struttura analoga a BPM |
| `conta_Movimenti_SOLDO_dal_01set2025_al_31gen2026.xlsx` | Carta Soldo aziendale |
| `conta_CONTROLLO_DI_GESTIONE.xlsx` | 13 fogli: Budget, Vendite, Business Unit, Cashflow, Prima nota, SP, CE, Investimenti, BEP, Rating, Indicatori |
| `conta_VERIFICA_BILANCI_e_INSERIMENTI_SU_ATHENA.xlsx` | Bilanci e codici contabili Athena |
| `conta_costi_Online_SERVIZI_IN_ABBONAMENTO_01set202531ago2026.xlsx` | Abbonamenti servizi digitali con scadenze |
| `conta_2526_Resoconto_Vendite_e_Codici_Promo.xlsx` | Vendite per operatrice |
| `conta_Report_pre_iscrizioni_a_confronto_.xlsx` | Ricavi comparativi YoY |

---

## 6. DECISIONI ARCHITETTURALI APERTE (6 totali — tutte ancora da confermare)

### A — Import movimenti bancari
- **Opzione 1:** Upload CSV → parser automatico in `bank_deposits` ← CONSIGLIATA
- **Opzione 2:** Copia-incolla riga per riga da UI
- **Decisione Gaetano:** ⬜ Non presa

### B — Riconciliazione pagamenti-banca
- **Opzione 1:** Solo manuale (Santo clicca "Riconcilia")
- **Opzione 2:** Match automatico suggerito per importo/data + conferma umana ← CONSIGLIATA
- **Decisione Gaetano:** ⬜ Non presa

### C — Convivenza con AthenaPortal
- **Opzione 1:** Abbandono immediato di Athena
- **Opzione 2:** Parallelo — StarGem come cruscotto principale, flag `athena_synced` ← CONSIGLIATA
- **Decisione Gaetano:** ⬜ Non presa

### D — Ruolo Santo (commercialista)
- **Opzione 1:** Ruolo Admin esistente (vede tutto)
- **Opzione 2:** Nuovo ruolo `commercialista` con accesso solo a `/contabilita` ← CONSIGLIATA
- **Nota:** `user_roles.name` (non `roleName`) — colonna confermata
- **Decisione Gaetano:** ⬜ Non presa

### E — Controllo di gestione
- **Opzione 1:** Dashboard semplice (KPI + 3-4 grafici) ← CONSIGLIATA per ora
- **Opzione 2:** Replica completa dei 13 fogli Excel
- **Decisione Gaetano:** ⬜ Non presa

### F — Struttura chiusura cassa ⚠️ CRITICA — sblocca il DDL
Dalla lettura dell'Excel emerge che la struttura reale ha **12 metodi × 2 sub-colonne = 24 campi per operatrice**, non 4 come ipotizzato inizialmente.
- **Opzione 1:** Struttura piatta — 24 colonne in `cash_registers` (fedele all'Excel, semplice export)
- **Opzione 2:** Struttura normalizzata — tabella `cash_register_lines` con `payment_method` + `line_type` (CORSI/QUOTA) ← CONSIGLIATA per SaaS multi-tenant
- **Decisione Gaetano:** ⬜ Non presa — **blocca F1-002**

---

## 7. PROTOCOLLI EMESSI

### F1-PROTOCOLLO-001 — Ricognizione DB ✉️ Emesso, non ancora eseguito
**Obiettivo:** DESCRIBE payments + COUNT campi nuovi + grep route API payments
**Output atteso:** struttura tabella, conteggi campi, conferma se API espone già i 10 campi
**Nessuna modifica al DB**

### F2-PROTOCOLLO-001 — Ricognizione Frontend ✉️ Emesso, non ancora eseguito
**Obiettivo:** Analisi `accounting-sheet.tsx` e `payments.tsx`
**Output atteso:**
- Path esatti dei file
- Campi attualmente mostrati in Scheda Contabile e Lista Pagamenti
- Tipo TypeScript `Payment` — conferma se i 10 campi sono già nel tipo
**Nessuna modifica ai file**

---

## 8. PIANO PROTOCOLLI COMPLETO

```
FASE 0 — Priorità immediata (campi payment in UI)
  F1-001  Ricognizione DB + grep API                    ← emesso
  F2-001  Ricognizione accounting-sheet + payments.tsx  ← emesso
  F1-002  Aggiornare SELECT API payments
          (aggiungere i 10 nuovi campi al GET)
  F2-002  Scheda Contabile: aggiungere
          operator_name, source, quota_description, period
  F2-003  Lista Pagamenti: filtro metodo + colonna operatore
  F2-004  Statistiche: grafico per metodo e canale vendita

FASE 1 — DB nuove tabelle (dopo decisione F)
  F1-003  CREATE TABLE cash_registers (DDL dipende da decisione F)
  F1-004  CREATE TABLE bank_deposits
  F1-005  [Se F=Opzione2] CREATE TABLE cash_register_lines
  F1-006  API CRUD cash_registers
  F1-007  API CRUD bank_deposits + parser CSV BPM/PostePay/Soldo
  F1-008  API report mensile aggregato per operatrice
  F1-009  API export XLSX commercialista
  F1-010  [Se D=Opzione2] Ruolo commercialista in user_roles

FASE 2 — Frontend nuove sezioni
  F2-005  Route /contabilita + 6 tab + sidebar
  F2-006  Tab 1: Form chiusura cassa (tablet-friendly, calcoli real-time)
  F2-007  Tab 2: Movimenti banca unificati + upload CSV
  F2-008  Tab 3: Prima nota con filtri e CRUD
  F2-009  Tab 4: Dashboard controllo gestione (KPI + grafici)
  F2-010  Tab 5: Report operatrice + comparativo YoY
  F2-011  Tab 6: Abbonamenti con alert scadenze
  F2-012  Export XLSX commercialista (bottone in Tab 5)
```

---

## 9. REGOLE OPERATIVE DI QUESTA CHAT

```
F1 = AG-Backend  (server/, shared/schema.ts)
F2 = AG-Frontend (client/src/)
Numerazione: F1-001 / F2-001 (chat indipendente — non continuare da altre chat)
Stop & Go SEMPRE prima di modificare DB o file critici
Max 1 numero di distanza tra F1 e F2
Nessun protocollo successivo senza risposta di ENTRAMBE le finestre
Backup: mariadb-dump dopo ogni F1 che tocca il DB
  → /root/backups/conta_F1-[N]_$(date +%Y%m%d_%H%M).sql
Claude non scrive mai codice — solo prompt per Antigravity
```

---

## 10. ARCHITETTURA AUTH (confermata globalmente al 13/04/2026)

```
members.user_id VARCHAR(255) → FK → users.id (onDelete: set null)
users.role = testo libero (non FK)
user_roles.name  ← colonna corretta (NON roleName)

Ruoli rilevanti per Contabilità:
  admin      → accesso completo
  operator   → gestionale operativo
  [commercialista] → solo /contabilita (da creare — decisione D aperta)
```

---

## 11. TEMPLATE AGGIORNAMENTO MASTER_STATUS

Da incollare nel MASTER_STATUS.md a fine sessione:

```
## 06_Contabilità_Cassa — aggiornato 05/05/2026
Stato: 🟡 In corso
Ultimo protocollo: F1-001 / F2-001 (emessi, output atteso)
Tabelle DB toccate: nessuna
Pendenti:
  - Attendere output F1-001 (DESCRIBE payments + grep API)
  - Attendere output F2-001 (analisi accounting-sheet.tsx + payments.tsx)
  - 6 decisioni architetturali A-F tutte aperte (F è bloccante per DDL)
  - Dopo output: emettere F1-002 (API) + F2-002 (Scheda Contabile)
```
