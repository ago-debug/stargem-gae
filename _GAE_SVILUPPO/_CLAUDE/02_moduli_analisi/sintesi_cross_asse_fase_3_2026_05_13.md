---
aggiornato: 2026-05-13T19:30
ultima_verifica_vs_codice: 2026-05-13 (basato su audit AG chiusi oggi)
validita_prevista: 2026-06-13
tipo: sintesi-strategica
priorita: P0-decisione-fase-3
tags: [sintesi, cross-asse, fase-3, pianificazione, da-decidere]
fonti:
  - "[[audit_F1-004_flusso_iscrizioni_backend_2026_05_12]]"
  - "[[audit_F2-003_flusso_iscrizioni_frontend_2026_05_12]]"
  - "[[classificazione_utenti_2026_05_13]]"
  - "[[proposal_Quote_Param_2026_05_12]]"
---

# Sintesi Cross-Asse Fase 3 — Decisione ordine di attacco

## 1. TL;DR

I megaaudit [[audit_F1-004_flusso_iscrizioni_backend_2026_05_12]] (Backend, 7 settimane uomo) e [[audit_F2-003_flusso_iscrizioni_frontend_2026_05_12]] (Frontend, 10-15h aggiuntive) hanno mappato le stesse 16 aree A-P con esiti coerenti: il flusso iscrizioni è solido a metà e ha tre nodi strutturali che vanno aggrediti come cantieri cross-asse, non come fix isolati. Emergono tre macro-cantieri (MC1 Base64 end-to-end, MC2 Hard-Block + modello Pratica, MC3 modello finanziario/relazionale). Stima totale cross-asse: ~9-10 settimane uomo BE + ~10-15h FE coordinati. Raccomandazione 1-frase: **partire da MC1 (Base64) come primo cantiere perché ha rischio bloccante alto, scope ben circoscritto e sblocca infrastruttura di storage riusabile per MC2 e MC3**.

---

## 2. Tabella 16 aree A-P x 2 assi

Legenda stati: 1=ok, 2=critico, 3=parziale, 4=assente.

| Area | Tema | Stato BE | Stato FE | Convergenza cross-asse | Macro-cantiere mappato |
|---|---|---|---|---|---|
| A | Identita e Univocita | 3 | 3 | Si — validatori Zod condivisi | MC2 (parziale) |
| B | Ruoli multipli persona | 2 | 4 | Si — solo a DB, niente UI | MC3 |
| C | Duplicati / Merge | 3 | 3 | Si — UI distruttiva, no undo | (fuori MC, fix secondari) |
| D | Verifica dati via link | 4 | 4 | Si — modulo B2C assente | (fuori MC, rinviato) |
| E | Minorenni e Tutori | 4 | 4 | Si — `member_relationships` dead-code | MC3 |
| F | Pratica / Workflow | 4 | 4 | Si — manca DossierService + Stepper | MC2 |
| G | Pagamenti (Payer) | 3 | 3 | Si — modello piatto, no payer_id | MC3 |
| H | Tesseramento | 3 | 3 | Si — dual-write monolitico | MC2 (refactor maschera) |
| I | Certificato medico | 2 | 2 | Si — Base64 in JSON BE+FE | MC1 |
| J | Documenti / Firme | 2 | 2 | Si — Base64 in state React + DB | MC1 |
| K | Area Tesserati B2C | 3 | 3 | Si — UI mockup, API mancanti | (fuori MC, rinviato) |
| L | Omnicanalita / Link | 4 | 4 | Si — magic link assenti | (fuori MC, rinviato) |
| M | Stati / Hard-Blocks | 4 | 4 | Si — nessun validatore server | MC2 |
| N | Non Tesserati (Guest) | 4 | 3 | Parziale — bypass UI, no entita | MC3 (parziale) |
| O | Notifiche / Reminder | 3 | 4 | Si — provider stub, no cron | (fuori MC, rinviato) |
| P | Sicurezza / Audit GDPR | 3 | 4 | Si — log solo DELETE, no UI | (fuori MC, fix secondari) |

---

## 3. I 3 macro-cantieri Fase 3 cross-asse

### MC1 — Memory Leak Base64 end-to-end

- **Aree coinvolte:** I (Certificato Medico), J (Documenti e Modulistica). Stato BE+FE: 2 critico.
- **Scope tecnico:**
  - BE: creare endpoint `POST /api/upload` multipart streaming (multer o equivalente), nuova tabella `documents` (o `member_documents`) con `id`, `member_id`, `tipo`, `path/url`, `mime`, `size`, `uploaded_at`. Script di migrazione per drenare il Base64 esistente da `members.attachmentMetadata` JSON e spostarlo su file system o S3.
  - FE: rimuovere `compressImage` / `FileReader.readAsDataURL` da `TabAllegati.tsx`, sostituire con upload asincrono dropzone che salva su BE prima del submit anagrafica. Aggiornare `TabTessere.tsx` (campi certificato medico) per leggere documento via URL.
  - Shared: validatori Zod su mime/size, sanitizzazione filename.
- **Prerequisiti:**
  - Decisione storage: filesystem locale Ionos vs S3 (AWS/MinIO/altro).
  - Definire schema folder/bucket e politica di retention/backup.
  - Verificare se esistono Base64 reali in produzione da migrare (script di censimento).
- **Stima:** BE ~1.5 w/u (Step 1 del piano F1-004) + FE ~1-2 w/u (Sotto-step 1 piano F2-003). Parallelizzabile DOPO che BE espone l'endpoint stub (FE puo lavorare contro mock).
- **Rischio:** Medium. Crash reale Node/V8 e bloat DB confermati come rischio operativo dal BE. Pero il refactor e' chirurgico (un endpoint, una tabella, una tab UI). Rischio basso di rompere flussi esistenti perche il path Base64 puo restare temporaneamente in legge-vecchio durante la transizione.
- **Valore di business:** Stabilita applicazione (no crash su upload multipli), DB piu leggero (query piu veloci su `members`), conformita futura GDPR (file separati dal record anagrafico = piu facile data export/cancellazione). Sblocca anche firma digitale futura.
- **Dipendenze con altri MC:** Nessuna dipendenza in ingresso. **MC2 e MC3 ne beneficiano** indirettamente (Pratica e relazioni familiari avranno modello documenti gia pulito).

### MC2 — Hard-Block + modello Pratica mancante

- **Aree coinvolte:** F (Pratica Operativa), M (Stati e Blocchi). Toccano anche A (validatori identita) e H (smantellamento dual-write tesseramento).
- **Scope tecnico:**
  - BE: unificare regole di business in Zod schemas condivisi (`shared/`), introdurre HTTP 409/403 in `POST /api/checkout/complete`, `POST /api/memberships`, `POST /api/maschera-generale/save` per: certificato medico scaduto, eta incompatibile col corso, insoluti pregressi. Creare `GET /api/members/:id/dossier-status` come DTO aggregatore (no nuova tabella, JOIN su 4 tabelle esistenti). Smantellare bulk save di `routes.ts:6205` e disaccoppiare `POST /api/memberships` dal dual-write su `tessereMetadata`.
  - FE: convertire i Tab liberi di `maschera-input-generale.tsx` in Stepper/Wizard a 4 step (Identita/Duplicati → Tutori/Relazioni → Checkout → Firme/Documenti). Gestire errori 409 nella UI di `NuovoPagamentoModal` con messaggi bloccanti chiari. Aggiungere badge "semaforo" (rosso bloccante, giallo warning) su anagrafica e checkout.
- **Prerequisiti:**
  - Decisione **Hard-Block vs Soft-Warning** per ciascuna regola (certificato scaduto, insoluti, eta). Domanda gia aperta in F1-004 §4.
  - Decisione **Wizard vs Tabs** lato FE (domanda aperta in F2-003 §4 Q2).
  - Definire elenco completo delle regole bloccanti (servono Gaetano + segreteria reale).
- **Stima:** BE ~3.5 w/u (Step 2 + Step 4 piano F1-004 — Orchestratore Zod 1.5 + Refactor Maschera/Tessere 2) + FE ~2-3 w/u (Sotto-step 2 + 3 piano F2-003). Parallelizzabile parzialmente: validatori Zod condivisi vanno scritti prima sia per BE che FE.
- **Rischio:** **High.** Tocca i due endpoint piu monolitici (`maschera-generale/save` 12.000 righe + `POST /api/memberships` con dual-write). Refactor della UI principale che la segreteria usa ogni giorno. Necessita test di regressione pesanti, e possibile rollout incrementale. Pero e' il cantiere con maggiore valore d'uso quotidiano.
- **Valore di business:** Riduce drasticamente errori operativi (no piu iscrizioni con certificato scaduto), migliora UX segreteria (semafori chiari, no piu salti tra 4 tab per capire stato pratica), bonifica architetturale del monolite piu critico. Sblocca la futura compliance auditabile.
- **Dipendenze con altri MC:** **Beneficia di MC1** (i documenti separati rendono piu pulito il check "certificato presente"). **Indipendente da MC3** ma genera Zod schemas che MC3 puo riusare.

### MC3 — Modello finanziario + relazionale debole

- **Aree coinvolte:** E (Minorenni e Famiglia), G (Pagamenti — Payer/Participant/Billing), B (Ruoli multipli persona). Tocca anche N (Guest) ed entita `ExternalPayer` da [[classificazione_utenti_2026_05_13]].
- **Scope tecnico:**
  - BE: ALTER `payments` per aggiungere `payer_id`, `payer_type`, `billing_subject_id`, `billing_subject_type`, `document_type`. Nuova tabella `external_payers` per soggetti non in CRM (Comune, sponsor). API di scrittura per `member_relationships` (oggi solo lettura): `POST /api/members/:id/relationships`, e aggiornamento di `POST /api/members` per accettare `relationships[]` in transazione. Logica di classificazione utente (`is_trial`, `is_commercial_client`).
  - FE: riscrivere `TabTutori.tsx` da campi flat (`nomeGen1`, `cfGen1`) a entita Member relazionali con MemberSelector. Aggiungere in `NuovoPagamentoModal` i campi Pagante/Intestatario distinti dal Partecipante. Badge ruolo persona in anagrafica (Tesserato/Staff/Tutore/Cliente commerciale).
  - Shared: schemi `PaymentWithRoles`, `MemberRelationship` validati Zod.
- **Prerequisiti:**
  - **CRITICO:** validazione fiscale con commercialista (split fattura+ricevuta azienda/dipendente, regola merchandising tesserato, ecc.).
  - Decisione welfare aziendale: formule concrete oggi attive (Q5 [[classificazione_utenti_2026_05_13]]).
  - Decisione SEG-002 (rinominazione Anagrafica → Utente) — non bloccante tecnicamente ma e' lo stesso ambito concettuale.
  - Verifica live sul gestionale produzione (sezione 9 [[classificazione_utenti_2026_05_13]]).
- **Stima:** BE ~2 w/u (Step 3 piano F1-004) + FE ~2-3 w/u (riscrittura `TabTutori` + estensione checkout). Parallelizzabile parzialmente. **Sottostimata se si include welfare aziendale completo.**
- **Rischio:** **High.** Modello dati centrale (la tabella `payments` ha gia journal_entries collegate). Migrazione storico delicata. Rischio fiscale alto se non validato dal commercialista. Pero e' il cantiere che sblocca la classificazione utenti e il listino [[proposal_Quote_Param_2026_05_12]].
- **Valore di business:** Fatturazione corretta (oggi se padre paga per figlio, ricevuta intestata al figlio: errore fiscale strutturale). Supporto reale famiglie (un genitore puo iscrivere 3 figli senza ridigitare). Apertura a clientela B2B/welfare. **Senza MC3 il listino Quote_Param parte zoppo** perche il prezzo dipende dal tesseramento del partecipante ma il documento dipende dal pagante/intestatario, e oggi sono confusi.
- **Dipendenze con altri MC:** **Dipende indirettamente da MC2** (gli schemi Zod condivisi sviluppati per Hard-Block sono lo stesso pattern). **Indipendente da MC1.** Sblocca: classificazione utenti, listino parametrico fase 2, ExternalPayer.

---

## 4. Matrice di scelta (rischio x valore)

| Macro-cantiere | Rischio | Valore business | Punteggio combinato |
|---|---|---|---|
| MC1 Base64 end-to-end | Medium (refactor chirurgico, no rotture dual-path) | Medio-alto (stabilita app + bonifica DB + prerequisito firma digitale) | **Alto** (rischio gestibile, valore concreto immediato) |
| MC2 Hard-Block + Pratica | High (tocca monolite + UI principale segreteria) | Alto (UX segreteria + compliance + bonifica monolite) | **Alto** (alto valore d'uso, ma rischio rollout) |
| MC3 Pagamenti relazionali | High (modello dati centrale + validazione fiscale esterna) | Alto (fatturazione corretta + famiglie + B2B + sblocca Quote_Param) | **Medio-alto** (massimo valore strategico, massima incertezza esterna) |

---

## 5. Ordine di attacco proposto

**Ordine raccomandato: MC1 → MC2 → MC3.**

1. **MC1 prima.** Cantiere a basso rischio strutturale con scope ben definito (1 endpoint, 1 tabella, 1 tab UI). Si chiude in ~2.5-3.5 w/u totali. Sblocca infrastruttura di storage che diventa utile a tutti gli altri (firme digitali, documenti pratica, foto profilo GemTeam). Inoltre risolve un rischio operativo bloccante in agguato (crash V8 su upload multipli). E' il classico "fix che non si pente nessuno di aver fatto subito".

2. **MC2 secondo.** Una volta che documenti sono separati dal record anagrafico, costruire il `DossierService` e gli Hard-Block diventa piu pulito (il check "certificato presente" passa da `attachmentMetadata IS NOT NULL` a `documents WHERE tipo='certificato'`). MC2 e' il cantiere a maggior valore di UX quotidiana per la segreteria. Va comunque dopo MC1 per evitare di toccare due volte la stessa UI (`TabAllegati` cambia in MC1, `TabTessere` viene riconnessa allo Stepper in MC2).

3. **MC3 ultimo.** Ha il valore strategico piu alto (sblocca classificazione utenti + Quote_Param) ma richiede prerequisiti esterni (validazione commercialista + chiarimento welfare con team). Mentre Cowork lavora a MC1 e MC2, Gaetano puo in parallelo: (a) far validare le regole fiscali dal commercialista, (b) raccogliere le formule welfare reali dal team, (c) eseguire le verifiche live sul gestionale produzione (sezione 9 [[classificazione_utenti_2026_05_13]]). Quando MC3 partira, i prerequisiti esterni saranno gia chiusi.

**Perche NON partire da MC3 anche se ha valore massimo:** richiede input esterni (commercialista, team) che oggi sono pendenti. Partire ora significa lavorare su un modello che potrebbe cambiare quando arrivano le risposte fiscali. Meglio usare quel tempo per chiudere MC1+MC2 e arrivare a MC3 con dati certi.

**Perche NON partire da MC2 prima di MC1:** lo Stepper di MC2 contiene uno step "Firme/Documenti" che dipende dall'infrastruttura di upload di MC1. Farlo prima significherebbe tornare a riscrivere quello step.

---

## 6. Tasks "quick win" extraibili PRIMA di partire con Fase 3

Cose veloci (< 4h ciascuna) eseguibili da AG/F2 in parallelo alla pianificazione Fase 3, senza dipendere dalle decisioni strategiche:

1. **PhotoUrl Base64 GemTeam (Priorita #2 della checklist)** — payload `/api/gemteam/dipendenti` da 2.8MB per avatar inline. Spostare foto in static asset + URL relativo. ~2-3h F1+F2. E' un *trailer* di MC1, validera l'approccio storage scelto.
2. **SEG-005 GemTeam avatar iniziali ordine** — controllare e fixare logica `splitFullName()` per "P. Agostino" e simili. ~1-2h F2.
3. **SEG-006 account "agro" da bonificare** — DELETE soft o flag su account spazzatura + script verifica altri account simili. ~1h F1.
4. **Archivio prompt evasi** — pulizia `_ANTIGRAVITY/00_inbox_prompt/` e spostamento dei prompt F1-001..F1-004 / F2-001..F2-003 in `_ANTIGRAVITY/03_archive/`. ~30 min Subagent Documentazione.
5. **Censimento Base64 esistenti su `members.attachmentMetadata`** — script SQL read-only per misurare quanti record hanno Base64 e dimensione totale. Da' la baseline per la migrazione di MC1. ~1-2h F1.

---

## 7. Decisioni che Gaetano deve prendere

Lista checklist con opzioni A/B/C (non risolte qui — solo enumerate):

- [ ] **D1. Storage MC1.** A) Filesystem locale Ionos · B) S3/AWS · C) MinIO self-hosted · D) Cloudflare R2.
- [ ] **D2. Hard-Block vs Soft-Warning MC2** (per ciascuna regola: certificato scaduto, insoluti, eta). A) Hard-Block sempre (blocca operatore) · B) Soft-Warning con log audit (operatore puo procedere consapevolmente) · C) Misto: certificato Hard-Block, insoluti Soft-Warning.
- [ ] **D3. Wizard vs Tabs MC2.** A) Stepper rigido sequenziale · B) Tabs liberi con badge completamento · C) Ibrido (Tab liberi + Wizard solo al checkout).
- [ ] **D4. Versioning regole MC3 e Quote_Param.** A) Riscrittura in place (semplice) · B) Versioning con `valid_from/valid_to` · C) Audit log separato.
- [ ] **D5. Ordine attacco Fase 3.** A) MC1 → MC2 → MC3 (proposta Cowork) · B) MC2 → MC1 → MC3 · C) MC1 + MC3 in parallelo, MC2 dopo · D) altro.
- [ ] **D6. SEG-002 (rinominazione "Anagrafica" → "Utente")** dentro o fuori MC3. A) Dentro MC3 (stesso ambito concettuale) · B) Task separato F2 dedicato · C) Rinviato a dopo Fase 3.

---

## 8. Cosa NON e' coperto dal megaaudit (gap consapevoli)

I megaaudit F1-004 e F2-003 hanno mappato il **flusso iscrizioni** in tutta la sua catena. Restano fuori (non e' un fallimento, e' scope dichiarato):

1. **Modulo Calendario / Planning / Gemdario.** UI FREEZE storica per bug raggruppamento Planning (vedi Priorita #3 [[CHECKLIST_PROGETTO]]). Tocca `useTemporalGrid` e gestione turni. Va auditato separatamente con stesso schema F1-NNN/F2-NNN.
2. **GemStaff Personal Trainer / Insegnanti operativi.** Le segnalazioni SEG-001/SEG-007 toccano la lista PT (split nome/cognome, contatore record, ordinamento). Pattern globale su tutte le liste (SEG-003) ancora da decidere come componente unico.
3. **Gemory (memoria storica) e moduli "fuori iscrizione"** — chat GemChat, allegati Drive, integrazione GoogleAPI. Non sono nel perimetro F1-004/F2-003 ed entreranno in audit dedicati quando rilevanti.

---

*Documento prodotto da Subagent Ricerca (Cowork) il 2026-05-13T19:30 dopo lettura dei 2 megaaudit AG (F1-004 + F2-003), del modello classificazione utenti del 13/05, della proposal Quote_Param del 12/05 e della [[CHECKLIST_PROGETTO]]. Da rivedere con Gaetano per scelta ordine di attacco e decisioni D1-D6.*
