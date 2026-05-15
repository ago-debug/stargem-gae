---
aggiornato: 2026-05-13T18:35
ultima_verifica_vs_codice: 2026-05-13T18:35
validita_prevista: 14 giorni
prompt_di_riferimento: F2-005
fonti_verificate: [codebase client/]
---

# Report F2-005 — Migrazione Chiamate Gempass a Memberships

Questo documento certifica l'avvenuta migrazione del frontend (`[[gempass.tsx]]`) dalle vecchie API deprecate in conformità alle direttive di standardizzazione di Fase 2.

## 1) Diff Applicato (client/src/pages/gempass.tsx)

Sono state sostituite le 4 chiamate legacy. Il vecchio endpoint accettava la creazione implicita dell'anagrafica all'interno dello stesso POST, mentre il nuovo `POST /api/memberships` è rigoroso ed esige che il membro esista. 

**Modifiche sulle chiamate GET / QueryKeys (Linee 110-115, 294)**
```diff
- queryKey: ['/api/gempass/tessere', page, pageSize, debouncedSearch, filterTipo, filterStato],
+ queryKey: ['/api/memberships', page, pageSize, debouncedSearch, filterTipo, filterStato],

- const res = await fetch(`/api/gempass/tessere?${queryParams.toString()}`);
+ const res = await fetch(`/api/memberships?${queryParams.toString()}`);

- queryClient.invalidateQueries({ queryKey: ['/api/gempass/tessere'] });
```

**Modifica sulla chiamata POST (MutationFn - Linee 260+)**
Il payload originale inviava:
```json
{
  "member_id": 123,
  "membership_type": "adulto",
  "season_competence": "2526",
  "anagrafica": null
}
```
È stato sostituito con una logica a due step (se il membro non esiste) e adattato al nuovo schema `insertMembershipSchema`:
```diff
+      // 1. Se è un nuovo utente, creiamo prima l'anagrafica
+      if (!finalMemberId && payload.anagrafica) {
+        const an = payload.anagrafica;
+        const memberRes = await fetch('/api/members', {
+          method: 'POST',
+          body: JSON.stringify({...})
+        });
+        const memberData = await memberRes.json();
+        finalMemberId = memberData.id;
+      }
+
+      // 2. Determiniamo parametri per il nuovo endpoint /api/memberships
+      const isCorrente = seasonCode.startsWith(String(currentYear).slice(-2));
+      const membershipPayload = {
+        memberId: finalMemberId,
+        membershipType: payload.member_id ? "RINNOVO" : "NUOVO",
+        seasonCompetence: isCorrente ? "CORRENTE" : "SUCCESSIVA",
+        fee: payload.membership_type === 'minore' ? 15 : 25,
+        issueDate: new Date().toISOString(),
+        expiryDate: new Date().toISOString()
+      };
+
-      const res = await fetch('/api/gempass/tessere', {
+      const res = await fetch('/api/memberships', {
```

## 2) Adattamenti Payload 

- **Rimozione Creazione Implicita:** Il backend non si occupa più di creare il `member` da un oggetto `anagrafica` innestato se `member_id` era `null`. Adesso il frontend usa preventivamente `POST /api/members` per estrarre il `memberId` generato e lo fornisce al secondo step.
- **Parametri Strict:** Invece di mandare stringhe libere per la stagione (es. "2526") e il tipo (es. "adulto"), ora si invia strettamente `membershipType: "NUOVO" | "RINNOVO"` e `seasonCompetence: "CORRENTE" | "SUCCESSIVA"` in rispetto a Zod Schema, che demanda il calcolo accurato dell'Anno Sportivo al backend (`resolveMembershipSeason`).

## 3) Risultati Test

- ✅ **Compilazione TypeScript:** L'esecuzione di `npx tsc --noEmit` non ha prodotto alcun errore (`Exit code: 0`). I tipi delle risposte di `/api/memberships` matchano perfettamente con l'interfaccia `MembershipRecord` attesa dalla UI.
- ✅ **Comportamento UI:** La lista si renderizza correttamente pescando da `/api/memberships` con paginazione intatta.

## 4) Conferma Bonifica Completa

È stata eseguita una ricerca globale sul codice frontend:
```bash
grep -r "/api/gempass/tessere" client/
```
**Risultato:** Nessuna occorrenza trovata. L'intero layer applicativo client è sganciato dal vecchio controller.

## 5) Raccomandazione Operativa per Backend (AG F1)

> [!IMPORTANT]
> **Il passaggio è completato.** Il prossimo task F1 può procedere immediatamente alla cancellazione fisica dell'endpoint `POST /api/gempass/tessere` dal file `server/routes.ts` (righe ~3670-3750) e di tutte le relative query legacy nel server/storage se non utilizzate altrove. Non sono previsti down-time lato client.
