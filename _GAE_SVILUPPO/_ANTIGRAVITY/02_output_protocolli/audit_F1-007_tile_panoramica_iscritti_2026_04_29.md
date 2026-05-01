# F1-PROTOCOLLO-007 — Audit completo 11 tile Panoramica Iscritti
**Data:** 29/04/2026
**Modalità:** SOLA LETTURA

---

## DOMANDA 1 — Da dove viene ognuno degli 11 numeri?

| Tile | Variabile React | Calcolo in frontend | Endpoint API | Query SQL implicita |
|---|---|---|---|---|
| **Corsi** | `totalCourseEnrollments` | `activeEnrollments.filter(e => courses.some(c => c.id === e.courseId && c.active))` | `/api/enrollments?activityType=course` + `/api/courses?activityType=course` | Join manuale in client: Iscrizioni stagione attiva ∩ Corsi con `active=1` |
| **Workshop** | `totalWsEnrollments` | `wsEnrollments.filter(e => (e.status==='active' \|\| !e.status) && workshops.some(w => w.id === e.courseId && w.active))` | `/api/enrollments?activityType=workshop` + `/api/courses?activityType=workshop` | Join manuale in client: Iscrizioni stagione attiva ∩ Workshop con `active=1` |
| **Domeniche in Movimento** | `saEnrollments` (`extraActivitiesMap`) | `enrollments.filter(e => e.status === 'active' \|\| !e.status).length` | `/api/enrollments?activityType=domenica_movimento` | Iscrizioni stagione attiva `status='active'` |
| **Lezioni Individuali** | `lezioniIndividualiEnrollments` | *Idem come sopra* | `/api/enrollments?activityType=lezione_individuale` | *Idem* |
| **Allenamenti** | `allenamentiEnrollments` | *Idem come sopra* | `/api/enrollments?activityType=allenamenti` | *Idem* |
| **Affitti** | N/A (Hardcoded `[]`) | `[].filter(...).length` = 0 | Nessuno (oggetto array vuoto in mappa) | Nessuna |
| **Campus** | `caEnrollments` | *Idem come sopra* | `/api/enrollments?activityType=campus` | Iscrizioni stagione attiva `status='active'` |
| **Saggi** | `recEnrollments` | *Idem come sopra* | `/api/enrollments?activityType=saggio` | *Idem* |
| **Vacanze Studio** | `vsEnrollments` | *Idem come sopra* | `/api/enrollments?activityType=vacanza_studio` | *Idem* |
| **Eventi Esterni** | `servEnrollments` (`"servizi"`) | *Idem come sopra* | `/api/enrollments?activityType=servizi` | *Idem* |
| **Merchandising** | N/A (Hardcoded `[]`) | `[].filter(...).length` = 0 | Nessuno (oggetto array vuoto in mappa) | Nessuna |

---

## DOMANDA 2 — Numeri "veri" da DB

| Activity Type | Iscritti totali DB | Stagione attiva | Su corsi attivi | Status active/null |
|---|---|---|---|---|
| **course** (Corsi) | 6.354 | 6.354 | 5.862 | 6.354 |
| **workshop** (Workshop) | 829 | 829 | 0 | 829 |
| **domenica_movimento** | 96 | 96 | 0 | 96 |
| **lezione_individuale** | 1.049 | 1.049 | 0 | 1.049 |
| **allenamenti** | 154 | 154 | 0 | 154 |
| **campus** | 68 | 68 | 0 | 68 |
| **saggio** | 0 | 0 | 0 | 0 |
| **vacanza_studio** | 0 | 0 | 0 | 0 |
| **servizi** (Eventi Esterni) | 0 | 0 | 0 | 0 |
| **merchandising** | 3 | 3 | 0 | 3 |
| **affitti** | 0 | 0 | 0 | 0 |

*(Nota: per le tipologie diverse dai corsi, tutte le attività nel DB hanno `active=0` o `NULL`, per questo "Su corsi attivi" restituisce sempre 0).*

---

## DOMANDA 3 — Discrepanze evidenti

| Tile | Osservato | Da DB (su attività attive) | Da DB (totale iscritti) | Spiegazione Discrepanza |
|---|---|---|---|---|
| **Corsi** | 5.862 | 5.862 | 6.354 | Il tile taglia fuori 492 iscrizioni perché relative a corsi contrassegnati come inattivi (o orfani di corso/cancellati). |
| **Workshop** | 0 | 0 | 829 | Il tile incrocia con i workshop attivi. I workshop nel DB sono tutti inattivi, quindi la moltiplicazione fa 0. |
| **Domeniche in M.** | 96 | 0 | 96 | Il tile NON incrocia l'attività! Conta tutte le iscrizioni a prescindere dallo stato dell'attività padre. |
| **Lezioni Indiv.** | 1.049 | 0 | 1.049 | *Idem come sopra.* |
| **Allenamenti** | 154 | 0 | 154 | *Idem come sopra.* |
| **Campus** | 68 | 0 | 68 | *Idem come sopra.* |

---

## DOMANDA 4 — Workshop = 0 in Panoramica vs 829 in tab

La differenza è dovuta a una logica sbilanciata nel frontend (`iscritti_per_attivita.tsx`):
- Il **Tile in Panoramica** esegue il calcolo: "Dammi le iscrizioni workshop DOVE il workshop collegato ha `active=true`". Nel DB, tutti i workshop hanno `active=0` o `NULL`. Di conseguenza, restituisce 0.
- La **Tab Workshop** fa il conteggio raggruppando TUTTI i workshop ricevuti dall'endpoint (che non filtra per `active=true`) ed effettuando la somma delle loro iscrizioni. In totale, fanno 829.

---

## DOMANDA 5 — 1049 Lezioni Individuali

- **In stagione attiva?** Sì, 1.049 record sono associati a `season_id=1`.
- **Storiche?** Nessuna, appartengono alla stagione corrente.
- **Record `enrollments` su 'lezione_individuale' o 'prenotazioni':** 1.049 esatti.
- **Vero numero:** Il numero 1.049 non è un bug matematico dell'interfaccia, è fedele a ciò che è stato importato dal database storico (presumibilmente l'import ha contato ogni prenotazione o "tacca" di lezione privata come una singola `enrollment` separata, gonfiando numericamente il conteggio rispetto agli iscritti unici).

---

## DOMANDA 6 — Activity_type misti / mappatura

Activity type rilevati nel DB non mappati nei Tile della Panoramica:
- `buono_regalo` (21 record) -> Nessun tile.
- `prova_gratuita` (222 record), `paid_trial` (2 record), `free_trial` (2 record) -> Nessun tile (i tile delle prove sono stati nascosti tramite `isActive=false` nell'`ACTIVITY_REGISTRY`).
- `membership` (2.767 record) -> Nessun tile (le tessere non dovrebbero risiedere in enrollments, è un residuo dell'import che confonde).
- Esistono tile che includono più activity_type? No, il mapping dell'API endpoint per i tile `extraActivities` punta rigorosamente a una singola stringa (es. `activityType=lezione_individuale`). Qualsiasi altro typo o sinonimo (come `prenotazioni`) viene tagliato fuori dai conteggi.

---

## DOMANDA 7 — Raccomandazione finale

**Problema riscontrato:** La Panoramica è "strabica". I tile Corsi e Workshop filtrano le iscrizioni agganciandosi forzatamente allo stato `active=true` dell'attività padre, mentre i restanti 9 tile si disinteressano dello stato dell'attività padre e contano puramente gli iscritti.

**Logica unificata:** La Panoramica dovrebbe smettere di fare array mapping e `filter` client-side pesantissimi (che faranno crashare il browser all'aumentare dei record). La logica standard dovrebbe essere: **"Iscritti (status=active) nella Stagione Corrente (season_id=1)"**, a prescindere dal flag *active* del corso, delegando idealmente i conteggi a `/api/activities-summary` (opportunamente patchato per accettare `seasonId`). In attesa di quello, rimuovere `.some(c => c.active)` dai calcoli in frontend per allineare tutto a quanto già fanno gli altri 9 tile.

**Effort:** Medio (M) — Si risolve rimuovendo il filtro `&& c.active` dai calcoli di `totalCourseEnrollments` e `totalWsEnrollments` alla riga 147/150 di `iscritti_per_attivita.tsx` per uniformare la matematica in emergenza, ma richiede anche un fix sulle Hardcoded dependencies di `Affitti` e `Merchandising`.
**Priorità:** Alta. Avere 0 Workshop in vetrina confonde gli utenti e falsa l'affidabilità dell'intero modulo.
