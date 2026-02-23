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
import { Plus, Edit, Trash2, Wallet } from "lucide-react";
import type { PaymentMethod, InsertPaymentMethod } from "@shared/schema";

export default function PaymentMethods() {
    const { toast } = useToast();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

    const { data: methods, isLoading } = useQuery<PaymentMethod[]>({
        queryKey: ["/api/payment-methods"],
    });

    const createMutation = useMutation({
        mutationFn: async (data: InsertPaymentMethod) => {
            await apiRequest("POST", "/api/payment-methods", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
            toast({ title: "Metodo di pagamento creato con successo" });
            setIsFormOpen(false);
            setEditingMethod(null);
        },
        onError: (error: Error) => {
            toast({ title: "Errore", description: error.message, variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: InsertPaymentMethod }) => {
            await apiRequest("PATCH", `/api/payment-methods/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
            toast({ title: "Metodo di pagamento aggiornato con successo" });
            setIsFormOpen(false);
            setEditingMethod(null);
        },
        onError: (error: Error) => {
            toast({ title: "Errore", description: error.message, variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/payment-methods/${id}`, undefined);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
            toast({ title: "Metodo di pagamento eliminato con successo" });
        },
        onError: (error: Error) => {
            toast({ title: "Errore", description: error.message, variant: "destructive" });
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data: InsertPaymentMethod = {
            name: formData.get("name") as string,
            description: formData.get("description") as string || null,
            active: true,
        };

        if (editingMethod) {
            updateMutation.mutate({ id: editingMethod.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-semibold text-foreground mb-2">Metodi di Pagamento</h1>
                    <p className="text-muted-foreground">Gestisci i metodi di pagamento disponibili nel sistema</p>
                </div>
                <Button
                    onClick={() => {
                        setEditingMethod(null);
                        setIsFormOpen(true);
                    }}
                    data-testid="button-add-payment-method"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuovo Metodo
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-muted-foreground" />
                        <h2 className="text-lg font-medium">Lista Metodi di Pagamento</h2>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-center py-8 text-muted-foreground">Caricamento...</p>
                    ) : !methods || methods.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p className="text-lg font-medium mb-2">Nessun metodo trovato</p>
                            <p className="text-sm">Inizia aggiungendo il primo metodo di pagamento (es. Contanti, Bonifico, POS)</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {methods.map((method) => (
                                <div key={method.id} className="flex items-center justify-between p-4 rounded-md hover-elevate active-elevate-2 border border-border bg-card">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <p className="font-medium truncate">{method.name}</p>
                                        {method.description && (
                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{method.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setEditingMethod(method);
                                                setIsFormOpen(true);
                                            }}
                                            data-testid={`button-edit-payment-method-${method.id}`}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                if (confirm("Sei sicuro di voler eliminare questo metodo di pagamento?")) {
                                                    deleteMutation.mutate(method.id);
                                                }
                                            }}
                                            data-testid={`button-delete-payment-method-${method.id}`}
                                        >
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingMethod ? "Modifica Metodo" : "Nuovo Metodo"}</DialogTitle>
                        <DialogDescription>
                            Inserisci il nome e una descrizione opzionale per il metodo di pagamento
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome *</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={editingMethod?.name}
                                required
                                placeholder="es: Contanti, Bonifico, POS, Assegno"
                                data-testid="input-name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrizione (opzionale)</Label>
                            <Textarea
                                id="description"
                                name="description"
                                defaultValue={editingMethod?.description || ""}
                                rows={3}
                                placeholder="Dettagli aggiuntivi..."
                                data-testid="input-description"
                            />
                        </div>

                        <DialogFooter>
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
                                data-testid="button-submit-payment-method"
                            >
                                {editingMethod ? "Salva Modifiche" : "Crea Metodo"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
