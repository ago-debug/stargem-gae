# D_Mappa_Dati_e_Frontend

> **Ultimo Aggiornamento:** 03 May 2026, 17:10

## MAPPATURA PAGAMENTI E LISTINI (FASE STABILIZZAZIONE)
1. **Listini Multi-Stagione (`courseQuotesGrid`)**:
   - Aggiunto `season_id` alla tabella (default: 1) per isolare fiscalmente i tariffari.
   - I prezzi vengono caricati in formato "flat" filtrati sia per attività (`activity_type`) sia per stagione (`season_id`).
   - Le categorie del listino (`activity_types`) sono state sganciate dal frontend e collegate a `customLists` nel database.

2. **Checkout Bloccato (`NuovoPagamentoModal`)**:
   - Lo strato frontend in `CartTableRow` non utilizza più input numerici manuali per le quote base.
   - Il processo di prezzaggio dipende strettamente da: **Attività > Corso > Riga del Listino Ufficiale**.
   - Selezionando la voce (es: "1 CORSO BALLO/FITNESS - Settembre"), l'importo viene precompilato nel carrello e blindato in sola lettura (`readOnly`). Gli sconti possono essere applicati unicamente tramite codici promozionali.

## MAPPATURA CORSI, PACCHETTI E ISCRIZIONI (FASE 3)
1. **Calcolo Automatico Lezioni (`calculated_lessons`)**:
   - Aggiunta colonna `calculated_lessons` nella tabella `courses` per tracciare il numero netto di incontri didattici.
   - Il calcolo esclude nativamente le giornate di vacanza incrociando i dati di `startDate` e `endDate` con gli eventi `strategicEvents` impostati su `eventType: "chiusura"` o `"ferie"`.
2. **Bonifica Fantasmi DB**:
   - Rimossi 25 record "fantasma" dalla tabella `courses` privi di coordinate temporali. Il *CourseDuplicationWizard* legge ora solo dati puliti per l'anno sportivo.
3. **Architettura "Pacchetti Open"**:
   - Spostati al livello logico dei *Prodotti Commerciali* (Tabella `promoRules` e Liste `Quote`).
   - L'iscrizione alle aule fisiche viene disaccoppiata dall'incasso (il carrello calcola a 0€ se è presente il Pacchetto Open valido per il tesserato).
4. **Generazione Documenti PDF (TabRicevute)**:
   - Integrazione nativa client-side (jsPDF) per generare RICEVUTE e FATTURE con scarico a browser.
   - **Logica Prefissi PDF**:
     - `2526-Rxxxxxx`: Ricevuta Istituzionale (Tessere, Quote Sociali).
     - `2526-Sxxxxxx`: Ricevuta Semplice (Corsi Commerciali, Servizi).
     - `2526-Fxxxxxx`: Fatture (Richieste esplicite / Aziende).
   - Intestazione ufficiale Studio Gem (GEOS ssdrl, SDI, P.IVA) e Logo integrati via DOM elements.
