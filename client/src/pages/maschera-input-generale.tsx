import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Upload, Download, Paperclip, Search, Plus, Save, FileSpreadsheet, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";
import { 
  FileText, Users, CreditCard, Gift, IdCard, Stethoscope, Activity,
  User, BookOpen, ShoppingBag, Calendar, Sparkles, Sun, Dumbbell, UserCheck, Award, Music
} from "lucide-react";
import { Link } from "wouter";
import { KnowledgeInfo } from "@/components/knowledge-info";
import { MultiSelectPaymentNotes } from "@/components/multi-select-payment-notes";

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

export default function MascheraInputGenerale() {
  const [allegati, setAllegati] = useState<AllegatiState>({
    regolamento: { hasFile: false, data: "", accettato: "" },
    privacy: { hasFile: false, data: "", accettata: "" },
    certificatoMedico: { hasFile: false, dataRilascio: "", scadenza: "", tipo: "" },
    ricevutePagamenti: { hasFile: false, numeroRicevute: 0, note: "" },
    modelloDetrazione: { hasFile: false, anno: "2026", richiesto: "" },
    creditiScolastici: { hasFile: false, annoScolastico: "2025/2026", richiesto: "" },
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
    stagione: "2025-2026",
    anagrafica: "",
    codiceId: "2526-000001",
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
    provinciaNascita: "",
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
    provinciaNascitaGen1: "",
    sessoGen1: "",
    etaGen1: "",
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
    provinciaNascitaGen2: "",
    sessoGen2: "",
    etaGen2: "",
  });

  // Stato attività selezionata nei pagamenti e corsi dal DB
  const [pagamentoAttivita, setPagamentoAttivita] = useState("");
  const [pagamentoDettaglio, setPagamentoDettaglio] = useState("");
  const [corsiDB, setCorsiDB] = useState<{id: number; name: string; sku: string}[]>([]);
  const [categorieDB, setCategorieDB] = useState<{id: number; name: string}[]>([]);
  const [workshopCategorieDB, setWorkshopCategorieDB] = useState<{id: number; name: string}[]>([]);
  const [domenicheCategorieDB, setDomenicheCategorieDB] = useState<{id: number; name: string}[]>([]);
  const [allenamentiCategorieDB, setAllenamentiCategorieDB] = useState<{id: number; name: string}[]>([]);
  const [lezioniIndCategorieDB, setLezioniIndCategorieDB] = useState<{id: number; name: string}[]>([]);
  const [campusCategorieDB, setCampusCategorieDB] = useState<{id: number; name: string}[]>([]);
  const [saggiCategorieDB, setSaggiCategorieDB] = useState<{id: number; name: string}[]>([]);
  const [vacanzeCategorieDB, setVacanzeCategorieDB] = useState<{id: number; name: string}[]>([]);
  const [partecipanteCategorieDB, setPartecipanteCategorieDB] = useState<{id: number; name: string}[]>([]);
  const [selectedPaymentNotes, setSelectedPaymentNotes] = useState<string[]>([]);

  // Stato campi Corso e Codice per ogni sotto-sezione Attività
  const attivitaKeys = ["corsi", "prove-pagamento", "prove-gratuite", "lezioni-singole", "workshop", "domeniche-movimento", "allenamenti", "lezioni-individuali", "campus", "saggi"] as const;
  type AttivitaKey = typeof attivitaKeys[number];
  const [attivitaCorso, setAttivitaCorso] = useState<Record<AttivitaKey, string>>({
    "corsi": "", "prove-pagamento": "", "prove-gratuite": "", "lezioni-singole": "",
    "workshop": "", "domeniche-movimento": "", "allenamenti": "", "lezioni-individuali": "",
    "campus": "", "saggi": "",
  });
  const [attivitaCodice, setAttivitaCodice] = useState<Record<AttivitaKey, string>>({
    "corsi": "", "prove-pagamento": "", "prove-gratuite": "", "lezioni-singole": "",
    "workshop": "", "domeniche-movimento": "", "allenamenti": "", "lezioni-individuali": "",
    "campus": "", "saggi": "",
  });

  const handlePagamentoDettaglio = (corsoId: string) => {
    setPagamentoDettaglio(corsoId);
    if (pagamentoAttivita && corsoId) {
      const corso = corsiDB.find(c => String(c.id) === corsoId);
      if (corso) {
        const key = pagamentoAttivita as AttivitaKey;
        setAttivitaCorso(prev => ({ ...prev, [key]: String(corso.id) }));
        setAttivitaCodice(prev => ({ ...prev, [key]: corso.sku }));
      }
    }
  };

  useEffect(() => {
    fetch("/api/courses")
      .then(res => res.ok ? res.json() : [])
      .then(data => setCorsiDB(data))
      .catch(() => setCorsiDB([]));
    fetch("/api/categories")
      .then(res => res.ok ? res.json() : [])
      .then(data => setCategorieDB(data))
      .catch(() => setCategorieDB([]));
    fetch("/api/workshop-categories")
      .then(res => res.ok ? res.json() : [])
      .then(data => setWorkshopCategorieDB(data))
      .catch(() => setWorkshopCategorieDB([]));
    fetch("/api/sunday-categories")
      .then(res => res.ok ? res.json() : [])
      .then(data => setDomenicheCategorieDB(data))
      .catch(() => setDomenicheCategorieDB([]));
    fetch("/api/training-categories")
      .then(res => res.ok ? res.json() : [])
      .then(data => setAllenamentiCategorieDB(data))
      .catch(() => setAllenamentiCategorieDB([]));
    fetch("/api/individual-lesson-categories")
      .then(res => res.ok ? res.json() : [])
      .then(data => setLezioniIndCategorieDB(data))
      .catch(() => setLezioniIndCategorieDB([]));
    fetch("/api/campus-categories")
      .then(res => res.ok ? res.json() : [])
      .then(data => setCampusCategorieDB(data))
      .catch(() => setCampusCategorieDB([]));
    fetch("/api/recital-categories")
      .then(res => res.ok ? res.json() : [])
      .then(data => setSaggiCategorieDB(data))
      .catch(() => setSaggiCategorieDB([]));
    fetch("/api/vacation-categories")
      .then(res => res.ok ? res.json() : [])
      .then(data => setVacanzeCategorieDB(data))
      .catch(() => setVacanzeCategorieDB([]));
    fetch("/api/client-categories")
      .then(res => res.ok ? res.json() : [])
      .then(data => setPartecipanteCategorieDB(data))
      .catch(() => setPartecipanteCategorieDB([]));
  }, []);

  // Stato verifica telefoni ed email
  const [verificaStato, setVerificaStato] = useState({
    telefono: false,
    email: false,
    telGen1: false,
    emailGen1: false,
    telGen2: false,
    emailGen2: false,
  });

  const toggleVerifica = (campo: keyof typeof verificaStato) => {
    setVerificaStato(prev => ({ ...prev, [campo]: !prev[campo] }));
  };

  // Funzione per avviare la verifica (simulata per ora, poi collegheremo Twilio/SMTP)
  const avviaVerifica = (campo: keyof typeof verificaStato, tipo: 'telefono' | 'email') => {
    const valore = tipo === 'telefono' 
      ? (campo === 'telefono' ? formData.telefono : campo === 'telGen1' ? formData.telGen1 : formData.telGen2)
      : (campo === 'email' ? formData.email : campo === 'emailGen1' ? formData.emailGen1 : formData.emailGen2);
    
    if (!valore) {
      alert(`Inserisci prima ${tipo === 'telefono' ? 'il numero di telefono' : "l'indirizzo email"}`);
      return;
    }
    
    // Simulazione verifica (in futuro: Twilio per SMS/WhatsApp, SMTP per email)
    const conferma = window.confirm(
      tipo === 'telefono' 
        ? `Inviare SMS di verifica a ${valore}?\n\n(Funzionalità da collegare con Twilio)`
        : `Inviare email di verifica a ${valore}?\n\n(Funzionalità da collegare con SMTP)`
    );
    
    if (conferma) {
      // Per ora simuliamo il successo della verifica
      setTimeout(() => {
        setVerificaStato(prev => ({ ...prev, [campo]: true }));
        alert(`${tipo === 'telefono' ? 'Telefono' : 'Email'} verificato con successo!`);
      }, 500);
    }
  };

  // Funzione per decodificare il codice fiscale italiano
  const decodeFiscalCode = (cf: string) => {
    if (!cf || cf.length !== 16) return null;
    
    const monthMap: { [key: string]: number } = {
      'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'H': 6,
      'L': 7, 'M': 8, 'P': 9, 'R': 10, 'S': 11, 'T': 12
    };
    
    try {
      // Anno (caratteri 6-7)
      const yearCode = parseInt(cf.substring(6, 8));
      const currentYear = new Date().getFullYear();
      const century = yearCode > (currentYear % 100) + 10 ? 1900 : 2000;
      const year = century + yearCode;
      
      // Mese (carattere 8)
      const monthChar = cf.charAt(8).toUpperCase();
      const month = monthMap[monthChar] || 1;
      
      // Giorno e sesso (caratteri 9-10)
      let day = parseInt(cf.substring(9, 11));
      const sesso = day > 40 ? 'F' : 'M';
      if (day > 40) day -= 40;
      
      // Data di nascita formattata
      const dataNascita = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      // Codice comune (caratteri 11-15)
      const codiceComune = cf.substring(11, 15).toUpperCase();
      
      // Calcola età
      const birthDate = new Date(dataNascita);
      const today = new Date();
      let eta = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        eta--;
      }
      
      return { dataNascita, sesso, eta: eta.toString(), codiceComune };
    } catch (e) {
      return null;
    }
  };

  // Funzione per cercare il comune dal codice catastale
  const fetchComuneFromCode = async (codice: string) => {
    try {
      const response = await fetch(`/api/comuni/by-code/${codice}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (e) {
      console.error("Errore nel recupero del comune:", e);
    }
    return null;
  };

  const handleChange = async (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Auto-popola i campi quando viene inserito il codice fiscale
    if (field === "codiceFiscale") {
      if (value.length === 16) {
        const decoded = decodeFiscalCode(value);
        if (decoded) {
          const comuneData = await fetchComuneFromCode(decoded.codiceComune);
          setFormData((prev) => ({
            ...prev,
            dataNascita: decoded.dataNascita,
            sesso: decoded.sesso,
            eta: decoded.eta,
            luogoNascita: comuneData?.nome || "",
            provinciaNascita: comuneData?.provincia || "",
          }));
        }
      } else {
        // Svuota i campi se il CF viene cancellato o non è completo
        setFormData((prev) => ({
          ...prev,
          dataNascita: "",
          sesso: "",
          eta: "",
          luogoNascita: "",
          provinciaNascita: "",
        }));
      }
    }
    
    if (field === "cfGen1") {
      if (value.length === 16) {
        const decoded = decodeFiscalCode(value);
        if (decoded) {
          const comuneData = await fetchComuneFromCode(decoded.codiceComune);
          setFormData((prev) => ({
            ...prev,
            dataNascitaGen1: decoded.dataNascita,
            sessoGen1: decoded.sesso,
            etaGen1: decoded.eta,
            luogoNascitaGen1: comuneData?.nome || "",
            provinciaNascitaGen1: comuneData?.provincia || "",
          }));
        }
      } else {
        // Svuota i campi se il CF viene cancellato o non è completo
        setFormData((prev) => ({
          ...prev,
          dataNascitaGen1: "",
          sessoGen1: "",
          etaGen1: "",
          luogoNascitaGen1: "",
          provinciaNascitaGen1: "",
        }));
      }
    }
    
    if (field === "cfGen2") {
      if (value.length === 16) {
        const decoded = decodeFiscalCode(value);
        if (decoded) {
          const comuneData = await fetchComuneFromCode(decoded.codiceComune);
          setFormData((prev) => ({
            ...prev,
            dataNascitaGen2: decoded.dataNascita,
            sessoGen2: decoded.sesso,
            etaGen2: decoded.eta,
            luogoNascitaGen2: comuneData?.nome || "",
            provinciaNascitaGen2: comuneData?.provincia || "",
          }));
        }
      } else {
        // Svuota i campi se il CF viene cancellato o non è completo
        setFormData((prev) => ({
          ...prev,
          dataNascitaGen2: "",
          sessoGen2: "",
          etaGen2: "",
          luogoNascitaGen2: "",
          provinciaNascitaGen2: "",
        }));
      }
    }
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
    <div className="flex flex-col h-full" data-testid="page-maschera-input-generale">
      {/* Header fisso con navigazione */}
      <div className="border-b bg-muted/30 sticky top-0 z-10">
        <div className="p-4 space-y-4">
          {/* Riga titolo e pulsanti azioni */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Maschera Input Generale</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Inserimento e interrogazione dati</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="text-xs h-8 bg-background" data-testid="button-gsheets">
                <FileSpreadsheet className="w-3 h-3 mr-1 sidebar-icon-gold" />
                GSheets
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8 bg-background" data-testid="button-pulisci">
                <RotateCcw className="w-3 h-3 mr-1 sidebar-icon-gold" />
                Pulisci
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8 bg-background" data-testid="button-esporta">
                <Upload className="w-3 h-3 mr-1 sidebar-icon-gold" />
                Esporta
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8 bg-background" data-testid="button-importa">
                <Download className="w-3 h-3 mr-1 sidebar-icon-gold" />
                Importa
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8 bg-background" data-testid="button-salva">
                <Save className="w-3 h-3 mr-1 sidebar-icon-gold" />
                Salva
              </Button>
              <Button size="sm" className="gold-3d-button" data-testid="button-nuovo">
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
                <item.icon className="w-3 h-3 mr-1 sidebar-icon-gold" />
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
              <FileText className="w-5 h-5 sidebar-icon-gold" />
              Intestazione
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Stagione</Label>
                <Select value={formData.stagione} onValueChange={(v) => handleChange("stagione", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-2025">2024-2025</SelectItem>
                    <SelectItem value="2025-2026">2025-2026</SelectItem>
                    <SelectItem value="2026-2027">2026-2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Input 
                  value={formData.anagrafica}
                  onChange={(e) => handleChange("anagrafica", e.target.value)}
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
                <Select value={formData.teamSegreteria} onValueChange={(v) => handleChange("teamSegreteria", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mario">Mario</SelectItem>
                    <SelectItem value="giovanni">Giovanni</SelectItem>
                    <SelectItem value="laura">Laura</SelectItem>
                    <SelectItem value="anna">Anna</SelectItem>
                    <SelectItem value="marco">Marco</SelectItem>
                  </SelectContent>
                </Select>
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
                    <Label className="text-xs">Data Inserimento</Label>
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
                    <Label className="text-xs">Data Inserimento</Label>
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
                <User className="w-5 h-5 sidebar-icon-gold" />
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
                  <div className="flex items-center gap-1">
                    <Label>Telefono</Label>
                    <span 
                      className="ml-1 cursor-help"
                      title={verificaStato.telefono ? "Verificato" : "Da verificare - clicca il bottone per verificare"}
                    >
                      {verificaStato.telefono ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
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
                  <Input 
                    value={formData.telefono} 
                    onChange={(e) => handleChange("telefono", e.target.value)} 
                    className={verificaStato.telefono ? "bg-green-50 border-green-300" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label>Email</Label>
                    <span 
                      className="ml-1 cursor-help"
                      title={verificaStato.email ? "Verificato" : "Da verificare - clicca il bottone per verificare"}
                    >
                      {verificaStato.email ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
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
                  <Input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => handleChange("email", e.target.value)} 
                    className={verificaStato.email ? "bg-green-50 border-green-300" : ""}
                  />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Data di Nascita</Label>
                  <Input 
                    value={formData.dataNascita ? new Date(formData.dataNascita).toLocaleDateString('it-IT') : ''} 
                    readOnly
                    className={`${formData.codiceFiscale ? 'bg-yellow-50 border-yellow-300' : 'border-red-400 bg-red-50'}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Luogo di Nascita</Label>
                  <Input 
                    value={formData.luogoNascita} 
                    readOnly
                    className={`${formData.codiceFiscale ? 'bg-yellow-50 border-yellow-300' : 'border-red-400 bg-red-50'}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prov. Nascita</Label>
                  <Input 
                    value={formData.provinciaNascita} 
                    readOnly
                    className={`${formData.codiceFiscale ? 'bg-yellow-50 border-yellow-300' : 'border-red-400 bg-red-50'}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sesso</Label>
                  <Input 
                    value={formData.sesso === 'M' ? 'Maschio' : formData.sesso === 'F' ? 'Femmina' : ''} 
                    readOnly
                    className={`${formData.codiceFiscale ? 'bg-yellow-50 border-yellow-300' : 'border-red-400 bg-red-50'}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Età</Label>
                  <Input 
                    value={formData.eta} 
                    readOnly 
                    className={`${formData.codiceFiscale ? 'bg-yellow-50 border-yellow-300' : 'border-red-400 bg-red-50'}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Partecipante</Label>
                  <Select value={formData.allievo} onValueChange={(v) => handleChange("allievo", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {partecipanteCategorieDB.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <div className="flex items-center gap-1">
                    <Label>Telefono</Label>
                    <span 
                      className="ml-1 cursor-help"
                      title={verificaStato.telGen1 ? "Verificato" : "Da verificare - clicca il bottone per verificare"}
                    >
                      {verificaStato.telGen1 ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-orange-400" />
                      )}
                    </span>
                    {!verificaStato.telGen1 && (
                      <Button 
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-5 px-2 text-xs ml-1"
                        onClick={() => avviaVerifica('telGen1', 'telefono')}
                      >
                        Verifica
                      </Button>
                    )}
                  </div>
                  <Input 
                    value={formData.telGen1} 
                    onChange={(e) => handleChange("telGen1", e.target.value)} 
                    className={verificaStato.telGen1 ? "bg-green-50 border-green-300" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label>Email</Label>
                    <span 
                      className="ml-1 cursor-help"
                      title={verificaStato.emailGen1 ? "Verificato" : "Da verificare - clicca il bottone per verificare"}
                    >
                      {verificaStato.emailGen1 ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-orange-400" />
                      )}
                    </span>
                    {!verificaStato.emailGen1 && (
                      <Button 
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-5 px-2 text-xs ml-1"
                        onClick={() => avviaVerifica('emailGen1', 'email')}
                      >
                        Verifica
                      </Button>
                    )}
                  </div>
                  <Input 
                    value={formData.emailGen1} 
                    onChange={(e) => handleChange("emailGen1", e.target.value)} 
                    className={verificaStato.emailGen1 ? "bg-green-50 border-green-300" : ""}
                  />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Data di Nascita</Label>
                  <Input 
                    value={formData.dataNascitaGen1 ? new Date(formData.dataNascitaGen1).toLocaleDateString('it-IT') : ''} 
                    readOnly
                    className={`${formData.cfGen1 ? 'bg-yellow-50 border-yellow-300' : 'border-red-400 bg-red-50'}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Luogo di Nascita</Label>
                  <Input 
                    value={formData.luogoNascitaGen1} 
                    readOnly
                    className={`${formData.cfGen1 ? 'bg-yellow-50 border-yellow-300' : 'border-red-400 bg-red-50'}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prov. Nascita</Label>
                  <Input 
                    value={formData.provinciaNascitaGen1} 
                    readOnly
                    className={`${formData.cfGen1 ? 'bg-yellow-50 border-yellow-300' : 'border-red-400 bg-red-50'}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sesso</Label>
                  <Input 
                    value={formData.sessoGen1 === 'M' ? 'M' : formData.sessoGen1 === 'F' ? 'F' : ''} 
                    readOnly
                    className={`${formData.cfGen1 ? 'bg-yellow-50 border-yellow-300' : 'border-red-400 bg-red-50'}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Età</Label>
                  <Input 
                    value={formData.etaGen1} 
                    readOnly 
                    className={`${formData.cfGen1 ? 'bg-yellow-50 border-yellow-300' : 'border-red-400 bg-red-50'}`}
                  />
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
                  <div className="flex items-center gap-1">
                    <Label>Telefono</Label>
                    <span 
                      className="ml-1 cursor-help"
                      title={verificaStato.telGen2 ? "Verificato" : "Da verificare - clicca il bottone per verificare"}
                    >
                      {verificaStato.telGen2 ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-orange-400" />
                      )}
                    </span>
                    {!verificaStato.telGen2 && (
                      <Button 
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-5 px-2 text-xs ml-1"
                        onClick={() => avviaVerifica('telGen2', 'telefono')}
                      >
                        Verifica
                      </Button>
                    )}
                  </div>
                  <Input 
                    value={formData.telGen2} 
                    onChange={(e) => handleChange("telGen2", e.target.value)} 
                    className={verificaStato.telGen2 ? "bg-green-50 border-green-300" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label>Email</Label>
                    <span 
                      className="ml-1 cursor-help"
                      title={verificaStato.emailGen2 ? "Verificato" : "Da verificare - clicca il bottone per verificare"}
                    >
                      {verificaStato.emailGen2 ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-orange-400" />
                      )}
                    </span>
                    {!verificaStato.emailGen2 && (
                      <Button 
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-5 px-2 text-xs ml-1"
                        onClick={() => avviaVerifica('emailGen2', 'email')}
                      >
                        Verifica
                      </Button>
                    )}
                  </div>
                  <Input 
                    value={formData.emailGen2} 
                    onChange={(e) => handleChange("emailGen2", e.target.value)} 
                    className={verificaStato.emailGen2 ? "bg-green-50 border-green-300" : ""}
                  />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Data di Nascita</Label>
                  <Input 
                    value={formData.dataNascitaGen2 ? new Date(formData.dataNascitaGen2).toLocaleDateString('it-IT') : ''} 
                    readOnly
                    className={`${formData.cfGen2 ? 'bg-yellow-50 border-yellow-300' : 'border-red-400 bg-red-50'}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Luogo di Nascita</Label>
                  <Input 
                    value={formData.luogoNascitaGen2} 
                    readOnly
                    className={`${formData.cfGen2 ? 'bg-yellow-50 border-yellow-300' : 'border-red-400 bg-red-50'}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prov. Nascita</Label>
                  <Input 
                    value={formData.provinciaNascitaGen2} 
                    readOnly
                    className={`${formData.cfGen2 ? 'bg-yellow-50 border-yellow-300' : 'border-red-400 bg-red-50'}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sesso</Label>
                  <Input 
                    value={formData.sessoGen2 === 'M' ? 'M' : formData.sessoGen2 === 'F' ? 'F' : ''} 
                    readOnly
                    className={`${formData.cfGen2 ? 'bg-yellow-50 border-yellow-300' : 'border-red-400 bg-red-50'}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Età</Label>
                  <Input 
                    value={formData.etaGen2} 
                    readOnly 
                    className={`${formData.cfGen2 ? 'bg-yellow-50 border-yellow-300' : 'border-red-400 bg-red-50'}`}
                  />
                </div>
              </div>
            </div>
            </CardContent>
          </Card>
        </div>

        {/* PAGAMENTI */}
        <Card id="pagamenti" className="scroll-mt-32">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between gap-2 text-lg">
              <span className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 sidebar-icon-gold" />
                Pagamenti
              </span>
              <Button size="sm" className="gold-3d-button" data-testid="button-aggiungi-pagamento">
                <Plus className="w-4 h-4" />
                Aggiungi
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label>Attività</Label>
                <Select value={pagamentoAttivita} onValueChange={setPagamentoAttivita}>
                  <SelectTrigger data-testid="select-attivita-pagamenti">
                    <SelectValue placeholder="Seleziona attività" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corsi">Corsi</SelectItem>
                    <SelectItem value="prove-pagamento">Prove a Pagamento</SelectItem>
                    <SelectItem value="prove-gratuite">Prove Gratuite</SelectItem>
                    <SelectItem value="lezioni-singole">Lezioni Singole</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="domeniche-movimento">Domeniche in Movimento</SelectItem>
                    <SelectItem value="allenamenti">Allenamenti/Affitti</SelectItem>
                    <SelectItem value="lezioni-individuali">Lezioni Individuali</SelectItem>
                    <SelectItem value="campus">Campus</SelectItem>
                    <SelectItem value="saggi">Saggi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dettaglio Attività e codice</Label>
                <Select value={pagamentoDettaglio} onValueChange={handlePagamentoDettaglio}>
                  <SelectTrigger data-testid="select-dettaglio-attivita-pagamenti">
                    <SelectValue placeholder="Seleziona dettaglio" />
                  </SelectTrigger>
                  <SelectContent>
                    {corsiDB.length > 0 ? (
                      corsiDB.map((corso) => (
                        <SelectItem key={corso.id} value={corso.id.toString()}>
                          {corso.name} - {corso.sku}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="nessuno" disabled>Nessuna attività disponibile</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dettaglio Iscrizione (N)</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona dettaglio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iscritto_donna">iscritto Donna</SelectItem>
                    <SelectItem value="deve_pagare_d">deve pagare D</SelectItem>
                    <SelectItem value="deve_pagare_u">deve pagare U</SelectItem>
                    <SelectItem value="iscritto_donna_2">iscritto Donna</SelectItem>
                    <SelectItem value="iscritto_uomo">iscritto Uomo</SelectItem>
                    <SelectItem value="iscritto_welfare">iscritto welfare</SelectItem>
                    <SelectItem value="lezione_welfare">lezione welfare</SelectItem>
                    <SelectItem value="prova_donna">prova Donna</SelectItem>
                    <SelectItem value="prova_pagata_d">prova pagata D</SelectItem>
                    <SelectItem value="prova_pagata_u">prova pagata U</SelectItem>
                    <SelectItem value="prova_uomo">prova Uomo</SelectItem>
                    <SelectItem value="tessera">tessera</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <MultiSelectPaymentNotes
                  selectedNotes={selectedPaymentNotes}
                  onChange={setSelectedPaymentNotes}
                  testIdPrefix="payment-note"
                />
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
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Totale</Badge>
                  <Input value="€ 0,00" readOnly className="bg-yellow-50 border-yellow-200 font-bold text-lg max-w-xs" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GIFT - BUONO - RESO - HELLO GEM */}
        <Card id="gift" className="scroll-mt-32">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between gap-2 text-lg">
              <span className="flex items-center gap-2">
                <Gift className="w-5 h-5 sidebar-icon-gold" />
                Gift - Buono - Reso - Hello Gem
              </span>
              <Button size="sm" className="gold-3d-button" data-testid="button-aggiungi-gift">
                <Plus className="w-4 h-4" />
                Aggiungi
              </Button>
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
              <IdCard className="w-5 h-5 sidebar-icon-gold" />
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
              <Stethoscope className="w-5 h-5 sidebar-icon-gold" />
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
              <BookOpen className="w-5 h-5 sidebar-icon-gold" />
              Attività
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* CORSI */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                <Calendar className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/corsi" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-corsi">Corsi</Link>
                <KnowledgeInfo id="corsi" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorieDB.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Corso</Label>
                  <Select value={attivitaCorso["corsi"]} onValueChange={(v) => setAttivitaCorso(prev => ({ ...prev, "corsi": v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona corso" />
                    </SelectTrigger>
                    <SelectContent>
                      {corsiDB.map((corso) => (
                        <SelectItem key={corso.id} value={String(corso.id)}>
                          {corso.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Codice Corso</Label>
                  <Select value={attivitaCodice["corsi"]} onValueChange={(v) => setAttivitaCodice(prev => ({ ...prev, "corsi": v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona codice" />
                    </SelectTrigger>
                    <SelectContent>
                      {corsiDB.map((corso) => (
                        <SelectItem key={corso.id} value={corso.sku}>
                          {corso.sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <CreditCard className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/prove-pagamento" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-prove-pagamento">Prove a Pagamento</Link>
                <KnowledgeInfo id="prove-a-pagamento" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorieDB.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Corso</Label>
                  <Select value={attivitaCorso["prove-pagamento"]} onValueChange={(v) => setAttivitaCorso(prev => ({ ...prev, "prove-pagamento": v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona corso" />
                    </SelectTrigger>
                    <SelectContent>
                      {corsiDB.map((corso) => (
                        <SelectItem key={corso.id} value={String(corso.id)}>
                          {corso.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Codice Corso</Label>
                  <Select value={attivitaCodice["prove-pagamento"]} onValueChange={(v) => setAttivitaCodice(prev => ({ ...prev, "prove-pagamento": v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona codice" />
                    </SelectTrigger>
                    <SelectContent>
                      {corsiDB.map((corso) => (
                        <SelectItem key={corso.id} value={corso.sku}>
                          {corso.sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Gift className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/prove-gratuite" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-prove-gratuite">Prove Gratuite</Link>
                <KnowledgeInfo id="prove-gratuite" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorieDB.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Corso</Label>
                  <Select value={attivitaCorso["prove-gratuite"]} onValueChange={(v) => setAttivitaCorso(prev => ({ ...prev, "prove-gratuite": v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona corso" />
                    </SelectTrigger>
                    <SelectContent>
                      {corsiDB.map((corso) => (
                        <SelectItem key={corso.id} value={String(corso.id)}>
                          {corso.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Codice Corso</Label>
                  <Select value={attivitaCodice["prove-gratuite"]} onValueChange={(v) => setAttivitaCodice(prev => ({ ...prev, "prove-gratuite": v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona codice" />
                    </SelectTrigger>
                    <SelectContent>
                      {corsiDB.map((corso) => (
                        <SelectItem key={corso.id} value={corso.sku}>
                          {corso.sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <BookOpen className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/lezioni-singole" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-lezioni-singole">Lezioni Singole</Link>
                <KnowledgeInfo id="lezioni-singole" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorieDB.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Corso</Label>
                  <Select value={attivitaCorso["lezioni-singole"]} onValueChange={(v) => setAttivitaCorso(prev => ({ ...prev, "lezioni-singole": v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona corso" />
                    </SelectTrigger>
                    <SelectContent>
                      {corsiDB.map((corso) => (
                        <SelectItem key={corso.id} value={String(corso.id)}>
                          {corso.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Codice Corso</Label>
                  <Select value={attivitaCodice["lezioni-singole"]} onValueChange={(v) => setAttivitaCodice(prev => ({ ...prev, "lezioni-singole": v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona codice" />
                    </SelectTrigger>
                    <SelectContent>
                      {corsiDB.map((corso) => (
                        <SelectItem key={corso.id} value={corso.sku}>
                          {corso.sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Sparkles className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/workshops" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-workshop">Workshop</Link>
                <KnowledgeInfo id="workshop" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {workshopCategorieDB.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Corso</Label>
                  <Select value={attivitaCorso["workshop"]} onValueChange={(v) => setAttivitaCorso(prev => ({ ...prev, "workshop": v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona corso" />
                    </SelectTrigger>
                    <SelectContent>
                      {corsiDB.map((corso) => (
                        <SelectItem key={corso.id} value={String(corso.id)}>
                          {corso.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Codice</Label>
                  <Select value={attivitaCodice["workshop"]} onValueChange={(v) => setAttivitaCodice(prev => ({ ...prev, "workshop": v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona codice" />
                    </SelectTrigger>
                    <SelectContent>
                      {corsiDB.map((corso) => (
                        <SelectItem key={corso.id} value={corso.sku}>
                          {corso.sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Sun className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/domeniche-movimento" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-domeniche-movimento">Domeniche in Movimento</Link>
                <KnowledgeInfo id="domeniche-in-movimento" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {domenicheCategorieDB.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Corso</Label>
                  <Select value={attivitaCorso["domeniche-movimento"]} onValueChange={(v) => setAttivitaCorso(prev => ({ ...prev, "domeniche-movimento": v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona corso" />
                    </SelectTrigger>
                    <SelectContent>
                      {corsiDB.map((corso) => (
                        <SelectItem key={corso.id} value={String(corso.id)}>
                          {corso.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Codice</Label>
                  <Select value={attivitaCodice["domeniche-movimento"]} onValueChange={(v) => setAttivitaCodice(prev => ({ ...prev, "domeniche-movimento": v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona codice" />
                    </SelectTrigger>
                    <SelectContent>
                      {corsiDB.map((corso) => (
                        <SelectItem key={corso.id} value={corso.sku}>
                          {corso.sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Dumbbell className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/allenamenti" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-allenamenti">Allenamenti/Affitti</Link>
                <KnowledgeInfo id="allenamenti" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {allenamentiCategorieDB.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Corso</Label>
                  <Select value={attivitaCorso["allenamenti"]} onValueChange={(v) => setAttivitaCorso(prev => ({ ...prev, "allenamenti": v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona corso" />
                    </SelectTrigger>
                    <SelectContent>
                      {corsiDB.map((corso) => (
                        <SelectItem key={corso.id} value={String(corso.id)}>
                          {corso.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Codice</Label>
                  <Select value={attivitaCodice["allenamenti"]} onValueChange={(v) => setAttivitaCodice(prev => ({ ...prev, "allenamenti": v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona codice" />
                    </SelectTrigger>
                    <SelectContent>
                      {corsiDB.map((corso) => (
                        <SelectItem key={corso.id} value={corso.sku}>
                          {corso.sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <UserCheck className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/lezioni-individuali" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-lezioni-individuali">Lezioni Individuali</Link>
                <KnowledgeInfo id="lezioni-individuali" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {lezioniIndCategorieDB.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Corso</Label>
                  <Select value={attivitaCorso["lezioni-individuali"]} onValueChange={(v) => setAttivitaCorso(prev => ({ ...prev, "lezioni-individuali": v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona corso" />
                    </SelectTrigger>
                    <SelectContent>
                      {corsiDB.map((corso) => (
                        <SelectItem key={corso.id} value={String(corso.id)}>
                          {corso.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Codice</Label>
                  <Select value={attivitaCodice["lezioni-individuali"]} onValueChange={(v) => setAttivitaCodice(prev => ({ ...prev, "lezioni-individuali": v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona codice" />
                    </SelectTrigger>
                    <SelectContent>
                      {corsiDB.map((corso) => (
                        <SelectItem key={corso.id} value={corso.sku}>
                          {corso.sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Users className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/campus" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-campus">Campus</Link>
                <KnowledgeInfo id="campus" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {campusCategorieDB.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Corso</Label>
                  <Select value={attivitaCorso["campus"]} onValueChange={(v) => setAttivitaCorso(prev => ({ ...prev, "campus": v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona corso" />
                    </SelectTrigger>
                    <SelectContent>
                      {corsiDB.map((corso) => (
                        <SelectItem key={corso.id} value={String(corso.id)}>
                          {corso.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Codice</Label>
                  <Select value={attivitaCodice["campus"]} onValueChange={(v) => setAttivitaCodice(prev => ({ ...prev, "campus": v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona codice" />
                    </SelectTrigger>
                    <SelectContent>
                      {corsiDB.map((corso) => (
                        <SelectItem key={corso.id} value={corso.sku}>
                          {corso.sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Award className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/saggi" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-saggi">Saggi</Link>
                <KnowledgeInfo id="saggi" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {saggiCategorieDB.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Corso</Label>
                  <Select value={attivitaCorso["saggi"]} onValueChange={(v) => setAttivitaCorso(prev => ({ ...prev, "saggi": v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona corso" />
                    </SelectTrigger>
                    <SelectContent>
                      {corsiDB.map((corso) => (
                        <SelectItem key={corso.id} value={String(corso.id)}>
                          {corso.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Codice</Label>
                  <Select value={attivitaCodice["saggi"]} onValueChange={(v) => setAttivitaCodice(prev => ({ ...prev, "saggi": v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona codice" />
                    </SelectTrigger>
                    <SelectContent>
                      {corsiDB.map((corso) => (
                        <SelectItem key={corso.id} value={corso.sku}>
                          {corso.sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Music className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/vacanze-studio" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-vacanze-studio">Vacanze Studio</Link>
                <KnowledgeInfo id="vacanze-studio" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {vacanzeCategorieDB.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Corso</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona corso" />
                    </SelectTrigger>
                    <SelectContent>
                      {corsiDB.map((corso) => (
                        <SelectItem key={corso.id} value={String(corso.id)}>
                          {corso.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Codice</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona codice" />
                    </SelectTrigger>
                    <SelectContent>
                      {corsiDB.map((corso) => (
                        <SelectItem key={corso.id} value={corso.sku}>
                          {corso.sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <ShoppingBag className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/merchandising" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-merchandising">Merchandising</Link>
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
