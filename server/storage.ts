import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import {
  users,
  members,
  categories,
  clientCategories,
  instructors,
  studios,
  courses,
  memberships,
  medicalCertificates,
  paymentMethods,
  payments,
  enrollments,
  accessLogs,
  attendances,
  type User,
  type UpsertUser,
  type Member,
  type InsertMember,
  type Category,
  type InsertCategory,
  type ClientCategory,
  type InsertClientCategory,
  type Instructor,
  type InsertInstructor,
  type Studio,
  type InsertStudio,
  type Course,
  type InsertCourse,
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
  type AccessLog,
  type InsertAccessLog,
  type Attendance,
  type InsertAttendance,
} from "@shared/schema";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Members
  getMembers(): Promise<Member[]>;
  getMember(id: number): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: number, member: Partial<InsertMember>): Promise<Member>;
  deleteMember(id: number): Promise<void>;

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

  // Memberships
  getMemberships(): Promise<Membership[]>;
  getMembership(id: number): Promise<Membership | undefined>;
  getMembershipByBarcode(barcode: string): Promise<Membership | undefined>;
  createMembership(membership: InsertMembership): Promise<Membership>;
  updateMembership(id: number, membership: Partial<InsertMembership>): Promise<Membership>;
  deleteMembership(id: number): Promise<void>;

  // Medical Certificates
  getMedicalCertificates(): Promise<MedicalCertificate[]>;
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
  getPayment(id: number): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment>;
  deletePayment(id: number): Promise<void>;

  // Enrollments
  getEnrollments(): Promise<Enrollment[]>;
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollment: Partial<InsertEnrollment>): Promise<Enrollment>;
  deleteEnrollment(id: number): Promise<void>;

  // Access Logs
  getAccessLogs(limit?: number): Promise<AccessLog[]>;
  createAccessLog(log: InsertAccessLog): Promise<AccessLog>;

  // Attendances
  getAttendances(): Promise<Attendance[]>;
  getAttendance(id: number): Promise<Attendance | undefined>;
  getAttendancesByMember(memberId: number): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  deleteAttendance(id: number): Promise<void>;
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

  async getMember(id: number): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member;
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

  // ==== Memberships ====
  async getMemberships(): Promise<Membership[]> {
    return await db.select().from(memberships).orderBy(desc(memberships.expiryDate));
  }

  async getMembership(id: number): Promise<Membership | undefined> {
    const [membership] = await db.select().from(memberships).where(eq(memberships.id, id));
    return membership;
  }

  async getMembershipByBarcode(barcode: string): Promise<Membership | undefined> {
    const [membership] = await db.select().from(memberships).where(eq(memberships.barcode, barcode));
    return membership;
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
  async getEnrollments(): Promise<Enrollment[]> {
    return await db.select().from(enrollments).orderBy(desc(enrollments.enrollmentDate));
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
  async getAccessLogs(limit: number = 100): Promise<AccessLog[]> {
    return await db.select().from(accessLogs).orderBy(desc(accessLogs.accessTime)).limit(limit);
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
  async getAttendances(): Promise<Attendance[]> {
    return await db.select().from(attendances).orderBy(desc(attendances.attendanceDate));
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
}

export const storage = new DatabaseStorage();
