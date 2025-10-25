import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import {
  users,
  members,
  categories,
  instructors,
  courses,
  memberships,
  medicalCertificates,
  payments,
  enrollments,
  accessLogs,
  type User,
  type UpsertUser,
  type Member,
  type InsertMember,
  type Category,
  type InsertCategory,
  type Instructor,
  type InsertInstructor,
  type Course,
  type InsertCourse,
  type Membership,
  type InsertMembership,
  type MedicalCertificate,
  type InsertMedicalCertificate,
  type Payment,
  type InsertPayment,
  type Enrollment,
  type InsertEnrollment,
  type AccessLog,
  type InsertAccessLog,
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

  // Instructors
  getInstructors(): Promise<Instructor[]>;
  getInstructor(id: number): Promise<Instructor | undefined>;
  createInstructor(instructor: InsertInstructor): Promise<Instructor>;
  updateInstructor(id: number, instructor: Partial<InsertInstructor>): Promise<Instructor>;
  deleteInstructor(id: number): Promise<void>;

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
    return newMember;
  }

  async updateMember(id: number, member: Partial<InsertMember>): Promise<Member> {
    const [updated] = await db
      .update(members)
      .set({ ...member, updatedAt: new Date() })
      .where(eq(members.id, id))
      .returning();
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
    return newMembership;
  }

  async updateMembership(id: number, membership: Partial<InsertMembership>): Promise<Membership> {
    const [updated] = await db
      .update(memberships)
      .set({ ...membership, updatedAt: new Date() })
      .where(eq(memberships.id, id))
      .returning();
    return updated;
  }

  async deleteMembership(id: number): Promise<void> {
    await db.delete(memberships).where(eq(memberships.id, id));
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
    return newCert;
  }

  async updateMedicalCertificate(id: number, cert: Partial<InsertMedicalCertificate>): Promise<MedicalCertificate> {
    const [updated] = await db
      .update(medicalCertificates)
      .set({ ...cert, updatedAt: new Date() })
      .where(eq(medicalCertificates.id, id))
      .returning();
    return updated;
  }

  async deleteMedicalCertificate(id: number): Promise<void> {
    await db.delete(medicalCertificates).where(eq(medicalCertificates.id, id));
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
}

export const storage = new DatabaseStorage();
