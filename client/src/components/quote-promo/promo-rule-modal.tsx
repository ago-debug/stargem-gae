import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PromoRule } from "@shared/schema";

export function PromoRuleModal({ 
  isOpen, 
  onClose, 
  editingPromo = null 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  editingPromo?: PromoRule | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<any>({
    code: "",
    label: "",
    ruleType: "percentage",
    value: "",
    validFrom: "",
    validTo: "",
    maxUses: "",
    excludeOpen: false,
    notCumulative: false,
    targetType: "public",
    companyName: ""
  });

  useEffect(() => {
    if (editingPromo && isOpen) {
      setFormData({
        ...editingPromo,
        value: editingPromo.value ? editingPromo.value.toString() : "",
        maxUses: editingPromo.maxUses ? editingPromo.maxUses.toString() : "",
        validFrom: editingPromo.validFrom ? new Date(editingPromo.validFrom).toISOString().split('T')[0] : "",
        validTo: editingPromo.validTo ? new Date(editingPromo.validTo).toISOString().split('T')[0] : ""
      });
    } else if (isOpen) {
      setFormData({
        code: "", label: "", ruleType: "percentage", value: "", validFrom: "", validTo: "",
        maxUses: "", excludeOpen: false, notCumulative: false, targetType: "public", companyName: ""
      });
    }
  }, [editingPromo, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingPromo?.id) {
        await apiRequest("PUT", `/api/promo-rules/${editingPromo.id}`, payload);
      } else {
        await apiRequest("POST", "/api/promo-rules", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo-rules"] });
      toast({ title: "Salvato", description: "Le regole promozionali sono state salvate." });
      onClose();
    },
    onError: () => {
      // Return 404 handled via UI state, mock success locally if desired, or just toast error
      toast({ title: "Errore", description: "Endpoint backend non ancora disponibile (404).", variant: "destructive" });
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      value: parseFloat(formData.value) || 0,
      maxUses: formData.maxUses ? parseInt(formData.maxUses, 10) : null
    };
    saveMutation.mutate(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingPromo ? "Modifica Promo" : "Nuova Regola Promo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Codice *</Label>
              <Input required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="es. WELCOME25" />
            </div>
            <div className="space-y-2">
              <Label>Target *</Label>
              <Select value={formData.targetType} onValueChange={(v) => setFormData({ ...formData, targetType: v })}>
                <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Pubblico</SelectItem>
                  <SelectItem value="company">Azienda</SelectItem>
                  <SelectItem value="staff">Staff/Insegnanti</SelectItem>
                  <SelectItem value="personal">Ad-Personam</SelectItem>
                  <SelectItem value="welfare">Welfare/Provider</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Etichetta Descrittiva</Label>
            <Input value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })} placeholder="Sconto benvenuto 10%" />
          </div>

          {formData.targetType === "company" && (
            <div className="space-y-2">
              <Label>Nome Azienda Partner</Label>
              <Input value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} placeholder="es. Ferrari S.p.A." />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipologia Sconto</Label>
              <Select value={formData.ruleType} onValueChange={(v) => setFormData({ ...formData, ruleType: v })}>
                <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentuale (%)</SelectItem>
                  <SelectItem value="fixed_amount">Fisso in Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valore Sconto *</Label>
              <Input required type="number" step="any" value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} placeholder="10.00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label>Valido Da</Label>
               <Input type="date" value={formData.validFrom} onChange={e => setFormData({ ...formData, validFrom: e.target.value })} />
             </div>
             <div className="space-y-2">
               <Label>Valido A</Label>
               <Input type="date" value={formData.validTo} onChange={e => setFormData({ ...formData, validTo: e.target.value })} />
             </div>
          </div>

          <div className="space-y-2">
             <Label>Usi Massimi Totali</Label>
             <Input type="number" value={formData.maxUses} onChange={e => setFormData({ ...formData, maxUses: e.target.value })} placeholder="Es. 100 limitati" />
             <p className="text-[10px] text-muted-foreground">Lascia vuoto per infiniti</p>
          </div>

          <div className="flex items-center justify-between border p-3 rounded-md bg-slate-50">
            <Label htmlFor="excludeOpen" className="flex flex-col gap-1 cursor-pointer">
              <span>Escludi da OPEN</span>
              <span className="font-normal text-xs text-muted-foreground">Non applicabile sui pacchetti OPEN</span>
            </Label>
            <Switch id="excludeOpen" checked={formData.excludeOpen} onCheckedChange={(c) => setFormData({ ...formData, excludeOpen: c })} />
          </div>

          <div className="flex items-center justify-between border p-3 rounded-md bg-slate-50">
            <Label htmlFor="notCumulative" className="flex flex-col gap-1 cursor-pointer">
              <span>Non Cumulabile</span>
              <span className="font-normal text-xs text-muted-foreground">Blocca altri sconti paralleli</span>
            </Label>
            <Switch id="notCumulative" checked={formData.notCumulative} onCheckedChange={(c) => setFormData({ ...formData, notCumulative: c })} />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Annulla</Button>
            <Button type="submit" disabled={saveMutation.isPending}>Salva Promozione</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
