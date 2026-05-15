import React, { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import { WizardStep } from "../WizardStep";
import { FileUploadInput } from "@/components/shared/FileUploadInput";
import { useMascheraStore } from "@/lib/stores/mascheraStore";

interface DocumentiStepProps {
  isActive: boolean;
  wizard: any;
}

export function DocumentiStep({ isActive, wizard }: DocumentiStepProps) {
  const [localErrors, setLocalErrors] = useState("");
  const formData = useMascheraStore(state => state.formData);

  const handleNext = () => {
    wizard.advanceStep();
  };

  if (!isActive) return null;

  const memberId = wizard.dossier?.member_id || (formData as any).id;

  return (
    <WizardStep
      title="Documenti"
      icon={FileText}
      isActive={isActive}
      onSave={() => wizard.saveStepBozza()}
      onNext={handleNext}
      onPrev={wizard.goBack}
      blockingErrors={wizard.blockingErrors['documenti'] || localErrors}
      lastSavedAt={wizard.lastSavedAt}
      isDirty={wizard.isDirty}
      isValidating={wizard.isValidating}
    >
      <div className="space-y-6">
        <div className="text-sm text-muted-foreground mb-4">
          Carica i documenti opzionali e i moduli firmati (privacy, regolamento).
        </div>
        
        <div className="border border-dashed p-6 rounded-md bg-muted/5">
          <h4 className="text-sm font-semibold mb-4">Modulo Privacy</h4>
          {memberId ? (
            <FileUploadInput
              endpoint="/api/uploads/attachments"
              extraFields={{ memberId, category: "privacy" }}
              buttonText="Trascina qui il modulo privacy firmato"
              maxSizeMB={5}
              accept="application/pdf"
              onUploadComplete={(fileUrl: string) => wizard.updateStepData('documenti', { privacyUrl: fileUrl })}
            />
          ) : (
            <div className="text-sm text-muted-foreground italic">
              Devi salvare prima l'anagrafica per poter caricare file.
            </div>
          )}
        </div>

        <div className="border border-dashed p-6 rounded-md bg-muted/5 mt-4">
          <h4 className="text-sm font-semibold mb-4">Altri Allegati</h4>
          {memberId ? (
            <FileUploadInput
              endpoint="/api/uploads/attachments"
              extraFields={{ memberId, category: "generico" }}
              buttonText="Trascina qui altri documenti utili"
              maxSizeMB={10}
              accept="application/pdf,image/jpeg,image/png"
              onUploadComplete={(fileUrl: string) => {
                // In un app reale salveremmo un array di fileUrl
                wizard.updateStepData('documenti', { lastUploadUrl: fileUrl });
              }}
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
