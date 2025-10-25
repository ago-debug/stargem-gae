import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Users, Calendar } from "lucide-react";

export default function Reports() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats/reports"],
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Report & Statistiche</h1>
        <p className="text-muted-foreground">Analisi dettagliate su iscrizioni, entrate e presenze</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
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
                <CardTitle className="text-sm font-medium">Iscritti Totali</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalMembers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats?.newMembersThisMonth || 0} questo mese
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
                <CardTitle className="text-sm font-medium">Entrate Mese</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  €{stats?.monthlyRevenue?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{stats?.revenueGrowth || 0}% vs mese scorso
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasso Frequenza</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.attendanceRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Media ultimi 30 giorni
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Iscrizioni per Categoria</CardTitle>
            <CardDescription>Distribuzione iscritti per categoria di corso</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : stats?.enrollmentsByCategory && stats.enrollmentsByCategory.length > 0 ? (
              <div className="space-y-3">
                {stats.enrollmentsByCategory.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.category}</p>
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(item.count / stats.totalEnrollments) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold ml-4">{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">Nessun dato disponibile</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compensi Insegnanti</CardTitle>
            <CardDescription>Riepilogo compensi per insegnante</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : stats?.instructorEarnings && stats.instructorEarnings.length > 0 ? (
              <div className="space-y-3">
                {stats.instructorEarnings.map((instructor: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{instructor.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {instructor.coursesCount} corsi
                      </p>
                    </div>
                    <span className="text-sm font-bold ml-4">
                      €{instructor.totalEarnings?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">Nessun dato disponibile</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trend Accessi Mensile</CardTitle>
          <CardDescription>Numero di accessi giornalieri registrati</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : stats?.dailyAccesses && stats.dailyAccesses.length > 0 ? (
            <div className="h-64 flex items-end justify-between gap-2">
              {stats.dailyAccesses.map((day: any, index: number) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-primary rounded-t-md min-h-[4px]"
                    style={{ height: `${(day.count / Math.max(...stats.dailyAccesses.map((d: any) => d.count))) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">Nessun dato disponibile</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Scadenze Imminenti</CardTitle>
            <CardDescription>Tessere e certificati in scadenza</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : stats?.upcomingExpiries && stats.upcomingExpiries.length > 0 ? (
              <div className="space-y-2">
                {stats.upcomingExpiries.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.memberName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.type === 'membership' ? 'Tessera' : 'Certificato Medico'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground ml-4">
                      {new Date(item.expiryDate).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">Nessuna scadenza imminente</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagamenti in Sospeso</CardTitle>
            <CardDescription>Quote e pagamenti da incassare</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : stats?.pendingPayments && stats.pendingPayments.length > 0 ? (
              <div className="space-y-2">
                {stats.pendingPayments.map((payment: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{payment.memberName || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {payment.description}
                      </p>
                    </div>
                    <span className="text-sm font-bold ml-4">€{payment.amount}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">Nessun pagamento in sospeso</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
