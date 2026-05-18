import React, { useState, useEffect } from "react";
import { Banknote, CreditCard, ShoppingCart } from "lucide-react";
import { WizardStep } from "../WizardStep";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { NuovoPagamentoModal as NuovoPagamentoModalMC3 } from "@/components/payments/NuovoPagamentoModal";

interface PagamentoStepProps {
  isActive: boolean;
  wizard: any;
}

export function PagamentoStep({ isActive, wizard }: PagamentoStepProps) {
  const [localData, setLocalData] = useState({
    paymentMethod: "contanti",
    importo: "0",
    note: "",
  });

  const [localErrors, setLocalErrors] = useState("");

  const { data: courses } = useQuery<any[]>({ queryKey: ["/api/courses"] });
  const { data: priceLists } = useQuery<any[]>({ queryKey: ["/api/price-lists"] });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    wizard.updateStepData('pagamento', localData);
  }, [localData, wizard.updateStepData]);

  const handleChange = (field: string, value: string) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // Validazione base
    if (parseFloat(localData.importo) <= 0) {
      // In un caso reale, potremmo permettere importo 0 per preventivi
      // ma per ora chiediamo almeno un input formale se c'è checkout.
    }
    setLocalErrors("");
    wizard.advanceStep();
  };

  if (!isActive) return null;

  return (
    <WizardStep
      title="Preventivatore e Pagamento"
      icon={Banknote}
      isActive={isActive}
      onSave={() => wizard.saveStepBozza()}
      onNext={handleNext}
      onPrev={wizard.goBack}
      blockingErrors={wizard.blockingErrors['pagamento'] || localErrors}
      lastSavedAt={wizard.lastSavedAt}
      isDirty={wizard.isDirty}
      isValidating={wizard.isValidating}
    >
      <div className="space-y-6">
        <div className="text-sm text-muted-foreground mb-4">
          Configura gli importi da saldare o registrare per questa pratica. In futuro, il payment_group_id sarà sincronizzato.
        </div>
        
        <div className="bg-muted/10 border border-dashed rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-5 h-5" />
            <h4 className="font-semibold">Riepilogo Carrello</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Importo da saldare ora (€)</Label>
              <Input 
                type="number" 
                value={localData.importo} 
                onChange={(e) => handleChange('importo', e.target.value)} 
                className="text-lg font-bold h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Metodo di Pagamento</Label>
              <Select 
                value={localData.paymentMethod} 
                onValueChange={(val) => handleChange('paymentMethod', val)}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Seleziona Metodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contanti">Contanti</SelectItem>
                  <SelectItem value="pos">POS / Carta</SelectItem>
                  <SelectItem value="bonifico">Bonifico</SelectItem>
                  <SelectItem value="assegno">Assegno</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Note / Riferimenti (es. TRN Bonifico)</Label>
              <Input 
                value={localData.note} 
                onChange={(e) => handleChange('note', e.target.value)} 
                className="h-12"
              />
            </div>
          </div>
        </div>
        
        <div className="text-sm text-amber-600 bg-amber-50 p-4 rounded-md border border-amber-200">
          Nota: L'integrazione completa della griglia listini (MC3) sostituirà temporaneamente la modale di checkout esistente in futuro.
          <div className="mt-4">
            <Button onClick={() => setIsModalOpen(true)} type="button" variant="default">
              + Registra Pagamento Completo
            </Button>
          </div>
        </div>

        <NuovoPagamentoModalMC3
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          defaultMemberId={wizard.memberId ? Number(wizard.memberId) : undefined}
          defaultAmount={parseFloat(localData.importo) || 0}
          defaultReason={localData.note}
        />
      </div>
    </WizardStep>
  );
}
