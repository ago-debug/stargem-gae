import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, 
  CreditCard, 
  Gift, 
  IdCard, 
  FileCheck, 
  Activity,
  Save,
  Paperclip,
  Upload,
  Download,
  ShoppingBag,
  FileText
} from "lucide-react";

interface AllegatoState {
  hasFile: boolean;
  [key: string]: string | boolean | number | undefined;
}

interface AllegatiState {
  regolamento: AllegatoState & { data?: string; accettato?: string };
  privacy: AllegatoState & { data?: string; accettata?: string };
  certificatoMedico: AllegatoState & { dataRilascio?: string; scadenza?: string; tipo?: string };
  ricevutePagamenti: AllegatoState & { numeroRicevute?: number; note?: string };
  modelloDetrazione: AllegatoState & { anno?: string; richiesto?: string };
  creditiScolastici: AllegatoState & { annoScolastico?: string; richiesto?: string };
  tesserinoTecnico: AllegatoState & { numero?: string; dataRilascio?: string };
  tesseraEnte: AllegatoState & { numero?: string; ente?: string };
}

export default function Test3Gae() {
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
    stagione: "2024-2025",
    anagrafica: "",
    codiceId: "2425-000001",
    dataInserimento: new Date().toLocaleDateString("it-IT"),
    tipoPartecipante: "tesserato",
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
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const navItems = [
    { id: "intestazione", label: "Intestazione", icon: FileText },
    { id: "anagrafica", label: "Anagrafica", icon: User },
    { id: "pagamenti", label: "Pagamenti", icon: CreditCard },
    { id: "gift", label: "Gift", icon: Gift },
    { id: "tessere", label: "Tessere", icon: IdCard },
    { id: "certificato", label: "Certificato", icon: FileCheck },
    { id: "attivita", label: "Attività", icon: Activity },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Menu */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <h1 className="text-xl font-bold text-primary">Test3 Gae - Scheda Iscrizione</h1>
            <div className="flex items-center gap-2 flex-wrap">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection(item.id)}
                  className="flex items-center gap-1"
                  data-testid={`nav-${item.id}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Button>
              ))}
              <Button size="sm" className="ml-4" data-testid="button-save">
                <Save className="w-4 h-4 mr-2" />
                Salva
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* INTESTAZIONE */}
        <Card id="intestazione" className="scroll-mt-20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" />
              Intestazione
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Stagione</Label>
                <Select value={formData.stagione} onValueChange={(v) => handleChange("stagione", v)}>
                  <SelectTrigger data-testid="select-stagione">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-2025">2024-2025</SelectItem>
                    <SelectItem value="2025-2026">2025-2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Anagrafica</Label>
                <Input value={formData.anagrafica} onChange={(e) => handleChange("anagrafica", e.target.value)} data-testid="input-anagrafica" />
              </div>
              <div className="space-y-2">
                <Label>Codice ID (C)</Label>
                <Input value={formData.codiceId} readOnly className="bg-muted" data-testid="input-codice-id" />
              </div>
              <div className="space-y-2">
                <Label>Data Inserimento</Label>
                <Input value={formData.dataInserimento} readOnly className="bg-muted" data-testid="input-data-inserimento" />
              </div>
              <div className="space-y-2">
                <Label>Tipo Partecipante</Label>
                <Select value={formData.tipoPartecipante} onValueChange={(v) => handleChange("tipoPartecipante", v)}>
                  <SelectTrigger data-testid="select-tipo-partecipante">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tesserato">Tesserato</SelectItem>
                    <SelectItem value="prova">Prova</SelectItem>
                    <SelectItem value="esterno">Esterno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ANAGRAFICA con ALLEGATI */}
        <div id="anagrafica" className="scroll-mt-20 flex flex-col lg:flex-row gap-4">
          {/* ALLEGATI DA INSERIRE */}
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
                  {allegati.regolamento.hasFile ? <Download className="w-4 h-4 text-green-600" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Data</Label>
                    <Input type="date" className="h-7 text-xs" value={allegati.regolamento.data || ''} onChange={(e) => updateAllegato('regolamento', 'data', e.target.value)} onClick={(e) => e.stopPropagation()} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Accettato</Label>
                    <Select value={allegati.regolamento.accettato || ''} onValueChange={(v) => updateAllegato('regolamento', 'accettato', v)}>
                      <SelectTrigger className="h-7 text-xs" onClick={(e) => e.stopPropagation()}><SelectValue placeholder="Seleziona" /></SelectTrigger>
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
                  {allegati.privacy.hasFile ? <Download className="w-4 h-4 text-green-600" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Data</Label>
                    <Input type="date" className="h-7 text-xs" value={allegati.privacy.data || ''} onChange={(e) => updateAllegato('privacy', 'data', e.target.value)} onClick={(e) => e.stopPropagation()} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Accettata</Label>
                    <Select value={allegati.privacy.accettata || ''} onValueChange={(v) => updateAllegato('privacy', 'accettata', v)}>
                      <SelectTrigger className="h-7 text-xs" onClick={(e) => e.stopPropagation()}><SelectValue placeholder="Seleziona" /></SelectTrigger>
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
                  {allegati.certificatoMedico.hasFile ? <Download className="w-4 h-4 text-green-600" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Data Rilascio</Label>
                    <Input type="date" className="h-7 text-xs" value={allegati.certificatoMedico.dataRilascio || ''} onChange={(e) => updateAllegato('certificatoMedico', 'dataRilascio', e.target.value)} onClick={(e) => e.stopPropagation()} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Scadenza</Label>
                    <Input type="date" className="h-7 text-xs" value={allegati.certificatoMedico.scadenza || ''} onChange={(e) => updateAllegato('certificatoMedico', 'scadenza', e.target.value)} onClick={(e) => e.stopPropagation()} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tipo</Label>
                  <Select value={allegati.certificatoMedico.tipo || ''} onValueChange={(v) => updateAllegato('certificatoMedico', 'tipo', v)}>
                    <SelectTrigger className="h-7 text-xs" onClick={(e) => e.stopPropagation()}><SelectValue placeholder="Tipo" /></SelectTrigger>
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
                  {allegati.ricevutePagamenti.hasFile ? <Download className="w-4 h-4 text-green-600" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">N° Ricevute</Label>
                    <Input type="number" className="h-7 text-xs" value={allegati.ricevutePagamenti.numeroRicevute || 0} onChange={(e) => updateAllegato('ricevutePagamenti', 'numeroRicevute', parseInt(e.target.value) || 0)} onClick={(e) => e.stopPropagation()} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Note</Label>
                    <Input className="h-7 text-xs" value={allegati.ricevutePagamenti.note || ''} onChange={(e) => updateAllegato('ricevutePagamenti', 'note', e.target.value)} onClick={(e) => e.stopPropagation()} />
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
                  {allegati.modelloDetrazione.hasFile ? <Download className="w-4 h-4 text-green-600" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Anno</Label>
                    <Input className="h-7 text-xs" value={allegati.modelloDetrazione.anno || ''} onChange={(e) => updateAllegato('modelloDetrazione', 'anno', e.target.value)} onClick={(e) => e.stopPropagation()} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Richiesto</Label>
                    <Select value={allegati.modelloDetrazione.richiesto || ''} onValueChange={(v) => updateAllegato('modelloDetrazione', 'richiesto', v)}>
                      <SelectTrigger className="h-7 text-xs" onClick={(e) => e.stopPropagation()}><SelectValue placeholder="Seleziona" /></SelectTrigger>
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
                  {allegati.creditiScolastici.hasFile ? <Download className="w-4 h-4 text-green-600" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Anno Scolastico</Label>
                    <Input className="h-7 text-xs" value={allegati.creditiScolastici.annoScolastico || ''} onChange={(e) => updateAllegato('creditiScolastici', 'annoScolastico', e.target.value)} onClick={(e) => e.stopPropagation()} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Richiesto</Label>
                    <Select value={allegati.creditiScolastici.richiesto || ''} onValueChange={(v) => updateAllegato('creditiScolastici', 'richiesto', v)}>
                      <SelectTrigger className="h-7 text-xs" onClick={(e) => e.stopPropagation()}><SelectValue placeholder="Seleziona" /></SelectTrigger>
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
                  {allegati.tesserinoTecnico.hasFile ? <Download className="w-4 h-4 text-green-600" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Numero</Label>
                    <Input className="h-7 text-xs" placeholder="N° Tesserino" value={allegati.tesserinoTecnico.numero || ''} onChange={(e) => updateAllegato('tesserinoTecnico', 'numero', e.target.value)} onClick={(e) => e.stopPropagation()} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Data Rilascio</Label>
                    <Input type="date" className="h-7 text-xs" value={allegati.tesserinoTecnico.dataRilascio || ''} onChange={(e) => updateAllegato('tesserinoTecnico', 'dataRilascio', e.target.value)} onClick={(e) => e.stopPropagation()} />
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
                  {allegati.tesseraEnte.hasFile ? <Download className="w-4 h-4 text-green-600" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Numero</Label>
                    <Input className="h-7 text-xs" placeholder="N° Tessera" value={allegati.tesseraEnte.numero || ''} onChange={(e) => updateAllegato('tesseraEnte', 'numero', e.target.value)} onClick={(e) => e.stopPropagation()} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Ente</Label>
                    <Input className="h-7 text-xs" placeholder="Ente" value={allegati.tesseraEnte.ente || ''} onChange={(e) => updateAllegato('tesseraEnte', 'ente', e.target.value)} onClick={(e) => e.stopPropagation()} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ANAGRAFICA */}
          <Card className="flex-1">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5" />
                Anagrafica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2">Dati Personali</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>Cognome *</Label>
                    <Input value={formData.cognome} onChange={(e) => handleChange("cognome", e.target.value)} data-testid="input-cognome" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input value={formData.nome} onChange={(e) => handleChange("nome", e.target.value)} data-testid="input-nome" />
                  </div>
                  <div className="space-y-2">
                    <Label>Codice Fiscale (J)</Label>
                    <Input value={formData.codiceFiscale} onChange={(e) => handleChange("codiceFiscale", e.target.value.toUpperCase())} className="bg-yellow-50 border-yellow-200" data-testid="input-codice-fiscale" />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefono</Label>
                    <Input value={formData.telefono} onChange={(e) => handleChange("telefono", e.target.value)} data-testid="input-telefono" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} data-testid="input-email" />
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
                      <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
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
            </CardContent>
          </Card>
        </div>

        {/* PAGAMENTI */}
        <Card id="pagamenti" className="scroll-mt-20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5" />
              Pagamenti
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                <Label>Quantità</Label>
                <Input type="number" defaultValue={1} />
              </div>
              <div className="space-y-2">
                <Label>Totale Quota (S)</Label>
                <Input type="number" />
              </div>
              <div className="space-y-2">
                <Label>Codice Sconto (T)</Label>
                <Input className="bg-yellow-50 border-yellow-200" />
              </div>
              <div className="space-y-2">
                <Label>Importo Saldato</Label>
                <Input type="number" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GIFT */}
        <Card id="gift" className="scroll-mt-20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="w-5 h-5" />
              Gift / Promozioni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Tipo Gift</Label>
                <Input />
              </div>
              <div className="space-y-2">
                <Label>Valore</Label>
                <Input type="number" />
              </div>
              <div className="space-y-2">
                <Label>Data Scadenza</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Note</Label>
                <Input />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TESSERE */}
        <Card id="tessere" className="scroll-mt-20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <IdCard className="w-5 h-5" />
              Tessere
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Numero Tessera</Label>
                <Input />
              </div>
              <div className="space-y-2">
                <Label>Tipo Tessera</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data Emissione</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Data Scadenza</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Stato</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attiva">Attiva</SelectItem>
                    <SelectItem value="sospesa">Sospesa</SelectItem>
                    <SelectItem value="scaduta">Scaduta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CERTIFICATO */}
        <Card id="certificato" className="scroll-mt-20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileCheck className="w-5 h-5" />
              Certificato Medico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Tipo Certificato</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="non_agonistico">Non Agonistico</SelectItem>
                    <SelectItem value="agonistico">Agonistico</SelectItem>
                    <SelectItem value="base">Base</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data Rilascio</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Data Scadenza</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Medico</Label>
                <Input />
              </div>
              <div className="space-y-2">
                <Label>Note</Label>
                <Input />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ATTIVITÀ */}
        <Card id="attivita" className="scroll-mt-20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5" />
              Attività
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* CORSI */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">Corsi</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Nome Corso</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Giorno</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Orario</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Insegnante</Label>
                  <Input />
                </div>
              </div>
            </div>

            {/* WORKSHOP */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">Workshop</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Nome Workshop</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Orario</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Insegnante</Label>
                  <Input />
                </div>
              </div>
            </div>

            {/* MERCHANDISING */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Merchandising
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Articolo</Label>
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
                <div className="space-y-2">
                  <Label>Prezzo</Label>
                  <Input type="number" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
