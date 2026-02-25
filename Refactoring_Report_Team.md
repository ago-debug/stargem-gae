# Report Refactoring URL & Convenzioni Menu

Questo documento riassume le modifiche effettuate al sistema di rotte e le nuove linee guida per la gestione del menu.

## Modifiche Effettuate

### 1. Refactoring URL Anagrafica
L'URL della pagina principale di gestione iscritti è stato aggiornato per coerenza con la nuova terminologia:
- **Vecchio URL**: `http://localhost:5001/iscritti`
- **Nuovo URL**: `http://localhost:5001/anagrafica_a_lista`

Tutti i collegamenti interni (Sidebar, Dashboard, Corsi, Workshop) e i sistemi di controllo permessi lato server sono stati aggiornati di conseguenza.

### 2. Preservazione Pagine Precedenti
Il componente `members.tsx` è ora servito esclusivamente sulla nuova rotta `/anagrafica_a_lista`.

### 3. Centralizzazione Gestione Iscritti
La schermata e le funzionalità di "Iscritti per Corso" sono state integrate nella nuova pagina "Iscritti per Attività" (`/iscritti_per_attivita`). 
- È stato creato un "hub" centralizzato dove gli iscritti sono visualizzabili per **tutte** le categorie di attività (Corsi, Workshop, ecc.) tramite tab interni alla pagina, senza necessità di navigare altrove.
- La pagina isolata `course-enrollments.tsx` e la voce di menu "Iscritti per Corso" sono state eliminate per evitare duplicazioni.

---

## Nuova Convenzione per Rimozione Voci Menu

D'ora in avanti, ogni volta che una voce viene rimossa dal menu principale ma deve essere mantenuta nel progetto come riferimento o archivio, si applicherà la seguente convenzione:

1. **Etichetta (Label)**: Aggiungere il suffisso `_old` al nome visualizzato (es: "Anagrafica" -> "Anagrafica_old").
2. **URL**: Aggiungere il suffisso `_old` all'indirizzo (es: `/iscritti` -> `/iscritti_old`).

> [!IMPORTANT]
> Assicurarsi di aggiornare anche il file `App.tsx` (lato client) e `routes.ts` (lato server) per riflettere il cambio di percorso e mantenere integri i permessi di accesso.

---
*Data Aggiornamento: 24 Febbraio 2026*
