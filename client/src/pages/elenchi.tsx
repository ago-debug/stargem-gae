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
  const [newColor, setNewColor] = useState("");
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
      setNewColor("");
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
    <Card data-testid={`card-elenchi-${testIdPrefix}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <CardTitle className="text-base" data-testid={`text-elenchi-title-${testIdPrefix}`}>{title}</CardTitle>
        <Badge variant="secondary" className="text-xs" data-testid={`badge-elenchi-count-${testIdPrefix}`}>
          {items?.length || 0} voci
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
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
            className="flex-1"
            data-testid={`input-elenchi-new-${testIdPrefix}`}
          />
          <input
            type="color"
            value={newColor || "#9ca3af"}
            onChange={(e) => setNewColor(e.target.value)}
            className="w-9 h-9 rounded cursor-pointer border border-input flex-shrink-0"
            title="Colore"
            data-testid={`input-elenchi-new-color-${testIdPrefix}`}
          />
          <Button
            type="button"
            size="icon"
            className="gold-3d-button flex-shrink-0"
            onClick={() => {
              if (newName.trim()) {
                createMutation.mutate({ name: newName.trim(), color: newColor });
              }
            }}
            disabled={createMutation.isPending}
            data-testid={`button-elenchi-add-${testIdPrefix}`}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-1 max-h-80 overflow-y-auto">
          {items?.map((item) => (
            <div key={item.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover-elevate group" data-testid={`row-elenchi-${testIdPrefix}-${item.id}`}>
              <GripVertical className="w-3 h-3 text-muted-foreground flex-shrink-0" />
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
                    className="gold-3d-button flex-shrink-0"
                    onClick={() => {
                      if (editingName.trim()) {
                        updateMutation.mutate({ id: item.id, name: editingName.trim(), color: editingColor });
                      }
                    }}
                    data-testid={`button-elenchi-save-${testIdPrefix}-${item.id}`}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <ColorBadge name={item.name} color={item.color} />
                  <span className="flex-1" />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      setEditingId(item.id);
                      setEditingName(item.name);
                      setEditingColor(item.color || "");
                    }}
                    data-testid={`button-elenchi-edit-${testIdPrefix}-${item.id}`}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => {
                      if (confirm(`Eliminare "${item.name}"?`)) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                    data-testid={`button-elenchi-delete-${testIdPrefix}-${item.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          ))}
          {(!items || items.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">{emptyMessage}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Elenchi() {
  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center gap-3">
        <ListChecks className="w-6 h-6 sidebar-icon-gold" />
        <h1 className="text-2xl font-bold" data-testid="text-elenchi-page-title">Elenchi</h1>
      </div>
      <p className="text-sm text-muted-foreground" data-testid="text-elenchi-description">
        Gestisci le voci delle tendine personalizzabili utilizzate nelle schede attivit&agrave; e iscrizioni.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
