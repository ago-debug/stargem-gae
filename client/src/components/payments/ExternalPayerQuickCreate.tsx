import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const externalPayerSchema = z.object({
  type: z.enum(["privato", "azienda"]),
  businessName: z.string().min(2, "Inserisci un nome o ragione sociale"),
  fiscalCode: z.string().optional(),
  vatNumber: z.string().optional(),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type === "azienda" && !data.vatNumber && !data.fiscalCode) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Partita IVA o CF obbligatorio per le aziende",
      path: ["vatNumber"],
    });
  }
});

type ExternalPayerForm = z.infer<typeof externalPayerSchema>;

export function ExternalPayerQuickCreate({ onSuccess, onCancel }: { onSuccess: (id: number, name: string) => void, onCancel: () => void }) {
  const { toast } = useToast();

  const form = useForm<ExternalPayerForm>({
    resolver: zodResolver(externalPayerSchema),
    defaultValues: {
      type: "privato",
      businessName: "",
      fiscalCode: "",
      vatNumber: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const isAzienda = form.watch("type") === "azienda";

  const createMutation = useMutation({
    mutationFn: async (data: ExternalPayerForm) => {
      // Dobbiamo estrarre `email` e `phone` in `notes` se non ci sono campi dedicati nello schema
      const notesObj = {
        email: data.email,
        phone: data.phone,
        type: data.type
      };
      
      const payload = {
        businessName: data.businessName,
        fiscalCode: data.fiscalCode || null,
        vatNumber: data.vatNumber || null,
        address: data.address || null,
        notes: JSON.stringify(notesObj)
      };

      const res = await apiRequest("POST", "/api/external-payers", payload);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Pagatore Creato", description: "Il pagatore esterno è stato salvato con successo." });
      onSuccess(data.id, data.businessName);
    },
    onError: (error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  return (
    <div className="bg-muted/50 p-4 rounded-md border space-y-4">
      <h3 className="text-sm font-semibold">Crea Pagatore Esterno</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Tipo</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="privato" />
                      </FormControl>
                      <FormLabel className="font-normal">Privato</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="azienda" />
                      </FormControl>
                      <FormLabel className="font-normal">Azienda / Ente</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isAzienda ? "Ragione Sociale" : "Nome e Cognome"}</FormLabel>
                <FormControl>
                  <Input placeholder={isAzienda ? "Es. Comune di Milano" : "Es. Mario Rossi"} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            {isAzienda ? (
              <FormField
                control={form.control}
                name="vatNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partita IVA</FormLabel>
                    <FormControl>
                      <Input placeholder="Es. 01234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="fiscalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codice Fiscale</FormLabel>
                    <FormControl>
                      <Input placeholder="Es. RSSMRA80A01H501U" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {isAzienda && (
              <FormField
                control={form.control}
                name="fiscalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codice Fiscale (opzionale)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@esempio.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefono</FormLabel>
                    <FormControl>
                      <Input placeholder="02 1234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>Annulla</Button>
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Salvataggio..." : "Salva Pagatore"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
