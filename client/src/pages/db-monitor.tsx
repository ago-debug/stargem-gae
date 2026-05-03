import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Database, Search, LayoutTemplate, Layers, LayoutList } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface DbStat {
  table: string;
  columnCount: number;
  rowCount: number;
  columns: string[];
}

import { tableTranslations, columnMappings } from "@/config/db-monitor-mapping";

export default function DbMonitor() {
  const [searchTerm, setSearchTerm] = React.useState("");

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

  const filteredStats = stats.filter(s => 
    s.table.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.columns.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (tableTranslations[s.table] && tableTranslations[s.table].toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
                      <div className="flex gap-2">
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
                          {stat.columns.map(col => {
                            const mapping = tableColsMap[col];
                            const isHighlighted = searchTerm && (
                              col.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (mapping?.label.toLowerCase().includes(searchTerm.toLowerCase()))
                            );

                            return (
                              <div 
                                key={col} 
                                className={`flex flex-col sm:flex-row sm:items-center justify-between text-sm px-3 py-2 border-b last:border-0 rounded-sm ${
                                  isHighlighted 
                                    ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800' 
                                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{col}</span>
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
    </div>
  );
}
