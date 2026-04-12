import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftRight, Plus, Trash2, Edit } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function WcMapping() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
     wcProductName: "",
     stargemCategory: "adulti",
     stargemCourseCount: "1",
     stargemActivityType: "corso",
     notes: ""
  });

  const { data: mappings, isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/wc-product-mapping"],
    queryFn: async () => {
       const res = await fetch("/api/wc-product-mapping");
       if (!res.ok) throw new Error("Failed");
       return res.json();
    },
    retry: 1
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
       const method = editingId ? "PUT" : "POST";
       const url = editingId ? `/api/wc-product-mapping/${editingId}` : "/api/wc-product-mapping";
       const payload = {
           ...formData,
           stargemCourseCount: parseInt(formData.stargemCourseCount, 10)
       };
       await apiRequest(method, url, payload);
    },
    onSuccess: () => {
       toast({ title: "Salvato", description: "Mapping salvato con successo." });
       queryClient.invalidateQueries({ queryKey: ["/api/wc-product-mapping"] });
       closeDialog();
    },
    onError: () => {
       toast({ title: "Errore (404)", description: "Endpoint /wc-product-mapping non ancora operativo.", variant: "destructive" });
       closeDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
       await apiRequest("DELETE", `/api/wc-product-mapping/${id}`);
    },
    onSuccess: () => {
       toast({ title: "Eliminato", description: "Mapping rimosso." });
       queryClient.invalidateQueries({ queryKey: ["/api/wc-product-mapping"] });
    },
    onError: () => {
       toast({ title: "Errore (404)", description: "Endpoint DELETE non operativo.", variant: "destructive" });
    }
  });

  const openDialog = (item?: any) => {
      if (item) {
          setEditingId(item.id);
          setFormData({
              wcProductName: item.wcProductName,
              stargemCategory: item.stargemCategory,
              stargemCourseCount: String(item.stargemCourseCount || "1"),
              stargemActivityType: item.stargemActivityType,
              notes: item.notes || ""
          });
      } else {
          setEditingId(null);
          setFormData({
             wcProductName: "",
             stargemCategory: "adulti",
             stargemCourseCount: "1",
             stargemActivityType: "corso",
             notes: ""
          });
      }
      setIsDialogOpen(true);
  };

  const closeDialog = () => {
      setIsDialogOpen(false);
      setEditingId(null);
  };

  const is404 = error?.message?.includes("404");

  if (user?.role !== "admin") {
      return (
         <div className="p-8 text-center text-slate-500">
             Accesso negato. Solo gli amministratori possono gestire i mapping.
         </div>
      );
  }

  const displayData = mappings && mappings.length > 0 ? mappings : [
     { id: 1, wcProductName: "Abbonamento Mensile 2 Corsi", stargemCategory: "adulti", stargemCourseCount: 2, stargemActivityType: "corso", notes: "Fallback UI per testing" },
     { id: 2, wcProductName: "Carnet 10 Ingressi Base", stargemCategory: "adulti", stargemCourseCount: 1, stargemActivityType: "carnet", notes: "" },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
             <ArrowLeftRight className="w-8 h-8 text-purple-600" /> WooCommerce Mapping
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
             Configura come i prodotti acquistati su WooCommerce si traducono in StarGem
          </p>
        </div>
        <Button onClick={() => openDialog()} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" /> Aggiungi Mapping
        </Button>
      </div>

      <Card>
        <CardHeader>
           <CardTitle>Regole di Conversione</CardTitle>
           <CardDescription>Quando un Webhook di WooCommerce processa un ordine, confronta il nome prodotto con queste regole per generare automaticamente il pagamento e preparare l'iscrizione.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
           {is404 && (
              <div className="bg-amber-50 p-4 border-b border-amber-100 text-sm text-amber-800 flex justify-between items-center">
                 <span>ATTENZIONE: Endpoint `/api/wc-product-mapping` non implementato sul server backend. Dati prototipali.</span>
              </div>
           )}
           <Table>
              <TableHeader>
                 <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-800">Prodotto WC (Exact Match)</TableHead>
                    <TableHead>Categoria StarGem</TableHead>
                    <TableHead>N. Corsi</TableHead>
                    <TableHead>Tipo Attività</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 {isLoading ? (
                    <TableRow><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                 ) : displayData.length === 0 ? (
                    <TableRow>
                       <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                          Nessun mapping configurato.
                       </TableCell>
                    </TableRow>
                 ) : (
                    displayData.map((item: any) => (
                       <TableRow key={item.id}>
                          <TableCell className="font-mono text-purple-700 font-semibold">{item.wcProductName}</TableCell>
                          <TableCell className="capitalize">{item.stargemCategory}</TableCell>
                          <TableCell>{item.stargemCourseCount}</TableCell>
                          <TableCell className="capitalize">{item.stargemActivityType.replace('_', ' ')}</TableCell>
                          <TableCell className="text-right">
                             <div className="flex justify-end gap-2">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => openDialog(item)}>
                                   <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => deleteMutation.mutate(item.id)}>
                                   <Trash2 className="h-4 w-4" />
                                </Button>
                             </div>
                          </TableCell>
                       </TableRow>
                    ))
                 )}
              </TableBody>
           </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>{editingId ? "Modifica Mapping" : "Nuovo Mapping"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
               <div className="space-y-2">
                  <Label>Nome Prodotto WooCommerce (Esatto)</Label>
                  <Input 
                     placeholder="Es. Abbonamento Base 1 Corso" 
                     value={formData.wcProductName} 
                     onChange={e => setFormData({...formData, wcProductName: e.target.value})} 
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label>Categoria StarGem</Label>
                      <Select value={formData.stargemCategory} onValueChange={v => setFormData({...formData, stargemCategory: v})}>
                         <SelectTrigger><SelectValue/></SelectTrigger>
                         <SelectContent>
                            <SelectItem value="adulti">Adulti</SelectItem>
                            <SelectItem value="bambini">Bambini</SelectItem>
                            <SelectItem value="aerea">Aerea</SelectItem>
                            <SelectItem value="open">Abbonamento Open</SelectItem>
                            <SelectItem value="privata">Lezione Privata</SelectItem>
                            <SelectItem value="affitto">Affitto Sala</SelectItem>
                         </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                      <Label>N. Corsi / Ingressi</Label>
                      <Select value={formData.stargemCourseCount} onValueChange={v => setFormData({...formData, stargemCourseCount: v})}>
                         <SelectTrigger><SelectValue/></SelectTrigger>
                         <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10 (Carnet)</SelectItem>
                         </SelectContent>
                      </Select>
                  </div>
               </div>
               <div className="space-y-2">
                  <Label>Tipo Attività Gestionale</Label>
                  <Select value={formData.stargemActivityType} onValueChange={v => setFormData({...formData, stargemActivityType: v})}>
                     <SelectTrigger><SelectValue/></SelectTrigger>
                     <SelectContent>
                        <SelectItem value="corso">Corso Regolare</SelectItem>
                        <SelectItem value="carnet">Carnet Wallet</SelectItem>
                        <SelectItem value="lezione_spot">Lezione Spot (Prova / Singola)</SelectItem>
                        <SelectItem value="affitto">Affitto Sala</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
               <div className="space-y-2">
                  <Label>Note Interne (Opzionale)</Label>
                  <Input 
                     value={formData.notes} 
                     onChange={e => setFormData({...formData, notes: e.target.value})} 
                  />
               </div>
            </div>
            <DialogFooter>
               <Button variant="ghost" onClick={closeDialog}>Annulla</Button>
               <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => saveMutation.mutate()} disabled={!formData.wcProductName || saveMutation.isPending}>
                  Salva Mapping
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
