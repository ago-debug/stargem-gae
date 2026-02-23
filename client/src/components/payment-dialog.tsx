
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MultiSelectPaymentNotes } from "@/components/multi-select-payment-notes";
import { MultiSelectEnrollmentDetails } from "@/components/multi-select-enrollment-details";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

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

    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData({ ...initialData });
            } else {
                setFormData({ ...defaultPayment, dataPagamento: new Date().toISOString().split('T')[0] });
            }
        }
    }, [open, initialData]);

    const handleChange = (field: keyof PaymentData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAttivitaChange = (value: string) => {
        handleChange("attivita", value);
        // Reset dettaglio if attivita changes? Maybe not strictly required but good practice
        // handleChange("dettaglioId", "");
        // handleChange("dettaglioNome", "");
    };

    const handleDettaglioChange = (id: string) => {
        handleChange("dettaglioId", id);
        const corso = corsiDB.find(c => c.id.toString() === id);
        if (corso) {
            handleChange("dettaglioNome", `${corso.name} - ${corso.sku}`);
        } else {
            handleChange("dettaglioNome", "");
        }
    };

    const handleSave = () => {
        // Simple validation
        onSave(formData);
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
                                <SelectTrigger>
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
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Dettaglio Attività e codice</Label>
                            <Select value={formData.dettaglioId} onValueChange={handleDettaglioChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleziona dettaglio" />
                                </SelectTrigger>
                                <SelectContent>
                                    {corsiDB.length > 0 ? (
                                        corsiDB.map((corso) => (
                                            <SelectItem key={corso.id} value={corso.id.toString()}>
                                                {corso.name} - {corso.sku}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="nessuno" disabled>Nessuna attività disponibile</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
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
                            <Label>Descrizione Quota (Q)</Label>
                            <Input
                                value={formData.descrizioneQuota}
                                onChange={(e) => handleChange("descrizioneQuota", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 lg:col-span-6">
                            {/* Periodo span could be wider or as requested */}
                        </div>
                        <div className="space-y-2">
                            <Label>Periodo (R)</Label>
                            <Input
                                value={formData.periodo}
                                onChange={(e) => handleChange("periodo", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                        <div className="space-y-2">
                            <Label>Totale Quota (S)</Label>
                            <Input
                                type="number"
                                value={formData.totaleQuota || ''}
                                onChange={(e) => handleChange("totaleQuota", parseFloat(e.target.value) || 0)}
                            />
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
                            <Label>Data Pagamento (Z)</Label>
                            <Input
                                type="date"
                                value={formData.dataPagamento}
                                onChange={(e) => handleChange("dataPagamento", e.target.value)}
                            />
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
                                    value={`€ ${formData.saldoTotale.toFixed(2)}`}
                                    readOnly
                                    className="bg-yellow-50 border-yellow-200 font-bold text-lg max-w-xs"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
                    <Button className="gold-3d-button" onClick={handleSave}>
                        {initialData ? "Salva Modifiche" : "Aggiungi Pagamento"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
