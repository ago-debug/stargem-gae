# F1-PROTOCOLLO-011 — Audit struttura schede attività per colonna Cellulare
**Data:** 29/04/2026
**Modalità:** SOLA LETTURA

---

## A) Struttura File
Le "Schede Attività" non sono gestite da un singolo componente astratto, ma sono file di pagina indipendenti, ognuno con la propria implementazione.
I file coinvolti (che presentano una tabella iscritti) sono 8:
1. `client/src/pages/scheda-corso.tsx`
2. `client/src/pages/scheda-workshop.tsx`
3. `client/src/pages/scheda-domenica.tsx`
4. `client/src/pages/scheda-allenamento.tsx`
5. `client/src/pages/scheda-lezione-individuale.tsx`
6. `client/src/pages/scheda-campus.tsx`
7. `client/src/pages/scheda-saggio.tsx`
8. `client/src/pages/scheda-vacanza-studio.tsx`

*(Nota: Affitti e Merchandising puntano a `/prenotazioni-sale` e `/gestione-attivita-stub` e non dispongono della classica visualizzazione a tabella di iscritti delle altre attività).*

## B) Tabella Iscritti
- **Componente:** Ciascuno degli 8 file disegna la propria tabella usando la libreria standard Shadcn (`<Table>`, `<TableHeader>`, `<TableBody>`, ecc.). Non esiste un componente condiviso `<ActivityEnrollmentTable>`.
- **Colonne:** Le colonne sono **hardcoded** nel JSX di ogni singola pagina.
- **Logica Dati:** Anche la logica di preparazione dei dati differisce. Ad esempio, `scheda-corso.tsx` ottiene un array piatto dal backend con i dati calcolati via SQL, mentre `scheda-domenica.tsx` usa l'helper `buildEnrolledMembersData` per combinare `members`, `enrollments`, `payments` localmente nel frontend.

## C) Fonte Dati Cellulare
- **Database:** Il dato risiede nella tabella `members` nei campi `mobile` (cellulare) o `phone` (telefono fisso). Esiste anche `whatsapp`.
- **Backend:** 
  - Nelle schede che usano l'helper client-side (es. scheda-domenica), i dati anagrafici completi (incluso `mobile`) sono già fetchati dall'endpoint generalista `/api/members`.
  - Nelle schede che usano gli endpoint ottimizzati (es. `scheda-corso.tsx` che chiama `/api/courses/:id/enrolled-members`), la query SQL **NON** include attualmente il campo cellulare (estrae solo `first_name`, `last_name`, `email`, `gender`).
- **Nomi Esatti:** `mobile` è il nome del campo sia a livello di DB (Drizzle schema) sia nel frontend.

## D) Effort Stimato
- **Tempo:** Circa 20-30 minuti.
- **Interventi richiesti:**
  1. **Backend:** Modificare la query SQL in `server/routes.ts` per `/api/courses/:id/enrolled-members` (e analoghi se presenti per workshop) per aggiungere `m.mobile` e `m.phone`.
  2. **Frontend:** Aprire gli 8 file `.tsx` elencati, aggiungere l'intestazione `<TableHead>Cellulare</TableHead>` e la cella `<TableCell>{data.mobile || '-'}</TableCell>` nella funzione di `.map()`.

## E) Raccomandazione Fix
Si raccomanda l'**Opzione A**: aggiungere la colonna direttamente nei componenti e nelle query SQL esistenti, accettando la duplicazione.
**Motivazione:** L'Opzione B (refactoring in un componente `<SharedTable>` comune) richiederebbe uno sforzo enorme (> 2 ore) per uniformare come le 8 pagine formattano e passano i dati (date di scadenza, badge pagamenti, ecc.).
L'Opzione A è chirurgica, a basso rischio, rapida e rispetta il design attuale a "silos" che verrà poi revisionato quando l'intera app passerà alla STI (Single Table Inheritance).
