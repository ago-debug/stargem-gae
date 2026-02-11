import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MessageSquarePlus, Send, CheckCircle2, AlertTriangle, Clock, Trash2, Check } from "lucide-react";
import type { TeamComment } from "@shared/schema";

export default function Commenti() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [priority, setPriority] = useState("normale");
  const [filterPriority, setFilterPriority] = useState<string>("tutti");
  const [filterResolved, setFilterResolved] = useState<string>("tutti");

  const { data: comments = [], isLoading } = useQuery<TeamComment[]>({
    queryKey: ["/api/team-comments"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { content: string; priority: string }) => {
      return apiRequest("POST", "/api/team-comments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-notifications/unread-count"] });
      setNewComment("");
      setPriority("normale");
      toast({ title: "Commento inviato" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile inviare il commento", variant: "destructive" });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, isResolved }: { id: number; isResolved: boolean }) => {
      return apiRequest("PATCH", `/api/team-comments/${id}`, { isResolved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-comments"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/team-comments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-comments"] });
      toast({ title: "Commento eliminato" });
    },
  });

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    createMutation.mutate({ content: newComment.trim(), priority });
  };

  const filteredComments = comments.filter((c) => {
    if (filterPriority !== "tutti" && c.priority !== filterPriority) return false;
    if (filterResolved === "aperti" && c.isResolved) return false;
    if (filterResolved === "risolti" && !c.isResolved) return false;
    return true;
  });

  const getPriorityBadge = (p: string | null) => {
    switch (p) {
      case "urgente":
        return <Badge variant="destructive" data-testid="badge-priority-urgente"><AlertTriangle className="w-3 h-3 mr-1" />Urgente</Badge>;
      case "alta":
        return <Badge className="bg-orange-500 text-white border-orange-600" data-testid="badge-priority-alta">Alta</Badge>;
      case "normale":
      default:
        return <Badge variant="secondary" data-testid="badge-priority-normale">Normale</Badge>;
      case "bassa":
        return <Badge variant="outline" data-testid="badge-priority-bassa">Bassa</Badge>;
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-commenti">
      <div className="flex items-center gap-3">
        <MessageSquarePlus className="w-6 h-6 sidebar-icon-gold" />
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Commenti Team</h1>
      </div>

      <Card data-testid="card-new-comment">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Nuovo Commento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Scrivi un commento per il team..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
            data-testid="input-comment-content"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Priorità:</span>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-[140px]" data-testid="select-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bassa">Bassa</SelectItem>
                  <SelectItem value="normale">Normale</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || createMutation.isPending}
              data-testid="button-send-comment"
            >
              <Send className="w-4 h-4 mr-2" />
              {createMutation.isPending ? "Invio..." : "Invia"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground">Filtra:</span>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[140px]" data-testid="select-filter-priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tutti">Tutte priorità</SelectItem>
            <SelectItem value="urgente">Urgente</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="normale">Normale</SelectItem>
            <SelectItem value="bassa">Bassa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterResolved} onValueChange={setFilterResolved}>
          <SelectTrigger className="w-[140px]" data-testid="select-filter-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tutti">Tutti</SelectItem>
            <SelectItem value="aperti">Aperti</SelectItem>
            <SelectItem value="risolti">Risolti</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">
          {filteredComments.length} commenti
        </span>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
      ) : filteredComments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nessun commento trovato
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredComments.map((comment) => (
            <Card
              key={comment.id}
              className={comment.isResolved ? "opacity-60" : ""}
              data-testid={`card-comment-${comment.id}`}
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-medium text-sm" data-testid={`text-author-${comment.id}`}>
                        {comment.authorName}
                      </span>
                      {getPriorityBadge(comment.priority)}
                      {comment.isResolved && (
                        <Badge className="bg-green-500 text-white border-green-600" data-testid={`badge-resolved-${comment.id}`}>
                          <CheckCircle2 className="w-3 h-3 mr-1" />Risolto
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap" data-testid={`text-content-${comment.id}`}>
                      {comment.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => resolveMutation.mutate({ id: comment.id, isResolved: !comment.isResolved })}
                      title={comment.isResolved ? "Riapri" : "Segna come risolto"}
                      data-testid={`button-resolve-${comment.id}`}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    {comment.authorId === user?.id && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Eliminare questo commento?")) {
                            deleteMutation.mutate(comment.id);
                          }
                        }}
                        data-testid={`button-delete-${comment.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
