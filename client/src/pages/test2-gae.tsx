import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Upload, Download, Paperclip, Search, Plus, Save, FileSpreadsheet } from "lucide-react";
import { 
  FileText, Users, CreditCard, Gift, IdCard, Stethoscope, Activity,
  User, BookOpen, ShoppingBag
} from "lucide-react";
import { KnowledgeInfo } from "@/components/knowledge-info";

interface AllegatoState {
  hasFile: boolean;
  data?: string;
  note?: string;
}

interface AllegatiState {
  regolamento: AllegatoState & { accettato?: string };
  privacy: AllegatoState & { accettata?: string };
  certificatoMedico: AllegatoState & { dataRilascio?: string; scadenza?: string; tipo?: string };
  ricevutePagamenti: AllegatoState & { numeroRicevute?: number };
  modelloDetrazione: AllegatoState & { anno?: string; richiesto?: string };
  creditiScolastici: AllegatoState & { annoScolastico?: string; richiesto?: string };
  tesserinoTecnico: AllegatoState & { numero?: string; dataRilascio?: string };
  tesseraEnte: AllegatoState & { numero?: string; ente?: string };
}

export default function Test2Gae() {
  const [allegati, setAllegati] = useState<AllegatiState>({
    regolamento: { hasFile: false, data: "", accettato: "" },
    privacy: { hasFile: false, data: "", accettata: "" },
    certificatoMedico: { hasFile: false, dataRilascio: "", scadenza: "", tipo: "" },
    ricevutePagamenti: { hasFile: false, numeroRicevute: 0, note: "" },
    modelloDetrazione: { hasFile: false, anno: "2025", richiesto: "" },
    creditiScolastici: { hasFile: false, annoScolastico: "2024/2025", richiesto: "" },
    tesserinoTecnico: { hasFile: false, numero: "", dataRilascio: "" },
    tesseraEnte: { hasFile: false, numero: "", ente: "" },
  });

  const toggleAllegato = (key: keyof AllegatiState) => {
    setAllegati(prev => ({
      ...prev,
      [key]: { ...prev[key], hasFile: !prev[key].hasFile }
    }));
  };

  const updateAllegato = (key: keyof AllegatiState, field: string, value: string | number) => {
    setAllegati(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const [formData, setFormData] = useState({
    // Intestazione
    stagione: "2024-2025",
    anagrafica: "",
    codiceId: "2425-000001",
    dataInserimento: new Date().toLocaleDateString("it-IT"),
    tipoPartecipante: "tesserato",
    tessera: "",
    scadenzaTessera: "",
    daDoveArriva: "",
    teamSegreteria: "",
    tesseraEnte: "",
    scadenzaTesseraEnte: "",
    ente: "",
    // Anagrafica principale
    cognome: "",
    nome: "",
    codiceFiscale: "",
    telefono: "",
    email: "",
    indirizzo: "",
    cap: "",
    citta: "",
    provincia: "",
    codComune: "",
    dataNascita: "",
    luogoNascita: "",
    sesso: "",
    eta: "",
    allievo: "",
    // Genitore 1
    cognomeGen1: "",
    nomeGen1: "",
    cfGen1: "",
    telGen1: "",
    emailGen1: "",
    indirizzoGen1: "",
    capGen1: "",
    cittaGen1: "",
    provinciaGen1: "",
    codComuneGen1: "",
    dataNascitaGen1: "",
    luogoNascitaGen1: "",
    sessoGen1: "",
    // Genitore 2
    cognomeGen2: "",
    nomeGen2: "",
    cfGen2: "",
    telGen2: "",
    emailGen2: "",
    indirizzoGen2: "",
    capGen2: "",
    cittaGen2: "",
    provinciaGen2: "",
    codComuneGen2: "",
    dataNascitaGen2: "",
    luogoNascitaGen2: "",
    sessoGen2: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const navItems = [
    { id: "intestazione", label: "Intestazione", icon: FileText },
    { id: "anagrafica", label: "Anagrafica", icon: Users },
    { id: "pagamenti", label: "Pagamenti", icon: CreditCard },
    { id: "gift", label: "Gift/Buono", icon: Gift },
    { id: "tessere", label: "Tessere", icon: IdCard },
    { id: "certificato", label: "Certificato Medico", icon: Stethoscope },
    { id: "attivita", label: "Attività", icon: Activity },
  ];

  return (
    <div className="flex flex-col h-full" data-testid="page-test2-gae">
      {/* Header fisso con navigazione */}
      <div className="border-b bg-muted/30 sticky top-0 z-10">
        <div className="p-4 space-y-4">
          {/* Riga titolo e pulsanti azioni */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Sistema di Gestione Anagrafica</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Inserimento e interrogazione dati</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" data-testid="button-gsheets">
                <FileSpreadsheet className="w-4 h-4 mr-1" />
                GSheets
              </Button>
              <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white" data-testid="button-esporta">
                <Upload className="w-4 h-4 mr-1" />
                Esporta
              </Button>
              <Button variant="outline" size="sm" data-testid="button-importa">
                <Download className="w-4 h-4 mr-1" />
                Importa
              </Button>
              <Button variant="outline" size="sm" data-testid="button-salva">
                <Save className="w-4 h-4 mr-1" />
                Salva
              </Button>
              <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white" data-testid="button-nuovo">
                <Plus className="w-4 h-4 mr-1" />
                Nuovo
              </Button>
            </div>
          </div>
          
          {/* Barra di ricerca */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cerca partecipante..." 
              className="pl-10 bg-background"
              data-testid="input-search"
            />
          </div>
          
          {/* Tab di navigazione */}
          <div className="flex items-center gap-2 flex-wrap">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                size="sm"
                onClick={() => scrollToSection(item.id)}
                className="text-xs h-8 bg-background"
                data-testid={`nav-${item.id}`}
              >
                <item.icon className="w-3 h-3 mr-1" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        
        {/* INTESTAZIONE */}
        <Card id="intestazione" className="scroll-mt-32">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" />
              Intestazione
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Stagione</Label>
                <Input 
                  value={formData.stagione} 
                  onChange={(e) => handleChange("stagione", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Anagrafica (chi scrive)</Label>
                <Input 
                  value={formData.anagrafica}
                  onChange={(e) => handleChange("anagrafica", e.target.value)}
                  placeholder="chi scrive" 
                />
              </div>
              <div className="space-y-2">
                <Label>Codice ID (C)</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Auto</Badge>
                  <Input 
                    value={formData.codiceId} 
                    onChange={(e) => handleChange("codiceId", e.target.value)}
                    className="bg-yellow-50 border-yellow-200 font-mono"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Data Inserimento</Label>
                <Input value={formData.dataInserimento} readOnly className="bg-muted" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Tipo Partecipante</Label>
                <Select value={formData.tipoPartecipante} onValueChange={(v) => handleChange("tipoPartecipante", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tesserato">Tesserato</SelectItem>
                    <SelectItem value="non_tesserato">Non Tesserato</SelectItem>
                    <SelectItem value="prova">Prova</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tessera</Label>
                <Input 
                  value={formData.tessera} 
                  onChange={(e) => handleChange("tessera", e.target.value)} 
                  className="bg-yellow-50 border-yellow-200"
                />
              </div>
              <div className="space-y-2">
                <Label>Scadenza Tessera</Label>
                <Input type="date" value={formData.scadenzaTessera} onChange={(e) => handleChange("scadenzaTessera", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Da Dove Arriva</Label>
                <Select value={formData.daDoveArriva} onValueChange={(v) => handleChange("daDoveArriva", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="web">Web</SelectItem>
                    <SelectItem value="passaparola">Passaparola</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="altro">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Team Segreteria</Label>
                <Input value={formData.teamSegreteria} onChange={(e) => handleChange("teamSegreteria", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tessera Ente</Label>
                <Input value={formData.tesseraEnte} onChange={(e) => handleChange("tesseraEnte", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Scadenza Tessera Ente</Label>
                <Input type="date" value={formData.scadenzaTesseraEnte} onChange={(e) => handleChange("scadenzaTesseraEnte", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Ente</Label>
                <Select value={formData.ente} onValueChange={(v) => handleChange("ente", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acsi">ACSI</SelectItem>
                    <SelectItem value="csen">CSEN</SelectItem>
                    <SelectItem value="uisp">UISP</SelectItem>
                    <SelectItem value="altro">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ANAGRAFICA con ALLEGATI */}
        <div id="anagrafica" className="scroll-mt-32 flex flex-col lg:flex-row gap-4">
          {/* ALLEGATI DA INSERIRE - Colonna sinistra */}
          <Card className="lg:w-72 shrink-0">
            <CardHeader className="pb-2 bg-amber-100 dark:bg-amber-900/30 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-200">
                <Paperclip className="w-4 h-4" />
                ALLEGATI DA INSERIRE
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* REGOLAMENTO */}
              <div 
                className={`border-b p-3 cursor-pointer transition-colors ${allegati.regolamento.hasFile ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-muted/50'}`}
                onClick={() => toggleAllegato('regolamento')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">REGOLAMENTO</span>
                  {allegati.regolamento.hasFile ? (
                    <Download className="w-4 h-4 text-green-600" />
                  ) : (
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Data</Label>
                    <Input 
                      type="date" 
                      className="h-7 text-xs"
                      value={allegati.regolamento.data || ''}
                      onChange={(e) => updateAllegato('regolamento', 'data', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Accettato</Label>
                    <Select 
                      value={allegati.regolamento.accettato || ''} 
                      onValueChange={(v) => updateAllegato('regolamento', 'accettato', v)}
                    >
                      <SelectTrigger className="h-7 text-xs" onClick={(e) => e.stopPropagation()}>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sì</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* PRIVACY */}
              <div 
                className={`border-b p-3 cursor-pointer transition-colors ${allegati.privacy.hasFile ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-muted/50'}`}
                onClick={() => toggleAllegato('privacy')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">PRIVACY</span>
                  {allegati.privacy.hasFile ? (
                    <Download className="w-4 h-4 text-green-600" />
                  ) : (
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Data</Label>
                    <Input 
                      type="date" 
                      className="h-7 text-xs"
                      value={allegati.privacy.data || ''}
                      onChange={(e) => updateAllegato('privacy', 'data', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Accettata</Label>
                    <Select 
                      value={allegati.privacy.accettata || ''} 
                      onValueChange={(v) => updateAllegato('privacy', 'accettata', v)}
                    >
                      <SelectTrigger className="h-7 text-xs" onClick={(e) => e.stopPropagation()}>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sì</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* CERTIFICATO MEDICO */}
              <div 
                className={`border-b p-3 cursor-pointer transition-colors ${allegati.certificatoMedico.hasFile ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-muted/50'}`}
                onClick={() => toggleAllegato('certificatoMedico')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">CERTIFICATO MEDICO</span>
                  {allegati.certificatoMedico.hasFile ? (
                    <Download className="w-4 h-4 text-green-600" />
                  ) : (
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Data Rilascio</Label>
                    <Input 
                      type="date" 
                      className="h-7 text-xs"
                      value={allegati.certificatoMedico.dataRilascio || ''}
                      onChange={(e) => updateAllegato('certificatoMedico', 'dataRilascio', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Scadenza</Label>
                    <Input 
                      type="date" 
                      className="h-7 text-xs"
                      value={allegati.certificatoMedico.scadenza || ''}
                      onChange={(e) => updateAllegato('certificatoMedico', 'scadenza', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tipo</Label>
                  <Select 
                    value={allegati.certificatoMedico.tipo || ''} 
                    onValueChange={(v) => updateAllegato('certificatoMedico', 'tipo', v)}
                  >
                    <SelectTrigger className="h-7 text-xs" onClick={(e) => e.stopPropagation()}>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="non_agonistico">Non Agonistico</SelectItem>
                      <SelectItem value="agonistico">Agonistico</SelectItem>
                      <SelectItem value="base">Base</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* RICEVUTE PAGAMENTI */}
              <div 
                className={`border-b p-3 cursor-pointer transition-colors ${allegati.ricevutePagamenti.hasFile ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-muted/50'}`}
                onClick={() => toggleAllegato('ricevutePagamenti')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">RICEVUTE PAGAMENTI</span>
                  {allegati.ricevutePagamenti.hasFile ? (
                    <Download className="w-4 h-4 text-green-600" />
                  ) : (
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">N° Ricevute</Label>
                    <Input 
                      type="number" 
                      className="h-7 text-xs"
                      value={allegati.ricevutePagamenti.numeroRicevute || 0}
                      onChange={(e) => updateAllegato('ricevutePagamenti', 'numeroRicevute', parseInt(e.target.value) || 0)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Note</Label>
                    <Input 
                      className="h-7 text-xs"
                      value={allegati.ricevutePagamenti.note || ''}
                      onChange={(e) => updateAllegato('ricevutePagamenti', 'note', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </div>

              {/* MODELLO DETRAZIONE */}
              <div 
                className={`border-b p-3 cursor-pointer transition-colors ${allegati.modelloDetrazione.hasFile ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-muted/50'}`}
                onClick={() => toggleAllegato('modelloDetrazione')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">MODELLO DETRAZIONE</span>
                  {allegati.modelloDetrazione.hasFile ? (
                    <Download className="w-4 h-4 text-green-600" />
                  ) : (
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Anno</Label>
                    <Input 
                      className="h-7 text-xs"
                      value={allegati.modelloDetrazione.anno || ''}
                      onChange={(e) => updateAllegato('modelloDetrazione', 'anno', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Richiesto</Label>
                    <Select 
                      value={allegati.modelloDetrazione.richiesto || ''} 
                      onValueChange={(v) => updateAllegato('modelloDetrazione', 'richiesto', v)}
                    >
                      <SelectTrigger className="h-7 text-xs" onClick={(e) => e.stopPropagation()}>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sì</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* CREDITI SCOLASTICI */}
              <div 
                className={`border-b p-3 cursor-pointer transition-colors ${allegati.creditiScolastici.hasFile ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-muted/50'}`}
                onClick={() => toggleAllegato('creditiScolastici')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">CREDITI SCOLASTICI</span>
                  {allegati.creditiScolastici.hasFile ? (
                    <Download className="w-4 h-4 text-green-600" />
                  ) : (
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Anno Scolastico</Label>
                    <Input 
                      className="h-7 text-xs"
                      value={allegati.creditiScolastici.annoScolastico || ''}
                      onChange={(e) => updateAllegato('creditiScolastici', 'annoScolastico', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Richiesto</Label>
                    <Select 
                      value={allegati.creditiScolastici.richiesto || ''} 
                      onValueChange={(v) => updateAllegato('creditiScolastici', 'richiesto', v)}
                    >
                      <SelectTrigger className="h-7 text-xs" onClick={(e) => e.stopPropagation()}>
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sì</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* TESSERINO TECNICO */}
              <div 
                className={`border-b p-3 cursor-pointer transition-colors ${allegati.tesserinoTecnico.hasFile ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-muted/50'}`}
                onClick={() => toggleAllegato('tesserinoTecnico')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">TESSERINO TECNICO</span>
                  {allegati.tesserinoTecnico.hasFile ? (
                    <Download className="w-4 h-4 text-green-600" />
                  ) : (
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Numero</Label>
                    <Input 
                      className="h-7 text-xs"
                      placeholder="N° Tesserino"
                      value={allegati.tesserinoTecnico.numero || ''}
                      onChange={(e) => updateAllegato('tesserinoTecnico', 'numero', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Data Rilascio</Label>
                    <Input 
                      type="date" 
                      className="h-7 text-xs"
                      value={allegati.tesserinoTecnico.dataRilascio || ''}
                      onChange={(e) => updateAllegato('tesserinoTecnico', 'dataRilascio', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </div>

              {/* TESSERA ENTE */}
              <div 
                className={`p-3 cursor-pointer transition-colors ${allegati.tesseraEnte.hasFile ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-muted/50'}`}
                onClick={() => toggleAllegato('tesseraEnte')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">TESSERA ENTE</span>
                  {allegati.tesseraEnte.hasFile ? (
                    <Download className="w-4 h-4 text-green-600" />
                  ) : (
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Numero</Label>
                    <Input 
                      className="h-7 text-xs"
                      placeholder="N° Tessera"
                      value={allegati.tesseraEnte.numero || ''}
                      onChange={(e) => updateAllegato('tesseraEnte', 'numero', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Ente</Label>
                    <Input 
                      className="h-7 text-xs"
                      placeholder="Ente"
                      value={allegati.tesseraEnte.ente || ''}
                      onChange={(e) => updateAllegato('tesseraEnte', 'ente', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ANAGRAFICA - Colonna destra */}
          <Card className="flex-1">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5" />
                Anagrafica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dati Personali */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2">Dati Personali</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Cognome *</Label>
                  <Input value={formData.cognome} onChange={(e) => handleChange("cognome", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input value={formData.nome} onChange={(e) => handleChange("nome", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Codice Fiscale (J)</Label>
                  <Input 
                    value={formData.codiceFiscale} 
                    onChange={(e) => handleChange("codiceFiscale", e.target.value.toUpperCase())} 
                    className="bg-yellow-50 border-yellow-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefono</Label>
                  <Input value={formData.telefono} onChange={(e) => handleChange("telefono", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Indirizzo</Label>
                  <Input value={formData.indirizzo} onChange={(e) => handleChange("indirizzo", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>CAP</Label>
                  <Input value={formData.cap} onChange={(e) => handleChange("cap", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Città</Label>
                  <Input value={formData.citta} onChange={(e) => handleChange("citta", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Provincia</Label>
                  <Input value={formData.provincia} onChange={(e) => handleChange("provincia", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Cod. Comune</Label>
                  <Input value={formData.codComune} onChange={(e) => handleChange("codComune", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Data di Nascita</Label>
                  <Input type="date" value={formData.dataNascita} onChange={(e) => handleChange("dataNascita", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Luogo di Nascita</Label>
                  <Input value={formData.luogoNascita} onChange={(e) => handleChange("luogoNascita", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Sesso</Label>
                  <Select value={formData.sesso} onValueChange={(v) => handleChange("sesso", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Maschio</SelectItem>
                      <SelectItem value="F">Femmina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Età</Label>
                  <Input value={formData.eta} readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Allievo</Label>
                  <Input value={formData.allievo} onChange={(e) => handleChange("allievo", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Genitore 1 */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-teal-50 px-2 py-1 rounded">Genitore 1</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Cognome</Label>
                  <Input value={formData.cognomeGen1} onChange={(e) => handleChange("cognomeGen1", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={formData.nomeGen1} onChange={(e) => handleChange("nomeGen1", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Codice Fiscale</Label>
                  <Input value={formData.cfGen1} onChange={(e) => handleChange("cfGen1", e.target.value.toUpperCase())} />
                </div>
                <div className="space-y-2">
                  <Label>Telefono</Label>
                  <Input value={formData.telGen1} onChange={(e) => handleChange("telGen1", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={formData.emailGen1} onChange={(e) => handleChange("emailGen1", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Indirizzo</Label>
                  <Input value={formData.indirizzoGen1} onChange={(e) => handleChange("indirizzoGen1", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>CAP</Label>
                  <Input value={formData.capGen1} onChange={(e) => handleChange("capGen1", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Città</Label>
                  <Input value={formData.cittaGen1} onChange={(e) => handleChange("cittaGen1", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Provincia</Label>
                  <Input value={formData.provinciaGen1} onChange={(e) => handleChange("provinciaGen1", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Cod. Comune</Label>
                  <Input value={formData.codComuneGen1} onChange={(e) => handleChange("codComuneGen1", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Data di Nascita</Label>
                  <Input type="date" value={formData.dataNascitaGen1} onChange={(e) => handleChange("dataNascitaGen1", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Luogo di Nascita</Label>
                  <Input value={formData.luogoNascitaGen1} onChange={(e) => handleChange("luogoNascitaGen1", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Sesso</Label>
                  <Select value={formData.sessoGen1} onValueChange={(v) => handleChange("sessoGen1", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="F">F</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Genitore 2 */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-teal-50 px-2 py-1 rounded">Genitore 2</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Cognome</Label>
                  <Input value={formData.cognomeGen2} onChange={(e) => handleChange("cognomeGen2", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={formData.nomeGen2} onChange={(e) => handleChange("nomeGen2", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Codice Fiscale</Label>
                  <Input value={formData.cfGen2} onChange={(e) => handleChange("cfGen2", e.target.value.toUpperCase())} />
                </div>
                <div className="space-y-2">
                  <Label>Telefono</Label>
                  <Input value={formData.telGen2} onChange={(e) => handleChange("telGen2", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={formData.emailGen2} onChange={(e) => handleChange("emailGen2", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Indirizzo</Label>
                  <Input value={formData.indirizzoGen2} onChange={(e) => handleChange("indirizzoGen2", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>CAP</Label>
                  <Input value={formData.capGen2} onChange={(e) => handleChange("capGen2", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Città</Label>
                  <Input value={formData.cittaGen2} onChange={(e) => handleChange("cittaGen2", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Provincia</Label>
                  <Input value={formData.provinciaGen2} onChange={(e) => handleChange("provinciaGen2", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Cod. Comune</Label>
                  <Input value={formData.codComuneGen2} onChange={(e) => handleChange("codComuneGen2", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Data di Nascita</Label>
                  <Input type="date" value={formData.dataNascitaGen2} onChange={(e) => handleChange("dataNascitaGen2", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Luogo di Nascita</Label>
                  <Input value={formData.luogoNascitaGen2} onChange={(e) => handleChange("luogoNascitaGen2", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Sesso</Label>
                  <Select value={formData.sessoGen2} onValueChange={(v) => handleChange("sessoGen2", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="F">F</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            </CardContent>
          </Card>
        </div>

        {/* PAGAMENTI */}
        <Card id="pagamenti" className="scroll-mt-32">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5" />
              Pagamenti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label>Attività</Label>
                <Input />
              </div>
              <div className="space-y-2">
                <Label>Dettaglio Iscrizione (N)</Label>
                <Input />
              </div>
              <div className="space-y-2">
                <Label>Note Pagamenti (O)</Label>
                <Input />
              </div>
              <div className="space-y-2">
                <Label>Quantità</Label>
                <Input type="number" defaultValue={1} />
              </div>
              <div className="space-y-2">
                <Label>Descrizione Quota (Q)</Label>
                <Input />
              </div>
              <div className="space-y-2">
                <Label>Periodo (R)</Label>
                <Input />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label>Totale Quota (S)</Label>
                <Input type="number" />
              </div>
              <div className="space-y-2">
                <Label>Codice Sconto (T)</Label>
                <Input className="bg-yellow-50 border-yellow-200" />
              </div>
              <div className="space-y-2">
                <Label>Valore Sconto (U)</Label>
                <Input type="number" className="bg-yellow-50 border-yellow-200" />
              </div>
              <div className="space-y-2">
                <Label>% Sconto (V)</Label>
                <Input type="number" className="bg-yellow-50 border-yellow-200" />
              </div>
              <div className="space-y-2">
                <Label>Codici Promo (W)</Label>
                <Input className="bg-yellow-50 border-yellow-200" />
              </div>
              <div className="space-y-2">
                <Label>Valore Promo (X)</Label>
                <Input type="number" className="bg-yellow-50 border-yellow-200" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label>% Promo</Label>
                <Input type="number" className="bg-yellow-50 border-yellow-200" />
              </div>
              <div className="space-y-2">
                <Label>Acconto/Credito (Y)</Label>
                <Input type="number" />
              </div>
              <div className="space-y-2">
                <Label>Data Pagamento (Z)</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Saldo Annuale (AA)</Label>
                <Input type="number" />
              </div>
              <div className="space-y-2">
                <Label>N. Ricevute</Label>
                <Input type="number" />
              </div>
              <div className="space-y-2">
                <Label>Conferma Bonifico</Label>
                <Input type="date" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2 lg:col-span-4">
                <Label>Saldo Totale (BO)</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Totale</Badge>
                  <Input value="€ 0,00" readOnly className="bg-green-50 border-green-200 font-bold text-lg max-w-xs" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GIFT - BUONO - RESO - HELLO GEM */}
        <Card id="gift" className="scroll-mt-32">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="w-5 h-5" />
              Gift - Buono - Reso - Hello Gem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gift">Gift Card</SelectItem>
                    <SelectItem value="buono">Buono</SelectItem>
                    <SelectItem value="reso">Reso</SelectItem>
                    <SelectItem value="hellogem">Hello Gem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valore/Importo</Label>
                <Input type="number" />
              </div>
              <div className="space-y-2">
                <Label>Numero</Label>
                <Input />
              </div>
              <div className="space-y-2">
                <Label>Data Emissione</Label>
                <Input type="date" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Data Scadenza</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Acquistato/Utilizzato per - Motivazione</Label>
                <Input />
              </div>
              <div className="space-y-2">
                <Label>Data Utilizzo/Reso (Convalida)</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>IBAN</Label>
                <Input />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TESSERE */}
        <Card id="tessere" className="scroll-mt-32">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <IdCard className="w-5 h-5" />
              Tessere
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Quota Tessera (BY)</Label>
                <Input type="number" />
              </div>
              <div className="space-y-2">
                <Label>Pagamento Tessera (BZ)</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Nuovo o Rinnovo (CA)</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nuovo">Nuovo</SelectItem>
                    <SelectItem value="rinnovo">Rinnovo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data Scad. Quota Tessera (CB)</Label>
                <Input />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>N. Tessera (CC)</Label>
                <Input />
              </div>
              <div className="space-y-2">
                <Label>Tessera Ente (CD)</Label>
                <Input />
              </div>
              <div className="space-y-2">
                <Label>Domanda di Tesseramento (CE)</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="si">Sì</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CERTIFICATO MEDICO */}
        <Card id="certificato" className="scroll-mt-32">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="w-5 h-5" />
              Certificato Medico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label>Data Scadenza Certificato</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Data di Rinnovo</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Rilasciato Da</Label>
                <Input />
              </div>
              <div className="space-y-2">
                <Label>Pagamento</Label>
                <Input type="number" placeholder="€ 40" />
              </div>
              <div className="space-y-2">
                <Label>A Noi</Label>
                <Input type="number" placeholder="12,5" />
              </div>
              <div className="space-y-2">
                <Label>Tipo Certificato</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="non_agonistico">Sportivo Non Agonistico</SelectItem>
                    <SelectItem value="agonistico">Sportivo Agonistico</SelectItem>
                    <SelectItem value="base">Base</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ATTIVITÀ */}
        <Card id="attivita" className="scroll-mt-32">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5" />
              Attività
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* CORSI */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                Corsi
                <KnowledgeInfo id="corsi" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Codici Corso</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Provenienza</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Iscritti</Label>
                  <Input type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Limite</Label>
                  <Input type="number" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-orange-600" />
                    Attenzione
                  </Label>
                  <Input className="bg-orange-50 border-orange-200" />
                </div>
                <div className="space-y-2">
                  <Label>Importo</Label>
                  <Input type="number" />
                </div>
              </div>
            </div>

            {/* PROVE A PAGAMENTO */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                Prove a Pagamento
                <KnowledgeInfo id="prove-a-pagamento" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Codici Corso</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Iscritti</Label>
                  <Input type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Posti Disp.</Label>
                  <Input type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Presenze</Label>
                  <Input type="number" />
                </div>
              </div>
            </div>

            {/* PROVE GRATUITE */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                Prove Gratuite
                <KnowledgeInfo id="prove-gratuite" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Codici Corso</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Iscritti</Label>
                  <Input type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Posti Disp.</Label>
                  <Input type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Data Prova</Label>
                  <Input type="date" />
                </div>
              </div>
            </div>

            {/* LEZIONI SINGOLE */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                Lezioni Singole
                <KnowledgeInfo id="lezioni-singole" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Codici Corso</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Iscritti</Label>
                  <Input type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Posti Disp.</Label>
                  <Input type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Welfare</Label>
                  <Input type="number" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Presenze</Label>
                  <Input type="number" />
                </div>
              </div>
            </div>

            {/* WORKSHOP */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                Workshop
                <KnowledgeInfo id="workshop" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Codici</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Importo</Label>
                  <Input type="number" />
                </div>
              </div>
            </div>

            {/* DOMENICHE IN MOVIMENTO */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                Domeniche in Movimento
                <KnowledgeInfo id="domeniche-in-movimento" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Codici</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Importo</Label>
                  <Input type="number" />
                </div>
              </div>
            </div>

            {/* ALLENAMENTI */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                Allenamenti
                <KnowledgeInfo id="allenamenti" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Codici</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Presenze</Label>
                  <Input type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Importo</Label>
                  <Input type="number" />
                </div>
              </div>
            </div>

            {/* LEZIONI INDIVIDUALI */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                Lezioni Individuali
                <KnowledgeInfo id="lezioni-individuali" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Codici</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Presenze</Label>
                  <Input type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Importo</Label>
                  <Input type="number" />
                </div>
              </div>
            </div>

            {/* CAMPUS */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                Campus
                <KnowledgeInfo id="campus" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Codici</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Periodo</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Importo</Label>
                  <Input type="number" />
                </div>
              </div>
            </div>

            {/* SAGGI */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                Saggi
                <KnowledgeInfo id="saggi" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Codici</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Importo</Label>
                  <Input type="number" />
                </div>
              </div>
            </div>

            {/* VACANZA STUDIO */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                Vacanze Studio
                <KnowledgeInfo id="vacanze-studio" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Codici</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Periodo</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Importo</Label>
                  <Input type="number" />
                </div>
              </div>
            </div>

            {/* MERCHANDISING */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Merchandising
                <KnowledgeInfo id="merchandising" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Articolo</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Codice</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Taglia</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Quantità</Label>
                  <Input type="number" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Prezzo Unitario</Label>
                  <Input type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Totale</Label>
                  <Input type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Data Acquisto</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Note</Label>
                  <Input />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
