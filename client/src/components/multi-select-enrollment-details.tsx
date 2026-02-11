import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Edit, Plus, Trash2, GripVertical, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { EnrollmentDetail } from "@shared/schema";

function getDetailStyle(color: string | null | undefined): React.CSSProperties {
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

function EnrollmentDetailBadge({ name, color, className = "" }: { name: string; color?: string | null; className?: string }) {
  if (color) {
    return (
      <Badge
        variant="outline"
        className={`text-xs border ${className}`}
        style={getDetailStyle(color)}
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

interface MultiSelectEnrollmentDetailsProps {
  selectedDetails: string[];
  onChange: (details: string[]) => void;
  testIdPrefix?: string;
}

export function MultiSelectEnrollmentDetails({ selectedDetails, onChange, testIdPrefix = "enrollment-detail" }: MultiSelectEnrollmentDetailsProps) {
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newDetailName, setNewDetailName] = useState("");
  const [newDetailColor, setNewDetailColor] = useState("");
  const [editingDetailId, setEditingDetailId] = useState<number | null>(null);
  const [editingDetailName, setEditingDetailName] = useState("");
  const [editingDetailColor, setEditingDetailColor] = useState("");

  const { data: details } = useQuery<EnrollmentDetail[]>({
    queryKey: ["/api/enrollment-details"],
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const maxOrder = details?.reduce((max, d) => Math.max(max, d.sortOrder || 0), 0) || 0;
      await apiRequest("POST", "/api/enrollment-details", { name, color: color || null, sortOrder: maxOrder + 1, active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollment-details"] });
      setNewDetailName("");
      setNewDetailColor("");
      toast({ title: "Dettaglio iscrizione creato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, color }: { id: number; name: string; color: string }) => {
      await apiRequest("PATCH", `/api/enrollment-details/${id}`, { name, color: color || null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollment-details"] });
      setEditingDetailId(null);
      setEditingDetailName("");
      setEditingDetailColor("");
      toast({ title: "Dettaglio iscrizione aggiornato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/enrollment-details/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollment-details"] });
      toast({ title: "Dettaglio iscrizione eliminato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const toggleDetail = (detailName: string) => {
    if (selectedDetails.includes(detailName)) {
      onChange(selectedDetails.filter(d => d !== detailName));
    } else {
      onChange([...selectedDetails, detailName]);
    }
  };

  const filteredDetails = details?.filter(d => d.active)?.filter(d =>
    !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDetailColor = (detailName: string): string | null => {
    if (!details) return null;
    const found = details.find(d => d.name === detailName);
    return found?.color || null;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>Dettaglio Iscrizione (N)</Label>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-5 w-5"
          onClick={() => setIsEditDialogOpen(true)}
          data-testid={`button-${testIdPrefix}-edit`}
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
          {selectedDetails.length === 0 ? (
            <span className="text-muted-foreground">Seleziona dettaglio...</span>
          ) : (
            selectedDetails.map((detailName) => {
              const color = getDetailColor(detailName);
              return (
                <EnrollmentDetailBadge
                  key={detailName}
                  name={detailName}
                  color={color}
                  className="flex items-center gap-1"
                />
              );
            })
          )}
        </div>

        {isDropdownOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md">
            <div className="p-2 border-b border-input">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input
                  placeholder="Cerca..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 text-xs pl-7"
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`input-${testIdPrefix}-search`}
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
              <div
                className="px-3 py-1.5 text-sm cursor-pointer rounded hover-elevate text-muted-foreground italic"
                onClick={() => {
                  onChange([]);
                  setIsDropdownOpen(false);
                }}
                data-testid={`option-${testIdPrefix}-empty`}
              >
                (Nessun dettaglio)
              </div>
              {filteredDetails?.map((detail) => {
                const isSelected = selectedDetails.includes(detail.name);
                return (
                  <div
                    key={detail.id}
                    className={`px-3 py-1.5 text-sm cursor-pointer rounded hover-elevate flex items-center justify-between gap-2 ${isSelected ? "bg-accent/50 font-medium" : ""}`}
                    onClick={() => toggleDetail(detail.name)}
                    data-testid={`option-${testIdPrefix}-${detail.id}`}
                  >
                    <div className="flex items-center gap-2">
                      {detail.color && (
                        <span
                          className="w-3 h-3 rounded-sm flex-shrink-0 border border-black/10"
                          style={{ backgroundColor: detail.color }}
                        />
                      )}
                      <span>{detail.name}</span>
                    </div>
                    {isSelected && (
                      <span className="text-xs text-muted-foreground">
                        #{selectedDetails.indexOf(detail.name) + 1}
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
          onClick={() => { setIsDropdownOpen(false); setSearchQuery(""); }}
        />
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle data-testid="text-edit-enrollment-details-title">Gestione Dettagli Iscrizione</DialogTitle>
            <DialogDescription>Aggiungi, modifica o elimina i dettagli iscrizione disponibili</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Nuovo dettaglio..."
                value={newDetailName}
                onChange={(e) => setNewDetailName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newDetailName.trim()) {
                    e.preventDefault();
                    createMutation.mutate({ name: newDetailName.trim(), color: newDetailColor });
                  }
                }}
                className="flex-1"
                data-testid="input-new-enrollment-detail-name"
              />
              <input
                type="color"
                value={newDetailColor || "#9ca3af"}
                onChange={(e) => setNewDetailColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-input flex-shrink-0"
                title="Colore"
                data-testid="input-new-enrollment-detail-color"
              />
              <Button
                type="button"
                size="icon"
                className="gold-3d-button flex-shrink-0"
                onClick={() => {
                  if (newDetailName.trim()) {
                    createMutation.mutate({ name: newDetailName.trim(), color: newDetailColor });
                  }
                }}
                disabled={createMutation.isPending}
                data-testid="button-add-new-enrollment-detail"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-1 max-h-60 overflow-y-auto">
              {details?.map((detail) => (
                <div key={detail.id} className="flex items-center gap-2 py-1 px-2 rounded hover-elevate group">
                  <GripVertical className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  {editingDetailId === detail.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingDetailName}
                        onChange={(e) => setEditingDetailName(e.target.value)}
                        className="h-8 text-sm flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editingDetailName.trim()) {
                            e.preventDefault();
                            updateMutation.mutate({ id: detail.id, name: editingDetailName.trim(), color: editingDetailColor });
                          }
                          if (e.key === "Escape") {
                            setEditingDetailId(null);
                            setEditingDetailName("");
                            setEditingDetailColor("");
                          }
                        }}
                        autoFocus
                        data-testid={`input-edit-enrollment-detail-${detail.id}`}
                      />
                      <input
                        type="color"
                        value={editingDetailColor || "#9ca3af"}
                        onChange={(e) => setEditingDetailColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-input flex-shrink-0"
                        title="Colore"
                        data-testid={`input-edit-enrollment-detail-color-${detail.id}`}
                      />
                      <Button
                        type="button"
                        size="icon"
                        className="gold-3d-button h-8 w-8 flex-shrink-0"
                        onClick={() => {
                          if (editingDetailName.trim()) {
                            updateMutation.mutate({ id: detail.id, name: editingDetailName.trim(), color: editingDetailColor });
                          }
                        }}
                        data-testid={`button-save-enrollment-detail-${detail.id}`}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <EnrollmentDetailBadge name={detail.name} color={detail.color} />
                      <span className="flex-1" />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setEditingDetailId(detail.id);
                          setEditingDetailName(detail.name);
                          setEditingDetailColor(detail.color || "");
                        }}
                        data-testid={`button-edit-enrollment-detail-${detail.id}`}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                        onClick={() => {
                          if (confirm("Eliminare questo dettaglio iscrizione?")) {
                            deleteMutation.mutate(detail.id);
                          }
                        }}
                        data-testid={`button-delete-enrollment-detail-${detail.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
              {(!details || details.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Nessun dettaglio iscrizione definito</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} data-testid="button-close-edit-enrollment-details">
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
