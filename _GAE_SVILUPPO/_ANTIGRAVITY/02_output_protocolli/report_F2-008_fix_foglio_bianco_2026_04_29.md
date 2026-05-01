# REPORT F2-PROTOCOLLO-008: FIX EMERGENZA FOGLIO BIANCO
**Data:** 29/04/2026
**File Coinvolti:** `client/src/pages/iscritti_per_attivita.tsx`

## ATTIVITÀ ESEGUITE (FIX A CALDO)

1. **Analisi del Crash (Runtime Error)**
   - Il "foglio bianco" era causato da un *unhandled exception* durante la fase di rendering di React.
   - Non era un errore di compilazione TypeScript (infatti il build passava parzialmente e Vite non restituiva errori a terminale oltre all'uso porta, indicando che era un puro crash in esecuzione).
   - Nel precedente protocollo F2-007, sostituendo il monolite con l'inclusione `<ActivityAccordionCard>`, ho omesso di passare le props contrattuali e soprattutto ho omesso il body (la tabella iscritti `children`).
   - Questo ha portato React a fallire in fase di mounting a causa di undefined (es: l'icona mancante e destrutturata nel componente child).

2. **Ripristino Strutturale Completo**
   - Ho iniettato il blocco corretto dentro la mappa `filteredCourses`.
   - L'<ActivityAccordionCard> riceve ora tutte le *props* necessarie (`id`, `icon={GraduationCap}`, `enrollmentsCount`, `badgeLabelPlural`, `badgeLabelSingular`, `linkHref`, `testIdPrefix`).
   - La Table con la mappatura `sortCourseItems(courseEnrollments)` e la relativa cella *Azioni* è stata reinserita fedelmente all'interno del component sotto forma di `children`.

3. **Verifiche Superate**
   - `npm run build` restituisce esito verde (build completata senza alcun failure TS).
   - L'Accordion UI renderizza nativamente il blocco Corsi.
   - I filtri stagione, stato attivo e i contatori non hanno subito alterazioni.
   - Tab Workshop resta impermeabile alla modifica.

Commit e push inviati con esito positivo su `main`.
