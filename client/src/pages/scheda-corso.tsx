import { useState, useMemo } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
    Building2, Calendar, FileText, CheckCircle2,
    CalendarRange, Tag, Clock, Users, ArrowLeft, ArrowRight, XCircle, AlertTriangle, Edit2
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
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Course, Member, Enrollment, Payment, Attendance } from "@shared/schema";
import { buildEnrolledMembersData } from "@/lib/enrollments";

export default function SchedaCorso() {
    const [location, setLocation] = useLocation();
    const [genderFilter, setGenderFilter] = useState<"all" | "M" | "F">("all");
    const searchParams = new URLSearchParams(window.location.search);
    const courseIdRaw = searchParams.get("courseId");
    const courseId = Number(courseIdRaw);
    const hasValidCourseId = Number.isFinite(courseId) && courseId > 0;

    const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
        const { data: enrolledMembersRaw, isLoading: enrolledMembersLoading } = useQuery<any[]>({
        queryKey: [`/api/courses/${courseId}/enrolled-members`],
        enabled: !!courseId
    });
    const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({ queryKey: ["/api/payments"] });
        const { data: strategicEventsData, isLoading: strategicEventsLoading } = useQuery<any[]>({ queryKey: ["/api/strategic-events"] });

    const { sortConfig, handleSort, sortItems, isSortedColumn } = useSortableTable<any>("lastName");

    const closedDaysMap = useMemo(() => {
        const map: Record<string, boolean> = {};
        if (!strategicEventsData) return map;
        strategicEventsData.forEach(e => {
            const isClosedType = ['festivita','chiusura','ferie'].includes(e.eventType);
            if (isClosedType && (e.affectsCalendar || e.affectsCalendar === 1)) {
                const eStart = e.startDate?.split('T')[0];
                const eEnd = (e.endDate || e.startDate)?.split('T')[0];
                if (eStart && eEnd) {
                    let d = new Date(eStart);
                    const end = new Date(eEnd);
                    while (d <= end) {
                        map[d.toISOString().split('T')[0]] = true;
                        d.setDate(d.getDate() + 1);
                    }
                }
            }
        });
        return map;
    }, [strategicEventsData]);

    if (coursesLoading || enrolledMembersLoading || paymentsLoading || strategicEventsLoading) {
        return (
            <div className="p-6 md:p-8 space-y-6 mx-auto">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    if (!hasValidCourseId) {
        return (
            <div className="p-6 md:p-8 mx-auto">
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h1 className="text-2xl font-bold text-slate-800">Scheda Corso</h1>
                    <p className="text-slate-600 mt-2">Parametro <code>courseId</code> mancante o non valido nell’URL.</p>
                    <div className="mt-4">
                        <Button variant="outline" onClick={() => setLocation("/iscritti_per_attivita")}>
                            Torna a Iscritti per Attività
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const course = courses?.find(c => c.id === courseId);

    if (!course) {
        return (
            <div className="p-6 md:p-8 mx-auto">
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h1 className="text-2xl font-bold text-slate-800">Scheda Corso</h1>
                    <p className="text-slate-600 mt-2">Corso non trovato per <code>courseId={String(courseId)}</code>.</p>
                    <div className="mt-4">
                        <Button variant="outline" onClick={() => setLocation("/iscritti_per_attivita")}>
                            Torna a Iscritti per Attività
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    let effettuate: number | null = null;
    let rimanenti: number | null = null;

    if (course && course.totalOccurrences && course.startDate && course.endDate && course.dayOfWeek) {
        const todayStr = new Date().toISOString().split('T')[0];
        const dayMap: Record<string, number> = { 'LUN': 1, 'MAR': 2, 'MER': 3, 'GIO': 4, 'VEN': 5, 'SAB': 6, 'DOM': 0 };
        const targetDay = dayMap[course.dayOfWeek.toUpperCase()];

        if (targetDay !== undefined) {
            const start = new Date((course.startDate as unknown as string).split('T')[0]);
            const end = new Date((course.endDate as unknown as string).split('T')[0]);
            const today = new Date(todayStr);

            let eff = 0;
            let rim = 0;

            let d = new Date(start);
            while (d <= end) {
                if (d.getDay() === targetDay) {
                    const ds = d.toISOString().split('T')[0];
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

    const donneCount = enrolledMembersRaw?.filter(m => m.gender === 'F').length || 0;
    const uominiCount = enrolledMembersRaw?.filter(m => m.gender === 'M').length || 0;

    const enrolledMembersData = (enrolledMembersRaw || []).map((data: any) => {
        const hasPaidPayments = payments?.some((p: Payment) => p.status === 'paid' && Number(p.enrollmentId) === Number(data.enrollment_id));
        const hasAnyPayments = payments?.some((p: Payment) => Number(p.enrollmentId) === Number(data.enrollment_id));

        const paymentStatusBadge = hasPaidPayments ?
            <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 shadow-none border-0">Regolare</Badge> :
            (hasAnyPayments ?
                <Badge variant="destructive" className="bg-red-500/10 text-red-700 hover:bg-red-500/20 shadow-none border-0">In Sospeso</Badge> :
                <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30 shadow-none">Dati Assenti</Badge>);

        return {
            ...data,
            paymentStatusBadge
        };
    });

    const getSortValue = (data: any, key: string) => {
        if (!data) return "";
        switch (key) {
            case "firstName": return data?.first_name || "";
            case "lastName": return data?.last_name || "";
            case "email": return data?.email || "";
            case "attendances": return data?.presenze_count || 0;
            default: return null;
        }
    };
    const filteredEnrolledMembersData = genderFilter === "all" ? enrolledMembersData : enrolledMembersData.filter((data: any) => data.gender === genderFilter);
    const sortedEnrolledMembersData = sortItems(filteredEnrolledMembersData, getSortValue);

    const tessereScadute = enrolledMembersRaw?.filter(m => {
        if (!m.membership_expiry_date) return false;
        return new Date(m.membership_expiry_date) < new Date();
    }).length || 0;

    const certScaduti = enrolledMembersRaw?.filter(m =>
        m.medical_status === 'expired'
    ).length || 0;

    const presenzeTotal = enrolledMembersRaw?.reduce(
        (sum, m) => sum + (Number(m.presenze_count) || 0), 0
    ) || 0;

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-[1400px] mx-auto">
            {/* Header section with styling adapted from standard category pages */}
            <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex flex-col gap-4 w-full">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setLocation("/iscritti_per_attivita")}
                                className="h-10 w-10 shrink-0 border-gold/30 hover:bg-gold/5 hover:text-gold"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="w-12 h-12 rounded-xl icon-gold-bg flex items-center justify-center shadow-md border border-gold/20 shrink-0">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-800 flex items-center gap-3">
                                    Scheda Corso {course ? `- ${course.name}` : ''}
                                </h1>
                                <p className="text-slate-500 mt-1 flex items-center gap-2">
                                    <span className="inline-flex h-2 w-2 rounded-full bg-gold"></span>
                                    Visualizza presenze, pagamenti e scadenze degli iscritti
                                </p>
                            </div>
                        </div>
                        {course && (
                            <Button 
                                variant="outline" 
                                className="gap-2 shrink-0 border-slate-200 hover:bg-slate-50 text-slate-600"
                                onClick={() => setLocation(`/attivita/corsi?editId=${course.id}`)}
                            >
                                <Edit2 className="w-4 h-4" /> Modifica
                            </Button>
                        )}
                    </div>

                    {course && (
                        <div className="flex flex-wrap gap-3 pt-2">
                            <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5" />
                                SKU: {course.sku || 'N/A'}
                            </Badge>
                            {course.dayOfWeek && course.startTime && (
                                <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    {course.dayOfWeek} {course.startTime} - {course.endTime}
                                </Badge>
                            )}
                            <Badge variant="outline" className="bg-gold/10 border-gold/30 text-gold-foreground font-medium px-3 py-1 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" />
                                {enrolledMembersData.length} iscritti attivi
                            </Badge>
                            {tessereScadute > 0 && (
                                <span className="text-red-600 text-sm font-medium bg-red-50 px-2 py-1 rounded">
                                    🔴 {tessereScadute} tessere scadute
                                </span>
                            )}
                            {certScaduti > 0 && (
                                <span className="text-orange-600 text-sm font-medium bg-orange-50 px-2 py-1 rounded">
                                    🟡 {certScaduti} cert. scaduti
                                </span>
                            )}
                            <span className="text-slate-600 text-sm bg-slate-50 px-2 py-1 rounded">
                                ✅ {presenzeTotal} presenze
                            </span>
                            {course.totalOccurrences && effettuate !== null && rimanenti !== null && (
                                <>
                                    <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5">
                                        📅 {effettuate} / {course.totalOccurrences} lezioni
                                    </Badge>
                                    <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5">
                                        🔁 {rimanenti} rimanenti
                                    </Badge>
                                </>
                            )}
                            <button 
                                onClick={() => setGenderFilter(prev => prev === "F" ? "all" : "F")}
                                className={`text-sm font-medium px-3 py-1 rounded transition-colors ${genderFilter === "F" ? "bg-pink-100 text-pink-700 ring-1 ring-pink-400" : "bg-pink-50 text-pink-600 hover:bg-pink-100"}`}
                            >
                                Donne {donneCount}
                            </button>
                            <button 
                                onClick={() => setGenderFilter(prev => prev === "M" ? "all" : "M")}
                                className={`text-sm font-medium px-3 py-1 rounded transition-colors ${genderFilter === "M" ? "bg-blue-100 text-blue-700 ring-1 ring-blue-400" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
                            >
                                Uomini {uominiCount}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <Card className="border-0 shadow-md ring-1 ring-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/80 border-b">
                            <TableRow className="hover:bg-transparent">
                                <SortableTableHead sortKey="firstName" currentSort={sortConfig} onSort={handleSort} className="font-semibold text-slate-700 py-4">Nome</SortableTableHead>
                                <SortableTableHead sortKey="lastName" currentSort={sortConfig} onSort={handleSort} className="font-semibold text-slate-700 py-4">Cognome</SortableTableHead>
                                <SortableTableHead sortKey="email" currentSort={sortConfig} onSort={handleSort} className="font-semibold text-slate-700 py-4">Email</SortableTableHead>
                                <TableHead className="font-semibold text-slate-700 py-4">Scadenza Tessera</TableHead>
                                <TableHead className="font-semibold text-slate-700 py-4">Certificato Medico</TableHead>
                                <SortableTableHead sortKey="attendances" currentSort={sortConfig} onSort={handleSort} className="font-semibold text-slate-700 py-4 text-center">Presenze</SortableTableHead>
                                <TableHead className="font-semibold text-slate-700 py-4 text-center">Pagamenti</TableHead>
                                <TableHead className="font-semibold text-slate-700 py-4 text-right">Azioni</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedEnrolledMembersData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Users className="h-8 w-8 text-slate-300" />
                                            <p>Nessun iscritto trovato per questo corso.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedEnrolledMembersData.map((data: any) => {
                                    const {
                                        member_id, first_name, last_name, email,
                                        membership_expiry_date, membership_status,
                                        medical_expiry_date, medical_status,
                                        presenze_count, paymentStatusBadge
                                    } = data;
                                    const today = new Date();

                                    // Check card expiry
                                    let cardExpiryText = <span className="text-slate-500 text-sm italic">Assente</span>;
                                    if (membership_expiry_date) {
                                        const expiryDate = new Date(membership_expiry_date);
                                        const isValidCardDate = !Number.isNaN(expiryDate.getTime());
                                        const isExpired = membership_status === 'expired' || expiryDate < today;
                                        
                                        if (isExpired) {
                                            cardExpiryText = <Badge variant="destructive" className="bg-red-500/10 text-red-700 hover:bg-red-500/20 shadow-none border-0 gap-1"><XCircle className="w-3.5 h-3.5" /> Scaduta ({isValidCardDate ? expiryDate.toLocaleDateString("it-IT") : ''})</Badge>;
                                        } else {
                                            cardExpiryText = <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 shadow-none border-0 gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Valida ({isValidCardDate ? expiryDate.toLocaleDateString("it-IT") : ''})</Badge>;
                                        }
                                    }

                                    // Check med cert expiry
                                    let certExpiryText = <Badge variant="outline" className="bg-slate-100 text-slate-500 hover:bg-slate-200 shadow-none border-0 gap-1"><XCircle className="w-3.5 h-3.5" /> Assente</Badge>;
                                    if (medical_expiry_date) {
                                        const expiryDate = new Date(medical_expiry_date);
                                        const formattedDate = expiryDate.toLocaleDateString("it-IT");
                                        if (medical_status === 'valid') {
                                            certExpiryText = <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 shadow-none border-0 gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Valido ({formattedDate})</Badge>;
                                        } else if (medical_status === 'expiring_soon' || medical_status === 'warning') {
                                            certExpiryText = <Badge className="bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 shadow-none border-0 gap-1"><AlertTriangle className="w-3.5 h-3.5" /> In Scadenza ({formattedDate})</Badge>;
                                        } else if (medical_status === 'expired') {
                                            certExpiryText = <Badge variant="destructive" className="bg-red-500/10 text-red-700 hover:bg-red-500/20 shadow-none border-0 gap-1"><XCircle className="w-3.5 h-3.5" /> Scaduto ({formattedDate})</Badge>;
                                        }
                                    }

                                    return (
                                        <TableRow key={member_id} className="hover:bg-slate-50/80 transition-colors">
                                            <TableCell className={cn("font-medium text-slate-900", isSortedColumn("firstName") && "sorted-column-cell")}>
                                                <Link href={`/anagrafica/${member_id}`} className="hover:underline cursor-pointer">
                                                    {first_name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className={cn("font-medium text-slate-900", isSortedColumn("lastName") && "sorted-column-cell")}>
                                                <Link href={`/anagrafica/${member_id}`} className="hover:underline cursor-pointer">
                                                    {last_name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className={cn("text-slate-600 text-sm", isSortedColumn("email") && "sorted-column-cell")}>{email || '-'}</TableCell>
                                            <TableCell>{cardExpiryText}</TableCell>
                                            <TableCell>{certExpiryText}</TableCell>
                                            <TableCell className={cn("text-center", isSortedColumn("attendances") && "sorted-column-cell")}>
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-none border-0 font-semibold px-2.5">
                                                    {presenze_count}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {paymentStatusBadge}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/anagrafica/${member_id}`}>
                                                    <Button variant="ghost" size="sm" className="text-gold hover:text-gold-foreground hover:bg-gold/10 font-medium">
                                                        Profilo Completo <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
    );
}
