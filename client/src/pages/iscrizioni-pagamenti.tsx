import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ChevronsUpDown, X, Plus, Trash2, Calculator, ShoppingCart, User as UserIcon, Tag, CreditCard, Banknote, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelectPaymentNotes } from "@/components/multi-select-payment-notes";
import { MultiSelectEnrollmentDetails } from "@/components/multi-select-enrollment-details";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Member, PriceList, Course, InsertPayment, Quote, PriceListItem } from "@shared/schema";

export default function IscrizioniPagamenti() {
    const { toast } = useToast();

    // === STATO CLIENTE ===
    const [selectedMemberId, setSelectedMemberId] = useState<string>("");
    const [memberSearchOpen, setMemberSearchOpen] = useState(false);
    const [memberSearchQuery, setMemberSearchQuery] = useState("");
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);

    // === STATO CARRELLO (GRIGLIA) ===
    const [cartRows, setCartRows] = useState<any[]>([{ id: Date.now().toString(), skus: [], periodId: "", basePrice: 0, discountCode: "", discountPercent1: 0, discountPercent2: 0, subtotal: 0, paymentNotes: [], enrollmentDetails: [] }]);
    const [includeTessera, setIncludeTessera] = useState(false);
    const [includeProva, setIncludeProva] = useState(false);

    // === STATO MODALE CHECKOUT ===
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

    // === REPLICATE ACCOUNTING SHEET LOGIC FOR PENDENZE ===
    const { data: payments } = useQuery<any[]>({ queryKey: ["/api/payments", { memberId: selectedMemberId }], enabled: !!selectedMemberId, queryFn: async () => { const res = await fetch(`/api/payments?memberId=${selectedMemberId}`); return res.ok ? res.json() : []; } });
    const { data: enrollments } = useQuery<any[]>({ queryKey: ["/api/enrollments?type=corsi", { memberId: selectedMemberId }], enabled: !!selectedMemberId, queryFn: async () => { const res = await fetch(`/api/enrollments?type=corsi&memberId=${selectedMemberId}`); return res.ok ? res.json() : []; } });
    const { data: workshopEnrollments } = useQuery<any[]>({ queryKey: ["/api/workshop-enrollments", { memberId: selectedMemberId }], enabled: !!selectedMemberId, queryFn: async () => { const res = await fetch(`/api/workshop-enrollments?memberId=${selectedMemberId}`); return res.ok ? res.json() : []; } });
    const { data: workshops } = useQuery<any[]>({ queryKey: ["/api/workshops"] });
    const { data: studioBookings } = useQuery<any[]>({ queryKey: ["/api/studio-bookings", { memberId: selectedMemberId }], enabled: !!selectedMemberId, queryFn: async () => { const res = await fetch(`/api/studio-bookings?memberId=${selectedMemberId}`); return res.ok ? res.json() : []; } });
    const { data: membershipsDataList } = useQuery<any[]>({ queryKey: ["/api/memberships", { memberId: selectedMemberId }], enabled: !!selectedMemberId, queryFn: async () => { const res = await fetch(`/api/memberships?memberId=${selectedMemberId}`); return res.ok ? res.json() : []; } });

    const memberPayments = payments?.filter((p: any) => p.memberId === Number(selectedMemberId)) || [];
    const memberEnrollments = enrollments?.filter((e: any) => e.memberId === Number(selectedMemberId)) || [];
    const memberWorkshopEnrollments = workshopEnrollments?.filter((e: any) => e.memberId === Number(selectedMemberId)) || [];
    const memberStudioBookings = studioBookings?.filter((b: any) => b.memberId === Number(selectedMemberId)) || [];
    const memberMemberships = membershipsDataList?.filter((m: any) => m.memberId === Number(selectedMemberId)) || [];

    const calculatedDebts = [
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

    const isLoadingDebts = !payments || !enrollments || !courses; // Simplified loader check
    // === END REPLICATE ===

    // === ORCHESTRATORE PAGAMENTO ===
    const checkoutMutation = useMutation({
        mutationFn: async () => {
            if (!selectedMemberId) throw new Error("Seleziona prima un cliente.");

            // 1. Crea le iscrizioni per ogni Item del carrello
            for (const row of cartRows) {
                if (row.skus.length > 0) {
                    await apiRequest("POST", "/api/enrollments", {
                        memberId: parseInt(selectedMemberId),
                        courseId: parseInt(row.skus[0]),
                        status: "attivo",
                        notes: `Iscr. Calcolatore Automatica (Periodo ID: ${row.periodId})`
                    });
                }
            }

            // 2. Registra Pagamento Cumulativo
            await apiRequest("POST", "/api/payments", {
                memberId: parseInt(selectedMemberId),
                amount: grandTotal,
                paymentMethod: paymentMethod, // legacy compat
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
            setCartRows([{ id: Date.now().toString(), skus: [], periodId: "", basePrice: 0, discountCode: "", discountPercent1: 0, discountPercent2: 0, subtotal: 0, paymentNotes: [], enrollmentDetails: [] }]);
            setIncludeTessera(false);
            setIncludeProva(false);
            setPaymentNotes("");
            setIsCheckoutOpen(false);
            queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
            queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
        },
        onError: (err: Error) => {
            toast({ title: "Errore durante il Checkout", description: err.message, variant: "destructive" });
        }
    });

    // Add Item to Grid
    const addCartRow = () => {
        setCartRows([...cartRows, { id: Date.now().toString(), skus: [], periodId: "", basePrice: 0, discountCode: "", discountPercent1: 0, discountPercent2: 0, subtotal: 0, paymentNotes: [], enrollmentDetails: [] }]);
    };

    const removeCartRow = (id: string) => {
        setCartRows(cartRows.filter(r => r.id !== id));
    };

    // Update specific row
    const updateRow = (id: string, field: string, value: any) => {
        setCartRows(cartRows.map(r => {
            if (r.id === id) {
                const updated = { ...r, [field]: value };
                // Calcola subtotale con sconti a cascata: (Base * (1-S1)) * (1-S2)
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

    // Totals
    const totalCart = cartRows.reduce((sum, r) => sum + (parseFloat(r.subtotal) || 0), 0);
    const tesseraValue = includeTessera ? 25 : 0;
    const provaValue = includeProva ? -20 : 0;
    const grandTotal = totalCart + tesseraValue + provaValue;

    return (
        <div className="w-full p-4 md:p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Calculator className="w-8 h-8 text-primary" />
                    Iscrizioni e Pagamenti (Calcolatore)
                </h1>
                <p className="text-muted-foreground">
                    Gestione Checkout Unificato - Incrocia i prevendivi con i listini e finalizza l'incasso.
                </p>
            </div>

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
                                                    <X
                                                        className="h-4 w-4 text-muted-foreground hover:text-destructive z-10 transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedMemberId("");
                                                            setSelectedMember(null);
                                                            // Total Reset
                                                            setCartRows([{ id: Date.now().toString(), skus: [], periodId: "", basePrice: 0, discountCode: "", discountPercent1: 0, discountPercent2: 0, subtotal: 0, paymentNotes: [], enrollmentDetails: [] }]);
                                                            setIncludeTessera(false);
                                                            setIncludeProva(false);
                                                            setPaymentMethod("contanti");
                                                            setPaymentNotes("");
                                                        }}
                                                    />
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
                    {/* RIQUADRO COSA DESIDERI PAGARE SPOSTATO QUI IN ALTO */}
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
                                    <div key={debt.id || idx} className="p-4 hover:bg-slate-50 cursor-pointer transition-colors relative flex justify-between items-center group">
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
                            <Button onClick={addCartRow} variant="outline" className="gap-2 bg-white">
                                <Plus className="w-4 h-4" /> Aggiungi Riga
                            </Button>
                        </CardHeader>
                        <CardContent className="p-4 bg-slate-50/50">
                            <div className="space-y-6">
                                {cartRows.map((row, idx) => (
                                    <CartTableRow
                                        key={row.id}
                                        row={row}
                                        courses={courses || []}
                                        priceLists={priceLists || []}
                                        quotes={quotes || []}
                                        updateRow={updateRow}
                                        removeCartRow={removeCartRow}
                                        index={idx}
                                    />
                                ))}

                                {cartRows.length === 0 && (
                                    <div className="h-32 flex items-center justify-center text-muted-foreground border-2 border-dashed border-slate-200 rounded-lg">
                                        Nessun corso inserito. Clicca su "Aggiungi Riga" per iniziare.
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



                </div> {/* <--- Fine della colonna DESTRA (lg:col-span-8) */}

                {/* === DIALOG CHECKOUT === */}
                <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Conferma Incasso</DialogTitle>
                            <DialogDescription>
                                Procedi al pagamento di <strong>€ {grandTotal.toFixed(2)}</strong> per {selectedMember?.firstName} {selectedMember?.lastName}. Verranno create anche le relative iscrizioni attive.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Metodo di Pagamento</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant={paymentMethod === 'contanti' ? "default" : "outline"}
                                        onClick={() => setPaymentMethod('contanti')}
                                        className="flex gap-2"
                                    >
                                        <Banknote className="w-4 h-4" /> Contanti
                                    </Button>
                                    <Button
                                        variant={paymentMethod === 'bonifico' ? "default" : "outline"}
                                        onClick={() => setPaymentMethod('bonifico')}
                                        className="flex gap-2"
                                    >
                                        <CreditCard className="w-4 h-4" /> Bonifico / POS
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Note Pagamento (Opzionali)</Label>
                                <Input
                                    placeholder="Num. ricevuta, dettagli..."
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)} disabled={checkoutMutation.isPending}>Annulla</Button>
                            <Button
                                onClick={() => checkoutMutation.mutate()}
                                disabled={checkoutMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 font-bold"
                            >
                                {checkoutMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Elaborazione...</> : `Incassa € ${grandTotal.toFixed(2)}`}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

// === SUBCOMPONENTE RIGA CARRELLO (Per gestire l'auto-fetch del Listino Selezionato) ===
function CartTableRow({ row, courses, priceLists, quotes, updateRow, removeCartRow, index }: { row: any, courses: Course[], priceLists: PriceList[], quotes: Quote[], updateRow: any, removeCartRow: any, index: number }) {
    const { data: listinoItems } = useQuery<PriceListItem[]>({
        queryKey: [`/api/price-lists/${row.periodId}/items`],
        enabled: !!row.periodId,
    });

    return (
        <div className="bg-white p-4 rounded-lg border shadow-sm relative flex gap-4 pr-14">
            {/* Trash button absolute top right */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive hover:bg-red-50"
                onClick={() => removeCartRow(row.id)}
            >
                <Trash2 className="w-5 h-5" />
            </Button>

            <div className="flex-1 space-y-4">
                {/* RIGA 1: Attività e Dettaglio */}
                <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_2fr_1.5fr_0.8fr_2fr_1fr] gap-4">
                    <div className="space-y-1">
                        <Label className="text-xs text-slate-700 truncate font-bold">Attività *</Label>
                        <Select value="corsi" onValueChange={() => { }}>
                            <SelectTrigger className="h-9 bg-slate-50">
                                <SelectValue placeholder="Corsi" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="corsi">Corsi</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-slate-700 truncate font-bold">SKU / Dettaglio Attività *</Label>
                        <Select value={row.skus[0] || ""} onValueChange={(val) => {
                            updateRow(row.id, 'skus', [val]);
                            if (row.periodId && listinoItems) {
                                const courseId = parseInt(val);
                                const item = listinoItems.find(i => i.entityType === "course" && i.entityId === courseId);
                                if (item) {
                                    let finalPrice = parseFloat(item.price as string);
                                    if (item.quoteId) {
                                        const q = quotes.find(qt => qt.id === item.quoteId);
                                        if (q) finalPrice = parseFloat(q.amount as string);
                                    }
                                    if (!isNaN(finalPrice)) updateRow(row.id, 'basePrice', finalPrice);
                                }
                            }
                        }}>
                            <SelectTrigger className="h-9 bg-yellow-50/50 border-yellow-200">
                                <SelectValue placeholder="Seleziona..." />
                            </SelectTrigger>
                            <SelectContent>
                                {courses?.map(c => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name} {c.sku ? `(${c.sku})` : ''}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-slate-700 truncate font-bold">Periodo Listino</Label>
                        <Select value={row.periodId} onValueChange={(val) => updateRow(row.id, 'periodId', val)}>
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

                {/* RIGA 2: Sconti */}
                <div className="grid grid-cols-1 xl:grid-cols-6 gap-4">
                    <div className="space-y-1">
                        <Label className="text-xs text-emerald-700 truncate">Cod. Promo 2</Label>
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
                        <Label className="text-xs text-blue-700 truncate">Cod. Sconto 1</Label>
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

                {/* RIGA 2.5: Multiselect Categorie e Note */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label className="text-xs text-slate-700 truncate font-bold">Dettagli Iscrizione / Orari</Label>
                        <MultiSelectEnrollmentDetails
                            selectedDetails={row.enrollmentDetails || []}
                            onChange={(vals) => updateRow(row.id, 'enrollmentDetails', vals)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-slate-700 truncate font-bold">Note Pagamento / Causali</Label>
                        <MultiSelectPaymentNotes
                            selectedNotes={row.paymentNotes || []}
                            onChange={(vals) => updateRow(row.id, 'paymentNotes', vals)}
                        />
                    </div>
                </div>

                {/* RIGA 3 (Nascosta/Integrata): Totale Netto di Riga */}
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
