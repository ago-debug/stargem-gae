import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
    Building2, Calendar, FileText, CheckCircle2,
    CalendarRange, Tag, Clock, Users, ArrowLeft, ArrowRight, XCircle
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Course, Member, Enrollment, Payment, Attendance } from "@shared/schema";

export default function SchedaCorso() {
    const [location, setLocation] = useLocation();
    const searchParams = new URLSearchParams(window.location.search);
    const courseId = parseInt(searchParams.get('courseId') || '0');

    const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
    const { data: members, isLoading: membersLoading } = useQuery<Member[]>({ queryKey: ["/api/members"] });
    const { data: enrollments, isLoading: enrollmentsLoading } = useQuery<Enrollment[]>({ queryKey: ["/api/enrollments"] });
    const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({ queryKey: ["/api/payments"] });
    const { data: attendances, isLoading: attendancesLoading } = useQuery<Attendance[]>({ queryKey: ["/api/attendances"] });

    if (coursesLoading || membersLoading || enrollmentsLoading || paymentsLoading || attendancesLoading) {
        return (
            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    const course = courses?.find(c => c.id === courseId);
    const courseEnrollments = enrollments?.filter(e => e.courseId === courseId && e.status === 'active') || [];

    // Create an array of enriched members with their related data
    const enrolledMembersData = courseEnrollments.map(enrollment => {
        const member = members?.find(m => m.id === enrollment.memberId);
        if (!member) return null;

        const memberPayments = payments?.filter(p => p.memberId === member.id && p.enrollmentId === enrollment.id) || [];
        const memberAttendances = attendances?.filter(a => a.courseId === courseId && a.memberId === member.id) || [];

        // Simple payment status logic: check if there's at least one paid payment (can be refined based on actual requirements)
        const hasPaidPayments = memberPayments.some(p => p.status === 'paid');
        const paymentStatusBadge = hasPaidPayments ?
            <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 shadow-none">Regolare</Badge> :
            (memberPayments.length > 0 ?
                <Badge variant="destructive" className="bg-red-500/10 text-red-700 hover:bg-red-500/20 shadow-none border-0">In Sospeso</Badge> :
                <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30 shadow-none">Dati Assenti</Badge>);

        return {
            member,
            enrollment,
            payments: memberPayments,
            attendances: memberAttendances,
            paymentStatusBadge
        };
    }).filter(Boolean) as Array<{
        member: Member,
        enrollment: Enrollment,
        payments: Payment[],
        attendances: Attendance[],
        paymentStatusBadge: React.ReactNode
    }>;

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
                        </div>
                    )}
                </div>
            </div>

            <Card className="border-0 shadow-md ring-1 ring-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/80 border-b">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-semibold text-slate-700 py-4">Nome</TableHead>
                                <TableHead className="font-semibold text-slate-700 py-4">Cognome</TableHead>
                                <TableHead className="font-semibold text-slate-700 py-4">Email</TableHead>
                                <TableHead className="font-semibold text-slate-700 py-4">Scadenza Tessera</TableHead>
                                <TableHead className="font-semibold text-slate-700 py-4">Certificato Medico</TableHead>
                                <TableHead className="font-semibold text-slate-700 py-4 text-center">Presenze</TableHead>
                                <TableHead className="font-semibold text-slate-700 py-4 text-center">Pagamenti</TableHead>
                                <TableHead className="font-semibold text-slate-700 py-4 text-right">Azioni</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {enrolledMembersData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Users className="h-8 w-8 text-slate-300" />
                                            <p>Nessun iscritto trovato per questo corso.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                enrolledMembersData.map(({ member, attendances, paymentStatusBadge }) => {
                                    const today = new Date();

                                    // Check card expiry
                                    let cardExpiryText = <span className="text-slate-500 text-sm italic">Assente</span>;
                                    if (member.cardExpiryDate) {
                                        const expiryDate = new Date(member.cardExpiryDate);
                                        const isExpired = expiryDate < today;
                                        cardExpiryText = (
                                            <span className={`inline-flex items-center gap-1.5 font-medium ${isExpired ? 'text-red-600' : 'text-slate-700'}`}>
                                                {isExpired ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                                                {expiryDate.toLocaleDateString('it-IT')}
                                            </span>
                                        );
                                    }

                                    // Check med cert expiry
                                    let certExpiryText = <span className="text-slate-500 text-sm italic">Assente</span>;
                                    if (member.medicalCertificateExpiry) {
                                        const expiryDate = new Date(member.medicalCertificateExpiry);
                                        const isExpired = expiryDate < today;
                                        certExpiryText = (
                                            <span className={`inline-flex items-center gap-1.5 font-medium ${isExpired ? 'text-red-600' : 'text-slate-700'}`}>
                                                {isExpired ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                                                {expiryDate.toLocaleDateString('it-IT')}
                                            </span>
                                        );
                                    }

                                    return (
                                        <TableRow key={member.id} className="hover:bg-slate-50/80 transition-colors">
                                            <TableCell className="font-medium text-slate-900">{member.firstName}</TableCell>
                                            <TableCell className="font-medium text-slate-900">{member.lastName}</TableCell>
                                            <TableCell className="text-slate-600 text-sm">{member.email || '-'}</TableCell>
                                            <TableCell>{cardExpiryText}</TableCell>
                                            <TableCell>{certExpiryText}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-none border-0 font-semibold px-2.5">
                                                    {attendances.length}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {paymentStatusBadge}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/anagrafica_a_lista?search=${encodeURIComponent(`${member.firstName} ${member.lastName}`)}`}>
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
