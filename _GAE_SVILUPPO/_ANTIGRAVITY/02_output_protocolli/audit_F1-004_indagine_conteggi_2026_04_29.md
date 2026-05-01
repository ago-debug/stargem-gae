# AUDIT F1-PROTOCOLLO-004: INDAGINE CONTEGGI
**Data:** 29/04/2026
**Contesto:** Discrepanze numeriche UI dopo il cleanup DB

---

## DOMANDA 1 — Da dove arriva ognuno di questi numeri?

1. **585 (Card grande Corsi in `/attivita`)**
   - **Endpoint:** `/api/courses` (senza parametri)
   - **Query / Tabella:** `storage.getCourses()` con fallback che filtra in JS: `c.seasonId === 1 || c.seasonId == null`
   - **Filtri:** Filtra solo per stagione attiva, MA *nessun filtro sul tipo di attività*. Somma quindi corsi, workshop, campus, prove, tutto.

2. **317 (Riepilogo Corsi in `/attivita`)**
   - **Endpoint:** `/api/activities-summary`
   - **Query / Tabella:** SQL Raw `SELECT activity_type, COUNT(*) FROM courses GROUP BY activity_type`
   - **Filtri:** Nessun filtro stagione. Ritorna tutti i record con `activity_type='course'` in tutta la storia del DB.

3. **314 (Header destra in `/attivita/corsi`)**
   - **Endpoint:** `/api/courses?activityType=course&seasonId=active`
   - **Query / Tabella:** Prende i corsi con `activity_type='course'` che appartengono alla stagione corrente.

4. **0 (Card grande Workshop in `/attivita`)**
   - **Endpoint:** `/api/workshops`
   - **Causa:** L'endpoint `/api/workshops` è stato rimosso col passaggio a STI e risponde errore/vuoto.

5. **18 (Riepilogo Workshop in `/attivita` e schede in `/iscritti_per_attivita`)**
   - **Endpoint:** `/api/activities-summary` (conta gli activity_type='workshop' storici in DB).
   - **Endpoint 2:** `/api/courses?activityType=workshop` nella pagina iscritti. Mostra i 18 record esistenti.

6. **0 (Pagina `/attivita/workshops`)**
   - **Endpoint:** L'URL nel componente React ha un errore di battitura (`?activityType=workshop?seasonId=active`). Il backend cerca l'activity type esatto `"workshop?seasonId=active"`, non trovando nulla.

7. **5810 (Iscritti Corsi) vs 17 (Iscritti Workshop)**
   - **Endpoint:** Entrambi filtrati via JS lato frontend. `totalCourseEnrollments` conta le iscrizioni attive relative a corsi `active=1` (5810). Nel caso dei workshop, essendoci 18 workshop ma tutti storici (`active=0`), il tile in panoramica mostra 0 (perché richiede `w.active`), ma la tab mostra 17 (la somma vera delle iscrizioni legate a quei 18 record storici).

8. **216 (Calendario)**
   - **Logica:** Il calendario preleva TUTTI i 585 record della stagione attiva (`/api/courses`) e usa `mapCourseToCalendarEvent`. Ma a schermo mostra solo quelli che corrispondono al **giorno della settimana selezionato** (es. Mercoledì).

---

## DOMANDA 2 — Spiegazione delle discrepanze

**A) 585 vs 317 vs 314 totale corsi**
- 585 è la somma di *tutte le attività* (corsi, prove, campus) in stagione.
- 317 è la somma di tutti i *corsi* in *tutte le stagioni* storiche.
- 314 è il numero corretto di *corsi* in *stagione corrente*.

**B) 0 vs 18 totale workshop**
- 0 nella card deriva dal vecchio endpoint morto `/api/workshops`.
- 0 nella pagina gestione deriva dal typo URL nell'hook React (il doppio `?` impedisce la lettura dell'activity type).
- 18 è il numero corretto di workshop in archivio.

**C) 5810 vs 17 iscritti**
- 5810 sono le iscrizioni sui corsi attivi. 
- 17 sono le iscrizioni sui workshop storici. Il Tile in panoramica li azzera graficamente perché di default filtra via gli eventi con `active=0`.

**D) 216 calendar card vs 317 corsi**
- Il calendario non fa un "totale corsi". Crea eventi grafici solo per le sessioni che avvengono nel giorno selezionato (es. 216 occorrenze di Mercoledì) escludendo chi non ha `dayOfWeek`.

---

## DOMANDA 3 — Quale è il numero "vero"?

- **Corsi:** La Source of Truth è **314**. (I corsi attivi/iscrivibili nella stagione 25-26).
- **Workshop:** La SoT è **18**. (Tutti eventi passati, nessuno attivo al momento).
- **Iscritti Corsi:** La SoT è **5810**. (Iscrizioni valide e con status attivo).
- **Iscritti Workshop:** La SoT è **17** storici (nessuno attuale).

---

## DOMANDA 4 — Mappatura del fix

1. **Card Grande in `attivita.tsx` (585 e 0) e Riepilogo (317)**
   - *Backend:* Modificare `/api/activities-summary` in `server/routes.ts` includendo il filtro `season_id` nella raw query SQL. [Effort S]
   - *Frontend:* Sostituire le vecchie chiamate `/api/courses` e `/api/workshops` senza `activityType` o dismesse con query che puntano ai totali di `/api/activities-summary`. [Effort S]

2. **Pagina `/attivita/workshops` vuota**
   - *Frontend:* In `client/src/pages/workshops.tsx`, cambiare la riga 120 da `?activityType=workshop?seasonId=` a `?activityType=workshop&seasonId=`. [Effort S]

3. **Logica contatore Iscritti (Tile Workshop)**
   - *Frontend:* In `client/src/pages/iscritti_per_attivita.tsx`, cambiare la dicitura o rimuovere il vincolo `w.active` dal conteggio in panoramica se vogliamo mostrare il totale storico. [Effort S]

4. **Calendario 216**
   - *Frontend:* Cambiare la stringa UI da "216 Corsi/Card" a "216 Sessioni oggi" per evitare incomprensioni, e aggiornare la query per non far scaricare tutti i 585 elementi senza `activityType` ma usare la logica bridge. [Effort S]

---

## DOMANDA 5 — Allarmi
**Nessun script sta corrompendo o perdendo dati.** L'anomalia è interamente ascrivibile al frontend che chiama route inesatte (o URL malformati con doppi `?`) o aggregate mode incoerenti (`/api/courses` generico vs SQL Raw senza `season`). Le FK del DB e i record sono sani.
