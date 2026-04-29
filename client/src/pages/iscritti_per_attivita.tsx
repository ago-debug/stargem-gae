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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion } from "@/components/ui/accordion";
import { ActivityAccordionCard } from "@/components/activity-accordion-card";
import { cn, getSeasonLabel } from "@/lib/utils";
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
import type { Course, Member, BookingService } from "@shared/schema";
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
  const [expandedWorkshops, setExpandedWorkshops] = useState<string[]>([]);
  const [selectedSeasonIdWS, setSelectedSeasonIdWS] = useState<string>("active");
  const [showConcludedSeasonsWS, setShowConcludedSeasonsWS] = useState(false);
  const [expandedCourses, setExpandedCourses] = useState<string[]>([]);
  const [selectedSeasonIdCourses, setSelectedSeasonIdCourses] = useState<string>("active");
  const [showConcludedSeasonsCourses, setShowConcludedSeasonsCourses] = useState(false);
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

  const { data: seasons } = useQuery<any[]>({ queryKey: ["/api/seasons"] });
  const { data: activeSeason } = useQuery<any>({ queryKey: ["/api/seasons/active"] });

  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({ queryKey: ["/api/courses?activityType=course"] });
  // @ts-ignore // TODO: STI-cleanup
  const { data: workshops, isLoading: workshopsLoading } = useQuery<Workshop[]>({ queryKey: ["/api/courses?activityType=workshop"] });
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery<any[]>({ queryKey: ["/api/enrollments?activityType=course"] });
  const { data: wsEnrollments, isLoading: wsEnrollmentsLoading } = useQuery<any[]>({ queryKey: ["/api/enrollments?activityType=workshop"] });

  const { data: bookingServices, isLoading: servLoading } = useQuery<BookingService[]>({ queryKey: ["/api/courses?activityType=servizi"] });
  // @ts-ignore // TODO: STI-cleanup
  const { data: paidTrials, isLoading: ptLoading } = useQuery<PaidTrial[]>({ queryKey: ["/api/courses?activityType=prova_pagamento"] });
  // @ts-ignore // TODO: STI-cleanup
  const { data: freeTrials, isLoading: ftLoading } = useQuery<FreeTrial[]>({ queryKey: ["/api/courses?activityType=prova_gratuita"] });
  // @ts-ignore // TODO: STI-cleanup
  const { data: singleLessons, isLoading: slLoading } = useQuery<SingleLesson[]>({ queryKey: ["/api/courses?activityType=lezione_singola"] });
  const { data: sundayActivities, isLoading: saLoading } = useQuery<any[]>({ queryKey: ["/api/courses?activityType=domenica_movimento"] });
  const { data: trainings, isLoading: trLoading } = useQuery<any[]>({ queryKey: ["/api/courses?activityType=allenamenti"] });
  const { data: individualLessons, isLoading: ilLoading } = useQuery<any[]>({ queryKey: ["/api/courses?activityType=lezione_individuale"] });
  const { data: campusActivities, isLoading: caLoading } = useQuery<any[]>({ queryKey: ["/api/courses?activityType=campus"] });
  const { data: recitals, isLoading: recLoading } = useQuery<any[]>({ queryKey: ["/api/courses?activityType=saggio"] });
  // @ts-ignore // TODO: STI-cleanup
  const { data: vacationStudies, isLoading: vsLoading } = useQuery<VacationStudy[]>({ queryKey: ["/api/courses?activityType=vacanza_studio"] });

  const { data: servEnrollments, isLoading: servEnrLoading } = useQuery<any[]>({ queryKey: ["/api/enrollments?activityType=servizi"] });
  const { data: ptEnrollments, isLoading: ptEnrLoading } = useQuery<any[]>({ queryKey: ["/api/enrollments?activityType=prova_pagamento"] });
  const { data: ftEnrollments, isLoading: ftEnrLoading } = useQuery<any[]>({ queryKey: ["/api/enrollments?activityType=prova_gratuita"] });
  const { data: slEnrollments, isLoading: slEnrLoading } = useQuery<any[]>({ queryKey: ["/api/enrollments?activityType=lezione_singola"] });
  const { data: saEnrollments, isLoading: saEnrLoading } = useQuery<any[]>({ queryKey: ["/api/enrollments?activityType=domenica_movimento"] });
  const { data: allenamentiEnrollments, isLoading: trEnrLoading } = useQuery<any[]>({ queryKey: ["/api/enrollments?activityType=allenamenti"] });
  const { data: lezioniIndividualiEnrollments, isLoading: ilEnrLoading } = useQuery<any[]>({ queryKey: ["/api/enrollments?activityType=lezione_individuale"] });
  const { data: caEnrollments, isLoading: caEnrLoading } = useQuery<any[]>({ queryKey: ["/api/enrollments?activityType=campus"] });
  const { data: recEnrollments, isLoading: recEnrLoading } = useQuery<any[]>({ queryKey: ["/api/enrollments?activityType=saggio"] });
  const { data: vsEnrollments, isLoading: vsEnrLoading } = useQuery<any[]>({ queryKey: ["/api/enrollments?activityType=vacanza_studio"] });

  interface ExtraDataConfig {
    data: any[] | undefined;
    loading: boolean;
    link: string;
    enrollments: any[] | undefined;
    enrollLoading: boolean;
    foreignKey: string;
  }

  const extraActivitiesMap: Record<string, ExtraDataConfig> = {
    "servizi": { data: bookingServices, loading: servLoading, link: "/gestione-attivita-stub", enrollments: servEnrollments, enrollLoading: servEnrLoading, foreignKey: "courseId" },
    "prove-pagamento": { data: paidTrials, loading: ptLoading, link: "/scheda-prova-pagamento", enrollments: ptEnrollments, enrollLoading: ptEnrLoading, foreignKey: "courseId" },
    "prove-gratuite": { data: freeTrials, loading: ftLoading, link: "/scheda-prova-gratuita", enrollments: ftEnrollments, enrollLoading: ftEnrLoading, foreignKey: "courseId" },
    "lezioni-singole": { data: singleLessons, loading: slLoading, link: "/scheda-lezione-singola", enrollments: slEnrollments, enrollLoading: slEnrLoading, foreignKey: "courseId" },
    "domeniche-movimento": { data: sundayActivities, loading: saLoading, link: "/scheda-domenica", enrollments: saEnrollments, enrollLoading: saEnrLoading, foreignKey: "courseId" },
    "allenamenti": { data: trainings, loading: trLoading, link: "/scheda-allenamento", enrollments: allenamentiEnrollments, enrollLoading: trEnrLoading, foreignKey: "courseId" },
    "affitti": { data: [], loading: false, link: "/prenotazioni-sale", enrollments: [], enrollLoading: false, foreignKey: "id" },
    "lezioni-individuali": { data: individualLessons, loading: ilLoading, link: "/scheda-lezione-individuale", enrollments: lezioniIndividualiEnrollments, enrollLoading: ilEnrLoading, foreignKey: "courseId" },
    "campus": { data: campusActivities, loading: caLoading, link: "/scheda-campus", enrollments: caEnrollments, enrollLoading: caEnrLoading, foreignKey: "courseId" },
    "saggi": { data: recitals, loading: recLoading, link: "/scheda-saggio", enrollments: recEnrollments, enrollLoading: recEnrLoading, foreignKey: "courseId" },
    "vacanze-studio": { data: vacationStudies, loading: vsLoading, link: "/scheda-vacanza-studio", enrollments: vsEnrollments, enrollLoading: vsEnrLoading, foreignKey: "courseId" },
    "merchandising": { data: [], loading: false, link: "/gestione-attivita-stub", enrollments: [], enrollLoading: false, foreignKey: "courseId" },
  };

  const isExtraLoading = Object.values(extraActivitiesMap).some(config => config.loading || config.enrollLoading);
  const isLoading = coursesLoading || workshopsLoading || enrollmentsLoading || wsEnrollmentsLoading || isExtraLoading;

  const activeCourses = Array.isArray(courses) ? (courses as Course[]).filter(c => c.active) : [];
  // @ts-ignore // TODO: STI-cleanup
  const activeWorkshops = Array.isArray(workshops) ? (workshops as Workshop[]).filter(w => w.active) : [];

  const activeEnrollments = Array.isArray(enrollments) ? (enrollments as any[]).filter(e => e.status === 'active' || !e.status) : [];
  const totalCourseEnrollments = Array.isArray(activeEnrollments) ? (activeEnrollments as any[]).filter(e => e.courseId && Array.isArray(courses) && (courses as Course[]).some(c => c.id === e.courseId)).length : 0;
  // Calculate specific workshop enrollments by checking the workshop-enrollments endpoint specifically
  // @ts-ignore // TODO: STI-cleanup
  const totalWsEnrollments = Array.isArray(wsEnrollments) ? (wsEnrollments as any[]).filter(e => (e.status === 'active' || !e.status) && Array.isArray(workshops) && (workshops as Workshop[]).some(w => w.id === e.courseId)).length : 0;

  const totalActiveEnrollmentsCount = totalCourseEnrollments + totalWsEnrollments;

  let dynamicEnrollmentsCount = 0;
  if (activeTab === 'panoramica') {
    dynamicEnrollmentsCount = totalActiveEnrollmentsCount;
  } else if (activeTab === 'corsi') {
    dynamicEnrollmentsCount = totalCourseEnrollments;
  } else if (activeTab === 'workshop') {
    dynamicEnrollmentsCount = totalWsEnrollments;
  } else {
    const config = extraActivitiesMap[activeTab];
    if (config && Array.isArray(config.enrollments)) {
      dynamicEnrollmentsCount = config.enrollments.filter(e => e.status === 'active' || !e.status).length;
    } else {
      dynamicEnrollmentsCount = 0;
    }
  }

  const getEnrollmentsForActivity = (activityId: number, isWorkshop: boolean = false) => {
    const relevantEnrollments = isWorkshop ? wsEnrollments : enrollments;
    if (!Array.isArray(relevantEnrollments)) return [];

    return (relevantEnrollments as any[])
      .filter(e => e.status === 'active' || !e.status)
      .filter(e => isWorkshop ? e.courseId === activityId : e.courseId === activityId)
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

    // Filtro Stagione
    if (!showConcludedSeasonsCourses) {
      const targetSeasonId = selectedSeasonIdCourses === "active" ? activeSeason?.id : parseInt(selectedSeasonIdCourses);
      const courseSeasonId = course.seasonId || activeSeason?.id;
      if (targetSeasonId && courseSeasonId !== targetSeasonId) return false;
    }

    if (showOnlyWithEnrollments) {
      return getEnrollmentsForActivity(course.id, false).length > 0;
    }
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.startDate || a.createdAt || 0).getTime();
    const dateB = new Date(b.startDate || b.createdAt || 0).getTime();
    return dateB - dateA; // Ordine decrescente
  }) : [];

  // @ts-ignore // TODO: STI-cleanup
  const filteredWorkshops = Array.isArray(workshops) ? (workshops as Workshop[]).filter(workshop => {
    const matchesSearch = workshop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workshop.sku?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Filtro Stagione
    if (!showConcludedSeasonsWS) {
      const targetSeasonId = selectedSeasonIdWS === "active" ? activeSeason?.id : parseInt(selectedSeasonIdWS);
      const wsSeasonId = workshop.seasonId || activeSeason?.id;
      if (targetSeasonId && wsSeasonId !== targetSeasonId) return false;
    }

    if (showOnlyWithEnrollments) {
      return getEnrollmentsForActivity(workshop.id, true).length > 0;
    }
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.startDate || a.createdAt || 0).getTime();
    const dateB = new Date(b.startDate || b.createdAt || 0).getTime();
    return dateB - dateA; // Ordine decrescente
  }) : [];

  let headerCounterText = `${dynamicEnrollmentsCount} iscrizioni attive`;
  switch (activeTab) {
    case 'workshop': {
      const activeWs = filteredWorkshops.filter(w => w.active);
      if (activeWs.length > 0) {
        const activeEnrolls = activeWs.reduce((acc, w) => acc + getEnrollmentsForActivity(w.id, true).length, 0);
        headerCounterText = `${activeWs.length} attivi / ${filteredWorkshops.length} totali \u00B7 ${activeEnrolls} iscritti`;
      } else {
        const totalEnrolls = filteredWorkshops.reduce((acc, w) => acc + getEnrollmentsForActivity(w.id, true).length, 0);
        headerCounterText = `${filteredWorkshops.length} workshop \u00B7 ${totalEnrolls} iscritti`;
      }
      break;
    }
    case 'corsi': {
      const activeCourses = filteredCourses.filter(c => c.active);
      if (activeCourses.length > 0) {
        const activeEnrolls = activeCourses.reduce((acc, c) => acc + getEnrollmentsForActivity(c.id, false).length, 0);
        headerCounterText = `${activeCourses.length} attivi / ${filteredCourses.length} totali \u00B7 ${activeEnrolls} iscritti`;
      } else {
        const totalEnrolls = filteredCourses.reduce((acc, c) => acc + getEnrollmentsForActivity(c.id, false).length, 0);
        headerCounterText = `${filteredCourses.length} corsi \u00B7 ${totalEnrolls} iscritti`;
      }
      break;
    }
    default:
      headerCounterText = `${dynamicEnrollmentsCount} iscrizioni attive`;
      break;
  }

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
                {headerCounterText}
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
                    <p className="text-sm">Inizia a iscrivere utenti ai corsi o workshop per vedere qui il riepilogo.</p>
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
                    } else {
                      const config = extraActivitiesMap[item.id];
                      if (config && Array.isArray(config.enrollments)) {
                         enrollCount = config.enrollments.filter(e => e.status === 'active' || !e.status).length;
                      }
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
                <div className="flex flex-col gap-4">
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
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <Select value={selectedSeasonIdCourses} onValueChange={setSelectedSeasonIdCourses} disabled={showConcludedSeasonsCourses}>
                        <SelectTrigger className="w-[250px]">
                          <SelectValue placeholder="Seleziona Stagione" />
                        </SelectTrigger>
                        <SelectContent>
                          {seasons?.map((s: any, idx: number) => {
                            const isActiveFallback = s.active || (!seasons.find((x: any) => x.active) && idx === 0);
                            return (
                              <SelectItem key={s.id} value={isActiveFallback ? "active" : s.id.toString()} className={isActiveFallback ? "font-semibold" : ""}>
                                {getSeasonLabel(s, seasons)}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                           id="show-concluded-courses" 
                           checked={showConcludedSeasonsCourses}
                           onCheckedChange={(checked) => setShowConcludedSeasonsCourses(checked as boolean)}
                        />
                        <Label htmlFor="show-concluded-courses" className="cursor-pointer text-sm font-normal">Mostra stagioni concluse</Label>
                      </div>
                    </div>
                    
                    {filteredCourses && filteredCourses.length > 0 && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setExpandedCourses(filteredCourses.map(c => c.id.toString()))}>Espandi tutto</Button>
                        <Button variant="outline" size="sm" onClick={() => setExpandedCourses([])}>Comprimi tutto</Button>
                      </div>
                    )}
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
                  <Accordion 
                    type="multiple" 
                    className="w-full space-y-4"
                    value={expandedCourses}
                    onValueChange={setExpandedCourses}
                  >
                    {filteredCourses.map((course) => {
                      const courseEnrollments = getEnrollmentsForActivity(course.id, false);
                      return (
                        <ActivityAccordionCard
                          key={course.id}
                          id={course.id.toString()}
                          activity={course}
                          icon={GraduationCap}
                          enrollmentsCount={courseEnrollments.length}
                          badgeLabelPlural="iscritti"
                          badgeLabelSingular="iscritto"
                          linkHref={`/scheda-corso?courseId=${course.id}`}
                          testIdPrefix="scheda-corso"
                        >
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
                        </ActivityAccordionCard>
                      );
                    })}
                  </Accordion>
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
                <div className="flex flex-col gap-4">
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
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <Select value={selectedSeasonIdWS} onValueChange={setSelectedSeasonIdWS} disabled={showConcludedSeasonsWS}>
                        <SelectTrigger className="w-[250px]">
                          <SelectValue placeholder="Seleziona Stagione" />
                        </SelectTrigger>
                        <SelectContent>
                          {seasons?.map((s: any, idx: number) => {
                            const isActiveFallback = s.active || (!seasons.find((x: any) => x.active) && idx === 0);
                            return (
                              <SelectItem key={s.id} value={isActiveFallback ? "active" : s.id.toString()} className={isActiveFallback ? "font-semibold" : ""}>
                                {getSeasonLabel(s, seasons)}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                           id="show-concluded-ws" 
                           checked={showConcludedSeasonsWS}
                           onCheckedChange={(checked) => setShowConcludedSeasonsWS(checked as boolean)}
                        />
                        <Label htmlFor="show-concluded-ws" className="cursor-pointer text-sm font-normal">Mostra stagioni concluse</Label>
                      </div>
                    </div>
                    
                    {filteredWorkshops && filteredWorkshops.length > 0 && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setExpandedWorkshops(filteredWorkshops.map(w => w.id.toString()))}>Espandi tutto</Button>
                        <Button variant="outline" size="sm" onClick={() => setExpandedWorkshops([])}>Comprimi tutto</Button>
                      </div>
                    )}
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
                  <Accordion type="multiple" value={expandedWorkshops} onValueChange={setExpandedWorkshops} className="space-y-4">
                    {filteredWorkshops.map((workshop) => {
                      const workshopEnrollments = getEnrollmentsForActivity(workshop.id, true);
                      return (
                        <ActivityAccordionCard
                          key={workshop.id}
                          id={workshop.id.toString()}
                          activity={workshop}
                          icon={Sparkles}
                          enrollmentsCount={workshopEnrollments.length}
                          badgeLabelPlural="iscritti"
                          badgeLabelSingular="iscritto"
                          linkHref={`/scheda-workshop?workshopId=${workshop.id}`}
                          testIdPrefix="scheda-workshop"
                        >
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
                        </ActivityAccordionCard>
                      );
                    })}
                  </Accordion>
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
                                        <TableHead>{item.id === 'allenamenti' ? 'Insegnante' : 'Dettagli'}</TableHead>
                                        <SortableTableHead sortKey="date" currentSort={activitySort} onSort={handleActivitySort}>Data Iscrizione</SortableTableHead>
                                        <TableHead className="text-right">Azioni</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {sortActivityItems(activityEnrollments, getSortValue).map((enroll: any) => {
                                        let instructorName = '-';
                                        if (item.id === 'allenamenti') {
                                           const n1 = enroll.courseInstructorName?.trim();
                                           const n2 = activity.courseInstructorName?.trim();
                                           const n3 = activity.instructorName?.trim();
                                           instructorName = [n1, n2, n3].find(n => !!n) || '-';
                                        }

                                        return (
                                        <TableRow key={enroll.id}>
                                          <TableCell className={cn("font-medium", isActivitySorted("lastName") && "sorted-column-cell")}>{enroll.memberLastName || '-'}</TableCell>
                                          <TableCell className={cn(isActivitySorted("firstName") && "sorted-column-cell")}>{enroll.memberFirstName || '-'}</TableCell>
                                          <TableCell className={cn(isActivitySorted("email") && "sorted-column-cell")}>{enroll.memberEmail || '-'}</TableCell>
                                          <TableCell>
                                            <span className="text-xs text-muted-foreground">
                                              {item.id === 'allenamenti' ? instructorName : '-'}
                                            </span>
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
                                        );
                                      })}
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
