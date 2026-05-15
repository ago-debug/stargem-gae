# REPORT F2-PROTOCOLLO-015: TAB LEZIONI INDIVIDUALI ACCORDION
**Data:** 29/04/2026
**File Coinvolti:** `client/src/pages/iscritti_per_attivita.tsx`

## ATTIVITÀ ESEGUITE
1. **Estrazione dal Loop Dinamico**
   - Rimosso `lezioni-individuali` dal loop `activityMenuItems` (fallback) aggiungendo `i.id !== "lezioni-individuali"` nel `.filter()`.
2. **Creazione Stati Locali Dedicati**
   - Introdotti stati isolati per mantenere i controlli e la ricerca circoscritti a questa tab:
     - `searchQueryLI`
     - `selectedSeasonIdLI`
     - `showConcludedSeasonsLI`
     - `expandedLezioniIndividuali`
3. **Logica di Filtraggio**
   - Definita la costante `filteredLezioniIndividuali` per applicare nativamente ricerca testuale, filtro di stagione e skip attività vuote tramite iscrizioni legate a `individualLessons`.
4. **Header Switch "Panoramica"**
   - Aggiornato lo switch `headerCounterText` per intercettare il case `lezioni-individuali`. Ora il contatore calcola esattamente: `N attivi / M totali · Z iscritti` e disattiva correttamente il counter quando visualizzato senza attivi.
5. **Pattern `ActivityAccordionCard`**
   - Generato il nuovo blocco `<TabsContent value="lezioni-individuali">` con iterazione su `filteredLezioniIndividuali`.
   - Passate rigorosamente tutte le properties al componente (inclusa la table *children* e l'oggetto `activity={li}`) usando come icona base `UserCheck` coerentemente con i meta dati `getActiveActivities()`.

## VERIFICA
- **Build TS**: Verde. Nessun errore sollevato.
- **Tab Lezioni Individuali**: Accoglie le schede chiuse per impostazione predefinita. L'espandi tutto funziona in base al total filter count.
- **Isolamento Moduli**: Nessuna regressione sui moduli `Corsi`, `Workshop`, `Allenamenti` o `Domeniche`.
- **Indipendenza da F1-013-LIGHT**: Nonostante i due record anomali attualmente presenti sotto `lezione_individuale`, il pattern a fisarmonica agisce indipendentemente, permettendo in futuro al db di aggiornarsi senza rompere la renderizzazione.

## NEXT STEPS
La dashboard Iscritti Per Attività ha ora 4 silos estratti su 11. Tutti i pattern replicati (Workshop, Corsi, Allenamenti, Domeniche, Lezioni Individuali) godono di state isolation.
