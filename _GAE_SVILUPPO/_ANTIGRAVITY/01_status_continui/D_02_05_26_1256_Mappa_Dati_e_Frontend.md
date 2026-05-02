# STATO DB REALE E MAPPATURA FRONTEND
> **Ultimo Aggiornamento:** 02 May 2026, 12:56

## STATO ATTUALE
Il database e il frontend sono ora sincronizzati con un focus sulle performance estreme.
Nella **Fase 1**, gli endpoint critici del server (Dashboard) sono stati refactorizzati per eseguire calcoli di aggregazione pesanti (`COUNT`, `SUM`, `GROUP BY`) nativamente su database SQL tramite Drizzle-ORM, annullando il rischio di OOM (Out of Memory) e "white screen" del server dovuto all'array filtering in Javascript su record di grandi dimensioni (Tessere, Pagamenti, Iscrizioni).

## AZIONI COMPLETATE (Fase 1: Performance Backend)
1. **Endpoint `/api/stats/dashboard`:**
   - Sostituite 8 estrazioni dati (tutti i DB caricati in RAM) con `Promise.all` parallelo su query Drizzle ottimizzate (es: `count(*)` e filtri `.where(and(gt(...)))`).
   - Refactor aggregazione mensile entrate finanziarie via SQL `sum(amount)` e `groupBy(schema.payments.createdById)`.
2. **Endpoint `/api/stats/alerts`:**
   - Refactor parallelo con `count(*)` per `expiringMemberships`, `expiredCertificates`, `overduePayments`, e `expiringCourses`.
3. **RISOLUZIONE TS ERRORS PREGRESSI:**
   - Sistemati 18 errori di compilazione TS preesistenti in `server/storage.ts` (unioni alias `instructors` e chiavi TS) e `client/src/pages/workshops.tsx` (inferenza su array filtering react node object).
   - Server compila al 100% senza alcun errore Type (`tsc --noEmit` completato con codice 0).

## PROSSIMI PASSI: Fase 2 (Smantellamento routes.ts)
L'estrazione massiva dei moduli (Memberships, Payments, Members, Courses) da `server/routes.ts` verso file modulari è stata analizzata ma momentaneamente interrotta per preservare la stabilità di build, in quanto estremamente interdipendente (rischio rotture import circolari). Richiede un'estrazione assistita manuale e attenta.

### Update 02_05_26_1256: GemPass Frontend Consolidation
- Unified /gempass, /tessere-certificati, and /generazione-tessere into a single UI Hub at /gempass.
- Legacy frontend files deleted, logic modularized into /components/gempass/.
- Database logic and API endpoints remained UNCHANGED.
