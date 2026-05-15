---
aggiornato: 2026-05-13T17:49
ultima_verifica_vs_codice: 2026-05-13T17:49
validita_prevista: 14 giorni
---

# 🎯 Report F1-005: Validazione Formula Numero Tessera

**Esito Complessivo: DIVERGENTE + BUG GRAVE**

Abbiamo incrociato la logica di calcolo del numero tessera usata nel Google Sheet `26_27_MASTER_ISCRIZIONI_e_PROVE` (Formato: `YYYY-NNNNNN` con Padding a 6) con l'implementazione attuale nel backend di StarGem Manager.

### Risposte alle Domande Specifiche

1. **Padding ID nel codice è 4 cifre o 6 cifre?**
   - **Divergente (Sdoppiato).** Esistono due utility in conflitto:
     - `server/utils/season.ts` (linea 82): Usa un padding a 4 cifre `padStart(4, "0")`.
     - `server/utils/membership.ts` (linea 9): Usa un padding a 6 cifre `padStart(6, '0')`.
     - *Risultato:* Il backend genera tessere formalmente discordanti rispetto al Google Sheet quando usa `season.ts`.
2. **Fonte ID è `members.id` o `legacy_member_code`?**
   - **Allineato (in parte).** La fonte utilizzata è sempre `members.id` (la Primary Key autoincrement del DB). Non esiste una colonna "legacy" coinvolta nel payload, ma siccome l'ID DB non parte necessariamente dalla stessa numerazione del file Excel (ID-NNNNNN), i numeri generati avranno desinenze diverse.
3. **Quale endpoint è ufficiale tra `POST /api/memberships` e `POST /api/gempass/tessere`?**
   - **Dualismo.** L'endpoint `POST /api/memberships` (`routes.ts:3476`) è quello storicamente "ufficiale" e accoppiato al checkout, e utilizza l'utility `season.ts` (padding 4). L'endpoint `POST /api/gempass/tessere` (`routes.ts:3672`) è invece un endpoint apparentemente più recente/sperimentale che non dialoga con la cassa, e importa `membership.ts`.
4. **Esiste bug `calculateMembershipExpiry` chiamata con "CORRENTE"/"SUCCESSIVA"?**
   - **BUG CRITICO CONFERMATO.** In `POST /api/gempass/tessere` (`routes.ts:3728`), il valore testuale stringa `season_competence` (es. `"CORRENTE"`) viene passato puro alle funzioni `generateMembershipNumber` e `calculateMembershipExpiry`. Poiché queste funzioni si aspettano un formato `seasonCode` (es. `"2526"`), lo script impazzisce: restituisce una tessera con formato `"CORRENTE-000042"` e tenta di creare un `new Date('NaN-08-31')`, risultando in una data `Invalid Date` salvata nel DB.
5. **CF doppio/mancante viene bloccato alla generazione tessera?**
   - **Divergente.** 
     - *Mancante:* L'endpoint GemPass blocca con errore 400 se si cerca di inserire una nuova anagrafica senza CF.
     - *Doppio CF:* Non c'è alcun blocco/alert. L'endpoint effettua una "Silent Query": se trova il CF, invece di dare errore, riutilizza semplicemente l'ID dell'utente esistente e gli genera la tessera. Nel Google Sheet appare invece l'alert `⚠️ C.F. DOPPIO`. Inoltre non esiste il file `shared/utils/cf-validator.ts`, il controllo è tutto inline.

---

### Proposte di Patch (Non applicate)

1. **Unificare l'Utility Tessere:** Eliminare `server/utils/membership.ts` e standardizzare tutto su `server/utils/season.ts`, modificando il padding a 6 (`padStart(6, "0")`) per allinearlo al file Excel e al barcode scanner.
2. **Fix Bug Endpoint GemPass:** Modificare `POST /api/gempass/tessere` per risolvere stringhe come "CORRENTE" o "SUCCESSIVA" nei reali `seasonStartYear/seasonEndYear` prima di invocare il calcolo scadenze e la composizione ID.
3. **Deprecare le rotte duplicate:** Scegliere un solo orchestratore (ideale l'estrazione di una rotta atomica `POST /api/memberships` depurata dal pagamento, eliminando `POST /api/gempass/tessere`).

### Domande Aperte per Gaetano/Cowork

- Le tessere già stampate in questi mesi riportano il formato 4 cifre (`2526-0042`) generato da `POST /api/memberships` oppure il formato a 6 cifre del foglio Google? Uniformando a 6 cifre ora, rompiamo la lettura dei barcode fisici già emessi?
- Il file Excel "26_27_MASTER_ISCRIZIONI_e_PROVE" dovrà rimanere come master d'importazione o vogliamo che, a regime, StarGem generi un ID interno univoco svincolato dall'Excel storico?
