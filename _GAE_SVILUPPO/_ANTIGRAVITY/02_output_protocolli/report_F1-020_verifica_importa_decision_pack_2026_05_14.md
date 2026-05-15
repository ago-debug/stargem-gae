# Report Analisi F1-020: Importa e Decision Pack (Lotto 1)

> **Ultimo Aggiornamento:** 14 Maggio 2026, 20:45

Questo report fotografa lo stato as-is del modulo di importazione massiva post-refactoring (F1-014/F1-019), fornendo gli elementi necessari a sbloccare l'importazione del **Lotto 1 (Anagrafiche)** da Athena. Come richiesto, l'analisi è puramente diagnostica (Regola 11, Zero Patch).

---

## 1. Censimento Stato Attuale `/importa`

Il modulo di importazione è attualmente un ibrido Frontend/Backend ben strutturato, ma rigido.

*   **Frontend (`client/src/pages/import-data.tsx`)**: 
    Presenta un mapping visivo (Tabella a 3 step) in cui l'utente mappa la colonna del file CSV alla colonna del database. I campi disponibili sono hard-coded nell'array `MEMBER_FIELDS` (circa 60 campi).
*   **Backend (`POST /api/import/mapped` in `server/routes.ts`)**:
    Riceve il CSV in memoria (usando `papaparse` e `multer`). 
    Cicla ogni riga, applica la mappa campi passata dal Frontend, e invia l'oggetto a `storage.createMember()` o `storage.updateMember()`.
*   **Logica Validazione e Casing (F1-PROTOCOLLO-005)**: 
    Il parser applica attivamente funzioni di normalizzazione nomi (camelCase/Upper) e rileva discordanze Sesso/Data di nascita estratte dal Codice Fiscale.
*   **Logica Duplicati**: Esiste una mappa in memoria (`existingByKey`) che permette l'update anziché l'insert se `importKey` (es. Codice Fiscale) matcha.

## 2. Verifica Compatibilità Schema (Post MC1, MC2, MC3)

L'importatore **è parzialmente compatibile** con il nuovo schema, ma possiede lacune sui nuovi campi:
*   **[[F1-019]] `attachments_url` e vecchi metadati**: L'importatore Frontend non offre né `attachments_url` né `photoUrl` per il mapping, ma l'insert Drizzle andrà a buon fine perché Drizzle riempirà i nuovi campi (o quelli mancanti) col `default` o `null`.
*   **[[F1-008]] `memberships` (Tessere)**: L'array `MEMBERSHIPS_FIELDS` esiste lato Frontend, ma la business logic sottostante sulle tessere andrebbe rivista per supportare il nuovo `membershipNumber` a 6 cifre introdotto recentemente.
*   **[[F1-017]] Relazionali (External Payers/Societies)**: Totalmente assenti dall'importatore. Ad oggi l'import supporta solo `members`, `courses`, `payments` (legacy) e `accounting`.

## 3. Decision Pack: 3 Strade Tecniche

| Strada | Descrizione | Pro | Contro | Stima Ore |
| :--- | :--- | :--- | :--- | :--- |
| **A (JSON Dump)** | Niente UI di mapping. Il CSV viene processato e i campi base (Nome, CF) mappati in tabella, tutto il resto finisce buttato in una colonna `extra_data` JSON. | Zero effort sui futuri cambi di tracciato Athena. Insert rapidissimo. | Campi non query-abili (difficile filtrare "mostrami iscritti in Via Roma" se l'indirizzo è nascosto nel JSON). | 1h |
| **B (Mapped Zod)** | L'approccio **ATTUALE**. Mappa rigorosa campo-su-campo con tipizzazione Zod Drizzle. Se Athena ha colonne nuove, si deve aggiornare il sorgente Frontend (`MEMBER_FIELDS`). | Database relazionale puro. Estrema pulizia e validazione del dato in entrata. | Qualsiasi deviazione di Athena rigetta la riga. Manutenzione codice alta. | 2-3h (per fix attuali) |
| **A+B (Ibrido)** | Mappatura "Best Effort". I campi noti in `MEMBER_FIELDS` vanno in tabella, i campi CSV orfani e non riconosciuti finiscono nella colonna `notes` o `extra_data` in JSON. | Non perdi mai alcun dato di Athena. Struttura solida sui campi core, flessibilità sui custom fields. | Richiede l'aggiunta di un parser fallback dinamico su `papaparse` che isoli i campi `unmapped`. | 4-5h |

## 4. Bloccanti per l'Import del Lotto 1 (Anagrafiche)

Leggendo il sorgente di `routes.ts`, ho individuato i seguenti "Muri di Gomma" (Hard Blockers):

1.  **Codice Fiscale Obbligatorio & Valido**: Il backend (riga ~8059) imposta `cfBloccante = true` e salta la riga (`skipped++`) **sia se il CF è mancante, sia se è formalmente errato (checksum)**. Se nel database di Athena ci sono bambini senza CF o stranieri, questi verranno **inesorabilmente scartati**.
2.  **Transazioni Parziali**: Il loop `for` elabora riga per riga. Se il batch è di 500 righe e salta la corrente, continua la successiva (`continue;`). Non c'è un `ROLLBACK` globale. Questo è ottimo per non fermare tutto, ma pessimo se la rete cade a metà (difficile capire dove riprendere, sebbene l'update prevenga doppioni).
3.  **Tessere (Memberships)**: Se il Lotto 1 prevede anche l'import delle *Tessere Base*, la logica va revisionata per essere allineata ai nuovi Dossier MC2.

## 5. Raccomandazioni Tecniche e Domande per Gaetano

**La mia opinione:** Per il Lotto 1, suggerisco di mantenere la **STRADA B (Attuale)**, disattivando temporaneamente il blocco del CF (trasformandolo in un `cfWarning`), e aggiungendo i 3-4 campi extra necessari. La **STRADA A+B** la riserverei ad una "Fase 4" futura per evitare ritardi.

**Domande Operative per Gaetano prima del Fix:**
1. **Tracciato Athena:** Puoi fornire le esatte intestazioni (Headers) del file CSV che devi importare per il Lotto 1?
2. **Hard Block CF:** Ci sono anagrafiche senza Codice Fiscale nel file? Sei d'accordo nel derubricare il controllo CF a semplice "Warning" visivo post-import in modo da importare tutti?
3. **Numerica e Duplicati:** Quanti record stimiamo per questo Lotto 1? In caso di CF identico, confermi l'Update dei campi anagrafici base sovrascrivendo i vecchi dati, o preferisci lo Skip totale?
