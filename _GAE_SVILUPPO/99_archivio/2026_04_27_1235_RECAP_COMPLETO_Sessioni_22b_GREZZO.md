# RECAP COMPLETO — Chat_22b Sessione Aprile 2026
## Generato: 2026_04_27_1235
## Sessioni coperte: Chat_22b_Import_Export_dati + Chat_22b_Bonifica_Dati
## Stato: ✅ ENTRAMBE CHIUSE — pronte per riferimento in altre chat

---

## 🎯 SCOPO DI QUESTO DOCUMENTO

Recap dettagliato di tutto il lavoro svolto nelle
due sessioni Chat_22b, da importare in qualsiasi
altra chat per fornire contesto completo.
Include lavori fatti, decisioni prese, file creati,
e checklist completa di cosa resta da fare.

---

## 📋 SESSIONE 1 — Chat_22b_Import_Export_dati

**Data:** 25/04/2026
**Durata:** circa 4 ore (13:00 → 17:30)
**Stato:** ✅ CHIUSA
**Ultimo commit:** `028531a`
**Backup:** `CHAT22B_PRE_CAPITALIZZAZIONE_20260425.sql`

### Protocolli eseguiti
```
F1-001 / F2-001  Fix Export
F1-002           Infrastruttura VPS
F2-002           Middleware sanitizzazione
F2-003           Fix toTitleCase civici
F1-003           Diagnosi street_address
F1-004b          Refactoring streetAddress→address
F1-005           Sanitizzazione import + tracking
F2-005           Banner avviso normalizzazione
F1-006           Strong typing + streaming + cleanup
F2-004/007       Maschera Input fix completo
```

### Lavori completati

**EXPORT:**
- Date in formato italiano GG/MM/AAAA in tutte le sezioni
- Booleani True/False → Sì/No
- Intestazione Excel coerente in tutte le sezioni
- Anno 4 cifre nell'intestazione (era 25/04/26 → 25/04/2026)
- TZ=Europe/Rome impostato su VPS (.env + pm2)
- Strong typing colonne ExportWizard
  (type: 'date' | 'boolean' | 'string' | 'number')
- Streaming chunk 500 record /api/export
  (prevenzione OOM su export massivi futuri)
- Route legacy `export-csv` e `export-csv-light` rimosse

**MASCHERA INPUT:**
- Tessera (numero, scadenza, stato) ora presente
- Pagamento (importo, data) ora presente
- Certificato (scadenza, stato) ora letto da
  `medical_certificates`, non dal campo legacy
  null in `members.medical_certificate_expiry`
- Verificato su 4 nominativi reali:
  - CIFARELLI VALENTINA (ID 14181)
  - MIGNOLI RIANE CATERINA (ID 17092)
  - GNECCO GAIA (ID 16645)
  - MAZZONE DANIELA (ID 15116)

**SANITIZZAZIONE DATI (server/utils/sanitizer.ts):**
Regole attive:
- UPPER: cognome, nome, CF, città, provincia,
  regione, nazionalità, luogo nascita, n. albo,
  targa
- LOWER: email, email secondaria, PEC, facebook,
  sito web
- TITLE CASE: indirizzo, professione, titolo studio,
  banca, nomi tutori, contatti emergenza
- TRIM: tutti i campi stringa
- Lettera maiuscola dopo cifra/slash (58A, 12/G)

Integrato in 5 punti di salvataggio:
- POST /api/members
- PATCH /api/members/:id
- POST /api/maschera-generale/save
- POST /api/members/import-google-sheets
- Webhook `processWooCommerceOrder`

**NORMALIZZAZIONE RETROATTIVA:**
- 3.949 record `members` normalizzati
- Eseguito con transazione BEGIN/COMMIT
- streetAddress → address (12 file refactored)
- street_address ghost column DB (DROP impossibile
  per row size limit MariaDB 8126 byte — accettato
  come debito tecnico noto)

**SEZIONE /importa:**
- sanitizeMemberData applicato pre-insert/update
- Tracking `modifiche_casing` nel dry-run
- Colonna "Modifiche Applicate" nel report CSV
- Banner avviso normalizzazione step finale
- Colonna "Normalizzazioni" nella tabella dry-run

---

## 📋 SESSIONE 2 — Chat_22b_Bonifica_Dati

**Data:** 26/04/2026
**Durata:** circa 4 ore (mattina-pomeriggio)
**Stato:** ✅ CHIUSA
**Backup:** `CHAT22B_BONIFICA_OP1235_20260426.sql`

### Protocolli eseguiti
```
F1-001 → F1-010   Audit + bonifica + Smart Routing
F2-001 → F2-007   UI badge + banner dry-run
```

### Problema identificato

L'import storico aveva mescolato in `enrollments` con
`activity_type = 'storico'` cose che dovevano stare
in tabelle dedicate:
- 2.764 QUOTATESSERA (dovevano stare in `memberships`)
- 1.011 visite mediche (dovevano stare in
  `medical_certificates`)
- 285 SKU di workshop/feste/campus (mal classificati)
- 929 prove con `season_id` NULL
- 8 membri importati senza Codice Fiscale

### Bonifica eseguita

**OP1 — 24 tessere create**
- Su 33 orfani QUOTATESSERA, 24 con CF migrati
  in `memberships`
- 8 senza CF saltati e flaggati
- `data_quality_flag = 'da_verificare'` su tutti
- Format: 2526-XXXXXX progressivo

**OP2 — 97 certificati medici creati**
- Migrati DTYURI/DTNELLA in `medical_certificates`
- `issue_date` = enrollment_date originale
- `expiry_date` = +1 anno
- `notes` = 'importato da bonifica storico Chat22b
  — verificare con segreteria'

**OP3 — 929 prove season_id**
- UPDATE `season_id = 1` (stagione 25/26)
- Filtrato per SKU `PR2526*`, `PROVA2526*`,
  `PRO2526*`, `PROV2526*`

**OP4 — Allenamento riclassificato**
- Corso 2526ALLENAMENTO: `activity_type` da
  'storico' a 'allenamenti'
- 148 iscrizioni intatte e ora visibili
  in /attivita/allenamenti

**OP5 — 285 SKU riclassificati**
```
27 → workshop (WS*, NATALE)
19 → domenica_movimento (KUQI*, RUSSO, DOSSANTO)
14 → corso (OPEN*, CUGGEGIO, storici)
4  → campus (CAMPUSS1/S2)
1  → lezione_individuale (LEZINDIVIDUALE)
1  → prova_gratuita (LEZPROVA)
1  → merchandising (MERCHANDISING)
1  → buono_regalo (GIFT)
3  → lasciati 'storico' (NON TOCCARE):
     2526QUOTATESSERA
     2526DTYURI
     2526DTNELLA
     (sono i contenitori dell'import)
```

**Badge CF MANCANTE in UI**
- 8 membri senza CF segnalati con badge rosso
- Visibili in: members.tsx, anagrafica-home.tsx,
  gempass.tsx (bottone "Crea Tessera" disabilitato
  con tooltip esplicativo)
- `data_quality_flag = 'mancano_dati_obbligatori'`

I 8 membri sono:
```
BELLONI HELLEN
BOCCHETTI MALTSEVA EKATERINA
BURANI SARA
CIONI BIANCA
GIACOSA CHIARA
GULIZIA GABRIELE
MONTANI FRANCESCA
MOUTIQ JAMILIA
```

### Smart Routing nell'import (anti-recidiva)

Per evitare che i problemi si ripetano al prossimo
import (delta metà maggio), implementato:

**CF Validator** (`shared/utils/cf-validator.ts`):
- Algoritmo italiano standard
- Verifica checksum (16 char alfanumerici)
- Estrae: data nascita, sesso, codici nome/cognome
- Pronto per uso anche in tempo reale frontend

**Validazione CF all'import:**
- CF mancante → blocco import + record in
  `missingCfRecords`
- CF invalido → blocco import + record in
  `invalidCfRecords`
- CF valido ma incongruente con date/sesso → warning

**Smart Routing in /api/import/mapped:**
```
SE sku contiene 'QUOTATESSERA':
  → INSERT in memberships automatico
  → NON in enrollments

SE sku contiene 'DTYURI' o 'DTNELLA':
  → INSERT in medical_certificates automatico
  → NON in enrollments

ALTRIMENTI:
  → enrollments con season_id forzato
```

**Blocco season_id:**
- Se NULL e nessuna stagione attiva → blocco
- Se NULL ma stagione attiva esiste → fallback automatico
- Operatore può forzare stagione 25/26 dalla UI

**UI dry-run arricchita:**
- Banner rosso: CF mancanti/invalidi
- Banner arancio: stagione mancante
  (con bottone "Assegna 25/26 a tutti")
- Banner blu: Smart Routing stats
  (X tessere → memberships, Y certificati → ...)

### File creati/modificati

```
NUOVI FILE:
- server/utils/sanitizer.ts
- shared/utils/cf-validator.ts

FILE MODIFICATI (key):
- server/routes.ts (import routing)
- client/src/components/ExportWizard.tsx
- client/src/pages/import-data.tsx
- client/src/pages/maschera-input-generale.tsx
- client/src/pages/members.tsx
- client/src/pages/anagrafica-home.tsx
- client/src/pages/gempass.tsx
- shared/schema.ts (rimosso street_address)
- 12 file frontend (refactoring street→address)
```

---

## 🗄️ STATO DB ATTUALE

```
members              4.342 record (8 senza CF flaggati)
memberships          3.305 (3.281 + 24 da bonifica)
enrollments         13.584
payments             3.775
medical_certificates 2.867 (2.770 + 97 da bonifica)
courses                586 (285 SKU riclassificati)
```

### Distribuzione activity_type courses (SKU 2526%)
```
course                 289
workshop                27
corso                   14
domenica_movimento      13
campus                   4
storico                  3 (contenitori — non toccare)
buono_regalo             1
merchandising            1
prova_gratuita           1
allenamenti              1
lezione_individuale      1
```

---

## ✅ TUTTO COMPLETATO

```
EXPORT:
✅ Date IT GG/MM/AAAA
✅ Sì/No booleani
✅ Intestazione Excel coerente
✅ Anno 4 cifre
✅ TZ Europe/Rome (VPS)
✅ Strong typing colonne
✅ Streaming chunk 500
✅ Route legacy rimosse

MASCHERA INPUT:
✅ Tessera, pagamento, certificato presenti
✅ Letti dalle tabelle corrette
✅ Verificato su 4 nominativi reali

SANITIZZAZIONE:
✅ sanitizer.ts attivo (5 route + WC webhook)
✅ TITLE CASE con civici (10/B, 12/G)
✅ Applicato anche a /importa
✅ 3.949 record retroattivi normalizzati

REFACTORING:
✅ street_address → address (12 file)
✅ Ghost column DB accettata

IMPORT /importa:
✅ Sanitizzazione automatica
✅ Tracking modifiche_casing
✅ Banner avviso normalizzazione
✅ Colonna "Modifiche Applicate" CSV

BONIFICA DB:
✅ 24 tessere create da orfani
✅ 8 senza CF flaggati
✅ 97 certificati medici creati
✅ 929 prove season_id assegnato
✅ 285 SKU riclassificati
✅ 3 SKU contenitori lasciati storico

ANTI-RECIDIVA IMPORT:
✅ CF Validator algoritmo italiano
✅ CF obbligatorio nell'import
✅ Smart Routing QUOTATESSERA/DTYURI
✅ Blocco season_id NULL
✅ UI dry-run banner CF/stagione/routing

UI:
✅ Badge CF MANCANTE su 8 membri
✅ Bottone GemPass disabilitato + tooltip
```

---

## 🔴 CHECKLIST — DA FARE

### Chat_05_GemPass (PROSSIMA - prioritaria)
```
⏳ Bug UI: membership_type, issue_date,
   season_id, fee mostrano "—"
⏳ Creare tabella membership_events
⏳ Bottone "Dati da verificare"
   (include 24 tessere bonifica)
⏳ Funzione "Assegna Tessera"
⏳ Badge qualità colorati in GemPass
⏳ 8 membri senza CF da completare manualmente
⏳ Firma kiosk tablet (Phase 2 — bassa priorità)
```

### Chat_24_DB_Monitor (NUOVA - alta priorità)
```
⏳ Cruscotto DB nel menu sinistra (admin-only)
⏳ Solo lettura — mappa di tutte le tabelle
⏳ Per tabella: righe, colonne, tipi, FK,
   indici, dimensione, sample data
⏳ Indicatori: orfana / vuota / popolata / backup
⏳ Filtri e ricerca colonna trasversale
⏳ Dopo cruscotto: cleanup DB in 3 fasi
   FASE A: 13 tabelle spazzatura
   FASE B: 30 tabelle vuote agganciate al codice
   FASE C: architettura members
   (174 colonne → conversione VARCHAR→TEXT)
```

### Chat_06_Contabilità
```
⏳ ALTA PRIORITÀ: Rollback import pagamenti
   (transazione + funzione "Annulla ultimo")
⏳ Campi payments non visibili in UI:
   operator_name, source, quota_description,
   period, total_quota, deposit, receipts_count,
   discount_*, gbrh_*
⏳ Sezione buoni regalo (2526GIFT)
```

### Chat_08_Corsi/Iscritti
```
⏳ Uniformare participation_type
   ('corso' vs 'STANDARD_COURSE')
⏳ Badge status iscrizione
   (active=verde, pending=giallo, cancelled=rosso)
⏳ Campi nascosti: source_file, notes, season_id
⏳ Filtri: per stagione, status, tipo
⏳ Verificare OPEN* come abbonamenti corsi
```

### Chat_10_Utenti/Anagrafica
```
⏳ Collegare cf-validator.ts al form
   (auto-compila nascita/sesso/luogo dal CF)
⏳ Validazione telefono real-time
⏳ Validazione email real-time
⏳ Verifica SMS OTP (auto-registrazione)
⏳ 54+ campi nascosti da mostrare in UI
⏳ Badge flag qualità colorati
⏳ 179 persone non identificabili da completare
```

### Chat_12_Gemdario (in collaudo)
```
⚠️ UI FREEZE attivo
⏳ Bug raggruppamento corsi nel Planning sparito
⏳ Collaudo end-to-end: Planning → Calendario
   → Programmazione Date
⏳ Overlay Programmazione Date in shift grid
⏳ Festività italiane 2026
⏳ Corsi sovrapposti nel Calendario
```

### Altre chat da avviare
```
⏳ Chat_04_MedGem: F1-001 audit
⏳ Chat_07_Gemory: F1-001 + 15 Trello board seed
⏳ Chat_09_Workshop: F1-001 audit
⏳ Chat_13_Domeniche_in_Movimento: F1-001 audit
⏳ Chat_14_BookGem: F1-001 audit
⏳ Chat_20_MerchSG: F1-001 audit
⏳ Chat_23_Log: UI audit logs
⏳ Chat_01_Quote_e_Promo: riapri F1-015/F2-012
   (StarGem → WooCommerce sync)
```

### Futuro
```
⏳ Delta import metà maggio
   (Smart Routing pronto, sicuro)
⏳ P5 STAFF insegnanti (file STAFF__PERSONAL)
⏳ Export PDF
⏳ StarGem → WooCommerce sync automatico
⏳ Clarissa CRM (sostituisce Bitrix)
⏳ GemTeam: GemPass a 14 dipendenti
⏳ Verifica email (link conferma)
⏳ SMS OTP per auto-registrazione
```

---

## ⚠️ DEBITO TECNICO NOTO

```
1. street_address ghost column in members
   Causa: row size limit MariaDB 8126 byte
   Soluzione futura: convertire VARCHAR→TEXT
   in members prima di poter fare DROP COLUMN
   Stato: codice già pulito (Drizzle non la vede)

2. 8 membri senza CF
   Da completare manualmente prima di poter
   assegnare tessera (badge CF MANCANTE attivo)

3. 179 persone non identificabili
   Persone reali da completare manualmente

4. participation_type misto
   'corso' + 'STANDARD_COURSE' coesistono
   Da scegliere uno e migrare in Chat_08

5. 3 SKU storico contenitori
   QUOTATESSERA, DTYURI, DTNELLA
   Da NON toccare — sono usati dall'import
   per il Smart Routing
```

---

## 🛠️ INFRASTRUTTURA E STRUMENTI

```
DB: stargem_v2 su MariaDB 11.4
VPS: 82.165.35.145 (IONOS Ubuntu 24.04)
Dev: localhost:5001 (tunnel SSH porta 3307)
TZ: Europe/Rome (configurato su VPS)

Backup path: /root/backups/ sul VPS
Ultimo backup: CHAT22B_BONIFICA_OP1235_20260426.sql

Deploy:
  git push origin main → STOP
  Gaetano deploya manualmente via Plesk
  Antigravity NON esegue:
    - bash scripts/deploy-vps.sh
    - ssh root@... (qualsiasi comando SSH)
    - npm run build sul VPS
    - npx pm2 restart
    - chown / chmod sul VPS
  L'unico comando finale è git push origin main
```

---

## 📜 REGOLE OPERATIVE FONDAMENTALI

```
F1 = AG-Backend (Finestra 1)
F2 = AG-Frontend (Finestra 2)

FLUSSO OBBLIGATORIO:
1. Claude chiede ad Antigravity di analizzare
2. Antigravity risponde con analisi e proposta
3. Claude valuta con Gaetano
4. Solo dopo → VAI
5. Il codice lo scrive sempre Antigravity

REGOLE STRETTE:
- Claude non emette mai un nuovo protocollo
  finché il precedente non ha ricevuto risposta
- Ogni risposta di Antigravity deve indicare
  il numero del protocollo a cui risponde
  (es. "Risposta F1-PROTOCOLLO-003")
- Ogni protocollo è in un unico blocco testo
  pronto per copia-incolla
- Claude non anticipa mai il codice ad
  Antigravity (lo condizionerebbe)
- Stop & Go SEMPRE prima di modificare DB
- Backup obbligatorio dopo ogni F1 su tabelle
- Max 1 numero distanza tra F1 e F2

REGOLE TECNICHE:
- user_roles colonna: 'name' (non 'roleName')
- members.user_id → FK verso users.id (set null)
- payments: MAI DROP, solo ADD COLUMN
- members: ALTER bloccato per row size limit
- street_address: ghost column accettata
- 3 SKU storico contenitori: non toccare
```

---

## 📁 FILE PRODOTTI IN QUESTA SESSIONE

```
File caricabili nel Progetto Claude:
- 2026_04_26_1800_MASTER_STATUS.md
- 2026_04_26_1800_CHECKLIST_GLOBALE.md
- 2026_04_26_1800_RECAP_Chat05_GemPass.md
- 2026_04_26_1800_RECAP_Chat06_Contabilita.md
- 2026_04_26_1800_RECAP_Chat08_Corsi.md
- 2026_04_26_1800_RECAP_Chat10_Utenti.md
- 2026_04_26_1800_RECAP_Chat12_Gemdario.md
- 2026_04_27_1235_RECAP_Chat24_DB_Monitor.md
- 2026_04_27_1235_RECAP_COMPLETO_Sessioni_22b.md
  (questo file)
```

---

## 🎯 ORDINE DI APERTURA CHAT SUGGERITO

```
1. Chat_24_DB_Monitor (nuova - altissima priorità)
   → Mappa DB sempre sotto controllo
   → Necessaria per decisioni cleanup successive

2. Chat_05_GemPass
   → Bug UI tessere (operativo, veloce)
   → Sblocca utilizzo GemPass quotidiano

3. Chat_06_Contabilità
   → Rollback import pagamenti (alta priorità)

4. Chat_12_Gemdario
   → Bug raggruppamento Planning (in collaudo)

5. Chat_08_Corsi
   → Uniformare participation_type

6. Chat_10_Utenti
   → CF validator real-time + 54 campi nascosti
```
