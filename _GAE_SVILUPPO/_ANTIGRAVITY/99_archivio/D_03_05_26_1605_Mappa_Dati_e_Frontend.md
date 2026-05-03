# D_Mappa_Dati_e_Frontend

> **Ultimo Aggiornamento:** 03 May 2026, 16:05

## MAPPATURA PAGAMENTI (FASE 3)
Lo strato API dei pagamenti (storage.ts, routes.ts) è stato bonificato per esporre i dati in formato *flat*:
- `membershipNumber`: per identificare le quote tessera.
- `courseName`: per identificare i corsi e i servizi acquistati.

Il CRM è stato potenziato con la **TabRicevute**:
- Recupera dinamicamente lo storico usando `getPaymentsByMemberId`.
- Distingue visivamente "Quota Tessera" da "Corso / Servizio".
- Presenta il campo "Causale (Riferimento)" con il dato *flat* prelevato direttamente in LEFT JOIN nel database.

Inoltre, il modale checkout (`NuovoPagamentoModal`) è stato ottimizzato con l'Accordion per la sezione debiti/rinnovi storici, garantendo un'interfaccia focalizzata sul nuovo carrello.

## MAPPATURA CORSI, PACCHETTI E ISCRIZIONI (FASE 3)
1. **Bonifica Fantasmi DB**:
   - Rimossi 25 record "fantasma" dalla tabella `courses` privi di coordinate temporali. Il *CourseDuplicationWizard* legge ora solo dati puliti per l'anno sportivo.
2. **Architettura "Pacchetti Open"**:
   - Spostati al livello logico dei *Prodotti Commerciali* (Tabella `promoRules` e Liste `Quote`).
   - L'iscrizione alle aule fisiche viene disaccoppiata dall'incasso (il carrello calcola a 0€ se è presente il Pacchetto Open valido per il tesserato).
3. **Generazione Documenti PDF (TabRicevute)**:
   - Integrazione nativa client-side (jsPDF) per generare RICEVUTE e FATTURE con scarico a browser.
   - **Logica Prefissi PDF**:
     - `2526-Rxxxxxx`: Ricevuta Istituzionale (Tessere, Quote Sociali).
     - `2526-Sxxxxxx`: Ricevuta Semplice (Corsi Commerciali, Servizi).
     - `2526-Fxxxxxx`: Fatture (Richieste esplicite / Aziende).
   - Intestazione ufficiale Studio Gem (GEOS ssdrl, SDI, P.IVA) e Logo integrati via DOM elements.
