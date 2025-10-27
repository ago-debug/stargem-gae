import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStudioSchema, type InsertStudio, type Studio } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Studios() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStudio, setEditingStudio] = useState<Studio | null>(null);
  const { toast } = useToast();

  const { data: studios = [], isLoading } = useQuery<Studio[]>({
    queryKey: ["/api/studios"],
  });

  const form = useForm<InsertStudio>({
    resolver: zodResolver(insertStudioSchema),
    defaultValues: {
      name: "",
      floor: "",
      operatingHours: "",
      operatingDays: "",
      capacity: undefined,
      equipment: "",
      notes: "",
      active: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertStudio) => apiRequest("/api/studios", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/studios"] });
      toast({ title: "Studio creato con successo" });
      setIsCreateOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Errore nella creazione dello studio", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertStudio> }) =>
      apiRequest(`/api/studios/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/studios"] });
      toast({ title: "Studio aggiornato con successo" });
      setEditingStudio(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Errore nell'aggiornamento dello studio", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/studios/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/studios"] });
      toast({ title: "Studio eliminato con successo" });
    },
    onError: () => {
      toast({ title: "Errore nell'eliminazione dello studio", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertStudio) => {
    if (editingStudio) {
      updateMutation.mutate({ id: editingStudio.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (studio: Studio) => {
    setEditingStudio(studio);
    form.reset({
      name: studio.name,
      floor: studio.floor || "",
      operatingHours: studio.operatingHours || "",
      operatingDays: studio.operatingDays || "",
      capacity: studio.capacity || undefined,
      equipment: studio.equipment || "",
      notes: studio.notes || "",
      active: studio.active,
    });
  };

  const closeDialog = () => {
    setIsCreateOpen(false);
    setEditingStudio(null);
    form.reset();
  };

  const parseOperatingDays = (daysStr: string | null): string[] => {
    if (!daysStr) return [];
    try {
      return JSON.parse(daysStr);
    } catch {
      return daysStr.split(",").map(d => d.trim()).filter(Boolean);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Studios/Sale</h1>
          <p className="text-muted-foreground">
            Gestisci le sale e gli studi per i corsi
          </p>
        </div>
        <Dialog open={isCreateOpen || !!editingStudio} onOpenChange={(open) => {
          if (!open) closeDialog();
          else setIsCreateOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-studio">
              <Plus className="mr-2 h-4 w-4" />
              Nuovo Studio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStudio ? "Modifica Studio" : "Nuovo Studio"}</DialogTitle>
              <DialogDescription>
                {editingStudio ? "Modifica i dati dello studio" : "Inserisci i dati del nuovo studio"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome*</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-studio-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="floor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Piano</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} data-testid="input-studio-floor" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capienza</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-studio-capacity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="operatingDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Giorni Operativi</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder='es: ["LUN","MAR","MER"]'
                            data-testid="input-studio-operating-days"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="operatingHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orari Operativi</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          placeholder='es: {"monday":{"start":"09:00","end":"21:00"}}'
                          data-testid="textarea-studio-operating-hours"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="equipment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attrezzature</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Descrivi le attrezzature disponibili"
                          data-testid="textarea-studio-equipment"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          data-testid="textarea-studio-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
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
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit"
                  >
                    {editingStudio ? "Aggiorna" : "Crea"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Elenco Studios
          </CardTitle>
          <CardDescription>
            {studios.length} {studios.length === 1 ? "studio" : "studi"} disponibili
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
          ) : studios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessuno studio trovato. Crea il primo studio!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Piano</TableHead>
                  <TableHead>Capienza</TableHead>
                  <TableHead>Giorni Operativi</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studios.map((studio) => (
                  <TableRow key={studio.id} data-testid={`row-studio-${studio.id}`}>
                    <TableCell className="font-medium">{studio.name}</TableCell>
                    <TableCell>{studio.floor || "-"}</TableCell>
                    <TableCell>{studio.capacity || "-"}</TableCell>
                    <TableCell>
                      {parseOperatingDays(studio.operatingDays).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {parseOperatingDays(studio.operatingDays).map((day, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {day}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={studio.active ? "default" : "secondary"}>
                        {studio.active ? "Attivo" : "Inattivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(studio)}
                          data-testid={`button-edit-studio-${studio.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(studio.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-studio-${studio.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
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
    </div>
  );
}
