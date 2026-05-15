---
aggiornato: 2026-05-13T16:39
ultima_verifica_vs_codice: 2026-05-13T16:39
validita_prevista: 14 giorni
prompt_di_riferimento: F1-004
fonti_verificate: [codebase server/, shared/, DB stargem_v2, classificazione_stargem_v2.pdf]
---

# 🎯 Megaaudit Flusso Iscrizioni Backend — F1-004
**Sessione 1: Aree A, B, C, D**

## PARTE 1 — MAPPA REALE DELLO STATO ATTUALE (lato backend)

| Area | Stato 1-5 | Cosa funziona oggi (backend) | Cosa manca (backend) | Endpoint backend (path + handler) | Tabelle DB | Rischio operativo | Priorità | Note tecniche |
|---|---|---|---|---|---|---|---|---|
| **A. Identità, ricerca e univocità** | 3 - Parziale | API di ricerca avanzata, logica anti-duplicato CF e Email (con bypass per isMinor), controllo telefono. | Un motore centralizzato di validazione per omonimi veri; la validazione CF esiste ma è eludibile dalla UI in alcuni scenari (se vuota). | `GET /api/members/check-cf`<br>`GET /api/members/check-email`<br>`GET /api/members/check-phone` | `members`<br>Indici: `fiscal_code`, `email_idx`, `last_name_idx`, `first_name_idx` | Medio | Alta | La logica `isMinor` per aggirare il blocco email esiste (`checkEmail`), ma si basa su un flag calcolato dalla data di nascita. |
| **B. Ruoli multipli della stessa persona** | 2 - Solo a DB | L'architettura supporta ruoli disaccoppiati: lo stesso ID può stare in `team_employees` e `enrollments`. Il DB modella la "Persona Fisica" in `members`. | Assenza di un "Role Manager" API o endpoint che unifichi la vista della persona a 360°. Non si capisce dal `getMember` che ruoli ha nel sistema. | (Diffuso su varie route) | `members`<br>`team_employees`<br>`enrollments`<br>`users` (tramite `user_id`) | Alto | Media | Si appoggia sull'integrità referenziale, ma le query sono fatte in silos. |
| **C. Nuovo utente vs esistente vs duplicati** | 3 - Parziale | Logica avanzata Levenshtein nel backend per identificare duplicati per similarità nome/CF (`getDuplicateFiscalCodes`), merge avanzato su DB. | Gli endpoint per la deduplica esistono (`/api/members/merge`, `/api/members/duplicates`), ma gestiscono le collisioni a valle, non intercettandole robustamente all'inserimento guidato. | `GET /api/members/duplicates`<br>`POST /api/members/merge`<br>`GET /api/members/duplicate-stats` | `members`<br>`member_duplicate_exclusions` | Alto | Alta | Funzione sofisticata in `storage.ts` per calcolare punteggi sui duplicati, una delle gemme nascoste del backend. |
| **D. Verifica dati tramite link** | 4 - Non Presente | Nulla. | Manca tabella dei token di verifica, generatori di link JWT/OTP, endpoint pubblico per accesso e completamento dati senza login. | Nessuno. | Nessuna. | Basso (oggi non fa parte del flusso) | Alta | Non esiste infrastruttura B2C per la verifica link-based (solo OTP per lo staff su `users`). Da costruire da zero in Fase 2. |

### Flusso reale vs desiderato (Aree A-D)

| Flusso reale oggi (backend) | Flusso desiderato (backend) | Gap | Rischio | Intervento consigliato |
|---|---|---|---|---|
| Le ricerche avvengono interrogando `members` in via diretta e controllando duplicati solo al `POST /api/members` tramite `checkCF`/`checkEmail`. Le collisioni vengono respinte con 409 Conflict o parzialmente permesse se minorenni. | Un servizio di Identity Unification che raggruppa tutti i ruoli e avvisa in tempo reale di conflitti, offrendo il merge istantaneo o il collegamento famigliare. | Manca un hub centralizzato delle identità (es. API `/api/identity/check`). | Dati sporchi a causa di bypass utente/segreteria di fronte a vincoli troppo rigidi o assenti. | Consolidare i check in un unico validatore Zod condiviso per backend e frontend, integrare l'algoritmo di similarità all'inserimento. |
| Nessun link per autoverifica. Tutto è delegato alla segreteria. | Invio di token sicuri e temporanei ai clienti per auto-compilare l'anagrafica e confermare dati. | Intero modulo B2C mancante. | Sovraccarico Desk e ritardi nell'acquisizione documenti/firme. | Creazione tabella `verification_tokens` e API pubbliche protette da token `/api/public/verify`. |

---

## Sessione 2: Aree E, F, G, H

| Area | Stato 1-5 | Cosa funziona oggi (backend) | Cosa manca (backend) | Endpoint backend (path + handler) | Tabelle DB | Rischio operativo | Priorità | Note tecniche |
|---|---|---|---|---|---|---|---|---|
| **E. Minorenni, tutori e famiglie** | 4 - Non Presente (in API) | La tabella `members` traccia `isMinor`. È definita a schema la tabella pivot `member_relationships`. Esistono gli endpoint di lettura `GET /api/members/:memberId/relationships` e `children`. | **Mancano le API di scrittura**. La funzione storage `createMemberRelationship` esiste ma NON è mai chiamata in `server/routes.ts`. `POST /api/members` non accetta/non salva tutori strutturati. | `GET /api/members/:memberId/relationships`<br>`GET /api/members/:memberId/children`<br>*(Manca POST)* | `members`<br>`member_relationships` | Medio | Alta | La tabella `member_relationships` attualmente è dead-code dal punto di vista dell'inserimento. I tutori finiscono probabilmente nei `notes` o in campi piatti. Riferimento mappa: [[D_2026_05_11_Mappa_Dati_e_Frontend_BACKEND]]. |
| **F. Pratica operativa / Workflow** | 4 - Non Presente | Nulla centralizzato. | Manca una tabella `dossiers` o `practices`. Lo stato è frammentato tra `enrollments.status`, `payments.status`, `memberships.status` e `medical_certificates.status`. Manca un endpoint `/api/dossiers` che aggreghi la "mancanza documenti" in un'unica vista per il desk. | (Endpoint multipli, nessun orchestratore) | Manca tabella dedicata. Si appoggia a: `enrollments`, `payments`, `memberships`, `medical_certificates` | Alto | Media | Più un problema di esperienza d'uso (Desk UX). Il DB è normalizzato (Stato 2), ma manca l'aggregatore lato backend che emetta l'alert "Pratica Incompleta". |
| **G. Pagamenti** | 3 - Parziale | Motore checkout solido (`POST /api/checkout/complete`) con scrittura su `journal_entries`. Controlli stretti di sicurezza inseriti di recente in `PATCH /api/payments/:id` (blocca importi negativi, forza metodo se "Pagato"). | Il DB ignora la differenza tra pagante, partecipante e intestatario. In `payments` esiste solo `memberId`. Se il genitore paga per il figlio, la fattura a chi va? Inolte il bulk save in `POST /api/maschera-generale/save` mescola pagamenti e iscrizioni malamente. | `POST /api/checkout/complete`<br>`POST /api/payments`<br>`PATCH /api/payments/:id`<br>`POST /api/maschera-generale/save` | `payments`<br>`journal_entries` | Alto | Alta | Fissare i ruoli finanziari (PayerId vs ParticipantId). I quick wins sulle performance indici applicati in [[MASTER_STATUS]] aiutano, ma l'architettura dati è monca. |
| **H. Tesseramento** | 3 - Parziale | Logica robusta in `POST /api/memberships` con `buildMembershipPayload` per bloccare doppie tessere per la stessa stagione. | **Coupling estremo**. `POST /api/memberships` aggiorna in dual-write i campi piatti legacy (`tessereMetadata`, `entityCardNumber`) su `members` e spawna un record `payment` in automatico se `skipPayment` non è true. | `POST /api/memberships`<br>`GET /api/memberships` | `memberships`<br>`members`<br>`payments` | Alto | Alta | Questo endpoint fa troppe cose implicitamente. Retaggio del monolite `routes.ts`. Va diviso in "Genera Tessera" puro, slegandolo dall'anagrafica piatta (obiettivo Fase 3 di F1-004 come da [[CHECKLIST_PROGETTO]]). |

### Flusso reale vs desiderato (Aree E-H)

| Flusso reale oggi (backend) | Flusso desiderato (backend) | Gap | Rischio | Intervento consigliato |
|---|---|---|---|---|
| Il minore viene iscritto e il genitore/tutore non ha legami formali a DB (o finisce in un campo note piatto). La UI non può usare `/api/members/relationships` in scrittura. | Un endpoint `/api/members` che accetti un payload con `relationships` e popoli `member_relationships` strutturata. | API di inserimento assenti in backend. | Nessun controllo legale incrociato (chi firma i documenti del minore?). | Creare `POST /api/members/:id/relationships` e aggiornare l'endpoint principale per salvare `relationships` in un'unica transazione. |
| Nessuna pratica. La segreteria deve guardare 4 tab diverse (Corsi, Pagamenti, Tessere, Certificati) per capire cosa manca. | Un orchestratore `DossierService` che restituisca un JSON `GET /api/members/:id/dossier-status` con i "semafori" di cosa è incompleto. | Manca orchestratore backend. | Lentezza operativa in segreteria. | Creare DTO aggregatore in sola lettura, evitando nuove tabelle se le FK sono già adeguate. |
| I pagamenti salvano l'ID utente in `memberId`. Se il padre paga la quota del figlio, a livello contabile è il figlio che paga. | Modello dati che distingua `participant_id` (chi fa il corso) da `payer_id` (chi paga) e `billing_entity_id` (a chi è intestata la ricevuta). | Modello dati carente sulla `payments`. | Ricevute/Fatture errate. | `ALTER TABLE payments ADD COLUMN payer_id` e `billing_entity_id`. |
| Il tesseramento non è indipendente. Se genero tessera, aggiorno anagrafica cruda e genero debito cassa. | La generazione tessera `POST /api/memberships` inserisce solo la riga tessera. Il checkout si occupa della cassa separatamente. | Accoppiamento API. | Bug di sistema in flussi non standard (es. tessere omaggio o tessere importate). | Smantellare il dual-write di `tessereMetadata` in `POST /api/memberships` e disaccoppiare la generazione debito. |

---

## Sessione 3: Aree I, J, K, L

| Area | Stato 1-5 | Cosa funziona oggi (backend) | Cosa manca (backend) | Endpoint backend (path + handler) | Tabelle DB | Rischio operativo | Priorità | Note tecniche |
|---|---|---|---|---|---|---|---|---|
| **I. Certificato Medico** | 2 - Critico / Incoerente | La tabella `medical_certificates` esiste e gestisce scadenze. C'è un endpoint `POST /api/medical-certificates` pulito per i metadati testuali. | **Rischio di Memory Leak Database**. Il file effettivo caricato (PDF/IMG) non è salvato in un bucket/storage o `documents`, ma è schiantato come stringa Base64 nel JSON `attachmentMetadata` di `members` (tramite `POST /api/members`). | `POST /api/medical-certificates`<br>`POST /api/members` (per Base64) | `medical_certificates`<br>`members` | Alto (DB Bloat, Crash per payload enormi) | Critica | **Convergenza cross-asse potenziale con F2-003**: Il FE segnalava lo stesso problema su `TabAllegati.tsx`. BE e FE sono bloccati su questo anti-pattern del Base64 in-memory. |
| **J. Documenti e Modulistica** | 3 - Parziale | I consensi privacy (`consentImage`, `consentMarketing`, ecc.) sono boolean salvati su `members`. | Non esiste una tabella `documents` per tracciare le versioni o il path dei file firmati dai `members` (a differenza di `staff_document_signatures` per lo staff). Tutto finisce in Base64 in JSON. | `POST /api/members` | `members` | Alto | Alta | Stessa **convergenza cross-asse potenziale con F2-003** dell'Area I. Manca l'astrazione di un Multipart Upload verso S3/Storage locale. |
| **K. Area Tesserati (B2C)** | 3 - Parziale | In `server/auth.ts`, il ruolo `client` viene reindirizzato a `/area-tesserati`. La tabella `members` ha una FK `userId` verso `users`. | Manca un flusso di onboarding B2C. `POST /api/register` crea l'utente ma non lo collega automaticamente a un `member`, né c'è un form pubblico per l'autocompilazione anagrafica. | `POST /api/register`<br>`POST /api/login` | `users`<br>`members` | Basso | Media | **Convergenza cross-asse potenziale con F2-003**: Il FE mostra i pulsanti B2C come mockup. Il BE conferma che le API B2C per eseguire azioni non esistono ancora. |
| **L. Omnicanalità / Touchpoint** | 4 - Non Presente | Nulla. Le API attuali (`/api/checkout/complete`) funzionano bene ma sono pensate e protette (`isAuthenticated`) per gli operatori della segreteria. | Nessun generatore di "Magic Link" o token di condivisione carrello per permettere all'utente di pagare da casa. | N/A | N/A | Alto (Colli di bottiglia fisici al desk) | Alta | **Convergenza cross-asse potenziale con F2-003**: Il FE ha evidenziato l'assenza di share-link. Il BE non espone endpoint "unauthenticated but tokenized" per il self-checkout. |

### Flusso reale vs desiderato (Aree I-L)

| Flusso reale oggi (backend) | Flusso desiderato (backend) | Gap | Rischio | Intervento consigliato |
|---|---|---|---|---|
| Il Base64 del certificato/documento viaggia intero nel JSON di `POST /api/members` e gonfia il database in `attachmentMetadata`. | `POST /api/upload` (Multipart form) riceve il file, lo salva su disco/S3, e restituisce un URL/ID da salvare nella nuova tabella `member_documents`. | Motore di storage assente. | Crash dell'app e del DB per esaurimento memoria (V8 heap out of memory). | **Urgente:** Implementare upload stream e tabella `member_documents`. |
| L'operatore raccoglie i moduli cartacei, flagga i consensi a mano e forse carica una scansione Base64. | Firme digitali/OTP tracciate via DB con hashing dei consensi al momento della firma da casa. | Modulo firme digitali assente. | Non conformità GDPR in caso di audit. | Progettare un log di audit dei consensi (chi ha firmato, quando, con quale IP). |
| Il cliente non può registrarsi da solo legandosi ai propri dati storici. | Registrazione B2C che incrocia Nome+CF e lega automaticamente il nuovo `user` al `member` preesistente. | Algoritmo di matching B2C-Member assente. | Disallineamento anagrafiche. | Creare `POST /api/b2c/register` con identity matching. |
| Pagamenti possibili solo se l'operatore preme il tasto nel CRM. | L'operatore genera un link (es. Stripe Checkout Session o token interno) e lo manda via WhatsApp. Il cliente paga e l'app riceve il webhook aggiornando la pratica. | API Pubbliche di pagamento assenti. | Code in segreteria. | Costruire l'hub dei token temporanei e dei webhook di pagamento esterni. |

## Sessione 4: Aree M, N, O, P

| Area | Stato 1-5 | Cosa funziona oggi (backend) | Cosa manca (backend) | Endpoint backend (path + handler) | Tabelle DB | Rischio operativo | Priorità | Note tecniche |
|---|---|---|---|---|---|---|---|---|
| **M. Stati e Blocchi** | 4 - Assente | La rotta `POST /api/maschera-generale/save` valida in maniera restrittiva solo la presenza di dati contabili "orfani". | Mancano **Hard-Blocks**. Il backend accetta pagamenti e tesseramenti anche se l'utente ha il certificato medico scaduto, debiti pregressi o un'età incompatibile. | `POST /api/maschera-generale/save` | N/A | Alto | Alta | Tutta la responsabilità della conformità è scaricata sull'operatore umano. |
| **N. Non Tesserati (Ospiti)** | 4 - Assente | Esiste la tabella `participant_types` (Es. Ospite). | Il backend non ha una vera entità "Guest". L'ospite viene inserito come `member` standard, inquinando il DB con anagrafiche incomplete usate per una sola prova. | (Stesse rotte di `members`) | `members` | Medio | Bassa | Manca un endpoint "Fast Track" per identità leggere. |
| **O. Notifiche e Reminder** | 3 - Parziale | È presente il file `server/notifications.ts` (Email, SMS, WhatsApp). | Funziona solo con finti `console.log` simulati. Non ci sono demoni (cron jobs) che girano di notte per inviare SMS di scadenza certificato o solleciti di pagamento. | `server/notifications.ts` | N/A | Medio | Media | Architettura predisposta, ma provider non implementati e cronjob assenti. |
| **P. Sicurezza, Audit, GDPR** | 3 - Parziale | Esiste la tabella `audit_logs` e il metodo `logUserActivity` che traccia tutte le **cancellazioni** (`DELETE`) e login. | Non esiste un endpoint per l'Export Dati Utente (Portabilità GDPR). Nessun log di accesso in lettura sui dati sensibili (solo cancellazioni). | `GET /api/audit-logs` | `audit_logs` | Alto | Media | Compliance base garantita contro i danni, ma vulnerabile ad un audit privacy approfondito. |

---

# 🏆 SINTESI FINALE MEGAAUDIT BACKEND F1-004

## 1. Tabella Riassuntiva Stati A-P

| Area | Argomento | Stato Backend | Stato Frontend (F2-003) |
|---|---|---|---|
| A | Identità e Univocità | 3 - Parziale | 3 - Parziale |
| B | Ruoli Multipli | 2 - Solo a DB | 4 - Assente |
| C | Gestione Duplicati | 3 - Parziale | 3 - Parziale |
| D | Verifica dati via Link | 4 - Assente | 4 - Assente |
| E | Minorenni e Famiglia | 4 - Assente | 4 - Assente |
| F | Pratica Operativa | 4 - Assente | 4 - Assente |
| G | Pagamenti (Payer) | 3 - Parziale | 3 - Parziale |
| H | Tesseramento | 3 - Parziale | 3 - Parziale |
| I | Certificato Medico | 2 - Critico / Incoerente* | 2 - Critico |
| J | Documenti / Firme | 2 - Critico* | 2 - Critico |
| K | Area Tesserati B2C | 3 - Parziale | 3 - Parziale |
| L | Omnicanalità | 4 - Assente | 4 - Assente |
| M | Blocchi Preventivi | 4 - Assente | 4 - Assente |
| N | Non Tesserati (Ospiti) | 4 - Assente | 4 - Assente |
| O | Notifiche / Reminder | 3 - Parziale | 3 - Parziale |
| P | Sicurezza / Audit GDPR | 3 - Parziale | 3 - Parziale |

*\*Nota sulle discrepanze (Fix Igiene): L'Area J è stata allineata allo stato 2 per coerenza con il Frontend. L'Area I presenta una "convergenza cross-asse" in quanto, sebbene la UI (Frontend) sia responsabile dell'invio in Base64 (definito "Puro Frontend" nei vecchi report), il Backend è complice accettando e storicizzando queste stringhe massicce nella colonna JSON di MySQL senza filtro. Il flaw architetturale è quindi condiviso.*

## 2. Top 5 Problemi Strutturali (Per Gravità)

1. **Memory Leak Architetturale (Base64 in MySQL)**: Il backend non gestisce stream multipart, accettando stringhe Base64 pesantissime dentro il JSON di `attachmentMetadata` della tabella `members`, gonfiando le tabelle e appesantendo drasticamente le API.
2. **Accoppiamento e Dual-Write in API Critiche**: Endpoint come `POST /api/memberships` scrivono attributi legacy "piatti" su `members` e spawnano pagamenti in automatico.
3. **Totale Assenza di Hard-Blocks Server-Side**: La maschera generale salva tutto indiscriminatamente (a patto che non sia un pagamento "orfano"). Non c'è un validatore Zod centrale che respinga HTTP 409 se manca il certificato medico o se c'è un insoluto.
4. **Modello Finanziario Piatto**: La tabella `payments` non disaccoppia il `ParticipantId` dal `PayerId` e dal `BillingEntityId`. Un genitore non può intestarsi la ricevuta di un pagamento effettuato per il figlio in modo strutturale.
5. **Assenza di Orchestratore di Pratica (Dossier)**: Non essendoci un DTO aggregato, il backend costringe le UI a pescare da N tabelle slegate per capire "in che stato si trova l'iscrizione di Mario Rossi?".

## 3. PIANO FASE 3 BACKEND (Proposta di Refactor)

**Scope Globale**: Bonifica dell'acquisizione dati, smantellamento del monolite della maschera, e messa in sicurezza dei flussi di memoria.

| Step | Nome | Interventi Core | Dipendenze F2-003 (Cross-Asse) | Stima (Sett. Uomo) |
|---|---|---|---|---|
| 1 | **Surgical Extraction Storage** | Creare `POST /api/upload` (Multipart). Introdurre tabella `documents`. Migrare script DB per svuotare il Base64 esistente. | Il frontend **deve** aggiornare `TabAllegati.tsx` contemporaneamente. | 1.5 w/u |
| 2 | **Orchestratore Zod e Blocchi** | Unificare le regole di business in Schemas condivisi. Introdurre blocchi HTTP 409 / 403. | Il frontend dovrà gestire i nuovi errori bloccanti nella UI `NuovoPagamentoModal`. | 1.5 w/u |
| 3 | **Separazione Ruoli Familiari** | Esplodere `member_relationships` (API di scrittura). Modificare `payments` con `PayerId`. | `TabTutori.tsx` andrà riscritto per consumare il nuovo modello API strutturato. | 2 w/u |
| 4 | **Refactor Maschera / Tessere** | Smantellamento salvataggio Bulk in `routes.ts:6205`. Disaccoppiamento netto tesseramento da cassa. | Transizione verso UI "a Stepper/Wizard" validato passo-passo. | 2 w/u |

**Totale stimato**: ~7 settimane uomo.

## 4. Domande Aperte per Gaetano/Cowork
- *Storage Documentale:* Implementare un S3 Bucket (es. AWS) per i certificati o archiviarli sul file system locale di Ionos? (Impatta lo Step 1).
- *Regole di Blocco:* Il blocco per "Certificato Scaduto" o "Insoluto" dovrà essere un *Hard-Block* (impossibile procedere) o un *Soft-Warning* (procedi assumendoti la responsabilità loggata)?
- *Area B2C:* Vogliamo che i tesserati possano auto-registrarsi pagando online (gateway Stripe) o l'approvazione avverrà solo al Desk?

---
*MEGAAUDIT BACKEND F1-004 COMPLETATO CON SUCCESSO. In attesa di review.*
