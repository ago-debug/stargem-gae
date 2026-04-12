import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Code, Radio, RefreshCw, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function WebhookStatus() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [viewedPayload, setViewedPayload] = useState<string | null>(null);

  const { data: logs, isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/webhook-logs"],
    queryFn: async () => {
       const res = await fetch("/api/webhook-logs");
       if (!res.ok) throw new Error("Failed");
       return res.json();
    },
    retry: 1
  });

  const retryMutation = useMutation({
    mutationFn: async (id: number) => {
       await apiRequest("PATCH", `/api/webhook-logs/${id}/retry`);
    },
    onSuccess: () => {
       toast({ title: "Webhook riprocessato", description: "Il tentativo è stato rimesso in coda con successo." });
       queryClient.invalidateQueries({ queryKey: ["/api/webhook-logs"] });
    },
    onError: () => {
       toast({ title: "Attenzione (404)", description: "Endpoint di retry non ancora operativo.", variant: "destructive" });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
       case "received": return <Badge className="bg-slate-100 text-slate-700">In attesa</Badge>;
       case "processed": return <Badge className="bg-emerald-100 text-emerald-700">✓ Processato</Badge>;
       case "failed": return <Badge className="bg-red-100 text-red-700">✗ Fallito</Badge>;
       case "ignored": return <Badge className="bg-amber-100 text-amber-700">Ignorato</Badge>;
       default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const is404 = error?.message?.includes("404");

  if (user?.role !== "admin") {
      return (
         <div className="p-8 text-center text-slate-500">
             Accesso negato. Solo gli amministratori possono visualizzare lo stato dei webhook.
         </div>
      );
  }

  // Mock data se mancano dati reali per far funzionare la UI prototipale
  const displayData = logs && logs.length > 0 ? logs : [
     { id: 1, source: "woocommerce", eventType: "order.created", status: "processed", externalId: "WC-1029", paymentId: 105, createdAt: new Date().toISOString(), rawPayload: `{"order_id": 1029, "status": "processing", "total": "150.00"}` },
     { id: 2, source: "stripe", eventType: "payment_intent.succeeded", status: "received", externalId: "pi_3M2xyz", paymentId: null, createdAt: new Date().toISOString(), rawPayload: `{"id": "pi_3M2xyz", "amount": 7500, "currency": "eur"}` },
     { id: 3, source: "woocommerce", eventType: "order.failed", status: "failed", externalId: "WC-1030", paymentId: null, createdAt: new Date().toISOString(), rawPayload: `{"error": "Card declined"}` }
  ];

  const todayCount = displayData.filter(l => new Date().getTime() - new Date(l.createdAt).getTime() < 24 * 60 * 60 * 1000).length;
  const processedCount = displayData.filter(l => l.status === "processed").length;
  const failedCount = displayData.filter(l => l.status === "failed").length;
  const waitingCount = displayData.filter(l => l.status === "received").length;

  const filteredData = displayData.filter((log: any) => {
      if (filter === "all") return true;
      if (filter === "failed" && log.status === "failed") return true;
      if (filter === "24h") {
          const hours24 = 24 * 60 * 60 * 1000;
          return new Date().getTime() - new Date(log.createdAt).getTime() < hours24;
      }
      return false;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
             <Radio className="w-8 h-8 text-indigo-600" /> Webhook Monitor (Admin)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Log e tracciamento eventi inbound (WooCommerce, Stripe, etc.)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-4">
               <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Totale Oggi</div>
               <div className="text-2xl font-bold mt-1 text-slate-800">{todayCount}</div>
            </CardContent>
         </Card>
         <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-4">
               <div className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Processati</div>
               <div className="text-2xl font-bold mt-1 text-emerald-800">{processedCount}</div>
            </CardContent>
         </Card>
         <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
               <div className="text-xs font-semibold text-red-600 uppercase tracking-widest">Falliti</div>
               <div className="text-2xl font-bold mt-1 text-red-800">{failedCount}</div>
            </CardContent>
         </Card>
         <Card className="bg-slate-100 border-slate-300">
            <CardContent className="p-4">
               <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">In Attesa</div>
               <div className="text-2xl font-bold mt-1 text-slate-700">{waitingCount}</div>
            </CardContent>
         </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
           <div>
              <CardTitle className="text-lg">Registro Ingressi</CardTitle>
              <CardDescription>Eventi di sistema registrati dagli endpoint aperti</CardDescription>
           </div>
           <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                 <SelectItem value="all">Tutti i log</SelectItem>
                 <SelectItem value="failed">Solo Falliti</SelectItem>
                 <SelectItem value="24h">Ultime 24h</SelectItem>
              </SelectContent>
           </Select>
        </CardHeader>
        <CardContent className="p-0">
           {is404 && (
              <div className="bg-amber-50 p-4 border-b border-amber-100 text-sm text-amber-800 flex justify-between items-center">
                 <span>ATTENZIONE: Endpoint `/api/webhook-logs` non implementato sul server backend. Dati prototipali.</span>
              </div>
           )}
           <Table>
              <TableHeader>
                 <TableRow>
                    <TableHead>Ricezione</TableHead>
                    <TableHead>Sorgente</TableHead>
                    <TableHead>Tipo Evento</TableHead>
                    <TableHead>Rif. Esterno</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Dettaglio / Action</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 {isLoading ? (
                    <TableRow><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                 ) : filteredData.length === 0 ? (
                    <TableRow>
                       <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                          Nessun webhook ricevuto con questo filtro.
                       </TableCell>
                    </TableRow>
                 ) : (
                    filteredData.map((log: any) => (
                       <TableRow key={log.id}>
                          <TableCell className="text-xs">{new Date(log.createdAt).toLocaleString()}</TableCell>
                          <TableCell className="font-semibold text-slate-700 capitalize">{log.source}</TableCell>
                          <TableCell className="font-mono text-xs bg-slate-50 px-2 py-1 rounded inline-block mt-2 border text-slate-600">{log.eventType}</TableCell>
                          <TableCell className="text-sm font-mono text-slate-500">{log.externalId || "—"}</TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell>
                             <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" className="h-8 group" onClick={() => setViewedPayload(log.rawPayload)} title="Mostra Payload">
                                   <Code className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                                </Button>
                                {log.status === "failed" && (
                                    <Button size="sm" variant="outline" className="h-8 border-red-200 text-red-600 hover:bg-red-50" onClick={() => retryMutation.mutate(log.id)}>
                                       <RefreshCw className={`w-3 h-3 mr-1 ${retryMutation.isPending ? 'animate-spin' : ''}`} /> Retry
                                    </Button>
                                )}
                                {log.status === "processed" && (log.paymentId || log.enrollmentId) && (
                                   <Button size="sm" variant="link" className="h-8 text-indigo-600 p-0 hover:underline" onClick={() => setLocation('/pagamenti')}>
                                      → Pagamento #{log.paymentId || log.enrollmentId}
                                   </Button>
                                )}
                             </div>
                          </TableCell>
                       </TableRow>
                    ))
                 )}
              </TableBody>
           </Table>
        </CardContent>
      </Card>

      <Dialog open={viewedPayload !== null} onOpenChange={(val) => { if (!val) setViewedPayload(null); }}>
         <DialogContent className="max-w-2xl">
            <DialogHeader>
               <DialogTitle>Payload Originario (Raw JSON)</DialogTitle>
            </DialogHeader>
            <div className="bg-slate-900 border-slate-700 p-4 rounded-md overflow-x-auto">
               <pre className="text-emerald-400 text-xs font-mono whitespace-pre-wrap word-break-all">
                   {viewedPayload ? (() => { try { return JSON.stringify(JSON.parse(viewedPayload), null, 2); } catch { return viewedPayload; } })() : ""}
               </pre>
            </div>
            <DialogFooter>
               <Button variant="ghost" onClick={() => setViewedPayload(null)}>Chiudi</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
