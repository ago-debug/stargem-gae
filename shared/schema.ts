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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

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
export const categories = mysqlTable("categories", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: int("parent_id"),
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

// Workshop Categories (separate category system for workshops)
export const workshopCategories = mysqlTable("ws_cats", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: int("parent_id"),
  color: varchar("color", { length: 7 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workshopCategoriesRelations = relations(workshopCategories, ({ one, many }) => ({
  parent: one(workshopCategories, {
    fields: [workshopCategories.parentId],
    references: [workshopCategories.id],
    relationName: "subcategories",
  }),
  subcategories: many(workshopCategories, { relationName: "subcategories" }),
}));

export const insertWorkshopCategorySchema = createInsertSchema(workshopCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertWorkshopCategory = z.infer<typeof insertWorkshopCategorySchema>;
export type WorkshopCategory = typeof workshopCategories.$inferSelect;

export const sundayCategories = mysqlTable("sun_cats", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: int("parent_id"),
  color: varchar("color", { length: 7 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sundayCategoriesRelations = relations(sundayCategories, ({ one, many }) => ({
  parent: one(sundayCategories, {
    fields: [sundayCategories.parentId],
    references: [sundayCategories.id],
    relationName: "subcategories",
  }),
  subcategories: many(sundayCategories, { relationName: "subcategories" }),
}));

export const insertSundayCategorySchema = createInsertSchema(sundayCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSundayCategory = z.infer<typeof insertSundayCategorySchema>;
export type SundayCategory = typeof sundayCategories.$inferSelect;

export const trainingCategories = mysqlTable("trn_cats", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: int("parent_id"),
  color: varchar("color", { length: 7 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const trainingCategoriesRelations = relations(trainingCategories, ({ one, many }) => ({
  parent: one(trainingCategories, {
    fields: [trainingCategories.parentId],
    references: [trainingCategories.id],
    relationName: "subcategories",
  }),
  subcategories: many(trainingCategories, { relationName: "subcategories" }),
}));

export const insertTrainingCategorySchema = createInsertSchema(trainingCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTrainingCategory = z.infer<typeof insertTrainingCategorySchema>;
export type TrainingCategory = typeof trainingCategories.$inferSelect;

export const individualLessonCategories = mysqlTable("ind_less_cats", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: int("parent_id"),
  color: varchar("color", { length: 7 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const individualLessonCategoriesRelations = relations(individualLessonCategories, ({ one, many }) => ({
  parent: one(individualLessonCategories, {
    fields: [individualLessonCategories.parentId],
    references: [individualLessonCategories.id],
    relationName: "subcategories",
  }),
  subcategories: many(individualLessonCategories, { relationName: "subcategories" }),
}));

export const insertIndividualLessonCategorySchema = createInsertSchema(individualLessonCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertIndividualLessonCategory = z.infer<typeof insertIndividualLessonCategorySchema>;
export type IndividualLessonCategory = typeof individualLessonCategories.$inferSelect;

export const campusCategories = mysqlTable("cmp_cats", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: int("parent_id"),
  color: varchar("color", { length: 7 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const campusCategoriesRelations = relations(campusCategories, ({ one, many }) => ({
  parent: one(campusCategories, {
    fields: [campusCategories.parentId],
    references: [campusCategories.id],
    relationName: "subcategories",
  }),
  subcategories: many(campusCategories, { relationName: "subcategories" }),
}));

export const insertCampusCategorySchema = createInsertSchema(campusCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCampusCategory = z.infer<typeof insertCampusCategorySchema>;
export type CampusCategory = typeof campusCategories.$inferSelect;

export const recitalCategories = mysqlTable("rec_cats", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: int("parent_id"),
  color: varchar("color", { length: 7 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const recitalCategoriesRelations = relations(recitalCategories, ({ one, many }) => ({
  parent: one(recitalCategories, {
    fields: [recitalCategories.parentId],
    references: [recitalCategories.id],
    relationName: "subcategories",
  }),
  subcategories: many(recitalCategories, { relationName: "subcategories" }),
}));

export const insertRecitalCategorySchema = createInsertSchema(recitalCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRecitalCategory = z.infer<typeof insertRecitalCategorySchema>;
export type RecitalCategory = typeof recitalCategories.$inferSelect;

// Vacation Study Categories (hierarchical structure for vacation study programs)
export const vacationCategories = mysqlTable("vac_cats", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: int("parent_id"),
  color: varchar("color", { length: 7 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vacationCategoriesRelations = relations(vacationCategories, ({ one, many }) => ({
  parent: one(vacationCategories, {
    fields: [vacationCategories.parentId],
    references: [vacationCategories.id],
    relationName: "subcategories",
  }),
  subcategories: many(vacationCategories, { relationName: "subcategories" }),
}));

export const insertVacationCategorySchema = createInsertSchema(vacationCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertVacationCategory = z.infer<typeof insertVacationCategorySchema>;
export type VacationCategory = typeof vacationCategories.$inferSelect;

// Client Categories (hierarchical structure for client classification)
export const clientCategories = mysqlTable("cli_cats", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: int("parent_id"),
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

// Instructor Rates (per course type or category)
export const instructorRates = mysqlTable("instr_rates", {
  id: int("id").primaryKey().autoincrement(),
  instructorId: int("instructor_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  categoryId: int("category_id"),
  rateType: varchar("rate_type", { length: 50 }).notNull(), // 'hourly', 'per_lesson', 'fixed'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const instructorRatesRelations = relations(instructorRates, ({ one }) => ({
  instructor: one(members, {
    fields: [instructorRates.instructorId],
    references: [members.id],
  }),
}));

export const insertInstructorRateSchema = createInsertSchema(instructorRates).omit({
  id: true,
  createdAt: true,
});
export type InsertInstructorRate = z.infer<typeof insertInstructorRateSchema>;
export type InstructorRate = typeof instructorRates.$inferSelect;

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
  level: varchar("level", { length: 100 }), // Livello (es. Base, Intermedio, Avanzato)
  ageGroup: varchar("age_group", { length: 100 }), // Fascia d'età (es. Bambini 3-5 anni)
  lessonType: json("lesson_type").$type<string[]>().default([]), // Tipologia Multipla (es. [Preparazione Gara, Tecnica])
  numberOfPeople: varchar("number_of_people", { length: 50 }), // Numero Persone
  statusTags: json("status_tags").$type<string[]>().default([]),
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
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  fiscalCode: varchar("fiscal_code", { length: 16 }), // Codice fiscale
  dateOfBirth: date("date_of_birth"),
  placeOfBirth: varchar("place_of_birth", { length: 255 }), // Luogo di nascita
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
  streetAddress: varchar("street_address", { length: 255 }), // Via/Piazza e numero civico
  city: varchar("city", { length: 100 }), // Città
  province: varchar("province", { length: 2 }), // Provincia (sigla 2 lettere)
  postalCode: varchar("postal_code", { length: 10 }), // CAP
  country: varchar("country", { length: 100 }).default("Italia"), // Stato/Nazione

  address: text("address"), // Mantenuto per retrocompatibilità
  notes: text("notes"),

  // Campi Insegnanti
  specialization: text("specialization"),
  bio: text("bio"),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),

  // CRM Profiling
  crmProfileLevel: varchar("crm_profile_level", { length: 20 }), // PLATINUM, GOLD, SILVER, or NONE
  crmProfileScore: int("crm_profile_score").default(0),
  crmProfileOverride: boolean("crm_profile_override").default(false),
  crmProfileReason: varchar("crm_profile_reason", { length: 255 }),

  active: boolean("active").default(true),
  createdBy: varchar("created_by", { length: 255 }),
  updatedBy: varchar("updated_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  targetDate: date("target_date"), // Riferimento temporale specifico per lezioni singole e prove
  status: varchar("status", { length: 50 }).notNull().default("active"), // 'active', 'waitlist', 'completed', 'cancelled'
  enrollmentDate: timestamp("enrollment_date").defaultNow(),
  notes: text("notes"),
  details: json("details").$type<string[]>().default([]),
  seasonId: int("season_id").references(() => seasons.id, { onDelete: "set null" }),
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
  renewalType: varchar("renewal_type", { length: 50 }), // @deprecated - mantenuto temporaneamente per retrocompatibilità
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
  seasonId: int("season_id").references(() => seasons.id, { onDelete: "set null" }),
  createdById: varchar("created_by_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
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

export const merchandisingCategories = mysqlTable("merchandising_categories", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 50 }),
  sortOrder: int("sort_order").default(0),
  active: boolean("active").default(true),
  parentId: int("parent_id"), // Self-referencing relative ID
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertMerchandisingCategorySchema = createInsertSchema(merchandisingCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMerchandisingCategory = z.infer<typeof insertMerchandisingCategorySchema>;
export type MerchandisingCategory = typeof merchandisingCategories.$inferSelect;

// ============================================================================
// RENTAL CATEGORIES (Affitti)
// ============================================================================

export const rentalCategories = mysqlTable("rental_categories", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 50 }),
  sortOrder: int("sort_order").default(0),
  active: boolean("active").default(true),
  parentId: int("parent_id"), // Self-referencing relative ID
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertRentalCategorySchema = createInsertSchema(rentalCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRentalCategory = z.infer<typeof insertRentalCategorySchema>;
export type RentalCategory = typeof rentalCategories.$inferSelect;


// ============================================================================
// BOOKING TABLES & ACTIVITY LOGS (From V59)
// ============================================================================

// Booking Service Categories
export const bookingServiceCategories = mysqlTable("booking_service_categories", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 50 }),
  icon: varchar("icon", { length: 50 }),
  sortOrder: int("sort_order").default(0),
  active: boolean("active").default(true),
  parentId: int("parent_id"), // Self-referencing relative ID
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const bookingServiceCategoriesRelations = relations(bookingServiceCategories, ({ one, many }) => ({
  parent: one(bookingServiceCategories, {
    fields: [bookingServiceCategories.parentId],
    references: [bookingServiceCategories.id],
    relationName: "subcategories",
  }),
  subcategories: many(bookingServiceCategories, { relationName: "subcategories" }),
  services: many(bookingServices),
}));

export const insertBookingServiceCategorySchema = createInsertSchema(bookingServiceCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBookingServiceCategory = z.infer<typeof insertBookingServiceCategorySchema>;
export type BookingServiceCategory = typeof bookingServiceCategories.$inferSelect;

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
export const activityCategories = mysqlTable("activity_categories", {
  id: int("id").primaryKey().autoincrement(),
  tenantId: int("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  uiRenderingType: varchar("ui_rendering_type", { length: 100 }).notNull(),
  extraInfoSchema: json("extra_info_schema"),
  isSystemDefault: boolean("is_system_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertActivityCategorySchema = createInsertSchema(activityCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertActivityCategory = z.infer<typeof insertActivityCategorySchema>;
export type ActivityCategory = typeof activityCategories.$inferSelect;

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
export type InsertPromoRule = typeof promoRules.$inferInsert;
