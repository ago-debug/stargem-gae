---
tags: [analisi, strategic-review, sintesi, post-pausa]
aggiornato: 2026-05-11
tipo: sintesi-strategica
fonti:
  - _ANTIGRAVITY/02_output_protocolli/strategic_review_F1_backend_2026_05_11.md
  - _ANTIGRAVITY/02_output_protocolli/strategic_review_F2_frontend_2026_05_11.md
---

# 📊 Strategic Review — Sintesi Convergente — 2026_05_11

> Collegati: [[00_INDEX]] · [[MASTER_STATUS]] · [[ANALISI_MASTER]]
> Fonti: strategic_review_F1_backend_2026_05_11.md (AG-F1) + strategic_review_F2_frontend_2026_05_11.md (AG-F2)

## Scopo

Sintesi delle due review parallele di Antigravity (F1 backend + F2 frontend). Identifica:
- **CONVERGENZE** = certezze su cui muoversi senza ulteriore discussione
- **DIVERGENZE** = decisioni che richiedono scelta di Gaetano
- **PUNTI NUOVI** = aspetti non considerati prima che meritano integrazione
- **CLEANUP** = file da archiviare con consenso

---

## 1. Convergenze (certezze)

### 1.1 Multi-tool Claude Code Agent Teams in parallelo → DEFINITIVAMENTE NO
F1: *"Devastanti. Se altri agenti toccano il monolite routes.ts o lo schema.ts mentre lo faccio anch'io, finiremo nell'inferno dei merge conflict"*
F2: *"Altamente sconsigliato. Lock di file, conflitti Git irrisolvibili, responsabilità ambigue sui bug"*

**Conseguenza:** il pilota Claude Code Agent Teams resta parcheggiato (era già in memory `project_stargem_agent_teams_pilot.md`). Va aggiornata la memoria con questo verdetto definitivo.

### 1.2 `routes.ts` (12k righe) — spacchettare modulo-per-modulo, con supervisione manuale
F1: *"1-2 settimane di lavoro chirurgico in puro isolamento"*
F2: *"L'unica via sicura. Qualsiasi refactoring automatico massivo inietterebbe bug logici devastanti"*

**Conseguenza:** quando lo si farà, sarà un workstream dedicato senza altri lavori paralleli sul backend.

### 1.3 `maschera-input-generale.tsx` (4.500 righe) — stesso pattern, 2-3 settimane
F2: *"Spacchettare in micro-form governati da un global state (es. Zustand)"*

Coupling fortissimo con `routes.ts` perché *"fa da passacarte per payload pachidermici"*. Il refactor frontend è semi-bloccato dal refactor backend.

### 1.4 `PaymentModuleConnector` + 14 route — disaccoppiare
F1: *"Design da NON ripetere. 3-5 giorni per estrarre tutto in un service dedicato"*
F2: *"1-2 settimane per estrarre una vera libreria di prezzaggio frontend (es. usePricingEngine) sincronizzata col Listino Stagionale"*

**Conseguenza:** quando si farà, F1 + F2 in tandem.

### 1.5 Tessere e certificati medici dentro `members` — è debito storico, ma migrare ORA è rischioso
F1: *"È debito tecnico nato dall'import piatto di GSheets. Decine di API e UI leggono ancora members.hasMedicalCertificate. Se eliminiamo le colonne oggi, la UI crasha."*

**Conseguenza:** la bonifica va fatta in due step:
1. Refactor route API per fare JOIN su `memberships` e `medical_certificates` (ricollegamento)
2. Solo dopo: drop delle colonne da `members`

Inversione = crash UI garantito.

### 1.6 PRIORITA 1b (Fix UI campi nascosti) è valida ma con sequenza precisa
Entrambi concordano: prima ricollegamento alle tabelle dedicate (JOIN), poi esposizione UI. Non si possono mostrare campi che potrebbero essere droppati la settimana dopo.

### 1.7 Cleanup di `02_output_protocolli/` confermato
Tutti i `audit_F1-*`, `report_F1-*`, `audit_F2-*`, `report_F2-*` di 28-29 aprile sono riferiti a Chat_08 (Corsi) ormai chiusa e rendicontata nel MASTER_STATUS. Archiviazione in `99_archivio/` raccomandata da entrambi.

---

## 2. Divergenze (decisioni richieste a Gaetano)

### 2.1 Priorità #1 assoluta — backend-first o user-first?

| | F1 (Backend) | F2 (Frontend) |
|---|---|---|
| **P1 assoluta** | Riprendere smantellamento `routes.ts` | Sbloccare UI FREEZE 12_Gemdario (bug Planning) |
| **P2** | Fix UI tessere (ricollegamento a memberships) | Fix UI campi nascosti 54 campi Athena |
| **P3** | Reimport turni GemTeam | Refactor calendar.tsx (estrazione hook) |

**Lettura strategica:** F1 vede il rischio infrastrutturale (`routes.ts` che può esplodere), F2 vede il valore utente bloccato (calendario fermo, campi non visibili).

**Raccomandazione Claude:** **F2 prima** (3-4 settimane), **F1 subito dopo** (2-3 settimane).
- F2 sblocca valore percepito immediato per la segreteria
- F1 (smantellamento `routes.ts`) richiede focus esclusivo senza distrazioni → meglio quando le emergenze utente sono risolte
- Sequenza: Gemdario unfreeze → Fix campi nascosti → routes.ts → maschera-input

### 2.2 Tab "Incolla Testo" in `/importa` — fare o non fare?

F1: non lo menziona esplicitamente.
F2: *"Inutile complicazione UX. Il flusso CSV/Excel va benissimo. Non bruciamo risorse qui."*

**Conseguenza:** il **Task 2** della lista parallela ([[02_LISTA_TASK_PARALLELI_2026_05_11]]) viene messo in discussione. F2 ha ragione: prima del re-import vero, Gaetano sta caricando da Excel — il tab Testo è marginale.

**Decisione richiesta:** confermare la cancellazione del Task 2 dalla lista parallela.

### 2.3 La scelta architetturale STRADA A/B/A+B per `/importa` (campi dinamici)
Nessuno dei due la affronta esplicitamente. Resta APERTA. Tema su cui Gaetano deve decidere.

**Riferimento:** `_ANTIGRAVITY/02_output_protocolli/StopAndGo_CampiDinamici.md` (04/05).

---

## 3. Punti nuovi emersi (da integrare)

### 3.1 Inserire `tenant_id` (default '1') nelle NUOVE tabelle — F1
Costo: trascurabile oggi. Beneficio: salva 6-12 mesi al momento della migrazione SaaS.

**Azione:** aggiornare convenzioni di schema in `00_LEGGIMI.md` per imporre `tenant_id` su qualunque tabella nuova creata da oggi in poi.

### 3.2 Integrare i18n (es. `react-i18next`) anche solo wrapper italiano — F2
Costo: 1-2 giorni di setup + abitudine a `t('chiave')` invece di stringhe hardcoded.
Beneficio: evita di riscrivere 400 componenti tra un anno.

**Azione:** task dedicato da inserire nei prossimi 30 giorni.

### 3.3 Hook `usePermission(resource, action, tenantId)` centralizzato — F2
Sostituisce la matrice piatta `if (user.role === 'admin')`. Step verso RBAC multi-tenant.

**Azione:** task dedicato, non urgente, ma da pianificare prima del SaaS.

### 3.4 Standardizzare cache keys React Query — F2
*"La gestione manuale delle invalidazioni cache ci ha tradito spesso."*

**Azione:** creare `client/src/lib/queryKeys.ts` con tutte le chiavi come costanti. Refactor incrementale.

### 3.5 `ActivityLayout` agnostico — F2
Per impedire la divergenza delle 5 schede (Corso, Allenamento, Domeniche, Lezione Individuale, Campus).

**Azione:** task di consolidamento, da fare prima che diventi caos.

### 3.6 `tenant_id` nei vincoli UNIQUE su `users.email` e `members.fiscal_code` — F1
Bloccante per multi-tenant: senza chiave composita `(tenant_id, email)` non si possono avere stessi utenti su tenant diversi.

**Azione:** parte del piano `tenant_id` graduale (vedi 3.1).

### 3.7 Forzare `npm test` / build check come step Stop & Go — F1
*"Routine automatizzate come step forzato di validazione prima di chiudere uno Stop & Go."*

**Azione:** integrare nel protocollo Stop & Go documentato in `00_LEGGIMI.md`.

---

## 4. Cleanup file `_ANTIGRAVITY/` (consenso entrambi)

### Da archiviare in `99_archivio/` con timestamp:

**Da `01_status_continui/`:**
- `Z_02_05_26_1130_REPORT_CLEANUP_DB.md`
- `Z_02_05_26_1130_Architettura_Pruned.md`
- `E_02_05_26_1130_Espansione_CRM.md`

**Da `02_output_protocolli/`** (Chat_08 chiusa, rendicontata in MASTER_STATUS):
- Tutti `audit_F1-*_2026_04_28.md`
- Tutti `audit_F1-*_2026_04_29.md`
- Tutti `report_F1-*_2026_04_29.md`
- Tutti `audit_F2-*` (numerati 004→023)
- Tutti `report_F2-*` (numerati 001→028)

### Da CONSERVARE (Bibbia del contesto):

**In `01_status_continui/`:**
- `A_02_05_26_1130_Architettura_Core_Server.md`
- `B_02_05_26_1130_Frontend_Moduli.md`
- `C_02_05_26_1130_Stato_Lavori_e_Briefing.md`
- `D_04_05_26_0315_Mappa_Dati_e_Frontend.md`
- `F_04_05_26_0315_ULTIMI_AGGIORNAMENTI.md`
- `G_02_05_26_1705_Checklist_Operativa.md`
- `H_02_05_26_1728_Design_System.md`
- `I_03_05_26_1605_Fase3_Mappatura_Iscrizioni.md`
- `Y_02_05_26_1130_Strumenti_Analisi_Integrati.md`
- `E_Segnalazioni_DB.md` (domande aperte Gaetano)

**In `02_output_protocolli/`:**
- I 4 Stop&Go recenti (FixImportUI_PM2, CampiDinamici, CancellaDatiDB, FixCalendarioAttivita) — sono ancora attivi
- I 2 nuovi documenti strategic review F1 e F2 di oggi

---

## 5. Piano d'azione raccomandato (post-cleanup)

### Settimana 1-2 (12-25 maggio) — Sblocco utente immediato
1. Investigare bug raggruppamento Planning in 12_Gemdario (Task 3 di [[02_LISTA_TASK_PARALLELI_2026_05_11]])
2. Implementare fix → togliere UI FREEZE
3. F1 backend: aggiornare route API per JOIN su `memberships` e `medical_certificates`
4. F2 frontend: esporre i 54 campi Athena nell'anagrafica (PRIORITA 1b)

### Settimana 3-4 (26 maggio - 8 giugno) — Backend stabilization
5. Smantellamento `routes.ts` modulo per modulo (workstream dedicato)
6. In parallelo: estrazione `PaymentModuleConnector` in service backend + `usePricingEngine` frontend

### Settimana 5-6 (9-22 giugno) — Preparazione multi-tenant
7. Aggiungere `tenant_id` (default '1') a tutte le NUOVE tabelle
8. Integrare `react-i18next` come wrapper (anche solo italiano)
9. Hook `usePermission` centralizzato
10. Standardizzazione cache keys React Query

### Settimana 7-8 (23 giugno - 6 luglio) — Frontend consolidation
11. `ActivityLayout` agnostico per le 5 schede
12. Refactor `calendar.tsx` (estrazione hook in `useCalendarGrid`, `usePlanningGrouping`)

### Parallelo a tutto questo (asincrono)
- Reimport turni GemTeam (atomico, completable in 1 sessione)
- Risposta operativa alle domande architetturali su tabella `members`
- Decisione STRADA A/B per `/importa` (Gaetano decide quando vuole)
- Re-import members/memberships/payments quando Gaetano ha i dati puliti

---

## 6. Sui multi-tool e Claude Code Agent Teams

**Verdetto definitivo:** non si fa.

Sia F1 sia F2 lo bocciano per ragioni tecniche concrete (merge conflict su monoliti accoppiati). La memoria persistente Cowork va aggiornata:
- Il pilota Agent Teams su `03_GemTeam` resta sospeso INDEFINITAMENTE
- Il modello operativo confermato: **Cowork = regia (Claude), Antigravity = unico esecutore (F1+F2)**

Resta valida l'evoluzione **a moduli isolati** (es. uno strumento solo per CSS o solo per integrazioni API), ma su questo codebase non è realizzabile a breve termine.

---

## 7. Aggiornamenti da fare ai file canonici

In base a questa sintesi:

1. **`00_LEGGIMI.md`** — aggiungere convenzione su `tenant_id` (default '1') per nuove tabelle + step `npm test` nel protocollo Stop & Go.
2. **`MASTER_STATUS.md`** — aggiornare sezione "DOMANDE APERTE DI GAETANO" con la risposta di F1 (è debito tecnico, bonificare con sequenza precisa).
3. **`ANALISI_MASTER.md`** — aggiornare § stato tecnico con la lettura strategica delle 6-8 settimane.
4. **Memory Cowork** — verdetto definitivo su Agent Teams paralleli (NO).
5. **`02_LISTA_TASK_PARALLELI_2026_05_11.md`** — rimuovere Task 2 (Tab Incolla Testo) per consenso F2.

---

*Documento generato da Claude (Cowork) — 2026_05_11*
*Da approvare con Gaetano prima di eseguire cleanup e aggiornamenti canonici.*
