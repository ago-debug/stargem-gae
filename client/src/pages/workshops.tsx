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
import { cn, parseStatusTags, getSeasonLabel } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useCustomListValues } from "@/hooks/use-custom-list";
import { Combobox } from "@/components/ui/combobox";
import type { Season, Category, Instructor, Studio, Member, Quote, ActivityStatus } from "@shared/schema";

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

export default function Workshops() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const canWrite = hasWritePermission(user, "/workshop");
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const initialSearch = urlParams.get('search') || "";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("active");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkDuplicateDialog, setShowBulkDuplicateDialog] = useState(false);
  const [targetSeasonId, setTargetSeasonId] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusTags, setStatusTags] = useState<string[]>([]);
  // @ts-ignore // TODO: STI-cleanup
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
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

  const nomiWorkshop = useCustomListValues("genere");
  const postiDisponibili = useCustomListValues("posti_disponibili");

  // @ts-ignore // TODO: STI-cleanup
  const { data: workshops, isLoading } = useQuery<Workshop[]>({
    queryKey: [`/api/workshops?seasonId=${selectedSeasonId}`],
  });

  const editId = urlParams.get('editId') || urlParams.get('workshopId');

  useEffect(() => {
    if (workshops && editId && !isFormOpen && !editingWorkshop) {
      const workshop = workshops.find(c => c.id === parseInt(editId));
      if (workshop) {
        setEditingWorkshop(workshop);
        setSelectedDayOfWeek(workshop.dayOfWeek || "");
        setSelectedStartTime(workshop.startTime || "");
        setSelectedEndTime(workshop.endTime || "");
        setSelectedRecurrence(workshop.recurrenceType || "");
        setActiveTab("details");
        setStatusTags(parseStatusTags(workshop.statusTags));
        setIsFormOpen(true);
        
        // Clean up URL to avoid loops
        urlParams.delete('editId');
        urlParams.delete('workshopId');
        const newSearch = urlParams.toString();
        setLocation(`/attivita/workshop${newSearch ? `?${newSearch}` : ''}`, { replace: true });
      }
    }
  }, [workshops, editId, isFormOpen, editingWorkshop, setLocation]);

  const { data: seasons } = useQuery<Season[]>({ queryKey: ["/api/seasons"] });
  const { data: activityStatuses } = useQuery<ActivityStatus[]>({
    queryKey: ["/api/activity-statuses"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/workshop-categories"],
  });

  const { data: instructors } = useQuery<Instructor[]>({
    queryKey: ["/api/instructors"],
  });

  const { data: studios } = useQuery<Studio[]>({
    queryKey: ["/api/studios"],
  });

  interface EnrollmentWithMember {
    id: number;
    workshopId: number;
    memberId: number;
    status: string;
    memberFirstName?: string | null;
    memberLastName?: string | null;
    memberEmail?: string | null;
    memberFiscalCode?: string | null;
  }

  const { data: enrollments } = useQuery<EnrollmentWithMember[]>({
    queryKey: ["/api/workshop-enrollments"],
  });

  interface AttendanceWithMember {
    [key: string]: any;
    memberFirstName?: string | null;
    memberLastName?: string | null;
    memberFiscalCode?: string | null;
  }

  const { data: attendances } = useQuery<AttendanceWithMember[]>({
    queryKey: ["/api/workshop-attendances"],
  });

  const getWorkshopEnrollmentCount = (workshopId: number): number => {
    if (!enrollments) return 0;
    return enrollments.filter(e => e.workshopId === workshopId && (e.status === 'active' || !e.status)).length;
  };

  const getWorkshopEnrollmentsList = (workshopId: number): Array<{ id: number; firstName: string; lastName: string }> => {
    if (!enrollments) return [];
    return enrollments
      .filter(e => e.workshopId === workshopId && (e.status === 'active' || !e.status))
      .map(e => ({
        id: e.memberId,
        firstName: e.memberFirstName || '',
        lastName: e.memberLastName || '',
      }));
  };

  const getWorkshopAttendances = (workshopId: number) => {
    if (!attendances) return [];
    return attendances
      .filter((a: any) => a.workshopId === workshopId || a.activityId === workshopId)
      .map(a => ({
        ...a,
        memberName: (a.memberFirstName || a.memberLastName)
          ? `${a.memberFirstName || ''} ${a.memberLastName || ''}`.trim()
          : "Sconosciuto",
      }))
      .sort((a: any, b: any) => new Date(b.attendanceDate || 0).getTime() - new Date(a.attendanceDate || 0).getTime())
      .slice(0, 20);
  };

  const createMutation = useMutation({
    // @ts-ignore // TODO: STI-cleanup
    mutationFn: async (data: InsertWorkshop) => {
      try {
        await apiRequest("POST", "/api/workshops", data);
      } catch (err: any) {
        if (err.status === 409) {
          if (confirm(err.message)) {
            await apiRequest("POST", "/api/workshops", { ...data, force: true });
            return;
          }
          throw new Error("Operazione annullata");
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workshops?seasonId=${selectedSeasonId}`] }); queryClient.invalidateQueries({ queryKey: ["/api/workshops"] });
      toast({ title: "Workshop creato con successo" });
      setIsFormOpen(false);
      setEditingWorkshop(null);
      setStatusTags([]);
    },
    onError: (error: Error) => {
      if (error.message !== "Operazione annullata") {
        toast({ title: "Errore", description: error.message, variant: "destructive" });
      }
    },
  });

  const updateMutation = useMutation({
    // @ts-ignore // TODO: STI-cleanup
    mutationFn: async ({ id, data }: { id: number; data: InsertWorkshop }) => {
      try {
        await apiRequest("PATCH", `/api/workshops/${id}`, data);
      } catch (err: any) {
        if (err.status === 409) {
          if (confirm(err.message)) {
            await apiRequest("PATCH", `/api/workshops/${id}`, { ...data, force: true });
            return;
          }
          throw new Error("Operazione annullata");
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workshops?seasonId=${selectedSeasonId}`] }); queryClient.invalidateQueries({ queryKey: ["/api/workshops"] });
      toast({ title: "Workshop aggiornato con successo" });
      setIsFormOpen(false);
      setEditingWorkshop(null);
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
      await apiRequest("DELETE", `/api/workshops/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workshops?seasonId=${selectedSeasonId}`] }); queryClient.invalidateQueries({ queryKey: ["/api/workshops"] });
      toast({ title: "Workshop eliminato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // @ts-ignore // TODO: STI-cleanup
    const data: InsertWorkshop = {
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

    if (editingWorkshop) {
      updateMutation.mutate({ id: editingWorkshop.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // @ts-ignore // TODO: STI-cleanup
  const openEditDialog = (workshop: Workshop) => {
    setEditingWorkshop(workshop);
    setPrice(workshop.price?.toString() || "");
    setSelectedQuoteId(workshop.quoteId?.toString() || "");
    setSelectedDayOfWeek(normalizeDay(workshop.dayOfWeek));
    setSelectedStartTime(workshop.startTime || "");
    setSelectedEndTime(workshop.endTime || "");
    setSelectedRecurrence(workshop.recurrenceType || "");
    setStatusTags(parseStatusTags(workshop.statusTags));
    setIsFormOpen(true);
  };

  const closeDialog = () => {
    setIsFormOpen(false);
    setEditingWorkshop(null);
    setStatusTags([]);
    setPrice("");
    setSelectedQuoteId("");
    setSelectedDayOfWeek("");
    setSelectedStartTime("");
    setSelectedEndTime("");
    setSelectedRecurrence("");
  };

  const filteredWorkshops = workshops?.filter((workshop) => {
    const query = searchQuery.toLowerCase().trim();

    if (categoryFilter !== "all" && workshop.categoryId?.toString() !== categoryFilter) {
      return false;
    }

    if (!query) return true;

    const category = categories?.find(c => c.id === (workshop as any).categoryId);
    const instructor = instructors?.find(i => i.id === workshop.instructorId);
    const secondaryInstructor1 = instructors?.find(i => i.id === workshop.secondaryInstructor1Id);
    const studio = studios?.find(s => s.id === workshop.studioId);
    const dayLabel = WEEKDAYS.find(d => d.id === workshop.dayOfWeek)?.label || "";

    return (
      workshop.name?.toLowerCase().includes(query) ||
      workshop.sku?.toLowerCase().includes(query) ||
      workshop.description?.toLowerCase().includes(query) ||
      category?.name?.toLowerCase().includes(query) ||
      instructor?.firstName?.toLowerCase().includes(query) ||
      instructor?.lastName?.toLowerCase().includes(query) ||
      secondaryInstructor1?.firstName?.toLowerCase().includes(query) ||
      secondaryInstructor1?.lastName?.toLowerCase().includes(query) ||
      studio?.name?.toLowerCase().includes(query) ||
      dayLabel.toLowerCase().includes(query) ||
      workshop.startTime?.includes(query) ||
      workshop.endTime?.includes(query)
    );
  }) || [];

  const { sortConfig, handleSort, sortItems, isSortedColumn } = useSortableTable<typeof filteredWorkshops[0]>("sku");

  const getSortValue = (workshop: typeof filteredWorkshops[0], key: string) => {
    switch (key) {
      case "sku": return workshop.sku;
      case "name": return workshop.name;
      case "category": return categories?.find(c => c.id === (workshop as any).categoryId)?.name;
      case "instructor": {
        const inst = instructors?.find(i => i.id === workshop.instructorId);
        return inst ? `${inst.lastName} ${inst.firstName}` : null;
      }
      case "price": return Number(workshop.price) || 0;
      case "capacity": return workshop.maxCapacity || 0;
      case "enrollments": return getWorkshopEnrollmentCount(workshop.id);
      case "period": return workshop.startDate;
      case "status": return parseStatusTags(workshop.statusTags).join(", ");
      default: return null;
    }
  };

  const sortedWorkshops = sortItems(filteredWorkshops, getSortValue);

    const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredWorkshops.map(c => c.id)));
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
    if (!confirm(`Sei sicuro di voler eliminare i ${selectedIds.size} elementi selezionati?`)) return;
    try {
      await Promise.all(Array.from(selectedIds).map(id => apiRequest("DELETE", `/api/workshops/${id}`)));
      import("@/hooks/use-toast").then(({ toast }) => toast({ title: "Eliminazione completata" }));
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: [`/api/workshops?seasonId=${selectedSeasonId}`] });
    } catch (e) {
      import("@/hooks/use-toast").then(({ toast }) => toast({ title: "Errore durante l'eliminazione", variant: "destructive" }));
    }
  };

  const handleBulkDuplicate = async () => {
    if (!targetSeasonId) return;
    try {
      const selectedItems = filteredWorkshops.filter(c => selectedIds.has(c.id));
      await Promise.all(selectedItems.map(item => {
        const insertData = { ...item };
        delete (insertData as any).id;
        delete (insertData as any).createdAt;
        delete (insertData as any).updatedAt;
        (insertData as any).seasonId = parseInt(targetSeasonId);
        (insertData as any).sku = null;
        (insertData as any).price = "0.00"; 
        return apiRequest("POST", "/api/workshops", insertData);
      }));
      import("@/hooks/use-toast").then(({ toast }) => toast({ title: "Duplicazione massiva completata" }));
      setShowBulkDuplicateDialog(false);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: [`/api/workshops?seasonId=${targetSeasonId}`] });
    } catch (e) {
      import("@/hooks/use-toast").then(({ toast }) => toast({ title: "Errore duplicazione", variant: "destructive" }));
    }
  };

  const exportToCSV = () => {
    if (!filteredWorkshops.length) return;

    const headers = ["SKU", "Nome", "Descrizione", "Categoria", "Insegnante", "Prezzo", "Max Partecipanti", "Giorno", "Orario Inizio", "Orario Fine", "Ricorrenza", "Data Inizio", "Data Fine", "Stato"];

    const rows = filteredWorkshops.map(workshop => {
      const category = categories?.find(c => c.id === (workshop as any).categoryId);
      const instructor = instructors?.find(i => i.id === workshop.instructorId);
      const dayLabel = WEEKDAYS.find(d => d.id === workshop.dayOfWeek)?.label || "";
      const recurrenceLabel = RECURRENCE_TYPES.find(r => r.id === workshop.recurrenceType)?.label || "";

      return [
        workshop.sku || "",
        workshop.name,
        workshop.description || "",
        category?.name || "",
        instructor ? `${instructor.lastName} ${instructor.firstName}` : "",
        workshop.price || "",
        workshop.maxCapacity || "",
        dayLabel,
        workshop.startTime || "",
        workshop.endTime || "",
        recurrenceLabel,
        workshop.startDate ? new Date(workshop.startDate).toLocaleDateString('it-IT') : "",
        workshop.endDate ? new Date(workshop.endDate).toLocaleDateString('it-IT') : "",
        workshop.active ? "Attivo" : "Inattivo"
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
    link.download = `workshop_export_${new Date().toISOString().split('T')[0]}.csv`;
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
                <h1 className="text-2xl font-semibold text-foreground" data-testid="text-workshops-title">Riepilogo Workshop</h1>
                <p className="text-muted-foreground text-sm" data-testid="text-workshops-subtitle">Organizza e gestisci i workshop disponibili</p>
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
                data-testid="button-add-workshop"
                disabled={!canWrite}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuovo Workshop
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
                  data-testid="input-search-workshops"
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
            ) : filteredWorkshops.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium mb-2">Nessun workshop trovato</p>
                <p className="text-sm">Inizia aggiungendo il primo workshop</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"><Checkbox checked={filteredWorkshops.length > 0 && selectedIds.size === filteredWorkshops.length} onCheckedChange={(checked) => handleSelectAll(checked as boolean)} /></TableHead>
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
                  {sortedWorkshops.map((workshop) => {
                    const enrollmentCount = getWorkshopEnrollmentCount(workshop.id);
                    const enrollmentsList = getWorkshopEnrollmentsList(workshop.id);
                    return (
                      <TableRow key={workshop.id} data-testid={`workshop-row-${workshop.id}`}>
                        <TableCell><Checkbox checked={selectedIds.has(workshop.id)} onCheckedChange={(checked) => handleSelectRow(workshop.id, checked as boolean)} /></TableCell>
                        <TableCell className={cn("text-xs text-muted-foreground", isSortedColumn("sku") && "sorted-column-cell")}>
                          {workshop.sku || "-"}
                        </TableCell>
                        <TableCell className={cn("font-medium", isSortedColumn("name") && "sorted-column-cell")}>
                          <div className="flex flex-col">
                            <button
                              onClick={() => {
                                openEditDialog(workshop);
                                setEditingWorkshop(workshop);
                                setSelectedDayOfWeek(workshop.dayOfWeek || "");
                                setSelectedStartTime(workshop.startTime || "");
                                setSelectedEndTime(workshop.endTime || "");
                                setSelectedRecurrence(workshop.recurrenceType || "");
                                setActiveTab("enrollments");
                                setIsFormOpen(true);
                              }}
                              className="hover:text-primary hover:underline text-left text-sm"
                              data-testid={`link-workshop-name-${workshop.id}`}
                            >
                              {workshop.name}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className={isSortedColumn("category") ? "sorted-column-cell" : ""}>
                          {categories?.find(c => c.id === (workshop as any).categoryId)?.name || "-"}
                        </TableCell>
                        <TableCell className={isSortedColumn("instructor") ? "sorted-column-cell" : ""}>
                          {instructors?.find(i => i.id === workshop.instructorId)
                            ? `${instructors.find(i => i.id === workshop.instructorId)?.lastName} ${instructors.find(i => i.id === workshop.instructorId)?.firstName}`
                            : "-"}
                        </TableCell>
                        <TableCell className={isSortedColumn("price") ? "sorted-column-cell" : ""}>
                          €{workshop.price || "0.00"}
                        </TableCell>
                        <TableCell className={isSortedColumn("capacity") ? "sorted-column-cell" : ""}>
                          {enrollmentCount}/{workshop.maxCapacity || "∞"}
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
                          {workshop.startDate && workshop.endDate
                            ? `${new Date(workshop.startDate).toLocaleDateString('it-IT')} - ${new Date(workshop.endDate).toLocaleDateString('it-IT')}`
                            : "-"}
                        </TableCell>
                        <TableCell className={isSortedColumn("status") ? "sorted-column-cell" : ""}>
                          <div className="flex flex-col gap-1 items-start">
                            {parseStatusTags(workshop.statusTags).length > 0 ? (
                                parseStatusTags(workshop.statusTags).map((tag) => (
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
                              onClick={() => setLocation(`/scheda-corso?workshopId=${workshop.id}`)}
                              data-testid={`button-scheda-${workshop.id}`}
                            >
                              Scheda
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="gold-3d-button text-black"
                              onClick={() => openEditDialog(workshop)}
                              data-testid={`button-edit-${workshop.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="bg-white text-black border-foreground/20 hover:bg-gray-50 dark:bg-white dark:text-black dark:hover:bg-gray-100"
                              onClick={() => {
                                if (confirm("Sei sicuro di voler eliminare questo workshop?")) {
                                  deleteMutation.mutate(workshop.id);
                                }
                              }}
                              data-testid={`button-delete-${workshop.id}`}
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

        
        {/* Bulk Dialog */}
        <Dialog open={showBulkDuplicateDialog} onOpenChange={setShowBulkDuplicateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Duplica {selectedIds.size} elementi</DialogTitle>
              <DialogDescription>
                Seleziona la stagione di destinazione. I cloni avranno il prezzo azzerato e il codice vuoto, preservando nome, staff e pianificazione.
              </DialogDescription>
            </DialogHeader>
            <Select value={targetSeasonId} onValueChange={setTargetSeasonId}>
              <SelectTrigger>
                 <SelectValue placeholder="Seleziona la stagione di destinazione" />
              </SelectTrigger>
              <SelectContent>
                  {seasons?.map((s: any, idx: number) => {
                      const isActiveFallback = s.active || (!seasons.find((x: any) => x.active) && idx === 0);
                      return (
                          <SelectItem key={s.id} value={s.id.toString()}>
                              {getSeasonLabel(s, seasons)}
                          </SelectItem>
                      );
                  })}
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
              {selectedIds.size} {selectedIds.size === 1 ? 'elemento selezionato' : 'elementi selezionati'}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={handleBulkDelete}>
                Elimina
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => setShowBulkDuplicateDialog(true)}>
                Duplica
              </Button>
            </div>
            <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100" onClick={() => setSelectedIds(new Set())}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        <CourseUnifiedModal 
          activityType="workshop"
          isOpen={isFormOpen || !!editingWorkshop} 
          onOpenChange={(open) => { 
            if (!open) closeDialog();
          }} 
          course={editingWorkshop || (isFormOpen ? {} as any : null)} 
          onDelete={(id) => deleteMutation.mutate(id)}
        />


      </div>
    </div>
  );
}
