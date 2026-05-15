---
aggiornato: 2026-05-11T17:15
ultima_verifica_vs_codice: 2026-05-11T17:15
validita_prevista: 14 giorni
fonti_verificate: [codebase server/, shared/, DB stargem_v2]
---

# Z — Performance, File Pesanti e Ottimizzazione Backend

Questo documento mappa i colli di bottiglia architetturali, i file critici per dimensione e le query SQL costose, offrendo una strategia di mitigazione per garantire scalabilità.

## A. File backend più pesanti (top 5 per LOC)

| File | Righe (LOC) | Di cosa si occupa | Sforzo di Split |
|---|---|---|---|
| `server/routes.ts` | **12.259** | Controller monolitico. Gestisce tutte le route Express (API), logica di business, validazioni, accessi Drizzle. | *Molto Alto*. Contiene logica accoppiata. Da spezzare in `routes/courses.ts`, `routes/members.ts` etc. |
| `server/storage.ts` | **4.788** | DAO Monolitico. Tutti i metodi di interfaccia Drizzle. Spesso bypassato perché `routes.ts` chiama `db` direttamente. | *Medio*. Da trasformare in pattern Repository (`UserRepository`, `CourseRepository`). |
| `shared/schema.ts` | **2.728** | Drizzle Schema completo di tutte le 73 tabelle DB. | *Basso*. Splittabile in file logici dentro `shared/schemas/` e re-esportato. |
| `server/auth.ts` | **517** | Strategie Passport e sessioni. Dimensione accettabile. | *Nessuno*. Non richiede split. |
| `server/scripts/*` | **>300** | Script di importazione dati o migrazioni pesanti. | *Basso*. Spostabili in cartella tasks. |

## B. Query critiche e indici mancanti (SHOW INDEXES)

L'ispezione dello schema live ha evidenziato una grave carenza di indicizzazione su colonne interrogate frequentemente (filtri e dashboard):

- **Tbl `members`**: Presenti indici su `id`, `fiscal_code` e FK. **Mancano indici** su `last_name` e `first_name` (usati nelle ricerche testuali autocomplete) e `email`.
- **Tbl `enrollments`**: Presenti indici FK (`member_id`, `course_id`). **Mancano indici** su `status` (le dashboard filtrano costantemente per status = "Attivo" o "Bozza") e sulle date (`start_date`, `end_date`).
- **Tbl `payments`**: **Mancano indici** su `status` (essenziale per calcolare i sospesi) e `payment_date`. Con la mole prevista (migliaia di transazioni), calcolare le revenue senza indici temporali genererà pesanti table scan.

## C. Dipendenze npm pesanti server-side

Un'analisi esplorativa della cartella `node_modules` evidenzia overhead caricato in fase di runtime Node:
1. **`googleapis` (189 MB)**: Il pacchetto più massiccio in assoluto. Usato verosimilmente solo per l'export/import da GSheets. 
   - *Alternativa*: Sostituire con chiamate `fetch` pure (REST API Google) alleggerendo enormemente il bundle.
2. **`@opentelemetry` (53 MB)**: Infrastruttura di tracing profonda, probabilmente trascinata indirettamente o per esperimenti su Vercel.
3. **`@sentry/node` (23 MB)**: Giustificato per observability.

## D. Endpoints lenti noti / N+1 problem

Il pattern architetturale in `routes.ts` abusa pesantemente dei loop asincroni al posto delle `JOIN` SQL (il classico **Problema N+1**).

Esempi rilevati tramite grep nel codice:
- `routes.ts:1306`: In una query di listing utenti, esegue `await Promise.all(allUsers.map(async (u) => ...))` facendo query aggiuntive *per ogni* utente iterato per calcolare la persistenza.
- `routes.ts:5056` (`/api/gemteam/dipendenti`): Loop N+1 micidiale. Per ogni dipendente iterato (16), esegue **3 query separate** (`db.select()`) per calcolare `checkinOggi`, `checkoutOggi` e `attendanceOggi`. 48 query eseguite contro 1 singola query JOIN/GroupBy possibile. Questo devasterà il database sotto carico.

## E. PROPOSTE DI OTTIMIZZAZIONE in ordine valore/sforzo

### Quick Wins (< 1 giorno, alto impatto)
- [x] **Aggiunta Indici Critici SQL**: Lanciare una migrazione Drizzle per inserire `CREATE INDEX` su `members.last_name`, `enrollments.status`, `payments.status`, e `payments.payment_date`. (✅ COMPLETATO F1-003)
- [x] **Risoluzione N+1 GemTeam**: Riscrivere `/api/gemteam/dipendenti` con un'unica query Drizzle `LEFT JOIN` aggregando check-in e presenze odierne, eliminando il `Promise.all`. (✅ COMPLETATO F1-003)

### Medium effort (1-3 giorni)
- [ ] **Spacchettare `shared/schema.ts`**: Suddividere il mega-file in 5 file logici (anagrafica, corsi, cassa, team, system) per accelerare i tempi di compilazione TypeScript (tsc) sia per frontend che backend.
- [ ] **Eliminare `googleapis`**: Sostituire l'uso massivo della libreria Google con micro-chiamate `fetch()` autenticate, risparmiando quasi 200MB di dependecies server-side.

### Big bets (> 3 giorni)
- [ ] **Smantellamento di `routes.ts`**: Iniziare l'estrazione delle 12.000 righe. Il target primario è estrarre la business logic del checkout e dei pagamenti in un `PaymentService` puro, disaccoppiando DB dalla gestione req/res di Express.
