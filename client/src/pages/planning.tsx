import { useState, useMemo, Fragment, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Calendar as CalendarIcon, Filter, Plus, CalendarRange, Info } from "lucide-react";
import { format, getYear, getMonth, getDate, getDaysInMonth, isSameDay } from "date-fns";
import { it } from 'date-fns/locale';
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ActivityColorLegend } from "@/components/ActivityColorLegend";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from '@tanstack/react-query';
import { getEventColorClass } from "@/lib/activity-colors";
import { isItalianHoliday } from "@/lib/date-helpers";

import { mapActivityToPlanningEvent, mapBookingServiceToPlanningEvent } from "@/lib/event-mappers";

interface PlanningEvent {
    id: string;
    type: string;
    title: string;
    startDate: Date;
    endDate?: Date;
    dayOfWeek?: number; // 1-7 (Mon-Sun)
    colorClass: string;
    count?: number; // Per corsi aggregati
    isPublicHoliday?: boolean;
}

const MONTHS_ORDERED = [
    { label: "Settembre", monthIndex: 8 },
    { label: "Ottobre", monthIndex: 9 },
    { label: "Novembre", monthIndex: 10 },
    { label: "Dicembre", monthIndex: 11 },
    { label: "Gennaio", monthIndex: 0 },
    { label: "Febbraio", monthIndex: 1 },
    { label: "Marzo", monthIndex: 2 },
    { label: "Aprile", monthIndex: 3 },
    { label: "Maggio", monthIndex: 4 },
    { label: "Giugno", monthIndex: 5 },
    { label: "Luglio", monthIndex: 6 },
    { label: "Agosto", monthIndex: 7 }
];

const getStrategicColor = (type: string, title?: string) => {
    const t = (title || '').toUpperCase();
    if (type === 'chiusura' || t.includes('STRAORDINARI')) return 'bg-orange-100 text-orange-800 border-l border-orange-400';
    if (type === 'ferie' || t.includes('FERIE')) return 'bg-[#9D174D]/10 text-[#9D174D] border-l border-[#9D174D]/50';
    if (type === 'campus' || t.includes('CAM')) return 'bg-sky-100 text-sky-800 border-l border-sky-400';
    if (type === 'saggio' || t.includes('SAG')) return 'bg-pink-100 text-pink-800 border-l border-pink-400';
    if (t.includes('WS')) return 'bg-orange-100 text-orange-800 border-l border-orange-400';
    if (t.includes('VAC')) return 'bg-emerald-100 text-emerald-800 border-l border-emerald-400';
    if (type === 'nota' || t.includes('PROMO')) return 'bg-yellow-100 text-yellow-800 border-l border-yellow-400';
    if (type === 'evento') return 'bg-indigo-50 text-indigo-800 border-l border-indigo-400';
    if (t.includes('AFT')) return 'bg-slate-200 text-slate-800 border-l border-slate-400';
    
    return 'bg-white/95 text-slate-800';
};

// Innesco HMR per Vite (Bypass cache Subagent)
export default function Planning() {
    const today = new Date();
    // Se siamo prima di settembre, la stagione parte dall'anno scorso
    const defaultStartYear = today.getMonth() < 8 ? today.getFullYear() - 1 : today.getFullYear();
    const [startYear, setStartYear] = useState(defaultStartYear);
    const [strategicModalOpen, setStrategicModalOpen] = useState(false);
    const [strategicEventId, setStrategicEventId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'annuale' | 'mensile' | 'settimanale'>('annuale');
    // For mensile/settimanale navigation
    const [currentDateParam, setCurrentDateParam] = useState<Date>(today);
    const currentMonthIndex = today.getMonth();
    const activeRowRef = useRef<HTMLDivElement>(null);


    
    const { toast } = useToast();
    const [strategicTitle, setStrategicTitle] = useState("");
    const [strategicDesc, setStrategicDesc] = useState("");
    const [strategicType, setStrategicType] = useState("chiusura");
    const [strategicStart, setStrategicStart] = useState("");
    const [strategicEnd, setStrategicEnd] = useState("");
    const [strategicAllDay, setStrategicAllDay] = useState(true);

    const { data: seasons, isLoading: seasonsLoading } = useQuery<any[]>({ queryKey: ["/api/seasons"] });

    // Determina l'anno massimo navigabile (Stagione Attiva + 1)
    const maxStartYear = useMemo(() => {
        if (!seasons) return defaultStartYear + 1;
        const activeSeason = seasons.find(s => s.active) || seasons[0];
        if (activeSeason) {
            const yearMatch = activeSeason.name.match(/20(\d{2})\/20(\d{2})/);
            if (yearMatch) return 2000 + parseInt(yearMatch[1]) + 1;
        }
        return defaultStartYear + 1;
    }, [seasons, defaultStartYear]);

    // Controlla se disabilitare il tasto "Succ"
    const isNextDisabled = useMemo(() => {
        if (viewMode === 'annuale') return startYear >= maxStartYear;
        if (viewMode === 'mensile' || viewMode === 'settimanale') {
            const navYear = currentDateParam.getFullYear();
            const maxNavYear = maxStartYear + 1; // max anno gregoriano toccabile (es. stagione 26/27 tocca il 2027)
            if (navYear > maxNavYear) return true;
            if (navYear === maxNavYear && currentDateParam.getMonth() >= 8) return true; // max agosto della seconda annata
            return false;
        }
        return false;
    }, [viewMode, startYear, maxStartYear, currentDateParam]);

    // Determina la stagione correntemente visualizzata
    const targetSeasonId = useMemo(() => {
        if (!seasons) return 'all';
        
        if (viewMode === 'annuale') {
            const nextYear = startYear + 1;
            const matched = seasons.find(s => s.name.includes(`${startYear}`) && s.name.includes(`${nextYear}`));
            if (matched) return matched.id;
            const fallback = seasons.find(s => s.name.includes(`${startYear}`));
            if (fallback) return fallback.id;
            return -1; // Prevent cross-contamination of courses into non-existent seasons
        } else {
            const matched = seasons.find(s => {
                if (!s.startDate || !s.endDate) return false;
                const d1 = new Date(s.startDate);
                const d2 = new Date(s.endDate);
                return currentDateParam >= d1 && currentDateParam <= d2;
            });
            if (matched) return matched.id;
            return -1; // Prevent cross-contamination of courses into non-existent seasons
        }
    }, [seasons, viewMode, startYear, currentDateParam]);

    // --- FETCH DATA ---
    const { data: unifiedBridgeActivities, isLoading: unifiedLoading } = useQuery<any[]>({ queryKey: [`/api/activities-unified-preview?seasonId=${targetSeasonId}`] });
    
    // Gli altri array servono ancora per renderizzare gli specificEvents lunghi (Campus, ecc.) nel mapping. 
    // Possiamo lasciarli o usarli se necessari. (La query unificata serve al conteggio quotidiano)
    const { data: workshops, isLoading: workshopsLoading } = useQuery<any[]>({ queryKey: [`/api/workshops?seasonId=${targetSeasonId}`] });
    const { data: sundayActivities, isLoading: sundayLoading } = useQuery<any[]>({ queryKey: [`/api/sunday-activities?seasonId=${targetSeasonId}`] });
    const { data: campusActivities, isLoading: campusLoading } = useQuery<any[]>({ queryKey: [`/api/campus?seasonId=${targetSeasonId}`] });
    const { data: recitals, isLoading: recitalsLoading } = useQuery<any[]>({ queryKey: [`/api/recitals?seasonId=${targetSeasonId}`] });
    const { data: vacationStudies, isLoading: vacationsLoading } = useQuery<any[]>({ queryKey: [`/api/vacation-studies?seasonId=${targetSeasonId}`] });
    const { data: bookingServices, isLoading: servicesLoading } = useQuery<any[]>({ queryKey: ["/api/booking-services"] });
    const { data: strategicEventsData, isLoading: strategicLoading } = useQuery<any[]>({ queryKey: ["/api/strategic-events?seasonId=all"] });

    const isLoading = unifiedLoading || workshopsLoading || sundayLoading || strategicLoading ||
                      campusLoading || recitalsLoading || vacationsLoading || servicesLoading;

    useEffect(() => {
        if (!isLoading && activeRowRef.current && viewMode === 'annuale') {
            const timer = setTimeout(() => {
                activeRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [viewMode, startYear, isLoading]);

    // --- MUTATIONS ---
    const createStrategicMutation = useMutation({
        mutationFn: async (data: any) => {
            if (strategicEventId) {
                return await apiRequest("PATCH", `/api/strategic-events/${strategicEventId}`, data);
            }
            return await apiRequest("POST", "/api/strategic-events", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/strategic-events?seasonId=all"] });
            queryClient.invalidateQueries({ queryKey: ["/api/strategic-events"] });
            queryClient.invalidateQueries({ queryKey: ['/api/activities-unified-preview', selectedSeasonId] });
            setStrategicModalOpen(false);
            toast({ title: "Salvato", description: "L'evento strategico è stato salvato con successo." });
            setStrategicEventId(null);
            setStrategicTitle("");
            setStrategicDesc("");
            setStrategicStart("");
            setStrategicEnd("");
        },
        onError: (err) => {
            toast({ title: "Errore", description: "Impossibile salvare l'evento.", variant: "destructive" });
        }
    });

    const deleteStrategicMutation = useMutation({
        mutationFn: async (id: number) => {
            return await apiRequest("DELETE", `/api/strategic-events/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/strategic-events?seasonId=all"] });
            queryClient.invalidateQueries({ queryKey: ["/api/strategic-events"] });
            queryClient.invalidateQueries({ queryKey: ['/api/activities-unified-preview', selectedSeasonId] });
            setStrategicModalOpen(false);
            toast({ title: "Cancellato", description: "L'evento strategico è stato rimosso." });
            setStrategicEventId(null);
            setStrategicTitle("");
            setStrategicDesc("");
            setStrategicStart("");
            setStrategicEnd("");
        },
        onError: (err) => {
            toast({ title: "Errore", description: "Impossibile eliminare l'evento. Potrebbe essere già stato rimosso.", variant: "destructive" });
        }
    });

    const handleSaveStrategicEvent = () => {
        if (!strategicTitle || !strategicStart) {
            toast({ title: "Campi obbligatori", description: "Inserisci titolo e data inizio.", variant: "destructive" });
            return;
        }
        createStrategicMutation.mutate({
            title: strategicTitle,
            description: strategicDesc,
            eventType: strategicType,
            startDate: strategicStart,
            endDate: strategicEnd || null,
            allDay: strategicAllDay,
            seasonId: seasons?.find(s => s.active)?.id || null
        });
    };

    // --- AGGREGATE COURSES ---
    // --- AGGREGATE BREAKDOWN BY DATE ---
    const groupedUnifiedActivities = useMemo(() => {
        const map: Record<string, Record<string, number>> = {};
        if (!unifiedBridgeActivities) return map;
        
        unifiedBridgeActivities.forEach((item: any) => {
            const raw = item.rawPayload || item;
            if (item.isActive !== false && raw.active !== false && item.startDatetime) {
                const dateStr = item.startDatetime.split('T')[0];
                if (!map[dateStr]) map[dateStr] = {};
                
                let key = raw.legacy_source_type || item.activityFamily || 'altro';
                if (key === 'course' || key === 'courses') key = 'Corsi';
                else if (key === 'allenamento' || key === 'training') key = 'Allenamenti';
                else if (key === 'lezione_individuale' || key === 'individual_lessons') key = 'Lez. Individuali';
                else if (key === 'workshop' || key === 'workshops') key = 'Workshop';
                else if (key === 'domenica' || key === 'sunday_activities') key = 'Domeniche';
                else if (key === 'studioBookings' || key === 'rentals') key = 'Affitti/Sale';
                else key = 'Altre Attività';
                
                map[dateStr][key] = (map[dateStr][key] || 0) + 1;
            }
        });
        return map;
    }, [unifiedBridgeActivities]);

    const getActivitiesBreakdownForDate = useCallback((cellDate: Date, cellDayOfWeek: number) => {
        const dateStr = format(cellDate, "yyyy-MM-dd");
        return groupedUnifiedActivities[dateStr] || {};
    }, [groupedUnifiedActivities]);

    // --- UNIFY EVENTS ---
    const events = useMemo(() => {
        const evts: PlanningEvent[] = [];

        if (workshops) evts.push(...workshops.map(w => mapActivityToPlanningEvent(w, "ws", "Workshop", "workshop")).filter(Boolean) as PlanningEvent[]);
        if (sundayActivities) evts.push(...sundayActivities.map(s => mapActivityToPlanningEvent(s, "sun", "Domenica in mov.", "domeniche-movimento")).filter(Boolean) as PlanningEvent[]);
        if (campusActivities) evts.push(...campusActivities.map(c => mapActivityToPlanningEvent(c, "cam", "Campus", "campus")).filter(Boolean) as PlanningEvent[]);
        if (recitals) evts.push(...recitals.map(r => mapActivityToPlanningEvent(r, "rec", "Saggio", "saggi")).filter(Boolean) as PlanningEvent[]);
        if (vacationStudies) evts.push(...vacationStudies.map(v => mapActivityToPlanningEvent(v, "vac", "Chiusura/Vacanza", "vacanze-studio")).filter(Boolean) as PlanningEvent[]);
        if (bookingServices) evts.push(...bookingServices.map(b => mapBookingServiceToPlanningEvent(b)).filter(Boolean) as PlanningEvent[]);

        if (strategicEventsData) {
            evts.push(...strategicEventsData.map(se => ({
                id: `strat_${se.id}`,
                type: se.eventType,
                title: se.title,
                startDate: new Date(se.startDate),
                endDate: se.endDate ? new Date(se.endDate) : undefined,
                colorClass: getStrategicColor(se.eventType, se.title),
                isPublicHoliday: se.isPublicHoliday === true || se.isPublicHoliday === 1
            })));
        }

        return evts;
    }, [workshops, sundayActivities, campusActivities, recitals, vacationStudies, bookingServices, strategicEventsData]);

    // --- GRID GENERATION ---
    // 31 days rows, 12 months columns
    const daysArray = Array.from({ length: 31 }, (_, i) => i + 1);



    const getEventsForDay = (day: number, realMonthIndex: number, cellYear: number) => {
        // Date checking to avoid non-existent days like Feb 30
        const daysInCurrentMonth = getDaysInMonth(new Date(cellYear, realMonthIndex));
        if (day > daysInCurrentMonth) return null;

        const cellDate = new Date(cellYear, realMonthIndex, day);
        const cellDayOfWeek = cellDate.getDay() === 0 ? 7 : cellDate.getDay(); // 1-7
        
        let cellEvents = [];

        // 1. Assign specific events (campuses, workshops, etc.)
        const specificEvents = events.filter(e => {
            if (e.endDate) {
                // If it's a range event (like Campus)
                const start = new Date(e.startDate.setHours(0,0,0,0));
                const end = new Date(e.endDate.setHours(23,59,59,999));
                return cellDate >= start && cellDate <= end;
            }
            return isSameDay(e.startDate, cellDate);
        });

        // 0. Holiday highlighting directly as an event or badge
        const systemHolidayName = isItalianHoliday(cellDate);
        const dbHoliday = specificEvents.find(e => e.isPublicHoliday);
        const resolvedHolidayName = dbHoliday ? dbHoliday.title : systemHolidayName;

        if (resolvedHolidayName) {
            cellEvents.push(
                <div key={`hol_${day}_${realMonthIndex}`} className="mb-1 mt-0.5 w-full bg-red-50 text-red-700 border border-red-300 px-1 py-0.5 text-[11px] font-medium rounded text-center uppercase shadow-sm truncate">
                    {resolvedHolidayName}
                </div>
            );
        }

        // 2. Assign aggregated breakdown (repeated weekly within boundaries)
        const breakdown = getActivitiesBreakdownForDate(cellDate, cellDayOfWeek);
        if (!resolvedHolidayName) { // Optionally don't show normal daily routine on National Holidays
            const dateStr = format(cellDate, "yyyy-MM-dd");
            const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const isPastMonthCell = cellDate < currentMonthStart;
            
            Object.entries(breakdown).forEach(([key, count]) => {
                if (count > 0) {
                    let colorClass = "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300";
                    if (key === 'Corsi') {
                        colorClass = isPastMonthCell 
                            ? "bg-slate-200 border-slate-300 text-slate-700 hover:bg-slate-300" 
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100";
                    }
                    else if (key === 'Allenamenti') colorClass = "bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100";
                    else if (key === 'Lez. Individuali') colorClass = "bg-green-50 border-green-200 text-green-600 hover:bg-green-100";
                    else if (key === 'Workshop') colorClass = "bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100";
                    else if (key === 'Affitti/Sale') colorClass = "bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100";

                    cellEvents.push(
                        <Link to={`/calendario-attivita?date=${dateStr}`} key={`breakdown-${key}`}>
                            <div className={`mb-1 mt-0.5 rounded border px-1 py-0.5 text-[11px] font-medium shadow-sm transition-colors truncate cursor-pointer ${colorClass}`}>
                                {key} ({count})
                            </div>
                        </Link>
                    );
                }
            });
        }

        // 3. Render cards for remaining specific events
        specificEvents.forEach(e => {
            if (e.isPublicHoliday) return; // Esclude doppio rendering festività (solo badge rosso)

            const pureId = e.id.split('_')[1];
            // Determina il link basato sul tipo puntando alla scheda precisa
            let linkTo = "";
            if (e.type === 'workshop') linkTo = `/scheda-workshop?id=${pureId}`;
            else if (e.type === 'sunday') linkTo = `/scheda-domenica?id=${pureId}`;
            else if (e.type === 'campus') linkTo = `/scheda-campus?id=${pureId}`;
            else if (e.type === 'recital') linkTo = `/scheda-saggio?id=${pureId}`;
            else if (e.type === 'vacation') linkTo = `/scheda-vacanza-studio?id=${pureId}`;
            else if (e.type === 'external') linkTo = `/attivita/servizi?id=${pureId}`; // Eventi Esterni usano la grid filtrata se non c'è una scheda 1:1

            const elementBlock = (
                <div 
                    className={`mb-1 mt-0.5 break-words whitespace-normal leading-tight rounded px-1.5 py-1 text-[11px] sm:text-xs font-medium shadow-sm cursor-pointer hover:opacity-90 transition-opacity ${e.colorClass}`} 
                    title={e.title}
                    onClick={(event) => {
                        if (!linkTo && e.id.toString().startsWith('strat_')) {
                            // Blocca l'apertura se si tratta di una festività di sistema preimpostata
                            if (e.isPublicHoliday) {
                                event.stopPropagation();
                                event.preventDefault();
                                return;
                            }
                            event.stopPropagation();
                            event.preventDefault();
                            const pureId = parseInt(e.id.split('_')[1]);
                            const originalEvent = strategicEventsData?.find(se => se.id === pureId);
                            if (originalEvent) {
                                setStrategicEventId(pureId);
                                setStrategicStart(format(new Date(originalEvent.startDate), "yyyy-MM-dd"));
                                setStrategicEnd(originalEvent.endDate ? format(new Date(originalEvent.endDate), "yyyy-MM-dd") : format(new Date(originalEvent.startDate), "yyyy-MM-dd"));
                                setStrategicTitle(originalEvent.title);
                                setStrategicDesc(originalEvent.description || "");
                                setStrategicType(originalEvent.eventType || "chiusura");
                                setStrategicAllDay(originalEvent.allDay || false);
                                setStrategicModalOpen(true);
                            }
                        }
                    }}
                >
                    {e.title}
                </div>
            );

            if (linkTo) {
                cellEvents.push(
                    <Link to={linkTo} key={e.id}>
                        {elementBlock}
                    </Link>
                );
            } else {
                cellEvents.push(<Fragment key={e.id}>{elementBlock}</Fragment>);
            }
        });

        return cellEvents;
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Helper navigazione data
    const prevTimeSpan = () => {
        if (viewMode === 'annuale') setStartYear(y => y - 1);
        if (viewMode === 'mensile') setCurrentDateParam(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
        if (viewMode === 'settimanale') setCurrentDateParam(d => new Date(d.setDate(d.getDate() - 7)));
    };
    const nextTimeSpan = () => {
        if (viewMode === 'annuale') setStartYear(y => y + 1);
        if (viewMode === 'mensile') setCurrentDateParam(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
        if (viewMode === 'settimanale') setCurrentDateParam(d => new Date(d.setDate(d.getDate() + 7)));
    };

    // Render logic components for Month / Week
    const renderMonthlyGrid = () => {
        const year = currentDateParam.getFullYear();
        const month = currentDateParam.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const startingDayOfWeek = firstDayOfMonth.getDay() === 0 ? 7 : firstDayOfMonth.getDay(); 
        const totalDays = getDaysInMonth(firstDayOfMonth);
        
        const blanks = Array.from({ length: startingDayOfWeek - 1 }, (_, i) => i);
        const days = Array.from({ length: totalDays }, (_, i) => i + 1);
        
        return (
             <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200">
                {['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'].map(d => (
                    <div key={d} className="bg-slate-100 p-2 text-center text-xs font-bold uppercase text-slate-500">{d}</div>
                ))}
                {blanks.map(b => <div key={`blank-${b}`} className="bg-white min-h-[120px]"></div>)}
                {days.map(d => {
                    const cellEvents = getEventsForDay(d, month, year);
                    const isToday = isSameDay(new Date(year, month, d), today);
                    return (
                        <div 
                            key={d} 
                            className={`bg-white min-h-[120px] p-2 hover:bg-slate-50 cursor-pointer transition-colors ${isToday ? 'bg-yellow-50/50' : ''}`}
                            onClick={() => {
                                const dateStr = format(new Date(year, month, d), "yyyy-MM-dd");
                                setStrategicEventId(null);
                                setStrategicStart(dateStr);
                                setStrategicEnd(dateStr);
                                setStrategicTitle("");
                                setStrategicDesc("");
                                setStrategicType("chiusura");
                                setStrategicModalOpen(true);
                            }}
                        >
                            <div className={`text-right font-bold text-sm mb-2 ${isToday ? 'text-yellow-600 underline text-base' : 'text-slate-700'}`}>{d}</div>
                            <div className="flex flex-col gap-1">
                                {cellEvents}
                            </div>
                        </div>
                    );
                })}
             </div>
        );
    };

    const renderWeeklyGrid = () => {
        // Find Monday of the week
        const dDate = new Date(currentDateParam);
        const day = dDate.getDay() === 0 ? 7 : dDate.getDay();
        const diff = dDate.getDate() - day + 1;
        const monday = new Date(dDate.setDate(diff));
        
        const weekDays = Array.from({ length: 7 }, (_, i) => {
            const current = new Date(monday);
            current.setDate(monday.getDate() + i);
            return current;
        });

        return (
            <div className="space-y-4">
                {weekDays.map(wd => {
                    const wDay = wd.getDate();
                    const wMonth = wd.getMonth();
                    const wYear = wd.getFullYear();
                    const cellEvents = getEventsForDay(wDay, wMonth, wYear);
                    const isToday = isSameDay(wd, today);
                    
                    return (
                        <div key={wd.toISOString()} className={`flex border rounded-md overflow-hidden bg-white shadow-sm ${isToday ? 'border-yellow-400 bg-yellow-50/30' : 'border-slate-200'}`}>
                            {/* Day Header */}
                            <div className={`w-32 shrink-0 p-4 border-r flex flex-col justify-center items-center ${isToday ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-50'}`}>
                                <span className="text-sm font-semibold uppercase">{format(wd, "EEEE", { locale: it })}</span>
                                <span className="text-3xl font-extrabold">{format(wd, "d")}</span>
                                <span className="text-xs text-muted-foreground">{format(wd, "MMMM", { locale: it })}</span>
                            </div>
                            {/* Events List */}
                            <div className="flex-1 p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                {cellEvents && cellEvents.length > 0 ? cellEvents : (
                                    <div className="col-span-full text-sm text-slate-400 p-2 italic flex items-center justify-center">Nessuna attività</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="p-6 pb-0 flex flex-col h-[calc(100vh)] md:h-[calc(100vh-2rem)] overflow-hidden">
            {/* INTESTAZIONE E CONTROLLI AMBIENTE */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4 shrink-0 overflow-hidden">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                        <CalendarRange className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Planning Strategico</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Mappa Plurimensile e Multi-Stagione. I corsi sono mostrati in forma sintetica.
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar flex-nowrap w-full md:w-auto pb-1 md:pb-0">
                    {/* Navigatore Temporale Centrale */}
                    <div className="flex items-center bg-white rounded-md border shadow-sm p-1 h-9 shrink-0">
                        <Button variant="ghost" size="sm" onClick={prevTimeSpan} className="text-slate-500 hover:text-slate-900 h-7">&larr; Prec.</Button>
                        <div className="px-4 text-sm font-bold text-slate-800 min-w-[160px] text-center uppercase tracking-wide">
                            {viewMode === 'annuale' ? `Stagione ${startYear.toString().slice(-2)}-${(startYear + 1).toString().slice(-2)}` : 
                             viewMode === 'mensile' ? format(currentDateParam, "MMMM yyyy", { locale: it }) : 
                             `Settimana ${format(currentDateParam, "d MMM yyyy", { locale: it })}`}
                        </div>
                        <Button variant="ghost" size="sm" onClick={nextTimeSpan} disabled={isNextDisabled} className="text-slate-500 hover:text-slate-900 h-7 disabled:opacity-30 disabled:hover:text-slate-500">Succ. &rarr;</Button>
                    </div>

                    <div className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors h-9 flex items-center shrink-0"
                         onClick={() => {
                             setViewMode('annuale');
                             setStartYear(today.getMonth() < 8 ? today.getFullYear() - 1 : today.getFullYear());
                             setCurrentDateParam(today);
                         }}
                         title="Torna ad oggi">
                        Oggi: {format(today, "d MMM", { locale: it })}
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 h-9 shrink-0">
                        <Button variant={viewMode === 'annuale' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('annuale')} className="rounded-md h-7">Annuale</Button>
                        <Button variant={viewMode === 'mensile' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('mensile')} className="rounded-md h-7">Mensile</Button>
                        <Button variant={viewMode === 'settimanale' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('settimanale')} className="rounded-md h-7">Settimanale</Button>
                    </div>

                    <ActivityColorLegend variant="popover" />

                    <Button onClick={() => setStrategicModalOpen(true)} size="sm" className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-sm h-9 shrink-0">
                        <Plus className="h-4 w-4" /> Nuovo Evento
                    </Button>
                </div>
            </div>

            <Card className="w-full border-none shadow-xl bg-card overflow-hidden flex-1 flex flex-col min-h-0">
                <CardContent className="p-0 overflow-auto flex-1 relative scroll-smooth border-t">
                    {/* PLANNING GRID Switch */}
                    {viewMode === 'annuale' && (
                        <div className="min-w-[1200px] flex flex-col relative w-fit">
                            {/* Header Mesi */}
                            <div className="sticky top-0 z-40 bg-white shadow-sm border-b">
                                <div className="grid grid-cols-12 bg-muted/50">
                                {MONTHS_ORDERED.map((monthObj, idx) => {
                                    const cellYearHeader = monthObj.monthIndex < 8 ? startYear + 1 : startYear;
                                    const monthDateHeader = new Date(cellYearHeader, monthObj.monthIndex, 1);
                                    const currentMonthStartHeader = new Date(today.getFullYear(), today.getMonth(), 1);
                                    const isMonthPast = monthDateHeader < currentMonthStartHeader;

                                    const isCurrentMonth = monthObj.monthIndex === currentMonthIndex && 
                                        (monthObj.monthIndex < 8 ? startYear + 1 === today.getFullYear() : startYear === today.getFullYear());
                                    
                                    const themeStyle = isMonthPast ? "bg-slate-200 text-slate-800" : "bg-slate-50/80 text-slate-600";
                                    const highlightStyle = isCurrentMonth ? "border-b-4 border-b-yellow-400 bg-yellow-100/50" : "";
                                    
                                    return (
                                        <div key={monthObj.label} className={`border-r px-2 py-2 flex flex-col items-center justify-center tracking-wide leading-tight ${themeStyle} ${highlightStyle}`}>
                                            <span className="font-bold text-[13px] uppercase">{monthObj.label}</span>
                                            <span className="text-[11px] font-semibold opacity-75">{monthObj.monthIndex < 8 ? startYear + 1 : startYear}</span>
                                        </div>
                                    );
                                })}
                                </div>
                            </div>
                            
                            {/* Body Giorni */}
                            <div className="border-b">
                            {daysArray.map(day => {
                                const isTodayRow = day === today.getDate() && startYear === (today.getMonth() < 8 ? today.getFullYear() - 1 : today.getFullYear());
                                return (
                                <div key={day} ref={isTodayRow ? activeRowRef : null} className={`grid grid-cols-12 border-b group hover:bg-slate-50 duration-150 transition-colors ${isTodayRow ? 'bg-yellow-50/30' : ''}`}>
                                    {MONTHS_ORDERED.map((monthObj, monthColIndex) => {
                                        // Determiniamo se è anno successivo (da Gennaio in poi, avendo shiftato Set-Ago)
                                        const cellYear = monthObj.monthIndex < 8 ? startYear + 1 : startYear;
                                        const realMonthIndex = monthObj.monthIndex;

                                        const eventsInCell = getEventsForDay(day, realMonthIndex, cellYear);
                                        const isValidDay = eventsInCell !== null;
                                        
                                        const cellDate = isValidDay ? new Date(cellYear, realMonthIndex, day) : null;
                                        const isToday = cellDate ? isSameDay(cellDate, today) : false;
                                        const holidayName = cellDate ? isItalianHoliday(cellDate) : null;

                                        // Weekend highlighting
                                        const isSunday = cellDate ? cellDate.getDay() === 0 : false;
                                        const isSaturday = cellDate ? cellDate.getDay() === 6 : false;

                                        const isCurrentMonthCol = monthObj.monthIndex === currentMonthIndex && 
                                            cellYear === today.getFullYear();

                                        const isPastBodyMonth = cellDate ? (cellDate < new Date(today.getFullYear(), today.getMonth(), 1)) : false;

                                        return (
                                            <div 
                                                key={`${day}-${monthColIndex}`} 
                                                onClick={() => {
                                                    if (isValidDay && cellDate) {
                                                        const dateStr = format(cellDate, "yyyy-MM-dd");
                                                        setStrategicEventId(null);
                                                        setStrategicStart(dateStr);
                                                        setStrategicEnd(dateStr);
                                                        setStrategicTitle("");
                                                        setStrategicDesc("");
                                                        setStrategicType("chiusura");
                                                        setStrategicModalOpen(true);
                                                    }
                                                }}
                                                className={`relative min-h-[50px] border-r p-1 text-xs transition-opacity duration-300 ${isValidDay ? 'cursor-pointer hover:ring-2 hover:ring-blue-400 hover:z-20' : ''} ${
                                                    !isValidDay ? 'bg-slate-50/30' : 
                                                    (isToday ? 'bg-yellow-200 border-2 border-yellow-500 z-10 shadow-md scale-[1.02] transition-transform' : 
                                                    (holidayName || isSunday ? (isPastBodyMonth ? 'bg-red-100/80' : 'bg-red-50/50') : 
                                                    (isCurrentMonthCol ? 'bg-yellow-50/20' : 
                                                    (isSaturday ? (isPastBodyMonth ? 'bg-slate-200/50' : 'bg-slate-100/50') : 
                                                    (isPastBodyMonth ? 'bg-slate-100/80 border-slate-300/50' : 'bg-white')))))
                                                } ${isPastBodyMonth && !isToday ? 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0' : ''}`}
                                            >
                                                {isValidDay && cellDate && (
                                                    <>
                                                        <span className={`absolute top-1 right-1 text-[10px] font-bold ${isToday ? 'text-yellow-800 text-[11px] underline' : (holidayName || isSunday ? 'text-red-500' : 'text-slate-400')}`}>
                                                            {day} {format(cellDate, "EEE", { locale: it }).toUpperCase()}
                                                        </span>
                                                        <div className="mt-4 flex flex-col gap-0.5">
                                                            {eventsInCell}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                );
                            })}
                            </div>
                        </div>
                    )}
                    {viewMode === 'mensile' && (
                        <div className="p-4">
                            {renderMonthlyGrid()}
                        </div>
                    )}
                    {viewMode === 'settimanale' && (
                        <div className="p-4 bg-slate-50">
                            {renderWeeklyGrid()}
                        </div>
                    )}
                </CardContent>
                {/* Bordino FISSATO (fuori dallo scroll container) */}
                <div className="h-5 w-full bg-[#f6f6f9] border-t border-slate-200 shrink-0"></div>
            </Card>

            {/* Strategic Event Draft Modal */}
            <Dialog open={strategicModalOpen} onOpenChange={setStrategicModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Aggiungi Evento Strategico</DialogTitle>
                        <DialogDescription>
                            Bozza per l'inserimento di Ferie, Chiusure Straordinarie o Eventi Macro nel Planning.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Tipologia Evento</Label>
                            <Select value={strategicType} onValueChange={setStrategicType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleziona tipologia..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="chiusura">Chiusura Straordinaria</SelectItem>
                                    <SelectItem value="ferie">Ferie / Vacanze</SelectItem>
                                    <SelectItem value="evento">Evento Libero</SelectItem>
                                    <SelectItem value="nota">Nota o Promozione speciale</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Titolo</Label>
                            <Input value={strategicTitle} onChange={e => setStrategicTitle(e.target.value)} placeholder="Es. Ferie Estive" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Data Inizio</Label>
                                <Input type="date" value={strategicStart} onChange={e => {
                                    setStrategicStart(e.target.value);
                                    if (!strategicEnd || strategicEnd === strategicStart) {
                                        setStrategicEnd(e.target.value);
                                    }
                                }} />
                            </div>
                            <div className="space-y-2">
                                <Label>Data Fine (Opzionale)</Label>
                                <Input type="date" value={strategicEnd} onChange={e => setStrategicEnd(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2 text-sm flex items-center justify-between border rounded p-3">
                            <div>
                                <p className="font-semibold">Tutto il giorno</p>
                                <p className="text-slate-500 text-xs text-muted-foreground">L'evento copre per intero le date indicate</p>
                            </div>
                            <Switch checked={strategicAllDay} onCheckedChange={setStrategicAllDay} />
                        </div>
                        <div className="space-y-2">
                            <Label>Note / Descrizione</Label>
                            <Textarea value={strategicDesc} onChange={e => setStrategicDesc(e.target.value)} placeholder="Dettagli operativi..." />
                        </div>
                    </div>
                    <DialogFooter className="flex justify-between sm:justify-between w-full">
                        {strategicEventId ? (
                            <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600" onClick={() => deleteStrategicMutation.mutate(strategicEventId)} disabled={deleteStrategicMutation.isPending}>
                                Elimina
                            </Button>
                        ) : (
                            <div></div>
                        )}
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStrategicModalOpen(false)}>Annulla</Button>
                            <Button onClick={handleSaveStrategicEvent} disabled={!strategicTitle || !strategicStart || createStrategicMutation.isPending}>
                                {createStrategicMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salva Evento
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Utility to convert Italian string formats ("lunedì", "LUN") to 1-7 (Lun-Dom)
function mapDayOfWeek(dayStr: string): number {
    const d = dayStr.toLowerCase().trim();
    if (d.includes('lun')) return 1;
    if (d.includes('mar')) return 2;
    if (d.includes('mer')) return 3;
    if (d.includes('gio')) return 4;
    if (d.includes('ven')) return 5;
    if (d.includes('sab')) return 6;
    if (d.includes('dom')) return 7;
    return 1; // default to 1 if parsing fails
}
