import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GripVertical, Edit, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CategoryListManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryListManagerDialog({ open, onOpenChange }: CategoryListManagerDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newValue, setNewValue] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingColor, setEditingColor] = useState("");

  const { data: categories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      // Validate duplicates
      if (categories?.some(c => c.name.toLowerCase() === data.name.toLowerCase())) {
        throw new Error("Questa categoria esiste già.");
      }
      await apiRequest("POST", `/api/categories`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/categories`] });
      setNewValue("");
      setNewColor("#3b82f6");
      toast({ title: "Categoria creata" });
    },
    onError: (error: Error) => toast({ title: "Errore", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; color: string } }) => {
      if (categories?.some(c => c.id !== id && c.name.toLowerCase() === data.name.toLowerCase())) {
        throw new Error("Questa categoria esiste già.");
      }
      await apiRequest("PATCH", `/api/categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/categories`] });
      setEditingId(null);
      setEditingValue("");
      setEditingColor("");
      toast({ title: "Categoria aggiornata" });
    },
    onError: (error: Error) => toast({ title: "Errore", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/categories`] });
      toast({ title: "Categoria eliminata" });
    },
    onError: (error: Error) => toast({ title: "Errore", description: error.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gestione Categorie Reali</DialogTitle>
          <DialogDescription>Aggiungi, modifica colori o elimina categorie (si rifletterà sui form e calendario)</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-10 h-10 p-1 flex-shrink-0 cursor-pointer"
              title="Colore categoria"
            />
            <Input
              placeholder="Nuova categoria..."
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newValue.trim()) {
                  e.preventDefault();
                  createMutation.mutate({ name: newValue.trim(), color: newColor });
                }
              }}
              className="flex-1"
            />
            <Button
              type="button"
              size="icon"
              className="gold-3d-button flex-shrink-0"
              onClick={() => {
                if (newValue.trim()) createMutation.mutate({ name: newValue.trim(), color: newColor });
              }}
              disabled={createMutation.isPending}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-1 max-h-60 overflow-y-auto">
            {categories?.map((item: any) => (
              <div key={item.id} className="flex items-center gap-2 py-1 px-2 rounded hover-elevate group">
                {editingId === item.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="color"
                      value={editingColor}
                      onChange={(e) => setEditingColor(e.target.value)}
                      className="w-8 h-8 p-0 flex-shrink-0 cursor-pointer"
                    />
                    <Input
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      className="h-8 text-sm flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && editingValue.trim()) {
                          e.preventDefault();
                          updateMutation.mutate({ id: item.id, data: { name: editingValue.trim(), color: editingColor } });
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
                        if (editingValue.trim()) updateMutation.mutate({ id: item.id, data: { name: editingValue.trim(), color: editingColor } });
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div 
                        className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm" 
                        style={{ backgroundColor: item.color || '#cccccc' }} 
                        title={`Colore: ${item.color || '#cccccc'}`}
                    />
                    <span className="flex-1 font-semibold text-sm">{item.name}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditingValue(item.name);
                        setEditingColor(item.color || "#cccccc");
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
                        if (confirm("Attenzione: eliminando questa categoria sparirà anche dai corsi collegati. Continuare?")) deleteMutation.mutate(item.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            ))}
            {(!categories || categories.length === 0) && (
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
