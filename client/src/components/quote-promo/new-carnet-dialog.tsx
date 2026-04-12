import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layers, Loader2, Check } from "lucide-react";
import { usePriceFromMatrix } from "@/hooks/use-price-from-matrix";
import { useCheckoutCalculator } from "@/hooks/use-checkout-calculator";

export function NewCarnetDialog() {
  const [open, setOpen] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [walletTypeId, setWalletTypeId] = useState<number | "">("");
  const [instructorId, setInstructorId] = useState("");
  const [groupSize, setGroupSize] = useState("1");
  const [locationType, setLocationType] = useState("in_sede");
  const [expiryDays, setExpiryDays] = useState(90);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [manualTotal, setManualTotal] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: membersObj } = useQuery<any>({ queryKey: ["/api/members"] });
  const members = membersObj?.members ?? membersObj?.data ?? membersObj ?? [];
  const safeMembers = Array.isArray(members) ? members : [];

  const { data: instructorsObj } = useQuery<any>({ queryKey: ["/api/members?participantType=INSEGNANTE"] });
  const instructors = instructorsObj?.members ?? instructorsObj?.data ?? instructorsObj ?? [];
  const safeInstructors = Array.isArray(instructors) ? instructors : [];

  const { data: walletTypes } = useQuery<any[]>({ queryKey: ["/api/custom-list-items/tipologie-carnet"] });
  const { data: paymentMethods } = useQuery<any[]>({ queryKey: ["/api/custom-lists/metodi-pagamento/items"] });

  const getCategoryFromWallet = (id: number | "") => {
    if (!id || !walletTypes) return "privata";
    const w = walletTypes.find(x => x.id === id);
    if (!w) return "privata";
    const lbl = w.label.toLowerCase();
    if (lbl.includes("affitto")) return "affitto";
    if (lbl.includes("aerea")) return "aerea";
    if (lbl.includes("bambini")) return "bambini";
    if (lbl.includes("adulti")) return "adulti";
    return "privata";
  };

  const getCountFromWallet = (id: number | "") => {
    if (!id || !walletTypes) return 10;
    const w = walletTypes.find(x => x.id === id);
    if (!w) return 10;
    const match = w.label.match(/(\d+)/);
    return match ? parseInt(match[1]) : 10;
  };

  const category = getCategoryFromWallet(walletTypeId);
  const courseCount = getCountFromWallet(walletTypeId);

  const priceSuggestion = usePriceFromMatrix({
    category,
    courseCount,
    groupSize: parseInt(groupSize),
    locationType,
    enabled: !!walletTypeId
  });

  const calc = useCheckoutCalculator();

  const handleCalculatePromo = () => {
    const suggestedPrice = priceSuggestion.finalPrice;
    calc.setItems([{
      type: "carnet",
      category,
      courseCount,
      walletTypeId: walletTypeId === "" ? undefined : parseInt(walletTypeId as string),
      quantity: 1,
      groupSize: parseInt(groupSize),
      locationType
    }]);
  };

  const calculateFinalToDisplay = () => {
    if (manualTotal !== "") return manualTotal;
    if (calc.result?.finalTotal !== undefined && calc.result.finalTotal > 0) return calc.result.finalTotal.toString();
    if (priceSuggestion.finalPrice > 0) return priceSuggestion.finalPrice.toString();
    return "";
  };

  const checkoutMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/checkout/complete", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Carnet creato", description: `${courseCount} unità attive registrate.` });
      queryClient.invalidateQueries({ queryKey: ["/api/carnet-wallets"] });
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Errore (404)", description: "Endpoint checkout/complete non ancora disponibile.", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setMemberId("");
    setWalletTypeId("");
    setInstructorId("");
    setGroupSize("1");
    setLocationType("in_sede");
    setExpiryDays(90);
    setPaymentMethodId("");
    setManualTotal("");
    calc.setPromoCode("");
    calc.setItems([]);
  };

  const onSubmit = () => {
    checkoutMutation.mutate({
      type: "carnet",
      memberId: parseInt(memberId),
      walletTypeId: walletTypeId ? parseInt(walletTypeId as string) : null,
      instructorId: instructorId ? parseInt(instructorId) : null,
      groupSize: parseInt(groupSize),
      locationType,
      expiryDays,
      paymentMethodId: paymentMethodId ? parseInt(paymentMethodId) : null,
      promoCode: calc.promoCode,
      totalAmount: parseFloat(calculateFinalToDisplay()) || 0
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
          <Layers className="w-4 h-4 mr-2" /> Nuovo Carnet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Emissione Nuovo Carnet</DialogTitle>
          <DialogDescription>Crea un carnet prepagato per un allievo simulando il prezzo.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="col-span-2 space-y-2">
            <Label>Allievo</Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
              <SelectContent>
                {safeMembers.map((m: any) => (
                  <SelectItem key={m.id} value={m.id.toString()}>{m.firstName} {m.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipologia Carnet</Label>
            <Select value={walletTypeId.toString()} onValueChange={(v) => { setWalletTypeId(parseInt(v)); if (v.includes("affitto")) setExpiryDays(120); else setExpiryDays(90); }}>
              <SelectTrigger><SelectValue placeholder="Scegli..." /></SelectTrigger>
              <SelectContent>
                {walletTypes && Array.isArray(walletTypes) ? walletTypes.map((w: any) => (
                  <SelectItem key={w.id} value={w.id.toString()}>{w.label}</SelectItem>
                )) : null}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Maestro</Label>
            <Select value={instructorId} onValueChange={setInstructorId}>
              <SelectTrigger><SelectValue placeholder="Maestro referenziato" /></SelectTrigger>
              <SelectContent>
                {safeInstructors.map((i: any) => (
                  <SelectItem key={i.id} value={i.id.toString()}>{i.firstName} {i.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Dimensione Gruppo</Label>
            <Select value={groupSize} onValueChange={setGroupSize}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Singolo (1)</SelectItem>
                <SelectItem value="2">Coppia (2)</SelectItem>
                <SelectItem value="3">Gruppo (3+)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Scadenza (Giorni)</Label>
            <Input type="number" value={expiryDays} onChange={e => setExpiryDays(parseInt(e.target.value) || 0)} />
          </div>

          <div className="col-span-2 space-y-2">
            <Label>Ambiente Erogazione</Label>
            <div className="flex gap-2">
              <Button type="button" variant={locationType === "in_sede" ? "default" : "outline"} onClick={() => setLocationType("in_sede")} className="flex-1">In Sede</Button>
              <Button type="button" variant={locationType === "domicilio" ? "default" : "outline"} onClick={() => setLocationType("domicilio")} className="flex-1">A Domicilio</Button>
              <Button type="button" variant={locationType === "studio_personal" ? "default" : "outline"} onClick={() => setLocationType("studio_personal")} className="flex-1">Studio Personal</Button>
            </div>
          </div>

          <div className="col-span-2 bg-slate-50 p-4 rounded-lg flex items-center justify-between border">
            <div className="space-y-1">
              <span className="text-sm font-semibold">Prezzo Suggerito (Matrix):</span>
              <div className="text-xs text-slate-500">{priceSuggestion.isLoading ? "Calcolo..." : priceSuggestion.note || "Nessuna regola applicata"}</div>
            </div>
            <div className="text-xl font-bold font-mono">
              {priceSuggestion.isLoading ? "..." : `€${priceSuggestion.finalPrice}`}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex justify-between items-center text-xs">
              Codice Promo <Button variant="link" size="sm" className="h-4 p-0" onClick={handleCalculatePromo}>Applica promo</Button>
            </Label>
            <Input placeholder="Es: STARTVER10" value={calc.promoCode} onChange={e => calc.setPromoCode(e.target.value.toUpperCase())} />
          </div>

          <div className="space-y-2">
            <Label>Metodo di Pagamento</Label>
            <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
              <SelectTrigger><SelectValue placeholder="Come ha pagato?" /></SelectTrigger>
              <SelectContent>
                {paymentMethods && Array.isArray(paymentMethods) ? paymentMethods.map((p: any) => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.label}</SelectItem>
                )) : null}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-2 mt-2">
            <Label>Totale da incassare (€) - Modificabile</Label>
            <div className="flex relative">
              <Input 
                type="number" 
                className="font-bold text-lg h-12 bg-green-50 border-green-200" 
                value={calculateFinalToDisplay()} 
                onChange={e => setManualTotal(e.target.value)} 
              />
              {calc.isLoading && <Loader2 className="w-5 h-5 absolute right-3 top-3 animate-spin text-green-600" />}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annulla</Button>
          <Button onClick={onSubmit} disabled={!memberId || !walletTypeId || checkoutMutation.isPending}>
            {checkoutMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Registra e Incassa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
