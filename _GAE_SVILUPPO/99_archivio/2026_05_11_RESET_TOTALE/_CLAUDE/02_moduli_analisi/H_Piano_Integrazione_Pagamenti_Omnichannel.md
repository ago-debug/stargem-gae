# 💳 Piano Strategico — Integrazione Pagamenti Omnichannel
## StarGem Suite × Studio-Gem.it
> Documento operativo e architetturale per unificare i pagamenti online (sito) 
> e in sede (gestionale) in un unico sistema coerente.
> Redatto: 09/04/2026 — Chat Quote e Promo

---

## 📌 Il Problema Attuale

Oggi esistono **due mondi separati** che non si parlano:

| | Sito studio-jam.it | Gestionale StarGem |
|---|---|---|
| **Pagamenti** | Form/WooCommerce esterni | Modale Nuovo Pagamento |
| **Prezzi** | Scritti a mano nel sito | price_matrix nel DB |
| **Iscrizioni** | Email di notifica | Maschera Input manuale |
| **Codici sconto** | Non collegati | promo_rules nel DB |
| **Tessere** | Non verificate | memberships nel DB |
| **Storico cliente** | Non esiste | payments nel DB |

**Conseguenza pratica:** Ogni pagamento online richiede un operatore che legge l'email e reinserisce tutto a mano nel gestionale. Doppio lavoro, errori, dati non sincronizzati, nessuna visione unificata del cliente.

---

## 🎯 L'Obiettivo Finale

Un cliente si iscrive alle 3 di notte dal telefono, paga online, e la mattina quando la segreteria apre StarGem quella iscrizione è già lì — completa, con il pagamento registrato, la tessera scalata, il codice promo applicato, il certificato medico segnalato come mancante. **Zero intervento manuale.**

---

## 🏗️ Architettura Scelta — Opzione C (Ibrida)

Dopo analisi delle tre opzioni disponibili:

### ❌ Opzione A — Solo WooCommerce
**Scartata perché:** Crea un secondo database separato. I prezzi vanno aggiornati in due posti. Le iscrizioni arrivano via email e la segreteria re-inserisce a mano. I codici promo non parlano con `promo_rules`. Nessuna visione unificata del cliente.

### ❌ Opzione B — Solo API Diretta (Headless)
**Scartata perché:** Richiede riscrivere completamente il sito. Troppo lavoro, troppo rischio, nessun vantaggio concreto nel breve termine.

### ✅ Opzione C — WordPress/WooCommerce come Frontend, StarGem come Backend
**Scelta perché:**
- Il sito rimane WordPress — lo staff lo conosce, SEO funziona, CMS comodo
- WooCommerce gestisce il checkout e i gateway di pagamento
- Un webhook sincronizza automaticamente WooCommerce → StarGem
- I prezzi vengono letti da StarGem — **un solo posto da aggiornare**
- Le iscrizioni online appaiono automaticamente nel gestionale
- Il cliente ha un profilo unico (online + in sede)

---

## 🔑 Il Principio Fondamentale

> **Online e in sede NON sono due sistemi — sono due canali che scrivono sullo stesso DB.**

Un pagamento online è identico a uno in sede nella struttura dati. Cambia solo **chi lo crea**: il cliente autonomamente via web, oppure l'operatore dalla Maschera Input. Entrambi finiscono nella stessa tabella `payments`, con gli stessi campi, le stesse FK verso `members` e `enrollments`.

---

## 📊 Flusso Unificato — Come Funziona

```
CANALE ONLINE                    CANALE IN SEDE
─────────────────────────────────────────────────────────
Cliente sul sito                 Operatore in StarGem
    ↓                                ↓
Sceglie corso/servizio           Apre Maschera Input
    ↓                                ↓
Legge prezzi da StarGem          Legge prezzi da price_matrix
(GET /api/public/price-matrix)   (hook usePriceFromMatrix)
    ↓                                ↓
Inserisce codice promo           Inserisce codice promo
(POST /api/public/validate-promo)(POST /api/promo-rules/validate)
    ↓                                ↓
Paga con Stripe/Satispay         Paga con contanti/POS/bonifico
    ↓                                ↓
Webhook → StarGem                Modale Pagamento → StarGem
    ↓                                ↓
         ┌───────────────────────────────┐
         │     payments (cuore unico)    │
         │  member_id, amount, status    │
         │  promoCode, discountValue     │
         │  cost_center_code, vat_code   │
         │  source: "online" | "sede"    │
         └───────────────────────────────┘
                        ↓
              enrollments + memberships
                        ↓
               journal_entries (contabilità)
                        ↓
               Lista Pagamenti + Scheda Contabile
```

---

## 🧩 I 4 Tasselli da Costruire

### TASSELLO 1 — Gateway di Pagamento (Stripe)
**Cos'è:** Il sistema che raccoglie i soldi online in modo sicuro.

**Perché Stripe (e non PayPal o Satispay):**
| Provider | Commissioni EU | Abbonamenti | Webhook | Adatto |
|---|---|---|---|---|
| **Stripe** | 1.5% + 0.25€ | ✅ Nativi | ✅ Affidabilissimi | ✅ Consigliato |
| Satispay | 0€ <10€, 0.20€ >10€ | ⚠️ Limitati | ✅ Disponibili | Per piccoli importi |
| PayPal | 3.4% + 0.35€ | ⚠️ Macchinosi | ✅ Disponibili | ❌ Troppo costoso |

**Cosa fa Stripe in questo sistema:**
1. Il sito presenta la pagina di checkout Stripe (hosted page — sicura, certificata PCI-DSS)
2. Il cliente inserisce la carta
3. Stripe processa il pagamento
4. Stripe invia un **webhook** a StarGem con tutti i dettagli
5. StarGem crea automaticamente la riga in `payments`

**Da costruire in StarGem:**
```
POST /api/webhooks/stripe
  → Riceve evento payment_intent.succeeded
  → Verifica firma webhook (Stripe-Signature header)
  → Estrae: amount, customer_email, metadata
    (metadata contiene: memberId, activityType,
     seasonId, promoCode, enrollmentDetails)
  → Crea riga in payments (source='online')
  → Crea iscrizione in enrollments
  → Se nuovo cliente: crea member
  → Se tessera mancante: flag requires_membership
  → Crea journal_entries automaticamente
  → Invia email conferma al cliente
```

---

### TASSELLO 2 — API Pubblica di StarGem (esposta al sito)

Il sito deve poter leggere dati da StarGem in tempo reale.
Queste API sono **pubbliche** (no login) ma protette da **API key** nel header.

```
ENDPOINT PUBBLICI DA CREARE:

GET  /api/public/price-matrix
  → Restituisce i prezzi della stagione attiva
  → Il sito mostra sempre i prezzi aggiornati
  → Cambio listino in StarGem = aggiornamento sito automatico

POST /api/public/validate-promo
  → Body: { code, amount, activityType }
  → Risponde: { valid, discountAmount, finalAmount }
  → Il sito verifica i codici promo prima del checkout

POST /api/public/checkout/create-session
  → Body: { memberId?, email, items[], promoCode? }
  → Crea una Stripe Checkout Session
  → Risponde: { checkoutUrl }
  → Il sito reindirizza il cliente all'URL di pagamento

GET  /api/public/member-status
  → Body: { email }
  → Risponde: { isMember, hasMedicalCert,
                membershipExpiry, activeCarnet }
  → Il sito sa se il cliente è già tesserato
    e quanto deve pagare in più

SICUREZZA:
  Tutte le rotte /api/public/* richiedono:
  Header: X-StarGem-API-Key: [chiave generata]
  Il sito WordPress ha la sua chiave
  Nessuna altra origine può usarla
  Rate limiting: max 100 req/minuto per chiave
```

---

### TASSELLO 3 — Plugin WordPress / WooCommerce Connector

Questo è il **collante** tra i due sistemi.

**Opzione A — Plugin WordPress custom (consigliata):**
Un piccolo plugin PHP (~200 righe) che:
1. Sincronizza il catalogo corsi da StarGem a WooCommerce
2. Intercetta il completamento ordine WooCommerce
3. Chiama StarGem API per creare iscrizione + pagamento
4. Aggiorna lo stato ordine WooCommerce con l'ID pagamento StarGem

**Opzione B — Webhook WooCommerce diretto:**
WooCommerce ha webhook nativi. Quando `order.completed`:
```
POST /api/webhooks/woocommerce
  → Autenticazione via HMAC-SHA256 (WooCommerce secret)
  → Estrae: customer_email, line_items, total, coupon_codes
  → Mappa i prodotti WooCommerce → activityType StarGem
  → Crea payments + enrollments in StarGem
  → Risponde 200 OK
```

**Opzione C — Zapier/Make (senza sviluppo):**
Connette WooCommerce a StarGem via webhook visuale.
Più lento (5-10 secondi di delay) ma zero codice.
Adatto come soluzione transitoria mentre si sviluppa il plugin.

---

### TASSELLO 4 — Gestione Iscrizioni Incomplete

Chi paga online spesso manca di:
- Certificato medico (da consegnare fisicamente)
- Firma modulo iscrizione
- Tessera da completare in sede

**Soluzione: stato `PENDING_COMPLETION` in enrollments**

```sql
-- Aggiungere a enrollments:
ALTER TABLE enrollments
  ADD COLUMN online_source BOOLEAN DEFAULT FALSE,
  ADD COLUMN pending_medical_cert BOOLEAN DEFAULT FALSE,
  ADD COLUMN pending_membership BOOLEAN DEFAULT FALSE,
  ADD COLUMN pending_signature BOOLEAN DEFAULT FALSE,
  ADD COLUMN completion_reminder_sent_at TIMESTAMP;
```

**UI in StarGem:**
- Dashboard con badge "🔔 N iscrizioni da completare"
- Lista iscrizioni online con semaforo:
  - 🟢 Tutto ok
  - 🟡 Manca certificato medico
  - 🔴 Manca tessera + certificato
- Al primo accesso in sede: checklist guidata per l'operatore

---

## 📱 Scenari Operativi Concreti

### Scenario 1 — Iscrizione Annuale Online
```
1. Cliente va su studio-jam.it
2. Sceglie "1 Corso Adulti" 
3. Il sito legge il prezzo da StarGem: 390€
4. Cliente inserisce codice "2526BOCCONI20"
5. StarGem valida: -20% → 312€
6. Cliente paga 312€ + 25€ tessera = 337€ su Stripe
7. Stripe webhook → StarGem crea:
   - payments (337€, source='online', promoCode='2526BOCCONI20')
   - enrollments (pending_medical_cert=true)
   - memberships (tessera nuova)
   - journal_entries (4010-RicaviCorsi, 1010-Banca)
8. Email conferma al cliente con istruzioni per il certificato
9. Segreteria vede in dashboard: 
   "🟡 BOCCONI MARIO — 1 Corso Adulti — Manca certificato"
10. Mario arriva in sede con il certificato
11. Operatore spunta "certificato consegnato" → iscrizione completa
```

### Scenario 2 — Acquisto Carnet Online
```
1. Cliente acquista "Pack 10 Lezioni Singole" online (500€)
2. Stripe webhook → StarGem crea:
   - payments (500€, source='online', type='carnet')
   - carnet_wallets (10 unità, scad. 90gg, is_active=true)
3. Cliente arriva in sede per la prima lezione
4. Operatore apre Tab Carnet → trova il portafoglio
5. Clicca "Usa 1" → registra sessione
6. Zero contabilizzazione aggiuntiva — già pagato
```

### Scenario 3 — Codice Promo Welfare Online
```
1. Dipendente Bocconi va sul sito
2. Inserisce codice "2526BOCCONI20"
3. StarGem risponde: 
   { valid: true, discountPercent: 20,
     excludeOpen: true, 
     company: "Università Bocconi" }
4. Se ha scelto un OPEN → messaggio "Codice non applicabile agli Open"
5. Se ha scelto un corso standard → sconto applicato
6. Paga, webhook, iscrizione creata con flag welfare
```

### Scenario 4 — Pagamento Rate con Pagodil
```
1. Cliente sceglie "3 Corsi Adulti" online (960€)
2. Il sito mostra: "Puoi rateizzare con Pagodil (+50€)"
3. Cliente sceglie 6 rate da 168.33€
4. Pagodil processa il pagamento
5. Webhook Pagodil → StarGem:
   - payments (960€ totale, source='pagodil', 
     feeAmount=50€, installments=6)
   - enrollment creato normalmente
6. Segreteria vede tutto in Lista Pagamenti
```

---

## 🗓️ Roadmap Implementazione — 3 Fasi

### FASE 1 — Webhook Base (2-3 settimane)
**Obiettivo:** Smettere di reinserire a mano le iscrizioni online.

```
Backend (F1):
□ Endpoint POST /api/webhooks/woocommerce
□ Mapping prodotti WooCommerce → activityType
□ Creazione automatica payments + enrollments da webhook
□ Flag online_source + pending_medical_cert
□ Email conferma automatica al cliente

Frontend (F2):
□ Badge "N iscrizioni da completare" in dashboard
□ Lista iscrizioni online con semaforo stato
□ Checklist completamento per operatore in sede
```

**Risultato:** Ogni ordine WooCommerce crea automaticamente l'iscrizione in StarGem. La segreteria non reinserisce più nulla.

---

### FASE 2 — Prezzi in Tempo Reale (1-2 settimane)
**Obiettivo:** Un solo posto per aggiornare i prezzi.

```
Backend (F1):
□ Endpoint GET /api/public/price-matrix (con API key)
□ Endpoint POST /api/public/validate-promo (con API key)
□ Sistema API key: generazione, rotazione, rate limiting
□ Cache Redis/memory per le risposte pubbliche (performance)

WordPress/WooCommerce:
□ Plugin PHP che legge prezzi da StarGem
□ Aggiornamento automatico prezzi WooCommerce ogni notte
□ Validazione codici promo in tempo reale nel checkout
```

**Risultato:** Cambio il listino in StarGem → il sito si aggiorna da solo entro qualche ora. Zero doppio aggiornamento.

---

### FASE 3 — Checkout Nativo StarGem (1-2 mesi)
**Obiettivo:** Checkout moderno integrato, zero dipendenza da WooCommerce.

```
Backend (F1):
□ Integrazione Stripe SDK (stripe npm package)
□ Endpoint POST /api/public/checkout/create-session
□ Endpoint POST /api/webhooks/stripe
□ Gestione eventi: payment_intent.succeeded,
  payment_intent.payment_failed,
  customer.subscription.created (per abbonamenti)
□ Endpoint GET /api/public/member-status

Frontend sito (separato da StarGem):
□ Pagina checkout moderna (React o HTML puro)
□ Stripe Elements integrati (form carta sicuro)
□ Gestione stati: loading, success, error
□ Redirect post-pagamento con recap iscrizione

StarGem (F2):
□ Dashboard "Pagamenti Online" con filtro source='online'
□ Statistiche canale online vs in sede
□ Report conversioni (visite → checkout → pagamenti)
```

**Risultato:** Il sito diventa un frontend moderno di StarGem. WooCommerce diventa opzionale. Si possono anche inviare link di pagamento via WhatsApp o email per chiudere iscrizioni a distanza.

---

## 🔐 Sicurezza — Punti Critici

### Protezione Webhook
```javascript
// Verifica firma Stripe
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  req.body,  // raw body, NON parsed JSON
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);

// Verifica firma WooCommerce
const hash = crypto.createHmac('sha256', WC_SECRET)
  .update(rawBody).digest('base64');
if (hash !== req.headers['x-wc-webhook-signature']) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### Idempotenza dei Webhook
```javascript
// Ogni webhook può arrivare più volte — mai creare pagamenti doppi
const existingPayment = await db.query(
  'SELECT id FROM payments WHERE webhook_event_id = ?',
  [event.id]
);
if (existingPayment) {
  return res.status(200).json({ status: 'already_processed' });
}
```

### Rate Limiting API Pubbliche
```javascript
// Max 100 req/min per API key
const rateLimit = require('express-rate-limit');
app.use('/api/public', rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.headers['x-stargem-api-key']
}));
```

---

## 💰 Impatto Economico Stimato

### Costi Commissioni per 100 iscrizioni/mese (media 400€)
| Gateway | Commissione/trans | Totale mensile |
|---|---|---|
| Stripe | 1.5% + 0.25€ | ~62.5€ |
| Satispay | 0.20€ | ~20€ |
| Contanti/Pos | ~1.5% pos | ~60€ |
| **Online (Stripe)** | ~62.5€ | **vs ~150€ ore operatore** |

Il costo delle commissioni Stripe è ampiamente compensato dal risparmio in ore lavoro della segreteria per il reinserimento manuale.

### Tempo Risparmiato
- Oggi: ~10 min/iscrizione online per reinserimento manuale
- Con webhook: 0 min (automatico)
- Per 50 iscrizioni online/mese: **~8 ore risparmiate/mese**

---

## 🧰 Stack Tecnico Necessario

### Già presente in StarGem
```
✅ Node.js + Express (server)
✅ MariaDB + Drizzle ORM (database)
✅ payments table con tutti i campi necessari
✅ promo_rules + /validate endpoint
✅ price_matrix con prezzi centralizzati
✅ journal_entries per contabilità
✅ VPS IONOS con Nginx (82.165.35.145)
```

### Da aggiungere a StarGem
```
⬜ stripe npm package (npm install stripe)
⬜ Tabella api_keys per gestire le chiavi pubbliche
⬜ Colonne online_source, pending_* in enrollments
⬜ Endpoint webhook Stripe + WooCommerce
⬜ Endpoint API pubbliche con autenticazione
⬜ Sistema email transazionale (Resend o SendGrid)
```

### Da aggiungere al sito WordPress
```
⬜ Plugin WooCommerce Connector (custom ~200 righe PHP)
  oppure
⬜ Zapier/Make workflow (soluzione transitoria)
⬜ Stripe per WooCommerce plugin (gratuito)
```

---

## 📋 Checklist Pre-Avvio Fase 1

Prima di iniziare lo sviluppo verificare:

```
□ Account Stripe Business creato e verificato
□ Webhook endpoint URL configurato in Stripe Dashboard
  (https://stargem.studio-gem.it/api/webhooks/stripe)
□ STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET in .env
□ WooCommerce installato su studio-jam.it
□ Webhook WooCommerce configurato verso StarGem
□ Mappatura prodotti WooCommerce ↔ activityType StarGem
  (es. Product ID 123 = "adulti/1corso")
□ Email transazionale configurata (mittente conferme)
□ Ambiente di test Stripe attivo (stripe listen --forward-to)
```

---

## 🔮 Visione a Lungo Termine

### App Mobile (12-18 mesi)
Con le API pubbliche già costruite, un'app mobile React Native o Flutter può:
- Mostrare il calendario corsi
- Permettere l'iscrizione con pagamento in-app
- Mostrare il saldo carnet
- Inviare notifiche per lezioni e scadenze

### Link di Pagamento WhatsApp
```
"Ciao Mario, ecco il link per completare 
l'iscrizione al corso di Bachata: 
https://stargem.studio-gem.it/pay/abc123"

→ Il cliente apre il link, paga con Stripe,
  l'iscrizione si crea automaticamente.
```
Utile per chiudere iscrizioni a distanza senza che il cliente venga in sede o apra il sito.

### Abbonamenti Ricorrenti
Stripe supporta nativamente gli abbonamenti mensili. I clienti "Open" potrebbero pagare mensilmente con addebito automatico invece di un unico pagamento annuale.

### Totem Self-Service in Sede
Un tablet all'ingresso con checkout Stripe integrato per:
- Acquisto lezioni singole spot senza passare dalla segreteria
- Rinnovo carnet
- Pagamento quote arretrate

---

## 📌 Note Finali

**Cosa NON fare mai:**
1. Non usare sistemi terzi (Eventbrite, Mindbody, ecc.) che tengono i dati per conto loro — creano un secondo DB impossibile da sincronizzare
2. Non gestire i numeri di carta in StarGem — delegare sempre a Stripe (PCI-DSS compliance)
3. Non saltare la verifica firma webhook — rischio di frodi e pagamenti falsi
4. Non aggiornare i prezzi in due posti — sempre e solo da StarGem

**Il principio guida:**
> StarGem è il **cervello**. Il sito, l'app, il totem sono **occhi e mani**. 
> I dati vivono in un solo posto. I canali sono infiniti.

---

*Documento generato da Claude — Chat Quote e Promo — 09/04/2026*
*Da aggiornare dopo completamento Fase 1 (webhook WooCommerce)*
