import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { format, addDays, subDays, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { it } from "date-fns/locale";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useActiveUsers } from "@/hooks/use-active-users";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Users2, ShieldCheck, PieChart, Home, ClipboardList, PenTool, ChevronLeft, ChevronRight, CalendarDays, CheckCircle2, Search, Mail, Phone, MapPin, UserPlus, Download, Plus, Activity, LogIn, LogOut, GripVertical, AlertTriangle, Copy } from "lucide-react";
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent } from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Checkbox } from "@/components/ui/checkbox";



const HOURS: string[] = [];
for (let h = 7; h <= 23; h++) {
  HOURS.push(`${String(h).padStart(2,'0')}:00`);
  HOURS.push(`${String(h).padStart(2,'0')}:30`);
}

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
  memberId?: number;
  last_seen_at?: string | null;
  current_session_start?: string | null;
  last_session_duration?: number | null;
}

const isSystemEmployee = (d: GemTeamMember): boolean => {
  if (d.userId === '15' || d.userId === '16') return true;
  if (d.id === 15 || d.id === 16) return true;
  if (d.memberId === 14177 || d.memberId === 14178) return true;
  const fullName = `${d.nome} ${d.cognome}`.toLowerCase();
  if (fullName.includes('admin') || fullName.includes('bot ai') || fullName.includes('ai b')) return true;
  if (d.nome === 'Admin' || d.nome === 'Bot') return true;
  return false;
};

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
  "RECEPTION": "bg-green-100 text-green-800 border-green-200",
  "PRIMO": "bg-blue-100 text-blue-800 border-blue-200",
  "SECONDO": "bg-sky-100 text-sky-800 border-sky-200",
  "UFFICIO": "bg-orange-100 text-orange-800 border-orange-200",
  "AMM.ZIONE": "bg-purple-100 text-purple-800 border-purple-200",
  "WORKSHOP": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "PAUSA": "bg-slate-100 text-slate-600 border-slate-200",
  "RIPOSO": "bg-slate-300 text-slate-800 border-slate-400 font-bold",
  "RIUNIONE": "bg-amber-100 text-amber-800 border-amber-200",
  "STUDIO_1": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "STUDIO_2": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "MALATTIA": "bg-red-100 text-red-800 border-red-200",
  "PERMESSO": "bg-orange-100 text-orange-800 border-orange-200",
};



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

function SortableDipendente({ id, dipendente }: { id: number, dipendente: GemTeamMember }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-2 bg-white border border-slate-200 rounded-md shadow-sm mb-2 z-50 relative">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing hover:bg-slate-100 p-1.5 rounded text-slate-400">
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="font-semibold text-sm text-slate-700">{dipendente.cognome} {dipendente.nome}</div>
    </div>
  );
}

export default function GemTeam() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: activeUsers = [] } = useActiveUsers();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedWeek, setSelectedWeek] = useState("A");
  
  // API Calls
  const { data: dipendentiAPI = [], isLoading: isLoadingDipendenti, isError: isErrorDipendenti } = useQuery<any[]>({
    queryKey: ['/api/gemteam/dipendenti'],
  });

  const role = user?.role?.toLowerCase() || '';
  const isMaster = ['admin', 'master', 'super admin'].includes(role);

  const [ordinaOpen, setOrdinaOpen] = useState(false);
  const [localOrder, setLocalOrder] = useState<GemTeamMember[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const handleDragEnd = (event: any) => {
    const {active, over} = event;
    if (active.id !== over.id) {
      setLocalOrder((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveOrder = async () => {
    try {
      setIsSavingOrder(true);
      const order = localOrder.map((d, i) => ({ id: d.id, display_order: i + 1 }));
      const res = await fetch('/api/gemteam/dipendenti/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order })
      });
      if (!res.ok) throw new Error('Errore salvataggio ordine');
      
      await queryClient.invalidateQueries({ queryKey: ["/api/gemteam/dipendenti"] });
      setOrdinaOpen(false);
    } catch (e) {
      console.error(e);
      alert('Errore di salvataggio');
    } finally {
      setIsSavingOrder(true);
      setTimeout(() => setIsSavingOrder(false), 500);
    }
  };

  const dipendenti: GemTeamMember[] = useMemo(() => {
    // Nessun sort front-end: il backend ordina giÃ  per display_order ASC
    const sortedAPI = [...dipendentiAPI];

    return sortedAPI.map(d => ({
      id: d.id,
      userId: d.userId,
      memberId: d.memberId,
      nome: d.firstName || (d.username === 'admin' ? 'Admin' : d.username === 'botAI' ? 'Bot' : 'Sconosciuto'),
      cognome: d.lastName || (d.username === 'admin' ? 'Master' : d.username === 'botAI' ? 'AI' : ''),
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

  useEffect(() => {
    if (dipendenti.length > 0) {
      setLocalOrder(dipendenti.filter(d => !isSystemEmployee(d)));
    }
  }, [dipendenti, ordinaOpen]);



  
  const [turniViewMode, setTurniViewMode] = useState<"giornaliera" | "settimanale" | "collettiva" | "singola">("giornaliera");
  const [turniDate, setTurniDate] = useState(new Date());
  const formattedTurniDate = format(turniDate, 'yyyy-MM-dd');

  const { data: turniScheduled = [], refetch: refetchScheduled } = useQuery<any[]>({
    queryKey: ['/api/gemteam/turni/scheduled', turniViewMode, formattedTurniDate],
    queryFn: async () => {
      if (turniViewMode === 'settimanale') {
        const startD = startOfWeek(turniDate, { weekStartsOn: 1 });
        const days = [0,1,2,3,4,5,6].map(i => format(addDays(startD, i), 'yyyy-MM-dd'));
        const results = await Promise.all(days.map(d => fetch(`/api/gemteam/turni/scheduled?data=${d}`, { credentials: 'include', headers: { 'Accept': 'application/json' } }).then(r => r.ok ? r.json() : [])));
        return results.flat();
      }
      return fetch(`/api/gemteam/turni/scheduled?data=${formattedTurniDate}`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      }).then(r => r.ok ? r.json() : []);
    },
    staleTime: 60000
  });

  const { data: eventiGiorno = [] } = useQuery<any[]>({
    queryKey: ['/api/gemteam/turni/eventi-giorno', formattedTurniDate],
    queryFn: () =>
      fetch(`/api/gemteam/turni/eventi-giorno?data=${formattedTurniDate}`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      }).then(r => r.ok ? r.json() : []),
    staleTime: 60000
  });

  const { data: postazioniApi = [] } = useQuery<any[]>({
    queryKey: ['/api/gemteam/postazioni'],
    queryFn: () =>
      fetch('/api/gemteam/postazioni', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      }).then(r => r.ok ? r.json() : []),
    staleTime: 60000
  });

  
  const shiftMutation = useMutation({
    mutationFn: async (data: any) => {
      const isUpdate = !!data.id;
      const res = await fetch('/api/gemteam/turni/scheduled' + (isUpdate ? `/${data.id}` : ''), {
        method: isUpdate ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Errore salvataggio turno');
      return res.json();
    },
    onSuccess: () => {
        refetchScheduled();
        queryClient.invalidateQueries();
        document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    },
    onError: (err: any) => {
        toast({title: "Errore API", description: err.message, variant: "destructive"});
    }
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/gemteam/turni/scheduled/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Errore eliminazione turno');
      return res.json();
    },
    onSuccess: () => {
        refetchScheduled();
        queryClient.invalidateQueries({ queryKey: ['/api/gemteam/turni/scheduled'] });
        document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    }
  });

  const weekTypeMutation = useMutation({
    mutationFn: async (settimana: string) => {
      const wStart = format(startOfWeek(turniDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const res = await fetch('/api/gemteam/turni/week-assignment', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          weekStart: wStart,
          settimana
        })
      });
      if (!res.ok) throw new Error('Errore aggiornamento settimana');
      
      const applyRes = await fetch('/api/gemteam/turni/apply-template', {
         method: 'POST',
         credentials: 'include',
         headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
         body: JSON.stringify({ weekStart: wStart, settimana })
      });
      if (!applyRes.ok) throw new Error('Errore in apply-template');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gemteam/turni/week-assignment'] });
      queryClient.invalidateQueries({ queryKey: ['/api/gemteam/turni/scheduled'] });
      queryClient.invalidateQueries({ queryKey: ['/api/gemteam/turni'] });
      toast({title: "Aggiornato", description: "Variazione tipo di settimana registrata con successo."});
    }
  });
  
  const updateTeamMutation = useMutation({
    mutationFn: async ({ id, team }: { id: number, team: string }) => {
      const res = await fetch(`/api/gemteam/dipendenti/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team }),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Errore aggiornamento reparto');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/gemteam/dipendenti'] })
  });
  
  const { data: weekAssignment } = useQuery<any>({
    queryKey: ['/api/gemteam/turni/week-assignment', format(startOfWeek(turniDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')],
    queryFn: () =>
      fetch(`/api/gemteam/turni/week-assignment?weekStart=${format(startOfWeek(turniDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')}`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      }).then(r => r.ok ? r.json() : []),
    staleTime: 60000
  });
  const MOCK_EMPLOYEES = useMemo(() => dipendenti.map(d => d.nome), [dipendenti]);
  const [selectedEmployee, setSelectedEmployee] = useState(MOCK_EMPLOYEES[0] || "Seleziona...");

  const selectedEmpId = useMemo(() => {
    const found = dipendenti.find(d => 
      d.nome === selectedEmployee || 
      `${d.cognome} ${d.nome}` === selectedEmployee || 
      `${d.nome} ${d.cognome}` === selectedEmployee ||
      d.id.toString() === selectedEmployee
    );
    return found?.id;
  }, [selectedEmployee, dipendenti]);

  const filteredSegreteria = dipendenti.filter(d => d.team === 'segreteria' && !isSystemEmployee(d) && (turniViewMode !== 'singola' || d.id === selectedEmpId));
  const filteredManutenzione = dipendenti.filter(d => (d.team === 'ass_manutenzione' || d.team === 'manutenzione') && !isSystemEmployee(d) && (turniViewMode !== 'singola' || d.id === selectedEmpId));
  const filteredUfficio = dipendenti.filter(d => d.team === 'ufficio' && !isSystemEmployee(d) && (turniViewMode !== 'singola' || d.id === selectedEmpId));
  const filteredAmministrazione = dipendenti.filter(d => d.team === 'amministrazione' && !isSystemEmployee(d) && (turniViewMode !== 'singola' || d.id === selectedEmpId));
  const filteredComunicazione = dipendenti.filter(d => d.team === 'comunicazione' && !isSystemEmployee(d) && (turniViewMode !== 'singola' || d.id === selectedEmpId));
  const filteredDirezione = dipendenti.filter(d => d.team === 'direzione' && !isSystemEmployee(d) && (turniViewMode !== 'singola' || d.id === selectedEmpId));

  const [calWeekOffset, setCalWeekOffset] = useState(0);
  const [programmedWeeks, setProgrammedWeeks] = useState<Record<number, string>>({});
  const [draftTemplate, setDraftTemplate] = useState("A");

  // Tab Dipendenti State
  const [searchTerm, setSearchTerm] = useState("");
  const [isCopiaWeekOpen, setIsCopiaWeekOpen] = useState(false);
  const [targetCopiaWeekDate, setTargetCopiaWeekDate] = useState<Date | undefined>(undefined);
  const [selectedCopiaEmployees, setSelectedCopiaEmployees] = useState<number[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<{shiftId: number, hour: string}[]>([]);

  useEffect(() => {
    if (isCopiaWeekOpen) {
      setSelectedCopiaEmployees(dipendenti.map(d => d.id));
      setTargetCopiaWeekDate(undefined);
    }
  }, [isCopiaWeekOpen, dipendenti]);

  const [turniGiorno, setTurniGiorno] = useState<number>(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  });

  const { data: turniData = [] } = useQuery({
    queryKey: ['/api/gemteam/turni', turniViewMode, selectedEmpId, selectedWeek, turniGiorno],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (turniViewMode === 'singola' && selectedEmpId) {
        params.append('employee_id', String(selectedEmpId));
      }
      params.append('settimana', selectedWeek || 'A');
      if (turniViewMode === 'collettiva') {
         params.append('giorno', String(turniGiorno));
      }
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
    let inSede = 0; 
    let online = activeUsers.filter((u: any) => u.stato === 'online').length; 
    let usciti = 0; let attesi = 0; let assenti = 0;
    
    dipendenti.forEach(dip => {
      // Escludi admin e botAI dal conteggio presenze in sede
      if (isSystemEmployee(dip)) return;

      const chk = Array.isArray(todayCheckinsData) ? todayCheckinsData.find(c => c.employeeId === dip.id) : null;
      if (chk) {
        if (chk.lastEvent === "IN") inSede++;
        else if (chk.lastEvent === "OUT" && chk.lastTimestamp) usciti++;
        else if (chk.lastEvent === "ASSENTE") assenti++;
        else attesi++;
      } else {
        attesi++;
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
    <div className="py-3 md:py-4 space-y-4 w-full animate-in fade-in zoom-in-95 duration-500">
      
      {/* HEADER */}
      <div className="px-6 md:px-8 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-4 gap-3">
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
            <Users2 className="w-4 h-4 mr-1.5" /> {dipendenti.filter(d => !isSystemEmployee(d)).length} Dipendenti
          </Badge>
        </div>
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6 md:px-8 max-w-7xl mx-auto w-full">
          <TabsList className="grid w-full grid-flow-auto grid-cols-3 md:grid-cols-6 h-auto p-1.5 gap-1.5 bg-slate-100 rounded-xl mb-4">
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
        </div>

        <TabsContent value="dashboard">
          <div className="px-6 md:px-8 max-w-7xl mx-auto space-y-6">
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
                      // Assicura che un lastEvent null fallback a "ATTESO" in maniera esplicita
                      const stato = chk?.lastEvent ? chk.lastEvent : "ATTESO";
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
          <div className="px-6 md:px-8 max-w-7xl mx-auto space-y-6">
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
                          {isMaster ? (
                            <Select 
                              defaultValue={selectedSheetDip.team} 
                              onValueChange={(val) => updateTeamMutation.mutate({ id: selectedSheetDip.id, team: val })}
                              disabled={updateTeamMutation.isPending}
                            >
                              <SelectTrigger className={`mt-2 h-7 text-[10px] w-auto inline-flex font-bold tracking-wider uppercase border-transparent ${TEAM_COLORS[selectedSheetDip.team]} ${updateTeamMutation.isPending ? 'opacity-50' : ''}`}>
                                <SelectValue placeholder="Seleziona..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="segreteria">SEGRETERIA</SelectItem>
                                <SelectItem value="ass_manutenzione">MANUTENZIONE</SelectItem>
                                <SelectItem value="ufficio">UFFICIO</SelectItem>
                                <SelectItem value="amministrazione">AMMINISTRAZIONE</SelectItem>
                                <SelectItem value="comunicazione">COMUNICAZIONE</SelectItem>
                                <SelectItem value="direzione">DIREZIONE</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="secondary" className={`mt-2 text-[10px] uppercase font-bold tracking-wider ${TEAM_COLORS[selectedSheetDip.team]}`}>
                              {TEAM_LABELS[selectedSheetDip.team]}
                            </Badge>
                          )}
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

        
        
        <TabsContent value="turni" className="w-full relative">
          <div className="border-y border-slate-200 shadow-sm overflow-hidden bg-slate-50 w-full mb-4 flex flex-col">
            
            {/* SEZIONE A: HEADER */}
            <div className="bg-white border-b border-slate-200 py-2 px-4 sticky top-0 z-30">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    {turniViewMode !== 'collettiva' ? (
                      <>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setTurniDate(subDays(turniDate, 1))}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-base sm:text-lg font-bold text-slate-800 tracking-tight min-w-[200px] text-center capitalize">
                          {format(turniDate, "EEEE d MMMM yyyy", { locale: it })}
                        </div>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setTurniDate(addDays(turniDate, 1))}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200 shadow-inner">
                        {[0,1,2,3,4,5,6].map(offset => {
                          const d = addDays(startOfWeek(turniDate, { weekStartsOn: 1 }), offset);
                          const isSelected = format(d, 'yyyy-MM-dd') === format(turniDate, 'yyyy-MM-dd');
                          return (
                            <Button 
                              key={offset} 
                              variant={isSelected ? "default" : "ghost"} 
                              size="sm" 
                              className={`h-8 px-3 text-xs font-bold ${!isSelected && 'text-slate-500'}`}
                              onClick={() => setTurniDate(d)}
                            >
                              {format(d, 'EEEE', { locale: it })}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                    
                    

<Popover>
  <PopoverTrigger>
    <div className="hidden sm:inline-flex ml-4 font-semibold text-xs border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer rounded-full px-2.5 py-0.5" role="button">
      Tipo {weekAssignment?.settimana || 'A'} · {format(startOfWeek(turniDate, { weekStartsOn: 1 }), 'd MMM')}
    </div>
  </PopoverTrigger>
  {isMaster && (
    <PopoverContent className="w-auto p-3">
      <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase text-center">Settimana Tipo</h4>
      <div className="flex gap-1.5">
        {['A', 'B', 'C', 'D', 'E'].map(l => (
          <Button key={l} variant={weekAssignment?.settimana === l ? "default" : "outline"} size="sm" className="h-8 w-8 p-0" onClick={() => {
            weekTypeMutation.mutate(l);
          }}>{l}</Button>
        ))}
      </div>
    </PopoverContent>
  )}
</Popover>


                    {isSameDay(turniDate, new Date()) ? (
        <Badge onClick={() => setTurniDate(new Date())} className="bg-emerald-500 hover:bg-emerald-600 text-[10px] cursor-pointer">OGGI</Badge>
    ) : (
        <Badge onClick={() => setTurniDate(new Date())} variant="outline" className="text-emerald-600 border-emerald-500 hover:bg-emerald-50 text-[10px] cursor-pointer bg-white">OGGI</Badge>
    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200 overflow-x-auto">
                    <Button variant={turniViewMode === 'giornaliera' ? "default" : "ghost"} size="sm" className="h-7 text-xs font-bold shadow-sm" onClick={() => setTurniViewMode('giornaliera')}>Giornaliera★</Button>
                    <Button variant={turniViewMode === 'settimanale' ? "default" : "ghost"} size="sm" className="h-7 text-xs font-medium text-slate-500" onClick={() => setTurniViewMode('settimanale')}>Settimanale</Button>
                    <Button variant={turniViewMode === 'collettiva' ? "default" : "ghost"} size="sm" className="h-7 text-xs font-medium text-slate-500" onClick={() => setTurniViewMode('collettiva')}>Collettiva</Button>
                    <Button variant={turniViewMode === 'singola' ? "default" : "ghost"} size="sm" className="h-7 text-xs font-medium text-slate-500" onClick={() => setTurniViewMode('singola')}>Singola</Button>
                    {turniViewMode === 'singola' && (
                      <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                        <SelectTrigger className="h-7 w-40 text-xs font-semibold bg-white border-transparent">
                          <SelectValue placeholder="Seleziona dipendente" />
                        </SelectTrigger>
                        <SelectContent>
                          {dipendenti.map(d => (
                            <SelectItem key={d.id} value={`${d.nome} ${d.cognome}`}>{d.nome} {d.cognome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  
                  {isMaster && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Sheet open={ordinaOpen} onOpenChange={setOrdinaOpen}>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 text-xs font-semibold bg-white">
                            <GripVertical className="h-3 w-3 mr-1 opacity-50" /> Ordina colonne
                          </Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>Ordina colonne</SheetTitle>
                            <SheetDescription>Trascina i dipendenti per riordinare.</SheetDescription>
                          </SheetHeader>
                          <div className="mt-6 max-h-[70vh] overflow-y-auto px-1">
                            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                              <SortableContext items={localOrder.map(d => d.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                  {localOrder.map(d => (
                                    <SortableDipendente key={d.id} id={d.id} dipendente={d} />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                            <Button onClick={handleSaveOrder} disabled={isSavingOrder} className="w-full mt-6 bg-primary text-white">
                              {isSavingOrder ? 'Salvataggio...' : 'Salva ordine'}
                            </Button>
                          </div>
                        </SheetContent>
                      </Sheet>

                      <Button variant="outline" size="sm" className="h-8 text-xs font-semibold bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                        <Plus className="h-3 w-3 mr-1" /> Aggiungi turno
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs font-semibold bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => {
    const el = document.getElementById('griglia-turni');
    if (!el) return;
    html2canvas(el, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.setFontSize(16);
      pdf.text(`GemTeam — Turni ${format(turniDate, "EEEE d MMMM yyyy", { locale: it })} — Tipo ${weekAssignment?.settimana || 'A'}`, 10, 15);
      pdf.addImage(imgData, 'PNG', 10, 25, pdfWidth - 20, pdfHeight - 20);
      pdf.save(`turni_${format(turniDate, 'yyyyMMdd')}_tipo${weekAssignment?.settimana || 'A'}.pdf`);
    });
}}>
                        <Download className="h-3 w-3 mr-1" /> Scarica turni
                      </Button>
                      
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 text-xs font-semibold bg-white text-slate-600 border-slate-200 hover:bg-slate-50">
                            ⚙ Postazioni
                          </Button>
                        </SheetTrigger>
                        <SheetContent>
                          
<SheetHeader>
  <SheetTitle>Gestione Postazioni</SheetTitle>
</SheetHeader>
<div className="mt-6 flex flex-col gap-4">
  <div className="bg-slate-100 rounded-md p-3">
    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Aggiungi nuova</div>
    <form className="flex gap-2" onSubmit={async (e: any) => { 
        e.preventDefault(); 
        await fetch('/api/gemteam/postazioni', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ nome: e.target.nome.value, contaOre: true, attiva: true }) });
        queryClient.invalidateQueries({ queryKey: ['/api/gemteam/postazioni'] });
        e.target.reset();
    }}>
      <Input name="nome" placeholder="Es. RECEPTION" className="h-8 text-xs font-bold uppercase w-full" required />
      <Button size="sm" type="submit" className="h-8">Add</Button>
    </form>
  </div>
  <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
    {postazioniApi.map((p: any) => (
      <div key={p.id} className="flex items-center justify-between p-2 border rounded-md shadow-sm opacity-100 bg-white hover:border-blue-200">
        <span className="text-xs font-bold text-slate-800 uppercase">{p.nome}</span>
        <Button disabled variant="outline" size="sm" className="h-6 text-[10px]">Attiva</Button>
      </div>
    ))}
  </div>
</div>

                        </SheetContent>
                      </Sheet>

                    </div>
                  )}

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-semibold bg-white text-slate-600 border-slate-200 hover:bg-slate-50">Legenda</Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-[300px] p-4">
                        <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Colori Postazioni</div>
                        <div className="flex flex-wrap gap-3">
                          {postazioniApi.filter((p:any) => p.attiva === 1 || p.attiva === true || p.attiva).map((p:any) => (
                            <div key={p.id} className="flex items-center gap-1.5 w-[120px]">
                              <div className="w-3 h-3 rounded-full shadow-sm" style={{backgroundColor: p.colore || '#e2e8f0'}} />
                              <span className="text-xs uppercase font-medium truncate">{p.nome}</span>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {isMaster && (
                       <Dialog open={isCopiaWeekOpen} onOpenChange={setIsCopiaWeekOpen}>
                         <DialogTrigger asChild>
                           <Button variant="outline" size="sm" className="h-8 text-xs font-semibold bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                             <Copy className="h-3 w-3 mr-1" /> Copia settimana
                           </Button>
                         </DialogTrigger>
                         <DialogContent className="max-w-[440px] p-4 flex flex-col items-center zoom-in-95 max-h-[90vh] overflow-hidden">
                            <h3 className="font-bold text-sm mb-2">Copia su un'altra settimana</h3>
                            <p className="text-xs text-slate-500 mb-2 leading-tight text-center">Copia da: <strong>{format(startOfWeek(turniDate, { weekStartsOn: 1 }), 'dd/MM/yyyy')}</strong>. Seleziona chi copiare e la settimana d'arrivo.</p>
                            
                            <div className="w-full flex gap-4 h-full min-h-0 overflow-hidden">
                              <div className="flex-1 border rounded-md p-2 overflow-y-auto space-y-2 h-[280px]">
                                <div className="flex items-center space-x-2 mb-2 pb-2 border-b">
                                  <Checkbox id="selectAllCopy" 
                                    checked={selectedCopiaEmployees.length === dipendenti.length}
                                    onCheckedChange={(checked) => setSelectedCopiaEmployees(checked ? dipendenti.map(d => d.id) : [])}
                                  />
                                  <label htmlFor="selectAllCopy" className="text-xs font-bold leading-none cursor-pointer">Seleziona tutti</label>
                                </div>
                                {dipendenti.map(dip => (
                                  <div key={dip.id} className="flex items-center space-x-2">
                                    <Checkbox id={`copy-${dip.id}`} 
                                      checked={selectedCopiaEmployees.includes(dip.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) setSelectedCopiaEmployees([...selectedCopiaEmployees, dip.id]);
                                        else setSelectedCopiaEmployees(selectedCopiaEmployees.filter(id => id !== dip.id));
                                      }}
                                    />
                                    <label htmlFor={`copy-${dip.id}`} className="text-xs font-medium leading-none cursor-pointer truncate">
                                      {dip.nome} {dip.cognome}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <div className="flex-1 flex flex-col pt-1">
                                <Calendar mode="single" selected={targetCopiaWeekDate} onSelect={(date) => { if(date) setTargetCopiaWeekDate(startOfWeek(date, { weekStartsOn: 1 })) }} weekStartsOn={1} className="bg-slate-50 rounded-md border border-slate-200 self-center" />
                              </div>
                            </div>

                            <div className="mt-4 w-full pt-2">
                               <Button disabled={!targetCopiaWeekDate || selectedCopiaEmployees.length === 0} className="w-full h-8 text-xs font-semibold" onClick={async () => {
                                  if (!targetCopiaWeekDate || selectedCopiaEmployees.length === 0) return;
                                  const cWeek = startOfWeek(turniDate, { weekStartsOn: 1 });
                                  const tWeek = startOfWeek(targetCopiaWeekDate, { weekStartsOn: 1 });
                                  let totCreated = 0;
                                  for (let i=0; i<7; i++) {
                                     const from = format(addDays(cWeek, i), 'yyyy-MM-dd');
                                     const to = format(addDays(tWeek, i), 'yyyy-MM-dd');
                                     const p = await fetch('/api/gemteam/turni/copy-day', { 
                                       method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, 
                                       body: JSON.stringify({ fromData: from, toData: to, employeeIds: selectedCopiaEmployees }) 
                                     }).then(r => r.ok ? r.json() : null);
                                     if (p?.created) totCreated += p.created;
                                  }
                                  setIsCopiaWeekOpen(false);
                                  toast({title: "Copia effettuata", description: `${totCreated} turni copiati con successo.`});
                                  refetchScheduled();
                                  queryClient.invalidateQueries({ queryKey: ['/api/gemteam/turni'] });
                               }}>Conferma Copia</Button>
                            </div>
                         </DialogContent>
                       </Dialog>
                    )}
                  </div>
                </div>
              </div>

            {/* SEZIONE B: BANNER EVENTI (Rimossa via direttiva) */}

            {/* SEZIONE C: GRIGLIA ORARIA GIORNALIERA / COLLETTIVA / SINGOLA */}
            {turniViewMode !== 'settimanale' && (
              <div className="flex-1 overflow-auto bg-slate-100/50 relative" style={{ maxHeight: '60vh' }}>
                <table id="griglia-turni" className={`border-collapse bg-white ${turniViewMode === 'singola' ? 'w-full table-fixed' : 'min-w-max'}`}>
                <thead className="sticky top-0 z-20 shadow-sm border-b border-slate-300">
                  {/* Raggruppamento Team */}
                  <tr>
                    <th className="w-20 min-w-[80px] bg-slate-50 border-r border-slate-300"></th>
                    {filteredSegreteria.length > 0 && <th colSpan={filteredSegreteria.length} style={{backgroundColor: '#EAF3DE', color: '#3B6D11'}} className="border-r border-slate-300 py-1 px-2 text-center font-bold text-[10px] uppercase tracking-widest truncate">Segreteria</th>}
                    {filteredManutenzione.length > 0 && <th colSpan={filteredManutenzione.length} style={{backgroundColor: '#FAEEDA', color: '#633806'}} className="border-r border-slate-300 py-1 px-2 text-center font-bold text-[10px] uppercase tracking-widest truncate">Manutenzione</th>}
                    {filteredUfficio.length > 0 && <th colSpan={filteredUfficio.length} style={{backgroundColor: '#E6F1FB', color: '#185FA5'}} className="border-r border-slate-300 py-1 px-2 text-center font-bold text-[10px] uppercase tracking-widest truncate">Ufficio</th>}
                    {filteredAmministrazione.length > 0 && <th colSpan={filteredAmministrazione.length} style={{backgroundColor: '#E1F5EE', color: '#0F6E56'}} className="border-r border-slate-300 py-1 px-2 text-center font-bold text-[10px] uppercase tracking-widest truncate">Amministrazione</th>}
                    {filteredComunicazione.length > 0 && <th colSpan={filteredComunicazione.length} style={{backgroundColor: '#FAECE7', color: '#993C1D'}} className="border-r border-slate-300 py-1 px-2 text-center font-bold text-[10px] uppercase tracking-widest truncate">Comunicazione</th>}
                    {filteredDirezione.length > 0 && <th colSpan={filteredDirezione.length} style={{backgroundColor: '#EEEDFE', color: '#3C3489'}} className="border-r border-slate-300 py-1 px-2 text-center font-bold text-[10px] uppercase tracking-widest truncate">Direzione</th>}
                  </tr>

                  {/* Nomi Dipendenti */}
                  <tr>
                    <th className="bg-slate-100 border-r border-slate-300 text-[10px] text-slate-500 font-bold p-1 w-20 min-w-[80px]">ORA</th>
                    {[...filteredSegreteria, ...filteredManutenzione, ...filteredUfficio, ...filteredAmministrazione, ...filteredComunicazione, ...filteredDirezione].map(dip => (
                      <th key={dip.id} className={`bg-white border-r border-slate-200 p-1.5 group ${turniViewMode === 'singola' ? 'w-full' : 'w-28 min-w-[112px]'}`}>
                         <div className="flex items-center justify-center gap-1">
                            {isMaster && <GripVertical className="h-3 w-3 text-slate-300 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />}
                            <span className="text-[10px] font-bold text-slate-700 uppercase truncate" title={dip.nome + ' ' + dip.cognome}>
      {dip.nome.split(' ')[0]} {dip.cognome ? dip.cognome.charAt(0) + '.' : ''}
    </span>
                         </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-slate-100">
                  {HOURS.map(hour => (
                    <tr key={hour} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="bg-slate-50 border-r border-b border-slate-200 text-center text-[11px] font-semibold text-slate-600 p-1 select-none sticky left-0 shadow-[1px_0_0_rgba(200,200,200,0.5)] z-10 w-20 h-[22px]">
                        {hour}
                      </td>
                      {[...filteredSegreteria, ...filteredManutenzione, ...filteredUfficio, ...filteredAmministrazione, ...filteredComunicazione, ...filteredDirezione].map(dip => {
                         const turniFiltrato = Array.isArray(turniScheduled) ? turniScheduled.find((t:any) => {
                           if (String(t.employeeId) !== String(dip.id)) return false;
                           if (!t.oraInizio || !t.oraFine) return false;
                           const [hI, mI] = t.oraInizio.split(':');
                           const [hF, mF] = t.oraFine.split(':');
                           const [hS, mS] = hour.split(':');
                           const startMins = Number(hI) * 60 + Number(mI);
                           const endMins = Number(hF) * 60 + Number(mF);
                           const slotMins = Number(hS) * 60 + Number(mS);
                           return slotMins >= startMins && slotMins < endMins;
                         }) : null;
                         const hasConflict = turniFiltrato?.hasConflict || false;
                         const postInfo = turniFiltrato ? postazioniApi.find((p:any) => p.nome === turniFiltrato.postazione) : null;
                         
                         return (
                           <td 
                             key={`${dip.id}-${hour}`} 
                             className={`border-r border-b ${hasConflict ? 'border-red-400 ring-2 ring-inset ring-red-500/30' : 'border-slate-200'} p-0.5 relative cursor-pointer min-h-[22px] ${turniViewMode==='singola'?'min-w-[200px] w-full':''}`}
                             onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                             onDragEnter={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                             onDragStart={(e) => { 
                               // We pass the source hour in standard drag
                               e.dataTransfer.setData("sourceHour", hour);
                             }}
                             onDrop={(e) => {
                               e.preventDefault();
                               const shiftIdStr = e.dataTransfer.getData("shiftId");
                               const sourceHour = e.dataTransfer.getData("sourceHour");
                               if (shiftIdStr && shiftIdStr !== "null" && sourceHour && turniScheduled) {
                                 const shiftId = parseInt(shiftIdStr);
                                 const droppedShift = turniScheduled.find((t:any) => t.id === shiftId);
                                 if (!droppedShift) return;

                                 const [sh, sm] = sourceHour.split(':').map(Number);
                                 const [th, tm] = hour.split(':').map(Number);
                                 const timeOffsetMins = (th * 60 + tm) - (sh * 60 + sm);
                                 
                                 const isSelected = selectedShifts.some(s => s.shiftId === shiftId && s.hour === sourceHour);
                                 const cellsToMove = isSelected ? selectedShifts : [{ shiftId, hour: sourceHour }];

                                 // Conflict Check
                                 let hasHardConflict = false;
                                 for (const c of cellsToMove) {
                                     const [ch, cm] = c.hour.split(':').map(Number);
                                     let tot = ch * 60 + cm + timeOffsetMins;
                                     let targetH = `${String(Math.floor(tot/60)).padStart(2,'0')}:${String(tot%60).padStart(2,'0')}`;
                                     
                                     // Check if targetH overlaps with any existing shift of the target employee
                                     const overlaps = turniScheduled.some((s:any) => {
                                        if (String(s.employeeId) !== String(dip.id)) return false;
                                        if (s.data.split('T')[0] !== formattedTurniDate) return false;
                                        if (targetH < s.oraInizio || targetH >= s.oraFine) return false;
                                        
                                        // Ignore self-overlap if we are dropping exactly where it was
                                        if (s.id === c.shiftId && c.hour === targetH && String(droppedShift.employeeId) === String(dip.id)) return false;
                                        // Also, if targetH is literally one of the cells we are moving, we don't consider it a conflict
                                        // Actually, if we are moving within the same shift bounds, the original boundaries overlap.
                                        // A perfectly safe way: if s.id === c.shiftId, and we are just shifing but staying inside the old shift. 
                                        // To be extremely precise, we check if targetH is in the remaining slots of the original shift. This is complex in frontend.
                                        // Let's just trust a basic check: if s.id !== c.shiftId it's definitely a conflict (another shift).
                                        if (s.id !== c.shiftId) return true;
                                        return false;
                                     });
                                     if (overlaps) { hasHardConflict = true; break; }
                                 }

                                 if (hasHardConflict) {
                                    toast({ title: "Spazio Occupato", description: "Impossibile spostare. Orario già occupato da un altro turno.", variant: "destructive" });
                                    return;
                                 }

                                 // Proceed with granular mass-action move
                                 fetch(`/api/gemteam/turni/scheduled/mass-action-granular`, {
                                    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'move', employeeTarget: dip.id, dateTarget: formattedTurniDate, timeOffsetMins, cells: cellsToMove })
                                 }).then(() => {
                                    setSelectedShifts([]);
                                    refetchScheduled();
                                    toast({title: "Spostato", description: `Record spostato con successo.`});
                                 });
                               }
                             }}
                           >
                              {turniFiltrato ? (
                                <ContextMenu>
                                 <ContextMenuTrigger>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <div 
                                        draggable={isMaster}
                                        onDragStart={(e) => { 
                                           e.dataTransfer.setData("shiftId", String(turniFiltrato.id)); 
                                           e.dataTransfer.setData("sourceHour", hour);
                                           e.dataTransfer.effectAllowed = "move"; 
                                        }}
                                        title={hasConflict ? "Conflitto registrato" : ""} 
                                        style={postInfo?.colore ? {backgroundColor: postInfo.colore, color: '#1e293b', borderColor: 'rgba(0,0,0,0.1)'} : {}} 
                                        className={`${hasConflict ? 'bg-red-100 text-red-800 border-red-300 opacity-70' : 'bg-indigo-100 text-indigo-800 border-indigo-200'} ${selectedShifts.some(s => s.shiftId === turniFiltrato.id && s.hour === hour) ? 'ring-2 ring-indigo-600 ring-offset-1' : ''} w-full h-full min-h-[20px] rounded border flex flex-col items-center justify-center p-0.5 shadow-sm hover:brightness-95 relative group`}
                                      >
                                        {isMaster && (
                                          <div className="absolute top-0 right-0 p-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                            <input type="checkbox" className="w-3 h-3 m-0.5 cursor-pointer accent-indigo-600" 
                                              checked={selectedShifts.some(s => s.shiftId === turniFiltrato.id && s.hour === hour)}
                                              onChange={(e) => {
                                                if (e.target.checked) setSelectedShifts([...selectedShifts, { shiftId: turniFiltrato.id, hour: hour }]);
                                                else setSelectedShifts(selectedShifts.filter(s => !(s.shiftId === turniFiltrato.id && s.hour === hour)));
                                              }}
                                            />
                                          </div>
                                        )}
                                        <span className="text-[9px] font-bold uppercase truncate max-w-full">
                                          {hasConflict && <AlertTriangle className="h-2 w-2 mr-0.5 inline pb-0.5"/>}
                                          {turniFiltrato.postazione}
                                        </span>
                                      </div>
                                    </PopoverTrigger>
                                    {isMaster && (
                                     <PopoverContent className="w-80 p-4">
                                        {selectedShifts.length > 0 && selectedShifts.some(s => s.shiftId === turniFiltrato.id) && (
                                          <div className="bg-indigo-50 border border-indigo-200 rounded p-3 mb-4 shadow-sm">
                                            <h5 className="font-bold text-indigo-800 text-xs mb-2">Azione Massiva ({selectedShifts.length} celle scelte)</h5>
                                            
                                            <div className="flex flex-col gap-2">
                                               {/* Spostamento/Copia per Dipendente */}
                                               <div className="flex gap-2 items-center">
                                                 <select id="mass-emp-select" className="flex h-8 w-full rounded-md border border-input bg-white px-2 text-[10px] uppercase shadow-sm">
                                                   <option value="">Seleziona team...</option>
                                                   {dipendenti.filter(d => !isSystemEmployee(d)).map(d => (
                                                     <option key={d.id} value={d.id}>{d.nome} {d.cognome}</option>
                                                   ))}
                                                 </select>
                                                 <Button size="sm" className="h-8 text-[10px] px-2 whitespace-nowrap" onClick={async () => {
                                                    const sel = document.getElementById('mass-emp-select') as HTMLSelectElement;
                                                    if (!sel.value) return;
                                                    await fetch(`/api/gemteam/turni/scheduled/mass-action-granular`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'move', employeeTarget: parseInt(sel.value), cells: selectedShifts }) });
                                                    setSelectedShifts([]); refetchScheduled(); document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); toast({title: "Spostati", description: `Celle spostate sul nuovo dipendente.`});
                                                 }}>Sposta</Button>
                                                 <Button size="sm" variant="outline" className="h-8 text-[10px] px-2 whitespace-nowrap" onClick={async () => {
                                                    const sel = document.getElementById('mass-emp-select') as HTMLSelectElement;
                                                    if (!sel.value) return;
                                                    await fetch(`/api/gemteam/turni/scheduled/mass-action-granular`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'duplicate', employeeTarget: parseInt(sel.value), cells: selectedShifts }) });
                                                    setSelectedShifts([]); refetchScheduled(); document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); toast({title: "Duplicati", description: `Celle duplicate sul nuovo dipendente.`});
                                                 }}>Duplica</Button>
                                               </div>

                                               {/* Spostamento/Copia per Data */}
                                               <div className="flex gap-2 items-center">
                                                 <Input type="date" id="mass-date-select" className="h-8 w-full text-[10px] bg-white px-2" defaultValue={formattedTurniDate} />
                                                 <Button size="sm" className="h-8 text-[10px] px-2 whitespace-nowrap" onClick={async () => {
                                                    const sel = document.getElementById('mass-date-select') as HTMLInputElement;
                                                    if (!sel.value) return;
                                                    await fetch(`/api/gemteam/turni/scheduled/mass-action-granular`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'move', dateTarget: sel.value, cells: selectedShifts }) });
                                                    setSelectedShifts([]); refetchScheduled(); document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); toast({title: "Spostati", description: `Celle spostate correttamente sulla nuova data.`});
                                                 }}>Sposta</Button>
                                                 <Button size="sm" variant="outline" className="h-8 text-[10px] px-2 whitespace-nowrap" onClick={async () => {
                                                    const sel = document.getElementById('mass-date-select') as HTMLInputElement;
                                                    if (!sel.value) return;
                                                    await fetch(`/api/gemteam/turni/scheduled/mass-action-granular`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'duplicate', dateTarget: sel.value, cells: selectedShifts }) });
                                                    setSelectedShifts([]); refetchScheduled(); document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); toast({title: "Duplicati", description: `Celle duplicate correttamente sulla nuova data.`});
                                                 }}>Duplica</Button>
                                               </div>
                                               
                                               <Button variant="destructive" size="sm" className="h-8 text-[10px] w-full mt-1" onClick={async () => {
                                                   if (!confirm(`Sei sicuro di voler eliminare le ${selectedShifts.length} celle selezionate?`)) return;
                                                   // Delete was not explicitly added to mass-action-granular. Let's process it client side using the original logic or simulate a move to nowhere 
                                                   // Actually, moving without assigning is not handled. Let's do it via DELETE logic:
                                                   // We just need to remove selected blocks from original shifts.
                                                   // I can use mass-action-granular with employeeTarget = null ? No. It requires target. 
                                                   // Let me just tell backend to delete them by adding a 'delete' action.
                                                   await fetch(`/api/gemteam/turni/scheduled/mass-action-granular`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', cells: selectedShifts }) });
                                                   
                                                   setSelectedShifts([]); refetchScheduled(); document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); toast({title: "Eliminate", description: `Celle eliminate con successo.`});
                                               }}>Elimina tutte le {selectedShifts.length} celle selezionate</Button>
                                            </div>
                                          </div>
                                        )}
                                        <h4 className="font-bold text-sm mb-2">Modifica Intero Turno</h4>
                                        <p className="text-xs text-slate-500 mb-4">{dip.cognome} {dip.nome} - {hour}</p>
                                        
                                        <form onSubmit={(e) => {
    e.preventDefault();
    const selectEl = e.currentTarget.elements.namedItem('postazione') as HTMLSelectElement;
    const startEl = e.currentTarget.elements.namedItem('inizio') as HTMLInputElement;
    const endEl = e.currentTarget.elements.namedItem('fine') as HTMLInputElement;
    const noteEl = e.currentTarget.elements.namedItem('note') as HTMLInputElement;
    
    if (!selectEl.value) { toast({title: "Errore", description: "Seleziona postazione", variant: "destructive"}); return; }

    shiftMutation.mutate({
      id: turniFiltrato.id,
      employeeId: dip.id,
      data: formattedTurniDate,
      oraInizio: startEl.value,
      oraFine: endEl.value,
      postazione: selectEl.value,
      note: noteEl.value
    }, { onSuccess: () => refetchScheduled() });
  }}>
  <div className="space-y-3">
                                            <div className="w-full">
                                            <label className="text-xs font-semibold text-slate-600">Postazione</label>
                                            
  <select name="postazione" defaultValue={turniFiltrato.postazione} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required>
    <option value="" disabled>Seleziona...</option>
    {postazioniApi.filter((p:any) => p.attiva === 1 || p.attiva === true || p.attiva).sort((a:any, b:any) => (a.ordine || 0) - (b.ordine || 0)).map((p:any) => (
      <option key={p.id} value={p.nome}>{p.nome}</option>
    ))}
  </select>

                                          </div>
                                          <div className="flex gap-2">
                                            <div className="w-1/2">
                                              <label className="text-xs font-semibold text-slate-600">Inizio</label>
                                              <Input name="inizio" type="time" defaultValue={hour} />
                                            </div>
                                            <div className="w-1/2">
                                              <label className="text-xs font-semibold text-slate-600">Fine</label>
                                              <Input name="fine" type="time" defaultValue={`${hour.substring(0,2)}:30`} />
                                            </div>
                                          </div>
                                          <div>
                                            <label className="text-xs font-semibold text-slate-600">Note</label>
                                            <Input name="note" placeholder="Opzionale..." defaultValue={turniFiltrato.note || ''} />
                                          </div>
                                        </div>

                                        <div className="flex gap-2 justify-end mt-4">
                                           <Button type="button" variant="destructive" size="sm" onClick={(e) => { e.preventDefault(); deleteShiftMutation.mutate(turniFiltrato.id);}}>Elimina</Button>
                                           <Button type="submit" size="sm" disabled={shiftMutation.isPending}>{shiftMutation.isPending ? "..." : "Salva"}</Button>
                                        </div>
  </form>
                                      </PopoverContent>
                                    )}
                                  </Popover>
                                 </ContextMenuTrigger>
                                 {isMaster && (
                                   <ContextMenuContent className="w-56">
                                     <ContextMenuSub>
                                       <ContextMenuSubTrigger>Copia su dipendente</ContextMenuSubTrigger>
                                       <ContextMenuSubContent className="w-48 overflow-y-auto max-h-[300px]">
                                         {dipendenti.filter(d => !isSystemEmployee(d) && d.id !== dip.id).map(d => (
                                           <ContextMenuItem key={d.id} onClick={() => shiftMutation.mutate({employeeId: d.id, data: formattedTurniDate, oraInizio: turniFiltrato.oraInizio, oraFine: turniFiltrato.oraFine, postazione: turniFiltrato.postazione})}>{d.nome} {d.cognome}</ContextMenuItem>
                                         ))}
                                       </ContextMenuSubContent>
                                     </ContextMenuSub>
                                     <ContextMenuSub>
                                       <ContextMenuSubTrigger>Copia in data...</ContextMenuSubTrigger>
                                       <ContextMenuSubContent className="w-40">
                                         {[1,2,3,4,5,6].map(offset => {
                                            const tDate = addDays(turniDate, offset);
                                            return <ContextMenuItem key={offset} onClick={() => shiftMutation.mutate({employeeId: dip.id, data: format(tDate, 'yyyy-MM-dd'), oraInizio: turniFiltrato.oraInizio, oraFine: turniFiltrato.oraFine, postazione: turniFiltrato.postazione})}>{format(tDate, 'EEEE d MMM', {locale:it})}</ContextMenuItem>
                                         })}
                                       </ContextMenuSubContent>
                                     </ContextMenuSub>
                                     <ContextMenuSub>
                                        <ContextMenuSubTrigger>Copia settimana intera</ContextMenuSubTrigger>
                                        <ContextMenuSubContent className="w-44">
                                           <ContextMenuItem onClick={async () => {
                                              const bDate = startOfWeek(turniDate, { weekStartsOn: 1 });
                                              const nextWeek = addDays(bDate, 7);
                                              const shiftsToCopy = turniScheduled.filter((ts:any) => String(ts.employeeId) === String(dip.id));
                                              for (let s of shiftsToCopy) {
                                                const thatDayObj = new Date(s.data);
                                                const diff = Math.floor((thatDayObj.getTime() - bDate.getTime()) / (1000*60*60*24));
                                                const targetDate = format(addDays(nextWeek, diff), 'yyyy-MM-dd');
                                                await fetch('/api/gemteam/turni/scheduled', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ employeeId: dip.id, data: targetDate, oraInizio: s.oraInizio, oraFine: s.oraFine, postazione: s.postazione }) });
                                              }
                                              refetchScheduled();
                                              queryClient.invalidateQueries({ queryKey: ['/api/gemteam/turni/scheduled'] });
                                           }}>Su prossima settimana</ContextMenuItem>
                                        </ContextMenuSubContent>
                                     </ContextMenuSub>
                                   </ContextMenuContent>
                                 )}
                                </ContextMenu>
                              ) : (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <div className="w-full h-full min-h-[20px] bg-white text-transparent">_</div>
                                  </PopoverTrigger>
                                  {isMaster && (
                                    <PopoverContent className="w-72 p-4">
                                      <h4 className="font-bold text-sm mb-2">Aggiungi Turno</h4>
                                      <p className="text-xs text-slate-500 mb-4">{dip.cognome} {dip.nome} - {hour}</p>
                                      
                                      <form onSubmit={(e) => {
  e.preventDefault();
  const selectEl = e.currentTarget.elements.namedItem('postazione') as HTMLSelectElement;
  const startEl = e.currentTarget.elements.namedItem('inizio') as HTMLInputElement;
  const endEl = e.currentTarget.elements.namedItem('fine') as HTMLInputElement;
  const noteEl = e.currentTarget.elements.namedItem('note') as HTMLInputElement;
  
  if (!selectEl.value) { toast({title: "Errore", description: "Seleziona postazione", variant: "destructive"}); return; }
  
  shiftMutation.mutate({
    employeeId: dip.id,
    data: formattedTurniDate,
    oraInizio: startEl.value,
    oraFine: endEl.value,
    postazione: selectEl.value,
    note: noteEl.value
  }, { onSuccess: () => refetchScheduled() });
}}>
<div className="space-y-3">
                                        <div>
                                          <label className="text-xs font-semibold text-slate-600">Postazione</label>
                                          
<select name="postazione" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required>
  <option value="" disabled selected>Seleziona...</option>
  {postazioniApi.filter((p:any) => p.attiva === 1 || p.attiva === true || p.attiva).sort((a:any, b:any) => (a.ordine || 0) - (b.ordine || 0)).map((p:any) => (
    <option key={p.id} value={p.nome}>{p.nome}</option>
  ))}
</select>

                                        </div>
                                        <div className="flex gap-2">
                                          <div className="w-1/2">
                                            <label className="text-xs font-semibold text-slate-600">Inizio</label>
                                            <Input name="inizio" type="time" defaultValue={hour} />
                                          </div>
                                          <div className="w-1/2">
                                            <label className="text-xs font-semibold text-slate-600">Fine</label>
                                            <Input name="fine" type="time" defaultValue={`${hour.substring(0,2)}:30`} />
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-xs font-semibold text-slate-600">Note</label>
                                          <Input name="note" placeholder="Opzionale..." />
                                        </div>
                                      </div>

                                      <Button type="submit" size="sm" className="w-full mt-4" disabled={shiftMutation.isPending}>{shiftMutation.isPending ? "..." : "Aggiungi"}</Button>
</form>
                                    </PopoverContent>
                                  )}
                                </Popover>
                              )}
                           </td>
                         );
                      })}
                    </tr>
                  ))}
                </tbody>

                <tfoot className="sticky bottom-0 z-20 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] bg-white border-t-2 border-slate-300">
                  <tr>
                    <td className="bg-slate-100 border-r border-slate-300 text-center text-[10px] font-extrabold text-slate-600 p-2 select-none sticky left-0 shadow-[1px_0_0_rgba(200,200,200,0.5)] z-10 tracking-widest uppercase">
                      TOT ORE
                    </td>
                    {[...filteredSegreteria, ...filteredManutenzione, ...filteredUfficio, ...filteredAmministrazione, ...filteredComunicazione, ...filteredDirezione].map(dip => (
                      <td key={`tot-${dip.id}`} className="text-center p-2 font-bold text-xs text-slate-600 border-r border-slate-200 bg-slate-50">
                        {/* Mock calculation: in final version we sum duration of postazioni with conta_ore=1 */}
                        {(() => {
  const turniDip = Array.isArray(turniScheduled) ? turniScheduled.filter((t:any) => String(t.employeeId) === String(dip.id)) : [];
  if (turniDip.length === 0) return '0.0h';
  let mins = 0;
  turniDip.forEach((t:any) => {
    if (!t.oraInizio || !t.oraFine) return;
    const postazioneInfo = postazioniApi.find((p:any) => p.nome === t.postazione);
    if (!postazioneInfo || !postazioneInfo.contaOre) return; // Conta ore check
    const [hS, mS] = t.oraInizio.split(':').map(Number);
    const [hE, mE] = t.oraFine.split(':').map(Number);
    mins += (hE * 60 + mE) - (hS * 60 + mS);
  });
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}.${m/6}h` : `${h}.0h`;
})()}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
            )}
            
            {/* GRIGLIA SETTIMANALE */}
            {turniViewMode === 'settimanale' && (
              <div className="flex-1 overflow-auto bg-slate-100/50 relative" style={{ maxHeight: '60vh' }}>
                <table id="griglia-settimanale" className="w-full border-collapse min-w-max bg-white table-fixed">
                  <thead className="sticky top-0 z-20 shadow-sm border-b border-slate-300">
                    <tr>
                      <th className="w-40 min-w-40 bg-slate-50 border-r border-slate-300 p-2 text-left text-[11px] text-slate-500 font-bold uppercase tracking-widest shadow-[1px_0_0_rgba(200,200,200,0.5)] z-30">
                        Dipendente
                      </th>
                      {[0,1,2,3,4,5,6].map(offset => {
                          const d = addDays(startOfWeek(turniDate, { weekStartsOn: 1 }), offset);
                          return (
                             <th key={offset} className="w-32 bg-slate-50 border-r border-slate-300 p-2 text-center text-[10px] font-bold text-slate-700 uppercase">
                                 {format(d, 'EEEE dd/MM', { locale: it })}
                             </th>
                          );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dipendenti.filter(d => !isSystemEmployee(d)).map((dip, idx) => (
                        <tr key={dip.id} className={`hover:bg-slate-100 transition-colors border-b-2 border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                            <td className="p-2 border-r border-slate-200 font-semibold text-[11px] text-slate-700 sticky left-0 z-10 shadow-[1px_0_0_rgba(200,200,200,0.5)] truncate max-w-[160px] bg-inherit align-top">
                               <div className="sticky top-0">{dip.nome} {dip.cognome}</div>
                            </td>
                            {[0,1,2,3,4,5,6].map(offset => {
                                const currentDate = format(addDays(startOfWeek(turniDate, { weekStartsOn: 1 }), offset), 'yyyy-MM-dd');
                                const turniGiorno = Array.isArray(turniScheduled) ? turniScheduled.filter((t:any) => String(t.employeeId) === String(dip.id) && format(new Date(t.data), 'yyyy-MM-dd') === currentDate) : [];
                                if (turniGiorno.length === 0) return <td key={offset} className="p-1 border-r border-slate-200 min-h-[40px]"></td>;
                                
                                return (
                                   <td key={offset} className="p-1 border-r border-slate-200 min-h-[40px] align-top">
                                      <div className="flex flex-col gap-1">
                                      {turniGiorno.map(t => {
                                          const postInfo = postazioniApi.find((p:any) => p.nome === t.postazione);
                                          const hasConflict = t.hasConflict || false;
                                          return (
                                              <div key={t.id} title={hasConflict ? "Conflitto registrato" : ""} className={`w-full min-h-[30px] rounded border flex flex-col items-center justify-center p-1 shadow-sm text-center ${hasConflict ? 'bg-red-100 text-red-800 border-red-300 ring-2 ring-red-500/30' : ''}`} style={(!hasConflict && postInfo?.colore) ? {backgroundColor: postInfo.colore, color: '#1e293b', borderColor: 'rgba(0,0,0,0.1)'} : {}}>
                                                  <span className="text-[9px] font-bold uppercase truncate max-w-full">
                                                     {hasConflict && <AlertTriangle className="h-2 w-2 mr-0.5 inline pb-0.5"/>}
                                                     {t.postazione}
                                                  </span>
                                                  <span className="text-[8px] opacity-80 font-medium">{(t.oraInizio || '').substring(0,5)} - {(t.oraFine || '').substring(0,5)}</span>
                                              </div>
                                          )
                                      })}
                                      </div>
                                   </td>
                                )
                            })}
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}            
          </div>
        </TabsContent>

        <TabsContent value="presenze">
          <div className="px-6 md:px-8 max-w-7xl mx-auto">
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
          </div>
        </TabsContent>

        <TabsContent value="diario">
          <div className="px-6 md:px-8 max-w-7xl mx-auto">
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
          </div>
        </TabsContent>

        <TabsContent value="report">
          <div className="px-6 md:px-8 max-w-7xl mx-auto">
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
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
