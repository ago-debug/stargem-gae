import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface DossierState {
  id?: number;
  member_id?: number;
  dossier_type?: string;
  status?: string;
  data: Record<string, any>;
}

interface UseDossierWizardProps {
  initialDossier?: DossierState;
  steps: string[];
  onFinish?: () => void;
}

export function useDossierWizard({ initialDossier, steps, onFinish }: UseDossierWizardProps) {
  const [dossier, setDossier] = useState<DossierState | undefined>(initialDossier);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [dossierData, setDossierData] = useState<Record<string, any>>(initialDossier?.data || {});
  const [isValidating, setIsValidating] = useState(false);
  const [blockingErrors, setBlockingErrors] = useState<Record<string, string>>({});
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentStep = steps[currentStepIndex];

  // API Calls
  const createMutation = useMutation({
    mutationFn: async (payload: { member_id: number; dossier_type: string; extra_data?: any }) => {
      const res = await fetch('/api/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      setDossier(data);
      queryClient.invalidateQueries({ queryKey: ['/api/dossiers'] });
    }
  });

  const saveStepMutation = useMutation({
    mutationFn: async (payload: { status: 'pending' | 'completed'; stepName: string }) => {
      if (!dossier?.id) return;
      const res = await fetch(`/api/dossiers/${dossier.id}/step`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step_name: payload.stepName,
          status: payload.status,
          step_data: dossierData[payload.stepName] || {}
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      setLastSavedAt(new Date());
      setIsDirty(false);
    }
  });

  const completeDossierMutation = useMutation({
    mutationFn: async () => {
      if (!dossier?.id) return;
      const res = await fetch(`/api/dossiers/${dossier.id}/complete`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dossiers'] });
      toast({ title: "Pratica completata con successo!" });
      if (onFinish) onFinish();
    }
  });

  const cancelDossierMutation = useMutation({
    mutationFn: async () => {
      if (!dossier?.id) return;
      const res = await fetch(`/api/dossiers/${dossier.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dossiers'] });
    }
  });

  const checkRequirementsMutation = useMutation({
    mutationFn: async () => {
      if (!dossier?.id) return { isValid: true };
      const res = await fetch(`/api/dossiers/${dossier.id}/required-steps`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }
  });

  // Actions
  const createDossier = async (member_id: number, dossier_type: string, extra_data?: any) => {
    return createMutation.mutateAsync({ member_id, dossier_type, extra_data });
  };

  const updateStepData = useCallback((stepName: string, partialData: any) => {
    setDossierData(prev => ({
      ...prev,
      [stepName]: { ...prev[stepName], ...partialData }
    }));
    setIsDirty(true);
  }, []);

  const saveStepBozza = useCallback(async () => {
    if (!currentStep || !isDirty || !dossier?.id) return;
    try {
      await saveStepMutation.mutateAsync({ status: 'pending', stepName: currentStep });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Errore salvataggio", description: e.message });
    }
  }, [currentStep, isDirty, dossier?.id, saveStepMutation, toast]);

  const completeStep = async (stepName: string) => {
    setIsValidating(true);
    try {
      // Potenziale controllo backend prima di completare
      await saveStepMutation.mutateAsync({ status: 'completed', stepName });
      setIsValidating(false);
      return true;
    } catch (e: any) {
      setBlockingErrors({ ...blockingErrors, [stepName]: e.message });
      setIsValidating(false);
      return false;
    }
  };

  const canAdvance = () => {
    return !blockingErrors[currentStep];
  };

  const advanceStep = async () => {
    if (!canAdvance()) return;
    
    const success = await completeStep(currentStep);
    if (success) {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      } else {
        await finalCompleteDossier();
      }
    }
  };

  const goBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const finalCompleteDossier = async () => {
    try {
      await completeDossierMutation.mutateAsync();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Errore completamento", description: e.message });
    }
  };

  const cancelDossier = async () => {
    if (confirm("Sei sicuro di voler annullare questa pratica?")) {
      try {
        await cancelDossierMutation.mutateAsync();
        toast({ title: "Pratica annullata" });
      } catch (e: any) {
        toast({ variant: "destructive", title: "Errore cancellazione", description: e.message });
      }
    }
  };

  // Autosave
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirty) {
        saveStepBozza();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isDirty, saveStepBozza]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveStepBozza();
      }
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        advanceStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveStepBozza, advanceStep]);

  // Prevent leaving dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return {
    dossier,
    currentStep,
    currentStepIndex,
    dossierData,
    isValidating,
    blockingErrors,
    lastSavedAt,
    isDirty,
    createDossier,
    updateStepData,
    saveStepBozza,
    completeStep,
    canAdvance,
    advanceStep,
    goBack,
    finalCompleteDossier,
    cancelDossier,
    setCurrentStepIndex,
    setBlockingErrors
  };
}
