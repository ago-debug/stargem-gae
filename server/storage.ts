import { db } from "./db";
import { eq, desc, and, gte, lte, sql, or, isNotNull } from "drizzle-orm";
import { ilike } from "drizzle-orm";
import {
  users,
  members,
  categories,
  workshopCategories,
  sundayCategories,
  trainingCategories,
  individualLessonCategories,
  campusCategories,
  recitalCategories,
  vacationCategories,
  clientCategories,
  subscriptionTypes,
  instructors,
  studios,
  courses,
  workshops,
  memberships,
  medicalCertificates,
  paymentMethods,
  payments,
  enrollments,
  workshopEnrollments,
  workshopAttendances,
  accessLogs,
  attendances,
  countries,
  provinces,
  cities,
  memberRelationships,
  customReports,
  importConfigs,
  knowledge,
  paidTrials,
  freeTrials,
  singleLessons,
  sundayActivities,
  trainings,
  individualLessons,
  campusActivities,
  recitals,
  vacationStudies,
  activityStatuses,
  paymentNotes,
  enrollmentDetails,
  type User,
  type UpsertUser,
  type Member,
  type InsertMember,
  type Category,
  type InsertCategory,
  type WorkshopCategory,
  type InsertWorkshopCategory,
  type SundayCategory,
  type InsertSundayCategory,
  type TrainingCategory,
  type InsertTrainingCategory,
  type IndividualLessonCategory,
  type InsertIndividualLessonCategory,
  type CampusCategory,
  type InsertCampusCategory,
  type RecitalCategory,
  type InsertRecitalCategory,
  type InsertVacationCategory,
  type VacationCategory,
  type ClientCategory,
  type InsertClientCategory,
  type SubscriptionType,
  type InsertSubscriptionType,
  type Instructor,
  type InsertInstructor,
  type Studio,
  type InsertStudio,
  type Course,
  type InsertCourse,
  type Workshop,
  type InsertWorkshop,
  type Membership,
  type InsertMembership,
  type MedicalCertificate,
  type InsertMedicalCertificate,
  type PaymentMethod,
  type InsertPaymentMethod,
  type Payment,
  type InsertPayment,
  type Enrollment,
  type InsertEnrollment,
  type WorkshopEnrollment,
  type InsertWorkshopEnrollment,
  type WorkshopAttendance,
  type InsertWorkshopAttendance,
  type AccessLog,
  type InsertAccessLog,
  type Attendance,
  type InsertAttendance,
  type Country,
  type InsertCountry,
  type Province,
  type InsertProvince,
  type City,
  type InsertCity,
  type MemberRelationship,
  type InsertMemberRelationship,
  type CustomReport,
  type InsertCustomReport,
  type ImportConfig,
  type InsertImportConfig,
  type Knowledge,
  type InsertKnowledge,
  type PaidTrial,
  type InsertPaidTrial,
  type FreeTrial,
  type InsertFreeTrial,
  type SingleLesson,
  type InsertSingleLesson,
  type SundayActivity,
  type InsertSundayActivity,
  type Training,
  type InsertTraining,
  type IndividualLesson,
  type InsertIndividualLesson,
  type CampusActivity,
  type InsertCampusActivity,
  type Recital,
  type InsertRecital,
  type VacationStudy,
  type InsertVacationStudy,
  type ActivityStatus,
  type InsertActivityStatus,
  type PaymentNote,
  type InsertPaymentNote,
  type EnrollmentDetail,
  type InsertEnrollmentDetail,
  teamComments,
  teamNotes,
  teamNotifications,
  type TeamComment,
  type InsertTeamComment,
  type TeamNote,
  type InsertTeamNote,
  type TeamNotification,
  type InsertTeamNotification,
} from "@shared/schema";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Members
  getMembers(): Promise<Member[]>;
  getMembersPaginated(page: number, pageSize: number, search?: string): Promise<{ members: (Member & { activeCourseCount: number })[]; total: number }>;
  getMembersWithEntityCards(): Promise<Member[]>;
  getMember(id: number): Promise<Member | undefined>;
  getMemberByFiscalCode(fiscalCode: string): Promise<Member | undefined>;
  getDuplicateFiscalCodes(): Promise<{ fiscalCode: string; members: { id: number; firstName: string; lastName: string; }[] }[]>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: number, member: Partial<InsertMember>): Promise<Member>;
  deleteMember(id: number): Promise<void>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Workshop Categories
  getWorkshopCategories(): Promise<WorkshopCategory[]>;
  getWorkshopCategory(id: number): Promise<WorkshopCategory | undefined>;
  createWorkshopCategory(category: InsertWorkshopCategory): Promise<WorkshopCategory>;
  updateWorkshopCategory(id: number, category: Partial<InsertWorkshopCategory>): Promise<WorkshopCategory>;
  deleteWorkshopCategory(id: number): Promise<void>;

  getSundayCategories(): Promise<SundayCategory[]>;
  getSundayCategory(id: number): Promise<SundayCategory | undefined>;
  createSundayCategory(category: InsertSundayCategory): Promise<SundayCategory>;
  updateSundayCategory(id: number, category: Partial<InsertSundayCategory>): Promise<SundayCategory>;
  deleteSundayCategory(id: number): Promise<void>;

  getTrainingCategories(): Promise<TrainingCategory[]>;
  getTrainingCategory(id: number): Promise<TrainingCategory | undefined>;
  createTrainingCategory(category: InsertTrainingCategory): Promise<TrainingCategory>;
  updateTrainingCategory(id: number, category: Partial<InsertTrainingCategory>): Promise<TrainingCategory>;
  deleteTrainingCategory(id: number): Promise<void>;

  getIndividualLessonCategories(): Promise<IndividualLessonCategory[]>;
  getIndividualLessonCategory(id: number): Promise<IndividualLessonCategory | undefined>;
  createIndividualLessonCategory(category: InsertIndividualLessonCategory): Promise<IndividualLessonCategory>;
  updateIndividualLessonCategory(id: number, category: Partial<InsertIndividualLessonCategory>): Promise<IndividualLessonCategory>;
  deleteIndividualLessonCategory(id: number): Promise<void>;

  getCampusCategories(): Promise<CampusCategory[]>;
  getCampusCategory(id: number): Promise<CampusCategory | undefined>;
  createCampusCategory(category: InsertCampusCategory): Promise<CampusCategory>;
  updateCampusCategory(id: number, category: Partial<InsertCampusCategory>): Promise<CampusCategory>;
  deleteCampusCategory(id: number): Promise<void>;

  getRecitalCategories(): Promise<RecitalCategory[]>;
  getRecitalCategory(id: number): Promise<RecitalCategory | undefined>;
  createRecitalCategory(category: InsertRecitalCategory): Promise<RecitalCategory>;
  updateRecitalCategory(id: number, category: Partial<InsertRecitalCategory>): Promise<RecitalCategory>;
  deleteRecitalCategory(id: number): Promise<void>;

  // Vacation Study Categories
  getVacationCategories(): Promise<VacationCategory[]>;
  getVacationCategory(id: number): Promise<VacationCategory | undefined>;
  createVacationCategory(category: InsertVacationCategory): Promise<VacationCategory>;
  updateVacationCategory(id: number, category: Partial<InsertVacationCategory>): Promise<VacationCategory>;
  deleteVacationCategory(id: number): Promise<void>;

  // Client Categories
  getClientCategories(): Promise<ClientCategory[]>;
  getClientCategory(id: number): Promise<ClientCategory | undefined>;
  createClientCategory(category: InsertClientCategory): Promise<ClientCategory>;
  updateClientCategory(id: number, category: Partial<InsertClientCategory>): Promise<ClientCategory>;
  deleteClientCategory(id: number): Promise<void>;

  // Subscription Types
  getSubscriptionTypes(): Promise<SubscriptionType[]>;
  getSubscriptionType(id: number): Promise<SubscriptionType | undefined>;
  createSubscriptionType(subscriptionType: InsertSubscriptionType): Promise<SubscriptionType>;
  updateSubscriptionType(id: number, subscriptionType: Partial<InsertSubscriptionType>): Promise<SubscriptionType>;
  deleteSubscriptionType(id: number): Promise<void>;

  // Instructors
  getInstructors(): Promise<Instructor[]>;
  getInstructor(id: number): Promise<Instructor | undefined>;
  createInstructor(instructor: InsertInstructor): Promise<Instructor>;
  updateInstructor(id: number, instructor: Partial<InsertInstructor>): Promise<Instructor>;
  deleteInstructor(id: number): Promise<void>;

  // Studios
  getStudios(): Promise<Studio[]>;
  getStudio(id: number): Promise<Studio | undefined>;
  createStudio(studio: InsertStudio): Promise<Studio>;
  updateStudio(id: number, studio: Partial<InsertStudio>): Promise<Studio>;
  deleteStudio(id: number): Promise<void>;

  // Courses
  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course>;
  deleteCourse(id: number): Promise<void>;

  // Workshops
  getWorkshops(): Promise<Workshop[]>;
  getWorkshop(id: number): Promise<Workshop | undefined>;
  createWorkshop(workshop: InsertWorkshop): Promise<Workshop>;
  updateWorkshop(id: number, workshop: Partial<InsertWorkshop>): Promise<Workshop>;
  deleteWorkshop(id: number): Promise<void>;

  // Paid Trials
  getPaidTrials(): Promise<PaidTrial[]>;
  getPaidTrialById(id: number): Promise<PaidTrial | undefined>;
  createPaidTrial(item: InsertPaidTrial): Promise<PaidTrial>;
  updatePaidTrial(id: number, item: Partial<InsertPaidTrial>): Promise<PaidTrial>;
  deletePaidTrial(id: number): Promise<void>;

  // Free Trials
  getFreeTrials(): Promise<FreeTrial[]>;
  getFreeTrialById(id: number): Promise<FreeTrial | undefined>;
  createFreeTrial(item: InsertFreeTrial): Promise<FreeTrial>;
  updateFreeTrial(id: number, item: Partial<InsertFreeTrial>): Promise<FreeTrial>;
  deleteFreeTrial(id: number): Promise<void>;

  // Single Lessons
  getSingleLessons(): Promise<SingleLesson[]>;
  getSingleLessonById(id: number): Promise<SingleLesson | undefined>;
  createSingleLesson(item: InsertSingleLesson): Promise<SingleLesson>;
  updateSingleLesson(id: number, item: Partial<InsertSingleLesson>): Promise<SingleLesson>;
  deleteSingleLesson(id: number): Promise<void>;

  // Sunday Activities
  getSundayActivities(): Promise<SundayActivity[]>;
  getSundayActivityById(id: number): Promise<SundayActivity | undefined>;
  createSundayActivity(item: InsertSundayActivity): Promise<SundayActivity>;
  updateSundayActivity(id: number, item: Partial<InsertSundayActivity>): Promise<SundayActivity>;
  deleteSundayActivity(id: number): Promise<void>;

  // Trainings
  getTrainings(): Promise<Training[]>;
  getTrainingById(id: number): Promise<Training | undefined>;
  createTraining(item: InsertTraining): Promise<Training>;
  updateTraining(id: number, item: Partial<InsertTraining>): Promise<Training>;
  deleteTraining(id: number): Promise<void>;

  // Individual Lessons
  getIndividualLessons(): Promise<IndividualLesson[]>;
  getIndividualLessonById(id: number): Promise<IndividualLesson | undefined>;
  createIndividualLesson(item: InsertIndividualLesson): Promise<IndividualLesson>;
  updateIndividualLesson(id: number, item: Partial<InsertIndividualLesson>): Promise<IndividualLesson>;
  deleteIndividualLesson(id: number): Promise<void>;

  // Campus Activities
  getCampusActivities(): Promise<CampusActivity[]>;
  getCampusActivityById(id: number): Promise<CampusActivity | undefined>;
  createCampusActivity(item: InsertCampusActivity): Promise<CampusActivity>;
  updateCampusActivity(id: number, item: Partial<InsertCampusActivity>): Promise<CampusActivity>;
  deleteCampusActivity(id: number): Promise<void>;

  // Recitals
  getRecitals(): Promise<Recital[]>;
  getRecitalById(id: number): Promise<Recital | undefined>;
  createRecital(item: InsertRecital): Promise<Recital>;
  updateRecital(id: number, item: Partial<InsertRecital>): Promise<Recital>;
  deleteRecital(id: number): Promise<void>;

  // Vacation Studies
  getVacationStudies(): Promise<VacationStudy[]>;
  getVacationStudyById(id: number): Promise<VacationStudy | undefined>;
  createVacationStudy(item: InsertVacationStudy): Promise<VacationStudy>;
  updateVacationStudy(id: number, item: Partial<InsertVacationStudy>): Promise<VacationStudy>;
  deleteVacationStudy(id: number): Promise<void>;

  // Memberships
  getMemberships(): Promise<Membership[]>;
  getMembershipsWithMembers(): Promise<(Membership & { memberFirstName?: string; memberLastName?: string; memberFiscalCode?: string })[]>;
  getMembership(id: number): Promise<Membership | undefined>;
  getMembershipByBarcode(barcode: string): Promise<Membership | undefined>;
  getMembershipsByMemberId(memberId: number): Promise<Membership[]>;
  createMembership(membership: InsertMembership): Promise<Membership>;
  updateMembership(id: number, membership: Partial<InsertMembership>): Promise<Membership>;
  deleteMembership(id: number): Promise<void>;

  // Medical Certificates
  getMedicalCertificates(): Promise<MedicalCertificate[]>;
  getMedicalCertificatesWithMembers(): Promise<(MedicalCertificate & { memberFirstName?: string; memberLastName?: string; memberFiscalCode?: string })[]>;
  getMedicalCertificatesByMemberId(memberId: number): Promise<MedicalCertificate[]>;
  getMedicalCertificate(id: number): Promise<MedicalCertificate | undefined>;
  createMedicalCertificate(cert: InsertMedicalCertificate): Promise<MedicalCertificate>;
  updateMedicalCertificate(id: number, cert: Partial<InsertMedicalCertificate>): Promise<MedicalCertificate>;
  deleteMedicalCertificate(id: number): Promise<void>;

  // Payment Methods
  getPaymentMethods(): Promise<PaymentMethod[]>;
  getPaymentMethod(id: number): Promise<PaymentMethod | undefined>;
  createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: number, method: Partial<InsertPaymentMethod>): Promise<PaymentMethod>;
  deletePaymentMethod(id: number): Promise<void>;

  // Payments
  getPayments(): Promise<Payment[]>;
  getPaymentsWithMembers(): Promise<(Payment & { memberFirstName?: string; memberLastName?: string })[]>;
  getPaymentsByMemberId(memberId: number): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment>;
  deletePayment(id: number): Promise<void>;

  // Enrollments
  getEnrollments(): Promise<(Enrollment & { memberFirstName?: string | null; memberLastName?: string | null; memberEmail?: string | null; memberFiscalCode?: string | null })[]>;
  getEnrollmentsByMember(memberId: number): Promise<Enrollment[]>;
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollment: Partial<InsertEnrollment>): Promise<Enrollment>;
  deleteEnrollment(id: number): Promise<void>;

  // Access Logs
  getAccessLogs(limit?: number): Promise<(AccessLog & { memberFirstName?: string | null; memberLastName?: string | null })[]>;
  createAccessLog(log: InsertAccessLog): Promise<AccessLog>;

  // Attendances
  getAttendances(): Promise<(Attendance & { memberFirstName?: string | null; memberLastName?: string | null; memberFiscalCode?: string | null })[]>;
  getAttendance(id: number): Promise<Attendance | undefined>;
  getAttendancesByMember(memberId: number): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  deleteAttendance(id: number): Promise<void>;

  // Workshop Enrollments
  getWorkshopEnrollments(): Promise<(WorkshopEnrollment & { memberFirstName?: string | null; memberLastName?: string | null; memberEmail?: string | null; memberFiscalCode?: string | null })[]>;
  getWorkshopEnrollmentsByMember(memberId: number): Promise<WorkshopEnrollment[]>;
  getWorkshopEnrollment(id: number): Promise<WorkshopEnrollment | undefined>;
  createWorkshopEnrollment(enrollment: InsertWorkshopEnrollment): Promise<WorkshopEnrollment>;
  updateWorkshopEnrollment(id: number, enrollment: Partial<InsertWorkshopEnrollment>): Promise<WorkshopEnrollment>;
  deleteWorkshopEnrollment(id: number): Promise<void>;

  // Workshop Attendances
  getWorkshopAttendances(): Promise<WorkshopAttendance[]>;
  getWorkshopAttendance(id: number): Promise<WorkshopAttendance | undefined>;
  createWorkshopAttendance(attendance: InsertWorkshopAttendance): Promise<WorkshopAttendance>;
  deleteWorkshopAttendance(id: number): Promise<void>;

  // Member Relationships (genitori/tutori)
  getMemberRelationships(memberId: number): Promise<MemberRelationship[]>;
  getMemberChildren(memberId: number): Promise<MemberRelationship[]>;
  createMemberRelationship(relationship: InsertMemberRelationship): Promise<MemberRelationship>;
  deleteMemberRelationship(id: number): Promise<void>;

  // Locations (Countries, Provinces, Cities)
  getCountries(): Promise<Country[]>;
  createCountry(country: InsertCountry): Promise<Country>;
  getProvinces(countryId?: number): Promise<Province[]>;
  createProvince(province: InsertProvince): Promise<Province>;
  searchCities(search: string, limit?: number): Promise<(City & { province?: Province })[]>;
  getCitiesByProvince(provinceId: number): Promise<City[]>;
  createCity(city: InsertCity): Promise<City>;

  // Custom Reports
  getCustomReports(): Promise<CustomReport[]>;
  getCustomReport(id: number): Promise<CustomReport | undefined>;
  createCustomReport(report: InsertCustomReport): Promise<CustomReport>;
  updateCustomReport(id: number, report: Partial<InsertCustomReport>): Promise<CustomReport>;
  deleteCustomReport(id: number): Promise<void>;

  // Import Configurations
  getImportConfigs(entityType?: string, sourceType?: string): Promise<ImportConfig[]>;
  getImportConfig(id: number): Promise<ImportConfig | undefined>;
  createImportConfig(config: InsertImportConfig): Promise<ImportConfig>;
  deleteImportConfig(id: number): Promise<void>;

  // Activity Statuses
  getActivityStatuses(): Promise<ActivityStatus[]>;
  getActivityStatus(id: number): Promise<ActivityStatus | undefined>;
  createActivityStatus(status: InsertActivityStatus): Promise<ActivityStatus>;
  updateActivityStatus(id: number, status: Partial<InsertActivityStatus>): Promise<ActivityStatus>;
  deleteActivityStatus(id: number): Promise<void>;

  // Payment Notes
  getPaymentNotes(): Promise<PaymentNote[]>;
  getPaymentNote(id: number): Promise<PaymentNote | undefined>;
  createPaymentNote(note: InsertPaymentNote): Promise<PaymentNote>;
  updatePaymentNote(id: number, note: Partial<InsertPaymentNote>): Promise<PaymentNote>;
  deletePaymentNote(id: number): Promise<void>;

  // Enrollment Details
  getEnrollmentDetails(): Promise<EnrollmentDetail[]>;
  getEnrollmentDetail(id: number): Promise<EnrollmentDetail | undefined>;
  createEnrollmentDetail(detail: InsertEnrollmentDetail): Promise<EnrollmentDetail>;
  updateEnrollmentDetail(id: number, detail: Partial<InsertEnrollmentDetail>): Promise<EnrollmentDetail>;
  deleteEnrollmentDetail(id: number): Promise<void>;

  // Team Comments
  getTeamComments(): Promise<TeamComment[]>;
  getTeamComment(id: number): Promise<TeamComment | undefined>;
  createTeamComment(comment: InsertTeamComment): Promise<TeamComment>;
  updateTeamComment(id: number, comment: Partial<InsertTeamComment>): Promise<TeamComment>;
  deleteTeamComment(id: number): Promise<void>;

  // Team Notes
  getTeamNotes(): Promise<TeamNote[]>;
  getTeamNote(id: number): Promise<TeamNote | undefined>;
  createTeamNote(note: InsertTeamNote): Promise<TeamNote>;
  updateTeamNote(id: number, note: Partial<InsertTeamNote>): Promise<TeamNote>;
  deleteTeamNote(id: number): Promise<void>;

  // Team Notifications
  getTeamNotifications(userId: string): Promise<TeamNotification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createTeamNotification(notification: InsertTeamNotification): Promise<TeamNotification>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // ==== User operations (required for Replit Auth) ====
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // ==== Members ====
  async getMembers(): Promise<Member[]> {
    return await db.select().from(members).orderBy(desc(members.createdAt));
  }

  async getMembersWithEntityCards(): Promise<Member[]> {
    return await db.select().from(members)
      .where(
        or(
          isNotNull(members.entityCardNumber),
          isNotNull(members.entityCardType)
        )
      )
      .orderBy(members.lastName, members.firstName);
  }

  async getMembersPaginated(page: number, pageSize: number, search?: string): Promise<{ members: (Member & { activeCourseCount: number })[]; total: number }> {
    const offset = (page - 1) * pageSize;
    
    let searchCondition = sql`1=1`;
    if (search && search.trim().length >= 2) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      searchCondition = sql`(
        LOWER(first_name) LIKE ${searchTerm} OR 
        LOWER(last_name) LIKE ${searchTerm} OR 
        LOWER(email) LIKE ${searchTerm} OR 
        LOWER(fiscal_code) LIKE ${searchTerm} OR
        LOWER(card_number) LIKE ${searchTerm} OR
        LOWER(first_name || ' ' || last_name) LIKE ${searchTerm} OR
        LOWER(last_name || ' ' || first_name) LIKE ${searchTerm}
      )`;
    }
    
    // Use raw SQL for the complete query with subquery
    const result = await db.execute(sql`
      SELECT 
        m.*,
        COALESCE((
          SELECT COUNT(*)::int 
          FROM enrollments e 
          WHERE e.member_id = m.id AND e.status = 'active'
        ), 0) as active_course_count
      FROM members m
      WHERE ${searchCondition}
      ORDER BY m.last_name, m.first_name
      LIMIT ${pageSize}
      OFFSET ${offset}
    `);
    
    // Count query
    const countResult = await db.execute(sql`
      SELECT COUNT(*)::int as count FROM members WHERE ${searchCondition}
    `);
    const total = Number((countResult.rows[0] as any)?.count || 0);
    
    // Map snake_case to camelCase
    const membersList = result.rows.map((row: any) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      mobile: row.mobile,
      fiscalCode: row.fiscal_code,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      placeOfBirth: row.place_of_birth,
      street: row.street,
      city: row.city,
      province: row.province,
      postalCode: row.postal_code,
      country: row.country,
      notes: row.notes,
      parentFirstName: row.parent_first_name,
      parentLastName: row.parent_last_name,
      parentFiscalCode: row.parent_fiscal_code,
      parentPhone: row.parent_phone,
      parentEmail: row.parent_email,
      hasMedicalCertificate: row.has_medical_certificate,
      medicalCertificateExpiry: row.medical_certificate_expiry,
      cardNumber: row.card_number,
      cardExpiryDate: row.card_expiry_date,
      active: row.active,
      createdAt: row.created_at,
      categoryId: row.category_id,
      activeCourseCount: row.active_course_count || 0,
    }));
    
    return { members: membersList as (Member & { activeCourseCount: number })[], total };
  }

  async getMember(id: number): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member;
  }

  async getMemberByFiscalCode(fiscalCode: string): Promise<Member | undefined> {
    if (!fiscalCode) return undefined;
    // Use case-insensitive comparison since existing data may be mixed case
    const [member] = await db.select().from(members).where(
      sql`UPPER(${members.fiscalCode}) = ${fiscalCode.toUpperCase()}`
    );
    return member;
  }

  async getDuplicateFiscalCodes(): Promise<{ fiscalCode: string; members: { id: number; firstName: string; lastName: string; }[] }[]> {
    // Find all fiscal codes that appear more than once
    const duplicates = await db.execute(sql`
      SELECT UPPER(fiscal_code) as fiscal_code, 
             json_agg(json_build_object('id', id, 'firstName', first_name, 'lastName', last_name)) as members
      FROM members 
      WHERE fiscal_code IS NOT NULL AND fiscal_code != ''
      GROUP BY UPPER(fiscal_code)
      HAVING COUNT(*) > 1
      ORDER BY UPPER(fiscal_code)
    `);
    
    return duplicates.rows.map((row: any) => ({
      fiscalCode: row.fiscal_code,
      members: row.members
    }));
  }

  async createMember(member: InsertMember): Promise<Member> {
    const [newMember] = await db.insert(members).values(member).returning();
    
    // Sync membership if card data exists
    if (newMember.cardNumber) {
      await this.syncMembershipFromMember(newMember);
    }
    
    // Sync medical certificate if data exists
    if (newMember.hasMedicalCertificate) {
      await this.syncMedicalCertificateFromMember(newMember);
    }
    
    return newMember;
  }

  async updateMember(id: number, member: Partial<InsertMember>): Promise<Member> {
    const [updated] = await db
      .update(members)
      .set({ ...member, updatedAt: new Date() })
      .where(eq(members.id, id))
      .returning();
    
    // Sync membership if card data exists or was updated
    if (member.cardNumber !== undefined || member.cardIssueDate !== undefined || member.cardExpiryDate !== undefined) {
      await this.syncMembershipFromMember(updated);
    }
    
    // Sync medical certificate if data exists or was updated
    if (member.hasMedicalCertificate !== undefined || member.medicalCertificateExpiry !== undefined) {
      await this.syncMedicalCertificateFromMember(updated);
    }
    
    return updated;
  }

  async deleteMember(id: number): Promise<void> {
    await db.delete(members).where(eq(members.id, id));
  }

  // ==== Categories ====
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    const [updated] = await db
      .update(categories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updated;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // ==== Workshop Categories ====
  async getWorkshopCategories(): Promise<WorkshopCategory[]> {
    return await db.select().from(workshopCategories).orderBy(workshopCategories.name);
  }

  async getWorkshopCategory(id: number): Promise<WorkshopCategory | undefined> {
    const [category] = await db.select().from(workshopCategories).where(eq(workshopCategories.id, id));
    return category;
  }

  async createWorkshopCategory(category: InsertWorkshopCategory): Promise<WorkshopCategory> {
    const [newCategory] = await db.insert(workshopCategories).values(category).returning();
    return newCategory;
  }

  async updateWorkshopCategory(id: number, category: Partial<InsertWorkshopCategory>): Promise<WorkshopCategory> {
    const [updated] = await db
      .update(workshopCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(workshopCategories.id, id))
      .returning();
    return updated;
  }

  async deleteWorkshopCategory(id: number): Promise<void> {
    await db.delete(workshopCategories).where(eq(workshopCategories.id, id));
  }

  async getSundayCategories(): Promise<SundayCategory[]> {
    return await db.select().from(sundayCategories).orderBy(sundayCategories.name);
  }

  async getSundayCategory(id: number): Promise<SundayCategory | undefined> {
    const [category] = await db.select().from(sundayCategories).where(eq(sundayCategories.id, id));
    return category;
  }

  async createSundayCategory(category: InsertSundayCategory): Promise<SundayCategory> {
    const [newCategory] = await db.insert(sundayCategories).values(category).returning();
    return newCategory;
  }

  async updateSundayCategory(id: number, category: Partial<InsertSundayCategory>): Promise<SundayCategory> {
    const [updated] = await db
      .update(sundayCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(sundayCategories.id, id))
      .returning();
    return updated;
  }

  async deleteSundayCategory(id: number): Promise<void> {
    await db.delete(sundayCategories).where(eq(sundayCategories.id, id));
  }

  async getTrainingCategories(): Promise<TrainingCategory[]> {
    return await db.select().from(trainingCategories).orderBy(trainingCategories.name);
  }

  async getTrainingCategory(id: number): Promise<TrainingCategory | undefined> {
    const [category] = await db.select().from(trainingCategories).where(eq(trainingCategories.id, id));
    return category;
  }

  async createTrainingCategory(category: InsertTrainingCategory): Promise<TrainingCategory> {
    const [newCategory] = await db.insert(trainingCategories).values(category).returning();
    return newCategory;
  }

  async updateTrainingCategory(id: number, category: Partial<InsertTrainingCategory>): Promise<TrainingCategory> {
    const [updated] = await db
      .update(trainingCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(trainingCategories.id, id))
      .returning();
    return updated;
  }

  async deleteTrainingCategory(id: number): Promise<void> {
    await db.delete(trainingCategories).where(eq(trainingCategories.id, id));
  }

  async getIndividualLessonCategories(): Promise<IndividualLessonCategory[]> {
    return await db.select().from(individualLessonCategories).orderBy(individualLessonCategories.name);
  }

  async getIndividualLessonCategory(id: number): Promise<IndividualLessonCategory | undefined> {
    const [category] = await db.select().from(individualLessonCategories).where(eq(individualLessonCategories.id, id));
    return category;
  }

  async createIndividualLessonCategory(category: InsertIndividualLessonCategory): Promise<IndividualLessonCategory> {
    const [newCategory] = await db.insert(individualLessonCategories).values(category).returning();
    return newCategory;
  }

  async updateIndividualLessonCategory(id: number, category: Partial<InsertIndividualLessonCategory>): Promise<IndividualLessonCategory> {
    const [updated] = await db
      .update(individualLessonCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(individualLessonCategories.id, id))
      .returning();
    return updated;
  }

  async deleteIndividualLessonCategory(id: number): Promise<void> {
    await db.delete(individualLessonCategories).where(eq(individualLessonCategories.id, id));
  }

  async getCampusCategories(): Promise<CampusCategory[]> {
    return await db.select().from(campusCategories).orderBy(campusCategories.name);
  }

  async getCampusCategory(id: number): Promise<CampusCategory | undefined> {
    const [category] = await db.select().from(campusCategories).where(eq(campusCategories.id, id));
    return category;
  }

  async createCampusCategory(category: InsertCampusCategory): Promise<CampusCategory> {
    const [newCategory] = await db.insert(campusCategories).values(category).returning();
    return newCategory;
  }

  async updateCampusCategory(id: number, category: Partial<InsertCampusCategory>): Promise<CampusCategory> {
    const [updated] = await db
      .update(campusCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(campusCategories.id, id))
      .returning();
    return updated;
  }

  async deleteCampusCategory(id: number): Promise<void> {
    await db.delete(campusCategories).where(eq(campusCategories.id, id));
  }

  async getRecitalCategories(): Promise<RecitalCategory[]> {
    return await db.select().from(recitalCategories).orderBy(recitalCategories.name);
  }

  async getRecitalCategory(id: number): Promise<RecitalCategory | undefined> {
    const [category] = await db.select().from(recitalCategories).where(eq(recitalCategories.id, id));
    return category;
  }

  async createRecitalCategory(category: InsertRecitalCategory): Promise<RecitalCategory> {
    const [newCategory] = await db.insert(recitalCategories).values(category).returning();
    return newCategory;
  }

  async updateRecitalCategory(id: number, category: Partial<InsertRecitalCategory>): Promise<RecitalCategory> {
    const [updated] = await db
      .update(recitalCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(recitalCategories.id, id))
      .returning();
    return updated;
  }

  async deleteRecitalCategory(id: number): Promise<void> {
    await db.delete(recitalCategories).where(eq(recitalCategories.id, id));
  }

  // ==== Vacation Study Categories ====
  async getVacationCategories(): Promise<VacationCategory[]> {
    return await db.select().from(vacationCategories).orderBy(vacationCategories.name);
  }

  async getVacationCategory(id: number): Promise<VacationCategory | undefined> {
    const [category] = await db.select().from(vacationCategories).where(eq(vacationCategories.id, id));
    return category;
  }

  async createVacationCategory(category: InsertVacationCategory): Promise<VacationCategory> {
    const [newCategory] = await db.insert(vacationCategories).values(category).returning();
    return newCategory;
  }

  async updateVacationCategory(id: number, category: Partial<InsertVacationCategory>): Promise<VacationCategory> {
    const [updated] = await db
      .update(vacationCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(vacationCategories.id, id))
      .returning();
    return updated;
  }

  async deleteVacationCategory(id: number): Promise<void> {
    await db.delete(vacationCategories).where(eq(vacationCategories.id, id));
  }

  // ==== Client Categories ====
  async getClientCategories(): Promise<ClientCategory[]> {
    return await db.select().from(clientCategories).orderBy(clientCategories.name);
  }

  async getClientCategory(id: number): Promise<ClientCategory | undefined> {
    const [category] = await db.select().from(clientCategories).where(eq(clientCategories.id, id));
    return category;
  }

  async createClientCategory(category: InsertClientCategory): Promise<ClientCategory> {
    const [newCategory] = await db.insert(clientCategories).values(category).returning();
    return newCategory;
  }

  async updateClientCategory(id: number, category: Partial<InsertClientCategory>): Promise<ClientCategory> {
    const [updated] = await db
      .update(clientCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(clientCategories.id, id))
      .returning();
    return updated;
  }

  async deleteClientCategory(id: number): Promise<void> {
    await db.delete(clientCategories).where(eq(clientCategories.id, id));
  }

  // ==== Subscription Types ====
  async getSubscriptionTypes(): Promise<SubscriptionType[]> {
    return await db.select().from(subscriptionTypes).orderBy(subscriptionTypes.name);
  }

  async getSubscriptionType(id: number): Promise<SubscriptionType | undefined> {
    const [subscriptionType] = await db.select().from(subscriptionTypes).where(eq(subscriptionTypes.id, id));
    return subscriptionType;
  }

  async createSubscriptionType(subscriptionType: InsertSubscriptionType): Promise<SubscriptionType> {
    const [newSubscriptionType] = await db.insert(subscriptionTypes).values(subscriptionType).returning();
    return newSubscriptionType;
  }

  async updateSubscriptionType(id: number, data: Partial<InsertSubscriptionType>): Promise<SubscriptionType> {
    const [updated] = await db
      .update(subscriptionTypes)
      .set(data)
      .where(eq(subscriptionTypes.id, id))
      .returning();
    return updated;
  }

  async deleteSubscriptionType(id: number): Promise<void> {
    await db.delete(subscriptionTypes).where(eq(subscriptionTypes.id, id));
  }

  // ==== Instructors ====
  async getInstructors(): Promise<Instructor[]> {
    return await db.select().from(instructors).orderBy(instructors.lastName, instructors.firstName);
  }

  async getInstructor(id: number): Promise<Instructor | undefined> {
    const [instructor] = await db.select().from(instructors).where(eq(instructors.id, id));
    return instructor;
  }

  async createInstructor(instructor: InsertInstructor): Promise<Instructor> {
    const [newInstructor] = await db.insert(instructors).values(instructor).returning();
    return newInstructor;
  }

  async updateInstructor(id: number, instructor: Partial<InsertInstructor>): Promise<Instructor> {
    const [updated] = await db
      .update(instructors)
      .set({ ...instructor, updatedAt: new Date() })
      .where(eq(instructors.id, id))
      .returning();
    return updated;
  }

  async deleteInstructor(id: number): Promise<void> {
    await db.delete(instructors).where(eq(instructors.id, id));
  }

  // ==== Studios ====
  async getStudios(): Promise<Studio[]> {
    return db.select().from(studios).orderBy(studios.name);
  }

  async getStudio(id: number): Promise<Studio | undefined> {
    const [studio] = await db.select().from(studios).where(eq(studios.id, id));
    return studio;
  }

  async createStudio(studioData: InsertStudio): Promise<Studio> {
    const [studio] = await db
      .insert(studios)
      .values(studioData)
      .returning();
    return studio;
  }

  async updateStudio(id: number, studioData: Partial<InsertStudio>): Promise<Studio> {
    const [studio] = await db
      .update(studios)
      .set(studioData)
      .where(eq(studios.id, id))
      .returning();
    return studio;
  }

  async deleteStudio(id: number): Promise<void> {
    await db.delete(studios).where(eq(studios.id, id));
  }

  // ==== Courses ====
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(desc(courses.createdAt));
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course> {
    const [updated] = await db
      .update(courses)
      .set({ ...course, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updated;
  }

  async deleteCourse(id: number): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  // ==== Workshops ====
  async getWorkshops(): Promise<Workshop[]> {
    return await db.select().from(workshops).orderBy(desc(workshops.createdAt));
  }

  async getWorkshop(id: number): Promise<Workshop | undefined> {
    const [workshop] = await db.select().from(workshops).where(eq(workshops.id, id));
    return workshop;
  }

  async createWorkshop(workshop: InsertWorkshop): Promise<Workshop> {
    const [newWorkshop] = await db.insert(workshops).values(workshop).returning();
    return newWorkshop;
  }

  async updateWorkshop(id: number, workshop: Partial<InsertWorkshop>): Promise<Workshop> {
    const [updated] = await db
      .update(workshops)
      .set({ ...workshop, updatedAt: new Date() })
      .where(eq(workshops.id, id))
      .returning();
    return updated;
  }

  async deleteWorkshop(id: number): Promise<void> {
    await db.delete(workshops).where(eq(workshops.id, id));
  }

  // ==== Paid Trials ====
  async getPaidTrials(): Promise<PaidTrial[]> {
    return await db.select().from(paidTrials).orderBy(desc(paidTrials.createdAt));
  }
  async getPaidTrialById(id: number): Promise<PaidTrial | undefined> {
    const [item] = await db.select().from(paidTrials).where(eq(paidTrials.id, id));
    return item;
  }
  async createPaidTrial(item: InsertPaidTrial): Promise<PaidTrial> {
    const [newItem] = await db.insert(paidTrials).values(item).returning();
    return newItem;
  }
  async updatePaidTrial(id: number, item: Partial<InsertPaidTrial>): Promise<PaidTrial> {
    const [updated] = await db.update(paidTrials).set({ ...item, updatedAt: new Date() }).where(eq(paidTrials.id, id)).returning();
    return updated;
  }
  async deletePaidTrial(id: number): Promise<void> {
    await db.delete(paidTrials).where(eq(paidTrials.id, id));
  }

  // ==== Free Trials ====
  async getFreeTrials(): Promise<FreeTrial[]> {
    return await db.select().from(freeTrials).orderBy(desc(freeTrials.createdAt));
  }
  async getFreeTrialById(id: number): Promise<FreeTrial | undefined> {
    const [item] = await db.select().from(freeTrials).where(eq(freeTrials.id, id));
    return item;
  }
  async createFreeTrial(item: InsertFreeTrial): Promise<FreeTrial> {
    const [newItem] = await db.insert(freeTrials).values(item).returning();
    return newItem;
  }
  async updateFreeTrial(id: number, item: Partial<InsertFreeTrial>): Promise<FreeTrial> {
    const [updated] = await db.update(freeTrials).set({ ...item, updatedAt: new Date() }).where(eq(freeTrials.id, id)).returning();
    return updated;
  }
  async deleteFreeTrial(id: number): Promise<void> {
    await db.delete(freeTrials).where(eq(freeTrials.id, id));
  }

  // ==== Single Lessons ====
  async getSingleLessons(): Promise<SingleLesson[]> {
    return await db.select().from(singleLessons).orderBy(desc(singleLessons.createdAt));
  }
  async getSingleLessonById(id: number): Promise<SingleLesson | undefined> {
    const [item] = await db.select().from(singleLessons).where(eq(singleLessons.id, id));
    return item;
  }
  async createSingleLesson(item: InsertSingleLesson): Promise<SingleLesson> {
    const [newItem] = await db.insert(singleLessons).values(item).returning();
    return newItem;
  }
  async updateSingleLesson(id: number, item: Partial<InsertSingleLesson>): Promise<SingleLesson> {
    const [updated] = await db.update(singleLessons).set({ ...item, updatedAt: new Date() }).where(eq(singleLessons.id, id)).returning();
    return updated;
  }
  async deleteSingleLesson(id: number): Promise<void> {
    await db.delete(singleLessons).where(eq(singleLessons.id, id));
  }

  // ==== Sunday Activities ====
  async getSundayActivities(): Promise<SundayActivity[]> {
    return await db.select().from(sundayActivities).orderBy(desc(sundayActivities.createdAt));
  }
  async getSundayActivityById(id: number): Promise<SundayActivity | undefined> {
    const [item] = await db.select().from(sundayActivities).where(eq(sundayActivities.id, id));
    return item;
  }
  async createSundayActivity(item: InsertSundayActivity): Promise<SundayActivity> {
    const [newItem] = await db.insert(sundayActivities).values(item).returning();
    return newItem;
  }
  async updateSundayActivity(id: number, item: Partial<InsertSundayActivity>): Promise<SundayActivity> {
    const [updated] = await db.update(sundayActivities).set({ ...item, updatedAt: new Date() }).where(eq(sundayActivities.id, id)).returning();
    return updated;
  }
  async deleteSundayActivity(id: number): Promise<void> {
    await db.delete(sundayActivities).where(eq(sundayActivities.id, id));
  }

  // ==== Trainings ====
  async getTrainings(): Promise<Training[]> {
    return await db.select().from(trainings).orderBy(desc(trainings.createdAt));
  }
  async getTrainingById(id: number): Promise<Training | undefined> {
    const [item] = await db.select().from(trainings).where(eq(trainings.id, id));
    return item;
  }
  async createTraining(item: InsertTraining): Promise<Training> {
    const [newItem] = await db.insert(trainings).values(item).returning();
    return newItem;
  }
  async updateTraining(id: number, item: Partial<InsertTraining>): Promise<Training> {
    const [updated] = await db.update(trainings).set({ ...item, updatedAt: new Date() }).where(eq(trainings.id, id)).returning();
    return updated;
  }
  async deleteTraining(id: number): Promise<void> {
    await db.delete(trainings).where(eq(trainings.id, id));
  }

  // ==== Individual Lessons ====
  async getIndividualLessons(): Promise<IndividualLesson[]> {
    return await db.select().from(individualLessons).orderBy(desc(individualLessons.createdAt));
  }
  async getIndividualLessonById(id: number): Promise<IndividualLesson | undefined> {
    const [item] = await db.select().from(individualLessons).where(eq(individualLessons.id, id));
    return item;
  }
  async createIndividualLesson(item: InsertIndividualLesson): Promise<IndividualLesson> {
    const [newItem] = await db.insert(individualLessons).values(item).returning();
    return newItem;
  }
  async updateIndividualLesson(id: number, item: Partial<InsertIndividualLesson>): Promise<IndividualLesson> {
    const [updated] = await db.update(individualLessons).set({ ...item, updatedAt: new Date() }).where(eq(individualLessons.id, id)).returning();
    return updated;
  }
  async deleteIndividualLesson(id: number): Promise<void> {
    await db.delete(individualLessons).where(eq(individualLessons.id, id));
  }

  // ==== Campus Activities ====
  async getCampusActivities(): Promise<CampusActivity[]> {
    return await db.select().from(campusActivities).orderBy(desc(campusActivities.createdAt));
  }
  async getCampusActivityById(id: number): Promise<CampusActivity | undefined> {
    const [item] = await db.select().from(campusActivities).where(eq(campusActivities.id, id));
    return item;
  }
  async createCampusActivity(item: InsertCampusActivity): Promise<CampusActivity> {
    const [newItem] = await db.insert(campusActivities).values(item).returning();
    return newItem;
  }
  async updateCampusActivity(id: number, item: Partial<InsertCampusActivity>): Promise<CampusActivity> {
    const [updated] = await db.update(campusActivities).set({ ...item, updatedAt: new Date() }).where(eq(campusActivities.id, id)).returning();
    return updated;
  }
  async deleteCampusActivity(id: number): Promise<void> {
    await db.delete(campusActivities).where(eq(campusActivities.id, id));
  }

  // ==== Recitals ====
  async getRecitals(): Promise<Recital[]> {
    return await db.select().from(recitals).orderBy(desc(recitals.createdAt));
  }
  async getRecitalById(id: number): Promise<Recital | undefined> {
    const [item] = await db.select().from(recitals).where(eq(recitals.id, id));
    return item;
  }
  async createRecital(item: InsertRecital): Promise<Recital> {
    const [newItem] = await db.insert(recitals).values(item).returning();
    return newItem;
  }
  async updateRecital(id: number, item: Partial<InsertRecital>): Promise<Recital> {
    const [updated] = await db.update(recitals).set({ ...item, updatedAt: new Date() }).where(eq(recitals.id, id)).returning();
    return updated;
  }
  async deleteRecital(id: number): Promise<void> {
    await db.delete(recitals).where(eq(recitals.id, id));
  }

  // ==== Vacation Studies ====
  async getVacationStudies(): Promise<VacationStudy[]> {
    return await db.select().from(vacationStudies).orderBy(desc(vacationStudies.createdAt));
  }
  async getVacationStudyById(id: number): Promise<VacationStudy | undefined> {
    const [item] = await db.select().from(vacationStudies).where(eq(vacationStudies.id, id));
    return item;
  }
  async createVacationStudy(item: InsertVacationStudy): Promise<VacationStudy> {
    const [newItem] = await db.insert(vacationStudies).values(item).returning();
    return newItem;
  }
  async updateVacationStudy(id: number, item: Partial<InsertVacationStudy>): Promise<VacationStudy> {
    const [updated] = await db.update(vacationStudies).set({ ...item, updatedAt: new Date() }).where(eq(vacationStudies.id, id)).returning();
    return updated;
  }
  async deleteVacationStudy(id: number): Promise<void> {
    await db.delete(vacationStudies).where(eq(vacationStudies.id, id));
  }

  // ==== Memberships ====
  async getMemberships(): Promise<Membership[]> {
    return await db.select().from(memberships).orderBy(desc(memberships.expiryDate));
  }

  async getMembershipsWithMembers(): Promise<(Membership & { memberFirstName?: string; memberLastName?: string; memberFiscalCode?: string })[]> {
    const result = await db
      .select({
        id: memberships.id,
        memberId: memberships.memberId,
        membershipNumber: memberships.membershipNumber,
        previousMembershipNumber: memberships.previousMembershipNumber,
        barcode: memberships.barcode,
        issueDate: memberships.issueDate,
        expiryDate: memberships.expiryDate,
        status: memberships.status,
        type: memberships.type,
        fee: memberships.fee,
        createdAt: memberships.createdAt,
        updatedAt: memberships.updatedAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        memberFiscalCode: members.fiscalCode,
      })
      .from(memberships)
      .leftJoin(members, eq(memberships.memberId, members.id))
      .orderBy(desc(memberships.expiryDate));
    return result;
  }

  async getMembership(id: number): Promise<Membership | undefined> {
    const [membership] = await db.select().from(memberships).where(eq(memberships.id, id));
    return membership;
  }

  async getMembershipByBarcode(barcode: string): Promise<Membership | undefined> {
    const [membership] = await db.select().from(memberships).where(eq(memberships.barcode, barcode));
    return membership;
  }

  async getMembershipsByMemberId(memberId: number): Promise<Membership[]> {
    return await db.select().from(memberships).where(eq(memberships.memberId, memberId)).orderBy(desc(memberships.expiryDate));
  }

  async createMembership(membership: InsertMembership): Promise<Membership> {
    const [newMembership] = await db.insert(memberships).values(membership).returning();
    
    // Sync member data
    await this.syncMemberFromMembership(newMembership);
    
    return newMembership;
  }

  async updateMembership(id: number, membership: Partial<InsertMembership>): Promise<Membership> {
    const [updated] = await db
      .update(memberships)
      .set({ ...membership, updatedAt: new Date() })
      .where(eq(memberships.id, id))
      .returning();
    
    // Sync member data
    await this.syncMemberFromMembership(updated);
    
    return updated;
  }

  async deleteMembership(id: number): Promise<void> {
    // Get membership to find memberId before deleting
    const [membership] = await db.select().from(memberships).where(eq(memberships.id, id));
    
    await db.delete(memberships).where(eq(memberships.id, id));
    
    // Clear member card data
    if (membership) {
      await db
        .update(members)
        .set({
          cardNumber: null,
          cardIssueDate: null,
          cardExpiryDate: null,
          updatedAt: new Date(),
        })
        .where(eq(members.id, membership.memberId));
    }
  }

  // ==== Medical Certificates ====
  async getMedicalCertificates(): Promise<MedicalCertificate[]> {
    return await db.select().from(medicalCertificates).orderBy(desc(medicalCertificates.expiryDate));
  }

  async getMedicalCertificatesWithMembers(): Promise<(MedicalCertificate & { memberFirstName?: string; memberLastName?: string; memberFiscalCode?: string })[]> {
    const result = await db
      .select({
        id: medicalCertificates.id,
        memberId: medicalCertificates.memberId,
        issueDate: medicalCertificates.issueDate,
        expiryDate: medicalCertificates.expiryDate,
        doctorName: medicalCertificates.doctorName,
        notes: medicalCertificates.notes,
        status: medicalCertificates.status,
        createdAt: medicalCertificates.createdAt,
        updatedAt: medicalCertificates.updatedAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        memberFiscalCode: members.fiscalCode,
      })
      .from(medicalCertificates)
      .leftJoin(members, eq(medicalCertificates.memberId, members.id))
      .orderBy(desc(medicalCertificates.expiryDate));
    return result;
  }

  async getMedicalCertificatesByMemberId(memberId: number): Promise<MedicalCertificate[]> {
    return await db.select().from(medicalCertificates).where(eq(medicalCertificates.memberId, memberId)).orderBy(desc(medicalCertificates.expiryDate));
  }

  async getMedicalCertificate(id: number): Promise<MedicalCertificate | undefined> {
    const [cert] = await db.select().from(medicalCertificates).where(eq(medicalCertificates.id, id));
    return cert;
  }

  async createMedicalCertificate(cert: InsertMedicalCertificate): Promise<MedicalCertificate> {
    const [newCert] = await db.insert(medicalCertificates).values(cert).returning();
    
    // Sync member data
    await this.syncMemberFromMedicalCertificate(newCert);
    
    return newCert;
  }

  async updateMedicalCertificate(id: number, cert: Partial<InsertMedicalCertificate>): Promise<MedicalCertificate> {
    const [updated] = await db
      .update(medicalCertificates)
      .set({ ...cert, updatedAt: new Date() })
      .where(eq(medicalCertificates.id, id))
      .returning();
    
    // Sync member data
    await this.syncMemberFromMedicalCertificate(updated);
    
    return updated;
  }

  async deleteMedicalCertificate(id: number): Promise<void> {
    // Get certificate to find memberId before deleting
    const [cert] = await db.select().from(medicalCertificates).where(eq(medicalCertificates.id, id));
    
    await db.delete(medicalCertificates).where(eq(medicalCertificates.id, id));
    
    // Clear member certificate data
    if (cert) {
      await db
        .update(members)
        .set({
          hasMedicalCertificate: false,
          medicalCertificateExpiry: null,
          updatedAt: new Date(),
        })
        .where(eq(members.id, cert.memberId));
    }
  }

  // ==== Payment Methods ====
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods).orderBy(paymentMethods.name);
  }

  async getPaymentMethod(id: number): Promise<PaymentMethod | undefined> {
    const [method] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id));
    return method;
  }

  async createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod> {
    const [newMethod] = await db.insert(paymentMethods).values(method).returning();
    return newMethod;
  }

  async updatePaymentMethod(id: number, method: Partial<InsertPaymentMethod>): Promise<PaymentMethod> {
    const [updated] = await db
      .update(paymentMethods)
      .set({ ...method, updatedAt: new Date() })
      .where(eq(paymentMethods.id, id))
      .returning();
    return updated;
  }

  async deletePaymentMethod(id: number): Promise<void> {
    await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
  }

  // ==== Payments ====
  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getPaymentsWithMembers(): Promise<(Payment & { memberFirstName?: string; memberLastName?: string })[]> {
    const result = await db
      .select({
        id: payments.id,
        memberId: payments.memberId,
        enrollmentId: payments.enrollmentId,
        amount: payments.amount,
        type: payments.type,
        description: payments.description,
        dueDate: payments.dueDate,
        paidDate: payments.paidDate,
        status: payments.status,
        paymentMethod: payments.paymentMethod,
        notes: payments.notes,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
      })
      .from(payments)
      .leftJoin(members, eq(payments.memberId, members.id))
      .orderBy(desc(payments.createdAt));
    return result;
  }

  async getPaymentsByMemberId(memberId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.memberId, memberId)).orderBy(desc(payments.createdAt));
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment> {
    const [updated] = await db
      .update(payments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updated;
  }

  async deletePayment(id: number): Promise<void> {
    await db.delete(payments).where(eq(payments.id, id));
  }

  // ==== Enrollments ====
  async getEnrollments(): Promise<(Enrollment & { memberFirstName?: string | null; memberLastName?: string | null; memberEmail?: string | null; memberFiscalCode?: string | null })[]> {
    const result = await db
      .select({
        id: enrollments.id,
        memberId: enrollments.memberId,
        courseId: enrollments.courseId,
        enrollmentDate: enrollments.enrollmentDate,
        status: enrollments.status,
        notes: enrollments.notes,
        createdAt: enrollments.createdAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        memberEmail: members.email,
        memberFiscalCode: members.fiscalCode,
      })
      .from(enrollments)
      .leftJoin(members, eq(enrollments.memberId, members.id))
      .orderBy(desc(enrollments.enrollmentDate));
    return result;
  }

  async getEnrollmentsByMember(memberId: number): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.memberId, memberId)).orderBy(desc(enrollments.enrollmentDate));
  }

  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, id));
    return enrollment;
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [newEnrollment] = await db.insert(enrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async updateEnrollment(id: number, enrollment: Partial<InsertEnrollment>): Promise<Enrollment> {
    const [updated] = await db
      .update(enrollments)
      .set(enrollment)
      .where(eq(enrollments.id, id))
      .returning();
    return updated;
  }

  async deleteEnrollment(id: number): Promise<void> {
    await db.delete(enrollments).where(eq(enrollments.id, id));
  }

  // ==== Access Logs ====
  async getAccessLogs(limit: number = 100): Promise<(AccessLog & { memberFirstName?: string | null; memberLastName?: string | null })[]> {
    const result = await db
      .select({
        id: accessLogs.id,
        memberId: accessLogs.memberId,
        barcode: accessLogs.barcode,
        accessTime: accessLogs.accessTime,
        accessType: accessLogs.accessType,
        membershipStatus: accessLogs.membershipStatus,
        notes: accessLogs.notes,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
      })
      .from(accessLogs)
      .leftJoin(members, eq(accessLogs.memberId, members.id))
      .orderBy(desc(accessLogs.accessTime))
      .limit(limit);
    return result;
  }

  async createAccessLog(log: InsertAccessLog): Promise<AccessLog> {
    const [newLog] = await db.insert(accessLogs).values(log).returning();
    return newLog;
  }

  // ==== Synchronization Helpers ====
  private async syncMembershipFromMember(member: Member): Promise<void> {
    if (!member.cardNumber) {
      // If no card number, delete existing membership if any
      await db.delete(memberships).where(eq(memberships.memberId, member.id));
      return;
    }

    // Check if membership already exists for this member
    const [existing] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.memberId, member.id));

    const membershipData = {
      memberId: member.id,
      membershipNumber: member.cardNumber,
      barcode: member.cardNumber, // Use same as card number
      issueDate: member.cardIssueDate || new Date().toISOString().split('T')[0],
      expiryDate: member.cardExpiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      status: member.cardExpiryDate && new Date(member.cardExpiryDate) < new Date() ? 'expired' : 'active',
      type: 'annual',
    };

    if (existing) {
      // Update existing membership
      await db
        .update(memberships)
        .set({ ...membershipData, updatedAt: new Date() })
        .where(eq(memberships.id, existing.id));
    } else {
      // Create new membership
      await db.insert(memberships).values(membershipData);
    }
  }

  private async syncMedicalCertificateFromMember(member: Member): Promise<void> {
    if (!member.hasMedicalCertificate) {
      // If no medical certificate, delete existing if any
      await db.delete(medicalCertificates).where(eq(medicalCertificates.memberId, member.id));
      return;
    }

    // Check if medical certificate already exists for this member
    const [existing] = await db
      .select()
      .from(medicalCertificates)
      .where(eq(medicalCertificates.memberId, member.id));

    const certData = {
      memberId: member.id,
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: member.medicalCertificateExpiry || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      status: member.medicalCertificateExpiry && new Date(member.medicalCertificateExpiry) < new Date() ? 'expired' : 'valid',
    };

    if (existing) {
      // Update existing certificate
      await db
        .update(medicalCertificates)
        .set({ ...certData, updatedAt: new Date() })
        .where(eq(medicalCertificates.id, existing.id));
    } else {
      // Create new certificate
      await db.insert(medicalCertificates).values(certData);
    }
  }

  private async syncMemberFromMembership(membership: Membership): Promise<void> {
    // If membership has no number or is inactive, clear member card data
    if (!membership.membershipNumber || membership.status === 'suspended') {
      await db
        .update(members)
        .set({
          cardNumber: null,
          cardIssueDate: null,
          cardExpiryDate: null,
          updatedAt: new Date(),
        })
        .where(eq(members.id, membership.memberId));
    } else {
      // Update member with card data from membership
      await db
        .update(members)
        .set({
          cardNumber: membership.membershipNumber,
          cardIssueDate: membership.issueDate,
          cardExpiryDate: membership.expiryDate,
          updatedAt: new Date(),
        })
        .where(eq(members.id, membership.memberId));
    }
  }

  private async syncMemberFromMedicalCertificate(cert: MedicalCertificate): Promise<void> {
    // If certificate is expired or invalid, clear member certificate flag
    const isValid = cert.status === 'valid' && cert.expiryDate && new Date(cert.expiryDate) >= new Date();
    
    await db
      .update(members)
      .set({
        hasMedicalCertificate: isValid,
        medicalCertificateExpiry: isValid ? cert.expiryDate : null,
        updatedAt: new Date(),
      })
      .where(eq(members.id, cert.memberId));
  }

  // ==== Attendances ====
  async getAttendances(): Promise<(Attendance & { memberFirstName?: string | null; memberLastName?: string | null; memberFiscalCode?: string | null })[]> {
    const result = await db
      .select({
        id: attendances.id,
        memberId: attendances.memberId,
        courseId: attendances.courseId,
        enrollmentId: attendances.enrollmentId,
        attendanceDate: attendances.attendanceDate,
        type: attendances.type,
        notes: attendances.notes,
        createdAt: attendances.createdAt,
        updatedAt: attendances.updatedAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        memberFiscalCode: members.fiscalCode,
      })
      .from(attendances)
      .leftJoin(members, eq(attendances.memberId, members.id))
      .orderBy(desc(attendances.attendanceDate));
    return result;
  }

  async getAttendance(id: number): Promise<Attendance | undefined> {
    const [attendance] = await db.select().from(attendances).where(eq(attendances.id, id));
    return attendance;
  }

  async getAttendancesByMember(memberId: number): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendances)
      .where(eq(attendances.memberId, memberId))
      .orderBy(desc(attendances.attendanceDate));
  }

  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    // Validate that if enrollmentId is provided, it belongs to the member
    if (attendanceData.enrollmentId) {
      const enrollment = await this.getEnrollment(attendanceData.enrollmentId);
      if (!enrollment) {
        throw new Error("Enrollment not found");
      }
      if (enrollment.memberId !== attendanceData.memberId) {
        throw new Error("Enrollment does not belong to this member");
      }
      // Verify that courseId matches the enrollment if provided
      if (attendanceData.courseId && attendanceData.courseId !== enrollment.courseId) {
        throw new Error("Course ID does not match the enrollment's course");
      }
      // Set courseId from enrollment if not provided
      if (!attendanceData.courseId) {
        attendanceData = { ...attendanceData, courseId: enrollment.courseId };
      }
    }
    
    const [attendance] = await db.insert(attendances).values(attendanceData).returning();
    return attendance;
  }

  async deleteAttendance(id: number): Promise<void> {
    await db.delete(attendances).where(eq(attendances.id, id));
  }

  // ==== Workshop Enrollments ====
  async getWorkshopEnrollments(): Promise<(WorkshopEnrollment & { memberFirstName?: string | null; memberLastName?: string | null; memberEmail?: string | null; memberFiscalCode?: string | null })[]> {
    const result = await db
      .select({
        id: workshopEnrollments.id,
        workshopId: workshopEnrollments.workshopId,
        memberId: workshopEnrollments.memberId,
        enrollmentDate: workshopEnrollments.enrollmentDate,
        status: workshopEnrollments.status,
        notes: workshopEnrollments.notes,
        createdAt: workshopEnrollments.createdAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        memberEmail: members.email,
        memberFiscalCode: members.fiscalCode,
      })
      .from(workshopEnrollments)
      .leftJoin(members, eq(workshopEnrollments.memberId, members.id))
      .orderBy(desc(workshopEnrollments.enrollmentDate));
    return result;
  }

  async getWorkshopEnrollmentsByMember(memberId: number): Promise<WorkshopEnrollment[]> {
    return await db
      .select()
      .from(workshopEnrollments)
      .where(eq(workshopEnrollments.memberId, memberId))
      .orderBy(desc(workshopEnrollments.enrollmentDate));
  }

  async getWorkshopEnrollment(id: number): Promise<WorkshopEnrollment | undefined> {
    const [enrollment] = await db.select().from(workshopEnrollments).where(eq(workshopEnrollments.id, id));
    return enrollment;
  }

  async createWorkshopEnrollment(enrollment: InsertWorkshopEnrollment): Promise<WorkshopEnrollment> {
    const [newEnrollment] = await db.insert(workshopEnrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async updateWorkshopEnrollment(id: number, enrollment: Partial<InsertWorkshopEnrollment>): Promise<WorkshopEnrollment> {
    const [updated] = await db
      .update(workshopEnrollments)
      .set(enrollment)
      .where(eq(workshopEnrollments.id, id))
      .returning();
    return updated;
  }

  async deleteWorkshopEnrollment(id: number): Promise<void> {
    await db.delete(workshopEnrollments).where(eq(workshopEnrollments.id, id));
  }

  // ==== Workshop Attendances ====
  async getWorkshopAttendances(): Promise<WorkshopAttendance[]> {
    return await db.select().from(workshopAttendances).orderBy(desc(workshopAttendances.attendanceDate));
  }

  async getWorkshopAttendance(id: number): Promise<WorkshopAttendance | undefined> {
    const [attendance] = await db.select().from(workshopAttendances).where(eq(workshopAttendances.id, id));
    return attendance;
  }

  async createWorkshopAttendance(attendance: InsertWorkshopAttendance): Promise<WorkshopAttendance> {
    const [newAttendance] = await db.insert(workshopAttendances).values(attendance).returning();
    return newAttendance;
  }

  async deleteWorkshopAttendance(id: number): Promise<void> {
    await db.delete(workshopAttendances).where(eq(workshopAttendances.id, id));
  }

  // ==== Member Relationships (genitori/tutori) ====
  async getMemberRelationships(memberId: number): Promise<MemberRelationship[]> {
    return await db
      .select()
      .from(memberRelationships)
      .where(eq(memberRelationships.memberId, memberId));
  }

  async getMemberChildren(memberId: number): Promise<MemberRelationship[]> {
    return await db
      .select()
      .from(memberRelationships)
      .where(eq(memberRelationships.relatedMemberId, memberId));
  }

  async createMemberRelationship(relationship: InsertMemberRelationship): Promise<MemberRelationship> {
    const [newRelationship] = await db.insert(memberRelationships).values(relationship).returning();
    return newRelationship;
  }

  async deleteMemberRelationship(id: number): Promise<void> {
    await db.delete(memberRelationships).where(eq(memberRelationships.id, id));
  }

  // ==== Locations (Countries, Provinces, Cities) ====
  async getCountries(): Promise<Country[]> {
    return await db.select().from(countries).orderBy(countries.name);
  }

  async createCountry(country: InsertCountry): Promise<Country> {
    const [newCountry] = await db.insert(countries).values(country).returning();
    return newCountry;
  }

  async getProvinces(countryId?: number): Promise<Province[]> {
    if (countryId) {
      return await db.select().from(provinces).where(eq(provinces.countryId, countryId)).orderBy(provinces.name);
    }
    return await db.select().from(provinces).orderBy(provinces.name);
  }

  async createProvince(province: InsertProvince): Promise<Province> {
    const [newProvince] = await db.insert(provinces).values(province).returning();
    return newProvince;
  }

  async searchCities(search: string, limit: number = 20): Promise<(City & { province?: Province })[]> {
    const results = await db
      .select({
        id: cities.id,
        name: cities.name,
        provinceId: cities.provinceId,
        postalCode: cities.postalCode,
        istatCode: cities.istatCode,
        provinceName: provinces.name,
        provinceCode: provinces.code,
        region: provinces.region,
      })
      .from(cities)
      .leftJoin(provinces, eq(cities.provinceId, provinces.id))
      .where(ilike(cities.name, `%${search}%`))
      .orderBy(cities.name)
      .limit(limit);

    return results.map(r => ({
      id: r.id,
      name: r.name,
      provinceId: r.provinceId,
      postalCode: r.postalCode,
      istatCode: r.istatCode,
      province: r.provinceId ? {
        id: r.provinceId,
        code: r.provinceCode || "",
        name: r.provinceName || "",
        region: r.region,
        countryId: null,
      } : undefined,
    }));
  }

  async getCitiesByProvince(provinceId: number): Promise<City[]> {
    return await db.select().from(cities).where(eq(cities.provinceId, provinceId)).orderBy(cities.name);
  }

  async createCity(city: InsertCity): Promise<City> {
    const [newCity] = await db.insert(cities).values(city).returning();
    return newCity;
  }

  // ==== Custom Reports ====
  async getCustomReports(): Promise<CustomReport[]> {
    return await db.select().from(customReports).orderBy(desc(customReports.createdAt));
  }

  async getCustomReport(id: number): Promise<CustomReport | undefined> {
    const [report] = await db.select().from(customReports).where(eq(customReports.id, id));
    return report;
  }

  async createCustomReport(report: InsertCustomReport): Promise<CustomReport> {
    const [newReport] = await db.insert(customReports).values(report).returning();
    return newReport;
  }

  async updateCustomReport(id: number, report: Partial<InsertCustomReport>): Promise<CustomReport> {
    const [updated] = await db
      .update(customReports)
      .set({ ...report, updatedAt: new Date() })
      .where(eq(customReports.id, id))
      .returning();
    return updated;
  }

  async deleteCustomReport(id: number): Promise<void> {
    await db.delete(customReports).where(eq(customReports.id, id));
  }

  // ==== Import Configurations ====
  async getImportConfigs(entityType?: string, sourceType?: string): Promise<ImportConfig[]> {
    let conditions = [];
    if (entityType) conditions.push(eq(importConfigs.entityType, entityType));
    if (sourceType) conditions.push(eq(importConfigs.sourceType, sourceType));
    
    if (conditions.length > 0) {
      return await db.select().from(importConfigs)
        .where(and(...conditions))
        .orderBy(desc(importConfigs.createdAt));
    }
    return await db.select().from(importConfigs).orderBy(desc(importConfigs.createdAt));
  }

  async getImportConfig(id: number): Promise<ImportConfig | undefined> {
    const [config] = await db.select().from(importConfigs).where(eq(importConfigs.id, id));
    return config;
  }

  async createImportConfig(config: InsertImportConfig): Promise<ImportConfig> {
    const [newConfig] = await db.insert(importConfigs).values(config).returning();
    return newConfig;
  }

  async deleteImportConfig(id: number): Promise<void> {
    await db.delete(importConfigs).where(eq(importConfigs.id, id));
  }

  // Knowledge operations
  async getAllKnowledge(): Promise<Knowledge[]> {
    return await db.select().from(knowledge).orderBy(knowledge.sezione, knowledge.titolo);
  }

  async getKnowledgeById(id: string): Promise<Knowledge | undefined> {
    const [item] = await db.select().from(knowledge).where(eq(knowledge.id, id));
    return item;
  }

  async upsertKnowledge(item: InsertKnowledge): Promise<Knowledge> {
    const existing = await this.getKnowledgeById(item.id);
    if (existing) {
      const [updated] = await db.update(knowledge)
        .set({ ...item, updatedAt: new Date() })
        .where(eq(knowledge.id, item.id))
        .returning();
      return updated;
    }
    const [newItem] = await db.insert(knowledge).values(item).returning();
    return newItem;
  }

  async deleteKnowledge(id: string): Promise<void> {
    await db.delete(knowledge).where(eq(knowledge.id, id));
  }

  // ==== Activity Statuses ====
  async getActivityStatuses(): Promise<ActivityStatus[]> {
    return await db.select().from(activityStatuses).orderBy(activityStatuses.sortOrder);
  }

  async getActivityStatus(id: number): Promise<ActivityStatus | undefined> {
    const [status] = await db.select().from(activityStatuses).where(eq(activityStatuses.id, id));
    return status;
  }

  async createActivityStatus(status: InsertActivityStatus): Promise<ActivityStatus> {
    const [newStatus] = await db.insert(activityStatuses).values(status).returning();
    return newStatus;
  }

  async updateActivityStatus(id: number, status: Partial<InsertActivityStatus>): Promise<ActivityStatus> {
    const [updated] = await db.update(activityStatuses).set(status).where(eq(activityStatuses.id, id)).returning();
    return updated;
  }

  async deleteActivityStatus(id: number): Promise<void> {
    await db.delete(activityStatuses).where(eq(activityStatuses.id, id));
  }

  async getPaymentNotes(): Promise<PaymentNote[]> {
    return await db.select().from(paymentNotes).orderBy(paymentNotes.sortOrder);
  }

  async getPaymentNote(id: number): Promise<PaymentNote | undefined> {
    const [note] = await db.select().from(paymentNotes).where(eq(paymentNotes.id, id));
    return note;
  }

  async createPaymentNote(note: InsertPaymentNote): Promise<PaymentNote> {
    const [newNote] = await db.insert(paymentNotes).values(note).returning();
    return newNote;
  }

  async updatePaymentNote(id: number, note: Partial<InsertPaymentNote>): Promise<PaymentNote> {
    const [updated] = await db.update(paymentNotes).set(note).where(eq(paymentNotes.id, id)).returning();
    return updated;
  }

  async deletePaymentNote(id: number): Promise<void> {
    await db.delete(paymentNotes).where(eq(paymentNotes.id, id));
  }

  async getEnrollmentDetails(): Promise<EnrollmentDetail[]> {
    return await db.select().from(enrollmentDetails).orderBy(enrollmentDetails.sortOrder);
  }

  async getEnrollmentDetail(id: number): Promise<EnrollmentDetail | undefined> {
    const [detail] = await db.select().from(enrollmentDetails).where(eq(enrollmentDetails.id, id));
    return detail;
  }

  async createEnrollmentDetail(detail: InsertEnrollmentDetail): Promise<EnrollmentDetail> {
    const [newDetail] = await db.insert(enrollmentDetails).values(detail).returning();
    return newDetail;
  }

  async updateEnrollmentDetail(id: number, detail: Partial<InsertEnrollmentDetail>): Promise<EnrollmentDetail> {
    const [updated] = await db.update(enrollmentDetails).set(detail).where(eq(enrollmentDetails.id, id)).returning();
    return updated;
  }

  async deleteEnrollmentDetail(id: number): Promise<void> {
    await db.delete(enrollmentDetails).where(eq(enrollmentDetails.id, id));
  }

  // ==== Team Comments ====
  async getTeamComments(): Promise<TeamComment[]> {
    return await db.select().from(teamComments).orderBy(desc(teamComments.createdAt));
  }

  async getTeamComment(id: number): Promise<TeamComment | undefined> {
    const [comment] = await db.select().from(teamComments).where(eq(teamComments.id, id));
    return comment;
  }

  async createTeamComment(comment: InsertTeamComment): Promise<TeamComment> {
    const [newComment] = await db.insert(teamComments).values(comment).returning();
    return newComment;
  }

  async updateTeamComment(id: number, comment: Partial<InsertTeamComment>): Promise<TeamComment> {
    const [updated] = await db.update(teamComments).set({ ...comment, updatedAt: new Date() }).where(eq(teamComments.id, id)).returning();
    return updated;
  }

  async deleteTeamComment(id: number): Promise<void> {
    await db.delete(teamComments).where(eq(teamComments.id, id));
  }

  // ==== Team Notes ====
  async getTeamNotes(): Promise<TeamNote[]> {
    return await db.select().from(teamNotes).orderBy(desc(teamNotes.isPinned), desc(teamNotes.createdAt));
  }

  async getTeamNote(id: number): Promise<TeamNote | undefined> {
    const [note] = await db.select().from(teamNotes).where(eq(teamNotes.id, id));
    return note;
  }

  async createTeamNote(note: InsertTeamNote): Promise<TeamNote> {
    const [newNote] = await db.insert(teamNotes).values(note).returning();
    return newNote;
  }

  async updateTeamNote(id: number, note: Partial<InsertTeamNote>): Promise<TeamNote> {
    const [updated] = await db.update(teamNotes).set({ ...note, updatedAt: new Date() }).where(eq(teamNotes.id, id)).returning();
    return updated;
  }

  async deleteTeamNote(id: number): Promise<void> {
    await db.delete(teamNotes).where(eq(teamNotes.id, id));
  }

  // ==== Team Notifications ====
  async getTeamNotifications(userId: string): Promise<TeamNotification[]> {
    return await db.select().from(teamNotifications).where(eq(teamNotifications.userId, userId)).orderBy(desc(teamNotifications.createdAt));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(teamNotifications).where(and(eq(teamNotifications.userId, userId), eq(teamNotifications.isRead, false)));
    return result?.count || 0;
  }

  async createTeamNotification(notification: InsertTeamNotification): Promise<TeamNotification> {
    const [newNotification] = await db.insert(teamNotifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(id: number): Promise<void> {
    await db.update(teamNotifications).set({ isRead: true }).where(eq(teamNotifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(teamNotifications).set({ isRead: true }).where(eq(teamNotifications.userId, userId));
  }
}

export const storage = new DatabaseStorage();
