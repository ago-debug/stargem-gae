import React, { useState, useEffect } from "react";
import { IdCard } from "lucide-react";
import { WizardStep } from "../WizardStep";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TesseramentoStepProps {
  isActive: boolean;
  wizard: any;
}

export function TesseramentoStep({ isActive, wizard }: TesseramentoStepProps) {
  const [localData, setLocalData] = useState({
    membershipType: "NUOVO",
    seasonCompetence: "CORRENTE",
    quota: "",
  });

  const [localErrors, setLocalErrors] = useState("");

  useEffect(() => {
    wizard.updateStepData('tesseramento', localData);
  }, [localData, wizard.updateStepData]);

  const handleChange = (field: string, value: string) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // Basic frontend validation if needed. Backend will do the hard-block.
    if (!localData.membershipType || !localData.seasonCompetence) {
      setLocalErrors("Compila i campi obbligatori per procedere.");
      return;
    }
    setLocalErrors("");
    wizard.advanceStep();
  };

  if (!isActive) return null;

  return (
    <WizardStep
      title="Tesseramento"
      icon={IdCard}
      isActive={isActive}
      onSave={() => wizard.saveStepBozza()}
      onNext={handleNext}
      onPrev={wizard.goBack}
      blockingErrors={wizard.blockingErrors['tesseramento'] || localErrors}
      lastSavedAt={wizard.lastSavedAt}
      isDirty={wizard.isDirty}
      isValidating={wizard.isValidating}
    >
      <div className="space-y-6">
        <div className="text-sm text-muted-foreground mb-4">
          Definisci la quota associativa e il tipo di tesseramento per questa pratica.
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Tipo <span className="text-red-500">*</span></Label>
            <Select 
              value={localData.membershipType} 
              onValueChange={(val) => handleChange('membershipType', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NUOVO">Nuovo</SelectItem>
                <SelectItem value="RINNOVO">Rinnovo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Competenza <span className="text-red-500">*</span></Label>
            <Select 
              value={localData.seasonCompetence} 
              onValueChange={(val) => handleChange('seasonCompetence', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona Competenza" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CORRENTE">Corrente</SelectItem>
                <SelectItem value="SUCCESSIVA">Successiva</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Quota Tessera (€)</Label>
            <Input 
              type="number" 
              value={localData.quota} 
              onChange={(e) => handleChange('quota', e.target.value)} 
              placeholder="Es. 35.00"
            />
          </div>
        </div>
      </div>
    </WizardStep>
  );
}
