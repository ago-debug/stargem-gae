# RECAP_01_Quote_e_Promozioni
> Chat StarGem Suite — Modulo Quote & Promo + Pagamenti Omnichannel
> Periodo: 09/04/2026 → 14/04/2026
> Stato finale: 🟡 Fase 1 completata · Fase 2 da fare (F1-015)

---

## 1. OBIETTIVO DELLA CHAT

Costruire il modulo "Quote e Promo" di StarGem come hub centrale per:
- Gestione listini, sconti, carnet, accordi maestri
- Integrazione pagamenti online (WooCommerce → StarGem)
- Struttura contabile base (prima nota, centri di costo)
- Piano strategico per la sincronizzazione bidirezionale WooCommerce ↔ StarGem

---

## 2. PROTOCOLLI ESEGUITI

### Backend F1 (001 → 014)
| Proto | Task | Stato |
|-------|------|-------|
| F1-001 | Audit DB iniziale — struttura tabelle esistenti | ✅ |
| F1-002 | Audit frontend — pagine /listini, /promo-sconti esistenti | ✅ |
| F1-003 | DB cleanup (12 silo droppati) + 10 nuove tabelle + seed | ✅ |
| F1-004 | Endpoint API modulo Quote e Promo (20+ endpoint) | ✅ |
| F1-005 | Seed codici promo reali (50 codici) + accordi maestri | ✅ |
| F1-006 | Fix anomalie: codice DIREZIONE20 duplicato + 3 istruttori mancanti | ✅ |
| F1-007 | Sistema agevolazioni completo (member_discounts, company_agreements, staff_rates) | ✅ |
| F1-008 | Completamento carnet: 5 wallet_types nuovi, pricing_rules, price_matrix seed | ✅ |
| F1-009 | Endpoint suggest prezzo + checkout atomico + source su payments | ✅ |
| F1-010 | Audit sistema stagioni (seasons, accounting_periods) | ✅ |
| F1-011 | Fix accounting_periods.season_id + filtri stagione su tutti gli endpoint | ✅ |
| F1-012 | Endpoint /suggest, /full-catalog, /calculate, /complete con prezzi reali | ✅ |
| F1-013 | Webhook base WooCommerce+Stripe + webhook_logs + campi pending su enrollments | ✅ |
| F1-014 | Processore webhook WooCommerce reale (idempotente, crea payment+enrollment auto) | ✅ |

### Frontend F2 (001 → 011)
| Proto | Task | Stato |
|-------|------|-------|
| F2-001 | Audit frontend pagine prezzi esistenti | ✅ |
| F2-002 | Pagina /quote-promo base con 5 tab | ✅ |
| F2-003 | Integrazione API reali + fix listino embeddato (embeddedMode) | ✅ |
| F2-004 | Legacy cleanup: redirect /listini → /quote-promo, fix TypeScript | ✅ |
| F2-005 | UI completamento: Tab 6 Convenzioni, PriceTag, NewCarnet, toggle listino | ✅ |
| F2-006 | Fix sidebar (CONFIGURAZIONI → AMMINISTRAZIONE E CASSA) + crash pagina bianca | ✅ |
| F2-007 | Fix instructors?.map crash (struttura risposta API members) | ✅ |
| F2-008 | SeasonSelector riutilizzabile + hook use-season-auto-generate | ✅ |
| F2-009 | Hook usePriceFromMatrix + useCheckoutCalculator + PriceTag + AccordiTab ridisegnato | ✅ |
| F2-010 | Tab 7 Pagamenti Online + badge dashboard + /webhook-status + /wc-mapping | ✅ |
| F2-011 | UI webhook retry + completamento iscrizioni online + wc-mapping CRUD | ✅ |

### Audit eseguiti
- `AUDIT-WC-OUT-001` — emesso, in attesa risposta (da eseguire in Fase 2)

---

## 3. DATABASE — MODIFICHE COMPLETE

### Tabelle nuove create (18)
```
MODULO QUOTE E PROMO:
  promo_rules          — 50 codici sconto con approved_by
  welfare_providers    — Fitprime, Wellhub, Pellegrini, Wai
  carnet_wallets       — portafogli pacchetti (lezioni/affitti)
  carnet_sessions      — sessioni usate (fix denormalizzazione Excel)
  instructor_agreements — 9 accordi maestri (flat/variabile/pack ore)
  agreement_monthly_overrides — override mesi (es. Filly: set300/dic400/gen450)
  pagodil_tiers        — 3 scaglioni fee: 0-350=25€, 350-1000=50€, 1000-1500=100€

SISTEMA AGEVOLAZIONI:
  member_discounts     — registro agevolazioni per persona
  company_agreements   — 11 convenzioni aziende/enti
  staff_rates          — 3 tariffe staff (allenamento 150€/anno, corso insegnanti 150€, WS -20%)

PREZZI DINAMICI:
  pricing_rules        — 7 regole (+5€ dal 3° allievo, 11a ora omaggio, domicilio +10€, ecc.)
  price_matrix         — 22+ prezzi con validità mensile per categoria

CONTABILITÀ BASE:
  cost_centers         — 7 centri (CORSI, AFFITTI, PRIVATI, TESSERE, ACCORDI, WELFARE, PROMO)
  accounting_periods   — 30 periodi (3 stagioni × 10 mesi: 24-25, 25-26, 26-27)
  journal_entries      — prima nota automatica per ogni payment

PAGAMENTI ONLINE:
  webhook_logs         — log webhook WooCommerce e Stripe
  wc_product_mapping   — mapping prodotti WC → categorie StarGem (8 righe base)
```

### Tabelle estese (ADD COLUMN, mai DROP)
```
payments:
  + accounting_code VARCHAR(20)    — es. "4010-RicaviCorsi"
  + vat_code VARCHAR(10)           — ESENTE|IVA22|IVA10
  + cost_center_code VARCHAR(50)   — CORSI|AFFITTI|PRIVATI|ecc.
  + source VARCHAR(20)             — sede|online|webhook_woocommerce|webhook_stripe

carnet_wallets:
  + group_size TINYINT             — numero allievi (1=singola, 2=coppia, 3+=gruppo)
  + location_type VARCHAR(30)      — in_sede|domicilio|studio_personal
  + price_per_unit DECIMAL(8,2)    — prezzo singola unità storico
  + total_paid DECIMAL(8,2)        — totale pagato per il carnet
  + bonus_units TINYINT            — unità omaggio (es. 11a ora affitti)

enrollments:
  + online_source BOOLEAN          — true se da webhook
  + pending_medical_cert BOOLEAN   — certificato medico mancante
  + pending_membership BOOLEAN     — tessera da completare in sede
  + completion_notes TEXT          — note per la segreteria

promo_rules (estesa):
  + approved_by VARCHAR(50)        — Direzione|Elisa|Gaetano|Auto|Staff
  + internal_notes TEXT            — motivazione interna del codice
```

### Tabelle droppate (12 silo legacy)
```
ws_attendances, ws_cats, rec_cats, sun_cats, vac_cats, ca_cats
workshops (3 record → migrati in courses)
free_trials (3 record → migrati)
paid_trials (3 record → migrati)
single_lessons (1 record → migrato)
campus_activities (2 record → migrati)
vacation_studies (1 record → migrato)
```

### Dati seed inseriti
```
50 codici promo con approved_by:
  Stagionali: 2526PRIMAVERA, ESTATE, AUTUNNO-ISCR/NO-ISCR,
              HALLOWEEN-ISCR/NO-ISCR, BLACKFRIDAY-ISCR/NO-ISCR,
              NEWYEAR-ISCR/NO-ISCR, SPRING-ISCR/NO-ISCR
  Aziende:    2526BOCCONI20, BICOCCA20, FORZEORDINE20, AVVALE20,
              CREDITAGRICOL20, AVV4PIANO30, DIREZIONE20/30/50, DIREZPERS20
  Staff:      2526ELISA20/30/40/50/55/70/80/100, GAE07/10/20/30,
              ESTEFANY05/10, ALEXANDRA05/10, STAFF60/70,
              VIDEO30/50/100, MASSI10, VIP75, DOPOPROVA05, GIUDITTA10

11 convenzioni aziendali (company_agreements):
  Bocconi (-20% corsi, -10% merch), Bicocca (-20%, -10%),
  UNIMI (-20%, -10%), Marangoni (-20%, -10%),
  Forze dell'Ordine (-20%, esteso a familiari),
  Poste Italiane (-20%), Credit Agricole (-20%),
  Avvale Spa (-20%, -10%), Avvocati 4° piano (-30%),
  Scuola Leonardo Da Vinci (regole speciali),
  Modulo Academy (100% gratuito, no esclusione Open)

9 accordi maestri (instructor_agreements):
  Isabel Seabra   — flat_monthly 1.350€ fattura Studio 25
  Giulio Gariano  — flat_monthly 150€ + 20€ spese Studio 05
  Yuri Salsavilca — flat_monthly 250€ + 20€ spese Studio 04
  Filly           — variable_monthly: set300/dic400/gen450/base550 Studio 22
  Mamacita        — pack_hours 20ore 350€+IVA fattura
  Jorge Avila     — pack_hours 10ore 110€
  Antonella Albano — pack_hours 10lez(1.5h) 200€
  Beatrice Carbone — pack_hours 10lez(1.5h) 200€
  Nicholas Cugge  — pack_hours 10ore 110€

4 welfare providers:
  Fitprime  — richiede tessera, 0% extra
  Wellhub   — NON richiede tessera, 0% extra
  Pellegrini — richiede tessera, +3% extra
  Wai       — richiede tessera, +7% extra

3 tariffe staff (staff_rates):
  allenamento_autonomo   — 150€/anno, Studio 1 o 2
  corso_insegnante_fisso — 150€/anno, no Aerial
  workshop_staff_discount — -20%, code: 2526WS.ST4FF20

3 scaglioni Pagodil:
  0-350€    → fee 25€, max 6 rate
  350-1000€ → fee 50€, max 6 rate
  1000-1500€ → fee 100€, max 6 rate

7 centri di costo:
  CORSI, AFFITTI, PRIVATI, TESSERE, ACCORDI, WELFARE, PROMO

30 periodi contabili:
  Stagione 24-25 (ID=3): set24→giu25
  Stagione 25-26 (ID=1, ATTIVA): set25→giu26
  Stagione 26-27 (ID=2): set26→giu27

22 prezzi in price_matrix (valori reali da Excel):
  Lezione singola 55€, coppia 75€, aerial 70€
  Pack 10 singole 500€, coppia 700€, aerial 650€
  Domicilio singola 65€, coppia 85€, pack dom. 600€/800€
  Affitto 1+1 20€/h, 1+2 25€/h, pack 10h 150€/200€
  Aerial affitto 30€/40€/h, pack 200€/300€
  Studio Personal 110€→115€ (gen26), 160€→165€

7 regole dinamiche (pricing_rules):
  +5€ dal 3° allievo (affitti)
  11a ora omaggio al completamento pack
  Sconto prova entro 7gg
  Studio Personal cambio prezzo gen2026
  Prove competizione 5h gratis (richiede autorizzazione)
  Domicilio singola +10€
  Domicilio pack +100€

9 wallet_types (custom_list):
  lezioni_singole, lezioni_coppia, lezioni_aerea,
  ore_affitto, ore_affitto_aerea,
  lezioni_domicilio_singola, lezioni_domicilio_coppia,
  ore_studio_personal, ore_affitto_mensile

8 mapping prodotti WooCommerce (wc_product_mapping):
  "1 Corso Adulti" → adulti/1/corso
  "2 Corsi Adulti" → adulti/2/corso
  "3 Corsi Adulti" → adulti/3/corso
  "1 Corso Bambini" → bambini/1/corso
  "1 Corso Aerial" → aerea/1/corso
  "1 Open Ballo" → open/1/corso
  "Pack 10 Lezioni" → carnet
  "Pack 10 Ore Affitto" → carnet
```

---

## 4. API BACKEND — ENDPOINT CREATI (60+)

### Quote e Promo
```
GET/POST/PUT/DELETE /api/promo-rules
POST /api/promo-rules/validate             — valida codice server-side
GET/PATCH /api/welfare-providers/:id
GET/POST /api/carnet-wallets
POST /api/carnet-wallets/:id/use           — scala 1 unità + crea sessione
GET /api/carnet-wallets/:id/sessions
GET/POST/PUT/DELETE /api/instructor-agreements
POST /api/instructor-agreements/:id/payment — registra pagamento mensile
GET/POST /api/pagodil-tiers
POST /api/pagodil-tiers/calculate
GET/POST/PUT/DELETE /api/cost-centers
GET /api/accounting-periods
GET/POST /api/journal-entries
GET/POST/PATCH /api/member-discounts
PATCH /api/member-discounts/:id/use
GET/POST/PATCH /api/company-agreements
GET/POST/PATCH /api/staff-rates
GET /api/pricing-rules
GET /api/pricing-rules/calculate           — calcola prezzo con regole
POST /api/lezioni-spot                     — pagamento diretto senza carnet
GET /api/lezioni-spot
```

### Prezzi e Checkout
```
GET /api/price-matrix/suggest              — prezzo suggerito per categoria/mese
GET /api/price-matrix/full-catalog         — catalogo completo stagione
POST /api/checkout/calculate               — totale con regole reali da DB
POST /api/checkout/complete                — transazione atomica
GET /api/checkout/status/:id
```

### Webhook e Online
```
POST /api/webhooks/woocommerce             — riceve ordini WC → crea payment+enrollment
POST /api/webhooks/stripe                  — riceve eventi Stripe (struttura)
GET /api/webhook-logs                      — monitoraggio
PATCH /api/webhook-logs/:id/retry         — riprocessa falliti
GET /api/enrollments/pending              — iscrizioni online incomplete
PATCH /api/enrollments/:id/complete       — completa iscrizione in sede
GET/POST/PUT/DELETE /api/wc-product-mapping
```

### Stagioni (tutti gli endpoint supportano ?seasonId=active|N)
```
Risoluzione automatica "active" → stagione con active=true nel DB
```

---

## 5. FRONTEND — COMPONENTI E PAGINE

### Pagina principale: /quote-promo (7 Tab)
```
Tab 1: Listino prezzi
  — Griglia Q1C embeddable (QuoteListini con embeddedMode prop)
  — Toggle "Vista Mensile / Vista Prezzi Base"
  — Selector tipo attività

Tab 2: Promo e convenzioni
  — Tabella 50 codici con badge targetType (public/company/staff/personal/welfare)
  — Badge "No OPEN" in rosso
  — Barra progresso utilizzi
  — CRUD via PromoRuleModal

Tab 3: Welfare
  — 4 card provider con toggle requiresMembershipFee / requiresMedicalCert
  — Campo extraFeePercent
  — Sezione Tariffe Staff sotto separator

Tab 4: Carnet attivi
  — Tabella con barra progresso (verde<70%, arancio70-90%, rosso>90%)
  — Badge scadenza semaforo
  — Dialog "Usa 1" con sessionDate/timeStart/timeEnd/instructorId
  — Pulsante "+ Nuovo Carnet" → NewCarnetDialog con prezzo auto
  — Pulsante "+ Lezione Spot" → LezioneSpotDialog

Tab 5: Accordi maestri
  — Card per maestro con stato mesi (🟢 Saldato / 🟡 Acconto / 🔴 Aperto)
  — Storico ultimi 3 pagamenti
  — Dialog "Registra Pagamento" pre-compilato per tipo accordo
  — Override automatico per accordi variabili (Filly)

Tab 6: Convenzioni aziende
  — Grid card per azienda/ente
  — Badge colorati per company_type
  — Sezione "Regole speciali" espandibile (Scuola Leonardo)
  — Collegamento al codice promo

Tab 7: Pagamenti online
  — Tabella pagamenti con source badge (Web/WooCommerce/Stripe/Sede)
  — Filtri: Tutti / Da completare / Completati
  — Dialog "Completa" checklist (certificato, tessera, documenti)
  — Colonna "Ordine WC" con ID ordine esterno
```

### Hook riutilizzabili (usare in tutte le future pagine)
```
use-season-auto-generate.ts  — auto-genera stagione futura (trigger febbraio)
use-price-from-matrix.ts     — prezzi automatici per categoria/mese
use-checkout-calculator.ts   — calcolo totale con promo e regole
```

### Componenti riutilizzabili
```
season-selector.tsx          — selector stagioni con badge "Corrente/Precedente/Futura"
price-tag.tsx                — badge prezzo con tooltip (integrato in modale pagamenti)
error-boundary.tsx           — catch crash con messaggio leggibile
new-carnet-dialog.tsx        — crea carnet con prezzo automatico
lezione-spot-dialog.tsx      — pagamento diretto lezione singola
```

### Pagine nuove
```
/webhook-status   — monitoraggio webhook (admin only)
  Contatori: Totale oggi / Processati / Falliti / In attesa
  Pulsante Retry su righe failed
  Link al payment creato

/wc-mapping       — mapping prodotti WooCommerce (admin only)
  CRUD completo per wc_product_mapping
  Selector categoria/tipo/courseCount
```

### Integrazioni su pagine esistenti
```
nuovo-pagamento-modal.tsx:
  + PriceTag accanto al campo importo (suggerimento)
  + Validazione codice promo server-side su onBlur/Enter
  + Aggiornamento totale con discountAmount da /validate

dashboard.tsx:
  + Widget "Iscrizioni da completare" (amber-50)
  + Fetch GET /api/enrollments?pending=true
  + Link → /quote-promo?tab=online

app-sidebar.tsx:
  + "Quote e Promo" spostata in AMMINISTRAZIONE E CASSA
  + "Webhook Status" (admin only) con icona Radio
  + "WC Mapping" (admin only) con icona ArrowLeftRight
  - Rimosso: "Listini e Quote" (redirect a /quote-promo)
  - Rimosso: "Promo / Sconti" (redirect a /quote-promo)
```

---

## 6. SISTEMA PAGAMENTI OMNICHANNEL

### Flusso IN SEDE
```
Operatore → Maschera Input / Modale Pagamenti
→ PriceTag suggerisce prezzo da price_matrix
→ Codice promo validato server-side
→ payments (source='sede') + journal_entries automatica
```

### Flusso ONLINE → IN SEDE (automatico)
```
Cliente → studio-jam.it / WooCommerce
→ Ordine completato → POST /api/webhooks/woocommerce
→ processWooCommerceOrder (background, idempotente)
→ member trovato/creato in members
→ payment (source='webhook_woocommerce') in transazione atomica
→ enrollment (online_source=true, pending_medical_cert=true)
→ journal_entry automatica (1010-Banca / 4010-RicaviCorsi)
→ webhook_logs aggiornato: status='processed'
→ Dashboard segreteria: badge "N iscrizioni da completare"
→ Segreteria completa in sede: PATCH /api/enrollments/:id/complete
```

### Idempotenza webhook
```
Stesso ordine WooCommerce inviato 2 volte → 
webhook_logs controlla external_id già 'processed' →
skipped silenziosamente, zero duplicati
```

---

## 7. ARCHITETTURA STRATEGICA — DECISIONI PRESE

### Opzione C Ibrida (scelta definitiva)
```
WooCommerce = VENDITA (rimane sempre lì)
StarGem = OPERATIVO (gestisce tutto post-vendita)
Integrazione = webhook + API (bidirezionale)
```

### Principio fondamentale
```
StarGem è il cervello — un solo posto per aggiornare i prezzi.
Cambio listino in StarGem → WooCommerce aggiornato automaticamente.
Online e in sede = stesso DB, stessa tabella payments.
```

### Roadmap 3 fasi (da PIANO_INTEGRAZIONE_PAGAMENTI_OMNICHANNEL.md)
```
Fase 1 (completata): Webhook WooCommerce → StarGem
  Ordini online → payment + enrollment automatici

Fase 2 (da fare — F1-015): StarGem → WooCommerce
  Corso creato in StarGem → prodotto WC creato automaticamente
  Cambio prezzo → WC aggiornato
  Sold out → WC mostra "esaurito"
  WS annullato → prodotto WC disattivato

Fase 3 (futuro): Checkout nativo StarGem
  Stripe SDK integrato
  Link pagamento WhatsApp
  Totem self-service in sede
  App mobile (API pubbliche già pronte)
```

---

## 8. FASE 2 — DA COMPLETARE (F1-015 in poi)

### Cosa manca
```
AUDIT-WC-OUT-001 emesso, risposta pendente.

Da costruire:
  - API pubblica /api/public/* con API key (rate limiting)
  - Sincronizzazione StarGem → WooCommerce REST API
    POST/PUT /wp-json/wc/v3/products
  - Tabella api_keys per gestire le chiavi pubbliche
  - Hook usePriceFromMatrix integrato in Maschera Input
  - Dashboard iscrizioni online con filtro source
  - Stripe SDK per pagamenti carta online nativi
```

### Configurazione necessaria su studio-jam.it
```
Webhook WooCommerce da configurare:
  URL: https://stargem.studio-gem.it/api/webhooks/woocommerce
  Evento: Order completed
  Segreto: da generare e mettere in .env VPS

Variabili .env da aggiungere (per Fase 2):
  WC_URL=https://studio-jam.it
  WC_CONSUMER_KEY=ck_...
  WC_CONSUMER_SECRET=cs_...
  STRIPE_SECRET_KEY=sk_...
  STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 9. BUG E FIX RISOLTI IN QUESTA CHAT

```
F2-006: crash pagina bianca /quote-promo
  Causa: differenceInDays su expiresAt null → RangeError
  Fix: ErrorBoundary + null check su expiresAt

F2-007: instructors?.map is not a function
  Causa: /api/members restituisce { members: [], total: N }
         il componente chiamava .map() direttamente sul wrapper
  Fix: const safe = rawData?.members ?? rawData?.data ?? rawData ?? []
       + Array.isArray(safe) check

Fix sidebar: "Quote e Promo" era in CONFIGURAZIONI CORE
  Spostata correttamente in AMMINISTRAZIONE E CASSA

Fix checkout prezzi hardcoded:
  Il primo /checkout/calculate usava 150/240€ hardcoded
  Sostituito con query reale su price_matrix con filtri categoria+mese
```

---

## 10. FILE DI RIFERIMENTO DATI REALI ANALIZZATI

```
quote_25_26_QUOTE_CORSI_E_AGEVOLAZIONI.xlsx
  → listino prezzi con degressività mensile
  → codici promo stagionali e aziendali
  → welfare providers con regole

LEZIONI_INDIVIDUALI_QUOTE_e_ABBONAMENTI_VENDUTI.xlsx
  → prezzi lezioni private e carnet
  → tracciamento presenze (denormalizzato → carnet_sessions)
  → scadenze: private=90gg, affitti=120gg

test_AFFITTI_e_ABBONAMENTI_QUOTE_e_ACCORDI.xlsx
  → prezzi affitti sala e aerial
  → accordi maestri con importi reali
  → regola +5€ dal 3° allievo

estrap_Master_per_importazione_Bitrix.xlsx
  → 3.576 iscritti con anagrafica completa
  → fino a 4 iscrizioni per persona (sz1-sz4)
  → codici sconto applicati
  → questo dato domani dovrà stare in StarGem (addio Bitrix)

estrap_ISCRITTI_WORKSHOP.xlsx
  → struttura iscrizioni WS: SKU, canale, quota, codice sconto
  → SKU già allineati al wc_product_mapping

workshop_2526_ISCRITTI_WORKSHOP.xlsx
  → 27 fogli (uno per WS)
  → ResocontoWS con statistiche vendite per operatrice
```

---

## 11. DOCUMENTI PRODOTTI IN QUESTA CHAT

```
PIANO_INTEGRAZIONE_PAGAMENTI_OMNICHANNEL.md
  — Strategia completa online/sede
  — Roadmap 3 fasi con tempi
  — Scenari operativi concreti
  — Sicurezza webhook (idempotenza, firma)
  — Impatto economico (Stripe vs ore segreteria)

MASTER_STATUS.md (aggiornato 09/04 e 14/04)
  — Nuovo formato a 4 campi per tutte le 21 chat
```

---

## 12. TEMPLATE AGGIORNAMENTO MASTER_STATUS

```
## 01_Quote_e_Promozioni — aggiornato 14/04/2026
Stato: 🟡 Fase 2 da fare
Ultimo protocollo: F1-014 / F2-011
Tabelle DB toccate: 18 nuove (promo_rules, welfare_providers, carnet_wallets,
  carnet_sessions, instructor_agreements, agreement_monthly_overrides,
  pagodil_tiers, member_discounts, company_agreements, staff_rates,
  pricing_rules, price_matrix, cost_centers, accounting_periods,
  journal_entries, webhook_logs, wc_product_mapping) +
  ALTER: payments (+4 col), carnet_wallets (+5 col),
  enrollments (+4 col), promo_rules (+2 col)
  DROP: 12 tabelle silo legacy
Pendenti:
  - AUDIT-WC-OUT-001 inviato ad AG-F1, risposta pendente
  - F1-015: sincronizzazione StarGem → WooCommerce (catalogo in uscita)
  - Test E2E completo con operatore reale
  - Configurare webhook su studio-jam.it verso /api/webhooks/woocommerce
  - Variabili .env VPS: WC_CONSUMER_KEY, WC_CONSUMER_SECRET
  - hook usePriceFromMatrix da integrare in Maschera Input
  - Stripe SDK (Fase 3)
```

---

*RECAP generato da Claude — Chat 01_Quote_e_Promozioni — 14/04/2026*
*Prossima sessione riparte da: F1-015 / F2-012*
