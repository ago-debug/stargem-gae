import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  jsonb,
  index,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// AUTH TABLES (Required for Replit Auth - from javascript_log_in_with_replit blueprint)
// ============================================================================

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ============================================================================
// LOCATION TABLES (Countries, Provinces, Cities with CAP)
// ============================================================================

// Countries (Stati)
export const countries = pgTable("countries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  code: varchar("code", { length: 3 }).notNull().unique(), // ISO 3166-1 alpha-2/3 code (IT, DE, FR)
  name: varchar("name", { length: 100 }).notNull(),
  isDefault: boolean("is_default").default(false),
});

export const insertCountrySchema = createInsertSchema(countries).omit({ id: true });
export type InsertCountry = z.infer<typeof insertCountrySchema>;
export type Country = typeof countries.$inferSelect;

// Provinces (Province italiane)
export const provinces = pgTable("provinces", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  code: varchar("code", { length: 2 }).notNull(), // Sigla provincia (MI, RM, TO)
  name: varchar("name", { length: 100 }).notNull(),
  region: varchar("region", { length: 100 }), // Regione
  countryId: integer("country_id").references(() => countries.id, { onDelete: "cascade" }),
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
export const cities = pgTable("cities", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 100 }).notNull(),
  provinceId: integer("province_id").references(() => provinces.id, { onDelete: "cascade" }),
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
// CORE TABLES
// ============================================================================

// Categories (hierarchical structure)
export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  color: varchar("color", { length: 7 }), // hex color for UI
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "subcategories",
  }),
  subcategories: many(categories, { relationName: "subcategories" }),
  courses: many(courses),
}));

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Client Categories (hierarchical structure for client classification)
export const clientCategories = pgTable("client_categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  color: varchar("color", { length: 7 }), // hex color for UI
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clientCategoriesRelations = relations(clientCategories, ({ one, many }) => ({
  parent: one(clientCategories, {
    fields: [clientCategories.parentId],
    references: [clientCategories.id],
    relationName: "subcategories",
  }),
  subcategories: many(clientCategories, { relationName: "subcategories" }),
  members: many(members),
}));

export const insertClientCategorySchema = createInsertSchema(clientCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertClientCategory = z.infer<typeof insertClientCategorySchema>;
export type ClientCategory = typeof clientCategories.$inferSelect;

// Subscription Types (Tipo Iscrizione)
export const subscriptionTypes = pgTable("subscription_types", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
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

// Instructors
export const instructors = pgTable("instructors", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  specialization: text("specialization"),
  bio: text("bio"),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const instructorsRelations = relations(instructors, ({ many }) => ({
  courses: many(courses),
  rates: many(instructorRates),
}));

export const insertInstructorSchema = createInsertSchema(instructors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertInstructor = z.infer<typeof insertInstructorSchema>;
export type Instructor = typeof instructors.$inferSelect;

// Instructor Rates (per course type or category)
export const instructorRates = pgTable("instructor_rates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  instructorId: integer("instructor_id").notNull().references(() => instructors.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  rateType: varchar("rate_type", { length: 50 }).notNull(), // 'hourly', 'per_lesson', 'fixed'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const instructorRatesRelations = relations(instructorRates, ({ one }) => ({
  instructor: one(instructors, {
    fields: [instructorRates.instructorId],
    references: [instructors.id],
  }),
  category: one(categories, {
    fields: [instructorRates.categoryId],
    references: [categories.id],
  }),
}));

export const insertInstructorRateSchema = createInsertSchema(instructorRates).omit({
  id: true,
  createdAt: true,
});
export type InsertInstructorRate = z.infer<typeof insertInstructorRateSchema>;
export type InstructorRate = typeof instructorRates.$inferSelect;

// Studios (sale/studi)
export const studios = pgTable("studios", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  floor: varchar("floor", { length: 50 }), // Piano
  operatingHours: text("operating_hours"), // JSON: {"monday": {"start": "09:00", "end": "21:00"}, ...}
  operatingDays: text("operating_days"), // JSON: ["monday", "tuesday", ...]
  capacity: integer("capacity"), // Capienza
  equipment: text("equipment"), // Attrezzature (lista separata da virgole o JSON)
  notes: text("notes"),
  active: boolean("active").default(true),
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
export const courses = pgTable("courses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sku: varchar("sku", { length: 100 }), // SKU univoco (es: 2526-NEMBRI-LUN-15) - unique constraint da aggiungere dopo
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  studioId: integer("studio_id").references(() => studios.id, { onDelete: "set null" }), // Studio/sala
  instructorId: integer("instructor_id").references(() => instructors.id, { onDelete: "set null" }), // Insegnante primario
  secondaryInstructor1Id: integer("secondary_instructor1_id").references(() => instructors.id, { onDelete: "set null" }), // Insegnante secondario 1
  secondaryInstructor2Id: integer("secondary_instructor2_id").references(() => instructors.id, { onDelete: "set null" }), // Insegnante secondario 2
  price: decimal("price", { precision: 10, scale: 2 }),
  maxCapacity: integer("max_capacity"),
  currentEnrollment: integer("current_enrollment").default(0),
  // Campi orario strutturati (nuovo sistema con dropdown)
  dayOfWeek: varchar("day_of_week", { length: 20 }), // lunedì, martedì, mercoledì, giovedì, venerdì, sabato, domenica
  startTime: varchar("start_time", { length: 10 }), // formato HH:MM (es: "15:00")
  endTime: varchar("end_time", { length: 10 }), // formato HH:MM (es: "16:30")
  recurrenceType: varchar("recurrence_type", { length: 20 }), // settimanale, bisettimanale, mensile, personalizzata
  schedule: text("schedule"), // JSON: {day: "LUN", startTime: "15:00", endTime: "16:30", repeat: "weekly"} - legacy
  startDate: date("start_date"),
  endDate: date("end_date"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const coursesRelations = relations(courses, ({ one, many }) => ({
  category: one(categories, {
    fields: [courses.categoryId],
    references: [categories.id],
  }),
  studio: one(studios, {
    fields: [courses.studioId],
    references: [studios.id],
  }),
  instructor: one(instructors, {
    fields: [courses.instructorId],
    references: [instructors.id],
  }),
  secondaryInstructor1: one(instructors, {
    fields: [courses.secondaryInstructor1Id],
    references: [instructors.id],
  }),
  secondaryInstructor2: one(instructors, {
    fields: [courses.secondaryInstructor2Id],
    references: [instructors.id],
  }),
  enrollments: many(enrollments),
}));

export const studiosRelations = relations(studios, ({ many }) => ({
  courses: many(courses),
}));

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  currentEnrollment: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

// ============================================================================
// WORKSHOPS (identical structure to courses)
// ============================================================================
export const workshops = pgTable("workshops", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sku: varchar("sku", { length: 100 }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  studioId: integer("studio_id").references(() => studios.id, { onDelete: "set null" }),
  instructorId: integer("instructor_id").references(() => instructors.id, { onDelete: "set null" }),
  secondaryInstructor1Id: integer("secondary_instructor1_id").references(() => instructors.id, { onDelete: "set null" }),
  secondaryInstructor2Id: integer("secondary_instructor2_id").references(() => instructors.id, { onDelete: "set null" }),
  price: decimal("price", { precision: 10, scale: 2 }),
  maxCapacity: integer("max_capacity"),
  currentEnrollment: integer("current_enrollment").default(0),
  dayOfWeek: varchar("day_of_week", { length: 20 }),
  startTime: varchar("start_time", { length: 10 }),
  endTime: varchar("end_time", { length: 10 }),
  recurrenceType: varchar("recurrence_type", { length: 20 }),
  schedule: text("schedule"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workshopsRelations = relations(workshops, ({ one }) => ({
  category: one(categories, {
    fields: [workshops.categoryId],
    references: [categories.id],
  }),
  studio: one(studios, {
    fields: [workshops.studioId],
    references: [studios.id],
  }),
  instructor: one(instructors, {
    fields: [workshops.instructorId],
    references: [instructors.id],
  }),
  secondaryInstructor1: one(instructors, {
    fields: [workshops.secondaryInstructor1Id],
    references: [instructors.id],
  }),
  secondaryInstructor2: one(instructors, {
    fields: [workshops.secondaryInstructor2Id],
    references: [instructors.id],
  }),
}));

export const insertWorkshopSchema = createInsertSchema(workshops).omit({
  id: true,
  currentEnrollment: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertWorkshop = z.infer<typeof insertWorkshopSchema>;
export type Workshop = typeof workshops.$inferSelect;

// Members (iscritti)
export const members = pgTable("members", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  fiscalCode: varchar("fiscal_code", { length: 16 }), // Codice fiscale
  dateOfBirth: date("date_of_birth"),
  placeOfBirth: varchar("place_of_birth", { length: 255 }), // Luogo di nascita
  gender: varchar("gender", { length: 1 }), // M = Maschio, F = Femmina
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }), // Telefono fisso
  mobile: varchar("mobile", { length: 50 }), // Cellulare
  categoryId: integer("category_id").references(() => clientCategories.id, { onDelete: "set null" }), // Categoria cliente (Tipologia Socio)
  subscriptionTypeId: integer("subscription_type_id").references(() => subscriptionTypes.id, { onDelete: "set null" }), // Tipo Iscrizione
  
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
  
  // Dati genitori (per minorenni)
  motherFirstName: varchar("mother_first_name", { length: 255 }), // Nome madre
  motherLastName: varchar("mother_last_name", { length: 255 }), // Cognome madre
  motherFiscalCode: varchar("mother_fiscal_code", { length: 16 }), // Codice fiscale madre
  motherEmail: varchar("mother_email", { length: 255 }), // Email madre
  motherPhone: varchar("mother_phone", { length: 50 }), // Telefono madre
  motherMobile: varchar("mother_mobile", { length: 50 }), // Cellulare madre
  
  fatherFirstName: varchar("father_first_name", { length: 255 }), // Nome padre
  fatherLastName: varchar("father_last_name", { length: 255 }), // Cognome padre
  fatherFiscalCode: varchar("father_fiscal_code", { length: 16 }), // Codice fiscale padre
  fatherEmail: varchar("father_email", { length: 255 }), // Email padre
  fatherPhone: varchar("father_phone", { length: 50 }), // Telefono padre
  fatherMobile: varchar("father_mobile", { length: 50 }), // Cellulare padre
  
  // Indirizzo suddiviso
  streetAddress: varchar("street_address", { length: 255 }), // Via/Piazza e numero civico
  city: varchar("city", { length: 100 }), // Città
  province: varchar("province", { length: 2 }), // Provincia (sigla 2 lettere)
  postalCode: varchar("postal_code", { length: 10 }), // CAP
  country: varchar("country", { length: 100 }).default("Italia"), // Stato/Nazione
  
  address: text("address"), // Mantenuto per retrocompatibilità
  notes: text("notes"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const membersRelations = relations(members, ({ one, many }) => ({
  category: one(clientCategories, {
    fields: [members.categoryId],
    references: [clientCategories.id],
  }),
  enrollments: many(enrollments),
  memberships: many(memberships),
  medicalCertificates: many(medicalCertificates),
  payments: many(payments),
  accessLogs: many(accessLogs),
}));

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  active: z.boolean().optional(),
  hasMedicalCertificate: z.boolean().optional(),
});
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;

// Enrollments (iscrizioni ai corsi)
export const enrollments = pgTable("enrollments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  memberId: integer("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull().default("active"), // 'active', 'waitlist', 'completed', 'cancelled'
  enrollmentDate: timestamp("enrollment_date").defaultNow(),
  notes: text("notes"),
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

// Memberships (tessere associative)
export const memberships = pgTable("memberships", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  memberId: integer("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  membershipNumber: varchar("membership_number", { length: 100 }).notNull().unique(),
  previousMembershipNumber: varchar("previous_membership_number", { length: 100 }),
  barcode: varchar("barcode", { length: 100 }).notNull().unique(),
  issueDate: date("issue_date").notNull(),
  expiryDate: date("expiry_date").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("active"), // 'active', 'expired', 'suspended'
  type: varchar("type", { length: 100 }), // 'annual', 'monthly', etc.
  fee: decimal("fee", { precision: 10, scale: 2 }),
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
}).extend({
  membershipNumber: z.string().optional(),
  barcode: z.string().optional(),
});
export type InsertMembership = z.infer<typeof insertMembershipSchema>;
export type Membership = typeof memberships.$inferSelect;

// Medical Certificates
export const medicalCertificates = pgTable("medical_certificates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  memberId: integer("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
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
export const accessLogs = pgTable("access_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  memberId: integer("member_id").references(() => members.id, { onDelete: "set null" }),
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
export const paymentMethods = pgTable("payment_methods", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
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
export const payments = pgTable("payments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  memberId: integer("member_id").references(() => members.id, { onDelete: "set null" }),
  enrollmentId: integer("enrollment_id").references(() => enrollments.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // 'course', 'membership', 'other'
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // 'pending', 'paid', 'overdue', 'cancelled'
  dueDate: date("due_date"),
  paidDate: date("paid_date"),
  paymentMethodId: integer("payment_method_id").references(() => paymentMethods.id, { onDelete: "set null" }), // Riferimento a tabella payment_methods
  paymentMethod: varchar("payment_method", { length: 100 }), // Legacy - mantenuto per compatibilità
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  member: one(members, {
    fields: [payments.memberId],
    references: [members.id],
  }),
  enrollment: one(enrollments, {
    fields: [payments.enrollmentId],
    references: [enrollments.id],
  }),
  paymentMethodInfo: one(paymentMethods, {
    fields: [payments.paymentMethodId],
    references: [paymentMethods.id],
  }),
}));

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Attendances (Presenze)
export const attendances = pgTable("attendances", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  memberId: integer("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "set null" }),
  enrollmentId: integer("enrollment_id").references(() => enrollments.id, { onDelete: "set null" }),
  attendanceDate: timestamp("attendance_date").notNull().defaultNow(),
  type: varchar("type", { length: 50 }).notNull().default("manual"), // 'manual', 'barcode', 'auto'
  notes: text("notes"),
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
