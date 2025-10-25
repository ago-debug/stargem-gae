import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Instructor, InsertInstructor } from "@shared/schema";

export default function Instructors() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);

  const { data: instructors, isLoading } = useQuery<Instructor[]>({
    queryKey: ["/api/instructors"],
  });

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

  const filteredInstructors = instructors?.filter((instructor) =>
    `${instructor.firstName} ${instructor.lastName} ${instructor.specialization}`.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Gestione Insegnanti</h1>
          <p className="text-muted-foreground">Gestisci il team di insegnanti e le loro tariffe</p>
        </div>
        <Button 
          onClick={() => {
            setEditingInstructor(null);
            setIsFormOpen(true);
          }}
          data-testid="button-add-instructor"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Insegnante
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cerca insegnante..."
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
              <p className="text-lg font-medium mb-2">Nessun insegnante trovato</p>
              <p className="text-sm">Inizia aggiungendo il primo insegnante</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Specializzazione</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Tariffa Oraria</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstructors.map((instructor) => (
                  <TableRow key={instructor.id} data-testid={`instructor-row-${instructor.id}`}>
                    <TableCell className="font-medium">
                      {instructor.firstName} {instructor.lastName}
                    </TableCell>
                    <TableCell>{instructor.specialization || "-"}</TableCell>
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
                ))}
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
