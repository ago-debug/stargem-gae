import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export function PaymentInvoiceDetails() {
    return (
        <div className="space-y-4 bg-muted/50 p-5 rounded-lg border border-border/60 shadow-inner mt-6">
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between border p-3 rounded-md bg-background shadow-sm">
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
                    <Input type="date" value={new Date().toISOString().split('T')[0]} readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                    <Label>Acconto/Credito (Y)</Label>
                    <Input type="number" placeholder="" readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                    <Label>Saldo Annuale (AA)</Label>
                    <Input type="number" placeholder="" readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                    <Label>N. Ricevute</Label>
                    <Input type="number" placeholder="" readOnly className="bg-muted" />
                </div>
            </div>
        </div>
    );
}
