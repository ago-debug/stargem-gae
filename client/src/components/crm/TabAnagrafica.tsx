import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, AlertCircle, AlertTriangle, User, 
  Building2, GraduationCap, Share2, Wallet, Briefcase, Shirt 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ConflictBadge } from "@/components/conflict-badge";
import { useCrmForm } from "./CrmFormContext";
import { useMascheraStore } from "@/lib/stores/mascheraStore";
import { useCFCheck, useEmailCheck, usePhoneCheck } from "@/hooks/useFieldConflictCheck";
import { parseFiscalCode, getPlaceDetails } from "@/lib/fiscalCodeUtils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TabTutori } from "./TabTutori";

interface TabAnagraficaProps {
  renderMancaDato: (val: string | undefined | null) => React.ReactNode;
  getInputClassName: (field: string, isRequired?: boolean) => string;
}

export function TabAnagrafica({ renderMancaDato, getInputClassName }: TabAnagraficaProps) {
  // Zustand selectors: isolano i re-render solo a questa tab
  const formData = useMascheraStore(state => state.formData);
  const handleChange = useMascheraStore(state => state.handleChange);

  // Legacy Context fields
  const { 
    verificaStato, 
    avviaVerifica, 
    selectedMemberId,
    actionFromUrl
  } = useCrmForm();

  // Field validation checks
  const isNewOrDraft = !selectedMemberId || actionFromUrl === "new";
  const isMinor = parseInt(formData.eta || '18', 10) < 18;
  const cfCheck = useCFCheck(formData.codiceFiscale, isNewOrDraft ? undefined : selectedMemberId || undefined);
  const emailCheck = useEmailCheck(formData.email, isMinor, isNewOrDraft ? undefined : selectedMemberId || undefined);
  const phoneCheck = usePhoneCheck(formData.telefono, isMinor, isNewOrDraft ? undefined : selectedMemberId || undefined);

  const [expandedAccordions, setExpandedAccordions] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (selectedMemberId && actionFromUrl !== "new") {
      const toExpand: string[] = [];
      
      if (formData.cognomeGen1 || formData.cfGen1 || formData.cognomeGen2 || formData.cfGen2) toExpand.push("tutori");
            if (formData.companyName || formData.codiceFe) toExpand.push("fatturazione");
            if (formData.driveFolderUrl) toExpand.push("social");
      if (formData.bankName || formData.iban) toExpand.push("bancari");
      if (formData.mastroC || formData.mastroCol || formData.codiceCatastale) toExpand.push("legacy");
      
      setExpandedAccordions(toExpand);
    } else {
       const etaNum = parseInt(formData.eta || '0', 10);
       if (etaNum > 0 && etaNum < 18) {
         setExpandedAccordions(["tutori"]);
       } else {
         setExpandedAccordions([]);
       }
    }
  }, [selectedMemberId, actionFromUrl]);

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

  return (
    <Card className="flex-1">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 sidebar-icon-gold" />Utente</div>
          <span className="text-sm font-medium px-3 py-1 bg-amber-100 dark:bg-amber-900/30 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 dark:text-amber-200 rounded-full border border-amber-200 dark:border-amber-900/50 dark:border-amber-800/60">
            Dati Personali
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
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
                <span
                  className="ml-1 cursor-help"
                  title={verificaStato.telefono ? "Verificato" : "Da verificare - clicca il bottone per verificare"}
                >
                  {verificaStato.telefono ? (
                    <CheckCircle2 className="w-4 h-4 text-success500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                  )}
                </span>
                {!verificaStato.telefono && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-5 px-2 text-xs ml-1"
                    onClick={() => avviaVerifica('telefono', 'telefono')}
                  >
                    Verifica
                  </Button>
                )}
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
                <span
                  className="ml-1 cursor-help"
                  title={verificaStato.email ? "Verificata" : "Da verificare - clicca il bottone per verificare"}
                >
                  {verificaStato.email ? (
                    <CheckCircle2 className="w-4 h-4 text-success500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                  )}
                </span>
                {!verificaStato.email && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-5 px-2 text-xs ml-1"
                    onClick={() => avviaVerifica('email', 'email')}
                  >
                    Verifica
                  </Button>
                )}
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

        {/* EXTRA FIELDS (ACCORDION) */}
        <Accordion 
          type="multiple" 
          value={expandedAccordions} 
          onValueChange={setExpandedAccordions} 
          className="w-full mt-6 border-t pt-4"
        >
          
          <TabTutori renderMancaDato={renderMancaDato} getInputClassName={getInputClassName} />


          {/* Dati Fatturazione & Azienda */}
          <AccordionItem value="fatturazione" className="border-b-0 border-slate-100 dark:border-slate-800 mb-2 bg-slate-50/50 dark:bg-slate-900/20 rounded-lg px-4">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Building2 className="w-4 h-4" />
                Dati Fatturazione & Azienda (B2B)
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Ragione Sociale</Label>
                  <Input className="h-8" value={formData.companyName} onChange={(e) => handleChange("companyName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Codice SDI (Fatt. Elettronica)</Label>
                  <Input className="h-8" value={formData.codiceFe} onChange={(e) => handleChange("codiceFe", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs">Indirizzo Sede Legale</Label>
                  <Input className="h-8" value={formData.companyAddress} onChange={(e) => handleChange("companyAddress", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Città</Label>
                  <Input className="h-8" value={formData.companyCity} onChange={(e) => handleChange("companyCity", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">CAP / Prov</Label>
                  <div className="flex gap-2">
                    <Input className="h-8 w-2/3" placeholder="CAP" value={formData.companyCap} onChange={(e) => handleChange("companyCap", e.target.value)} />
                    <Input className="h-8 w-1/3" placeholder="PR" value={formData.companyProvince} onChange={(e) => handleChange("companyProvince", e.target.value.toUpperCase())} maxLength={2} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Email PEC</Label>
                  <Input className="h-8" type="email" value={formData.emailPec} onChange={(e) => handleChange("emailPec", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Email Aziendale / Telefono</Label>
                  <div className="flex gap-2">
                    <Input className="h-8 flex-1" placeholder="Email" value={formData.companyEmail} onChange={(e) => handleChange("companyEmail", e.target.value)} />
                    <Input className="h-8 flex-1" placeholder="Telefono" value={formData.companyPhone} onChange={(e) => handleChange("companyPhone", e.target.value)} />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>


          {/* Social & Digital */}
          <AccordionItem value="social" className="border-b-0 border-slate-100 dark:border-slate-800 mb-2 bg-slate-50/50 dark:bg-slate-900/20 rounded-lg px-4">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Share2 className="w-4 h-4" />
                Social & Contatti Digitali
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs">Cartella Drive Condivisa (Link)</Label>
                  <Input className="h-8" value={formData.driveFolderUrl} onChange={(e) => handleChange("driveFolderUrl", e.target.value)} placeholder="https://drive.google.com/..." />
                </div>
            </AccordionContent>
          </AccordionItem>

          {/* Dati Amministrativi / Bancari / Albo */}
          <AccordionItem value="bancari" className="border-b-0 border-slate-100 dark:border-slate-800 mb-2 bg-slate-50/50 dark:bg-slate-900/20 rounded-lg px-4">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Wallet className="w-4 h-4" />
                Dati Bancari & Professionali (Albo/Patente)
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Banca / Istituto</Label>
                  <Input className="h-8" value={formData.bankName} onChange={(e) => handleChange("bankName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">IBAN</Label>
                  <Input className="h-8" value={formData.iban} onChange={(e) => handleChange("iban", e.target.value)} placeholder="IT..." />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Legacy & Athena (Admin) */}
          <AccordionItem value="legacy" className="border-b-0 border-slate-100 dark:border-slate-800 mb-2 bg-slate-50/50 dark:bg-slate-900/20 rounded-lg px-4">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Briefcase className="w-4 h-4" />
                Dati Storici e Sistemi Esterni (Legacy / Sola Lettura)
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Mastro C</Label>
                  <Input className="h-8 text-muted-foreground bg-muted/50" value={formData.mastroC} readOnly disabled />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Mastro COL</Label>
                  <Input className="h-8 text-muted-foreground bg-muted/50" value={formData.mastroCol} readOnly disabled />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Codice Catastale</Label>
                  <Input className="h-8 text-muted-foreground bg-muted/50" value={formData.codiceCatastale} readOnly disabled />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="space-y-2">
                  <Label className="text-xs text-amber-600 dark:text-amber-500 font-semibold">Tessera Precedente (Storico)</Label>
                  <Input className="h-8 text-muted-foreground bg-muted/50" value={formData.previousMembershipNumber} readOnly disabled title={formData.previousMembershipNumber} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-amber-600 dark:text-amber-500 font-semibold">ID Athena (Storico)</Label>
                  <Input className="h-8 text-muted-foreground bg-muted/50" value={formData.athenaId} readOnly disabled title={formData.athenaId} />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </CardContent>
    </Card>
  );
}
