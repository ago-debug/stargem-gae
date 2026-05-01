const fs = require('fs');

const f = 'client/src/pages/scheda-allenamento.tsx';
let content = fs.readFileSync(f, 'utf8');

// 1. Insert the early return block
const earlyReturnBlock = `
    if (item.sku === '2526ALLENAMENTO' || (item.sku && item.sku.startsWith('2526GENERICO'))) {
        return (
            <div className="p-6 md:p-8 mx-auto">
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h1 className="text-2xl font-bold text-slate-800">Scheda Allenamento</h1>
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
`;

// Find where to insert it (after the item !hasValidId block)
const insertAfter = `                        </Button>
                    </div>
                </div>
            </div>
        );
    }`;

const insertIdx = content.indexOf(insertAfter) + insertAfter.length;
content = content.substring(0, insertIdx) + earlyReturnBlock + content.substring(insertIdx);


// 2. Fix data mapping
const newMapping = `    const enrolledMembersData = (enrolledMembersRaw || []).map((data: any) => {
        const hasPaidPayments = payments?.some((p: any) => p.status === 'paid' && Number(p.enrollmentId) === Number(data.enrollment_id));
        const hasAnyPayments = payments?.some((p: any) => Number(p.enrollmentId) === Number(data.enrollment_id));
        const paymentStatusBadge = hasPaidPayments ?
            <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 shadow-none border-0">Regolare</Badge> :
            (hasAnyPayments ?
                <Badge variant="destructive" className="bg-red-500/10 text-red-700 hover:bg-red-500/20 shadow-none border-0">In Sospeso</Badge> :
                <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30 shadow-none">Dati Assenti</Badge>
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
                                            <TableCell className={cn("text-slate-600 text-sm", isSortedColumn("email") && "sorted-column-cell")}>{email || '-'}</TableCell>
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
                                                        Profilo Completo <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })`;

const startDataMapping = 'const enrolledMembersData = (enrolledMembersRaw || []).map((data: { member: Member, enrollment: Enrollment, payments: Payment[], attendances: Attendance[] }) => {';
const endDataMapping = 'const sortedEnrolledMembersData = sortItems(enrolledMembersData, getSortValue);';

const sIdx = content.indexOf(startDataMapping);
const eIdx = content.indexOf(endDataMapping) + endDataMapping.length;
content = content.substring(0, sIdx) + newMapping + content.substring(eIdx);

const startRender = 'sortedEnrolledMembersData.map(({ member, attendances, paymentStatusBadge, medicalCertStatus, medicalCertFormattedDate }: any) => {';
const rIdx = content.indexOf(startRender);
const closeIdx = content.indexOf('})\n                            )}', rIdx);
content = content.substring(0, rIdx) + newRender + content.substring(closeIdx + 2);

fs.writeFileSync(f, content, 'utf8');
