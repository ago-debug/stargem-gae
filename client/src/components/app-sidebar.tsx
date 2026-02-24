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

const registrationItems = [
  {
    title: "Maschera Input",
    url: "/maschera-generale",
    icon: Users,
  },
  {
    title: "Anagrafica",
    url: "/",
    icon: Users,
  },
  {
    title: "Lista Iscritti",
    url: "/iscritti",
    icon: Users,
  },
  {
    title: "Attività",
    url: "/attivita",
    icon: Activity,
  },
];

const teachingItems = [
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
    title: "Workshops",
    url: "/workshops",
    icon: Sparkles,
  },
  {
    title: "Studios/Sale",
    url: "/studios",
    icon: Building2,
  },
  {
    title: "Prenotazioni Sale",
    url: "/prenotazioni-sale",
    icon: CalendarFold,
  },
];

const secretariatItems = [
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
  {
    title: "test Gae",
    url: "/test-gae",
    icon: Settings,
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
  {
    title: "Quote/Listini",
    url: "/listini",
    icon: Database,
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

  const filteredRegistration = registrationItems.filter(item => hasPermission(user, item.url));
  const filteredTeaching = teachingItems.filter(item => hasPermission(user, item.url));
  const filteredSecretariat = secretariatItems.filter(item => hasPermission(user, item.url));
  const filteredAnalysis = analysisItems.filter(item => hasPermission(user, item.url));
  const filteredAccounting = accountingItems.filter(item => hasPermission(user, item.url));
  const filteredConfig = configItems.filter(item => hasPermission(user, item.url));
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
        {filteredRegistration.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary font-semibold uppercase tracking-wider text-[11px]">Gestione Anagrafica</SidebarGroupLabel>
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
      </SidebarFooter>
    </Sidebar>
  );
}
