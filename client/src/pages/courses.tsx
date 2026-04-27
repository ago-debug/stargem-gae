import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link, useSearch, useLocation } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { hasWritePermission } from "@/App";
import { Plus, Search, Edit, Trash2, Users, Calendar, UserPlus, CalendarPlus, X, Download, Tag, ArrowLeft } from "lucide-react";
import { ExportWizard } from "@/components/ExportWizard";
import { ActivityNavMenu } from "@/components/activity-nav-menu";
import { CourseUnifiedModal } from "@/components/CourseUnifiedModal";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { MultiSelectStatus, StatusBadge, getStatusColor } from "@/components/multi-select-status";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, parseStatusTags, getSeasonLabel } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useCustomList, useCustomListValues } from "@/hooks/use-custom-list";
import { Combobox } from "@/components/ui/combobox";
import type { Course, InsertCourse, Season, Category, Instructor, Studio, Attendance, Member, Quote, ActivityStatus } from "@shared/schema";

export function formatStatusBadge(tag: string) {
  if (!tag) return tag;
  if (tag.startsWith("STATE:")) return tag.replace("STATE:", "");
  if (tag.startsWith("PROMO:")) {
    const p = tag.replace("PROMO:", "");
    if (p === "GRATUITA") return "Prova gratuita";
    if (p === "ONLINE") return "Iscrizione online";
    if (p === "PROMO") return "Promo";
    return p;
  }
  return tag;
}

const WEEKDAYS = [
  { id: "LUN", label: "Lunedì" },
  { id: "MAR", label: "Martedì" },
  { id: "MER", label: "Mercoledì" },
  { id: "GIO", label: "Giovedì" },
  { id: "VEN", label: "Venerdì" },
  { id: "SAB", label: "Sabato" },
  { id: "DOM", label: "Domenica" },
];

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

const RECURRENCE_TYPES = [
  { id: "weekly", label: "Settimanale" },
  { id: "biweekly", label: "Bisettimanale" },
  { id: "monthly", label: "Mensile" },
  { id: "custom", label: "Personalizzato" },
];

const normalizeDay = (day?: string | null) => {
  if (!day) return "";
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

export default function Courses() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const canWrite = hasWritePermission(user, "/corsi");
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const initialSearch = urlParams.get('search') || "";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("active");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkDuplicateDialog, setShowBulkDuplicateDialog] = useState(false);
  const [targetSeasonId, setTargetSeasonId] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [instructorFilter, setInstructorFilter] = useState<string>("all");
  const [dayOfWeekFilter, setDayOfWeekFilter] = useState<string>("all");
  const [nameFilter, setNameFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusTags, setStatusTags] = useState<string[]>([]);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<string>("");
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [selectedEndTime, setSelectedEndTime] = useState<string>("");
  const [selectedRecurrence, setSelectedRecurrence] = useState<string>("");
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("details");
  const [price, setPrice] = useState<string>("");

  const { data: quotes } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const nomiCorsi = useCustomListValues("genere");
  const postiDisponibili = useCustomListValues("posti_disponibili");

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: [`/api/courses?activityType=course&seasonId=${selectedSeasonId}${instructorFilter !== 'all' ? `&instructorId=${instructorFilter}` : ''}${dayOfWeekFilter !== 'all' ? `&dayOfWeek=${dayOfWeekFilter}` : ''}`],
  });

  const { data: statusList } = useQuery<any>({
    queryKey: ["/api/custom-lists/stato_corso"],
  });
  const statuses = statusList?.items?.filter((i: any) => i.active) || [];

  const editId = urlParams.get('editId') || urlParams.get('courseId');

  useEffect(() => {
    if (courses && editId && !isFormOpen && !editingCourse) {
      const course = courses.find(c => c.id === parseInt(editId));
      if (course) {
        setEditingCourse(course);
        setSelectedDayOfWeek(course.dayOfWeek || "");
        setSelectedStartTime(course.startTime || "");
        setSelectedEndTime(course.endTime || "");
        setSelectedRecurrence(course.recurrenceType || "");
        setActiveTab("details");
        setStatusTags(parseStatusTags(course.statusTags));
        setIsFormOpen(true);
        
        // Clean up URL to avoid loops
        urlParams.delete('editId');
        urlParams.delete('courseId');
        const newSearch = urlParams.toString();
        setLocation(`/attivita/corsi${newSearch ? `?${newSearch}` : ''}`, { replace: true });
      }
    }
  }, [courses, editId, isFormOpen, editingCourse, setLocation]);

  const { data: seasons } = useQuery<Season[]>({
    queryKey: ["/api/seasons"],
  });

  const { data: activityStatuses } = useQuery<ActivityStatus[]>({
    queryKey: ["/api/activity-statuses"],
  });

  const { data: categorieList } = useCustomList("categorie");
  const categories = categorieList?.items ? [...categorieList.items].filter(i => i.active !== false).map(i => ({ id: i.id, name: i.value })).sort((a,b)=>a.name.localeCompare(b.name, undefined, {numeric: true})) : [];

  const { data: instructors } = useQuery<Instructor[]>({
    queryKey: ["/api/instructors"],
  });

  const { data: studios } = useQuery<Studio[]>({
    queryKey: ["/api/studios"],
  });

  interface EnrollmentWithMember {
    id: number;
    courseId: number;
    memberId: number;
    status: string;
    memberFirstName?: string | null;
    memberLastName?: string | null;
    memberEmail?: string | null;
    memberFiscalCode?: string | null;
  }

  const { data: enrollments } = useQuery<EnrollmentWithMember[]>({
    queryKey: ["/api/enrollments?type=corsi"],
  });

  interface AttendanceWithMember extends Attendance {
    memberFirstName?: string | null;
    memberLastName?: string | null;
    memberFiscalCode?: string | null;
  }

  const { data: attendances } = useQuery<AttendanceWithMember[]>({
    queryKey: ["/api/attendances"],
  });

  const getCourseEnrollmentCount = (courseId: number): number => {
    if (!enrollments) return 0;
    return enrollments.filter(e => e.courseId === courseId && (e.status === 'active' || !e.status)).length;
  };

  const getCourseEnrollmentsList = (courseId: number): Array<{ id: number; firstName: string; lastName: string }> => {
    if (!enrollments) return [];
    return enrollments
      .filter(e => e.courseId === courseId && (e.status === 'active' || !e.status))
      .map(e => ({
        id: e.memberId,
        firstName: e.memberFirstName || '',
        lastName: e.memberLastName || '',
      }));
  };

  const getCourseAttendances = (courseId: number) => {
    if (!attendances) return [];
    return attendances
      .filter(a => a.courseId === courseId)
      .map(a => ({
        ...a,
        memberName: (a.memberFirstName || a.memberLastName)
          ? `${a.memberFirstName || ''} ${a.memberLastName || ''}`.trim()
          : "Sconosciuto",
      }))
      .sort((a, b) => new Date(b.attendanceDate).getTime() - new Date(a.attendanceDate).getTime())
      .slice(0, 20);
  };

  const createMutation = useMutation({
    mutationFn: async (data: InsertCourse) => {
      try {
        await apiRequest("POST", "/api/courses", data);
      } catch (err: any) {
        if (err.status === 409) {
          // Conflitto slot: procede sempre senza chiedere (F2-PROTOCOLLO-097)
          await apiRequest("POST", "/api/courses", { ...data, force: true });
          return;
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses?activityType=course&seasonId=${selectedSeasonId}`] }); queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Corso creato con successo" });
      setIsFormOpen(false);
      setEditingCourse(null);
      setStatusTags([]);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertCourse }) => {
      try {
        await apiRequest("PATCH", `/api/courses/${id}`, data);
      } catch (err: any) {
        if (err.status === 409) {
          // Conflitto slot: procede sempre senza chiedere (F2-PROTOCOLLO-097)
          await apiRequest("PATCH", `/api/courses/${id}`, { ...data, force: true });
          return;
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Corso aggiornato con successo" });
      setIsFormOpen(false);
      setEditingCourse(null);
      setStatusTags([]);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/courses/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Corso eliminato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: InsertCourse = {
      sku: formData.get("sku") as string || null,
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      categoryId: formData.get("categoryId") ? parseInt(formData.get("categoryId") as string) : null,
      studioId: formData.get("studioId") ? parseInt(formData.get("studioId") as string) : null,
      instructorId: formData.get("instructorId") ? parseInt(formData.get("instructorId") as string) : null,
      secondaryInstructor1Id: formData.get("secondaryInstructor1Id") ? parseInt(formData.get("secondaryInstructor1Id") as string) : null,
      price: formData.get("price") ? formData.get("price") as string : null,
      maxCapacity: formData.get("maxCapacity") ? parseInt(formData.get("maxCapacity") as string) : null,
      dayOfWeek: selectedDayOfWeek || null,
      startTime: selectedStartTime || null,
      endTime: selectedEndTime || null,
      recurrenceType: selectedRecurrence || null,
      schedule: formData.get("schedule") as string || null,
      startDate: formData.get("startDate") ? new Date(formData.get("startDate") as string) : null,
      endDate: formData.get("endDate") ? new Date(formData.get("endDate") as string) : null,
      statusTags, active: true,
      quoteId: selectedQuoteId ? parseInt(selectedQuoteId) : null,
    };

    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setPrice(course.price?.toString() || "");
    setSelectedQuoteId(course.quoteId?.toString() || "");
    setSelectedDayOfWeek(normalizeDay(course.dayOfWeek));
    setSelectedStartTime(course.startTime || "");
    setSelectedEndTime(course.endTime || "");
    setSelectedRecurrence(course.recurrenceType || "");
    setStatusTags(parseStatusTags(course.statusTags));
    setIsFormOpen(true);
  };

  const closeDialog = () => {
    setIsFormOpen(false);
    setEditingCourse(null);
    setStatusTags([]);
    setPrice("");
    setSelectedQuoteId("");
    setSelectedDayOfWeek("");
    setSelectedStartTime("");
    setSelectedEndTime("");
    setSelectedRecurrence("");
  };

  const distinctCategories = Array.from(new Set(courses?.map(c => c.categoryId).filter(Boolean)));
  const distinctInstructors = Array.from(new Set(courses?.map(c => c.instructorId).filter(Boolean)));
  const distinctDays = Array.from(new Set(courses?.map(c => c.dayOfWeek).filter(Boolean)));
  const distinctNames = Array.from(new Set(courses?.map(c => c.name).filter(Boolean))).sort();

  const filteredCourses = courses?.filter((course) => {
    const query = searchQuery.toLowerCase().trim();

    if (nameFilter !== "all" && course.name !== nameFilter) {
      return false;
    }

    if (categoryFilter !== "all" && course.categoryId?.toString() !== categoryFilter) {
      return false;
    }

    if (instructorFilter !== "all" && course.instructorId?.toString() !== instructorFilter) {
      return false;
    }

    if (dayOfWeekFilter !== "all" && course.dayOfWeek !== dayOfWeekFilter) {
      return false;
    }

    if (statusFilter !== "all") {
      const tags = parseStatusTags(course.statusTags);
      const opTags = tags.filter((t: string) => t.startsWith("STATE:")).map((t: string) => t.replace("STATE:", ""));
      if (!opTags.includes(statusFilter)) {
        return false;
      }
    }

    if (!query) return true;

    const category = categories?.find(c => c.id === course.categoryId);
    const instructor = instructors?.find(i => i.id === course.instructorId);
    const secondaryInstructor1 = instructors?.find(i => i.id === course.secondaryInstructor1Id);
    const studio = studios?.find(s => s.id === course.studioId);
    const dayLabel = WEEKDAYS.find(d => d.id === course.dayOfWeek)?.label || "";

    return (
      course.name?.toLowerCase().includes(query) ||
      course.sku?.toLowerCase().includes(query) ||
      course.description?.toLowerCase().includes(query) ||
      category?.name?.toLowerCase().includes(query) ||
      instructor?.firstName?.toLowerCase().includes(query) ||
      instructor?.lastName?.toLowerCase().includes(query) ||
      secondaryInstructor1?.firstName?.toLowerCase().includes(query) ||
      secondaryInstructor1?.lastName?.toLowerCase().includes(query) ||
      studio?.name?.toLowerCase().includes(query) ||
      dayLabel.toLowerCase().includes(query) ||
      course.startTime?.includes(query) ||
      course.endTime?.includes(query)
    );
  }) || [];

  const { sortConfig, handleSort, sortItems, isSortedColumn } = useSortableTable<typeof filteredCourses[0]>("sku");

  const getSortValue = (course: typeof filteredCourses[0], key: string) => {
    switch (key) {
      case "sku": return course.sku;
      case "name": return course.name;
      case "category": return (course as any).categoryName || categories?.find(c => c.id === course.categoryId)?.name;
      case "instructor": {
        const inst = instructors?.find(i => i.id === course.instructorId);
        return inst ? `${inst.lastName} ${inst.firstName}` : null;
      }
      case "price": return Number(course.price) || 0;
      case "capacity": return course.maxCapacity || 0;
      case "enrollments": return getCourseEnrollmentCount(course.id);
      case "period": return course.startDate;
      case "status": return parseStatusTags(course.statusTags).join(", ");
      default: return null;
    }
  };

  const sortedCourses = sortItems(filteredCourses, getSortValue);

    const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredCourses.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(Array.from(selectedIds).map(id => apiRequest("DELETE", `/api/courses/${id}`)));
      toast({ title: "Eliminazione completata" });
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: [`/api/courses?activityType=course&seasonId=${selectedSeasonId}`] });
    } catch (e) {
      toast({ title: "Errore durante l'eliminazione", variant: "destructive" });
    }
  };

  const handleBulkDuplicate = async () => {
    if (!targetSeasonId) {
      toast({ title: "Seleziona una stagione", variant: "destructive" });
      return;
    }
    try {
      const selectedCourses = filteredCourses.filter(c => selectedIds.has(c.id));
      await Promise.all(selectedCourses.map(course => {
        const insertData = { ...course };
        delete (insertData as any).id;
        delete (insertData as any).createdAt;
        delete (insertData as any).updatedAt;
        (insertData as any).seasonId = parseInt(targetSeasonId);
        (insertData as any).sku = null;
        (insertData as any).price = "0.00"; 
        return apiRequest("POST", "/api/courses", insertData);
      }));
      toast({ title: "Duplicazione massiva completata" });
      setShowBulkDuplicateDialog(false);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: [`/api/courses?activityType=course&seasonId=${targetSeasonId}`] });
    } catch (e) {
      toast({ title: "Errore duplicazione", variant: "destructive" });
    }
  };

  const exportToCSV = () => {
    if (!filteredCourses.length) return;

    const headers = ["SKU", "Nome", "Descrizione", "Categoria", "Insegnante", "Prezzo", "Max Partecipanti", "Giorno", "Orario Inizio", "Orario Fine", "Ricorrenza", "Data Inizio", "Data Fine", "Stato"];

    const rows = filteredCourses.map(course => {
      const category = categories?.find(c => c.id === course.categoryId);
      const instructor = instructors?.find(i => i.id === course.instructorId);
      const dayLabel = WEEKDAYS.find(d => d.id === course.dayOfWeek)?.label || "";
      const recurrenceLabel = RECURRENCE_TYPES.find(r => r.id === course.recurrenceType)?.label || "";

      return [
        course.sku || "",
        course.name,
        course.description || "",
        (course as any).categoryName || category?.name || "",
        instructor ? `${instructor.lastName} ${instructor.firstName}` : "",
        course.price || "",
        course.maxCapacity || "",
        dayLabel,
        course.startTime || "",
        course.endTime || "",
        recurrenceLabel,
        course.startDate ? new Date(course.startDate).toLocaleDateString('it-IT') : "",
        course.endDate ? new Date(course.endDate).toLocaleDateString('it-IT') : "",
        course.active ? "Attivo" : "Inattivo"
      ];
    });

    const escapeCSV = (value: unknown) => {
      const str = String(value ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = "\ufeff" + [headers.map(escapeCSV).join(","), ...rows.map(row => row.map(escapeCSV).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `corsi_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-muted/30 sticky top-0 z-10">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="icon-gold-bg rounded-md h-8 w-8 flex-shrink-0" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 text-white" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-foreground" data-testid="text-courses-title">Riepilogo Corsi</h1>
                <p className="text-muted-foreground text-sm" data-testid="text-courses-subtitle">Organizza e gestisci i corsi disponibili</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <ExportWizard 
      filename="corsi"
      title="Esporta Corsi"
      apiEndpoint="/api/export"
      apiParams={{ table: 'courses' }}
      columns={[
              { key: 'id', label: 'ID Database', default: true },
        { key: 'name', label: 'Nome Corso', default: true },
        { key: 'sku', label: 'SKU', default: true },
        { key: 'category', label: 'Categoria', default: true },
        { key: 'location', label: 'Sede', default: true },
        { key: 'capacity', label: 'Capienza', default: true },
        { key: 'status', label: 'Stato', default: true }
      ]}
    />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="border-gold text-gold-foreground font-semibold bg-white/50 hover:bg-gold/10 px-3">
                    📋 {filteredCourses.length} Corsi ▼
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4 space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-slate-800 border-b pb-1">Categoria</h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        {Object.entries(
                            filteredCourses.reduce((acc, c) => {
                              const cat = (c as any).categoryName || categories?.find(catObj => Number(catObj.id) === Number(c.categoryId))?.name || "Senza categoria";
                              acc[cat] = (acc[cat] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)
                          ).sort((a,b) => b[1] - a[1])
                          .map(([cat, count]) => (
                            <div key={cat} className="flex justify-between text-slate-600">
                              <span className="truncate pr-2">{cat}</span>
                              <span className="font-semibold">{count}</span>
                            </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-slate-800 border-b pb-1">Genere / Nome</h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                        {Object.entries(
                            filteredCourses.reduce((acc, c) => {
                              const name = c.name || "Senza nome";
                              acc[name] = (acc[name] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)
                          ).sort((a,b) => b[1] - a[1])
                          .map(([name, count]) => (
                            <div key={name} className="flex justify-between text-slate-600">
                              <span className="truncate pr-2">{name}</span>
                              <span className="font-semibold">{count}</span>
                            </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                onClick={() => {
                  closeDialog();
                  setIsFormOpen(true);
                }}
                data-testid="button-add-course"
                disabled={!canWrite}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuovo Corso
              </Button>
            </div>
          </div>
          <ActivityNavMenu />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca in tutti i campi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-courses"
                />
              </div>
              
              <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Seleziona stagione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le stagioni</SelectItem>
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
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
                  <SelectValue placeholder="Filtra per categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le categorie</SelectItem>
                  {categories?.filter(c => distinctCategories.includes(c.id)).map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={instructorFilter} onValueChange={setInstructorFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtra per insegnante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli insegnanti</SelectItem>
                  {instructors?.filter(i => distinctInstructors.includes(i.id)).map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id.toString()}>
                      {instructor.lastName} {instructor.firstName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dayOfWeekFilter} onValueChange={setDayOfWeekFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtra per giorno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i giorni</SelectItem>
                  {WEEKDAYS.filter(d => distinctDays.includes(d.id)).map((day) => (
                    <SelectItem key={day.id} value={day.id}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={nameFilter} onValueChange={setNameFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtra per corso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i corsi</SelectItem>
                  {distinctNames.map((name) => (
                    <SelectItem key={name as string} value={name as string}>
                      {name as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtra per stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  {statuses.map((status: any) => (
                    <SelectItem key={status.id} value={status.value}>
                      {status.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(categoryFilter !== "all" || instructorFilter !== "all" || dayOfWeekFilter !== "all" || nameFilter !== "all" || statusFilter !== "all" || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCategoryFilter("all");
                    setInstructorFilter("all");
                    setDayOfWeekFilter("all");
                    setNameFilter("all");
                    setStatusFilter("all");
                    setSearchQuery("");
                  }}
                  data-testid="button-clear-filters"
                >
                  <X className="w-4 h-4 mr-1" />
                  Pulisci filtri
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium mb-2">Nessun corso trovato</p>
                <p className="text-sm">Inizia aggiungendo il primo corso</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"><Checkbox checked={filteredCourses.length > 0 && selectedIds.size === filteredCourses.length} onCheckedChange={(checked) => handleSelectAll(checked as boolean)} /></TableHead>
                    <SortableTableHead sortKey="sku" currentSort={sortConfig} onSort={handleSort}>SKU/Codice</SortableTableHead>
                    <SortableTableHead sortKey="name" currentSort={sortConfig} onSort={handleSort}>Corso</SortableTableHead>
                    <SortableTableHead sortKey="category" currentSort={sortConfig} onSort={handleSort}>Categoria</SortableTableHead>
                    <SortableTableHead sortKey="instructor" currentSort={sortConfig} onSort={handleSort}>Staff/Insegnante</SortableTableHead>
                    <SortableTableHead sortKey="price" currentSort={sortConfig} onSort={handleSort}>Prezzo</SortableTableHead>
                    <SortableTableHead sortKey="capacity" currentSort={sortConfig} onSort={handleSort}>Posti</SortableTableHead>
                    <SortableTableHead sortKey="enrollments" currentSort={sortConfig} onSort={handleSort}>Iscritti</SortableTableHead>
                    <SortableTableHead sortKey="period" currentSort={sortConfig} onSort={handleSort}>Periodo</SortableTableHead>
                    <SortableTableHead sortKey="status" currentSort={sortConfig} onSort={handleSort}>Stato</SortableTableHead>
                    <TableHead>Interno</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCourses.map((course) => {
                    const enrollmentCount = getCourseEnrollmentCount(course.id);
                    const enrollmentsList = getCourseEnrollmentsList(course.id);
                    return (
                      <TableRow key={course.id} data-testid={`course-row-${course.id}`}>
                        <TableCell><Checkbox checked={selectedIds.has(course.id)} onCheckedChange={(checked) => handleSelectRow(course.id, checked as boolean)} /></TableCell>
                        <TableCell className={cn("text-xs text-muted-foreground", isSortedColumn("sku") && "sorted-column-cell")}>
                          {course.sku || "-"}
                        </TableCell>
                        <TableCell className={cn("font-medium", isSortedColumn("name") && "sorted-column-cell")}>
                          <div className="flex flex-col">
                            <button
                              onClick={() => {
                                openEditDialog(course);
                                setEditingCourse(course);
                                setSelectedDayOfWeek(course.dayOfWeek || "");
                                setSelectedStartTime(course.startTime || "");
                                setSelectedEndTime(course.endTime || "");
                                setSelectedRecurrence(course.recurrenceType || "");
                                setActiveTab("enrollments");
                                setIsFormOpen(true);
                              }}
                              className="hover:text-primary hover:underline text-left text-sm"
                              data-testid={`link-course-name-${course.id}`}
                            >
                              {course.name}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className={isSortedColumn("category") ? "sorted-column-cell" : ""}>
                          {(course as any).categoryName || categories?.find(c => c.id === course.categoryId)?.name || "-"}
                        </TableCell>
                        <TableCell className={isSortedColumn("instructor") ? "sorted-column-cell" : ""}>
                          {instructors?.find(i => i.id === course.instructorId)
                            ? `${instructors.find(i => i.id === course.instructorId)?.lastName} ${instructors.find(i => i.id === course.instructorId)?.firstName}`
                            : "-"}
                        </TableCell>
                        <TableCell className={isSortedColumn("price") ? "sorted-column-cell" : ""}>
                          €{course.price || "0.00"}
                        </TableCell>
                        <TableCell className={isSortedColumn("capacity") ? "sorted-column-cell" : ""}>
                          {enrollmentCount}/{course.maxCapacity || "∞"}
                        </TableCell>
                        <TableCell className={isSortedColumn("enrollments") ? "sorted-column-cell" : ""}>
                          {enrollmentsList.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {enrollmentsList.slice(0, 2).map((member) => (
                                <Link key={member.id} href={`/iscritti?search=${encodeURIComponent(`${member.lastName} ${member.firstName}`)}`}>
                                  <Badge variant="outline" className="text-xs cursor-pointer hover-elevate">
                                    {member.lastName} {member.firstName}
                                  </Badge>
                                </Link>
                              ))}
                              {enrollmentsList.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{enrollmentsList.length - 2} altri
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Nessun iscritto</span>
                          )}
                        </TableCell>
                        <TableCell className={cn("text-xs text-muted-foreground", isSortedColumn("period") && "sorted-column-cell")}>
                          {course.startDate && course.endDate
                            ? `${new Date(course.startDate).toLocaleDateString('it-IT')} - ${new Date(course.endDate).toLocaleDateString('it-IT')}`
                            : "-"}
                        </TableCell>
                        <TableCell className={isSortedColumn("status") ? "sorted-column-cell" : ""}>
                          <div className="flex flex-col gap-1 items-start">
                            {parseStatusTags(course.statusTags).filter(tag => formatStatusBadge(tag) !== "ATTIVO").length > 0 ? (
                                parseStatusTags(course.statusTags)
                                  .filter(tag => formatStatusBadge(tag) !== "ATTIVO")
                                  .map((tag) => (
                                  <StatusBadge
                                    key={tag}
                                    name={formatStatusBadge(tag)}
                                    color={getStatusColor(formatStatusBadge(tag), activityStatuses)}
                                  />
                                ))
                            ) : (
                              <span className="text-xs italic text-muted-foreground">(Nessuno stato)</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            {parseStatusTags(course.internalTags).length > 0 ? (
                                parseStatusTags(course.internalTags).map((tag: string) => (
                                  <StatusBadge key={tag} name={tag} color="#4f46e5" className="flex items-center gap-1" />
                                ))
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              className="bg-[#2c3e50] text-[#e0e0e0] hover:bg-[#34495e]"
                              onClick={() => setLocation(`/scheda-corso?courseId=${course.id}`)}
                              data-testid={`button-scheda-${course.id}`}
                            >
                              Scheda
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="gold-3d-button text-black"
                              onClick={() => openEditDialog(course)}
                              data-testid={`button-edit-${course.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {enrollmentCount === 0 && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="bg-white text-black border-foreground/20 hover:bg-gray-50 dark:bg-white dark:text-black dark:hover:bg-gray-100"
                                    data-testid={`button-delete-${course.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                   <AlertDialogHeader>
                                      <AlertDialogTitle>Conferma Eliminazione Definitiva</AlertDialogTitle>
                                      <AlertDialogDescription className="text-secondary-foreground font-medium">
                                        Sei assolutamente sicuro? Questa azione distruggerà irreversibilmente il corso e i suoi log operativi. Procedi solo se è un corso generato per errore.
                                      </AlertDialogDescription>
                                   </AlertDialogHeader>
                                   <AlertDialogFooter>
                                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteMutation.mutate(course.id)} className="bg-red-600 hover:bg-red-700 text-white">Sì, Rimuovi il corso</AlertDialogAction>
                                   </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        
        {/* Bulk Dialog */}
        <Dialog open={showBulkDuplicateDialog} onOpenChange={setShowBulkDuplicateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Duplica {selectedIds.size} Corsi</DialogTitle>
              <DialogDescription>
                Seleziona la stagione di destinazione. I corsi clonati avranno il prezzo azzerato e il codice vuoto, preservando nome, staff e pianificazione.
              </DialogDescription>
            </DialogHeader>
            <Select value={targetSeasonId} onValueChange={setTargetSeasonId}>
              <SelectTrigger>
                 <SelectValue placeholder="Seleziona la stagione di destinazione" />
              </SelectTrigger>
              <SelectContent>
                 {seasons?.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name} {s.active ? '(Attiva)' : ''}</SelectItem>
                 ))}
              </SelectContent>
            </Select>
            <DialogFooter>
               <Button onClick={handleBulkDuplicate} disabled={!targetSeasonId}>Conferma Duplicazione</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Selected Toolbar */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white border border-slate-200 shadow-xl rounded-full px-6 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-10">
            <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
              {selectedIds.size} {selectedIds.size === 1 ? 'corso selezionato' : 'corsi selezionati'}
            </span>
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={(e) => {
                    // Controlla se qualcuno dei corsi selezionati ha iscritti
                    let hasProtectedCourses = false;
                    for (const id of Array.from(selectedIds)) {
                        if (getCourseEnrollmentCount(id) > 0) hasProtectedCourses = true;
                    }
                    if (hasProtectedCourses) {
                        e.preventDefault();
                        toast({ title: "Azione Bloccata (Presenza Iscritti)", description: "Non puoi eliminare massivamente questi corsi: ci sono partecipanti registrati in alcune delle attività selezionate! Filtra o deseleziona i corsi con iscritti.", variant: "destructive", duration: 8000 });
                    }
                  }}>
                    <Trash2 className="w-4 h-4 mr-2" /> Elimina
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                   <AlertDialogHeader>
                      <AlertDialogTitle>Conferma Eliminazione Massiva</AlertDialogTitle>
                      <AlertDialogDescription className="text-secondary-foreground font-medium">
                        Stai per eliminare irreversibilmente {selectedIds.size} {selectedIds.size === 1 ? 'corso' : 'corsi'} vergini senza iscritti. Sei certo di voler smantellare interamente queste attività in blocco?
                      </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter>
                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white">Sì, Rimuovi Tutto</AlertDialogAction>
                   </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => setShowBulkDuplicateDialog(true)}>
                <CalendarPlus className="w-4 h-4 mr-2" /> Duplica
              </Button>
            </div>
            <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100" onClick={() => setSelectedIds(new Set())}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        <CourseUnifiedModal 
          isOpen={isFormOpen || !!editingCourse} 
          onOpenChange={(open) => { 
            if (!open) closeDialog();
          }} 
          course={editingCourse || null} 
          onDelete={(id) => deleteMutation.mutate(id)}
        />


      </div>
    </div>
  );
}
