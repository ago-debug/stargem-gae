import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, FileText, Users, CreditCard, Gift, IdCard, Stethoscope, Activity } from "lucide-react";

interface SectionBandProps {
  title: string;
  color: "orange" | "purple" | "yellow" | "blue" | "green" | "pink" | "teal";
  children?: React.ReactNode;
  id?: string;
}

function SectionBand({ title, color, children, id }: SectionBandProps) {
  const colorClasses = {
    orange: "bg-orange-500 text-white",
    purple: "bg-purple-500 text-white",
    yellow: "bg-yellow-400 text-black",
    blue: "bg-blue-500 text-white",
    green: "bg-green-500 text-white",
    pink: "bg-pink-400 text-white",
    teal: "bg-teal-500 text-white",
  };

  return (
    <div className="mb-4 scroll-mt-16" id={id}>
      <div className={`${colorClasses[color]} px-4 py-2 font-bold text-sm`}>
        {title}
      </div>
      {children}
    </div>
  );
}

interface CellProps {
  children?: React.ReactNode;
  highlight?: boolean;
  header?: boolean;
  colSpan?: number;
  rowSpan?: number;
  className?: string;
}

function Cell({ children, highlight, header, colSpan, rowSpan, className = "" }: CellProps) {
  const baseClasses = "border border-gray-300 px-2 py-1 text-xs";
  const highlightClasses = highlight ? "bg-yellow-100" : "bg-white";
  const headerClasses = header ? "font-bold bg-gray-100" : "";

  return (
    <td
      colSpan={colSpan}
      rowSpan={rowSpan}
      className={`${baseClasses} ${highlightClasses} ${headerClasses} ${className} hover:bg-gray-50 focus-within:outline focus-within:outline-2 focus-within:outline-blue-400`}
    >
      {children}
    </td>
  );
}

interface LabelColumnProps {
  labels: string[];
}

function LabelColumn({ labels }: LabelColumnProps) {
  return (
    <div className="bg-teal-100 border-r border-gray-300 min-w-[180px]">
      {labels.map((label, idx) => (
        <div
          key={idx}
          className="border-b border-gray-300 px-2 py-1 text-xs font-medium h-8 flex items-center"
        >
          {label}
        </div>
      ))}
    </div>
  );
}

export default function TestGae() {
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
    allievo: "",
    insegnante: "",
    datiBancari: "",
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

  const [pagamenti] = useState([
    {
      attivita: "",
      dettaglioIscrizione: "",
      notePagamenti: "",
      quantita: 1,
      descrizioneQuota: "",
      periodo: "",
      totaleQuota: 0,
      codiceSconto: "",
      valoreSconto: 0,
      percSconto: 0,
      codiciPromo: "",
      valorePromo: 0,
      percPromo: 0,
      accontoCredito: 0,
      dataPagamento: "",
      saldoAnnuale: 0,
      numRicevute: 0,
      confermaBonifico: "",
    },
  ]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const allegatiLabels = [
    "ALLEGATI DA INSERIRE",
    "DOMANDA DI TESSERAMENTO",
    "REGOLAMENTO",
    "PRIVACY",
    "CERTIFICATO MEDICO",
    "RICEVUTE PAGAMENTI",
    "MODELLO DETRAZIONE",
    "MODELLO CREDITI SCOLASTICI",
    "TESSERINO TECNICO",
    "TESSERA ENTE",
    "TESSERA STUDIO GEM",
    "FOTO",
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const navItems = [
    { id: "intestazione", label: "Intestazione", icon: FileText, color: "bg-orange-500 hover:bg-orange-600" },
    { id: "anagrafica", label: "Anagrafica", icon: Users, color: "bg-purple-500 hover:bg-purple-600" },
    { id: "pagamenti", label: "Pagamenti", icon: CreditCard, color: "bg-yellow-500 hover:bg-yellow-600" },
    { id: "gift", label: "Gift/Buono", icon: Gift, color: "bg-blue-500 hover:bg-blue-600" },
    { id: "tessere", label: "Tessere", icon: IdCard, color: "bg-green-500 hover:bg-green-600" },
    { id: "certificato", label: "Certificato Medico", icon: Stethoscope, color: "bg-pink-500 hover:bg-pink-600" },
    { id: "attivita", label: "Attività", icon: Activity, color: "bg-yellow-500 hover:bg-yellow-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-50" data-testid="page-test-gae">
      {/* Menu navigazione sezioni - FISSO in alto */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-600 mr-2">Vai a:</span>
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => scrollToSection(item.id)}
                className={`${item.color} text-white text-xs h-8`}
                data-testid={`nav-${item.id}`}
              >
                <item.icon className="w-3 h-3 mr-1" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenuto con padding-top per compensare il menu fisso */}
      <div className="max-w-[1800px] mx-auto p-4 pt-16">
        <h1 className="text-2xl font-bold mb-4">Test Gae - Maschera Iscrizioni</h1>

        {/* INTESTAZIONE */}
        <SectionBand title="INTESTAZIONE" color="orange" id="intestazione">
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <Cell header>STAGIONE</Cell>
                <Cell header>ANAGRAFICA</Cell>
                <Cell header highlight>CODICE ID (C)</Cell>
                <Cell header>DATA DI INSERIMENTO</Cell>
                <Cell header>TIPO PARTECIPANTE</Cell>
                <Cell header highlight>TESSERA</Cell>
                <Cell header>SCADENZA TESSERA</Cell>
                <Cell header>DA DOVE ARRIVA</Cell>
                <Cell header>TEAM SEGRETERIA</Cell>
                <Cell header>TESSERA ENTE</Cell>
                <Cell header>SCADENZA TESSERA ENTE</Cell>
                <Cell header>ENTE</Cell>
              </tr>
              <tr>
                <Cell>
                  <Input
                    value={formData.stagione}
                    onChange={(e) => handleChange("stagione", e.target.value)}
                    className="h-6 text-xs border-0 p-0"
                    data-testid="input-stagione"
                  />
                </Cell>
                <Cell>
                  <Input
                    value=""
                    className="h-6 text-xs border-0 p-0"
                    placeholder="chi scrive"
                  />
                </Cell>
                <Cell highlight>
                  <Input
                    value={formData.codiceId}
                    onChange={(e) => handleChange("codiceId", e.target.value)}
                    className="h-6 text-xs border-0 p-0 bg-yellow-100"
                    data-testid="input-codice-id"
                  />
                </Cell>
                <Cell>
                  <Input
                    value={formData.dataInserimento}
                    className="h-6 text-xs border-0 p-0"
                    readOnly
                  />
                </Cell>
                <Cell>
                  <Select value={formData.tipoPartecipante} onValueChange={(v) => handleChange("tipoPartecipante", v)}>
                    <SelectTrigger className="h-6 text-xs border-0" data-testid="select-tipo-partecipante">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tesserato">Tesserato</SelectItem>
                      <SelectItem value="non_tesserato">Non Tesserato</SelectItem>
                    </SelectContent>
                  </Select>
                </Cell>
                <Cell highlight>
                  <Input
                    value={formData.tessera}
                    onChange={(e) => handleChange("tessera", e.target.value)}
                    className="h-6 text-xs border-0 p-0 bg-yellow-100"
                    data-testid="input-tessera"
                  />
                </Cell>
                <Cell>
                  <Input
                    type="date"
                    value={formData.scadenzaTessera}
                    onChange={(e) => handleChange("scadenzaTessera", e.target.value)}
                    className="h-6 text-xs border-0 p-0"
                  />
                </Cell>
                <Cell>
                  <Select value={formData.daDoveArriva} onValueChange={(v) => handleChange("daDoveArriva", v)}>
                    <SelectTrigger className="h-6 text-xs border-0">
                      <SelectValue placeholder="Seleziona..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web">Web</SelectItem>
                      <SelectItem value="passaparola">Passaparola</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="altro">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </Cell>
                <Cell>
                  <Input
                    value={formData.teamSegreteria}
                    onChange={(e) => handleChange("teamSegreteria", e.target.value)}
                    className="h-6 text-xs border-0 p-0"
                  />
                </Cell>
                <Cell>
                  <Input
                    value={formData.tesseraEnte}
                    onChange={(e) => handleChange("tesseraEnte", e.target.value)}
                    className="h-6 text-xs border-0 p-0"
                  />
                </Cell>
                <Cell>
                  <Input
                    type="date"
                    value={formData.scadenzaTesseraEnte}
                    onChange={(e) => handleChange("scadenzaTesseraEnte", e.target.value)}
                    className="h-6 text-xs border-0 p-0"
                  />
                </Cell>
                <Cell>
                  <Select value={formData.ente} onValueChange={(v) => handleChange("ente", v)}>
                    <SelectTrigger className="h-6 text-xs border-0">
                      <SelectValue placeholder="Seleziona..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acsi">ACSI</SelectItem>
                      <SelectItem value="csen">CSEN</SelectItem>
                      <SelectItem value="uisp">UISP</SelectItem>
                      <SelectItem value="altro">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </Cell>
              </tr>
            </tbody>
          </table>
        </SectionBand>

        {/* ANAGRAFICA */}
        <SectionBand title="ANAGRAFICA" color="purple" id="anagrafica">
          <div className="flex">
            <LabelColumn labels={allegatiLabels} />
            <div className="flex-1 overflow-x-auto">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <Cell header>COGNOME</Cell>
                    <Cell header>NOME</Cell>
                    <Cell header highlight>CODICE_FISCALE (J)</Cell>
                    <Cell header>TELEFONO</Cell>
                    <Cell header>EMAIL</Cell>
                  </tr>
                  <tr>
                    <Cell>
                      <Input
                        value={formData.cognome}
                        onChange={(e) => handleChange("cognome", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                        data-testid="input-cognome"
                      />
                    </Cell>
                    <Cell>
                      <Input
                        value={formData.nome}
                        onChange={(e) => handleChange("nome", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                        data-testid="input-nome"
                      />
                    </Cell>
                    <Cell highlight>
                      <Input
                        value={formData.codiceFiscale}
                        onChange={(e) => handleChange("codiceFiscale", e.target.value.toUpperCase())}
                        className="h-6 text-xs border-0 p-0 bg-yellow-100"
                        data-testid="input-codice-fiscale"
                      />
                    </Cell>
                    <Cell>
                      <Input
                        value={formData.telefono}
                        onChange={(e) => handleChange("telefono", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                        data-testid="input-telefono"
                      />
                    </Cell>
                    <Cell>
                      <Input
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                        data-testid="input-email"
                      />
                    </Cell>
                  </tr>
                  <tr>
                    <Cell header>INDIRIZZO</Cell>
                    <Cell header>CAP</Cell>
                    <Cell header>CITTA</Cell>
                    <Cell header>PROVINCIA</Cell>
                    <Cell header>COD COMUNE</Cell>
                  </tr>
                  <tr>
                    <Cell>
                      <Input
                        value={formData.indirizzo}
                        onChange={(e) => handleChange("indirizzo", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                    <Cell>
                      <Input
                        value={formData.cap}
                        onChange={(e) => handleChange("cap", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                    <Cell>
                      <Input
                        value={formData.citta}
                        onChange={(e) => handleChange("citta", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                    <Cell>
                      <Input
                        value={formData.provincia}
                        onChange={(e) => handleChange("provincia", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                    <Cell>
                      <Input
                        value={formData.codComune}
                        onChange={(e) => handleChange("codComune", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                  </tr>
                  <tr>
                    <Cell header>DATA DI NASCITA</Cell>
                    <Cell header>LUOGO DI NASCITA</Cell>
                    <Cell header>SESSO</Cell>
                    <Cell header>ETÀ</Cell>
                    <Cell header>ALLIEVO</Cell>
                  </tr>
                  <tr>
                    <Cell>
                      <Input
                        type="date"
                        value={formData.dataNascita}
                        onChange={(e) => handleChange("dataNascita", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                    <Cell>
                      <Input
                        value={formData.luogoNascita}
                        onChange={(e) => handleChange("luogoNascita", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                    <Cell>
                      <Select value={formData.sesso} onValueChange={(v) => handleChange("sesso", v)}>
                        <SelectTrigger className="h-6 text-xs border-0">
                          <SelectValue placeholder="..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">M</SelectItem>
                          <SelectItem value="F">F</SelectItem>
                        </SelectContent>
                      </Select>
                    </Cell>
                    <Cell>
                      <Input
                        value={formData.eta}
                        className="h-6 text-xs border-0 p-0"
                        readOnly
                      />
                    </Cell>
                    <Cell>
                      <Input
                        value={formData.allievo}
                        onChange={(e) => handleChange("allievo", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                  </tr>

                  {/* GENITORE 1 */}
                  <tr>
                    <Cell header colSpan={5} className="bg-teal-100 font-bold">GENITORE 1</Cell>
                  </tr>
                  <tr>
                    <Cell header>COGNOME</Cell>
                    <Cell header>NOME</Cell>
                    <Cell header>CODICE_FISCALE</Cell>
                    <Cell header>TELEFONO</Cell>
                    <Cell header>EMAIL</Cell>
                  </tr>
                  <tr>
                    <Cell>
                      <Input
                        value={formData.cognomeGen1}
                        onChange={(e) => handleChange("cognomeGen1", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                    <Cell>
                      <Input
                        value={formData.nomeGen1}
                        onChange={(e) => handleChange("nomeGen1", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                    <Cell>
                      <Input
                        value={formData.cfGen1}
                        onChange={(e) => handleChange("cfGen1", e.target.value.toUpperCase())}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                    <Cell>
                      <Input
                        value={formData.telGen1}
                        onChange={(e) => handleChange("telGen1", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                    <Cell>
                      <Input
                        value={formData.emailGen1}
                        onChange={(e) => handleChange("emailGen1", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                  </tr>
                  <tr>
                    <Cell header>INDIRIZZO</Cell>
                    <Cell header>CAP</Cell>
                    <Cell header>CITTA</Cell>
                    <Cell header>PROVINCIA</Cell>
                    <Cell header>COD COMUNE</Cell>
                  </tr>
                  <tr>
                    <Cell>
                      <Input
                        value={formData.indirizzoGen1}
                        onChange={(e) => handleChange("indirizzoGen1", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                    <Cell>
                      <Input
                        value={formData.capGen1}
                        onChange={(e) => handleChange("capGen1", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                    <Cell>
                      <Input
                        value={formData.cittaGen1}
                        onChange={(e) => handleChange("cittaGen1", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                    <Cell>
                      <Input
                        value={formData.provinciaGen1}
                        onChange={(e) => handleChange("provinciaGen1", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                    <Cell>
                      <Input
                        value={formData.codComuneGen1}
                        onChange={(e) => handleChange("codComuneGen1", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                  </tr>
                  <tr>
                    <Cell header>DATA DI NASCITA</Cell>
                    <Cell header>LUOGO DI NASCITA</Cell>
                    <Cell header>SESSO</Cell>
                    <Cell colSpan={2}></Cell>
                  </tr>
                  <tr>
                    <Cell>
                      <Input
                        type="date"
                        value={formData.dataNascitaGen1}
                        onChange={(e) => handleChange("dataNascitaGen1", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                    <Cell>
                      <Input
                        value={formData.luogoNascitaGen1}
                        onChange={(e) => handleChange("luogoNascitaGen1", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                    <Cell>
                      <Select value={formData.sessoGen1} onValueChange={(v) => handleChange("sessoGen1", v)}>
                        <SelectTrigger className="h-6 text-xs border-0">
                          <SelectValue placeholder="..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">M</SelectItem>
                          <SelectItem value="F">F</SelectItem>
                        </SelectContent>
                      </Select>
                    </Cell>
                    <Cell colSpan={2}></Cell>
                  </tr>

                  {/* GENITORE 2 */}
                  <tr>
                    <Cell header colSpan={5} className="bg-teal-100 font-bold">GENITORE 2</Cell>
                  </tr>
                  <tr>
                    <Cell header>COGNOME</Cell>
                    <Cell header>NOME</Cell>
                    <Cell header>CODICE_FISCALE</Cell>
                    <Cell header>TELEFONO</Cell>
                    <Cell header>EMAIL</Cell>
                  </tr>
                  <tr>
                    <Cell>
                      <Input
                        value={formData.cognomeGen2}
                        onChange={(e) => handleChange("cognomeGen2", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                    <Cell>
                      <Input
                        value={formData.nomeGen2}
                        onChange={(e) => handleChange("nomeGen2", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                    <Cell>
                      <Input
                        value={formData.cfGen2}
                        onChange={(e) => handleChange("cfGen2", e.target.value.toUpperCase())}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                    <Cell>
                      <Input
                        value={formData.telGen2}
                        onChange={(e) => handleChange("telGen2", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                    <Cell>
                      <Input
                        value={formData.emailGen2}
                        onChange={(e) => handleChange("emailGen2", e.target.value)}
                        className="h-6 text-xs border-0 p-0"
                      />
                    </Cell>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </SectionBand>

        {/* PAGAMENTI */}
        <SectionBand title="PAGAMENTI" color="yellow" id="pagamenti">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[1400px]">
              <thead>
                <tr>
                  <Cell header>ATTIVITÀ</Cell>
                  <Cell header>dettaglio iscrizione (N)</Cell>
                  <Cell header>note pagamenti (O)</Cell>
                  <Cell header>Quantità</Cell>
                  <Cell header>descrizione quota (Q)</Cell>
                  <Cell header>periodo (R)</Cell>
                  <Cell header>totale quota (S)</Cell>
                  <Cell header highlight>codice sconto (T)</Cell>
                  <Cell header highlight>valore sconto (U)</Cell>
                  <Cell header highlight>% sconto (V)</Cell>
                  <Cell header highlight>codici promo (W)</Cell>
                  <Cell header highlight>valore promo (X)</Cell>
                  <Cell header highlight>% promo</Cell>
                  <Cell header>Acconto o Credito (Y)</Cell>
                  <Cell header>data pagamento (Z)</Cell>
                  <Cell header>saldo annuale (AA)</Cell>
                  <Cell header>numero ricevute</Cell>
                  <Cell header>CONFERMA BONIFICO</Cell>
                </tr>
              </thead>
              <tbody>
                {pagamenti.map((_, idx) => (
                  <tr key={idx}>
                    <Cell>
                      <Input className="h-6 text-xs border-0 p-0 w-20" />
                    </Cell>
                    <Cell>
                      <Input className="h-6 text-xs border-0 p-0 w-32" />
                    </Cell>
                    <Cell>
                      <Input className="h-6 text-xs border-0 p-0 w-32" />
                    </Cell>
                    <Cell>
                      <Input type="number" className="h-6 text-xs border-0 p-0 w-12" defaultValue={1} />
                    </Cell>
                    <Cell>
                      <Input className="h-6 text-xs border-0 p-0 w-32" />
                    </Cell>
                    <Cell>
                      <Input className="h-6 text-xs border-0 p-0 w-24" />
                    </Cell>
                    <Cell>
                      <Input type="number" className="h-6 text-xs border-0 p-0 w-16" />
                    </Cell>
                    <Cell highlight>
                      <Input className="h-6 text-xs border-0 p-0 w-20 bg-yellow-100" />
                    </Cell>
                    <Cell highlight>
                      <Input type="number" className="h-6 text-xs border-0 p-0 w-16 bg-yellow-100" />
                    </Cell>
                    <Cell highlight>
                      <Input type="number" className="h-6 text-xs border-0 p-0 w-12 bg-yellow-100" />
                    </Cell>
                    <Cell highlight>
                      <Input className="h-6 text-xs border-0 p-0 w-20 bg-yellow-100" />
                    </Cell>
                    <Cell highlight>
                      <Input type="number" className="h-6 text-xs border-0 p-0 w-16 bg-yellow-100" />
                    </Cell>
                    <Cell highlight>
                      <Input type="number" className="h-6 text-xs border-0 p-0 w-12 bg-yellow-100" />
                    </Cell>
                    <Cell>
                      <Input type="number" className="h-6 text-xs border-0 p-0 w-20" />
                    </Cell>
                    <Cell>
                      <Input type="date" className="h-6 text-xs border-0 p-0 w-28" />
                    </Cell>
                    <Cell>
                      <Input type="number" className="h-6 text-xs border-0 p-0 w-20" />
                    </Cell>
                    <Cell>
                      <Input type="number" className="h-6 text-xs border-0 p-0 w-12" />
                    </Cell>
                    <Cell>
                      <Input type="date" className="h-6 text-xs border-0 p-0 w-28" />
                    </Cell>
                  </tr>
                ))}
                <tr>
                  <Cell colSpan={15} className="text-right font-bold">saldo totale (BO):</Cell>
                  <Cell highlight colSpan={3} className="font-bold text-lg">
                    € 0,00
                  </Cell>
                </tr>
              </tbody>
            </table>
          </div>
        </SectionBand>

        {/* GIFT - BUONO - RESO - HELLO GEM */}
        <SectionBand title="GIFT - BUONO - RESO - HELLO GEM" color="blue" id="gift">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <Cell header>tipo</Cell>
                <Cell header>valore - importo</Cell>
                <Cell header>numero</Cell>
                <Cell header>data emissione</Cell>
                <Cell header>data scadenza</Cell>
                <Cell header>acquistato / utilizzato per - motivazione</Cell>
                <Cell header>data utilizzo - reso (convalida)</Cell>
                <Cell header>iban</Cell>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Cell>
                  <Select>
                    <SelectTrigger className="h-6 text-xs border-0">
                      <SelectValue placeholder="Tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gift">Gift Card</SelectItem>
                      <SelectItem value="buono">Buono</SelectItem>
                      <SelectItem value="reso">Reso</SelectItem>
                      <SelectItem value="hellogem">Hello Gem</SelectItem>
                    </SelectContent>
                  </Select>
                </Cell>
                <Cell><Input type="number" className="h-6 text-xs border-0 p-0" /></Cell>
                <Cell><Input className="h-6 text-xs border-0 p-0" /></Cell>
                <Cell><Input type="date" className="h-6 text-xs border-0 p-0" /></Cell>
                <Cell><Input type="date" className="h-6 text-xs border-0 p-0" /></Cell>
                <Cell><Input className="h-6 text-xs border-0 p-0" /></Cell>
                <Cell><Input type="date" className="h-6 text-xs border-0 p-0" /></Cell>
                <Cell><Input className="h-6 text-xs border-0 p-0" /></Cell>
              </tr>
            </tbody>
          </table>
        </SectionBand>

        {/* TESSERE */}
        <SectionBand title="TESSERE" color="green" id="tessere">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <Cell header>quota tessera (BY)</Cell>
                <Cell header>pagamento tessera (BZ)</Cell>
                <Cell header>Nuovo o Rinnovo (CA)</Cell>
                <Cell header>data scad / quota tessera (CB)</Cell>
                <Cell header>n.tessera (CC)</Cell>
                <Cell header>tessera ente (CD)</Cell>
                <Cell header>domanda di tesseramento (CE)</Cell>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Cell><Input type="number" className="h-6 text-xs border-0 p-0" /></Cell>
                <Cell><Input type="date" className="h-6 text-xs border-0 p-0" /></Cell>
                <Cell>
                  <Select>
                    <SelectTrigger className="h-6 text-xs border-0">
                      <SelectValue placeholder="..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nuovo">Nuovo</SelectItem>
                      <SelectItem value="rinnovo">Rinnovo</SelectItem>
                    </SelectContent>
                  </Select>
                </Cell>
                <Cell><Input className="h-6 text-xs border-0 p-0" /></Cell>
                <Cell><Input className="h-6 text-xs border-0 p-0" /></Cell>
                <Cell><Input className="h-6 text-xs border-0 p-0" /></Cell>
                <Cell>
                  <Select>
                    <SelectTrigger className="h-6 text-xs border-0">
                      <SelectValue placeholder="..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="si">Sì</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </Cell>
              </tr>
            </tbody>
          </table>
        </SectionBand>

        {/* CERTIFICATO MEDICO */}
        <SectionBand title="CERTIFICATO MEDICO" color="pink" id="certificato">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <Cell header>data scadenza certificato medico</Cell>
                <Cell header>DATA DI RINNOVO</Cell>
                <Cell header>RILASCIATO DA</Cell>
                <Cell header>PAGAMENTO</Cell>
                <Cell header>A NOI</Cell>
                <Cell header>TIPO CERTIFICATO</Cell>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Cell><Input type="date" className="h-6 text-xs border-0 p-0" /></Cell>
                <Cell><Input type="date" className="h-6 text-xs border-0 p-0" /></Cell>
                <Cell><Input className="h-6 text-xs border-0 p-0" /></Cell>
                <Cell><Input type="number" className="h-6 text-xs border-0 p-0" placeholder="€ 40" /></Cell>
                <Cell><Input type="number" className="h-6 text-xs border-0 p-0" placeholder="12,5" /></Cell>
                <Cell>
                  <Select>
                    <SelectTrigger className="h-6 text-xs border-0">
                      <SelectValue placeholder="Tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="non_agonistico">Sportivo Non Agonistico</SelectItem>
                      <SelectItem value="agonistico">Sportivo Agonistico</SelectItem>
                      <SelectItem value="base">Base</SelectItem>
                    </SelectContent>
                  </Select>
                </Cell>
              </tr>
            </tbody>
          </table>
        </SectionBand>

        {/* ATTIVITÀ */}
        <SectionBand title="ATTIVITÀ" color="yellow" id="attivita">
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <div className="border border-gray-300 bg-white">
                <div className="bg-gray-200 px-2 py-1 font-bold text-xs">CORSI</div>
              </div>
              <div className="border border-gray-300 bg-white">
                <div className="bg-gray-200 px-2 py-1 font-bold text-xs">PROVE A PAGAMENTO</div>
              </div>
              <div className="border border-gray-300 bg-white">
                <div className="bg-gray-200 px-2 py-1 font-bold text-xs">PROVE GRATUITE</div>
              </div>
              <div className="border border-gray-300 bg-white">
                <div className="bg-gray-200 px-2 py-1 font-bold text-xs">LEZIONI SINGOLE</div>
              </div>
              <div className="border border-gray-300 bg-white">
                <div className="bg-gray-200 px-2 py-1 font-bold text-xs">WORKSHOP</div>
              </div>
              <div className="border border-gray-300 bg-white">
                <div className="bg-gray-200 px-2 py-1 font-bold text-xs">DOMENICHE IN MOVIMENTO</div>
              </div>
              <div className="border border-gray-300 bg-white">
                <div className="bg-gray-200 px-2 py-1 font-bold text-xs">ALLENAMENTI</div>
              </div>
              <div className="border border-gray-300 bg-white">
                <div className="bg-gray-200 px-2 py-1 font-bold text-xs">LEZIONI INDIVIDUALI</div>
              </div>
              <div className="border border-gray-300 bg-white">
                <div className="bg-gray-200 px-2 py-1 font-bold text-xs">CAMPUS</div>
              </div>
              <div className="border border-gray-300 bg-white">
                <div className="bg-gray-200 px-2 py-1 font-bold text-xs">SAGGI</div>
              </div>
              <div className="border border-gray-300 bg-white">
                <div className="bg-gray-200 px-2 py-1 font-bold text-xs">VACANZA STUDIO</div>
              </div>
              <div className="border border-gray-300 bg-white">
                <div className="bg-gray-200 px-2 py-1 font-bold text-xs">MERCHANDISING</div>
              </div>
            </div>

            {/* Blocco vuoto a destra */}
            <div className="w-64 border border-gray-300 bg-white min-h-[300px] flex items-center justify-center text-gray-400 text-xs flex-col">
              <span>blocco PERSONE</span>
              <span>(spazio per future info)</span>
            </div>
          </div>
        </SectionBand>
      </div>
    </div>
  );
}
