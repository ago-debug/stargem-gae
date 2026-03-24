import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GripVertical, Edit, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCustomList } from "@/hooks/use-custom-list";

interface CustomListManagerDialogProps {
  listType: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomListManagerDialog({ listType, title, open, onOpenChange }: CustomListManagerDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newValue, setNewValue] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const { data: listData } = useCustomList(listType);

  const listId = listData?.id;
  const items = (listData?.items || []).filter((i: any) => i.active !== false).sort((a: any, b: any) => String(a.value).localeCompare(String(b.value), undefined, { numeric: true }));

  const createMutation = useMutation({
    mutationFn: async (value: string) => {
      if (items?.some((i: any) => i.value.toLowerCase() === value.toLowerCase())) {
        throw new Error("Questa voce esiste già nel dizionario.");
      }
      if (!listId) throw new Error("Sorgente dizionario non accessibile (ListId)");
      const maxOrder = items?.reduce((max: number, s: any) => Math.max(max, s.sortOrder || 0), 0) || 0;
      await apiRequest("POST", `/api/custom-lists/${listId}/items`, { value, sortOrder: maxOrder + 1, active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/custom-lists/${listType}`] });
      setNewValue("");
      toast({ title: "Voce creata con successo" });
    },
    onError: (error: Error) => toast({ title: "Errore", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, value }: { id: number; value: string }) => {
      if (items?.some((i: any) => i.id !== id && i.value.toLowerCase() === value.toLowerCase())) {
        throw new Error("Questa voce esiste già nel dizionario.");
      }
      if (!listId) throw new Error("Sorgente dizionario non accessibile");
      await apiRequest("PATCH", `/api/custom-lists/${listId}/items/${id}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/custom-lists/${listType}`] });
      setEditingId(null);
      setEditingValue("");
      toast({ title: "Voce aggiornata con successo" });
    },
    onError: (error: Error) => toast({ title: "Errore", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!listId) throw new Error("Sorgente dizionario non accessibile");
      await apiRequest("DELETE", `/api/custom-lists/${listId}/items/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/custom-lists/${listType}`] });
      toast({ title: "Voce eliminata con successo" });
    },
    onError: (error: Error) => toast({ title: "Errore", description: error.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Aggiungi, modifica o elimina le voci disponibili</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Nuova voce..."
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
            {items?.map((item: any) => (
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
                          updateMutation.mutate({ id: item.id, value: editingValue.trim() });
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
                        if (editingValue.trim()) updateMutation.mutate({ id: item.id, value: editingValue.trim() });
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1">{item.value}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditingValue(item.value);
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
                        if (confirm("Eliminare questa voce?")) deleteMutation.mutate(item.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            ))}
            {(!items || items.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">Nessuna voce definita</p>
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
