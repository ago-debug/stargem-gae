# STATO DB REALE E MAPPATURA FRONTEND
> **Ultimo Aggiornamento:** 02 May 2026, 22:45

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

## AZIONI COMPLETATE (Fase 2: Smembramento Monoliti Pagamenti)
1. **Backend Modularizzato:**
   - Sradicati gli endpoint dei Pagamenti (inclusi `payment-methods` e `payment-notes`) dal monolite `server/routes.ts` (12.226 righe) al file isolato `server/routes/payments.ts`.
2. **Frontend Modularizzato:**
   - Scorporato il monolite `client/src/components/nuovo-pagamento-modal.tsx` (1.277 righe) estraendo le seguenti micro-viste:
     - `CartTableRow` -> `client/src/components/payments/CartTableRow.tsx`
     - `PaymentInvoiceDetails` -> `client/src/components/payments/PaymentInvoiceDetails.tsx`

### Update 02_05_26_1256: GemPass Frontend Consolidation
- Unified /gempass, /tessere-certificati, and /generazione-tessere into a single UI Hub at /gempass.
- Legacy frontend files deleted, logic modularized into /components/gempass/.
- Database logic and API endpoints remained UNCHANGED.

### Update 02_05_26_2245: Modularizzazione `maschera-input-generale.tsx` (Fase 2)
- Scorporato il monolite `client/src/pages/maschera-input-generale.tsx` (ridotto da >3600 a ~2400 righe) estraendo le seguenti macro-sezioni in componenti atomici nella directory `client/src/components/crm/`:
  - `TabGift` (Gift Card, Buoni, Resi, Hello Gem)
  - `TabAllegati` (Privacy, Regolamenti, Tesserini, Documentazione Generale)
  - `TabMarketing` (Canali di Acquisizione, CRM Score Override)
  - `TabIscrizioni` (Storico totale iscrizioni per moduli core e secondari, visualizzazione dinamica badges)
- Tipizzazione forte `Props` (e.g. `TabAllegatiProps`, `TabIscrizioniProps`) adottata in modo da condividere lo stato `CrmFormContext` senza prop drilling eccessivo.
- Stabilità sistema preservata (`npm run build` pulito e funzionante).

### Update 03_05_26_0118: Bonifica Dati e Mappature (Prep. Wipe & Re-Import)
- **Fase 1 (Anagrafica completata)**:
  - Mappati campi `mother`/`father` (First Name, Last Name, Birth Date/Place/Province, Fiscal Code, Address, Email, Mobile).
  - Implementata estrazione automatica e dinamica del `codComune` dal Codice Fiscale (posizioni 11-14) in `maschera-input-generale.tsx`.
  - Mappati Allegati/JSON (`attachmentMetadata`, `giftMetadata`).
  - Verificata generazione ID univoco `STAGIONE-XXXXXX` e corretta esecuzione di API e Sanitizer.
- **Fase 2 (GemPass completata)**:
  - Risolto bug fatale nell'upsert in `memberships` (`syncMembershipFromMember`). Sostituita la logica fallback con il parsing corretto di `tessereMetadata` dal frontend.
  - Generazione ID tessera (`membershipNumber`) e calcolo automatico scadenza fissa (`calculateMembershipExpiry` → 31/08) garantito a livello di `server/storage.ts`.
  - Risolto bug fatale nell'upsert in `medical_certificates` (`syncMedicalCertificateFromMember`). Mappato correttamente `certificatoMedicoMetadata` inviato dalla Maschera Input.
  - Entrambe le entità ora ereditano `fee`, `membershipType`, `seasonCompetence`, `entityCardType`, `entityCardNumber` direttamente dal JSON di `maschera-input-generale.tsx`. Script test API approvato (test-phase2.ts passa 100%).
