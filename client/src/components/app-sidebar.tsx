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
import { useAuth } from "@/hooks/use-auth";

const mainMenuItems = [
  {
    title: "Maschera Input",
    url: "/maschera-generale",
    icon: Users,
  },
  {
    title: "Attività",
    url: "/attivita",
    icon: Activity,
  },
  {
    title: "Dashboard Statistiche",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Lista Iscritti",
    url: "/iscritti",
    icon: Users,
  },
  {
    title: "Corsi",
    url: "/corsi",
    icon: Calendar,
  },
  {
    title: "Calendario Corsi",
    url: "/calendario",
    icon: CalendarFold,
  },
  {
    title: "Prenotazioni Sale",
    url: "/prenotazioni-sale",
    icon: CalendarFold,
  },
  {
    title: "Workshops",
    url: "/workshops",
    icon: Sparkles,
  },
  {
    title: "Iscritti per Corso",
    url: "/iscritti-corsi",
    icon: GraduationCap,
  },
  {
    title: "Insegnanti",
    url: "/insegnanti",
    icon: Briefcase,
  },
  {
    title: "Studios/Sale",
    url: "/studios",
    icon: Building2,
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
    title: "Report & Statistiche",
    url: "/report",
    icon: BarChart3,
  },
  {
    title: "test Gae",
    url: "/test-gae",
    icon: Settings,
  },
];

const commonTablesItems = [
  {
    title: "Categorie Corsi",
    url: "/categorie",
    icon: FolderTree,
  },
  {
    title: "Categorie Clienti",
    url: "/categorie-clienti",
    icon: Tags,
  },
  {
    title: "Metodi di Pagamento",
    url: "/metodi-pagamento",
    icon: Wallet,
  },
  {
    title: "Servizi Prenotabili",
    url: "/booking-services",
    icon: Sparkles,
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

  const filteredMainMenu = mainMenuItems.filter(item => hasPermission(user, item.url));
  const filteredCommonTables = commonTablesItems.filter(item => hasPermission(user, item.url));
  const filteredAdminItems = adminItems.filter(item => hasPermission(user, item.url));

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border flex flex-row items-center gap-3">
        <img src="/logo_stargem.png" alt="StarGem" className="w-8 h-8 object-contain" />
        <h1 className="text-lg font-bold text-sidebar-foreground tracking-tight">
          StarGem
        </h1>
      </SidebarHeader>

      <SidebarContent>
        {filteredMainMenu.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Menu Principale</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredMainMenu.map((item) => {
                  const isActive = location === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        data-testid={`nav-${item.url.slice(1) || 'dashboard'}`}
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

        {accountingItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary font-semibold">Contabilità</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {accountingItems.filter(item => hasPermission(user, item.url)).map((item) => {
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

        {filteredCommonTables.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Tabelle Comuni</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredCommonTables.map((item) => {
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
            <SidebarGroupLabel className="text-primary font-bold">ADMIN / TECNICO</SidebarGroupLabel>
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

        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-bold">Comuni</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/listini"}
                  data-testid="nav-listini"
                >
                  <Link href="/listini">
                    <Database className="w-4 h-4" />
                    <span>Quote/Listini</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
                <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider font-medium flex items-center gap-2">
                  <span>{user.role}</span>
                  <span className="text-[9px] opacity-70 bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">v1.2.2</span>
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
      </SidebarFooter>
    </Sidebar>
  );
}
