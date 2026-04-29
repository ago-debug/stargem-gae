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
  Info
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
import type { Course, Member, Enrollment, Payment, Attendance } from "@shared/schema";

export default function SchedaCampus() {
    const [location, setLocation] = useLocation();
    const searchParams = new URLSearchParams(window.location.search);
    const courseIdRaw = searchParams.get("courseId");
    const courseId = Number(courseIdRaw);
    const hasValidId = Number.isFinite(courseId) && courseId > 0;

    const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
    const { data: enrolledMembersRaw, isLoading: enrolledMembersLoading } =
        useQuery<any[]>({
            queryKey: [`/api/courses/${courseId}/enrolled-members`],
            enabled: !!courseId,
        });
    const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({ queryKey: ["/api/payments"] });

    const { sortConfig, handleSort, sortItems, isSortedColumn } = useSortableTable<any>("lastName");
    
    if (coursesLoading || enrolledMembersLoading || paymentsLoading) {
        return (
            <div className="p-6 md:p-8 space-y-6 mx-auto">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    const item = courses?.find(c => c.id === courseId);

    if (!item || !hasValidId) {
        // Check if it's the generic container 2526ALLENAMENTO (which might not be returned if not valid? wait, generic container would be found in courses)
        // If not found at all:
        return (
            <div className="p-6 md:p-8 mx-auto">
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h1 className="text-2xl font-bold text-slate-800">Scheda Campus</h1>
                    <p className="text-slate-600 mt-2">Nessun corso trovato o parametro <code>courseId</code> non valido nell’URL.</p>
                    <div className="mt-4">
                        <Button variant="outline" onClick={() => window.history.back()}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Torna Indietro
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Check for generic container:
    if (item.sku === '2526ALLENAMENTO' || (item.sku && item.sku.startsWith('2526GENERICO'))) {
         return (
            <div className="p-6 md:p-8 mx-auto">
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h1 className="text-2xl font-bold text-slate-800">Scheda Campus</h1>
                    <p className="text-slate-600 mt-2">Nessun dato relazionale per questo contenitore generico ({item.sku}).</p>
                    <div className="mt-4">
                        <Button variant="outline" onClick={() => window.history.back()}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Torna Indietro
                        </Button>
                    </div>
                </div>
            </div>
        );
    }


        const enrolledMembersData = (enrolledMembersRaw || []).map((data: any) => {
        const hasPaidPayments = payments?.some((p: any) => p.status === 'paid' && Number(p.enrollmentId) === Number(data.enrollment_id));
        const hasAnyPayments = payments?.some((p: any) => Number(p.enrollmentId) === Number(data.enrollment_id));
        const paymentStatusBadge = hasPaidPayments ?
            <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 shadow-none border-0">Regolare</Badge> :
            (hasAnyPayments ?
                <Badge className="bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 shadow-none border-0">In Sospeso</Badge> :
                <Badge variant="outline" className="bg-slate-50 text-slate-500 shadow-none border-slate-200">Non Pagato</Badge>
            );

        return {
            ...data,
            paymentStatusBadge
        };
    });

    const getSortValue = (data: any, key: string) => {
        switch (key) {
            case "firstName": return data?.first_name || "";
            case "lastName": return data?.last_name || "";
            case "email": return data?.email || "";
            case "attendances": return Number(data?.presenze_count) || 0;
            default: return null;
        }
    };
    const sortedEnrolledMembersData = sortItems(enrolledMembersData, getSortValue);

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex flex-col gap-4 w-full">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => window.history.back()}
                                className="h-10 w-10 shrink-0 border-gold/30 hover:bg-gold/5 hover:text-gold"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="w-12 h-12 rounded-xl icon-gold-bg flex items-center justify-center shadow-md border border-gold/20 shrink-0">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-800 flex items-center gap-3">
                                    Scheda Campus {item ? `- ${item.name}` : ''}
                                </h1>
                            </div>
                        </div>
                    </div>
                    {item && (
                        
                                        <div className="flex flex-wrap gap-3 pt-2">
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {/* TODO Chat_Analisi: settimana campus — colonna esiste ma valore NULL nei record reali */}
                            Settimana: {(item.startDate || item.endDate) ? `${item.startDate ? new Date(item.startDate).toLocaleDateString('it-IT') : ''} - ${item.endDate ? new Date(item.endDate).toLocaleDateString('it-IT') : ''}` : <span className="text-muted-foreground italic" title="Campo presente nello schema DB ma non popolato. Smistare a Chat_Analisi.">— Da popolare</span>}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" />
                            Tipo Campus: {item.name || <span className="text-muted-foreground italic" title="Campo presente nello schema DB ma non popolato. Smistare a Chat_Analisi.">— Da popolare</span>}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {/* TODO Chat_Analisi: orari giornalieri campus — colonna esiste ma valore NULL nei record reali */}
                            Orari: {(item.startTime || item.endTime) ? `${item.startTime || 'N/A'} - ${item.endTime || 'N/A'}` : <span className="text-muted-foreground italic" title="Campo presente nello schema DB ma non popolato. Smistare a Chat_Analisi.">— Da popolare</span>}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5" title="Da configurare — vedi Chat_Analisi">
                            <Info className="w-3.5 h-3.5" />
                            Pasti/Extra: {/* TODO Chat_Analisi: pasti/extra Campus — richiede DB structure */}
                            <span className="text-muted-foreground italic" title="Campo presente nello schema DB ma non popolato. Smistare a Chat_Analisi.">— Modulo pasti da implementare (TODO Chat_Analisi)</span>
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5" title="Da configurare — vedi Chat_Analisi">
                            <Users className="w-3.5 h-3.5" />
                            Gruppo: {/* TODO Chat_Analisi: gruppo bambino Campus — richiede DB structure o uso di courses.level */}
                            <span className="text-muted-foreground italic" title="Campo presente nello schema DB ma non popolato. Smistare a Chat_Analisi.">— Modulo gruppi da implementare (TODO Chat_Analisi)</span>
                        </Badge>
                    </div>

                    )}
                </div>
            </div>

            <Card className="border-0 shadow-md ring-1 ring-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50 border-b border-slate-100">
                            <TableRow className="hover:bg-transparent">
                                <SortableTableHead sortKey="firstName" currentSort={sortConfig} onSort={handleSort} className="font-semibold text-slate-700 py-4 w-[20%]">Nome</SortableTableHead>
                                <SortableTableHead sortKey="lastName" currentSort={sortConfig} onSort={handleSort} className="font-semibold text-slate-700 py-4 w-[20%]">Cognome</SortableTableHead>

                                <TableHead className="font-semibold text-slate-700 py-4">Età / Genitore</TableHead>

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
                                            <p>Nessun iscritto trovato per questa attività.</p>
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
                                      membership_expiry_date,
                                      membership_status,
                                      medical_expiry_date,
                                      medical_status,
                                      presenze_count,
                                      paymentStatusBadge,
                                    } = data;
                                    const today = new Date();

                                    let cardExpiryText = <span className="text-slate-500 text-sm italic">Assente</span>;
                                    if (membership_expiry_date) {
                                        const expiryDate = new Date(membership_expiry_date);
                                        const isValidCardDate = !Number.isNaN(expiryDate.getTime());
                                        const isExpired = membership_status === "expired" || expiryDate < today;
                                        cardExpiryText = (
                                            <span className={`inline-flex items-center gap-1.5 font-medium ${isExpired ? 'text-red-600' : 'text-slate-700'}`}>
                                                {isExpired ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                                                {!isValidCardDate ? "Data non valida" : expiryDate.toLocaleDateString("it-IT")}
                                            </span>
                                        );
                                    }

                                    let certExpiryText = <Badge variant="outline" className="bg-slate-100 text-slate-500 hover:bg-slate-200 shadow-none border-0 gap-1"><XCircle className="w-3.5 h-3.5"/> Assente</Badge>;
                                    if (medical_expiry_date) {
                                        const expiryDate = new Date(medical_expiry_date);
                                        const isValidCertDate = !Number.isNaN(expiryDate.getTime());
                                        const isExpired = medical_status === "expired" || expiryDate < today;
                                        const warningDate = new Date();
                                        warningDate.setDate(today.getDate() + 30);
                                        const isWarning = !isExpired && expiryDate <= warningDate;

                                        if (isExpired) {
                                            certExpiryText = <Badge variant="destructive" className="bg-red-500/10 text-red-700 hover:bg-red-500/20 shadow-none border-0 gap-1"><XCircle className="w-3.5 h-3.5"/> Scaduto ({isValidCertDate ? expiryDate.toLocaleDateString("it-IT") : 'Data non valida'})</Badge>;
                                        } else if (isWarning) {
                                            certExpiryText = <Badge className="bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 shadow-none border-0 gap-1"><AlertTriangle className="w-3.5 h-3.5"/> In Scadenza ({isValidCertDate ? expiryDate.toLocaleDateString("it-IT") : 'Data non valida'})</Badge>;
                                        } else {
                                            certExpiryText = <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 shadow-none border-0 gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> Valido ({isValidCertDate ? expiryDate.toLocaleDateString("it-IT") : 'Data non valida'})</Badge>;
                                        }
                                    }

                                    return (
                                        <TableRow key={member_id} className="hover:bg-slate-50/80 transition-colors">
                                            <TableCell className={cn("font-medium text-slate-900", isSortedColumn("firstName") && "sorted-column-cell")}>
                                                <Link href={`/?memberId=${member_id}`} className="hover:underline cursor-pointer">
                                                    {first_name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className={cn("font-medium text-slate-900", isSortedColumn("lastName") && "sorted-column-cell")}>
                                                <Link href={`/?memberId=${member_id}`} className="hover:underline cursor-pointer">
                                                    {last_name}
                                                </Link>
                                            </TableCell>

                                            <TableCell className={cn("text-slate-600 text-sm", isSortedColumn("email") && "sorted-column-cell")}>
                                                <div className="flex flex-col">
                                                    <span>{email || '-'}</span>
                                                </div>
                                            </TableCell>

                                            <TableCell>{cardExpiryText}</TableCell>
                                            <TableCell>{certExpiryText}</TableCell>
                                            <TableCell className={cn("text-center", isSortedColumn("attendances") && "sorted-column-cell")}>
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-none border-0 font-semibold px-2.5">
                                                    {Number(presenze_count) || 0}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {paymentStatusBadge}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/?memberId=${member_id}`}>
                                                    <Button variant="ghost" size="sm" className="text-gold hover:text-gold-foreground hover:bg-gold/10 font-medium">
                                                        Profilo <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
