import { Switch, Route, Redirect, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TeoCopilot } from "@/components/teo-copilot";
import { useCopilot } from "@/hooks/use-copilot";
import { Button } from "@/components/ui/button";
import { Sparkles, Bot } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { User as SelectUser } from "@shared/schema";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth-page";
import FirstLogin from "@/pages/first-login";
import ForgotPassword from "@/pages/forgot-password";
import Dashboard from "@/pages/dashboard";
import Members from "@/pages/members";
import Courses from "@/pages/courses";
import Workshops from "@/pages/workshops";
import Categories from "@/pages/categories";
import Studios from "@/pages/studios";
import Memberships from "@/pages/memberships";
import GemTeam from "@/pages/gemteam";
import GemTeamMe from "@/pages/gemteam-me";
import Payments from "@/pages/payments";
import AccessControl from "@/pages/access-control";
import Reports from "@/pages/reports";
import ImportData from "@/pages/import-data";
import UtentiPermessi from "@/pages/utenti-permessi";
import ResetStagione from "@/pages/reset-stagione";
import AuditLogs from "@/pages/audit-logs";
import MemberDashboard from "@/pages/member-dashboard";
import AnagraficaHome from "@/pages/anagrafica-home";
import CardGenerator from "@/pages/card-generator";
import AdminPanel from "@/pages/admin-panel";
import CalendarPage from "@/pages/calendar";
import BookingServiceCategories from "@/pages/booking-service-categories";
import BookingServices from "@/pages/booking-services";
import StudioBookings from "@/pages/studio-bookings";
import AccountingSheet from "@/pages/accounting-sheet";
import MascheraInputGenerale from "@/pages/maschera-input-generale";
import GestioneAttivitaStub from "@/pages/gestione-attivita-stub";
import IscrizioniPagamenti from "@/pages/iscrizioni-pagamenti";
import PriceLists from "@/pages/listini";
import ListiniHome from "@/pages/listini-home";
import QuoteListini from "@/pages/quote-listini";
import QuotePromo from "@/pages/quote-promo";
import WebhookStatus from "@/pages/webhook-status";
import WcMapping from "@/pages/wc-mapping";
import Attivita from "@/pages/attivita";
import IscrittiPerAttivita from "@/pages/iscritti_per_attivita";
import Elenchi from "@/pages/elenchi";
import TodoList from "@/pages/todo-list";
import Commenti from "@/pages/commenti";
import SchedaCorso from "@/pages/scheda-corso";
import SchedaWorkshop from "@/pages/scheda-workshop";
import SchedaDomenica from "@/pages/scheda-domenica";
import SchedaAllenamento from "@/pages/scheda-allenamento";
import SchedaLezioneIndividuale from "@/pages/scheda-lezione-individuale";
import SchedaCampus from "@/pages/scheda-campus";
import SchedaSaggio from "@/pages/scheda-saggio";
import SchedaVacanzaStudio from "@/pages/scheda-vacanza-studio";
import Planning from "@/pages/planning";
import GemPass from "@/pages/gempass";
import GemStaff from "@/pages/gemstaff";
import GemStaffMe from "@/pages/gemstaff-me";
import AreaTesserati from "@/pages/area-tesserati";
import StrategicProgrammingTable from "@/pages/StrategicProgrammingTable";
import KnowledgeBase from "@/pages/knowledge-base";
import GestioneNote from "@/pages/gestione-note";

import SundayActivities from "@/pages/sunday-activities";
import Trainings from "@/pages/trainings";
import IndividualLessons from "@/pages/individual-lessons";
import CampusActivities from "@/pages/campus-activities";
import Recitals from "@/pages/recitals";
import VacationStudies from "@/pages/vacation-studies";

import CampusCategories from "@/pages/campus-categories";
import VacationCategories from "@/pages/vacation-categories";
import RentalsCategories from "@/pages/rentals-categories";
import MerchandisingCategories from "@/pages/merchandising-categories";

import { NotificationCenter } from "@/components/notification-center";
import { GemChatBadge } from "@/components/gem-chat-badge";
import { TodoNotification } from "@/components/todo-notification";
import { PageNotesIndicator } from "@/components/page-notes-indicator";
import { PageNotesOverlay } from "@/components/page-notes-overlay";
import { ActiveUserAvatars } from "@/components/active-user-avatars";
import { UserPresenceTracker } from "@/components/user-presence-tracker";
const logoStarGem = "/logo_stargem.png";

export function hasPermission(user: SelectUser | null, path: string) {
  if (!user) return false;
  const roleNameLower = user.role?.toLowerCase() || '';
  if (roleNameLower === 'admin' || roleNameLower === 'amministratore totale' || roleNameLower === 'super admin' || roleNameLower === 'master') return true;
  
  if (path === "/" || path === "/dashboard") return true;

  if (roleNameLower === 'insegnante' && (path === "/gemstaff/me" || path === "/first-login" || path === "/forgot-password")) {
    return true;
  }

  if (roleNameLower === 'dipendente' && (path === "/gemteam/me" || path === "/first-login" || path === "/forgot-password")) {
    return true;
  }

  if (roleNameLower === 'client' && (path === '/area-tesserati' || path === '/first-login' || path === '/forgot-password')) {
    return true;
  }

  const perms = (user as any).permissions || {};
  if (perms["*"] === "write" || perms["*"] === "read") return true;

  // Check direct match
  if (perms[path] === "read" || perms[path] === "write") return true;

  // Check parent path match (e.g. /membro/1 matches /membro)
  const segments = path.split('/').filter(Boolean);
  if (segments.length > 0) {
    const parentPath = `/${segments[0]}`;
    if (perms[parentPath] === "read" || perms[parentPath] === "write") return true;
  }

  return false;
}

export function hasWritePermission(user: SelectUser | null, path: string) {
  if (!user) return false;
  const roleNameLower = user.role?.toLowerCase() || '';
  if (roleNameLower === 'admin' || roleNameLower === 'amministratore totale' || roleNameLower === 'super admin' || roleNameLower === 'master') return true;
  
  const perms = (user as any).permissions || {};
  if (perms["*"] === "write") return true;

  if (perms[path] === "write") return true;

  const segments = path.split('/').filter(Boolean);
  if (segments.length > 0) {
    const parentPath = `/${segments[0]}`;
    if (perms[parentPath] === "write") return true;
  }

  return false;
}

function ProtectedRoute({ path, component: Component }: { path: string, component: any }) {
  const { user } = useAuth();

  return (
    <Route path={path}>
      {(params) => hasPermission(user, path) ? <Component params={params} /> : <NotFound />}
    </Route>
  );
}

const StubPlanning = () => <GestioneAttivitaStub title="Planning" description="La sezione Planning è in fase di realizzazione o manutenzione." />;
const StubAttivitaLista = () => <GestioneAttivitaStub title="Attività a Lista" description="Visualizzazione alternativa delle attività in fase di sviluppo." />;
const StubAffittoStudio = () => <GestioneAttivitaStub title="Affitto Studio Medico" description="Modulo di gestione affitto studi medici in arrivo." />;
const StubCopilot = () => <GestioneAttivitaStub title="TeoCopilot" description="Pannello di controllo dell'assistente AI in costruzione." />;
const StubPromoSconti = () => <GestioneAttivitaStub title="Promo e Sconti" description="Motore di gestione regole promozionali in sviluppo." />;
const StubMerchandising = () => <GestioneAttivitaStub title="Merchandising" description="Modulo di gestione e vendita merchandising in arrivo." />;
const StubCategorieMerchandising = () => <GestioneAttivitaStub title="Categorie Merchandising" description="Gestione categorie per articoli di merchandising in sviluppo." />;

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/maschera-input" component={MascheraInputGenerale} />
      <Route path="/maschera-input-generale">
        <Redirect to="/maschera-input" />
      </Route>
      <ProtectedRoute path="/anagrafica-generale" component={Members} />
      <ProtectedRoute path="/inserisci-nota" component={GestioneNote} />
      <Route path="/corsi">
        <Redirect to="/attivita/corsi" />
      </Route>
      <Route path="/workshops">
        <Redirect to="/attivita/workshops" />
      </Route>
      <Route path="/tessere">
        <Redirect to="/tessere-certificati" />
      </Route>
      <ProtectedRoute path="/calendario-attivita" component={CalendarPage} />
      <ProtectedRoute path="/planning" component={Planning} />
      <ProtectedRoute path="/programmazione-date" component={StrategicProgrammingTable} />
      <ProtectedRoute path="/attivita-a-lista" component={StubAttivitaLista} />
      <Route path="/staff">
        <Redirect to="/gemstaff" />
      </Route>
      <ProtectedRoute path="/studios" component={Studios} />
      <ProtectedRoute path="/affitto-studio" component={StubAffittoStudio} />
      <ProtectedRoute path="/tessere-certificati" component={Memberships} />
      <ProtectedRoute path="/pagamenti" component={Payments} />
      <ProtectedRoute path="/accessi" component={AccessControl} />
      <ProtectedRoute path="/report" component={Reports} />
      <ProtectedRoute path="/importa" component={ImportData} />
      <ProtectedRoute path="/utenti-permessi" component={UtentiPermessi} />
      <ProtectedRoute path="/reset-stagione" component={ResetStagione} />
      <ProtectedRoute path="/audit-logs" component={AuditLogs} />
      <ProtectedRoute path="/membro/:id" component={MemberDashboard} />
      <ProtectedRoute path="/gempass" component={GemPass} />
      <ProtectedRoute path="/gemstaff" component={GemStaff} />
      <ProtectedRoute path="/gemstaff/me" component={GemStaffMe} />
      <ProtectedRoute path="/gemteam" component={GemTeam} />
      <ProtectedRoute path="/gemteam/me" component={GemTeamMe} />
      <ProtectedRoute path="/area-tesserati" component={AreaTesserati} />
      <ProtectedRoute path="/generazione-tessere" component={CardGenerator} />
      <ProtectedRoute path="/admin" component={AdminPanel} />
      <ProtectedRoute path="/copilot" component={StubCopilot} />
      <ProtectedRoute path="/booking-services" component={BookingServices} />
      <ProtectedRoute path="/attivita/affitti" component={StudioBookings} />
      <ProtectedRoute path="/scheda-contabile" component={AccountingSheet} />
      <ProtectedRoute path="/iscrizioni-pagamenti" component={IscrizioniPagamenti} />
      <ProtectedRoute path="/iscritti_per_attivita" component={IscrittiPerAttivita} />
      <ProtectedRoute path="/attivita" component={Attivita} />
      <ProtectedRoute path="/categorie-corsi" component={Categories} />
      <ProtectedRoute path="/categorie-affitti" component={RentalsCategories} />
      <ProtectedRoute path="/categorie-campus" component={CampusCategories} />
      <ProtectedRoute path="/categorie-vacanze-studio" component={VacationCategories} />
      <ProtectedRoute path="/categorie-eventi-esterni" component={BookingServiceCategories} />
      <ProtectedRoute path="/categorie-merchandising" component={MerchandisingCategories} />
      <Route path="/promo-sconti"><Redirect to="/quote-promo" /></Route>
      <ProtectedRoute path="/quote-promo" component={QuotePromo} />
      <ProtectedRoute path="/webhook-status" component={WebhookStatus} />
      <ProtectedRoute path="/wc-mapping" component={WcMapping} />
      <ProtectedRoute path="/scheda-corso" component={SchedaCorso} />
      <ProtectedRoute path="/scheda-workshop" component={SchedaWorkshop} />
      <ProtectedRoute path="/scheda-domenica" component={SchedaDomenica} />
      <ProtectedRoute path="/scheda-allenamento" component={SchedaAllenamento} />
      <ProtectedRoute path="/scheda-lezione-individuale" component={SchedaLezioneIndividuale} />
      <ProtectedRoute path="/scheda-campus" component={SchedaCampus} />
      <ProtectedRoute path="/scheda-saggio" component={SchedaSaggio} />
      <ProtectedRoute path="/scheda-vacanza-studio" component={SchedaVacanzaStudio} />
      <ProtectedRoute path="/attivita/corsi" component={Courses} />
      <ProtectedRoute path="/attivita/workshops" component={Workshops} />
      <ProtectedRoute path="/attivita/domeniche-movimento" component={SundayActivities} />
      <ProtectedRoute path="/attivita/allenamenti" component={Trainings} />
      <ProtectedRoute path="/attivita/lezioni-individuali" component={IndividualLessons} />
      <ProtectedRoute path="/attivita/campus" component={CampusActivities} />
      <ProtectedRoute path="/attivita/saggi" component={Recitals} />
      <ProtectedRoute path="/attivita/vacanze-studio" component={VacationStudies} />
      <ProtectedRoute path="/attivita/servizi" component={BookingServices} />
      <ProtectedRoute path="/attivita/merchandising" component={StubMerchandising} />

      <ProtectedRoute path="/quote-listini/:activityType" component={QuoteListini} />
      <Route path="/listini-old"><Redirect to="/quote-promo" /></Route>
      <Route path="/listini-home"><Redirect to="/quote-promo" /></Route>
      <Route path="/listini"><Redirect to="/quote-promo" /></Route>
      <Route path="/listini-base/:activityType"><Redirect to="/quote-promo" /></Route>
      <ProtectedRoute path="/elenchi" component={Elenchi} />
      <ProtectedRoute path="/todo-list" component={TodoList} />
      <ProtectedRoute path="/knowledge-base" component={KnowledgeBase} />
      <ProtectedRoute path="/commenti" component={Commenti} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, isLoading, logoutMutation } = useAuth();
  const isMobile = useIsMobile();
  const isInsegnante = (user as any)?.role === 'insegnante';

  // Custom sidebar width
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const [matchFirstLogin] = useRoute("/first-login");
  const [matchForgotPassword] = useRoute("/forgot-password");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (matchFirstLogin) {
    return <FirstLogin />;
  }

  if (matchForgotPassword) {
    return <ForgotPassword />;
  }

  if (!user) {
    return <AuthPage />;
  }

  const isClient = user?.role?.toLowerCase() === 'client';

  if (isClient) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="flex items-center justify-between h-14 px-6 border-b bg-white shadow-sm">
          <img src={logoStarGem} alt="Studio Gem" className="h-8" />
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-muted-foreground">
              {user.firstName || user.username}
            </span>
            <Button variant="ghost" size="sm" onClick={() => logoutMutation.mutate()}>
              Esci
            </Button>
          </div>
        </header>
        <main className="flex-1 bg-slate-50">
          <Router />
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider style={style as React.CSSProperties} defaultOpen={!isMobile}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between h-10 px-4 border-b border-border bg-background flex-shrink-0 z-20">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-6 h-full">
              {!isInsegnante && <ActiveUserAvatars />}
              <div className="flex items-center gap-4">
                <div 
                   title="Apri TeoCopilot (Ctrl+Space)" 
                   onClick={() => useCopilot.getState().openCopilot()} 
                   className="relative cursor-pointer hover:opacity-80 transition-opacity active:scale-95"
                >
                   <Avatar className="h-9 w-9 border-2 border-primary/20 shadow-sm">
                      <AvatarImage src="/assets/teo-head-new.png" alt="Teo Copilot" className="object-cover bg-white" />
                      <AvatarFallback className="bg-primary text-white"><Bot className="w-4 h-4" /></AvatarFallback>
                   </Avatar>
                </div>
                {!isInsegnante && (
                  <>
                    <GemChatBadge />
                    <PageNotesIndicator />
                    <TodoNotification />
                    <NotificationCenter />
                  </>
                )}
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background relative">
            <UserPresenceTracker />
            <PageNotesOverlay />
            <Router />
          </main>
        </div>
        <TeoCopilot />
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
