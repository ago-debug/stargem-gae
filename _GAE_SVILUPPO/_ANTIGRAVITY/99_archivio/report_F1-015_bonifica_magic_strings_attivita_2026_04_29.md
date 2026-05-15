# REPORT F1-PROTOCOLLO-015: Bonifica Magic Strings Attività
**Data:** 29/04/2026
**Modalità:** ESECUZIONE
**File Coinvolti:** `client/src/pages/sunday-activities.tsx`, `client/src/pages/individual-lessons.tsx`, `client/src/pages/attivita.tsx`, `server/routes.ts`

## ATTIVITÀ ESEGUITE

1. **Bonifica Magic Strings Frontend (PASSO 2)**
   - Modificato `client/src/pages/sunday-activities.tsx`: 
     - Sostituito `activityType="domeniche"` con `activityType="domenica_movimento"`.
     - L'endpoint `/api/sunday-activities` è stato aggiornato in `/api/courses?activityType=domenica_movimento`.
   - Modificato `client/src/pages/individual-lessons.tsx`: 
     - Sostituito `activityType="prenotazioni"` con `activityType="lezione_individuale"`.
     - L'endpoint `/api/courses?activityType=prenotazioni` è stato aggiornato in `/api/courses?activityType=lezione_individuale`.
   - Confermata l'allineamento con la dashboard Iscritti e la base dati reale (post bonifica `F1-013-LIGHT`).

2. **Fix Chiamata API Workshop (PASSO 3)**
   - In `client/src/pages/attivita.tsx` (riga 305):
     Sostituita l'endpoint fasullo `useQuery({ queryKey: ["/api/workshops"] })` con l'endpoint canonico che usa i query params: `useQuery({ queryKey: ["/api/courses?activityType=workshop"] })`.

3. **Integrazione Filtro Stagione (PASSO 4)**
   - In `server/routes.ts` (`/api/activities-summary`), è stato aggiunto il filtro per stagione, in quanto la query RAW aggruppava tutti i dati storici senza distinzioni.
   - **Logica Default:** `season_id = (stagione attiva)`. Se la query string riporta `?seasonId=all`, la clausola `WHERE` non viene applicata e vengono contati tutti i corsi presenti a db.
   - Questo garantisce che il **Riepilogo Attività (basso)** della pagina Panoramica mostri solo i dati contestuali, salvo esplicita richiesta.

## VERIFICA (PASSO 5)

I comandi di self-verifica eseguiti internamente riportano i seguenti risultati:

**A) Contatore Default (Stagione Attiva)**
```bash
curl -s http://localhost:5001/api/activities-summary | jq
```
*Risultato confermato:* Restituisce **314 corsi totali e 294 attivi**. (Mostra esattamente i dati della sola stagione attiva).

**B) Contatore Globale (seasonId=all)**
```bash
curl -s "http://localhost:5001/api/activities-summary?seasonId=all" | jq
```
*Risultato confermato:* Restituisce **330 corsi totali e 310 attivi**. (Include anche i record delle stagioni pregresse e con ID fittizi come 1).

**C) Verifica Workshop**
```bash
curl -s "http://localhost:5001/api/courses?activityType=workshop" | jq 'length'
```
*Risultato confermato:* Restituisce `18` elementi in array. Il tile alto nella Panoramica ora valorizza i 18 Workshop correttamente e **non più 0**.

**D) UI Domeniche In Movimento**
La stringa `domenica_movimento` corrisponde al parametro corretto; la pagina ora popola regolarmente le 13 schede in `/attivita/domeniche-movimento`.

**E) UI Lezioni Individuali**
La stringa `lezione_individuale` corrisponde al type assegnato ai due vecchi corsi generici; la pagina `/attivita/lezioni-individuali` è sbloccata.

**F) Integrità Globale**
`npm run build` ha completato il processo TypeScript in `<4.0s` senza warning (Zero Errors). I commit sono stati inseriti nel branch `main` con il messaggio prescelto.
