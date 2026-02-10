import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Edit, Plus, Trash2, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ActivityStatus } from "@shared/schema";

interface MultiSelectStatusProps {
  selectedStatuses: string[];
  onChange: (statuses: string[]) => void;
  testIdPrefix?: string;
}

export function MultiSelectStatus({ selectedStatuses, onChange, testIdPrefix = "status" }: MultiSelectStatusProps) {
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newStatusName, setNewStatusName] = useState("");
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [editingStatusName, setEditingStatusName] = useState("");

  const { data: statuses } = useQuery<ActivityStatus[]>({
    queryKey: ["/api/activity-statuses"],
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const maxOrder = statuses?.reduce((max, s) => Math.max(max, s.sortOrder || 0), 0) || 0;
      await apiRequest("POST", "/api/activity-statuses", { name, sortOrder: maxOrder + 1, active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-statuses"] });
      setNewStatusName("");
      toast({ title: "Stato creato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      await apiRequest("PATCH", `/api/activity-statuses/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-statuses"] });
      setEditingStatusId(null);
      setEditingStatusName("");
      toast({ title: "Stato aggiornato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/activity-statuses/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-statuses"] });
      toast({ title: "Stato eliminato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const toggleStatus = (statusName: string) => {
    if (selectedStatuses.includes(statusName)) {
      onChange(selectedStatuses.filter(s => s !== statusName));
    } else {
      onChange([...selectedStatuses, statusName]);
    }
  };

  const removeStatus = (statusName: string) => {
    onChange(selectedStatuses.filter(s => s !== statusName));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>Stato</Label>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-5 w-5"
          onClick={() => setIsEditDialogOpen(true)}
          data-testid={`button-${testIdPrefix}-edit-statuses`}
        >
          <Edit className="w-3 h-3 sidebar-icon-gold" />
        </Button>
      </div>

      <div className="relative">
        <div
          className="min-h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm cursor-pointer flex items-center flex-wrap gap-1"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          data-testid={`select-${testIdPrefix}-trigger`}
        >
          {selectedStatuses.length === 0 ? (
            <span className="text-muted-foreground">Seleziona stato...</span>
          ) : (
            selectedStatuses.map((status) => (
              <Badge
                key={status}
                variant="outline"
                className="status-badge-gold text-xs flex items-center gap-1"
              >
                {status}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeStatus(status);
                  }}
                  className="ml-0.5 hover:text-destructive"
                  data-testid={`button-${testIdPrefix}-remove-${status}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))
          )}
        </div>

        {isDropdownOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md">
            <div className="max-h-48 overflow-y-auto p-1">
              <div
                className="px-3 py-1.5 text-sm cursor-pointer rounded hover-elevate text-muted-foreground italic"
                onClick={() => {
                  onChange([]);
                  setIsDropdownOpen(false);
                }}
                data-testid={`option-${testIdPrefix}-empty`}
              >
                (Nessuno stato)
              </div>
              {statuses?.filter(s => s.active)?.map((status) => {
                const isSelected = selectedStatuses.includes(status.name);
                return (
                  <div
                    key={status.id}
                    className={`px-3 py-1.5 text-sm cursor-pointer rounded hover-elevate flex items-center justify-between ${isSelected ? "bg-accent/50 font-medium" : ""}`}
                    onClick={() => toggleStatus(status.name)}
                    data-testid={`option-${testIdPrefix}-${status.id}`}
                  >
                    <span>{status.name}</span>
                    {isSelected && (
                      <span className="text-xs text-muted-foreground">
                        #{selectedStatuses.indexOf(status.name) + 1}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle data-testid="text-edit-statuses-title">Gestione Stati Attività</DialogTitle>
            <DialogDescription>Aggiungi, modifica o elimina gli stati disponibili</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Nuovo stato..."
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newStatusName.trim()) {
                    e.preventDefault();
                    createMutation.mutate(newStatusName.trim());
                  }
                }}
                data-testid="input-new-status-name"
              />
              <Button
                type="button"
                size="icon"
                className="gold-3d-button flex-shrink-0"
                onClick={() => {
                  if (newStatusName.trim()) {
                    createMutation.mutate(newStatusName.trim());
                  }
                }}
                disabled={createMutation.isPending}
                data-testid="button-add-new-status"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-1 max-h-60 overflow-y-auto">
              {statuses?.map((status) => (
                <div key={status.id} className="flex items-center gap-2 py-1 px-2 rounded hover-elevate group">
                  <GripVertical className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  {editingStatusId === status.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingStatusName}
                        onChange={(e) => setEditingStatusName(e.target.value)}
                        className="h-8 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editingStatusName.trim()) {
                            e.preventDefault();
                            updateMutation.mutate({ id: status.id, name: editingStatusName.trim() });
                          }
                          if (e.key === "Escape") {
                            setEditingStatusId(null);
                            setEditingStatusName("");
                          }
                        }}
                        autoFocus
                        data-testid={`input-edit-status-${status.id}`}
                      />
                      <Button
                        type="button"
                        size="icon"
                        className="gold-3d-button h-8 w-8 flex-shrink-0"
                        onClick={() => {
                          if (editingStatusName.trim()) {
                            updateMutation.mutate({ id: status.id, name: editingStatusName.trim() });
                          }
                        }}
                        data-testid={`button-save-status-${status.id}`}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm">{status.name}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setEditingStatusId(status.id);
                          setEditingStatusName(status.name);
                        }}
                        data-testid={`button-edit-status-${status.id}`}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                        onClick={() => {
                          if (confirm("Eliminare questo stato?")) {
                            deleteMutation.mutate(status.id);
                          }
                        }}
                        data-testid={`button-delete-status-${status.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
              {(!statuses || statuses.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Nessuno stato definito</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} data-testid="button-close-edit-statuses">
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
