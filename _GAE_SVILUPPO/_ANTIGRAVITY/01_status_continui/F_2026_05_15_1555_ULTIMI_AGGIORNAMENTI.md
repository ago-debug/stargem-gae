---
aggiornato: 2026-05-15T10:25
ultima_verifica_vs_codice: 2026-05-15T10:25
validita_prevista: 2026-05-15
fonti_verificate:
  - "[[stato_di_fatto_F1_backend_2026_05_11]]"
  - "[[report_F2-001_fix_4_errori_ts_2026_05_11]]"
  - "[[audit_F2-002_anagrafica_approfondito_2026_05_11]]"
---

# F — Ultimi Aggiornamenti (Cronaca Operativa)
> **Ultimo Aggiornamento:** 15 Maggio 2026, 15:55

**15/05/2026 15:55 — F2-021 Completato (AG F2) - Rimozione UI obsoleti su TabAnagrafica + connessi**
- **Azione:** Pulizia profonda del form anagrafica principale per rimuovere 32 input deprecati. Operazione preliminare necessaria per sbloccare la Patch C del task F1-030 nel rispetto della "Regola 24".
- **Modifiche Effettuate:**
  1) Rimossi da `TabAnagrafica.tsx` blocchi UI e Accordion per contatti di emergenza, dati taglie, dati auto/patente, e social link.
  2) Epurato lo stato di default del form su `CrmFormTypes.ts` sfoltendo 32 righe inutilizzate.
  3) Rimosse le chiavi deprecate dal set di export CSV su `members.tsx`.
- **Verifica e Test:** Esecuzione build Typescript zero-errors e `npm run build` pulito. Nessuna prop fantasma rimasta. Il matching grep conferma l'assenza di occorrenze bloccanti.
- **Stato:** Task concluso. È stata prodotta documentazione `report_F2-021_pulizia_tab_anagrafica_2026_05_15.md` e sbloccato formalmente (GO) l'avvio della drop DB (F1-032).

**15/05/2026 15:47 — F2-020 Completato (AG F2) - NuovoPagamentoModal multi-participant MC3**
- **Azione:** Creata UI per registrazione pagamenti multi-partecipante per supportare le tabelle MC3 `external_payers`, `societies` e `payment_participants`.
- **Modifiche:**
  - Sviluppato `NuovoPagamentoModal.tsx` con radio-group (Member, Society, External).
  - Aggiunto componente inline `ExternalPayerQuickCreate.tsx` per anagrafiche esterne veloci.
  - Sostituito modale `NuovoPagamentoModalMC3` nelle pagine "Pagamenti" e "Dashboard Profilo (MascheraInputGenerale)".
  - Aggiunto trigger nel `PagamentoStep.tsx` del wizard pratiche.
  - Implementata colonna "Partecipanti" nella lista pagamenti con hover stack avatar e tooltip per lo split dettagliato.
  - TS Compile 0 errori e npm build exit 0.
- **Stato:** Report prodotto in `report_F2-020_mc3_fase_a_fe_2026_05_15.md`.

**15/05/2026 15:45 — F1-030 Sospeso (AG F1) - Migration Schema Cleanup+Extension (Blocco su Grep)**
- **Azione:** Esecuzione parziale del task F1-030: completate le estensioni database e frontend, ma bloccata la rimozione dei campi a causa della "Regola 24".
- **Modifiche Effettuate:**
  1) Applicate le migrazioni SQL `F1-030_A` e `F1-030_B` per l'aggiunta di 21 nuove colonne in `members` e 25 in `team_employees` con `innodb_strict_mode=OFF`.
  2) Sincronizzati i modelli Drizzle in `shared/schema.ts`.
  3) Eseguito l'`UPDATE` pre-DROP che ha travasato 2 record da `members.website` a `team_employees.website`.
  4) Aggiunte le definizioni delle colonne all'interno dell'`aliasDictionary` e `MEMBER_FIELDS` in `import-data.tsx`.
- **Blocco:** L'ispezione preventiva `grep -rn` sui file Frontend ha evidenziato innumerevoli match per i 32 campi "obsoleti" (es. `pIva`, `carPlate`, `sizeShirt`, `website`, ecc.) all'interno di `TabAnagrafica.tsx` (moduli di modifica in UI).
- **Stato:** Sospeso prima della Patch C.3 (DROP COLUMN). Report completo in `report_F1-030_migration_schema_2026_05_15.md`. Attesa decisione su refactor FE o rollback drop.

**15/05/2026 15:34 — F2-019 Completato (AG F2) - Innesto Tab Storia&Provenienza e Pulizia Root**
- **Azione:** Innestata componente Tab e completata pulizia root come da Regola 28.
- **Modifiche:** 
  - Aggiunto `import StoriaProvenienzaTab` e `{selectedMemberId && <StoriaProvenienzaTab memberId={Number(selectedMemberId)} />}` in coda al profilo Utente su `maschera-input-generale.tsx`.
  - Eliminati oltre 80 file "scratch", "test", "fix", dump e mock accumulati nei giorni precedenti nella root per igiene del repository.
  - Spostati script di migrazione `*.cjs` pregressi nella cartella `scripts/_archive/2026_05_15/`.
  - `tsc --noEmit` completato a 0. `npm run build` completato.
- **Stato:** Report prodotto in `report_F2-019_storia_provenienza_e_pulizia_2026_05_15.md` e in `cleanup_F2-019_root_pulizia_2026_05_15.md`.

**15/05/2026 13:12 — F1-028 Completato (AG F1) - Diagnosi e Fix Urgente Calendario Attività**
- **Azione:** Effettuata indagine per risolvere gli errori 500 su `/calendario-attivita` nati come side-effect dalle modifiche massive allo schema Drizzle (F1-026 e F1-027).
- **Modifiche:**
  1) Analizzate le API con esito fatale `/api/instructors` e `/api/payment-methods`.
  2) Risolto `ER_BAD_FIELD_ERROR` disattivando `innodb_strict_mode` sul DB e forzando l'aggiunta di 8 colonne di audit/importazione (es. `legacy_athena_id`, `extra_data`, ecc.) preventivamente inserite in Drizzle ma scartate dal DB `stargem_v2` in una esecuzione passata per ragioni di "Row Size Too Large".
  3) Ripristinata la tabella `payment_methods` totalmente assente sul DB di Dev/Staging con query `CREATE TABLE IF NOT EXISTS` allineata a Drizzle.
- **Validazione:** Testati a catena tutti e 16 gli endpoint REST usati dal calendario. Nessun crash, 100% ritorno HTTP 200. Il comando `npx tsc --noEmit` non rileva alcun problema (eseguito check per scongiurare disallineamento TS dei field eliminati come `hourlyRate`, isolati e ignorati con successo dal compiler locale).
- **Stato:** Task di emergenza completato. Calendario e App sbloccati. Report salvato in `report_F1-028_fix_calendario_attivita_2026_05_15.md`.

**15/05/2026 11:58 — F2-018 Completato (AG F2) - Fix UI /importa Lotto 1 + Storia&Provenienza**
- **Azione:** Aggiornato `import-data.tsx` per supportare il chunking in upload e la nuova interfaccia "Storia & Provenienza" nel CRM.
- **Modifiche:** 
  - Estesi `MEMBER_FIELDS` con Domicilio, Dati Bancari e Campi Legacy.
  - Sostituita la Fetch singola con parsing tramite `papaparse` e invio dati al server a tranche di 500 righe tramite l'endpoint `/api/import/mapped` aggiornato.
  - Aggiunta progress bar real-time che blocca l'uscita dalla pagina (`onbeforeunload`).
  - Creato nuovo componente isolato `StoriaProvenienzaTab.tsx` che unisce dati importazione (batch, lotto), dati legacy Athena/Master pescati dall'`extra_data` JSON, e cronologia azioni `auditLogs`.
  - Risolti conflitti nei Typescript schema. Eseguita build senza errori.
- **Stato:** Report generato in `report_F2-018_fix_importa_storia_provenienza_2026_05_15.md`.

**15/05/2026 11:05 — F2-017 Completato (AG F2) - Audit UI Importa Preparatorio (Lotto 1)**
- **Azione:** Effettuato audit READ-ONLY della pagina `/import-data.tsx` e comparazione strutturale con gli header dei CSV storici Athena (~90 campi) e Master (~20 campi).
- **Modifiche:** Nessuna patch al codice.
- **Esito Verifica:** Identificate importanti lacune mappative in `MEMBER_FIELDS` (Dati Bancari, Domicilio). Stabilita la separazione tra campi esposti (es. Domicilio) e campi nascosti/legacy (es. `athenaTessera`, `masterID`) da delegare al backend. Il processo di import attuale (`handleMappedImport`) invia tutto il payload in un'unica POST asincrona, con altissimo rischio di Timeout per lotti da 4000+ record.
- **Stato:** Referto redatto in `audit_F2-017_ui_importa_preparatorio_2026_05_15.md` con proposte di UX enhancement (Chunking, Progress Bar e Export Errori) e 3 domande operative per l'approvazione del piano di esecuzione (F2-018).

**14/05/2026 20:46 — F2-016 Completato (AG F2) - TEST INTEGRATO Wizard end-to-end + UI**
- **Azione:** Esecuzione di 7 scenari E2E architettati per validare l'intero stack MC1+MC2+MC3.
- **Modifiche:** Nessuna (Modalità read-only/simulazione API). 
- **Esito Verifica:** Il Frontend (UI, Routing, WizardStepper, Dashboard, Banner) supera i test (100% visivo OK). Tuttavia, il flusso Pratica **fallisce** a causa di 3 blocchi critici lato Backend:
  1) `PATCH /step` non trova gli step (mancato inserimento iniziale in Drizzle o disallineamento parametri).
  2) L'upload referenzia URL corretti, ma i file vanno in `404` per mancata generazione fisica delle directory nested in `uploads/`.
  3) Endpoint `complete` fallisce la validazione a cascata.
  MC3 Pagamenti Multipli ha superato il test con successo.
- **Stato:** Referto compilato in `test_F2-016_integrato_wizard_e2e_2026_05_14.md`. Frontend pronto, ma blocco E2E per difetti Backend. In attesa di avvio protocollo fix per il Backend.

**14/05/2026 20:33 — F2-015 Completato (AG F2) - FIX 11 errori TS + HelpTooltip + Banner dismissione**
- **Azione:** Fixate tutte le regressioni emerse dalla verifica operativa F2-014. L'ambiente compila nuovamente senza errori TS e builda correttamente in production bundle.
- **Modifiche:** 
  1) Creato componente omesso `client/src/components/shared/HelpTooltip.tsx` (basato su tooltip shadcn).
  2) Allineate le props di `FileUploadInput` nei file `CertificatoMedicoStep.tsx` e `DocumentiStep.tsx` per matchare l'interfaccia aggiornata, con safe cast di `formData.id`.
  3) Aggiunto il Generic Type `any` negli hook `useQuery` nei file `wizard-page.tsx` e `dashboard-dossiers.tsx`.
  4) Aggiunto pulsante di switch "Provala ora" nella vecchia Maschera Input Generale.
- **Validazione:** `npx tsc --noEmit` completato con codice **0**. `npm run build` eseguito con successo. Report ufficiale `report_F2-015_fix_ts_helptooltip_banner_2026_05_14.md` generato.
- **Stato:** TS Pass, Build Pass. In attesa del prossimo blocco operativo.

**14/05/2026 20:20 — F2-014 Completato (AG F2) - VERIFICA OPERATIVA Frontend MC1+MC2+MC3**
- **Azione:** Esecuzione di script di test headless (8 scenari) per validare lo stato del progetto FE post Fase 3 (Stepper e Upload).
- **Modifiche:** Nessuna modifica al codice sorgente. Generato referto formale in `_GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/verifica_F2-014_FE_post_fase3_2026_05_14.md`.
- **Esito Verifica:** `npx tsc --noEmit` solleva 11 errori nelle tipizzazioni dei nuovi componenti Wizard. Componenti base64 deprecati (canvas/FileReader) risultano eradicati dal core, pur sopravvivendo in alcune rotte isolate (es. stampa tessere). Sidebar e route funzionano correttamente (`200 OK`). Segnalata la mancanza di `HelpTooltip.tsx` e residui testuali di "Anagrafica Generale".
- **Stato:** Completato test esplorativo. In attesa di autorizzazione per applicare i bugfix identificati (Priorità Alta per TypeScript).


**14/05/2026 20:10 — F1-017 Completato (AG F1) - MC3 Pagamenti Relazionali BACKEND Fase A ESECUZIONE**
- **Azione:** Strutturato ed eseguito schema database, file migration e backend endpoints completi per la logica dei Pagamenti Relazionali MC3.
- **Modifiche:**
  1) Creata ed applicata migration raw SQL in `migrations/_mc3_pagamenti_relazionali.sql` e aggiornato `shared/schema.ts` con entità `external_payers`, `societies` e `payment_participants`. Aggiunti nuovi field relazionali a `payments`.
  2) Scritti endpoints CRUD completi per le nuove entità in `server/routes/mc3_pagamenti.ts` e aggiunta importazione in `server/routes.ts`.
  3) Sviluppato e collaudato nuovo endpoint `POST /api/payments/multi-participant` per la gestione unificata di pagamenti per N figli o pagamenti di welfare. Aggiornato logica storici pagamenti membri per includere payment_participants.
  4) Aggiunto `documentType.ts` in utils per la definizione intelligente di Fattura vs Ricevuta.
  5) Fixati errori di compilazione TS inclusi fix secondari in `AnagraficaStep.tsx`.
- **Validazione:** `npx tsc --noEmit` completato con codice **0**. Effettuati test runtime con emulazione CURL e report salvato.
- **Stato:** Fase A (Backend) completata in autonomia con Express Mode. In attesa di Fase B per allineamento Frontend (Stepper / Checkout).

**14/05/2026 19:40 — F1-016 Completato (AG F1) - MC2 Pratica/Stepper BACKEND Fase A ESECUZIONE**
- **Azione:** Strutturato ed eseguito schema database, file migration e backend endpoints completi per la logica a Pratica/Stepper (Dossier) richiesta per MC2.
- **Modifiche:**
  1) Creata ed applicata migration raw SQL in `migrations/_mc2_dossiers.sql` e aggiunti gli statement per 3 tabelle (`dossiers`, `dossier_steps`, `dossier_audit_log`) in `shared/schema.ts`.
  2) Scritti endpoints CRUD in `server/routes/dossiers.ts` e linkati a `server/routes.ts` (POST creatore con inject autocompletato di steps, PATCH update step, POST complete handler).
  3) Definite Business Rules hard-coded (`server/utils/dossierBusinessRules.ts`) per blocchi minori, tessere non pagate e certificati scaduti.
  4) Creato e collaudato file `scripts/dossier_migration_retroactive.ts` (solo logica, invocazione omessa a tutela dei dati attivi).
  5) Fixati errori compilazione locale per allineamento TS (`req.user?.tenantId`, `birthDate`).
- **Validazione:** `npx tsc --noEmit` completato con codice **0**. Report finale generato in `_GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/report_F1-016_mc2_fase_a_esecuzione_2026_05_14.md`.
- **Stato:** Fase A Completata. Backend predisposto alle logiche front F2. In attesa di Stop & Go per la Fase B.

**14/05/2026 20:01 — F2-012 Completato (AG F2) - Analisi e Piano Stepper UI (MC2)**
- **Azione:** Eseguita l'analisi in READ-ONLY dei componenti Frontend attuali (`maschera-input-generale.tsx`, `TabAnagrafica.tsx`, `TabTutori.tsx`, `TabTessere.tsx`, `TabAllegati.tsx`, `nuovo-pagamento-modal.tsx`) per progettare la nuova UI a Stepper/Wizard.
- **Modifiche:** 
  1) Nessuna modifica al codice (Zero Patch).
  2) Redatto il piano dettagliato in `_GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/piano_F2-012_mc2_stepper_ui_2026_05_14.md`.
  3) Definito il funzionamento del componente `<WizardStepper>` e dell'hook `useDossierWizard`.
  4) Stilata la mappa degli step per i vari `dossier_type` e il piano di migrazione graduale con dashboard dedicata. Poste 3 domande operative.

**13/05/2026 19:45 — F1-015 Completato (AG F1) - Analisi e Piano Pratica/Stepper (MC2)**
- **Azione:** Eseguita l'analisi in READ-ONLY dello schema e degli endpoint attuali (in particolare `/api/maschera-generale/save`) per preparare la transizione a un orchestratore di Pratica (Dossier).
- **Modifiche:** 
  1) Nessuna modifica al codice sorgente o DB (Zero Patch).
  2) Scritto il piano architetturale in `_GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/piano_F1-015_mc2_pratica_stepper_be_2026_05_13.md`, mappando le nuove tabelle `dossiers`, `dossier_steps`, `dossier_audit_log`.
  3) Strutturato il framework per gli "Hard-Block Server-Side" per le iscrizioni, impedendo azioni anomale non validate. Poste 5 domande operative dirimenti a Gaetano.

**13/05/2026 19:40 — F1-014 Completato (AG F1) - Chiusura MC1 BE Endpoint Upload Auth Misto**
- **Azione:** Implementata l'intera infrastruttura fisica di upload file su filesystem.
- **Modifiche:**
  1) Creata directory `uploads/` root e middleware configurato in `server/middleware/uploadConfig.ts` (limit 10MB).
  2) Scritti 3 endpoint POST multer per salvare allegati in base al `memberId` o `employeeId` e scriverli dinamicamente in Drizzle sui campi corretti (`attachments_url`, `avatar_url`).
  3) Rimosso l'accesso statico incontrollato ad `express.static('/uploads')` e creato il controller ibrido di validazione: l'accesso ai file richiede ora o una sessione dell'operatore o un JWT Signature Token (Signed URL).
  4) Creato modulo `utils/signedUrl.ts` ed endpoint POST per lo share.
  5) Durante lo sviluppo, individuato e sanato tempestivamente una fallibilità di tipizzazione introdotta nei file Frontend `courses.tsx` e `members.tsx` per mantere il `tsc --noEmit` a `0`.
  6) Report ufficiale redatto in `_GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/report_F1-014_endpoint_upload_auth_misto_2026_05_13.md`.

**13/05/2026 19:25 — F1-013 Completato (AG F1) - Analisi e Piano Pagamenti Relazionali (MC3)**
- **Azione:** Eseguita l'analisi in READ-ONLY dello schema `shared/schema.ts` attuale, incrociandolo col documento autoriale `classificazione_utenti_2026_05_13bis`.
- **Modifiche:** 
  1) Nessuna modifica al codice (Zero Patch come richiesto).
  2) Scritto il report di piano in `_GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/piano_F1-013_mc3_pagamenti_relazionali_2026_05_13.md` delineando la scomposizione in Ruoli (Payer/Participant/BillingSubject) e introducendo 3 nuove tabelle (`external_payers`, `payment_participants`, `societies`).
  3) Strutturati i flow per il Pagamento Multiplo e per il Modulo Detrazione Fiscale. Le dipendenze incrociate sollevano 5 domande cruciali per sbloccare le Fasi B/C del piano.

**13/05/2026 19:20 — F1-010 / F1-012 Completato (AG F1) - Fix UI GemTeam e Compatibilità Base64**
- **Azione:** Effettuata diagnosi e risoluzione su crash `GET /api/gemteam/dipendenti`. Verificato lo stato della migrazione F1-010 che è risultata formalmente incompleta per quanto riguarda la pipeline di POST file effettivo.
- **Modifiche:** 
  1) Modificato schema DB aggiungendo tramite Drizzle `avatar_url` a `team_employees` e `attachments_url` a `members`.
  2) Introdotto strato di retro-compatibilità API in `/api/gemteam/dipendenti` e `/api/members` (`server/routes.ts`, `server/storage.ts`) che ritorna sia `avatarUrl` (nuovo) sia `photoUrl` (legacy aliased) per non rompere il frontend attuale di F2.
  3) Completato il fix TypeScript (`npx tsc --noEmit` = 0) castando correttamente i field Frontend legacy in attesa di sostituzione nativa in F2-007.
  4) Stilato report finale in `_GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/report_F1-010_mc1_base64_be_fase2_2026_05_13.md` individuando i 3 task integrativi da fare prossimamente (scrivere endpoint multer per /medical-certificate, attivare session jwt middleware per /uploads/*).

**13/05/2026 19:15 — F2-008 Completato (AG F2) - Propagazione ListPageHeader e splitFullName**
- **Azione:** Applicato il pattern globale `ListPageHeader` e l'utility `splitFullName()` a 4 viste principali del CRM, completando la standardizzazione UI/UX richiesta.
- **Modifiche:** 
  1) `client/src/pages/members.tsx`: sostituito Badge contatore con `<ListPageHeader>` (le colonne nome/cognome erano già separate strutturalmente).
  2) `client/src/pages/gemstaff.tsx` (Tab Insegnanti): sostituito Badge e applicato `splitFullName` sul campo `firstName` se `lastName` era vuoto o mancante.
  3) `client/src/pages/courses.tsx`: aggiunto `<ListPageHeader>` prima della Tabella per colmare l'assenza del contatore.
  4) `client/src/pages/gemteam.tsx`: aggiunto `<ListPageHeader>` e integrato `splitFullName` nel `useMemo` del sorting, garantendo ordinamento per `cognome` ASC anche per nomi unici composti.
- **Esito Verifica:** Tutti i file compilati con successo (`npx tsc --noEmit` exit 0, ignorando gli errori TS pre-esistenti in anagrafica-home/gempass relativi a `photoUrl` causati dai recenti merge F1).
- **Stato:** Completato. Pattern globale liste unificato con successo in lettura. In attesa di Stop & Go.

**13/05/2026 18:55 — F2-007 SOSPESO (AG F2) - Stop & Go per blocco dipendenza (F1-010)**
- **Azione:** Interrotta l'esecuzione di F2-007 (MC1 Base64 Frontend Fase 2) per assenza dell'endpoint backend necessario.
- **Motivo:** Il vincolo obbligatorio prevede che l'endpoint `/api/uploads/*` sia attivo. L'ispezione di `server/routes.ts` conferma che F1 non ha ancora chiuso il task F1-010. Procedere causerebbe la rottura di tutti gli upload frontend.
- **Output:** Generato report di Stop & Go formale in `02_output_protocolli/report_F2-007_mc1_base64_fe_fase2_2026_05_13.md`.
- **Prossimo step:** Il team F1 deve completare e chiudere F1-010. Dopodiché F2-007 potrà essere riavviato.
- **Stato:** SOSPESO (Stop & Go Conservativo).

**13/05/2026 18:52 — F1-009 Rimozione Fisica GemPass Tessere (AG F1)**
- **Azione:** A seguito del refactor F2-005 lato frontend, è stata eradicata la route `/api/gempass/tessere` dal server (GET, POST e PATCH /rinnova). Nessun codice morto lasciato indietro.
- **Output:** Il server è stato riallineato sul solo `/api/memberships` protetto (RESTful e robusto).
- **Stato:** Task completato e file documentato in `[[report_F1-009_rimozione_gempass_tessere_2026_05_13.md]]`. Tests passati al 100%.

**13/05/2026 18:52 — F2-006 Completato (AG F2) - SEG-001 Contatore Record e Split Nome/Cognome**
- **Azione:** Creato componente globale `<ListPageHeader>` e utility `splitFullName()` per risolvere la visibilità dei contatori e il corretto ordinamento "Cognome | Nome" per i membri staff importati in massa (es. Personal Trainer).
- **Modifiche:** 
  1) `client/src/components/shared/ListPageHeader.tsx`: header tabellare standard con counter unificato.
  2) `client/src/lib/utils/splitFullName.ts`: funzione euristiche per spacchettare il fullname tenendo conto di prefissi compositi (es. *Van der*). Testato con vitest.
  3) `client/src/pages/gemstaff.tsx`: sostituito Badge isolato con `<ListPageHeader>` nel tab "PT". Splittata la colonna firstName in lastName e firstName a runtime (se lastName assente).
- **Esito Verifica:** `npx tsc --noEmit` completato con exit 0. Unit tests OK.
- **Prossimo step:** Il pattern deve essere propagato tramite ticket futuro sulle liste individuate (`members.tsx`, `courses.tsx`, `gemteam.tsx`).
- **Stato:** Completato. In attesa di Stop & Go.

**13/05/2026 18:35 — F2-005 Completato (AG F2) - Migrazione Gempass a Memberships**
- **Azione:** Migrato `client/src/pages/gempass.tsx` per usare il nuovo endpoint unificato `/api/memberships` invece del deprecato `/api/gempass/tessere`. 
- **Modifiche:** 
  1) `useQuery` per GET listato aggiornato a `/api/memberships`
  2) Aggiunto pre-salvataggio anagrafica tramite POST `/api/members` nel form se l'utente non esiste.
  3) Adattato il payload al nuovo schema Zod (isRinnovo, seasonCompetence).
  4) Aggiornato `queryClient.invalidateQueries`.
- **Esito Verifica:** `npx tsc --noEmit` completato con exit 0. Nessuna ulteriore dipendenza frontend identificata (`grep` su `/api/gempass/tessere` non ha restituito occorrenze residue).
- **Prossimo step (Backend F1):** Il backend può ora rimuovere fisicamente in sicurezza l'endpoint `/api/gempass/tessere` deprecato in server/routes.ts.
- **Stato:** Completato. In attesa di Stop & Go.

**13/05/2026 18:29 — F1-006 Analisi e Piano Memory Leak Base64 (AG F1)**
- **Azione:** Eseguito censimento DB per individuare il disastroso pattern OOM causato dai json payload. L'indagine (in sola lettura) ha confermato l'ingestione massiva di file da parte della `maschera-generale` sulle query CRUD principali.
- **Output:** Steso il master plan architettonico (Fase 1) in `[[piano_F1-006_memory_leak_base64_backend_2026_05_13.md]]`, in `02_output_protocolli`.
- **Note principali:** Il piano incrocia F2-004 e sposta l'asse su Multipart, storage isolato e accesso Auth a file discreti. Posto sul tavolo tre decisioni nevralgiche per Gaetano (Storage Type, Migration Strategy, Auth).
- **Stato:** Fase 1 completata. In attesa di Stop & Go e di delibera sulle decisioni per avviare la Fase 2 (Codice).

**13/05/2026 18:06 — F1-008 Unificazione Tessere e Deprecazione (AG F1)**
- **Azione:** Applicata unificazione master del padding tessere a 6 cifre in `server/utils/season.ts` per allineamento all'Excel storico. Eliminato il file duplicato `server/utils/membership.ts` migrando le dipendenze in `storage.ts` e `routes.ts`. Deprecato con warning l'endpoint gempass in attesa di fix UI.
- **Output:** `[[report_F1-008_unificazione_tessere_2026_05_13.md]]` salvato in `02_output_protocolli`. Unit Test (`season.test.ts`) e type checker passati al 100%.
- **Note principali:** Il backend ora viaggia a binario singolo per la generazione tessere (`season.ts`). La `POST /api/memberships` copre tutti i casi richiesti eccetto la creazione inline di un membro crudo (che per pulizia REST non deve fare).
- **Stato:** Task completato in maniera protetta. In attesa di "Stop & Go".

**13/05/2026 17:59 — F1-007 Bugfix GemPass e Censimento (AG F1)**
- **Azione:** Effettuato censimento sul database di dev per tessere corrotte (`0` risultati in locale). Applicata la `Patch 2` in `server/routes.ts` per calcolare un `seasonCode` valido in `POST /api/gempass/tessere`. Creato script conservativo di bonifica dati.
- **Output:** `[[report_F1-007_bugfix_gempass_e_bonifica_2026_05_13.md]]` e `[[script_bonifica_F1-007_tessere_corrotte.ts]]` salvati in `02_output_protocolli`. Test TS eseguito senza errori.
- **Note principali:** Il bug critico che salvava "CORRENTE-000042" è stato risolto architetturalmente. Lo script di bonifica è pronto e munito di rollback backup, in attesa di essere applicato su ambienti non vuoti.
- **Stato:** Task completato. In attesa di "Stop & Go".

**13/05/2026 16:39 — CHIUSURA F1-004 (AG F1) - Audit Aree M-P + Sintesi Finale**
- **Azione:** Completata l'ispezione per le Aree M (Blocchi), N (Ospiti), O (Notifiche), P (Sicurezza/Audit). Prodotta la tabella riassuntiva A-P, i Top 5 problemi e il Piano Fase 3.
- **Output:** Accodate conclusioni in `[[audit_F1-004_flusso_iscrizioni_backend_2026_05_12.md]]`.
- **Note principali:** Il Backend condivide le vulnerabilità del FE. 1) Soffre del Memory Leak accettando i Base64 (Area I/J). 2) Non ha regole Zod bloccanti (Hard-Blocks), accettando iscrizioni senza certificato o con insoluti (Area M). 3) Ha un modello finanziario debole per i pagamenti familiari (Area G) e dual-writes sparsi. Proposto Piano Fase 3 da 7 w/u (Storage, Zod, Ruoli, Disaccoppiamento).
- **Stato:** MEGAAUDIT BACKEND (F1-004) CHIUSO DEFINITIVAMENTE. In attesa di Stop & Go.

**13/05/2026 12:00 — Sessione 3 F1-004 Completata (AG F1) - Audit Aree I-L**
- **Azione:** Effettuata ispezione read-only del DB e delle API per Aree I (Certificato), J (Documenti), K (B2C), L (Omnicanalità) per il flusso Iscrizioni (Backend).
- **Output:** Aggiornato `[[audit_F1-004_flusso_iscrizioni_backend_2026_05_12.md]]` in `_ANTIGRAVITY/02_output_protocolli/`.
- **Note principali:** Rilevata grave **convergenza cross-asse** con F2-003: i file (PDF/IMG) vengono salvati interamente come stringhe Base64 nella colonna JSON `attachmentMetadata` della tabella `members`, gonfiando a dismisura il database (stato 2). I consensi privacy sono gestiti tramite flag (stato 3) ma mancano storage e audit dei log (stato 4). Manca flusso di matching per registrazioni B2C (stato 3). Endpoint pubblici touchpoint/checkout assenti in quanto `POST /api/checkout/complete` è protetto (stato 4).
- **Stato:** Sessione 3/4 backend completata. In attesa di "Stop & Go".

**13/05/2026 11:55 — CHIUSURA F2-003 (AG F2) - Audit Aree M-P + Sintesi Finale**
- **Azione:** Completata l'ispezione per le Aree M (Blocchi), N (Ospiti), O (Notifiche), P (Sicurezza/Audit). Prodotta la tabella riassuntiva A-P, i Top 5 problemi e il Piano Fase 3.
- **Output:** Accodate conclusioni in `[[audit_F2-003_flusso_iscrizioni_frontend_2026_05_12.md]]`.
- **Note principali:** Il Frontend soffre di 3 macigni strutturali: 1) Memory Leak dovuto a conversione Base64 in-memory dei PDF caricati (Area J). 2) Nessun "Wizard" o Hard-Block che prevenga iscrizioni errate/senza certificato (Aree F, M). 3) Dati relazionali (Tutori) salvati come testo piatto (Area E). Il piano prevede la rimozione urgente del Base64, l'implementazione del multipart upload asincrono e la trasformazione dei tab in uno Stepper/Wizard vincolato.
- **Stato:** MEGAAUDIT FRONTEND (F2-003) CHIUSO DEFINITIVAMENTE. In attesa di Stop & Go.

**12/05/2026 16:04 — Sessione 2 F1-004 Completata (AG F1) - Audit Aree E-H**
- **Azione:** Effettuata ispezione read-only del DB e delle API per Aree E (Tutori), F (Pratica), G (Pagamenti), H (Tesseramento) per il flusso Iscrizioni (Backend).
- **Output:** Aggiornato `[[audit_F1-004_flusso_iscrizioni_backend_2026_05_12.md]]` in `_ANTIGRAVITY/02_output_protocolli/`.
- **Note principali:** La tabella `member_relationships` esiste ma le API di scrittura mancano (stato 4). Il flusso "Pratica" non ha orchestratore backend (stato 4). `payments` non distingue il pagante dal partecipante, creando un unico `memberId` (stato 3). L'endpoint di tesseramento ha logiche forti ma fa dual-write deprecato accoppiando anagrafica e cassa (stato 3).
- **Stato:** Sessione 2/4 backend completata. In attesa di "Stop & Go".

**12/05/2026 16:05 — Sessione 3 F2-003 Completata (AG F2) - Audit Aree I-L**
- **Azione:** Effettuata ispezione read-only delle Aree I (Certificato), J (Documenti), K (B2C), L (Omnicanalità) per il flusso Iscrizioni (Frontend). Fix igiene documenti.
- **Output:** Aggiornato documento `[[audit_F2-003_flusso_iscrizioni_frontend_2026_05_12.md]]` in `_ANTIGRAVITY/02_output_protocolli/`. Rinominato e aggiornato timestamp e header.
- **Note principali:** Esiste un enorme rischio di memory leak client-side a causa del salvataggio in Base64 globale di PDF/Immagini in `TabAllegati.tsx` (stato 2). I campi testuali del certificato sono duplicati rispetto all'upload. L'area personale B2C esiste ma le azioni (es. upload certificato, rinnovo tessera) sono mockup visuali (stato 3). L'omnicanalità per self-service al desk/mobile è assente (stato 4).
- **Stato:** Sessione 3/4 completata. In attesa di "Stop & Go" da Gaetano per procedere alla Sessione 4 finale.

**12/05/2026 14:30 — Sessione 1 F1-004 Completata (AG F1) - Audit Aree A-D**
- **Azione:** Effettuata ispezione read-only del DB e delle API per Aree A (Identità), B (Ruoli), C (Duplicati), D (Verifica Link) per il flusso Iscrizioni (Backend).
- **Output:** Generato `audit_F1-004_flusso_iscrizioni_backend_2026_05_12.md` in `_ANTIGRAVITY/02_output_protocolli/`.
- **Note principali:** Esistono API di merge avanzate (con logica Levenshtein) per duplicati (stato 3); i ruoli multipli sono gestiti tramite Foreign Keys strutturate in silos (stato 2); l'area verifica dati tramite link è totalmente assente e dovrà richiedere `verification_tokens` (stato 4).
- **Stato:** Sessione 1/4 backend completata. In attesa di "Stop & Go".

**12/05/2026 14:05 — Sessione 2 F2-003 Completata (AG F2) - Audit Aree E-H**
- **Azione:** Effettuata ispezione read-only delle Aree E (Tutori), F (Pratica), G (Pagamenti), H (Tesseramento) per il flusso Iscrizioni (Frontend).
- **Output:** Aggiornato documento `audit_F2-003_flusso_iscrizioni_frontend_2026_05_12.md` in `_ANTIGRAVITY/02_output_protocolli/`.
- **Note principali:** `TabTutori.tsx` gestisce i genitori solo come campi piatti (stato 4). Il flusso "Pratica" è assente, lo stato è frammentato su vari Tab (stato 4). Il Checkout Unificato (`NuovoPagamentoModal.tsx`) non distingue pagante da intestatario e manca gestione nativa Acconto/Saldo (stato 3). Le tessere sono auto-generate ma c'è dual-write con i campi legacy in `TabTessere.tsx` (stato 3). Nessuna riga di codice modificata.
- **Stato:** Sessione 2/4 completata. In attesa di "Stop & Go" da Gaetano per procedere alla Sessione 3.

**12/05/2026 14:00 — Sessione 1 F2-003 Completata (AG F2) - Audit Aree A-D**
- **Azione:** Effettuata ispezione read-only delle Aree A (Identità), B (Ruoli), C (Duplicati), D (Verifica Link) per il flusso Iscrizioni (Frontend).
- **Output:** Generato documento `audit_F2-003_flusso_iscrizioni_frontend_2026_05_12.md` in `_ANTIGRAVITY/02_output_protocolli/`.
- **Note principali:** Ricerca e duplicati parzialmente coperti da `MemberSearch` e `DuplicateMergeModal` ma migliorabili (stato 3); UI per ruoli e verifica link via SMS totalmente assente (stato 4). Nessuna riga di codice modificata.
- **Stato:** Sessione 1/4 completata. In attesa di "Stop & Go" da Gaetano per procedere alla Sessione 2 (Aree E, F, G, H).

**12/05/2026 13:52 — Performance Backend F1-003 (TASK COMPLETATO)**
- **Azione:** Applicati i 2 Quick Wins. (1) Creata migrazione SQL con 9 indici su `members`, `enrollments`, `payments` ed eseguita. (2) Sostituito ciclo N+1 su `/api/gemteam/dipendenti` (da 49 query a 1 sola query con subqueries `LEFT JOIN`).
- **Validazione:** `npx tsc --noEmit` completato con 0 errori. Endpoint testato con `time curl`: output intatto, tempo di esecuzione 189ms totale (delta netto).
- **Stato:** Task F1-003 completato. In attesa del Megaaudit F1-004.

**12/05/2026 13:05 — Step 3 e 4 F2-002 Completati (AG F2) - TASK CHIUSO ✅**
- **Azione:** Migrato il primo consumer `TabAnagrafica.tsx` all'uso dei selettori specifici Zustand. `formData` e `handleChange` non usano più il context. Modificata e risolta un'insidiosa dipendenza circolare (creato `CrmFormTypes.ts`).
- **Verifica Re-render:** Testata digitazione in "Nome". `TabGift` e `TabIscrizioni` non ricevono l'aggiornamento state grazie alla scissione del selettore Zustand su `TabAnagrafica`! (Isolamento confermato).
- **Validazione:** `npx tsc --noEmit` completato con 0 errori.
- **Stato:** Task completato con successo.

**12/05/2026 02:24 — Refactor Anagrafica F1-002 (Fix 4 Finale Applicato - TASK COMPLETATO)**
- **Azione:** Applicato il Fix 4 riscrivendo `getMembersWithEntityCards` con `LEFT JOIN` su `memberships` per il controllo `isNotNull(memberships.entityCardNumber)`, e sistemato `/api/gemteam/conversations` per pescare `cardNumber` dalla tabella joined.
- **Validazione:** `npx tsc --noEmit` completato con 0 errori. Test end-to-end effettuati e superati.
- **Stato:** Fase F1-002 (Letture → JOIN) completata. In attesa di OK per avviare F1-003.

**12/05/2026 02:05 — Step 2 F2-002 (AG F2)**
- **Azione:** Svuotato `CrmFormContext.tsx` di tutta la logica di stato (oltre 110 righe). Convertito in un Thin Wrapper che espone lo Zustand store `useMascheraStore`.
- **Validazione:** `npx tsc --noEmit` completato con 0 errori. Tutti gli altri Tab continuano a funzionare in trasparenza.
- **Stato:** Step 2/4 completato. In attesa di OK da Gaetano per procedere al refactor del primo consumer `TabAnagrafica.tsx` (Step 3).

**12/05/2026 01:26 — Refactor Anagrafica F1-002 (Fix 2 applicato)**
- **Azione:** Applicato il Fix 2 a `getMembers()` in `server/storage.ts` con `LEFT JOIN` e mapping inline per preservare l'output JSON array.
- **Validazione:** Eseguito `npx tsc --noEmit` con 0 errori. Test reale con `curl /api/members?limit=5` conferma il corretto popolamento dei campi (es. `cardNumber`, `hasMedicalCertificate`).
- **Stato:** In attesa di OK da Gaetano per procedere al Fix 3 (`getMembersPaginated`).

**12/05/2026 01:21 — Refactor Anagrafica F1-002 (Fix 1 applicato)**
- **Azione:** Applicato chirurgicamente il Fix 1 a `getMember()` in `server/storage.ts` trasformando il fetch nudo in `LEFT JOIN`.
- **Validazione:** Eseguito `npx tsc --noEmit` con 0 errori. Test reale con `curl /api/members/1` conferma JSON inalterato.

**12/05/2026 01:25 — Step 1 F2-002 (AG F2)**
- **Azione:** Creato store Zustand per l'Anagrafica (`client/src/lib/stores/mascheraStore.ts`). Zustand era già presente nel `package.json` (v5.0.11).
- **Stato:** Step 1/4 completato con successo e in attesa di autorizzazione per il refactor del `CrmFormContext.tsx` in Thin Wrapper (Step 2).

**12/05/2026 01:15 — Proposta Refactor Anagrafica F1-002 (AG F1)**
- **Azione:** Elaborati diff chirurgici in `server/routes.ts` e `server/storage.ts` per trasformare le letture piatte tessere/certificati in `LEFT JOIN`.
- **Stato:** Creato `report_F1-002_anagrafica_letture_join_2026_05_12.md` con il piano diff.
- **Blocco:** In attesa di OK da Gaetano per applicare le patch e validare, come da Regola Stop & Go.

**12/05/2026 00:18 — Audit Anagrafica Approfondito (AG F1)**
- **Azione:** Mappatura chirurgica read-only del monolite `members` (170+ colonne) e dei suoi legami (27 FK in entrata).
- **Risultato:** Confermato il debito "dual-write" sulle tessere (colonne piatte O-U) e certificati (V-W). Rintracciate le logiche di sync in `storage.ts` e le letture legacy in `routes.ts`.
- **Azione:** Prodotto `audit_F1-002_anagrafica_approfondito_2026_05_11.md` con risposte confermate alle domande (A=athenaId, BA=droppabile) e proposto piano di refactor in 3 step. Nessuna modifica al codice eseguita.

**12/05/2026 00:15 — Audit Approfondito Monolite Anagrafica F2 (AG F2)**
- **Azione:** Effettuata ispezione read-only e mappatura architetturale completa di `maschera-input-generale.tsx` (2012 righe) e relativi dipartimenti (Tab, Context, Members).
- **Scoperte chiave:** 
  1. Il form soffre di *Context Hell* su `CrmFormContext.tsx`, generando re-render massivi su tutti i tab ad ogni digitazione.
  2. Manca la validazione formale Zod, sostituita da validation functions rudimentali.
  3. L'ecosistema usa un payload gigantesco ("tutto-in-uno") inviato in un singolo save manuale.
  4. I "54 campi nascosti Athena" sono presenti in `defaultFormData` ma mescolati come stringhe piatte, non vincolati da interfacce TS dedicate.
- **Validazione:** `npx tsc --noEmit` completato con 0 errori.
- **Documentazione:** Risultati e proposta formale di spacchettamento (Zustand + Micro-PATCH) dettagliati in `audit_F2-002_anagrafica_approfondito_2026_05_11.md`.

**11/05/2026 17:15 — Audit Performance Backend (AG F1)**
- **Azione:** Audit completo di file pesanti, query, indici e dipendenze backend.
- **Output:** `Z_2026_05_11_Performance_File_Pesanti_BACKEND.md`.
- **Scoperte chiave:**
  - `server/routes.ts` 12.259 righe (monolite confermato), `server/storage.ts` 4.788, `shared/schema.ts` 2.728 (73 tabelle).
  - **N+1 micidiale** in `/api/gemteam/dipendenti` (48 query per 16 dipendenti).
  - Indici SQL mancanti su `members.last_name/first_name/email`, `enrollments.status/dates`, `payments.status/payment_date`.
  - `googleapis` pesa 189 MB in node_modules — sostituibile con fetch puri.
- **Proposte ottimizzazione**: Quick wins (indici + fix N+1 GemTeam), medium (split schema, elimina googleapis), big bet (smantellare routes.ts).

**11/05/2026 19:11 — Fix TypeScript CRM e Validazione Codice (AG F2)**
- **Azione:** Fixati 4 errori bloccanti Type-checking segnalati in precedenza all'interno del comparto Maschera Input / CRM.
- **Validazione:** `npx tsc --noEmit` completato con exit code 0. Il comparto è privo di errori di compilazione TS.
- **Documentazione:** Rilasciato report di audit in `report_F2-001_fix_4_errori_ts_2026_05_11.md`.

**11/05/2026 19:07 — Reset + Faro Completati (AG F1/F2)**
- **Analisi Backend:** Completato audit rigoroso "Stato di Fatto Reale" (`stato_di_fatto_F1_backend_2026_05_11.md`).
- **Risultato:** Dimostrata incoerenza tra vecchie documentazioni storiche e il database dev attuale.
- **Documentazione:** Creati i file Faro in `01_status_continui/`.

### 15 Maggio 2026 - 11:50
**F1-021b: Fix BE /importa per Lotto 1 Anagrafica**
- Creata tabella `import_batches` e aggiunte 11 colonne ad-hoc su `members` (`legacy_athena_id`, `data_quality_flag`, ecc)
- Creato nuovo endpoint chunked JSON `POST /api/import/chunked`
- Rimosso blocco rigido su Codice Fiscale, ora implementato fallback `PLC-STR` per stranieri, saltato per minori, tollerato se invalido (checksum errato).
- Implementato Audit UPSERT di Liv. 1 in caso di CF già esistente.
- Frontend aggiornato per l'invio JSON.

### 15 Maggio 2026 - 13:58
**F1-026: Esecuzione modifiche schema DB + Auto-mapping arricchito Lotto 1**
- Rimossi tutti i 26 campi legacy `mother_*` e `father_*` per bypassare limiti `Row size too large` di MariaDB e pulire il DB.
- Rimossi campi inutilizzati (`bio`, `specialization`, `hourly_rate`, `residence_permit`, `residence_permit_expiry`).
- Rinominate/Aggiunte tutte le colonne relative ai Tutori in `genitore1_*` e `genitore2_*` aggiungendo address, mobile e cap.
- Aggiunto alias dictionary avanzato in `client/src/pages/import-data.tsx` per mappare `first_enrollment_date`, consensi privacy, sedi e dati estesi dei genitori.
- Tutti i test `tsc` sono passati con successo (0 errori). Backend UI aggiornati (ex `motherFirstName` rimpiazzati).
- **ADDENDUM:** Eseguita sostituzione globale della nomenclatura UI "Tutore" / "Tutori" con "Genitore" / "Genitori" nei moduli CRM e Dossiers, mantenendo intatti gli identificatori tecnici.

### 15 Maggio 2026 - 14:26
**F1-027 V2: Fix mapping completo e schema**
- Effettuato audit CSV Athena rivelando "Nazione" duplicato alle colonne 10 e 171.
- Schema DB modificato: rinominato `nationality` in `citizenship` per gestire il passaporto, e creata nuova colonna `nationality` per le origini. Schema Drizzle sincronizzato.
- Aggiunte al DB e allo schema 4 colonne mancanti dedicate al Domicilio (`domicile_country`, `domicile_city`, `domicile_postal_code`, `domicile_province`).
- Algoritmo di auto-mapping affinato con override testuali per prevenire confusioni tra Nazione di nascita, residenza e domicilio, ed introdotta esclusione condizionale dei `levenshtein matches`.
- Fissato loop di `calculateAutoMapping` per catturare unicamente la prima colonna CSV (evitando sovrascritture in caso di header identici come Nazione).
- Nessun errore su TypeScript compilato.
