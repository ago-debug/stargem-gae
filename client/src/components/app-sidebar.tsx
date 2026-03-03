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
} from "lucide-react";
import { useLocation, Link } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { StarGemCopilot } from "@/components/star-gem-copilot";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

const registrationItems = [
  {
    title: "Maschera Input",
    url: "/",
    icon: Users,
  },
  {
    title: "Anagrafica a Lista",
    url: "/anagrafica_a_lista",
    icon: Users,
  },
  {
    title: "Attività",
    url: "/attivita",
    icon: Activity,
  },
  {
    title: "Iscritti per Attività",
    url: "/iscritti_per_attivita",
    icon: Activity,
  },
];

const teachingItems = [
  /*
  {
    title: "Corsi",
    url: "/corsi",
    icon: Calendar,
  },
  */
  {
    title: "Calendario Corsi",
    url: "/calendario",
    icon: CalendarFold,
  },
  /*
  {
    title: "Workshops",
    url: "/workshops",
    icon: Sparkles,
  },
  */
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
  {
    title: "Prenotazioni Sale",
    url: "/prenotazioni-sale",
    icon: CalendarFold,
  },
  {
    title: "Planning",
    url: "/planning",
    icon: CalendarRange,
  },
  {
    title: "Date/Programmazione",
    url: "/programmazione",
    icon: Clock,
  },
  {
    title: "Servizi Prenotabili",
    url: "/booking-services",
    icon: Sparkles,
  },
];

const secretariatItems = [
  {
    title: "Staff/Insegnanti",
    url: "/insegnanti",
    icon: Briefcase,
  },
  {
    title: "Tessere & Certificati",
    url: "/tessere",
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
    icon: ScanBarcode,
  },
  {
    title: "Commenti Team",
    url: "/commenti",
    icon: MessageSquarePlus,
  },
  {
    title: "Inserisci Nota",
    url: "/inserisci-nota",
    icon: StickyNote,
  },
  {
    title: "Knowledge",
    url: "/knowledge-base",
    icon: BookOpen,
  },
  {
    title: "ToDoList",
    url: "/todo-list",
    icon: FileText,
  },
];

const analysisItems = [
  {
    title: "Dashboard Statistiche",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Report & Statistiche",
    url: "/report",
    icon: BarChart3,
  },
];

const accountingItems = [
  {
    title: "Scheda Contabile",
    url: "/scheda-contabile",
    icon: Wallet,
  },
  {
    title: "Lista Pagamenti",
    url: "/pagamenti",
    icon: CreditCard,
  },
];

const configItems = [
  {
    title: "Elenchi",
    url: "/elenchi",
    icon: List, // Si potrebbe usare una matitina ma la list va bene. O custom class.
  },
  {
    title: "Quote/Listini",
    url: "/listini-old",
    icon: Database,
  },
  {
    title: "Listini (V. Precedente)",
    url: "/listini",
    icon: Database,
  },
  {
    title: "Categorie Attività",
    url: "/categorie-attivita",
    icon: Layers,
  },
  {
    title: "Categoria Partecipante",
    url: "/categoria-partecipante",
    icon: UserPlus,
  },
  {
    title: "Promo/Codici Sconto",
    url: "/promo-sconti",
    icon: Ticket,
  },
];


const adminItems = [
  {
    title: "Pannello Admin",
    url: "/admin",
    icon: ShieldCheck,
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
    title: "Reset Stagione",
    url: "/reset-stagione",
    icon: RotateCcw,
  },
];

import { hasPermission } from "@/App";

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

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

  const filteredRegistration = registrationItems.filter(item => hasPermission(user, item.url));
  const filteredTeaching = teachingItems.filter(item => hasPermission(user, item.url));
  const filteredSecretariat = secretariatItems.filter(item => hasPermission(user, item.url));
  const filteredAnalysis = analysisItems.filter(item => hasPermission(user, item.url));
  const filteredAccounting = accountingItems.filter(item => hasPermission(user, item.url));
  const filteredConfig = configItems.filter(item => hasPermission(user, item.url));
  const filteredAdminItems = adminItems.filter(item => hasPermission(user, item.url));

  return (
    <Sidebar>
      <SidebarHeader className="p-0 border-b border-sidebar-border flex items-center justify-center h-10 overflow-hidden">
        <Link href="/maschera-input" className="cursor-pointer block flex items-center justify-center h-full">
          <img
            src="/logo_stargem.png"
            alt="StarGem"
            className="h-16 w-auto object-contain mix-blend-multiply hover:opacity-90 transition-transform scale-125"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {filteredRegistration.length > 0 && (
          <SidebarGroup>
            {/* <SidebarGroupLabel className="text-primary font-semibold uppercase tracking-wider text-[11px]">Gestione Anagrafica</SidebarGroupLabel> */}
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredRegistration.map((item) => {
                  const isActive = location === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        data-testid={`nav-${item.url.slice(1) || 'anagrafica'}`}
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
            <SidebarGroupLabel className="text-primary font-semibold uppercase tracking-wider text-[11px]">Didattica e Sale</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredTeaching.map((item) => {
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

        {filteredSecretariat.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary font-semibold uppercase tracking-wider text-[11px]">Segreteria</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <div className="flex items-center gap-2 px-2 py-1.5 w-full justify-start cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground">
                      <StarGemCopilot className="h-4 w-4 bg-transparent outline-none ring-0 shadow-none border-0 p-0" />
                      {/* The StarGemCopilot component itself contains the dropdown structure. 
                           It defaults to just showing the icon. To make "StarGem CoPilot" text visible and clickable alongside it,
                           we apply some styling. */}
                      <span className="text-sm font-medium">StarGem CoPilot</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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

        {filteredAnalysis.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary font-semibold uppercase tracking-wider text-[11px]">Analisi e Report</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAnalysis.map((item) => {
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
            <SidebarGroupLabel className="text-primary font-semibold uppercase tracking-wider text-[11px]">Contabilità</SidebarGroupLabel>
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

        {filteredConfig.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary font-semibold uppercase tracking-wider text-[11px]">Configurazione</SidebarGroupLabel>
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
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {user && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0 border border-sidebar-border">
                <span className="text-xs font-bold text-primary">
                  {user.firstName ? user.firstName[0] : (user.username ? user.username[0].toUpperCase() : "?")}
                  {user.lastName ? user.lastName[0] : ""}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">
                  {user.firstName || user.lastName
                    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                    : user.username}
                </p>
                <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider font-medium">
                  {user.role}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
              className="flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
        {latestActivity && (
          <div className="mt-4 pt-4 border-t border-sidebar-border text-[10px] text-muted-foreground/80 leading-tight space-y-1 select-none">
            <p className="flex justify-between">
              <span>Aggiornato:</span>
              <span className="font-medium">{new Date(latestActivity.createdAt).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            </p>
            <p className="flex justify-between">
              <span>Da chi:</span>
              <span className="font-medium truncate max-w-[100px] text-right">
                {latestActivity.user?.firstName || latestActivity.user?.lastName
                  ? `${latestActivity.user.firstName || ""} ${latestActivity.user.lastName || ""}`.trim()
                  : latestActivity.user?.username || "Sistema"}
              </span>
            </p>
            <p className="flex justify-between">
              <span>Versione:</span>
              <span className="font-medium truncate max-w-[100px] text-right" title={`${latestActivity.action} ${latestActivity.entityType} #${latestActivity.entityId}`}>
                {latestActivity.action} {latestActivity.entityType}
              </span>
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
