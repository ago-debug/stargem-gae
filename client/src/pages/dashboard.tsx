import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, AlertCircle, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import logoStarGem from "@assets/b4a42b7f-d509-4427-af5b-ebd8b17c6f92_1770748343779.png";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats/dashboard"],
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["/api/stats/alerts"],
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["/api/stats/recent-activity"],
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col items-center gap-4 mb-6">
        <img 
          src={logoStarGem} 
          alt="StarGEM Logo" 
          style={{ width: "200px", height: "auto" }}
          data-testid="logo-dashboard"
        />
      </div>
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Panoramica del sistema di gestione corsi</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <div className="text-2xl font-bold">{stats?.activeCourses || 0}</div>
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entrate Mese</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  €{stats?.monthlyRevenue?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.pendingPayments || 0} pagamenti in attesa
                </p>
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
            <Card className={alerts?.expiringMemberships > 0 ? "border-destructive/50" : ""}>
              <CardHeader>
                <CardTitle className="text-lg">Tessere in Scadenza</CardTitle>
                <CardDescription>Prossimi 7 giorni</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{alerts?.expiringMemberships || 0}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocation('/tessere')}
                    data-testid="button-view-memberships"
                  >
                    Vedi tutti
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className={alerts?.expiredCertificates > 0 ? "border-destructive/50" : ""}>
              <CardHeader>
                <CardTitle className="text-lg">Certificati Scaduti</CardTitle>
                <CardDescription>Richiedono rinnovo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{alerts?.expiredCertificates || 0}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocation('/tessere')}
                    data-testid="button-view-certificates"
                  >
                    Vedi tutti
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className={alerts?.overduePayments > 0 ? "border-destructive/50" : ""}>
              <CardHeader>
                <CardTitle className="text-lg">Pagamenti in Sospeso</CardTitle>
                <CardDescription>Richiedono attenzione</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{alerts?.overduePayments || 0}</span>
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

      {/* Recent Activity */}
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
