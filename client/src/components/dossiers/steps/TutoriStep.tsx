import React, { useState, useEffect } from "react";
import { Users, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { WizardStep } from "../WizardStep";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useMascheraStore } from "@/lib/stores/mascheraStore";

interface TutoriStepProps {
  isActive: boolean;
  wizard: any;
}

export function TutoriStep({ isActive, wizard }: TutoriStepProps) {
  const formData = useMascheraStore(state => state.formData);
  const handleChange = useMascheraStore(state => state.handleChange);
  const [localErrors, setLocalErrors] = useState<string>("");

  const etaNum = parseInt(formData.eta || '0', 10);
  const isMinorenne = etaNum > 0 && etaNum < 18;

  useEffect(() => {
    // If not minorenne, skip this step immediately when active
    if (isActive && !isMinorenne) {
      // Automatic advance if not required?
      // For now we just don't render it or show a message.
      // But usually skipped steps are handled by useDossierWizard filtering the steps array.
    }
  }, [isActive, isMinorenne]);

  // Sync data
  useEffect(() => {
    wizard.updateStepData('tutori', {
      cognomeGen1: formData.cognomeGen1,
      nomeGen1: formData.nomeGen1,
      cfGen1: formData.cfGen1,
      cognomeGen2: formData.cognomeGen2,
      nomeGen2: formData.nomeGen2,
      cfGen2: formData.cfGen2,
    });
  }, [
    formData.cognomeGen1, formData.nomeGen1, formData.cfGen1,
    formData.cognomeGen2, formData.nomeGen2, formData.cfGen2,
    wizard.updateStepData
  ]);

  const handleNext = () => {
    if (isMinorenne) {
      if (!formData.cognomeGen1 || !formData.nomeGen1 || !formData.cfGen1) {
        setLocalErrors("Almeno un genitore/tutore (Genitore 1) è obbligatorio per i minorenni.");
        return;
      }
    }
    setLocalErrors("");
    wizard.advanceStep();
  };

  const getInputClassName = (field: string, isRequired?: boolean) => {
    const isMissing = isRequired && !formData[field as keyof typeof formData];
    return `w-full transition-colors focus:ring-2 focus:ring-offset-1 ${
      isMissing 
        ? "border-red-400 focus:border-red-500 focus:ring-red-200 dark:border-red-800 dark:focus:ring-red-900" 
        : "focus:border-primary focus:ring-primary/20"
    }`;
  };

  if (!isActive) return null;

  if (!isMinorenne) {
    return (
      <WizardStep
        title="Genitori"
        icon={Users}
        isActive={isActive}
        onSave={() => wizard.saveStepBozza()}
        onNext={() => wizard.advanceStep()}
        onPrev={wizard.goBack}
        lastSavedAt={wizard.lastSavedAt}
        isDirty={wizard.isDirty}
      >
        <div className="p-4 bg-muted text-muted-foreground rounded-md text-center">
          Questo step non è richiesto in quanto l'iscritto è maggiorenne.
        </div>
      </WizardStep>
    );
  }

  return (
    <WizardStep
      title="Genitori"
      icon={Users}
      isActive={isActive}
      onSave={() => wizard.saveStepBozza()}
      onNext={handleNext}
      onPrev={wizard.goBack}
      blockingErrors={wizard.blockingErrors['tutori'] || localErrors}
      lastSavedAt={wizard.lastSavedAt}
      isDirty={wizard.isDirty}
      isValidating={wizard.isValidating}
    >
      <div className="space-y-6">
        <div>
          <h3 className="inline-block text-sm font-medium px-3 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-200 mb-4">
            Genitore 1 (Obbligatorio)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Cognome <span className="text-red-500 ml-1">*</span></Label>
              <Input value={formData.cognomeGen1} onChange={(e) => handleChange("cognomeGen1", e.target.value)} className={getInputClassName("cognomeGen1", true)} />
            </div>
            <div className="space-y-2">
              <Label>Nome <span className="text-red-500 ml-1">*</span></Label>
              <Input value={formData.nomeGen1} onChange={(e) => handleChange("nomeGen1", e.target.value)} className={getInputClassName("nomeGen1", true)} />
            </div>
            <div className="space-y-2">
              <Label>Codice Fiscale <span className="text-red-500 ml-1">*</span></Label>
              <Input value={formData.cfGen1} onChange={(e) => handleChange("cfGen1", e.target.value.toUpperCase())} className={getInputClassName("cfGen1", true)} />
            </div>
            <div className="space-y-2">
              <Label>Telefono <span className="text-red-500 ml-1">*</span></Label>
              <Input value={formData.telGen1} onChange={(e) => handleChange("telGen1", e.target.value)} className={getInputClassName("telGen1", true)} />
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-red-500 ml-1">*</span></Label>
              <Input value={formData.emailGen1} onChange={(e) => handleChange("emailGen1", e.target.value)} className={getInputClassName("emailGen1", true)} />
            </div>
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-border">
          <h3 className="inline-block text-sm font-medium px-3 py-1 bg-slate-100 text-slate-800 rounded-full border border-slate-200 mb-4">
            Genitore 2 (Opzionale)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Cognome</Label>
              <Input value={formData.cognomeGen2} onChange={(e) => handleChange("cognomeGen2", e.target.value)} className={getInputClassName("cognomeGen2", false)} />
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={formData.nomeGen2} onChange={(e) => handleChange("nomeGen2", e.target.value)} className={getInputClassName("nomeGen2", false)} />
            </div>
            <div className="space-y-2">
              <Label>Codice Fiscale</Label>
              <Input value={formData.cfGen2} onChange={(e) => handleChange("cfGen2", e.target.value.toUpperCase())} className={getInputClassName("cfGen2", false)} />
            </div>
            <div className="space-y-2">
              <Label>Telefono</Label>
              <Input value={formData.telGen2} onChange={(e) => handleChange("telGen2", e.target.value)} className={getInputClassName("telGen2", false)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={formData.emailGen2} onChange={(e) => handleChange("emailGen2", e.target.value)} className={getInputClassName("emailGen2", false)} />
            </div>
          </div>
        </div>
      </div>
    </WizardStep>
  );
}
