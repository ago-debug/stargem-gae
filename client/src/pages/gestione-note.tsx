import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { StickyNote, Search, Trash2, Archive, ArchiveRestore, Plus, CheckCircle, Clock, Save, X, Edit2, PanelTop, MousePointerSquareDashed } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { cn } from "@/lib/utils";
import type { TeamNote } from "@shared/schema";

const TARGET_PAGES = [
  { value: "/", label: "Dashboard Globale" },
  { value: "/maschera-input", label: "Maschera Input Generale" },
  { value: "/anagrafica-generale", label: "Anagrafica Generale" },
  { value: "/tessere-certificati", label: "Tessere e Certificati Medici" },
  { value: "/generazione-tessere", label: "Generazione Tessere" },
  { value: "/accessi", label: "Controllo Accessi" },
  { value: "/pagamenti", label: "Lista Pagamenti / Cassa" },
  { value: "/scheda-contabile", label: "Scheda Contabile" },
  { value: "/report", label: "Report & Statistiche" },
  { value: "/attivita", label: "Tutte le Attività" },
  { value: "/attivita/corsi", label: "Corsi" },
  { value: "/attivita/workshops", label: "Workshop" },
  { value: "/calendario-attivita", label: "Calendario Attività" },
  { value: "/planning", label: "Planning Stagionale" },
  { value: "/programmazione-date", label: "Programmazione Date Master" },
  { value: "/staff", label: "Staff e Insegnanti" },
  { value: "/studios", label: "Sale / Studios" },
  { value: "/listini", label: "Listini e Quote" },
  { value: "/admin", label: "Admin Panel" },
  { value: "/utenti-permessi", label: "Utenti e Permessi" },
  { value: "/importa", label: "Importazione Dati" },
];

export default function GestioneNote() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "archived">("all");
    
    // Create Note State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newCategory, setNewCategory] = useState("generale");
    const [newTargetUrl, setNewTargetUrl] = useState("/");
    const [customTargetUrl, setCustomTargetUrl] = useState("");

    // Fetch both active and archived notes
    const { data: activeNotes = [], isLoading: loadingActive } = useQuery<TeamNote[]>({
        queryKey: ["/api/team-notes"],
        queryFn: async () => apiRequest("GET", `/api/team-notes`),
    });

    const { data: archivedNotes = [], isLoading: loadingArchived } = useQuery<TeamNote[]>({
        queryKey: ["/api/team-notes/archived"],
        queryFn: async () => apiRequest("GET", `/api/team-notes/archived`),
    });

    const allNotes = [
        ...activeNotes.map(n => ({ ...n, status: "active" as const })), 
        ...archivedNotes.map(n => ({ ...n, status: "archived" as const }))
    ];

    const filteredNotes = allNotes.filter(note => {
        const matchesSearch = (note.title || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (note.content || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (note.authorName || "").toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = filterStatus === "all" ? true : note.status === filterStatus;
        
        return matchesSearch && matchesStatus;
    });

    const { sortConfig, handleSort, sortItems, isSortedColumn } = useSortableTable<(TeamNote & { status: "active" | "archived" })>("date", "desc");

    const getSortValue = (note: TeamNote & { status: string }, key: string) => {
        switch (key) {
            case "status": return note.status === "active" ? 1 : 0;
            case "date": return new Date(note.updatedAt || note.createdAt || 0).getTime();
            case "author": return note.authorName || "";
            case "content": return (note.title || "") + " " + (note.content || "");
            case "section": return note.targetUrl || "";
            case "deletedBy": return note.deletedBy || "";
            default: return null;
        }
    };

    const sortedAndFilteredNotes = sortItems(filteredNotes, getSortValue);

    const createMutation = useMutation({
        mutationFn: async (data: any) => apiRequest("POST", "/api/team-notes", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/team-notes"] });
            setIsCreateOpen(false);
            setNewTitle("");
            setNewContent("");
            setNewTargetUrl("/");
            toast({ title: "Nota creata e assegnata con successo" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => apiRequest("DELETE", `/api/team-notes/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/team-notes"] });
            queryClient.invalidateQueries({ queryKey: ["/api/team-notes/archived"] });
            toast({ title: "Nota archiviata" });
        },
    });

    const restoreMutation = useMutation({
        mutationFn: async (id: number) => apiRequest("POST", `/api/team-notes/${id}/restore`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/team-notes"] });
            queryClient.invalidateQueries({ queryKey: ["/api/team-notes/archived"] });
            toast({ title: "Nota ripristinata e attiva" });
        },
    });

    const handleCreateNote = () => {
        if (!newContent.trim()) return;
        createMutation.mutate({
            title: newTitle.trim() || `Nota per ${TARGET_PAGES.find(p => p.value === newTargetUrl)?.label || "Pagina"}`,
            content: newContent.trim(),
            category: newCategory,
            targetUrl: customTargetUrl.trim() || newTargetUrl,
        });
    };

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-slate-50/50 min-h-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <StickyNote 
                            className="w-8 h-8" 
                            style={{ 
                                color: '#D4AF37', 
                                filter: 'drop-shadow(0px 2px 3px rgba(212, 175, 55, 0.4))'
                            }} 
                        />
                        Gestione Note & Storico
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Pannello di controllo per tutte le note volanti del gestionale. Da qui puoi revisionare lo storico o assegnare una nuova nota a una schermata specifica.
                    </p>
                </div>
                
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-br from-[#FFD700] via-[#D4AF37] to-[#B8860B] shadow-[0_4px_12px_rgba(212,175,55,0.4)] text-white hover:from-[#F0E68C] border-none font-semibold transition-all">
                            <Plus className="w-4 h-4 mr-2" />
                            Crea Nota
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <PanelTop 
                                    className="w-5 h-5" 
                                    style={{ 
                                        color: '#D4AF37', 
                                        filter: 'drop-shadow(0px 2px 3px rgba(212, 175, 55, 0.4))'
                                    }} 
                                />
                                Nuova Nota Assegnata
                            </DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Sezione / Pagina Bersaglio</label>
                                <Select value={newTargetUrl} onValueChange={setNewTargetUrl}>
                                    <SelectTrigger className="w-full bg-slate-50 border-slate-200">
                                        <div className="flex items-center gap-2">
                                            <MousePointerSquareDashed className="w-4 h-4 text-slate-400" />
                                            <SelectValue placeholder="Scegli la pagina..." />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TARGET_PAGES.map(page => (
                                            <SelectItem key={page.value} value={page.value}>{page.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input 
                                    className="mt-2 text-xs" 
                                    placeholder="Oppure incolla un URL personalizzato (es: /utente/1)..." 
                                    value={customTargetUrl}
                                    onChange={e => setCustomTargetUrl(e.target.value)}
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">La nota comparirà sulla campanella (puntina in alto a destra) unicamente nella pagina selezionata.</p>
                            </div>
                            
                            <div className="flex gap-3">
                                <div className="space-y-2 flex-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Titolo (Opzionale)</label>
                                    <Input 
                                        placeholder="Titolo breve..." 
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 w-1/3">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Tipologia</label>
                                    <Select value={newCategory} onValueChange={setNewCategory}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="generale">Generale</SelectItem>
                                            <SelectItem value="problema">Problema</SelectItem>
                                            <SelectItem value="idea">Idea</SelectItem>
                                            <SelectItem value="urgente">Urgente</SelectItem>
                                            <SelectItem value="promemoria">Promemoria</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Corpo della Nota</label>
                                <Textarea 
                                    className="min-h-[120px] resize-none"
                                    placeholder="Scrivi qui il contenuto della nota..."
                                    value={newContent}
                                    onChange={e => setNewContent(e.target.value)}
                                />
                            </div>
                            
                            <Button 
                                className="w-full bg-gradient-to-br from-[#FFD700] via-[#D4AF37] to-[#B8860B] shadow-[0_4px_12px_rgba(212,175,55,0.4)] text-white hover:from-[#F0E68C] border-none font-semibold transition-all mt-2" 
                                onClick={handleCreateNote}
                                disabled={!newContent.trim() || createMutation.isPending}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Salva e Assegna
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-xl shadow-slate-200/50">
                <CardHeader className="bg-white border-b px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Tabs value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)} className="w-[300px]">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="all">Tutte</TabsTrigger>
                                <TabsTrigger value="active">Attive</TabsTrigger>
                                <TabsTrigger value="archived">Chiuse</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                    
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cerca nelle note..."
                            className="pl-8 bg-slate-50 border-slate-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                
                <CardContent className="p-0 bg-white">
                    {(loadingActive || loadingArchived) ? (
                        <div className="flex items-center justify-center h-64 text-slate-400 gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500" />
                            Caricamento storico...
                        </div>
                    ) : filteredNotes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
                            <Archive className="w-12 h-12 text-slate-200 mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 mb-1">Nessuna nota trovata</h3>
                            <p className="text-sm">Non ci sono note che corrispondono ai filtri selezionati.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow>
                                        <SortableTableHead sortKey="status" currentSort={sortConfig} onSort={handleSort} className="w-[100px]">Stato</SortableTableHead>
                                        <SortableTableHead sortKey="date" currentSort={sortConfig} onSort={handleSort} className="w-[150px]">Data</SortableTableHead>
                                        <SortableTableHead sortKey="author" currentSort={sortConfig} onSort={handleSort} className="w-[150px]">Autore</SortableTableHead>
                                        <SortableTableHead sortKey="content" currentSort={sortConfig} onSort={handleSort}>Contenuto & Categoria</SortableTableHead>
                                        <SortableTableHead sortKey="section" currentSort={sortConfig} onSort={handleSort} className="w-[180px]">Sezione (URL)</SortableTableHead>
                                        <SortableTableHead sortKey="deletedBy" currentSort={sortConfig} onSort={handleSort} className="w-[150px]">Archiviata da</SortableTableHead>
                                        <TableHead className="text-right w-[80px]">Azioni</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedAndFilteredNotes.map((note) => (
                                        <TableRow key={`${note.id}-${note.status}`} className="group hover:bg-amber-50/30 transition-colors">
                                            <TableCell className={cn(isSortedColumn("status") && "sorted-column-cell")}>
                                                {note.status === "active" ? (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> Attiva
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200">
                                                        <Archive className="w-3 h-3 mr-1" /> Chiusa
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className={cn("text-xs text-slate-500 font-medium", isSortedColumn("date") && "sorted-column-cell")}>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1" title="Data di creazione">
                                                        <Clock className="w-3 h-3 text-slate-400" />
                                                        {note.createdAt ? format(new Date(note.createdAt), "dd MMM yy, HH:mm", { locale: it }) : "-"}
                                                    </div>
                                                    {note.updatedAt && note.updatedAt !== note.createdAt && (
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-400" title="Ultima modifica/aggiornamento">
                                                            Mod: {format(new Date(note.updatedAt), "dd MMM yy, HH:mm", { locale: it })}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className={cn(isSortedColumn("author") && "sorted-column-cell")}>
                                                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                                                    {note.authorName}
                                                </span>
                                            </TableCell>
                                            <TableCell className={cn(isSortedColumn("content") && "sorted-column-cell")}>
                                                <div className="flex flex-col gap-1 pr-4">
                                                    {(note.title || note.category !== "generale") && (
                                                        <div className="flex items-center">
                                                            <span className="text-[10px] bg-amber-100/50 text-amber-800 px-1.5 py-0.5 rounded uppercase font-semibold">
                                                                {note.title || note.category}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap leading-snug">
                                                        {note.content}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className={cn(isSortedColumn("section") && "sorted-column-cell")}>
                                                <Link href={note.targetUrl || "/"} className="hover:opacity-80 transition-opacity">
                                                    <Badge variant="secondary" className="bg-slate-100/80 text-slate-600 text-[10px] font-mono border-slate-200 cursor-pointer hover:bg-amber-100 hover:text-amber-800" title={`Vai a: ${note.targetUrl || "/"}`}>
                                                        {TARGET_PAGES.find(p => p.value === note.targetUrl)?.label || note.targetUrl || "Generale"}
                                                    </Badge>
                                                </Link>
                                            </TableCell>
                                            <TableCell className={cn(isSortedColumn("deletedBy") && "sorted-column-cell")}>
                                                {note.status === "archived" && note.deletedBy && (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-xs font-bold text-slate-500 uppercase">{note.deletedBy}</span> 
                                                        {note.deletedAt && <span className="text-[10px] text-slate-400">{format(new Date(note.deletedAt), "dd/MM/yyyy HH:mm")}</span>}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {note.status === "active" ? (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="text-slate-400 hover:text-amber-600 hover:bg-amber-50 h-8"
                                                        onClick={() => deleteMutation.mutate(note.id)}
                                                        title="Archivia/Chiudi Nota"
                                                    >
                                                        <Archive className="w-4 h-4" />
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="text-slate-400 hover:text-green-600 hover:bg-green-50 h-8"
                                                        onClick={() => restoreMutation.mutate(note.id)}
                                                        title="Ripristina Nota"
                                                    >
                                                        <ArchiveRestore className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
