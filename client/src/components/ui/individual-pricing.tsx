import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { useQuery } from "@tanstack/react-query";
import { Member } from "@shared/schema";

export function IndividualPricing({ formData, updateForm, membersList }: { formData: any, updateForm: (k: string, v: any) => void, membersList: Member[] }) {
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [hasTessera, setHasTessera] = useState(true);

  // MOCK: Per ora mettiamo prezzi base statici. Verranno potenziati.
  const BASE_PRICE_SINGLE = 50;
  const BASE_PRICE_COUPLE = 80;
  const BASE_PRICE_GROUP_PER_PERSON = 30;

  // Usa i field: member1Id, member2Id, numberOfPeople
  useEffect(() => {
    if (isManualOverride) return;

    let numPeople = 0;
    if (formData.numberOfPeople && formData.numberOfPeople !== "none") {
      numPeople = parseInt(formData.numberOfPeople) || 0;
    } else {
      if (formData.member1Id && formData.member1Id !== "none") numPeople++;
      if (formData.member2Id && formData.member2Id !== "none") numPeople++;
    }

    let basePrice = 0;
    if (numPeople === 1) basePrice = BASE_PRICE_SINGLE;
    else if (numPeople === 2) basePrice = BASE_PRICE_COUPLE;
    else if (numPeople > 2) basePrice = BASE_PRICE_GROUP_PER_PERSON * numPeople;

    // Check if member1 has Tessera
    let tesserato = true;
    if (formData.member1Id && formData.member1Id !== "none") {
      const m1 = membersList.find(m => m.id === formData.member1Id);
      // Supponiamo che se l'allievo ha una categoria "Non Tesserato", o simile. 
      // Per l'MVP usiamo uno stato fittizio basato sui campi, o un check su memberships (se precaricato).
      if (m1 && m1.categoryId === null) {
          // just a mock check for "non tesserato"
          tesserato = false; 
      }
    }
    setHasTessera(tesserato);

    const finalPrice = tesserato ? basePrice : basePrice * 1.22;
    setCalculatedPrice(finalPrice);
    
    // Auto-update price if not manual
    updateForm("price", finalPrice.toFixed(2));

  }, [formData.member1Id, formData.member2Id, formData.numberOfPeople, isManualOverride, membersList]);

  // Caricamento dei pacchetti reali dell'utente
  const { data: memberPackages } = useQuery({
    queryKey: ["/api/member-packages", formData.member1Id],
    enabled: !!formData.member1Id && formData.member1Id !== "none",
  });

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <Label className="text-slate-800 font-bold text-lg">Calcolo Prezzo e Pacchetti</Label>
        <div className="flex items-center gap-2">
          <Checkbox id="manual-override" checked={isManualOverride} onCheckedChange={(c) => setIsManualOverride(!!c)} />
          <Label htmlFor="manual-override" className="text-sm font-normal">Preventivo Manuale</Label>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 border rounded-md">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="font-semibold">Prezzo Finale (€)</Label>
            {!hasTessera && <Badge variant="destructive" className="text-[10px]">INCL. IVA 22% (Non Tesserato)</Badge>}
          </div>
          <Input 
            type="number" 
            step="0.01" 
            min="0" 
            value={formData.price || ""} 
            onChange={e => {
                setIsManualOverride(true);
                updateForm("price", e.target.value);
            }} 
            disabled={!isManualOverride}
            className={`text-lg font-bold ${!isManualOverride ? "bg-slate-100" : "bg-white border-blue-400"}`}
          />
        </div>

        <div className="space-y-3">
          <Label className="font-semibold text-slate-800">Scelta Pacchetto Pre-Pagato</Label>
          <Combobox
            name="packageSingle"
            value={formData.packageSingle || "none"}
            onValueChange={(val) => updateForm("packageSingle", val === "none" ? null : val)}
            options={[
              {value: "none", label: "Nessun pacchetto usato"},
              ...((memberPackages as any[]) || []).filter((p: any) => p.active && p.usedUses < p.totalUses).map((p: any) => ({ 
                value: p.packageCode, 
                label: `${p.packageCode} (${p.packageType}) - Restanti: ${p.totalUses - p.usedUses}` 
              }))
            ]}
            placeholder="Seleziona..."
          />
          <p className="text-xs text-muted-foreground">Selezionando un pacchetto, al salvataggio verrà scalato un ingresso e il costo della prenotazione sarà azzerato.</p>
        </div>
      </div>
    </div>
  );
}
