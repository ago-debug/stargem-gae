import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Members from "@/pages/members";
import Courses from "@/pages/courses";
import CourseEnrollments from "@/pages/course-enrollments";
import Categories from "@/pages/categories";
import ClientCategories from "@/pages/client-categories";
import Instructors from "@/pages/instructors";
import Studios from "@/pages/studios";
import Memberships from "@/pages/memberships";
import Payments from "@/pages/payments";
import AccessControl from "@/pages/access-control";
import Reports from "@/pages/reports";
import ImportData from "@/pages/import-data";
import UtentiPermessi from "@/pages/utenti-permessi";
import ResetStagione from "@/pages/reset-stagione";
import MemberDashboard from "@/pages/member-dashboard";
import logoStudioGem from "@assets/logo-Studio-Gem1_page-0001_1761599206626.jpg";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/iscritti" component={Members} />
      <Route path="/corsi" component={Courses} />
      <Route path="/iscritti-corsi" component={CourseEnrollments} />
      <Route path="/categorie" component={Categories} />
      <Route path="/categorie-clienti" component={ClientCategories} />
      <Route path="/insegnanti" component={Instructors} />
      <Route path="/studios" component={Studios} />
      <Route path="/tessere" component={Memberships} />
      <Route path="/pagamenti" component={Payments} />
      <Route path="/accessi" component={AccessControl} />
      <Route path="/report" component={Reports} />
      <Route path="/importa" component={ImportData} />
      <Route path="/utenti-permessi" component={UtentiPermessi} />
      <Route path="/reset-stagione" component={ResetStagione} />
      <Route path="/membro/:id" component={MemberDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  // Custom sidebar width
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (isLoading || !isAuthenticated) {
    return (
      <>
        <Router />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <SidebarProvider style={style as React.CSSProperties}>
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
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
