import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface DuplicatePair {
  id1: number; id2: number;
  name1: string; name2: string;
  cf1?: string; cf2?: string;
  email1?: string; email2?: string;
  phone1?: string; phone2?: string;
  dob1?: string; dob2?: string;
  city1?: string; city2?: string;
  score: number;
  matchReasons: { field: string, points: number }[];
  suggestedWinner: number;
  member1Full: any;
  member2Full: any;
  // legacy for step 1 list
  fiscalCode?: string;
  reason?: string;
  members: any[];
}

export function DuplicateMergeModal({ 
  open, 
  onOpenChange, 
  duplicates = [],
  onNavigateToMember,
  member1,
  member2,
  onMergeComplete
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  duplicates?: DuplicatePair[];
  onNavigateToMember?: (id: number) => void;
  member1?: any;
  member2?: any;
  onMergeComplete?: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for step 2
  const [selectedPair, setSelectedPair] = useState<DuplicatePair | null>(null);
  
  // fieldOverrides map fieldName -> value that should be updated on the winner
  const [winnerId, setWinnerId] = useState<number>(0);
  const [loserId, setLoserId] = useState<number>(0);
  const [fieldOverrides, setFieldOverrides] = useState<Record<string, any>>({});

  const mergeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/members/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Errore durante unione");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Unione completata", description: "Le schede sono state fuse con successo." });
      queryClient.invalidateQueries({ queryKey: ["/api/members/duplicates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      setSelectedPair(null);
      if (onMergeComplete) {
        onMergeComplete();
      }
    },
    onError: (err: any) => {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    }
  });

  useEffect(() => {
    if (open && member1 && member2 && !selectedPair) {
      const getC = (m: any) => Object.values(m).filter(v => !!v).length;
      const c1 = getC(member1);
      const c2 = getC(member2);
      const suggestedWinner = c1 >= c2 ? member1.id : member2.id;
      
      const pair: DuplicatePair = {
         id1: member1.id, id2: member2.id,
         name1: `${member1.lastName} ${member1.firstName}`,
         name2: `${member2.lastName} ${member2.firstName}`,
         cf1: member1.fiscalCode, cf2: member2.fiscalCode,
         email1: member1.email, email2: member2.email,
         phone1: member1.mobile || member1.phone, phone2: member2.mobile || member2.phone,
         dob1: member1.dateOfBirth, dob2: member2.dateOfBirth,
         city1: member1.city, city2: member2.city,
         score: 10,
         matchReasons: [],
         suggestedWinner,
         member1Full: member1,
         member2Full: member2,
         members: [member1, member2]
      };
      // auto set
      handleStartMerge(pair);
    } else if (!open && selectedPair && (member1 || member2)) {
      setSelectedPair(null);
    }
  }, [open, member1, member2]);

  const notDuplicateMutation = useMutation({
    mutationFn: async (data: { id1: number, id2: number }) => {
      const res = await fetch("/api/members/not-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Errore esclusione");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/duplicates"] });
    }
  });

  const handleStartMerge = (pair: DuplicatePair) => {
    setSelectedPair(pair);
    const winId = pair.suggestedWinner;
    const loseId = winId === pair.id1 ? pair.id2 : pair.id1;
    setWinnerId(winId);
    setLoserId(loseId);
    
    // Auto-select missing properties in winner that are present in loser
    const winData = winId === pair.id1 ? pair.member1Full : pair.member2Full;
    const loseData = winId === pair.id1 ? pair.member2Full : pair.member1Full;
    
    const initialOverrides: Record<string, any> = {};
    const relevantFields = ["fiscalCode", "email", "mobile", "phone", "dateOfBirth", "city", "address", "postalCode"];
    
    for (const f of relevantFields) {
       // if winner is empty, and loser has it, preset it
       if (!winData[f] && loseData[f]) {
         initialOverrides[f] = loseData[f];
       }
    }
    setFieldOverrides(initialOverrides);
  };

  const handleConfirmMerge = () => {
    const wData = winnerId === selectedPair?.id1 ? selectedPair?.member1Full : selectedPair?.member2Full;
    const lData = winnerId === selectedPair?.id1 ? selectedPair?.member2Full : selectedPair?.member1Full;
    
    if (wData.fiscalCode && lData.fiscalCode && wData.fiscalCode !== lData.fiscalCode) {
      if (!fieldOverrides["fiscalCode"] && fieldOverrides["fiscalCode"] !== wData.fiscalCode) {
         // It's checked in UI, so just let them proceed, but we could add safe guard here
      }
    }
    
    mergeMutation.mutate({
      winnerId,
      loserId,
      fieldOverrides
    });
  };

  if (selectedPair) {
    const wData = winnerId === selectedPair.id1 ? selectedPair.member1Full : selectedPair.member2Full;
    const lData = winnerId === selectedPair.id1 ? selectedPair.member2Full : selectedPair.member1Full;
    const fields = [
      { key: "fiscalCode", label: "Codice Fiscale" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Telefono Fisso" },
      { key: "mobile", label: "Cellulare" },
      { key: "dateOfBirth", label: "Data Nascita" },
      { key: "placeOfBirth", label: "Luogo Nascita" },
      { key: "address", label: "Indirizzo" },
      { key: "city", label: "Città" },
      { key: "postalCode", label: "CAP" },
      { key: "province", label: "Provincia" },
      { key: "notes", label: "Note" },
    ];

    const hasCfConflict = wData.fiscalCode && lData.fiscalCode && wData.fiscalCode !== lData.fiscalCode;

    return (
      <Dialog open={open} onOpenChange={(v) => { if (!v) onOpenChange(false); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Fusione Manuale Schede
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center text-sm mb-4">
              {!member1 && !member2 && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedPair(null)}>← Torna alla lista</Button>
              )}
            </div>

            {hasCfConflict && (
              <div className="bg-red-100 text-red-800 p-3 rounded text-sm font-semibold border border-red-200">
                Attenzione: CF diversi. Verifica prima di unire e seleziona il CF corretto da mantenere.
              </div>
            )}

            <div className="grid grid-cols-[1fr_2fr_2fr] gap-4 font-semibold border-b pb-2 text-sm">
              <div>Campo</div>
              <div className="p-2 border-2 border-primary/20 rounded bg-primary/5 flex items-center justify-between">
                <div className="flex flex-col text-left">
                  <span>Principale (ID {wData.id})</span>
                  <span className="text-xs font-normal opacity-80">{wData.lastName} {wData.firstName}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => {
                  // Swap
                  setWinnerId(lData.id); setLoserId(wData.id); setFieldOverrides({});
                }}>Scambia</Button>
              </div>
              <div className="p-2 border-2 border-muted rounded bg-muted/20 flex justify-between items-center text-muted-foreground">
                <div className="flex flex-col text-left">
                  <span>Da eliminare (ID {lData.id})</span>
                  <span className="text-xs font-normal opacity-80">{lData.lastName} {lData.firstName}</span>
                </div>
                <Badge variant="secondary">Verrà fuso qui</Badge>
              </div>
            </div>

            <div className="space-y-2 text-sm">
               {fields.map(f => {
                 const vW = wData[f.key];
                 const vL = lData[f.key];
                 const isIdentical = vW === vL;
                 
                 // if they picked the loser's value
                 const isLoserSelected = fieldOverrides[f.key] === vL && vL !== undefined && !isIdentical;
                 
                 return (
                   <div key={f.key} className="grid grid-cols-[1fr_2fr_2fr] gap-4 p-2 border-b items-center hover:bg-muted/10">
                     <div className="font-medium text-muted-foreground">{f.label}</div>
                     
                     <div className="flex items-center gap-2">
                       {isIdentical ? <span className="text-muted-foreground">-</span> : (
                         <Checkbox 
                           checked={!isLoserSelected} 
                           onCheckedChange={(v) => {
                             if (v) {
                               const newO = {...fieldOverrides};
                               delete newO[f.key];
                               setFieldOverrides(newO);
                             }
                           }}
                         />
                       )}
                       <span className={!isIdentical && !isLoserSelected ? "font-semibold" : ""}>{vW || <span className="text-muted-foreground italic">vuoto</span>}</span>
                     </div>
                     
                     <div className="flex items-center gap-2">
                       {isIdentical ? <span className="text-green-600 text-xs flex items-center gap-1"><Check className="w-3 h-3"/> uguali</span> : (
                         <Checkbox 
                           checked={isLoserSelected} 
                           onCheckedChange={(v) => {
                             if (v) {
                               setFieldOverrides({...fieldOverrides, [f.key]: vL});
                             }
                           }}
                         />
                       )}
                       <span className={!isIdentical && isLoserSelected ? "font-semibold text-primary" : "text-muted-foreground"}>{vL || <span className="italic">vuoto</span>}</span>
                     </div>
                   </div>
                 );
               })}
            </div>

            <div className="pt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => {
                if (member1 && member2) {
                  onOpenChange(false);
                } else {
                  setSelectedPair(null);
                }
              }}>Annulla</Button>
              <Button onClick={handleConfirmMerge} disabled={mergeMutation.isPending}>
                {mergeMutation.isPending ? "Operazione in corso..." : "Conferma Unione"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // STEP 1
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Anagrafiche Sospette (Duplicati)
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
             Rilevamento automatico a punteggio. Ogni coppia ha uno score: più alto = più probabile che sia la stessa persona. Verifica e unisci solo se sei sicuro.
          </p>

          <div className="bg-muted/50 p-4 rounded-lg border text-sm text-muted-foreground">
            <ol className="list-decimal pl-4 space-y-1 text-xs">
              <li>Leggi il badge score: &gt;8 quasi certo, 5-7 da verificare</li>
              <li>Clicca 'Unisci queste 2' per scegliere campo per campo quali dati mantenere</li>
              <li>Se sono persone diverse clicca 'Non duplicato' per nasconderli dall'elenco</li>
            </ol>
          </div>

          <div className="space-y-3">
            {duplicates?.map((duplicate) => {
              // Determine style by score/reason
              let badgeColor = "bg-primary/20 text-primary";
              const reasonStr = duplicate.matchReasons?.map(r=>r.field).join(", ") || duplicate.reason;
              if (duplicate.score >= 8 || duplicate.reason === "CF Identico") badgeColor = "bg-red-100 text-red-800 border-red-200";
              else if (duplicate.score >= 6) badgeColor = "bg-orange-100 text-orange-800 border-orange-200";
              else if (duplicate.score >= 4) badgeColor = "bg-yellow-100 text-yellow-800 border-yellow-200";
              else badgeColor = "bg-blue-100 text-blue-800 border-blue-200";

              return (
                <Card key={duplicate.id1 + "-" + duplicate.id2} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-2 flex-grow">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg text-primary">{duplicate.score}/10 pt</span>
                      <Badge variant="outline" className={`text-xs border ${badgeColor}`}>
                        {reasonStr}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                       <div className="p-2 border rounded hover:bg-muted/50 cursor-pointer" onClick={() => onNavigateToMember?.(duplicate.id1)}>
                         <div className="font-semibold">{duplicate.name1}</div>
                         <div className="text-xs text-muted-foreground font-mono">{duplicate.cf1 || "No CF"}</div>
                         <div className="text-xs text-muted-foreground">{duplicate.email1 || duplicate.phone1}</div>
                       </div>
                       <div className="p-2 border rounded hover:bg-muted/50 cursor-pointer" onClick={() => onNavigateToMember?.(duplicate.id2)}>
                         <div className="font-semibold">{duplicate.name2}</div>
                         <div className="text-xs text-muted-foreground font-mono">{duplicate.cf2 || "No CF"}</div>
                         <div className="text-xs text-muted-foreground">{duplicate.email2 || duplicate.phone2}</div>
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                    <Button variant="default" size="sm" onClick={() => handleStartMerge(duplicate)}>
                      Unisci queste 2
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => notDuplicateMutation.mutate({ id1: duplicate.id1, id2: duplicate.id2 })}
                      disabled={notDuplicateMutation.isPending}
                    >
                      Non duplicato
                    </Button>
                  </div>
                </Card>
              );
            })}
            
            {(!duplicates || duplicates.length === 0) && (
              <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
                Nessun potenziale duplicato rilevato.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
