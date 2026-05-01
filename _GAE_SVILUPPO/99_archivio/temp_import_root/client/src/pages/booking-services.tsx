import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Sparkles } from "lucide-react";
import type { BookingService, InsertBookingService } from "@shared/schema";

export default function BookingServices() {
    const { toast } = useToast();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingService, setEditingService] = useState<BookingService | null>(null);

    const { data: services, isLoading } = useQuery<BookingService[]>({
        queryKey: ["/api/booking-services"],
    });

    const createMutation = useMutation({
        mutationFn: async (data: InsertBookingService) => {
            await apiRequest("POST", "/api/booking-services", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/booking-services"] });
            toast({ title: "Servizio creato con successo" });
            setIsFormOpen(false);
            setEditingService(null);
        },
        onError: (error: Error) => {
            toast({ title: "Errore", description: error.message, variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: InsertBookingService }) => {
            await apiRequest("PATCH", `/api/booking-services/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/booking-services"] });
            toast({ title: "Servizio aggiornato con successo" });
            setIsFormOpen(false);
            setEditingService(null);
        },
        onError: (error: Error) => {
            toast({ title: "Errore", description: error.message, variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/booking-services/${id}`, undefined);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/booking-services"] });
            toast({ title: "Servizio eliminato con successo" });
        },
        onError: (error: Error) => {
            toast({ title: "Errore", description: error.message, variant: "destructive" });
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data: InsertBookingService = {
            name: formData.get("name") as string,
            description: formData.get("description") as string || null,
            price: formData.get("price") ? (formData.get("price") as string) : null,
            color: formData.get("color") as string || null,
            active: true,
        };

        if (editingService) {
            updateMutation.mutate({ id: editingService.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-semibold text-foreground mb-2">Servizi Prenotabili</h1>
                    <p className="text-muted-foreground">Configura i servizi per le prenotazioni delle sale</p>
                </div>
                <Button
                    onClick={() => {
                        setEditingService(null);
                        setIsFormOpen(true);
                    }}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuovo Servizio
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-muted-foreground" />
                        <h2 className="text-lg font-medium">Lista Servizi</h2>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-center py-8 text-muted-foreground">Caricamento...</p>
                    ) : !services || services.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p className="text-lg font-medium mb-2">Nessun servizio trovato</p>
                            <p className="text-sm">Inizia aggiungendo il primo servizio (es. Affitto Sala, Lezione Privata)</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {services.map((service) => (
                                <div key={service.id} className="p-4 rounded-lg border border-border bg-card flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: service.color || "#3b82f6" }}
                                            />
                                            <h3 className="font-bold text-lg">{service.name}</h3>
                                        </div>
                                        {service.description && (
                                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{service.description}</p>
                                        )}
                                        {service.price && (
                                            <p className="text-sm font-semibold mb-2">Prezzo: €{service.price}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-end gap-2 mt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setEditingService(service);
                                                setIsFormOpen(true);
                                            }}
                                        >
                                            <Edit className="w-4 h-4 mr-1" />
                                            Modifica
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-destructive hover:bg-destructive/10"
                                            onClick={() => {
                                                if (confirm("Sei sicuro di voler eliminare questo servizio?")) {
                                                    deleteMutation.mutate(service.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            Elimina
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingService ? "Modifica Servizio" : "Nuovo Servizio"}</DialogTitle>
                        <DialogDescription>
                            Inserisci i dettagli del servizio prenotabile
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Servizio *</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={editingService?.name}
                                required
                                placeholder="es. Affitto Sala Oro"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrizione</Label>
                            <Textarea
                                id="description"
                                name="description"
                                defaultValue={editingService?.description || ""}
                                rows={3}
                                placeholder="Dettagli servizio..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="price">Prezzo (€)</Label>
                            <Input
                                id="price"
                                name="price"
                                type="number"
                                step="0.01"
                                defaultValue={editingService?.price || ""}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="color">Colore Etichetta</Label>
                            <Input
                                id="color"
                                name="color"
                                type="color"
                                defaultValue={editingService?.color || "#3b82f6"}
                            />
                        </div>

                        <DialogFooter className="mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsFormOpen(false)}
                            >
                                Annulla
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                            >
                                {editingService ? "Salva Modifiche" : "Crea Servizio"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
