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
import { Calendar, Users, MapPin, X, UserPlus, CalendarPlus, Trash2, Edit2, Edit } from "lucide-react";
import { cn, parseStatusTags, getSeasonLabel } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { hasWritePermission } from "@/App";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { useCustomList, useCustomListValues } from "@/hooks/use-custom-list";
import { MultiSelectStatus } from "@/components/multi-select-status";
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
  const parentQueryKey = activityType === "campus" ? "/api/campus-activities" : activityType === "workshop" ? "/api/workshops" : "/api/courses";

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

export function CourseUnifiedModal({ isOpen, onOpenChange, course, defaultValues, onSuccess, onDelete, activityType = "course" }: CourseUnifiedModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const canWrite = hasWritePermission(user, "/corsi");

  const [activeTab, setActiveTab] = useState("details");
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
  const gruppiCampus = useCustomListValues("gruppi_campus");
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
  
  // State Operativo (Multi) e Flags Promo
  const [opStates, setOpStates] = useState<string[]>(["ATTIVO"]);
  const [promoFlags, setPromoFlags] = useState<string[]>([]);
  const [notifySms, setNotifySms] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [notifyWa, setNotifyWa] = useState(false);

  const [searchMember1, setSearchMember1] = useState("");
  const [searchMember2, setSearchMember2] = useState("");

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
    if (isOpen) {
      if (course) {
        setFormData({ 
          ...course,
          lessonType: parseJsonArray(course.lessonType)
        });
        setActiveTab("details");

        if (course.member1Id && membersList) {
          const m = membersList.find(x => x.id === course.member1Id);
          if (m) setSearchMember1(`${m.lastName} ${m.firstName}`);
        }
        if (course.member2Id && membersList) {
          const m = membersList.find(x => x.id === course.member2Id);
          if (m) setSearchMember2(`${m.lastName} ${m.firstName}`);
        }
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
        let defaultsToUse: any = { ...(defaultValues || {}) };
        
        // Smart Fill
        if (!defaultsToUse.seasonId && seasons && seasons.length > 0) {
            const activeSeason = seasons.find((s: any) => s.active) || seasons[0];
            if (activeSeason) defaultsToUse.seasonId = activeSeason.id;
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
        setOpStates(["ATTIVO"]);
        setPromoFlags([]);
      }
    }
  }, [isOpen, course, defaultValues, seasons]);

  const updateForm = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handlePromoChange = (flag: string, isChecked: boolean) => {
    if (isChecked) {
      setPromoFlags(prev => [...prev].filter(f => f !== flag).concat(flag));
    } else {
      setPromoFlags(prev => prev.filter(f => f !== flag));
    }
  };

  const apiEndpoint = (activityType === "prenotazioni" || activityType === "allenamenti") ? "/api/courses" : activityType === "campus" ? "/api/campus-activities" : activityType === "workshop" ? "/api/workshops" : "/api/courses";

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        await apiRequest("POST", apiEndpoint, data);
      } catch (err: any) {
        if (err.status === 409) {
          if (confirm(err.message || "Conflitto rilevato. Forzare inserimento?")) {
            await apiRequest("POST", apiEndpoint, { ...data, force: true });
            return;
          }
          throw new Error("Operazione annullata");
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiEndpoint] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      toast({ title: "Attività creata con successo" });
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
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      try {
        await apiRequest("PATCH", `${apiEndpoint}/${id}`, data);
      } catch (err: any) {
        if (err.status === 409) {
          if (confirm(err.message || "Conflitto rilevato. Forzare aggiornamento?")) {
            await apiRequest("PATCH", `${apiEndpoint}/${id}`, { ...data, force: true });
            return;
          }
          throw new Error("Operazione annullata");
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiEndpoint] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      toast({ title: "Attività aggiornata con successo" });
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
      schedule: formData.schedule || null,
      startDate: formData.startDate ? new Date(formData.startDate) : null,
      endDate: formData.endDate ? new Date(formData.endDate) : null,
      level: formData.level || null,
      ageGroup: formData.ageGroup || null,
      lessonType: formData.lessonType || [],
      numberOfPeople: formData.numberOfPeople || null,
      statusTags: mergedTags,
      active: isActive,
      quoteId: formData.quoteId || null,
      googleEventId: null,
      seasonId: formData.seasonId ? parseInt(formData.seasonId.toString()) : undefined,
    };

    if (isEdit && course?.id) {
      if (payload.seasonId !== course.seasonId && formData.seasonId) {
          toast({ title: "Spostamento bloccato", description: "Per ragioni di integrità degli iscritti, non è possibile muovere un corso da una stagione all'altra. Se desideri il corso per un'altra stagione, usa invece il tasto 'Crea Copia (Duplica)'.", variant: "destructive" });
          return;
      }
      updateMutation.mutate({ id: course.id, data: payload });
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
        const res = await fetch(`${apiEndpoint}?seasonId=${formData.seasonId}`);
        const existing = await res.json();
        
        const safeDayOfWeek = normalizeDay(formData.dayOfWeek);
        const safeStartTime = stripSeconds(formData.startTime);

        const duplicateCheck = existing.find((tc: any) => 
            tc.name === formData.name &&
            tc.dayOfWeek === safeDayOfWeek &&
            tc.startTime === safeStartTime &&
            tc.studioId === formData.studioId
        );

        if (duplicateCheck) {
            toast({ title: "Attenzione: Corso già presente", description: `Stai duplicando lo stesso corso per errore. Il corso ${duplicateCheck.name} in data ${duplicateCheck.dayOfWeek} ${duplicateCheck.startTime} esiste già nella stagione target.`, variant: "destructive" });
            return;
        }

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
          schedule: formData.schedule || null,
          startDate: formData.startDate ? new Date(formData.startDate) : null,
          endDate: formData.endDate ? new Date(formData.endDate) : null,
          level: formData.level || null,
          ageGroup: formData.ageGroup || null,
          lessonType: formData.lessonType || [],
          numberOfPeople: formData.numberOfPeople || null,
          statusTags: mergedTags,
          active: isActive,
          quoteId: formData.quoteId || null,
          googleEventId: null,
          seasonId: parseInt(formData.seasonId.toString()),
        };

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
                  <Combobox
                    name="name"
                    value={formData.name || ""}
                    options={(nomiCorsi || []).map(val => ({ value: val, label: val }))}
                    onValueChange={(val) => updateForm("name", val)}
                    placeholder={activityType === "campus" ? "Cerca campus..." : activityType === "workshop" ? "Cerca o inserisci nome..." : "Cerca genere..."}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-800">Stagione</Label>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU / Codice</Label>
                  <Input id="sku" value={formData.sku || ""} onChange={(e) => updateForm("sku", e.target.value)} placeholder={activityType === "campus" ? "es: 2526CAMPUS-1SETTIMANA-" : "es: 2526-CORSO-1"} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold text-slate-800 shrink-0">Categoria</Label>
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
                  <Combobox
                    name="categoryId"
                    value={formData.categoryId?.toString() || "none"}
                    onValueChange={val => updateForm("categoryId", val === "none" ? null : parseInt(val))}
                    options={[{value: "none", label: "Nessuna categoria"}, ...(categories || []).map(c => ({ value: c.id.toString(), label: c.name }))]}
                    placeholder="Seleziona categoria"
                  />
                </div>
              </div>

              {(activityType === "prenotazioni" || activityType === "allenamenti") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MultiSelectCustomList
                    systemName="tipologia_lezioni"
                    listName="TIPOLOGIA"
                    selectedValues={formData.lessonType || []}
                    onChange={(vals) => updateForm("lessonType", vals)}
                  />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="font-semibold text-slate-800 shrink-0">NUMERO PERSONE</Label>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsNumeroPersoneModalOpen(true); }}><Edit className="w-3 h-3 sidebar-icon-gold" /></Button>
                    </div>
                    <Combobox
                      name="numberOfPeople"
                      value={formData.numberOfPeople || "none"}
                      onValueChange={(val) => updateForm("numberOfPeople", val === "none" ? null : val)}
                      options={[{value: "none", label: "Seleziona..."}, ...(numeroPersone || []).map((val: string) => ({ value: val, label: val }))]}
                      placeholder="Trascina num persone..."
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {(activityType === "prenotazioni" || activityType === "allenamenti") ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="font-semibold text-slate-800">NOME ALLIEVO 1</Label>
                      <Button variant="outline" size="sm" type="button" onClick={() => { setQuickMemberTarget("member1"); setIsQuickMemberAddOpen(true); }}>➕ Nuovo</Button>
                    </div>
                    <div className="space-y-1 relative">
                      <Input
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
                    <Label className="font-semibold text-slate-800">Insegnante Principale</Label>
                    <Button variant="outline" size="sm" type="button" onClick={() => { setQuickMemberTarget("instructor"); setIsQuickMemberAddOpen(true); }}>➕ Nuovo</Button>
                  </div>
                  <Combobox
                    name="instructorId"
                    value={formData.instructorId?.toString() || "none"}
                    onValueChange={val => updateForm("instructorId", val === "none" ? null : parseInt(val))}
                    options={[{value: "none", label: "Nessuno"}, ...(instructors || []).map(i => ({ value: i.id.toString(), label: `${i.lastName} ${i.firstName}` }))]}
                    placeholder="Cerca Insegnante..."
                  />
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

              <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t flex flex-col sm:flex-row items-center justify-between w-full mt-6 gap-2">
                <div className="w-full sm:w-auto">
                  {isEdit && onDelete && canWrite && (
                    <Button type="button" variant="destructive" size="sm" onClick={() => { if (confirm("Sei sicuro di voler eliminare totalmente questa attività?")) { onDelete(course.id); onOpenChange(false); } }}>Elimina</Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
                  {isEdit && (
                    <Button type="button" variant="secondary" onClick={handleDuplicateFromModal} disabled={updateMutation.isPending || createMutation.isPending} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200">
                      {createMutation.isPending ? "Duplicazione..." : "Crea Copia (Duplica)"}
                    </Button>
                  )}
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
    <CustomListManagerDialog listType="gruppi_campus" title="Gestione Gruppi Campus" open={isGruppiCampusModalOpen} onOpenChange={setIsGruppiCampusModalOpen} />
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
