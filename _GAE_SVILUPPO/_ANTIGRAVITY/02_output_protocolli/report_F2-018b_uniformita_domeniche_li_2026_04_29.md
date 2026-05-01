# REPORT F2-PROTOCOLLO-018b: UNIFORMITÀ UI DOMENICHE E LEZIONI INDIVIDUALI
**Data:** 29/04/2026
**File Coinvolti:** `client/src/pages/iscritti_per_attivita.tsx`

## ATTIVITÀ ESEGUITE
1. **Refactoring JSX Tab Lezioni Individuali**
   - Rimosso il blocco flessibile di intestazione non standard.
   - Allineato il layout JSX del `<CardHeader>` al pattern introdotto per la tab Allenamenti.
   - Spostata la `Search` bar in alto a destra, adiacente al titolo e al contatore `CardDescription`.
   - Introdotto il layout in linea in basso per i filtri, con `Select` per la stagione e la checkbox "Mostra stagioni concluse" vincolata.
   - Sostituito il singolo bottone espandi/comprimi intelligente con due bottoni distinti: `Espandi tutto` e `Comprimi tutto`, posizionati in basso a destra.

2. **Refactoring JSX Tab Domeniche in Movimento**
   - Allineata anch'essa al pattern Allenamenti.
   - Inserita nativamente la checkbox "Mostra stagioni concluse" associata alla variabile `showConcludedSeasonsDM`.
   - Garantita la presenza e disabilitazione visiva della `<Select>` quando la checkbox delle storiche è spuntata.
   - Verificata la corretta associazione di `value="active"` all'opzione "Stagione Attiva" per evitare select visivamente vuote.

3. **Integrità Dati Preservata**
   - Come concordato, NON sono state apportate modifiche a:
     - Stati locali (`expandedDomeniche`, `selectedSeasonIdLI`, ecc.)
     - Logica di filtraggio (`filteredDomeniche`, `filteredLezioniIndividuali`)
     - Props passate a `ActivityAccordionCard`
     - Query a database (`useQuery`)

## VERIFICA
- **Build TS**: Verde. Compilato con successo.
- **Isolamento**: Le altre tab (Corsi, Workshop, Allenamenti, e il fallback Campus) non sono state influenzate dalla riscrittura dei blocchi `CardHeader` specifici.
- **Pattern Canonico**: Le 4 principali attività estratte seguono ora identica disposizione dei controlli di filtraggio ed espansione, sanando la difformità segnalata.

## NEXT STEPS
La dashboard è ora perfettamente allineata esteticamente. Si resta in attesa dell'ok per procedere con l'estrazione della tab Campus (F2-017) utilizzando lo stesso medesimo blocco standardizzato.
