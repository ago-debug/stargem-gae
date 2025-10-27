import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Course, InsertCourse, Category, Instructor, Studio } from "@shared/schema";

export default function Courses() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
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

  const createMutation = useMutation({
    mutationFn: async (data: InsertCourse) => {
      await apiRequest("POST", "/api/courses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Corso creato con successo" });
      setIsFormOpen(false);
      setEditingCourse(null);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertCourse }) => {
      await apiRequest("PATCH", `/api/courses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Corso aggiornato con successo" });
      setIsFormOpen(false);
      setEditingCourse(null);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
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
      dayOfWeek: formData.get("dayOfWeek") as string || null,
      startTime: formData.get("startTime") as string || null,
      endTime: formData.get("endTime") as string || null,
      recurrenceType: formData.get("recurrenceType") as string || null,
      schedule: formData.get("schedule") as string || null,
      startDate: formData.get("startDate") as string || null,
      endDate: formData.get("endDate") as string || null,
      active: true,
    };

    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredCourses = courses?.filter((course) =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Gestione Corsi</h1>
          <p className="text-muted-foreground">Organizza e gestisci i corsi disponibili</p>
        </div>
        <Button 
          onClick={() => {
            setEditingCourse(null);
            setIsFormOpen(true);
          }}
          data-testid="button-add-course"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Corso
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cerca corso..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-courses"
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
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium mb-2">Nessun corso trovato</p>
              <p className="text-sm">Inizia aggiungendo il primo corso</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Corso</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Insegnante</TableHead>
                  <TableHead>Prezzo</TableHead>
                  <TableHead>Posti</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id} data-testid={`course-row-${course.id}`}>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell>
                      {categories?.find(c => c.id === course.categoryId)?.name || "-"}
                    </TableCell>
                    <TableCell>
                      {instructors?.find(i => i.id === course.instructorId) 
                        ? `${instructors.find(i => i.id === course.instructorId)?.firstName} ${instructors.find(i => i.id === course.instructorId)?.lastName}`
                        : "-"}
                    </TableCell>
                    <TableCell>€{course.price || "0.00"}</TableCell>
                    <TableCell>{course.currentEnrollment}/{course.maxCapacity || "∞"}</TableCell>
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
                          onClick={() => {
                            setEditingCourse(course);
                            setIsFormOpen(true);
                          }}
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Modifica Corso" : "Nuovo Corso"}</DialogTitle>
            <DialogDescription>
              Inserisci i dettagli del corso
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Corso *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingCourse?.name}
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
                defaultValue={editingCourse?.description || ""}
                rows={3}
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
                <Select name="studioId" defaultValue={editingCourse?.studioId?.toString()}>
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
                  <Select name="instructorId" defaultValue={editingCourse?.instructorId?.toString()}>
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
                  <Select name="secondaryInstructor1Id" defaultValue={editingCourse?.secondaryInstructor1Id?.toString()}>
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
                  <Select name="secondaryInstructor2Id" defaultValue={editingCourse?.secondaryInstructor2Id?.toString()}>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Prezzo (€)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editingCourse?.price || ""}
                  data-testid="input-price"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxCapacity">Posti Disponibili</Label>
                <Input
                  id="maxCapacity"
                  name="maxCapacity"
                  type="number"
                  min="1"
                  defaultValue={editingCourse?.maxCapacity || ""}
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
                  defaultValue={editingCourse?.startDate || ""}
                  data-testid="input-startDate"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Data Fine</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={editingCourse?.endDate || ""}
                  data-testid="input-endDate"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule">Orario/Calendario</Label>
              <Textarea
                id="schedule"
                name="schedule"
                defaultValue={editingCourse?.schedule || ""}
                placeholder="Es: Lunedì e Mercoledì 18:00-19:30"
                rows={2}
                data-testid="input-schedule"
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
                data-testid="button-submit-course"
              >
                {editingCourse ? "Salva Modifiche" : "Crea Corso"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
