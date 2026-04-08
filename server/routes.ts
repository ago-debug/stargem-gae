import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isExternalDeploy } from "./auth";
import multer from "multer";
import Papa from "papaparse";
import { readSpreadsheet } from "./google-sheets";
import {
  getGoogleCalendarClient,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getGoogleAuthUrl,
  getGoogleOAuth2Client
} from "./google-calendar";
import { log } from "./vite";
import { db } from "./db";
import { sendSMS, sendEmail } from "./notifications";
import { getUnifiedActivitiesPreview, getUnifiedActivityById, getUnifiedEnrollmentsPreview } from "./services/unifiedBridge";
import { eq, desc, and, isNull, isNotNull } from "drizzle-orm";
import {
  insertMemberSchema,
  insertCategorySchema,
  insertClientCategorySchema,
  insertSubscriptionTypeSchema,
  insertStudioSchema,
  insertCourseSchema,
  insertMembershipSchema,
  insertMedicalCertificateSchema,
  insertPaymentMethodSchema,
  insertPaymentSchema,
  insertEnrollmentSchema,
  enrollments,
  insertAccessLogSchema,
  insertAttendanceSchema,
  insertCustomReportSchema,
  insertBookingServiceSchema,
  insertStudioBookingSchema,
  insertSeasonSchema,
  insertPriceListSchema,
  insertPriceListItemSchema,
  insertQuoteSchema,
  insertActivityStatusSchema,
  insertPaymentNoteSchema,
  insertEnrollmentDetailSchema,
  teamComments,
  insertTeamCommentSchema,
  teamNotes,
  insertTeamNoteSchema,
  insertBookingServiceCategorySchema,
  courses,
  bookingServices,
  insertCustomListSchema,
  insertCustomListItemSchema,
  auditLogs,
  activities,
  insertActivitySchema,
  globalEnrollments,
  insertGlobalEnrollmentSchema,
  insertMerchandisingCategorySchema,
  insertRentalCategorySchema,
  insertStrategicEventSchema,
  memberPackages,
  insertMemberPackageSchema
} from "@shared/schema";

// Configure multer for file uploads with increased limits for large CSV files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  }
});

// ==== Helper: Import Courses from Rows ====
async function importCoursesFromRows(
  dataRows: any[][],
  fieldMapping: Record<string, number | null>,
  importKey: string,
  storageInstance: typeof storage,
  autoCreateRecords: boolean = false
): Promise<{ imported: number; updated: number; skipped: number; errors: { row: number; message: string }[] }> {
  const getValue = (row: any[], colIdx: number): string => {
    if (colIdx < 0 || colIdx >= row.length) return "";
    return (row[colIdx] || "").toString().trim();
  };

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

  const parseTime = (val: string): string | undefined => {
    if (!val) return undefined;
    // Accept HH:MM, H:MM, HH:MM:SS or H:MM:SS format
    const match = val.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (match) {
      const h = match[1].padStart(2, '0');
      const m = match[2];
      if (parseInt(h) <= 23 && parseInt(m) <= 59) {
        return `${h}:${m}`;
      }
    }
    return undefined;
  };

  const parseNumber = (val: string): number | undefined => {
    if (!val) return undefined;
    const num = parseFloat(val.replace(',', '.'));
    return isNaN(num) ? undefined : num;
  };

  const parseInt2 = (val: string): number | undefined => {
    if (!val) return undefined;
    const num = parseInt(val);
    return isNaN(num) ? undefined : num;
  };

  const validRecurrenceTypes = ["weekly", "biweekly", "monthly", "once"];

  // Load lookup tables for resolving names to IDs
  const instructors = await storageInstance.getInstructors();
  const studios = await storageInstance.getStudios();
  const categories = await storageInstance.getCategories();

  // Create lookup maps (by name, case-insensitive)
  const instructorByName = new Map<string, number>();
  instructors.forEach(i => {
    const fullName = `${i.firstName} ${i.lastName}`.toLowerCase().trim();
    const reverseName = `${i.lastName} ${i.firstName}`.toLowerCase().trim();
    instructorByName.set(fullName, i.id);
    instructorByName.set(reverseName, i.id);
    // Also try just last name for common usage
    instructorByName.set(i.lastName.toLowerCase().trim(), i.id);
  });

  const studioByName = new Map<string, number>();
  studios.forEach(s => {
    studioByName.set(s.name.toLowerCase().trim(), s.id);
  });

  const categoryByName = new Map<string, number>();
  categories.forEach(c => {
    categoryByName.set(c.name.toLowerCase().trim(), c.id);
  });

  // Build index of existing courses
  const existingCourses = await storageInstance.getCourses();
  const existingByKey = new Map<string, number>();

  existingCourses.forEach(c => {
    let keyValue: string | undefined;
    if (importKey === "sku") {
      keyValue = c.sku?.toUpperCase().trim();
    } else {
      keyValue = c.name?.toLowerCase().trim();
    }
    if (keyValue) {
      existingByKey.set(keyValue, c.id);
    }
  });

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    try {
      const courseData: any = { active: true };

      for (const [dbField, colIdx] of Object.entries(fieldMapping)) {
        if (colIdx === null || colIdx === undefined || colIdx < 0) continue;

        let value = getValue(row, colIdx as number);
        if (!value) continue;

        // Handle field types
        if (dbField === "price") {
          courseData[dbField] = parseNumber(value)?.toString();
        } else if (dbField === "maxCapacity") {
          courseData[dbField] = parseInt2(value);
        } else if (dbField === "dayOfWeek") {
          const DAYS_MAP: Record<string, string> = {
            "LUNEDI": "LUN", "LUNEDÌ": "LUN", "MONDAY": "LUN",
            "MARTEDI": "MAR", "MARTEDÌ": "MAR", "TUESDAY": "MAR",
            "MERCOLEDI": "MER", "MERCOLEDÌ": "MER", "WEDNESDAY": "MER",
            "GIOVEDI": "GIO", "GIOVEDÌ": "GIO", "THURSDAY": "GIO",
            "VENERDI": "VEN", "VENERDÌ": "VEN", "FRIDAY": "VEN",
            "SABATO": "SAB", "SATURDAY": "SAB",
            "DOMENICA": "DOM", "SUNDAY": "DOM",
            "0": "DOM", "1": "LUN", "2": "MAR", "3": "MER", "4": "GIO", "5": "VEN", "6": "SAB"
          };
          const normalized = value.toUpperCase().trim();
          if (DAYS_MAP[normalized]) {
            courseData[dbField] = DAYS_MAP[normalized];
          } else {
            // Fallback for 3-letter abbreviations
            const short = normalized.substring(0, 3);
            if (["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"].includes(short)) {
              courseData[dbField] = short;
            } else {
              courseData[dbField] = value; // Keep as is if unknown
            }
          }
        } else if (dbField === "startTime" || dbField === "endTime") {
          courseData[dbField] = parseTime(value);
        } else if (dbField === "recurrenceType") {
          const rt = value.toLowerCase();
          if (validRecurrenceTypes.includes(rt)) {
            courseData[dbField] = rt;
          }
        } else if (dbField === "startDate" || dbField === "endDate") {
          courseData[dbField] = parseDate(value);
        } else if (dbField === "sku") {
          courseData[dbField] = value.toUpperCase().trim();
        } else if (dbField === "instructorName") {
          // Resolve instructor by name
          const lookupKey = value.toLowerCase().trim();
          let instructorId = instructorByName.get(lookupKey);

          if (!instructorId && autoCreateRecords && value) {
            const parts = value.trim().split(/\s+/);
            const firstName = parts[0] || "Insegnante";
            const lastName = parts.slice(1).join(" ") || "Nuovo";
            try {
              const newInstructor = await storageInstance.createInstructor({ firstName, lastName, active: true });
              instructorId = newInstructor.id;
              instructorByName.set(lookupKey, instructorId);
              console.log(`[Import] Created missing instructor: "${value}"`);
            } catch (err) {
              console.error(`[Import] Failed to create instructor "${value}":`, err);
            }
          }

          if (instructorId) {
            courseData.instructorId = instructorId;
          } else {
            console.log(`[Import] Instructor not found: "${value}" (key: "${lookupKey}")`);
          }
        } else if (dbField === "secondaryInstructor1Name") {
          const lookupKey = value.toLowerCase().trim();
          const instructorId = instructorByName.get(lookupKey);
          if (instructorId) {
            courseData.secondaryInstructor1Id = instructorId;
          } else {
            console.log(`[Import] Secondary Instructor 1 not found: "${value}"`);
          }
        } else if (dbField === "secondaryInstructor2Name") {
          const lookupKey = value.toLowerCase().trim();
          const instructorId = instructorByName.get(lookupKey);
          if (instructorId) {
            courseData.secondaryInstructor2Id = instructorId;
          } else {
            console.log(`[Import] Secondary Instructor 2 not found: "${value}"`);
          }
        } else if (dbField === "studioName") {
          // Resolve studio by name
          const lookupKey = value.toLowerCase().trim();
          let studioId = studioByName.get(lookupKey);

          if (!studioId && autoCreateRecords && value) {
            try {
              const newStudio = await storageInstance.createStudio({ name: value, active: true });
              studioId = newStudio.id;
              studioByName.set(lookupKey, studioId);
              console.log(`[Import] Created missing studio: "${value}"`);
            } catch (err) {
              console.error(`[Import] Failed to create studio "${value}":`, err);
            }
          }

          if (studioId) {
            courseData.studioId = studioId;
          } else {
            console.log(`[Import] Studio not found: "${value}" (key: "${lookupKey}")`);
          }
        } else if (dbField === "categoryName") {
          // Resolve category by name
          const lookupKey = value.toLowerCase().trim();
          let categoryId = categoryByName.get(lookupKey);

          if (!categoryId && autoCreateRecords && value) {
            try {
              const newCategory = await storageInstance.createCategory({ name: value });
              categoryId = newCategory.id;
              categoryByName.set(lookupKey, categoryId);
              console.log(`[Import] Created missing category: "${value}"`);
            } catch (err) {
              console.error(`[Import] Failed to create category "${value}":`, err);
            }
          }

          if (categoryId) {
            courseData.categoryId = categoryId;
          } else {
            console.log(`[Import] Category not found: "${value}" (key: "${lookupKey}")`);
          }
        } else if (dbField === "active") {
          const b = value.toLowerCase();
          courseData[dbField] = b === "si" || b === "sì" || b === "yes" || b === "1" || b === "true";
        } else {
          courseData[dbField] = value;
        }
      }

      // Check required fields
      if (!courseData.name) {
        skipped++;
        continue;
      }

      // Get key value for duplicate check
      let keyValue: string | undefined;
      if (importKey === "sku") {
        keyValue = courseData.sku?.toUpperCase().trim();
      } else {
        keyValue = courseData.name?.toLowerCase().trim();
      }

      if (keyValue && existingByKey.has(keyValue)) {
        const existingId = existingByKey.get(keyValue)!;
        await storageInstance.updateCourse(existingId, courseData);
        updated++;
      } else {
        const newCourse = await storageInstance.createCourse(courseData);
        if (keyValue) {
          existingByKey.set(keyValue, newCourse.id);
        }
        imported++;
      }
    } catch (err: any) {
      console.error("[API Error] Caught explicitly:", err);
      errors.push({ row: i + 2, message: err.message });
      skipped++;
    }
  }

  return { imported, updated, skipped, errors: errors.slice(0, 20) };
}

// Helper function to import instructors from row data (shared by file and Google Sheets import)
async function importInstructorsFromRows(
  dataRows: any[][],
  fieldMapping: Record<string, number | null>,
  importKey: string,
  storageInstance: typeof storage,
  autoCreateRecords: boolean = false
): Promise<{ imported: number; updated: number; skipped: number; errors: { row: number; message: string }[] }> {
  const getValue = (row: any[], colIdx: number): string => {
    if (colIdx < 0 || colIdx >= row.length) return "";
    return (row[colIdx] || "").toString().trim();
  };

  const parseNumber = (val: string): string | undefined => {
    if (!val) return undefined;
    const num = parseFloat(val.replace(',', '.'));
    return isNaN(num) ? undefined : num.toString();
  };

  // Build index of existing instructors
  const existingInstructors = await storageInstance.getInstructors();
  const existingByEmail = new Map<string, number>();
  const existingByFullName = new Map<string, number>();
  const existingByPhone = new Map<string, number>();

  existingInstructors.forEach(i => {
    if (i.email) {
      existingByEmail.set(i.email.toLowerCase().trim(), i.id);
    }
    const fullName = `${i.firstName} ${i.lastName}`.toLowerCase().trim();
    existingByFullName.set(fullName, i.id);
    if (i.phone) {
      existingByPhone.set(i.phone.replace(/\s+/g, '').trim(), i.id);
    }
  });

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    try {
      const instructorData: any = { active: true };

      for (const [dbField, colIdx] of Object.entries(fieldMapping)) {
        if (colIdx === null || colIdx === undefined || colIdx < 0) continue;

        let value = getValue(row, colIdx as number);
        if (!value) continue;

        if (dbField === "hourlyRate") {
          instructorData[dbField] = parseNumber(value);
        } else if (dbField === "active") {
          const b = value.toLowerCase();
          instructorData[dbField] = b === "si" || b === "sì" || b === "yes" || b === "1" || b === "true";
        } else {
          instructorData[dbField] = value;
        }
      }

      // Check required fields
      if (!instructorData.firstName || !instructorData.lastName) {
        skipped++;
        continue;
      }

      // Get key value for duplicate check
      let existingId: number | undefined;
      if (importKey === "email" && instructorData.email) {
        existingId = existingByEmail.get(instructorData.email.toLowerCase().trim());
      } else if (importKey === "fullName") {
        const fullName = `${instructorData.firstName} ${instructorData.lastName}`.toLowerCase().trim();
        existingId = existingByFullName.get(fullName);
      } else if (importKey === "phone" && instructorData.phone) {
        existingId = existingByPhone.get(instructorData.phone.replace(/\s+/g, '').trim());
      }

      if (existingId) {
        await storageInstance.updateInstructor(existingId, instructorData);
        updated++;
      } else {
        const newInstructor = await storageInstance.createInstructor(instructorData);
        // Update lookup maps
        if (instructorData.email) {
          existingByEmail.set(instructorData.email.toLowerCase().trim(), newInstructor.id);
        }
        const fullName = `${instructorData.firstName} ${instructorData.lastName}`.toLowerCase().trim();
        existingByFullName.set(fullName, newInstructor.id);
        if (instructorData.phone) {
          existingByPhone.set(instructorData.phone.replace(/\s+/g, '').trim(), newInstructor.id);
        }
        imported++;
      }
    } catch (err: any) {
      console.error("[API Error] Caught explicitly:", err);
      errors.push({ row: i + 2, message: err.message });
      skipped++;
    }
  }

  return { imported, updated, skipped, errors: errors.slice(0, 20) };
}

import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

// ==== SEEDING CATEGORIE PARTECIPANTI ====
async function seedParticipantCategories() {
  try {
    const existingCats = await storage.getClientCategories();
    // Default categories requested by the user
    const requiredCats = ["Non Tesserato", "Staff/Insegnanti", "Team", "Tesserato"];

    for (const name of requiredCats) {
      const exists = existingCats.some(c => c.name.toLowerCase() === name.toLowerCase());
      if (!exists) {
        log(`Seeding Participant Category: ${name}`);
        await storage.createClientCategory({ name });
      }
    }
  } catch (err) {
    console.error("Failed to seed participant categories:", err);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const { db } = await import("./db");
  const { sql } = await import("drizzle-orm");

  // Prevent missing column crash on early access by running a soft migration
  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN last_session_duration INT DEFAULT 0`);
  } catch (e) {
    // Column already exists
  }

  // Seed database
  await seedParticipantCategories();

  // Setup authentication
  setupAuth(app);

  const isAdmin = (req: any, res: Response, next: NextFunction) => {
    if (req.user && (req.user.role === 'admin' || (req.user.permissions && req.user.permissions["*"] === "write"))) {
      return next();
    }
    res.status(403).json({ message: "Accesso negato: solo amministratori." });
  };

  const checkPermission = (uiPath: string, level: 'read' | 'write' = 'read') => {
    return (req: any, res: Response, next: NextFunction) => {
      const user = req.user;
      if (!user) {
        console.log(`[AUTH] Permission Denied: No user for ${req.url}`);
        return res.status(401).json({ message: "Non autenticato" });
      }

      if (user.role === 'admin') {
        // console.log(`[AUTH] Permission Granted: Admin status for ${req.url}`);
        return next();
      }

      const perms = user.permissions || {};
      const userLevel = perms[uiPath];

      const granted = (perms["*"] === "write") ||
        (level === 'read' && perms["*"] === "read") ||
        (userLevel === 'write') ||
        (level === 'read' && userLevel === 'read');

      if (granted) {
        return next();
      }

      console.log(`[AUTH] Permission Denied: User ${user.username} (role: ${user.role}) attempted ${level} on ${uiPath} (${req.url}) but has perms:`, perms);
      res.status(403).json({ message: `Accesso negato: richiesto permesso di ${level} per ${uiPath}.` });
    };
  };

  
  // ==== Global Activity Interceptor ====
  app.use("/api", (req, res, next) => {
    // We only care about modifications (POST, PATCH, PUT, DELETE)
    if (['GET', 'OPTIONS', 'HEAD'].includes(req.method)) {
      return next();
    }
    
    // Ignore pure login/logout because auth.ts already handles them
    if (req.path === '/login' || req.path === '/logout' || req.path.includes('/presence')) {
      return next();
    }

    // Capture the original send to intercept the response
    const originalSend = res.send;
    res.send = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        try {
          const action = req.method === 'POST' ? 'CREATE' : req.method === 'DELETE' ? 'DELETE' : 'UPDATE';
          const segments = req.path.split('/').filter(Boolean);
          const entityType = segments[0] || 'system';
          const entityIdStr = segments[1] || undefined;
          
          let details = undefined;
          if (req.method !== 'DELETE' && req.body && Object.keys(req.body).length > 0) {
             // Redact sensitive stuff if needed, but for now we just dump req.body
             const safeBody = { ...req.body };
             delete safeBody.password;
             details = safeBody;
          }
          
          // Fire and forget
          storage.logActivity({
            userId: req.user.id,
            action,
            entityType,
            entityId: entityIdStr,
            details
          }).catch(e => console.error("Interceptor log error:", e));
        } catch (err) {
          console.error("Error in activity interceptor:", err);
        }
      }
      return originalSend.call(this, body);
    };
    next();
  });

  // ==== Google Calendar Helpers ====
  const getGlobalCalendarId = () => process.env.GOOGLE_CALENDAR_ID || 'primary';
  const TIMEZONE = 'Europe/Rome';

  const formatGoogleEvent = (title: string, date: Date | string, startTime: string, endTime: string, description?: string) => {
    const dStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return {
      summary: title,
      description: description || '',
      start: {
        dateTime: `${dStr}T${startTime}:00`,
        timeZone: TIMEZONE,
      },
      end: {
        dateTime: `${dStr}T${endTime}:00`,
        timeZone: TIMEZONE,
      },
    };
  };

  const syncStudioBookingToGoogle = async (booking: any) => {
    try {
      const studio = await storage.getStudio(booking.studioId);
      const service = booking.serviceId ? await storage.getBookingService(booking.serviceId) : null;

      let title = booking.title || 'Prenotazione';
      if (booking.memberFirstName && booking.memberLastName) {
        title = `${title} - ${booking.memberFirstName} ${booking.memberLastName}`;
      }
      if (studio) title = `[${studio.name}] ${title}`;

      const event = formatGoogleEvent(
        title,
        booking.bookingDate,
        booking.startTime,
        booking.endTime,
        `Servizio: ${service?.name || 'N/A'}\nNote: ${booking.description || ''}`
      );

      const calendarId = studio?.googleCalendarId || getGlobalCalendarId();

      if (booking.googleEventId) {
        await updateCalendarEvent(booking.googleEventId, event, calendarId);
      } else {
        const newEvent = await createCalendarEvent(event, calendarId);
        if (newEvent.id) {
          await storage.updateStudioBooking(booking.id, { googleEventId: newEvent.id });
        }
      }
    } catch (e) {
      console.error("Failed to sync booking to Google Calendar:", e);
    }
  };

  const deleteStudioBookingFromGoogle = async (googleEventId: string | null, studioId: number) => {
    if (!googleEventId) return;
    try {
      const studio = await storage.getStudio(studioId);
      const calendarId = studio?.googleCalendarId || getGlobalCalendarId();
      await deleteCalendarEvent(googleEventId, calendarId);
    } catch (e) {
      console.error("Failed to delete booking from Google Calendar:", e);
    }
  };

  const deleteCourseFromGoogle = async (googleEventId: string | null, studioId: number) => {
    if (!googleEventId) return;
    try {
      const studio = await storage.getStudio(studioId);
      const calendarId = studio?.googleCalendarId || getGlobalCalendarId();
      await deleteCalendarEvent(googleEventId, calendarId);
    } catch (e) {
      console.error("Failed to delete course from Google Calendar:", e);
    }
  };

  const syncCourseToGoogle = async (course: any) => {
    // For courses (weekly recurring), it's more complex. 
    // For now, let's sync them as single events on their next occurrence or 
    // just ignore for a first pass if it's too risky.
    // However, the user asked for "google calendar", so classes should likely be there.
    try {
      const studio = await storage.getStudio(course.studioId);
      const instructor = await storage.getInstructor(course.instructorId);

      let title = `Corso: ${course.name}`;
      if (studio) title = `[${studio.name}] ${title}`;
      if (instructor) title += ` (${instructor.firstName} ${instructor.lastName})`;

      // This is a simplification: syncing only the first occurrence or a placeholder
      // In a real app we'd use RRULE for recurrence.
      const event: any = formatGoogleEvent(
        title,
        course.startDate || new Date(),
        course.startTime,
        course.endTime,
        course.description
      );

      // Add recurrence if weekly
      if (course.dayOfWeek) {
        // Map day IDs to Google RRULE days
        const dayMap: any = { 'LUN': 'MO', 'MAR': 'TU', 'MER': 'WE', 'GIO': 'TH', 'VEN': 'FR', 'SAB': 'SA', 'DOM': 'SU' };
        const gDay = dayMap[course.dayOfWeek];
        if (gDay) {
          event.recurrence = [`RRULE:FREQ=WEEKLY;BYDAY=${gDay}`];
        }
      }

      const calendarId = studio?.googleCalendarId || getGlobalCalendarId();

      if (course.googleEventId) {
        await updateCalendarEvent(course.googleEventId, event, calendarId);
      } else {
        const newEvent = await createCalendarEvent(event, calendarId);
        if (newEvent.id) {
          await storage.updateCourse(course.id, { googleEventId: newEvent.id });
        }
      }
    } catch (e) {
      console.error("Failed to sync course to Google Calendar:", e);
    }
  };


  // Helper to log user activities
  const logUserActivity = async (req: Request, action: string, entityType?: string, entityId?: string, details?: any) => {
    if (req.user) {
      try {
        await storage.logActivity({
          userId: (req.user as any).id,
          action,
          entityType: entityType || null,
          entityId: entityId || null,
          details: details ? details : null,
          ipAddress: req.ip || null,
        });
      } catch (err) {
        log(`Failed to log activity: ${err instanceof Error ? err.message : String(err)}`, "error");
      }
    }
  };

  // ==== Google Auth Routes ====
  app.get("/api/auth/google/url", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const url = await getGoogleAuthUrl();
      res.json({ url });
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const code = req.query.code as string;
    if (!code) return res.status(400).send("Codice mancante");

    try {
      const oauth2Client = getGoogleOAuth2Client();
      const { tokens } = await oauth2Client.getToken(code);

      if (tokens.refresh_token) {
        await storage.updateSystemConfig('google_refresh_token', tokens.refresh_token);
        res.send("<h1>Autenticazione completata!</h1><p>Puoi chiudere questa finestra.</p><script>window.setTimeout(() => window.close(), 2000);</script>");
      } else {
        res.send("<h1>Attenzione</h1><p>Non è stato ricevuto un Refresh Token. Se avevi già collegato l'account, prova a disconnettere l'app dalle impostazioni Google e riprova.</p>");
      }
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).send(error.message);
    }
  });

  app.get("/api/auth/google/status", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const refreshToken = await storage.getSystemConfig('google_refresh_token');
      res.json({
        connected: !!refreshToken?.value,
        method: refreshToken?.value ? 'Direct' : (process.env.REPLIT_CONNECTORS_HOSTNAME ? 'Connector' : 'None')
      });
    } catch (e: any) {
      console.error("[API Error] Caught explicitly:", e);
      res.status(500).json({ message: e.message });
    }
  });

  // Activity Logs Route
  app.get("/api/activity-logs", isAuthenticated, async (req, res) => {
    try {
      const logs = await storage.getUserActivityLogs(200);
      res.json(logs);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).send(error.message);
    }
  });

  // Latest Activity Route (for Sidebar Metadata)
  app.get("/api/latest-activity", isAuthenticated, async (req, res) => {
    try {
      const logs = await storage.getUserActivityLogs(1);
      res.json(logs[0] || null);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).send(error.message);
    }
  });
  // Admin DB Sync endpoint
  app.post("/api/admin/db-sync", isAuthenticated, async (req, res) => {
    try {
      log("Starting database synchronization (drizzle-kit push)...", "admin");
      const { stdout, stderr } = await execPromise("npx drizzle-kit push");
      log("Database synchronization completed.", "admin");
      res.json({ success: true, stdout, stderr });
    } catch (error: any) {
      log(`Database synchronization failed: ${error.message}`, "admin");
      res.status(500).json({
        success: false,
        message: "Failed to sync database",
        error: error.message,
        stderr: error.stderr
      });
    }
  });

  // Admin Seed Payment Methods
  app.post("/api/admin/seed-payment-methods", isAuthenticated, async (req, res) => {
    try {
      const existing = await storage.getPaymentMethods();
      if (existing.length > 0) {
        return res.json({ success: true, message: "Metodi già presenti", count: 0 });
      }

      const defaultMethods = [
        { name: "Contanti", description: "Pagamento in contanti" },
        { name: "Bonifico", description: "Bonifico Bancario" },
        { name: "POS/Carta", description: "Pagamento elettronico (Carta/Bancomat)" },
        { name: "Assegno", description: "Assegno Bancario/Circolare" }
      ];

      for (const m of defaultMethods) {
        await storage.createPaymentMethod(m as any);
      }

      log("Default payment methods seeded.", "admin");
      res.json({ success: true, count: defaultMethods.length });
    } catch (error: any) {
      log(`Seeding failed: ${error.message}`, "admin");
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ==========================================
  // CONFIGURAZIONE GLOBALE DEL CENTRO
  // ==========================================
  app.get("/api/config/center-hours", isAuthenticated, async (req, res) => {
    try {
      const config = await storage.getSystemConfig("center_operating_hours");
      if (config && config.value) {
        return res.json(JSON.parse(config.value));
      }
      // Valori di default fallback se non esiste 
      return res.json({ start: "07:30", end: "23:00", days: ["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"] });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/config/center-hours", isAuthenticated, async (req, res) => {
    try {
      const { start, end, days } = req.body;
      if (!start || !end || !Array.isArray(days)) {
        return res.status(400).json({ message: "Parametri incompleti" });
      }
      const valStr = JSON.stringify({ start, end, days });
      await storage.updateSystemConfig("center_operating_hours", valStr);
      res.json({ success: true, message: "Orari globali aggiornati con successo", config: { start, end, days } });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User Management Routes

  app.get("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Don't send passwords
      const safeUsers = users.map(u => {
        const { password, ...safe } = u;
        return safe;
      });
      res.json(safeUsers);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).send(error.message);
    }
  });

  app.post("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { username, password, firstName, lastName, email, role, phone, profileImageUrl } = req.body;
      if (!username || !password) {
        return res.status(400).send("Username e password obbligatori");
      }

      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).send("Username già esistente");
      }

      const { hashPassword } = await import("./auth");
      const hashedPassword = await hashPassword(password);

      const newUser = await storage.upsertUser({
        username,
        password: hashedPassword,
        firstName,
        lastName,
        email,
        phone,
        profileImageUrl,
        role: role || 'operator'
      } as any);

      const { password: _, ...safeUser } = newUser;
      res.status(201).json(safeUser);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).send(error.message);
    }
  });

  // User Profile
  app.patch("/api/users/profile", isAuthenticated, async (req, res) => {
    try {
      const { phone, profileImageUrl } = req.body;
      const userId = (req.user as any).id;
      
      const payload: any = {};
      if (phone !== undefined) payload.phone = phone;
      if (profileImageUrl !== undefined) payload.profileImageUrl = profileImageUrl;
      
      await storage.updateUser(userId, payload);
      const updatedUser = await storage.getUser(userId);
      const { password: _, ...safeUser } = updatedUser as any;
      
      res.json(safeUser);
    } catch (error: any) {
      console.error("[API Error] /api/users/profile", error);
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { firstName, lastName, email, role, phone, profileImageUrl } = req.body;
      const updatedUser = await storage.updateUser(req.params.id, {
        firstName,
        lastName,
        email,
        role,
        phone,
        profileImageUrl
      } as any);

      const { password: _, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).send(error.message);
    }
  });

  // User Presence Heartbeat
  app.post("/api/users/presence/heartbeat", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { db } = await import("./db");
      const { users } = await import("../shared/schema");
      const { sql, eq } = await import("drizzle-orm");

      const currentUserState = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const lastSeen = currentUserState[0]?.lastSeenAt;
      const isNewSession = !currentUserState[0]?.currentSessionStart || (lastSeen && (Date.now() - new Date(lastSeen).getTime()) > 20 * 60000);

      await db.update(users).set({
        lastSeenAt: sql`CURRENT_TIMESTAMP`,
        currentSessionStart: sql`
          CASE 
            WHEN current_session_start IS NULL THEN CURRENT_TIMESTAMP
            WHEN last_seen_at IS NULL THEN CURRENT_TIMESTAMP
            WHEN TIMESTAMPDIFF(SECOND, last_seen_at, CURRENT_TIMESTAMP) > 1200 THEN CURRENT_TIMESTAMP
            WHEN TIMESTAMPDIFF(SECOND, last_seen_at, CURRENT_TIMESTAMP) > 180 THEN DATE_ADD(current_session_start, INTERVAL TIMESTAMPDIFF(SECOND, last_seen_at, CURRENT_TIMESTAMP) SECOND)
            WHEN current_session_start > CURRENT_TIMESTAMP THEN CURRENT_TIMESTAMP
            ELSE current_session_start
          END
        `
      }).where(eq(users.id, userId));

      if (isNewSession && currentUserState[0]) {
        try {
          await storage.logActivity({
            userId,
            action: "LOGIN",
            ipAddress: req.ip || null,
            details: { username: currentUserState[0].username, note: "Session resumed" }
          });
        } catch (e) {
          console.error("Failed to log implicit login", e);
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User explicitly offline (e.g. browser closed or navigated away)
  app.post("/api/users/presence/offline", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { db } = await import("./db");
      const { users } = await import("../shared/schema");
      const { sql, eq } = await import("drizzle-orm");

      const currentUserState = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const start = currentUserState[0]?.currentSessionStart;
      const durationMins = start ? Math.round((Date.now() - new Date(start).getTime()) / 60000) : 0;

      // Al refresh o chiusura tab inviamo i minuti finali, ma NON distruggiamo 
      // brutalmente la sessione (currentSessionStart). Manteniamo la memoria intatta: 
      // il sistema backend deciderà di azzerarla solo se passano oltre 20 min dal lastSeenAt.
      await db.update(users).set({
        lastSeenAt: sql`CURRENT_TIMESTAMP`,
        lastSessionDuration: durationMins
      }).where(eq(users.id, userId));

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Active Users list (Returns all users so frontend can render offline ones as grey)
  app.get("/api/users/presence/active", isAuthenticated, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { users } = await import("../shared/schema");
      const { desc } = await import("drizzle-orm");

      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        currentSessionStart: users.currentSessionStart,
        lastSeenAt: users.lastSeenAt,
        lastSessionDuration: users.lastSessionDuration,
      })
      .from(users)
      .orderBy(desc(users.lastSeenAt));
      
      res.json(allUsers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/users/:id/password", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { password } = req.body;
      if (!password) {
        return res.status(400).send("Password obbligatoria");
      }

      const { hashPassword } = await import("./auth");
      const hashedPassword = await hashPassword(password);

      await storage.updateUser(req.params.id, { password: hashedPassword });
      res.json({ success: true, message: "Password updated successfully" });
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).send(error.message);
    }
  });

  app.delete("/api/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Don't allow deleting yourself
      if ((req.user as any).id === req.params.id) {
        return res.status(400).send("Non puoi eliminare il tuo stesso account");
      }

      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).send(error.message);
    }
  });

  // User Role Routes
  app.get("/api/roles", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const roles = await storage.getUserRoles();
      res.json(roles);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).send(error.message);
    }
  });

  app.post("/api/roles", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { name, description, permissions } = req.body;
      if (!name || !permissions) {
        return res.status(400).send("Nome e permessi sono obbligatori");
      }

      const existing = await storage.getUserRoleByName(name);
      if (existing) {
        return res.status(400).send("Il nome del ruolo esiste già");
      }

      const newRole = await storage.createUserRole({
        name,
        description,
        permissions
      });
      res.status(201).json(newRole);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/roles/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { id: bodyId, createdAt, updatedAt, ...roleUpdate } = req.body;

      const role = await storage.updateUserRole(id, roleUpdate);
      await logUserActivity(req, "UPDATE", "roles", id.toString(), { name: role.name });
      res.json(role);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).send(error.message);
    }
  });

  app.delete("/api/roles/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const role = await storage.getUserRole(id);
      if (role?.name === 'admin') {
        return res.status(400).send("Impossibile eliminare il ruolo di admin");
      }
      await storage.deleteUserRole(id);
      await logUserActivity(req, "DELETE", "roles", id.toString(), { name: role?.name });
      res.sendStatus(204);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).send(error.message);
    }
  });

  // App config endpoint (public)
  app.get('/api/config', (req, res) => {
    res.json({
      isExternalDeploy: true,
      authType: 'local',
    });
  });


  // Auth user endpoint
  app.get('/api/auth/user', isAuthenticated, (req, res) => {
    res.json(req.user);
  });

  // ==== Members Routes ====

  // CRM Profiling routes
  app.post("/api/crm/profile/recalculate-all", isAuthenticated, checkPermission("/anagrafica_a_lista", "write"), async (req, res) => {
    try {
      const { recalculateAllActiveMembers } = await import("./utils/crm-profiling");
      const updatedCount = await recalculateAllActiveMembers();
      await logUserActivity(req, "UPDATE", "crm_profiling", "all", { count: updatedCount });
      res.json({ success: true, updatedCount });
    } catch (error: any) {
      console.error("[API Error] Failed to recalculate CRM profiles:", error);
      res.status(500).json({ message: "Failed to recalculate profiles" });
    }
  });

  app.post("/api/crm/profile/:memberId/recalculate", isAuthenticated, checkPermission("/anagrafica_a_lista", "write"), async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const { calculateCrmProfileForMember } = await import("./utils/crm-profiling");
      const result = await calculateCrmProfileForMember(memberId);
      await logUserActivity(req, "UPDATE", "crm_profiling", memberId.toString(), { action: "manual_recalculation", result });
      
      const updatedMember = await storage.getMember(memberId);
      res.json(updatedMember);
    } catch (error: any) {
      console.error("[API Error] Failed to recalculate CRM profile for member:", error);
      res.status(500).json({ message: "Failed to recalculate profile" });
    }
  });

  app.post("/api/crm/profile/:memberId/override", isAuthenticated, checkPermission("/anagrafica_a_lista", "write"), async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const { level, reason, override } = req.body;
      
      const updatedMember = await storage.updateMember(memberId, {
        crmProfileLevel: level || null,
        crmProfileReason: reason || null,
        crmProfileOverride: override,
      } as any);
      
      await logUserActivity(req, "UPDATE", "crm_profiling", memberId.toString(), { level, reason });
      res.json(updatedMember);
    } catch (error: any) {
      console.error("[API Error] Failed to override CRM profile:", error);
      res.status(500).json({ message: "Failed to update profile override" });
    }
  });

  app.get("/api/members", isAuthenticated, checkPermission("/anagrafica_a_lista", "read"), async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 50;
      const search = req.query.search as string || "";
      const seasonFilter = req.query.season as string || "all";
      const statusFilter = req.query.status as string || "all";
      const genderFilter = req.query.gender as string || "all";
      const hasMedicalCertFilter = req.query.hasMedicalCert as string || "all";
      const isMinorFilter = req.query.isMinor as string || "all";
      const participantTypeFilter = req.query.participantType as string || "all";
      const hasCardFilter = req.query.hasCard as string || "all";
      const hasEntityCardFilter = req.query.hasEntityCard as string || "all";
      const hasEmailFilter = req.query.hasEmail as string || "all";
      const hasPhoneFilter = req.query.hasPhone as string || "all";
      const missingFiscalCodeFilter = req.query.missingFiscalCode as string || "all";
      const issuesFilter = req.query.issuesFilter as string || "all";

      console.log("Filters received in /api/members:", {
        search, seasonFilter, statusFilter, genderFilter, hasMedicalCertFilter, isMinorFilter, participantTypeFilter, hasCardFilter, hasEntityCardFilter, hasEmailFilter, hasPhoneFilter, missingFiscalCodeFilter, issuesFilter
      });

      // Always use paginated query for performance
      const result = await storage.getMembersPaginated(
        page, pageSize, search, seasonFilter, statusFilter, genderFilter,
        hasMedicalCertFilter, isMinorFilter, participantTypeFilter,
        hasCardFilter, hasEntityCardFilter, hasEmailFilter,
        hasPhoneFilter, missingFiscalCodeFilter, issuesFilter
      );
      res.json(result);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.get("/api/test-member/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const member = await storage.getMember(id);
      res.json(member);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/members/merge", isAuthenticated, checkPermission("/anagrafica_a_lista", "write"), async (req, res) => {
    try {
      const { primaryId, secondaryIds } = req.body;

      if (!primaryId || !secondaryIds || !Array.isArray(secondaryIds) || secondaryIds.length === 0) {
        return res.status(400).json({ message: "Parametri di fusione non validi" });
      }

      await storage.mergeMembers(primaryId, secondaryIds);
      await logUserActivity(req, "MERGE", "members", primaryId.toString(), {
        action: `Uniti ${secondaryIds.length} profili duplicati nel profilo principale`
      });

      res.json({ success: true, message: "Anagrafiche unite con successo" });
    } catch (error) {
      console.error("[API Error] Failed to merge members:", error);
      res.status(500).json({ message: "Errore durante l'unione dei contatti" });
    }
  });

  app.get("/api/members/duplicates", isAuthenticated, async (req, res) => {
    try {
      const duplicates = await storage.getDuplicateFiscalCodes();
      res.json(duplicates);
    } catch (error) {
      console.error("Error fetching duplicate fiscal codes:", error);
      res.status(500).json({ message: "Failed to fetch duplicate fiscal codes" });
    }
  });

  app.get("/api/members/duplicate-stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDuplicateStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching duplicate stats:", error);
      res.status(500).json({ message: "Failed to fetch duplicate stats" });
    }
  });

  app.get("/api/members/missing-data", isAuthenticated, async (req, res) => {
    try {
      const counts = await storage.getMissingDataCounts();
      res.json(counts);
    } catch (error) {
      console.error("Error fetching missing data counts:", error);
      res.status(500).json({ message: "Failed to fetch missing data counts" });
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

  app.get("/api/members/:id", isAuthenticated, checkPermission("/membro", "read"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const member = await storage.getMember(id);
      if (!member) {
        return res.status(404).json({ message: "Membro non trovato" });
      }
      res.json(member);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch member" });
    }
  });

  app.post("/api/members", isAuthenticated, checkPermission("/anagrafica_a_lista", "write"), async (req, res) => {
    try {
      const normalizeEmpty = (val: any): any => {
        if (val === "" || val === undefined) return null;
        if (typeof val === "string" && val.trim() === "") return null;
        return val;
      };
      const normalizedData: any = {};
      for (const [key, value] of Object.entries(req.body)) {
        if (key === 'photoUrl') {
          normalizedData[key] = value;
        } else {
          normalizedData[key] = normalizeEmpty(value);
        }
      }
      if (!normalizedData.firstName) normalizedData.firstName = "Sconosciuto";
      if (!normalizedData.lastName) normalizedData.lastName = "Sconosciuto";

      // Normalize fiscal code to uppercase
      if (normalizedData.fiscalCode) {
        normalizedData.fiscalCode = normalizedData.fiscalCode.toUpperCase().trim();
      }

      // Check for duplicate fiscal code
      // Comprehensive duplicate check (Name, Email, Phone, Fiscal Code)
      const duplicateCheck = await storage.checkDuplicateParticipant(normalizedData);
      if (duplicateCheck.isDuplicate) {
        return res.status(409).json({
          message: duplicateCheck.message,
          conflict: true
        });
      }

      if (req.user) {
        normalizedData.createdBy = req.user.username || 'System';
        normalizedData.updatedBy = req.user.username || 'System'; // Initialize updatedBy on creation as well
      }

      const member = await storage.createMember(normalizedData);
      await logUserActivity(req, "CREATE", "members", member.id.toString(), { name: `${member.firstName} ${member.lastName}` });
      res.status(201).json(member);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to create member" });
    }
  });

  app.patch("/api/members/:id", isAuthenticated, checkPermission("/anagrafica_a_lista", "write"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Handle instructor intercept
      if (id >= 1000000) {
        const realId = id - 1000000;
        const { firstName, lastName, email, phone } = req.body;

        const instructorUpdate: any = {};
        if (firstName !== undefined) instructorUpdate.firstName = firstName;
        if (lastName !== undefined) instructorUpdate.lastName = lastName;
        if (email !== undefined) instructorUpdate.email = email;
        if (phone !== undefined) instructorUpdate.phone = phone;

        // Instructors don't have separate PATCH yet, keep current code if minimal
        if (!instructorUpdate.firstName && !instructorUpdate.lastName) {
          // If no name fields are provided, we might not need to update
          // Or handle as an error if name is mandatory
        }

        // Comprehensive duplicate check for instructors (Name, Email, Phone, Fiscal Code)
        // Note: Instructors don't have fiscalCode in the current model, but this function handles it.
        const duplicateCheck = await storage.checkDuplicateParticipant(instructorUpdate, realId + 1000000);
        if (duplicateCheck.isDuplicate) {
          return res.status(409).json({
            message: duplicateCheck.message,
            conflict: true
          });
        }

        const updatedInstructor = await storage.updateInstructor(realId, instructorUpdate);
        await logUserActivity(req, "UPDATE", "instructors", realId.toString(), { name: `${updatedInstructor.firstName} ${updatedInstructor.lastName}` });

        // Return simulated Member response
        const fakeMember = await storage.getMember(id);
        return res.json(fakeMember);
      }

      const normalizeEmpty = (val: any): any => {
        if (val === "" || val === undefined) return null;
        if (typeof val === "string" && val.trim() === "") return null;
        return val;
      };
      const normalizedData: any = {};
      for (const [key, value] of Object.entries(req.body)) {
        if (key === 'photoUrl') {
          // Explicitly allow null/string for photoUrl
          normalizedData[key] = value;
        } else {
          normalizedData[key] = normalizeEmpty(value);
        }
      }

      // Normalize fiscal code to uppercase
      if (normalizedData.fiscalCode) {
        normalizedData.fiscalCode = normalizedData.fiscalCode.toUpperCase().trim();
      }

      // Comprehensive duplicate check (Name, Email, Phone, Fiscal Code)
      const duplicateCheck = await storage.checkDuplicateParticipant(normalizedData, id);
      if (duplicateCheck.isDuplicate) {
        return res.status(409).json({
          message: duplicateCheck.message,
          conflict: true
        });
      }

      if (req.user) {
        normalizedData.updatedBy = req.user.username || 'System';
      }

      const updatedMember = await storage.updateMember(id, normalizedData);
      await logUserActivity(req, "UPDATE", "members", id.toString(), { name: `${updatedMember.firstName} ${updatedMember.lastName}` });
      res.json(updatedMember);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to update member" });
    }
  });

  app.delete("/api/members/:id", isAuthenticated, checkPermission("/anagrafica_a_lista", "write"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Handle instructor deletion intercept
      if (id >= 1000000) {
        const realId = id - 1000000;
        const instructorToDelete = await storage.getInstructor(realId);
        await storage.deleteInstructor(realId);
        await logUserActivity(req, "DELETE", "instructors", realId.toString(), { name: `${instructorToDelete?.firstName} ${instructorToDelete?.lastName}` });
        return res.status(204).send();
      }

      const memberToDelete = await storage.getMember(id);
      await storage.deleteMember(id);
      await logUserActivity(req, "DELETE", "members", id.toString(), { name: `${memberToDelete?.firstName} ${memberToDelete?.lastName}` });
      res.status(204).send();
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
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
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch member relationships" });
    }
  });

  app.get("/api/members/:memberId/children", isAuthenticated, async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const children = await storage.getMemberChildren(memberId);
      res.json(children);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch member children" });
    }
  });

  app.post("/api/member-relationships", isAuthenticated, async (req, res) => {
    try {
      const relationship = await storage.createMemberRelationship(req.body);
      await logUserActivity(req, "CREATE", "member_relationships", relationship.id.toString(), { member1: relationship.memberId, member2: relationship.relatedMemberId, type: relationship.relationshipType });
      res.status(201).json(relationship);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to create member relationship" });
    }
  });

  app.delete("/api/member-relationships/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMemberRelationship(id);
      await logUserActivity(req, "DELETE", "member_relationships", id.toString());
      res.status(204).send();
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to delete member relationship" });
    }
  });

  // ==== Google Sheets Import Route ====
  app.post("/api/members/import-google-sheets", isAuthenticated, async (req, res) => {
    try {
      // Google Sheets non disponibile su deploy esterni
      if (isExternalDeploy()) {
        return res.status(503).json({
          message: "Google Sheets non disponibile su questo server. Usa l'importazione CSV."
        });
      }

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

          const memberData: any = {
            firstName: firstName || "Sconosciuto",
            lastName: lastName || "Sconosciuto",
            fiscalCode: fiscalCode || null,
            email: getValue(colEmail) || null,
            phone: getValue(colPhone) || null,
            mobile: getValue(colMobile) || null,
            dateOfBirth: parseDate(getValue(colDateOfBirth)) ? new Date(parseDate(getValue(colDateOfBirth))!) : null,
            placeOfBirth: getValue(colPlaceOfBirth) || null,
            gender: gender || null,
            streetAddress: getValue(colStreet) || null,
            city: getValue(colCity) || null,
            province: getValue(colProvince).toUpperCase().substring(0, 2) || null,
            postalCode: getValue(colPostalCode) || null,
            cardNumber: getValue(colCardNumber) || null,
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
          console.error("[API Error] Caught explicitly:", err);
          errors.push(`Row ${i + 2}: ${err.message}`);
          skipped++;
        }
      }

      await logUserActivity(req, "IMPORT", "members", undefined, { source: "Google Sheets", imported, updated, skipped, errors: errors.length });
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

  // ==== Google Sheets Preview Headers (for custom mapping) ====
  app.post("/api/google-sheets/preview-headers", isAuthenticated, async (req, res) => {
    try {
      // Google Sheets non disponibile su deploy esterni
      if (isExternalDeploy()) {
        return res.status(503).json({
          message: "Google Sheets non disponibile su questo server. Usa l'importazione CSV."
        });
      }

      const { spreadsheetId, range = "A1:Z1000" } = req.body;

      if (!spreadsheetId) {
        return res.status(400).json({ message: "spreadsheetId è obbligatorio" });
      }

      // Read first 5 rows for preview - use the range as-is if provided, otherwise default
      const previewRange = range || "A1:Z5";
      console.log("[Google Sheets Preview] Range:", previewRange);
      const rows = await readSpreadsheet(spreadsheetId, previewRange);
      console.log("[Google Sheets Preview] Rows count:", rows.length);
      console.log("[Google Sheets Preview] First row:", JSON.stringify(rows[0]?.slice(0, 5)));

      if (rows.length < 1) {
        return res.status(400).json({ message: "Nessun dato trovato nel foglio" });
      }

      // First row contains headers
      const headers = rows[0].map((h: string, i: number) => ({
        index: i,
        name: (h || `Colonna ${i + 1}`).toString().trim(),
        originalName: h || ""
      }));

      console.log("[Google Sheets Preview] Headers parsed:", headers.slice(0, 5));

      // Sample data (first 3 data rows)
      const sampleData = rows.slice(1, 4).map(row =>
        row.map((cell: any) => (cell || "").toString().trim())
      );

      console.log("[Google Sheets Preview] Sample data row 1:", JSON.stringify(sampleData[0]?.slice(0, 5)));
      console.log("[Google Sheets Preview] Rows 1-3 raw:", rows.slice(1, 4).map(r => r?.slice(0, 3)));

      res.json({
        success: true,
        headers,
        sampleData,
        totalColumns: headers.length
      });
    } catch (error: any) {
      console.error("Google Sheets preview error:", error);
      res.status(500).json({ message: error.message || "Errore lettura Google Sheets" });
    }
  });

  // ==== Google Sheets Import with Custom Mapping ====
  app.post("/api/google-sheets/import-mapped", isAuthenticated, async (req, res) => {
    try {
      // Google Sheets non disponibile su deploy esterni
      if (isExternalDeploy()) {
        return res.status(503).json({
          message: "Google Sheets non disponibile su questo server. Usa l'importazione CSV."
        });
      }

      const {
        spreadsheetId,
        range = "A1:Z1000",
        fieldMapping,  // { dbField: sheetColumnIndex }
        importKey = "fiscalCode",  // Which field to use as unique key
        entityType = "members",  // "members" or "courses"
        limit = 500,
        autoCreateRecords = false
      } = req.body;

      if (!spreadsheetId) {
        return res.status(400).json({ message: "spreadsheetId è obbligatorio" });
      }

      if (!fieldMapping || Object.keys(fieldMapping).length === 0) {
        return res.status(400).json({ message: "Mappatura campi richiesta" });
      }

      const rows = await readSpreadsheet(spreadsheetId, range);

      if (rows.length < 2) {
        return res.status(400).json({ message: "Nessun dato trovato nel foglio" });
      }

      const dataRows = rows.slice(1, Math.min(rows.length, limit + 1));

      // Handle courses import
      if (entityType === "courses") {
        const result = await importCoursesFromRows(dataRows, fieldMapping, importKey, storage, autoCreateRecords);
        await logUserActivity(req, "IMPORT", "courses", undefined, { source: "Google Sheets (mapped)", ...result });
        return res.json({
          success: true,
          ...result,
          total: dataRows.length,
        });
      }

      // Handle instructors import
      if (entityType === "instructors") {
        const result = await importInstructorsFromRows(dataRows, fieldMapping, importKey, storage, autoCreateRecords);
        await logUserActivity(req, "IMPORT", "instructors", undefined, { source: "Google Sheets (mapped)", ...result });
        return res.json({
          success: true,
          ...result,
          total: dataRows.length,
        });
      }

      // Helper functions
      const getValue = (row: any[], colIdx: number): string => {
        if (colIdx < 0 || colIdx >= row.length) return "";
        return (row[colIdx] || "").toString().trim();
      };

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

      const parseGender = (val: string): string | undefined => {
        const g = val.toUpperCase();
        if (g === "M" || g === "MASCHIO" || g === "MALE") return "M";
        if (g === "F" || g === "FEMMINA" || g === "FEMALE") return "F";
        return undefined;
      };

      // Date fields that need parsing
      const dateFields = ["dateOfBirth", "cardIssueDate", "cardExpiryDate", "entityCardIssueDate",
        "entityCardExpiryDate", "medicalCertificateExpiry"];

      const booleanFields = ["active", "hasMedicalCertificate", "isMinor"];

      // Load lookup tables for resolving names
      const clientCategories = await storage.getClientCategories();
      const catByName = new Map<string, number>(clientCategories.map(c => [c.name.toLowerCase().trim(), c.id]));

      const subscriptionTypes = await storage.getSubscriptionTypes();
      const subByName = new Map<string, number>(subscriptionTypes.map(s => [s.name.toLowerCase().trim(), s.id]));

      // Build existing members index based on chosen key
      const existingMembers = await storage.getMembers();
      const existingByKey = new Map<string, number>();

      existingMembers.forEach(m => {
        let keyValue: string | undefined;
        switch (importKey) {
          case "fiscalCode": keyValue = m.fiscalCode?.toUpperCase() || undefined; break;
          case "email": keyValue = m.email?.toLowerCase() || undefined; break;
          case "cardNumber": keyValue = m.cardNumber || undefined; break;
          case "entityCardNumber": keyValue = m.entityCardNumber || undefined; break;
          case "mobile": keyValue = m.mobile || undefined; break;
          case "phone": keyValue = m.phone || undefined; break;
          default: keyValue = m.fiscalCode?.toUpperCase() || undefined;
        }
        if (keyValue) {
          existingByKey.set(keyValue, m.id);
        }
      });

      let imported = 0;
      let updated = 0;
      let skipped = 0;
      const errors: { row: number; message: string }[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        try {
          const memberData: any = { active: true };

          // Map each field from the sheet
          for (const [dbField, colIdx] of Object.entries(fieldMapping as Record<string, any>)) {
            if (colIdx === null || colIdx === undefined || (colIdx as any) < 0) continue;

            let value = getValue(row, colIdx as number);
            if (!value) continue;

            // Handle special field types
            if (dbField === "gender") {
              memberData[dbField] = parseGender(value) || null;
            } else if (dateFields.includes(dbField)) {
              memberData[dbField] = parseDate(value) || null;
            } else if (booleanFields.includes(dbField)) {
              const v = value.toLowerCase();
              memberData[dbField] = v === "si" || v === "sì" || v === "yes" || v === "true" || v === "1";
            } else if (dbField === "fiscalCode") {
              memberData[dbField] = value.toUpperCase();
            } else if (dbField === "province") {
              memberData[dbField] = value.toUpperCase().substring(0, 2);
            } else if (dbField === "clientCategoryName") {
              const lookupKey = value.toLowerCase().trim();
              let catId = catByName.get(lookupKey);
              if (!catId && autoCreateRecords && value) {
                try {
                  const newCat = await storage.createClientCategory({ name: value });
                  catId = newCat.id;
                  catByName.set(lookupKey, catId);
                  console.log(`[Import] Created missing client category: "${value}"`);
                } catch (err) {
                  console.error(`[Import] Failed to create client category "${value}":`, err);
                }
              }
              if (catId) memberData.categoryId = catId;
            } else if (dbField === "subscriptionTypeName") {
              const lookupKey = value.toLowerCase().trim();
              let subId = subByName.get(lookupKey);
              if (!subId && autoCreateRecords && value) {
                try {
                  const newSub = await storage.createSubscriptionType({ name: value, active: true });
                  subId = newSub.id;
                  subByName.set(lookupKey, subId);
                  console.log(`[Import] Created missing subscription type: "${value}"`);
                } catch (err) {
                  console.error(`[Import] Failed to create subscription type "${value}":`, err);
                }
              }
              if (subId) memberData.subscriptionTypeId = subId;
            } else {
              memberData[dbField] = value || null;
            }
          }

          // Check required fields
          if (!memberData.firstName && !memberData.lastName) {
            skipped++;
            continue;
          }
          memberData.firstName = memberData.firstName || "Sconosciuto";
          memberData.lastName = memberData.lastName || "Sconosciuto";

          // Ensure nulls for other fields if not set
          memberData.fiscalCode = memberData.fiscalCode || null;
          memberData.email = memberData.email || null;
          memberData.phone = memberData.phone || null;
          memberData.mobile = memberData.mobile || null;
          memberData.streetAddress = memberData.streetAddress || null;
          memberData.city = memberData.city || null;
          memberData.province = memberData.province || null;
          memberData.postalCode = memberData.postalCode || null;
          memberData.cardNumber = memberData.cardNumber || null;
          memberData.entityCardNumber = memberData.entityCardNumber || null;

          // Get key value for duplicate check
          let keyValue: string | undefined;
          switch (importKey) {
            case "fiscalCode": keyValue = memberData.fiscalCode?.toUpperCase(); break;
            case "email": keyValue = memberData.email?.toLowerCase(); break;
            case "cardNumber": keyValue = memberData.cardNumber; break;
            case "entityCardNumber": keyValue = memberData.entityCardNumber; break;
            case "mobile": keyValue = memberData.mobile; break;
            case "phone": keyValue = memberData.phone; break;
            default: keyValue = memberData.fiscalCode?.toUpperCase();
          }

          if (keyValue && existingByKey.has(keyValue)) {
            const existingId = existingByKey.get(keyValue)!;
            await storage.updateMember(existingId, memberData);
            updated++;
          } else {
            const newMember = await storage.createMember(memberData);
            if (keyValue) {
              existingByKey.set(keyValue, newMember.id);
            }
            imported++;
          }
        } catch (err: any) {
          console.error("[API Error] Caught explicitly:", err);
          errors.push({ row: i + 2, message: err.message });
          skipped++;
        }
      }

      await logUserActivity(req, "IMPORT", "members", undefined, { source: "Google Sheets (mapped)", imported, updated, skipped, errors: errors.length });
      res.json({
        success: true,
        imported,
        updated,
        skipped,
        total: dataRows.length,
        errors: errors.slice(0, 20),
      });
    } catch (error: any) {
      console.error("Google Sheets mapped import error:", error);
      res.status(500).json({ message: error.message || "Errore importazione Google Sheets" });
    }
  });


  // WorkshopCategories Routes
  // SundayCategories Routes
  // TrainingCategories Routes
  // IndividualLessonCategories Routes
  // CampusCategories Routes
  // RecitalCategories Routes
  // VacationCategories Routes
  // FreeTrials Routes
  // Trainings Routes
  // IndividualLessons Routes
  // CampusActivities Routes
  // Recitals Routes
  // VacationStudies Routes
  // ==== Participant Types Routes ====
  app.get("/api/participant-types", isAuthenticated, async (req, res) => {
    try {
      const types = await storage.getParticipantTypes();
      res.json(types);
    } catch (error) {
      console.error("[API Error] Failed to fetch participant types:", error);
      res.status(500).json({ message: "Failed to fetch participant types" });
    }
  });

  app.post("/api/participant-types", isAuthenticated, async (req, res) => {
    try {
      const newType = await storage.createParticipantType(req.body);
      res.status(201).json(newType);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/participant-types/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedType = await storage.updateParticipantType(id, req.body);
      res.json(updatedType);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/participant-types/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteParticipantType(id);
      res.status(204).end();
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ==== Activity Statuses Routes ====
  app.get("/api/activity-statuses", isAuthenticated, async (req, res) => {
    try {
      const statuses = await storage.getActivityStatuses();
      res.json(statuses);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch activity statuses" });
    }
  });

  app.post("/api/activity-statuses", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertActivityStatusSchema.parse(req.body);
      const status = await storage.createActivityStatus(validatedData);
      await logUserActivity(req, "CREATE", "activity_statuses", status.id.toString(), { name: status.name });
      res.status(201).json(status);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to create activity status" });
    }
  });

  app.patch("/api/activity-statuses/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const status = await storage.updateActivityStatus(id, req.body);
      await logUserActivity(req, "UPDATE", "activity_statuses", id.toString(), { name: status.name });
      res.json(status);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to update activity status" });
    }
  });

  app.delete("/api/activity-statuses/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const statusToDelete = await storage.getActivityStatus(id);
      if (statusToDelete) {
        await logUserActivity(req, "DELETE", "activity_statuses", id.toString(), { name: statusToDelete.name });
      }
      await storage.deleteActivityStatus(id);
      res.status(204).end();
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to delete activity status" });
    }
  });

  // ==== Categories Routes ====
  app.get("/api/categories", isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      await logUserActivity(req, "CREATE", "categories", category.id.toString(), { name: category.name });
      res.status(201).json(category);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to create category" });
    }
  });

  app.patch("/api/categories/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.updateCategory(id, req.body);
      await logUserActivity(req, "UPDATE", "categories", id.toString(), { name: category.name });
      res.json(category);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryToDelete = await storage.getCategory(id);
      await storage.deleteCategory(id);
      await logUserActivity(req, "DELETE", "categories", id.toString(), { name: categoryToDelete?.name });
      res.status(204).send();
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // ==== Client Categories Routes ====
  app.get("/api/client-categories", isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getClientCategories();
      res.json(categories);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch client categories" });
    }
  });

  app.post("/api/client-categories", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertClientCategorySchema.parse(req.body);
      const category = await storage.createClientCategory(validatedData);
      await logUserActivity(req, "CREATE", "client_categories", category.id.toString(), { name: category.name });
      res.status(201).json(category);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to create client category" });
    }
  });

  app.patch("/api/client-categories/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.updateClientCategory(id, req.body);
      await logUserActivity(req, "UPDATE", "client_categories", id.toString(), { name: category.name });
      res.json(category);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to update client category" });
    }
  });

  app.delete("/api/client-categories/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryToDelete = await storage.getClientCategory(id);
      await storage.deleteClientCategory(id);
      await logUserActivity(req, "DELETE", "client_categories", id.toString(), { name: categoryToDelete?.name });
      res.status(204).send();
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to delete client category" });
    }
  });

  // ==== Subscription Types Routes ====
  app.get("/api/subscription-types", isAuthenticated, async (req, res) => {
    try {
      const types = await storage.getSubscriptionTypes();
      res.json(types);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch subscription types" });
    }
  });

  app.post("/api/subscription-types", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSubscriptionTypeSchema.parse(req.body);
      const subscriptionType = await storage.createSubscriptionType(validatedData);
      await logUserActivity(req, "CREATE", "subscription_types", subscriptionType.id.toString(), { name: subscriptionType.name });
      res.status(201).json(subscriptionType);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to create subscription type" });
    }
  });

  app.patch("/api/subscription-types/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subscriptionType = await storage.updateSubscriptionType(id, req.body);
      await logUserActivity(req, "UPDATE", "subscription_types", id.toString(), { name: subscriptionType.name });
      res.json(subscriptionType);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to update subscription type" });
    }
  });

  app.delete("/api/subscription-types/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subscriptionTypeToDelete = await storage.getSubscriptionType(id);
      await storage.deleteSubscriptionType(id);
      await logUserActivity(req, "DELETE", "subscription_types", id.toString(), { name: subscriptionTypeToDelete?.name });
      res.status(204).send();
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to delete subscription type" });
    }
  });

  // ==== Instructors Routes ====
  app.get("/api/instructors", isAuthenticated, async (req, res) => {
    try {
      const instructors = await storage.getInstructors();
      res.json(instructors);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch instructors" });
    }
  });

  app.post("/api/instructors", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMemberSchema.parse(req.body);
      const instructor = await storage.createInstructor(validatedData);
      await logUserActivity(req, "CREATE", "instructors", instructor.id.toString(), { name: instructor.firstName + " " + instructor.lastName });
      res.status(201).json(instructor);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to create instructor" });
    }
  });

  app.patch("/api/instructors/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const instructor = await storage.updateInstructor(id, req.body);
      await logUserActivity(req, "UPDATE", "instructors", id.toString(), { name: instructor.firstName + " " + instructor.lastName });
      res.json(instructor);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to update instructor" });
    }
  });

  app.delete("/api/instructors/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const instructorToDelete = await storage.getInstructor(id);
      await storage.deleteInstructor(id);
      await logUserActivity(req, "DELETE", "instructors", id.toString(), { name: instructorToDelete?.firstName + " " + instructorToDelete?.lastName });
      res.status(204).send();
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to delete instructor" });
    }
  });

  // ==== Studios Routes ====
  app.get("/api/studios", isAuthenticated, async (req, res) => {
    try {
      const studios = await storage.getStudios();
      res.json(studios);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch studios" });
    }
  });

  app.post("/api/studios", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertStudioSchema.parse(req.body);
      const studio = await storage.createStudio(validatedData);
      await logUserActivity(req, "CREATE", "studios", studio.id.toString(), { name: studio.name });
      res.status(201).json(studio);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to create studio" });
    }
  });

  app.patch("/api/studios/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const studio = await storage.updateStudio(id, req.body);
      res.json(studio);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to update studio" });
    }
  });

  app.delete("/api/studios/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteStudio(id);
      res.status(204).send();
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to delete studio" });
    }
  });

  // ==== Courses Routes ====
  app.get("/api/courses", isAuthenticated, checkPermission("/corsi", "read"), async (req, res) => {
    try {
      const seasonId = req.query.seasonId && req.query.seasonId !== "all" ? parseInt(req.query.seasonId as string) : null;
      const activityType = req.query.activityType ? (req.query.activityType as string) : undefined;
      let coursesList;
        const activeSeason = await storage.getActiveSeason();
        const targetSeasonId = req.query.seasonId === "all" ? null : (seasonId || activeSeason?.id);

        if (targetSeasonId) {
          const allCourses = await storage.getCourses(activityType); // Fetch all to include legacy NULLs
          coursesList = allCourses.filter(c => {
            const effSeasonId = c.seasonId || activeSeason?.id;
            return effSeasonId === targetSeasonId;
          });
        } else {
          coursesList = await storage.getCourses(activityType);
        }
      res.json(coursesList);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.post("/api/courses", isAuthenticated, checkPermission("/corsi", "write"), async (req, res) => {
    try {
      const validatedData = insertCourseSchema.parse(req.body);
      const force = req.query.force === 'true' || req.body.force === true;

      if (!force && validatedData.studioId && validatedData.startDate && validatedData.startTime && validatedData.endTime) {
        const conflict = await storage.checkStudioConflict(
          validatedData.studioId!,
          validatedData.startDate!,
          validatedData.startTime!,
          validatedData.endTime!,
          undefined,
          undefined,
          validatedData.seasonId || undefined
        );
        if (conflict) {
          const conflictTypeLabel =
            conflict.type === 'course' ? 'corso' :
              conflict.type === 'booking' ? 'prenotazione' :
                conflict.type === 'workshop' ? 'workshop' :
                  'orario di chiusura';

          const message = conflict.type === 'operating_hours'
            ? `Attenzione: ${conflict.name}. Vuoi forzare il salvataggio?`
            : `Conflitto rilevato: lo slot è già occupato da un ${conflictTypeLabel} (${conflict.name}). Vuoi forzare il salvataggio?`;

          return res.status(409).json({
            message,
            conflict
          });
        }
      }

      const course = await storage.createCourse(validatedData);

      // Integrazioni Prenotazioni (Auto-Enroll & Notify)
      const notifyMessage = `Conferma prenotazione: ${course.name} - Inizio: ${course.startDate || req.body.startDate || ''} alle ${course.startTime || ''}`;
      if (req.body.member1Id) {
        const m1 = await storage.getMember(req.body.member1Id);
        if (m1) {
           await storage.createEnrollment({ courseId: course.id, memberId: m1.id, status: 'active', startDate: course.startDate || new Date() } as any);
           if (req.body.notifySms && m1.phone) await sendSMS({ to: m1.phone, message: notifyMessage });
           if (req.body.notifyEmail && m1.email) await sendEmail({ to: m1.email, subject: "Conferma Prenotazione", message: notifyMessage });
        }
      }
      if (req.body.member2Id) {
        const m2 = await storage.getMember(req.body.member2Id);
        if (m2) {
           await storage.createEnrollment({ courseId: course.id, memberId: m2.id, status: 'active', startDate: course.startDate || new Date() } as any);
           if (req.body.notifySms && m2.phone) await sendSMS({ to: m2.phone, message: notifyMessage });
           if (req.body.notifyEmail && m2.email) await sendEmail({ to: m2.email, subject: "Conferma Prenotazione", message: notifyMessage });
        }
      }

      // Decremento utilizzi pacchetti
      for (const key of ['packageSingle', 'packageCouple', 'packageGroup'] as const) {
        const pkgId = req.body[key];
        if (pkgId) {
          const pkg = await db.query.memberPackages.findFirst({ where: eq(memberPackages.id, parseInt(pkgId.toString())) });
          if (pkg) {
            await db.update(memberPackages).set({ usedUses: pkg.usedUses + 1 }).where(eq(memberPackages.id, pkg.id));
          }
        }
      }

      // Sync to Google Calendar (async)
      try {
        syncCourseToGoogle(course);
      } catch (err) {
        console.error("[API Error] Failed to sync to Google Calendar:", err);
      }
      await logUserActivity(req, "CREATE", "courses", course.id.toString(), { name: course.name });
      res.status(201).json(course);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to create course" });
    }
  });

  app.patch("/api/courses/:id", isAuthenticated, checkPermission("/corsi", "write"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCourseSchema.partial().parse(req.body);
      const force = req.query.force === 'true' || req.body.force === true;

      const existingCourse = await storage.getCourse(id);
      if (existingCourse && !force) {
        const studioId = validatedData.studioId !== undefined ? validatedData.studioId : existingCourse.studioId;
        const startDate = validatedData.startDate !== undefined ? validatedData.startDate : existingCourse.startDate;
        const startTime = validatedData.startTime !== undefined ? validatedData.startTime : existingCourse.startTime;
        const endTime = validatedData.endTime !== undefined ? validatedData.endTime : existingCourse.endTime;

        if (studioId && startDate && startTime && endTime) {
          const conflict = await storage.checkStudioConflict(
            studioId,
            startDate,
            startTime,
            endTime,
            undefined, // no booking ID
            id,        // current course ID
            (validatedData.seasonId ?? existingCourse.seasonId) || undefined
          );
          if (conflict) {
            const conflictTypeLabel =
              conflict.type === 'course' ? 'corso' :
                conflict.type === 'booking' ? 'prenotazione' :
                  conflict.type === 'workshop' ? 'workshop' :
                    'orario di chiusura';

            const message = conflict.type === 'operating_hours'
              ? `Attenzione: ${conflict.name}. Vuoi forzare il salvataggio?`
              : `Conflitto rilevato: lo slot è già occupato da un ${conflictTypeLabel} (${conflict.name}). Vuoi forzare il salvataggio?`;

            return res.status(409).json({
              message,
              conflict
            });
          }
        }
      }
      const course = await storage.updateCourse(id, validatedData);

      // Aggiorna enrollments se cambiano gli allievi
      const { member1Id, member2Id } = req.body;
      console.log("BODY:", req.body.member1Id, req.body.member2Id);
      if (member1Id !== undefined || member2Id !== undefined) {
        // Cancella enrollment esistenti
        await db.delete(enrollments)
          .where(eq(enrollments.courseId, id));
        
        // Reinserisci con i nuovi allievi
        if (member1Id && member1Id !== "none") {
          await db.insert(enrollments).values({
            courseId: id,
            memberId: parseInt(member1Id),
            seasonId: course.seasonId || 1,
          });
        }
        if (member2Id && member2Id !== "none") {
          await db.insert(enrollments).values({
            courseId: id,
            memberId: parseInt(member2Id),
            seasonId: course.seasonId || 1,
          });
        }
      }

      // Sync to Google Calendar (async)
      try {
        syncCourseToGoogle(course);
      } catch (err) {
        console.error("[API Error] Failed to sync to Google Calendar:", err);
      }
      await logUserActivity(req, "UPDATE", "courses", id.toString(), { name: course.name });
      res.json(course);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", isAuthenticated, checkPermission("/corsi", "write"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const course = await storage.getCourse(id);
      if (course?.googleEventId) {
        deleteCourseFromGoogle(course.googleEventId, course.studioId!);
      }
      await storage.deleteCourse(id);
      await logUserActivity(req, "DELETE", "courses", id.toString());
      res.sendStatus(204);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });



  // ==== Enrollments Routes ====
  app.get("/api/enrollments", isAuthenticated, checkPermission("/iscritti-corsi", "read"), async (req, res) => {
    try {
      if (req.query.courseId) {
        const courseId = parseInt(req.query.courseId as string);
        const result = await db.select({
          id: enrollments.id,
          memberId: enrollments.memberId,
          courseId: enrollments.courseId,
        })
        .from(enrollments)
        .where(eq(enrollments.courseId, courseId));
        return res.json(result);
      }

      const seasonId = req.query.seasonId ? parseInt(req.query.seasonId as string) : null;
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : null;
      const activityType = req.query.type as string | undefined;
      let enrollmentsList: any[] = [];

      if (memberId) {
        enrollmentsList = await storage.getEnrollmentsByMember(memberId);
      } else if (seasonId) {
        // Passa activityType per filtrare via LEFT JOIN su courses
        enrollmentsList = await storage.getEnrollmentsBySeason(seasonId, activityType);
      } else {
        const activeSeason = await storage.getActiveSeason();
        if (activeSeason) {
          enrollmentsList = await storage.getEnrollmentsBySeason(activeSeason.id, activityType);
        } else {
          enrollmentsList = await storage.getEnrollments();
        }
      }
      console.log(`[DEBUG] /api/enrollments activityType=${activityType} seasonId=${seasonId} memberId=${memberId} returning ${enrollmentsList.length} enrollments`);
      res.json(enrollmentsList);
    } catch (error) {
      console.error("[ERROR] Failed to fetch enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.post("/api/enrollments", isAuthenticated, checkPermission("/iscritti-corsi", "write"), async (req, res) => {
    try {
      const dataToValidate = { ...req.body };
      if (typeof dataToValidate.targetDate === 'string') {
        dataToValidate.targetDate = new Date(dataToValidate.targetDate);
      }
      
      if (!dataToValidate.seasonId) {
        const activeSeason = await storage.getActiveSeason();
        if (activeSeason) {
          dataToValidate.seasonId = activeSeason.id;
        }
      }

      const validatedData = insertEnrollmentSchema.parse(dataToValidate);
      const enrollment = await storage.createEnrollment(validatedData);

      // Update course current enrollment count
      const course = await storage.getCourse(enrollment.courseId);
      if (course) {
        await storage.updateCourse(course.id, {
          currentEnrollment: (course.currentEnrollment || 0) + 1,
        } as any);

        const isFreeTrial = validatedData.participationType === 'FREE_TRIAL';

        if (req.query.skipPayment !== 'true' && !isFreeTrial) {
          let paymentDesc = `Debito iscrizione corso: ${course.name}`;
          if (validatedData.participationType === 'PAID_TRIAL') {
            paymentDesc = `Debito Prova a Pagamento: ${course.name}`;
          } else if (validatedData.participationType === 'SINGLE_LESSON') {
            paymentDesc = `Debito Lezione Singola: ${course.name}`;
          }

          // CREATE AUTOMATIC DEBT (Pending Payment)
          await storage.createPayment({
            memberId: enrollment.memberId,
            enrollmentId: enrollment.id,
            amount: course.price || "0", // Fallback to course price until custom rate is established
            type: "course",
            description: paymentDesc,
            status: "pending",
            dueDate: new Date(),
            paidDate: null,
            transferConfirmationDate: null,
            createdById: (req.user as any).id,
          });
        }
      }

      res.status(201).json(enrollment);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to create enrollment" });
    }
  });

  app.patch("/api/enrollments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const enrollment = await storage.updateEnrollment(id, req.body);
      res.json(enrollment);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
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
          } as any);
        }

        // Crea audit log per l'eliminazione
        await storage.createAuditLog({
          action: "DELETE",
          entityType: "enrollments",
          entityId: id,
          performedBy: (req.user as any)?.username || "Sistema",
          details: JSON.stringify(enrollment)
        });
      }

      await storage.deleteEnrollment(id);
      res.status(204).send();
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to delete enrollment" });
    }
  });

  // ==== Member Packages Routes (Lezioni Individuali) ====
  app.get("/api/member-packages/:memberId", isAuthenticated, async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      if (isNaN(memberId)) return res.status(400).json({ message: "Invalid memberId" });
      const pkgs = await db.query.memberPackages.findMany({
        where: eq(memberPackages.memberId, memberId),
        orderBy: [desc(memberPackages.createdAt)],
      });
      res.json(pkgs);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/member-packages", isAuthenticated, async (req, res) => {
    try {
      const data = insertMemberPackageSchema.parse(req.body);
      const [result] = await db.insert(memberPackages).values(data);
      res.status(201).json({ id: result.insertId, ...data });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
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
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch memberships" });
    }
  });

  app.post("/api/memberships", isAuthenticated, async (req, res) => {
    try {
      let validatedData = insertMembershipSchema.parse(req.body);

      // --- MULTIPLEXER: Tessere Refactoring (Task 4) ---
      if (validatedData.membershipType && validatedData.seasonCompetence) {
        // [A] NEW PAYLOAD LOGIC (Strict Season Control)
        const { buildMembershipPayload } = await import("./utils/season");
        
        try {
          const payloadData = buildMembershipPayload(
            validatedData.memberId,
            validatedData.membershipType as "NUOVO" | "RINNOVO",
            validatedData.seasonCompetence as "CORRENTE" | "SUCCESSIVA",
            validatedData.issueDate ? new Date(validatedData.issueDate) : new Date(),
            validatedData.fee || 25
          );

          // Uniqueness check: One membership per member per season
          // Nota: La "Stagione Effettiva" viene identificata in modo univoco dal suo anno di fine (seasonEndYear).
          const existingMemberships = await storage.getMembershipsByMemberId(validatedData.memberId);
          const hasExistingForSeason = existingMemberships.some(m => m.seasonEndYear === payloadData.seasonEndYear);
          if (hasExistingForSeason) {
            return res.status(400).json({ message: `Errore: L'utente possiede già una tessera per la stagione sportiva ${payloadData.seasonStartYear}/${payloadData.seasonEndYear}.` });
          }

          // Merge generated fields back into validatedData
          Object.assign(validatedData, payloadData);
        } catch (error: any) {
          return res.status(400).json({ message: error.message });
        }
      } else {
        // [B] LEGACY PAYLOAD LOGIC (Fallback for untouched UIs)
        // Generate membership number automatically if not provided (Format: [memberId]-YYYY/YYYY+1)
        if (!validatedData.membershipNumber) {
          const currentDate = new Date();
          const year1 = currentDate.getFullYear();
          const year2 = year1 + 1;
          validatedData.membershipNumber = `${validatedData.memberId}-${year1}/${year2}`;
        }

        // Generate barcode if not provided
        if (!validatedData.barcode) {
          validatedData.barcode = validatedData.membershipNumber;
        }
      }

      const membership = await storage.createMembership(validatedData);

      // Aggiorniamo l'anagrafica del partecipante con le informazioni dell'Ente se presenti e il Metadata compatibile
      const { entityCardType, entityCardNumber, entityCardIssueDate, entityCardExpiryDate, nuovoRinnovo } = req.body;
      
      const tessereMetadataObj = {
          numero: membership.membershipNumber,
          dataScad: membership.expiryDate instanceof Date 
            ? membership.expiryDate.toISOString().split('T')[0] 
            : new Date(membership.expiryDate as string).toISOString().split('T')[0],
          pagamento: membership.issueDate instanceof Date 
            ? membership.issueDate.toISOString().split('T')[0] 
            : new Date(membership.issueDate as string).toISOString().split('T')[0],
          quota: membership.fee?.toString() || "25",
          nuovoRinnovo: nuovoRinnovo || "nuovo"
      };

      await storage.updateMember(membership.memberId, {
        ...(entityCardType && { entityCardType }),
        ...(entityCardNumber && { entityCardNumber }),
        ...(entityCardIssueDate && { entityCardIssueDate: new Date(entityCardIssueDate) }),
        ...(entityCardExpiryDate && { entityCardExpiryDate: new Date(entityCardExpiryDate) }),
        tessereMetadata: JSON.stringify(tessereMetadataObj)
      });

      if (membership.memberId && req.query.skipPayment !== 'true') {
        await storage.createPayment({
          memberId: membership.memberId,
          membershipId: membership.id,
          amount: membership.fee || "0",
          type: "membership",
          description: `Quota associativa (${nuovoRinnovo === 'rinnovo' ? 'Rinnovo' : 'Nuova'}): ${membership.membershipNumber}`,
          status: "pending",
          dueDate: new Date(),
          paidDate: null,
          transferConfirmationDate: null,
          createdById: (req.user as any).id,
        });
      }

      res.status(201).json(membership);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to create membership" });
    }
  });

  app.patch("/api/memberships/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const membership = await storage.updateMembership(id, req.body);
      res.json(membership);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to update membership" });
    }
  });

  app.delete("/api/memberships/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMembership(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
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
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch medical certificates" });
    }
  });

  app.post("/api/medical-certificates", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMedicalCertificateSchema.parse(req.body);
      const certificate = await storage.createMedicalCertificate(validatedData);
      res.status(201).json(certificate);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to create medical certificate" });
    }
  });

  app.patch("/api/medical-certificates/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const certificate = await storage.updateMedicalCertificate(id, req.body);
      res.json(certificate);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to update medical certificate" });
    }
  });

  app.delete("/api/medical-certificates/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMedicalCertificate(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to delete medical certificate" });
    }
  });

  // ==== Payment Methods Routes ====
  app.get("/api/payment-methods", isAuthenticated, async (req, res) => {
    try {
      const methods = await storage.getPaymentMethods();
      res.json(methods);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch payment methods" });
    }
  });

  app.post("/api/payment-methods", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPaymentMethodSchema.parse(req.body);
      const method = await storage.createPaymentMethod(validatedData);
      res.status(201).json(method);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to create payment method" });
    }
  });

  app.patch("/api/payment-methods/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const method = await storage.updatePaymentMethod(id, req.body);
      res.json(method);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to update payment method" });
    }
  });

  app.delete("/api/payment-methods/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePaymentMethod(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to delete payment method" });
    }
  });

  // ==== Payments Routes ====
  app.get("/api/payments", isAuthenticated, checkPermission("/pagamenti", "read"), async (req, res) => {
    try {
      const seasonId = req.query.seasonId ? parseInt(req.query.seasonId as string) : null;
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : null;

      let paymentsList;
      if (memberId) {
        paymentsList = await storage.getPaymentsByMemberId(memberId);
      } else if (seasonId) {
        paymentsList = await storage.getPaymentsBySeason(seasonId);
      } else {
        const activeSeason = await storage.getActiveSeason();
        if (activeSeason) {
          paymentsList = await storage.getPaymentsBySeason(activeSeason.id);
        } else {
          paymentsList = await storage.getPaymentsWithMembers();
        }
      }
      res.json(paymentsList);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", isAuthenticated, checkPermission("/pagamenti", "write"), async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);

      // Strict Validation: Prevent Orphan Payments
       const hasValidRelation =
        validatedData.enrollmentId ||
        validatedData.bookingId ||
        validatedData.membershipId;

      if (!hasValidRelation) {
        throw new Error("Salvataggio bloccato per sicurezza: Il pagamento non è associato ad alcuna attività, iscrizione o tesseramento. Seleziona prima un'attività (Corsi, Workshop, ecc.) da pagare.");
      }

      const payment = await storage.createPayment({
        ...validatedData,
        createdById: (req.user as any).id
      });
      res.status(201).json(payment);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to create payment" });
    }
  });

  app.patch("/api/payments/:id", isAuthenticated, checkPermission("/pagamenti", "write"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPaymentSchema.partial().parse(req.body);

      const payment = await storage.updatePayment(id, {
        ...validatedData,
        updatedById: (req.user as any).id
      });
      res.json(payment);
    } catch (error: any) {
      console.error("Error updating payment:", error);
      res.status(400).json({ message: error.message || "Failed to update payment" });
    }
  });

  app.delete("/api/payments/:id", isAuthenticated, checkPermission("/pagamenti", "write"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const payment = await storage.getPayment(id);
      if (payment) {
        // Crea audit log per l'eliminazione
        await storage.createAuditLog({
          action: "DELETE",
          entityType: "payments",
          entityId: id,
          performedBy: (req.user as any)?.username || "Sistema",
          details: JSON.stringify(payment)
        });
      }

      await storage.deletePayment(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting payment:", error);
      res.status(400).json({ message: error.message || "Failed to delete payment" });
    }
  });


  // ==== Maschera Generale Save Endpoint ====
  app.post("/api/maschera-generale/save", isAuthenticated, async (req, res) => {
    try {
      const { memberData, enrollments: enrollmentItems, payments: paymentItems } = req.body;

      if (!memberData) {
        return res.status(400).json({ message: "Dati anagrafica mancanti" });
      }

      // Map entity card data from JSON metadata backward into legacy database columns for unified generic tables
      if (memberData.tessereMetadata) {
        if (memberData.tessereMetadata.tesseraEnte) {
          memberData.entityCardNumber = memberData.tessereMetadata.tesseraEnte;
        }
        if (memberData.tessereMetadata.scadenzaTesseraEnte) {
          memberData.entityCardExpiryDate = new Date(memberData.tessereMetadata.scadenzaTesseraEnte);
        }
      }

      // 1. Upsert Member
      let member;
      if (memberData.id) {
        // Explicity update user by ID from the UI so changes to fiscalCode do not cause duplicate insertion errors
        memberData.updatedBy = (req.user as any)?.username || 'System';
        memberData.updatedAt = new Date();
        member = await storage.updateMember(memberData.id, memberData);
      } else if (memberData.fiscalCode) {
        const existingMember = await storage.getMemberByFiscalCode(memberData.fiscalCode);
        if (existingMember) {
          memberData.updatedBy = (req.user as any)?.username || 'System';
          memberData.updatedAt = new Date();
          member = await storage.updateMember(existingMember.id, memberData);
        } else {
          memberData.createdBy = (req.user as any)?.username || 'System';
          member = await storage.createMember(memberData);
        }
      } else {
        memberData.createdBy = (req.user as any)?.username || 'System';
        member = await storage.createMember(memberData);
      }

      // 1.5 Gestione Tesseramento Centrale + Storico
      if (memberData.tessereMetadata) {
          const quota = memberData.tessereMetadata.quota;
          const tesseraEnte = memberData.tessereMetadata.tesseraEnte;
          const membershipType = memberData.tessereMetadata.membershipType;
          const seasonCompetence = memberData.tessereMetadata.seasonCompetence;
          
          if (membershipType && seasonCompetence && memberData.tessereMetadata.pagamento) {
              // Create the new membership officially through the shared generator factory.
              const issueDate = new Date(memberData.tessereMetadata.pagamento);
              const { buildMembershipPayload } = await import("./utils/season");
              try {
                  const payloadData = buildMembershipPayload(
                      member.id,
                      membershipType as "NUOVO" | "RINNOVO",
                      seasonCompetence as "CORRENTE" | "SUCCESSIVA",
                      issueDate,
                      quota || 25
                  );
                  
                  if (tesseraEnte) {
                      payloadData.entityCardNumber = tesseraEnte;
                  }

                  // Uniqueness check: One membership per member per season
                  const existingMemberships = await storage.getMembershipsByMemberId(member.id);
                  const hasExistingForSeason = existingMemberships.some(m => m.seasonEndYear === payloadData.seasonEndYear);
                  if (!hasExistingForSeason) {
                      const newlyCreated = await storage.createMembership(payloadData);
                      
                      // INIEZIONE ATOMICA: Passiamo il membershipId direttamente al carrello acquisti frontend
                      if (paymentItems && Array.isArray(paymentItems)) {
                          const referenceKeyMatch = member.id?.toString() || memberData.fiscalCode;
                          const tesseraPayment = paymentItems.find(p => p.tempId === "membership_fee" && (p.referenceKey === referenceKeyMatch || !p.referenceKey));
                          if (tesseraPayment) {
                              tesseraPayment.membershipId = newlyCreated.id;
                          }
                      }
                  }
              } catch (error) {
                  console.error("Failed to dynamically create membership from Maschera Generale payload:", error);
              }
          } else if (quota || tesseraEnte) {
              const activeMemberships = await storage.getMembershipsByMemberId(member.id);
              // Find the primary active membership
              const currentMembership = activeMemberships?.find(m => 
                  !m.expiryDate || new Date(m.expiryDate) > new Date()
              );
              
              if (currentMembership) {
                  let needsUpdate = false;
                  const updates: Partial<any> = {};
                  
                  // Check if historical quota was missing but is now provided
                  if (quota && (!currentMembership.fee || currentMembership.fee.toString() === "0")) {
                      updates.fee = quota;
                      needsUpdate = true;
                  }
                  
                  // Check if historical entity card was missing but is now provided
                  if (tesseraEnte && !currentMembership.entityCardNumber) {
                      updates.entityCardNumber = tesseraEnte;
                      needsUpdate = true;
                  }
                  
                  if (needsUpdate) {
                      await storage.updateMembership(currentMembership.id, updates);
                  }
              }
          }
      }

      // 2. Process Enrollments and Payments
      const results = {
        member: member, // Return full member details for frontend audit updates
        memberId: member.id,
        enrollments: [] as any[],
        payments: [] as any[]
      };

      if (enrollmentItems && Array.isArray(enrollmentItems)) {
        for (const enrData of enrollmentItems) {
          try {
            let enrollment;
            let paymentLinkField = "enrollmentId";
            let createPayload = { ...enrData, memberId: member.id, details: enrData.details || [] };

            // Mappatura uniforme per STI, unifica tutte le logiche di enrData.tempId (attività silo precedenti) in participationType dove appropriato
            let participationType = undefined;
            if (enrData.tempId === "prove-pagamento") participationType = "prova_pagamento";
            if (enrData.tempId === "prove-gratuite") participationType = "prova_gratuita";
            if (enrData.tempId === "lezioni-singole") participationType = "lezione_singola";

            if (participationType) {
              enrollment = await storage.createEnrollment({ ...createPayload, participationType, courseId: enrData.courseId });
            } else {
              enrollment = await storage.createEnrollment({ ...createPayload, courseId: enrData.courseId });
            }
            paymentLinkField = "enrollmentId";
            results.enrollments.push(enrollment);

            // Find matching payment for this enrollment
            if (paymentItems && Array.isArray(paymentItems)) {
              // Note: enrData.tempId usually matches p.type (attivita)
              const matchingPaymentIndex = paymentItems.findIndex(p => p.courseId === enrData.courseId || p.tempId === enrData.tempId);
              if (matchingPaymentIndex !== -1 && !paymentItems[matchingPaymentIndex].processed) {
                const matchingPayment = paymentItems[matchingPaymentIndex];
                const payment = await storage.createPayment({
                  ...matchingPayment,
                  memberId: member.id,
                  [paymentLinkField]: enrollment.id,
                  createdById: (req.user as any).id,
                  paymentNoteLabels: matchingPayment.details?.paymentNotes || [],
                  enrollmentDetailLabels: matchingPayment.details?.enrollmentDetails || [],
                  quotaDescription: matchingPayment.details?.descrizioneQuota,
                  period: matchingPayment.details?.periodo,
                });
                results.payments.push(payment);
                paymentItems[matchingPaymentIndex].processed = true;
              }
            }
          } catch (e) {
            console.error("Error creating enrollment/payment in bulk save:", e);
          }
        }
      }

      // 3. Process standalone payments (without matching enrollments in this request)
      if (paymentItems && Array.isArray(paymentItems)) {
        for (const paymentData of paymentItems) {
          if (!paymentData.processed) {
            try {
              // Strict Validation: Prevent Orphan Payments
              const hasValidRelation =
                paymentData.enrollmentId ||
                paymentData.workshopEnrollmentId ||
                
                
                
                paymentData.sundayActivityEnrollmentId ||
                paymentData.trainingEnrollmentId ||
                paymentData.individualLessonEnrollmentId ||
                paymentData.campusEnrollmentId ||
                paymentData.recitalEnrollmentId ||
                paymentData.vacationStudyEnrollmentId ||
                paymentData.bookingId ||
                paymentData.membershipId;

              if (!hasValidRelation && paymentData.tempId !== "membership_fee") {
                // Ignore membership fees that didn't trigger full matching if quota was zero, etc.
                throw new Error("Salvataggio bloccato: Impossibile salvare un pagamento orfano senza alcuna attività associata.");
              }

              const payment = await storage.createPayment({
                ...paymentData,
                memberId: member.id,
                createdById: (req.user as any).id,
                paymentNoteLabels: paymentData.details?.paymentNotes || [],
                enrollmentDetailLabels: paymentData.details?.enrollmentDetails || [],
                quotaDescription: paymentData.details?.descrizioneQuota,
                period: paymentData.details?.periodo,
              });
              results.payments.push(payment);
              paymentData.processed = true;
            } catch (e) {
              console.error("Error creating standalone payment:", e);
            }
          }
        }
      }

      res.status(200).json(results);
    } catch (error: any) {
      console.error("Error in maschera-generale save:", error);
      res.status(500).json({ message: error.message || "Failed to save data" });
    }
  });



  // Keep existing routes below
  // ==== Access Logs Routes ====
  app.get("/api/access-logs", isAuthenticated, async (req, res) => {
    try {
      const logs = await storage.getAccessLogs();
      res.json(logs);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch access logs" });
    }
  });

  // ==== Audit Logs (Deletions) ====
  app.get("/api/audit-logs", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
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
      console.error("[API Error] Caught explicitly:", error);
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
      
      const currentMonthPayments = payments.filter(p => {
        if (!p.createdAt) return false;
        const createdDate = new Date(p.createdAt);
        return p.status === "paid" &&
          createdDate.getMonth() === currentMonth &&
          createdDate.getFullYear() === currentYear;
      });

      const monthlyRevenue = currentMonthPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      // Group revenue by operatore (staff member)
      const users = await storage.getUsers();
      const revenueMap = new Map<string, { amount: number, count: number, name: string, userId: string }>();
      
      currentMonthPayments.forEach(p => {
        if (!p.createdById) return;
        const user = users.find(u => u.id === p.createdById);
        if (!user) return;
        
        const existing = revenueMap.get(user.id) || { amount: 0, count: 0, name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username, userId: user.id };
        existing.amount += parseFloat(p.amount);
        existing.count += 1;
        revenueMap.set(user.id, existing);
      });

      const revenueByMember = Array.from(revenueMap.values()).sort((a, b) => b.amount - a.amount);

      const pendingPayments = payments.filter(p => p.status === "pending").length;
      const enrollments = await storage.getEnrollments();

      res.json({
        totalMembers: members.length,
        activeMemberships,
        activeCourses: courses.filter(c => c.active).length,
        totalEnrollments: enrollments.length,
        expiringThisWeek,
        monthlyRevenue,
        revenueByMember,
        pendingPayments,
      });
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/stats/alerts", isAuthenticated, async (req, res) => {
    try {
      const memberships = await storage.getMemberships();
      const certificates = await storage.getMedicalCertificates();
      const payments = await storage.getPayments();
      const courses = await storage.getCourses();

      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const nextTwoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

      const expiringCourses = courses.filter(c => {
        if (!c.active || !c.endDate) return false;
        const eDate = new Date(c.endDate);
        return eDate >= today && eDate <= nextTwoWeeks;
      });

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
        expiringCourses: expiringCourses.length,
        expiringWorkshops: 0,
      });
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
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
      console.error("[API Error] Caught explicitly:", error);
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
      console.error("[API Error] Caught explicitly:", error);
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

      // Bulk import for members
      if (type === 'members') {
        const membersToImport: any[] = [];

        for (let i = 0; i < parseResult.data.length; i++) {
          const row: any = parseResult.data[i];
          const memberData = {
            firstName: row['Nome'] || row['First Name'] || row['firstName'] || "Sconosciuto",
            lastName: row['Cognome'] || row['Last Name'] || row['lastName'] || "Sconosciuto",
            fiscalCode: row['Codice Fiscale'] || row['Fiscal Code'] || row['fiscalCode'] || null,
            email: row['Email'] || row['email'] || null,
            phone: row['Telefono'] || row['Phone'] || row['phone'] || null,
            dateOfBirth: row['Data Nascita'] || row['Date of Birth'] || row['dateOfBirth'] ? new Date(row['Data Nascita'] || row['Date of Birth'] || row['dateOfBirth']) : null,
            address: row['Indirizzo'] || row['Address'] || row['address'] || null,
            notes: row['Note'] || row['Notes'] || row['notes'] || null,
            active: true,
          };

          membersToImport.push(memberData);
        }

        if (membersToImport.length > 0) {
          try {
            const result = await storage.bulkCreateMembers(membersToImport);
            imported = result.imported;
            skipped += result.skipped;
          } catch (err: any) {
            console.error("Bulk import failed:", err);
            throw new Error("Importazione massiva fallita: " + err.message);
          }
        }
      } else {
        // Sequential import for courses and instructors
        for (let i = 0; i < parseResult.data.length; i++) {
          const row: any = parseResult.data[i];
          try {
            if (type === 'courses') {
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
                throw new Error("Cognome e Nome sono obbligatori");
              }

              await storage.createInstructor(instructorData);
              imported++;
            }
          } catch (error: any) {
            console.error("[API Error] Caught explicitly:", error);
            skipped++;
            errors.push({
              row: i + 2,
              message: error.message || "Errore sconosciuto",
            });
          }
        }
      }

      res.json({
        imported,
        skipped,
        errors: errors.slice(0, 50),
      });
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: error.message || "Failed to import data" });
    }
  });

  // ==== Google Sheets Import Route ====
  app.post("/api/import/google-sheets", isAuthenticated, async (req, res) => {
    try {
      // Google Sheets non disponibile su deploy esterni
      if (isExternalDeploy()) {
        return res.status(503).json({
          message: "Google Sheets non disponibile su questo server. Usa l'importazione CSV."
        });
      }

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
              dateOfBirth: rowData['Data di Nascita'] || rowData['Date of Birth'] || rowData['dateOfBirth'] ? new Date(rowData['Data di Nascita'] || rowData['Date of Birth'] || rowData['dateOfBirth']) : null,
              address: rowData['Indirizzo'] || rowData['Address'] || rowData['address'] || null,
              city: rowData['Città'] || rowData['City'] || rowData['city'] || null,
              zipCode: rowData['CAP'] || rowData['Zip Code'] || rowData['zipCode'] || null,
              taxCode: rowData['Codice Fiscale'] || rowData['Tax Code'] || rowData['taxCode'] || null,
              notes: rowData['Note'] || rowData['Notes'] || rowData['notes'] || null,
              active: true,
            };

            if (!memberData.firstName || !memberData.lastName) {
              throw new Error("Cognome e Nome sono obbligatori");
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
              throw new Error("Cognome e Nome sono obbligatori");
            }

            await storage.createInstructor(instructorData);
            imported++;
          }
        } catch (error: any) {
          console.error("[API Error] Caught explicitly:", error);
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
  app.get("/api/attendances", isAuthenticated, checkPermission("/iscritti-corsi", "read"), async (req, res) => {
    try {
      const seasonId = req.query.seasonId ? parseInt(req.query.seasonId as string) : null;
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : null;

      let attendancesList;
      if (memberId) {
        attendancesList = await storage.getAttendancesByMember(memberId);
      } else if (seasonId) {
        attendancesList = await storage.getAttendancesBySeason(seasonId);
      } else {
        const activeSeason = await storage.getActiveSeason();
        if (activeSeason) {
          attendancesList = await storage.getAttendancesBySeason(activeSeason.id);
        } else {
          attendancesList = await storage.getAttendances();
        }
      }
      res.json(attendancesList);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch attendances" });
    }
  });

  app.get("/api/attendances/member/:memberId", isAuthenticated, async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const attendances = await storage.getAttendancesByMember(memberId);
      res.json(attendances);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch member attendances" });
    }
  });

  app.post("/api/attendances", isAuthenticated, checkPermission("/iscritti-corsi", "write"), async (req, res) => {
    try {
      const validatedData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.createAttendance(validatedData);
      res.status(201).json(attendance);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to create attendance" });
    }
  });

  app.delete("/api/attendances/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAttendance(id);
      res.status(204).send();
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to delete attendance" });
    }
  });

  // ==== Payment Notes Routes ====
  app.get("/api/payment-notes", isAuthenticated, async (req, res) => {
    try {
      const notes = await storage.getPaymentNotes();
      res.json(notes);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch payment notes" });
    }
  });

  app.post("/api/payment-notes", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPaymentNoteSchema.parse(req.body);
      const note = await storage.createPaymentNote(validatedData);
      await logUserActivity(req, "CREATE", "payment_notes", note.id.toString(), { name: note.name });
      res.status(201).json(note);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to create payment note" });
    }
  });

  app.patch("/api/payment-notes/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const note = await storage.updatePaymentNote(id, req.body);
      await logUserActivity(req, "UPDATE", "payment_notes", id.toString(), { name: note.name });
      res.json(note);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to update payment note" });
    }
  });

  app.delete("/api/payment-notes/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const noteToDelete = await storage.getPaymentNote(id);
      if (noteToDelete) {
        await logUserActivity(req, "DELETE", "payment_notes", id.toString(), { name: noteToDelete.name });
      }
      await storage.deletePaymentNote(id);
      res.status(204).send();
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to delete payment note" });
    }
  });

  // ==== Enrollment Details Routes ====
  app.get("/api/enrollment-details", isAuthenticated, async (req, res) => {
    try {
      const details = await storage.getEnrollmentDetails();
      res.json(details);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch enrollment details" });
    }
  });

  app.post("/api/enrollment-details", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertEnrollmentDetailSchema.parse(req.body);
      const detail = await storage.createEnrollmentDetail(validatedData);
      await logUserActivity(req, "CREATE", "enrollment_details", detail.id.toString(), { name: detail.name });
      res.status(201).json(detail);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to create enrollment detail" });
    }
  });

  app.patch("/api/enrollment-details/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const detail = await storage.updateEnrollmentDetail(id, req.body);
      await logUserActivity(req, "UPDATE", "enrollment_details", id.toString(), { name: detail.name });
      res.json(detail);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to update enrollment detail" });
    }
  });

  app.delete("/api/enrollment-details/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const detailToDelete = await storage.getEnrollmentDetail(id);
      if (detailToDelete) {
        await logUserActivity(req, "DELETE", "enrollment_details", id.toString(), { name: detailToDelete.name });
      }
      await storage.deleteEnrollmentDetail(id);
      res.status(204).send();
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to delete enrollment detail" });
    }
  });

  // ==== Location Routes (Countries, Provinces, Cities) ====
  app.get("/api/locations/countries", isAuthenticated, async (req, res) => {
    try {
      const countries = await storage.getCountries();
      res.json(countries);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch countries" });
    }
  });

  app.get("/api/locations/provinces", isAuthenticated, async (req, res) => {
    try {
      const countryId = req.query.countryId ? parseInt(req.query.countryId as string) : undefined;
      const provinces = await storage.getProvinces(countryId);
      res.json(provinces);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
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
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to search cities" });
    }
  });

  app.get("/api/locations/cities/province/:provinceId", isAuthenticated, async (req, res) => {
    try {
      const provinceId = parseInt(req.params.provinceId);
      const cities = await storage.getCitiesByProvince(provinceId);
      res.json(cities);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch cities" });
    }
  });

  app.get(["/api/comuni/by-code/:code", "/api/locations/cities/by-code/:code"], isAuthenticated, async (req, res) => {
    try {
      const code = req.params.code;
      if (!code) return res.status(400).json({ message: "Code is required" });
      const city = await storage.getCityByIstatCode(code);
      if (!city) return res.status(404).json({ message: "City not found" });
      res.json(city);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch city by code" });
    }
  });

  // ==== Course Quotes Grid Q1C ====
  app.get("/api/course-quotes-grid", isAuthenticated, async (req, res) => {
    try {
      const { activityType } = req.query;
      const gridItems = await storage.getCourseQuotesGrid(activityType as string);
      res.json(gridItems);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch course quotes grid" });
    }
  });

  app.post("/api/course-quotes-grid/bulk", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const items = req.body;
      const { activityType } = req.query;
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "Expected an array of grid items" });
      }

      console.log(`[API Bulk Insert] ActivityType: ${activityType}, Items count: ${items.length}`);
      console.log(`[API Bulk Insert] Items payload: ${JSON.stringify(items.map(i => i.category), null, 2)}`);

      await storage.upsertCourseQuotesGridBulk(items, activityType as string);

      const verification = await storage.getCourseQuotesGrid(activityType as string);
      console.log(`[API Bulk Insert] Post-insert verification, DB has ${verification.length} rows for this activityType.`);

      res.json({ success: true, message: "Grid updated successfully" });
    } catch (error: any) {
      console.error("[API Error] Bulk Insert Failed:", error);
      if (error.issues) {
        console.error("Validation issues:", JSON.stringify(error.issues, null, 2));
      }
      res.status(500).json({ message: "Failed to update course quotes grid", error: error.message });
    }
  });

  // ==== Price Lists Routes ====
  app.get("/api/price-lists", isAuthenticated, async (req, res) => {
    try {
      const priceLists = await storage.getPriceLists();
      res.json(priceLists);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch price lists" });
    }
  });

  app.get("/api/price-lists/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const priceList = await storage.getPriceList(id);
      if (!priceList) {
        return res.status(404).json({ message: "Price list not found" });
      }
      res.json(priceList);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch price list" });
    }
  });

  app.get("/api/price-lists/:id/items", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const items = await storage.getPriceListItems(id);
      res.json(items);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch price list items" });
    }
  });

  app.post("/api/price-lists", isAuthenticated, async (req, res) => {
    try {
      const fs = await import('fs');
      // Log request body to debug file
      try {
        fs.appendFileSync('DEBUG_REQUEST_PRICE_LIST.txt', JSON.stringify(req.body, null, 2) + '\n---\n');
      } catch (e) { console.error("Failed to write debug log", e); }

      const data = insertPriceListSchema.parse(req.body);
      const priceList = await storage.createPriceList(data);
      res.status(201).json(priceList);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      const fs = await import('fs');
      try {
        fs.writeFileSync('DEBUG_ERROR_PRICE_LIST.txt', String(error) + '\n' + (error instanceof Error ? error.stack : ''));
      } catch (e) {
        console.error("Failed to write error log", e);
      }
      console.error("Error creating price list:", error);

      // Return detailed error to client if possible (dev mode)
      res.status(500).json({
        message: "Failed to create price list",
        error: String(error),
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.patch("/api/price-lists/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const priceList = await storage.updatePriceList(id, req.body);
      res.json(priceList);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to update price list" });
    }
  });

  app.delete("/api/price-lists/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePriceList(id);
      res.sendStatus(204);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to delete price list" });
    }
  });

  app.post("/api/price-list-items", isAuthenticated, async (req, res) => {
    try {
      const data = insertPriceListItemSchema.parse(req.body);
      // Ensure quoteId is passed if present, or handled correctly
      const item = await storage.upsertPriceListItem(data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error upserting price list item:", error);
      res.status(500).json({ message: "Failed to upsert price list item" });
    }
  });

  // Quotes Routes
  app.get("/api/quotes", isAuthenticated, async (req, res) => {
    try {
      const quotes = await storage.getQuotes();
      res.json(quotes);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  app.post("/api/quotes", isAuthenticated, async (req, res) => {
    try {
      const data = insertQuoteSchema.parse(req.body);
      const quote = await storage.createQuote(data);
      res.status(201).json(quote);
    } catch (error) {
      console.error("Error creating quote:", error);
      res.status(500).json({ message: "Failed to create quote" });
    }
  });

  app.patch("/api/quotes/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.updateQuote(id, req.body);
      res.json(quote);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to update quote" });
    }
  });

  // ============================================================================
  // CUSTOM LISTS ROUTES
  // ============================================================================

  app.get("/api/custom-lists", isAuthenticated, async (req, res) => {
    try {
      const lists = await storage.getCustomLists();
      res.json(lists);
    } catch (error) {
      console.error("[API Error] Failed to fetch custom lists:", error);
      res.status(500).json({ message: "Failed to fetch custom lists" });
    }
  });

  app.get("/api/custom-lists/:systemName", isAuthenticated, async (req, res) => {
    try {
      let list = await storage.getCustomListBySystemName(req.params.systemName);
      if (!list) {
        // Rimosso blocco auto-creazione disastroso che generava duplicati: AG-CLEANUP-002B
        // Restituiamo semplicemente un JSON vuoto corretto per la vista frontend.
        return res.json({ items: [] });
      }
      res.json(list);
    } catch (error) {
      console.error("[API Error] Failed to fetch custom list:", error);
      res.status(500).json({ message: "Failed to fetch custom list" });
    }
  });

  app.post("/api/custom-lists", isAuthenticated, async (req, res) => {
    try {
      // Auto-generate systemName if not provided (basic slugify)
      const data = { ...req.body };
      if (!data.systemName && data.name) {
        data.systemName = data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
      }

      const parsedData = insertCustomListSchema.parse(data);
      const list = await storage.createCustomList(parsedData);
      res.status(201).json(list);
    } catch (error) {
      console.error("[API Error] Failed to create custom list:", error);
      res.status(400).json({ message: "Failed to create custom list" });
    }
  });

  app.patch("/api/custom-lists/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const list = await storage.updateCustomList(id, req.body);
      res.json(list);
    } catch (error) {
      console.error("[API Error] Failed to update custom list:", error);
      res.status(500).json({ message: "Failed to update custom list" });
    }
  });

  app.delete("/api/custom-lists/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCustomList(id);
      res.status(204).send();
    } catch (error) {
      console.error("[API Error] Failed to delete custom list:", error);
      res.status(500).json({ message: "Failed to delete custom list" });
    }
  });

  app.post("/api/custom-lists/:listId/items", isAuthenticated, async (req, res) => {
    try {
      const listId = parseInt(req.params.listId);
      const data = insertCustomListItemSchema.parse({ ...req.body, listId });
      const item = await storage.createCustomListItem(data);
      res.status(201).json(item);
    } catch (error) {
      console.error("[API Error] Failed to create custom list item:", error);
      res.status(400).json({ message: "Failed to create custom list item" });
    }
  });

  app.post("/api/custom-lists/:listId/items/bulk", isAuthenticated, async (req, res) => {
    try {
      const listId = parseInt(req.params.listId);
      const { values } = req.body;

      if (!Array.isArray(values)) {
        return res.status(400).json({ message: "Expected an array of values" });
      }

      await storage.createCustomListItems(listId, values);
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("[API Error] Failed to bulk create custom list items:", error);
      res.status(400).json({ message: "Failed to bulk create custom list items" });
    }
  });

  app.patch("/api/custom-lists/:listId/items/:itemId", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const data = insertCustomListItemSchema.partial().parse(req.body);
      const item = await storage.updateCustomListItem(itemId, data);
      res.json(item);
    } catch (error) {
      console.error("[API Error] Failed to update custom list item:", error);
      res.status(400).json({ message: "Failed to update custom list item" });
    }
  });

  app.delete("/api/custom-lists/:listId/items/:itemId", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      await storage.deleteCustomListItem(itemId);
      res.status(204).send();
    } catch (error) {
      console.error("[API Error] Failed to delete custom list item:", error);
      res.status(500).json({ message: "Failed to delete custom list item" });
    }
  });

  app.delete("/api/quotes/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteQuote(id);
      res.sendStatus(204);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to delete quote" });
    }
  });

  // Paid Trials Routes
  app.delete("/api/price-list-items/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePriceListItem(id);
      res.sendStatus(204);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to delete price list item" });
    }
  });

  // ==== Notifications Routes ====
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const notifications = await storage.getNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markNotificationRead(id);
      res.sendStatus(204);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/read-all", isAuthenticated, async (req, res) => {
    try {
      await storage.markAllNotificationsRead(req.user!.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // ==== Custom Reports Routes ====
  app.get("/api/custom-reports", isAuthenticated, async (req, res) => {
    try {
      const reports = await storage.getCustomReports();
      res.json(reports);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
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
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch custom report" });
    }
  });

  app.post("/api/custom-reports", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCustomReportSchema.parse(req.body);
      const report = await storage.createCustomReport(validatedData);
      res.status(201).json(report);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to create custom report" });
    }
  });

  app.patch("/api/custom-reports/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const report = await storage.updateCustomReport(id, req.body);
      res.json(report);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to update custom report" });
    }
  });

  app.delete("/api/custom-reports/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCustomReport(id);
      res.status(204).send();
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
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
          data = (await storage.getCourses()).filter(c => c.activityType === 'workshop');
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
      console.error("[API Error] Caught explicitly:", error);
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
          { name: 'paymentMethod', type: 'string', label: 'Metodo Pagamento' },
          { name: 'dueDate', type: 'date', label: 'Data Scadenza' },
          { name: 'paidDate', type: 'date', label: 'Data Pagamento' },
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
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to get report fields" });
    }
  });

  // ==== Import Configurations ====
  app.get("/api/import-configs", isAuthenticated, async (req, res) => {
    try {
      const { entityType, sourceType } = req.query;
      const configs = await storage.getImportConfigs(
        entityType as string | undefined,
        sourceType as string | undefined
      );
      res.json(configs);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: error.message || "Errore caricamento configurazioni" });
    }
  });

  app.post("/api/import-configs", isAuthenticated, async (req, res) => {
    try {
      const { name, entityType, sourceType, fieldMapping, importKey } = req.body;

      // Validate required fields
      if (!name || !entityType) {
        return res.status(400).json({ message: "Nome e tipo entità sono obbligatori" });
      }

      // Validate entityType
      const validEntityTypes = ["members", "courses"];
      if (!validEntityTypes.includes(entityType)) {
        return res.status(400).json({ message: "Tipo entità non valido. Valori ammessi: members, courses" });
      }

      // Validate sourceType if provided
      if (sourceType) {
        const validSourceTypes = ["google_sheets", "file"];
        if (!validSourceTypes.includes(sourceType)) {
          return res.status(400).json({ message: "Tipo sorgente non valido. Valori ammessi: google_sheets, file" });
        }
      }

      const config = await storage.createImportConfig(req.body);
      res.json(config);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: error.message || "Errore salvataggio configurazione" });
    }
  });

  app.delete("/api/import-configs/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteImportConfig(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: error.message || "Errore eliminazione configurazione" });
    }
  });

  // ==== File Preview for CSV Import ====
  app.post("/api/import/preview", isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nessun file caricato" });
      }

      // Get delimiter from request body (default to comma)
      let delimiter = req.body.delimiter || ",";
      // Handle escaped tab character
      if (delimiter === "\\t") delimiter = "\t";

      const Papa = await import('papaparse');
      const fileContent = req.file.buffer.toString('utf-8');

      const parsed = Papa.default.parse(fileContent, {
        header: false,
        skipEmptyLines: true,
        delimiter: delimiter,
      });

      const rows = parsed.data as string[][];
      if (rows.length === 0) {
        return res.status(400).json({ message: "File vuoto" });
      }

      // First row is headers
      const headerRow = rows[0];

      // Check if headers look like they weren't parsed correctly (all in one cell)
      if (headerRow.length === 1 && headerRow[0] && headerRow[0].includes(';')) {
        // Likely wrong delimiter - suggest semicolon
        return res.status(400).json({
          message: "Il file sembra usare il punto e virgola (;) come delimitatore. Seleziona 'Punto e virgola' nelle opzioni."
        });
      }

      const headers = headerRow.map((name: string, index: number) => ({
        index,
        name: name?.trim() || `Colonna ${index + 1}`,
        originalName: name?.trim() || ""
      }));

      // Sample data from rows 2-6 (skip header row)
      const sampleData = rows.slice(1, 6);

      res.json({
        headers,
        sampleData,
        totalRows: rows.length - 1, // Exclude header row
        delimiter: delimiter // Return used delimiter for confirmation
      });
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: error.message || "Errore lettura file" });
    }
  });

  // ==== File Import with Custom Mapping ====
  app.post("/api/import/mapped", isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nessun file caricato" });
      }

      const { fieldMapping, importKey, entityType, autoCreateRecords } = req.body;
      const mapping = typeof fieldMapping === 'string' ? JSON.parse(fieldMapping) : fieldMapping;
      const autoCreate = autoCreateRecords === 'true' || autoCreateRecords === true;
      const entity = entityType || 'members';

      // Get delimiter from request body (default to comma)
      let delimiter = req.body.delimiter || ",";
      if (delimiter === "\\t") delimiter = "\t";

      const Papa = await import('papaparse');
      const fileContent = req.file.buffer.toString('utf-8');

      const parsed = Papa.default.parse(fileContent, {
        header: false,
        skipEmptyLines: true,
        delimiter: delimiter,
      });

      const rows = parsed.data as string[][];
      if (rows.length <= 1) {
        return res.status(400).json({ message: "File senza dati" });
      }

      // Skip header row
      const dataRows = rows.slice(1);

      let imported = 0;
      let updated = 0;
      let skipped = 0;
      const errors: { row: number; message: string }[] = [];

      if (entity === 'members') {
        // Load all members once before the loop for efficiency
        const allMembers = await storage.getMembers();

        // Load lookup tables for resolving names
        const clientCategories = await storage.getClientCategories();
        const catByName = new Map<string, number>(clientCategories.map(c => [c.name.toLowerCase().trim(), c.id]));

        const subscriptionTypes = await storage.getSubscriptionTypes();
        const subByName = new Map<string, number>(subscriptionTypes.map(s => [s.name.toLowerCase().trim(), s.id]));

        // Create a lookup map for faster duplicate detection
        const memberLookup = new Map<string, any>();
        const seenInImport = new Set<string>(); // Track keys seen in current import
        if (importKey) {
          for (const member of allMembers) {
            const keyValue = member[importKey as keyof typeof member];
            if (keyValue && typeof keyValue === 'string') {
              const normalizedKey = keyValue.trim().toUpperCase().replace(/\s+/g, ' ');
              memberLookup.set(normalizedKey, member);
            }
          }
        }

        // Prepare all member data first
        const toInsert: any[] = [];
        const toUpdate: { id: number; data: any }[] = [];

        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const rowNum = i + 2;

          try {
            const memberData: any = {};

            for (const [field, colIndex] of Object.entries(mapping)) {
              if (colIndex !== null && colIndex !== undefined && (colIndex as number) >= 0) {
                let value = row[colIndex as number]?.trim();
                if (value === undefined || value === "") continue;

                if (["dateOfBirth", "cardIssueDate", "cardExpiryDate", "entityCardIssueDate", "entityCardExpiryDate", "medicalCertificateExpiry"].includes(field)) {
                  const dateFormats = [/(\d{2})\/(\d{2})\/(\d{4})/, /(\d{4})-(\d{2})-(\d{2})/];
                  let dateValue = null;
                  for (const format of dateFormats) {
                    const match = value.match(format);
                    if (match) {
                      if (format.source.startsWith("(\\d{2})")) {
                        dateValue = new Date(`${match[3]}-${match[2]}-${match[1]}`);
                      } else {
                        dateValue = new Date(value);
                      }
                      break;
                    }
                  }
                  if (dateValue && !isNaN(dateValue.getTime())) {
                    memberData[field] = dateValue;
                  }
                } else if (field === "gender") {
                  const g = value.toUpperCase();
                  memberData[field] = g === "M" || g === "MASCHIO" ? "M" : g === "F" || g === "FEMMINA" ? "F" : null;
                } else if (["isMinor", "hasMedicalCertificate"].includes(field)) {
                  const b = value.toLowerCase();
                  memberData[field] = b === "si" || b === "sì" || b === "yes" || b === "1" || b === "true";
                } else if (field === "clientCategoryName") {
                  const lookupKey = value.toLowerCase().trim();
                  let catId = catByName.get(lookupKey);
                  if (!catId && autoCreate && value) {
                    try {
                      const newCat = await storage.createClientCategory({ name: value });
                      catId = newCat.id;
                      catByName.set(lookupKey, catId);
                    } catch (err) {
                      console.error(`[Import] CSV: Failed to create client category "${value}":`, err);
                    }
                  }
                  if (catId) memberData.categoryId = catId;
                } else if (field === "subscriptionTypeName") {
                  const lookupKey = value.toLowerCase().trim();
                  let subId = subByName.get(lookupKey);
                  if (!subId && autoCreate && value) {
                    try {
                      const newSub = await storage.createSubscriptionType({ name: value, active: true });
                      subId = newSub.id;
                      subByName.set(lookupKey, subId);
                    } catch (err) {
                      console.error(`[Import] CSV: Failed to create subscription type "${value}":`, err);
                    }
                  }
                  if (subId) memberData.subscriptionTypeId = subId;
                } else {
                  memberData[field] = value;
                }
              }
            }

            if (!memberData.firstName && !memberData.lastName) {
              skipped++;
              continue;
            }

            // Check for existing member or duplicate in current import
            let existingMember = null;
            let importKeyValue = '';
            if (importKey && memberData[importKey]) {
              importKeyValue = String(memberData[importKey]).trim().toUpperCase().replace(/\s+/g, ' ');

              // Skip if already seen in this import (duplicate in CSV)
              if (seenInImport.has(importKeyValue)) {
                skipped++;
                continue;
              }
              seenInImport.add(importKeyValue);
              existingMember = memberLookup.get(importKeyValue);
            }

            if (existingMember) {
              toUpdate.push({ id: existingMember.id, data: memberData });
            } else {
              toInsert.push(memberData);
            }
          } catch (err: any) {
            console.error("[API Error] Caught explicitly:", err);
            errors.push({ row: rowNum, message: err.message || "Errore sconosciuto" });
            skipped++;
          }
        }

        // Process inserts in batches of 100
        const BATCH_SIZE = 100;
        for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
          const batch = toInsert.slice(i, i + BATCH_SIZE);
          for (const memberData of batch) {
            try {
              await storage.createMember(memberData);
              imported++;
            } catch (err: any) {
              console.error("[API Error] Caught explicitly:", err);
              errors.push({ row: 0, message: err.message || "Errore inserimento" });
              skipped++;
            }
          }
        }

        // Process updates in batches of 100
        for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
          const batch = toUpdate.slice(i, i + BATCH_SIZE);
          for (const { id, data } of batch) {
            try {
              await storage.updateMember(id, data);
              updated++;
            } catch (err: any) {
              console.error("[API Error] Caught explicitly:", err);
              errors.push({ row: 0, message: err.message || "Errore aggiornamento" });
              skipped++;
            }
          }
        }
      } else if (entity === 'courses') {
        // Use shared helper for consistent validation
        const result = await importCoursesFromRows(dataRows, mapping, importKey || 'name', storage, autoCreate);
        imported = result.imported;
        updated = result.updated;
        skipped = result.skipped;
        errors.push(...result.errors);
      } else if (entity === 'instructors') {
        // Use shared helper for instructors
        const result = await importInstructorsFromRows(dataRows, mapping, importKey || 'email', storage, autoCreate);
        imported = result.imported;
        updated = result.updated;
        skipped = result.skipped;
        errors.push(...result.errors);
      }

      res.json({
        success: true,
        imported,
        updated,
        skipped,
        total: dataRows.length,
        errors: errors.slice(0, 10)
      });
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: error.message || "Errore importazione file" });
    }
  });

  const httpServer = createServer(app);
  // ==== Booking Services Routes ====
  app.get("/api/booking-services", isAuthenticated, async (req, res) => {
    try {
      const services = await storage.getBookingServices();
      res.json(services);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch booking services" });
    }
  });

  app.post("/api/booking-services", isAuthenticated, async (req, res) => {
    try {
      const result = insertBookingServiceSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid service data", errors: result.error.errors });
      }
      const service = await storage.createBookingService(result.data);
      res.status(201).json(service);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to create booking service" });
    }
  });

  app.patch("/api/booking-services/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const service = await storage.updateBookingService(id, req.body);
      res.json(service);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to update booking service" });
    }
  });

  app.delete("/api/booking-services/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBookingService(id);
      res.status(204).end();
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to delete booking service" });
    }
  });

  // ==== Booking Service Categories ====
  app.get("/api/booking-service-categories", isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getBookingServiceCategories();
      res.json(categories);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch booking service categories" });
    }
  });

  app.post("/api/booking-service-categories", isAuthenticated, async (req, res) => {
    try {
      const data = insertBookingServiceCategorySchema.parse(req.body);
      const category = await storage.createBookingServiceCategory(data);
      res.status(201).json(category);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to create booking service category" });
    }
  });

  app.patch("/api/booking-service-categories/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.updateBookingServiceCategory(id, req.body);
      res.json(category);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to update booking service category" });
    }
  });

  app.delete("/api/booking-service-categories/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBookingServiceCategory(id);
      res.status(204).end();
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to delete booking service category" });
    }
  });

  // ==== Merchandising Categories ====
  app.get("/api/merchandising-categories", isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getMerchandisingCategories();
      res.json(categories);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch merchandising categories" });
    }
  });

  app.post("/api/merchandising-categories", isAuthenticated, async (req, res) => {
    try {
      const data = insertMerchandisingCategorySchema.parse(req.body);
      const category = await storage.createMerchandisingCategory(data);
      res.status(201).json(category);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to create merchandising category" });
    }
  });

  app.patch("/api/merchandising-categories/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.updateMerchandisingCategory(id, req.body);
      res.json(category);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to update merchandising category" });
    }
  });

  app.delete("/api/merchandising-categories/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMerchandisingCategory(id);
      res.status(204).end();
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to delete merchandising category" });
    }
  });

  // ==== Rental Categories (Affitti) ====
  app.get("/api/rental-categories", isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getRentalCategories();
      res.json(categories);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch rental categories" });
    }
  });

  app.post("/api/rental-categories", isAuthenticated, async (req, res) => {
    try {
      const data = insertRentalCategorySchema.parse(req.body);
      const category = await storage.createRentalCategory(data);
      res.status(201).json(category);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to create rental category" });
    }
  });

  app.patch("/api/rental-categories/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.updateRentalCategory(id, req.body);
      res.json(category);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to update rental category" });
    }
  });

  app.delete("/api/rental-categories/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRentalCategory(id);
      res.status(204).end();
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to delete rental category" });
    }
  });

  // ==== Studio Bookings Routes ====
  app.get("/api/studio-bookings", isAuthenticated, async (req, res) => {
    try {
      const seasonId = req.query.seasonId ? parseInt(req.query.seasonId as string) : null;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      let bookings;
      if (startDate && endDate) {
        bookings = await storage.getStudioBookings(startDate, endDate);
      } else if (seasonId) {
        bookings = await storage.getStudioBookingsBySeason(seasonId);
      } else {
        const activeSeason = await storage.getActiveSeason();
        if (activeSeason) {
          bookings = await storage.getStudioBookingsBySeason(activeSeason.id);
        } else {
          bookings = await storage.getStudioBookings();
        }
      }
      res.json(bookings);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch studio bookings" });
    }
  });

  // ==== Booking Service Enrollments (Servizi Extra mapped to UI) ====
  app.get("/api/booking-service-enrollments", isAuthenticated, async (req, res) => {
    try {
      const activeSeason = await storage.getActiveSeason();
      let bookings = activeSeason
        ? await storage.getStudioBookingsBySeason(activeSeason.id)
        : await storage.getStudioBookings();

      const enrollments = bookings
        .filter(b => b.serviceId != null)
        .map(b => ({
          id: b.id,
          memberId: b.memberId,
          serviceId: b.serviceId,
          memberFirstName: b.memberFirstName,
          memberLastName: b.memberLastName,
          status: b.status === "cancelled" ? "cancelled" : "active",
          enrollmentDate: b.bookingDate,
        }));

      res.json(enrollments);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch booking service enrollments" });
    }
  });

  app.post("/api/studio-bookings", isAuthenticated, async (req, res) => {
    try {
      const { paymentMethodId, ...bookingData } = req.body;
      const result = insertStudioBookingSchema.safeParse(bookingData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid booking data", errors: result.error.errors });
      }

      // Check for conflicts unless forced
      if (!req.body.force) {
        const conflict = await storage.checkStudioConflict(
          result.data.studioId,
          result.data.bookingDate,
          result.data.startTime,
          result.data.endTime,
          undefined,
          undefined,
          (result.data as any).seasonId || undefined
        );
        if (conflict) {
          const message = conflict.type === 'operating_hours'
            ? `Attenzione: ${conflict.name}. Vuoi forzare la prenotazione?`
            : `Conflitto: lo studio è già occupato da "${conflict.name}". Vuoi forzare la prenotazione?`;

          return res.status(409).json({
            message,
            conflictWith: conflict
          });
        }
      }

      const booking = await storage.createStudioBooking(result.data);

      // Sync to Google Calendar (async)
      syncStudioBookingToGoogle(booking);

      // If paid is true and memberId is present, create a payment record
      if (booking.paid && booking.memberId && booking.amount) {
        const { paidAmount } = req.body;
        let paymentMethodName = "Contanti"; // Default
        if (paymentMethodId) {
          const pm = await storage.getPaymentMethod(paymentMethodId);
          if (pm) paymentMethodName = pm.name;
        }

        await storage.createPayment({
          memberId: booking.memberId,
          amount: paidAmount || booking.amount.toString(),
          type: "service_booking",
          description: `Pagamento prenotazione: ${booking.title || 'Servizio'}`,
          status: "paid",
          dueDate: null,
          paidDate: new Date() as any,
          transferConfirmationDate: null,
          paymentMethodId: paymentMethodId || null,
          paymentMethod: paymentMethodName,
        });
      } else if (!booking.paid && booking.memberId && booking.amount) {
        // CREATE AUTOMATIC DEBT (Pending Payment)
        await storage.createPayment({
          memberId: booking.memberId,
          bookingId: booking.id,
          amount: booking.amount.toString(),
          type: "service_booking",
          description: `Debito prenotazione: ${booking.title || 'Servizio'}`,
          status: "pending",
          dueDate: new Date(booking.bookingDate),
          paidDate: null,
          transferConfirmationDate: null,
        });
      }

      await logUserActivity(req, "CREATE", "studio_bookings", booking.id.toString(), { title: booking.title });
      res.status(201).json(booking);
    } catch (error: any) {
      console.error("Booking error:", error);
      res.status(500).json({ message: error.message || "Failed to create studio booking" });
    }
  });

  app.patch("/api/studio-bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { paymentMethodId, ...bookingData } = req.body;
      const oldBooking = await storage.getStudioBooking(id);
      if (!oldBooking) return res.status(404).json({ message: "Booking not found" });

      // Check for conflicts unless forced
      if (!req.body.force && bookingData.studioId && bookingData.bookingDate && bookingData.startTime && bookingData.endTime) {
        const conflict = await storage.checkStudioConflict(
          bookingData.studioId,
          bookingData.bookingDate,
          bookingData.startTime,
          bookingData.endTime,
          id,
          undefined,
          (bookingData as any).seasonId || undefined
        );
        if (conflict) {
          const message = conflict.type === 'operating_hours'
            ? `Attenzione: ${conflict.name}. Vuoi forzare la prenotazione?`
            : `Conflitto: lo studio è già occupato da "${conflict.name}". Vuoi forzare la prenotazione?`;

          return res.status(409).json({
            message,
            conflictWith: conflict
          });
        }
      }

      const result = insertStudioBookingSchema.partial().safeParse(bookingData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid booking data", errors: result.error.errors });
      }

      const booking = await storage.updateStudioBooking(id, result.data);

      // Sync to Google Calendar (async)
      syncStudioBookingToGoogle(booking);

      // If it was not paid and now it is paid, create a payment record
      if (oldBooking && !oldBooking.paid && booking.paid && booking.memberId && booking.amount) {
        const { paidAmount } = req.body;
        let paymentMethodName = "Contanti";
        if (paymentMethodId) {
          const pm = await storage.getPaymentMethod(paymentMethodId);
          if (pm) paymentMethodName = pm.name;
        }

        await storage.createPayment({
          memberId: booking.memberId,
          amount: paidAmount || booking.amount.toString(),
          type: "service_booking",
          description: `Pagamento prenotazione: ${booking.title || 'Servizio'}`,
          status: "paid",
          paidDate: new Date() as any,
          paymentMethodId: paymentMethodId || null,
          paymentMethod: paymentMethodName,
        });
      }

      await logUserActivity(req, "UPDATE", "studio_bookings", id.toString(), { title: booking.title });
      res.json(booking);
    } catch (error: any) {
      console.error("Booking update error:", error);
      res.status(500).json({ message: error.message || "Failed to update studio booking" });
    }
  });

  app.delete("/api/studio-bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getStudioBooking(id);
      if (booking?.googleEventId) {
        deleteStudioBookingFromGoogle(booking.googleEventId, booking.studioId);
      }
      await storage.deleteStudioBooking(id);
      res.status(204).end();
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to delete studio booking" });
    }
  });

  // ==== Seasons Routes ====
  app.get("/api/seasons", isAuthenticated, async (req, res) => {
    try {
      const allSeasons = await storage.getSeasons();
      res.json(allSeasons);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch seasons" });
    }
  });

  app.get("/api/seasons/active", isAuthenticated, async (req, res) => {
    try {
      const season = await storage.getActiveSeason();
      res.json(season || null);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch active season" });
    }
  });

  app.post("/api/seasons", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSeasonSchema.parse(req.body);
      const season = await storage.createSeason(validatedData);
      res.status(201).json(season);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to create season" });
    }
  });

  app.patch("/api/seasons/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const season = await storage.updateSeason(id, req.body);
      res.json(season);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to update season" });
    }
  });

  app.post("/api/seasons/:id/activate", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.setActiveSeason(id);
      res.status(204).send();
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to activate season" });
    }
  });

  // Season Reset (Archiviazione)
  app.post("/api/seasons/reset", isAuthenticated, async (req, res) => {
    try {
      const { name, description, startDate, endDate } = req.body;

      // 1. Get current active season if any
      const currentSeason = await storage.getActiveSeason();

      // 2. Create new season
      const newSeason = await storage.createSeason({
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        active: true
      });

      // 3. Deactivate old season
      if (currentSeason) {
        await storage.updateSeason(currentSeason.id, { active: false });
      }

      res.status(201).json(newSeason);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to reset season" });
    }
  });

  // ==========================================
  // TODOS API
  // ==========================================
  app.get("/api/todos", isAuthenticated, async (req, res) => {
    try {
      const allTodos = await storage.getTodos();
      res.json(allTodos);
    } catch (error) {
      console.error("Error fetching todos:", error);
      res.status(500).json({ error: "Failed to fetch todos" });
    }
  });

  app.post("/api/todos", isAuthenticated, async (req, res) => {
    try {
      const u = req.user as any;
      const creatorName = u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : (u.username || 'System');
      const todoData = {
        text: req.body.text,
        createdBy: creatorName,
        completed: false
      };
      const newTodo = await storage.createTodo(todoData);
      res.status(201).json(newTodo);
    } catch (error) {
      console.error("Error creating todo:", error);
      res.status(500).json({ error: "Failed to create todo" });
    }
  });

  app.patch("/api/todos/:id", isAuthenticated, async (req, res) => {
    try {
      const todoId = parseInt(req.params.id);
      if (isNaN(todoId)) {
        return res.status(400).json({ error: "Invalid todo ID" });
      }
      const u = req.user as any;
      const completerName = u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : (u.username || 'System');

      const updateData: any = {};
      if (req.body.text !== undefined) updateData.text = req.body.text;
      if (req.body.completed !== undefined) {
        updateData.completed = req.body.completed;
        if (req.body.completed) {
          updateData.completedBy = completerName;
          updateData.completedAt = new Date();
        } else {
          updateData.completedBy = null;
          updateData.completedAt = null;
        }
      }

      const updatedTodo = await storage.updateTodo(todoId, updateData);
      res.json(updatedTodo);
    } catch (error) {
      console.error("Error updating todo:", error);
      res.status(500).json({ error: "Failed to update todo" });
    }
  });

  app.delete("/api/todos/:id", isAuthenticated, async (req, res) => {
    try {
      const todoId = parseInt(req.params.id);
      if (isNaN(todoId)) {
        return res.status(400).json({ error: "Invalid todo ID" });
      }
      await storage.deleteTodo(todoId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting todo:", error);
      res.status(500).json({ error: "Failed to delete todo" });
    }
  });

  // ==========================================
  // TEAM COMMENTS API
  // ==========================================
  app.get("/api/team-comments", isAuthenticated, async (req, res) => {
    try {
      const u = req.user as any;
      const currentUserId = String(u.id);

      const comments = await db.select()
        .from(teamComments)
        .orderBy(desc(teamComments.createdAt));

      res.json(comments);
    } catch (error) {
      console.error("Error fetching team comments:", error);
      res.status(500).json({ error: "Failed to fetch team comments" });
    }
  });

  app.get("/api/team-notifications/unread-count", isAuthenticated, async (req, res) => {
    try {
      const u = req.user as any;
      const currentUserId = String(u.id);

      // Conta i commenti attivi che sono assegnati a "Tutti" o all'utente corrente
      const userComments = await db.select()
        .from(teamComments)
        .where(eq(teamComments.isResolved, false));

      const unreadCount = userComments.filter(c => c.assignedTo === 'Tutti' || c.assignedTo === currentUserId).length;

      res.json({ count: unreadCount });
    } catch (error) {
      console.error("Error fetching unread team notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications count" });
    }
  });

  app.post("/api/team-comments", isAuthenticated, async (req, res) => {
    try {
      const u = req.user as any;
      const creatorName = u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : (u.username || 'System');

      const payload = { ...req.body, authorId: String(u.id), authorName: creatorName };
      const parsed = insertTeamCommentSchema.safeParse(payload);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid team comment data", details: parsed.error });
      }

      const dataToInsert = {
        ...parsed.data,
        assignedTo: payload.assignedTo || "Tutti"
      };

      const [insertResult] = await db.insert(teamComments).values(dataToInsert);
      const newComment = await db.select().from(teamComments).where(eq(teamComments.id, insertResult.insertId));

      res.status(201).json(newComment[0] || {});
    } catch (error) {
      console.error("Error creating team comment:", error);
      res.status(500).json({ error: "Failed to create team comment" });
    }
  });

  app.patch("/api/team-comments/:id", isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      if (isNaN(commentId)) {
        return res.status(400).json({ error: "Invalid comment ID" });
      }

      await db.update(teamComments).set({
        ...req.body,
        updatedAt: new Date()
      }).where(eq(teamComments.id, commentId));

      const updatedComment = await db.select().from(teamComments).where(eq(teamComments.id, commentId));
      res.json(updatedComment[0] || {});
    } catch (error) {
      console.error("Error updating team comment:", error);
      res.status(500).json({ error: "Failed to update team comment" });
    }
  });

  app.delete("/api/team-comments/:id", isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      if (isNaN(commentId)) {
        return res.status(400).json({ error: "Invalid comment ID" });
      }

      await db.delete(teamComments).where(eq(teamComments.id, commentId));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting team comment:", error);
      res.status(500).json({ error: "Failed to delete team comment" });
    }
  });

  // ==========================================
  // TEAM NOTES API
  // ==========================================
  app.get("/api/team-notes", isAuthenticated, async (req, res) => {
    try {
      const { targetUrl } = req.query;
      let conditions: any[] = [];
      if (targetUrl) {
        conditions.push(eq(teamNotes.targetUrl, targetUrl as string));
      }

      const notes = await db.select()
        .from(teamNotes)
        .where(and(isNull(teamNotes.deletedAt), conditions.length > 0 ? and(...conditions) : undefined))
        .orderBy(desc(teamNotes.isPinned), desc(teamNotes.createdAt));

      res.json(notes);
    } catch (error) {
      console.error("Error fetching team notes:", error);
      res.status(500).json({ error: "Failed to fetch team notes" });
    }
  });

  app.post("/api/team-notes", isAuthenticated, async (req, res) => {
    try {
      const u = req.user as any;
      const creatorName = u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : (u.username || 'System');

      const payload = { ...req.body, authorId: String(u.id), authorName: creatorName };
      const parsed = insertTeamNoteSchema.safeParse(payload);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid team note data", details: parsed.error });
      }

      // Handle the targetUrl explicitly as the schema might not include it yet fully depending on version
      const dataToInsert = {
        ...parsed.data,
        targetUrl: req.body.targetUrl || null
      };

      const [insertResult] = await db.insert(teamNotes).values(dataToInsert);
      const newNote = await db.select().from(teamNotes).where(eq(teamNotes.id, insertResult.insertId));

      res.status(201).json(newNote[0] || {});
    } catch (error) {
      console.error("Error creating team note:", error);
      res.status(500).json({ error: "Failed to create team note" });
    }
  });

  app.patch("/api/team-notes/:id", isAuthenticated, async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      if (isNaN(noteId)) {
        return res.status(400).json({ error: "Invalid note ID" });
      }

      await db.update(teamNotes).set({
        ...req.body,
        updatedAt: new Date()
      }).where(eq(teamNotes.id, noteId));

      const updatedNote = await db.select().from(teamNotes).where(eq(teamNotes.id, noteId));
      res.json(updatedNote[0] || {});
    } catch (error) {
      console.error("Error updating team note:", error);
      res.status(500).json({ error: "Failed to update team note" });
    }
  });

  app.delete("/api/team-notes/:id", isAuthenticated, async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      if (isNaN(noteId)) {
        return res.status(400).json({ error: "Invalid note ID" });
      }

      const u = req.user as any;
      const deleterName = u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : (u.username || 'System');

      await db.update(teamNotes)
        .set({ deletedAt: new Date(), deletedBy: deleterName })
        .where(eq(teamNotes.id, noteId));

      res.status(200).json({ message: "Note archived successfully" });
    } catch (error) {
      console.error("Error deleting team note:", error);
      res.status(500).json({ error: "Failed to delete team note" });
    }
  });

  // GET ARCHIVED NOTES
  app.get("/api/team-notes/archived", isAuthenticated, async (req, res) => {
    try {
      const notes = await db.select()
        .from(teamNotes)
        .where(isNotNull(teamNotes.deletedAt))
        .orderBy(desc(teamNotes.deletedAt));
      res.json(notes);
    } catch (error) {
      console.error("Error fetching archived team notes:", error);
      res.status(500).json({ error: "Failed to fetch archived notes" });
    }
  });

  // RESTORE ARCHIVED NOTE
  app.post("/api/team-notes/:id/restore", isAuthenticated, async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      if (isNaN(noteId)) return res.status(400).json({ error: "Invalid note ID" });

      await db.update(teamNotes)
        .set({ deletedAt: null, deletedBy: null })
        .where(eq(teamNotes.id, noteId));

      res.status(200).json({ message: "Note restored successfully" });
    } catch (error) {
      console.error("Error restoring team note:", error);
      res.status(500).json({ error: "Failed to restore note" });
    }
  });

  // ==========================================
  // COPILOT AI STUB
  // ==========================================
  app.post("/api/copilot/generate-note", isAuthenticated, async (req, res) => {
    try {
      const { targetUrl, pageContext } = req.body;
      // In un sistema reale, qui avverrebbe la chiamata all'API reale dell'AI
      // Usiamo uno stub contestuale

      let suggestedText = "Questa è una nota generata dall'AI.";

      if (targetUrl?.includes('/corsi') || pageContext?.includes('corso')) {
        suggestedText = "Verificare gli iscritti al corso. Ricordare di inviare le comunicazioni per le scadenze imminenti dei pagamenti.";
      } else if (targetUrl?.includes('/pagamenti')) {
        suggestedText = "Controllare le fatture in sospeso e riconciliare con l'estratto conto di fine mese.";
      } else if (targetUrl?.includes('/membro/')) {
        suggestedText = "Aggiornare il certificato medico e verificare la data di scadenza della tessera associativa.";
      } else {
        suggestedText = `Promemoria per la sezione: ${targetUrl || 'Generale'}. Completare la revisione dei dati presenti in questa schermata entro domani.`;
      }

      setTimeout(() => {
        res.json({ suggestion: suggestedText });
      }, 800); // Simuliamo un po' di latenza AI
    } catch (error) {
      console.error("Error generating Copilot note:", error);
      res.status(500).json({ error: "Failed to generate note" });
    }
  });

  // ==========================================
  // STI: UNIFIED ACTIVITY APIS
  // ==========================================
  app.get("/api/activities", isAuthenticated, async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      if (categoryId) {
        const activities = await storage.getActivitiesByCategoryId(categoryId);
        res.json(activities);
      } else {
        const activities = await storage.getActivities();
        res.json(activities);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.get("/api/activities/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const activity = await storage.getActivity(id);
      if (!activity) return res.status(404).json({ error: "Activity not found" });
      res.json(activity);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  app.post("/api/activities", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(parsed);
      res.status(201).json(activity);
    } catch (error: any) {
      console.error("error API post", error);
      res.status(400).json({ error: "Invalid activity data", details: error.errors || error.message });
    }
  });

  app.patch("/api/activities/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = insertActivitySchema.partial().parse(req.body);
      const activity = await storage.updateActivity(id, parsed);
      res.json(activity);
    } catch (error: any) {
      res.status(400).json({ error: "Invalid activity data", details: error.errors || error.message });
    }
  });

  app.delete("/api/activities/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteActivity(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete activity" });
    }
  });

  // ==========================================
  // STI: UNIFIED ENROLLMENTS APIS
  // ==========================================
  app.get("/api/global-enrollments", isAuthenticated, async (req, res) => {
    try {
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : undefined;
      const activityId = req.query.activityId ? parseInt(req.query.activityId as string) : undefined;

      let enrollments = [];
      if (memberId) {
        enrollments = await storage.getGlobalEnrollmentsByMemberId(memberId);
      } else if (activityId) {
        enrollments = await storage.getGlobalEnrollmentsByActivityId(activityId);
      } else {
        enrollments = await storage.getGlobalEnrollments();
      }

      const allMembers = await storage.getMembers();
      const memberMap = new Map(allMembers.map(m => [m.id, m]));
      const enriched = enrollments.map(e => {
        const m = memberMap.get(e.memberId);
        return {
          ...e,
          memberFirstName: m?.firstName,
          memberLastName: m?.lastName,
          memberEmail: m?.email,
          memberPhone: m?.phone || m?.mobile,
          memberGender: m?.gender
        };
      });
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch global enrollments" });
    }
  });

  app.post("/api/global-enrollments", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertGlobalEnrollmentSchema.parse(req.body);
      const enrollment = await storage.createGlobalEnrollment(parsed);
      res.status(201).json(enrollment);
    } catch (error: any) {
      res.status(400).json({ error: "Invalid enrollment data", details: error.errors || error.message });
    }
  });

  app.patch("/api/global-enrollments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = insertGlobalEnrollmentSchema.partial().parse(req.body);
      const enrollment = await storage.updateGlobalEnrollment(id, parsed);

      res.json(enrollment);
    } catch (error: any) {
      res.status(400).json({ error: "Invalid enrollment data", details: error.errors || error.message });
    }
  });

  app.delete("/api/global-enrollments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGlobalEnrollment(id);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete enrollment" });
    }
  });

  // ==========================================
  // STI: UNIFIED CALENDAR APIS
  // ==========================================
  app.get("/api/calendar-events", isAuthenticated, async (req, res) => {
    try {
      // Fetch all activity_details representing events
      const activitiesList = await storage.getActivities();

      // Need studios to populate titles properly
      const studiosList = await storage.getStudios();
      const studioMap = Object.fromEntries(studiosList.map(s => [s.id, s]));

      // Map activity details to unified calendar events
      const events = activitiesList.map((activity: any) => {
        let eventColor = "#3788d8"; // Default blue
        switch (activity.categoryId) {
          // Placeholder color mapping until categories are seeded
          default: eventColor = "#4CAF50"; break; // Green
        }

        return {
          id: `activity-${activity.id}`,
          title: activity.name,
          start: activity.startTime ? `${new Date().toISOString().split('T')[0]}T${activity.startTime}` : null,
          end: activity.endTime ? `${new Date().toISOString().split('T')[0]}T${activity.endTime}` : null,
          backgroundColor: eventColor,
          extendedProps: {
            activityId: activity.id,
            description: activity.description,
            studioId: activity.locationId,
            studio: activity.locationId ? studioMap[activity.locationId]?.name : undefined,
            instructorId: activity.instructorId,
            categoryId: activity.categoryId,
            maxCapacity: activity.maxCapacity
          }
        };
      }).filter((event: any) => event.start !== null); // Only return events with a start date/day

      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });

  app.get("/api/activities-summary", isAuthenticated, async (req, res) => {
    try {
      const summaries: Record<string, { total: number, active: number }> = {
        "corsi": { total: 0, active: 0 },
        "allenamenti": { total: 0, active: 0 },
        "lezioni-individuali": { total: 0, active: 0 },
        "workshop": { total: 0, active: 0 },
        "campus": { total: 0, active: 0 },
        "domeniche-movimento": { total: 0, active: 0 },
        "saggi": { total: 0, active: 0 },
        "vacanze-studio": { total: 0, active: 0 },
        "affitti": { total: 0, active: 0 }
      };

      const { sql } = await import("drizzle-orm");

      const coursesSummary = await db.execute(sql`
        SELECT 
          activity_type, 
          COUNT(*) as total, 
          SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active
        FROM courses
        GROUP BY activity_type
      `);

      const [rawRows] = coursesSummary as any[];
      const rows = rawRows as any[];
      rows.forEach(row => {
        let key = row.activity_type;
        if (key === 'course') key = 'corsi';
        if (key === 'prenotazioni') key = 'lezioni-individuali';
        if (key === 'domeniche') key = 'domeniche-movimento';
        if (key === 'vacanze') key = 'vacanze-studio';
        
        if (summaries[key] !== undefined) {
          summaries[key] = {
            total: Number(row.total),
            active: Number(row.active)
          };
        }
      });

      res.json(summaries);
    } catch (error) {
      console.error("Error fetching activities summary:", error);
      res.status(500).json({ error: "Failed to fetch activities summary" });
    }
  });

  // ==========================================
  // STI: PHASE 3 BRIDGE API READ-ONLY
  // ==========================================
  app.get("/api/activities-unified-preview", isAuthenticated, async (req, res) => {
    try {
      const data = await getUnifiedActivitiesPreview(req);
      res.json(data);
    } catch (error) {
      console.error("Bridge Error (Activities):", error);
      res.status(500).json({ error: "Failed to fetch unified activities preview" });
    }
  });

  app.get("/api/activities-unified-preview/:type/:id", isAuthenticated, async (req, res) => {
    try {
      const data = await getUnifiedActivityById(req);
      if (!data) return res.status(404).json({ error: "Activity not found" });
      res.json(data);
    } catch (error) {
      console.error("Bridge Error (Single Activity):", error);
      res.status(500).json({ error: "Failed to fetch unified activity by id" });
    }
  });

  app.get("/api/enrollments-unified-preview", isAuthenticated, async (req, res) => {
    try {
      const data = await getUnifiedEnrollmentsPreview(req);
      res.json(data);
    } catch (error) {
      console.error("Bridge Error (Enrollments):", error);
      res.status(500).json({ error: "Failed to fetch unified enrollments preview" });
    }
  });

  // ==========================================
  // STRATEGIC EVENTS (PLANNING STAGIONALE)
  // ==========================================
  app.get("/api/strategic-events", isAuthenticated, async (req, res) => {
    try {
      const seasonId = req.query.seasonId ? parseInt(req.query.seasonId as string) : null;
      let events;
      const allEvents = await storage.getStrategicEvents();
      
      if (req.query.seasonId === "all") {
        events = allEvents;
      } else {
        const activeSeason = await storage.getActiveSeason();
        const targetSeasonId = seasonId || activeSeason?.id;
        
        events = allEvents.filter(e => {
            const effSeasonId = e.seasonId || activeSeason?.id;
            return effSeasonId === targetSeasonId;
        });
      }
      res.json(events);
    } catch (err) {
      console.error("Error fetching strategic events:", err);
      res.status(500).json({ message: "Failed to fetch strategic events" });
    }
  });

  app.post("/api/strategic-events", isAuthenticated, async (req, res) => {
    try {
      const result = insertStrategicEventSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid event data", errors: result.error.errors });
      }
      const newEvent = await storage.createStrategicEvent(result.data);
      res.status(201).json(newEvent);
    } catch (err: any) {
      console.error("Error creating strategic event:", err);
      res.status(500).json({ message: "Failed to create strategic event", error: err.message, stack: err.stack });
    }
  });

  app.patch("/api/strategic-events/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      
      const result = insertStrategicEventSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid event data", errors: result.error.errors });
      }

      const updated = await storage.updateStrategicEvent(id, result.data);
      if (!updated) return res.status(404).json({ message: "Strategic event not found" });
      
      res.json(updated);
    } catch (err) {
      console.error("Error updating strategic event:", err);
      res.status(500).json({ message: "Failed to update strategic event" });
    }
  });

  app.delete("/api/strategic-events/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      
      await storage.deleteStrategicEvent(id);
      res.json({ message: "Strategic event deleted successfully" });
    } catch (err) {
      console.error("Error deleting strategic event:", err);
      res.status(500).json({ message: "Failed to delete strategic event" });
    }
  });

  return httpServer;
}
