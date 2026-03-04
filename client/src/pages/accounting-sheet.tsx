import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Search, Wallet, Check, ChevronsUpDown, Download, Printer, User, Plus, CreditCard, Edit } from "lucide-react";
import type { Payment, Member, PaymentMethod, InsertPayment } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { NuovoPagamentoModal } from "@/components/nuovo-pagamento-modal";

export default function AccountingSheet() {
    const { toast } = useToast();
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [memberSearchOpen, setMemberSearchOpen] = useState(false);
    const [memberSearchQuery, setMemberSearchQuery] = useState("");

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const urlMemberId = queryParams.get("memberId");
        if (urlMemberId) {
            fetch(`/api/members/${urlMemberId}`).then(res => res.ok ? res.json() : null).then(member => {
                if (member) setSelectedMember(member);
            }).catch(console.error);
        }
    }, []);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isNuovoPagamentoOpen, setIsNuovoPagamentoOpen] = useState(false);
    const [payingMovement, setPayingMovement] = useState<Payment | null>(null);
    const [paymentMethod, setPaymentMethod] = useState("");
    const [amount, setAmount] = useState("");
    const [notes, setNotes] = useState("");
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [detailsItem, setDetailsItem] = useState<any>(null);

    const { data: paymentMethods } = useQuery<PaymentMethod[]>({
        queryKey: ["/api/payment-methods"],
    });

    const { data: searchedMembersData } = useQuery<{ members: Member[], total: number }>({
        queryKey: [`/api/members?search=${encodeURIComponent(memberSearchQuery)}`],
        enabled: memberSearchQuery.length >= 3,
    });
    const searchedMembers = searchedMembersData?.members || [];

    const { data: payments } = useQuery<Payment[]>({
        queryKey: ["/api/payments", { memberId: selectedMember?.id }],
        enabled: !!selectedMember?.id,
        queryFn: async () => {
            const res = await fetch(`/api/payments?memberId=${selectedMember?.id}`);
            if (!res.ok) throw new Error("Failed to fetch payments");
            return res.json();
        }
    });

    const { data: enrollments } = useQuery<any[]>({
        queryKey: ["/api/enrollments?type=corsi", { memberId: selectedMember?.id }],
        enabled: !!selectedMember?.id,
        queryFn: async () => {
            const res = await fetch(`/api/enrollments?type=corsi&memberId=${selectedMember?.id}`);
            if (!res.ok) throw new Error("Failed to fetch enrollments");
            return res.json();
        }
    });

    const { data: courses } = useQuery<any[]>({
        queryKey: ["/api/courses"],
    });

    const { data: workshopEnrollments } = useQuery<any[]>({
        queryKey: ["/api/workshop-enrollments", { memberId: selectedMember?.id }],
        enabled: !!selectedMember?.id,
        queryFn: async () => {
            const res = await fetch(`/api/workshop-enrollments?memberId=${selectedMember?.id}`);
            if (!res.ok) throw new Error("Failed to fetch workshop enrollments");
            return res.json();
        }
    });

    const { data: workshops } = useQuery<any[]>({
        queryKey: ["/api/workshops"],
    });

    const { data: currentMember } = useQuery<Member>({
        queryKey: ["/api/members", selectedMember?.id],
        enabled: !!selectedMember?.id,
    });

    const { data: seasons } = useQuery<any[]>({
        queryKey: ["/api/seasons"],
    });
    const activeSeason = seasons?.find((s: any) => s.active);

    const displayMember = currentMember || selectedMember;

    const { data: membershipsDataList } = useQuery<any[]>({
        queryKey: ["/api/memberships", { memberId: selectedMember?.id }],
        enabled: !!selectedMember?.id,
        queryFn: async () => {
            const res = await fetch(`/api/memberships?memberId=${selectedMember?.id}`);
            if (!res.ok) throw new Error("Failed to fetch memberships");
            return res.json();
        }
    });

    const { data: studioBookings } = useQuery<any[]>({
        queryKey: ["/api/studio-bookings", { memberId: selectedMember?.id }],
        enabled: !!selectedMember?.id,
        queryFn: async () => {
            const res = await fetch(`/api/studio-bookings?memberId=${selectedMember?.id}`);
            if (!res.ok) throw new Error("Failed to fetch bookings");
            return res.json();
        }
    });

    const memberPayments = payments?.filter(p => p.memberId === selectedMember?.id) || [];

    // Calculation of Total Due and Total Paid
    const memberEnrollments = enrollments?.filter(e => e.memberId === selectedMember?.id) || [];
    const memberWorkshopEnrollments = workshopEnrollments?.filter(e => e.memberId === selectedMember?.id) || [];
    const memberStudioBookings = studioBookings?.filter(b => b.memberId === selectedMember?.id) || [];
    const memberMemberships = membershipsDataList?.filter(m => m.memberId === selectedMember?.id) || [];

    // Corrected Calculations
    const totalDue = [
        ...memberEnrollments.map(e => {
            const course = courses?.find(c => c.id === e.courseId);
            return parseFloat(course?.price || "0");
        }),
        ...memberWorkshopEnrollments.map(e => {
            const workshop = workshops?.find(w => w.id === e.workshopId);
            return parseFloat(workshop?.price || "0");
        }),
        ...memberStudioBookings.map(b => parseFloat(b.amount || "0")),
        ...memberMemberships.map((m: any) => parseFloat(m.fee || "0"))
    ].reduce((sum, val) => sum + val, 0);

    const totalPaid = memberPayments
        .filter(p => (p.status === 'paid' || p.status === 'completed'))
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Calculate sum of specific residues to show 'Residuo da Pagare' correctly even if global credit exists
    const itemizedResidue = [
        ...memberEnrollments.map(e => {
            const course = courses?.find(c => c.id === e.courseId);
            const total = parseFloat(course?.price || "0");
            const paid = memberPayments.filter(p => p.enrollmentId === e.id && (p.status === 'paid' || p.status === 'completed')).reduce((s, p) => s + parseFloat(p.amount), 0);
            return Math.max(0, total - paid);
        }),
        ...memberWorkshopEnrollments.map(e => {
            const workshop = workshops?.find(w => w.id === e.workshopId);
            const total = parseFloat(workshop?.price || "0");
            const paid = memberPayments.filter(p => p.workshopEnrollmentId === e.id && (p.status === 'paid' || p.status === 'completed')).reduce((s, p) => s + parseFloat(p.amount), 0);
            return Math.max(0, total - paid);
        }),
        ...memberStudioBookings.map(b => {
            const total = parseFloat(b.amount || "0");
            const paid = memberPayments.filter(p => p.bookingId === b.id && (p.status === 'paid' || p.status === 'completed')).reduce((s, p) => s + parseFloat(p.amount), 0);
            return Math.max(0, total - paid);
        }),
        ...memberMemberships.map((m: any) => {
            const total = parseFloat(m.fee || "0");
            const paid = memberPayments.filter(p => p.membershipId === m.id && (p.status === 'paid' || p.status === 'completed')).reduce((s, p) => s + parseFloat(p.amount), 0);
            return Math.max(0, total - paid);
        })
    ].reduce((sum, val) => sum + val, 0);

    // Residue is the sum of all itemized residues. This accurately reflects
    // what is left to be paid on specific services.
    const totalInSospeso = itemizedResidue;

    // Create Debt Objects for display
    // Create Debt Objects for display
    // We calculate the *Exact Remaining Balance* for each item to handle partial payments correctly.
    const debts = [
        ...memberEnrollments.map(e => {
            const course = courses?.find(c => c.id === e.courseId);
            const total = parseFloat(course?.price || "0");
            const paid = memberPayments
                .filter(p => p.enrollmentId === e.id && (p.status === 'paid' || p.status === 'completed'))
                .reduce((s, p) => s + parseFloat(p.amount), 0);
            const remaining = Math.max(0, total - paid);

            return {
                id: `debt-enrollment-${e.id}`,
                date: e.enrollmentDate || e.createdAt,
                description: `Iscrizione Corso: ${course?.name || 'Corso'}`,
                type: 'course',
                amount: remaining.toString(), // Show Remaining Debt
                originalAmount: total.toString(),
                paid: paid,
                remaining: remaining, // What is left to pay
                status: remaining <= 0.01 ? 'paid' : (paid > 0.01 ? 'partial' : 'debt'), // If fully paid, mark as such (though logic below filters them maybe?)
                paymentMethod: '-',
                isDebt: true,
                dbId: e.id,
                enrollmentId: e.id,
                paidDate: null,
                dueDate: null,
                createdAt: e.createdAt,
            };
        }),
        ...memberWorkshopEnrollments.map(e => {
            const workshop = workshops?.find(w => w.id === e.workshopId);
            const total = parseFloat(workshop?.price || "0");
            const paid = memberPayments
                .filter(p => p.workshopEnrollmentId === e.id && (p.status === 'paid' || p.status === 'completed'))
                .reduce((s, p) => s + parseFloat(p.amount), 0);
            const remaining = Math.max(0, total - paid);

            return {
                id: `debt-workshop-${e.id}`,
                date: e.enrollmentDate || e.createdAt,
                description: `Iscrizione Workshop: ${workshop?.name || 'Workshop'}`,
                type: 'workshop',
                amount: remaining.toString(),
                originalAmount: total.toString(),
                paid: paid,
                remaining: remaining,
                status: remaining <= 0.01 ? 'paid' : (paid > 0.01 ? 'partial' : 'debt'),
                paymentMethod: '-',
                isDebt: true,
                dbId: e.id,
                workshopEnrollmentId: e.id,
                paidDate: null,
                dueDate: null,
                createdAt: e.createdAt,
            };
        }),
        ...memberStudioBookings.map(b => {
            const total = parseFloat(b.amount || "0");
            const paid = memberPayments
                .filter(p => p.bookingId === b.id && (p.status === 'paid' || p.status === 'completed'))
                .reduce((s, p) => s + parseFloat(p.amount), 0);
            const remaining = Math.max(0, total - paid);

            return {
                id: `debt-booking-${b.id}`,
                date: b.bookingDate || b.createdAt,
                description: `Prenotazione: ${b.title || "Affitto Sala"}`,
                type: 'service_booking',
                amount: remaining.toString(),
                originalAmount: total.toString(),
                paid: paid,
                remaining: remaining,
                status: remaining <= 0.01 ? 'paid' : (paid > 0.01 ? 'partial' : 'debt'),
                paymentMethod: '-',
                isDebt: true,
                dbId: b.id,
                bookingId: b.id,
                paidDate: null,
                dueDate: null,
                createdAt: b.createdAt,
            };
        }),
        ...memberMemberships.map((m: any) => {
            const total = parseFloat(m.fee || "0");
            const paid = memberPayments
                .filter(p => p.membershipId === m.id && (p.status === 'paid' || p.status === 'completed'))
                .reduce((s, p) => s + parseFloat(p.amount), 0);
            const remaining = Math.max(0, total - paid);

            return {
                id: `debt-membership-${m.id}`,
                date: m.issueDate || m.createdAt,
                description: `Quota Tessera (${m.membershipNumber})`,
                type: 'membership',
                amount: remaining.toString(),
                originalAmount: total.toString(),
                paid: paid,
                remaining: remaining,
                status: remaining <= 0.01 ? 'paid' : (paid > 0.01 ? 'partial' : 'debt'),
                paymentMethod: '-',
                isDebt: true,
                dbId: m.id,
                membershipId: m.id,
                paidDate: null,
                dueDate: null,
                createdAt: m.createdAt,
            };
        })
    ];
    // The user wants to "track partial payments under the service".
    // If we only show 'debt' status, fully paid services disappear from the "Addebito" list. 
    // But sortedMovements mixes payments and debts. 
    // Let's keep them all for history, but visually indicate if settled.
    // If I filter `d.status === 'debt'`, fully paid items disappear. 
    // The user said "ripuliamo la tabella" before. 
    // If I show fully paid debts, it might clutter, but it provides context "This cost 100".
    // Let's KEEP them but maybe sort/style? 
    // Actually, to avoid clutter and confusion with "Total Due", let's filter only active debts OR 
    // better, let's include them but the "Paga" button will only appear if remaining > 0.
    // I will REMOVE the filter(d => d.status === 'debt') to show history of costs.


    // Sort by date (descending)
    // Mostriamo solo i debiti (servizi da pagare o già pagati) come richiesto dall'utente
    const sortedMovements = [...debts].sort((a, b) => {
        // Use full timestamp for sorting to ensure correct order
        const dateA = new Date(a.createdAt || a.paidDate || a.dueDate || (a as any).date || 0).getTime();
        const dateB = new Date(b.createdAt || b.paidDate || b.dueDate || (b as any).date || 0).getTime();
        return dateB - dateA;
    });

    const typeLabels: Record<string, string> = {
        'COURSE': 'CORSO',
        'WORKSHOP': 'WORKSHOP',
        'SERVICE_BOOKING': 'PRENOTAZIONE',
        'MEMBERSHIP': 'TESSERA',
        'OTHER': 'ALTRO'
    };

    const handlePrint = () => {
        window.print();
    };

    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [selectedType, setSelectedType] = useState<string>("");
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

    const createPaymentMutation = useMutation({
        mutationFn: async (data: InsertPayment) => {
            await apiRequest("POST", "/api/payments", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
            queryClient.invalidateQueries({ queryKey: ["/api/members"] });
            queryClient.invalidateQueries({ queryKey: ["/api/enrollments?type=corsi"] });
            queryClient.invalidateQueries({ queryKey: ["/api/workshop-enrollments"] });
            queryClient.invalidateQueries({ queryKey: ["/api/memberships"] });
            queryClient.invalidateQueries({ queryKey: ["/api/studio-bookings"] });
            toast({ title: "Pagamento registrato" });
            setIsPaymentDialogOpen(false);
            resetPaymentForm();
        },
    });

    const updatePaymentMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<InsertPayment> }) => {
            await apiRequest("PATCH", `/api/payments/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
            queryClient.invalidateQueries({ queryKey: ["/api/members"] });
            queryClient.invalidateQueries({ queryKey: ["/api/enrollments?type=corsi"] });
            queryClient.invalidateQueries({ queryKey: ["/api/workshop-enrollments"] });
            queryClient.invalidateQueries({ queryKey: ["/api/memberships"] });
            queryClient.invalidateQueries({ queryKey: ["/api/studio-bookings"] });
            toast({ title: "Pagamento aggiornato" });
            setIsPaymentDialogOpen(false);
            resetPaymentForm();
        },
    });

    const updateMemberMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            await apiRequest("PATCH", `/api/members/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/members"] });
        },
    });

    const resetPaymentForm = () => {
        setPayingMovement(null);
        setEditingPayment(null);
        setSelectedItem(null);
        setSelectedType("");
        setPaymentMethod("");
        setAmount("");
        setNotes("");
    };

    const handleQuickPay = (movement: Payment) => {
        setPayingMovement(movement);
        setAmount(movement.amount);
        setPaymentMethod(movement.paymentMethod || "");
        setNotes(movement.notes || "");

        // Find associated item
        if (movement.enrollmentId) {
            setSelectedItem({ id: `enrollment-${movement.enrollmentId}`, dbId: movement.enrollmentId, type: 'course', remaining: parseFloat(movement.amount) });
            setSelectedType('course');
        } else if (movement.workshopEnrollmentId) {
            setSelectedItem({ id: `workshop-${movement.workshopEnrollmentId}`, dbId: movement.workshopEnrollmentId, type: 'workshop', remaining: parseFloat(movement.amount) });
            setSelectedType('workshop');
        } else if (movement.bookingId) {
            setSelectedItem({ id: `booking-${movement.bookingId}`, dbId: movement.bookingId, type: 'service_booking', remaining: parseFloat(movement.amount) });
            setSelectedType('service_booking');
        } else if (movement.membershipId) {
            setSelectedItem({ id: `membership-${movement.membershipId}`, dbId: movement.membershipId, type: 'membership', remaining: parseFloat(movement.amount) });
            setSelectedType('membership');
        }

        setIsPaymentDialogOpen(true);
    };

    const handleEditPayment = (payment: Payment) => {
        setEditingPayment(payment);
        setAmount(payment.amount);
        setPaymentMethod(payment.paymentMethod || "");
        setNotes(payment.notes || "");
        setSelectedType(payment.type || "");

        // Find associated item
        if (payment.enrollmentId) {
            setSelectedItem({ id: `enrollment-${payment.enrollmentId}`, dbId: payment.enrollmentId, type: 'course' });
        } else if (payment.workshopEnrollmentId) {
            setSelectedItem({ id: `workshop-${payment.workshopEnrollmentId}`, dbId: payment.workshopEnrollmentId, type: 'workshop' });
        } else if (payment.bookingId) {
            setSelectedItem({ id: `booking-${payment.bookingId}`, dbId: payment.bookingId, type: 'service_booking' });
        } else if (payment.membershipId) {
            setSelectedItem({ id: `membership-${payment.membershipId}`, dbId: payment.membershipId, type: 'membership' });
        }

        setIsPaymentDialogOpen(true);
    };

    const handleNewPayment = () => {
        resetPaymentForm();
        setIsNuovoPagamentoOpen(true);
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember) return;

        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const parsePrice = (val: string | number) => {
            if (val === undefined || val === null || val === "") return 0;
            let s = val.toString().trim();
            if (s.includes(',')) {
                s = s.replace(/\./g, ''); // remove dots only if commas (European thousands) exist
                s = s.replace(',', '.');  // replace decimal comma with dot
            }
            return parseFloat(s) || 0;
        };
        const enteredAmount = parsePrice(amount);

        let maxPayable = 0;
        if (payingMovement) {
            maxPayable = parseFloat(payingMovement.amount);
        } else if (selectedItem) {
            maxPayable = selectedItem.remaining;
        } else {
            // Generic payment: prevent paying more than global residue
            maxPayable = totalInSospeso;
        }

        // If editing, we must add back the current payment amount to the allowed limit
        // because we are effectively replacing the old amount with the new one.
        if (editingPayment) {
            maxPayable += parseFloat(editingPayment.amount);
        }

        const originalDebt = maxPayable; // For error message consistency
        const method = paymentMethod;

        if (!method) {
            toast({
                title: "Metodo di Pagamento Mancante",
                description: "Seleziona un metodo di pagamento per procedere.",
                variant: "destructive"
            });
            return;
        }

        // Validation: Overpayment NOT allowed (Strict Check for ALL types of payments)
        // Convert to cents to avoid floating point issues (e.g. 50.01 vs 50.0099999)
        const enteredCents = Math.round(enteredAmount * 100);
        const maxCents = Math.round(maxPayable * 100);

        if (enteredCents > maxCents) {
            toast({
                title: "Importo non valido",
                variant: "destructive",
                description: `L'importo inserito (€${enteredAmount.toFixed(2)}) supera il debito residuo (€${maxPayable.toFixed(2)}). Differenza non ammessa.`
            });
            return;
        }

        const data: InsertPayment = {
            memberId: selectedMember.id,
            enrollmentId: selectedItem?.type === 'course' ? selectedItem.dbId : (payingMovement?.enrollmentId || editingPayment?.enrollmentId || null),
            workshopEnrollmentId: selectedItem?.type === 'workshop' ? selectedItem.dbId : (payingMovement?.workshopEnrollmentId || editingPayment?.workshopEnrollmentId || null),
            bookingId: selectedItem?.type === 'service_booking' ? selectedItem.dbId : (payingMovement?.bookingId || editingPayment?.bookingId || null),
            membershipId: selectedItem?.type === 'membership' ? selectedItem.dbId : (payingMovement?.membershipId || editingPayment?.membershipId || null),
            amount: amount,
            type: selectedType || (payingMovement?.type || editingPayment?.type || "other"),
            description: formData.get("description")?.toString() || (payingMovement?.description || editingPayment?.description || "Pagamento da scheda contabile"),
            status: "paid",
            paidDate: formData.get("paidDate") ? new Date(formData.get("paidDate")!.toString()) : new Date(),
            dueDate: formData.get("dueDate") ? new Date(formData.get("dueDate")!.toString()) : (payingMovement?.dueDate || editingPayment?.dueDate || null),
            paymentMethod: method,
            notes: notes,
            seasonId: activeSeason?.id || null
        };

        if (editingPayment || payingMovement) {
            updatePaymentMutation.mutate({
                id: (editingPayment?.id || payingMovement?.id)!,
                data: data
            });
        } else {
            createPaymentMutation.mutate(data);
        }
    };

    const formatLocalISO = (date: Date | string | null | undefined) => {
        if (!date) return "";
        const d = new Date(date);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };
    const nowLocalISO = formatLocalISO(new Date());

    const handleExportCSV = () => {
        if (!selectedMember) return;

        const headers = ["Data", "Descrizione", "Tipo", "Totale", "Pagato", "Residuo", "Stato"];
        const rows = sortedMovements.map(m => [
            m.date ? new Date(m.date).toLocaleDateString('it-IT') : "-",
            m.description || "Servizio",
            typeLabels[m.type] || m.type,
            `€${parseFloat(m.originalAmount).toFixed(2)}`,
            `€${m.paid.toFixed(2)}`,
            `€${m.remaining.toFixed(2)}`,
            m.remaining <= 0.01 ? "SALDATO" : (m.paid > 0.01 ? "PARZIALE" : "DA SALDARE")
        ]);

        const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `estratto_conto_${selectedMember.lastName}_${selectedMember.firstName}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast({ title: "Esportazione completata" });
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Scheda Contabile Movimenti</h1>
                    <p className="text-muted-foreground">Visualizza l'estratto conto e lo storico pagamenti di un cliente</p>
                </div>
                <div className="flex gap-2 print:hidden">
                    <Button
                        variant="default"
                        onClick={handleNewPayment}
                        disabled={!selectedMember || totalInSospeso < 0.01}
                        className="bg-primary hover:bg-primary/90 disabled:opacity-50"
                        title={totalInSospeso < 0.01 ? "Nessun debito da saldare" : "Nuovo Pagamento"}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nuovo Pagamento
                    </Button>
                    <Button variant="outline" onClick={handleExportCSV} disabled={!selectedMember}>
                        <Download className="w-4 h-4 mr-2" />
                        Esporta CSV
                    </Button>
                    <Button variant="outline" onClick={handlePrint} disabled={!selectedMember}>
                        <Printer className="w-4 h-4 mr-2" />
                        Stampa
                    </Button>
                </div>
            </div>

            <Card className="print:shadow-none print:border-none">
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-end gap-4 print:hidden">
                        <div className="flex-1 space-y-2">
                            <Label>Seleziona Cliente</Label>
                            <Popover open={memberSearchOpen} onOpenChange={setMemberSearchOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between font-normal h-12 text-base"
                                    >
                                        {selectedMember ? (
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-primary" />
                                                <span className="font-semibold">{selectedMember.firstName} {selectedMember.lastName}</span>
                                                <span className="text-xs text-muted-foreground ml-2">({selectedMember.fiscalCode})</span>
                                            </div>
                                        ) : (
                                            "Cerca cliente per nome, cognome o codice fiscale..."
                                        )}
                                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[500px] p-0" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Digita almeno 3 caratteri..."
                                            onValueChange={setMemberSearchQuery}
                                        />
                                        <CommandList>
                                            {memberSearchQuery.length < 3 ? (
                                                <CommandEmpty>Digita almeno 3 caratteri...</CommandEmpty>
                                            ) : searchedMembers.length === 0 ? (
                                                <CommandEmpty>Nessun cliente trovato.</CommandEmpty>
                                            ) : (
                                                <CommandGroup>
                                                    {searchedMembers.map((member: Member) => (
                                                        <CommandItem
                                                            key={member.id}
                                                            value={`${member.firstName} ${member.lastName}`}
                                                            onSelect={() => {
                                                                setSelectedMember(member);
                                                                setMemberSearchOpen(false);
                                                            }}
                                                            className="p-3"
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="font-bold">{member.firstName} {member.lastName}</span>
                                                                <span className="text-xs text-muted-foreground">{member.fiscalCode}</span>
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
                    </div>

                    {selectedMember && (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">


                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3 text-green-700">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <Check className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-0.5">Totale Versato</p>
                                        <p className="text-2xl font-black">€{totalPaid.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3 text-rose-700">
                                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                                        <ChevronsUpDown className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-0.5">Residuo da Pagare</p>
                                        <p className="text-2xl font-black text-rose-600">€{totalInSospeso.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {!selectedMember ? (
                        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-muted/20">
                            <User className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                            <p className="text-muted-foreground font-medium italic">Seleziona un cliente per visualizzare i movimenti contabili</p>
                        </div>
                    ) : sortedMovements.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-muted/20">
                            <p className="text-muted-foreground font-medium italic">Nessun movimento registrato per questo cliente</p>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <Table className="w-full table-fixed">
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[140px]">Data</TableHead>
                                        <TableHead className="min-w-[250px]">Descrizione</TableHead>
                                        <TableHead className="w-[150px]">Tipo</TableHead>
                                        <TableHead className="w-[120px] text-right">Totale</TableHead>
                                        <TableHead className="w-[120px] text-right">Pagato</TableHead>
                                        <TableHead className="w-[120px] text-right">Residuo</TableHead>
                                        <TableHead className="w-[140px] text-center">Stato</TableHead>
                                        <TableHead className="w-[140px] text-right print:hidden">Azioni</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedMovements.map((m: any) => (
                                        <TableRow key={m.id} className="hover:bg-accent/30 transition-colors bg-slate-50/50">
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{m.date ? new Date(m.date).toLocaleDateString('it-IT') : "-"}</span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {m.createdAt ? new Date(m.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <span className="font-semibold align-middle cursor-pointer hover:underline text-primary" onClick={() => { setDetailsItem(m); setIsDetailsDialogOpen(true); }}>
                                                        {m.description || 'Servizio'}
                                                    </span>
                                                    {m.notes && <span className="text-[10px] text-muted-foreground italic ml-2 align-middle">- {m.notes}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs font-semibold text-muted-foreground">
                                                {typeLabels[m.type] || m.type}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-base whitespace-nowrap">
                                                €{parseFloat(m.originalAmount).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-base text-green-600 whitespace-nowrap">
                                                €{m.paid.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-base text-rose-600 whitespace-nowrap">
                                                €{m.remaining.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {m.remaining <= 0.01 ? (
                                                    <Badge variant="outline" className="font-bold px-3 text-white border-green-600 bg-green-600">SALDATO</Badge>
                                                ) : m.paid > 0.01 ? (
                                                    <Badge variant="outline" className="font-bold px-3 text-orange-700 border-orange-300 bg-orange-100">PARZIALE</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="font-bold px-3 text-slate-500 border-slate-300 bg-slate-100">DA SALDARE</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right print:hidden">
                                                <div className="flex justify-end gap-1">
                                                    <Button size="sm" variant="ghost" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => { setDetailsItem(m); setIsDetailsDialogOpen(true); }} title="Dettagli pagamenti">
                                                        <Search className="w-4 h-4 mr-1" />
                                                        Dettagli
                                                    </Button>
                                                    {m.remaining > 0.01 && (
                                                        <Button size="sm" variant="ghost" className="h-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => {
                                                            const debtItem = { id: m.id, dbId: m.dbId, type: m.type, remaining: m.remaining };
                                                            setSelectedItem(debtItem);
                                                            setAmount(debtItem.remaining.toFixed(2));
                                                            setSelectedType(m.type);
                                                            setIsPaymentDialogOpen(true);
                                                        }}>
                                                            <CreditCard className="w-4 h-4 mr-1" />
                                                            Paga
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {selectedMember && (
                <div className="hidden print:block fixed bottom-0 left-0 right-0 p-8 border-t text-center text-xs text-muted-foreground">
                    Estratto conto generato il {new Date().toLocaleString('it-IT')} - Studio Gem
                </div>
            )}

            <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Dettaglio Pagamenti: {detailsItem?.description}</DialogTitle>
                        <DialogDescription>
                            Tutti i movimenti contabili associati a questo servizio.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="bg-slate-50 p-3 rounded-lg border">
                                <p className="text-xs text-muted-foreground uppercase font-bold">Totale</p>
                                <p className="text-lg font-black">€{detailsItem ? parseFloat(detailsItem.originalAmount).toFixed(2) : "0.00"}</p>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                <p className="text-xs text-green-700 uppercase font-bold">Pagato</p>
                                <p className="text-lg font-black text-green-700">€{detailsItem ? detailsItem.paid.toFixed(2) : "0.00"}</p>
                            </div>
                            <div className="bg-rose-50 p-3 rounded-lg border border-rose-200">
                                <p className="text-xs text-rose-700 uppercase font-bold">Residuo</p>
                                <p className="text-lg font-black text-rose-700">€{detailsItem ? detailsItem.remaining.toFixed(2) : "0.00"}</p>
                            </div>
                        </div>

                        {memberPayments.filter(p =>
                            (p.status === 'paid' || p.status === 'completed') &&
                            ((detailsItem?.type === 'course' && p.enrollmentId === detailsItem.dbId) ||
                                (detailsItem?.type === 'workshop' && p.workshopEnrollmentId === detailsItem.dbId) ||
                                (detailsItem?.type === 'service_booking' && p.bookingId === detailsItem.dbId) ||
                                (detailsItem?.type === 'membership' && p.membershipId === detailsItem.dbId))
                        ).length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">Nessun pagamento registrato.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Importo</TableHead>
                                        <TableHead>Metodo e Tracciamento</TableHead>
                                        <TableHead>Note</TableHead>
                                        <TableHead className="text-right">Azioni</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {memberPayments.filter(p =>
                                        (p.status === 'paid' || p.status === 'completed') &&
                                        ((detailsItem?.type === 'course' && p.enrollmentId === detailsItem.dbId) ||
                                            (detailsItem?.type === 'workshop' && p.workshopEnrollmentId === detailsItem.dbId) ||
                                            (detailsItem?.type === 'service_booking' && p.bookingId === detailsItem.dbId) ||
                                            (detailsItem?.type === 'membership' && p.membershipId === detailsItem.dbId))
                                    ).map((p: any) => (
                                        <TableRow key={p.id}>
                                            <TableCell>{p.paidDate ? new Date(p.paidDate).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : new Date(p.createdAt || '').toLocaleString('it-IT')}</TableCell>
                                            <TableCell className="font-bold text-green-600">€{parseFloat(p.amount).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span>{p.paymentMethod || "-"}</span>
                                                    {(p.createdBy || p.updatedBy) && (
                                                        <div className="text-[10px] text-muted-foreground border-t pt-1 mt-1">
                                                            {p.createdBy && (
                                                                <div title="Creato da">👤 {p.createdBy} il {new Date(p.createdAt || '').toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}</div>
                                                            )}
                                                            {p.updatedBy && (
                                                                <div title="Ultima modifica" className="italic mt-0.5">
                                                                    📝 {p.updatedBy} il {p.updatedAt ? new Date(p.updatedAt).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={p.notes || ""}>{p.notes || "-"}</TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="ghost" onClick={() => { setIsDetailsDialogOpen(false); handleEditPayment(p); }}>
                                                    <Edit className="w-4 h-4 inline" /> Modifica
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <NuovoPagamentoModal
                isOpen={isNuovoPagamentoOpen}
                onClose={() => setIsNuovoPagamentoOpen(false)}
                defaultMemberId={selectedMember?.id}
            />

            <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => { if (!open) resetPaymentForm(); setIsPaymentDialogOpen(open); }}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{(editingPayment || payingMovement) ? 'Modifica/Registra Pagamento' : 'Nuovo Pagamento'}</DialogTitle>
                        <DialogDescription>
                            Registra i dettagli del pagamento per {selectedMember?.firstName} {selectedMember?.lastName}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                        {/* WALLET DISPLAY */}


                        {/* Item selection (only for new payments or when paying a debt) */}
                        {!editingPayment && !payingMovement && (
                            <div className="space-y-2">
                                <Label>Cosa desideri pagare?</Label>
                                <div className="grid grid-cols-1 gap-2 border rounded-md p-3 max-h-48 overflow-y-auto bg-muted/20">
                                    {(() => {
                                        const items: any[] = [];
                                        const memberId = selectedMember?.id;

                                        // Courses
                                        enrollments?.filter(e => e.memberId === memberId).forEach(e => {
                                            const course = courses?.find(c => c.id === e.courseId);
                                            const total = parseFloat(course?.price || "0");
                                            const paid = payments?.filter(p => p.enrollmentId === e.id && (p.status === 'paid' || p.status === 'completed')).reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
                                            items.push({ id: `enrollment-${e.id}`, dbId: e.id, type: 'course', label: `${course?.name || "Corso"}`, remaining: total - paid });
                                        });

                                        // Workshops
                                        workshopEnrollments?.filter(e => e.memberId === memberId).forEach(e => {
                                            const workshop = workshops?.find(w => w.id === e.workshopId);
                                            const total = parseFloat(workshop?.price || "0");
                                            const paid = payments?.filter(p => p.workshopEnrollmentId === e.id && (p.status === 'paid' || p.status === 'completed')).reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
                                            items.push({ id: `workshop-${e.id}`, dbId: e.id, type: 'workshop', label: `${workshop?.name || "Workshop"}`, remaining: total - paid });
                                        });

                                        // Studio Bookings
                                        studioBookings?.filter(b => b.memberId === memberId).forEach(b => {
                                            const total = parseFloat(b.amount || "0");
                                            const paid = payments?.filter(p => p.bookingId === b.id && (p.status === 'paid' || p.status === 'completed')).reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
                                            items.push({ id: `booking-${b.id}`, dbId: b.id, type: 'service_booking', label: `Prenotazione: ${b.title || "Affitto"}`, remaining: total - paid });
                                        });

                                        // Membership
                                        membershipsDataList?.filter(m => m.memberId === memberId).forEach(m => {
                                            const total = parseFloat(m.fee || "0");
                                            const paid = payments?.filter(p => p.membershipId === m.id && (p.status === 'paid' || p.status === 'completed')).reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
                                            items.push({ id: `membership-${m.id}`, dbId: m.id, type: 'membership', label: `Quota Tessera (${m.membershipNumber})`, remaining: total - paid });
                                        });

                                        if (items.length === 0) return <p className="text-xs text-muted-foreground italic">Nessun servizio da pagare trovato.</p>;

                                        return items.map(item => (
                                            <div
                                                key={item.id}
                                                className={cn(
                                                    "flex justify-between items-center p-2 rounded border cursor-pointer transition-colors",
                                                    selectedItem?.id === item.id ? "bg-primary/10 border-primary" : "hover:bg-accent"
                                                )}
                                                onClick={() => {
                                                    const pendingMove = memberPayments.find(p =>
                                                        p.status === 'pending' && (
                                                            (item.type === 'course' && p.enrollmentId === item.dbId) ||
                                                            (item.type === 'workshop' && p.workshopEnrollmentId === item.dbId) ||
                                                            (item.type === 'service_booking' && p.bookingId === item.dbId) ||
                                                            (item.type === 'membership' && p.membershipId === item.dbId)
                                                        )
                                                    );

                                                    if (pendingMove) {
                                                        setPayingMovement(pendingMove);
                                                        setAmount(pendingMove.amount);
                                                    } else {
                                                        setSelectedItem(item);
                                                        setAmount(item.remaining.toFixed(2));
                                                    }
                                                    setSelectedType(item.type);
                                                }}
                                            >
                                                <span className="text-sm font-medium">{item.label}</span>
                                                <Badge variant={item.remaining > 0 ? 'destructive' : 'outline'}>
                                                    {item.remaining > 0 ? `€${item.remaining.toFixed(2)}` : 'PAGATO'}
                                                </Badge>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Descrizione</Label>
                            <Input
                                name="description"
                                defaultValue={editingPayment?.description || payingMovement?.description || ""}
                                placeholder="Descrizione del pagamento"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Importo (€)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo</Label>
                                <Select value={selectedType} onValueChange={setSelectedType} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="course">Corso</SelectItem>
                                        <SelectItem value="membership">Tessera</SelectItem>
                                        <SelectItem value="workshop">Workshop</SelectItem>
                                        <SelectItem value="service_booking">Prenotazione</SelectItem>
                                        <SelectItem value="other">Altro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Data Scadenza</Label>
                                <Input
                                    type="date"
                                    name="dueDate"
                                    defaultValue={editingPayment?.dueDate ? new Date(editingPayment.dueDate).toISOString().split('T')[0] : (payingMovement?.dueDate ? new Date(payingMovement.dueDate).toISOString().split('T')[0] : "")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Data Pagamento</Label>
                                <Input
                                    type="datetime-local"
                                    name="paidDate"
                                    defaultValue={editingPayment?.paidDate ? formatLocalISO(editingPayment.paidDate) : nowLocalISO}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Metodo di Pagamento</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleziona metodo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {paymentMethods?.map(pm => (
                                        <SelectItem key={pm.id} value={pm.name}>{pm.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Note</Label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Note aggiuntive..."
                                className="min-h-[60px]"
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Annulla</Button>
                            <Button type="submit" disabled={createPaymentMutation.isPending || updatePaymentMutation.isPending}>
                                {editingPayment ? 'Salva Modifiche' : 'Conferma Pagamento'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
