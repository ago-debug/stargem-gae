import { useState } from "react";
import { useLocation } from "wouter";
import { NuovoPagamentoModal } from "@/components/nuovo-pagamento-modal";
import { Calculator } from "lucide-react";

export default function IscrizioniPagamenti() {
    const [, setLocation] = useLocation();
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
            <div className="flex flex-col items-center gap-4 text-slate-400 mb-8 opacity-50">
                <Calculator className="w-16 h-16" />
                <h1 className="text-3xl font-bold">Unificato Checkout</h1>
                <p>La finestra di incasso si aprirà in sovrapposizione.</p>
            </div>

            <NuovoPagamentoModal
                isOpen={isOpen}
                onClose={() => {
                    setIsOpen(false);
                    // Redirect to the main payments list when closed
                    setLocation("/pagamenti");
                }}
            />
        </div>
    );
}
