# AUDIT F2-PROTOCOLLO-021: UNIFORMITÀ TOGGLE E DROPDOWN CALENDARIO
**Data:** 29/04/2026

## A) PATTERN TOGGLE UNIFICATO in LEZIONI INDIVIDUALI
Analizzando il codice di `iscritti_per_attivita.tsx` per la tab "Lezioni Individuali" originaria, il pattern Espandi/Comprimi si presenta così:
- **Doppio o Singolo**: È un SINGOLO bottone toggle (`<Button variant="outline">`).
- **Testo dinamico**: Cambia il testo valutando l'uguaglianza tra array espansi e totale filtrato: 
  `expandedLezioniIndividuali.length === filteredLezioniIndividuali.length ? "Comprimi tutto" : "Espandi tutto"`
- **Posizione**: Si trova nel container flex superiore in linea col titolo (`<div className="flex flex-col md:flex-row md:items-start justify-between gap-4">`), **fisso in alto a destra**, prima e del tutto indipendente dalla riga dei filtri stagione.

## B) PATTERN ATTUALE DELLE ALTRE 5 TAB (Workshop, Corsi, Allenamenti, Domeniche, Campus)
- **Doppio o Singolo**: Sono 2 bottoni separati ("Espandi tutto" e "Comprimi tutto") affiancati, resi visibili dalla condizione `filtered.length > 0`.
- **Posizione**: Sono relegati nel `div` flessibile sottostante, **in basso a destra**, condividendo la riga con il filtro Stagione e la checkbox "Mostra stagioni concluse".
- **JSX di Esempio (Allenamenti)**:
  ```tsx
  <div className="flex gap-2">
    <Button variant="outline" size="sm" onClick={() => setExpandedAllenamenti(filteredAllenamenti.map(a => a.id.toString()))}>Espandi tutto</Button>
    <Button variant="outline" size="sm" onClick={() => setExpandedAllenamenti([])}>Comprimi tutto</Button>
  </div>
  ```

## C) DROPDOWN STAGIONE DEL CALENDARIO ATTIVITÀ
- **File di riferimento**: `client/src/pages/calendar.tsx` e helper `client/src/lib/utils.ts`.
- **Labeling Canonico**: Non vengono usate stringhe hardcoded come `Stagione 2025/2026 (Attiva)`. Il calendario usa la funzione `getSeasonLabel(s, seasons)` che decodifica le stagioni in 3 formati brevi ma esplicativi:
  1. `25/26 (Stagione Attuale)` — per la stagione con `active: true`
  2. `26/27 (Stagione Successiva)` — per data futura
  3. `24/25 (Stagione Precedente)` — per data passata
- **Tutte le Stagioni**: Il calendario nativo *non possiede* la voce "Tutte le Stagioni". Andrà accodata manualmente alla fine del mapping, rispettando il value `"all"`.
- **Ordinamento e Default**: L'ordine rispetta quello dell'API, ma nel nostro refactor imporremo Active > Future > Passate. Il default usa l'ID o `"active"` in base al fallback.

## D) PROPOSTA REFACTOR PER LE 6 TAB
Per raggiungere un'assoluta coerenza in `/iscritti_per_attivita`:
1. **Toggle Singolo (Top-Right)**: Estrarre i bottoni "Espandi/Comprimi" dalla riga filtri e sostituirli con un unico toggle intelligente per ognuna delle 6 tab.
2. **Posizionamento**: Portare il toggle nella riga del `CardTitle`, affiancato al counter (in alto a destra).
3. **Dropdown Stagioni (Pattern Calendario)**: Sostituire il mapping del dropdown F2-018c con `getSeasonLabel`. Le label lette dagli utenti diventeranno più pulite (es. "25/26 (Stagione Attuale)"). Aggiungere l'opzione `<SelectItem value="all">Tutte le Stagioni</SelectItem>` alla fine.
4. **Effort stimato**: ~15-20 minuti. 

## E) RISCHI E ANOMALIE RILEVATE
- **Rischio Duplicazione Tab**: Ispezionando il file, risulta che la tab `lezioni-individuali` appare attualmente duplicata in due posizioni diverse del DOM (probabilmente residuo di un replace non andato a buon fine in un protocollo precedente). Il refactor sarà l'occasione per rimuovere la copia obsoleta e sanare il file definitivamente.
- **Isolamento**: Nessun rischio per `useState` o `useQuery`. L'intervento è cosmetico su JSX e logica visiva. La Build TS sarà preservata intatta.
