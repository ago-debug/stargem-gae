import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, FileCheck, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function OnlineTab() {
  const [filter, setFilter] = useState("all");
  const [completingId, setCompletingId] = useState<number | null>(null);
  
  const [certificato, setCertificato] = useState(false);
  const [tessera, setTessera] = useState(false);
  const [documenti, setDocumenti] = useState(false);
  const [note, setNote] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery<any[]>({
    queryKey: ["/api/payments", { source: "online" }],
    queryFn: async () => {
      const res = await fetch("/api/payments?source=online");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    retry: 1
  });

  const completeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/enrollments/${id}/complete`, {
         certificato, tessera, documenti, note
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      toast({ title: "Completato", description: "Iscrizione online completata con successo in sede." });
      setCompletingId(null);
    },
    onError: () => {
      toast({ title: "Errore (404)", description: "Endpoint /complete non ancora disponibile.", variant: "destructive" });
    }
  });

  const getSourceBadge = (source: string) => {
    switch(source) {
      case "online": return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Web</Badge>;
      case "woocommerce": return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">WooCommerce</Badge>;
      case "webhook_woocommerce": return <Badge className="bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200">Webhook WC</Badge>;
      case "webhook_stripe": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Stripe</Badge>;
      default: return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200">Sede</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "pending") return <Badge variant="outline" className="text-amber-600 border-amber-300">Da completare</Badge>;
    if (status === "completed") return <Badge variant="outline" className="text-emerald-600 border-emerald-300">Completato</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  // Mock data se mancano dati reali per far funzionare la UI prototipale
  const displayData = payments && payments.length > 0 ? payments : [
    { id: 1, memberName: "Mario Rossi", source: "webhook_woocommerce", amount: 150, date: new Date().toISOString(), status: "pending", enrollmentId: 101, description: "Ordine WooCommerce #1029" },
    { id: 2, memberName: "Laura Bianchi", source: "webhook_stripe", amount: 75, date: new Date().toISOString(), status: "completed", enrollmentId: 102 }
  ];

  const filteredData = displayData.filter(p => filter === "all" ? true : p.status === filter);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between bg-slate-50 border-b pb-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
               <Globe className="w-5 h-5 text-indigo-600" /> Pagamenti e Iscrizioni Online
            </CardTitle>
            <CardDescription>Gestisci gli acquisti transitati dal sito o dai canali esterni</CardDescription>
          </div>
          <div className="flex items-center gap-3">
             <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40 bg-white"><SelectValue/></SelectTrigger>
                <SelectContent>
                   <SelectItem value="all">Tutti</SelectItem>
                   <SelectItem value="pending">Da completare</SelectItem>
                   <SelectItem value="completed">Completati</SelectItem>
                </SelectContent>
             </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Canale</TableHead>
                <TableHead>Importo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ordine WC</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                    Nessun pagamento online ricevuto. <br/>Configura il webhook WooCommerce per iniziare.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold">{p.memberName}</TableCell>
                    <TableCell>{getSourceBadge(p.source)}</TableCell>
                    <TableCell>€{p.amount?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs font-mono text-slate-500">
                       {p.description?.includes("Ordine WooCommerce") 
                          ? p.description.match(/#(\d+)/)?.[0] || "—" 
                          : "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(p.status)}</TableCell>
                    <TableCell className="text-right">
                       {p.status === "pending" && (
                         <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50" onClick={() => setCompletingId(p.enrollmentId)}>
                           <FileCheck className="w-4 h-4 mr-1" /> Completa
                         </Button>
                       )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={completingId !== null} onOpenChange={(val) => { if (!val) setCompletingId(null); }}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" /> Completa Iscrizione Online</DialogTitle>
               <DialogDescription>Verifica la consegna della documentazione in sede per sbloccare l'allievo.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
               <div className="flex items-center space-x-2 border p-3 rounded-md bg-slate-50">
                 <Checkbox id="cert" checked={certificato} onCheckedChange={(v) => setCertificato(v as boolean)} />
                 <Label htmlFor="cert" className="cursor-pointer font-medium">Certificato medico consegnato fisicamente</Label>
               </div>
               <div className="flex items-center space-x-2 border p-3 rounded-md bg-slate-50">
                 <Checkbox id="tess" checked={tessera} onCheckedChange={(v) => setTessera(v as boolean)} />
                 <Label htmlFor="tess" className="cursor-pointer font-medium">Quota tesseramento regolarizzata in sede</Label>
               </div>
               <div className="flex items-center space-x-2 border p-3 rounded-md bg-slate-50">
                 <Checkbox id="docs" checked={documenti} onCheckedChange={(v) => setDocumenti(v as boolean)} />
                 <Label htmlFor="docs" className="cursor-pointer font-medium">Moduli GDPR e privacy firmati</Label>
               </div>
               <div className="space-y-2 mt-4">
                 <Label>Note operative (Opzionale)</Label>
                 <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Es. Manca il certificato originale, portato solo PDF..." />
               </div>
            </div>
            <DialogFooter>
               <Button variant="ghost" onClick={() => setCompletingId(null)}>Annulla</Button>
               <Button onClick={() => completingId && completeMutation.mutate(completingId)} disabled={completeMutation.isPending || (!certificato && !tessera && !documenti)}>
                  Salva e Sblocca Iscrizione
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
