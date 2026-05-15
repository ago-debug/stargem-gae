# RECAP_18_GemEvent
> Chat: 18_GemEvent — StarGem Suite
> Creato: 05/05/2026
> Stato: 🔴 Da iniziare — nessun protocollo eseguito
> Da caricare in: `_GAE_SVILUPPO/_CLAUDE/03_recap_chat/`

---

## 1. IDENTITÀ CHAT

| Campo | Valore |
|-------|--------|
| Numero chat | 18 |
| Nome modulo | GemEvent |
| Chat precedente correlata | — |
| Chat correlate | 12_Gemdario (calendario) · 01_Quote&Promo (promo eventi) · 20_MerchSG (vendite in sede) |
| Responsabile prodotto | Gaetano (founder/director Geos SSDRL) |
| AG-Backend | AG-F1 |
| AG-Frontend | AG-F2 |

---

## 2. SCOPO DEL MODULO

GemEvent è il modulo di gestione degli **eventi esterni** organizzati da Studio Gem: concerti, serate a tema, saggi ospitati, collaborazioni con artisti, eventi fuori sede.

La differenza rispetto alle attività didattiche ordinarie:
- **Location esterna** (non uno studio della scuola)
- **Biglietteria** con tipi/prezzi/disponibilità
- **Partner e collaboratori** esterni (artisti, promoter, sponsor)
- **Budget evento** con P&L preventivo/consuntivo
- **Comunicazioni e promozione** dedicate

---

## 3. STATO ATTUALE NEL SISTEMA (al momento della chat)

### Nel DB
- La tabella `courses` (STI) supporta `activity_type = 'eventi_esterni'`
- Colonna `activity_type` aggiunta con F1 della chat 00_errori (07/04/2026)
- **Zero record** di tipo `eventi_esterni` nel DB (verificato da documentazione 00A)
- Tabella `booking_services` presente ma è un catalogo generico per affitti, non per eventi veri
- **Nessuna tabella dedicata** per biglietteria, partner, budget, comunicazioni

### Nel frontend
- Route `/attivita/servizi` → componente `BookingServices` — **stub/placeholder**
- Route `/categorie-eventi-esterni` → `BookingServiceCategories` — **canonico ma vuoto**
- Colore assegnato agli eventi: non ancora definito nel registry colori STI
- La sezione appare nella sidebar ma non ha contenuto funzionale

### API backend
- `GET/POST /api/booking-services` — route esistente ma mappa a `booking_services`, non a eventi veri
- Nessuna route `/api/geměvent/*` o `/api/eventi-esterni/*`

---

## 4. DECISIONI ARCHITETTURALI PRESE IN QUESTA CHAT

### 4.1 Struttura a 5 Layer

Il modulo GemEvent è stato progettato a 5 layer distinti:

**L1 — Anagrafica Evento**
- Usa il STI `courses` con `activity_type = 'eventi_esterni'`
- Campi aggiuntivi: location esterna, indirizzo, capienza sala, data/ora inizio-fine, stato evento (bozza / confermato / sold-out / annullato)
- Nessuna nuova tabella per questo layer — tutto su `courses` con ALTER

**L2 — Biglietteria**
- Nuove tabelle: `event_tickets` (tipi biglietto) + `event_ticket_sales` (vendite)
- Gestione: tipo, prezzo, quantità disponibile, venduto, rimanente
- FK verso `courses.id`

**L3 — Partner & Collaborazioni**
- Nuova tabella: `event_partners`
- Soggetti esterni: artisti, promoter, sponsor, co-organizzatori
- Campi: tipo collaborazione, compenso/accordo, note contrattuali
- FK verso `courses.id`

**L4 — Budget Evento**
- Nuove tabelle: `event_budgets` + `event_budget_items`
- Voci entrata/uscita, preventivo vs consuntivo, P&L finale
- Collegato a `journal_entries` per contabilità (già esistente da 01_Quote&Promo)

**L5 — Comunicazioni & Promo**
- Aggancio a `promo_rules` già esistente per codici promo dedicati all'evento
- Canali: WA, email, SMS (via canali già operativi in StarGem)
- Possibile aggancio a TV_palinsesto per comunicazioni in sede

### 4.2 UI Prevista

**Route:** `/geměvent` (nuova, dedicata)
**Struttura:** 6 Tab

| Tab | Contenuto |
|-----|-----------|
| 1 | Lista Eventi — card con stato, data, location, biglietti venduti/totali |
| 2 | Biglietteria — tipi biglietto, prezzi, disponibilità, vendite |
| 3 | Partner — lista collaboratori, tipo accordo, compenso |
| 4 | Budget — P&L preventivo/consuntivo, voci entrata/uscita |
| 5 | Comunicazioni — messaggi programmati, promo codici, canali |
| 6 | Statistiche — incassi, presenze, confronto budget/reale |

### 4.3 Colore STI da assegnare
Non ancora definito. Da aggiungere al registry colori in fase F2-001.
Suggerimento: `#b45309` (ambra scura) — distinguibile dagli altri.

---

## 5. PROTOCOLLI EMESSI

| Protocollo | Stato | Descrizione |
|-----------|-------|-------------|
| F1-001 | 🔴 **PRONTO MA NON ESEGUITO** | Audit completo eventi_esterni nel DB e nel codebase |

### Testo F1-001 (pronto per copia-incolla)

```
PER AG-F1 (BACKEND)

Sei AG-Backend nel progetto StarGem Suite.
Leggi MASTER_STATUS.md e ANALISI_MASTER.md prima di procedere.

▶ F1-PROTOCOLLO-001 — AUDIT EVENTI ESTERNI (SELECT/SHOW ONLY — ZERO MODIFICHE)

Esegui le seguenti query di ricognizione e riportami TUTTI i risultati.
NON modificare nulla. NON eseguire ALTER, INSERT, UPDATE, DROP.

--- SEZIONE A: courses STI ---
1. SELECT COUNT(*), activity_type FROM courses GROUP BY activity_type ORDER BY COUNT(*) DESC;
2. SELECT * FROM courses WHERE activity_type = 'eventi_esterni' LIMIT 20;
3. SHOW COLUMNS FROM courses;

--- SEZIONE B: tabelle booking_services ---
4. SHOW COLUMNS FROM booking_services;
5. SELECT COUNT(*) FROM booking_services;
6. SELECT * FROM booking_services LIMIT 10;

--- SEZIONE C: tabelle correlate ---
7. SHOW TABLES LIKE '%event%';
8. SHOW TABLES LIKE '%booking%';
9. SHOW TABLES LIKE '%ticket%';
10. SHOW TABLES LIKE '%partner%';
11. SHOW TABLES LIKE '%budget%';

--- SEZIONE D: grep codebase ---
12. grep -r "eventi_esterni" /server/ --include="*.ts" -l
13. grep -r "eventi_esterni" /client/src/ --include="*.tsx" -l
14. grep -r "BookingServices" /client/src/ --include="*.tsx" -l
15. grep -r "booking-services" /server/routes.ts

--- SEZIONE E: stato attuale route ---
16. Mostrami il blocco completo relativo a /api/booking-services in routes.ts
17. Mostrami il componente BookingServices.tsx completo (o il suo percorso)

Riporta tutti i risultati in formato strutturato.
Non procedere oltre.

▶ STOP — Attendo report completo prima di autorizzare qualsiasi modifica.
```

---

## 6. PROSSIMI PASSI — SEQUENZA PREVISTA

| Step | Protocollo | Descrizione | Dipendenze |
|------|-----------|-------------|------------|
| 1 | **F1-001** | Audit eventi_esterni nel DB + codebase | — |
| 2 | **F1-002** | Stop&Go: proposta ALTER courses + tabelle nuove (event_tickets, event_partners, event_budgets) | Report F1-001 |
| 3 | **F1-003** | Esecuzione ALTER + CREATE TABLE + route API `/api/geměvent/*` | VAI dopo F1-002 |
| 4 | **F2-001** | Scaffold `/geměvent` — route, sidebar, 6 tab placeholder | Dopo F1-002 |
| 5 | **F1-004 / F2-002** | Biglietteria: API + Tab 2 UI | F1-003 completato |
| 6 | **F1-005 / F2-003** | Partner: API + Tab 3 UI | F1-003 completato |
| 7 | **F1-006 / F2-004** | Budget: API + Tab 4 UI + aggancio journal_entries | F1-003 completato |
| 8 | **F2-005** | Comunicazioni + promo codici | Promo_rules esistente |
| 9 | **F2-006** | Statistiche + Tab 6 | Dati reali presenti |
| 10 | **F1-007 / F2-007** | E2E test + backup finale | Tutto completato |

---

## 7. RIFERIMENTI ARCHITETTURALI

### Tabelle esistenti da cui GemEvent dipende

| Tabella | Relazione |
|---------|-----------|
| `courses` | STI base — evento = record con activity_type='eventi_esterni' |
| `enrollments` | Iscritti/partecipanti all'evento |
| `members` | Anagrafica partecipanti |
| `payments` | Pagamenti biglietti (MAI DROP, solo ADD COLUMN) |
| `promo_rules` | Codici sconto/promo per eventi |
| `journal_entries` | Contabilità budget evento |
| `cost_centers` | Centro di costo per ogni evento |
| `strategic_events` | Planning calendario (eventi appaiono qui come date) |

### Tabelle nuove da creare (stima)

| Tabella | Layer | Note |
|---------|-------|------|
| `event_tickets` | L2 | Tipi biglietto per evento |
| `event_ticket_sales` | L2 | Vendite biglietti individuali |
| `event_partners` | L3 | Partner/collaboratori per evento |
| `event_budgets` | L4 | Budget header per evento |
| `event_budget_items` | L4 | Voci singole del budget |

---

## 8. MASTER_STATUS — TEMPLATE AGGIORNAMENTO

Da usare a fine prima sessione operativa:

```
## 18_GemEvent — aggiornato [DATA]
Stato: 🟡 In corso
Ultimo protocollo: F1-001 / F2-000
Tabelle DB toccate: nessuna (solo audit)
Pendenti: attendere report F1-001 per procedere con F1-002 (ALTER + CREATE)
```

---

## 9. NOTE OPERATIVE

- **MCP non disponibile** in questa sessione (modalità browser) — i file _GAE_SVILUPPO non sono stati letti live ma dal Project Knowledge
- Il MASTER_STATUS letto riporta GemEvent come **18_GemEvent 🔴 Da iniziare**
- La numerazione protocolli **riparte da F1-001 / F2-001** (non continuare da altre chat)
- Backup DB obbligatorio al primo F1 che tocca tabelle (prima ALTER su `courses`)
- Il colore STI per eventi_esterni è **da definire** — proposta `#b45309`

---

*RECAP_18_GemEvent · StarGem Suite · 05/05/2026*
*Prodotto da: Chat 18_GemEvent (Claude coordinatore)*
