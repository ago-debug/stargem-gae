import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Combobox } from "@/components/ui/combobox";
import { Calendar, Users, MapPin, X, UserPlus, CalendarPlus, Trash2, Edit2 } from "lucide-react";
import { cn, parseStatusTags } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { hasWritePermission } from "@/App";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { useCustomListValues } from "@/hooks/use-custom-list";
import { MultiSelectStatus } from "@/components/multi-select-status";
import { CustomListManagerDialog } from "@/components/custom-list-manager-dialog";
import { CategoryManagerDialog } from "@/components/category-manager-dialog";
import type { Course, InsertCourse, Category, Instructor, Studio, Quote, Attendance, Member, ActivityStatus } from "@shared/schema";

const WEEKDAYS = [
  { id: "LUN", label: "Lunedì" },
  { id: "MAR", label: "Martedì" },
  { id: "MER", label: "Mercoledì" },
  { id: "GIO", label: "Giovedì" },
  { id: "VEN", label: "Venerdì" },
  { id: "SAB", label: "Sabato" },
  { id: "DOM", label: "Domenica" },
];

const TIME_SLOTS = Array.from({ length: 48 * 4 }, (_, i) => { 
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

const RECURRENCE_TYPES = [
  { id: "weekly", label: "Settimanale" },
  { id: "biweekly", label: "Bisettimanale" },
  { id: "monthly", label: "Mensile" },
  { id: "custom", label: "Personalizzato" },
];

const stripSeconds = (timeStr?: string | null) => timeStr ? timeStr.slice(0, 5) : "";
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
const getSafeDateStr = (dateVal: any) => {
  if (!dateVal) return "";
  try {
    return new Date(dateVal).toISOString().split('T')[0];
  } catch(e) {
    return "";
  }
};

// ============================================
// COMPONENTI TABS: Enrollments & Attendances
// ============================================

interface EnrollmentsTabProps {
  courseId: number;
}
function EnrollmentsTab({ courseId }: EnrollmentsTabProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canWrite = hasWritePermission(user, "/iscritti-corsi");
  const [isAddingEnrollment, setIsAddingEnrollment] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const { data: enrollments } = useQuery<any[]>({ queryKey: ["/api/enrollments?type=corsi"] });
  const { data: searchResults } = useQuery<{ members: Member[] }>({
    queryKey: ["/api/search/members", memberSearchQuery],
    enabled: memberSearchQuery.length >= 3,
  });

  const createEnrollmentMutation = useMutation({
    mutationFn: async (data: { memberId: number; courseId: number }) => {
      await apiRequest("POST", "/api/enrollments", { memberId: data.memberId, courseId: data.courseId, status: 'active' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments?type=corsi"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Iscrizione aggiunta con successo" });
      setIsAddingEnrollment(false);
      setSelectedMemberId(null);
    },
    onError: (error: Error) => toast({ title: "Errore", description: error.message, variant: "destructive" }),
  });

  const deleteEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      await apiRequest("DELETE", `/api/enrollments/${enrollmentId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments?type=corsi"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Iscrizione rimossa con successo" });
    },
    onError: (error: Error) => toast({ title: "Errore", description: error.message, variant: "destructive" }),
  });

  const courseEnrollments = enrollments
    ?.filter(e => e.courseId === courseId && (e.status === 'active' || !e.status))
    .map(e => ({
      enrollmentId: e.id, memberId: e.memberId, firstName: e.memberFirstName || '', lastName: e.memberLastName || '', email: e.memberEmail || '',
    })) || [];

  const { sortConfig, handleSort, sortItems, isSortedColumn } = useSortableTable<any>("lastName");
  const getSortValue = (enrollment: any, key: string) => {
    switch (key) { case "firstName": return enrollment.firstName || ""; case "lastName": return enrollment.lastName || ""; case "email": return enrollment.email || ""; default: return null; }
  };
  const sortedEnrollments = sortItems(courseEnrollments, getSortValue);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Membri Iscritti ({courseEnrollments.length})</h3>
        <Popover open={isAddingEnrollment} onOpenChange={setIsAddingEnrollment}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" disabled={!canWrite}><UserPlus className="w-4 h-4 mr-2" />Aggiungi Iscritto</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <Command shouldFilter={false}>
              <CommandInput placeholder="Cerca per cognome, nome o CF (min. 3 caratteri)..." value={memberSearchQuery} onValueChange={setMemberSearchQuery} />
              <CommandList>
                {memberSearchQuery.length < 3 ? <CommandEmpty>Digita almeno 3 caratteri per cercare</CommandEmpty> : !searchResults?.members?.length ? <CommandEmpty>Nessun membro trovato</CommandEmpty> : (
                  <CommandGroup>
                    {searchResults.members.filter(m => !courseEnrollments.some(e => e.memberId === m.id)).map(member => (
                        <CommandItem key={member.id} value={member.id.toString()} onSelect={() => { setSelectedMemberId(member.id); createEnrollmentMutation.mutate({ memberId: member.id, courseId }); setMemberSearchQuery(""); }}>
                          <div className="flex flex-col"><span className="font-medium">{member.lastName} {member.firstName}</span>{member.fiscalCode && <span className="text-xs text-muted-foreground">{member.fiscalCode}</span>}</div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {courseEnrollments.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Nessun membro iscritto a questo corso</p> : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead sortKey="firstName" currentSort={sortConfig} onSort={handleSort}>Nome</SortableTableHead>
                <SortableTableHead sortKey="lastName" currentSort={sortConfig} onSort={handleSort}>Cognome</SortableTableHead>
                <SortableTableHead sortKey="email" currentSort={sortConfig} onSort={handleSort}>Email</SortableTableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEnrollments.map((enrollment) => (
                <TableRow key={enrollment.enrollmentId}>
                  <TableCell className={cn("font-medium", isSortedColumn("firstName") && "sorted-column-cell")}>{enrollment.firstName}</TableCell>
                  <TableCell className={cn(isSortedColumn("lastName") && "sorted-column-cell")}>{enrollment.lastName}</TableCell>
                  <TableCell className={cn(isSortedColumn("email") && "sorted-column-cell")}>{enrollment.email || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/anagrafica_a_lista?search=${encodeURIComponent(`${enrollment.lastName} ${enrollment.firstName}`)}`}>
                        <Button variant="ghost" size="sm">Visualizza</Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm("Sei sicuro di voler rimuovere questa iscrizione?")) { deleteEnrollmentMutation.mutate(enrollment.enrollmentId); } }} disabled={!canWrite}><X className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

interface AttendancesTabProps {
  courseId: number;
}
function AttendancesTab({ courseId }: AttendancesTabProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canWrite = hasWritePermission(user, "/iscritti-corsi");
  const [isAddingAttendance, setIsAddingAttendance] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: attendances } = useQuery<Attendance[]>({ queryKey: ["/api/attendances"] });
  const { data: membersData } = useQuery<{ members: Member[], total: number }>({ queryKey: ["/api/members"] });
  const members = membersData?.members || [];
  const { data: enrollments } = useQuery<any[]>({ queryKey: ["/api/enrollments?type=corsi"] });

  const createAttendanceMutation = useMutation({
    mutationFn: async (data: { memberId: number; courseId: number; attendanceDate: string }) => {
      await apiRequest("POST", "/api/attendances", { memberId: data.memberId, courseId: data.courseId, attendanceDate: new Date(data.attendanceDate).toISOString(), type: 'manual' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendances"] });
      toast({ title: "Presenza registrata con successo" });
      setIsAddingAttendance(false);
      setSelectedMemberId(null);
      setAttendanceDate(new Date().toISOString().split('T')[0]);
    },
    onError: (error: Error) => toast({ title: "Errore", description: error.message, variant: "destructive" }),
  });

  const deleteAttendanceMutation = useMutation({
    mutationFn: async (attendanceId: number) => {
      await apiRequest("DELETE", `/api/attendances/${attendanceId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendances"] });
      toast({ title: "Successo", description: "Presenza eliminata" });
    },
    onError: (error: Error) => toast({ title: "Errore", description: error.message, variant: "destructive" }),
  });

  const courseAttendances = attendances?.filter(a => a.courseId === courseId).map(a => {
      const member = members?.find(m => m.id === a.memberId);
      return { ...a, memberName: member ? `${member.lastName} ${member.firstName}` : "Sconosciuto" };
    }).sort((a, b) => new Date(b.attendanceDate).getTime() - new Date(a.attendanceDate).getTime()).slice(0, 50) || [];

  const enrolledMembers = enrollments?.filter(e => e.courseId === courseId && (e.status === 'active' || !e.status)).map(e => members?.find(m => m.id === e.memberId)).filter((m): m is Member => m !== undefined) || [];

  const { sortConfig, handleSort, sortItems, isSortedColumn } = useSortableTable<any>("attendanceDate");
  const getSortValue = (attendance: any, key: string) => {
    switch (key) { case "member": return attendance.memberName || ""; case "attendanceDate": return attendance.attendanceDate || ""; case "type": return attendance.type || ""; default: return null; }
  };
  const sortedAttendances = sortItems(courseAttendances, getSortValue);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Presenze Registrate</h3>
        <Dialog open={isAddingAttendance} onOpenChange={setIsAddingAttendance}>
          <Button variant="outline" size="sm" onClick={() => setIsAddingAttendance(true)} disabled={!canWrite}><CalendarPlus className="w-4 h-4 mr-2" />Registra Presenza</Button>
          <DialogContent>
            <DialogHeader><DialogTitle>Registra Presenza</DialogTitle><DialogDescription>Seleziona il membro e la data della presenza</DialogDescription></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="member">Membro *</Label>
                <Select value={selectedMemberId?.toString() || ""} onValueChange={(v) => setSelectedMemberId(parseInt(v))}>
                  <SelectTrigger><SelectValue placeholder="Seleziona membro" /></SelectTrigger>
                  <SelectContent>
                    {enrolledMembers.map(member => <SelectItem key={member.id} value={member.id.toString()}>{member.lastName} {member.firstName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="attendanceDate">Data e Ora *</Label>
                <Input id="attendanceDate" type="datetime-local" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingAttendance(false)}>Annulla</Button>
              <Button onClick={() => { if (!selectedMemberId) { toast({ title: "Errore", description: "Seleziona un membro", variant: "destructive" }); return; } createAttendanceMutation.mutate({ memberId: selectedMemberId, courseId, attendanceDate }); }} disabled={!selectedMemberId || createAttendanceMutation.isPending}>Registra</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {courseAttendances.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Nessuna presenza registrata per questo corso</p> : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead sortKey="member" currentSort={sortConfig} onSort={handleSort}>Membro</SortableTableHead>
                <SortableTableHead sortKey="attendanceDate" currentSort={sortConfig} onSort={handleSort}>Data e Ora</SortableTableHead>
                <SortableTableHead sortKey="type" currentSort={sortConfig} onSort={handleSort}>Tipo</SortableTableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAttendances.map((attendance: any) => (
                <TableRow key={attendance.id}>
                  <TableCell className={cn("font-medium", isSortedColumn("member") && "sorted-column-cell")}>{attendance.memberName}</TableCell>
                  <TableCell className={cn(isSortedColumn("attendanceDate") && "sorted-column-cell")}>{format(new Date(attendance.attendanceDate), "dd/MM/yyyy HH:mm", { locale: it })}</TableCell>
                  <TableCell className={cn(isSortedColumn("type") && "sorted-column-cell")}><Badge variant="outline">{attendance.type === 'manual' ? 'Manuale' : attendance.type === 'barcode' ? 'Badge' : 'Auto'}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm("Sei sicuro di voler eliminare questa presenza?")) { deleteAttendanceMutation.mutate(attendance.id); } }} disabled={!canWrite}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT: CourseUnifiedModal
// ============================================

export interface CourseUnifiedModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
  defaultValues?: Partial<InsertCourse>;
  onSuccess?: () => void;
  onDelete?: (id: number) => void;
}

export function CourseUnifiedModal({ isOpen, onOpenChange, course, defaultValues, onSuccess, onDelete }: CourseUnifiedModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const canWrite = hasWritePermission(user, "/corsi");

  const [activeTab, setActiveTab] = useState("details");
  const isEdit = !!course?.id;

  const [isGenereModalOpen, setIsGenereModalOpen] = useState(false);
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
  const [isPostiModalOpen, setIsPostiModalOpen] = useState(false);

  // Dati da Liste e DB
  const nomiCorsi = useCustomListValues("nomi_corsi");
  const postiDisponibili = useCustomListValues("posti_disponibili");
  const { data: activityStatuses } = useQuery<ActivityStatus[]>({ queryKey: ["/api/activity-statuses"] });
  const baseStati = ["ATTIVO", "IN PROGRAMMA", "COMPLETO", "ANNULLATO"];
  const finalStati = activityStatuses && activityStatuses.length > 0 ? activityStatuses.filter(s => s.active).map(s => s.name) : baseStati;
  const { data: categories } = useQuery<Category[]>({ queryKey: ["/api/categories"] });
  const { data: studios } = useQuery<Studio[]>({ queryKey: ["/api/studios"] });
  const { data: instructors } = useQuery<Instructor[]>({ queryKey: ["/api/instructors"] });
  const { data: quotes } = useQuery<Quote[]>({ queryKey: ["/api/quotes"] });

  // State della Form
  const [formData, setFormData] = useState<Partial<InsertCourse>>({});
  
  // State Operativo (Multi) e Flags Promo
  const [opStates, setOpStates] = useState<string[]>(["ATTIVO"]);
  const [promoFlags, setPromoFlags] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (course) {
        setFormData({ ...course });
        setActiveTab("details");
        // Estrazione Op State e Promos
        const tags = parseStatusTags(course.statusTags);
        const opTags = tags.filter(t => t.startsWith("STATE:")).map(t => t.replace("STATE:", ""));
        if (opTags.length > 0) {
          setOpStates(opTags);
        } else {
          setOpStates(course.active === false || tags.includes("ANNULLATO") || tags.includes("INATTIVO") ? ["ANNULLATO"] : ["ATTIVO"]);
        }
        setPromoFlags(tags.filter(t => t.startsWith("PROMO:")).map(t => t.replace("PROMO:", "")));
      } else {
        setFormData(defaultValues || {});
        setActiveTab("details");
        setOpStates(["ATTIVO"]);
        setPromoFlags([]);
      }
    }
  }, [isOpen, course, defaultValues]);

  const updateForm = (key: keyof InsertCourse, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handlePromoChange = (flag: string, isChecked: boolean) => {
    if (isChecked) {
      setPromoFlags(prev => [...prev].filter(f => f !== flag).concat(flag));
    } else {
      setPromoFlags(prev => prev.filter(f => f !== flag));
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: InsertCourse) => {
      try {
        await apiRequest("POST", "/api/courses", data);
      } catch (err: any) {
        if (err.status === 409) {
          if (confirm(err.message || "Conflitto rilevato. Forzare inserimento?")) {
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
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      toast({ title: "Corso creato con successo" });
      onOpenChange(false);
      onSuccess?.();
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
          if (confirm(err.message || "Conflitto rilevato. Forzare inserimento?")) {
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
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      toast({ title: "Corso aggiornato con successo" });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (error.message !== "Operazione annullata") {
        toast({ title: "Errore", description: error.message, variant: "destructive" });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Costruiamo statusTags in formato consistente multi-stato
    const mergedTags = [...opStates.map(s => `STATE:${s}`), ...promoFlags.map(p => `PROMO:${p}`)];
    const isActive = !opStates.includes("ANNULLATO");

    const payload: InsertCourse = {
      sku: formData.sku || null,
      name: formData.name as string,
      description: formData.description || null,
      categoryId: formData.categoryId || null,
      studioId: formData.studioId || null,
      instructorId: formData.instructorId || null,
      secondaryInstructor1Id: formData.secondaryInstructor1Id || null,
      price: formData.price?.toString() || null,
      maxCapacity: formData.maxCapacity ? parseInt(formData.maxCapacity as any) : null,
      dayOfWeek: selectedDayOfWeek || null,
      startTime: selectedStartTime || null,
      endTime: selectedEndTime || null,
      recurrenceType: formData.recurrenceType || null,
      schedule: formData.schedule || null,
      startDate: formData.startDate ? new Date(formData.startDate) : null,
      endDate: formData.endDate ? new Date(formData.endDate) : null,
      statusTags: mergedTags,
      active: isActive,
      quoteId: formData.quoteId || null,
    };

    if (isEdit && course?.id) {
      updateMutation.mutate({ id: course.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const selectedDayOfWeek = normalizeDay(formData.dayOfWeek);
  const selectedStartTime = stripSeconds(formData.startTime);
  const selectedEndTime = stripSeconds(formData.endTime);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto w-full">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifica Corso" : "Nuovo Corso"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Gestisci informazioni, iscritti e presenze." : "Inserisci i dettagli del corso."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {isEdit && (
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="details">Dettagli</TabsTrigger>
              <TabsTrigger value="enrollments"><Users className="w-4 h-4 mr-1" /> Iscritti</TabsTrigger>
              <TabsTrigger value="attendances"><Calendar className="w-4 h-4 mr-1" /> Presenze</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="details" className="pt-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-between items-center gap-2 flex-wrap bg-slate-50 p-3 rounded-md border text-sm">
                <MultiSelectStatus selectedStatuses={opStates} onChange={setOpStates} testIdPrefix="course" />

                <div className="flex items-center gap-4 border-l border-slate-300 pl-4 shrink-0 flex-wrap">
                  <Label className="font-semibold text-slate-800">Flags Marketing:</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="promo-gratuita" checked={promoFlags.includes("GRATUITA")} onCheckedChange={(c) => handlePromoChange("GRATUITA", !!c)} />
                    <label htmlFor="promo-gratuita" className="text-xs leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">Prova Gratuita</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="promo-online" checked={promoFlags.includes("ONLINE")} onCheckedChange={(c) => handlePromoChange("ONLINE", !!c)} />
                    <label htmlFor="promo-online" className="text-xs leading-none cursor-pointer">Iscrizione Online</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="promo-attiva" checked={promoFlags.includes("PROMO")} onCheckedChange={(c) => handlePromoChange("PROMO", !!c)} />
                    <label htmlFor="promo-attiva" className="text-xs text-[#d4af37] font-semibold leading-none cursor-pointer">PROMO</label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                  <Label className="font-semibold text-slate-800 shrink-0">Genere / Nome Corso *</Label>
                  <Edit2 
                    className="w-3 h-3 text-amber-500 cursor-pointer hover:text-amber-600 transition-colors" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsGenereModalOpen(true);
                    }} 
                  />
                </div>
                  <Combobox
                    name="name"
                    value={formData.name || ""}
                    options={(nomiCorsi || []).map(val => ({ value: val, label: val }))}
                    onValueChange={(val) => updateForm("name", val)}
                    placeholder="Cerca genere..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU / Codice</Label>
                  <Input id="sku" value={formData.sku || ""} onChange={(e) => updateForm("sku", e.target.value)} placeholder="es: 2526-CORSO-1" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                  <Label className="font-semibold text-slate-800 shrink-0">Categoria</Label>
                  <Edit2 
                    className="w-3 h-3 text-amber-500 cursor-pointer hover:text-amber-600 transition-colors" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsCategoriaModalOpen(true);
                    }} 
                  />
                </div>
                  <Combobox
                    name="categoryId"
                    value={formData.categoryId?.toString() || "none"}
                    onValueChange={val => updateForm("categoryId", val === "none" ? null : parseInt(val))}
                    options={[{value: "none", label: "Nessuna categoria"}, ...(categories || []).map(c => ({ value: c.id.toString(), label: c.name }))]}
                    placeholder="Seleziona categoria"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Studio / Sala</Label>
                  <Combobox
                    name="studioId"
                    value={formData.studioId?.toString() || "none"}
                    onValueChange={val => updateForm("studioId", val === "none" ? null : parseInt(val))}
                    options={[{value: "none", label: "Nessuno studio"}, ...(studios || []).map(s => ({ value: s.id.toString(), label: s.name }))]}
                    placeholder="Seleziona studio"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Insegnante Principale</Label>
                  <Combobox
                    name="instructorId"
                    value={formData.instructorId?.toString() || "none"}
                    onValueChange={val => updateForm("instructorId", val === "none" ? null : parseInt(val))}
                    options={[{value: "none", label: "Nessuno"}, ...(instructors || []).map(i => ({ value: i.id.toString(), label: `${i.lastName} ${i.firstName}` }))]}
                    placeholder="Cerca Insegnante..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Insegnante Secondario</Label>
                  <Combobox
                    name="secondaryInstructor1Id"
                    value={formData.secondaryInstructor1Id?.toString() || "none"}
                    onValueChange={val => updateForm("secondaryInstructor1Id", val === "none" ? null : parseInt(val))}
                    options={[{value: "none", label: "Nessuno"}, ...(instructors || []).map(i => ({ value: i.id.toString(), label: `${i.lastName} ${i.firstName}` }))]}
                    placeholder="Cerca Insegnante..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Prezzo (€)</Label>
                  <Input id="price" type="number" step="0.01" min="0" value={formData.price || ""} onChange={e => updateForm("price", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Quota da usare come base (opzionale)</Label>
                  <Select value={formData.quoteId?.toString() || "none"} onValueChange={(val) => {
                    const quoteId = val === "none" ? null : parseInt(val);
                    const quote = quotes?.find(q => q.id === quoteId);
                    updateForm("quoteId", quoteId);
                    if (quote) { updateForm("price", Number(quote.amount).toFixed(2)); }
                  }}>
                    <SelectTrigger><SelectValue placeholder="Seleziona Quota" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessuna Quota</SelectItem>
                      {quotes?.map((q) => <SelectItem key={q.id} value={q.id.toString()}>{q.name} (€{q.amount})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="maxCapacity" className="font-semibold text-slate-800 shrink-0">Posti Disponibili</Label>
                    <Edit2 
                      className="w-3 h-3 text-amber-500 cursor-pointer hover:text-amber-600 transition-colors" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsPostiModalOpen(true);
                      }} 
                    />
                  </div>
                  <Select value={formData.maxCapacity?.toString() || "none"} onValueChange={v => updateForm("maxCapacity", v === "none" ? null : parseInt(v))}>
                    <SelectTrigger><SelectValue placeholder="Posti" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Illimitati</SelectItem>
                      {postiDisponibili?.map((p: string) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-md relative bg-slate-50/50">
                <div className="absolute -top-3 left-3 bg-white px-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Pianificazione Oraria</span>
                </div>
                <div className="space-y-2">
                  <Label>Giorno</Label>
                  <Select value={selectedDayOfWeek || "none"} onValueChange={val => updateForm("dayOfWeek", val === "none" ? null : val)}>
                    <SelectTrigger><SelectValue placeholder="Giorno" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Non definito</SelectItem>
                      {WEEKDAYS.map(d => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Inizio</Label>
                  <Input type="time" value={selectedStartTime} onChange={(e) => updateForm("startTime", e.target.value || null)} className="min-w-[100px]" />
                </div>
                <div className="space-y-2">
                  <Label>Fine</Label>
                  <Input type="time" value={selectedEndTime} onChange={(e) => updateForm("endTime", e.target.value || null)} className="min-w-[100px]" />
                </div>
                <div className="space-y-2">
                  <Label>Ricorrenza</Label>
                  <Select value={formData.recurrenceType || "none"} onValueChange={val => updateForm("recurrenceType", val === "none" ? null : val)}>
                    <SelectTrigger><SelectValue placeholder="Periodo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessuna (Evento singolo)</SelectItem>
                      {RECURRENCE_TYPES.map(r => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label>Validità Dal</Label>
                    <Input type="date" value={getSafeDateStr(formData.startDate)} onChange={e => updateForm("startDate", e.target.value || null)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Validità Al</Label>
                    <Input type="date" value={getSafeDateStr(formData.endDate)} onChange={e => updateForm("endDate", e.target.value || null)} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrizione per Scheda Web (opzionale)</Label>
                <Textarea id="description" value={formData.description || ""} onChange={e => updateForm("description", e.target.value)} rows={2} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule">Note su Orari / Turni Extra (opzionale)</Label>
                <Textarea id="schedule" value={formData.schedule || ""} onChange={e => updateForm("schedule", e.target.value)} rows={1} />
              </div>

              <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t flex items-center justify-between w-full mt-6">
                <div>
                  {isEdit && onDelete && canWrite && (
                    <Button type="button" variant="destructive" size="sm" onClick={() => { if (confirm("Sei sicuro di voler eliminare totalmente il corso?")) { onDelete(course.id); onOpenChange(false); } }}>Elimina Corso</Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
                  <Button type="submit" disabled={updateMutation.isPending || createMutation.isPending} className="gold-3d-button text-black">
                    {updateMutation.isPending || createMutation.isPending ? "Salvataggio..." : (isEdit ? "Salva Modifiche" : "Crea Corso")}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </TabsContent>

          {isEdit && (
            <TabsContent value="enrollments">
              <EnrollmentsTab courseId={course.id} />
            </TabsContent>
          )}

          {isEdit && (
            <TabsContent value="attendances">
              <AttendancesTab courseId={course.id} />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
    <CustomListManagerDialog listType="nomi_corsi" title="Gestione Generi / Nomi Corsi" open={isGenereModalOpen} onOpenChange={setIsGenereModalOpen} />
    <CategoryManagerDialog open={isCategoriaModalOpen} onOpenChange={setIsCategoriaModalOpen} />
    <CustomListManagerDialog listType="posti_disponibili" title="Gestione Posti Disponibili" open={isPostiModalOpen} onOpenChange={setIsPostiModalOpen} />
    </>
  );
}
