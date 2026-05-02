import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, AlertTriangle, User } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ConflictBadge } from "@/components/conflict-badge";
import { useCrmForm } from "./CrmFormContext";
import { useCFCheck, useEmailCheck, usePhoneCheck } from "@/hooks/useFieldConflictCheck";

interface TabAnagraficaProps {
  renderMancaDato: (val: string | undefined | null) => React.ReactNode;
  getInputClassName: (field: string, isRequired?: boolean) => string;
}

export function TabAnagrafica({ renderMancaDato, getInputClassName }: TabAnagraficaProps) {
  const { 
    formData, 
    handleChange, 
    verificaStato, 
    avviaVerifica, 
    selectedMemberId,
    actionFromUrl
  } = useCrmForm();

  // Field validation checks (using hooks already used in maschera-input-generale)
  const isNewOrDraft = !selectedMemberId || actionFromUrl === "new";
  const cfCheck = useCFCheck(formData.codiceFiscale, isNewOrDraft ? undefined : selectedMemberId || undefined);
  const emailCheck = useEmailCheck(formData.email, isNewOrDraft ? undefined : selectedMemberId || undefined);
  const phoneCheck = usePhoneCheck(formData.telefono, isNewOrDraft ? undefined : selectedMemberId || undefined);

  return (
    <Card className="flex-1">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 sidebar-icon-gold" />
            Anagrafica
          </div>
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
                <ConflictBadge result={phoneCheck} type="phone" />
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
      </CardContent>
    </Card>
  );
}
