import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ChevronsUpDown, X, Plus, Trash2, Calculator, ShoppingCart, User as UserIcon, CreditCard, Banknote, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelectPaymentNotes } from "@/components/multi-select-payment-notes";
import { MultiSelectEnrollmentDetails } from "@/components/multi-select-enrollment-details";
import { PaymentModuleConnector } from "@/components/PaymentModuleConnector";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Member, PriceList, Course, Quote, PriceListItem } from "@shared/schema";

export function NuovoPagamentoModal({
    isOpen,
    onClose,
    defaultMemberId
}: {
    isOpen: boolean;
    onClose: () => void;
    defaultMemberId?: number | null;
}) {
    const { toast } = useToast();
    const [, setLocation] = useLocation();

    // === STATO CLIENTE ===
    const [selectedMemberId, setSelectedMemberId] = useState<string>("");
    const [memberSearchOpen, setMemberSearchOpen] = useState(false);
    const [memberSearchQuery, setMemberSearchQuery] = useState("");
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);

    // Bootstrap selected member if passed
    useEffect(() => {
        if (isOpen) {
            if (defaultMemberId) {
                setSelectedMemberId(defaultMemberId.toString());
            } else if (!selectedMemberId) {
                setSelectedMemberId("");
                setSelectedMember(null);
            }
        }
    }, [isOpen, defaultMemberId]);

    // Fetch the default member details if we have an ID but not the object
    useEffect(() => {
        if (selectedMemberId && !selectedMember) {
            fetch(`/api/members/${selectedMemberId}`).then(r => r.json()).then(data => {
                if (data && data.id) setSelectedMember(data);
            }).catch(e => console.error(e));
        }
    }, [selectedMemberId, selectedMember]);

    // === STATO CARRELLO (GRIGLIA) ===
    const [cartRows, setCartRows] = useState<any[]>([{ id: Date.now().toString(), activityType: "", skus: [], periodId: "", basePrice: 0, discountCode: "", discountPercent1: 0, discountPercent2: 0, subtotal: 0, paymentNotes: [], enrollmentDetails: [] }]);
    const [includeTessera, setIncludeTessera] = useState(false);
    const [includeProva, setIncludeProva] = useState(false);

    // === STATO MODALE CHECKOUT INFERIORE ===
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("contanti");
    const [paymentNotes, setPaymentNotes] = useState("");

    // === DATI DAL SERVER ===
    const { data: searchedMembersData } = useQuery<{ members: Member[], total: number }>({
        queryKey: [`/api/members?search=${encodeURIComponent(memberSearchQuery)}`],
        enabled: memberSearchQuery.length >= 3,
    });
    const searchedMembers = searchedMembersData?.members || [];

    const { data: priceLists } = useQuery<PriceList[]>({ queryKey: ["/api/price-lists"] });
    const { data: courses } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
    const { data: quotes } = useQuery<Quote[]>({ queryKey: ["/api/quotes"] });

    // API per Dettaglio Quote & Servizi e Dropdowns
    const { data: payments } = useQuery<any[]>({ queryKey: ["/api/payments", { memberId: selectedMemberId }], enabled: !!selectedMemberId, queryFn: async () => { const res = await fetch(`/api/payments?memberId=${selectedMemberId}`); return res.ok ? res.json() : []; } });
    const { data: enrollments } = useQuery<any[]>({ queryKey: ["/api/enrollments?type=corsi", { memberId: selectedMemberId }], enabled: !!selectedMemberId, queryFn: async () => { const res = await fetch(`/api/enrollments?type=corsi&memberId=${selectedMemberId}`); return res.ok ? res.json() : []; } });
    const { data: workshopEnrollments } = useQuery<any[]>({ queryKey: ["/api/workshop-enrollments", { memberId: selectedMemberId }], enabled: !!selectedMemberId, queryFn: async () => { const res = await fetch(`/api/workshop-enrollments?memberId=${selectedMemberId}`); return res.ok ? res.json() : []; } });
    const { data: workshops } = useQuery<any[]>({ queryKey: ["/api/workshops"] });
    const { data: paidTrials } = useQuery<any[]>({ queryKey: ["/api/paid-trials"] });
    const { data: freeTrials } = useQuery<any[]>({ queryKey: ["/api/free-trials"] });
    const { data: singleLessons } = useQuery<any[]>({ queryKey: ["/api/single-lessons"] });
    const { data: sundayActivities } = useQuery<any[]>({ queryKey: ["/api/sunday-activities"] });
    const { data: trainings } = useQuery<any[]>({ queryKey: ["/api/trainings"] });
    const { data: individualLessons } = useQuery<any[]>({ queryKey: ["/api/individual-lessons"] });
    const { data: campusActivities } = useQuery<any[]>({ queryKey: ["/api/campus-activities"] });
    const { data: recitals } = useQuery<any[]>({ queryKey: ["/api/recitals"] });
    const { data: vacationStudies } = useQuery<any[]>({ queryKey: ["/api/vacation-studies"] });
    const { data: studios } = useQuery<any[]>({ queryKey: ["/api/studios"] });
    const { data: studioBookings } = useQuery<any[]>({ queryKey: ["/api/studio-bookings", { memberId: selectedMemberId }], enabled: !!selectedMemberId, queryFn: async () => { const res = await fetch(`/api/studio-bookings?memberId=${selectedMemberId}`); return res.ok ? res.json() : []; } });
    const { data: membershipsDataList } = useQuery<any[]>({ queryKey: ["/api/memberships", { memberId: selectedMemberId }], enabled: !!selectedMemberId, queryFn: async () => { const res = await fetch(`/api/memberships?memberId=${selectedMemberId}`); return res.ok ? res.json() : []; } });

    const memberPayments = payments?.filter((p: any) => p.memberId === Number(selectedMemberId)) || [];
    const memberEnrollments = enrollments?.filter((e: any) => e.memberId === Number(selectedMemberId)) || [];
    const memberWorkshopEnrollments = workshopEnrollments?.filter((e: any) => e.memberId === Number(selectedMemberId)) || [];
    const memberStudioBookings = studioBookings?.filter((b: any) => b.memberId === Number(selectedMemberId)) || [];
    const memberMemberships = membershipsDataList?.filter((m: any) => m.memberId === Number(selectedMemberId)) || [];

    const calculatedDebts = !selectedMemberId ? [] : [
        ...memberEnrollments.map((e: any) => {
            const course = courses?.find(c => c.id === e.courseId);
            const total = parseFloat(course?.price || "0");
            const paid = memberPayments.filter((p: any) => p.enrollmentId === e.id && (p.status === 'paid' || p.status === 'completed')).reduce((s: number, p: any) => s + parseFloat(p.amount), 0);
            return { id: `course-${e.id}`, description: course?.name ? `${course.name} (Scuola)` : 'Corso', date: e.createdAt, type: 'course', total, paid, remaining: Math.max(0, total - paid) };
        }),
        ...memberWorkshopEnrollments.map((e: any) => {
            const workshop = workshops?.find(w => w.id === e.workshopId);
            const total = parseFloat(workshop?.price || "0");
            const paid = memberPayments.filter((p: any) => p.workshopEnrollmentId === e.id && (p.status === 'paid' || p.status === 'completed')).reduce((s: number, p: any) => s + parseFloat(p.amount), 0);
            return { id: `workshop-${e.id}`, description: `${workshop?.name || 'Workshop'} (Evento)`, date: e.createdAt, type: 'workshop', total, paid, remaining: Math.max(0, total - paid) };
        }),
        ...memberStudioBookings.map((b: any) => {
            const total = parseFloat(b.amount || "0");
            const paid = memberPayments.filter((p: any) => p.bookingId === b.id && (p.status === 'paid' || p.status === 'completed')).reduce((s: number, p: any) => s + parseFloat(p.amount), 0);
            return { id: `booking-${b.id}`, description: `${b.title || 'Affitto Sala'} (Servizio)`, date: b.createdAt, type: 'service_booking', total, paid, remaining: Math.max(0, total - paid) };
        }),
        ...memberMemberships.map((m: any) => {
            const total = parseFloat(m.fee || "0");
            const paid = memberPayments.filter((p: any) => p.membershipId === m.id && (p.status === 'paid' || p.status === 'completed')).reduce((s: number, p: any) => s + parseFloat(p.amount), 0);
            return { id: `membership-${m.id}`, description: `Quota Tessera (${m.membershipNumber || 'N/A'})`, date: m.createdAt, type: 'membership', total, paid, remaining: Math.max(0, total - paid) };
        })
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const isLoadingDebts = !payments || !enrollments || !courses;

    // === ORCHESTRATORE PAGAMENTO ===
    const checkoutMutation = useMutation({
        mutationFn: async () => {
            if (!selectedMemberId) throw new Error("Seleziona prima un cliente.");

            // 1. Crea le iscrizioni per ogni Item del carrello
            for (const row of cartRows) {
                if (row.skus.length > 0) {
                    const parsedId = parseInt(row.skus[0]);
                    const baseNotes = `Iscr. Automatica Calcolatore (Listino: ${row.periodId})`;
                    const basePayload = { memberId: parseInt(selectedMemberId), status: "attivo", notes: baseNotes };

                    switch (row.activityType) {
                        case 'eventi':
                            await apiRequest("POST", "/api/workshop-enrollments", { ...basePayload, workshopId: parsedId });
                            break;
                        case 'prove_pagamento':
                            await apiRequest("POST", "/api/paid-trial-enrollments", { ...basePayload, paidTrialId: parsedId });
                            break;
                        case 'prove_gratuite':
                            await apiRequest("POST", "/api/free-trial-enrollments", { ...basePayload, freeTrialId: parsedId });
                            break;
                        case 'lezioni_singole':
                            await apiRequest("POST", "/api/single-lesson-enrollments", { ...basePayload, singleLessonId: parsedId });
                            break;
                        case 'domeniche':
                            await apiRequest("POST", "/api/sunday-activity-enrollments", { ...basePayload, sundayActivityId: parsedId });
                            break;
                        case 'allenamenti':
                            await apiRequest("POST", "/api/training-enrollments", { ...basePayload, trainingId: parsedId });
                            break;
                        case 'lezioni_individuali':
                            await apiRequest("POST", "/api/individual-lesson-enrollments", { ...basePayload, individualLessonId: parsedId });
                            break;
                        case 'campus':
                            await apiRequest("POST", "/api/campus-enrollments", { ...basePayload, campusActivityId: parsedId });
                            break;
                        case 'saggi':
                            await apiRequest("POST", "/api/recital-enrollments", { ...basePayload, recitalId: parsedId });
                            break;
                        case 'vacanze_studio':
                            await apiRequest("POST", "/api/vacation-study-enrollments", { ...basePayload, vacationStudyId: parsedId });
                            break;
                        case 'servizi_extra':
                            await apiRequest("POST", "/api/studio-bookings", { ...basePayload, studioId: parsedId, bookingDate: new Date().toISOString(), startTime: "12:00", endTime: "13:00", amount: row.basePrice.toString() });
                            break;
                        case 'corsi':
                        default:
                            await apiRequest("POST", "/api/enrollments", { ...basePayload, courseId: parsedId });
                            break;
                    }
                }
            }

            // 2. Registra Pagamento Cumulativo
            await apiRequest("POST", "/api/payments", {
                memberId: parseInt(selectedMemberId),
                amount: grandTotal,
                paymentMethod: paymentMethod,
                type: "generale",
                status: "saldato",
                notes: `Checkout Calcolatore: ${paymentNotes || "Nessuna nota"}\nTessera: ${includeTessera}\nProva: ${includeProva}`,
                quotaDescription: "Checkout Unificato (Calcolatore)",
                period: "Custom",
                totalQuota: totalCart,
                paidDate: new Date().toISOString()
            });
        },
        onSuccess: () => {
            toast({ title: "Checkout completato", description: "Iscrizioni e pagamento salvati con successo. ✅" });
            setCartRows([{ id: Date.now().toString(), activityType: "", skus: [], periodId: "", basePrice: 0, discountCode: "", discountPercent1: 0, discountPercent2: 0, subtotal: 0, paymentNotes: [], enrollmentDetails: [] }]);
            setIncludeTessera(false);
            setIncludeProva(false);
            setPaymentNotes("");
            setIsCheckoutOpen(false);
            onClose(); // Close the modal upon successful checkout
            queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
            queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
        },
        onError: (err: Error) => {
            toast({ title: "Errore durante il Checkout", description: err.message, variant: "destructive" });
        }
    });

    const addCartRow = () => {
        setCartRows([...cartRows, { id: Date.now().toString(), activityType: "", skus: [], periodId: "", basePrice: 0, discountCode: "", discountPercent1: 0, discountPercent2: 0, subtotal: 0, paymentNotes: [], enrollmentDetails: [] }]);
    };

    const removeCartRow = (id: string) => {
        setCartRows(cartRows.filter(r => r.id !== id));
    };

    const updateRow = (id: string, field: string, value: any) => {
        setCartRows((prevCartRows) => prevCartRows.map(r => {
            if (r.id === id) {
                const updated = { ...r, [field]: value };
                const base = parseFloat(updated.basePrice) || 0;
                const s1 = parseFloat(updated.discountPercent1) || 0;
                const s2 = parseFloat(updated.discountPercent2) || 0;
                const stage1 = base * (1 - (s1 / 100));
                updated.subtotal = stage1 * (1 - (s2 / 100));
                return updated;
            }
            return r;
        }));
    };

    const updateRowBatch = (id: string, updates: Record<string, any>) => {
        setCartRows((prevCartRows) => prevCartRows.map(r => {
            if (r.id === id) {
                const updated = { ...r, ...updates };
                const base = parseFloat(updated.basePrice) || 0;
                const s1 = parseFloat(updated.discountPercent1) || 0;
                const s2 = parseFloat(updated.discountPercent2) || 0;
                const stage1 = base * (1 - (s1 / 100));
                updated.subtotal = stage1 * (1 - (s2 / 100));
                return updated;
            }
            return r;
        }));
    };

    const totalCart = cartRows.reduce((sum, r) => sum + (parseFloat(r.subtotal) || 0), 0);
    const tesseraValue = includeTessera ? 25 : 0;
    const provaValue = includeProva ? -20 : 0;
    const grandTotal = totalCart + tesseraValue + provaValue;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[1400px] w-[95vw] h-[95vh] overflow-y-auto bg-slate-100/50 p-0 border-0">
                <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Calculator className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Nuovo Pagamento</h2>
                            <p className="text-sm text-muted-foreground hidden sm:block">Gestione Checkout Unificato e Carrello Iscrizioni</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-slate-100 hover:bg-slate-200">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="w-full p-4 md:px-8 md:py-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* COLONNA SINISTRA: SELEZIONE E CHECKOUT */}
                        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
                            <Card className="shadow-sm border-t-4 border-t-primary">
                                <CardHeader className="pb-3 bg-muted/20">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <UserIcon className="w-5 h-5 text-primary" /> Intestatario
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="space-y-2 relative">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cerca Anagrafica Cliente</Label>
                                        <Popover open={memberSearchOpen} onOpenChange={setMemberSearchOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={memberSearchOpen}
                                                    className="w-full justify-between font-normal h-12 bg-background border shadow-sm"
                                                >
                                                    {selectedMember ? (
                                                        <div className="flex flex-col items-start overflow-hidden">
                                                            <span className="font-bold truncate text-base">{selectedMember.firstName} {selectedMember.lastName}</span>
                                                            <span className="text-[10px] text-muted-foreground uppercase">{selectedMember.fiscalCode || 'No CF'}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">Cerca per nome, cognome o CF...</span>
                                                    )}
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {selectedMemberId && (
                                                            <div
                                                                role="button"
                                                                className="p-1 hover:bg-slate-200 rounded-md z-50 cursor-pointer transition-colors"
                                                                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                                onClick={(e) => {
                                                                    e.preventDefault(); e.stopPropagation();
                                                                    setSelectedMemberId("");
                                                                    setSelectedMember(null);
                                                                    setMemberSearchQuery("");
                                                                    setMemberSearchOpen(false);
                                                                    setCartRows([{ id: Date.now().toString(), activityType: "", skus: [], periodId: "", basePrice: 0, discountCode: "", discountPercent1: 0, discountPercent2: 0, subtotal: 0, paymentNotes: [], enrollmentDetails: [] }]);
                                                                    setIncludeTessera(false);
                                                                    setIncludeProva(false);
                                                                    setPaymentMethod("contanti");
                                                                    setPaymentNotes("");
                                                                }}
                                                            >
                                                                <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                                            </div>
                                                        )}
                                                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                                                    </div>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[300px] p-0" align="start">
                                                <Command shouldFilter={false}>
                                                    <CommandInput
                                                        placeholder="Digita (min. 3 caratteri)..."
                                                        value={memberSearchQuery}
                                                        onValueChange={setMemberSearchQuery}
                                                    />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            {memberSearchQuery.length < 3
                                                                ? "Inserisci almeno 3 caratteri per cercare"
                                                                : "Nessun cliente trovato"}
                                                        </CommandEmpty>
                                                        {memberSearchQuery.length >= 3 && (
                                                            <CommandGroup>
                                                                {searchedMembers.map((member) => (
                                                                    <CommandItem
                                                                        key={member.id}
                                                                        value={member.id.toString()}
                                                                        onSelect={() => {
                                                                            setSelectedMemberId(member.id.toString());
                                                                            setSelectedMember(member);
                                                                            setMemberSearchOpen(false);
                                                                            setMemberSearchQuery("");
                                                                        }}
                                                                    >
                                                                        <Check className={cn("mr-2 h-4 w-4", selectedMemberId === member.id.toString() ? "opacity-100 text-primary" : "opacity-0")} />
                                                                        <div className="flex flex-col">
                                                                            <span className="font-bold">{member.firstName} {member.lastName}</span>
                                                                            {member.fiscalCode && (
                                                                                <span className="text-[10px] text-muted-foreground">{member.fiscalCode}</span>
                                                                            )}
                                                                        </div>
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        )}
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-md bg-stone-50 border-stone-200">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <ShoppingCart className="w-5 h-5" /> Riepilogo Cassa
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Totale Corsi/Quote</span>
                                        <span className="font-medium">€ {totalCart.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Quota Tessera</span>
                                        <span className="font-medium">€ {tesseraValue.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-red-600">
                                        <span>Lezione Prova</span>
                                        <span className="font-medium">€ {provaValue.toFixed(2)}</span>
                                    </div>

                                    <div className="pt-3 border-t-2 border-dashed border-stone-300 flex justify-between items-center">
                                        <span className="font-bold text-lg">TOTALE DA PAGARE</span>
                                        <span className="font-black text-2xl text-green-700">€ {grandTotal.toFixed(2)}</span>
                                    </div>

                                    <Button
                                        className="w-full h-12 text-lg font-bold mt-4 shadow-lg hover:shadow-xl transition-all"
                                        variant="default"
                                        disabled={!selectedMemberId || grandTotal === 0}
                                        onClick={() => setIsCheckoutOpen(true)}
                                    >
                                        PROCEDI AL PAGAMENTO
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* COLONNA DESTRA: TAVOLO CARRELLO E EXTRA */}
                        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                            <div className="border border-slate-200 shadow-sm bg-white p-4 rounded-lg">
                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 block">Cosa desideri pagare?</span>
                                {!selectedMemberId ? (
                                    <div className="p-4 rounded-md bg-slate-50 text-center text-sm text-slate-500 italic">
                                        Nessun debito pendente per questo cliente. Procedi inserendo i dati manualmente.
                                    </div>
                                ) : isLoadingDebts ? (
                                    <div className="h-20 bg-slate-100 animate-pulse rounded-md w-full border border-slate-200"></div>
                                ) : calculatedDebts && calculatedDebts.length > 0 ? (
                                    <div className="border rounded-md divide-y overflow-hidden shadow-sm bg-white">
                                        {calculatedDebts.map((debt: any, idx: number) => (
                                            <div key={debt.id || idx} onClick={() => {
                                                onClose(); // In a modal, maybe we don't route immediately, but we can wrap it or close first.
                                                setLocation(`/scheda-contabile?memberId=${selectedMemberId}`)
                                            }} className="p-4 hover:bg-slate-50 cursor-pointer transition-colors relative flex justify-between items-center group">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 text-sm">{debt.description}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase">{debt.date ? new Date(debt.date).toLocaleDateString('it-IT') : ""} - {debt.type}</span>
                                                </div>
                                                <div>
                                                    {debt.remaining <= 0.01 ? (
                                                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border border-green-200">PAGATO</div>
                                                    ) : debt.paid > 0.01 ? (
                                                        <div className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase text-center flex flex-col leading-none">
                                                            <span>Da pagare: €{debt.remaining.toFixed(2)}</span>
                                                            <span className="text-[8px] text-orange-300">Parziale</span>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase">Da pagare: €{debt.remaining.toFixed(2)}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-md bg-slate-50 text-center text-sm text-slate-500 italic">
                                        Tutti i pagamenti risultano saldati.
                                    </div>
                                )}
                            </div>

                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b">
                                    <div>
                                        <CardTitle className="text-xl">Dettaglio Quote e Servizi</CardTitle>
                                        <CardDescription>Aggiungi i corsi e calcola il preventivo incrociando i listini.</CardDescription>
                                    </div>
                                    <Button onClick={addCartRow} className="gold-3d-button gap-2">
                                        <Plus className="w-4 h-4" /> Nuovo Pagamento
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-4 bg-slate-50/50">
                                    <div className="space-y-6">
                                        {cartRows.map((row, idx) => (
                                            <CartTableRow
                                                key={row.id}
                                                row={row}
                                                courses={courses || []}
                                                workshops={workshops || []}
                                                paidTrials={paidTrials || []}
                                                freeTrials={freeTrials || []}
                                                singleLessons={singleLessons || []}
                                                sundayActivities={sundayActivities || []}
                                                trainings={trainings || []}
                                                individualLessons={individualLessons || []}
                                                campusActivities={campusActivities || []}
                                                recitals={recitals || []}
                                                vacationStudies={vacationStudies || []}
                                                studios={studios || []}
                                                priceLists={priceLists || []}
                                                quotes={quotes || []}
                                                updateRow={updateRow}
                                                updateRowBatch={updateRowBatch}
                                                removeCartRow={removeCartRow}
                                                index={idx}
                                            />
                                        ))}

                                        {cartRows.length === 0 && (
                                            <div className="h-32 flex items-center justify-center text-muted-foreground border-2 border-dashed border-slate-200 rounded-lg">
                                                Nessun corso inserito. Clicca su "Nuovo Pagamento" per iniziare.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="shadow-sm bg-blue-50/30 border-blue-100">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-blue-900">1 QUOTA TESSERA</h3>
                                            <p className="text-xs text-blue-700/70">Aggiungi quota associazione obbligatoria (+€25.00)</p>
                                        </div>
                                        <Button variant={includeTessera ? "default" : "outline"} onClick={() => setIncludeTessera(!includeTessera)}>
                                            {includeTessera ? "Aggiunta (OK)" : "Inserisci Tessera"}
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card className="shadow-sm bg-red-50/30 border-red-100">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-red-900">1 LEZIONE DI PROVA</h3>
                                            <p className="text-xs text-red-700/70">Sottrae una lezione pagata dalla retta (-€20.00)</p>
                                        </div>
                                        <Button variant={includeProva ? "destructive" : "outline"} onClick={() => setIncludeProva(!includeProva)}>
                                            {includeProva ? "Sottratta (OK)" : "Sottrai Prova"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-4 bg-slate-50/50 p-5 rounded-lg border border-slate-200/60 shadow-inner mt-6">
                                <div className="flex flex-col space-y-4">
                                    <div className="flex items-center justify-between border p-3 rounded-md bg-white shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <Checkbox id="gratuita" disabled />
                                            <Label htmlFor="gratuita" className="font-bold uppercase tracking-wider text-muted-foreground cursor-not-allowed">
                                                Gratuità (Richiede Codice Admin) - Seleziona attività
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox id="integrazione" disabled />
                                            <Label htmlFor="integrazione" className="font-bold text-blue-700 cursor-not-allowed">
                                                Modalità Integrazione
                                            </Label>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                                    <div className="space-y-2">
                                        <Label>Data Pagamento (Z) *</Label>
                                        <Input type="date" value={new Date().toISOString().split('T')[0]} readOnly className="bg-slate-50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Acconto/Credito (Y)</Label>
                                        <Input type="number" placeholder="" readOnly className="bg-slate-50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Saldo Annuale (AA)</Label>
                                        <Input type="number" placeholder="" readOnly className="bg-slate-50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>N. Ricevute</Label>
                                        <Input type="number" placeholder="" readOnly className="bg-slate-50" />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* === DIALOG CHECKOUT INNER === */}
                <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <PaymentModuleConnector
                            basePrice={grandTotal}
                            itemName={`Incasso: ${selectedMember?.firstName} ${selectedMember?.lastName}`}
                            onPaymentComplete={(data) => {
                                setPaymentMethod(data.paymentMethod);
                                setPaymentNotes(data.receiptNumber ? `Ricevuta: ${data.receiptNumber}` : "");
                                checkoutMutation.mutate();
                            }}
                            onCancel={() => setIsCheckoutOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    );
}

// === SUBCOMPONENTE RIGA CARRELLO (Per gestire l'auto-fetch del Listino Selezionato) ===
function CartTableRow({
    row, courses, workshops, paidTrials, freeTrials, singleLessons,
    sundayActivities, trainings, individualLessons, campusActivities,
    recitals, vacationStudies, studios, priceLists, quotes,
    updateRow, updateRowBatch, removeCartRow, index
}: {
    row: any, courses: Course[], workshops: any[], paidTrials: any[],
    freeTrials: any[], singleLessons: any[], sundayActivities: any[],
    trainings: any[], individualLessons: any[], campusActivities: any[],
    recitals: any[], vacationStudies: any[], studios: any[],
    priceLists: PriceList[], quotes: Quote[], updateRow: any,
    updateRowBatch: any, removeCartRow: any, index: number
}) {
    const { data: listinoItems } = useQuery<PriceListItem[]>({
        queryKey: [`/api/price-lists/${row.periodId}/items`],
        enabled: !!row.periodId,
    });

    // Tracking the last combo to prevent overriding manual user edits on basePrice
    const [lastAutoPricedCombo, setLastAutoPricedCombo] = useState<string>("");

    useEffect(() => {
        if (row.periodId && row.skus && row.skus.length > 0 && Array.isArray(listinoItems)) {
            const entityId = parseInt(row.skus[0]);
            let entityType = "course";
            switch (row.activityType) {
                case "eventi": entityType = "workshop"; break;
                case "prove_pagamento": entityType = "paid_trial"; break;
                case "prove_gratuite": entityType = "free_trial"; break;
                case "lezioni_singole": entityType = "single_lesson"; break;
                case "domeniche": entityType = "sunday_activity"; break;
                case "allenamenti": entityType = "training"; break;
                case "lezioni_individuali": entityType = "individual_lesson"; break;
                case "campus": entityType = "campus_activity"; break;
                case "saggi": entityType = "recital"; break;
                case "vacanze_studio": entityType = "vacation_study"; break;
                case "servizi_extra": entityType = "booking_service"; break;
            }

            const item = listinoItems.find(i => i.entityType === entityType && i.entityId === entityId);

            const currentCombo = `${row.periodId}-${row.activityType}-${entityId}`;

            if (item && lastAutoPricedCombo !== currentCombo) {
                let finalPrice = parseFloat((item.price as string) || "0");
                if (item.quoteId && quotes.length) {
                    const q = quotes.find(qt => qt.id === item.quoteId);
                    if (q) finalPrice = parseFloat((q.amount as string) || "0");
                }
                if (!isNaN(finalPrice)) {
                    updateRow(row.id, 'basePrice', finalPrice);
                    setLastAutoPricedCombo(currentCombo);
                }
            }
        }
    }, [row.skus, row.periodId, listinoItems, row.activityType, quotes.length, row.id, lastAutoPricedCombo]);

    const availableActivityTypes = ["corsi", "eventi", "prove_pagamento", "prove_gratuite", "lezioni_singole", "domeniche", "allenamenti", "lezioni_individuali", "campus", "saggi", "vacanze_studio", "servizi_extra"];

    let currentCatalog: any[] = courses || [];
    switch (row.activityType) {
        case "eventi": currentCatalog = workshops || []; break;
        case "prove_pagamento": currentCatalog = paidTrials || []; break;
        case "prove_gratuite": currentCatalog = freeTrials || []; break;
        case "lezioni_singole": currentCatalog = singleLessons || []; break;
        case "domeniche": currentCatalog = sundayActivities || []; break;
        case "allenamenti": currentCatalog = trainings || []; break;
        case "lezioni_individuali": currentCatalog = individualLessons || []; break;
        case "campus": currentCatalog = campusActivities || []; break;
        case "saggi": currentCatalog = recitals || []; break;
        case "vacanze_studio": currentCatalog = vacationStudies || []; break;
        case "servizi_extra": currentCatalog = studios || []; break;
    }

    return (
        <div className="bg-white p-4 rounded-lg border shadow-sm relative flex gap-4 pr-14">
            <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive hover:bg-red-50"
                onClick={() => removeCartRow(row.id)}
            >
                <Trash2 className="w-5 h-5" />
            </Button>

            <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.5fr_2fr_0.8fr_2fr_1fr] gap-4">
                    <div className="space-y-1">
                        <Label className="text-xs text-slate-700 truncate font-bold">Listino *</Label>
                        <Select value={row.periodId} onValueChange={(val) => {
                            updateRowBatch(row.id, { periodId: val, activityType: '', skus: [], basePrice: 0 });
                        }}>
                            <SelectTrigger className="h-9 bg-yellow-50/50 border-yellow-200">
                                <SelectValue placeholder="Periodo..." />
                            </SelectTrigger>
                            <SelectContent>
                                {priceLists?.map(pl => (
                                    <SelectItem key={pl.id} value={pl.id.toString()}>{pl.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className={cn("text-xs truncate font-bold", !row.periodId ? "text-slate-400" : "text-slate-700")}>Attività *</Label>
                        <Select disabled={!row.periodId} value={row.activityType || ""} onValueChange={(val) => {
                            updateRowBatch(row.id, { activityType: val, skus: [], basePrice: 0 });
                        }}>
                            <SelectTrigger className={cn("h-9 border-slate-200", !row.periodId ? "bg-slate-100 opacity-50" : "bg-slate-50")}>
                                <SelectValue placeholder="Seleziona..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableActivityTypes.includes("corsi") && <SelectItem value="corsi">Corsi</SelectItem>}
                                {availableActivityTypes.includes("prove_pagamento") && <SelectItem value="prove_pagamento">Prove a Pagamento</SelectItem>}
                                {availableActivityTypes.includes("prove_gratuite") && <SelectItem value="prove_gratuite">Prove Gratuite</SelectItem>}
                                {availableActivityTypes.includes("lezioni_singole") && <SelectItem value="lezioni_singole">Lezioni Singole</SelectItem>}
                                {availableActivityTypes.includes("eventi") && <SelectItem value="eventi">Workshop</SelectItem>}
                                {availableActivityTypes.includes("domeniche") && <SelectItem value="domeniche">Domeniche in Movimento</SelectItem>}
                                {availableActivityTypes.includes("allenamenti") && <SelectItem value="allenamenti">Allenamenti/Affitti</SelectItem>}
                                {availableActivityTypes.includes("lezioni_individuali") && <SelectItem value="lezioni_individuali">Lezioni Individuali</SelectItem>}
                                {availableActivityTypes.includes("campus") && <SelectItem value="campus">Campus</SelectItem>}
                                {availableActivityTypes.includes("saggi") && <SelectItem value="saggi">Saggi</SelectItem>}
                                {availableActivityTypes.includes("vacanze_studio") && <SelectItem value="vacanze_studio">Vacanze Studio</SelectItem>}
                                {availableActivityTypes.includes("servizi_extra") && <SelectItem value="servizi_extra">Servizi Extra</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className={cn("text-xs truncate font-bold", !row.activityType ? "text-slate-400" : "text-slate-700")}>SKU / Dettaglio Attività *</Label>
                        <Select disabled={!row.activityType} value={(row.skus && row.skus[0]) || ""} onValueChange={(val) => {
                            updateRow(row.id, 'skus', [val]);
                        }}>
                            <SelectTrigger className={cn("h-9 border-slate-200", !row.activityType ? "bg-slate-100 opacity-50" : "bg-white")}>
                                <SelectValue placeholder="Seleziona..." />
                            </SelectTrigger>
                            <SelectContent>
                                {currentCatalog?.map(c => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name} {c.sku ? `(${c.sku})` : ''}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-slate-700 truncate font-bold">Q.tà</Label>
                        <Input type="number" className="h-9 bg-slate-50 text-center" value="1" readOnly />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-slate-700 truncate font-bold">Descrizione Quota</Label>
                        <Input className="h-9 bg-slate-50" placeholder="Manuale..." />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-slate-700 truncate font-bold">Totale Quota *</Label>
                        <Input
                            type="number"
                            step="0.01"
                            className="h-9 bg-slate-50 font-bold"
                            value={row.basePrice || ""}
                            onChange={(e) => updateRow(row.id, 'basePrice', e.target.value)}
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-6 gap-4">
                    <div className="space-y-1">
                        <Label className="text-xs text-emerald-700 truncate">Cod. Promo</Label>
                        <Input className="h-9 bg-emerald-50/30 font-mono text-xs uppercase" placeholder="COD. PERSONALE" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-emerald-700 truncate">Valore</Label>
                        <Input type="number" className="h-9 bg-emerald-50/30 text-right" placeholder="€ 0.00" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-emerald-700 truncate">% Promo</Label>
                        <Input type="number" step="0.01" className="h-9 bg-emerald-50/30 text-right" placeholder="%" value={row.discountPercent2 || ""} onChange={(e) => updateRow(row.id, 'discountPercent2', e.target.value)} />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-blue-700 truncate">Cod. Sconto</Label>
                        <Input className="h-9 bg-blue-50/30 font-mono text-xs uppercase" placeholder="COD. CAMPAGNA" value={row.discountCode || ""} onChange={(e) => updateRow(row.id, 'discountCode', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-blue-700 truncate">Valore</Label>
                        <Input type="number" className="h-9 bg-blue-50/30 text-right" placeholder="€ 0.00" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-blue-700 truncate">% Sconto</Label>
                        <Input type="number" step="0.01" className="h-9 bg-blue-50/30 text-right" placeholder="%" value={row.discountPercent1 || ""} onChange={(e) => updateRow(row.id, 'discountPercent1', e.target.value)} />
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <MultiSelectEnrollmentDetails
                            selectedDetails={row.enrollmentDetails || []}
                            onChange={(vals) => updateRow(row.id, 'enrollmentDetails', vals)}
                        />
                    </div>
                    <div className="space-y-1 mt-1">
                        <MultiSelectPaymentNotes
                            selectedNotes={row.paymentNotes || []}
                            onChange={(vals) => updateRow(row.id, 'paymentNotes', vals)}
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100 mt-2">
                    <div className="text-right">
                        <span className="text-xs font-bold text-muted-foreground mr-3 uppercase">Subtotale Riga:</span>
                        <span className="text-lg font-black text-green-700">€ {(parseFloat(row.subtotal) || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
