import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Lock, Unlock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { PaymentMethod } from "@shared/schema";

interface PaymentModuleProps {
  basePrice: number;
  itemName: string;
  onPaymentComplete: (data: { amount: number, paymentMethod: string, receiptNumber: string, isPaid: boolean, itemName: string }) => void;
  onCancel?: () => void;
  isPending?: boolean;
}

export function PaymentModuleConnector({ basePrice, itemName, onPaymentComplete, onCancel, isPending }: PaymentModuleProps) {
  const [amount, setAmount] = useState<number>(basePrice);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [isPaid, setIsPaid] = useState(false);

  const { data: paymentMethods } = useQuery<PaymentMethod[]>({ queryKey: ["/api/payment-methods"] });

  // Scudo Manager (PIN Override)
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [isPriceUnlocked, setIsPriceUnlocked] = useState(false);
  const [tempAmount, setTempAmount] = useState<string>(basePrice.toString());

  const handlePriceClick = () => {
    if (!isPriceUnlocked) {
      setShowPinDialog(true);
    }
  };

  const handlePinSubmit = () => {
    if (pinInput === "1234") { // Mock PIN for Manager
      setIsPriceUnlocked(true);
      setShowPinDialog(false);
      setPinInput("");
    } else {
      alert("PIN Errato");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPaymentComplete({
      amount: isPriceUnlocked ? Number(tempAmount) : amount,
      paymentMethod,
      receiptNumber,
      isPaid,
      itemName
    });
  };

  return (
    <div className="p-4 border border-border bg-card rounded-lg shadow-sm space-y-4">
      <h3 className="text-lg font-semibold text-primary">Checkout: {itemName}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Importo con Checkout Blindato */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Importo (€)</Label>
            <div className="relative flex items-center group">
              <Input
                type="number"
                value={isPriceUnlocked ? tempAmount : amount}
                onChange={(e) => {
                  if (isPriceUnlocked) {
                    setTempAmount(e.target.value);
                  }
                }}
                onClick={handlePriceClick}
                readOnly={!isPriceUnlocked}
                className={`font-mono pl-8 text-right cursor-[text] ${!isPriceUnlocked ? "bg-muted cursor-pointer group-hover:bg-muted/70 transition-colors" : "border-destructive ring-destructive focus-visible:ring-destructive"}`}
              />
              <div
                className={`absolute inset-y-0 left-2 flex items-center text-xs pointer-events-none ${isPriceUnlocked ? 'text-destructive' : 'text-muted-foreground'}`}
                title={isPriceUnlocked ? "Sbloccato" : "Importo blindato. Clicca per sbloccare con PIN."}
              >
                {isPriceUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
            </div>
            {isPriceUnlocked && <p className="text-[10px] text-destructive italic">Prezzo sovrascritto manualmente. Verrà loggato.</p>}
          </div>

          <div className="space-y-2">
            <Label>Metodo Pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
              <SelectContent>
                {paymentMethods?.map(pm => (
                  <SelectItem key={pm.id} value={pm.name}>{pm.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>N° Ricevuta (Opt)</Label>
            <Input
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="Es: R-2026-001"
            />
          </div>

          <div className="flex flex-col justify-end space-y-2 pb-2">
            <div className="flex items-center space-x-2">
              <Switch checked={isPaid} onCheckedChange={setIsPaid} id="saldato" />
              <Label htmlFor="saldato" className={isPaid ? "text-success font-bold" : ""}>
                {isPaid ? "Saldato" : "Da Saldare"}
              </Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>Annulla</Button>}
          <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isPaid ? "Conferma Pagamento" : "Salva Preventivo"}
          </Button>
        </div>
      </form>

      {/* Dialog PIN Segreteria */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="sm:max-w-xs p-6">
          <DialogHeader>
            <DialogTitle className="text-destructive flex flex-col items-center gap-2 pb-2">
              <Lock className="w-10 h-10 mb-2" />
              Sblocco Importo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-center text-muted-foreground px-2">
              Inserire **PIN Manager** per forzare la modifica del listino di default.
            </p>
            <Input
              type="password"
              placeholder="PIN Manager"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="text-center tracking-widest text-2xl h-14 font-mono w-4/5 mx-auto block"
              autoFocus
            />
          </div>
          <DialogFooter className="flex-row items-center justify-between mt-4">
            <Button variant="ghost" className="w-[45%]" onClick={() => setShowPinDialog(false)}>Annulla</Button>
            <Button variant="destructive" className="w-[45%]" onClick={handlePinSubmit}>Sblocca</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
