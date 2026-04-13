import { useState, useEffect, Fragment } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Users, Briefcase, FileCheck, Landmark, CalendarClock, ShieldAlert, Lock, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

function CompliancePanel({ memberId, complianceData, isAdminOrDirezione }: { memberId: string, complianceData: any, isAdminOrDirezione: boolean }) {
   const queryClient = useQueryClient();
   const { toast } = useToast();

   const completeData = complianceData || {
      documenti: {}
   };
   const docs = completeData.documenti || {};
   const keys = ["diploma_tesserino", "carta_identita", "codice_fiscale", "permesso_soggiorno", "foto_id", "video_promo"];
   const presentCount = keys.filter((k: string) => docs[k]?.presente).length;
   const totalCount = keys.length;
   const progress = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

   const toggleMutation = useMutation({
     mutationFn: async (payload: { docKey: string, presente: boolean }) => {
        return await apiRequest("POST", "/api/gemstaff/compliance", { memberId: parseInt(memberId), ...payload });
     },
     onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/gemstaff/compliance", memberId] });
        toast({ title: "Documento aggiornato" });
     },
     onError: () => {
        toast({ title: "Errore (404)", description: "Endpoint backend per update mancante al momento.", variant: "destructive" });
     }
   });

   return (
     <div className="space-y-6">
       <div className="bg-white border rounded-md p-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Stato Avanzamento Compliance</h3>
            <p className="text-sm text-muted-foreground">{presentCount} su {totalCount} documenti inseriti</p>
          </div>
          <div className="w-1/3 flex items-center gap-3">
             <Progress value={progress} className="w-full" />
             <span className="font-mono text-sm font-bold">{Math.round(progress)}%</span>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {keys.map((k) => {
            const doc = docs[k];
            const isPresent = doc?.presente;
            const expDate = doc?.scadenza ? new Date(doc.scadenza) : null;
            let isExpiring = false;
            let isExpired = false;
            if (expDate) {
               const days = (expDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24);
               if (days < 0) isExpired = true;
               else if (days < 30) isExpiring = true;
            }

            return (
              <Card key={k} className={!isPresent ? 'bg-slate-50/50' : ''}>
                 <CardContent className="p-4 space-y-3">
                   <div className="flex items-start justify-between">
                      <span className="font-semibold text-sm capitalize">{k.replace(/_/g, " ")}</span>
                      {isPresent ? <Badge className="bg-emerald-500">PRESENTE ✓</Badge> : <Badge variant="destructive">MANCANTE ✗</Badge>}
                   </div>
                   {isPresent && expDate && (
                      <div className="text-xs">
                        Scadenza: <span className={isExpired ? "text-red-600 font-bold" : isExpiring ? "text-amber-600 font-bold" : "text-muted-foreground"}>
                           {expDate.toLocaleDateString()}
                        </span>
                        {isExpired && <span className="ml-2 text-red-600">(Scaduto)</span>}
                        {isExpiring && !isExpired && <span className="ml-2 text-amber-600">(In Scadenza)</span>}
                      </div>
                   )}
                   {isAdminOrDirezione && (
                      <div className="pt-2">
                        <Button 
                          variant="outline" size="sm" className="w-full text-xs" 
                          onClick={() => toggleMutation.mutate({ docKey: k, presente: !isPresent })}
                          disabled={toggleMutation.isPending}
                        >
                           {isPresent ? 'Segna come Mancante' : 'Segna come Presente'}
                        </Button>
                      </div>
                   )}
                 </CardContent>
              </Card>
            )
         })}
       </div>
     </div>
   )
}

function PresenzeTab({ isAdminOrDirezione }: { isAdminOrDirezione: boolean }) {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [subTab, setSubTab] = useState("presenze");

  const { data: presenzeList = [] } = useQuery<any[]>({
    queryKey: ["/api/gemstaff/presenze", month, year],
  });

  const { data: sostituzioniList = [] } = useQuery<any[]>({
    queryKey: ["/api/gemstaff/sostituzioni", month, year]
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleConfermaMese = () => {
    if (confirm(`Stai confermando le presenze di ${month}/${year}. Questa azione non può essere annullata. Vuoi procedere?`)) {
      apiRequest("POST", "/api/gemstaff/presenze/conferma", { month, year }).then(() => {
         queryClient.invalidateQueries({ queryKey: ["/api/gemstaff/presenze", month, year] });
         toast({ title: "Mese confermato con successo!" });
      }).catch(() => {
         toast({ title: "Errore", description: "Impossibile confermare il mese", variant: "destructive" });
      });
    }
  };

  return (
    <div className="space-y-4">
       <div className="flex items-center gap-4 bg-slate-50 p-4 border rounded-md">
          <div className="flex flex-col gap-1 w-32">
            <Label>Mese</Label>
            <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
              <SelectTrigger className="bg-white"><SelectValue/></SelectTrigger>
              <SelectContent>
                {Array.from({length: 12}).map((_, i) => (
                  <SelectItem key={i+1} value={(i+1).toString()}>{i+1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1 w-32">
            <Label>Anno</Label>
            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger className="bg-white"><SelectValue/></SelectTrigger>
              <SelectContent>
                {[...Array(5)].map((_, i) => (
                  <SelectItem key={i} value={(new Date().getFullYear() - 2 + i).toString()}>{new Date().getFullYear() - 2 + i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
       </div>

       <Tabs value={subTab} onValueChange={setSubTab}>
         <TabsList className="bg-slate-100 mb-4 p-1 rounded-md">
           <TabsTrigger value="presenze" className="w-48">Presenze Mensili</TabsTrigger>
           <TabsTrigger value="sostituzioni" className="w-48">Sostituzioni</TabsTrigger>
         </TabsList>

         <TabsContent value="presenze" className="space-y-4">
           <div className="flex items-center justify-between">
             <Button variant="outline">Aggiungi presenza manuale</Button>
             {isAdminOrDirezione && (
               <Button onClick={handleConfermaMese} className="bg-emerald-600 hover:bg-emerald-700">CONFERMA MESE</Button>
             )}
           </div>
           <div className="border rounded-md bg-white overflow-hidden">
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
                      <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Nessuna presenza trovata per questo mese.</TableCell></TableRow>
                   ) : presenzeList.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-semibold">{p.nome}</TableCell>
                        <TableCell>{p.ore_totali}</TableCell>
                        <TableCell>
                          <Badge className={p.status === 'CONFERMATO' ? 'bg-emerald-500' : 'bg-slate-400'}>{p.status || 'BOZZA'}</Badge>
                        </TableCell>
                      </TableRow>
                   ))}
                </TableBody>
             </Table>
           </div>
         </TabsContent>

         <TabsContent value="sostituzioni" className="space-y-4">
           <div className="flex justify-end">
             <Button variant="outline">Registra sostituzione</Button>
           </div>
           <div className="border rounded-md bg-white overflow-hidden">
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
                      <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Nessuna sostituzione registrata.</TableCell></TableRow>
                   ) : sostituzioniList.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.data ? new Date(s.data).toLocaleDateString() : '—'}</TableCell>
                        <TableCell>{s.assente || '—'}</TableCell>
                        <TableCell>{s.sostituto || '—'}</TableCell>
                        <TableCell>{s.lezione || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{s.compenso_a || 'NESSUNO'}</Badge>
                        </TableCell>
                        <TableCell>{s.visto_segr ? '✓' : '✗'}</TableCell>
                        <TableCell>{s.visto_elisa ? '✓' : '✗'}</TableCell>
                      </TableRow>
                   ))}
                </TableBody>
             </Table>
           </div>
         </TabsContent>
       </Tabs>
    </div>
  )
}

function DisciplinareTab({ staffList }: { staffList: any[] }) {
  const [memberId, setMemberId] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: eventiList = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/gemstaff/disciplinare", memberId],
    enabled: !!memberId,
  });

  const [isNuovoOpen, setIsNuovoOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [eventType, setEventType] = useState("richiamo_verbale");
  const [dataEvento, setDataEvento] = useState(new Date().toISOString().substring(0, 10));
  const [descrizione, setDescrizione] = useState("");

  const creaMutation = useMutation({
    mutationFn: async (payload: any) => await apiRequest("POST", "/api/gemstaff/disciplinare", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gemstaff/disciplinare", memberId] });
      toast({ title: "Evento registrato" });
      setIsNuovoOpen(false);
      setDescrizione("");
    }
  });

  const aggiornaMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number, payload: any }) => await apiRequest("PATCH", `/api/gemstaff/disciplinare/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gemstaff/disciplinare", memberId] });
      toast({ title: "Evento aggiornato" });
    }
  });

  const getBadgeType = (type: string) => {
    switch(type) {
       case 'richiamo_verbale': return 'bg-yellow-500 hover:bg-yellow-600';
       case 'ammonizione_scritta': return 'bg-orange-500 hover:bg-orange-600';
       case 'sospensione': return 'bg-red-500 hover:bg-red-600';
       case 'interruzione_rapporto': return 'bg-red-900 hover:bg-red-950';
       default: return 'bg-slate-500';
    }
  };

  const getBadgeLabel = (type: string) => {
    return type?.replace(/_/g, ' ')?.toUpperCase() || 'SCONOSCIUTO';
  };

  return (
    <div className="space-y-6 mt-4">
       <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
         <ShieldAlert className="h-4 w-4 stroke-red-800" />
         <AlertTitle>⚠️ Sezione riservata — accesso solo Direzione.</AlertTitle>
         <AlertDescription>
           I dati sono confidenziali e non visibili allo staff. Questa tabella monitora i richiami e lo storico disciplinare.
         </AlertDescription>
       </Alert>

       <div className="bg-slate-50 p-4 border rounded-md flex items-center justify-between">
          <div className="w-1/2">
             <Label>Seleziona Insegnante</Label>
             <Select value={memberId} onValueChange={setMemberId}>
               <SelectTrigger className="mt-2 bg-white"><SelectValue placeholder="Scegli..."/></SelectTrigger>
               <SelectContent>
                 {staffList.map(s => <SelectItem key={s.id || s.nome} value={s.id?.toString() || s.nome}>{s.nome}</SelectItem>)}
               </SelectContent>
             </Select>
          </div>
          {memberId && (
            <div className="pt-6">
              <Button onClick={() => setIsNuovoOpen(!isNuovoOpen)} variant={isNuovoOpen ? "outline" : "default"}>
                {isNuovoOpen ? "Annulla" : "Nuovo Evento"}
              </Button>
            </div>
          )}
       </div>

       {isNuovoOpen && memberId && (
         <Card className="border-emerald-200">
           <CardContent className="p-4 space-y-4">
             <h3 className="font-semibold text-lg">Registra Nuovo Evento</h3>
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label>Tipo Evento</Label>
                 <Select value={eventType} onValueChange={setEventType}>
                   <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="richiamo_verbale">Richiamo Verbale</SelectItem>
                     <SelectItem value="ammonizione_scritta">Ammonizione Scritta</SelectItem>
                     <SelectItem value="sospensione">Sospensione</SelectItem>
                     <SelectItem value="interruzione_rapporto">Interruzione Rapporto</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div>
                 <Label>Data Evento</Label>
                 <Input type="date" value={dataEvento} onChange={(e) => setDataEvento(e.target.value)} className="mt-1" />
               </div>
             </div>
             <div>
               <Label>Descrizione</Label>
               <Textarea value={descrizione} onChange={(e) => setDescrizione(e.target.value)} rows={3} className="mt-1" placeholder="Dettaglia l'accaduto..." />
             </div>
             <Button 
                onClick={() => creaMutation.mutate({ memberId: parseInt(memberId), eventType, dataEvento, descrizione })}
                disabled={!descrizione || creaMutation.isPending}
             >Registra</Button>
           </CardContent>
         </Card>
       )}

       {memberId && (
         <div className="border rounded-md bg-white overflow-hidden">
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
                  <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Caricamento...</TableCell></TableRow>
                ) : eventiList.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Nessun evento disciplinare censito per questo staff.</TableCell></TableRow>
                ) : eventiList.map((ev) => (
                  <Fragment key={ev.id}>
                    <TableRow className="cursor-pointer hover:bg-slate-50" onClick={() => setExpandedId(expandedId === ev.id ? null : ev.id)}>
                      <TableCell>{ev.data_evento ? new Date(ev.data_evento).toLocaleDateString() : '—'}</TableCell>
                      <TableCell><Badge className={`text-white ${getBadgeType(ev.event_type)}`}>{getBadgeLabel(ev.event_type)}</Badge></TableCell>
                      <TableCell>{ev.stato || 'APERTURA'}</TableCell>
                    </TableRow>
                    {expandedId === ev.id && (
                      <TableRow className="bg-slate-50 border-b">
                         <TableCell colSpan={3} className="p-4">
                           <div className="space-y-4">
                              <div>
                                <Label className="text-xs text-muted-foreground">Descrizione Operativa</Label>
                                <p className="text-sm p-2 bg-white border rounded-md">{ev.descrizione}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Risposta Insegnante</Label>
                                  <Textarea 
                                    defaultValue={ev.risposta_insegnante || ""} 
                                    placeholder="Annota se difeso..."
                                    onBlur={(e) => {
                                      if (e.target.value !== (ev.risposta_insegnante || "")) {
                                         aggiornaMutation.mutate({ id: ev.id, payload: { risposta_insegnante: e.target.value } });
                                      }
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Decisione Direzione</Label>
                                  <Textarea 
                                    defaultValue={ev.decisione_direzione || ""} 
                                    placeholder="Annota sanzione o perdono..."
                                    onBlur={(e) => {
                                      if (e.target.value !== (ev.decisione_direzione || "")) {
                                         aggiornaMutation.mutate({ id: ev.id, payload: { decisione_direzione: e.target.value } });
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Data Risoluzione</Label>
                                <div className="flex gap-2 items-center">
                                  <Input type="date" className="w-48"
                                    defaultValue={ev.data_risoluzione ? new Date(ev.data_risoluzione).toISOString().substring(0, 10) : ""}
                                    onBlur={(e) => {
                                      const old = ev.data_risoluzione ? new Date(ev.data_risoluzione).toISOString().substring(0, 10) : "";
                                      if (e.target.value !== old) {
                                         aggiornaMutation.mutate({ id: ev.id, payload: { data_risoluzione: e.target.value ? new Date(e.target.value).toISOString() : null, stato: e.target.value ? 'CHIUSA' : 'APERTA' } });
                                      }
                                    }}
                                  />
                                  {ev.data_risoluzione && <Badge className="bg-emerald-500">CHIUSO</Badge>}
                                </div>
                              </div>
                           </div>
                         </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
             </TableBody>
           </Table>
         </div>
       )}
    </div>
  )
}

export default function GemStaff() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("anagrafica");
  const [searchName, setSearchName] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showArchive, setShowArchive] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [complianceMemberId, setComplianceMemberId] = useState<string>("");

  const queryUrl = `/api/gemstaff/insegnanti${showArchive ? '?status=inattivo' : ''}`;
  const { data: staffList = [], isLoading } = useQuery<any[]>({
     queryKey: [queryUrl],
  });

  const { data: ptList = [], isLoading: isLoadingPt } = useQuery<any[]>({
     queryKey: ["/api/gemstaff/pt"],
  });

  const { data: complianceData } = useQuery<any>({
     queryKey: ["/api/gemstaff/compliance", complianceMemberId],
     enabled: !!complianceMemberId
  });

  const filteredStaff = staffList.filter((s) => {
     const matchName = searchName === "" || s.nome?.toLowerCase().includes(searchName.toLowerCase());
     const matchCat = categoryFilter === "all" || s.corsi?.includes(categoryFilter);
     return matchName && matchCat;
  });

  const roleNameLower = user?.role?.toLowerCase() || "";
  const isAdminOrDirezione = ["admin", "amministratore totale", "super admin", "master", "direzione"].includes(roleNameLower);

  useEffect(() => {
    if (roleNameLower === "insegnante") {
      setLocation("/gemstaff/me");
    }
  }, [roleNameLower, setLocation]);

  if (roleNameLower === "insegnante") {
    return null; // Evita flickering durante il redirect
  }

  const PlaceholderContent = ({ title }: { title: string }) => (
    <div className="flex flex-col items-center justify-center p-12 bg-slate-50/50 border rounded-lg border-dashed mt-4 text-center">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <Briefcase className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm">
        Caricamento {title.toLowerCase()} in arrivo (F2-002)
      </p>
    </div>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GemStaff</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestione Risorse Umane, Staff e Insegnanti
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-auto">
          <TabsTrigger value="anagrafica" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Anagrafica Insegnanti</span>
          </TabsTrigger>
          <TabsTrigger value="pt" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            <span className="hidden sm:inline">Personal Trainer</span>
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <FileCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Compliance Documenti</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="accordi" 
            disabled={!isAdminOrDirezione}
            className="flex items-center gap-2 disabled:opacity-50"
          >
            {isAdminOrDirezione ? <Landmark className="w-4 h-4" /> : <Lock className="w-4 h-4 text-slate-400" />}
            <span className="hidden sm:inline">Accordi Economici</span>
          </TabsTrigger>
          
          <TabsTrigger value="presenze" className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4" />
            <span className="hidden sm:inline">Presenze & Sostituzioni</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="disciplinare" 
            disabled={!isAdminOrDirezione}
            className="flex items-center gap-2 disabled:opacity-50"
          >
            {isAdminOrDirezione ? <ShieldAlert className="w-4 h-4" /> : <Lock className="w-4 h-4 text-slate-400" />}
            <span className="hidden sm:inline">Storico Disciplinare</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="anagrafica" className="mt-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-end bg-slate-50/50 p-4 rounded-lg border border-slate-100">
               <div className="relative flex-1 min-w-[200px]">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <Input
                   placeholder="Cerca per nome..."
                   value={searchName}
                   onChange={(e) => setSearchName(e.target.value)}
                   className="pl-9 bg-white"
                 />
               </div>
               <div className="w-full sm:w-[180px]">
                 <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                   <SelectTrigger className="bg-white">
                     <SelectValue placeholder="Categoria Corsi" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">Tutte le Categorie</SelectItem>
                     <SelectItem value="DANZA">Danza</SelectItem>
                     <SelectItem value="FITNESS">Fitness</SelectItem>
                     <SelectItem value="BALLI DI COPPIA">Balli di Coppia</SelectItem>
                     <SelectItem value="BAMBINI">Bambini</SelectItem>
                     <SelectItem value="AERIAL">Aerial</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="flex items-center gap-2 h-10 px-2">
                 <Switch id="archive" checked={showArchive} onCheckedChange={setShowArchive} />
                 <Label htmlFor="archive" className="text-sm font-medium cursor-pointer">Mostra archivio</Label>
               </div>
            </div>

            <div className="border rounded-md bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria/Corsi</TableHead>
                    <TableHead>Cellulare</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Stato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                       <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                       </TableRow>
                    ))
                  ) : filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                         Nessun insegnante trovato.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map((s) => (
                       <TableRow key={s.id || s.nome} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedStaff(s)}>
                         <TableCell className="font-semibold">{s.nome}</TableCell>
                         <TableCell>{s.corsi || '—'}</TableCell>
                         <TableCell>{s.cellulare || '—'}</TableCell>
                         <TableCell>{s.email || '—'}</TableCell>
                         <TableCell>
                           <Badge className={s.staff_status === 'INATTIVO' ? 'bg-slate-400' : 'bg-emerald-500'}>
                             {s.staff_status || 'ATTIVO'}
                           </Badge>
                         </TableCell>
                       </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pt" className="mt-4">
           {isLoadingPt ? (
              <div className="border rounded-md bg-white overflow-hidden p-6 text-center text-muted-foreground">Caricamento...</div>
           ) : ptList.length === 0 ? (
              <Alert className="bg-slate-50 border-dashed text-slate-600 mt-4">
                <Briefcase className="h-4 w-4" />
                <AlertTitle>Nessun Personal Trainer censito.</AlertTitle>
                <AlertDescription>
                  I PT verranno visualizzati qui non appena il loro profilo sarà aggiornato nel sistema.
                </AlertDescription>
              </Alert>
           ) : (
              <div className="border rounded-md bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead>Nome</TableHead>
                     <TableHead>Ruolo</TableHead>
                     <TableHead>Cellulare</TableHead>
                     <TableHead>Email</TableHead>
                     <TableHead>Stato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {ptList.map((pt) => (
                      <TableRow key={pt.id || pt.nome} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedStaff(pt)}>
                         <TableCell className="font-semibold">{pt.nome}</TableCell>
                         <TableCell>{pt.ruolo || 'PT'}</TableCell>
                         <TableCell>{pt.cellulare || '—'}</TableCell>
                         <TableCell>{pt.email || '—'}</TableCell>
                         <TableCell>
                           <Badge className={pt.staff_status === 'INATTIVO' ? 'bg-slate-400' : 'bg-emerald-500'}>
                             {pt.staff_status || 'ATTIVO'}
                           </Badge>
                         </TableCell>
                      </TableRow>
                   ))}
                </TableBody>
              </Table>
              </div>
           )}
        </TabsContent>

        <TabsContent value="compliance" className="mt-4 space-y-6">
          <div className="bg-slate-50 p-4 border rounded-md">
             <Label>Seleziona Insegnante/PT</Label>
             <Select value={complianceMemberId} onValueChange={setComplianceMemberId}>
               <SelectTrigger className="w-full sm:w-72 mt-2 bg-white">
                 <SelectValue placeholder="Seleziona dallo staff..." />
               </SelectTrigger>
               <SelectContent>
                 {staffList.map((s) => (
                   <SelectItem key={s.id || s.nome} value={s.id?.toString() || s.nome}>{s.nome}</SelectItem>
                 ))}
                 {ptList.map((pt) => (
                   <SelectItem key={`pt-${pt.id || pt.nome}`} value={pt.id?.toString() || pt.nome}>{pt.nome} (PT)</SelectItem>
                 ))}
               </SelectContent>
             </Select>
          </div>

          {complianceMemberId ? (
             <CompliancePanel memberId={complianceMemberId} complianceData={complianceData} isAdminOrDirezione={isAdminOrDirezione} />
          ) : (
             <Alert className="text-muted-foreground w-full py-8 text-center border-dashed">
               <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
               Seleziona un membro dello staff per visualizzarne lo stato di compliance documentale.
             </Alert>
          )}
        </TabsContent>

        <TabsContent value="accordi" className="mt-4">
          {isAdminOrDirezione ? (
             <div className="border rounded-md bg-white overflow-hidden">
                <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Tariffa 2025-2026</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead></TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {staffList.map((s) => (
                        <TableRow key={s.id}>
                           <TableCell className="font-semibold">{s.nome}</TableCell>
                           <TableCell>{s.corsi || '—'}</TableCell>
                           <TableCell>
                             {s.tariffa_base ? `€${s.tariffa_base}/h` : '—'}
                           </TableCell>
                           <TableCell className="max-w-[300px] truncate" title={s.note_accordo}>
                              {s.note_accordo || '—'}
                           </TableCell>
                           <TableCell>
                              <Button variant="outline" size="sm" onClick={() => window.open('/quote-promo', '_blank')}>Modifica</Button>
                           </TableCell>
                        </TableRow>
                     ))}
                     {staffList.length === 0 && (
                        <TableRow>
                           <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Nessun insegnante censito</TableCell>
                        </TableRow>
                     )}
                  </TableBody>
                </Table>
             </div>
          ) : (
             <Alert variant="destructive" className="mt-4">
               <Lock className="h-4 w-4" />
               <AlertTitle>Accesso Negato</AlertTitle>
               <AlertDescription>
                 Non hai i permessi sufficienti per visualizzare gli accordi economici. Sezione riservata alla direzione.
               </AlertDescription>
             </Alert>
          )}
        </TabsContent>

        <TabsContent value="presenze" className="mt-4">
          <PresenzeTab isAdminOrDirezione={isAdminOrDirezione} />
        </TabsContent>

        <TabsContent value="disciplinare" className="mt-4">
          {isAdminOrDirezione ? (
             <DisciplinareTab staffList={staffList} />
          ) : (
             <Alert variant="destructive" className="mt-4">
               <Lock className="h-4 w-4" />
               <AlertTitle>Accesso Negato</AlertTitle>
               <AlertDescription>
                 Non hai i permessi sufficienti per visualizzare lo storico disciplinare. Sezione riservata alla direzione.
               </AlertDescription>
             </Alert>
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={!!selectedStaff} onOpenChange={(o) => !o && setSelectedStaff(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto w-full">
          <SheetHeader>
            <SheetTitle className="text-xl flex items-center justify-between mt-4">
               <span>{selectedStaff?.nome}</span>
               <Badge className={selectedStaff?.staff_status === 'INATTIVO' ? 'bg-slate-400' : 'bg-emerald-500'}>
                  {selectedStaff?.staff_status || 'ATTIVO'}
               </Badge>
            </SheetTitle>
          </SheetHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">Contatti</p>
              <p className="text-sm">Cellulare: {selectedStaff?.cellulare || '—'}</p>
              <p className="text-sm">Email: {selectedStaff?.email || '—'}</p>
            </div>
            
            <div className="space-y-1 pt-4 border-t">
              <p className="text-sm text-muted-foreground font-medium mb-3">Tessera GemPass</p>
              {selectedStaff?.tessera ? (
                 <div className="bg-slate-50 border p-3 rounded-md text-sm space-y-2">
                    <div className="flex items-center justify-between">
                       <span className="font-semibold text-slate-700">Tessera #{selectedStaff.tessera.numero || 'N/A'}</span>
                       <Badge className={
                         selectedStaff.tessera.stato === 'ATTIVA' ? 'bg-emerald-500' :
                         selectedStaff.tessera.stato === 'IN SCADENZA' ? 'bg-amber-500' :
                         selectedStaff.tessera.stato === 'NESSUNA' ? 'bg-slate-400' :
                         'bg-red-500'
                       }>
                          {selectedStaff.tessera.stato || 'SCONOSCIUTO'}
                       </Badge>
                    </div>
                    {selectedStaff.tessera.scadenza && (
                       <p className="text-muted-foreground text-xs">Scadenza: {new Date(selectedStaff.tessera.scadenza).toLocaleDateString()}</p>
                    )}
                    {selectedStaff.tessera.stagione && (
                       <p className="text-muted-foreground text-xs">Stagione: {selectedStaff.tessera.stagione}</p>
                    )}
                 </div>
              ) : (
                 <div className="bg-slate-50 border p-3 rounded-md text-sm flex items-center justify-between">
                    <Badge variant="destructive">NESSUNA TESSERA</Badge>
                    <a href="/gempass" target="_blank" rel="noreferrer" className="text-xs text-primary font-bold hover:underline">
                      Vai a GemPass
                    </a>
                 </div>
              )}
            </div>
            
            <div className="space-y-1 pt-4 border-t">
              <p className="text-sm text-muted-foreground font-medium mb-3">Autorizzazione lezioni private</p>
              {selectedStaff?.lezioni_private_autorizzate ? (
                 <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-md text-sm">
                    Autorizzato in data {selectedStaff.data_autorizzazione ? new Date(selectedStaff.data_autorizzazione).toLocaleDateString() : 'N/A'}<br/>
                    da: {selectedStaff.autorizzato_da || 'Direzione'}
                 </div>
              ) : (
                 <div className="bg-slate-100 border text-slate-600 p-3 rounded-md text-sm">
                    Non autorizzato
                 </div>
              )}
            </div>

            <div className="space-y-1 pt-4 border-t">
              <p className="text-sm text-muted-foreground font-medium mb-3">Documenti Compliance</p>
              <div className="flex items-center gap-2 p-3 bg-slate-50 border rounded-md">
                 <FileCheck className="w-4 h-4 text-primary" />
                 <span className="text-sm font-medium">Vedi tab Compliance</span>
                 <button onClick={() => { 
                   if (selectedStaff?.id) setComplianceMemberId(selectedStaff.id.toString());
                   setActiveTab('compliance'); 
                   setSelectedStaff(null);
                 }} className="ml-auto text-xs text-primary font-bold hover:underline">
                   Vai alla Tab
                 </button>
              </div>
            </div>

            {isAdminOrDirezione && (
              <div className="space-y-1 pt-4 border-t">
                <p className="text-sm text-muted-foreground font-medium mb-3">Firme e Accordi</p>
                <div className="flex items-center gap-2 p-3 bg-slate-50 border rounded-md">
                   <Landmark className="w-4 h-4 text-primary" />
                   <span className="text-sm font-medium">Contratti Tab Accordi</span>
                   <button onClick={() => { setSelectedStaff(null); setActiveTab('accordi'); }} className="ml-auto text-xs text-primary font-bold hover:underline">
                     Vai alla Tab
                   </button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
