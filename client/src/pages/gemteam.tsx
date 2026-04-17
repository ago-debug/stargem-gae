import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useActiveUsers } from "@/hooks/use-active-users";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Users2, ShieldCheck, PieChart, Home, ClipboardList, PenTool, ChevronLeft, ChevronRight, CalendarDays, CheckCircle2, Search, Mail, Phone, MapPin, UserPlus, Download, Plus, Activity, LogIn, LogOut } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Mock data
// Tipizzazioni mock fallback (le rimpiazzeremo logicamente runtime con API format)
interface GemTeamMember {
  id: number;
  nome: string;
  cognome: string;
  team: string;
  ruolo: string;
  attivo: boolean;
  tariffa: number | null;
  fisso: boolean;
  email?: string;
  phone?: string;
  photo_url?: string;
  userId?: string | null;
  last_seen_at?: string | null;
  current_session_start?: string | null;
  last_session_duration?: number | null;
}

const TEAM_COLORS: Record<string, string> = {
  'segreteria': 'bg-pink-100 text-pink-700',
  'ass_manutenzione': 'bg-orange-100 text-orange-700',
  'ufficio': 'bg-blue-100 text-blue-700',
  'amministrazione': 'bg-purple-100 text-purple-700',
  'collaboratori': 'bg-slate-200 text-slate-800'
};

const TEAM_LABELS: Record<string, string> = {
  'segreteria': 'Segreteria',
  'ass_manutenzione': 'Manutenzione',
  'ufficio': 'Ufficio',
  'amministrazione': 'Amministrazione',
  'collaboratori': 'COLLABORATORE EXT'
};

const WEEKS = ["A", "B", "C", "D", "E"];
const DAYS = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

const TIME_SLOTS = Array.from({length: 31}, (_, i) => {
  const totalMinutes = 8 * 60 + 30 + (i * 30);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

const SHIFT_COLORS: Record<string, string> = {
  "RECEPTION": "bg-blue-100 text-blue-800 border-blue-200",
  "PAUSA": "bg-slate-100 text-slate-600 border-slate-200",
  "RIPOSO": "bg-slate-300 text-slate-800 border-slate-400 font-bold",
  "UFFICIO": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "AMM.ZIONE": "bg-purple-100 text-purple-800 border-purple-200",
  "PRIMO": "bg-teal-100 text-teal-800 border-teal-200",
  "SECONDO": "bg-teal-100 text-teal-800 border-teal-200",
  "RIUNIONE": "bg-amber-100 text-amber-800 border-amber-200",
  "STUDIO_1": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "STUDIO_2": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "MALATTIA": "bg-red-100 text-red-800 border-red-200",
  "PERMESSO": "bg-orange-100 text-orange-800 border-orange-200",
};

const getMockShift = (emp: string, week: string, day: string, time: string) => {
  if (!week) return null;
  if (emp === "Alexandra") {
    if (week === "A" || week === "B") {
      if (day === "Lunedì" && time >= "08:30" && time <= "14:00") return time === "11:30" ? "PAUSA" : "RECEPTION";
      if (day === "Mercoledì" && time >= "15:00" && time <= "21:30") return time === "19:00" ? "PAUSA" : "PRIMO";
      if (day === "Giovedì" && time >= "09:00" && time <= "15:30") return time === "13:00" ? "PAUSA" : "AMM.ZIONE";
    }
  }
  if (emp === "Giuditta") {
    if (week === "A" || week === "C") {
      if (day === "Martedì" && time >= "14:00" && time <= "21:00") return time === "18:00" ? "PAUSA" : "SECONDO";
      if (day === "Venerdì" && time >= "08:30" && time <= "15:00") return "RECEPTION";
      if (day === "Domenica") return "RIPOSO";
    }
  }
  if (emp === "Jasir") {
    if (week === "A" || week === "D" || week === "E") {
      if (day === "Mercoledì" && time >= "10:00" && time <= "17:00") return time === "13:30" ? "RIUNIONE" : "UFFICIO";
      if (day === "Venerdì" && time >= "14:30" && time <= "22:00") return "SECONDO";
      if (day === "Sabato") return "RIPOSO";
    }
  }
  if (emp === "Estefany") {
    if (day === "Lunedì" && time >= "16:00" && time <= "23:00") return "PRIMO";
    if (day === "Giovedì" && time >= "09:00" && time <= "14:00") return "UFFICIO";
    if (day === "Sabato" && time >= "10:00" && time <= "18:00") return time === "14:00" ? "PAUSA" : "RECEPTION";
  }
  return null;
}

const getWeekLabel = (offset: number) => {
  const baseStart = new Date(2026, 3, 13); // 13 Apr 2026
  const start = new Date(baseStart.getTime() + offset * 7 * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${start.toLocaleDateString('it-IT', options)} - ${end.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}`;
};

const PR_DAYS = ["M", "G", "V", "S", "D", "L", "M", "M", "G", "V", "S", "D", "L", "M", "M", "G", "V", "S", "D", "L", "M", "M", "G", "V", "S", "D", "L", "M", "M", "G"];
const PRESENZE_COLORS: Record<string, string> = {
  "FE": "bg-sky-100 text-sky-800",
  "PE": "bg-yellow-100 text-yellow-800",
  "ML": "bg-orange-100 text-orange-800",
  "F": "bg-purple-100 text-purple-800",
  "AI": "bg-red-100 text-red-800"
};

function fmtOre(ore: number | null): string {
  if (!ore || ore < 0.1) return '–';
  const h = Math.floor(ore);
  const m = Math.round((ore - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function GemTeam() {
  const { user } = useAuth();
  const { data: activeUsers = [] } = useActiveUsers();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedWeek, setSelectedWeek] = useState("A");
  
  // API Calls
  const { data: dipendentiAPI = [], isLoading: isLoadingDipendenti, isError: isErrorDipendenti } = useQuery<any[]>({
    queryKey: ['/api/gemteam/dipendenti'],
  });

  const dipendenti: GemTeamMember[] = useMemo(() => {
    const sortedAPI = [...dipendentiAPI].sort((a, b) =>
      (a.lastName || '').localeCompare(b.lastName || '', 'it') ||
      (a.firstName || '').localeCompare(b.firstName || '', 'it')
    );

    return sortedAPI.map(d => ({
      id: d.id,
      userId: d.userId,
      nome: d.firstName || (d.username === 'admin' ? 'Admin' : d.username === 'botAI' ? 'Bot' : 'Sconosciuto'),
      cognome: d.lastName || (d.username === 'admin' ? 'Manager' : d.username === 'botAI' ? 'AI' : ''),
      team: (d.team === 'Staff' || d.team === 'staff') ? 'collaboratori' : (d.team || 'collaboratori'),
      ruolo: (d.noteHr === 'Staff' || d.noteHr === 'staff') ? 'N/A' : (d.noteHr || "N/A"),
      attivo: d.attivo,
      tariffa: d.tariffaOraria ? parseFloat(d.tariffaOraria) : null,
      fisso: !!d.stipendioFissoMensile,
      email: d.email,
      phone: d.phone,
      photo_url: d.photoUrl,
      last_seen_at: d.lastSeenAt,
      current_session_start: d.currentSessionStart,
      last_session_duration: d.lastSessionDuration
    }));
  }, [dipendentiAPI]);

  const MOCK_EMPLOYEES = useMemo(() => dipendenti.map(d => d.nome), [dipendenti]);
  const [selectedEmployee, setSelectedEmployee] = useState(MOCK_EMPLOYEES[0] || "Seleziona...");

  const [calWeekOffset, setCalWeekOffset] = useState(0);
  const [programmedWeeks, setProgrammedWeeks] = useState<Record<number, string>>({});
  const [draftTemplate, setDraftTemplate] = useState("A");

  // Tab Dipendenti State
  const [searchTerm, setSearchTerm] = useState("");

  const selectedEmpId = useMemo(() => {
    const found = dipendenti.find(d => 
      d.nome === selectedEmployee || 
      `${d.cognome} ${d.nome}` === selectedEmployee || 
      `${d.nome} ${d.cognome}` === selectedEmployee ||
      d.id.toString() === selectedEmployee
    );
    return found?.id;
  }, [selectedEmployee, dipendenti]);

  const { data: turniData = [] } = useQuery({
    queryKey: ['/api/gemteam/turni', selectedEmpId, selectedWeek],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedEmpId) {
        params.append('employee_id', String(selectedEmpId));
      }
      params.append('settimana', selectedWeek || 'A');
      const r = await fetch(`/api/gemteam/turni?${params}`);
      return r.json();
    },
    enabled: true
  });

  const [teamFilter, setTeamFilter] = useState("tutti");
  const [selectedSheetDip, setSelectedSheetDip] = useState<GemTeamMember | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  function fmtMin(m?: number) {
    if (!m || m === 0) return "—";
    const h = Math.floor(m / 60);
    const min = Math.round(m % 60);
    return h > 0 ? `${h}h ${min}m` : `${min}m`;
  }

  // Tab Dashboard Checkins (Live)
  const { data: todayCheckinsData = [], isLoading: isLoadingCheckins } = useQuery<any[]>({
    queryKey: ['/api/gemteam/checkin/oggi'],
    refetchInterval: 60000, // Refresh automatico ogni 60 secondi
    queryFn: async () => {
      const r = await fetch('/api/gemteam/checkin/oggi');
      return r.json();
    }
  });

  const checkInStats = useMemo(() => {
    let inSede = 0; let online = 0; let usciti = 0; let attesi = 0; let assenti = 0;
    dipendenti.forEach(dip => {
      const chk = Array.isArray(todayCheckinsData) ? todayCheckinsData.find(c => c.employeeId === dip.id) : null;
      if (chk) {
        if (chk.lastEvent === "IN") inSede++;
        else if (chk.lastEvent === "OUT" && chk.lastTimestamp) usciti++;
        else if (chk.lastEvent === "ASSENTE") assenti++;
        else attesi++;
      } else {
        attesi++;
      }

      const presenceInfo = activeUsers.find((u: any) => u.id === dip.userId);
      if (presenceInfo && presenceInfo.stato === 'online') {
        online++;
      }
    });
    return { inSede, online, usciti, attesi, assenti };
  }, [todayCheckinsData, dipendenti, activeUsers]);

  const filteredDipendenti = useMemo(() => {
    const list = dipendenti.filter(d => {
      const matchText = (d.nome + " " + d.cognome).toLowerCase().includes(searchTerm.toLowerCase());
      const matchTeam = teamFilter === "tutti" || d.team === teamFilter;
      return matchText && matchTeam;
    });

    if (teamFilter === "tutti" || teamFilter === "collaboratori") {
      const agoMock: GemTeamMember = {
        id: 9999,
        nome: "Agostino",
        cognome: "P.",
        team: "collaboratori",
        ruolo: "Developer AI",
        attivo: true,
        tariffa: null,
        fisso: false,
        email: "agostino@studiogem.it"
      };
      if ((agoMock.nome + " " + agoMock.cognome).toLowerCase().includes(searchTerm.toLowerCase())) {
        list.push(agoMock);
      }
    }

    return list;
  }, [searchTerm, teamFilter, dipendenti]);

  // Tab Presenze State
  const [selectedMonthYear, setSelectedMonthYear] = useState("04-2026");
  const [meseRaw, annoRaw] = selectedMonthYear.split("-");
  
  const { data: presenzeAPI = [], isLoading: isLoadingPresenze, isFetching: isFetchingPresenze } = useQuery<any[]>({
    queryKey: ['/api/gemteam/presenze', annoRaw, meseRaw],
  });

  const [presenzeEdited, setPresenzeEdited] = useState<Record<number, Record<number, boolean>>>({});
  
  // Real-time grid map calculation
  const presenzeData = useMemo(() => {
    const data: Record<number, Record<number, string>> = {};
    dipendenti.forEach(dip => {
      data[dip.id] = {};
    });
    
    presenzeAPI.forEach(r => {
      const date = new Date(r.data);
      const dayStr = date.getDate();
      if (!data[r.employeeId]) data[r.employeeId] = {};
      
      let val = "";
      if (r.tipoAssenza) {
        val = r.tipoAssenza;
      } else if (r.oreLavorate !== null && r.oreLavorate !== undefined) {
        val = r.oreLavorate.toString();
      }
      data[r.employeeId][dayStr] = val;
    });
    return data;
  }, [presenzeAPI, dipendenti]);

  const presenzeMutation = useMutation({
    mutationFn: async ({ employee_id, day, value }: any) => {
      let ore_lavorate = null;
      let tipo_assenza = null;
      
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        ore_lavorate = parsed;
      } else if (value && ["FE", "PE", "ML", "F", "AI"].includes(value)) {
        tipo_assenza = value;
      }
      
      const dbDate = `${annoRaw}-${meseRaw}-${String(day).padStart(2, '0')}`;
      
      await apiRequest("POST", "/api/gemteam/presenze", {
        employee_id,
        data: dbDate,
        ore_lavorate,
        tipo_assenza,
        note: null
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/gemteam/presenze', annoRaw, meseRaw] });
      setPresenzeEdited(prev => ({...prev, [variables.employee_id]: {...(prev[variables.employee_id]||{}), [variables.day]: true}}));
    }
  });

  const updatePresenza = (dipId: number, day: number, value: string) => {
    presenzeMutation.mutate({employee_id: dipId, day, value });
  };

  // Tab Report State
  const [reportSelectedMonthYear, setReportSelectedMonthYear] = useState("04-2026");
  const [reportMeseRaw, reportAnnoRaw] = reportSelectedMonthYear.split("-");
  
  const { data: reportData = [], isLoading: isLoadingReport, refetch: refetchReport } = useQuery<any[]>({
    queryKey: ['/api/gemteam/report', reportAnnoRaw, reportMeseRaw],
    enabled: false // generato on-demand
  });

  const { data: reportLocked = false } = useQuery<boolean>({
    queryKey: ['/api/gemteam/report/lock', reportAnnoRaw, reportMeseRaw],
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      // Simuliamo la chiamata POST per la generazione dato che l'endpoint potrebbe calcolare in realtime
      await apiRequest("POST", `/api/gemteam/report/genera/${reportAnnoRaw}/${reportMeseRaw}`);
    },
    onSuccess: () => refetchReport()
  });

  const lockMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/gemteam/report/lock/${reportAnnoRaw}/${reportMeseRaw}`, { locked: true });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/gemteam/report/lock', reportAnnoRaw, reportMeseRaw] })
  });

  // Checkin Individuale nello Sheet
  const { data: sheetCheckinStatus, refetch: refetchSheetCheckin } = useQuery({
    queryKey: ['/api/gemteam/checkin/status', selectedSheetDip?.id],
    queryFn: async () => {
       if (!selectedSheetDip?.id) return null;
       const r = await fetch(`/api/gemteam/checkin/status/${selectedSheetDip.id}`);
       return r.json();
    },
    enabled: !!selectedSheetDip?.id && isSheetOpen
  });

  const checkinMutation = useMutation({
    mutationFn: async ({ tipo, employee_id }: { tipo: 'IN' | 'OUT', employee_id: number }) => {
      const r = await fetch('/api/gemteam/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, employee_id })
      });
      return r.json();
    },
    onSuccess: () => {
      refetchSheetCheckin();
      queryClient.invalidateQueries({ queryKey: ['/api/gemteam/checkin/oggi'] }); // Refetch tab generale dashboard
    }
  });

  // Auth Guard rimossa: la dashboard è visibile a tutti i dipendenti senza filtro ruolo.
  const userRole = (user as any)?.role?.toLowerCase() || "";
  const isAllowed = ['admin', 'master', 'direzione', 'super admin', 'amministratore totale'].includes(userRole);

  return (
    <div className="p-6 md:p-8 space-y-8 w-full max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users2 className="w-8 h-8 text-primary" />
            GemTeam
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs mt-1">
              TEAM MANAGER
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestione risorse umane, turni e stipendi
          </p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 text-sm shadow-sm">
            <Users2 className="w-4 h-4 mr-1.5" /> {dipendenti.length} Dipendenti
          </Badge>
        </div>
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-flow-auto grid-cols-3 md:grid-cols-6 h-auto p-1.5 gap-1.5 bg-slate-100 rounded-xl mb-8">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
            <Home className="w-4 h-4 mr-2" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="dipendenti" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
            <Users2 className="w-4 h-4 mr-2" /> Dipendenti
          </TabsTrigger>
          <TabsTrigger value="turni" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
            <ShieldCheck className="w-4 h-4 mr-2" /> Turni
          </TabsTrigger>
          <TabsTrigger value="presenze" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
            <ClipboardList className="w-4 h-4 mr-2" /> Presenze
          </TabsTrigger>
          <TabsTrigger value="diario" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
            <PenTool className="w-4 h-4 mr-2" /> Diario
          </TabsTrigger>
          <TabsTrigger value="report" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
            <PieChart className="w-4 h-4 mr-2" /> Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="relative flex h-3 w-3 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Presenze Oggi (Live)
            </h2>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
              <Card className="bg-emerald-50 border-emerald-200 shadow-sm">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <span className="text-3xl font-black text-emerald-600 mb-1">{checkInStats.inSede}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">In Sede</span>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200 shadow-sm">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <span className="text-3xl font-black text-blue-600 mb-1">{checkInStats.online}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Online</span>
                </CardContent>
              </Card>
              <Card className="bg-slate-100 border-slate-200 shadow-sm">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <span className="text-3xl font-black text-slate-500 mb-1">{checkInStats.usciti}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Usciti</span>
                </CardContent>
              </Card>
              <Card className="bg-yellow-50 border-yellow-200 shadow-sm">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <span className="text-3xl font-black text-yellow-600 mb-1">{checkInStats.attesi}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-yellow-800">Non Pervenuti</span>
                </CardContent>
              </Card>
              <Card className="bg-rose-50 border-rose-200 shadow-sm">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <span className="text-3xl font-black text-rose-600 mb-1">{checkInStats.assenti}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-800">Assenti</span>
                </CardContent>
              </Card>
            </div>

            {/* List */}
            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-4 font-bold">DIPENDENTE</th>
                      <th className="p-4 font-bold">SEDE</th>
                      <th className="p-4 font-bold">ONLINE</th>
                      <th className="p-4 text-right font-bold">ORE SEDE</th>
                      <th className="p-4 text-right font-bold">ORE ONLINE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dipendenti.length === 0 && isLoadingDipendenti && (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-500">Caricamento dipendenti...</td></tr>
                    )}
                    {dipendenti.map(dip => {
                      const chk = Array.isArray(todayCheckinsData) ? todayCheckinsData.find(c => c.employeeId === dip.id) : null;
                      const stato = chk?.lastEvent || "ATTESO";
                      const oreSede = chk && chk.oreOggi > 0 ? fmtOre(Number(chk.oreOggi)) : "—";

                      const presenceInfo = activeUsers.find((u: any) => u.id === dip.userId);
                      const isOnline = presenceInfo && presenceInfo.stato === 'online';
                      const oreOnline = presenceInfo?.lavoroOggiMinuti ? fmtMin(presenceInfo.lavoroOggiMinuti) : "—";
                      
                      const statoColors: Record<string, string> = {
                        "IN": "bg-emerald-100 text-emerald-800 border-emerald-200",
                        "OUT": "bg-slate-100 text-slate-700 border-slate-200",
                        "ATTESO": "bg-yellow-100 text-yellow-800 border-yellow-200",
                        "ASSENTE": "bg-rose-100 text-rose-800 border-rose-200"
                      };
                      const statoLabel = stato === "IN" ? "🟢 IN SEDE" : (stato === "OUT" && chk?.lastTimestamp) ? "⚪ USCITO" : (stato === "ASSENTE") ? "🔴 ASSENTE" : "🟡 ATTESO";

                      return (
                        <tr key={dip.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-bold text-slate-800 flex items-center gap-3">
                            <Avatar className={`w-8 h-8 border ring-1 ring-offset-1 ${dip.team === 'segreteria' ? 'ring-pink-100' : 'ring-slate-100'}`}>
                              {dip.photo_url ? <AvatarImage src={dip.photo_url} /> : null}
                              <AvatarFallback className={`text-[10px] ${TEAM_COLORS[dip.team]}`}>{dip.nome.charAt(0)}{dip.cognome.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {dip.cognome} {dip.nome}
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className={`${statoColors[stato] || statoColors["ATTESO"]} font-bold shadow-sm`}>{statoLabel}</Badge>
                          </td>
                          <td className="p-4">
                            {isOnline ? (
                               <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold shadow-sm">
                                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse inline-block"></span>
                                 ONLINE
                               </Badge>
                            ) : (
                               <Badge variant="outline" className="bg-slate-100 text-slate-500 border-transparent">
                                 OFFLINE
                               </Badge>
                            )}
                          </td>
                          <td className="p-4 text-right font-bold text-slate-700">{oreSede}</td>
                          <td className="p-4 text-right font-bold text-slate-700">{oreOnline}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dipendenti">
          <div className="space-y-6">
            {/* Filtri */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cerca dipendente..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <ToggleGroup type="single" value={teamFilter} onValueChange={(val) => {if(val) setTeamFilter(val)}} className="bg-white border rounded-lg p-1 overflow-x-auto w-full justify-start md:w-auto">
                <ToggleGroupItem value="tutti" className="px-3 h-8 text-xs font-semibold data-[state=on]:bg-slate-800 data-[state=on]:text-white">Tutti</ToggleGroupItem>
                <ToggleGroupItem value="segreteria" className="px-3 h-8 text-xs font-semibold data-[state=on]:bg-pink-100 data-[state=on]:text-pink-800">Segreteria</ToggleGroupItem>
                <ToggleGroupItem value="ass_manutenzione" className="px-3 h-8 text-xs font-semibold data-[state=on]:bg-orange-100 data-[state=on]:text-orange-800">Manutenzione</ToggleGroupItem>
                <ToggleGroupItem value="ufficio" className="px-3 h-8 text-xs font-semibold data-[state=on]:bg-blue-100 data-[state=on]:text-blue-800">Ufficio</ToggleGroupItem>
                <ToggleGroupItem value="amministrazione" className="px-3 h-8 text-xs font-semibold data-[state=on]:bg-purple-100 data-[state=on]:text-purple-800">Amministrazione</ToggleGroupItem>
                <ToggleGroupItem value="collaboratori" className="px-3 h-8 text-xs font-semibold data-[state=on]:bg-slate-200 data-[state=on]:text-slate-800">Collaboratori</ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Griglia Dipendenti */}
            {isLoadingDipendenti ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 {[1,2,3,4,5,6].map(sk => <Skeleton key={sk} className="h-48 rounded-xl" />)}
               </div>
            ) : isErrorDipendenti ? (
               <div className="col-span-full py-12 text-center bg-red-50 border border-red-200 rounded-xl text-red-600 font-semibold">
                  Errore di connessione al database Team.
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDipendenti.map(dip => (
                  <Card 
                    key={dip.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer border-slate-200"
                    onClick={() => {
                      setSelectedSheetDip(dip);
                      setIsSheetOpen(true);
                    }}
                  >
                    <CardContent className="p-5 flex flex-col items-center text-center relative">
                      {/* Badge Attivo */}
                      {dip.attivo ? (
                        <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-green-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          IN SERVIZIO
                        </div>
                      ) : (
                        <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          FUORI SERVIZIO
                        </div>
                      )}
                      
                      <Avatar className={`w-16 h-16 mb-3 border-2 border-white shadow-sm ring-2 ${dip.team === 'segreteria' ? 'ring-pink-100' : dip.team === 'ass_manutenzione' ? 'ring-orange-100' : dip.team === 'ufficio' ? 'ring-blue-100' : dip.team === 'collaboratori' ? 'ring-slate-200' : 'ring-purple-100'}`}>
                        {dip.photo_url ? (
                          <AvatarImage src={dip.photo_url} alt={dip.nome} className="object-cover" />
                        ) : null}
                        <AvatarFallback className={`text-lg font-bold ${TEAM_COLORS[dip.team] || 'bg-slate-200 text-slate-800'}`}>
                          {dip.nome.charAt(0)}{dip.cognome ? dip.cognome.charAt(0) : ''}
                        </AvatarFallback>
                      </Avatar>
                      
                      <h3 className="font-bold text-slate-800 truncate w-full px-2">{dip.cognome} {dip.nome}</h3>
                      <Badge variant="secondary" className={`mt-1 mb-3 text-[10px] uppercase font-bold tracking-wider ${TEAM_COLORS[dip.team] || 'bg-slate-200 text-slate-800'}`}>
                        {TEAM_LABELS[dip.team] || (dip.team === 'Staff' || dip.team === 'staff' ? 'COLLABORATORE EXT' : dip.team)}
                      </Badge>
                      
                      <div className="w-full bg-slate-50 rounded-lg p-2 mt-auto border border-slate-100">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium truncate pr-2">{dip.ruolo}</span>
                          <span className="font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border shadow-sm shrink-0">
                            {dip.fisso ? "Fisso" : dip.tariffa ? `€${dip.tariffa}/h` : "—"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredDipendenti.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-slate-50 border-dashed border-2 rounded-xl text-slate-400">
                    <Users2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    Nessun dipendente trovato per i filtri correnti.
                  </div>
                )}
              </div>
            )}
            
            {/* Sheet Pannello Laterale */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                {selectedSheetDip && (
                  <>
                    <SheetHeader className="text-left pb-6 border-b border-slate-100">
                      <div className="flex items-center gap-4 mb-2">
                        <Avatar className={`w-14 h-14 border mb-0 border-white shadow-sm ring-2 ${selectedSheetDip.team === 'segreteria' ? 'ring-pink-100' : selectedSheetDip.team === 'ass_manutenzione' ? 'ring-orange-100' : selectedSheetDip.team === 'ufficio' ? 'ring-blue-100' : 'ring-purple-100'}`}>
                          {selectedSheetDip.photo_url ? (
                            <AvatarImage src={selectedSheetDip.photo_url} alt={selectedSheetDip.nome} className="object-cover" />
                          ) : null}
                          <AvatarFallback className={`text-xl font-bold ${TEAM_COLORS[selectedSheetDip.team]}`}>
                            {selectedSheetDip.nome.charAt(0)}{selectedSheetDip.cognome.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <SheetTitle className="text-2xl text-slate-800 m-0 p-0 leading-none">
                            {selectedSheetDip.cognome} {selectedSheetDip.nome}
                          </SheetTitle>
                          <Badge variant="secondary" className={`mt-2 text-[10px] uppercase font-bold tracking-wider ${TEAM_COLORS[selectedSheetDip.team]}`}>
                            {TEAM_LABELS[selectedSheetDip.team]}
                          </Badge>
                        </div>
                      </div>
                      <SheetDescription className="pt-2 text-slate-500">
                        {selectedSheetDip.ruolo} • {selectedSheetDip.fisso ? "Compenso Fisso" : selectedSheetDip.tariffa ? `Tariffa Oraria: €${selectedSheetDip.tariffa}` : "—"}
                      </SheetDescription>
                    </SheetHeader>
                    
                    <div className="py-6 space-y-8">
                      {/* PRESENZA IN SEDE OGGI */}
                      <section>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-600" /> Presenza in Sede Oggi
                        </h4>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-600">Stato:</span>
                            <span className="text-sm font-bold">
                              {!sheetCheckinStatus || (sheetCheckinStatus.lastEvent === 'SCONOSCIUTO' || (sheetCheckinStatus.lastEvent === 'OUT' && !sheetCheckinStatus.checkInOggi)) 
                                ? "⚪ Non registrato" 
                                : sheetCheckinStatus.lastEvent === 'IN' 
                                ? `🟢 IN SEDE dalle ${new Date(sheetCheckinStatus.lastTimestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
                                : `🔴 Uscito alle ${new Date(sheetCheckinStatus.lastTimestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} — Ore: ${fmtOre(sheetCheckinStatus.oreOggi)}`
                              }
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Button 
                              variant="outline"
                              className="bg-green-600 hover:bg-green-700 text-white font-bold border-transparent shadow-sm" 
                              onClick={() => checkinMutation.mutate({ tipo: 'IN', employee_id: selectedSheetDip.id })}
                              disabled={!sheetCheckinStatus || sheetCheckinStatus.lastEvent === 'IN' || (sheetCheckinStatus.lastEvent === 'OUT' && sheetCheckinStatus.checkInOggi) || checkinMutation.isPending}
                            >
                              <LogIn className="w-4 h-4 mr-2" /> ENTRA IN SEDE
                            </Button>
                            <Button 
                              variant="destructive" 
                              className="font-bold shadow-sm"
                              onClick={() => checkinMutation.mutate({ tipo: 'OUT', employee_id: selectedSheetDip.id })}
                              disabled={!sheetCheckinStatus || sheetCheckinStatus.lastEvent !== 'IN' || checkinMutation.isPending}
                            >
                              <LogOut className="w-4 h-4 mr-2" /> ESCI SEDE
                            </Button>
                          </div>
                        </div>
                      </section>

                      {/* ANAGRAFICA */}
                      <section>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                          <UserPlus className="w-4 h-4" /> Anagrafica e Recapiti
                        </h4>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                          <div className="flex items-center gap-3 text-sm text-slate-600">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <span>{selectedSheetDip.email || "—"}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-600">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <span>{selectedSheetDip.phone || "—"}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-600">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span>—</span>
                          </div>
                        </div>
                      </section>

                      {/* ATTIVITÀ RECENTE */}
                      <section>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                          <Activity className="w-4 h-4" /> Attività Recente
                        </h4>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-3">
                          {(() => {
                            const presenceInfo = activeUsers.find((u: any) => u.id === selectedSheetDip.userId);
                            
                            let lavoroMins = 0;
                            let pausaMins = 0;
                            let statoStr = "OFFLINE";
                            let badgeStyle = "bg-slate-200 text-slate-500 border-slate-300";
                            let lastSeenStr = "Mai";

                            if (presenceInfo) {
                                lavoroMins = presenceInfo.lavoroOggiMinuti || 0;
                                pausaMins = presenceInfo.pausaOggiMinuti || 0;
                                
                                if (presenceInfo.stato === 'online') {
                                    statoStr = "ONLINE";
                                    badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-200";
                                } else if (presenceInfo.stato === 'pausa') {
                                    statoStr = "IN PAUSA";
                                    badgeStyle = "bg-amber-100 text-amber-800 border-amber-200";
                                }
                                
                                if (presenceInfo.lastSeenAt) {
                                    lastSeenStr = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' }).format(new Date(presenceInfo.lastSeenAt));
                                }
                            }

                            function fmtMin(m: number) {
                              if (!m || m === 0) return "0m";
                              const h = Math.floor(m / 60);
                              const min = m % 60;
                              return h > 0 ? `${h}h ${min}m` : `${min}m`;
                            }

                            return (
                              <>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-500">Stato:</span>
                                  <Badge variant="outline" className={`${badgeStyle} font-bold`}>
                                    {statoStr === "ONLINE" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse inline-block"></span>}
                                    {statoStr === "IN PAUSA" && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 inline-block"></span>}
                                    {statoStr}
                                  </Badge>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-500">Lavoro online oggi:</span>
                                  <span className="font-semibold text-slate-700">{fmtMin(lavoroMins)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-500">Presenza fisica:</span>
                                  <span className="font-semibold text-slate-400 italic">[da check-in]</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-500">Pausa oggi:</span>
                                  <span className="font-semibold text-slate-700">{fmtMin(pausaMins)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-500">Ultimo accesso:</span>
                                  <span className="font-semibold text-slate-700">{lastSeenStr}</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </section>

                      {/* TURNO OGGI */}
                      <section>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                          <ClipboardList className="w-4 h-4" /> Turno Oggi
                        </h4>
                        <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 border-dashed text-center">
                          <p className="text-sm text-blue-700 font-medium">Dato disponibile dopo F1-003.</p>
                        </div>
                      </section>
                      
                      {/* PRESENZE MESE */}
                      <section>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" /> Presenze Mese
                        </h4>
                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 border-dashed text-center">
                          <p className="text-sm text-slate-500 font-medium">Integrazione in corso.</p>
                        </div>
                      </section>
                      
                      {/* DOCUMENTI */}
                      <section>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                          <PenTool className="w-4 h-4" /> Documenti
                        </h4>
                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 border-dashed text-center">
                          <p className="text-sm text-slate-500 font-medium">Fascicolo digitale vuoto.</p>
                        </div>
                      </section>
                      
                      {/* ACTION BUTTON */}
                      <div className="pt-4 border-t border-slate-100">
                        <Button variant="outline" className="w-full h-11 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold bg-white shadow-sm">
                          <ShieldCheck className="w-4 h-4 mr-2" /> Crea Account di Sistema
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </TabsContent>

        <TabsContent value="turni">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-0 sm:p-6 space-y-6 bg-slate-50">
              
              {/* Toolbar */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-transparent lg:border-slate-200 pb-0 lg:pb-4 p-4 lg:p-0">
                <div className="flex items-center gap-4 w-full lg:w-auto">
                  <div className="w-full sm:w-64">
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger className="font-semibold bg-white border-slate-300 shadow-sm w-full">
                        <SelectValue placeholder="Seleziona dipendente" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_EMPLOYEES.map(emp => (
                          <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="hidden sm:flex text-sm shrink-0 items-center gap-2">
                    <span className="text-slate-500">Squadra: </span>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-white shadow-sm border-slate-300 text-slate-700">
                      {selectedEmployee === 'Jasir' || selectedEmployee === 'Giuditta' ? 'Operator / Co-Admin' : 'Personale Operativo'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-1.5 rounded-lg border border-slate-300 shadow-sm w-full sm:w-auto overflow-x-auto">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest pl-2 shrink-0">Settimana</span>
                  <ToggleGroup type="single" value={selectedWeek} onValueChange={(val) => {if(val) setSelectedWeek(val)}} className="gap-1 shrink-0">
                    {WEEKS.map(w => (
                      <ToggleGroupItem key={w} value={w} className="w-8 h-8 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-bold shadow-sm transition-all hover:bg-slate-100">
                        {w}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              </div>

              {/* Grid Area */}
              <div className="mx-0 sm:mx-0 border-y sm:border rounded-none sm:rounded-xl shadow-inner scrollbar-thin overflow-auto max-h-[65vh] bg-slate-50/50">
                <table className="w-full border-collapse text-sm min-w-[800px] table-fixed">
                  <thead className="sticky top-0 z-20 shadow-sm">
                    <tr>
                      <th className="bg-slate-200 border-slate-300 border px-1 py-3 w-[60px] sm:w-[80px] text-[10px] sm:text-xs uppercase text-slate-600 tracking-wider">Ora</th>
                      {DAYS.map(day => (
                        <th key={day} className="bg-slate-200 border-slate-300 border p-2 w-auto font-semibold text-slate-700">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map(time => (
                      <tr key={time} className="hover:bg-blue-50/50 transition-colors group">
                        <td className="border border-slate-200 p-1 sm:p-2 text-center text-[10px] sm:text-xs font-bold text-slate-500 bg-white sticky left-0 z-10 shadow-[1px_0_0_0_#e2e8f0]">
                          {time}
                        </td>
                        {DAYS.map((day, idx) => {
                          const turniFound = Array.isArray(turniData) ? turniData.find((t: any) => t.giornoSettimana === idx && t.oraInizio === time) : null;
                          const shift = turniFound ? `${turniFound.postazione} ${turniFound.oraInizio}→${turniFound.oraFine}` : null;
                          return (
                            <td key={`${day}-${time}`} className="border border-slate-200 p-1 sm:p-1.5 relative group-hover:border-slate-300 transition-colors bg-white">
                              {shift && (
                                <div className={`text-[9px] sm:text-[10px] font-bold px-1 py-1.5 sm:px-2 sm:py-2 rounded-md border text-center shadow-sm whitespace-nowrap overflow-hidden text-ellipsis transition-all ${SHIFT_COLORS[shift] || 'bg-slate-100 text-slate-800'}`} title={shift}>
                                  {shift}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legenda rapida */}
              <div className="flex flex-wrap gap-1.5 pt-2 px-4 pb-4 sm:p-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center mr-2">Legenda Postazioni</span>
                {Object.entries(SHIFT_COLORS).map(([name, classes]) => (
                  <Badge key={name} variant="outline" className={`text-[9px] px-1.5 py-0.5 border ${classes} opacity-90 shadow-sm`}>
                    {name}
                  </Badge>
                ))}
              </div>

            </CardContent>
          </Card>

          {/* SEPARATORE */}
          <div className="my-8 border-t border-slate-200" />

          {/* CALENDARIO REALE */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-4 sm:p-6 space-y-6 bg-slate-50">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-transparent lg:border-slate-200 pb-0 lg:pb-4 p-4 lg:p-0">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                    <CalendarDays className="w-5 h-5 text-primary" /> Programmazione Calendario
                  </h3>
                  <p className="text-sm text-slate-500">Programma i turni applicando la settimana tipo.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                  {/* Navigatore Settimana */}
                  <div className="flex items-center bg-white border border-slate-300 shadow-sm rounded-lg p-1 w-full sm:w-auto justify-between">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100" onClick={() => setCalWeekOffset(o => o - 1)}>
                      <ChevronLeft className="w-4 h-4 text-slate-600" />
                    </Button>
                    <div className="px-3 text-xs sm:text-sm font-semibold min-w-[150px] text-center text-slate-800">
                      Settimana {getWeekLabel(calWeekOffset)}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100" onClick={() => setCalWeekOffset(o => o + 1)}>
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </Button>
                  </div>
                  
                  {programmedWeeks[calWeekOffset] && (
                     <div className="hidden lg:flex items-center gap-2 text-xs font-bold px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg">
                       <CheckCircle2 className="w-4 h-4" /> Tipo {programmedWeeks[calWeekOffset]} Applicato
                     </div>
                  )}
                </div>
              </div>

              {/* GRIGLIA PROGRAMMATA O STATO VUOTO */}
              {programmedWeeks[calWeekOffset] ? (
                <div className="mx-0 sm:mx-0 border-y sm:border rounded-none sm:rounded-xl shadow-inner scrollbar-thin overflow-auto max-h-[65vh] bg-white">
                  <table className="w-full border-collapse text-sm min-w-[800px] table-fixed">
                    <thead className="sticky top-0 z-20 shadow-sm">
                      <tr>
                        <th className="bg-slate-100 border-slate-300 border px-1 py-3 w-[60px] sm:w-[80px] text-[10px] sm:text-xs uppercase text-slate-600 tracking-wider">Ora</th>
                        {DAYS.map(day => (
                          <th key={day} className="bg-slate-100 border-slate-300 border p-2 w-auto font-semibold text-slate-800">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {TIME_SLOTS.map(time => (
                        <tr key={time} className="hover:bg-blue-50/50 transition-colors group">
                          <td className="border border-slate-200 p-1 sm:p-2 text-center text-[10px] sm:text-xs font-bold text-slate-500 bg-white sticky left-0 z-10 shadow-[1px_0_0_0_#e2e8f0]">
                            {time}
                          </td>
                          {DAYS.map(day => {
                            const calTemplate = programmedWeeks[calWeekOffset];
                            const shift = getMockShift(selectedEmployee, calTemplate, day, time);
                            return (
                              <td key={`${day}-${time}`} className="border border-slate-200 p-1 sm:p-1.5 relative group-hover:border-slate-300 transition-colors bg-white">
                                {shift && (
                                  <div className={`text-[9px] sm:text-[10px] font-bold px-1 py-1.5 sm:px-2 sm:py-2 rounded-md border text-center shadow-sm whitespace-nowrap overflow-hidden text-ellipsis transition-all ${SHIFT_COLORS[shift] || 'bg-slate-100 text-slate-800'}`} title={shift}>
                                    {shift}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 py-16 bg-white border-dashed border-2 border-slate-200 rounded-xl shadow-sm text-center">
                  <CalendarDays className="w-16 h-16 text-slate-300 mb-4" />
                  <h4 className="text-xl font-bold text-slate-700">Nessun turno assegnato per questa settimana.</h4>
                  <p className="text-slate-500 max-w-md mx-auto mt-2 mb-6">
                    Questa settimana non ha ancora una programmazione base. Clicca qui sotto per importare una Settimana Tipo.
                  </p>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="font-semibold text-primary hover:bg-blue-50 text-sm shadow-sm border border-transparent hover:border-blue-100">
                        Applica template &rarr;
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Applica Template alla Settimana</AlertDialogTitle>
                        <AlertDialogDescription>
                          Scegli quale template applicare per popolare il calendario. Questo sovrascriverà eventuali eccezioni già approvate per questa settimana.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="py-4">
                        <Select value={draftTemplate} onValueChange={setDraftTemplate}>
                          <SelectTrigger className="w-full h-10">
                            <SelectValue placeholder="Seleziona un preset" />
                          </SelectTrigger>
                          <SelectContent>
                            {WEEKS.map(w => <SelectItem key={w} value={w}>Settimana Tipo {w}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                          setProgrammedWeeks(prev => ({...prev, [calWeekOffset]: draftTemplate}));
                        }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-8 rounded-md">
                          Applica Ora
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presenze">
          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
            <CardContent className="p-0 sm:p-6 space-y-6">
              
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-4 lg:p-0">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                    <ClipboardList className="w-5 h-5 text-primary" /> Foglio Presenze
                  </h3>
                  <p className="text-sm text-slate-500">Compilazione e verifica scostamenti orari.</p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                  {isFetchingPresenze && <span className="text-xs text-blue-500 font-bold animate-pulse">Aggiornamento...</span>}
                  <Select value={selectedMonthYear} onValueChange={setSelectedMonthYear}>
                    <SelectTrigger className="w-40 font-semibold bg-white border-slate-300 shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="04-2026">Aprile 2026</SelectItem>
                      <SelectItem value="05-2026">Maggio 2026</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="shadow-sm border-slate-300 bg-white">
                    <Download className="w-4 h-4 mr-2" /> Esporta
                  </Button>
                </div>
              </div>

              {isLoadingPresenze ? (
                <div className="p-12 flex flex-col items-center border border-slate-200 rounded-xl bg-slate-50 space-y-4">
                  <div className="animate-spin w-8 h-8 rounded-full border-4 border-slate-300 border-t-primary" />
                  <span className="text-slate-500 font-semibold">Caricamento presenze mese {meseRaw}/{annoRaw}...</span>
                </div>
              ) : (
                <div className="w-full border rounded-xl overflow-x-auto shadow-inner bg-slate-50 scrollbar-thin relative">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead className="bg-slate-200 border-b border-slate-300 sticky top-0 z-10 text-[10px] text-slate-600 font-bold uppercase tracking-widest hidden sm:table-header-group">
                      <tr>
                        <th className="sticky left-0 bg-slate-200 p-2 text-left min-w-[150px] border-r border-slate-300 shadow-[1px_0_0_0_#cbd5e1] z-20">Dipendente</th>
                        {Array.from({length: 30}, (_, i) => {
                          const day = i + 1;
                          const l = PR_DAYS[i];
                          const isWeekend = l === "S" || l === "D";
                          return (
                            <th key={day} className={`p-1 border border-slate-300 w-[36px] min-w-[36px] max-w-[36px] ${isWeekend ? 'bg-slate-300 text-slate-500' : 'text-slate-700'}`}>
                              <div className="flex flex-col items-center">
                                <span className="text-[11px] mb-0.5">{day}</span>
                                <span className="text-[9px] opacity-70 font-medium">{l}</span>
                              </div>
                            </th>
                          );
                        })}
                        <th className="p-2 border border-slate-300 bg-slate-800 text-white min-w-[50px] sticky right-0 shadow-[-1px_0_0_0_#1e293b] z-20">TOT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dipendenti.map(dip => {
                        // Sum hours (only parse numbers)
                        let tot = 0;
                        for (let d = 1; d <= 30; d++) {
                          const val = presenzeData[dip.id]?.[d];
                          const parsed = parseFloat(val);
                          if (!isNaN(parsed)) tot += parsed;
                        }

                        return (
                          <tr key={dip.id} className="hover:bg-blue-50/40 relative group border-b border-slate-200">
                            <td className="sticky left-0 bg-white border-r border-slate-200 p-2 text-left font-semibold text-slate-700 whitespace-nowrap shadow-[1px_0_0_0_#e2e8f0] z-10 group-hover:bg-blue-50/40 flex items-center justify-between">
                              <span>{dip.cognome} {dip.nome.charAt(0)}.</span>
                              <div className={`w-2 h-2 rounded-full ml-2 ${TEAM_COLORS[dip.team]?.split(' ')[0]}`} />
                            </td>
                            {Array.from({length: 30}, (_, i) => {
                              const day = i + 1;
                              const l = PR_DAYS[i];
                              const isWeekend = l === "S" || l === "D";
                              const val = presenzeData[dip.id]?.[day] || "";
                              const isEdited = presenzeEdited[dip.id]?.[day];
                              
                              const badgeColor = PRESENZE_COLORS[val] || (val ? 'bg-white font-bold' : (isWeekend ? 'bg-slate-100' : 'bg-slate-50'));

                              return (
                                <td key={day} className={`border border-slate-100 ${isWeekend ? 'bg-slate-100' : 'bg-white'}`}>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <div className={`w-full h-8 flex items-center justify-center cursor-pointer relative hover:ring-1 hover:ring-inset hover:ring-blue-400 hover:z-10 transition-all ${badgeColor}`}>
                                        {isEdited && <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-orange-500 rounded-full" />}
                                        <span className="text-[10px]">{!isNaN(parseFloat(val)) && val !== "" ? fmtOre(parseFloat(val)) : val}</span>
                                      </div>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-48 p-3 shadow-xl" align="center">
                                      <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase">{dip.nome} — Giorno {day} ({l})</h4>
                                      <div className="grid grid-cols-3 gap-1.5 mb-3">
                                        <Button variant="outline" size="sm" className="h-7 text-[10px] bg-sky-50 hover:bg-sky-100" onClick={() => updatePresenza(dip.id, day, 'FE')}>FE</Button>
                                        <Button variant="outline" size="sm" className="h-7 text-[10px] bg-yellow-50 hover:bg-yellow-100" onClick={() => updatePresenza(dip.id, day, 'PE')}>PE</Button>
                                        <Button variant="outline" size="sm" className="h-7 text-[10px] bg-orange-50 hover:bg-orange-100" onClick={() => updatePresenza(dip.id, day, 'ML')}>ML</Button>
                                      </div>
                                      <div className="flex gap-2">
                                        <Input 
                                          type="number" 
                                          step="0.5" 
                                          placeholder="Ore" 
                                          defaultValue={parseFloat(val) ? val : ""} 
                                          className="h-8 text-sm"
                                          onBlur={(e) => updatePresenza(dip.id, day, e.target.value)}
                                        />
                                        <Button variant="destructive" size="icon" className="h-8 w-8 shrink-0" onClick={() => updatePresenza(dip.id, day, '')}>
                                          x
                                        </Button>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </td>
                              );
                            })}
                            <td className="sticky right-0 bg-slate-50 border-l border-slate-300 font-bold p-1 shadow-[-1px_0_0_0_#cbd5e1] z-10 text-slate-800 tabular-nums">
                              {tot > 0 ? fmtOre(tot) : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-800 text-white font-bold h-10 border-t-2 border-slate-900 sticky bottom-0 z-20 shadow-[0_-2px_4px_rgba(0,0,0,0.1)]">
                        <td className="sticky left-0 bg-slate-800 p-2 text-right uppercase text-[10px] tracking-widest shadow-[1px_0_0_0_#1e293b] border-r border-slate-700 z-30 ring-1 ring-slate-800">
                          Totale Ore Giorno
                        </td>
                        {Array.from({length: 30}, (_, i) => {
                          const day = i + 1;
                          let colSum = 0;
                          dipendenti.forEach(dip => {
                            const val = presenzeData[dip.id]?.[day];
                            const parsed = parseFloat(val);
                            if (!isNaN(parsed)) colSum += parsed;
                          });
                          return (
                            <td key={day} className="text-[10px] border border-slate-700 tabular-nums">
                              {colSum > 0 ? fmtOre(colSum) : ""}
                            </td>
                          );
                        })}
                        <td className="sticky right-0 bg-slate-900 border-l border-slate-700 shadow-[-1px_0_0_0_#0f172a] z-30 ring-1 ring-slate-900">
                          {fmtOre(dipendenti.reduce((acc, dip) => {
                            for (let d = 1; d <= 30; d++) {
                              const val = presenzeData[dip.id]?.[d];
                              const parsed = parseFloat(val);
                              if (!isNaN(parsed)) acc += parsed;
                            }
                            return acc;
                          }, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2 px-4 shadow-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center mr-2">Legenda Assenze</span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-sky-100 text-sky-800">FE - Ferie</Badge>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-yellow-100 text-yellow-800">PE - Permesso</Badge>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-orange-100 text-orange-800">ML - Malattia</Badge>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-purple-100 text-purple-800">F - Festività</Badge>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-800">AI - Ass. Ingiustificata</Badge>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diario">
          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
            <CardContent className="p-0 sm:p-6 space-y-6">
              
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-4 lg:p-0">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                    <PenTool className="w-5 h-5 text-primary" /> Diario Orario
                  </h3>
                  <p className="text-sm text-slate-500">Log operatività e mansioni giornaliere.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <Select defaultValue="oggi">
                    <SelectTrigger className="w-full sm:w-32 font-semibold bg-white border-slate-300 shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oggi">Oggi</SelectItem>
                      <SelectItem value="ieri">Ieri</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="w-full sm:w-48 font-semibold bg-white border-slate-300 shadow-sm">
                      <SelectValue placeholder="Dipendente" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_EMPLOYEES.map(emp => (
                        <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="w-full border rounded-xl shadow-inner bg-slate-50 overflow-x-auto scrollbar-thin">
                <table className="w-full text-left text-sm whitespace-nowrap border-collapse min-w-[700px]">
                  <thead className="bg-slate-200 border-b border-slate-300 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    <tr>
                      <th className="p-3 w-40">Fascia Oraria</th>
                      <th className="p-3 w-40">Postazione</th>
                      <th className="p-3">Attività Svolta (Dettaglio)</th>
                      <th className="p-3 w-20 text-center">Qtà</th>
                      <th className="p-3 w-28 text-center">Minuti</th>
                      <th className="p-3 w-20 text-center">Visto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {/* Mocked Rows for UI Prototyping */}
                    <tr className="hover:bg-slate-50 transition-colors group">
                      <td className="p-3 text-slate-600 font-medium tracking-tight">08:30 – 09:30</td>
                      <td className="p-3"><Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 font-bold">RECEPTION</Badge></td>
                      <td className="p-3 text-slate-600 truncate max-w-[200px] sm:max-w-xs">Accoglienza front desk / incassi</td>
                      <td className="p-3 text-center text-slate-600 font-bold">12</td>
                      <td className="p-3 text-center font-bold text-slate-800">60</td>
                      <td className="p-3 text-center">
                        <input type="checkbox" defaultChecked={true} className="w-5 h-5 accent-primary cursor-pointer rounded border-slate-300 pointer-events-none" />
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors group">
                      <td className="p-3 text-slate-600 font-medium tracking-tight">09:30 – 10:30</td>
                      <td className="p-3"><Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold">UFFICIO</Badge></td>
                      <td className="p-3 text-slate-600 truncate max-w-[200px] sm:max-w-xs">Data entry anagrafiche / chiamate back</td>
                      <td className="p-3 text-center text-slate-600 font-bold">5</td>
                      <td className="p-3 text-center font-bold text-slate-800">60</td>
                      <td className="p-3 text-center">
                        <input type="checkbox" defaultChecked={true} className="w-5 h-5 accent-primary cursor-pointer rounded border-slate-300 pointer-events-none" />
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors group">
                      <td className="p-3 text-slate-600 font-medium tracking-tight">10:30 – 11:30</td>
                      <td className="p-3"><Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 font-bold">RECEPTION</Badge></td>
                      <td className="p-3 text-slate-600 truncate max-w-[200px] sm:max-w-xs">Supporto cassa / assistenza iscritti</td>
                      <td className="p-3 text-center text-slate-600 font-bold">—</td>
                      <td className="p-3 text-center font-bold text-slate-800">60</td>
                      <td className="p-3 text-center">
                        <input type="checkbox" defaultChecked={false} className="w-5 h-5 border-slate-300 pointer-events-none" />
                      </td>
                    </tr>

                    {/* Inline Form Mock per Aggiunta */}
                    <tr className="bg-slate-100 border-t-2 border-slate-200">
                      <td className="p-2">
                        <Input placeholder="Ora..." defaultValue="11:30 - 12:30" className="h-8 text-xs bg-white" />
                      </td>
                      <td className="p-2">
                        <Select defaultValue="AMM">
                          <SelectTrigger className="h-8 text-[11px] bg-white font-bold text-slate-600 border-dashed">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="RECEPTION">RECEPTION</SelectItem>
                            <SelectItem value="UFFICIO">UFFICIO</SelectItem>
                            <SelectItem value="AMM">AMM.ZIONE</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Input placeholder="Es: Fatturazione passive..." className="h-8 text-xs bg-white" />
                      </td>
                      <td className="p-2">
                        <Input type="number" placeholder="Qta" className="h-8 text-xs bg-white text-center w-full min-w-[50px]" />
                      </td>
                      <td className="p-2">
                        <Input type="number" placeholder="Min" defaultValue={60} className="h-8 text-xs font-bold text-center bg-white w-full min-w-[60px]" />
                      </td>
                      <td className="p-2 text-center">
                        <Button size="sm" className="h-8 w-full gap-1 font-bold text-[11px]">
                          <Plus className="w-3 h-3" /> Add
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-800 text-white font-bold border-t-4 border-slate-900 border-solid drop-shadow-md h-12">
                      <td colSpan={4} className="p-3 text-right uppercase tracking-widest text-[11px] opacity-90">Totale Turno (Minuti):</td>
                      <td className="p-3 text-center text-emerald-400 text-xl tabular-nums">180</td>
                      <td className="p-3 text-center text-slate-400 text-[10px]">3.0h</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report">
          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
            <CardContent className="p-0 sm:p-6 space-y-6">
              
              {/* Header Report */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-4 lg:p-0">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                    <ClipboardList className="w-5 h-5 text-primary" /> Report Mensile
                    {reportLocked && <Badge variant="destructive" className="ml-2 font-bold tracking-widest"><ShieldCheck className="w-3 h-3 mr-1"/> BLOCCATO</Badge>}
                  </h3>
                  <p className="text-sm text-slate-500">Riepilogo ore, giorni lavorati e causali mensili.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Select value={reportSelectedMonthYear} onValueChange={setReportSelectedMonthYear}>
                    <SelectTrigger className="w-40 font-semibold bg-white border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="04-2026">Aprile 2026</SelectItem>
                      <SelectItem value="05-2026">Maggio 2026</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    onClick={() => reportMutation.mutate()} 
                    disabled={reportMutation.isPending || reportLocked}
                    className="gap-2 font-bold bg-primary hover:bg-primary/90 text-white shadow-sm"
                  >
                    {reportMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin" /> : <PieChart className="w-4 h-4" />}
                    Genera Report
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(`/api/gemteam/report/${reportAnnoRaw}/${reportMeseRaw}/export`, '_blank')}
                    disabled={reportData.length === 0}
                    className="gap-2 font-bold"
                  >
                    <Download className="w-4 h-4" /> Esporta .xlsx
                  </Button>

                  {isAllowed && !reportLocked && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="gap-2 font-bold shadow-sm">
                          <ShieldCheck className="w-4 h-4" /> Blocca mese
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Sei sicuro di voler bloccare il mese?</AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-600">
                            Attenzione: dopo il blocco il mese non sarà più modificabile e i totali verranno congelati per le buste paga.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annulla</AlertDialogCancel>
                          <AlertDialogAction onClick={() => lockMutation.mutate()} className="bg-red-600 hover:bg-red-700">Conferma Blocco</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>

              {/* Tabella Risultati */}
              <div className="w-full border rounded-xl shadow-inner bg-slate-50 overflow-x-auto min-h-[300px]">
                {reportData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-slate-400 h-full">
                    <PieChart className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-medium">Nessun report generato per {reportMeseRaw}/{reportAnnoRaw}</p>
                    <p className="text-sm">Premi "Genera Report" per estrarre i dati.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm whitespace-nowrap border-collapse min-w-[700px]">
                    <thead className="bg-slate-200 border-b border-slate-300 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                      <tr>
                        <th className="p-3 pl-4">Dipendente / Team</th>
                        <th className="p-3 text-center w-20">Ore Tot</th>
                        <th className="p-3 text-center w-20">GG Lav</th>
                        <th className="p-3 text-center w-16 text-sky-700">FE</th>
                        <th className="p-3 text-center w-16 text-yellow-700">PE</th>
                        <th className="p-3 text-center w-16 text-orange-700">ML</th>
                        <th className="p-3 text-center w-16 text-purple-700">F</th>
                        <th className="p-3 text-center w-16 text-red-700">AI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {reportData.map((row: any) => (
                        <tr key={row.employee_id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 pl-4 font-bold text-slate-800">{row.cognome} {row.nome}</td>
                          <td className="p-3 text-center font-black text-slate-700 text-lg">{fmtOre(row.oreTotali)}</td>
                          <td className="p-3 text-center font-bold text-slate-500">{row.giorniLavorati}</td>
                          <td className="p-3 text-center text-sky-600 font-semibold">{row.FE || 0}</td>
                          <td className="p-3 text-center text-yellow-600 font-semibold">{row.PE || 0}</td>
                          <td className="p-3 text-center text-orange-600 font-semibold">{row.ML || 0}</td>
                          <td className="p-3 text-center text-purple-600 font-semibold">{row.F || 0}</td>
                          <td className="p-3 text-center text-red-600 font-semibold">{row.AI || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-800 text-white font-bold h-12">
                        <td className="p-3 pl-4 text-right uppercase tracking-widest text-[11px] opacity-90">Totale Globale:</td>
                        <td className="p-3 text-center text-emerald-400 text-xl tabular-nums">{fmtOre(reportData.reduce((acc: number, cur: any) => acc + (cur.oreTotali || 0), 0))}</td>
                        <td className="p-3 text-center">{reportData.reduce((acc: number, cur: any) => acc + (cur.giorniLavorati || 0), 0)}</td>
                        <td className="p-3 text-center">{reportData.reduce((acc: number, cur: any) => acc + (cur.FE || 0), 0)}</td>
                        <td className="p-3 text-center">{reportData.reduce((acc: number, cur: any) => acc + (cur.PE || 0), 0)}</td>
                        <td className="p-3 text-center">{reportData.reduce((acc: number, cur: any) => acc + (cur.ML || 0), 0)}</td>
                        <td className="p-3 text-center">{reportData.reduce((acc: number, cur: any) => acc + (cur.F || 0), 0)}</td>
                        <td className="p-3 text-center">{reportData.reduce((acc: number, cur: any) => acc + (cur.AI || 0), 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
