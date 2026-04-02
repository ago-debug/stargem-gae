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
  Trash2,
  ChevronRight,
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
import { getActiveActivities } from "@/config/activities";
import { Button } from "@/components/ui/button";
import { StarGemCopilot } from "@/components/star-gem-copilot";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

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
    title: "Categorie Attività",
    url: "/categorie-attivita",
    icon: FolderTree,
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
    title: "Staff e Insegnanti",
    url: "/staff",
    icon: Briefcase,
  },
  {
    title: "Inserisci Nota",
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
const configItems = [
  {
    title: "Listini e Quote",
    url: "/listini",
    icon: Database,
  },
  {
    title: "Promo / Sconti",
    url: "/promo-sconti",
    icon: Ticket,
  },
];

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

  return (
    <Sidebar>
      <SidebarHeader className="p-0 border-b border-sidebar-border flex items-center justify-center h-10 overflow-hidden">
        <Link href="/" className="cursor-pointer block flex items-center justify-center h-full">
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
                    <Link href="/copilot" className="flex items-center gap-2 px-2 py-1.5 w-full justify-start cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground">
                      <StarGemCopilot className="h-4 w-4 bg-transparent outline-none ring-0 shadow-none border-0 p-0" />
                      <span className="text-sm font-medium">StarGem Copilot</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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
