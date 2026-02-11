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
import type { PaymentNote } from "@shared/schema";

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

function PaymentNoteBadge({ name, color, className = "" }: { name: string; color?: string | null; className?: string }) {
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

interface MultiSelectPaymentNotesProps {
  selectedNotes: string[];
  onChange: (notes: string[]) => void;
  testIdPrefix?: string;
}

export function MultiSelectPaymentNotes({ selectedNotes, onChange, testIdPrefix = "payment-note" }: MultiSelectPaymentNotesProps) {
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newNoteName, setNewNoteName] = useState("");
  const [newNoteColor, setNewNoteColor] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteName, setEditingNoteName] = useState("");
  const [editingNoteColor, setEditingNoteColor] = useState("");

  const { data: notes } = useQuery<PaymentNote[]>({
    queryKey: ["/api/payment-notes"],
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const maxOrder = notes?.reduce((max, n) => Math.max(max, n.sortOrder || 0), 0) || 0;
      await apiRequest("POST", "/api/payment-notes", { name, color: color || null, sortOrder: maxOrder + 1, active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-notes"] });
      setNewNoteName("");
      setNewNoteColor("");
      toast({ title: "Nota pagamento creata con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, color }: { id: number; name: string; color: string }) => {
      await apiRequest("PATCH", `/api/payment-notes/${id}`, { name, color: color || null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-notes"] });
      setEditingNoteId(null);
      setEditingNoteName("");
      setEditingNoteColor("");
      toast({ title: "Nota pagamento aggiornata con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/payment-notes/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-notes"] });
      toast({ title: "Nota pagamento eliminata con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const toggleNote = (noteName: string) => {
    if (selectedNotes.includes(noteName)) {
      onChange(selectedNotes.filter(n => n !== noteName));
    } else {
      onChange([...selectedNotes, noteName]);
    }
  };

  const removeNote = (noteName: string) => {
    onChange(selectedNotes.filter(n => n !== noteName));
  };

  const filteredNotes = notes?.filter(n => n.active)?.filter(n =>
    !searchQuery || n.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getNoteColor = (noteName: string): string | null => {
    if (!notes) return null;
    const found = notes.find(n => n.name === noteName);
    return found?.color || null;
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Label>Note Pagamenti (O)</Label>
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
          {selectedNotes.length === 0 ? (
            <span className="text-muted-foreground">Seleziona note...</span>
          ) : (
            selectedNotes.map((noteName) => {
              const color = getNoteColor(noteName);
              return (
                <PaymentNoteBadge
                  key={noteName}
                  name={noteName}
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
                (Nessuna nota)
              </div>
              {filteredNotes?.map((note) => {
                const isSelected = selectedNotes.includes(note.name);
                return (
                  <div
                    key={note.id}
                    className={`px-3 py-1.5 text-sm cursor-pointer rounded hover-elevate flex items-center justify-between gap-2 ${isSelected ? "bg-accent/50 font-medium" : ""}`}
                    onClick={() => toggleNote(note.name)}
                    data-testid={`option-${testIdPrefix}-${note.id}`}
                  >
                    <div className="flex items-center gap-2">
                      {note.color && (
                        <span
                          className="w-3 h-3 rounded-sm flex-shrink-0 border border-black/10"
                          style={{ backgroundColor: note.color }}
                        />
                      )}
                      <span>{note.name}</span>
                    </div>
                    {isSelected && (
                      <span className="text-xs text-muted-foreground">
                        #{selectedNotes.indexOf(note.name) + 1}
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
            <DialogTitle data-testid="text-edit-payment-notes-title">Gestione Note Pagamenti</DialogTitle>
            <DialogDescription>Aggiungi, modifica o elimina le note pagamenti disponibili</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Nuova nota..."
                value={newNoteName}
                onChange={(e) => setNewNoteName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newNoteName.trim()) {
                    e.preventDefault();
                    createMutation.mutate({ name: newNoteName.trim(), color: newNoteColor });
                  }
                }}
                className="flex-1"
                data-testid="input-new-payment-note-name"
              />
              <input
                type="color"
                value={newNoteColor || "#9ca3af"}
                onChange={(e) => setNewNoteColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-input flex-shrink-0"
                title="Colore"
                data-testid="input-new-payment-note-color"
              />
              <Button
                type="button"
                size="icon"
                className="gold-3d-button flex-shrink-0"
                onClick={() => {
                  if (newNoteName.trim()) {
                    createMutation.mutate({ name: newNoteName.trim(), color: newNoteColor });
                  }
                }}
                disabled={createMutation.isPending}
                data-testid="button-add-new-payment-note"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-1 max-h-60 overflow-y-auto">
              {notes?.map((note) => (
                <div key={note.id} className="flex items-center gap-2 py-1 px-2 rounded hover-elevate group">
                  <GripVertical className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  {editingNoteId === note.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingNoteName}
                        onChange={(e) => setEditingNoteName(e.target.value)}
                        className="h-8 text-sm flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editingNoteName.trim()) {
                            e.preventDefault();
                            updateMutation.mutate({ id: note.id, name: editingNoteName.trim(), color: editingNoteColor });
                          }
                          if (e.key === "Escape") {
                            setEditingNoteId(null);
                            setEditingNoteName("");
                            setEditingNoteColor("");
                          }
                        }}
                        autoFocus
                        data-testid={`input-edit-payment-note-${note.id}`}
                      />
                      <input
                        type="color"
                        value={editingNoteColor || "#9ca3af"}
                        onChange={(e) => setEditingNoteColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-input flex-shrink-0"
                        title="Colore"
                        data-testid={`input-edit-payment-note-color-${note.id}`}
                      />
                      <Button
                        type="button"
                        size="icon"
                        className="gold-3d-button h-8 w-8 flex-shrink-0"
                        onClick={() => {
                          if (editingNoteName.trim()) {
                            updateMutation.mutate({ id: note.id, name: editingNoteName.trim(), color: editingNoteColor });
                          }
                        }}
                        data-testid={`button-save-payment-note-${note.id}`}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <PaymentNoteBadge name={note.name} color={note.color} />
                      <span className="flex-1" />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setEditingNoteId(note.id);
                          setEditingNoteName(note.name);
                          setEditingNoteColor(note.color || "");
                        }}
                        data-testid={`button-edit-payment-note-${note.id}`}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                        onClick={() => {
                          if (confirm("Eliminare questa nota pagamento?")) {
                            deleteMutation.mutate(note.id);
                          }
                        }}
                        data-testid={`button-delete-payment-note-${note.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
              {(!notes || notes.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Nessuna nota pagamento definita</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} data-testid="button-close-edit-payment-notes">
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
