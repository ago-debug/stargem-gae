import { db } from "./db";
import { eq, or, desc, sql, asc, inArray, isNull, isNotNull, and, gte, lte, sum, sql as dql, aliasedTable } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { ilike } from "drizzle-orm";
import {
  users,
  members,
  categories,
  clientCategories,
  subscriptionTypes,
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
  userRoles,
  userActivityLogs,
  bookingServices,
  studioBookings,
  systemConfigs,
  seasons,
  priceLists,
  priceListItems,
  notifications,
  type User,
  type UpsertUser,
  type Member,
  type InsertMember,
  type Category,
  type InsertCategory,
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
  type UserRole,
  type InsertUserRole,
  type UserActivityLog,
  type InsertUserActivityLog,
  type BookingService,
  type InsertBookingService,
  type StudioBooking,
  type InsertStudioBooking,
  type SystemConfig,
  type InsertSystemConfig,
  type Season,
  type InsertSeason,
  type PriceList,
  type InsertPriceList,
  type PriceListItem,
  type InsertPriceListItem,
  type Notification,
  type InsertNotification,
  quotes,
  type Quote,
  type InsertQuote,
  workshopCategories,
  type WorkshopCategory,
  type InsertWorkshopCategory,
  sundayCategories,
  type SundayCategory,
  type InsertSundayCategory,
  trainingCategories,
  type TrainingCategory,
  type InsertTrainingCategory,
  individualLessonCategories,
  type IndividualLessonCategory,
  type InsertIndividualLessonCategory,
  campusCategories,
  type CampusCategory,
  type InsertCampusCategory,
  recitalCategories,
  type RecitalCategory,
  type InsertRecitalCategory,
  vacationCategories,
  type VacationCategory,
  type InsertVacationCategory,
  sundayActivities,
  type SundayActivity,
  type InsertSundayActivity,
  trainings,
  type Training,
  type InsertTraining,
  individualLessons,
  type IndividualLesson,
  type InsertIndividualLesson,
  campusActivities,
  type CampusActivity,
  type InsertCampusActivity,
  recitals,
  type Recital,
  type InsertRecital,
  vacationStudies,
  type VacationStudy,
  type InsertVacationStudy,
  activityStatuses,
  type ActivityStatus,
  type InsertActivityStatus,
  paymentNotes,
  type PaymentNote,
  type InsertPaymentNote,
  enrollmentDetails,
  type EnrollmentDetail,
  type InsertEnrollmentDetail,
  participantTypes,
  type ParticipantType,
  type InsertParticipantType,
  todos,
  type Todo,
  type InsertTodo,
  InsertSundayActivityEnrollment, SundayActivityEnrollment, sundayActivityEnrollments,
  InsertTrainingEnrollment, TrainingEnrollment, trainingEnrollments,
  InsertIndividualLessonEnrollment, IndividualLessonEnrollment, individualLessonEnrollments,
  InsertCampusEnrollment, CampusEnrollment, campusEnrollments,
  InsertRecitalEnrollment, RecitalEnrollment, recitalEnrollments,
  InsertVacationStudyEnrollment, VacationStudyEnrollment, vacationStudyEnrollments,
  courseQuotesGrid,
  type CourseQuotesGrid,
  type InsertCourseQuotesGrid,
  bookingServiceCategories,
  type BookingServiceCategory,
  type InsertBookingServiceCategory,
  customLists,
  type CustomList,
  type InsertCustomList,
  customListItems,
  type CustomListItem,
  type InsertCustomListItem,
  auditLogs,
  type AuditLog,
  type InsertAuditLog,
  activities,
  type Activity,
  type InsertActivity,
  ActivitiesUnified,
  InsertActivitiesUnified,
  activitiesUnified,
  globalEnrollments,
  type GlobalEnrollment,
  type InsertGlobalEnrollment,
  type StrategicEvent,
  type InsertStrategicEvent,
  strategicEvents,
  merchandisingCategories,
  type MerchandisingCategory,
  type InsertMerchandisingCategory,
  rentalCategories,
  type RentalCategory,
  type InsertRentalCategory,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // User Role operations
  getUserRoles(): Promise<UserRole[]>;
  getUserRole(id: number): Promise<UserRole | undefined>;
  getUserRoleByName(name: string): Promise<UserRole | undefined>;
  createUserRole(role: InsertUserRole): Promise<UserRole>;
  updateUserRole(id: number, role: Partial<InsertUserRole>): Promise<UserRole>;
  deleteUserRole(id: number): Promise<void>;

  // User Activity Log operations
  logActivity(log: InsertUserActivityLog): Promise<UserActivityLog>;
  getUserActivityLogs(limit?: number): Promise<(UserActivityLog & { user: { username: string, firstName: string, lastName: string } })[]>;

  // Audit Log operations
  createAuditLog(log: InsertAuditLog): Promise<void>;

  // Booking Service Categories operations
  getBookingServiceCategories(): Promise<BookingServiceCategory[]>;
  getBookingServiceCategory(id: number): Promise<BookingServiceCategory | undefined>;
  createBookingServiceCategory(category: InsertBookingServiceCategory): Promise<BookingServiceCategory>;
  updateBookingServiceCategory(id: number, category: Partial<InsertBookingServiceCategory>): Promise<BookingServiceCategory>;
  deleteBookingServiceCategory(id: number): Promise<void>;

  // Booking Service operations
  getBookingServices(): Promise<BookingService[]>;
  getBookingService(id: number): Promise<BookingService | undefined>;
  createBookingService(service: InsertBookingService): Promise<BookingService>;
  updateBookingService(id: number, service: Partial<InsertBookingService>): Promise<BookingService>;
  deleteBookingService(id: number): Promise<void>;

  // Studio Booking operations
  getStudioBookings(startDate?: Date, endDate?: Date, seasonId?: number): Promise<(StudioBooking & {
    memberFirstName?: string | null;
    memberLastName?: string | null;
    studioName?: string | null;
    serviceName?: string | null;
    serviceColor?: string | null;
    instructorFirstName?: string | null;
    instructorLastName?: string | null;
    specialization?: string | null;
  })[]>;
  getStudioBookingsBySeason(seasonId: number): Promise<(StudioBooking & {
    memberFirstName?: string | null;
    memberLastName?: string | null;
    studioName?: string | null;
    serviceName?: string | null;
    serviceColor?: string | null;
    instructorFirstName?: string | null;
    instructorLastName?: string | null;
    specialization?: string | null;
  })[]>;
  getStudioBooking(id: number): Promise<StudioBooking | undefined>;
  createStudioBooking(booking: InsertStudioBooking): Promise<StudioBooking>;
  updateStudioBooking(id: number, booking: Partial<InsertStudioBooking>): Promise<StudioBooking>;
  deleteStudioBooking(id: number): Promise<void>;

  // Quote operations
  getQuotes(): Promise<Quote[]>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote>;
  deleteQuote(id: number): Promise<void>;

  // Custom Lists operations
  getCustomLists(): Promise<(CustomList & { items: CustomListItem[] })[]>;
  getCustomListBySystemName(systemName: string): Promise<(CustomList & { items: CustomListItem[] }) | undefined>;
  createCustomList(list: InsertCustomList): Promise<CustomList>;
  updateCustomList(id: number, list: Partial<InsertCustomList>): Promise<CustomList>;
  deleteCustomList(id: number): Promise<void>;

  createCustomListItem(item: InsertCustomListItem): Promise<CustomListItem>;
  createCustomListItems(listId: number, values: string[]): Promise<void>;
  updateCustomListItem(id: number, item: Partial<InsertCustomListItem>): Promise<CustomListItem>;
  deleteCustomListItem(id: number): Promise<void>;

  // Paid Trials
  // Members
  getMembers(): Promise<Member[]>;
  getMembersPaginated(
    page: number,
    pageSize: number,
    search?: string,
    season?: string,
    status?: string,
    gender?: string,
    hasMedicalCert?: string,
    isMinor?: string,
    participantType?: string,
    hasCard?: string,
    hasEntityCard?: string,
    hasEmail?: string,
    hasPhone?: string,
    missingFiscalCode?: string,
    issuesFilter?: string
  ): Promise<{ members: (Member & { activeCourseCount: number })[]; total: number }>;
  getMembersWithEntityCards(): Promise<Member[]>;
  getMember(id: number): Promise<Member | undefined>;
  getMemberByFiscalCode(fiscalCode: string): Promise<Member | undefined>;
  getDuplicateFiscalCodes(): Promise<{ fiscalCode: string; members: { id: number; firstName: string; lastName: string; }[] }[]>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: number, member: Partial<InsertMember>): Promise<Member>;
  deleteMember(id: number): Promise<void>;
  bulkCreateMembers(members: InsertMember[]): Promise<{ imported: number; skipped: number }>;

  // Duplicates and Merging
  mergeMembers(primaryId: number, secondaryIds: number[]): Promise<void>;
  getDuplicateStats(): Promise<{ byFiscalCode: number; byEmail: number; byPhone: number; byName: number }>;
  getMissingDataCounts(): Promise<{ missingFiscalCode: number; missingEmail: number; missingPhone: number }>;
  checkDuplicateParticipant(data: any, excludeId?: number): Promise<{ isDuplicate: boolean; duplicateFields: string[]; message?: string }>;


  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

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
  getInstructorByEmail(email: string): Promise<Instructor | undefined>;
  createInstructor(instructor: InsertInstructor): Promise<Instructor>;
  updateInstructor(id: number, instructor: Partial<InsertInstructor>): Promise<Instructor>;
  deleteInstructor(id: number): Promise<void>;
  syncInstructorFromMember(member: Member): Promise<void>;

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
  getCoursesBySeason(seasonId: number): Promise<Course[]>;

  // Activity Statuses
  getActivityStatuses(): Promise<ActivityStatus[]>;
  getActivityStatus(id: number): Promise<ActivityStatus | undefined>;
  createActivityStatus(status: InsertActivityStatus): Promise<ActivityStatus>;
  updateActivityStatus(id: number, status: Partial<InsertActivityStatus>): Promise<ActivityStatus>;
  deleteActivityStatus(id: number): Promise<void>;

  // Participant Types
  getParticipantTypes(): Promise<ParticipantType[]>;
  getParticipantType(id: number): Promise<ParticipantType | undefined>;
  createParticipantType(type: InsertParticipantType): Promise<ParticipantType>;
  updateParticipantType(id: number, type: Partial<InsertParticipantType>): Promise<ParticipantType>;
  deleteParticipantType(id: number): Promise<void>;

  // Workshops
  getWorkshops(): Promise<Workshop[]>;
  getWorkshop(id: number): Promise<Workshop | undefined>;
  createWorkshop(workshop: InsertWorkshop): Promise<Workshop>;
  updateWorkshop(id: number, workshop: Partial<InsertWorkshop>): Promise<Workshop>;
  deleteWorkshop(id: number): Promise<void>;
  getWorkshopsBySeason(seasonId: number): Promise<Workshop[]>;

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
  getPaymentsBySeason(seasonId: number): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment>;
  deletePayment(id: number): Promise<void>;

  // Enrollments
  getEnrollments(): Promise<(Enrollment & { memberFirstName?: string | null; memberLastName?: string | null; memberEmail?: string | null; memberFiscalCode?: string | null; memberGender?: string | null })[]>;
  getEnrollmentsByMember(memberId: number): Promise<(Enrollment & { memberFirstName?: string | null; memberLastName?: string | null; memberEmail?: string | null; memberFiscalCode?: string | null; memberGender?: string | null })[]>;
  getEnrollmentsBySeason(seasonId: number): Promise<(Enrollment & { memberFirstName?: string | null; memberLastName?: string | null; memberEmail?: string | null; memberFiscalCode?: string | null; memberGender?: string | null })[]>;
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
  getAttendancesBySeason(seasonId: number): Promise<Attendance[]>;
  getAttendancesByMember(memberId: number): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  deleteAttendance(id: number): Promise<void>;

  // Workshop Enrollments
  getWorkshopEnrollments(): Promise<(WorkshopEnrollment & { memberFirstName?: string | null; memberLastName?: string | null; memberEmail?: string | null; memberFiscalCode?: string | null; memberGender?: string | null })[]>;
  getWorkshopEnrollmentsByMember(memberId: number): Promise<(WorkshopEnrollment & { memberFirstName?: string | null; memberLastName?: string | null; memberEmail?: string | null; memberFiscalCode?: string | null; memberGender?: string | null })[]>;
  getWorkshopEnrollmentsBySeason(seasonId: number): Promise<(WorkshopEnrollment & { memberFirstName?: string | null; memberLastName?: string | null; memberEmail?: string | null; memberFiscalCode?: string | null; memberGender?: string | null })[]>;
  getWorkshopEnrollment(id: number): Promise<WorkshopEnrollment | undefined>;
  createWorkshopEnrollment(enrollment: InsertWorkshopEnrollment): Promise<WorkshopEnrollment>;
  updateWorkshopEnrollment(id: number, enrollment: Partial<InsertWorkshopEnrollment>): Promise<WorkshopEnrollment>;
  deleteWorkshopEnrollment(id: number): Promise<void>;

  // Workshop Attendances
  getWorkshopAttendances(): Promise<WorkshopAttendance[]>;
  getWorkshopAttendance(id: number): Promise<WorkshopAttendance | undefined>;
  createWorkshopAttendance(attendance: InsertWorkshopAttendance): Promise<WorkshopAttendance>;
  deleteWorkshopAttendance(id: number): Promise<void>;

  // --- EXTRA ENROLLMENTS --- 
  getSundayActivityEnrollments(): Promise<any[]>;
  getSundayActivityEnrollmentsByMember(memberId: number): Promise<any[]>;
  getSundayActivityEnrollment(id: number): Promise<SundayActivityEnrollment | undefined>;
  createSundayActivityEnrollment(enrollment: InsertSundayActivityEnrollment): Promise<SundayActivityEnrollment>;
  updateSundayActivityEnrollment(id: number, enrollment: Partial<InsertSundayActivityEnrollment>): Promise<SundayActivityEnrollment>;
  deleteSundayActivityEnrollment(id: number): Promise<void>;

  getTrainingEnrollments(): Promise<any[]>;
  getTrainingEnrollmentsByMember(memberId: number): Promise<any[]>;
  getTrainingEnrollment(id: number): Promise<TrainingEnrollment | undefined>;
  createTrainingEnrollment(enrollment: InsertTrainingEnrollment): Promise<TrainingEnrollment>;
  updateTrainingEnrollment(id: number, enrollment: Partial<InsertTrainingEnrollment>): Promise<TrainingEnrollment>;
  deleteTrainingEnrollment(id: number): Promise<void>;

  getIndividualLessonEnrollments(): Promise<any[]>;
  getIndividualLessonEnrollmentsByMember(memberId: number): Promise<any[]>;
  getIndividualLessonEnrollment(id: number): Promise<IndividualLessonEnrollment | undefined>;
  createIndividualLessonEnrollment(enrollment: InsertIndividualLessonEnrollment): Promise<IndividualLessonEnrollment>;
  updateIndividualLessonEnrollment(id: number, enrollment: Partial<InsertIndividualLessonEnrollment>): Promise<IndividualLessonEnrollment>;
  deleteIndividualLessonEnrollment(id: number): Promise<void>;

  getCampusEnrollments(): Promise<any[]>;
  getCampusEnrollmentsByMember(memberId: number): Promise<any[]>;
  getCampusEnrollment(id: number): Promise<CampusEnrollment | undefined>;
  createCampusEnrollment(enrollment: InsertCampusEnrollment): Promise<CampusEnrollment>;
  updateCampusEnrollment(id: number, enrollment: Partial<InsertCampusEnrollment>): Promise<CampusEnrollment>;
  deleteCampusEnrollment(id: number): Promise<void>;

  getRecitalEnrollments(): Promise<any[]>;
  getRecitalEnrollmentsByMember(memberId: number): Promise<any[]>;
  getRecitalEnrollment(id: number): Promise<RecitalEnrollment | undefined>;
  createRecitalEnrollment(enrollment: InsertRecitalEnrollment): Promise<RecitalEnrollment>;
  updateRecitalEnrollment(id: number, enrollment: Partial<InsertRecitalEnrollment>): Promise<RecitalEnrollment>;
  deleteRecitalEnrollment(id: number): Promise<void>;

  getVacationStudyEnrollments(): Promise<any[]>;
  getVacationStudyEnrollmentsByMember(memberId: number): Promise<any[]>;
  getVacationStudyEnrollment(id: number): Promise<VacationStudyEnrollment | undefined>;
  createVacationStudyEnrollment(enrollment: InsertVacationStudyEnrollment): Promise<VacationStudyEnrollment>;
  updateVacationStudyEnrollment(id: number, enrollment: Partial<InsertVacationStudyEnrollment>): Promise<VacationStudyEnrollment>;
  deleteVacationStudyEnrollment(id: number): Promise<void>;


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
  getCityByIstatCode(code: string): Promise<(City & { province?: Province }) | undefined>;
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

  // Price Lists
  getPriceLists(): Promise<PriceList[]>;
  getPriceList(id: number): Promise<PriceList | undefined>;
  getPriceListItems(priceListId: number): Promise<PriceListItem[]>;
  createPriceList(priceList: InsertPriceList): Promise<PriceList>;
  updatePriceList(id: number, priceList: Partial<InsertPriceList>): Promise<PriceList>;
  deletePriceList(id: number): Promise<void>;
  upsertPriceListItem(item: InsertPriceListItem): Promise<PriceListItem>;
  deletePriceListItem(id: number): Promise<void>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  // Conflict detection
  checkStudioConflict(studioId: number, bookingDate: Date | string, startTime: string, endTime: string, currentBookingId?: number, currentCourseId?: number, targetSeasonId?: number): Promise<{ type: 'booking' | 'course' | 'workshop' | 'operating_hours', name: string } | null>;

  // System Config operations
  getSystemConfig(keyName: string): Promise<SystemConfig | undefined>;
  updateSystemConfig(keyName: string, value: string): Promise<SystemConfig>;

  // Season operations
  getSeasons(): Promise<Season[]>;
  getSeason(id: number): Promise<Season | undefined>;
  getActiveSeason(): Promise<Season | undefined>;
  createSeason(season: InsertSeason): Promise<Season>;
  updateSeason(id: number, season: Partial<Season>): Promise<Season>;
  setActiveSeason(id: number): Promise<void>;

  // WorkshopCategories
  getWorkshopCategories(): Promise<WorkshopCategory[]>;
  getWorkshopCategory(id: number): Promise<WorkshopCategory | undefined>;
  createWorkshopCategory(workshopCategory: InsertWorkshopCategory): Promise<WorkshopCategory>;
  updateWorkshopCategory(id: number, workshopCategory: Partial<InsertWorkshopCategory>): Promise<WorkshopCategory>;
  deleteWorkshopCategory(id: number): Promise<void>;

  // SundayCategories
  getSundayCategories(): Promise<SundayCategory[]>;
  getSundayCategory(id: number): Promise<SundayCategory | undefined>;
  createSundayCategory(sundayCategory: InsertSundayCategory): Promise<SundayCategory>;
  updateSundayCategory(id: number, sundayCategory: Partial<InsertSundayCategory>): Promise<SundayCategory>;
  deleteSundayCategory(id: number): Promise<void>;

  // TrainingCategories
  getTrainingCategories(): Promise<TrainingCategory[]>;
  getTrainingCategory(id: number): Promise<TrainingCategory | undefined>;
  createTrainingCategory(trainingCategory: InsertTrainingCategory): Promise<TrainingCategory>;
  updateTrainingCategory(id: number, trainingCategory: Partial<InsertTrainingCategory>): Promise<TrainingCategory>;
  deleteTrainingCategory(id: number): Promise<void>;

  // IndividualLessonCategories
  getIndividualLessonCategories(): Promise<IndividualLessonCategory[]>;
  getIndividualLessonCategory(id: number): Promise<IndividualLessonCategory | undefined>;
  createIndividualLessonCategory(individualLessonCategory: InsertIndividualLessonCategory): Promise<IndividualLessonCategory>;
  updateIndividualLessonCategory(id: number, individualLessonCategory: Partial<InsertIndividualLessonCategory>): Promise<IndividualLessonCategory>;
  deleteIndividualLessonCategory(id: number): Promise<void>;

  // CampusCategories
  getCampusCategories(): Promise<CampusCategory[]>;
  getCampusCategory(id: number): Promise<CampusCategory | undefined>;
  createCampusCategory(campusCategory: InsertCampusCategory): Promise<CampusCategory>;
  updateCampusCategory(id: number, campusCategory: Partial<InsertCampusCategory>): Promise<CampusCategory>;
  deleteCampusCategory(id: number): Promise<void>;

  // RecitalCategories
  getRecitalCategories(): Promise<RecitalCategory[]>;
  getRecitalCategory(id: number): Promise<RecitalCategory | undefined>;
  createRecitalCategory(recitalCategory: InsertRecitalCategory): Promise<RecitalCategory>;
  updateRecitalCategory(id: number, recitalCategory: Partial<InsertRecitalCategory>): Promise<RecitalCategory>;
  deleteRecitalCategory(id: number): Promise<void>;

  // VacationCategories
  getVacationCategories(): Promise<VacationCategory[]>;
  getVacationCategory(id: number): Promise<VacationCategory | undefined>;
  createVacationCategory(vacationCategory: InsertVacationCategory): Promise<VacationCategory>;
  updateVacationCategory(id: number, vacationCategory: Partial<InsertVacationCategory>): Promise<VacationCategory>;
  deleteVacationCategory(id: number): Promise<void>;

  // MerchandisingCategories
  getMerchandisingCategories(): Promise<MerchandisingCategory[]>;
  getMerchandisingCategory(id: number): Promise<MerchandisingCategory | undefined>;
  createMerchandisingCategory(merchandisingCategory: InsertMerchandisingCategory): Promise<MerchandisingCategory>;
  updateMerchandisingCategory(id: number, merchandisingCategory: Partial<InsertMerchandisingCategory>): Promise<MerchandisingCategory>;
  deleteMerchandisingCategory(id: number): Promise<void>;

  // RentalCategories (Affitti)
  getRentalCategories(): Promise<RentalCategory[]>;
  getRentalCategory(id: number): Promise<RentalCategory | undefined>;
  createRentalCategory(rentalCategory: InsertRentalCategory): Promise<RentalCategory>;
  updateRentalCategory(id: number, rentalCategory: Partial<InsertRentalCategory>): Promise<RentalCategory>;
  deleteRentalCategory(id: number): Promise<void>;

  // FreeTrials
  // SingleLessons
  // SundayActivities
  getSundayActivities(): Promise<SundayActivity[]>;
  getSundayActivity(id: number): Promise<SundayActivity | undefined>;
  createSundayActivity(sundayActivity: InsertSundayActivity): Promise<SundayActivity>;
  updateSundayActivity(id: number, sundayActivity: Partial<InsertSundayActivity>): Promise<SundayActivity>;
  deleteSundayActivity(id: number): Promise<void>;

  // Trainings
  getTrainings(): Promise<Training[]>;
  getTraining(id: number): Promise<Training | undefined>;
  createTraining(training: InsertTraining): Promise<Training>;
  updateTraining(id: number, training: Partial<InsertTraining>): Promise<Training>;
  deleteTraining(id: number): Promise<void>;

  // IndividualLessons
  getIndividualLessons(): Promise<IndividualLesson[]>;
  getIndividualLesson(id: number): Promise<IndividualLesson | undefined>;
  createIndividualLesson(individualLesson: InsertIndividualLesson): Promise<IndividualLesson>;
  updateIndividualLesson(id: number, individualLesson: Partial<InsertIndividualLesson>): Promise<IndividualLesson>;
  deleteIndividualLesson(id: number): Promise<void>;

  // CampusActivities
  getCampusActivities(): Promise<CampusActivity[]>;
  getCampusActivity(id: number): Promise<CampusActivity | undefined>;
  createCampusActivity(campusActivity: InsertCampusActivity): Promise<CampusActivity>;
  updateCampusActivity(id: number, campusActivity: Partial<InsertCampusActivity>): Promise<CampusActivity>;
  deleteCampusActivity(id: number): Promise<void>;

  // Recitals
  getRecitals(): Promise<Recital[]>;
  getRecital(id: number): Promise<Recital | undefined>;
  createRecital(recital: InsertRecital): Promise<Recital>;
  updateRecital(id: number, recital: Partial<InsertRecital>): Promise<Recital>;
  deleteRecital(id: number): Promise<void>;

  // VacationStudies
  getVacationStudies(): Promise<VacationStudy[]>;
  getVacationStudy(id: number): Promise<VacationStudy | undefined>;
  createVacationStudy(vacationStudy: InsertVacationStudy): Promise<VacationStudy>;
  updateVacationStudy(id: number, vacationStudy: Partial<InsertVacationStudy>): Promise<VacationStudy>;
  deleteVacationStudy(id: number): Promise<void>;

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

  // Todos
  getTodos(): Promise<Todo[]>;
  createTodo(todo: InsertTodo): Promise<Todo>;
  updateTodo(id: number, todo: Partial<InsertTodo>): Promise<Todo>;
  deleteTodo(id: number): Promise<void>;

  // Course Quotes Grid
  getCourseQuotesGrid(activityType?: string): Promise<CourseQuotesGrid[]>;
  upsertCourseQuotesGridBulk(quotes: InsertCourseQuotesGrid[], activityType?: string): Promise<void>;

  // Activities (STI Phase 1)
  getActivities(): Promise<Activity[]>;
  getActivitiesByCategoryId(categoryId: number): Promise<Activity[]>;
  getActivity(id: number): Promise<Activity | undefined>;
  createActivity(data: InsertActivity): Promise<Activity>;
  updateActivity(id: number, data: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: number): Promise<void>;

  // Global Enrollments (STI Phase 1)
  getGlobalEnrollments(): Promise<GlobalEnrollment[]>;
  getGlobalEnrollmentsByMemberId(memberId: number): Promise<GlobalEnrollment[]>;
  getGlobalEnrollmentsByActivityId(activityId: number): Promise<GlobalEnrollment[]>;
  createGlobalEnrollment(data: InsertGlobalEnrollment): Promise<GlobalEnrollment>;
  updateGlobalEnrollment(id: number, data: Partial<InsertGlobalEnrollment>): Promise<GlobalEnrollment | undefined>;
  deleteGlobalEnrollment(id: number): Promise<void>;

  // Strategic Events (Planning)
  getStrategicEvents(): Promise<StrategicEvent[]>;
  getStrategicEvent(id: number): Promise<StrategicEvent | undefined>;
  createStrategicEvent(event: InsertStrategicEvent): Promise<StrategicEvent>;
  updateStrategicEvent(id: number, event: Partial<InsertStrategicEvent>): Promise<StrategicEvent | undefined>;
  deleteStrategicEvent(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // ==== User operations ====
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.username);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    await db
      .insert(users)
      .values(userData)
      .onDuplicateKeyUpdate({
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      });

    if (!userData.username) throw new Error("Username is required for upsert");
    const [user] = await db.select().from(users).where(eq(users.username, userData.username));
    if (!user) throw new Error("User not found after upsert");
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id));

    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) throw new Error("User not found");
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // ==== User Role operations ====
  async getUserRoles(): Promise<UserRole[]> {
    return await db.select().from(userRoles).orderBy(userRoles.name);
  }

  async getUserRole(id: number): Promise<UserRole | undefined> {
    const [role] = await db.select().from(userRoles).where(eq(userRoles.id, id));
    return role;
  }

  async getUserRoleByName(name: string): Promise<UserRole | undefined> {
    const [role] = await db.select().from(userRoles).where(eq(userRoles.name, name));
    return role;
  }

  async createUserRole(roleData: InsertUserRole): Promise<UserRole> {
    const [result] = await db.insert(userRoles).values(roleData);
    const insertId = (result as any).insertId;
    const [role] = await db.select().from(userRoles).where(eq(userRoles.id, insertId));
    if (!role) throw new Error("Role not found after creation");
    return role;
  }

  async updateUserRole(id: number, roleData: Partial<InsertUserRole>): Promise<UserRole> {
    await db
      .update(userRoles)
      .set({ ...roleData, updatedAt: new Date() })
      .where(eq(userRoles.id, id));

    const [updatedRole] = await db.select().from(userRoles).where(eq(userRoles.id, id));
    if (!updatedRole) throw new Error("Role not found after update");
    return updatedRole;
  }

  async deleteUserRole(id: number): Promise<void> {
    await db.delete(userRoles).where(eq(userRoles.id, id));
  }

  // ==== Audit Logs ====
  async createAuditLog(logData: InsertAuditLog): Promise<void> {
    await db.insert(auditLogs).values(logData);
  }

  // ==== Participant Types ====
  async getParticipantTypes(): Promise<ParticipantType[]> {
    return await db.select().from(participantTypes).orderBy(participantTypes.sortOrder);
  }

  async getParticipantType(id: number): Promise<ParticipantType | undefined> {
    const [type] = await db.select().from(participantTypes).where(eq(participantTypes.id, id));
    return type;
  }

  async createParticipantType(type: InsertParticipantType): Promise<ParticipantType> {
    const [result] = await db.insert(participantTypes).values(type);
    const id = result.insertId;
    const [newType] = await db.select().from(participantTypes).where(eq(participantTypes.id, id));
    return newType;
  }

  async updateParticipantType(id: number, type: Partial<InsertParticipantType>): Promise<ParticipantType> {
    await db.update(participantTypes).set(type).where(eq(participantTypes.id, id));
    const [updatedType] = await db.select().from(participantTypes).where(eq(participantTypes.id, id));
    return updatedType;
  }

  async deleteParticipantType(id: number): Promise<void> {
    await db.delete(participantTypes).where(eq(participantTypes.id, id));
  }

  // ==== Activity Statuses ====
  async getActivityStatuses(): Promise<ActivityStatus[]> {
    return await db.select().from(activityStatuses).orderBy(activityStatuses.sortOrder);
  }

  async getActivityStatus(id: number): Promise<ActivityStatus | undefined> {
    const [status] = await db.select().from(activityStatuses).where(eq(activityStatuses.id, id));
    return status;
  }

  async createActivityStatus(statusData: InsertActivityStatus): Promise<ActivityStatus> {
    const [result] = await db.insert(activityStatuses).values(statusData);
    const insertId = (result as any).insertId;
    const [newStatus] = await db.select().from(activityStatuses).where(eq(activityStatuses.id, insertId));
    return newStatus;
  }

  async updateActivityStatus(id: number, statusData: Partial<InsertActivityStatus>): Promise<ActivityStatus> {
    await db.update(activityStatuses).set(statusData).where(eq(activityStatuses.id, id));
    const [updatedStatus] = await db.select().from(activityStatuses).where(eq(activityStatuses.id, id));
    return updatedStatus;
  }

  async deleteActivityStatus(id: number): Promise<void> {
    await db.delete(activityStatuses).where(eq(activityStatuses.id, id));
  }

  // ==== User Activity Logs ====
  async logActivity(logData: InsertUserActivityLog): Promise<UserActivityLog> {
    const [result] = await db.insert(userActivityLogs).values(logData);
    const insertId = (result as any).insertId;
    const [log] = await db.select().from(userActivityLogs).where(eq(userActivityLogs.id, insertId));
    return log;
  }

  async getUserActivityLogs(limit: number = 100): Promise<(UserActivityLog & { user: { username: string, firstName: string, lastName: string } })[]> {
    const results = await db
      .select({
        log: userActivityLogs,
        user: {
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(userActivityLogs)
      .leftJoin(users, eq(userActivityLogs.userId, users.id))
      .orderBy(desc(userActivityLogs.createdAt))
      .limit(limit);

    return results.map(r => ({
      ...r.log,
      user: r.user ? {
        username: r.user.username,
        firstName: r.user.firstName || '',
        lastName: r.user.lastName || '',
      } : { username: 'deleted', firstName: 'Deleted', lastName: 'User' }
    })) as any;
  }

  // ==== Course Quotes Grid ====
  async getCourseQuotesGrid(activityType?: string): Promise<CourseQuotesGrid[]> {
    let query = db.select().from(courseQuotesGrid);
    if (activityType) {
      query = query.where(eq(courseQuotesGrid.activityType, activityType)) as any;
    }
    return await query.orderBy(courseQuotesGrid.sortOrder);
  }

  async upsertCourseQuotesGridBulk(gridItems: InsertCourseQuotesGrid[], activityType?: string): Promise<void> {
    await db.transaction(async (tx) => {
      if (activityType) {
        await tx.delete(courseQuotesGrid).where(eq(courseQuotesGrid.activityType, activityType));
      } else {
        await tx.delete(courseQuotesGrid);
      }

      if (gridItems.length > 0) {
        let itemsToInsert = gridItems;
        // Ensure inserted items have the activityType populated correctly if specified
        if (activityType) {
          itemsToInsert = gridItems.map(item => ({ ...item, activityType }));
        }
        await tx.insert(courseQuotesGrid).values(itemsToInsert);
      }
    });
  }

  // ==== Booking Service Categories ====
  async getBookingServiceCategories(): Promise<BookingServiceCategory[]> {
    return await db.select().from(bookingServiceCategories).orderBy(bookingServiceCategories.sortOrder);
  }

  async getBookingServiceCategory(id: number): Promise<BookingServiceCategory | undefined> {
    const [category] = await db.select().from(bookingServiceCategories).where(eq(bookingServiceCategories.id, id));
    return category;
  }

  async createBookingServiceCategory(category: InsertBookingServiceCategory): Promise<BookingServiceCategory> {
    const [result] = await db.insert(bookingServiceCategories).values(category as any);
    const id = (result as any).insertId || (result as any).id;
    const fetched = await this.getBookingServiceCategory(id);
    return fetched!;
  }

  async updateBookingServiceCategory(id: number, category: Partial<InsertBookingServiceCategory>): Promise<BookingServiceCategory> {
    await db
      .update(bookingServiceCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(bookingServiceCategories.id, id));

    const updated = await this.getBookingServiceCategory(id);
    return updated!;
  }

  async deleteBookingServiceCategory(id: number): Promise<void> {
    await db.delete(bookingServiceCategories).where(eq(bookingServiceCategories.id, id));
  }

  // ==== Booking Services ====
  async getBookingServices(): Promise<BookingService[]> {
    return await db.select().from(bookingServices).orderBy(bookingServices.name);
  }

  async getBookingService(id: number): Promise<BookingService | undefined> {
    const [service] = await db.select().from(bookingServices).where(eq(bookingServices.id, id));
    return service;
  }

  async createBookingService(service: InsertBookingService): Promise<BookingService> {
    const [result] = await db.insert(bookingServices).values(service);
    const [newService] = await db.select().from(bookingServices).where(eq(bookingServices.id, result.insertId));
    return newService;
  }

  async updateBookingService(id: number, service: Partial<InsertBookingService>): Promise<BookingService> {
    await db.update(bookingServices).set(service).where(eq(bookingServices.id, id));
    const updated = await this.getBookingService(id);
    if (!updated) throw new Error("Booking service not found");
    return updated;
  }

  async deleteBookingService(id: number): Promise<void> {
    await db.delete(bookingServices).where(eq(bookingServices.id, id));
  }

  // ==== Merchandising Categories ====
  async getMerchandisingCategories(): Promise<MerchandisingCategory[]> {
    return await db.select().from(merchandisingCategories).orderBy(merchandisingCategories.sortOrder);
  }

  async getMerchandisingCategory(id: number): Promise<MerchandisingCategory | undefined> {
    const [category] = await db.select().from(merchandisingCategories).where(eq(merchandisingCategories.id, id));
    return category;
  }

  async createMerchandisingCategory(category: InsertMerchandisingCategory): Promise<MerchandisingCategory> {
    const [result] = await db.insert(merchandisingCategories).values(category as any);
    const id = (result as any).insertId || (result as any).id;
    const fetched = await this.getMerchandisingCategory(id);
    return fetched!;
  }

  async updateMerchandisingCategory(id: number, category: Partial<InsertMerchandisingCategory>): Promise<MerchandisingCategory> {
    await db
      .update(merchandisingCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(merchandisingCategories.id, id));

    const updated = await this.getMerchandisingCategory(id);
    return updated!;
  }

  async deleteMerchandisingCategory(id: number): Promise<void> {
    await db.delete(merchandisingCategories).where(eq(merchandisingCategories.id, id));
  }

  // ==== Rental Categories (Affitti) ====
  async getRentalCategories(): Promise<RentalCategory[]> {
    return await db.select().from(rentalCategories).orderBy(rentalCategories.sortOrder);
  }

  async getRentalCategory(id: number): Promise<RentalCategory | undefined> {
    const [category] = await db.select().from(rentalCategories).where(eq(rentalCategories.id, id));
    return category;
  }

  async createRentalCategory(category: InsertRentalCategory): Promise<RentalCategory> {
    const [result] = await db.insert(rentalCategories).values(category as any);
    const id = (result as any).insertId || (result as any).id;
    const fetched = await this.getRentalCategory(id);
    return fetched!;
  }

  async updateRentalCategory(id: number, category: Partial<InsertRentalCategory>): Promise<RentalCategory> {
    await db
      .update(rentalCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(rentalCategories.id, id));

    const updated = await this.getRentalCategory(id);
    return updated!;
  }

  async deleteRentalCategory(id: number): Promise<void> {
    await db.delete(rentalCategories).where(eq(rentalCategories.id, id));
  }

  // ==== Studio Bookings ====
  async getStudioBookings(startDate?: Date, endDate?: Date, seasonId?: number): Promise<(StudioBooking & {
    memberFirstName?: string | null;
    memberLastName?: string | null;
    studioName?: string | null;
    serviceName?: string | null;
    serviceColor?: string | null;
    instructorFirstName?: string | null;
    instructorLastName?: string | null;
    specialization?: string | null;
  })[]> {
    const instructorMembers = aliasedTable(members, 'instructorMembers');
    let query = db
      .select({
        id: studioBookings.id,
        memberId: studioBookings.memberId,
        studioId: studioBookings.studioId,
        serviceId: studioBookings.serviceId,
        title: studioBookings.title,
        description: studioBookings.description,
        bookingDate: studioBookings.bookingDate,
        startTime: studioBookings.startTime,
        endTime: studioBookings.endTime,
        status: studioBookings.status,
        paid: studioBookings.paid,
        amount: studioBookings.amount,
        googleEventId: studioBookings.googleEventId,
        createdAt: studioBookings.createdAt,
        updatedAt: studioBookings.updatedAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        memberEmail: members.email,
        memberPhone: members.phone,
        memberMobile: members.mobile,
        studioName: studios.name,
        googleCalendarId: studios.googleCalendarId,
        serviceName: bookingServices.name,
        serviceColor: bookingServices.color,
        instructorId: studioBookings.instructorId,
        instructorFirstName: instructorMembers.firstName,
        instructorLastName: instructorMembers.lastName,
        specialization: instructorMembers.specialization,
        seasonId: studioBookings.seasonId,
      })
      .from(studioBookings)
      .leftJoin(members, eq(studioBookings.memberId, members.id))
      .leftJoin(studios, eq(studioBookings.studioId, studios.id))
      .leftJoin(bookingServices, eq(studioBookings.serviceId, bookingServices.id))
      .leftJoin(instructorMembers, eq(studioBookings.instructorId, instructorMembers.id));

    const conditions = [];
    if (startDate && endDate) {
      conditions.push(gte(sql`DATE(${studioBookings.bookingDate})`, sql`DATE(${startDate.toISOString().split('T')[0]})`));
      conditions.push(lte(sql`DATE(${studioBookings.bookingDate})`, sql`DATE(${endDate.toISOString().split('T')[0]})`));
    }
    if (seasonId) {
      conditions.push(eq(studioBookings.seasonId, seasonId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(studioBookings.bookingDate), studioBookings.startTime);
  }

  async getStudioBooking(id: number): Promise<StudioBooking | undefined> {
    const [booking] = await db.select().from(studioBookings).where(eq(studioBookings.id, id));
    return booking;
  }

  async createStudioBooking(booking: InsertStudioBooking): Promise<StudioBooking> {
    const activeSeason = await this.getActiveSeason();
    const dateValue = booking.bookingDate instanceof Date ? booking.bookingDate : new Date(booking.bookingDate);
    const [result] = await db.insert(studioBookings).values({
      ...booking,
      bookingDate: dateValue.toISOString().split('T')[0],
      seasonId: booking.seasonId || activeSeason?.id || null
    } as any);
    const [newBooking] = await db.select().from(studioBookings).where(eq(studioBookings.id, result.insertId));
    return newBooking;
  }

  async updateStudioBooking(id: number, booking: Partial<InsertStudioBooking>): Promise<StudioBooking> {
    const updateData: any = { ...booking };
    // Remove metadata fields that shouldn't be updated manually
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    if (updateData.bookingDate) {
      const d = updateData.bookingDate instanceof Date ? updateData.bookingDate : new Date(updateData.bookingDate);
      updateData.bookingDate = d.toISOString().split('T')[0] as any;
    }
    await db.update(studioBookings).set(updateData).where(eq(studioBookings.id, id));
    const updated = await this.getStudioBooking(id);
    if (!updated) throw new Error("Studio booking not found");
    return updated;
  }

  async deleteStudioBooking(id: number): Promise<void> {
    await db.delete(studioBookings).where(eq(studioBookings.id, id));
  }

  // ==== Members ====
  async getMembers(): Promise<Member[]> {
    return await db.select().from(members).orderBy(desc(members.createdAt));
  }

  async getMembersWithEntityCards(): Promise<Member[]> {
    const list = await db.select().from(members)
      .where(
        or(
          isNotNull(members.entityCardNumber),
          isNotNull(members.entityCardType),
          sql`JSON_EXTRACT(${members.tessereMetadata}, '$.tesseraEnte') IS NOT NULL AND JSON_EXTRACT(${members.tessereMetadata}, '$.tesseraEnte') != '""' AND JSON_EXTRACT(${members.tessereMetadata}, '$.tesseraEnte') != ''`,
          sql`JSON_EXTRACT(${members.attachmentMetadata}, '$.tesseraEnte.ente') IS NOT NULL AND JSON_EXTRACT(${members.attachmentMetadata}, '$.tesseraEnte.ente') != '""' AND JSON_EXTRACT(${members.attachmentMetadata}, '$.tesseraEnte.ente') != ''`
        )
      )
      .orderBy(members.lastName, members.firstName);

    return list.map(m => {
      // Decode tessereMetadata for Num and Expiry
      if (m.tessereMetadata) {
        try {
          const meta = typeof m.tessereMetadata === 'string' ? JSON.parse(m.tessereMetadata) : m.tessereMetadata;
          if (meta.tesseraEnte && !m.entityCardNumber) {
            m.entityCardNumber = meta.tesseraEnte;
          }
          if (meta.scadenzaTesseraEnte && !m.entityCardExpiryDate) {
            m.entityCardExpiryDate = new Date(meta.scadenzaTesseraEnte);
          }
        } catch (e) {
          console.error("Failed to parse tessereMetadata for entity card fallback", e);
        }
      }
      
      // Decode attachmentMetadata for Type/Ente Name
      if (m.attachmentMetadata) {
        try {
          const att = typeof m.attachmentMetadata === 'string' ? JSON.parse(m.attachmentMetadata) : m.attachmentMetadata;
          if (att?.tesseraEnte?.ente && !m.entityCardType) {
            m.entityCardType = att.tesseraEnte.ente;
          }
        } catch (e) {
          console.error("Failed to parse attachmentMetadata for entity card type fallback", e);
        }
      }
      
      return m;
    });
  }

  async getMembersPaginated(
    page: number,
    pageSize: number,
    search?: string,
    season?: string,
    status?: string,
    gender?: string,
    hasMedicalCert?: string,
    isMinor?: string,
    participantType?: string,
    hasCard?: string,
    hasEntityCard?: string,
    hasEmail?: string,
    hasPhone?: string,
    missingFiscalCode?: string,
    issuesFilter?: string
  ): Promise<{ members: (Member & { activeCourseCount: number })[]; total: number }> {
    const offset = (page - 1) * pageSize;

    let searchCondition = sql`1 = 1`;
    if (search && search.trim().length >= 2) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      searchCondition = sql`(
        LOWER(first_name) LIKE ${searchTerm} OR 
        LOWER(last_name) LIKE ${searchTerm} OR 
        LOWER(email) LIKE ${searchTerm} OR 
        LOWER(fiscal_code) LIKE ${searchTerm} OR
        LOWER(card_number) LIKE ${searchTerm} OR
        LOWER(CONCAT(first_name, ' ', last_name)) LIKE ${searchTerm} OR
        LOWER(CONCAT(last_name, ' ', first_name)) LIKE ${searchTerm}
      )`;
    }

    // Add optional filters
    if (season && season !== "all") {
      searchCondition = sql`${searchCondition} AND season = ${season}`;
    }

    if (status && status !== "all") {
      if (status === "active") searchCondition = sql`${searchCondition} AND active = 1`;
      else if (status === "inactive") searchCondition = sql`${searchCondition} AND active = 0`;
    }

    if (gender && gender !== "all") {
      searchCondition = sql`${searchCondition} AND gender = ${gender}`;
    }

    if (hasMedicalCert && hasMedicalCert !== "all") {
      if (hasMedicalCert === "yes") searchCondition = sql`${searchCondition} AND has_medical_certificate = 1`;
      else if (hasMedicalCert === "no") searchCondition = sql`${searchCondition} AND has_medical_certificate = 0`;
      else if (hasMedicalCert === "expired") searchCondition = sql`${searchCondition} AND has_medical_certificate = 1 AND medical_certificate_expiry < CURRENT_DATE()`;
    }

    if (isMinor && isMinor !== "all") {
      if (isMinor === "yes") searchCondition = sql`${searchCondition} AND is_minor = 1`;
      else if (isMinor === "no") searchCondition = sql`${searchCondition} AND is_minor = 0`;
    }

    if (participantType && participantType !== "all") {
      searchCondition = sql`${searchCondition} AND LOWER(participant_type) LIKE LOWER(${'%' + participantType + '%'})`;
    }

    if (hasCard && hasCard !== "all") {
      if (hasCard === "yes") searchCondition = sql`${searchCondition} AND card_number IS NOT NULL AND card_number != ''`;
      else if (hasCard === "no") searchCondition = sql`${searchCondition} AND (card_number IS NULL OR card_number = '')`;
      else if (hasCard === "expired") searchCondition = sql`${searchCondition} AND card_number IS NOT NULL AND card_expiry_date < CURRENT_DATE()`;
    }

    if (hasEntityCard && hasEntityCard !== "all") {
      if (hasEntityCard === "yes") searchCondition = sql`${searchCondition} AND entity_card_number IS NOT NULL AND entity_card_number != ''`;
      else if (hasEntityCard === "no") searchCondition = sql`${searchCondition} AND (entity_card_number IS NULL OR entity_card_number = '')`;
      else if (hasEntityCard === "expired") searchCondition = sql`${searchCondition} AND entity_card_number IS NOT NULL AND entity_card_expiry_date < CURRENT_DATE()`;
    }

    if (hasEmail && hasEmail !== "all") {
      if (hasEmail === "yes") searchCondition = sql`${searchCondition} AND email IS NOT NULL AND email != ''`;
      else if (hasEmail === "no") searchCondition = sql`${searchCondition} AND (email IS NULL OR email = '')`;
    }

    if (hasPhone && hasPhone !== "all") {
      if (hasPhone === "yes") searchCondition = sql`${searchCondition} AND ((phone IS NOT NULL AND phone != '') OR (mobile IS NOT NULL AND mobile != ''))`;
      else if (hasPhone === "no") searchCondition = sql`${searchCondition} AND (phone IS NULL OR phone = '') AND (mobile IS NULL OR mobile = '')`;
    }

    if (missingFiscalCode && missingFiscalCode === "yes") {
      searchCondition = sql`${searchCondition} AND (fiscal_code IS NULL OR fiscal_code = '')`;
    }

    // Issues filter prioritizes data problems
    if (issuesFilter === "any") {
      searchCondition = sql`${searchCondition} AND (
         (fiscal_code IS NULL OR fiscal_code = '') OR
         (email IS NULL OR email = '') OR 
         ((phone IS NULL OR phone = '') AND (mobile IS NULL OR mobile = ''))
       )`;
    }

    // Use raw SQL for the complete query with subquery
    const [rows]: any = await db.execute(searchCondition === sql`1 = 1` ? sql`
      SELECT
        m.*,
        COALESCE((
          SELECT COUNT(*) 
          FROM enrollments e 
          WHERE e.member_id = m.id AND e.status = 'active'
        ), 0) as active_course_count,
        (
          SELECT JSON_OBJECT(
            'id', mm.id,
            'membershipNumber', mm.membership_number,
            'barcode', mm.barcode,
            'issueDate', mm.issue_date,
            'expiryDate', mm.expiry_date
          )
          FROM memberships mm
          WHERE mm.member_id = m.id AND mm.status = 'active'
          ORDER BY mm.expiry_date DESC
          LIMIT 1
        ) as active_membership
      FROM members m
      ORDER BY m.last_name, m.first_name
      LIMIT ${pageSize}
      OFFSET ${offset}
    ` : sql`
      SELECT
        m.*,
        COALESCE((
          SELECT COUNT(*) 
          FROM enrollments e 
          WHERE e.member_id = m.id AND e.status = 'active'
        ), 0) as active_course_count,
        (
          SELECT JSON_OBJECT(
            'id', mm.id,
            'membershipNumber', mm.membership_number,
            'barcode', mm.barcode,
            'issueDate', mm.issue_date,
            'expiryDate', mm.expiry_date
          )
          FROM memberships mm
          WHERE mm.member_id = m.id AND mm.status = 'active'
          ORDER BY mm.expiry_date DESC
          LIMIT 1
        ) as active_membership
      FROM members m
      WHERE ${searchCondition}
      ORDER BY m.last_name, m.first_name
      LIMIT ${pageSize}
      OFFSET ${offset}
    `);

    // Count query
    const [countRows]: any = await db.execute(searchCondition === sql`1 = 1` ? sql`
      SELECT COUNT(*) as count FROM members
    ` : sql`
      SELECT COUNT(*) as count FROM members WHERE ${searchCondition}
    `);
    const total = Number(countRows[0]?.count || 0);

    // Map snake_case to camelCase
    const membersList = rows.map((row: any) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      fiscalCode: row.fiscal_code,
      dateOfBirth: row.date_of_birth,
      placeOfBirth: row.place_of_birth,
      gender: row.gender,
      email: row.email,
      phone: row.phone,
      mobile: row.mobile,
      categoryId: row.category_id,
      subscriptionTypeId: row.subscription_type_id,
      cardNumber: row.card_number,
      cardIssueDate: row.card_issue_date,
      cardExpiryDate: row.card_expiry_date,
      entityCardType: row.entity_card_type,
      entityCardNumber: row.entity_card_number,
      entityCardIssueDate: row.entity_card_issue_date,
      entityCardExpiryDate: row.entity_card_expiry_date,
      hasMedicalCertificate: row.has_medical_certificate,
      medicalCertificateExpiry: row.medical_certificate_expiry,
      isMinor: row.is_minor,
      motherFirstName: row.mother_first_name,
      motherLastName: row.mother_last_name,
      motherFiscalCode: row.mother_fiscal_code,
      motherEmail: row.mother_email,
      motherPhone: row.mother_phone,
      motherMobile: row.mother_mobile,
      fatherFirstName: row.father_first_name,
      fatherLastName: row.father_last_name,
      fatherFiscalCode: row.father_fiscal_code,
      fatherEmail: row.father_email,
      fatherPhone: row.father_phone,
      fatherMobile: row.father_mobile,
      streetAddress: row.street_address,
      city: row.city,
      province: row.province,
      postalCode: row.postal_code,
      country: row.country,
      address: row.address,
      notes: row.notes,
      photoUrl: row.photo_url,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      activeCourseCount: row.active_course_count || 0,
      privacyAccepted: row.privacy_accepted,
      regulationsAccepted: row.regulations_accepted,
      membershipApplicationSigned: row.membership_application_signed,
      tessereMetadata: row.tessere_metadata,
      certificatoMedicoMetadata: row.certificato_medico_metadata,
      giftMetadata: row.gift_metadata,
      attachmentMetadata: row.attachment_metadata,
      paymentMetadata: row.payment_metadata,
      activeMembership: row.active_membership ? (typeof row.active_membership === 'string' ? JSON.parse(row.active_membership) : row.active_membership) : null,
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
      sql`UPPER(${members.fiscalCode}) = ${fiscalCode.toUpperCase()} `
    );
    return member;
  }

  async getDuplicateFiscalCodes(): Promise<{ fiscalCode: string; members: { id: number; firstName: string; lastName: string; }[] }[]> {
    // We will fetch all members and cluster them by finding pairs with >= 2 matching data points.
    // Data points evaluated: first_name, last_name, fiscal_code, email, mobile/phone, date_of_birth (if present)
    const allMembers = await db.select({
      id: members.id,
      firstName: members.firstName,
      lastName: members.lastName,
      fiscalCode: members.fiscalCode,
      email: members.email,
      mobile: members.mobile,
      phone: members.phone,
      dateOfBirth: members.dateOfBirth,
      isMinor: members.isMinor
    }).from(members);

    const isMatch = (m1: any, m2: any) => {
      // 1. Exact Fiscal Code match is ALWAYS a duplicate (unless both are empty)
      if (m1.fiscalCode && m2.fiscalCode && m1.fiscalCode.toUpperCase().trim() === m2.fiscalCode.toUpperCase().trim()) {
        return true;
      }

      let matches = 0;
      let firstNameMatch = false;
      let contactOrDemographicMatch = false;

      const f1 = (m1.firstName || '').toLowerCase().trim();
      const f2 = (m2.firstName || '').toLowerCase().trim();
      if (f1 && f2 && f1 === f2) {
        matches++;
        firstNameMatch = true;
      }

      const l1 = (m1.lastName || '').toLowerCase().trim();
      const l2 = (m2.lastName || '').toLowerCase().trim();
      if (l1 && l2 && l1 === l2) {
        matches++;
      }

      const e1 = (m1.email || '').toLowerCase().trim();
      const e2 = (m2.email || '').toLowerCase().trim();
      if (e1 && e2 && e1 === e2) {
        matches++;
        contactOrDemographicMatch = true;
      }

      const p1 = (m1.mobile || m1.phone || '').trim();
      const p2 = (m2.mobile || m2.phone || '').trim();
      if (p1 && p2 && p1 === p2) {
        matches++;
        contactOrDemographicMatch = true;
      }

      if (m1.dateOfBirth && m2.dateOfBirth && m1.dateOfBirth === m2.dateOfBirth) {
        matches++;
        contactOrDemographicMatch = true;
      }

      // CRITICAL RULE: If First Names are different, they are definitely different people 
      // (likely parents/children/spouses sharing contact info).
      if (!firstNameMatch) {
        return false;
      }

      // OMONOMY PROTECTION: 
      // If the ONLY matches are Name + Surname (matches === 2), but they have no matching contact info / DOB,
      // they are homonyms, NOT duplicates. They need at least one contact/demo match to be confirmed duplicates.
      if (matches === 2 && !contactOrDemographicMatch) {
        return false;
      }

      return matches >= 2;
    };

    const visited = new Set<number>();
    const clusters: any[] = [];

    for (let i = 0; i < allMembers.length; i++) {
      const m1 = allMembers[i];
      if (visited.has(m1.id)) continue;

      const currentCluster = [m1];
      visited.add(m1.id);

      for (let j = i + 1; j < allMembers.length; j++) {
        const m2 = allMembers[j];
        if (visited.has(m2.id)) continue;

        if (isMatch(m1, m2)) {
          currentCluster.push(m2);
          visited.add(m2.id);
        }
      }

      if (currentCluster.length > 1) {
        // Find a representative label for the cluster (e.g. Fiscal Code or Name)
        const primaryFiscalCode = currentCluster.find(m => m.fiscalCode)?.fiscalCode || `Nome: ${currentCluster[0].firstName} ${currentCluster[0].lastName}`;

        clusters.push({
          fiscalCode: primaryFiscalCode.toUpperCase(),
          members: currentCluster.map(m => ({
            id: m.id,
            firstName: m.firstName,
            lastName: m.lastName,
            fiscalCode: m.fiscalCode,
            email: m.email
          }))
        });
      }
    }

    return clusters;
  }

  async createMember(member: InsertMember): Promise<Member> {
    const [result] = await db.insert(members).values(member);
    const [newMember] = await db.select().from(members).where(eq(members.id, result.insertId));

    // Sync membership if card data exists
    if (newMember.cardNumber) {
      await this.syncMembershipFromMember(newMember);
    }

    // Sync medical certificate if data exists
    if (newMember.hasMedicalCertificate) {
      await this.syncMedicalCertificateFromMember(newMember);
    }

    // Sync instructor if staff
    if (newMember.participantType && newMember.participantType.toLowerCase().startsWith('staff')) {
      await this.syncInstructorFromMember(newMember);
    }

    return newMember;
  }

  async updateMember(id: number, member: Partial<InsertMember>): Promise<Member> {
    await db
      .update(members)
      .set({ ...member, updatedAt: new Date() })
      .where(eq(members.id, id));

    const [updated] = await db.select().from(members).where(eq(members.id, id));

    // Sync membership if card data exists or was updated
    if (member.cardNumber !== undefined || member.cardIssueDate !== undefined || member.cardExpiryDate !== undefined) {
      await this.syncMembershipFromMember(updated);
    }

    // Sync medical certificate if data exists or was updated
    if (member.hasMedicalCertificate !== undefined || member.medicalCertificateExpiry !== undefined) {
      await this.syncMedicalCertificateFromMember(updated);
    }

    // Sync instructor if staff
    if (member.participantType !== undefined) {
      if (updated.participantType && updated.participantType.toLowerCase().startsWith('staff')) {
        await this.syncInstructorFromMember(updated);
      }
    }

    return updated;
  }

  async deleteMember(id: number): Promise<void> {
    await db.delete(members).where(eq(members.id, id));
  }

  async bulkCreateMembers(membersData: InsertMember[]): Promise<{ imported: number; skipped: number }> {
    let imported = 0;
    let skipped = 0;

    for (const data of membersData) {
      try {
        // Double check for duplicate fiscal code within the bulk process
        if (data.fiscalCode) {
          const existing = await this.getMemberByFiscalCode(data.fiscalCode);
          if (existing) {
            skipped++;
            continue;
          }
        }
        await this.createMember(data);
        imported++;
      } catch (err) {
        console.error("Error creating member in bulk:", err);
        skipped++;
      }
    }

    return { imported, skipped };
  }

  // ==== Duplicates and Merging ====

  async checkDuplicateParticipant(data: any, excludeId?: number): Promise<{ isDuplicate: boolean; duplicateFields: string[]; message?: string }> {
    const duplicateFields: string[] = [];
    const normalizedData = {
      firstName: data.firstName ? data.firstName.trim().toLowerCase() : undefined,
      lastName: data.lastName ? data.lastName.trim().toLowerCase() : undefined,
      fiscalCode: data.fiscalCode ? data.fiscalCode.trim().toUpperCase() : undefined,
      email: data.email ? data.email.trim().toLowerCase() : undefined,
      mobile: data.mobile ? data.mobile.trim() : undefined,
    };

    let conditions: any[] = [];

    if (normalizedData.fiscalCode) {
      conditions.push(eq(members.fiscalCode, normalizedData.fiscalCode));
    }
    if (normalizedData.email) {
      conditions.push(eq(members.email, normalizedData.email));
    }
    if (normalizedData.mobile) {
      conditions.push(eq(members.mobile, normalizedData.mobile));
    }
    if (normalizedData.firstName && normalizedData.lastName) {
      conditions.push(
        and(
          eq(sql`LOWER(${members.firstName})`, normalizedData.firstName),
          eq(sql`LOWER(${members.lastName})`, normalizedData.lastName)
        )
      );
    }

    if (conditions.length === 0) {
      return { isDuplicate: false, duplicateFields: [] };
    }

    // Build the query
    let baseQuery = db.select().from(members).where(or(...conditions));
    const potentialDuplicates = await baseQuery;

    // Filter out the excluded member (if updating existing)
    const duplicates = potentialDuplicates.filter(d => d.id !== excludeId);

    if (duplicates.length > 0) {
      for (const d of duplicates) {
        if (normalizedData.fiscalCode && d.fiscalCode?.toUpperCase() === normalizedData.fiscalCode) {
          if (!duplicateFields.includes("Codice Fiscale")) duplicateFields.push("Codice Fiscale");
        }
        if (normalizedData.email && d.email?.toLowerCase() === normalizedData.email) {
          if (!duplicateFields.includes("Email")) duplicateFields.push("Email");
        }
        if (normalizedData.mobile && d.mobile === normalizedData.mobile) {
          if (!duplicateFields.includes("Cellulare")) duplicateFields.push("Cellulare");
        }
        if (normalizedData.firstName && normalizedData.lastName &&
          d.firstName.toLowerCase() === normalizedData.firstName &&
          d.lastName.toLowerCase() === normalizedData.lastName) {
          if (!duplicateFields.includes("Cognome e Nome")) duplicateFields.push("Cognome e Nome");
        }
      }

      return {
        isDuplicate: true,
        duplicateFields,
        message: `Dati già presenti nel sistema: ${duplicateFields.join(", ")}.`
      };
    }

    return { isDuplicate: false, duplicateFields: [] };
  }

  async getDuplicateStats(): Promise<{ byFiscalCode: number; byEmail: number; byPhone: number; byName: number }> {
    // We run raw SQL group by aggregations to find duplicates efficiently
    const [cfRows]: any = await db.execute(sql`
      SELECT fiscal_code, COUNT(*) as c FROM members 
      WHERE fiscal_code IS NOT NULL AND fiscal_code != '' 
      GROUP BY fiscal_code HAVING c > 1
    `);

    const [emailRows]: any = await db.execute(sql`
      SELECT email, COUNT(*) as c FROM members 
      WHERE email IS NOT NULL AND email != '' 
      GROUP BY email HAVING c > 1
    `);

    const [phoneRows]: any = await db.execute(sql`
      SELECT mobile, COUNT(*) as c FROM members 
      WHERE mobile IS NOT NULL AND mobile != '' 
      GROUP BY mobile HAVING c > 1
    `);

    const [nameRows]: any = await db.execute(sql`
      SELECT first_name, last_name, COUNT(*) as c FROM members 
      GROUP BY LOWER(first_name), LOWER(last_name) HAVING c > 1
    `);

    return {
      byFiscalCode: cfRows.length,
      byEmail: emailRows.length,
      byPhone: phoneRows.length,
      byName: nameRows.length
    };
  }

  async getMissingDataCounts(): Promise<{ missingFiscalCode: number; missingEmail: number; missingPhone: number }> {
    const [cfRows]: any = await db.execute(sql`SELECT COUNT(*) as count FROM members WHERE fiscal_code IS NULL OR fiscal_code = ''`);
    const [emailRows]: any = await db.execute(sql`SELECT COUNT(*) as count FROM members WHERE email IS NULL OR email = ''`);
    const [phoneRows]: any = await db.execute(sql`SELECT COUNT(*) as count FROM members WHERE (phone IS NULL OR phone = '') AND (mobile IS NULL OR mobile = '')`);

    return {
      missingFiscalCode: Number(cfRows[0]?.count || 0),
      missingEmail: Number(emailRows[0]?.count || 0),
      missingPhone: Number(phoneRows[0]?.count || 0),
    };
  }

  async mergeMembers(primaryId: number, secondaryIds: number[]): Promise<void> {
    if (!secondaryIds || secondaryIds.length === 0) return;

    // 1. Reassign enrollments
    await db.update(enrollments).set({ memberId: primaryId }).where(inArray(enrollments.memberId, secondaryIds));

    // 2. Reassign workshop enrollments
    await db.update(workshopEnrollments).set({ memberId: primaryId }).where(inArray(workshopEnrollments.memberId, secondaryIds));

    // 3. Reassign attendance records
    await db.update(attendances).set({ memberId: primaryId }).where(inArray(attendances.memberId, secondaryIds));

    // 4. Reassign payments
    await db.update(payments)
      .set({ memberId: primaryId })
      .where(inArray(payments.memberId, secondaryIds));

    // 5. Reassign medical certificates
    await db.update(medicalCertificates).set({ memberId: primaryId }).where(inArray(medicalCertificates.memberId, secondaryIds));

    // 6. Reassign memberships
    await db.update(memberships).set({ memberId: primaryId }).where(inArray(memberships.memberId, secondaryIds));

    // 7. Delete secondary members
    await db.delete(members).where(inArray(members.id, secondaryIds));
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
    const [result] = await db.insert(categories).values(category);
    const [newCategory] = await db.select().from(categories).where(eq(categories.id, result.insertId));
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    await db
      .update(categories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(categories.id, id));

    const [updated] = await db.select().from(categories).where(eq(categories.id, id));
    return updated;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
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
    const [result] = await db.insert(clientCategories).values(category);
    const [newCategory] = await db.select().from(clientCategories).where(eq(clientCategories.id, result.insertId));
    return newCategory;
  }

  async updateClientCategory(id: number, category: Partial<InsertClientCategory>): Promise<ClientCategory> {
    await db
      .update(clientCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(clientCategories.id, id));

    const [updated] = await db.select().from(clientCategories).where(eq(clientCategories.id, id));
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
    const [result] = await db.insert(subscriptionTypes).values(subscriptionType);
    const [newSubscriptionType] = await db.select().from(subscriptionTypes).where(eq(subscriptionTypes.id, result.insertId));
    return newSubscriptionType;
  }

  async updateSubscriptionType(id: number, data: Partial<InsertSubscriptionType>): Promise<SubscriptionType> {
    await db
      .update(subscriptionTypes)
      .set(data)
      .where(eq(subscriptionTypes.id, id));

    const [updated] = await db.select().from(subscriptionTypes).where(eq(subscriptionTypes.id, id));
    return updated;
  }

  async deleteSubscriptionType(id: number): Promise<void> {
    await db.delete(subscriptionTypes).where(eq(subscriptionTypes.id, id));
  }

  // ==== Instructors (Le persone con participantType che contiene INSEGNANTE o STAFF) ====
  async getInstructors(): Promise<Instructor[]> {
    return await db.select()
      .from(members)
      .where(
        or(
          eq(members.participantType, "INSEGNANTE"),
          sql`LOWER(${members.participantType}) LIKE '%insegnante%'`,
          sql`LOWER(${members.participantType}) LIKE '%staff%'`
        )
      )
      .orderBy(members.lastName, members.firstName);
  }

  async getInstructor(id: number): Promise<Instructor | undefined> {
    const [instructor] = await db.select()
      .from(members)
      .where(
        and(
          eq(members.id, id),
          or(
            eq(members.participantType, "INSEGNANTE"),
            sql`LOWER(${members.participantType}) LIKE '%insegnante%'`,
            sql`LOWER(${members.participantType}) LIKE '%staff%'`
          )
        )
      );
    return instructor;
  }

  async createInstructor(instructor: InsertInstructor): Promise<Instructor> {
    const [result] = await db.insert(members).values({
      firstName: instructor.firstName || "Nuovo",
      lastName: instructor.lastName || "Insegnante",
      ...instructor,
      participantType: "INSEGNANTE"
    } as any);
    const [newInstructor] = await db.select()
      .from(members)
      .where(eq(members.id, result.insertId));
    return newInstructor;
  }

  async updateInstructor(id: number, instructor: Partial<InsertInstructor>): Promise<Instructor> {
    await db
      .update(members)
      .set(instructor)
      .where(
        and(
          eq(members.id, id),
          or(
            eq(members.participantType, "INSEGNANTE"),
            sql`LOWER(${members.participantType}) LIKE '%insegnante%'`,
            sql`LOWER(${members.participantType}) LIKE '%staff%'`
          )
        )
      );
    const [updated] = await db.select()
      .from(members)
      .where(eq(members.id, id));
    return updated;
  }

  async deleteInstructor(id: number): Promise<void> {
    await db.delete(members)
      .where(
        and(
          eq(members.id, id),
          or(
            eq(members.participantType, "INSEGNANTE"),
            sql`LOWER(${members.participantType}) LIKE '%insegnante%'`,
            sql`LOWER(${members.participantType}) LIKE '%staff%'`
          )
        )
      );
  }

  async getInstructorByEmail(email: string): Promise<Instructor | undefined> {
    const [instructor] = await db.select()
      .from(members)
      .where(
        and(
          eq(members.email, email),
          or(
            eq(members.participantType, "INSEGNANTE"),
            sql`LOWER(${members.participantType}) LIKE '%insegnante%'`,
            sql`LOWER(${members.participantType}) LIKE '%staff%'`
          )
        )
      );
    return instructor;
  }

  async syncInstructorFromMember(member: Member): Promise<void> {
    // No-op: handled dynamically by querying members table directly.
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
    // Ensure JSON fields are stringified if they are objects, or passed as is if already handled by driver
    const dataToSave = {
      name: studioData.name,
      floor: studioData.floor ?? null,
      operatingHours: studioData.operatingHours ?? null,
      operatingDays: studioData.operatingDays ?? null,
      capacity: studioData.capacity ?? null,
      equipment: studioData.equipment ?? null,
      notes: studioData.notes ?? null,
      active: studioData.active !== undefined ? studioData.active : true,
      googleCalendarId: studioData.googleCalendarId ?? null,
      updatedAt: new Date(),
    };

    const [result] = await db
      .insert(studios)
      .values(dataToSave as any);

    const insertId = (result as any).insertId;
    const [studio] = await db.select().from(studios).where(eq(studios.id, insertId));
    if (!studio) throw new Error("Studio non trovato dopo la creazione");
    return studio;
  }

  async updateStudio(id: number, studioData: Partial<InsertStudio>): Promise<Studio> {
    await db
      .update(studios)
      .set(studioData)
      .where(eq(studios.id, id));

    const [studio] = await db.select().from(studios).where(eq(studios.id, id));
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
    const activeSeason = await this.getActiveSeason();
    const dataToSave = {
      ...course,
      startDate: course.startDate ? (course.startDate instanceof Date ? course.startDate.toISOString().split('T')[0] : course.startDate) : null,
      endDate: course.endDate ? (course.endDate instanceof Date ? course.endDate.toISOString().split('T')[0] : course.endDate) : null,
      seasonId: course.seasonId || activeSeason?.id || null
    };
    const [result] = await db.insert(courses).values(dataToSave as any);
    const id = (result as any).insertId || (result as any).id;
    const fetched = await this.getCourse(id);
    return fetched!;
  }

  async getCoursesBySeason(seasonId: number): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.seasonId, seasonId)).orderBy(desc(courses.createdAt));
  }

  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course> {
    const updateData = {
      ...course,
      updatedAt: new Date(),
      startDate: course.startDate ? (course.startDate instanceof Date ? course.startDate.toISOString().split('T')[0] : course.startDate) : course.startDate,
      endDate: course.endDate ? (course.endDate instanceof Date ? course.endDate.toISOString().split('T')[0] : course.endDate) : course.endDate,
    };

    await db
      .update(courses)
      .set(updateData as any)
      .where(eq(courses.id, id));

    const [updated] = await db.select().from(courses).where(eq(courses.id, id));
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
    const activeSeason = await this.getActiveSeason();
    const dataToSave = {
      ...workshop,
      startDate: workshop.startDate ? (workshop.startDate instanceof Date ? workshop.startDate.toISOString().split('T')[0] : workshop.startDate) : null,
      endDate: workshop.endDate ? (workshop.endDate instanceof Date ? workshop.endDate.toISOString().split('T')[0] : workshop.endDate) : null,
      seasonId: workshop.seasonId || activeSeason?.id || null
    };
    const [result] = await db.insert(workshops).values(dataToSave as any);
    const id = (result as any).insertId || (result as any).id;
    const fetched = await this.getWorkshop(id);
    return fetched!;
  }

  async getWorkshopsBySeason(seasonId: number): Promise<Workshop[]> {
    return await db.select().from(workshops).where(eq(workshops.seasonId, seasonId));
  }

  async updateWorkshop(id: number, workshop: Partial<InsertWorkshop>): Promise<Workshop> {
    await db
      .update(workshops)
      .set({ ...workshop, updatedAt: new Date() })
      .where(eq(workshops.id, id));

    const [updated] = await db.select().from(workshops).where(eq(workshops.id, id));
    return updated;
  }

  async deleteWorkshop(id: number): Promise<void> {
    await db.delete(workshops).where(eq(workshops.id, id));
  }

  // ==== Memberships ====
  async getMemberships(): Promise<Membership[]> {
    return await db.select().from(memberships).orderBy(desc(memberships.expiryDate));
  }

  async getMembershipsWithMembers(): Promise<(Membership & { memberFirstName?: string; memberLastName?: string; memberFiscalCode?: string; paymentDate?: string | Date | null; paymentStatus?: string | null })[]> {
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
        paymentDate: payments.paidDate,
        paymentStatus: payments.status,
      })
      .from(memberships)
      .leftJoin(members, eq(memberships.memberId, members.id))
      .leftJoin(payments, eq(memberships.id, payments.membershipId))
      .orderBy(desc(memberships.expiryDate));
    return result as any;
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
    const [result] = await db.insert(memberships).values({
      ...membership,
      issueDate: membership.issueDate instanceof Date ? membership.issueDate : new Date(membership.issueDate),
      expiryDate: membership.expiryDate ? (membership.expiryDate instanceof Date ? membership.expiryDate : new Date(membership.expiryDate)) : undefined,
    } as any);

    const [newMembership] = await db.select().from(memberships).where(eq(memberships.id, result.insertId));

    // Sync member data
    await this.syncMemberFromMembership(newMembership);

    return newMembership;
  }

  async updateMembership(id: number, membership: Partial<InsertMembership>): Promise<Membership> {
    await db
      .update(memberships)
      .set({
        ...membership,
        updatedAt: new Date(),
        issueDate: membership.issueDate ? (membership.issueDate instanceof Date ? membership.issueDate : new Date(membership.issueDate)) : undefined,
        expiryDate: membership.expiryDate ? (membership.expiryDate instanceof Date ? membership.expiryDate : new Date(membership.expiryDate)) : undefined,
      } as any)
      .where(eq(memberships.id, id));

    const [updated] = await db.select().from(memberships).where(eq(memberships.id, id));

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
    return result as any;
  }

  async getMedicalCertificatesByMemberId(memberId: number): Promise<MedicalCertificate[]> {
    return await db.select().from(medicalCertificates).where(eq(medicalCertificates.memberId, memberId)).orderBy(desc(medicalCertificates.expiryDate));
  }

  async getMedicalCertificate(id: number): Promise<MedicalCertificate | undefined> {
    const [cert] = await db.select().from(medicalCertificates).where(eq(medicalCertificates.id, id));
    return cert;
  }

  async createMedicalCertificate(cert: InsertMedicalCertificate): Promise<MedicalCertificate> {
    const [result] = await db.insert(medicalCertificates).values({
      ...cert,
      issueDate: cert.issueDate instanceof Date ? cert.issueDate : new Date(cert.issueDate),
      expiryDate: cert.expiryDate instanceof Date ? cert.expiryDate : new Date(cert.expiryDate),
    } as any);

    const [newCert] = await db.select().from(medicalCertificates).where(eq(medicalCertificates.id, result.insertId));

    // Sync member data
    await this.syncMemberFromMedicalCertificate(newCert);

    return newCert;
  }

  async updateMedicalCertificate(id: number, cert: Partial<InsertMedicalCertificate>): Promise<MedicalCertificate> {
    await db
      .update(medicalCertificates)
      .set({
        ...cert,
        updatedAt: new Date(),
        issueDate: cert.issueDate ? (cert.issueDate instanceof Date ? cert.issueDate : new Date(cert.issueDate)) : undefined,
        expiryDate: cert.expiryDate ? (cert.expiryDate instanceof Date ? cert.expiryDate : new Date(cert.expiryDate)) : undefined,
      } as any)
      .where(eq(medicalCertificates.id, id));

    const [updated] = await db.select().from(medicalCertificates).where(eq(medicalCertificates.id, id));

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
    const [result] = await db.insert(paymentMethods).values(method);
    const [newMethod] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, result.insertId));
    return newMethod;
  }

  async updatePaymentMethod(id: number, method: Partial<InsertPaymentMethod>): Promise<PaymentMethod> {
    await db
      .update(paymentMethods)
      .set({ ...method, updatedAt: new Date() })
      .where(eq(paymentMethods.id, id));

    const [updated] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id));
    return updated;
  }

  async deletePaymentMethod(id: number): Promise<void> {
    await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
  }

  // ==== Payments ====
  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getPaymentsWithMembers(): Promise<(Payment & { memberFirstName?: string; memberLastName?: string; createdBy?: string; updatedBy?: string })[]> {
    const createdUser = alias(users, "createdUser");
    const updatedUser = alias(users, "updatedUser");

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
        paymentMethodId: payments.paymentMethodId,
        notes: payments.notes,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        seasonId: payments.seasonId,
        workshopEnrollmentId: payments.workshopEnrollmentId,
        bookingId: payments.bookingId,
        membershipId: payments.membershipId,
        createdById: payments.createdById,
        updatedById: payments.updatedById,
        createdBy: createdUser.username,
        updatedBy: updatedUser.username,
      })
      .from(payments)
      .leftJoin(members, eq(payments.memberId, members.id))
      .leftJoin(createdUser, eq(payments.createdById, createdUser.id))
      .leftJoin(updatedUser, eq(payments.updatedById, updatedUser.id))
      .orderBy(desc(payments.createdAt));
    return result as any;
  }

  async getPaymentsByMemberId(memberId: number): Promise<(Payment & { memberFirstName?: string; memberLastName?: string; createdBy?: string; updatedBy?: string })[]> {
    const createdUser = alias(users, "createdUser");
    const updatedUser = alias(users, "updatedUser");

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
        paymentMethodId: payments.paymentMethodId,
        notes: payments.notes,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        seasonId: payments.seasonId,
        workshopEnrollmentId: payments.workshopEnrollmentId,
        bookingId: payments.bookingId,
        membershipId: payments.membershipId,
        createdById: payments.createdById,
        updatedById: payments.updatedById,
        createdBy: createdUser.username,
        updatedBy: updatedUser.username,
      })
      .from(payments)
      .leftJoin(members, eq(payments.memberId, members.id))
      .leftJoin(createdUser, eq(payments.createdById, createdUser.id))
      .leftJoin(updatedUser, eq(payments.updatedById, updatedUser.id))
      .where(eq(payments.memberId, memberId))
      .orderBy(desc(payments.createdAt));
    return result as any;
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const activeSeason = await this.getActiveSeason();
    const dataToSave = {
      ...payment,
      dueDate: payment.dueDate ? (payment.dueDate instanceof Date ? payment.dueDate.toISOString().split('T')[0] : payment.dueDate) : null,
      paidDate: payment.paidDate ? (payment.paidDate instanceof Date ? payment.paidDate : new Date(payment.paidDate)) : null,
      seasonId: payment.seasonId || activeSeason?.id || null
    };
    const [result] = await db.insert(payments).values(dataToSave as any);
    const [newPayment] = await db.select().from(payments).where(eq(payments.id, result.insertId));
    return newPayment;
  }

  async updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment> {
    const updateData = {
      ...payment,
      updatedAt: new Date(),
      dueDate: payment.dueDate ? (payment.dueDate instanceof Date ? payment.dueDate.toISOString().split('T')[0] : payment.dueDate) : payment.dueDate,
      paidDate: payment.paidDate ? (payment.paidDate instanceof Date ? payment.paidDate : new Date(payment.paidDate)) : payment.paidDate,
    };

    await db
      .update(payments)
      .set(updateData as any)
      .where(eq(payments.id, id));

    const [updated] = await db.select().from(payments).where(eq(payments.id, id));
    return updated;
  }

  async deletePayment(id: number): Promise<void> {
    await db.delete(payments).where(eq(payments.id, id));
  }

  // ==== Enrollments ====
  async getEnrollments(): Promise<(Enrollment & { memberFirstName?: string | null; memberLastName?: string | null; memberEmail?: string | null; memberFiscalCode?: string | null; memberGender?: string | null })[]> {
    const result = await db
      .select({
        id: enrollments.id,
        memberId: enrollments.memberId,
        courseId: enrollments.courseId,
        participationType: enrollments.participationType,
        targetDate: enrollments.targetDate,
        enrollmentDate: enrollments.enrollmentDate,
        status: enrollments.status,
        notes: enrollments.notes,
        details: enrollments.details,
        createdAt: enrollments.createdAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        memberEmail: members.email,
        memberFiscalCode: members.fiscalCode,
        memberGender: members.gender,
        seasonId: enrollments.seasonId,
      })
      .from(enrollments)
      .leftJoin(members, eq(enrollments.memberId, members.id))
      .orderBy(desc(enrollments.enrollmentDate));
    return result;
  }

  async getEnrollmentsByMember(memberId: number): Promise<(Enrollment & { memberFirstName?: string | null; memberLastName?: string | null; memberEmail?: string | null; memberFiscalCode?: string | null; memberGender?: string | null })[]> {
    const result = await db
      .select({
        id: enrollments.id,
        memberId: enrollments.memberId,
        courseId: enrollments.courseId,
        participationType: enrollments.participationType,
        targetDate: enrollments.targetDate,
        enrollmentDate: enrollments.enrollmentDate,
        status: enrollments.status,
        notes: enrollments.notes,
        details: enrollments.details,
        createdAt: enrollments.createdAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        memberEmail: members.email,
        memberFiscalCode: members.fiscalCode,
        memberGender: members.gender,
        seasonId: enrollments.seasonId,
      })
      .from(enrollments)
      .leftJoin(members, eq(enrollments.memberId, members.id))
      .where(eq(enrollments.memberId, memberId))
      .orderBy(desc(enrollments.enrollmentDate));
    return result;
  }

  async getEnrollmentsBySeason(seasonId: number): Promise<(Enrollment & { memberFirstName?: string | null; memberLastName?: string | null; memberEmail?: string | null; memberFiscalCode?: string | null; memberGender?: string | null })[]> {
    const result = await db
      .select({
        id: enrollments.id,
        memberId: enrollments.memberId,
        courseId: enrollments.courseId,
        participationType: enrollments.participationType,
        targetDate: enrollments.targetDate,
        enrollmentDate: enrollments.enrollmentDate,
        status: enrollments.status,
        notes: enrollments.notes,
        details: enrollments.details,
        createdAt: enrollments.createdAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        memberEmail: members.email,
        memberFiscalCode: members.fiscalCode,
        memberGender: members.gender,
        seasonId: enrollments.seasonId,
      })
      .from(enrollments)
      .leftJoin(members, eq(enrollments.memberId, members.id))
      .where(eq(enrollments.seasonId, seasonId))
      .orderBy(desc(enrollments.enrollmentDate));
    return result;
  }

  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, id));
    return enrollment;
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const activeSeason = await this.getActiveSeason();
    const dataWithSeason = {
      ...enrollment,
      seasonId: enrollment.seasonId || activeSeason?.id || null
    };
    const [result] = await db.insert(enrollments).values(dataWithSeason as any);
    const [newEnrollment] = await db.select().from(enrollments).where(eq(enrollments.id, result.insertId));
    return newEnrollment;
  }

  async updateEnrollment(id: number, enrollment: Partial<InsertEnrollment>): Promise<Enrollment> {
    await db
      .update(enrollments)
      .set(enrollment)
      .where(eq(enrollments.id, id));

    const [updated] = await db.select().from(enrollments).where(eq(enrollments.id, id));
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
    const [result] = await db.insert(accessLogs).values(log);
    const [newLog] = await db.select().from(accessLogs).where(eq(accessLogs.id, result.insertId));
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
        .set({
          ...membershipData,
          updatedAt: new Date(),
          issueDate: (membershipData.issueDate as any) instanceof Date ? membershipData.issueDate : new Date(membershipData.issueDate as any),
          expiryDate: (membershipData.expiryDate as any) instanceof Date ? membershipData.expiryDate : new Date(membershipData.expiryDate as any),
        } as any)
        .where(eq(memberships.id, existing.id));
    } else {
      // Create new membership
      await db.insert(memberships).values({
        ...membershipData,
        issueDate: (membershipData.issueDate as any) instanceof Date ? membershipData.issueDate : new Date(membershipData.issueDate as any),
        expiryDate: (membershipData.expiryDate as any) instanceof Date ? membershipData.expiryDate : new Date(membershipData.expiryDate as any),
      } as any);
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
        .set({
          ...certData,
          updatedAt: new Date(),
          issueDate: (certData.issueDate as any) instanceof Date ? certData.issueDate : new Date(certData.issueDate as any),
          expiryDate: (certData.expiryDate as any) instanceof Date ? certData.expiryDate : new Date(certData.expiryDate as any),
        } as any)
        .where(eq(medicalCertificates.id, existing.id));
    } else {
      // Create new certificate
      await db.insert(medicalCertificates).values({
        ...certData,
        issueDate: (certData.issueDate as any) instanceof Date ? certData.issueDate : new Date(certData.issueDate as any),
        expiryDate: (certData.expiryDate as any) instanceof Date ? certData.expiryDate : new Date(certData.expiryDate as any),
      } as any);
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
        seasonId: attendances.seasonId,
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
    const activeSeason = await this.getActiveSeason();
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

    const [result] = await db.insert(attendances).values({
      ...attendanceData,
      attendanceDate: attendanceData.attendanceDate instanceof Date ? attendanceData.attendanceDate : new Date(attendanceData.attendanceDate),
      seasonId: attendanceData.seasonId || activeSeason?.id || null
    } as any);
    const [attendance] = await db.select().from(attendances).where(eq(attendances.id, result.insertId));
    return attendance;
  }

  async deleteAttendance(id: number): Promise<void> {
    await db.delete(attendances).where(eq(attendances.id, id));
  }

  // ==== Workshop Enrollments ====
  async getWorkshopEnrollments(): Promise<(WorkshopEnrollment & { memberFirstName?: string | null; memberLastName?: string | null; memberEmail?: string | null; memberFiscalCode?: string | null; memberGender?: string | null })[]> {
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
        memberGender: members.gender,
        seasonId: workshopEnrollments.seasonId,
      })
      .from(workshopEnrollments)
      .leftJoin(members, eq(workshopEnrollments.memberId, members.id))
      .orderBy(desc(workshopEnrollments.enrollmentDate));
    return result;
  }

  async getWorkshopEnrollmentsByMember(memberId: number): Promise<(WorkshopEnrollment & { memberFirstName?: string | null; memberLastName?: string | null; memberEmail?: string | null; memberFiscalCode?: string | null; memberGender?: string | null })[]> {
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
        memberGender: members.gender,
        seasonId: workshopEnrollments.seasonId,
      })
      .from(workshopEnrollments)
      .leftJoin(members, eq(workshopEnrollments.memberId, members.id))
      .where(eq(workshopEnrollments.memberId, memberId))
      .orderBy(desc(workshopEnrollments.enrollmentDate));
    return result;
  }

  async getWorkshopEnrollmentsBySeason(seasonId: number): Promise<(WorkshopEnrollment & { memberFirstName?: string | null; memberLastName?: string | null; memberEmail?: string | null; memberFiscalCode?: string | null; memberGender?: string | null })[]> {
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
        memberGender: members.gender,
        seasonId: workshopEnrollments.seasonId,
      })
      .from(workshopEnrollments)
      .leftJoin(members, eq(workshopEnrollments.memberId, members.id))
      .where(eq(workshopEnrollments.seasonId, seasonId))
      .orderBy(desc(workshopEnrollments.enrollmentDate));
    return result;
  }

  async getWorkshopEnrollment(id: number): Promise<WorkshopEnrollment | undefined> {
    const [enrollment] = await db.select().from(workshopEnrollments).where(eq(workshopEnrollments.id, id));
    return enrollment;
  }

  async createWorkshopEnrollment(enrollment: InsertWorkshopEnrollment): Promise<WorkshopEnrollment> {
    const activeSeason = await this.getActiveSeason();
    const dataWithSeason = {
      ...enrollment,
      seasonId: enrollment.seasonId || activeSeason?.id || null
    };
    const [result] = await db.insert(workshopEnrollments).values(dataWithSeason as any);
    const [newEnrollment] = await db.select().from(workshopEnrollments).where(eq(workshopEnrollments.id, result.insertId));
    return newEnrollment;
  }

  async updateWorkshopEnrollment(id: number, enrollment: Partial<InsertWorkshopEnrollment>): Promise<WorkshopEnrollment> {
    await db
      .update(workshopEnrollments)
      .set(enrollment)
      .where(eq(workshopEnrollments.id, id));

    const [updated] = await db.select().from(workshopEnrollments).where(eq(workshopEnrollments.id, id));
    return updated;
  }

  async deleteWorkshopEnrollment(id: number): Promise<void> {
    await db.delete(workshopEnrollments).where(eq(workshopEnrollments.id, id));
  }


  // --- EXTRA ENROLLMENTS IMPLEMENTATION --- 

  async getSundayActivityEnrollments(): Promise<any[]> {
    return await db.select({
      id: sundayActivityEnrollments.id,
      memberId: sundayActivityEnrollments.memberId,
      status: sundayActivityEnrollments.status,
      enrollmentDate: sundayActivityEnrollments.enrollmentDate,
      notes: sundayActivityEnrollments.notes,
      memberFirstName: members.firstName,
      memberLastName: members.lastName,
      memberEmail: members.email,
      memberFiscalCode: members.fiscalCode
    })
      .from(sundayActivityEnrollments)
      .leftJoin(members, eq(sundayActivityEnrollments.memberId, members.id))
      .orderBy(desc(sundayActivityEnrollments.enrollmentDate));
  }

  async getSundayActivityEnrollmentsByMember(memberId: number): Promise<any[]> {
    return await db.select({
      id: sundayActivityEnrollments.id,
      memberId: sundayActivityEnrollments.memberId,
      status: sundayActivityEnrollments.status,
      enrollmentDate: sundayActivityEnrollments.enrollmentDate,
      notes: sundayActivityEnrollments.notes,
      memberFirstName: members.firstName,
      memberLastName: members.lastName,
      memberEmail: members.email,
      memberFiscalCode: members.fiscalCode
    })
      .from(sundayActivityEnrollments)
      .leftJoin(members, eq(sundayActivityEnrollments.memberId, members.id))
      .where(eq(sundayActivityEnrollments.memberId, memberId))
      .orderBy(desc(sundayActivityEnrollments.enrollmentDate));
  }

  async getSundayActivityEnrollment(id: number): Promise<SundayActivityEnrollment | undefined> {
    const [enrollment] = await db.select().from(sundayActivityEnrollments).where(eq(sundayActivityEnrollments.id, id));
    return enrollment;
  }

  async createSundayActivityEnrollment(enrollment: InsertSundayActivityEnrollment): Promise<SundayActivityEnrollment> {
    const activeSeason = await this.getActiveSeason();
    const dataWithSeason = {
      ...enrollment,
      seasonId: enrollment.seasonId || activeSeason?.id || null
    };
    const [result] = await db.insert(sundayActivityEnrollments).values(dataWithSeason as any);
    const [newEnrollment] = await db.select().from(sundayActivityEnrollments).where(eq(sundayActivityEnrollments.id, result.insertId));
    return newEnrollment;
  }

  async updateSundayActivityEnrollment(id: number, enrollment: Partial<InsertSundayActivityEnrollment>): Promise<SundayActivityEnrollment> {
    await db.update(sundayActivityEnrollments).set(enrollment as any).where(eq(sundayActivityEnrollments.id, id));
    const [updated] = await db.select().from(sundayActivityEnrollments).where(eq(sundayActivityEnrollments.id, id));
    return updated;
  }

  async deleteSundayActivityEnrollment(id: number): Promise<void> {
    await db.delete(sundayActivityEnrollments).where(eq(sundayActivityEnrollments.id, id));
  }

  async getTrainingEnrollments(): Promise<any[]> {
    return await db.select({
      id: trainingEnrollments.id,
      memberId: trainingEnrollments.memberId,
      status: trainingEnrollments.status,
      enrollmentDate: trainingEnrollments.enrollmentDate,
      notes: trainingEnrollments.notes,
      memberFirstName: members.firstName,
      memberLastName: members.lastName,
      memberEmail: members.email,
      memberFiscalCode: members.fiscalCode
    })
      .from(trainingEnrollments)
      .leftJoin(members, eq(trainingEnrollments.memberId, members.id))
      .orderBy(desc(trainingEnrollments.enrollmentDate));
  }

  async getTrainingEnrollmentsByMember(memberId: number): Promise<any[]> {
    return await db.select({
      id: trainingEnrollments.id,
      memberId: trainingEnrollments.memberId,
      status: trainingEnrollments.status,
      enrollmentDate: trainingEnrollments.enrollmentDate,
      notes: trainingEnrollments.notes,
      memberFirstName: members.firstName,
      memberLastName: members.lastName,
      memberEmail: members.email,
      memberFiscalCode: members.fiscalCode
    })
      .from(trainingEnrollments)
      .leftJoin(members, eq(trainingEnrollments.memberId, members.id))
      .where(eq(trainingEnrollments.memberId, memberId))
      .orderBy(desc(trainingEnrollments.enrollmentDate));
  }

  async getTrainingEnrollment(id: number): Promise<TrainingEnrollment | undefined> {
    const [enrollment] = await db.select().from(trainingEnrollments).where(eq(trainingEnrollments.id, id));
    return enrollment;
  }

  async createTrainingEnrollment(enrollment: InsertTrainingEnrollment): Promise<TrainingEnrollment> {
    const activeSeason = await this.getActiveSeason();
    const dataWithSeason = {
      ...enrollment,
      seasonId: enrollment.seasonId || activeSeason?.id || null
    };
    const [result] = await db.insert(trainingEnrollments).values(dataWithSeason as any);
    const [newEnrollment] = await db.select().from(trainingEnrollments).where(eq(trainingEnrollments.id, result.insertId));
    return newEnrollment;
  }

  async updateTrainingEnrollment(id: number, enrollment: Partial<InsertTrainingEnrollment>): Promise<TrainingEnrollment> {
    await db.update(trainingEnrollments).set(enrollment as any).where(eq(trainingEnrollments.id, id));
    const [updated] = await db.select().from(trainingEnrollments).where(eq(trainingEnrollments.id, id));
    return updated;
  }

  async deleteTrainingEnrollment(id: number): Promise<void> {
    await db.delete(trainingEnrollments).where(eq(trainingEnrollments.id, id));
  }

  async getIndividualLessonEnrollments(): Promise<any[]> {
    return await db.select({
      id: individualLessonEnrollments.id,
      memberId: individualLessonEnrollments.memberId,
      status: individualLessonEnrollments.status,
      enrollmentDate: individualLessonEnrollments.enrollmentDate,
      notes: individualLessonEnrollments.notes,
      memberFirstName: members.firstName,
      memberLastName: members.lastName,
      memberEmail: members.email,
      memberFiscalCode: members.fiscalCode
    })
      .from(individualLessonEnrollments)
      .leftJoin(members, eq(individualLessonEnrollments.memberId, members.id))
      .orderBy(desc(individualLessonEnrollments.enrollmentDate));
  }

  async getIndividualLessonEnrollmentsByMember(memberId: number): Promise<any[]> {
    return await db.select({
      id: individualLessonEnrollments.id,
      memberId: individualLessonEnrollments.memberId,
      status: individualLessonEnrollments.status,
      enrollmentDate: individualLessonEnrollments.enrollmentDate,
      notes: individualLessonEnrollments.notes,
      memberFirstName: members.firstName,
      memberLastName: members.lastName,
      memberEmail: members.email,
      memberFiscalCode: members.fiscalCode
    })
      .from(individualLessonEnrollments)
      .leftJoin(members, eq(individualLessonEnrollments.memberId, members.id))
      .where(eq(individualLessonEnrollments.memberId, memberId))
      .orderBy(desc(individualLessonEnrollments.enrollmentDate));
  }

  async getIndividualLessonEnrollment(id: number): Promise<IndividualLessonEnrollment | undefined> {
    const [enrollment] = await db.select().from(individualLessonEnrollments).where(eq(individualLessonEnrollments.id, id));
    return enrollment;
  }

  async createIndividualLessonEnrollment(enrollment: InsertIndividualLessonEnrollment): Promise<IndividualLessonEnrollment> {
    const activeSeason = await this.getActiveSeason();
    const dataWithSeason = {
      ...enrollment,
      seasonId: enrollment.seasonId || activeSeason?.id || null
    };
    const [result] = await db.insert(individualLessonEnrollments).values(dataWithSeason as any);
    const [newEnrollment] = await db.select().from(individualLessonEnrollments).where(eq(individualLessonEnrollments.id, result.insertId));
    return newEnrollment;
  }

  async updateIndividualLessonEnrollment(id: number, enrollment: Partial<InsertIndividualLessonEnrollment>): Promise<IndividualLessonEnrollment> {
    await db.update(individualLessonEnrollments).set(enrollment as any).where(eq(individualLessonEnrollments.id, id));
    const [updated] = await db.select().from(individualLessonEnrollments).where(eq(individualLessonEnrollments.id, id));
    return updated;
  }

  async deleteIndividualLessonEnrollment(id: number): Promise<void> {
    await db.delete(individualLessonEnrollments).where(eq(individualLessonEnrollments.id, id));
  }

  async getCampusEnrollments(): Promise<any[]> {
    return await db.select({
      id: campusEnrollments.id,
      memberId: campusEnrollments.memberId,
      status: campusEnrollments.status,
      enrollmentDate: campusEnrollments.enrollmentDate,
      notes: campusEnrollments.notes,
      memberFirstName: members.firstName,
      memberLastName: members.lastName,
      memberEmail: members.email,
      memberFiscalCode: members.fiscalCode
    })
      .from(campusEnrollments)
      .leftJoin(members, eq(campusEnrollments.memberId, members.id))
      .orderBy(desc(campusEnrollments.enrollmentDate));
  }

  async getCampusEnrollmentsByMember(memberId: number): Promise<any[]> {
    return await db.select({
      id: campusEnrollments.id,
      memberId: campusEnrollments.memberId,
      status: campusEnrollments.status,
      enrollmentDate: campusEnrollments.enrollmentDate,
      notes: campusEnrollments.notes,
      memberFirstName: members.firstName,
      memberLastName: members.lastName,
      memberEmail: members.email,
      memberFiscalCode: members.fiscalCode
    })
      .from(campusEnrollments)
      .leftJoin(members, eq(campusEnrollments.memberId, members.id))
      .where(eq(campusEnrollments.memberId, memberId))
      .orderBy(desc(campusEnrollments.enrollmentDate));
  }

  async getCampusEnrollment(id: number): Promise<CampusEnrollment | undefined> {
    const [enrollment] = await db.select().from(campusEnrollments).where(eq(campusEnrollments.id, id));
    return enrollment;
  }

  async createCampusEnrollment(enrollment: InsertCampusEnrollment): Promise<CampusEnrollment> {
    const activeSeason = await this.getActiveSeason();
    const dataWithSeason = {
      ...enrollment,
      seasonId: enrollment.seasonId || activeSeason?.id || null
    };
    const [result] = await db.insert(campusEnrollments).values(dataWithSeason as any);
    const [newEnrollment] = await db.select().from(campusEnrollments).where(eq(campusEnrollments.id, result.insertId));
    return newEnrollment;
  }

  async updateCampusEnrollment(id: number, enrollment: Partial<InsertCampusEnrollment>): Promise<CampusEnrollment> {
    await db.update(campusEnrollments).set(enrollment as any).where(eq(campusEnrollments.id, id));
    const [updated] = await db.select().from(campusEnrollments).where(eq(campusEnrollments.id, id));
    return updated;
  }

  async deleteCampusEnrollment(id: number): Promise<void> {
    await db.delete(campusEnrollments).where(eq(campusEnrollments.id, id));
  }

  async getRecitalEnrollments(): Promise<any[]> {
    return await db.select({
      id: recitalEnrollments.id,
      memberId: recitalEnrollments.memberId,
      status: recitalEnrollments.status,
      enrollmentDate: recitalEnrollments.enrollmentDate,
      notes: recitalEnrollments.notes,
      memberFirstName: members.firstName,
      memberLastName: members.lastName,
      memberEmail: members.email,
      memberFiscalCode: members.fiscalCode
    })
      .from(recitalEnrollments)
      .leftJoin(members, eq(recitalEnrollments.memberId, members.id))
      .orderBy(desc(recitalEnrollments.enrollmentDate));
  }

  async getRecitalEnrollmentsByMember(memberId: number): Promise<any[]> {
    return await db.select({
      id: recitalEnrollments.id,
      memberId: recitalEnrollments.memberId,
      status: recitalEnrollments.status,
      enrollmentDate: recitalEnrollments.enrollmentDate,
      notes: recitalEnrollments.notes,
      memberFirstName: members.firstName,
      memberLastName: members.lastName,
      memberEmail: members.email,
      memberFiscalCode: members.fiscalCode
    })
      .from(recitalEnrollments)
      .leftJoin(members, eq(recitalEnrollments.memberId, members.id))
      .where(eq(recitalEnrollments.memberId, memberId))
      .orderBy(desc(recitalEnrollments.enrollmentDate));
  }

  async getRecitalEnrollment(id: number): Promise<RecitalEnrollment | undefined> {
    const [enrollment] = await db.select().from(recitalEnrollments).where(eq(recitalEnrollments.id, id));
    return enrollment;
  }

  async createRecitalEnrollment(enrollment: InsertRecitalEnrollment): Promise<RecitalEnrollment> {
    const activeSeason = await this.getActiveSeason();
    const dataWithSeason = {
      ...enrollment,
      seasonId: enrollment.seasonId || activeSeason?.id || null
    };
    const [result] = await db.insert(recitalEnrollments).values(dataWithSeason as any);
    const [newEnrollment] = await db.select().from(recitalEnrollments).where(eq(recitalEnrollments.id, result.insertId));
    return newEnrollment;
  }

  async updateRecitalEnrollment(id: number, enrollment: Partial<InsertRecitalEnrollment>): Promise<RecitalEnrollment> {
    await db.update(recitalEnrollments).set(enrollment as any).where(eq(recitalEnrollments.id, id));
    const [updated] = await db.select().from(recitalEnrollments).where(eq(recitalEnrollments.id, id));
    return updated;
  }

  async deleteRecitalEnrollment(id: number): Promise<void> {
    await db.delete(recitalEnrollments).where(eq(recitalEnrollments.id, id));
  }

  async getVacationStudyEnrollments(): Promise<any[]> {
    return await db.select({
      id: vacationStudyEnrollments.id,
      memberId: vacationStudyEnrollments.memberId,
      status: vacationStudyEnrollments.status,
      enrollmentDate: vacationStudyEnrollments.enrollmentDate,
      notes: vacationStudyEnrollments.notes,
      memberFirstName: members.firstName,
      memberLastName: members.lastName,
      memberEmail: members.email,
      memberFiscalCode: members.fiscalCode
    })
      .from(vacationStudyEnrollments)
      .leftJoin(members, eq(vacationStudyEnrollments.memberId, members.id))
      .orderBy(desc(vacationStudyEnrollments.enrollmentDate));
  }

  async getVacationStudyEnrollmentsByMember(memberId: number): Promise<any[]> {
    return await db.select({
      id: vacationStudyEnrollments.id,
      memberId: vacationStudyEnrollments.memberId,
      status: vacationStudyEnrollments.status,
      enrollmentDate: vacationStudyEnrollments.enrollmentDate,
      notes: vacationStudyEnrollments.notes,
      memberFirstName: members.firstName,
      memberLastName: members.lastName,
      memberEmail: members.email,
      memberFiscalCode: members.fiscalCode
    })
      .from(vacationStudyEnrollments)
      .leftJoin(members, eq(vacationStudyEnrollments.memberId, members.id))
      .where(eq(vacationStudyEnrollments.memberId, memberId))
      .orderBy(desc(vacationStudyEnrollments.enrollmentDate));
  }

  async getVacationStudyEnrollment(id: number): Promise<VacationStudyEnrollment | undefined> {
    const [enrollment] = await db.select().from(vacationStudyEnrollments).where(eq(vacationStudyEnrollments.id, id));
    return enrollment;
  }

  async createVacationStudyEnrollment(enrollment: InsertVacationStudyEnrollment): Promise<VacationStudyEnrollment> {
    const activeSeason = await this.getActiveSeason();
    const dataWithSeason = {
      ...enrollment,
      seasonId: enrollment.seasonId || activeSeason?.id || null
    };
    const [result] = await db.insert(vacationStudyEnrollments).values(dataWithSeason as any);
    const [newEnrollment] = await db.select().from(vacationStudyEnrollments).where(eq(vacationStudyEnrollments.id, result.insertId));
    return newEnrollment;
  }

  async updateVacationStudyEnrollment(id: number, enrollment: Partial<InsertVacationStudyEnrollment>): Promise<VacationStudyEnrollment> {
    await db.update(vacationStudyEnrollments).set(enrollment as any).where(eq(vacationStudyEnrollments.id, id));
    const [updated] = await db.select().from(vacationStudyEnrollments).where(eq(vacationStudyEnrollments.id, id));
    return updated;
  }

  async deleteVacationStudyEnrollment(id: number): Promise<void> {
    await db.delete(vacationStudyEnrollments).where(eq(vacationStudyEnrollments.id, id));
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
    const activeSeason = await this.getActiveSeason();
    const [result] = await db.insert(workshopAttendances).values({
      ...attendance,
      attendanceDate: attendance.attendanceDate instanceof Date ? attendance.attendanceDate : new Date(attendance.attendanceDate),
      seasonId: attendance.seasonId || activeSeason?.id || null
    } as any);
    const [newAttendance] = await db.select().from(workshopAttendances).where(eq(workshopAttendances.id, result.insertId));
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
    const [result] = await db.insert(memberRelationships).values(relationship);
    const [newRelationship] = await db.select().from(memberRelationships).where(eq(memberRelationships.id, result.insertId));
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
    const [result] = await db.insert(countries).values(country);
    const [newCountry] = await db.select().from(countries).where(eq(countries.id, result.insertId));
    return newCountry;
  }

  async getProvinces(countryId?: number): Promise<Province[]> {
    if (countryId) {
      return await db.select().from(provinces).where(eq(provinces.countryId, countryId)).orderBy(provinces.name);
    }
    return await db.select().from(provinces).orderBy(provinces.name);
  }

  async createProvince(province: InsertProvince): Promise<Province> {
    const [result] = await db.insert(provinces).values(province);
    const [newProvince] = await db.select().from(provinces).where(eq(provinces.id, result.insertId));
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
      .where(ilike(cities.name, `% ${search}% `))
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

  async getCityByIstatCode(code: string): Promise<(City & { province?: Province }) | undefined> {
    const [result] = await db
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
      .where(eq(cities.istatCode, code.toUpperCase()))
      .limit(1);

    if (!result) return undefined;

    return {
      id: result.id,
      name: result.name,
      provinceId: result.provinceId,
      postalCode: result.postalCode,
      istatCode: result.istatCode,
      province: result.provinceId ? {
        id: result.provinceId,
        code: result.provinceCode || "",
        name: result.provinceName || "",
        region: result.region,
        countryId: null,
      } : undefined,
    };
  }

  async createCity(city: InsertCity): Promise<City> {
    const [result] = await db.insert(cities).values(city);
    const [newCity] = await db.select().from(cities).where(eq(cities.id, result.insertId));
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
    const [result] = await db.insert(customReports).values(report as any);
    const [newReport] = await db.select().from(customReports).where(eq(customReports.id, result.insertId));
    return newReport;
  }

  async updateCustomReport(id: number, report: Partial<InsertCustomReport>): Promise<CustomReport> {
    await db
      .update(customReports)
      .set({ ...report, updatedAt: new Date() } as any)
      .where(eq(customReports.id, id));

    const [updated] = await db.select().from(customReports).where(eq(customReports.id, id));
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
    const [result] = await db.insert(importConfigs).values(config as any);
    const [newConfig] = await db.select().from(importConfigs).where(eq(importConfigs.id, result.insertId));
    return newConfig;
  }
  async deleteImportConfig(id: number): Promise<void> {
    await db.delete(importConfigs).where(eq(importConfigs.id, id));
  }

  // Price Lists
  async getPriceLists(): Promise<PriceList[]> {
    return await db.select().from(priceLists).orderBy(desc(priceLists.validFrom));
  }

  async getPriceList(id: number): Promise<PriceList | undefined> {
    const [result] = await db.select().from(priceLists).where(eq(priceLists.id, id));
    return result;
  }

  async getPriceListItems(priceListId: number): Promise<PriceListItem[]> {
    return await db.select().from(priceListItems).where(eq(priceListItems.priceListId, priceListId));
  }

  async createPriceList(priceList: InsertPriceList): Promise<PriceList> {
    console.log("DB: Inserting price list:", JSON.stringify(priceList, null, 2));
    const [result] = await db.insert(priceLists).values(priceList);
    console.log("DB: Insert result:", JSON.stringify(result, null, 2));

    const insertId = result.insertId;
    if (!insertId) {
      console.warn("DB: Warning - insertId is missing from result. Attempting detailed fetch.");
    }

    const [inserted] = await db.select().from(priceLists).where(eq(priceLists.id, insertId));

    if (!inserted) {
      console.error("DB: CRITICAL - Could not find inserted price list with ID:", insertId);
      // Fallback: try to find by name and recent creation if ID lookup fails
      const [fallback] = await db.select().from(priceLists)
        .where(eq(priceLists.name, priceList.name))
        .orderBy(desc(priceLists.createdAt)) // assuming you have createdAt or id
        .limit(1);

      if (fallback) {
        console.log("DB: Recovered price list via fallback search:", fallback);
        return fallback;
      }
      throw new Error(`Failed to retrieve created price list with ID ${insertId}`);
    }

    return inserted;
  }

  async updatePriceList(id: number, priceList: Partial<InsertPriceList>): Promise<PriceList> {
    await db.update(priceLists).set(priceList).where(eq(priceLists.id, id));
    const [updated] = await db.select().from(priceLists).where(eq(priceLists.id, id));
    if (!updated) throw new Error("Price list not found after update");
    return updated;
  }

  async deletePriceList(id: number): Promise<void> {
    await db.delete(priceLists).where(eq(priceLists.id, id));
  }

  async upsertPriceListItem(item: InsertPriceListItem): Promise<PriceListItem> {
    // Check if item exists
    const [existing] = await db
      .select()
      .from(priceListItems)
      .where(
        and(
          eq(priceListItems.priceListId, item.priceListId),
          eq(priceListItems.entityType, item.entityType),
          eq(priceListItems.entityId, item.entityId)
        )
      );

    if (existing) {
      await db.update(priceListItems).set(item).where(eq(priceListItems.id, existing.id));
      const [updated] = await db.select().from(priceListItems).where(eq(priceListItems.id, existing.id));
      return updated!;
    } else {
      const [result] = await db.insert(priceListItems).values(item);
      const [inserted] = await db.select().from(priceListItems).where(eq(priceListItems.id, result.insertId));
      return inserted;
    }
  }

  async getQuotes(): Promise<Quote[]> {
    return await db.select().from(quotes).orderBy(desc(quotes.createdAt));
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const [result] = await db.insert(quotes).values(quote);
    const [inserted] = await db.select().from(quotes).where(eq(quotes.id, result.insertId));
    return inserted;
  }

  async updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote> {
    await db.update(quotes).set(quote).where(eq(quotes.id, id));

    // Propagate price update to linked items
    if (quote.amount) {
      await db.update(priceListItems)
        .set({ price: quote.amount.toString() })
        .where(eq(priceListItems.quoteId, id));

      await db.update(courses)
        .set({ price: quote.amount.toString() })
        .where(eq(courses.quoteId, id));
    }

    const [updated] = await db.select().from(quotes).where(eq(quotes.id, id));
    if (!updated) throw new Error("Quote not found");
    return updated;
  }

  async deleteQuote(id: number): Promise<void> {
    await db.delete(quotes).where(eq(quotes.id, id));
  }

  // --- CUSTOM LISTS IMPLEMENTATION ---

  async getCustomLists(): Promise<(CustomList & { items: CustomListItem[] })[]> {
    const lists = await db.select().from(customLists).orderBy(customLists.name);
    const items = await db.select().from(customListItems).orderBy(customListItems.value);

    return lists.map(list => ({
      ...list,
      items: items.filter(item => item.listId === list.id)
    }));
  }

  async getCustomListBySystemName(systemName: string): Promise<(CustomList & { items: CustomListItem[] }) | undefined> {
    const [list] = await db.select().from(customLists).where(eq(customLists.systemName, systemName));
    if (!list) return undefined;

    const items = await db
      .select()
      .from(customListItems)
      .where(eq(customListItems.listId, list.id))
      .orderBy(customListItems.value);

    return { ...list, items };
  }

  async createCustomList(list: InsertCustomList): Promise<CustomList> {
    const [result] = await db.insert(customLists).values(list);
    const [inserted] = await db.select().from(customLists).where(eq(customLists.id, result.insertId));
    return inserted;
  }

  async updateCustomList(id: number, list: Partial<InsertCustomList>): Promise<CustomList> {
    await db.update(customLists).set(list).where(eq(customLists.id, id));
    const [updated] = await db.select().from(customLists).where(eq(customLists.id, id));
    return updated;
  }

  async deleteCustomList(id: number): Promise<void> {
    await db.delete(customLists).where(eq(customLists.id, id));
  }

  async createCustomListItem(item: InsertCustomListItem): Promise<CustomListItem> {
    const [result] = await db.insert(customListItems).values(item);
    const [inserted] = await db.select().from(customListItems).where(eq(customListItems.id, result.insertId));
    return inserted;
  }

  async createCustomListItems(listId: number, values: string[]): Promise<void> {
    if (values.length === 0) return;
    const items = await db.select().from(customListItems).where(eq(customListItems.listId, listId));
    let maxOrder = items.reduce((max, i) => Math.max(max, i.sortOrder || 0), 0);

    // Filtra duplicati sia esistenti che nei nuovi valori via Set
    const existingValues = new Set(items.map(i => i.value.toLowerCase()));
    const toInsert = [];
    for (const val of values) {
      const trimmed = val.trim();
      if (trimmed && !existingValues.has(trimmed.toLowerCase())) {
        existingValues.add(trimmed.toLowerCase());
        maxOrder++;
        toInsert.push({
          listId,
          value: trimmed,
          sortOrder: maxOrder,
          active: true
        });
      }
    }

    if (toInsert.length > 0) {
      await db.insert(customListItems).values(toInsert);
    }
  }

  async updateCustomListItem(id: number, item: Partial<InsertCustomListItem>): Promise<CustomListItem> {
    await db.update(customListItems).set(item).where(eq(customListItems.id, id));
    const [updated] = await db.select().from(customListItems).where(eq(customListItems.id, id));
    if (!updated) throw new Error("Custom list item not found");
    return updated;
  }

  async deleteCustomListItem(id: number): Promise<void> {
    await db.delete(customListItems).where(eq(customListItems.id, id));
  }

  async deletePriceListItem(id: number): Promise<void> {
    await db.delete(priceListItems).where(eq(priceListItems.id, id));
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [result] = await db.insert(notifications).values(notification);
    const [inserted] = await db.select().from(notifications).where(eq(notifications.id, result.insertId));
    return inserted;
  }

  async markNotificationRead(id: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  async checkStudioConflict(
    studioId: number,
    bookingDateValue: Date | string,
    startTime: string,
    endTime: string,
    currentBookingId?: number,
    currentCourseId?: number,
    targetSeasonId?: number
  ): Promise<{ type: 'booking' | 'course' | 'workshop' | 'operating_hours', name: string } | null> {
    const bookingDate = bookingDateValue instanceof Date ? bookingDateValue : new Date(bookingDateValue);
    if (isNaN(bookingDate.getTime())) {
      console.error("Invalid date passed to checkStudioConflict:", bookingDateValue);
      return null;
    }
    const dateStr = bookingDate.toISOString().split('T')[0];

    // Helper: Convert "HH:MM" to minutes
    const toMinutes = (time: string) => {
      if (!time) return 0;
      const [h, m] = time.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const startMin = toMinutes(startTime);
    const endMin = toMinutes(endTime);

    // 0. Check Operating Hours/Days and Studio Availability
    const configRow = await this.getSystemConfig("center_operating_hours");
    let globalHours = { start: "07:30", end: "23:00", days: ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'] };
    if (configRow && configRow.value) {
      try { globalHours = JSON.parse(configRow.value); } catch { }
    }

    const studio = await this.getStudio(studioId);
    if (studio && !studio.active) {
      return { type: 'operating_hours', name: "Studio non disponibile (disattivato)" };
    }

    const daysAbbr = ['DOM', 'LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB'];
    const dayOfWeekStr = daysAbbr[bookingDate.getDay()];

    if (globalHours.days && globalHours.days.length > 0 && !globalHours.days.includes(dayOfWeekStr)) {
      return { type: 'operating_hours', name: `Centro chiuso il ${dayOfWeekStr}` };
    }

    if (globalHours.start && globalHours.end) {
      const opStart = toMinutes(globalHours.start);
      const opEnd = toMinutes(globalHours.end);

      if (startMin < opStart || endMin > opEnd) {
        return { type: 'operating_hours', name: `Fuori orario centro (${globalHours.start} - ${globalHours.end})` };
      }
    }

    const isOverlapping = (itemStart: string, itemEnd: string) => {
      const s = toMinutes(itemStart);
      const e = toMinutes(itemEnd);
      return s < endMin && e > startMin;
    };

    // Get day of week shorthand (LUN, MAR, etc.)
    const days = ['DOM', 'LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB'];
    const dayOfWeek = days[bookingDate.getDay()];

    // 1. Check Studio Bookings (Specific Date)
    const bookingConditions = [
      eq(studioBookings.studioId, studioId),
      sql`DATE(${studioBookings.bookingDate}) = ${dateStr} `
    ];
    if (currentBookingId) {
      bookingConditions.push(sql`${studioBookings.id} != ${currentBookingId} `);
    }

    const dayBookings = await db
      .select({
        id: studioBookings.id,
        title: studioBookings.title,
        serviceName: bookingServices.name,
        startTime: studioBookings.startTime,
        endTime: studioBookings.endTime,
        status: studioBookings.status
      })
      .from(studioBookings)
      .leftJoin(bookingServices, eq(studioBookings.serviceId, bookingServices.id))
      .where(and(...bookingConditions));

    for (const b of dayBookings) {
      if (b.status !== 'cancelled' && isOverlapping(b.startTime, b.endTime)) {
        return { type: 'booking', name: b.serviceName || b.title || 'Altra prenotazione' };
      }
    }

    // 2. Check Courses (Recurring)
    // IMPORTANT: Filter by Active Season to avoid conflicts with old courses
    const activeSeason = await this.getActiveSeason();
    const effectiveSeasonId = targetSeasonId || activeSeason?.id;
    const courseConditions = [
      eq(courses.studioId, studioId),
      eq(courses.active, true),
      sql`UPPER(${courses.dayOfWeek}) LIKE ${dayOfWeek + '%'} `
    ];

    if (effectiveSeasonId) {
      courseConditions.push(eq(courses.seasonId, effectiveSeasonId));
    }
    if (currentCourseId) {
      courseConditions.push(sql`${courses.id} != ${currentCourseId}`);
    }

    const potentialCourses = await db
      .select({
        name: courses.name,
        startTime: courses.startTime,
        endTime: courses.endTime,
        startDate: courses.startDate,
        endDate: courses.endDate
      })
      .from(courses)
      .where(and(...courseConditions));

    for (const c of potentialCourses) {
      // Check specific date range if set
      if (c.startDate) {
        const cStart = new Date(c.startDate).toISOString().split('T')[0];
        if (cStart > dateStr) continue;
      }
      if (c.endDate) {
        const cEnd = new Date(c.endDate).toISOString().split('T')[0];
        if (cEnd < dateStr) continue;
      }

      if (c.startTime && c.endTime && isOverlapping(c.startTime, c.endTime)) {
        return { type: 'course', name: c.name };
      }
    }

    // 3. Check Workshops (Specific Dates)
    const workshopConditions = [
      eq(workshops.studioId, studioId),
      eq(workshops.active, true),
      // Basic overlap check in SQL to reduce result set, refined in JS
      sql`DATE(${workshops.startDate}) <= ${dateStr}`,
      sql`DATE(${workshops.endDate}) >= ${dateStr}`
    ];

    const potentialWorkshops = await db
      .select({
        name: workshops.name,
        startTime: workshops.startTime,
        endTime: workshops.endTime,
        dayOfWeek: workshops.dayOfWeek
      })
      .from(workshops)
      .where(and(...workshopConditions));

    for (const w of potentialWorkshops) {
      // Verify Day of Week matches
      if (w.dayOfWeek && !w.dayOfWeek.toUpperCase().startsWith(dayOfWeek)) continue;

      if (w.startTime && w.endTime && isOverlapping(w.startTime, w.endTime)) {
        return { type: 'workshop', name: w.name };
      }
    }

    return null;
  }

  // System Config operations
  async getSystemConfig(keyName: string): Promise<SystemConfig | undefined> {
    const [config] = await db.select().from(systemConfigs).where(eq(systemConfigs.keyName, keyName));
    return config;
  }

  async updateSystemConfig(keyName: string, value: string): Promise<SystemConfig> {
    const existing = await this.getSystemConfig(keyName);
    if (existing) {
      await db
        .update(systemConfigs)
        .set({ value, updatedAt: new Date() })
        .where(eq(systemConfigs.keyName, keyName));
    } else {
      await db
        .insert(systemConfigs)
        .values({ keyName, value });
    }
    const refreshed = await this.getSystemConfig(keyName);
    return refreshed!;
  }

  // ==== Season operations ====
  async getSeasons(): Promise<Season[]> {
    return await db.select().from(seasons).orderBy(desc(seasons.startDate));
  }

  async getSeason(id: number): Promise<Season | undefined> {
    const [season] = await db.select().from(seasons).where(eq(seasons.id, id));
    return season;
  }

  async getActiveSeason(): Promise<Season | undefined> {
    const [season] = await db.select().from(seasons).where(eq(seasons.active, true)).limit(1);
    return season;
  }
  async getStudioBookingsBySeason(seasonId: number): Promise<(StudioBooking & { memberFirstName?: string | null; memberLastName?: string | null; studioName?: string | null; serviceName?: string | null; serviceColor?: string | null })[]> {
    return await this.getStudioBookings(undefined, undefined, seasonId);
  }

  async getPaymentsBySeason(seasonId: number): Promise<(Payment & { memberFirstName?: string; memberLastName?: string })[]> {
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
        paymentMethodId: payments.paymentMethodId,
        notes: payments.notes,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        seasonId: payments.seasonId,
        workshopEnrollmentId: payments.workshopEnrollmentId,
        bookingId: payments.bookingId,
        membershipId: payments.membershipId,
      })
      .from(payments)
      .leftJoin(members, eq(payments.memberId, members.id))
      .where(eq(payments.seasonId, seasonId))
      .orderBy(desc(payments.paidDate));
    return result as any;
  }

  async getAttendancesBySeason(seasonId: number): Promise<Attendance[]> {
    return await db.select().from(attendances).where(eq(attendances.seasonId, seasonId)).orderBy(desc(attendances.attendanceDate));
  }

  async createSeason(seasonData: InsertSeason): Promise<Season> {
    const [newSeason] = await db.insert(seasons).values(seasonData);
    const id = (newSeason as any).insertId || (newSeason as any).id;
    const fetched = await this.getSeason(id);
    return fetched!;
  }

  async updateSeason(id: number, seasonData: Partial<Season>): Promise<Season> {
    await db.update(seasons).set({ ...seasonData, updatedAt: new Date() }).where(eq(seasons.id, id));
    const fetched = await this.getSeason(id);
    return fetched!;
  }

  async setActiveSeason(id: number): Promise<void> {
    // Deactivate all others first
    await db.update(seasons).set({ active: false, updatedAt: new Date() });
    // Activate the requested one
    await db.update(seasons).set({ active: true, updatedAt: new Date() }).where(eq(seasons.id, id));
  }

  // ==== WorkshopCategories ====
  async getWorkshopCategories(): Promise<WorkshopCategory[]> {
    return await db.select().from(workshopCategories).orderBy(workshopCategories.name);
  }
  async getWorkshopCategory(id: number): Promise<WorkshopCategory | undefined> {
    const [item] = await db.select().from(workshopCategories).where(eq(workshopCategories.id, id));
    return item;
  }
  async createWorkshopCategory(data: InsertWorkshopCategory): Promise<WorkshopCategory> {
    const [result] = await db.insert(workshopCategories).values(data as any);
    const [newItem] = await db.select().from(workshopCategories).where(eq(workshopCategories.id, result.insertId));
    return newItem;
  }
  async updateWorkshopCategory(id: number, data: Partial<InsertWorkshopCategory>): Promise<WorkshopCategory> {
    await db.update(workshopCategories).set({ ...data, updatedAt: new Date() } as any).where(eq(workshopCategories.id, id));
    const [item] = await db.select().from(workshopCategories).where(eq(workshopCategories.id, id));
    if (!item) throw new Error("WorkshopCategory not found");
    return item;
  }
  async deleteWorkshopCategory(id: number): Promise<void> {
    await db.delete(workshopCategories).where(eq(workshopCategories.id, id));
  }

  // ==== SundayCategories ====
  async getSundayCategories(): Promise<SundayCategory[]> {
    return await db.select().from(sundayCategories).orderBy(sundayCategories.name);
  }
  async getSundayCategory(id: number): Promise<SundayCategory | undefined> {
    const [item] = await db.select().from(sundayCategories).where(eq(sundayCategories.id, id));
    return item;
  }
  async createSundayCategory(data: InsertSundayCategory): Promise<SundayCategory> {
    const [result] = await db.insert(sundayCategories).values(data as any);
    const [newItem] = await db.select().from(sundayCategories).where(eq(sundayCategories.id, result.insertId));
    return newItem;
  }
  async updateSundayCategory(id: number, data: Partial<InsertSundayCategory>): Promise<SundayCategory> {
    await db.update(sundayCategories).set({ ...data, updatedAt: new Date() } as any).where(eq(sundayCategories.id, id));
    const [item] = await db.select().from(sundayCategories).where(eq(sundayCategories.id, id));
    if (!item) throw new Error("SundayCategory not found");
    return item;
  }
  async deleteSundayCategory(id: number): Promise<void> {
    await db.delete(sundayCategories).where(eq(sundayCategories.id, id));
  }

  // ==== TrainingCategories ====
  async getTrainingCategories(): Promise<TrainingCategory[]> {
    return await db.select().from(trainingCategories).orderBy(trainingCategories.name);
  }
  async getTrainingCategory(id: number): Promise<TrainingCategory | undefined> {
    const [item] = await db.select().from(trainingCategories).where(eq(trainingCategories.id, id));
    return item;
  }
  async createTrainingCategory(data: InsertTrainingCategory): Promise<TrainingCategory> {
    const [result] = await db.insert(trainingCategories).values(data as any);
    const [newItem] = await db.select().from(trainingCategories).where(eq(trainingCategories.id, result.insertId));
    return newItem;
  }
  async updateTrainingCategory(id: number, data: Partial<InsertTrainingCategory>): Promise<TrainingCategory> {
    await db.update(trainingCategories).set({ ...data, updatedAt: new Date() } as any).where(eq(trainingCategories.id, id));
    const [item] = await db.select().from(trainingCategories).where(eq(trainingCategories.id, id));
    if (!item) throw new Error("TrainingCategory not found");
    return item;
  }
  async deleteTrainingCategory(id: number): Promise<void> {
    await db.delete(trainingCategories).where(eq(trainingCategories.id, id));
  }

  // ==== IndividualLessonCategories ====
  async getIndividualLessonCategories(): Promise<IndividualLessonCategory[]> {
    return await db.select().from(individualLessonCategories).orderBy(individualLessonCategories.name);
  }
  async getIndividualLessonCategory(id: number): Promise<IndividualLessonCategory | undefined> {
    const [item] = await db.select().from(individualLessonCategories).where(eq(individualLessonCategories.id, id));
    return item;
  }
  async createIndividualLessonCategory(data: InsertIndividualLessonCategory): Promise<IndividualLessonCategory> {
    const [result] = await db.insert(individualLessonCategories).values(data as any);
    const [newItem] = await db.select().from(individualLessonCategories).where(eq(individualLessonCategories.id, result.insertId));
    return newItem;
  }
  async updateIndividualLessonCategory(id: number, data: Partial<InsertIndividualLessonCategory>): Promise<IndividualLessonCategory> {
    await db.update(individualLessonCategories).set({ ...data, updatedAt: new Date() } as any).where(eq(individualLessonCategories.id, id));
    const [item] = await db.select().from(individualLessonCategories).where(eq(individualLessonCategories.id, id));
    if (!item) throw new Error("IndividualLessonCategory not found");
    return item;
  }
  async deleteIndividualLessonCategory(id: number): Promise<void> {
    await db.delete(individualLessonCategories).where(eq(individualLessonCategories.id, id));
  }

  // ==== CampusCategories ====
  async getCampusCategories(): Promise<CampusCategory[]> {
    return await db.select().from(campusCategories).orderBy(campusCategories.name);
  }
  async getCampusCategory(id: number): Promise<CampusCategory | undefined> {
    const [item] = await db.select().from(campusCategories).where(eq(campusCategories.id, id));
    return item;
  }
  async createCampusCategory(data: InsertCampusCategory): Promise<CampusCategory> {
    const [result] = await db.insert(campusCategories).values(data as any);
    const [newItem] = await db.select().from(campusCategories).where(eq(campusCategories.id, result.insertId));
    return newItem;
  }
  async updateCampusCategory(id: number, data: Partial<InsertCampusCategory>): Promise<CampusCategory> {
    await db.update(campusCategories).set({ ...data, updatedAt: new Date() } as any).where(eq(campusCategories.id, id));
    const [item] = await db.select().from(campusCategories).where(eq(campusCategories.id, id));
    if (!item) throw new Error("CampusCategory not found");
    return item;
  }
  async deleteCampusCategory(id: number): Promise<void> {
    await db.delete(campusCategories).where(eq(campusCategories.id, id));
  }

  // ==== RecitalCategories ====
  async getRecitalCategories(): Promise<RecitalCategory[]> {
    return await db.select().from(recitalCategories).orderBy(recitalCategories.name);
  }
  async getRecitalCategory(id: number): Promise<RecitalCategory | undefined> {
    const [item] = await db.select().from(recitalCategories).where(eq(recitalCategories.id, id));
    return item;
  }
  async createRecitalCategory(data: InsertRecitalCategory): Promise<RecitalCategory> {
    const [result] = await db.insert(recitalCategories).values(data as any);
    const [newItem] = await db.select().from(recitalCategories).where(eq(recitalCategories.id, result.insertId));
    return newItem;
  }
  async updateRecitalCategory(id: number, data: Partial<InsertRecitalCategory>): Promise<RecitalCategory> {
    await db.update(recitalCategories).set({ ...data, updatedAt: new Date() } as any).where(eq(recitalCategories.id, id));
    const [item] = await db.select().from(recitalCategories).where(eq(recitalCategories.id, id));
    if (!item) throw new Error("RecitalCategory not found");
    return item;
  }
  async deleteRecitalCategory(id: number): Promise<void> {
    await db.delete(recitalCategories).where(eq(recitalCategories.id, id));
  }

  // ==== VacationCategories ====
  async getVacationCategories(): Promise<VacationCategory[]> {
    return await db.select().from(vacationCategories).orderBy(vacationCategories.name);
  }
  async getVacationCategory(id: number): Promise<VacationCategory | undefined> {
    const [item] = await db.select().from(vacationCategories).where(eq(vacationCategories.id, id));
    return item;
  }
  async createVacationCategory(data: InsertVacationCategory): Promise<VacationCategory> {
    const [result] = await db.insert(vacationCategories).values(data as any);
    const [newItem] = await db.select().from(vacationCategories).where(eq(vacationCategories.id, result.insertId));
    return newItem;
  }
  async updateVacationCategory(id: number, data: Partial<InsertVacationCategory>): Promise<VacationCategory> {
    await db.update(vacationCategories).set({ ...data, updatedAt: new Date() } as any).where(eq(vacationCategories.id, id));
    const [item] = await db.select().from(vacationCategories).where(eq(vacationCategories.id, id));
    if (!item) throw new Error("VacationCategory not found");
    return item;
  }
  async deleteVacationCategory(id: number): Promise<void> {
    await db.delete(vacationCategories).where(eq(vacationCategories.id, id));
  }

  // ==== FreeTrials ====



  // ==== SingleLessons ====



  // ==== SundayActivities ====
  async getSundayActivities(): Promise<SundayActivity[]> {
    return await db.select().from(sundayActivities).orderBy(sundayActivities.name);
  }
  async getSundayActivity(id: number): Promise<SundayActivity | undefined> {
    const [item] = await db.select().from(sundayActivities).where(eq(sundayActivities.id, id));
    return item;
  }
  async createSundayActivity(data: InsertSundayActivity): Promise<SundayActivity> {
    const [result] = await db.insert(sundayActivities).values(data as any);
    const [newItem] = await db.select().from(sundayActivities).where(eq(sundayActivities.id, result.insertId));
    return newItem;
  }
  async updateSundayActivity(id: number, data: Partial<InsertSundayActivity>): Promise<SundayActivity> {
    await db.update(sundayActivities).set({ ...data, updatedAt: new Date() } as any).where(eq(sundayActivities.id, id));
    const [item] = await db.select().from(sundayActivities).where(eq(sundayActivities.id, id));
    if (!item) throw new Error("SundayActivity not found");
    return item;
  }
  async deleteSundayActivity(id: number): Promise<void> {
    await db.delete(sundayActivities).where(eq(sundayActivities.id, id));
  }

  // ==== Trainings ====
  async getTrainings(): Promise<Training[]> {
    return await db.select().from(trainings).orderBy(trainings.name);
  }
  async getTraining(id: number): Promise<Training | undefined> {
    const [item] = await db.select().from(trainings).where(eq(trainings.id, id));
    return item;
  }
  async createTraining(data: InsertTraining): Promise<Training> {
    const [result] = await db.insert(trainings).values(data as any);
    const [newItem] = await db.select().from(trainings).where(eq(trainings.id, result.insertId));
    return newItem;
  }
  async updateTraining(id: number, data: Partial<InsertTraining>): Promise<Training> {
    await db.update(trainings).set({ ...data, updatedAt: new Date() } as any).where(eq(trainings.id, id));
    const [item] = await db.select().from(trainings).where(eq(trainings.id, id));
    if (!item) throw new Error("Training not found");
    return item;
  }
  async deleteTraining(id: number): Promise<void> {
    await db.delete(trainings).where(eq(trainings.id, id));
  }

  // ==== IndividualLessons ====
  async getIndividualLessons(): Promise<IndividualLesson[]> {
    return await db.select().from(individualLessons).orderBy(individualLessons.name);
  }
  async getIndividualLesson(id: number): Promise<IndividualLesson | undefined> {
    const [item] = await db.select().from(individualLessons).where(eq(individualLessons.id, id));
    return item;
  }
  async createIndividualLesson(data: InsertIndividualLesson): Promise<IndividualLesson> {
    const [result] = await db.insert(individualLessons).values(data as any);
    const [newItem] = await db.select().from(individualLessons).where(eq(individualLessons.id, result.insertId));
    return newItem;
  }
  async updateIndividualLesson(id: number, data: Partial<InsertIndividualLesson>): Promise<IndividualLesson> {
    await db.update(individualLessons).set({ ...data, updatedAt: new Date() } as any).where(eq(individualLessons.id, id));
    const [item] = await db.select().from(individualLessons).where(eq(individualLessons.id, id));
    if (!item) throw new Error("IndividualLesson not found");
    return item;
  }
  async deleteIndividualLesson(id: number): Promise<void> {
    await db.delete(individualLessons).where(eq(individualLessons.id, id));
  }

  // ==== CampusActivities ====
  async getCampusActivities(): Promise<CampusActivity[]> {
    return await db.select().from(campusActivities).orderBy(campusActivities.name);
  }
  async getCampusActivity(id: number): Promise<CampusActivity | undefined> {
    const [item] = await db.select().from(campusActivities).where(eq(campusActivities.id, id));
    return item;
  }
  async createCampusActivity(data: InsertCampusActivity): Promise<CampusActivity> {
    const [result] = await db.insert(campusActivities).values(data as any);
    const [newItem] = await db.select().from(campusActivities).where(eq(campusActivities.id, result.insertId));
    return newItem;
  }
  async updateCampusActivity(id: number, data: Partial<InsertCampusActivity>): Promise<CampusActivity> {
    await db.update(campusActivities).set({ ...data, updatedAt: new Date() } as any).where(eq(campusActivities.id, id));
    const [item] = await db.select().from(campusActivities).where(eq(campusActivities.id, id));
    if (!item) throw new Error("CampusActivity not found");
    return item;
  }
  async deleteCampusActivity(id: number): Promise<void> {
    await db.delete(campusActivities).where(eq(campusActivities.id, id));
  }

  // ==== Recitals ====
  async getRecitals(): Promise<Recital[]> {
    return await db.select().from(recitals).orderBy(recitals.name);
  }
  async getRecital(id: number): Promise<Recital | undefined> {
    const [item] = await db.select().from(recitals).where(eq(recitals.id, id));
    return item;
  }
  async createRecital(data: InsertRecital): Promise<Recital> {
    const [result] = await db.insert(recitals).values(data as any);
    const [newItem] = await db.select().from(recitals).where(eq(recitals.id, result.insertId));
    return newItem;
  }
  async updateRecital(id: number, data: Partial<InsertRecital>): Promise<Recital> {
    await db.update(recitals).set({ ...data, updatedAt: new Date() } as any).where(eq(recitals.id, id));
    const [item] = await db.select().from(recitals).where(eq(recitals.id, id));
    if (!item) throw new Error("Recital not found");
    return item;
  }
  async deleteRecital(id: number): Promise<void> {
    await db.delete(recitals).where(eq(recitals.id, id));
  }

  // ==== VacationStudies ====
  async getVacationStudies(): Promise<VacationStudy[]> {
    return await db.select().from(vacationStudies).orderBy(vacationStudies.name);
  }
  async getVacationStudy(id: number): Promise<VacationStudy | undefined> {
    const [item] = await db.select().from(vacationStudies).where(eq(vacationStudies.id, id));
    return item;
  }
  async createVacationStudy(data: InsertVacationStudy): Promise<VacationStudy> {
    const [result] = await db.insert(vacationStudies).values(data as any);
    const [newItem] = await db.select().from(vacationStudies).where(eq(vacationStudies.id, result.insertId));
    return newItem;
  }
  async updateVacationStudy(id: number, data: Partial<InsertVacationStudy>): Promise<VacationStudy> {
    await db.update(vacationStudies).set({ ...data, updatedAt: new Date() } as any).where(eq(vacationStudies.id, id));
    const [item] = await db.select().from(vacationStudies).where(eq(vacationStudies.id, id));
    if (!item) throw new Error("VacationStudy not found");
    return item;
  }
  async deleteVacationStudy(id: number): Promise<void> {
    await db.delete(vacationStudies).where(eq(vacationStudies.id, id));
  }

  // ==== Payment Notes ====
  async getPaymentNotes(): Promise<PaymentNote[]> {
    return await db.select().from(paymentNotes).orderBy(paymentNotes.sortOrder);
  }
  async getPaymentNote(id: number): Promise<PaymentNote | undefined> {
    const [item] = await db.select().from(paymentNotes).where(eq(paymentNotes.id, id));
    return item;
  }
  async createPaymentNote(data: InsertPaymentNote): Promise<PaymentNote> {
    const [result] = await db.insert(paymentNotes).values(data as any);
    const [newItem] = await db.select().from(paymentNotes).where(eq(paymentNotes.id, result.insertId));
    return newItem;
  }
  async updatePaymentNote(id: number, data: Partial<InsertPaymentNote>): Promise<PaymentNote> {
    await db.update(paymentNotes).set({ ...data, updatedAt: new Date() } as any).where(eq(paymentNotes.id, id));
    const [item] = await db.select().from(paymentNotes).where(eq(paymentNotes.id, id));
    if (!item) throw new Error("Payment note not found");
    return item;
  }
  async deletePaymentNote(id: number): Promise<void> {
    await db.delete(paymentNotes).where(eq(paymentNotes.id, id));
  }

  // ==== Enrollment Details ====
  async getEnrollmentDetails(): Promise<EnrollmentDetail[]> {
    return await db.select().from(enrollmentDetails).orderBy(enrollmentDetails.sortOrder);
  }
  async getEnrollmentDetail(id: number): Promise<EnrollmentDetail | undefined> {
    const [item] = await db.select().from(enrollmentDetails).where(eq(enrollmentDetails.id, id));
    return item;
  }
  async createEnrollmentDetail(data: InsertEnrollmentDetail): Promise<EnrollmentDetail> {
    const [result] = await db.insert(enrollmentDetails).values(data as any);
    const [newItem] = await db.select().from(enrollmentDetails).where(eq(enrollmentDetails.id, result.insertId));
    return newItem;
  }
  async updateEnrollmentDetail(id: number, data: Partial<InsertEnrollmentDetail>): Promise<EnrollmentDetail> {
    await db.update(enrollmentDetails).set({ ...data, updatedAt: new Date() } as any).where(eq(enrollmentDetails.id, id));
    const [item] = await db.select().from(enrollmentDetails).where(eq(enrollmentDetails.id, id));
    if (!item) throw new Error("Enrollment detail not found");
    return item;
  }
  async deleteEnrollmentDetail(id: number): Promise<void> {
    await db.delete(enrollmentDetails).where(eq(enrollmentDetails.id, id));
  }

  // ==== Todos ====
  async getTodos(): Promise<Todo[]> {
    return await db.select().from(todos).orderBy(todos.id); // or descending if preferred
  }

  async createTodo(todoData: InsertTodo): Promise<Todo> {
    const [result] = await db.insert(todos).values(todoData);
    const [newTodo] = await db.select().from(todos).where(eq(todos.id, result.insertId));
    return newTodo;
  }

  async updateTodo(id: number, todoData: Partial<InsertTodo>): Promise<Todo> {
    await db.update(todos).set(todoData).where(eq(todos.id, id));
    const [updatedTodo] = await db.select().from(todos).where(eq(todos.id, id));
    if (!updatedTodo) throw new Error("Todo not found");
    return updatedTodo;
  }

  async deleteTodo(id: number): Promise<void> {
    await db.delete(todos).where(eq(todos.id, id));
  }

  // ==== Activities (STI Phase 1) ====
  async getActivities(): Promise<Activity[]> {
    return await db.select().from(activities).orderBy(desc(activities.createdAt));
  }

  async getActivitiesByCategoryId(categoryId: number): Promise<Activity[]> {
    return await db.select().from(activities).where(eq(activities.categoryId, categoryId)).orderBy(desc(activities.createdAt));
  }

  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity;
  }

  async createActivity(data: InsertActivity): Promise<Activity> {
    const [result] = await db.insert(activities).values(data as any);
    const [newActivity] = await db.select().from(activities).where(eq(activities.id, result.insertId));
    return newActivity;
  }

  async updateActivity(id: number, data: Partial<InsertActivity>): Promise<Activity | undefined> {
    await db.update(activities).set({ ...data, updatedAt: new Date() } as any).where(eq(activities.id, id));
    return this.getActivity(id);
  }

  async deleteActivity(id: number): Promise<void> {
    await db.delete(activities).where(eq(activities.id, id));
  }

  // ==== Global Enrollments (STI Phase 1) ====
  async getGlobalEnrollments(): Promise<GlobalEnrollment[]> {
    return await db.select().from(globalEnrollments).orderBy(desc(globalEnrollments.createdAt));
  }

  async getGlobalEnrollmentsByMemberId(memberId: number): Promise<GlobalEnrollment[]> {
    return await db.select().from(globalEnrollments).where(eq(globalEnrollments.memberId, memberId)).orderBy(desc(globalEnrollments.createdAt));
  }

  async getGlobalEnrollmentsByActivityId(activityId: number): Promise<GlobalEnrollment[]> {
    return await db.select().from(globalEnrollments).where(eq(globalEnrollments.activityId, activityId)).orderBy(desc(globalEnrollments.createdAt));
  }

  async createGlobalEnrollment(data: InsertGlobalEnrollment): Promise<GlobalEnrollment> {
    const [result] = await db.insert(globalEnrollments).values(data as any);
    const [newEnroll] = await db.select().from(globalEnrollments).where(eq(globalEnrollments.id, result.insertId));
    return newEnroll;
  }

  async updateGlobalEnrollment(id: number, data: Partial<InsertGlobalEnrollment>): Promise<GlobalEnrollment | undefined> {
    await db.update(globalEnrollments).set({ ...data, updatedAt: new Date() } as any).where(eq(globalEnrollments.id, id));
    const [updatedEnroll] = await db.select().from(globalEnrollments).where(eq(globalEnrollments.id, id));
    return updatedEnroll;
  }

  async deleteGlobalEnrollment(id: number): Promise<void> {
    await db.delete(globalEnrollments).where(eq(globalEnrollments.id, id));
  }

  // ==== Strategic Events (Planning) ====
  async getStrategicEvents(): Promise<StrategicEvent[]> {
    return await db.select().from(strategicEvents).orderBy(desc(strategicEvents.startDate));
  }

  async getStrategicEvent(id: number): Promise<StrategicEvent | undefined> {
    const [event] = await db.select().from(strategicEvents).where(eq(strategicEvents.id, id));
    return event;
  }

  async createStrategicEvent(eventData: InsertStrategicEvent): Promise<StrategicEvent> {
    const [result] = await db.insert(strategicEvents).values(eventData as any);
    const insertId = (result as any).insertId || (result as any).id;
    const [event] = await db.select().from(strategicEvents).where(eq(strategicEvents.id, insertId));
    if (!event) throw new Error("Strategic Event not found after creation");
    return event;
  }

  async updateStrategicEvent(id: number, eventData: Partial<InsertStrategicEvent>): Promise<StrategicEvent | undefined> {
    await db.update(strategicEvents).set({ ...eventData, updatedAt: new Date() } as any).where(eq(strategicEvents.id, id));
    const [event] = await db.select().from(strategicEvents).where(eq(strategicEvents.id, id));
    return event;
  }

  async deleteStrategicEvent(id: number): Promise<void> {
    await db.delete(strategicEvents).where(eq(strategicEvents.id, id));
  }
}

export const storage = new DatabaseStorage();
