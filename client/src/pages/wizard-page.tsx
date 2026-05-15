import React, { useEffect, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { User, Users, Stethoscope, FileText, Banknote, IdCard } from "lucide-react";
import { WizardStepper, WizardStepDef } from "@/components/dossiers/WizardStepper";
import { useDossierWizard } from "@/hooks/useDossierWizard";
import { AnagraficaStep } from "@/components/dossiers/steps/AnagraficaStep";
import { TutoriStep } from "@/components/dossiers/steps/TutoriStep";
import { CertificatoMedicoStep } from "@/components/dossiers/steps/CertificatoMedicoStep";
import { DocumentiStep } from "@/components/dossiers/steps/DocumentiStep";
import { PagamentoStep } from "@/components/dossiers/steps/PagamentoStep";
import { TesseramentoStep } from "@/components/dossiers/steps/TesseramentoStep";

export default function WizardPage() {
  const [, params] = useRoute("/dossiers/:id/wizard");
  const [, setLocation] = useLocation();
  const dossierId = params?.id === "nuovo" ? null : parseInt(params?.id || "0", 10);

  // In a real app we fetch initial data if dossierId is present
  const { data: initialDossier, isLoading } = useQuery<any>({
    queryKey: [`/api/dossiers/${dossierId}`],
    enabled: !!dossierId,
  });

  // Basic step configuration for a standard enrollment
  const stepConfig = useMemo(() => [
    { name: "anagrafica", label: "Anagrafica", icon: User },
    { name: "tutori", label: "Genitori", icon: Users },
    { name: "certificatoMedico", label: "Cert. Medico", icon: Stethoscope },
    { name: "documenti", label: "Documenti", icon: FileText },
    { name: "pagamento", label: "Pagamento", icon: Banknote },
    { name: "tesseramento", label: "Tesseramento", icon: IdCard },
  ], []);

  const wizard = useDossierWizard({
    initialDossier: initialDossier || undefined,
    steps: stepConfig.map(s => s.name),
    onFinish: () => setLocation("/dashboard/dossiers"),
  });

  // Automatically create a new dossier if ID is "nuovo"
  useEffect(() => {
    if (params?.id === "nuovo" && !wizard.dossier?.id) {
      wizard.createDossier(0, 'iscrizione_corso').catch(console.error);
    }
  }, [params?.id, wizard.dossier?.id]);

  if (isLoading && !!dossierId) {
    return <div className="flex h-screen items-center justify-center">Caricamento Pratica...</div>;
  }

  // Costruisci props per WizardStepper
  const stepperSteps: WizardStepDef[] = stepConfig.map((s, index) => {
    let status: 'pending' | 'completed' | 'blocked' | 'current' = 'pending';
    
    if (index === wizard.currentStepIndex) {
      status = 'current';
    } else if (index < wizard.currentStepIndex) {
      status = 'completed';
    }
    
    if (wizard.blockingErrors[s.name]) {
      status = 'blocked';
    }

    return {
      name: s.name,
      label: s.label,
      icon: s.icon,
      status,
      blockingReason: wizard.blockingErrors[s.name]
    };
  });

  return (
    <div className="flex flex-col h-full bg-slate-50/50 min-h-screen">
      <div className="p-4 md:p-6 pb-24 max-w-5xl mx-auto w-full">
        <WizardStepper 
          steps={stepperSteps} 
          currentStepIndex={wizard.currentStepIndex} 
          onStepClick={(idx) => {
            if (idx < wizard.currentStepIndex) wizard.setCurrentStepIndex(idx);
          }}
        />

        <div className="mt-8">
          <AnagraficaStep isActive={wizard.currentStep === 'anagrafica'} wizard={wizard} />
          <TutoriStep isActive={wizard.currentStep === 'tutori'} wizard={wizard} />
          <CertificatoMedicoStep isActive={wizard.currentStep === 'certificatoMedico'} wizard={wizard} />
          <DocumentiStep isActive={wizard.currentStep === 'documenti'} wizard={wizard} />
          <PagamentoStep isActive={wizard.currentStep === 'pagamento'} wizard={wizard} />
          <TesseramentoStep isActive={wizard.currentStep === 'tesseramento'} wizard={wizard} />
        </div>
      </div>
    </div>
  );
}
