import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FolderTree,
  Tags,
  Briefcase,
  CreditCard,
  IdCard,
  ScanBarcode,
  BarChart3,
  Upload,
  LogOut,
  Circle,
  PauseCircle,
  PowerOff,
  Building2,
  Wallet,
  Settings,
  UserCog,
  RotateCcw,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Database,
  CalendarFold,
  Activity,
  ClipboardList,
  BookOpen,
  MessageSquarePlus,
  StickyNote,
  Ticket,
  CalendarRange,
  Clock,
  FileText,
  Stethoscope,
  List,
  Layers,
  UserPlus,
  Trash2,
  ChevronRight,
  BadgePercent,
  Radio,
  ArrowLeftRight,
  BadgeCheck,
  Users2,
} from "lucide-react";
import { useLocation, Link } from "wouter";
import { format } from "date-fns";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SharedActivityLog } from "@/components/shared-activity-log";
import { getActiveActivities } from "@/config/activities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarGemCopilot } from "@/components/star-gem-copilot";
import { useCopilot } from "@/hooks/use-copilot";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;

// 1. SEGRETERIA OPERATIVA
const registrationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Maschera Input",
    url: "/maschera-input",
    icon: Users,
  },
  {
    title: "Anagrafica Generale",
    url: "/anagrafica-generale",
    icon: IdCard,
  },
  {
    title: "GemPass",
    url: "/gempass",
    icon: BadgeCheck,
  },
  {
    title: "Tessere e Certificati Medici",
    url: "/tessere-certificati",
    icon: IdCard,
  },
  {
    title: "Generazione Tessere",
    url: "/generazione-tessere",
    icon: ScanBarcode,
  },
  {
    title: "Controllo Accessi",
    url: "/accessi",
    icon: ShieldCheck,
  },
];

// 2. AMMINISTRAZIONE & CASSA
const accountingItems = [
  {
    title: "Quote e Promo",
    url: "/quote-promo",
    icon: BadgePercent,
  },
  {
    title: "Webhook Status",
    url: "/webhook-status",
    icon: Radio,
    adminOnly: true,
  },
  {
    title: "WC Mapping",
    url: "/wc-mapping",
    icon: ArrowLeftRight,
    adminOnly: true,
  },
  {
    title: "Lista Pagamenti",
    url: "/pagamenti",
    icon: Wallet,
  },
  {
    title: "Scheda Contabile",
    url: "/scheda-contabile",
    icon: CreditCard,
  },
  {
    title: "Report & Statistiche",
    url: "/report",
    icon: BarChart3,
  },
];

// 3. ATTIVITÀ E DIDATTICA
const teachingItems = [
  {
    title: "Attività",
    url: "/attivita",
    icon: Layers,
    subItems: [
      { title: "Panoramica Attività", url: "/attivita" },
      // Generazione dinamica dal Registro Centrale, limitata a chi ha il flag visivo acceso
      ...getActiveActivities()
        .filter(a => a.visibility.sidebarMenu)
        .map(a => ({
          title: a.labelUI,
          url: a.routeUrl
        }))
    ]
  },
  {
    title: "Iscritti per Attività",
    url: "/iscritti_per_attivita",
    icon: ClipboardList,
  },

  {
    title: "Calendario Attività",
    url: "/calendario-attivita",
    icon: CalendarFold,
  },
  {
    title: "Planning",
    url: "/planning",
    icon: CalendarRange,
  },
  {
    title: "Programmazione Date",
    url: "/programmazione-date",
    icon: Calendar,
  },
  {
    title: "Studios/Sale",
    url: "/studios",
    icon: Building2,
  },
  {
    title: "Affitto Studio Medico",
    url: "/affitto-studio",
    icon: Stethoscope,
  },
];

// 4. RISORSE UMANE & TEAM
const secretariatItems = [
  {
    title: "GemStaff",
    url: "/gemstaff",
    icon: BadgeCheck,
  },
  {
    title: "GemTeam",
    url: "/gemteam",
    icon: Users2,
  },
  {
    title: "Gestione Note",
    url: "/inserisci-nota",
    icon: StickyNote,
  },
  {
    title: "Commenti Team",
    url: "/commenti",
    icon: MessageSquarePlus,
  },
  {
    title: "ToDoList",
    url: "/todo-list",
    icon: FileText,
  },
  {
    title: "Knowledge Base",
    url: "/knowledge-base",
    icon: BookOpen,
  },
];

// 5. CONFIGURAZIONI CORE
const configItems: any[] = [];

const adminItems = [
  {
    title: "Pannello Admin Global",
    url: "/admin",
    icon: Settings,
  },
  {
    title: "Elenchi Custom",
    url: "/elenchi",
    icon: List,
  },
  {
    title: "Importazione Dati",
    url: "/importa",
    icon: Upload,
  },
  {
    title: "Utenti e Permessi",
    url: "/utenti-permessi",
    icon: UserCog,
  },
  {
    title: "Storico Eliminazioni",
    url: "/audit-logs",
    icon: Trash2,
  },
  {
    title: "Reset Stagione",
    url: "/reset-stagione",
    icon: RotateCcw,
  },
];

import { hasPermission } from "@/App";
import { UserProfileDialog } from "@/components/user-profile-dialog";
import { useActiveUsers } from "@/hooks/use-active-users";

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isInsegnante = (user as any)?.role === 'insegnante';

  const { data: usersInfoRaw = [] } = useActiveUsers();
  const [liveExtra, setLiveExtra] = useState(0);
  const [minLavoro, setMinLavoro] = useState(0);

  useEffect(() => {
    const me = usersInfoRaw.find((u: any) => u.id === user?.id);
    
    if (me) {
      const apiLavoro = me.lavoroOggiMinuti || 0;
      setMinLavoro(prev => Math.max(prev, apiLavoro));
    }
    
    if (me?.stato === 'pausa') {
      setLiveExtra(0);
    }

    if (!me || me.stato !== 'online' || !me.segmentoCorrenteInizio) {
      return;
    }
    
    const start = new Date(me.segmentoCorrenteInizio).getTime();
    
    // Il server ha restituito i dati a questo istante ("base"). 
    // Calcoliamo la differenza rispetto ad ora. Non sommiamo start ma facciamo un delta
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 60000);
      setLiveExtra(elapsed); 
    }, 10000);
    
    return () => clearInterval(interval);
  }, [usersInfoRaw, user]);

  const { data: latestActivity } = useQuery<{
    action: string;
    entityType: string;
    entityId: string;
    createdAt: string;
    details: any;
    user: { firstName: string; lastName: string; username: string };
  }>({
    queryKey: ["/api/latest-activity"],
  });

  const { data: summary } = useQuery<Record<string, { total: number, active: number }>>({
    queryKey: ["/api/activities-summary"],
  });

  const totalActiveActivities = summary
    ? Object.values(summary).reduce((sum, item) => sum + item.active, 0)
    : 0;

  const filteredRegistration = registrationItems.filter(item => hasPermission(user, item.url));
  const filteredTeaching = teachingItems
    .filter(item => hasPermission(user, item.url))
    .map(item => ({
      ...item,
      subItems: item.subItems ? item.subItems.filter(sub => hasPermission(user, sub.url)) : undefined
    }));
  const filteredSecretariat = secretariatItems.filter(item => hasPermission(user, item.url));
  const filteredAccounting = accountingItems.filter(item => hasPermission(user, item.url));
  const filteredConfig = configItems.filter(item => hasPermission(user, item.url));
  const filteredAdminItems = adminItems.filter(item => hasPermission(user, item.url));

  const { data: pendingPermessiCount = 0 } = useQuery<number>({
    queryKey: ['/api/gemteam/permessi/pending-count'],
    refetchInterval: 60000,
    enabled: ["admin", "master", "operator"].includes(user?.role?.toLowerCase() || ""),
  });

  return (
    <Sidebar>
      <SidebarHeader className={`border-b border-sidebar-border flex flex-col items-center justify-center overflow-hidden ${isInsegnante ? 'p-4 h-auto' : 'p-0 h-10'}`}>
        <Link href="/" className="cursor-pointer block flex items-center justify-center">
          <img
            src="/logo_stargem.png"
            alt="StarGem"
            className="h-16 w-auto object-contain mix-blend-multiply hover:opacity-90 transition-transform scale-125"
          />
        </Link>
        {isInsegnante && user && (
          <div className="flex flex-col items-center mt-4">
            <span className="font-bold text-slate-800">Ciao {user.firstName || user.username} 👋</span>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded mt-1 shadow-sm border border-amber-200">STAFF</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {isInsegnante ? (
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary font-bold uppercase tracking-wider text-[11px]">SEZIONE PERSONALE</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === '/gemstaff/me'}>
                    <Link href="/gemstaff/me">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>La mia area</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === '/forgot-password'}>
                    <Link href="/forgot-password">
                      <Settings className="w-4 h-4" />
                      <span>Cambia password</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => logoutMutation.mutate()}>
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span className="text-red-500">Logout</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            {filteredRegistration.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary font-bold uppercase tracking-wider text-[11px]">SEGRETERIA OPERATIVA</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredRegistration.map((item) => {
                  const isActive = location === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        data-testid={`nav-${item.url.slice(1)}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredAccounting.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary font-bold uppercase tracking-wider text-[11px]">AMMINISTRAZIONE & CASSA</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAccounting.map((item) => {
                  const isActive = location === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        data-testid={`nav-${item.url.slice(1)}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredTeaching.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary font-bold uppercase tracking-wider text-[11px]">ATTIVITÀ E DIDATTICA</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredTeaching.map((item) => {
                  const isParentActive = location === item.url || (item.subItems && item.subItems.some(sub => location === sub.url));

                  if (item.subItems && item.subItems.length > 0) {
                    return (
                      <Collapsible key={item.title} defaultOpen={isParentActive} className="group/collapsible">
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              isActive={isParentActive}
                              data-testid={`nav-${item.url.slice(1)}`}
                            >
                              <item.icon className="w-4 h-4" />
                              <span className="font-semibold">{item.title}</span>
                              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 w-4 h-4" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.subItems.map((sub) => (
                                <SidebarMenuSubItem key={sub.title}>
                                  <SidebarMenuSubButton asChild isActive={location === sub.url} className={location === sub.url ? "font-bold" : ""}>
                                    <Link href={sub.url}>
                                      <span>{sub.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isParentActive}
                        data-testid={`nav-${item.url.slice(1)}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="w-4 h-4" />
                          <span className={item.subItems ? "font-semibold" : ""}>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredSecretariat.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary font-bold uppercase tracking-wider text-[11px]">RISORSE UMANE & TEAM</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredSecretariat.map((item) => {
                  const isActive = location === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        data-testid={`nav-${item.url.slice(1)}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="w-4 h-4" />
                          <span className="flex-1 flex items-center justify-between">
                            {item.title}
                            {item.title === "GemTeam" && pendingPermessiCount > 0 && (
                              <Badge variant="destructive" className="ml-auto flex shrink-0 items-center justify-center rounded-full px-1.5 py-0 text-[10px] h-4 min-w-[20px]">
                                {pendingPermessiCount}
                              </Badge>
                            )}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredConfig.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary font-bold uppercase tracking-wider text-[11px]">CONFIGURAZIONI CORE</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredConfig.map((item) => {
                  const isActive = location === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        data-testid={`nav-${item.url.slice(1)}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredAdminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary font-bold uppercase tracking-wider text-[11px]">ADMIN / TECNICO</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAdminItems.map((item) => {
                  const isActive = location === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={item.url === "/admin" ? "bg-primary/5 text-primary hover:bg-primary/10" : ""}
                        data-testid={`nav-${item.url.slice(1)}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="w-4 h-4" />
                          <span className={item.url === "/admin" ? "font-semibold" : ""}>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <button onClick={() => useCopilot.getState().openCopilot()} className="flex items-center gap-2 px-2 py-1.5 w-full justify-start cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground">
                      <StarGemCopilot className="h-4 w-4 bg-transparent outline-none ring-0 shadow-none border-0 p-0" />
                      <span className="text-sm font-medium">TeoCopilot</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 pt-0 border-t border-sidebar-border">


        {/* ACTIVE USERS ACCORDION/LIST */}
        {!isInsegnante && (() => {
          const usersInfo = usersInfoRaw.filter((u: any) => {
            if (u.username?.toLowerCase().includes('martina')) return false;
            if (u.username?.includes('example.com')) return false;
            if (u.username === 'cavallo') return false;
            if (u.email?.includes('example.com')) return false;
            if (u.role?.toLowerCase() === 'client') return false;
            
            return true;
          });

          if (usersInfo.length === 0) return null;
          
          const onlineCount = usersInfo.filter((u: any) => u.stato === 'online').length;

          return (
            <div className="mt-2 pb-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  Connessioni Live
                  {onlineCount > 0 ? (
                    <span className="relative flex h-5 w-5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-emerald-500 text-white text-[10px] font-bold">
                        {onlineCount}
                      </span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center rounded-full h-5 w-5 bg-yellow-500 text-white text-[10px] font-bold">
                      0
                    </span>
                  )}
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-[18px] px-1.5 text-[9px] bg-white hover:bg-slate-50 border-slate-300 text-slate-600 font-medium tracking-tight shadow-sm">
                      <Activity className="w-2.5 h-2.5 mr-1 text-primary" /> Processi
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[90vw] md:max-w-4xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader className="mb-4">
                      <DialogTitle>Registro Interventi e Accessi</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="access">
                       <TabsList className="grid w-full grid-cols-2">
                           <TabsTrigger value="access">Accessi</TabsTrigger>
                           <TabsTrigger value="activities">Processi Svolti</TabsTrigger>
                       </TabsList>
                       <TabsContent value="access" className="mt-4 border rounded-md">
                           <SharedActivityLog hideTitle type="access" />
                       </TabsContent>
                       <TabsContent value="activities" className="mt-4 border rounded-md">
                           <SharedActivityLog hideTitle type="activities" />
                       </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                {[...usersInfo].sort((a, b) => {
                  if (a.id === user?.id) return -1;
                  if (b.id === user?.id) return 1;
                  return 0;
                }).map((u: any) => {
                  const isOnline = u.stato === 'online';
                  const isPausa = u.stato === 'pausa';
                  const isOffline = u.stato === 'offline' || !u.stato;
                  const isMe = user?.id === u.id;
                  
                  return (
                    <div key={u.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0" title={isOnline ? 'Online' : isPausa ? 'In Pausa' : 'Offline'}>
                        {isOnline ? (
                           <div className="relative flex h-[10px] w-[10px] shrink-0 justify-center items-center">
                             <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                             <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                           </div>
                        ) : isPausa ? (
                           <div className="relative flex h-[10px] w-[10px] shrink-0 justify-center items-center">
                             <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400"></span>
                           </div>
                        ) : (
                           <PowerOff className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                        )}
                        <span className={`truncate ${isOnline ? "text-slate-700 font-medium" : isPausa ? "text-slate-500 font-medium" : "text-slate-400 opacity-80"}`}>
                          {isMe ? "Tu" : (u.firstName || u.username)}
                        </span>
                      </div>
                      
                      {(() => {
                        function fmtMin(m: number | undefined | null) {
                          if (!m || m === 0) return null;
                          const h = Math.floor(m / 60);
                          const min = m % 60;
                          return h > 0 ? `${h}h ${min}m` : `${min}m`;
                        }

                        let userMinuti = isMe ? Math.max(minLavoro, (u.lavoroOggiMinuti || 0)) : (u.lavoroOggiMinuti || 0);
                        if (isMe && isOnline) {
                           // Sovrascriviamo calcolando i minuti base senza il live, poi gli aggiungiamo il nostro contatore fluido extra
                           userMinuti = userMinuti + liveExtra;
                           // Al momento il valore di u.lavoroOggiMinuti restituito dall'API potrebbe includere già l'ultimo ping. 
                           // L'utente desidera veder avanzare questo specifico valore
                        }

                        const lavoroStr = fmtMin(userMinuti) || fmtMin(Math.round((u.lastSessionDuration || 0))) || "0m";
                        const pausaStr = fmtMin(u.pausaOggiMinuti);

                        let text = "";
                        if (isOnline) {
                          text = `Lavoro: ${lavoroStr}`;
                        } else if (isPausa) {
                          text = `Pausa: ${pausaStr || "0m"} · Lavoro: ${lavoroStr}`;
                        } else {
                          let uscitaStr = "Uscito Mai";
                          if (u.lastSeenAt) {
                            const lastSeen = new Date(u.lastSeenAt);
                            const oggi = new Date();
                            const isOggi = lastSeen.toDateString() === oggi.toDateString();
                            
                            uscitaStr = isOggi
                              ? 'Uscito ' + lastSeen.toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'})
                              : 'Uscito ' + lastSeen.toLocaleDateString('it-IT', {day:'2-digit', month:'2-digit'}) + ' ' + lastSeen.toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'});
                          }
                          text = `${uscitaStr} · Lavoro: ${lavoroStr}`;
                        }

                        return (
                          <span className={`text-[9px] shrink-0 ${isOnline ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                            {text}
                          </span>
                        );
                      })()}
                    </div>

                  );
                })}
              </div>
            </div>
          );
        })()}

        {user && (
          <div className="mt-2 bg-slate-50 border border-sidebar-border rounded-lg shadow-sm overflow-hidden flex-shrink-0">
            {!isInsegnante && latestActivity && (
              <div className="px-3 pt-2 pb-1.5 text-[9px] text-muted-foreground/80 leading-tight space-y-1 select-none bg-white/50 border-b border-sidebar-border/50">
                <p className="flex justify-between items-center text-[8.5px]">
                  <span className="opacity-80">Aggiornato:</span>
                  <span className="font-medium text-slate-400 font-mono opacity-80">{new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(__BUILD_DATE__))}</span>
                </p>
                <p className="flex justify-between items-center text-[8.5px]">
                  <span className="opacity-80">Da/Azione:</span>
                  <span className="font-medium text-slate-400 opacity-80 truncate max-w-[100px] text-right" title={`Di: ${latestActivity.user?.username} / Sys: v${__APP_VERSION__}`}>
                    {latestActivity.user?.firstName || latestActivity.user?.username || "Sys"} (v{__APP_VERSION__})
                  </span>
                </p>
              </div>
            )}

            <div className="px-2 py-1.5 flex items-center justify-between gap-2">
              <UserProfileDialog>
                <div className="flex items-center gap-2 min-w-0 cursor-pointer hover:bg-slate-200/50 p-1 rounded-md transition-colors flex-1">
                  <div className="w-6 h-6 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0 border border-slate-300 shadow-sm overflow-hidden">
                    {user.profileImageUrl ? (
                      <img src={user.profileImageUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-primary">
                        {user.firstName ? user.firstName[0] : (user.username ? user.username[0].toUpperCase() : "?")}
                        {user.lastName ? user.lastName[0] : ""}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-sidebar-foreground truncate group-hover:text-primary leading-tight">
                      {user.firstName || user.lastName
                        ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                        : user.username}
                    </p>
                    <p className="text-[8px] text-muted-foreground truncate uppercase tracking-widest font-bold">
                      {(() => {
                        switch (user.role?.toLowerCase()) {
                          case 'admin': return 'MASTER';
                          case 'super admin': return 'SUPER ADMIN';
                          case 'operator': return 'OPERATORE';
                          case 'direttivo': return 'DIRETTIVO';
                          case 'back-office': return 'BACK OFFICE';
                          case 'front-desk': return 'FRONT DESK';
                          case 'insegnante': return 'INSEGNANTE';
                          case 'dipendente': return 'DIPENDENTE';
                          default: return user.role?.toUpperCase() || 'SCONOSCIUTO';
                        }
                      })()}
                    </p>
                  </div>
                </div>
              </UserProfileDialog>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
                className="flex-shrink-0 h-7 w-7 rounded-md hover:bg-red-100 hover:text-red-700 bg-white border border-slate-200 shadow-sm"
                title="Scollegati"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
