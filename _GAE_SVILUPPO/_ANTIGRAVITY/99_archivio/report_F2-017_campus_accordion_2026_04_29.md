# REPORT F2-PROTOCOLLO-017: TAB CAMPUS ACCORDION
**Data:** 29/04/2026
**File Coinvolti:** `client/src/pages/iscritti_per_attivita.tsx`

## ATTIVITÀ ESEGUITE
1. **Estrazione dal Loop Dinamico**
   - Rimosso `campus` dal loop dinamico `activityMenuItems` (fallback) aggiungendo `&& i.id !== "campus"` nel `.filter()`.
2. **Creazione Stati Locali Dedicati**
   - Introdotti stati isolati per mantenere i controlli e la ricerca circoscritti a questa tab:
     - `searchQueryCampus`
     - `selectedSeasonIdCampus` (inizializzato a stringa vuota `""` per preselezione dinamica)
     - `showConcludedSeasonsCampus`
     - `expandedCampus`
3. **Logica di Filtraggio Canonica**
   - Definita la costante `filteredCampus` per applicare nativamente ricerca testuale, logica di season ID refattorizzata (F2-018c) e controlli sulle iscrizioni `caEnrollments`.
4. **Header Switch "Panoramica"**
   - Aggiornato lo switch `headerCounterText` per intercettare il case `campus`. Il contatore calcola in modo unificato `N attivi / M totali · Z iscritti`.
5. **Pattern `ActivityAccordionCard` + UI Uniformata**
   - Generato il nuovo blocco `<TabsContent value="campus">` con iterazione su `filteredCampus`.
   - Implementato l'header e il layout filtraggio secondo il pattern canonico F2-018c, incluso il dropdown dinamico e pre-selezionante della stagione da `sortedSeasons`.
   - Passate rigorosamente tutte le properties al componente (inclusa la table *children* e l'oggetto `activity={campus}`) usando l'icona base `Users`.

## VERIFICA
- **Build TS**: Verde. Compilazione TypeScript pulita e passata con successo.
- **Tab Campus**: Implementa fedelmente le 4 schede chiuse per default, bottoni Espandi/Comprimi distinti, search in top-right e dropdown stagioni canonico.
- **Isolamento Moduli**: Nessuna regressione sui 5 moduli preesistenti (Corsi, Workshop, Allenamenti, Domeniche, Lezioni Individuali).

## NEXT STEPS
La dashboard Iscritti Per Attività ha ora 6 silos estratti su 11. Il design e l'interazione UX sono rigorosamente coerenti, e il componente `<ActivityAccordionCard>` gestisce fluidamente le espansioni senza sovraccaricare il DOM.
