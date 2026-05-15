# AUDIT F2-PROTOCOLLO-019: BADGE CHE CAMBIA AL CLICK
**Data:** 29/04/2026
**Target:** `client/src/pages/iscritti_per_attivita.tsx`

## SINTESI DIAGNOSTICA
Il comportamento osservato **non è un bug di cache né di backend**, ma è il comportamento 100% atteso del codice client-side. Il "badge" in alto a destra è in realtà un `<Button>` interattivo che controlla un filtro globale: `showOnlyWithEnrollments`.

## ANALISI DELLE DOMANDE

### A) DOVE STA IL BADGE
- File: `client/src/pages/iscritti_per_attivita.tsx` alle righe ~284-291.
- Il componente è letteralmente un `<Button onClick={() => setShowOnlyWithEnrollments(!showOnlyWithEnrollments)}>` situato nell'header globale, visibile in tutte le tab.

### B) DA DOVE VENGONO I NUMERI
Tutti calcolati **lato client** tramite `reduce`/`filter` sugli array fetchati via API:
- `X attivi`: Corsi attualmente visibili in tabella (post-filtri) che hanno `active: true`.
- `Y totali`: Totale dei corsi attualmente visibili in tabella.
- `Z iscritti`: Somma totale delle iscrizioni valide per i corsi attualmente visibili.

### C) COSA SUCCEDE AL CLICK
- Il click inverte lo state React `showOnlyWithEnrollments` (da `false` a `true` o viceversa).
- Quando il filtro è `true`, il frontend rimuove dall'array visualizzato tutti i corsi che hanno `0 iscritti`.
- Di conseguenza, il numero totale di corsi (`Y`) scende, il numero di corsi attivi (`X`) scende, ma **il totale iscritti (`Z`) rimane perfettamente identico**, perché i corsi che abbiamo nascosto non contribuivano comunque al numero di iscritti.

### D) IPOTESI CONFERMATA
L'**Ipotesi 2** è quella esatta. È un problema di **UX ambigua**: l'utente crede che il bottone dorato sia una semplice "label" o "badge statico" informativo, e non capisce perché cliccandolo (magari per sbaglio o per vedere se fa qualcosa) i numeri cambino.

### E) CORRELAZIONE CON F1-008
C'è correlazione matematica: F1-008 ha agganciato 7 corsi "orfani" (senza iscritti) alla stagione attiva. Questi 7 corsi appaiono nel totale (`314 totali`), ma se clicchi il bottone per "nascondere i vuoti", questi 7 scompaiono (tornando a `309`). 

## RACCOMANDAZIONE
- **Se il filtro "Nascondi corsi a 0 iscritti" non serve:** Possiamo rimuovere l'`onClick` e trasformare il bottone in un badge puramente statico (`<Badge>` o `<div>`).
- **Se il filtro serve:** Dobbiamo separare il dato visivo dal controllo interattivo. Trasformeremo l'header in un badge non cliccabile, e aggiungeremo un checkbox esplicito (es: "Mostra solo attività con iscritti") nella barra dei filtri (vicino a quello delle Stagioni), così da rendere chiara l'azione all'utente.
- **Effort Stimato:** 5 minuti (modifica UI chirurgica).
