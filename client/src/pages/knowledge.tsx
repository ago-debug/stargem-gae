import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Save, Plus, Trash2, Info, Loader2, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Knowledge } from "@shared/schema";

export default function KnowledgePage() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedItems, setEditedItems] = useState<Record<string, Partial<Knowledge>>>({});
  const [newItem, setNewItem] = useState<Partial<Knowledge>>({
    id: "",
    sezione: "",
    titolo: "",
    descrizione: ""
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: items = [], isLoading } = useQuery<Knowledge[]>({
    queryKey: ["/api/knowledge"],
  });

  const saveMutation = useMutation({
    mutationFn: async (item: Partial<Knowledge>) => {
      return await apiRequest("POST", "/api/knowledge", item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge"] });
      toast({ title: "Salvato", description: "Voce salvata con successo" });
      setEditingId(null);
      setEditedItems({});
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/knowledge/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge"] });
      toast({ title: "Eliminato", description: "Voce eliminata con successo" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateLocalItem = (id: string, field: keyof Knowledge, value: string) => {
    setEditedItems(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const saveItem = (item: Knowledge) => {
    const edited = editedItems[item.id] || {};
    saveMutation.mutate({
      id: item.id,
      sezione: edited.sezione ?? item.sezione,
      titolo: edited.titolo ?? item.titolo,
      descrizione: edited.descrizione ?? item.descrizione,
    });
  };

  const addItem = () => {
    if (!newItem.titolo || !newItem.sezione) {
      toast({ title: "Errore", description: "Titolo e sezione sono obbligatori", variant: "destructive" });
      return;
    }
    
    const id = newItem.id || newItem.titolo.toLowerCase().replace(/\s+/g, '-');
    saveMutation.mutate({
      id,
      sezione: newItem.sezione,
      titolo: newItem.titolo,
      descrizione: newItem.descrizione || "",
    });
    setNewItem({ id: "", sezione: "", titolo: "", descrizione: "" });
    setShowAddForm(false);
  };

  const sezioni = Array.from(new Set(items.map(i => i.sezione)));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="icon-gold-bg rounded-md h-8 w-8 flex-shrink-0" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 text-white" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Knowledge Base</h1>
              <p className="text-muted-foreground text-sm">Gestisci le descrizioni informative per le sezioni dell'applicazione</p>
            </div>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} data-testid="button-add-knowledge">
            <Plus className="w-4 h-4 mr-2" />
            Nuova Voce
          </Button>
        </div>

        {showAddForm && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-lg">Aggiungi Nuova Voce</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>ID (opzionale)</Label>
                  <Input
                    placeholder="es: corsi, workshop..."
                    value={newItem.id || ""}
                    onChange={(e) => setNewItem({ ...newItem, id: e.target.value })}
                    data-testid="input-new-knowledge-id"
                  />
                  <p className="text-xs text-muted-foreground">Se vuoto, verrà generato dal titolo</p>
                </div>
                <div className="space-y-2">
                  <Label>Sezione *</Label>
                  <Input
                    placeholder="es: Attività, Anagrafica..."
                    value={newItem.sezione || ""}
                    onChange={(e) => setNewItem({ ...newItem, sezione: e.target.value })}
                    data-testid="input-new-knowledge-sezione"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Titolo *</Label>
                  <Input
                    placeholder="es: Corsi, Workshop..."
                    value={newItem.titolo || ""}
                    onChange={(e) => setNewItem({ ...newItem, titolo: e.target.value })}
                    data-testid="input-new-knowledge-titolo"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrizione</Label>
                <Textarea
                  placeholder="Descrizione dettagliata che apparirà nel popup informativo..."
                  value={newItem.descrizione || ""}
                  onChange={(e) => setNewItem({ ...newItem, descrizione: e.target.value })}
                  rows={4}
                  data-testid="input-new-knowledge-descrizione"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={addItem} disabled={saveMutation.isPending} data-testid="button-save-new-knowledge">
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Salva
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Annulla
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {items.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nessuna voce knowledge presente. Clicca "Nuova Voce" per iniziare.</p>
            </CardContent>
          </Card>
        ) : (
          sezioni.map(sezione => (
            <Card key={sezione}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Badge variant="secondary">{sezione}</Badge>
                  <span className="text-muted-foreground text-sm">
                    ({items.filter(i => i.sezione === sezione).length} voci)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.filter(i => i.sezione === sezione).map(item => {
                  const isEditing = editingId === item.id;
                  const edited = editedItems[item.id] || {};
                  
                  return (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{item.id}</Badge>
                            {isEditing ? (
                              <Input
                                value={edited.titolo ?? item.titolo}
                                onChange={(e) => updateLocalItem(item.id, 'titolo', e.target.value)}
                                className="font-semibold"
                                data-testid={`input-knowledge-titolo-${item.id}`}
                              />
                            ) : (
                              <span className="font-semibold">{item.titolo}</span>
                            )}
                          </div>
                          {isEditing ? (
                            <Textarea
                              value={edited.descrizione ?? item.descrizione ?? ""}
                              onChange={(e) => updateLocalItem(item.id, 'descrizione', e.target.value)}
                              rows={4}
                              data-testid={`input-knowledge-descrizione-${item.id}`}
                            />
                          ) : (
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                              {item.descrizione || "Nessuna descrizione"}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {isEditing ? (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => saveItem(item)}
                                disabled={saveMutation.isPending}
                                data-testid={`button-save-knowledge-${item.id}`}
                              >
                                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setEditingId(null);
                                  setEditedItems(prev => {
                                    const { [item.id]: _, ...rest } = prev;
                                    return rest;
                                  });
                                }}
                              >
                                Annulla
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setEditingId(item.id)}
                                data-testid={`button-edit-knowledge-${item.id}`}
                              >
                                Modifica
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => deleteMutation.mutate(item.id)}
                                disabled={deleteMutation.isPending}
                                data-testid={`button-delete-knowledge-${item.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))
        )}

        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              Come usare la Knowledge Base
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Ogni voce ha un <strong>ID univoco</strong> che viene usato per collegare la descrizione alla sezione corrispondente</li>
              <li>Le voci con ID "corsi", "workshop", "allenamenti", "merchandising" appaiono automaticamente nella Maschera Input Generale</li>
              <li>Puoi aggiungere nuove voci per altre sezioni dell'applicazione</li>
              <li>Le descrizioni supportano righe multiple per formattazione migliore</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
