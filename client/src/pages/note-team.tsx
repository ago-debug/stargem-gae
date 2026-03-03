import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { StickyNote, Plus, Pin, PinOff, Trash2, Clock, Edit, Tag, Archive, ArchiveRestore } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TeamNote } from "@shared/schema";

const CATEGORIES = [
  { value: "generale", label: "Generale" },
  { value: "problema", label: "Problema" },
  { value: "idea", label: "Idea" },
  { value: "promemoria", label: "Promemoria" },
  { value: "urgente", label: "Urgente" },
];

export default function NoteTeam() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<TeamNote | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("generale");
  const [filterCategory, setFilterCategory] = useState("tutti");
  const [targetUrl, setTargetUrl] = useState("");

  const { data: notes = [], isLoading } = useQuery<TeamNote[]>({
    queryKey: ["/api/team-notes"],
    queryFn: async () => apiRequest("GET", "/api/team-notes"),
  });

  const { data: archivedNotes = [], isLoading: isLoadingArchived } = useQuery<TeamNote[]>({
    queryKey: ["/api/team-notes/archived"],
    queryFn: async () => apiRequest("GET", "/api/team-notes/archived"),
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; category: string; targetUrl?: string }) => {
      return apiRequest("POST", "/api/team-notes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-notifications/unread-count"] });
      resetForm();
      toast({ title: "Nota creata" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile creare la nota", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TeamNote> }) => {
      return apiRequest("PATCH", `/api/team-notes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-notes"] });
      resetForm();
      toast({ title: "Nota aggiornata" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/team-notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-notes/archived"] });
      toast({ title: "Nota archiviata" });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/team-notes/${id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-notes/archived"] });
      toast({ title: "Nota ripristinata dall'archivio" });
    },
  });

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("generale");
    setTargetUrl("");
    setEditingNote(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;

    let processedUrl = targetUrl.trim();
    if (processedUrl.startsWith('http')) {
      try {
        processedUrl = new URL(processedUrl).pathname;
      } catch (e) { }
    }

    if (editingNote) {
      updateMutation.mutate({ id: editingNote.id, data: { title: title.trim(), content: content.trim(), category, targetUrl: processedUrl || null } });
    } else {
      createMutation.mutate({ title: title.trim(), content: content.trim(), category, targetUrl: processedUrl || undefined });
    }
  };

  const handleEdit = (note: TeamNote) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category || "generale");
    setTargetUrl(note.targetUrl || "");
    setIsDialogOpen(true);
  };

  const handleTogglePin = (note: TeamNote) => {
    updateMutation.mutate({ id: note.id, data: { isPinned: !note.isPinned } });
  };

  const filteredNotes = notes.filter((n) => {
    if (filterCategory !== "tutti" && n.category !== filterCategory) return false;
    return true;
  });

  const filteredArchivedNotes = archivedNotes.filter((n) => {
    if (filterCategory !== "tutti" && n.category !== filterCategory) return false;
    return true;
  });

  const getCategoryBadge = (cat: string | null) => {
    switch (cat) {
      case "problema":
        return <Badge variant="destructive" data-testid={`badge-cat-${cat}`}>Problema</Badge>;
      case "urgente":
        return <Badge className="bg-orange-500 text-white border-orange-600" data-testid={`badge-cat-${cat}`}>Urgente</Badge>;
      case "idea":
        return <Badge className="bg-blue-500 text-white border-blue-600" data-testid={`badge-cat-${cat}`}>Idea</Badge>;
      case "promemoria":
        return <Badge className="bg-purple-500 text-white border-purple-600" data-testid={`badge-cat-${cat}`}>Promemoria</Badge>;
      default:
        return <Badge variant="secondary" data-testid={`badge-cat-${cat}`}>Generale</Badge>;
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-note-team">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <StickyNote className="w-6 h-6 sidebar-icon-gold" />
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Note Team</h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-note">
              <Plus className="w-4 h-4 mr-2" />
              Inserisci Nota
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingNote ? "Modifica Nota" : "Nuova Nota"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Titolo *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titolo della nota"
                  data-testid="input-note-title"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger data-testid="select-note-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contenuto *</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Scrivi il contenuto della nota..."
                  className="min-h-[120px]"
                  data-testid="input-note-content"
                />
              </div>
              <div className="space-y-2">
                <Label>Rotta / URL di fissaggio (Opzionale)</Label>
                <Input
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="es. /corsi o /pagamenti"
                  data-testid="input-note-target-url"
                />
                <p className="text-[10px] text-muted-foreground">Se specificato, la nota apparirà come Sticky Note in sovrimpressione su quella pagina.</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm} data-testid="button-cancel-note">
                  Annulla
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!title.trim() || !content.trim() || createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-note"
                >
                  {editingNote ? "Salva Modifiche" : "Crea Nota"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground">Filtra per categoria:</span>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[160px]" data-testid="select-filter-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tutti">Tutte</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Note Attive ({filteredNotes.length})</TabsTrigger>
          <TabsTrigger value="archived">Archivio ({filteredArchivedNotes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
          ) : filteredNotes.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nessuna nota attiva trovata
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => (
                <Card
                  key={note.id}
                  className={note.isPinned ? "ring-2 ring-amber-400 dark:ring-amber-600" : ""}
                  data-testid={`card-note-${note.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base line-clamp-2" data-testid={`text-title-${note.id}`}>
                        {note.isPinned && <Pin className="w-4 h-4 inline mr-1 text-amber-500" />}
                        {note.title}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getCategoryBadge(note.category)}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(note.createdAt)}
                      </span>
                      {note.targetUrl && (
                        <Badge variant="outline" className="text-[9px] h-4 py-0 px-1 truncate max-w-[100px]" title={`Fissata in: ${note.targetUrl}`}>
                          <Pin className="w-2.5 h-2.5 mr-0.5" />
                          {note.targetUrl}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4 mb-3" data-testid={`text-content-${note.id}`}>
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground" data-testid={`text-author-${note.id}`}>
                        {note.authorName}
                      </span>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-amber-600"
                          onClick={() => handleTogglePin(note)}
                          data-testid={`button-pin-${note.id}`}
                        >
                          {note.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-primary"
                          onClick={() => handleEdit(note)}
                          data-testid={`button-edit-${note.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            if (confirm("Vuoi archiviare questa nota?")) {
                              deleteMutation.mutate(note.id);
                            }
                          }}
                          data-testid={`button-delete-${note.id}`}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archived">
          {isLoadingArchived ? (
            <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
          ) : filteredArchivedNotes.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                L'archivio è vuoto
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
              {filteredArchivedNotes.map((note) => (
                <Card key={note.id} className="bg-gray-50/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base line-clamp-2 text-muted-foreground line-through decoration-muted-foreground/50">
                        {note.title}
                      </CardTitle>
                      {getCategoryBadge(note.category)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap line-clamp-4">
                      {note.content}
                    </p>
                    {note.targetUrl && (
                      <div className="flex items-center gap-1 text-xs font-mono bg-muted p-1 rounded w-fit">
                        <Pin className="w-3 h-3" />
                        <span className="truncate max-w-[200px]">{note.targetUrl}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t mt-4">
                      <Clock className="w-3 h-3" />
                      Erano in {note.authorName} il {formatDate(note.createdAt)}
                    </div>
                    {note.deletedBy && (
                      <div className="flex items-center gap-1.5 text-[10px] text-destructive pt-1 font-semibold uppercase tracking-wider text-right w-full justify-end">
                        Archiviata da {note.deletedBy}
                      </div>
                    )}
                  </CardContent>
                  <div className="p-4 pt-0 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 w-full font-bold shadow-sm"
                      onClick={() => restoreMutation.mutate(note.id)}
                    >
                      <ArchiveRestore className="h-3.5 w-3.5 mr-2" />
                      Ripristina Nota
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
