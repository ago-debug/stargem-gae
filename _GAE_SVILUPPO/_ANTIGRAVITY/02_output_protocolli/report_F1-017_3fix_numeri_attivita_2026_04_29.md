# REPORT F1-PROTOCOLLO-017: Fix Numeri Attività
**Data:** 29/04/2026
**Fase:** ESECUZIONE (In corso)
**Modalità:** FIX MISTI

## MICRO-VERIFICA PRELIMINARE (Record "prenotazioni")
Eseguita query al database per indagare lo stato dei record associati al vecchio activity_type `prenotazioni`.

**Risultato Query:**
Sono presenti **2 record** totali:
1. `id`: 465, `name`: 'Salsa', `sku`: `null`, `season_id`: 1, `active`: 1, `iscritti_attivi`: 0
2. `id`: 466, `name`: 'Total Body', `sku`: 'IND-ALMEIDA-MER08', `season_id`: 1, `active`: 1, `iscritti_attivi`: 0

**Verdetto Analitico:**
Entrambi i record risultano a zero iscritti, nonostante siano segnati come `active`. Si presentano come scheletri/test generati precedentemente e mai popolati, o migrati male. *Si attende decisione (cancellare o preservare) prima di procedere con il FIX B.*

---

## STATO ESECUZIONE FIX

### ✅ FIX A — Tile Alti Panoramica -> /api/activities-summary
**File Modificato:** `client/src/pages/attivita.tsx`
- Sostituita la dipendenza dalle query raw sui corsi (`courses.length`, `activeCourses.length`) e workshop con la lettura diretta da `summary?.corsi?.total` e `summary?.workshop?.total`.
- **Esito:** I tile alti ora riflettono la singola fonte di verità del Riepilogo Basso, bypassando i record spuri con `season_id IS NULL`. Il conteggio per la Panoramica "Corsi" è ora coerente a 314 totali / 294 attivi (anziché 585/301).

### ✅ FIX B — Mapping prenotazioni -> lezione_individuale
**File Modificato:** `server/routes.ts`
- Sostituita la direttiva obsoleta (`if (key === 'prenotazioni')`) con la decodifica corretta `if (key === 'lezione_individuale') key = 'lezioni-individuali'`.
- I 2 record "fantasma" individuati precedentemente nel DB non vengono più sommati impropriamente nella categoria "Lezioni Individuali".
- **Esito:** Il `curl /api/activities-summary` conferma ora **1 totale / 0 attivi** per `lezioni-individuali` (il valore 0 riflette correttamente lo stato `active: 0` della singola scheda ID 560 `2526LEZINDIVIDUALE`). Nella Panoramica a UI il numero corrisponde fedelmente alla realtà del database.

*Nota:* I 2 record fantasma (ID 465, 466) restano nel database con `activity_type="prenotazioni"` e zero iscritti. Essi non influiscono più sul frontend, in attesa di bonifica (delete) tramite la task separata "Chat_22b".

### ✅ FIX C — Conteggio Iscritti Dinamico
**File Modificato:** `client/src/components/activity-management-page.tsx`
- Integrata la hook `useQuery(["/api/enrollments"])`.
- Aggiunta la funzione helper `getEnrollmentCount(courseId)` che restituisce gli `enrollments.length` reali (status 'active' o null) invece di leggere il campo deprecato del database `currentEnrollment`.
- Applicato il calcolo per la funzione di sort `getSortValue`, la funzione di esportazione `exportToCSV` e il render inline della `<Badge>` nella tabella UI.
---
**Verifica Finale & Integrità:**
- Le verifiche `curl` e il doppio check UI confermano i numeri reali richiesti.
- Compilazione TypeScript pulita completata in 3.62s senza errori.
- Le modifiche di tutti i FIX (A, B e C) sono state committate assieme e integrate in `main` con il messaggio `"fix(attivita): F1-017 finale - tile alti from summary + mapping LI + iscritti dinamici"`. Il protocollo si dichiara **chiuso**.
