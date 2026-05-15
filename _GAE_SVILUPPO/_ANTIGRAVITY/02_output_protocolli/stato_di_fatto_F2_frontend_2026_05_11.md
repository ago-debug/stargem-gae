# STATO DI FATTO REALE FRONTEND F2
**Data Audit:** 11 Maggio 2026
**Autore:** Antigravity (Senior Frontend Engineer)

Questo documento rappresenta la fotografia reale e oggettiva del codice frontend (React/Vite) di StarGem Manager, derivata esclusivamente dall'ispezione diretta dei sorgenti.

---

## 1. Calendario & Planning (Operatività Quotidiana e Strategica)

### Stato funzionale REALE
- 🟡 IN COLLAUDO / UI FREEZE (come deducibile dai recenti bug e dalla mole di codice ancora fusa)

### File chiave nel codebase frontend
- `client/src/pages/calendar.tsx` (3.500+ righe)
- `client/src/pages/planning.tsx`
- `client/src/components/CourseUnifiedModal.tsx`
- `client/src/components/CourseDuplicationWizard.tsx`

### Endpoint API consumati
- `GET /api/courses` (e derivati per workshop/eventi)
- `GET /api/config/center-hours`
- `GET /api/custom-lists/*` (categorie, tag interni, stati)
- `POST /api/attendances/bulk`

### Componenti shadcn/ui usati
- `Card`, `Select`, `Dialog`, `Tabs`, `Table`, `Popover`, `Command`

### Bug noti / TODO / FIXME / early return
- Numerosi `return null` per gestire eccezioni di rendering o dati mancanti.
- Logica di "auto-advance" stagionale commentata di recente come fix operativo (`calendar.tsx`).
- Raggruppamento corsi sul planning segnalato come critico (bug master).

### Stato del design e coerenza UX
- Design molto denso. La griglia temporale è calcolata tramite un mix di flexbox e posizionamento assoluto interpolato con `ResizeObserver` (Phase 19 Time-Space elastico).
- **Problema:** Il componente del calendario è un monolite in cui presentation logic e business logic si fondono, rendendolo prono a regressioni silenziose.

### Osservazioni del senior engineer
Il calendario è una "bomba a orologeria" per la manutenibilità. La mancanza di separazione tra gli engine di rendering (ore/sovrapposizioni) e la fetch dei dati rende impossibile testare le logiche in isolamento.

---

## 2. CRM & Segreteria (Maschera Input Generale)

### Stato funzionale REALE
- 🟢 IN PRODUZIONE (ma estremamente fragile)

### File chiave nel codebase frontend
- `client/src/pages/maschera-input-generale.tsx` (4.500+ righe)
- Sottocartella `client/src/components/crm/` (`TabAnagrafica.tsx`, `TabIscrizioni.tsx`, `CrmFormContext.tsx`)
- `client/src/pages/members.tsx`

### Endpoint API consumati
- `GET /api/members`
- `GET /api/medical-certificates`
- `GET /api/memberships`
- Miriade di `POST/PATCH` destinate a `server/routes.ts`

### Componenti shadcn/ui usati
- `Accordion`, `Input`, `Checkbox`, `Tabs`, `Table`

### Bug noti / TODO / FIXME / early return
- Presenti diversi workaround e logiche `if (!data) return <Skeleton />`.
- Il context della form CRM (`CrmFormContext`) causa attualmente errori di tipizzazione TypeScript.

### Stato del design e coerenza UX
- È la pagina più complessa. L'UX è orientata alla velocità (wizard multi-step / tab), ma il coupling del global state interno è così alto che se fallisce la validazione Zod su una tab nascosta, il form intero si paralizza senza feedback visivo esplicito per l'utente.

### Osservazioni del senior engineer
Nonostante lo sforzo di spacchettamento nella cartella `crm/`, il file principale gestisce un payload di salvataggio mostruoso. Dovremmo passare a un pattern "auto-save" per tab, separando il salvataggio anagrafico dal checkout commerciale.

---

## 3. Corsi & Attività Didattiche

### Stato funzionale REALE
- 🟢 IN PRODUZIONE (Rifattorizzato di recente)

### File chiave nel codebase frontend
- `client/src/pages/courses.tsx`
- `client/src/pages/iscritti_per_attivita.tsx`
- `client/src/pages/scheda-attivita.tsx`
- `client/src/components/activity-management-page.tsx`
- `client/src/components/activity-accordion-card.tsx`

### Endpoint API consumati
- API unificate per il fetching tramite Single Table Inheritance (STI).

### Componenti shadcn/ui usati
- `Accordion`, `Card`, `Badge` (colorati in base a esadecimali hardcoded o token Tailwind `stargem-red`), `Table`.

### Bug noti / TODO / FIXME / early return
- Fix "early return" su contenitori vuoti o anomali come `2526ALLENAMENTO` inseriti per scongiurare white screens of death.
- TODO sparsi per la gestione uniforme dei `participant_type`.

### Stato del design e coerenza UX
- È il modulo che funziona meglio oggi. L'unificazione dell'`activity-management-page` e l'introduzione dei badge coerenti hanno abbattuto il debito tecnico visivo di questa sezione.

### Osservazioni del senior engineer
Ottimo lavoro di standardizzazione. Da estendere urgentemente al Planning. I "pennini A/B" (`inline-list-editor`) per le modifiche rapide sono un pattern UX eccellente e molto apprezzato.

---

## 4. Contabilità & Pagamenti

### Stato funzionale REALE
- 🟡 IN COLLAUDO (per alcune integrazioni di ricevute) / 🟢 IN PRODUZIONE per lo storico

### File chiave nel codebase frontend
- `client/src/pages/payments.tsx`
- `client/src/pages/accounting-sheet.tsx`
- `client/src/pages/listini.tsx`
- `client/src/components/nuovo-pagamento-modal.tsx`
- `client/src/components/PaymentModuleConnector.tsx`

### Componenti shadcn/ui usati
- `Table` (massivamente), `Select`, `Dialog`.

### Bug noti / TODO / FIXME / early return
- Accoppiamento pericoloso tra listini (`courseQuotesGrid`) e logiche interne di ricalcolo a frontend. 
- Checkout bloccato per prevenire manomissioni manuali, ma il `PaymentModuleConnector` ha diramazioni difficili da tracciare.

### Stato del design e coerenza UX
- Funzionale, ma arido. La `accounting-sheet` è una griglia dati pura, fortunatamente mitigata dal componente unificato `ExportWizard.tsx` che standardizza l'estrazione CSV/Excel.

### Osservazioni del senior engineer
Manca uno state-machine manager puro (Redux/Zustand slice dedicato) per il carrello. I pagamenti sono l'area a più alto rischio di regressione business.

---

## 5. Utilità Globali & AI

### Stato funzionale REALE
- 🟢 IN PRODUZIONE

### File chiave nel codebase frontend
- `client/src/components/teo-copilot.tsx`
- `client/src/components/command-palette.tsx`
- `client/src/components/ExportWizard.tsx`

### Osservazioni del senior engineer
L'architettura dei wrapper (es. Command Palette e l'AI SDK Vercel) è snella e disaccoppiata dal core. Nessun debito tecnico rilevante qui.

---

## SINTESI ESECUTIVA

### Top 3 sezioni UX che funzionano meglio
1. **Liste Attività / Corsi:** Standardizzate, modulari, veloci.
2. **Esportazioni:** L'`ExportWizard` ha uniformato ogni tabella del gestionale in modo elegante.
3. **Assistenza Globale (Teo Copilot / Command Palette):** Integrati senza sporcare i layout storici.

### Top 3 sezioni che mi preoccupano di più
1. **Maschera Input (CRM):** Monolite non testabile, incline a blocchi di stato.
2. **Calendario / Planning:** Difficoltà estreme nel mantenere il rendering temporale consistente su display e fusi orari diversi.
3. **Prezzaggio e Checkout:** Il listino quote è disperso tra backend e ricalcoli frontend nel modale di pagamento.

### Stato dei monoliti
- **`maschera-input-generale.tsx` (4.5k righe) & `calendar.tsx` (3.5k righe):** Entrambi sono al limite dell'umana manutenibilità. Il primo necessita di uno split di stato (Zustand), il secondo di un engine headless che gli fornisca la griglia pre-calcolata.

### Validazione Automatica (Regola 14)
Al termine dell'ispezione, ho eseguito il comando `npx tsc --noEmit`. 
**Esito:** 🔴 FALLITO (Codice Uscita 2).
Sono emersi 4 errori concentrati nel sistema CRM, che confermano la fragilità strutturale della gestione stato della maschera:
- `client/src/components/crm/TabAnagrafica.tsx`
- `client/src/components/crm/TabGift.tsx`
- `client/src/pages/maschera-input-generale.tsx:2005` (Errore di tipizzazione sul prop `setVerificaStato` passato dal context).

### Raccomandazioni di priorità
1. **Fissare i 4 errori TypeScript** emersi dal compilatore nel comparto CRM prima di qualsiasi altra feature anagrafica.
2. **Spacchettare il `calendar.tsx`** creando un hook `useTemporalGrid` per sbloccare la UI Freeze in sicurezza.
3. **Isolare i 54 campi anagrafici** richiesti in un modale/tab distaccato della maschera input per non appesantire ulteriormente il payload principale.
