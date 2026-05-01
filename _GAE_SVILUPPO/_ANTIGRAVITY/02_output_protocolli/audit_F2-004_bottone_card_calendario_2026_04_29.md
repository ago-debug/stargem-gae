# AUDIT F2-PROTOCOLLO-004: BOTTONE CARD CALENDARIO
**Data:** 29/04/2026
**File Coinvolto:** `client/src/pages/calendar.tsx`

### A) Tipo di elemento "CARD" e sua interattività
L'elemento che mostra "216 CARD" (riga 2038) **non è un `<button>` nativo**. È un `<div>` personalizzato a cui è stata data interattività grafica (`cursor-pointer`, `hover:bg-slate-200`). A livello React, funge da `<PopoverTrigger>`, ovvero è l'elemento scatenante di un Popover di Radix UI. Non possiede alcun handler `onClick` manuale che modifica lo stato globale.

### B) Handler eventuale (cosa fa al click)
Al click, il bottone apre un menu fluttuante (`<PopoverContent>`, riga 2045). Questo menu **non filtra nulla**: è un semplice tooltip riassuntivo intitolato *"Dettaglio Card Mostrate"*. Itera su una variabile chiamata `totalRenderedCards.breakdown` e stampa una lista puramente testuale e in sola lettura delle quantità di card attualmente disegnate a schermo (es. "Corsi: 150", "Allenamenti: 2", ecc.).

### C) Codice morto/commentato eventuale
Non vi sono tracce di codice morto, handler commentati o commit recenti che indichino che *questo specifico badge* fosse un filtro. Questo perché la funzionalità di filtro è stata storicamente demandata a un componente adiacente, nato proprio per questo scopo.

### D) Mappa filtri tipologia attuali nel calendario
I filtri per tipologia esistono e sono **pienamente funzionali**. Si trovano esattamente a fianco del bottone "216 CARD", racchiusi in un menu a tendina `<Select value={selectedEventType}>` (riga 1945).
- **Voci disponibili:** "Tutte le Attività", "Corsi", "Workshop", "Lezioni Individuali", "Domeniche", "Allenamenti", "Affitti", "Campus".
- **Come funziona:** Modifica la variabile di stato `selectedEventType`. Il motore del calendario (riga 1150) legge questa variabile e nasconde/mostra dinamicamente le card.

### E) Breakdown 216 per tipologia (con query DB)
Ho interrogato il DB cercando tutte le attività *attive* e *dotate di giorno settimanale* (`active = 1 AND day_of_week IS NOT NULL`). Lo spaccato è:
- **Corsi (course):** 308
- **Lezioni Individuali (prenotazioni):** 2
- **Allenamenti (allenamenti):** 1
- **Workshop:** 0 (poiché sono storici)
- *Totale globale DB:* **311**.

**Perché Gaetano vede 216 invece di 311?**
Il calendario in vista "SETTIMANA" non disegna ciecamente le 311 card, ma esegue un "clipping" temporale: nasconde i corsi che, pur avendo un giorno assegnato, possiedono una `startDate` futura o una `endDate` già scaduta rispetto alla settimana visualizzata, oppure orari fuori dal range di apertura. I 216 rappresentano lo specchio fedele delle sole occorrenze valide *per la settimana in esame*.

***

### RACCOMANDAZIONE
Il bottone "CARD" oggi è un report informativo (read-only) e non un filtro. La funzione di filtro per tipologia richiesta da Gaetano esiste già ed è gestita dal menu a tendina *"Tutte le Attività"* posizionato lì accanto. Se desideri ripristinare il "click and filter" rapido direttamente dal riepilogo "216 CARD", basta associare un `onClick={ () => setSelectedEventType(key) }` alle singole righe di testo dentro il popover.
