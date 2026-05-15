# Report Verifica F1-018: Backend MC1+MC2+MC3 (Post Fase 3)

> **Ultimo Aggiornamento:** 14 Maggio 2026, 20:23

In base alla verifica operativa automatizzata e senza l'applicazione di alcuna patch, ecco lo stato di salute dei nuovi endpoint e del database.

## Risultato Test

| Test | Status | Note (se fail) |
|---|---|---|
| T1 Health check server | ❌ | Il server parte regolarmente sulla porta 5001, ma `/api/health` non esiste e restituisce il fallback frontend `index.html`. |
| T2 Schema DB MC1 (uploads) | ❌ | **FAIL**: La colonna `attachments_url` è **MISSING** fisicamente nella tabella `members` del DB. `avatar_url` invece esiste in `team_employees`. |
| T3 Schema DB MC2 (dossiers) | ✅ | **PASS**: Tabelle `dossiers`, `dossier_steps`, `dossier_audit_log` e relative colonne presenti. |
| T4 Schema DB MC3 (pagamenti) | ✅ | **PASS**: Tabelle `external_payers`, `societies`, `payment_participants` e colonne `payer_id` presenti. |
| T5 Endpoint MC1 (uploads) | ⚠️ | Parzialmente passato. L'endpoint legacy restituisce correttamente **410 Gone**. I nuovi endpoint restituiscono 400 (Bad Request da multer) e 404 (file non trovato), senza sessioni. Nessun blocco hanging rilevato. |
| T6 Endpoint MC2 (dossiers) | ❌ | **FAIL**: Le richieste di mutazione (POST, PATCH) restituiscono **HTTP 500**. I GET restituiscono 200. |
| T7 Endpoint MC3 (pagamenti) | ❌ | **FAIL**: Le POST a `/api/external-payers` e `/api/societies` restituiscono **HTTP 500**. L'endpoint `POST /api/payments/multi-participant` passa con 200. |
| T8 Compat retroattiva | ✅ | **PASS**: Gli endpoint `/api/gemteam/dipendenti` e `/api/members` restituiscono 200. |

---

## 🐛 Bug Emersi (da fixare post-conferma)

### 1. `attachments_url` mancante in DB (Priorità: HIGH)
- **Problema:** Lo schema Drizzle in `shared/schema.ts` definisce `attachments_url` su `members`, ma il database MySQL sottostante non la possiede (probabilmente mancato `db:push` nella Fase MC1).
- **Impatto:** Causa un crash a catena (HTTP 500: `Unknown column 'attachments_url' in 'SELECT'`) su quasi tutte le query `select().from(members)` non proiettate, inclusi i nuovi controller MC2 (`/api/dossiers`).

### 2. Drizzle Mapping Mismatch in MC3 (Priorità: HIGH)
- **Problema:** Le POST verso `external_payers` e `societies` falliscono con `HTTP 500: Field 'business_name' doesn't have a default value`.
- **Causa:** Nel payload (`req.body`) i campi arrivano in *snake_case* (`business_name`), ma DrizzleORM, nello schema appena creato, si aspetta la chiave dell'oggetto in *camelCase* (`businessName`). Passando direttamente `req.body` a `db.insert().values()`, il campo `business_name` viene ignorato e MySQL rifiuta l'insert perché il campo obbligatorio risulta vuoto.
- **Fix proposto:** Mappare esplicitamente `businessName: req.body.business_name` prima dell'insert nei controller MC3.

### 3. Missing Endpoint `/api/health` (Priorità: LOW)
- **Problema:** L'health check richiesto non è gestito dal backend. Vite intercetta il 404 e risponde con `index.html`.
- **Fix proposto:** Aggiungere `app.get("/api/health", (req, res) => res.status(200).send("OK"));` in `server/routes.ts`.

---
*Come richiesto dal protocollo (Regola "ZERO Patch"), i bug sono stati solo isolati e diagnosticati. In attesa di Stop & Go da Gaetano per procedere al fix.*
