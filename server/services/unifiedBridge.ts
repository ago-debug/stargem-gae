import { db } from "../db";
import { type Request } from "express";
import { storage } from "../storage";

function toLocalISOString(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

import { eq } from "drizzle-orm";
import {
  courses,
  studioBookings,
  enrollments,
  users,
  members,
  studios,
  customListItems,
  type UnifiedCalendarEventDTO
} from "@shared/schema";

const ACTIVITY_TYPE_COLORS: Record<string, string> = {
  allenamenti:  "#1e40af",
  prenotazioni: "#7c3aed",
  workshop:     "#c2410c",
  domeniche:    "#a16207",
  saggi:        "#be185d",
  vacanze:      "#15803d",
  campus:       "#0369a1",
  affitti:      "#374151",
};

const COLORS = [
    "bg-red-100 border-l-red-500 text-red-700",
    "bg-blue-100 border-l-blue-500 text-blue-700",
    "bg-green-100 border-l-green-500 text-green-700",
    "bg-purple-100 border-l-purple-500 text-purple-700",
    "bg-yellow-100 border-l-yellow-500 text-yellow-700",
    "bg-pink-100 border-l-pink-500 text-pink-700",
    "bg-indigo-100 border-l-indigo-500 text-indigo-700",
    "bg-teal-100 border-l-teal-500 text-teal-700"
];

// Helper per generare colorProps come da FrontEnd
function buildColorProps(hexColor?: string | null, categoryId?: number | null, fallbackFamily?: string) {
    if (fallbackFamily === 'rental') {
        return { backgroundColor: "#64748b20", borderLeftColor: "#64748b", color: "#64748b" };
    }
    if (hexColor) {
        return {
            backgroundColor: `${hexColor}25`,
            borderLeftColor: hexColor,
            color: hexColor
        };
    }
    const id = categoryId || 0;
    return { className: COLORS[id % COLORS.length] };
}

// Helper per risolvere i Nomi Istruttori (da members / users)
function resolveInstructor(instructorId: number | null, dbMembers: any[]) {
    if (!instructorId) return { ids: [], names: [] };
    const member = dbMembers.find(m => m.id === instructorId);
    if (!member) return { ids: [instructorId], names: ["Insegnante Ignoto"] };
    if (member.isDummy) return { ids: [], names: [] };
    return { 
        ids: [instructorId], 
        names: [`${member.firstName || ''} ${member.lastName || ''}`.trim()] 
    };
}

// Helper per risolvere Categorie
function resolveCategory(categoryId: number | null, dbCats: any[], prefixTag: string) {
    if (!categoryId) return { id: null, name: "Senza Categoria", tag: prefixTag, color: null };
    const cat = dbCats.find(c => c.id === categoryId);
    return {
        id: categoryId,
        name: cat?.name || cat?.value || "Non Assegnata",
        tag: prefixTag,
        color: cat?.color || null
    };
}

// Helper per risolvere le Sale
function resolveStudio(studioId: number | null, dbStudios: any[]) {
    if (!studioId) return { id: null, name: "Nessuna Sala" };
    const st = dbStudios.find(s => s.id === studioId);
    return { id: studioId, name: st?.name || "Sala Ignota" };
}

/**
 * Helper per fare un parse sicuro dei JSON driver-stringified di Drizzle MySQL.
 */
function parseTags(tags: any): string[] {
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
        try {
            const parsed = JSON.parse(tags);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            return [];
        }
    }
    return [];
}

/**
 * 021_AG_STI_BRIDGE_API_READ_MODE
 * Layer Bridge per la Single Table Inheritance (STI).
 * CURRENT STATUS: READ ONLY RAM AGGREGATION.
 */

/**
 * 023_AG_STI_RECURRENCE_EXPANSION_ENGINE
 * Espande i corsi ricorrenti restituendone istanze esplose per il calendario
 * in una finestra temporale (mese corrente -> +60gg).
 */
function expandCourseRecurrence(
  course: any, 
  defaultSeasonId: number | null,
  ctx: { dbMembers: any[], dbCats: any[], dbStudios: any[] }
): UnifiedCalendarEventDTO[] {
  
  const { ids: insIds, names: insNames } = resolveInstructor(course.instructorId, ctx.dbMembers);
  const catInfo = resolveCategory(course.categoryId, ctx.dbCats, "CRS");
  const studioInfo = resolveStudio(course.studioId, ctx.dbStudios);
  const type = course.activityType || "course";
  const fixedColor = ACTIVITY_TYPE_COLORS[type];
  const colors = (fixedColor && type !== "course")
    ? buildColorProps(fixedColor, 0, type)
    : buildColorProps(catInfo.color, catInfo.id, "course");

  const buildBaseDTO = (evtStart: Date, evtEnd: Date, uniqueId: string): UnifiedCalendarEventDTO => ({
    id: uniqueId,
    activityFamily: "course",
    activityType: course.activityType || "standard",
    title: course.name,
    sku: course.sku || null,
    statusLabels: parseTags(course.statusTags).length > 0 ? parseTags(course.statusTags) : (course.active ? ["active"] : ["inactive"]),
    isActive: !!course.active,
    categoryId: catInfo.id,
    categoryName: catInfo.name,
    categoryTag: catInfo.tag,
    colorProps: colors,
    instructorIds: insIds,
    instructorNames: insNames,
    studioId: studioInfo.id,
    studioName: studioInfo.name,
    startDatetime: toLocalISOString(evtStart),
    endDatetime: toLocalISOString(evtEnd),
    uiRenderingType: "STANDARD_COURSE",
    rawPayload: { ...course, legacy_source_type: "courses" }
  });

  if (!course.dayOfWeek || !course.startTime) {
    return []; // corso non schedulato - non renderizzare
  }

  const DAY_MAP: Record<string, number> = {
    // Supported mapped dictionary
    LUN: 1, MAR: 2, MER: 3, GIO: 4, VEN: 5, SAB: 6, DOM: 0,
    LUNEDI: 1, MARTEDI: 2, MERCOLEDI: 3, GIOVEDI: 4, VENERDI: 5, SABATO: 6, DOMENICA: 0,
    LUNEDÌ: 1, MARTEDÌ: 2, MERCOLEDÌ: 3, GIOVEDÌ: 4,
    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '0': 0
  };

  const targetDayStr = String(course.dayOfWeek).toUpperCase().trim();
  const targetDay = DAY_MAP[targetDayStr];

  if (targetDay === undefined) {
    return []; // giorno della settimana non riconosciuto - non renderizzare
  }

  const expanded: UnifiedCalendarEventDTO[] = [];
  const now = new Date();
  
  // Utilizziamo le date reali del corso; se mancano, forniamo un fallback
  let windowStart = course.startDate ? new Date(course.startDate) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
  let windowEnd = course.endDate ? new Date(course.endDate) : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 60);

  // Paracadute di sicurezza: se la finestra è più ampia di 18 mesi (previene infinite loops per refusi di date)
  if (windowEnd.getTime() - windowStart.getTime() > 1.5 * 365 * 24 * 3600 * 1000) {
      windowEnd = new Date(windowStart.getTime() + 1.5 * 365 * 24 * 3600 * 1000);
  }

  const [startH, startM] = (course.startTime || "00:00").split(":").map(Number);
  let endH = startH + 1, endM = startM;
  if (course.endTime) {
     const parts = course.endTime.split(":").map(Number);
     endH = parts[0] || startH + 1;
     endM = parts[1] || startM;
  }

  windowStart.setHours(0, 0, 0, 0);
  windowEnd.setHours(23, 59, 59, 999);

  const currentIter = new Date(windowStart);

  while (currentIter <= windowEnd) {
    currentIter.setHours(12, 0, 0, 0);
    if (currentIter.getDay() === targetDay) {
      const evtStart = new Date(currentIter);
      evtStart.setHours(startH || 0, startM || 0, 0, 0);

      const evtEnd = new Date(currentIter);
      evtEnd.setHours(endH, endM, 0, 0);

      const y = evtStart.getFullYear();
      const m = String(evtStart.getMonth() + 1).padStart(2, '0');
      const d = String(evtStart.getDate()).padStart(2, '0');
      const dateString = `${y}-${m}-${d}`;

      expanded.push(buildBaseDTO(evtStart, evtEnd, `course_${course.id}_${dateString}`));
    }
    currentIter.setDate(currentIter.getDate() + 1);
  }

  return expanded;
}

export async function getUnifiedActivitiesPreview(req: Request) {
  const activeSeason = await storage.getActiveSeason();
  const defaultSeasonId = activeSeason?.id || null;
  
  let querySeasonId: number | null = defaultSeasonId;
  if (req.query.seasonId === 'all') {
    querySeasonId = null;
  } else if (req.query.seasonId) {
    const parsed = parseInt(req.query.seasonId as string);
    if (!isNaN(parsed)) querySeasonId = parsed;
  }

  // Mass RAM DB Extractions
  const [
    dbCourses,
    dbRentals,
    dbMembers,
    dbStudios,
    dbCustomCats
  ] = await Promise.all([
    db.select().from(courses),
    db.select().from(studioBookings),
    db.select().from(members),
    db.select().from(studios),
    db.select().from(customListItems).where(eq(customListItems.listId, 23))
  ]);

  const unified: UnifiedCalendarEventDTO[] = [];

  // Mappa Corsi (con modulo di Expansion Recurrence)
  for (const c of dbCourses) {
    const effSeasonId = c.seasonId || defaultSeasonId;
    if (querySeasonId !== null && effSeasonId !== querySeasonId) continue;
    unified.push(...expandCourseRecurrence(c, defaultSeasonId, { dbMembers, dbCats: dbCustomCats, dbStudios }));
  }
  // Dedup finale: rimuove eventi con id duplicato (stesso corso+data da stagioni diverse)
  const seen = new Set<string>();
  return unified.filter(e => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

export async function getUnifiedActivityById(req: Request) {
  const { type, id } = req.params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) return null;

  const activities = await getUnifiedActivitiesPreview(req);
  return activities.find(a => a.rawPayload?.legacy_source_type === type && a.rawPayload?.id === numericId) || null;
}

export async function getUnifiedEnrollmentsPreview(req: Request) {
  const activeSeason = await storage.getActiveSeason();
  const defaultSeasonId = activeSeason?.id || null;

  const [
    dbEnrollments,
  ] = await Promise.all([
    db.select().from(enrollments),
  ]);

  const unified = [];

  // Courses
  for (const e of dbEnrollments) {
    // Gestione transitoria `participationType` / `targetDate` preesistente o default
    const pType = (e as any).participationType || "STANDARD_COURSE";
    const tDate = (e as any).targetDate ? new Date((e as any).targetDate) : null;
    
    // Virtual IDs come "course_12" mappato su activity_unified_id
    unified.push({
      id: `enr_${e.id}`,
      member_id: e.memberId,
      activity_unified_id: `course_${e.courseId}`,
      participation_type: pType,
      target_date: tDate,
      payment_status: e.status, // Usa status come proxy per payment_status in read-only
      notes: e.notes,
      season_id: e.seasonId || defaultSeasonId
    });
  }

  return unified;
}
