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

const COLOR_OPTIONS = [
  { value: "", label: "Nessun colore" },
  { value: "#ef4444", label: "Rosso" },
  { value: "#f97316", label: "Arancione" },
  { value: "#eab308", label: "Giallo" },
  { value: "#fbbf24", label: "Ambra" },
  { value: "#84cc16", label: "Lime" },
  { value: "#22c55e", label: "Verde chiaro" },
  { value: "#16a34a", label: "Verde" },
  { value: "#4ade80", label: "Verde menta" },
  { value: "#3b82f6", label: "Blu" },
  { value: "#8b5cf6", label: "Viola" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#9ca3af", label: "Grigio" },
  { value: "#1a1a1a", label: "Nero" },
];

function getStatusStyle(color: string | null | undefined): React.CSSProperties {
  if (!color) return {};
  return {
    backgroundColor: color,
    borderColor: color,
    color: isLightColor(color) ? "#000" : "#fff",
  };
}

function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

export function getStatusColor(statusName: string, statuses: ActivityStatus[] | undefined): string | null {
  if (!statuses) return null;
  const found = statuses.find(s => s.name === statusName);
  return found?.color || null;
}

export function StatusBadge({ name, color, className = "" }: { name: string; color?: string | null; className?: string }) {
  if (color) {
    return (
      <Badge
        variant="outline"
        className={`text-xs border ${className}`}
        style={getStatusStyle(color)}
      >
        {name}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={`status-badge-gold text-xs ${className}`}>
      {name}
    </Badge>
  );
}

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
  const [newStatusColor, setNewStatusColor] = useState("");
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [editingStatusName, setEditingStatusName] = useState("");
  const [editingStatusColor, setEditingStatusColor] = useState("");

  const { data: statuses } = useQuery<ActivityStatus[]>({
    queryKey: ["/api/activity-statuses"],
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const maxOrder = statuses?.reduce((max, s) => Math.max(max, s.sortOrder || 0), 0) || 0;
      await apiRequest("POST", "/api/activity-statuses", { name, color: color || null, sortOrder: maxOrder + 1, active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-statuses"] });
      setNewStatusName("");
      setNewStatusColor("");
      toast({ title: "Stato creato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, color }: { id: number; name: string; color: string }) => {
      await apiRequest("PATCH", `/api/activity-statuses/${id}`, { name, color: color || null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-statuses"] });
      setEditingStatusId(null);
      setEditingStatusName("");
      setEditingStatusColor("");
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
            selectedStatuses.map((statusName) => {
              const color = getStatusColor(statusName, statuses);
              return (
                <StatusBadge
                  key={statusName}
                  name={statusName}
                  color={color}
                  className="flex items-center gap-1"
                />
              );
            })
          )}
          {selectedStatuses.length > 0 && (
            <div className="flex items-center ml-auto">
              {selectedStatuses.map((statusName) => (
                <button
                  key={statusName}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeStatus(statusName);
                  }}
                  className="ml-0.5 hover:text-destructive hidden"
                  data-testid={`button-${testIdPrefix}-remove-${statusName}`}
                >
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>
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
                    className={`px-3 py-1.5 text-sm cursor-pointer rounded hover-elevate flex items-center justify-between gap-2 ${isSelected ? "bg-accent/50 font-medium" : ""}`}
                    onClick={() => toggleStatus(status.name)}
                    data-testid={`option-${testIdPrefix}-${status.id}`}
                  >
                    <div className="flex items-center gap-2">
                      {status.color && (
                        <span
                          className="w-3 h-3 rounded-sm flex-shrink-0 border border-black/10"
                          style={{ backgroundColor: status.color }}
                        />
                      )}
                      <span>{status.name}</span>
                    </div>
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
                    createMutation.mutate({ name: newStatusName.trim(), color: newStatusColor });
                  }
                }}
                className="flex-1"
                data-testid="input-new-status-name"
              />
              <input
                type="color"
                value={newStatusColor || "#9ca3af"}
                onChange={(e) => setNewStatusColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-input flex-shrink-0"
                title="Colore"
                data-testid="input-new-status-color"
              />
              <Button
                type="button"
                size="icon"
                className="gold-3d-button flex-shrink-0"
                onClick={() => {
                  if (newStatusName.trim()) {
                    createMutation.mutate({ name: newStatusName.trim(), color: newStatusColor });
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
                        className="h-8 text-sm flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editingStatusName.trim()) {
                            e.preventDefault();
                            updateMutation.mutate({ id: status.id, name: editingStatusName.trim(), color: editingStatusColor });
                          }
                          if (e.key === "Escape") {
                            setEditingStatusId(null);
                            setEditingStatusName("");
                            setEditingStatusColor("");
                          }
                        }}
                        autoFocus
                        data-testid={`input-edit-status-${status.id}`}
                      />
                      <input
                        type="color"
                        value={editingStatusColor || "#9ca3af"}
                        onChange={(e) => setEditingStatusColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-input flex-shrink-0"
                        title="Colore"
                        data-testid={`input-edit-status-color-${status.id}`}
                      />
                      <Button
                        type="button"
                        size="icon"
                        className="gold-3d-button h-8 w-8 flex-shrink-0"
                        onClick={() => {
                          if (editingStatusName.trim()) {
                            updateMutation.mutate({ id: status.id, name: editingStatusName.trim(), color: editingStatusColor });
                          }
                        }}
                        data-testid={`button-save-status-${status.id}`}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <StatusBadge name={status.name} color={status.color} />
                      <span className="flex-1" />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setEditingStatusId(status.id);
                          setEditingStatusName(status.name);
                          setEditingStatusColor(status.color || "");
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
