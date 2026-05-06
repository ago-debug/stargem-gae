import { useState, useEffect, Fragment, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Briefcase,
  FileCheck,
  Landmark,
  CalendarClock,
  ShieldAlert,
  Lock,
  Search,
  AlertTriangle,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  SortableTableHead,
  useSortableTable,
} from "@/components/sortable-table-head";
import { cn } from "@/lib/utils";
import { AccordiTab } from "@/components/quote-promo/accordi-tab";

function CompliancePanel({
  memberId,
  complianceData,
  isAdmin,
}: {
  memberId: string;
  complianceData: any;
  isAdmin: boolean;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const completeData = complianceData || {
    documenti: {},
  };
  const docs = completeData.documenti || {};
  const keys = [
    "diploma_tesserino",
    "carta_identita",
    "codice_fiscale",
    "permesso_soggiorno",
    "foto_id",
    "video_promo",
  ];
  const presentCount = keys.filter((k: string) => docs[k]?.presente).length;
  const totalCount = keys.length;
  const progress = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

  const toggleMutation = useMutation({
    mutationFn: async (payload: { docKey: string; presente: boolean }) => {
      return await apiRequest("POST", "/api/gemstaff/compliance", {
        memberId: parseInt(memberId),
        ...payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/gemstaff/compliance", memberId],
      });
      toast({ title: "Documento aggiornato" });
    },
    onError: () => {
      toast({
        title: "Errore (404)",
        description: "Endpoint backend per update mancante al momento.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-md border bg-background p-4">
        <div>
          <h3 className="text-lg font-bold">Stato Avanzamento Compliance</h3>
          <p className="text-sm text-muted-foreground">
            {presentCount} su {totalCount} documenti inseriti
          </p>
        </div>
        <div className="flex w-1/3 items-center gap-3">
          <Progress value={progress} className="w-full" />
          <span className="font-mono text-sm font-bold">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {keys.map((k) => {
          const doc = docs[k];
          const isPresent = doc?.presente;
          const expDate = doc?.scadenza ? new Date(doc.scadenza) : null;
          let isExpiring = false;
          let isExpired = false;
          if (expDate) {
            const days =
              (expDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24);
            if (days < 0) isExpired = true;
            else if (days < 30) isExpiring = true;
          }

          return (
            <Card key={k} className={!isPresent ? "bg-muted/50" : ""}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <span className="text-sm font-semibold capitalize">
                    {k.replace(/_/g, " ")}
                  </span>
                  {isPresent ? (
                    <Badge className="bg-emerald-500">PRESENTE ✓</Badge>
                  ) : (
                    <Badge variant="destructive">MANCANTE ✗</Badge>
                  )}
                </div>
                {isPresent && expDate && (
                  <div className="text-xs">
                    Scadenza:{" "}
                    <span
                      className={
                        isExpired
                          ? "font-bold text-red-600"
                          : isExpiring
                            ? "font-bold text-amber-600"
                            : "text-muted-foreground"
                      }
                    >
                      {expDate.toLocaleDateString()}
                    </span>
                    {isExpired && (
                      <span className="ml-2 text-red-600">(Scaduto)</span>
                    )}
                    {isExpiring && !isExpired && (
                      <span className="ml-2 text-amber-600">(In Scadenza)</span>
                    )}
                  </div>
                )}
                {isAdmin && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() =>
                        toggleMutation.mutate({
                          docKey: k,
                          presente: !isPresent,
                        })
                      }
                      disabled={toggleMutation.isPending}
                    >
                      {isPresent
                        ? "Segna come Mancante"
                        : "Segna come Presente"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function PresenzeTab({ isAdmin }: { isAdmin: boolean }) {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [subTab, setSubTab] = useState("presenze");

  const { data: presenzeList = [] } = useQuery<any[]>({
    queryKey: ["/api/gemstaff/presenze", month, year],
    queryFn: async () =>
      await apiRequest("GET", `/api/gemstaff/presenze/${month}/${year}`),
  });

  const { data: sostituzioniList = [] } = useQuery<any[]>({
    queryKey: ["/api/gemstaff/sostituzioni", month, year],
    queryFn: async () =>
      await apiRequest("GET", `/api/gemstaff/sostituzioni/${month}/${year}`),
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleConfermaMese = () => {
    if (
      confirm(
        `Stai confermando le presenze di ${month}/${year}. Questa azione non può essere annullata. Vuoi procedere?`,
      )
    ) {
      apiRequest("POST", "/api/gemstaff/presenze/conferma", { month, year })
        .then(() => {
          queryClient.invalidateQueries({
            queryKey: ["/api/gemstaff/presenze", month, year],
          });
          toast({ title: "Mese confermato con successo!" });
        })
        .catch(() => {
          toast({
            title: "Errore",
            description: "Impossibile confermare il mese",
            variant: "destructive",
          });
        });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-md border bg-muted p-4">
        <div className="flex w-32 flex-col gap-1">
          <Label>Mese</Label>
          <Select
            value={month.toString()}
            onValueChange={(v) => setMonth(parseInt(v))}
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }).map((_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-32 flex-col gap-1">
          <Label>Anno</Label>
          <Select
            value={year.toString()}
            onValueChange={(v) => setYear(parseInt(v))}
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...Array(5)].map((_, i) => (
                <SelectItem
                  key={i}
                  value={(new Date().getFullYear() - 2 + i).toString()}
                >
                  {new Date().getFullYear() - 2 + i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="mb-4 rounded-md bg-slate-100 p-1 dark:bg-slate-800">
          <TabsTrigger value="presenze" className="w-48">
            Presenze Mensili
          </TabsTrigger>
          <TabsTrigger value="sostituzioni" className="w-48">
            Sostituzioni
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presenze" className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="outline">Aggiungi presenza manuale</Button>
            {isAdmin && (
              <Button
                onClick={handleConfermaMese}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                CONFERMA MESE
              </Button>
            )}
          </div>
          <div className="overflow-hidden rounded-md border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome insegnante</TableHead>
                  <TableHead>Ore totali</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {presenzeList.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-6 text-center text-muted-foreground"
                    >
                      Nessuna presenza trovata per questo mese.
                    </TableCell>
                  </TableRow>
                ) : (
                  presenzeList.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-semibold">
                        {p.lastName} {p.firstName}
                      </TableCell>
                      <TableCell>{p.ore_totali}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            p.status === "CONFERMATO"
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                          }
                        >
                          {p.status || "BOZZA"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="sostituzioni" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline">Registra sostituzione</Button>
          </div>
          <div className="overflow-hidden rounded-md border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Assente</TableHead>
                  <TableHead>Sostituto</TableHead>
                  <TableHead>Lezione</TableHead>
                  <TableHead>Compenso a</TableHead>
                  <TableHead>Visto Segr.</TableHead>
                  <TableHead>Visto Elisa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sostituzioniList.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-6 text-center text-muted-foreground"
                    >
                      Nessuna sostituzione registrata.
                    </TableCell>
                  </TableRow>
                ) : (
                  sostituzioniList.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        {s.data ? new Date(s.data).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>{s.assente || "—"}</TableCell>
                      <TableCell>{s.sostituto || "—"}</TableCell>
                      <TableCell>{s.lezione || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {s.compenso_a || "NESSUNO"}
                        </Badge>
                      </TableCell>
                      <TableCell>{s.visto_segr ? "✓" : "✗"}</TableCell>
                      <TableCell>{s.visto_elisa ? "✓" : "✗"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DisciplinareTab({ staffList }: { staffList: any[] }) {
  const [memberId, setMemberId] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: eventiList = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/gemstaff/disciplinare", memberId],
    enabled: !!memberId,
    queryFn: async () =>
      await apiRequest("GET", `/api/gemstaff/disciplinare/${memberId}`),
  });

  const [isNuovoOpen, setIsNuovoOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [eventType, setEventType] = useState("richiamo_verbale");
  const [dataEvento, setDataEvento] = useState(
    new Date().toISOString().substring(0, 10),
  );
  const [descrizione, setDescrizione] = useState("");

  const creaMutation = useMutation({
    mutationFn: async (payload: any) =>
      await apiRequest("POST", "/api/gemstaff/disciplinare", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/gemstaff/disciplinare", memberId],
      });
      toast({ title: "Evento registrato" });
      setIsNuovoOpen(false);
      setDescrizione("");
    },
  });

  const aggiornaMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) =>
      await apiRequest("PATCH", `/api/gemstaff/disciplinare/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/gemstaff/disciplinare", memberId],
      });
      toast({ title: "Evento aggiornato" });
    },
  });

  const getBadgeType = (type: string) => {
    switch (type) {
      case "richiamo_verbale":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "ammonizione_scritta":
        return "bg-orange-500 hover:bg-orange-600";
      case "sospensione":
        return "bg-red-500 hover:bg-red-600";
      case "interruzione_rapporto":
        return "bg-red-900 hover:bg-red-950";
      default:
        return "bg-slate-500";
    }
  };

  const getBadgeLabel = (type: string) => {
    return type?.replace(/_/g, " ")?.toUpperCase() || "SCONOSCIUTO";
  };

  return (
    <div className="mt-4 space-y-6">
      <Alert
        variant="destructive"
        className="border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400"
      >
        <ShieldAlert className="size-4 stroke-red-800" />
        <AlertTitle>⚠️ Sezione riservata — accesso solo Direzione.</AlertTitle>
        <AlertDescription>
          I dati sono confidenziali e non visibili allo staff. Questa tabella
          monitora i richiami e lo storico disciplinare.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between rounded-md border bg-muted p-4">
        <div className="w-1/2">
          <Label>Seleziona Insegnante</Label>
          <Select value={memberId} onValueChange={setMemberId}>
            <SelectTrigger className="mt-2 bg-background">
              <SelectValue placeholder="Scegli..." />
            </SelectTrigger>
            <SelectContent>
              {staffList.map((s) => (
                <SelectItem
                  key={s.id || s.firstName}
                  value={s.id?.toString() || s.firstName}
                >
                  {s.lastName} {s.firstName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {memberId && (
          <div className="pt-6">
            <Button
              onClick={() => setIsNuovoOpen(!isNuovoOpen)}
              variant={isNuovoOpen ? "outline" : "default"}
            >
              {isNuovoOpen ? "Annulla" : "Nuovo Evento"}
            </Button>
          </div>
        )}
      </div>

      {isNuovoOpen && memberId && (
        <Card className="border-emerald-200 dark:border-emerald-900/50">
          <CardContent className="space-y-4 p-4">
            <h3 className="text-lg font-semibold">Registra Nuovo Evento</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo Evento</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="richiamo_verbale">
                      Richiamo Verbale
                    </SelectItem>
                    <SelectItem value="ammonizione_scritta">
                      Ammonizione Scritta
                    </SelectItem>
                    <SelectItem value="sospensione">Sospensione</SelectItem>
                    <SelectItem value="interruzione_rapporto">
                      Interruzione Rapporto
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data Evento</Label>
                <Input
                  type="date"
                  value={dataEvento}
                  onChange={(e) => setDataEvento(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Descrizione</Label>
              <Textarea
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
                rows={3}
                className="mt-1"
                placeholder="Dettaglia l'accaduto..."
              />
            </div>
            <Button
              onClick={() =>
                creaMutation.mutate({
                  memberId: parseInt(memberId),
                  eventType,
                  dataEvento,
                  descrizione,
                })
              }
              disabled={!descrizione || creaMutation.isPending}
            >
              Registra
            </Button>
          </CardContent>
        </Card>
      )}

      {memberId && (
        <div className="overflow-hidden rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo evento</TableHead>
                <TableHead>Stato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-6 text-center text-muted-foreground"
                  >
                    Caricamento...
                  </TableCell>
                </TableRow>
              ) : eventiList.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-6 text-center text-muted-foreground"
                  >
                    Nessun evento disciplinare censito per questo staff.
                  </TableCell>
                </TableRow>
              ) : (
                eventiList.map((ev) => (
                  <Fragment key={ev.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted"
                      onClick={() =>
                        setExpandedId(expandedId === ev.id ? null : ev.id)
                      }
                    >
                      <TableCell>
                        {ev.data_evento
                          ? new Date(ev.data_evento).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-white ${getBadgeType(ev.event_type)}`}
                        >
                          {getBadgeLabel(ev.event_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{ev.stato || "APERTURA"}</TableCell>
                    </TableRow>
                    {expandedId === ev.id && (
                      <TableRow className="border-b bg-muted">
                        <TableCell colSpan={3} className="p-4">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Descrizione Operativa
                              </Label>
                              <p className="rounded-md border bg-background p-2 text-sm">
                                {ev.descrizione}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  Risposta Insegnante
                                </Label>
                                <Textarea
                                  defaultValue={ev.risposta_insegnante || ""}
                                  placeholder="Annota se difeso..."
                                  onBlur={(e) => {
                                    if (
                                      e.target.value !==
                                      (ev.risposta_insegnante || "")
                                    ) {
                                      aggiornaMutation.mutate({
                                        id: ev.id,
                                        payload: {
                                          risposta_insegnante: e.target.value,
                                        },
                                      });
                                    }
                                  }}
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  Decisione Direzione
                                </Label>
                                <Textarea
                                  defaultValue={ev.decisione_direzione || ""}
                                  placeholder="Annota sanzione o perdono..."
                                  onBlur={(e) => {
                                    if (
                                      e.target.value !==
                                      (ev.decisione_direzione || "")
                                    ) {
                                      aggiornaMutation.mutate({
                                        id: ev.id,
                                        payload: {
                                          decisione_direzione: e.target.value,
                                        },
                                      });
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Data Risoluzione
                              </Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="date"
                                  className="w-48"
                                  defaultValue={
                                    ev.data_risoluzione
                                      ? new Date(ev.data_risoluzione)
                                          .toISOString()
                                          .substring(0, 10)
                                      : ""
                                  }
                                  onBlur={(e) => {
                                    const old = ev.data_risoluzione
                                      ? new Date(ev.data_risoluzione)
                                          .toISOString()
                                          .substring(0, 10)
                                      : "";
                                    if (e.target.value !== old) {
                                      aggiornaMutation.mutate({
                                        id: ev.id,
                                        payload: {
                                          data_risoluzione: e.target.value
                                            ? new Date(
                                                e.target.value,
                                              ).toISOString()
                                            : null,
                                          stato: e.target.value
                                            ? "CHIUSA"
                                            : "APERTA",
                                        },
                                      });
                                    }
                                  }}
                                />
                                {ev.data_risoluzione && (
                                  <Badge className="bg-emerald-500">
                                    CHIUSO
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default function GemStaff() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("anagrafica");
  const [searchName, setSearchName] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showArchive, setShowArchive] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [complianceMemberId, setComplianceMemberId] = useState<string>("");
  const [isCreateAccountDialogOpen, setIsCreateAccountDialogOpen] =
    useState(false);
  const [createdAccountOtp, setCreatedAccountOtp] = useState<{
    email: string;
    otp: string;
  } | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<any>(null);
  const [isPrivateLessonsAuth, setIsPrivateLessonsAuth] = useState(false);
  
  const [pageSize, setPageSize] = useState<number>(() => {
    const saved = localStorage.getItem("gemstaff_page_size");
    return saved ? parseInt(saved, 10) : 50;
  });
  const [currentPage, setCurrentPage] = useState(1);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchName, categoryFilter, statusFilter, showArchive, pageSize]);

  const handlePageSizeChange = (val: string) => {
    const size = parseInt(val, 10);
    setPageSize(size);
    localStorage.setItem("gemstaff_page_size", val);
    setCurrentPage(1);
  };

  const createAccountMutation = useMutation({
    mutationFn: async (memberId: number) =>
      await apiRequest("POST", `/api/gemstaff/crea-account/${memberId}`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [
          `/api/gemstaff/insegnanti${showArchive ? "?status=inattivo" : ""}`,
        ],
      });
      setCreatedAccountOtp({ email: data.email, otp: data.tempCode });
      setIsCreateAccountDialogOpen(false);
    },
    onError: (e: Error) =>
      toast({
        title: "Errore",
        description: e.message,
        variant: "destructive",
      }),
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/instructors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      if (response.headers.get("X-Deprecation-Warning")) {
        console.warn(
          "⚠️ DEPRECATION:",
          response.headers.get("X-Deprecation-Warning"),
        );
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructors"] });
      queryClient.invalidateQueries({
        queryKey: [
          `/api/gemstaff/insegnanti${showArchive ? "?status=inattivo" : ""}`,
        ],
      });
      toast({ title: "Insegnante creato con successo" });
      setIsFormOpen(false);
      setEditingInstructor(null);
    },
    onError: (e: Error) =>
      toast({
        title: "Errore",
        description: e.message,
        variant: "destructive",
      }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      instructorId,
      memberId,
      data,
      gemstaffData,
    }: {
      instructorId?: number;
      memberId: number;
      data: any;
      gemstaffData: any;
    }) => {
      if (instructorId) {
        const response = await fetch(`/api/instructors/${instructorId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(await response.text());
        if (response.headers.get("X-Deprecation-Warning")) {
          console.warn(
            "⚠️ DEPRECATION:",
            response.headers.get("X-Deprecation-Warning"),
          );
        }
      }
      if (memberId) {
        await apiRequest(
          "PATCH",
          `/api/gemstaff/insegnanti/${memberId}`,
          gemstaffData,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructors"] });
      queryClient.invalidateQueries({
        queryKey: [
          `/api/gemstaff/insegnanti${showArchive ? "?status=inattivo" : ""}`,
        ],
      });
      toast({ title: "Insegnante aggiornato con successo" });
      setIsFormOpen(false);
      setEditingInstructor(null);
    },
    onError: (e: Error) =>
      toast({
        title: "Errore",
        description: e.message,
        variant: "destructive",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) =>
      await apiRequest("DELETE", `/api/instructors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructors"] });
      queryClient.invalidateQueries({
        queryKey: [
          `/api/gemstaff/insegnanti${showArchive ? "?status=inattivo" : ""}`,
        ],
      });
      toast({ title: "Insegnante eliminato con successo" });
    },
    onError: (e: Error) =>
      toast({
        title: "Errore",
        description: e.message,
        variant: "destructive",
      }),
  });

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      specialization: (formData.get("specialization") as string) || null,
      bio: (formData.get("bio") as string) || null,
      hourlyRate: formData.get("hourlyRate")
        ? (formData.get("hourlyRate") as string)
        : null,
      active: formData.get("staffStatus") !== "INATTIVO",
    };

    const gemstaffData = {
      staffStatus: formData.get("staffStatus") as string,
      lezioniPrivateAutorizzate: isPrivateLessonsAuth,
      lezioniPrivateAutorizzateBy:
        (formData.get("lezioniPrivateAutorizzateBy") as string) || null,
      lezioniPrivateAutorizzateAt:
        (formData.get("lezioniPrivateAutorizzateAt") as string) || null,
    };

    if (editingInstructor) {
      updateMutation.mutate({
        instructorId: editingInstructor.instructorId,
        memberId: editingInstructor.id,
        data,
        gemstaffData,
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const queryUrl = `/api/gemstaff/insegnanti${showArchive ? "?status=inattivo" : ""}`;
  const { data: staffListQuery = [], isLoading: isLoadingGs } = useQuery<any[]>(
    {
      queryKey: [queryUrl],
      queryFn: async () => await apiRequest("GET", queryUrl),
    },
  );

  const { data: instructorsList = [], isLoading: isLoadingInst } = useQuery<
    any[]
  >({
    queryKey: ["/api/instructors"],
    queryFn: async () => await apiRequest("GET", "/api/instructors"),
  });

  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ["/api/courses"],
    queryFn: async () => await apiRequest("GET", "/api/courses"),
  });

  const isLoading = isLoadingGs || isLoadingInst;

  const { data: ptList = [], isLoading: isLoadingPt } = useQuery<any[]>({
    queryKey: ["/api/gemstaff/pt"],
    queryFn: async () => await apiRequest("GET", "/api/gemstaff/pt"),
  });

  const { data: complianceData } = useQuery<any>({
    queryKey: ["/api/gemstaff/compliance", complianceMemberId],
    enabled: !!complianceMemberId,
    queryFn: async () =>
      await apiRequest("GET", `/api/gemstaff/compliance/${complianceMemberId}`),
  });

  const ptListSorted = useMemo(() => {
    return [...ptList].sort(
      (a: any, b: any) =>
        (a.lastName || a.cognome || "").localeCompare(
          b.lastName || b.cognome || "",
          "it",
        ) ||
        (a.firstName || a.nome || "").localeCompare(
          b.firstName || b.nome || "",
          "it",
        ),
    );
  }, [ptList]);

  const staffList = useMemo(() => {
    return staffListQuery
      .map((g: any) => {
        const instr = instructorsList.find(
          (i: any) => i.firstName === g.firstName && i.lastName === g.lastName,
        );
        return {
          ...g,
          id: g.id,
          instructorId: instr?.id,
          specialization: instr?.specialization,
          hourlyRate: instr?.hourlyRate,
          email: g.email || instr?.email,
          phone: g.phone || instr?.phone,
        };
      })
      .sort(
        (a: any, b: any) =>
          (a.lastName || a.cognome || "").localeCompare(
            b.lastName || b.cognome || "",
            "it",
          ) ||
          (a.firstName || a.nome || "").localeCompare(
            b.firstName || b.nome || "",
            "it",
          ),
      );
  }, [staffListQuery, instructorsList]);

  const filteredStaffRaw = staffList.filter((s) => {
    const fullName = `${s.lastName || ""} ${s.firstName || ""}`.toLowerCase();
    const matchName =
      searchName === "" || fullName.includes(searchName.toLowerCase());
    const matchCat =
      categoryFilter === "all" ||
      s.specialization?.includes(categoryFilter) ||
      s.corsi?.includes(categoryFilter);

    const sStatus = s.staff_status || "ATTIVO";
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && sStatus !== "INATTIVO") ||
      (statusFilter === "inactive" && sStatus === "INATTIVO");

    return matchName && matchCat && matchStatus;
  });

  const getInstructorCourses = (instructorId: number) => {
    if (!courses || !instructorId) return [];
    return courses.filter(
      (course: any) =>
        course.instructorId === instructorId ||
        course.secondaryInstructor1Id === instructorId,
    );
  };

  const getSortValue = (staff: any, key: string) => {
    switch (key) {
      case "lastName":
        return staff.lastName || "";
      case "firstName":
        return staff.firstName || "";
      case "specialization":
        return staff.specialization || "";
      case "courses":
        return getInstructorCourses(staff.instructorId).length;
      case "email":
        return staff.email || "";
      case "phone":
        return staff.phone || "";
      case "hourlyRate":
        return Number(staff.hourlyRate) || 0;
      case "status":
        return staff.staffStatus === "attivo";
      default:
        return null;
    }
  };

  const { sortConfig: sortConfigStaff, handleSort: handleSortStaff, sortItems: sortItemsStaff, isSortedColumn: isSortedColumnStaff } =
    useSortableTable<any>("lastName");
  const filteredStaff = sortItemsStaff(filteredStaffRaw, getSortValue);
  
  const paginatedStaff = pageSize === 999999 
    ? filteredStaff 
    : filteredStaff.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const { sortConfig: sortConfigPt, handleSort: handleSortPt, sortItems: sortItemsPt, isSortedColumn: isSortedColumnPt } =
    useSortableTable<any>("lastName");
  const sortedPtList = sortItemsPt(ptListSorted, getSortValue);

  const paginatedPtList = pageSize === 999999
    ? sortedPtList
    : sortedPtList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const userRole = user?.role?.toLowerCase() || "";
  const isAdmin = [
    "admin",
    "direzione",
    "master",
    "amministratore totale",
    "super admin",
  ].includes(userRole);
  const isOperator = ["operator", "segreteria"].includes(userRole) || isAdmin;

  useEffect(() => {
    if (userRole === "insegnante") {
      setLocation("/gemstaff/me");
    }
  }, [userRole, setLocation]);

  if (userRole === "insegnante") {
    return null; // Evita flickering durante il redirect
  }

  const PlaceholderContent = ({ title }: { title: string }) => (
    <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/50 p-12 text-center">
      <div className="mb-4 rounded-full bg-primary/10 p-4">
        <Briefcase className="size-8 text-primary" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="max-w-sm text-muted-foreground">
        Caricamento {title.toLowerCase()} in arrivo (F2-002)
      </p>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GemStaff</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestione Risorse Umane, Staff e Insegnanti
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">Per pagina:</Label>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="999999">Tutti</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-auto">
          {isOperator && (
            <>
              <TabsTrigger
                value="anagrafica"
                className="flex items-center gap-2"
              >
                <Users className="size-4" />
                <span className="hidden sm:inline">Anagrafica Insegnanti</span>
              </TabsTrigger>
              <TabsTrigger value="pt" className="flex items-center gap-2">
                <Briefcase className="size-4" />
                <span className="hidden sm:inline">Personal Trainer</span>
              </TabsTrigger>
              <TabsTrigger
                value="compliance"
                className="flex items-center gap-2"
              >
                <FileCheck className="size-4" />
                <span className="hidden sm:inline">Compliance Documenti</span>
              </TabsTrigger>
              <TabsTrigger value="presenze" className="flex items-center gap-2">
                <CalendarClock className="size-4" />
                <span className="hidden sm:inline">
                  Presenze & Sostituzioni
                </span>
              </TabsTrigger>
            </>
          )}

          {isAdmin && (
            <TabsTrigger value="accordi" className="flex items-center gap-2">
              <Landmark className="size-4" />
              <span className="hidden sm:inline">Accordi Staff</span>
            </TabsTrigger>
          )}

          {isAdmin && (
            <TabsTrigger
              value="disciplinare"
              className="flex items-center gap-2"
            >
              <ShieldAlert className="size-4" />
              <span className="hidden sm:inline">Storico Disciplinare</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="anagrafica" className="mt-4">
          <div className="space-y-4">
            <div className="flex flex-col items-end gap-3 rounded-lg border border-slate-100 bg-muted/50 p-4 sm:flex-row">
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cerca per nome..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="bg-background pl-9"
                />
              </div>
              <div className="w-full sm:w-[180px]">
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Categoria Corsi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le Categorie</SelectItem>
                    <SelectItem value="DANZA">Danza</SelectItem>
                    <SelectItem value="FITNESS">Fitness</SelectItem>
                    <SelectItem value="BALLI DI COPPIA">
                      Balli di Coppia
                    </SelectItem>
                    <SelectItem value="BAMBINI">Bambini</SelectItem>
                    <SelectItem value="AERIAL">Aerial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-[150px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="active">Attivo</SelectItem>
                    <SelectItem value="inactive">Inattivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex h-10 items-center gap-2 px-2">
                <Switch
                  id="archive"
                  checked={showArchive}
                  onCheckedChange={setShowArchive}
                />
                <Label
                  htmlFor="archive"
                  className="cursor-pointer text-sm font-medium"
                >
                  Mostra archivio
                </Label>
              </div>
              {isAdmin && (
                <Button
                  onClick={() => {
                    setEditingInstructor(null);
                    setIsPrivateLessonsAuth(false);
                    setIsFormOpen(true);
                  }}
                  className="ml-auto"
                >
                  <Plus className="mr-2 size-4" />
                  Nuovo Insegnante
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-medium text-muted-foreground border-b-2 border-red-500 pb-1">
                N. {filteredStaff.length} Record Trovati
              </span>
            </div>

            <div className="overflow-hidden rounded-md border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead
                      sortKey="lastName"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    >
                      Cognome
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="firstName"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    >
                      Nome
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="specialization"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    >
                      Specializzazione
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="courses"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    >
                      Corsi Assegnati
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="email"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    >
                      Email
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="phone"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    >
                      Telefono
                    </SortableTableHead>
                    {isAdmin && (
                      <SortableTableHead
                        sortKey="hourlyRate"
                        currentSort={sortConfig}
                        onSort={handleSort}
                      >
                        Tariffa Oraria
                      </SortableTableHead>
                    )}
                    <SortableTableHead
                      sortKey="status"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    >
                      Staff Status
                    </SortableTableHead>
                    {isAdmin && (
                      <TableHead className="text-right">Azioni</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Skeleton className="h-4 w-12" />
                          </TableCell>
                        )}
                        <TableCell>
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Skeleton className="h-6 w-12" />
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={isAdmin ? 9 : 7}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Nessun insegnante trovato.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStaff.map((s) => {
                      const assignedCourses = getInstructorCourses(
                        s.instructorId,
                      );
                      return (
                        <TableRow
                          key={s.id || s.firstName}
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => setSelectedStaff(s)}
                        >
                          <TableCell
                            className={cn(
                              "font-medium",
                              isSortedColumn("lastName") &&
                                "sorted-column-cell",
                            )}
                          >
                            {s.lastName}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "font-medium",
                              isSortedColumn("firstName") &&
                                "sorted-column-cell",
                            )}
                          >
                            {s.firstName}
                          </TableCell>
                          <TableCell
                            className={cn(
                              isSortedColumn("specialization") &&
                                "sorted-column-cell",
                            )}
                          >
                            {s.specialization || "—"}
                          </TableCell>
                          <TableCell
                            className={cn(
                              isSortedColumn("courses") && "sorted-column-cell",
                            )}
                          >
                            <div className="flex flex-wrap gap-1">
                              {assignedCourses.length === 0 ? (
                                <span className="text-sm text-muted-foreground">
                                  Nessun corso
                                </span>
                              ) : assignedCourses.length <= 2 ? (
                                assignedCourses.map((c: any) => (
                                  <Link
                                    key={c.id}
                                    href={`/corsi?courseId=${c.id}`}
                                  >
                                    <Badge
                                      variant="outline"
                                      className="hover-elevate cursor-pointer text-xs"
                                    >
                                      {c.name}
                                    </Badge>
                                  </Link>
                                ))
                              ) : (
                                <>
                                  {assignedCourses.slice(0, 2).map((c: any) => (
                                    <Link
                                      key={c.id}
                                      href={`/corsi?courseId=${c.id}`}
                                    >
                                      <Badge
                                        variant="outline"
                                        className="hover-elevate cursor-pointer text-xs"
                                      >
                                        {c.name}
                                      </Badge>
                                    </Link>
                                  ))}
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    +{assignedCourses.length - 2} altri
                                  </Badge>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell
                            className={cn(
                              isSortedColumn("email") && "sorted-column-cell",
                            )}
                          >
                            {s.email ? (
                              s.email
                            ) : (
                              <div
                                className="flex items-center gap-1 text-xs font-bold text-red-500"
                                title="Manca Dato"
                              >
                                <AlertTriangle className="size-3 fill-red-500 text-white" />
                                <span>Manca Dato</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell
                            className={cn(
                              isSortedColumn("phone") && "sorted-column-cell",
                            )}
                          >
                            {s.phone ? (
                              s.phone
                            ) : (
                              <div
                                className="flex items-center gap-1 text-xs font-bold text-red-500"
                                title="Manca Dato"
                              >
                                <AlertTriangle className="size-3 fill-red-500 text-white" />
                                <span>Manca Dato</span>
                              </div>
                            )}
                          </TableCell>
                          {isAdmin && (
                            <TableCell
                              className={cn(
                                isSortedColumn("hourlyRate") &&
                                  "sorted-column-cell",
                              )}
                            >
                              {s.hourlyRate ? `€${s.hourlyRate}/h` : "—"}
                            </TableCell>
                          )}
                          <TableCell
                            className={cn(
                              isSortedColumn("status") && "sorted-column-cell",
                            )}
                          >
                            <Badge
                              className={
                                s.staff_status === "INATTIVO"
                                  ? "bg-slate-400"
                                  : "bg-emerald-500"
                              }
                            >
                              {s.staff_status || "ATTIVO"}
                            </Badge>
                          </TableCell>
                          {isAdmin && (
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingInstructor(s);
                                    setIsPrivateLessonsAuth(
                                      s.lezioniPrivateAutorizzate === true,
                                    );
                                    setIsFormOpen(true);
                                  }}
                                >
                                  <Edit className="size-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (
                                      confirm(
                                        `Sei sicuro di voler eliminare ${s.lastName} ${s.firstName}? Questa azione non può essere annullata.`,
                                      )
                                    ) {
                                      if (s.instructorId)
                                        deleteMutation.mutate(s.instructorId);
                                    }
                                  }}
                                >
                                  <Trash2 className="size-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pt" className="mt-4">
          {isLoadingPt ? (
            <div className="overflow-hidden rounded-md border bg-background p-6 text-center text-muted-foreground">
              Caricamento...
            </div>
          ) : ptList.length === 0 ? (
            <Alert className="mt-4 border-dashed bg-muted text-muted-foreground">
              <Briefcase className="size-4" />
              <AlertTitle>Nessun Personal Trainer censito.</AlertTitle>
              <AlertDescription>
                I PT verranno visualizzati qui non appena il loro profilo sarà
                aggiornato nel sistema.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-sm font-medium text-muted-foreground border-b-2 border-red-500 pb-1">
                  N. {ptList.length} Record Trovati
                </span>
              </div>
              <div className="overflow-hidden rounded-md border bg-background">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead
                        sortKey="lastName"
                        currentSort={sortConfigPt}
                        onSort={handleSortPt}
                      >
                        Cognome
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="firstName"
                        currentSort={sortConfigPt}
                        onSort={handleSortPt}
                      >
                        Nome
                      </SortableTableHead>
                      <TableHead>Ruolo</TableHead>
                      <TableHead>Cellulare</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPtList.map((pt: any) => (
                      <TableRow
                        key={pt.id || pt.firstName}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => setSelectedStaff(pt)}
                      >
                        <TableCell
                          className={cn(
                            "font-semibold",
                            isSortedColumnPt("lastName") && "sorted-column-cell"
                          )}
                        >
                          {pt.lastName}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "font-semibold",
                            isSortedColumnPt("firstName") && "sorted-column-cell"
                          )}
                        >
                          {pt.firstName}
                        </TableCell>
                        <TableCell>
                          {pt.specializzazione || "Personal Trainer"}
                        </TableCell>
                        <TableCell>{pt.phone || "—"}</TableCell>
                        <TableCell>{pt.email || "—"}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              pt.staff_status === "INATTIVO"
                                ? "bg-slate-400"
                                : "bg-emerald-500"
                            }
                          >
                            {pt.staff_status || "ATTIVO"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="mt-4 space-y-6">
          <div className="rounded-md border bg-muted p-4">
            <Label>Seleziona Insegnante/PT</Label>
            <Select
              value={complianceMemberId}
              onValueChange={setComplianceMemberId}
            >
              <SelectTrigger className="mt-2 w-full bg-background sm:w-72">
                <SelectValue placeholder="Seleziona dallo staff..." />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((s) => (
                  <SelectItem
                    key={s.id || s.firstName}
                    value={s.id?.toString() || s.firstName}
                  >
                    {s.lastName} {s.firstName}
                  </SelectItem>
                ))}
                {ptListSorted.map((pt: any) => (
                  <SelectItem
                    key={`pt-${pt.id || pt.firstName}`}
                    value={pt.id?.toString() || pt.firstName}
                  >
                    {pt.lastName} {pt.firstName} (PT)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {complianceMemberId ? (
            <CompliancePanel
              memberId={complianceMemberId}
              complianceData={complianceData}
              isAdmin={isAdmin}
            />
          ) : (
            <Alert className="w-full border-dashed py-8 text-center text-muted-foreground">
              <FileCheck className="mx-auto mb-2 size-8 opacity-30" />
              Seleziona un utente dello staff per visualizzarne lo stato di
              compliance documentale.
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="accordi" className="mt-4">
          {isAdmin ? (
            <AccordiTab seasonId="active" />
          ) : (
            <Alert variant="destructive" className="mt-4">
              <Lock className="size-4" />
              <AlertTitle>Accesso Negato</AlertTitle>
              <AlertDescription>
                Non hai i permessi sufficienti per visualizzare gli accordi
                economici. Sezione riservata alla direzione.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="presenze" className="mt-4">
          <PresenzeTab isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="disciplinare" className="mt-4">
          {isAdmin ? (
            <DisciplinareTab staffList={staffList} />
          ) : (
            <Alert variant="destructive" className="mt-4">
              <Lock className="size-4" />
              <AlertTitle>Accesso Negato</AlertTitle>
              <AlertDescription>
                Non hai i permessi sufficienti per visualizzare lo storico
                disciplinare. Sezione riservata alla direzione.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      <Sheet
        open={!!selectedStaff}
        onOpenChange={(o) => !o && setSelectedStaff(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="mt-4 flex items-center justify-between text-xl">
              <span>
                {selectedStaff?.lastName} {selectedStaff?.firstName}
              </span>
              <Badge
                className={
                  selectedStaff?.staff_status === "INATTIVO"
                    ? "bg-slate-400"
                    : "bg-emerald-500"
                }
              >
                {selectedStaff?.staff_status || "ATTIVO"}
              </Badge>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-8 space-y-6">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Contatti
              </Label>
              <p className="mt-1 text-sm">
                {selectedStaff?.email || "Nessuna email registrata"}
              </p>
              <p className="text-sm">
                Cellulare: {selectedStaff?.phone || "—"}
              </p>
            </div>

            <div className="space-y-1 border-t pt-4">
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Account di Sistema
              </p>
              {selectedStaff?.user_id ? (
                <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-900/50 dark:bg-emerald-950/20">
                  <span className="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-400">
                    <FileCheck className="size-4" /> Account attivo
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      selectedStaff.email_verified
                        ? "border-emerald-300 text-emerald-700"
                        : "border-amber-300 text-amber-600 dark:border-amber-800/50"
                    }
                  >
                    {selectedStaff.email_verified
                      ? "Verificato"
                      : "Da verificare"}
                  </Badge>
                </div>
              ) : (
                <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/20">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
                    <AlertTriangle className="size-4" />
                    <span className="font-medium">
                      Questo insegnante non ha ancora un account
                    </span>
                  </div>
                  {isAdmin && (
                    <Button
                      size="sm"
                      onClick={() => setIsCreateAccountDialogOpen(true)}
                      className="w-full bg-amber-600 hover:bg-amber-700"
                    >
                      Crea Account
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1 border-t pt-4">
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Tessera GemPass
              </p>
              {selectedStaff?.tessera ? (
                <div className="space-y-2 rounded-md border bg-muted p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground/80">
                      Tessera #{selectedStaff.tessera.numero || "N/A"}
                    </span>
                    <Badge
                      className={
                        selectedStaff.tessera.stato === "ATTIVA"
                          ? "bg-emerald-500"
                          : selectedStaff.tessera.stato === "IN SCADENZA"
                            ? "bg-amber-500"
                            : selectedStaff.tessera.stato === "NESSUNA"
                              ? "bg-slate-400"
                              : "bg-red-500"
                      }
                    >
                      {selectedStaff.tessera.stato || "SCONOSCIUTO"}
                    </Badge>
                  </div>
                  {selectedStaff.tessera.scadenza && (
                    <p className="text-xs text-muted-foreground">
                      Scadenza:{" "}
                      {new Date(
                        selectedStaff.tessera.scadenza,
                      ).toLocaleDateString()}
                    </p>
                  )}
                  {selectedStaff.tessera.stagione && (
                    <p className="text-xs text-muted-foreground">
                      Stagione: {selectedStaff.tessera.stagione}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-md border bg-muted p-3 text-sm">
                  <Badge variant="destructive">NESSUNA TESSERA</Badge>
                  <a
                    href="/gempass"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Vai a GemPass
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-1 border-t pt-4">
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Autorizzazione lezioni private
              </p>
              {selectedStaff?.lezioni_private_autorizzate ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400">
                  Autorizzato in data{" "}
                  {selectedStaff.data_autorizzazione
                    ? new Date(
                        selectedStaff.data_autorizzazione,
                      ).toLocaleDateString()
                    : "N/A"}
                  <br />
                  da: {selectedStaff.autorizzato_da || "Direzione"}
                </div>
              ) : (
                <div className="rounded-md border bg-slate-100 p-3 text-sm text-muted-foreground dark:bg-slate-800">
                  Non autorizzato
                </div>
              )}
            </div>

            <div className="space-y-1 border-t pt-4">
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Documenti Compliance
              </p>
              <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
                <FileCheck className="size-4 text-primary" />
                <span className="text-sm font-medium">Vedi tab Compliance</span>
                <button
                  onClick={() => {
                    if (selectedStaff?.id)
                      setComplianceMemberId(selectedStaff.id.toString());
                    setActiveTab("compliance");
                    setSelectedStaff(null);
                  }}
                  className="ml-auto text-xs font-bold text-primary hover:underline"
                >
                  Vai alla Tab
                </button>
              </div>
            </div>

            {isAdmin && (
              <div className="space-y-1 border-t pt-4">
                <p className="mb-3 text-sm font-medium text-muted-foreground">
                  Firme e Accordi
                </p>
                <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
                  <Landmark className="size-4 text-primary" />
                  <span className="text-sm font-medium">
                    Contratti Tab Accordi
                  </span>
                  <button
                    onClick={() => {
                      setSelectedStaff(null);
                      setActiveTab("accordi");
                    }}
                    className="ml-auto text-xs font-bold text-primary hover:underline"
                  >
                    Vai alla Tab
                  </button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={isCreateAccountDialogOpen}
        onOpenChange={setIsCreateAccountDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Crea account per {selectedStaff?.lastName}{" "}
              {selectedStaff?.firstName}
            </DialogTitle>
            <DialogDescription>
              Verrà creato un account con email:
              <br />
              <strong>{selectedStaff?.email || "Nessuna email"}</strong>
              <br />
              <br />
              L'OTP di accesso verrà mostrato una sola volta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateAccountDialogOpen(false)}
            >
              Annulla
            </Button>
            <Button
              onClick={() =>
                selectedStaff?.id &&
                createAccountMutation.mutate(selectedStaff.id)
              }
              disabled={
                createAccountMutation.isPending || !selectedStaff?.email
              }
            >
              {createAccountMutation.isPending
                ? "Creazione in corso..."
                : "Conferma e Crea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!createdAccountOtp}
        onOpenChange={(o) => !o && setCreatedAccountOtp(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <FileCheck className="size-5" /> Account creato!
            </DialogTitle>
            <DialogDescription>
              Comunica questi dati all'insegnante:
              <br />
              <br />
              Email: <strong>{createdAccountOtp?.email}</strong>
              <br />
              Codice accesso temporaneo:{" "}
              <strong className="rounded bg-slate-100 px-2 py-1 text-lg dark:bg-slate-800">
                {createdAccountOtp?.otp}
              </strong>
              <br />
              <br />
              Valido per 24 ore.
              <br />
              <span className="mt-2 flex items-center gap-1 font-bold text-amber-600">
                <AlertTriangle className="size-4" /> Questo codice non verrà
                mostrato di nuovo.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(
                  `Email: ${createdAccountOtp?.email}\nCodice OTP: ${createdAccountOtp?.otp}`,
                );
                toast({ title: "Copiato negli appunti" });
              }}
            >
              Copia OTP
            </Button>
            <Button onClick={() => setCreatedAccountOtp(null)}>Chiudi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInstructor ? "Modifica Insegnante" : "Nuovo Insegnante"}
            </DialogTitle>
            <DialogDescription>
              Inserisci i dati dell'insegnante e verifica la compliance
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="border-b pb-2 text-lg font-semibold">
                Dati Anagrafici
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    defaultValue={editingInstructor?.firstName}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Cognome *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    defaultValue={editingInstructor?.lastName}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={editingInstructor?.email}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={editingInstructor?.phone}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specializzazione</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    defaultValue={editingInstructor?.specialization}
                    placeholder="Es: Danza, Fitness..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Tariffa Oraria (€)</Label>
                  <Input
                    id="hourlyRate"
                    name="hourlyRate"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={editingInstructor?.hourlyRate}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">Biografia</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    defaultValue={editingInstructor?.bio}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="border-b pb-2 text-lg font-semibold">GemStaff</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="staffStatus">Staff Status</Label>
                  <Select
                    name="staffStatus"
                    defaultValue={editingInstructor?.staff_status || "ATTIVO"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ATTIVO">Attivo</SelectItem>
                      <SelectItem value="INATTIVO">
                        Inattivo / Archivio
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  <div className="mt-8 flex items-center gap-2">
                    <Switch
                      id="lezioniPrivateAutorizzate"
                      name="lezioniPrivateAutorizzate"
                      checked={isPrivateLessonsAuth}
                      onCheckedChange={setIsPrivateLessonsAuth}
                    />
                    <Label
                      htmlFor="lezioniPrivateAutorizzate"
                      className="cursor-pointer"
                    >
                      Autorizzazione Lezioni Private
                    </Label>
                  </div>
                </div>
              </div>

              {isPrivateLessonsAuth && (
                <div className="grid grid-cols-1 gap-4 rounded-md border bg-muted p-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="lezioniPrivateAutorizzateBy">
                      Autorizzato da
                    </Label>
                    <Input
                      id="lezioniPrivateAutorizzateBy"
                      name="lezioniPrivateAutorizzateBy"
                      defaultValue={
                        editingInstructor?.lezioni_private_autorizzate_by
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lezioniPrivateAutorizzateAt">
                      Data autorizzazione
                    </Label>
                    <Input
                      type="date"
                      id="lezioniPrivateAutorizzateAt"
                      name="lezioniPrivateAutorizzateAt"
                      defaultValue={
                        editingInstructor?.lezioni_private_autorizzate_at
                          ? new Date(
                              editingInstructor.lezioni_private_autorizzate_at,
                            )
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {editingInstructor && (
              <div className="space-y-4">
                <h3 className="border-b pb-2 text-lg font-semibold">
                  Compliance
                </h3>
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border bg-muted p-4">
                  <div className="flex items-center gap-4 text-sm font-medium">
                    <span>
                      CI:{" "}
                      {editingInstructor?.documenti?.carta_identita?.presente
                        ? "✓"
                        : "✗"}
                    </span>
                    <span>
                      CF:{" "}
                      {editingInstructor?.documenti?.codice_fiscale?.presente
                        ? "✓"
                        : "✗"}
                    </span>
                    <span>
                      Diploma:{" "}
                      {editingInstructor?.documenti?.diploma_tesserino?.presente
                        ? "✓"
                        : "✗"}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => {
                      setIsFormOpen(false);
                      setActiveTab("compliance");
                      setComplianceMemberId(editingInstructor.id?.toString());
                    }}
                    className="px-0"
                  >
                    Gestisci documenti &rarr;
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingInstructor ? "Salva Modifiche" : "Crea Insegnante"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
