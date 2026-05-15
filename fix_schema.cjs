const fs = require('fs');

let schema = fs.readFileSync('shared/schema.ts', 'utf8');

// The new columns for members:
const membersCols = `
  legacyAthenaId: varchar("legacy_athena_id", { length: 50 }),
  legacyMasterId: varchar("legacy_master_id", { length: 50 }),
  tutor1FirstName: varchar("tutor1_first_name", { length: 100 }),
  tutor1LastName: varchar("tutor1_last_name", { length: 100 }),
  tutor1FiscalCode: varchar("tutor1_fiscal_code", { length: 20 }),
  importedLotto: varchar("imported_lotto", { length: 50 }),
  importedSourceRowIndex: int("imported_source_row_index"),
  importedBy: varchar("imported_by", { length: 50 }),
  importedAt: timestamp("imported_at"),
  dataQualityFlag: json("data_quality_flag"),
  extraData: json("extra_data"),
`;
if (!schema.includes('legacyAthenaId')) {
  schema = schema.replace(
    /export const members = mysqlTable\("members", \{/,
    `export const members = mysqlTable("members", {\n${membersCols}`
  );
}

// Check if dossiers exist
if (!schema.includes('dossierSteps')) {
  const code = `
export const dossiers = mysqlTable("dossiers", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").notNull(),
  dossierType: mysqlEnum("dossier_type", ['nuovo_iscritto','rinnovo','trial_to_member','modifica_dati','iscrizione_corso','acquisto_carnet','acquisto_eventi','altro']).notNull(),
  status: mysqlEnum("status", ['bozza','in_compilazione','in_pagamento','completato','annullato']).notNull().default('bozza'),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  paymentGroupId: varchar("payment_group_id", { length: 36 }),
  tenantId: varchar("tenant_id", { length: 50 }).notNull().default('1'),
  extraData: json("extra_data")
});

export const dossierSteps = mysqlTable("dossier_steps", {
  id: int("id").primaryKey().autoincrement(),
  dossierId: int("dossier_id").notNull(),
  stepName: mysqlEnum("step_name", ['anagrafica','tutori','certificato_medico','documenti','pagamento','tesseramento','iscrizione_attivita']).notNull(),
  status: mysqlEnum("status", ['pending','completed','blocked','skipped']).notNull().default('pending'),
  completedAt: timestamp("completed_at"),
  blockingReason: text("blocking_reason"),
  completedBy: varchar("completed_by", { length: 255 }),
  tenantId: varchar("tenant_id", { length: 50 }).notNull().default('1')
});

export const dossierAuditLog = mysqlTable("dossier_audit_log", {
  id: int("id").primaryKey().autoincrement(),
  dossierId: int("dossier_id").notNull(),
  action: mysqlEnum("action", ['created','step_completed','step_blocked','status_changed','annullato','completed']).notNull(),
  performedBy: varchar("performed_by", { length: 255 }),
  performedAt: timestamp("performed_at").defaultNow(),
  details: json("details"),
  tenantId: varchar("tenant_id", { length: 50 }).notNull().default('1')
});

export const externalPayers = mysqlTable("external_payers", {
  id: int("id").primaryKey().autoincrement(),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  fiscalCode: varchar("fiscal_code", { length: 20 }),
  vatNumber: varchar("vat_number", { length: 20 }),
  address: text("address"),
  notes: text("notes"),
  tenantId: varchar("tenant_id", { length: 50 }).notNull().default('1'),
  createdAt: timestamp("created_at").defaultNow()
});

export const societies = mysqlTable("societies", {
  id: int("id").primaryKey().autoincrement(),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  fiscalCode: varchar("fiscal_code", { length: 20 }),
  vatNumber: varchar("vat_number", { length: 20 }),
  address: text("address"),
  isWelfareProvider: boolean("is_welfare_provider").default(false),
  welfareFormula: mysqlEnum("welfare_formula", ['sconto','pacchetto_prepagato','tessera_collettiva','voucher_esterno','mix']),
  voucherProvider: varchar("voucher_provider", { length: 100 }),
  billingFrequency: mysqlEnum("billing_frequency", ['mensile','trimestrale','annuale','on_demand']),
  active: boolean("active").default(true),
  tenantId: varchar("tenant_id", { length: 50 }).notNull().default('1'),
  createdAt: timestamp("created_at").defaultNow()
});

export const paymentParticipants = mysqlTable("payment_participants", {
  id: int("id").primaryKey().autoincrement(),
  paymentId: int("payment_id").notNull(),
  memberId: int("member_id").notNull(),
  activityType: mysqlEnum("activity_type", ['corso','tesseramento','lezione_individuale','workshop','campus','affitto','merchandising','altro']).notNull(),
  activityId: int("activity_id"),
  amountAttributed: decimal("amount_attributed", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  tenantId: varchar("tenant_id", { length: 50 }).notNull().default('1'),
  createdAt: timestamp("created_at").defaultNow()
});

export const importBatches = mysqlTable("import_batches", {
  batchId: varchar("batch_id", { length: 36 }).primaryKey(),
  startedAt: timestamp("started_at").defaultNow(),
  totalChunks: int("total_chunks").notNull(),
  completedChunks: int("completed_chunks").default(0),
  recordsImported: int("records_imported").default(0),
  recordsSkipped: int("records_skipped").default(0),
  recordsUpdated: int("records_updated").default(0),
  errorsLog: json("errors_log")
});

export type Dossier = typeof dossiers.$inferSelect;
export type DossierStep = typeof dossierSteps.$inferSelect;
export type ExternalPayer = typeof externalPayers.$inferSelect;
export type Society = typeof societies.$inferSelect;
`;
  schema = schema + "\n" + code;
}

// Missing payments columns
const paymentCols = `
  payerId: int("payer_id"),
  payerType: mysqlEnum("payer_type", ['member','society','external']),
  billingSubjectId: int("billing_subject_id"),
  billingSubjectType: mysqlEnum("billing_subject_type", ['member','society','external']),
  documentType: mysqlEnum("document_type", ['ricevuta_istituzionale','fattura','booking_only','gift_card']).default('ricevuta_istituzionale'),
  paymentGroupId: varchar("payment_group_id", { length: 36 }),
  giftCardAmount: decimal("gift_card_amount", { precision: 10, scale: 2 }).default('0'),
  balanceAmount: decimal("balance_amount", { precision: 10, scale: 2 }).default('0'),
`;
if (!schema.includes('payerId: int("payer_id")')) {
  schema = schema.replace(
    /export const payments = mysqlTable\("payments", \{/,
    `export const payments = mysqlTable("payments", {\n${paymentCols}`
  );
}

fs.writeFileSync('shared/schema.ts', schema);
console.log("schema fixed");
