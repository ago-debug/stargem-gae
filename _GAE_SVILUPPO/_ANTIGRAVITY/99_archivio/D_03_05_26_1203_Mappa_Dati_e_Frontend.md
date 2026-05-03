# D_Mappa_Dati_e_Frontend

> **Ultimo Aggiornamento:** 03 May 2026, 12:03

## MAPPATURA PAGAMENTI (FASE 3)
Lo strato API dei pagamenti (storage.ts, routes.ts) è stato bonificato per esporre i dati in formato *flat*:
- `membershipNumber`: per identificare le quote tessera.
- `courseName`: per identificare i corsi e i servizi acquistati.

Il CRM è stato potenziato con la **TabRicevute**:
- Recupera dinamicamente lo storico usando `getPaymentsByMemberId`.
- Distingue visivamente "Quota Tessera" da "Corso / Servizio".
- Presenta il campo "Causale (Riferimento)" con il dato *flat* prelevato direttamente in LEFT JOIN nel database.

Inoltre, il modale checkout (`NuovoPagamentoModal`) è stato ottimizzato con l'Accordion per la sezione debiti/rinnovi storici, garantendo un'interfaccia focalizzata sul nuovo carrello.
