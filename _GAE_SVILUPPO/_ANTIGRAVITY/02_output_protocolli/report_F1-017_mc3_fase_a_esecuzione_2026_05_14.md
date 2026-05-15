# Report Esecuzione F1-017: MC3 Pagamenti Relazionali BACKEND Fase A

> **Ultimo Aggiornamento:** 14 Maggio 2026, 20:09

## 1. Schema Migration e Tabelle
È stata creata ed eseguita la migrazione SQL (`migrations/_mc3_pagamenti_relazionali.sql`) e aggiornato il file `shared/schema.ts` per l'introduzione dell'infrastruttura relazionale dei pagamenti.
Sono state implementate 3 nuove entità e alterata la tabella `payments`:
- **`external_payers`**: Entità paganti esterne (es. Comuni, enti).
- **`societies`**: Entità business, con flussi dedicati per welfare aziendale (Fitprime, Pellegrini) basati sulla policy `welfareFormula`.
- **`payment_participants`**: Tabella ponte per il multi-partecipante. Permette a un `payment_id` di suddividere l'importo (`amountAttributed`) su più `memberId` (figli) con tracciamento `activityType`.
- **`payments` (ALTER)**: Introdotti i field `payer_id`, `payer_type` ('member','society','external'), `billing_subject_id`, `billing_subject_type`, `payment_group_id` (UUIDv4 comune per raggruppamento checkout), `gift_card_amount` e `balance_amount`. Aggiunto index per querying veloce.

## 2. Endpoints Base (`external_payers` e `societies`)
Registrato il modulo di root `server/routes/mc3_pagamenti.ts` all'interno di `server/routes.ts`:
- **POST/GET/PATCH/DELETE `/api/external-payers`**: Full CRUD per gli enti paganti esterni.
- **POST/GET/PATCH/DELETE `/api/societies`**: Full CRUD per le scuole di danza o le associazioni. Aggiunto filtro in listato (`?is_welfare_provider=true`) per l'accesso facilitato.

## 3. Gestione Multi-partecipante
Creato l'endpoint `POST /api/payments/multi-participant` ad hoc per la creazione unificata e atomica:
- L'endpoint accetta un body destrutturato per supportare Scuole di Danza, Comuni e Genitori (es. una madre che paga due corsi).
- Applica validazione aritmetica lato server: `somma(amountAttributed) == total_amount - gift_card_amount` prima di persistere i record.

## 4. Payment History (Aggiornato)
Implementato il nuovo controller GET `/api/members/:id/payments-history` in unificazione:
- Effettua sub-query recuperando sia i vecchi pagamenti legacy (dove il membro è `payerId=memberId`), sia le righe in `payment_participants`.
- Risolve e deduplica il result-set lato memoria ritornando uno snapshot coerente dello storico finanziario reale associato alla persona fisica.

## 5. Document Type Helper
Sviluppato `server/utils/documentType.ts`: 
- Contiene l'helper `determineDocumentType` con logiche incrociate per discriminare `ricevuta_istituzionale`, `fattura` (per società o esterni, e affitti/merch), o `booking_only` per prenotazioni/prove gratis, come definito nel classificazione utente.

## 6. Testing Unit e Risultati
- **TypeScript Checking**: Il comando `npx tsc --noEmit` non ha sollevato alcun errore dopo la patch ai tipi. Compilazione perfetta.
- **Test In-Memory (Node.js/SQL)**: Sono stati testati i 4 flow in ambiente runtime contro il MySQL locale.
  - Testato il pagamento multiplo di madre verso 2 figli: generato un payment id padre, e due record in `payment_participants`.
  - Testato l'acquisto di Scuola di Danza (Fattura) e Comune.
  - Testato lo scenario d'uso Gift Card. Il balance è risultato corretto.

## Conclusione Fase A
Il Backend per MC3 è ora funzionale in produzione. La transizione della logica finanziaria al modello relazionale supporta nativamente il B2B, Welfare e Pagamenti Multipli. Resta aperto il passaggio alla Fase B per il collegamento nel frontend `NuovoPagamentoModal` o nel nuovo `Wizard`.
