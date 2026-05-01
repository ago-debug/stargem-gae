import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, TrendingUp, Users, Calendar, Plus, Play, Trash2, Edit, Download, FileText, Save } from "lucide-react";
import type { CustomReport } from "@shared/schema";

interface FieldDefinition {
  name: string;
  type: string;
  label: string;
}

interface ReportFilter {
  field: string;
  operator: string;
  value: string;
}

interface ReportStats {
  totalMembers: number;
  newMembersThisMonth: number;
  activeCourses: number;
  totalEnrollments: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  attendanceRate: number;
  enrollmentsByCategory: { category: string; count: number }[];
  upcomingExpiries: { memberName: string; type: string; expiryDate: string }[];
}

const ENTITY_TYPES = [
  { id: "members", label: "Clienti/Anagrafiche" },
  { id: "courses", label: "Corsi" },
  { id: "workshops", label: "Workshop" },
  { id: "payments", label: "Pagamenti" },
  { id: "enrollments", label: "Iscrizioni" },
  { id: "attendances", label: "Presenze" },
  { id: "instructors", label: "Insegnanti" },
];

const OPERATORS = [
  { id: "equals", label: "Uguale a" },
  { id: "contains", label: "Contiene" },
  { id: "startsWith", label: "Inizia con" },
  { id: "endsWith", label: "Finisce con" },
  { id: "greaterThan", label: "Maggiore di" },
  { id: "lessThan", label: "Minore di" },
  { id: "isTrue", label: "È vero" },
  { id: "isFalse", label: "È falso" },
  { id: "isEmpty", label: "È vuoto" },
  { id: "isNotEmpty", label: "Non è vuoto" },
];

export default function Reports() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("statistics");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<CustomReport | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<string>("");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [reportName, setReportName] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportResult, setReportResult] = useState<{ data: any[]; total: number } | null>(null);
  const [executingReportId, setExecutingReportId] = useState<number | null>(null);

  const { data: stats, isLoading } = useQuery<ReportStats>({
    queryKey: ["/api/stats/reports"],
  });

  const { data: customReports, isLoading: loadingReports } = useQuery<CustomReport[]>({
    queryKey: ["/api/custom-reports"],
  });

  const { data: availableFields } = useQuery<FieldDefinition[]>({
    queryKey: ["/api/report-fields", selectedEntityType],
    enabled: !!selectedEntityType,
  });

  const createReportMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/custom-reports", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-reports"] });
      toast({ title: "Report creato con successo" });
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PATCH", `/api/custom-reports/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-reports"] });
      toast({ title: "Report aggiornato" });
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/custom-reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-reports"] });
      toast({ title: "Report eliminato" });
    },
  });

  const executeReportMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/custom-reports/${id}/execute`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to execute report");
      return response.json();
    },
    onSuccess: (data) => {
      setReportResult(data);
      setIsResultDialogOpen(true);
    },
    onError: (error: any) => {
      toast({ title: "Errore nell'esecuzione del report", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setReportName("");
    setReportDescription("");
    setSelectedEntityType("");
    setSelectedFields([]);
    setFilters([]);
    setSortField("");
    setSortDirection("asc");
    setEditingReport(null);
  };

  const openEditDialog = (report: CustomReport) => {
    setEditingReport(report);
    setReportName(report.name);
    setReportDescription(report.description || "");
    setSelectedEntityType(report.entityType);
    setSelectedFields(report.selectedFields || []);
    setFilters((report.filters as ReportFilter[]) || []);
    setSortField(report.sortField || "");
    setSortDirection(report.sortDirection || "asc");
    setIsCreateDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!reportName || !selectedEntityType || selectedFields.length === 0) {
      toast({ title: "Compila tutti i campi obbligatori", variant: "destructive" });
      return;
    }

    const data = {
      name: reportName,
      description: reportDescription || null,
      entityType: selectedEntityType,
      selectedFields,
      filters: filters.length > 0 ? filters : null,
      sortField: sortField || null,
      sortDirection,
    };

    if (editingReport) {
      updateReportMutation.mutate({ id: editingReport.id, data });
    } else {
      createReportMutation.mutate(data);
    }
  };

  const addFilter = () => {
    setFilters([...filters, { field: "", operator: "equals", value: "" }]);
  };

  const updateFilter = (index: number, key: keyof ReportFilter, value: string) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [key]: value };
    setFilters(newFilters);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const toggleField = (fieldName: string) => {
    if (selectedFields.includes(fieldName)) {
      setSelectedFields(selectedFields.filter(f => f !== fieldName));
    } else {
      setSelectedFields([...selectedFields, fieldName]);
    }
  };

  const exportResultToCSV = () => {
    if (!reportResult || !reportResult.data.length) return;

    const headers = Object.keys(reportResult.data[0]);
    const rows = reportResult.data.map(row =>
      headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return "";
        if (typeof val === "boolean") return val ? "Sì" : "No";
        if (val instanceof Date || (typeof val === "string" && val.match(/^\d{4}-\d{2}-\d{2}/))) {
          try {
            return new Date(val).toLocaleDateString('it-IT');
          } catch {
            return val;
          }
        }
        return String(val);
      })
    );

    const escapeCSV = (value: any): string => {
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvContent = "\ufeff" + [
      headers.map(escapeCSV).join(","),
      ...rows.map(row => row.map(escapeCSV).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Esportazione completata" });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Report & Statistiche</h1>
          <p className="text-muted-foreground">Analisi dettagliate e report personalizzati</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="statistics" data-testid="tab-statistics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Statistiche
          </TabsTrigger>
          <TabsTrigger value="custom-reports" data-testid="tab-custom-reports">
            <FileText className="w-4 h-4 mr-2" />
            Report Personalizzati
          </TabsTrigger>
        </TabsList>

        <TabsContent value="statistics" className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-4 rounded" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-sm font-medium">Iscritti Totali</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalMembers || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      +{stats?.newMembersThisMonth || 0} questo mese
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-sm font-medium">Corsi Attivi</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.activeCourses || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.totalEnrollments || 0} iscrizioni totali
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-sm font-medium">Entrate Mese</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      €{stats?.monthlyRevenue?.toFixed(2) || '0.00'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +{stats?.revenueGrowth || 0}% vs mese scorso
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-sm font-medium">Tasso Frequenza</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.attendanceRate || 0}%</div>
                    <p className="text-xs text-muted-foreground">
                      Media ultimi 30 giorni
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Detailed Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Iscrizioni per Categoria</CardTitle>
                <CardDescription>Distribuzione iscritti per categoria di corso</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : stats?.enrollmentsByCategory && stats.enrollmentsByCategory.length > 0 ? (
                  <div className="space-y-3">
                    {stats.enrollmentsByCategory.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.category}</p>
                          <div className="w-full bg-muted rounded-full h-2 mt-1">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${(item.count / stats.totalEnrollments) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-bold ml-4">{item.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">Nessun dato disponibile</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scadenze Imminenti</CardTitle>
                <CardDescription>Tessere e certificati in scadenza</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : stats?.upcomingExpiries && stats.upcomingExpiries.length > 0 ? (
                  <div className="space-y-2">
                    {stats.upcomingExpiries.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.memberName}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.type === 'membership' ? 'Tessera' : 'Certificato Medico'}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground ml-4">
                          {new Date(item.expiryDate).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">Nessuna scadenza imminente</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="custom-reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">Crea e gestisci report personalizzati</p>
            <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }} data-testid="button-create-report">
              <Plus className="w-4 h-4 mr-2" />
              Nuovo Report
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Report Salvati</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingReports ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !customReports || customReports.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Nessun report salvato</p>
                  <p className="text-sm">Crea il tuo primo report personalizzato</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo Dati</TableHead>
                      <TableHead>Campi</TableHead>
                      <TableHead>Creato</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customReports.map((report) => (
                      <TableRow key={report.id} data-testid={`report-row-${report.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{report.name}</p>
                            {report.description && (
                              <p className="text-xs text-muted-foreground">{report.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {ENTITY_TYPES.find(e => e.id === report.entityType)?.label || report.entityType}
                          </Badge>
                        </TableCell>
                        <TableCell>{report.selectedFields?.length || 0} campi</TableCell>
                        <TableCell>
                          {report.createdAt ? new Date(report.createdAt).toLocaleDateString('it-IT') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setExecutingReportId(report.id);
                                executeReportMutation.mutate(report.id);
                              }}
                              disabled={executeReportMutation.isPending && executingReportId === report.id}
                              data-testid={`button-run-report-${report.id}`}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Esegui
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(report)}
                              data-testid={`button-edit-report-${report.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteReportMutation.mutate(report.id)}
                              data-testid={`button-delete-report-${report.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Report Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsCreateDialogOpen(open); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingReport ? "Modifica Report" : "Nuovo Report"}</DialogTitle>
            <DialogDescription>
              Configura i dati e i filtri per il tuo report personalizzato
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reportName">Nome Report *</Label>
                <Input
                  id="reportName"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Es: Clienti attivi con certificato"
                  data-testid="input-report-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entityType">Tipo Dati *</Label>
                <Select value={selectedEntityType} onValueChange={(value) => { setSelectedEntityType(value); setSelectedFields([]); }}>
                  <SelectTrigger data-testid="select-entity-type">
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione (opzionale)</Label>
              <Textarea
                id="description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Descrizione del report..."
                rows={2}
                data-testid="input-report-description"
              />
            </div>

            {selectedEntityType && availableFields && (
              <>
                <div className="space-y-2">
                  <Label>Campi da includere *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border rounded-md max-h-48 overflow-y-auto">
                    {availableFields.map((field) => (
                      <div key={field.name} className="flex items-center space-x-2">
                        <Checkbox
                          id={`field-${field.name}`}
                          checked={selectedFields.includes(field.name)}
                          onCheckedChange={() => toggleField(field.name)}
                          data-testid={`checkbox-field-${field.name}`}
                        />
                        <label htmlFor={`field-${field.name}`} className="text-sm cursor-pointer">
                          {field.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedFields.length} campi selezionati</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Filtri (opzionale)</Label>
                    <Button variant="outline" size="sm" onClick={addFilter} data-testid="button-add-filter">
                      <Plus className="w-4 h-4 mr-1" />
                      Aggiungi Filtro
                    </Button>
                  </div>
                  {filters.length > 0 && (
                    <div className="space-y-2">
                      {filters.map((filter, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Select value={filter.field} onValueChange={(v) => updateFilter(index, 'field', v)}>
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Campo" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableFields.map((f) => (
                                <SelectItem key={f.name} value={f.name}>{f.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={filter.operator} onValueChange={(v) => updateFilter(index, 'operator', v)}>
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Operatore" />
                            </SelectTrigger>
                            <SelectContent>
                              {OPERATORS.map((op) => (
                                <SelectItem key={op.id} value={op.id}>{op.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            value={filter.value}
                            onChange={(e) => updateFilter(index, 'value', e.target.value)}
                            placeholder="Valore"
                            className="flex-1"
                          />
                          <Button variant="ghost" size="icon" onClick={() => removeFilter(index)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ordina per (opzionale)</Label>
                    <Select value={sortField || "__none__"} onValueChange={(v) => setSortField(v === "__none__" ? "" : v)}>
                      <SelectTrigger data-testid="select-sort-field">
                        <SelectValue placeholder="Nessun ordinamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nessuno</SelectItem>
                        {availableFields.map((f) => (
                          <SelectItem key={f.name} value={f.name}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Direzione</Label>
                    <Select value={sortDirection} onValueChange={setSortDirection}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Crescente (A-Z)</SelectItem>
                        <SelectItem value="desc">Decrescente (Z-A)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createReportMutation.isPending || updateReportMutation.isPending}
              data-testid="button-save-report"
            >
              <Save className="w-4 h-4 mr-2" />
              {editingReport ? "Salva Modifiche" : "Crea Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Results Dialog */}
      <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Risultati Report</DialogTitle>
            <DialogDescription>
              {reportResult?.total || 0} record trovati
            </DialogDescription>
          </DialogHeader>

          {reportResult && reportResult.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(reportResult.data[0]).map((key) => (
                      <TableHead key={key}>{key}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportResult.data.slice(0, 100).map((row, index) => (
                    <TableRow key={index}>
                      {Object.values(row).map((value: any, colIndex) => (
                        <TableCell key={colIndex}>
                          {value === null || value === undefined ? "-" :
                            typeof value === "boolean" ? (value ? "Sì" : "No") :
                              typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/) ?
                                new Date(value).toLocaleDateString('it-IT') :
                                String(value)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {reportResult.data.length > 100 && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Mostrati 100 di {reportResult.total} record. Esporta per vedere tutti.
                </p>
              )}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">Nessun dato trovato</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResultDialogOpen(false)}>
              Chiudi
            </Button>
            <Button onClick={exportResultToCSV} disabled={!reportResult?.data.length} data-testid="button-export-result">
              <Download className="w-4 h-4 mr-2" />
              Esporta CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
