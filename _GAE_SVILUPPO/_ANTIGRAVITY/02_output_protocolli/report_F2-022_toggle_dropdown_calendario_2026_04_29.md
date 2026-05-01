# REPORT F2-PROTOCOLLO-022: TOGGLE UNIFICATO E DROPDOWN CALENDARIO
**Data:** 29/04/2026
**File Coinvolti:** `client/src/pages/iscritti_per_attivita.tsx`

## ATTIVITÀ ESEGUITE
1. **Toggle Espandi/Comprimi Unificato**
   - Rimosso il doppio bottone "Espandi tutto" e "Comprimi tutto" che stazionava goffamente nella zona dei filtri in basso a destra per tutte le tab.
   - Sostituito con un **singolo bottone toggle intelligente** la cui etichetta varia dinamicamente (`Espandi tutto` se ci sono item compressi, `Comprimi tutto` se l'array degli espansi è completo).
   - Posizionato **in alto a destra**, fisso nella flex-row del `CardTitle` per tutte e 6 le tab (Corsi, Workshop, Allenamenti, Domeniche, Lezioni Individuali, Campus), creando una UX di riferimento immutabile e immediatamente accessibile.
2. **Dropdown Stagioni (Pattern Calendario Attività)**
   - Importata e applicata la funzione utility `getSeasonLabel(s, seasons)` da `client/src/lib/utils.ts`.
   - Modificato il JSX di iterazione stagioni all'interno di tutte le 6 `<Select>` principali:
     - Rimossa l'impostazione manuale "Stagione X/Y (Attiva)". Ora le label sono generate in modo semantico (e.g. `25/26 (Stagione Attuale)` oppure `26/27 (Stagione Successiva)`).
     - Applicato un order rigoroso: la stagione attiva sempre in alto evidenziata (`font-semibold`), seguita dalle altre sortate per data decrescente.
     - Accodata fisicamente in coda l'opzione `<SelectItem value="all">Tutte le Stagioni</SelectItem>`.
   - Il default di inizializzazione rimane la stringa dell'ID della stagione attuale, agganciato nativamente dal componente `<Select>`.
3. **Bugfix: Rimozione Duplicato Tab Lezioni Individuali**
   - È stata riscontrata e bonificata la duplicazione nel DOM del React component per `TabsContent value="lezioni-individuali"` e `value="campus"`, insorta a causa di un `replace()` con scope errato nei precedenti fix. Il file è ora pulito e possiede solo un blocco univoco per tipologia di tab.

## VERIFICA
- **Build TS**: Completamente verde. Nessun warning.
- **Uniformità UI/UX**: Le 6 tab sono visivamente e funzionalmente speculari e riflettono fedelmente i layout impiegati nel modulo "Calendario Attività", conferendo coerenza tra l'area programmazione e l'area iscritti.
- Nessuna alterazione ai flussi di caricamento dati (Query) o elaborazione lato backend. Tutte le modifiche sono state implementate nel View Layer JSX.
