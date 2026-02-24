import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  mysqlTable,
  varchar,
  text,
  longtext,
  int,
  decimal,
  timestamp,
  boolean,
  json,
  index,
  date,
  datetime,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// AUTH TABLES
// ============================================================================

export const sessions = mysqlTable(
  "sessions",
  {
    sid: varchar("sid", { length: 255 }).primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire),
  }),
);

export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: varchar("username", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  role: varchar("role", { length: 50 }).notNull().default("operator"),
  profileImageUrl: varchar("profile_image_url", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const userRoles = mysqlTable("user_roles", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  permissions: json("permissions").notNull(), // { [path: string]: 'read' | 'write' | 'hidden' }
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

// ============================================================================
// LOCATION TABLES (Countries, Provinces, Cities with CAP)
// ============================================================================

// Countries (Stati)
export const countries = mysqlTable("countries", {
  id: int("id").primaryKey().autoincrement(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  isDefault: boolean("is_default").default(false),
});

export const insertCountrySchema = createInsertSchema(countries).omit({ id: true });
export type InsertCountry = z.infer<typeof insertCountrySchema>;
export type Country = typeof countries.$inferSelect;

// Provinces (Province italiane)
export const provinces = mysqlTable("provinces", {
  id: int("id").primaryKey().autoincrement(),
  code: varchar("code", { length: 10 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  region: varchar("region", { length: 255 }),
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
  name: varchar("name", { length: 255 }).notNull(),
  provinceId: int("province_id").references(() => provinces.id, { onDelete: "cascade" }),
  postalCode: varchar("postal_code", { length: 20 }),
  istatCode: varchar("istat_code", { length: 20 }),
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
export const categories = mysqlTable("categories", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: int("parent_id"),
  color: varchar("color", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
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
export const clientCategories = mysqlTable("client_categories", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: int("parent_id"),
  color: varchar("color", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
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

// ============================================================================
// SEASONS
// ============================================================================
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
  courses: many(courses),
  workshops: many(workshops),
  enrollments: many(enrollments),
  memberships: many(memberships),
  payments: many(payments),
  attendances: many(attendances),
  studioBookings: many(studioBookings),
}));

export const insertSeasonSchema = createInsertSchema(seasons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export type InsertSeason = z.infer<typeof insertSeasonSchema>;
export type Season = typeof seasons.$inferSelect;

// Subscription Types (Tipo Iscrizione)
export const subscriptionTypes = mysqlTable("subscription_types", {
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

// Instructors
export const instructors = mysqlTable("instructors", {
  id: int("id").primaryKey().autoincrement(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 255 }),
  specialization: text("specialization"),
  bio: text("bio"),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
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
export const instructorRates = mysqlTable("instructor_rates", {
  id: int("id").primaryKey().autoincrement(),
  instructorId: int("instructor_id").notNull().references(() => instructors.id, { onDelete: "cascade" }),
  categoryId: int("category_id").references(() => categories.id, { onDelete: "set null" }),
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
export const studios = mysqlTable("studios", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  floor: varchar("floor", { length: 50 }),
  operatingHours: text("operating_hours"),
  operatingDays: text("operating_days"),
  capacity: int("capacity"),
  equipment: text("equipment"),
  notes: text("notes"),
  active: boolean("active").default(true),
  googleCalendarId: varchar("google_calendar_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
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
  sku: varchar("sku", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: int("category_id").references(() => categories.id, { onDelete: "set null" }),
  studioId: int("studio_id").references(() => studios.id, { onDelete: "set null" }),
  instructorId: int("instructor_id").references(() => instructors.id, { onDelete: "set null" }),
  secondaryInstructor1Id: int("secondary_instructor1_id").references(() => instructors.id, { onDelete: "set null" }),
  secondaryInstructor2Id: int("secondary_instructor2_id").references(() => instructors.id, { onDelete: "set null" }),
  price: decimal("price", { precision: 10, scale: 2 }),
  maxCapacity: int("max_capacity"),
  currentEnrollment: int("current_enrollment").default(0),
  dayOfWeek: varchar("day_of_week", { length: 50 }),
  startTime: varchar("start_time", { length: 20 }),
  endTime: varchar("end_time", { length: 20 }),
  recurrenceType: varchar("recurrence_type", { length: 50 }),
  schedule: text("schedule"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  active: boolean("active").default(true),
  googleEventId: varchar("google_event_id", { length: 255 }),
  seasonId: int("season_id").references(() => seasons.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
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
  season: one(seasons, {
    fields: [courses.seasonId],
    references: [seasons.id],
  }),
  enrollments: many(enrollments),
}));

export const studiosRelations = relations(studios, ({ many }) => ({
  courses: many(courses),
}));

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  currentEnrollment: z.number().optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
});
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

// ============================================================================
// WORKSHOPS (identical structure to courses)
// ============================================================================
export const workshops = mysqlTable("workshops", {
  id: int("id").primaryKey().autoincrement(),
  sku: varchar("sku", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: int("category_id").references(() => categories.id, { onDelete: "set null" }),
  studioId: int("studio_id").references(() => studios.id, { onDelete: "set null" }),
  instructorId: int("instructor_id").references(() => instructors.id, { onDelete: "set null" }),
  secondaryInstructor1Id: int("secondary_instructor1_id").references(() => instructors.id, { onDelete: "set null" }),
  secondaryInstructor2Id: int("secondary_instructor2_id").references(() => instructors.id, { onDelete: "set null" }),
  price: decimal("price", { precision: 10, scale: 2 }),
  maxCapacity: int("max_capacity"),
  currentEnrollment: int("current_enrollment").default(0),
  dayOfWeek: varchar("day_of_week", { length: 50 }),
  startTime: varchar("start_time", { length: 20 }),
  endTime: varchar("end_time", { length: 20 }),
  recurrenceType: varchar("recurrence_type", { length: 50 }),
  schedule: text("schedule"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  active: boolean("active").default(true),
  googleEventId: varchar("google_event_id", { length: 255 }),
  seasonId: int("season_id").references(() => seasons.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
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
  season: one(seasons, {
    fields: [workshops.seasonId],
    references: [seasons.id],
  }),
}));

export const insertWorkshopSchema = createInsertSchema(workshops).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  currentEnrollment: z.number().optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
});
export type InsertWorkshop = z.infer<typeof insertWorkshopSchema>;
export type Workshop = typeof workshops.$inferSelect;

// Members (iscritti)
export const members = mysqlTable("members", {
  id: int("id").primaryKey().autoincrement(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  fiscalCode: varchar("fiscal_code", { length: 16 }),
  dateOfBirth: date("date_of_birth"),
  placeOfBirth: varchar("place_of_birth", { length: 255 }),
  gender: varchar("gender", { length: 10 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 255 }),
  mobile: varchar("mobile", { length: 255 }),
  categoryId: int("category_id").references(() => clientCategories.id, { onDelete: "set null" }),
  subscriptionTypeId: int("subscription_type_id").references(() => subscriptionTypes.id, { onDelete: "set null" }),

  cardNumber: varchar("card_number", { length: 100 }),
  cardIssueDate: date("card_issue_date"),
  cardExpiryDate: date("card_expiry_date"),

  entityCardType: varchar("entity_card_type", { length: 255 }),
  entityCardNumber: varchar("entity_card_number", { length: 255 }),
  entityCardIssueDate: date("entity_card_issue_date"),
  entityCardExpiryDate: date("entity_card_expiry_date"),

  hasMedicalCertificate: boolean("has_medical_certificate").default(false),
  medicalCertificateExpiry: date("medical_certificate_expiry"),

  isMinor: boolean("is_minor").default(false),

  motherFirstName: varchar("mother_first_name", { length: 255 }),
  motherLastName: varchar("mother_last_name", { length: 255 }),
  motherFiscalCode: varchar("mother_fiscal_code", { length: 255 }),
  motherEmail: varchar("mother_email", { length: 255 }),
  motherPhone: varchar("mother_phone", { length: 255 }),
  motherMobile: varchar("mother_mobile", { length: 255 }),

  fatherFirstName: varchar("father_first_name", { length: 255 }),
  fatherLastName: varchar("father_last_name", { length: 255 }),
  fatherFiscalCode: varchar("father_fiscal_code", { length: 255 }),
  fatherEmail: varchar("father_email", { length: 255 }),
  fatherPhone: varchar("father_phone", { length: 255 }),
  fatherMobile: varchar("father_mobile", { length: 255 }),

  streetAddress: varchar("street_address", { length: 255 }),
  city: varchar("city", { length: 255 }),
  province: varchar("province", { length: 255 }),
  postalCode: varchar("postal_code", { length: 20 }),
  country: varchar("country", { length: 255 }).default("Italia"),

  address: text("address"),
  notes: text("notes"),
  photoUrl: longtext("photo_url"),
  creditBalance: decimal("credit_balance", { precision: 10, scale: 2 }).default("0.00"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
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
  isMinor: z.boolean().optional(),
  dateOfBirth: z.coerce.date().nullable().optional(),
  cardIssueDate: z.coerce.date().nullable().optional(),
  cardExpiryDate: z.coerce.date().nullable().optional(),
  entityCardIssueDate: z.coerce.date().nullable().optional(),
  entityCardExpiryDate: z.coerce.date().nullable().optional(),
  medicalCertificateExpiry: z.coerce.date().nullable().optional(),
});
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;

// Member Relationships
export const memberRelationships = mysqlTable("member_relationships", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  relatedMemberId: int("related_member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  relationshipType: varchar("relationship_type", { length: 50 }).notNull(),
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

// Enrollments
export const enrollments = mysqlTable("enrollments", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  courseId: int("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  enrollmentDate: timestamp("enrollment_date").defaultNow(),
  notes: text("notes"),
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
  season: one(seasons, {
    fields: [enrollments.seasonId],
    references: [seasons.id],
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

// Workshop Enrollments
export const workshopEnrollments = mysqlTable("workshop_enrollments", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  workshopId: int("workshop_id").notNull().references(() => workshops.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  enrollmentDate: timestamp("enrollment_date").defaultNow(),
  notes: text("notes"),
  seasonId: int("season_id").references(() => seasons.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workshopEnrollmentsRelations = relations(workshopEnrollments, ({ one }) => ({
  member: one(members, {
    fields: [workshopEnrollments.memberId],
    references: [members.id],
  }),
  workshop: one(workshops, {
    fields: [workshopEnrollments.workshopId],
    references: [workshops.id],
  }),
  season: one(seasons, {
    fields: [workshopEnrollments.seasonId],
    references: [seasons.id],
  }),
}));

export const insertWorkshopEnrollmentSchema = createInsertSchema(workshopEnrollments).omit({
  id: true,
  enrollmentDate: true,
  createdAt: true,
});
export type InsertWorkshopEnrollment = z.infer<typeof insertWorkshopEnrollmentSchema>;
export type WorkshopEnrollment = typeof workshopEnrollments.$inferSelect;

// Workshop Attendances
export const workshopAttendances = mysqlTable("workshop_attendances", {
  id: int("id").primaryKey().autoincrement(),
  workshopId: int("workshop_id").notNull().references(() => workshops.id, { onDelete: "cascade" }),
  memberId: int("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  attendanceDate: timestamp("attendance_date").notNull(),
  type: varchar("type", { length: 50 }).default("manual"),
  notes: text("notes"),
  seasonId: int("season_id").references(() => seasons.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workshopAttendancesRelations = relations(workshopAttendances, ({ one }) => ({
  workshop: one(workshops, {
    fields: [workshopAttendances.workshopId],
    references: [workshops.id],
  }),
  member: one(members, {
    fields: [workshopAttendances.memberId],
    references: [members.id],
  }),
  season: one(seasons, {
    fields: [workshopAttendances.seasonId],
    references: [seasons.id],
  }),
}));

export const insertWorkshopAttendanceSchema = createInsertSchema(workshopAttendances).omit({
  id: true,
  createdAt: true,
}).extend({
  attendanceDate: z.coerce.date(),
});
export type InsertWorkshopAttendance = z.infer<typeof insertWorkshopAttendanceSchema>;
export type WorkshopAttendance = typeof workshopAttendances.$inferSelect;

// Memberships
export const memberships = mysqlTable("memberships", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  membershipNumber: varchar("membership_number", { length: 100 }).notNull().unique(),
  previousMembershipNumber: varchar("previous_membership_number", { length: 100 }),
  barcode: varchar("barcode", { length: 100 }).notNull().unique(),
  issueDate: date("issue_date").notNull(),
  expiryDate: date("expiry_date").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  type: varchar("type", { length: 100 }),
  fee: decimal("fee", { precision: 10, scale: 2 }),
  seasonId: int("season_id").references(() => seasons.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const membershipsRelations = relations(memberships, ({ one }) => ({
  member: one(members, {
    fields: [memberships.memberId],
    references: [members.id],
  }),
  season: one(seasons, {
    fields: [memberships.seasonId],
    references: [seasons.id],
  }),
}));

export const insertMembershipSchema = createInsertSchema(memberships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  membershipNumber: z.string().optional(),
  barcode: z.string().optional(),
  issueDate: z.coerce.date(),
  expiryDate: z.coerce.date(),
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
  status: varchar("status", { length: 50 }).notNull().default("valid"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
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
}).extend({
  issueDate: z.coerce.date(),
  expiryDate: z.coerce.date(),
});
export type InsertMedicalCertificate = z.infer<typeof insertMedicalCertificateSchema>;
export type MedicalCertificate = typeof medicalCertificates.$inferSelect;

// Access Logs
export const accessLogs = mysqlTable("access_logs", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").references(() => members.id, { onDelete: "set null" }),
  barcode: varchar("barcode", { length: 100 }).notNull(),
  accessTime: timestamp("access_time").defaultNow().notNull(),
  accessType: varchar("access_type", { length: 50 }).notNull().default("entry"),
  membershipStatus: varchar("membership_status", { length: 50 }),
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

// Payment Methods
export const paymentMethods = mysqlTable("payment_methods", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
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
  enrollmentId: int("enrollment_id").references(() => enrollments.id, { onDelete: "cascade" }),
  workshopEnrollmentId: int("workshop_enrollment_id").references(() => workshopEnrollments.id, { onDelete: "cascade" }),
  bookingId: int("booking_id").references(() => studioBookings.id, { onDelete: "cascade" }),
  membershipId: int("membership_id").references(() => memberships.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  dueDate: date("due_date"),
  paidDate: datetime("paid_date"),
  paymentMethodId: int("payment_method_id").references(() => paymentMethods.id, { onDelete: "set null" }),
  paymentMethod: varchar("payment_method", { length: 100 }),
  notes: text("notes"),
  seasonId: int("season_id").references(() => seasons.id, { onDelete: "set null" }),
  createdById: varchar("created_by_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  updatedById: varchar("updated_by_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
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
  workshopEnrollment: one(workshopEnrollments, {
    fields: [payments.workshopEnrollmentId],
    references: [workshopEnrollments.id],
  }),
  booking: one(studioBookings, {
    fields: [payments.bookingId],
    references: [studioBookings.id],
  }),
  membership: one(memberships, {
    fields: [payments.membershipId],
    references: [memberships.id],
  }),
  paymentMethodInfo: one(paymentMethods, {
    fields: [payments.paymentMethodId],
    references: [paymentMethods.id],
  }),
  season: one(seasons, {
    fields: [payments.seasonId],
    references: [seasons.id],
  }),
  createdBy: one(users, {
    fields: [payments.createdById],
    references: [users.id],
  }),
  updatedBy: one(users, {
    fields: [payments.updatedById],
    references: [users.id],
  }),
}));

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dueDate: z.coerce.date().nullable().optional(),
  paidDate: z.coerce.date().nullable().optional(),
  amount: z.string().or(z.number()).transform((val) => val.toString()),
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Attendances
export const attendances = mysqlTable("attendances", {
  id: int("id").primaryKey().autoincrement(),
  memberId: int("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  courseId: int("course_id").references(() => courses.id, { onDelete: "set null" }),
  enrollmentId: int("enrollment_id").references(() => enrollments.id, { onDelete: "set null" }),
  attendanceDate: timestamp("attendance_date").notNull().defaultNow(),
  type: varchar("type", { length: 50 }).notNull().default("manual"),
  notes: text("notes"),
  seasonId: int("season_id").references(() => seasons.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
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
  season: one(seasons, {
    fields: [attendances.seasonId],
    references: [seasons.id],
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

// Custom Reports
export const customReports = mysqlTable("custom_reports", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  selectedFields: json("selected_fields").notNull().$type<string[]>(),
  filters: json("filters").$type<{ field: string; operator: string; value: string }[]>(),
  sortField: varchar("sort_field", { length: 100 }),
  sortDirection: varchar("sort_direction", { length: 10 }).default("asc"),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertCustomReportSchema = createInsertSchema(customReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCustomReport = z.infer<typeof insertCustomReportSchema>;
export type CustomReport = typeof customReports.$inferSelect;

// Import Configurations
export const importConfigs = mysqlTable("import_configs", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  sourceType: varchar("source_type", { length: 50 }).notNull(),
  fieldMapping: json("field_mapping").notNull().$type<Record<string, number>>(),
  importKey: varchar("import_key", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertImportConfigSchema = createInsertSchema(importConfigs).omit({
  id: true,
  createdAt: true,
});
export type InsertImportConfig = z.infer<typeof insertImportConfigSchema>;
export type ImportConfig = typeof importConfigs.$inferSelect;

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

// ============================================================================
// BOOKING TABLES
// ============================================================================

// Booking Services (Servizi prenotabili, es. Affitto, PT, ecc.)
export const bookingServices = mysqlTable("booking_services", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }),
  color: varchar("color", { length: 20 }),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBookingServiceSchema = createInsertSchema(bookingServices).omit({ id: true, createdAt: true });
export type InsertBookingService = z.infer<typeof insertBookingServiceSchema>;
export type BookingService = typeof bookingServices.$inferSelect;

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
  instructorId: int("instructor_id").references(() => instructors.id, { onDelete: "set null" }),
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
  instructor: one(instructors, {
    fields: [studioBookings.instructorId],
    references: [instructors.id],
  }),
  season: one(seasons, {
    fields: [studioBookings.seasonId],
    references: [seasons.id],
  }),
}));

export const insertStudioBookingSchema = createInsertSchema(studioBookings).omit({
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

