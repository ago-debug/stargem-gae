import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  int,
  decimal,
  boolean,
  json,
  index,
  date,
  datetime,
  longtext,
  mysqlEnum,
  tinyint,
  smallint,
  time,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// AUTH TABLES (Required for Replit Auth - from javascript_log_in_with_replit blueprint)
// ============================================================================

export const sessions = mysqlTable(
  "sessions",
  {
    sid: varchar("sid", { length: 128 }).primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: varchar("username", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 50 }),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  role: varchar("role", { length: 50 }).notNull().default("operator"),
  profileImageUrl: longtext("profile_image_url"),
  lastSeenAt: timestamp("last_seen_at"),
  currentSessionStart: timestamp("current_session_start"),
  lastSessionDuration: int("last_session_duration").default(0),
  emailVerified: boolean("email_verified").notNull().default(false),
  otpToken: varchar("otp_token", { length: 10 }),
  otpExpiresAt: datetime("otp_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const userSessionSegments = mysqlTable("user_session_segments", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  lastHeartbeatAt: timestamp("last_heartbeat_at"),
  endedAt: timestamp("ended_at"),
  tipo: mysqlEnum("tipo", ["online", "pausa"]).notNull().default("online"),
  durataMinuti: int("durata_minuti"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_user_date").on(table.userId, table.startedAt),
  index("idx_tipo").on(table.tipo),
  index("idx_ended").on(table.endedAt),
]);

export const userRoles = mysqlTable("user_roles", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  permissions: json("permissions").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type UserRole = typeof userRoles.$inferSelect;

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertUserSelect = typeof users.$inferSelect;

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const messages = mysqlTable("messages", {
  id: int("id").primaryKey().autoincrement(),
  senderId: varchar("sender_id", { length: 50 }).notNull(),
  receiverId: varchar("receiver_id", { length: 50 }).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
}));

export const insertMessageSchema = createInsertSchema(messages);
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// ============================================================================
// LOCATION TABLES (Countries, Provinces, Cities with CAP)
// ============================================================================

// Countries (Stati)
export const countries = mysqlTable("countries", {
  id: int("id").primaryKey().autoincrement(),
  code: varchar("code", { length: 3 }).notNull().unique(), // ISO 3166-1 alpha-2/3 code (IT, DE, FR)
  name: varchar("name", { length: 100 }).notNull(),
  isDefault: boolean("is_default").default(false),
});

export const insertCountrySchema = createInsertSchema(countries).omit({ id: true });
export type InsertCountry = z.infer<typeof insertCountrySchema>;
export type Country = typeof countries.$inferSelect;

// Provinces (Province italiane)
export const provinces = mysqlTable("provinces", {
  id: int("id").primaryKey().autoincrement(),
  code: varchar("code", { length: 2 }).notNull(), // Sigla provincia (MI, RM, TO)
  name: varchar("name", { length: 100 }).notNull(),
  region: varchar("region", { length: 100 }), // Regione
  countryId: int("country_id").references(() => countries.id, { onDelete: "cascade" }),
});

export const provincesRelations = relations(provinces, ({ one, many }) => ({
  country: one(countries, {
    fields: [provinces.countryId],
    references: [countries.id],
  }),
  cities: many(cities),
}));

export const insertProvinceSchema = createInsertSchema(provinces).omit({ id: true });
export type InsertProvince = z.infer<typeof insertProvinceSchema>;
export type Province = typeof provinces.$inferSelect;

// Cities (Comuni italiani con CAP)
export const cities = mysqlTable("cities", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  provinceId: int("province_id").references(() => provinces.id, { onDelete: "cascade" }),
  postalCode: varchar("postal_code", { length: 10 }), // CAP principale
  istatCode: varchar("istat_code", { length: 10 }), // Codice ISTAT
});

export const citiesRelations = relations(cities, ({ one }) => ({
  province: one(provinces, {
    fields: [cities.provinceId],
    references: [provinces.id],
  }),
}));

export const insertCitySchema = createInsertSchema(cities).omit({ id: true });
export type InsertCity = z.infer<typeof insertCitySchema>;
export type City = typeof cities.$inferSelect;

// ============================================================================
// CUSTOM LISTS (Elenchi Semplici)
// ============================================================================

export const customLists = mysqlTable("custom_lists", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  systemName: varchar("system_name", { length: 100 }).unique().notNull(), // e.g., 'course_names'
  systemCode: varchar("system_code", { length: 50 }),
  description: text("description"),
  linkedActivities: json("linked_activities").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customListItems = mysqlTable("custom_list_items", {
  id: int("id").primaryKey().autoincrement(),
  listId: int("list_id").references(() => customLists.id, { onDelete: "cascade" }),
  value: varchar("value", { length: 255 }).notNull(), // The actual string value (e.g., 'Yoga Base')
  sortOrder: int("sort_order").default(0),
  active: boolean("active").default(true),
  color: varchar("color", { length: 7 }),
});

export const customListsRelations = relations(customLists, ({ many }) => ({
  items: many(customListItems),
}));

export const customListItemsRelations = relations(customListItems, ({ one }) => ({
  list: one(customLists, {
    fields: [customListItems.listId],
    references: [customLists.id],
  }),
}));

export const insertCustomListSchema = createInsertSchema(customLists).omit({ id: true, createdAt: true });
export type InsertCustomList = z.infer<typeof insertCustomListSchema>;
export type CustomList = typeof customLists.$inferSelect;

export const insertCustomListItemSchema = createInsertSchema(customListItems).omit({ id: true });
export type InsertCustomListItem = z.infer<typeof insertCustomListItemSchema>;
export type CustomListItem = typeof customListItems.$inferSelect;

// ============================================================================
// CORE TABLES
// ============================================================================

// Categories (hierarchical structure)


// Workshop Categories (separate category system for workshops)












// Vacation Study Categories (hierarchical structure for vacation study programs)


// Client Categories (hierarchical structure for client classification)


// Subscription Types (Tipo Iscrizione)
export const subscriptionTypes = mysqlTable("sub_types", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubscriptionTypeSchema = createInsertSchema(subscriptionTypes).omit({
  id: true,
  createdAt: true,
});
export type InsertSubscriptionType = z.infer<typeof insertSubscriptionTypeSchema>;
export type SubscriptionType = typeof subscriptionTypes.$inferSelect;

// Instructor Types (Aliased to Member for backward compatibility)
export type InsertInstructor = Partial<InsertMember>;
export type Instructor = Member;

// Activity Statuses (Stati attività)
export const activityStatuses = mysqlTable("act_statuses", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 50 }),
  sortOrder: int("sort_order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivityStatusSchema = createInsertSchema(activityStatuses).omit({
  id: true,
  createdAt: true,
});
export type InsertActivityStatus = z.infer<typeof insertActivityStatusSchema>;
export type ActivityStatus = typeof activityStatuses.$inferSelect;

// Payment Notes (Note pagamenti)
export const paymentNotes = mysqlTable("pay_notes", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 50 }),
  sortOrder: int("sort_order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentNoteSchema = createInsertSchema(paymentNotes).omit({
  id: true,
  createdAt: true,
});
export type InsertPaymentNote = z.infer<typeof insertPaymentNoteSchema>;
export type PaymentNote = typeof paymentNotes.$inferSelect;

// Enrollment Details (dettaglio iscrizione)
export const enrollmentDetails = mysqlTable("enroll_details", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 50 }),
  sortOrder: int("sort_order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEnrollmentDetailSchema = createInsertSchema(enrollmentDetails).omit({
  id: true,
  createdAt: true,
});
export type InsertEnrollmentDetail = z.infer<typeof insertEnrollmentDetailSchema>;
export type EnrollmentDetail = typeof enrollmentDetails.$inferSelect;

// Participant Types (Tipi Partecipante)
export const participantTypes = mysqlTable("participant_types", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 50 }),
  sortOrder: int("sort_order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertParticipantTypeSchema = createInsertSchema(participantTypes).omit({
  id: true,
  createdAt: true,
});
export type InsertParticipantType = z.infer<typeof insertParticipantTypeSchema>;
export type ParticipantType = typeof participantTypes.$inferSelect;

// Studios (sale/studi)
export const studios = mysqlTable("studios", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  floor: varchar("floor", { length: 50 }), // Piano
  operatingHours: json("operating_hours"), // JSON: {"monday": {"start": "09:00", "end": "21:00"}, ...}
  operatingDays: json("operating_days"), // JSON: ["monday", "tuesday", ...]
  capacity: int("capacity"), // Capienza
  equipment: text("equipment"), // Attrezzature (lista separata da virgole o JSON)
  notes: text("notes"),
  active: boolean("active").default(true),
  googleCalendarId: varchar("google_calendar_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStudioSchema = createInsertSchema(studios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertStudio = z.infer<typeof insertStudioSchema>;
export type Studio = typeof studios.$inferSelect;

// Courses
export const courses = mysqlTable("courses", {
  id: int("id").primaryKey().autoincrement(),
  sku: varchar("sku", { length: 100 }), // SKU univoco (es: 2526-NEMBRI-LUN-15) - unique constraint da aggiungere dopo
  name: varchar("name", { length: 255 }).notNull(),
  activityType: varchar("activity_type", { length: 50 }),
  description: text("description"),
  categoryId: int("category_id"),
  studioId: int("studio_id").references(() => studios.id, { onDelete: "set null" }), // Studio/sala
  instructorId: int("instructor_id").references(() => members.id, { onDelete: "set null" }), // Insegnante primario
  secondaryInstructor1Id: int("secondary_instructor1_id").references(() => members.id, { onDelete: "set null" }), // Insegnante secondario 1

  price: decimal("price", { precision: 10, scale: 2 }),
  maxCapacity: int("max_capacity"),
  currentEnrollment: int("current_enrollment").default(0),
  // Campi orario strutturati (nuovo sistema con dropdown)
  dayOfWeek: varchar("day_of_week", { length: 20 }), // lunedì, martedì, mercoledì, giovedì, venerdì, sabato, domenica
  startTime: varchar("start_time", { length: 10 }), // formato HH:MM (es: "15:00")
  endTime: varchar("end_time", { length: 10 }), // formato HH:MM (es: "16:30")
  recurrenceType: varchar("recurrence_type", { length: 20 }), // settimanale, bisettimanale, mensile, personalizzata
  schedule: text("schedule"), // JSON: {day: "LUN", startTime: "15:00", endTime: "16:30", repeat: "weekly"} - legacy
  startDate: date("start_date"),
  endDate: date("end_date"),
  totalOccurrences: int("total_occurrences"),
  activeOnHolidays: tinyint('active_on_holidays').notNull().default(0),
  level: varchar("level", { length: 100 }), // Livello (es. Base, Intermedio, Avanzato)
  ageGroup: varchar("age_group", { length: 100 }), // Fascia d'età (es. Bambini 3-5 anni)
  lessonType: json("lesson_type").$type<string[]>().default([]), // Tipologia Multipla (es. [Preparazione Gara, Tecnica])
  numberOfPeople: varchar("number_of_people", { length: 50 }), // Numero Persone
  statusTags: json("status_tags").$type<string[]>().default([]),
  internalTags: json("internal_tags").$type<string[]>().default([]),
  active: boolean("active").default(true),
  googleEventId: varchar("google_event_id", { length: 255 }),
  seasonId: int("season_id").references(() => seasons.id, { onDelete: "set null" }),
  quoteId: int("quote_id").references(() => quotes.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const coursesRelations = relations(courses, ({ one, many }) => ({
  studio: one(studios, {
    fields: [courses.studioId],
    references: [studios.id],
  }),
  quote: one(quotes, {
    fields: [courses.quoteId],
    references: [quotes.id],
  }),
  instructor: one(members, {
    fields: [courses.instructorId],
    references: [members.id],
  }),
  secondaryInstructor1: one(members, {
    fields: [courses.secondaryInstructor1Id],
    references: [members.id],
  }),
  enrollments: many(enrollments),
  priceItems: many(priceListItems),
}));

export const studiosRelations = relations(studios, ({ many }) => ({
  courses: many(courses),
}));

export const insertCourseSchema = createInsertSchema(courses, {
  startDate: z.coerce.date().nullish(),
  endDate: z.coerce.date().nullish(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

// ============================================================================
// WORKSHOPS (identical structure to courses)
// ============================================================================



// ============================================================================
// PAID TRIALS (identical structure to workshops, uses categories)
// ============================================================================



// ============================================================================
// FREE TRIALS (identical structure to workshops, uses categories)
// ============================================================================



// ============================================================================
// SINGLE LESSONS (identical structure to workshops, uses categories)
// ============================================================================



// ============================================================================
// CAMPUS ACTIVITIES (identical structure to workshops, uses campusCategories)
// ============================================================================



// ============================================================================
// VACATION STUDIES (identical structure to workshops, uses vacationCategories)
// ============================================================================



// Members (iscritti)
export const members = mysqlTable("members", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  fiscalCode: varchar('fiscal_code', { length: 16 }).unique(), // Codice fiscale
  dateOfBirth: date("date_of_birth"),
  placeOfBirth: varchar("place_of_birth", { length: 255 }), // Luogo di nascita
  birthProvince: varchar("birth_province", { length: 2 }),
  gender: varchar("gender", { length: 1 }), // M = Maschio, F = Femmina
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }), // Telefono fisso
  mobile: varchar("mobile", { length: 50 }), // Cellulare
  categoryId: int("category_id"), // Categoria partecipante (Tipologia Partecipante)
  subscriptionTypeId: int("subscription_type_id").references(() => subscriptionTypes.id, { onDelete: "set null" }), // Tipo Iscrizione

  // Dati tessera
  cardNumber: varchar("card_number", { length: 100 }), // Numero tessera
  cardIssueDate: date("card_issue_date"), // Data rilascio tessera
  cardExpiryDate: date("card_expiry_date"), // Scadenza tessera

  // Tessera ente (CSEN, ACSI, AICS, etc.)
  entityCardType: varchar("entity_card_type", { length: 50 }), // Tipo ente (CSEN, ACSI, AICS, etc.)
  entityCardNumber: varchar("entity_card_number", { length: 100 }), // Numero tessera ente
  entityCardIssueDate: date("entity_card_issue_date"), // Data rilascio tessera ente
  entityCardExpiryDate: date("entity_card_expiry_date"), // Scadenza tessera ente

  // Certificato medico
  hasMedicalCertificate: boolean("has_medical_certificate").default(false), // Flag certificato medico
  medicalCertificateExpiry: date("medical_certificate_expiry"), // Scadenza certificato medico

  // Flag minorenne
  isMinor: boolean("is_minor").default(false), // Se il partecipante è minorenne

  // Dati genitori (per minorenni)
  motherFirstName: varchar("mother_first_name", { length: 255 }), // Nome madre
  motherLastName: varchar("mother_last_name", { length: 255 }), // Cognome madre
  motherFiscalCode: varchar("mother_fiscal_code", { length: 16 }), // Codice fiscale madre
  motherEmail: varchar("mother_email", { length: 255 }), // Email madre
  motherPhone: varchar("mother_phone", { length: 50 }), // Telefono madre
  motherMobile: varchar("mother_mobile", { length: 50 }), // Cellulare madre
  motherBirthDate: date("mother_birth_date"),
  motherBirthPlace: varchar("mother_birth_place", { length: 255 }),
  motherBirthProvince: varchar("mother_birth_province", { length: 2 }),
  motherStreetAddress: varchar("mother_street_address", { length: 255 }),
  motherCity: varchar("mother_city", { length: 100 }),
  motherProvince: varchar("mother_province", { length: 2 }),
  motherPostalCode: varchar("mother_postal_code", { length: 10 }),

  fatherFirstName: varchar("father_first_name", { length: 255 }), // Nome padre
  fatherLastName: varchar("father_last_name", { length: 255 }), // Cognome padre
  fatherFiscalCode: varchar("father_fiscal_code", { length: 16 }), // Codice fiscale padre
  fatherEmail: varchar("father_email", { length: 255 }), // Email padre
  fatherPhone: varchar("father_phone", { length: 50 }), // Telefono padre
  fatherMobile: varchar("father_mobile", { length: 50 }), // Cellulare padre
  fatherBirthDate: date("father_birth_date"),
  fatherBirthPlace: varchar("father_birth_place", { length: 255 }),
  fatherBirthProvince: varchar("father_birth_province", { length: 2 }),
  fatherStreetAddress: varchar("father_street_address", { length: 255 }),
  fatherCity: varchar("father_city", { length: 100 }),
  fatherProvince: varchar("father_province", { length: 2 }),
  fatherPostalCode: varchar("father_postal_code", { length: 10 }),

  photoUrl: text("photo_url"), // Consider a manual ALTER to LONGTEXT if needed

  // Registration info
  season: varchar("season", { length: 50 }),
  internalId: varchar("internal_id", { length: 50 }),
  athenaId: varchar("athena_id", { length: 50 }), // Codice ID dal gestionale Athena
  insertionDate: date("insertion_date"),
  participantType: varchar("participant_type", { length: 50 }),
  fromWhere: varchar("from_where", { length: 255 }),
  teamSegreteria: varchar("team_segreteria", { length: 255 }),

  // Allegati flags/details
  detractionModelRequested: boolean("detraction_requested").default(false),
  detractionModelYear: varchar("detraction_year", { length: 4 }),
  schoolCreditsRequested: boolean("credits_requested").default(false),
  schoolCreditsYear: varchar("credits_year", { length: 20 }),
  tesserinoTecnicoNumber: varchar("tesserino_tecnico_number", { length: 100 }),
  tesserinoTecnicoIssueDate: date("tesserino_tecnico_date"),
  privacyAccepted: boolean("privacy_accepted").default(false),
  regulationsAccepted: boolean("regulations_accepted").default(false),
  membershipApplicationSigned: boolean("membership_application_signed").default(false),
  attachmentMetadata: json("attachment_metadata"),
  giftMetadata: json("gift_metadata"),
  tessereMetadata: json("tessere_metadata"),
  certificatoMedicoMetadata: json("certificato_medico_metadata"),

  // Indirizzo suddiviso

  city: varchar("city", { length: 100 }), // Città
  province: varchar("province", { length: 2 }), // Provincia (sigla 2 lettere)
  postalCode: varchar("postal_code", { length: 10 }), // CAP
  country: varchar("country", { length: 100 }).default("Italia"), // Stato/Nazione

  address: text("address"), // Mantenuto per retrocompatibilità
  notes: text("notes"),
  previousMembershipNumber: varchar("previous_membership_number", { length: 50 }),
  dataQualityFlag: varchar("data_quality_flag", { length: 50 }),

  // ANAGRAFICA
  title: varchar("title", { length: 20 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  consentSms: boolean("consent_sms").default(false),
  fatturaFatta: boolean("fattura_fatta").default(false),
  emailPec: varchar("email_pec", { length: 255 }),
  familyCode: varchar("family_code", { length: 50 }),
  athenaGroup: varchar("athena_group", { length: 100 }),
  alias: varchar("alias", { length: 100 }),
  cancellationDate: date("cancellation_date"),

  // AZIENDA
  companyName: varchar("company_name", { length: 200 }),
  companyFiscalCode: varchar("company_fiscal_code", { length: 16 }),
  companyAddress: varchar("company_address", { length: 255 }),
  companyCap: varchar("company_cap", { length: 10 }),
  companyCity: varchar("company_city", { length: 100 }),
  companyProvince: varchar("company_province", { length: 10 }),
  companyPhone: varchar("company_phone", { length: 20 }),
  companyEmail: varchar("company_email", { length: 255 }),
  pIva: varchar("p_iva", { length: 20 }),

  // ALBO & PATENTE
  alboTipo: varchar("albo_tipo", { length: 50 }),
  alboSezione: varchar("albo_sezione", { length: 50 }),
  alboNumero: varchar("albo_numero", { length: 50 }),
  alboDataIscrizione: date("albo_data_iscrizione"),
  patenteTipo: varchar("patente_tipo", { length: 20 }),
  patenteRilasciataDa: varchar("patente_rilasciata_da", { length: 100 }),
  patenteScadenza: date("patente_scadenza"),
  carPlate: varchar("car_plate", { length: 20 }),

  // TUTOR 2 EXTRA
  tutor2FirstName: varchar("tutor2_first_name", { length: 100 }),
  tutor2LastName: varchar("tutor2_last_name", { length: 100 }),
  tutor2BirthDate: date("tutor2_birth_date"),
  tutor2BirthPlace: varchar("tutor2_birth_place", { length: 100 }),

  // DOCUMENTO
  documentIssuedBy: varchar("document_issued_by", { length: 100 }),
  documentIssueDate: date("document_issue_date"),

  // DATI BANCARI
  bankName: varchar("bank_name", { length: 100 }),
  iban: varchar("iban", { length: 34 }),

  // TAGLIE
  sizeShirt: varchar("size_shirt", { length: 10 }),
  sizePants: varchar("size_pants", { length: 10 }),
  sizeShoes: varchar("size_shoes", { length: 10 }),
  height: varchar("height", { length: 10 }),
  weight: varchar("weight", { length: 10 }),

  // SOCIAL
  socialFacebook: varchar("social_facebook", { length: 255 }),
  socialInstagram: varchar("social_instagram", { length: 255 }),
  socialTiktok: varchar("social_tiktok", { length: 255 }),
  socialYoutube: varchar("social_youtube", { length: 255 }),
  website: varchar("website", { length: 255 }),
  driveFolderUrl: varchar("drive_folder_url", { length: 500 }),

  // FORMAZIONE
  educationTitle: varchar("education_title", { length: 200 }),
  educationInstitute: varchar("education_institute", { length: 200 }),
  educationDate: date("education_date"),

  // EMERGENZA
  emergencyContact1Name: varchar("emergency_contact1_name", { length: 100 }),
  emergencyContact1Phone: varchar("emergency_contact1_phone", { length: 20 }),
  emergencyContact1Email: varchar("emergency_contact1_email", { length: 255 }),
  emergencyContact2Name: varchar("emergency_contact2_name", { length: 100 }),
  emergencyContact2Phone: varchar("emergency_contact2_phone", { length: 20 }),
  emergencyContact2Email: varchar("emergency_contact2_email", { length: 255 }),
  emergencyContact3Name: varchar("emergency_contact3_name", { length: 100 }),
  emergencyContact3Phone: varchar("emergency_contact3_phone", { length: 20 }),
  emergencyContact3Email: varchar("emergency_contact3_email", { length: 255 }),

  // ATHENA
  sedeRiferimento: varchar("sede_riferimento", { length: 100 }),
  athenaMemberType: varchar("athena_member_type", { length: 50 }),
  firstEnrollmentDate: date("first_enrollment_date"),
  consentCertificate: boolean("consent_certificate").default(false),
  consentModule: boolean("consent_module").default(false),
  codiceCatastale: varchar("codice_catastale", { length: 10 }),
  mastroC: varchar("mastro_c", { length: 30 }),
  mastroCol: varchar("mastro_col", { length: 30 }),
  codiceFe: varchar("codice_fe", { length: 50 }),


  // Campi Tutori (GDPR e minori)
  tutor1FiscalCode: varchar("tutor1_fiscal_code", { length: 16 }),
  tutor1BirthDate: date("tutor1_birth_date"),
  tutor1BirthPlace: varchar("tutor1_birth_place", { length: 100 }),
  tutor1Phone: varchar("tutor1_phone", { length: 20 }),
  tutor1Email: varchar("tutor1_email", { length: 255 }),
  tutor2FiscalCode: varchar("tutor2_fiscal_code", { length: 16 }),
  tutor2Phone: varchar("tutor2_phone", { length: 20 }),
  tutor2Email: varchar("tutor2_email", { length: 255 }),
  nationality: varchar("nationality", { length: 100 }),
  region: varchar("region", { length: 100 }),
  consentImage: boolean("consent_image").default(false),
  consentMarketing: boolean("consent_marketing").default(false),

  // Campi Insegnanti
  specialization: text("specialization"),
  bio: text("bio"),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),

  // CRM Profiling
  crmProfileLevel: varchar("crm_profile_level", { length: 20 }), // PLATINUM, GOLD, SILVER, or NONE
  crmProfileScore: int("crm_profile_score").default(0),
  crmProfileOverride: boolean("crm_profile_override").default(false),
  crmProfileReason: varchar("crm_profile_reason", { length: 255 }),

  // GemStaff fields
  staffStatus: mysqlEnum("staff_status", ["attivo", "inattivo", "archivio"]).notNull().default("attivo"),
  lezioniPrivateAutorizzate: boolean("lezioni_private_autorizzate").notNull().default(false),
  lezioniPrivateAutorizzateAt: datetime("lezioni_private_autorizzate_at"),
  lezioniPrivateAutorizzateBy: varchar("lezioni_private_autorizzate_by", { length: 100 }),
  lezioniPrivateNote: text("lezioni_private_note"),

  active: boolean("active").default(true),
  enrollmentStatus: mysqlEnum("enrollment_status", ["attivo", "non_attivo"]).default("non_attivo"),
  createdBy: varchar("created_by", { length: 255 }),
  updatedBy: varchar("updated_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),

  birthNation: varchar('birth_nation', { length: 100 }),
  secondaryEmail: varchar('secondary_email', { length: 255 }),
  profession: varchar('profession', { length: 100 }),
  documentType: varchar('document_type', { length: 50 }),
  documentExpiry: date('document_expiry'),
  privacyDate: date('privacy_date'),
  consentNewsletter: tinyint('consent_newsletter').default(0).notNull(),
  adminNotes: text('admin_notes'),
  healthNotes: text('health_notes'),
  foodAlerts: varchar('food_alerts', { length: 255 }),
  tags: varchar('tags', { length: 500 }),
  residencePermit: varchar('residence_permit', { length: 100 }),
  residencePermitExpiry: date('residence_permit_expiry'),
});

export const membersRelations = relations(members, ({ one, many }) => ({
  enrollments: many(enrollments),
  memberships: many(memberships),
  medicalCertificates: many(medicalCertificates),
  payments: many(payments),
  accessLogs: many(accessLogs),
  priceItems: many(priceListItems),
}));

export const insertMemberSchema = createInsertSchema(members, {
  dateOfBirth: z.coerce.date().nullish(),
  cardIssueDate: z.coerce.date().nullish(),
  cardExpiryDate: z.coerce.date().nullish(),
  entityCardIssueDate: z.coerce.date().nullish(),
  entityCardExpiryDate: z.coerce.date().nullish(),
  medicalCertificateExpiry: z.coerce.date().nullish(),
  motherBirthDate: z.coerce.date().nullish(),
  fatherBirthDate: z.coerce.date().nullish(),
  insertionDate: z.coerce.date().nullish(),
  tesserinoTecnicoIssueDate: z.coerce.date().nullish(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  active: z.boolean().optional(),
  hasMedicalCertificate: z.boolean().optional(),
  isMinor: z.boolean().optional(),
  privacyAccepted: z.boolean().optional(),
  regulationsAccepted: z.boolean().optional(),
  membershipApplicationSigned: z.boolean().optional(),
  attachmentMetadata: z.any().optional(),
  giftMetadata: z.any().optional(),
  tessereMetadata: z.any().optional(),
  certificatoMedicoMetadata: z.any().optional(),
});
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;

// ============================================================================
// DUPLICATE EXCLUSIONS
// ============================================================================

export const memberDuplicateExclusions = mysqlTable("member_duplicate_exclusions", {
  id: int("id").primaryKey().autoincrement(),
  memberId1: int("member_id_1").notNull(),
  memberId2: int("member_id_2").notNull(),
  excludedBy: varchar("excluded_by", { length: 255 }),
  excludedAt: timestamp("excluded_at").defaultNow(),
}, (table) => [
  index("idx_pair").on(table.memberId1, table.memberId2)
]);

// ============================================================================
// GEMSTAFF TABLES
// ============================================================================

export const staffContractsCompliance = mysqlTable("staff_contracts_compliance", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  docType: mysqlEnum("doc_type", ["diploma_tesserino", "carta_identita", "codice_fiscale", "permesso_soggiorno", "foto_id", "video_promo"]).notNull(),
  docValue: text("doc_value"),
  hasDoc: boolean("has_doc").notNull().default(false),
  expiresAt: date("expires_at"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => [
  index("idx_member_doc").on(table.memberId, table.docType)
]);

export const staffDocumentSignatures = mysqlTable("staff_document_signatures", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  docType: mysqlEnum("doc_type", ["regolamento_staff", "codice_disciplinare_staff"]).notNull(),
  docVersion: varchar("doc_version", { length: 10 }).notNull(),
  signedAt: datetime("signed_at").notNull(),
  signedBy: varchar("signed_by", { length: 100 }).notNull(),
  method: mysqlEnum("method", ["manual", "kiosk"]).notNull().default("manual"),
  notes: text("notes"),
}, (table) => [
  uniqueIndex("uk_member_doc_ver").on(table.memberId, table.docType, table.docVersion)
]);

export const staffDisciplinaryLog = mysqlTable("staff_disciplinary_log", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  eventType: mysqlEnum("event_type", ["richiamo_verbale", "ammonizione_scritta", "sospensione", "interruzione_rapporto"]).notNull(),
  eventDate: date("event_date").notNull(),
  description: text("description").notNull(),
  staffResponse: text("staff_response"),
  staffResponseAt: date("staff_response_at"),
  decision: text("decision"),
  resolvedAt: date("resolved_at"),
  createdBy: varchar("created_by", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const staffPresenze = mysqlTable("staff_presenze", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  courseId: int("course_id").references(() => courses.id, { onDelete: "set null" }),
  date: date("date").notNull(),
  hours: decimal("hours", { precision: 4, scale: 2 }).notNull().default("1.00"),
  source: mysqlEnum("source", ["auto", "manual"]).notNull().default("auto"),
  status: mysqlEnum("status", ["bozza", "confermato"]).notNull().default("bozza"),
  confirmedBy: varchar("confirmed_by", { length: 100 }),
  confirmedAt: datetime("confirmed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const staffSostituzioni = mysqlTable("staff_sostituzioni", {
  id: int("id").primaryKey().autoincrement(),
  absentMemberId: int("absent_member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  substituteMemberId: int("substitute_member_id").references(() => members.id, { onDelete: "set null" }),
  courseId: int("course_id").references(() => courses.id, { onDelete: "set null" }),
  absenceDate: date("absence_date").notNull(),
  lessonDescription: varchar("lesson_description", { length: 255 }),
  paymentTo: mysqlEnum("payment_to", ["assente", "sostituto", "nessuno"]).notNull().default("sostituto"),
  amountOverride: decimal("amount_override", { precision: 8, scale: 2 }),
  notes: text("notes"),
  vistoSegreteria: boolean("visto_segreteria").notNull().default(false),
  vistoElisa: boolean("visto_elisa").notNull().default(false),
  createdBy: varchar("created_by", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payslips = mysqlTable("payslips", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  month: tinyint("month").notNull(),
  year: smallint("year").notNull(),
  hoursTaught: decimal("hours_taught", { precision: 6, scale: 2 }).notNull().default("0.00"),
  rate: decimal("rate", { precision: 8, scale: 2 }),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0.00"),
  status: mysqlEnum("status", ["bozza", "confermato", "pagato"]).notNull().default("bozza"),
  notes: text("notes"),
  confirmedBy: varchar("confirmed_by", { length: 100 }),
  confirmedAt: datetime("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("uk_member_mese_anno").on(table.memberId, table.month, table.year)
]);

// ============================================================================

// Member Relationships (relazioni tra partecipanti - genitori/figli/tutori)
export const memberRelationships = mysqlTable("member_relationships", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").notNull().references(() => members.id, { onDelete: "cascade" }), // Il minorenne
  relatedMemberId: int("related_member_id").notNull().references(() => members.id, { onDelete: "cascade" }), // Il genitore/tutore
  relationshipType: varchar("relationship_type", { length: 50 }).notNull(), // 'mother', 'father', 'guardian'
  createdAt: timestamp("created_at").defaultNow(),
});

export const memberRelationshipsRelations = relations(memberRelationships, ({ one }) => ({
  member: one(members, {
    fields: [memberRelationships.memberId],
    references: [members.id],
    relationName: "childRelationships",
  }),
  relatedMember: one(members, {
    fields: [memberRelationships.relatedMemberId],
    references: [members.id],
    relationName: "guardianRelationships",
  }),
}));

export const insertMemberRelationshipSchema = createInsertSchema(memberRelationships).omit({
  id: true,
  createdAt: true,
});
export type InsertMemberRelationship = z.infer<typeof insertMemberRelationshipSchema>;
export type MemberRelationship = typeof memberRelationships.$inferSelect;

// Enrollments (iscrizioni ai corsi)
export const enrollments = mysqlTable("enrollments", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  courseId: int("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  participationType: varchar("participation_type", { length: 50 }).default("STANDARD_COURSE"), // 'STANDARD_COURSE', 'FREE_TRIAL', 'PAID_TRIAL', 'SINGLE_LESSON'
  sourceFile: varchar("source_file", { length: 50 }),
  targetDate: date("target_date"), // Riferimento temporale specifico per lezioni singole e prove
  status: varchar("status", { length: 50 }).notNull().default("active"), // 'active', 'waitlist', 'completed', 'cancelled'
  enrollmentDate: timestamp("enrollment_date").defaultNow(),
  notes: text("notes"),
  details: json("details").$type<string[]>().default([]),
  seasonId: int("season_id").references(() => seasons.id, { onDelete: "set null" }),
  onlineSource: boolean("online_source").default(false),
  pendingMedicalCert: boolean("pending_medical_cert").default(false),
  pendingMembership: boolean("pending_membership").default(false),
  completionNotes: text("completion_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  member: one(members, {
    fields: [enrollments.memberId],
    references: [members.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
  payments: many(payments),
}));

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrollmentDate: true,
  createdAt: true,
});
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

// Workshop Attendances (presenze ai workshop)



// Memberships (tessere associative)
// --- Member Packages (Lezioni Individuali) ---
export const memberPackages = mysqlTable("member_packages", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").notNull(),
  packageCode: varchar("package_code", { length: 50 }).notNull(), // Es: PAC-IND-001
  packageType: varchar("package_type", { length: 50 }).notNull(), // SINGOLA, COPPIA, GRUPPO
  totalUses: int("total_uses").notNull(), // numero totale ingressi
  usedUses: int("used_uses").notNull().default(0), // ingressi già scalati
  pricePaid: decimal("price_paid", { precision: 10, scale: 2 }), // costo pagato
  notes: text("notes"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const memberPackagesRelations = relations(memberPackages, ({ one }) => ({
  member: one(members, {
    fields: [memberPackages.memberId],
    references: [members.id],
  }),
}));

export const insertMemberPackageSchema = createInsertSchema(memberPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type MemberPackage = typeof memberPackages.$inferSelect;
export type InsertMemberPackage = z.infer<typeof insertMemberPackageSchema>;

export const memberships = mysqlTable("memberships", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  membershipNumber: varchar("membership_number", { length: 100 }).notNull().unique(),
  previousMembershipNumber: varchar("previous_membership_number", { length: 100 }),
  barcode: varchar("barcode", { length: 100 }).notNull().unique(),
  issueDate: date("issue_date").notNull(),
  expiryDate: date("expiry_date").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("active"), // 'active', 'expired', 'suspended'
  type: varchar("type", { length: 100 }), // 'annual', 'monthly', etc.
  fee: decimal("fee", { precision: 10, scale: 2 }),
  membershipType: varchar("membership_type", { length: 50 }), // 'NUOVO' or 'RINNOVO'
  seasonCompetence: varchar("season_competence", { length: 50 }), // 'CORRENTE' or 'SUCCESSIVA'
  seasonStartYear: int("season_start_year"), // Added by refactor
  seasonEndYear: int("season_end_year"), // Added by refactor
  seasonId: int("season_id").references(() => seasons.id), // Link to seasons table
  renewalType: varchar("renewal_type", { length: 50 }), // @deprecated - mantenuto temporaneamente per retrocompatibilità
  isRenewal: boolean("is_renewal").notNull().default(false),
  renewedFromId: int("renewed_from_id"),
  notes: text("notes"),
  dataQualityFlag: varchar("data_quality_flag", { length: 50 }),
  entityCardNumber: varchar("entity_card_number", { length: 100 }), 
  entityCardExpiryDate: date("entity_card_expiry_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const membershipsRelations = relations(memberships, ({ one }) => ({
  member: one(members, {
    fields: [memberships.memberId],
    references: [members.id],
  }),
}));

export const insertMembershipSchema = createInsertSchema(memberships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  seasonStartYear: true, // Server-side calculated
  seasonEndYear: true, // Server-side calculated
}).extend({
  membershipNumber: z.string().optional(), // Auto-generated by backend
  barcode: z.string().optional(), // Auto-generated by backend
  issueDate: z.coerce.date(),
  expiryDate: z.coerce.date(), // Reverted to not optional to fix server/storage.ts
  membershipType: z.enum(["NUOVO", "RINNOVO"]).optional(),
  seasonCompetence: z.enum(["CORRENTE", "SUCCESSIVA"]).optional(),
  isRenewal: z.boolean().optional(),
  renewedFromId: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type InsertMembership = z.infer<typeof insertMembershipSchema>;
export type Membership = typeof memberships.$inferSelect;

// Medical Certificates
export const medicalCertificates = mysqlTable("medical_certificates", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  issueDate: date("issue_date").notNull(),
  expiryDate: date("expiry_date").notNull(),
  doctorName: varchar("doctor_name", { length: 255 }),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).notNull().default("valid"), // 'valid', 'expired', 'pending'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const medicalCertificatesRelations = relations(medicalCertificates, ({ one }) => ({
  member: one(members, {
    fields: [medicalCertificates.memberId],
    references: [members.id],
  }),
}));

export const insertMedicalCertificateSchema = createInsertSchema(medicalCertificates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMedicalCertificate = z.infer<typeof insertMedicalCertificateSchema>;
export type MedicalCertificate = typeof medicalCertificates.$inferSelect;

// Access Logs (controllo accessi con barcode)
export const accessLogs = mysqlTable("access_logs", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").references(() => members.id, { onDelete: "set null" }),
  barcode: varchar("barcode", { length: 100 }).notNull(),
  accessTime: timestamp("access_time").defaultNow().notNull(),
  accessType: varchar("access_type", { length: 50 }).notNull().default("entry"), // 'entry', 'exit'
  membershipStatus: varchar("membership_status", { length: 50 }), // status at time of access
  notes: text("notes"),
});

export const accessLogsRelations = relations(accessLogs, ({ one }) => ({
  member: one(members, {
    fields: [accessLogs.memberId],
    references: [members.id],
  }),
}));

export const insertAccessLogSchema = createInsertSchema(accessLogs).omit({
  id: true,
  accessTime: true,
});
export type InsertAccessLog = z.infer<typeof insertAccessLogSchema>;
export type AccessLog = typeof accessLogs.$inferSelect;

// Payment Methods (Tipi di Pagamento)
export const paymentMethods = mysqlTable("payment_methods", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(), // Contanti, Carta di Credito, Bonifico, POS, etc.
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;

// Payments
export const payments = mysqlTable("payments", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").references(() => members.id, { onDelete: "set null" }),
  // Legacy Enrollment FKs (To be removed completely in Phase 3)
  enrollmentId: int("enrollment_id").references(() => enrollments.id, { onDelete: "cascade" }),
  
  // NEW STI Enrollment Bridge
  globalEnrollmentId: int("global_enrollment_id").references(() => globalEnrollments.id, { onDelete: "cascade" }),
  
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // 'course', 'membership', 'other'
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // 'pending', 'paid', 'overdue', 'cancelled'
  dueDate: date("due_date"),
  paidDate: date("paid_date"),
  paymentMethodId: int("payment_method_id").references(() => paymentMethods.id, { onDelete: "set null" }), // Riferimento a tabella payment_methods
  paymentMethod: varchar("payment_method", { length: 100 }), // Legacy - mantenuto per compatibilità
  notes: text("notes"),
  accountingCode: varchar("accounting_code", { length: 20 }), // Codice conto es. 4010-RicaviCorsi
  vatCode: varchar("vat_code", { length: 10 }).default("ESENTE"), // Codice IVA: ESENTE|IVA22|IVA10|IVA4
  costCenterCode: varchar("cost_center_code", { length: 50 }), // Centro di costo: CORSI|AFFITTI|PRIVATI|TESSERE
  source: varchar("source", { length: 20 }).default("sede"),
  seasonId: int("season_id").references(() => seasons.id, { onDelete: "set null" }),
  createdById: varchar("created_by_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  operatorName: varchar("operator_name", { length: 100 }), // Legacy operator import
  gbrhNumero: varchar("gbrh_numero", { length: 50 }),
  gbrhDataEmissione: date("gbrh_data_emissione"),
  gbrhDataScadenza: date("gbrh_data_scadenza"),
  gbrhDataUtilizzo: date("gbrh_data_utilizzo"),
  gbrhIban: varchar("gbrh_iban", { length: 34 }),
  updatedById: varchar("updated_by_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  bookingId: int("booking_id").references(() => studioBookings.id, { onDelete: "cascade" }),
  membershipId: int("membership_id").references(() => memberships.id, { onDelete: "cascade" }),

  // Maschera Generale Fields
  quantity: int("quantity").default(1),
  quotaDescription: varchar("quota_description", { length: 255 }),
  period: varchar("period", { length: 255 }),
  totalQuota: decimal("total_quota", { precision: 10, scale: 2 }),
  discountCode: varchar("discount_code", { length: 100 }),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }),
  promoCode: varchar("promo_code", { length: 100 }),
  promoValue: decimal("promo_value", { precision: 10, scale: 2 }),
  promoPercentage: decimal("promo_percentage", { precision: 5, scale: 2 }),
  deposit: decimal("deposit", { precision: 10, scale: 2 }),
  annualBalance: decimal("annual_balance", { precision: 10, scale: 2 }),
  receiptsCount: int("receipts_count"),
  transferConfirmationDate: date("transfer_confirmation_date"),
  paymentNoteLabels: json("payment_note_labels").$type<string[]>().default([]),
  enrollmentDetailLabels: json("enrollment_detail_labels").$type<string[]>().default([]),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  member: one(members, {
    fields: [payments.memberId],
    references: [members.id],
  }),
  // RELATIONS: Legacy
  enrollment: one(enrollments, {
    fields: [payments.enrollmentId],
    references: [enrollments.id],
  }),
  
  // RELATIONS: STI V2
  globalEnrollment: one(globalEnrollments, {
    fields: [payments.globalEnrollmentId],
    references: [globalEnrollments.id],
  }),

  paymentMethodInfo: one(paymentMethods, {
    fields: [payments.paymentMethodId],
    references: [paymentMethods.id],
  }),
}));

export const insertPaymentSchema = createInsertSchema(payments, {
  dueDate: z.coerce.date().nullish(),
  paidDate: z.coerce.date().nullish(),
  transferConfirmationDate: z.coerce.date().nullish(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Attendances (Presenze)
export const attendances = mysqlTable("attendances", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  courseId: int("course_id").references(() => courses.id, { onDelete: "set null" }),
  enrollmentId: int("enrollment_id").references(() => enrollments.id, { onDelete: "set null" }),
  attendanceDate: timestamp("attendance_date").notNull().defaultNow(),
  type: varchar("type", { length: 50 }).notNull().default("manual"), // 'manual', 'barcode', 'auto'
  notes: text("notes"),
  seasonId: int("season_id").references(() => seasons.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const attendancesRelations = relations(attendances, ({ one }) => ({
  member: one(members, {
    fields: [attendances.memberId],
    references: [members.id],
  }),
  course: one(courses, {
    fields: [attendances.courseId],
    references: [courses.id],
  }),
  enrollment: one(enrollments, {
    fields: [attendances.enrollmentId],
    references: [enrollments.id],
  }),
}));

export const insertAttendanceSchema = createInsertSchema(attendances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  attendanceDate: z.string().or(z.date()).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendances.$inferSelect;

// ============================================================================
// CUSTOM REPORTS (Report personalizzati)
// ============================================================================

export const customReports = mysqlTable("custom_reports", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  entityType: varchar("entity_type", { length: 100 }).notNull(), // 'members', 'courses', 'payments', 'enrollments', 'workshops', 'attendances', 'instructors'
  selectedFields: json("selected_fields").notNull().$type<string[]>(), // Array of field names
  filters: json("filters").$type<{ field: string; operator: string; value: string }[]>(), // Filter conditions
  sortField: varchar("sort_field", { length: 100 }),
  sortDirection: varchar("sort_direction", { length: 10 }).default("asc"), // 'asc' or 'desc'
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCustomReportSchema = createInsertSchema(customReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCustomReport = z.infer<typeof insertCustomReportSchema>;
export type CustomReport = typeof customReports.$inferSelect;

// ============================================================================
// IMPORT CONFIGURATIONS (Configurazioni di importazione salvate)
// ============================================================================

export const importConfigs = mysqlTable("import_configs", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // 'members' | 'courses'
  sourceType: varchar("source_type", { length: 50 }).notNull(), // 'google_sheets' | 'file'
  fieldMapping: json("field_mapping").notNull().$type<Record<string, number>>(), // field -> column index
  importKey: varchar("import_key", { length: 100 }), // field used for duplicate detection
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertImportConfigSchema = createInsertSchema(importConfigs).omit({
  id: true,
  createdAt: true,
});
export type InsertImportConfig = z.infer<typeof insertImportConfigSchema>;
export type ImportConfig = typeof importConfigs.$inferSelect;

// ============================================================================
// KNOWLEDGE (Descrizioni informative per le sezioni)
// ============================================================================

export const knowledge = mysqlTable("knowledge", {
  id: varchar("id", { length: 100 }).primaryKey(), // es: "corsi", "workshop", "allenamenti"
  sezione: varchar("sezione", { length: 100 }).notNull(), // es: "Attività", "Anagrafica"
  titolo: varchar("titolo", { length: 255 }).notNull(),
  descrizione: text("descrizione"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertKnowledgeSchema = createInsertSchema(knowledge).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertKnowledge = z.infer<typeof insertKnowledgeSchema>;
export type Knowledge = typeof knowledge.$inferSelect;

// ============================================================================
// TEAM COMMENTS (Commenti interni del team)
// ============================================================================

export const teamComments = mysqlTable("team_comments", {
  id: int("id").primaryKey().autoincrement(),
  authorId: varchar("author_id", { length: 255 }).notNull(),
  authorName: varchar("author_name", { length: 255 }).notNull(),
  content: text("content").notNull(),
  priority: varchar("priority", { length: 20 }).default("normale"),
  isResolved: boolean("is_resolved").default(false),
  assignedTo: varchar("assigned_to", { length: 255 }).default("Tutti"), // User ID o "Tutti"
  parentId: int("parent_id"), // Null per commento principale, ID per risposta
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTeamCommentSchema = createInsertSchema(teamComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTeamComment = z.infer<typeof insertTeamCommentSchema>;
export type TeamComment = typeof teamComments.$inferSelect;

// ============================================================================
// TEAM NOTES (Note interne del team)
// ============================================================================

export const teamNotes = mysqlTable("team_notes", {
  id: int("id").primaryKey().autoincrement(),
  authorId: varchar("author_id", { length: 255 }).notNull(),
  authorName: varchar("author_name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 50 }).default("generale"),
  isPinned: boolean("is_pinned").default(false),
  targetUrl: varchar("target_url", { length: 255 }), // URL a cui la nota è fissata (es. /corsi)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by", { length: 255 }),
});

export const insertTeamNoteSchema = createInsertSchema(teamNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTeamNote = z.infer<typeof insertTeamNoteSchema>;
export type TeamNote = typeof teamNotes.$inferSelect;

// ============================================================================
// TEAM NOTIFICATIONS (Notifiche per il team)
// ============================================================================
// Todos
export const todos = mysqlTable("todos", {
  id: int("id").primaryKey().autoincrement(),
  text: varchar("text", { length: 500 }).notNull(),
  completed: boolean("completed").default(false),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  completedBy: varchar("completed_by", { length: 255 }),
  completedAt: timestamp("completed_at"),
});

export const insertTodoSchema = createInsertSchema(todos).omit({
  id: true,
  createdAt: true,
});
export type InsertTodo = z.infer<typeof insertTodoSchema>;
export type Todo = typeof todos.$inferSelect;

// ============================================================================
// MERCHANDISING
// ============================================================================



// ============================================================================
// RENTAL CATEGORIES (Affitti)
// ============================================================================




// ============================================================================
// BOOKING TABLES & ACTIVITY LOGS (From V59)
// ============================================================================

// Booking Service Categories


// Booking Services (Servizi prenotabili, es. Affitto, PT, ecc.)
export const bookingServices = mysqlTable("booking_services", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: int("category_id"),
  price: decimal("price", { precision: 10, scale: 2 }),
  color: varchar("color", { length: 20 }),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBookingServiceSchema = createInsertSchema(bookingServices).omit({ id: true, createdAt: true });
export type InsertBookingService = z.infer<typeof insertBookingServiceSchema>;
export type BookingService = typeof bookingServices.$inferSelect;

export const bookingServicesRelations = relations(bookingServices, ({ one, many }) => ({
  priceItems: many(priceListItems),
}));

// Studio Bookings (Prenotazioni sale)
export const studioBookings = mysqlTable("studio_bookings", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").references(() => members.id, { onDelete: "set null" }),
  studioId: int("studio_id").notNull().references(() => studios.id, { onDelete: "cascade" }),
  serviceId: int("service_id").references(() => bookingServices.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }), // Fallback title if no member or for general notes
  description: text("description"),
  bookingDate: date("booking_date").notNull(),
  startTime: varchar("start_time", { length: 20 }).notNull(),
  endTime: varchar("end_time", { length: 20 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("confirmed"), // confirmed, pending, cancelled
  paid: boolean("paid").default(false),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  googleEventId: varchar("google_event_id", { length: 255 }),
  instructorId: int("instructor_id").references(() => members.id, { onDelete: "set null" }),
  seasonId: int("season_id").references(() => seasons.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const studioBookingsRelations = relations(studioBookings, ({ one }) => ({
  member: one(members, {
    fields: [studioBookings.memberId],
    references: [members.id],
  }),
  studio: one(studios, {
    fields: [studioBookings.studioId],
    references: [studios.id],
  }),
  service: one(bookingServices, {
    fields: [studioBookings.serviceId],
    references: [bookingServices.id],
  }),
  instructor: one(members, {
    fields: [studioBookings.instructorId],
    references: [members.id],
  }),
  season: one(seasons, {
    fields: [studioBookings.seasonId],
    references: [seasons.id],
  }),
}));

export const insertStudioBookingSchema = createInsertSchema(studioBookings, {
  bookingDate: z.coerce.date().nullish(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  bookingDate: z.coerce.date(),
  amount: z.string().or(z.number()).transform((val) => val.toString()).nullable().optional(),
});
export type InsertStudioBooking = z.infer<typeof insertStudioBookingSchema>;
export type StudioBooking = typeof studioBookings.$inferSelect;

// System Configs
export const systemConfigs = mysqlTable("system_configs", {
  id: int("id").primaryKey().autoincrement(),
  keyName: varchar("key_name", { length: 255 }).unique().notNull(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertSystemConfigSchema = createInsertSchema(systemConfigs).omit({ id: true, updatedAt: true });
export type SystemConfig = typeof systemConfigs.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;

// User Activity Logs
export const userActivityLogs = mysqlTable("user_activity_logs", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(), // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
  entityType: varchar("entity_type", { length: 50 }), // members, courses, etc.
  entityId: varchar("entity_id", { length: 255 }),
  details: json("details"), // Store old/new values or extra info
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userActivityLogsRelations = relations(userActivityLogs, ({ one }) => ({
  user: one(users, {
    fields: [userActivityLogs.userId],
    references: [users.id],
  }),
}));

export const insertUserActivityLogSchema = createInsertSchema(userActivityLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertUserActivityLog = z.infer<typeof insertUserActivityLogSchema>;
export type UserActivityLog = typeof userActivityLogs.$inferSelect;

/* 
 * ============================================================================
 * SEASONS (STAGIONI) - LIFECYCLE BUSINESS RULES (PROMEMORIA PER IL TEAM)
 * ============================================================================
 * Il sistema prevede un ciclo vitale rigido per la rotazione delle stagioni:
 * 1. FEBBRAIO: Da febbraio di ogni anno, il frontend autogenera la `Stagione Successiva` (es. 2026/2027) 
 *    con `active = false`. Questo sblocca la Programmazione Date e il Planning a lunghissimo termine.
 * 2. 1° AGOSTO: Avviene la promozione. La `Stagione Successiva` viene promossa a `Stagione Attuale` 
 *    (`active = true`), mentre la precedente viene disattivata.
 * 3. ROLL-OVER: Subito dopo lo switch del 1° agosto, viene creata immediatamente la nuova `Stagione Successiva`
 *    per l'anno sportivo seguente.
 * Assicurarsi di NON spezzare questa logica (Frontend: calendar.tsx, Api, e Jobs di rollover futuri).
 * ============================================================================
 */
export const seasons = mysqlTable("seasons", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const seasonsRelations = relations(seasons, ({ many }) => ({
  studioBookings: many(studioBookings),
}));

export const insertSeasonSchema = createInsertSchema(seasons, {
  startDate: z.coerce.date().nullish(),
  endDate: z.coerce.date().nullish(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});
export type InsertSeason = z.infer<typeof insertSeasonSchema>;
export type Season = typeof seasons.$inferSelect;
// ============================================================================
// PRICE LISTS TABLES
// ============================================================================

export const priceLists = mysqlTable("price_lists", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  validFrom: date("valid_from").notNull(),
  validTo: date("valid_to").notNull(),
  active: boolean("active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Quotes (Quote indipendenti)
export const quotes = mysqlTable("quotes", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }), // e.g., 'Corsi', 'Workshop', 'Iscrizione'
  notes: text("notes"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;

// ============================================================================
// COURSE QUOTES GRID (Foglio Dati Quote Mensili Q1C)
// ============================================================================
export const courseQuotesGrid = mysqlTable("course_quotes_grid", {
  id: int("id").primaryKey().autoincrement(),
  activityType: varchar("activity_type", { length: 50 }).notNull().default('corsi'), //corsi, workshop, domeniche...
  category: varchar("category", { length: 100 }).notNull(), // OPEN, ADULTI, AEREAL, BAMBINI, PROVE
  description: varchar("description", { length: 255 }).notNull(),
  details: text("details"),
  corsiWeek: int("corsi_week"), // Parametro W: numero corsi a settimana
  monthsData: json("months_data").notNull().$type<Record<string, { quota: number | null; lezioni: number | null }>>(),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertCourseQuotesGridSchema = createInsertSchema(courseQuotesGrid).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCourseQuotesGrid = z.infer<typeof insertCourseQuotesGridSchema>;
export type CourseQuotesGrid = typeof courseQuotesGrid.$inferSelect;

export const priceListItems = mysqlTable("price_list_items", {
  id: int("id").primaryKey().autoincrement(),
  priceListId: int("price_list_id").notNull().references(() => priceLists.id, { onDelete: "cascade" }),
  quoteId: int("quote_id").references(() => quotes.id, { onDelete: "set null" }), // Link alla quota standard
  entityType: varchar("entity_type", { length: 50 }).notNull(), // 'course', 'workshop', 'booking_service', 'paid_trial'
  entityId: int("entity_id").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const priceListsRelations = relations(priceLists, ({ many }) => ({
  items: many(priceListItems),
}));

export const priceListItemsRelations = relations(priceListItems, ({ one }) => ({
  priceList: one(priceLists, {
    fields: [priceListItems.priceListId],
    references: [priceLists.id],
  }),
  quote: one(quotes, {
    fields: [priceListItems.quoteId],
    references: [quotes.id],
  }),
  course: one(courses, {
    fields: [priceListItems.entityId],
    references: [courses.id],
  }),
  bookingService: one(bookingServices, {
    fields: [priceListItems.entityId],
    references: [bookingServices.id],
  }),
}));

export const insertPriceListSchema = createInsertSchema(priceLists, {
  validFrom: z.coerce.date(),
  validTo: z.coerce.date(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPriceListItemSchema = createInsertSchema(priceListItems).omit({
  id: true,
  createdAt: true,
});

export const notifications = mysqlTable("notifications", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull().default("system"), // 'message', 'note', 'system'
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const insertNotificationSchema = createInsertSchema(notifications);
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export type InsertPriceList = z.infer<typeof insertPriceListSchema>;
export type PriceList = typeof priceLists.$inferSelect;
export type InsertPriceListItem = z.infer<typeof insertPriceListItemSchema>;
export type PriceListItem = typeof priceListItems.$inferSelect;

// ============================================================================
// AUDIT LOGS
// ============================================================================
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").primaryKey().autoincrement(),
  action: varchar("action", { length: 50 }).notNull(), // e.g., "DELETE"
  entityType: varchar("entity_type", { length: 100 }).notNull(), // e.g., "payments", "courses"
  entityId: int("entity_id").notNull(),
  performedBy: varchar("performed_by", { length: 255 }).notNull(), // user ID or name
  details: text("details"), // JSON payload of deleted data
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// ============================================================================
// SINGLE TABLE INHERITANCE (STI) - SAAS V2
// ============================================================================

// 1. TENANT SETTINGS
export const tenants = mysqlTable("tenants", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  logoUrl: varchar("logo_url", { length: 500 }),
  primaryColor: varchar("primary_color", { length: 50 }).default("#6366f1"),
  customMenuConfig: json("custom_menu_config"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;

// 2. ACTIVITY MACRO-CATEGORIES


// 3. LA SUPER-TABELLA: ACTIVITIES (Unifies 11 Silos)
export const activities = mysqlTable("activities", {
  id: int("id").primaryKey().autoincrement(),
  tenantId: int("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  categoryId: int("category_id"),
  locationId: int("location_id").references(() => studios.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  
  // Condivisi
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  instructorId: int("instructor_id").references(() => members.id, { onDelete: "set null" }),
  
  // Business Rules
  maxCapacity: int("max_capacity"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  isPunchCard: boolean("is_punch_card").default(false),
  punchCardTotalAccesses: int("punch_card_total_accesses"),
  
  // Extra Metadata
  extraInfoOverrides: json("extra_info_overrides"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  tenant: one(tenants, { fields: [activities.tenantId], references: [tenants.id] }),
  location: one(studios, { fields: [activities.locationId], references: [studios.id] }),
  instructor: one(members, { fields: [activities.instructorId], references: [members.id] }),
  globalEnrollments: many(globalEnrollments),
}));

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// 4. LA SUPER-TABELLA: GLOBAL ENROLLMENTS 
export const globalEnrollments = mysqlTable("global_enrollments", {
  id: int("id").primaryKey().autoincrement(),
  tenantId: int("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  activityId: int("activity_id").references(() => activities.id, { onDelete: "cascade" }),
  memberId: int("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  
  status: varchar("status", { length: 50 }).notNull().default("active"),
  
  remainingPunchCards: int("remaining_punch_cards"),
  walletCredit: decimal("wallet_credit", { precision: 10, scale: 2 }).default("0.00"),
  
  extraInfoData: json("extra_info_data"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const globalEnrollmentsRelations = relations(globalEnrollments, ({ one, many }) => ({
  tenant: one(tenants, { fields: [globalEnrollments.tenantId], references: [tenants.id] }),
  activity: one(activities, { fields: [globalEnrollments.activityId], references: [activities.id] }),
  member: one(members, { fields: [globalEnrollments.memberId], references: [members.id] }),
  payments: many(payments),
}));

export const insertGlobalEnrollmentSchema = createInsertSchema(globalEnrollments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertGlobalEnrollment = z.infer<typeof insertGlobalEnrollmentSchema>;
export type GlobalEnrollment = typeof globalEnrollments.$inferSelect;

// ============================================================================
// HR / STAFF MODULE
// ============================================================================

export const teamShifts = mysqlTable("team_shifts", {
  id: int("id").primaryKey().autoincrement(),
  tenantId: int("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  locationId: int("location_id").references(() => studios.id, { onDelete: "set null" }),
  shiftStart: timestamp("shift_start").notNull(),
  shiftEnd: timestamp("shift_end").notNull(),
  isAttendanceVerified: boolean("is_attendance_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertTeamShiftSchema = createInsertSchema(teamShifts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTeamShift = z.infer<typeof insertTeamShiftSchema>;
export type TeamShift = typeof teamShifts.$inferSelect;

export const maintenanceTickets = mysqlTable("maintenance_tickets", {
  id: int("id").primaryKey().autoincrement(),
  tenantId: int("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  locationId: int("location_id").references(() => studios.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("open"),
  reportedBy: varchar("reported_by", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertMaintenanceTicketSchema = createInsertSchema(maintenanceTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMaintenanceTicket = z.infer<typeof insertMaintenanceTicketSchema>;
export type MaintenanceTicket = typeof maintenanceTickets.$inferSelect;

// ============================================================================
// CRM & MARKETING MODULE
// ============================================================================

export const crmLeads = mysqlTable("crm_leads", {
  id: int("id").primaryKey().autoincrement(),
  tenantId: int("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  source: varchar("source", { length: 100 }),
  status: varchar("status", { length: 50 }).default("new"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertCrmLeadSchema = createInsertSchema(crmLeads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCrmLead = z.infer<typeof insertCrmLeadSchema>;
export type CrmLead = typeof crmLeads.$inferSelect;

export const crmCampaigns = mysqlTable("crm_campaigns", {
  id: int("id").primaryKey().autoincrement(),
  tenantId: int("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).default("draft"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertCrmCampaignSchema = createInsertSchema(crmCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCrmCampaign = z.infer<typeof insertCrmCampaignSchema>;
export type CrmCampaign = typeof crmCampaigns.$inferSelect;

// ============================================================================
// CANONICAL CALENDAR DTO (Fase 15/16)
// ============================================================================
export interface UnifiedCalendarEventDTO {
    id: string; // Es. "course_12_2026-03-25"
    activityFamily: 'course' | 'workshop' | 'rental' | 'campus' | 'sunday' | 'recital' | 'trial';
    activityType: string;
    
    // Titoli e UI
    title: string;
    sku: string | null;           // [RECUPERATO] Es. "CRS-19"
    statusLabels: string[];       // [RECUPERATO] Es. ["waiting_list"]
    isActive: boolean;            
    
    // Dati Categoria Pieni
    categoryId: number | null;    
    categoryName: string;         
    categoryTag: string;          // Es. "CRS", "WKS"
    colorProps: {
        backgroundColor?: string;
        borderLeftColor?: string;
        color?: string;
        className?: string;       // Fallback Tailwind
    };
    
    // Dati Insegnanti
    instructorIds: number[];
    instructorNames: string[];    // Array (permette futuri docenti doppi)
    
    // Logistica
    studioId: number | null;
    studioName: string;
    
    // Date Assolute Locali
    startDatetime: string;        // ISO format garantito non null
    endDatetime: string;          // ISO format
    
    // Engine UI Form
    uiRenderingType: string;      // Es. "STANDARD_COURSE_FORM" per istruire la Modale onclick
    rawPayload: any;              // Legacy info di supporto per la transizione
}

// ============================================================================
// STRATEGIC EVENTS (Fase 24 / Planning Reale)
// ============================================================================
export const strategicEvents = mysqlTable("strategic_events", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eventType: varchar("event_type", { length: 100 }).notNull(), // chiusura, ferie, sospensione, evento_macro, nota
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  allDay: boolean("all_day").default(true),
  seasonId: int("season_id").references(() => seasons.id, { onDelete: "set null" }),
  status: varchar("status", { length: 50 }).default("active"),
  affectsCalendar: boolean("affects_calendar").default(true),
  affectsPlanning: boolean("affects_planning").default(true),
  affectsPayments: boolean("affects_payments").default(false),
  studioId: int("studio_id").references(() => studios.id, { onDelete: "set null" }),
  color: varchar("color", { length: 50 }),
  isPublicHoliday: boolean("is_public_holiday").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const strategicEventsRelations = relations(strategicEvents, ({ one }) => ({
  season: one(seasons, {
    fields: [strategicEvents.seasonId],
    references: [seasons.id],
  }),
  studio: one(studios, {
    fields: [strategicEvents.studioId],
    references: [studios.id],
  }),
}));

export const insertStrategicEventSchema = createInsertSchema(strategicEvents, {
  startDate: z.string().or(z.date()).transform((val) => (typeof val === "string" ? new Date(val) : val)),
  endDate: z.string().or(z.date()).transform((val) => (typeof val === "string" ? new Date(val) : val)).or(z.null()).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStrategicEvent = z.infer<typeof insertStrategicEventSchema>;
export type StrategicEvent = typeof strategicEvents.$inferSelect;

// ============================================================================
// MODULO QUOTE E PROMO
// ============================================================================

export const promoRules = mysqlTable("promo_rules", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().default(1),
  code: varchar("code", { length: 50 }).notNull(),
  label: varchar("label", { length: 120 }).notNull(),
  ruleType: mysqlEnum("rule_type", [
    "percentage", "fixed", "blocked_price"
  ]).notNull(),
  value: decimal("value", { precision: 8, scale: 2 }).notNull(),
  validFrom: date("valid_from"),
  validTo: date("valid_to"),
  maxUses: int("max_uses"),
  usedCount: int("used_count").default(0),
  excludeOpen: boolean("exclude_open").default(false),
  notCumulative: boolean("not_cumulative").default(false),
  targetType: varchar("target_type", { length: 30 })
    .notNull().default("public"),
  companyName: varchar("company_name", { length: 120 }),
  memberId: int("member_id")
    .references(() => members.id, { onDelete: "set null" }),
  approvedBy: varchar("approved_by", { length: 50 }),
  internalNotes: text("internal_notes"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow().onUpdateNow(),
}, (table) => ({
  uniqueCodePerTenant: uniqueIndex("uq_promo_tenant_code")
    .on(table.tenantId, table.code),
}));

export const welfareProviders = mysqlTable("welfare_providers", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().default(1),
  name: varchar("name", { length: 80 }).notNull(),
  requiresMembershipFee: boolean("requires_membership_fee")
    .default(true),
  requiresMedicalCert: boolean("requires_medical_cert")
    .default(true),
  extraFeePercent: decimal("extra_fee_percent",
    { precision: 5, scale: 2 }).default("0"),
  availableCategories: text("available_categories"),
  operativeNotes: text("operative_notes"),
  isActive: boolean("is_active").default(true),
  metadata: json("metadata"),
  updatedAt: timestamp("updated_at")
    .defaultNow().onUpdateNow(),
}, (table) => ({
  uniqueNamePerTenant: uniqueIndex("uq_welfare_tenant_name")
    .on(table.tenantId, table.name),
}));

export const carnetWallets = mysqlTable("carnet_wallets", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("member_id").notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  walletTypeId: int("wallet_type_id").notNull()
    .references(() => customListItems.id),
  totalUnits: tinyint("total_units").notNull().default(10),
  usedUnits: tinyint("used_units").notNull().default(0),
  expiryDays: tinyint("expiry_days").notNull(),
  paymentId: int("payment_id")
    .references(() => payments.id, { onDelete: "set null" }),
  trialDate: date("trial_date"),
  purchasedAt: date("purchased_at").notNull(),
  expiresAt: date("expires_at").notNull(),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  groupSize: tinyint("group_size").default(1),
  locationType: varchar("location_type", {length:30}).default("in_sede"),
  pricePerUnit: decimal("price_per_unit", {precision:8,scale:2}),
  totalPaid: decimal("total_paid", {precision:8,scale:2}),
  bonusUnits: tinyint("bonus_units").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow().onUpdateNow(),
});

export const carnetSessions = mysqlTable("carnet_sessions", {
  id: int("id").autoincrement().primaryKey(),
  walletId: int("wallet_id").notNull()
    .references(() => carnetWallets.id, 
      { onDelete: "cascade" }),
  sessionNumber: tinyint("session_number").notNull(),
  sessionDate: date("session_date").notNull(),
  sessionTimeStart: time("session_time_start"),
  sessionTimeEnd: time("session_time_end"),
  instructorId: int("instructor_id")
    .references(() => members.id, { onDelete: "set null" }),
  isBonus: boolean("is_bonus").default(false),
  notes: varchar("notes", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueSession: uniqueIndex("uq_wallet_session")
    .on(table.walletId, table.sessionNumber),
}));

export const instructorAgreements = mysqlTable("instructor_agreements", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().default(1),
  memberId: int("member_id").notNull()
    .references(() => members.id, { onDelete: "restrict" }),
  seasonId: int("season_id")
    .references(() => seasons.id, { onDelete: "set null" }),
  agreementType: mysqlEnum("agreement_type", [
    "flat_monthly", "pack_hours", "variable_monthly"
  ]).notNull(),
  baseMonthlyAmount: decimal("base_monthly_amount",
    { precision: 8, scale: 2 }),
  packHours: tinyint("pack_hours"),
  speseMensili: decimal("spese_mensili",
    { precision: 8, scale: 2 }).default("0"),
  billingDay: tinyint("billing_day").default(1),
  paymentMode: mysqlEnum("payment_mode", [
    "contanti", "bonifico", "fattura", "pos"
  ]).notNull(),
  studioId: int("studio_id")
    .references(() => studios.id, { onDelete: "set null" }),
  scheduleNotes: text("schedule_notes"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow().onUpdateNow(),
});

export const agreementMonthlyOverrides = mysqlTable("agreement_monthly_overrides", {
  id: int("id").autoincrement().primaryKey(),
  agreementId: int("agreement_id").notNull()
    .references(() => instructorAgreements.id,
      { onDelete: "cascade" }),
  seasonId: int("season_id")
    .references(() => seasons.id, { onDelete: "set null" }),
  month: tinyint("month").notNull(),
  overrideAmount: decimal("override_amount",
    { precision: 8, scale: 2 }).notNull(),
  notes: varchar("notes", { length: 255 }),
}, (table) => ({
  uniqueMonthPerAgreement: uniqueIndex("uq_override_month")
    .on(table.agreementId, table.seasonId, table.month),
}));

export const pagodilTiers = mysqlTable("pagodil_tiers", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().default(1),
  providerName: varchar("provider_name", { length: 50 })
    .notNull().default("pagodil"),
  rangeMin: decimal("range_min",
    { precision: 8, scale: 2 }).notNull(),
  rangeMax: decimal("range_max",
    { precision: 8, scale: 2 }).notNull(),
  feeAmount: decimal("fee_amount",
    { precision: 8, scale: 2 }).notNull(),
  feeType: varchar("fee_type", { length: 20 })
    .notNull().default("fixed"),
  installmentsMax: tinyint("installments_max").notNull(),
  isActive: boolean("is_active").default(true),
}, (table) => ({
  uniqueTier: uniqueIndex("uq_pagodil_tier")
    .on(table.tenantId, table.providerName, table.rangeMin),
}));

// ============================================================================
// STRUTTURA CONTABILE BASE
// ============================================================================

export const costCenters = mysqlTable("cost_centers",{
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().default(1),
  code: varchar("code",{length:30}).notNull(),
  label: varchar("label",{length:120}).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
},(t)=>({
  uqCode: uniqueIndex("uq_cost_center_code")
    .on(t.tenantId, t.code),
}));

export const accountingPeriods = mysqlTable(
  "accounting_periods",{
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().default(1),
  seasonId: int("season_id").references(() => seasons.id, { onDelete: 'set null' }),
  year: smallint("year").notNull(),
  month: tinyint("month").notNull(),
  label: varchar("label",{length:50}).notNull(),
  isClosed: boolean("is_closed").default(false),
  closedAt: timestamp("closed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
},(t)=>({
  uqPeriod: uniqueIndex("uq_accounting_period")
    .on(t.tenantId, t.year, t.month),
}));

export const journalEntries = mysqlTable(
  "journal_entries",{
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().default(1),
  periodId: int("period_id")
    .references(()=>accountingPeriods.id,
      {onDelete:"restrict"}),
  paymentId: int("payment_id")
    .references(()=>payments.id,
      {onDelete:"set null"}),
  entryDate: date("entry_date").notNull(),
  description: varchar("description",
    {length:255}).notNull(),
  debitAccount: varchar("debit_account",{length:50}),
  creditAccount: varchar("credit_account",{length:50}),
  amount: decimal("amount",
    {precision:10,scale:2}).notNull(),
  vatAmount: decimal("vat_amount",
    {precision:10,scale:2}).default("0"),
  vatCode: varchar("vat_code",{length:10})
    .default("ESENTE"),
  costCenterId: int("cost_center_id")
    .references(()=>costCenters.id,
      {onDelete:"set null"}),
  isAuto: boolean("is_auto").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdById: varchar("created_by_id",{length:50}),
});
export const companyAgreements = mysqlTable(
  "company_agreements", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().default(1),
  companyName: varchar("company_name",{length:150}).notNull(),
  companyType: varchar("company_type",{length:50}),
  discountCourses: decimal("discount_courses",{precision:5,scale:2}).default("0"),
  discountMerch: decimal("discount_merch",{precision:5,scale:2}).default("0"),
  discountOther: decimal("discount_other",{precision:5,scale:2}).default("0"),
  excludeOpen: boolean("exclude_open").default(true),
  excludeOtherPromos: boolean("exclude_other_promos").default(true),
  eligibleWho: text("eligible_who"),
  specialRules: text("special_rules"),
  promoRuleId: int("promo_rule_id").references(()=>promoRules.id,{onDelete:"set null"}),
  validFrom: date("valid_from"),
  validTo: date("valid_to"),
  isActive: boolean("is_active").default(true),
  approvedBy: varchar("approved_by",{length:50}).default("Direzione"),
  requiresVerification: boolean("requires_verification").default(true),
  verificationNotes: text("verification_notes"),
  metadata: json("metadata"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
},(t)=>({
  idxName: index("idx_company_agreements_name").on(t.tenantId, t.companyName),
  idxActive: index("idx_company_agreements_active").on(t.tenantId, t.isActive),
}));

export const memberDiscounts = mysqlTable(
  "member_discounts", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().default(1),
  memberId: int("member_id").notNull().references(()=>members.id,{onDelete:"cascade"}),
  promoRuleId: int("promo_rule_id").references(()=>promoRules.id,{onDelete:"set null"}),
  discountType: varchar("discount_type",{length:30}).notNull(),
  discountValue: decimal("discount_value",{precision:8,scale:2}),
  discountPercent: decimal("discount_percent",{precision:5,scale:2}),
  approvedBy: varchar("approved_by",{length:50}),
  approvedAt: date("approved_at"),
  validForSeasonId: int("valid_for_season_id").references(()=>seasons.id,{onDelete:"set null"}),
  validFrom: date("valid_from"),
  validTo: date("valid_to"),
  isUsed: boolean("is_used").default(false),
  usedAt: timestamp("used_at"),
  paymentId: int("payment_id").references(()=>payments.id,{onDelete:"set null"}),
  bonusNote: text("bonus_note"),
  internalNotes: text("internal_notes"),
  companyAgreementId: int("company_agreement_id").references(()=>companyAgreements.id, {onDelete:"set null"}),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  createdById: varchar("created_by_id",{length:50}),
},(t)=>({
  idxMember: index("idx_member_discounts_member").on(t.memberId),
  idxPromo: index("idx_member_discounts_promo").on(t.promoRuleId),
  idxUsed: index("idx_member_discounts_used").on(t.isUsed, t.tenantId),
}));

export const staffRates = mysqlTable("staff_rates",{
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().default(1),
  serviceCode: varchar("service_code",{length:50}).notNull(),
  serviceLabel: varchar("service_label",{length:120}).notNull(),
  amount: decimal("amount",{precision:8,scale:2}).notNull(),
  rateType: varchar("rate_type",{length:20}).notNull().default("annual"),
  applicableTo: varchar("applicable_to",{length:50}).default("all_staff"),
  studioRestriction: text("studio_restriction"),
  requiresMembership: boolean("requires_membership").default(true),
  requiresMedicalCert: boolean("requires_medical_cert").default(true),
  maxSessionsPerWeek: tinyint("max_sessions_per_week"),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
},(t)=>({
  uqCode: uniqueIndex("uq_staff_rate_code").on(t.tenantId, t.serviceCode),
}));

export type MemberDiscount = typeof memberDiscounts.$inferSelect;
export type InsertMemberDiscount = typeof memberDiscounts.$inferInsert;
export type CompanyAgreement = typeof companyAgreements.$inferSelect;
export type InsertCompanyAgreement = typeof companyAgreements.$inferInsert;
export type AttendanceLog = typeof attendances.$inferSelect;
export type InsertAttendanceLog = typeof attendances.$inferInsert;

export const webhookLogs = mysqlTable(
  "webhook_logs", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().default(1),
  source: varchar("source",{length:30}).notNull(),
  eventType: varchar("event_type",{length:80}),
  externalId: varchar("external_id",{length:120}),
  rawPayload: json("raw_payload"),
  status: varchar("status",{length:20}).notNull().default("received"),
  processedAt: timestamp("processed_at"),
  errorMessage: text("error_message"),
  paymentId: int("payment_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type WebhookLog = typeof webhookLogs.$inferSelect;

export const wcProductMapping = mysqlTable(
  "wc_product_mapping", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().default(1),
  wcProductId: int("wc_product_id"),
  wcProductName: varchar("wc_product_name", {length:200}),
  stargemCategory: varchar("stargem_category", {length:50}),
  stargemCourseCount: tinyint("stargem_course_count").default(1),
  stargemActivityType: varchar("stargem_activity_type",{length:50}),
  notes: text("notes"),
});
export type WcProductMapping = typeof wcProductMapping.$inferSelect;



export type StaffRate = typeof staffRates.$inferSelect;
export type InsertStaffRate = typeof staffRates.$inferInsert;


export type InsertPromoRule = typeof promoRules.$inferInsert;

export type WelfareProvider = typeof welfareProviders.$inferSelect;
export type InsertWelfareProvider = typeof welfareProviders.$inferInsert;

export type CarnetWallet = typeof carnetWallets.$inferSelect;
export type InsertCarnetWallet = typeof carnetWallets.$inferInsert;

export type CarnetSession = typeof carnetSessions.$inferSelect;
export type InsertCarnetSession = typeof carnetSessions.$inferInsert;

export type InstructorAgreement = typeof instructorAgreements.$inferSelect;
export type InsertInstructorAgreement = typeof instructorAgreements.$inferInsert;

export type AgreementMonthlyOverride = typeof agreementMonthlyOverrides.$inferSelect;
export type InsertAgreementMonthlyOverride = typeof agreementMonthlyOverrides.$inferInsert;

// ============================================
// CARNET E PREZZI DINAMICI
// ============================================
export const priceMatrix = mysqlTable(
  "price_matrix", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").default(1),
  seasonId: int("season_id").references(() => seasons.id, { onDelete: "set null" }),
  category: varchar("category", { length: 100 }),
  quantityType: varchar("quantity_type", { length: 50 }),
  courseCount: int("course_count"),
  validFromMonth: int("valid_from_month"),
  validToMonth: int("valid_to_month"),
  basePrice: decimal("base_price", { precision: 8, scale: 2 }),
  maxSlots: int("max_slots"),
  excludeFromPromo: boolean("exclude_from_promo").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type PriceMatrix = typeof priceMatrix.$inferSelect;
export type InsertPriceMatrix = typeof priceMatrix.$inferInsert;

export const pricingRules = mysqlTable(
  "pricing_rules", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().default(1),
  ruleCode: varchar("rule_code",{length:50}).notNull(),
  ruleLabel: varchar("rule_label",{length:120}).notNull(),
  appliesTo: varchar("applies_to",{length:50}).notNull(),
  ruleType: varchar("rule_type",{length:30}).notNull(),
  triggerCondition: varchar("trigger_condition",{length:50}),
  triggerValue: decimal("trigger_value",{precision:8,scale:2}),
  effectType: varchar("effect_type",{length:30}).notNull(),
  effectValue: decimal("effect_value",{precision:8,scale:2}),
  requiresAuthorization: boolean("requires_authorization").default(false),
  authorizedBy: varchar("authorized_by",{length:50}),
  priority: tinyint("priority").default(10),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
},(t)=>({
  uqCode: uniqueIndex("uq_pricing_rule_code").on(t.tenantId, t.ruleCode),
  idxApplies: index("idx_pricing_rules_applies").on(t.tenantId, t.appliesTo, t.isActive),
}));

export type PricingRule = typeof pricingRules.$inferSelect;
export type InsertPricingRule = typeof pricingRules.$inferInsert;

export type PromoRule = typeof promoRules.$inferSelect;

// ============================================================================
// GEMPASS: FORM SUBMISSIONS
// ============================================================================

export const memberFormsSubmissions = mysqlTable("member_forms_submissions", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").notNull().references(() => members.id),
  formType: varchar("form_type", { length: 50 }).notNull(),
  formVersion: varchar("form_version", { length: 20 }).notNull().default("2025-06-30"),
  seasonId: int("season_id").references(() => seasons.id, { onDelete: "set null" }),
  payloadData: json("payload_data"),
  signedAt: datetime("signed_at"),
  signedByIp: varchar("signed_by_ip", { length: 45 }),
  signatureHash: varchar("signature_hash", { length: 255 }),
  createdBy: int("created_by"),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const memberFormsSubmissionsRelations = relations(memberFormsSubmissions, ({ one }) => ({
  member: one(members, {
    fields: [memberFormsSubmissions.memberId],
    references: [members.id],
  }),
  season: one(seasons, {
    fields: [memberFormsSubmissions.seasonId],
    references: [seasons.id],
  }),
}));

export const insertMemberFormsSubmissionsSchema = createInsertSchema(memberFormsSubmissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMemberFormsSubmissions = z.infer<typeof insertMemberFormsSubmissionsSchema>;
export type MemberFormsSubmissions = typeof memberFormsSubmissions.$inferSelect;

// ============================================================================
// GEMTEAM MODULE
// ============================================================================

export const teamEmployees = mysqlTable("team_employees", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").notNull().references(() => members.id, { onDelete: "restrict" }),
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  displayOrder: int("display_order").notNull().default(0),
  team: mysqlEnum("team", ["segreteria","ass_manutenzione","ufficio","amministrazione","comunicazione","direzione"]).notNull(),
  tariffaOraria: decimal("tariffa_oraria", { precision: 5, scale: 2 }),
  stipendioFissoMensile: decimal("stipendio_fisso_mensile", { precision: 8, scale: 2 }),
  dataAssunzione: date("data_assunzione"),
  attivo: boolean("attivo").notNull().default(true),
  noteHr: text("note_hr"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
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
  postazione: mysqlEnum("postazione", ["RECEPTION","PRIMO","SECONDO","UFFICIO","AMM.ZIONE","PAUSA","RIPOSO","RIUNIONE","STUDIO_1","STUDIO_2","MALATTIA","PERMESSO","WORKSHOP"]).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("idx_settimana").on(t.settimanaTipo, t.giornoSettimana),
]);

export const teamScheduledShifts = mysqlTable("team_scheduled_shifts", {
  id: int("id").primaryKey().autoincrement(),
  employeeId: int("employee_id").notNull().references(() => teamEmployees.id, { onDelete: "cascade" }),
  data: date("data").notNull(),
  oraInizio: time("ora_inizio").notNull(),
  oraFine: time("ora_fine").notNull(),
  postazione: varchar("postazione", { length: 50 }).notNull(),
  note: varchar("note", { length: 255 }),
  // templateId: int("template_id").references(() => teamShiftTemplates.id, { onDelete: "set null" }), // removed by prompt definition
  createdByUserId: varchar("created_by_user_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  modifiedByUserId: varchar("modified_by_user_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (t) => [
  uniqueIndex("uq_shift").on(t.employeeId, t.data, t.oraInizio)
]);

export const teamActivityTypes = mysqlTable("team_activity_types", {
  id: int("id").primaryKey().autoincrement(),
  team: mysqlEnum("team", ["segreteria","ass_manutenzione","tutti"]).notNull().default("tutti"),
  label: varchar("label", { length: 200 }).notNull(),
  categoria: varchar("categoria", { length: 50 }),
  attivo: boolean("attivo").notNull().default(true),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teamShiftDiaryEntries = mysqlTable("team_shift_diary_entries", {
  id: int("id").primaryKey().autoincrement(),
  employeeId: int("employee_id").notNull().references(() => teamEmployees.id, { onDelete: "cascade" }),
  shiftId: int("shift_id").references(() => teamScheduledShifts.id, { onDelete: "set null" }),
  data: date("data").notNull(),
  oraSlot: time("ora_slot").notNull(),
  postazione: mysqlEnum("postazione", ["RECEPTION","PRIMO","SECONDO","UFFICIO","AMM.ZIONE","PAUSA","RIPOSO","RIUNIONE","STUDIO_1","STUDIO_2","MALATTIA","PERMESSO","WORKSHOP"]).notNull(),
  activityTypeId: int("activity_type_id").references(() => teamActivityTypes.id, { onDelete: "set null" }),
  attivitaLibera: varchar("attivita_libera", { length: 300 }),
  quantita: int("quantita"),
  minuti: smallint("minuti"),
  note: text("note"),
  okFlag: boolean("ok_flag").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
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
  createdAt: timestamp("created_at").defaultNow(),
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (t) => [
  index("idx_status").on(t.status),
  index("idx_employee").on(t.employeeId),
]);

export const teamHandoverNotes = mysqlTable("team_handover_notes", {
  id: int("id").primaryKey().autoincrement(),
  employeeId: int("employee_id").notNull().references(() => teamEmployees.id, { onDelete: "cascade" }),
  shiftId: int("shift_id").references(() => teamScheduledShifts.id, { onDelete: "set null" }),
  data: date("data").notNull(),
  postazione: mysqlEnum("postazione", ["RECEPTION","PRIMO","SECONDO","UFFICIO","AMM.ZIONE","WORKSHOP"]).notNull(),
  testo: text("testo").notNull(),
  priorita: mysqlEnum("priorita", ["low","medium","high"]).notNull().default("low"),
  lettaDa: json("letta_da"),
  createdAt: timestamp("created_at").defaultNow(),
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
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
  requestedAt: timestamp("requested_at").defaultNow(),
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
  createdAt: timestamp("created_at").defaultNow(),
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
  uploadedAt: timestamp("uploaded_at").defaultNow(),
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
  createdAt: timestamp("created_at").defaultNow(),
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
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("idx_employee").on(t.employeeId),
  index("idx_created").on(t.createdAt),
]);


// ============================================================================
// GEMCHAT E GEMPORTAL
// ============================================================================

export const gemConversations = mysqlTable("gem_conversations", {
  id: int("id").autoincrement().primaryKey(),
  channel: mysqlEnum("channel", ["member", "staff"]).notNull(),
  participantId: int("participant_id").notNull().references(() => members.id),
  participantUserId: varchar("participant_user_id", { length: 255 }),
  status: mysqlEnum("status", ["bot", "human", "closed"]).default("bot"),
  assignedTo: varchar("assigned_to", { length: 255 }),
  botContext: json("bot_context"),
  lastMessageAt: datetime("last_message_at"),
  unreadTeam: int("unread_team").default(0),
  unreadParticipant: int("unread_participant").default(0),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
}, (table) => ({
  channelIdx: index("idx_channel").on(table.channel),
  participantIdIdx: index("idx_participant_id").on(table.participantId),
  statusIdx: index("idx_status").on(table.status),
  lastMessageAtIdx: index("idx_last_message_at").on(table.lastMessageAt),
  assignedToIdx: index("idx_assigned_to").on(table.assignedTo)
}));

export const gemMessages = mysqlTable("gem_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversation_id").notNull().references(() => gemConversations.id, { onDelete: "cascade" }),
  senderType: mysqlEnum("sender_type", ["member", "staff", "team", "bot"]).notNull(),
  senderId: varchar("sender_id", { length: 255 }), // Logical ref -> users.id if team
  content: text("content").notNull(),
  attachmentUrl: varchar("attachment_url", { length: 500 }),
  attachmentName: varchar("attachment_name", { length: 255 }),
  attachmentSize: int("attachment_size"),
  quickLinkType: mysqlEnum("quick_link_type", ["corso", "tessera", "pagamento"]),
  quickLinkId: int("quick_link_id"),
  isRead: tinyint("is_read").default(0),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  conversationIdIdx: index("idx_conversation_id").on(table.conversationId),
  senderTypeIdx: index("idx_sender_type").on(table.senderType),
  isReadIdx: index("idx_is_read").on(table.isRead),
  createdAtIdx: index("idx_created_at").on(table.createdAt)
}));


export const memberUploads = mysqlTable("member_uploads", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("member_id").notNull().references(() => members.id),
  documentType: mysqlEnum("document_type", ["certificato_medico", "documento_identita", "altro"]).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  fileSize: int("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedAt: datetime("uploaded_at").default(sql`CURRENT_TIMESTAMP`),
  verifiedBy: varchar("verified_by", { length: 255 }),
  verifiedAt: datetime("verified_at"),
  notes: text("notes"),
  seasonId: int("season_id").references(() => seasons.id)
}, (table) => ({
  memberIdIdx: index("idx_member_id").on(table.memberId),
  documentTypeIdx: index("idx_document_type").on(table.documentType),
  verifiedByIdx: index("idx_verified_by").on(table.verifiedBy),
  seasonIdIdx: index("idx_season_id").on(table.seasonId)
}));


export const teamWeekAssignments = mysqlTable("team_week_assignments", {
  id: int("id").primaryKey().autoincrement(),
  weekStart: date("week_start").notNull().unique(),
  settimana: varchar("settimana", { length: 1 }).notNull(),
  isManualOverride: boolean("is_manual_override").notNull().default(false),
  note: varchar("note", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const teamNotifications = mysqlTable("team_notifications", {
  id: int("id").primaryKey().autoincrement(),
  employeeId: int("employee_id").notNull().references(() => teamEmployees.id, { onDelete: "cascade" }),
  tipo: varchar("tipo", { length: 50 }).notNull(),
  titolo: varchar("titolo", { length: 255 }).notNull(),
  messaggio: text("messaggio"),
  dataRiferimento: date("data_riferimento"),
  letta: boolean("letta").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teamPostazioni = mysqlTable("team_postazioni", {
  id: int("id").primaryKey().autoincrement(),
  nome: varchar("nome", { length: 50 }).notNull().unique(),
  contaOre: boolean("conta_ore").notNull().default(true),
  colore: varchar("colore", { length: 7 }).default('#888888'),
  attiva: boolean("attiva").notNull().default(true),
  ordine: int("ordine").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Migrated categories to custom_list_items
export const insertClientCategorySchema = z.object({ name: z.string(), description: z.string().nullable().optional(), color: z.string().nullable().optional(), sortOrder: z.number().optional() });
export type ClientCategory = { id: number, name: string, description: string | null, color: string | null, sortOrder: number };

export const insertRentalCategorySchema = z.object({ name: z.string(), description: z.string().nullable().optional(), color: z.string().nullable().optional(), sortOrder: z.number().optional() });
export type RentalCategory = { id: number, name: string, description: string | null, color: string | null, sortOrder: number };

export const insertBookingServiceCategorySchema = z.object({ name: z.string(), description: z.string().nullable().optional(), color: z.string().nullable().optional(), sortOrder: z.number().optional() });
export type BookingServiceCategory = { id: number, name: string, description: string | null, color: string | null, sortOrder: number };

export const insertMerchandisingCategorySchema = z.object({ name: z.string(), description: z.string().nullable().optional(), color: z.string().nullable().optional(), sortOrder: z.number().optional() });
export type MerchandisingCategory = { id: number, name: string, description: string | null, color: string | null, sortOrder: number };

export const insertCategorySchema = z.object({ name: z.string(), description: z.string().nullable().optional(), color: z.string().nullable().optional(), sortOrder: z.number().optional() });
export type Category = { id: number, name: string, description: string | null, color: string | null, sortOrder: number };
