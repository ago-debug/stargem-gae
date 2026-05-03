import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserCog, Plus, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { StaffRate } from "@shared/schema";

export function StaffRatesTab({ seasonId }: { seasonId?: number | "active" }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isStaffRateModalOpen, setIsStaffRateModalOpen] = useState(false);
  const [newStaffRate, setNewStaffRate] = useState({
    serviceLabel: "",
    serviceCode: "",
    amount: "",
    rateType: "annual",
  });

  const createStaffRateMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/staff-rates", {
        ...data,
        amount: parseFloat(data.amount),
        seasonId: seasonId === "active" ? undefined : seasonId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff-rates"] });
      toast({ title: "Aggiunta", description: "Nuova tariffa staff creata." });
      setIsStaffRateModalOpen(false);
      setNewStaffRate({
        serviceLabel: "",
        serviceCode: "",
        amount: "",
        rateType: "annual",
      });
    },
  });

  const { data: staffRates, isLoading: isLoadingRates } = useQuery<StaffRate[]>(
    {
      queryKey: ["/api/staff-rates", { seasonId }],
      queryFn: async () => {
        const qs = seasonId ? `?seasonId=${seasonId}` : "";
        const res = await fetch(`/api/staff-rates${qs}`);
        if (!res.ok) throw new Error("Failed");
        return res.json();
      },
    },
  );

  return (
    <div className="space-y-6">
      <div className="mb-4 flex items-center justify-between rounded-lg border bg-background p-4 shadow-sm">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <UserCog className="size-5 text-indigo-600" /> Tariffe Staff e
            Insegnanti
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Listino prezzi interno riservato ai collaboratori e core-instructor
          </p>
        </div>
        <Button
          onClick={() => setIsStaffRateModalOpen(true)}
          variant="outline"
          className="border-indigo-200 text-indigo-700"
        >
          <Plus className="mr-2 size-4" /> Nuova Tariffa
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {isLoadingRates ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={`sk-${i}`}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : staffRates?.length ? (
          staffRates.map((rate) => (
            <Card
              key={rate.id}
              className="shadow-sm transition-shadow hover:shadow-md"
            >
              <CardHeader className="border-b bg-muted/50 pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-[15px] font-bold leading-tight text-foreground">
                    {rate.serviceLabel}
                  </CardTitle>
                  {rate.isActive && (
                    <CheckCircle2 className="ml-2 size-4 shrink-0 text-emerald-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-indigo-700">
                    {Number(rate.amount) > 0
                      ? `€ ${Number(rate.amount).toFixed(2)}`
                      : "Gratis"}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    /{" "}
                    {rate.rateType === "annual"
                      ? "Anno"
                      : rate.rateType === "per_session"
                        ? "Sessione"
                        : "Uso"}
                  </span>
                </div>
                <div className="space-y-1.5 border-t pt-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Applica a:</span>
                    <span className="font-medium text-foreground/80">
                      {rate.applicableTo === "all_staff"
                        ? "Tutto lo Staff"
                        : rate.applicableTo || "Speculare"}
                    </span>
                  </div>
                  {rate.studioRestriction && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Studio/Sala:
                      </span>
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700 dark:bg-amber-950/20">
                        {rate.studioRestriction}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tessera Inclusa:
                    </span>
                    <span className="font-medium">
                      {rate.requiresMembership ? "NO" : "SÌ"}
                    </span>
                  </div>
                </div>
                {rate.notes && (
                  <div className="mt-2 rounded border border-blue-100 bg-blue-50 p-2 text-xs italic text-muted-foreground dark:border-blue-900/50 dark:bg-blue-950/20">
                    <span className="mb-0.5 block font-semibold not-italic text-blue-800 dark:text-blue-300">
                      Note operative:
                    </span>
                    {rate.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex h-24 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
            Nessuna tariffa staff configurata.
          </div>
        )}
      </div>

      {/* Staff Rate Modal */}
      <Dialog
        open={isStaffRateModalOpen}
        onOpenChange={setIsStaffRateModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova Tariffa Staff</DialogTitle>
            <DialogDescription>
              Crea un prezzo agevolato per lo staff.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Etichetta Servizio</Label>
              <Input
                value={newStaffRate.serviceLabel}
                onChange={(e) =>
                  setNewStaffRate({
                    ...newStaffRate,
                    serviceLabel: e.target.value,
                  })
                }
                placeholder="es. Tesseramento Staff"
              />
            </div>
            <div className="space-y-2">
              <Label>Codice Servizio (Univoco)</Label>
              <Input
                value={newStaffRate.serviceCode}
                onChange={(e) =>
                  setNewStaffRate({
                    ...newStaffRate,
                    serviceCode: e.target.value
                      .toUpperCase()
                      .replace(/\s/g, "_"),
                  })
                }
                placeholder="es. QUOTA_STAFF_25"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Importo (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newStaffRate.amount}
                  onChange={(e) =>
                    setNewStaffRate({ ...newStaffRate, amount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo Tariffa</Label>
                <Input
                  value={newStaffRate.rateType}
                  onChange={(e) =>
                    setNewStaffRate({
                      ...newStaffRate,
                      rateType: e.target.value,
                    })
                  }
                  placeholder="es. annual, monthly"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsStaffRateModalOpen(false)}
            >
              Annulla
            </Button>
            <Button
              onClick={() => createStaffRateMutation.mutate(newStaffRate)}
              disabled={
                !newStaffRate.serviceLabel ||
                !newStaffRate.amount ||
                createStaffRateMutation.isPending
              }
            >
              Crea Tariffa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
