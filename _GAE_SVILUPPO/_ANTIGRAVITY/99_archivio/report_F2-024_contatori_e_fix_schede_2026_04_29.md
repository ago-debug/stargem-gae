# REPORT F2-024: Contatori in ActivityManagementPage e Fix Schede Rotte

**Data:** 29/04/2026

## SCOPE REALIZZATO
Come richiesto, è stato adottato un approccio MISTO, con due interventi distinti e circoscritti, evitando refactor strutturali sulle schede isolate.

### INTERVENTO A — Contatori in ActivityManagementPage
- **File modificato**: `client/src/components/activity-management-page.tsx`
- **Dettagli**: È stato importato il modulo `Popover` da `@/components/ui/popover` e implementato il bottone "📋 {N} {Tipo} ▼" nell'intestazione, affiancato al bottone "Esporta CSV".
- **Comportamento**: Al click, mostra il raggruppamento sintetico per "Categoria" e per "Tipologia / Nome", ricavato dinamicamente in base all'array `filteredItems` gestito dal component.
- **Impatto positivo**: Le 4 pagine che utilizzano questo componente (Allenamenti, Domeniche, Lezioni Individuali, Campus) ereditano da ora in poi questa UI senza duplicazione di codice.

### INTERVENTO B — Fix Schede Rotte (Workshop + Allenamenti)

1. **Workshop**
   - **File modificato**: `client/src/pages/workshops.tsx`
   - **Soluzione applicata**: Opzione 1. Il bottone "Scheda" che usava la query string `?workshopId=` è stato corretto per utilizzare `?courseId=`. 
   - **Motivazione**: Più pulita e robusta. I workshop risiedono all'interno del backend nella tabella `courses` con flag `activity_type='workshop'`. Utilizzando il parametro canonico `courseId`, il componente di dettaglio `scheda-corso.tsx` non necessita di alcuna patch o logica duplicata.
2. **Allenamenti**
   - **File modificato**: `client/src/pages/scheda-allenamento.tsx`
   - **Soluzione applicata**: L'endpoint vuoto `["/api/"]` è stato rimpiazzato con l'endpoint REST corretto per filtrare gli allenamenti: `["/api/courses?activityType=allenamenti"]`.
   - **Verifica**: Questo corrisponde a quanto interrogato anche dalla pagina lista list (`trainings.tsx`). Il routing passa regolarmente il parametro `activityId` che viene poi usato per recuperare l'item.

## NOTE ARCHITETTURALI
Le tre schede "isolate" (Domeniche, Lezioni Individuali, Campus) non sono state modificate come da istruzioni ("NON toccare le altre 3 schede"). Saranno incluse all'interno di una futura decisione architetturale unica per la pagina di dettaglio attività.

## FILE MODIFICATI
- `client/src/components/activity-management-page.tsx` (import Popover e logica contatore Header)
- `client/src/pages/workshops.tsx` (fix query string del link in `Scheda`)
- `client/src/pages/scheda-allenamento.tsx` (fix `useQuery` per i dati dell'allenamento)

## SELF-VERIFICA COMPLETA
- ✔️ Build TypeScript pulita (`npm run build` successo al primo colpo).
- ✔️ Integrità mantenuta (Console priva di errori di rendering causati dal nuovo Popover).
- ✔️ Nessun refactor strutturale estraneo al perimetro pattuito con l'utente.
