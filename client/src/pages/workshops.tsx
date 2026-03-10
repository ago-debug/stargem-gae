import { useState } from "react";
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
import { Plus, Search, Edit, Trash2, Users, Calendar, UserPlus, CalendarPlus, X, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityNavMenu } from "@/components/activity-nav-menu";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { MultiSelectStatus, StatusBadge, getStatusColor } from "@/components/multi-select-status";
import { ArrowLeft } from "lucide-react";
import { cn, parseStatusTags } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { Workshop, InsertWorkshop, Category, Instructor, Studio, Member, Enrollment, Payment, Attendance, ActivityStatus, Quote } from "@shared/schema";
import { buildEnrolledMembersData } from "@/lib/enrollments";

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

interface WorkshopEnrollment {
  id: number;
  workshopId: number;
  memberId: number;
  startDate: string;
  endDate?: string | null;
  status: string;
  memberFirstName?: string;
  memberLastName?: string;
  memberEmail?: string;
  memberFiscalCode?: string;
}

interface WorkshopAttendance {
  id: number;
  workshopId: number;
  memberId: number;
  attendanceDate: string;
  type: string;
}

interface EnrollmentsTabProps {
  workshopId: number;
}

function EnrollmentsTab({ workshopId }: EnrollmentsTabProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isAddingEnrollment, setIsAddingEnrollment] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const { data: enrollments } = useQuery<WorkshopEnrollment[]>({
    queryKey: ["/api/workshop-enrollments"],
  });

  const { data: membersData } = useQuery<{ members: Member[], total: number }>({
    queryKey: ["/api/members"],
  });
  const members = membersData?.members || [];

  const { data: searchResults } = useQuery<{ members: Member[], total: number }>({
    queryKey: ["/api/members", { search: memberSearchQuery }],
    queryFn: async () => {
      const res = await fetch(`/api/members?search=${encodeURIComponent(memberSearchQuery)}&pageSize=20`);
      return res.json();
    },
    enabled: memberSearchQuery.length >= 3,
  });

  const createEnrollmentMutation = useMutation({
    mutationFn: async (data: { memberId: number; workshopId: number }) => {
      await apiRequest("POST", "/api/workshop-enrollments", {
        memberId: data.memberId,
        workshopId: data.workshopId,
        startDate: new Date().toISOString().split('T')[0],
        status: 'active',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshop-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workshops"] });
      toast({ title: "Iscrizione aggiunta con successo" });
      setIsAddingEnrollment(false);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      await apiRequest("DELETE", `/api/workshop-enrollments/${enrollmentId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshop-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workshops"] });
      toast({ title: "Iscrizione rimossa con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const enrichedWorkshopData = buildEnrolledMembersData({
    activityId: workshopId,
    isWorkshop: true,
    enrollments: enrollments || [],
    membersData: membersData || { members: [] }
  });

  const workshopEnrollments = enrichedWorkshopData.map((data: any) => ({
    enrollmentId: data.enrollment.id,
    memberId: data.member.id,
    firstName: data.member.firstName || '',
    lastName: data.member.lastName || '',
    email: data.member.email || '',
  }));

  const { sortConfig, handleSort, sortItems, isSortedColumn } = useSortableTable<any>("lastName");

  const getSortValue = (enrollment: any, key: string) => {
    switch (key) {
      case "firstName": return enrollment.firstName || "";
      case "lastName": return enrollment.lastName || "";
      case "email": return enrollment.email || "";
      default: return null;
    }
  };

  const sortedEnrollments = sortItems(workshopEnrollments, getSortValue);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          Partecipanti Iscritti ({workshopEnrollments.length})
        </h3>
        <Popover open={isAddingEnrollment} onOpenChange={setIsAddingEnrollment}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" data-testid="button-add-workshop-enrollment">
              <UserPlus className="w-4 h-4 mr-2" />
              Aggiungi Partecipante
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Cerca per cognome, nome o CF (min. 3 caratteri)..."
                value={memberSearchQuery}
                onValueChange={setMemberSearchQuery}
              />
              <CommandList>
                {memberSearchQuery.length < 3 ? (
                  <CommandEmpty>Digita almeno 3 caratteri per cercare</CommandEmpty>
                ) : !searchResults?.members?.length ? (
                  <CommandEmpty>Nessun membro trovato</CommandEmpty>
                ) : (
                  <CommandGroup>
                    {searchResults.members
                      .filter((m: Member) => !workshopEnrollments.some((e: any) => e.memberId === m.id))
                      .map((member: Member) => (
                        <CommandItem
                          key={member.id}
                          value={member.id.toString()}
                          onSelect={() => {
                            createEnrollmentMutation.mutate({ memberId: member.id, workshopId });
                            setMemberSearchQuery("");
                          }}
                          data-testid={`option-workshop-member-${member.id}`}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{member.lastName} {member.firstName}</span>
                            {member.fiscalCode && (
                              <span className="text-xs text-muted-foreground">{member.fiscalCode}</span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {workshopEnrollments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nessun partecipante iscritto a questo workshop</p>
      ) : (
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
              {sortedEnrollments.map((enrollment: any) => (
                <TableRow key={enrollment.enrollmentId}>
                  <TableCell className={cn("font-medium", isSortedColumn("firstName") && "sorted-column-cell")}>{enrollment.firstName}</TableCell>
                  <TableCell className={cn(isSortedColumn("lastName") && "sorted-column-cell")}>{enrollment.lastName}</TableCell>
                  <TableCell className={cn(isSortedColumn("email") && "sorted-column-cell")}>{enrollment.email || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setLocation(`${window.location.pathname}?editMemberId=${enrollment.memberId}`)}
                        className="text-xs text-primary hover:underline"
                        title="Modifica Rapida"
                      >
                        Modifica
                      </button>
                      <Link href={`/anagrafica_a_lista?search=${enrollment.lastName}`}>
                        <Button variant="ghost" size="sm" data-testid={`button-view-workshop-member-${enrollment.memberId}`}>
                          Profilo
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Sei sicuro di voler rimuovere questa iscrizione?")) {
                            deleteEnrollmentMutation.mutate(enrollment.enrollmentId);
                          }
                        }}
                        data-testid={`button-remove-workshop-enrollment-${enrollment.enrollmentId}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
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
  workshopId: number;
}

function AttendancesTab({ workshopId }: AttendancesTabProps) {
  const { toast } = useToast();
  const [isAddingAttendance, setIsAddingAttendance] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: attendances } = useQuery<WorkshopAttendance[]>({
    queryKey: ["/api/workshop-attendances"],
  });

  const { data: membersData } = useQuery<{ members: Member[], total: number }>({
    queryKey: ["/api/members"],
  });
  const members = membersData?.members || [];

  const { data: enrollments } = useQuery<WorkshopEnrollment[]>({
    queryKey: ["/api/workshop-enrollments"],
  });

  const createAttendanceMutation = useMutation({
    mutationFn: async (data: { memberId: number; workshopId: number; attendanceDate: string }) => {
      await apiRequest("POST", "/api/workshop-attendances", {
        memberId: data.memberId,
        workshopId: data.workshopId,
        attendanceDate: new Date(data.attendanceDate).toISOString(),
        type: 'manual',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshop-attendances"] });
      toast({ title: "Presenza registrata con successo" });
      setIsAddingAttendance(false);
      setSelectedMemberId(null);
      setAttendanceDate(new Date().toISOString().split('T')[0]);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteAttendanceMutation = useMutation({
    mutationFn: async (attendanceId: number) => {
      await apiRequest("DELETE", `/api/workshop-attendances/${attendanceId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshop-attendances"] });
      toast({ title: "Presenza eliminata con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const workshopAttendances = attendances
    ?.filter(a => a.workshopId === workshopId)
    .map(a => {
      const member = members?.find(m => m.id === a.memberId);
      return {
        ...a,
        memberName: member ? `${member.lastName} ${member.firstName}` : "Sconosciuto",
      };
    })
    .sort((a, b) => new Date(b.attendanceDate).getTime() - new Date(a.attendanceDate).getTime())
    .slice(0, 50) || [];

  const enrolledMembers = enrollments
    ?.filter(e => e.workshopId === workshopId && (e.status === 'active' || !e.status))
    .map(e => members?.find(m => m.id === e.memberId))
    .filter((m): m is Member => m !== undefined) || [];

  const { sortConfig, handleSort, sortItems, isSortedColumn } = useSortableTable<any>("attendanceDate");

  const getSortValue = (attendance: any, key: string) => {
    switch (key) {
      case "member": return attendance.memberName || "";
      case "attendanceDate": return attendance.attendanceDate || "";
      case "type": return attendance.type || "";
      default: return null;
    }
  };

  const sortedAttendances = sortItems(workshopAttendances, getSortValue);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          Presenze Registrate
        </h3>
        <Dialog open={isAddingAttendance} onOpenChange={setIsAddingAttendance}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingAttendance(true)}
            data-testid="button-add-workshop-attendance"
          >
            <CalendarPlus className="w-4 h-4 mr-2" />
            Registra Presenza
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registra Presenza</DialogTitle>
              <DialogDescription>Seleziona il partecipante e la data della presenza</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="member">Partecipante *</Label>
                <Select value={selectedMemberId?.toString() || ""} onValueChange={(v) => setSelectedMemberId(parseInt(v))}>
                  <SelectTrigger data-testid="select-workshop-attendance-member">
                    <SelectValue placeholder="Seleziona partecipante" />
                  </SelectTrigger>
                  <SelectContent>
                    {enrolledMembers.map(member => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.lastName} {member.firstName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="attendanceDate">Data e Ora *</Label>
                <Input
                  id="attendanceDate"
                  type="datetime-local"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  data-testid="input-workshop-attendance-date"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingAttendance(false)} data-testid="button-cancel-workshop-attendance">
                Annulla
              </Button>
              <Button
                onClick={() => {
                  if (!selectedMemberId) {
                    toast({ title: "Errore", description: "Seleziona un partecipante", variant: "destructive" });
                    return;
                  }
                  createAttendanceMutation.mutate({
                    memberId: selectedMemberId,
                    workshopId,
                    attendanceDate,
                  });
                }}
                disabled={!selectedMemberId || createAttendanceMutation.isPending}
                data-testid="button-submit-workshop-attendance"
              >
                Registra
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {workshopAttendances.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nessuna presenza registrata per questo workshop</p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead sortKey="member" currentSort={sortConfig} onSort={handleSort}>Partecipante</SortableTableHead>
                <SortableTableHead sortKey="attendanceDate" currentSort={sortConfig} onSort={handleSort}>Data e Ora</SortableTableHead>
                <SortableTableHead sortKey="type" currentSort={sortConfig} onSort={handleSort}>Tipo</SortableTableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAttendances.map((attendance: any) => (
                <TableRow key={attendance.id}>
                  <TableCell className={cn("font-medium", isSortedColumn("member") && "sorted-column-cell")}>{attendance.memberName}</TableCell>
                  <TableCell className={cn(isSortedColumn("attendanceDate") && "sorted-column-cell")}>
                    {format(new Date(attendance.attendanceDate), "dd/MM/yyyy HH:mm", { locale: it })}
                  </TableCell>
                  <TableCell className={cn(isSortedColumn("type") && "sorted-column-cell")}>
                    <Badge variant="outline">
                      {attendance.type === 'manual' ? 'Manuale' :
                        attendance.type === 'barcode' ? 'Badge' : 'Auto'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Sei sicuro di voler eliminare questa presenza?")) {
                          deleteAttendanceMutation.mutate(attendance.id);
                        }
                      }}
                      data-testid={`button-delete-workshop-attendance-${attendance.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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

export default function Workshops() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const initialSearch = urlParams.get('search') || "";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusTags, setStatusTags] = useState<string[]>([]);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<string>("");
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [selectedEndTime, setSelectedEndTime] = useState<string>("");
  const [selectedRecurrence, setSelectedRecurrence] = useState<string>("");
  const [selectedStartDate, setSelectedStartDate] = useState<string>("");
  const [selectedEndDate, setSelectedEndDate] = useState<string>("");
  const [activeTab, setActiveTab] = useState("details");

  const [selectedQuoteId, setSelectedQuoteId] = useState<string>("");
  const [price, setPrice] = useState<string>("");

  const { data: quotes } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: workshops, isLoading } = useQuery<Workshop[]>({
    queryKey: ["/api/workshops"],
  });

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

  const { data: enrollments } = useQuery<WorkshopEnrollment[]>({
    queryKey: ["/api/workshop-enrollments"],
  });

  const { data: membersData } = useQuery<{ members: Member[], total: number }>({
    queryKey: ["/api/members"],
  });
  const members = membersData?.members || [];

  const { data: attendances } = useQuery<WorkshopAttendance[]>({
    queryKey: ["/api/workshop-attendances"],
  });

  const getWorkshopStats = (workshopId: number) => {
    if (!enrollments) return { men: 0, women: 0, total: 0 };
    const enrolls = enrollments.filter(e => e.workshopId === workshopId && (e.status === 'active' || !e.status));
    const men = enrolls.filter(e => {
      const g = (e as any).memberGender?.toUpperCase();
      return g === 'U' || g === 'M' || g === 'UOMO' || g === 'MASCHIO';
    }).length;
    const women = enrolls.filter(e => {
      const g = (e as any).memberGender?.toUpperCase();
      return g === 'D' || g === 'F' || g === 'DONNA' || g === 'FEMMINA';
    }).length;
    return { men, women, total: enrolls.length };
  };

  const getWorkshopEnrollmentCount = (workshopId: number): number => {
    return getWorkshopStats(workshopId).total;
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
    if (!attendances || !members) return [];
    return attendances
      .filter(a => a.workshopId === workshopId)
      .map(a => {
        const member = members.find(m => m.id === a.memberId);
        return {
          ...a,
          memberName: member ? `${member.lastName} ${member.firstName}` : "Sconosciuto",
        };
      })
      .sort((a, b) => new Date(b.attendanceDate).getTime() - new Date(a.attendanceDate).getTime())
      .slice(0, 20);
  };

  const createMutation = useMutation({
    mutationFn: async (data: InsertWorkshop) => {
      await apiRequest("POST", "/api/workshops", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshops"] });
      toast({ title: "Workshop creato con successo" });
      setIsFormOpen(false);
      setEditingWorkshop(null);
      setStatusTags([]);
      setSelectedQuoteId("");
      setPrice("");
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertWorkshop }) => {
      await apiRequest("PATCH", `/api/workshops/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshops"] });
      toast({ title: "Workshop aggiornato con successo" });
      setIsFormOpen(false);
      setEditingWorkshop(null);
      setStatusTags([]);
      setSelectedQuoteId("");
      setPrice("");
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/workshops/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshops"] });
      toast({ title: "Workshop eliminato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: InsertWorkshop = {
      sku: formData.get("sku") as string || null,
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      categoryId: formData.get("categoryId") ? parseInt(formData.get("categoryId") as string) : null,
      studioId: formData.get("studioId") ? parseInt(formData.get("studioId") as string) : null,
      instructorId: formData.get("instructorId") ? parseInt(formData.get("instructorId") as string) : null,
      secondaryInstructor1Id: formData.get("secondaryInstructor1Id") ? parseInt(formData.get("secondaryInstructor1Id") as string) : null,
      price: price || null,
      quoteId: selectedQuoteId ? parseInt(selectedQuoteId) : null,
      maxCapacity: formData.get("maxCapacity") ? parseInt(formData.get("maxCapacity") as string) : null,
      dayOfWeek: selectedDayOfWeek || null,
      startTime: selectedStartTime || null,
      endTime: selectedEndTime || null,
      recurrenceType: selectedRecurrence || null,
      schedule: formData.get("schedule") as string || null,
      startDate: selectedStartDate as any || null,
      endDate: selectedEndDate as any || null,
      statusTags, active: true,
    };

    const performSave = async (force = false) => {
      try {
        if (editingWorkshop) {
          await apiRequest("PATCH", `/api/workshops/${editingWorkshop.id}${force ? '?force=true' : ''}`, data);
        } else {
          await apiRequest("POST", `/api/workshops${force ? '?force=true' : ''}`, data);
        }
        queryClient.invalidateQueries({ queryKey: ["/api/workshops"] });
        toast({ title: editingWorkshop ? "Workshop aggiornato" : "Workshop creato" });
        setIsFormOpen(false);
        setEditingWorkshop(null);
        setStatusTags([]);
      } catch (err: any) {
        if (err.message?.includes("Conflitto rilevato") || (err.status === 409)) {
          const msg = typeof err === 'string' ? err : (err.message || "Conflitto rilevato");
          if (confirm(msg + "\n\nVuoi forzare il salvataggio comunque?")) {
            await performSave(true);
          }
        } else {
          toast({ title: "Errore", description: err.message, variant: "destructive" });
        }
      }
    };

    await performSave();
  };

  const openEditDialog = (workshop: Workshop) => {
    setEditingWorkshop(workshop);
    setSelectedDayOfWeek(workshop.dayOfWeek || "");
    setSelectedStartTime(workshop.startTime || "");
    setSelectedEndTime(workshop.endTime || "");
    setSelectedRecurrence(workshop.recurrenceType || "");
    setSelectedQuoteId(workshop.quoteId?.toString() || "");
    setPrice(workshop.price || "");

    // Format dates for input type="date"
    const startD = workshop.startDate ? (workshop.startDate instanceof Date ? workshop.startDate.toISOString().split('T')[0] : new Date(workshop.startDate).toISOString().split('T')[0]) : "";
    const endD = workshop.endDate ? (workshop.endDate instanceof Date ? workshop.endDate.toISOString().split('T')[0] : new Date(workshop.endDate).toISOString().split('T')[0]) : "";

    setSelectedStartDate(startD);
    setSelectedEndDate(endD);
    setStatusTags(parseStatusTags(workshop.statusTags));
    setActiveTab("details");
    setIsFormOpen(true);
  };

  const closeDialog = () => {
    setIsFormOpen(false);
    setEditingWorkshop(null);
    setStatusTags([]);
    setSelectedDayOfWeek("");
    setSelectedStartTime("");
    setSelectedEndTime("");
    setSelectedRecurrence("");
    setSelectedStartDate("");
    setSelectedEndDate("");
    setActiveTab("details");
  };

  const handleDateChange = (val: string, type: 'start' | 'end') => {
    if (type === 'start') {
      setSelectedStartDate(val);
      if (val) {
        const date = new Date(val);
        const dayIdx = date.getDay(); // 0 (Sun) to 6 (Sat)
        const daysMap = ["DOM", "LUN", "MAR", "MER", "GIO", "VEN", "SAB"];
        setSelectedDayOfWeek(daysMap[dayIdx]);
      }
    } else {
      setSelectedEndDate(val);
    }
  };

  const filteredWorkshops = workshops?.filter((workshop) =>
    workshop.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const { sortConfig, handleSort, sortItems, isSortedColumn } = useSortableTable<typeof filteredWorkshops[0]>("sku");

  const getSortValue = (workshop: typeof filteredWorkshops[0], key: string) => {
    switch (key) {
      case "sku": return workshop.sku;
      case "name": return workshop.name;
      case "category": return categories?.find(c => c.id === workshop.categoryId)?.name;
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

  const exportToCSV = () => {
    if (!filteredWorkshops.length) return;

    const headers = ["Nome", "Descrizione", "Categoria", "Insegnante", "Prezzo", "Max Partecipanti", "Giorno", "Orario Inizio", "Orario Fine", "Ricorrenza", "Data Inizio", "Data Fine", "Stato"];

    const rows = filteredWorkshops.map(workshop => {
      const category = categories?.find(c => c.id === workshop.categoryId);
      const instructor = instructors?.find(i => i.id === workshop.instructorId);
      const dayLabel = WEEKDAYS.find(d => d.id === workshop.dayOfWeek)?.label || "";
      const recurrenceLabel = RECURRENCE_TYPES.find(r => r.id === workshop.recurrenceType)?.label || "";

      return [
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
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca workshop..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-workshops"
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
            ) : filteredWorkshops.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium mb-2">Nessun workshop trovato</p>
                <p className="text-sm">Inizia aggiungendo il primo workshop</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead sortKey="sku" currentSort={sortConfig} onSort={handleSort}>SKU/Codice</SortableTableHead>
                    <SortableTableHead sortKey="name" currentSort={sortConfig} onSort={handleSort}>Workshop</SortableTableHead>
                    <SortableTableHead sortKey="category" currentSort={sortConfig} onSort={handleSort}>Categoria</SortableTableHead>
                    <SortableTableHead sortKey="instructor" currentSort={sortConfig} onSort={handleSort}>Staff/Insegnante</SortableTableHead>
                    <SortableTableHead sortKey="price" currentSort={sortConfig} onSort={handleSort}>Prezzo</SortableTableHead>
                    <SortableTableHead sortKey="capacity" currentSort={sortConfig} onSort={handleSort}>Posti Max</SortableTableHead>
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
                        <TableCell className={cn("text-xs text-muted-foreground", isSortedColumn("sku") && "sorted-column-cell")}>
                          {workshop.sku || "-"}
                        </TableCell>
                        <TableCell className={cn("font-medium", isSortedColumn("name") && "sorted-column-cell")}>
                          <div className="flex flex-col">
                            <button
                              onClick={() => {
                                openEditDialog(workshop);
                                setEditingWorkshop(workshop);
                                // setSelectedDayOfWeek removed for brevity or reuse
                                setActiveTab("enrollments");
                                setStatusTags(workshop.statusTags || []);
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
                          {categories?.find(c => c.id === workshop.categoryId)?.name || "-"}
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
                          {workshop.maxCapacity || "∞"}
                        </TableCell>
                        <TableCell className={cn("text-center", isSortedColumn("enrollments") && "sorted-column-cell")}>
                          <Badge variant="secondary">{enrollmentCount}</Badge>
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
                                  name={tag}
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
                              onClick={() => setLocation(`/scheda-workshop?workshopId=${workshop.id}`)}
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

        <Dialog open={isFormOpen} onOpenChange={(open) => {
          if (!open) closeDialog();
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingWorkshop ? "Modifica Workshop" : "Nuovo Workshop"}</DialogTitle>
              <DialogDescription>
                {editingWorkshop ? "Gestisci i dettagli del workshop, visualizza iscritti e presenze" : "Inserisci i dettagli del workshop"}
              </DialogDescription>
            </DialogHeader>

            {editingWorkshop ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details" data-testid="tab-workshop-details">Dettagli</TabsTrigger>
                  <TabsTrigger value="enrollments" data-testid="tab-workshop-enrollments">
                    <Users className="w-4 h-4 mr-1" />
                    Iscritti ({getWorkshopEnrollmentCount(editingWorkshop.id)})
                  </TabsTrigger>
                  <TabsTrigger value="attendances" data-testid="tab-workshop-attendances">
                    <Calendar className="w-4 h-4 mr-1" />
                    Presenze ({getWorkshopAttendances(editingWorkshop.id).length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <form onSubmit={handleSubmit} id="edit-workshop-form" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Workshop *</Label>
                        <Input
                          id="name"
                          name="name"
                          required
                          defaultValue={editingWorkshop.name}
                          data-testid="input-name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sku">SKU/Codice</Label>
                        <Input
                          id="sku"
                          name="sku"
                          placeholder="es: WS-2526-YOGA"
                          defaultValue={editingWorkshop.sku || ""}
                          data-testid="input-sku"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Stato</Label>
                        <MultiSelectStatus selectedStatuses={statusTags} onChange={setStatusTags} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrizione</Label>
                      <Textarea
                        id="description"
                        name="description"
                        rows={3}
                        defaultValue={editingWorkshop.description || ""}
                        data-testid="input-description"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="categoryId">Categoria</Label>
                        <Select name="categoryId" defaultValue={editingWorkshop.categoryId?.toString()}>
                          <SelectTrigger data-testid="select-category">
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
                        <Select name="studioId" defaultValue={editingWorkshop.studioId?.toString()}>
                          <SelectTrigger data-testid="select-studio">
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
                      <Label>Insegnanti</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="instructorId" className="text-sm text-muted-foreground">Principale</Label>
                          <Select name="instructorId" defaultValue={editingWorkshop.instructorId?.toString()}>
                            <SelectTrigger data-testid="select-instructor">
                              <SelectValue placeholder="Seleziona" />
                            </SelectTrigger>
                            <SelectContent>
                              {instructors?.map((instructor) => (
                                <SelectItem key={instructor.id} value={instructor.id.toString()}>
                                  {instructor.lastName} {instructor.firstName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="secondaryInstructor1Id" className="text-sm text-muted-foreground">Secondario 1</Label>
                          <Select name="secondaryInstructor1Id" defaultValue={editingWorkshop.secondaryInstructor1Id?.toString()}>
                            <SelectTrigger data-testid="select-secondary-instructor-1">
                              <SelectValue placeholder="Nessuno" />
                            </SelectTrigger>
                            <SelectContent>
                              {instructors?.map((instructor) => (
                                <SelectItem key={instructor.id} value={instructor.id.toString()}>
                                  {instructor.lastName} {instructor.firstName}
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
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          data-testid="input-price"
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
                          defaultValue={editingWorkshop.maxCapacity || ""}
                          data-testid="input-maxCapacity"
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
                          value={selectedStartDate}
                          onChange={(e) => handleDateChange(e.target.value, 'start')}
                          data-testid="input-startDate"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endDate">Data Fine</Label>
                        <Input
                          id="endDate"
                          name="endDate"
                          type="date"
                          value={selectedEndDate}
                          onChange={(e) => handleDateChange(e.target.value, 'end')}
                          data-testid="input-endDate"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dayOfWeek">Giorno Settimana</Label>
                        <Select value={selectedDayOfWeek} onValueChange={setSelectedDayOfWeek}>
                          <SelectTrigger data-testid="select-dayOfWeek">
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
                          <SelectTrigger data-testid="select-startTime">
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
                          <SelectTrigger data-testid="select-endTime">
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
                          <SelectTrigger data-testid="select-recurrenceType">
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
                        defaultValue={editingWorkshop.schedule || ""}
                        data-testid="input-schedule"
                      />
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={closeDialog}
                        data-testid="button-cancel"
                      >
                        Annulla
                      </Button>
                      <Button
                        type="submit"
                        className="gold-3d-button"
                        disabled={updateMutation.isPending}
                        data-testid="button-submit-workshop"
                      >
                        Salva Modifiche
                      </Button>
                    </DialogFooter>
                  </form>
                </TabsContent>

                <TabsContent value="enrollments" className="space-y-4">
                  <EnrollmentsTab workshopId={editingWorkshop.id} />
                </TabsContent>

                <TabsContent value="attendances" className="space-y-4">
                  <AttendancesTab workshopId={editingWorkshop.id} />
                </TabsContent>
              </Tabs>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Workshop *</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      data-testid="input-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU/Codice</Label>
                    <Input
                      id="sku"
                      name="sku"
                      placeholder="es: WS-2526-YOGA"
                      data-testid="input-sku"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stato</Label>
                    <MultiSelectStatus selectedStatuses={statusTags} onChange={setStatusTags} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrizione</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={3}
                    data-testid="input-description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Categoria</Label>
                    <Select name="categoryId">
                      <SelectTrigger data-testid="select-category">
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
                    <Select name="studioId">
                      <SelectTrigger data-testid="select-studio">
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
                  <Label>Insegnanti</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instructorId" className="text-sm text-muted-foreground">Principale</Label>
                      <Select name="instructorId">
                        <SelectTrigger data-testid="select-instructor">
                          <SelectValue placeholder="Seleziona" />
                        </SelectTrigger>
                        <SelectContent>
                          {instructors?.map((instructor) => (
                            <SelectItem key={instructor.id} value={instructor.id.toString()}>
                              {instructor.lastName} {instructor.firstName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondaryInstructor1Id" className="text-sm text-muted-foreground">Secondario 1 (opzionale)</Label>
                      <Select name="secondaryInstructor1Id">
                        <SelectTrigger data-testid="select-secondary-instructor-1">
                          <SelectValue placeholder="Nessuno" />
                        </SelectTrigger>
                        <SelectContent>
                          {instructors?.map((instructor) => (
                            <SelectItem key={instructor.id} value={instructor.id.toString()}>
                              {instructor.lastName} {instructor.firstName}
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
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      data-testid="input-price"
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
                      data-testid="input-maxCapacity"
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
                      value={selectedStartDate}
                      onChange={(e) => handleDateChange(e.target.value, 'start')}
                      data-testid="input-startDate"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data Fine</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={selectedEndDate}
                      onChange={(e) => handleDateChange(e.target.value, 'end')}
                      data-testid="input-endDate"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dayOfWeek">Giorno Settimana</Label>
                    <Select value={selectedDayOfWeek} onValueChange={setSelectedDayOfWeek}>
                      <SelectTrigger data-testid="select-dayOfWeek">
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
                      <SelectTrigger data-testid="select-startTime">
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
                      <SelectTrigger data-testid="select-endTime">
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
                      <SelectTrigger data-testid="select-recurrenceType">
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
                    data-testid="input-schedule"
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeDialog}
                    data-testid="button-cancel"
                  >
                    Annulla
                  </Button>
                  <Button
                    type="submit"
                    className="gold-3d-button"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-workshop"
                  >
                    Crea Workshop
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
