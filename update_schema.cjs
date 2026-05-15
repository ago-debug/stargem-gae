const fs = require('fs');

let schema = fs.readFileSync('shared/schema.ts', 'utf8');

// Aggiungiamo i campi a members
const membersInsert = `
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

schema = schema.replace(
  /export const members = mysqlTable\("members", \{/,
  `export const members = mysqlTable("members", {\n${membersInsert}`
);

// Aggiungiamo la tabella import_batches
const importBatchesInsert = `
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
`;

schema = schema + "\n" + importBatchesInsert;

fs.writeFileSync('shared/schema.ts', schema);
console.log("Updated schema.ts");
