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
  insertSubscriptionTypeSchema,
  insertInstructorSchema,
  insertStudioSchema,
  insertCourseSchema,
  insertWorkshopSchema,
  insertMembershipSchema,
  insertMedicalCertificateSchema,
  insertPaymentMethodSchema,
  insertPaymentSchema,
  insertEnrollmentSchema,
  insertWorkshopEnrollmentSchema,
  insertWorkshopAttendanceSchema,
  insertAccessLogSchema,
  insertAttendanceSchema,
  insertCustomReportSchema,
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
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 50;
      const search = req.query.search as string || "";
      
      // Always use paginated query for performance
      const result = await storage.getMembersPaginated(page, pageSize, search);
      res.json(result);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.get("/api/members/duplicates", isAuthenticated, async (req, res) => {
    try {
      const duplicates = await storage.getDuplicateFiscalCodes();
      res.json(duplicates);
    } catch (error) {
      console.error("Error fetching duplicates:", error);
      res.status(500).json({ message: "Failed to fetch duplicate fiscal codes" });
    }
  });

  app.get("/api/members/entity-cards", isAuthenticated, async (req, res) => {
    try {
      const members = await storage.getMembersWithEntityCards();
      res.json(members);
    } catch (error) {
      console.error("Error fetching entity cards:", error);
      res.status(500).json({ message: "Failed to fetch entity cards" });
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
      const normalizeEmpty = (val: any): any => {
        if (val === "" || val === undefined) return null;
        if (typeof val === "string" && val.trim() === "") return null;
        return val;
      };
      const normalizedData: any = {};
      for (const [key, value] of Object.entries(req.body)) {
        normalizedData[key] = normalizeEmpty(value);
      }
      if (!normalizedData.firstName) normalizedData.firstName = "Sconosciuto";
      if (!normalizedData.lastName) normalizedData.lastName = "Sconosciuto";
      
      // Normalize fiscal code to uppercase
      if (normalizedData.fiscalCode) {
        normalizedData.fiscalCode = normalizedData.fiscalCode.toUpperCase().trim();
      }
      
      // Check for duplicate fiscal code
      if (normalizedData.fiscalCode) {
        const existingMember = await storage.getMemberByFiscalCode(normalizedData.fiscalCode);
        if (existingMember) {
          return res.status(409).json({ 
            message: `Codice fiscale già presente nel sistema`,
            conflictWith: {
              id: existingMember.id,
              firstName: existingMember.firstName,
              lastName: existingMember.lastName,
              fiscalCode: existingMember.fiscalCode
            }
          });
        }
      }
      
      const member = await storage.createMember(normalizedData);
      res.status(201).json(member);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create member" });
    }
  });

  app.patch("/api/members/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const normalizeEmpty = (val: any): any => {
        if (val === "" || val === undefined) return null;
        if (typeof val === "string" && val.trim() === "") return null;
        return val;
      };
      const normalizedData: any = {};
      for (const [key, value] of Object.entries(req.body)) {
        normalizedData[key] = normalizeEmpty(value);
      }
      
      // Normalize fiscal code to uppercase
      if (normalizedData.fiscalCode) {
        normalizedData.fiscalCode = normalizedData.fiscalCode.toUpperCase().trim();
      }
      
      // Check for duplicate fiscal code (excluding current member)
      if (normalizedData.fiscalCode) {
        const existingMember = await storage.getMemberByFiscalCode(normalizedData.fiscalCode);
        if (existingMember && existingMember.id !== id) {
          return res.status(409).json({ 
            message: `Codice fiscale già presente nel sistema`,
            conflictWith: {
              id: existingMember.id,
              firstName: existingMember.firstName,
              lastName: existingMember.lastName,
              fiscalCode: existingMember.fiscalCode
            }
          });
        }
      }
      
      const member = await storage.updateMember(id, normalizedData);
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

  // ==== Member Relationships Routes (genitori/tutori) ====
  app.get("/api/members/:memberId/relationships", isAuthenticated, async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const relationships = await storage.getMemberRelationships(memberId);
      res.json(relationships);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch member relationships" });
    }
  });

  app.get("/api/members/:memberId/children", isAuthenticated, async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const children = await storage.getMemberChildren(memberId);
      res.json(children);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch member children" });
    }
  });

  app.post("/api/member-relationships", isAuthenticated, async (req, res) => {
    try {
      const relationship = await storage.createMemberRelationship(req.body);
      res.status(201).json(relationship);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create member relationship" });
    }
  });

  app.delete("/api/member-relationships/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMemberRelationship(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete member relationship" });
    }
  });

  // ==== Google Sheets Import Route ====
  app.post("/api/members/import-google-sheets", isAuthenticated, async (req, res) => {
    try {
      const { spreadsheetId, range = "A1:Z501", limit = 500 } = req.body;
      
      if (!spreadsheetId) {
        return res.status(400).json({ message: "spreadsheetId is required" });
      }

      const rows = await readSpreadsheet(spreadsheetId, range);
      
      if (rows.length < 2) {
        return res.status(400).json({ message: "No data found in spreadsheet" });
      }

      const headers = rows[0].map((h: string) => h?.toLowerCase().trim() || "");
      const dataRows = rows.slice(1, Math.min(rows.length, limit + 1));
      
      const headerMap: Record<string, number> = {};
      headers.forEach((h: string, i: number) => {
        headerMap[h] = i;
      });

      const findColumn = (possibleNames: string[]): number => {
        for (const name of possibleNames) {
          const idx = headers.findIndex((h: string) => h.includes(name.toLowerCase()));
          if (idx !== -1) return idx;
        }
        return -1;
      };

      const colFiscalCode = findColumn(["codice fiscale", "fiscal code", "cf", "codicefiscale"]);
      const colFirstName = findColumn(["nome", "first name", "firstname"]);
      const colLastName = findColumn(["cognome", "last name", "lastname", "surname"]);
      const colEmail = findColumn(["email", "e-mail", "mail"]);
      const colPhone = findColumn(["telefono", "phone", "tel"]);
      const colMobile = findColumn(["cellulare", "mobile", "cell"]);
      const colDateOfBirth = findColumn(["data nascita", "data di nascita", "date of birth", "birth date", "nascita"]);
      const colPlaceOfBirth = findColumn(["luogo nascita", "luogo di nascita", "place of birth", "birth place"]);
      const colGender = findColumn(["sesso", "gender", "genere"]);
      const colStreet = findColumn(["indirizzo", "via", "street", "address"]);
      const colCity = findColumn(["città", "citta", "city", "comune"]);
      const colProvince = findColumn(["provincia", "province", "prov"]);
      const colPostalCode = findColumn(["cap", "postal code", "zip"]);
      const colCardNumber = findColumn(["tessera", "card", "numero tessera", "card number"]);

      const existingMembers = await storage.getMembers();
      const existingByFiscalCode = new Map<string, number>();
      existingMembers.forEach(m => {
        if (m.fiscalCode) {
          existingByFiscalCode.set(m.fiscalCode.toUpperCase(), m.id);
        }
      });

      let imported = 0;
      let updated = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        try {
          const getValue = (colIdx: number): string => {
            if (colIdx < 0 || colIdx >= row.length) return "";
            return (row[colIdx] || "").toString().trim();
          };

          const fiscalCode = getValue(colFiscalCode).toUpperCase();
          const firstName = getValue(colFirstName);
          const lastName = getValue(colLastName);

          if (!firstName && !lastName) {
            skipped++;
            continue;
          }

          const parseDate = (val: string): string | undefined => {
            if (!val) return undefined;
            const parts = val.split(/[\/\-\.]/);
            if (parts.length === 3) {
              let [a, b, c] = parts;
              if (a.length === 4) return `${a}-${b.padStart(2, '0')}-${c.padStart(2, '0')}`;
              if (c.length === 4) return `${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
              if (c.length === 2) {
                const year = parseInt(c) > 50 ? `19${c}` : `20${c}`;
                return `${year}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
              }
            }
            return undefined;
          };

          const genderRaw = getValue(colGender).toUpperCase();
          const gender = genderRaw === "M" || genderRaw === "MASCHIO" || genderRaw === "MALE" ? "M" 
                       : genderRaw === "F" || genderRaw === "FEMMINA" || genderRaw === "FEMALE" ? "F" 
                       : undefined;

          const memberData = {
            firstName: firstName || "Sconosciuto",
            lastName: lastName || "Sconosciuto",
            fiscalCode: fiscalCode || undefined,
            email: getValue(colEmail) || undefined,
            phone: getValue(colPhone) || undefined,
            mobile: getValue(colMobile) || undefined,
            dateOfBirth: parseDate(getValue(colDateOfBirth)),
            placeOfBirth: getValue(colPlaceOfBirth) || undefined,
            gender,
            streetAddress: getValue(colStreet) || undefined,
            city: getValue(colCity) || undefined,
            province: getValue(colProvince).toUpperCase().substring(0, 2) || undefined,
            postalCode: getValue(colPostalCode) || undefined,
            cardNumber: getValue(colCardNumber) || undefined,
            active: true,
          };

          if (fiscalCode && existingByFiscalCode.has(fiscalCode)) {
            const existingId = existingByFiscalCode.get(fiscalCode)!;
            await storage.updateMember(existingId, memberData);
            updated++;
          } else {
            const newMember = await storage.createMember(memberData);
            if (fiscalCode) {
              existingByFiscalCode.set(fiscalCode, newMember.id);
            }
            imported++;
          }
        } catch (err: any) {
          errors.push(`Row ${i + 2}: ${err.message}`);
          skipped++;
        }
      }

      res.json({
        success: true,
        imported,
        updated,
        skipped,
        total: dataRows.length,
        errors: errors.slice(0, 10),
      });
    } catch (error: any) {
      console.error("Google Sheets import error:", error);
      res.status(500).json({ message: error.message || "Failed to import from Google Sheets" });
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

  // ==== Subscription Types Routes ====
  app.get("/api/subscription-types", isAuthenticated, async (req, res) => {
    try {
      const types = await storage.getSubscriptionTypes();
      res.json(types);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription types" });
    }
  });

  app.post("/api/subscription-types", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSubscriptionTypeSchema.parse(req.body);
      const subscriptionType = await storage.createSubscriptionType(validatedData);
      res.status(201).json(subscriptionType);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create subscription type" });
    }
  });

  app.patch("/api/subscription-types/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subscriptionType = await storage.updateSubscriptionType(id, req.body);
      res.json(subscriptionType);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update subscription type" });
    }
  });

  app.delete("/api/subscription-types/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSubscriptionType(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete subscription type" });
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

  // ==== Workshops Routes ====
  app.get("/api/workshops", isAuthenticated, async (req, res) => {
    try {
      const workshops = await storage.getWorkshops();
      res.json(workshops);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workshops" });
    }
  });

  app.post("/api/workshops", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertWorkshopSchema.parse(req.body);
      const workshop = await storage.createWorkshop(validatedData);
      res.status(201).json(workshop);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create workshop" });
    }
  });

  app.patch("/api/workshops/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workshop = await storage.updateWorkshop(id, req.body);
      res.json(workshop);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update workshop" });
    }
  });

  app.delete("/api/workshops/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWorkshop(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete workshop" });
    }
  });

  // ==== Workshop Enrollments Routes ====
  app.get("/api/workshop-enrollments", isAuthenticated, async (req, res) => {
    try {
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : null;
      const enrollments = memberId 
        ? await storage.getWorkshopEnrollmentsByMember(memberId)
        : await storage.getWorkshopEnrollments();
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workshop enrollments" });
    }
  });

  app.post("/api/workshop-enrollments", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertWorkshopEnrollmentSchema.parse(req.body);
      const enrollment = await storage.createWorkshopEnrollment(validatedData);
      
      const workshop = await storage.getWorkshop(enrollment.workshopId);
      if (workshop) {
        await storage.updateWorkshop(workshop.id, {
          currentEnrollment: (workshop.currentEnrollment || 0) + 1,
        });
      }
      
      res.status(201).json(enrollment);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create workshop enrollment" });
    }
  });

  app.patch("/api/workshop-enrollments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const enrollment = await storage.updateWorkshopEnrollment(id, req.body);
      res.json(enrollment);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update workshop enrollment" });
    }
  });

  app.delete("/api/workshop-enrollments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const enrollment = await storage.getWorkshopEnrollment(id);
      
      if (enrollment) {
        const workshop = await storage.getWorkshop(enrollment.workshopId);
        if (workshop && workshop.currentEnrollment && workshop.currentEnrollment > 0) {
          await storage.updateWorkshop(workshop.id, {
            currentEnrollment: workshop.currentEnrollment - 1,
          });
        }
      }
      
      await storage.deleteWorkshopEnrollment(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete workshop enrollment" });
    }
  });

  // ==== Workshop Attendances Routes ====
  app.get("/api/workshop-attendances", isAuthenticated, async (req, res) => {
    try {
      const attendances = await storage.getWorkshopAttendances();
      res.json(attendances);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workshop attendances" });
    }
  });

  app.post("/api/workshop-attendances", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertWorkshopAttendanceSchema.parse(req.body);
      const attendance = await storage.createWorkshopAttendance(validatedData);
      res.status(201).json(attendance);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create workshop attendance" });
    }
  });

  app.delete("/api/workshop-attendances/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWorkshopAttendance(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete workshop attendance" });
    }
  });

  // ==== Enrollments Routes ====
  app.get("/api/enrollments", isAuthenticated, async (req, res) => {
    try {
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : null;
      const enrollments = memberId 
        ? await storage.getEnrollmentsByMember(memberId)
        : await storage.getEnrollments();
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
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : null;
      const memberships = memberId 
        ? await storage.getMembershipsByMemberId(memberId)
        : await storage.getMembershipsWithMembers();
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
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : null;
      const certificates = memberId 
        ? await storage.getMedicalCertificatesByMemberId(memberId)
        : await storage.getMedicalCertificatesWithMembers();
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
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : null;
      const payments = memberId 
        ? await storage.getPaymentsByMemberId(memberId)
        : await storage.getPaymentsWithMembers();
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
      const { barcode, accessType, notes: clientNotes, memberId: clientMemberId } = req.body;
      
      const isManualEntry = barcode?.startsWith('MANUAL-');
      
      // For manual entries, use memberId directly; for barcode entries, look up membership
      let membership = null;
      if (!isManualEntry && barcode) {
        membership = await storage.getMembershipByBarcode(barcode);
      }
      
      // If we have a memberId (manual or from barcode lookup), find the member's active membership
      const effectiveMemberId = clientMemberId || (membership?.memberId);
      if (!membership && effectiveMemberId) {
        const memberMemberships = await storage.getMembershipsByMemberId(effectiveMemberId);
        membership = memberMemberships.find(m => m.status === 'active') || memberMemberships[0];
      }
      
      let logData: any = {
        barcode: barcode || `MANUAL-${clientMemberId}`,
        accessType: accessType || "entry",
        membershipStatus: null,
        notes: clientNotes || null,
        memberId: effectiveMemberId || null,
      };

      if (isManualEntry && effectiveMemberId) {
        // Manual entry with known member
        if (membership) {
          const today = new Date();
          const expiry = new Date(membership.expiryDate);
          if (membership.status === "active" && expiry > today) {
            logData.membershipStatus = "active";
          } else if (expiry < today) {
            logData.membershipStatus = "expired";
          } else {
            logData.membershipStatus = membership.status;
          }
        } else {
          logData.membershipStatus = "manual";
        }
      } else if (membership) {
        logData.memberId = membership.memberId;
        const today = new Date();
        const expiry = new Date(membership.expiryDate);
        
        if (membership.status === "active" && expiry > today) {
          logData.membershipStatus = "active";
        } else if (expiry < today) {
          logData.membershipStatus = "expired";
          if (!clientNotes) logData.notes = "Tessera scaduta";
        } else {
          logData.membershipStatus = membership.status;
        }
      } else if (clientMemberId) {
        logData.membershipStatus = "manual";
      } else {
        logData.membershipStatus = "invalid";
        if (!clientNotes) logData.notes = "Barcode non trovato";
      }

      const log = await storage.createAccessLog(logData);
      
      // Return additional info for UI feedback
      let memberName = "Unknown";
      const memberIdToCheck = logData.memberId || clientMemberId;
      if (memberIdToCheck) {
        const member = await storage.getMember(memberIdToCheck);
        if (member) {
          memberName = `${member.firstName} ${member.lastName}`;
        }
      }

      res.status(201).json({
        ...log,
        valid: logData.membershipStatus === "active" || logData.membershipStatus === "manual",
        memberName,
        reason: clientNotes || logData.notes,
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

  // ==== Attendances Routes ====
  app.get("/api/attendances", isAuthenticated, async (req, res) => {
    try {
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : null;
      const attendances = memberId 
        ? await storage.getAttendancesByMember(memberId)
        : await storage.getAttendances();
      res.json(attendances);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendances" });
    }
  });

  app.get("/api/attendances/member/:memberId", isAuthenticated, async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const attendances = await storage.getAttendancesByMember(memberId);
      res.json(attendances);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch member attendances" });
    }
  });

  app.post("/api/attendances", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.createAttendance(validatedData);
      res.status(201).json(attendance);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create attendance" });
    }
  });

  app.delete("/api/attendances/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAttendance(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete attendance" });
    }
  });

  // ==== Location Routes (Countries, Provinces, Cities) ====
  app.get("/api/locations/countries", isAuthenticated, async (req, res) => {
    try {
      const countries = await storage.getCountries();
      res.json(countries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch countries" });
    }
  });

  app.get("/api/locations/provinces", isAuthenticated, async (req, res) => {
    try {
      const countryId = req.query.countryId ? parseInt(req.query.countryId as string) : undefined;
      const provinces = await storage.getProvinces(countryId);
      res.json(provinces);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch provinces" });
    }
  });

  app.get("/api/locations/cities/search", isAuthenticated, async (req, res) => {
    try {
      const search = req.query.q as string;
      if (!search || search.length < 3) {
        return res.json([]);
      }
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const cities = await storage.searchCities(search, limit);
      res.json(cities);
    } catch (error) {
      res.status(500).json({ message: "Failed to search cities" });
    }
  });

  app.get("/api/locations/cities/province/:provinceId", isAuthenticated, async (req, res) => {
    try {
      const provinceId = parseInt(req.params.provinceId);
      const cities = await storage.getCitiesByProvince(provinceId);
      res.json(cities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cities" });
    }
  });

  // ==== Custom Reports Routes ====
  app.get("/api/custom-reports", isAuthenticated, async (req, res) => {
    try {
      const reports = await storage.getCustomReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch custom reports" });
    }
  });

  app.get("/api/custom-reports/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const report = await storage.getCustomReport(id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch custom report" });
    }
  });

  app.post("/api/custom-reports", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCustomReportSchema.parse(req.body);
      const report = await storage.createCustomReport(validatedData);
      res.status(201).json(report);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create custom report" });
    }
  });

  app.patch("/api/custom-reports/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const report = await storage.updateCustomReport(id, req.body);
      res.json(report);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update custom report" });
    }
  });

  app.delete("/api/custom-reports/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCustomReport(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete custom report" });
    }
  });

  // Execute a custom report and return data
  app.post("/api/custom-reports/:id/execute", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const report = await storage.getCustomReport(id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Get data based on entity type
      let data: any[] = [];
      switch (report.entityType) {
        case 'members':
          data = await storage.getMembers();
          break;
        case 'courses':
          data = await storage.getCourses();
          break;
        case 'workshops':
          data = await storage.getWorkshops();
          break;
        case 'payments':
          data = await storage.getPaymentsWithMembers();
          break;
        case 'enrollments':
          data = await storage.getEnrollments();
          break;
        case 'attendances':
          data = await storage.getAttendances();
          break;
        case 'instructors':
          data = await storage.getInstructors();
          break;
        default:
          return res.status(400).json({ message: "Invalid entity type" });
      }

      // Apply filters if present
      if (report.filters && Array.isArray(report.filters)) {
        data = data.filter(item => {
          return report.filters!.every((filter: any) => {
            const value = item[filter.field];
            const filterValue = filter.value;
            switch (filter.operator) {
              case 'equals':
                return String(value) === String(filterValue);
              case 'contains':
                return String(value || '').toLowerCase().includes(String(filterValue).toLowerCase());
              case 'startsWith':
                return String(value || '').toLowerCase().startsWith(String(filterValue).toLowerCase());
              case 'endsWith':
                return String(value || '').toLowerCase().endsWith(String(filterValue).toLowerCase());
              case 'greaterThan':
                return Number(value) > Number(filterValue);
              case 'lessThan':
                return Number(value) < Number(filterValue);
              case 'isTrue':
                return value === true;
              case 'isFalse':
                return value === false;
              case 'isEmpty':
                return !value || value === '';
              case 'isNotEmpty':
                return value && value !== '';
              default:
                return true;
            }
          });
        });
      }

      // Apply sorting if present
      if (report.sortField) {
        data.sort((a, b) => {
          const aVal = a[report.sortField!];
          const bVal = b[report.sortField!];
          if (aVal === bVal) return 0;
          const comparison = aVal > bVal ? 1 : -1;
          return report.sortDirection === 'desc' ? -comparison : comparison;
        });
      }

      // Filter to selected fields only
      const selectedFields = report.selectedFields || [];
      if (selectedFields.length > 0) {
        data = data.map(item => {
          const filtered: any = {};
          selectedFields.forEach(field => {
            filtered[field] = item[field];
          });
          return filtered;
        });
      }

      res.json({ data, total: data.length });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to execute report" });
    }
  });

  // Get available fields for entity type
  app.get("/api/report-fields/:entityType", isAuthenticated, async (req, res) => {
    try {
      const entityType = req.params.entityType;
      
      const fieldDefinitions: Record<string, { name: string; type: string; label: string }[]> = {
        members: [
          { name: 'id', type: 'number', label: 'ID' },
          { name: 'firstName', type: 'string', label: 'Nome' },
          { name: 'lastName', type: 'string', label: 'Cognome' },
          { name: 'fiscalCode', type: 'string', label: 'Codice Fiscale' },
          { name: 'email', type: 'string', label: 'Email' },
          { name: 'phone', type: 'string', label: 'Telefono' },
          { name: 'mobile', type: 'string', label: 'Cellulare' },
          { name: 'dateOfBirth', type: 'date', label: 'Data Nascita' },
          { name: 'gender', type: 'string', label: 'Sesso' },
          { name: 'city', type: 'string', label: 'Città' },
          { name: 'province', type: 'string', label: 'Provincia' },
          { name: 'cardNumber', type: 'string', label: 'Numero Tessera' },
          { name: 'cardExpiryDate', type: 'date', label: 'Scadenza Tessera' },
          { name: 'hasMedicalCertificate', type: 'boolean', label: 'Certificato Medico' },
          { name: 'medicalCertificateExpiry', type: 'date', label: 'Scadenza Certificato' },
          { name: 'active', type: 'boolean', label: 'Attivo' },
        ],
        courses: [
          { name: 'id', type: 'number', label: 'ID' },
          { name: 'sku', type: 'string', label: 'SKU' },
          { name: 'name', type: 'string', label: 'Nome' },
          { name: 'description', type: 'string', label: 'Descrizione' },
          { name: 'price', type: 'number', label: 'Prezzo' },
          { name: 'maxParticipants', type: 'number', label: 'Max Partecipanti' },
          { name: 'dayOfWeek', type: 'string', label: 'Giorno' },
          { name: 'startTime', type: 'string', label: 'Orario Inizio' },
          { name: 'endTime', type: 'string', label: 'Orario Fine' },
          { name: 'startDate', type: 'date', label: 'Data Inizio' },
          { name: 'endDate', type: 'date', label: 'Data Fine' },
          { name: 'isActive', type: 'boolean', label: 'Attivo' },
        ],
        workshops: [
          { name: 'id', type: 'number', label: 'ID' },
          { name: 'name', type: 'string', label: 'Nome' },
          { name: 'description', type: 'string', label: 'Descrizione' },
          { name: 'price', type: 'number', label: 'Prezzo' },
          { name: 'maxCapacity', type: 'number', label: 'Max Capacità' },
          { name: 'startDate', type: 'date', label: 'Data Inizio' },
          { name: 'endDate', type: 'date', label: 'Data Fine' },
          { name: 'active', type: 'boolean', label: 'Attivo' },
        ],
        payments: [
          { name: 'id', type: 'number', label: 'ID' },
          { name: 'memberFirstName', type: 'string', label: 'Nome Cliente' },
          { name: 'memberLastName', type: 'string', label: 'Cognome Cliente' },
          { name: 'amount', type: 'number', label: 'Importo' },
          { name: 'type', type: 'string', label: 'Tipo' },
          { name: 'description', type: 'string', label: 'Descrizione' },
          { name: 'status', type: 'string', label: 'Stato' },
          { name: 'dueDate', type: 'date', label: 'Scadenza' },
          { name: 'paidDate', type: 'date', label: 'Data Pagamento' },
          { name: 'paymentMethod', type: 'string', label: 'Metodo' },
        ],
        enrollments: [
          { name: 'id', type: 'number', label: 'ID' },
          { name: 'memberFirstName', type: 'string', label: 'Nome Cliente' },
          { name: 'memberLastName', type: 'string', label: 'Cognome Cliente' },
          { name: 'courseId', type: 'number', label: 'ID Corso' },
          { name: 'status', type: 'string', label: 'Stato' },
          { name: 'enrollmentDate', type: 'date', label: 'Data Iscrizione' },
        ],
        attendances: [
          { name: 'id', type: 'number', label: 'ID' },
          { name: 'memberFirstName', type: 'string', label: 'Nome Cliente' },
          { name: 'memberLastName', type: 'string', label: 'Cognome Cliente' },
          { name: 'courseId', type: 'number', label: 'ID Corso' },
          { name: 'attendanceDate', type: 'date', label: 'Data Presenza' },
          { name: 'type', type: 'string', label: 'Tipo Check-in' },
        ],
        instructors: [
          { name: 'id', type: 'number', label: 'ID' },
          { name: 'firstName', type: 'string', label: 'Nome' },
          { name: 'lastName', type: 'string', label: 'Cognome' },
          { name: 'email', type: 'string', label: 'Email' },
          { name: 'phone', type: 'string', label: 'Telefono' },
          { name: 'specialization', type: 'string', label: 'Specializzazione' },
          { name: 'hourlyRate', type: 'number', label: 'Tariffa Oraria' },
          { name: 'active', type: 'boolean', label: 'Attivo' },
        ],
      };

      const fields = fieldDefinitions[entityType] || [];
      res.json(fields);
    } catch (error) {
      res.status(500).json({ message: "Failed to get report fields" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
