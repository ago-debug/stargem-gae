import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GripVertical, Edit, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryManagerDialog({ open, onOpenChange }: CategoryManagerDialogProps) {
  const { toast } = useToast();
  const [newValue, setNewValue] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const { data: items } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      if (items?.some((i: any) => i.name.toLowerCase() === name.toLowerCase())) {
        throw new Error("Questa categoria esiste già.");
      }
      const maxOrder = items?.reduce((max, s) => Math.max(max, s.sortOrder || 0), 0) || 0;
      await apiRequest("POST", `/api/categories`, { name, description: "", active: true, sortOrder: maxOrder + 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setNewValue("");
      toast({ title: "Categoria creata con successo" });
    },
    onError: (error: Error) => toast({ title: "Errore", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      if (items?.some((i: any) => i.id !== id && i.name.toLowerCase() === name.toLowerCase())) {
        throw new Error("Questa categoria esiste già.");
      }
      await apiRequest("PATCH", `/api/categories/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditingId(null);
      setEditingValue("");
      toast({ title: "Categoria aggiornata con successo" });
    },
    onError: (error: Error) => toast({ title: "Errore", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Categoria eliminata con successo" });
    },
    onError: (error: Error) => toast({ title: "Errore", description: error.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gestione Categorie</DialogTitle>
          <DialogDescription>Aggiungi, modifica o elimina le Categorie</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Nuova categoria..."
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newValue.trim()) {
                  e.preventDefault();
                  createMutation.mutate(newValue.trim());
                }
              }}
              className="flex-1"
            />
            <Button
              type="button"
              size="icon"
              className="gold-3d-button flex-shrink-0"
              onClick={() => {
                if (newValue.trim()) createMutation.mutate(newValue.trim());
              }}
              disabled={createMutation.isPending}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-1 max-h-60 overflow-y-auto">
            {items?.map((item) => (
              <div key={item.id} className="flex items-center gap-2 py-1 px-2 rounded hover-elevate group">
                <GripVertical className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                {editingId === item.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      className="h-8 text-sm flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && editingValue.trim()) {
                          e.preventDefault();
                          updateMutation.mutate({ id: item.id, name: editingValue.trim() });
                        }
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="icon"
                      className="gold-3d-button h-8 w-8 flex-shrink-0"
                      onClick={() => {
                        if (editingValue.trim()) updateMutation.mutate({ id: item.id, name: editingValue.trim() });
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1">{item.name}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditingValue(item.name);
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                      onClick={() => {
                        if (confirm("Eliminare questa categoria?")) deleteMutation.mutate(item.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            ))}
            {(!items || items.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">Nessuna categoria definita</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Chiudi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
