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
import type { VacationCategory, InsertVacationCategory } from "@shared/schema";

export default function VacationCategories() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<VacationCategory | null>(null);

  const { data: categories, isLoading } = useQuery<VacationCategory[]>({
    queryKey: ["/api/vacation-categories"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertVacationCategory) => {
      await apiRequest("POST", "/api/vacation-categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vacation-categories"] });
      toast({ title: "Categoria creata con successo" });
      setIsFormOpen(false);
      setEditingCategory(null);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertVacationCategory }) => {
      await apiRequest("PATCH", `/api/vacation-categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vacation-categories"] });
      toast({ title: "Categoria aggiornata con successo" });
      setIsFormOpen(false);
      setEditingCategory(null);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/vacation-categories/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vacation-categories"] });
      toast({ title: "Categoria eliminata con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: InsertVacationCategory = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      parentId: formData.get("parentId") ? parseInt(formData.get("parentId") as string) : null,
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
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-2" data-testid="button-back">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Indietro
      </Button>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2" data-testid="text-page-title">Categorie Vacanze Studio</h1>
          <p className="text-muted-foreground">Organizza le vacanze studio per categorie e sottocategorie</p>
        </div>
        <Button 
          onClick={() => {
            setEditingCategory(null);
            setIsFormOpen(true);
          }}
          data-testid="button-add-vacation-category"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuova Categoria
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-medium">Struttura Categorie Vacanze Studio</h2>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Caricamento...</p>
          ) : categoryTree.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium mb-2">Nessuna categoria trovata</p>
              <p className="text-sm">Inizia aggiungendo la prima categoria</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categoryTree.map((category) => (
                <div key={category.id} className="space-y-1">
                  <div className="flex items-center justify-between p-3 rounded-md hover-elevate active-elevate-2 border border-border">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {category.color && (
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" data-testid={`text-category-name-${category.id}`}>{category.name}</p>
                        {category.description && (
                          <p className="text-sm text-muted-foreground truncate">{category.description}</p>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {category.children?.length || 0} sottocategorie
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingCategory(category);
                          setIsFormOpen(true);
                        }}
                        data-testid={`button-edit-vacation-category-${category.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Sei sicuro di voler eliminare questa categoria?")) {
                            deleteMutation.mutate(category.id);
                          }
                        }}
                        data-testid={`button-delete-vacation-category-${category.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {category.children && category.children.length > 0 && (
                    <div className="ml-8 space-y-1">
                      {category.children.map((child) => (
                        <div 
                          key={child.id} 
                          className="flex items-center justify-between p-3 rounded-md hover-elevate active-elevate-2 border border-border"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {child.color && (
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: child.color }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate" data-testid={`text-category-name-${child.id}`}>{child.name}</p>
                              {child.description && (
                                <p className="text-sm text-muted-foreground truncate">{child.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingCategory(child);
                                setIsFormOpen(true);
                              }}
                              data-testid={`button-edit-vacation-category-${child.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Sei sicuro di voler eliminare questa categoria?")) {
                                  deleteMutation.mutate(child.id);
                                }
                              }}
                              data-testid={`button-delete-vacation-category-${child.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
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
              Inserisci i dettagli della categoria
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
                data-testid="input-vacation-category-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingCategory?.description || ""}
                rows={3}
                data-testid="input-vacation-category-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentId">Categoria Padre (opzionale)</Label>
              <Select name="parentId" defaultValue={editingCategory?.parentId?.toString() || "none"}>
                <SelectTrigger data-testid="select-vacation-category-parent">
                  <SelectValue placeholder="Nessuna (categoria principale)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nessuna (categoria principale)</SelectItem>
                  {categories?.filter(c => c.id !== editingCategory?.id && !c.parentId).map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
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
                data-testid="input-vacation-category-color"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                data-testid="button-cancel-vacation-category"
              >
                Annulla
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-vacation-category"
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