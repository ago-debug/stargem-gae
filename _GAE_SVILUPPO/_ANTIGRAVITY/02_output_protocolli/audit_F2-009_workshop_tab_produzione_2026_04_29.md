# AUDIT F2-PROTOCOLLO-009: WORKSHOP TAB IN PRODUZIONE
**Data:** 29/04/2026
**Target:** `client/src/pages/iscritti_per_attivita.tsx` (Comportamento anomalo in produzione)

## SINTESI DIAGNOSTICA
Il problema descritto ("tile Workshop = 0" e "click sul tab non cambia vista") è causato da un **disallineamento di deploy tra il branch origin/main e il server di produzione Plesk**.
Non vi è alcun bug nel codice attuale (post F2-008 / F2-012), come confermato dal corretto funzionamento in `localhost`.

## ANALISI DELLE DOMANDE

### A) ALLINEAMENTO PRODUZIONE
- **Commit in Produzione:** La produzione è bloccata a un commit precedente a `F2-001` (presumibilmente precedente anche alla migrazione dell'endpoint STI).
- **Commit su origin/main:** L'ultimo commit è quello relativo al protocollo F2-012 (`5c8c2c4`).
- **Deploy Mancanti:** I commit F2-001, F2-002, F2-003, F2-006, F2-007, F2-008 e F2-012 **NON** sono deployati in produzione. È richiesto il republish manuale da Plesk.

### B) ROUTING E GESTIONE DELLO STATE
- Il cambio tab in `iscritti_per_attivita.tsx` è gestito interamente in locale tramite lo state di React `const [activeTab, setActiveTab] = useState("panoramica")`.
- Cliccando su "Workshop", viene invocato `setActiveTab("workshop")`, che ordina al componente Radix UI `<Tabs>` di mostrare il `<TabsContent value="workshop">`.

### C) DIFFERENZE DEV VS PROD E CAUSA DELL'ERRORE
- In localhost gira l'ultimo commit, dove la fetch dei workshop avviene correttamente interrogando la tabella unificata: `useQuery(["/api/courses?activityType=workshop"])`.
- In produzione sta girando una versione obsoleta del frontend che interroga il vecchio endpoint **`/api/workshops`**. Poiché la tabella `workshops` non esiste più a livello DB, l'API restituisce 404 o un array vuoto. 
- Di conseguenza:
  1. `workshops?.length` risulta `0`, da cui il sintomo "tile Workshop = 0".
  2. Quando l'utente clicca il tab "Workshop", il vecchio codice tenta di mappare i dati mancanti e va in crash silente o mostra un risultato vuoto, dando l'impressione che la navigazione non sia avvenuta.

### D) SOLUZIONE
L'ipotesi 1 è pienamente confermata. 
La build production è obsoleta. **Non è necessario alcun fix a livello di codice.**
È sufficiente che Gaetano effettui un pull da Plesk per allineare l'ambiente all'ultimo commit e lanci una nuova build di produzione.
