import { getEventColorClass } from "./activity-colors";
import type { Course, Workshop, Category, Instructor, BookingService } from "@shared/schema";

/**
 * Utility: Safe ISO string conversion for UI components.
 */
export function safeIsoString(dateVal: any): string | undefined {
    if (!dateVal) return undefined;
    try {
        const d = new Date(dateVal);
        return isNaN(d.getTime()) ? undefined : d.toISOString();
    } catch {
        return undefined;
    }
}

/**
 * Utility: Strip seconds from time strings (HH:mm:ss -> HH:mm)
 */
export function stripSeconds(timeStr?: string | null): string {
    if (!timeStr || typeof timeStr !== 'string') return "";
    return timeStr.substring(0, 5);
}

/**
 * Get weekday ID (e.g., "LUN", "MAR") from a Date object
 */
export function getDayId(date: Date): string {
    const WEEKDAYS = [
        { id: "LUN", label: "Lunedì" },
        { id: "MAR", label: "Martedì" },
        { id: "MER", label: "Mercoledì" },
        { id: "GIO", label: "Giovedì" },
        { id: "VEN", label: "Venerdì" },
        { id: "SAB", label: "Sabato" },
        { id: "DOM", label: "Domenica" }
    ];
    const dayIdx = date.getDay(); // 0 is Sunday
    const normalizedIdx = dayIdx === 0 ? 6 : dayIdx - 1;
    return WEEKDAYS[normalizedIdx].id;
}


// --- PLANNING TRANSFORMERS ---

export interface DefaultPlanningEvent {
    id: string;
    type: string;
    title: string;
    startDate: Date;
    endDate?: Date;
    dayOfWeek?: number;
    colorClass: string;
}

export function mapActivityToPlanningEvent(
    activity: any, // record
    prefix: string,
    fallbackTitle: string,
    registryKey: string
): DefaultPlanningEvent | null {
    if (activity.active === false || !activity.startDate) return null;
    return {
        id: `${prefix}_${activity.id}`,
        type: registryKey,
        title: activity.name || fallbackTitle,
        startDate: new Date(activity.startDate),
        endDate: activity.endDate ? new Date(activity.endDate) : undefined,
        colorClass: getEventColorClass(registryKey)
    };
}

// Special case for Booking Services in Planning which use serviceDate
export function mapBookingServiceToPlanningEvent(e: any): DefaultPlanningEvent | null {
    if (e.active === false || !e.serviceDate) return null;
    return {
        id: `ext_${e.id}`,
        type: 'external', // Legacy type string for planning
        title: e.name || "Evento Esterno",
        startDate: new Date(e.serviceDate),
        colorClass: getEventColorClass("servizi")
    };
}


// --- CALENDAR TRANSFORMERS ---

export function mapCourseToCalendarEvent(
    c: Course, 
    categories: Category[] = [], 
    instructors: Instructor[] = [],
    activitiesConf: any[] = [],
    colorPropsValue: any
) {
    const registryConf = activitiesConf.find(a => a.id === 'courses');
    const cat = categories?.find(cat => cat.id === c.categoryId);
    const insObj = instructors?.find(i => i.id === c.instructorId);

    return {
        id: `course_${c.id}`,
        sourceType: "course",
        sourceId: c.id,
        title: c.name || cat?.name || "CORSO",
        description: c.description || undefined,
        startTime: c.startTime || "",
        endTime: c.endTime || "",
        dayOfWeek: c.dayOfWeek || "",
        startDate: safeIsoString(c.startDate),
        endDate: safeIsoString(c.endDate),
        instructorId: c.instructorId,
        instructorName: insObj ? `${insObj.lastName} ${insObj.firstName}` : undefined,
        studioId: c.studioId,
        categoryId: c.categoryId,
        categoryName: cat?.name,
        registryKey: "courses",
        registryLabel: registryConf?.labelUI || "Corso",
        active: c.active !== false,
        colorProps: colorPropsValue,
        rawPayload: c
    };
}

export function mapWorkshopToCalendarEvent(
    w: Workshop, 
    categories: Category[] = [], 
    instructors: Instructor[] = [],
    activitiesConf: any[] = [],
    colorPropsValue: any
) {
    const registryConf = activitiesConf.find(a => a.id === 'workshops');
    const cat = categories?.find(cat => cat.id === w.categoryId);
    const insObj = instructors?.find(i => i.id === w.instructorId);

    return {
        id: `workshop_${w.id}`,
        sourceType: "workshop",
        sourceId: w.id,
        title: w.name || cat?.name || "WORKSHOP",
        description: w.description || undefined,
        startTime: w.startTime || "",
        endTime: w.endTime || "",
        dayOfWeek: w.dayOfWeek || "",
        startDate: safeIsoString(w.startDate),
        endDate: safeIsoString(w.endDate),
        instructorId: w.instructorId,
        instructorName: insObj ? `${insObj.lastName} ${insObj.firstName}` : undefined,
        studioId: w.studioId,
        categoryId: w.categoryId,
        categoryName: cat?.name,
        registryKey: "workshops",
        registryLabel: registryConf?.labelUI || "Workshop",
        active: w.active !== false,
        colorProps: colorPropsValue,
        rawPayload: w
    };
}

export function mapStudioBookingToCalendarEvent(
    b: any, 
    activitiesConf: any[] = [],
    colorPropsValue: any
) {
    const bDate = new Date(b.bookingDate);
    const dayId = getDayId(bDate);
    const registryConf = activitiesConf.find(a => a.id === 'studioBookings');

    return {
        id: `booking_${b.id}`,
        sourceType: "studioBookings",
        sourceId: b.id,
        title: b.title || b.notes || "Affitto/Servizio",
        description: b.notes || undefined,
        startTime: stripSeconds(b.startTime) || "",
        endTime: stripSeconds(b.endTime) || "",
        dayOfWeek: dayId,
        startDate: safeIsoString(b.bookingDate),
        endDate: safeIsoString(b.bookingDate),
        instructorId: null,
        instructorName: "",
        studioId: b.studioId,
        categoryId: null,
        categoryName: "AFFITTO",
        registryKey: "studioBookings",
        registryLabel: registryConf?.labelUI || "Affitti/Service",
        active: true,
        colorProps: colorPropsValue,
        rawPayload: b
    };
}
