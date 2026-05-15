const fs = require('fs');
let schema = fs.readFileSync('shared/schema.ts', 'utf8');

// remove my new fields from fix_schema.cjs to avoid duplicates
schema = schema.replace(/legacyAthenaId: varchar\("legacy_athena_id", \{ length: 50 \}\),/g, '');
schema = schema.replace(/legacyMasterId: varchar\("legacy_master_id", \{ length: 50 \}\),/g, '');
schema = schema.replace(/tutor1FirstName: varchar\("tutor1_first_name", \{ length: 100 \}\),/g, '');
schema = schema.replace(/tutor1LastName: varchar\("tutor1_last_name", \{ length: 100 \}\),/g, '');
schema = schema.replace(/tutor1FiscalCode: varchar\("tutor1_fiscal_code", \{ length: 20 \}\),/g, '');
schema = schema.replace(/importedLotto: varchar\("imported_lotto", \{ length: 50 \}\),/g, '');
schema = schema.replace(/importedSourceRowIndex: int\("imported_source_row_index"\),/g, '');
schema = schema.replace(/importedBy: varchar\("imported_by", \{ length: 50 \}\),/g, '');
schema = schema.replace(/importedAt: timestamp\("imported_at"\),/g, '');
schema = schema.replace(/dataQualityFlag: json\("data_quality_flag"\),/g, '');
schema = schema.replace(/extraData: json\("extra_data"\),/g, '');

// but re-add them once correctly!
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
  attachmentsUrl: text("attachments_url"),
`;

schema = schema.replace(
  /export const members = mysqlTable\("members", \{/,
  `export const members = mysqlTable("members", {\n${membersCols}`
);

// and team_employees
const teamCols = `
  avatarUrl: varchar("avatar_url", { length: 500 }),
`;
if (!schema.includes('avatarUrl')) {
  schema = schema.replace(
    /export const teamEmployees = mysqlTable\("team_employees", \{/,
    `export const teamEmployees = mysqlTable("team_employees", {\n${teamCols}`
  );
}

fs.writeFileSync('shared/schema.ts', schema);
console.log("schema fixed 2");
