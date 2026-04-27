import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, AlertCircle, TrendingUp, ChevronDown, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
const logoStarGem = "/logo_stargem.png";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  if ((user as any)?.role === 'insegnante') {
    setLocation('/gemstaff/me');
    return null;
  }

  interface RevenueMember {
    name: string;
    amount: number;
    count: number;
    userId?: string;
  }

  interface DashboardStats {
    totalMembers: number;
    activeMemberships: number;
    activeCourses: number;
    totalEnrollments: number;
    expiringThisWeek: number;
    monthlyRevenue: number;
    pendingPayments: number;
    revenueByMember?: RevenueMember[];
  }

  interface AlertStats {
    expiringMemberships: number;
    expiredCertificates: number;
    overduePayments: number;
    expiringCourses?: number;
    expiringWorkshops?: number;
  }

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats/dashboard"],
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery<AlertStats>({
    queryKey: ["/api/stats/alerts"],
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery<any[]>({
    queryKey: ["/api/stats/recent-activity"],
  });

  const { data: pendingEnrollments = [], isLoading: pendingLoading } = useQuery<any[]>({
    queryKey: ["/api/enrollments/pending"],
    queryFn: async () => {
      const res = await fetch("/api/enrollments/pending");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    retry: 1
  });

  return (
    <div className="p-6 md:p-8 space-y-8 mx-auto">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Dashboard Segreteria</h1>
        <p className="text-muted-foreground">Panoramica del sistema di gestione corsi</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {statsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totale Iscritti</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalMembers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeMemberships || 0} tessere attive
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Corsi Attivi</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats?.activeCourses || 0}</div>
                  <Link href="/corsi">
                    <Button variant="ghost" size="sm" className="h-8 text-xs">Vedi tutti</Button>
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalEnrollments || 0} iscrizioni totali
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scadenze Settimana</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.expiringThisWeek || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Tessere e certificati
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-emerald-50/20 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <TrendingUp className="h-24 w-24" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-emerald-100 bg-emerald-50/50">
                <CardTitle className="text-sm font-bold text-emerald-800">Incasso Globale (Mese)</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-end gap-2 mb-4">
                  <div className="text-3xl font-extrabold text-emerald-700">
                    €{stats?.monthlyRevenue != null ? stats.monthlyRevenue.toFixed(2) : '0.00'}
                  </div>
                </div>
                
                {stats?.revenueByMember && stats.revenueByMember.length > 0 && (
                  <div className="space-y-4 mt-4 pt-4 border-t border-emerald-100">
                    
                    {/* Incasso Personale dell'operatore connesso */}
                    {(() => {
                      const myIndex = stats.revenueByMember.findIndex(rm => rm.userId === user?.id);
                      const myRevenue = myIndex >= 0 ? stats.revenueByMember[myIndex] : null;
                      const otherRevenues = stats.revenueByMember.filter(rm => rm.userId !== user?.id);
                      
                      return (
                        <>
                          <div className="space-y-2">
                            <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Il tuo Incasso Mensile</p>
                            <div className="flex items-center justify-between text-sm p-2 rounded bg-emerald-100/50 border border-emerald-200">
                              <div className="flex flex-col">
                                <span className="font-semibold text-emerald-900">{myRevenue ? myRevenue.name : "Tu"}</span>
                                <span className="text-[10px] text-emerald-700">{myRevenue ? myRevenue.count : 0} operazioni</span>
                              </div>
                              <span className="font-bold text-emerald-700">€{myRevenue ? myRevenue.amount.toFixed(2) : "0.00"}</span>
                            </div>
                          </div>

                          {/* Tendina per gli altri utenti del team */}
                          {otherRevenues.length > 0 && (
                            <Collapsible className="w-full">
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="w-full flex justify-between items-center text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 h-8 px-2 -mx-2">
                                  <span>Visualizza incasso altri operatori</span>
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="space-y-2 mt-2">
                                {otherRevenues.map((rm, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-sm p-1.5 rounded bg-white border border-emerald-50">
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-slate-700">{rm.name}</span>
                                      <span className="text-[10px] text-muted-foreground">{rm.count} operazioni</span>
                                    </div>
                                    <span className="font-bold text-emerald-600">€{rm.amount.toFixed(2)}</span>
                                  </div>
                                ))}
                              </CollapsibleContent>
                            </Collapsible>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {alertsLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-16" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card className={(alerts?.expiringMemberships ?? 0) > 0 ? "border-destructive/50" : ""}>
              <CardHeader>
                <CardTitle className="text-lg">Tessere in Scadenza</CardTitle>
                <CardDescription>Prossimi 7 giorni</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{alerts?.expiringMemberships ?? 0}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation('/tessere-certificati')}
                    data-testid="button-view-memberships"
                  >
                    Vedi tutti
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className={(alerts?.expiredCertificates ?? 0) > 0 ? "border-destructive/50" : ""}>
              <CardHeader>
                <CardTitle className="text-lg">Certificati Scaduti</CardTitle>
                <CardDescription>Richiedono rinnovo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{alerts?.expiredCertificates ?? 0}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation('/tessere-certificati')}
                    data-testid="button-view-certificates"
                  >
                    Vedi tutti
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className={(alerts?.overduePayments ?? 0) > 0 ? "border-destructive/50" : ""}>
              <CardHeader>
                <CardTitle className="text-lg">Pagamenti in Sospeso</CardTitle>
                <CardDescription>Richiedono attenzione</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{alerts?.overduePayments ?? 0}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation('/pagamenti')}
                    data-testid="button-view-payments"
                  >
                    Vedi tutti
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50 md:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Iscrizioni online da completare in sede
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-600 text-white font-bold px-2 py-0.5 text-sm">
                    {pendingLoading ? "..." : pendingEnrollments.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : !pendingEnrollments || pendingEnrollments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nessuna iscrizione in attesa
                  </p>
                ) : (
                  <ul className="space-y-3 mt-2">
                    {pendingEnrollments.map((e: any) => (
                      <li key={e.id} className="flex flex-col sm:flex-row sm:items-center justify-between text-sm bg-white p-3 rounded-md border border-amber-100 shadow-sm gap-3">
                        <span className="font-semibold text-slate-800 uppercase">{e.memberName}</span>
                        <div className="flex items-center flex-wrap gap-2">
                          {e.pendingMedicalCert &&
                            <Badge variant="outline" className="text-amber-700 bg-amber-100 border-amber-300">
                              Cert. Medico
                            </Badge>
                          }
                          {e.pendingMembership &&
                            <Badge variant="outline" className="text-red-700 bg-red-100 border-red-300">
                              Quota Tessera
                            </Badge>
                          }
                          {e.pendingDocuments &&
                            <Badge variant="outline" className="text-blue-700 bg-blue-100 border-blue-300">
                              Firme Privacy
                            </Badge>
                          }
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-700 font-bold ml-2 underline" onClick={() => setLocation('/quote-promo?tab=online')}>Completa ora →</Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Alert Operativi Didattici (Sostituisce Attività Recente) */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-slate-800">Alert Operativi Didattici</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {alertsLoading ? (
            <>
              {[...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-6 w-16" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card className={(alerts?.expiringCourses ?? 0) > 0 ? "border-amber-200 bg-amber-50/30" : ""}>
                <CardHeader>
                  <CardTitle className="text-lg">Corsi in Avvicinamento Fine</CardTitle>
                  <CardDescription>Terminano entro 14 giorni</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-slate-700">{alerts?.expiringCourses ?? 0}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation('/corsi')}
                      className={(alerts?.expiringCourses ?? 0) > 0 ? "text-amber-700 border-amber-300 hover:bg-amber-100" : ""}
                    >
                      Pianifica Rinnovi
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className={(alerts?.expiringWorkshops ?? 0) > 0 ? "border-amber-200 bg-amber-50/30" : ""}>
                <CardHeader>
                  <CardTitle className="text-lg">Workshop Imminenti / in Scadenza</CardTitle>
                  <CardDescription>Eventi attivi nei prossimi 14 giorni</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-slate-700">{alerts?.expiringWorkshops ?? 0}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation('/workshop')}
                      className={(alerts?.expiringWorkshops ?? 0) > 0 ? "text-amber-700 border-amber-300 hover:bg-amber-100" : ""}
                    >
                      Verifica Partecipanti
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity (Ripristinata) */}
      <Card>
        <CardHeader>
          <CardTitle>Attività Recente</CardTitle>
          <CardDescription>Ultime iscrizioni e pagamenti</CardDescription>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : !recentActivity || recentActivity.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl animate-in fade-in zoom-in-95 mt-4">
              <div className="bg-primary/5 w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ring-1 ring-primary/10">
                <Activity className="w-6 h-6 text-primary/60" />
              </div>
              <p className="text-lg font-bold text-slate-800">Nessuna attività da mostrare</p>
              <p className="text-sm text-slate-500">Iscrizioni e pagamenti recenti appariranno qui automaticamente.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentActivity.map((activity: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {activity.memberName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString('it-IT')}
                    </span>
                    <Badge variant={activity.status === 'paid' ? 'default' : 'secondary'}>
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
