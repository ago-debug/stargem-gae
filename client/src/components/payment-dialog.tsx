
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelectPaymentNotes } from "@/components/multi-select-payment-notes";
import { MultiSelectEnrollmentDetails } from "@/components/multi-select-enrollment-details";
import { StarGemCopilot } from "@/components/star-gem-copilot";
import { CalendarIcon, AlertTriangle, UserIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";

const getEndpoint = (attivita: string) => {
    switch (attivita) {
        case "corsi": return "/api/courses";
        case "prove-pagamento": return "/api/paid-trials";
        case "prove-gratuite": return "/api/free-trials";
        case "lezioni-singole": return "/api/single-lessons";
        case "workshop": return "/api/workshops";
        case "domeniche-movimento": return "/api/sunday-activities";
        case "allenamenti": return "/api/trainings";
        case "lezioni-individuali": return "/api/individual-lessons";
        case "campus": return "/api/campus-activities";
        case "saggi": return "/api/recitals";
        case "vacanze-studio": return "/api/vacation-studies";
        case "servizi-extra": return "/api/booking-services";
        default: return null;
    }
};

export interface PaymentData {
    id?: string; // temporary id for list key
    attivita: string;
    dettaglioId: string;
    dettaglioNome: string; // For display
    enrollmentDetails: string[];
    paymentNotes: string[];
    quantita: number;
    descrizioneQuota: string;
    periodo: string;
    totaleQuota: number;
    codiceSconto: string;
    valoreSconto: number;
    percentualeSconto: number;
    codiciPromo: string;
    valorePromo: number;
    percentualePromo: number;
    acconto: number;
    dataPagamento: string;
    saldoAnnuale: number;
    numeroRicevute: number;
    confermaBonifico: string;
    quotaTesseraCheck?: boolean;
    lezioneProvaCheck?: boolean;
    integrazioneAttiva?: boolean;
    vecchioPagamentoId?: string;
    giorniTrascorsi?: number;
    differenzaVersoNuovaQuota?: number;
    forzaIscrizioneAdmin?: boolean;
    // Computed
    saldoTotale: number;
}

interface PaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (payment: PaymentData) => void;
    initialData?: PaymentData | null;
    corsiDB: { id: number; name: string; sku: string; maxCapacity?: number; currentEnrollment?: number }[];
    categorieDB: { id: number; name: string }[]; // Keeping for completeness if needed later
    memberId?: number;
    memberSelector?: React.ReactNode;
}

const defaultPayment: PaymentData = {
    attivita: "",
    dettaglioId: "",
    dettaglioNome: "",
    enrollmentDetails: [],
    paymentNotes: [],
    quantita: 1,
    descrizioneQuota: "",
    periodo: "",
    totaleQuota: 0,
    codiceSconto: "",
    valoreSconto: 0,
    percentualeSconto: 0,
    codiciPromo: "",
    valorePromo: 0,
    percentualePromo: 0,
    acconto: 0,
    dataPagamento: new Date().toISOString().split('T')[0],
    saldoAnnuale: 0,
    numeroRicevute: 0,
    confermaBonifico: "",
    quotaTesseraCheck: false,
    lezioneProvaCheck: false,
    integrazioneAttiva: false,
    vecchioPagamentoId: "",
    giorniTrascorsi: 0,
    differenzaVersoNuovaQuota: 0,
    forzaIscrizioneAdmin: false,
    saldoTotale: 0,
};

export function PaymentDialog({
    open,
    onOpenChange,
    onSave,
    initialData,
    corsiDB,
    categorieDB,
    memberId,
    memberSelector,
}: PaymentDialogProps) {
    const [formData, setFormData] = useState<PaymentData>(defaultPayment);
    const [isGratuito, setIsGratuito] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [adminCode, setAdminCode] = useState("");
    const [adminCodeForzatura, setAdminCodeForzatura] = useState("");
    const [error, setError] = useState("");
    const [touched, setTouched] = useState(false);

    useEffect(() => {
        if (open) {
            setIsGratuito(false);
            setIsConfirmOpen(false);
            setAdminCode("");
            setAdminCodeForzatura("");
            setError("");
            if (initialData) {
                setFormData({ ...initialData });
                if (initialData.totaleQuota === 0 && initialData.quantita > 0) {
                    setIsGratuito(true);
                    setAdminCode("000zzz");
                }
            } else {
                setFormData({ ...defaultPayment, dataPagamento: new Date().toISOString().split('T')[0] });
            }
        }
    }, [open, initialData]);

    const handleChange = (field: keyof PaymentData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const PERIODS = [
        "Settembre", "Ottobre", "Novembre", "Dicembre",
        "Gennaio", "Febbraio", "Marzo", "Aprile",
        "Maggio", "Giugno"
    ];

    const { data: memberDetails } = useQuery<any>({
        queryKey: [`/api/members/${memberId}`],
        queryFn: async () => {
            if (!memberId) return null;
            const res = await fetch(`/api/members/${memberId}`);
            if (!res.ok) return null;
            return res.json();
        },
        enabled: !!memberId
    });

    const { data: pastPayments } = useQuery<any[]>({
        queryKey: ["/api/payments", { memberId }],
        queryFn: async () => {
            if (!memberId) return [];
            const res = await fetch(`/api/payments?memberId=${memberId}`);
            if (!res.ok) return [];
            return res.json();
        },
        enabled: !!formData.integrazioneAttiva && !!memberId
    });

    const { data: pendingDebts, isLoading: isLoadingDebts } = useQuery<any[]>({
        queryKey: ["/api/payments-pending", memberId],
        queryFn: async () => {
            if (!memberId) return [];
            const res = await fetch(`/api/payments?memberId=${memberId}`);
            if (!res.ok) return [];
            const allPayments = await res.json();
            return allPayments.filter((p: any) => p.status === 'pending' || p.status === 'overdue');
        },
        enabled: !!memberId
    });

    const { data: quoteGrid } = useQuery<any[]>({
        queryKey: ["/api/course-quotes-grid", formData.attivita],
        queryFn: async () => {
            const res = await fetch(`/api/course-quotes-grid?activityType=${formData.attivita}`);
            if (!res.ok) return [];
            return res.json();
        },
        enabled: !!formData.attivita
    });

    const { data: dynamicActivities } = useQuery<any[]>({
        queryKey: [getEndpoint(formData.attivita)],
        queryFn: async () => {
            const endpoint = getEndpoint(formData.attivita);
            if (!endpoint) return [];
            const res = await fetch(endpoint);
            if (!res.ok) return [];
            return res.json();
        },
        enabled: !!getEndpoint(formData.attivita)
    });

    const optionsToRender = formData.attivita === "corsi" && corsiDB && corsiDB.length > 0
        ? corsiDB
        : (dynamicActivities || []).map(item => ({
            id: item.id,
            name: item.name || item.title || `${item.firstName} ${item.lastName}` || `Item ${item.id}`,
            sku: item.sku || item.code || "",
            maxCapacity: item.maxCapacity || 0,
            currentEnrollment: item.currentEnrollment || 0
        }));

    const handleAttivitaChange = (value: string) => {
        handleChange("attivita", value);
        handleChange("dettaglioId", "");
        handleChange("dettaglioNome", "");
        handleChange("periodo", "");
        handleChange("totaleQuota", 0);
        handleChange("descrizioneQuota", "");
    };

    const handleDettaglioChange = (id: string) => {
        handleChange("dettaglioId", id);
        const corso = optionsToRender.find(c => c.id.toString() === id);
        if (corso) {
            handleChange("dettaglioNome", corso.sku ? `${corso.name} - ${corso.sku}` : corso.name);
        } else {
            handleChange("dettaglioNome", "");
        }
    };

    // Auto-popola SKU e Quota Listino
    useEffect(() => {
        if (formData.attivita && formData.dettaglioId && formData.periodo && quoteGrid && quoteGrid.length > 0) {
            const corso = optionsToRender.find(c => c.id.toString() === formData.dettaglioId);
            const skuVal = corso?.sku || "";
            const courseName = corso?.name || "";

            // Trova tutti i listini per questo periodo
            const availableQuotes = quoteGrid.filter(q =>
                q.monthsData && q.monthsData[formData.periodo] && q.monthsData[formData.periodo].quota !== null
            );

            let matchedQuote = null;

            if (availableQuotes.length === 1) {
                // Seleziona univocamente se ce n'è solo uno per periodo
                matchedQuote = availableQuotes[0];
            } else if (availableQuotes.length > 1) {
                // Identificazione tramite Categoria Match
                matchedQuote = availableQuotes.find(q =>
                    (skuVal && q.category && skuVal.toUpperCase().includes(q.category.toUpperCase())) ||
                    (courseName && q.category && courseName.toUpperCase().includes(q.category.toUpperCase()))
                );
            }

            if (matchedQuote) {
                const quoteVal = matchedQuote.monthsData[formData.periodo].quota || 0;
                setFormData(prev => ({
                    ...prev,
                    descrizioneQuota: skuVal ? `${skuVal} - ${matchedQuote.description}` : matchedQuote.description,
                    totaleQuota: quoteVal
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    descrizioneQuota: "",
                    totaleQuota: 0
                }));
            }
        }
    }, [formData.attivita, formData.dettaglioId, formData.periodo, quoteGrid]);


    const selectedCourseData = optionsToRender.find(c => c.id.toString() === formData.dettaglioId);

    // Logica di capienza
    const isCourseFull = selectedCourseData &&
        selectedCourseData.maxCapacity > 0 &&
        selectedCourseData.currentEnrollment >= selectedCourseData.maxCapacity;

    const isMissingFields = !formData.attivita || !formData.dettaglioId || formData.totaleQuota === undefined || !formData.dataPagamento || formData.totaleQuota === null || Number.isNaN(formData.totaleQuota);

    const handlePreSave = () => {
        setTouched(true);

        if (isMissingFields && !isGratuito) {
            setError("Attività, Dettaglio, Data Pagamento e Totale Quota sono obbligatori.");
            return;
        }

        if (isGratuito && adminCode !== "000zzz") {
            setError("Codice Admin non valido per la gratuità.");
            return;
        }

        if (isCourseFull && !formData.forzaIscrizioneAdmin) {
            setError("Il corso ha raggiunto la capienza massima. Seleziona 'Forza Registrazione Admin' per procedere.");
            return;
        }

        if (isCourseFull && formData.forzaIscrizioneAdmin && adminCodeForzatura !== "000zzz") {
            setError("Codice Admin non valido per forzare l'iscrizione al corso pieno.");
            return;
        }

        setError("");
        setIsConfirmOpen(true);
    };

    const handleConfirmSave = () => {
        const finalData = { ...formData };
        if (isGratuito) {
            finalData.totaleQuota = 0;
            finalData.saldoTotale = 0;
            finalData.acconto = 0;
        }

        onSave(finalData);
        setIsConfirmOpen(false);
        onOpenChange(false);
    };

    // Calculate generic total if needed, or just let user input. 
    // For now matching the screenshot input fields.
    // "Saldo Totale (BO)" is readOnly in screenshot. 
    // Assuming it might be TotaleQuota - Sconti + ... ?
    // For now I'll leave it as calculated from the other fields or just 0 if not specified logic.
    // The screenshot shows "€ 0,00" and readOnly.
    // Let's implement a basic calculation: Totale Quota - Valore Sconto - Valore Promo - Acconto
    useEffect(() => {
        let base = formData.totaleQuota || 0;

        // Integrazione - Logica Motore "Alexandra"
        if (formData.integrazioneAttiva && formData.differenzaVersoNuovaQuota) {
            base = formData.differenzaVersoNuovaQuota;
        }

        // Sconti a Cascata: Price = (Base * (1 - Sconto1)) * (1 - Sconto2)
        let scontrato = base;
        if (formData.percentualeSconto > 0) {
            scontrato = scontrato * (1 - (formData.percentualeSconto / 100));
        }
        if (formData.percentualePromo > 0) {
            scontrato = scontrato * (1 - (formData.percentualePromo / 100));
        }

        // Sottrai valori assoluti e acconti
        scontrato = scontrato - (formData.valoreSconto || 0) - (formData.valorePromo || 0) - (formData.acconto || 0);

        // Aggiungi / Sottrai quote custom
        if (formData.quotaTesseraCheck) scontrato += 25;
        if (formData.lezioneProvaCheck) scontrato -= 20;

        setFormData(prev => ({ ...prev, saldoTotale: Math.max(0, scontrato) }));
    }, [
        formData.totaleQuota,
        formData.valoreSconto,
        formData.percentualeSconto,
        formData.valorePromo,
        formData.percentualePromo,
        formData.acconto,
        formData.quotaTesseraCheck,
        formData.lezioneProvaCheck,
        formData.integrazioneAttiva,
        formData.differenzaVersoNuovaQuota
    ]);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
                    <DialogHeader className="bg-slate-50 px-6 py-4 rounded-t-lg border-b m-0 sticky top-0 z-10">
                        <DialogTitle className="text-xl text-primary flex flex-col gap-1">
                            {memberDetails ? (
                                <span className="font-bold flex items-center gap-2">
                                    <UserIcon className="w-5 h-5 flex-shrink-0" />
                                    {memberDetails.firstName} {memberDetails.lastName}
                                </span>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <span className="font-bold">
                                        {initialData ? "Modifica Pagamento" : "Nuovo Pagamento"}
                                    </span>
                                    {memberSelector && (
                                        <div className="w-full max-w-sm mt-1 mb-2 font-normal text-base text-foreground">
                                            {memberSelector}
                                            {touched && !memberId && typeof memberSelector !== 'undefined' && <p className="text-red-500 text-xs mt-1">Seleziona un cliente</p>}
                                        </div>
                                    )}
                                </div>
                            )}
                            <span className="text-sm font-normal text-muted-foreground mt-2">Cosa desideri pagare?</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 p-6">
                        {/* === SEZIONE 1: COSA DESIDERI PAGARE === */}
                        {memberId && (
                            <div className="space-y-3">
                                {isLoadingDebts ? (
                                    <div className="h-20 bg-slate-100 animate-pulse rounded-md w-full border border-slate-200"></div>
                                ) : pendingDebts && pendingDebts.length > 0 ? (
                                    <div className="border rounded-md divide-y overflow-hidden shadow-sm">
                                        {pendingDebts.map((debt, idx) => (
                                            <div
                                                key={debt.id || idx}
                                                className="p-4 hover:bg-slate-50 cursor-pointer transition-colors relative"
                                                onClick={() => {
                                                    // Popolamento rapido se si tratta di un debito esistente
                                                    handleChange("totaleQuota", parseFloat(debt.amount));
                                                    handleChange("descrizioneQuota", debt.description || "");
                                                    if (debt.type) handleChange("attivita", debt.type);
                                                }}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-bold text-slate-800 text-base">{debt.description || debt.type || "Debito Generico"}</span>
                                                    <Badge className="bg-black text-white px-3 font-semibold tracking-wide">
                                                        Da pagare: €{parseFloat(debt.amount).toFixed(2)}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between items-center text-xs text-muted-foreground">
                                                    <span>N/D - Pagamento</span>
                                                    <span className="font-bold text-red-600 flex items-center gap-1">
                                                        [PENDING] €{parseFloat(debt.amount).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="border border-dashed p-4 rounded-md bg-slate-50 text-center text-sm text-slate-500">
                                        Nessun debito pendente per questo cliente. Procedi inserendo i dati manualmente.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* === SEZIONE 2: DATI CORSO E ATTIVITA === */}
                        <div className="space-y-4 bg-white p-5 rounded-lg border shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                                <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                                Dati Corso e Attività
                            </h3>

                            <div className="flex flex-col xl:flex-row gap-4">
                                <div className="space-y-1 w-full xl:w-[15%] shrink-0">
                                    <Label className="text-xs truncate">Attività *</Label>
                                    <Select value={formData.attivita} onValueChange={handleAttivitaChange}>
                                        <SelectTrigger className={cn("h-9", touched && !formData.attivita ? "border-red-500" : "")}>
                                            <SelectValue placeholder="Attività..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="corsi">Corsi</SelectItem>
                                            <SelectItem value="prove-pagamento">Prove a Pagamento</SelectItem>
                                            <SelectItem value="prove-gratuite">Prove Gratuite</SelectItem>
                                            <SelectItem value="lezioni-singole">Lezioni Singole</SelectItem>
                                            <SelectItem value="workshop">Workshop</SelectItem>
                                            <SelectItem value="domeniche-movimento">Domeniche in Movimento</SelectItem>
                                            <SelectItem value="allenamenti">Allenamenti/Affitti</SelectItem>
                                            <SelectItem value="lezioni-individuali">Lezioni Individuali</SelectItem>
                                            <SelectItem value="campus">Campus</SelectItem>
                                            <SelectItem value="saggi">Saggi</SelectItem>
                                            <SelectItem value="vacanze-studio">Vacanze Studio</SelectItem>
                                            <SelectItem value="servizi-extra">Servizi Extra</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1 w-full xl:flex-1 min-w-0">
                                    <Label className="text-xs truncate">SKU / Dettaglio Attività *</Label>
                                    <Select value={formData.dettaglioId} onValueChange={handleDettaglioChange}>
                                        <SelectTrigger className={cn("h-9", touched && !formData.dettaglioId ? "border-red-500" : "")}>
                                            <SelectValue placeholder="Seleziona..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {optionsToRender.length > 0 ? (
                                                optionsToRender.map((corso) => (
                                                    <SelectItem key={corso.id} value={corso.id.toString()}>
                                                        {corso.sku ? `${corso.name} - ${corso.sku}` : corso.name}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="nessuno" disabled>Seleziona attività</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1 w-full xl:w-[15%] shrink-0">
                                    <Label className="text-xs truncate">Periodo (R)</Label>
                                    <Select value={formData.periodo} onValueChange={(v) => handleChange("periodo", v)}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Periodo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PERIODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1 w-full xl:w-[8%] shrink-0">
                                    <Label className="text-xs truncate">Q.tà</Label>
                                    <Input className="h-9" type="number" value={formData.quantita} onChange={(e) => handleChange("quantita", parseInt(e.target.value) || 0)} />
                                </div>

                                <div className="space-y-1 w-full xl:w-[20%] shrink-0">
                                    <Label className="text-xs truncate">Descrizione Quota (Q)</Label>
                                    {quoteGrid && formData.periodo && quoteGrid.filter(q => q.monthsData?.[formData.periodo]?.quota !== null).length > 0 ? (
                                        <Select
                                            value={formData.descrizioneQuota}
                                            onValueChange={(val) => {
                                                const corso = optionsToRender.find(c => c.id.toString() === formData.dettaglioId);
                                                const skuVal = corso?.sku ? `${corso.sku} - ` : "";
                                                const strippedVal = val.replace(skuVal, "");
                                                const selectedQ = quoteGrid.find(q => q.description === strippedVal || `${skuVal}${q.description}` === val);
                                                const price = selectedQ?.monthsData?.[formData.periodo]?.quota || 0;
                                                handleChange("descrizioneQuota", val);
                                                handleChange("totaleQuota", price);
                                            }}
                                        >
                                            <SelectTrigger className={cn("h-9", !formData.descrizioneQuota ? "border-amber-400" : "")}>
                                                <SelectValue placeholder="Listino..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {quoteGrid
                                                    .filter(q => q.monthsData && q.monthsData[formData.periodo] && q.monthsData[formData.periodo].quota !== null)
                                                    .map((q, idx) => {
                                                        const corso = optionsToRender.find(c => c.id.toString() === formData.dettaglioId);
                                                        const skuVal = corso?.sku ? `${corso.sku} - ` : "";
                                                        const displayName = `${skuVal}${q.description}`;
                                                        return (
                                                            <SelectItem key={idx} value={displayName}>
                                                                {q.category ? `[${q.category}] ` : ''}{q.description} (€{q.monthsData[formData.periodo].quota})
                                                            </SelectItem>
                                                        );
                                                    })}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            className="h-9"
                                            value={formData.descrizioneQuota}
                                            onChange={(e) => handleChange("descrizioneQuota", e.target.value)}
                                            placeholder="Manuale..."
                                        />
                                    )}
                                </div>

                                <div className="space-y-1 w-full xl:w-[12%] shrink-0">
                                    <Label className="text-xs truncate">Totale Quota (S) *</Label>
                                    <Input
                                        type="number"
                                        className={cn("h-9 bg-slate-50 font-bold", touched && (formData.totaleQuota === undefined || formData.totaleQuota === null || Number.isNaN(formData.totaleQuota)) ? "border-red-500 animate-pulse" : "")}
                                        value={formData.totaleQuota ?? ''}
                                        onChange={(e) => handleChange("totaleQuota", e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 mt-4">
                                <div className="space-y-2">
                                    <MultiSelectEnrollmentDetails selectedDetails={formData.enrollmentDetails} onChange={(vals) => handleChange("enrollmentDetails", vals)} testIdPrefix="enrollment-detail-dialog" />
                                </div>
                                <div className="space-y-2">
                                    <MultiSelectPaymentNotes selectedNotes={formData.paymentNotes} onChange={(vals) => handleChange("paymentNotes", vals)} testIdPrefix="payment-note-dialog" />
                                </div>
                            </div>
                        </div>

                        {/* === SEZIONE 3: SCONTI E AGEVOLAZIONI === */}
                        <div className="space-y-4 bg-white p-5 rounded-lg border shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                                    Sconti e Agevolazioni
                                </div>
                                <span className="text-xs font-normal text-muted-foreground bg-slate-100 px-2 py-1 rounded">
                                    Formula: (Prezzo × (1 - Sc.1)) × (1 - Sc.2)
                                </span>
                            </h3>

                            <div className="grid grid-cols-1 xl:grid-cols-6 gap-4">
                                {/* Blocco Sconto 1 */}
                                <div className="space-y-1">
                                    <Label className="text-xs text-blue-700 truncate">Cod. Sconto 1 (T)</Label>
                                    <Input className="h-9 bg-blue-50/30 font-mono text-xs uppercase" placeholder="Cod. Campagna" value={formData.codiceSconto} onChange={(e) => handleChange("codiceSconto", e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-blue-700 truncate">Valore (U)</Label>
                                    <Input type="number" className="h-9 bg-blue-50/30 text-right" placeholder="€ 0.00" value={formData.valoreSconto || ''} onChange={(e) => handleChange("valoreSconto", parseFloat(e.target.value) || 0)} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-blue-700 truncate">% Sconto (V)</Label>
                                    <Input type="number" step="0.01" className="h-9 bg-blue-50/30 text-right" placeholder="%" value={formData.percentualeSconto || ''} onChange={(e) => handleChange("percentualeSconto", parseFloat(e.target.value) || 0)} />
                                </div>

                                {/* Blocco Sconto 2 */}
                                <div className="space-y-1">
                                    <Label className="text-xs text-emerald-700 truncate">Cod. Promo 2 (W)</Label>
                                    <Input className="h-9 bg-emerald-50/30 font-mono text-xs uppercase" placeholder="Cod. Personale" value={formData.codiciPromo} onChange={(e) => handleChange("codiciPromo", e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-emerald-700 truncate">Valore (X)</Label>
                                    <Input type="number" className="h-9 bg-emerald-50/30 text-right" placeholder="€ 0.00" value={formData.valorePromo || ''} onChange={(e) => handleChange("valorePromo", parseFloat(e.target.value) || 0)} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-emerald-700 truncate">% Promo</Label>
                                    <Input type="number" step="0.01" className="h-9 bg-emerald-50/30 text-right" placeholder="%" value={formData.percentualePromo || ''} onChange={(e) => handleChange("percentualePromo", parseFloat(e.target.value) || 0)} />
                                </div>
                            </div>
                        </div>

                        {/* === SEZIONE 4: CHIUSURA E CALCOLO === */}
                        <div className="space-y-4 bg-slate-50/50 p-5 rounded-lg border border-slate-200/60 shadow-inner">
                            <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2 border-slate-200">
                                <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span>
                                Servizi Extra e Chiusura
                            </h3>

                            {/* Servizi Extra Header */}
                            <div className="flex flex-col xl:flex-row gap-6 bg-white p-4 rounded-md border shadow-sm">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="quotaTessera" checked={formData.quotaTesseraCheck} onCheckedChange={(c) => handleChange("quotaTesseraCheck", c === true)} />
                                    <Label htmlFor="quotaTessera" className="cursor-pointer">Quota Tessera (+€25)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="lezioneProva" checked={formData.lezioneProvaCheck} onCheckedChange={(c) => handleChange("lezioneProvaCheck", c === true)} />
                                    <Label htmlFor="lezioneProva" className="cursor-pointer text-red-600">Sottrai Prova (-€20)</Label>
                                </div>
                                <div className="flex items-center space-x-2 xl:border-l xl:pl-6 xl:ml-auto border-slate-200">
                                    <Checkbox id="integrazioneAttiva" checked={formData.integrazioneAttiva} onCheckedChange={(c) => handleChange("integrazioneAttiva", c === true)} />
                                    <Label htmlFor="integrazioneAttiva" className="cursor-pointer font-semibold text-indigo-700">Modalità Integrazione</Label>
                                </div>
                            </div>

                            {/* Integrazione Box se attiva */}
                            {formData.integrazioneAttiva && (
                                <div className="mt-4 space-y-4 bg-indigo-50/50 p-4 rounded-md border border-indigo-100">
                                    <Label className="text-indigo-800 font-semibold">Seleziona Pagamento da Stornare (Regola 120gg)</Label>
                                    <Select
                                        value={formData.vecchioPagamentoId}
                                        onValueChange={(val) => {
                                            const selected = pastPayments?.find(p => p.id.toString() === val);
                                            if (selected) {
                                                const diffTime = Math.abs(new Date().getTime() - new Date(selected.paymentDate || selected.createdAt).getTime());
                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                const diffImporto = Math.max(0, (formData.totaleQuota || 0) - Number(selected.amount));
                                                handleChange("giorniTrascorsi", diffDays);
                                                handleChange("vecchioPagamentoId", val);
                                                handleChange("differenzaVersoNuovaQuota", diffDays <= 120 ? diffImporto : 0);
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Scegli pagamento dal passato..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {pastPayments && pastPayments.length > 0 ? (
                                                pastPayments.map(p => (
                                                    <SelectItem key={p.id} value={p.id.toString()}>
                                                        {p.description || "Pagamento"} - € {Number(p.amount).toFixed(2)} ({format(new Date(p.paymentDate || p.createdAt), "dd/MM/yyyy")})
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="nessuno" disabled>Nessun pagamento trovato</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {formData.vecchioPagamentoId && (
                                        <div className="flex flex-col gap-1 mt-2">
                                            <span className="text-sm font-medium text-indigo-900">
                                                Giorni trascorsi: <b className={formData.giorniTrascorsi! <= 120 ? "text-green-600" : "text-red-500"}>{formData.giorniTrascorsi}</b>
                                            </span>
                                            {formData.giorniTrascorsi! <= 120 ? (
                                                <span className="text-sm text-indigo-700">Regola rispettata. Viene calcolata solo la differenza (S).</span>
                                            ) : (
                                                <span className="text-sm text-red-600">Tempo limite superato. Nessun ricalcolo automatico applicato.</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Pagamento Footer Form */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                                <div className="space-y-2">
                                    <Label>Data Pagamento (Z) *</Label>
                                    <Input type="date" className={cn(touched && !formData.dataPagamento ? "border-red-500" : "")} value={formData.dataPagamento} onChange={(e) => handleChange("dataPagamento", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Acconto/Credito (Y)</Label>
                                    <Input type="number" className="text-right" value={formData.acconto || ''} onChange={(e) => handleChange("acconto", parseFloat(e.target.value) || 0)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Saldo Annuale (AA)</Label>
                                    <Input type="number" className="text-right" value={formData.saldoAnnuale || ''} onChange={(e) => handleChange("saldoAnnuale", parseFloat(e.target.value) || 0)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>N. Ricevute</Label>
                                    <Input type="number" className="text-right" value={formData.numeroRicevute || ''} onChange={(e) => handleChange("numeroRicevute", parseInt(e.target.value) || 0)} />
                                </div>
                            </div>

                            {/* Totale Finale Gold */}
                            <div className="flex justify-end pt-6">
                                <div className="flex items-center gap-4 bg-yellow-50/80 px-6 py-4 rounded-xl border-2 border-yellow-400/60 shadow-sm relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/10 to-yellow-600/5 mix-blend-overlay"></div>
                                    <Label className="text-yellow-900/70 font-bold uppercase tracking-widest text-sm z-10">Saldo Totale (bo)</Label>
                                    <div className="text-4xl font-black text-yellow-600 drop-shadow-sm z-10 font-mono">
                                        € {(isGratuito ? 0 : formData.saldoTotale).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col space-y-4 border-t pt-4">
                            <div className="flex items-center gap-2 border p-3 rounded-md bg-red-50/50">
                                <Checkbox
                                    id="gratuita"
                                    checked={isGratuito}
                                    disabled={!formData.attivita || !formData.dettaglioId}
                                    onCheckedChange={(c) => setIsGratuito(c === true)}
                                />
                                <Label htmlFor="gratuita" className={cn("font-bold uppercase tracking-wider cursor-pointer", !formData.attivita || !formData.dettaglioId ? "text-muted-foreground" : "text-red-600")}>
                                    Gratuità (Richiede Codice Admin){!formData.attivita || !formData.dettaglioId ? " - Seleziona attività" : ""}
                                </Label>
                            </div>
                            {isGratuito && (
                                <div className="space-y-2 max-w-sm p-4 border border-red-200 rounded-md bg-red-50">
                                    <Label className="text-red-700">Codice Admin per autorizzazione</Label>
                                    <Input
                                        type="password"
                                        value={adminCode}
                                        onChange={(e) => {
                                            setAdminCode(e.target.value);
                                            setError("");
                                        }}
                                        placeholder="Inserisci codice admin (es. 000zzz)..."
                                        className="border-red-300 focus-visible:ring-red-400"
                                    />
                                    {error && error.includes("Codice Admin non valido per la gratuità") && <p className="text-red-600 font-medium text-sm mt-1">{error}</p>}
                                </div>
                            )}

                            {/* === AVVISO PIENO E FORZATURA ADMIN === */}
                            {isCourseFull && (
                                <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-4 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="text-red-600 animate-pulse mt-0.5" size={20} />
                                        <div>
                                            <h4 className="font-semibold text-red-800">Attenzione: Corso al completo!</h4>
                                            <p className="text-sm text-red-700">Il corso ha raggiunto la capienza massima ({selectedCourseData?.maxCapacity || 0} iscritti).</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3 pl-8">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="forzaIscrizioneAdmin"
                                                checked={formData.forzaIscrizioneAdmin}
                                                onCheckedChange={(c) => handleChange("forzaIscrizioneAdmin", c === true)}
                                            />
                                            <Label htmlFor="forzaIscrizioneAdmin" className="text-red-700 font-medium">Procedi Ugualmente (Forza Iscrizione Admin)</Label>
                                        </div>
                                        {formData.forzaIscrizioneAdmin && (
                                            <div className="flex items-center space-x-2 max-w-sm">
                                                <Label className="w-1/3 text-red-800">Codice Admin</Label>
                                                <Input
                                                    type="password"
                                                    className="border-red-300 focus-visible:ring-red-500"
                                                    placeholder="Inserire Codice Segreto"
                                                    value={adminCodeForzatura}
                                                    onChange={(e) => setAdminCodeForzatura(e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {error && !error.includes("Codice Admin non valido per la gratuità") && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm font-medium">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="bg-slate-50 border-t p-4 rounded-b-lg">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
                        <Button
                            className={cn("gold-3d-button", isMissingFields && !isGratuito ? "opacity-50 cursor-not-allowed" : "")}
                            onClick={handlePreSave}
                            disabled={isMissingFields && !isGratuito && touched}
                        >
                            {initialData ? "Salva Modifiche" : "Aggiungi Pagamento"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Conferma Incasso</AlertDialogTitle>
                        <AlertDialogDescription>
                            Stai per registrare un {initialData ? "aggiornamento al" : "nuovo"} pagamento.
                            <br /><br />
                            <b className="text-slate-800">Importo:</b> € {(isGratuito ? 0 : formData.saldoTotale).toFixed(2)}<br />
                            <b className="text-slate-800">Attività:</b> {optionsToRender.find(c => c.id.toString() === formData.dettaglioId)?.name || "N/A"}
                            {memberDetails ? (
                                <><br /><b className="text-slate-800">Per:</b> {memberDetails.firstName} {memberDetails.lastName}</>
                            ) : ""}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            Conferma e Salva
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
