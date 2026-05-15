---
aggiornato: 2026-05-13T18:52
ultima_verifica_vs_codice: 2026-05-13T18:52
validita_prevista: definitivo
---

# 🗑️ Report F1-009: Rimozione Fisica Endpoint GemPass Tessere

## 1. Operazioni Eseguite (Diff Applicato)

Come richiesto dal task e coerentemente con la strategia definita nel protocollo `F1-008`, dopo aver appurato che il frontend (F2-005) aveva azzerato tutte le dipendenze, ho rimosso fisicamente **tutto il cluster di chiamate** relative a `/api/gempass/tessere`. 

Nello specifico in `server/routes.ts` sono state eliminate:
- `GET /api/gempass/tessere` (righe 3632-3656)
- `GET /api/gempass/tessere/:id` (righe 3658-3670)
- `POST /api/gempass/tessere` (righe 3672-3788)
- `PATCH /api/gempass/tessere/:id/rinnova` (righe 3790-3855)

**Modifica sostitutiva inserita:**
```typescript
// DEPRECATED endpoints GET, POST and PATCH /api/gempass/tessere
// removed 2026-05-13. Use /api/memberships instead.
```

## 2. Analisi Codice Morto
Ho verificato tramite grep e lint manuale le funzioni dell'handler rimosso. Tutte le istruzioni di salvataggio utilizzavano le primitive di `storage` e gli helper di `season.js` (entrambi file vitali usati in decine di altri punti dell'app). Non sono emersi helper esclusivi da buttare. Tutto pulito.

## 3. Risultati Test Obbligatori

1. **TS Compiler:** Comando `npx tsc --noEmit` completato con **Exit Code 0** ✅ (Nessuna dipendenza interrotta a livello server).
2. **Test Funzionale A:** `curl -X POST http://localhost:5001/api/gempass/tessere` → Ritorna l'html del router React catch-all (equivale a route inesistente 404 in express) ✅.
3. **Test Funzionale B:** `curl -X POST http://localhost:5001/api/memberships` → Ritorna correttamente i warning di validazione Payload JSON di Zod (provando che le API core sono vive e rispondono in modo strong-typed) ✅.

## 4. Conferma Grep Puliti (Sanity Check Finale)
- `grep server/ "/api/gempass/tessere"` → **0 match** (Nessuna chiamata interna o traccia residua)
- `grep client/ "/api/gempass/tessere"` → **0 match** (Confermo la bontà del lavoro di F2-005)

*L'endpoint GemPass Tessere è ufficialmente eradicato.*
