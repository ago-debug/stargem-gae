---
aggiornato: 2026-05-13T19:30:00+02:00
fonti:
  - classificazione_utenti_2026_05_13bis
  - proposal_Quote_Param_2026_05_12
---

# Piano Architetturale: MC3 Pagamenti Relazionali

## TL;DR
L'infrastruttura pagamenti attuale (`payments`) non supporta scenari relazionali complessi (pagamento multiplo per figli, paganti terzi esterni, welfare flessibile), mancando dei concetti distinti di Payer, BillingSubject e Participant. Questo piano propone la transizione a un modello multi-attore introducendo `external_payers`, `payment_participants` e `societies`. Il refactoring avverrà in 4 fasi, toccando backend e schema DB in logica Drizzle, partendo dalle basi relazionali fino a gestire logiche di welfare aziendale complesse e la generazione dinamica della ricevuta e del foglio detrazione, salvaguardando lo storico esistente.

## Tabella GAP
| Gap | Descrizione | Stato Attuale |
|---|---|---|
| **Payer_id / Billing_subject_id** | Assenza di distinzione tra chi partecipa, chi paga e chi riceve doc | ❌ Critico (Assente) |
| **ExternalPayer** | Impossibilità di gestire paganti extra-CRM (Comune, Sponsor) | ❌ Critico (Assente) |
| **Document Type** | Discriminante Ricevuta / Fattura mancante a livello di record | ⚠️ Parziale |
| **Pagamento Multiplo** | Singolo pagamento per coprire N iscritti (es. 1 Mamma → 3 Figlie) | ❌ Critico (Assente) |
| **Gift Card & Balance** | Gestione saldo ibrido e carta regalo come valuta | ❌ Critico (Assente) |
| **Welfare Formule** | Piena tracciabilità accessi vs voucher vs fattura cumulativa | ⚠️ Parziale |
| **Foglio Detrazione Fiscale** | Generazione riepilogo normato per genitori paganti | ❌ Assente |

## Domande Operative per Gaetano
1. Confermi lo schema a 3 nuove tabelle (`external_payers` + `payment_participants` + `societies`) e la conseguente divisione dei ruoli su `payments`?
2. Il "Welfare check-in" va tracciato individualmente (per accesso fisico in sede) o è sufficiente una fatturazione mensile forfettaria per l'azienda?
3. La Gift card deve avere un "proprietario" (un `member_id` fisicamente collegato) o è un voucher completamente anonimo al portatore?
4. Il modulo "Detrazione fiscale" richiederà la consulenza di un commercialista per redigere un template PDF normativamente valido?
5. Riguardo alla migration dei dati legacy `payments` verso lo schema relazionale: dobbiamo considerarla una priorità alta (svolgibile subito in Fase A) o la confiniamo al backlog per via di eventuali record non lineari?

---

## 1) Censimento Schema Attuale
- **payments**: Contiene `memberId` (che implicitamente fa da partecipante e pagante unico), `enrollmentId`, `amount`, `status`, `paymentMethod`.
- **members**: Contiene l'anagrafica base, ma rischia di confondere enti, società e persone fisiche. Non supporta agevolmente paganti esterni "una tantum".
- **memberships** / **enrollments**: Sono collegati a `payments` unicamente tramite chiavi singole rigide. Non permettono il pattern 1 Payment → N Partecipanti.
- **company_agreements** / **promo_rules**: Contengono le regole di sconto (Welfare e Convenzioni) ma manca la tracciabilità delle presenze ai fini di una fatturazione welfare (es. Fitprime).
- **member_relationships**: Tabella esistente per il rapporto genitore-figlio, ma in gran parte inutilizzata in scrittura (dead-code logico in F1-004).

## 2) GAP Identificati vs Modello "Classificazione Utenti"
Analizzando `classificazione_utenti_2026_05_13bis` sono emersi vuoti architetturali profondi:
- Mancanza dei **tre ruoli di transazione**: Participant (che fruisce), Payer (che striscia la carta), BillingSubject (a cui va l'intestazione fiscale). Questo impedisce la fatturazione a terzi.
- Mancanza della tipologia `ExternalPayer` per Comune, bandi, congregazioni di suore o associazioni che non devono vivere dentro l'ecosistema anagrafico base.
- Mancanza del `document_type` granulare (`ricevuta_istituzionale`, `fattura`, `booking_only`), essenziale in quanto la regola base di StarGem fissa la ricevuta per i tesserati e la fattura per gli esterni/società.
- Mancanza di una logica "Carello" Multi-Studente in cui lo scontrino è unico e il `payment_id` viene associato a N partecipanti.
- Assenza totale del concetto computazionale di Gift Card (pagamento parziale) e Balance (residuo).
- Mancanza logica del Foglio Detrazione (usatissimo in contesto sportivo) per facilitare il lavoro alle famiglie.

## 3) Schema Target Proposto (Drizzle ORM)
> In accordo con la Regola 13, tutte le nuove tabelle includono `tenant_id` con default `'1'`.

```typescript
// Nuova Tabella: external_payers
export const externalPayers = mysqlTable("external_payers", {
  id: int("id").primaryKey().autoincrement(),
  tenantId: varchar("tenant_id", { length: 50 }).notNull().default('1'),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  fiscalCode: varchar("fiscal_code", { length: 50 }),
  vatNumber: varchar("vat_number", { length: 50 }),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Nuova Tabella: societies
export const societies = mysqlTable("societies", {
  id: int("id").primaryKey().autoincrement(),
  tenantId: varchar("tenant_id", { length: 50 }).notNull().default('1'),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  fiscalCode: varchar("fiscal_code", { length: 50 }),
  vatNumber: varchar("vat_number", { length: 50 }),
  address: text("address"),
  isWelfareProvider: boolean("is_welfare_provider").default(false),
  welfareFormula: text("welfare_formula"),
});

// Modifiche su payments
// ADD COLUMN payer_id INT NULL
// ADD COLUMN payer_type ENUM('member', 'society', 'external')
// ADD COLUMN billing_subject_id INT NULL
// ADD COLUMN billing_subject_type ENUM('member', 'society', 'external')
// ADD COLUMN document_type ENUM('ricevuta_istituzionale', 'fattura', 'booking_only')
// ADD COLUMN payment_group_id VARCHAR(36) NULL // per pagamenti di gruppo o multipli
// ADD COLUMN gift_card_amount DECIMAL(10,2) DEFAULT 0
// ADD COLUMN balance_amount DECIMAL(10,2) DEFAULT 0

// Nuova Tabella: payment_participants
// Questo gestisce il 1 Payment -> N Partecipanti
export const paymentParticipants = mysqlTable("payment_participants", {
  id: int("id").primaryKey().autoincrement(),
  tenantId: varchar("tenant_id", { length: 50 }).notNull().default('1'),
  paymentId: int("payment_id").references(() => payments.id),
  memberId: int("member_id").references(() => members.id),
  activityType: varchar("activity_type", { length: 50 }), // 'course', 'membership', 'workshop'
  activityId: int("activity_id"), 
  amountAttributed: decimal("amount_attributed", { precision: 10, scale: 2 }),
});
```
*(Eventuali estensioni su `member_relationships` per censire non-genitori come tutori paganti esterni).*

## 4) Architettura Welfare Formule (Esempi Reali)
Il sistema dovrà gestire due modelli principali, utilizzando `company_agreements` in ottica espansa:
- **Fitprime/Wellhub (Check-in Fisico + Fatturazione Trimestrale)**: Verrà introdotta una tabella `welfare_check_ins` (`id`, `agreement_id`, `member_id`, `check_in_at`, `validated`) in cui ogni strisciata al desk (anche virtuale/tramite app aziendale terzi) inserisce un record. Il backend di StarGem userà questi check-in per produrre la fattura societaria a fine trimestre.
- **Pellegrini/WAI (Voucher prepagato + Fatturazione Aziendale)**: Registrazione del voucher come un vero e proprio metodo di pagamento sul singolo corso, dove Payer=Azienda. La fattura viene emessa all'azienda (`billingSubjectType = society`), mentre il partecipante mantiene il requisito della tessera + certificato per accedere.

## 5) Flusso Operativo Target (API Endpoints)
- `POST /api/payments/multi-participant`
  - Riceve un payload strutturato per il Checkout: chi paga (`payer_id`, `payer_type`), chi riceve la ricevuta/fattura (`billing_subject`), array di `participants` (chi entra fisicamente in sala + quale importo), e l'eventuale `gift_card_amount` scalato.
- `GET /api/payments/:id`
  - Ritorna il pagamento denormalizzato con nested includes (join polimorfico sul payer e map dei `payment_participants`).
- `GET /api/members/:id/fiscal-receipt`
  - Costruisce un PDF al volo aggregando tutti i pagamenti effettuati da un genitore (`payer_id`) a beneficio del figlio (`member_id` via `payment_participants`).
- `GET /api/members/:id/payments-history`
  - Include due array: pagamenti "effettuati da questo utente" (come Payer) e "in cui questo utente ha partecipato" (come Participant, magari pagato dalla parrocchia).
- `POST /api/gift-cards/redeem`
  - Permette di redimere un importo da una GC decurtandolo dal totale in cassa (popolando il campo `gift_card_amount` e computando il resto su `balance_amount`).

## 6) Roadmap a Fasi
1. **Fase A (Preparatoria, 3-4h)**: Migration Drizzle. Creazione `external_payers`, `societies`, `payment_participants` e le colonne su `payments`. Implementazione `POST /api/payments/multi-participant` base.
2. **Fase B (Documento e Split, 4-5h)**: Logica per la determinazione del `document_type` in base al Payer/Billing e applicazione Gift Card virtuali su totali carrello.
3. **Fase C (Welfare, 3-4h)**: Tracciamento ingressi Fitprime (`welfare_check_ins`) e connettore amministrativo per reportistica trimestrale.
4. **Fase D (Detrazione, 2-3h)**: Modulo di generazione del foglio di Detrazione Fiscale in formato stampabile.

## 7) Rischi e Decisioni Aperte
- **Decisione Fiscale Split Azienda+Dipendente**: In caso di welfare misto in cui un corso è in parte a carico azienda e in parte dipendente (es. quota tessera istituzionale privata, corso commerciale aziendale). Manca conferma di liceità da commercialista. Non bloccante per Fase A.
- **Migration Dati Esistenti**: "Lazy" vs "Bulk". Attualmente in DB si ha un unico `memberId`. Eseguire script bulk che duplica implicitamente `payerId = billingSubjectId = participantId = memberId` per tutto il legacy è la via più sicura.
- **Compatibilità Endpoint Legacy**: Mantenere l'alias su `GET /api/payments` fino a totale adeguamento della controparte Frontend (F2).
- **Tracciabilità Pagamenti Multipli Nascosti**: Nel database preesistente potrebbero esserci pagamenti doppi o attribuiti forzosamente al genitore anziché al figlio. Da pulire manualmente in Fase B tramite UI apposita.
