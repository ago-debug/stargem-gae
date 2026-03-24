import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Calendar as CalendarIcon, Filter, Plus } from "lucide-react";
import { format, getYear, getMonth, getDate, getDaysInMonth, isSameDay } from "date-fns";
import { it } from 'date-fns/locale';
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function Planning() {
    const today = new Date();
    // Se siamo prima di settembre, la stagione parte dall'anno scorso
    const defaultStartYear = today.getMonth() < 8 ? today.getFullYear() - 1 : today.getFullYear();
    const [startYear, setStartYear] = useState(defaultStartYear);
    const [strategicModalOpen, setStrategicModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'annuale' | 'mensile' | 'settimanale'>('annuale');
    // For mensile/settimanale navigation
    const [currentDateParam, setCurrentDateParam] = useState<Date>(today);
    const currentMonthIndex = today.getMonth();

    // --- FETCH DATA ---
    const { data: courses, isLoading: coursesLoading } = useQuery<any[]>({ queryKey: ["/api/courses"] });
    const { data: workshops, isLoading: workshopsLoading } = useQuery<any[]>({ queryKey: ["/api/workshops"] });
    const { data: sundayActivities, isLoading: sundayLoading } = useQuery<any[]>({ queryKey: ["/api/sunday-activities"] });
    const { data: campusActivities, isLoading: campusLoading } = useQuery<any[]>({ queryKey: ["/api/campus"] });
    const { data: recitals, isLoading: recitalsLoading } = useQuery<any[]>({ queryKey: ["/api/recitals"] });
    const { data: vacationStudies, isLoading: vacationsLoading } = useQuery<any[]>({ queryKey: ["/api/vacation-studies"] });
    const { data: bookingServices, isLoading: servicesLoading } = useQuery<any[]>({ queryKey: ["/api/booking-services"] });

    const isLoading = coursesLoading || workshopsLoading || sundayLoading || 
                      campusLoading || recitalsLoading || vacationsLoading || servicesLoading;

    // --- AGGREGATE COURSES ---
    // mapping courses to dayOfWeek (1=Lun, 7=Dom)
    const activeCoursesByDay = useMemo(() => {
        const counts: Record<number, number> = {};
        if (courses) {
            courses.forEach(c => {
                if (c.active !== false && c.dayOfWeek) {
                    const mappedDay = mapDayOfWeek(c.dayOfWeek);
                    counts[mappedDay] = (counts[mappedDay] || 0) + 1;
                }
            });
        }
        return counts;
    }, [courses]);

    // --- UNIFY EVENTS ---
    const events = useMemo(() => {
        const evts: PlanningEvent[] = [];

        if (workshops) evts.push(...workshops.map(w => mapActivityToPlanningEvent(w, "ws", "Workshop", "workshop")).filter(Boolean) as PlanningEvent[]);
        if (sundayActivities) evts.push(...sundayActivities.map(s => mapActivityToPlanningEvent(s, "sun", "Domenica in mov.", "domeniche-movimento")).filter(Boolean) as PlanningEvent[]);
        if (campusActivities) evts.push(...campusActivities.map(c => mapActivityToPlanningEvent(c, "cam", "Campus", "campus")).filter(Boolean) as PlanningEvent[]);
        if (recitals) evts.push(...recitals.map(r => mapActivityToPlanningEvent(r, "rec", "Saggio", "saggi")).filter(Boolean) as PlanningEvent[]);
        if (vacationStudies) evts.push(...vacationStudies.map(v => mapActivityToPlanningEvent(v, "vac", "Chiusura/Vacanza", "vacanze-studio")).filter(Boolean) as PlanningEvent[]);
        if (bookingServices) evts.push(...bookingServices.map(b => mapBookingServiceToPlanningEvent(b)).filter(Boolean) as PlanningEvent[]);

        return evts;
    }, [workshops, sundayActivities, campusActivities, recitals, vacationStudies, bookingServices]);

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

        // 0. Holiday highlighting directly as an event or badge
        const holidayName = isItalianHoliday(cellDate);
        if (holidayName) {
            cellEvents.push(
                <div key={`hol_${day}_${realMonthIndex}`} className="mb-1 w-full bg-red-500 text-white px-1 py-0.5 text-[10px] font-bold rounded text-center uppercase shadow-sm truncate">
                    {holidayName}
                </div>
            );
        }

        // 1. Assign aggregated courses (repeated weekly)
        const coursesCount = activeCoursesByDay[cellDayOfWeek];
        if (coursesCount > 0 && !holidayName) { // Optionally don't show courses on National Holidays
            // Passiamo la data esatta come parametro GET query per far aprire il Calendario nel giorno giusto
            const dateStr = format(cellDate, "yyyy-MM-dd");
            cellEvents.push(
                <Link to={`/calendario-attivita?date=${dateStr}`} key="courses">
                    <div className="mb-1 rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[10px] font-medium text-slate-500 shadow-sm opacity-90 truncate cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-colors">
                        Corsi ({coursesCount})
                    </div>
                </Link>
            );
        }

        // 2. Assign specific events (campuses, workshops, etc.)
        const specificEvents = events.filter(e => {
            if (e.endDate) {
                // If it's a range event (like Campus)
                const start = new Date(e.startDate.setHours(0,0,0,0));
                const end = new Date(e.endDate.setHours(23,59,59,999));
                return cellDate >= start && cellDate <= end;
            }
            return isSameDay(e.startDate, cellDate);
        });

        specificEvents.forEach(e => {
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
                <div className={`mb-1 truncate rounded border px-1 py-0.5 text-xs shadow-sm cursor-pointer hover:brightness-95 transition-all ${e.colorClass}`} title={e.title}>
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
                cellEvents.push(<React.Fragment key={e.id}>{elementBlock}</React.Fragment>);
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
                        <div key={d} className={`bg-white min-h-[120px] p-2 hover:bg-slate-50 ${isToday ? 'bg-yellow-50/50' : ''}`}>
                            <div className={`text-right font-bold text-sm mb-2 ${isToday ? 'text-yellow-600 underline text-base' : 'text-slate-700'}`}>{d}</div>
                            <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] custom-scrollbar">
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
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Planning Strategico</h1>
                    <p className="text-muted-foreground">
                        Mappa Plurimensile e Multi-Stagione. I corsi sono mostrati in forma sintetica.
                    </p>
                </div>
                <div className="flex items-center gap-4 border rounded-md p-1 bg-muted/30">
                    <Button 
                        variant={viewMode === 'annuale' ? 'default' : 'ghost'} 
                        size="sm"
                        onClick={() => setViewMode('annuale')}
                    >
                        Annuale
                    </Button>
                    <Button 
                        variant={viewMode === 'mensile' ? 'default' : 'ghost'} 
                        size="sm"
                        onClick={() => setViewMode('mensile')}
                    >
                        Mensile
                    </Button>
                    <Button 
                        variant={viewMode === 'settimanale' ? 'default' : 'ghost'} 
                        size="sm"
                        onClick={() => setViewMode('settimanale')}
                    >
                        Settimanale
                    </Button>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={prevTimeSpan}
                        className="rounded bg-muted px-3 py-1 hover:bg-muted/80 text-sm font-medium"
                    >
                        &larr; Prec.
                    </button>
                    <span className="text-xl font-bold px-4 tracking-wide text-primary">
                        {viewMode === 'annuale' ? `Stagione ${startYear} - ${startYear + 1}` : 
                         viewMode === 'mensile' ? format(currentDateParam, "MMMM yyyy", { locale: it }).toUpperCase() : 
                         `Settimana del ${format(currentDateParam, "d MMM yyyy", { locale: it })}`}
                    </span>
                    <button 
                        onClick={nextTimeSpan}
                        className="rounded bg-muted px-3 py-1 hover:bg-muted/80 text-sm font-medium mr-4"
                    >
                        Succ. &rarr;
                    </button>
                    <Button onClick={() => setStrategicModalOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" /> Nuovo Evento Strategico
                    </Button>
                </div>
            </div>

            <Card className="w-full overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            Vista {viewMode === 'annuale' ? 'Annuale' : viewMode === 'mensile' ? 'Mensile' : 'Settimanale'}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm font-medium">
                            <div className="text-primary bg-primary/10 px-3 py-1 rounded-md hidden md:block border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
                                 onClick={() => {
                                     // Helper: go to today
                                     setViewMode('annuale');
                                     setStartYear(today.getMonth() < 8 ? today.getFullYear() - 1 : today.getFullYear());
                                     setCurrentDateParam(today);
                                 }}>
                                Giorno attuale: {format(today, "EEEE d MMMM", { locale: it })}
                            </div>
                            {viewMode === 'annuale' && (
                                <div className="flex items-center gap-2 text-muted-foreground border-l pl-4">
                                    <Filter className="h-4 w-4" />
                                    <span>Da Settembre {startYear} ad Agosto {startYear + 1}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-auto">
                    {/* PLANNING GRID Switch */}
                    {viewMode === 'annuale' && (
                        <div className="min-w-[1200px] border-b">
                            {/* Header Mesi */}
                            <div className="grid grid-cols-12 border-b bg-muted/50">
                                {MONTHS_ORDERED.map((monthObj, idx) => {
                                    const isAutumn = monthObj.monthIndex >= 8;
                                    const isCurrentMonth = monthObj.monthIndex === currentMonthIndex && 
                                        (monthObj.monthIndex < 8 ? startYear + 1 === today.getFullYear() : startYear === today.getFullYear());
                                    
                                    const themeStyle = isAutumn ? "bg-slate-200 text-slate-800" : "bg-blue-50/80 text-blue-800";
                                    const highlightStyle = isCurrentMonth ? "border-b-4 border-b-yellow-400 bg-yellow-100/50" : "";
                                    
                                    return (
                                        <div key={monthObj.label} className={`border-r px-2 py-3 text-center font-bold text-sm tracking-wide ${themeStyle} ${highlightStyle}`}>
                                            {monthObj.label} {monthObj.monthIndex < 8 ? startYear + 1 : startYear}
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Body Giorni */}
                            {daysArray.map(day => (
                                <div key={day} className="grid grid-cols-12 border-b group hover:bg-slate-50 duration-150 transition-colors">
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

                                        return (
                                            <div 
                                                key={`${day}-${monthColIndex}`} 
                                                className={`relative min-h-[50px] border-r p-1 text-xs ${
                                                    !isValidDay ? 'bg-slate-200' : 
                                                    (isToday ? 'bg-yellow-200 border-2 border-yellow-500 z-10 shadow-md scale-[1.02] transition-transform' : 
                                                    (holidayName || isSunday ? 'bg-red-50/50' : 
                                                    (isCurrentMonthCol ? 'bg-yellow-50/20' : 
                                                    (isSaturday ? 'bg-slate-100/50' : 'bg-white'))))
                                                }`}
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
                                        )
                                    })}
                                </div>
                            ))}
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
            </Card>

            <div className="flex flex-wrap gap-4 text-sm mt-4 p-4 border rounded bg-white shadow-sm">
                <div className="font-semibold mr-2 flex items-center">Legenda:</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Festività</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-50 border border-slate-200 rounded-sm"></div> Corsi (Aggregati)</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded-sm"></div> Chiusure/Vacanze</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-100 border border-indigo-300 rounded-sm"></div> Workshop</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-100 border border-amber-300 rounded-sm"></div> Domenica in mov.</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-teal-100 border border-teal-300 rounded-sm"></div> Campus</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-100 border border-rose-300 rounded-sm"></div> Saggi</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-200 border border-slate-300 rounded-sm"></div> Esterni</div>
            </div>

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
                            <Select defaultValue="chiusura">
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleziona tipologia..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="chiusura">Chiusura / Festività</SelectItem>
                                    <SelectItem value="ferie">Ferie Staff</SelectItem>
                                    <SelectItem value="apertura_eccezionale">Apertura Eccezionale</SelectItem>
                                    <SelectItem value="evento_macro">Evento Esterno Macro</SelectItem>
                                    <SelectItem value="nota">Nota Operativa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStrategicModalOpen(false)}>Annulla</Button>
                        <Button onClick={() => setStrategicModalOpen(false)}>Salva Evento (Mock)</Button>
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
