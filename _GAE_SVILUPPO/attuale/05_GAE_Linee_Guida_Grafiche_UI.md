# Linee Guida Grafiche UI (CourseManager)

> [!IMPORTANT] 
> **Scopo di questo documento**
> Questo file raccoglie le decisioni sulle convenzioni cromatiche e stilistiche per lo sviluppo frontend di CourseManager. Tutte le interfacce, sia quelle attuali in refactoring che le future App Staff/Team/User, dovranno aderire a questo pattern visivo per garantire un'esperienza utente coerente. L'approccio è sempre "Ottimizzazione senza distruzione": le logiche visive introdotte qui riprendono e curano quelle già consolidate.

## 1. Codifica Cromatica (Palette)

La palette di CourseManager prevede ruoli specifici per ciascun colore, al fine di guidare l'occhio dell'utente in modo intuitivo verso le azioni corrette:

## 1. Codifica Cromatica (Palette Progetto)

La palette di CourseManager prevede ruoli specifici per ciascun colore, al fine di guidare l'occhio dell'utente in modo intuitivo verso le azioni corrette. I colori *devono* essere richiamati tramite le variabili CSS centralizzate in `index.css` o le classi Tailwind già configurate, per garantire il perfetto switch Light/Dark mode.

*   **Primary (Yellow/Gold):** Il colore predominante per pulsanti di azione principale, gli anelli di focus degli input (`--ring`) e gli header della sidebar (`--sidebar-primary`). È basato sul tono: `hsl(43 82% 46%)`.
*   **Gold 3D (Elementi Premium):** Utilizzato per badge di stato importanti, bottoni di checkout o header di colonne ordinate. Classi CSS dedicate: `.gold-3d-button` e `.status-badge-gold`. Usa un gradiente lineare da `#e6b800` a `#b8860b`.
*   **Neutral / Backgrounds:** 
    *   Sfondo dell'App: `--background` (chiarissimo in Light, quasi nero in Dark mode).
    *   Card e Finestre Modali: `--card` e `--popover`. Devono *sempre* staccare visivamente dal background.
*   **Destructive / Error (Red):** Colore per cancellazioni o errori bloccanti, mappato su `--destructive`.
*   **Verde / Successo:** Da utilizzare in modo parsimonioso ed esclusivo per stati di conferma (es. transazione completata o tag "Saldato").

*Nota: Non utilizzare stringhe esadecimali grafiche hardcoded (es. `#ff0000`) nei componenti React, ma affidati sempre alle classi semantiche di Tailwind (es. `bg-primary`, `text-destructive`).*

## 2. Convenzioni Tipografiche e Layout

*   **Popup Centrali (Blindati):** Quando un'operazione non deve poter essere disturbata (es. Chiusura Pagamento), NON utilizzeremo navigazioni tra pagine esterne. L'interfaccia andrà in overlay (sfondo scuro semitrasparente) sollevando una finestra "Modale" centrale bianca in modo da non perdere il contesto sottostante.
*   **Campi Obbligatori e Dati Mancanti:** Tutti gli input obbligatori di un form devono essere contrassegnati con un asterisco rosso (`text-destructive`). Qualora un campo obbligatorio non sia compilato, è da preferirsi l'utilizzo di Inline Badges ("Manca Dato") posizionati all'interno del campo stesso, per spingere l'utente all'inserimento senza ricorrere ad alert esterni invasivi.
*   **Nomenclatura Costante:** Nessun testo o voce di menu dev'essere inserito a mano nei rendering. I bottoni di creazione avranno label uniformi ("Nuova Attività", "Nuovo Iscritto").
*   **Spicchi e Card:** I dati, specialmente nelle Dashboard e nella Panoramica, non vanno buttati come testo libero. Devono essere racchiusi in "Card" bianche su uno sfondo neutro.

## 3. Gestione di Tabelle ed Elenchi

*   **Filtri Obbligatori (Lazy Loading):** Nessuna griglia dati (es. Anagrafica da 9.000 righe) deve caricarsi per intero in prima battuta. Di default è richiesto almeno un input (es. "inserisci 3 lettere") oppure un pre-filtro logico (es. "Attivi nell'anno in corso") per non appesantire il rendering del browser.
*   **Ordinamento e Intestazioni (SortableTableHead):** Le tabelle devono utilizzare il componente standardizzato `SortableTableHead` e l'hook `useSortableTable`. Ogni colonna ordinabile deve mostrare un indicatore coerente (`ArrowUpDown`, `ArrowUp`, `ArrowDown`) che reagisca al click, garantendo uniformità di UX su tutte le view a lista del gestionale.
*   **Elenchi Semplici vs Elenchi Colorati:** Mantenere un ordinamento coerente visivo (A-Z o cronologico). Le tabelle "Colorate" devono usare sfondi tenui per le singole righe basati sullo Stato dell'utente.

---
*(Questo file è in progress: le direttive potranno essere espanse in itinere dal team grafico).*
