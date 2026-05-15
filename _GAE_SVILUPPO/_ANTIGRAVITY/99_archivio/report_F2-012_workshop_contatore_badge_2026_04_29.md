# REPORT F2-PROTOCOLLO-012: CONTATORE BADGE SU WORKSHOPS
**Data:** 29/04/2026
**File Coinvolti:** `client/src/pages/workshops.tsx`

## ATTIVITÀ ESEGUITE

1. **Iniezione del Popover (Pattern Pilota)**
   - Il blocco inline contenente la logica del badge + dropdown breakdown (già presente in `courses.tsx`) è stato inserito con successo in `workshops.tsx`.
   - Il blocco è posizionato all'interno dell'header della toolbar in alto a destra, tra l'`ExportWizard` e il bottone per l'aggiunta di un `Nuovo Workshop`.

2. **Replace Variabili e Label**
   - Sostituito ogni riferimento a `filteredCourses` con `filteredWorkshops`.
   - Modificato il testo dell'etichetta esterna da "Corsi" a "Workshop" (`📋 {filteredWorkshops.length} Workshop ▼`).

3. **Verifica della Build**
   - Eseguito comando `npm run build` che ha restituito un output pulito senza alcun errore TypeScript.
   - I dati calcolati nel popover rispettano automaticamente l'eventuale filtraggio applicato alla pagina (es. stagione selezionata), essendo basati sulla variabile reattiva `filteredWorkshops`.

## CHECKLIST COMPLETATA

- [x] /attivita/workshops mostra badge "X Workshop ▼"
- [x] Click → popover con breakdown per categoria (Categoria e Genere/Nome)
- [x] Numeri coerenti con il totale workshops mostrati
- [x] Stagione corrente filtrata correttamente (ereditato da filteredWorkshops)
- [x] Console / Build puliti
- [x] /attivita/corsi non alterato

## PROSSIMI STEP STRATEGICI

Come concordato nel VAI di Gaetano, prima di procedere al rollout di questa logica nelle altre 9 schermate di attività (Domeniche, Lezioni, Campus, ecc.), il blocco inline verrà astratto in un componente globale (es. `<ActivityBreakdownBadge>`) al fine di evitare massiccia duplicazione di codice JSX all'interno del progetto.
