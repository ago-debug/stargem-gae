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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { hasWritePermission } from "@/App";
import { Plus, Search, Edit, Trash2, Users, Calendar, UserPlus, CalendarPlus, X, Download, Tag, ArrowLeft } from "lucide-react";
import { ActivityNavMenu } from "@/components/activity-nav-menu";
import { CourseUnifiedModal } from "@/components/CourseUnifiedModal";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { MultiSelectStatus, StatusBadge, getStatusColor } from "@/components/multi-select-status";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, parseStatusTags } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useCustomListValues } from "@/hooks/use-custom-list";
import { Combobox } from "@/components/ui/combobox";
import type { Course, InsertCourse, Category, Instructor, Studio, Attendance, Member, Quote, ActivityStatus } from "@shared/schema";

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
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
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
    queryKey: ["/api/courses"],
  });

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

  const { data: activityStatuses } = useQuery<ActivityStatus[]>({
    queryKey: ["/api/activity-statuses"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

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
          if (confirm(err.message)) {
            await apiRequest("POST", "/api/courses", { ...data, force: true });
            return;
          }
          throw new Error("Operazione annullata");
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Corso creato con successo" });
      setIsFormOpen(false);
      setEditingCourse(null);
      setStatusTags([]);
    },
    onError: (error: Error) => {
      if (error.message !== "Operazione annullata") {
        toast({ title: "Errore", description: error.message, variant: "destructive" });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertCourse }) => {
      try {
        await apiRequest("PATCH", `/api/courses/${id}`, data);
      } catch (err: any) {
        if (err.status === 409) {
          if (confirm(err.message)) {
            await apiRequest("PATCH", `/api/courses/${id}`, { ...data, force: true });
            return;
          }
          throw new Error("Operazione annullata");
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
      if (error.message !== "Operazione annullata") {
        toast({ title: "Errore", description: error.message, variant: "destructive" });
      }
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

  const filteredCourses = courses?.filter((course) => {
    const query = searchQuery.toLowerCase().trim();

    if (categoryFilter !== "all" && course.categoryId?.toString() !== categoryFilter) {
      return false;
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
      case "category": return categories?.find(c => c.id === course.categoryId)?.name;
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
        category?.name || "",
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
              <Button
                variant="outline"
                onClick={exportToCSV}
                data-testid="button-export-csv"
              >
                <Download className="w-4 h-4 mr-2" />
                Esporta CSV
              </Button>
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
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
                  <SelectValue placeholder="Filtra per categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le categorie</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(categoryFilter !== "all" || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCategoryFilter("all");
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
                    <SortableTableHead sortKey="sku" currentSort={sortConfig} onSort={handleSort}>SKU/Codice</SortableTableHead>
                    <SortableTableHead sortKey="name" currentSort={sortConfig} onSort={handleSort}>Corso</SortableTableHead>
                    <SortableTableHead sortKey="category" currentSort={sortConfig} onSort={handleSort}>Categoria</SortableTableHead>
                    <SortableTableHead sortKey="instructor" currentSort={sortConfig} onSort={handleSort}>Staff/Insegnante</SortableTableHead>
                    <SortableTableHead sortKey="price" currentSort={sortConfig} onSort={handleSort}>Prezzo</SortableTableHead>
                    <SortableTableHead sortKey="capacity" currentSort={sortConfig} onSort={handleSort}>Posti</SortableTableHead>
                    <SortableTableHead sortKey="enrollments" currentSort={sortConfig} onSort={handleSort}>Iscritti</SortableTableHead>
                    <SortableTableHead sortKey="period" currentSort={sortConfig} onSort={handleSort}>Periodo</SortableTableHead>
                    <SortableTableHead sortKey="status" currentSort={sortConfig} onSort={handleSort}>Stato</SortableTableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCourses.map((course) => {
                    const enrollmentCount = getCourseEnrollmentCount(course.id);
                    const enrollmentsList = getCourseEnrollmentsList(course.id);
                    return (
                      <TableRow key={course.id} data-testid={`course-row-${course.id}`}>
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
                          {categories?.find(c => c.id === course.categoryId)?.name || "-"}
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
                            {parseStatusTags(course.statusTags).length > 0 ? (
                                parseStatusTags(course.statusTags).map((tag) => (
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
                            <Button
                              variant="outline"
                              size="icon"
                              className="bg-white text-black border-foreground/20 hover:bg-gray-50 dark:bg-white dark:text-black dark:hover:bg-gray-100"
                              onClick={() => {
                                if (confirm("Sei sicuro di voler eliminare questo corso?")) {
                                  deleteMutation.mutate(course.id);
                                }
                              }}
                              data-testid={`button-delete-${course.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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

        <CourseUnifiedModal 
          isOpen={isFormOpen || !!editingCourse} 
          onOpenChange={(open) => { 
            if (!open) closeDialog();
          }} 
          course={editingCourse || (isFormOpen ? {} as any : null)} 
          onDelete={(id) => deleteMutation.mutate(id)}
        />


      </div>
    </div>
  );
}
