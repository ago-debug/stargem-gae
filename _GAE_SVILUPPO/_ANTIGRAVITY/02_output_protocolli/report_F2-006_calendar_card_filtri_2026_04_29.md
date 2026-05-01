# REPORT F2-PROTOCOLLO-006: CALENDARIO CARD E FILTRI
**Data:** 29/04/2026
**File Coinvolti:** `client/src/pages/calendar.tsx`

## ATTIVITÀ ESEGUITE

1. **Rinomina bottone "CARD"**
   - Rinominato il testo statico `Card` nel PopoverTrigger in una dicitura dinamica basata sul contesto temporale. Se la vista è l'intera settimana (`selectedDay === "all"`), il bottone esibisce "SESSIONI DELLA SETTIMANA", altrimenti "SESSIONI DI OGGI".
   - Modificato anche il titolo del Popover in "Filtra per Tipologia".

2. **Aggiunto onClick sui filtri**
   - Aggiunto `onClick` a ogni riga del breakdown nel popover. Al click, viene iniettato nello scope globale il corretto `registryKey` della riga, richiamando `setSelectedEventType(key)`. Il mapping è stato scritto per coprire: Corsi, Allenamenti, Lezioni Individuali, Workshop, Domeniche e Affitti.

3. **Miglioramento UX Dropdown**
   - Integrata l'icona `<Filter />` a sinistra del Select.
   - Aggiunte classi reattive: se il filtro è valorizzato, assume il colore oro ("amber") e il testo diventa semibold, in accordo al branding Studio Gem.
   - Affiancato un pulsante di reset rapido (X) per riportare il filtro allo stato di default `"all"`.

Il codice è stato regolarmente testato su branch, committato e unito a origin/main.
