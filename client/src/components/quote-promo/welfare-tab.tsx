import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HeartHandshake, Save, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import type { WelfareProvider } from "@shared/schema";
import { Separator } from "@/components/ui/separator";

function WelfareProviderCard({ provider }: { provider: WelfareProvider }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(provider);

  useEffect(() => {
    setFormData(provider);
  }, [provider]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PATCH", `/api/welfare-providers/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/welfare-providers"] });
      toast({
        title: "Salvato",
        description: `Configurazione ${provider.name} salvata.`,
      });
    },
    onError: () => {
      toast({
        title: "Errore (404)",
        description: "L'endpoint per salvare welfare non è ancora pronto.",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="flex flex-col">
      <CardHeader className="border-b bg-muted pb-4">
        <CardTitle className="text-lg text-green-800 dark:text-green-400">
          {formData.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-5 pt-4">
        <div className="flex items-center justify-between">
          <Label
            htmlFor={`tessera-${formData.id}`}
            className="flex cursor-pointer flex-col gap-1"
          >
            <span className="font-semibold">Quota Tessera Inclusa</span>
            <span className="text-xs font-normal text-muted-foreground">
              Il provider copre i 25€
            </span>
          </Label>
          <Switch
            id={`tessera-${formData.id}`}
            checked={formData.requiresMembershipFee === false}
            onCheckedChange={(c) =>
              setFormData({ ...formData, requiresMembershipFee: !c })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label
            htmlFor={`med-${formData.id}`}
            className="flex cursor-pointer flex-col gap-1"
          >
            <span className="font-semibold">Cert. Medico Necessario</span>
            <span className="text-xs font-normal text-muted-foreground">
              Blocca se assente
            </span>
          </Label>
          <Switch
            id={`med-${formData.id}`}
            checked={!!formData.requiresMedicalCert}
            onCheckedChange={(c) =>
              setFormData({ ...formData, requiresMedicalCert: c })
            }
          />
        </div>

        <div className="space-y-2 border-t pt-2">
          <Label className="text-sm font-semibold">Categorie Abilitate</Label>
          <div className="text-xs text-muted-foreground">
            {Array.isArray(formData.availableCategories) &&
            formData.availableCategories.length > 0
              ? formData.availableCategories.join(", ")
              : formData.availableCategories || "Nessuna categoria limitata"}
          </div>
        </div>

        <div className="space-y-2 border-t pt-2">
          <Label className="text-sm font-semibold">
            Note Operative Segreteria
          </Label>
          <Textarea
            placeholder="Istruzioni per l'operatore..."
            value={formData.operativeNotes || ""}
            onChange={(e) =>
              setFormData({ ...formData, operativeNotes: e.target.value })
            }
            className="h-20 bg-yellow-50/30 text-xs"
          />
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted pt-4">
        <Button
          className="w-full gap-2 bg-green-600 hover:bg-green-700"
          onClick={() => saveMutation.mutate(formData)}
          disabled={saveMutation.isPending}
        >
          <Save className="size-4" /> Salva Configurazione
        </Button>
      </CardFooter>
    </Card>
  );
}

export function WelfareTab({ seasonId }: { seasonId?: number | "active" }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isWelfareModalOpen, setIsWelfareModalOpen] = useState(false);
  const [newWelfareName, setNewWelfareName] = useState("");

  const createWelfareMutation = useMutation({
    mutationFn: async (name: string) => {
      await apiRequest("POST", "/api/welfare-providers", {
        name,
        seasonId: seasonId === "active" ? undefined : seasonId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/welfare-providers"] });
      toast({
        title: "Aggiunto",
        description: "Nuovo provider welfare creato con successo.",
      });
      setIsWelfareModalOpen(false);
      setNewWelfareName("");
    },
  });

  const {
    data: providers,
    isLoading,
    error,
  } = useQuery<WelfareProvider[]>({
    queryKey: ["/api/welfare-providers", { seasonId }],
    queryFn: async () => {
      const qs = seasonId ? `?seasonId=${seasonId}` : "";
      const res = await fetch(`/api/welfare-providers${qs}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    retry: 1,
  });

  const is404 = error?.message?.includes("404");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border bg-background p-4 shadow-sm">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-green-900">
            <HeartHandshake className="size-5" /> Provider Welfare
          </h2>
          <p className="text-sm text-muted-foreground">
            Gestisci Edenred, TreCuori, EasyWelfare e gli accordi assicurativi
          </p>
        </div>
        <Button
          onClick={() => setIsWelfareModalOpen(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="mr-2 size-4" /> Nuovo Provider
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && !is404 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))
        ) : is404 || !providers || providers.length === 0 ? (
          <div className="col-span-full flex h-48 flex-col items-center justify-center rounded-lg border border-dashed bg-muted text-muted-foreground opacity-60">
            <HeartHandshake className="mb-3 size-10 text-slate-300" />
            <span className="font-medium">
              Nessun provider welfare configurato.
            </span>
            <span className="mt-1 text-xs">
              Configurazione endpoint API in progress (404/Empty).
            </span>
          </div>
        ) : (
          providers.map((provider) => (
            <WelfareProviderCard key={provider.id} provider={provider} />
          ))
        )}
      </div>

      {/* Welfare Modal */}
      <Dialog open={isWelfareModalOpen} onOpenChange={setIsWelfareModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuovo Provider Welfare</DialogTitle>
            <DialogDescription>
              Aggiungi un nuovo provider per i pagamenti tramite welfare
              aziendale.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Provider</Label>
              <Input
                value={newWelfareName}
                onChange={(e) => setNewWelfareName(e.target.value)}
                placeholder="es. Edenred, TreCuori..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsWelfareModalOpen(false)}
            >
              Annulla
            </Button>
            <Button
              onClick={() => createWelfareMutation.mutate(newWelfareName)}
              disabled={!newWelfareName || createWelfareMutation.isPending}
            >
              Crea Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
