import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, Download, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Instructor, Studio } from "@shared/schema";

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
  studioId: number | null;
  instructorId: number | null;
  secondaryInstructor1Id: number | null;
  secondaryInstructor2Id: number | null;
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
  testIdPrefix: string;
}

export default function ActivityManagementPage({
  title,
  subtitle,
  apiEndpoint,
  categoryApiEndpoint,
  itemLabel,
  itemLabelPlural,
  testIdPrefix,
}: ActivityManagementPageProps) {
  const { toast } = useToast();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const initialSearch = urlParams.get('search') || "";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActivityItem | null>(null);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<string>("");
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [selectedEndTime, setSelectedEndTime] = useState<string>("");
  const [selectedRecurrence, setSelectedRecurrence] = useState<string>("");

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
      secondaryInstructor2Id: formData.get("secondaryInstructor2Id") ? parseInt(formData.get("secondaryInstructor2Id") as string) : null,
      price: formData.get("price") ? formData.get("price") as string : null,
      maxCapacity: formData.get("maxCapacity") ? parseInt(formData.get("maxCapacity") as string) : null,
      dayOfWeek: selectedDayOfWeek || null,
      startTime: selectedStartTime || null,
      endTime: selectedEndTime || null,
      recurrenceType: selectedRecurrence || null,
      schedule: formData.get("schedule") as string || null,
      startDate: formData.get("startDate") as string || null,
      endDate: formData.get("endDate") as string || null,
      active: true,
    };

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
    setIsFormOpen(true);
  };

  const closeDialog = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    setSelectedDayOfWeek("");
    setSelectedStartTime("");
    setSelectedEndTime("");
    setSelectedRecurrence("");
  };

  const filteredItems = items?.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const exportToCSV = () => {
    if (!filteredItems.length) return;

    const headers = ["Nome", "Descrizione", "Categoria", "Staff/Insegnante", "Prezzo", "Max Partecipanti", "Giorno", "Orario Inizio", "Orario Fine", "Ricorrenza", "Data Inizio", "Data Fine", "Stato"];

    const rows = filteredItems.map(item => {
      const category = categories?.find(c => c.id === item.categoryId);
      const instructor = instructors?.find(i => i.id === item.instructorId);
      const dayLabel = WEEKDAYS.find(d => d.id === item.dayOfWeek)?.label || "";
      const recurrenceLabel = RECURRENCE_TYPES.find(r => r.id === item.recurrenceType)?.label || "";

      return [
        item.name,
        item.description || "",
        category?.name || "",
        instructor ? `${instructor.firstName} ${instructor.lastName}` : "",
        item.price || "",
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
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={defaultItem?.name || ""}
            data-testid={`input-${testIdPrefix}-name`}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            name="sku"
            placeholder="es: SKU-2526"
            defaultValue={defaultItem?.sku || ""}
            data-testid={`input-${testIdPrefix}-sku`}
          />
        </div>
      </div>

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
          <Select name="categoryId" defaultValue={defaultItem?.categoryId?.toString()}>
            <SelectTrigger data-testid={`select-${testIdPrefix}-category`}>
              <SelectValue placeholder="Seleziona categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="studioId">Studio/Sala</Label>
          <Select name="studioId" defaultValue={defaultItem?.studioId?.toString()}>
            <SelectTrigger data-testid={`select-${testIdPrefix}-studio`}>
              <SelectValue placeholder="Seleziona studio" />
            </SelectTrigger>
            <SelectContent>
              {studios?.map((studio) => (
                <SelectItem key={studio.id} value={studio.id.toString()}>
                  {studio.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Staff/Insegnanti</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="instructorId" className="text-sm text-muted-foreground">Principale</Label>
            <Select name="instructorId" defaultValue={defaultItem?.instructorId?.toString()}>
              <SelectTrigger data-testid={`select-${testIdPrefix}-instructor`}>
                <SelectValue placeholder="Seleziona" />
              </SelectTrigger>
              <SelectContent>
                {instructors?.map((instructor) => (
                  <SelectItem key={instructor.id} value={instructor.id.toString()}>
                    {instructor.firstName} {instructor.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryInstructor1Id" className="text-sm text-muted-foreground">Secondario 1{!defaultItem ? " (opzionale)" : ""}</Label>
            <Select name="secondaryInstructor1Id" defaultValue={defaultItem?.secondaryInstructor1Id?.toString()}>
              <SelectTrigger data-testid={`select-${testIdPrefix}-secondary-instructor-1`}>
                <SelectValue placeholder="Nessuno" />
              </SelectTrigger>
              <SelectContent>
                {instructors?.map((instructor) => (
                  <SelectItem key={instructor.id} value={instructor.id.toString()}>
                    {instructor.firstName} {instructor.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryInstructor2Id" className="text-sm text-muted-foreground">Secondario 2{!defaultItem ? " (opzionale)" : ""}</Label>
            <Select name="secondaryInstructor2Id" defaultValue={defaultItem?.secondaryInstructor2Id?.toString()}>
              <SelectTrigger data-testid={`select-${testIdPrefix}-secondary-instructor-2`}>
                <SelectValue placeholder="Nessuno" />
              </SelectTrigger>
              <SelectContent>
                {instructors?.map((instructor) => (
                  <SelectItem key={instructor.id} value={instructor.id.toString()}>
                    {instructor.firstName} {instructor.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            defaultValue={defaultItem?.price || ""}
            data-testid={`input-${testIdPrefix}-price`}
          />
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
          disabled={editingItem ? updateMutation.isPending : createMutation.isPending}
          data-testid={`button-${testIdPrefix}-submit`}
        >
          {editingItem ? "Salva Modifiche" : `Crea ${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)}`}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => window.history.back()} data-testid="button-back">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Indietro
      </Button>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2" data-testid={`text-${testIdPrefix}-title`}>{title}</h1>
          <p className="text-muted-foreground" data-testid={`text-${testIdPrefix}-subtitle`}>{subtitle}</p>
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
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Staff/Insegnante</TableHead>
                  <TableHead>Prezzo</TableHead>
                  <TableHead>Posti</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} data-testid={`${testIdPrefix}-row-${item.id}`}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      {categories?.find(c => c.id === item.categoryId)?.name || "-"}
                    </TableCell>
                    <TableCell>
                      {instructors?.find(i => i.id === item.instructorId)
                        ? `${instructors.find(i => i.id === item.instructorId)?.firstName} ${instructors.find(i => i.id === item.instructorId)?.lastName}`
                        : "-"}
                    </TableCell>
                    <TableCell>{item.price ? `€${item.price}` : "€0.00"}</TableCell>
                    <TableCell>{item.maxCapacity || "∞"}</TableCell>
                    <TableCell className="text-sm">
                      {item.startDate && item.endDate
                        ? `${new Date(item.startDate).toLocaleDateString('it-IT')} - ${new Date(item.endDate).toLocaleDateString('it-IT')}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.active ? "default" : "secondary"}>
                        {item.active ? "Attivo" : "Inattivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                          data-testid={`button-${testIdPrefix}-edit-${item.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
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
    </div>
  );
}