import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link, useSearch } from "wouter";
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
import { Plus, Search, Edit, Trash2, Users, Calendar, UserPlus, CalendarPlus, X, Download, Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { Course, InsertCourse, Category, Instructor, Studio, Attendance, Member, Quote } from "@shared/schema";

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

interface EnrollmentsTabProps {
  courseId: number;
}

function EnrollmentsTab({ courseId }: EnrollmentsTabProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const canWrite = hasWritePermission(user, "/iscritti-corsi");
  const [isAddingEnrollment, setIsAddingEnrollment] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const { data: enrollments } = useQuery<any[]>({
    queryKey: ["/api/enrollments"],
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
    mutationFn: async (data: { memberId: number; courseId: number }) => {
      await apiRequest("POST", "/api/enrollments", {
        memberId: data.memberId,
        courseId: data.courseId,
        status: 'active',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      toast({ title: "Iscrizione aggiunta con successo" });
      setIsAddingEnrollment(false);
      setSelectedMemberId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      await apiRequest("DELETE", `/api/enrollments/${enrollmentId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      toast({ title: "Iscrizione rimossa con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const courseEnrollments = enrollments
    ?.filter(e => e.courseId === courseId && e.status === 'active')
    .map(e => ({
      enrollmentId: e.id,
      memberId: e.memberId,
      firstName: e.memberFirstName || '',
      lastName: e.memberLastName || '',
      email: e.memberEmail || '',
    })) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          Membri Iscritti ({courseEnrollments.length})
        </h3>
        <Popover open={isAddingEnrollment} onOpenChange={setIsAddingEnrollment}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" data-testid="button-add-enrollment" disabled={!canWrite}>
              <UserPlus className="w-4 h-4 mr-2" />
              Aggiungi Iscritto
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Cerca per nome, cognome o CF (min. 3 caratteri)..."
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
                      .filter(m => !courseEnrollments.some(e => e.memberId === m.id))
                      .map(member => (
                        <CommandItem
                          key={member.id}
                          value={member.id.toString()}
                          onSelect={() => {
                            setSelectedMemberId(member.id);
                            createEnrollmentMutation.mutate({ memberId: member.id, courseId });
                            setMemberSearchQuery("");
                          }}
                          data-testid={`option-member-${member.id}`}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{member.firstName} {member.lastName}</span>
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

      {courseEnrollments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nessun membro iscritto a questo corso</p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cognome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseEnrollments.map((enrollment) => (
                <TableRow key={enrollment.enrollmentId}>
                  <TableCell className="font-medium">{enrollment.firstName}</TableCell>
                  <TableCell>{enrollment.lastName}</TableCell>
                  <TableCell>{enrollment.email || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/anagrafica_a_lista?search=${encodeURIComponent(`${enrollment.firstName} ${enrollment.lastName}`)}`}>
                        <Button variant="ghost" size="sm" data-testid={`button-view-member-${enrollment.memberId}`}>
                          Visualizza
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
                        disabled={!canWrite}
                        data-testid={`button-remove-enrollment-${enrollment.enrollmentId}`}
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
  courseId: number;
}

function AttendancesTab({ courseId }: AttendancesTabProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const canWrite = hasWritePermission(user, "/iscritti-corsi");
  const [isAddingAttendance, setIsAddingAttendance] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: attendances } = useQuery<Attendance[]>({
    queryKey: ["/api/attendances"],
  });

  const { data: membersData } = useQuery<{ members: Member[], total: number }>({
    queryKey: ["/api/members"],
  });
  const members = membersData?.members || [];

  const { data: enrollments } = useQuery<any[]>({
    queryKey: ["/api/enrollments"],
  });

  const createAttendanceMutation = useMutation({
    mutationFn: async (data: { memberId: number; courseId: number; attendanceDate: string }) => {
      await apiRequest("POST", "/api/attendances", {
        memberId: data.memberId,
        courseId: data.courseId,
        attendanceDate: new Date(data.attendanceDate).toISOString(),
        type: 'manual',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendances"] });
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
      await apiRequest("DELETE", `/api/attendances/${attendanceId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendances"] });
      toast({ title: "Presenza eliminata con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const courseAttendances = attendances
    ?.filter(a => a.courseId === courseId)
    .map(a => {
      const member = members?.find(m => m.id === a.memberId);
      return {
        ...a,
        memberName: member ? `${member.firstName} ${member.lastName}` : "Sconosciuto",
      };
    })
    .sort((a, b) => new Date(b.attendanceDate).getTime() - new Date(a.attendanceDate).getTime())
    .slice(0, 50) || [];

  const enrolledMembers = enrollments
    ?.filter(e => e.courseId === courseId && e.status === 'active')
    .map(e => members?.find(m => m.id === e.memberId))
    .filter((m): m is Member => m !== undefined) || [];

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
            data-testid="button-add-attendance"
            disabled={!canWrite}
          >
            <CalendarPlus className="w-4 h-4 mr-2" />
            Registra Presenza
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registra Presenza</DialogTitle>
              <DialogDescription>Seleziona il membro e la data della presenza</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="member">Membro *</Label>
                <Select value={selectedMemberId?.toString() || ""} onValueChange={(v) => setSelectedMemberId(parseInt(v))}>
                  <SelectTrigger data-testid="select-attendance-member">
                    <SelectValue placeholder="Seleziona membro" />
                  </SelectTrigger>
                  <SelectContent>
                    {enrolledMembers.map(member => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.firstName} {member.lastName}
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
                  data-testid="input-attendance-date"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingAttendance(false)} data-testid="button-cancel-attendance">
                Annulla
              </Button>
              <Button
                onClick={() => {
                  if (!selectedMemberId) {
                    toast({ title: "Errore", description: "Seleziona un membro", variant: "destructive" });
                    return;
                  }
                  createAttendanceMutation.mutate({
                    memberId: selectedMemberId,
                    courseId,
                    attendanceDate,
                  });
                }}
                disabled={!selectedMemberId || createAttendanceMutation.isPending}
                data-testid="button-submit-attendance"
              >
                Registra
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {courseAttendances.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nessuna presenza registrata per questo corso</p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Data e Ora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseAttendances.map((attendance: any) => (
                <TableRow key={attendance.id}>
                  <TableCell className="font-medium">{attendance.memberName}</TableCell>
                  <TableCell>
                    {format(new Date(attendance.attendanceDate), "dd/MM/yyyy HH:mm", { locale: it })}
                  </TableCell>
                  <TableCell>
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
                      disabled={!canWrite}
                      data-testid={`button-delete-attendance-${attendance.id}`}
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

export default function Courses() {
  const { toast } = useToast();
  const { user } = useAuth();
  const canWrite = hasWritePermission(user, "/corsi");
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const initialSearch = urlParams.get('search') || "";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
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

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const urlCourseId = urlParams.get('courseId');

  useEffect(() => {
    if (courses && urlCourseId) {
      const course = courses.find(c => c.id === parseInt(urlCourseId));
      if (course) {
        setEditingCourse(course);
        setSelectedDayOfWeek(course.dayOfWeek || "");
        setSelectedStartTime(course.startTime || "");
        setSelectedEndTime(course.endTime || "");
        setSelectedRecurrence(course.recurrenceType || "");
        setActiveTab("details");
        setIsFormOpen(true);
      }
    }
  }, [courses, urlCourseId]);

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
    queryKey: ["/api/enrollments"],
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
    return enrollments.filter(e => e.courseId === courseId && e.status === 'active').length;
  };

  const getCourseEnrollmentsList = (courseId: number): Array<{ id: number; firstName: string; lastName: string }> => {
    if (!enrollments) return [];
    return enrollments
      .filter(e => e.courseId === courseId && e.status === 'active')
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
      secondaryInstructor2Id: formData.get("secondaryInstructor2Id") ? parseInt(formData.get("secondaryInstructor2Id") as string) : null,
      price: formData.get("price") ? formData.get("price") as string : null,
      maxCapacity: formData.get("maxCapacity") ? parseInt(formData.get("maxCapacity") as string) : null,
      dayOfWeek: selectedDayOfWeek || null,
      startTime: selectedStartTime || null,
      endTime: selectedEndTime || null,
      recurrenceType: selectedRecurrence || null,
      schedule: formData.get("schedule") as string || null,
      startDate: formData.get("startDate") ? new Date(formData.get("startDate") as string) : null,
      endDate: formData.get("endDate") ? new Date(formData.get("endDate") as string) : null,
      active: true,
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
    setIsFormOpen(true);
  };

  const closeDialog = () => {
    setIsFormOpen(false);
    setEditingCourse(null);
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
    const secondaryInstructor2 = instructors?.find(i => i.id === course.secondaryInstructor2Id);
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
      secondaryInstructor2?.firstName?.toLowerCase().includes(query) ||
      secondaryInstructor2?.lastName?.toLowerCase().includes(query) ||
      studio?.name?.toLowerCase().includes(query) ||
      dayLabel.toLowerCase().includes(query) ||
      course.startTime?.includes(query) ||
      course.endTime?.includes(query)
    );
  }) || [];

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
        instructor ? `${instructor.firstName} ${instructor.lastName}` : "",
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
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Gestione Corsi</h1>
          <p className="text-muted-foreground">Organizza e gestisci i corsi disponibili</p>
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
                  <TableHead>Corso</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Insegnante</TableHead>
                  <TableHead>Prezzo</TableHead>
                  <TableHead>Posti</TableHead>
                  <TableHead>Iscritti</TableHead>
                  <TableHead>Giorno/Ora</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => {
                  const enrollmentCount = getCourseEnrollmentCount(course.id);
                  const enrollmentsList = getCourseEnrollmentsList(course.id);
                  return (
                    <TableRow key={course.id} data-testid={`course-row-${course.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          {course.sku && (
                            <button
                              onClick={() => openEditDialog(course)}
                              className="text-xs text-muted-foreground hover:text-primary hover:underline text-left"
                              data-testid={`link-course-sku-${course.id}`}
                            >
                              {course.sku}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingCourse(course);
                              setSelectedDayOfWeek(course.dayOfWeek || "");
                              setSelectedStartTime(course.startTime || "");
                              setSelectedEndTime(course.endTime || "");
                              setSelectedRecurrence(course.recurrenceType || "");
                              setActiveTab("enrollments");
                              setIsFormOpen(true);
                            }}
                            className="hover:text-primary hover:underline text-left"
                            data-testid={`link-course-name-${course.id}`}
                          >
                            {course.name}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {categories?.find(c => c.id === course.categoryId)?.name || "-"}
                      </TableCell>
                      <TableCell>
                        {instructors?.find(i => i.id === course.instructorId)
                          ? `${instructors.find(i => i.id === course.instructorId)?.firstName} ${instructors.find(i => i.id === course.instructorId)?.lastName}`
                          : "-"}
                      </TableCell>
                      <TableCell>€{course.price || "0.00"}</TableCell>
                      <TableCell>{enrollmentCount}/{course.maxCapacity || "∞"}</TableCell>
                      <TableCell>
                        {enrollmentsList.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {enrollmentsList.slice(0, 2).map((member) => (
                              <Link key={member.id} href={`/iscritti?search=${encodeURIComponent(`${member.firstName} ${member.lastName}`)}`}>
                                <Badge variant="outline" className="text-xs cursor-pointer hover-elevate" data-testid={`badge-member-${member.id}`}>
                                  {member.firstName} {member.lastName}
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
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span className="font-semibold text-primary">{normalizeDay(course.dayOfWeek)}</span>
                          <span>{course.startTime && course.endTime ? `${course.startTime} - ${course.endTime}` : "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {course.startDate && course.endDate
                          ? `${new Date(course.startDate).toLocaleDateString('it-IT')} - ${new Date(course.endDate).toLocaleDateString('it-IT')}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={course.active ? "default" : "secondary"}>
                          {course.active ? "Attivo" : "Inattivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(course)}
                            data-testid={`button-edit-course-${course.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Sei sicuro di voler eliminare questo corso?")) {
                                deleteMutation.mutate(course.id);
                              }
                            }}
                            data-testid={`button-delete-course-${course.id}`}
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
            <DialogTitle>{editingCourse ? "Modifica Corso" : "Nuovo Corso"}</DialogTitle>
            <DialogDescription>
              {editingCourse ? "Gestisci i dettagli del corso, visualizza iscritti e presenze" : "Inserisci i dettagli del corso"}
            </DialogDescription>
          </DialogHeader>

          {editingCourse ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details" data-testid="tab-details">Dettagli</TabsTrigger>
                <TabsTrigger value="enrollments" data-testid="tab-enrollments">
                  <Users className="w-4 h-4 mr-1" />
                  Iscritti ({getCourseEnrollmentCount(editingCourse.id)})
                </TabsTrigger>
                <TabsTrigger value="attendances" data-testid="tab-attendances">
                  <Calendar className="w-4 h-4 mr-1" />
                  Presenze ({getCourseAttendances(editingCourse.id).length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <form onSubmit={handleSubmit} id="edit-course-form" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Corso *</Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        defaultValue={editingCourse.name}
                        data-testid="input-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        name="sku"
                        placeholder="es: 2526-NEMBRI-LUN-15"
                        defaultValue={editingCourse?.sku || ""}
                        data-testid="input-sku"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrizione</Label>
                    <Textarea
                      id="description"
                      name="description"
                      rows={3}
                      defaultValue={editingCourse?.description || ""}
                      data-testid="input-description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoryId">Categoria</Label>
                      <Select name="categoryId" defaultValue={editingCourse?.categoryId?.toString()}>
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
                      <Select name="studioId" defaultValue={editingCourse.studioId?.toString()}>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="instructorId" className="text-sm text-muted-foreground">Principale</Label>
                        <Select name="instructorId" defaultValue={editingCourse.instructorId?.toString()}>
                          <SelectTrigger data-testid="select-instructor">
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
                        <Label htmlFor="secondaryInstructor1Id" className="text-sm text-muted-foreground">Secondario 1</Label>
                        <Select name="secondaryInstructor1Id" defaultValue={editingCourse.secondaryInstructor1Id?.toString()}>
                          <SelectTrigger data-testid="select-secondary-instructor-1">
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
                        <Label htmlFor="secondaryInstructor2Id" className="text-sm text-muted-foreground">Secondario 2</Label>
                        <Select name="secondaryInstructor2Id" defaultValue={editingCourse.secondaryInstructor2Id?.toString()}>
                          <SelectTrigger data-testid="select-secondary-instructor-2">
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        defaultValue={editingCourse.maxCapacity || ""}
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
                        defaultValue={editingCourse?.startDate ? new Date(editingCourse.startDate).toISOString().split('T')[0] : ""}
                        data-testid="input-startDate"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate">Data Fine</Label>
                      <Input
                        id="endDate"
                        name="endDate"
                        type="date"
                        defaultValue={editingCourse?.endDate ? new Date(editingCourse.endDate).toISOString().split('T')[0] : ""}
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
                      defaultValue={editingCourse.schedule || ""}
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
                      disabled={updateMutation.isPending}
                      data-testid="button-submit-course"
                    >
                      Salva Modifiche
                    </Button>
                  </DialogFooter>
                </form>
              </TabsContent>

              <TabsContent value="enrollments" className="space-y-4">
                <EnrollmentsTab courseId={editingCourse.id} />
              </TabsContent>

              <TabsContent value="attendances" className="space-y-4">
                <AttendancesTab courseId={editingCourse.id} />
              </TabsContent>
            </Tabs>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Corso *</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    data-testid="input-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    name="sku"
                    placeholder="es: 2526-NEMBRI-LUN-15"
                    data-testid="input-sku"
                  />
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instructorId" className="text-sm text-muted-foreground">Principale</Label>
                    <Select name="instructorId">
                      <SelectTrigger data-testid="select-instructor">
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
                    <Label htmlFor="secondaryInstructor1Id" className="text-sm text-muted-foreground">Secondario 1 (opzionale)</Label>
                    <Select name="secondaryInstructor1Id">
                      <SelectTrigger data-testid="select-secondary-instructor-1">
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
                    <Label htmlFor="secondaryInstructor2Id" className="text-sm text-muted-foreground">Secondario 2 (opzionale)</Label>
                    <Select name="secondaryInstructor2Id">
                      <SelectTrigger data-testid="select-secondary-instructor-2">
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    data-testid="input-startDate"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Data Fine</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
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
                  disabled={createMutation.isPending}
                  data-testid="button-submit-course"
                >
                  Crea Corso
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
