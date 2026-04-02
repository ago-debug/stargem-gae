import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, startOfWeek, endOfWeek, isBefore, isAfter, isSameDay, getDay } from "date-fns";
import { it } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Save, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";

export default function StrategicProgrammingTable() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Queries
    const { data: seasons, isLoading: seasonsLoading } = useQuery<any[]>({ queryKey: ["/api/seasons"] });
    const { data: strategicEvents, isLoading: strategicLoading } = useQuery<any[]>({ queryKey: ["/api/strategic-events?seasonId=all"] });

    // Modals & States
    const [selectedSeasonId, setSelectedSeasonId] = useState<string>("active");
    const [eventModalOpen, setEventModalOpen] = useState(false);
    const [currentEditDate, setCurrentEditDate] = useState<Date | null>(null);

    // Modal Form State
    const [modalTitle, setModalTitle] = useState("");
    const [modalType, setModalType] = useState("chiusura");
    const [modalStartDate, setModalStartDate] = useState("");
    const [modalEndDate, setModalEndDate] = useState("");

    const activeSeasonObj = useMemo(() => {
        if (!seasons || seasons.length === 0) return null;
        return seasons.find((s) => s.status === 'active') || seasons[0];
    }, [seasons]);
    
    const targetSeason = useMemo(() => {
        if (!seasons || seasons.length === 0) return null;
        if (selectedSeasonId === "active") return activeSeasonObj;
        return seasons.find(s => s.id.toString() === selectedSeasonId);
    }, [seasons, selectedSeasonId, activeSeasonObj]);

    // Mutation
    const saveEventMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/strategic-events", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/strategic-events?seasonId=all"] });
            queryClient.invalidateQueries({ queryKey: ["/api/activities-unified-preview"] });
            setEventModalOpen(false);
            toast({ title: "Salvato", description: "Evento strategico registrato." });
        }
    });

    const handleSaveEvent = () => {
        saveEventMutation.mutate({
            title: modalTitle,
            eventType: modalType,
            startDate: modalStartDate,
            endDate: modalEndDate || null,
            seasonId: targetSeason?.id || null,
        });
    };

    const openCellModal = (date: Date) => {
        setCurrentEditDate(date);
        setModalStartDate(format(date, "yyyy-MM-dd"));
        setModalEndDate("");
        setModalTitle("");
        setModalType("chiusura");
        setEventModalOpen(true);
    };

    // Computations
    const gridRows = useMemo(() => {
        if (!targetSeason) return [];
        const start = targetSeason.startDate ? new Date(targetSeason.startDate) : new Date(new Date().getFullYear(), 8, 1);
        const end = targetSeason.endDate ? new Date(targetSeason.endDate) : new Date(new Date().getFullYear() + 1, 7, 31);
        
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

    if (seasonsLoading) return <div className="p-8">Caricamento...</div>;

    return (
        <div className="flex-1 w-full bg-slate-50 p-6 flex flex-col min-h-screen">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 border-l-4 border-primary pl-4 rounded-sm">
                        Programmazione Date Strategiche
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 pl-5">
                        Tabella master per la gestione annuale di ferie, chiusure e sospensioni didattiche.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="space-y-1">
                        <Label className="text-xs uppercase font-bold ml-1">Stagione Visualizzata</Label>
                        <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
                            <SelectTrigger className="w-[200px] bg-white">
                                <CalendarIcon className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Seleziona stagione" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active" className="font-bold">Attiva ({activeSeasonObj?.name})</SelectItem>
                                {seasons?.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <Card className="flex-1 overflow-hidden flex flex-col shadow-xl">
                <CardHeader className="bg-slate-100/50 border-b pb-4">
                    <CardTitle className="text-lg flex items-center justify-between">
                        Foglio Operativo: Stagione {targetSeason?.name}
                        <Button size="sm" onClick={() => openCellModal(new Date())}>
                            <Plus className="w-4 h-4 mr-2" /> Aggiungi Evento
                        </Button>
                    </CardTitle>
                </CardHeader>
                <div className="flex-1 overflow-auto bg-white p-0 relative">
                    <table className="w-full text-xs text-left border-collapse border-slate-200">
                        <thead className="sticky top-0 bg-slate-100 shadow-sm z-10">
                            <tr>
                                <th className="border p-2 w-[50px] text-center text-slate-500">Sett</th>
                                <th className="border p-2 w-[120px] text-slate-600">Periodo</th>
                                {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
                                    <th key={d} className="border p-2 w-[80px] text-center font-bold text-slate-700 uppercase">{d}</th>
                                ))}
                                <th className="border p-2 min-w-[200px]">Note (Chiusure / Eventi)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {gridRows.map(row => {
                                // Extract notes for the week if any
                                const weekEvents = row.days.flatMap(d => getEventsForDay(d));
                                const uniqueEvents = Array.from(new Set(weekEvents.map(e => e.id)))
                                                          .map(id => weekEvents.find(e => e.id === id))
                                                          .filter(Boolean);

                                return (
                                    <tr key={row.weekNum} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="border p-2 text-center font-bold text-slate-400">{row.weekNum}</td>
                                        <td className="border p-2 font-mono text-[10px] text-slate-600 font-medium">
                                            {format(row.start, "dd/MM")} - {format(row.end, "dd/MM/yy")}
                                        </td>
                                        {row.days.map(day => {
                                            const dayEvts = getEventsForDay(day);
                                            const isSunday = getDay(day) === 0;
                                            
                                            // Determine background color based on events
                                            let bgColor = isSunday ? 'bg-orange-50/30' : '';
                                            let cellContent = format(day, "d MMM", { locale: it });

                                            if (dayEvts.length > 0) {
                                                const priorityEvt = dayEvts[0] || {};
                                                if (priorityEvt.eventType === 'chiusura') bgColor = 'bg-red-100 text-red-900 border-red-200';
                                                else if (priorityEvt.eventType === 'ferie') bgColor = 'bg-purple-100 text-purple-900 border-purple-200';
                                                else if (priorityEvt.eventType === 'evento_macro') bgColor = 'bg-blue-100 text-blue-900 border-blue-200';
                                                else bgColor = 'bg-yellow-100 text-yellow-900 border-yellow-200';
                                            }

                                            return (
                                                <td 
                                                    key={day.toISOString()} 
                                                    className={`border p-1.5 text-center cursor-pointer hover:ring-2 ring-primary/40 focus:outline-none transition-all ${bgColor}`}
                                                    onClick={() => openCellModal(day)}
                                                    title="Clicca per aggiungere chiusura/evento"
                                                >
                                                    <div className="font-semibold">{format(day, "d")}</div>
                                                    <div className="text-[9px] opacity-70 truncate max-w-[80px] mx-auto">
                                                        {dayEvts.map(e => e?.title).join(', ')}
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
                                                        <div key={evt?.id} className="font-medium bg-white p-1 rounded shadow-sm border border-slate-100 flex items-center justify-between">
                                                            <span><strong className="uppercase">{evt?.eventType}:</strong> {evt?.title}</span>
                                                            {evt?.description && <span className="text-slate-400">({evt.description})</span>}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
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
                                    <SelectItem value="chiusura">Chiusura Straordinaria / Festività</SelectItem>
                                    <SelectItem value="ferie">Ferie / Vacanze</SelectItem>
                                    <SelectItem value="evento_macro">Evento Macro / Saggio / Gara</SelectItem>
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
                                <Input type="date" value={modalStartDate} onChange={e => setModalStartDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Data Fine (opzionale)</Label>
                                <Input type="date" value={modalEndDate} onChange={e => setModalEndDate(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEventModalOpen(false)}>Annulla</Button>
                        <Button onClick={handleSaveEvent} disabled={!modalTitle || !modalStartDate || saveEventMutation.isPending}>
                            {saveEventMutation.isPending ? "Salvataggio..." : "Salva Evento"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
