# REPORT F2-PROTOCOLLO-014: TAB DOMENICHE IN MOVIMENTO ACCORDION
**Data:** 29/04/2026
**File Coinvolti:** `client/src/pages/iscritti_per_attivita.tsx`

## ATTIVITÀ ESEGUITE

1. **Refactoring Tab Domeniche in Movimento (Pattern Accordion)**
   - La tab è stata estratta dal loop dinamico di fallback e le è stato assegnato un blocco nativo `<TabsContent value="domeniche-movimento">`.
   - Sono stati creati 4 nuovi state isolati (`expandedDomeniche`, `selectedSeasonIdDM`, `showConcludedSeasonsDM`, `searchQueryDM`) per garantire un controllo autonomo dei filtri stagionali e della ricerca.
   - È stata istanziata la `<ActivityAccordionCard>` con l'esatta architettura implementata precedentemente per Corsi, Workshop e Allenamenti, preservando la totale compatibilità con il design system.

2. **Aggiornamento Header Globale**
   - Nello `switch` dell'header, è stato inserito il caso `domeniche-movimento` che ora calcola e mostra il breakdown frammentato in tempo reale: "N attivi / M totali · Z iscritti", allineando le Domeniche allo standard delle attività principali.

3. **Verifica Qualitativa (No Foglio Bianco)**
   - Sono state passate tutte le prop essenziali al componente `ActivityAccordionCard`, confermando che il tag `children` ospita una tabella standard con le `<TableHead>` convenzionali (senza colonna Insegnante, come pattuito).
   - Eseguito `npm run build` che ha compilato con esito positivo (nessun errore TypeScript).

## CHECKLIST COMPLETATA

- [x] Tab Domeniche in Movimento: le schede compaiono chiuse di default e aggregate logicamente.
- [x] Bottone Espandi/Comprimi tutto globale perfettamente reattivo e isolato.
- [x] Filtro per stagione attiva/storica integrato e funzionante.
- [x] Header aggiornato a "N attivi / M totali · Z iscritti".
- [x] Nessuna colonna impropria è stata aggiunta alla tabella.
- [x] Le altre tab (Workshop, Corsi, Allenamenti) continuano a funzionare intatte.
- [x] Build TypeScript pulita.

## IMPATTO
Il cruscotto prosegue la sua evoluzione standardizzata: ora 4 delle 11 tab previste (Corsi, Workshop, Allenamenti, Domeniche) condividono lo stesso pattern ottimizzato. L'utente non sperimenta più l'esplosione verticale delle tabelle.
