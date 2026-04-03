import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, AlertCircle, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation, Link } from "wouter";
const logoStarGem = "/logo_stargem.png";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  interface RevenueMember {
    name: string;
    amount: number;
    count: number;
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
                  <div className="space-y-2 mt-4 pt-4 border-t border-emerald-100">
                    <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider mb-2">Incasso per Operatore</p>
                    {stats.revenueByMember.map((rm, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm p-1.5 rounded bg-white border border-emerald-50">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-700">{rm.name}</span>
                          <span className="text-[10px] text-muted-foreground">{rm.count} operazioni</span>
                        </div>
                        <span className="font-bold text-emerald-600">€{rm.amount.toFixed(2)}</span>
                      </div>
                    ))}
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
            <div className="text-center py-12 text-muted-foreground">
              <p>Nessuna attività recente</p>
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
