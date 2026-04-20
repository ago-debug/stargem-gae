import { parseTurniXlsx } from "./scripts/import-turni";
import { parsePresenzeXlsx } from "./scripts/import-presenze";
import fs from "fs";
import { createInsertSchema } from "drizzle-zod";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isExternalDeploy } from "./auth";
import multer from "multer";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import path from "path";
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
import { eq, desc, asc, and, isNull, isNotNull, sql, gte, lte, lt, or, like, ne, inArray } from "drizzle-orm";
import { differenceInYears } from "date-fns";
import * as schema from "@shared/schema";
import { gemConversations, gemMessages, memberUploads, insertMemberSchema,
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
  insertMemberPackageSchema,
  promoRules,
  welfareProviders,
  carnetWallets,
  carnetSessions,
  instructorAgreements,
  agreementMonthlyOverrides,
  pagodilTiers,
  costCenters,
  accountingPeriods,
  journalEntries,
  memberDiscounts,
  companyAgreements,
  staffRates,
  pricingRules,
  payments, members, users, notifications } from "@shared/schema";

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


  async function resolveSeason(reqQuery: any) {
    let seasonId = reqQuery.seasonId;
    let startDate = reqQuery.startDate;
    let endDate = reqQuery.endDate;
    
    if (seasonId === 'active') {
      const { db } = await import('./db');
      const { seasons } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      const [activeSeason] = await db.select().from(seasons).where(eq(seasons.active, true)).limit(1);
      if (activeSeason) {
        seasonId = activeSeason.id;
        startDate = activeSeason.startDate.toISOString();
        endDate = activeSeason.endDate.toISOString();
      }
    }
    return { seasonId, startDate, endDate };
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

  // Helpers per Session Segments
  async function checkAndCloseStaleSegments(db: any, userSessionSegments: any, eq: any, and: any, isNull: any, lt: any) {
    const now = Date.now();
    const tenMinutesAgo = new Date(now - 10 * 60 * 1000);
    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);

    const staleOnline = await db.select().from(userSessionSegments).where(
      and(
        eq(userSessionSegments.tipo, 'online'),
        isNull(userSessionSegments.endedAt),
        lt(userSessionSegments.lastHeartbeatAt, fiveMinutesAgo)
      )
    );

    for (const seg of staleOnline) {
      const lHbTime = new Date(seg.lastHeartbeatAt || seg.startedAt).getTime();
      const stTime = new Date(seg.startedAt).getTime();
      const durataRealeMin = Math.max(0, Math.round((lHbTime - stTime) / 60000));
      
      const isDeadOffline = lHbTime < tenMinutesAgo.getTime();
      
      if (isDeadOffline) {
        await db.update(userSessionSegments)
          .set({ endedAt: new Date(lHbTime), durataMinuti: durataRealeMin })
          .where(eq(userSessionSegments.id, seg.id));
      } else {
        await db.update(userSessionSegments)
          .set({ endedAt: new Date(lHbTime), durataMinuti: durataRealeMin })
          .where(eq(userSessionSegments.id, seg.id));
          
        await db.insert(userSessionSegments).values({
          userId: seg.userId, tipo: 'pausa', startedAt: new Date(lHbTime), lastHeartbeatAt: new Date(lHbTime)
        });
      }
    }

    const stalePausa = await db.select().from(userSessionSegments).where(
      and(
        eq(userSessionSegments.tipo, 'pausa'),
        isNull(userSessionSegments.endedAt),
        lt(userSessionSegments.lastHeartbeatAt, tenMinutesAgo)
      )
    );

    for (const seg of stalePausa) {
      const lHbTime = new Date(seg.lastHeartbeatAt || seg.startedAt).getTime();
      const stTime = new Date(seg.startedAt).getTime();
      const durataMinuti = Math.max(0, Math.round((lHbTime - stTime) / 60000));
      
      await db.update(userSessionSegments)
        .set({ endedAt: new Date(lHbTime), durataMinuti })
        .where(eq(userSessionSegments.id, seg.id));
    }
  }

  async function handleHeartbeat(userId: string, db: any, users: any, userSessionSegments: any, eq: any, and: any, isNull: any) {
    const now = new Date();
    
    const openSegment = await db.select().from(userSessionSegments).where(
      and(eq(userSessionSegments.userId, userId), isNull(userSessionSegments.endedAt))
    ).limit(1);

    if (openSegment.length > 0) {
      const seg = openSegment[0];
      if (seg.tipo === 'online') {
          await db.update(userSessionSegments)
            .set({ lastHeartbeatAt: now })
            .where(eq(userSessionSegments.id, seg.id));

          const diffMs = now.getTime() - new Date(seg.startedAt).getTime();
          const diffMin = Math.round(diffMs / 60000);
          if (diffMin >= 30) {
             await db.update(userSessionSegments)
               .set({ endedAt: now, durataMinuti: diffMin })
               .where(eq(userSessionSegments.id, seg.id));
             await db.insert(userSessionSegments).values({
               userId, tipo: 'online', startedAt: now, lastHeartbeatAt: now
             });
          }
      } else if (seg.tipo === 'pausa') {
          const diffMs = now.getTime() - new Date(seg.startedAt).getTime();
          const safeDurata = Math.round(diffMs / 60000);
          await db.update(userSessionSegments)
            .set({ endedAt: now, durataMinuti: safeDurata })
            .where(eq(userSessionSegments.id, seg.id));
          await db.insert(userSessionSegments).values({
            userId, tipo: 'online', startedAt: now, lastHeartbeatAt: now
          });
      }
    } else {
       await db.insert(userSessionSegments).values({
          userId, tipo: 'online', startedAt: now, lastHeartbeatAt: now
       });
    }

    await db.update(users).set({ lastSeenAt: now }).where(eq(users.id, userId));
  }

  // User Presence Heartbeat
  app.post("/api/users/presence/heartbeat", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { db } = await import("./db");
      const { users, userSessionSegments } = await import("../shared/schema");
      const { eq, and, isNull, lt } = await import("drizzle-orm");

      await checkAndCloseStaleSegments(db, userSessionSegments, eq, and, isNull, lt);
      await handleHeartbeat(userId, db, users, userSessionSegments, eq, and, isNull);

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
      const { users, userSessionSegments } = await import("../shared/schema");
      const { eq, and, isNull } = await import("drizzle-orm");

      // Chiudiamo i segmenti aperti immediatamente se fa offline esplicito
      const now = new Date();
      const openSegment = await db
        .select()
        .from(userSessionSegments)
        .where(
          and(
            eq(userSessionSegments.userId, userId),
            isNull(userSessionSegments.endedAt)
          )
        )
        .limit(1);

      if (openSegment.length > 0) {
        const seg = openSegment[0];
        const diffMs = now.getTime() - new Date(seg.startedAt).getTime();
        const diffMin = diffMs / 60000;
        const durataReale = diffMs > 30000 ? Math.max(1, Math.round(diffMin)) : 0;
        const safeDurata = seg.tipo === 'online' ? Math.min(durataReale, 30) : durataReale;
        await db.update(userSessionSegments)
          .set({ endedAt: now, durataMinuti: safeDurata })
          .where(eq(userSessionSegments.id, seg.id));
      }

      await db.update(users).set({ lastSeenAt: now }).where(eq(users.id, userId));

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Active Users list
  app.get("/api/users/presence/active", isAuthenticated, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { users, userSessionSegments } = await import("../shared/schema");
      const { desc, eq, and, isNull, lt, sql } = await import("drizzle-orm");

      await checkAndCloseStaleSegments(db, userSessionSegments, eq, and, isNull, lt);

      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        lastSeenAt: users.lastSeenAt,
      })
      .from(users)
      .orderBy(desc(users.lastSeenAt));

      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' });

      const enhancedUsers = await Promise.all(allUsers.map(async (u) => {
        let stato: 'online' | 'pausa' | 'offline' = 'offline';
        const now = Date.now();
        if (u.lastSeenAt) {
           const diffSec = (now - new Date(u.lastSeenAt).getTime()) / 1000;
           if (diffSec < 300) stato = 'online';
           else if (diffSec < 600) stato = 'pausa';
           else stato = 'offline';
        }

        const segments = await db.select().from(userSessionSegments).where(eq(userSessionSegments.userId, u.id));
        
        // Segmenti chiusi oggi
        const chiusiOnline = segments
          .filter(s => {
            const segDate = new Date(s.startedAt).toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' });
            return s.tipo === 'online' && s.endedAt !== null && segDate === todayStr;
          })
          .reduce((sum, s) => sum + (s.durataMinuti || 0), 0);
          
        const chiusiPausa = segments
          .filter(s => {
            const segDate = new Date(s.startedAt).toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' });
            return s.tipo === 'pausa' && s.endedAt !== null && segDate === todayStr;
          })
          .reduce((sum, s) => sum + (s.durataMinuti || 0), 0);

        // Segmento aperto corrente (se esiste e appartiene a oggi)
        const aperto = segments.find(s => {
            const segDate = new Date(s.startedAt).toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' });
            return s.endedAt === null && segDate === todayStr;
        });
        let segmentoCorrenteInizio = aperto ? aperto.startedAt : null;
        let segmentoCorrenteTipo = aperto ? aperto.tipo : null;
        let segmentoLiveMinuti = 0;

        if (aperto) {
          segmentoLiveMinuti = Math.round(
            (Date.now() - new Date(aperto.startedAt).getTime()) / 60000
          );
        }

        let lavoroOggiMinuti = chiusiOnline;
        let pausaOggiMinuti = chiusiPausa;

        if (aperto?.tipo === 'online') {
          lavoroOggiMinuti += segmentoLiveMinuti;
        } else if (aperto?.tipo === 'pausa') {
          pausaOggiMinuti += segmentoLiveMinuti;
        }

        return {
          ...u,
          stato,
          lavoroOggiMinuti,
          pausaOggiMinuti,
          segmentoCorrenteInizio,
          segmentoCorrenteTipo
        };
      }));
      
      res.json(enhancedUsers);
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

  // --- Route contatori per tipo ---
  app.get('/api/members/counts-by-type', isAuthenticated, async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT
          -- Partecipanti = soci (NULL o SOCIO)
          SUM(CASE WHEN participant_type IS NULL
            OR participant_type = 'SOCIO'
            THEN 1 ELSE 0 END) AS partecipanti,
          -- Staff = insegnanti + personal trainer
          SUM(CASE WHEN participant_type IN (
            'INSEGNANTE','PERSONAL_TRAINER')
            THEN 1 ELSE 0 END) AS staff,
          -- Team = dipendenti
          SUM(CASE WHEN participant_type =
            'DIPENDENTE'
            THEN 1 ELSE 0 END) AS team,
          -- Medici
          SUM(CASE WHEN participant_type
            LIKE '%MEDIC%'
            THEN 1 ELSE 0 END) AS medici,
          -- Totale generale
          COUNT(*) AS totale
        FROM members WHERE active = 1
      `);
      res.json((result[0] as unknown as any[])[0] || {
        partecipanti: 0, staff: 0,
        team: 0, medici: 0, totale: 0
      });
    } catch (e) {
      res.status(500).json({ error: String(e) });
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
      const { winnerId, loserId, fieldOverrides } = req.body;

      if (!winnerId || !loserId) {
        return res.status(400).json({ message: "Parametri di fusione non validi" });
      }

      await storage.mergeMembersAdvanced(winnerId, loserId, fieldOverrides || {});
      await logUserActivity(req, "MERGE", "members", winnerId.toString(), {
        action: `Uniti ID ${loserId} nel profilo principale ${winnerId}`
      });

      res.json({ success: true, message: "Anagrafiche unite con successo", winnerId });
    } catch (error: any) {
      console.error("[API Error] Failed to merge members:", error);
      res.status(500).json({ message: error.message || "Errore durante l'unione dei contatti" });
    }
  });

  app.post("/api/members/not-duplicate", isAuthenticated, checkPermission("/anagrafica_a_lista", "write"), async (req, res) => {
    try {
      const { id1, id2 } = req.body;
      if (!id1 || !id2) return res.status(400).json({ message: "Missing pairs" });
      
      const operator = req.user?.username || 'system';
      await storage.excludeDuplicatePair(id1, id2, operator);

      res.json({ success: true, message: "Coppia esclusa." });
    } catch (e: any) {
      console.error("Not duplicate exclusion failed:", e);
      res.status(500).json({ message: "Errore durante l'esclusione." });
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

  function isMinorAge(dob: string | Date | null): boolean {
    if (!dob) return false;
    const age = differenceInYears(new Date(), new Date(dob));
    return age < 18;
  }

  async function checkCF(cf: string, excludeId?: number) {
    const existing = await db.select()
      .from(schema.members)
      .where(
        and(
          eq(schema.members.fiscalCode, cf.toUpperCase()),
          ne(schema.members.id, excludeId || 0),
          eq(schema.members.active, true)
        )
      ).limit(1);

    if (existing.length === 0) {
      return { available: true };
    }
    return {
      available: false,
      conflict: {
        id: existing[0].id,
        name: existing[0].firstName + ' ' + existing[0].lastName,
        email: existing[0].email || null,
        phone: existing[0].phone || null,
        fiscalCode: existing[0].fiscalCode,
        membershipNumber: null 
      }
    };
  }

  async function checkEmail(email: string, isMinorParam: string | boolean, excludeId?: number) {
    const existing = await db.select()
      .from(schema.members)
      .where(
        and(
          eq(schema.members.email, email.toLowerCase()),
          ne(schema.members.id, excludeId || 0),
          eq(schema.members.active, true)
        )
      );

    if (existing.length === 0) {
      return { available: true };
    }

    if (isMinorParam === '1' || isMinorParam === true) {
      return {
        available: true,
        warning: 'email_famiglia',
        conflicts: existing.map(m => ({
          id: m.id,
          name: m.firstName + ' ' + m.lastName,
          isMinor: m.isMinor
        }))
      };
    }

    return {
      available: false,
      conflict: {
        id: existing[0].id,
        name: existing[0].firstName + ' ' + existing[0].lastName,
        email: existing[0].email,
        fiscalCode: existing[0].fiscalCode || null
      }
    };
  }

  async function checkPhone(phone: string, isMinorParam: string | boolean, excludeId?: number) {
    const normalized = phone.replace(/\s/g, '').replace(/^(\+39|0039)/, '');
    
    // Fetch potential matches containing the normalized digits
    const existingRaw = await db.select()
      .from(schema.members)
      .where(
        and(
          or(
            like(schema.members.phone, `%${normalized}%`),
            like(schema.members.mobile, `%${normalized}%`)
          ),
          ne(schema.members.id, excludeId || 0),
          eq(schema.members.active, true)
        )
      );

    const existing = existingRaw.filter(m => {
       const mPhone = (m.phone || '').replace(/\s/g, '').replace(/^(\+39|0039)/, '');
       const mMobile = (m.mobile || '').replace(/\s/g, '').replace(/^(\+39|0039)/, '');
       return (mPhone && mPhone === normalized) || (mMobile && mMobile === normalized);
    });

    if (existing.length === 0) {
      return { available: true };
    }

    if (isMinorParam === '1' || isMinorParam === true) {
      return {
        available: true,
        warning: 'telefono_famiglia',
        conflicts: existing.map(m => ({
          id: m.id,
          name: m.firstName + ' ' + m.lastName,
          isMinor: m.isMinor
        }))
      };
    }

    return {
      available: false,
      conflict: {
        id: existing[0].id,
        name: existing[0].firstName + ' ' + existing[0].lastName,
        phone: existing[0].phone || existing[0].mobile,
        fiscalCode: existing[0].fiscalCode || null
      }
    };
  }

  app.get("/api/members/check-cf", isAuthenticated, async (req, res) => {
    try {
      const { cf, excludeId } = req.query;
      if (!cf || typeof cf !== 'string') return res.json({ available: true });
      const result = await checkCF(cf, excludeId ? parseInt(excludeId as string) : undefined);
      res.json(result);
    } catch (e) {
      res.status(500).json({ available: true });
    }
  });

  app.get("/api/members/check-email", isAuthenticated, async (req, res) => {
    try {
      const { email, isMinor, excludeId } = req.query;
      if (!email || typeof email !== 'string') return res.json({ available: true });
      const result = await checkEmail(email, isMinor as string, excludeId ? parseInt(excludeId as string) : undefined);
      res.json(result);
    } catch (e) {
      res.status(500).json({ available: true });
    }
  });

  app.get("/api/members/check-phone", isAuthenticated, async (req, res) => {
    try {
      const { phone, isMinor, excludeId } = req.query;
      if (!phone || typeof phone !== 'string') return res.json({ available: true });
      const result = await checkPhone(phone, isMinor as string, excludeId ? parseInt(excludeId as string) : undefined);
      res.json(result);
    } catch (e) {
      res.status(500).json({ available: true });
    }
  });

  app.get("/api/members/export-csv", isAuthenticated, checkPermission("/anagrafica_a_lista", "read"), async (req, res) => {
    try {
      const sep = req.query.sep === 'comma' ? ',' : ';';
      
      const activeMembers = await db.select()
        .from(schema.members)
        .where(eq(schema.members.active, true))
        .orderBy(schema.members.lastName, schema.members.firstName);

      const header = [
        "id", "fiscal_code", "last_name", "first_name",
        "gender", "date_of_birth", "place_of_birth",
        "birth_province", "birth_nation",
        "email", "secondary_email", "phone", "mobile",
        "street_address", "city", "province", "postal_code",
        "country", "region", "nationality",
        "is_minor", "mother_first_name", "mother_last_name",
        "mother_fiscal_code", "mother_email", "mother_phone",
        "tutor1_fiscal_code", "tutor1_phone", "tutor1_email",
        "tutor2_fiscal_code", "tutor2_phone", "tutor2_email",
        "has_medical_certificate", "medical_certificate_expiry",
        "privacy_accepted", "privacy_date", "consent_image",
        "consent_marketing", "consent_newsletter",
        "document_type", "document_expiry",
        "enrollment_status", "season", "participant_type",
        "internal_id", "insertion_date",
        "health_notes", "food_alerts", "tags", "profession",
        "admin_notes", "notes",
        "residence_permit", "residence_permit_expiry",
        "active", "created_at"
      ];

      const toCsvField = (val: any) => {
        if (val === null || val === undefined) return '""';
        let str = String(val);
        if (val instanceof Date) str = val.toISOString().split('T')[0];
        if (typeof val === 'boolean') str = val ? "1" : "0";
        return `"${str.replace(/"/g, '""')}"`;
      };

      const rows = activeMembers.map(m => [
        m.id, m.fiscalCode, m.lastName, m.firstName,
        m.gender, m.dateOfBirth, m.placeOfBirth,
        m.birthProvince, m.birthNation,
        m.email, m.secondaryEmail, m.phone, m.mobile,
        m.streetAddress, m.city, m.province, m.postalCode,
        m.country, m.region, m.nationality,
        m.isMinor, m.motherFirstName, m.motherLastName,
        m.motherFiscalCode, m.motherEmail, m.motherPhone,
        m.tutor1FiscalCode, m.tutor1Phone, m.tutor1Email,
        m.tutor2FiscalCode, m.tutor2Phone, m.tutor2Email,
        m.hasMedicalCertificate, m.medicalCertificateExpiry,
        m.privacyAccepted, m.privacyDate, m.consentImage,
        m.consentMarketing, m.consentNewsletter,
        m.documentType, m.documentExpiry,
        m.enrollmentStatus, m.season, m.participantType,
        m.internalId, m.insertionDate,
        m.healthNotes, m.foodAlerts, m.tags, m.profession,
        m.adminNotes, m.notes,
        m.residencePermit, m.residencePermitExpiry,
        m.active, m.createdAt
      ].map(toCsvField).join(sep));

      const csvContent = [header.join(sep), ...rows].join("\n");
      const bom = "\uFEFF";
      const dateStr = new Date().toISOString().split('T')[0];
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="members_${dateStr}.csv"`);
      res.send(bom + csvContent);
    } catch (e) {
      console.error('Error generating CSV:', e);
      res.status(500).send("Error generating CSV");
    }
  });

  app.get("/api/members/export-csv-light", isAuthenticated, checkPermission("/anagrafica_a_lista", "read"), async (req, res) => {
    try {
      const sep = req.query.sep === 'comma' ? ',' : ';';
      
      const activeMembers = await db.select()
        .from(schema.members)
        .where(eq(schema.members.active, true))
        .orderBy(schema.members.lastName, schema.members.firstName);

      const header = [
        "ID", "Codice Fiscale", "Cognome", "Nome", "Sesso",
        "Data Nascita", "Luogo Nascita", "Email", "Telefono",
        "Cellulare", "Indirizzo", "Città", "Provincia", "CAP",
        "Nazionalità", "Minore",
        "Nome Tutore 1", "CF Tutore 1", "Tel Tutore 1",
        "N. Tessera", "Scad. Tessera",
        "Scad. Cert. Medico", "Consenso Immagine",
        "Stato Iscrizione", "Note"
      ];

      const toCsvField = (val: any) => {
        if (val === null || val === undefined) return '""';
        let str = String(val);
        if (val instanceof Date) str = val.toISOString().split('T')[0];
        if (typeof val === 'boolean') str = val ? "Sì" : "No";
        return `"${str.replace(/"/g, '""')}"`;
      };

      const rows = activeMembers.map(m => [
        m.id, m.fiscalCode, m.lastName, m.firstName, m.gender,
        m.dateOfBirth, m.placeOfBirth, m.email, m.phone,
        m.mobile, m.streetAddress, m.city, m.province, m.postalCode,
        m.nationality, m.isMinor,
        m.motherFirstName ? `${m.motherFirstName} ${m.motherLastName || ''}`.trim() : (m.tutor1Email ? "Tutore 1" : ""), 
        m.motherFiscalCode || m.tutor1FiscalCode, 
        m.motherPhone || m.tutor1Phone,
        m.cardNumber, m.cardExpiryDate,
        m.medicalCertificateExpiry, m.consentImage,
        m.enrollmentStatus, m.notes
      ].map(toCsvField).join(sep));

      const csvContent = [header.join(sep), ...rows].join("\n");
      const bom = "\uFEFF";
      const dateStr = new Date().toISOString().split('T')[0];
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="members_light_${dateStr}.csv"`);
      res.send(bom + csvContent);
    } catch (e) {
      console.error('Error generating CSV (light):', e);
      res.status(500).send("Error generating CSV");
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

      // Validazione Server-Side Duplicati (CF, Email, Telefono)
      if (normalizedData.fiscalCode) {
        const cfConflict = await checkCF(normalizedData.fiscalCode);
        if (!cfConflict.available) {
          return res.status(409).json({
            error: 'CF_DUPLICATO',
            message: 'Codice fiscale già presente',
            conflict: cfConflict.conflict
          });
        }
      }

      if (normalizedData.email && !isMinorAge(normalizedData.dateOfBirth)) {
        const emailConflict = await checkEmail(normalizedData.email, false);
        if (!emailConflict.available) {
          return res.status(409).json({
            error: 'EMAIL_DUPLICATA',
            message: 'Email già associata ad altro socio',
            conflict: emailConflict.conflict
          });
        }
      }

      const phoneToCheck = normalizedData.mobile || normalizedData.phone;
      if (phoneToCheck && !isMinorAge(normalizedData.dateOfBirth)) {
        const phoneConflict = await checkPhone(phoneToCheck, false);
        if (!phoneConflict.available) {
          return res.status(409).json({
            error: 'TELEFONO_DUPLICATO',
            message: 'Telefono già associato ad altro socio',
            conflict: phoneConflict.conflict
          });
        }
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

      // Validazione Server-Side Duplicati (CF, Email, Telefono)
      if (normalizedData.fiscalCode) {
        const cfConflict = await checkCF(normalizedData.fiscalCode, id); // pass ID for PATCH
        if (!cfConflict.available) {
          return res.status(409).json({
            error: 'CF_DUPLICATO',
            message: 'Codice fiscale già presente',
            conflict: cfConflict.conflict
          });
        }
      }

      if (normalizedData.email && !isMinorAge(normalizedData.dateOfBirth)) {
        const emailConflict = await checkEmail(normalizedData.email, false, id);
        if (!emailConflict.available) {
          return res.status(409).json({
            error: 'EMAIL_DUPLICATA',
            message: 'Email già associata ad altro socio',
            conflict: emailConflict.conflict
          });
        }
      }

      const patchPhoneToCheck = normalizedData.mobile || normalizedData.phone;
      if (patchPhoneToCheck && !isMinorAge(normalizedData.dateOfBirth)) {
        const phoneConflict = await checkPhone(patchPhoneToCheck, false, id);
        if (!phoneConflict.available) {
          return res.status(409).json({
            error: 'TELEFONO_DUPLICATO',
            message: 'Telefono già associato ad altro socio',
            conflict: phoneConflict.conflict
          });
        }
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
    res.setHeader('X-Deprecation-Warning', 'instructors table being removed. Use /api/members');
    try {
      const instructors = await storage.getInstructors();
      res.json(instructors);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch instructors" });
    }
  });

  app.post("/api/instructors", isAuthenticated, async (req, res) => {
    console.warn('[⚠️ DEPRECATION] Scrittura su /api/instructors — tabella in smantellamento. Usare /api/members. Ref: F2-010 · 13/04/2026');
    res.setHeader('X-Deprecation-Warning', 'instructors table being removed. Use /api/members');
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
    console.warn('[⚠️ DEPRECATION] Scrittura su /api/instructors — tabella in smantellamento. Usare /api/members. Ref: F2-010 · 13/04/2026');
    res.setHeader('X-Deprecation-Warning', 'instructors table being removed. Use /api/members');
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
    console.warn('[⚠️ DEPRECATION] Scrittura su /api/instructors — tabella in smantellamento. Usare /api/members. Ref: F2-010 · 13/04/2026');
    res.setHeader('X-Deprecation-Warning', 'instructors table being removed. Use /api/members');
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
      const seasonIdParam = req.query.seasonId as string | undefined;
      // "all"    → nessun filtro stagione
      // "active" → usa stagione attiva (come se non fosse passato)
      // numero   → stagione specifica
      const seasonId = (seasonIdParam && seasonIdParam !== "all" && seasonIdParam !== "active")
        ? parseInt(seasonIdParam)
        : null;
      const activityType = req.query.activityType ? (req.query.activityType as string) : undefined;
      let coursesList;
        const activeSeason = await storage.getActiveSeason();
        const targetSeasonId = seasonIdParam === "all" ? null : (seasonId || activeSeason?.id);

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

      // [BACKEND] Remove slot conflict check - save always
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

      // [BACKEND] Remove slot conflict check - save always
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
      const typeParam = req.query.type as string | undefined;
      const activityTypeParam = req.query.activityType as string | undefined;
      let activityType = activityTypeParam || typeParam;
      if (activityType === 'corsi') activityType = 'course';
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

// ─── GEMPASS PUBLIC ROUTES ───────────────────────────────────────────────────
app.get("/api/public/membership-status/:code", async (req, res) => {
  try {
    const { code } = req.params;
    if (!code) return res.status(400).json({ error: 'Codice mancante' });

    const memberships = await db
      .select({
        status: schema.memberships.status,
        expiryDate: schema.memberships.expiryDate,
        membershipType: schema.memberships.membershipType,
        firstName: schema.members.firstName,
        lastName: schema.members.lastName
      })
      .from(schema.memberships)
      .innerJoin(schema.members, eq(schema.memberships.memberId, schema.members.id))
      .where(
        sql`${schema.memberships.membershipNumber} = ${code} OR ${schema.memberships.barcode} = ${code}`
      )
      .limit(1);

    if (memberships.length === 0) {
      return res.status(404).json({ error: 'Tessera non trovata' });
    }

    const m = memberships[0];
    return res.json({
      status: m.status,
      expiryDate: m.expiryDate ? new Date(m.expiryDate).toISOString().split('T')[0] : null,
      membershipType: m.membershipType,
      member: `${m.firstName} ${m.lastName}`
    });
  } catch (error) {
    console.error('[GemPass Public] GET error:', error);
    return res.status(500).json({ error: 'Errore interno' });
  }
});

// ─── GEMPASS ROUTES ──────────────────────────────────────────────────────────

app.get("/api/gempass/tessere", isAuthenticated, async (req, res) => {
  try {
    const { status, membership_type, search } = req.query;
    const all = await storage.getMembershipsWithMembers();
    let result: any[] = Array.isArray(all) ? all : [];

    if (status) {
      result = result.filter((m: any) => m.status === status);
    }
    if (membership_type) {
      result = result.filter((m: any) => m.membershipType === membership_type);
    }
    if (search) {
      const s = String(search).toLowerCase();
      result = result.filter((m: any) =>
        m.membershipNumber?.toLowerCase().includes(s) ||
        m.lastName?.toLowerCase().includes(s) ||
        m.firstName?.toLowerCase().includes(s) ||
        m.fiscalCode?.toLowerCase().includes(s)
      );
    }
    return res.json(result);
  } catch (error) {
    console.error('[GemPass] GET /tessere error:', error);
    return res.status(500).json({ error: 'Errore nel recupero tessere' });
  }
});

app.get("/api/gempass/tessere/:id", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID non valido' });
    const all = await storage.getMembershipsWithMembers();
    const found = all.find((m: any) => m.id === id);
    if (!found) return res.status(404).json({ error: 'Tessera non trovata' });
    return res.json(found);
  } catch (error) {
    console.error('[GemPass] GET /tessere/:id error:', error);
    return res.status(500).json({ error: 'Errore nel recupero tessera' });
  }
});

app.post("/api/gempass/tessere", isAuthenticated, async (req, res) => {
  try {
    const {
      member_id, membership_type, season_competence,
      season_start_year, season_end_year, fee, notes
    } = req.body;

    let resolvedMemberId = member_id ? parseInt(member_id) : null;

    // Se member_id è null → crea nuovo membro da anagrafica
    if (!resolvedMemberId && req.body.anagrafica) {
      const an = req.body.anagrafica;
      if (!an.codiceFiscale || !an.cognome || !an.nome) {
        return res.status(400).json({
          error: 'Per nuovo membro: codiceFiscale, cognome e nome sono obbligatori'
        });
      }

      // Verifica se CF già esiste
      const existingMember = await db
        .select()
        .from(schema.members)
        .where(eq(schema.members.fiscalCode, an.codiceFiscale.toUpperCase()))
        .limit(1);

      if (existingMember.length > 0) {
        resolvedMemberId = existingMember[0].id;
      } else {
        // Crea nuovo membro
        const newMember = await storage.createMember({
          firstName: an.nome,
          lastName: an.cognome,
          fiscalCode: an.codiceFiscale.toUpperCase(),
          email: an.email ?? null,
          phone: an.cellulare ?? null,
          dateOfBirth: an.dataNascita ? new Date(an.dataNascita) : null,
          placeOfBirth: an.natoA ?? null,
          participantType: 'ALLIEVO',
        });
        resolvedMemberId = newMember.id;
      }
    }

    if (!resolvedMemberId) {
      return res.status(400).json({ error: 'Impossibile determinare il membro' });
    }

    if (!season_competence) {
      return res.status(400).json({
        error: 'season_competence è obbligatorio'
      });
    }

    const { generateMembershipNumber, calculateMembershipExpiry } =
      await import('./utils/membership.js');

    const membershipNumber = generateMembershipNumber(
      season_competence, resolvedMemberId
    );

    // Verifica unicità
    const existing = await db
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.membershipNumber, membershipNumber))
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({
        error: `Tessera ${membershipNumber} già esistente per questo socio in questa stagione`
      });
    }

    const expiryDate = calculateMembershipExpiry(season_competence);
    const feeAmount = fee ?? (membership_type === 'minore' ? '15.00' : '25.00');
    const today = new Date().toISOString().split('T')[0];

    const insertValue = {
        memberId: resolvedMemberId,
        membershipNumber,
        barcode: membershipNumber,
        membershipType: membership_type ?? 'adulto',
        seasonCompetence: season_competence,
        seasonStartYear: season_start_year ?? null,
        seasonEndYear: season_end_year ?? null,
        issueDate: new Date(today),
        expiryDate: new Date(expiryDate.toISOString().split('T')[0]),
        status: 'active',
        fee: feeAmount,
        isRenewal: false,
        notes: notes ?? null,
    };
    
    await db
      .insert(schema.memberships)
      .values(insertValue);

    return res.status(201).json({
      success: true,
      membershipNumber,
      expiryDate: expiryDate.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('[GemPass] POST /tessere error:', error);
    return res.status(500).json({ error: 'Errore nella creazione tessera' });
  }
});

app.patch("/api/gempass/tessere/:id/rinnova", isAuthenticated, async (req, res) => {
  try {
    const oldId = parseInt(req.params.id);
    if (isNaN(oldId)) return res.status(400).json({ error: 'ID non valido' });

    const { season_competence, season_start_year, season_end_year } = req.body;
    if (!season_competence) {
      return res.status(400).json({ error: 'season_competence obbligatorio' });
    }

    const all = await storage.getMembershipsWithMembers();
    const oldRecord: any = all.find((m: any) => m.id === oldId);
    if (!oldRecord) return res.status(404).json({ error: 'Tessera non trovata' });

    const { generateMembershipNumber, calculateMembershipExpiry } =
      await import('./utils/membership.js');

    const newNumber = generateMembershipNumber(
      season_competence, oldRecord.memberId
    );
    const newExpiry = calculateMembershipExpiry(season_competence);
    const feeAmount = oldRecord.membershipType === 'minore' ? '15.00' : '25.00';
    const today = new Date().toISOString().split('T')[0];

    const insertValue = {
        memberId: oldRecord.memberId,
        membershipNumber: newNumber,
        barcode: newNumber,
        membershipType: oldRecord.membershipType,
        seasonCompetence: season_competence,
        seasonStartYear: season_start_year ?? null,
        seasonEndYear: season_end_year ?? null,
        issueDate: new Date(today),
        expiryDate: new Date(newExpiry.toISOString().split('T')[0]),
        status: 'active',
        fee: feeAmount,
        isRenewal: true,
        renewedFromId: oldId,
        previousMembershipNumber: oldRecord.membershipNumber,
    };
    
    await db
      .insert(schema.memberships)
      .values(insertValue);

    await db
      .update(schema.memberships)
      .set({ status: 'expired' })
      .where(eq(schema.memberships.id, oldId));

    return res.status(201).json({
      success: true,
      membershipNumber: newNumber,
      expiryDate: newExpiry.toISOString().split('T')[0],
      renewedFromId: oldId
    });
  } catch (error) {
    console.error('[GemPass] PATCH /rinnova error:', error);
    return res.status(500).json({ error: 'Errore nel rinnovo tessera' });
  }
});

// Registra firma documento
app.post("/api/gempass/firme", isAuthenticated, async (req, res) => {
  try {
    const {
      member_id, form_type, form_version,
      season_id, payload_data, signed_at
    } = req.body;

    if (!member_id || !form_type) {
      return res.status(400).json({
        error: 'member_id e form_type sono obbligatori'
      });
    }

    // Verifica se già firmato per questa stagione
    const existing = await db
      .select()
      .from(schema.memberFormsSubmissions)
      .where(
        and(
          eq(schema.memberFormsSubmissions.memberId, parseInt(member_id)),
          eq(schema.memberFormsSubmissions.formType, form_type),
          season_id
            ? eq(schema.memberFormsSubmissions.seasonId, parseInt(season_id))
            : sql`1=1`
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Aggiorna invece di duplicare
      await db
        .update(schema.memberFormsSubmissions)
        .set({
          payloadData: payload_data ?? null,
          signedAt: signed_at ? new Date(signed_at) : new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.memberFormsSubmissions.id, existing[0].id));
      
      return res.json({ success: true, action: 'updated', id: existing[0].id });
    }

    const result = await db
      .insert(schema.memberFormsSubmissions)
      .values({
        memberId: parseInt(member_id),
        formType: form_type,
        formVersion: form_version ?? '2025-06-30',
        seasonId: season_id ? parseInt(season_id) : null,
        payloadData: payload_data ?? null,
        signedAt: signed_at ? new Date(signed_at) : new Date(),
        createdBy: (req as any).user?.id && !isNaN(parseInt((req as any).user.id)) ? parseInt((req as any).user.id) : null,
      });

    return res.status(201).json({
      success: true,
      action: 'created',
      id: result[0]?.insertId ?? null
    });
  } catch (error: any) {
    console.error('[GemPass] POST /firme error:', error);
    return res.status(500).json({ error: 'Errore nel salvataggio firma: ' + (error.message || String(error)) });
  }
});

// Recupera firme per membro (opzionalmente filtrate per stagione)
app.get("/api/gempass/firme/:memberId", isAuthenticated, async (req, res) => {
  try {
    const memberId = parseInt(req.params.memberId);
    if (isNaN(memberId)) return res.status(400).json({ error: 'ID non valido' });

    const { season_id } = req.query;

    const firme = await db
      .select()
      .from(schema.memberFormsSubmissions)
      .where(
        and(
          eq(schema.memberFormsSubmissions.memberId, memberId),
          season_id
            ? eq(schema.memberFormsSubmissions.seasonId, parseInt(String(season_id)))
            : sql`1=1`
        )
      )
      .orderBy(schema.memberFormsSubmissions.signedAt);
      
    return res.json(firme);
  } catch (error) {
    console.error('[GemPass] GET /firme/:memberId error:', error);
    return res.status(500).json({ error: 'Errore nel recupero firme' });
  }
});

app.get("/api/gempass/firme-all", isAuthenticated, async (req, res) => {
  try {
    const { season_id, form_type } = req.query;

    const conditions = [];
    if (season_id) conditions.push(eq(schema.memberFormsSubmissions.seasonId, parseInt(season_id as string)));
    if (form_type) conditions.push(eq(schema.memberFormsSubmissions.formType, form_type as string));

    const query = db
      .select({
        id: schema.memberFormsSubmissions.id,
        memberId: schema.memberFormsSubmissions.memberId,
        seasonId: schema.memberFormsSubmissions.seasonId,
        formType: schema.memberFormsSubmissions.formType,
        formVersion: schema.memberFormsSubmissions.formVersion,
        signedAt: schema.memberFormsSubmissions.signedAt,
        payloadData: schema.memberFormsSubmissions.payloadData,
        memberFirstName: schema.members.firstName,
        memberLastName: schema.members.lastName
      })
      .from(schema.memberFormsSubmissions)
      .leftJoin(schema.members, eq(schema.memberFormsSubmissions.memberId, schema.members.id))
      .orderBy(desc(schema.memberFormsSubmissions.signedAt));

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const forms = await query;
    return res.json(forms);
  } catch (error) {
    console.error('[GemPass] GET /firme-all error:', error);
    return res.status(500).json({ error: 'Errore nel recupero totale firme' });
  }
});

app.get("/api/gempass/membro/:memberId/tessera", isAuthenticated, async (req, res) => {
  try {
    const memberId = parseInt(req.params.memberId);
    if (isNaN(memberId)) return res.status(400).json({ error: 'memberId non valido' });

    const tesseraData = await db
      .select({
        id: schema.memberships.id,
        membershipNumber: schema.memberships.membershipNumber,
        membershipType: schema.memberships.membershipType,
        seasonCompetence: schema.memberships.seasonCompetence,
        expiryDate: schema.memberships.expiryDate,
        status: schema.memberships.status,
        fee: schema.memberships.fee
      })
      .from(schema.memberships)
      .where(
        and(
          eq(schema.memberships.memberId, memberId),
          eq(schema.memberships.status, 'active')
        )
      )
      .orderBy(desc(schema.memberships.createdAt))
      .limit(1);

    if (tesseraData.length === 0) {
      return res.status(200).json({ tessera: null });
    }

    return res.json({ tessera: tesseraData[0] });
  } catch (error) {
    console.error('[GemPass] GET /membro/:memberId/tessera error:', error);
    return res.status(500).json({ error: 'Errore nel recupero tessera membro' });
  }
});

// ─── FINE GEMPASS ROUTES ─────────────────────────────────────────────────────

// ===== GEMSTAFF ROUTES =====

app.post("/api/gemstaff/crea-account/:memberId", isAuthenticated, async (req, res) => {
  try {
    const userRole = (req.user as any)?.role?.toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'direzione' || userRole === 'super admin' || userRole === 'master' || userRole === 'amministratore totale';

    if (!isAdmin) {
      return res.status(403).json({ error: 'Non autorizzato. Solo admin.' });
    }

    const memberId = parseInt(req.params.memberId);
    if (isNaN(memberId)) return res.status(400).json({ error: 'ID non valido' });

    const { eq, and, like } = await import('drizzle-orm');
    
    // 1. Leggi member
    const [member] = await db.select().from(schema.members)
      .where(
        and(
          eq(schema.members.id, memberId),
          like(schema.members.participantType, '%INSEGNANTE%')
        )
      ).limit(1);

    if (!member) {
      return res.status(404).json({ error: 'Insegnante non trovato' });
    }
    if (!member.email) {
      return res.status(400).json({ error: "L'insegnante non ha un indirizzo email" });
    }

    // 2. Verifica che non esista già un account
    const [existingUser] = await db.select().from(schema.users)
      .where(eq(schema.users.email, member.email)).limit(1);
      
    if (existingUser) {
      return res.status(409).json({ error: 'Account già esistente per questa email' });
    }

    // 3. Genera OTP temporaneo (6 cifre)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h

    // 4. Hash password e Crea user
    const { hashPassword } = await import("./auth");
    const hashedPassword = await hashPassword(otp);

    // Schema users usa id string UUID generato lato app
    const { randomUUID } = await import('crypto');
    const newUserId = randomUUID();
    
    await db.insert(schema.users).values({
      id: newUserId,
      email: member.email,
      username: member.email,
      role: 'insegnante',
      firstName: member.firstName,
      lastName: member.lastName,
      password: hashedPassword,
      emailVerified: false,
      otpToken: otp,
      otpExpiresAt: otpExpires
    });

    // 5. Collega member a user
    await db.update(schema.members)
      .set({ userId: newUserId })
      .where(eq(schema.members.id, memberId));

    // 6. Log attività
    await storage.logActivity({
      userId: (req.user as any).id,
      action: "CREATE",
      entityType: "users",
      entityId: newUserId,
      details: { role: 'insegnante', memberId: memberId }
    });

    // Invia email di benvenuto
    try {
      const { sendWelcomeEmail } = await import("./utils/mailer");
      await sendWelcomeEmail(member.email, member.firstName || member.email, otp);
    } catch(e) {
      console.warn('[MAILER] Email non inviata:', e);
    }

    // 7. Restituisce
    return res.json({
      success: true,
      userId: newUserId,
      email: member.email,
      tempCode: otp,
      message: "Account creato. Credenziali da comunicare all'insegnante."
    });
  } catch (error) {
    console.error('[GemStaff] /crea-account error:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});


app.get("/api/gemstaff/me", isAuthenticated, async (req, res) => {
  try {
    const userRole = (req.user as any)?.role?.toLowerCase();
    const userEmail = (req.user as any)?.email;
    const userId = (req.user as any)?.id;
    const isAllowed = userRole === 'insegnante' || userRole === 'admin' || userRole === 'direzione' || userRole === 'super admin' || userRole === 'master' || userRole === 'amministratore totale';

    if (!isAllowed) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    if (!userEmail && !userId) {
      return res.status(404).json({ error: 'Profilo insegnante non associato ad alcun account.' });
    }

    const { eq, and, or, like, sql } = await import('drizzle-orm');
    
    // Priorità 1: user_id esatto
    // Priorità 2: email match
    const accountFilter = [];
    if (userId) accountFilter.push(eq(schema.members.userId, userId));
    if (userEmail) accountFilter.push(eq(schema.members.email, userEmail));

    const [member] = await db.select()
      .from(schema.members)
      .where(
        and(
          or(...accountFilter),
          or(
            like(schema.members.participantType, '%INSEGNANTE%'),
            like(schema.members.participantType, '%Staff%')
          )
        )
      ).limit(1);

    if (!member) {
      return res.status(404).json({ error: 'Profilo insegnante non trovato. Contatta la segreteria.' });
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const [presenze, compliance, payslips, memberships] = await Promise.all([
      db.select()
        .from(schema.staffPresenze)
        .where(and(
          eq(schema.staffPresenze.memberId, member.id),
          sql`MONTH(${schema.staffPresenze.date}) = ${currentMonth}`,
          sql`YEAR(${schema.staffPresenze.date}) = ${currentYear}`
        )),
      db.select()
        .from(schema.staffContractsCompliance)
        .where(eq(schema.staffContractsCompliance.memberId, member.id)),
      db.select()
        .from(schema.payslips)
        .where(and(
          eq(schema.payslips.memberId, member.id),
          eq(schema.payslips.month, currentMonth),
          eq(schema.payslips.year, currentYear)
        )),
      db.select()
        .from(schema.memberships)
        .where(eq(schema.memberships.memberId, member.id))
    ]);

    return res.json({
      ...member,
      presenze,
      compliance,
      payslips,
      memberships
    });
  } catch (error) {
    console.error('[GemStaff] GET /me error:', error);
    return res.status(500).json({ error: 'Errore interno' });
  }
});


app.get("/api/gemstaff/insegnanti", isAuthenticated, async (req, res) => {
  try {
    const status = (req.query.status as string) || 'attivo';
    const query = db
      .select({
        id: schema.members.id,
        firstName: schema.members.firstName,
        lastName: schema.members.lastName,
        email: schema.members.email,
        phone: schema.members.phone,
        participantType: schema.members.participantType,
        staffStatus: schema.members.staffStatus,
        lezioniPrivateAutorizzate: schema.members.lezioniPrivateAutorizzate,
        lezioniPrivateAutorizzateAt: schema.members.lezioniPrivateAutorizzateAt,
        lezioniPrivateAutorizzateBy: schema.members.lezioniPrivateAutorizzateBy,
        lezioniPrivateNote: schema.members.lezioniPrivateNote,
      })
      .from(schema.members)
      .where(
        and(
          or(
            like(schema.members.participantType, '%INSEGNANTE%'),
            like(schema.members.participantType, '%Staff%')
          ),
          eq(schema.members.staffStatus, status as any)
        )
      );

    const result = await query;
    return res.json(result);
  } catch (error) {
    console.error('[GemStaff] GET /insegnanti error:', error);
    return res.status(500).json({ error: 'Errore interno' });
  }
});

app.get("/api/gemstaff/insegnanti/:id", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID non valido' });

    const memberData = await db
      .select()
      .from(schema.members)
      .where(eq(schema.members.id, id))
      .limit(1);

    if (memberData.length === 0) return res.status(404).json({ error: 'Membro non trovato' });

    const compliance = await db
      .select()
      .from(schema.staffContractsCompliance)
      .where(eq(schema.staffContractsCompliance.memberId, id));

    const signatures = await db
      .select()
      .from(schema.staffDocumentSignatures)
      .where(eq(schema.staffDocumentSignatures.memberId, id));

    const tessere = await db
      .select({
        numero: schema.memberships.membershipNumber,
        stato: schema.memberships.status,
        scadenza: schema.memberships.expiryDate,
        stagione: schema.memberships.seasonCompetence
      })
      .from(schema.memberships)
      .where(
        and(
          eq(schema.memberships.memberId, id),
          eq(schema.memberships.status, 'active')
        )
      )
      .orderBy(desc(schema.memberships.createdAt))
      .limit(1);

    const tessera = tessere.length > 0 ? tessere[0] : null;

    return res.json({
      profile: memberData[0],
      compliance,
      signatures,
      tessera
    });
  } catch (error) {
    console.error('[GemStaff] GET /insegnanti/:id error:', error);
    return res.status(500).json({ error: 'Errore interno' });
  }
});

app.patch("/api/gemstaff/insegnanti/:id", isAuthenticated, async (req, res) => {
  try {
    const role = (req.user as any)?.role;
    if (role !== 'admin' && role !== 'operator') {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID non valido' });

    const { 
      staffStatus, 
      lezioniPrivateAutorizzate, 
      lezioniPrivateAutorizzateAt, 
      lezioniPrivateAutorizzateBy, 
      lezioniPrivateNote 
    } = req.body;
    
    const updates: any = {};
    if (staffStatus !== undefined) updates.staffStatus = staffStatus;
    if (lezioniPrivateAutorizzate !== undefined) updates.lezioniPrivateAutorizzate = lezioniPrivateAutorizzate;
    if (lezioniPrivateAutorizzateAt !== undefined) updates.lezioniPrivateAutorizzateAt = lezioniPrivateAutorizzateAt ? new Date(lezioniPrivateAutorizzateAt) : null;
    if (lezioniPrivateAutorizzateBy !== undefined) updates.lezioniPrivateAutorizzateBy = lezioniPrivateAutorizzateBy;
    if (lezioniPrivateNote !== undefined) updates.lezioniPrivateNote = lezioniPrivateNote;

    if (Object.keys(updates).length > 0) {
      await db.update(schema.members).set(updates).where(eq(schema.members.id, id));
    }

    const updatedMember = await db
      .select()
      .from(schema.members)
      .where(eq(schema.members.id, id))
      .limit(1);

    if (updatedMember.length === 0) {
       return res.status(404).json({ error: 'Membro non trovato' });
    }

    return res.json(updatedMember[0]);
  } catch (error) {
    console.error('[GemStaff] PATCH /insegnanti/:id error:', error);
    return res.status(500).json({ error: 'Errore interno' });
  }
});

app.get("/api/gemstaff/pt", isAuthenticated, async (req, res) => {
  try {
    const status = (req.query.status as string) || 'attivo';
    const query = db
      .select({
        id: schema.members.id,
        firstName: schema.members.firstName,
        lastName: schema.members.lastName,
        email: schema.members.email,
        phone: schema.members.phone,
        participantType: schema.members.participantType,
        staffStatus: schema.members.staffStatus,
        lezioniPrivateAutorizzate: schema.members.lezioniPrivateAutorizzate,
        lezioniPrivateAutorizzateAt: schema.members.lezioniPrivateAutorizzateAt,
        lezioniPrivateAutorizzateBy: schema.members.lezioniPrivateAutorizzateBy,
        lezioniPrivateNote: schema.members.lezioniPrivateNote,
      })
      .from(schema.members)
      .where(
        and(
          // @ts-ignore // TODO: STI-cleanup
          or(
            eq(schema.members.participantType, 'PT'),
            eq(schema.members.participantType, 'PERSONAL_TRAINER')
          ),
          eq(schema.members.staffStatus, status as any)
        )
      );

    const result = await query;
    return res.json(result);
  } catch (error) {
    console.error('[GemStaff] GET /pt error:', error);
    return res.status(500).json({ error: 'Errore interno' });
  }
});

app.get("/api/gemstaff/compliance/:memberId", isAuthenticated, async (req, res) => {
  try {
    const memberId = parseInt(req.params.memberId);
    if (isNaN(memberId)) return res.status(400).json({ error: 'memberId non valido' });

    const compliance = await db
      .select()
      .from(schema.staffContractsCompliance)
      .where(eq(schema.staffContractsCompliance.memberId, memberId));

    return res.json(compliance);
  } catch (error) {
    console.error('[GemStaff] GET /compliance error:', error);
    return res.status(500).json({ error: 'Errore interno' });
  }
});

app.post("/api/gemstaff/compliance/:memberId", isAuthenticated, async (req, res) => {
  try {
    const role = (req.user as any)?.role;
    if (role !== 'admin' && role !== 'operator') {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    const memberId = parseInt(req.params.memberId);
    if (isNaN(memberId)) return res.status(400).json({ error: 'memberId non valido' });

    const { doc_type, doc_value, has_doc, expires_at, notes } = req.body;
    if (!doc_type) return res.status(400).json({ error: 'doc_type è obbligatorio' });

    const existing = await db
      .select()
      .from(schema.staffContractsCompliance)
      .where(
        and(
          eq(schema.staffContractsCompliance.memberId, memberId),
          eq(schema.staffContractsCompliance.docType, doc_type)
        )
      ).limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.staffContractsCompliance)
        .set({
          docValue: doc_value ?? null,
          hasDoc: has_doc ?? false,
          expiresAt: expires_at ? new Date(expires_at) : null,
          notes: notes ?? null,
        })
        .where(eq(schema.staffContractsCompliance.id, existing[0].id));
      return res.json({ success: true, action: 'updated', id: existing[0].id });
    } else {
      const result = await db
        .insert(schema.staffContractsCompliance)
        .values({
          memberId,
          docType: doc_type,
          docValue: doc_value ?? null,
          hasDoc: has_doc ?? false,
          expiresAt: expires_at ? new Date(expires_at) : null,
          notes: notes ?? null,
        });
      return res.status(201).json({ success: true, action: 'created', id: result[0]?.insertId });
    }
  } catch (error) {
    console.error('[GemStaff] POST /compliance error:', error);
    return res.status(500).json({ error: 'Errore interno' });
  }
});

app.get("/api/gemstaff/firme/:memberId", isAuthenticated, async (req, res) => {
  try {
    const memberId = parseInt(req.params.memberId);
    if (isNaN(memberId)) return res.status(400).json({ error: 'memberId non valido' });

    const firme = await db
      .select()
      .from(schema.staffDocumentSignatures)
      .where(eq(schema.staffDocumentSignatures.memberId, memberId))
      .orderBy(schema.staffDocumentSignatures.signedAt);

    return res.json(firme);
  } catch (error) {
    console.error('[GemStaff] GET /firme error:', error);
    return res.status(500).json({ error: 'Errore interno' });
  }
});

app.post("/api/gemstaff/firme", isAuthenticated, async (req, res) => {
  try {
    const role = (req.user as any)?.role;
    if (role !== 'admin' && role !== 'operator') {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    const { member_id, doc_type, doc_version, signed_at, signed_by, method, notes } = req.body;
    if (!member_id || !doc_type || !doc_version || !signed_at || !signed_by) {
      return res.status(400).json({ error: 'Campi obbligatori mancanti' });
    }

    const result = await db
      .insert(schema.staffDocumentSignatures)
      .values({
        memberId: parseInt(member_id),
        docType: doc_type,
        docVersion: doc_version,
        signedAt: new Date(signed_at),
        signedBy: signed_by,
        method: method || 'manual',
        notes: notes ?? null,
      });

    return res.status(201).json({ success: true, action: 'created', id: result[0]?.insertId });
  } catch (error) {
    console.error('[GemStaff] POST /firme error:', error);
    return res.status(500).json({ error: 'Errore interno' });
  }
});

  // ── PAYSLIPS ──
  app.get("/api/gemstaff/payslips/:memberId", isAuthenticated, async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      if (isNaN(memberId)) return res.status(400).json({ error: 'ID non valido' });

      const userReq = req.user as any;
      if (userReq?.role !== 'admin' && parseInt(userReq?.memberId) !== memberId) {
        return res.status(403).json({ error: 'Non autorizzato' });
      }

      const records = await db
        .select()
        .from(schema.payslips)
        .where(eq(schema.payslips.memberId, memberId))
        .orderBy(desc(schema.payslips.year), desc(schema.payslips.month));

      return res.json(records);
    } catch (error) {
      console.error('[GemStaff] GET /payslips/:memberId error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.get("/api/gemstaff/payslips/:memberId/:month/:year", isAuthenticated, async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const month = parseInt(req.params.month);
      const year = parseInt(req.params.year);
      if (isNaN(memberId) || isNaN(month) || isNaN(year)) return res.status(400).json({ error: 'Parametri non validi' });

      const userReq = req.user as any;
      if (userReq?.role !== 'admin' && parseInt(userReq?.memberId) !== memberId) {
        return res.status(403).json({ error: 'Non autorizzato' });
      }

      const records = await db
        .select()
        .from(schema.payslips)
        .where(
          and(
            eq(schema.payslips.memberId, memberId),
            eq(schema.payslips.month, month),
            eq(schema.payslips.year, year)
          )
        )
        .limit(1);

      return res.json(records.length > 0 ? records[0] : null);
    } catch (error) {
      console.error('[GemStaff] GET /payslips/:memberId/:month/:year error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });


  // ── PRESENZE ──
  app.get("/api/gemstaff/presenze/:month/:year", isAuthenticated, async (req, res) => {
    try {
      const month = parseInt(req.params.month);
      const year = parseInt(req.params.year);
      if (isNaN(month) || isNaN(year)) return res.status(400).json({ error: 'Mese/Anno non validi' });

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const records = await db
        .select({
          id: schema.staffPresenze.id,
          memberId: schema.staffPresenze.memberId,
          date: schema.staffPresenze.date,
          hours: schema.staffPresenze.hours,
          source: schema.staffPresenze.source,
          status: schema.staffPresenze.status,
          nome: schema.members.firstName,
          cognome: schema.members.lastName
        })
        .from(schema.staffPresenze)
        .leftJoin(schema.members, eq(schema.members.id, schema.staffPresenze.memberId))
        .where(
          and(
            gte(schema.staffPresenze.date, startDate),
            lte(schema.staffPresenze.date, endDate)
          )
        );

      const grouped: Record<number, any> = {};
      records.forEach(r => {
        if (!grouped[r.memberId]) {
          grouped[r.memberId] = {
            memberId: r.memberId,
            nome: r.nome ? `${r.nome} ${r.cognome}`.trim() : 'Sconosciuto',
            presenze: [],
            totOre: 0,
            status: 'CONFERMATO'
          };
        }
        grouped[r.memberId].presenze.push(r);
        grouped[r.memberId].totOre += parseFloat(r.hours?.toString() || '0');
        if (r.status === 'bozza') {
          grouped[r.memberId].status = 'BOZZA';
        }
      });

      return res.json(Object.values(grouped));
    } catch (error) {
      console.error('[GemStaff] GET /presenze/:month/:year error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.get("/api/gemstaff/presenze/:memberId/:month/:year", isAuthenticated, async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const month = parseInt(req.params.month);
      const year = parseInt(req.params.year);
      if (isNaN(memberId) || isNaN(month) || isNaN(year)) return res.status(400).json({ error: 'Parametri non validi' });

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const records = await db
        .select()
        .from(schema.staffPresenze)
        .where(
          and(
            eq(schema.staffPresenze.memberId, memberId),
            gte(schema.staffPresenze.date, startDate),
            lte(schema.staffPresenze.date, endDate)
          )
        )
        .orderBy(schema.staffPresenze.date);

      return res.json(records);
    } catch (error) {
      console.error('[GemStaff] GET /presenze/:memberId error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.post("/api/gemstaff/presenze", isAuthenticated, async (req, res) => {
    try {
      const role = (req.user as any)?.role;
      if (role !== 'admin' && role !== 'operator') {
        return res.status(403).json({ error: 'Non autorizzato' });
      }

      const { member_id, course_id, date, hours, notes } = req.body;
      if (!member_id || !date || typeof hours === 'undefined') {
        return res.status(400).json({ error: 'Campi obbligatori mancanti' });
      }

      const result = await db
        .insert(schema.staffPresenze)
        .values({
          memberId: parseInt(member_id),
          courseId: course_id ? parseInt(course_id) : null,
          date: new Date(date),
          hours: hours.toString(),
          source: 'manual',
          notes: notes ?? null,
        });

      return res.status(201).json({ success: true, id: result[0]?.insertId });
    } catch (error) {
      console.error('[GemStaff] POST /presenze error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.post("/api/gemstaff/presenze/conferma", isAuthenticated, async (req, res) => {
    try {
      const role = (req.user as any)?.role;
      if (role !== 'admin') {
        return res.status(403).json({ error: 'Non autorizzato, richiesto admin' });
      }

      const { month, year, confirmed_by } = req.body;
      if (isNaN(month) || isNaN(year)) return res.status(400).json({ error: 'Mese/Anno non validi' });

      const startDate = new Date(year, parseInt(month) - 1, 1);
      const endDate = new Date(year, parseInt(month), 0, 23, 59, 59);

      await db
        .update(schema.staffPresenze)
        .set({
          status: 'confermato',
          confirmedBy: confirmed_by || ((req.user as any)?.username ?? 'Admin'),
          confirmedAt: new Date()
        })
        .where(
          and(
            eq(schema.staffPresenze.status, 'bozza'),
            gte(schema.staffPresenze.date, startDate),
            lte(schema.staffPresenze.date, endDate)
          )
        );

      return res.json({ success: true, message: 'Presenze confermate' });
    } catch (error) {
      console.error('[GemStaff] POST /presenze/conferma error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  // ── SOSTITUZIONI ──
  app.get("/api/gemstaff/sostituzioni/:month/:year", isAuthenticated, async (req, res) => {
    try {
      const month = parseInt(req.params.month);
      const year = parseInt(req.params.year);
      if (isNaN(month) || isNaN(year)) return res.status(400).json({ error: 'Mese/Anno non validi' });

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const rs = await db
        .select()
        .from(schema.staffSostituzioni)
        .where(
          and(
            gte(schema.staffSostituzioni.absenceDate, startDate),
            lte(schema.staffSostituzioni.absenceDate, endDate)
          )
        )
        .orderBy(desc(schema.staffSostituzioni.absenceDate));

      const staffMembers = await db.select({
        id: schema.members.id, 
        firstName: schema.members.firstName, 
        lastName: schema.members.lastName
      }).from(schema.members);
      
      const staffMap: Record<number, string> = {};
      staffMembers.forEach(m => {
          staffMap[m.id] = `${m.firstName || ''} ${m.lastName || ''}`.trim();
      });

      const records = rs.map(r => ({
        id: r.id,
        assente: staffMap[r.absentMemberId] || 'Sconosciuto',
        sostituto: r.substituteMemberId ? (staffMap[r.substituteMemberId] || 'Sconosciuto') : '—',
        data: r.absenceDate,
        lezione: r.lessonDescription,
        compenso_a: r.paymentTo,
        visto_segr: r.vistoSegreteria,
        visto_elisa: r.vistoElisa,
        notes: r.notes
      }));

      return res.json(records);
    } catch (error) {
      console.error('[GemStaff] GET /sostituzioni error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.post("/api/gemstaff/sostituzioni", isAuthenticated, async (req, res) => {
    try {
      const role = (req.user as any)?.role;
      if (role !== 'admin' && role !== 'operator') {
        return res.status(403).json({ error: 'Non autorizzato' });
      }

      const { absent_member_id, substitute_member_id, course_id, absence_date, lesson_description, payment_to, amount_override, notes, created_by } = req.body;
      if (!absent_member_id || !absence_date) return res.status(400).json({ error: 'Campi obbligatori mancanti' });

      const result = await db
        .insert(schema.staffSostituzioni)
        .values({
          absentMemberId: parseInt(absent_member_id),
          substituteMemberId: substitute_member_id ? parseInt(substitute_member_id) : null,
          courseId: course_id ? parseInt(course_id) : null,
          absenceDate: new Date(absence_date),
          lessonDescription: lesson_description,
          paymentTo: payment_to || 'sostituto',
          amountOverride: amount_override ? amount_override.toString() : null,
          notes: notes ?? null,
          createdBy: created_by || ((req.user as any)?.username ?? 'Admin')
        });

      return res.status(201).json({ success: true, id: result[0]?.insertId });
    } catch (error) {
      console.error('[GemStaff] POST /sostituzioni error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.patch("/api/gemstaff/sostituzioni/:id/visto", isAuthenticated, async (req, res) => {
    try {
      const role = (req.user as any)?.role;
      if (role !== 'admin' && role !== 'operator') {
        return res.status(403).json({ error: 'Non autorizzato' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'ID non valido' });

      const { visto_segreteria, visto_elisa } = req.body;
      const updates: any = {};
      if (visto_segreteria !== undefined) updates.vistoSegreteria = !!visto_segreteria;
      if (visto_elisa !== undefined) updates.vistoElisa = !!visto_elisa;

      if (Object.keys(updates).length > 0) {
        await db
          .update(schema.staffSostituzioni)
          .set(updates)
          .where(eq(schema.staffSostituzioni.id, id));
      }

      return res.json({ success: true });
    } catch (error) {
      console.error('[GemStaff] PATCH /sostituzioni/:id/visto error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  // ── DISCIPLINARE ──
  app.get("/api/gemstaff/disciplinare/:memberId", isAuthenticated, async (req, res) => {
    try {
      const role = (req.user as any)?.role;
      if (role !== 'admin') return res.status(403).json({ error: 'Non autorizzato, chiusura' });

      const memberId = parseInt(req.params.memberId);
      if (isNaN(memberId)) return res.status(400).json({ error: 'ID non valido' });

      const records = await db
        .select()
        .from(schema.staffDisciplinaryLog)
        .where(eq(schema.staffDisciplinaryLog.memberId, memberId))
        .orderBy(desc(schema.staffDisciplinaryLog.eventDate));

      return res.json(records);
    } catch (error) {
      console.error('[GemStaff] GET /disciplinare error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.post("/api/gemstaff/disciplinare", isAuthenticated, async (req, res) => {
    try {
      const role = (req.user as any)?.role;
      if (role !== 'admin') return res.status(403).json({ error: 'Non autorizzato' });

      const { member_id, event_type, event_date, description, created_by } = req.body;
      if (!member_id || !event_type || !event_date || !description) return res.status(400).json({ error: 'Campi obbligatori mancanti' });

      const result = await db
        .insert(schema.staffDisciplinaryLog)
        .values({
          memberId: parseInt(member_id),
          // @ts-ignore // TODO: STI-cleanup
          eventType: event_type,
          eventDate: new Date(event_date),
          description,
          createdBy: created_by || ((req.user as any)?.username ?? 'Admin')
        });

      return res.status(201).json({ success: true, id: result[0]?.insertId });
    } catch (error) {
      console.error('[GemStaff] POST /disciplinare error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.patch("/api/gemstaff/disciplinare/:id", isAuthenticated, async (req, res) => {
    try {
      const role = (req.user as any)?.role;
      if (role !== 'admin') return res.status(403).json({ error: 'Non autorizzato' });

      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'ID non valido' });

      const { staff_response, staff_response_at, decision, resolved_at } = req.body;
      const updates: any = {};
      if (staff_response !== undefined) updates.staffResponse = staff_response;
      if (staff_response_at !== undefined) updates.staffResponseAt = staff_response_at ? new Date(staff_response_at) : null;
      if (decision !== undefined) updates.decision = decision;
      if (resolved_at !== undefined) updates.resolvedAt = resolved_at ? new Date(resolved_at) : null;

      if (Object.keys(updates).length > 0) {
        await db
          .update(schema.staffDisciplinaryLog)
          .set(updates)
          .where(eq(schema.staffDisciplinaryLog.id, id));
      }

      return res.json({ success: true });
    } catch (error) {
      console.error('[GemStaff] PATCH /disciplinare/:id error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  // ============================================================================
  // GEMTEAM ROUTES
  // ============================================================================
  
  app.get("/api/gemteam/turni", isAuthenticated, async (req, res) => {
    try {
      const employeeId = req.query.employee_id && req.query.employee_id !== 'null'
        ? parseInt(req.query.employee_id as string) 
        : null;
      const settimana = req.query.settimana as any || 'A';
      const giornoStr = req.query.giorno as string | undefined;

      const conditions = [eq(schema.teamShiftTemplates.settimanaTipo, settimana)];
      if (employeeId && !isNaN(employeeId)) conditions.push(eq(schema.teamShiftTemplates.employeeId, employeeId));
      if (giornoStr !== undefined && giornoStr !== null && !isNaN(parseInt(giornoStr))) {
          conditions.push(eq(schema.teamShiftTemplates.giornoSettimana, parseInt(giornoStr)));
      }

      const turni = await db.select()
        .from(schema.teamShiftTemplates)
        .where(and(...conditions))
        .orderBy(
          asc(schema.teamShiftTemplates.giornoSettimana),
          asc(schema.teamShiftTemplates.oraInizio)
        );

      return res.json(turni);
    } catch (error) {
      console.error('[GemTeam] GET /turni error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.get("/api/gemteam/turni/preview-import", isAuthenticated, async (req, res) => {
    try {
      const filePath = path.join(process.cwd(), "team_TURNI.xlsx");
      if (!fs.existsSync(filePath)) {
         return res.status(404).json({ error: "File team_TURNI.xlsx non trovato nella root del progetto" });
      }
      const buffer = fs.readFileSync(filePath);
      const records = parseTurniXlsx(buffer);
      return res.json(records);
    } catch (error) {
      console.error('[GemTeam] GET /turni/preview-import error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.post("/api/gemteam/turni/do-import", isAuthenticated, async (req, res) => {
    try {
      const filePath = path.join(process.cwd(), "team_TURNI.xlsx");
      if (!fs.existsSync(filePath)) {
         return res.status(404).json({ error: "File team_TURNI.xlsx non trovato nella root del progetto" });
      }
      const buffer = fs.readFileSync(filePath);
      const records = parseTurniXlsx(buffer);
      
      if (records.length === 0) {
        return res.status(400).json({ error: "Nessun record valido trovato" });
      }

      await db.delete(schema.teamShiftTemplates);

      const toInsert = records.map(r => ({
        employeeId: r.employee_id,
        settimanaTipo: r.settimana_tipo as any,
        giornoSettimana: r.giorno_settimana,
        oraInizio: r.ora_inizio,
        oraFine: r.ora_fine,
        postazione: r.postazione as any,
      }));

      await db.insert(schema.teamShiftTemplates).values(toInsert);

      return res.json({ success: true, inserted: toInsert.length });
    } catch (error) {
      console.error('[GemTeam] POST /turni/import error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.get("/api/gemteam/presenze/preview-import", isAuthenticated, async (req, res) => {
    try {
      const filePath = path.join(process.cwd(), "team_20252026_PRESENZE_TEAM.xlsx");
      if (!fs.existsSync(filePath)) {
         return res.status(404).json({ error: "File team_20252026_PRESENZE_TEAM.xlsx non trovato nella root" });
      }
      const buffer = fs.readFileSync(filePath);
      const records = parsePresenzeXlsx(buffer);
      return res.json(records);
    } catch (error) {
      console.error('[GemTeam] GET /presenze/preview-import error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.post("/api/gemteam/presenze/do-import", isAuthenticated, async (req, res) => {
    try {
      const filePath = path.join(process.cwd(), "team_20252026_PRESENZE_TEAM.xlsx");
      if (!fs.existsSync(filePath)) {
         return res.status(404).json({ error: "File team_20252026_PRESENZE_TEAM.xlsx non trovato nella root" });
      }
      const buffer = fs.readFileSync(filePath);
      const records = parsePresenzeXlsx(buffer);
      
      if (records.length === 0) {
        return res.status(400).json({ error: "Nessun record valido trovato" });
      }

      // To avoid duplicates or partial overwrites, the user wants us to import.
      // Usually historical import does not flush the table entirely, but we could do delete-insert logic
      // per employee and date to be idempotent, or just bulk insert with ON DUPLICATE KEY UPDATE.
      // Easiest is to ON DUPLICATE KEY UPDATE through drizzle or manual mapping, or just bulk insert.
      // I'll do a simple loop or use mysql raw query for on duplicate key update if needed.
      // Since Drizzle's ON DUPLICATE KEY is tricky with dynamic fields, I'll delete pre-existing dates first?
      // Wait, the user says: "Procedi con script e do-import". They didn't ask to delete. I'll just insert.
      
      const toInsert = records.map(r => ({
        employeeId: r.employee_id,
        data: r.data,
        oreLavorate: r.ore_lavorate !== null ? String(r.ore_lavorate) : null,
        tipoAssenza: r.tipo_assenza as any
      }));

      // In Mariadb, safe bulk insert (ignore duplicates or on duplicate key update)
      await db.insert(schema.teamAttendanceLogs)
        .values(toInsert)
        .onDuplicateKeyUpdate({
           set: {
             oreLavorate: sql`VALUES(ore_lavorate)`,
             tipoAssenza: sql`VALUES(tipo_assenza)`
           }
        });

      return res.json({ success: true, inserted: toInsert.length });
    } catch (error) {
      console.error('[GemTeam] POST /presenze/do-import error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });


  app.get("/api/gemteam/dipendenti", isAuthenticated, async (req, res) => {
    try {
      const role = (req.user as any)?.role;
      if (role !== 'admin' && role !== 'operator') return res.status(403).json({ error: 'Non autorizzato' });

      const records = await db
        .select({
          id: schema.teamEmployees.id,
          memberId: schema.teamEmployees.memberId,
          userId: schema.teamEmployees.userId,
          displayOrder: schema.teamEmployees.displayOrder,
          team: schema.teamEmployees.team,
          tariffaOraria: schema.teamEmployees.tariffaOraria,
          stipendioFissoMensile: schema.teamEmployees.stipendioFissoMensile,
          dataAssunzione: schema.teamEmployees.dataAssunzione,
          attivo: schema.teamEmployees.attivo,
          noteHr: schema.teamEmployees.noteHr,
          createdAt: schema.teamEmployees.createdAt,
          updatedAt: schema.teamEmployees.updatedAt,
          firstName: schema.members.firstName,
          lastName: schema.members.lastName,
          email: schema.members.email,
          phone: schema.members.phone,
          photoUrl: schema.members.photoUrl,
          lastSeenAt: schema.users.lastSeenAt,
          currentSessionStart: schema.users.currentSessionStart,
          lastSessionDuration: schema.users.lastSessionDuration
        })
        .from(schema.teamEmployees)
        .innerJoin(schema.members, eq(schema.members.id, schema.teamEmployees.memberId))
        .leftJoin(schema.users, eq(schema.users.id, schema.teamEmployees.userId))
        .where(eq(schema.teamEmployees.attivo, true))
        .orderBy(asc(schema.teamEmployees.displayOrder));

      const enhancedRecords = await Promise.all(records.map(async (emp) => {
        // Check-in fisico di oggi
        const checkinOggi = await db
          .select()
          .from(schema.teamCheckinEvents)
          .where(
            and(
              eq(schema.teamCheckinEvents.employeeId, emp.id),
              eq(schema.teamCheckinEvents.tipo, 'IN'),
              sql`DATE(${schema.teamCheckinEvents.timestamp}) = CURDATE()`
            )
          )
          .orderBy(asc(schema.teamCheckinEvents.timestamp))
          .limit(1);

        // Check-out fisico di oggi
        const checkoutOggi = await db
          .select()
          .from(schema.teamCheckinEvents)
          .where(
            and(
              eq(schema.teamCheckinEvents.employeeId, emp.id),
              eq(schema.teamCheckinEvents.tipo, 'OUT'),
              sql`DATE(${schema.teamCheckinEvents.timestamp}) = CURDATE()`
            )
          )
          .orderBy(desc(schema.teamCheckinEvents.timestamp))
          .limit(1);

        // Ore fisiche da attendance_logs
        const attendanceOggi = await db
          .select()
          .from(schema.teamAttendanceLogs)
          .where(
            and(
              eq(schema.teamAttendanceLogs.employeeId, emp.id),
              sql`DATE(${schema.teamAttendanceLogs.data}) = CURDATE()`
            )
          )
          .limit(1);

        return {
          ...emp,
          checkInOggi: checkinOggi[0]?.timestamp ?? null,
          checkOutOggi: checkoutOggi[0]?.timestamp ?? null,
          oreFisicheOggi: attendanceOggi[0]?.oreLavorate ?? null,
          inSedeOra: !!checkinOggi[0] && !checkoutOggi[0]
        };
      }));

      return res.json(enhancedRecords);
    } catch (error) {
      console.error('[GemTeam] GET /dipendenti error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.patch("/api/gemteam/dipendenti/reorder", isAuthenticated, async (req, res) => {
    try {
      const role = (req.user as any)?.role?.toLowerCase();
      if (!['admin', 'master', 'super admin'].includes(role)) {
        return res.status(403).json({ error: 'Non autorizzato. Solo amministratori o master possono riordinare.' });
      }

      const { order } = req.body;
      if (!Array.isArray(order)) {
        return res.status(400).json({ error: 'Formato payload order non valido' });
      }

      // Valida IDs: 1 to 14 allowed
      let updatedCount = 0;
      for (const item of order) {
        if (typeof item.id !== 'number' || typeof item.display_order !== 'number') continue;
        if (item.id === 15 || item.id === 16) continue; // Skip System accounts
        
        await db.update(schema.teamEmployees)
          .set({ displayOrder: item.display_order })
          .where(eq(schema.teamEmployees.id, item.id));
        updatedCount++;
      }

      return res.json({ ok: true, updated: updatedCount });
    } catch (error) {
      console.error('[GemTeam] PATCH /dipendenti/reorder error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.patch("/api/gemteam/dipendenti/:id", isAuthenticated, async (req, res) => {
    try {
      const role = (req.user as any)?.role?.toLowerCase();
      if (!['admin', 'master', 'super admin'].includes(role)) {
        return res.status(403).json({ error: 'Non autorizzato' });
      }

      const id = parseInt(req.params.id);
      const { team, displayOrder } = req.body;
      
      const toUpdate: any = {};
      if (team !== undefined) toUpdate.team = team;
      if (displayOrder !== undefined) toUpdate.displayOrder = displayOrder;
      
      if (Object.keys(toUpdate).length > 0) {
        await db.update(schema.teamEmployees)
          .set(toUpdate)
          .where(eq(schema.teamEmployees.id, id));
      }

      return res.json({ ok: true, updated: id });
    } catch (error) {
      console.error('[GemTeam] PATCH /dipendenti/:id error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.get("/api/gemteam/presenze/:anno/:mese", isAuthenticated, async (req, res) => {
    try {
      const role = (req.user as any)?.role;
      if (role !== 'admin' && role !== 'operator') return res.status(403).json({ error: 'Non autorizzato' });
      
      const anno = parseInt(req.params.anno);
      const mese = parseInt(req.params.mese);
      if (isNaN(anno) || isNaN(mese)) return res.status(400).json({ error: 'Anno/Mese non validi' });



      const records = await db
        .select({
          id: schema.teamAttendanceLogs.id,
          employeeId: schema.teamAttendanceLogs.employeeId,
          data: schema.teamAttendanceLogs.data,
          oreLavorate: schema.teamAttendanceLogs.oreLavorate,
          tipoAssenza: schema.teamAttendanceLogs.tipoAssenza,
          checkIn: schema.teamAttendanceLogs.checkIn,
          checkOut: schema.teamAttendanceLogs.checkOut,
          note: schema.teamAttendanceLogs.note,
          modifiedByAdmin: schema.teamAttendanceLogs.modifiedByAdmin,
          modifiedAt: schema.teamAttendanceLogs.modifiedAt,
          createdAt: schema.teamAttendanceLogs.createdAt,
          firstName: schema.members.firstName,
          lastName: schema.members.lastName
        })
        .from(schema.teamAttendanceLogs)
        .innerJoin(schema.teamEmployees, eq(schema.teamEmployees.id, schema.teamAttendanceLogs.employeeId))
        .innerJoin(schema.members, eq(schema.members.id, schema.teamEmployees.memberId))
        .where(
          sql`YEAR(${schema.teamAttendanceLogs.data}) = ${anno} AND MONTH(${schema.teamAttendanceLogs.data}) = ${mese}`
        )
        .orderBy(asc(schema.members.lastName), asc(schema.members.firstName), schema.teamAttendanceLogs.data);

      return res.json(records);
    } catch (error) {
      console.error('[GemTeam] GET /presenze/:anno/:mese error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.post("/api/gemteam/presenze", isAuthenticated, async (req, res) => {
    try {
      const role = (req.user as any)?.role;
      if (role !== 'admin' && role !== 'operator') return res.status(403).json({ error: 'Non autorizzato' });

      const { employee_id, data, ore_lavorate, tipo_assenza, note } = req.body;
      if (!employee_id || !data) return res.status(400).json({ error: 'Campi obbligatori mancanti' });

      const parsedDate = new Date(data);
      
      const mRep = await db.select().from(schema.teamMonthlyReports).where(and(eq(schema.teamMonthlyReports.mese, parsedDate.getMonth() + 1), eq(schema.teamMonthlyReports.anno, parsedDate.getFullYear()), eq(schema.teamMonthlyReports.locked, true))).limit(1);
      if (mRep.length > 0) return res.status(403).json({ error: 'Questo mese è chiuso (locked)!' });

      const existing = await db.select()
        .from(schema.teamAttendanceLogs)
        .where(
          and(
            eq(schema.teamAttendanceLogs.employeeId, parseInt(employee_id)),
            eq(schema.teamAttendanceLogs.data, parsedDate)
          )
        ).limit(1);

      if (existing.length > 0) {
        await db.update(schema.teamAttendanceLogs)
          .set({
            oreLavorate: ore_lavorate ? ore_lavorate.toString() : null,
            // @ts-ignore // TODO: STI-cleanup
            tipoAssenza: tipo_assenza || null,
            note: note || null,
            modifiedByAdmin: (req.user as any)?.id,
            modifiedAt: new Date()
          })
          .where(eq(schema.teamAttendanceLogs.id, existing[0].id));
        return res.json({ success: true, action: 'updated', id: existing[0].id });
      } else {
        const result = await db.insert(schema.teamAttendanceLogs)
          .values({
            employeeId: parseInt(employee_id),
            data: parsedDate,
            oreLavorate: ore_lavorate ? ore_lavorate.toString() : null,
            // @ts-ignore // TODO: STI-cleanup
            tipoAssenza: tipo_assenza || null,
            note: note || null
          });
        return res.status(201).json({ success: true, action: 'created', id: result[0]?.insertId });
      }
    } catch (error) {
      console.error('[GemTeam] POST /presenze error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.post("/api/gemteam/checkin", isAuthenticated, async (req, res) => {
    try {
      const { employee_id, tipo, postazione, device } = req.body;
      if (!employee_id || !tipo) return res.status(400).json({ error: 'Campi obbligatori mancanti' });
      
      const role = (req.user as any)?.role;
      const empId = parseInt(employee_id);

      const timestampNow = new Date();
      const mRep = await db.select().from(schema.teamMonthlyReports).where(and(eq(schema.teamMonthlyReports.mese, timestampNow.getMonth() + 1), eq(schema.teamMonthlyReports.anno, timestampNow.getFullYear()), eq(schema.teamMonthlyReports.locked, true))).limit(1);
      if (mRep.length > 0) return res.status(403).json({ error: 'Questo mese è chiuso (locked)!' });

      const empTarget = await db.select()
        .from(schema.teamEmployees)
        .where(eq(schema.teamEmployees.id, empId))
        .limit(1);
        
      if (empTarget.length === 0) return res.status(404).json({ error: 'Membro del team non trovato' });
      
      if (role !== 'admin' && role !== 'operator') {
         if ((req.user as any)?.id !== empTarget[0].userId) {
             return res.status(403).json({ error: 'Non puoi timbrare per un altro membro del team!' });
         }
      }

      await db.insert(schema.teamCheckinEvents).values({
         employeeId: empId,
         timestamp: timestampNow,
         // @ts-ignore // TODO: STI-cleanup
         tipo: tipo,
         postazione: postazione || null,
         device: device || 'sys',
         overrideAdmin: role === 'admin'
      });

      let oreCalcolate: number | null = null;
      const d = new Date(timestampNow);
      d.setHours(12, 0, 0, 0); // avoid tz shifts
      const dataStr = d.toISOString().split('T')[0];

      if (tipo === 'OUT') {
         const startOfDay = new Date(timestampNow);
         startOfDay.setHours(0,0,0,0);
         
         const lastIn = await db.select()
           .from(schema.teamCheckinEvents)
           .where(
             and(
               eq(schema.teamCheckinEvents.employeeId, empId),
               eq(schema.teamCheckinEvents.tipo, 'IN'),
               gte(schema.teamCheckinEvents.timestamp, startOfDay),
               lte(schema.teamCheckinEvents.timestamp, timestampNow)
             )
           )
           .orderBy(desc(schema.teamCheckinEvents.timestamp))
           .limit(1);

         if (lastIn.length > 0) {
            const msDiff = timestampNow.getTime() - lastIn[0].timestamp.getTime();
            const diffInHours = msDiff / (1000 * 60 * 60);
            
            const logGiorno = await db.select()
              .from(schema.teamAttendanceLogs)
              .where(
                and(
                  eq(schema.teamAttendanceLogs.employeeId, empId),
                  sql`DATE(${schema.teamAttendanceLogs.data}) = ${dataStr}`
                )
              )
              .limit(1);
              
            if (logGiorno.length === 0) {
               oreCalcolate = diffInHours;
               await db.insert(schema.teamAttendanceLogs).values({
                 employeeId: empId,
                 data: new Date(dataStr),
                 oreLavorate: oreCalcolate.toFixed(2),
                 checkIn: lastIn[0].timestamp,
                 checkOut: timestampNow,
                 note: 'Auto creato da Timbratura'
               });
            } else {
               oreCalcolate = parseFloat(logGiorno[0].oreLavorate || "0") + diffInHours;
               await db.update(schema.teamAttendanceLogs)
                 .set({
                   oreLavorate: oreCalcolate.toFixed(2),
                   checkIn: logGiorno[0].checkIn ? logGiorno[0].checkIn : lastIn[0].timestamp,
                   checkOut: timestampNow
                 })
                 .where(eq(schema.teamAttendanceLogs.id, logGiorno[0].id));
            }
         }
      } else {
         const logGiorno = await db.select()
              .from(schema.teamAttendanceLogs)
              .where(
                and(
                  eq(schema.teamAttendanceLogs.employeeId, empId),
                  sql`DATE(${schema.teamAttendanceLogs.data}) = ${dataStr}`
                )
              )
              .limit(1);
         
         if (logGiorno.length === 0) {
            await db.insert(schema.teamAttendanceLogs).values({
                 employeeId: empId,
                 data: new Date(dataStr),
                 checkIn: timestampNow
            });
         }
      }

      return res.status(201).json({ success: true, timestamp: timestampNow, ore_calcolate_out: oreCalcolate });
    } catch (error) {
      console.error('[GemTeam] POST /checkin error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.get("/api/gemteam/checkin/status/:employeeId", isAuthenticated, async (req, res) => {
    try {
      const empId = parseInt(req.params.employeeId);
      if (isNaN(empId)) return res.status(400).json({ error: 'ID non valido' });

      const lastEvt = await db.select()
        .from(schema.teamCheckinEvents)
        .where(eq(schema.teamCheckinEvents.employeeId, empId))
        .orderBy(desc(schema.teamCheckinEvents.timestamp))
        .limit(1);
        
      const today = new Date();
      today.setHours(0,0,0,0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const logToday = await db.select()
        .from(schema.teamAttendanceLogs)
        .where(
          and(
            eq(schema.teamAttendanceLogs.employeeId, empId),
            gte(schema.teamAttendanceLogs.data, today),
            lt(schema.teamAttendanceLogs.data, tomorrow)
          )
        )
        .limit(1);
        
      const status = lastEvt.length > 0 ? lastEvt[0] : null;
      const log = logToday.length > 0 ? logToday[0] : null;

      // Se l'ultimo evento era un IN di un altro giorno, facciamo scadere il tracking odierno
      let mappedStatus = status ? status.tipo : 'SCONOSCIUTO';
      if (status && status.timestamp < today) {
          mappedStatus = 'OUT'; // Auto-reset se l'ultimo IN è del giorno prima e non è stato chiuso
      }

      return res.json({
         lastEvent: mappedStatus,
         lastTimestamp: status ? status.timestamp : null,
         oreOggi: log ? log.oreLavorate : 0,
         checkInOggi: log ? log.checkIn : null,
      });

    } catch (error) {
      console.error('[GemTeam] GET /checkin/status error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.get("/api/gemteam/checkin/oggi", isAuthenticated, async (req, res) => {
    try {
      const results = await db.execute(sql`
        SELECT 
           te.id as employeeId, 
           m.first_name as firstName, 
           m.last_name as lastName, 
           m.photo_url as photoUrl,
           tc.tipo as lastEvent, 
           tc.timestamp as lastTimestamp,
           al.ore_lavorate as oreOggi
        FROM team_employees te
        JOIN members m ON m.id = te.member_id
        LEFT JOIN (
           SELECT t1.employee_id, t1.tipo, t1.timestamp 
           FROM team_checkin_events t1
           INNER JOIN (
              SELECT employee_id, MAX(timestamp) as max_ts
              FROM team_checkin_events
              WHERE timestamp >= DATE(NOW())
              GROUP BY employee_id
           ) t2 ON t1.employee_id = t2.employee_id AND t1.timestamp = t2.max_ts
        ) tc ON tc.employee_id = te.id
        LEFT JOIN team_attendance_logs al ON al.employee_id = te.id AND al.data = DATE(NOW())
        WHERE te.attivo = 1
        ORDER BY m.first_name ASC
      `);

      return res.json(results[0]);
    } catch (error) {
      console.error('[GemTeam] GET /checkin/oggi error:', error);
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.get("/api/gemteam/permessi", isAuthenticated, async (req, res) => {
    try {
      const role = (req.user as any)?.role;
      const currentUserMemberId = (req.user as any)?.id; 
      
      let employeeIdFilter = req.query.employee_id ? parseInt(req.query.employee_id as string) : null;
      let statusFilter = req.query.status as string | null;

      if (role !== 'admin' && role !== 'operator') {
         const me = await db.select()
           .from(schema.teamEmployees)
           .where(eq(schema.teamEmployees.userId, currentUserMemberId))
           .limit(1);
         if (me.length > 0) {
            employeeIdFilter = me[0].id;
         } else {
            return res.json([]);
         }
      }

      const conditions = [];
      if (employeeIdFilter) conditions.push(eq(schema.teamLeaveRequests.employeeId, employeeIdFilter));
      if (statusFilter) conditions.push(eq(schema.teamLeaveRequests.status, statusFilter as any));

      const query = db.select({
         id: schema.teamLeaveRequests.id,
         employeeId: schema.teamLeaveRequests.employeeId,
         tipo: schema.teamLeaveRequests.tipo,
         dataInizio: schema.teamLeaveRequests.dataInizio,
         dataFine: schema.teamLeaveRequests.dataFine,
         oreTotali: schema.teamLeaveRequests.oreTotali,
         status: schema.teamLeaveRequests.status,
         noteDipendente: schema.teamLeaveRequests.noteDipendente,
         noteAdmin: schema.teamLeaveRequests.noteAdmin,
         createdAt: schema.teamLeaveRequests.createdAt,
         firstName: schema.members.firstName,
         lastName: schema.members.lastName,
         photoUrl: schema.members.photoUrl
      })
      .from(schema.teamLeaveRequests)
      .innerJoin(schema.teamEmployees, eq(schema.teamEmployees.id, schema.teamLeaveRequests.employeeId))
      .innerJoin(schema.members, eq(schema.members.id, schema.teamEmployees.memberId));

      if (conditions.length > 0) {
        query.where(and(...conditions));
      }

      const results = await query.orderBy(desc(schema.teamLeaveRequests.createdAt));
      return res.json(results);
    } catch (error) {
       console.error('[GemTeam] GET /permessi error:', error);
       return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.post("/api/gemteam/permessi", isAuthenticated, async (req, res) => {
    try {
      const { employee_id, tipo, data_inizio, data_fine, ore_totali, note_dipendente } = req.body;
      const role = (req.user as any)?.role;
      const userId = (req.user as any)?.id;
      const empId = parseInt(employee_id);

      if (role !== 'admin' && role !== 'operator') {
         const empTarget = await db.select()
          .from(schema.teamEmployees)
          .where(eq(schema.teamEmployees.id, empId))
          .limit(1);
         if (empTarget.length === 0 || empTarget[0].userId !== userId) {
            return res.status(403).json({ error: 'Azione non consentita' });
         }
      }

      const result = await db.insert(schema.teamLeaveRequests).values({
         employeeId: empId,
         // @ts-ignore
         tipo: tipo,
         dataInizio: new Date(data_inizio),
         dataFine: new Date(data_fine),
         oreTotali: ore_totali ? ore_totali.toString() : null,
         noteDipendente: note_dipendente || null,
         status: 'pending'
      });

      return res.status(201).json({ success: true, id: result[0].insertId });
    } catch (error) {
       console.error('[GemTeam] POST /permessi error:', error);
       return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.patch("/api/gemteam/permessi/:id/approva", isAuthenticated, async (req, res) => {
    try {
      if ((req.user as any)?.role !== 'admin' && (req.user as any)?.role !== 'operator') return res.status(403).json({ error: 'Non autorizzato' });
      const reqId = parseInt(req.params.id);
      const { note_admin } = req.body;
      const adminId = (req.user as any)?.id;

      const targetRow = await db.select().from(schema.teamLeaveRequests).where(eq(schema.teamLeaveRequests.id, reqId)).limit(1);
      if (targetRow.length === 0) return res.status(404).json({ error: 'Non trovato' });

      await db.update(schema.teamLeaveRequests)
        .set({
           status: 'approved',
           noteAdmin: note_admin || null,
           // @ts-ignore
           reviewedBy: adminId.toString(),
           updatedAt: new Date()
        }).where(eq(schema.teamLeaveRequests.id, reqId));

      const d = new Date(targetRow[0].dataInizio);
      const end = new Date(targetRow[0].dataFine);
      
      let tipoAssenzaMapped = 'AI';
      switch(targetRow[0].tipo) {
         case 'PE': tipoAssenzaMapped = 'PE'; break;
         case 'FE': tipoAssenzaMapped = 'FE'; break;
         case 'ML': tipoAssenzaMapped = 'ML'; break;
         case 'altro': tipoAssenzaMapped = 'AI'; break;
      }
      
      while (d <= end) {
         const dt = new Date(d);
         const dayOfWeek = dt.getDay();
         // Skip Saturday (6) and Sunday (0)
         if (dayOfWeek !== 0 && dayOfWeek !== 6) {
             dt.setHours(12,0,0,0);
             const dataStr = dt.toISOString().split('T')[0];
             
             await db.execute(sql`
               INSERT INTO team_attendance_logs (employee_id, data, tipo_assenza, note, created_at)
               VALUES (${targetRow[0].employeeId}, ${dataStr}, ${tipoAssenzaMapped}, 'Auto-inserito da Approvazione Ferie/Permessi', NOW())
               ON DUPLICATE KEY UPDATE 
                 tipo_assenza = VALUES(tipo_assenza),
                 note = VALUES(note),
                 modified_at = NOW()
             `);
         }
         d.setDate(d.getDate() + 1);
      }

      return res.json({ success: true });
    } catch (error) {
       console.error('[GemTeam] PATCH /permessi/approva error:', error);
       return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.patch("/api/gemteam/permessi/:id/rifiuta", isAuthenticated, async (req, res) => {
    try {
      if ((req.user as any)?.role !== 'admin' && (req.user as any)?.role !== 'operator') return res.status(403).json({ error: 'Non autorizzato' });
      const reqId = parseInt(req.params.id);
      const { note_admin } = req.body;
      const adminId = (req.user as any)?.id;

      await db.update(schema.teamLeaveRequests)
        .set({
           status: 'rejected',
           noteAdmin: note_admin || null,
           // @ts-ignore
           reviewedBy: adminId.toString(),
           updatedAt: new Date()
        }).where(eq(schema.teamLeaveRequests.id, reqId));

      return res.json({ success: true });
    } catch (error) {
       console.error('[GemTeam] PATCH /permessi/rifiuta error:', error);
       return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.get("/api/gemteam/permessi/pending-count", isAuthenticated, async (req, res) => {
    try {
      const result = await db.select({ count: sql`COUNT(*)` }).from(schema.teamLeaveRequests).where(eq(schema.teamLeaveRequests.status, 'pending'));
      return res.json({ count: Number(result[0].count) });
    } catch (error) {
       return res.status(500).json({ count: 0 });
    }
  });

  app.post("/api/gemteam/report/genera/:anno/:mese", isAuthenticated, async (req, res) => {
    try {
       const role = (req.user as any)?.role;
       if (role !== 'admin' && role !== 'operator') return res.status(403).json({ error: 'Non autorizzato' });

       const anno = parseInt(req.params.anno);
       const mese = parseInt(req.params.mese);

       const start = new Date(anno, mese - 1, 1);
       const end = new Date(anno, mese, 0);
       let giorniLavorativi = 0;
       for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          if (d.getDay() !== 0 && d.getDay() !== 6) giorniLavorativi++;
       }
       const oreStandard = giorniLavorativi * 8;

       const dTarget = await db.select().from(schema.teamEmployees).where(eq(schema.teamEmployees.attivo, true));

       const stats = [];

       for (const emp of dTarget) {
          const startDate = new Date(anno, mese - 1, 1);
          const endDate = new Date(anno, mese, 0, 23, 59, 59);
          
          const logs = await db.select()
              .from(schema.teamAttendanceLogs)
              .where(
                 and(
                    eq(schema.teamAttendanceLogs.employeeId, emp.id),
                    gte(schema.teamAttendanceLogs.data, startDate),
                    lte(schema.teamAttendanceLogs.data, endDate)
                 )
              );

          let totOre = 0;
          let giorniLav = 0;
          let cnt_FE = 0, cnt_PE = 0, cnt_ML = 0, cnt_F = 0, cnt_AI = 0, cnt_AG = 0, cnt_MT = 0, cnt_IN = 0;
          
          for (const l of logs) {
             if (l.oreLavorate && parseFloat(l.oreLavorate) > 0) {
                 totOre += parseFloat(l.oreLavorate);
                 giorniLav++;
             }
             switch(l.tipoAssenza) {
                case 'FE': cnt_FE++; break;
                case 'PE': cnt_PE++; break;
                case 'ML': cnt_ML++; break;
                case 'F': cnt_F++; break;
                case 'AI': cnt_AI++; break;
                case 'AG': cnt_AG++; break;
                case 'MT': cnt_MT++; break;
                case 'IN': cnt_IN++; break;
             }
          }
          
          let oreExtraPos = '0.00';
          let oreExtraNeg = '0.00';
          const diff = totOre - oreStandard;
          if (diff > 0) {
             oreExtraPos = diff.toFixed(2);
          } else if (diff < 0) {
             oreExtraNeg = Math.abs(diff).toFixed(2);
          }

          const q = sql`
             INSERT INTO team_monthly_reports 
             (employee_id, mese, anno, ore_totali, giorni_lavorati,
              cnt_FE, cnt_PE, cnt_ML, cnt_F, cnt_AI, cnt_AG, cnt_MT, cnt_IN,
              ore_extra_pos, ore_extra_neg, locked, created_at)
             VALUES 
             (${emp.id}, ${mese}, ${anno}, ${totOre.toFixed(2)}, ${giorniLav},
              ${cnt_FE}, ${cnt_PE}, ${cnt_ML}, ${cnt_F}, ${cnt_AI}, ${cnt_AG}, ${cnt_MT}, ${cnt_IN},
              ${oreExtraPos}, ${oreExtraNeg}, false, NOW())
             ON DUPLICATE KEY UPDATE
              ore_totali = VALUES(ore_totali),
              giorni_lavorati = VALUES(giorni_lavorati),
              cnt_FE = VALUES(cnt_FE), cnt_PE = VALUES(cnt_PE), cnt_ML = VALUES(cnt_ML), cnt_F = VALUES(cnt_F),
              cnt_AI = VALUES(cnt_AI), cnt_AG = VALUES(cnt_AG), cnt_MT = VALUES(cnt_MT), cnt_IN = VALUES(cnt_IN),
              ore_extra_pos = VALUES(ore_extra_pos), ore_extra_neg = VALUES(ore_extra_neg)
          `;
          await db.execute(q);
          stats.push({ empId: emp.id, oreTotali: totOre.toFixed(2) });
       }
       return res.json({ success: true, count: dTarget.length, stats });

    } catch (error) {
       console.error('[GemTeam] POST /report/genera error:', error);
       return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.get("/api/gemteam/report/:anno/:mese", isAuthenticated, async (req, res) => {
    try {
       const anno = parseInt(req.params.anno);
       const mese = parseInt(req.params.mese);

       let results = await db.execute(sql`
          SELECT r.*, m.first_name as firstName, m.last_name as lastName
          FROM team_monthly_reports r
          JOIN team_employees te ON te.id = r.employee_id
          JOIN members m ON m.id = te.member_id
          WHERE r.anno = ${anno} AND r.mese = ${mese}
          ORDER BY m.first_name ASC
       `);

       if ((results as any)[0].length === 0) {
           const start = new Date(anno, mese - 1, 1);
           const end = new Date(anno, mese, 0); 
           let configLav = 0;
           for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              if (d.getDay() !== 0 && d.getDay() !== 6) configLav++;
           }
           const oreStandard = configLav * 8;
           const dipAttivi = await db.select().from(schema.teamEmployees).where(eq(schema.teamEmployees.attivo, true));
           if (dipAttivi.length > 0) {
              for (const emp of dipAttivi) {
                  const sD = new Date(anno, mese - 1, 1);
                  const eD = new Date(anno, mese, 0, 23, 59, 59);
                  const logs = await db.select()
                     .from(schema.teamAttendanceLogs)
                     .where(and(eq(schema.teamAttendanceLogs.employeeId, emp.id), gte(schema.teamAttendanceLogs.data, sD), lte(schema.teamAttendanceLogs.data, eD)));

                  let tot = 0, ggLav = 0, cvFe=0,cvPe=0,cvMl=0,cvF=0,cvAi=0,cvAg=0,cvMt=0,cvIn=0;
                  for (let i=0; i<logs.length;i++) {
                     const l = logs[i];
                     if (l.oreLavorate && parseFloat(l.oreLavorate)>0){ tot+=parseFloat(l.oreLavorate); ggLav++; }
                     switch(l.tipoAssenza) {
                        case 'FE': cvFe++; break; case 'PE': cvPe++; break; case 'ML': cvMl++; break;
                        case 'F': cvF++; break; case 'AI': cvAi++; break; case 'AG': cvAg++; break;
                        case 'MT': cvMt++; break; case 'IN': cvIn++; break;
                     }
                  }
                  let op = '0.00', on = '0.00'; const dff = tot - oreStandard; if(dff>0) op=dff.toFixed(2); else if(dff<0) on=Math.abs(dff).toFixed(2);
                  await db.execute(sql`INSERT INTO team_monthly_reports (employee_id, mese, anno, ore_totali, giorni_lavorati, cnt_FE, cnt_PE, cnt_ML, cnt_F, cnt_AI, cnt_AG, cnt_MT, cnt_IN, ore_extra_pos, ore_extra_neg, locked, created_at) VALUES (${emp.id}, ${mese}, ${anno}, ${tot.toFixed(2)}, ${ggLav}, ${cvFe}, ${cvPe}, ${cvMl}, ${cvF}, ${cvAi}, ${cvAg}, ${cvMt}, ${cvIn}, ${op}, ${on}, false, NOW()) ON DUPLICATE KEY UPDATE ore_totali=VALUES(ore_totali)`);
              }
              results = await db.execute(sql`SELECT r.*, m.first_name as firstName, m.last_name as lastName FROM team_monthly_reports r JOIN team_employees te ON te.id = r.employee_id JOIN members m ON m.id = te.member_id WHERE r.anno = ${anno} AND r.mese = ${mese} ORDER BY m.first_name ASC`);
           }
       }
       
       return res.json(results[0]);
    } catch (error) {
       console.error('[GemTeam] GET /report error:', error);
       return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.get("/api/gemteam/report/:anno/:mese/export", isAuthenticated, async (req, res) => {
    try {
       const anno = parseInt(req.params.anno);
       const mese = parseInt(req.params.mese);

       let ExcelJS;
       try { ExcelJS = (await import('exceljs')).default || await import('exceljs'); } 
       catch(e) { ExcelJS = require('exceljs'); }

       const workbook = new ExcelJS.Workbook();
       const sheet = workbook.addWorksheet(`Report ${mese}-${anno}`);

       const start = new Date(anno, mese - 1, 1);
       const lastDay = new Date(anno, mese, 0).getDate();

       const columns = [
          { header: 'COGNOME', key: 'cognome', width: 20 },
          { header: 'NOME', key: 'nome', width: 20 }
       ];
       for(let i=1; i<=lastDay; i++) {
          columns.push({ header: String(i), key: `d${i}`, width: 6 });
       }
       columns.push(
          { header: 'GG', key: 'gg', width: 8 },
          { header: 'ORE', key: 'ore', width: 8 },
          { header: 'FE', key: 'fe', width: 8 },
          { header: 'PE', key: 'pe', width: 8 },
          { header: 'ML', key: 'ml', width: 8 },
          { header: 'F', key: 'f', width: 8 },
          { header: 'AI', key: 'ai', width: 8 },
          { header: 'AG', key: 'ag', width: 8 },
          { header: 'MT', key: 'mt', width: 8 },
          { header: 'IN', key: 'in', width: 8 }
       );

       sheet.columns = columns;

       const repResults = await db.execute(sql`
          SELECT r.*, m.first_name as firstName, m.last_name as lastName
          FROM team_monthly_reports r
          JOIN team_employees te ON te.id = r.employee_id
          JOIN members m ON m.id = te.member_id
          WHERE r.anno = ${anno} AND r.mese = ${mese}
          ORDER BY m.first_name ASC
       `);
       const reports = (repResults as any)[0] as any[];

       const dStart = new Date(anno, mese - 1, 1);
       const dEnd = new Date(anno, mese, 0, 23, 59, 59);
       const logsResults = await db.select()
            .from(schema.teamAttendanceLogs)
            .where(
               and(
                 gte(schema.teamAttendanceLogs.data, dStart),
                 lte(schema.teamAttendanceLogs.data, dEnd)
               )
            );

       for (const rep of reports) {
           const rowData: any = {
               cognome: rep.lastName,
               nome: rep.firstName,
               gg: rep.giorni_lavorati,
               ore: rep.ore_totali,
               fe: rep.cnt_FE,
               pe: rep.cnt_PE,
               ml: rep.cnt_ML,
               f: rep.cnt_F,
               ai: rep.cnt_AI,
               ag: rep.cnt_AG,
               mt: rep.cnt_MT,
               in: rep.cnt_IN
           };
           
           const empLogs = logsResults.filter(l => l.employeeId === rep.employee_id);
           for (const l of empLogs) {
              const dx = new Date(l.data).getDate();
              let val = null;
              if (l.oreLavorate && parseFloat(l.oreLavorate) > 0) val = l.oreLavorate;
              else if (l.tipoAssenza) val = l.tipoAssenza;
              if (val) rowData[`d${dx}`] = val;
           }
           sheet.addRow(rowData);
       }

       res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
       res.setHeader('Content-Disposition', `attachment; filename=Presenze_GemTeam_${anno}_${mese}.xlsx`);
       
       await workbook.xlsx.write(res);
       res.end();
       
    } catch (error) {
       console.error('[GemTeam] GET /report/export error:', error);
       return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.patch("/api/gemteam/report/:anno/:mese/lock", isAuthenticated, async (req, res) => {
    try {
       const role = (req.user as any)?.role;
       if (role !== 'admin') return res.status(403).json({ error: 'Solo Admin puo chiudere il mese' });
       
       const anno = parseInt(req.params.anno);
       const mese = parseInt(req.params.mese);

       await db.update(schema.teamMonthlyReports)
         .set({ locked: true })
         .where(
            and(
              eq(schema.teamMonthlyReports.mese, mese),
              eq(schema.teamMonthlyReports.anno, anno)
            )
         );
       
       return res.json({ success: true, locked: true });
    } catch (error) {
       console.error('[GemTeam] PATCH /report/lock error:', error);
       return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.post("/api/gemteam/diario", isAuthenticated, async (req, res) => {
    try {
      const { employee_id, data, ora_slot, postazione, activity_type_id, attivita_libera, quantita, minuti, note, shift_id } = req.body;
      const parsedDate = new Date(data);
      const mRep = await db.select().from(schema.teamMonthlyReports).where(and(eq(schema.teamMonthlyReports.mese, parsedDate.getMonth() + 1), eq(schema.teamMonthlyReports.anno, parsedDate.getFullYear()), eq(schema.teamMonthlyReports.locked, true))).limit(1);
      if (mRep.length > 0) return res.status(403).json({ error: 'Questo mese è chiuso (locked)!' });

      const result = await db.insert(schema.teamShiftDiaryEntries).values({
        employeeId: employee_id,
        // @ts-ignore
        data: parsedDate,
        oraSlot: ora_slot,
        postazione: postazione || null,
        activityTypeId: activity_type_id || null,
        attivitaLibera: attivita_libera || null,
        quantita: quantita || null,
        minuti: minuti || null,
        note: note || null,
        shiftId: shift_id || null,
        okFlag: false
      });

      return res.status(201).json({ id: result[0].insertId, success: true });
    } catch (error) {
       console.error('[GemTeam] POST /diario error:', error);
       return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.get("/api/gemteam/diario/:employee_id/:data", isAuthenticated, async (req, res) => {
    try {
      const empId = parseInt(req.params.employee_id);
      const parsedDate = req.params.data; // stringa YYYY-MM-DD
      
      const records = await db.select({
         entry: schema.teamShiftDiaryEntries,
         activityLabel: schema.teamActivityTypes.label
      })
      .from(schema.teamShiftDiaryEntries)
      .leftJoin(schema.teamActivityTypes, eq(schema.teamShiftDiaryEntries.activityTypeId, schema.teamActivityTypes.id))
      .where(and(eq(schema.teamShiftDiaryEntries.employeeId, empId), sql`DATE(${schema.teamShiftDiaryEntries.data}) = ${parsedDate}`))
      .orderBy(schema.teamShiftDiaryEntries.oraSlot);

      return res.json(records);
    } catch (error) {
       console.error('[GemTeam] GET /diario error:', error);
       return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.patch("/api/gemteam/diario/:id/ok", isAuthenticated, async (req, res) => {
    try {
      if ((req.user as any)?.role !== 'admin' && (req.user as any)?.role !== 'operator') return res.status(403).json({ error: 'Solo Admin/Operator' });
      const recordId = parseInt(req.params.id);
      
      const targetQuery = await db.select().from(schema.teamShiftDiaryEntries).where(eq(schema.teamShiftDiaryEntries.id, recordId));
      if (targetQuery.length === 0) return res.status(404).json({ error: 'Not found' });
      
      const parsedDate = new Date(targetQuery[0].data);
      const mRep = await db.select().from(schema.teamMonthlyReports).where(and(eq(schema.teamMonthlyReports.mese, parsedDate.getMonth() + 1), eq(schema.teamMonthlyReports.anno, parsedDate.getFullYear()), eq(schema.teamMonthlyReports.locked, true))).limit(1);
      if (mRep.length > 0) return res.status(403).json({ error: 'Questo mese è chiuso (locked)!' });

      await db.update(schema.teamShiftDiaryEntries).set({ okFlag: true }).where(eq(schema.teamShiftDiaryEntries.id, recordId));
      return res.json({ success: true });
    } catch(err) {
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

  app.delete("/api/gemteam/diario/:id", isAuthenticated, async (req, res) => {
    try {
      if ((req.user as any)?.role !== 'admin' && (req.user as any)?.role !== 'operator') return res.status(403).json({ error: 'Solo Admin/Operator' });




      const recordId = parseInt(req.params.id);
      
      const targetQuery = await db.select().from(schema.teamShiftDiaryEntries).where(eq(schema.teamShiftDiaryEntries.id, recordId));
      if (targetQuery.length === 0) return res.status(404).json({ error: 'Not found' });
      
      const parsedDate = new Date(targetQuery[0].data);
      const mRep = await db.select().from(schema.teamMonthlyReports).where(and(eq(schema.teamMonthlyReports.mese, parsedDate.getMonth() + 1), eq(schema.teamMonthlyReports.anno, parsedDate.getFullYear()), eq(schema.teamMonthlyReports.locked, true))).limit(1);
      if (mRep.length > 0) return res.status(403).json({ error: 'Questo mese è chiuso (locked)!' });

      await db.delete(schema.teamShiftDiaryEntries).where(eq(schema.teamShiftDiaryEntries.id, recordId));
      return res.json({ success: true });
    } catch(err) {
      return res.status(500).json({ error: 'Errore interno' });
    }
  });

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
      if (!type || !['members', 'payments', 'enrollments', 'memberships', 'accounting'].includes(type)) {
        return res.status(400).json({ message: "Invalid import type" });
      }

      const fileExt = path.extname(req.file.originalname).toLowerCase();
      let fileContent: string;

      if (fileExt === '.xlsx' || fileExt === '.xls') {
        const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        fileContent = XLSX.utils.sheet_to_csv(ws);
      } else {
        fileContent = req.file.buffer.toString('utf-8');
      }

      const detectSeparator = (firstLine: string): string => {
        const commas = (firstLine.match(/,/g) || []).length;
        const semis = (firstLine.match(/;/g) || []).length;
        return semis >= commas ? ';' : ',';
      };

      const firstLine = fileContent.split('\n')[0] || '';
      const detectedSep = detectSeparator(firstLine);

      const normalizeHeader = (header: string): string => {
        const h = header.trim().toLowerCase();
        const map: Record<string, string> = {
          'an_cod_fiscale': 'fiscalcode',
          'an_nome': 'firstname',
          'an_cognome': 'lastname',
          'an_sesso': 'gender',
          'an_telefono': 'phone',
          'an_email': 'email',
          'an_id_anagrafica': 'internalid',
          'an_data_inserimento': 'insertiondate',
          'an2_data_di_nascita': 'dateofbirth',
          'an2_luogo_di_nascita': 'placeofbirth',
          'codice fiscale': 'fiscalcode',
          'codice_fiscale': 'fiscalcode',
          'nome': 'firstname',
          'cognome': 'lastname',
          'data di nascita': 'dateofbirth',
          'data_di_nascita': 'dateofbirth',
          'fiscal_code': 'fiscalcode',
          'first_name': 'firstname',
          'last_name': 'lastname',
          'cellulare': 'mobile'
        };
        return map[h] || h; 
      };

      const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        delimiter: detectedSep,
        transformHeader: (header: string) => normalizeHeader(header),
      });

      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      const errors: any[] = [];

      if (type === 'members') {
        for (let i = 0; i < parseResult.data.length; i++) {
          const row: any = parseResult.data[i];
          const rsFirstName = row['firstname'] || row['nome'] || "Sconosciuto";
          const rsLastName = row['lastname'] || row['cognome'] || "Sconosciuto";
          const rsFiscalCode = row['fiscalcode'] || null;
          const rsEmail = row['email'] || null;
          const rsPhone = row['phone'] || row['telefono'] || null;
          const rsMobile = row['mobile'] || row['cellulare'] || null;
          const rsDateOfBirth = row['dateofbirth'] || row['datanascita'] ? new Date(row['dateofbirth'] || row['datanascita']) : null;
          const rsAddress = row['address'] || row['indirizzo'] || null;
          const rsCity = row['city'] || row['citta'] || row['città'] || null;
          const rsCap = row['cap'] || row['postalcode'] || null;
          const rsProvince = row['province'] || row['provincia'] || null;
          const rsGender = row['gender'] || row['sesso'] || null;
          const rsNotes = row['notes'] || row['note'] || null;
          const rsPlaceOfBirth = row['placeofbirth'] || row['luogo_nascita'] || null;

          if (!rsFiscalCode) {
            skipped++;
            continue;
          }

          try {
            const existingMember = await storage.getMemberByFiscalCode(rsFiscalCode.trim());

            if (existingMember) {
               const updateData: any = {};
               if (!existingMember.email && rsEmail) updateData.email = rsEmail;
               if (!existingMember.phone && rsPhone) updateData.phone = rsPhone;
               if (!existingMember.mobile && rsMobile) updateData.mobile = rsMobile;
               if (!existingMember.dateOfBirth && rsDateOfBirth && !isNaN(rsDateOfBirth.getTime())) updateData.dateOfBirth = rsDateOfBirth;
               if (!existingMember.address && rsAddress) updateData.address = rsAddress;
               if (!existingMember.city && rsCity) updateData.city = rsCity;
               if (!existingMember.postalCode && rsCap) updateData.postalCode = rsCap;
               if (!existingMember.province && rsProvince) updateData.province = rsProvince;
               if (!existingMember.gender && rsGender) updateData.gender = rsGender;
               if (!existingMember.placeOfBirth && rsPlaceOfBirth) updateData.placeOfBirth = rsPlaceOfBirth;

               if (Object.keys(updateData).length > 0) {
                 await db.update(schema.members)
                   .set(updateData)
                   .where(eq(schema.members.id, existingMember.id));
                 updated++;
               } else {
                 skipped++;
               }
            } else {
               if (rsEmail || rsPhone || rsMobile) {
                  await storage.createMember({
                     firstName: rsFirstName,
                     lastName: rsLastName,
                     fiscalCode: rsFiscalCode.trim(),
                     email: rsEmail,
                     phone: rsPhone,
                     mobile: rsMobile,
                     dateOfBirth: rsDateOfBirth && !isNaN(rsDateOfBirth.getTime()) ? rsDateOfBirth : null,
                     address: rsAddress,
                     city: rsCity,
                     postalCode: rsCap,
                     province: rsProvince,
                     gender: rsGender,
                     placeOfBirth: rsPlaceOfBirth,
                     notes: rsNotes,
                     active: true
                  });
                  inserted++;
               } else {
                  skipped++;
               }
            }
          } catch (err: any) {
             console.error("Member import fallback error:", err);
             errors.push({ row: i+2, message: err.message });
          }
        }
      } else {
        // Placeholder for payments, enrollments, memberships, accounting
        skipped += parseResult.data.length;
      }

      res.json({
        separator_detected: detectedSep,
        rows_processed: parseResult.data.length,
        inserted: inserted,
        updated: updated,
        skipped: skipped,
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

      const fileContent = req.file.buffer.toString('utf-8');
      const firstLine = fileContent.split('\n')[0] || '';
      const commas = (firstLine.match(/,/g) || []).length;
      const semis = (firstLine.match(/;/g) || []).length;
      const detectedSep = semis >= commas ? ';' : ',';

      const Papa = await import('papaparse');

      const parsed = Papa.default.parse(fileContent, {
        header: false,
        skipEmptyLines: true,
        delimiter: detectedSep,
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
        delimiter: detectedSep // Return used delimiter for confirmation
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

      const fileContent = req.file.buffer.toString('utf-8');
      const firstLine = fileContent.split('\n')[0] || '';
      const commas = (firstLine.match(/,/g) || []).length;
      const semis = (firstLine.match(/;/g) || []).length;
      const detectedSep = semis >= commas ? ';' : ',';

      const Papa = await import('papaparse');

      const parsed = Papa.default.parse(fileContent, {
        header: false,
        skipEmptyLines: true,
        delimiter: detectedSep,
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
  // AREA TESSERATI (B2C)
  // ==========================================

  const docUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Formato file non supportato. Solo PDF, JPG, PNG."));
      }
    }
  });

  app.get("/api/area-tesserati/profile", isAuthenticated, async (req, res) => {
    try {
      const allowedRoles = ["client", "admin", "super admin"];
      if (!req.user?.role || !allowedRoles.includes(req.user.role.toLowerCase())) {
        return res.status(403).json({ error: "Access denied" });
      }

      const [member] = await db.select().from(members).where(eq(members.userId, req.user.id.toString())).limit(1);
      if (!member) {
        return res.status(404).json({ error: "Profilo non collegato" });
      }

      const memberEnrollments = await db.select({
        corsoNome: courses.name,
        giorno: courses.dayOfWeek,
        orarioInizio: courses.startTime,
        orarioFine: courses.endTime,
        studio: courses.studioId,
        stato: enrollments.status
      })
      .from(enrollments)
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.memberId, member.id));

      const memberPayments = await db.select()
        .from(payments)
        .where(eq(payments.memberId, member.id))
        .orderBy(desc(payments.dueDate))
        .limit(5);

      const docs = await db.select()
        .from(memberUploads)
        .where(eq(memberUploads.memberId, member.id))
        .orderBy(desc(memberUploads.uploadedAt));
        
      const docMapped = docs.map(d => ({ tipo: d.documentType, stato: d.verifiedAt ? 'Verificato' : 'In attesa', data: d.uploadedAt }));

      const profile = {
        member: {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          phone: member.mobile || member.phone,
          fiscalCode: member.fiscalCode
        },
        tessera: {
          numero: member.cardNumber,
          stato: member.active ? "Attiva" : "Scaduta",
          scadenza: member.cardExpiryDate,
          tipo: member.subscriptionTypeId
        },
        iscrizioni: memberEnrollments.map(e => ({
          corsoNome: e.corsoNome,
          giorno: e.giorno,
          orario: `${e.orarioInizio || ''} - ${e.orarioFine || ''}`.trim(),
          studio: e.studio,
          stato: e.stato
        })),
        documenti: docMapped,
        pagamenti: memberPayments
      };

      res.json(profile);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/area-tesserati/upload-documento", isAuthenticated, docUpload.single("file"), async (req, res) => {
    try {
      const allowedRoles = ["client", "admin", "super admin"];
      if (!req.user?.role || !allowedRoles.includes(req.user.role.toLowerCase())) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!req.file) return res.status(400).json({ error: "Nessun file inviato" });

      const [member] = await db.select().from(members).where(eq(members.userId, req.user.id.toString())).limit(1);
      if (!member) return res.status(404).json({ error: "Profilo non collegato" });

      const documentType = req.body.document_type || "altro";
      const timestamp = Date.now();
      const safeFilename = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `${timestamp}_${safeFilename}`;
      const uploadDir = (await import('path')).join(process.cwd(), 'uploads', 'members', member.id.toString());

      import("fs").then(async fsMod => {
        if (!fsMod.existsSync(uploadDir)) {
          fsMod.mkdirSync(uploadDir, { recursive: true });
        }
        const pathMod = await import('path');
        fsMod.writeFileSync(pathMod.join(uploadDir, filename), req.file!.buffer);
      });

      const fileUrl = `/uploads/members/${member.id}/${filename}`;

      const [insertRes] = await db.insert(memberUploads).values({
        memberId: member.id,
        documentType: documentType as any,
        filename: filename,
        fileUrl: fileUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      });

      res.json({
        id: insertRes.insertId,
        filename: filename,
        file_url: fileUrl
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to upload" });
    }
  });

  app.get("/api/area-tesserati/documenti", isAuthenticated, async (req, res) => {
    try {
      const allowedRoles = ["client", "admin", "super admin"];
      if (!req.user?.role || !allowedRoles.includes(req.user.role.toLowerCase())) {
        return res.status(403).json({ error: "Access denied" });
      }

      const [member] = await db.select().from(members).where(eq(members.userId, req.user.id.toString())).limit(1);
      if (!member) return res.status(404).json({ error: "Profilo non collegato" });

      const uploads = await db.select()
        .from(memberUploads)
        .where(eq(memberUploads.memberId, member.id));

      const { memberFormsSubmissions } = await import('@shared/schema');
      let forms: any[] = [];
      try {
        forms = await db.select().from(memberFormsSubmissions).where(eq(memberFormsSubmissions.memberId, member.id));
      } catch (e) {}

      const unified: any[] = [];

      for (const f of forms) {
        unified.push({
          id: f.id,
          tipo: f.formType,
          label_italiana: `Modulo ${f.formType}`,
          stato: "Firmato",
          data: f.submittedAt,
          download_url: f.documentUrl || `/api/gempass/firme/download/${f.id}`
        });
      }

      for (const u of uploads) {
        unified.push({
          id: u.id,
          tipo: u.documentType,
          label_italiana: u.documentType.replace(/_/g, ' '),
          stato: u.verifiedAt ? "Verificato" : "In elaborazione",
          data: u.uploadedAt,
          download_url: u.fileUrl
        });
      }

      unified.sort((a, b:any) => new Date(b.data || 0).getTime() - new Date(a.data || 0).getTime());

      res.json(unified);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  });


  // ==========================================
  // GEMCHAT ROUTES
  // ==========================================

  app.get("/api/gemchat/unread-counts", isAuthenticated, async (req, res) => {
    try {
      const allowedRoles = ["admin", "super admin", "operator", "direttivo", "back-office", "front-desk"];
      if (!req.user?.role || !allowedRoles.includes(req.user.role.toLowerCase())) {
        return res.status(403).json({ error: "Access denied" });
      }
      const [memberUnread] = await db.select({ count: sql<number>`SUM(unread_team)` })
        .from(gemConversations).where(eq(gemConversations.channel, "member"));
      const [staffUnread] = await db.select({ count: sql<number>`SUM(unread_team)` })
        .from(gemConversations).where(eq(gemConversations.channel, "staff"));
      
      res.json({ 
        member: Number(memberUnread?.count) || 0, 
        staff: Number(staffUnread?.count) || 0 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch unread counts" });
    }
  });

  app.get("/api/gemchat/conversations", isAuthenticated, async (req, res) => {
    try {
      const allowedRoles = ["admin", "super admin", "operator", "direttivo", "back-office", "front-desk"];
      if (!req.user?.role || !allowedRoles.includes(req.user.role.toLowerCase())) {
        return res.status(403).json({ error: "Access denied" });
      }
      const { channel, status } = req.query;
      
      let conditions = [];
      if (channel) conditions.push(eq(gemConversations.channel, channel as "member" | "staff"));
      if (status) conditions.push(eq(gemConversations.status, status as "bot" | "human" | "closed"));
      
      const convs = await db.select({
        conversation: gemConversations,
        memberInfo: {
          id: members.id,
          firstName: members.firstName,
          lastName: members.lastName,
          cardNumber: members.cardNumber
        }
      })
      .from(gemConversations)
      .leftJoin(members, eq(gemConversations.participantId, members.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(gemConversations.lastMessageAt));
      
      res.json(convs);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/gemchat/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      await db.update(gemMessages)
        .set({ isRead: 1 })
        .where(
          and(
            eq(gemMessages.conversationId, id),
            sql`sender_type != 'team'`
          )
        );
        
      await db.update(gemConversations)
        .set({ unreadTeam: 0 })
        .where(eq(gemConversations.id, id));
        
      const msgs = await db.select()
        .from(gemMessages)
        .where(eq(gemMessages.conversationId, id))
        .orderBy(gemMessages.createdAt);
        
      res.json(msgs);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/gemchat/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const allowedRoles = ["admin", "super admin", "operator", "direttivo", "back-office", "front-desk"];
      if (!req.user?.role || !allowedRoles.includes(req.user.role.toLowerCase())) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const { content, attachment_url, attachment_name, attachment_size, quick_link_type, quick_link_id } = req.body;
      
      await db.insert(gemMessages).values({
        conversationId: id,
        senderType: "team",
        senderId: req.user.id.toString(),
        content,
        attachmentUrl: attachment_url,
        attachmentName: attachment_name,
        attachmentSize: attachment_size,
        quickLinkType: quick_link_type,
        quickLinkId: quick_link_id
      });
      
      const conv = await db.select().from(gemConversations).where(eq(gemConversations.id, id)).limit(1);
      if (conv[0]) {
        let newStatus = conv[0].status;
        let newAssignedTo = conv[0].assignedTo;
        
        if (newStatus === "bot") {
          newStatus = "human";
          newAssignedTo = req.user.id.toString();
        }
        
        await db.update(gemConversations).set({
          unreadParticipant: (conv[0].unreadParticipant || 0) + 1,
          lastMessageAt: new Date(),
          status: newStatus,
          assignedTo: newAssignedTo
        }).where(eq(gemConversations.id, id));
      }
      
      res.status(201).json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.post("/api/gemchat/bot-reply", isAuthenticated, async (req, res) => {
    try {
      const { conversation_id, member_message } = req.body;
      const conv = await db.select().from(gemConversations).where(eq(gemConversations.id, conversation_id)).limit(1);
      if (!conv.length) return res.status(404).json({ error: "Conversation not found" });
      
      const mbId = conv[0].participantId;
      const [memberRecord] = await db.select().from(members).where(eq(members.id, mbId)).limit(1);
      
      const memberContext = {
        memberId: mbId,
        name: `${memberRecord?.firstName || ''} ${memberRecord?.lastName || ''}`.trim(),
        cardNumber: memberRecord?.cardNumber,
        cardStatus: memberRecord?.active ? "Attiva" : "Inattiva",
        cardExpiry: memberRecord?.cardExpiryDate,
        activeEnrollments: [] 
      };
      
      const botContext = (conv[0].botContext as any[]) || [];
      
      const { generateTeobotReply } = await import("./utils/aiProvider.js");
      const { reply, handoff } = await generateTeobotReply(memberContext, botContext, member_message);
      
      await db.insert(gemMessages).values({
        conversationId: conversation_id,
        senderType: "bot",
        content: reply
      });
      
      botContext.push(
        { sender_type: 'member', content: member_message },
        { sender_type: 'bot', content: reply }
      );
      if (botContext.length > 10) botContext.splice(0, botContext.length - 10);
      
      let finalStatus = conv[0].status;
      if (handoff) {
         finalStatus = "human";
         const operators = await db.select().from(users).where(sql`last_seen_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)`);
         for (let op of operators) {
            await db.insert(notifications).values({
               userId: op.id,
               title: "Nuova chat passata a operatore",
               message: `Il tesserato ${memberContext.name} ha richiesto assistenza umana.`,
               type: "chat_handoff",
               isRead: false
            });
         }
      }
      
      await db.update(gemConversations).set({
        botContext: botContext,
        status: finalStatus,
        lastMessageAt: new Date()
      }).where(eq(gemConversations.id, conversation_id));
      
      res.json({ reply, handoff });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Bot reply failed" });
    }
  });

  app.post("/api/gemchat/conversations", async (req, res) => {
    try {
      const { member_id, first_message } = req.body;
      const mems = await db.select().from(members).where(eq(members.id, member_id)).limit(1);
      if (!mems.length) return res.status(404).json({ error: "Member not found" });
      
      let [conv] = await db.select().from(gemConversations).where(
        and(eq(gemConversations.participantId, member_id), eq(gemConversations.channel, "member"))
      ).limit(1);
      
      let conversationId = conv?.id;
      if (!conv) {
        const [insertRes] = await db.insert(gemConversations).values({
           channel: "member",
           participantId: member_id,
           status: "bot",
           botContext: []
        });
        conversationId = insertRes.insertId;
        conv = { id: conversationId, status: "bot", botContext: [] } as any;
      }
      
      await db.insert(gemMessages).values({
        conversationId: conversationId,
        senderType: "member",
        content: first_message
      });
      
      let bot_reply = "Mi dispiace, non sono momentaneamente disponibile.";
      let handoff = false;
      try {
        const { generateTeobotReply } = await import("./utils/aiProvider.js");
        const memberContext = {
          memberId: member_id,
          name: `${mems[0].firstName} ${mems[0].lastName}`.trim(),
          cardNumber: mems[0].cardNumber,
          cardStatus: mems[0].active ? "Attiva" : "Inattiva",
          cardExpiry: mems[0].cardExpiryDate
        };
        const botContext = (conv.botContext as any[]) || [];
        const result = await generateTeobotReply(memberContext, botContext, first_message);
        bot_reply = result.reply;
        handoff = result.handoff;
        
        await db.insert(gemMessages).values({
          conversationId: conversationId,
          senderType: "bot",
          content: bot_reply
        });
        
        botContext.push(
          { sender_type: 'member', content: first_message },
          { sender_type: 'bot', content: bot_reply }
        );
        if (botContext.length > 10) botContext.splice(0, botContext.length - 10);
        
        if (handoff) {
           await db.update(gemConversations).set({ status: "human", botContext, lastMessageAt: new Date() }).where(eq(gemConversations.id, conversationId));
           const operators = await db.select().from(users).where(sql`last_seen_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)`);
           for (let op of operators) {
              await db.insert(notifications).values({
                 userId: op.id,
                 title: "Handoff Chat", message: "Assistenza richiesta.", type: "chat_handoff", isRead: false
              });
           }
        } else {
           await db.update(gemConversations).set({ botContext, lastMessageAt: new Date() }).where(eq(gemConversations.id, conversationId));
        }
      } catch (e) {
         console.error("bot fail", e);
      }
      
      res.json({ conversationId, bot_reply, handoff });
    } catch (err) {
       console.error(err);
       res.status(500).json({ error: "Failed" });
    }
  });

  app.post("/api/gemchat/conversations/:id/messages/member", async (req, res) => {
     try {
        const id = parseInt(req.params.id);
        const { member_id, content, attachment_url, attachment_name } = req.body;
        
        const [conv] = await db.select().from(gemConversations).where(
           and(eq(gemConversations.id, id), eq(gemConversations.participantId, member_id))
        ).limit(1);
        if (!conv) return res.status(404).json({ error: "Conversation not found or mismatch" });
        
        const [insertRes] = await db.insert(gemMessages).values({
           conversationId: id,
           senderType: "member",
           content,
           attachmentUrl: attachment_url,
           attachmentName: attachment_name
        });
        
        const message_id = insertRes.insertId;
        
        if (conv.status === "human") {
           await db.update(gemConversations).set({
              unreadTeam: (conv.unreadTeam || 0) + 1,
              lastMessageAt: new Date()
           }).where(eq(gemConversations.id, id));
           return res.json({ message_id });
        }
        
        let bot_reply;
        try {
           const { generateTeobotReply } = await import("./utils/aiProvider.js");
           const [mems] = await db.select().from(members).where(eq(members.id, member_id)).limit(1);
           const memberContext = {
             memberId: member_id, name: `${mems.firstName} ${mems.lastName}`, cardNumber: mems.cardNumber, cardStatus: mems.active ? "Attiva" : "Inattiva", cardExpiry: mems.cardExpiryDate
           };
           const botContext = (conv.botContext as any[]) || [];
           const result = await generateTeobotReply(memberContext, botContext, content);
           bot_reply = result.reply;
           const handoff = result.handoff;
           
           await db.insert(gemMessages).values({ conversationId: id, senderType: "bot", content: bot_reply });
           botContext.push(
             { sender_type: 'member', content },
             { sender_type: 'bot', content: bot_reply }
           );
           if (botContext.length > 10) botContext.splice(0, botContext.length - 10);
           
           if (handoff) {
              await db.update(gemConversations).set({ status: "human", botContext, lastMessageAt: new Date(), unreadTeam: (conv.unreadTeam || 0) + 1 }).where(eq(gemConversations.id, id));
           } else {
              await db.update(gemConversations).set({ botContext, lastMessageAt: new Date() }).where(eq(gemConversations.id, id));
           }
        } catch(e) {}
        
        res.json({ message_id, bot_reply });
     } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed" });
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


  // ============================================
  // ZOD SCHEMAS PER QUOTE/PROMO/CONTABILITA'
  // ============================================
  const insertPromoRuleSchema = createInsertSchema(promoRules).omit({ id: true, createdAt: true, updatedAt: true });
  const insertCarnetWalletSchema = createInsertSchema(carnetWallets).omit({ id: true, createdAt: true, updatedAt: true, usedUnits: true });
  const insertInstructorAgreementSchema = createInsertSchema(instructorAgreements).omit({ id: true, createdAt: true, updatedAt: true });
  const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, createdAt: true });

  // ============================================
  // BLOCCO 1: PROMO RULES
  // ============================================
  app.get("/api/promo-rules", isAuthenticated, async (req, res) => {
    try {
      const q = { ...req.query, ...(await resolveSeason(req.query)) };
      res.json(await storage.getPromoRules(q));
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/promo-rules", isAuthenticated, async (req, res) => {
    try {
      const data = insertPromoRuleSchema.parse(req.body);
      const created = await storage.createPromoRule(data);
      // @ts-ignore // TODO: STI-cleanup
      await storage.logActivity({userId: req.user!.id, action: "Creazione Promo", entity: "promo_rules", entityId: created.id.toString(), details: `Creato codice ${created.code}`});
      res.status(201).json({ success: true, data: created });
    } catch(err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.put("/api/promo-rules/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertPromoRuleSchema.partial().parse(req.body);
      const updated = await storage.updatePromoRule(id, data);
      // @ts-ignore // TODO: STI-cleanup
      await storage.logActivity({userId: req.user!.id, action: "Modifica Promo", entity: "promo_rules", entityId: id.toString(), details: `Modificato codice ${updated.code}`});
      res.json({ success: true, data: updated });
    } catch(err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete("/api/promo-rules/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePromoRule(id);
      res.json({ success: true });
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/promo-rules/validate", isAuthenticated, async (req, res) => {
    try {
      const { code, amount, activityType, memberId } = req.body;
      const rules = await storage.getPromoRules({ search: code, active: "true" });
      const exactRule = rules.find(r => r.code.toUpperCase() === code?.toUpperCase());
      
      if (!exactRule) return res.json({ valid: false, reason: "Codice inesistente." });
      if (exactRule.isExpired) return res.json({ valid: false, reason: "Codice scaduto." });
      // @ts-ignore // TODO: STI-cleanup
      if (exactRule.maxUses && exactRule.usedCount >= exactRule.maxUses) return res.json({ valid: false, reason: "Limite utilizzi superato." });
      if (exactRule.excludeOpen && activityType?.includes("open")) return res.json({ valid: false, reason: "Non applicabile su corsi OPEN." });
      // @ts-ignore // TODO: STI-cleanup
      if (exactRule.targetType === "personal" && exactRule.targetRefId !== memberId) return res.json({ valid: false, reason: "Codice riservato ad altro utente." });

      // Calculate discount
      let discountAmount = 0;
      // @ts-ignore // TODO: STI-cleanup
      if (exactRule.discountType === "fixed") {
          // @ts-ignore // TODO: STI-cleanup
          discountAmount = parseFloat(exactRule.discountValue);
      } else {
          // @ts-ignore // TODO: STI-cleanup
          discountAmount = (amount * parseFloat(exactRule.discountValue)) / 100;
      }
      
      const finalAmount = amount - discountAmount;
      await storage.incrementPromoRuleUse(exactRule.id);
      
      res.json({ valid: true, discountAmount, finalAmount: finalAmount < 0 ? 0 : finalAmount });
    } catch(err: any) {
      res.status(500).json({ valid: false, reason: "Errore di calcolo: " + err.message });
    }
  });

  // ============================================
  // BLOCCO 2: WELFARE PROVIDERS
  // ============================================
  app.get("/api/welfare-providers", isAuthenticated, async (req, res) => {
    try {
      res.json(await storage.getWelfareProviders());
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.patch("/api/welfare-providers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      delete data.name; // block changing name
      const provider = await storage.updateWelfareProvider(id, data);
      res.json({ success: true, data: provider });
    } catch(err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // ============================================
  // BLOCCO 3: CARNET WALLETS
  // ============================================
  app.get("/api/carnet-wallets", isAuthenticated, async (req, res) => {
    try {
      const q = { ...req.query, ...(await resolveSeason(req.query)) };
      res.json(await storage.getCarnetWallets(q));
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/carnet-wallets", isAuthenticated, async (req, res) => {
    try {
      const data = insertCarnetWalletSchema.parse(req.body);
      const created = await storage.createCarnetWallet(data);
      res.status(201).json({ success: true, data: created });
    } catch(err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post("/api/carnet-wallets/:id/use", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.useCarnetWallet(id, req.body);
      // @ts-ignore // TODO: STI-cleanup
      await storage.logActivity({userId: req.user!.id, action: "Uso Carnet", entity: "carnet_wallets", entityId: id.toString(), details: `Scalato 1 ingresso. Rimasti: ${result.wallet.totalUnits - result.wallet.usedUnits}`});
      res.json({ success: true, data: result });
    } catch(err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get("/api/carnet-wallets/:id/sessions", isAuthenticated, async (req, res) => {
    try {
      res.json(await storage.getCarnetSessions(parseInt(req.params.id)));
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ============================================
  // BLOCCO 4: INSTRUCTOR AGREEMENTS
  // ============================================
  app.get("/api/instructor-agreements", isAuthenticated, async (req, res) => {
    try {
      const q = { ...req.query, ...(await resolveSeason(req.query)) };
      res.json(await storage.getInstructorAgreements(q));
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/instructor-agreements", isAuthenticated, async (req, res) => {
    try {
      const data = insertInstructorAgreementSchema.parse(req.body);
      const overrides = req.body.overrides || [];
      const created = await storage.createInstructorAgreement(data, overrides);
      res.status(201).json({ success: true, data: created });
    } catch(err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.put("/api/instructor-agreements/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertInstructorAgreementSchema.partial().parse(req.body);
      const overrides = req.body.overrides;
      const updated = await storage.updateInstructorAgreement(id, data, overrides);
      res.json({ success: true, data: updated });
    } catch(err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post("/api/instructor-agreements/:id/payment", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const payId = await storage.createInstructorPayment(id, req.body);
      // @ts-ignore // TODO: STI-cleanup
      await storage.logActivity({userId: req.user!.id, action: "Pagamento Accordo", entity: "instructor_agreements", entityId: id.toString(), details: `Pagamento generato ID ${payId}`});
      res.json({ success: true, data: { paymentId: payId } });
    } catch(err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete("/api/instructor-agreements/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteInstructorAgreement(parseInt(req.params.id));
      res.json({ success: true });
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ============================================
  // BLOCCO 5: PAGODIL TIERS
  // ============================================
  app.get("/api/pagodil-tiers", isAuthenticated, async (req, res) => {
    try {
      res.json(await storage.getPagodilTiers());
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/pagodil-tiers/calculate", isAuthenticated, async (req, res) => {
    try {
      const { amount, providerName = "pagodil" } = req.body;
      const tiers = await storage.getPagodilTiers();
      const amountVal = parseFloat(amount);
      const target = tiers.find(t => t.providerName === providerName && amountVal >= parseFloat(t.rangeMin) && amountVal <= parseFloat(t.rangeMax));
      if (!target) return res.status(404).json({ success: false, error: "Nessun tier Pagodil applicabile per questo importo." });
      
      const fee = parseFloat(target.feeAmount);
      const totalStr = target.feeType === "fixed" ? (amountVal + fee).toFixed(2) : (amountVal + (amountVal * fee / 100)).toFixed(2);
      
      res.json({ success: true, data: { feeAmount: fee, feeType: target.feeType, totalWithFee: parseFloat(totalStr) } });
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ============================================
  // BLOCCO 6: CONTABILITA' BASE
  // ============================================
  app.get("/api/cost-centers", isAuthenticated, async (req, res) => {
    try {
      res.json(await storage.getCostCenters());
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/accounting-periods", isAuthenticated, async (req, res) => {
    try {
      const q = { ...req.query, ...(await resolveSeason(req.query)) };
      res.json(await storage.getAccountingPeriods(q));
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/journal-entries", isAuthenticated, async (req, res) => {
    try {
      res.json(await storage.getJournalEntries(req.query));
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/journal-entries", isAuthenticated, async (req, res) => {
    try {
      const data = insertJournalEntrySchema.parse(req.body);
      const entry = await storage.createJournalEntry(data);
      res.status(201).json({ success: true, data: entry });
    } catch(err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // AGEVOLAZIONI (F1-007)
  // ==========================================

  // MEMBER DISCOUNTS
  app.get("/api/member-discounts", isAuthenticated, async (req, res) => {
    try {
      const { memberId, isUsed, seasonId } = req.query;
      let query = db.select().from(memberDiscounts);
      // Minimal implementation for now
      const data = await query;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/member-discounts/:memberId/active", isAuthenticated, async (req, res) => {
    try {
      const data = await db.select().from(memberDiscounts)
        .where(and(
          eq(memberDiscounts.memberId, parseInt(req.params.memberId)),
          eq(memberDiscounts.isUsed, false)
        ));
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/member-discounts", isAuthenticated, async (req, res) => {
    try {
      const [result] = await db.insert(memberDiscounts).values({
        ...req.body,
        tenantId: (req.user as any)?.tenantId || 1
      });
      res.json({ success: true, id: result.insertId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/member-discounts/:id/use", isAuthenticated, async (req, res) => {
    try {
      await db.update(memberDiscounts)
        .set({ isUsed: true, usedAt: new Date(), paymentId: req.body.paymentId })
        .where(eq(memberDiscounts.id, parseInt(req.params.id)));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // COMPANY AGREEMENTS
  app.get("/api/company-agreements", isAuthenticated, async (req, res) => {
    try {
      const data = await db.select().from(companyAgreements);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/company-agreements/:id", isAuthenticated, async (req, res) => {
    try {
      const [data] = await db.select().from(companyAgreements)
        .where(eq(companyAgreements.id, parseInt(req.params.id)));
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/company-agreements", isAuthenticated, async (req, res) => {
    try {
      const [result] = await db.insert(companyAgreements).values({
        ...req.body,
        tenantId: (req.user as any)?.tenantId || 1
      });
      res.json({ success: true, id: result.insertId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/company-agreements/:id", isAuthenticated, async (req, res) => {
    try {
      await db.update(companyAgreements)
        .set(req.body)
        .where(eq(companyAgreements.id, parseInt(req.params.id)));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // STAFF RATES
  app.get("/api/staff-rates", isAuthenticated, async (req, res) => {
    try {
      const data = await db.select().from(staffRates);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/staff-rates", isAuthenticated, async (req, res) => {
    try {
      const [result] = await db.insert(staffRates).values({
        ...req.body,
        tenantId: (req.user as any)?.tenantId || 1
      });
      res.json({ success: true, id: result.insertId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/staff-rates/:id", isAuthenticated, async (req, res) => {
    try {
      await db.update(staffRates)
        .set(req.body)
        .where(eq(staffRates.id, parseInt(req.params.id)));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // PRICING RULES (F1-008)
  // ==========================================

  app.get("/api/price-matrix", isAuthenticated, async (req, res) => {
    try {
      const q = { ...req.query, ...(await resolveSeason(req.query)) };
      // @ts-ignore // TODO: STI-cleanup
      res.json(await storage.getPriceMatrix(q));
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/pricing-rules", isAuthenticated, async (req, res) => {
    try {
      // In a real scenario we'd parse appliesTo and active from req.query
      const data = await db.select().from(pricingRules);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/pricing-rules/calculate", isAuthenticated, async (req, res) => {
    try {
      const { basePrice, appliesTo, groupSize, locationType, walletType, unitCount, trialDate } = req.body;
      
      const rules = await db.select().from(pricingRules)
        .where(eq(pricingRules.isActive, true)); // Add sorting and appliesTo filtering logic here as needed

      // Minimal mock calculation
      const appliedRules: any[] = [];
      let finalPrice = Number(basePrice) || 0;
      let bonusUnits = 0;

      for (const r of rules) {
         if (r.appliesTo !== appliesTo && r.appliesTo !== 'tutti') continue;

         let triggered = false;
         if (r.triggerCondition === 'group_size_gte' && groupSize >= Number(r.triggerValue)) triggered = true;
         if (r.triggerCondition === 'location_type_eq' && locationType === 'domicilio') triggered = true; // simplified
         if (r.triggerCondition === 'units_completed' && unitCount >= Number(r.triggerValue)) triggered = true;

         if (triggered) {
            let value = Number(r.effectValue);
            if (r.effectType === 'add_fixed') {
              if (r.ruleType === 'extra_per_person' && groupSize > 2) {
                 finalPrice += value * (groupSize - 2); 
                 value = value * (groupSize - 2);
              } else {
                 finalPrice += value;
              }
            } else if (r.effectType === 'add_bonus_unit') {
                bonusUnits += value;
            } else if (r.effectType === 'subtract_fixed') {
                finalPrice = Math.max(0, finalPrice - value);
            } else if (r.effectType === 'set_free') {
                finalPrice = 0;
            } else if (r.effectType === 'set_price') {
                finalPrice = value;
            }

            appliedRules.push({ ruleCode: r.ruleCode, effect: r.effectType, value });
         }
      }

      res.json({ basePrice, appliedRules, finalPrice, bonusUnits });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/pricing-rules", isAuthenticated, async (req, res) => {
    try {
      const [result] = await db.insert(pricingRules).values({
        ...req.body,
        tenantId: (req.user as any)?.tenantId || 1
      });
      res.json({ success: true, id: result.insertId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/pricing-rules/:id", isAuthenticated, async (req, res) => {
    try {
      await db.update(pricingRules)
        .set(req.body)
        .where(eq(pricingRules.id, parseInt(req.params.id)));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // LEZIONI SINGOLE SPOT (F1-008)
  // ==========================================

  app.get("/api/lezioni-spot", isAuthenticated, async (req, res) => {
    try {
      const data = await db.select().from(payments)
        .where(eq(payments.type, "lezione_spot"));
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/lezioni-spot", isAuthenticated, async (req, res) => {
    try {
      const { memberId, instructorId, sessionDate, sessionTimeStart, sessionTimeEnd, lessonType, locationType, amount, paymentMethodId, notes } = req.body;
      
      const [result] = await db.insert(payments).values({
        // @ts-ignore // TODO: STI-cleanup
        tenantId: (req.user as any)?.tenantId || 1,
        memberId: memberId,
        type: "lezione_spot",
        amount: String(amount),
        status: "saldato",
        paymentMethodId: paymentMethodId,
        paymentDate: sessionDate,
        description: `Lezione ${lessonType} - ${sessionDate}`,
        costCenterCode: "PRIVATI",
        notes: notes
      });

      // @ts-ignore // TODO: STI-cleanup
      await db.insert(journalEntries).values({
        tenantId: (req.user as any)?.tenantId || 1,
        date: sessionDate,
        description: `Incasso lezione spot ${lessonType}`,
        amount: String(amount),
        type: 'revenue',
        creditAccount: '4020-RicaviPrivati',
        debitAccount: '1000-Cassa', // simplistic mock
        paymentId: result.insertId,
        costCenterId: 1
      });

      res.json({ success: true, paymentId: result.insertId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // ============================================
  // BLOCCO 12: PREZZI E CHECKOUT
  // ============================================

  app.get("/api/price-matrix/suggest", isAuthenticated, async (req, res) => {
    try {
      const q = { ...req.query, ...(await resolveSeason(req.query)) };
      // @ts-ignore // TODO: STI-cleanup
      const { category, courseCount, groupSize, locationType } = q;
      
      const now = new Date();
      let currentMonth = now.getMonth() + 1;
      
      const { priceMatrix, pricingRules } = await import('../shared/schema');
      const { and, eq } = await import('drizzle-orm');
      
      const conds = [eq(priceMatrix.seasonId, q.seasonId)];
      if (category) conds.push(eq(priceMatrix.category, String(category)));
      if (courseCount) conds.push(eq(priceMatrix.courseCount, parseInt(String(courseCount))));

      const [priceRow] = await db.select().from(priceMatrix).where(and(...conds));

      let basePrice = priceRow ? Number(priceRow.basePrice) : 240;
      let finalPrice = basePrice;
      // @ts-ignore // TODO: STI-cleanup
      let appliedRules = [];

      res.json({
        basePrice,
        finalPrice,
        // @ts-ignore // TODO: STI-cleanup
        appliedRules,
        monthIndex: currentMonth,
        note: "Prezzo dinamicamente calcolato"
      });
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/price-matrix/full-catalog", isAuthenticated, async (req, res) => {
    try {
      const q = { ...req.query, ...(await resolveSeason(req.query)) };
      const { priceMatrix, seasons } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const matrix = await db.select().from(priceMatrix).where(eq(priceMatrix.seasonId, q.seasonId));
      const [season] = await db.select().from(seasons).where(eq(seasons.id, q.seasonId));

      const categories: any = {};
      matrix.forEach(row => {
        const cat = row.category || 'default';
        if (!categories[cat]) categories[cat] = [];
        let r = categories[cat].find((x:any) => x.courseCount === row.courseCount);
        if (!r) {
          r = { courseCount: row.courseCount, prices: [] };
          categories[cat].push(r);
        }
        r.prices.push({ month: row.notes || "Generico", price: Number(row.basePrice) });
      });

      res.json({
        season: season ? { id: season.id, name: season.name } : null,
        categories
      });
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  
  app.post("/api/checkout/calculate", isAuthenticated, async (req, res) => {
    try {

      const q = { ...req.body, ...(await resolveSeason(req.body)) };
      const { priceMatrix, pricingRules } = await import('../shared/schema');
      const { eq, and, lte, gte } = await import('drizzle-orm');

      let subtotal = 0;
      let membershipFee = q.includeMembership ? 25 : 0;
      let promoDiscount = 0;
      let responseItems = [];

      const now = new Date();
      let currentMonth = now.getMonth() + 1;

      for (let item of q.items) {
        // Query DB explicitly for real price
        const conds = [
          eq(priceMatrix.seasonId, q.seasonId),
          eq(priceMatrix.category, item.category)
        ];
        if (item.quantityType) conds.push(eq(priceMatrix.quantityType, item.quantityType));
        if (item.courseCount) conds.push(eq(priceMatrix.courseCount, item.courseCount));
        
        let pRules = [
          ...conds,
          lte(priceMatrix.validFromMonth, currentMonth),
          gte(priceMatrix.validToMonth, currentMonth)
        ];

        let [priceRow] = await db.select().from(priceMatrix).where(and(...pRules));
        
        // Fallback or warnings
        let bp = 0;
        let warnings = [];
        if (!priceRow) {
          // If month bounds didn't match, maybe they are null. Let's try without month bounds
          const [fallback] = await db.select().from(priceMatrix).where(and(...conds));
          if(fallback) {
             bp = Number(fallback.basePrice);
          } else {
             warnings.push(`Prezzo non trovato in price_matrix per ${item.category}`);
          }
        } else {
          bp = Number(priceRow.basePrice);
        }

        let fp = bp;
        let appliedRules = [];

        // Apply rules logic specifically as per user
        if (item.groupSize >= 3 && item.type === 'affitto') {
           let extra = (item.groupSize - 2) * 5;
           fp += extra;
           appliedRules.push(`+5€/persona dal 3° allievo (+ ${extra}€)`);
        }
        if (item.locationType === 'domicilio') {
           fp += 10;
           appliedRules.push('+10€ Domicilio');
        }

        fp *= item.quantity;
        subtotal += fp;
        
        responseItems.push({
          description: `${item.type} (${item.category})`,
          basePrice: bp,
          finalPrice: fp,
          appliedRules: appliedRules,
          warnings: warnings.length ? warnings : undefined
        });
      }

      res.json({
        items: responseItems,
        subtotal,
        membershipFee,
        promoDiscount,
        total: subtotal + membershipFee - promoDiscount,
        warnings: responseItems.flatMap(r => r.warnings || [])
      });
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/checkout/complete", isAuthenticated, async (req, res) => {
    // keep as is from before
    try {
      const body = { ...req.body, ...(await resolveSeason(req.body)) };
      const { payments, journalEntries } = await import('../shared/schema');
      
      const result = await db.transaction(async (tx: any) => {
        let total = body.totalAmount || 0; // Se ui calcola totalAmount passa quello.
        if (total === 0) total = 265; // Fallback mock

        const [payRes] = await tx.insert(payments).values({
          tenantId: 1,
          memberId: body.memberId,
          amount: total,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethodId: body.paymentMethodId || 1,
          type: "checkout",
          status: "COMPLETED",
          description: "Acquisto da Checkout UI",
          source: body.source || "sede",
          seasonId: body.seasonId
        });

        // Journal Entry automatica
        const [jeRes] = await tx.insert(journalEntries).values({
          tenantId: 1,
          paymentId: payRes.insertId,
          entryDate: new Date().toISOString().split('T')[0],
          description: "Incasso Checkout",
          debitAccount: "1000-Cassa",
          creditAccount: "4010-Ricavi",
          amount: total,
          isAuto: true
        });

        return {
          paymentId: payRes.insertId,
          journalEntryId: jeRes.insertId,
          receiptDescription: "Ricevuta Checkout Creata"
        };
      });

      res.json(result);
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/checkout/status/:paymentId", isAuthenticated, async (req, res) => {
    try {
      const pid = parseInt(req.params.paymentId);
      const { payments, journalEntries, carnetWallets, members } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');

      const [payment] = await db.select().from(payments).where(eq(payments.id, pid));
      if(!payment) return res.status(404).json({error: "Not found"});
      
      // @ts-ignore // TODO: STI-cleanup
      const [member] = await db.select({ id: members.id, firstName: members.firstName, lastName: members.lastName }).from(members).where(eq(members.id, payment.memberId));
      const [journal] = await db.select().from(journalEntries).where(eq(journalEntries.paymentId, pid));
      // mock carnet search
      const carnet = null; 

      res.json({
        payment: { id: payment.id, amount: payment.amount, status: payment.status, source: payment.source },
        carnetWallet: carnet,
        journalEntry: journal || null,
        member: member || null
      });
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // WEBHOOKS STRUTTURA
  
  async function updateWebhookLog(id: number, status: string, error: string | null = null, paymentId: number | null = null) {
      const { webhookLogs } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      await db.update(webhookLogs)
        .set({
          status,
          processedAt: new Date(),
          errorMessage: error,
          paymentId
        })
        .where(eq(webhookLogs.id, id));
  }

  async function processWooCommerceOrder(payload: any, logId: number) {
      const { webhookLogs, members, payments, enrollments, journalEntries, promoRules } = await import('../shared/schema');
      const { eq, and } = await import('drizzle-orm');

      // 1. Idempotenza
      const existing = await db.select().from(webhookLogs).where(
        and(
          eq(webhookLogs.externalId, payload.id.toString()),
          eq(webhookLogs.source, 'woocommerce'),
          eq(webhookLogs.status, 'processed')
        )
      );
      if (existing.length > 0) return { skipped: true, reason: 'already_processed' };

      // 2. Solo completati
      if (payload.status !== 'completed') {
        await updateWebhookLog(logId, 'ignored', 'Order not completed');
        return { skipped: true, reason: 'not_completed' };
      }

      // 3. Trova o crea Member
      let member = await db.select().from(members).where(eq(members.email, payload.billing.email)).limit(1);
      let memberId;
      if (member.length === 0) {
        const [newMember] = await db.insert(members).values({
          firstName: payload.billing.first_name,
          lastName: payload.billing.last_name,
          email: payload.billing.email,
          participantType: 'ADULTO',
          notes: 'Creato automaticamente da ordine WooCommerce'
        });
        memberId = newMember.insertId;
      } else {
        memberId = member[0].id;
      }

      // 4. Transazione atomica
      const result = await db.transaction(async (tx: any) => {
        let promoDiscount = 0;
        let promoCodeUsed = null;
        if (payload.coupon_lines?.length > 0) {
          const couponCode = payload.coupon_lines[0].code;
          const [promoRule] = await tx.select().from(promoRules).where(eq(promoRules.code, couponCode));
          if (promoRule) {
            promoCodeUsed = couponCode;
            if (promoRule.ruleType === 'percentage') {
              promoDiscount = (Number(payload.total) * Number(promoRule.value)) / 100;
            }
          }
        }

        const [payResult] = await tx.insert(payments).values({
          tenantId: 1,
          memberId: memberId,
          amount: Number(payload.total),
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethodId: 1, // mapping da fare
          type: 'iscrizione_corso',
          status: 'COMPLETED',
          source: 'webhook_woocommerce',
          description: `Ordine WooCommerce #${payload.id}`,
          promoCode: promoCodeUsed,
          promoValue: promoDiscount > 0 ? promoDiscount : null,
          costCenterCode: 'CORSI',
          accountingCode: '4010-RicaviCorsi',
          seasonId: 1
        });
        const paymentId = payResult.insertId;

        const enrollmentIds = [];
        for (const item of payload.line_items) {
          const category = item.meta_data?.find((m:any) => m.key === '_stargem_category')?.value || 'adulti';
          const [enrollResult] = await tx.insert(enrollments).values({
            memberId: memberId,
            courseId: 1, // TODO: mock per il Drizzle Schema constraints (courseId NotNull). Reale: activity_id o null.
            participationType: 'STANDARD_COURSE',
            status: 'active',
            onlineSource: true,
            pendingMedicalCert: true,
            pendingMembership: false,
            completionNotes: `Da ordine Woo #${payload.id}. Cat: ${category}. Assegnare a corso specifico.`,
            seasonId: 1
          });
          enrollmentIds.push(enrollResult.insertId);
        }

        await tx.insert(journalEntries).values({
          tenantId: 1,
          paymentId: paymentId,
          entryDate: new Date().toISOString().split('T')[0],
          description: `WooCommerce #${payload.id} - ${payload.billing.last_name}`,
          debitAccount: '1010-Banca',
          creditAccount: '4010-RicaviCorsi',
          amount: Number(payload.total),
          isAuto: true
        });

        return { paymentId, enrollmentIds };
      });

      await updateWebhookLog(logId, 'processed', null, result.paymentId);
      return result;
  }

  // WEBHOOKS STRUTTURA E LOGICA
  app.post("/api/webhooks/woocommerce", async (req, res) => {
    res.status(200).send("OK");
    try {
      const { webhookLogs } = await import('../shared/schema');
      const [log] = await db.insert(webhookLogs).values({
        tenantId: 1,
        source: 'woocommerce',
        status: 'received',
        externalId: req.body?.id?.toString(),
        eventType: req.body?.status,
        rawPayload: req.body
      });

      processWooCommerceOrder(req.body, log.insertId).catch(async err => {
        console.error('Webhook processing error:', err);
        await updateWebhookLog(log.insertId, 'failed', err.message);
      });
    } catch(err) {
      console.error(err);
    }
  });

  app.post("/api/webhooks/stripe", async (req, res) => {
    res.status(200).send("OK");
    try {
      const { webhookLogs } = await import('../shared/schema');
      const sig = req.headers['stripe-signature'];
      await db.insert(webhookLogs).values({
        tenantId: 1,
        source: 'stripe',
        status: 'received',
        eventType: req.body?.type || 'unknown',
        externalId: req.body?.id || null,
        rawPayload: req.body
      });
    } catch(err) {
      console.error(err);
    }
  });

  // PENDING ENROLLMENTS
  app.get("/api/enrollments/pending", isAuthenticated, async (req, res) => {
    try {
      const { enrollments, members } = await import('../shared/schema');
      const { eq, and, or } = await import('drizzle-orm');

      const data = await db.select({
        enrollmentId: enrollments.id,
        memberId: members.id,
        memberName: members.firstName,
        memberLastName: members.lastName,
        pendingMedicalCert: enrollments.pendingMedicalCert,
        pendingMembership: enrollments.pendingMembership,
        completionNotes: enrollments.completionNotes,
        createdAt: enrollments.createdAt
      })
      .from(enrollments)
      .leftJoin(members, eq(enrollments.memberId, members.id))
      .where(and(
        eq(enrollments.onlineSource, true),
        or(eq(enrollments.pendingMedicalCert, true), eq(enrollments.pendingMembership, true))
      ));
      res.json(data);
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/enrollments/:id/complete", isAuthenticated, async (req, res) => {
    try {
      const { enrollments } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      await db.update(enrollments).set({
        pendingMedicalCert: req.body.pendingMedicalCert,
        pendingMembership: req.body.pendingMembership,
        completionNotes: req.body.completionNotes
      }).where(eq(enrollments.id, parseInt(req.params.id)));
      res.json({success:true});
    } catch(err:any) {
      res.status(500).json({ error: err.message });
    }
  });

  // WEBHOOK LOGS E RETRY
  app.get("/api/webhook-logs", isAuthenticated, async (req, res) => {
    try {
      const { webhookLogs } = await import('../shared/schema');
      const { desc } = await import('drizzle-orm');
      const data = await db.select().from(webhookLogs).orderBy(desc(webhookLogs.createdAt)).limit(100);
      res.json(data);
    } catch(err:any) {
      res.status(500).json({error: err.message});
    }
  });

  app.patch("/api/webhook-logs/:id/retry", isAuthenticated, async (req, res) => {
    try {
      const { webhookLogs } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      const id = parseInt(req.params.id);
      const [log] = await db.select().from(webhookLogs).where(eq(webhookLogs.id, id));
      if(!log) throw new Error("Log non trovato");

      if (log.source === 'woocommerce' && log.rawPayload) {
        const result = await processWooCommerceOrder(log.rawPayload, id);
        res.json({success:true, result});
      } else {
        res.status(400).json({error: "Non riprocessabile"});
      }
    } catch(err:any) {
      res.status(500).json({error: err.message});
    }
  });
  // ==========================================
  // AREA TESSERATI (B2C) API ROUTES
  // ==========================================
  const b2cPath = await import('path');
  const b2cFs = await import('fs/promises');

  // Ensure the directory exists
  await b2cFs.mkdir(b2cPath.join(process.cwd(), 'uploads', 'members'), { recursive: true });

  app.use('/uploads', express.static(b2cPath.join(process.cwd(), 'uploads')));

  const memberDiskUpload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, b2cPath.join(process.cwd(), 'uploads', 'members'));
      },
      filename: (req, file, cb) => {
        const ext = b2cPath.extname(file.originalname);
        const randomName = Math.round(Math.random() * 1E9);
        cb(null, `${req.user?.id || 'unknown'}-${Date.now()}-${randomName}${ext}`);
      }
    }),
    limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
  });

  // ROUTE A: GET /api/area-tesserati/profile
  app.get("/api/area-tesserati/profile", isAuthenticated, async (req, res) => {
    try {
      if (req.user?.role !== "client") {
        return res.status(403).json({ error: "Solo i tesserati possono accedere a quest'area" });
      }
      
      const [member] = await db.select().from(members).where(eq(members.userId, req.user.id));
      if (!member) {
        return res.status(404).json({ error: "Profilo tesserato non trovato" });
      }
      
      const memberEnrollments = await db.select({
        enrollment: enrollments,
        course: courses,
        season: schema.seasons
      })
      .from(enrollments)
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(schema.seasons, eq(enrollments.seasonId, schema.seasons.id))
      .where(eq(enrollments.memberId, member.id))
      .orderBy(desc(enrollments.createdAt));
      
      const recentPayments = await db.select()
        .from(payments)
        .where(eq(payments.memberId, member.id))
        .orderBy(desc(payments.createdAt))
        .limit(5);

      const profileData = {
        member,
        user: req.user,
        enrollments: memberEnrollments,
        recentPayments,
        cardInfo: {
          cardNumber: member.cardNumber,
          cardExpiryDate: member.cardExpiryDate,
          hasMedicalCertificate: member.hasMedicalCertificate,
          medicalCertificateExpiry: member.medicalCertificateExpiry
        }
      };
      
      res.json(profileData);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ROUTE B: POST /api/area-tesserati/upload-documento
  app.post("/api/area-tesserati/upload-documento", isAuthenticated, memberDiskUpload.single("documento"), async (req, res) => {
    try {
      if (req.user?.role !== "client") return res.status(403).json({ error: "Non autorizzato" });
      const [member] = await db.select().from(members).where(eq(members.userId, req.user!.id));
      if (!member) return res.status(404).json({ error: "Non trovato" });
      if (!req.file) return res.status(400).json({ error: "Nessun file caricato" });

      const documentType = req.body.documentType as string;
      if (!["certificato_medico", "documento_identita", "altro"].includes(documentType)) {
        return res.status(400).json({ error: "Tipo documento non valido" });
      }

      const fileUrl = `/uploads/members/${req.file.filename}`;

      const insertData = {
        memberId: member.id,
        documentType: documentType as any,
        filename: req.file.filename,
        fileUrl: fileUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date(),
      };

      const [{ insertId }] = await db.insert(schema.memberUploads).values(insertData);
      const [newDoc] = await db.select().from(schema.memberUploads).where(eq(schema.memberUploads.id, insertId));

      res.json(newDoc);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ROUTE C: GET /api/area-tesserati/documenti
  app.get("/api/area-tesserati/documenti", isAuthenticated, async (req, res) => {
    try {
      if (req.user?.role !== "client") return res.status(403).json({ error: "Non autorizzato" });
      const [member] = await db.select().from(members).where(eq(members.userId, req.user!.id));
      if (!member) return res.status(404).json({ error: "Non trovato" });

      const uploads = await db.select().from(schema.memberUploads).where(eq(schema.memberUploads.memberId, member.id)).orderBy(desc(schema.memberUploads.uploadedAt));
      const forms = await db.select().from(schema.memberFormsSubmissions).where(eq(schema.memberFormsSubmissions.memberId, member.id)).orderBy(desc(schema.memberFormsSubmissions.createdAt));

      res.json({ uploads, forms });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // GEMTEAM F1-022: SCHEDULED SHIFTS & ASSIGNMENTS
  // ==========================================
  
  const isMasterGuard = (req: any, res: any, next: any) => {
    const r = (req.user as any)?.role?.toLowerCase();
    if (!['admin', 'master', 'super admin'].includes(r)) {
      return res.status(403).json({ error: 'Solo per Master/Admin.' });
    }
    next();
  };

  app.get("/api/gemteam/turni/week-assignment", isAuthenticated, async (req, res) => {
    try {
      const weekStartStr = req.query.weekStart as string; // YYYY-MM-DD
      if (!weekStartStr) return res.status(400).json({ error: 'weekStart mancante' });
      
      const targetQuery = await db.select().from(schema.teamWeekAssignments).where(sql`DATE(${schema.teamWeekAssignments.weekStart}) = ${weekStartStr}`);
      if (targetQuery.length > 0) {
        return res.json({ settimana: targetQuery[0].settimana, weekStart: weekStartStr, isOverride: targetQuery[0].isManualOverride });
      }

      // fallback: ciclico A-E. (Logica semplificata: calcolo dummy o fallback su A).
      // Se non definito, restituiamo settimana A per default e isOverride false.
      // (In una V2 qui metteremmo l'algoritmo matematico del ciclo)
      return res.json({ settimana: 'A', weekStart: weekStartStr, isOverride: false });
    } catch(err) {
      console.error(err); return res.status(500).json({ error: 'Errore' });
    }
  });

  app.post("/api/gemteam/turni/week-assignment", isAuthenticated, isMasterGuard, async (req, res) => {
    try {
      const { weekStart, settimana } = req.body;
      const parsedDate = new Date(weekStart);
      
      await db.insert(schema.teamWeekAssignments).values({
        weekStart: parsedDate,
        settimana,
        isManualOverride: true
      }).onDuplicateKeyUpdate({
        set: { settimana, isManualOverride: true, updatedAt: new Date() }
      });
      return res.json({ success: true });
    } catch(err) {
      console.error(err); return res.status(500).json({ error: 'Errore' });
    }
  });

  app.get("/api/gemteam/turni/scheduled", isAuthenticated, async (req, res) => {
    try {
      const dataStr = req.query.data as string;
      const isTemplate = req.query.isTemplate as string;
      if (!dataStr) return res.status(400).json({ error: 'data mancante' });

      if (isTemplate) {
        // Calcola giornoSettimana (0=Lunedì, 6=Domenica)
        const dt = new Date(dataStr);
        let gd = dt.getDay() - 1;
        if (gd === -1) gd = 6;
        
        const records = await db.select({
          id: schema.teamShiftTemplates.id,
          employeeId: schema.teamShiftTemplates.employeeId,
          giornoSettimana: schema.teamShiftTemplates.giornoSettimana,
          oraInizio: schema.teamShiftTemplates.oraInizio,
          oraFine: schema.teamShiftTemplates.oraFine,
          postazione: schema.teamShiftTemplates.postazione,
          note: schema.teamShiftTemplates.note,
          firstName: schema.members.firstName,
          lastName: schema.members.lastName,
          displayOrder: schema.teamEmployees.displayOrder,
          team: schema.teamEmployees.team
        })
        .from(schema.teamShiftTemplates)
        .innerJoin(schema.teamEmployees, eq(schema.teamEmployees.id, schema.teamShiftTemplates.employeeId))
        .innerJoin(schema.members, eq(schema.members.id, schema.teamEmployees.memberId))
        .where(and(
           eq(schema.teamShiftTemplates.settimanaTipo, isTemplate as any),
           eq(schema.teamShiftTemplates.giornoSettimana, gd)
        ))
        .orderBy(sql`${schema.teamEmployees.displayOrder} ASC`, sql`${schema.teamShiftTemplates.oraInizio} ASC`);

        const mapped = records.map(r => ({
          ...r,
          data: new Date(dataStr), // Fake the date so frontend renders it correctly
          hasConflict: false
        }));
        return res.json(mapped);
      }

      const records = await db.select({
        id: schema.teamScheduledShifts.id,
        employeeId: schema.teamScheduledShifts.employeeId,
        data: schema.teamScheduledShifts.data,
        oraInizio: schema.teamScheduledShifts.oraInizio,
        oraFine: schema.teamScheduledShifts.oraFine,
        postazione: schema.teamScheduledShifts.postazione,
        note: schema.teamScheduledShifts.note,
        firstName: schema.members.firstName,
        lastName: schema.members.lastName,
        displayOrder: schema.teamEmployees.displayOrder,
        team: schema.teamEmployees.team,
        assenzaRegistrata: schema.teamAttendanceLogs.tipoAssenza
      })
      .from(schema.teamScheduledShifts)
      .innerJoin(schema.teamEmployees, eq(schema.teamEmployees.id, schema.teamScheduledShifts.employeeId))
      .innerJoin(schema.members, eq(schema.members.id, schema.teamEmployees.memberId))
      .leftJoin(schema.teamAttendanceLogs, and(
         eq(schema.teamAttendanceLogs.employeeId, schema.teamScheduledShifts.employeeId),
         sql`DATE(${schema.teamAttendanceLogs.data}) = ${dataStr}`,
         isNotNull(schema.teamAttendanceLogs.tipoAssenza)
      ))
      .where(sql`DATE(${schema.teamScheduledShifts.data}) = ${dataStr}`)
      .orderBy(sql`${schema.teamEmployees.displayOrder} ASC`, sql`${schema.teamScheduledShifts.oraInizio} ASC`);

      const mapped = records.map(r => ({
        ...r,
        hasConflict: !!r.assenzaRegistrata
      }));
      return res.json(mapped);
    } catch(err) {
      console.error(err); return res.status(500).json({ error: 'Errore' });
    }
  });

  app.post("/api/gemteam/turni/scheduled", isAuthenticated, isMasterGuard, async (req, res) => {
    try {
      const { employeeId, data, oraInizio, oraFine, postazione, note } = req.body;
      const isTemplate = req.query.isTemplate as string;
      
      if (!employeeId || !data || !oraInizio || !oraFine || !postazione) {
        return res.status(400).json({ error: 'Dati incompleti' });
      }

      if (isTemplate) {
        const dt = new Date(data);
        let gd = dt.getDay() - 1;
        if (gd === -1) gd = 6;
        
        await db.insert(schema.teamShiftTemplates).values({
          employeeId, settimanaTipo: isTemplate as any, giornoSettimana: gd, oraInizio, oraFine, postazione: postazione as any, note
        });
        return res.json({ success: true });
      }

      await db.insert(schema.teamScheduledShifts).values({
        employeeId, data: new Date(data), oraInizio, oraFine, postazione, note,
        createdByUserId: (req.user as any)?.id
      });

      // Notifica & Email
      try {
        await db.insert(schema.teamNotifications).values({
          employeeId, tipo: 'turno_aggiunto', titolo: 'Nuovo turno programmato',
          messaggio: `Data: ${data}, Ora: ${oraInizio}-${oraFine}, Postazione: ${postazione}`,
          dataRiferimento: new Date(data)
        });
        console.log(`Mock sending email via SMTP 465 to employee ${employeeId} for new shift`);
      } catch (e: any) {
        console.error('Silently ignored notification insert error:', e.message);
      }

      return res.json({ success: true });
    } catch(err: any) {
      console.error(err); 
      if (err.code === 'ER_DUP_ENTRY' || err.cause?.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Errore: duplicazione nello stesso spazio (turno già presente in questo orario).' });
      }
      return res.status(500).json({ error: 'Errore salvataggio turno' });
    }
  });
  app.post("/api/gemteam/turni/scheduled/mass-action-granular", isAuthenticated, isMasterGuard, async (req, res) => {
    try {
      const { action, employeeTarget, dateTarget, cells, timeOffsetMins } = req.body;
      if (!action || !cells || !cells.length) return res.status(400).json({ error: 'Dati mancanti' });

      const addOffset = (t: string, offsetMins: number) => {
         if (!offsetMins) return t;
         const [h, m] = t.split(':').map(Number);
         let totalMins = h * 60 + m + offsetMins;
         let nh = Math.floor(totalMins / 60);
         let nm = totalMins % 60;
         return `${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}`;
      };

      // cells = [{ shiftId, hour }] come "10:30"
      // Raggruppiamo le celle per shiftId
      const groupedByShift: Record<number, string[]> = {};
      for (const c of cells) {
         if (!groupedByShift[c.shiftId]) groupedByShift[c.shiftId] = [];
         groupedByShift[c.shiftId].push(c.hour);
      }

      // Funzione helper per raggruppare ore in blocchi continui da 30 min
      const groupToBlocks = (slots: string[]): {start: string, end: string}[] => {
         if (!slots.length) return [];
         const sorted = [...slots].sort();
         const blocks = [];
         let bStart = sorted[0];
         
         const add30 = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            let nm = m + 30; let nh = h;
            if (nm >= 60) { nm -= 60; nh += 1; }
            return `${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}`;
         };

         let currentEnd = add30(bStart);
         for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] === currentEnd) {
               currentEnd = add30(sorted[i]);
            } else {
               blocks.push({ start: bStart, end: currentEnd });
               bStart = sorted[i];
               currentEnd = add30(sorted[i]);
            }
         }
         blocks.push({ start: bStart, end: currentEnd });
         return blocks;
      };

      // Helper estrazione slots
      const getSlots = (start: string, end: string) => {
         const slots = [];
         let curr = start.substring(0, 5);
         const endFmt = end.substring(0, 5);
         
         const add30 = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            let nm = m + 30; let nh = h;
            if (nm >= 60) { nm -= 60; nh += 1; }
            return `${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}`;
         };
         while (curr < endFmt) {
           slots.push(curr);
           curr = add30(curr);
         }
         return slots;
      };

      for (const shiftIdStr in groupedByShift) {
         const shiftId = parseInt(shiftIdStr);
         const selectedSlots = groupedByShift[shiftId];
         
         const tbl = req.query.isTemplate ? schema.teamShiftTemplates : schema.teamScheduledShifts;
         const results = await db.select().from(tbl).where(eq(tbl.id, shiftId));
         if (!results.length) continue;
         const originalShift = results[0];

         // Crea i blocchi DI DESTINAZIONE (se non è una delete)
         if (action !== 'delete') {
            const targetSlots = timeOffsetMins ? selectedSlots.map(s => addOffset(s, timeOffsetMins)) : selectedSlots;
            const targetBlocks = groupToBlocks(targetSlots);
            for (const b of targetBlocks) {
               if (req.query.isTemplate) {
                 const dt = new Date(dateTarget || new Date()); // though dateTarget should not be used much in template mode mass-action unless moving across days
                 let gd = dateTarget ? (new Date(dateTarget).getDay() - 1) : (originalShift as any).giornoSettimana;
                 if (gd === -1) gd = 6;
                 await db.insert(schema.teamShiftTemplates).values({
                    employeeId: employeeTarget || originalShift.employeeId,
                    settimanaTipo: req.query.isTemplate as any,
                    giornoSettimana: gd,
                    oraInizio: b.start,
                    oraFine: b.end,
                    postazione: originalShift.postazione as any,
                    note: originalShift.note
                 });
               } else {
                 await db.insert(schema.teamScheduledShifts).values({
                    employeeId: employeeTarget || originalShift.employeeId,
                    data: dateTarget ? new Date(dateTarget) : new Date((originalShift as any).data),
                    oraInizio: b.start,
                    oraFine: b.end,
                    postazione: originalShift.postazione,
                    note: originalShift.note,
                    createdByUserId: (req.user as any)?.id
                 });
               }
            }
         }

         // Se è 'move' o 'delete', dobbiamo tagliare il turno originale
         if (action === 'move' || action === 'delete') {
            const originalSlots = getSlots(originalShift.oraInizio, originalShift.oraFine);
            const remainingSlots = originalSlots.filter(s => !selectedSlots.includes(s));
            
            await db.delete(req.query.isTemplate ? schema.teamShiftTemplates : schema.teamScheduledShifts).where(eq((req.query.isTemplate ? schema.teamShiftTemplates : schema.teamScheduledShifts).id, shiftId));

            if (remainingSlots.length > 0) {
               const remainingBlocks = groupToBlocks(remainingSlots);
               for (const b of remainingBlocks) {
                  if (req.query.isTemplate) {
                     await db.insert(schema.teamShiftTemplates).values({
                        employeeId: originalShift.employeeId,
                        settimanaTipo: req.query.isTemplate as any,
                        giornoSettimana: (originalShift as any).giornoSettimana,
                        oraInizio: b.start,
                        oraFine: b.end,
                        postazione: originalShift.postazione as any,
                        note: originalShift.note
                     });
                  } else {
                     await db.insert(schema.teamScheduledShifts).values({
                        employeeId: originalShift.employeeId,
                        data: new Date((originalShift as any).data),
                        oraInizio: b.start,
                        oraFine: b.end,
                        postazione: originalShift.postazione,
                        note: originalShift.note,
                        createdByUserId: (req.user as any)?.id
                     });
                  }
               }
            }
         }
      }

      return res.json({ success: true });
    } catch(err) {
      console.error(err); return res.status(500).json({ error: 'Errore interno (forse duplicato)' });
    }
  });

  app.patch("/api/gemteam/turni/scheduled/:id", isAuthenticated, isMasterGuard, async (req, res) => {
    try {
      const recordId = parseInt(req.params.id);
      const { postazione, oraInizio, oraFine, note, employeeId, data } = req.body;

      const results = await db.select().from(schema.teamScheduledShifts).where(eq(schema.teamScheduledShifts.id, recordId));
      if (!results.length) return res.status(404).json({ error: 'Non trovato' });

      const isTemplate = req.query.isTemplate as string;

      if (isTemplate) {
        await db.update(schema.teamShiftTemplates)
          .set({ 
            postazione: postazione as any, oraInizio, oraFine, note, 
            ...(employeeId ? {employeeId} : {})
          })
          .where(eq(schema.teamShiftTemplates.id, recordId));
        return res.json({ success: true });
      }

      await db.update(schema.teamScheduledShifts)
        .set({ 
          postazione, oraInizio, oraFine, note, 
          ...(employeeId ? {employeeId} : {}), 
          ...(data ? {data: new Date(data)} : {}), 
          modifiedByUserId: (req.user as any)?.id, updatedAt: new Date() 
        })
        .where(eq(schema.teamScheduledShifts.id, recordId));

      try {
        await db.insert(schema.teamNotifications).values({
          employeeId: results[0].employeeId, tipo: 'turno_modificato', titolo: 'Turno modificato',
          messaggio: `Il tuo turno del ${results[0].data} è stato modificato.`,
          dataRiferimento: new Date(results[0].data)
        });
        console.log(`Mock sending email via SMTP 465 to EX ${results[0].employeeId} updated shift`);
      } catch (e: any) {
        console.error('Silently ignored notification insert error:', e.message);
      }

      return res.json({ success: true });
    } catch(err) {
      console.error(err); return res.status(500).json({ error: 'Errore' });
    }
  });

  app.delete("/api/gemteam/turni/scheduled/:id", isAuthenticated, isMasterGuard, async (req, res) => {
    try {
      const recordId = parseInt(req.params.id);
      const isTemplate = req.query.isTemplate as string;

      if (isTemplate) {
        const results = await db.select().from(schema.teamShiftTemplates).where(eq(schema.teamShiftTemplates.id, recordId));
        if (!results.length) return res.json({ ok: true });
        await db.delete(schema.teamShiftTemplates).where(eq(schema.teamShiftTemplates.id, recordId));
        return res.json({ ok: true });
      }

      const results = await db.select().from(schema.teamScheduledShifts).where(eq(schema.teamScheduledShifts.id, recordId));
      if (!results.length) return res.json({ ok: true }); // already gone

      await db.delete(schema.teamScheduledShifts).where(eq(schema.teamScheduledShifts.id, recordId));

      try {
        await db.insert(schema.teamNotifications).values({
          employeeId: results[0].employeeId, tipo: 'turno_cancellato', titolo: 'Turno cancellato',
          messaggio: `Il turno del ${results[0].data} è stato cancellato.`,
          dataRiferimento: new Date((results[0] as any).data)
        });
      } catch (e: any) {
        console.error('Silently ignored notification insert error:', e.message);
      }

      return res.json({ ok: true });
    } catch(err) {
      console.error(err); return res.status(500).json({ error: 'Errore' });
    }
  });

  app.post("/api/gemteam/turni/apply-template", isAuthenticated, isMasterGuard, async (req, res) => {
    try {
      const { weekStart, settimana } = req.body;
      const startD = new Date(weekStart);
      const endD = new Date(weekStart);
      endD.setDate(endD.getDate() + 6); // Domenica della stessa settimana

      // WIPE della settimana corrente su teamScheduledShifts
      await db.delete(schema.teamScheduledShifts)
        .where(
          and(
            sql`DATE(${schema.teamScheduledShifts.data}) >= DATE(${startD})`,
            sql`DATE(${schema.teamScheduledShifts.data}) <= DATE(${endD})`
          )
        );

      const templates = await db.select().from(schema.teamShiftTemplates).where(eq(schema.teamShiftTemplates.settimanaTipo, settimana));
      let created = 0, skipped = 0;

      for (const t of templates) {
        const slotDate = new Date(startD);
        slotDate.setDate(slotDate.getDate() + t.giornoSettimana);

        try {
          await db.insert(schema.teamScheduledShifts).values({
             employeeId: t.employeeId,
             data: slotDate,
             oraInizio: t.oraInizio,
             oraFine: t.oraFine,
             postazione: t.postazione,
             createdByUserId: (req.user as any)?.id
          });
          created++;
        } catch(e) {
          skipped++; // Ignora i duplicati
        }
      }

      return res.json({ created, skipped });
    } catch(err) {
      console.error(err); return res.status(500).json({ error: 'Errore' });
    }
  });

  app.post("/api/gemteam/turni/copy-day", isAuthenticated, isMasterGuard, async (req, res) => {
    try {
      const { fromData, toData, employeeIds } = req.body;
      if (!fromData || !toData) return res.status(400).json({ error: 'date mancanti' });

      const fromD = fromData;
      const toD = toData;

      let conditions = [sql`DATE(${schema.teamScheduledShifts.data}) = ${fromD}`];
      if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
        conditions.push(inArray(schema.teamScheduledShifts.employeeId, employeeIds));
      }

      const sourceShifts = await db.select()
        .from(schema.teamScheduledShifts)
        .where(and(...conditions));
      let created = 0, skipped = 0;

      for (const s of sourceShifts) {
        try {
          await db.insert(schema.teamScheduledShifts).values({
            employeeId: s.employeeId,
            data: new Date(toD),
            oraInizio: s.oraInizio,
            oraFine: s.oraFine,
            postazione: s.postazione,
            note: s.note,
            createdByUserId: (req.user as any)?.id
          });
          created++;
        } catch(e) {
          skipped++;
        }
      }
      return res.json({ created, skipped });
    } catch(err) {
      console.error(err); return res.status(500).json({ error: 'Errore' });
    }
  });

  app.get("/api/gemteam/turni/ore-mensili", isAuthenticated, async (req, res) => {
    try {
      // Dummy response o implementazione reale query complessa.
      // Esempio logica semplificata
      const records = await db.execute(sql`
        SELECT E.id AS employeeId, M.first_name, M.last_name, 
               SUM(TIMESTAMPDIFF(MINUTE, S.ora_inizio, S.ora_fine)) / 60 as ore_totali
        FROM team_scheduled_shifts S
        JOIN team_employees E ON S.employee_id = E.id
        JOIN members M ON E.member_id = M.id
        JOIN team_postazioni P ON S.postazione = P.nome
        WHERE YEAR(S.data) = ${req.query.anno} AND MONTH(S.data) = ${req.query.mese} 
          AND P.conta_ore = 1
        GROUP BY E.id, M.first_name, M.last_name
      `);
      return res.json(records[0] || []);
    } catch(err) {
      console.error(err); return res.status(500).json({ error: 'Errore' });
    }
  });

  app.get("/api/gemteam/notifiche", isAuthenticated, async (req, res) => {
    try {
      // Find logged employeeId... (assuming matching logic already handled by roles auth)
      // Since 'isSystemEmployee' handles the rest, we output generic for now
      return res.json([]);
    } catch(err) {
      return res.status(500).json({ error: 'Errore' });
    }
  });

  app.patch("/api/gemteam/notifiche/:id/letta", isAuthenticated, async (req, res) => {
    try {
      await db.update(schema.teamNotifications)
        .set({ letta: true })
        .where(eq(schema.teamNotifications.id, parseInt(req.params.id)));
      return res.json({ success: true });
    } catch(err) {
      return res.status(500).json({ error: 'Errore' });
    }
  });

  app.get("/api/gemteam/postazioni", isAuthenticated, async (req, res) => {
    try {
      const records = await db.select().from(schema.teamPostazioni).orderBy(sql`ordine ASC`);
      return res.json(records);
    } catch(err) {
      return res.status(500).json({ error: 'Errore' });
    }
  });

  app.post("/api/gemteam/postazioni", isAuthenticated, isMasterGuard, async (req, res) => {
    try {
      const { nome, contaOre, attiva, colore } = req.body;
      if (!nome) return res.status(400).json({ error: 'Nome obbligatorio' });
      await db.insert(schema.teamPostazioni).values({
        nome,
        contaOre: contaOre ?? true,
        attiva: attiva ?? true,
        colore: colore || 'var(--indigo-50)',
        ordine: 99
      });
      return res.json({ success: true });
    } catch(err) {
      return res.status(500).json({ error: 'Errore' });
    }
  });

  app.patch("/api/gemteam/postazioni/:id", isAuthenticated, isMasterGuard, async (req, res) => {
    // Implement post update
    return res.json({ success: true });
  });

  app.delete("/api/gemteam/postazioni/:id", isAuthenticated, isMasterGuard, async (req, res) => {
    // Implement delete
    return res.json({ success: true });
  });

  app.get("/api/gemteam/turni/eventi-giorno", isAuthenticated, async (req, res) => {
    try {
      const { data } = req.query;
      if (!data) return res.status(400).json({ error: 'data mancante' });
      const dateStr = data as string;

      const events = await db.select({
        title: schema.strategicEvents.title,
        eventType: schema.strategicEvents.eventType,
        color: schema.strategicEvents.color,
        startDate: schema.strategicEvents.startDate,
        endDate: schema.strategicEvents.endDate
      })
      .from(schema.strategicEvents)
      .where(and(
        sql`DATE(${schema.strategicEvents.startDate}) <= ${dateStr}`,
        or(sql`DATE(${schema.strategicEvents.endDate}) >= ${dateStr}`, isNull(schema.strategicEvents.endDate)),
        eq(schema.strategicEvents.affectsCalendar, true),
        eq(schema.strategicEvents.status, 'active')
      ));
      
      return res.json(events);
    } catch(err) {
      console.error(err); return res.status(500).json({ error: 'Errore' });
    }
  });



  return httpServer;
}
export async function runStaleSegmentsCron() {
  const { db } = await import("./db");
  const { userSessionSegments } = await import("../shared/schema");
  const { eq, and, isNull, lt } = await import("drizzle-orm");

  const now = Date.now();
  const tenMinutesAgo = new Date(now - 10 * 60 * 1000);
  const twoMinutesAgo = new Date(now - 2 * 60 * 1000);

  const staleOnline = await db.select().from(userSessionSegments).where(and(eq(userSessionSegments.tipo, 'online'), isNull(userSessionSegments.endedAt), lt(userSessionSegments.startedAt, twoMinutesAgo)));
  for (const seg of staleOnline) {
    const diffMs = twoMinutesAgo.getTime() - new Date(seg.startedAt).getTime();
    const durataReale = diffMs > 30000 ? Math.max(1, Math.round(diffMs / 60000)) : 0;
    const durataMinuti = Math.min(durataReale, 30);
    await db.update(userSessionSegments).set({ endedAt: twoMinutesAgo, durataMinuti }).where(eq(userSessionSegments.id, seg.id));
    await db.insert(userSessionSegments).values({ userId: seg.userId, tipo: 'pausa', startedAt: twoMinutesAgo });
  }

  const stalePausa = await db.select().from(userSessionSegments).where(and(eq(userSessionSegments.tipo, 'pausa'), isNull(userSessionSegments.endedAt), lt(userSessionSegments.startedAt, tenMinutesAgo)));
  for (const seg of stalePausa) {
    const diffMs = tenMinutesAgo.getTime() - new Date(seg.startedAt).getTime();
    const durataMinuti = diffMs > 30000 ? Math.max(1, Math.round(diffMs / 60000)) : 0;
    await db.update(userSessionSegments).set({ endedAt: tenMinutesAgo, durataMinuti }).where(eq(userSessionSegments.id, seg.id));
  }
}
