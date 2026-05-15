# AUDIT F1-PROTOCOLLO-014: Disallineamento /attivita/* vs /iscritti_per_attivita
**Data:** 29/04/2026
**Modalità:** SOLA LETTURA

## RISPOSTE ALL'AUDIT

### A) ARCHITETTURA PAGINE
- **La Panoramica (`/attivita`)** è gestita dal file `client/src/pages/attivita.tsx`.
- **Le pagine specifiche** per ogni attività sono gestite da componenti dedicati:
  - `/attivita/corsi` → `courses.tsx`
  - `/attivita/workshops` → `workshops.tsx`
  - `/attivita/domeniche-movimento` → `sunday-activities.tsx`
  - `/attivita/lezioni-individuali` → `individual-lessons.tsx`
  - `/attivita/allenamenti` → `trainings.tsx`
  - `/attivita/campus` → `campus-activities.tsx`
  - `/attivita/saggi` → `recitals.tsx`
  - `/attivita/vacanze-studio` → `vacation-studies.tsx`
- **Architettura:** È un mix. Le pagine più complesse (Corsi e Workshop) hanno componenti monolitici totalmente dedicati (`courses.tsx`, `workshops.tsx`). Le altre usano un componente riutilizzabile wrapper (`<ActivityManagementPage />`) passandogli endpoint e label diverse.

### B) FONTI DATI E ENDPOINT
- **Tile Alti (Panoramica):**
  Usano due endpoint: `useQuery({ queryKey: ["/api/courses"] })` e `useQuery({ queryKey: ["/api/workshops"] })`.
- **Riepilogo Attività (basso in Panoramica):**
  Usa un singolo endpoint dedicato: `/api/activities-summary` che esegue una query SQL cruda sul backend.
- **Pagine Specifiche (es. `/attivita/lezioni-individuali`):**
  Costruiscono l'URL passando il tipo, ad es: `/api/courses?activityType=prenotazioni` per le lezioni individuali, o `/api/courses?activityType=domeniche` per le domeniche.

### C) FILTRI E LOGICA
- Sì, ci sono logiche disallineate.
- In `/iscritti_per_attivita` i record vengono scaricati tutti e poi la UI li filtra in base al dropdown stagionale (`seasonId`).
- Nella Panoramica (`attivita.tsx`), il counter dei "Corsi" chiama `/api/courses` SENZA specificare un `activityType`. Il backend, non ricevendo il tipo, restituisce un fritto misto di **tutti i record della tabella `courses`** che appartengono alla stagione corrente (corsi, domeniche, campus, ecc).

### D) DISCREPANZA PROBABILE su CORSI
La tua ipotesi è molto vicina alla realtà tecnica, ecco le conferme:
- **585 (Tile Alto):** È la somma di TUTTI i record in tabella `courses` (indipendentemente dal tipo di attività) che matchano la stagione attiva. 
- **330 (Riepilogo Basso):** La query cruda `/api/activities-summary` esegue il `GROUP BY activity_type` su `activity_type='course'`, ma **non filtra per stagione**. Conta tutti i corsi di tutte le stagioni.
- **310 (`iscritti_per_attivita`):** Usa correttamente il filtro `activityType=course` combinato col filtro client-side per `seasonId=2`. Questa è l'unica verità corretta.

### E) DISCREPANZA su WORKSHOP (0/0 in Tile Alto)
Il motivo è tecnico e drastico: il frontend cerca di chiamare la rotta `/api/workshops`, **ma questa rotta non esiste** in `server/routes.ts`. La chiamata fallisce in HTTP 404, il dato torna `undefined` e il contatore mostra 0. In `/iscritti_per_attivita` il dato invece c'è perché la dashboard chiama in modo corretto `/api/courses?activityType=workshop`.

### F) PERCHÉ DOMENICHE E LEZIONI INDIVIDUALI SONO VUOTI
È un disallineamento a livello di dizionario / magic string nei parametri URL:
- `/iscritti_per_attivita` (che funziona) chiama: `activityType=domenica_movimento` e `activityType=lezione_individuale`.
- `/attivita/domeniche-movimento` (che risulta vuoto) chiama: `activityType=domeniche`.
- `/attivita/lezioni-individuali` (che mostra record vecchi/errati) chiama: `activityType=prenotazioni`.
Trovando un parametro che non matcha i dati bonificati nel DB, la lista torna vuota o parziale.

### G) RACCOMANDAZIONI
- **File interessati:** ~5 file (i componenti UI per domenica/lezioni/panoramica, e un fix su `server/routes.ts` per il Riepilogo SQL).
- **Approccio Minimal vs Strutturale:** Suggerisco un mix. Un riallineamento "chirurgico minimale" delle magic strings per uniformare le chiamate a quelle di `/iscritti_per_attivita` (`domenica_movimento`, `lezione_individuale`, `workshop`).
- Allo stesso tempo, per la Panoramica, basta cambiare la chiamata frontend dei Workshop facendola puntare all'endpoint corretto, e iniettare la clausola `WHERE season_id = ?` nella query raw SQL di `/api/activities-summary`.
- **Effort Stimato:** Basso (meno di 2 ore). Nessuna rivoluzione architetturale necessaria in questa fase, solo uniformità delle nomenclature e dei parametri.
