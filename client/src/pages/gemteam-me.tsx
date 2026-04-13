import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Wrench, LogOut, Play, Square, CheckCircle2, Clock, Send, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function GemTeamMe() {
  const { user, logoutMutation } = useAuth();
  const queryClient = useQueryClient();

  const userRole = (user as any)?.role?.toLowerCase() || "";
  if (userRole !== "dipendente" && userRole !== "admin" && userRole !== "operator") {
     // Allow admins to preview it if they want, but mainly for dipendente
  }

  // 1. Fetch to find the employee_id mapping to this user.id
  const { data: dipendenti = [] } = useQuery<any[]>({
    queryKey: ['/api/gemteam/dipendenti'],
  });

  const employeeRecord = useMemo(() => {
    if (!user) return null;
    return dipendenti.find(d => d.userId === user.id) || null;
  }, [dipendenti, user]);

  const employeeId = employeeRecord?.id;

  // 2. Fetch the current day checkin status for this employee
  const { data: checkinStatus, isLoading: isLoadingStatus } = useQuery<any>({
    queryKey: ['/api/gemteam/checkin/status', employeeId],
    enabled: !!employeeId,
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  // Derive checkin state from API
  const checkInState = useMemo(() => {
    if (isLoadingStatus || !checkinStatus) return "NOT_STARTED";
    if (checkinStatus === "NOT_FOUND" || checkinStatus.status === "NOT_STARTED") return "NOT_STARTED";
    if (checkinStatus.status === "IN") return "IN_PROGRESS";
    if (checkinStatus.status === "COMPLETED" || checkinStatus.status === "OUT") return "COMPLETED";
    return "NOT_STARTED";
  }, [checkinStatus, isLoadingStatus]);

  const inTime = checkinStatus?.lastEventTime ? new Date(checkinStatus.lastEventTime) : null;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const checkinMutation = useMutation({
    mutationFn: async (tipo: 'IN' | 'OUT') => {
      if (!employeeId) throw new Error("Employee non trovato");
      await apiRequest("POST", "/api/gemteam/checkin", {
        employee_id: employeeId,
        tipo,
        device: 'web'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gemteam/checkin/status', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['/api/gemteam/checkin/oggi'] });
    }
  });

  // 3. Modulo Richieste Permessi
  const { data: permessiData = [], isLoading: isLoadingPermessi } = useQuery<any[]>({
    queryKey: ['/api/gemteam/permessi', employeeId],
    enabled: !!employeeId,
  });

  const [reqTipo, setReqTipo] = useState("PE");
  const [reqInizio, setReqInizio] = useState("");
  const [reqFine, setReqFine] = useState("");
  const [reqNote, setReqNote] = useState("");

  const permessiMutation = useMutation({
    mutationFn: async () => {
      if (!employeeId) throw new Error("Employee non trovato");
      await apiRequest("POST", "/api/gemteam/permessi", {
        employee_id: employeeId,
        tipo: reqTipo,
        data_inizio: reqInizio || null,
        data_fine: reqFine || null,
        note: reqNote
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gemteam/permessi', employeeId] });
      setReqInizio("");
      setReqFine("");
      setReqNote("");
    }
  });

  const handleAction = () => {
    if (checkInState === "NOT_STARTED") {
      checkinMutation.mutate('IN');
    } else if (checkInState === "IN_PROGRESS") {
      checkinMutation.mutate('OUT');
    }
  };

  const elapsedText = () => {
    if (!inTime) return "";
    const diff = Math.floor((currentTime.getTime() - inTime.getTime()) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const todayString = currentTime.toLocaleDateString('it-IT', dateOptions);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto mt-4 md:mt-8 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
         <div className="text-center md:text-left">
           <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">
             Ciao {(user as any)?.firstName || "Team"} 👋
           </h1>
           <p className="text-lg md:text-xl text-slate-500 font-medium mt-2 capitalize">
             {todayString}
           </p>
         </div>
         
         <Button onClick={() => logoutMutation.mutate()} variant="outline" size="lg" className="bg-white border-2 hover:bg-slate-50 rounded-2xl h-14 px-6 text-lg font-bold shadow-sm text-slate-600">
           <LogOut className="w-5 h-5 mr-3" /> Esci
         </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* BIG CHECKIN CARD */}
        <div className="md:col-span-8">
          <Card className={`border-4 shadow-xl overflow-hidden rounded-[2rem] transition-all duration-500 ${
            checkInState === "NOT_STARTED" ? "border-slate-200 bg-white" :
            checkInState === "IN_PROGRESS" ? "border-emerald-500 bg-emerald-50" :
            "border-blue-500 bg-blue-50"
          }`}>
            <CardContent className="p-8 md:p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
              
              {checkInState === "NOT_STARTED" && (
                <>
                  <Badge variant="outline" className="mb-8 text-lg px-4 py-1.5 bg-slate-100 text-slate-600 border-2 rounded-xl">Inizio Turno</Badge>
                  <Button 
                    onClick={handleAction}
                    className="w-full max-w-sm h-32 text-3xl font-black rounded-3xl bg-emerald-500 hover:bg-emerald-600 shadow-[0_8px_30px_rgb(16,185,129,0.3)] transition-transform active:scale-95"
                  >
                    <Play className="w-12 h-12 mr-4 fill-current" /> ENTRATA
                  </Button>
                  <p className="mt-8 text-2xl font-bold text-slate-500 flex items-center justify-center gap-3">
                    <Clock className="w-8 h-8" /> {currentTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </>
              )}

              {checkInState === "IN_PROGRESS" && (
                <>
                  <Badge variant="outline" className="mb-8 text-lg px-4 py-1.5 bg-emerald-100 text-emerald-800 border-emerald-300 border-2 rounded-xl animate-pulse">In Sede</Badge>
                  
                  <div className="text-6xl md:text-7xl font-black text-emerald-700 tracking-tighter mb-8 tabular-nums">
                    {elapsedText()}
                  </div>

                  <Button 
                    onClick={handleAction}
                    className="w-full max-w-sm h-28 text-3xl font-black rounded-3xl bg-rose-500 hover:bg-rose-600 shadow-[0_8px_30px_rgb(244,63,94,0.3)] transition-transform active:scale-95"
                  >
                    <Square className="w-10 h-10 mr-4 fill-current" /> USCITA
                  </Button>

                  <p className="mt-8 text-lg font-bold text-emerald-600 opacity-80">
                    Timbratura effettuata alle: {inTime?.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </>
              )}

              {checkInState === "COMPLETED" && (
                <>
                  <div className="w-24 h-24 bg-blue-500 text-white rounded-full flex items-center justify-center mb-6 shadow-[0_8px_30px_rgb(59,130,246,0.4)]">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h2 className="text-4xl font-black text-blue-900 mb-2">Turno Completato</h2>
                  <p className="text-xl text-blue-700 font-medium mb-8">Ottimo lavoro per oggi.</p>
                  
                  <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-4">
                    <div className="bg-white p-4 rounded-2xl border-2 border-blue-100 shadow-sm text-center">
                      <span className="block text-sm font-bold text-blue-400 uppercase tracking-widest mb-1">Inizio</span>
                      <span className="text-2xl font-black text-slate-700">{inTime?.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border-2 border-blue-100 shadow-sm text-center">
                      <span className="block text-sm font-bold text-blue-400 uppercase tracking-widest mb-1">Fine</span>
                      <span className="text-2xl font-black text-slate-700">{currentTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </>
              )}

            </CardContent>
          </Card>
        </div>

        {/* SIDE PANELS */}
        <div className="md:col-span-4 space-y-8">
          
          <Card className="border-2 border-slate-200 shadow-none rounded-[2rem] bg-white">
            <CardContent className="p-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Il mio turno oggi</h3>
              <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-5">
                <span className="inline-block bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-lg text-sm mb-3">RECEPTION</span>
                <div className="text-3xl font-black text-slate-700 tracking-tight">08:30 <span className="text-slate-300">→</span> 14:30</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-none rounded-[2rem] bg-white">
            <CardContent className="p-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Questo mese</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b-2 border-slate-50 pb-4">
                  <span className="text-slate-500 font-semibold text-lg">Ore Totali</span>
                  <span className="text-2xl font-black text-slate-800">120.5</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-semibold text-lg">Giorni Lavorati</span>
                  <span className="text-2xl font-black text-slate-800">15</span>
                </div>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>

      {/* MODULO RICHIESTE (PERMESSI/FERIE) */}
      <div className="mt-8">
        <Card className="border-4 shadow-xl overflow-hidden rounded-[2rem] border-slate-200 bg-white">
          <CardContent className="p-6 md:p-10">
            <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-500" /> Le mie richieste
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
              
              {/* FORM NUOVA RICHIESTA */}
              <div className="md:col-span-5 space-y-6 bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
                <h3 className="text-lg font-bold text-slate-700 mb-4">Nuova Richiesta</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 block">Tipo</label>
                    <Select value={reqTipo} onValueChange={setReqTipo}>
                      <SelectTrigger className="bg-white border-2 border-slate-200 h-12 rounded-xl font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FE">FE - Ferie</SelectItem>
                        <SelectItem value="PE">PE - Permesso Orario</SelectItem>
                        <SelectItem value="ML">ML - Malattia</SelectItem>
                        <SelectItem value="ALTRO">Altro (Specificare)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 block">Dal</label>
                      <Input type="date" value={reqInizio} onChange={e => setReqInizio(e.target.value)} className="bg-white border-2 border-slate-200 h-12 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 block">Al</label>
                      <Input type="date" value={reqFine} onChange={e => setReqFine(e.target.value)} className="bg-white border-2 border-slate-200 h-12 rounded-xl text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 block">Dettagli / Note</label>
                    <Input placeholder="Motivazione o orari..." value={reqNote} onChange={e => setReqNote(e.target.value)} className="bg-white border-2 border-slate-200 h-12 rounded-xl" />
                  </div>

                  <Button 
                    onClick={() => permessiMutation.mutate()}
                    disabled={permessiMutation.isPending || !reqInizio}
                    className="w-full h-14 mt-4 text-lg font-bold rounded-xl bg-blue-600 hover:bg-blue-700 shadow-[0_8px_30px_rgb(37,99,235,0.2)]"
                  >
                    <Send className="w-5 h-5 mr-2" /> Invia richiesta
                  </Button>
                </div>
              </div>

              {/* LISTA RICHIESTE */}
              <div className="md:col-span-7">
                <h3 className="text-lg font-bold text-slate-700 mb-6">Storico Richieste</h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {isLoadingPermessi ? (
                    <p className="text-slate-500 text-center py-8 font-medium">Caricamento...</p>
                  ) : permessiData.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
                      <p className="text-slate-500 font-medium">Nessuna richiesta inviata. <br/>Il tuo storico apparirà qui.</p>
                    </div>
                  ) : (
                    permessiData.map((req: any, index: number) => {
                      const isPending = req.stato === 'PENDING' || !req.stato;
                      const isApproved = req.stato === 'APPROVED';
                      const isRejected = req.stato === 'REJECTED';
                      
                      return (
                        <div key={index} className="flex justify-between items-center bg-white border-2 border-slate-100 p-5 rounded-2xl shadow-sm hover:border-blue-100 hover:shadow-md transition-all">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <Badge variant="outline" className="bg-slate-100 font-black text-slate-700">{req.tipo}</Badge>
                              <span className="text-sm font-semibold text-slate-600">
                                {req.data_inizio ? new Date(req.data_inizio).toLocaleDateString('it-IT') : ''}
                                {req.data_fine && req.data_fine !== req.data_inizio ? ` → ${new Date(req.data_fine).toLocaleDateString('it-IT')}` : ''}
                              </span>
                            </div>
                            {req.note && <p className="text-sm text-slate-500 mt-2 truncate w-64">{req.note}</p>}
                          </div>
                          <div>
                            {isPending && <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 font-bold border-0 px-3 py-1">IN ATTESA</Badge>}
                            {isApproved && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold border-0 px-3 py-1">APPROVATA</Badge>}
                            {isRejected && <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-200 font-bold border-0 px-3 py-1">RIFIUTATA</Badge>}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
              
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
