# Stop & Go: Sistema di Colonne Dinamiche in Importazione

> **Ultimo Aggiornamento:** 04 Maggio 2026, 22:25

## 1. Analisi della tua Richiesta
Hai richiesto che il sistema di importazione diventi **completamente dinamico**, permettendo di:
1. Creare "al volo" nuove colonne nel Database se nel file Excel è presente un dato non previsto.
2. Rinominare o modificare le colonne del Database direttamente dall'interfaccia di importazione.
3. Chiedere all'utente: *"Queste colonne esistono già, le modifichiamo o le teniamo?"*

## 2. Il Limite Architetturale (⚠️ STOP COMPLETO ⚠️)
Attualmente il gestionale utilizza un **Database Relazionale (SQL)** fortemente tipizzato (con Drizzle ORM e TypeScript). Questo significa che il "nome" e il "tipo" di ogni colonna (es. `Nome`, `Cognome`, `Codice Fiscale`) sono scritti a mano nel codice del server (`schema.ts`).

**Cosa comporta questo:**
Non è tecnicamente possibile (né sicuro) fare in modo che un click sull'interfaccia UI esegua un `ALTER TABLE` per rinominare fisicamente una colonna o crearne una nuova a livello strutturale SQL senza che il server si riavvii o che il codice TypeScript si rompa.

## 3. Le Due Alternative (Proposta di Soluzione)
Per darti esattamente il **risultato funzionale** che hai chiesto (autonomia totale di importazione e flessibilità), senza distruggere l'architettura SQL del software, ti propongo due strade. Dobbiamo sceglierne una prima di procedere.

### STRADA A: Il "Cassetto Flessibile" (Campi Custom in JSON) - Consigliata
Invece di creare nuove colonne SQL "strutturali", aggiungiamo al database un'unica colonna invisibile chiamata `Dati_Extra` (di tipo JSON).
- **Come funziona nell'Import:** Se importi un file con una colonna nuova (es. "Taglia Scarpe" o "Animale Domestico"), non la mappi a un campo standard, ma le dici di andare nei "Dati Extra".
- **Vantaggio:** Massima libertà. Puoi importare qualsiasi file con qualsiasi nome colonna, e il sistema non esploderà mai. Nel profilo utente vedrai tutto ciò che hai importato.
- **Svantaggio:** I dati salvati nei "Dati Extra" sono più difficili da usare per statistiche complesse o filtri avanzati rispetto a una colonna vera e propria.

### STRADA B: Il "Mappatore Intelligente" (Salvataggio Mappature)
Il database rimane fisso con le sue 60 colonne attuali (che coprono quasi tutto il necessario).
- **Come funziona nell'Import:** Il sistema analizza l'intestazione del tuo Excel. Se le intestazioni non combaciano con il DB, ti chiede di "unire i puntini" (es. dici al sistema che "Cognome Tutore" del tuo Excel corrisponde a "Cognome Madre" del DB).
- **La magia:** Una volta che hai mappato una colonna, il sistema **salva questa regola**. La prossima volta che caricherai un file con la colonna "Cognome Tutore", la riconoscerà da solo e non te lo chiederà più.
- **Vantaggio:** Database pulitissimo, sicuro e veloce.
- **Svantaggio:** Se c'è una colonna di un dato *completamente nuovo* che non esiste tra le 60 del DB, devi prima chiedermi di aggiungere la colonna al codice.

## 4. Richiesta Conferma
Essendo una scelta architetturale fondamentale che si distacca dal semplice "Sblocco delle colonne" fatto poco fa, **ho fermato ogni modifica al codice** (Regola AG-RULE-0001, punto 12).

Come vuoi procedere?
- **Opzione A:** Implementiamo i "Dati Extra" (Campi Custom Dinamici JSON).
- **Opzione B:** Implementiamo il salvataggio in memoria delle tue mappature, mantenendo il DB rigido.
- **Opzione A + B:** Possiamo farle anche entrambe, dando la massima potenza al sistema.
