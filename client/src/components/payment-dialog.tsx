
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelectPaymentNotes } from "@/components/multi-select-payment-notes";
import { MultiSelectEnrollmentDetails } from "@/components/multi-select-enrollment-details";
import { StarGemCopilot } from "@/components/star-gem-copilot";
import { CalendarIcon } from "lucide-react";
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
    // Computed
    saldoTotale: number;
}

interface PaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (payment: PaymentData) => void;
    initialData?: PaymentData | null;
    corsiDB: { id: number; name: string; sku: string }[];
    categorieDB: { id: number; name: string }[]; // Keeping for completeness if needed later
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
    saldoTotale: 0,
};

export function PaymentDialog({
    open,
    onOpenChange,
    onSave,
    initialData,
    corsiDB,
}: PaymentDialogProps) {
    const [formData, setFormData] = useState<PaymentData>(defaultPayment);
    const [isGratuito, setIsGratuito] = useState(false);
    const [adminCode, setAdminCode] = useState("");
    const [error, setError] = useState("");
    const [touched, setTouched] = useState(false);

    useEffect(() => {
        if (open) {
            setIsGratuito(false);
            setAdminCode("");
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
            sku: item.sku || item.code || ""
        }));

    const handleAttivitaChange = (value: string) => {
        handleChange("attivita", value);
        handleChange("dettaglioId", "");
        handleChange("dettaglioNome", "");
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

    const isMissingFields = !formData.attivita || !formData.dettaglioId || formData.totaleQuota === undefined || !formData.dataPagamento || formData.totaleQuota === null || Number.isNaN(formData.totaleQuota);

    const handleSave = () => {
        setTouched(true);

        if (isMissingFields && !isGratuito) {
            setError("Attività, Dettaglio, Data Pagamento e Totale Quota sono obbligatori.");
            return;
        }

        if (isGratuito && adminCode !== "000zzz") {
            setError("Codice Admin non valido per la gratuità.");
            return;
        }

        setError("");
        const finalData = { ...formData };
        if (isGratuito) {
            finalData.totaleQuota = 0;
            finalData.saldoTotale = 0;
            finalData.acconto = 0;
        }

        onSave(finalData);
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
        const total = (formData.totaleQuota || 0)
            - (formData.valoreSconto || 0)
            - (formData.valorePromo || 0)
            - (formData.acconto || 0);
        setFormData(prev => ({ ...prev, saldoTotale: total }));
    }, [
        formData.totaleQuota,
        formData.valoreSconto,
        formData.valorePromo,
        formData.acconto
    ]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Modifica Pagamento" : "Nuovo Pagamento"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                        <div className="space-y-2">
                            <Label>Attività</Label>
                            <Select value={formData.attivita} onValueChange={handleAttivitaChange}>
                                <SelectTrigger className={cn(touched && !formData.attivita ? "border-red-500" : "")}>
                                    <SelectValue placeholder="Seleziona attività" />
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
                                </SelectContent>
                            </Select>
                            {touched && !formData.attivita && <p className="text-red-500 text-xs mt-1">Obbligatorio</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Dettaglio Attività e codice</Label>
                            <Select value={formData.dettaglioId} onValueChange={handleDettaglioChange}>
                                <SelectTrigger className={cn(touched && !formData.dettaglioId ? "border-red-500" : "")}>
                                    <SelectValue placeholder="Seleziona dettaglio" />
                                </SelectTrigger>
                                <SelectContent>
                                    {optionsToRender.length > 0 ? (
                                        optionsToRender.map((corso) => (
                                            <SelectItem key={corso.id} value={corso.id.toString()}>
                                                {corso.sku ? `${corso.name} - ${corso.sku}` : corso.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="nessuno" disabled>Seleziona un'attività valida prima</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            {touched && !formData.dettaglioId && <p className="text-red-500 text-xs mt-1">Obbligatorio</p>}
                        </div>
                        <div className="space-y-2">
                            <MultiSelectEnrollmentDetails
                                selectedDetails={formData.enrollmentDetails}
                                onChange={(vals) => handleChange("enrollmentDetails", vals)}
                                testIdPrefix="enrollment-detail-dialog"
                            />
                        </div>
                        <div className="space-y-2">
                            <MultiSelectPaymentNotes
                                selectedNotes={formData.paymentNotes}
                                onChange={(vals) => handleChange("paymentNotes", vals)}
                                testIdPrefix="payment-note-dialog"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Quantità</Label>
                            <Input
                                type="number"
                                value={formData.quantita}
                                onChange={(e) => handleChange("quantita", parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Descrizione Quota (Q)</Label>
                                <StarGemCopilot onSelect={(ai) => console.log(`AI help for quota using ${ai}`)} />
                            </div>
                            <Input
                                value={formData.descrizioneQuota}
                                onChange={(e) => handleChange("descrizioneQuota", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 lg:col-span-6">
                            {/* Periodo span could be wider or as requested */}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Periodo (R)</Label>
                                <StarGemCopilot onSelect={(ai) => console.log(`AI help for period using ${ai}`)} />
                            </div>
                            <Input
                                value={formData.periodo}
                                onChange={(e) => handleChange("periodo", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                        <div className="space-y-2">
                            <Label>Totale Quota (S) *</Label>
                            <Input
                                type="number"
                                className={cn(touched && (formData.totaleQuota === undefined || formData.totaleQuota === null || Number.isNaN(formData.totaleQuota)) ? "border-red-500" : "")}
                                value={formData.totaleQuota ?? ''}
                                onChange={(e) => handleChange("totaleQuota", e.target.value === '' ? undefined : parseFloat(e.target.value))}
                            />
                            {touched && (formData.totaleQuota === undefined || formData.totaleQuota === null || Number.isNaN(formData.totaleQuota)) && <p className="text-red-500 text-xs mt-1">Obbligatorio</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Codice Sconto (T)</Label>
                            <Input
                                className="bg-yellow-50 border-yellow-200"
                                value={formData.codiceSconto}
                                onChange={(e) => handleChange("codiceSconto", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Valore Sconto (U)</Label>
                            <Input
                                type="number"
                                className="bg-yellow-50 border-yellow-200"
                                value={formData.valoreSconto || ''}
                                onChange={(e) => handleChange("valoreSconto", parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>% Sconto (V)</Label>
                            <Input
                                type="number"
                                className="bg-yellow-50 border-yellow-200"
                                value={formData.percentualeSconto || ''}
                                onChange={(e) => handleChange("percentualeSconto", parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Codici Promo (W)</Label>
                            <Input
                                className="bg-yellow-50 border-yellow-200"
                                value={formData.codiciPromo}
                                onChange={(e) => handleChange("codiciPromo", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Valore Promo (X)</Label>
                            <Input
                                type="number"
                                className="bg-yellow-50 border-yellow-200"
                                value={formData.valorePromo || ''}
                                onChange={(e) => handleChange("valorePromo", parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                        <div className="space-y-2">
                            <Label>% Promo</Label>
                            <Input
                                type="number"
                                className="bg-yellow-50 border-yellow-200"
                                value={formData.percentualePromo || ''}
                                onChange={(e) => handleChange("percentualePromo", parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Acconto/Credito (Y)</Label>
                            <Input
                                type="number"
                                value={formData.acconto || ''}
                                onChange={(e) => handleChange("acconto", parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Data Pagamento (Z) *</Label>
                            <Input
                                type="date"
                                className={cn(touched && !formData.dataPagamento ? "border-red-500" : "")}
                                value={formData.dataPagamento}
                                onChange={(e) => handleChange("dataPagamento", e.target.value)}
                            />
                            {touched && !formData.dataPagamento && <p className="text-red-500 text-xs mt-1">Obbligatorio</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Saldo Annuale (AA)</Label>
                            <Input
                                type="number"
                                value={formData.saldoAnnuale || ''}
                                onChange={(e) => handleChange("saldoAnnuale", parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>N. Ricevute</Label>
                            <Input
                                type="number"
                                value={formData.numeroRicevute || ''}
                                onChange={(e) => handleChange("numeroRicevute", parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Conferma Bonifico</Label>
                            <Input
                                type="date"
                                value={formData.confermaBonifico}
                                onChange={(e) => handleChange("confermaBonifico", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2 lg:col-span-4">
                            <Label>Saldo Totale (BO)</Label>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Totale</Badge>
                                <Input
                                    value={`€ ${(isGratuito ? 0 : formData.saldoTotale).toFixed(2)}`}
                                    readOnly
                                    className="bg-yellow-50 border-yellow-200 font-bold text-lg max-w-xs"
                                />
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
                                {error && error.includes("Codice Admin") && <p className="text-red-600 font-medium text-sm mt-1">{error}</p>}
                            </div>
                        )}
                        {error && !error.includes("Codice Admin") && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm font-medium">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
                    <Button
                        className={cn("gold-3d-button", isMissingFields && !isGratuito ? "opacity-50 cursor-not-allowed" : "")}
                        onClick={handleSave}
                        disabled={isMissingFields && !isGratuito && touched}
                    >
                        {initialData ? "Salva Modifiche" : "Aggiungi Pagamento"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
