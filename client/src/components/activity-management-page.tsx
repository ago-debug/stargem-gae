import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useSearch } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { cn, parseStatusTags } from "@/lib/utils";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, Download, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityNavMenu } from "@/components/activity-nav-menu";
import { MultiSelectStatus, StatusBadge, getStatusColor } from "@/components/multi-select-status";
import type { Instructor, Studio, ActivityStatus, Quote, Member } from "@shared/schema";
import { Combobox } from "@/components/ui/combobox";
import { useCustomListValues } from "@/hooks/use-custom-list";
import { CourseUnifiedModal } from "@/components/CourseUnifiedModal";

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

export interface ActivityItem {
  id: number;
  sku: string | null;
  name: string;
  description: string | null;
  categoryId: number | null;
  categoryName?: string | null;
  quoteId: number | null;
  studioId: number | null;
  instructorId: number | null;
  secondaryInstructor1Id: number | null;
  price: string | null;
  maxCapacity: number | null;
  currentEnrollment: number | null;
  dayOfWeek: string | null;
  startTime: string | null;
  endTime: string | null;
  recurrenceType: string | null;
  schedule: string | null;
  startDate: string | null;
  endDate: string | null;
  statusTags: string[] | null;
  active: boolean | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}

interface ActivityManagementPageProps {
  title: string;
  subtitle: string;
  apiEndpoint: string;
  categoryApiEndpoint: string;
  itemLabel: string;
  itemLabelPlural: string;
  baseRoute: string; // The route prefix for the detail page
  testIdPrefix: string;
  activityType?: "prenotazioni" | "allenamenti" | "individual_lesson" | "training" | "other" | "campus" | "domeniche" | "workshop" | "saggi" | "vacanze" | "affitti"; // Identificatore per il Modale Operativo Condiviso
}

export default function ActivityManagementPage({
  title,
  subtitle,
  apiEndpoint,
  categoryApiEndpoint,
  itemLabel,
  itemLabelPlural,
  baseRoute,
  testIdPrefix,
  activityType = "other",
}: ActivityManagementPageProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const initialSearch = urlParams.get('search') || "";
  const actionParam = urlParams.get("action");

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    if (actionParam === "create") {
      setIsFormOpen(true);
      // Rimuovi il parametro per non riaprire alla navigazione indietro
      const newUrl = window.location.pathname + (initialSearch ? `?search=${initialSearch}` : "");
      window.history.replaceState({}, "", newUrl);
    }
  }, [actionParam, initialSearch]);
  const [editingItem, setEditingItem] = useState<ActivityItem | null>(null);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<string>("");
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [selectedEndTime, setSelectedEndTime] = useState<string>("");
  const [selectedRecurrence, setSelectedRecurrence] = useState<string>("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>("");
  const [price, setPrice] = useState<string>("");

  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [targetPurpose, setTargetPurpose] = useState<string>("");
  const [difficultyLevel, setDifficultyLevel] = useState<string>("");
  const [equipment, setEquipment] = useState<string>("");

  const { data: membersResponse } = useQuery<{ members: Member[] }>({
    queryKey: ["/api/members?pageSize=5000"],
  });
  const membersList = membersResponse?.members || [];

  const { data: quotes } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: items, isLoading } = useQuery<ActivityItem[]>({
    queryKey: [apiEndpoint],
  });

  const { data: categories } = useQuery<{ id: number; name: string }[]>({
    queryKey: [categoryApiEndpoint],
  });

  const { data: instructors } = useQuery<Instructor[]>({
    queryKey: ["/api/instructors"],
  });

  const { data: studios } = useQuery<Studio[]>({
    queryKey: ["/api/studios"],
  });

  const { data: activityStatuses } = useQuery<ActivityStatus[]>({
    queryKey: ["/api/activity-statuses"],
  });

  const generi = useCustomListValues("genere");

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      await apiRequest("POST", apiEndpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiEndpoint] });
      toast({ title: `${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)} creato con successo` });
      setIsFormOpen(false);
      setEditingItem(null);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      await apiRequest("PATCH", `${apiEndpoint}/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiEndpoint] });
      toast({ title: `${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)} aggiornato con successo` });
      setIsFormOpen(false);
      setEditingItem(null);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `${apiEndpoint}/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiEndpoint] });
      toast({ title: `${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)} eliminato con successo` });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {
      sku: formData.get("sku") as string || null,
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      categoryId: formData.get("categoryId") ? parseInt(formData.get("categoryId") as string) : null,
      studioId: formData.get("studioId") ? parseInt(formData.get("studioId") as string) : null,
      instructorId: formData.get("instructorId") ? parseInt(formData.get("instructorId") as string) : null,
      secondaryInstructor1Id: formData.get("secondaryInstructor1Id") ? parseInt(formData.get("secondaryInstructor1Id") as string) : null,
      quoteId: selectedQuoteId ? parseInt(selectedQuoteId) : null,
      price: price || null,
      maxCapacity: formData.get("maxCapacity") ? parseInt(formData.get("maxCapacity") as string) : null,
      dayOfWeek: selectedDayOfWeek || null,
      startTime: selectedStartTime || null,
      endTime: selectedEndTime || null,
      recurrenceType: selectedRecurrence || null,
      schedule: formData.get("schedule") as string || null,
      startDate: formData.get("startDate") as string || null,
      endDate: formData.get("endDate") as string || null,
      statusTags: selectedStatuses.length > 0 ? selectedStatuses : null,
      active: true,
    };

    if (activityType === "individual_lesson") {
      data.memberId = selectedMemberId ? parseInt(selectedMemberId) : null;
      data.targetPurpose = targetPurpose || null;
    } else if (activityType === "training") {
      data.difficultyLevel = difficultyLevel || null;
      data.equipment = equipment || null;
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (item: ActivityItem) => {
    setEditingItem(item);
    setSelectedDayOfWeek(item.dayOfWeek || "");
    setSelectedStartTime(item.startTime || "");
    setSelectedEndTime(item.endTime || "");
    setSelectedRecurrence(item.recurrenceType || "");
    setSelectedStatuses(parseStatusTags(item.statusTags));
    setSelectedQuoteId(item.quoteId?.toString() || "");
    setPrice(item.price || "");
    setSelectedMemberId((item as any).memberId?.toString() || "");
    setTargetPurpose((item as any).targetPurpose || "");
    setDifficultyLevel((item as any).difficultyLevel || "");
    setEquipment((item as any).equipment || "");
    setIsFormOpen(true);
  };

  const closeDialog = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    setSelectedDayOfWeek("");
    setSelectedStartTime("");
    setSelectedEndTime("");
    setSelectedRecurrence("");
    setSelectedStatuses([]);
    setSelectedQuoteId("");
    setPrice("");
    setSelectedMemberId("");
    setTargetPurpose("");
    setDifficultyLevel("");
    setEquipment("");
  };

  const filteredItems = items?.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const { sortConfig, handleSort, sortItems, isSortedColumn } = useSortableTable<typeof filteredItems[0]>("sku");

  const getSortValue = (item: typeof filteredItems[0], key: string) => {
    switch (key) {
      case "sku": return item.sku;
      case "name": return item.name;
      case "category": return categories?.find(c => c.id === item.categoryId)?.name;
      case "instructor": {
        const inst = instructors?.find(i => i.id === item.instructorId);
        return inst ? `${inst.lastName} ${inst.firstName}` : null;
      }
      case "price": return Number(item.price) || 0;
      case "capacity": return item.maxCapacity || 0;
      case "enrollment": return item.currentEnrollment || 0;
      case "period": return item.startDate;
      case "status": return parseStatusTags(item.statusTags).join(", ");
      default: return null;
    }
  };

  const sortedItems = sortItems(filteredItems, getSortValue);

  const exportToCSV = () => {
    if (!filteredItems.length) return;

    const headers = ["Nome", "Descrizione", "Categoria", "Staff/Insegnante", "Prezzo", "Iscritti", "Max Partecipanti", "Giorno", "Orario Inizio", "Orario Fine", "Ricorrenza", "Data Inizio", "Data Fine", "Stato"];

    const rows = filteredItems.map(item => {
      const category = categories?.find(c => c.id === item.categoryId);
      const instructor = instructors?.find(i => i.id === item.instructorId);
      const dayLabel = WEEKDAYS.find(d => d.id === item.dayOfWeek)?.label || "";
      const recurrenceLabel = RECURRENCE_TYPES.find(r => r.id === item.recurrenceType)?.label || "";

      return [
        item.name,
        item.description || "",
        category?.name || "",
        instructor ? `${instructor.lastName} ${instructor.firstName}` : "",
        item.price || "",
        item.currentEnrollment?.toString() || "0",
        item.maxCapacity || "",
        dayLabel,
        item.startTime || "",
        item.endTime || "",
        recurrenceLabel,
        item.startDate ? new Date(item.startDate).toLocaleDateString('it-IT') : "",
        item.endDate ? new Date(item.endDate).toLocaleDateString('it-IT') : "",
        item.active ? "Attivo" : "Inattivo"
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
    link.download = `${testIdPrefix}_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderForm = (defaultItem?: ActivityItem) => (
    <form onSubmit={handleSubmit} id={defaultItem ? `edit-${testIdPrefix}-form` : undefined} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Genere *</Label>
          <Combobox
             name="name"
             value={defaultItem?.name || ""}
             options={(generi || []).map((g: any) => ({ value: g, label: g }))}
             placeholder="Seleziona o scrivi genere..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">SKU/Codice</Label>
          <Input
            id="sku"
            name="sku"
            placeholder="es: 2526-NEMBRI-LUN-15"
            defaultValue={defaultItem?.sku || ""}
            data-testid={`input-${testIdPrefix}-sku`}
          />
        </div>
      </div>

      <MultiSelectStatus
        selectedStatuses={selectedStatuses}
        onChange={setSelectedStatuses}
        testIdPrefix={testIdPrefix}
      />

      <div className="space-y-2">
        <Label htmlFor="description">Descrizione</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultItem?.description || ""}
          data-testid={`input-${testIdPrefix}-description`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="categoryId">Categoria</Label>
          <Combobox
             name="categoryId"
             value={defaultItem?.categoryId?.toString()}
             options={(categories || []).map(c => ({ value: c.id.toString(), label: c.name }))}
             placeholder="Seleziona categoria"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="studioId">Studio/Sala</Label>
          <Combobox
             name="studioId"
             value={defaultItem?.studioId?.toString()}
             options={(studios || []).map(s => ({ value: s.id.toString(), label: s.name }))}
             placeholder="Seleziona studio"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Staff/Insegnanti</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="instructorId" className="text-sm text-muted-foreground">Principale</Label>
            <Combobox
               name="instructorId"
               value={defaultItem?.instructorId?.toString() || "none"}
               options={[{value: "none", label: "Seleziona"}, ...(instructors || []).map(i => ({ value: i.id.toString(), label: `${i.lastName} ${i.firstName}` }))]}
               placeholder="Seleziona"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryInstructor1Id" className="text-sm text-muted-foreground">Secondario 1{!defaultItem ? " (opzionale)" : ""}</Label>
            <Combobox
               name="secondaryInstructor1Id"
               value={defaultItem?.secondaryInstructor1Id?.toString() || "none"}
               options={[{value: "none", label: "Nessuno"}, ...(instructors || []).map(i => ({ value: i.id.toString(), label: `${i.lastName} ${i.firstName}` }))]}
               placeholder="Nessuno"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Prezzo (€)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            data-testid={`input-${testIdPrefix}-price`}
          />
        </div>

        <div className="space-y-2">
          <Label>Quota Base</Label>
          <Select value={selectedQuoteId} onValueChange={(val) => {
            setSelectedQuoteId(val === "_none" ? "" : val);
            const quote = quotes?.find(q => q.id.toString() === val);
            if (quote) setPrice(Number(quote.amount).toFixed(2));
          }}>
            <SelectTrigger title="Seleziona Quota">
              <SelectValue placeholder="Seleziona Quota" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Nessuna Quota</SelectItem>
              {quotes?.map((q) => (
                <SelectItem key={q.id} value={q.id.toString()}>
                  {q.name} (€{q.amount})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxCapacity">Posti Disponibili</Label>
          <Input
            id="maxCapacity"
            name="maxCapacity"
            type="number"
            min="1"
            defaultValue={defaultItem?.maxCapacity || ""}
            data-testid={`input-${testIdPrefix}-maxCapacity`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Data Inizio</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={defaultItem?.startDate || ""}
            data-testid={`input-${testIdPrefix}-startDate`}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Data Fine</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={defaultItem?.endDate || ""}
            data-testid={`input-${testIdPrefix}-endDate`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dayOfWeek">Giorno Settimana</Label>
          <Select value={selectedDayOfWeek} onValueChange={setSelectedDayOfWeek}>
            <SelectTrigger data-testid={`select-${testIdPrefix}-dayOfWeek`}>
              <SelectValue placeholder="Seleziona" />
            </SelectTrigger>
            <SelectContent>
              {WEEKDAYS.map((day) => (
                <SelectItem key={day.id} value={day.id}>
                  {day.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startTime">Ora Inizio</Label>
          <Select value={selectedStartTime} onValueChange={setSelectedStartTime}>
            <SelectTrigger data-testid={`select-${testIdPrefix}-startTime`}>
              <SelectValue placeholder="--:--" />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime">Ora Fine</Label>
          <Select value={selectedEndTime} onValueChange={setSelectedEndTime}>
            <SelectTrigger data-testid={`select-${testIdPrefix}-endTime`}>
              <SelectValue placeholder="--:--" />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="recurrenceType">Ricorrenza</Label>
          <Select value={selectedRecurrence} onValueChange={setSelectedRecurrence}>
            <SelectTrigger data-testid={`select-${testIdPrefix}-recurrenceType`}>
              <SelectValue placeholder="Seleziona" />
            </SelectTrigger>
            <SelectContent>
              {RECURRENCE_TYPES.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="schedule">Note Orario (opzionale)</Label>
        <Textarea
          id="schedule"
          name="schedule"
          placeholder="Note aggiuntive sull'orario"
          rows={2}
          defaultValue={defaultItem?.schedule || ""}
          data-testid={`input-${testIdPrefix}-schedule`}
        />
      </div>

      {/* BLOCCCHI CONDIZIONALI MODALE OPERATIVO CONDIVISO (FASE 21/23) */}
      {activityType === "individual_lesson" && (
        <div className="p-4 mt-6 border border-amber-500/30 bg-amber-500/5 rounded-md space-y-4">
          <h4 className="text-sm font-semibold text-amber-900 border-b border-amber-500/20 pb-2">Dettagli Specifici Lezione Privata</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Allievo / Partecipante Principale</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger className="bg-white/50">
                  <SelectValue placeholder="Seleziona allievo..." />
                </SelectTrigger>
                <SelectContent>
                  {membersList.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.lastName} {member.firstName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Obiettivo Specifico Sessione</Label>
              <Input 
                placeholder="Es. Rieducazione spalla, Potenziamento..." 
                className="bg-white/50" 
                value={targetPurpose}
                onChange={(e) => setTargetPurpose(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {activityType === "training" && (
        <div className="p-4 mt-6 border border-blue-500/30 bg-blue-500/5 rounded-md space-y-4">
          <h4 className="text-sm font-semibold text-blue-900 border-b border-blue-500/20 pb-2">Parametri Allenamento Autonomo</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Livello Consigliato / Intensità</Label>
              <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                <SelectTrigger className="bg-white/50"><SelectValue placeholder="Seleziona livello..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="base">Programma Base</SelectItem>
                  <SelectItem value="intermedio">Programma Intermedio</SelectItem>
                  <SelectItem value="avanzato">Programma Avanzato</SelectItem>
                  <SelectItem value="recupero">Recupero Attivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gruppo / Attrezzi Prenotati</Label>
              <Input 
                placeholder="Es. Macchinari Cardio, Circuito 1..." 
                className="bg-white/50" 
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={closeDialog}
          data-testid={`button-${testIdPrefix}-cancel`}
        >
          Annulla
        </Button>
        <Button
          type="submit"
          className="gold-3d-button"
          disabled={editingItem ? updateMutation.isPending : createMutation.isPending}
          data-testid={`button-${testIdPrefix}-submit`}
        >
          {editingItem ? "Salva Modifiche" : `Crea ${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)}`}
        </Button>
      </DialogFooter>
    </form>
  );

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
                <h1 className="text-2xl font-semibold text-foreground" data-testid={`text-${testIdPrefix}-title`}>{title}</h1>
                <p className="text-muted-foreground text-sm" data-testid={`text-${testIdPrefix}-subtitle`}>{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={exportToCSV}
                data-testid={`button-${testIdPrefix}-export-csv`}
              >
                <Download className="w-4 h-4 mr-2" />
                Esporta CSV
              </Button>
              <Button
                className="gold-3d-button"
                onClick={() => {
                  closeDialog();
                  setIsFormOpen(true);
                }}
                data-testid={`button-${testIdPrefix}-add`}
              >
                <Plus className="w-4 h-4 mr-2" />
                {`Nuovo ${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)}`}
              </Button>
            </div>
          </div>
          <ActivityNavMenu />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={`Cerca ${itemLabelPlural}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid={`input-${testIdPrefix}-search`}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium mb-2" data-testid={`text-${testIdPrefix}-empty`}>Nessun {itemLabel} trovato</p>
                <p className="text-sm">Inizia aggiungendo il primo {itemLabel}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead sortKey="sku" currentSort={sortConfig} onSort={handleSort}>SKU/Codice</SortableTableHead>
                    <SortableTableHead sortKey="name" currentSort={sortConfig} onSort={handleSort}>
                      {(activityType === "allenamenti" || activityType === "prenotazioni") ? "Genere" : "Nome"}
                    </SortableTableHead>
                    <SortableTableHead sortKey="category" currentSort={sortConfig} onSort={handleSort}>Categoria</SortableTableHead>
                    <SortableTableHead sortKey="instructor" currentSort={sortConfig} onSort={handleSort}>Staff/Insegnante</SortableTableHead>
                    <SortableTableHead sortKey="price" currentSort={sortConfig} onSort={handleSort}>Prezzo</SortableTableHead>
                    <SortableTableHead sortKey="enrollment" currentSort={sortConfig} onSort={handleSort}>Iscritti</SortableTableHead>
                    <SortableTableHead sortKey="capacity" currentSort={sortConfig} onSort={handleSort}>Posti Max</SortableTableHead>
                    <SortableTableHead sortKey="period" currentSort={sortConfig} onSort={handleSort}>Periodo</SortableTableHead>
                    <SortableTableHead sortKey="status" currentSort={sortConfig} onSort={handleSort}>Stato</SortableTableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((item) => (
                    <TableRow key={item.id} data-testid={`${testIdPrefix}-row-${item.id}`}>
                      <TableCell className={cn("text-xs text-muted-foreground", isSortedColumn("sku") && "sorted-column-cell")} data-testid={`text-${testIdPrefix}-sku-${item.id}`}>
                        {item.sku || "-"}
                      </TableCell>
                      <TableCell className={cn("font-medium", isSortedColumn("name") && "sorted-column-cell")}>{item.name}</TableCell>
                      <TableCell className={isSortedColumn("category") ? "sorted-column-cell" : undefined}>
                        {item.categoryName || categories?.find(c => c.id === item.categoryId)?.name || "-"}
                      </TableCell>
                      <TableCell className={isSortedColumn("instructor") ? "sorted-column-cell" : undefined}>
                        {instructors?.find(i => i.id === item.instructorId)
                          ? `${instructors.find(i => i.id === item.instructorId)?.lastName} ${instructors.find(i => i.id === item.instructorId)?.firstName}`
                          : "-"}
                      </TableCell>
                      <TableCell className={isSortedColumn("price") ? "sorted-column-cell" : undefined}>{item.price ? `€${item.price}` : "€0.00"}</TableCell>
                      <TableCell className={cn("text-center", isSortedColumn("enrollment") && "sorted-column-cell")}>
                        <Badge variant="secondary">{item.currentEnrollment || 0}</Badge>
                      </TableCell>
                      <TableCell className={isSortedColumn("capacity") ? "sorted-column-cell" : undefined}>{item.maxCapacity || "∞"}</TableCell>
                      <TableCell className={cn("text-sm", isSortedColumn("period") && "sorted-column-cell")}>
                        {item.startDate && item.endDate
                          ? `${new Date(item.startDate).toLocaleDateString('it-IT')} - ${new Date(item.endDate).toLocaleDateString('it-IT')}`
                          : "-"}
                      </TableCell>
                      <TableCell className={isSortedColumn("status") ? "sorted-column-cell" : undefined}>
                        <div className="flex flex-wrap gap-1">
                          {parseStatusTags(item.statusTags).filter(tag => tag.replace(/^STATE:/i, "") !== "ATTIVO").length > 0 ? (
                            parseStatusTags(item.statusTags)
                              .filter(tag => tag.replace(/^STATE:/i, "") !== "ATTIVO")
                              .map((tag) => (
                              <StatusBadge
                                key={tag}
                                name={tag.replace(/^STATE:/i, "")}
                                color={getStatusColor(tag, activityStatuses)}
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
                            onClick={() => setLocation(`${baseRoute}?activityId=${item.id}`)}
                            data-testid={`button-${testIdPrefix}-scheda-${item.id}`}
                          >
                            Scheda
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="gold-3d-button text-black"
                            onClick={() => openEditDialog(item)}
                            data-testid={`button-${testIdPrefix}-edit-${item.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-white text-black border-foreground/20 hover:bg-gray-50 dark:bg-white dark:text-black dark:hover:bg-gray-100"
                            onClick={() => {
                              if (confirm(`Sei sicuro di voler eliminare questo ${itemLabel}?`)) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                            data-testid={`button-${testIdPrefix}-delete-${item.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {["campus", "prenotazioni", "allenamenti", "domeniche", "workshop", "affitti", "saggi", "vacanze"].includes(activityType || "") ? (
        <CourseUnifiedModal 
          isOpen={isFormOpen} 
          onOpenChange={(open) => { if (!open) closeDialog(); }} 
          course={editingItem} 
          activityType={activityType as any} 
          onDuplicated={(newRecord) => {
            // F2-102: aggiorna editingItem col nuovo record (mantiene isFormOpen=true)
            setEditingItem(newRecord);
          }}
          onSuccess={() => { closeDialog(); queryClient.invalidateQueries({ queryKey: [apiEndpoint] }); }} 
        />
      ) : (
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          if (!open) closeDialog();
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid={`text-${testIdPrefix}-dialog-title`}>
                {editingItem ? `Modifica ${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)}` : `Nuovo ${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)}`}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? `Modifica i dettagli del ${itemLabel}` : `Inserisci i dettagli del ${itemLabel}`}
              </DialogDescription>
            </DialogHeader>
            {editingItem ? renderForm(editingItem) : renderForm()}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}