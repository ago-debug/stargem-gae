import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, GripVertical, ListChecks, Plus, Edit, ClipboardPaste, Settings, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CustomList, CustomListItem } from "@shared/schema";

import { getActiveActivities } from "@/config/activities";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

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
    <Card id={title.toLowerCase().replace(/ /g, '-')} className="border-border/60 shadow-sm bg-card/30" data-testid={`card-elenchi-${testIdPrefix}`}>
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
          {items && [...items].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })).map((item) => (
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

interface SimpleListSectionProps {
  list: CustomList & { items: CustomListItem[]; linkedActivities?: string[] };
}

function SimpleListSection({ list }: SimpleListSectionProps) {
  const { toast } = useToast();
  const [newValue, setNewValue] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingColor, setEditingColor] = useState<string>("#cccccc");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkValues, setBulkValues] = useState("");

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editName, setEditName] = useState(list.name);
  const [editDescription, setEditDescription] = useState(list.description || "");
  const [editActivities, setEditActivities] = useState<string[]>(list.linkedActivities || []);

  const updateListSettingsMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; linkedActivities: string[] }) => {
      await apiRequest("PATCH", `/api/custom-lists/${list.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-lists"] });
      setSettingsOpen(false);
      toast({ title: "Impostazioni elenco aggiornate" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (values: string[]) => {
      await apiRequest("POST", `/api/custom-lists/${list.id}/items/bulk`, { values });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-lists"] });
      setBulkOpen(false);
      setBulkValues("");
      toast({ title: "Voci caricate con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleBulkSubmit = () => {
    // Permette di inserire valori separati da 'a capo' o da 'virgola'
    const lines = bulkValues.split(/[\n,]+/).map(v => v.trim()).filter(v => v.length > 0);
    if (lines.length > 0) {
      bulkCreateMutation.mutate(lines);
    }
  };

  const createItemMutation = useMutation({
    mutationFn: async (value: string) => {
      const maxOrder = list.items?.reduce((max, i) => Math.max(max, i.sortOrder || 0), 0) || 0;
      await apiRequest("POST", `/api/custom-lists/${list.id}/items`, { value, sortOrder: maxOrder + 1, active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-lists"] });
      setNewValue("");
      toast({ title: `Voce aggiunta a ${list.name}` });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, value, color }: { id: number; value: string; color?: string }) => {
      await apiRequest("PATCH", `/api/custom-lists/${list.id}/items/${id}`, { value, color });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-lists"] });
      setEditingId(null);
      setEditingValue("");
      toast({ title: "Voce aggiornata" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/custom-lists/${list.id}/items/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-lists"] });
      toast({ title: "Voce eliminata" });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/custom-lists/${list.id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-lists"] });
      toast({ title: `Elenco ${list.name} eliminato` });
    },
  });

  return (
    <Card id={`list-${list.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`} className="border-border/60 shadow-sm bg-card/30" data-testid={`card-custom-list-${list.id}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-6 group">
        <div>
          <CardTitle className="text-base font-bold text-foreground flex flex-col gap-1">
            <span>{list.name}</span>
          </CardTitle>
          {list.description && <p className="text-xs text-muted-foreground mt-1">{list.description}</p>}
          <div className="mt-4 pt-3 border-t border-border/40">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5 tracking-wider">
              {list.linkedActivities && list.linkedActivities.length > 0 ? "Collegato a:" : "Nessun collegamento attivo"}
            </p>
            <div className="flex flex-wrap gap-1">
              {(typeof list.linkedActivities === 'string' ? JSON.parse(list.linkedActivities || '[]') : (list.linkedActivities || [])).map((act: string) => {
                const label = getActiveActivities().find(a => a.id === act)?.labelUI || act;
                return <Badge key={act} variant="outline" className="text-[10px] px-2 py-0.5 bg-amber-50/50 border-amber-200 text-amber-900 shadow-sm">{label}</Badge>
              })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] font-bold bg-muted/60 h-5">
            {list.items?.length || 0} voci
          </Badge>

          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity"
                title="Impostazioni Elenco"
                onClick={() => {
                  setEditName(list.name);
                  setEditDescription(list.description || "");
                  const acts = typeof list.linkedActivities === 'string' ? JSON.parse(list.linkedActivities || '[]') : (list.linkedActivities || []);
                  setEditActivities(Array.isArray(acts) ? acts : []);
                }}
              >
                <Settings className="w-3.5 h-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Impostazioni Elenco "{list.name}"</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5 box-border">
                     <label className="text-xs font-semibold text-muted-foreground">Nome Elenco</label>
                     <Input value={editName} onChange={e => setEditName(e.target.value)} />
                   </div>
                   <div className="space-y-1.5 box-border">
                     <label className="text-xs font-semibold text-muted-foreground">Descrizione</label>
                     <Input value={editDescription} onChange={e => setEditDescription(e.target.value)} />
                   </div>
                 </div>
                 
                 <div className="pt-4 border-t border-border">
                   <h4 className="text-sm font-semibold mb-3">Attività Collegate</h4>
                   <p className="text-xs text-muted-foreground mb-4">Seleziona in quali sottomoduli (attività) i valori di questo elenco devono essere disponibili per la selezione.</p>
                   
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                     {getActiveActivities().map(act => {
                       const isActive = editActivities.includes(act.id);
                       return (
                         <div 
                           key={act.id} 
                           onClick={() => {
                             setEditActivities(prev => isActive ? prev.filter(id => id !== act.id) : [...prev, act.id])
                           }}
                           className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer text-sm transition-colors ${isActive ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-white border-border hover:bg-muted/50 text-muted-foreground'}`}
                         >
                           <div className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-amber-500 border-amber-500' : 'bg-white border-input'}`}>
                             {isActive && <Check className="w-3 h-3 text-white" />}
                           </div>
                           <span className="truncate" title={act.labelUI}>{act.labelUI}</span>
                         </div>
                       )
                     })}
                   </div>
                 </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSettingsOpen(false)}>Annulla</Button>
                <Button className="gold-3d-button px-6" onClick={() => {
                  if (editName.trim()) {
                    updateListSettingsMutation.mutate({
                      name: editName.trim(),
                      description: editDescription.trim() || undefined,
                      linkedActivities: editActivities
                    })
                  }
                }} disabled={!editName.trim() || updateListSettingsMutation.isPending}>
                  {updateListSettingsMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
            onClick={() => {
              if (confirm(`Sei sicuro di voler eliminare l'intero elenco "${list.name}" e tutte le sue voci? Questa azione non può essere annullata.`)) {
                deleteListMutation.mutate();
              }
            }}
            title="Elimina Elenco Semplice"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Nuova voce..."
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newValue.trim()) {
                e.preventDefault();
                createItemMutation.mutate(newValue.trim());
              }
            }}
            className="flex-1 h-10 bg-white shadow-sm border-border/50 text-[13px]"
          />
          <Button
            type="button"
            size="icon"
            className="gold-3d-button flex-shrink-0 w-10 h-10"
            onClick={() => {
              if (newValue.trim()) {
                if (list.items?.some(i => i.value.toLowerCase() === newValue.trim().toLowerCase())) {
                  alert("Questa voce esiste già in questo elenco!");
                  return;
                }
                createItemMutation.mutate(newValue.trim());
              }
            }}
            disabled={!newValue.trim() || createItemMutation.isPending}
          >
            <Plus className="w-5 h-5" />
          </Button>
          <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="flex-shrink-0 w-10 h-10 border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground shadow-sm bg-white"
                title="Inserimento multiplo massivo"
              >
                <ClipboardPaste className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Importazione Massiva in "{list.name}"</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Incolla in questo box una lista di nomi/valori copiando ad esempio da Excel, Word o blocco note. <br />
                  Puoi separare i valori andando <strong>'a capo'</strong> (una riga per ogni nome) oppure usando la <strong>virgola</strong>.<br />
                  I valori vuoti e gli eventuali duplicati verranno ignorati automaticamente.
                </p>
                <Textarea
                  placeholder={"Es.\nCorso Yoga\nCorso Pilates\n\noppure:\nCorso Yoga, Corso Pilates, Corso Zumba"}
                  value={bulkValues}
                  onChange={(e) => setBulkValues(e.target.value)}
                  className="min-h-[250px] font-mono text-sm leading-relaxed whitespace-pre bg-muted/30"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setBulkOpen(false); setBulkValues(""); }}>Annulla</Button>
                <Button
                  onClick={handleBulkSubmit}
                  disabled={!bulkValues.trim() || bulkCreateMutation.isPending}
                  className="gold-3d-button px-6"
                >
                  {bulkCreateMutation.isPending ? "Caricamento..." : `Importa ${bulkValues.split(/[\n,]+/).filter(v => v.trim().length > 0).length} Voci`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {list.items && [...list.items].sort((a, b) => a.value.localeCompare(b.value, undefined, { numeric: true })).map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 py-2 px-3 rounded-md border border-border/40 bg-white hover:bg-muted/30 transition-all group shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0 cursor-grab active:cursor-grabbing" />

              {editingId === item.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    className="h-8 text-sm flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && editingValue.trim()) {
                        e.preventDefault();
                        updateItemMutation.mutate({ id: item.id, value: editingValue.trim(), color: editingColor });
                      }
                      if (e.key === "Escape") {
                        setEditingId(null);
                        setEditingValue("");
                      }
                    }}
                    autoFocus
                  />
                  <input
                    type="color"
                    value={editingColor}
                    onChange={e => setEditingColor(e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded border border-gray-300"
                    title="Scegli colore categoria"
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="gold-3d-button flex-shrink-0 h-8 w-8"
                    onClick={() => {
                      if (editingValue.trim()) {
                        updateItemMutation.mutate({ id: item.id, value: editingValue.trim(), color: editingColor });
                      }
                    }}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-1">
                    {item.color && (
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0 border border-gray-200"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                    <div className="flex-1 min-w-0 text-[13px] font-medium text-foreground">
                      {item.value}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:bg-amber-100 hover:text-amber-600"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditingValue(item.value);
                        setEditingColor(item.color || "#cccccc");
                      }}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:bg-red-50 hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Eliminare "${item.value}"?`)) {
                          deleteItemMutation.mutate(item.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
          {(!list.items || list.items.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-6 bg-muted/10 rounded-md border border-dashed border-border/50">Nessuna voce inserita in questo elenco.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SimpleListsManager() {
  const { toast } = useToast();
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [newListActivities, setNewListActivities] = useState<string[]>([]);

  const { data: lists } = useQuery<(CustomList & { items: CustomListItem[]; linkedActivities?: string[] })[]>({
    queryKey: ["/api/custom-lists"],
  });

  const createListMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; linkedActivities: string[] }) => {
      await apiRequest("POST", "/api/custom-lists", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-lists"] });
      setNewListName("");
      setNewListDescription("");
      setNewListActivities([]);
      toast({ title: "Nuovo elenco semplice creato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6 pt-10 border-t border-border mt-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Elenchi Semplici</h2>
          <p className="text-sm text-muted-foreground">Gruppi personalizzati per menu a tendina e campi di selezione</p>
        </div>
      </div>



      {lists && lists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {[...lists]
            .filter(list => !['categorie', 'canale_di_acquisizione', 'come_ci_ha_conosciuto'].includes(list.systemName))
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
            .map(list => (
            <SimpleListSection key={list.id} list={list} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 rounded-xl border border-dashed border-border mt-8 flex flex-col items-center justify-center bg-card/30">
          <ListChecks className="h-10 w-10 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-foreground">Nessun elenco personalizzato in archivio</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">Crea il tuo primo elenco qui sopra per poterlo utilizzare nei campi a tendina del gestionale.</p>
        </div>
      )}
    </div>
  );
}

function ColoredCustomListsLoader() {
  const { data: lists } = useQuery<(CustomList & { items: CustomListItem[]; linkedActivities?: string[] })[]>({
    queryKey: ["/api/custom-lists"],
  });

  if (!lists || lists.length === 0) return null;

  const targetLists = lists.filter(l => ['categorie', 'canale_di_acquisizione', 'come_ci_ha_conosciuto'].includes(l.systemName));

  if (targetLists.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {targetLists.map(list => (
        <SimpleListSection key={list.id} list={list} />
      ))}
    </div>
  );
}

export default function Elenchi() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const currentUrlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState("semplici");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    if (tab && (tab === 'semplici' || tab === 'colorati')) {
      setActiveTab(tab);
    }
    
    // Gestione Deep Scroll
    const focusId = searchParams.get('focus');
    if (focusId) {
      setTimeout(() => {
        const el = document.getElementById(focusId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300); // Wait for DOM render inside active tab
    }
  }, [location]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Optional: sync back to URL if user clicks tab manually
    setLocation(`/elenchi?tab=${value}`, { replace: true });
  };

  return (
    <div className="p-6 md:p-8 space-y-8 mx-auto">
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
        <div className="w-full flex justify-center">
          <TabsList className="bg-muted/50 p-1 h-auto grid grid-cols-2 w-full max-w-md shadow-sm border border-border/50">
            <TabsTrigger value="semplici" className="py-2.5 px-4 rounded font-semibold text-sm">
              Elenchi Semplici
            </TabsTrigger>
            <TabsTrigger value="colorati" className="py-2.5 px-4 rounded font-semibold text-sm">
              Elenchi Colorati Multi
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="semplici" className="m-0 border-none p-0 outline-none mt-0">
          <div className="-mt-10">
            <SimpleListsManager />
          </div>
        </TabsContent>
        <TabsContent value="colorati" className="m-0 border-none p-0 outline-none">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Elenchi Colorati Multi</h2>
              <p className="text-sm text-muted-foreground">Elenchi con opzioni cromatiche specifiche, principalmente usati per stati visivi.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <EditableListSection
                title="Tipo Partecipante"
                queryKey="/api/participant-types"
                apiPath="/api/participant-types"
                emptyMessage="Nessun tipo partecipante definito"
                testIdPrefix="tipo-partecipante"
              />
              <EditableListSection
                title="Stato"
                queryKey="/api/activity-statuses"
                apiPath="/api/activity-statuses"
                emptyMessage="Nessuno stato definito"
                testIdPrefix="stato"
              />
              <EditableListSection
                title="Metodi di Pagamento"
                queryKey="/api/payment-notes"
                apiPath="/api/payment-notes"
                emptyMessage="Nessun metodo di pagamento definito"
                testIdPrefix="note-pagamenti"
              />
              <EditableListSection
                title="Dettaglio Iscrizione"
                queryKey="/api/enrollment-details"
                apiPath="/api/enrollment-details"
                emptyMessage="Nessun dettaglio iscrizione definito"
                testIdPrefix="dettaglio-iscrizione"
              />
              <ColoredCustomListsLoader />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
