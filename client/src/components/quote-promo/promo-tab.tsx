import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Ticket, Pencil, Trash2 } from "lucide-react";
import { PromoRuleModal } from "./promo-rule-modal";
import { useToast } from "@/hooks/use-toast";
import type { PromoRule } from "@shared/schema";

const getTargetBadgeColor = (target: string) => {
  switch (target) {
    case "public": return "bg-blue-100 text-blue-800";
    case "company": return "bg-purple-100 text-purple-800";
    case "staff": return "bg-orange-100 text-orange-800";
    case "personal": return "bg-red-100 text-red-800";
    case "welfare": return "bg-green-100 text-green-800";
    default: return "bg-slate-100 text-slate-800";
  }
};

export function PromoTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoRule | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: promos, isLoading, error } = useQuery<PromoRule[]>({
    queryKey: ["/api/promo-rules"],
    retry: 1
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/promo-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo-rules"] });
      toast({ title: "Eliminato", description: "Regola promozionale rimossa." });
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
          <h2 className="text-lg font-bold">Regole Promozionali</h2>
          <p className="text-sm text-muted-foreground">Gestisci sconti in percentuale o a valore fisso</p>
        </div>
        <Button onClick={() => { setEditingPromo(null); setIsModalOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nuovo Codice
        </Button>
      </div>

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden min-h-[300px]">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Codice</TableHead>
              <TableHead>Tipo Target</TableHead>
              <TableHead>Valore</TableHead>
              <TableHead>Validità</TableHead>
              <TableHead>Utilizzi</TableHead>
              <TableHead>Regole Extra</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !is404 ? (
              // Skeleton Loader
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : is404 || !promos || promos.length === 0 ? (
              // Empty State
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground opacity-60">
                    <Ticket className="h-10 w-10 mb-3 text-slate-300" />
                    <span className="font-medium">Nessuna promozione trovata.</span>
                    <span className="text-xs mt-1">L'endpoint /api/promo-rules non ha restituito dati o mancano configurazioni.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // Data Rows
              promos.map(promo => {
                const isExpired = promo.validTo && new Date(promo.validTo) < new Date();
                const progressWidth = promo.maxUses ? `${Math.min(100, Math.round(((promo.usedCount || 0) / promo.maxUses) * 100))}%` : "0%";
                
                return (
                  <TableRow key={promo.id}>
                    <TableCell className="font-mono font-bold text-slate-700">
                      {promo.code}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTargetBadgeColor(promo.targetType)}>
                        {promo.targetType.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {promo.ruleType === 'percentage' ? `${promo.value}%` : `€${promo.value}`}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs">
                          {promo.validFrom ? new Date(promo.validFrom).toLocaleDateString() : 'N/A'} - {promo.validTo ? new Date(promo.validTo).toLocaleDateString() : 'Infinite'}
                        </span>
                        {isExpired && <Badge variant="destructive" className="w-fit text-[9px] h-3 px-1">SCADUTO</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 w-24">
                        <span className="text-xs text-muted-foreground">{promo.usedCount || 0} / {promo.maxUses || '∞'}</span>
                        {promo.maxUses && (
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: progressWidth }}></div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {promo.excludeOpen && <Badge variant="outline" className="w-fit text-[9px] h-4 bg-red-50 text-red-700 border-red-200">NO OPEN</Badge>}
                        {promo.notCumulative && <Badge variant="outline" className="w-fit text-[9px] h-4 bg-amber-50 text-amber-700 border-amber-200">NO CUMULO</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingPromo(promo); setIsModalOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-red-50" onClick={() => {
                         if (confirm("Vuoi davvero disattivare questa regole promozionale?")) {
                            deleteMutation.mutate(promo.id);
                         }
                      }} disabled={deleteMutation.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <PromoRuleModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        editingPromo={editingPromo} 
      />
    </div>
  );
}
