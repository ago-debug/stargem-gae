---
aggiornato: 2026-05-13T19:45:00+02:00
fonti:
  - "[[audit_F1-004_flusso_iscrizioni_backend_2026_05_12]]"
  - "[[audit_F2-003_flusso_iscrizioni_frontend_2026_05_12]]"
  - "[[piano_F1-013_mc3_pagamenti_relazionali_2026_05_13]]"
---

# Piano Architetturale: MC2 Pratica/Stepper Backend

## TL;DR
Il processo di iscrizione attuale manca del concetto di "Pratica" (Dossier): l'endpoint `/api/maschera-generale/save` salva i dati in modo flat, permettendo derive anomale (es. salvataggio di corsi con certificato medico scaduto) e rendendo impossibile il ripristino di "bozze" se l'operatore viene interrotto. Questo piano introduce il **Macro-Cantiere 2 (MC2)**: un'infrastruttura backend basata su `dossiers`, `dossier_steps` e `dossier_audit_log`. Il nuovo orchestratore valuterà server-side gli *hard-block* propedeutici e fungerà da backbone per la futura interfaccia a Stepper (F2-MC2), disaccoppiando l'intento di iscrizione dal salvataggio fisico dei record transazionali finali.

## Tabella GAP
| Gap | Descrizione | Stato Attuale |
|---|---|---|
| **Tabella Dossiers** | Orchestratore dello stato avanzamento pratica | ❌ Assente |
| **Bozze (Draft)** | Mantenimento dati parziali in attesa di validazione/pagamento | ❌ Assente |
| **Hard-Block Server-Side** | Blocco inserimento se prerequisiti (tessera, certificato) non validi | ❌ Assente |
| **Dossier Audit Log** | Tracciabilità di chi ha compiuto quale step della pratica | ❌ Assente |
| **Required Steps API** | Calcolo dinamico degli step mancanti per completare un'iscrizione | ❌ Assente |

## 5 Domande Operative per Gaetano
1. **Schema Dati**: Confermi l'introduzione delle 3 tabelle cardine (`dossiers`, `dossier_steps`, `dossier_audit_log`)?
2. **Motore Regole (Business Rules)**: Le regole di hard-block (es. "il corso richiede tessera attiva") preferisci che siano *hard-coded* in ENUM veloci nel codice, oppure configurabili dinamicamente da database tramite una tabella `business_rules`? (Consiglio: Hard-coded per iniziare, meno complesso).
3. **Migrazione Retroattiva**: Vuoi che tutti gli `enrollments` e `memberships` storici già a sistema vengano convertiti in *Dossier Completati* tramite script, oppure applichiamo i Dossier solo per le nuove iscrizioni d'ora in poi? Se sì, applichiamo un cutoff (es. solo stagione corrente)?
4. **Step Tutori**: Lo step di definizione dei tutori deve essere considerato un hard-block *obbligatorio* prima del pagamento per i partecipanti minorenni?
5. **Dashboard Operativa**: La "Lista Pratiche Aperte" diventerà la vera e propria Home Page per la segreteria (sostituendo la lista anagrafica pura) o sarà una sotto-pagina dedicata?

---

## 1. Censimento Stato Attuale
Dall'ispezione dello schema `shared/schema.ts` e del router:
- **Tabelle Pratica**: Non esistono `dossiers`, `workflows` o `practice_states`.
- **Endpoint di Salvataggio**: L'unico orchestratore è l'endpoint massivo `POST /api/maschera-generale/save`. Esegue in cascata l'upsert del `Member`, crea retroattivamente la `Membership` (leggendo il JSON `tessereMetadata`), salva `Enrollments` e `Payments`.
- **Atomicita e Hard-Block**: L'endpoint non è un vero transattore atomico di step. Se c'è un blocco logico, fallisce bruscamente. Manca un vero blocco per certificato medico (l'UI avvisa ma il server salva lo stesso).
- **Pattern "Draft"**: Inesistente. L'unico flag assimilabile è `is_trial` (se inserito in F1-013), ma non esiste il concetto di "Pratica in compilazione". Per ricostruire lo stato di un utente, la UI deve spulciare i singoli record (pagamenti pendenti, enrollments attivi).

## 2. GAP Identificati
- **Modello Dossier**: Manca una testata `dossiers` (`id`, `member_id`, `dossier_type`, `status`, `payment_group_id`).
- **Tassonomia Pratiche**: Mancano gli ENUM necessari per identificare il `dossier_type` (`nuovo_iscritto`, `rinnovo`, `iscrizione_corso`, `modifica_dati`, `acquisto_carnet`).
- **Lifecycle (Stati)**: Mancano gli ENUM `dossier_status` (`bozza`, `in_compilazione`, `in_pagamento`, `completato`, `annullato`).
- **Supporto UI**: Manca un endpoint `GET /api/members/:id/dossier-status` che guidi il frontend (Wizard) indicando quali step logici mancano.
- **Audit**: Zero tracciabilità su chi ha approvato una pratica complessa.

## 3. Schema Target Proposto (Drizzle ORM)
Tutte le tabelle rispetteranno la **Regola 13** (`tenant_id` default '1').

```typescript
// Tabella Dossiers (Testata Pratica)
export const dossiers = mysqlTable("dossiers", {
  id: int("id").primaryKey().autoincrement(),
  tenantId: varchar("tenant_id", { length: 50 }).notNull().default('1'),
  memberId: int("member_id").references(() => members.id),
  dossierType: varchar("dossier_type", { length: 50 }).notNull(), 
  status: varchar("status", { length: 50 }).notNull().default('bozza'),
  paymentGroupId: varchar("payment_group_id", { length: 36 }), // Link cross-asse a MC3 (Pagamenti Relazionali)
  extraData: json("extra_data"), // Metadata flessibili (es. note anamnesi, config specifiche)
  createdBy: int("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Tabella Dossier Steps (I passi da completare)
export const dossierSteps = mysqlTable("dossier_steps", {
  id: int("id").primaryKey().autoincrement(),
  tenantId: varchar("tenant_id", { length: 50 }).notNull().default('1'),
  dossierId: int("dossier_id").references(() => dossiers.id),
  stepName: varchar("step_name", { length: 50 }).notNull(), // 'anagrafica', 'tutori', 'certificato', 'pagamento'
  status: varchar("status", { length: 50 }).default('pending'), // 'pending', 'completed', 'blocked', 'skipped'
  blockingReason: text("blocking_reason"), // Se blocked, indica il motivo
  completedBy: int("completed_by").references(() => users.id),
  completedAt: timestamp("completed_at"),
});

// Tabella Dossier Audit Log
export const dossierAuditLog = mysqlTable("dossier_audit_log", {
  id: int("id").primaryKey().autoincrement(),
  dossierId: int("dossier_id").references(() => dossiers.id),
  action: varchar("action", { length: 100 }),
  performedBy: int("performed_by").references(() => users.id),
  performedAt: timestamp("performed_at").defaultNow(),
  details: json("details"),
});
```

## 4. Business Rules & Hard-Block Server-Side
L'orchestratore dovrà imporre veri hard-block:
1. **Iscrizione Corso Istituzionale** → `membership.status == valida` AND `medical_certificate.expiry > course.start_date`.
2. **Partecipante Minorenne** → Il dossier richiede l'inserimento/conferma di almeno un Tutore.
3. **Tessera Nuova** → `payment.status == paid` (o contabilizzato in MC3 Payment Group).
4. **Welfare Aziendale** → `company_agreement` attivo e autorizzazione voucher inserita.
Queste regole saranno valutate a runtime prima di permettere il cambio stato del `dossier_step` relativo.

## 5. Flusso API Pratica Target
- `POST /api/dossiers` → Inizializza la bozza, calcola i required steps e ritorna `dossier_id`.
- `GET /api/dossiers/:id/required-steps` → Ritorna lo stato di ogni step (guidando il frontend).
- `PATCH /api/dossiers/:id/step` → Aggiorna i dati parziali di uno step (es. salvataggio anagrafica) e lo marca come `completed` se passa i controlli.
- `POST /api/dossiers/:id/complete` → Verifica atomica. Se tutti gli step sono completi, finalizza la pratica (crea/conferma Enrollments veri, aggiorna Status). In caso contrario, HTTP 400 + log errori.
- `GET /api/dossiers?member_id=X&status=in_corso` → Elenco per la UI "Riprendi Pratica".
- `DELETE /api/dossiers/:id` → Soft-delete (`status = annullato`).

## 6. Impatto sul Frontend (F2-MC2 Futuro)
- Componente `Wizard/Stepper` visivo che sostituirà i vecchi e confusi Tabs in `maschera-input`.
- Se la segretaria chiude il browser al passo 3 (Pagamento), alla riapertura dell'anagrafica troverà un banner "Pratica in corso" per riprendere dal passo 3.
- Blocco UI perimetrato: Il pulsante "Salva Iscrizione" sarà letteralmente *disabilitato* dal backend tramite la mancata validazione del `required-steps` (es. Certificato Rosso).

## 7. Migration dei Dati Esistenti (Strategia)
Per non avere uno storico vuoto e far funzionare le metriche di conversione future:
- **Bulk Script Idempotente**: Scorre tutti i membri con Enrollments. Crea un `dossier` retroattivo di tipo `iscrizione_corso` con stato `completato`.
- `completed_at` viene mutuato dalla data di iscrizione o dal `paid_date` del payment collegato.
- Possibilità di definire un cutoff per alleggerire l'elaborazione.

## 8. Roadmap Fasi
- **Fase A (3-4h)**: Drizzle Schema Migration + Endpoint base CRUD `dossiers`.
- **Fase B (3-4h)**: Orchestratore `dossier_steps` + implementazione logica di validazione Hard-block.
- **Fase C (2-3h)**: Engine di Audit log (`dossier_audit_log`) + endpoint query dashboard.
- **Fase D (2-3h)**: Script Bulk Migration retroattiva + Test su DB Staging.

## 9. Rischi e Decisioni Aperte
- **Hard-Coded vs DB Config**: Inserire le regole in DB `business_rules` è il target a lungo termine per un SaaS, ma allungherebbe il setup dell'MVP. Consigliato iniziare con ENUM + logica hard-coded in un `DossierValidatorService`.
- **Appesantimento Storico**: Generare dossier retroattivi per 5 anni di iscritti potrebbe rallentare lo script. Consigliato limitare la migrazione alla Stagione 2025/2026.
- **Transizione Legacy**: L'attuale `/api/maschera-generale/save` dovrà sopravvivere per una finestra transitoria fino al deployment effettivo dello Stepper Frontend (F2-MC2), per poi essere rimosso.
- **Notifiche (Area O)**: L'invio di email automatiche al cambio di stato pratica va implementato come webhook o evento asincrono al completamento di un dossier, tenendolo fuori dallo scope base di MC2.
