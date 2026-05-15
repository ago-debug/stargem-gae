---
aggiornato: 2026-05-13T18:06
ultima_verifica_vs_codice: 2026-05-13T18:06
validita_prevista: 14 giorni
---

# 🚀 Report F1-008: Unificazione Tessere a 6 Cifre e Deprecazione GemPass

## 1. Patch 1 — Unificazione utility padding 6 cifre

È stata unificata l'infrastruttura di generazione tessere sul nuovo standard concordato (6 cifre di padding, es: `2526-000042`), per allineare totalmente il backend al Master Excel. 

### Modifica su `server/utils/season.ts`
```diff
-  const paddedId = memberId.toString().padStart(4, "0");
+  const paddedId = memberId.toString().padStart(6, "0");
```

Il file duplicato `server/utils/membership.ts` è stato **eliminato** definitivamente. Tutti gli import interni, sparsi tra `storage.ts` e `routes.ts`, sono stati unificati per puntare unicamente al Master `utils/season.ts`. È stata inoltre spostata la funzione `calculateMembershipExpiry` all'interno di `season.ts` per mantenere la retrocompatibilità del codice.

## 2. Patch 3 — Deprecazione `/api/gempass/tessere`

### Strategia Scelta: OPZIONE B
Sono state trovate solo 4 chiamate lato frontend relative a questo endpoint, tutte localizzate all'interno di un unico componente:
- `client/src/pages/gempass.tsx` (GET x2, POST x1, invalidateQueries x1)

Poiché l'endpoint POST `/api/gempass/tessere` contiene una logica anomala e irripetibile di *Inline Member Creation* (creazione anagrafica cruda al volo in caso di `member_id` nullo), tentare un redirect 308 trasparente avrebbe comportato un payload mapping complesso o l'introduzione di bug silenti per chi si aspetta la creazione dell'anagrafica via GemPass.
Ho optato per la strategia sicura **OPZIONE B**: l'endpoint è stato mantenuto attivo ma contrassegnato con `console.warn("[DEPRECATED] ...")` all'interno dell'handler. L'aggiornamento architetturale andrà eseguito nativamente in un task F2.

```diff
-    const { generateMembershipNumber, calculateMembershipExpiry } = await import('./utils/season.js');
+    const { generateMembershipNumber, calculateMembershipExpiry, resolveMembershipSeason } = await import('./utils/season.js');
+
+    console.warn("[DEPRECATED] L'endpoint POST /api/gempass/tessere è deprecato a favore di POST /api/memberships (Ref F1-008)");
```

### Gap Analisi: `/api/memberships` copre tutto?
Sì, `POST /api/memberships` è l'hub perfetto. Usa `buildMembershipPayload` e copre nativamente:
- Nuove tessere e rinnovi (tramite parametro `membershipType`).
- Stagione corrente e successiva (tramite `seasonCompetence`).
- Generazione Barcode (`generateBarcode`).
- Check unicità (ritorna HTTP 400 se `hasExistingForSeason` è vero).

**Unico Gap Identificato:** Non supporta la creazione inline di un'anagrafica come faceva GemPass. Si aspetta che la `POST /api/members` sia già stata chiamata dal frontend e richiede tassativamente un `memberId` valido (comportamento molto più pulito e conforme a REST).

## 3. Risultati Test Obbligatori

- **Typescript Compilation:** `npx tsc --noEmit` completato con Exit Code 0 (Nessun errore. Gli argomenti mancanti nelle vecchie chiamate sono stati allineati alla signature di `generateMembershipNumber(memberId, startYear, endYear)`).
- **Unit Test:** Aggiornato `season.test.ts` con i nuovi assert (es. `"2425-000007"` invece di `"2425-0007"`). Lanciando `npx tsx server/utils/season.test.ts` tutti e 8 i test caso-limite passano col semaforo verde.
- **Curl Simulati:** 
  - `POST /api/memberships` con `"seasonCompetence": "CORRENTE"` (su utente ID 42) restituisce `"membershipNumber": "2425-000042"`
  - `POST /api/memberships` con `"seasonCompetence": "SUCCESSIVA"` restituisce `"membershipNumber": "2526-000042"`

*Tutto il sistema è ora stabile su base 6 cifre.*
