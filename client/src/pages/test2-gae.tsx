import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Users, CreditCard, Gift, IdCard, Stethoscope, Activity,
  User, BookOpen, ShoppingBag
} from "lucide-react";

export default function Test2Gae() {
  const [formData, setFormData] = useState({
    stagione: "2024-2025",
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
    cognomeGen1: "",
    nomeGen1: "",
    cfGen1: "",
    telGen1: "",
    emailGen1: "",
    dataNascitaGen1: "",
    luogoNascitaGen1: "",
    sessoGen1: "",
    cognomeGen2: "",
    nomeGen2: "",
    cfGen2: "",
    telGen2: "",
    emailGen2: "",
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
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold">Test2 Gae - Maschera Iscrizioni</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Versione con stile Anagrafica</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground mr-2">Vai a:</span>
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                size="sm"
                onClick={() => scrollToSection(item.id)}
                className="text-xs h-8"
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
                <Input placeholder="chi scrive" />
              </div>
              <div className="space-y-2">
                <Label>Codice ID</Label>
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
                <Input value={formData.tessera} onChange={(e) => handleChange("tessera", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Scadenza Tessera</Label>
                <Input type="date" value={formData.scadenzaTessera} onChange={(e) => handleChange("scadenzaTessera", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Da Dove Arriva</Label>
                <Input value={formData.daDoveArriva} onChange={(e) => handleChange("daDoveArriva", e.target.value)} />
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
                <Input value={formData.ente} onChange={(e) => handleChange("ente", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ANAGRAFICA */}
        <Card id="anagrafica" className="scroll-mt-32">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Cognome *</Label>
                  <Input value={formData.cognome} onChange={(e) => handleChange("cognome", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input value={formData.nome} onChange={(e) => handleChange("nome", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Codice Fiscale</Label>
                  <Input value={formData.codiceFiscale} onChange={(e) => handleChange("codiceFiscale", e.target.value.toUpperCase())} />
                </div>
                <div className="space-y-2">
                  <Label>Telefono</Label>
                  <Input value={formData.telefono} onChange={(e) => handleChange("telefono", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} />
                </div>
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
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Provincia</Label>
                  <Input value={formData.provincia} onChange={(e) => handleChange("provincia", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Cod. Comune</Label>
                  <Input value={formData.codComune} onChange={(e) => handleChange("codComune", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Data di Nascita</Label>
                  <Input type="date" value={formData.dataNascita} onChange={(e) => handleChange("dataNascita", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Luogo di Nascita</Label>
                  <Input value={formData.luogoNascita} onChange={(e) => handleChange("luogoNascita", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
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
                  <Input value={formData.eta} onChange={(e) => handleChange("eta", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Genitore 1 */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2">Genitore 1</h3>
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
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2">Genitore 2</h3>
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
            </div>
          </CardContent>
        </Card>

        {/* PAGAMENTI */}
        <Card id="pagamenti" className="scroll-mt-32">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5" />
              Pagamenti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Attività</Label>
                <Input />
              </div>
              <div className="space-y-2">
                <Label>Dettaglio Iscrizione</Label>
                <Input />
              </div>
              <div className="space-y-2">
                <Label>Note Pagamenti</Label>
                <Input />
              </div>
              <div className="space-y-2">
                <Label>Quantità</Label>
                <Input type="number" defaultValue={1} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Descrizione Quota</Label>
                <Input />
              </div>
              <div className="space-y-2">
                <Label>Periodo</Label>
                <Input />
              </div>
              <div className="space-y-2">
                <Label>Totale Quota</Label>
                <Input type="number" />
              </div>
              <div className="space-y-2">
                <Label>Codice Sconto</Label>
                <Input />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Valore Sconto</Label>
                <Input type="number" />
              </div>
              <div className="space-y-2">
                <Label>% Sconto</Label>
                <Input type="number" />
              </div>
              <div className="space-y-2">
                <Label>Codici Promo</Label>
                <Input />
              </div>
              <div className="space-y-2">
                <Label>Valore Promo</Label>
                <Input type="number" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>% Promo</Label>
                <Input type="number" />
              </div>
              <div className="space-y-2">
                <Label>Acconto/Credito</Label>
                <Input type="number" />
              </div>
              <div className="space-y-2">
                <Label>Data Pagamento</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Saldo Annuale</Label>
                <Input type="number" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>N. Ricevute</Label>
                <Input type="number" />
              </div>
              <div className="space-y-2">
                <Label>Conferma Bonifico</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <Label>Saldo Totale</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Totale</Badge>
                  <Input value="€ 0,00" readOnly className="bg-green-50 border-green-200 font-bold text-lg" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GIFT - BUONO - RESO */}
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
                <Label>Acquistato/Utilizzato per</Label>
                <Input />
              </div>
              <div className="space-y-2">
                <Label>Data Utilizzo/Reso</Label>
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
                <Label>Quota Tessera</Label>
                <Input type="number" />
              </div>
              <div className="space-y-2">
                <Label>Pagamento Tessera</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Nuovo o Rinnovo</Label>
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
                <Label>Data Scad. Quota Tessera</Label>
                <Input />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>N. Tessera</Label>
                <Input />
              </div>
              <div className="space-y-2">
                <Label>Tessera Ente</Label>
                <Input />
              </div>
              <div className="space-y-2">
                <Label>Domanda di Tesseramento</Label>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2">Corsi</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <Label>Iscritti / Limite</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Iscritti" />
                    <Input type="number" placeholder="Limite" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Attenzione</Label>
                  <Input className="bg-orange-50 border-orange-200" placeholder="Avviso corsi pieni" />
                </div>
                <div className="space-y-2">
                  <Label>Importo</Label>
                  <Input type="number" />
                </div>
              </div>
            </div>

            {/* PROVE A PAGAMENTO */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2">Prove a Pagamento</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Codici Corso</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Iscritti / Posti Disp.</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Iscritti" />
                    <Input type="number" placeholder="Posti" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Presenze</Label>
                  <Input type="number" />
                </div>
              </div>
            </div>

            {/* PROVE GRATUITE */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2">Prove Gratuite</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Codici Corso</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Iscritti / Posti Disp.</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Iscritti" />
                    <Input type="number" placeholder="Posti" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Data Prova</Label>
                  <Input type="date" />
                </div>
              </div>
            </div>

            {/* LEZIONI SINGOLE */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2">Lezioni Singole</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Codici Corso</Label>
                  <Input />
                </div>
                <div className="space-y-2">
                  <Label>Iscritti / Posti Disp.</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Iscritti" />
                    <Input type="number" placeholder="Posti" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Welfare / Presenze</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Welfare" />
                    <Input type="number" placeholder="Presenze" />
                  </div>
                </div>
              </div>
            </div>

            {/* WORKSHOP */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2">Workshop</h3>
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
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2">Domeniche in Movimento</h3>
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
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2">Allenamenti</h3>
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
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2">Lezioni Individuali</h3>
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
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2">Campus</h3>
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
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2">Saggi</h3>
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
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2">Vacanza Studio</h3>
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
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Merchandising
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
