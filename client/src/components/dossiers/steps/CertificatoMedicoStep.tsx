import React, { useState, useEffect } from "react";
import { Stethoscope } from "lucide-react";
import { WizardStep } from "../WizardStep";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileUploadInput } from "@/components/shared/FileUploadInput";
import { useMascheraStore } from "@/lib/stores/mascheraStore";

interface CertificatoMedicoStepProps {
  isActive: boolean;
  wizard: any;
}

export function CertificatoMedicoStep({ isActive, wizard }: CertificatoMedicoStepProps) {
  const [localData, setLocalData] = useState({
    dataScadenza: "",
    dataRinnovo: "",
  });
  const [localErrors, setLocalErrors] = useState("");
  const formData = useMascheraStore(state => state.formData);

  useEffect(() => {
    wizard.updateStepData('certificatoMedico', localData);
  }, [localData, wizard.updateStepData]);

  const handleChange = (field: string, value: string) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // Basic frontend validation
    if (!localData.dataScadenza) {
      setLocalErrors("La data di scadenza del certificato è obbligatoria per proseguire.");
      return;
    }
    setLocalErrors("");
    wizard.advanceStep();
  };

  if (!isActive) return null;

  const memberId = wizard.dossier?.member_id || (formData as any).id;

  return (
    <WizardStep
      title="Certificato Medico"
      icon={Stethoscope}
      isActive={isActive}
      onSave={() => wizard.saveStepBozza()}
      onNext={handleNext}
      onPrev={wizard.goBack}
      blockingErrors={wizard.blockingErrors['certificatoMedico'] || localErrors}
      lastSavedAt={wizard.lastSavedAt}
      isDirty={wizard.isDirty}
      isValidating={wizard.isValidating}
    >
      <div className="space-y-6">
        <div className="text-sm text-muted-foreground mb-4">
          Carica il certificato medico e inserisci la data di scadenza.
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label>Data Scadenza Certificato <span className="text-red-500">*</span></Label>
            <Input 
              type="date" 
              value={localData.dataScadenza} 
              onChange={(e) => handleChange('dataScadenza', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Data di Rinnovo</Label>
            <Input 
              type="date" 
              value={localData.dataRinnovo} 
              onChange={(e) => handleChange('dataRinnovo', e.target.value)} 
            />
          </div>
        </div>

        <div className="border border-dashed p-6 rounded-md bg-muted/5">
          <h4 className="text-sm font-semibold mb-4">Upload File Certificato</h4>
          {memberId ? (
            <FileUploadInput
              endpoint="/api/uploads/medical-certificate"
              extraFields={{ memberId, category: "certificato" }}
              buttonText="Trascina qui il file PDF o JPG del certificato"
              maxSizeMB={5}
              accept="application/pdf,image/jpeg,image/png"
              onUploadComplete={(fileUrl: string) => wizard.updateStepData('certificatoMedico', { fileUrl })}
            />
          ) : (
            <div className="text-sm text-muted-foreground italic">
              Devi salvare prima l'anagrafica per poter caricare file.
            </div>
          )}
        </div>
      </div>
    </WizardStep>
  );
}
