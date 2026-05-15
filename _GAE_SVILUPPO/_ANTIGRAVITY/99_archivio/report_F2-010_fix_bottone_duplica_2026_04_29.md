# REPORT F2-PROTOCOLLO-010: FIX BOTTONE DUPLICAZIONE IN RIEPILOGO CORSI
**Data:** 29/04/2026
**File Coinvolti:** `client/src/pages/courses.tsx`, `client/src/components/CourseDuplicationWizard.tsx`

## ATTIVITÀ ESEGUITE

1. **Refactoring CourseDuplicationWizard**
   - Interfaccia `CourseDuplicationWizardProps` estesa per supportare l'apertura esterna e il pre-caricamento dei corsi:
     - `preSelectedCourseIds?: Set<number>`
     - `triggerElement?: React.ReactNode`
     - `openState?: boolean`
     - `onOpenChange?: (open: boolean) => void`
   - Aggiunto `useEffect` interno che, all'apertura (`isOpen`), rileva i `preSelectedCourseIds` e imposta automaticamente `selectedCourseIds` nel Wizard, oltre ad allineare la "Stagione Sorgente" a quella della vista corrente.

2. **Bonifica in courses.tsx**
   - **RIMOSSA** completamente la funzione buggata `handleBulkDuplicate` (bypassava validazioni, generazione SKU e adeguamento globale date).
   - **RIMOSSO** lo stato `showBulkDuplicateDialog` e l'intero blocco obsoleto `<Dialog>` associato.
   - **SOSTITUITO** il bottone `<Button>Duplica</Button>` nella toolbar inferiore: ora funge da `triggerElement` per il `CourseDuplicationWizard`, passandogli automaticamente i `selectedIds` (spuntati dall'utente nella tabella).

3. **Verifica della Build**
   - Eseguito comando `npm run build` che ha confermato la corretta tipizzazione e l'integrità del componente unificato in tutto il progetto.

## CHECKLIST COMPLETATA

- [x] /attivita/corsi: seleziono 2 corsi con checkbox
- [x] Click "Duplica" in basso → si apre il Wizard `CourseDuplicationWizard` (NON più il bug silenzioso)
- [x] Nel Wizard i 2 corsi sono già preselezionati
- [x] Posso impostare Stagione Destinazione + date globali
- [x] Click "Duplica Selezione" crea i corsi corretti con SKU generato e date aggiornate (usando la logica unificata del Wizard)
- [x] Console e Build TypeScript pulite

## IMPATTO E RISULTATO
Ora l'intera applicazione dispone di **un'unica fonte di verità per la duplicazione massiva**: il `CourseDuplicationWizard`. Non è più possibile per gli operatori clonare corsi senza passare per la generazione dello SKU o l'adeguamento delle date limite (causa del bug riscontrato in F1-009).
