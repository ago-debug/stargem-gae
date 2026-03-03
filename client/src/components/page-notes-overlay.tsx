import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Trash2, Send, X, Plus, Sparkles, ChevronUp, ChevronDown, Edit2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { TeamNote } from "@shared/schema";

export function PageNotesOverlay() {
    const [location] = useLocation();
    const targetUrl = location.split('?')[0].split('#')[0];
    const { user } = useAuth();
    const { toast } = useToast();

    const [isOpen, setIsOpen] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newCategory, setNewCategory] = useState("generale");

    // Track which notes are minimized
    const [minimizedNotes, setMinimizedNotes] = useState<Set<number>>(new Set());

    // Track which note is currently being edited
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState("");

    const CATEGORIES = [
        { value: "generale", label: "Generale" },
        { value: "problema", label: "Problema" },
        { value: "idea", label: "Idea" },
        { value: "urgente", label: "Urgente" },
        { value: "promemoria", label: "Promemoria" },
    ];

    const { data: notes = [] } = useQuery<TeamNote[]>({
        queryKey: ["/api/team-notes", targetUrl],
        queryFn: async () => {
            return apiRequest("GET", `/api/team-notes?targetUrl=${encodeURIComponent(targetUrl)}`);
        },
        enabled: !!targetUrl,
    });

    useEffect(() => {
        const handleToggle = (e: any) => {
            const shouldOpenAdding = e.detail?.openAdding;
            setIsOpen((prev) => shouldOpenAdding ? true : !prev);
            if (shouldOpenAdding) {
                setIsAdding(true);
            }
        };
        document.addEventListener('toggle-page-notes-overlay', handleToggle);
        return () => document.removeEventListener('toggle-page-notes-overlay', handleToggle);
    }, []);

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            return apiRequest("POST", "/api/team-notes", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/team-notes"] });
            queryClient.invalidateQueries({ queryKey: ["/api/team-notes", targetUrl] });
            setIsAdding(false);
            setNewTitle("");
            setNewContent("");
            setNewCategory("generale");
            toast({ title: "Nota aggiunta alla pagina" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            return apiRequest("DELETE", `/api/team-notes/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/team-notes"] });
            queryClient.invalidateQueries({ queryKey: ["/api/team-notes", targetUrl] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number, data: Partial<TeamNote> }) => {
            return apiRequest("PATCH", `/api/team-notes/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/team-notes"] });
            queryClient.invalidateQueries({ queryKey: ["/api/team-notes", targetUrl] });
            setEditingNoteId(null);
            toast({ title: "Nota aggiornata" });
        },
    });

    const copilotMutation = useMutation({
        mutationFn: async (context: any) => {
            return apiRequest("POST", "/api/copilot/generate-note", context);
        },
        onSuccess: (data) => {
            setNewContent(data.suggestion);
            toast({ title: "CoPilot ha generato una bozza!" });
        },
    });

    const handleCreateNote = () => {
        if (!newContent.trim()) return;
        createMutation.mutate({
            title: newTitle.trim() || `Nota in ${targetUrl}`,
            content: newContent.trim(),
            category: newCategory,
            targetUrl,
        });
    };

    const handleCopilot = () => {
        // Collect some visible data context
        const pageContext = document.body.innerText.substring(0, 1000);
        copilotMutation.mutate({ targetUrl, pageContext });
    };

    const toggleMinimize = (id: number) => {
        setMinimizedNotes(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const startEditing = (note: TeamNote) => {
        setEditingNoteId(note.id);
        setEditContent(note.content);
        // Expand if minimized when editing
        setMinimizedNotes(prev => {
            const next = new Set(prev);
            next.delete(note.id);
            return next;
        });
    };

    const saveEdit = (id: number) => {
        if (!editContent.trim()) return;
        updateMutation.mutate({ id, data: { content: editContent.trim() } });
    };

    if (!isOpen && !isAdding) {
        return null;
    }

    // Hide overlay completely if no notes, except if adding
    if (notes.length === 0 && !isAdding) {
        return null;
    }

    return (
        <div className="fixed top-14 right-4 z-[40] flex flex-col gap-3 w-64 md:w-72 max-h-[calc(100vh-5rem)] overflow-y-auto pr-1 pb-4">
            {/* List of notes */}
            {notes.map((note) => {
                const isMinimized = minimizedNotes.has(note.id);
                const isEditing = editingNoteId === note.id;
                const canEditDelete = user?.id === note.authorId || user?.role === 'admin';

                return (
                    <div
                        key={note.id}
                        className={`relative bg-gradient-to-br from-yellow-50 to-orange-50 border border-amber-200/50 shadow-[2px_3px_10px_rgba(0,0,0,0.12)] rounded px-3 py-2 flex flex-col group transform transition-all ${isMinimized ? 'h-10 overflow-hidden opacity-80 hover:opacity-100' : 'hover:-translate-y-0.5'}`}
                    >
                        {note.isPinned && (
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-500 shadow-sm border border-red-700/20 z-10" />
                        )}
                        <div className="flex justify-between items-start mb-1.5 pb-1 border-b border-amber-100 cursor-pointer" onClick={(e) => {
                            if ((e.target as HTMLElement).closest('button')) return;
                            toggleMinimize(note.id);
                        }}>
                            <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider font-mono truncate max-w-[130px]" title={note.title || note.category || 'Generale'}>
                                {note.authorName} ({note.title || note.category || 'Generale'})
                            </span>
                            <div className="flex gap-1 items-center bg-yellow-50/50 px-1 rounded">
                                <span className="text-[9px] text-amber-700/70 mr-1">
                                    {note.createdAt ? format(new Date(note.createdAt), "dd MMM", { locale: it }) : ''}
                                </span>

                                {/* Action buttons */}
                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    {canEditDelete && !isEditing && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); startEditing(note); }}
                                            className="text-amber-600 hover:text-amber-800 transition-colors"
                                            title="Modifica nota"
                                        >
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                    )}
                                    {canEditDelete && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(note.id); }}
                                            className="text-amber-600 hover:text-red-500 transition-colors"
                                            title="Elimina nota"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleMinimize(note.id); }}
                                        className="text-amber-600 hover:text-amber-900 transition-colors ml-0.5"
                                        title={isMinimized ? "Espandi" : "Riduci"}
                                    >
                                        {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {!isMinimized && (
                            isEditing ? (
                                <div className="flex flex-col gap-2 mt-1 animate-in fade-in">
                                    <Textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="min-h-[80px] text-xs resize-none bg-white/80 border-amber-300 focus-visible:ring-amber-400"
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-1">
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-stone-400 hover:text-stone-600" onClick={() => setEditingNoteId(null)}>
                                            <X className="w-3 h-3" />
                                        </Button>
                                        <Button size="sm" className="h-6 px-2 text-[10px] bg-amber-500 hover:bg-amber-600" onClick={() => saveEdit(note.id)} disabled={updateMutation.isPending || !editContent.trim()}>
                                            <Save className="w-3 h-3 mr-1" /> Salva
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs font-semibold text-amber-950/90 leading-snug whitespace-pre-wrap break-words mt-0.5" onDoubleClick={() => canEditDelete && startEditing(note)}>
                                    {note.content}
                                </p>
                            )
                        )}
                    </div>
                );
            })}

            {/* Add New Note inline */}
            {isAdding && (
                <div className="bg-white border shadow-xl shadow-amber-900/10 rounded-lg p-3 flex flex-col gap-3 relative mt-2 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-2">
                        <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Titolo (opzionale)..."
                            className="h-8 text-xs font-medium flex-1"
                        />
                        <Select value={newCategory} onValueChange={setNewCategory}>
                            <SelectTrigger className="h-8 w-[100px] text-[10px] border-amber-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="Scrivi una nota per il team..."
                        className="min-h-[100px] text-xs resize-none"
                    />
                    <div className="flex items-center justify-between mt-1">
                        <div className="flex gap-1 items-center">
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-stone-400 hover:text-red-500 hover:bg-stone-100" onClick={() => setIsAdding(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2.5 text-[10px] text-indigo-600 gap-1.5 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 hover:text-indigo-700"
                                onClick={handleCopilot}
                                disabled={copilotMutation.isPending}
                            >
                                <Sparkles className="w-3 h-3" />
                                {copilotMutation.isPending ? "Generando..." : "CoPilot"}
                            </Button>
                        </div>
                        <Button size="sm" className="h-7 px-3 text-xs bg-amber-500 hover:bg-amber-600 text-white" onClick={handleCreateNote} disabled={createMutation.isPending || !newContent.trim()}>
                            <Send className="w-3 h-3 mr-1.5" /> Fissa
                        </Button>
                    </div>
                </div>
            )}

            {!isAdding && (
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/90 hover:bg-amber-50 text-xs text-amber-700/80 hover:text-amber-800 w-full py-1 h-8 border-dashed border-2 border-amber-200 transition-all flex items-center justify-center gap-1.5 shadow-sm mt-1 mx-auto max-w-[90%]"
                    onClick={() => setIsAdding(true)}
                >
                    <Plus className="w-3.5 h-3.5" /> Nuova Nota Qui
                </Button>
            )}
        </div>
    );
}
