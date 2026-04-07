import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export interface QuickMemberAddModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (memberId: number) => void;
  defaultRole?: "Tesserato" | "Non Tesserato" | "Staff/Insegnanti";
}

export function QuickMemberAddModal({ isOpen, onOpenChange, onSuccess, defaultRole = "Non Tesserato" }: QuickMemberAddModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    fiscalCode: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Assumiamo che ci sia un /api/members per l'inserimento
      // Qui carichiamo in minima parte l'anagrafica essenziale
      const categoryRes = await fetch("/api/client-categories");
      const categories = await categoryRes.json();
      const defaultCategoryId = categories.find((c: any) => c.name === defaultRole)?.id;

      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        fiscalCode: data.fiscalCode,
        active: true,
        categoryId: defaultCategoryId || null,
        participantType: defaultRole === "Staff/Insegnanti" ? "INSEGNANTE" : "ALLIEVO",
      };

      const res = await apiRequest("POST", "/api/members", payload);
      return res.json();
    },
    onSuccess: (newMember) => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({ title: "Anagrafica creata con successo", description: `${newMember.firstName} ${newMember.lastName} registrato.` });
      onOpenChange(false);
      setFormData({ firstName: "", lastName: "", email: "", phone: "", fiscalCode: "" });
      if (onSuccess && newMember.id) {
        onSuccess(newMember.id);
      }
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Aggiunta Rapida Anagrafica</DialogTitle>
          <DialogDescription>
            Inserisci i dati minimi per registrare questa persona all'interno del sistema delle prenotazioni.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quick-first-name">Nome *</Label>
              <Input 
                id="quick-first-name"
                value={formData.firstName} 
                onChange={(e) => setFormData(p => ({ ...p, firstName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-last-name">Cognome *</Label>
              <Input 
                id="quick-last-name"
                value={formData.lastName}
                onChange={(e) => setFormData(p => ({ ...p, lastName: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-phone">Telefono *</Label>
            <Input 
              id="quick-phone" 
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
              placeholder="+39 333 1234567"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quick-email">Email *</Label>
              <Input 
                id="quick-email" 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                placeholder="email@esempio.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-fiscal-code">Codice Fiscale *</Label>
              <Input 
                id="quick-fiscal-code" 
                value={formData.fiscalCode || ""}
                onChange={(e) => setFormData(p => ({ ...p, fiscalCode: e.target.value.toUpperCase() }))}
                placeholder="RSSMRA... (16 Caratteri)"
                maxLength={16}
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.fiscalCode}>
              {createMutation.isPending ? "Salvataggio..." : "Salva e Usa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
