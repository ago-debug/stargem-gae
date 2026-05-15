# F1-PROTOCOLLO-009 — Audit bug Duplicazione Massiva Corsi
**Data:** 29/04/2026
**Modalità:** SOLA LETTURA

---

## DOMANDA 1 — Modale Duplicazione Massiva
- **File:** `client/src/components/CourseDuplicationWizard.tsx`
- **Origine SKU:** L'SKU viene generato a runtime nella tabella tramite la funzione interna `generateSKUForCourse(newCourse, targetSeasonId)`.
- **Stringa XXXXXXXX:** Non è un placeholder hardcoded. La funzione genera la radice dell'anno (es. `2627`), ma se l'oggetto corso passato per l'anteprima non ha un `instructorId` mappato o manca di `dayOfWeek`/`startTime`, i blocchi falliscono e restituiscono le stringhe di fallback ("XXX" per il cognome, "XXX" per il giorno, "XX" per l'ora). Il risultato finale collassa in `2627XXXXXXXX`.

## DOMANDA 2 — Endpoint duplicazione
- **Endpoint:** `POST /api/courses` (il normale endpoint di creazione, NON esiste un endpoint specifico per la duplicazione).
- **Logica server-side:** Nessuna logica di calcolo SKU o date esiste nel backend per questa operazione. Il server si fida ciecamente del payload ricevuto dal client (`req.body`).
- **Problema del bottone "Duplica":** Se l'utente usa il Wizard (modale), i dati vengono passati bene. MA se l'utente usa il bottone "Duplica" situato in basso nella schermata Riepilogo Corsi (`client/src/pages/courses.tsx`, funzione `handleBulkDuplicate`), la funzione client clona l'oggetto json, forza a mano `insertData.sku = null;`, `insertData.seasonId = targetSeasonId` e spara la POST al server mantenendo inalterate le vecchie date!

## DOMANDA 3 — Record duplicati nel DB
Eseguita query sui record creati dopo il 27 Aprile con season_id = 2 e SKU nullo o sporco. Risultato: **3 record**.
| ID | SKU | Nome | Season | Active | Start Date | End Date | Insegnante |
|---|---|---|---|---|---|---|---|
| 846 | null | Acrobatica | 2 (26-27) | 1 | 2025-08-31 | 2026-06-29 | 9514 |
| 847 | null | Gioco Ginnastica | 2 (26-27) | 1 | 2025-08-31 | 2026-06-29 | 9514 |
| 848 | null | Cerchio e Tessuti | 2 (26-27) | 1 | 2025-08-31 | 2026-06-29 | 9505 |

## DOMANDA 4 — Date sbagliate
Le date sono **sbagliate** (01/09/2025 - 30/06/2026).
- **Causa:** Il bottone "Duplica" rapido in `courses.tsx` fa uno spread operator (`{ ...course }`) dell'oggetto originale e lo invia al backend senza alcun offset temporale (+1 anno).
- **Modale:** Il modale ha effettivamente i campi per settare e sovrascrivere le "Date globali", ma l'utente cliccando il bottone rapido in basso ha bypassato completamente il Wizard.

## DOMANDA 5 — Visibilità Calendario/Planning
- **Motivo dell'invisibilità:** Il calendario/planning usa il motore `expandCourseRecurrence` dal server (`server/services/unifiedBridge.ts`) che cicla le settimane comprese tra la `startDate` e la `endDate` del corso per generare i quadratini nel calendario.
- Poiché la `endDate` dei corsi clonati è ferma a **Giugno 2026**, quando l'utente si sposta sul calendario a Settembre 2026 (inizio della nuova stagione) il motore smette di generare ricorrenze, lasciando la settimana vuota. Non c'entra l'SKU nullo, è un problema di finestra temporale esaurita.

## DOMANDA 6 — Generazione SKU
Esiste una utility: `generateSKUForCourse` (inclusa in `CourseDuplicationWizard.tsx`).
Esegue il pattern corretto: Stagione + Cognome + Giorno + Ora.
Ma essendo isolata all'interno del frontend del Wizard, il bottone "Duplica massivo" di `courses.tsx` non può usarla, e pertanto invia null.

## DOMANDA 7 — Raccomandazione fix
1. **Fix Codice (Effort M):** Eliminare la funzione spuria `handleBulkDuplicate` in `courses.tsx` e fare in modo che il bottone "Duplica" apra semplicemente il modale `CourseDuplicationWizard` popolato con le righe selezionate. Questo obbligherà l'utente a passare per l'interfaccia sicura che rigenera SKU e calcola le nuove date, impedendo cloni passivi buggati. In alternativa, spostare tutta la logica di duplicazione lato backend (`POST /api/courses/duplicate-bulk`). La prima opzione è più rapida e riutilizza UI esistente.
2. **Rischio Architetturale:** Molto basso. I 3 corsi fallati nel DB non hanno iscritti e possiedono `sku = null` e date del passato. Possono (e devono) essere piallati via con un `DELETE` chirurgico prima di procedere, pulendo così lo storico.
3. **Recupero BORDONI:** Verranno eliminati. Gaetano potrà reduplicarli correttamente attraverso il Wizard una volta fixato.
