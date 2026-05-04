import { useState, useMemo } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  Building2,
  Calendar,
  FileText,
  CheckCircle2,
  CalendarRange,
  Tag,
  Clock,
  Users,
  ArrowLeft,
  ArrowRight,
  XCircle,
  AlertTriangle,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SortableTableHead,
  useSortableTable,
} from "@/components/sortable-table-head";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseUnifiedModal } from "@/components/CourseUnifiedModal";
import type {
  Course,
  Member,
  Enrollment,
  Payment,
  Attendance,
} from "@shared/schema";
import { buildEnrolledMembersData } from "@/lib/enrollments";

export default function SchedaAttivita() {
  const [location, setLocation] = useLocation();
  const [genderFilter, setGenderFilter] = useState<"all" | "M" | "F">("all");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const searchParams = new URLSearchParams(window.location.search);
  const courseIdRaw =
    searchParams.get("courseId") ||
    searchParams.get("workshopId") ||
    searchParams.get("campusId") ||
    searchParams.get("Id") ||
    searchParams.get("id");
  const courseId = Number(courseIdRaw);
  const hasValidCourseId = Number.isFinite(courseId) && courseId > 0;

  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses?seasonId=all"],
  });
  const { data: enrolledMembersRaw, isLoading: enrolledMembersLoading } =
    useQuery<any[]>({
      queryKey: [`/api/courses/${courseId}/enrolled-members`],
      enabled: !!courseId,
    });
  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });
  const { data: strategicEventsData, isLoading: strategicEventsLoading } =
    useQuery<any[]>({ queryKey: ["/api/strategic-events"] });

  const { sortConfig, handleSort, sortItems, isSortedColumn } =
    useSortableTable<any>("lastName");

  const closedDaysMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (!strategicEventsData) return map;
    strategicEventsData.forEach((e) => {
      const isClosedType = ["festivita", "chiusura", "ferie"].includes(
        e.eventType,
      );
      if (isClosedType && (e.affectsCalendar || e.affectsCalendar === 1)) {
        const eStart = e.startDate?.split("T")[0];
        const eEnd = (e.endDate || e.startDate)?.split("T")[0];
        if (eStart && eEnd) {
          const d = new Date(eStart);
          const end = new Date(eEnd);
          while (d <= end) {
            map[d.toISOString().split("T")[0]] = true;
            d.setDate(d.getDate() + 1);
          }
        }
      }
    });
    return map;
  }, [strategicEventsData]);

  const formatActivityType = (type?: string | null) => {
    if (!type) return "Attività";
    if (type === "corsi") return "Corso";
    if (type === "domeniche") return "Domenica in Movimento";
    if (type === "lezioni_individuali") return "Lezione Individuale";
    return type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ");
  };

  if (
    coursesLoading ||
    enrolledMembersLoading ||
    paymentsLoading ||
    strategicEventsLoading
  ) {
    return (
      <div className="mx-auto space-y-6 p-6 md:p-8">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!hasValidCourseId) {
    return (
      <div className="mx-auto p-6 md:p-8">
        <div className="rounded-xl border bg-background p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-foreground">
            Scheda Attività
          </h1>
          <p className="mt-2 text-muted-foreground">
            Parametro <code>courseId</code> mancante o non valido nell’URL.
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => setLocation("/iscritti_per_attivita")}
            >
              Torna a Iscritti per Attività
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const course = courses?.find((c) => c.id === courseId);

  if (!course) {
    return (
      <div className="mx-auto p-6 md:p-8">
        <div className="rounded-xl border bg-background p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-foreground">
            Scheda Attività
          </h1>
          <p className="mt-2 text-muted-foreground">
            Attività non trovata per <code>courseId={String(courseId)}</code>.
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => setLocation("/iscritti_per_attivita")}
            >
              Torna a Iscritti per Attività
            </Button>
          </div>
        </div>
      </div>
    );
  }

  let effettuate: number | null = null;
  let rimanenti: number | null = null;

  if (
    course &&
    course.totalOccurrences &&
    course.startDate &&
    course.endDate &&
    course.dayOfWeek
  ) {
    const todayStr = new Date().toISOString().split("T")[0];
    const dayMap: Record<string, number> = {
      LUN: 1,
      MAR: 2,
      MER: 3,
      GIO: 4,
      VEN: 5,
      SAB: 6,
      DOM: 0,
    };
    const targetDay = dayMap[course.dayOfWeek.toUpperCase()];

    if (targetDay !== undefined) {
      const start = new Date(
        (course.startDate as unknown as string).split("T")[0],
      );
      const end = new Date((course.endDate as unknown as string).split("T")[0]);
      const today = new Date(todayStr);

      let eff = 0;
      let rim = 0;

      const d = new Date(start);
      while (d <= end) {
        if (d.getDay() === targetDay) {
          const ds = d.toISOString().split("T")[0];
          if (!closedDaysMap[ds]) {
            if (d <= today) eff++;
            else rim++;
          }
        }
        d.setDate(d.getDate() + 1);
      }
      effettuate = eff;
      rimanenti = rim;
    }
  }

  const donneCount =
    enrolledMembersRaw?.filter(
      (m) =>
        m.gender?.trim().toUpperCase() === "F" ||
        m.gender?.trim().toUpperCase() === "D" ||
        m.gender?.trim().toUpperCase() === "DONNA",
    ).length || 0;
  const uominiCount =
    enrolledMembersRaw?.filter(
      (m) =>
        m.gender?.trim().toUpperCase() === "M" ||
        m.gender?.trim().toUpperCase() === "U" ||
        m.gender?.trim().toUpperCase() === "UOMO" ||
        m.gender?.trim().toUpperCase() === "MASCHIO",
    ).length || 0;

  const enrolledMembersData = (enrolledMembersRaw || []).map((data: any) => {
    const hasPaidPayments = payments?.some(
      (p: Payment) =>
        p.status === "paid" &&
        Number(p.enrollmentId) === Number(data.enrollment_id),
    );
    const hasAnyPayments = payments?.some(
      (p: Payment) => Number(p.enrollmentId) === Number(data.enrollment_id),
    );

    const paymentStatusBadge = hasPaidPayments ? (
      <Badge className="border-0 bg-green-500/10 text-green-700 shadow-none hover:bg-green-500/20">
        Regolare
      </Badge>
    ) : hasAnyPayments ? (
      <Badge
        variant="destructive"
        className="border-0 bg-red-500/10 text-red-700 shadow-none hover:bg-red-500/20"
      >
        In Sospeso
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="border-red-200 bg-red-50 text-red-500 shadow-none dark:border-red-900/50 dark:bg-red-950/20"
      >
        Dati Assenti
      </Badge>
    );

    return {
      ...data,
      paymentStatusBadge,
    };
  });

  const getSortValue = (data: any, key: string) => {
    if (!data) return "";
    switch (key) {
      case "firstName":
        return data?.first_name || "";
      case "lastName":
        return data?.last_name || "";
      case "email":
        return data?.email || "";
      case "phone":
        return data?.phone || "";
      case "attendances":
        return data?.presenze_count || 0;
      default:
        return null;
    }
  };
  const filteredEnrolledMembersData =
    genderFilter === "all"
      ? enrolledMembersData
      : enrolledMembersData.filter((data: any) => data.gender === genderFilter);
  const sortedEnrolledMembersData = sortItems(
    filteredEnrolledMembersData,
    getSortValue,
  );

  const tessereScadute =
    enrolledMembersRaw?.filter((m) => {
      if (!m.membership_expiry_date) return false;
      return new Date(m.membership_expiry_date) < new Date();
    }).length || 0;

  const certScaduti =
    enrolledMembersRaw?.filter((m) => m.medical_status === "expired").length ||
    0;

  const presenzeTotal =
    enrolledMembersRaw?.reduce(
      (sum, m) => sum + (Number(m.presenze_count) || 0),
      0,
    ) || 0;

  return (
    <div className="flex size-full flex-col overflow-hidden">
      {/* Header section without margins and white background */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-black/5 px-4 py-2">
        <div className="flex w-full flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setLocation("/iscritti_per_attivita")}
                className="border-gold/30 hover:bg-gold/5 hover:text-gold size-10 shrink-0"
              >
                <ArrowLeft className="size-5" />
              </Button>
              <div className="icon-gold-bg border-gold/20 flex size-12 shrink-0 items-center justify-center rounded-xl border shadow-md">
                <Users className="size-6 text-white" />
              </div>
              <div>
                <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-foreground">
                  Scheda {formatActivityType(course?.activityType)}{" "}
                  {course ? `- ${course.name}` : ""}
                </h1>
                <p className="mt-1 flex items-center gap-2 text-muted-foreground">
                  <span className="bg-gold inline-flex size-2 rounded-full"></span>
                  Visualizza presenze, pagamenti e scadenze degli iscritti
                </p>
              </div>
            </div>
            {course && (
              <Button
                variant="outline"
                className="shrink-0 gap-2 border-border text-muted-foreground hover:bg-muted"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit2 className="size-4" /> Modifica
              </Button>
            )}
          </div>

          {course && (
            <div className="flex flex-wrap gap-3 pt-2">
              <Badge
                variant="outline"
                className="flex cursor-pointer items-center gap-1.5 border-border bg-muted px-3 py-1 font-medium text-muted-foreground transition-colors hover:bg-slate-100 dark:bg-slate-800"
                onClick={() => {
                  if (course.sku)
                    setLocation(
                      `/calendario-attivita?highlightCourseId=${course.id}`,
                    );
                }}
              >
                <Tag className="size-3.5" />
                SKU: {course.sku || "N/A"}
              </Badge>
              {course.dayOfWeek && course.startTime && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1.5 border-border bg-muted px-3 py-1 font-medium text-muted-foreground"
                >
                  <Clock className="size-3.5" />
                  {course.dayOfWeek} {course.startTime} - {course.endTime}
                </Badge>
              )}
              {tessereScadute > 0 && (
                <span className="rounded bg-red-50 px-2 py-1 text-sm font-medium text-red-600 dark:bg-red-950/20">
                  🔴 {tessereScadute} tessere scadute
                </span>
              )}
              {certScaduti > 0 && (
                <span className="rounded bg-orange-50 px-2 py-1 text-sm font-medium text-orange-600">
                  🟡 {certScaduti} cert. scaduti
                </span>
              )}
              <button
                onClick={() =>
                  alert("Il Modulo Presenze sarà disponibile prossimamente.")
                }
                className="flex items-center gap-1 rounded-md border border-border bg-muted px-2.5 py-1 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-slate-100 dark:bg-slate-800"
              >
                ✅ {presenzeTotal} presenze
              </button>
              {course.totalOccurrences &&
                effettuate !== null &&
                rimanenti !== null && (
                  <>
                    <Badge
                      variant="outline"
                      className="flex cursor-pointer items-center gap-1.5 border-border bg-muted px-3 py-1 font-medium text-muted-foreground transition-colors hover:bg-slate-100 dark:bg-slate-800"
                      onClick={() => {
                        if (course.sku)
                          setLocation(
                            `/calendario-attivita?highlightCourseId=${course.id}`,
                          );
                      }}
                    >
                      📅 {effettuate} / {course.totalOccurrences} lezioni
                    </Badge>
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1.5 border-border bg-muted px-3 py-1 font-medium text-muted-foreground"
                    >
                      🔁 {rimanenti} rimanenti
                    </Badge>
                  </>
                )}
              <button
                onClick={() =>
                  setGenderFilter((prev) => (prev === "F" ? "all" : "F"))
                }
                className={`rounded px-3 py-1 text-sm font-medium transition-colors ${genderFilter === "F" ? "bg-pink-100 text-pink-700 ring-1 ring-pink-400" : "bg-pink-50 text-pink-600 hover:bg-pink-100"}`}
              >
                Donne {donneCount}
              </button>
              <button
                onClick={() =>
                  setGenderFilter((prev) => (prev === "M" ? "all" : "M"))
                }
                className={`rounded px-3 py-1 text-sm font-medium transition-colors ${genderFilter === "M" ? "bg-blue-100 text-blue-700 ring-1 ring-blue-400 dark:bg-blue-900/30" : "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:bg-blue-950/20"}`}
              >
                Uomini {uominiCount}
              </button>
              <Badge
                variant="outline"
                className="bg-gold/10 border-gold/30 text-gold-foreground flex items-center gap-1.5 px-3 py-1 font-medium"
              >
                <Users className="size-3.5" />
                {enrolledMembersData.length} iscritti attivi
              </Badge>
            </div>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col bg-muted/50 px-4 pb-4 pt-0 md:px-6 md:pb-6">
        <Card className="flex h-full flex-col overflow-hidden rounded-b-xl rounded-t-none border border-t-0 bg-background shadow-sm">
          <div className="relative min-h-0 flex-1 [&>div]:absolute [&>div]:inset-0 [&>div]:overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 border-b bg-muted shadow-sm">
                <TableRow className="hover:bg-transparent">
                  <SortableTableHead
                    sortKey="lastName"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="py-4 font-semibold text-foreground/80"
                  >
                    Cognome
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="firstName"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="py-4 font-semibold text-foreground/80"
                  >
                    Nome
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="phone"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="py-4 font-semibold text-foreground/80"
                  >
                    Cellulare
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="email"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="py-4 font-semibold text-foreground/80"
                  >
                    Email
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="enrollment_date"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="py-4 text-center font-semibold text-foreground/80"
                  >
                    Iscrizione
                  </SortableTableHead>
                  <TableHead className="py-4 font-semibold text-foreground/80">
                    Scadenza Tessera
                  </TableHead>
                  <TableHead className="py-4 font-semibold text-foreground/80">
                    Certificato Medico
                  </TableHead>
                  <SortableTableHead
                    sortKey="attendances"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="py-4 text-center font-semibold text-foreground/80"
                  >
                    Presenze
                  </SortableTableHead>
                  <TableHead className="py-4 text-center font-semibold text-foreground/80">
                    Pagamenti
                  </TableHead>
                  <TableHead className="py-4 text-right font-semibold text-foreground/80">
                    Azioni
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEnrolledMembersData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-12 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Users className="size-8 text-slate-300" />
                        <p>Nessun iscritto trovato per questo corso.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedEnrolledMembersData.map((data: any) => {
                    const {
                      member_id,
                      first_name,
                      last_name,
                      email,
                      phone,
                      enrollment_date,
                      membership_expiry_date,
                      membership_status,
                      medical_expiry_date,
                      medical_status,
                      presenze_count,
                      paymentStatusBadge,
                    } = data;
                    const today = new Date();

                    // Check card expiry
                    let cardExpiryText = (
                      <span className="text-sm italic text-muted-foreground">
                        Assente
                      </span>
                    );
                    if (membership_expiry_date) {
                      const expiryDate = new Date(membership_expiry_date);
                      const isValidCardDate = !Number.isNaN(
                        expiryDate.getTime(),
                      );
                      const isExpired =
                        membership_status === "expired" || expiryDate < today;

                      if (isExpired) {
                        cardExpiryText = (
                          <Badge
                            variant="destructive"
                            className="gap-1 border-0 bg-red-500/10 text-red-700 shadow-none hover:bg-red-500/20"
                          >
                            <XCircle className="size-3.5" /> Scaduta (
                            {isValidCardDate
                              ? expiryDate.toLocaleDateString("it-IT")
                              : ""}
                            )
                          </Badge>
                        );
                      } else {
                        cardExpiryText = (
                          <Badge className="gap-1 border-0 bg-green-500/10 text-green-700 shadow-none hover:bg-green-500/20">
                            <CheckCircle2 className="size-3.5" /> Valida (
                            {isValidCardDate
                              ? expiryDate.toLocaleDateString("it-IT")
                              : ""}
                            )
                          </Badge>
                        );
                      }
                    }

                    // Check med cert expiry
                    let certExpiryText = (
                      <Badge
                        variant="outline"
                        className="gap-1 border-0 bg-slate-100 text-muted-foreground shadow-none hover:bg-slate-200 dark:bg-slate-800"
                      >
                        <XCircle className="size-3.5" /> Assente
                      </Badge>
                    );
                    if (medical_expiry_date) {
                      const expiryDate = new Date(medical_expiry_date);
                      const formattedDate =
                        expiryDate.toLocaleDateString("it-IT");
                      if (medical_status === "valid") {
                        certExpiryText = (
                          <Badge className="gap-1 border-0 bg-green-500/10 text-green-700 shadow-none hover:bg-green-500/20">
                            <CheckCircle2 className="size-3.5" /> Valido (
                            {formattedDate})
                          </Badge>
                        );
                      } else if (
                        medical_status === "expiring_soon" ||
                        medical_status === "warning"
                      ) {
                        certExpiryText = (
                          <Badge className="gap-1 border-0 bg-yellow-500/10 text-yellow-700 shadow-none hover:bg-yellow-500/20">
                            <AlertTriangle className="size-3.5" /> In Scadenza (
                            {formattedDate})
                          </Badge>
                        );
                      } else if (medical_status === "expired") {
                        certExpiryText = (
                          <Badge
                            variant="destructive"
                            className="gap-1 border-0 bg-red-500/10 text-red-700 shadow-none hover:bg-red-500/20"
                          >
                            <XCircle className="size-3.5" /> Scaduto (
                            {formattedDate})
                          </Badge>
                        );
                      }
                    }

                    return (
                      <TableRow
                        key={member_id}
                        className="transition-colors hover:bg-muted/80"
                      >
                        <TableCell
                          className={cn(
                            "font-medium text-foreground",
                            isSortedColumn("lastName") && "sorted-column-cell",
                          )}
                        >
                          <Link
                            href={`/utente/${member_id}`}
                            className="cursor-pointer hover:underline"
                          >
                            {last_name}
                          </Link>
                        </TableCell>
                        <TableCell
                          className={cn(
                            "font-medium text-foreground",
                            isSortedColumn("firstName") && "sorted-column-cell",
                          )}
                        >
                          <Link
                            href={`/utente/${member_id}`}
                            className="cursor-pointer hover:underline"
                          >
                            {first_name}
                          </Link>
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-sm text-muted-foreground",
                            isSortedColumn("phone") && "sorted-column-cell",
                          )}
                        >
                          {phone || "-"}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-sm text-muted-foreground",
                            isSortedColumn("email") && "sorted-column-cell",
                          )}
                        >
                          {email || "-"}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-center text-xs text-muted-foreground",
                            isSortedColumn("enrollment_date") &&
                              "sorted-column-cell",
                          )}
                        >
                          {enrollment_date
                            ? new Date(enrollment_date).toLocaleString(
                                "it-IT",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : "-"}
                        </TableCell>
                        <TableCell>{cardExpiryText}</TableCell>
                        <TableCell>{certExpiryText}</TableCell>
                        <TableCell
                          className={cn(
                            "text-center",
                            isSortedColumn("attendances") &&
                              "sorted-column-cell",
                          )}
                        >
                          <Badge
                            variant="secondary"
                            className="border-0 bg-slate-100 px-2.5 font-semibold text-foreground/80 shadow-none hover:bg-slate-200 dark:bg-slate-800"
                          >
                            {presenze_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {paymentStatusBadge}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/utente/${member_id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gold hover:text-gold-foreground hover:bg-gold/10 font-medium"
                            >
                              Profilo Completo{" "}
                              <ArrowRight className="ml-1.5 size-3.5" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
      {course && (
        <CourseUnifiedModal
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          course={course}
          activityType="course"
        />
      )}
    </div>
  );
}
