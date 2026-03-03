import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Plus, Trash2, GripVertical, ListChecks } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ActivityStatus, PaymentNote, EnrollmentDetail } from "@shared/schema";

function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

function getColorStyle(color: string | null | undefined): React.CSSProperties {
  if (!color) return {};
  return {
    backgroundColor: color,
    borderColor: color,
    color: isLightColor(color) ? "#000" : "#fff",
  };
}

function ColorBadge({ name, color, className = "" }: { name: string; color?: string | null; className?: string }) {
  if (color) {
    return (
      <Badge variant="outline" className={`text-xs border ${className}`} style={getColorStyle(color)}>
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

interface ListItem {
  id: number;
  name: string;
  color: string | null;
  sortOrder: number | null;
  active: boolean | null;
}

interface EditableListSectionProps {
  title: string;
  queryKey: string;
  apiPath: string;
  emptyMessage: string;
  testIdPrefix: string;
}

function EditableListSection({ title, queryKey, apiPath, emptyMessage, testIdPrefix }: EditableListSectionProps) {
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#9ca3af");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState("");

  const { data: items } = useQuery<ListItem[]>({
    queryKey: [queryKey],
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const maxOrder = items?.reduce((max, i) => Math.max(max, i.sortOrder || 0), 0) || 0;
      await apiRequest("POST", apiPath, { name, color: color || null, sortOrder: maxOrder + 1, active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setNewName("");
      setNewColor("#9ca3af");
      toast({ title: `${title}: voce creata con successo` });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, color }: { id: number; name: string; color: string }) => {
      await apiRequest("PATCH", `${apiPath}/${id}`, { name, color: color || null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setEditingId(null);
      setEditingName("");
      setEditingColor("");
      toast({ title: `${title}: voce aggiornata con successo` });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `${apiPath}/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast({ title: `${title}: voce eliminata con successo` });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card className="border-border/60 shadow-sm bg-card/30" data-testid={`card-elenchi-${testIdPrefix}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-6">
        <CardTitle className="text-base font-bold text-foreground" data-testid={`text-elenchi-title-${testIdPrefix}`}>
          {title}
        </CardTitle>
        <Badge variant="secondary" className="text-[10px] font-bold bg-muted/60 h-5" data-testid={`badge-elenchi-count-${testIdPrefix}`}>
          {items?.length || 0} voci
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Nuova voce..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) {
                e.preventDefault();
                createMutation.mutate({ name: newName.trim(), color: newColor });
              }
            }}
            className="flex-1 h-10 bg-white shadow-sm border-border/50 text-[13px]"
            data-testid={`input-elenchi-new-${testIdPrefix}`}
          />
          <div className="relative flex-shrink-0">
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-10 h-10 rounded border border-border/50 cursor-pointer shadow-sm p-0 m-0 overflow-hidden"
              title="Colore"
              data-testid={`input-elenchi-new-color-${testIdPrefix}`}
            />
          </div>
          <Button
            type="button"
            size="icon"
            className="gold-3d-button flex-shrink-0 w-10 h-10 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              const trimmed = newName.trim();
              if (trimmed) {
                if (items?.some(i => i.name.toLowerCase() === trimmed.toLowerCase())) {
                  alert("Questa voce esiste già!");
                  return;
                }
                createMutation.mutate({ name: trimmed, color: newColor });
                setNewName("");
              }
            }}
            disabled={!newName.trim() || createMutation.isPending}
            data-testid={`button-elenchi-add-${testIdPrefix}`}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {items?.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 py-2 px-3 rounded-md border border-border/40 bg-white hover:bg-muted/30 transition-all group shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              data-testid={`row-elenchi-${testIdPrefix}-${item.id}`}
            >
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0 cursor-grab active:cursor-grabbing" />
              {editingId === item.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-8 text-sm flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && editingName.trim()) {
                        e.preventDefault();
                        updateMutation.mutate({ id: item.id, name: editingName.trim(), color: editingColor });
                      }
                      if (e.key === "Escape") {
                        setEditingId(null);
                        setEditingName("");
                        setEditingColor("");
                      }
                    }}
                    autoFocus
                    data-testid={`input-elenchi-edit-${testIdPrefix}-${item.id}`}
                  />
                  <input
                    type="color"
                    value={editingColor || "#9ca3af"}
                    onChange={(e) => setEditingColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-input flex-shrink-0"
                    title="Colore"
                    data-testid={`input-elenchi-edit-color-${testIdPrefix}-${item.id}`}
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="gold-3d-button flex-shrink-0 h-8 w-8"
                    onClick={() => {
                      if (editingName.trim()) {
                        updateMutation.mutate({ id: item.id, name: editingName.trim(), color: editingColor });
                      }
                    }}
                    data-testid={`button-elenchi-save-${testIdPrefix}-${item.id}`}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <ColorBadge name={item.name} color={item.color} className="uppercase font-bold tracking-tight px-3 py-1 rounded-sm text-[10px] h-auto border-none" />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:bg-amber-100 hover:text-amber-600"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditingName(item.name);
                        setEditingColor(item.color || "");
                      }}
                      data-testid={`button-elenchi-edit-${testIdPrefix}-${item.id}`}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:bg-red-50 hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Eliminare "${item.name}"?`)) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      data-testid={`button-elenchi-delete-${testIdPrefix}-${item.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
          {(!items || items.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-8 bg-muted/10 rounded-md border border-dashed border-border/50">{emptyMessage}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Elenchi() {
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg icon-gold-bg flex items-center justify-center shadow-sm">
            <ListChecks className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight" data-testid="text-elenchi-page-title">
              Elenchi
            </h1>
            <p className="text-sm text-muted-foreground" data-testid="text-elenchi-description">
              Gestisci le voci delle tendine personalizzabili utilizzate nelle schede attività e iscrizioni.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <EditableListSection
          title="Stato"
          queryKey="/api/activity-statuses"
          apiPath="/api/activity-statuses"
          emptyMessage="Nessuno stato definito"
          testIdPrefix="stato"
        />
        <EditableListSection
          title="Note Pagamenti"
          queryKey="/api/payment-notes"
          apiPath="/api/payment-notes"
          emptyMessage="Nessuna nota pagamento definita"
          testIdPrefix="note-pagamenti"
        />
        <EditableListSection
          title="Dettaglio Iscrizione"
          queryKey="/api/enrollment-details"
          apiPath="/api/enrollment-details"
          emptyMessage="Nessun dettaglio iscrizione definito"
          testIdPrefix="dettaglio-iscrizione"
        />
      </div>
    </div>
  );
}
