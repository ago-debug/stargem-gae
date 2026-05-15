# STATUS CONTINUO - Y: Strumenti di Analisi e Ottimizzazione Integrati

> **Ultimo Aggiornamento:** 02 Maggio 2026, 11:30

## 📌 SCOPO DI QUESTO DOCUMENTO
Questo file tiene traccia degli strumenti esterni e delle librerie diagnostiche integrate nel progetto StarGem per l'analisi, l'ottimizzazione e la pulizia del codice. Questi strumenti sono cruciali per prendere decisioni consapevoli senza causare regressioni o "allucinazioni" architetturali.

## 🛠️ STRUMENTI INSTALLATI (DevDependencies)

### 1. Knip (Analizzatore di Dead Code)
*   **Obiettivo:** Trovare file orfani, dipendenze non utilizzate e funzioni esportate ma mai richiamate.
*   **Comando:** `npm run analyze:deadcode`
*   **Utilizzo:** Mantiene il progetto snello e aiuta a rimuovere file legacy con precisione matematica.

### 2. Madge (Analizzatore Grafico delle Dipendenze)
*   **Obiettivo:** Creare mappe visive dell'architettura e scoprire dipendenze circolari.
*   **Comando:** `npm run analyze:structure`
*   **Utilizzo:** Mostra come le pagine (es. `App.tsx`) si collegano ai componenti, aiutando a districare il "codice a ragnatela".

### 3. Rollup Plugin Visualizer (Analizzatore Peso Bundle)
*   **Obiettivo:** Analizzare quanto pesano i singoli componenti e le librerie sul bundle finale inviato al browser.
*   **Comando:** `npm run analyze:bundle` (o semplicemente `npm run build`)
*   **Utilizzo:** Genera un file `bundle_stats.html` (o `stats.html`) interattivo per scovare le librerie troppo pesanti e ottimizzare le performance di caricamento del frontend.

## 🛡️ STRUMENTI DI QUALITÀ DEL CODICE E TESTING

### 1. ESLint & Prettier
*   **Obiettivo:** Intercettare errori logici a compile-time (ESLint) e mantenere una formattazione del codice rigorosa e unificata (Prettier).
*   **Comandi:** `npm run lint` e `npm run format`
*   **Utilizzo:** Assicura che tutto il team lavori con la stessa qualità sintattica.

### 2. Husky & lint-staged
*   **Obiettivo:** Bloccare i salvataggi (commit) su Git se il codice non passa i controlli di ESLint o Prettier.
*   **Utilizzo:** Entra in azione automaticamente quando fai `git commit`. Formatta il codice prima di salvarlo.

### 3. Vitest
*   **Obiettivo:** Motore di test unitari ultrarapido basato su Vite.
*   **Comando:** `npm run test`
*   **Utilizzo:** Permette di scrivere piccoli test per verificare che le API e le rotte critiche (es. pagamenti) non si rompano durante i refactor massivi.

## 💻 STRUMENTI DI SISTEMA (Mac OS)

### 1. Homebrew
*   **Obiettivo:** Gestore di pacchetti per macOS, necessario per installare utility di sistema usate dagli analizzatori Node.js.
*   **Comando di installazione (eseguito):** `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`

### 2. Graphviz
*   **Obiettivo:** Motore grafico open source indispensabile per permettere a Madge di esportare l'albero delle dipendenze in formato PDF/SVG.
*   **Comando di installazione (eseguito):** `brew install graphviz`

## 🚀 ROADMAP DI UTILIZZO
1.  **Analisi:** Esecuzione di Knip per confermare la lista dei file orfani.
2.  **Valutazione:** Revisione dei risultati per decidere quali file/stub cancellare.
3.  **Pulizia:** Rimozione chirurgica del "dead code" (codice morto).
4.  **Mappatura:** Esecuzione di Madge post-pulizia per mappare il gestionale snellito.

---

