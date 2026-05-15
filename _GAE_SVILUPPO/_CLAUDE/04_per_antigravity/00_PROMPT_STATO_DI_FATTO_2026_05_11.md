---
tags: [antigravity, stato-di-fatto, reset, audit-codebase]
aggiornato: 2026-05-11
tipo: prompt-audit
---

# 🔍 STATO DI FATTO REALE — Audit Codebase StarGem — 2026_05_11

## Contesto

Tutta la documentazione precedente in `_GAE_SVILUPPO/_CLAUDE/` e `_GAE_SVILUPPO/_ANTIGRAVITY/` è stata **archiviata** in `99_archivio/2026_05_11_RESET_TOTALE/`. Conteneva informazioni datate, decisioni superate, e stati non più allineati con il codice reale.

Gaetano (e Claude in Cowork con lui) hanno bisogno di **ricostruire da zero lo stato di fatto del gestionale**, basandosi SOLO sull'ispezione diretta del codice e del database. Niente più assunzioni su "cosa è stato fatto", "cosa è in corso", "cosa funziona": solo evidenze dal codebase oggi.

## Due prompt mirati: F1 backend + F2 frontend

Apri due finestre AG. Una per F1 (Backend), una per F2 (Frontend). In ognuna incolla il prompt corrispondente sotto. Lavorano **in parallelo**, ognuno sul suo lato del codebase.

---

## 🅰️ PROMPT F1 — Stato di Fatto BACKEND

Copia-incolla nella finestra **AG-F1**:

```
PER AG-F1 (BACKEND) — STATO DI FATTO REALE

VINCOLO TASSATIVO: NON leggere ALCUN file in _GAE_SVILUPPO/ TRANNE l'unico ammesso: _GAE_SVILUPPO/00_LEGGIMI.md (per le regole inviolabili). Tutto il resto di _GAE_SVILUPPO/ (cartelle _CLAUDE/, _ANTIGRAVITY/, 99_archivio/) è da CONSIDERARE INESISTENTE per questa sessione. Contiene informazioni vecchie e fuorvianti.

PRIMA AZIONE OBBLIGATORIA
1. Leggi SOLO _GAE_SVILUPPO/00_LEGGIMI.md (per ricordarti le regole d'oro)
2. Conferma in chat: "Letto il LEGGIMI. NON leggerò altro di _GAE_SVILUPPO/. Procedo con audit del codebase reale."

OBIETTIVO
Produrre un documento di STATO DI FATTO REALE del backend StarGem al 2026-05-11, basato esclusivamente sull'ispezione diretta di:
- shared/schema.ts e cartella shared/ (schema DB, types)
- server/routes.ts e cartella server/ (route, storage, middleware, logger, ecc.)
- migrations/ (storico evoluzione DB)
- scripts/ (utility, backup, deploy)
- DB stargem_v2 via query READ-ONLY (DESCRIBE, SHOW COLUMNS, SELECT COUNT)
- file di config (drizzle.config.ts, package.json, .env vincoli noti)

METODO (read-only)
1. Identifica autonomamente le MACRO-SEZIONI FUNZIONALI del gestionale guardando il codice. Non basarti su una tassonomia preesistente. Esempi possibili (modifica/aggiungi/togli secondo cosa vedi davvero): Auth, Members/Anagrafica, Memberships/Tessere, Medical Certificates, Payments/Cassa, Enrollments, Courses STI, Calendar, Planning, GemTeam, GemStaff, MedGem, Quote&Promo/Listini, Import/Export, AI Integration (Sentry/PostHog/Vercel SDK), Logging&Audit, DB Monitor, Booking Studios, Strategic Events.
2. Per ogni macro-sezione, ispeziona il codice e il DB.
3. Riporta lo stato OSSERVATO, non quello che immagini o ricordi.

DELIVERABLE
File: _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/stato_di_fatto_F1_backend_2026_05_11.md

Struttura del documento (per OGNI macro-sezione rilevata):

## [Nome sezione auto-rilevato]

### Stato funzionale REALE (osservato dal codice + DB, NON ricordato)
- 🟢 IN PRODUZIONE e funzionante: [cosa e come lo deduci]
- 🟡 IN COLLAUDO / parzialmente implementato: [cosa e perché]
- 🔴 NON FUNZIONANTE / bug noti nel codice: [cita TODO, FIXME, commenti "BROKEN", "WIP"]
- ⬜ NON IMPLEMENTATO: [cosa manca o è solo placeholder]

### File chiave nel codebase
- `path/al/file.ts` — descrizione 1 riga
- ...

### Tabelle DB coinvolte
Esegui SELECT COUNT(*) per ognuna e riporta:
| Tabella | Record reali (oggi) | Colonne totali | Note osservate |
|---|---|---|---|
| `nome_tab` | NNN | M | flag, FK, ecc. |

### Route API esposte
Solo lista (metodo + path + 1 riga descrizione). NON il corpo della logica.

### Bug noti / TODO / FIXME nel codice
Esegui grep per "TODO", "FIXME", "BROKEN", "WIP", "HACK", "XXX" in server/ e shared/.
Lista risultati pertinenti alla sezione.

### Test esistenti
Esistono test per questa sezione in tests/ o __tests__/? Se sì quanti.

### Migrations rilevanti
Le ultime migrations che hanno toccato questa sezione (data + descrizione breve).

### Osservazioni del senior engineer
2-3 righe di tua opinione tecnica sulla sezione: livello di solidità, fragilità note, urgenze osservate.

---

Dopo aver coperto tutte le macro-sezioni backend, chiudi con:

## SINTESI ESECUTIVA
- Top 3 sezioni che funzionano meglio (e perché)
- Top 3 sezioni che ti preoccupano di più (e perché)
- Cose che il MASTER_STATUS appena archiviato diceva diversamente da quello che vedi oggi nel codice (incoerenze)
- Raccomandazioni di priorità basate sull'osservato reale

REGOLE DI ESECUZIONE
- Validazione automatica come da regola 14 del 00_LEGGIMI: dopo aver finito, `npx tsc --noEmit` + verifica che il documento sia salvato.
- Nessuna modifica al codice produttivo, nessuna scrittura DB.
- Tempo previsto: 60-120 minuti per fare un audit serio.

STOP & GO: niente modifiche. Solo lettura + scrittura del documento. Aspetta Gaetano per ogni step successivo.
```

---

## 🅱️ PROMPT F2 — Stato di Fatto FRONTEND

Copia-incolla nella finestra **AG-F2**:

```
PER AG-F2 (FRONTEND) — STATO DI FATTO REALE

VINCOLO TASSATIVO: NON leggere ALCUN file in _GAE_SVILUPPO/ TRANNE l'unico ammesso: _GAE_SVILUPPO/00_LEGGIMI.md (per le regole inviolabili). Tutto il resto di _GAE_SVILUPPO/ (cartelle _CLAUDE/, _ANTIGRAVITY/, 99_archivio/) è da CONSIDERARE INESISTENTE per questa sessione. Contiene informazioni vecchie e fuorvianti.

PRIMA AZIONE OBBLIGATORIA
1. Leggi SOLO _GAE_SVILUPPO/00_LEGGIMI.md (per ricordarti le regole d'oro)
2. Conferma in chat: "Letto il LEGGIMI. NON leggerò altro di _GAE_SVILUPPO/. Procedo con audit del codebase reale."

OBIETTIVO
Produrre un documento di STATO DI FATTO REALE del frontend StarGem al 2026-05-11, basato esclusivamente sull'ispezione diretta di:
- client/src/pages/ (pagine, route React)
- client/src/components/ (componenti, ExportWizard, modali, ecc.)
- client/src/hooks/ (custom hooks)
- client/src/lib/ (queryKeys, providers, utilities)
- client/src/styles/ + tailwind.config.js (theming, design tokens)
- client/src/contexts/ (state condiviso, auth)
- client/src/i18n/ (se esiste — verifica)
- file di config (vite.config.ts, package.json, tsconfig)
- Sentry / PostHog config se presenti

METODO (read-only)
1. Identifica autonomamente le MACRO-SEZIONI FUNZIONALI dell'UI guardando il codice. Possibili: Anagrafica/Members, GemPass, GemStaff, GemTeam, MedGem, Pagamenti/Cassa, Calendario, Planning, Quote/Promo, Iscrizioni/Corsi, Import/Export, Workshop, Gemory, Area Tesserati, Auth/Login, TeoCopilot, ecc. Adatta secondo cosa trovi davvero.
2. Per ogni macro-sezione, ispeziona le pagine + componenti + hooks pertinenti.

DELIVERABLE
File: _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/stato_di_fatto_F2_frontend_2026_05_11.md

Struttura del documento (per OGNI macro-sezione rilevata):

## [Nome sezione auto-rilevato]

### Stato funzionale REALE (osservato dal codice, NON ricordato)
- 🟢 IN PRODUZIONE: [cosa funziona]
- 🟡 IN COLLAUDO / parzialmente implementato: [...]
- 🔴 BUG NOTI / regressioni: [cita TODO, FIXME, commenti tipo "BROKEN", "WIP", "@deprecated"]
- ⬜ STUB / placeholder / non implementato: [...]

### File chiave nel codebase frontend
- `client/src/pages/...` — descrizione
- `client/src/components/...` — descrizione

### Endpoint API consumati
Quali route /api/* questa sezione chiama. Solo lista, non logica.

### Componenti shadcn/ui usati
Lista breve dei componenti shadcn principali (Modal, Tab, Sheet, ecc.).

### Bug noti / TODO / FIXME / "early return per evitare crash"
Esegui grep per "TODO", "FIXME", "BROKEN", "WIP", "HACK", "early return", "if.*return null.*crash", "deprecated" nei file della sezione.

### Test esistenti
Esistono test per questa sezione? Se sì quanti.

### Stato del design coerenza UX
- Pattern unificato (es. scheda-corso style)?
- Divergenze rispetto al resto?
- Dipende da componenti monolitici (es. maschera-input-generale.tsx)?

### Osservazioni del senior engineer
2-3 righe di tua opinione tecnica: solidità, fragilità note, urgenze osservate.

---

Dopo aver coperto tutte le macro-sezioni frontend, chiudi con:

## SINTESI ESECUTIVA
- Top 3 sezioni UX che funzionano meglio (e perché)
- Top 3 sezioni che ti preoccupano di più (e perché)
- Stato dei monoliti: `maschera-input-generale.tsx`, `calendar.tsx`, `routes.ts` coupling — è ancora quello che dicevi nello strategic review del 11/05 mattina o è cambiato qualcosa?
- Raccomandazioni di priorità basate sull'osservato reale

REGOLE DI ESECUZIONE
- Validazione automatica come da regola 14 del 00_LEGGIMI: dopo aver finito, `npx tsc --noEmit` + verifica che il documento sia salvato.
- Nessuna modifica al codice produttivo.
- Tempo previsto: 60-120 minuti per un audit serio.

STOP & GO: niente modifiche. Solo lettura + scrittura del documento. Aspetta Gaetano per ogni step successivo.
```

---

## Cosa succede quando entrambi finiscono

Quando AG-F1 e AG-F2 hanno scritto i due documenti `stato_di_fatto_F1_backend_2026_05_11.md` e `stato_di_fatto_F2_frontend_2026_05_11.md`, Claude (Cowork) li leggerà e:

1. Identificherà eventuali divergenze tra cosa F1 e F2 dicono di parti condivise
2. Costruirà un **nuovo MASTER_STATUS** basato esclusivamente su questi due documenti (zero residui dal vecchio)
3. Costruirà eventualmente un nuovo ANALISI_MASTER se serve
4. Solo a quel punto si tornerà a parlare di priorità e prossimi task — basati sul reale

Tempo totale stimato (sessione AG + scrittura nuovi canonici): 2-3 ore di lavoro AG + 30-60 min di Claude.

---

*Prompt creato da Claude (Cowork) — 2026_05_11 — post reset totale*
