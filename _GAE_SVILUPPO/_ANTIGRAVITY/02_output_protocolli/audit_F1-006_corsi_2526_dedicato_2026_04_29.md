# F1-PROTOCOLLO-006 — Audit dedicato Corsi stagione 25-26
**Data:** 29/04/2026
**Modalità:** SOLA LETTURA

---

## DOMANDA 1 — Conteggi atomici

- **A) Tutti i record courses (no filtro):** 605
- **B) Per activity_type:**
  - `allenamenti`: 2
  - `buono_regalo`: 1
  - `campus`: 4
  - `course`: 333
  - `domenica_movimento`: 13
  - `free_trial`: 2
  - `lezione_individuale`: 3
  - `membership`: 2
  - `merchandising`: 1
  - `paid_trial`: 2
  - `prenotazioni`: 2
  - `prova_gratuita`: 222
  - `workshop`: 18
- **C) Solo activity_type = 'course':** 333
- **D) Per season_id (su tutti i record):**
  - `NULL`: 232
  - `1`: 353
  - `2`: 19
  - `3`: 1
- **E) Solo course in stagione attiva (id=1):** 307
- **F) Solo course attivi in stagione attiva:** 289
- **G) Solo course attivi con day_of_week:** 289
- **H) Solo course attivi con day_of_week + start_time:** 289
- **I) Solo course attivi con day_of_week + start_time + end_time:** 289
- **J) Solo course attivi con TUTTI i campi base + categoria:** 289
- **K) Solo course attivi con instructor:** 289
- **L) Course con start_date / end_date validi rispetto a oggi:** 289
- **M) Course nel range settimana corrente (27apr-3mag):** 289

---

## DOMANDA 2 — Tabella riepilogo

| Filtro | N. record | Differenza dal precedente |
|---|---|---|
| A: tutti courses | 605 | — |
| C: solo 'course' | 333 | -272 (esclusi WS, prove, ecc) |
| E: 'course' stagione attiva | 307 | -26 (esclusi storici altre stagioni e record orfani null) |
| F: 'course' stagione + active=1 | 289 | -18 (esclusi inattivi) |
| G: + day_of_week | 289 | 0 |
| H: + start_time | 289 | 0 |
| I: + end_time | 289 | 0 |
| J: + category_id | 289 | 0 |
| K: + instructor_id | 289 | 0 |
| L: + date valide oggi | 289 | 0 |
| M: + nella settimana 27apr-3mag | 289 | 0 |

---

## DOMANDA 3 — Numero che Gaetano ricorda (~298 o ~289)

Il numero esatto è **289**.
Si ottiene con la formula esatta: **`activity_type='course' AND season_id=1 AND active=1`**.
I record non subiscono ulteriori perdite aggiungendo filtri di completezza (giorno, orari, categoria, istruttore e validità date), il che significa che il DB per i corsi della stagione attiva è stato caricato in maniera sorprendentemente pulita e completa rispetto ai campi obbligatori.

---

## DOMANDA 4 — Record SPORCHI (problemi di dati)

Analisi dei record con `activity_type='course'` e `season_id=1`:

- **A) Senza categoria:** 0
- **B) Senza insegnante:** 0
- **C) Senza giorno o orario:** 0
- **D) SKU duplicati:** 0
- **E) Active=NULL:** 0

*(Tutti i conteggi sono 0. Non ci sono record sporchi per i 289 corsi attivi di questa stagione).*

---

## DOMANDA 5 — Mappatura endpoint API

1. **`/api/courses` (nudo)**
   - **Query Sql**: `SELECT * FROM courses WHERE season_id=1 OR season_id IS NULL` (Non filtra per `activityType` né per `active=1`, e il backend forza i record `null` nella stagione corrente).
   - **N. record restituiti**: 585
   - **Corrispondenza D1**: Nessuna diretta (è la somma dei totali assoluti di stagione 1 + null).

2. **`/api/courses?activityType=course`**
   - **Query Sql**: `SELECT * FROM courses WHERE activity_type='course' AND (season_id=1 OR season_id IS NULL)` (Non filtra per `active=1`).
   - **N. record restituiti**: 314
   - **Corrispondenza D1**: E (307) + 7 record che hanno `season_id=NULL` e si agganciano erroneamente alla ricerca della stagione corrente.

3. **`/api/courses?activityType=course&seasonId=active`**
   - **Query Sql**: Identica alla precedente (il fallback `active` risolve a `1`, e intercetta i null).
   - **N. record restituiti**: 314
   - **Corrispondenza D1**: Come sopra.

4. **`/api/activities-summary`**
   - **Query Sql**: `SELECT activity_type, COUNT(*) as total, SUM(CASE WHEN active=1 THEN 1 ELSE 0 END) as active FROM courses GROUP BY activity_type` (Ignora completamente il `seasonId`).
   - **N. record restituiti**: total: 333, active: 313.
   - **Corrispondenza D1**: `total` = Domanda C (333). `active` = I 289 correnti + i 24 corsi attivi appartenenti a stagioni vecchie o non definite (null).

5. **`/api/courses?activityType=workshop&seasonId=active`**
   - **Query Sql**: `SELECT * FROM courses WHERE activity_type='workshop' AND (season_id=1 OR season_id IS NULL)` (Non filtra per `active`).
   - **N. record restituiti**: 18.

6. **`/api/courses?activityType=workshop`**
   - **Query Sql**: Identica alla precedente per via del fallback implicito a `activeSeason`.
   - **N. record restituiti**: 18.

---

## DOMANDA 6 — Raccomandazione finale

**IL NUMERO VERO:** Attualmente ci sono esattamente **289 corsi erogabili per la stagione 25/26** (attivi e dotati di tutti i dati essenziali: giorno, orari, categoria, istruttore). I record storici e quelli inattivi formano il resto del DB.
**RECORD SPORCHI:** I 289 record correnti **non presentano sporcizia** (0 record senza categoria, insegnante, giorno o con duplicati SKU). Tuttavia, esistono **7 record con `season_id=NULL`** e **24 record `active=1` di vecchie stagioni** che "inquinano" l'endpoint `/api/activities-summary` e le query senza controllo esplicito, generando le discrepanze (333, 314, 313). 
**RACCOMANDAZIONE:** Nessuna bonifica distruttiva è necessaria, ma servirà un banale SQL UPDATE in un F1 futuro per spegnere l'active=0 ai 24 record fuori stagione e assegnare `season_id=1` (oppure 3) ai 7 orfani. I fix UI di F2-005 e F2-006 **sono al sicuro**, ma andranno sviluppati passando sempre `active=true` dal frontend per ricevere in risposta esattamente i 289 record attesi, ignorando `activities-summary` fino a che non sarà limitato anch'esso alla sola stagione attiva.
