import React, { useState } from "react";
import { User, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { WizardStep } from "../WizardStep";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConflictBadge } from "@/components/conflict-badge";
import { useMascheraStore } from "@/lib/stores/mascheraStore";
import { useCFCheck, useEmailCheck, usePhoneCheck } from "@/hooks/useFieldConflictCheck";
import { parseFiscalCode, getPlaceDetails } from "@/lib/fiscalCodeUtils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TabTutori } from "../../crm/TabTutori";

interface AnagraficaStepProps {
  isActive: boolean;
  wizard: any; // Return type of useDossierWizard
}

export function AnagraficaStep({ isActive, wizard }: AnagraficaStepProps) {
  const formData = useMascheraStore(state => state.formData);
  const handleChange = useMascheraStore(state => state.handleChange);
  const [localErrors, setLocalErrors] = useState<string>("");

  const isMinor = parseInt(formData.eta || '18', 10) < 18;
  const cfCheck = useCFCheck(formData.codiceFiscale, undefined);
  const emailCheck = useEmailCheck(formData.email, isMinor, undefined);
  const phoneCheck = usePhoneCheck(formData.telefono, isMinor, undefined);

  // Sync formData with wizard state implicitly or explicitly when saving
  React.useEffect(() => {
    wizard.updateStepData('anagrafica', formData);
  }, [formData, wizard.updateStepData]);

  // Autofill da Codice Fiscale
  React.useEffect(() => {
    if (formData.codiceFiscale && formData.codiceFiscale.length === 16) {
      const parsed = parseFiscalCode(formData.codiceFiscale);
      if (parsed) {
        if (parsed.dateOfBirth && !formData.dataNascita) handleChange("dataNascita", parsed.dateOfBirth, true);
        if (parsed.gender && !formData.sesso) handleChange("sesso", parsed.gender, true);
        if (parsed.placeOfBirth) {
           if (!formData.codComune) handleChange("codComune", parsed.placeOfBirth, true);
           const details = getPlaceDetails(parsed.placeOfBirth);
           if (details) {
             if (!formData.luogoNascita) handleChange("luogoNascita", details.city, true);
             if (!formData.provinciaNascita) handleChange("provinciaNascita", details.province, true);
           }
        }
      }
    }
  }, [formData.codiceFiscale]);

  const handleNext = () => {
    // Validate required fields
    const required = ["nome", "cognome", "codiceFiscale", "telefono", "email", "indirizzo", "cap", "codComune", "citta", "provincia", "dataNascita", "luogoNascita", "provinciaNascita", "sesso"];
    const missing = required.filter(field => !formData[field as keyof typeof formData]);
    
    if (missing.length > 0) {
      setLocalErrors(`Campi obbligatori mancanti: ${missing.join(", ")}`);
      return;
    }
    
    if (cfCheck && cfCheck.conflict) {
      setLocalErrors("Codice Fiscale già presente a sistema.");
      return;
    }
    
    setLocalErrors("");
    wizard.advanceStep();
  };

  const renderMancaDato = (val: string | undefined | null) => {
    if (!val) return <div className="absolute right-3 top-2.5 text-[10px] text-red-500 font-bold bg-white/80 dark:bg-black/80 px-1 rounded">MANCA</div>;
    return null;
  };

  const getInputClassName = (field: string, isRequired?: boolean) => {
    const isMissing = isRequired && !formData[field as keyof typeof formData];
    return `w-full transition-colors focus:ring-2 focus:ring-offset-1 ${
      isMissing 
        ? "border-red-400 focus:border-red-500 focus:ring-red-200 dark:border-red-800 dark:focus:ring-red-900" 
        : "focus:border-primary focus:ring-primary/20"
    }`;
  };

  const [expandedAccordions, setExpandedAccordions] = useState<string[]>([]);

  return (
    <WizardStep
      title="Anagrafica"
      icon={User}
      isActive={isActive}
      onSave={() => wizard.saveStepBozza()}
      onNext={handleNext}
      onPrev={wizard.goBack}
      blockingErrors={wizard.blockingErrors['anagrafica'] || localErrors}
      lastSavedAt={wizard.lastSavedAt}
      isDirty={wizard.isDirty}
      isValidating={wizard.isValidating}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center">Cognome <span className="text-red-500 ml-1">*</span></Label>
              <div className="relative">
                <Input value={formData.cognome} onChange={(e) => handleChange("cognome", e.target.value)} className={getInputClassName("cognome", true)} />
                {renderMancaDato(formData.cognome)}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center">Nome <span className="text-red-500 ml-1">*</span></Label>
              <div className="relative">
                <Input value={formData.nome} onChange={(e) => handleChange("nome", e.target.value)} className={getInputClassName("nome", true)} />
                {renderMancaDato(formData.nome)}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Codice Fiscale <span className="text-red-500 ml-1">*</span>
                <a href="/generatore-cf-stranieri" target="_blank" rel="noopener noreferrer" title="Attenzione, per gli stranieri senza codice fiscale clicca qui" className="text-destructive hover:text-destructive700 transition-colors">
                  <AlertTriangle className="w-4 h-4 cursor-pointer" />
                </a>
              </Label>
              <div className="relative">
                <Input
                  value={formData.codiceFiscale}
                  onChange={(e) => handleChange("codiceFiscale", e.target.value.toUpperCase())}
                  className={getInputClassName("codiceFiscale", true)}
                />
                {renderMancaDato(formData.codiceFiscale)}
                <ConflictBadge result={cfCheck} type="cf" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label className="flex items-center">Telefono <span className="text-red-500 ml-1">*</span></Label>
              </div>
              <div className="relative">
                <Input
                  value={formData.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                  className={getInputClassName("telefono", true)}
                />
                {renderMancaDato(formData.telefono)}
                <ConflictBadge result={phoneCheck} type="telefono" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label className="flex items-center">Email <span className="text-red-500 ml-1">*</span></Label>
              </div>
              <div className="relative">
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={getInputClassName("email", true)}
                />
                {renderMancaDato(formData.email)}
                <ConflictBadge result={emailCheck} type="email" />
              </div>
            </div>
        </div>

        {/* Indirizzo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2 lg:col-span-2">
            <Label>Indirizzo di Residenza <span className="text-red-500 ml-1">*</span></Label>
            <div className="relative">
              <Input value={formData.indirizzo} onChange={(e) => handleChange("indirizzo", e.target.value)} className={getInputClassName("indirizzo", true)} />
              {renderMancaDato(formData.indirizzo)}
            </div>
          </div>
          <div className="space-y-2">
            <Label>CAP <span className="text-red-500 ml-1">*</span></Label>
            <div className="relative">
              <Input value={formData.cap} onChange={(e) => handleChange("cap", e.target.value)} className={getInputClassName("cap", true)} />
              {renderMancaDato(formData.cap)}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Cod. Comune <span className="text-red-500 ml-1">*</span></Label>
            <div className="relative">
              <Input value={formData.codComune} onChange={(e) => handleChange("codComune", e.target.value)} className={getInputClassName("codComune", true)} />
              {renderMancaDato(formData.codComune)}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Città <span className="text-red-500 ml-1">*</span></Label>
            <div className="relative">
              <Input value={formData.citta} onChange={(e) => handleChange("citta", e.target.value)} className={getInputClassName("citta", true)} />
              {renderMancaDato(formData.citta)}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Provincia <span className="text-red-500 ml-1">*</span></Label>
            <div className="relative">
              <Input value={formData.provincia} onChange={(e) => handleChange("provincia", e.target.value.toUpperCase())} maxLength={2} className={getInputClassName("provincia", true)} />
              {renderMancaDato(formData.provincia)}
            </div>
          </div>
        </div>

        {/* Nascita */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label>Data di Nascita <span className="text-red-500 ml-1">*</span></Label>
            <div className="relative">
              <Input type="date" value={formData.dataNascita} onChange={(e) => handleChange("dataNascita", e.target.value)} className={getInputClassName("dataNascita", true)} />
              {renderMancaDato(formData.dataNascita)}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Luogo di Nascita <span className="text-red-500 ml-1">*</span></Label>
            <div className="relative">
              <Input value={formData.luogoNascita} onChange={(e) => handleChange("luogoNascita", e.target.value)} className={getInputClassName("luogoNascita", true)} />
              {renderMancaDato(formData.luogoNascita)}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Provincia Nascita <span className="text-red-500 ml-1">*</span></Label>
            <div className="relative">
              <Input value={formData.provinciaNascita} onChange={(e) => handleChange("provinciaNascita", e.target.value.toUpperCase())} maxLength={2} className={getInputClassName("provinciaNascita", true)} />
              {renderMancaDato(formData.provinciaNascita)}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Sesso (M/F) <span className="text-red-500 ml-1">*</span></Label>
            <div className="relative">
              <Input value={formData.sesso} onChange={(e) => handleChange("sesso", e.target.value.toUpperCase())} maxLength={1} className={getInputClassName("sesso", true)} />
              {renderMancaDato(formData.sesso)}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Età</Label>
            <Input value={formData.eta} readOnly disabled className={`bg-transparent opacity-80 cursor-default ${getInputClassName("eta")}`} />
          </div>
        </div>
      </div>
    </WizardStep>
  );
}
