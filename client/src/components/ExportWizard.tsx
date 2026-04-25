import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, Upload, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

export interface ExportColumn {
  key: string;
  label: string;
  default?: boolean;
}

interface ExportWizardProps {
  title?: string;
  filename: string;
  columns: ExportColumn[];
  data?: any[];
  apiEndpoint?: string;
  apiParams?: Record<string, any>;
  triggerLabel?: string;
  triggerIcon?: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  expandable?: boolean;
}

export function ExportWizard({
  title = "Esporta Dati",
  filename,
  columns,
  data,
  apiEndpoint,
  apiParams,
  triggerLabel = "Esporta",
  triggerIcon = <Upload className="w-4 h-4 mr-2 sidebar-icon-gold" />,
  variant = "outline",
  expandable = false
}: ExportWizardProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columns.filter(c => c.default !== false).map(c => c.key)
  );
  const [isExporting, setIsExporting] = useState(false);

  const toggleColumn = (key: string) => {
    setSelectedColumns(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const getFormattedFilename = (base: string, ext: string) => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0,16).replace('T','_').replace(':','-');
    return `${localISOTime}_${base}.${ext}`;
  };

  const getFilteredData = (rawData: any[]) => {
    return rawData.map(row => {
      const filteredRow: any = {};
      selectedColumns.forEach(key => {
        let val = row[key];
        if (val !== null && val !== undefined) {
          if (typeof val === 'boolean') {
            val = val ? 'Sì' : 'No';
          } else {
            const isJsDateString = typeof val === 'string' && val.includes('GMT');
            const isIsoString = typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val);
            if (val instanceof Date || isJsDateString || isIsoString) {
              const d = new Date(val);
              if (!isNaN(d.getTime())) {
                val = d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
              }
            }
          }
        }
        filteredRow[columns.find(c => c.key === key)?.label || key] = val;
      });
      return filteredRow;
    });
  };

  const doFrontendExport = (format: 'csv' | 'xlsx') => {
    if (!data || data.length === 0) {
      toast({ title: "Nessun dato da esportare", variant: "destructive" });
      return;
    }
    try {
      const filteredData = getFilteredData(data);
      if (format === 'csv') {
        const wsCsv = XLSX.utils.json_to_sheet(filteredData);
        const csv = XLSX.utils.sheet_to_csv(wsCsv);
        const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = getFormattedFilename(filename, 'csv');
        link.click();
        URL.revokeObjectURL(url);
      } else {
        const ws = XLSX.utils.json_to_sheet([]);
        XLSX.utils.sheet_add_aoa(ws, [
          [`Esportazione: ${filename}`],
          [`Data: ${new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`],
          [`Colonne: ${selectedColumns.length}`],
          []
        ], { origin: "A1" });
        XLSX.utils.sheet_add_json(ws, filteredData, { origin: "A5" });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Export");
        XLSX.writeFile(wb, getFormattedFilename(filename, 'xlsx'));
      }
      toast({ title: "Esportazione completata" });
      setIsOpen(false);
    } catch (e: any) {
      toast({ title: "Errore esportazione", description: e.message, variant: "destructive" });
    }
  };

  const doBackendExport = async (format: 'csv' | 'xlsx') => {
    if (!apiEndpoint) return;
    setIsExporting(true);
    toast({ title: "Preparazione file...", description: "L'esportazione è in corso, attendi." });
    
    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          columns: selectedColumns.map(k => {
            const colDef = columns.find(c => c.key === k);
            return { key: k, label: colDef?.label || k };
          }),
          format,
          ...apiParams
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Errore dal server");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getFormattedFilename(filename, format);
      link.click();
      URL.revokeObjectURL(url);
      
      toast({ title: "Esportazione completata" });
      setIsOpen(false);
    } catch (e: any) {
      toast({ title: "Errore esportazione", description: e.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = (format: 'csv' | 'xlsx') => {
    if (selectedColumns.length === 0) {
      toast({ title: "Seleziona almeno una colonna", variant: "destructive" });
      return;
    }
    if (data) {
      doFrontendExport(format);
    } else if (apiEndpoint) {
      doBackendExport(format);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm" data-testid="button-export-wizard" className="bg-white">
          {triggerIcon}
          <span className="hidden sm:inline">{triggerLabel}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-4 my-4">
          <div className="flex items-center justify-between mb-3">
            <Label className="block text-sm text-muted-foreground">Seleziona le colonne da esportare:</Label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedColumns(columns.map(c => c.key))} className="h-6 text-xs px-2">
                Seleziona tutte
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedColumns([])} className="h-6 text-xs px-2">
                Deseleziona tutte
              </Button>
              {expandable && (
                <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)} className="h-6 text-xs px-2 border-l pl-3 ml-1">
                  {showAll ? "Mostra solo principali" : "Mostra tutti i campi"}
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {columns.filter(c => showAll || c.default !== false).map(col => (
              <div key={col.key} className="flex items-center space-x-2">
                <Checkbox 
                  id={`export-col-${col.key}`} 
                  checked={selectedColumns.includes(col.key)}
                  onCheckedChange={() => toggleColumn(col.key)}
                />
                <Label htmlFor={`export-col-${col.key}`} className="cursor-pointer">{col.label}</Label>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => handleExport('csv')}
            disabled={isExporting}
          >
            <FileText className="w-4 h-4 mr-2" />
            Scarica CSV
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleExport('xlsx')}
            disabled={isExporting}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Scarica Excel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
