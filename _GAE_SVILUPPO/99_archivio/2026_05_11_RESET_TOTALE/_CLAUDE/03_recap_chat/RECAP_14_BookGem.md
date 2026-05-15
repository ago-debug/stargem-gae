# RECAP_14_BookGem — Chat BookGem
> **Progetto:** StarGem Suite — Geos SSDRL (Studio Gem Milano)
> **Chat numero:** 14
> **Tema:** BookGem — Gestione affitti spazi (sale danza, studio medico, eventi, esterni)
> **Stato:** 🔴 Da iniziare — Audit non ancora eseguito
> **Ultimo protocollo eseguito:** nessuno (F1-001 draft pronto, non inviato ad AG)
> **Data apertura chat:** 05/05/2026
> **Data chiusura/archiviazione:** 05/05/2026

---

## 1. CONTESTO DI PARTENZA

### Stato BookGem nel sistema StarGem al momento dell'apertura

BookGem è classificato come **"Operativo"** nel MASTER_STATUS (aggiornato 13/04/2026), ma si tratta di un MVP minimo. Esistono due sole tabelle fisiche:

- `studios` — 13 record (le sale fisiche della struttura)
- `studio_bookings` — prenotazioni spot, struttura base

La route `/prenotazioni-sale` è funzionante e la pagina esiste nel frontend (`studio-bookings.tsx`), ma il modulo è rimasto allo stato di booking-spot semplice senza gestione avanzata.

### Cosa manca rispetto agli obiettivi

Il modulo attuale **non ha:**
- Prezzi configurabili per tipo di sala / fascia oraria / tipo affitto
- Contratti ricorrenti (affitti mensili, accordi multi-mese)
- Calendario disponibilità reale (controllo sovrapposizioni)
- Distinzione per tipo di affitto (sala danza, studio medico, sala eventi, spazio esterno)
- Integrazione strutturata con il sistema `payments` (ora solo "Stato Pagamento Immediato Sì/No")
- Fatturazione / ricevute legate all'affitto
- Gestione affittuari non tesserati (es. medici, soggetti B2B esterni)

### Informazioni architetturali rilevanti (da documenti analisi)

Dalle analisi esistenti nel Project Knowledge:

**Tabelle correlate già presenti nel DB:**
- `booking_service_categories` → categorie servizi
- `booking_services` → dizionario servizi prenotabili (es. "Affitto Sala Medica")
- `price_matrix` → già usata in Quote & Promo, potenzialmente estendibile
- `rental_categories` → estratta in tabella indipendente (da confermare esistenza fisica)
- `payments` → ha FK verso `studio_bookings` (colonna `booking_id` da confermare)

**Regola architetturale:**
> BookGem è un dominio **NON didattico**. Non va mischiato con il calendario corsi (STI). Ha proprie viste, propri permessi, propria logica. Il modale `StudioBookings` in `studio-bookings.tsx` è focalizzato sugli spazi nudi, non sui corsi.

**Utenti che possono affittare:**
- Tesserati (con tessera attiva) → accesso standard
- Non tesserati (tessera assente o scaduta) → **possono affittare, pagare, ricevere fattura** (es. medici, soggetti esterni — confermato dalla classificazione utenti nel documento `002_CLASSIFICAZIONE_DEFINITIVA`)

**Colore affitti nel calendario:** `#374151` (grigio scuro, sigla `AFT`)

**Campi obbligatori attuali nel form:**
- Servizio, Prenotante, Sala, Data, Ora Inizio/Fine, Importo, Stato Pagamento Immediato (Sì/No)

**Campi accessori attuali:**
- Metodo Pagamento, Note, Contatto, Categoria Affitto

---

## 2. OBIETTIVI DI QUESTA CHAT

Evolvere BookGem da **booking-spot** a **gestione affitti completa**:

1. Prezzi configurabili per tipo/sala/durata (listino affitti)
2. Contratti ricorrenti (affitti mensili, accordi multi-mese)
3. Calendario disponibilità con controllo sovrapposizioni
4. Distinzione tipi di affitto: sala danza / studio medico / sala eventi / altro
5. Integrazione strutturata con `payments` e sistema ricevute
6. Gestione affittuari non tesserati (B2B, medici, soggetti esterni)
7. UI evoluta: da modale singolo a pagina multi-tab

---

## 3. PIANO SVILUPPO CONCORDATO (4 FASI)

### Fase 1 — Audit e gap analysis DB (F1-001 → F1-002)
Fotografia reale delle colonne esistenti in `studios` e `studio_bookings`. Nessuna modifica, solo SELECT e SHOW.

### Fase 2 — Schema evolution DB (F1-003 → F1-005)
ALTER/CREATE chirurgici. Ipotesi di lavoro (da validare post-audit):

**`studios` — possibili aggiunte:**
- `studio_type` ENUM/VARCHAR (sala_danza / studio_medico / sala_eventi / altro)
- `capacity` INT
- `is_active` BOOLEAN DEFAULT TRUE
- `hourly_rate_default` DECIMAL(10,2)
- `notes` TEXT

**`studio_bookings` — possibili aggiunte:**
- `booking_type` VARCHAR (spot / ricorrente / contratto)
- `recurrence_rule` VARCHAR (es. "weekly:MON,WED")
- `contract_start` DATE
- `contract_end` DATE
- `rental_amount` DECIMAL(10,2)
- `vat_included` BOOLEAN
- `notes_internal` TEXT
- `status` più granulare (confermata / in_attesa / annullata / completata)

**Nuove tabelle probabili:**
- `rental_pricing` — listino prezzi: tipo_sala × fascia_oraria × tipo_affitto (valutare integrazione con `price_matrix` già esistente)
- `rental_contracts` — contratti multi-mese con scadenze, referente, documenti allegati

### Fase 3 — API & Backend (F1-006 → F1-008)
Route CRUD per contratti, disponibilità calendario, listino prezzi configurabile da UI.

### Fase 4 — Frontend (F2-001 → F2-006)
UI `/prenotazioni-sale` evoluta con struttura multi-tab:
- Tab 1: Prenotazioni (lista + ricerca + filtri)
- Tab 2: Contratti ricorrenti
- Tab 3: Listino prezzi (configurabile)
- Tab 4: Disponibilità / Calendario
- Tab 5: Statistiche / Report

---

## 4. PROTOCOLLI ESEGUITI

| Protocollo | Stato | Note |
|-----------|-------|------|
| F1-001 | ⬜ DRAFT — non inviato ad AG | Prompt audit completo scritto, pronto per copia-incolla |
| F1-002+ | ⬜ Non iniziato | Dipende da output F1-001 |
| F2-001+ | ⬜ Non iniziato | Parte dopo F1-002 |

### Testo completo F1-001 (pronto per la prossima sessione)

```
Sei Antigravity AG-BACKEND nel progetto StarGem Suite — Chat BookGem.
Questa è la chat dedicata al modulo BookGem (gestione affitti spazi).
Protocolli in questa chat: F1-001, F1-002, ecc. (ripartenza da 001).
Regola Stop & Go: riporta sempre i risultati PRIMA di eseguire qualsiasi modifica.

────────────────────────────────────────
F1-PROTOCOLLO-001 — AUDIT DB BookGem
────────────────────────────────────────
OBIETTIVO: Fotografia completa e senza modifiche delle tabelle BookGem esistenti.
PERIMETRO: Solo SELECT e SHOW. Zero ALTER, zero INSERT, zero DROP.

Esegui nell'ordine:

1. STRUTTURA COMPLETA `studios`
   SHOW FULL COLUMNS FROM studios;
   SELECT COUNT(*) FROM studios;
   SELECT * FROM studios LIMIT 5;

2. STRUTTURA COMPLETA `studio_bookings`
   SHOW FULL COLUMNS FROM studio_bookings;
   SELECT COUNT(*) FROM studio_bookings;
   SELECT * FROM studio_bookings ORDER BY id DESC LIMIT 5;

3. FOREIGN KEYS su entrambe le tabelle
   SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME,
          REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
   FROM information_schema.KEY_COLUMN_USAGE
   WHERE TABLE_SCHEMA = 'stargem_v2'
     AND TABLE_NAME IN ('studios','studio_bookings')
     AND REFERENCED_TABLE_NAME IS NOT NULL;

4. INDICI su entrambe le tabelle
   SHOW INDEX FROM studios;
   SHOW INDEX FROM studio_bookings;

5. TABELLE CORRELATE — verifica esistenza
   SELECT TABLE_NAME FROM information_schema.TABLES
   WHERE TABLE_SCHEMA = 'stargem_v2'
     AND TABLE_NAME IN (
       'rental_pricing','rental_contracts','booking_service_categories',
       'booking_services','price_matrix','rental_categories'
     );

6. PAGAMENTI collegati agli affitti
   SHOW COLUMNS FROM payments LIKE '%booking%';

────────────────────────────────────────
STOP — riporta tutti i risultati a Gaetano.
Non eseguire nessuna modifica. Attendi "vai".
────────────────────────────────────────
```

---

## 5. TABELLE DB TOCCATE

| Tabella | Operazione | Stato |
|---------|-----------|-------|
| `studios` | Solo letta (audit pianificato) | ⬜ |
| `studio_bookings` | Solo letta (audit pianificato) | ⬜ |
| `rental_pricing` | Da creare (probabile) | ⬜ |
| `rental_contracts` | Da creare (probabile) | ⬜ |

**Nessuna modifica al DB è stata eseguita in questa chat.**

---

## 6. DECISIONI ARCHITETTURALI PRESE

1. **BookGem rimane dominio separato** da Gemdario/STI. Non si mischia con i corsi.
2. **Affittuari non tesserati sono ammessi** (medici, B2B esterni) — confermato da classificazione utenti Geos SSDRL.
3. **Il listino prezzi va configurato da UI** — non hardcoded nel codice.
4. **I contratti ricorrenti** sono una necessità (affitti mensili, accordi multi-mese con medici e altri).
5. **L'integrazione con `payments`** deve essere strutturata, non solo checkbox "Pagato Sì/No".
6. **Prima di qualsiasi ALTER:** eseguire F1-001 audit e aspettare output reale da AG.

---

## 7. STATO FINALE CHAT

```
Stato:              🔴 Da iniziare
Ultimo protocollo:  F1-000 (nessuno eseguito) / F2-000
Tabelle DB toccate: nessuna
Pendenti:           Eseguire F1-001 audit in nuova sessione chat
```

---

## 8. ISTRUZIONI PER LA PROSSIMA SESSIONE

Quando riapri questa chat (o ne crei una nuova per BookGem):

1. Carica questo RECAP nel Progetto Claude
2. Carica MASTER_STATUS.md aggiornato
3. La prima cosa da fare è inviare ad **AG-BACKEND** il testo F1-001 contenuto nella sezione 4 di questo RECAP
4. Aspetta l'output di AG prima di qualsiasi altra azione
5. Sulla base dell'audit reale, Claude emetterà F1-002 con le ALTER chirurgiche

---

## 9. CHAT CORRELATE

| Chat | Relazione |
|------|-----------|
| Chat_MedGem | Affitto studio medico: caso specifico di BookGem. Calendari separati ma correlati |
| Chat Quote e Promo ✅ | `price_matrix` già presente — valutare riuso per listino affitti |
| Chat_06_Contabilità | Integrazione pagamenti affitti con prima nota |
| Chat_GemPass | Gestione tesserati vs non tesserati che affittano |
| Chat_Gemdario | Feed affitti nel calendario principale (colore `#374151`) |
