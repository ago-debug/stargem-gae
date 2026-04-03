import { db } from "../db";
import { type Request } from "express";
import { storage } from "../storage";

function toLocalISOString(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

import {
  courses,
  workshops,
  studioBookings,
  campusActivities,
  sundayActivities,
  recitals,
  enrollments,
  workshopEnrollments,
  campusEnrollments,
  sundayActivityEnrollments,
  recitalEnrollments,
  categories,
  workshopCategories,
  sundayCategories,
  users,
  members,
  studios,
  type UnifiedCalendarEventDTO
} from "@shared/schema";

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
        name: cat?.name || "Non Assegnata",
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
  const colors = buildColorProps(catInfo.color, catInfo.id, "course");

  const buildBaseDTO = (evtStart: Date, evtEnd: Date, uniqueId: string): UnifiedCalendarEventDTO => ({
    id: uniqueId,
    activityFamily: "course",
    activityType: "standard",
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
    const fallbackStart = course.startDate ? new Date(course.startDate) : new Date();
    const fallbackEnd = course.endDate ? new Date(course.endDate) : new Date(fallbackStart.getTime() + 3600000);
    return [buildBaseDTO(fallbackStart, fallbackEnd, `course_${course.id}`)];
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
    const fallbackStart = course.startDate ? new Date(course.startDate) : new Date();
    const fallbackEnd = course.endDate ? new Date(course.endDate) : new Date(fallbackStart.getTime() + 3600000);
    return [buildBaseDTO(fallbackStart, fallbackEnd, `course_${course.id}`)];
  }

  const expanded: UnifiedCalendarEventDTO[] = [];
  const now = new Date();
  
  let windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
  let windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 60);

  if (course.startDate) {
    const courseStart = new Date(course.startDate);
    if (courseStart > windowStart) windowStart = courseStart;
  }
  if (course.endDate) {
    const courseEnd = new Date(course.endDate);
    if (courseEnd < windowEnd) windowEnd = courseEnd;
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
    dbWorkshops,
    dbRentals,
    dbCampus,
    dbSunday,
    dbRecitals,
    
    dbMembers,
    dbCats,
    dbWsCats,
    dbSunCats,
    dbStudios
  ] = await Promise.all([
    db.select().from(courses),
    db.select().from(workshops),
    db.select().from(studioBookings),
    db.select().from(campusActivities),
    db.select().from(sundayActivities),
    db.select().from(recitals),
    
    db.select().from(members),
    db.select().from(categories),
    db.select().from(workshopCategories),
    db.select().from(sundayCategories),
    db.select().from(studios)
  ]);

  const unified: UnifiedCalendarEventDTO[] = [];

  // Mappa Corsi (con modulo di Expansion Recurrence)
  for (const c of dbCourses) {
    const effSeasonId = c.seasonId || defaultSeasonId;
    if (querySeasonId !== null && effSeasonId !== querySeasonId) continue;
    unified.push(...expandCourseRecurrence(c, defaultSeasonId, { dbMembers, dbCats, dbStudios }));
  }

  // Mappa Workshop
  for (const w of dbWorkshops) {
    const effSeasonId = w.seasonId || defaultSeasonId;
    if (querySeasonId !== null && effSeasonId !== querySeasonId) continue;

    const { ids: insIds, names: insNames } = resolveInstructor(w.instructorId, dbMembers);
    const catInfo = resolveCategory(w.categoryId, dbWsCats, "WKS");
    const studioInfo = resolveStudio(w.studioId, dbStudios);
    const colors = buildColorProps(catInfo.color, catInfo.id, "workshop");
    
    const fallbackStart = w.startDate ? new Date(w.startDate) : new Date();
    const fallbackEnd = w.endDate ? new Date(w.endDate) : new Date(fallbackStart.getTime() + 3600000);

    unified.push({
      id: `workshop_${w.id}`,
      activityFamily: "workshop",
      activityType: "standard",
      title: w.name || "Workshop",
      sku: w.sku || null,
      statusLabels: parseTags(w.statusTags).length > 0 ? parseTags(w.statusTags) : (w.active ? ["active"] : ["inactive"]),
      isActive: !!w.active,
      categoryId: catInfo.id,
      categoryName: catInfo.name,
      categoryTag: catInfo.tag,
      colorProps: colors,
      instructorIds: insIds,
      instructorNames: insNames,
      studioId: studioInfo.id,
      studioName: studioInfo.name,
      startDatetime: toLocalISOString(fallbackStart),
      endDatetime: toLocalISOString(fallbackEnd),
      uiRenderingType: "STANDARD_WORKSHOP",
      rawPayload: { ...w, legacy_source_type: "workshops" }
    });
  }

  // Mappa Affitti (Rentals)
  for (const r of dbRentals) {
    const effSeasonId = r.seasonId || defaultSeasonId;
    if (querySeasonId !== null && effSeasonId !== querySeasonId) continue;

    const { ids: insIds, names: insNames } = resolveInstructor(r.instructorId, dbMembers);
    const studioInfo = resolveStudio(r.studioId, dbStudios);
    const colors = buildColorProps(null, null, "rental");
    
    const bDateStr = r.bookingDate instanceof Date ? toLocalISOString(r.bookingDate).split('T')[0] : (r.bookingDate as any)?.split?.('T')[0] || null;
    let fallStart = new Date();
    if (bDateStr && r.startTime) {
       const parsedStart = new Date(`${bDateStr}T${r.startTime}`);
       if (!isNaN(parsedStart.getTime())) fallStart = parsedStart;
    }
    
    let fallEnd = new Date(fallStart.getTime() + 3600000);
    if (bDateStr && r.endTime) {
       const parsedEnd = new Date(`${bDateStr}T${r.endTime}`);
       if (!isNaN(parsedEnd.getTime())) fallEnd = parsedEnd;
    }

    unified.push({
      id: `rental_${r.id}`,
      activityFamily: "rental",
      activityType: "standard",
      title: r.title || "Affitto Sala",
      sku: null,
      statusLabels: [(r.status || "active")],
      isActive: r.status !== 'cancelled',
      categoryId: null,
      categoryName: "Affitti e Booking",
      categoryTag: "RNT",
      colorProps: colors,
      instructorIds: insIds,
      instructorNames: insNames,
      studioId: studioInfo.id,
      studioName: studioInfo.name,
      startDatetime: toLocalISOString(fallStart),
      endDatetime: toLocalISOString(fallEnd),
      uiRenderingType: "RENTAL_SLOT",
      rawPayload: { ...r, legacy_source_type: "rentals" }
    });
  }

  // Mappa Campus
  for (const c of dbCampus) {
    const effSeasonId = (c as any).seasonId || defaultSeasonId;
    if (querySeasonId !== null && effSeasonId !== querySeasonId) continue;

    const { ids: insIds, names: insNames } = resolveInstructor(c.instructorId, dbMembers);
    const studioInfo = resolveStudio(c.studioId, dbStudios);
    const colors = buildColorProps(null, c.id, "campus");

    const fallbackStart = c.startDate ? new Date(c.startDate) : new Date();
    const fallbackEnd = c.endDate ? new Date(c.endDate) : new Date(fallbackStart.getTime() + 3600000);

    unified.push({
      id: `campus_${c.id}`,
      activityFamily: "campus",
      activityType: "standard",
      title: c.name || "Campus",
      sku: null,
      statusLabels: parseTags(c.statusTags).length > 0 ? parseTags(c.statusTags) : (c.active ? ["active"] : ["inactive"]),
      isActive: !!c.active,
      categoryId: null,
      categoryName: "Campus",
      categoryTag: "CMP",
      colorProps: colors,
      instructorIds: insIds,
      instructorNames: insNames,
      studioId: studioInfo.id,
      studioName: studioInfo.name,
      startDatetime: toLocalISOString(fallbackStart),
      endDatetime: toLocalISOString(fallbackEnd),
      uiRenderingType: "CAMPUS_EVENT",
      rawPayload: { ...c, legacy_source_type: "campus" }
    });
  }

  // Mappa Domeniche (Sunday)
  for (const s of dbSunday) {
    const effSeasonId = (s as any).seasonId || defaultSeasonId;
    if (querySeasonId !== null && effSeasonId !== querySeasonId) continue;

    const { ids: insIds, names: insNames } = resolveInstructor(s.instructorId, dbMembers);
    const catInfo = resolveCategory((s as any).categoryId, dbSunCats, "SUN");
    const studioInfo = resolveStudio(s.studioId, dbStudios);
    const colors = buildColorProps(catInfo.color, catInfo.id, "sunday");

    const fallbackStart = s.startDate ? new Date(s.startDate) : new Date();
    const fallbackEnd = s.endDate ? new Date(s.endDate) : new Date(fallbackStart.getTime() + 3600000);

    unified.push({
      id: `sunday_activities_${s.id}`,
      activityFamily: "sunday",
      activityType: "sunday",
      title: s.name || "Evento Domenicale",
      sku: null,
      statusLabels: parseTags((s as any).statusTags).length > 0 ? parseTags((s as any).statusTags) : (s.active ? ["active"] : ["inactive"]),
      isActive: !!s.active,
      categoryId: catInfo.id,
      categoryName: catInfo.name,
      categoryTag: catInfo.tag,
      colorProps: colors,
      instructorIds: insIds,
      instructorNames: insNames,
      studioId: studioInfo.id,
      studioName: studioInfo.name,
      startDatetime: toLocalISOString(fallbackStart),
      endDatetime: toLocalISOString(fallbackEnd),
      uiRenderingType: "SUNDAY_EVENT",
      rawPayload: { ...s, legacy_source_type: "sunday_activities" }
    });
  }

  // Mappa Saggi (Recitals)
  for (const r of dbRecitals) {
    const effSeasonId = (r as any).seasonId || defaultSeasonId;
    if (querySeasonId !== null && effSeasonId !== querySeasonId) continue;

    const { ids: insIds, names: insNames } = resolveInstructor(r.instructorId, dbMembers);
    const studioInfo = resolveStudio(r.studioId, dbStudios);
    const colors = buildColorProps(null, r.id, "recital");
    
    const fallbackStart = r.startDate ? new Date(r.startDate) : new Date();
    const fallbackEnd = r.endDate ? new Date(r.endDate) : new Date(fallbackStart.getTime() + 3600000);

    unified.push({
      id: `recital_${r.id}`,
      activityFamily: "recital",
      activityType: "recital",
      title: r.name || "Saggio",
      sku: null,
      statusLabels: parseTags((r as any).statusTags).length > 0 ? parseTags((r as any).statusTags) : (r.active ? ["active"] : ["inactive"]),
      isActive: !!r.active,
      categoryId: null,
      categoryName: "Saggi / Esibizioni",
      categoryTag: "REC",
      colorProps: colors,
      instructorIds: insIds,
      instructorNames: insNames,
      studioId: studioInfo.id,
      studioName: studioInfo.name,
      startDatetime: toLocalISOString(fallbackStart),
      endDatetime: toLocalISOString(fallbackEnd),
      uiRenderingType: "RECITAL_EVENT",
      rawPayload: { ...r, legacy_source_type: "recitals" }
    });
  }

  return unified;
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
    dbWsEnrollments,
    dbCaEnrollments,
    dbSaEnrollments,
    dbRecEnrollments
  ] = await Promise.all([
    db.select().from(enrollments),
    db.select().from(workshopEnrollments),
    db.select().from(campusEnrollments),
    db.select().from(sundayActivityEnrollments),
    db.select().from(recitalEnrollments)
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

  // Workshops
  for (const e of dbWsEnrollments) {
    unified.push({
      id: `wse_${e.id}`,
      member_id: e.memberId,
      activity_unified_id: `workshop_${e.workshopId}`,
      participation_type: "STANDARD_COURSE",
      target_date: null,
      payment_status: e.status,
      notes: e.notes,
      season_id: e.seasonId || defaultSeasonId
    });
  }

  // Campus
  for (const e of dbCaEnrollments) {
    unified.push({
      id: `cae_${e.id}`,
      member_id: e.memberId,
      activity_unified_id: `campus_${e.campusActivityId}`,
      participation_type: "STANDARD_COURSE",
      target_date: null,
      payment_status: e.status,
      notes: e.notes,
      season_id: e.seasonId || defaultSeasonId
    });
  }

  // Sunday
  for (const e of dbSaEnrollments) {
    unified.push({
      id: `sae_${e.id}`,
      member_id: e.memberId,
      activity_unified_id: `sunday_activities_${e.sundayActivityId}`,
      participation_type: "STANDARD_COURSE",
      target_date: null,
      payment_status: e.status,
      notes: e.notes,
      season_id: e.seasonId || defaultSeasonId
    });
  }

  // Recitals
  for (const e of dbRecEnrollments) {
    unified.push({
      id: `rece_${e.id}`,
      member_id: e.memberId,
      activity_unified_id: `recital_${e.recitalId}`,
      participation_type: "STANDARD_COURSE",
      target_date: null,
      payment_status: e.status,
      notes: e.notes,
      season_id: e.seasonId || defaultSeasonId
    });
  }

  return unified;
}
