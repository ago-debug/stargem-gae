# RECAP COMPLETO — Chat_Analisi / Chat_22b
## Generato: 2026_04_27_1235
## Copertura: intera sessione aprile 2026
## Scopo: archivio prima della cancellazione della chat

---

## 🧭 RUOLO DI QUESTA CHAT

Chat di coordinamento globale del progetto StarGem Suite.
Non genera prompt per Antigravity direttamente —
produce decisioni, analisi e RECAP per le chat operative.
Ha gestito anche direttamente le sessioni Chat_22b
(Import/Export e Bonifica Dati).

---

## 📌 DECISIONI ARCHITETTURALI PRESE

### Regole capitalizzazione dati (permanenti)
```
UPPER: cognome, nome, CF, città, provincia,
       regione, nazionalità, luogo nascita,
       n. albo, targa
LOWER: email, email secondaria, PEC,
       facebook, sito web
TITLE CASE: indirizzo, professione, titolo studio,
            banca, nomi tutori, contatti emergenza
SPECIALE: lettera maiuscola dopo cifra/slash
          (58A → 58A, 12/g → 12/G)
TRIM: sempre su tutti i campi stringa
```
Implementato in: `server/utils/sanitizer.ts`
Integrato in: POST/PATCH members, maschera-generale,
import-google-sheets, webhook WooCommerce, /importa

### Fuso orario (permanente)
```
Strategia: Store UTC → Display Europe/Rome sempre
Se qualcuno si iscrive dall'estero, il timestamp
UTC è universalmente corretto.
TZ=Europe/Rome impostato in .env + pm2 su VPS.
Non modificare time_zone di MariaDB — UTC nel DB
è corretto per design.
```

### CF come chiave univoca assoluta (confermato)
```
Il CF è e rimane la chiave univoca di ogni member.
Se manca, la tessera non può essere assegnata.
Badge CRITICO rosso in UI per i membri senza CF.
CF Validator (shared/utils/cf-validator.ts):
algoritmo italiano checksum + estrazione dati.
```

### Smart Routing import (permanente)
```
QUOTATESSERA → memberships (automatico)
DTYURI/DTNELLA → medical_certificates (automatico)
OPEN* → enrollments come 'corso' (abbonamenti)
CAMPUS* → enrollments come 'campus'
WS* + NATALE → enrollments come 'workshop'
GIFT → 'buono_regalo'
```

### Deploy (regola assoluta invariata)
```
git push origin main → STOP
Gaetano deploya manualmente su Plesk.
Antigravity non esegue MAI:
- ssh root@VPS
- pm2 restart
- npm run build sul VPS
- deploy-vps.sh
```

### street_address ghost column (debito tecnico noto)
```
DROP impossibile: row size limit MariaDB 8126 byte.
members ha ~174 colonne VARCHAR(255) che saturano
il limite di riga. Ogni ALTER TABLE richiede rebuild
e viene bloccato dal controllo MariaDB.
Soluzione futura: convertire alcune VARCHAR→TEXT
prima di poter fare DROP COLUMN.
Stato attuale: accettato, codice già pulito
(Drizzle non referenzia street_address).
```

### 3 SKU storico contenitori (regola permanente)
```
NON TOCCARE QUESTI 3 RECORD IN courses:
- 2526QUOTATESSERA (activity_type='storico')
- 2526DTYURI (activity_type='storico')
- 2526DTNELLA (activity_type='storico')
Sono i contenitori usati dal Smart Routing
per identificare i record da instradare
verso memberships e medical_certificates.
Se li cambi, il Smart Routing smette di funzionare.
```

---

## 🔧 LAVORI ESEGUITI — SESSIONE IMPORT/EXPORT

**Data:** 25/04/2026 ore 13:00-17:30
**Commit finale:** `028531a`

### Fix Export
```
✅ Date formato italiano GG/MM/AAAA
✅ Booleani → Sì/No
✅ Intestazione Excel coerente in tutte le sezioni
✅ Anno 4 cifre (era "25/04/26" → "25/04/2026")
✅ TZ Europe/Rome nel nome file e intestazione Excel
✅ Strong typing colonne ExportWizard:
   type: 'date' | 'boolean' | 'string' | 'number'
   5 file aggiornati con tipi espliciti
✅ Streaming chunk 500 record /api/export
   (prevenzione OOM su export massivi futuri)
✅ Route legacy export-csv/export-csv-light rimosse
```

### Fix Maschera Input
```
Bug: Scadenza Certificato e Stato Certificato
     mostravano NaN per tutti i membri
Causa: il componente leggeva
  currentMember.medicalCertificateExpiry
  che è NULL per tutti i record importati.
  Il dato reale è in tabella medical_certificates.
Fix: aggiunta useQuery /api/medical-certificates
  che legge la tabella relazionale.
Verificato su: Cifarelli (14181), Mignoli (17092),
  Gnecco (16645), Mazzone (15116)
✅ Tessera (numero, scadenza, stato) presente
✅ Pagamento (importo, data) presente
✅ Certificato (scadenza, stato) presente
```

### Sanitizzazione dati
```
✅ server/utils/sanitizer.ts creato
✅ sanitizeMemberData() integrata in 5 route
✅ Applicata anche all'import /importa
✅ Tracking modifiche_casing nel dry-run
✅ Colonna "Modifiche Applicate" nel report CSV
✅ Banner avviso normalizzazione step finale
```

### Normalizzazione retroattiva
```
✅ 3.949 record members normalizzati
   via script Node.js con transazione BEGIN/COMMIT
✅ streetAddress → address refactoring (12 file):
   schema.ts, storage.ts, routes.ts,
   import-from-sheets.ts, sanitizer.ts,
   anagrafica-home.tsx, members.tsx,
   member-edit-dialog.tsx, duplicate-merge-modal.tsx,
   studio-bookings.tsx, maschera-input-generale.tsx,
   calendar.tsx
```

---

## 🔧 LAVORI ESEGUITI — SESSIONE BONIFICA DATI

**Data:** 26/04/2026
**Commit finale:** feat(import) Smart Routing

### Audit iniziale
```
Trovati in enrollments con activity_type='storico':
- 2.764 QUOTATESSERA (dovevano stare in memberships)
- 1.011 visite mediche (dovevano stare in
  medical_certificates)
- 285 SKU workshop/eventi mal classificati
- 929 prove con season_id NULL
- 8 membri senza CF
Totale record storico: 7.351
```

### Bonifica DB
```
✅ 24 tessere create (orfani QUOTATESSERA con CF)
   8 senza CF saltati e flaggati
   Format: 2526-XXXXXX progressivo
   data_quality_flag = 'da_verificare'

✅ 97 certificati medici creati (DTYURI/DTNELLA)
   issue_date = enrollment_date originale
   expiry_date = +1 anno
   status = 'valid'

✅ 929 prove: season_id = 1 assegnato
   SKU filtro: PR2526*, PROVA2526*, PRO2526*

✅ 2526ALLENAMENTO: 'storico' → 'allenamenti'
   148 iscrizioni intatte

✅ 285 SKU riclassificati in courses:
   27 workshop, 19 domenica_movimento,
   14 corso, 4 campus, 1 lezione_individuale,
   1 prova_gratuita, 1 merchandising,
   1 allenamenti, 1 buono_regalo
   3 lasciati storico (contenitori)
```

### Badge CF MANCANTE
```
✅ 8 membri flaggati:
   BELLONI HELLEN, BOCCHETTI MALTSEVA EKATERINA,
   BURANI SARA, CIONI BIANCA, GIACOSA CHIARA,
   GULIZIA GABRIELE, MONTANI FRANCESCA, MOUTIQ JAMILIA

   data_quality_flag = 'mancano_dati_obbligatori'
   
   Badge rosso in:
   - members.tsx (lista)
   - anagrafica-home.tsx (scheda dettaglio)
   - gempass.tsx (bottone disabilitato + tooltip)
```

### Smart Routing (anti-recidiva import)
```
✅ shared/utils/cf-validator.ts creato
   Algoritmo italiano, checksum, estrazione dati

✅ /api/import/mapped aggiornato:
   - CF obbligatorio (blocco se mancante)
   - CF invalido (blocco + warning)
   - Smart Routing QUOTATESSERA → memberships
   - Smart Routing DTYURI/DTNELLA → medical_certs
   - Blocco season_id NULL con conferma operatore

✅ UI dry-run import arricchita:
   - Banner rosso CF (missingCfRecords)
   - Banner arancio stagione (missingSeasonRecords)
   - Banner blu routing (routingStats)
   - Pulsante "Assegna stagione 25/26 a tutti"
```

---

## 📂 FILE PRODOTTI IN QUESTA SESSIONE

### File per il Progetto Claude (da importare)
```
2026_04_26_1800_MASTER_STATUS.md
2026_04_26_1800_CHECKLIST_GLOBALE.md
2026_04_26_1800_RECAP_Chat05_GemPass.md
2026_04_26_1800_RECAP_Chat06_Contabilita.md
2026_04_26_1800_RECAP_Chat08_Corsi.md
2026_04_26_1800_RECAP_Chat10_Utenti.md
2026_04_26_1800_RECAP_Chat12_Gemdario.md
2026_04_27_1235_RECAP_Chat24_DB_Monitor.md
2026_04_27_1235_RECAP_COMPLETO_Sessioni_22b.md
2026_04_27_1235_RECAP_COMPLETO_ChatAnalisi.md
  (questo file)
```

### File codice creati/modificati (su Git)
```
NUOVI:
server/utils/sanitizer.ts
shared/utils/cf-validator.ts

MODIFICATI (key):
server/routes.ts
server/storage.ts
shared/schema.ts
client/src/components/ExportWizard.tsx
client/src/pages/import-data.tsx
client/src/pages/maschera-input-generale.tsx
client/src/pages/members.tsx
client/src/pages/anagrafica-home.tsx
client/src/pages/gempass.tsx
client/src/pages/payments.tsx
client/src/pages/calendar.tsx
client/src/pages/studio-bookings.tsx
client/src/components/member-edit-dialog.tsx
client/src/components/duplicate-merge-modal.tsx
server/import-from-sheets.ts
```

---

## 🔴 CHECKLIST COMPLETA — DA FARE

### IMMEDIATO

#### Chat_24_DB_Monitor (NUOVA — prima cosa)
```
⏳ Cruscotto DB nel menu sinistra (admin-only)
⏳ Solo lettura — mappa tabelle, colonne, FK, indici
⏳ Indicatori: orfana / vuota / popolata / backup
⏳ Filtri e ricerca colonna trasversale
⏳ Sample data con privacy mask
⏳ Dopo cruscotto → cleanup DB:
   FASE A: 13 tabelle spazzatura (DROP sicuro)
   FASE B: 30 tabelle vuote agganciate al codice
   FASE C: members 174 colonne → VARCHAR→TEXT
```

#### Chat_05_GemPass
```
⏳ Bug UI: membership_type, issue_date,
   season_id, fee mostrano "—"
⏳ Creare tabella membership_events
⏳ Bottone "Dati da verificare"
⏳ Funzione "Assegna Tessera"
⏳ Badge qualità colorati
⏳ 8 CF mancanti da completare manualmente
```

#### Chat_06_Contabilità
```
⏳ ALTA: Rollback import pagamenti
⏳ 10+ campi payments non visibili in UI
⏳ Sezione buoni regalo (2526GIFT)
```

#### Chat_12_Gemdario (in collaudo — UI FREEZE)
```
⏳ Bug raggruppamento corsi nel Planning
⏳ Collaudo end-to-end completo
⏳ Overlay Programmazione Date in GemTeam
⏳ Festività 2026 da completare
```

### DA AVVIARE

#### Chat_08_Corsi/Iscritti
```
⏳ Uniformare participation_type
⏳ Badge status iscrizione
⏳ Campi nascosti + filtri
```

#### Chat_10_Utenti/Anagrafica
```
⏳ cf-validator.ts → form real-time
⏳ Validazione telefono/email
⏳ SMS OTP auto-registrazione
⏳ 54+ campi nascosti in UI
⏳ Badge flag qualità
⏳ 179 persone non identificabili
```

#### Chat_04_MedGem
```
⏳ F1-001 audit (da eseguire)
⏳ medical_certificates: 2.867 record
```

#### Chat_07_Gemory
```
⏳ F1-001 audit
⏳ 15 Trello board names da seedare SQL
```

#### Chat_09_Workshop
```
⏳ F1-001 audit
⏳ SKU WS* ora correttamente 'workshop'
```

#### Chat_13_Domeniche_in_Movimento
```
⏳ F1-001 audit
⏳ 19 corsi KUQI* ora 'domenica_movimento'
```

#### Chat_14_BookGem, Chat_20_MerchSG,
#### Chat_23_Log, Chat_01_Quote_e_Promo
```
⏳ Tutti da avviare con F1-001 audit
⏳ Chat_01: riapri F1-015/F2-012
   (StarGem → WooCommerce sync)
```

### FUTURO
```
⏳ Delta import metà maggio
⏳ P5 STAFF insegnanti
⏳ Export PDF
⏳ StarGem → WooCommerce sync automatico
⏳ Clarissa CRM (sostituisce Bitrix)
⏳ GemTeam: GemPass a 14 dipendenti
⏳ Verifica email (link conferma)
⏳ SMS OTP per auto-registrazione
⏳ Light/Dark/Auto tema → Chat_26_Dashboard
```

---

## ⚠️ DEBITO TECNICO NOTO

```
1. street_address ghost column in members
   Soluzione: convertire VARCHAR→TEXT prima
   di poter fare DROP COLUMN

2. 8 membri senza CF
   Da completare manualmente in anagrafica

3. 179 persone non identificabili
   Da completare manualmente

4. participation_type misto
   'corso' + 'STANDARD_COURSE' coesistono
   Decidere in Chat_08

5. 3 SKU storico (contenitori import)
   QUOTATESSERA, DTYURI, DTNELLA
   NON TOCCARE — usati dal Smart Routing

6. team_scheduled_shifts = 17 (erano 225)
   team_shift_templates = 1 (erano 550)
   Cancellati durante test E2E GemTeam
   Reimportare da team_TURNI.xlsx
```

---

## 📊 STATO DB AL 27/04/2026

```
members                4.342 (8 senza CF flaggati)
memberships            3.305 (+24 da bonifica)
enrollments           13.584 (929 prove fixed)
payments               3.775
medical_certificates   2.867 (+97 da bonifica)
courses                  586 (285 SKU riclassificati)
```

### Activity type distribution courses (SKU 2526%)
```
course                289
workshop               27
corso                  14
domenica_movimento     13
campus                  4
storico                 3 ← NON TOCCARE
buono_regalo            1
merchandising           1
prova_gratuita          1
allenamenti             1
lezione_individuale     1
```

---

## 🏗️ INFRASTRUTTURA

```
DB: stargem_v2 / MariaDB 11.4
VPS: 82.165.35.145 (IONOS Ubuntu 24.04)
App: Plesk → stargem.studio-gem.it
Dev: localhost:5001
Tunnel DB: SSH porta 3307
TZ: Europe/Rome (.env + pm2)
Backup: /root/backups/ sul VPS

Stack:
  Frontend: React + TypeScript + Tailwind
            + React Query
  Backend: Node.js + Drizzle ORM
  DB: MariaDB 11.4 / stargem_v2
```

---

## 📐 REGOLE OPERATIVE PERMANENTI

```
FLUSSO PROTOCOLLI:
1. Claude chiede ad AG di analizzare
2. AG risponde con analisi e proposta
3. Claude valuta con Gaetano
4. Solo dopo → VAI
5. Il codice lo scrive sempre Antigravity

FORMATO PROTOCOLLI:
- Ogni risposta AG indica il numero:
  "Risposta F1-PROTOCOLLO-003"
- Ogni protocollo in un unico blocco
  pronto per copia-incolla
- 🔵 F1 (Backend) sempre PRIMA
- 🟢 F2 (Frontend) sempre DOPO
- Max 1 numero distanza tra F1 e F2
- Claude non emette nuovo protocollo
  finché il precedente non ha risposta

REGOLE TECNICHE:
- user_roles colonna: 'name' (non 'roleName')
- members.user_id → FK verso users.id
- payments: MAI DROP, solo ADD COLUMN
- members: ALTER bloccato (row size limit)
- medical_certificates: sempre da qui,
  mai dal campo legacy in members
- CF: chiave univoca assoluta
- Formato tessera: 2526-000042 (con trattino)
- 3 SKU storico contenitori: non toccare
- street_address: ghost column accettata

UI/UX:
- Card attività: chiuse di default
- Header attività: doppio contatore
  "12 schede · 487 iscritti"
- Coerenza Calendario ↔ Iscritti
- UI FREEZE su calendar.tsx e attivita.tsx
  finché collaudo Gemdario non completato
```

---

## 🗓️ ORDINE APERTURA CHAT SUGGERITO

```
1. Chat_24_DB_Monitor  → mappa sempre visibile
2. Chat_05_GemPass     → bug UI tessere
3. Chat_06_Contabilità → rollback pagamenti
4. Chat_12_Gemdario    → bug Planning
5. Chat_08_Corsi       → participation_type
6. Chat_10_Utenti      → CF real-time + campi
7. Chat_04_MedGem      → audit + UI
8. Chat_09_Workshop    → audit + UI
9. Chat_07_Gemory      → audit + seed Trello
10. Altre chat in coda
```
