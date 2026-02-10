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
import type { SundayCategory, InsertSundayCategory } from "@shared/schema";

export default function SundayCategories() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SundayCategory | null>(null);

  const { data: categories, isLoading } = useQuery<SundayCategory[]>({
    queryKey: ["/api/sunday-categories"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSundayCategory) => {
      await apiRequest("POST", "/api/sunday-categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sunday-categories"] });
      toast({ title: "Categoria creata con successo" });
      setIsFormOpen(false);
      setEditingCategory(null);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertSundayCategory }) => {
      await apiRequest("PATCH", `/api/sunday-categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sunday-categories"] });
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
      await apiRequest("DELETE", `/api/sunday-categories/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sunday-categories"] });
      toast({ title: "Categoria eliminata con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: InsertSundayCategory = {
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
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="icon-gold-bg rounded-md h-8 w-8 flex-shrink-0" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 text-white" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">Categorie Domeniche in Movimento</h1>
            <p className="text-muted-foreground text-sm">Organizza le domeniche in movimento per categorie e sottocategorie</p>
          </div>
        </div>
        <Button 
          onClick={() => {
            setEditingCategory(null);
            setIsFormOpen(true);
          }}
          data-testid="button-add-sunday-category"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuova Categoria
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-medium">Struttura Categorie Domeniche in Movimento</h2>
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
                        size="icon"
                        className="gold-3d-button"
                        onClick={() => {
                          setEditingCategory(category);
                          setIsFormOpen(true);
                        }}
                        data-testid={`button-edit-sunday-category-${category.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="bg-white text-black border-foreground/20 hover:bg-gray-50 dark:bg-white dark:text-black dark:hover:bg-gray-100"
                        onClick={() => {
                          if (confirm("Sei sicuro di voler eliminare questa categoria?")) {
                            deleteMutation.mutate(category.id);
                          }
                        }}
                        data-testid={`button-delete-sunday-category-${category.id}`}
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
                              size="icon"
                              className="gold-3d-button"
                              onClick={() => {
                                setEditingCategory(child);
                                setIsFormOpen(true);
                              }}
                              data-testid={`button-edit-sunday-category-${child.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="bg-white text-black border-foreground/20 hover:bg-gray-50 dark:bg-white dark:text-black dark:hover:bg-gray-100"
                              onClick={() => {
                                if (confirm("Sei sicuro di voler eliminare questa categoria?")) {
                                  deleteMutation.mutate(child.id);
                                }
                              }}
                              data-testid={`button-delete-sunday-category-${child.id}`}
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
                data-testid="input-sunday-category-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingCategory?.description || ""}
                rows={3}
                data-testid="input-sunday-category-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentId">Categoria Padre (opzionale)</Label>
              <Select name="parentId" defaultValue={editingCategory?.parentId?.toString() || "none"}>
                <SelectTrigger data-testid="select-sunday-category-parent">
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
                data-testid="input-sunday-category-color"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                data-testid="button-cancel-sunday-category"
              >
                Annulla
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-sunday-category"
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