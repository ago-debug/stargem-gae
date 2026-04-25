import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Combobox } from "@/components/ui/combobox";
import { Calendar, Users, MapPin, X, UserPlus, CalendarPlus, Trash2, Edit2, Edit } from "lucide-react";
import { cn, parseStatusTags, getSeasonLabel } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { hasWritePermission } from "@/App";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { useCustomList, useCustomListValues } from "@/hooks/use-custom-list";
import { MultiSelectStatus } from "@/components/multi-select-status";
import { MultiSelectInternal } from "@/components/multi-select-internal";
import { CustomListManagerDialog } from "@/components/custom-list-manager-dialog";
import { MultiSelectCustomList } from "@/components/ui/multi-select-custom-list";
import { QuickMemberAddModal } from "./QuickMemberAddModal";
import { MessageSquare, Mail, Phone } from "lucide-react";
import { IndividualPricing } from "@/components/ui/individual-pricing";
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
  { id: "daily", label: "Giornaliera" },
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
  activityId: number;
  activityType: "course" | "workshop" | "campus" | "prenotazioni" | "allenamenti" | "domeniche" | "saggi" | "vacanze" | "affitti";
}
function EnrollmentsTab({ activityId, activityType }: EnrollmentsTabProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canWrite = hasWritePermission(user, "/iscritti-corsi");
  const [isAddingEnrollment, setIsAddingEnrollment] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const enrollmentsQueryKey = activityType === "campus" ? "/api/campus-enrollments" : activityType === "workshop" ? "/api/workshop-enrollments" : "/api/enrollments?type=corsi";
  const parentQueryKey = activityType === "campus" ? "/api/courses?activityType=campus" : activityType === "workshop" ? "/api/workshops" : "/api/courses";

  const { data: enrollments } = useQuery<any[]>({ queryKey: [enrollmentsQueryKey] });
  const { data: searchResults } = useQuery<{ members: Member[] }>({
    queryKey: ["/api/search/members", memberSearchQuery],
    enabled: memberSearchQuery.length >= 3,
  });

  const createEnrollmentMutation = useMutation({
    mutationFn: async (data: { memberId: number; activityId: number }) => {
      if (activityType === "campus") {
        await apiRequest("POST", "/api/campus-enrollments", { memberId: data.memberId, campusActivityId: data.activityId, status: 'active' });
      } else if (activityType === "workshop") {
        await apiRequest("POST", "/api/workshop-enrollments", { memberId: data.memberId, workshopId: data.activityId, status: 'active', startDate: new Date().toISOString().split('T')[0] });
      } else {
        await apiRequest("POST", "/api/enrollments", { memberId: data.memberId, courseId: data.activityId, status: 'active' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [enrollmentsQueryKey] });
      queryClient.invalidateQueries({ queryKey: [parentQueryKey] });
      toast({ title: "Iscrizione aggiunta con successo" });
      setIsAddingEnrollment(false);
      setSelectedMemberId(null);
    },
    onError: (error: Error) => toast({ title: "Errore", description: error.message, variant: "destructive" }),
  });

  const deleteEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      const endpoint = activityType === "campus" ? `/api/campus-enrollments/${enrollmentId}` : activityType === "workshop" ? `/api/workshop-enrollments/${enrollmentId}` : `/api/enrollments/${enrollmentId}`;
      await apiRequest("DELETE", endpoint, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [enrollmentsQueryKey] });
      queryClient.invalidateQueries({ queryKey: [parentQueryKey] });
      toast({ title: "Iscrizione rimossa con successo" });
    },
    onError: (error: Error) => toast({ title: "Errore", description: error.message, variant: "destructive" }),
  });

  const courseEnrollments = enrollments
    ?.filter(e => (activityType === "campus" ? e.campusActivityId : activityType === "workshop" ? e.workshopId : e.courseId) === activityId && (e.status === 'active' || !e.status))
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
                        <CommandItem key={member.id} value={member.id.toString()} onSelect={() => { setSelectedMemberId(member.id); createEnrollmentMutation.mutate({ memberId: member.id, activityId }); setMemberSearchQuery(""); }}>
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
      {courseEnrollments.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Nessun membro iscritto a questa attività</p> : (
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
  activityId: number;
  activityType: "course" | "workshop" | "campus" | "prenotazioni" | "allenamenti" | "domeniche" | "saggi" | "vacanze" | "affitti";
}
function AttendancesTab({ activityId, activityType }: AttendancesTabProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canWrite = hasWritePermission(user, "/iscritti-corsi");
  const [isAddingAttendance, setIsAddingAttendance] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  const attendancesQueryKey = activityType === "workshop" ? "/api/workshop-attendances" : "/api/attendances";
  const enrollmentsQueryKey = activityType === "workshop" ? "/api/workshop-enrollments" : "/api/enrollments?type=corsi";

  const { data: attendances } = useQuery<Attendance[]>({ queryKey: [attendancesQueryKey] });
  const { data: membersData } = useQuery<{ members: Member[], total: number }>({ queryKey: ["/api/members"] });
  const members = membersData?.members || [];
  const { data: enrollments } = useQuery<any[]>({ queryKey: [enrollmentsQueryKey] });

  const createAttendanceMutation = useMutation({
    mutationFn: async (data: { memberId: number; activityId: number; attendanceDate: string }) => {
      if (activityType === "workshop") {
        await apiRequest("POST", "/api/workshop-attendances", { memberId: data.memberId, workshopId: data.activityId, attendanceDate: new Date(data.attendanceDate).toISOString(), type: 'manual' });
      } else {
        await apiRequest("POST", "/api/attendances", { memberId: data.memberId, courseId: data.activityId, attendanceDate: new Date(data.attendanceDate).toISOString(), type: 'manual' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [attendancesQueryKey] });
      toast({ title: "Presenza registrata con successo" });
      setIsAddingAttendance(false);
      setSelectedMemberId(null);
      setAttendanceDate(new Date().toISOString().split('T')[0]);
    },
    onError: (error: Error) => toast({ title: "Errore", description: error.message, variant: "destructive" }),
  });

  const deleteAttendanceMutation = useMutation({
    mutationFn: async (attendanceId: number) => {
      const endpoint = activityType === "workshop" ? `/api/workshop-attendances/${attendanceId}` : `/api/attendances/${attendanceId}`;
      await apiRequest("DELETE", endpoint, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [attendancesQueryKey] });
      toast({ title: "Successo", description: "Presenza eliminata" });
    },
    onError: (error: Error) => toast({ title: "Errore", description: error.message, variant: "destructive" }),
  });

  const courseAttendances = attendances?.filter(a => (activityType === "workshop" ? (a as any).workshopId : a.courseId) === activityId).map(a => {
      const member = members?.find(m => m.id === a.memberId);
      return { ...a, memberName: member ? `${member.lastName} ${member.firstName}` : "Sconosciuto" };
    }).sort((a, b) => new Date(b.attendanceDate).getTime() - new Date(a.attendanceDate).getTime()).slice(0, 50) || [];

  const enrolledMembers = enrollments?.filter(e => (activityType === "workshop" ? e.workshopId : e.courseId) === activityId && (e.status === 'active' || !e.status)).map(e => members?.find(m => m.id === e.memberId)).filter((m): m is Member => m !== undefined) || [];

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
              <Button onClick={() => { if (!selectedMemberId) { toast({ title: "Errore", description: "Seleziona un membro", variant: "destructive" }); return; } createAttendanceMutation.mutate({ memberId: selectedMemberId, activityId, attendanceDate }); }} disabled={!selectedMemberId || createAttendanceMutation.isPending}>Registra</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {courseAttendances.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Nessuna presenza registrata per questa attività</p> : (
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

const parseJsonArray = (val: any): string[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { 
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }
  return [];
};


export interface CourseUnifiedModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  course: any | null;
  defaultValues?: any;
  onSuccess?: () => void;
  onDelete?: (id: number) => void;
  /** Chiamato solo in caso di duplicazione: fornisce al parent il nuovo record già parsato */
  onDuplicated?: (newRecord: any) => void;
  activityType?: 
  | "course" 
  | "workshop" 
  | "campus" 
  | "prenotazioni" 
  | "allenamenti"
  | "domeniche"
  | "saggi"
  | "vacanze"
  | "affitti";
}

export function CourseUnifiedModal({ isOpen, onOpenChange, course, defaultValues, onSuccess, onDelete, onDuplicated, activityType = "course" }: CourseUnifiedModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const canWrite = hasWritePermission(user, "/corsi");

  const [activeTab, setActiveTab] = useState("details");
  const isDuplicatingRef = useRef(false);
  const isEdit = !!course?.id;

  const [isGenereModalOpen, setIsGenereModalOpen] = useState(false);
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
  const [isNumeroPersoneModalOpen, setIsNumeroPersoneModalOpen] = useState(false);
  const [isPostiModalOpen, setIsPostiModalOpen] = useState(false);
  const [isLivelloModalOpen, setIsLivelloModalOpen] = useState(false);
  const [isFasciaEtaModalOpen, setIsFasciaEtaModalOpen] = useState(false);
  const [isGruppiCampusModalOpen, setIsGruppiCampusModalOpen] = useState(false);
  const [isQuickMemberAddOpen, setIsQuickMemberAddOpen] = useState(false);
  const [quickMemberTarget, setQuickMemberTarget] = useState<"member1" | "member2" | "instructor" | "secondaryInstructor">("member1");

  // Dati da Liste e DB
  const nameListType = activityType === "prenotazioni" ? "generi_lezioni_individuali" : activityType === "allenamenti" ? "generi_allenamenti" : activityType === "campus" ? "campus" : activityType === "workshop" ? "genere" : "nomi_corsi";
  const nomiCorsi = useCustomListValues(nameListType);
  const postiDisponibili = useCustomListValues("posti_disponibili");
  const livelli = useCustomListValues("livello");
  const fasceEta = useCustomListValues("fascia_eta");
  const numeroPersone = useCustomListValues("numero_persone");
  const gruppiCampus = useCustomListValues("campus");
  const { data: activityStatuses } = useQuery<ActivityStatus[]>({ queryKey: ["/api/activity-statuses"] });
  const baseStati = ["ATTIVO", "IN PROGRAMMA", "COMPLETO", "ANNULLATO"];
  const finalStati = activityStatuses && activityStatuses.length > 0 ? [...activityStatuses].filter(s => s.active).sort((a,b)=>String(a.name).localeCompare(String(b.name), undefined, {numeric: true})).map(s => s.name) : baseStati;
  
  const { data: categorieList } = useCustomList("categorie");
  const categories = categorieList?.items ? [...categorieList.items].filter(i => i.active !== false).map(i => ({ id: i.id, name: i.value })).sort((a,b)=>a.name.localeCompare(b.name, undefined, {numeric: true})) : [];

  const { data: studios } = useQuery<Studio[]>({ queryKey: ["/api/studios"] });
  const { data: instructors } = useQuery<Instructor[]>({ queryKey: ["/api/instructors"] });
  const { data: quotes } = useQuery<Quote[]>({ queryKey: ["/api/quotes"] });
  const { data: seasons } = useQuery<any[]>({ queryKey: ["/api/seasons"] });
  const pacchettiPrenotazioni = useCustomListValues("pacchetti_prenotazioni");
  const { data: membersData } = useQuery<{ members: Member[], total: number }>({ queryKey: ["/api/members"] });
  const membersList = membersData?.members || [];
  const [isPacchettiModalOpen, setIsPacchettiModalOpen] = useState(false);

  // State della Form
  const [formData, setFormData] = useState<any>({});
  const [opStates, setOpStates] = useState<string[]>([]);
  const [internalTags, setInternalTags] = useState<string[]>([]);
  const [promoFlags, setPromoFlags] = useState<string[]>([]);
  const [notifySms, setNotifySms] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [notifyWa, setNotifyWa] = useState(false);
  // F2-103: flag visivo che indica che si sta modificando una copia
  const [isCopy, setIsCopy] = useState(false);

  const [searchMember1, setSearchMember1] = useState("");
  const [searchMember2, setSearchMember2] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  console.log("CATEGORIES:", categories?.map(
    c => ({id: c.id, type: typeof c.id})
  ));
  console.log("FORM categoryId:", formData.categoryId, typeof formData.categoryId);

  const { data: searchResults1 } = useQuery({
    queryKey: ["/api/members", searchMember1],
    queryFn: () => fetch(`/api/members?search=${searchMember1}`).then(r => r.json()),
    enabled: searchMember1.length >= 2,
  });

  const { data: searchResults2 } = useQuery({
    queryKey: ["/api/members", searchMember2],
    queryFn: () => fetch(`/api/members?search=${searchMember2}`).then(r => r.json()),
    enabled: searchMember2.length >= 2,
  });

  useEffect(() => {
    let cancelled = false;
    if (!isOpen) {
      // Reset isCopy quando il modale si chiude
      setIsCopy(false);
    }
    if (isOpen) {
      // Reset immediato campi allievo — PRIMA di tutto
      setSearchMember1("");
      setSearchMember2("");
      if (course) {
        setFormData({ 
          ...course,
          categoryId: course.categoryId || null,
          member1Id: null,   // verrà dalla fetch enrollments
          member2Id: null,   // verrà dalla fetch enrollments
          lessonType: parseJsonArray(course.lessonType)
        });
        setActiveTab("details");

        
        // Pre-popola allievi da enrollments (STI bridge) — con flag anti race condition
        if (course?.id) {
          fetch(`/api/enrollments?courseId=${course.id}`)
            .then(r => r.json())
            .then((enrs: any[]) => {
              if (cancelled) return;
              if (!Array.isArray(enrs) || enrs.length === 0) 
                return;
              const e1 = enrs[0];
              const e2 = enrs[1];
              // Bug D fix (F2-PROTOCOLLO-098): manteniamo solo i memberId nel form.
              // Il campo testo resta vuoto in edit mode: l'allievo è visibile nel tab Iscritti.
              if (e1?.memberId) {
                updateForm("member1Id", e1.memberId);
              }
              if (e2?.memberId) {
                updateForm("member2Id", e2.memberId);
              }
            })
            .catch(() => {});
        }
        // Estrazione Op State e Promos — SOLO i tag con prefisso STATE:
        // Estrazione Op State e Promos — SOLO i tag con prefisso STATE:
        const tags = parseStatusTags(course?.statusTags || []);
        const opTags = tags.filter(t => t.startsWith("STATE:")).map(t => t.replace("STATE:", ""));
        setOpStates(opTags); // se vuoto → nessuno stato selezionato di default
        setPromoFlags(tags.filter(t => t.startsWith("PROMO:")).map(t => t.replace("PROMO:", "")));
        
        // Estrazione tag interni
        setInternalTags(course?.internalTags || []);
      } else {
        let defaultsToUse: any = { ...(defaultValues || {}) };
        
        // Smart Fill
        if (!defaultsToUse.seasonId && seasons && seasons.length > 0) {
            const activeSeason = seasons.find((s: any) => s.active) || seasons[0];
            if (activeSeason) {
                defaultsToUse.seasonId = activeSeason.id;
                if (activeSeason.startDate && activeSeason.endDate) {
                    const startYear = new Date(activeSeason.startDate).getFullYear();
                    const endYear = new Date(activeSeason.endDate).getFullYear();
                    defaultsToUse.startDate = `${startYear}-09-01`;
                    defaultsToUse.endDate = `${endYear}-06-30`;
                }
            }
        }

        if (!defaultsToUse.dayOfWeek) {
            const days = ["DOM", "LUN", "MAR", "MER", "GIO", "VEN", "SAB"];
            defaultsToUse.dayOfWeek = days[new Date().getDay()];
        }

        if (!defaultsToUse.startTime) {
            const now = new Date();
            const h = now.getHours();
            const m = now.getMinutes();
            const targetMins = m < 30 ? "30" : "00";
            const targetHr = m < 30 ? h : (h + 1) % 24;
            defaultsToUse.startTime = `${targetHr.toString().padStart(2, "0")}:${targetMins}`;
        }

        if (activityType === "campus" && !defaultValues?.startTime) {
          defaultsToUse = { ...defaultsToUse, recurrenceType: "daily", startTime: "08:30", endTime: "17:00" };
        }
        setFormData(defaultsToUse);
        setActiveTab("details");
        setOpStates([]);
        setPromoFlags([]);
      }
    }
    return () => { cancelled = true; };
  }, [isOpen, course, defaultValues, seasons]);

  const updateForm = (key: string, value: any) => {
    setFormData((prev: any) => {
      const next = { ...prev, [key]: value };
      
      // Auto-rigenerazione SKU se cambia un campo strutturale
      if ((key === "dayOfWeek" || key === "seasonId" || key === "instructorId" || key === "categoryId" || key === "startTime") && (!activityType || activityType === "course" || activityType === "workshop")) {
          try {
              let codeA = "XXXX";
              if (next.seasonId && seasons) {
                 const s = seasons.find((sea: any) => sea.id?.toString() === next.seasonId?.toString());
                 if (s?.name) {
                     const parts = s.name.match(/\d+/g);
                     if (parts && parts.length >= 2) {
                         codeA = `${parts[0].slice(-2) || "XX"}${parts[1].slice(-2) || "XX"}`;
                     } else if (parts && parts.length === 1 && parts[0].length === 4) {
                         codeA = parts[0];
                     }
                 }
              }
              const inst = instructors?.find((i: any) => i.id?.toString() === next.instructorId?.toString());
              let codeB = "XXX";
              if (inst?.lastName) codeB = String(inst.lastName).toUpperCase().replace(/[^A-Z]/g, "").slice(0, 10);
              
              const codeC = next.dayOfWeek ? String(next.dayOfWeek).toUpperCase().slice(0, 3) : "XXX";
              const codeD = next.startTime ? String(next.startTime).split(":")[0] : "XX";
              
              const cat = categories?.find((c: any) => c.id?.toString() === next.categoryId?.toString());
              const codeE = cat?.name ? String(cat.name).toUpperCase().charAt(0) : "X";
              
              next.sku = `${codeA}${codeB}${codeC}${codeD}.${codeE}`;
              
              if (key === "seasonId" && value) {
                  const s = seasons?.find((sea: any) => sea.id?.toString() === value?.toString());
                  if (s && s.startDate && s.endDate) {
                      const startYear = new Date(s.startDate).getFullYear();
                      const endYear = new Date(s.endDate).getFullYear();
                      next.startDate = `${startYear}-09-01`;
                      next.endDate = `${endYear}-06-30`;
                  }
              }
          } catch(e) {}
      }

      return next;
    });
  };

  const handlePromoChange = (flag: string, isChecked: boolean) => {
    if (isChecked) {
      setPromoFlags(prev => [...prev].filter(f => f !== flag).concat(flag));
    } else {
      setPromoFlags(prev => prev.filter(f => f !== flag));
    }
  };

  const apiEndpoint = (activityType === "prenotazioni" || activityType === "allenamenti") ? "/api/courses" : activityType === "campus" ? "/api/courses" : activityType === "workshop" ? "/api/workshops" : "/api/courses";

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        return await apiRequest("POST", apiEndpoint, data);
      } catch (err: any) {
        if (err.status === 409) {
          // Conflitto slot: procede sempre senza chiedere (F2-PROTOCOLLO-097)
          return await apiRequest("POST", apiEndpoint, { ...data, force: true });
        }
        throw err;
      }
    },
    onSuccess: (newRecord: any) => {
      queryClient.invalidateQueries({
          predicate: (query) => {
              const qk = query.queryKey[0] as string;
              return typeof qk === 'string' && (qk.startsWith(apiEndpoint) || qk.startsWith('/api/activities-unified-preview') || qk.startsWith('/api/courses') || qk.startsWith('/api/strategic-events') || qk.startsWith('/api/calendar/events'));
          }
      });
      
      if (isDuplicatingRef.current) {
        // Bug B fix (F2-PROTOCOLLO-099/101): in duplicazione NON chiudiamo mai il modale.
        isDuplicatingRef.current = false;
        if (newRecord?.id) {
          console.log("[DUP] onSuccess id:", newRecord?.id);
          try {
            // F2-101: applica lo stesso parsing dell'useEffect edit mode
            // (lessonType e statusTags possono arrivare come JSON string dal backend)
            const parsed = {
              ...newRecord,
              lessonType: parseJsonArray(newRecord.lessonType),
              statusTags: parseJsonArray(newRecord.statusTags),
            };
            setFormData(parsed);
            // Aggiorna anche opStates e promoFlags col nuovo record
            const tags = parseJsonArray(newRecord.statusTags);
            const opTags = tags.filter((t: string) => t.startsWith("STATE:")).map((t: string) => t.replace("STATE:", ""));
            setOpStates(opTags);
            setPromoFlags(tags.filter((t: string) => t.startsWith("PROMO:")).map((t: string) => t.replace("PROMO:", "")));
            // F2-102: comunica il nuovo record al parent (aggiorna editingCourse/editingItem)
            onDuplicated?.(parsed);
            // F2-103: attiva il banner COPIA
            setIsCopy(true);
          } catch (e) {
            console.error("[DUP] crash in setFormData:", e);
          }
        }
        console.log("[DUP] modal still open?", isOpen);
        toast({ title: "Copia creata! Modifica i dati." });
        setActiveTab("details");
        // Non chiamare onOpenChange(false) né onSuccess?.() — il modale resta aperto
      } else {
        toast({ title: "Attività creata con successo" });
        onOpenChange(false);
        onSuccess?.();
      }
    },
    onError: (error: Error) => {
      if (error.message !== "Operazione annullata") {
        toast({ title: "Errore", description: error.message, variant: "destructive" });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      try {
        await apiRequest("PATCH", `${apiEndpoint}/${id}`, data);
      } catch (err: any) {
        if (err.status === 409) {
          // Conflitto slot: procede sempre senza chiedere (F2-PROTOCOLLO-097)
          await apiRequest("PATCH", `${apiEndpoint}/${id}`, { ...data, force: true });
          return;
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
          predicate: (query) => {
              const qk = query.queryKey[0] as string;
              return typeof qk === 'string' && (qk.startsWith(apiEndpoint) || qk.startsWith('/api/activities-unified-preview') || qk.startsWith('/api/courses') || qk.startsWith('/api/strategic-events') || qk.startsWith('/api/calendar/events'));
          }
      });
      toast({ title: "Attività aggiornata con successo" });
      setIsCopy(false); // F2-103: rimuove il banner COPIA al primo salvataggio
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
    
    // Validazione Date Stagione
    if (formData.seasonId && formData.startDate && formData.endDate) {
        const selectedSeason = seasons?.find(s => s.id?.toString() === formData.seasonId?.toString());
        if (selectedSeason?.startDate && selectedSeason?.endDate) {
            const minStr = new Date(selectedSeason.startDate).toISOString().split("T")[0];
            const maxStr = new Date(selectedSeason.endDate).toISOString().split("T")[0];
            const startStr = new Date(formData.startDate).toISOString().split("T")[0];
            const endStr = new Date(formData.endDate).toISOString().split("T")[0];
            
            if (startStr < minStr || startStr > maxStr || endStr < minStr || endStr > maxStr) {
                return toast({
                    title: "Date fuori stagione",
                    description: `Date respinte. Le date ("Validità Dal" o "Al") non appartengono alla stagione selezionata (${selectedSeason.name}). Inserisci date valide!`,
                    variant: "destructive",
                    duration: 6000
                });
            }
        }
    }

    // Costruiamo statusTags in formato consistente multi-stato
    const mergedTags = [...opStates.map(s => `STATE:${s}`), ...promoFlags.map(p => `PROMO:${p}`)];
    const isActive = !opStates.includes("ANNULLATO");

    const payload: any = {
      ...((activityType === "prenotazioni" || activityType === "allenamenti") && { notifySms, notifyEmail, notifyWa, packageSingle: formData.packageSingle, packageCouple: formData.packageCouple, packageGroup: formData.packageGroup, member1Id: formData.member1Id, member2Id: formData.member2Id }),
      sku: formData.sku || null,
      activityType: activityType ?? null,
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
      activeOnHolidays: formData.activeOnHolidays ? 1 : 0,
      schedule: formData.schedule || null,
      startDate: formData.startDate ? new Date(formData.startDate) : null,
      endDate: formData.endDate ? new Date(formData.endDate) : null,
      level: formData.level || null,
      ageGroup: formData.ageGroup || null,
      lessonType: formData.lessonType || [],
      numberOfPeople: formData.numberOfPeople || null,
      statusTags: mergedTags,
      internalTags: internalTags,
      active: isActive,
      quoteId: formData.quoteId || null,
      googleEventId: null,
      seasonId: formData.seasonId ? parseInt(formData.seasonId.toString()) : undefined,
    };

    const targetId = formData.id || course?.id;
    
    if (targetId) {
      if (targetId === course?.id && payload.seasonId !== course?.seasonId && formData.seasonId) {
          toast({ title: "Spostamento bloccato", description: "Per ragioni di integrità degli iscritti, non è possibile muovere un corso da una stagione all'altra. Se desideri il corso per un'altra stagione, usa invece il tasto 'Crea Copia (Duplica)'.", variant: "destructive" });
          return;
      }
      updateMutation.mutate({ id: targetId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDuplicateFromModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.seasonId) {
        toast({ title: "Errore", description: "Seleziona una stagione", variant: "destructive" });
        return;
    }
    
    try {
        const safeDayOfWeek = normalizeDay(formData.dayOfWeek);
        const safeStartTime = stripSeconds(formData.startTime);

        const mergedTags = [...opStates.map(s => `STATE:${s}`), ...promoFlags.map(p => `PROMO:${p}`)];
        const isActive = !opStates.includes("ANNULLATO");
        
        const payload: any = {
          sku: formData.sku || null,
          activityType: activityType ?? null,
          name: formData.name as string,
          description: formData.description || null,
          categoryId: formData.categoryId || null,
          studioId: formData.studioId || null,
          instructorId: formData.instructorId || null,
          secondaryInstructor1Id: formData.secondaryInstructor1Id || null,
          price: formData.price?.toString() || null,
          maxCapacity: formData.maxCapacity ? parseInt(formData.maxCapacity as any) : null,
          dayOfWeek: safeDayOfWeek || null,
          startTime: safeStartTime || null,
          endTime: stripSeconds(formData.endTime) || null,
          recurrenceType: formData.recurrenceType || null,
          activeOnHolidays: formData.activeOnHolidays ? 1 : 0,
          schedule: formData.schedule || null,
          startDate: formData.startDate ? new Date(formData.startDate) : null,
          endDate: formData.endDate ? new Date(formData.endDate) : null,
          level: formData.level || null,
          ageGroup: formData.ageGroup || null,
          lessonType: formData.lessonType || [],
          numberOfPeople: formData.numberOfPeople || null,
          statusTags: mergedTags,
          internalTags: internalTags,
          active: isActive,
          quoteId: formData.quoteId || null,
          googleEventId: null,
          seasonId: parseInt(formData.seasonId.toString()),
        };

        isDuplicatingRef.current = true;
        createMutation.mutate(payload);
    } catch (err: any) {
        toast({ title: "Errore durante la duplicazione", description: err.message, variant: "destructive" });
    }
  };

  const selectedDayOfWeek = normalizeDay(formData.dayOfWeek);
  const selectedStartTime = stripSeconds(formData.startTime);
  const selectedEndTime = stripSeconds(formData.endTime);

  const modalTitle = (() => {
    if (isEdit) {
      const editTitles: Record<string, string> = {
        prenotazioni: "Modifica Prenotazione",
        allenamenti:  "Modifica Allenamento",
        campus:       "Modifica Campus",
        workshop:     "Modifica Workshop",
        domeniche:    "Modifica Domenica in Movimento",
        saggi:        "Modifica Saggio",
        vacanze:      "Modifica Vacanze Studio",
        affitti:      "Modifica Affitto Sala",
      };
      return editTitles[activityType ?? ""] ?? "Modifica Corso";
    }
    const newTitles: Record<string, string> = {
      prenotazioni: "LEZIONI INDIVIDUALI E ALLENAMENTI / AFFITTI INSEGNANTI (PER LE LORO PRIVATE O PROVE)",
      allenamenti:  "Prenotazioni Allenamenti (staff o pt per le loro private o prove)",
      campus:       "Nuovo Campus",
      workshop:     "Nuovo Workshop",
      domeniche:    "Nuova Domenica in Movimento",
      saggi:        "Nuovo Saggio",
      vacanze:      "Nuove Vacanze Studio",
      affitti:      "Nuovo Affitto Sala",
    };
    return newTitles[activityType ?? ""] ?? "Nuovo Corso";
  })();

  const submitLabel = (() => {
    if (isEdit) return "Salva (Sovrascrivi / Slitta)";
    const labels: Record<string, string> = {
      course:       "Crea Corso",
      allenamenti:  "Crea Allenamento",
      prenotazioni: "Crea Lezione Individuale",
      workshop:     "Crea Workshop",
      domeniche:    "Crea Domenica in Movimento",
      saggi:        "Crea Saggio",
      vacanze:      "Crea Vacanze Studio",
      campus:       "Crea Campus",
      affitti:      "Crea Prenotazione Affitto",
    };
    return labels[activityType ?? ""] ?? "Crea Corso";
  })();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto w-full">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Gestisci informazioni e iscritti." : "Inserisci i dettagli dell'attività."}
          </DialogDescription>
        </DialogHeader>

        {/* F2-103: banner visivo COPIA */}
        {isCopy && (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm rounded px-3 py-2 mb-3 flex items-start gap-2 flex-col">
            <div className="flex items-center gap-2">
              <span>📋</span>
              <span><strong>Stai modificando una COPIA</strong> — salva per confermare il nuovo record.</span>
            </div>
            <p className="text-xs text-yellow-700 ml-6">I campi in rosso sono copiati dall'originale — verificali prima di salvare.</p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {isEdit && (
            <TabsList className={cn("grid w-full mb-4", activityType === "campus" ? "grid-cols-2" : "grid-cols-3")}>
              <TabsTrigger value="details">Dettagli</TabsTrigger>
              <TabsTrigger value="enrollments"><Users className="w-4 h-4 mr-1" /> Iscritti</TabsTrigger>
              {activityType !== "campus" && <TabsTrigger value="attendances"><Calendar className="w-4 h-4 mr-1" /> Presenze</TabsTrigger>}
            </TabsList>
          )}

          <TabsContent value="details" className="pt-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className={cn("flex justify-between items-center gap-2 flex-wrap p-3 rounded-md border text-sm", (isCopy && opStates.length > 0) ? "bg-red-50 border-red-400" : "bg-slate-50")}>
                <div className="flex gap-2">
                    <MultiSelectStatus selectedStatuses={opStates} onChange={setOpStates} testIdPrefix="course" />
                    <MultiSelectInternal selectedTags={internalTags} onChange={setInternalTags} />
                </div>

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
                  <Label className="font-semibold text-slate-800 shrink-0">
                      {activityType === "allenamenti" ? "GENERE ALLENAMENTO" : activityType === "prenotazioni" ? "GENERE LEZIONE" : "GENERE / NOME CORSO"} *
                    </Label>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsGenereModalOpen(true);
                    }}
                  >
                    <Edit className="w-3 h-3 sidebar-icon-gold" />
                  </Button>
                </div>
                  <div className={(isCopy && !!formData.name) ? "rounded-md border border-red-400 bg-red-50" : ""}>
                  <Combobox
                    name="name"
                    value={formData.name || ""}
                    options={(nomiCorsi || []).map(val => ({ value: val, label: val }))}
                    onValueChange={(val) => updateForm("name", val)}
                    placeholder={activityType === "campus" ? "Cerca campus..." : activityType === "workshop" ? "Cerca o inserisci nome..." : "Cerca genere..."}
                    required
                  />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-800">Stagione <span className="text-red-500 ml-1">*</span></Label>
                  <div className={(isCopy && !!formData.seasonId) ? "rounded-md border border-red-400 bg-red-50" : ""}>
                  <Select 
                     value={formData.seasonId?.toString() || "none"}
                     onValueChange={val => updateForm("seasonId", val === "none" ? null : parseInt(val))}
                  >
                     <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Seleziona la stagione..." />
                     </SelectTrigger>
                     <SelectContent>
                        {seasons?.map((s: any) => (
                           <SelectItem key={s.id} value={s.id.toString()}>{getSeasonLabel(s, seasons)}</SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU / Codice</Label>
                  <Input id="sku" value={formData.sku || ""} onChange={(e) => updateForm("sku", e.target.value)} placeholder={activityType === "campus" ? "es: 2526CAMPUS-1SETTIMANA-" : "es: 2526-CORSO-1"} className={(isCopy && !!formData.sku) ? "border-red-400 bg-red-50" : ""} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold text-slate-800 shrink-0">Categoria <span className="text-red-500 ml-1">*</span></Label>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsCategoriaModalOpen(true);
                      }}
                    >
                      <Edit className="w-3 h-3 sidebar-icon-gold" />
                    </Button>
                  </div>
                  <div className={(isCopy && !!formData.categoryId) ? "rounded-md border border-red-400 bg-red-50" : ""}>
                  <Combobox
                    name="categoryId"
                    value={formData.categoryId?.toString() || "none"}
                    onValueChange={val => updateForm("categoryId", val === "none" ? null : parseInt(val))}
                    options={[{value: "none", label: "Nessuna categoria"}, ...(categories || []).map(c => ({ value: c.id.toString(), label: c.name }))]}
                    placeholder="Seleziona categoria"
                  />
                  </div>
                </div>
              </div>

              {(activityType === "prenotazioni" || activityType === "allenamenti") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MultiSelectCustomList
                    systemName={activityType === "allenamenti" ? "tipologie_allenamenti" : "tipologia_lezioni"}
                    listName="TIPOLOGIA"
                    selectedValues={formData.lessonType || []}
                    onChange={(vals) => updateForm("lessonType", vals)}
                  />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="font-semibold text-slate-800 shrink-0">NUMERO PERSONE</Label>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsNumeroPersoneModalOpen(true); }}><Edit className="w-3 h-3 sidebar-icon-gold" /></Button>
                    </div>
                    <div className={(isCopy && !!formData.numberOfPeople && formData.numberOfPeople !== "none") ? "rounded-md border border-red-400 bg-red-50" : ""}>
                    <Combobox
                      name="numberOfPeople"
                      value={formData.numberOfPeople || "none"}
                      onValueChange={(val) => updateForm("numberOfPeople", val === "none" ? null : val)}
                      options={[{value: "none", label: "Seleziona..."}, ...(numeroPersone || []).map((val: string) => ({ value: val, label: val }))]}
                      placeholder="Trascina num persone..."
                    />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Studio / Sala <span className="text-red-500 ml-1">*</span></Label>
                  <div className={(isCopy && !!formData.studioId) ? "rounded-md border border-red-400 bg-red-50" : ""}>
                  <Combobox
                    name="studioId"
                    value={formData.studioId?.toString() || "none"}
                    onValueChange={val => updateForm("studioId", val === "none" ? null : parseInt(val))}
                    options={[{value: "none", label: "Nessuno studio"}, ...(studios || []).map(s => ({ value: s.id.toString(), label: s.name }))]}
                    placeholder="Seleziona studio"
                  />
                  </div>
                </div>
              </div>

              {(activityType === "prenotazioni" || activityType === "allenamenti") ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="font-semibold text-slate-800">NOME ALLIEVO 1</Label>
                      <Button variant="outline" size="sm" type="button" onClick={() => { setQuickMemberTarget("member1"); setIsQuickMemberAddOpen(true); }}>➕ Nuovo</Button>
                    </div>
                    <div className="space-y-1 relative">
                      <Input
                        key={`member1-${course?.id ?? 'new'}`}
                        placeholder="Cerca allievo..."
                        value={searchMember1}
                        onChange={e => setSearchMember1(e.target.value)}
                      />
                      {searchMember1.length >= 2 && searchResults1?.members?.length > 0 && (
                        <div className="border rounded-md max-h-40 overflow-y-auto bg-white shadow absolute z-50 w-full">
                          {searchResults1.members.map((m: any) => (
                            <div
                              key={m.id}
                              className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                              onClick={() => {
                                updateForm("member1Id", m.id)
                                setSearchMember1(`${m.lastName} ${m.firstName}`)
                              }}
                            >
                              {m.lastName} {m.firstName}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="font-semibold text-slate-800">NOME ALLIEVO 2</Label>
                      <Button variant="outline" size="sm" type="button" onClick={() => { setQuickMemberTarget("member2"); setIsQuickMemberAddOpen(true); }}>➕ Nuovo</Button>
                    </div>
                    <div className="space-y-1 relative">
                      <Input
                        key={`member2-${course?.id ?? 'new'}`}
                        placeholder="Cerca allievo..."
                        value={searchMember2}
                        onChange={e => setSearchMember2(e.target.value)}
                      />
                      {searchMember2.length >= 2 && searchResults2?.members?.length > 0 && (
                        <div className="border rounded-md max-h-40 overflow-y-auto bg-white shadow absolute z-50 w-full">
                          {searchResults2.members.map((m: any) => (
                            <div
                              key={m.id}
                              className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                              onClick={() => {
                                updateForm("member2Id", m.id)
                                setSearchMember2(`${m.lastName} ${m.firstName}`)
                              }}
                            >
                              {m.lastName} {m.firstName}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold text-slate-800 shrink-0">{activityType === "campus" ? "Gruppo" : "Livello"}</Label>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (activityType === "campus") { setIsGruppiCampusModalOpen(true); } else { setIsLivelloModalOpen(true); } }}><Edit className="w-3 h-3 sidebar-icon-gold" /></Button>
                  </div>
                  <Combobox
                    name="level"
                    value={formData.level || "none"}
                    onValueChange={(val) => updateForm("level", val === "none" ? null : val)}
                    options={activityType === "campus" 
                        ? [{value: "none", label: "Nessun gruppo"}, ...(gruppiCampus || []).map((val: string) => ({ value: val, label: val }))]
                        : [{value: "none", label: "Nessun livello"}, ...(livelli || []).map((val: string) => ({ value: val, label: val }))]}
                    placeholder={activityType === "campus" ? "Seleziona gruppo..." : "Seleziona livello..."}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold text-slate-800 shrink-0">Fascia d'età</Label>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsFasciaEtaModalOpen(true); }}><Edit className="w-3 h-3 sidebar-icon-gold" /></Button>
                  </div>
                  <Combobox
                    name="ageGroup"
                    value={formData.ageGroup || "none"}
                    onValueChange={(val) => updateForm("ageGroup", val === "none" ? null : val)}
                    options={[{value: "none", label: "Nessuna fascia"}, ...(fasceEta || []).map((val: string) => ({ value: val, label: val }))]}
                    placeholder="Seleziona fascia..."
                  />
                </div>
              </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="font-semibold text-slate-800">Insegnante Principale <span className="text-red-500 ml-1">*</span></Label>
                    <Button variant="outline" size="sm" type="button" onClick={() => { setQuickMemberTarget("instructor"); setIsQuickMemberAddOpen(true); }}>➕ Nuovo</Button>
                  </div>
                  <div className={(isCopy && !!formData.instructorId) ? "rounded-md border border-red-400 bg-red-50" : ""}>
                  <Combobox
                    name="instructorId"
                    value={formData.instructorId?.toString() || "none"}
                    onValueChange={val => updateForm("instructorId", val === "none" ? null : parseInt(val))}
                    options={[{value: "none", label: "Nessuno"}, ...(instructors || []).map(i => ({ value: i.id.toString(), label: `${i.lastName} ${i.firstName}` }))]}
                    placeholder="Cerca Insegnante..."
                  />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="font-semibold text-slate-800">Insegnante Secondario</Label>
                    <Button variant="outline" size="sm" type="button" onClick={() => { setQuickMemberTarget("secondaryInstructor"); setIsQuickMemberAddOpen(true); }}>➕ Nuovo</Button>
                  </div>
                  <Combobox
                    name="secondaryInstructor1Id"
                    value={formData.secondaryInstructor1Id?.toString() || "none"}
                    onValueChange={val => updateForm("secondaryInstructor1Id", val === "none" ? null : parseInt(val))}
                    options={[{value: "none", label: "Nessuno"}, ...(instructors || []).map(i => ({ value: i.id.toString(), label: `${i.lastName} ${i.firstName}` }))]}
                    placeholder="Cerca Insegnante..."
                  />
                </div>
              </div>

              {(activityType === "prenotazioni" || activityType === "allenamenti") ? (
                <IndividualPricing 
                  formData={formData} 
                  updateForm={updateForm} 
                  membersList={membersList} 
                />
              ) : (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Prezzo (€) <span className="text-red-500 ml-1">*</span></Label>
                  <Input id="price" type="number" step="0.01" min="0" value={formData.price || ""} onChange={e => updateForm("price", e.target.value)} className={(isCopy && !!formData.price) ? "border-red-400 bg-red-50" : ""} />
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
                    <Label htmlFor="maxCapacity" className="font-semibold text-slate-800 shrink-0">Posti Disponibili <span className="text-red-500 ml-1">*</span></Label>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsPostiModalOpen(true);
                      }}
                    >
                      <Edit className="w-3 h-3 sidebar-icon-gold" />
                    </Button>
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
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-md relative bg-slate-50/50">
                <div className="absolute -top-3 left-3 bg-white px-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Pianificazione Oraria</span>
                </div>
                <div className="space-y-2">
                  <Label>Giorno <span className="text-red-500 ml-1">*</span></Label>
                  <div className={(isCopy && !!formData.dayOfWeek) ? "rounded-md border border-red-400 bg-red-50" : ""}>
                  <Select value={selectedDayOfWeek || "none"} onValueChange={val => updateForm("dayOfWeek", val === "none" ? null : val)}>
                    <SelectTrigger><SelectValue placeholder="Giorno" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Non definito</SelectItem>
                      {WEEKDAYS.map(d => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Inizio <span className="text-red-500 ml-1">*</span></Label>
                  <Input type="time" value={selectedStartTime} onChange={(e) => updateForm("startTime", e.target.value || null)} className={cn("min-w-[100px]", (isCopy && !!formData.startTime) && "border-red-400 bg-red-50")} />
                </div>
                <div className="space-y-2">
                  <Label>Fine <span className="text-red-500 ml-1">*</span></Label>
                  <Input type="time" value={selectedEndTime} onChange={(e) => updateForm("endTime", e.target.value || null)} className={cn("min-w-[100px]", (isCopy && !!formData.endTime) && "border-red-400 bg-red-50")} />
                </div>
                <div className="space-y-2">
                  <Label>Ricorrenza <span className="text-red-500 ml-1">*</span></Label>
                  <div className={(isCopy && !!formData.recurrenceType) ? "rounded-md border border-red-400 bg-red-50" : ""}>
                  <Select value={formData.recurrenceType || "none"} onValueChange={val => updateForm("recurrenceType", val === "none" ? null : val)}>
                    <SelectTrigger><SelectValue placeholder="Periodo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessuna (Evento singolo)</SelectItem>
                      {RECURRENCE_TYPES.map(r => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  </div>
                  <div className="flex items-center gap-3 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <input
                      type="checkbox"
                      id="activeOnHolidays"
                      checked={formData.activeOnHolidays === 1 || formData.activeOnHolidays === true}
                      onChange={e => updateForm("activeOnHolidays", e.target.checked ? 1 : 0)}
                      className="h-4 w-4 rounded"
                    />
                    <label htmlFor="activeOnHolidays" className="text-sm font-medium text-amber-800 cursor-pointer">
                      🎄 Corso attivo anche durante festività e chiusure studio
                    </label>
                  </div>
                </div>
                
                <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label>Validità Dal <span className="text-red-500 ml-1">*</span></Label>
                    <Input type="date" value={getSafeDateStr(formData.startDate)} onChange={e => updateForm("startDate", e.target.value || null)} className={(isCopy && !!formData.startDate) ? "border-red-400 bg-red-50" : ""} />
                  </div>
                  <div className="space-y-2">
                    <Label>Validità Al <span className="text-red-500 ml-1">*</span></Label>
                    <Input type="date" value={getSafeDateStr(formData.endDate)} onChange={e => updateForm("endDate", e.target.value || null)} className={(isCopy && !!formData.endDate) ? "border-red-400 bg-red-50" : ""} />
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

              <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t flex flex-col sm:flex-row items-center justify-between w-full mt-6 gap-2">
                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4">
                  <span className="text-xs text-slate-500 hidden sm:inline-block"><span className="text-red-500 font-bold mr-1">*</span> Campi obbligatori</span>
                  {isEdit && onDelete && canWrite && !(course?.currentEnrollment > 0) && !(formData.member1Id !== null && formData.member1Id !== undefined && formData.member1Id !== "none" && formData.member1Id !== "") && (
                    <div className="flex items-center">
                       {!confirmDelete ? (
                          <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>Elimina</Button>
                       ) : (
                          <div className="flex items-center gap-2 bg-red-50 p-1.5 rounded-md border border-red-200 animate-in slide-in-from-left-2">
                             <div className="flex flex-col">
                                <span className="text-xs font-bold text-red-700 px-2 leading-none uppercase">Confermi?</span>
                                <span className="text-[10px] text-red-600 px-2 leading-none mt-1">Azione irreversibile</span>
                             </div>
                             <Button type="button" variant="ghost" size="sm" className="h-7 text-xs hover:bg-red-100" onClick={() => setConfirmDelete(false)}>Annulla</Button>
                             <Button type="button" variant="destructive" size="sm" className="h-7 text-xs" onClick={() => { setConfirmDelete(false); onDelete(course.id); onOpenChange(false); }}>Sì, elimina</Button>
                          </div>
                       )}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                  <span className="text-xs text-slate-500 sm:hidden block w-full text-right"><span className="text-red-500 font-bold mr-1">*</span> Campi obbligatori</span>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
                  {/* Il tasto Duplica è stato rimosso da qui e spostato all'esterno sulla card */}
                  <Button type="submit" disabled={updateMutation.isPending || createMutation.isPending} className="gold-3d-button text-black">
                    {updateMutation.isPending ? "Salvataggio..." : submitLabel}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </TabsContent>

          {isEdit && (
            <TabsContent value="enrollments">
              <EnrollmentsTab activityId={course.id} activityType={activityType} />
            </TabsContent>
          )}

          {isEdit && activityType !== "campus" && (
            <TabsContent value="attendances">
              <AttendancesTab activityId={course.id} activityType={activityType} />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
    <CustomListManagerDialog listType={nameListType} title={activityType === "prenotazioni" ? "Gestione Generi Lezioni Individuali" : activityType === "allenamenti" ? "Gestione Generi Allenamenti" : activityType === "campus" ? "Gestione Nomi Campus" : activityType === "workshop" ? "Gestione Nomi Workshop" : "Gestione Generi / Nomi Corsi"} open={isGenereModalOpen} onOpenChange={setIsGenereModalOpen} />
    <CustomListManagerDialog listType="categorie" title="Gestione Categorie" open={isCategoriaModalOpen} onOpenChange={setIsCategoriaModalOpen} />
    <CustomListManagerDialog listType="posti_disponibili" title="Gestione Posti Disponibili" open={isPostiModalOpen} onOpenChange={setIsPostiModalOpen} />
    <CustomListManagerDialog listType="livello" title="Gestione Livelli" open={isLivelloModalOpen} onOpenChange={setIsLivelloModalOpen} />
    <CustomListManagerDialog listType="fascia_eta" title="Gestione Fasce d'Età" open={isFasciaEtaModalOpen} onOpenChange={setIsFasciaEtaModalOpen} />
    <CustomListManagerDialog listType="campus" title="Gestione Gruppi Campus" open={isGruppiCampusModalOpen} onOpenChange={setIsGruppiCampusModalOpen} />
    <CustomListManagerDialog listType="pacchetti_prenotazioni" title="Gestione Pacchetti Prenotazioni" open={isPacchettiModalOpen} onOpenChange={setIsPacchettiModalOpen} />
    <CustomListManagerDialog listType="numero_persone" title="Gestione Numero Persone" open={isNumeroPersoneModalOpen} onOpenChange={setIsNumeroPersoneModalOpen} />
    <QuickMemberAddModal isOpen={isQuickMemberAddOpen} onOpenChange={setIsQuickMemberAddOpen} defaultRole={quickMemberTarget.includes('instructor') ? "Staff/Insegnanti" : "Non Tesserato"} onSuccess={(id) => {
        if (quickMemberTarget === "member1") updateForm("member1Id", id);
        else if (quickMemberTarget === "member2") updateForm("member2Id", id);
        else if (quickMemberTarget === "instructor") updateForm("instructorId", id);
        else if (quickMemberTarget === "secondaryInstructor") updateForm("secondaryInstructor1Id", id);
    }} />
    </>
  );
}
