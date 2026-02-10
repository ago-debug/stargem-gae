import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, Briefcase, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Instructor, InsertInstructor, Course } from "@shared/schema";

export default function Instructors() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const { sortConfig, handleSort, sortItems } = useSortableTable<Instructor>();

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
        course.secondaryInstructor1Id === instructorId ||
        course.secondaryInstructor2Id === instructorId
    );
  };

  const createMutation = useMutation({
    mutationFn: async (data: InsertInstructor) => {
      await apiRequest("POST", "/api/instructors", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructors"] });
      toast({ title: "Staff/insegnante creato con successo" });
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
      toast({ title: "Staff/insegnante aggiornato con successo" });
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
      toast({ title: "Staff/insegnante eliminato con successo" });
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

  const getSortValue = (instructor: Instructor, key: string): any => {
    switch (key) {
      case "name": return `${instructor.firstName} ${instructor.lastName}`;
      case "specialization": return instructor.specialization;
      case "courses": return null;
      case "email": return instructor.email;
      case "phone": return instructor.phone;
      case "rate": return instructor.hourlyRate ? parseFloat(instructor.hourlyRate) : null;
      case "status": return instructor.active;
      default: return null;
    }
  };

  const filteredInstructors = instructors?.filter((instructor) =>
    `${instructor.firstName} ${instructor.lastName} ${instructor.specialization}`.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const sortedInstructors = sortItems(filteredInstructors, getSortValue);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="icon-gold-bg rounded-md h-8 w-8 flex-shrink-0" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 text-white" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Gestione Staff/Insegnanti</h1>
            <p className="text-muted-foreground text-sm">Gestisci il team di staff/insegnanti e le loro tariffe</p>
          </div>
        </div>
        <Button 
          onClick={() => {
            setEditingInstructor(null);
            setIsFormOpen(true);
          }}
          data-testid="button-add-instructor"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Staff/Insegnante
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cerca staff/insegnante..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-instructors"
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
          ) : filteredInstructors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nessun staff/insegnante trovato</p>
              <p className="text-sm">Inizia aggiungendo il primo staff/insegnante</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead sortKey="name" currentSort={sortConfig} onSort={handleSort}>Nome</SortableTableHead>
                  <SortableTableHead sortKey="specialization" currentSort={sortConfig} onSort={handleSort}>Specializzazione</SortableTableHead>
                  <SortableTableHead sortKey="courses" currentSort={sortConfig} onSort={handleSort}>Corsi Assegnati</SortableTableHead>
                  <SortableTableHead sortKey="email" currentSort={sortConfig} onSort={handleSort}>Email</SortableTableHead>
                  <SortableTableHead sortKey="phone" currentSort={sortConfig} onSort={handleSort}>Telefono</SortableTableHead>
                  <SortableTableHead sortKey="rate" currentSort={sortConfig} onSort={handleSort}>Tariffa Oraria</SortableTableHead>
                  <SortableTableHead sortKey="status" currentSort={sortConfig} onSort={handleSort}>Stato</SortableTableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedInstructors.map((instructor) => {
                  const assignedCourses = getInstructorCourses(instructor.id);
                  return (
                  <TableRow key={instructor.id} data-testid={`instructor-row-${instructor.id}`}>
                    <TableCell className="font-medium">
                      {instructor.firstName} {instructor.lastName}
                    </TableCell>
                    <TableCell>{instructor.specialization || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {assignedCourses.length === 0 ? (
                          <span className="text-sm text-muted-foreground">Nessun corso</span>
                        ) : assignedCourses.length <= 2 ? (
                          assignedCourses.map((course) => (
                            <Link key={course.id} href="/courses">
                              <Badge variant="outline" className="text-xs cursor-pointer hover-elevate" data-testid={`badge-course-${course.id}`}>
                                {course.name}
                              </Badge>
                            </Link>
                          ))
                        ) : (
                          <>
                            {assignedCourses.slice(0, 2).map((course) => (
                              <Link key={course.id} href="/courses">
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
                    <TableCell>{instructor.email || "-"}</TableCell>
                    <TableCell>{instructor.phone || "-"}</TableCell>
                    <TableCell>
                      {instructor.hourlyRate ? `€${instructor.hourlyRate}/h` : "-"}
                    </TableCell>
                    <TableCell>
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
                            setEditingInstructor(instructor);
                            setIsFormOpen(true);
                          }}
                          data-testid={`button-edit-instructor-${instructor.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Sei sicuro di voler eliminare questo staff/insegnante?")) {
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
            <DialogTitle>{editingInstructor ? "Modifica Staff/Insegnante" : "Nuovo Staff/Insegnante"}</DialogTitle>
            <DialogDescription>
              Inserisci i dati dello staff/insegnante
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
                {editingInstructor ? "Salva Modifiche" : "Crea Staff/Insegnante"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
