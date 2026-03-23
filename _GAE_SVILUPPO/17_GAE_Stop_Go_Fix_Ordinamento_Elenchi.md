# [AG-CLEANUP-002B] — Stop & Go: Chiusura Definitiva Modale Corsi e Pulizia Elenchi

Ecco l'analisi dettagliata e la proposta di intervento chirurgico per coprire i tuoi 4 punti e garantire la stabilità definitiva prima di eseguire modifiche fatali.

---

### A. Ordinamento
- **dove oggi viene fatto**:
  1. *Per le tendine (Select)*: il sorting A-Z / Numerico funziona parzialmente grazie all'hook `useCustomListValues`, che applica `.localeCompare(..., {numeric: true})`.
  2. *Per i Sub-Modali (Pennini)*: le voci vengono ordinate semplicemente in base alla colonna `sortOrder` del database (`a.sortOrder - b.sortOrder`). 
  3. *Per gli Stati Operativi*: l'ordine rispecchia quello di inserimento o quello fisso cablato (`ATTIVO`, `IN PROGRAMMA`, ecc.).
- **dove manca**:
  Manca l'applicazione rigida della comparazione alfabetica/numerica nel backend o durante l'apertura dei modali interni e per gli `Stato`.
- **come lo uniformi**:
  Sostituirò il `(a.sortOrder - b.sortOrder)` in `custom-list-manager-dialog.tsx` con un robusto `a.value.localeCompare(b.value, undefined, {numeric: true})`. 
  L'uso di `{numeric: true}` riconosce automaticamente se si tratta di numeri (es. per *Posti Disponibili*) o lettere (per *Genere*), ordinandoli perfettamente sia `1, 10, 20` che `A, B, C`. Farò la stessa modifica per gli stati su `MultiSelectStatus.tsx`.

### B. Pennini
- **perché oggi il pennino Stato è diverso**:
  Sotto il cofano lo Stato usa un componente `<Button variant="ghost" size="icon">` contenente l'icona `<Edit className="sidebar-icon-gold">`. 
  Tutti gli altri campi nel file `CourseUnifiedModal.tsx` usano la semplice icona nuda `<Edit2 className="text-amber-500">`, che crea l'effetto disallineato e il diverso comportamento on hover.
- **come rendi tutti i pennini identici**:
  Inietterò lo stesso identico blocco bottone a tutti i campi (Genere, Categoria, Posti, Livello, Fascia d'età) garantendo consistenza dimensionale e stile (gold-hover) assoluta.

### C. Livello + Fascia d’età
- **quali sorgenti reali userai**:
  Mi collegherò direttamente agli hook delle custom lists usando `livello` e `fascia_eta` per popolare le dropdown in sync con la pagina elenchi.
- **quali file toccherai**:
  Il solo e unico `client/src/components/CourseUnifiedModal.tsx` per aggiungere i campi UI e i modali richiamati dai pennini.
- **come li aggiungi nel modale senza rompere nulla**:
  Poiché hai richiesto esplicitamente di "non toccare schema DB", attendo conferma prima di aggiungere direttamente le colonne MySQL per Livello e Età (soluzione 1).
  **Soluzione 1 (Ottimale ma serve conferma)**: Aggiungo due campi `level` e `age_group` allo `schema.ts`. Richiederà un comando `npm run db:push`.
  **Soluzione 2 (Zero modifiche DB)**: Salvo virtualmente questi due dati dentro la colonna Json Array già esistente del Corso, chiamata `statusTags` (es. aggiungendo `LVL:Avanzato` e `AGE:Bambini 3-4 anni`), decostruendoli a video.
  *Dimmi solo se procedere con Soluzione 1 (schema MySQL reale) o Soluzione 2 (array json).*

### D. Doppioni Elenchi
- **elenco completo dei doppioni trovati**:
  `Genere_(cancellare)`, `Genere Corso_(cancellare)`, `Posti Disponibili_(cancellare)`, `Stati Operativi_(cancellare)`.
- **causa tecnica probabile (Il Seed Generator)**:
  Ho localizzato la falla a riga 4928 di `server/routes.ts`, blocco commentato persino con *"Auto-create list if it doesn't exist"*. 
  Quando in passato richiedevi l'endpoint chiamando `genere_corso` al posto del vero `nomi_corsi`, il backend, non trovandolo, **lo creava da zero all'istante di nascosto**. Quando tu lo rinominavi in "_cancellare", alla successiva chiamata errata il backend ne istanziava *uno nuovamente nuovo*.
- **fix minimo per bloccare la rigenerazione**:
  Eliminerò chirurgicamente il blocco logico "Auto-create" dalla rotta GET `custom-lists/:systemName` del server. Se una lista non esiste, l'API restituirà un semplice array vuoto o un 404. Non lo clonerà mai più. Le liste si creeranno esplicitamente o da seed manuale. Dopodiché elimineremo dal DB tutte le vecchie code `_cancellare`.

---
**Attendo la tua approvazione finale e la scelta (1 o 2 per il DB) prima di procedere con il codice!**
