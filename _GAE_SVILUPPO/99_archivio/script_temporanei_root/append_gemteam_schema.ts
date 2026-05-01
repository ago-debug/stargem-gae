import fs from "fs";
import path from "path";

const code = `
// ============================================================================
// GEMTEAM MODULE
// ============================================================================

export const teamEmployees = mysqlTable("team_employees", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").notNull().references(() => members.id, { onDelete: "restrict" }),
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  team: mysqlEnum("team", ["segreteria","ass_manutenzione","ufficio","amministrazione","comunicazione"]).notNull(),
  tariffaOraria: decimal("tariffa_oraria", { precision: 5, scale: 2 }),
  stipendioFissoMensile: decimal("stipendio_fisso_mensile", { precision: 8, scale: 2 }),
  dataAssunzione: date("data_assunzione"),
  attivo: boolean("attivo").notNull().default(true),
  noteHr: text("note_hr"),
  createdAt: datetime("created_at").defaultNow(),
  updatedAt: datetime("updated_at").defaultNow().onUpdateNow(),
}, (t) => [
  index("idx_team").on(t.team),
  index("idx_attivo").on(t.attivo),
]);

export const teamShiftTemplates = mysqlTable("team_shift_templates", {
  id: int("id").primaryKey().autoincrement(),
  employeeId: int("employee_id").notNull().references(() => teamEmployees.id, { onDelete: "cascade" }),
  settimanaTipo: mysqlEnum("settimana_tipo", ["A","B","C","D","E"]).notNull(),
  giornoSettimana: tinyint("giorno_settimana").notNull(),
  oraInizio: time("ora_inizio").notNull(),
  oraFine: time("ora_fine").notNull(),
  postazione: mysqlEnum("postazione", ["RECEPTION","PRIMO","SECONDO","UFFICIO","AMM.ZIONE","PAUSA","RIPOSO","RIUNIONE","STUDIO_1","STUDIO_2","MALATTIA","PERMESSO"]).notNull(),
  note: text("note"),
  createdAt: datetime("created_at").defaultNow(),
}, (t) => [
  index("idx_settimana").on(t.settimanaTipo, t.giornoSettimana),
]);

export const teamScheduledShifts = mysqlTable("team_scheduled_shifts", {
  id: int("id").primaryKey().autoincrement(),
  employeeId: int("employee_id").notNull().references(() => teamEmployees.id, { onDelete: "cascade" }),
  data: date("data").notNull(),
  postazione: mysqlEnum("postazione", ["RECEPTION","PRIMO","SECONDO","UFFICIO","AMM.ZIONE","PAUSA","RIPOSO","RIUNIONE","STUDIO_1","STUDIO_2","MALATTIA","PERMESSO"]).notNull(),
  oraInizio: time("ora_inizio").notNull(),
  oraFine: time("ora_fine").notNull(),
  templateId: int("template_id").references(() => teamShiftTemplates.id, { onDelete: "set null" }),
  noteAdmin: text("note_admin"),
  createdBy: varchar("created_by", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  createdAt: datetime("created_at").defaultNow(),
  updatedAt: datetime("updated_at").defaultNow().onUpdateNow(),
}, (t) => [
  index("idx_data").on(t.data),
  index("idx_employee_data").on(t.employeeId, t.data),
]);

export const teamActivityTypes = mysqlTable("team_activity_types", {
  id: int("id").primaryKey().autoincrement(),
  team: mysqlEnum("team", ["segreteria","ass_manutenzione","tutti"]).notNull().default("tutti"),
  label: varchar("label", { length: 200 }).notNull(),
  categoria: varchar("categoria", { length: 50 }),
  attivo: boolean("attivo").notNull().default(true),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: datetime("created_at").defaultNow(),
});

export const teamShiftDiaryEntries = mysqlTable("team_shift_diary_entries", {
  id: int("id").primaryKey().autoincrement(),
  employeeId: int("employee_id").notNull().references(() => teamEmployees.id, { onDelete: "cascade" }),
  shiftId: int("shift_id").references(() => teamScheduledShifts.id, { onDelete: "set null" }),
  data: date("data").notNull(),
  oraSlot: time("ora_slot").notNull(),
  postazione: mysqlEnum("postazione", ["RECEPTION","PRIMO","SECONDO","UFFICIO","AMM.ZIONE","PAUSA","RIPOSO","RIUNIONE","STUDIO_1","STUDIO_2","MALATTIA","PERMESSO"]).notNull(),
  activityTypeId: int("activity_type_id").references(() => teamActivityTypes.id, { onDelete: "set null" }),
  attivitaLibera: varchar("attivita_libera", { length: 300 }),
  quantita: int("quantita"),
  minuti: smallint("minuti"),
  note: text("note"),
  okFlag: boolean("ok_flag").notNull().default(false),
  createdAt: datetime("created_at").defaultNow(),
}, (t) => [
  index("idx_employee_data").on(t.employeeId, t.data),
]);

export const teamAttendanceLogs = mysqlTable("team_attendance_logs", {
  id: int("id").primaryKey().autoincrement(),
  employeeId: int("employee_id").notNull().references(() => teamEmployees.id, { onDelete: "cascade" }),
  data: date("data").notNull(),
  oreLavorate: decimal("ore_lavorate", { precision: 4, scale: 2 }),
  tipoAssenza: mysqlEnum("tipo_assenza", ["FE","PE","ML","F","AI","AG","MT","IN"]),
  checkIn: datetime("check_in"),
  checkOut: datetime("check_out"),
  note: text("note"),
  modifiedByAdmin: varchar("modified_by_admin", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  modifiedAt: datetime("modified_at"),
  createdAt: datetime("created_at").defaultNow(),
}, (t) => [
  uniqueIndex("uq_employee_data").on(t.employeeId, t.data),
  index("idx_data").on(t.data),
]);

export const teamCheckinEvents = mysqlTable("team_checkin_events", {
  id: int("id").primaryKey().autoincrement(),
  employeeId: int("employee_id").notNull().references(() => teamEmployees.id, { onDelete: "cascade" }),
  timestamp: datetime("timestamp").notNull(),
  tipo: mysqlEnum("tipo", ["IN","OUT"]).notNull(),
  postazione: varchar("postazione", { length: 50 }),
  device: varchar("device", { length: 100 }),
  overrideAdmin: boolean("override_admin").notNull().default(false),
  note: text("note"),
}, (t) => [
  index("idx_employee_ts").on(t.employeeId, t.timestamp),
]);

export const teamLeaveRequests = mysqlTable("team_leave_requests", {
  id: int("id").primaryKey().autoincrement(),
  employeeId: int("employee_id").notNull().references(() => teamEmployees.id, { onDelete: "cascade" }),
  tipo: mysqlEnum("tipo", ["FE","PE","ML","altro"]).notNull(),
  dataInizio: date("data_inizio").notNull(),
  dataFine: date("data_fine").notNull(),
  oreTotali: decimal("ore_totali", { precision: 4, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending","approved","rejected"]).notNull().default("pending"),
  approvedBy: varchar("approved_by", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  approvedAt: datetime("approved_at"),
  noteDipendente: text("note_dipendente"),
  noteAdmin: text("note_admin"),
  createdAt: datetime("created_at").defaultNow(),
  updatedAt: datetime("updated_at").defaultNow().onUpdateNow(),
}, (t) => [
  index("idx_status").on(t.status),
  index("idx_employee").on(t.employeeId),
]);

export const teamHandoverNotes = mysqlTable("team_handover_notes", {
  id: int("id").primaryKey().autoincrement(),
  employeeId: int("employee_id").notNull().references(() => teamEmployees.id, { onDelete: "cascade" }),
  shiftId: int("shift_id").references(() => teamScheduledShifts.id, { onDelete: "set null" }),
  data: date("data").notNull(),
  postazione: mysqlEnum("postazione", ["RECEPTION","PRIMO","SECONDO","UFFICIO","AMM.ZIONE"]).notNull(),
  testo: text("testo").notNull(),
  priorita: mysqlEnum("priorita", ["low","medium","high"]).notNull().default("low"),
  lettaDa: json("letta_da"),
  createdAt: datetime("created_at").defaultNow(),
}, (t) => [
  index("idx_data").on(t.data),
  index("idx_postazione").on(t.postazione),
]);

export const teamMaintenanceTickets = mysqlTable("team_maintenance_tickets", {
  id: int("id").primaryKey().autoincrement(),
  employeeId: int("employee_id").notNull().references(() => teamEmployees.id, { onDelete: "cascade" }),
  studioNumero: varchar("studio_numero", { length: 10 }).notNull(),
  titolo: varchar("titolo", { length: 200 }).notNull(),
  descrizione: text("descrizione"),
  status: mysqlEnum("status", ["open","in_progress","closed"]).notNull().default("open"),
  fotoUrl: varchar("foto_url", { length: 500 }),
  risoltoDa: varchar("risolto_da", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  risoltoAt: datetime("risolto_at"),
  createdAt: datetime("created_at").defaultNow(),
  updatedAt: datetime("updated_at").defaultNow().onUpdateNow(),
}, (t) => [
  index("idx_status").on(t.status),
  index("idx_studio").on(t.studioNumero),
]);

export const teamMonthlyReports = mysqlTable("team_monthly_reports", {
  id: int("id").primaryKey().autoincrement(),
  employeeId: int("employee_id").notNull().references(() => teamEmployees.id, { onDelete: "cascade" }),
  anno: int("anno").notNull(), // YEAR mapped to int
  mese: tinyint("mese").notNull(),
  oreTotali: decimal("ore_totali", { precision: 6, scale: 2 }).notNull().default("0"),
  giorniLavorati: tinyint("giorni_lavorati").notNull().default(0),
  stipendioFisso: decimal("stipendio_fisso", { precision: 8, scale: 2 }),
  oreExtraPos: decimal("ore_extra_pos", { precision: 5, scale: 2 }).notNull().default("0"),
  oreExtraNeg: decimal("ore_extra_neg", { precision: 5, scale: 2 }).notNull().default("0"),
  importoExtra: decimal("importo_extra", { precision: 8, scale: 2 }),
  cntFE: tinyint("cnt_FE").notNull().default(0),
  cntPE: tinyint("cnt_PE").notNull().default(0),
  cntML: tinyint("cnt_ML").notNull().default(0),
  cntF: tinyint("cnt_F").notNull().default(0),
  cntAI: tinyint("cnt_AI").notNull().default(0),
  cntAG: tinyint("cnt_AG").notNull().default(0),
  cntMT: tinyint("cnt_MT").notNull().default(0),
  cntIN: tinyint("cnt_IN").notNull().default(0),
  exportAt: datetime("export_at"),
  locked: boolean("locked").notNull().default(false),
  createdAt: datetime("created_at").defaultNow(),
  updatedAt: datetime("updated_at").defaultNow().onUpdateNow(),
}, (t) => [
  uniqueIndex("uq_employee_mese").on(t.employeeId, t.anno, t.mese),
]);

export const teamProfileChangeRequests = mysqlTable("team_profile_change_requests", {
  id: int("id").primaryKey().autoincrement(),
  employeeId: int("employee_id").notNull().references(() => teamEmployees.id, { onDelete: "cascade" }),
  campoModificato: varchar("campo_modificato", { length: 100 }).notNull(),
  valoreVecchio: text("valore_vecchio"),
  valoreNuovo: text("valore_nuovo").notNull(),
  motivazione: text("motivazione"),
  status: mysqlEnum("status", ["pending","approved","rejected"]).notNull().default("pending"),
  requestedAt: datetime("requested_at").defaultNow(),
  reviewedBy: varchar("reviewed_by", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  reviewedAt: datetime("reviewed_at"),
  noteAdmin: text("note_admin"),
}, (t) => [
  index("idx_status").on(t.status),
]);

export const teamDocuments = mysqlTable("team_documents", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  tipo: mysqlEnum("tipo", ["carta_identita","codice_fiscale","permesso_soggiorno","patente","certificato_medico","diploma","contratto","busta_paga","report_mensile","comunicazione","altro"]).notNull(),
  titolo: varchar("titolo", { length: 200 }).notNull(),
  caricatoDa: mysqlEnum("caricato_da", ["employee","admin"]).notNull(),
  visibileDipendente: boolean("visibile_dipendente").notNull().default(true),
  isCurrent: boolean("is_current").notNull().default(true),
  scadenza: date("scadenza"),
  createdAt: datetime("created_at").defaultNow(),
}, (t) => [
  index("idx_member").on(t.memberId),
  index("idx_scadenza").on(t.scadenza),
]);

export const teamDocumentVersions = mysqlTable("team_document_versions", {
  id: int("id").primaryKey().autoincrement(),
  documentId: int("document_id").notNull().references(() => teamDocuments.id, { onDelete: "cascade" }),
  versioneNumero: tinyint("versione_numero").notNull().default(1),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  fileName: varchar("file_name", { length: 200 }).notNull(),
  fileSize: int("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  hashFile: varchar("hash_file", { length: 64 }),
  uploadedBy: varchar("uploaded_by", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  uploadedAt: datetime("uploaded_at").defaultNow(),
  noteVersione: text("note_versione"),
});

export const teamDocumentAlerts = mysqlTable("team_document_alerts", {
  id: int("id").primaryKey().autoincrement(),
  documentId: int("document_id").references(() => teamDocuments.id, { onDelete: "cascade" }),
  employeeId: int("employee_id").notNull().references(() => teamEmployees.id, { onDelete: "cascade" }),
  tipo: mysqlEnum("tipo", ["scadenza","mancante","aggiornamento_richiesto"]).notNull(),
  dataAlert: date("data_alert").notNull(),
  inviatoAt: datetime("inviato_at"),
  risolto: boolean("risolto").notNull().default(false),
  createdAt: datetime("created_at").defaultNow(),
}, (t) => [
  index("idx_data_alert").on(t.dataAlert),
  index("idx_risolto").on(t.risolto),
]);

export const teamEmployeeActivityLog = mysqlTable("team_employee_activity_log", {
  id: int("id").primaryKey().autoincrement(),
  employeeId: int("employee_id").notNull().references(() => teamEmployees.id, { onDelete: "cascade" }),
  eseguitaDa: varchar("eseguita_da", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  azione: varchar("azione", { length: 100 }).notNull(),
  entitaModificata: varchar("entita_modificata", { length: 50 }),
  entitaId: int("entita_id"),
  valorePrima: text("valore_prima"),
  valoreDopo: text("valore_dopo"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: datetime("created_at").defaultNow(),
}, (t) => [
  index("idx_employee").on(t.employeeId),
  index("idx_created").on(t.createdAt),
]);

`;

const targetPath = path.join(process.cwd(), "shared/schema.ts");
fs.appendFileSync(targetPath, code);
console.log("Schema GemTeam aggiunto a shared/schema.ts");
