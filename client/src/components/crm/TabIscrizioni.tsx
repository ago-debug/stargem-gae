import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, CreditCard, Gift, Sun, Dumbbell, UserCheck, Users, Award, Music, Building2, Globe, Trash2, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { KnowledgeInfo } from "@/components/knowledge-info";
import { Skeleton } from "@/components/ui/skeleton";
import { EnrollmentDetailBadge } from "@/components/multi-select-enrollment-details";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCrmForm } from "@/components/crm/CrmFormContext";

export function TabIscrizioni() {
  const { selectedMemberId } = useCrmForm();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses } = useQuery<any[]>({ queryKey: ["/api/courses"] });
  const { data: workshops } = useQuery<any[]>({ queryKey: ["/api/workshops"] });
  const { data: enrollmentDetails } = useQuery<any[]>({ queryKey: ["/api/enrollment-details"] });

  const { data: paidTrials } = useQuery<any[]>({ queryKey: ["/api/paid-trials"] });
  const { data: freeTrials } = useQuery<any[]>({ queryKey: ["/api/free-trials"] });
  const { data: singleLessons } = useQuery<any[]>({ queryKey: ["/api/single-lessons"] });
  const { data: sundayActivities } = useQuery<any[]>({ queryKey: ["/api/sunday-activities"] });
  const { data: trainings } = useQuery<any[]>({ queryKey: ["/api/trainings"] });
  const { data: individualLessons } = useQuery<any[]>({ queryKey: ["/api/individual-lessons"] });
  const { data: campusActivities } = useQuery<any[]>({ queryKey: ["/api/campus-activities"] });
  const { data: recitals } = useQuery<any[]>({ queryKey: ["/api/recitals"] });
  const { data: vacationStudies } = useQuery<any[]>({ queryKey: ["/api/vacation-studies"] });
  const { data: bookingServices } = useQuery<any[]>({ queryKey: ["/api/booking-services"] });

  // Member Enrollments Queries
  const { data: memberEnrollments, isLoading: loadingEnrollments } = useQuery<any[]>({
    queryKey: ["/api/enrollments?type=corsi", "member", selectedMemberId],
    queryFn: async () => {
      const res = await fetch(`/api/enrollments?type=corsi&memberId=${selectedMemberId}`);
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error("Errore caricamento iscrizioni");
      }
      return res.json();
    },
    enabled: !!selectedMemberId,
  });

  const { data: memberWorkshopEnrollments } = useQuery<any[]>({
    queryKey: ["/api/workshop-enrollments", "member", selectedMemberId],
    queryFn: async () => {
      const res = await fetch(`/api/workshop-enrollments?memberId=${selectedMemberId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedMemberId,
  });

  const { data: memberPtEnrollments } = useQuery<any[]>({ queryKey: ["/api/paid-trial-enrollments", "member", selectedMemberId], queryFn: async () => { const res = await fetch(`/api/paid-trial-enrollments?memberId=${selectedMemberId}`); if (!res.ok) return []; return res.json(); }, enabled: !!selectedMemberId });
  const { data: memberFtEnrollments } = useQuery<any[]>({ queryKey: ["/api/free-trial-enrollments", "member", selectedMemberId], queryFn: async () => { const res = await fetch(`/api/free-trial-enrollments?memberId=${selectedMemberId}`); if (!res.ok) return []; return res.json(); }, enabled: !!selectedMemberId });
  const { data: memberSlEnrollments } = useQuery<any[]>({ queryKey: ["/api/single-lesson-enrollments", "member", selectedMemberId], queryFn: async () => { const res = await fetch(`/api/single-lesson-enrollments?memberId=${selectedMemberId}`); if (!res.ok) return []; return res.json(); }, enabled: !!selectedMemberId });
  const { data: memberSaEnrollments } = useQuery<any[]>({ queryKey: ["/api/sunday-activity-enrollments", "member", selectedMemberId], queryFn: async () => { const res = await fetch(`/api/sunday-activity-enrollments?memberId=${selectedMemberId}`); if (!res.ok) return []; return res.json(); }, enabled: !!selectedMemberId });
  const { data: memberTrEnrollments } = useQuery<any[]>({ queryKey: ["/api/training-enrollments", "member", selectedMemberId], queryFn: async () => { const res = await fetch(`/api/training-enrollments?memberId=${selectedMemberId}`); if (!res.ok) return []; return res.json(); }, enabled: !!selectedMemberId });
  const { data: memberIlEnrollments } = useQuery<any[]>({ queryKey: ["/api/individual-lesson-enrollments", "member", selectedMemberId], queryFn: async () => { const res = await fetch(`/api/individual-lesson-enrollments?memberId=${selectedMemberId}`); if (!res.ok) return []; return res.json(); }, enabled: !!selectedMemberId });
  const { data: memberCaEnrollments } = useQuery<any[]>({ queryKey: ["/api/campus-enrollments", "member", selectedMemberId], queryFn: async () => { const res = await fetch(`/api/campus-enrollments?memberId=${selectedMemberId}`); if (!res.ok) return []; return res.json(); }, enabled: !!selectedMemberId });
  const { data: memberReEnrollments } = useQuery<any[]>({ queryKey: ["/api/recital-enrollments", "member", selectedMemberId], queryFn: async () => { const res = await fetch(`/api/recital-enrollments?memberId=${selectedMemberId}`); if (!res.ok) return []; return res.json(); }, enabled: !!selectedMemberId });
  const { data: memberVsEnrollments } = useQuery<any[]>({ queryKey: ["/api/vacation-study-enrollments", "member", selectedMemberId], queryFn: async () => { const res = await fetch(`/api/vacation-study-enrollments?memberId=${selectedMemberId}`); if (!res.ok) return []; return res.json(); }, enabled: !!selectedMemberId });
  const { data: memberServEnrollments } = useQuery<any[]>({
    queryKey: ["/api/booking-service-enrollments", "member", selectedMemberId],
    queryFn: async () => {
      const res = await fetch(`/api/booking-service-enrollments`);
      if (!res.ok) return [];
      const all = await res.json();
      return all.filter((e: any) => e.memberId === selectedMemberId);
    },
    enabled: !!selectedMemberId
  });

  const removeEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      await apiRequest("DELETE", `/api/enrollments/${enrollmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments?type=corsi", "member", selectedMemberId] });
      toast({ title: "Iscrizione corso rimossa" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore rimozione corso", description: error.message, variant: "destructive" });
    }
  });

  const removeWorkshopEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      await apiRequest("DELETE", `/api/workshop-enrollments/${enrollmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshop-enrollments", "member", selectedMemberId] });
      toast({ title: "Iscrizione workshop rimossa" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore rimozione workshop", description: error.message, variant: "destructive" });
    }
  });

  const createRemoveEnrollmentMutation = (endpoint: string, successMsg: string) => useMutation({
    mutationFn: async (enrollmentId: number) => {
      await apiRequest("DELETE", `/api/${endpoint}/${enrollmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${endpoint}`, "member", selectedMemberId] });
      toast({ title: successMsg });
    },
    onError: (error: Error) => {
      toast({ title: "Errore rimozione iscrizione", description: error.message, variant: "destructive" });
    }
  });

  const removePtEnrollmentMutation = createRemoveEnrollmentMutation("paid-trial-enrollments", "Prova a pagamento rimossa");
  const removeFtEnrollmentMutation = createRemoveEnrollmentMutation("free-trial-enrollments", "Prova gratuita rimossa");
  const removeSlEnrollmentMutation = createRemoveEnrollmentMutation("single-lesson-enrollments", "Lezione singola rimossa");
  const removeSaEnrollmentMutation = createRemoveEnrollmentMutation("sunday-activity-enrollments", "Domenica in movimento rimossa");
  const removeTrEnrollmentMutation = createRemoveEnrollmentMutation("training-enrollments", "Allenamento rimosso");
  const removeIlEnrollmentMutation = createRemoveEnrollmentMutation("individual-lesson-enrollments", "Lezione individuale rimossa");
  const removeCaEnrollmentMutation = createRemoveEnrollmentMutation("campus-enrollments", "Campus rimosso");
  const removeReEnrollmentMutation = createRemoveEnrollmentMutation("recital-enrollments", "Saggio rimosso");
  const removeVsEnrollmentMutation = createRemoveEnrollmentMutation("vacation-study-enrollments", "Vacanza studio rimossa");
  const removeServEnrollmentMutation = createRemoveEnrollmentMutation("booking-service-enrollments", "Servizio Extra rimosso");
  const dummyMutation = { mutate: () => toast({ title: "Funzione non attiva", description: "Utilizzare la sezione dedicata per il merchandising." }) };

  const SectionBadge = ({ count }: { count: number }) => {
    if (!count || count === 0) return null;
    return (
      <span className="ml-auto bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] border border-warning200" title={`${count} iscrizioni attive`}>
        {count}
      </span>
    );
  };

  const renderGenericEnrollmentList = (
    enrollments: any[] | undefined,
    baseData: any[] | undefined,
    mutation: any,
    emptyMessage: string,
    listTitle: string,
    entityLabel: string,
    foreignKey: string
  ) => {
    if (!selectedMemberId) {
      return (
        <div className="text-center p-4 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
          Seleziona un utente per gestire {entityLabel}
        </div>
      );
    }
    if (!Array.isArray(enrollments) || enrollments.length === 0) {
      return <p className="text-sm text-muted-foreground italic p-2">{emptyMessage}</p>;
    }
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{listTitle}</Label>
          {enrollments.map((e: any) => {
            const assoc = baseData?.find((item: any) => item.id === e[foreignKey]);
            const hasDetails = Array.isArray(e.details) && e.details.length > 0;
            return (
              <div key={e.id} className="grid grid-cols-[140px_180px_240px_1fr_auto] items-center p-2.5 bg-muted/20 border rounded-md group hover:bg-muted/40 transition-colors gap-3">
                <div className="font-bold text-sm truncate" title={assoc?.name}>{assoc?.name || 'Attività non trovata'}</div>
                <div className="font-medium text-xxs text-foreground truncate" title={assoc?.sku || undefined}>{assoc?.sku}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 truncate">
                  <span>Registrata il: {new Date(e.enrollmentDate || e.createdAt || new Date()).toLocaleDateString('it-IT')}</span>
                </div>
                <div className="flex items-center gap-1 overflow-hidden flex-1">
                  {hasDetails && e.details.map((detStr: string, idx: number) => {
                    const color = enrollmentDetails?.find((d: any) => d.name === detStr)?.color;
                    return <EnrollmentDetailBadge key={idx} name={detStr} color={color} className="h-5 py-0.5 px-2 text-xxs truncate max-w-[120px]" />;
                  })}
                </div>
                <div className="flex items-center justify-end gap-3 pl-2">
                  <Badge variant={e.status === 'active' ? 'default' : 'secondary'} className={e.status === 'active' ? 'bg-green-100 text-green-800 dark:text-green-400 hover:bg-green-200 border-green-300 text-xxs h-5' : 'text-xxs h-5'}>
                    {e.status === 'active' ? 'Attiva' : e.status || '?'}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => { if (confirm("Rimuovere questa riga?")) mutation.mutate(e.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>

    {/* ATTIVITÀ */}
        <Card id="attivita" className="scroll-mt-32">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5 sidebar-icon-gold" />
              Attività
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* CORSI */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-warning/50 dark:bg-warning/900/20 px-2 py-1 rounded flex items-center gap-2">
                <Calendar className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/corsi" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-corsi">Corsi</Link>
                <KnowledgeInfo id="corsi" />
                <SectionBadge count={memberEnrollments?.length || 0} />
              </h3>

              {!selectedMemberId ? (
                <div className="text-center p-4 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  Seleziona un utente per gestire le iscrizioni ai corsi
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Active Enrollments List (Read-Only) */}
                  {loadingEnrollments ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : Array.isArray(memberEnrollments) && memberEnrollments.length > 0 ? (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Iscrizioni Attive</Label>
                      {memberEnrollments.map((e: any) => {
                        const course = courses?.find((c: any) => c.id === e.courseId);
                        const hasDetails = Array.isArray(e.details) && e.details.length > 0;
                        return (
    <>

                          <div key={e.id} className="grid grid-cols-[130px_160px_180px_160px_1fr_auto] items-center p-2.5 bg-muted/20 border rounded-md group hover:bg-muted/40 transition-colors gap-3">

                            {/* Nome Corso */}
                            <div className="font-bold text-sm truncate" title={course?.name}>
                              {course?.name || 'Corso sconosciuto'}
                            </div>

                            {/* Codice Corso (SKU) */}
                            <div className="font-medium text-xxs text-foreground truncate" title={course?.sku || undefined}>
                              {course?.sku}
                            </div>

                            {/* Info Temporali */}
                            <div className="text-xs text-muted-foreground flex flex-col gap-0.5 truncate">
                              <span>Iscritto: {new Date(e.enrollmentDate).toLocaleDateString('it-IT')}</span>
                              {course?.dayOfWeek && <span>• {course.dayOfWeek} {course.startTime}</span>}
                            </div>
                            
                            {/* Dettagli Partecipazione (Modalità) */}
                            <div className="flex flex-col items-start gap-1 overflow-hidden">
                              {e.participationType === 'FREE_TRIAL' && <Badge variant="outline" className="text-xxs bg-green-50 text-green-700 border-green-200 font-medium">Prova Gratuita</Badge>}
                              {e.participationType === 'PAID_TRIAL' && <Badge variant="outline" className="text-xxs bg-amber-50 dark:bg-amber-950/20 text-amber-700 border-amber-200 dark:border-amber-900/50 font-medium">Prova a Pagamento</Badge>}
                              {e.participationType === 'SINGLE_LESSON' && <Badge variant="outline" className="text-xxs bg-purple-50 text-purple-700 border-purple-200 font-medium">Lezione Singola</Badge>}
                              {(!e.participationType || e.participationType === 'STANDARD_COURSE') && <Badge variant="outline" className="text-xxs bg-blue-50 dark:bg-blue-950/20 text-blue-700 border-blue-200 font-medium">Iscrizione Standard</Badge>}
                              
                              {e.targetDate && (
                                <span className="text-xxs text-muted-foreground flex items-center gap-1 font-medium mt-0.5">
                                  <Calendar className="w-2.5 h-2.5"/>
                                  {new Date(e.targetDate).toLocaleDateString('it-IT')}
                                </span>
                              )}
                            </div>

                            {/* Dettagli Opzionali (Note Extra) */}
                            <div className="flex items-center gap-1 overflow-hidden flex-1">
                              {hasDetails && e.details.map((detStr: string, idx: number) => {
                                const color = enrollmentDetails?.find(d => d.name === detStr)?.color;
                                return (
    <>

                                  <EnrollmentDetailBadge
                                    key={idx}
                                    name={detStr}
                                    color={color}
                                    className="h-5 py-0.5 px-2 text-xxs truncate max-w-[120px]"
                                  />
                                  </>
  );
                              })}
                            </div>

                            {/* Stato e Azioni */}
                            <div className="flex items-center justify-end gap-3 pl-2">
                              <Badge variant={e.status === 'active' ? 'default' : 'secondary'} className={e.status === 'active' ? 'bg-green-100 text-green-800 dark:text-green-400 hover:bg-green-200 border-green-300 text-xxs h-5' : 'text-xxs h-5'}>
                                {e.status === 'active' ? 'Attivo' : e.status}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  if (confirm("Rimuovere l'iscrizione a questo corso?")) {
                                    removeEnrollmentMutation.mutate(e.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>

                          </div>
                          </>
  );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic p-2">Nessuna iscrizione attiva.</p>
                  )}


                </div>
              )}
            </div>

            {/* PROVE A PAGAMENTO */}
            <div className="opacity-75 grayscale-[20%]">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-muted/30 px-2 py-1 rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground line-through decoration-muted-foreground/50">Prove a Pagamento</span>
                </div>
                <Badge variant="outline" className="text-xxs bg-amber-50 dark:bg-amber-950/20 text-amber-700 border-amber-200 dark:border-amber-900/50 font-normal">Sola Lettura (Usa modulo Corsi)</Badge>
              </h3>
              {renderGenericEnrollmentList(memberPtEnrollments, paidTrials, removePtEnrollmentMutation, "Nessuna prova a pagamento registrata.", "Storico Prove a Pagamento", "le prove a pagamento", "paidTrialId")}
            </div>

            {/* PROVE GRATUITE */}
            <div className="opacity-75 grayscale-[20%]">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-muted/30 px-2 py-1 rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground line-through decoration-muted-foreground/50">Prove Gratuite</span>
                </div>
                <Badge variant="outline" className="text-xxs bg-amber-50 dark:bg-amber-950/20 text-amber-700 border-amber-200 dark:border-amber-900/50 font-normal">Sola Lettura (Usa modulo Corsi)</Badge>
              </h3>
              {renderGenericEnrollmentList(memberFtEnrollments, freeTrials, removeFtEnrollmentMutation, "Nessuna prova gratuita registrata.", "Storico Prove Gratuite", "le prove gratuite", "freeTrialId")}
            </div>

            {/* LEZIONI SINGOLE */}
            <div className="opacity-75 grayscale-[20%]">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-muted/30 px-2 py-1 rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground line-through decoration-muted-foreground/50">Lezioni Singole</span>
                </div>
                <Badge variant="outline" className="text-xxs bg-amber-50 dark:bg-amber-950/20 text-amber-700 border-amber-200 dark:border-amber-900/50 font-normal">Sola Lettura (Usa modulo Corsi)</Badge>
              </h3>
              {renderGenericEnrollmentList(memberSlEnrollments, singleLessons, removeSlEnrollmentMutation, "Nessuna lezione singola registrata.", "Storico Lezioni Singole", "le lezioni singole", "singleLessonId")}
            </div>

            {/* WORKSHOP */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-warning/50 dark:bg-warning/900/20 px-2 py-1 rounded flex items-center gap-2">
                <Calendar className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/workshop" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-workshop">Workshop</Link>
                <KnowledgeInfo id="workshop" />
                <SectionBadge count={memberWorkshopEnrollments?.length || 0} />
              </h3>

              {renderGenericEnrollmentList(memberWorkshopEnrollments, workshops, removeWorkshopEnrollmentMutation, "Nessun workshop registrato.", "Workshop Registrati", "i workshop", "workshopId")}
            </div>

            {/* DOMENICHE IN MOVIMENTO */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-warning/50 dark:bg-warning/900/20 px-2 py-1 rounded flex items-center gap-2">
                <Sun className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/domeniche-movimento" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-domeniche-movimento">Domeniche in Movimento</Link>
                <KnowledgeInfo id="domeniche-in-movimento" />
                <SectionBadge count={memberSaEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberSaEnrollments, sundayActivities, removeSaEnrollmentMutation, "Nessuna domenica in movimento registrata.", "Domeniche in Movimento Registrate", "le domeniche in movimento", "sundayActivityId")}
            </div>

            {/* ALLENAMENTI */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-warning/50 dark:bg-warning/900/20 px-2 py-1 rounded flex items-center gap-2">
                <Dumbbell className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/allenamenti" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-allenamenti">Allenamenti</Link>
                <KnowledgeInfo id="allenamenti" />
                <SectionBadge count={memberTrEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberTrEnrollments, trainings, removeTrEnrollmentMutation, "Nessun allenamento registrato.", "Allenamenti Registrati", "gli allenamenti", "trainingId")}
            </div>

            {/* AFFITTI */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-warning/50 dark:bg-warning/900/20 px-2 py-1 rounded flex items-center gap-2">
                <Building2 className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/prenotazioni-sale" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-affitti">Affitti</Link>
                <KnowledgeInfo id="affitti" />
              </h3>
              {renderGenericEnrollmentList([], [], dummyMutation, "Nessun affitto sala registrato.", "Affitti Registrati", "gli affitti", "affittiId")}
            </div>

            {/* LEZIONI INDIVIDUALI */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-warning/50 dark:bg-warning/900/20 px-2 py-1 rounded flex items-center gap-2">
                <UserCheck className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/lezioni-individuali" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-lezioni-individuali">Lezioni Individuali</Link>
                <KnowledgeInfo id="lezioni-individuali" />
                <SectionBadge count={memberIlEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberIlEnrollments, individualLessons, removeIlEnrollmentMutation, "Nessuna lezione individuale registrata.", "Lezioni Individuali Registrate", "le lezioni individuali", "individualLessonId")}
            </div>

            {/* CAMPUS */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-warning/50 dark:bg-warning/900/20 px-2 py-1 rounded flex items-center gap-2">
                <Users className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/campus" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-campus">Campus</Link>
                <KnowledgeInfo id="campus" />
                <SectionBadge count={memberCaEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberCaEnrollments, campusActivities, removeCaEnrollmentMutation, "Nessun campus registrato.", "Campus Registrati", "i campus", "campusActivityId")}
            </div>

            {/* SAGGI */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-warning/50 dark:bg-warning/900/20 px-2 py-1 rounded flex items-center gap-2">
                <Award className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/saggi" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-saggi">Saggi</Link>
                <KnowledgeInfo id="saggi" />
                <SectionBadge count={memberReEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberReEnrollments, recitals, removeReEnrollmentMutation, "Nessun saggio registrato.", "Saggi Registrati", "i saggi", "recitalId")}
            </div>

            {/* VACANZA STUDIO */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-warning/50 dark:bg-warning/900/20 px-2 py-1 rounded flex items-center gap-2">
                <Music className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/vacanze-studio" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-vacanze-studio">Vacanze Studio</Link>
                <KnowledgeInfo id="vacanze-studio" />
                <SectionBadge count={memberVsEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberVsEnrollments, vacationStudies, removeVsEnrollmentMutation, "Nessuna vacanza studio registrata.", "Vacanze Studio Registrate", "le vacanze studio", "vacationStudyId")}
            </div>

            {/* MERCHANDISING */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-warning/50 dark:bg-warning/900/20 px-2 py-1 rounded flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/merchandising" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-merchandising">Merchandising</Link>
                <KnowledgeInfo id="merchandising" />
              </h3>
              {renderGenericEnrollmentList([], [], dummyMutation, "Nessun articolo di merchandising registrato.", "Merchandising Registrato", "il merchandising", "merchandisingId")}
            </div>

            {/* EVENTI ESTERNI */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-warning/50 dark:bg-warning/900/20 px-2 py-1 rounded flex items-center gap-2">
                <Globe className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/servizi" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-eventi-esterni">Eventi Esterni</Link>
                <KnowledgeInfo id="eventi-esterni" />
                <SectionBadge count={memberServEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberServEnrollments, bookingServices, removeServEnrollmentMutation, "Nessun evento esterno registrato.", "Eventi Esterni Registrati", "gli eventi esterni", "serviceId")}
            </div>
          </CardContent>
        </Card>
    </>
  );
}
