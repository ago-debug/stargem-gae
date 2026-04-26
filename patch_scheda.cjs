const fs = require('fs');
const content = fs.readFileSync('client/src/pages/scheda-corso.tsx', 'utf8');

let newContent = content.replace(
    /const \{ data: enrollments, isLoading: enrollmentsLoading \} = useQuery<Enrollment\[\]>\(\{ queryKey: \["\/api\/enrollments\?type=corsi"\] \}\);/,
    `const { data: enrolledMembersRaw, isLoading: enrolledMembersLoading } = useQuery<any[]>({
        queryKey: [\`/api/courses/\${courseId}/enrolled-members\`],
        enabled: !!courseId
    });`
);

// We no longer need members, enrollments, attendances queries. Let's keep payments for the payment status badge.
newContent = newContent.replace(
    /const \{ data: members, isLoading: membersLoading \} = useQuery<\{ members: Member\[\] \}>\(\{ queryKey: \["\/api\/members"\] \}\);\n/,
    ''
);
newContent = newContent.replace(
    /const \{ data: attendances, isLoading: attendancesLoading \} = useQuery<Attendance\[\]>\(\{ queryKey: \["\/api\/attendances"\] \}\);\n/,
    ''
);

newContent = newContent.replace(
    /if \(coursesLoading \|\| membersLoading \|\| enrollmentsLoading \|\| paymentsLoading \|\| attendancesLoading \|\| strategicEventsLoading\) \{/,
    'if (coursesLoading || enrolledMembersLoading || paymentsLoading || strategicEventsLoading) {'
);

newContent = newContent.replace(
    /    const enrichedData = buildEnrolledMembersData\(\{[\s\S]*?    \}\);\n\n    const enrolledMembersData = enrichedData\.filter\(Boolean\)\.map\(\(data: any\) => \{[\s\S]*?        \};\n    \}\);/,
    `    const enrolledMembersData = (enrolledMembersRaw || []).map((data: any) => {
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
    });`
);

newContent = newContent.replace(
    /        switch \(key\) \{[\s\S]*?            default: return null;\n        \}/,
    `        switch (key) {
            case "firstName": return data?.first_name || "";
            case "lastName": return data?.last_name || "";
            case "email": return data?.email || "";
            case "attendances": return data?.presenze_count || 0;
            default: return null;
        }`
);

newContent = newContent.replace(
    /                                sortedEnrolledMembersData\.map\(\(\{ member, attendances, paymentStatusBadge, medicalCertStatus, medicalCertFormattedDate \}: any\) => \{[\s\S]*?                                \}\)\n                            \)\}/,
    `                                sortedEnrolledMembersData.map((data: any) => {
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
                                                <Link href={\`/anagrafica/\${member_id}\`} className="hover:underline cursor-pointer">
                                                    {first_name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className={cn("font-medium text-slate-900", isSortedColumn("lastName") && "sorted-column-cell")}>
                                                <Link href={\`/anagrafica/\${member_id}\`} className="hover:underline cursor-pointer">
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
                                                <Link href={\`/anagrafica/\${member_id}\`}>
                                                    <Button variant="ghost" size="sm" className="text-gold hover:text-gold-foreground hover:bg-gold/10 font-medium">
                                                        Profilo Completo <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}`
);

fs.writeFileSync('client/src/pages/scheda-corso.tsx', newContent);
