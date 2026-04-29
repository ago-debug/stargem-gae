# RECAP_22b_ImportExportBonifica
> Aggiornato: 2026_04_28_1700 (convertito da originale 2026_04_27_1235)
> Stato chat: ✅ ENTRAMBE LE FASI CHIUSE (25/04 ImportExport, 26/04 Bonifica)
> Ultimo protocollo: F1-010 / F2-007 (chat fase Bonifica)
> Nota: Chat_22b ha avuto due fasi consecutive — questo recap le copre entrambe

---

## 1. SCOPO E PERIMETRO

Chat dedicata a 2 fasi consecutive di lavoro sui dati storici:
- **Fase 1 — ImportExport (25/04):** strumenti di esportazione (date IT,
  booleani Sì/No, strong typing, streaming), maschera input completa,
  sanitizzazione dati `members` (UPPER/LOWER/TITLE CASE), normalizzazione
  retroattiva di 3.949 record, refactoring `streetAddress→address`.
- **Fase 2 — Bonifica (26/04):** audit `enrollments`, migrazione orfani
  in tabelle dedicate (24 tessere, 97 certificati), riclassificazione
  285 SKU storici, Smart Routing import anti-recidiva, validazione CF
  algoritmo italiano, UI badge CF mancante.

NON gestisce: nessuna implementazione di moduli operativi (UI cassa, GemPass
fix, Anagrafica fix) — quelli sono delle rispettive chat dedicate.

Visibile a: tutti i ruoli interni che usano import/export.

---

## 2. STATO ATTUALE

### Cosa è già fatto (Fase 1 — F1-006/F2-007 chiuse 25/04)

**Export:**
- Date in formato IT GG/MM/AAAA in tutte le sezioni
- Booleani True/False → Sì/No
- Intestazione Excel coerente, anno 4 cifre
- TZ=Europe/Rome su VPS (.env + pm2)
- Strong typing colonne ExportWizard (date/boolean/string/number)
- Streaming chunk 500 record `/api/export` (prevenzione OOM)
- Route legacy `export-csv` e `export-csv-light` rimosse

**Maschera Input:**
- Tessera (numero, scadenza, stato) presente
- Pagamento (importo, data) presente
- Certificato letto da `medical_certificates` (non più dal campo
  legacy null in `members`)
- Verificato su 4 nominativi reali: CIFARELLI VALENTINA (14181),
  MIGNOLI RIANE CATERINA (17092), GNECCO GAIA (16645),
  MAZZONE DANIELA (15116)

**Sanitizzazione (`server/utils/sanitizer.ts`):**
- UPPER: cognome, nome, CF, città, provincia, regione, nazionalità,
  luogo nascita, n. albo, targa
- LOWER: email, email secondaria, PEC, facebook, sito web
- TITLE CASE: indirizzo, professione, titolo studio, banca, nomi tutori,
  contatti emergenza
- TRIM tutti i campi
- Lettera maiuscola dopo cifra/slash (58A, 12/G)
- Integrato in 5 punti di salvataggio + webhook WooCommerce

**Normalizzazione retroattiva:**
- 3.949 record `members` normalizzati con BEGIN/COMMIT
- `streetAddress → address` (12 file refactored)
- `street_address` ghost column DB (DROP impossibile per row size limit
  MariaDB 8126 byte — accettato come debito tecnico)

**Sezione `/importa`:**
- `sanitizeMemberData` pre-insert/update
- Tracking `modifiche_casing` nel dry-run
- Colonna "Modifiche Applicate" nel report CSV
- Banner avviso normalizzazione step finale

### Cosa è già fatto (Fase 2 — F1-010/F2-007 chiuse 26/04)

**Bonifica DB:**
- **OP1 — 24 tessere create**: 24 orfani QUOTATESSERA con CF migrati in
  `memberships`. 8 senza CF saltati e flaggati. `data_quality_flag='da_verificare'`.
- **OP2 — 97 certificati medici creati**: DTYURI/DTNELLA migrati in
  `medical_certificates`. `issue_date=enrollment_date`, `expiry_date=+1 anno`.
- **OP3 — 929 prove `season_id=1`**: filtrate per SKU PR2526*, PROVA2526*, ecc.
- **OP4 — Allenamento riclassificato**: corso 2526ALLENAMENTO da 'storico'
  ad 'allenamenti', 148 iscrizioni intatte e visibili.
- **OP5 — 285 SKU riclassificati**:
  - 27 → workshop (WS*, NATALE)
  - 19 → domenica_movimento (KUQI*, RUSSO, DOSSANTO)
  - 14 → corso (OPEN*, CUGGEGIO, storici)
  - 4 → campus (CAMPUSS1/S2)
  - 1 → lezione_individuale (LEZINDIVIDUALE)
  - 1 → prova_gratuita (LEZPROVA)
  - 1 → merchandising (MERCHANDISING)
  - 1 → buono_regalo (GIFT)
  - 3 → lasciati 'storico' (NON TOCCARE):
    `2526QUOTATESSERA`, `2526DTYURI`, `2526DTNELLA`

**Smart Routing import (anti-recidiva):**
- `shared/utils/cf-validator.ts` creato (algoritmo italiano:
  checksum, estrazione data nascita/sesso/codici nome-cognome)
- CF obbligatorio: blocco import se mancante o invalido
- CF valido ma incongruente con dati: warning
- Smart Routing in `/api/import/mapped`:
  - SKU con `QUOTATESSERA` → `memberships` automatico
  - SKU con `DTYURI` o `DTNELLA` → `medical_certificates` automatico
  - altri → `enrollments` con season_id forzato
- Blocco `season_id NULL` con conferma operatore
- UI dry-run arricchita: banner rosso CF/banner arancio stagione/
  banner blu Smart Routing stats

**UI Badge CF MANCANTE:**
- 8 membri segnalati con badge rosso in `members.tsx`,
  `anagrafica-home.tsx`, `gempass.tsx`
- Bottone "Crea Tessera" disabilitato con tooltip esplicativo
- I 8 senza CF: BELLONI HELLEN, BOCCHETTI MALTSEVA EKATERINA,
  BURANI SARA, CIONI BIANCA, GIACOSA CHIARA, GULIZIA GABRIELE,
  MONTANI FRANCESCA, MOUTIQ JAMILIA

### Cosa è in corso
- Niente. Entrambe le fasi sono chiuse.

### Cosa è bloccato
- 8 membri senza CF: tesseramento bloccato finché non si completa CF.
- 179 persone con `nome_match`: non identificabili automaticamente,
  da workflow manuale dedicato.

---

## 3. TABELLE DB COINVOLTE

| Tabella | Operazione | Record toccati |
|---|---|---|
| `members` | normalizzazione + flag CF | 3.949 normalizzati / 8 flaggati |
| `memberships` | inserimento da bonifica | +24 |
| `medical_certificates` | inserimento da bonifica | +97 |
| `enrollments` | OP3 season_id update | 929 |
| `courses` | OP4+OP5 activity_type update | 1+285 = 286 |

### Distribuzione finale `activity_type` per SKU 2526*
| activity_type | count |
|---|---|
| course | 289 |
| workshop | 27 |
| corso | 14 |
| domenica_movimento | 13 |
| campus | 4 |
| storico | 3 (contenitori — non toccare) |
| buono_regalo | 1 |
| merchandising | 1 |
| prova_gratuita | 1 |
| allenamenti | 1 |
| lezione_individuale | 1 |

---

## 4. FILE CHIAVE NEL CODEBASE (creati/modificati)

### File NUOVI
- `server/utils/sanitizer.ts` — sanitizzazione UPPER/LOWER/TITLE CASE
- `shared/utils/cf-validator.ts` — algoritmo italiano CF

### File MODIFICATI (key)
- `server/routes.ts` — Smart Routing import
- `client/src/components/ExportWizard.tsx` — strong typing + streaming
- `client/src/pages/import-data.tsx` — UI dry-run banner
- `client/src/pages/maschera-input-generale.tsx` — fix campi tessera/cert
- `client/src/pages/members.tsx` — badge CF MANCANTE
- `client/src/pages/anagrafica-home.tsx` — alert CF
- `client/src/pages/gempass.tsx` — bottone disabilitato + tooltip
- `shared/schema.ts` — rimosso `street_address` (resta ghost in DB)
- 12 file frontend (refactoring `streetAddress → address`)

---

## 5. DECISIONI ARCHITETTURALI APERTE

Tutte le decisioni di Chat_22b sono state **prese e attuate** durante
le due fasi. Nessuna decisione resta aperta in questa chat.

Decisioni con eredità su altre chat:
- `street_address` ghost column accettata come debito tecnico
- 3 SKU contenitori (`QUOTATESSERA`, `DTYURI`, `DTNELLA`) lasciati
  intenzionalmente come `activity_type='storico'` per il funzionamento
  di Smart Routing import

---

## 6. PROTOCOLLI ESEGUITI

### Fase 1 — ImportExport (25/04)
- F1-001 / F2-001 — ✅ Fix Export
- F1-002 — ✅ Infrastruttura VPS
- F2-002 — ✅ Middleware sanitizzazione
- F2-003 — ✅ Fix `toTitleCase` civici
- F1-003 — ✅ Diagnosi `street_address`
- F1-004b — ✅ Refactoring `streetAddress→address`
- F1-005 — ✅ Sanitizzazione import + tracking
- F2-005 — ✅ Banner avviso normalizzazione
- F1-006 — ✅ Strong typing + streaming + cleanup
- F2-004/F2-006/F2-007 — ✅ Maschera Input fix completo
- Ultimo commit: `028531a`

### Fase 2 — Bonifica (26/04)
- F1-001 → F1-010 — ✅ tutti chiusi (audit + 5 OP bonifica + Smart Routing)
- F2-001 → F2-007 — ✅ tutti chiusi (UI badge + banner dry-run)

---

## 7. PENDENTI

Nessun pendente nella chat stessa (entrambe chiuse). Pendenti **ereditati**
in altre chat (vedi sezione 8):

1. Chat_05_GemPass: bug UI campi che mostrano "—", `membership_events`,
   "Assegna Tessera", revisione 24 tessere bonifica
2. Chat_06_Contabilità: rollback import pagamenti, sezione buoni regalo
3. Chat_08_Corsi: uniformare `participation_type`, badge status
4. Chat_10_Utenti: collegamento `cf-validator.ts` al form, validazione
   telefono/email real-time
5. Chat_24_DB_Monitor: cruscotto monitoraggio DB
6. Segreteria: completare CF di 8 membri, revisionare 24 tessere
   `da_verificare`, completare 179 persone non identificabili

---

## 8. INTERSEZIONI CON ALTRE CHAT

Chat_22b ha **fornito infrastrutture** alle altre chat:

- **Chat_05_GemPass** — eredita 24 tessere create + 8 flag CF mancante
- **Chat_06_Contabilità** — eredita ExportWizard + Smart Routing import.
  Pendente: rollback pagamenti.
- **Chat_08_Corsi** — eredita 285 SKU riclassificati + Smart Routing.
  Pendente: uniformare participation_type.
- **Chat_10_Utenti** — eredita `sanitizer.ts` + `cf-validator.ts`.
  Pendente: collegare validatore al form.
- **Chat_22_ImportExport** — Chat_22 ufficiale chiusa il 25/04 (F1-054).
  Chat_22b è il prosieguo non originariamente previsto.

---

## 9. NOTE PER LA PROSSIMA SESSIONE

- **`payments` MAI DROP** — solo `ADD COLUMN`. PaymentModuleConnector
  impatta 14 route.
- **`members` ALTER bloccato** per row size limit MariaDB 8126 byte.
  `street_address` resta ghost column.
- **3 SKU contenitori NON toccare**: `QUOTATESSERA`, `DTYURI`, `DTNELLA`.
- **`participation_type` misto** (`'corso'` + `'STANDARD_COURSE'`):
  da risolvere in Chat_08.
- **Smart Routing è anti-recidiva**: i nuovi import del delta metà maggio
  sono già protetti.
- **CF validator** già presente, da collegare al form in Chat_10.
- **`sanitizer.ts` automatico**: nessun bisogno di logica duplicata
  in nuovi form.
- **Backup chiusura Fase 1**: `CHAT22B_PRE_CAPITALIZZAZIONE_20260425.sql`
- **Backup chiusura Fase 2**: `CHAT22B_BONIFICA_OP1235_20260426.sql`
- **TZ=Europe/Rome** configurato su VPS — date sempre in fuso italiano.

---

*Aggiornato l'ultima volta da: Claude (chat di Analisi) in data 2026_04_28_1700
basato su: RECAP_COMPLETO_Sessioni_22b_2026_04_27_1235*
