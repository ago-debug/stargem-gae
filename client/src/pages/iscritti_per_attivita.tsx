import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { EnrollmentDetailBadge } from "@/components/multi-select-enrollment-details";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Sparkles,
  CreditCard,
  Gift,
  BookOpen,
  Dumbbell,
  Users,
  Sun,
  Award,
  Music,
  UserCheck,
  Activity,
  ArrowLeft,
  Search,
  GraduationCap,
  Edit,
  Database,
  Building2,
  ShoppingBag,
} from "lucide-react";
import type { Course, Workshop, Member, PaidTrial, FreeTrial, SingleLesson, Training, CampusActivity, VacationStudy, BookingService } from "@shared/schema";
import { getActiveActivities } from "@/config/activities";

const activityMenuItems = [
  { id: "panoramica", label: "Panoramica", icon: Activity },
  ...getActiveActivities()
    .filter(a => a.visibility.iscrittiPanel)
    .map(a => ({
      id: a.id,
      label: a.labelUI,
      icon: a.design.icon
    }))
];

export default function IscrittiPerAttivita() {
  const [activeTab, setActiveTab] = useState("panoramica");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyWithEnrollments, setShowOnlyWithEnrollments] = useState(false);
  const [, setLocation] = useLocation();

  const { sortConfig: courseSort, handleSort: handleCourseSort, sortItems: sortCourseItems, isSortedColumn: isCourseSorted } = useSortableTable<any>("lastName");
  const { sortConfig: workshopSort, handleSort: handleWorkshopSort, sortItems: sortWorkshopItems, isSortedColumn: isWorkshopSorted } = useSortableTable<any>("lastName");
  const { sortConfig: activitySort, handleSort: handleActivitySort, sortItems: sortActivityItems, isSortedColumn: isActivitySorted } = useSortableTable<any>("lastName");

  const getSortValue = (enrollment: any, key: string) => {
    switch (key) {
      case "lastName": return enrollment.lastName || enrollment.memberLastName || "";
      case "firstName": return enrollment.firstName || enrollment.memberFirstName || "";
      case "email": return enrollment.email || enrollment.memberEmail || "";
      case "date": return enrollment.startDate || enrollment.enrollmentDate;
      default: return null;
    }
  };

  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
  const { data: workshops, isLoading: workshopsLoading } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery<any[]>({ queryKey: ["/api/enrollments?type=corsi"] });
  const { data: wsEnrollments, isLoading: wsEnrollmentsLoading } = useQuery<any[]>({ queryKey: ["/api/workshop-enrollments"] });

  const { data: bookingServices, isLoading: servLoading } = useQuery<BookingService[]>({ queryKey: ["/api/booking-services"] });
  const { data: paidTrials, isLoading: ptLoading } = useQuery<PaidTrial[]>({ queryKey: ["/api/paid-trials"] });
  const { data: freeTrials, isLoading: ftLoading } = useQuery<FreeTrial[]>({ queryKey: ["/api/free-trials"] });
  const { data: singleLessons, isLoading: slLoading } = useQuery<SingleLesson[]>({ queryKey: ["/api/single-lessons"] });
  const { data:  isLoading: saLoading } = useQuery<[]>({ queryKey: ["/api/sunday-activities"] });
  const { data:  isLoading: trLoading } = useQuery<any[]>({ queryKey: ["/api/courses?activityType=allenamenti"] });
  const { data:  isLoading: ilLoading } = useQuery<any[]>({ queryKey: ["/api/courses?activityType=lezioni-individuali"] });
  const { data: campusActivities, isLoading: caLoading } = useQuery<CampusActivity[]>({ queryKey: ["/api/campus-activities"] });
  const { data:  isLoading: recLoading } = useQuery<[]>({ queryKey: ["/api/"] });
  const { data: vacationStudies, isLoading: vsLoading } = useQuery<VacationStudy[]>({ queryKey: ["/api/vacation-studies"] });

  const { data: servEnrollments, isLoading: servEnrLoading } = useQuery<any[]>({ queryKey: ["/api/booking-service-enrollments"] });
  const { data: ptEnrollments, isLoading: ptEnrLoading } = useQuery<any[]>({ queryKey: ["/api/paid-trial-enrollments"] });
  const { data: ftEnrollments, isLoading: ftEnrLoading } = useQuery<any[]>({ queryKey: ["/api/free-trial-enrollments"] });
  const { data: slEnrollments, isLoading: slEnrLoading } = useQuery<any[]>({ queryKey: ["/api/single-lesson-enrollments"] });
  const { data: saEnrollments, isLoading: saEnrLoading } = useQuery<any[]>({ queryKey: ["/api/sunday-activity-enrollments"] });
  const { data: allenamentiEnrollments, isLoading: trEnrLoading } = useQuery<any[]>({ queryKey: ["/api/enrollments?type=allenamenti"] });
  const { data: lezioniIndividualiEnrollments, isLoading: ilEnrLoading } = useQuery<any[]>({ queryKey: ["/api/enrollments?type=lezioni-individuali"] });
  const { data: caEnrollments, isLoading: caEnrLoading } = useQuery<any[]>({ queryKey: ["/api/campus-enrollments"] });
  const { data: recEnrollments, isLoading: recEnrLoading } = useQuery<any[]>({ queryKey: ["/api/recital-enrollments"] });
  const { data: vsEnrollments, isLoading: vsEnrLoading } = useQuery<any[]>({ queryKey: ["/api/vacation-study-enrollments"] });

  interface ExtraDataConfig {
    data: any[] | undefined;
    loading: boolean;
    link: string;
    enrollments: any[] | undefined;
    enrollLoading: boolean;
    foreignKey: string;
  }

  const extraActivitiesMap: Record<string, ExtraDataConfig> = {
    "servizi": { data: bookingServices, loading: servLoading, link: "/gestione-attivita-stub", enrollments: servEnrollments, enrollLoading: servEnrLoading, foreignKey: "serviceId" },
    "prove-pagamento": { data: paidTrials, loading: ptLoading, link: "/scheda-prova-pagamento", enrollments: ptEnrollments, enrollLoading: ptEnrLoading, foreignKey: "paidTrialId" },
    "prove-gratuite": { data: freeTrials, loading: ftLoading, link: "/scheda-prova-gratuita", enrollments: ftEnrollments, enrollLoading: ftEnrLoading, foreignKey: "freeTrialId" },
    "lezioni-singole": { data: singleLessons, loading: slLoading, link: "/scheda-lezione-singola", enrollments: slEnrollments, enrollLoading: slEnrLoading, foreignKey: "singleLessonId" },
    "domeniche-movimento": { data:  loading: saLoading, link: "/scheda-domenica", enrollments: saEnrollments, enrollLoading: saEnrLoading, foreignKey: "sundayActivityId" },
    "allenamenti": { data:  loading: trLoading, link: "/scheda-allenamento", enrollments: allenamentiEnrollments, enrollLoading: trEnrLoading, foreignKey: "courseId" },
    "affitti": { data: [], loading: false, link: "/prenotazioni-sale", enrollments: [], enrollLoading: false, foreignKey: "id" },
    "lezioni-individuali": { data:  loading: ilLoading, link: "/scheda-lezione-individuale", enrollments: lezioniIndividualiEnrollments, enrollLoading: ilEnrLoading, foreignKey: "courseId" },
    "campus": { data: campusActivities, loading: caLoading, link: "/scheda-campus", enrollments: caEnrollments, enrollLoading: caEnrLoading, foreignKey: "campusActivityId" },
    "saggi": { data:  loading: recLoading, link: "/scheda-saggio", enrollments: recEnrollments, enrollLoading: recEnrLoading, foreignKey: "recitalId" },
    "vacanze-studio": { data: vacationStudies, loading: vsLoading, link: "/scheda-vacanza-studio", enrollments: vsEnrollments, enrollLoading: vsEnrLoading, foreignKey: "vacationStudyId" },
    "merchandising": { data: [], loading: false, link: "/gestione-attivita-stub", enrollments: [], enrollLoading: false, foreignKey: "merchandisingId" },
  };

  const isExtraLoading = Object.values(extraActivitiesMap).some(config => config.loading || config.enrollLoading);
  const isLoading = coursesLoading || workshopsLoading || enrollmentsLoading || wsEnrollmentsLoading || isExtraLoading;

  const activeCourses = Array.isArray(courses) ? (courses as Course[]).filter(c => c.active) : [];
  const activeWorkshops = Array.isArray(workshops) ? (workshops as Workshop[]).filter(w => w.active) : [];

  const activeEnrollments = Array.isArray(enrollments) ? (enrollments as any[]).filter(e => e.status === 'active' || !e.status) : [];
  const totalCourseEnrollments = Array.isArray(activeEnrollments) ? (activeEnrollments as any[]).filter(e => e.courseId && Array.isArray(courses) && (courses as Course[]).some(c => c.id === e.courseId && c.active)).length : 0;
  // Calculate specific workshop enrollments by checking the workshop-enrollments endpoint specifically
  const totalWsEnrollments = Array.isArray(wsEnrollments) ? (wsEnrollments as any[]).filter(e => (e.status === 'active' || !e.status) && Array.isArray(workshops) && (workshops as Workshop[]).some(w => w.id === e.workshopId && w.active)).length : 0;

  const totalActiveEnrollmentsCount = totalCourseEnrollments + totalWsEnrollments;

  let dynamicEnrollmentsCount = 0;
  if (activeTab === 'panoramica') {
    dynamicEnrollmentsCount = totalActiveEnrollmentsCount;
  } else if (activeTab === 'corsi') {
    dynamicEnrollmentsCount = totalCourseEnrollments;
  } else if (activeTab === 'workshop') {
    dynamicEnrollmentsCount = totalWsEnrollments;
  } else {
    dynamicEnrollmentsCount = 0; // Other tabs have no enrollments mapped by the universal backend endpoint yet
  }

  const getEnrollmentsForActivity = (activityId: number, isWorkshop: boolean = false) => {
    const relevantEnrollments = isWorkshop ? wsEnrollments : enrollments;
    if (!Array.isArray(relevantEnrollments)) return [];

    return (relevantEnrollments as any[])
      .filter(e => e.status === 'active' || !e.status)
      .filter(e => isWorkshop ? e.workshopId === activityId : e.courseId === activityId)
      .map(e => ({
        enrollmentId: e.id,
        memberId: e.memberId,
        firstName: e.memberFirstName || "N/A",
        lastName: e.memberLastName || "N/A",
        email: e.memberEmail,
        startDate: e.startDate || e.enrollmentDate,
        details: Array.isArray(e.details) ? e.details : (typeof e.details === 'string' ? (JSON.parse(e.details) || []) : []),
      }));
  };

  const filteredCourses = Array.isArray(courses) ? (courses as Course[]).filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.sku?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (showOnlyWithEnrollments) {
      return getEnrollmentsForActivity(course.id, false).length > 0;
    }
    return true;
  }) : [];

  const filteredWorkshops = Array.isArray(workshops) ? (workshops as Workshop[]).filter(workshop => {
    const matchesSearch = workshop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workshop.sku?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (showOnlyWithEnrollments) {
      return getEnrollmentsForActivity(workshop.id, true).length > 0;
    }
    return true;
  }) : [];

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-muted/30 sticky top-0 z-10">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="icon-gold-bg rounded-md h-8 w-8 flex-shrink-0" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 text-white" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">
                  Iscritti per Attivit&agrave;
                </h1>
                <p className="text-muted-foreground text-sm">
                  Panoramica e gestione iscrizioni per attivit&agrave;
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant={showOnlyWithEnrollments ? "default" : "outline"}
                onClick={() => setShowOnlyWithEnrollments(!showOnlyWithEnrollments)}
                className={`text-lg px-4 py-2 h-auto flex items-center gap-2 transition-all ${showOnlyWithEnrollments ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-700 shadow-md scale-105" : "hover:bg-amber-100"}`}
                data-testid="button-toggle-active-enrollments"
              >
                <Users className={`w-4 h-4 ${showOnlyWithEnrollments ? "text-white" : "sidebar-icon-gold"}`} />
                {dynamicEnrollmentsCount} iscrizioni attive
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {activityMenuItems.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                size="sm"
                onClick={() => setActiveTab(item.id)}
                className={`text-xs h-8 whitespace-nowrap flex-shrink-0 ${activeTab === item.id ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30" : ""}`}
              >
                <item.icon className="w-3 h-3 mr-1 sidebar-icon-gold" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <Tabs value={activeTab} className="w-full">
          <TabsContent value="panoramica" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {totalCourseEnrollments > 0 && (
                <Card onClick={() => setActiveTab("corsi")} className="cursor-pointer hover:border-amber-500 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Corsi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{totalCourseEnrollments}</span>
                      <span className="text-sm text-muted-foreground">iscrizioni attive</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {totalWsEnrollments > 0 && (
                <Card onClick={() => setActiveTab("workshop")} className="cursor-pointer hover:border-amber-500 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Workshop</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{totalWsEnrollments}</span>
                      <span className="text-sm text-muted-foreground">iscrizioni attive</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {totalActiveEnrollmentsCount === 0 && !isLoading && (
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">Nessuna iscrizione attiva trovata</p>
                    <p className="text-sm">Inizia a iscrivere membri ai corsi o workshop per vedere qui il riepilogo.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Riepilogo Iscritti per Attivit&agrave;</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activityMenuItems.filter(i => i.id !== "panoramica").map((item) => {
                    let enrollCount = 0;
                    if (item.id === "corsi") {
                      enrollCount = totalCourseEnrollments;
                    } else if (item.id === "workshop") {
                      enrollCount = totalWsEnrollments;
                    }

                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className="text-left hover-elevate rounded-md p-3 transition-colors flex items-center gap-3"
                      >
                        <div className={`w-10 h-10 rounded-md icon-gold-bg flex items-center justify-center`}>
                          <item.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{enrollCount} iscritti</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="corsi" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Cerca corso per nome o SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ))}
                  </div>
                ) : filteredCourses && filteredCourses.length > 0 ? (
                  <div className="space-y-6">
                    {filteredCourses.map((course) => {
                      const courseEnrollments = getEnrollmentsForActivity(course.id, false);
                      return (
                        <Card key={course.id} className="overflow-hidden">
                          <CardHeader className="bg-muted/50">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <GraduationCap className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold">{course.name}</h3>
                                  {course.sku && (
                                    <p className="text-sm text-muted-foreground">SKU: {course.sku}</p>
                                  )}
                                  {course.dayOfWeek && course.startTime && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {course.dayOfWeek} • {course.startTime}
                                      {course.endTime && ` - ${course.endTime}`}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">
                                  {courseEnrollments.length} {courseEnrollments.length === 1 ? 'iscritto' : 'iscritti'}
                                </Badge>
                                <Link href={`/scheda-corso?courseId=${course.id}`}>
                                  <Button size="sm" className="bg-[#2c3e50] text-[#e0e0e0] hover:bg-[#34495e]" data-testid={`button-scheda-corso-${course.id}`}>
                                    Scheda
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4">
                            {courseEnrollments.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                Nessun iscritto per questo corso
                              </p>
                            ) : (
                              <div className="border rounded-lg overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <SortableTableHead sortKey="lastName" currentSort={courseSort} onSort={handleCourseSort}>Cognome</SortableTableHead>
                                      <SortableTableHead sortKey="firstName" currentSort={courseSort} onSort={handleCourseSort}>Nome</SortableTableHead>
                                      <SortableTableHead sortKey="email" currentSort={courseSort} onSort={handleCourseSort}>Email</SortableTableHead>
                                      <TableHead>Dettagli</TableHead>
                                      <SortableTableHead sortKey="date" currentSort={courseSort} onSort={handleCourseSort}>Data Iscrizione</SortableTableHead>
                                      <TableHead className="text-right">Azioni</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {sortCourseItems(courseEnrollments, getSortValue).map((enrollment) => (
                                      <TableRow key={enrollment.enrollmentId}>
                                        <TableCell className={cn("font-medium", isCourseSorted("lastName") && "sorted-column-cell")}>{enrollment.lastName}</TableCell>
                                        <TableCell className={cn(isCourseSorted("firstName") && "sorted-column-cell")}>{enrollment.firstName}</TableCell>
                                        <TableCell className={cn(isCourseSorted("email") && "sorted-column-cell")}>{enrollment.email || '-'}</TableCell>
                                        <TableCell>
                                          <div className="flex flex-wrap gap-1">
                                            {Array.isArray(enrollment.details) ? enrollment.details.map((detail: string) => (
                                              <EnrollmentDetailBadge key={detail} name={detail} />
                                            )) : null}
                                          </div>
                                        </TableCell>
                                        <TableCell className={cn(isCourseSorted("date") && "sorted-column-cell")}>
                                          {enrollment.startDate
                                            ? new Date(enrollment.startDate).toLocaleDateString('it-IT')
                                            : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-primary hover:text-primary hover:bg-primary/10"
                                            onClick={() => setLocation(`/anagrafica_a_lista?editMemberId=${enrollment.memberId}`)}
                                          >
                                            <Edit className="w-4 h-4 mr-1" />
                                            Modifica Anagrafica
                                          </Button>
                                          <Link href={`/anagrafica_a_lista?search=${enrollment.lastName}`}>
                                            <Button variant="ghost" size="sm">
                                              Profilo Completo
                                            </Button>
                                          </Link>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery ? "Nessun corso trovato" : "Nessun corso disponibile"}
                      {showOnlyWithEnrollments && " con iscrizioni attive"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workshop" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Cerca workshop per nome o SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ))}
                  </div>
                ) : filteredWorkshops && filteredWorkshops.length > 0 ? (
                  <div className="space-y-6">
                    {filteredWorkshops.map((workshop) => {
                      const workshopEnrollments = getEnrollmentsForActivity(workshop.id, true);
                      return (
                        <Card key={workshop.id} className="overflow-hidden">
                          <CardHeader className="bg-muted/50">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <Sparkles className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold">{workshop.name}</h3>
                                  {workshop.sku && (
                                    <p className="text-sm text-muted-foreground">SKU: {workshop.sku}</p>
                                  )}
                                  {workshop.dayOfWeek && workshop.startTime && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {workshop.dayOfWeek} • {workshop.startTime}
                                      {workshop.endTime && ` - ${workshop.endTime}`}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">
                                  {workshopEnrollments.length} {workshopEnrollments.length === 1 ? 'iscritto' : 'iscritti'}
                                </Badge>
                                <Link href={`/scheda-workshop?workshopId=${workshop.id}`}>
                                  <Button size="sm" className="bg-[#2c3e50] text-[#e0e0e0] hover:bg-[#34495e]" data-testid={`button-scheda-workshop-${workshop.id}`}>
                                    Scheda
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4">
                            {workshopEnrollments.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                Nessun iscritto per questo workshop
                              </p>
                            ) : (
                              <div className="border rounded-lg overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <SortableTableHead sortKey="lastName" currentSort={workshopSort} onSort={handleWorkshopSort}>Cognome</SortableTableHead>
                                      <SortableTableHead sortKey="firstName" currentSort={workshopSort} onSort={handleWorkshopSort}>Nome</SortableTableHead>
                                      <SortableTableHead sortKey="email" currentSort={workshopSort} onSort={handleWorkshopSort}>Email</SortableTableHead>
                                      <TableHead className="text-right">Azioni</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {sortWorkshopItems(workshopEnrollments, getSortValue).map((enrollment) => (
                                      <TableRow key={enrollment.enrollmentId}>
                                        <TableCell className={cn("font-medium", isWorkshopSorted("lastName") && "sorted-column-cell")}>{enrollment.lastName}</TableCell>
                                        <TableCell className={cn(isWorkshopSorted("firstName") && "sorted-column-cell")}>{enrollment.firstName}</TableCell>
                                        <TableCell className={cn(isWorkshopSorted("email") && "sorted-column-cell")}>{enrollment.email || '-'}</TableCell>
                                        <TableCell className="text-right">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-primary hover:text-primary hover:bg-primary/10"
                                            onClick={() => setLocation(`/anagrafica_a_lista?editMemberId=${enrollment.memberId}`)}
                                          >
                                            <Edit className="w-4 h-4 mr-1" />
                                            Modifica Anagrafica
                                          </Button>
                                          <Link href={`/anagrafica_a_lista?search=${enrollment.lastName}`}>
                                            <Button variant="ghost" size="sm">
                                              Profilo Completo
                                            </Button>
                                          </Link>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery ? "Nessun workshop trovato" : "Nessun workshop disponibile"}
                      {showOnlyWithEnrollments && " con iscrizioni attive"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {activityMenuItems.filter(i => i.id !== "panoramica" && i.id !== "corsi" && i.id !== "workshop").map((item) => {
            const config = extraActivitiesMap[item.id];
            if (!config) return null;

            // Applichiamo filtro ricerca per lo SKU / Nome
            const filteredData = Array.isArray(config?.data) ? (config.data as any[]).filter(activity => {
              const matchesSearch = activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (activity.sku && activity.sku.toLowerCase().includes(searchQuery.toLowerCase()));
              if (!matchesSearch) return false;
              return true;
            }) : [];

            const activityDataWithEnrollments = Array.isArray(filteredData) ? (filteredData as any[]).map(activity => {
              const activityEnrollments = Array.isArray(config.enrollments) ? (config.enrollments as any[]).filter(e => e[config.foreignKey] === activity.id && (e.status === 'active' || !e.status)) : [];
              return { ...activity, activityEnrollments };
            }).filter(activity => {
              if (showOnlyWithEnrollments && activity.activityEnrollments.length === 0) return false;
              return true;
            }) : [];

            return (
              <TabsContent key={item.id} value={item.id} className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder={`Cerca ${item.label.toLowerCase()} per nome o SKU...`}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {config?.loading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="space-y-2">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-24 w-full" />
                          </div>
                        ))}
                      </div>
                    ) : activityDataWithEnrollments && activityDataWithEnrollments.length > 0 ? (
                      <div className="space-y-6">
                        {activityDataWithEnrollments.map(({ activityEnrollments, ...activity }) => (
                          <Card key={activity.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/50">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-primary/10 rounded-lg">
                                    <item.icon className="w-5 h-5 text-primary" />
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold">{activity.name}</h3>
                                    {activity.sku && (
                                      <p className="text-sm text-muted-foreground">SKU: {activity.sku}</p>
                                    )}
                                    {activity.dayOfWeek && activity.startTime && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {activity.dayOfWeek} • {activity.startTime}
                                        {activity.endTime && ` - ${activity.endTime}`}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">
                                    {activityEnrollments.length} iscritti
                                  </Badge>
                                  <Link href={`${config.link}?activityId=${activity.id}`}>
                                    <Button size="sm" className="bg-[#2c3e50] text-[#e0e0e0] hover:bg-[#34495e]" data-testid={`button-scheda-attivita-${activity.id}`}>
                                      Scheda
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                              {activityEnrollments.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  Nessun iscritto per quest'attività
                                </p>
                              ) : (
                                <div className="border rounded-lg overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <SortableTableHead sortKey="lastName" currentSort={activitySort} onSort={handleActivitySort}>Cognome</SortableTableHead>
                                        <SortableTableHead sortKey="firstName" currentSort={activitySort} onSort={handleActivitySort}>Nome</SortableTableHead>
                                        <SortableTableHead sortKey="email" currentSort={activitySort} onSort={handleActivitySort}>Email</SortableTableHead>
                                        <TableHead>Dettagli</TableHead>
                                        <SortableTableHead sortKey="date" currentSort={activitySort} onSort={handleActivitySort}>Data Iscrizione</SortableTableHead>
                                        <TableHead className="text-right">Azioni</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {sortActivityItems(activityEnrollments, getSortValue).map((enroll: any) => (
                                        <TableRow key={enroll.id}>
                                          <TableCell className={cn("font-medium", isActivitySorted("lastName") && "sorted-column-cell")}>{enroll.memberLastName || '-'}</TableCell>
                                          <TableCell className={cn(isActivitySorted("firstName") && "sorted-column-cell")}>{enroll.memberFirstName || '-'}</TableCell>
                                          <TableCell className={cn(isActivitySorted("email") && "sorted-column-cell")}>{enroll.memberEmail || '-'}</TableCell>
                                          <TableCell>
                                            <span className="text-xs text-muted-foreground">-</span>
                                          </TableCell>
                                          <TableCell className={cn(isActivitySorted("date") && "sorted-column-cell")}>
                                            {enroll.enrollmentDate
                                              ? new Date(enroll.enrollmentDate).toLocaleDateString('it-IT')
                                              : '-'}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <Link href={`/anagrafica_a_lista?search=${enroll.memberLastName || ''}`}>
                                              <Button variant="ghost" size="sm">
                                                Profilo Completo
                                              </Button>
                                            </Link>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <item.icon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          {searchQuery ? `Nessuna ${item.label.toLowerCase()} trovata` : `Nessuna ${item.label.toLowerCase()} disponibile`}
                          {showOnlyWithEnrollments && " con iscrizioni attive"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </div>
  );
}
