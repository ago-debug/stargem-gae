import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers, CalendarCheck, FileOutput } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { differenceInDays } from "date-fns";
import type { CarnetWallet, Member } from "@shared/schema";
import { LezioneSpotDialog } from "./lezione-spot-dialog";

export type ExpandedCarnet = CarnetWallet & {
   member?: Member;
   instructorName?: string;
   roomName?: string;
   carnetType?: string;
   status?: string;
   usedCount?: number;
   maxUses?: number;
};

export function CarnetTab() {
  const [filter, setFilter] = useState("all");
  const [useModalOpen, setUseModalOpen] = useState(false);
  const [selectedCarnet, setSelectedCarnet] = useState<ExpandedCarnet | null>(null);
  
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTimeStart, setSessionTimeStart] = useState("");
  const [sessionTimeEnd, setSessionTimeEnd] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [notes, setNotes] = useState("");
  
  const [selectedGroupSize, setSelectedGroupSize] = useState("1");
  const [selectedLocationType, setSelectedLocationType] = useState("in_sede");
  const [sessionPrice, setSessionPrice] = useState<number | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (selectedCarnet) {
       setSelectedGroupSize(selectedCarnet.groupSize?.toString() || "1");
       setSelectedLocationType(selectedCarnet.locationType || "in_sede");
    }
  }, [selectedCarnet]);

  useEffect(() => {
    if (!selectedCarnet || !useModalOpen) return;
    const calculatePrice = async () => {
      try {
        const appliesTo = selectedCarnet.carnetType?.toLowerCase().includes("affitt") ? "affitto_sala" : "lezione_privata";
        const query = new URLSearchParams({
          basePrice: selectedCarnet.pricePerUnit?.toString() || "0",
          appliesTo,
          groupSize: selectedGroupSize,
          locationType: selectedLocationType,
          walletType: selectedCarnet.carnetType || "",
          unitCount: ((selectedCarnet.usedCount || 0) + 1).toString()
        });
        const res = await fetch(`/api/pricing-rules/calculate?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setSessionPrice(data.finalPrice);
        }
      } catch(e) {}
    };
    calculatePrice();
  }, [selectedGroupSize, selectedLocationType, selectedCarnet, useModalOpen]);

  const { data: instructors } = useQuery<Member[]>({
    queryKey: ["/api/members?participantType=INSEGNANTE"],
  });

  const { data: carnets, isLoading, error } = useQuery<ExpandedCarnet[]>({
    queryKey: ["/api/carnet-wallets"],
    retry: 1
  });

  const useCarnetMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedCarnet) return;
      return await apiRequest("POST", `/api/carnet-wallets/${selectedCarnet.id}/use`, data).then(r => r.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/carnet-wallets"] });
      if (data && data.bonusUnits > 0) {
        toast({ 
          title: "🎁 Sessione registrata — Pacchetto completato!", 
          description: "11a ora omaggio aggiunta al carnet.",
          className: "bg-amber-100 border-amber-300"
        });
      } else {
        toast({ title: "Sessione registrata", description: "Ingresso scalato dal carnet con successo." });
      }
      setUseModalOpen(false);
    },
    onError: () => {
      toast({ title: "Errore (404)", description: "Endpoint non ancora disponibile.", variant: "destructive" });
    }
  });

  const is404 = error?.message?.includes("404");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2">
            <Layers className="w-5 h-5" /> Carnet Attivi
          </h2>
          <p className="text-sm text-muted-foreground">Monitoraggio pacchetti ingressi prepagati (Lezioni e Sale)</p>
        </div>
        <div className="flex items-center gap-3">
           <Select value={filter} onValueChange={setFilter}>
             <SelectTrigger className="w-48"><SelectValue placeholder="Filtro..." /></SelectTrigger>
             <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="lezioni">Lezioni</SelectItem>
                <SelectItem value="affitti">Affitti Sale</SelectItem>
                <SelectItem value="scadenza">In Scadenza</SelectItem>
             </SelectContent>
           </Select>
           <LezioneSpotDialog />
        </div>
      </div>

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden min-h-[300px]">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Luogo / Gruppo</TableHead>
              <TableHead>Istruttore/Sala</TableHead>
              <TableHead className="w-[140px]">Progresso</TableHead>
              <TableHead>Scadenza</TableHead>
              <TableHead>Pagato</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !is404 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[140px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-[100px] ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : is404 || !carnets || carnets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground opacity-60">
                    <Layers className="h-10 w-10 mb-3 text-slate-300" />
                    <span className="font-medium">Nessun carnet attivo in piattaforma.</span>
                    <span className="text-xs mt-1">Non sono stati venduti pacchetti o l'endpoint è da implementare.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              carnets.map(carnet => {
                const percent = Math.min(100, Math.round(((carnet.usedCount || 0) / (carnet.maxUses || 1)) * 100));
                
                let barColor = "bg-green-500";
                if (percent >= 90) barColor = "bg-red-500";
                else if (percent >= 70) barColor = "bg-amber-500";
                if (carnet.status === 'exhausted') barColor = "bg-slate-400";

                const daysLeft = carnet.expiresAt ? differenceInDays(new Date(carnet.expiresAt), new Date()) : 999;
                let badgeColor = "bg-green-100 text-green-800";
                if (daysLeft < 10) badgeColor = "bg-red-100 text-red-800 border-red-300";
                else if (daysLeft <= 30) badgeColor = "bg-amber-100 text-amber-800 border-amber-300";

                const grpSizeNum = carnet.groupSize || 1;
                const groupLabel = grpSizeNum === 1 ? "Singola" : (grpSizeNum === 2 ? "Coppia" : `Gruppo ${grpSizeNum}`);
                
                let locationBadge = "bg-slate-100 text-slate-800";
                let locationLabel = "In sede";
                if (carnet.locationType === 'domicilio') {
                  locationBadge = "bg-orange-100 text-orange-800 border-orange-200";
                  locationLabel = "Domicilio";
                } else if (carnet.locationType === 'studio_personal') {
                  locationBadge = "bg-violet-100 text-violet-800 border-violet-200";
                  locationLabel = "Studio Personal";
                }

                return (
                  <TableRow key={carnet.id}>
                    <TableCell className="font-bold">{carnet.member?.firstName} {carnet.member?.lastName}</TableCell>
                    <TableCell><Badge variant="secondary">{carnet.carnetType}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                         <Badge variant="outline" className={locationBadge}>{locationLabel}</Badge>
                         <span className="text-xs text-muted-foreground">{groupLabel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">{carnet.instructorName || carnet.roomName || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 w-full">
                        <span className="text-xs font-medium">{carnet.usedCount} / {carnet.maxUses} Ingressi</span>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border">
                          <div className={`h-full ${barColor}`} style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={badgeColor}>
                        {carnet.expiresAt ? new Date(carnet.expiresAt).toLocaleDateString() : 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-emerald-700">
                      € {Number(carnet.totalPaid || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-2">
                       <Button variant="outline" size="sm" className="h-8 gap-1 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100" onClick={() => {
                          setSelectedCarnet(carnet);
                          setSessionDate(new Date().toISOString().split("T")[0]);
                          setSessionTimeStart("");
                          setSessionTimeEnd("");
                          setInstructorId("");
                          setNotes("");
                          setUseModalOpen(true);
                       }}>
                          <CalendarCheck className="w-3.5 h-3.5" /> Usa 1
                       </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800">
                          <FileOutput className="w-4 h-4" />
                       </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={useModalOpen} onOpenChange={setUseModalOpen}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Registra Utilizzo Carnet</DialogTitle>
               <DialogDescription>
                  Cliente: <strong className="text-slate-800">{selectedCarnet?.member?.firstName} {selectedCarnet?.member?.lastName}</strong> ({selectedCarnet?.carnetType})
               </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label>Data Sessione</Label>
                     <Input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                     <Label>Istruttore (Opzionale)</Label>
                     <Select value={instructorId} onValueChange={setInstructorId}>
                        <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                        <SelectContent>
                           {instructors?.map(i => (
                              <SelectItem key={i.id} value={String(i.id)}>{i.firstName} {i.lastName}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label>Gruppo (Allievi)</Label>
                     <Select value={selectedGroupSize} onValueChange={setSelectedGroupSize}>
                        <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="1">1 (Singola)</SelectItem>
                           <SelectItem value="2">2 (Coppia)</SelectItem>
                           <SelectItem value="3">3</SelectItem>
                           <SelectItem value="4">4</SelectItem>
                           <SelectItem value="5">5</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-2">
                     <Label>Luogo Erogazione</Label>
                     <Select value={selectedLocationType} onValueChange={setSelectedLocationType}>
                        <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="in_sede">In Sede</SelectItem>
                           <SelectItem value="domicilio">A Domicilio</SelectItem>
                           <SelectItem value="studio_personal">Studio Personal</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label>Ora Inizio</Label>
                     <Input type="time" value={sessionTimeStart} onChange={(e) => setSessionTimeStart(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                     <Label>Ora Fine</Label>
                     <Input type="time" value={sessionTimeEnd} onChange={(e) => setSessionTimeEnd(e.target.value)} />
                  </div>
               </div>
               <div className="space-y-2">
                  <Label>Note operatore</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opzionale" />
               </div>
               {sessionPrice !== null && (
                 <div className="p-3 bg-slate-50 border rounded-md">
                    <span className="text-sm font-semibold text-slate-700">Prezzo Calcolato Sessione: </span>
                    <span className="text-lg text-emerald-700 font-bold">€ {sessionPrice.toFixed(2)}</span>
                    <p className="text-xs text-muted-foreground mt-1">Stima basata sulle tariffe standard. Serve solo in via informativa.</p>
                 </div>
               )}
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={() => setUseModalOpen(false)}>Annulla</Button>
               <Button onClick={() => useCarnetMutation.mutate({ 
                   sessionDate, sessionTimeStart, sessionTimeEnd, instructorId, notes, 
                   groupSize: parseInt(selectedGroupSize), locationType: selectedLocationType 
               })} disabled={useCarnetMutation.isPending || !sessionDate}>Conferma Ingresso</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
