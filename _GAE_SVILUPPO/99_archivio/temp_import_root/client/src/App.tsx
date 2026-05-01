import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { User as SelectUser } from "@shared/schema";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Members from "@/pages/members";
import Courses from "@/pages/courses";
import Workshops from "@/pages/workshops";
import CourseEnrollments from "@/pages/course-enrollments";
import Categories from "@/pages/categories";
import ClientCategories from "@/pages/client-categories";
import Instructors from "@/pages/instructors";
import PaymentMethods from "@/pages/payment-methods";
import Studios from "@/pages/studios";
import Memberships from "@/pages/memberships";
import Payments from "@/pages/payments";
import AccessControl from "@/pages/access-control";
import Reports from "@/pages/reports";
import ImportData from "@/pages/import-data";
import UtentiPermessi from "@/pages/utenti-permessi";
import ResetStagione from "@/pages/reset-stagione";
import MemberDashboard from "@/pages/member-dashboard";
import AnagraficaHome from "@/pages/anagrafica-home";
import TestGae from "@/pages/test-gae";
import CardGenerator from "@/pages/card-generator";
import AdminPanel from "@/pages/admin-panel";
import CalendarPage from "@/pages/calendar";
import BookingServices from "@/pages/booking-services";
import StudioBookings from "@/pages/studio-bookings";
import AccountingSheet from "@/pages/accounting-sheet";
import logoStudioGem from "@assets/logo-Studio-Gem1_page-0001_1761599206626.jpg";

export function hasPermission(user: SelectUser | null, path: string) {
  if (!user) return false;
  if (user.role === 'admin') return true;
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
  if (user.role === 'admin') return true;
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

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={AnagraficaHome} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/iscritti" component={Members} />
      <ProtectedRoute path="/corsi" component={Courses} />
      <ProtectedRoute path="/workshops" component={Workshops} />
      <ProtectedRoute path="/iscritti-corsi" component={CourseEnrollments} />
      <ProtectedRoute path="/calendario" component={CalendarPage} />
      <ProtectedRoute path="/categorie" component={Categories} />
      <ProtectedRoute path="/categorie-clienti" component={ClientCategories} />
      <ProtectedRoute path="/metodi-pagamento" component={PaymentMethods} />
      <ProtectedRoute path="/insegnanti" component={Instructors} />
      <ProtectedRoute path="/studios" component={Studios} />
      <ProtectedRoute path="/tessere" component={Memberships} />
      <ProtectedRoute path="/pagamenti" component={Payments} />
      <ProtectedRoute path="/accessi" component={AccessControl} />
      <ProtectedRoute path="/report" component={Reports} />
      <ProtectedRoute path="/importa" component={ImportData} />
      <ProtectedRoute path="/utenti-permessi" component={UtentiPermessi} />
      <ProtectedRoute path="/reset-stagione" component={ResetStagione} />
      <ProtectedRoute path="/membro/:id" component={MemberDashboard} />
      <ProtectedRoute path="/test-gae" component={TestGae} />
      <ProtectedRoute path="/generazione-tessere" component={CardGenerator} />
      <ProtectedRoute path="/admin" component={AdminPanel} />
      <ProtectedRoute path="/booking-services" component={BookingServices} />
      <ProtectedRoute path="/prenotazioni-sale" component={StudioBookings} />
      <ProtectedRoute path="/scheda-contabile" component={AccountingSheet} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();
  const isMobile = useIsMobile();

  // Custom sidebar width
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <SidebarProvider style={style as React.CSSProperties} defaultOpen={!isMobile}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-background flex-shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <img
              src={logoStudioGem}
              alt="Studio Gem Logo"
              className="h-8"
              data-testid="logo-header"
            />
          </header>
          <main className="flex-1 overflow-auto bg-background">
            <Router />
          </main>
        </div>
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
