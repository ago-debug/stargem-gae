import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, CreditCard, Gift, IdCard, Stethoscope, Activity } from "lucide-react";

interface SectionProps {
  title: string;
  children?: React.ReactNode;
  id?: string;
}

function Section({ title, children, id }: SectionProps) {
  return (
    <Card className="mb-4 scroll-mt-16" id={id}>
      <CardHeader className="py-3 px-4 bg-gray-100 border-b">
        <CardTitle className="text-sm font-bold text-gray-700">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {children}
      </CardContent>
    </Card>
  );
}

interface SubSectionProps {
  title: string;
  children?: React.ReactNode;
}

function SubSection({ title, children }: SubSectionProps) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <div className="bg-gray-50 px-4 py-2 font-semibold text-xs text-gray-600 border-b border-gray-200">
        {title}
      </div>
      <div className="p-2">
        {children}
      </div>
    </div>
  );
}

function TableCell({ children, header = false, className = "", colSpan }: { children?: React.ReactNode; header?: boolean; className?: string; colSpan?: number }) {
  const baseClasses = "border border-gray-200 px-2 py-1.5 text-xs";
  const headerClasses = header ? "font-semibold bg-gray-50 text-gray-600" : "bg-white";
  return (
    <td colSpan={colSpan} className={`${baseClasses} ${headerClasses} ${className}`}>
      {children}
    </td>
  );
}

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
    <div className="min-h-screen bg-gray-100" data-testid="page-test2-gae">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-500 mr-2">Vai a:</span>
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                size="sm"
                onClick={() => scrollToSection(item.id)}
                className="text-xs h-7 px-3 text-gray-600 hover:bg-gray-100"
                data-testid={`nav-${item.id}`}
              >
                <item.icon className="w-3 h-3 mr-1" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 pt-16">
        <h1 className="text-xl font-bold mb-4 text-gray-800">Test2 Gae - Maschera Iscrizioni</h1>

        <Section title="INTESTAZIONE" id="intestazione">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <TableCell header>Stagione</TableCell>
                  <TableCell header>Anagrafica</TableCell>
                  <TableCell header>Codice ID</TableCell>
                  <TableCell header>Data Inserimento</TableCell>
                  <TableCell header>Tipo Partecipante</TableCell>
                  <TableCell header>Tessera</TableCell>
                  <TableCell header>Scadenza Tessera</TableCell>
                  <TableCell header>Da Dove Arriva</TableCell>
                  <TableCell header>Team Segreteria</TableCell>
                  <TableCell header>Tessera Ente</TableCell>
                  <TableCell header>Scadenza Tessera Ente</TableCell>
                  <TableCell header>Ente</TableCell>
                </tr>
                <tr>
                  <TableCell>
                    <Input value={formData.stagione} onChange={(e) => handleChange("stagione", e.target.value)} className="h-7 text-xs border-0 bg-transparent" />
                  </TableCell>
                  <TableCell>
                    <Input className="h-7 text-xs border-0 bg-transparent" placeholder="chi scrive" />
                  </TableCell>
                  <TableCell>
                    <Input value={formData.codiceId} onChange={(e) => handleChange("codiceId", e.target.value)} className="h-7 text-xs border-0 bg-transparent" />
                  </TableCell>
                  <TableCell>
                    <Input value={formData.dataInserimento} readOnly className="h-7 text-xs border-0 bg-transparent" />
                  </TableCell>
                  <TableCell>
                    <Select value={formData.tipoPartecipante} onValueChange={(v) => handleChange("tipoPartecipante", v)}>
                      <SelectTrigger className="h-7 text-xs border-0 bg-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tesserato">Tesserato</SelectItem>
                        <SelectItem value="non_tesserato">Non Tesserato</SelectItem>
                        <SelectItem value="prova">Prova</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input type="date" className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input type="date" className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="ANAGRAFICA" id="anagrafica">
          <SubSection title="DATI PERSONALI">
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <TableCell header>Cognome</TableCell>
                  <TableCell header>Nome</TableCell>
                  <TableCell header>Codice Fiscale</TableCell>
                  <TableCell header>Telefono</TableCell>
                  <TableCell header>Email</TableCell>
                </tr>
                <tr>
                  <TableCell><Input value={formData.cognome} onChange={(e) => handleChange("cognome", e.target.value)} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input value={formData.nome} onChange={(e) => handleChange("nome", e.target.value)} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input value={formData.codiceFiscale} onChange={(e) => handleChange("codiceFiscale", e.target.value.toUpperCase())} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input value={formData.telefono} onChange={(e) => handleChange("telefono", e.target.value)} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input value={formData.email} onChange={(e) => handleChange("email", e.target.value)} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                </tr>
                <tr>
                  <TableCell header>Indirizzo</TableCell>
                  <TableCell header>CAP</TableCell>
                  <TableCell header>Città</TableCell>
                  <TableCell header>Provincia</TableCell>
                  <TableCell header>Cod. Comune</TableCell>
                </tr>
                <tr>
                  <TableCell><Input value={formData.indirizzo} onChange={(e) => handleChange("indirizzo", e.target.value)} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input value={formData.cap} onChange={(e) => handleChange("cap", e.target.value)} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input value={formData.citta} onChange={(e) => handleChange("citta", e.target.value)} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input value={formData.provincia} onChange={(e) => handleChange("provincia", e.target.value)} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input value={formData.codComune} onChange={(e) => handleChange("codComune", e.target.value)} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                </tr>
                <tr>
                  <TableCell header>Data di Nascita</TableCell>
                  <TableCell header>Luogo di Nascita</TableCell>
                  <TableCell header>Sesso</TableCell>
                  <TableCell header>Età</TableCell>
                  <TableCell header></TableCell>
                </tr>
                <tr>
                  <TableCell><Input type="date" value={formData.dataNascita} onChange={(e) => handleChange("dataNascita", e.target.value)} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input value={formData.luogoNascita} onChange={(e) => handleChange("luogoNascita", e.target.value)} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell>
                    <Select value={formData.sesso} onValueChange={(v) => handleChange("sesso", v)}>
                      <SelectTrigger className="h-7 text-xs border-0 bg-transparent">
                        <SelectValue placeholder="..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="F">F</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input value={formData.eta} onChange={(e) => handleChange("eta", e.target.value)} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell></TableCell>
                </tr>
              </tbody>
            </table>
          </SubSection>

          <SubSection title="GENITORE 1">
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <TableCell header>Cognome</TableCell>
                  <TableCell header>Nome</TableCell>
                  <TableCell header>Codice Fiscale</TableCell>
                  <TableCell header>Telefono</TableCell>
                  <TableCell header>Email</TableCell>
                </tr>
                <tr>
                  <TableCell><Input value={formData.cognomeGen1} onChange={(e) => handleChange("cognomeGen1", e.target.value)} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input value={formData.nomeGen1} onChange={(e) => handleChange("nomeGen1", e.target.value)} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input value={formData.cfGen1} onChange={(e) => handleChange("cfGen1", e.target.value.toUpperCase())} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input value={formData.telGen1} onChange={(e) => handleChange("telGen1", e.target.value)} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input value={formData.emailGen1} onChange={(e) => handleChange("emailGen1", e.target.value)} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                </tr>
                <tr>
                  <TableCell header>Data di Nascita</TableCell>
                  <TableCell header>Luogo di Nascita</TableCell>
                  <TableCell header>Sesso</TableCell>
                  <TableCell header colSpan={2}></TableCell>
                </tr>
                <tr>
                  <TableCell><Input type="date" value={formData.dataNascitaGen1} onChange={(e) => handleChange("dataNascitaGen1", e.target.value)} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input value={formData.luogoNascitaGen1} onChange={(e) => handleChange("luogoNascitaGen1", e.target.value)} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell>
                    <Select value={formData.sessoGen1} onValueChange={(v) => handleChange("sessoGen1", v)}>
                      <SelectTrigger className="h-7 text-xs border-0 bg-transparent">
                        <SelectValue placeholder="..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="F">F</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell colSpan={2}></TableCell>
                </tr>
              </tbody>
            </table>
          </SubSection>

          <SubSection title="GENITORE 2">
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <TableCell header>Cognome</TableCell>
                  <TableCell header>Nome</TableCell>
                  <TableCell header>Codice Fiscale</TableCell>
                  <TableCell header>Telefono</TableCell>
                  <TableCell header>Email</TableCell>
                </tr>
                <tr>
                  <TableCell><Input value={formData.cognomeGen2} onChange={(e) => handleChange("cognomeGen2", e.target.value)} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input value={formData.nomeGen2} onChange={(e) => handleChange("nomeGen2", e.target.value)} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input value={formData.cfGen2} onChange={(e) => handleChange("cfGen2", e.target.value.toUpperCase())} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input value={formData.telGen2} onChange={(e) => handleChange("telGen2", e.target.value)} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  <TableCell><Input value={formData.emailGen2} onChange={(e) => handleChange("emailGen2", e.target.value)} className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                </tr>
              </tbody>
            </table>
          </SubSection>
        </Section>

        <Section title="PAGAMENTI" id="pagamenti">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[1200px]">
              <tbody>
                <tr>
                  <TableCell header>Attività</TableCell>
                  <TableCell header>Dettaglio Iscrizione</TableCell>
                  <TableCell header>Note Pagamenti</TableCell>
                  <TableCell header>Quantità</TableCell>
                  <TableCell header>Descrizione Quota</TableCell>
                  <TableCell header>Periodo</TableCell>
                  <TableCell header>Totale Quota</TableCell>
                  <TableCell header>Codice Sconto</TableCell>
                  <TableCell header>Valore Sconto</TableCell>
                  <TableCell header>% Sconto</TableCell>
                  <TableCell header>Codici Promo</TableCell>
                  <TableCell header>Valore Promo</TableCell>
                  <TableCell header>% Promo</TableCell>
                  <TableCell header>Acconto/Credito</TableCell>
                  <TableCell header>Data Pagamento</TableCell>
                  <TableCell header>Saldo Annuale</TableCell>
                  <TableCell header>N. Ricevute</TableCell>
                  <TableCell header>Conferma Bonifico</TableCell>
                </tr>
                <tr>
                  <TableCell><Input className="h-7 text-xs border-0 bg-transparent w-20" /></TableCell>
                  <TableCell><Input className="h-7 text-xs border-0 bg-transparent w-28" /></TableCell>
                  <TableCell><Input className="h-7 text-xs border-0 bg-transparent w-28" /></TableCell>
                  <TableCell><Input type="number" defaultValue={1} className="h-7 text-xs border-0 bg-transparent w-12" /></TableCell>
                  <TableCell><Input className="h-7 text-xs border-0 bg-transparent w-28" /></TableCell>
                  <TableCell><Input className="h-7 text-xs border-0 bg-transparent w-20" /></TableCell>
                  <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-16" /></TableCell>
                  <TableCell><Input className="h-7 text-xs border-0 bg-transparent w-20" /></TableCell>
                  <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                  <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-12" /></TableCell>
                  <TableCell><Input className="h-7 text-xs border-0 bg-transparent w-20" /></TableCell>
                  <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                  <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-12" /></TableCell>
                  <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-16" /></TableCell>
                  <TableCell><Input type="date" className="h-7 text-xs border-0 bg-transparent w-28" /></TableCell>
                  <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-16" /></TableCell>
                  <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-12" /></TableCell>
                  <TableCell><Input type="date" className="h-7 text-xs border-0 bg-transparent w-28" /></TableCell>
                </tr>
                <tr>
                  <TableCell colSpan={15} className="text-right font-semibold">Saldo Totale:</TableCell>
                  <TableCell colSpan={3} className="font-bold text-base">€ 0,00</TableCell>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="GIFT - BUONO - RESO - HELLO GEM" id="gift">
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <TableCell header>Tipo</TableCell>
                <TableCell header>Valore/Importo</TableCell>
                <TableCell header>Numero</TableCell>
                <TableCell header>Data Emissione</TableCell>
                <TableCell header>Data Scadenza</TableCell>
                <TableCell header>Acquistato/Utilizzato per</TableCell>
                <TableCell header>Data Utilizzo/Reso</TableCell>
                <TableCell header>IBAN</TableCell>
              </tr>
              <tr>
                <TableCell>
                  <Select>
                    <SelectTrigger className="h-7 text-xs border-0 bg-transparent">
                      <SelectValue placeholder="Tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gift">Gift Card</SelectItem>
                      <SelectItem value="buono">Buono</SelectItem>
                      <SelectItem value="reso">Reso</SelectItem>
                      <SelectItem value="hellogem">Hello Gem</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                <TableCell><Input type="date" className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                <TableCell><Input type="date" className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                <TableCell><Input type="date" className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section title="TESSERE" id="tessere">
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <TableCell header>Quota Tessera</TableCell>
                <TableCell header>Pagamento Tessera</TableCell>
                <TableCell header>Nuovo o Rinnovo</TableCell>
                <TableCell header>Data Scad. Quota Tessera</TableCell>
                <TableCell header>N. Tessera</TableCell>
                <TableCell header>Tessera Ente</TableCell>
                <TableCell header>Domanda di Tesseramento</TableCell>
              </tr>
              <tr>
                <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                <TableCell><Input type="date" className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                <TableCell>
                  <Select>
                    <SelectTrigger className="h-7 text-xs border-0 bg-transparent">
                      <SelectValue placeholder="..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nuovo">Nuovo</SelectItem>
                      <SelectItem value="rinnovo">Rinnovo</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                <TableCell>
                  <Select>
                    <SelectTrigger className="h-7 text-xs border-0 bg-transparent">
                      <SelectValue placeholder="..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="si">Sì</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section title="CERTIFICATO MEDICO" id="certificato">
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <TableCell header>Data Scadenza Certificato</TableCell>
                <TableCell header>Data di Rinnovo</TableCell>
                <TableCell header>Rilasciato Da</TableCell>
                <TableCell header>Pagamento</TableCell>
                <TableCell header>A Noi</TableCell>
                <TableCell header>Tipo Certificato</TableCell>
              </tr>
              <tr>
                <TableCell><Input type="date" className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                <TableCell><Input type="date" className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent" placeholder="€ 40" /></TableCell>
                <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent" placeholder="12,5" /></TableCell>
                <TableCell>
                  <Select>
                    <SelectTrigger className="h-7 text-xs border-0 bg-transparent">
                      <SelectValue placeholder="Tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="non_agonistico">Sportivo Non Agonistico</SelectItem>
                      <SelectItem value="agonistico">Sportivo Agonistico</SelectItem>
                      <SelectItem value="base">Base</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section title="ATTIVITÀ" id="attivita">
          <div className="space-y-0">
            <SubSection title="CORSI">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <TableCell header>Categorie</TableCell>
                    <TableCell header>Codici Corso</TableCell>
                    <TableCell header>Provenienza</TableCell>
                    <TableCell header>Iscritti</TableCell>
                    <TableCell header>Limite</TableCell>
                    <TableCell header>Attenzione</TableCell>
                    <TableCell header>Importo</TableCell>
                  </tr>
                  <tr>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell className="bg-orange-50"></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-16" /></TableCell>
                  </tr>
                </tbody>
              </table>
            </SubSection>

            <SubSection title="PROVE A PAGAMENTO">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <TableCell header>Categorie</TableCell>
                    <TableCell header>Codici Corso</TableCell>
                    <TableCell header>Provenienza</TableCell>
                    <TableCell header>Iscritti</TableCell>
                    <TableCell header>Posti Disp.</TableCell>
                    <TableCell header>Avviso</TableCell>
                    <TableCell header>Presenze</TableCell>
                  </tr>
                  <tr>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell className="bg-orange-50"></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                  </tr>
                </tbody>
              </table>
            </SubSection>

            <SubSection title="PROVE GRATUITE">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <TableCell header>Categorie</TableCell>
                    <TableCell header>Codici Corso</TableCell>
                    <TableCell header>Provenienza</TableCell>
                    <TableCell header>Iscritti</TableCell>
                    <TableCell header>Posti Disp.</TableCell>
                    <TableCell header>Avviso</TableCell>
                    <TableCell header>Data Prova</TableCell>
                  </tr>
                  <tr>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell className="bg-orange-50"></TableCell>
                    <TableCell><Input type="date" className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  </tr>
                </tbody>
              </table>
            </SubSection>

            <SubSection title="LEZIONI SINGOLE">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <TableCell header>Categorie</TableCell>
                    <TableCell header>Codici Corso</TableCell>
                    <TableCell header>Provenienza</TableCell>
                    <TableCell header>Iscritti</TableCell>
                    <TableCell header>Posti Disp.</TableCell>
                    <TableCell header>Avviso</TableCell>
                    <TableCell header>Welfare</TableCell>
                    <TableCell header>Presenze</TableCell>
                  </tr>
                  <tr>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell className="bg-orange-50"></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                  </tr>
                </tbody>
              </table>
            </SubSection>

            <SubSection title="WORKSHOP">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <TableCell header>Categorie</TableCell>
                    <TableCell header>Codici</TableCell>
                    <TableCell header>Provenienza</TableCell>
                    <TableCell header>Iscritti</TableCell>
                    <TableCell header>Posti Disp.</TableCell>
                    <TableCell header>Avviso</TableCell>
                    <TableCell header>Data</TableCell>
                    <TableCell header>Importo</TableCell>
                  </tr>
                  <tr>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell className="bg-orange-50"></TableCell>
                    <TableCell><Input type="date" className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-16" /></TableCell>
                  </tr>
                </tbody>
              </table>
            </SubSection>

            <SubSection title="DOMENICHE IN MOVIMENTO">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <TableCell header>Categorie</TableCell>
                    <TableCell header>Codici</TableCell>
                    <TableCell header>Provenienza</TableCell>
                    <TableCell header>Iscritti</TableCell>
                    <TableCell header>Posti Disp.</TableCell>
                    <TableCell header>Avviso</TableCell>
                    <TableCell header>Data</TableCell>
                    <TableCell header>Importo</TableCell>
                  </tr>
                  <tr>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell className="bg-orange-50"></TableCell>
                    <TableCell><Input type="date" className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-16" /></TableCell>
                  </tr>
                </tbody>
              </table>
            </SubSection>

            <SubSection title="ALLENAMENTI">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <TableCell header>Categorie</TableCell>
                    <TableCell header>Codici</TableCell>
                    <TableCell header>Provenienza</TableCell>
                    <TableCell header>Iscritti</TableCell>
                    <TableCell header>Posti Disp.</TableCell>
                    <TableCell header>Avviso</TableCell>
                    <TableCell header>Presenze</TableCell>
                    <TableCell header>Importo</TableCell>
                  </tr>
                  <tr>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell className="bg-orange-50"></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-16" /></TableCell>
                  </tr>
                </tbody>
              </table>
            </SubSection>

            <SubSection title="LEZIONI INDIVIDUALI">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <TableCell header>Categorie</TableCell>
                    <TableCell header>Codici</TableCell>
                    <TableCell header>Provenienza</TableCell>
                    <TableCell header>Iscritti</TableCell>
                    <TableCell header>Posti Disp.</TableCell>
                    <TableCell header>Avviso</TableCell>
                    <TableCell header>Presenze</TableCell>
                    <TableCell header>Importo</TableCell>
                  </tr>
                  <tr>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell className="bg-orange-50"></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-16" /></TableCell>
                  </tr>
                </tbody>
              </table>
            </SubSection>

            <SubSection title="CAMPUS">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <TableCell header>Categorie</TableCell>
                    <TableCell header>Codici</TableCell>
                    <TableCell header>Provenienza</TableCell>
                    <TableCell header>Iscritti</TableCell>
                    <TableCell header>Posti Disp.</TableCell>
                    <TableCell header>Avviso</TableCell>
                    <TableCell header>Periodo</TableCell>
                    <TableCell header>Importo</TableCell>
                  </tr>
                  <tr>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell className="bg-orange-50"></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-16" /></TableCell>
                  </tr>
                </tbody>
              </table>
            </SubSection>

            <SubSection title="SAGGI">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <TableCell header>Categorie</TableCell>
                    <TableCell header>Codici</TableCell>
                    <TableCell header>Provenienza</TableCell>
                    <TableCell header>Iscritti</TableCell>
                    <TableCell header>Posti Disp.</TableCell>
                    <TableCell header>Avviso</TableCell>
                    <TableCell header>Data</TableCell>
                    <TableCell header>Importo</TableCell>
                  </tr>
                  <tr>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell className="bg-orange-50"></TableCell>
                    <TableCell><Input type="date" className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-16" /></TableCell>
                  </tr>
                </tbody>
              </table>
            </SubSection>

            <SubSection title="VACANZA STUDIO">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <TableCell header>Categorie</TableCell>
                    <TableCell header>Codici</TableCell>
                    <TableCell header>Provenienza</TableCell>
                    <TableCell header>Iscritti</TableCell>
                    <TableCell header>Posti Disp.</TableCell>
                    <TableCell header>Avviso</TableCell>
                    <TableCell header>Periodo</TableCell>
                    <TableCell header>Importo</TableCell>
                  </tr>
                  <tr>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell className="bg-orange-50"></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-16" /></TableCell>
                  </tr>
                </tbody>
              </table>
            </SubSection>

            <SubSection title="MERCHANDISING">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <TableCell header>Articolo</TableCell>
                    <TableCell header>Codice</TableCell>
                    <TableCell header>Taglia</TableCell>
                    <TableCell header>Quantità</TableCell>
                    <TableCell header>Prezzo Unit.</TableCell>
                    <TableCell header>Totale</TableCell>
                    <TableCell header>Data Acquisto</TableCell>
                    <TableCell header>Note</TableCell>
                  </tr>
                  <tr>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-14" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-16" /></TableCell>
                    <TableCell><Input type="number" className="h-7 text-xs border-0 bg-transparent w-16" /></TableCell>
                    <TableCell><Input type="date" className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                    <TableCell><Input className="h-7 text-xs border-0 bg-transparent" /></TableCell>
                  </tr>
                </tbody>
              </table>
            </SubSection>
          </div>
        </Section>
      </div>
    </div>
  );
}
