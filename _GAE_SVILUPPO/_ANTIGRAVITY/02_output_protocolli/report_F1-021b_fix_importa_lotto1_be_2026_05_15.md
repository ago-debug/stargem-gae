# Report F1-021b: Fix BE /importa per Lotto 1 Anagrafica

> **Ultimo Aggiornamento:** 15 Maggio 2026, 11:50

## OBIETTIVO RAGGIUNTO
Il backend è stato completamente refattorizzato per supportare in modo nativo il chunking JSON e l'ingestione massiva del Lotto 1 (Athena + Master GSheet) senza blocchi o timeout, in aderenza alle 5 decisioni approvate nella fase precedente.

## 1. Schema Migration (`shared/schema.ts` e DB)
La tabella `members` è stata estesa con i campi di tracciamento e tolleranza necessari per l'import storico:
- `legacy_athena_id`, `legacy_master_id` per preservare gli ID nativi.
- `tutor1_first_name`, `tutor1_last_name`, `tutor1_fiscal_code` per separare la responsabilità genitoriale dai campi hard-coded "padre/madre".
- Campi di audit: `imported_lotto`, `imported_source_row_index`, `imported_by`, `imported_at`.
- `data_quality_flag` (JSON) per gestire e storicizzare le anomalie (es. CF mancante, minore, CF malformato).
- `extra_data` (JSON) per incapsulare tutti i campi legacy minori non direttamente mappati.

È stata inoltre creata la tabella `import_batches` per il tracking server-side dello stato di avanzamento dei chunk.

## 2. Refactor Endpoint `POST /api/import/chunked`
Per evitare la mutazione distruttiva del middleware `upload.single('file')` sulle altre rotte e garantire una separazione pulita delle responsabilità:
- È stato creato un **nuovo endpoint nativo JSON** `POST /api/import/chunked` isolato in `server/routes/importChunked.ts`.
- Il frontend `import-data.tsx` invia i chunk (es. batch da 500 righe) a questo endpoint. L'endpoint precedente `mapped` viene mantenuto in retrocompatibilità solo per la preview (Dry Run) via `multipart/form-data`.
- **Politica Codice Fiscale (CF):** Implementato il fallback `cfPlaceholder.ts`. Se il CF manca ed è straniero, genera `PLC-STR-{seq}`. Se è minore e manca il CF, viene mantenuto vuoto. Se è malformato, viene ingerito segnalando `cf_malformato`. **Nessun blocco hard limit**.
- **Audit di Livello 1 (UPSERT):** In caso di collisione su CF esistente, il sistema non sovrascrive ciecamente: riempie solo i campi precedentemente vuoti e registra in `audit_logs` i campi dove c'è discrepanza (`has_conflict = true`).

## 3. Gestione Scarti e Export
È stato implementato l'endpoint `GET /api/import/batch/:batch_id/skipped` che converte e restituisce in CSV puro i log di errore (es. riga saltata o andata in eccezione DB) associati al batch, permettendo la correzione manuale in Excel e la ri-sottomissione chirurgica.

## 4. Verifica Validità TypeScript
Il codice è stato rigorosamente allineato e rispetta `npx tsc --noEmit` con **Exit Code 0** (Regola 14). I conflitti derivanti dal restore dei tipi Drizzle e la correzione degli Inferred Types (ImportResult) sono stati sanati.

---
— FILE VERIFICATI
- `client/src/pages/import-data.tsx`
- `shared/schema.ts`
- `server/db.ts`

— FILE MODIFICATI
- `migrations/_f1_021b_import_lotto1.sql` (Nuovo)
- `server/routes/importChunked.ts` (Nuovo)
- `server/utils/cfPlaceholder.ts` (Nuovo)
- `shared/schema.ts` (Esteso)
- `server/routes.ts` (Registrazione endpoint)
- `client/src/pages/import-data.tsx` (Refactor chiamata JSON payload)

— MOTIVO AGGIORNAMENTO
- Predisposizione architettura backend resiliente per import anagrafica massiva senza blocchi da validazioni legacy strict.

— FILE NON TOCCATI
- Logica validazione MC2 e UI Stepper.
- Endpoint legacy `POST /api/import/mapped` (mantenuto intatto per DryRun File Blob).
