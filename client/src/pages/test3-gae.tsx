import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Clock,
  Building2,
  Plus,
  List,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from "lucide-react";

interface Prenotazione {
  id: string;
  sala: string;
  data: string;
  oraInizio: string;
  oraFine: string;
  cliente: string;
  telefono: string;
  pagato: boolean;
}

const SALE = ["Sala A", "Sala B", "Sala C"];
const ORARI_START = 8;
const ORARI_END = 22;
const SLOT_MINUTI = 30;

function generaSlotOrari(): string[] {
  const slots: string[] = [];
  for (let h = ORARI_START; h < ORARI_END; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTI) {
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return slots;
}

const SLOTS = generaSlotOrari();

function oraToMinuti(ora: string): number {
  const [h, m] = ora.split(':').map(Number);
  return h * 60 + m;
}

function slotOccupato(slot: string, prenotazioni: Prenotazione[], sala: string, data: string): Prenotazione | null {
  const slotMin = oraToMinuti(slot);
  const slotFineMin = slotMin + SLOT_MINUTI;
  
  for (const p of prenotazioni) {
    if (p.data !== data) continue;
    if (sala !== "Tutte" && p.sala !== sala) continue;
    
    const inizioMin = oraToMinuti(p.oraInizio);
    const fineMin = oraToMinuti(p.oraFine);
    
    if (slotMin < fineMin && slotFineMin > inizioMin) {
      return p;
    }
  }
  return null;
}

function contaSlotLiberi(prenotazioni: Prenotazione[], sala: string, data: string): { liberi: number; totali: number } {
  const totali = SLOTS.length;
  let occupati = 0;
  
  for (const slot of SLOTS) {
    if (slotOccupato(slot, prenotazioni, sala, data)) {
      occupati++;
    }
  }
  
  return { liberi: totali - occupati, totali };
}

function getGiorniMese(anno: number, mese: number): Date[] {
  const giorni: Date[] = [];
  const primoGiorno = new Date(anno, mese, 1);
  const ultimoGiorno = new Date(anno, mese + 1, 0);
  
  for (let d = 1; d <= ultimoGiorno.getDate(); d++) {
    giorni.push(new Date(anno, mese, d));
  }
  return giorni;
}

function getGiorniSettimana(dataRiferimento: Date): Date[] {
  const giorni: Date[] = [];
  const giorno = dataRiferimento.getDay();
  const lunedi = new Date(dataRiferimento);
  lunedi.setDate(dataRiferimento.getDate() - (giorno === 0 ? 6 : giorno - 1));
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(lunedi);
    d.setDate(lunedi.getDate() + i);
    giorni.push(d);
  }
  return giorni;
}

function formatData(date: Date): string {
  return date.toISOString().split('T')[0];
}

const oggi = formatData(new Date());

const PRENOTAZIONI_DEMO: Prenotazione[] = [
  {
    id: "1",
    sala: "Sala A",
    data: oggi,
    oraInizio: "16:00",
    oraFine: "17:00",
    cliente: "Rossi",
    telefono: "333-1234567",
    pagato: false
  },
  {
    id: "2",
    sala: "Sala B",
    data: oggi,
    oraInizio: "18:00",
    oraFine: "19:30",
    cliente: "Bianchi",
    telefono: "339-7654321",
    pagato: true
  }
];

export default function Test3Gae() {
  const [tab, setTab] = useState<"timeline" | "nuova" | "riepilogo">("timeline");
  const [dataSelezionata, setDataSelezionata] = useState(oggi);
  const [salaSelezionata, setSalaSelezionata] = useState("Tutte");
  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[]>(PRENOTAZIONI_DEMO);
  
  const [nuovaPrenotazione, setNuovaPrenotazione] = useState({
    sala: "Sala A",
    oraInizio: "09:00",
    oraFine: "10:00",
    cliente: "",
    telefono: "",
    pagato: false
  });
  
  const [vistaCalendario, setVistaCalendario] = useState<"mese" | "settimana">("settimana");

  const dataObj = new Date(dataSelezionata);
  const anno = dataObj.getFullYear();
  const mese = dataObj.getMonth();

  const conflitto = useMemo(() => {
    const inizioMin = oraToMinuti(nuovaPrenotazione.oraInizio);
    const fineMin = oraToMinuti(nuovaPrenotazione.oraFine);
    
    if (fineMin <= inizioMin) return "L'ora fine deve essere successiva all'ora inizio";
    
    for (const p of prenotazioni) {
      if (p.data !== dataSelezionata) continue;
      if (p.sala !== nuovaPrenotazione.sala) continue;
      
      const pInizio = oraToMinuti(p.oraInizio);
      const pFine = oraToMinuti(p.oraFine);
      
      if (inizioMin < pFine && fineMin > pInizio) {
        return `Conflitto con prenotazione ${p.cliente} (${p.oraInizio}-${p.oraFine})`;
      }
    }
    return null;
  }, [nuovaPrenotazione, prenotazioni, dataSelezionata]);

  const creaPrenotazione = () => {
    if (conflitto || !nuovaPrenotazione.cliente.trim()) return;
    
    const nuova: Prenotazione = {
      id: Date.now().toString(),
      sala: nuovaPrenotazione.sala,
      data: dataSelezionata,
      oraInizio: nuovaPrenotazione.oraInizio,
      oraFine: nuovaPrenotazione.oraFine,
      cliente: nuovaPrenotazione.cliente,
      telefono: nuovaPrenotazione.telefono,
      pagato: nuovaPrenotazione.pagato
    };
    
    setPrenotazioni(prev => [...prev, nuova]);
    setNuovaPrenotazione({
      sala: "Sala A",
      oraInizio: "09:00",
      oraFine: "10:00",
      cliente: "",
      telefono: "",
      pagato: false
    });
    setTab("riepilogo");
  };

  const togglePagato = (id: string) => {
    setPrenotazioni(prev => prev.map(p => 
      p.id === id ? { ...p, pagato: !p.pagato } : p
    ));
  };

  const prenotazioniFiltrate = useMemo(() => {
    return prenotazioni
      .filter(p => p.data === dataSelezionata)
      .filter(p => salaSelezionata === "Tutte" || p.sala === salaSelezionata)
      .sort((a, b) => oraToMinuti(a.oraInizio) - oraToMinuti(b.oraInizio));
  }, [prenotazioni, dataSelezionata, salaSelezionata]);

  const giorniCalendario = useMemo(() => {
    if (vistaCalendario === "mese") {
      return getGiorniMese(anno, mese);
    } else {
      return getGiorniSettimana(dataObj);
    }
  }, [vistaCalendario, anno, mese, dataSelezionata]);

  const cambiaSettimana = (direzione: number) => {
    const nuovaData = new Date(dataSelezionata);
    nuovaData.setDate(nuovaData.getDate() + (direzione * 7));
    setDataSelezionata(formatData(nuovaData));
  };

  const cambiaMese = (direzione: number) => {
    const nuovaData = new Date(anno, mese + direzione, 1);
    setDataSelezionata(formatData(nuovaData));
  };

  const GIORNI_SETTIMANA = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
  const MESI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Affitto Sale</h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Data:</Label>
                <Input
                  type="date"
                  value={dataSelezionata}
                  onChange={(e) => setDataSelezionata(e.target.value)}
                  className="w-40"
                  data-testid="input-data"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Sala:</Label>
                <Select value={salaSelezionata} onValueChange={setSalaSelezionata}>
                  <SelectTrigger className="w-32" data-testid="select-sala">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tutte">Tutte</SelectItem>
                    {SALE.map(sala => (
                      <SelectItem key={sala} value={sala}>{sala}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex rounded-lg border overflow-hidden">
                <Button
                  variant={tab === "timeline" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTab("timeline")}
                  className="rounded-none"
                  data-testid="tab-timeline"
                >
                  <LayoutGrid className="w-4 h-4 mr-1" />
                  Timeline
                </Button>
                <Button
                  variant={tab === "nuova" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTab("nuova")}
                  className="rounded-none border-l"
                  data-testid="tab-nuova"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Nuova
                </Button>
                <Button
                  variant={tab === "riepilogo" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTab("riepilogo")}
                  className="rounded-none border-l"
                  data-testid="tab-riepilogo"
                >
                  <List className="w-4 h-4 mr-1" />
                  Riepilogo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* TIMELINE */}
        {tab === "timeline" && (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Timeline - {new Date(dataSelezionata).toLocaleDateString("it-IT", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                    <span>Libero</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                    <span>Occupato (non pagato)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                    <span>Occupato (pagato)</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-muted font-medium text-left w-24">Sala</th>
                      {SLOTS.map(slot => (
                        <th key={slot} className="border p-1 bg-muted font-medium text-center min-w-[50px]">
                          {slot}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(salaSelezionata === "Tutte" ? SALE : [salaSelezionata]).map(sala => (
                      <tr key={sala}>
                        <td className="border p-2 font-medium bg-muted/50">{sala}</td>
                        {SLOTS.map(slot => {
                          const prenotazione = slotOccupato(slot, prenotazioni, sala, dataSelezionata);
                          const isOccupato = prenotazione !== null;
                          const isPagato = prenotazione?.pagato;
                          
                          return (
                            <td
                              key={slot}
                              className={`border p-1 text-center cursor-pointer transition-colors ${
                                isOccupato
                                  ? isPagato
                                    ? 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30'
                                    : 'bg-red-100 hover:bg-red-200 dark:bg-red-900/30'
                                  : 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20'
                              }`}
                              title={prenotazione ? `${prenotazione.cliente} (${prenotazione.oraInizio}-${prenotazione.oraFine})` : 'Libero'}
                            >
                              {isOccupato && (
                                <span className="text-xs font-medium">
                                  {prenotazione?.cliente.substring(0, 3)}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* NUOVA PRENOTAZIONE */}
        {tab === "nuova" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form prenotazione */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Nuova Prenotazione
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Sala *</Label>
                    <Select 
                      value={nuovaPrenotazione.sala} 
                      onValueChange={(v) => setNuovaPrenotazione(prev => ({ ...prev, sala: v }))}
                    >
                      <SelectTrigger data-testid="select-nuova-sala">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SALE.map(sala => (
                          <SelectItem key={sala} value={sala}>{sala}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={dataSelezionata}
                      onChange={(e) => setDataSelezionata(e.target.value)}
                      data-testid="input-nuova-data"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Ora Inizio *</Label>
                    <Select 
                      value={nuovaPrenotazione.oraInizio} 
                      onValueChange={(v) => setNuovaPrenotazione(prev => ({ ...prev, oraInizio: v }))}
                    >
                      <SelectTrigger data-testid="select-ora-inizio">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SLOTS.map(slot => (
                          <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Ora Fine *</Label>
                    <Select 
                      value={nuovaPrenotazione.oraFine} 
                      onValueChange={(v) => setNuovaPrenotazione(prev => ({ ...prev, oraFine: v }))}
                    >
                      <SelectTrigger data-testid="select-ora-fine">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SLOTS.map(slot => (
                          <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                        ))}
                        <SelectItem value="22:00">22:00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Nome Cliente *</Label>
                    <Input
                      value={nuovaPrenotazione.cliente}
                      onChange={(e) => setNuovaPrenotazione(prev => ({ ...prev, cliente: e.target.value }))}
                      placeholder="Es. Mario Rossi"
                      data-testid="input-cliente"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Telefono</Label>
                    <Input
                      value={nuovaPrenotazione.telefono}
                      onChange={(e) => setNuovaPrenotazione(prev => ({ ...prev, telefono: e.target.value }))}
                      placeholder="Es. 333-1234567"
                      data-testid="input-telefono"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pagato"
                    checked={nuovaPrenotazione.pagato}
                    onCheckedChange={(checked) => setNuovaPrenotazione(prev => ({ ...prev, pagato: !!checked }))}
                    data-testid="checkbox-pagato"
                  />
                  <Label htmlFor="pagato" className="cursor-pointer">Pagato</Label>
                </div>
                
                {conflitto && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-red-700 dark:text-red-300">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-sm">{conflitto}</span>
                  </div>
                )}
                
                <Button
                  onClick={creaPrenotazione}
                  disabled={!!conflitto || !nuovaPrenotazione.cliente.trim()}
                  className="w-full sm:w-auto"
                  data-testid="button-crea-prenotazione"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crea Prenotazione
                </Button>
              </CardContent>
            </Card>

            {/* Calendario disponibilità */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Disponibilità
                  </CardTitle>
                  <div className="flex rounded-md border overflow-hidden">
                    <Button
                      variant={vistaCalendario === "settimana" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setVistaCalendario("settimana")}
                      className="rounded-none text-xs h-7 px-2"
                    >
                      Settimana
                    </Button>
                    <Button
                      variant={vistaCalendario === "mese" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setVistaCalendario("mese")}
                      className="rounded-none text-xs h-7 px-2 border-l"
                    >
                      Mese
                    </Button>
                  </div>
                </div>
                
                {/* Navigazione */}
                <div className="flex items-center justify-between mt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => vistaCalendario === "mese" ? cambiaMese(-1) : cambiaSettimana(-1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    {vistaCalendario === "mese" 
                      ? `${MESI[mese]} ${anno}`
                      : `Settimana del ${giorniCalendario[0]?.toLocaleDateString("it-IT", { day: 'numeric', month: 'short' })}`
                    }
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => vistaCalendario === "mese" ? cambiaMese(1) : cambiaSettimana(1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                {vistaCalendario === "settimana" ? (
                  <div className="space-y-1">
                    {giorniCalendario.map((giorno, idx) => {
                      const dataStr = formatData(giorno);
                      const { liberi, totali } = contaSlotLiberi(prenotazioni, nuovaPrenotazione.sala, dataStr);
                      const isSelected = dataStr === dataSelezionata;
                      const isOggi = dataStr === oggi;
                      
                      return (
                        <div
                          key={idx}
                          onClick={() => setDataSelezionata(dataStr)}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-primary text-primary-foreground' 
                              : isOggi
                                ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100'
                                : 'hover:bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium w-8">{GIORNI_SETTIMANA[idx]}</span>
                            <span className="text-sm">{giorno.getDate()}</span>
                          </div>
                          <Badge variant={liberi === totali ? "default" : liberi > 0 ? "secondary" : "destructive"} className="text-xs">
                            {liberi}/{totali}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {GIORNI_SETTIMANA.map(g => (
                        <div key={g} className="text-center text-xs font-medium text-muted-foreground p-1">
                          {g}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {/* Padding per primo giorno del mese */}
                      {Array.from({ length: (new Date(anno, mese, 1).getDay() + 6) % 7 }).map((_, i) => (
                        <div key={`empty-${i}`} className="p-1"></div>
                      ))}
                      {giorniCalendario.map((giorno, idx) => {
                        const dataStr = formatData(giorno);
                        const { liberi, totali } = contaSlotLiberi(prenotazioni, nuovaPrenotazione.sala, dataStr);
                        const isSelected = dataStr === dataSelezionata;
                        const isOggi = dataStr === oggi;
                        const percentualeLiberi = liberi / totali;
                        
                        return (
                          <div
                            key={idx}
                            onClick={() => setDataSelezionata(dataStr)}
                            className={`p-1 text-center rounded cursor-pointer transition-colors text-xs ${
                              isSelected 
                                ? 'bg-primary text-primary-foreground' 
                                : isOggi
                                  ? 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200'
                                  : percentualeLiberi === 1
                                    ? 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20'
                                    : percentualeLiberi > 0.5
                                      ? 'bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20'
                                      : percentualeLiberi > 0
                                        ? 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20'
                                        : 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20'
                            }`}
                            title={`${liberi} slot liberi su ${totali}`}
                          >
                            <div className="font-medium">{giorno.getDate()}</div>
                            <div className="text-[10px] opacity-75">{liberi}/{totali}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                  Sala: <strong>{nuovaPrenotazione.sala}</strong>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* RIEPILOGO GIORNO */}
        {tab === "riepilogo" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="w-5 h-5" />
                Riepilogo - {new Date(dataSelezionata).toLocaleDateString("it-IT", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                {salaSelezionata !== "Tutte" && <Badge variant="outline">{salaSelezionata}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {prenotazioniFiltrate.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nessuna prenotazione per questa data</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {prenotazioniFiltrate.map(p => (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        p.pagato 
                          ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                          : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[80px]">
                          <div className="text-lg font-bold">{p.oraInizio}</div>
                          <div className="text-xs text-muted-foreground">- {p.oraFine}</div>
                        </div>
                        <div>
                          <div className="font-medium">{p.cliente}</div>
                          <div className="text-sm text-muted-foreground">{p.sala}</div>
                          {p.telefono && <div className="text-xs text-muted-foreground">{p.telefono}</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={p.pagato ? "default" : "destructive"}>
                          {p.pagato ? "Pagato" : "Non pagato"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePagato(p.id)}
                          data-testid={`toggle-pagato-${p.id}`}
                        >
                          Toggle Pagato
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
