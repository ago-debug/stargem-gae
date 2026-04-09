import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HeartHandshake, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import type { WelfareProvider, StaffRate } from "@shared/schema";
import { Separator } from "@/components/ui/separator";
import { UserCog, Plus, CheckCircle2 } from "lucide-react";

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
      toast({ title: "Salvato", description: `Configurazione ${provider.name} salvata.` });
    },
    onError: () => {
      toast({ title: "Errore (404)", description: "L'endpoint per salvare welfare non è ancora pronto.", variant: "destructive" });
    }
  });

  return (
    <Card className="flex flex-col">
      <CardHeader className="bg-slate-50 border-b pb-4">
        <CardTitle className="text-lg text-green-800">{formData.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-5 pt-4">
        <div className="flex items-center justify-between">
          <Label htmlFor={`tessera-${formData.id}`} className="flex flex-col gap-1 cursor-pointer">
            <span className="font-semibold">Quota Tessera Inclusa</span>
            <span className="font-normal text-xs text-muted-foreground">Il provider copre i 25€</span>
          </Label>
          <Switch id={`tessera-${formData.id}`} checked={formData.requiresMembershipFee === false} onCheckedChange={(c) => setFormData({ ...formData, requiresMembershipFee: !c })} />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor={`med-${formData.id}`} className="flex flex-col gap-1 cursor-pointer">
            <span className="font-semibold">Cert. Medico Necessario</span>
            <span className="font-normal text-xs text-muted-foreground">Blocca se assente</span>
          </Label>
          <Switch id={`med-${formData.id}`} checked={!!formData.requiresMedicalCert} onCheckedChange={(c) => setFormData({ ...formData, requiresMedicalCert: c })} />
        </div>

        <div className="space-y-2 pt-2 border-t">
          <Label className="text-sm font-semibold">Categorie Abilitate</Label>
          <div className="text-xs text-muted-foreground">
             {Array.isArray(formData.availableCategories) && formData.availableCategories.length > 0 
                ? formData.availableCategories.join(", ") 
                : (formData.availableCategories || "Nessuna categoria limitata")}
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <Label className="text-sm font-semibold">Note Operative Segreteria</Label>
          <Textarea 
            placeholder="Istruzioni per l'operatore..." 
            value={formData.operativeNotes || ""}
            onChange={(e) => setFormData({ ...formData, operativeNotes: e.target.value })}
            className="h-20 text-xs bg-yellow-50/30"
          />
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 bg-slate-50">
        <Button 
           className="w-full gap-2 bg-green-600 hover:bg-green-700" 
           onClick={() => saveMutation.mutate(formData)}
           disabled={saveMutation.isPending}
        >
          <Save className="h-4 w-4" /> Salva Configurazione
        </Button>
      </CardFooter>
    </Card>
  );
}

export function WelfareTab() {
  const { data: providers, isLoading, error } = useQuery<WelfareProvider[]>({
    queryKey: ["/api/welfare-providers"],
    retry: 1
  });

  const { data: staffRates, isLoading: isLoadingRates } = useQuery<StaffRate[]>({
    queryKey: ["/api/staff-rates"],
  });

  const is404 = error?.message?.includes("404");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-green-900 flex items-center gap-2">
            <HeartHandshake className="w-5 h-5" /> Provider Welfare
          </h2>
          <p className="text-sm text-muted-foreground">Gestisci Edenred, TreCuori, EasyWelfare e gli accordi assicurativi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && !is404 ? (
           Array.from({ length: 3 }).map((_, i) => (
             <Card key={i}>
                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                <CardContent className="space-y-4">
                   <Skeleton className="h-10 w-full" />
                   <Skeleton className="h-10 w-full" />
                   <Skeleton className="h-24 w-full" />
                </CardContent>
             </Card>
           ))
        ) : is404 || !providers || providers.length === 0 ? (
           <div className="col-span-full h-48 border border-dashed rounded-lg bg-slate-50 flex flex-col items-center justify-center text-muted-foreground opacity-60">
              <HeartHandshake className="h-10 w-10 mb-3 text-slate-300" />
              <span className="font-medium">Nessun provider welfare configurato.</span>
              <span className="text-xs mt-1">Configurazione endpoint API in progress (404/Empty).</span>
           </div>
        ) : (
           providers.map(provider => (
             <WelfareProviderCard key={provider.id} provider={provider} />
           ))
        )}
      </div>

      <Separator className="my-8" />
      
      <div className="flex justify-between items-center mb-4">
        <div>
           <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <UserCog className="w-5 h-5 text-indigo-600" /> Tariffe Staff e Insegnanti
           </h3>
           <p className="text-sm text-muted-foreground mt-1">Listino prezzi interno riservato ai collaboratori e core-instructor</p>
        </div>
        <Button variant="outline" className="text-indigo-700 border-indigo-200">
           <Plus className="w-4 h-4 mr-2" /> Nuova Tariffa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {isLoadingRates ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={`sk-${i}`}><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))
         ) : staffRates?.length ? (
            staffRates.map(rate => (
               <Card key={rate.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 border-b bg-slate-50/50">
                     <div className="flex justify-between items-start">
                        <CardTitle className="text-[15px] font-bold text-slate-800 leading-tight">
                           {rate.serviceLabel}
                        </CardTitle>
                        {rate.isActive && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />}
                     </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                     <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-indigo-700">
                           {Number(rate.amount) > 0 ? `€ ${Number(rate.amount).toFixed(2)}` : "Gratis"}
                        </span>
                        <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                           / {rate.rateType === 'annual' ? "Anno" : (rate.rateType === 'per_session' ? "Sessione" : "Uso")}
                        </span>
                     </div>
                     <div className="space-y-1.5 text-sm pt-2 border-t">
                        <div className="flex justify-between">
                           <span className="text-muted-foreground">Applica a:</span>
                           <span className="font-medium text-slate-700">{rate.applicableTo === 'all_staff' ? "Tutto lo Staff" : (rate.applicableTo || "Speculare")}</span>
                        </div>
                        {rate.studioRestriction && (
                           <div className="flex justify-between">
                              <span className="text-muted-foreground">Studio/Sala:</span>
                              <span className="font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">{rate.studioRestriction}</span>
                           </div>
                        )}
                        <div className="flex justify-between">
                           <span className="text-muted-foreground">Tessera Inclusa:</span>
                           <span className="font-medium">{rate.requiresMembership ? "NO" : "SÌ"}</span>
                        </div>
                     </div>
                     {rate.notes && (
                        <div className="bg-blue-50/50 p-2 rounded border border-blue-100 text-xs italic text-slate-600 mt-2">
                           <span className="font-semibold not-italic block mb-0.5 text-blue-800">Note operative:</span>
                           {rate.notes}
                        </div>
                     )}
                  </CardContent>
               </Card>
            ))
         ) : (
            <div className="col-span-full h-24 border-2 border-dashed flex items-center justify-center rounded-lg text-slate-500">
               Nessuna tariffa staff configurata.
            </div>
         )}
      </div>
    </div>
  );
}
