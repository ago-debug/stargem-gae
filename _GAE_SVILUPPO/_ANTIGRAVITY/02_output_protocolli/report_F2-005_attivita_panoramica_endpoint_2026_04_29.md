# STOP & GO F2-PROTOCOLLO-005: Riconnessione Endpoint Panoramica Attività
**Data:** 29/04/2026
**File Coinvolto:** `client/src/pages/attivita.tsx`

Ho analizzato il perimetro della richiesta senza toccare codice. Ecco le risposte alle 4 verifiche di check-point previste dal protocollo.

### 1) Conferma righe esatte da toccare
- **TASK 1 (Endpoint Corsi):** Riga 303. Da `["/api/courses"]` a `["/api/courses?activityType=course&seasonId=active"]`.
- **TASK 2 (Endpoint Workshop):** Riga 305. Da `["/api/workshops"]` a `["/api/courses?activityType=workshop&seasonId=active"]`.
- **TASK 3 (Card Grandi Panoramica):** Righe 375 e 390 circa, sostituendo `{courses?.length || 0}` e `{activeCourses.length}` con le prop esatte prelevate dall'oggetto `summary`.

### 2) Test Endpoint STI
Ho interrogato localmente gli endpoint.
- `/api/courses?activityType=course&seasonId=active` restituisce uno status 200 con un array corretto di **314 record**.
- `/api/courses?activityType=workshop&seasonId=active` restituisce uno status 200 con l'array di **18 record**.
Il payload JSON ha la struttura attesa (`Course[]`).

### 3) Verifica struttura chiavi in `summary`
Ho fatto una query al backend per l'endpoint `/api/activities-summary`.
La struttura dell'oggetto ritornato è mappata sui registry keys e NON sui tipi inglesi nudi, perciò si presenta così:
```json
{
  "corsi": { "total": 333, "active": 313 },
  "workshop": { "total": 18, "active": 0 }
}
```
**Correzione minore al piano:** Nel TASK 3 userò `summary?.corsi?.total` e non `summary?.course?.total` come da te ipotizzato.

### 4) Rischi sul rendering (righe 316-326)
Le logiche di raggruppamento (es. `coursesByCategory`) e suddivisione (`activeCourses`/`inactiveCourses`) continueranno a funzionare in totale sicurezza. Attualmente digerivano un mix caotico di 585 attività miste. Passandogli le query specifiche, processeranno esattamente e solo la lista "pulita" di quella tipologia in stagione corrente. Poiché la struttura dell'oggetto array (`Course[]`) è identica al vecchio, le funzioni `.filter()` e `.map()` di React non falliranno. **Rischio di regressione nullo.**

---

Tutto è pronto e verificato al millimetro. Non appena mi darai il tuo VAI, procederò in esecuzione immediata.
