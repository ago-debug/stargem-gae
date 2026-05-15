import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IdCard, Stethoscope, Plus } from "lucide-react";
import { FileUploadInput } from "@/components/shared/FileUploadInput";
import { useLocation } from "wouter";
import { useCrmForm, BottomSectionsState } from "./CrmFormContext";

interface TabTessereProps {
  topTesseraMembership: any;
  topTesseraNumero: string | undefined;
  topTesseraScad: string | undefined;
  isTesseraExpired: boolean | undefined;
}

export function TabTessere({
  topTesseraMembership,
  topTesseraNumero,
  topTesseraScad,
  isTesseraExpired
}: TabTessereProps) {
  const [, setLocation] = useLocation();
  const { 
    formData, 
    bottomSectionsData, 
    setBottomSectionsData, 
    dirtyFields, 
    setDirtyFields,
    selectedMemberId 
  } = useCrmForm();

  const handleBottomSectionChange = (section: keyof BottomSectionsState, field: string, value: any) => {
    setBottomSectionsData((prev) => ({
      ...prev,
      [section]: {
        ...(prev as any)[section],
        [field]: value
      }
    }));
    setDirtyFields((prev) => ({ ...prev, [`${section}_${field}`]: true }));
  };

  const getBottomSectionClassName = (sectionName: string, fieldName: string) => {
    const isDirty = dirtyFields[`${sectionName}_${fieldName}`];
    const value = (bottomSectionsData as any)[sectionName]?.[fieldName];

    if (isDirty) {
      return 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700 transition-colors text-yellow-900 dark:text-yellow-400';
    }
    if (value && !isDirty) {
      return 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700 transition-colors text-green-900 dark:text-green-400';
    }
    return 'transition-colors';
  };

  const isReadOnly = !!topTesseraMembership;
  const isEntityCardReadOnly = topTesseraMembership && !!topTesseraMembership.entityCardNumber;
  const hasEntityCard = !!(formData.tesseraEnte || formData.scadenzaTesseraEnte || topTesseraMembership?.entityCardNumber);

  const safeDate = (dateVal: string | Date | null | undefined) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  return (
    <>
      {/* TESSERE */}
      <Card id="tessere" className="scroll-mt-32">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <IdCard className="w-5 h-5 sidebar-icon-gold" />
            Tessere
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!selectedMemberId ? (
            <div className="text-center p-6 text-muted-foreground bg-muted/10 rounded-lg border border-dashed my-4">
              Salva o seleziona un partecipante per sbloccare questa sezione
            </div>
          ) : (
            <div className="space-y-6 pt-2">
              <div className="flex justify-end items-center mb-4">
                {selectedMemberId && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setLocation(`/tessere-certificati?newTessera=true&memberId=${selectedMemberId}`)}
                  >
                    <Plus className="w-4 h-4" />
                    Nuova Tessera
                  </Button>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Quota Tessera</Label>
                    <Input 
                      type={isNaN(Number(
                        (!topTesseraMembership?.fee || Number(topTesseraMembership.fee) === 0) && !isTesseraExpired && topTesseraMembership
                          ? "importa dati db" 
                          : (topTesseraMembership?.fee || bottomSectionsData.tessere.quota)
                      )) ? "text" : "number"} 
                      value={
                        (!topTesseraMembership?.fee || Number(topTesseraMembership.fee) === 0) && !isTesseraExpired && topTesseraMembership
                          ? "importa dati db" 
                          : (topTesseraMembership?.fee || bottomSectionsData.tessere.quota)
                      } 
                      readOnly={isReadOnly} 
                      disabled={isReadOnly} 
                      onChange={(e) => handleBottomSectionChange('tessere', 'quota', e.target.value)} 
                      className={getBottomSectionClassName('tessere', 'quota')} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pagamento Tessera</Label>
                    <Input type="date" value={topTesseraMembership?.issueDate ? safeDate(topTesseraMembership.issueDate) : bottomSectionsData.tessere.pagamento} readOnly={true} disabled={true} onChange={(e) => handleBottomSectionChange('tessere', 'pagamento', e.target.value)} className="bg-muted text-muted-foreground opacity-100" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select 
                      value={topTesseraMembership?.renewalType ? topTesseraMembership.renewalType.toUpperCase() : bottomSectionsData.tessere.membershipType} 
                      disabled={isReadOnly}
                      onValueChange={(val) => handleBottomSectionChange('tessere', 'membershipType', val)}
                    >
                      <SelectTrigger className={getBottomSectionClassName('tessere', 'membershipType')}>
                        <SelectValue placeholder="Seleziona Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NUOVO">Nuovo</SelectItem>
                        <SelectItem value="RINNOVO">Rinnovo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Competenza</Label>
                    <Select 
                      value={topTesseraMembership?.seasonCompetence || bottomSectionsData.tessere.seasonCompetence} 
                      disabled={isReadOnly}
                      onValueChange={(val) => handleBottomSectionChange('tessere', 'seasonCompetence', val)}
                    >
                      <SelectTrigger className={getBottomSectionClassName('tessere', 'seasonCompetence')}>
                        <SelectValue placeholder="Seleziona Competenza" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CORRENTE">Corrente</SelectItem>
                        <SelectItem value="SUCCESSIVA">Successiva</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label>Data Scadenza (Auto)</Label>
                    <Input 
                      type="date" 
                      value={
                        (topTesseraMembership?.expiryDate ? safeDate(topTesseraMembership.expiryDate) : null) 
                        || topTesseraScad 
                        || bottomSectionsData.tessere.dataScad
                      } 
                      readOnly={true} 
                      disabled={true} 
                      onChange={(e) => handleBottomSectionChange('tessere', 'dataScad', e.target.value)} 
                      className="bg-muted text-muted-foreground opacity-100 placeholder:italic" 
                      placeholder="Calcolata da sistema"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>N. Tessera (Auto)</Label>
                    <Input value={topTesseraNumero || bottomSectionsData.tessere.numero} placeholder="Assegnato post-salvataggio" readOnly={true} disabled={true} className="bg-muted text-muted-foreground opacity-100" />
                  </div>
                  <div className="space-y-2">
                    <Label>Barcode</Label>
                    <Input value={topTesseraMembership?.barcode || (topTesseraNumero ? `T${topTesseraNumero.replace('-', '')}` : '')} readOnly disabled className={`bg-transparent opacity-80 cursor-default`} />
                  </div>
                  <div className="space-y-2">
                    <Label>Stato</Label>
                    <div className="h-10 flex items-center">
                      {topTesseraMembership ? (
                        <Badge variant={!isTesseraExpired ? 'default' : 'secondary'} className={isTesseraExpired ? "bg-red-50 dark:bg-red-950/20 text-red-600 border-red-300" : "shadow-sm"}>
                          {!isTesseraExpired ? 'Attiva' : 'Scaduta'}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Nessuna</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tessera Ente</Label>
                    <Input 
                      value={
                        topTesseraMembership?.entityCardNumber 
                        || formData.tesseraEnte 
                        || bottomSectionsData.tessere.tesseraEnte 
                        || ((!topTesseraMembership?.entityCardNumber && !isTesseraExpired && topTesseraMembership) ? "Libertas" : "")
                      } 
                      readOnly={isEntityCardReadOnly} 
                      disabled={isEntityCardReadOnly} 
                      onChange={(e) => handleBottomSectionChange('tessere', 'tesseraEnte', e.target.value)} 
                      className={getBottomSectionClassName('tessere', 'tesseraEnte')} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Scadenza Tessera Ente</Label>
                    <Input type="date" value={hasEntityCard ? (topTesseraMembership?.entityCardExpiryDate ? safeDate(topTesseraMembership.entityCardExpiryDate) : safeDate(formData.scadenzaTesseraEnte)) : bottomSectionsData.tessere.scadenzaTesseraEnte} readOnly={true} disabled={true} onChange={(e) => handleBottomSectionChange('tessere', 'scadenzaTesseraEnte', e.target.value)} className={getBottomSectionClassName('tessere', 'scadenzaTesseraEnte')} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CERTIFICATO MEDICO */}
      <Card id="certificato" className="scroll-mt-32">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Stethoscope className="w-5 h-5 sidebar-icon-gold" />
            Certificato Medico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!selectedMemberId ? (
            <div className="text-center p-6 text-muted-foreground bg-muted/10 rounded-lg border border-dashed my-4">
              Salva o seleziona un partecipante per sbloccare questa sezione
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label>Data Scadenza Certificato</Label>
                  <Input type="date" value={bottomSectionsData.certificatoMedico.dataScadenza} onChange={(e) => handleBottomSectionChange('certificatoMedico', 'dataScadenza', e.target.value)} className={getBottomSectionClassName('certificatoMedico', 'dataScadenza')} />
                </div>
                <div className="space-y-2">
                  <Label>Data di Rinnovo</Label>
                  <Input type="date" value={bottomSectionsData.certificatoMedico.dataRinnovo} onChange={(e) => handleBottomSectionChange('certificatoMedico', 'dataRinnovo', e.target.value)} className={getBottomSectionClassName('certificatoMedico', 'dataRinnovo')} />
                </div>
                <div className="space-y-2">
                  <Label>Rilasciato Da</Label>
                  <Input 
                    value={
                      bottomSectionsData.certificatoMedico.rilasciatoDa
                    } 
                    onChange={(e) => handleBottomSectionChange('certificatoMedico', 'rilasciatoDa', e.target.value)} 
                    className={getBottomSectionClassName('certificatoMedico', 'rilasciatoDa')} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pagamento</Label>
                  <Input 
                    type="number" 
                    placeholder="€ 40" 
                    value={
                      bottomSectionsData.certificatoMedico.pagamento
                    } 
                    onChange={(e) => handleBottomSectionChange('certificatoMedico', 'pagamento', e.target.value)} 
                    className={getBottomSectionClassName('certificatoMedico', 'pagamento')} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>A Noi</Label>
                  <Input 
                    type="number" 
                    placeholder="12,5" 
                    value={
                      bottomSectionsData.certificatoMedico.aNoi
                    } 
                    onChange={(e) => handleBottomSectionChange('certificatoMedico', 'aNoi', e.target.value)} 
                    className={getBottomSectionClassName('certificatoMedico', 'aNoi')} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo Certificato</Label>
                  <Select 
                    value={
                      bottomSectionsData.certificatoMedico.tipo
                    } 
                    onValueChange={(v) => handleBottomSectionChange('certificatoMedico', 'tipo', v)}
                  >
                    <SelectTrigger className={getBottomSectionClassName('certificatoMedico', 'tipo')}>
                      <SelectValue placeholder="Seleziona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="non_agonistico">Sportivo Non Agonistico</SelectItem>
                      <SelectItem value="agonistico">Sportivo Agonistico</SelectItem>
                      <SelectItem value="base">Base</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 lg:col-span-6 mt-2">
                  <Label>Documento Certificato Medico (PDF/Immagine)</Label>
                  <FileUploadInput 
                    endpoint="/api/uploads/medical-certificate"
                    extraFields={{ member_id: selectedMemberId }}
                    onUploadComplete={(url) => handleBottomSectionChange('certificatoMedico', 'fileUrl', url)}
                    currentUrl={bottomSectionsData.certificatoMedico.fileUrl}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
