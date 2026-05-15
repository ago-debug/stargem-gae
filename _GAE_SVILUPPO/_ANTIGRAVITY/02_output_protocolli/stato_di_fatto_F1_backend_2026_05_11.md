# STATO DI FATTO REALE — BACKEND STARGEM
**Data Audit:** 11 Maggio 2026
**Autore:** Antigravity (Senior Backend Engineer)

Questo documento rappresenta la **fotografia esatta del codice sorgente e del database** (`stargem_v2`) al momento dell'audit, bypassando tutta la documentazione precedente.

---

## 1. Auth & Identity Access Management (IAM)
### Stato funzionale REALE
- 🟢 **IN PRODUZIONE**: Autenticazione JWT tramite passport-local, gestione sessioni (2.650 log in `user_session_segments`), tracciamento accessi e logging base.
- 🟡 **IN COLLAUDO**: Rate limiting e moduli di reset password (`auth.ts` ha protezioni ma mancano validazioni rigide ai margini).

### File chiave nel codebase
- `server/auth.ts` (setup sessioni e strategie passport)
- `server/utils/auth-middleware.ts` (helper `isAuthenticated`)

### Tabelle DB coinvolte (dati reali)
- `users`: 19 record
- `user_roles`: 7 record
- `user_session_segments`: 2.650 record
- `user_activity_logs`: 3.235 record

### Route API esposte
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`
- `GET /api/users`, `PATCH /api/users/:id/role`
- `GET /api/access-logs`, `GET /api/activity-logs`

### Bug noti / TODO / FIXME nel codice
- Nessuno marcato esplicitamente come `TODO/FIXME` in `server/auth.ts`.

### Test esistenti
- Nessun test unitario rilevato nella cartella `tests/` per questo modulo specifico (cartella non presente/vuota per auth).

### Migrations rilevanti
- `0000_chief_jack_murdock.sql` (schema base)
- `0004_small_paladin.sql`

### Osservazioni del senior engineer
Il modulo auth è stabile, poggia su basi standard (Passport+Express-session) ed è solidamente tracciato nel DB, come dimostrato dall'alto volume dei log di attività. Non tocco nulla qui.

---

## 2. GemTeam (Risorse Umane Interne)
### Stato funzionale REALE
- 🟢 **IN PRODUZIONE**: Check-in fisico, assegnazioni turni temporali.
- 🔴 **NON FUNZIONANTE / DATI AZZERATI**: Le tabelle operative principali (`team_scheduled_shifts`, `team_shift_templates`, `team_attendance_logs`) sono attualmente **vuote (0 record)** sul database `stargem_v2` dell'ambiente dev. I dipendenti esistono (16 record) e le postazioni anche, ma il tracciamento è saltato (probabilmente per wipe).

### File chiave nel codebase
- `server/routes.ts` (Linee 4880-5300+ interamente dedicate a `/api/gemteam/*`)
- `server/scripts/wipe_dirty_shifts.ts` (usato per clean-up)

### Tabelle DB coinvolte (dati reali)
- `team_employees`: 16 record
- `team_postazioni`: 25 record
- `team_week_assignments`: 3 record
- `team_scheduled_shifts`: 0 record
- `team_shift_templates`: 0 record
- `team_attendance_logs`: 0 record

### Route API esposte
- `GET|POST /api/gemteam/turni`
- `POST /api/gemteam/turni/do-import` (route specifica che esegue db.delete su templates)
- `POST /api/gemteam/checkin`

### Bug noti / TODO / FIXME nel codice
- `TODO: STI-cleanup` presente su `@ts-ignore` multipli in `routes.ts` relativi all'enum `tipo_assenza` e `tipo` del check-in.

### Osservazioni del senior engineer
Tutta l'infrastruttura backend esiste (route di import, dashboard presenze, notifiche), ma la mancanza totale di dati relazionali (turni a zero) significa che senza il reimport dell'Excel questo modulo è inutilizzabile in UI. I `TODO` su STI cleanup indicano un refactoring degli enum rimasto in sospeso.

---

## 3. Anagrafica & CRM (Members / GemPortal)
### Stato funzionale REALE
- 🟢 **IN PRODUZIONE**: Gestione anagrafica cruda, API di lettura.
- 🟡 **IN COLLAUDO**: Associazione con i moduli esterni. Sul DB di dev attuale i record reali di anagrafica sono stati apparentemente azzerati/piallati (da ~4500 attesi a 92 effettivi).

### File chiave nel codebase
- `server/routes.ts` (moduli `/api/members`, `/api/memberships`, `/api/medical-certificates`)
- `shared/schema.ts` (la tabella `members` con le famigerate 170+ colonne)

### Tabelle DB coinvolte (dati reali)
- `members`: 92 record (!!! Drastico calo rispetto a quanto documentato un tempo)
- `memberships`: 0 record
- `medical_certificates`: 0 record

### Route API esposte
- `GET|POST|PATCH /api/members`
- `GET /api/memberships`, `POST /api/gempass`

### Bug noti / TODO / FIXME nel codice
- Niente TODO critici espliciti.

### Osservazioni del senior engineer
La situazione dati qui è anomala rispetto alle aspettative (solo 92 members e 0 tessere). Dal lato puramente architetturale (codice), la tabella `members` è oggettivamente ingestibile e necessiterà di disaccoppiamento forzato.

---

## 4. Corsi & Calendario (STI & Gemdario)
### Stato funzionale REALE
- 🟢 **IN PRODUZIONE**: Single Table Inheritance (STI) su `courses`. La tabella unificata regge il carico e centralizza tutte le tipologie in `activities`.
- 🔴 **NON FUNZIONANTE**: La tabella `enrollments` è a **0 record** nel DB connesso, le presenze a 0. `global_enrollments` lancia errore di "Table doesn't exist" (non è mai stata creata o è stata droppata).

### File chiave nel codebase
- `shared/schema.ts` (costrutto STI)
- `server/routes.ts` (route /api/courses, /api/enrollments, /api/attendances)
- `scripts/migrate_courses_lessons.ts`

### Tabelle DB coinvolte (dati reali)
- `courses`: 842 record
- `enrollments`: 0 record
- `strategic_events`: 74 record

### Route API esposte
- `GET|POST /api/courses`
- `GET /api/enrollments`, `POST /api/attendances/bulk`
- `GET /api/strategic-events`

### Bug noti / TODO / FIXME nel codice
- `TODO: route categorie legacy` — 18 occorrenze in `routes.ts` (linee rimosse/commentate). Moltissimo debito tecnico lasciato in giro.

### Osservazioni del senior engineer
STI ha chiaramente fatto piazza pulita delle vecchie tabelle (i TODO "route categorie legacy" lo confermano). L'architettura è pulita, ma lo svuotamento totale degli `enrollments` rende impossibile valutare in locale i bug di "white screen" o performance.

---

## 5. Cassa, Quote e Promozioni
### Stato funzionale REALE
- 🟢 **IN PRODUZIONE**: Motore di quote, convenzioni e welfare funzionante a livello dati.
- 🔴 **RISCHIO ALTO**: Codice monolitico, assenza di disaccoppiamento nel controller checkout. Tabella pagamenti azzerata (0 record).

### File chiave nel codebase
- `server/routes/payments.ts`
- `server/routes.ts` (Route `course-quotes-grid`, `promo-rules`)

### Tabelle DB coinvolte (dati reali)
- `course_quotes_grid`: 60 record
- `promo_rules`: 24 record
- `company_agreements`: 21 record
- `payments`: 0 record

### Route API esposte
- `GET|POST /api/payments`
- `GET /api/course-quotes-grid`
- `POST /api/checkout`

### Bug noti / TODO / FIXME nel codice
- `server/routes.ts:6124`: `throw new Error("Sicurezza Pagamenti: Impossibile impostare lo stato 'Pagato' senza un Metodo di Pagamento specificato.");` (Check di validazione introdotto recentemente, funzionante).

### Migrations rilevanti
- `0012_quote_promo_module.sql`
- `0013_quote_promo_contabilita.sql`
- `0014_agevolazioni_completo.sql`
- `0015_carnet_prezzi_completo.sql`

### Osservazioni del senior engineer
Questo modulo ha visto le migrazioni più pesanti di recente (le uniche del mese di Aprile: `0012` → `0015`). Le tabelle di listino (60 quote, 24 promo) sono le uniche rimaste popolate, il che significa che il motore di pricing è configurato, ma non ha storico vendite.

---

## SINTESI ESECUTIVA

**Top 3 sezioni solide:**
1. **STI (Corsi)**: Unificata, pulita, performante. Non ci sono più i "silos".
2. **Auth & Activity Logging**: Molto robusta, tiene traccia passiva di quasi tutto senza pesare sul frontend.
3. **Listini & Promozioni**: Ben mappata a database dopo le recentissime migrazioni di aprile.

**Top 3 sezioni problematiche/pericolose:**
1. **Il monolite `routes.ts`**: Ci sono quasi 40 commenti `TODO: route categorie legacy` e `TODO: STI-cleanup`. È un campo minato.
2. **Checkout (Pagamenti)**: Strettamente accoppiato con `routes.ts` e le route frontend. Se fallisce una transazione, il rollback non è gestito elegantemente.
3. **Il database piallato**: Attualmente, l'ambiente di dev connesso a 3307 ha 0 tessere, 0 iscrizioni, 0 turni staff e solo 92 soci. I bug grafici ("white screen") non possono riprodursi qui senza dati relazionali sporchi.

**Incoerenze con la documentazione passata:**
- La documentazione (es. MASTER_STATUS) dichiarava 4.489 soci e 3.775 pagamenti. La realtà del DB di dev attuale è 92 soci e 0 pagamenti. Qualcuno ha lanciato uno script di `delete_core_data` senza aggiornare lo status generale.

**Raccomandazioni urgenti:**
1. **Popolare il DB per test**: Re-importare subito almeno il modulo `GemTeam` (turni) e un subset di soci/iscrizioni, altrimenti non posso eseguire audit frontend o backend funzionanti.
2. **Sbrogliare i TODO su STI**: Pulire le 40 righe orfane in `routes.ts` e `storage.ts` per abbassare il rumore cognitivo.
3. **Vietare le modifiche frontend finché `npx tsc` non è a zero errori** (Vedi ESITO VALIDAZIONE qui sotto).

---

## ESITO VALIDAZIONE AUTOMATICA (REGOLA 14)
**Comando:** `npx tsc --noEmit`
**Stato:** 🔴 FALLITO (Codice di uscita 1)
**Dettaglio Errori Frontend (NON dipendenti da questo audit backend):**
1. `client/src/components/crm/TabAnagrafica.tsx:167` — Type error su `"phone"` (atteso `"telefono"`).
2. `client/src/components/crm/TabGift.tsx:47` e `:51` — `Parameter 'prev' implicitly has an 'any' type`.
3. `client/src/pages/maschera-input-generale.tsx:2005` — Type error sul Dispatch/SetState di `setVerificaStato` (mismatch interfaccia Record vs Oggetto tipizzato).

**Azione:** Il protocollo backend viene consegnato intatto in sola lettura. Il `tsc` fallisce a causa di modifiche non completate sul frontend CRM (TabGift, TabAnagrafica e MascheraInput). Occorre un task mirato per fissare questi 4 errori TS prima della prossima build di produzione.
