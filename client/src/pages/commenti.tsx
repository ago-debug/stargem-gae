import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MessageSquarePlus, Send, CheckCircle2, AlertTriangle, Clock, Trash2, Check, Sparkles, Edit2, Reply, X, Archive, ArchiveRestore } from "lucide-react";
import type { TeamComment, User } from "@shared/schema";

export default function Commenti() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [priority, setPriority] = useState("normale");
  const [assignedTo, setAssignedTo] = useState("Tutti");
  const [activeTab, setActiveTab] = useState("attivi");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyAssignedTo, setReplyAssignedTo] = useState("Tutti");
  const [filterPriority, setFilterPriority] = useState<string>("tutti");

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: comments = [], isLoading } = useQuery<TeamComment[]>({
    queryKey: ["/api/team-comments"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { content: string; priority: string; assignedTo: string; parentId?: number }) => {
      return apiRequest("POST", "/api/team-comments", data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-notifications/unread-count"] });

      if (variables.parentId) {
        setReplyingToId(null);
        setReplyContent("");
        setReplyAssignedTo("Tutti");
      } else {
        setNewComment("");
        setPriority("normale");
        setAssignedTo("Tutti");
      }
      toast({ title: variables.parentId ? "Risposta inviata" : "Commento inviato" });
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
      queryClient.invalidateQueries({ queryKey: ["/api/team-notifications/unread-count"] });
    },
  });

  const copilotMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/copilot/generate-note", {
        targetUrl: window.location.pathname,
        pageContext: "Generazione commento automatico di test."
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.suggestion) {
        setNewComment(prev => prev ? `${prev}\n\n${data.suggestion}` : data.suggestion);
      }
      toast({ title: "Suggerimento CoPilot generato" });
    },
    onError: () => {
      toast({ title: "Errore CoPilot", description: "Non sono riuscito a generare un'idea", variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: async (data: { id: number; content: string }) => {
      return apiRequest("PATCH", `/api/team-comments/${data.id}`, { content: data.content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-comments"] });
      setEditingCommentId(null);
      setEditContent("");
      toast({ title: "Commento modificato" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile modificare il commento", variant: "destructive" });
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

  const handleReply = (comment: TeamComment) => {
    setReplyingToId(comment.id);
    setReplyAssignedTo(comment.authorId);
    setReplyContent(`@${comment.authorName} `);
  };

  const handleReplySubmit = (parentId: number) => {
    if (!replyContent.trim()) return;
    createMutation.mutate({ content: replyContent.trim(), priority: "normale", assignedTo: replyAssignedTo, parentId });
  };

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    createMutation.mutate({ content: newComment.trim(), priority, assignedTo, parentId: undefined });
  };

  // Divide between parent comments and replies
  const parentComments = comments.filter(c => !c.parentId);
  const replies = comments.filter(c => !!c.parentId);

  const getAssignedName = (assignedToId: string | null) => {
    if (!assignedToId || assignedToId === "Tutti") return "Tutti";
    const u = users.find(user => String(user.id) === assignedToId);
    if (!u) return "Sconosciuto";
    return (u.firstName || u.lastName) ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : u.username;
  };

  const filteredParents = parentComments.filter((c) => {
    if (filterPriority !== "tutti" && c.priority !== filterPriority) return false;
    if (activeTab === "attivi" && c.isResolved) return false;
    if (activeTab === "archivio" && !c.isResolved) return false;
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
              <span className="text-sm text-muted-foreground mr-1">Invia a:</span>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className="w-[180px]" data-testid="select-assigned-to">
                  <SelectValue placeholder="Scegli destinatario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tutti">Tutto il Team</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.firstName || u.lastName ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : u.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 ml-4">
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
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                className="border-blue-300 hover:bg-blue-50 text-blue-700 font-medium"
                onClick={() => copilotMutation.mutate()}
                disabled={copilotMutation.isPending}
                data-testid="button-copilot"
              >
                <Sparkles className="w-4 h-4 mr-2 text-blue-500" />
                {copilotMutation.isPending ? "Analizzo..." : "CoPilot"}
              </Button>
              <Button
                className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 text-amber-950 hover:from-amber-300 hover:to-amber-600 border border-amber-300 shadow-sm transition-all"
                onClick={handleSubmit}
                disabled={!newComment.trim() || createMutation.isPending}
                data-testid="button-send-comment"
              >
                <Send className="w-4 h-4 mr-2" />
                {createMutation.isPending ? "Invio..." : "Invia"}
              </Button>
            </div>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white rounded-md shadow-sm">
          <TabsList className="grid w-[200px] grid-cols-2">
            <TabsTrigger value="attivi">Attivi</TabsTrigger>
            <TabsTrigger value="archivio">Archivio</TabsTrigger>
          </TabsList>
        </Tabs>
        <span className="text-sm text-muted-foreground ml-auto">
          {filteredParents.length} discussioni
        </span>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
      ) : filteredParents.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nessun commento trovato
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredParents.map((comment) => {
            const threadReplies = replies.filter(r => r.parentId === comment.id).sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());

            return (
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
                          {comment.authorName} &rarr; <span className="font-bold text-slate-700">{getAssignedName(comment.assignedTo)}</span>
                        </span>
                        {getPriorityBadge(comment.priority)}
                        {comment.isResolved && (
                          <Badge className="bg-slate-500 text-white border-slate-600" data-testid={`badge-resolved-${comment.id}`}>
                            <Archive className="w-3 h-3 mr-1" />Archiviato
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="mt-2 space-y-2 w-full pr-4">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[60px]"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => editMutation.mutate({ id: comment.id, content: editContent })} disabled={editMutation.isPending}>Salva</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingCommentId(null)}>Annulla</Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap mt-1" data-testid={`text-content-${comment.id}`}>
                          {comment.content}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 pt-2 border-t mt-3 sm:border-0 sm:mt-0 sm:pt-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleReply(comment)}
                        title="Rispondi"
                        data-testid={`button-reply-${comment.id}`}
                      >
                        <Reply className="w-4 h-4 text-blue-600 opacity-80 hover:opacity-100" />
                      </Button>

                      {comment.authorId === String(user?.id) && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditContent(comment.content);
                          }}
                          title="Modifica"
                          data-testid={`button-edit-${comment.id}`}
                        >
                          <Edit2 className="w-4 h-4 text-slate-600 opacity-80 hover:opacity-100" />
                        </Button>
                      )}
                      {!comment.isResolved && (
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:from-slate-200 hover:to-slate-300 border border-slate-300 shadow-sm transition-all"
                          onClick={() => resolveMutation.mutate({ id: comment.id, isResolved: true })}
                          data-testid={`button-resolve-${comment.id}`}
                        >
                          <Archive className="w-3 h-3 mr-1" /> Archivia
                        </Button>
                      )}
                      {comment.isResolved && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => resolveMutation.mutate({ id: comment.id, isResolved: false })}
                          title="Ripristina dall'archivio"
                          data-testid={`button-reopen-${comment.id}`}
                        >
                          <ArchiveRestore className="w-4 h-4 text-slate-500 hover:text-slate-700" />
                        </Button>
                      )}
                      {comment.authorId === String(user?.id) && (
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

                  {/* Sezione Risposte Container */}
                  {threadReplies.length > 0 && (
                    <div className="mt-4 ml-8 pl-4 border-l-2 space-y-3">
                      {threadReplies.map((reply) => (
                        <div key={reply.id} className="flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-medium text-sm text-slate-800">
                              {reply.authorName} &rarr; <span className="font-bold text-slate-700">{getAssignedName(reply.assignedTo)}</span>
                            </span>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(reply.createdAt)}
                            </span>
                          </div>
                          {editingCommentId === reply.id ? (
                            <div className="mt-1 space-y-2 w-full pr-4">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-[50px] text-sm"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => editMutation.mutate({ id: reply.id, content: editContent })} disabled={editMutation.isPending}>Salva</Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingCommentId(null)}>Annulla</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start group">
                              <p className="text-sm whitespace-pre-wrap text-slate-700">
                                {reply.content}
                              </p>
                              {reply.authorId === String(user?.id) && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingCommentId(reply.id); setEditContent(reply.content); }}>
                                    <Edit2 className="w-3 h-3 text-slate-500" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { if (confirm("Eliminare questa risposta?")) deleteMutation.mutate(reply.id); }}>
                                    <Trash2 className="w-3 h-3 text-destructive" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Reply Box */}
                  {replyingToId === comment.id && (
                    <div className="mt-4 ml-8 pl-4 border-l-2 space-y-3 p-3 bg-muted/30 rounded-md">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-600">Risposta:</span>
                        <Button size="icon" variant="ghost" className="h-5 w-5 hover:bg-transparent" onClick={() => setReplyingToId(null)}>
                          <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Scrivi una risposta..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="min-h-[60px] text-sm bg-white"
                        autoFocus
                      />
                      <div className="flex items-center justify-between gap-3">
                        <Select value={replyAssignedTo} onValueChange={setReplyAssignedTo}>
                          <SelectTrigger className="w-[140px] h-8 text-xs bg-white">
                            <SelectValue placeholder="Destinatario" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Tutti">Tutto il Team</SelectItem>
                            {users.map((u) => (
                              <SelectItem key={u.id} value={String(u.id)}>
                                {u.firstName || u.lastName ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : u.username}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleReplySubmit(comment.id)}
                          disabled={!replyContent.trim() || createMutation.isPending}
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Rispondi
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
