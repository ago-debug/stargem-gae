import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Database, Search, LayoutTemplate, Layers, LayoutList, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

type FlagComment = { id: string; type: 'colonna'|'riga'; table: string; ref: string; reason: string; data?: any };

interface DbStat {
  table: string;
  columnCount: number;
  rowCount: number;
  columns: { name: string; type: string; recordCount: number }[];
}

import { tableTranslations, columnMappings } from "@/config/db-monitor-mapping";

export default function DbMonitor() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [expandedTable, setExpandedTable] = React.useState<string | null>(null);
  
  const { toast } = useToast();
  const [flagDialog, setFlagDialog] = React.useState<{ isOpen: boolean; type: 'colonna'|'riga'; table: string; ref: string; data?: any }>({ isOpen: false, type: 'colonna', table: '', ref: '' });
  const [flagReason, setFlagReason] = React.useState("");

  const [localComments, setLocalComments] = React.useState<{pending: FlagComment[], sent: FlagComment[]}>({ pending: [], sent: [] });

  React.useEffect(() => {
    const saved = localStorage.getItem('db_monitor_flags');
    if (saved) {
      try { setLocalComments(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveLocalComments = (newComments: {pending: FlagComment[], sent: FlagComment[]}) => {
    setLocalComments(newComments);
    localStorage.setItem('db_monitor_flags', JSON.stringify(newComments));
  };

  const handleSaveDraft = () => {
    if (!flagReason) return;
    const newComment: FlagComment = {
      id: `${flagDialog.table}_${flagDialog.type}_${flagDialog.ref}`,
      type: flagDialog.type,
      table: flagDialog.table,
      ref: flagDialog.ref,
      reason: flagReason,
      data: flagDialog.data
    };
    
    const newPending = localComments.pending.filter(c => c.id !== newComment.id);
    newPending.push(newComment);
    
    saveLocalComments({ ...localComments, pending: newPending });
    setFlagDialog(prev => ({ ...prev, isOpen: false }));
    setFlagReason("");
  };

  const flagBatchMutation = useMutation({
    mutationFn: async (flags: FlagComment[]) => await apiRequest("POST", "/api/admin/db-monitor/flag-batch", { flags }),
    onSuccess: (_, variables) => {
      toast({ title: "Report Inviato", description: `${variables.length} commenti salvati per Antigravity.` });
      
      const newSent = [...localComments.sent];
      for (const pending of variables) {
        if (!newSent.find(s => s.id === pending.id)) {
          newSent.push(pending);
        }
      }
      saveLocalComments({ pending: [], sent: newSent });
    },
    onError: () => toast({ title: "Errore", description: "Impossibile inviare il report.", variant: "destructive" })
  });

  const openFlagDialog = (type: 'colonna'|'riga', table: string, ref: string, data?: any) => {
    const id = `${table}_${type}_${ref}`;
    const existing = localComments.pending.find(c => c.id === id) || localComments.sent.find(c => c.id === id);
    setFlagReason(existing ? existing.reason : "");
    setFlagDialog({ isOpen: true, type, table, ref, data });
  };

  const { data: stats, isLoading, error } = useQuery<DbStat[]>({
    queryKey: ["/api/admin/db-monitor"],
    refetchInterval: 10000, // Refresh every 10 seconds as requested
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Database className="h-8 w-8 animate-pulse" />
          <p>Scansione database in corso...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>Errore di connessione al database monitor.</p>
      </div>
    );
  }

  const filteredStats = stats
    .filter(s => 
      s.table.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.columns.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tableTranslations[s.table] && tableTranslations[s.table].toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => a.table.localeCompare(b.table));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            Database Monitor
          </h1>
          <p className="text-muted-foreground mt-1">
            Strato 1 & 3 — Visualizzazione in tempo reale e Mappatura Frontend.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Cerca tabella, colonna o termine..." 
            className="pl-9 bg-background shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-full text-blue-600 dark:text-blue-400">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Tabelle Totali</p>
              <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-full text-emerald-600 dark:text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Colonne Totali</p>
              <h3 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {stats.reduce((acc, curr) => acc + curr.columnCount, 0)}
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-full text-amber-600 dark:text-amber-400">
              <LayoutList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Record Totali</p>
              <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                {stats.reduce((acc, curr) => acc + curr.rowCount, 0)}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredStats.map((stat) => {
          const tableNameIta = tableTranslations[stat.table];
          const tableColsMap = columnMappings[stat.table] || {};
          
          return (
            <Card key={stat.table} className="overflow-hidden shadow-sm hover:shadow-md transition-all">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value={stat.table} className="border-none">
                  <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex flex-col items-start gap-1">
                        <h3 className="text-lg font-bold">
                          {stat.table}
                        </h3>
                        {tableNameIta && (
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-sm">
                            {tableNameIta}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        <Button 
                           variant="outline" 
                           size="sm" 
                           className="h-6 px-2 text-xs" 
                           onClick={(e) => { e.stopPropagation(); setExpandedTable(stat.table); }}
                        >
                          <LayoutList className="w-3 h-3 mr-1" />
                          Esplodi
                        </Button>
                        <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                          {stat.columnCount} Colonne
                        </Badge>
                        <Badge variant="secondary" className={stat.rowCount === 0 ? "opacity-50" : "bg-primary/10 text-primary"}>
                          {stat.rowCount} Record
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5">
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-md border p-4 mt-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex justify-between">
                        <span>Struttura Colonne ({stat.columnCount})</span>
                        <span className="text-emerald-600 dark:text-emerald-500 text-[10px]">Mappatura Frontend Live</span>
                      </p>
                      <ScrollArea className="h-[250px] w-full">
                        <div className="flex flex-col gap-2 pr-4">
                          {stat.columns.map(colObj => {
                            const colName = colObj.name;
                            const colType = colObj.type;
                            const mapping = tableColsMap[colName];
                            const isHighlighted = searchTerm && (
                              colName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              colType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (mapping?.label.toLowerCase().includes(searchTerm.toLowerCase()))
                            );

                            return (
                              <div 
                                key={colName} 
                                className={`flex flex-col sm:flex-row sm:items-center justify-between text-sm px-3 py-2 border-b last:border-0 rounded-sm ${
                                  isHighlighted 
                                    ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800' 
                                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                                }`}
                              >
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{colName}</span>
                                  <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-sm border border-blue-100 dark:border-blue-900">{colType}</span>
                                  <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-sm border border-amber-100 dark:border-amber-900">{colObj.recordCount} {colObj.recordCount === 1 ? 'record' : 'record'}</span>
                                  {mapping && (
                                    <Badge variant="secondary" className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
                                      {mapping.label}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 sm:mt-0 flex items-center gap-1">
                                  {mapping ? (
                                    <>
                                      <span className="opacity-70">📍</span> 
                                      <span className="truncate max-w-[200px]" title={mapping.location}>{mapping.location}</span>
                                    </>
                                  ) : (
                                    <span className="opacity-40 italic">Dato tecnico / Non mappato</span>
                                  )}
                                  {(() => {
                                      const commentId = `${stat.table}_colonna_${colName}`;
                                      const pendingComment = localComments.pending.find(c => c.id === commentId);
                                      const sentComment = localComments.sent.find(c => c.id === commentId);
                                      const commentObj = pendingComment || sentComment;
                                      
                                      const btnClass = pendingComment ? 'text-red-600 bg-red-100 hover:bg-red-200' 
                                        : sentComment ? 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200 opacity-60' 
                                        : 'text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 opacity-40 hover:opacity-100';

                                      return (
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className={`h-6 w-6 p-0 ml-2 ${btnClass}`}
                                          onClick={() => openFlagDialog('colonna', stat.table, colName)}
                                          title={commentObj ? commentObj.reason : "Segnala questa colonna ad Antigravity"}
                                        >
                                          <AlertTriangle className="w-3 h-3" />
                                        </Button>
                                      );
                                  })()}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          );
        })}
        {filteredStats.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-slate-50 dark:bg-slate-900/20 rounded-lg border border-dashed">
            Nessuna tabella o colonna trovata per "{searchTerm}".
          </div>
        )}
      </div>

      <Dialog open={!!expandedTable} onOpenChange={(open) => !open && setExpandedTable(null)}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Database className="w-5 h-5 text-primary" />
              Tabella: {expandedTable}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden mt-4 relative">
            {expandedTable && <TableDataViewer tableName={expandedTable} stats={stats} localComments={localComments} onFlag={(ref, data) => openFlagDialog('riga', expandedTable, ref, data)} />}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={flagDialog.isOpen} onOpenChange={(open) => !open && setFlagDialog(prev => ({ ...prev, isOpen: false }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Commenta Anomalia Database</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm">
              Stai annotando la {flagDialog.type} <strong>{flagDialog.ref}</strong> nella tabella <strong>{flagDialog.table}</strong>.
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo (es. "Colonna inutile", "Riga da eliminare"):</label>
              <Textarea 
                value={flagReason} 
                onChange={e => setFlagReason(e.target.value)} 
                placeholder="Inserisci il motivo. Puoi andare a capo."
                autoFocus
                rows={4}
                className="resize-none"
              />
            </div>
            <Button 
              className="w-full" 
              disabled={!flagReason}
              onClick={handleSaveDraft}
            >
              Salva Bozza Commento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {localComments.pending.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t p-3 flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-full duration-300">
          <div className="flex items-center gap-3 ml-4">
            <div className="bg-red-500 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold shadow-lg">
              {localComments.pending.length}
            </div>
            <span className="text-slate-200 font-medium">
              Hai {localComments.pending.length} segnalazioni in bozza.
            </span>
          </div>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-500 text-white mr-4 shadow-lg border border-emerald-500/20 font-bold"
            onClick={() => flagBatchMutation.mutate(localComments.pending)}
            disabled={flagBatchMutation.isPending}
          >
            Invia Report ad Antigravity
          </Button>
        </div>
      )}

    </div>
  );
}

function getExcelColumnName(colIndex: number): string {
  let name = "";
  let temp = colIndex;
  while (temp >= 0) {
    name = String.fromCharCode((temp % 26) + 65) + name;
    temp = Math.floor(temp / 26) - 1;
  }
  return name;
}

function TableDataViewer({ tableName, stats, localComments, onFlag }: { tableName: string, stats: DbStat[], localComments: {pending: FlagComment[], sent: FlagComment[]}, onFlag: (ref: string, data: any) => void }) {
  const [offset, setOffset] = React.useState(0);
  const LIMIT = 5000;
  
  const [accumulatedData, setAccumulatedData] = React.useState<any[]>([]);
  const [hasMore, setHasMore] = React.useState(true);
  const [isFetching, setIsFetching] = React.useState(true);
  const [fetchError, setFetchError] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsFetching(true);
      try {
        const res = await fetch(`/api/admin/db-monitor/table/${tableName}?offset=${offset}&limit=${LIMIT}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        
        if (isMounted) {
          if (offset === 0) setAccumulatedData(json);
          else setAccumulatedData(prev => [...prev, ...json]);
          
          setHasMore(json.length === LIMIT);
          setIsFetching(false);
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(true);
          setIsFetching(false);
        }
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [tableName, offset]);

  const [sortConfig, setSortConfig] = React.useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const tableStat = stats.find(s => s.table === tableName);
  const columns = tableStat?.columns || [];

  const data = React.useMemo(() => {
    let sortableItems = [...accumulatedData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal === null) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bVal === null) return sortConfig.direction === 'asc' ? 1 : -1;
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [accumulatedData, sortConfig]);
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  if (isFetching && offset === 0) return <div className="p-8 text-center text-muted-foreground animate-pulse">Caricamento dati in corso...</div>;
  if (fetchError && offset === 0) return <div className="p-8 text-center text-red-500">Errore nel caricamento dei dati della tabella.</div>;
  
  return (
    <div className="rounded-md border absolute inset-0 flex flex-col">
      <div className="flex-1 w-full overflow-hidden [&>div]:h-full [&>div]:overflow-auto">
        <Table className="w-max min-w-full relative border-collapse">
          <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-20 shadow-sm">
            <TableRow>
              <TableHead className="px-4 font-mono font-bold text-slate-700 dark:text-slate-200 sticky left-0 bg-slate-50 dark:bg-slate-900 z-30 w-[50px] border-r">#</TableHead>
              {columns.map((c, idx) => {
                const isSorted = sortConfig?.key === c.name;
                return (
                <TableHead 
                  key={c.name} 
                  className={`px-4 font-mono font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors select-none ${isSorted ? 'bg-yellow-100 dark:bg-yellow-900/40 border-b-2 border-b-yellow-400' : ''}`}
                  onClick={() => requestSort(c.name)}
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-muted-foreground bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded-sm mb-1 text-center self-center w-fit min-w-[20px]">{getExcelColumnName(idx)}</span>
                    <div className="flex items-center gap-1">
                      {c.name}
                      {isSorted && (
                        <span className="text-xs text-primary font-black">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </div>
                </TableHead>
              )})}
              <TableHead className="px-4 font-mono font-bold text-slate-700 dark:text-slate-200 sticky right-0 bg-slate-50 dark:bg-slate-900 z-30 w-[80px] border-l text-center">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <TableCell className="px-4 font-mono text-xs text-slate-400 sticky left-0 bg-white dark:bg-slate-950 z-10 border-r">{i + 1}</TableCell>
                {columns.map(c => {
                  const isSorted = sortConfig?.key === c.name;
                  return (
                  <TableCell key={c.name} className={`px-4 max-w-[300px] truncate whitespace-nowrap ${isSorted ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`} title={String(row[c.name])}>
                    {row[c.name] === null ? <span className="text-slate-400 italic">NULL</span> : String(row[c.name])}
                  </TableCell>
                )})}
                <TableCell className="px-4 sticky right-0 bg-white dark:bg-slate-950 z-10 border-l text-center">
                  {(() => {
                    const rowId = row.id?.toString() || "riga_" + i;
                    const commentId = `${tableName}_riga_${rowId}`;
                    const pendingComment = localComments.pending.find(c => c.id === commentId);
                    const sentComment = localComments.sent.find(c => c.id === commentId);
                    const commentObj = pendingComment || sentComment;
                    
                    const btnClass = pendingComment ? 'text-red-600 bg-red-100 hover:bg-red-200' 
                      : sentComment ? 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200 opacity-60' 
                      : 'text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 opacity-40 hover:opacity-100';

                    return (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-7 w-7 p-0 ${btnClass}`}
                        onClick={() => onFlag(rowId, row)}
                        title={commentObj ? commentObj.reason : "Segnala questa riga ad Antigravity"}
                      >
                        <AlertTriangle className="w-3 h-3" />
                      </Button>
                    );
                  })()}
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
                  Nessun record trovato nella tabella.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {hasMore && (
          <div className="p-4 flex justify-center border-t">
            <Button 
              variant="outline" 
              onClick={() => setOffset(prev => prev + LIMIT)}
              disabled={isFetching}
            >
              {isFetching ? "Caricamento in corso..." : "Carica altri 5000 record"}
            </Button>
          </div>
        )}
      </div>
      <div className="bg-slate-50 dark:bg-slate-900 p-2 text-xs text-muted-foreground text-center border-t shrink-0">
        Record caricati al momento: {data.length}.
      </div>
    </div>
  );
}
