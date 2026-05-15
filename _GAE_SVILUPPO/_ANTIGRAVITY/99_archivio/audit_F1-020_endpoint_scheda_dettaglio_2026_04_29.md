# AUDIT F1-PROTOCOLLO-020: Endpoint e Architettura Schede Dettaglio
**Data:** 29/04/2026
**Modalità:** SOLA LETTURA

## A) ENDPOINT ESISTENTI (Fetch Singolo)
- **`GET /api/courses/:id` NON ESISTE.** Richiedendo questa rotta, Express fa fallback e restituisce l'HTML dell'app React.
- **`GET /api/courses/:id?include=...` NON ESISTE.**
- Tutte le chiamate `/:id` presenti su `routes.ts` per corsi, workshop ed enrollments sono esclusivamente di tipo `PATCH` e `DELETE` (salvo l'endpoint `GET /api/courses/:id/enrolled-members`).

**Pattern attuali delle pagine `scheda-*.tsx`:**
Tutte le 6 pagine di dettaglio aggirano la mancanza di un endpoint singolo scaricando intere collezioni di dati per poi filtrarle in RAM lato client.
- **`scheda-corso.tsx`**: Chiama `["/api/courses"]` (TUTTI i corsi), poi `find(c => c.id === courseId)`. Usa poi l'unico endpoint specifico esistente (`enrolled-members`) e scarica TUTTI i pagamenti (`["/api/payments"]`) per mapparli.
- **`scheda-allenamento.tsx`**: Chiama `["/api/courses?activityType=allenamenti"]`, scarica TUTTA l'anagrafica (`["/api/members"]`), TUTTI gli enrollments di tipo allenamento, e TUTTI i pagamenti storici del sistema, unendoli lato frontend.
- **Altre schede**: Usano varianti dello stesso medesimo pattern.

---

## B) ANTI-PATTERN INDIVIDUATI
1. **N+1 Inverso (Data Dump):** Per visualizzare la scheda di un singolo corso con 10 iscritti, il client scarica l'intero database di pagamenti, membri e presenze. Questo è insostenibile in produzione e causerà un rapido degrado (lag / Out of Memory browser) all'aumentare dei record.
2. **Duplicazione Logica:** La logica di "join" manuale tra corsi, membri e pagamenti è duplicata 6 volte nei 6 file frontend `scheda-*.tsx`.
3. **Mancanza di Endpoint Singoli:** Non esiste alcun endpoint base per recuperare un entità isolata.

---

## C) DATI EXTRA E QUERY RICCHE
Per mostrare correttamente una "Scheda Dettaglio Unificata", il frontend ha bisogno di:
- Info corso/attività (stagione, sala, insegnante).
- Lista iscritti (con stato tessera, certificato medico, conteggio presenze e stato pagamenti per QUEL corso).

Attualmente la pagina richiede fino a 6 query separate, di cui 4 scaricano l'intero database.

---

## D) PROPOSTA STRATEGIA (Per decisione architetturale F2-026)

### Scenario Raccomandato: SCENARIO 1 "Ibrido" (Unificazione Endpoint + Frontend)
**Strategia:** 
1. Creare **`GET /api/courses/:id`** in backend, che restituisce il corso aggregando in JOIN la `Category`, `Studio` e `Instructor`.
2. Estendere/Refattorizzare **`GET /api/courses/:id/enrolled-members`** affinché il backend unisca GIA' a livello SQL/Drizzle i pagamenti di quell'enrollment e i conteggi presenze (evitando il dump globale di `/api/payments`).
3. Sostituire i 6 file frontend `scheda-*.tsx` con un singolo `CourseDetail.tsx` intelligente, che in sole 2 chiamate HTTP leggerissime ottiene il 100% dei dati necessari per qualsiasi tipo di attività (corso, workshop, allenamento, ecc.).

**Motivazione:** Questo scenario elimina completamente l'anti-pattern delle "query globali" in frontend, abbattendo la latenza e chiudendo in un colpo solo il debito tecnico del frontend (da 6 file a 1).

### Altri scenari scartati:
- **Scenario 2 (Granulare puro):** Multipli endpoint (`/api/courses/:id/payments`, ecc.). Scartato perché causerebbe sfarfallii in UI (waterfall loading).
- **Scenario 3 (Status Quo):** Scartato. Insostenibile in produzione.

---

## E) EFFORT STIMATO (Scenario Raccomandato)
- **Lavoro Backend (API):** ~2 ore (Creazione `/api/courses/:id` con relazioni e potenziamento di `enrolled-members`).
- **Lavoro Frontend (UI):** ~4 ore (Creazione file unificato `CourseDetail.tsx`, sostituzione routing, eliminazione vecchi 6 file, test di regressione UI).
- **Totale Stimato:** ~6 Ore (Ideale per essere gestito interamente nel Protocollo Unificato F2-026).
