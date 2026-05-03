import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Combobox } from "@/components/ui/combobox";
import { InlineListEditorDialog } from "@/components/inline-list-editor-dialog";
import { Edit, RefreshCw, Settings2, ShieldAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCustomListValues, useQuickAddCustomList } from "@/hooks/use-custom-list";
import { useCrmForm } from "@/components/crm/CrmFormContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";

export interface TabMarketingProps {
  currentMember: any;
  getInputClassName: (field: string, nested?: boolean) => string;
}

export function TabMarketing({
  currentMember,
  getInputClassName
}: TabMarketingProps) {
  const { formData, handleChange, selectedMemberId } = useCrmForm();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const canaliAcquisizione = useCustomListValues("provenienza_marketing");
  const quickAddCanale = useQuickAddCustomList("provenienza_marketing");
  const livelliCrm = useCustomListValues("livello_crm");
  const quickAddLivello = useQuickAddCustomList("livello_crm");

  const [isCrmOverrideOpen, setIsCrmOverrideOpen] = useState(false);
  const [crmOverrideData, setCrmOverrideData] = useState({ level: "NONE", reason: "", override: false });

  const recalculateCrmMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMemberId) throw new Error("Manca il membro corrente.");
      return await apiRequest("POST", `/api/crm/profile/${selectedMemberId}/recalculate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/current", selectedMemberId] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({ title: "Profilo CRM ricalcolato con successo" });
    }
  });

  const overrideCrmMutation = useMutation({
    mutationFn: async (data: { level: string, reason: string, override: boolean }) => {
      if (!selectedMemberId) throw new Error("Manca il membro corrente.");
      return await apiRequest("POST", `/api/crm/profile/${selectedMemberId}/override`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/current", selectedMemberId] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({ title: "Forzatura CRM salvata" });
      setIsCrmOverrideOpen(false);
    }
  });

  const handleOpenCrmOverride = () => {
    setCrmOverrideData({
      level: currentMember?.crmProfileLevel || "NONE",
      reason: currentMember?.crmProfileReason || "",
      override: currentMember?.crmProfileOverride || false
    });
    setIsCrmOverrideOpen(true);
  };
  return (
    <>
      {/* ATTIVITÀ DI MARKETING (FULL WIDTH ROW) */}
      <Card id="attivita-marketing" className="bg-amber-50 dark:bg-amber-950/20 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/50 scroll-mt-32">
        <CardHeader className="pb-3 bg-amber-100 dark:bg-amber-900/30 rounded-t-lg border-b border-amber-200 dark:border-amber-900/50/50">
            <CardTitle className="flex items-center justify-between text-lg font-bold text-amber-800 dark:text-amber-400 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center">🎯</span>
                Attività di marketing
              </div>
              {currentMember && (
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 bg-background dark:bg-transparent"
                    onClick={(e) => { e.preventDefault(); recalculateCrmMutation.mutate(); }}
                    disabled={recalculateCrmMutation.isPending}
                    title="Ricalcola Scoring"
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-2", recalculateCrmMutation.isPending && "animate-spin")} />
                    Ricalcola
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 bg-background dark:bg-transparent border-amber-300 dark:border-amber-800/50 hover:bg-amber-100 dark:bg-amber-900/30"
                    onClick={(e) => { e.preventDefault(); handleOpenCrmOverride(); }}
                    title="Impostazioni Manuali"
                  >
                    <Settings2 className="w-4 h-4 mr-2 text-muted-foreground" />
                    Forzatura
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
              
              {/* Da Dove Arriva */}
              <div className="space-y-2 col-span-1">
                <div className="flex items-center gap-2">
                  <Label className="uppercase text-xs font-semibold text-muted-foreground">Canale di Acquisizione</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" size="icon" variant="ghost" className="h-4 w-4">
                        <Edit className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" onInteractOutside={(e) => e.stopPropagation()}>
                      <InlineListEditorDialog listCode="canale_acquisizione" listName="Canale Acquisizione" showColors={false} />
                    </PopoverContent>
                  </Popover>
                </div>
                <Combobox
                  name="daDoveArriva"
                  value={formData.daDoveArriva || ""}
                  onValueChange={(v) => handleChange("daDoveArriva", v)}
                  options={canaliAcquisizione.map((c: string) => ({ value: c, label: c }))}
                  placeholder="Seleziona o cerca..."
                  emptyText="Nessun canale trovato"
                  className={`bg-background dark:bg-transparent ${getInputClassName("daDoveArriva", false)}`}
                  onQuickAdd={(v) => quickAddCanale.mutate(v)}
                  isQuickAddPending={quickAddCanale.isPending}
                />
              </div>

              {/* Dati CRM Real-Time */}
              {currentMember ? (
                <>
                  <div className="space-y-2 col-span-1">
                    <div className="flex flex-col gap-1 items-start">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-help hover:text-amber-600 transition-colors">
                              <Label className="uppercase text-xs font-semibold text-muted-foreground cursor-help">Livello & Score</Label>
                              <Info className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[280px] bg-background dark:bg-slate-900 border-amber-200 dark:border-amber-900/50">
                            <p className="text-xs text-muted-foreground dark:text-slate-300">
                              Il livello marketing viene assegnato automaticamente in base a spesa, continuità, numero di attività e recente partecipazione. Il modello può essere aggiornato nel tempo per migliorare la classificazione.
                              <br/><br/>
                              Fattori considerati (Score 0-100):
                              <ul className="list-disc ml-4 my-1">
                                <li>Spesa ultimi 12 mesi</li>
                                <li>Continuità (Frequenza)</li>
                                <li>Numero attività/servizi</li>
                                <li>Recency (Attività recente)</li>
                              </ul>
                              <br/>
                              I livelli previsti sono: <strong>Silver, Gold, Platinum, Diamond</strong>.
                              <br/><br/>
                              La forzatura manuale è solo eccezione amministrativa e riposizione questo calcolo automatico.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-center gap-3 h-10">
                      {currentMember?.crmProfileLevel && currentMember.crmProfileLevel !== "NONE" ? (
                        <Badge className={
                          currentMember.crmProfileLevel === 'DIAMOND' ? 'bg-cyan-500 border-cyan-500 text-white w-[110px] h-7 text-sm flex justify-center shadow-sm shadow-cyan-200/50' :
                          currentMember.crmProfileLevel === 'PLATINUM' ? 'bg-slate-900 border-slate-900 text-white w-[110px] h-7 text-sm flex justify-center' : 
                          currentMember.crmProfileLevel === 'GOLD' ? 'bg-amber-500 border-amber-500 text-white w-[110px] h-7 text-sm flex justify-center' : 
                          'bg-slate-200 border-border text-foreground/80 hover:bg-slate-300 w-[110px] h-7 text-sm flex justify-center'
                        }>
                          {currentMember.crmProfileLevel}
                        </Badge>
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">-</span>
                      )}

                      {currentMember?.crmProfileLevel && currentMember.crmProfileLevel !== "NONE" && (
                        <span className="text-lg font-bold text-amber-700 dark:text-amber-400">
                          {currentMember.crmProfileScore || 0} <span className="text-sm font-normal">pts</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label className="uppercase text-xs font-semibold text-muted-foreground flex items-center gap-2">
                      Dettagli Algoritmo
                      {currentMember?.crmProfileOverride && (
                        <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/20 h-5 text-xxs px-1.5 flex items-center gap-1 cursor-help leading-none" title="Forzatura manuale attiva">
                          <ShieldAlert className="w-3 h-3" />
                          Forzato
                        </Badge>
                      )}
                    </Label>
                    <div className="bg-background/50 dark:bg-black/20 p-2.5 rounded-md border border-amber-200 dark:border-amber-900/50/50 min-h-[40px] flex items-center text-sm text-muted-foreground break-words italic">
                      {currentMember?.crmProfileReason || "Nessun ricalcolo effettuato di recente."}
                    </div>
                  </div>
                </>
              ) : (
                <div className="col-span-3 flex items-center justify-center p-4 border border-dashed border-amber-300 dark:border-amber-800/50 rounded-md bg-background/30 text-amber-800 dark:text-amber-400/60 text-sm">
                  Salva o seleziona un partecipante per attivare il calcolo CRM.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      {/* Modale Forzatura livello marketing */}
      <Dialog open={isCrmOverrideOpen} onOpenChange={setIsCrmOverrideOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Forzatura livello marketing</DialogTitle>
            <DialogDescription className="text-sm">
              Modifica manualmente il livello assegnato a questo partecipante. Selezionando un livello, il calcolo automatico verrà disattivato finché la forzatura resta attiva.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-amber-50 dark:bg-amber-950/20 dark:bg-amber-900/10 p-3 rounded-md border border-amber-200 dark:border-amber-900/50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-2 mt-4 text-sm">
            <span className="text-amber-800 dark:text-amber-400 dark:text-amber-200 font-medium whitespace-nowrap">Stato attuale a sistema:</span>
            <div className="flex gap-4">
              <span className="text-foreground/80 dark:text-slate-300"><span className="font-semibold">{currentMember?.crmProfileLevel && currentMember.crmProfileLevel !== "NONE" ? currentMember.crmProfileLevel : "Nessuno"}</span></span>
              <span className="text-amber-700 dark:text-amber-400 font-bold">{currentMember?.crmProfileScore || 0} pts</span>
            </div>
          </div>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="crm-override-toggle"
                checked={crmOverrideData.override}
                onCheckedChange={(val: boolean | string) => setCrmOverrideData(prev => ({ ...prev, override: !!val }))}
              />
              <Label htmlFor="crm-override-toggle" className="font-semibold cursor-pointer">Attiva forzatura manuale</Label>
            </div>

            {crmOverrideData.override && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="space-y-2">
                  <Label>Livello</Label>
                  <Combobox
                    name="livelloCrm"
                    value={crmOverrideData.level || ""}
                    onValueChange={(v) => setCrmOverrideData(prev => ({ ...prev, level: v }))}
                    options={[{value: "NONE", label: "Nessun livello"}, ...livelliCrm.map((l: string) => ({ value: l.toUpperCase(), label: l }))]}
                    placeholder="Seleziona livello..."
                    emptyText="Nessun livello trovato"
                    onQuickAdd={(v) => quickAddLivello.mutate(v)}
                    isQuickAddPending={quickAddLivello.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Motivazione Forzatura <span className="text-red-500">*</span></Label>
                  <Input 
                    placeholder="Es: Cliente storico VIP inserito manualmente..."
                    value={crmOverrideData.reason}
                    onChange={(e) => setCrmOverrideData(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCrmOverrideOpen(false)}>Annulla</Button>
            <Button 
              onClick={() => overrideCrmMutation.mutate(crmOverrideData as any)}
              disabled={overrideCrmMutation.isPending || (crmOverrideData.override && !crmOverrideData.reason.trim())}
            >
              <Save className="w-4 h-4 mr-2" />
              Salva Impostazioni
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
