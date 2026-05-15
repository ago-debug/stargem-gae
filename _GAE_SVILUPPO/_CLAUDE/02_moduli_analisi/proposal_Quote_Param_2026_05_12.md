---
aggiornato: 2026-05-12T15:20
ultima_verifica_vs_codice: 2026-05-12 (basato su materiale storico pre-reset 11/05 — riverificare con AG)
validita_prevista: 2026-06-12
tipo: proposal-modulo
priorita: 3.5
tags: [quote-param, listino, pricing, proposal, backlog]
fonti_storiche:
  - "[[18_SCHEMA_OPERATIVO_QUOTE_PARAM_PRONTO_USO]]"
  - "[[17_PROMPT_HANDOFF_PER_NUOVA_CHAT_ANALISI_QUOTE_PARAM]]"
  - "[[16_RECAP_COMPLETO_QUOTE_PARAM_E_QUOTE_CORSI]]"
  - "[[RECAP_01_Quote_e_Promozioni]]"
  - "[[H_Piano_Integrazione_Pagamenti_Omnichannel]]"
---

# Proposal Quote_Param — Listino Parametrico

## 1. TL;DR

Quote_Param è il motore di listino parametrico di StarGem: poche righe-regola (codici tipo `AD_BDF`, `OPEN_DANZA`, `AD_AERIAL`) che generano, via formula, tutte le voci di listino vendibili — incluse le tariffe degressive per quantità ("1 corso 395€, 2 corsi 730€, ..., 15 corsi 3.675€"). Sostituisce il foglio `QUOTE_CORSI` di Studio Gem, che oggi contiene decine di righe manuali ridondanti e blocca la crescita dell'offerta. La proposta è di portare l'idea già validata su GSheet dentro StarGem come due tabelle (`price_rules` + `price_rule_tiers` o vista derivata) e un endpoint di calcolo prezzo che il Modale Pagamento e WooCommerce consumino come unica fonte di verità. Priorità #3.5, dipende dal completamento dell'audit Pagamenti (#3) e dalla decisione su `/importa`. MVP stimabile in ~2 settimane F1+F2.

## 2. Contesto e motivazione

Gaetano sta vendendo abbonamenti annuali (settembre→giugno/luglio) con una logica di **prezzo medio degressivo**: più corsi compri, meno paga ogni corso. Oggi questo è codificato a mano in un foglio Google `QUOTE_CORSI` agganciato a un `MASTER` di segreteria, con 15 righe `AD_BDF` (da 1 a 15 corsi adulti) e ognuna con il suo prezzo. Quando vuole vendere "8 corsi" o "12 corsi", deve aggiungere righe manualmente. Quando alza la quota base da 395€ a 400€, deve ricalcolare 15 prezzi a mano. Nei recap storici ha tirato fuori la formula concettuale (sezione 18_E del file [[18_SCHEMA_OPERATIVO_QUOTE_PARAM_PRONTO_USO]]):

```
prezzo_medio = MAX(prezzo_min_aggiuntivo; quota_base - ((quantità - 1) * scalino_medio))
quota_finale = quantità * prezzo_medio
```

Caso reale validato (adulti BDF, dal recap 16):

| Quantità corsi | Prezzo medio | Totale | Sconto vs lineare |
|---:|---:|---:|---:|
| 1 | 395 | 395 | 0 |
| 2 | 365 | 730 | 60 |
| 5 | 275 | 1.375 | 600 |
| 6+ | 245 | 1.470+ | 900+ |
| 15 | 245 | 3.675 | 2.250 |

Altri pattern emersi dai dati reali (CSV `quote_test_LEZIONI INDIVIDUALI`, JSON `quotes_analysis.json`):

- **Degressività mensile** ("ISCRIZIONI FATTE: settembre 1300€ → luglio 120€"): chi si iscrive a metà anno paga proporzionalmente — già presente in `course_quotes_grid` (60 record, audit F1 11/05).
- **Carnet privati con scadenza** (10 lezioni 500€, scadenza 120gg dall'acquisto): già in `carnet_wallets`.
- **Combinazioni miste** (Aerial + BDF, Open Danza + Fitness): oggi gestite come righe `FISSO` con note descrittive.
- **Tariffe staff/welfare/convenzioni**: già strutturate in `staff_rates` (3), `welfare_providers` (4), `company_agreements` (11/21 — il numero esatto in dev è 21).

Il problema vero che Quote_Param risolve è **una sola regola di prezzo invece di 15 righe ridondanti**. È la base logica anche per il futuro: stesso codice `AD_BDF` letto da Modale Pagamento in sede, dal sito WooCommerce (vedi [[H_Piano_Integrazione_Pagamenti_Omnichannel]]), e — un domani — dall'app mobile.

## 3. Stato dell'arte

> **Attenzione (Regola 16 del [[00_LEGGIMI]]):** i 3 recap principali (16, 17, 18) sono pre-reset 11/05 e descrivono un lavoro fatto su Google Sheet. Lo schema concettuale è solido e validato dall'utente; **NON è stato verificato contro lo schema Drizzle attuale**. I numeri di tabelle/record citati qui sotto vanno riconfermati con AG prima di emettere un prompt F1.

### 3.1 Già esistente nel codice (post-migrations 0012→0015)

Dall'audit F1 dell'11/05 ([[MASTER_STATUS]] §4.4 e [[D_2026_05_11_Mappa_Dati_e_Frontend_BACKEND]]):

- `course_quotes_grid` — 60 record, popolato. È la "matrice mensile" (corso × mese-iscrizione → prezzo). Funziona per la degressività temporale ma **NON ha il parametro quantità**.
- `promo_rules` — 24-50 codici sconto.
- `company_agreements` — 11-21 convenzioni aziendali.
- `staff_rates` — 3 tariffe staff.
- `welfare_providers` — 4 provider (Fitprime, Wellhub, Pellegrini, Wai).
- `carnet_wallets` — portafogli pacchetti con `group_size`, `location_type`, `price_per_unit`, `bonus_units`.
- `pricing_rules` — 7 regole dinamiche (+5€ dal 3° allievo, 11a ora omaggio, ecc.).
- `price_matrix` — 22 prezzi con validità mensile per categoria.
- Endpoint già esposti: `GET /api/course-quotes-grid`, `POST /api/checkout/calculate`, `GET /api/price-matrix/suggest`, `POST /api/promo-rules/validate`.
- Frontend: `/quote-promo` con 7 tab, hook `usePriceFromMatrix`, `useCheckoutCalculator`, componente `PriceTag`.

### 3.2 Cosa manca (gap rispetto alla visione storica Quote_Param)

1. **Manca la tabella "regola di prezzo parametrica"**: oggi `course_quotes_grid` è ancora una tabella **estensiva** (una riga per ogni combinazione corso-mese). Quote_Param propone una tabella **intensiva** (una riga-regola che genera N righe via formula).
2. **Manca il campo `tipo_calcolo`** (`FISSO` / `PROGRESSIVO_MEDIO` / `SCAGLIONI` / `COMBINATO`) e i parametri associati (`quota_base`, `scalino_medio`, `prezzo_min_aggiuntivo`, `qta_max`).
3. **Manca l'endpoint che calcola "dammi il prezzo di N corsi tipo X"** restituendo `{prezzo_unitario, totale, sconto_progressivo}`.
4. **Manca la UI di gestione delle regole di prezzo** — oggi `/quote-promo` mostra il listino ma non permette di modificare la formula. Va costruita o estesa.

### 3.3 Allineamento con architettura attuale

L'idea originale Quote_Param era pensata per GSheet (formule `=SE.ERRORE(INDICE(...))`). Trasferendola su Drizzle/MariaDB, il modello cambia: la "vista QUOTE_CORSI" diventa un **endpoint di calcolo** invocato a runtime, non una tabella materializzata. Ma il modello dati di base (codice + tipo_calcolo + parametri formula) resta valido così com'è.

## 4. Modello dati proposto

> Tutte le tabelle nuove devono includere `tenant_id VARCHAR(50) NOT NULL DEFAULT '1'` con UNIQUE composite (Regola 13 del [[00_LEGGIMI]]).

### Tabella `price_rules` (nuova)

La tabella sorgente delle regole parametriche. Una riga = una regola.

| Campo | Tipo | Note |
|---|---|---|
| `id` | bigint PK | autoincrement |
| `tenant_id` | varchar(50) | default `'1'` |
| `season_id` | int FK seasons | regola valida per stagione |
| `code` | varchar(64) | es. `AD_BDF`, `OPEN_DANZA` — UNIQUE(tenant_id, season_id, code) |
| `description_base` | varchar(255) | es. `ADULTI`, `OPEN DANZA` |
| `category` | varchar(64) | `OPEN`, `DANZA_BALLO_FITNESS`, `AERIAL`, `BAMBINI`, `MIX`, `PROVA`, `TESSERA`, `STAFF` |
| `age_band` | varchar(64) nullable | `ADULTI`, `DAI_6_AI_12`, `DAI_13_AI_17` |
| `days_constraint` | varchar(64) nullable | `TUTTI`, `VEN_SAB`, ecc. |
| `time_slot_constraint` | varchar(64) nullable | `FINO_ALLE_14`, ecc. |
| `period_label` | varchar(64) | `Settembre-luglio`, `1 mese`, `Quadrimestre`, `Annuale` |
| `base_amount` | decimal(8,2) | quota base (prezzo fisso o prezzo 1° corso) |
| `calc_type` | enum | `FISSO`, `PROGRESSIVO_MEDIO`, `SCAGLIONI`, `COMBINATO` |
| `max_quantity` | smallint default 1 | per progressivi/scaglioni |
| `min_unit_amount` | decimal(8,2) nullable | prezzo medio minimo (PROGRESSIVO_MEDIO) |
| `step_reduction` | decimal(8,2) default 0 | scalino di riduzione (PROGRESSIVO_MEDIO) |
| `same_group_discount_pct` | decimal(5,2) nullable | informativo, futuro |
| `different_group_discount_pct` | decimal(5,2) nullable | informativo, futuro |
| `notes` | text nullable | note operative |
| `active` | boolean default true | |
| `created_at`/`updated_at` | timestamp | |

UNIQUE: `(tenant_id, season_id, code)`.

### Tabella `price_rule_tiers` (nuova, opzionale — solo per `SCAGLIONI`)

Per i casi non lineari (bambini: 1 corso 370, 2 corsi 690, 3 corsi 990).

| Campo | Tipo | Note |
|---|---|---|
| `id` | bigint PK | |
| `tenant_id` | varchar(50) | default `'1'` |
| `price_rule_id` | bigint FK price_rules | |
| `quantity` | smallint | |
| `total_amount` | decimal(8,2) | prezzo totale per quella quantità |

UNIQUE: `(tenant_id, price_rule_id, quantity)`.

### Tabella `price_rule_components` (nuova, opzionale — solo per `COMBINATO`)

Per i mix tipo `MIX_1AERIAL_1BDF`: una regola padre + N componenti.

| Campo | Tipo | Note |
|---|---|---|
| `id` | bigint PK | |
| `tenant_id` | varchar(50) | default `'1'` |
| `parent_rule_id` | bigint FK price_rules | regola padre `COMBINATO` |
| `component_rule_id` | bigint FK price_rules | regola figlio inclusa |
| `component_quantity` | smallint default 1 | |
| `discount_override_amount` | decimal(8,2) nullable | sconto fisso applicato alla combinazione |

### Relazioni con tabelle esistenti

- `price_rules.season_id` → `seasons.id` (le quote sono per stagione, conferma audit 11/05).
- `course_quotes_grid` può **restare** come tabella di lookup mensile per la degressività temporale, o essere progressivamente sostituita da una formula nel `price_rules` esteso con `monthly_decay` (decisione di prodotto — sezione 9).
- Lato `payments`/`enrollments`/`memberships`: nessuna modifica strutturale richiesta. Il payment continua ad avere `amount`, `priceRuleCode` (campo nuovo opzionale per audit/contabilità) e source.
- Lato `members`: nessuna modifica.

### Non toccare (Regola DB)

- `payments`: solo ADD COLUMN se serve `price_rule_code VARCHAR(64)` per tracciabilità.
- `members`, `courses`, `enrollments`: zero modifiche schema in questa fase.
- 3 SKU storico intoccabili: `2526QUOTATESSERA`, `2526DTYURI`, `2526DTNELLA` — vanno preservati come codici in `price_rules`.

## 5. Architettura backend proposta

### Endpoint chiave (signature concettuale)

| Endpoint | Scopo | Note |
|---|---|---|
| `GET /api/price-rules?seasonId=active&category=...` | Lista regole filtrabile | Tab listino |
| `POST /api/price-rules` | Crea nuova regola | Admin only |
| `PATCH /api/price-rules/:id` | Edit regola (con validazione su season attiva) | Admin only |
| `DELETE /api/price-rules/:id` | Soft delete (set `active=false`) | Mai DROP |
| `POST /api/price-rules/:id/quote` | **Calcolo prezzo dato quantità** → `{unit_price, total, discount, breakdown[]}` | Cuore del modulo |
| `POST /api/price-rules/expand-catalog?seasonId=...` | Genera tutte le righe-vista (1 corso, 2 corsi, ...) come fa oggi QUOTE_CORSI | Per UI listino e per export verso WooCommerce |
| `GET /api/price-rules/:id/preview-tiers` | Tabella prezzo medio per quantità 1..max | Per preview UI |

### Validazioni server-side

- Tenant ID enforced via middleware (Regola 13).
- Su `POST /quote`: validare che `quantity <= max_quantity`; rifiutare se attivo `active=false`.
- Su `PATCH`: bloccare modifiche su regole referenziate da `payments` della stagione corrente (rischio invalidare storico) — proporre invece versioning (crea nuova regola, disattiva la vecchia).
- Idempotenza: `price-rules` ha solo PK numerica, non server-generated IDs; nessun problema di duplicati.

### Punto di integrazione con il checkout

`POST /api/checkout/calculate` (già esistente) deve accettare `priceRuleCode` + `quantity` come input invece di — o accanto a — l'attuale `categoria + mese`. Il backend chiama internamente `POST /api/price-rules/:id/quote`, poi applica i layer aggiuntivi (promo, welfare, convenzioni, pricing_rules dinamiche). L'output finale resta lo stesso (`{total, discountAmount, finalAmount, breakdown}`).

### Migrazione iniziale

Migration `0016_price_rules_parametric.sql`:
- CREATE TABLE `price_rules`, `price_rule_tiers`, `price_rule_components`.
- ALTER `payments` ADD COLUMN `price_rule_code VARCHAR(64) NULL` (opzionale ma consigliato).
- Seed iniziale: ~40 regole estratte dal materiale storico (sezione 16_N del recap), validate da Gaetano prima del seed reale.

## 6. Architettura frontend proposta

### Pagina `/quote-promo` (esistente, da estendere)

Aggiungere **Tab 0 "Regole prezzo"** (prima della Tab 1 "Listino prezzi"):
- Tabella `price_rules` filtrata per stagione/categoria, con badge `calc_type`.
- Pulsante "+ Nuova Regola" → modale `PriceRuleEditor` con form dinamico in base a `calc_type` (campi `step_reduction`, `min_unit_amount` visibili solo se `PROGRESSIVO_MEDIO`).
- Per ogni riga: pulsante "Anteprima" che apre un drawer con la tabella generata (1..max corsi con prezzo medio e totale) — replica visuale dello stato 18_F del recap storico.
- Pulsante "Anteprima listino" globale → mostra `Copia di QUOTE_CORSI` come tabella read-only, generata client-side da `POST /api/price-rules/expand-catalog`.

### Tab 1 "Listino prezzi" (esistente)

Va riconnesso al nuovo modello: invece di leggere `course_quotes_grid` riga per riga, invoca `expand-catalog` per ottenere le righe espanse. La UX rimane identica per la segreteria (compatibilità garantita).

### Componenti shadcn/ui richiesti

- `PriceRuleEditor.tsx` — form modale con `react-hook-form` + Zod, campi condizionali per `calc_type`.
- `PriceRuleTierTable.tsx` — tabella di anteprima quantità → prezzo.
- `PriceRuleSelector.tsx` — combobox tipizzato (codice + descrizione) da usare in `nuovo-pagamento-modal.tsx` accanto al campo importo. Sostituisce/affianca l'attuale flusso "categoria + mese".

### Store Zustand

Nuovo slice `priceRulesStore` (analogo a `mascheraStore` del refactor Anagrafica Step 1):
- `rules: PriceRule[]`, `loading`, `selectedRule`, azioni CRUD ottimistiche.
- Cache invalidata via `react-query` su `seasonId` change.

### Hook riutilizzabili

- `usePriceQuote(ruleCode, quantity)` → wrapper `POST /api/price-rules/.../quote` con caching.
- Estensione `useCheckoutCalculator` per accettare `priceRuleCode` invece di `categoryHardcoded`.

### Modale Pagamento

`nuovo-pagamento-modal.tsx` (già blindata readOnly su importo): l'operatore sceglie `PriceRuleSelector` + quantità, l'importo si auto-compila chiamando `usePriceQuote`. Resta vietato modificare l'importo a mano. PriceTag mostra il breakdown (`1 corso 395€ → 3 corsi 1.005€ — 180€ riduzione`).

## 7. Roadmap a fasi

### MVP (Fase 1) — ~2 settimane F1+F2

Obiettivo: gestione regole + calcolo prezzo + integrazione modale pagamento in sede.

- F1: migration `0016`, endpoint CRUD `price_rules`, endpoint `/quote` e `/expand-catalog`, seed iniziale ~40 regole dal recap storico.
- F2: Tab 0 in `/quote-promo` con CRUD regole, `PriceRuleSelector` integrato in modale pagamento, sostituzione interna di `Tab 1` da `course_quotes_grid` a `expand-catalog`.
- Acceptance: la segreteria può creare/modificare una regola `AD_BDF` e vedere immediatamente il prezzo di "8 corsi adulti" nel modale pagamento, senza toccare 15 righe a mano.

### Fase 2 — ~1 settimana

- Versioning regole (immutability su regole referenziate da payments della stagione attiva).
- Supporto `SCAGLIONI` reale (tabella `price_rule_tiers` + editor).
- Supporto `COMBINATO` reale (tabella `price_rule_components` + editor per i 4 codici `MIX_*`).
- Export verso WooCommerce: endpoint `GET /api/public/price-rules-catalog` (con API key) → JSON consumato dal plugin WC per aggiornare prodotti.

### Fase 3 — backlog lontano

- Sincronizzazione `course_quotes_grid` ↔ `price_rules` (decisione architetturale: tenerle entrambe o deprecare la grid).
- Versione SaaS multi-tenant: `tenant_id` già pronto da Fase 1.
- Calculator pubblico front-site (preventivatore in tempo reale).

## 8. Dipendenze e rischi

### Dipendenze (cosa serve prima di partire)

| Dipendenza | Stato | Bloccante? |
|---|---|---|
| Audit Pagamenti F1+F2 (priorità #3 di [[CHECKLIST_PROGETTO]]) | non ancora avviato | Sì, almeno parziale: serve sapere come `nuovo-pagamento-modal` legge oggi i prezzi |
| Re-import members/memberships/payments | in attesa Gaetano | No (Quote_Param non dipende dai dati anagrafici) |
| Decisione STRADA A/B/A+B su `/importa` | aperta dal 04/05 | No (è ortogonale al listino) |
| Refactor Anagrafica Step 2+3 (F2-003, F2-004) | in corso | No |

### Rischi tecnici

- **Concorrenza con `course_quotes_grid`**: due fonti di verità sullo stesso dominio (prezzo per stagione) possono divergere. Mitigation: in Fase 1 `price_rules` resta la sorgente delle regole *intensive*, `course_quotes_grid` viene popolato programmaticamente da `expand-catalog` (oppure deprecato — vedi sezione 9).
- **Storico payments**: se una regola viene modificata, i payments storici devono mantenere il prezzo originale. Mitigation: campo `price_rule_code` su `payments` + versioning regole (mai DROP).
- **Performance `/expand-catalog`**: se ci sono 50 regole × max_quantity 15 = 750 righe da generare on-the-fly. Risolvibile con cache (la stagione cambia di rado).
- **Coordinamento con piano [[H_Piano_Integrazione_Pagamenti_Omnichannel]]**: l'endpoint `/api/public/price-matrix` di Fase 2 del piano omnichannel va riconciliato con `/api/public/price-rules-catalog` di questa proposta. Probabile unificazione.

### Rischi di prodotto

- Gaetano deve confermare che il modello `quota_base + step_reduction + min_unit_amount` cattura **tutti** i casi 2025-26 e non solo quelli storici. Casi sospetti che potrebbero non rientrare: `OPEN_LEONARDO_*` (tariffe staff con vincoli a parte), `STAFF_INSEGNANTI` (150€/anno ma legato a tessera+certificato), Mix asimmetrici (`MIX_2AERIAL_1BDF`).

## 9. Domande aperte per Gaetano

### Q1 — Convivenza `price_rules` con `course_quotes_grid`?

`course_quotes_grid` esiste già con 60 record popolati. Quote_Param introduce `price_rules` (intensiva, ~40 righe). Tre opzioni:

- **A — Coesistenza** (Fase 1 sicura): `price_rules` per le formule, `course_quotes_grid` resta come "vista materializzata" rigenerata da `expand-catalog` ogni volta che si salva una regola. Pro: zero rischio di rompere il flusso pagamenti esistente, audit di prezzi storici resta intatto. Contro: due tabelle che dicono la stessa cosa, sincronizzazione da gestire.
- **B — Sostituzione** (più pulito ma rischioso): `price_rules` diventa l'unica fonte, `course_quotes_grid` deprecata e droppata in Fase 3. Pro: pulizia architetturale. Contro: tocca codice che oggi funziona in produzione, audit storico va migrato.
- **C — Coesistenza permanente con ruoli distinti**: `price_rules` solo per le regole degressive (`PROGRESSIVO_MEDIO`, `SCAGLIONI`), `course_quotes_grid` solo per la degressività mensile (matrice corso × mese). Pro: ognuno fa una cosa sola. Contro: serve un orchestratore che le combini al checkout.

Consiglio operativo: **A** in Fase 1, decisione su B vs C posticipata.

### Q2 — Versioning regole o riscrittura in place?

Quando cambi il prezzo di `AD_BDF` da 395 a 400:

- **A — Riscrittura in place** (semplice): aggiorni la riga, i payments storici hanno già `amount` congelato in `payments.amount`, nessun problema. Pro: zero complessità. Contro: perdi la storia delle modifiche al listino.
- **B — Versioning con flag**: ogni modifica crea una nuova `price_rules` con `active=false` per la vecchia; campo `valid_from/valid_to`. Pro: audit completo, possibilità di "rollback" listino. Contro: complessità maggiore, query più articolate.
- **C — Audit log separato**: tabella `price_rules_history` che logga ogni UPDATE. Pro: best of both worlds. Contro: ridondanza.

Consiglio operativo: **A** in Fase 1, **C** in Fase 2 se serve audit.

### Q3 — `SCAGLIONI` e `COMBINATO` adesso o dopo?

Il recap 18_L lascia aperta la scelta. Tre opzioni:

- **A — Tratta tutto come FISSO** (scelta di Gaetano nel recap originale): bambini 2/3 corsi e mix Aerial+BDF restano righe separate `FISSO`. Pro: parte subito, zero complessità formula. Contro: si perde l'eleganza parametrica per i casi non lineari (3-4 codici extra invece di 1 regola).
- **B — Implementa SCAGLIONI in Fase 1**: tabella `price_rule_tiers` subito. Pro: copertura completa. Contro: +20% complessità sviluppo MVP.
- **C — Fase 1 solo FISSO+PROGRESSIVO_MEDIO, SCAGLIONI/COMBINATO in Fase 2**: percorso staged. Pro: MVP rapido. Contro: in Fase 1 alcuni codici restano duplicati come FISSO.

Consiglio operativo: **C** (la proposta è già impostata così).

### Q4 — UI gestione regole: dentro `/quote-promo` o pagina dedicata?

- **A — Tab 0 in `/quote-promo`** (proposta sopra): coerente con il resto del modulo, sidebar invariata.
- **B — Pagina dedicata `/listino-parametrico`** (admin only): più "amministrativa", separa la gestione dal monitoraggio.
- **C — Modale dentro Tab 1**: ogni riga del listino ha un pulsante "edit regola sorgente".

Consiglio operativo: **A** per coerenza con la struttura attuale.

### Q5 — Trigger del lancio: ora o dopo Pagamenti?

Quote_Param è priorità #3.5, Pagamenti è priorità #3. Quote_Param **dipende** in parte da come `nuovo-pagamento-modal` legge i prezzi (`PaymentModuleConnector`).

- **A — Aspettare audit Pagamenti F1+F2** (priorità #3): rischio zero, ma slitta di settimane.
- **B — Avviare in parallelo l'MVP Quote_Param con stub di integrazione**: backend `price_rules` indipendente, UI Tab 0 indipendente, integrazione modale pagamento solo a Pagamenti completato. Pro: tempo guadagnato. Contro: una piccola parte del lavoro potrebbe richiedere rilavorazione.
- **C — Avviare solo backend Quote_Param adesso**, frontend dopo Pagamenti.

Consiglio operativo: **B** se l'audit Pagamenti slitta oltre 2 settimane, altrimenti **A**.

---

*Proposal redatto da Claude (Cowork) il 2026-05-12 alle 15:20. Base: materiale pre-reset 11/05 (3 recap storici + RECAP_01 + piano omnichannel) + audit AG dell'11/05 ([[MASTER_STATUS]], [[D_2026_05_11_Mappa_Dati_e_Frontend_BACKEND]], [[D_2026_05_11_Mappa_Dati_e_Frontend_FRONTEND]]). Da riverificare contro lo schema Drizzle attuale (`shared/schema.ts`) e contro `course_quotes_grid` reale prima di emettere il prompt F1-NNN ad AG.*
