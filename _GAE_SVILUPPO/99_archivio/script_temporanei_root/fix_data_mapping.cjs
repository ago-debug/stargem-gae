const fs = require('fs');

const files = [
    'client/src/pages/scheda-domenica.tsx',
    'client/src/pages/scheda-lezione-individuale.tsx',
    'client/src/pages/scheda-campus.tsx'
];

const newMapping = `    const enrolledMembersData = (enrolledMembersRaw || []).map((data: any) => {
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
    const sortedEnrolledMembersData = sortItems(enrolledMembersData, getSortValue);`;

const newRender = `                                sortedEnrolledMembersData.map((data: any) => {
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
                                            <span className={\`inline-flex items-center gap-1.5 font-medium \${isExpired ? 'text-red-600' : 'text-slate-700'}\`}>
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
                                                <Link href={\`/?memberId=\${member_id}\`} className="hover:underline cursor-pointer">
                                                    {first_name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className={cn("font-medium text-slate-900", isSortedColumn("lastName") && "sorted-column-cell")}>
                                                <Link href={\`/?memberId=\${member_id}\`} className="hover:underline cursor-pointer">
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
                                                <Link href={\`/?memberId=\${member_id}\`}>
                                                    <Button variant="ghost" size="sm" className="text-gold hover:text-gold-foreground hover:bg-gold/10 font-medium">
                                                        Profilo <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })`;

for (const f of files) {
    let content = fs.readFileSync(f, 'utf8');

    // Replace data mapping
    const startDataMapping = 'const enrolledMembersData = (enrolledMembersRaw || []).map((data: { member: Member, enrollment: Enrollment, payments: Payment[], attendances: Attendance[] }) => {';
    const endDataMapping = 'const sortedEnrolledMembersData = sortItems(enrolledMembersData, getSortValue);';

    const startIdx = content.indexOf(startDataMapping);
    const endIdx = content.indexOf(endDataMapping) + endDataMapping.length;

    if (startIdx === -1 || endIdx === -1) {
        console.error('Could not find data mapping in', f);
    } else {
        content = content.substring(0, startIdx) + newMapping + content.substring(endIdx);
    }

    // Special logic for LI attendancesCount
    if (f.includes('scheda-lezione-individuale')) {
        const oldAttendances = 'const attendancesCount = enrolledMembersData.reduce((acc: number, curr: any) => acc + (curr.attendances?.length || 0), 0);';
        const newAttendances = 'const attendancesCount = enrolledMembersData.reduce((acc: number, curr: any) => acc + (Number(curr.presenze_count) || 0), 0);';
        if (content.includes(oldAttendances)) {
             content = content.replace(oldAttendances, newAttendances);
        } else {
            // Need to insert it right after the mapping
            const insertIdx = content.indexOf('const sortedEnrolledMembersData = sortItems(enrolledMembersData, getSortValue);') + 'const sortedEnrolledMembersData = sortItems(enrolledMembersData, getSortValue);'.length;
            content = content.substring(0, insertIdx) + '\n    ' + newAttendances + content.substring(insertIdx);
        }
    }

    // Replace render mapping
    const startRender = 'sortedEnrolledMembersData.map(({ member, attendances, paymentStatusBadge, medicalCertStatus, medicalCertFormattedDate }: any) => {';
    const endRender = '})';

    // Find the render block. It's inside the TableBody. We can just regex replace everything between startRender and the endRender that closes it.
    // Let's find startRender exactly.
    const renderIdx = content.indexOf(startRender);
    if (renderIdx !== -1) {
        // Find the '})' that corresponds to it, which is followed by '\n                            )}'
        const closeIdx = content.indexOf('})\n                            )}', renderIdx);
        if (closeIdx !== -1) {
            content = content.substring(0, renderIdx) + newRender + content.substring(closeIdx + 2);
        } else {
            console.error('Could not find close bracket for render in', f);
        }
    } else {
        console.error('Could not find render block in', f);
    }

    fs.writeFileSync(f, content, 'utf8');
    console.log('Fixed', f);
}
