# RECAP — 20_MerchSG
> **Chat:** 20_MerchSG — Merchandising Studio Gem
> **Data creazione RECAP:** 05/05/2026
> **Stato:** 🔴 Da iniziare — F1-001 / F2-001 non ancora emessi
> **Scopo:** Gestione merchandising Studio GEM (abbigliamento Adidas/Freddy, accessori, costumi show, ecc.)

---

## 1. STATO MASTER_STATUS

```
## 20_MerchSG — aggiornato 05/05/2026
Stato: 🔴 Da iniziare
Ultimo protocollo: F1-001 / F2-001 (non ancora eseguiti)
Tabelle DB toccate: nessuna
Pendenti: audit stato attuale → poi F1-002 schema tabelle → poi F2-001 UI
```

---

## 2. CONTESTO BUSINESS

Studio GEM vende merchandising fisico in sede e (in futuro) online via WooCommerce:
- Abbigliamento con brand Adidas / Freddy
- Accessori (borse, calzini, ecc.)
- Costumi show (esibizioni, saggi)
- Possibile espansione: integratori, acqua (Buvette), gadget SG

La sezione Merchandising è riconosciuta come **attività ufficiale** nel sistema STI, con la sua rotta canonica `/attivita/merchandising` e il colore dedicato nella sidebar. Al momento è però solo uno stub placeholder senza backend operativo.

---

## 3. STATO ATTUALE NEL CODEBASE

### 3.1 Cosa esiste già

| Elemento | Stato | Note |
|----------|-------|------|
| `merchandising_categories` | ✅ Esiste in DB | Albero categorie (padre/figlio) |
| `/api/merch-cat.*` | ✅ Attiva | CRUD categorie |
| `MerchandisingCategories` | ✅ Componente canonico | 6 tab completi |
| `/categorie-merchandising` | ✅ Route canonica | Componente attivo |
| `/attivita/merchandising` | ⚠️ Stub | `StubMerchandising` — solo wrapper |
| `company_agreements` | ✅ Esiste | 11 convenzioni — già prevista applicazione a Merch |
| `payments` | ✅ Hub centrale | Ogni vendita merch dovrà passare per qui |

### 3.2 Cosa NON esiste

| Elemento | Note |
|----------|------|
| `inventory_items` | Mai creata — catalogo prodotti |
| `inventory_variants` | Mai creata — taglie/colori per prodotto |
| `stock_movements` | Mai creata — movimenti magazzino |
| `merch_orders` | Mai creata — ordini in sede / online |
| Route API prodotti | Nessuna oltre le categorie |
| UI Merchandising operativa | Solo stub/placeholder |

### 3.3 Posizione nel progetto

- Trattata in documenti come "**Buvette & POS commerciale**" nella mappa ecosistema (Fase 2)
- `inventory_items` e `stock_movements` citate nel documento `00_Analisi_Database.md` come tabelle future per "Buvette, Scorte & POS"
- Nessun RECAP precedente — questa è la **prima sessione** della chat 20_MerchSG

---

## 4. ARCHITETTURA PROPOSTA — DECISIONI PRESE IN ANALISI

> ⚠️ Queste decisioni sono state elaborate in Chat Analisi come proposta. Non sono ancora state validate da AG-BACKEND con un audit reale. Il F1-001 (audit) deve essere eseguito prima di confermare qualsiasi schema.

### 4.1 Tabelle DB da creare (4 nuove)

```
inventory_items
  id              INT PK AUTO_INCREMENT
  sku             VARCHAR(100) UNIQUE
  name            VARCHAR(255)
  description     TEXT NULL
  category_id     INT FK → merchandising_categories.id
  supplier        VARCHAR(255) NULL     (es. "Adidas", "Freddy")
  base_price      DECIMAL(10,2)
  sale_price      DECIMAL(10,2) NULL
  active          BOOLEAN DEFAULT TRUE
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

inventory_variants
  id              INT PK AUTO_INCREMENT
  product_id      INT FK → inventory_items.id
  size            VARCHAR(20) NULL       (XS, S, M, L, XL, XXL, 36, 38, ecc.)
  color           VARCHAR(50) NULL
  barcode         VARCHAR(100) UNIQUE NULL
  stock_qty       INT DEFAULT 0
  low_stock_alert INT DEFAULT 3          (soglia alert sotto-scorta)
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

stock_movements
  id              INT PK AUTO_INCREMENT
  variant_id      INT FK → inventory_variants.id
  movement_type   ENUM('CARICO','VENDITA','RESO','RETTIFICA','SCARICO')
  qty             INT                    (positivo = entrata, negativo = uscita)
  notes           VARCHAR(500) NULL
  ref_payment_id  INT NULL FK → payments.id   ← per vendite collegate a cassa
  ref_order_id    INT NULL FK → merch_orders.id
  operator_id     VARCHAR(255) NULL FK → users.id
  created_at      TIMESTAMP

merch_orders
  id              INT PK AUTO_INCREMENT
  member_id       INT NULL FK → members.id    (NULL = cliente esterno)
  channel         ENUM('SEDE','WOOCOMMERCE','ALTRO')
  status          ENUM('COMPLETATO','RESO','ANNULLATO') DEFAULT 'COMPLETATO'
  total_amount    DECIMAL(10,2)
  payment_id      INT NULL FK → payments.id
  woo_order_id    INT NULL                    (per sync WooCommerce futuro)
  notes           TEXT NULL
  created_at      TIMESTAMP
  updated_at      TIMESTAMP
```

### 4.2 Colonna FK da aggiungere a `payments`

```sql
-- payments già ha 12 colonne di riferimento (enrollment_id, ws_enroll_id, booking_id, ecc.)
-- Si aggiunge la 13ª per il merchandising:
ALTER TABLE payments ADD COLUMN merch_order_id INT NULL;
-- ⚠️ Verificare prima con AG-BACKEND che questa colonna non esista già
```

### 4.3 Route API da creare (F1-002)

```
GET    /api/merch/products           → lista prodotti con varianti e stock
POST   /api/merch/products           → crea prodotto
PATCH  /api/merch/products/:id       → modifica prodotto
GET    /api/merch/variants           → varianti di un prodotto
POST   /api/merch/variants           → crea variante
PATCH  /api/merch/variants/:id       → modifica variante (incluso stock)
GET    /api/merch/stock              → stock corrente tutti i prodotti
POST   /api/merch/stock/movement     → registra movimento manuale
POST   /api/merch/sell               → POS rapido: crea merch_order + payment + stock_movement ATOMICAMENTE
GET    /api/merch/orders             → storico ordini
```

### 4.4 UI — 5 Tab per `/attivita/merchandising` (F2-001)

| Tab | Titolo | Contenuto |
|-----|--------|-----------|
| 1 | Catalogo Prodotti | Lista card prodotti · Modale nuovo prodotto · Gestione varianti taglie/colori |
| 2 | Magazzino | Stock corrente · Badge rosso sotto-soglia · Form rettifica manuale |
| 3 | Vendita in Sede (POS) | Form POS rapido · Selezione prodotto+variante · Calcolo totale · Aggancio a payments |
| 4 | Ordini Online | Feed ordini WooCommerce (webhook già infrastruttura presente) |
| 5 | Report / Statistiche | Venduto per periodo · Prodotti più venduti · Valore magazzino |

---

## 5. PROMPT F1-001 — PRONTO MA NON ANCORA INVIATO

Il seguente prompt è stato preparato e deve essere inviato ad AG-BACKEND come **prima azione** della chat:

```
PER AG-F1 (BACKEND)

Sei AG-BACKEND nel progetto StarGem Suite.

PRIMA AZIONE OBBLIGATORIA: leggi
- _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md
- _GAE_SVILUPPO/_CLAUDE/03_recap_chat/RECAP_20_MerchSG.md
Poi procedi.

▶ F1-PROTOCOLLO-001 — AUDIT MERCH SG (solo SELECT/SHOW, zero modifiche)

Esegui le seguenti query di ricognizione e riportami i risultati ESATTI:

-- 1. Struttura tabella merchandising_categories
SHOW CREATE TABLE merchandising_categories;

-- 2. Quante righe ci sono?
SELECT COUNT(*) as tot FROM merchandising_categories;

-- 3. Le tabelle inventory_items, stock_movements esistono?
SELECT TABLE_NAME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'stargem_v2'
  AND TABLE_NAME IN ('inventory_items', 'stock_movements', 'inventory_variants', 'merch_orders', 'merch_sales');

-- 4. Struttura payments: cerca colonne merch-related
SHOW COLUMNS FROM payments LIKE '%merch%';

-- 5. Tutti i campi di payments (per sapere la numerazione FK attuale)
SHOW COLUMNS FROM payments;

-- 6. company_agreements: ha campo per merch?
SHOW COLUMNS FROM company_agreements;

-- 7. Tutte le tabelle con "merch" nel nome
SELECT TABLE_NAME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'stargem_v2'
  AND TABLE_NAME LIKE '%merch%';

-- 8. Route attive: cerca riferimenti a merchandising nel backend
grep -r "merchandising" /var/www/stargem/server/routes.ts | head -20

-- 9. Schema Drizzle: cerca definizioni merch
grep -r "merchandising\|inventory_items\|stock_movements\|merch_order" /var/www/stargem/shared/schema.ts | head -30

-- 10. Componente frontend stub
ls /var/www/stargem/client/src/pages/ | grep -i merch

Stop qui. Riportami TUTTI i risultati prima di procedere.

✅ F1-PROTOCOLLO-001 completato quando tutti i risultati sono riportati.
Prossimo atteso: F1-PROTOCOLLO-002 (design tabelle — dopo approvazione PM)
```

---

## 6. SEQUENZA PROTOCOLLI PREVISTA

```
F1-001  Audit stato attuale DB e codebase (PRONTO, da inviare)
        ↓ risultati → Claude valuta con Gaetano
F1-002  CREATE tabelle: inventory_items, inventory_variants,
        stock_movements, merch_orders
        ALTER payments ADD merch_order_id
        Aggiornamento shared/schema.ts
        ⚠️ BACKUP obbligatorio prima

F2-001  Scaffold /attivita/merchandising — 5 tab placeholder
        Sostituzione StubMerchandising con componente reale

F1-003  Route API: prodotti, varianti, stock, POS sell
        (dopo che F2-001 ha confermato la struttura UI)

F2-002  Tab 1 Catalogo — lista prodotti + modale nuovo prodotto

F2-003  Tab 2 Magazzino — stock corrente + alert sotto-soglia

F2-004  Tab 3 POS Sede — vendita rapida agganciata a payments

F2-005  Tab 4 Ordini Online + Tab 5 Report

F1-004 / F2-006  Test E2E + seed dati prodotti reali
```

---

## 7. INTEGRAZIONI CON ALTRI MODULI

| Modulo | Integrazione | Stato |
|--------|-------------|-------|
| `payments` | Ogni vendita merch crea un record in payments | Architettura decisa, non implementata |
| WooCommerce | Ordini online via webhook (infrastruttura già presente da Quote&Promo) | Da implementare in Tab 4 |
| GemPass / members | Vendite associate a member_id opzionale | Previsto in merch_orders |
| company_agreements | Sconti aziendali applicabili a merch | Verificare in F1-001 |
| Quote & Promo / pricing_rules | Promo e sconti su prodotti | Fase futura |

---

## 8. VINCOLI E REGOLE DA RISPETTARE

- `payments` → MAI DROP, solo ADD COLUMN
- Prima di ogni DROP: COUNT=0 + grep codice + nessuna route attiva
- Backup obbligatorio dopo ogni F1 che modifica il DB
- AG-BACKEND propone, Claude valuta con Gaetano → poi VAI
- Ogni vendita merch **deve** passare per `payments` (hub centrale contabilità)
- `merchandising_categories` esistente → non toccare struttura, solo leggere

---

## 9. FILE CORRELATI NEL PROGETTO

- `MASTER_STATUS.md` — stato globale (sezione 20_MerchSG aggiornata)
- `ANALISI_MASTER.md` — architettura identità digitale e regole DB
- `00_Analisi_Database.md` — mappa moduli, cita inventory_items e stock_movements
- `00A_GAE_ULTIMI_AGGIORNAMENTI.md` — nessuna voce MerchSG ancora
- `00B_GAE_Checklist_Operativa.md` — nessuna voce MerchSG ancora
- `02_Frontend_UI_e_Routing.md` — conferma StubMerchandising su `/attivita/merchandising`
- `03_Moduli_Operativi_e_Calendario.md` — mappa campo UI Merchandising (solo categorie, "Stub/Incompleta")

---

## 10. PROSSIMA SESSIONE — DA FARE SUBITO

1. **Inviare F1-001** ad AG-BACKEND (testo pronto in sezione 5)
2. **Attendere risultati audit** — poi valutare con Gaetano
3. **Emettere F1-002** (CREATE tabelle) solo dopo conferma schema
4. **Non toccare nulla** prima dell'audit — lo stato reale del DB potrebbe differire dall'analisi

---

*RECAP generato il 05/05/2026 — Chat Analisi / 20_MerchSG*
*Nessun protocollo ancora eseguito in questa chat.*
