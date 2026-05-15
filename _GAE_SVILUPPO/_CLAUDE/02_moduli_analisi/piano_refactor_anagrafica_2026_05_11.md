---
aggiornato: 2026-05-12T00:35
ultima_verifica_vs_codice: 2026-05-12T00:35
validita_prevista: 7 giorni (scade 2026-05-19T00:35 → richiede re-verifica)
tipo: piano-refactor
fonti_verificate:
  - _ANTIGRAVITY/02_output_protocolli/audit_F1-002_anagrafica_approfondito_2026_05_11.md (F1-001 audit)
  - _ANTIGRAVITY/02_output_protocolli/audit_F2-002_anagrafica_approfondito_2026_05_11.md (F2-001 audit)
prompt_di_riferimento: sintesi F1-001 + F2-001
---

# 🛠 Piano Refactor Anagrafica — Convergente F1 + F2

> Collegati: [[MASTER_STATUS]] · [[00_LEGGIMI]] (regole 13-18)
> Sintesi degli audit approfonditi F1-001 (backend) e F2-001 (frontend) del 2026-05-12.

## Diagnosi finale (cosa è davvero il problema)

### Backend (debito tecnico critico)
**Dual-write delle tessere e dei certificati.** Il codice scrive ed espone le stesse informazioni in DUE posti:
- Tabelle relazionali pulite `memberships` e `medical_certificates` (corretto)
- Colonne piatte in `members` (`cardNumber`, `cardIssueDate`, `cardExpiryDate`, `entityCard*`, `hasMedicalCertificate`, `medicalCertificateExpiry`) — debito storico dell'import GSheet

Esposizione del problema:
- 27 FK in entrata su `members.id` (qualsiasi modifica strutturale propaga ovunque)
- `server/routes.ts:7769-7772` e `:8054-8074` leggono dalle colonne piatte invece di JOIN
- `server/storage.ts:1677, 3272, 3324, 3383` sincronizza ridondantemente
- Smart Routing import scrive **correttamente** in memberships/medical_certificates (non aggiunge debito)
- Confermate le 4 domande di Gaetano: O-U=tessere, V-W=certificati, A=athenaId, BA=legacy droppabile

### Frontend (Context Hell)
**`CrmFormContext.tsx` accentra >80 parametri stato che fanno re-render massivo ad ogni digitazione.**

Esposizione del problema:
- Nessuna validazione Zod (solo `if` artigianali in `isFormValid`)
- `maschera-input-generale.tsx` 2.012 righe (era 4.500, ora ridotto — comunque enorme)
- "Wizard" finto: in realtà è una long-page con scroll anchor
- `handleSave` costruisce un payload mostruoso (150+ nodi) inviato a `/api/maschera-generale/save`
- I 54 campi Athena sono in `defaultFormData` come stringhe piatte non tipizzate
- Auto-save su `sessionStorage` solo per crash recovery, NON sul DB

## Piano in 6 step modulari (ognuno è atomico e ha rollback chiaro)

### F1-002 — Backend Fase 1: Sostituire letture piatte con JOIN
**Cosa:** modifica le route GET e i report export in `routes.ts` per leggere tessere e certificati con LEFT JOIN su `memberships` e `medical_certificates`, restituendo i campi corrispondenti come se fossero su `members`.
**File toccati:** `server/routes.ts` (linee 7769-7772, 8054-8074 + altre da identificare), `server/storage.ts` (read-only methods).
**Rischio:** Basso. La UI riceve gli stessi field names di prima, solo da fonte corretta.
**Validazione:** confronto JSON output prima/dopo deve essere identico su record di test.
**Stima:** 3-4 ore.

### F2-002 — Frontend Step 1: Zustand migration (sostituisce CrmFormContext)
**Cosa:** crea `useMascheraStore` Zustand che incapsula tutto lo stato attualmente in `CrmFormContext`. Migra l'app per consumare lo store invece del Context. Effetto immediato: stop ai re-render a cascata.
**File toccati:** nuovo `client/src/lib/stores/mascheraStore.ts`, refactor `CrmFormContext.tsx` (dismesso), tutti i consumer in `client/src/components/crm/*.tsx` e `maschera-input-generale.tsx`.
**Rischio:** Medio. Cambia il pattern di consumo state, va testato tab per tab.
**Validazione:** `npx tsc --noEmit` ok + click test su tab Anagrafica per verificare no regressioni.
**Stima:** 6-8 ore.

### F1-003 — Backend Fase 2: Eliminare scritture dual-write
**Cosa:** in `storage.ts`, rimuovere le righe che aggiornano `members.cardNumber/hasMedicalCertificate/...`. Da ora in poi la verità sulle tessere/certificati sta esclusivamente in `memberships` e `medical_certificates`.
**File toccati:** `server/storage.ts` (write-side methods).
**Rischio:** Medio. La UI potrebbe ricevere mancato echo di tessera appena emessa se non guarda la JOIN giusta.
**Pre-requisito:** F1-002 chiuso (la UI legge già via JOIN).
**Stima:** 2-3 ore.

### F2-003 — Frontend Step 2: Schema Zod condiviso (shared)
**Cosa:** definire schemi Zod in `shared/schemas/anagrafica.ts` (form data, tessere, certificati). Sostituire `isFormValid` artigianale con `zodResolver` + `react-hook-form`.
**File toccati:** nuovi schemi in `shared/`, refactor `maschera-input-generale.tsx` + tab children.
**Rischio:** Basso (additivo, non rimuove logica esistente subito).
**Pre-requisito:** F2-002 chiuso (per montare gli schemi sulla store Zustand).
**Stima:** 4-6 ore.

### F2-004 — Frontend Step 3: Chunked saves (auto-save debounced)
**Cosa:** spaccare `handleSave` mostruoso in PATCH modulari (`PATCH /members/:id/anagrafica`, `/tessere`, `/allegati`, ecc.) con debounce. Il bottone "Salva" diventa solo notifica di completamento.
**File toccati:** `maschera-input-generale.tsx`, nuovi endpoint `PATCH` in `routes.ts` (modulari), Zustand store con `useDebounce`.
**Rischio:** Alto. Cambia drasticamente la semantica del salvataggio.
**Pre-requisito:** F2-002 + F2-003 chiusi.
**Stima:** 8-12 ore.

### F1-004 — Backend Fase 3: DROP colonne piatte (DISTRUTTIVA, ultimissima)
**Cosa:** migrazione Drizzle che droppa da `members`:
- `cardNumber`, `cardIssueDate`, `cardExpiryDate`, `entityCardType`, `entityCardNumber`, `entityCardIssueDate`, `entityCardExpiryDate`, `previousMembershipNumber` (8 tessere)
- `hasMedicalCertificate`, `medicalCertificateExpiry` (2 certificati)
- Campi legacy Athena/GSheet droppabili: `mastroC`, `mastroCol`, `codiceFe`, `gsheetChiScrive`, `gsheetVendita`
**Rischio:** ALTO. Point of no return. Se una route nascosta legge ancora dalle colonne piatte → crash.
**Pre-requisiti:** F1-002 + F1-003 chiusi, `npx tsc --noEmit` zero errori, test manuale sulle pagine Anagrafica/GemPass/Iscrizioni
**Stima:** 1-2 ore di migrazione + 2-4 ore di test approfondito post-drop.
**ATTENZIONE:** da fare DOPO il re-import dei dati (Gaetano deve confermarlo).

## Ordine consigliato di esecuzione (parallelismo dove possibile)

```
PARALLELO:
  F1-002 (Backend Fase 1 - JOIN)  ←─→  F2-002 (Frontend Step 1 - Zustand)
                ↓                                    ↓
  F1-003 (Backend Fase 2 - no dual-write)  ←─→  F2-003 (Frontend Step 2 - Zod)
                ↓                                    ↓
                ↓                            F2-004 (Frontend Step 3 - Chunked saves)
                ↓                                    ↓
                └─────────── F1-004 (Backend Fase 3 - DROP colonne) ──┘
                              [DOPO re-import dati, conferma Gaetano]
```

## Stime totali

- Backend totale: 6-9 ore di codice + test (escluso F1-004 drop)
- Frontend totale: 18-26 ore di codice + test
- Drop finale F1-004: 3-6 ore (a fine ciclo, con tutto stabile)
- **Totale ciclo Anagrafica: 27-41 ore** distribuibili su 2-3 settimane in parallelo F1/F2

## Cosa NON fare ora

- Drop delle colonne piatte (F1-004) PRIMA di aver completato F1-002 + F1-003 → crash garantito
- Toccare `CrmFormContext` (F2-002) e `storage.ts` (F1-003) contemporaneamente nello stesso giorno senza coordinarsi → mismatch UI/API quasi certo
- Refactor di `routes.ts` monolite (Big Bet già documentata nel performance audit) → è un workstream separato, non parte di questo piano Anagrafica

## Decisioni che servono da Gaetano

1. **Procediamo per davvero?** Il piano è onesto, ma serve impegno di 2-3 settimane di lavoro AG con priorità Anagrafica
2. **F1-002 + F2-002 in parallelo subito?** Sì/no — entrambi sono il primo passo del rispettivo asse
3. **Drop colonne F1-004 prima o dopo re-import dati?** Mia raccomandazione: DOPO il re-import + test approfondito

---

*Documento prodotto da Claude (Cowork) — 2026-05-12T00:35 — basato esclusivamente sui due audit F1-001 e F2-001 di stamattina.*
