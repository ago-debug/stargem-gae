import { useState, useMemo, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CourseUnifiedModal } from "@/components/CourseUnifiedModal";
import { CourseDuplicationWizard } from "@/components/CourseDuplicationWizard";
import { ActivityColorLegend } from "@/components/ActivityColorLegend";
import { useCustomListValues } from "@/hooks/use-custom-list";
import { Combobox } from "@/components/ui/combobox";
import { getStatusColor } from "@/components/multi-select-status";
import type { ActivityStatus } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { mapCourseToCalendarEvent, mapWorkshopToCalendarEvent, mapStudioBookingToCalendarEvent } from "@/lib/event-mappers";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Filter,
    Users,
    User,
    MapPin,
    Clock,
    RefreshCw,
    X,
    Plus,
    UserPlus,
    CalendarPlus,
    BarChart3,
    ChevronsUpDown,
    Check,
    Search,
    Mail,
    Phone,
    Sparkles,
    Edit2,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfWeek, addDays, isSameDay, parse, startOfDay, addMinutes, isWithinInterval, isAfter, isBefore } from "date-fns";
import { it } from "date-fns/locale";
import type {
    Course, Instructor,
    Studio,
    Enrollment,
    Category,
    Member,
    Attendance,
    StudioBooking,
    BookingService,
    PaymentMethod,
    Workshop,
    Quote, // Import Quote
} from "@shared/schema";
import { ACTIVITY_REGISTRY, getActiveActivities } from "@/config/activities";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { validateFiscalCode, parseFiscalCode, getPlaceName } from "@/lib/fiscalCodeUtils";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { cn, parseStatusTags, getSeasonLabel } from "@/lib/utils";

const WEEKDAYS = [
    { id: "LUN", label: "Lunedì", short: "Lun" },
    { id: "MAR", label: "Martedì", short: "Mar" },
    { id: "MER", label: "Mercoledì", short: "Mer" },
    { id: "GIO", label: "Giovedì", short: "Gio" },
    { id: "VEN", label: "Venerdì", short: "Ven" },
    { id: "SAB", label: "Sabato", short: "Sab" },
    { id: "DOM", label: "Domenica", short: "Dom" },
];

const RECURRENCE_TYPES = [
    { id: "weekly", label: "Settimanale" },
    { id: "biweekly", label: "Bisettimanale" },
    { id: "monthly", label: "Mensile" },
    { id: "custom", label: "Personalizzato" },
];

// Dynamic HOURS resolution inside component

const TIME_SLOTS = Array.from({ length: 288 }, (_, i) => {
    const hour = Math.floor(i / 12);
    const minute = (i % 12) * 5;
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

import { CATEGORY_COLORS_PALETTE as COLORS, OLD_CATEGORY_COLORS as CATEGORY_COLORS } from "@/lib/activity-colors";

export interface CalendarEvent {
    id: string; // Hybrid ID (e.g. "course_1", "workshop_2", "booking_3")
    sourceType: "course" | "workshop" | "studioBookings" | string;
    sourceId: number;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    dayOfWeek: string; // "LUN", "MAR"...
    startDate?: string | null;
    endDate?: string | null;
    instructorId?: number | null;
    instructorName?: string;
    studioId?: number | null;
    categoryId?: number | null;
    categoryName?: string;
    registryKey?: string; // Corresponds to ACTIVITY_REGISTRY keys
    registryLabel?: string;
    active: boolean;
    colorProps: {
        className?: string;
        backgroundColor?: string;
        borderLeftColor?: string;
        color?: string;
    };
    sku?: string;
    rawPayload: any; // Keep origin
}

export const USE_STI_BRIDGE = true;

export function mapUnifiedToCalendarEvents(
    activities: any[] // Expected to be UnifiedCalendarEventDTO[]
): CalendarEvent[] {
    if (!activities) return [];
    return activities.map((a: any) => {
        if (!a.startDatetime) return null;

        const startDate = new Date(a.startDatetime);
        const endDate = a.endDatetime ? new Date(a.endDatetime) : new Date(startDate.getTime() + 3600000); // fallback +1h
        
        return {
            id: a.id,
            title: a.title || a.categoryName || "Attività",
            start: a.startDatetime,
            end: a.endDatetime,
            type: a.activityType || "standard",
            source: a.rawPayload?.legacy_source_type || a.activityFamily,
            instructorId: a.instructorIds?.[0] || null,
            instructorName: a.instructorNames?.[0] || undefined,
            categoryId: a.categoryId,
            categoryName: a.categoryName,
            studioId: a.studioId,
            status: a.statusLabels?.[0] || "active",
            // Compliance with CalendarEvent internal required UI format:
            sourceType: a.rawPayload?.legacy_source_type || a.activityFamily,
            sourceId: a.rawPayload?.id || 0,
            startTime: format(startDate, "HH:mm"),
            endTime: format(endDate, "HH:mm"),
            dayOfWeek: WEEKDAYS[startDate.getDay() === 0 ? 6 : startDate.getDay() - 1]?.id || "LUN",
            startDate: format(startDate, "yyyy-MM-dd"),
            endDate: format(endDate, "yyyy-MM-dd"),
            active: a.isActive,
            registryKey: a.rawPayload?.legacy_source_type || a.activityFamily,
            colorProps: a.colorProps || { className: "bg-gray-100 border-l-gray-500 text-gray-700" },
            sku: a.sku || undefined,
            rawPayload: a.rawPayload || a
        } as unknown as CalendarEvent;
    }).filter(Boolean) as CalendarEvent[];
}

// Support for Phase 5 exact date overlap checks
export const isEventOnDate = (evt: CalendarEvent, targetDateStr: string) => {
    if (!evt.startDate) return false;
    const s = evt.startDate; 
    const e = evt.endDate || s; 
    return targetDateStr >= s && targetDateStr <= e;
};

export default function CalendarPage() {
    const [, setLocation] = useLocation();

    // Estrae param date= per il deep linking dal Planning Strategico
    const initialDate = useMemo(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const dateParam = params.get('date');
            if (dateParam) {
                const parsed = new Date(dateParam);
                if (!isNaN(parsed.getTime())) return parsed;
            }
        } catch(e) {}
        return new Date();
    }, []);

    const getStartOfWeek = (d: Date) => {
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };

    // --- PHASE 19: Time-Space Elastico (Two-Pass Height Observer) ---
    const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    // Inizializzazione sincrona (impedisce accavallamenti durante il delay dell'useEffect)
    if (typeof window !== 'undefined' && !resizeObserverRef.current) {
        resizeObserverRef.current = new window.ResizeObserver((entries) => {
            setMeasuredHeights(prev => {
                let changed = false;
                const next = { ...prev };
                for (const entry of entries) {
                    const id = entry.target.getAttribute('data-event-id');
                    if (id) {
                        const h = entry.target.getBoundingClientRect().height;
                        if (Math.abs((next[id] || 0) - h) > 1) { // 1px threshold per tolleranza fluttuazioni
                            next[id] = h;
                            changed = true;
                        }
                    }
                }
                return changed ? next : prev;
            });
        });
    }

    useEffect(() => {
        return () => {
            if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
        }
    }, []);

    const handleCardRef = useCallback((el: HTMLDivElement | null) => {
        if (el && resizeObserverRef.current) {
            resizeObserverRef.current.observe(el);
        }
    }, [measuredHeights]); // Dipendenza nominale
    // ----------------------------------------------------------------

    const [viewDate, setViewDate] = useState(initialDate);
    const [selectedStudio, setSelectedStudio] = useState<string>("all");
    const [selectedInstructor, setSelectedInstructor] = useState<string>("all");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedDay, setSelectedDay] = useState<string>(() => {
        const dayIdx = initialDate.getDay();
        return WEEKDAYS[dayIdx === 0 ? 6 : dayIdx - 1].id;
    });
    const [searchQuery, setSearchQuery] = useState("");
    
    // --- Configurazione Dinamica Orari Centro ---
    const { data: centerHoursConfig } = useQuery<{ start: string, end: string, days: string[] }>({ queryKey: ["/api/config/center-hours"] });
    const { parsedHours: HOURS, globalStartHour, globalEndHour, globalStartStr, globalEndStr } = useMemo(() => {
        let s = 7;
        let e = 23;
        let startStr = "07:00";
        let endStr = "23:00";
        if (centerHoursConfig?.start && centerHoursConfig?.end) {
            s = parseInt(centerHoursConfig.start.split(":")[0]);
            e = parseInt(centerHoursConfig.end.split(":")[0]);
            startStr = centerHoursConfig.start;
            endStr = centerHoursConfig.end;
        }
        const hoursList = Array.from({ length: e - s + 1 }, (_, i) => i + s);
        return { globalStartHour: s, globalEndHour: e, parsedHours: hoursList, globalStartStr: startStr, globalEndStr: endStr };
    }, [centerHoursConfig]);
    // ------------------------------------------
    
    const [conflictInfo, setConflictInfo] = useState<{ message: string, data: any, isUpdate: boolean } | null>(null);
    const [conflictEventId, setConflictEventId] = useState<string | null>(null);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
    const [editingBooking, setEditingBooking] = useState<any | null>(null);
    const [selectionContext, setSelectionContext] = useState<{ dayId: string, studioId: number | null, hour: number, date?: Date } | null>(null);
    const [unifiedFormOpen, setUnifiedFormOpen] = useState(false);
    const [unifiedFormType, setUnifiedFormType] = useState<"course" | "workshop" | "booking">("course");
    const [selectedEventType, setSelectedEventType] = useState<string>("all");
    const [newEventSelectionType, setNewEventSelectionType] = useState<string>("");
    const [instructorSearchOpen, setInstructorSearchOpen] = useState(false);
    const [showFreeSlots, setShowFreeSlots] = useState(false);
    const { toast } = useToast();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollContainerRef.current) {
            const currentHour = new Date().getHours();
            if (currentHour >= 8 && currentHour <= 22) {
                // Calcola l'offset basandosi su ROW_HEIGHT = 120 e scrolla ammorbidendo di 1 ora
                const targetScroll = Math.max(0, (currentHour - 8 - 1) * 120);
                // Utilizza un piccolo timeout per assicurarsi che i children e il DOM layout siano completi
                setTimeout(() => {
                    scrollContainerRef.current?.scrollTo({ top: targetScroll, behavior: 'smooth' });
                }, 100);
            }
        }
    }, [selectedDay, viewDate]);

    const currentWeekStart = startOfWeek(viewDate, { weekStartsOn: 1 });
    const currentWeekEnd = addDays(currentWeekStart, 6);

    const weekDatesMap = useMemo(() => {
        const m: Record<string, string> = {};
        WEEKDAYS.forEach((d, idx) => {
            m[d.id] = format(addDays(currentWeekStart, idx), "yyyy-MM-dd");
        });
        return m;
    }, [currentWeekStart]);



    const nextWeek = () => setViewDate(prev => addDays(prev, 7));
    const prevWeek = () => setViewDate(prev => addDays(prev, -7));
    const resetToToday = () => {
        const today = new Date();
        setViewDate(today);
        setSelectedDay((() => {
            const dayIdx = today.getDay();
            return WEEKDAYS[dayIdx === 0 ? 6 : dayIdx - 1]?.id || "LUN";
        })());
    };

    // Get Lists for standard Comboboxes
    const formItems = useCustomListValues("genere");

    // Modal forms state for editing
    const [editForm, setEditForm] = useState<Partial<Course>>({});
    const [bookingForm, setBookingForm] = useState<any>({});
    const [memberSearchOpen, setMemberSearchOpen] = useState(false);
    const [searchBookingMemberQuery, setSearchBookingMemberQuery] = useState("");
    const [serviceSearchOpen, setServiceSearchOpen] = useState(false);
    const [quickAddMemberOpen, setQuickAddMemberOpen] = useState(false);
    const [quickAddServiceOpen, setQuickAddServiceOpen] = useState(false);
    const [newMemberForm, setNewMemberForm] = useState({
        firstName: "",
        lastName: "",
        fiscalCode: "",
        dateOfBirth: "",
        placeOfBirth: "",
        gender: "",
        email: "",
        phone: "",
        mobile: "",
        streetAddress: "",
        city: "",
        province: "",
        postalCode: "",
        notes: ""
    });
    const [lastAddedMember, setLastAddedMember] = useState<any>(null);
    const [newServiceForm, setNewServiceForm] = useState({ name: "", price: "0", color: "#3b82f6" });
    const [location] = useLocation();

    // Queries
    const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
        queryKey: ["/api/courses"],
    });

    const { data: studios, isLoading: studiosLoading } = useQuery<Studio[]>({
        queryKey: ["/api/studios"],
    });

    const { data: instructors, isLoading: instructorsLoading } = useQuery<Instructor[]>({
        queryKey: ["/api/instructors"],
    });

    const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
        queryKey: ["/api/categories"],
    });

    const { data: enrollments } = useQuery<any[]>({
        queryKey: ["/api/universal-enrollments"],
    });

    const { data: quotes } = useQuery<Quote[]>({ // Fetch quotes
        queryKey: ["/api/quotes"],
    });

    const { data: bookingServices } = useQuery<BookingService[]>({
        queryKey: ["/api/booking-services"],
    });

    const { data: studioBookings } = useQuery<any[]>({
        queryKey: ["/api/studio-bookings"],
    });

    const { data: paymentMethods } = useQuery<PaymentMethod[]>({
        queryKey: ["/api/payment-methods"],
    });

    const { data: workshops } = useQuery<Workshop[]>({
        queryKey: ["/api/workshops"],
    });

    const { data: activityStatuses } = useQuery<ActivityStatus[]>({
        queryKey: ["/api/activity-statuses"],
    });

    const { data: seasons } = useQuery<any[]>({
        queryKey: ["/api/seasons"],
    });

    const [selectedSeasonId, setSelectedSeasonId] = useState<string>("active");

    const unifiedQueryKey = selectedSeasonId === "active" ? "/api/activities-unified-preview" : `/api/activities-unified-preview?seasonId=${selectedSeasonId}`;
    const { data: unifiedBridgeActivities } = useQuery<any[]>({
        queryKey: [unifiedQueryKey],
        enabled: USE_STI_BRIDGE,
    });

    const strategicQueryKey = selectedSeasonId === "active" ? "/api/strategic-events" : `/api/strategic-events?seasonId=${selectedSeasonId}`;
    const { data: strategicEventsData, isLoading: strategicLoading } = useQuery<any[]>({
        queryKey: [strategicQueryKey]
    });

    const prevSeasonId = useRef<string | null>(null);

    useEffect(() => {
        if (!seasons?.length) return;
        
        // Auto-advance season if we are in February or later
        if (prevSeasonId.current === null && selectedSeasonId === "active") {
            const now = new Date();
            if (now.getMonth() >= 1) { // February is index 1
                const activeSeason = seasons.find(s => s.active) || seasons[0];
                const activeIdx = seasons.findIndex(s => s.id === activeSeason.id);
                
                // activeIdx - 1 is the next season because order is DESC (newest first)
                if (activeIdx > 0) {
                    setSelectedSeasonId(seasons[activeIdx - 1].id.toString());
                    return; // Skip normal navigation logic on auto jump
                } else if (activeIdx === 0) {
                    // Auto-generate next season
                    const yearMatch = activeSeason.name.match(/20(\d{2})\/20(\d{2})/);
                    const activeYear = yearMatch ? 2000 + parseInt(yearMatch[1]) : NaN;
                    
                    if (!isNaN(activeYear)) {
                        const nextName = `${activeYear + 1}/${activeYear + 2}`;
                        fetch('/api/seasons', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: nextName,
                                startDate: `${activeYear + 1}-09-01T00:00:00.000Z`,
                                endDate: `${activeYear + 2}-08-31T23:59:59.000Z`,
                                active: false
                            })
                        }).then(() => {
                            queryClient.invalidateQueries({ queryKey: ["/api/seasons"] }).then(() => {
                                // Will re-trigger and auto jump on next render
                            });
                        });
                    }
                }
            }
        }
        // Imperative setup happens in handleSeasonChange now
        prevSeasonId.current = selectedSeasonId;
    }, [selectedSeasonId, seasons]);

    useEffect(() => {
        // Seamlessly switch selected season when scrolling viewDate crosses boundaries
        if (!seasons || !seasons.length) return;
        const activeSeason = seasons.find((s: any) => s.active) || seasons[0];
        const resolvedId = selectedSeasonId === "active" ? activeSeason?.id?.toString() : selectedSeasonId;
        const currentSeason = seasons.find((s: any) => s.id.toString() === resolvedId);
        
        if (currentSeason) {
            const vDate = new Date(viewDate);
            const sDate = new Date(currentSeason.startDate);
            const eDate = new Date(currentSeason.endDate);
            
            // Allow slight buffer before forcing a switch to prevent flip-flopping near boundaries if not needed
            if (vDate < sDate || vDate > eDate) {
                const matchingSeason = seasons.find((s: any) => vDate >= new Date(s.startDate) && vDate <= new Date(s.endDate));
                if (matchingSeason && matchingSeason.id !== currentSeason.id) {
                    const isMatchingActive = matchingSeason.id === activeSeason.id;
                    const newId = isMatchingActive ? "active" : matchingSeason.id.toString();
                    setSelectedSeasonId(newId);
                    prevSeasonId.current = newId;
                }
            }
        }
    }, [viewDate, seasons, selectedSeasonId]);

    const handleSeasonChange = (newVal: string) => {
        setSelectedSeasonId(newVal);
        const activeSeason = seasons?.find(s => s.active) || seasons?.[0];
        const resolvedId = newVal === "active" ? activeSeason?.id.toString() : newVal;
        const selectedSeason = seasons?.find(s => s.id.toString() === resolvedId);
        
        if (selectedSeason && selectedSeason.startDate) {
            if (newVal === "active") {
                const now = new Date();
                const start = new Date(selectedSeason.startDate);
                const end = selectedSeason.endDate ? new Date(selectedSeason.endDate) : new Date();
                if (now < start || now > end) {
                    setViewDate(start); 
                } else {
                    setViewDate(now);
                }
            } else {
                setViewDate(new Date(selectedSeason.startDate));
            }
        }
    };

    const { data: workshopAttendances } = useQuery<any[]>({
        queryKey: ["/api/workshop-attendances"],
    });

    const { data: membersData } = useQuery<any>({
        queryKey: ["/api/members"],
    });

    const { data: bookingSearchData } = useQuery<{ members: Member[], total: number }>({
        queryKey: ["/api/members", { search: searchBookingMemberQuery }],
        queryFn: async () => {
            const res = await fetch(`/api/members?search=${encodeURIComponent(searchBookingMemberQuery)}&pageSize=50`);
            return res.json();
        },
        enabled: searchBookingMemberQuery.length >= 2,
    });

    // Handle auto-open for bookings from sidebar
    useEffect(() => {
        if (!studios) return; // Wait for studios to load

        const params = new URLSearchParams(window.location.search);
        if (params.get("action") === "new-booking") {
            const today = new Date();
            const currentHour = today.getHours();
            const startHour = Math.max(8, Math.min(21, currentHour + 1));
            const timeStr = `${startHour.toString().padStart(2, "0")}:00`;
            const endTimeStr = `${(startHour + 1).toString().padStart(2, "0")}:00`;

            const firstStudioId = (studios && studios.length > 0) ? studios[0].id : 1;

            const newBooking: Partial<StudioBooking> = {
                studioId: firstStudioId,
                bookingDate: today,
                startTime: timeStr,
                endTime: endTimeStr,
                status: "confirmed",
                paid: false,
                amount: "0"
            };
            setEditingBooking(newBooking);
            setBookingForm(newBooking);

            // Clear URL param to prevent re-opening
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [location, studios]);

    const getDayId = (date: Date) => {
        if (!date || isNaN(date.getTime())) return "";
        const day = date.getDay();
        const index = day === 0 ? 6 : day - 1;
        return WEEKDAYS[index]?.id || "";
    };

    const sortedInstructors = useMemo(() => {
        if (!instructors) return [];
        return [...instructors].sort((a, b) => (a.lastName || "").localeCompare(b.lastName || ""));
    }, [instructors]);

    const sortedStudios = useMemo(() => {
        if (!studios) return [];
        return [...studios].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }, [studios]);

    const sortedCategories = useMemo(() => {
        if (!categories) return [];
        return [...categories].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }, [categories]);

    const freeSlots = useMemo(() => {
        if (!bookingForm.bookingDate || !bookingForm.studioId) return [];

        const dateObj = new Date(bookingForm.bookingDate);
        const dateStr = format(dateObj, 'yyyy-MM-dd');
        const dayId = getDayId(dateObj);
        const studioId = bookingForm.studioId;

        const dayCourses = (courses || []).filter(c => {
            if (c.studioId != studioId) return false;
            if (c.active !== undefined && !c.active) return false;
            if (!c.dayOfWeek || !c.dayOfWeek.toUpperCase().startsWith(dayId)) return false;

            // Check date range if present
            if (c.startDate && getSafeDateStr(c.startDate) > dateStr) return false;
            if (c.endDate && getSafeDateStr(c.endDate) < dateStr) return false;

            return true;
        });
        const dayBookings = (studioBookings || []).filter(b => {
            if (b.studioId !== studioId) return false;
            const bDateStr = format(new Date(b.bookingDate), 'yyyy-MM-dd');
            if (bDateStr !== dateStr) return false;
            if (bookingForm.id && b.id === bookingForm.id) return false;
            if (b.status === 'cancelled') return false;
            return true;
        });
        const dayWorkshops = (workshops || []).filter(w => {
            if (w.studioId !== studioId) return false;
            if (w.active === false) return false; // assuming explicit false check if optional, or just w.active

            // Check day of week
            if (!w.dayOfWeek || !w.dayOfWeek.toUpperCase().startsWith(dayId)) return false;

            // Check date range
            if (w.startDate && getSafeDateStr(w.startDate) > dateStr) return false;
            if (w.endDate && getSafeDateStr(w.endDate) < dateStr) return false;

            return true;
        });

        const busy = [
            ...dayCourses.map(c => ({ start: c.startTime, end: c.endTime })),
            ...dayBookings.map(b => ({ start: b.startTime, end: b.endTime })),
            ...dayWorkshops.map(w => ({ start: w.startTime, end: w.endTime }))
        ];

        const slots: { start: string, end: string }[] = [];
        let currentStart: any = null;
        const relevantSlots = TIME_SLOTS.filter(t => t >= globalStartStr && t <= globalEndStr);

        // First find continuous free segments
        const segments: { start: string, end: string }[] = [];
        relevantSlots.forEach((t) => {
            const isBusy = busy.some(range => t >= range.start && t < range.end);
            if (!isBusy) {
                if (currentStart === null) currentStart = t;
            } else {
                if (currentStart !== null) {
                    segments.push({ start: currentStart, end: t });
                    currentStart = null;
                }
            }
        });

        if (currentStart !== null) {
            segments.push({ start: currentStart, end: globalEndStr });
        }

        // Now divide each segment into 1-hour chunks
        segments.forEach(seg => {
            const startHour = parseInt(seg.start.split(':')[0]);
            const startMin = parseInt(seg.start.split(':')[1]);
            const endHour = parseInt(seg.end.split(':')[0]);
            const endMin = parseInt(seg.end.split(':')[1]);

            let currentTotalMinutes = startHour * 60 + startMin;
            const endTotalMinutes = endHour * 60 + endMin;

            while (currentTotalMinutes + 60 <= endTotalMinutes) {
                const chunkStartH = Math.floor(currentTotalMinutes / 60);
                const chunkStartM = currentTotalMinutes % 60;
                const chunkEndH = Math.floor((currentTotalMinutes + 60) / 60);
                const chunkEndM = (currentTotalMinutes + 60) % 60;

                slots.push({
                    start: `${chunkStartH.toString().padStart(2, '0')}:${chunkStartM.toString().padStart(2, '0')}`,
                    end: `${chunkEndH.toString().padStart(2, '0')}:${chunkEndM.toString().padStart(2, '0')}`
                });

                // Move by 1 hour
                currentTotalMinutes += 60;
            }

            // If there's a smaller remainder at the end of the segment, add it too (optional, but good for completeness)
            if (currentTotalMinutes < endTotalMinutes) {
                const chunkStartH = Math.floor(currentTotalMinutes / 60);
                const chunkStartM = currentTotalMinutes % 60;
                slots.push({
                    start: `${chunkStartH.toString().padStart(2, '0')}:${chunkStartM.toString().padStart(2, '0')}`,
                    end: seg.end
                });
            }
        });

        return slots;
    }, [bookingForm.bookingDate, bookingForm.studioId, courses, studioBookings, workshops, bookingForm.id]);

    const members = (Array.isArray(membersData) ? membersData : (membersData?.members || [])) as Member[];

    const handleCFChange = (val: string) => {
        const cf = val.toUpperCase().trim();
        setNewMemberForm((prev: any) => ({ ...prev, fiscalCode: cf }));

        if (cf.length === 16 && validateFiscalCode(cf)) {
            const parsed = parseFiscalCode(cf);
            if (parsed) {
                setNewMemberForm((prev: any) => ({
                    ...prev,
                    dateOfBirth: parsed.dateOfBirth,
                    gender: parsed.gender,
                    placeOfBirth: getPlaceName(parsed.placeOfBirth || "") || parsed.placeOfBirth || ""
                }));
                toast({
                    title: "Dati estratti",
                    description: "Data di nascita e sesso compilati dal Codice Fiscale."
                });
            }
        }
    };

    const createMemberMutation = useMutation({
        mutationFn: async (data: any) => {
            console.log("Creating member with data:", data);
            return await apiRequest("POST", "/api/members", data);
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["/api/members"], (oldData: any) => {
                const currentMembers = Array.isArray(oldData) ? oldData : (oldData?.members || []);
                return { members: [...currentMembers, data] };
            });
            toast({ title: "Partecipante creato", description: `${data.lastName} ${data.firstName} aggiunto correttamente.` });
            setQuickAddMemberOpen(false);
            setBookingForm((prev: any) => ({ ...prev, memberId: data.id }));
            setLastAddedMember(data); // Set the last added member
            // Reset form
            setNewMemberForm({
                firstName: "", lastName: "", fiscalCode: "", dateOfBirth: "", placeOfBirth: "",
                gender: "", email: "", phone: "", mobile: "", streetAddress: "",
                city: "", province: "", postalCode: "", notes: ""
            });
        },
        onError: (error: Error) => {
            console.error("Member creation error:", error);
            toast({
                title: "Errore salvataggio",
                description: error.message || "Verifica i dati inseriti e riprova.",
                variant: "destructive"
            });
        }
    });

    const createServiceMutation = useMutation({
        mutationFn: async (data: any) => {
            return await apiRequest("POST", "/api/booking-services", data);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["/api/booking-services"] });
            toast({ title: "Servizio creato", description: `${data.name} aggiunto correttamente.` });
            setQuickAddServiceOpen(false);
            setBookingForm((prev: any) => ({ ...prev, serviceId: data.id }));
        }
    });

    const isLoading = coursesLoading || studiosLoading || instructorsLoading || categoriesLoading || strategicLoading;

    const getCourseStats = (courseId: number) => {
        const courseEnrollments = enrollments?.filter(e => e.activityDetailId === courseId && (e.status === 'active' || !e.status)) || [];
        const men = courseEnrollments.filter(e => {
            const g = e.memberGender?.toUpperCase();
            return g === 'U' || g === 'M' || g === 'UOMO' || g === 'MASCHIO';
        }).length;
        const women = courseEnrollments.filter(e => {
            const g = e.memberGender?.toUpperCase();
            return g === 'D' || g === 'F' || g === 'DONNA' || g === 'FEMMINA';
        }).length;
        return { men, women, total: courseEnrollments.length };
    };

    const getWorkshopStats = (workshopId: number) => {
        const enrolls = enrollments?.filter(e => e.activityDetailId === workshopId && (e.status === 'active' || !e.status)) || [];
        const men = enrolls.filter(e => {
            const g = e.memberGender?.toUpperCase();
            return g === 'U' || g === 'M' || g === 'UOMO' || g === 'MASCHIO';
        }).length;
        const women = enrolls.filter(e => {
            const g = e.memberGender?.toUpperCase();
            return g === 'D' || g === 'F' || g === 'DONNA' || g === 'FEMMINA';
        }).length;
        return { men, women, total: enrolls.length };
    };

    // Helper to normalize day from DB to match our IDs
    const normalizeDay = (day?: any) => {
        if (!day || typeof day !== 'string') return "";
        const d = day.toUpperCase().trim();
        if (d.startsWith("LUN")) return "LUN";
        if (d.startsWith("MAR")) return "MAR";
        if (d.startsWith("MER")) return "MER";
        if (d.startsWith("GIO")) return "GIO";
        if (d.startsWith("VEN")) return "VEN";
        if (d.startsWith("SAB")) return "SAB";
        if (d.startsWith("DOM")) return "DOM";
        return d;
    };

    // Filtered Courses
    const filteredCourses = useMemo(() => {
        if (!courses || !Array.isArray(courses)) return [];
        const search = searchQuery.toLowerCase().trim();
        return courses.filter(course => {
            const courseDay = normalizeDay(course.dayOfWeek);
            const matchStudio = selectedStudio === "all" || course.studioId?.toString() === selectedStudio;
            const matchInstructor = selectedInstructor === "all" || course.instructorId?.toString() === selectedInstructor;
            const matchCategory = selectedCategory === "all" || course.categoryId?.toString() === selectedCategory;
            const matchDay = selectedDay === "all" || courseDay === selectedDay;
            // Check active status (handle 1/0 or true/false)
            const isActive = course.active === true || Number(course.active) === 1 || course.active === null || course.active === undefined;

            let matchSearch = true;
            if (search) {
                const instr = instructors?.find(i => i.id === course.instructorId);
                const instrName = instr ? `${instr.lastName} ${instr.firstName}`.toLowerCase() : "";
                const sku = (course.sku || "").toLowerCase();
                const stato = (course.active === true || Number(course.active) === 1 || course.active === null || course.active === undefined) ? "attivo" : "inattivo";
                matchSearch = (course.name || "").toLowerCase().includes(search) ||
                    (course.description?.toLowerCase().includes(search) || false) ||
                    instrName.includes(search) || sku.includes(search) || stato.includes(search);
            }

            return matchStudio && matchInstructor && matchCategory && matchDay && isActive && matchSearch;
        }).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    }, [courses, selectedStudio, selectedInstructor, selectedCategory, selectedDay, searchQuery, instructors]);

    // Filtered Workshops
    const filteredWorkshops = useMemo(() => {
        if (!workshops || !Array.isArray(workshops)) return [];
        const search = searchQuery.toLowerCase().trim();
        return workshops.filter(workshop => {
            const workshopDay = normalizeDay(workshop.dayOfWeek);
            const matchStudio = selectedStudio === "all" || workshop.studioId?.toString() === selectedStudio;
            const matchInstructor = selectedInstructor === "all" || workshop.instructorId?.toString() === selectedInstructor;
            const matchCategory = selectedCategory === "all" || workshop.categoryId?.toString() === selectedCategory;
            const matchDay = selectedDay === "all" || workshopDay === selectedDay;
            // Check active status (handle 1/0 or true/false)
            const isActive = workshop.active === true || Number(workshop.active) === 1 || workshop.active === null || workshop.active === undefined;

            let matchSearch = true;
            if (search) {
                const instr = instructors?.find(i => i.id === workshop.instructorId);
                const instrName = instr ? `${instr.lastName} ${instr.firstName}`.toLowerCase() : "";
                const sku = (workshop.sku || "").toLowerCase();
                const stato = (workshop.active === true || Number(workshop.active) === 1 || workshop.active === null || workshop.active === undefined) ? "attivo" : "inattivo";
                matchSearch = (workshop.name || "").toLowerCase().includes(search) ||
                    (workshop.description?.toLowerCase().includes(search) || false) ||
                    instrName.includes(search) || sku.includes(search) || stato.includes(search);
            }

            return matchStudio && matchInstructor && matchCategory && matchDay && isActive && matchSearch;
        }).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    }, [workshops, selectedStudio, selectedInstructor, selectedCategory, selectedDay, searchQuery, instructors]);

    // Helper to get color for course
    const ACTIVITY_TYPE_COLORS: Record<string,string> = {
      allenamenti:  "#1e40af",
      prenotazioni: "#7c3aed",
      workshop:     "#c2410c",
      domeniche:    "#a16207",
      saggi:        "#be185d",
      vacanze:      "#15803d",
      campus:       "#0369a1",
      affitti:      "#374151",
    };

    const getCourseColor = (course: any) => {
        const type = course.activityType || 
                     course.rawPayload?.activityType ||
                     "course";
                     
        console.log("TYPE:", type, course);
        
        // Se NON è un corso normale → colore fisso
        if (ACTIVITY_TYPE_COLORS[type] && type !== "course") {
            const hex = ACTIVITY_TYPE_COLORS[type];
            return {
                backgroundColor: `${hex}25`,
                borderLeftColor: hex,
                color: hex,
            };
        }
        
        // Se è un corso → colore da categoria
        const category = categories?.find(c => c.id === course.categoryId);
        if (category?.color) {
            const hex = category.color;
            return {
                backgroundColor: `${hex}25`,
                borderLeftColor: hex,
                color: hex,
            };
        }
        
        const id = course.categoryId || 0;
        return { className: COLORS[id % COLORS.length] };
    };

    const getBookingColor = (booking: any) => {
        const color = booking.serviceColor || "#64748b";
        return {
            backgroundColor: `${color}20`,
            borderLeftColor: color,
            color: color,
        };
    };

    // --- UNIFIED EVENT MAPPER (Registro Centrale Source of Truth) ---
    const unifiedEvents = useMemo<CalendarEvent[]>(() => {
        if (USE_STI_BRIDGE && unifiedBridgeActivities) {
            console.log("STI MODE ACTIVE");
            console.log("Unified Activities Input:", unifiedBridgeActivities.length);
            
            let stiEvents = mapUnifiedToCalendarEvents(unifiedBridgeActivities);
            
            if (selectedEventType !== "all") {
                 stiEvents = stiEvents.filter(e => e.registryKey === selectedEventType);
            }

            const search = searchQuery.toLowerCase().trim();
            stiEvents = stiEvents.filter(evt => {
                const matchStudio = selectedStudio === "all" || evt.studioId?.toString() === selectedStudio;
                const matchInstructor = selectedInstructor === "all" || evt.instructorId?.toString() === selectedInstructor;
                const matchCategory = selectedCategory === "all" || evt.categoryId?.toString() === selectedCategory;
                const isActive = evt.active === true || Number(evt.active) === 1 || evt.active === null || evt.active === undefined;
                
                let matchSearch = true;
                if (search) {
                    const instrName = (evt.instructorName || "").toLowerCase();
                    const sku = (evt.sku || "").toLowerCase();
                    const stato = isActive ? "attivo" : "inattivo";
                    matchSearch = (evt.title || "").toLowerCase().includes(search) || 
                                  (evt.description?.toLowerCase().includes(search) || false) || 
                                  instrName.includes(search) || sku.includes(search) || stato.includes(search);
                }

                return matchStudio && matchInstructor && matchCategory && isActive && matchSearch;
            });

            return stiEvents;
        }

        // --- FALLBACK LEGACY ---
        const events: CalendarEvent[] = [];
        const activities = getActiveActivities();

        events.push(
            ...filteredCourses.map(c => mapCourseToCalendarEvent(c, categories, instructors, activities, getCourseColor(c)))
        );

        events.push(
            ...filteredWorkshops.map(w => mapWorkshopToCalendarEvent(w, categories, instructors, activities, getCourseColor(w)))
        );

        const relevantBookings = (Array.isArray(studioBookings) ? studioBookings : []).filter(b => b.status !== 'cancelled' && b.studioId && b.bookingDate);
        events.push(
            ...relevantBookings.map(b => mapStudioBookingToCalendarEvent(b, activities, getBookingColor(b)))
        );

        if (selectedEventType !== "all") {
             return events.filter(e => {
                 if (selectedEventType === "corsi" && (e.registryKey === "course" || e.registryKey === "courses" || e.registryKey === "corsi" || e.sourceType === "course")) return true;
                 if (selectedEventType === "workshop" && (e.registryKey === "workshop" || e.registryKey === "workshops" || e.sourceType === "workshop")) return true;
                 if (selectedEventType === "affitto" && (e.registryKey === "rentals" || e.registryKey === "studioBookings" || e.sourceType === "studioBookings" || e.sourceType === "rentals")) return true;
                 return e.registryKey === selectedEventType || e.sourceType === selectedEventType;
             });
        }

        return events;
    }, [filteredCourses, filteredWorkshops, studioBookings, bookingServices, instructors, selectedEventType, categories, unifiedBridgeActivities, selectedStudio, selectedInstructor, selectedCategory, searchQuery]);

    const ROW_HEIGHT = 120; // Increased from 60
    const PX_PER_MIN = ROW_HEIGHT / 60;

    // Helper to parse time string (HH:mm) to minutes from globalStartHour
    const timeToMinutes = useCallback((timeStr?: string) => {
        if (!timeStr || typeof timeStr !== 'string') return 0;
        const parts = timeStr.split(":");
        if (parts.length < 2) return 0;
        let hours = parseInt(parts[0], 10) || 0;
        if (hours === 0 && globalStartHour > 0) hours = 24; // Handle 00:00 as Midnight
        const minutes = parseInt(parts[1], 10) || 0;
        return ((hours * 60 + minutes) - (globalStartHour * 60)) * PX_PER_MIN;
    }, [globalStartHour]);

    // Hoisted function per prevenire ReferenceError (TDZ) negli useMemo richiamati prima della dichiarazione originale
    function stripSeconds(timeStr?: string | null) {
        if (!timeStr || typeof timeStr !== 'string') return "";
        return timeStr.substring(0, 5);
    }

    function safeIsoString(dateVal: any) {
        if (!dateVal) return undefined;
        try {
            const d = new Date(dateVal);
            return isNaN(d.getTime()) ? undefined : d.toISOString();
        } catch {
            return undefined;
        }
    }

    function getSafeDateStr(dateVal: any) {
        const iso = safeIsoString(dateVal);
        return iso ? iso.split('T')[0] : "";
    }

    const TOTAL_MINUTES = HOURS.length * 60; // Calculate max grid height dynamically based on HOURS

    const calendarLayout = useMemo(() => {
        // 1. Definisci le Colonne Visibili Base (Giorni o Sale)
        const columns = selectedDay === 'all' 
            ? WEEKDAYS.map(d => ({ type: 'day', id: d.id, label: d.label })) 
            : (studios || []).map(s => ({ type: 'studio', id: s.id.toString(), label: s.name }));

        const columnEvents: Record<string, any[]> = {};
        const allVisibleEvents: any[] = [];

        // 2. Collocazione e Clustering Indipendente
        columns.forEach(col => {
            const isDayCol = col.type === 'day';
            const colId = col.id;
            
            const colFiltered = unifiedEvents.filter(evt => {
                const matchStudio = isDayCol 
                    ? (selectedStudio === "all" || evt.studioId?.toString() === selectedStudio)
                    : evt.studioId?.toString() === colId;
                
                if (!matchStudio) return false;
                
                if (USE_STI_BRIDGE) {
                    const targetDateStr = isDayCol ? weekDatesMap[colId] : weekDatesMap[selectedDay];
                    const targetDayId = isDayCol ? colId : selectedDay;
                    return isEventOnDate(evt, targetDateStr) && (!evt.dayOfWeek || evt.dayOfWeek === targetDayId);
                }
                const matchDay = isDayCol ? evt.dayOfWeek === colId : evt.dayOfWeek === selectedDay;
                return matchDay;
            });

            const sorted = [...colFiltered].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

            const processedEvents: any[] = [];
            let currentCluster: any[] = [];
            let clusterEnd = 0;

            const processCluster = (cluster: any[]) => {
                if (cluster.length === 0) return;
                const cols: typeof cluster[] = [];
                cluster.forEach(cevt => {
                    let placed = false;
                    for (const c of cols) {
                        if (cevt.startPx >= c[c.length - 1].endPx) {
                            c.push(cevt);
                            placed = true;
                            break;
                        }
                    }
                    if (!placed) cols.push([cevt]);
                });
                
                const total = cols.length;
                const widthNum = 100 / total;
                cols.forEach((c, colIndex) => {
                    const leftNum = colIndex * widthNum;
                    c.forEach(cevt => {
                        processedEvents.push({
                            ...cevt,
                            layoutLeft: leftNum,
                            layoutWidth: widthNum,
                            eventId: `evt-${cevt.id || cevt.uniqueEventId}-${cevt.sourceType}-${cevt.sourceId}`
                        });
                    });
                });
            };

            const sortedWithMetrics = sorted.map((evt, idx) => {
                const startPx = timeToMinutes(evt.startTime);
                let endPxRaw = timeToMinutes(evt.endTime);
                
                // Intelligent fallback se manca orario di fine esatto o è fallace
                if (!endPxRaw || endPxRaw <= startPx) {
                    endPxRaw = startPx + (60 * PX_PER_MIN);
                    // Lookahead: trova il prossimo evento in questa sala e taglia il default per non sforare over-time
                    const nextEvt = sorted.find((n, nIdx) => 
                        nIdx > idx && 
                        String(n.studioId) === String(evt.studioId) && 
                        timeToMinutes(n.startTime) > startPx
                    );
                    if (nextEvt) {
                        const nextStartPx = timeToMinutes(nextEvt.startTime);
                        if (endPxRaw > nextStartPx && nextStartPx > startPx) {
                            endPxRaw = nextStartPx;
                        }
                    }
                }
                
                // Minimo vitale per l'hit-box (evita card collassate)
                const endPx = Math.max(endPxRaw, startPx + (15 * PX_PER_MIN)); 
                const durationPx = endPx - startPx;
                return { ...evt, startPx, endPx, durationPx, hasTimeOverlap: false };
            });

            // Mark strict overlaps in the same column
            for (let i = 0; i < sortedWithMetrics.length; i++) {
                for (let j = i + 1; j < sortedWithMetrics.length; j++) {
                    const a = sortedWithMetrics[i];
                    const b = sortedWithMetrics[j];
                    if (a.startPx < b.endPx - 1 && a.endPx > b.startPx + 1 && String(a.studioId) === String(b.studioId)) {
                        a.hasTimeOverlap = true;
                        b.hasTimeOverlap = true;
                    }
                }
            }

            sortedWithMetrics.forEach(evtWithMetrics => {
                if (evtWithMetrics.startPx >= clusterEnd - 1) { // 1px threshold for safe bounds
                    processCluster(currentCluster);
                    currentCluster = [evtWithMetrics];
                    clusterEnd = evtWithMetrics.endPx;
                } else {
                    currentCluster.push(evtWithMetrics);
                    if (evtWithMetrics.endPx > clusterEnd) clusterEnd = evtWithMetrics.endPx;
                }
            });
            processCluster(currentCluster);

            columnEvents[colId] = processedEvents;
            allVisibleEvents.push(...processedEvents);
        });

        // 3. Spazio-Tempo Dilatato (Row Height Normalization)
        // Array che rappresenta il "costo" in altezza di ogni minuto della giornata
        const minHeights = new Float64Array(TOTAL_MINUTES).fill(PX_PER_MIN);

        allVisibleEvents.forEach(evt => {
            const startMin = Math.floor(evt.startPx / PX_PER_MIN);
            const durationMin = Math.floor(evt.durationPx / PX_PER_MIN) || 1;
            const endMin = Math.min(startMin + durationMin, TOTAL_MINUTES);

            // Fetch in tempo reale dell'altezza generata dal DOM text, o fallback al Time naturale
            const reqHeight = Math.max(measuredHeights[evt.eventId] || 0, evt.durationPx);
            const reqPerMin = reqHeight / durationMin;

            for (let m = startMin; m < endMin; m++) {
                if (reqPerMin > minHeights[m]) {
                    minHeights[m] = reqPerMin; // Aggrega la massima altezza richiesta in quello slot
                }
            }
        });

        // 4. Somma Cumulativa delle Y Absolute
        let currentTop = 0;
        const cumulativeTops = new Float64Array(TOTAL_MINUTES + 1);
        for (let m = 0; m < TOTAL_MINUTES; m++) {
            cumulativeTops[m] = currentTop;
            currentTop += minHeights[m];
        }
        cumulativeTops[TOTAL_MINUTES] = currentTop;

        return { columns, columnEvents, cumulativeTops };

    }, [unifiedEvents, selectedDay, selectedStudio, measuredHeights, weekDatesMap, timeToMinutes]);
    // ----------------------------------------------------------------

    const resetFilters = () => {
        setSelectedStudio("all");
        setSelectedInstructor("all");
        setSelectedCategory("all");
        setSelectedDay("all");
        setSearchQuery("");
    };

    const updateCourseMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            return await apiRequest("PATCH", `/api/courses/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/activities-unified-preview"] });
            queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
            toast({ title: "Corso aggiornato", description: "Le modifiche sono state salvate correttamente." });
            setEditingCourse(null);
        },
        onError: (err: Error) => {
            toast({ title: "Errore", description: err.message, variant: "destructive" });
        }
    });

    const deleteCourseMutation = useMutation({
        mutationFn: async (id: number) => {
            return await apiRequest("DELETE", `/api/courses/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/activities-unified-preview"] });
            queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
            toast({ title: "Corso eliminato", description: "Il corso è stato rimosso correttamente." });
            setEditingCourse(null);
        },
        onError: (err: Error) => {
            toast({ title: "Errore", description: err.message, variant: "destructive" });
        }
    });

    const handleEditCourse = (course: Course) => {
        setUnifiedFormType((course as any).activityType || "course");
        setEditingCourse(course);
        setEditForm(course);
    };

    const handleCreateCourse = (dayId: string, studioId: number, hour: number, selectionDate?: Date) => {
        let endHour = hour;
        let endMin = 30;
        if (endHour >= 24) endHour = 23;
        
        const timeStr = `${hour.toString().padStart(2, "0")}:00`;
        const endTimeStr = `${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`;

        const actualActiveSeasonId = seasons?.find(s => s.active)?.id || seasons?.[0]?.id;
        const resolvedSeasonId = selectedSeasonId === "active" ? actualActiveSeasonId : (selectedSeasonId ? parseInt(selectedSeasonId, 10) : undefined);

        const newCourse: Partial<Course> = {
            name: "",
            dayOfWeek: dayId,
            studioId: studioId,
            startTime: timeStr,
            endTime: endTimeStr,
            active: true,
            currentEnrollment: 0,
            maxCapacity: 20,
            seasonId: resolvedSeasonId,
            startDate: selectionDate || null,
            endDate: selectionDate || null
        };

        setEditingCourse(newCourse as Course);
        setEditForm(newCourse);
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();

        // VALIDAZIONE CONFLITTO D'ORARIO (FRONTEND SIDE)
        const checkConflict = () => {
             const { studioId, dayOfWeek, startTime, endTime, id } = editForm as any;
             if (!studioId || !startTime || !endTime) return false;

             const newStart = timeToMinutes(startTime);
             const newEnd = timeToMinutes(endTime) || newStart + 60;

             // Estrai la data per i workshop
             const wsDate = unifiedFormType === "workshop" && editForm.startDate ? new Date(editForm.startDate) : null;

             for (const evt of unifiedEvents) {
                 // Skip se è lo stesso evento in modifica
                 if (evt.sourceId === id && evt.sourceType === unifiedFormType) continue;
                 
                 // Devono essere nella stessa sala
                 if (evt.studioId !== studioId) continue;
                 
                 // Verifica match temporale (giorno della settimana O data specifica se workshop)
                 let matchDay = false;
                 if (unifiedFormType === "course") {
                     // I corsi collidono se si ripetono nello stesso giorno
                     matchDay = evt.dayOfWeek === dayOfWeek;
                 } else if (wsDate) {
                     // I workshop hanno date fisse, quindi cerchiamo di capire se evt incrocia quella data
                     matchDay = Boolean(evt.dayOfWeek === getDayId(wsDate) || (evt.startDate && getSafeDateStr(evt.startDate) === getSafeDateStr(wsDate)));
                 } else {
                     matchDay = evt.dayOfWeek === dayOfWeek;
                 }

                 if (!matchDay) continue;

                 // Verifica di sovrapposizione d'orario pura (newStart < oldEnd && newEnd > oldStart)
                 const oldStart = timeToMinutes(evt.startTime);
                 const oldEnd = timeToMinutes(evt.endTime) || oldStart + 60;

                 if (newStart < oldEnd && newEnd > oldStart) {
                     return { conflictedEvt: evt };
                 }
             }
             return false;
        };

        const conflict = checkConflict();
        if (conflict) {
             setConflictEventId(conflict.conflictedEvt.id);
             toast({ 
                 title: "Conflitto d'Orario Rilevato", 
                 description: `La Sala selezionata è già occupata da "${conflict.conflictedEvt.title}" (dalle ${conflict.conflictedEvt.startTime} alle ${conflict.conflictedEvt.endTime}). Scegli un altro orario o un'altra sala.`, 
                 variant: "destructive" 
             });
             setTimeout(() => setConflictEventId(null), 8000);
             return;
        }

        // Ensure all dates are strings or null before sending
        const dataToSave: any = { ...editForm, type: unifiedFormType };
        if (dataToSave.startDate instanceof Date) {
            dataToSave.startDate = dataToSave.startDate.toISOString().split('T')[0];
        } else if (dataToSave.startDate === "") {
            dataToSave.startDate = null;
        }

        if (dataToSave.endDate instanceof Date) {
            dataToSave.endDate = dataToSave.endDate.toISOString().split('T')[0];
        } else if (dataToSave.endDate === "") {
            dataToSave.endDate = null;
        }

        if (unifiedFormType === "course") {
            if (editingCourse?.id) {
                updateCourseMutation.mutate({ id: editingCourse.id, data: dataToSave });
            } else {
                createCourseMutation.mutate(dataToSave as any);
            }
        } else if (unifiedFormType === "workshop") {
            if (editingWorkshop?.id) {
                updateWorkshopMutation.mutate({ id: editingWorkshop.id, data: dataToSave });
            } else {
                createWorkshopMutation.mutate(dataToSave as any);
            }
        }
        setUnifiedFormOpen(false);
    };

    const createWorkshopMutation = useMutation({
        mutationFn: async (data: any) => {
            return await apiRequest("POST", "/api/workshops", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/activities-unified-preview"] });
            queryClient.invalidateQueries({ queryKey: ["/api/workshops"] });
            toast({ title: "Workshop creato", description: "Il nuovo workshop è stato aggiunto con successo." });
            setUnifiedFormOpen(false);
            setEditingWorkshop(null);
        },
        onError: (err: Error) => {
            toast({ title: "Errore", description: err.message, variant: "destructive" });
        }
    });

    const updateWorkshopMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            return await apiRequest("PATCH", `/api/workshops/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/activities-unified-preview"] });
            queryClient.invalidateQueries({ queryKey: ["/api/workshops"] });
            toast({ title: "Workshop aggiornato", description: "Le modifiche scritte con successo." });
            setUnifiedFormOpen(false);
            setEditingWorkshop(null);
        },
        onError: (err: Error) => {
            toast({ title: "Errore", description: err.message, variant: "destructive" });
        }
    });
    const createCourseMutation = useMutation({
        mutationFn: async (data: any) => {
            return await apiRequest("POST", "/api/courses", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/activities-unified-preview"] });
            queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
            toast({ title: "Corso creato", description: "Il nuovo corso è stato aggiunto con successo." });
            setEditingCourse(null);
        },
        onError: (err: Error) => {
            toast({ title: "Errore", description: err.message, variant: "destructive" });
        }
    });

    const createBookingMutation = useMutation({
        mutationFn: async (data: any) => {
            return await apiRequest("POST", "/api/studio-bookings", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/activities-unified-preview"] });
            queryClient.invalidateQueries({ queryKey: ["/api/studio-bookings"] });
            toast({ title: "Prenotazione creata", description: "La prenotazione è stata salvata correttamente." });
            setEditingBooking(null);
            setConflictInfo(null);
        },
        onError: (err: any) => {
            if (err.status === 409) {
                setConflictInfo({ message: err.message, data: bookingForm, isUpdate: false });
            } else {
                toast({ title: "Errore", description: err.message, variant: "destructive" });
            }
        }
    });

    const updateBookingMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            return await apiRequest("PATCH", `/api/studio-bookings/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/activities-unified-preview"] });
            queryClient.invalidateQueries({ queryKey: ["/api/studio-bookings"] });
            toast({ title: "Prenotazione aggiornata", description: "Le modifiche sono state salvate correttamente." });
            setEditingBooking(null);
            setConflictInfo(null);
        },
        onError: (err: any) => {
            if (err.status === 409) {
                setConflictInfo({ message: err.message, data: bookingForm, isUpdate: true });
            } else {
                toast({ title: "Errore", description: err.message, variant: "destructive" });
            }
        }
    });

    const deleteBookingMutation = useMutation({
        mutationFn: async (id: number) => {
            return await apiRequest("DELETE", `/api/studio-bookings/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/activities-unified-preview"] });
            queryClient.invalidateQueries({ queryKey: ["/api/studio-bookings"] });
            toast({ title: "Prenotazione eliminata", description: "La prenotazione è stata rimossa correttamente." });
            setEditingBooking(null);
        },
        onError: (err: Error) => {
            toast({ title: "Errore", description: err.message, variant: "destructive" });
        }
    });

    const handleCreateBooking = (dayId: string, studioId: number, hour: number) => {
        const timeStr = `${hour.toString().padStart(2, "0")}:00`;
        const endTimeStr = `${(hour + 1).toString().padStart(2, "0")}:00`;

        const newBooking: Partial<StudioBooking> = {
            studioId,
            bookingDate: new Date(), // This needs improvement to match dayId
            startTime: timeStr,
            endTime: endTimeStr,
            status: "confirmed",
            paid: false,
            amount: "0"
        };
        const dayIdx = WEEKDAYS.findIndex(d => d.id === dayId);
        if (dayIdx !== -1) {
            newBooking.bookingDate = addDays(currentWeekStart, dayIdx);
        }

        setEditingBooking(newBooking);
        setBookingForm(newBooking);
    };

    const handleEditBooking = (booking: any) => {
        setUnifiedFormType("booking");
        setEditingBooking(booking);
        setBookingForm({
            ...booking,
            bookingDate: new Date(booking.bookingDate)
        });
    };

    const handleEditWorkshop = (workshop: Workshop) => {
        setUnifiedFormType("workshop");
        setEditingWorkshop(workshop);
        setEditForm(workshop);
    };

    const handleSaveBooking = (e: React.FormEvent) => {
        e.preventDefault();

        // VALIDAZIONE CONFLITTO D'ORARIO BOOKING (FRONTEND SIDE)
        const checkBookingConflict = () => {
             const { studioId, bookingDate, startTime, endTime, id } = bookingForm as any;
             if (!studioId || !startTime || !endTime || !bookingDate) return false;

             const bDate = new Date(bookingDate);
             const bDateStr = bDate.toISOString().split('T')[0];
             const bDayId = getDayId(bDate);

             const newStart = timeToMinutes(startTime);
             const newEnd = timeToMinutes(endTime) || newStart + 60;

             for (const evt of unifiedEvents) {
                 // Skip sé stesso
                 if (evt.sourceId === id && evt.sourceType === "studioBookings") continue;
                 
                 if (evt.studioId !== studioId) continue;

                 let matchDay = false;
                 // Se l'evento a db è un corso, si applica in base al giorno della settimana.
                 // Se è un workshop o booking, verifichiamo la data per maggiore esattezza, 
                 // oppure il dayOfWeek fall-back mappato
                 if (evt.sourceType === "course") {
                     matchDay = evt.dayOfWeek === bDayId;
                 } else {
                     matchDay = Boolean((evt.startDate && evt.startDate.split('T')[0] === bDateStr) || evt.dayOfWeek === bDayId);
                 }

                 if (!matchDay) continue;

                 const oldStart = timeToMinutes(evt.startTime);
                 const oldEnd = timeToMinutes(evt.endTime) || oldStart + 60;

                 if (newStart < oldEnd && newEnd > oldStart) {
                     return { conflictedEvt: evt };
                 }
             }
             return false;
        };

        const conflict = checkBookingConflict();
        if (conflict) {
             setConflictEventId(conflict.conflictedEvt.id);
             toast({ 
                 title: "Conflitto d'Orario Rilevato", 
                 description: `La Sala selezionata è già occupata da "${conflict.conflictedEvt.title}" (dalle ${conflict.conflictedEvt.startTime} alle ${conflict.conflictedEvt.endTime}). Scegli un altro orario o un'altra sala.`, 
                 variant: "destructive" 
             });
             setTimeout(() => setConflictEventId(null), 8000);
             return;
        }

        if (editingBooking?.id) {
            updateBookingMutation.mutate({ id: editingBooking.id, data: bookingForm });
        } else {
            createBookingMutation.mutate(bookingForm);
        }
    };

    const handleForceSave = () => {
        if (!conflictInfo) return;
        const data = { ...conflictInfo.data, force: true };
        if (conflictInfo.isUpdate && editingBooking?.id) {
            updateBookingMutation.mutate({ id: editingBooking.id, data });
        } else {
            createBookingMutation.mutate(data);
        }
    };



    const isTodayInView = useMemo(() => {
        const today = new Date();
        return WEEKDAYS.some((_, idx) => isSameDay(addDays(currentWeekStart, idx), today));
    }, [currentWeekStart]);

    if (isLoading) {
        return (
            <div className="p-6 space-y-6">
                <Skeleton className="h-20 w-1/3" />
                <div className="grid grid-cols-4 gap-4">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                </div>
                <Skeleton className="h-[600px] w-full" />
            </div>
        );
    }



    return (
        <div className="p-6 pb-0 flex flex-col h-[calc(100vh)] md:h-[calc(100vh-2rem)] overflow-hidden">
            <div className="flex flex-col gap-4 mb-4 shrink-0 overflow-hidden">
                {/* --- RIGA 1: Titolo e Macro Selectors --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <CalendarIcon className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold truncate">Calendario Attività</h1>
                    </div>
                    
                    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-nowrap w-full md:w-auto md:justify-end pb-1 md:pb-0">
                        <div className="shrink-0">
                            <Select value={selectedSeasonId} onValueChange={handleSeasonChange}>
                                <SelectTrigger className="w-[180px] bg-transparent border-slate-300">
                                    <CalendarIcon className="w-4 h-4 mr-2 text-slate-500" />
                                    <SelectValue placeholder="Stagione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {seasons?.map((s: any, idx: number) => {
                                        const isActiveFallback = s.active || (!seasons.find((x: any) => x.active) && idx === 0);
                                        return (
                                            <SelectItem key={s.id} value={isActiveFallback ? "active" : s.id.toString()} className={isActiveFallback ? "font-semibold" : ""}>
                                                {getSeasonLabel(s, seasons)}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="shrink-0">
                            <Select value={selectedDay} onValueChange={setSelectedDay}>
                                <SelectTrigger className="w-[150px] bg-transparent border-slate-300">
                                    <CalendarIcon className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Giorno" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tutta la Sett.</SelectItem>
                                    {WEEKDAYS.map(d => (
                                        <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="shrink-0">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-[180px] justify-between font-normal bg-transparent border-slate-300">
                                        <div className="flex items-center truncate">
                                            <MapPin className="w-4 h-4 mr-2 shrink-0" />
                                            <span className="truncate">
                                                {selectedStudio === "all" ? "Tutti gli Studio" : sortedStudios.find(s => s.id.toString() === selectedStudio)?.name || "Studio"}
                                            </span>
                                        </div>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[180px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Cerca studio..." />
                                        <CommandList>
                                            <CommandEmpty>Nessun risultato.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem onSelect={() => setSelectedStudio("all")} className="flex items-center justify-between">
                                                    Tutti gli Studio
                                                    {selectedStudio === "all" && <Check className="w-4 h-4" />}
                                                </CommandItem>
                                                {sortedStudios.map(s => (
                                                    <CommandItem key={s.id} onSelect={() => setSelectedStudio(s.id.toString())} className="flex items-center justify-between">
                                                        <span className="truncate">{s.name}</span>
                                                        {selectedStudio === s.id.toString() && <Check className="w-4 h-4" />}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="shrink-0">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-[180px] justify-between font-normal bg-transparent border-slate-300">
                                        <div className="flex items-center truncate">
                                            <User className="w-4 h-4 mr-2 shrink-0" />
                                            <span className="truncate">
                                                {selectedInstructor === "all" ? "Tutti gli Insegnanti" : (() => {
                                                    const i = sortedInstructors.find(i => i.id.toString() === selectedInstructor);
                                                    return i ? `${i.lastName} ${i.firstName}` : "Insegnante";
                                                })()}
                                            </span>
                                        </div>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[180px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Cerca insegnante..." />
                                        <CommandList>
                                            <CommandEmpty>Nessun risultato.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem onSelect={() => setSelectedInstructor("all")} className="flex items-center justify-between">
                                                    Tutti gli Insegnanti
                                                    {selectedInstructor === "all" && <Check className="w-4 h-4" />}
                                                </CommandItem>
                                                {sortedInstructors.map(i => (
                                                    <CommandItem key={i.id} onSelect={() => setSelectedInstructor(i.id.toString())} className="flex items-center justify-between">
                                                        <span className="truncate">{i.lastName} {i.firstName}</span>
                                                        {selectedInstructor === i.id.toString() && <Check className="w-4 h-4" />}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="shrink-0">
                            <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                                <SelectTrigger className="w-[160px] h-10 border-slate-300">
                                    <SelectValue placeholder="Tutte le Attività" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tutte le Attività</SelectItem>
                                    {getActiveActivities().filter(a => ['corsi', 'workshop', 'lezioni-individuali', 'domeniche-movimento', 'allenamenti', 'affitti', 'campus'].includes(a.id)).map(act => (
                                        <SelectItem key={act.id} value={act.id}>{act.labelUI}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="shrink-0 hidden md:block">
                            <ActivityColorLegend variant="popover" />
                        </div>
                    </div>
                </div>

                {/* --- RIGA 2: Timeline Navigation e Micro Filtri/Ricerca --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-nowrap shrink-0">
                        {selectedDay === "all" ? (
                            isTodayInView && (
                                <div className="hidden md:inline-flex items-center px-3 h-10 bg-yellow-100/80 border border-yellow-300 text-yellow-800 text-sm font-bold rounded-md shadow-sm shrink-0 whitespace-nowrap">
                                    Oggi: {format(new Date(), "EEEE d MMMM", { locale: it })}
                                </div>
                            )
                        ) : (() => {
                            const dayIdx = WEEKDAYS.findIndex(d => d.id === selectedDay);
                            const refDate = addDays(currentWeekStart, dayIdx);
                            const today = new Date();
                            const isCurrentDay = isSameDay(refDate, today);
                            const isFutureDay = isAfter(startOfDay(refDate), startOfDay(today));
                            let boxClass = "hidden md:inline-flex items-center px-3 h-10 text-sm font-bold rounded-md shadow-sm border shrink-0 whitespace-nowrap";
                            if (isCurrentDay) boxClass += " bg-yellow-100/80 border-yellow-300 text-yellow-800";
                            else if (isFutureDay) boxClass += " bg-blue-100/80 border-blue-300 text-blue-800";
                            else boxClass += " bg-slate-100/80 border-slate-300 text-slate-600";
                            return (
                                <div className={boxClass}>
                                    {isCurrentDay ? "Oggi: " : ""}{format(refDate, "EEEE d MMMM", { locale: it })}
                                </div>
                            );
                        })()}

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 bg-slate-900 border-slate-900 text-slate-100 hover:bg-slate-800 hover:text-white" title="Calendario Mensile">
                                    <CalendarIcon className="w-5 h-5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={viewDate}
                                    onSelect={(d: Date | undefined) => {
                                        if (d) {
                                            setViewDate(d);
                                            const idx = d.getDay();
                                            const daysStr = ["DOM", "LUN", "MAR", "MER", "GIO", "VEN", "SAB"];
                                            setSelectedDay(daysStr[idx]);
                                        }
                                    }}
                                    defaultMonth={viewDate}
                                    initialFocus
                                    locale={it}
                                />
                            </PopoverContent>
                        </Popover>

                        <div className="flex items-center bg-white border border-slate-300 rounded-md shadow-sm h-10 shrink-0">
                            <Button variant="ghost" size="icon" className="h-full w-9 shrink-0" onClick={prevWeek}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-semibold min-w-[170px] text-center px-2">
                                {format(currentWeekStart, "dd MMM", { locale: it })} - {format(currentWeekEnd, "dd MMM yyyy", { locale: it })}
                            </span>
                            <Button variant="ghost" size="icon" className="h-full w-9 shrink-0" onClick={nextWeek}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <Button variant="outline" size="sm" className="h-10 px-4 font-semibold shrink-0 bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 shadow-sm" onClick={resetToToday}>
                            Oggi
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-nowrap w-full md:w-auto md:justify-end pb-1 md:pb-0">
                        <div className="shrink-0">
                            <CourseDuplicationWizard currentSeasonId={selectedSeasonId} />
                        </div>

                        <div className="shrink-0">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-[180px] h-10 justify-between font-normal bg-transparent border-slate-300">
                                        <div className="flex items-center truncate">
                                            <Filter className="w-4 h-4 mr-2 shrink-0" />
                                            <span className="truncate">
                                                {selectedCategory === "all" ? "Tutte le Categorie" : sortedCategories.find(c => c.id.toString() === selectedCategory)?.name || "Categoria"}
                                            </span>
                                        </div>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[180px] p-0" align="end">
                                    <Command>
                                        <CommandInput placeholder="Cerca categoria..." />
                                        <CommandList>
                                            <CommandEmpty>Nessun risultato.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem onSelect={() => setSelectedCategory("all")} className="flex items-center justify-between">
                                                    Tutte le Categorie
                                                    {selectedCategory === "all" && <Check className="w-4 h-4" />}
                                                </CommandItem>
                                                {sortedCategories.map(c => (
                                                    <CommandItem key={c.id} onSelect={() => setSelectedCategory(c.id.toString())} className="flex items-center justify-between">
                                                        <span className="truncate">{c.name}</span>
                                                        {selectedCategory === c.id.toString() && <Check className="w-4 h-4" />}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="w-[200px] shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cerca..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-9 h-10 bg-transparent border-slate-300"
                                />
                            </div>
                        </div>

                        {(selectedStudio !== "all" || selectedInstructor !== "all" || selectedCategory !== "all" || selectedDay !== "all" || searchQuery !== "") && (
                            <Button variant="ghost" size="icon" onClick={resetFilters} title="Resetta filtri" className="shrink-0 h-10 w-10 bg-slate-100 hover:bg-slate-200">
                                <RefreshCw className="w-4 h-4 text-slate-600" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <Card className="border-none shadow-xl bg-card overflow-hidden flex-1 flex flex-col min-h-0">
                <CardContent ref={scrollContainerRef} className="p-0 overflow-auto flex-1 relative scroll-smooth border-t">
                    <div className="min-w-full w-fit flex flex-col relative min-h-full">
                        {/* Header: Ore | (Days or Studios) */}
                        <div className="sticky top-0 z-40 bg-white shadow-sm">
                            <div className={`grid border-b bg-[#f8f9fa]`}
                                style={{
                                    gridTemplateColumns: selectedDay === 'all'
                                        ? `80px repeat(7, minmax(120px, 1fr))`
                                        : `80px repeat(${studios?.length || 1}, minmax(140px, 1fr))`
                                }}>
                                <div className="p-3 border-r flex items-center justify-center font-bold text-[11px] text-[#444] uppercase bg-white sticky left-0 z-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                    ore
                                </div>
                                {selectedDay === 'all' ? (
                                    WEEKDAYS.map((day, idx) => {
                                        const dayDate = addDays(currentWeekStart, idx);
                                        const overlappingEvents = strategicEventsData?.filter(e => {
                                            const sDate = new Date(e.startDate);
                                            sDate.setHours(0,0,0,0);
                                            const eDate = e.endDate ? new Date(e.endDate) : new Date(e.startDate);
                                            eDate.setHours(23,59,59,999);
                                            return dayDate >= sDate && dayDate <= eDate;
                                        });

                                        const isToday = isSameDay(dayDate, new Date());
                                        const rowBg = isToday ? "bg-yellow-50/50" : "bg-white";

                                        return (
                                            <div key={day.id} className={`text-center border-r last:border-r-0 font-bold text-[12px] uppercase tracking-tight text-[#333] ${rowBg} min-w-[120px] flex flex-col items-center justify-start relative`}>
                                                {/* Testata Data Base */}
                                                <div className={`p-3 pb-1 flex flex-col items-center w-full ${isToday ? 'border-b-[3px] border-yellow-400 text-yellow-900' : ''}`}>
                                                    <span>{day.label} {format(dayDate, "d")}</span>
                                                    <span className="text-[10px] font-normal text-muted-foreground">{format(dayDate, "MMMM", { locale: it })}</span>
                                                    {isToday && <span className="absolute top-1.5 right-1.5 text-[7.5px] bg-yellow-400 text-yellow-900 px-[4px] py-[2px] rounded-sm font-black uppercase tracking-wider shadow-sm border border-yellow-500/30">Oggi</span>}
                                                </div>
                                                
                                                {/* Banner Eventi Strategici (Chiusure/Ferie/Macro) */}
                                                <div className="w-full flex-grow flex flex-col gap-[1px] px-[2px] pb-[4px]">
                                                {overlappingEvents && overlappingEvents.map(evt => {
                                                    let bgColor = 'bg-slate-200 text-slate-800';
                                                    if (evt.eventType === 'chiusura') bgColor = 'bg-red-500 text-white';
                                                    if (evt.eventType === 'ferie') bgColor = 'bg-purple-500 text-white';
                                                    if (evt.eventType === 'apertura_eccezionale') bgColor = 'bg-emerald-500 text-white';
                                                    if (evt.eventType === 'evento_macro') bgColor = 'bg-blue-500 text-white';
                                                    if (evt.eventType === 'nota') bgColor = 'bg-yellow-100 border border-yellow-400 text-yellow-900';
                                                    
                                                    return (
                                                        <div key={evt.id} className={`w-full text-[9px] py-[2px] px-1 font-bold truncate rounded-[3px] leading-tight ${bgColor}`} title={evt.title}>
                                                            {evt.title}
                                                        </div>
                                                    );
                                                })}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    studios?.map(studio => (
                                        <div key={studio.id} className="p-3 text-center border-r last:border-r-0 font-bold text-[11px] uppercase tracking-tight text-[#333] flex flex-col items-center justify-center min-w-[140px] bg-white">
                                            <span>{studio.name}</span>
                                            {studio.capacity && <span className="text-[9px] font-normal text-muted-foreground opacity-70">({studio.capacity}mq)</span>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Calendar Body (PHASE 19 - Elastic Time Space) */}
                        <div className="relative grid bg-white"
                            style={{
                                gridTemplateColumns: selectedDay === 'all'
                                    ? `80px repeat(7, minmax(120px, 1fr))`
                                    : `80px repeat(${studios?.length || 1}, minmax(140px, 1fr))`,
                                height: `${calendarLayout.cumulativeTops[TOTAL_MINUTES]}px`
                            }}>
                            {/* Hour Labels */}
                            <div className="border-r bg-[#f8f9fa] relative z-30 sticky left-0 shadow-[2px_0_5px_rgba(0,0,0,0.05)] h-full">
                                {HOURS.map((hour, idx) => {
                                    const minOffset = idx * 60;
                                    const nextMinOffset = (idx + 1) * 60;
                                    const topPx = calendarLayout.cumulativeTops[minOffset];
                                    const heightPx = calendarLayout.cumulativeTops[nextMinOffset] - topPx;
                                    return (
                                        <div key={hour}
                                            className="border-b border-[#eee] flex flex-col items-center justify-start text-[11px] font-bold text-[#666] bg-[#f8f9fa] absolute w-full left-0 right-0 overflow-hidden"
                                            style={{ top: `${topPx}px`, height: `${heightPx}px` }}>
                                            <span className="pt-2">{hour.toString().padStart(2, "0")}.00</span>
                                            {heightPx > 60 && <span className="absolute top-1/2 -translate-y-1/2 opacity-50 font-normal text-[9px]">{hour.toString().padStart(2, "0")}.30</span>}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Grid Lines Overlay */}
                            <div className="absolute left-[80px] right-0 inset-y-0 grid overflow-hidden"
                                style={{
                                    gridTemplateColumns: selectedDay === 'all'
                                        ? `repeat(7, minmax(120px, 1fr))`
                                        : `repeat(${studios?.length || 1}, minmax(140px, 1fr))`
                                }}>
                                {calendarLayout.columns.map((col, colIdx) => (
                                    <div key={col.id} className="relative h-full border-r last:border-r-0 border-[#eee]">
                                        {HOURS.map((hour, idx) => {
                                            const minOffset = idx * 60;
                                            const nextMinOffset = (idx + 1) * 60;
                                            const topPx = calendarLayout.cumulativeTops[minOffset];
                                            const heightPx = calendarLayout.cumulativeTops[nextMinOffset] - topPx;
                                            return (
                                                <div key={hour}
                                                    className="absolute left-0 right-0 border-b border-[#eee] hover:bg-slate-50 cursor-crosshair transition-colors"
                                                    style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                                                    onClick={() => {
                                                        const dayId = col.type === 'day' ? col.id : selectedDay;
                                                        const dateStr = weekDatesMap[dayId];
                                                        const date = dateStr ? new Date(dateStr) : undefined;
                                                        setSelectionContext({ 
                                                            dayId,
                                                            date,
                                                            studioId: col.type === 'studio' ? parseInt(col.id, 10) : null, 
                                                            hour 
                                                        });
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>

                            {/* Content Columns (Events) */}
                            {calendarLayout.columns.map(col => {
                                const layoutEvents = calendarLayout.columnEvents[col.id];
                                return (
                                    <div key={col.id} className="relative pointer-events-none min-w-[120px] isolate h-full">
                                        {layoutEvents.map(evt => {
                                            const { layoutLeft, layoutWidth, durationPx, startPx } = evt;
                                            
                                            // Real calculation with Space-Time distortion mapping
                                            const startMin = Math.floor(startPx / PX_PER_MIN);
                                            const durationMin = Math.floor(durationPx / PX_PER_MIN) || 1;
                                            const endMin = Math.min(startMin + durationMin, TOTAL_MINUTES);
                                            
                                            const realTop = calendarLayout.cumulativeTops[startMin];
                                            const realHeight = calendarLayout.cumulativeTops[endMin] - realTop;

                                            const handleEdit = (e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                if (evt.sourceType === "course" || evt.sourceType === "courses") handleEditCourse(evt.rawPayload);
                                                if (evt.sourceType === "workshop" || evt.sourceType === "workshops") handleEditWorkshop(evt.rawPayload);
                                                if (evt.sourceType === "studioBookings" || evt.sourceType === "rentals") handleEditBooking(evt.rawPayload);
                                            };

                                            const handleCardClick = () => {
                                                 if (evt.registryKey === "courses") setLocation(`/scheda-corso?courseId=${evt.sourceId}`);
                                                 if (evt.registryKey === "workshops") setLocation(`/scheda-workshop?workshopId=${evt.sourceId}`);
                                                 if (evt.registryKey === "lezione_individuale") setLocation(`/scheda-lezione-individuale?activityId=${evt.sourceId}`);
                                                 if (evt.registryKey === "domenica" || evt.registryKey === "sunday_activities") setLocation(`/scheda-domenica?activityId=${evt.sourceId}`);
                                                 if (evt.registryKey === "allenamento") setLocation(`/scheda-allenamento?activityId=${evt.sourceId}`);
                                                 if (evt.registryKey === "campus") setLocation(`/scheda-campus?activityId=${evt.sourceId}`);
                                                 if (evt.registryKey === "studioBookings" || evt.registryKey === "rentals") setLocation(`/prenotazioni-sale?edit=${evt.sourceId}`);
                                            };

                                            const stats = (evt.sourceType === "course" || evt.sourceType === "courses") ? getCourseStats(evt.sourceId) :
                                                          ((evt.sourceType === "workshop" || evt.sourceType === "workshops") ? getWorkshopStats(evt.sourceId) : null);
                                            
                                            const maxCap = evt.rawPayload?.maxCapacity;
                                            const availability = (maxCap && stats) ? Math.max(0, maxCap - stats.total) : null;

                                            const codeLabel = evt.rawPayload?.sku || (evt.registryKey === "courses" ? `CRS-${evt.sourceId}` : "");
                                            const parsedTags = parseStatusTags(evt.rawPayload?.statusTags);
                                            let statusLabels: string[] = [];
                                            if (parsedTags && parsedTags.length > 0) {
                                                statusLabels = parsedTags
                                                    .filter((t: string) => t.startsWith("STATE:"))
                                                    .map((t: string) => t.replace("STATE:", ""));
                                            }
                                            if (statusLabels.length === 0) {
                                                statusLabels = parseStatusTags(evt.rawPayload?.statusTags);
                                            }
                                            const ins1 = evt.instructorName || (evt.registryKey === "studioBookings" && evt.rawPayload?.title ? evt.rawPayload.title : "");
                                            const ins2Item = instructors?.find((i: any) => i.id === evt.rawPayload?.secondaryInstructor1Id);
                                            const ins2 = ins2Item ? `${ins2Item.lastName} ${ins2Item.firstName}` : "";

                                            const activityBadge = ({
                                              course: "CRS",
                                              allenamenti: "ALL",
                                              prenotazioni: "IND", 
                                              workshop: "WS",
                                              domeniche: "DOM",
                                              saggi: "SAG",
                                              vacanze: "VAC",
                                              campus: "CAM",
                                              affitti: "AFT",
                                            } as Record<string, string>)[(evt as any).activityType || (evt.rawPayload as any)?.activityType || "course"] ?? "CRS";

                                            return (
                                                <div
                                                    key={evt.eventId}
                                                    onClick={handleCardClick}
                                                    className={`absolute p-[4px] pointer-events-auto cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 hover:shadow-xl z-20 hover:z-50 overflow-hidden ${conflictEventId === evt.id ? 'ring-4 ring-red-500 animate-pulse z-[100]' : ''} ${evt.hasTimeOverlap ? '!border-red-600 !bg-red-50 ring-2 ring-red-500 animate-pulse z-[90]' : ''}`}
                                                    style={{
                                                        top: `${realTop + 2}px`,
                                                        minHeight: `${Math.max(realHeight - 4, 55)}px`,  // Elastic minimum height for short events
                                                        left: `calc(${layoutLeft}% + 2px)`,
                                                        width: `calc(${layoutWidth}% - 4px)`,
                                                        minWidth: "70px"
                                                    }}
                                                >
                                                    <div
                                                        ref={handleCardRef} 
                                                        data-event-id={evt.eventId}
                                                        className={`w-full min-h-full h-auto p-1.5 rounded-md border-l-[6px] shadow-sm flex flex-col justify-start items-start text-left bg-white overflow-hidden ${evt.colorProps.className || ''}`}
                                                        style={{
                                                            fontSize: "10px",
                                                            backgroundColor: evt.colorProps.backgroundColor,
                                                            borderLeftColor: evt.colorProps.borderLeftColor,
                                                            color: "#0f172a"
                                                        }}
                                                    >
                                                        <div className="absolute top-2 right-2 flex flex-col items-end gap-0.5 z-30">
                                                            <div className={`bg-white/60 px-1 py-0.5 rounded text-[8px] font-bold flex items-center gap-0.5 uppercase max-w-[65px] truncate ${evt.registryKey === 'workshops' ? 'text-indigo-800' : evt.registryKey === 'courses' ? 'text-blue-800' : 'text-slate-800'}`} title={evt.categoryName || "CAT"}>
                                                                {evt.registryKey === "workshops" ? <Sparkles className="w-2.5 h-2.5" /> : evt.registryKey === "courses" ? <CalendarIcon className="w-2.5 h-2.5" /> : <MapPin className="w-2.5 h-2.5" />}
                                                                {evt.categoryName || activityBadge}
                                                            </div>
                                                            <div className={`bg-white/80 px-1 py-0.5 rounded text-[8px] font-bold flex items-center gap-0.5 uppercase shadow-sm border border-black/5 ${evt.registryKey === 'workshops' ? 'text-indigo-800' : evt.registryKey === 'courses' ? 'text-blue-800' : 'text-slate-800'}`}>
                                                                {evt.registryKey === "workshops" ? <Sparkles className="w-2.5 h-2.5" /> : evt.registryKey === "courses" ? <CalendarIcon className="w-2.5 h-2.5" /> : <MapPin className="w-2.5 h-2.5" />}
                                                                {activityBadge}
                                                            </div>
                                                        </div>
                                                        <div className="font-bold text-[10px] mb-0.5 opacity-90 w-[calc(100%-40px)]">{evt.startTime} - {evt.endTime}</div>
                                                        <div className="font-extrabold text-[12px] leading-tight line-clamp-2 w-full uppercase pr-[30px] break-normal overflow-hidden">{evt.title}</div>
                                                        {ins1 && <div className="font-semibold text-[10px] truncate w-full opacity-90 mt-0.5">{ins1}</div>}
                                                        {ins2 && <div className="font-semibold text-[10px] truncate w-full opacity-90">{ins2}</div>}
                                                        
                                                        <div className="mt-auto w-full flex flex-col items-start gap-0.5 pt-1 shrink-0 z-10 w-full relative">
                                                            {evt.registryKey === "studioBookings" && (
                                                                <div className="bg-black/5 px-2 py-0.5 rounded-full text-[9px] font-bold text-black/60 mb-1 w-fit">
                                                                    {evt.startTime}-{evt.endTime}
                                                                </div>
                                                            )}
                                                            
                                                            {stats && (
                                                                <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold w-full bg-white/50 px-1.5 py-0.5 rounded border border-black/5 mt-0.5">
                                                                    <span className="text-blue-700 whitespace-nowrap">U:{stats.men}</span>
                                                                    <span className="text-pink-700 whitespace-nowrap">D:{stats.women}</span>
                                                                    {availability !== null && (
                                                                        <span className={cn("ml-auto whitespace-nowrap", availability <= 2 ? "text-red-700 font-extrabold" : "text-emerald-700")}>Disp:{availability}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            
                                                            <div className="flex w-full items-center justify-between mt-1 gap-1">
                                                                <div className="flex flex-wrap gap-1" title={statusLabels.join(", ")}>
                                                                    {statusLabels.map(s => {
                                                                        const color = getStatusColor(s, activityStatuses);
                                                                        return (
                                                                            <div key={s} className="text-[8px] font-bold uppercase tracking-wider leading-none truncate px-1 py-[1.5px] rounded-[2px]" style={color ? { backgroundColor: `${color}15`, color, border: `0.5px solid ${color}40` } : { color: s === "ATTIVO" ? "#15803d" : "#b91c1c" }}>
                                                                                {s}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                                <button onClick={(e) => { e.stopPropagation(); handleEdit(e as any); }} className="bg-white/60 p-0.5 px-1 rounded hover:bg-white text-slate-800 transition-colors shadow-sm shrink-0 border border-black/5" title="Modifica rapida">
                                                                    <Edit2 className="w-2.5 h-2.5" />
                                                                </button>
                                                            </div>
                                                            
                                                            {codeLabel && (
                                                                <div className="bg-slate-100 text-[8px] font-bold px-1.5 py-0.5 rounded text-slate-600 break-all leading-tight w-full">
                                                                    {codeLabel}
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {evt.registryKey === "studioBookings" && evt.rawPayload?.amount && (
                                                            <span className="text-[10px] font-bold absolute top-1 right-[75px] bg-white/90 px-1.5 py-0.5 rounded shadow-sm text-slate-800 border-black/5 border z-40">
                                                                €{Number(evt.rawPayload.amount).toFixed(2)}
                                                            </span>
                                                        )}
                                                        {evt.registryKey === "studioBookings" && evt.rawPayload?.paid && (
                                                            <div className="absolute top-1 right-[60px] bg-green-500 rounded-full p-0.5 text-white shadow-sm z-40">
                                                                <Check className="w-3 h-3" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                </CardContent>
            </Card>

            {/* Bottom Sticky Day Selector - Outside scroll container for best visibility like Planning's Legend */}
            <div className="bg-[#f8f9fa] border-t px-6 py-2 flex items-center justify-start gap-1 z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] shrink-0 mx-[-1.5rem] overflow-x-auto hide-scrollbar flex-nowrap">
                <Button
                    variant={selectedDay === "all" ? "default" : "ghost"}
                    size="sm"
                    className="h-10 text-xs font-bold uppercase rounded-md px-4 shrink-0"
                    onClick={() => setSelectedDay("all")}
                >
                    <Users className="w-4 h-4 mr-2" />
                    Settimana
                </Button>
                <div className="h-6 w-[1px] bg-slate-300 mx-2 shrink-0" />
                {WEEKDAYS.map(day => (
                    <Button
                        key={day.id}
                        variant={selectedDay === day.id ? "default" : "ghost"}
                        size="sm"
                        className={`h-10 text-xs font-bold uppercase rounded-md px-4 shrink-0 ${selectedDay === day.id ? 'bg-primary text-white' : 'hover:bg-primary/10 text-[#555]'}`}
                        onClick={() => setSelectedDay(day.id)}
                    >
                        {day.label}
                    </Button>
                ))}
            </div>

            
            <CourseUnifiedModal 
              activityType={unifiedFormType as any}
              isOpen={!!editingCourse} 
              onOpenChange={(open) => { 
                if (!open) {
                  setEditingCourse(null); 
                  setEditForm({});
                  setSelectedEventType("all");
                  queryClient.invalidateQueries({ queryKey: ["/api/activities-unified-preview"] });
                }
              }}
              course={editForm?.id ? (editForm as any) : null} 
              defaultValues={!editForm?.id ? editForm : undefined}
              onDelete={(id) => {
                 if (typeof deleteCourseMutation !== 'undefined') {
                    deleteCourseMutation.mutate(id);
                 }
              }}
              onSuccess={() => {
                setEditingCourse(null);
                setEditForm({});
              }}
            />

            <Dialog open={!!editingBooking} onOpenChange={(open) => !open && setEditingBooking(null)}>
                <DialogContent className="max-w-xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{bookingForm.id ? "Modifica Prenotazione" : "Nuova Prenotazione"}</DialogTitle>
                        <DialogDescription>
                            Inserisci i dettagli per la prenotazione della sala.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveBooking} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Servizio *</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-[11px] gap-1 text-[#f43f5e] hover:bg-[#f43f5e]/10"
                                    onClick={() => setQuickAddServiceOpen(true)}
                                >
                                    <Plus className="w-3.5 h-3.5" /> Nuovo Servizio
                                </Button>
                            </div>
                            <Popover open={serviceSearchOpen} onOpenChange={setServiceSearchOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal text-left h-auto py-2">
                                        <div className="flex flex-col items-start overflow-hidden">
                                            {bookingForm.serviceId
                                                ? <span className="font-medium">{bookingServices?.find(s => s.id === bookingForm.serviceId)?.name}</span>
                                                : <span className="text-muted-foreground">{bookingForm.title || "Seleziona o scrivi servizio..."}</span>
                                            }
                                        </div>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                    <Command>
                                        <CommandInput
                                            placeholder="Cerca o scrivi nuovo servizio..."
                                        />
                                        <CommandList>
                                            <CommandEmpty className="p-2 space-y-2">
                                                <p className="text-xs text-muted-foreground px-2">Nessun servizio trovato.</p>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="w-full justify-start gap-2 h-10"
                                                    onClick={() => {
                                                        const typedValue = (document.querySelector('[cmdk-input]') as HTMLInputElement)?.value;
                                                        if (typedValue) {
                                                            setBookingForm((prev: any) => ({ ...prev, serviceId: undefined, title: typedValue }));
                                                            setServiceSearchOpen(false);
                                                        }
                                                    }}
                                                >
                                                    <Plus className="w-4 h-4" /> Usa come testo libero: "{(document.querySelector('[cmdk-input]') as HTMLInputElement)?.value}"
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full justify-start gap-2 h-10"
                                                    onClick={() => {
                                                        const typedValue = (document.querySelector('[cmdk-input]') as HTMLInputElement)?.value;
                                                        setNewServiceForm(p => ({ ...p, name: typedValue || "" }));
                                                        setQuickAddServiceOpen(true);
                                                    }}
                                                >
                                                    <Plus className="w-4 h-4" /> Crea come servizio salvato
                                                </Button>
                                            </CommandEmpty>
                                            <CommandGroup heading="Servizi Esistenti">
                                                {bookingServices?.map(s => (
                                                    <CommandItem
                                                        key={s.id}
                                                        value={s.name}
                                                        onSelect={() => {
                                                            setBookingForm((prev: any) => ({
                                                                ...prev,
                                                                serviceId: s.id,
                                                                title: s.name,
                                                                amount: s.price?.toString() || "0"
                                                            }));
                                                            setServiceSearchOpen(false);
                                                        }}
                                                    >
                                                        <Check className={`mr-2 h-4 w-4 ${bookingForm.serviceId === s.id ? "opacity-100" : "opacity-0"}`} />
                                                        <div className="flex flex-col">
                                                            <span>{s.name}</span>
                                                            <span className="text-[10px] text-muted-foreground">€ {s.price}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="booking-title">Titolo/Note Brevi</Label>
                            <Input
                                id="booking-title"
                                value={bookingForm.title || ""}
                                onChange={e => setBookingForm((prev: any) => ({ ...prev, title: e.target.value }))}
                                placeholder="es. Affitto privato"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Importo (€) *</Label>
                                <Input
                                    id="amount"
                                    name="amount"
                                    type="number"
                                    step="0.50"
                                    value={bookingForm.amount?.toString() || "0"}
                                    onChange={(e) => setBookingForm((prev: any) => ({ ...prev, amount: e.target.value }))}
                                    placeholder="0"
                                    className="font-bold text-lg"
                                />
                            </div>
                            <div className="flex items-center space-x-2 pb-3">
                                <Checkbox
                                    id="paid"
                                    checked={!!bookingForm.paid}
                                    onCheckedChange={(checked) => setBookingForm((prev: any) => ({ ...prev, paid: !!checked }))}
                                />
                                <Label htmlFor="paid" className="text-sm font-medium leading-none cursor-pointer">
                                    Registra pagamento subito
                                </Label>
                            </div>
                        </div>

                        {bookingForm.paid && (
                            <div className="space-y-4 pl-6 border-l-2 border-[#f43f5e]/20 ml-2 animate-in fade-in slide-in-from-left-2">
                                <div className="space-y-2">
                                    <Label>Importo Pagato (€) *</Label>
                                    <Input
                                        type="number"
                                        step="0.50"
                                        value={bookingForm.paidAmount || bookingForm.amount?.toString() || "0"}
                                        onChange={(e) => setBookingForm((prev: any) => ({ ...prev, paidAmount: e.target.value }))}
                                        className="font-semibold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Metodo di Pagamento</Label>
                                    <Select
                                        value={bookingForm.paymentMethodId?.toString()}
                                        onValueChange={(val) => setBookingForm((prev: any) => ({ ...prev, paymentMethodId: parseInt(val) }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleziona metodo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {paymentMethods?.map(pm => (
                                                <SelectItem key={pm.id} value={pm.id.toString()}>{pm.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Partecipante *</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-[11px] gap-1 text-[#f43f5e] hover:bg-[#f43f5e]/10"
                                    onClick={() => setQuickAddMemberOpen(true)}
                                >
                                    <UserPlus className="w-3.5 h-3.5" /> Nuovo Partecipante
                                </Button>
                            </div>
                            <Popover open={memberSearchOpen} onOpenChange={setMemberSearchOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal text-left h-auto py-2">
                                        <div className="flex flex-col items-start overflow-hidden">
                                            {bookingForm.memberId
                                                ? <span className="font-medium">
                                                    {(bookingForm.memberFirstName && bookingForm.memberLastName)
                                                        ? `${bookingForm.memberFirstName} ${bookingForm.memberLastName}`
                                                        : (members?.find((m: Member) => m.id === bookingForm.memberId)
                                                            ? (() => {
                                                                const m = members.find((m: Member) => m.id === bookingForm.memberId)!;
                                                                return `${m.lastName} ${m.firstName}`;
                                                            })()
                                                            : (lastAddedMember && lastAddedMember.id === bookingForm.memberId
                                                                ? `${lastAddedMember.lastName} ${lastAddedMember.firstName}`
                                                                : "Caricamento nome..."))
                                                    }
                                                </span>
                                                : <span className="text-muted-foreground">Seleziona cliente...</span>
                                            }
                                        </div>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Cerca partecipante..."
                                            value={searchBookingMemberQuery}
                                            onValueChange={setSearchBookingMemberQuery}
                                        />
                                        <CommandList>
                                            {searchBookingMemberQuery.length < 2 && !lastAddedMember && (
                                                <CommandEmpty>Digita almeno 2 caratteri...</CommandEmpty>
                                            )}
                                            {searchBookingMemberQuery.length >= 2 && !bookingSearchData?.members?.length && !lastAddedMember && (
                                                <CommandEmpty className="p-2 text-center">
                                                    <p className="text-xs text-muted-foreground mb-2">Nessun partecipante trovato.</p>
                                                    <Button variant="outline" size="sm" className="w-full" onClick={() => setQuickAddMemberOpen(true)}>
                                                        <Plus className="w-4 h-4 mr-2" /> Crea Nuovo Partecipante
                                                    </Button>
                                                </CommandEmpty>
                                            )}
                                            <CommandGroup heading="Partecipanti">
                                                {lastAddedMember && (
                                                    <CommandItem
                                                        value={`${lastAddedMember.lastName} ${lastAddedMember.firstName}`}
                                                        onSelect={() => {
                                                            setBookingForm((prev: any) => ({
                                                                ...prev,
                                                                memberId: lastAddedMember.id,
                                                                memberFirstName: lastAddedMember.firstName,
                                                                memberLastName: lastAddedMember.lastName,
                                                                memberEmail: lastAddedMember.email,
                                                                memberPhone: lastAddedMember.phone || lastAddedMember.mobile
                                                            }));
                                                            setMemberSearchOpen(false);
                                                        }}
                                                    >
                                                        <Check className={`mr-2 h-4 w-4 ${bookingForm.memberId === lastAddedMember.id ? "opacity-100" : "opacity-0"}`} />
                                                        <div className="flex flex-col">
                                                            <span className="font-bold">✨ {lastAddedMember.lastName} {lastAddedMember.firstName}</span>
                                                            <span className="text-[10px] text-muted-foreground">{lastAddedMember.fiscalCode}</span>
                                                        </div>
                                                    </CommandItem>
                                                )}
                                                {bookingSearchData?.members?.map((m: Member) => (
                                                    <CommandItem
                                                        key={m.id}
                                                        value={`${m.lastName} ${m.firstName}`}
                                                        onSelect={() => {
                                                            setBookingForm((prev: any) => ({
                                                                ...prev,
                                                                memberId: m.id,
                                                                memberFirstName: m.firstName,
                                                                memberLastName: m.lastName,
                                                                memberEmail: m.email,
                                                                memberPhone: m.phone || m.mobile
                                                            }));
                                                            setMemberSearchOpen(false);
                                                        }}
                                                    >
                                                        <Check className={`mr-2 h-4 w-4 ${bookingForm.memberId === m.id ? "opacity-100" : "opacity-0"}`} />
                                                        <div className="flex flex-col">
                                                            <span>{m.lastName} {m.firstName}</span>
                                                            <span className="text-[10px] text-muted-foreground">{m.fiscalCode}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {bookingForm.memberId && (
                                <div className="mt-2 text-[11px] bg-slate-50 p-2 rounded-md border border-slate-200 flex flex-col gap-1 animate-in fade-in slide-in-from-top-1">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Mail className="w-3 h-3" />
                                        <span>{bookingForm.memberEmail || "Email non presente"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Phone className="w-3 h-3" />
                                        <span>{bookingForm.memberPhone || bookingForm.memberMobile || "Telefono non presente"}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Insegnante</Label>
                            <Popover open={instructorSearchOpen} onOpenChange={setInstructorSearchOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal text-left h-auto py-2">
                                        <div className="flex items-center truncate">
                                            <User className="w-4 h-4 mr-2 shrink-0 opacity-50" />
                                            {bookingForm.instructorId
                                                ? <span className="font-medium">{(() => {
                                                    const i = instructors?.find(i => i.id === bookingForm.instructorId);
                                                    return i ? `${i.lastName} ${i.firstName}` : "Insegnante";
                                                })()}</span>
                                                : <span className="text-muted-foreground">Seleziona insegnante...</span>
                                            }
                                        </div>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Cerca insegnante..." />
                                        <CommandList>
                                            <CommandEmpty>Nessun insegnante trovato.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    onSelect={() => {
                                                        setBookingForm((prev: any) => ({ ...prev, instructorId: null }));
                                                        setInstructorSearchOpen(false);
                                                    }}
                                                >
                                                    <Check className={`mr-2 h-4 w-4 ${!bookingForm.instructorId ? "opacity-100" : "opacity-0"}`} />
                                                    Nessuno
                                                </CommandItem>
                                                {sortedInstructors.map(i => (
                                                    <CommandItem
                                                        key={i.id}
                                                        onSelect={() => {
                                                            setBookingForm((prev: any) => ({ ...prev, instructorId: i.id }));
                                                            setInstructorSearchOpen(false);
                                                        }}
                                                    >
                                                        <Check className={`mr-2 h-4 w-4 ${bookingForm.instructorId === i.id ? "opacity-100" : "opacity-0"}`} />
                                                        {i.lastName} {i.firstName}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Data</Label>
                                <Input
                                    type="date"
                                    value={getSafeDateStr(bookingForm.bookingDate)}
                                    onChange={e => setBookingForm((prev: any) => ({ ...prev, bookingDate: new Date(e.target.value) }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Stato</Label>
                                <Select
                                    value={bookingForm.status}
                                    onValueChange={(val) => setBookingForm((prev: any) => ({ ...prev, status: val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="confirmed">Confermata</SelectItem>
                                        <SelectItem value="pending">In attesa</SelectItem>
                                        <SelectItem value="cancelled">Annullata</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Studio</Label>
                            <Select
                                value={bookingForm.studioId?.toString()}
                                onValueChange={v => setBookingForm((prev: any) => ({ ...prev, studioId: parseInt(v) }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Studio" />
                                </SelectTrigger>
                                <SelectContent>
                                    {studios?.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="mt-2">
                            <Popover open={showFreeSlots} onOpenChange={setShowFreeSlots}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" type="button" className="w-full text-xs font-medium gap-2 border-dashed h-9">
                                        <Clock className="w-3 h-3" />
                                        Mostra slot liberi per questo studio
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-3 max-h-80 overflow-y-auto" align="center">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between border-b pb-2">
                                            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Disponibilità</h4>
                                            <Badge variant="outline" className="text-[10px]">
                                                {bookingForm.bookingDate ? format(new Date(bookingForm.bookingDate), 'dd/MM/yyyy') : "Seleziona data"}
                                            </Badge>
                                        </div>
                                        {freeSlots.length === 0 ? (
                                            <div className="py-6 text-center space-y-2">
                                                <X className="w-8 h-8 text-slate-200 mx-auto" />
                                                <p className="text-xs text-muted-foreground">Nessuno slot disponibile per i criteri selezionati.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-1">
                                                {freeSlots.map((slot, idx) => (
                                                    <Button
                                                        key={idx}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-full justify-between hover:bg-green-50 hover:text-green-700 transition-colors group h-8 rounded-md px-2"
                                                        onClick={() => {
                                                            setBookingForm((prev: any) => ({ ...prev, startTime: slot.start, endTime: slot.end }));
                                                            setShowFreeSlots(false);
                                                            toast({ title: "Orario selezionato", description: `Prenotazione impostata dalle ${slot.start} alle ${slot.end}` });
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                            <span className="font-medium text-[11px]">{slot.start} - {slot.end}</span>
                                                        </div>
                                                        <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-[10px] text-muted-foreground italic text-center pt-2 border-top border-dotted">
                                            * Basato su corsi settimanali e prenotazioni esistenti
                                        </p>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Inizio</Label>
                                <Select value={bookingForm.startTime} onValueChange={v => setBookingForm((prev: any) => ({ ...prev, startTime: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Inizio" /></SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {TIME_SLOTS.map(t => {
                                            const isFree = freeSlots.some(slot => t >= slot.start && t < slot.end);
                                            return (
                                                <SelectItem
                                                    key={t}
                                                    value={t}
                                                    className={!isFree ? "text-red-500 focus:text-red-600" : ""}
                                                >
                                                    {t} {!isFree && "(Occupato)"}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Fine</Label>
                                <Select value={bookingForm.endTime} onValueChange={v => setBookingForm((prev: any) => ({ ...prev, endTime: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Fine" /></SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {TIME_SLOTS.map(t => {
                                            const isFree = freeSlots.some(slot => t > slot.start && t <= slot.end); // Adjustment for EndTime? 
                                            // Sticking to point-in-time check for consistency, loosely interpreting "is this time free to BE in?"
                                            // Ideally: Is this time valid as an END time? 
                                            // If 10:00-11:00 is busy. 10:00 is busy start. 
                                            // freeSlots doesn't have 10:00-11:00.
                                            // freeSlots has 08:00-10:00.
                                            // t=10:00. 10:00 > 08:00 && 10:00 <= 10:00. TRUE. 
                                            // So 10:00 is valid end time for 08:00-10:00.
                                            // t=10:05. 10:05 > 08:00 && 10:05 <= 10:00. FALSE.
                                            // So logic: t > slot.start && t <= slot.end seems correct for End Time availability relative to free slots.
                                            const isEndFree = freeSlots.some(slot => t > slot.start && t <= slot.end);
                                            return (
                                                <SelectItem
                                                    key={t}
                                                    value={t}
                                                    className={!isEndFree ? "text-red-500 focus:text-red-600" : ""}
                                                >
                                                    {t} {!isEndFree && "(Occupato)"}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 pt-4 border-t mt-4 flex w-full items-center">
                            {bookingForm.id && (
                                <Button type="button" variant="secondary" asChild className="mr-auto">
                                    <Link to={`/prenotazioni-sale`}>Vai alla scheda Affitti</Link>
                                </Button>
                            )}
                            <div className="flex gap-2 ml-auto items-center">
                                {bookingForm.id && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                            if (confirm("Eliminare questa prenotazione?")) {
                                                deleteBookingMutation.mutate(bookingForm.id!);
                                            }
                                        }}
                                    >
                                        Elimina
                                    </Button>
                                )}
                                <Button type="button" variant="outline" onClick={() => setEditingBooking(null)}>Annulla</Button>
                                <Button type="submit" disabled={createBookingMutation.isPending || updateBookingMutation.isPending} className="bg-[#f43f5e] hover:bg-[#e11d48] text-white">
                                    {bookingForm.id ? "Salva" : "Crea"}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Selection Choice Dialog */}
            <Dialog open={!!selectionContext} onOpenChange={(open) => {
                if (!open) {
                    setSelectionContext(null);
                    setNewEventSelectionType("");
                }
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nuovo Inserimento</DialogTitle>
                        <DialogDescription>
                            Scegli il tipo di attività da inserire alle ore {selectionContext?.hour}:00
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-6 space-y-4">
                        <div className="space-y-2">
                            <Label>Tipologia Evento Operativo</Label>
                            <Select value={newEventSelectionType} onValueChange={setNewEventSelectionType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleziona dal dominio..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="course">Corso</SelectItem>
                                    <SelectItem value="workshop">Workshop</SelectItem>
                                    <SelectItem value="lezione_individuale">Lezione individuale</SelectItem>
                                    <SelectItem value="domenica">Domenica in movimento</SelectItem>
                                    <SelectItem value="allenamento">Allenamento</SelectItem>
                                    <SelectItem value="affitto">Affitto</SelectItem>
                                    <SelectItem value="campus">Campus</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <Button 
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" 
                            disabled={!newEventSelectionType}
                            onClick={() => {
                                if (selectionContext && newEventSelectionType) {
                                    const sId = selectionContext.studioId || (studios?.[0]?.id || 1);
                                    const timeStr = `${selectionContext.hour.toString().padStart(2, "0")}:00`;
                                    
                                    // Start with 30 min duration for default inserts
                                    let endHour = selectionContext.hour;
                                    let endMin = 30;
                                    if (endHour >= 24) endHour = 23;
                                    const endTimeStr = `${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`;

                                    const actualActiveSeasonId = seasons?.find(s => s.active)?.id || seasons?.[0]?.id;
                                    const resolvedSeasonId = selectedSeasonId === "active" ? actualActiveSeasonId : (selectedSeasonId ? parseInt(selectedSeasonId, 10) : undefined);

                                    if (newEventSelectionType === "course") {
                                        handleCreateCourse(selectionContext.dayId, sId, selectionContext.hour, selectionContext.date);
                                        setUnifiedFormType("course");
                                    } else if (newEventSelectionType === "workshop" || newEventSelectionType === "domenica" || newEventSelectionType === "campus") {
                                        const dateStr = selectionContext.date ? selectionContext.date : null;
                                        setEditingWorkshop({
                                            name: "",
                                            dayOfWeek: selectionContext.dayId,
                                            studioId: sId,
                                            startTime: timeStr,
                                            endTime: endTimeStr,
                                            active: true,
                                            maxCapacity: 20,
                                            seasonId: resolvedSeasonId,
                                            startDate: dateStr,
                                            endDate: dateStr
                                        } as any);
                                        setEditForm({
                                            name: "",
                                            dayOfWeek: selectionContext.dayId,
                                            studioId: sId,
                                            startTime: timeStr,
                                            endTime: endTimeStr,
                                            active: true,
                                            maxCapacity: 20,
                                            seasonId: resolvedSeasonId,
                                            startDate: dateStr,
                                            endDate: dateStr
                                        });
                                        // TODO: Pass actual chosen type so the form can default the category
                                        setUnifiedFormType("workshop");
                                    } else {
                                        const dateStr = selectionContext.date ? selectionContext.date : null;
                                        
                                        const newBooking = {
                                            title: "",
                                            studioId: sId,
                                            dayOfWeek: selectionContext.dayId,
                                            startTime: timeStr,
                                            endTime: endTimeStr,
                                            status: "pending",
                                            seasonId: resolvedSeasonId,
                                            startDate: dateStr,
                                            endDate: dateStr
                                        };
                                        setEditingBooking(newBooking as any);
                                        setEditForm(newBooking);
                                        setUnifiedFormType("booking");
                                    }
                                    
                                    setUnifiedFormOpen(true);
                                    setSelectionContext(null);
                                    setNewEventSelectionType("");
                                }
                            }}
                        >
                            Procedi con l'inserimento &rarr;
                        </Button>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-md text-xs text-slate-600 mt-2">
                        <strong className="block text-slate-800 mb-1">Regole di Dominio Operativo:</strong>
                        Quest'area è designata ad ospitare l'inserimento rapido delle 10 attività day-by-day.<br/>
                        <em>Nota: L'inserimento di eventi strategici (Saggi, Vacanze Studio, Eventi Esterni) non è permesso qui, e andrà pilotato dal Planning.</em>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Complete Member Registration Dialog */}
            <Dialog open={quickAddMemberOpen} onOpenChange={setQuickAddMemberOpen} >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Anagrafica Completa Nuovo Partecipante</DialogTitle>
                        <DialogDescription>Compila tutti i campi richiesti per l'iscrizione.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Nome *</Label>
                                <Input value={newMemberForm.firstName} onChange={e => setNewMemberForm(p => ({ ...p, firstName: e.target.value }))} />
                            </div>
                            <div className="space-y-1">
                                <Label>Cognome *</Label>
                                <Input value={newMemberForm.lastName} onChange={e => setNewMemberForm(p => ({ ...p, lastName: e.target.value }))} />
                            </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Codice Fiscale *</Label>
                                <Input
                                    className="font-mono uppercase"
                                    maxLength={16}
                                    value={newMemberForm.fiscalCode}
                                    onChange={e => handleCFChange(e.target.value)}
                                    placeholder="RSSMRA80A01H501U"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Data di Nascita *</Label>
                                <Input
                                    type="date"
                                    value={newMemberForm.dateOfBirth}
                                    onChange={e => setNewMemberForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Luogo di Nascita</Label>
                                <Input value={newMemberForm.placeOfBirth} onChange={e => setNewMemberForm(p => ({ ...p, placeOfBirth: e.target.value }))} />
                            </div>
                            <div className="space-y-1">
                                <Label>Sesso</Label>
                                <Select value={newMemberForm.gender} onValueChange={v => setNewMemberForm(p => ({ ...p, gender: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Sesso" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="M">Maschio</SelectItem>
                                        <SelectItem value="F">Femmina</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Email *</Label>
                                <Input type="email" placeholder="esempio@email.it" value={newMemberForm.email} onChange={e => setNewMemberForm(p => ({ ...p, email: e.target.value }))} />
                            </div>
                            <div className="space-y-1">
                                <Label>Cellulare/Mobile</Label>
                                <Input value={newMemberForm.mobile} onChange={e => setNewMemberForm(p => ({ ...p, mobile: e.target.value }))} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Indirizzo (Via/Piazza)</Label>
                                <Input value={newMemberForm.streetAddress} onChange={e => setNewMemberForm(p => ({ ...p, streetAddress: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-2 space-y-1">
                                    <Label>Città</Label>
                                    <Input value={newMemberForm.city} onChange={e => setNewMemberForm(p => ({ ...p, city: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Prov.</Label>
                                    <Input maxLength={2} className="uppercase" value={newMemberForm.province} onChange={e => setNewMemberForm(p => ({ ...p, province: e.target.value }))} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label>Note</Label>
                            <Textarea placeholder="Note aggiuntive..." value={newMemberForm.notes} onChange={e => setNewMemberForm(p => ({ ...p, notes: e.target.value }))} />
                        </div>

                        <Button
                            className="w-full h-12 text-lg font-bold bg-[#f43f5e] hover:bg-[#e11d48] text-white"
                            type="button"
                            disabled={createMemberMutation.isPending}
                            onClick={() => {
                                if (!newMemberForm.firstName.trim() || !newMemberForm.lastName.trim() || !newMemberForm.fiscalCode.trim() || !newMemberForm.email.trim()) {
                                    toast({
                                        title: "Dati mancanti",
                                        description: "Cognome, Nome, Codice Fiscale ed Email sono obbligatori.",
                                        variant: "destructive"
                                    });
                                    return;
                                }

                                if (newMemberForm.fiscalCode.length !== 16) {
                                    toast({
                                        title: "Codice Fiscale non valido",
                                        description: "Il codice fiscale deve essere di 16 caratteri.",
                                        variant: "destructive"
                                    });
                                    return;
                                }

                                createMemberMutation.mutate(newMemberForm);
                            }}
                        >
                            {createMemberMutation.isPending ? "Salvataggio in corso..." : "Salva e Seleziona"}
                        </Button>

                        <Button
                            variant="outline"
                            className="h-40 flex flex-col items-center justify-center gap-4 border-2 hover:border-primary hover:bg-primary/5 transition-all group lg:col-span-1"
                            onClick={() => {
                                if (selectionContext) {
                                    const sId = selectionContext.studioId || (studios?.[0]?.id || 1);
                                    // handleCreateWorkshop equivalent
                                    const timeStr = `${selectionContext.hour.toString().padStart(2, "0")}:00`;
                                    const endTimeStr = `${(selectionContext.hour + 1).toString().padStart(2, "0")}:00`;
                                    setEditingWorkshop({
                                        name: "",
                                        dayOfWeek: selectionContext.dayId,
                                        studioId: sId,
                                        startTime: timeStr,
                                        endTime: endTimeStr,
                                        active: true,
                                        maxCapacity: 20
                                    } as any);
                                    setEditForm({
                                        name: "",
                                        dayOfWeek: selectionContext.dayId,
                                        studioId: sId,
                                        startTime: timeStr,
                                        endTime: endTimeStr,
                                        active: true,
                                        maxCapacity: 20
                                    });
                                    setUnifiedFormType("workshop");
                                    setUnifiedFormOpen(true);
                                    setSelectionContext(null);
                                }
                            }}
                        >
                            <div className="p-4 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                                <Sparkles className="w-8 h-8 text-blue-600" />
                            </div>
                            <div className="text-center">
                                <span className="block font-bold text-lg">Nuovo Workshop</span>
                                <span className="text-xs text-muted-foreground">Evento singolo o stage</span>
                            </div>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Quick Add Service Dialog */}
            <Dialog open={quickAddServiceOpen} onOpenChange={setQuickAddServiceOpen} >
                <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Nuovo Servizio</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-1">
                            <Label className="text-xs">Nome Servizio</Label>
                            <Input placeholder="Nome Servizio" value={newServiceForm.name} onChange={e => setNewServiceForm(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Prezzo (€)</Label>
                            <Input type="number" placeholder="Prezzo (€)" value={newServiceForm.price} onChange={e => setNewServiceForm(p => ({ ...p, price: e.target.value }))} />
                        </div>
                        <div className="flex items-center gap-4">
                            <Label className="text-xs">Colore</Label>
                            <Input type="color" className="w-12 h-8 p-0" value={newServiceForm.color} onChange={e => setNewServiceForm(p => ({ ...p, color: e.target.value }))} />
                        </div>
                        <Button className="w-full bg-[#f43f5e] hover:bg-[#e11d48] text-white" onClick={() => createServiceMutation.mutate({ ...newServiceForm, price: parseFloat(newServiceForm.price) })} disabled={createServiceMutation.isPending}>
                            {createServiceMutation.isPending ? "Salvataggio..." : "Crea e Seleziona"}
                        </Button>

                        <Button
                            variant="outline"
                            className="h-40 flex flex-col items-center justify-center gap-4 border-2 hover:border-primary hover:bg-primary/5 transition-all group lg:col-span-1"
                            onClick={() => {
                                if (selectionContext) {
                                    const sId = selectionContext.studioId || (studios?.[0]?.id || 1);
                                    // handleCreateWorkshop equivalent
                                    const timeStr = `${selectionContext.hour.toString().padStart(2, "0")}:00`;
                                    const endTimeStr = `${(selectionContext.hour + 1).toString().padStart(2, "0")}:00`;
                                    setEditingWorkshop({
                                        name: "",
                                        dayOfWeek: selectionContext.dayId,
                                        studioId: sId,
                                        startTime: timeStr,
                                        endTime: endTimeStr,
                                        active: true,
                                        maxCapacity: 20
                                    } as any);
                                    setEditForm({
                                        name: "",
                                        dayOfWeek: selectionContext.dayId,
                                        studioId: sId,
                                        startTime: timeStr,
                                        endTime: endTimeStr,
                                        active: true,
                                        maxCapacity: 20
                                    });
                                    setUnifiedFormType("workshop");
                                    setUnifiedFormOpen(true);
                                    setSelectionContext(null);
                                }
                            }}
                        >
                            <div className="p-4 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                                <Sparkles className="w-8 h-8 text-blue-600" />
                            </div>
                            <div className="text-center">
                                <span className="block font-bold text-lg">Nuovo Workshop</span>
                                <span className="text-xs text-muted-foreground">Evento singolo o stage</span>
                            </div>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Conflict Warning Dialog */}
            <AlertDialog open={!!conflictInfo} onOpenChange={(open) => !open && setConflictInfo(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Conflitto di Prenotazione</AlertDialogTitle>
                        <AlertDialogDescription>
                            {conflictInfo?.message}.
                            <br /><br />
                            Vuoi forzare comunque il salvataggio di questa prenotazione? Lo spazio risulterà occupato da più eventi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction onClick={handleForceSave} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Forza Salvataggio
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
