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

export default function SchedaDomenica() {
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
                    <h1 className="text-2xl font-bold text-slate-800">Scheda Domenica in Movimento</h1>
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
                    <h1 className="text-2xl font-bold text-slate-800">Scheda Domenica in Movimento</h1>
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


    const enrolledMembersData = (enrolledMembersRaw || []).map((data: { member: Member, enrollment: Enrollment, payments: Payment[], attendances: Attendance[] }) => {
        const hasPaidPayments = data?.payments?.some((p: Payment) => p.status === 'paid');
        const paymentStatusBadge = hasPaidPayments ?
            <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 shadow-none">Regolare</Badge> :
            (data?.payments?.length > 0 ?
                <Badge className="bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 shadow-none">Parziale/In Sospeso</Badge> :
                <Badge variant="outline" className="bg-slate-50 text-slate-500 shadow-none border-slate-200">Non Pagato</Badge>
            );

        let medicalCertStatus = 'missing';
        let medicalCertFormattedDate = '';
        if (data.member.medicalCertificateExpiry) {
            const certDate = new Date(data.member.medicalCertificateExpiry);
            if (!Number.isNaN(certDate.getTime())) {
                medicalCertFormattedDate = certDate.toLocaleDateString("it-IT");
                const today = new Date();
                const warningDate = new Date();
                warningDate.setDate(today.getDate() + 30);
                if (certDate < today) {
                    medicalCertStatus = 'expired';
                } else if (certDate <= warningDate) {
                    medicalCertStatus = 'warning';
                } else {
                    medicalCertStatus = 'valid';
                }
            }
        }

        return {
            ...data,
            paymentStatusBadge,
            medicalCertStatus,
            medicalCertFormattedDate
        };
    });

    const getSortValue = (data: any, key: string) => {
        switch (key) {
            case "firstName": return data?.member?.firstName || "";
            case "lastName": return data?.member?.lastName || "";
            case "email": return data?.member?.email || "";
            case "attendances": return data?.attendances?.length || 0;
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
                                    Scheda Domenica in Movimento {item ? `- ${item.name}` : ''}
                                </h1>
                            </div>
                        </div>
                    </div>
                    {item && (
                        
                                        <div className="flex flex-wrap gap-3 pt-2">
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            Data: {item.startDate ? new Date(item.startDate).toLocaleDateString('it-IT') : <span className="text-muted-foreground italic" title="Campo presente nello schema DB ma non popolato. Smistare a Chat_Analisi.">— Da popolare</span>}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" />
                            Tipo: {item.name || <span className="text-muted-foreground italic" title="Campo presente nello schema DB ma non popolato. Smistare a Chat_Analisi.">— Da popolare</span>}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            {/* TODO Chat_Analisi: insegnante domenica — colonna esiste ma valore NULL nei record reali */}
                            Insegnante: {item.instructorId || <span className="text-muted-foreground italic" title="Campo presente nello schema DB ma non popolato. Smistare a Chat_Analisi.">— Insegnante da assegnare</span>} 
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            {/* TODO Chat_Analisi: sala domenica — colonna esiste ma valore NULL nei record reali */}
                            Studio/Sala: {item.studioId || <span className="text-muted-foreground italic" title="Campo presente nello schema DB ma non popolato. Smistare a Chat_Analisi.">— Sala da assegnare</span>}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5" title="Da configurare — vedi Chat_Analisi">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Presenze: {/* TODO Chat_Analisi: stato presenze domenica — richiede tabella attendances o struttura dedicata */} 
                            <span className="text-muted-foreground italic" title="Campo presente nello schema DB ma non popolato. Smistare a Chat_Analisi.">— Modulo presenze in attesa di configurazione (Chat_Analisi)</span>
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

                                <SortableTableHead sortKey="email" currentSort={sortConfig} onSort={handleSort} className="font-semibold text-slate-700 py-4 w-[25%]">Email/Telefono</SortableTableHead>

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
                                sortedEnrolledMembersData.map(({ member, attendances, paymentStatusBadge, medicalCertStatus, medicalCertFormattedDate }: any) => {
                                    const today = new Date();

                                    let cardExpiryText = <span className="text-slate-500 text-sm italic">Assente</span>;
                                    if (member.cardExpiryDate) {
                                        const expiryDate = new Date(member.cardExpiryDate);
                                        const isValidCardDate = !Number.isNaN(expiryDate.getTime());
                                        const isExpired = isValidCardDate && expiryDate < today;
                                        cardExpiryText = (
                                            <span className={`inline-flex items-center gap-1.5 font-medium ${isExpired ? 'text-red-600' : 'text-slate-700'}`}>
                                                {isExpired ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                                                {!isValidCardDate ? "Data non valida" : expiryDate.toLocaleDateString("it-IT")}
                                            </span>
                                        );
                                    }

                                    let certExpiryText = <Badge variant="outline" className="bg-slate-100 text-slate-500 hover:bg-slate-200 shadow-none border-0 gap-1"><XCircle className="w-3.5 h-3.5"/> Assente</Badge>;
                                    if (medicalCertStatus === 'valid') {
                                        certExpiryText = <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 shadow-none border-0 gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> Valido ({medicalCertFormattedDate})</Badge>;
                                    } else if (medicalCertStatus === 'warning') {
                                        certExpiryText = <Badge className="bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 shadow-none border-0 gap-1"><AlertTriangle className="w-3.5 h-3.5"/> In Scadenza ({medicalCertFormattedDate})</Badge>;
                                    } else if (medicalCertStatus === 'expired') {
                                        certExpiryText = <Badge variant="destructive" className="bg-red-500/10 text-red-700 hover:bg-red-500/20 shadow-none border-0 gap-1"><XCircle className="w-3.5 h-3.5"/> {medicalCertFormattedDate ? `Scaduto (${medicalCertFormattedDate})` : 'Data non valida'}</Badge>;
                                    }

                                    return (
                                        <TableRow key={member.id} className="hover:bg-slate-50/80 transition-colors">
                                            <TableCell className={cn("font-medium text-slate-900", isSortedColumn("firstName") && "sorted-column-cell")}>
                                                <Link href={`/?memberId=${member.id}`} className="hover:underline cursor-pointer">
                                                    {member.firstName}
                                                </Link>
                                            </TableCell>
                                            <TableCell className={cn("font-medium text-slate-900", isSortedColumn("lastName") && "sorted-column-cell")}>
                                                <Link href={`/?memberId=${member.id}`} className="hover:underline cursor-pointer">
                                                    {member.lastName}
                                                </Link>
                                            </TableCell>

                                            <TableCell className={cn("text-slate-600 text-sm", isSortedColumn("email") && "sorted-column-cell")}>
                                                <div className="flex flex-col">
                                                    <span>{member.email || '-'}</span>
                                                    <span className="text-xs text-slate-400">{member.phone || member.mobile || ''}</span>
                                                </div>
                                            </TableCell>

                                            <TableCell>{cardExpiryText}</TableCell>
                                            <TableCell>{certExpiryText}</TableCell>
                                            <TableCell className={cn("text-center", isSortedColumn("attendances") && "sorted-column-cell")}>
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-none border-0 font-semibold px-2.5">
                                                    {attendances.length}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {paymentStatusBadge}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/?memberId=${member.id}`}>
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
