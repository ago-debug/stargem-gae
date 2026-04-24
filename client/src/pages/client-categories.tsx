// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, FolderTree, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ClientCategory, InsertClientCategory } from "@shared/schema";

export default function ClientCategories() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ClientCategory | null>(null);

  const { data: categories, isLoading } = useQuery<ClientCategory[]>({
    queryKey: ["/api/client-categories"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertClientCategory) => {
      await apiRequest("POST", "/api/client-categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-categories"] });
      toast({ title: "Categoria partecipante creata con successo" });
      setIsFormOpen(false);
      setEditingCategory(null);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertClientCategory }) => {
      await apiRequest("PATCH", `/api/client-categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-categories"] });
      toast({ title: "Categoria partecipante aggiornata con successo" });
      setIsFormOpen(false);
      setEditingCategory(null);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/client-categories/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-categories"] });
      toast({ title: "Categoria partecipante eliminata con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: InsertClientCategory = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      parentId: formData.get("parentId") && formData.get("parentId") !== "none" ? parseInt(formData.get("parentId") as string) : null,
      color: formData.get("color") as string || null,
    };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getCategoryTree = () => {
    if (!categories) return [];
    const roots = categories.filter(cat => !cat.parentId);
    return roots.map(root => ({
      ...root,
      children: categories.filter(cat => cat.parentId === root.id),
    }));
  };

  const categoryTree = getCategoryTree();

  return (
    <div className="p-6 md:p-8 space-y-8 mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="icon-gold-bg rounded-md h-8 w-8 flex-shrink-0"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">Categoria Partecipante</h1>
            <p className="text-muted-foreground text-sm">Organizza i partecipanti per categorie e sottocategorie</p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingCategory(null);
            setIsFormOpen(true);
          }}
          className="gold-3d-button px-4"
          data-testid="button-add-participant-category"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuova Categoria
        </Button>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-bold">Struttura Categoria Partecipante</h2>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Caricamento...</p>
          ) : categoryTree.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium mb-2">Nessuna categoria trovata</p>
              <p className="text-sm">Inizia aggiungendo la prima categoria</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categoryTree.map((category) => (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-md border border-border/50 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {category.color && (
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-foreground truncate">{category.name}</p>
                        {category.description && (
                          <p className="text-xs text-muted-foreground truncate italic">{category.description}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="bg-muted-foreground/10 text-muted-foreground border-none text-[10px] font-bold h-5">
                        {category.children?.length || 0} sottocategorie
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                        onClick={() => {
                          setEditingCategory(category);
                          setIsFormOpen(true);
                        }}
                        data-testid={`button-edit-participant-category-${category.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-white text-muted-foreground border-border/50 hover:bg-gray-50 hover:text-destructive transition-colors shadow-sm"
                        onClick={() => {
                          if (confirm("Sei sicuro di voler eliminare questa categoria?")) {
                            deleteMutation.mutate(category.id);
                          }
                        }}
                        data-testid={`button-delete-participant-category-${category.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {category.children && category.children.length > 0 && (
                    <div className="ml-10 space-y-2 border-l-2 border-muted/30 pl-4 py-1">
                      {category.children.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center justify-between p-3 rounded-md border border-border/40 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {child.color && (
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0 opacity-80"
                                style={{ backgroundColor: child.color }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{child.name}</p>
                              {child.description && (
                                <p className="text-xs text-muted-foreground truncate italic">{child.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 bg-amber-500/90 hover:bg-amber-600 text-white"
                              onClick={() => {
                                setEditingCategory(child);
                                setIsFormOpen(true);
                              }}
                              data-testid={`button-edit-participant-category-${child.id}`}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 bg-white text-muted-foreground border-border/50 hover:text-destructive"
                              onClick={() => {
                                if (confirm("Sei sicuro di voler eliminare questa sottocategoria?")) {
                                  deleteMutation.mutate(child.id);
                                }
                              }}
                              data-testid={`button-delete-participant-category-${child.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Modifica Categoria" : "Nuova Categoria"}</DialogTitle>
            <DialogDescription>
              Inserisci i dettagli della categoria partecipante
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingCategory?.name}
                required
                data-testid="input-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingCategory?.description || ""}
                rows={3}
                data-testid="input-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentId">Categoria Padre (opzionale)</Label>
              <Select name="parentId" defaultValue={editingCategory?.parentId?.toString() || "none"}>
                <SelectTrigger data-testid="select-parent">
                  <SelectValue placeholder="Nessuna (categoria principale)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nessuna (categoria principale)</SelectItem>
                  {categories
                    ?.filter(cat => cat.id !== editingCategory?.id && !cat.parentId)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Colore (opzionale)</Label>
              <Input
                id="color"
                name="color"
                type="color"
                defaultValue={editingCategory?.color || "#3b82f6"}
                data-testid="input-color"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                className="gold-3d-button px-6"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-participant-category"
              >
                {editingCategory ? "Salva Modifiche" : "Crea Categoria"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
