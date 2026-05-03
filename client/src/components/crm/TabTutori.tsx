import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, AlertTriangle, Users } from "lucide-react";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useCrmForm } from "./CrmFormContext";

interface TabTutoriProps {
  renderMancaDato: (val: string | undefined | null) => React.ReactNode;
  getInputClassName: (field: string, isRequired?: boolean, readOnly?: boolean) => string;
}

export function TabTutori({ renderMancaDato, getInputClassName }: TabTutoriProps) {
  const { 
    formData, 
    handleChange, 
    verificaStato, 
    avviaVerifica
  } = useCrmForm();

  // Determine if Genitori sections should be highlighted as active (required logic for Minors)
  // MascheraInputGenerale uses logic to decide if required based on age or other rules
  // Let's assume isGen1Active and isGen2Active are based on formData.eta < 18 or explicitly filled
  const etaNum = parseInt(formData.eta || '0', 10);
  const isMinorenne = etaNum > 0 && etaNum < 18;
  const isGen1Active = isMinorenne || formData.cognomeGen1 || formData.nomeGen1 || formData.cfGen1;
  const isGen2Active = formData.cognomeGen2 || formData.nomeGen2 || formData.cfGen2;

  return (
    <AccordionItem value="tutori" className="border-b-0 border-amber-100 dark:border-amber-900/30 mb-2 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg px-4">
      <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500">
          <Users className="w-4 h-4" />
          Genitori / Tutori (Minorenni e Contatti)
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-6 pt-2 pb-4">
        {/* Genitore 1 */}
        <div>
          <h3 className="inline-block text-sm font-medium px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 rounded-full border border-amber-200 mb-4">Genitore 1</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Cognome</Label>
              <Input value={formData.cognomeGen1} onChange={(e) => handleChange("cognomeGen1", e.target.value)} className={getInputClassName("cognomeGen1", false)} />
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={formData.nomeGen1} onChange={(e) => handleChange("nomeGen1", e.target.value)} className={getInputClassName("nomeGen1", false)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Codice Fiscale {isGen1Active && <span className="text-red-500 ml-1">*</span>}
                <a href="/generatore-cf-stranieri" target="_blank" rel="noopener noreferrer" title="Attenzione, per gli stranieri senza codice fiscale clicca qui" className="text-destructive hover:text-destructive700 transition-colors">
                  <AlertTriangle className="w-4 h-4 cursor-pointer" />
                </a>
              </Label>
              <div className="relative">
                <Input value={formData.cfGen1} onChange={(e) => handleChange("cfGen1", e.target.value.toUpperCase())} className={getInputClassName("cfGen1", !!isGen1Active)} />
                {isGen1Active && renderMancaDato(formData.cfGen1)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>Telefono {isGen1Active && <span className="text-red-500 ml-1">*</span>}</Label>
                <span
                  className="ml-1 cursor-help"
                  title={verificaStato.telGen1 ? "Verificato" : "Da verificare"}
                >
                  {verificaStato.telGen1 ? (
                    <CheckCircle2 className="w-4 h-4 text-success500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                  )}
                </span>
                {!verificaStato.telGen1 && (
                  <Button type="button" variant="outline" size="sm" className="h-5 px-2 text-xs ml-1" onClick={() => avviaVerifica('telGen1', 'telefono')}>
                    Verifica
                  </Button>
                )}
              </div>
              <div className="relative">
                <Input
                  value={formData.telGen1}
                  onChange={(e) => handleChange("telGen1", e.target.value)}
                  className={`${getInputClassName("telGen1", !!isGen1Active)} ${verificaStato.telGen1 ? "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700" : ""}`}
                />
                {isGen1Active && renderMancaDato(formData.telGen1)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>Email {isGen1Active && <span className="text-red-500 ml-1">*</span>}</Label>
                <span
                  className="ml-1 cursor-help"
                  title={verificaStato.emailGen1 ? "Verificato" : "Da verificare"}
                >
                  {verificaStato.emailGen1 ? (
                    <CheckCircle2 className="w-4 h-4 text-success500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                  )}
                </span>
                {!verificaStato.emailGen1 && (
                  <Button type="button" variant="outline" size="sm" className="h-5 px-2 text-xs ml-1" onClick={() => avviaVerifica('emailGen1', 'email')}>
                    Verifica
                  </Button>
                )}
              </div>
              <div className="relative">
                <Input
                  value={formData.emailGen1}
                  onChange={(e) => handleChange("emailGen1", e.target.value)}
                  className={`${getInputClassName("emailGen1", !!isGen1Active)} ${verificaStato.emailGen1 ? "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700" : ""}`}
                />
                {isGen1Active && renderMancaDato(formData.emailGen1)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Indirizzo residenza</Label>
              <Input placeholder="Via/Piazza, n. civico" value={formData.indirizzoGen1} onChange={(e) => handleChange("indirizzoGen1", e.target.value)} className={getInputClassName("indirizzoGen1", false)} />
            </div>
            <div className="space-y-2">
              <Label>CAP</Label>
              <Input value={formData.capGen1} onChange={(e) => handleChange("capGen1", e.target.value)} className={getInputClassName("capGen1", false)} />
            </div>
            <div className="space-y-2">
              <Label>Città</Label>
              <Input value={formData.cittaGen1} list="comuni-list" onChange={(e) => handleChange("cittaGen1", e.target.value)} className={getInputClassName("cittaGen1", false)} />
            </div>
            <div className="space-y-2">
              <Label>Provincia</Label>
              <Input value={formData.provinciaGen1} list="province-list" onChange={(e) => handleChange("provinciaGen1", e.target.value)} className={getInputClassName("provinciaGen1", false)} />
            </div>
            <div className="space-y-2">
              <Label>Cod. Comune</Label>
              <Input value={formData.codComuneGen1} onChange={(e) => handleChange("codComuneGen1", e.target.value)} className={getInputClassName("codComuneGen1", false)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Data di Nascita</Label>
              <Input
                value={formData.dataNascitaGen1 ? new Date(formData.dataNascitaGen1).toLocaleDateString('it-IT') : ''}
                readOnly
                className={`${getInputClassName("dataNascitaGen1", false, true)} ${!formData.cfGen1 && 'border-destructive400 bg-destructive/50'}`}
              />
            </div>
            <div className="space-y-2">
              <Label>Luogo di Nascita</Label>
              <Input
                value={formData.luogoNascitaGen1}
                readOnly
                className={`${getInputClassName("luogoNascitaGen1", false, true)} ${!formData.cfGen1 && 'border-destructive400 bg-destructive/50'}`}
              />
            </div>
            <div className="space-y-2">
              <Label>Prov. Nascita</Label>
              <Input
                value={formData.provinciaNascitaGen1} list="province-list"
                readOnly
                className={`${getInputClassName("provinciaNascitaGen1", false, true)} ${!formData.cfGen1 && 'border-destructive400 bg-destructive/50'}`}
              />
            </div>
            <div className="space-y-2">
              <Label>Sesso</Label>
              <Input
                value={formData.sessoGen1 === 'M' ? 'M' : formData.sessoGen1 === 'F' ? 'F' : ''}
                readOnly
                className={`${getInputClassName("sessoGen1", false, true)} ${!formData.cfGen1 && 'border-destructive400 bg-destructive/50'}`}
              />
            </div>
            <div className="space-y-2">
              <Label>Età</Label>
              <Input
                value={formData.etaGen1}
                readOnly
                className={`${getInputClassName("etaGen1", false, true)} ${!formData.cfGen1 && 'border-destructive400 bg-destructive/50'}`}
              />
            </div>
          </div>
        </div>

        {/* Genitore 2 */}
        <div className="pt-6 mt-6 border-t border-border">
          <h3 className="inline-block text-sm font-medium px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 rounded-full border border-amber-200 mb-4">Genitore 2</h3>
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
              <Label className="flex items-center gap-2">
                Codice Fiscale {isGen2Active && <span className="text-red-500 ml-1">*</span>}
                <a href="/generatore-cf-stranieri" target="_blank" rel="noopener noreferrer" title="Attenzione, per gli stranieri senza codice fiscale clicca qui" className="text-destructive hover:text-destructive700 transition-colors">
                  <AlertTriangle className="w-4 h-4 cursor-pointer" />
                </a>
              </Label>
              <div className="relative">
                <Input value={formData.cfGen2} onChange={(e) => handleChange("cfGen2", e.target.value.toUpperCase())} className={getInputClassName("cfGen2", !!isGen2Active)} />
                {isGen2Active && renderMancaDato(formData.cfGen2)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>Telefono {isGen2Active && <span className="text-red-500 ml-1">*</span>}</Label>
                <span
                  className="ml-1 cursor-help"
                  title={verificaStato.telGen2 ? "Verificato" : "Da verificare"}
                >
                  {verificaStato.telGen2 ? (
                    <CheckCircle2 className="w-4 h-4 text-success500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                  )}
                </span>
                {!verificaStato.telGen2 && (
                  <Button type="button" variant="outline" size="sm" className="h-5 px-2 text-xs ml-1" onClick={() => avviaVerifica('telGen2', 'telefono')}>
                    Verifica
                  </Button>
                )}
              </div>
              <div className="relative">
                <Input
                  value={formData.telGen2}
                  onChange={(e) => handleChange("telGen2", e.target.value)}
                  className={`${getInputClassName("telGen2", !!isGen2Active)} ${verificaStato.telGen2 ? "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700" : ""}`}
                />
                {isGen2Active && renderMancaDato(formData.telGen2)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>Email {isGen2Active && <span className="text-red-500 ml-1">*</span>}</Label>
                <span
                  className="ml-1 cursor-help"
                  title={verificaStato.emailGen2 ? "Verificato" : "Da verificare"}
                >
                  {verificaStato.emailGen2 ? (
                    <CheckCircle2 className="w-4 h-4 text-success500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                  )}
                </span>
                {!verificaStato.emailGen2 && (
                  <Button type="button" variant="outline" size="sm" className="h-5 px-2 text-xs ml-1" onClick={() => avviaVerifica('emailGen2', 'email')}>
                    Verifica
                  </Button>
                )}
              </div>
              <div className="relative">
                <Input
                  value={formData.emailGen2}
                  onChange={(e) => handleChange("emailGen2", e.target.value)}
                  className={`${getInputClassName("emailGen2", !!isGen2Active)} ${verificaStato.emailGen2 ? "bg-green-50 border-green-300" : ""}`}
                />
                {isGen2Active && renderMancaDato(formData.emailGen2)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Indirizzo residenza</Label>
              <Input placeholder="Via/Piazza, n. civico" value={formData.indirizzoGen2} onChange={(e) => handleChange("indirizzoGen2", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CAP</Label>
              <Input value={formData.capGen2} onChange={(e) => handleChange("capGen2", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Città</Label>
              <Input value={formData.cittaGen2} list="comuni-list" onChange={(e) => handleChange("cittaGen2", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Provincia</Label>
              <Input value={formData.provinciaGen2} list="province-list" onChange={(e) => handleChange("provinciaGen2", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cod. Comune</Label>
              <Input value={formData.codComuneGen2} onChange={(e) => handleChange("codComuneGen2", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Data di Nascita</Label>
              <Input
                value={formData.dataNascitaGen2 ? new Date(formData.dataNascitaGen2).toLocaleDateString('it-IT') : ''}
                readOnly
                className={`${formData.cfGen2 ? 'bg-warning/50 border-warning300' : 'border-destructive400 bg-destructive/50'} `}
              />
            </div>
            <div className="space-y-2">
              <Label>Luogo di Nascita</Label>
              <Input
                value={formData.luogoNascitaGen2}
                readOnly
                className={`${formData.cfGen2 ? 'bg-warning/50 border-warning300' : 'border-destructive400 bg-destructive/50'} `}
              />
            </div>
            <div className="space-y-2">
              <Label>Prov. Nascita</Label>
              <Input
                value={formData.provinciaNascitaGen2} list="province-list"
                readOnly
                className={`${formData.cfGen2 ? 'bg-warning/50 border-warning300' : 'border-destructive400 bg-destructive/50'} `}
              />
            </div>
            <div className="space-y-2">
              <Label>Sesso</Label>
              <Input
                value={formData.sessoGen2 === 'M' ? 'M' : formData.sessoGen2 === 'F' ? 'F' : ''}
                readOnly
                className={`${formData.cfGen2 ? 'bg-warning/50 border-warning300' : 'border-destructive400 bg-destructive/50'} `}
              />
            </div>
            <div className="space-y-2">
              <Label>Età</Label>
              <Input
                value={formData.etaGen2}
                readOnly
                className={`${formData.cfGen2 ? 'bg-warning/50 border-warning300' : 'border-destructive400 bg-destructive/50'} `}
              />
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
