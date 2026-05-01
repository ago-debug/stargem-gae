# AUDIT F1-PROTOCOLLO-016: Incongruenze Numeriche Attività
**Data:** 29/04/2026
**Modalità:** SOLA LETTURA + QUERY DB

## RISPOSTE ALL'AUDIT

### QUERY DI VERIFICA (Q1, Q2, Q3)
Ho eseguito le 3 query richieste tramite script Node + MySQL2. Ecco i risultati esatti:

- **Q1 (Corsi totali e attivi attuali):** `Stagione 2025/2026` → Totali: `314`, Attivi: `294`
- **Q2 (Records `lezione_individuale`):** C'è **1 solo record**: ID 560, SKU `2526LEZINDIVIDUALE`, stagione_id `1` (che è la stagione attiva a db).
- **Q3 (Enrollments reali):**
  - allenamenti: 154
  - campus: 68
  - course (corsi): 6354
  - domenica_movimento: 96
  - lezione_individuale: 38
  - visita_medica: 1011
  - workshop: 829

---

### A) DIAGNOSI PROBLEMA A — Tile Alti Panoramica
- **Endpoint Chiamati:** Corsi chiama `/api/courses` (senza filtri), Workshop chiama `/api/courses?activityType=workshop` (post-F1-015).
- **Perché 585 Corsi?** In `server/routes.ts`, quando viene filtrata la lista dei corsi per la stagione corrente, la logica di fallback accetta tutti i record che matchano la stagione corrente **OPPURE che hanno `season_id IS NULL`**. Essendo presenti centinaia di record legacy con `season_id IS NULL`, questi vengono riversati nella chiamata `/api/courses` facendo schizzare il numero a 585.
- **Proposta di Fix:** Anziché fare pesanti e ridondanti fetch API per popolare i Tile Alti, la soluzione migliore è unificare la *Single Source of Truth* nella Panoramica. I tile alti dovrebbero leggere direttamente i contatori dall'oggetto `summary` restituito da `/api/activities-summary`, assicurando che pagina alta e pagina bassa mostrino sempre gli stessi numeri esatti (es. 314).

### B) DIAGNOSI PROBLEMA B — Lezioni Individuali: 2 vs 1
- **Il Record Fantasma:** Non esiste alcun record fantasma! Il DB contiene esattamente **un solo** record `lezione_individuale`.
- **Perché "2 totali" nel Riepilogo Basso?** In `server/routes.ts` è presente un vecchio blocco di if: `if (key === 'prenotazioni') key = 'lezioni-individuali';`. L'endpoint ignora del tutto la nuova stringa `lezione_individuale` e sta raggruppando e mostrando sotto la voce "Lezioni Individuali" i due vecchi record `prenotazioni` rimasti silenti nel DB (id 465 e 466).
- **Proposta di Fix:** Modificare l'if in `routes.ts` per mappare `lezione_individuale` → `lezioni-individuali` e `domenica_movimento` → `domeniche-movimento`, ignorando i vecchi tipi deprecati.

### C) DIAGNOSI PROBLEMA C — Iscritti = 0
- **Fonte dei Dati Errata:** Le schede in `/attivita/<tipo>` usano il componente monolitico `ActivityManagementPage.tsx` o sue varianti. Questo componente **non scarica mai gli enrollments**.
- **La colonna DB Morta:** Il componente prova a stampare il valore di una colonna statica del DB `courses.current_enrollment`. Questa colonna nel database è di fatto inattiva (su 602 corsi, ben 596 hanno valore fisso `0`). Non viene aggiornata dai processi di creazione iscrizione.
- **Il Paragone con Iscritti:** `/iscritti_per_attivita` funziona perché scarica `/api/enrollments` e calcola le presenze dinamicamente col frontend `enrollments.filter(e => ...).length`.
- **Proposta di Fix:** Modificare `ActivityManagementPage.tsx` e le altre pagine standalone per adottare lo stesso pattern di `/iscritti_per_attivita`: fare fetch di `/api/enrollments` e calcolare `currentEnrollment` al volo nel frontend per ogni riga della tabella.

---

### PROPOSTE DI FIX & EFFORT

| Problema | Soluzione Proposta | Effort |
| :--- | :--- | :--- |
| **A (Tile Alti)** | Modificare `attivita.tsx` per mappare i contatori dei tile in alto leggendo i valori dall'API `activities-summary` (la singola fonte di verità della pagina). | 10 min |
| **B (Ghost LI)** | Pulire le mappature in `server/routes.ts` sostituendo `prenotazioni` e `domeniche` con `lezione_individuale` e `domenica_movimento`. | 5 min |
| **C (Iscritti 0)** | Aggiungere `useQuery` per gli enrollments in `ActivityManagementPage.tsx` e derivare il count dinamicamente al momento del render della riga tabella. | 15 min |
