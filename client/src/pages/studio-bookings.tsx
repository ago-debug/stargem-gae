import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
    Search,
    Plus,
    Edit,
    Trash2,
    Calendar,
    MapPin,
    Clock,
    User,
    Check,
    X,
    MoreHorizontal,
    CreditCard,
    ChevronsUpDown,
    Mail,
    Phone,
    UserPlus,
    CalendarPlus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import type { StudioBooking, Member, Studio, BookingService, PaymentMethod, Instructor } from "@shared/schema";
import { format, isSameDay } from "date-fns";
import { it } from "date-fns/locale";
import { Combobox } from "@/components/ui/combobox";

const WEEKDAYS = [
    { id: "LUN", label: "Lunedì", short: "Lun" },
    { id: "MAR", label: "Martedì", short: "Mar" },
    { id: "MER", label: "Mercoledì", short: "Mer" },
    { id: "GIO", label: "Giovedì", short: "Gio" },
    { id: "VEN", label: "Venerdì", short: "Ven" },
    { id: "SAB", label: "Sabato", short: "Sab" },
    { id: "DOM", label: "Domenica", short: "Dom" },
];

const TIME_SLOTS = Array.from({ length: 288 }, (_, i) => {
    const hour = Math.floor(i / 12);
    const minute = (i % 12) * 5;
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

export default function StudioBookings() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [studioFilter, setStudioFilter] = useState<string>("all");
    const [dateFilter, setDateFilter] = useState<string>("");

    const [editingBooking, setEditingBooking] = useState<Partial<StudioBooking> | null>(null);
    const [bookingForm, setBookingForm] = useState<any>({});

    // Member search states for modal
    const [memberSearchOpen, setMemberSearchOpen] = useState(false);
    const [serviceSearchOpen, setServiceSearchOpen] = useState(false);
    const [instructorSearchOpen, setInstructorSearchOpen] = useState(false);
    const [searchBookingMemberQuery, setSearchBookingMemberQuery] = useState("");
    const [lastAddedMember, setLastAddedMember] = useState<any>(null);
    const [showFreeSlots, setShowFreeSlots] = useState(false);
    const [quickAddMemberOpen, setQuickAddMemberOpen] = useState(false);
    const [quickAddServiceOpen, setQuickAddServiceOpen] = useState(false);
    const [newMemberForm, setNewMemberForm] = useState({
        firstName: "", lastName: "", email: "", mobile: "",
        fiscalCode: "", dateOfBirth: "", placeOfBirth: "", gender: "M",
        streetAddress: "", city: "", province: "", notes: ""
    });
    const [newServiceForm, setNewServiceForm] = useState({ name: "", price: "0", color: "#3b82f6" });

    // Queries
    const { data: bookings, isLoading: bookingsLoading } = useQuery<any[]>({
        queryKey: ["/api/studio-bookings"],
    });

    const { data: studios } = useQuery<Studio[]>({
        queryKey: ["/api/studios"],
    });

    const { data: bookingServices } = useQuery<BookingService[]>({
        queryKey: ["/api/booking-services"],
    });

    const { data: membersData } = useQuery<any>({
        queryKey: ["/api/members"],
    });

    const { data: instructors } = useQuery<Instructor[]>({
        queryKey: ["/api/instructors"],
    });

    const { data: paymentMethods } = useQuery<PaymentMethod[]>({
        queryKey: ["/api/payment-methods"],
    });

    const { data: courses } = useQuery<any[]>({
        queryKey: ["/api/courses"],
    });

    const { data: bookingSearchData } = useQuery<{ members: Member[], total: number }>({
        queryKey: ["/api/members", { search: searchBookingMemberQuery }],
        queryFn: async () => {
            const res = await fetch(`/api/members?search=${encodeURIComponent(searchBookingMemberQuery)}&pageSize=50`);
            return res.json();
        },
        enabled: searchBookingMemberQuery.length >= 2,
    });

    const members = (Array.isArray(membersData) ? membersData : (membersData?.members || [])) as Member[];

    const sortedInstructors = useMemo(() => {
        if (!instructors) return [];
        return [...instructors].sort((a, b) => (a.lastName || "").localeCompare(b.lastName || ""));
    }, [instructors]);

    // Mutations
    const createBookingMutation = useMutation({
        mutationFn: async (data: any) => {
            try {
                return await apiRequest("POST", "/api/studio-bookings", data);
            } catch (err: any) {
                if (err.status === 409) {
                    if (confirm(err.message)) {
                        return await apiRequest("POST", "/api/studio-bookings", { ...data, force: true });
                    }
                    throw new Error("Operazione annullata");
                }
                throw err;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/studio-bookings"] });
            toast({ title: "Prenotazione creata", description: "La prenotazione è stata salvata correttamente." });
            setEditingBooking(null);
        },
        onError: (err: any) => {
            if (err.message !== "Operazione annullata") {
                toast({ title: "Errore", description: err.message, variant: "destructive" });
            }
        }
    });

    const updateBookingMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            try {
                return await apiRequest("PATCH", `/api/studio-bookings/${id}`, data);
            } catch (err: any) {
                if (err.status === 409) {
                    if (confirm(err.message)) {
                        return await apiRequest("PATCH", `/api/studio-bookings/${id}`, { ...data, force: true });
                    }
                    throw new Error("Operazione annullata");
                }
                throw err;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/studio-bookings"] });
            toast({ title: "Prenotazione aggiornata", description: "Le modifiche sono state salvate correttamente." });
            setEditingBooking(null);
        },
        onError: (err: any) => {
            if (err.message !== "Operazione annullata") {
                toast({ title: "Errore", description: err.message, variant: "destructive" });
            }
        }
    });

    const deleteBookingMutation = useMutation({
        mutationFn: async (id: number) => {
            return await apiRequest("DELETE", `/api/studio-bookings/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/studio-bookings"] });
            toast({ title: "Prenotazione eliminata", description: "La prenotazione è stata rimossa correttamente." });
        },
        onError: (err: Error) => {
            toast({ title: "Errore", description: err.message, variant: "destructive" });
        }
    });

    const createMemberMutation = useMutation({
        mutationFn: async (data: any) => {
            return await apiRequest("POST", "/api/members", data);
        },
        onSuccess: (newMember) => {
            queryClient.invalidateQueries({ queryKey: ["/api/members"] });
            setLastAddedMember(newMember);
            setBookingForm((prev: any) => ({
                ...prev,
                memberId: newMember.id,
                memberFirstName: newMember.firstName,
                memberLastName: newMember.lastName,
                memberEmail: newMember.email,
                memberPhone: newMember.phone || newMember.mobile
            }));
            setQuickAddMemberOpen(false);
            toast({ title: "Cliente creato", description: "Il nuovo partecipante è stato aggiunto e selezionato." });
        },
        onError: (err: any) => {
            toast({ title: "Errore", description: err.message, variant: "destructive" });
        }
    });

    const createServiceMutation = useMutation({
        mutationFn: async (data: any) => {
            return await apiRequest("POST", "/api/booking-services", data);
        },
        onSuccess: (newService) => {
            queryClient.invalidateQueries({ queryKey: ["/api/booking-services"] });
            setBookingForm((prev: any) => ({
                ...prev,
                serviceId: newService.id,
                title: newService.name,
                amount: newService.price?.toString() || "0"
            }));
            setQuickAddServiceOpen(false);
            toast({ title: "Servizio creato", description: "Il nuovo servizio è stato aggiunto e selezionato." });
        },
        onError: (err: any) => {
            toast({ title: "Errore", description: err.message, variant: "destructive" });
        }
    });

    const handleCFChange = (val: string) => {
        const cf = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
        setNewMemberForm(p => ({ ...p, fiscalCode: cf }));
    };

    const getDayId = (date: Date) => {
        const day = date.getDay();
        const index = day === 0 ? 6 : day - 1;
        return WEEKDAYS[index].id;
    };

    const freeSlots = useMemo(() => {
        if (!bookingForm.bookingDate || !bookingForm.studioId) return [];

        const dateObj = new Date(bookingForm.bookingDate);
        const dateStr = format(dateObj, 'yyyy-MM-dd');
        const dayId = getDayId(dateObj);
        const studioId = bookingForm.studioId;

        const dayCourses = (courses || []).filter(c => c.studioId === studioId && c.dayOfWeek === dayId && (c.active === undefined || c.active));
        const dayBookings = (bookings || []).filter(b => {
            if (b.studioId !== studioId) return false;
            const bDateStr = format(new Date(b.bookingDate), 'yyyy-MM-dd');
            if (bDateStr !== dateStr) return false;
            if (bookingForm.id && b.id === bookingForm.id) return false;
            if (b.status === 'cancelled') return false;
            return true;
        });

        const busy = [
            ...dayCourses.map(c => ({ start: c.startTime, end: c.endTime })),
            ...dayBookings.map(b => ({ start: b.startTime, end: b.endTime }))
        ];

        const slots: { start: string, end: string }[] = [];
        let currentStartStr: string | null = null;
        const relevantSlots = TIME_SLOTS.filter(t => t >= "07:00" && t <= "22:00");

        const isTimeBusy = (t: string) => busy.some(range => t >= range.start && t < range.end);

        // First find continuous free segments
        const segments: { start: string, end: string }[] = [];
        relevantSlots.forEach((t) => {
            const isBusy = isTimeBusy(t);
            if (!isBusy) {
                if (currentStartStr === null) currentStartStr = t;
            } else {
                if (currentStartStr !== null) {
                    segments.push({ start: currentStartStr, end: t });
                    currentStartStr = null;
                }
            }
        });
        if (currentStartStr !== null) {
            segments.push({ start: currentStartStr, end: "22:00" });
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

            // If there's a smaller remainder at the end of the segment, add it too
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
    }, [bookingForm.bookingDate, bookingForm.studioId, courses, bookings, bookingForm.id]);

    // Filtering logic
    const filteredBookings = useMemo(() => {
        if (!bookings) return [];

        return bookings.filter(b => {
            // Text search
            if (searchQuery) {
                const s = searchQuery.toLowerCase();
                const memberName = `${b.memberFirstName || ''} ${b.memberLastName || ''}`.toLowerCase();
                const serviceName = (b.serviceName || '').toLowerCase();
                const title = (b.title || '').toLowerCase();
                const studioName = (b.studioName || '').toLowerCase();

                if (!memberName.includes(s) && !serviceName.includes(s) && !title.includes(s) && !studioName.includes(s)) {
                    return false;
                }
            }

            // Status filter
            if (statusFilter !== "all" && b.status !== statusFilter) return false;

            // Studio filter
            if (studioFilter !== "all" && b.studioId.toString() !== studioFilter) return false;

            // Date filter
            if (dateFilter) {
                const bDate = new Date(b.bookingDate).toISOString().split('T')[0];
                if (bDate !== dateFilter) return false;
            }

            return true;
        }).sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
    }, [bookings, searchQuery, statusFilter, studioFilter, dateFilter]);

    const { sortConfig, handleSort, sortItems, isSortedColumn } = useSortableTable<any>("datetime");

    const getSortValue = (b: any, key: string) => {
        switch (key) {
            case "datetime": return new Date(b.bookingDate).toISOString() + b.startTime;
            case "studioName": return b.studioName || "Sala";
            case "instructor": return b.instructorFirstName ? `${b.instructorFirstName} ${b.instructorLastName}` : "";
            case "service": return b.serviceName || b.title || "Servizio";
            case "member": return b.memberFirstName ? `${b.memberFirstName} ${b.memberLastName}` : (b.title || "");
            case "status": return b.status || "";
            case "paid": return b.paid ? 1 : 0;
            default: return null;
        }
    };

    const sortedBookings = sortItems(filteredBookings, getSortValue);

    const handleCreateBooking = () => {
        const today = new Date();
        const hour = Math.max(8, today.getHours() + 1);
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

        const newBooking: any = {
            studioId: studios?.[0]?.id || 1,
            bookingDate: today,
            startTime,
            endTime,
            status: "confirmed",
            paid: false,
            amount: "0",
            isCustom: false
        };
        setEditingBooking(newBooking);
        setBookingForm(newBooking);
    };

    const handleEditBooking = (booking: any) => {
        setEditingBooking(booking);
        setBookingForm({
            ...booking,
            bookingDate: new Date(booking.bookingDate),
            isCustom: !booking.serviceId && !!booking.title
        });
    };

    const handleSaveBooking = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingBooking?.id) {
            updateBookingMutation.mutate({ id: editingBooking.id, data: bookingForm });
        } else {
            createBookingMutation.mutate(bookingForm);
        }
    };

    const handleDeleteBooking = (id: number) => {
        if (confirm("Sei sicuro di voler eliminare questa prenotazione?")) {
            deleteBookingMutation.mutate(id);
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-6 mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold text-foreground mb-2">Affitti</h1>
                    <p className="text-muted-foreground">Gestione completa delle prenotazioni e affitti</p>
                </div>
                <Button onClick={handleCreateBooking}>
                    <Plus className="w-4 h-4 mr-2" /> Nuova Prenotazione
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Cerca partecipante, servizio..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Stato" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tutti gli stati</SelectItem>
                                <SelectItem value="confirmed">Confermata</SelectItem>
                                <SelectItem value="pending">In attesa</SelectItem>
                                <SelectItem value="cancelled">Annullata</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={studioFilter} onValueChange={setStudioFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sala" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tutte le sale</SelectItem>
                                {studios?.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="relative">
                            <Input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full"
                            />
                            {dateFilter && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6"
                                    onClick={() => setDateFilter("")}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <SortableTableHead sortKey="datetime" currentSort={sortConfig} onSort={handleSort}>Data e Ora</SortableTableHead>
                                    <SortableTableHead sortKey="studioName" currentSort={sortConfig} onSort={handleSort}>Sala</SortableTableHead>
                                    <SortableTableHead sortKey="instructor" currentSort={sortConfig} onSort={handleSort}>Insegnante</SortableTableHead>
                                    <SortableTableHead sortKey="service" currentSort={sortConfig} onSort={handleSort}>Servizio</SortableTableHead>
                                    <SortableTableHead sortKey="member" currentSort={sortConfig} onSort={handleSort}>Partecipante</SortableTableHead>
                                    <SortableTableHead sortKey="status" currentSort={sortConfig} onSort={handleSort}>Stato</SortableTableHead>
                                    <SortableTableHead sortKey="paid" currentSort={sortConfig} onSort={handleSort}>Pagamento</SortableTableHead>
                                    <TableHead className="text-right">Azioni</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bookingsLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">Caricamento...</TableCell>
                                    </TableRow>
                                ) : filteredBookings.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            Nessuna prenotazione trovata
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedBookings.map((b) => (
                                        <TableRow key={b.id}>
                                            <TableCell className={cn("font-medium", isSortedColumn("datetime") && "sorted-column-cell")}>
                                                <div className="flex flex-col">
                                                    <span>{format(new Date(b.bookingDate), 'dd/MM/yyyy')}</span>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> {b.startTime} - {b.endTime}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className={cn(isSortedColumn("studioName") && "sorted-column-cell")}>
                                                <Badge variant="outline" className="bg-slate-50">
                                                    {b.studioName || "Sala"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={cn(isSortedColumn("instructor") && "sorted-column-cell")}>
                                                {b.instructorFirstName ? (
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-muted-foreground" />
                                                        <span className="text-sm">{b.instructorFirstName} {b.instructorLastName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground italic text-xs">Nessuno</span>
                                                )}
                                            </TableCell>
                                            <TableCell className={cn(isSortedColumn("service") && "sorted-column-cell")}>
                                                <div className="font-medium text-primary">
                                                    {b.serviceName || b.title || "Servizio"}
                                                </div>
                                            </TableCell>
                                            <TableCell className={cn(isSortedColumn("member") && "sorted-column-cell")}>
                                                {b.memberFirstName ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{b.memberFirstName} {b.memberLastName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="italic text-muted-foreground">{b.title || "-"}</span>
                                                )}
                                            </TableCell>
                                            <TableCell className={cn(isSortedColumn("status") && "sorted-column-cell")}>
                                                <Badge
                                                    variant={
                                                        b.status === 'confirmed' ? 'default' :
                                                            b.status === 'pending' ? 'outline' : 'destructive'
                                                    }
                                                >
                                                    {b.status === 'confirmed' ? 'Confermata' :
                                                        b.status === 'pending' ? 'In attesa' : 'Annullata'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={cn(isSortedColumn("paid") && "sorted-column-cell")}>
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant={b.paid ? 'default' : 'secondary'} className={b.paid ? "bg-green-600" : ""}>
                                                        {b.paid ? 'Pagato' : 'Da pagare'}
                                                    </Badge>
                                                    {b.amount && (
                                                        <span className="text-xs font-bold font-mono">
                                                            € {Number(b.amount).toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditBooking(b)}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteBooking(b.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Booking Dialog */}
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
                                value={bookingForm.description || bookingForm.title || ""}
                                onChange={e => setBookingForm((prev: any) => ({ ...prev, title: e.target.value, description: e.target.value }))}
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
                                    <Combobox
                                        name="paymentMethodId"
                                        value={bookingForm.paymentMethodId?.toString()}
                                        onValueChange={(val) => setBookingForm((prev: any) => ({ ...prev, paymentMethodId: val ? parseInt(val) : undefined }))}
                                        options={(paymentMethods || []).map(pm => ({ value: pm.id.toString(), label: pm.name }))}
                                        placeholder="Seleziona metodo..."
                                    />
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
                                                <CommandEmpty className="p-4 text-center">
                                                    <p className="text-xs text-muted-foreground mb-3">Nessun partecipante trovato.</p>
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
                            <Combobox
                                name="instructorId"
                                value={bookingForm.instructorId?.toString() || "none"}
                                onValueChange={(val) => setBookingForm((prev: any) => ({ ...prev, instructorId: val === "none" ? null : parseInt(val) }))}
                                options={[{value: "none", label: "Nessuno"}, ...sortedInstructors.map(i => ({ value: i.id.toString(), label: `${i.lastName} ${i.firstName}` }))]}
                                placeholder="Seleziona insegnante..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Data</Label>
                                <Input
                                    type="date"
                                    value={bookingForm.bookingDate ? new Date(bookingForm.bookingDate).toISOString().split('T')[0] : ""}
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
                            <Combobox
                                name="studioId"
                                value={bookingForm.studioId?.toString()}
                                onValueChange={v => setBookingForm((prev: any) => ({ ...prev, studioId: parseInt(v) }))}
                                options={(studios || []).map(s => ({ value: s.id.toString(), label: s.name }))}
                                placeholder="Studio"
                            />
                        </div>

                        <div className="mt-2 text-center">
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
                                                            setBookingForm((prev: any) => ({
                                                                ...prev,
                                                                startTime: slot.start,
                                                                endTime: slot.end
                                                            }));
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
                                <Combobox
                                    name="startTime"
                                    value={bookingForm.startTime}
                                    onValueChange={v => setBookingForm((prev: any) => ({ ...prev, startTime: v }))}
                                    options={TIME_SLOTS.map(t => ({ value: t, label: t }))}
                                    placeholder="Inizio"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Fine</Label>
                                <Combobox
                                    name="endTime"
                                    value={bookingForm.endTime}
                                    onValueChange={v => setBookingForm((prev: any) => ({ ...prev, endTime: v }))}
                                    options={TIME_SLOTS.map(t => ({ value: t, label: t }))}
                                    placeholder="Fine"
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 pt-6">
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
                        </DialogFooter>
                    </form>
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
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
