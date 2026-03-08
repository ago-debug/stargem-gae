# Linee Guida Grafiche UI (CourseManager)

> [!IMPORTANT] 
> **Scopo di questo documento**
> Questo file raccoglie le decisioni sulle convenzioni cromatiche e stilistiche per lo sviluppo frontend di CourseManager. Tutte le interfacce, sia quelle attuali in refactoring che le future App Staff/Team/User, dovranno aderire a questo pattern visivo per garantire un'esperienza utente coerente. L'approccio è sempre "Ottimizzazione senza distruzione": le logiche visive introdotte qui riprendono e curano quelle già consolidate.

## 1. Codifica Cromatica (Palette)

La palette di CourseManager prevede ruoli specifici per ciascun colore, al fine di guidare l'occhio dell'utente in modo intuitivo verso le azioni corrette:

*   **Azzurro (Primary):** Colore portante del brand e per azioni confermative standard o componenti neutri ma interattivi (es. "Salva", box informativi).
*   **Arancione (Warning/Highlight):** Usato per mettere in risalto elementi chiave, azioni che richiedono una seconda attenzione, stati "In Lavorazione", badge temporanei o elementi bloccanti.
*   **Bianco (Background/Cards):** Usato rigorosamente come sfondo delle Card (es. la lista corsi, le finestre di popup) per mantenere una leggibilità chirurgica sui testi scuri.
*   **Giallo (Navigation/Menu):** Riservato in via esclusiva agli elementi di navigazione principale del Front-End (es. voci di menu sulla sidebar selezionate, icone di raccordo principale).
*   **Verde (Success/Action):** Esclusivo per i bottoni di conversione forte ("Paga", "Completato", tag di "Iscritto", esito positivo di una transazione).

## 2. Convenzioni Tipografiche e Layout

*   **Popup Centrali (Blindati):** Quando un'operazione non deve poter essere disturbata (es. Chiusura Pagamento), NON utilizzeremo navigazioni tra pagine esterne. L'interfaccia andrà in overlay (sfondo scuro semitrasparente) sollevando una finestra "Modale" centrale bianca in modo da non perdere il contesto sottostante.
*   **Nomenclatura Costante:** Nessun testo o voce di menu dev'essere inserito a mano nei rendering. I bottoni di creazione avranno label uniformi ("Nuova Attività", "Nuovo Iscritto").
*   **Spicchi e Card:** I dati, specialmente nelle Dashboard e nella Panoramica, non vanno buttati come testo libero. Devono essere racchiusi in "Card" bianche su uno sfondo neutro.

## 3. Gestione di Tabelle ed Elenchi

*   **Filtri Obbligatori (Lazy Loading):** Nessuna griglia dati (es. Anagrafica da 9.000 righe) deve caricarsi per intero in prima battuta. Di default è richiesto almeno un input (es. "inserisci 3 lettere") oppure un pre-filtro logico (es. "Attivi nell'anno in corso") per non appesantire il rendering del browser.
*   **Elenchi Semplici vs Elenchi Colorati:** Mantenere un ordinamento coerente visivo (A-Z o cronologico). Le tabelle "Colorate" devono usare sfondi tenui per le singole righe basati sullo Stato dell'utente.

---
*(Questo file è in progress: le direttive potranno essere espanse in itinere dal team grafico).*
