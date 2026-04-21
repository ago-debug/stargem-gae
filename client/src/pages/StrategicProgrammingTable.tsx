import React, { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, startOfWeek, endOfWeek, isBefore, isAfter, isSameDay, getDay } from "date-fns";
import { it } from "date-fns/locale";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSeasonLabel } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Save, Plus, CalendarDays, Rocket, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ActivityColorLegend } from "@/components/ActivityColorLegend";
import { apiRequest } from "@/lib/queryClient";

export default function StrategicProgrammingTable() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [, setLocation] = useLocation();

    // Queries
    const { data: seasons, isLoading: seasonsLoading } = useQuery<any[]>({ queryKey: ["/api/seasons"] });
    const { data: strategicEvents, isLoading: strategicLoading } = useQuery<any[]>({ queryKey: ["/api/strategic-events?seasonId=all"] });

    // Modals & States
    const [selectedSeasonId, setSelectedSeasonId] = useState<string>("active");
    const [eventModalOpen, setEventModalOpen] = useState(false);
    const [currentEditDate, setCurrentEditDate] = useState<Date | null>(null);

    // Modal Form State
    const [modalEventId, setModalEventId] = useState<number | null>(null);
    const [modalTitle, setModalTitle] = useState("");
    const [modalType, setModalType] = useState("chiusura");
    const [modalStartDate, setModalStartDate] = useState("");
    const [modalEndDate, setModalEndDate] = useState("");

    const activeSeasonObj = useMemo(() => {
        if (!seasons || seasons.length === 0) return null;
        return seasons.find((s) => s.active) || seasons[0];
    }, [seasons]);
    
    const targetSeason = useMemo(() => {
        if (!seasons || seasons.length === 0) return null;
        if (selectedSeasonId === "active") return activeSeasonObj;
        return seasons.find(s => s.id.toString() === selectedSeasonId);
    }, [seasons, selectedSeasonId, activeSeasonObj]);

    useEffect(() => {
        if (!seasons?.length) return;
        const now = new Date();
        if (now.getMonth() >= 1) { // February or later
            const activeSeason = seasons.find(s => s.active) || seasons[0];
            const activeIdx = seasons.findIndex(s => s.id === activeSeason.id);
            if (activeIdx === 0) {
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
                        queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
                    });
                }
            }
        }
    }, [seasons, queryClient]);

    // Mutation
    const saveEventMutation = useMutation({
        mutationFn: async (data: any) => {
            if (modalEventId) {
                return await apiRequest("PATCH", `/api/strategic-events/${modalEventId}`, data);
            }
            return await apiRequest("POST", "/api/strategic-events", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).includes('/api/strategic-events') });
            queryClient.invalidateQueries({ queryKey: ["/api/activities-unified-preview"], exact: false });
            setEventModalOpen(false);
            toast({ title: "Salvato", description: "Evento strategico registrato." });
        },
        onError: (error: any) => {
            toast({
                title: "Errore nel salvataggio",
                description: error?.message || "Riprova o contatta il supporto.",
                variant: "destructive"
            });
        }
    });

    const deleteEventMutation = useMutation({
        mutationFn: async (id: number) => {
            return await apiRequest("DELETE", `/api/strategic-events/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).includes('/api/strategic-events') });
            queryClient.invalidateQueries({ queryKey: ["/api/activities-unified-preview"], exact: false });
            setEventModalOpen(false);
            toast({ title: "Cancellato", description: "Evento rimosso con successo." });
            setModalEventId(null);
        }
    });

    const handleSaveEvent = () => {
        saveEventMutation.mutate({
            title: modalTitle,
            eventType: modalType,
            startDate: modalStartDate,
            endDate: modalEndDate || null,
            seasonId: targetSeason?.id || null,
            affectsCalendar: true,
            affectsPlanning: true,
            allDay: true,
            color: '#DC2626',
            isPublicHoliday: false
        });
    };

    const openCellModal = (date: Date) => {
        setCurrentEditDate(date);
        setModalEventId(null);
        const startStr = format(date, "yyyy-MM-dd");
        setModalStartDate(startStr);
        setModalEndDate(startStr); // Auto-fill data fine = data inizio
        setModalTitle("");
        setModalType("chiusura");
        setEventModalOpen(true);
    };

    const handleCellClick = (date: Date, dayEvts: any[]) => {
        // Cerca il primo evento NON-festività (creato manualmente)
        const editableEvent = dayEvts.find(e => e.isPublicHoliday !== true && e.isPublicHoliday !== 1);
        
        if (editableEvent) {
            // Se c'è un evento creato dall'utente, apri in modifica
            openEditModal(editableEvent);
        } else {
            // Se non c'è nulla, o c'è SOLO una festività di sistema (intoccabile), apri per creare un nuovo evento sovrapposto!
            openCellModal(date);
        }
    };

    const openEditModal = (evt: any) => {
        setCurrentEditDate(new Date(evt.startDate));
        setModalEventId(evt.id);
        const startStr = evt.startDate && typeof evt.startDate === 'string' ? evt.startDate.split('T')[0] : new Date(evt.startDate).toISOString().split('T')[0];
        setModalStartDate(startStr);
        const endStr = evt.endDate ? (typeof evt.endDate === 'string' ? evt.endDate.split('T')[0] : new Date(evt.endDate).toISOString().split('T')[0]) : startStr;
        setModalEndDate(endStr);
        setModalTitle(evt.title || "");
        setModalType(evt.eventType || "chiusura");
        setEventModalOpen(true);
    };

    // Computations
    const gridRows = useMemo(() => {
        if (!targetSeason) return [];
        const start = targetSeason.startDate ? new Date(targetSeason.startDate) : new Date(new Date().getFullYear(), 8, 1);
        const end = addDays(start, 364);
        
        let currentWeekStart = startOfWeek(start, { weekStartsOn: 1 });
        const rows = [];
        let weekNum = 1;

        while (isBefore(currentWeekStart, end) || isSameDay(currentWeekStart, end)) {
            const days = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
            rows.push({
                weekNum,
                start: currentWeekStart,
                end: days[6],
                days
            });
            currentWeekStart = addDays(currentWeekStart, 7);
            weekNum++;
        }
        return rows;
    }, [targetSeason]);

    const getEventsForDay = (date: Date) => {
        if (!strategicEvents) return [];
        return strategicEvents.filter(e => {
            const sDate = new Date(e.startDate);
            sDate.setHours(0,0,0,0);
            const eDate = e.endDate ? new Date(e.endDate) : new Date(e.startDate);
            eDate.setHours(23,59,59,999);
            return date >= sDate && date <= eDate;
        });
    };

    const getEventLabel = (evt: any) => {
        const isHoliday = evt?.isPublicHoliday === true || evt?.isPublicHoliday === 1;
        if (isHoliday) return `🇮🇹 FESTIVITÀ: ${evt?.title}`;
        switch(evt?.eventType) {
            case 'chiusura': return `🔒 CHIUSURA: ${evt?.title}`;
            case 'ferie':    return `🏖️ FERIE: ${evt?.title}`;
            case 'evento':   return `✨ EVENTO: ${evt?.title}`;
            case 'saggio':   return `🎭 SAGGIO: ${evt?.title}`;
            case 'campus':   return `🏕️ CAMPUS: ${evt?.title}`;
            default:         return `📌 ${evt?.eventType?.toUpperCase()}: ${evt?.title}`;
        }
    };

    // Auto-scroll logic
    const hasScrolledRef = useRef(false);
    useEffect(() => {
        if (!seasonsLoading && gridRows?.length > 0) {
            const el = document.getElementById("current-week-row");
            if (el && !hasScrolledRef.current) {
                // Scroll in visuale all'elemento, in modo morbido.
                setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                hasScrolledRef.current = true;
            }
        }
    }, [seasonsLoading, gridRows, targetSeason?.id]);

    // Reset scroller when changing seasons manually
    useEffect(() => {
        hasScrolledRef.current = false;
    }, [selectedSeasonId]);

    return (
        <div className="p-6 pb-0 flex flex-col h-[calc(100vh)] md:h-[calc(100vh-2rem)] overflow-hidden">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4 shrink-0 overflow-hidden">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                        <CalendarDays className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Programmazione Date
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Tabella master per la gestione annuale di ferie, chiusure e sospensioni didattiche.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar flex-nowrap w-full md:w-auto pb-1 md:pb-0">
                    <div className="flex items-center bg-white rounded-md border shadow-sm p-1 shrink-0 h-9">
                        <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
                            <SelectTrigger className="h-7 border-0 bg-transparent shadow-none w-[180px] font-bold text-slate-800 uppercase tracking-wide focus:ring-0">
                                <SelectValue placeholder="Seleziona stagione" />
                            </SelectTrigger>
                            <SelectContent>
                                {seasons?.map((s: any, idx: number) => {
                                    const isActiveFallback = s.active || (!seasons.find((x) => x.active) && idx === 0);
                                    return (
                                        <SelectItem key={s.id} value={isActiveFallback ? "active" : s.id.toString()} className={isActiveFallback ? "font-bold" : ""}>
                                            {getSeasonLabel(s, seasons)}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                            document.getElementById('current-week-row')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="font-medium text-slate-700 bg-white border-slate-200 hover:bg-slate-50 gap-2 shrink-0 h-9"
                    >
                        <span className="text-red-500 font-bold hidden sm:inline">Oggi:</span> 
                        <span className="text-red-600 sm:text-slate-700">{format(new Date(), "d MMM", { locale: it })}</span>
                    </Button>

                    <ActivityColorLegend variant="popover" />
                    
                    <Button onClick={() => openCellModal(new Date())} size="sm" className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-sm h-9 shrink-0">
                        <Plus className="w-4 h-4" /> Aggiungi Evento
                    </Button>
                </div>
            </div>

            <Card className="flex-1 overflow-hidden flex flex-col shadow-xl">
                <div className="flex-1 overflow-auto bg-white p-0 relative">
                    <table className="w-full text-xs text-left border-collapse border-slate-200">
                        <thead className="sticky top-0 bg-slate-100 shadow-sm z-10">
                            <tr>
                                <th className="border p-2 w-[50px] text-center text-slate-500">Sett</th>
                                <th className="border p-2 min-w-[120px] text-slate-600">Periodo</th>
                                {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
                                    <th key={d} className={`border p-2 min-w-[150px] text-center font-bold uppercase ${d === 'Dom' ? 'bg-red-50 text-red-700/80 tracking-wide' : 'text-slate-700'}`}>{d}</th>
                                ))}
                                <th className="border p-2 min-w-[250px]">Note (Chiusure / Eventi)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {gridRows.map(row => {
                                // Extract notes for the week if any
                                const weekEvents = row.days.flatMap(d => getEventsForDay(d));
                                const uniqueEvents = Array.from(new Set(weekEvents.map(e => e.id)))
                                                          .map(id => weekEvents.find(e => e.id === id))
                                                          .filter(Boolean);

                                const todayStart = new Date();
                                const isCurrentWeek = row.start <= todayStart && addDays(row.end, 1) > todayStart;

                                return (
                                    <tr 
                                        key={row.weekNum} 
                                        id={isCurrentWeek ? "current-week-row" : undefined}
                                        className={`hover:bg-slate-50/80 transition-colors group ${isCurrentWeek ? 'bg-yellow-50/40 ring-1 ring-yellow-400' : ''}`}
                                    >
                                        <td className="border p-2 text-center font-bold text-slate-400">{row.weekNum}</td>
                                        <td className="border p-2 font-mono text-[10px] text-slate-600 font-medium">
                                            {format(row.start, "dd/MM")} - {format(row.end, "dd/MM/yy")}
                                        </td>
                                        {row.days.map(day => {
                                            const dayEvts = getEventsForDay(day);
                                            const isSunday = getDay(day) === 0;
                                            
                                            // Determine background color based on events
                                            let bgColor = isSunday ? 'bg-red-50/40' : '';
                                            let cellContent = format(day, "d MMM", { locale: it });

                                            if (dayEvts.length > 0) {
                                                const hasSystemHoliday = dayEvts.some(e => e.isPublicHoliday === true || e.isPublicHoliday === 1);
                                                
                                                if (hasSystemHoliday) {
                                                    bgColor = 'bg-red-50 text-red-700 border-x border-red-200';
                                                }
                                            }

                                            return (
                                                <td 
                                                    key={day.toISOString()} 
                                                    className={`border p-1.5 text-center align-top cursor-cell hover:brightness-95 transition-all ${bgColor}`}
                                                    onClick={() => openCellModal(day)}
                                                    title="Clicca sullo spazio per aggiungere un evento sovrapposto"
                                                >
                                                    <div className="font-semibold mb-1">{format(day, "d")}</div>
                                                    <div className="flex flex-col gap-1 items-center w-full">
                                                        {dayEvts.map(evt => {
                                                            const isHoliday = evt.isPublicHoliday === true || evt.isPublicHoliday === 1;
                                                            return (
                                                                <div 
                                                                    key={evt.id}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (!isHoliday) {
                                                                            openEditModal(evt);
                                                                        }
                                                                    }}
                                                                    className={`text-[10px] sm:text-[11px] leading-tight w-full py-0.5 text-center text-balance break-words focus:outline-none ${
                                                                        isHoliday 
                                                                            ? 'text-red-700 font-bold tracking-tight' 
                                                                            : (() => {
                                                                                const t = (evt.title || '').toUpperCase();
                                                                                const type = evt.eventType;
                                                                                let color = 'bg-white/95 text-slate-800'; // Default
                                                                                if (type === 'chiusura' || t.includes('STRAORDINARI')) color = 'bg-orange-100 text-orange-800 border-l border-orange-400';
                                                                                else if (type === 'ferie' || t.includes('FERIE')) color = 'bg-[#9D174D]/10 text-[#9D174D] border-l border-[#9D174D]/50';
                                                                                else if (type === 'campus' || t.includes('CAM')) color = 'bg-sky-100 text-sky-800 border-l border-sky-400';
                                                                                else if (type === 'saggio' || t.includes('SAG')) color = 'bg-pink-100 text-pink-800 border-l border-pink-400';
                                                                                else if (t.includes('WS')) color = 'bg-orange-100 text-orange-800 border-l border-orange-400';
                                                                                else if (t.includes('VAC')) color = 'bg-emerald-100 text-emerald-800 border-l border-emerald-400';
                                                                                else if (type === 'nota' || t.includes('PROMO')) color = 'bg-yellow-100 text-yellow-800 border-l border-yellow-400';
                                                                                else if (type === 'evento') color = 'bg-indigo-50 text-indigo-800 border-l border-indigo-400';
                                                                                else if (t.includes('AFT')) color = 'bg-slate-200 text-slate-800 border-l border-slate-400';
                                                                                
                                                                                return `cursor-pointer rounded px-1.5 py-1 font-medium transition-all hover:opacity-90 shadow-sm ${color}`;
                                                                              })()
                                                                    }`}
                                                                    title={isHoliday ? "Festività (non modificabile)" : "Clicca per modificare questo evento speciale"}
                                                                >
                                                                    {evt.title}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className="border p-2 align-top text-[11px] text-slate-700 bg-slate-50/30">
                                            <div className="flex flex-col gap-1">
                                                {uniqueEvents.length === 0 ? (
                                                    <span className="text-slate-400 italic text-[10px]">Nessuna nota in questa settimana</span>
                                                ) : (
                                                    uniqueEvents.map(evt => (
                                                        <div key={evt?.id} className="font-medium bg-white p-1.5 rounded shadow-sm border border-slate-100 flex items-start justify-between group/evt">
                                                            <div className="flex flex-col text-[12px] leading-tight mt-0.5">
                                                                <span>{getEventLabel(evt)}</span>
                                                                {evt?.description && <span className="text-slate-500 font-medium text-[11px]">({evt.description})</span>}
                                                            </div>
                                                            <div className="flex gap-1 ml-2 shrink-0 transition-opacity">
                                                                {(() => {
                                                                    const t = (evt.title || '').toUpperCase();
                                                                    const isCampus = evt?.eventType === 'campus' || t.includes('CAM');
                                                                    const isSaggio = evt?.eventType === 'saggio' || t.includes('SAG');
                                                                    const isWorkshop = t.includes('WS');
                                                                    const isDom = t.includes('DOM');
                                                                    const isVac = t.includes('VAC');
                                                                    const isAft = t.includes('AFT');
                                                                    
                                                                    const hasRocket = isCampus || isSaggio || isWorkshop || isDom || isVac || isAft;
                                                                    let targetUrl = '';
                                                                    let label = '';
                                                                    
                                                                    if (isCampus) { targetUrl = '/attivita/campus'; label = 'Campus'; }
                                                                    else if (isSaggio) { targetUrl = '/attivita/saggi'; label = 'Saggi'; }
                                                                    else if (isWorkshop) { targetUrl = '/attivita/workshop'; label = 'Workshop'; }
                                                                    else if (isDom) { targetUrl = '/attivita/domeniche'; label = 'Domeniche in Movimento'; }
                                                                    else if (isVac) { targetUrl = '/attivita/vacanze'; label = 'Vacanze Studio'; }
                                                                    else if (isAft) { targetUrl = '/attivita/affitti'; label = 'Affitti Sale'; }

                                                                    if (!hasRocket) return null;

                                                                    return (
                                                                        <Button 
                                                                            size="icon" 
                                                                            variant="ghost" 
                                                                            className="h-6 w-6 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-100" 
                                                                            title={`Sviluppa Operativamente in ${label}`}
                                                                            onClick={() => {
                                                                                const startD = evt.startDate && typeof evt.startDate === 'string' ? evt.startDate.split('T')[0] : new Date(evt.startDate).toISOString().split('T')[0];
                                                                                const endD = evt.endDate ? (typeof evt.endDate === 'string' ? evt.endDate.split('T')[0] : new Date(evt.endDate).toISOString().split('T')[0]) : startD;
                                                                                setLocation(`${targetUrl}?draftMode=true&title=${encodeURIComponent(evt.title || '')}&startDate=${startD}&endDate=${endD}`);
                                                                            }}
                                                                        >
                                                                            <Rocket className="h-3 w-3" />
                                                                        </Button>
                                                                    );
                                                                })()}
                                                                <Button 
                                                                    size="icon" 
                                                                    variant="ghost" 
                                                                    className="h-6 w-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100" 
                                                                    onClick={() => openEditModal(evt)} 
                                                                    title="Modifica Data Strategica"
                                                                >
                                                                    <Edit2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="sticky bottom-0 bg-slate-100 shadow-[0_-1px_3px_rgba(0,0,0,0.1)] z-10">
                            <tr>
                                <td colSpan={2} className="border p-2 font-bold text-slate-700 text-right">Totale Lezioni (Adulti)</td>
                                {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((d, index) => {
                                    const totalWeeks = gridRows.length;
                                    let excluded = 0;
                                    gridRows.forEach(row => {
                                        const day = row.days[index];
                                        const evts = getEventsForDay(day);
                                        const isClosed = evts.some(e => {
                                            const type = e.eventType;
                                            const title = (e.title || "").toUpperCase();
                                            return type === 'chiusura' || type === 'ferie' || title.includes('CHIUSO') || title.includes('NO CORSI') || title.includes('PROVA');
                                        });
                                        if (isClosed) excluded++;
                                    });
                                    return <td key={d} className="border p-2 text-center font-bold text-slate-900 bg-white">{totalWeeks - excluded}</td>;
                                })}
                                <td className="border p-2 bg-slate-100"></td>
                            </tr>
                            <tr>
                                <td colSpan={2} className="border p-2 font-bold text-slate-700 text-right">Totale Lezioni (Bambini)</td>
                                {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((d, index) => {
                                    const totalWeeks = gridRows.length;
                                    let excluded = 0;
                                    gridRows.forEach(row => {
                                        const day = row.days[index];
                                        const evts = getEventsForDay(day);
                                        const isAdultExcluded = evts.some(e => {
                                            const type = e.eventType;
                                            const title = (e.title || "").toUpperCase();
                                            return type === 'chiusura' || type === 'ferie' || title.includes('CHIUSO') || title.includes('NO CORSI') || title.includes('PROVA');
                                        });
                                        const isKidsExcluded = evts.some(e => (e.title || "").toUpperCase().includes('NO BAMBINI'));
                                        if (isAdultExcluded || isKidsExcluded) excluded++;
                                    });
                                    return <td key={`kids-${d}`} className="border p-2 text-center font-bold text-slate-900 bg-teal-50">{totalWeeks - excluded}</td>;
                                })}
                                <td className="border p-2 bg-slate-100"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </Card>

            <Dialog open={eventModalOpen} onOpenChange={setEventModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Imposta Data Strategica</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Tipologia Evento / Chiusura</Label>
                            <Select value={modalType} onValueChange={setModalType}>
                                <SelectTrigger>
                                    <SelectValue />
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
                            <Label>Titolo (Es. "Pasqua", "Chiusura Invernale")</Label>
                            <Input value={modalTitle} onChange={e => setModalTitle(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Data Inizio</Label>
                                <Input type="date" value={modalStartDate} onChange={e => {
                                    setModalStartDate(e.target.value);
                                    if (!modalEndDate || modalEndDate === modalStartDate) {
                                        setModalEndDate(e.target.value);
                                    }
                                }} />
                            </div>
                            <div className="space-y-2">
                                <Label>Data Fine <span className="text-red-500">*</span></Label>
                                <Input type="date" value={modalEndDate} onChange={e => setModalEndDate(e.target.value)} />
                                {!modalEndDate && <p className="text-[10px] text-red-500 font-medium">Obbligatoria</p>}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="flex justify-between sm:justify-between w-full">
                        {modalEventId ? (
                            <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600" onClick={() => deleteEventMutation.mutate(modalEventId)} disabled={deleteEventMutation.isPending}>
                                Elimina
                            </Button>
                        ) : (
                            <div></div>
                        )}
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setEventModalOpen(false)}>Annulla</Button>
                            <Button onClick={handleSaveEvent} disabled={!modalTitle || !modalStartDate || !modalEndDate || saveEventMutation.isPending}>
                                {saveEventMutation.isPending ? "Salvataggio..." : "Salva Evento"}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
