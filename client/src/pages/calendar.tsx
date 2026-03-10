import { useState, useMemo, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, parse, startOfDay, addMinutes, isWithinInterval } from "date-fns";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { validateFiscalCode, parseFiscalCode, getPlaceName } from "@/lib/fiscalCodeUtils";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { cn } from "@/lib/utils";

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

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00 to 22:00

const TIME_SLOTS = Array.from({ length: 288 }, (_, i) => {
    const hour = Math.floor(i / 12);
    const minute = (i % 12) * 5;
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

const CATEGORY_COLORS: Record<number, string> = {
    // We'll dynamic assign background colors if not predefined
};

const COLORS = [
    "bg-blue-500/10 border-blue-500/50 text-blue-700",
    "bg-purple-500/10 border-purple-500/50 text-purple-700",
    "bg-emerald-500/10 border-emerald-500/50 text-emerald-700",
    "bg-rose-500/10 border-rose-500/50 text-rose-700",
    "bg-amber-500/10 border-amber-500/50 text-amber-900",
    "bg-indigo-500/10 border-indigo-500/50 text-indigo-700",
    "bg-teal-500/10 border-teal-500/50 text-teal-700",
    "bg-cyan-500/10 border-cyan-500/50 text-cyan-700",
    "bg-fuchsia-500/10 border-fuchsia-500/50 text-fuchsia-700",
];

function EnrollmentsTab({ courseId }: { courseId: number }) {
    const { toast } = useToast();
    const [isAddingEnrollment, setIsAddingEnrollment] = useState(false);
    const [memberSearchQuery, setMemberSearchQuery] = useState("");

    const { data: enrollments } = useQuery<any[]>({
        queryKey: ["/api/universal-enrollments"],
    });

    const { data: searchResults } = useQuery<{ members: Member[], total: number }>({
        queryKey: ["/api/members", { search: memberSearchQuery }],
        queryFn: async () => {
            const res = await fetch(`/api/members?search=${encodeURIComponent(memberSearchQuery)}&pageSize=20`);
            return res.json();
        },
        enabled: memberSearchQuery.length >= 3,
    });

    const createEnrollmentMutation = useMutation({
        mutationFn: async (data: { memberId: number; courseId: number }) => {
            await apiRequest("POST", "/api/universal-enrollments", {
                memberId: data.memberId,
                activityDetailId: data.courseId,
                startDate: new Date().toISOString().split('T')[0],
                status: 'active',
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/universal-enrollments"] });
            toast({ title: "Iscrizione aggiunta con successo" });
            setIsAddingEnrollment(false);
            setMemberSearchQuery("");
        },
        onError: (error: Error) => {
            toast({ title: "Errore", description: error.message, variant: "destructive" });
        },
    });

    const deleteEnrollmentMutation = useMutation({
        mutationFn: async (enrollmentId: number) => {
            await apiRequest("DELETE", `/api/universal-enrollments/${enrollmentId}`, undefined);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/universal-enrollments"] });
            toast({ title: "Iscrizione rimossa con successo" });
        },
        onError: (error: Error) => {
            toast({ title: "Errore", description: error.message, variant: "destructive" });
        },
    });

    const courseEnrollments = enrollments
        ?.filter(e => e.activityDetailId === courseId && (e.status === 'active' || !e.status))
        .map(e => ({
            enrollmentId: e.id,
            memberId: e.memberId,
            firstName: e.memberFirstName || '',
            lastName: e.memberLastName || '',
            email: e.memberEmail || '',
        })) || [];

    const { sortConfig, handleSort, sortItems, isSortedColumn } = useSortableTable<any>("lastName");
    const getSortValue = (enrollment: any, key: string) => {
        switch (key) {
            case "firstName": return enrollment.firstName || "";
            case "lastName": return enrollment.lastName || "";
            default: return null;
        }
    };
    const sortedEnrollments = sortItems(courseEnrollments, getSortValue);

    return (
        <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Iscritti ({courseEnrollments.length})</h3>
                <Popover open={isAddingEnrollment} onOpenChange={setIsAddingEnrollment}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Aggiungi
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                        <Command shouldFilter={false}>
                            <CommandInput
                                placeholder="Cerca membro..."
                                value={memberSearchQuery}
                                onValueChange={setMemberSearchQuery}
                            />
                            <CommandList>
                                {memberSearchQuery.length < 3 ? (
                                    <CommandEmpty>Digita almeno 3 caratteri</CommandEmpty>
                                ) : !searchResults?.members?.length ? (
                                    <CommandEmpty>Nessun membro trovato</CommandEmpty>
                                ) : (
                                    <CommandGroup>
                                        {searchResults.members.map(m => (
                                            <CommandItem
                                                key={m.id}
                                                onSelect={() => createEnrollmentMutation.mutate({ memberId: m.id, courseId })}
                                            >
                                                {m.lastName} {m.firstName}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <SortableTableHead sortKey="lastName" currentSort={sortConfig} onSort={handleSort}>Nome</SortableTableHead>
                            <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedEnrollments.map((e: any) => (
                            <TableRow key={e.enrollmentId}>
                                <TableCell className={cn(isSortedColumn("lastName") && "sorted-column-cell")}>{e.lastName} {e.firstName}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteEnrollmentMutation.mutate(e.enrollmentId)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function AttendancesTab({ courseId }: { courseId: number }) {
    const { toast } = useToast();
    const { data: attendances } = useQuery<Attendance[]>({ queryKey: ["/api/attendances"] });
    const { data: membersData } = useQuery<{ members: Member[] }>({ queryKey: ["/api/members"] });
    const { data: enrollments } = useQuery<any[]>({ queryKey: ["/api/universal-enrollments"] });

    const deleteAttendanceMutation = useMutation({
        mutationFn: async (id: number) => apiRequest("DELETE", `/api/attendances/${id}`, undefined),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/attendances"] }),
    });

    const members = membersData?.members || [];
    const courseAttendances = attendances
        ?.filter(a => a.courseId === courseId)
        .map(a => {
            const member = members.find(m => m.id === a.memberId);
            return { ...a, memberName: member ? `${member.lastName} ${member.firstName}` : "Sconosciuto" };
        })
        .sort((a, b) => new Date(b.attendanceDate).getTime() - new Date(a.attendanceDate).getTime()) || [];

    const { sortConfig, handleSort, sortItems, isSortedColumn } = useSortableTable<any>("attendanceDate");
    const getSortValue = (attendance: any, key: string) => {
        switch (key) {
            case "attendanceDate": return attendance.attendanceDate || "";
            case "memberName": return attendance.memberName || "";
            default: return null;
        }
    };

    const sortedAttendances = sortItems(courseAttendances, getSortValue);

    return (
        <div className="space-y-4 pt-4">
            <h3 className="text-lg font-medium">Presenze Recenti</h3>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <SortableTableHead sortKey="attendanceDate" currentSort={sortConfig} onSort={handleSort}>Data</SortableTableHead>
                            <SortableTableHead sortKey="memberName" currentSort={sortConfig} onSort={handleSort}>Membro</SortableTableHead>
                            <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedAttendances.map((a: any) => (
                            <TableRow key={a.id}>
                                <TableCell className={cn(isSortedColumn("attendanceDate") && "sorted-column-cell")}>{format(new Date(a.attendanceDate), "dd/MM/yyyy")}</TableCell>
                                <TableCell className={cn(isSortedColumn("memberName") && "sorted-column-cell")}>{a.memberName}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteAttendanceMutation.mutate(a.id)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export default function CalendarPage() {
    const [, setLocation] = useLocation();
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedStudio, setSelectedStudio] = useState<string>("all");
    const [selectedInstructor, setSelectedInstructor] = useState<string>("all");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedDay, setSelectedDay] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [conflictInfo, setConflictInfo] = useState<{ message: string, data: any, isUpdate: boolean } | null>(null);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
    const [editingBooking, setEditingBooking] = useState<any | null>(null);
    const [createType, setCreateType] = useState<"course" | "booking" | null>(null);
    const [selectionContext, setSelectionContext] = useState<{ dayId: string, studioId: number | null, hour: number } | null>(null);
    const [instructorSearchOpen, setInstructorSearchOpen] = useState(false);
    const [showFreeSlots, setShowFreeSlots] = useState(false);
    const { toast } = useToast();

    const currentWeekStart = startOfWeek(viewDate, { weekStartsOn: 1 });
    const currentWeekEnd = addDays(currentWeekStart, 6);

    const nextWeek = () => setViewDate(prev => addDays(prev, 7));
    const prevWeek = () => setViewDate(prev => addDays(prev, -7));
    const resetToToday = () => setViewDate(new Date());

    // Form state for editing
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
    const { data: activities, isLoading: activitiesLoading } = useQuery<any[]>({
        queryKey: ["/api/activities"],
    });

    const courses = activities?.filter(a => a.type === 'course') || [];
    const coursesLoading = activitiesLoading;

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

    const workshops = activities?.filter(a => a.type === 'workshop') || [];



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
        const day = date.getDay();
        const index = day === 0 ? 6 : day - 1;
        return WEEKDAYS[index].id;
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
            if (c.startDate && new Date(c.startDate).toISOString().split('T')[0] > dateStr) return false;
            if (c.endDate && new Date(c.endDate).toISOString().split('T')[0] < dateStr) return false;

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
            if (w.startDate && new Date(w.startDate).toISOString().split('T')[0] > dateStr) return false;
            if (w.endDate && new Date(w.endDate).toISOString().split('T')[0] < dateStr) return false;

            return true;
        });

        const busy = [
            ...dayCourses.map(c => ({ start: c.startTime, end: c.endTime })),
            ...dayBookings.map(b => ({ start: b.startTime, end: b.endTime })),
            ...dayWorkshops.map(w => ({ start: w.startTime, end: w.endTime }))
        ];

        const slots: { start: string, end: string }[] = [];
        let currentStart: any = null;
        const relevantSlots = TIME_SLOTS.filter(t => t >= "07:00" && t <= "22:00");

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
            segments.push({ start: currentStart, end: "22:00" });
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

    const isLoading = coursesLoading || studiosLoading || instructorsLoading || categoriesLoading;

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
        if (!courses) return [];
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
                matchSearch = course.name.toLowerCase().includes(search) ||
                    (course.description?.toLowerCase().includes(search) || false) ||
                    instrName.includes(search);
            }

            return matchStudio && matchInstructor && matchCategory && matchDay && isActive && matchSearch;
        }).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    }, [courses, selectedStudio, selectedInstructor, selectedCategory, selectedDay, searchQuery, instructors]);

    // Filtered Workshops
    const filteredWorkshops = useMemo(() => {
        if (!workshops) return [];
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
                matchSearch = workshop.name.toLowerCase().includes(search) ||
                    (workshop.description?.toLowerCase().includes(search) || false) ||
                    instrName.includes(search);
            }

            return matchStudio && matchInstructor && matchCategory && matchDay && isActive && matchSearch;
        }).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    }, [workshops, selectedStudio, selectedInstructor, selectedCategory, selectedDay, searchQuery, instructors]);

    // Helper to get color for course
    const getCourseColor = (course: Course) => {
        const category = categories?.find(c => c.id === course.categoryId);
        if (category?.color) {
            const hex = category.color;
            return {
                backgroundColor: `${hex}25`, // ~15-20% opacity
                borderLeftColor: hex,
                color: hex,
            };
        }
        const id = course.categoryId || 0;
        const colorClass = COLORS[id % COLORS.length];
        return { className: colorClass };
    };

    const getBookingColor = (booking: any) => {
        const color = booking.serviceColor || "#64748b";
        return {
            backgroundColor: `${color}20`,
            borderLeftColor: color,
            color: color,
        };
    };


    const ROW_HEIGHT = 120; // Increased from 60
    const PX_PER_MIN = ROW_HEIGHT / 60;

    // Helper to parse time string (HH:mm) to minutes from 08:00
    const timeToMinutes = (timeStr?: string) => {
        if (!timeStr) return 0;
        // Handle HH:mm or HH:mm:ss
        const parts = timeStr.split(":");
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        return ((hours * 60 + minutes) - (8 * 60)) * PX_PER_MIN;
    };

    const stripSeconds = (timeStr?: string | null) => {
        if (!timeStr) return "";
        return timeStr.substring(0, 5);
    };

    const resetFilters = () => {
        setSelectedStudio("all");
        setSelectedInstructor("all");
        setSelectedCategory("all");
        setSelectedDay("all");
        setSearchQuery("");
    };

    const updateCourseMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            return await apiRequest("PATCH", `/api/activities/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
            toast({ title: "Attività aggiornata", description: "Le modifiche sono state salvate correttamente." });
            setEditingCourse(null);
        },
        onError: (err: Error) => {
            toast({ title: "Errore", description: err.message, variant: "destructive" });
        }
    });

    const deleteCourseMutation = useMutation({
        mutationFn: async (id: number) => {
            return await apiRequest("DELETE", `/api/activities/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
            toast({ title: "Attività eliminata", description: "L'attività è stata rimossa correttamente." });
            setEditingCourse(null);
        },
        onError: (err: Error) => {
            toast({ title: "Errore", description: err.message, variant: "destructive" });
        }
    });

    const handleEditCourse = (course: Course) => {
        setEditingCourse(course);
        setEditForm(course);
    };

    const handleCreateCourse = (dayId: string, studioId: number, hour: number) => {
        const timeStr = `${hour.toString().padStart(2, "0")}:00`;
        const endTimeStr = `${(hour + 1).toString().padStart(2, "0")}:00`;

        const newCourse: Partial<Course> = {
            name: "",
            dayOfWeek: dayId,
            studioId: studioId,
            startTime: timeStr,
            endTime: endTimeStr,
            active: true,
            currentEnrollment: 0,
            maxCapacity: 20
        };

        setEditingCourse(newCourse as Course);
        setEditForm(newCourse);
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();

        // Ensure all dates are strings or null before sending
        const dataToSave: any = { ...editForm, type: 'course' };
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

        if (editingCourse?.id) {
            updateCourseMutation.mutate({ id: editingCourse.id, data: dataToSave });
        } else {
            // Create new course
            createCourseMutation.mutate(dataToSave as any);
        }
    };

    const createCourseMutation = useMutation({
        mutationFn: async (data: any) => {
            return await apiRequest("POST", "/api/activities", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
            toast({ title: "Attività creata", description: "La nuova attività è stata aggiunta con successo." });
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
        setEditingBooking(booking);
        setBookingForm({
            ...booking,
            bookingDate: new Date(booking.bookingDate)
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

    const handleForceSave = () => {
        if (!conflictInfo) return;
        const data = { ...conflictInfo.data, force: true };
        if (conflictInfo.isUpdate && editingBooking?.id) {
            updateBookingMutation.mutate({ id: editingBooking.id, data });
        } else {
            createBookingMutation.mutate(data);
        }
    };



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
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <CalendarIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Calendario</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={prevWeek}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-semibold min-w-40 text-center">
                                {format(currentWeekStart, "dd MMM", { locale: it })} - {format(currentWeekEnd, "dd MMM yyyy", { locale: it })}
                            </span>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={nextWeek}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={resetToToday}>
                                Oggi
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-1.5 text-left">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase ml-1">Studio</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[180px] justify-between font-normal">
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
                                            <CommandItem
                                                onSelect={() => setSelectedStudio("all")}
                                                className="flex items-center justify-between"
                                            >
                                                Tutti gli Studio
                                                {selectedStudio === "all" && <Check className="w-4 h-4" />}
                                            </CommandItem>
                                            {sortedStudios.map(s => (
                                                <CommandItem
                                                    key={s.id}
                                                    onSelect={() => setSelectedStudio(s.id.toString())}
                                                    className="flex items-center justify-between"
                                                >
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

                    <div className="space-y-1.5 text-left">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase ml-1">Insegnante</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[180px] justify-between font-normal">
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
                                            <CommandItem
                                                onSelect={() => setSelectedInstructor("all")}
                                                className="flex items-center justify-between"
                                            >
                                                Tutti gli Insegnanti
                                                {selectedInstructor === "all" && <Check className="w-4 h-4" />}
                                            </CommandItem>
                                            {sortedInstructors.map(i => (
                                                <CommandItem
                                                    key={i.id}
                                                    onSelect={() => setSelectedInstructor(i.id.toString())}
                                                    className="flex items-center justify-between"
                                                >
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

                    <div className="space-y-1.5 text-left">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase ml-1">Categoria</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[180px] justify-between font-normal">
                                    <div className="flex items-center truncate">
                                        <Filter className="w-4 h-4 mr-2 shrink-0" />
                                        <span className="truncate">
                                            {selectedCategory === "all" ? "Tutte le Categorie" : sortedCategories.find(c => c.id.toString() === selectedCategory)?.name || "Categoria"}
                                        </span>
                                    </div>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[180px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Cerca categoria..." />
                                    <CommandList>
                                        <CommandEmpty>Nessun risultato.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                onSelect={() => setSelectedCategory("all")}
                                                className="flex items-center justify-between"
                                            >
                                                Tutte le Categorie
                                                {selectedCategory === "all" && <Check className="w-4 h-4" />}
                                            </CommandItem>
                                            {sortedCategories.map(c => (
                                                <CommandItem
                                                    key={c.id}
                                                    onSelect={() => setSelectedCategory(c.id.toString())}
                                                    className="flex items-center justify-between"
                                                >
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

                    <div className="space-y-1.5 text-left">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase ml-1">Giorno</Label>
                        <Select value={selectedDay} onValueChange={setSelectedDay}>
                            <SelectTrigger className="w-[180px]">
                                <CalendarIcon className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Giorno" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tutta la Settimana</SelectItem>
                                {WEEKDAYS.map(d => (
                                    <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5 text-left flex-1 min-w-[200px]">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase ml-1">Cerca (Nome/Insegnante/Note)</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Cerca..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 h-10"
                            />
                        </div>
                    </div>

                    {(selectedStudio !== "all" || selectedInstructor !== "all" || selectedCategory !== "all" || selectedDay !== "all" || searchQuery !== "") && (
                        <Button variant="ghost" size="icon" onClick={resetFilters} title="Resetta filtri" className="mb-[2px]">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            <Card className="border-none shadow-xl bg-card overflow-hidden">
                <CardContent className="p-0 overflow-auto max-h-[calc(100vh-220px)] relative">
                    <div className="min-w-full flex flex-col relative">
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
                                        return (
                                            <div key={day.id} className="p-3 text-center border-r last:border-r-0 font-bold text-[12px] uppercase tracking-tight text-[#333] bg-white min-w-[120px] flex flex-col items-center">
                                                <span>{day.label}</span>
                                                <span className="text-[10px] font-normal text-muted-foreground">{format(dayDate, "dd/MM")}</span>
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

                        {/* Calendar Body */}
                        <div className="relative grid bg-white"
                            style={{
                                gridTemplateColumns: selectedDay === 'all'
                                    ? `80px repeat(7, minmax(120px, 1fr))`
                                    : `80px repeat(${studios?.length || 1}, minmax(140px, 1fr))`,
                                height: `${HOURS.length * ROW_HEIGHT}px`
                            }}>
                            {/* Hour Labels */}
                            <div className="border-r bg-[#f8f9fa] relative z-30 sticky left-0 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                {HOURS.map(hour => (
                                    <div key={hour}
                                        className="border-b border-[#eee] flex flex-col items-center justify-start pt-2 text-[11px] font-bold text-[#666] bg-[#f8f9fa]"
                                        style={{ height: `${ROW_HEIGHT}px` }}>
                                        <span>{hour.toString().padStart(2, "0")}.00</span>
                                        <span className="opacity-50 font-normal text-[9px] mt-1">{hour.toString().padStart(2, "0")}.30</span>
                                    </div>
                                ))}
                            </div>

                            {/* Grid Lines Overlay */}
                            <div className="absolute left-[80px] right-0 inset-y-0 grid"
                                style={{
                                    gridTemplateColumns: selectedDay === 'all'
                                        ? `repeat(7, minmax(120px, 1fr))`
                                        : `repeat(${studios?.length || 1}, minmax(140px, 1fr))`,
                                    gridTemplateRows: `repeat(${HOURS.length}, ${ROW_HEIGHT}px)`
                                }}>
                                {HOURS.map((hour, rowIdx) => (
                                    (selectedDay === 'all' ? WEEKDAYS.map(d => d.id) : (studios || [])).map((col, colIdx) => {
                                        const studioId = typeof col === 'string' ? null : col.id;
                                        const dayId = typeof col === 'string' ? col : selectedDay;

                                        return (
                                            <div
                                                key={`${rowIdx}-${colIdx}`}
                                                className="border-b border-r last:border-r-0 border-[#eee] hover:bg-slate-50 cursor-crosshair transition-colors"
                                                onClick={() => {
                                                    setSelectionContext({ dayId, studioId, hour });
                                                }}
                                            ></div>
                                        );
                                    })
                                ))}
                            </div>

                            {/* Content Columns */}
                            {selectedDay === 'all' ? (
                                WEEKDAYS.map(day => (
                                    <div key={day.id} className="relative pointer-events-none min-w-[120px]">
                                        {filteredCourses
                                            .filter(c => normalizeDay(c.dayOfWeek) === day.id)
                                            .map(course => {
                                                const startMin = timeToMinutes(course.startTime || undefined);
                                                const endMin = timeToMinutes(course.endTime || undefined);
                                                const duration = (endMin || startMin + 60) - startMin;
                                                const colorData = getCourseColor(course);
                                                const stats = getCourseStats(course.id);
                                                const availability = course.maxCapacity ? Math.max(0, course.maxCapacity - stats.total) : null;

                                                return (
                                                    <div
                                                        key={course.id}
                                                        onClick={(e) => { e.stopPropagation(); handleEditCourse(course); }}
                                                        className={`absolute left-0.5 right-0.5 p-2 rounded-lg border-l-[6px] shadow-sm pointer-events-auto cursor-pointer transition-all hover:scale-[1.02] z-20 flex flex-col items-center justify-center text-center ${colorData.className || ''}`}
                                                        style={{
                                                            top: `${startMin + 3}px`,
                                                            height: `${duration - 3}px`,
                                                            fontSize: "10px",
                                                            ...colorData
                                                        }}
                                                    >
                                                        {course.sku && <span className="text-[6px] opacity-40 absolute top-1 right-1">{course.sku}</span>}

                                                        <div className="bg-black/5 px-1.5 py-0.5 rounded-full text-[8px] font-bold mb-1">
                                                            {course.startTime}-{course.endTime}
                                                        </div>

                                                        <span className="font-extrabold truncate w-full uppercase leading-tight mb-0.5">{course.name}</span>
                                                        <span className="truncate opacity-90 font-semibold mb-1.5">{instructors?.find(i => i.id === course.instructorId)?.lastName}</span>

                                                        <div className="flex gap-2 text-[8px] font-bold mt-auto pt-1 border-t border-black/5 w-full justify-center">
                                                            <span className="text-blue-600">U:{stats.men}</span>
                                                            <span className="text-pink-600">D:{stats.women}</span>
                                                            {availability !== null && (
                                                                <span className={availability <= 2 ? "text-red-600" : "text-green-600"}>
                                                                    Disp:{availability}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                        {filteredWorkshops
                                            .filter(w => normalizeDay(w.dayOfWeek) === day.id)
                                            .map(workshop => {
                                                const startMin = timeToMinutes(workshop.startTime || undefined);
                                                const endMin = timeToMinutes(workshop.endTime || undefined);
                                                const duration = (endMin || startMin + 60) - startMin;
                                                const colorData = getCourseColor(workshop as any);
                                                const stats = getWorkshopStats(workshop.id);
                                                const availability = workshop.maxCapacity ? Math.max(0, workshop.maxCapacity - stats.total) : null;

                                                return (
                                                    <div
                                                        key={`workshop-daily-${workshop.id}`}
                                                        onClick={(e) => { e.stopPropagation(); setLocation(`/workshops?search=${encodeURIComponent(workshop.name)}`); }}
                                                        className={`absolute left-1.5 right-1.5 p-2 rounded-md border-l-[6px] shadow-sm pointer-events-auto cursor-pointer transition-all hover:scale-[1.02] z-20 flex flex-col justify-between items-center text-center ${colorData.className || ''}`}
                                                        style={{
                                                            top: `${startMin + 3}px`,
                                                            height: `${duration - 6}px`,
                                                            fontSize: "10px",
                                                            ...colorData
                                                        }}
                                                    >
                                                        <div className="w-full flex flex-col items-center">
                                                            <div className="bg-primary/20 px-1.5 py-0.5 rounded-full text-[8px] font-bold mb-1 flex items-center justify-center gap-1 w-fit">
                                                                <Sparkles className="w-2 h-2 text-primary" />
                                                                <span>WORKSHOP</span>
                                                            </div>
                                                            <span className="font-bold uppercase leading-none mt-1 px-1 text-[11px]">{workshop.name}</span>
                                                            <span className="opacity-80 text-[10px] mt-1 font-medium">{instructors?.find(i => i.id === workshop.instructorId)?.lastName}</span>
                                                        </div>

                                                        <div className="flex flex-col items-center gap-1.5 w-full">
                                                            <div className="flex gap-2.5 text-[8px] font-bold">
                                                                <span className="text-blue-600">U:{stats.men}</span>
                                                                <span className="text-pink-600">D:{stats.women}</span>
                                                                {availability !== null && (
                                                                    <span className={availability <= 2 ? "text-red-600 font-extrabold" : "text-green-600"}>
                                                                        Disp:{availability}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="bg-black/5 px-2 py-0.5 rounded-full text-[8px] font-bold text-black/60">
                                                                {workshop.startTime}-{workshop.endTime}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}


                                        {Array.isArray(studioBookings) && studioBookings
                                            ?.filter(booking => {
                                                if (!booking || !booking.bookingDate) return false;
                                                const bDate = new Date(booking.bookingDate);
                                                const dayIdx = WEEKDAYS.findIndex(d => d.id === day.id);
                                                const targetDate = addDays(currentWeekStart, dayIdx);
                                                const matchDate = isSameDay(bDate, targetDate) && (selectedStudio === "all" || booking.studioId.toString() === selectedStudio);

                                                if (!matchDate) return false;

                                                if (searchQuery) {
                                                    const s = searchQuery.toLowerCase();
                                                    return (booking.serviceName?.toLowerCase().includes(s) ||
                                                        `${booking.memberFirstName} ${booking.memberLastName}`.toLowerCase().includes(s) ||
                                                        booking.title?.toLowerCase().includes(s));
                                                }
                                                return true;
                                            })
                                            .map(booking => {
                                                const startMin = timeToMinutes(booking.startTime || undefined);
                                                const endMin = timeToMinutes(booking.endTime || undefined);
                                                const duration = (endMin || startMin + 60) - startMin;
                                                const colorData = getBookingColor(booking);

                                                return (
                                                    <div
                                                        key={`booking-${booking.id}`}
                                                        onClick={(e) => { e.stopPropagation(); handleEditBooking(booking); }}
                                                        className={`absolute left-0.5 right-0.5 p-2 rounded-lg border-l-[6px] shadow-sm pointer-events-auto cursor-pointer transition-all hover:scale-[1.02] z-20 flex flex-col items-center justify-center text-center`}
                                                        style={{
                                                            top: `${startMin + 3}px`,
                                                            height: `${duration - 6}px`,
                                                            fontSize: "10px",
                                                            ...colorData
                                                        }}
                                                    >
                                                        <div className="bg-black/10 px-1.5 py-0.5 rounded-full text-[8px] font-bold mb-1 flex items-center gap-1">
                                                            <MapPin className="w-2 h-2" />
                                                            {booking.startTime}-{booking.endTime}
                                                        </div>
                                                        <span className="font-extrabold truncate w-full uppercase leading-tight mb-0.5">
                                                            {booking.serviceName || "PRENOTAZIONE"}
                                                        </span>
                                                        <span className="truncate opacity-90 text-[10px] font-medium leading-tight">
                                                            {booking.memberFirstName ? `${booking.memberFirstName} ${booking.memberLastName}` : booking.title}
                                                        </span>
                                                        {booking.amount && (
                                                            <span className="text-[9px] font-bold mt-1 bg-white/50 px-1.5 py-0.5 rounded shadow-sm">
                                                                €{Number(booking.amount).toFixed(2)}
                                                            </span>
                                                        )}
                                                        {booking.paid && (
                                                            <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5 text-white shadow-sm">
                                                                <Check className="w-2 h-2" />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                    </div>
                                ))
                            ) : (
                                studios?.map(studio => (
                                    <div key={studio.id} className="relative pointer-events-none min-w-[140px]">
                                        {filteredCourses
                                            .filter(c => c.studioId === studio.id)
                                            .map(course => {
                                                const startMin = timeToMinutes(course.startTime || undefined);
                                                const endMin = timeToMinutes(course.endTime || undefined);
                                                const duration = (endMin || startMin + 60) - startMin;
                                                const colorData = getCourseColor(course);
                                                const stats = getCourseStats(course.id);
                                                const availability = course.maxCapacity ? Math.max(0, course.maxCapacity - stats.total) : null;

                                                return (
                                                    <div
                                                        key={course.id}
                                                        onClick={(e) => { e.stopPropagation(); handleEditCourse(course); }}
                                                        className={`absolute left-1.5 right-1.5 p-2 rounded-md border-l-[6px] shadow-sm pointer-events-auto cursor-pointer transition-all hover:scale-[1.02] z-20 flex flex-col justify-between items-center text-center ${colorData.className || ''}`}
                                                        style={{
                                                            top: `${startMin + 3}px`,
                                                            height: `${duration - 6}px`,
                                                            fontSize: "10px",
                                                            ...colorData
                                                        }}
                                                    >
                                                        <div className="w-full flex flex-col items-center">
                                                            {course.sku && <span className="text-[7px] opacity-40 absolute top-1 right-2">{course.sku}</span>}
                                                            <span className="font-bold uppercase leading-none mt-2 px-1 text-[11px]">{course.name}</span>
                                                            <span className="opacity-80 text-[10px] mt-1 font-medium">{instructors?.find(i => i.id === course.instructorId)?.lastName}</span>
                                                        </div>

                                                        <div className="flex flex-col items-center gap-1.5 w-full">
                                                            <div className="flex gap-2.5 text-[8px] font-bold">
                                                                <span className="text-blue-600">U:{stats.men}</span>
                                                                <span className="text-pink-600">D:{stats.women}</span>
                                                                {availability !== null && (
                                                                    <span className={availability <= 2 ? "text-red-600 font-extrabold" : "text-green-600"}>
                                                                        Disp:{availability}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="bg-black/5 px-2 py-0.5 rounded-full text-[8px] font-bold text-black/60">
                                                                {course.startTime}-{course.endTime}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        {/* Workshops */}
                                        {filteredWorkshops
                                            .filter(w => w.studioId === studio.id && normalizeDay(w.dayOfWeek) === selectedDay)
                                            .map(workshop => {
                                                const startMin = timeToMinutes(workshop.startTime || undefined);
                                                const endMin = timeToMinutes(workshop.endTime || undefined);
                                                const duration = (endMin || startMin + 60) - startMin;
                                                const colorData = getCourseColor(workshop as any);
                                                const stats = getWorkshopStats(workshop.id);
                                                const availability = workshop.maxCapacity ? Math.max(0, workshop.maxCapacity - stats.total) : null;

                                                return (
                                                    <div
                                                        key={`workshop-daily-${workshop.id}`}
                                                        onClick={(e) => { e.stopPropagation(); setLocation(`/workshops?search=${encodeURIComponent(workshop.name)}`); }}
                                                        className={`absolute left-1.5 right-1.5 p-2 rounded-md border-l-[6px] shadow-sm pointer-events-auto cursor-pointer transition-all hover:scale-[1.02] z-20 flex flex-col justify-between items-center text-center ${colorData.className || ''}`}
                                                        style={{
                                                            top: `${startMin + 3}px`,
                                                            height: `${duration - 6}px`,
                                                            fontSize: "10px",
                                                            ...colorData
                                                        }}
                                                    >
                                                        <div className="w-full flex flex-col items-center">
                                                            <div className="bg-primary/20 px-1.5 py-0.5 rounded-full text-[8px] font-bold mb-1 flex items-center justify-center gap-1 w-fit">
                                                                <Sparkles className="w-2 h-2 text-primary" />
                                                                <span>WORKSHOP</span>
                                                            </div>
                                                            <span className="font-bold uppercase leading-none mt-1 px-1 text-[11px]">{workshop.name}</span>
                                                            <span className="opacity-80 text-[10px] mt-1 font-medium">{instructors?.find(i => i.id === workshop.instructorId)?.lastName}</span>
                                                        </div>

                                                        <div className="flex flex-col items-center gap-1.5 w-full">
                                                            <div className="flex gap-2.5 text-[8px] font-bold">
                                                                <span className="text-blue-600">U:{stats.men}</span>
                                                                <span className="text-pink-600">D:{stats.women}</span>
                                                                {availability !== null && (
                                                                    <span className={availability <= 2 ? "text-red-600 font-extrabold" : "text-green-600"}>
                                                                        Disp:{availability}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="bg-black/5 px-2 py-0.5 rounded-full text-[8px] font-bold text-black/60">
                                                                {workshop.startTime}-{workshop.endTime}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                        {Array.isArray(studioBookings) && studioBookings
                                            ?.filter(booking => {
                                                if (!booking || !booking.bookingDate) return false;
                                                const bDate = new Date(booking.bookingDate);
                                                const dayIdx = WEEKDAYS.findIndex(d => d.id === selectedDay);
                                                const targetDate = addDays(currentWeekStart, dayIdx);
                                                const matchDate = isSameDay(bDate, targetDate) && (booking.studioId === studio.id);

                                                if (!matchDate) return false;

                                                if (searchQuery) {
                                                    const s = searchQuery.toLowerCase();
                                                    return (booking.serviceName?.toLowerCase().includes(s) ||
                                                        `${booking.memberFirstName} ${booking.memberLastName}`.toLowerCase().includes(s) ||
                                                        booking.title?.toLowerCase().includes(s));
                                                }
                                                return true;
                                            })
                                            .map(booking => {
                                                const startMin = timeToMinutes(booking.startTime || undefined);
                                                const endMin = timeToMinutes(booking.endTime || undefined);
                                                const duration = (endMin || startMin + 60) - startMin;
                                                const colorData = getBookingColor(booking);

                                                return (
                                                    <div
                                                        key={`booking-studio-${booking.id}`}
                                                        onClick={(e) => { e.stopPropagation(); handleEditBooking(booking); }}
                                                        className={`absolute left-1.5 right-1.5 p-2 rounded-md border-l-[6px] shadow-sm pointer-events-auto cursor-pointer transition-all hover:scale-[1.02] z-20 flex flex-col justify-between items-center text-center`}
                                                        style={{
                                                            top: `${startMin + 3}px`,
                                                            height: `${duration - 6}px`,
                                                            fontSize: "10px",
                                                            ...colorData
                                                        }}
                                                    >
                                                        <div className="w-full flex flex-col items-center">
                                                            <span className="font-bold uppercase leading-none mt-2 px-1 text-[11px]">
                                                                {booking.serviceName || "PRENOTAZIONE"}
                                                            </span>
                                                            <span className="opacity-80 text-[10px] mt-1 font-medium leading-tight">
                                                                {booking.memberFirstName ? `${booking.memberFirstName} ${booking.memberLastName}` : booking.title}
                                                            </span>
                                                            {booking.amount && (
                                                                <span className="text-[9px] font-bold mt-1 bg-white/50 px-1.5 py-0.5 rounded shadow-sm">
                                                                    €{Number(booking.amount).toFixed(2)}
                                                                </span>
                                                            )}
                                                            {booking.paid && (
                                                                <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5 text-white shadow-sm">
                                                                    <Check className="w-2.5 h-2.5" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="bg-black/5 px-2 py-0.5 rounded-full text-[8px] font-bold text-black/60 mt-auto">
                                                            {booking.startTime}-{booking.endTime}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Bottom Sticky Day Selector - Outside scroll container for best visibility */}
                        <div className="bg-[#f8f9fa] border-t p-2 flex items-center justify-center gap-1 z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] sticky bottom-0">
                            <Button
                                variant={selectedDay === "all" ? "default" : "ghost"}
                                size="sm"
                                className="h-10 text-xs font-bold uppercase rounded-none px-4"
                                onClick={() => setSelectedDay("all")}
                            >
                                <Users className="w-4 h-4 mr-2" />
                                Settimana
                            </Button>
                            <div className="h-6 w-[1px] bg-slate-300 mx-2" />
                            {WEEKDAYS.map(day => (
                                <Button
                                    key={day.id}
                                    variant={selectedDay === day.id ? "default" : "ghost"}
                                    size="sm"
                                    className={`h-10 text-xs font-bold uppercase rounded-none px-4 ${selectedDay === day.id ? 'bg-primary text-white' : 'hover:bg-primary/10 text-[#555]'}`}
                                    onClick={() => setSelectedDay(day.id)}
                                >
                                    {day.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!editingCourse} onOpenChange={(open) => !open && setEditingCourse(null)}>
                <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editForm.id ? "Modifica Corso" : "Nuovo Corso"}</DialogTitle>
                        <DialogDescription>
                            {editForm.id ? "Gestisci i dettagli, iscritti e presenze del corso." : "Inserisci i dettagli per creare un nuovo corso."}
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="details">Dettagli</TabsTrigger>
                            <TabsTrigger value="enrollments" disabled={!editForm.id}>Iscritti</TabsTrigger>
                            <TabsTrigger value="attendances" disabled={!editForm.id}>Presenze</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details">
                            <form onSubmit={handleSaveEdit} className="space-y-6 pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-name">Nome Corso *</Label>
                                        <Input
                                            id="edit-name"
                                            value={editForm.name || ""}
                                            onChange={e => setEditForm((prev: any) => ({ ...prev, name: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2 flex items-end justify-end">
                                        {editForm.id && (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => {
                                                    if (confirm("Sei sicuro di voler eliminare questo corso?")) {
                                                        deleteCourseMutation.mutate(editForm.id!);
                                                    }
                                                }}
                                            >
                                                Elimina Corso
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-sku">SKU</Label>
                                        <Input
                                            id="edit-sku"
                                            placeholder="es: 2526-NEMBRI-LUN-15"
                                            value={editForm.sku || ""}
                                            onChange={e => setEditForm((prev: any) => ({ ...prev, sku: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-description">Descrizione</Label>
                                    <Textarea
                                        id="edit-description"
                                        value={editForm.description || ""}
                                        onChange={e => setEditForm((prev: any) => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Categoria</Label>
                                        <Select
                                            value={editForm.categoryId?.toString() || "none"}
                                            onValueChange={val => setEditForm((prev: any) => ({ ...prev, categoryId: val === "none" ? null : parseInt(val) }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleziona categoria" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nessuna categoria</SelectItem>
                                                {categories?.map(c => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Studio/Sala</Label>
                                        <Select
                                            value={editForm.studioId?.toString() || "none"}
                                            onValueChange={val => setEditForm((prev: any) => ({ ...prev, studioId: val === "none" ? null : parseInt(val) }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleziona studio" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nessuno studio</SelectItem>
                                                {studios?.map(s => (
                                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label>Insegnanti</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm text-muted-foreground">Principale</Label>
                                            <Select
                                                value={editForm.instructorId?.toString() || "none"}
                                                onValueChange={val => setEditForm((prev: any) => ({ ...prev, instructorId: val === "none" ? null : parseInt(val) }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleziona" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Nessuno</SelectItem>
                                                    {instructors?.map(i => (
                                                        <SelectItem key={i.id} value={i.id.toString()}>{i.lastName} {i.firstName}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm text-muted-foreground">Secondario 1 (opzionale)</Label>
                                            <Select
                                                value={editForm.secondaryInstructor1Id?.toString() || "none"}
                                                onValueChange={val => setEditForm((prev: any) => ({ ...prev, secondaryInstructor1Id: val === "none" ? null : parseInt(val) }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Nessuno" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Nessuno</SelectItem>
                                                    {instructors?.map(i => (
                                                        <SelectItem key={i.id} value={i.id.toString()}>{i.lastName} {i.firstName}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-price">Prezzo (€)</Label>
                                        <Input
                                            id="edit-price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={editForm.price || ""}
                                            onChange={e => setEditForm((prev: any) => ({ ...prev, price: e.target.value }))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Quota Base</Label>
                                        <Select
                                            value={editForm.quoteId?.toString() || "none"}
                                            onValueChange={(val) => {
                                                const quoteId = val === "none" ? null : parseInt(val);
                                                setEditForm((prev: any) => {
                                                    const newState = { ...prev, quoteId };
                                                    if (quoteId) {
                                                        const quote = quotes?.find(q => q.id === quoteId);
                                                        if (quote) newState.price = Number(quote.amount).toFixed(2);
                                                    }
                                                    return newState;
                                                });
                                            }}
                                        >
                                            <SelectTrigger title="Seleziona Quota">
                                                <SelectValue placeholder="Seleziona Quota" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nessuna Quota</SelectItem>
                                                {quotes?.map((q) => (
                                                    <SelectItem key={q.id} value={q.id.toString()}>
                                                        {q.name} (€{q.amount})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-maxCapacity">Posti Disponibili</Label>
                                        <Input
                                            id="edit-maxCapacity"
                                            type="number"
                                            min="1"
                                            value={editForm.maxCapacity || ""}
                                            onChange={e => setEditForm((prev: any) => ({ ...prev, maxCapacity: e.target.value ? parseInt(e.target.value) : null }))}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-startDate">Data Inizio</Label>
                                        <Input
                                            id="edit-startDate"
                                            type="date"
                                            value={editForm.startDate ? (editForm.startDate instanceof Date ? editForm.startDate : new Date(editForm.startDate)).toISOString().split('T')[0] : ""}
                                            onChange={e => setEditForm((prev: any) => ({ ...prev, startDate: e.target.value || null } as any))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-endDate">Data Fine</Label>
                                        <Input
                                            id="edit-endDate"
                                            type="date"
                                            value={editForm.endDate ? (editForm.endDate instanceof Date ? editForm.endDate : new Date(editForm.endDate)).toISOString().split('T')[0] : ""}
                                            onChange={e => setEditForm((prev: any) => ({ ...prev, endDate: e.target.value || null } as any))}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label>Giorno Settimana</Label>
                                        <Select
                                            value={normalizeDay(editForm.dayOfWeek)}
                                            onValueChange={val => setEditForm((prev: any) => ({ ...prev, dayOfWeek: val }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleziona giorno" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {WEEKDAYS.map(d => (
                                                    <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ora Inizio</Label>
                                        <Select
                                            value={stripSeconds(editForm.startTime)}
                                            onValueChange={val => setEditForm((prev: any) => ({ ...prev, startTime: val }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="--:--" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TIME_SLOTS.map(t => (
                                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ora Fine</Label>
                                        <Select
                                            value={stripSeconds(editForm.endTime)}
                                            onValueChange={val => setEditForm((prev: any) => ({ ...prev, endTime: val }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="--:--" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TIME_SLOTS.map(t => (
                                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ricorrenza</Label>
                                        <Select
                                            value={editForm.recurrenceType || "none"}
                                            onValueChange={val => setEditForm((prev: any) => ({ ...prev, recurrenceType: val }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleziona" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nessuna</SelectItem>
                                                {RECURRENCE_TYPES.map(r => (
                                                    <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-schedule">Note Orario (opzionale)</Label>
                                    <Textarea
                                        id="edit-schedule"
                                        placeholder="Note aggiuntive sull'orario"
                                        rows={2}
                                        value={editForm.schedule || ""}
                                        onChange={e => setEditForm((prev: any) => ({ ...prev, schedule: e.target.value }))}
                                    />
                                </div>

                                <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
                                    <Button type="button" variant="outline" onClick={() => setEditingCourse(null)}>Annulla</Button>
                                    <Button type="submit" disabled={updateCourseMutation.isPending || createCourseMutation.isPending}>
                                        {updateCourseMutation.isPending || createCourseMutation.isPending ? "Salvataggio..." : (editForm.id ? "Salva Modifiche" : "Crea Corso")}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </TabsContent>

                        <TabsContent value="enrollments">
                            {editingCourse?.id && <EnrollmentsTab courseId={editingCourse.id} />}
                        </TabsContent>

                        <TabsContent value="attendances">
                            {editingCourse?.id && <AttendancesTab courseId={editingCourse.id} />}
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

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

            {/* Selection Choice Dialog */}
            <Dialog open={!!selectionContext} onOpenChange={(open) => !open && setSelectionContext(null)}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Nuovo Inserimento</DialogTitle>
                        <DialogDescription>
                            Scegli cosa desideri creare alle ore {selectionContext?.hour}:00
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-6">
                        <Button
                            variant="outline"
                            className="h-40 flex flex-col items-center justify-center gap-4 border-2 hover:border-primary hover:bg-primary/5 transition-all group"
                            onClick={() => {
                                if (selectionContext) {
                                    const sId = selectionContext.studioId || (studios?.[0]?.id || 1);
                                    handleCreateCourse(selectionContext.dayId, sId, selectionContext.hour);
                                    setSelectionContext(null);
                                }
                            }}
                        >
                            <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <CalendarPlus className="w-8 h-8 text-primary" />
                            </div>
                            <div className="text-center">
                                <span className="block font-bold text-lg">Nuovo Corso</span>
                                <span className="text-xs text-muted-foreground">Palinsesto settimanale</span>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-40 flex flex-col items-center justify-center gap-4 border-2 hover:border-primary hover:bg-primary/5 transition-all group"
                            onClick={() => {
                                if (selectionContext) {
                                    const sId = selectionContext.studioId || (studios?.[0]?.id || 1);
                                    handleCreateBooking(selectionContext.dayId, sId, selectionContext.hour);
                                    setSelectionContext(null);
                                }
                            }}
                        >
                            <div className="p-4 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                                <MapPin className="w-8 h-8 text-amber-600" />
                            </div>
                            <div className="text-center">
                                <span className="block font-bold text-lg">Prenotazione</span>
                                <span className="text-xs text-muted-foreground">Affitto o PT singolo</span>
                            </div>
                        </Button>
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
