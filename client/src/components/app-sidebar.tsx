import {
  LayoutDashboard,
  Users,
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
  CheckSquare,
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
import { useAuth } from "@/hooks/useAuth";

const mainMenuItems = [
  {
    title: "Anagrafica",
    url: "/",
    icon: Users,
  },
  {
    title: "Dashboard Statistiche",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Partecipanti/Lista",
    url: "/iscritti",
    icon: Users,
  },
  {
    title: "Gestione",
    url: "/gestione",
    icon: Activity,
  },
  {
    title: "Iscritti per Corso",
    url: "/iscritti-corsi",
    icon: GraduationCap,
  },
  {
    title: "Staff/Insegnanti",
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
    title: "Pagamenti",
    url: "/pagamenti",
    icon: CreditCard,
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
];

const draftItems = [
  {
    title: "Maschera Input Generale",
    url: "/maschera-input-generale",
    icon: Settings,
  },
  {
    title: "Attività",
    url: "/attivita",
    icon: Activity,
  },
  {
    title: "Elenchi",
    url: "/elenchi",
    icon: Settings,
  },
  {
    title: "Quote/Listini",
    url: "/quote-listini",
    icon: Settings,
  },
  {
    title: "Promo/Codici Sconto",
    url: "/promo-codici-sconto",
    icon: Settings,
  },
  {
    title: "Date/Programmazione",
    url: "/date-programmazione",
    icon: Settings,
  },
  {
    title: "Planning",
    url: "/planning",
    icon: Settings,
  },
  {
    title: "Schede Iscrizioni",
    url: "/schede-iscrizioni",
    icon: Settings,
  },
  {
    title: "Affitto Studio Medico",
    url: "/test3-gae",
    icon: Settings,
  },
  {
    title: "Knowledge",
    url: "/knowledge",
    icon: Settings,
  },
];

const commonTablesItems = [
  {
    title: "Cose da Fare",
    url: "/todo-list",
    icon: CheckSquare,
  },
  {
    title: "Categorie Attività",
    url: "/categorie-attivita",
    icon: FolderTree,
  },
  {
    title: "Categoria Partecipante",
    url: "/categorie-clienti",
    icon: Tags,
  },
  {
    title: "Tipi di Pagamento",
    url: "/tipi-pagamento",
    icon: Wallet,
  },
];

const adminUtilsItems = [
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

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <a href="/" className="text-lg font-semibold text-sidebar-foreground cursor-pointer" data-testid="link-landing">
          Gestionale StarGEM
        </a>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-b border-amber-300 dark:border-amber-700 rounded px-2 py-1">
            Bozze
          </SidebarGroupLabel>
          <SidebarGroupContent className="bg-amber-50 dark:bg-amber-900/10">
            <SidebarMenu>
              {draftItems.map((item) => {
                const isActive = item.url === "/attivita"
                  ? location === "/attivita" || location.startsWith("/attivita/")
                  : location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      data-testid={`nav-${item.url.slice(1)}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4 sidebar-icon-gold" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-b border-amber-300 dark:border-amber-700 rounded px-2 py-1">
            Tabelle Comuni
          </SidebarGroupLabel>
          <SidebarGroupContent className="bg-amber-50 dark:bg-amber-900/10">
            <SidebarMenu>
              {commonTablesItems.map((item) => {
                const isActive = item.url === "/categorie-attivita"
                  ? location === item.url || location.startsWith("/categorie") && location !== "/categorie-clienti"
                  : location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      data-testid={`nav-${item.url.slice(1)}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4 sidebar-icon-gold" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Menu Principale</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => {
                const isActive = item.url === "/gestione"
                  ? location === "/gestione" || location.startsWith("/gestione/")
                  : location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      data-testid={`nav-${item.url.slice(1) || 'dashboard'}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4 sidebar-icon-gold" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Admin - Utils</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminUtilsItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      data-testid={`nav-${item.url.slice(1)}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4 sidebar-icon-gold" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {user && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-sidebar-accent-foreground">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.firstName} {user.lastName}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => window.location.href = '/api/logout'}
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
