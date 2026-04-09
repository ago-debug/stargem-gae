import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileSignature, CheckCircle2, Circle, PlayCircle } from "lucide-react";
import type { InstructorAgreement } from "@shared/schema";

export type ExpandedAgreement = InstructorAgreement & {
   instructorName?: string;
   activityName?: string;
   usedHours?: number;
   totalHours?: number;
   baseAmount?: number | string;
};

interface AccordiTabProps {
  seasonId: number | "active";
}

export function AccordiTab({ seasonId }: AccordiTabProps) {
  const { data: agreements, isLoading, error } = useQuery<ExpandedAgreement[]>({
    queryKey: ["/api/instructor-agreements", seasonId, { active: true }],
    queryFn: async () => {
      const res = await fetch(`/api/instructor-agreements?seasonId=${seasonId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    retry: 1
  });

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<ExpandedAgreement | null>(null);
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("bonifico");
  const [isParziale, setIsParziale] = useState(false);
  const [notes, setNotes] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const paymentMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedAgreement) return;
      await apiRequest("POST", `/api/instructor-agreements/${selectedAgreement.id}/payment`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructor-agreements"] });
      toast({ title: "Pagamento registrato", description: "Operazione salvata con successo." });
      setPaymentModalOpen(false);
    },
    onError: () => {
      toast({ title: "Errore (404)", description: "Endpoint non incora disponibile.", variant: "destructive" });
    }
  });

  const is404 = error?.message?.includes("404");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-indigo-600" /> Accordi e Contratti Maestri
          </h2>
          <p className="text-sm text-muted-foreground">Schematizzazione patti economici e avanzamento pagamenti staff</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading && !is404 ? (
           Array.from({ length: 2 }).map((_, i) => (
             <Card key={i}>
                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                <CardContent className="space-y-4">
                   <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-10 w-full" />
                   <Skeleton className="h-10 w-full" />
                </CardContent>
             </Card>
           ))
        ) : is404 || !agreements || agreements.length === 0 ? (
           <div className="col-span-full h-48 border border-dashed rounded-lg bg-slate-50 flex flex-col items-center justify-center text-muted-foreground opacity-60">
              <FileSignature className="h-10 w-10 mb-3 text-slate-300" />
              <span className="font-medium">Nessun accordo maestro stipulato.</span>
              <span className="text-xs mt-1">L'endpoint API /api/instructor-agreements non è ancora mappato (404).</span>
           </div>
        ) : (
           agreements.map(agreement => {
             // 3 varianti
             return (
               <Card key={agreement.id} className="flex flex-col border-slate-200">
                  <CardHeader className="bg-slate-50 border-b pb-3 flex flex-row items-start justify-between">
                     <div>
                        <CardTitle className="text-base font-bold text-indigo-900">{agreement.instructorName}</CardTitle>
                        <span className="text-xs text-muted-foreground uppercase tracking-widest">{agreement.activityName || 'Multi-Attività'}</span>
                     </div>
                     <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                       {agreement.agreementType === 'flat_monthly' ? 'Fisso Mensile' : 
                        agreement.agreementType === 'variable_monthly' ? 'Variabile Mensile' : 'Pacchetto Ore'}
                     </Badge>
                  </CardHeader>
                  <CardContent className="pt-4 flex-1">
                     {agreement.agreementType === 'pack_hours' ? (
                       <div className="space-y-3">
                          <div className="flex justify-between items-end mb-1">
                            <span className="text-sm font-semibold">Ore Consumate</span>
                            <span className="text-lg font-black text-slate-700">{agreement.usedHours || 0} / {agreement.totalHours || 0}h</span>
                          </div>
                          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border">
                            <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, Math.round(((agreement.usedHours || 0) / (agreement.totalHours || 1)) * 100))}%` }}></div>
                          </div>
                       </div>
                     ) : (
                       <div className="space-y-2">
                          <span className="text-xs font-bold text-muted-foreground uppercase block mb-2">Stato Pagamenti</span>
                          <div className="flex items-center justify-between p-2 border rounded-md bg-white text-sm">
                             <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>Gennaio</span>
                             </div>
                             <span className="text-xs text-muted-foreground">Saldato (Bonifico)</span>
                          </div>
                          <div className="flex items-center justify-between p-2 border rounded-md bg-yellow-50 text-sm">
                             <div className="flex items-center gap-2">
                                <PlayCircle className="w-4 h-4 text-amber-500" />
                                <span className="font-semibold">Febbraio</span>
                             </div>
                             <span className="text-xs text-amber-700 font-bold">Acconto: €150.00</span>
                          </div>
                          <div className="flex items-center justify-between p-2 border rounded-md bg-white border-dashed text-sm opacity-70">
                             <div className="flex items-center gap-2">
                                <Circle className="w-4 h-4 text-slate-300" />
                                <span>Marzo</span>
                             </div>
                             <span className="text-xs text-muted-foreground font-mono">€ {agreement.baseAmount}</span>
                          </div>
                       </div>
                     )}
                  </CardContent>
                  <CardFooter className="border-t bg-slate-50 pt-4">
                     {agreement.agreementType === 'pack_hours' ? (
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Scala 1 Ora</Button>
                     ) : (
                        <Button variant="outline" className="w-full border-indigo-200 text-indigo-700 bg-white" onClick={() => {
                           setSelectedAgreement(agreement);
                           setAmount(String(agreement.baseAmount || ""));
                           setPaymentMode("bonifico");
                           setIsParziale(false);
                           setNotes("");
                           setPaymentModalOpen(true);
                        }}>Registra Pagamento Mese</Button>
                     )}
                  </CardFooter>
               </Card>
             );
           })
        )}
      </div>

      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Registra Pagamento Staff</DialogTitle>
               <DialogDescription>
                  Maestro: <strong className="text-slate-800">{selectedAgreement?.instructorName}</strong>
               </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label>Importo (€)</Label>
                     <Input type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                     <Label>Modalità pagamento</Label>
                     <Select value={paymentMode} onValueChange={setPaymentMode}>
                        <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="contanti">Contanti</SelectItem>
                           <SelectItem value="bonifico">Bonifico</SelectItem>
                           <SelectItem value="fattura">Fattura</SelectItem>
                           <SelectItem value="pos">POS</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>
               <div className="flex items-center justify-between border p-3 rounded-md">
                 <Label htmlFor="isParziale" className="cursor-pointer font-semibold">Acconto Parziale</Label>
                 <Switch id="isParziale" checked={isParziale} onCheckedChange={setIsParziale} />
               </div>
               <div className="space-y-2">
                  <Label>Note operatore</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opzionale (es. Mese competenza)" />
               </div>
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>Annulla</Button>
               <Button onClick={() => paymentMutation.mutate({ amount: Number(amount), paymentMode, isParziale, notes })} disabled={paymentMutation.isPending || !amount}>Salva Pagamento</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
