import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2, Plus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Member } from "@shared/schema";

export function LezioneSpotDialog() {
  const [open, setOpen] = useState(false);
  
  const [memberId, setMemberId] = useState<number | null>(null);
  const [instructorId, setInstructorId] = useState<string>("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTimeStart, setSessionTimeStart] = useState("");
  const [sessionTimeEnd, setSessionTimeEnd] = useState("");
  const [lessonType, setLessonType] = useState("singola");
  const [locationType, setLocationType] = useState("in_sede");
  const [amount, setAmount] = useState<string>("55");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [notes, setNotes] = useState("");

  const [memberSearchOpen, setMemberSearchOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rawMembers, isLoading: loadingMembers } = useQuery<any>({
    queryKey: ["/api/members"],
  });
  const membersList = rawMembers?.members ?? rawMembers?.data ?? rawMembers ?? [];
  const safeMembers: Member[] = Array.isArray(membersList) ? membersList : [];

  const { data: rawInstructors } = useQuery<any>({
    queryKey: ["/api/members?participantType=INSEGNANTE"],
  });
  const instructorsList = rawInstructors?.members ?? rawInstructors?.data ?? rawInstructors ?? [];
  const safeInstructors: Member[] = Array.isArray(instructorsList) ? instructorsList : [];

  const { data: paymentMethods } = useQuery<any[]>({
    queryKey: ["/api/custom-list-items/metodi-pagamento"],
    queryFn: async () => {
       const res = await fetch("/api/custom-lists/metodi-pagamento/items");
       if (!res.ok) return [];
       return await res.json();
    }
  });

  // Derived filtered members
  const filteredMembers = safeMembers.filter((m) => {
    if (!memberSearchQuery) return true;
    const lowerQuery = memberSearchQuery.toLowerCase();
    const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
    return fullName.includes(lowerQuery) || m.fiscalCode?.toLowerCase().includes(lowerQuery);
  }) || [];

  const selectedMemberObj = safeMembers.find(m => m.id === memberId);

  useEffect(() => {
    // Auto-calculate base amount
    let baseAmount = "55";
    switch (lessonType) {
      case "singola": baseAmount = "55"; break;
      case "coppia": baseAmount = "75"; break;
      case "aerial": baseAmount = "70"; break;
      case "domicilio_singola": baseAmount = "65"; break;
      case "domicilio_coppia": baseAmount = "85"; break;
    }
    setAmount(baseAmount);
  }, [lessonType]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/lezioni-spot", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/carnet-sessions"] });
      toast({ title: "Lezione spot registrata", description: "Pagamento salvato con successo." });
      setOpen(false);
    },
    onError: () => {
      toast({ title: "Errore di salvataggio (404)", description: "Endpoint /api/lezioni-spot da implementare backend.", variant: "destructive" });
      setOpen(false);
    }
  });

  const handleSubmit = () => {
    mutation.mutate({
      memberId,
      instructorId: parseInt(instructorId),
      sessionDate,
      sessionTimeStart,
      sessionTimeEnd,
      lessonType,
      locationType,
      amount: parseFloat(amount),
      paymentMethodId: paymentMethodId ? parseInt(paymentMethodId) : null,
      notes
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100">
           <Zap className="w-4 h-4" /> Lezione Spot
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuova Lezione Spot</DialogTitle>
          <DialogDescription>Registra un ingresso one-shot per lezione privata e incassa direttamente.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">1. Dati Anagrafici e Logistica</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente Allievo *</Label>
                <Popover open={memberSearchOpen} onOpenChange={setMemberSearchOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={memberSearchOpen} className="w-full justify-between overflow-hidden">
                            <span className="truncate">
                                {selectedMemberObj ? `${selectedMemberObj.firstName} ${selectedMemberObj.lastName}` : "Seleziona cliente..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                        <Command shouldFilter={false}>
                            <CommandInput placeholder="Cerca nome o CF..." value={memberSearchQuery} onValueChange={setMemberSearchQuery} />
                            <CommandList>
                                <CommandEmpty>Nessun cliente trovato.</CommandEmpty>
                                <CommandGroup>
                                    {filteredMembers.slice(0, 50).map((m) => (
                                        <CommandItem key={m.id} onSelect={() => {
                                                setMemberId(m.id);
                                                setMemberSearchOpen(false);
                                            }}
                                        >
                                            <Check className={cn("mr-2 h-4 w-4", memberId === m.id ? "opacity-100" : "opacity-0")} />
                                            <div className="flex flex-col">
                                                <span>{m.lastName} {m.firstName}</span>
                                                <span className="text-xs text-muted-foreground">{m.fiscalCode || 'No CF'} - Nato: {m.dateOfBirth ? new Date(m.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Istruttore *</Label>
                <Select value={instructorId} onValueChange={setInstructorId}>
                   <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                   <SelectContent>
                      {safeInstructors.map(i => (
                         <SelectItem key={i.id} value={String(i.id)}>{i.lastName} {i.firstName}</SelectItem>
                      ))}
                   </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Inizia *</Label>
                <Input type="time" value={sessionTimeStart} onChange={(e) => setSessionTimeStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Finisce *</Label>
                <Input type="time" value={sessionTimeEnd} onChange={(e) => setSessionTimeEnd(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
             <h3 className="font-semibold text-sm border-b pb-2">2. Configurazione Lezione & Prezzo</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label>Tipo Lezione</Label>
                   <Select value={lessonType} onValueChange={setLessonType}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                         <SelectItem value="singola">Singola (55€)</SelectItem>
                         <SelectItem value="coppia">Coppia (75€)</SelectItem>
                         <SelectItem value="aerial">Aerial (70€)</SelectItem>
                         <SelectItem value="domicilio_singola">Domicilio Singola (65€)</SelectItem>
                         <SelectItem value="domicilio_coppia">Domicilio Coppia (85€)</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                   <Label>Luogo Erogazione</Label>
                   <Select value={locationType} onValueChange={setLocationType}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                         <SelectItem value="in_sede">In Sede</SelectItem>
                         <SelectItem value="domicilio">A Domicilio</SelectItem>
                      </SelectContent>
                   </Select>
                   {locationType === "domicilio" && (
                     <p className="text-[10px] text-orange-600 font-medium">Preventivo zona/trasferta a consuntivo</p>
                   )}
                </div>
             </div>
             
             <div className="grid grid-cols-3 gap-4 pb-2">
                <div className="space-y-2">
                   <Label>Importo da Saldo Pagato (€) *</Label>
                   <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-emerald-50 border-emerald-200 font-bold text-emerald-900" />
                </div>
                <div className="space-y-2">
                   <Label>Metodo *</Label>
                   <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                      <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                      <SelectContent>
                         {paymentMethods?.map(pm => (
                            <SelectItem key={pm.id} value={String(pm.id)}>{pm.value}</SelectItem>
                         ))}
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                   <Label>Note</Label>
                   <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opzionale" />
                </div>
             </div>
          </div>
        </div>
        <DialogFooter>
           <Button variant="outline" onClick={() => setOpen(false)}>Annulla</Button>
           <Button 
             onClick={handleSubmit} 
             disabled={mutation.isPending || !memberId || !instructorId || !sessionDate || !sessionTimeStart || !sessionTimeEnd || !amount || parseFloat(amount) <= 0}
             className="bg-indigo-600 hover:bg-indigo-700"
           >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registra e Incassa
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
