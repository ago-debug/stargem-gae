# REPORT F2-027: Fix Pagine Bianche su 3 Schede Ad Hoc

**Data:** 30/04/2026
**Priorità:** ALTISSIMA (Blocco Utente)

## DIAGNOSI
L'errore a runtime (`Pagina Bianca` al click su "Scheda" in Domeniche, LI e Campus) non era causato da un errore di sintassi JSX o da script Python difettosi, ma da un **disallineamento architetturale critico sul mapping dei dati**.

Durante il refactoring F2-026, si era presunto che l'endpoint `/api/courses/:id/enrolled-members` restituisse l'oggetto nested `data: { member: {...}, enrollment: {...}, attendances: [...] }`, utilizzato dai vecchi componenti. 
Tuttavia, dopo l'aggiornamento dell'endpoint (probabilmente effettuato in F1-020), la query restituisce **un record SQL flattened** (es. `data.first_name`, `data.last_name`, `data.presenze_count`).
Tentando di fare destructuring dell'oggetto inesistente `member` e chiamando `{member.firstName}` e `attendances.length`, React lanciava un `TypeError` per property di undefined, causando l'unmount dell'intero albero DOM (White Page, talvolta offuscata come Error #321).

## SOLUZIONE APPLICATA
Il codice è stato corretto **senza necessità di git revert massivo**, attraverso un intervento chirurgico tramite AST/sostituzione regex che ha allineato perfettamente le tre schede al pattern d'oro di `scheda-corso.tsx`.

### Azioni Eseguite:
1. **Mapping EnrolledMembersData**:
   Il blocco `enrolledMembersData.map()` è stato aggiornato per leggere un `data: any` e non più l'interfaccia complessa. Il calcolo di `paymentStatusBadge` è stato allineato per usare `data.enrollment_id`.
2. **Funzione di Sort (`getSortValue`)**:
   Sostituiti i path object (es. `data?.member?.firstName`) con i campi DB diretti (`data?.first_name`, `data?.presenze_count`).
3. **TableBody e Destructuring**:
   Tutti i blocchi JSX di rendering (le colonne della tabella) sono stati aggiornati. Invece di accedere a `member.cardExpiryDate`, si destrutturano e si utilizzano `membership_expiry_date`, `medical_expiry_date`, `presenze_count`, ecc.

## ESITO VERIFICHE POST-FIX
- ✔️ **Compilazione TypeScript**: Passata al 100% (zero nuovi errori su tutti i file).
- ✔️ **Caricamento Viste**: Le viste `scheda-domenica`, `scheda-lezione-individuale` e `scheda-campus` caricano ora correttamente i dati mappati per ogni riga senza crash runtime.
- ✔️ Le regole "Placeholder per NULL" implementate nell'integrazione di F2-026 sono rimaste **pienamente operative** nella testata delle schede.
