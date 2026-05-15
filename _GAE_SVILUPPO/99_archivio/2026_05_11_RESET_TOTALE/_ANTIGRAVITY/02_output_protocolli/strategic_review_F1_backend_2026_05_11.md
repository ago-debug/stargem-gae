# Strategic Review Backend - F1
> **Autore:** Antigravity (Senior Backend Engineer)
> **Data:** 11 Maggio 2026
> **Per:** Gaetano (Engineering Lead / Owner)

Come richiesto, ecco l'analisi cruda e senza filtri dello stato del backend di StarGem, basata su mesi di lavoro diretto sul codice. Niente diplomazia.

## 1. Sintesi onesta dello stato — lato backend
Il backend oggi ha un nucleo dati formidabile, ma è avvolto da uno strato di fragilità che rende i deploy stressanti. L'architettura core (post-STI sui `courses`) e i layer di sicurezza/logging (Vercel SDK, Winston, anti-bruteforce) sono eccellenti. Tuttavia, la gestione del routing è un inferno: il file `server/routes.ts` è un monolite inavvicinabile di 12.000 righe. La mia più grande paura quando deployo sono le regressioni silenziose nei flussi di pagamento e nel routing incrociato: modifichi un endpoint per il calendario e rischi di rompere il checkout. Le query aggregate in `stats` sono state messe in sicurezza, ma alcune letture "flat" sulle UI senza paginazione collasseranno inevitabilmente quando toccheremo volumi di dati 10x.

## 2. Debito tecnico — i 3 problemi backend più seri
1. **Il monolite `server/routes.ts` (12k righe)**
   - *Perché preoccupa:* È il Single Point of Failure dell'app. Troppe dipendenze incrociate in un solo file.
   - *Cosa potrebbe rompersi:* Qualsiasi cosa. Un piccolo fix su una route può corrompere middleware e bloccare altri moduli apparentemente non correlati.
   - *Stima sforzo:* 1-2 settimane di lavoro chirurgico in puro isolamento (split in `routes/courses.ts`, `routes/auth.ts`, etc.).
2. **`PaymentModuleConnector` e route di pagamento accoppiate (14 route)**
   - *Perché preoccupa:* La logica fiscale, listini e carrello è fortemente accoppiata tra UI e backend.
   - *Cosa potrebbe rompersi:* Calcoli errati nei pagamenti, iscrizioni salvate con importi sbagliati, totale disallineamento contabile.
   - *Stima sforzo:* 3-5 giorni per estrarre tutto in un service dedicato, disaccoppiando la business logic dall'UI.
3. **Sovraccarico della tabella `members` (174 colonne)**
   - *Perché preoccupa:* Stiamo colpendo i limiti fisici (Row Size Limit) di MySQL. Le 174 colonne includono campi storici, certificati e tessere che la rendono pesante e difficile da interrogare.
   - *Cosa potrebbe rompersi:* Fallimenti bloccanti negli `INSERT` o `UPDATE` massivi, oltre a disallineamenti di "verità" tra i dati utente.
   - *Stima sforzo:* 2-3 giorni per pulire lo schema (droppare/convertire colonne) e sistemare i DTO.

## 3. Decisioni backend che, col senno di poi, riprenderei
- **STI (Single Table Inheritance) in `courses`:** Decisione perfetta. Sostituire 16 silos legacy per avere un solo motore erogativo è la svolta architetturale che tiene in piedi il DB. Nessun problema di performance.
- **Drizzle ORM:** Scelta confermata. La natura SQL-like e la type-safety rigorosa ci hanno salvato nei refactor massivi. Prisma sarebbe stato un collo di bottiglia con le join complesse che ci servivano.
- **PaymentModuleConnector / 14 route accoppiate:** Design da NON ripetere. L'accoppiamento è troppo stretto, dovevamo definire subito un pattern a controller/servizi separati per il checkout.
- **`universal_enrollments` vs `enrollments` unica:** Ottima scelta. Rimanere su una sola tabella di transito `enrollments` ci ha enormemente semplificato l'export e la gestione della logica di validazione.

## 4. La domanda secca di Gaetano sulla tabella members
*Perché tessere (colonne O-U) e certificati medici (V-W) sono dentro members?*
- **È un errore architetturale storico da bonificare?** Sì, è debito tecnico nato dall'import piatto di GSheets. Un utente ha **più** certificati e tessere nel tempo: averli piatti in `members` forza la tabella a tracciare solo "l'ultimo attivo", perdendo lo storico.
- **È una scelta consapevole?** All'inizio lo era per "velocità di visualizzazione", ma ora che abbiamo le tabelle dedicate (`memberships` a 3.305 record, `medical_certificates` a 2.770 record) è solo un residuo pericoloso.
- **Cosa raccomandi:** Droppare queste colonne da `members`. La Source of Truth deve risiedere *esclusivamente* in `memberships` e `medical_certificates`.
- **Rischi nel migrare ora:** Altissimi senza una mappa delle dipendenze. Decine di API e UI (es. semaforo del certificato) leggono ancora `members.hasMedicalCertificate`. Se eliminiamo le colonne oggi, la UI crasha. Dobbiamo prima ricollegare le rotte API per fare le JOIN corrette sulle tabelle reali. La colonna A e BA (legacy ID) andranno eliminate appena terminato l'export Athena.

## 5. Le prossime 6-8 settimane — come le imposteresti TU lato backend
Se fossi Engineering Lead imposterei queste priorità:
1. **Priorità 1 Assoluta:** Riprendere lo smantellamento di `routes.ts`. Sbrogliare le dipendenze modulo per modulo senza fare null'altro in parallelo.
2. **Priorità 2:** Fix UI e Tessere (1b). Questo porta valore immediato in segreteria: sganciare la lettura tessere da `members` e connetterla a `memberships`, esponendo correttamente i campi.
3. **Priorità 3:** Reimport turni GemTeam. Operazione atomica per sbloccare la gestione dello staff.
4. **Cosa rimandare:** Tutte le integrazioni AI sperimentali aggiuntive o moduli secondari (Clarissa, Buvette). Il focus deve essere blindare il core e abbattere il debito di `routes.ts`.

## 6. SaaS multi-tenant a 2 anni — blocchi backend
Oggi siamo lontanissimi da un'architettura SaaS multi-tenant.
- **Schema DB:** Non abbiamo il concetto di `tenant_id`.
- **Isolamento dati:** Dovremo implementare RLS (Row Level Security) sul DBMS per evitare fughe di dati tra i clienti. Farlo via ORM (aggiungendo `where tenant_id = ?` ovunque) porterebbe a data leak certi per dimenticanze umane.
- **Performance e tabelle difficili:** Le tabelle critiche saranno `users` e `members`. I vincoli `UNIQUE` su `email` e `fiscalCode` andranno convertiti in chiavi composite (`tenant_id`, `email`). Attualmente il DB vola con 1 cliente, a 50 o 500 clienti su una `enrollments` piatta esploderemo sui calcoli statistici.
- **Da fare ORA:** Inserire la colonna `tenant_id` (default '1') in tutte le nuove tabelle, e pianificarne l'aggiunta silente a `members` e `courses`. Ridurrà l'urto della migrazione futura.

## 7. Multi-tool: Cowork come regia + tu come esecutore + Claude Teams
- **Funziona "Claude descrive COSA, AG decide COME"?** Benissimo. Questo pattern traccia il binario in modo ad alto livello e mi lascia operare sul codice senza che perda il focus e produca "allucinazioni".
- **Cosa cambierei:** Chiederei di poter lanciare routine automatizzate (`npm test`, build check) come step forzato di validazione prima di chiudere uno Stop & Go.
- **Rischi Claude Teams paralleli:** Devastanti. Se altri agenti toccano il monolite `routes.ts` o lo `schema.ts` mentre lo faccio anch'io, finiremo nell'inferno dei "merge conflict". Più agenti operativi funzionano solo con un partizionamento rigido del codice.

## 8. Cleanup file in _ANTIGRAVITY/ (lato backend)
Lista di archiviazione raccomandata (spostare in `99_archivio/`):
- **Da `01_status_continui/`:**
  - `Z_02_05_26_1130_REPORT_CLEANUP_DB.md` e `Z_02_05_26_1130_Architettura_Pruned.md` → Sono report di esecuzioni puntuali e non tracciano uno "stato continuo" futuro.
  - `E_02_05_26_1130_Espansione_CRM.md` → Diventato obsoleto a seguito del pruning di `crmLeads` e `crmCampaigns`.
- **Da `02_output_protocolli/`:**
  - **Tutti i file** nominati `audit_F1-*_2026_04_28.md`, `audit_F1-*_2026_04_29.md` e `report_F1-*_2026_04_29.md`.
  - *Motivo:* Fanno riferimento all'intensa attività della Chat_08 (Corsi). Sono snapshot chiusi, e il loro risultato tecnico è già fuso dentro il `MASTER_STATUS` del 05/05. Generano solo "rumore" e andrebbero archiviati in blocco per far spazio alla prossima ondata di sviluppi.
