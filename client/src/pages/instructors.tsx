import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, Briefcase, ArrowUpDown, ChevronUp, ChevronDown, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Instructor, InsertInstructor, Course } from "@shared/schema";

const DAY_MAP: Record<string, string> = {
  "LUN": "Lunedì",
  "MAR": "Martedì",
  "MER": "Mercoledì",
  "GIO": "Giovedì",
  "VEN": "Venerdì",
  "SAB": "Sabato",
  "DOM": "Domenica"
};

export default function Instructors() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"firstName" | "lastName">("firstName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [, setLocation] = useLocation();

  const { data: instructors, isLoading } = useQuery<Instructor[]>({
    queryKey: ["/api/instructors"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const getInstructorCourses = (instructorId: number) => {
    if (!courses) return [];
    return courses.filter(
      course =>
        course.instructorId === instructorId ||
        course.secondaryInstructor1Id === instructorId
    );
  };

  const createMutation = useMutation({
    mutationFn: async (data: InsertInstructor) => {
      await apiRequest("POST", "/api/instructors", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructors"] });
      toast({ title: "Insegnante creato con successo" });
      setIsFormOpen(false);
      setEditingInstructor(null);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertInstructor }) => {
      await apiRequest("PATCH", `/api/instructors/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructors"] });
      toast({ title: "Insegnante aggiornato con successo" });
      setIsFormOpen(false);
      setEditingInstructor(null);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/instructors/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructors"] });
      toast({ title: "Insegnante eliminato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: InsertInstructor = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string || null,
      phone: formData.get("phone") as string || null,
      specialization: formData.get("specialization") as string || null,
      bio: formData.get("bio") as string || null,
      hourlyRate: formData.get("hourlyRate") ? formData.get("hourlyRate") as string : null,
      active: true,
    };

    if (editingInstructor) {
      updateMutation.mutate({ id: editingInstructor.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredInstructorsRaw = useMemo(() => {
    return instructors?.filter((instructor) => {
      const matchesSearch = `${instructor.lastName} ${instructor.firstName} ${instructor.specialization}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : (statusFilter === "active" ? instructor.active : !instructor.active);
      return matchesSearch && matchesStatus;
    }) || [];
  }, [instructors, searchQuery, statusFilter]);

  const { sortConfig, handleSort, sortItems, isSortedColumn } = useSortableTable<typeof filteredInstructorsRaw[0]>("lastName");

  const getSortValue = (instructor: typeof filteredInstructorsRaw[0], key: string) => {
    switch (key) {
      case "lastName": return instructor.lastName;
      case "firstName": return instructor.firstName;
      case "specialization": return instructor.specialization;
      case "courses": return getInstructorCourses(instructor.id).length;
      case "email": return instructor.email;
      case "phone": return instructor.phone;
      case "hourlyRate": return Number(instructor.hourlyRate) || 0;
      case "status": return instructor.active;
      default: return null;
    }
  };

  const filteredInstructors = sortItems(filteredInstructorsRaw, getSortValue);

  return (
    <div className="p-6 md:p-8 space-y-6 w-full mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Gestione Staff / Insegnanti</h1>
          <p className="text-muted-foreground">Gestisci lo staff di insegnanti e le loro tariffe</p>
        </div>
        <Button
          onClick={() => {
            setLocation("/?type=INSEGNANTE");
          }}
          data-testid="button-add-instructor"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Insegnante
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cerca Staff / Insegnante..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-instructors"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="statusFilter" className="shrink-0 text-sm">Stato:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="statusFilter" className="w-[150px]">
                  <SelectValue placeholder="Tutti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="active">Attivo</SelectItem>
                  <SelectItem value="inactive">Inattivo</SelectItem>
                </SelectContent>
              </Select>
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
          ) : filteredInstructors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nessun insegnante trovato</p>
              <p className="text-sm">Inizia aggiungendo il primo insegnante</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead sortKey="lastName" currentSort={sortConfig} onSort={handleSort}>Cognome</SortableTableHead>
                  <SortableTableHead sortKey="firstName" currentSort={sortConfig} onSort={handleSort}>Nome</SortableTableHead>
                  <SortableTableHead sortKey="specialization" currentSort={sortConfig} onSort={handleSort}>Specializzazione</SortableTableHead>
                  <SortableTableHead sortKey="courses" currentSort={sortConfig} onSort={handleSort}>Corsi Assegnati</SortableTableHead>
                  <SortableTableHead sortKey="email" currentSort={sortConfig} onSort={handleSort}>Email</SortableTableHead>
                  <SortableTableHead sortKey="phone" currentSort={sortConfig} onSort={handleSort}>Telefono</SortableTableHead>
                  <SortableTableHead sortKey="hourlyRate" currentSort={sortConfig} onSort={handleSort}>Tariffa Oraria</SortableTableHead>
                  <SortableTableHead sortKey="status" currentSort={sortConfig} onSort={handleSort}>Stato</SortableTableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstructors.map((instructor) => {
                  const assignedCourses = getInstructorCourses(instructor.id);
                  return (
                    <TableRow key={instructor.id} data-testid={`instructor-row-${instructor.id}`}>
                      <TableCell className={cn("font-medium", isSortedColumn("lastName") && "sorted-column-cell")}>
                        {instructor.lastName}
                      </TableCell>
                      <TableCell className={cn("font-medium", isSortedColumn("firstName") && "sorted-column-cell")}>
                        {instructor.firstName}
                      </TableCell>
                      <TableCell className={cn(isSortedColumn("specialization") && "sorted-column-cell")}>
                        {instructor.specialization || "-"}
                      </TableCell>
                      <TableCell className={cn(isSortedColumn("courses") && "sorted-column-cell")}>
                        <div className="flex flex-wrap gap-1">
                          {assignedCourses.length === 0 ? (
                            <span className="text-sm text-muted-foreground">Nessun corso</span>
                          ) : assignedCourses.length <= 2 ? (
                            assignedCourses.map((course) => (
                              <Link key={course.id} href={`/corsi?courseId=${course.id}`}>
                                <Badge variant="outline" className="text-xs cursor-pointer hover-elevate" data-testid={`badge-course-${course.id}`}>
                                  {course.name}
                                </Badge>
                              </Link>
                            ))
                          ) : (
                            <>
                              {assignedCourses.slice(0, 2).map((course) => (
                                <Link key={course.id} href={`/corsi?courseId=${course.id}`}>
                                  <Badge variant="outline" className="text-xs cursor-pointer hover-elevate" data-testid={`badge-course-${course.id}`}>
                                    {course.name}
                                  </Badge>
                                </Link>
                              ))}
                              <Badge variant="secondary" className="text-xs">
                                +{assignedCourses.length - 2} altri
                              </Badge>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={cn(isSortedColumn("email") && "sorted-column-cell")}>
                        {instructor.email ? (instructor.email) : (
                          <div className="flex items-center gap-1 text-red-500 font-bold text-xs" title="Manca Dato">
                            <AlertTriangle className="w-3 h-3 fill-red-500 text-white" />
                            <span>Manca Dato</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className={cn(isSortedColumn("phone") && "sorted-column-cell")}>
                        {instructor.mobile || instructor.phone ? (instructor.mobile || instructor.phone) : (
                          <div className="flex items-center gap-1 text-red-500 font-bold text-xs" title="Manca Dato">
                            <AlertTriangle className="w-3 h-3 fill-red-500 text-white" />
                            <span>Manca Dato</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className={cn(isSortedColumn("hourlyRate") && "sorted-column-cell")}>
                        {instructor.hourlyRate ? `€${instructor.hourlyRate}/h` : "-"}
                      </TableCell>
                      <TableCell className={cn(isSortedColumn("status") && "sorted-column-cell")}>
                        <Badge variant={instructor.active ? "default" : "secondary"}>
                          {instructor.active ? "Attivo" : "Inattivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setLocation(`/?memberId=${instructor.id}`);
                            }}
                            data-testid={`button-edit-instructor-${instructor.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Sei sicuro di voler eliminare questo insegnante?")) {
                                deleteMutation.mutate(instructor.id);
                              }
                            }}
                            data-testid={`button-delete-instructor-${instructor.id}`}
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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInstructor ? "Modifica Insegnante" : "Nuovo Insegnante"}</DialogTitle>
            <DialogDescription>
              Inserisci i dati dell'insegnante
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  defaultValue={editingInstructor?.firstName}
                  required
                  data-testid="input-firstName"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Cognome *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  defaultValue={editingInstructor?.lastName}
                  required
                  data-testid="input-lastName"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={editingInstructor?.email || ""}
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={editingInstructor?.phone || ""}
                  data-testid="input-phone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization">Specializzazione</Label>
              <Input
                id="specialization"
                name="specialization"
                defaultValue={editingInstructor?.specialization || ""}
                placeholder="Es: Yoga, Pilates, Fitness"
                data-testid="input-specialization"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Tariffa Oraria (€)</Label>
              <Input
                id="hourlyRate"
                name="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                defaultValue={editingInstructor?.hourlyRate || ""}
                data-testid="input-hourlyRate"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Biografia</Label>
              <Textarea
                id="bio"
                name="bio"
                defaultValue={editingInstructor?.bio || ""}
                rows={4}
                data-testid="input-bio"
              />
            </div>

            {editingInstructor && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Briefcase className="w-4 h-4 text-primary" />
                  Corsi già assegnati ({getInstructorCourses(editingInstructor.id).length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {getInstructorCourses(editingInstructor.id).length > 0 ? (
                    getInstructorCourses(editingInstructor.id).map(course => (
                      <div key={course.id} className="flex flex-col p-3 rounded-lg border bg-muted/30 text-xs">
                        <span className="font-bold text-foreground mb-1">{course.name}</span>
                        <div className="text-muted-foreground space-y-0.5">
                          <p>
                            {course.dayOfWeek ? (DAY_MAP[course.dayOfWeek] || course.dayOfWeek) : "N/D"} • {course.startTime} - {course.endTime}
                          </p>
                          <p className="opacity-70">
                            {course.instructorId === editingInstructor.id && "[Primario]"}
                            {course.secondaryInstructor1Id === editingInstructor.id && "[Secondario 1]"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic col-span-2">Nessun corso assegnato a questo insegnante.</p>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                data-testid="button-cancel"
              >
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-instructor"
              >
                {editingInstructor ? "Salva Modifiche" : "Crea Insegnante"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
