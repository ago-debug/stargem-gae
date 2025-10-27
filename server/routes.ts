import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import Papa from "papaparse";
import { readSpreadsheet } from "./google-sheets";
import { 
  insertMemberSchema,
  insertCategorySchema,
  insertClientCategorySchema,
  insertInstructorSchema,
  insertStudioSchema,
  insertCourseSchema,
  insertMembershipSchema,
  insertMedicalCertificateSchema,
  insertPaymentMethodSchema,
  insertPaymentSchema,
  insertEnrollmentSchema,
  insertAccessLogSchema,
} from "@shared/schema";

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth user endpoint
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ==== Members Routes ====
  app.get("/api/members", isAuthenticated, async (req, res) => {
    try {
      const members = await storage.getMembers();
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.get("/api/members/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const member = await storage.getMember(id);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch member" });
    }
  });

  app.post("/api/members", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMemberSchema.parse(req.body);
      const member = await storage.createMember(validatedData);
      res.status(201).json(member);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create member" });
    }
  });

  app.patch("/api/members/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const member = await storage.updateMember(id, req.body);
      res.json(member);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update member" });
    }
  });

  app.delete("/api/members/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMember(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete member" });
    }
  });

  // ==== Categories Routes ====
  app.get("/api/categories", isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create category" });
    }
  });

  app.patch("/api/categories/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.updateCategory(id, req.body);
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // ==== Client Categories Routes ====
  app.get("/api/client-categories", isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getClientCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client categories" });
    }
  });

  app.post("/api/client-categories", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertClientCategorySchema.parse(req.body);
      const category = await storage.createClientCategory(validatedData);
      res.status(201).json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create client category" });
    }
  });

  app.patch("/api/client-categories/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.updateClientCategory(id, req.body);
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update client category" });
    }
  });

  app.delete("/api/client-categories/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteClientCategory(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client category" });
    }
  });

  // ==== Instructors Routes ====
  app.get("/api/instructors", isAuthenticated, async (req, res) => {
    try {
      const instructors = await storage.getInstructors();
      res.json(instructors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch instructors" });
    }
  });

  app.post("/api/instructors", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertInstructorSchema.parse(req.body);
      const instructor = await storage.createInstructor(validatedData);
      res.status(201).json(instructor);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create instructor" });
    }
  });

  app.patch("/api/instructors/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const instructor = await storage.updateInstructor(id, req.body);
      res.json(instructor);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update instructor" });
    }
  });

  app.delete("/api/instructors/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteInstructor(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete instructor" });
    }
  });

  // ==== Studios Routes ====
  app.get("/api/studios", isAuthenticated, async (req, res) => {
    try {
      const studios = await storage.getStudios();
      res.json(studios);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch studios" });
    }
  });

  app.post("/api/studios", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertStudioSchema.parse(req.body);
      const studio = await storage.createStudio(validatedData);
      res.status(201).json(studio);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create studio" });
    }
  });

  app.patch("/api/studios/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const studio = await storage.updateStudio(id, req.body);
      res.json(studio);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update studio" });
    }
  });

  app.delete("/api/studios/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteStudio(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete studio" });
    }
  });

  // ==== Courses Routes ====
  app.get("/api/courses", isAuthenticated, async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.post("/api/courses", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(validatedData);
      res.status(201).json(course);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create course" });
    }
  });

  app.patch("/api/courses/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const course = await storage.updateCourse(id, req.body);
      res.json(course);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCourse(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // ==== Enrollments Routes ====
  app.get("/api/enrollments", isAuthenticated, async (req, res) => {
    try {
      const enrollments = await storage.getEnrollments();
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.post("/api/enrollments", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertEnrollmentSchema.parse(req.body);
      const enrollment = await storage.createEnrollment(validatedData);
      
      // Update course current enrollment count
      const course = await storage.getCourse(enrollment.courseId);
      if (course) {
        await storage.updateCourse(course.id, {
          currentEnrollment: (course.currentEnrollment || 0) + 1,
        });
      }
      
      res.status(201).json(enrollment);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create enrollment" });
    }
  });

  app.patch("/api/enrollments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const enrollment = await storage.updateEnrollment(id, req.body);
      res.json(enrollment);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update enrollment" });
    }
  });

  app.delete("/api/enrollments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const enrollment = await storage.getEnrollment(id);
      
      if (enrollment) {
        // Update course current enrollment count
        const course = await storage.getCourse(enrollment.courseId);
        if (course && course.currentEnrollment && course.currentEnrollment > 0) {
          await storage.updateCourse(course.id, {
            currentEnrollment: course.currentEnrollment - 1,
          });
        }
      }
      
      await storage.deleteEnrollment(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete enrollment" });
    }
  });

  // ==== Memberships Routes ====
  app.get("/api/memberships", isAuthenticated, async (req, res) => {
    try {
      const memberships = await storage.getMemberships();
      res.json(memberships);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch memberships" });
    }
  });

  app.post("/api/memberships", isAuthenticated, async (req, res) => {
    try {
      let validatedData = insertMembershipSchema.parse(req.body);
      
      // Generate membership number automatically if not provided
      if (!validatedData.membershipNumber) {
        const existingMemberships = await storage.getMemberships();
        const currentYear = "2526";
        const existingNumbers = existingMemberships
          .map(m => m.membershipNumber)
          .filter(num => num && typeof num === 'string' && num.startsWith(currentYear))
          .map(num => parseInt(num.substring(4)) || 0);
        
        const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
        validatedData.membershipNumber = `${currentYear}${nextNumber.toString().padStart(6, '0')}`;
      }
      
      // Generate barcode if not provided (same as membership number)
      if (!validatedData.barcode) {
        validatedData.barcode = validatedData.membershipNumber;
      }
      
      const membership = await storage.createMembership(validatedData);
      res.status(201).json(membership);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create membership" });
    }
  });

  app.patch("/api/memberships/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const membership = await storage.updateMembership(id, req.body);
      res.json(membership);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update membership" });
    }
  });

  app.delete("/api/memberships/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMembership(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to delete membership" });
    }
  });

  // ==== Medical Certificates Routes ====
  app.get("/api/medical-certificates", isAuthenticated, async (req, res) => {
    try {
      const certificates = await storage.getMedicalCertificates();
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch medical certificates" });
    }
  });

  app.post("/api/medical-certificates", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMedicalCertificateSchema.parse(req.body);
      const certificate = await storage.createMedicalCertificate(validatedData);
      res.status(201).json(certificate);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create medical certificate" });
    }
  });

  app.patch("/api/medical-certificates/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const certificate = await storage.updateMedicalCertificate(id, req.body);
      res.json(certificate);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update medical certificate" });
    }
  });

  app.delete("/api/medical-certificates/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMedicalCertificate(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to delete medical certificate" });
    }
  });

  // ==== Payment Methods Routes ====
  app.get("/api/payment-methods", isAuthenticated, async (req, res) => {
    try {
      const methods = await storage.getPaymentMethods();
      res.json(methods);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment methods" });
    }
  });

  app.post("/api/payment-methods", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPaymentMethodSchema.parse(req.body);
      const method = await storage.createPaymentMethod(validatedData);
      res.status(201).json(method);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create payment method" });
    }
  });

  app.patch("/api/payment-methods/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const method = await storage.updatePaymentMethod(id, req.body);
      res.json(method);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update payment method" });
    }
  });

  app.delete("/api/payment-methods/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePaymentMethod(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to delete payment method" });
    }
  });

  // ==== Payments Routes ====
  app.get("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validatedData);
      res.status(201).json(payment);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create payment" });
    }
  });

  app.patch("/api/payments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const payment = await storage.updatePayment(id, req.body);
      res.json(payment);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update payment" });
    }
  });

  // ==== Access Logs Routes ====
  app.get("/api/access-logs", isAuthenticated, async (req, res) => {
    try {
      const logs = await storage.getAccessLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch access logs" });
    }
  });

  app.post("/api/access-logs", isAuthenticated, async (req, res) => {
    try {
      const { barcode, accessType } = req.body;
      
      // Check if membership exists and is valid
      const membership = await storage.getMembershipByBarcode(barcode);
      
      let logData: any = {
        barcode,
        accessType: accessType || "entry",
        membershipStatus: null,
        notes: null,
        memberId: null,
      };

      if (membership) {
        logData.memberId = membership.memberId;
        const today = new Date();
        const expiry = new Date(membership.expiryDate);
        
        if (membership.status === "active" && expiry > today) {
          logData.membershipStatus = "active";
        } else if (expiry < today) {
          logData.membershipStatus = "expired";
          logData.notes = "Membership expired";
        } else {
          logData.membershipStatus = membership.status;
        }
      } else {
        logData.membershipStatus = "invalid";
        logData.notes = "Barcode not found";
      }

      const log = await storage.createAccessLog(logData);
      
      // Return additional info for UI feedback
      let memberName = "Unknown";
      if (membership) {
        const member = await storage.getMember(membership.memberId);
        if (member) {
          memberName = `${member.firstName} ${member.lastName}`;
        }
      }

      res.status(201).json({
        ...log,
        valid: logData.membershipStatus === "active",
        memberName,
        reason: logData.notes,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create access log" });
    }
  });

  // ==== Stats Routes ====
  app.get("/api/stats/dashboard", isAuthenticated, async (req, res) => {
    try {
      const members = await storage.getMembers();
      const courses = await storage.getCourses();
      const memberships = await storage.getMemberships();
      const payments = await storage.getPayments();
      const certificates = await storage.getMedicalCertificates();

      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const activeMemberships = memberships.filter(m => {
        const expiry = new Date(m.expiryDate);
        return m.status === "active" && expiry > today;
      }).length;

      const expiringThisWeek = [
        ...memberships.filter(m => {
          const expiry = new Date(m.expiryDate);
          return expiry > today && expiry < nextWeek;
        }),
        ...certificates.filter(c => {
          const expiry = new Date(c.expiryDate);
          return expiry > today && expiry < nextWeek;
        }),
      ].length;

      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const monthlyRevenue = payments
        .filter(p => {
          if (!p.createdAt) return false;
          const createdDate = new Date(p.createdAt);
          return p.status === "paid" && 
                 createdDate.getMonth() === currentMonth && 
                 createdDate.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const pendingPayments = payments.filter(p => p.status === "pending").length;
      const enrollments = await storage.getEnrollments();

      res.json({
        totalMembers: members.length,
        activeMemberships,
        activeCourses: courses.filter(c => c.active).length,
        totalEnrollments: enrollments.length,
        expiringThisWeek,
        monthlyRevenue,
        pendingPayments,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/stats/alerts", isAuthenticated, async (req, res) => {
    try {
      const memberships = await storage.getMemberships();
      const certificates = await storage.getMedicalCertificates();
      const payments = await storage.getPayments();
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      res.json({
        expiringMemberships: memberships.filter(m => {
          const expiry = new Date(m.expiryDate);
          return expiry > today && expiry < nextWeek;
        }).length,
        expiredCertificates: certificates.filter(c => {
          const expiry = new Date(c.expiryDate);
          return expiry < today;
        }).length,
        overduePayments: payments.filter(p => p.status === "overdue").length,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.get("/api/stats/recent-activity", isAuthenticated, async (req, res) => {
    try {
      const enrollments = await storage.getEnrollments();
      const payments = await storage.getPayments();
      const members = await storage.getMembers();
      const courses = await storage.getCourses();

      // Combine and format recent activity
      const activity: any[] = [];

      // Recent enrollments
      for (const enrollment of enrollments.slice(0, 5)) {
        const member = members.find(m => m.id === enrollment.memberId);
        const course = courses.find(c => c.id === enrollment.courseId);
        if (member && course) {
          activity.push({
            memberName: `${member.firstName} ${member.lastName}`,
            description: `Iscrizione a ${course.name}`,
            date: enrollment.enrollmentDate,
            status: enrollment.status,
          });
        }
      }

      // Recent payments
      for (const payment of payments.slice(0, 5)) {
        const member = payment.memberId ? members.find(m => m.id === payment.memberId) : null;
        activity.push({
          memberName: member ? `${member.firstName} ${member.lastName}` : "N/A",
          description: payment.description || `Pagamento ${payment.type}`,
          date: payment.createdAt,
          status: payment.status,
        });
      }

      // Sort by date and limit
      activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      res.json(activity.slice(0, 10));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  app.get("/api/stats/reports", isAuthenticated, async (req, res) => {
    try {
      const members = await storage.getMembers();
      const courses = await storage.getCourses();
      const enrollments = await storage.getEnrollments();
      const payments = await storage.getPayments();

      res.json({
        totalMembers: members.length,
        newMembersThisMonth: 0, // TODO: implement date filtering
        activeCourses: courses.filter(c => c.active).length,
        totalEnrollments: enrollments.length,
        monthlyRevenue: payments
          .filter(p => p.status === "paid")
          .reduce((sum, p) => sum + parseFloat(p.amount), 0),
        revenueGrowth: 0, // TODO: implement growth calculation
        attendanceRate: 85, // TODO: implement actual calculation
        enrollmentsByCategory: [],
        instructorEarnings: [],
        dailyAccesses: [],
        upcomingExpiries: [],
        pendingPayments: payments.filter(p => p.status === "pending").slice(0, 10),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // ==== Import Route ====
  app.post("/api/import", isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { type } = req.body;
      if (!type || !['members', 'courses', 'instructors'].includes(type)) {
        return res.status(400).json({ message: "Invalid import type" });
      }

      const fileContent = req.file.buffer.toString('utf-8');
      const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
      });

      let imported = 0;
      let skipped = 0;
      const errors: any[] = [];

      // Process each row based on type
      for (let i = 0; i < parseResult.data.length; i++) {
        const row: any = parseResult.data[i];
        try {
          if (type === 'members') {
            const memberData = {
              firstName: row['Nome'] || row['First Name'] || row['firstName'],
              lastName: row['Cognome'] || row['Last Name'] || row['lastName'],
              email: row['Email'] || row['email'] || null,
              phone: row['Telefono'] || row['Phone'] || row['phone'] || null,
              dateOfBirth: row['Data Nascita'] || row['Date of Birth'] || row['dateOfBirth'] || null,
              address: row['Indirizzo'] || row['Address'] || row['address'] || null,
              notes: row['Note'] || row['Notes'] || row['notes'] || null,
              active: true,
            };

            if (!memberData.firstName || !memberData.lastName) {
              throw new Error("Nome e Cognome sono obbligatori");
            }

            await storage.createMember(memberData);
            imported++;
          } else if (type === 'courses') {
            const courseData = {
              name: row['Nome'] || row['Name'] || row['name'],
              description: row['Descrizione'] || row['Description'] || row['description'] || null,
              price: row['Prezzo'] || row['Price'] || row['price'] || null,
              maxCapacity: row['Posti Max'] || row['Max Capacity'] || row['maxCapacity'] ? parseInt(row['Posti Max'] || row['Max Capacity'] || row['maxCapacity']) : null,
              startDate: row['Data Inizio'] || row['Start Date'] || row['startDate'] || null,
              endDate: row['Data Fine'] || row['End Date'] || row['endDate'] || null,
              schedule: row['Orario'] || row['Schedule'] || row['schedule'] || null,
              categoryId: null,
              instructorId: null,
              active: true,
            };

            if (!courseData.name) {
              throw new Error("Nome corso è obbligatorio");
            }

            await storage.createCourse(courseData);
            imported++;
          } else if (type === 'instructors') {
            const instructorData = {
              firstName: row['Nome'] || row['First Name'] || row['firstName'],
              lastName: row['Cognome'] || row['Last Name'] || row['lastName'],
              email: row['Email'] || row['email'] || null,
              phone: row['Telefono'] || row['Phone'] || row['phone'] || null,
              specialization: row['Specializzazione'] || row['Specialization'] || row['specialization'] || null,
              hourlyRate: row['Tariffa Oraria'] || row['Hourly Rate'] || row['hourlyRate'] || null,
              bio: null,
              active: true,
            };

            if (!instructorData.firstName || !instructorData.lastName) {
              throw new Error("Nome e Cognome sono obbligatori");
            }

            await storage.createInstructor(instructorData);
            imported++;
          }
        } catch (error: any) {
          skipped++;
          errors.push({
            row: i + 2, // +2 because header is row 1 and array is 0-indexed
            message: error.message || "Errore sconosciuto",
          });
        }
      }

      res.json({
        imported,
        skipped,
        errors: errors.slice(0, 50), // Limit errors to first 50
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to import data" });
    }
  });

  // ==== Google Sheets Import Route ====
  app.post("/api/import/google-sheets", isAuthenticated, async (req, res) => {
    try {
      let { spreadsheetId, range, type } = req.body;
      
      if (!spreadsheetId || !range) {
        return res.status(400).json({ message: "SpreadsheetId e range sono obbligatori" });
      }

      if (!type || !['members', 'courses', 'instructors'].includes(type)) {
        return res.status(400).json({ message: "Tipo di import non valido" });
      }

      // Clean up spreadsheetId and range - remove quotes if present
      spreadsheetId = spreadsheetId.trim().replace(/^["']|["']$/g, '');
      range = range.trim().replace(/^["']|["']$/g, '');

      // Read data from Google Sheets
      const rows = await readSpreadsheet(spreadsheetId, range);
      
      if (!rows || rows.length === 0) {
        return res.status(400).json({ message: "Nessun dato trovato nel range specificato" });
      }

      // First row is headers
      const headers = rows[0];
      const dataRows = rows.slice(1);

      let imported = 0;
      let skipped = 0;
      const errors: any[] = [];

      // Process each row
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        // Convert array to object using headers
        const rowData: any = {};
        headers.forEach((header: string, index: number) => {
          rowData[header.trim()] = row[index];
        });

        try {
          if (type === 'members') {
            const memberData = {
              firstName: rowData['Nome'] || rowData['First Name'] || rowData['firstName'],
              lastName: rowData['Cognome'] || rowData['Last Name'] || rowData['lastName'],
              email: rowData['Email'] || rowData['email'] || null,
              phone: rowData['Telefono'] || rowData['Phone'] || rowData['phone'] || null,
              dateOfBirth: rowData['Data di Nascita'] || rowData['Date of Birth'] || rowData['dateOfBirth'] || null,
              address: rowData['Indirizzo'] || rowData['Address'] || rowData['address'] || null,
              city: rowData['Città'] || rowData['City'] || rowData['city'] || null,
              zipCode: rowData['CAP'] || rowData['Zip Code'] || rowData['zipCode'] || null,
              taxCode: rowData['Codice Fiscale'] || rowData['Tax Code'] || rowData['taxCode'] || null,
              notes: rowData['Note'] || rowData['Notes'] || rowData['notes'] || null,
              active: true,
            };

            if (!memberData.firstName || !memberData.lastName) {
              throw new Error("Nome e Cognome sono obbligatori");
            }

            await storage.createMember(memberData);
            imported++;
          } else if (type === 'courses') {
            const courseData = {
              name: rowData['Nome Corso'] || rowData['Course Name'] || rowData['name'],
              description: rowData['Descrizione'] || rowData['Description'] || rowData['description'] || null,
              price: rowData['Prezzo'] || rowData['Price'] || rowData['price'] || null,
              maxCapacity: rowData['Capienza Massima'] || rowData['Max Capacity'] || rowData['maxCapacity'] ? parseInt(rowData['Capienza Massima'] || rowData['Max Capacity'] || rowData['maxCapacity']) : null,
              schedule: rowData['Orario'] || rowData['Schedule'] || rowData['schedule'] || null,
              categoryId: null,
              instructorId: null,
              active: true,
            };

            if (!courseData.name) {
              throw new Error("Nome corso è obbligatorio");
            }

            await storage.createCourse(courseData);
            imported++;
          } else if (type === 'instructors') {
            const instructorData = {
              firstName: rowData['Nome'] || rowData['First Name'] || rowData['firstName'],
              lastName: rowData['Cognome'] || rowData['Last Name'] || rowData['lastName'],
              email: rowData['Email'] || rowData['email'] || null,
              phone: rowData['Telefono'] || rowData['Phone'] || rowData['phone'] || null,
              specialization: rowData['Specializzazione'] || rowData['Specialization'] || rowData['specialization'] || null,
              hourlyRate: rowData['Tariffa Oraria'] || rowData['Hourly Rate'] || rowData['hourlyRate'] || null,
              bio: null,
              active: true,
            };

            if (!instructorData.firstName || !instructorData.lastName) {
              throw new Error("Nome e Cognome sono obbligatori");
            }

            await storage.createInstructor(instructorData);
            imported++;
          }
        } catch (error: any) {
          skipped++;
          errors.push({
            row: i + 2, // +2 because header is row 1 and array is 0-indexed
            message: error.message || "Errore sconosciuto",
          });
        }
      }

      res.json({
        imported,
        skipped,
        errors: errors.slice(0, 50),
      });
    } catch (error: any) {
      console.error("Google Sheets import error:", error);
      res.status(500).json({ message: error.message || "Errore nell'importazione da Google Sheets" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
