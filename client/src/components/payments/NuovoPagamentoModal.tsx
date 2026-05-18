import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Info, Check, ChevronsUpDown } from "lucide-react";
import { ExternalPayerQuickCreate } from "./ExternalPayerQuickCreate";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const participantSchema = z.object({
  memberId: z.number({ required_error: "Partecipante obbligatorio" }),
  amount: z.number().min(0, "Importo non valido"),
});

const formSchema = z.object({
  payerType: z.enum(["member", "society", "external"]),
  payerId: z.number({ required_error: "Pagatore obbligatorio" }),
  participants: z.array(participantSchema).min(1, "Almeno un partecipante richiesto"),
  totalAmount: z.number().min(0.01, "L'importo deve essere maggiore di 0"),
  paymentDate: z.string().nonempty("Data obbligatoria"),
  method: z.enum(["contanti", "bonifico", "pos", "sdd", "assegno", "gift_card", "altro"]),
  reason: z.string().min(3, "La causale deve avere almeno 3 caratteri"),
  giftCardCode: z.string().optional(),
  documentTypeOverride: z.string().optional(),
}).superRefine((data, ctx) => {
  const sum = data.participants.reduce((acc, curr) => acc + curr.amount, 0);
  if (Math.abs(sum - data.totalAmount) > 0.01) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La somma degli importi partecipanti deve coincidere col totale",
      path: ["totalAmount"],
    });
  }
  if (data.method === "gift_card" && !data.giftCardCode) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Codice Gift Card obbligatorio",
      path: ["giftCardCode"],
    });
  }
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultMemberId?: number;
  defaultAmount?: number;
  defaultReason?: string;
}

export function NuovoPagamentoModal({ isOpen, onClose, defaultMemberId, defaultAmount, defaultReason }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  // Queries
  const { data: membersRes } = useQuery<{members: any[]}>({
    queryKey: ["/api/members"],
    enabled: isOpen,
  });
  const members = membersRes?.members || [];

  const { data: societies = [] } = useQuery<any[]>({
    queryKey: ["/api/societies"],
    enabled: isOpen,
  });

  const { data: externalPayers = [] } = useQuery<any[]>({
    queryKey: ["/api/external-payers"],
    enabled: isOpen,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payerType: "member",
      payerId: defaultMemberId || undefined,
      participants: [{ memberId: defaultMemberId || 0, amount: defaultAmount || 0 }],
      totalAmount: defaultAmount || 0,
      paymentDate: new Date().toISOString().split("T")[0],
      method: "contanti",
      reason: defaultReason || "",
      giftCardCode: "",
      documentTypeOverride: "",
    },
  });

  const { fields: participantFields, append: appendParticipant, remove: removeParticipant } = useFieldArray({
    control: form.control,
    name: "participants",
  });

  const payerType = form.watch("payerType");
  const payerId = form.watch("payerId");
  const method = form.watch("method");
  const giftCardCode = form.watch("giftCardCode");
  const participants = form.watch("participants");

  // Auto-calculate sum when participants amounts change
  useEffect(() => {
    const sum = participants.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    form.setValue("totalAmount", parseFloat(sum.toFixed(2)));
  }, [participants, form]);

  // Gift Card validation
  const { data: giftCardInfo } = useQuery({
    queryKey: ["/api/gift-cards", giftCardCode],
    queryFn: async () => {
      if (!giftCardCode) return null;
      const res = await apiRequest("GET", `/api/gift-cards/${giftCardCode}`);
      if (!res.ok) throw new Error("Gift card non trovata");
      return res.json();
    },
    enabled: method === "gift_card" && !!giftCardCode && giftCardCode.length >= 4,
    retry: false,
  });

  // Auto deduce documentType
  const deduceDocumentType = () => {
    if (!payerId) return "ricevuta_istituzionale";
    
    if (payerType === "member") return "ricevuta_istituzionale";
    if (payerType === "society") return "fattura";
    
    if (payerType === "external") {
      const ext = externalPayers.find((e: any) => e.id === payerId);
      if (ext) {
        // Se ha piva o type in notes == 'azienda'
        let isAzienda = !!ext.vatNumber;
        try {
          const notes = JSON.parse(ext.notes || "{}");
          if (notes.type === "azienda") isAzienda = true;
        } catch(e) {}
        return isAzienda ? "fattura" : "ricevuta_istituzionale";
      }
    }
    return "ricevuta_istituzionale";
  };

  const autoDocType = deduceDocumentType();
  const overrideDocType = form.watch("documentTypeOverride");
  const activeDocType = overrideDocType || autoDocType;

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Mapping for POST /api/payments backend MC3 Fase A expectations
      const payload = {
        amount: data.totalAmount,
        type: "other",
        description: data.reason,
        status: "paid",
        paidDate: data.paymentDate,
        method: data.method,
        payerType: data.payerType,
        payerId: data.payerId,
        billingSubjectType: data.payerType,
        billingSubjectId: data.payerId,
        documentType: data.documentTypeOverride || autoDocType,
        participants: data.participants,
        giftCardCode: data.method === "gift_card" ? data.giftCardCode : undefined
      };
      const res = await apiRequest("POST", "/api/payments", payload);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Errore durante il salvataggio");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Successo", description: "Pagamento registrato correttamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuovo Pagamento</DialogTitle>
          <DialogDescription>Registra un pagamento per uno o più iscritti</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* SEZIONE 1: PAGATORE */}
            <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
              <h3 className="font-semibold text-sm text-primary">1. Soggetto Pagatore</h3>
              
              <FormField
                control={form.control}
                name="payerType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue("payerId", 0 as any); // Reset payer on type change
                        }}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="member" /></FormControl>
                          <FormLabel className="font-normal">Tesserato</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="society" /></FormControl>
                          <FormLabel className="font-normal">Società Partner</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="external" /></FormControl>
                          <FormLabel className="font-normal">Pagatore Esterno</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name="payerId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Seleziona {payerType === 'member' ? 'Tesserato' : payerType === 'society' ? 'Società' : 'Pagatore Esterno'}</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                              >
                                {field.value
                                  ? payerType === 'member' 
                                      ? members.find((m: any) => m.id === field.value)?.lastName + " " + members.find((m: any) => m.id === field.value)?.firstName
                                      : payerType === 'society'
                                      ? societies.find((s: any) => s.id === field.value)?.businessName
                                      : externalPayers.find((e: any) => e.id === field.value)?.businessName
                                  : "Seleziona..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0">
                            <Command>
                              <CommandInput placeholder="Cerca..." />
                              <CommandList>
                                <CommandEmpty>Nessun risultato trovato.</CommandEmpty>
                                <CommandGroup>
                                  {payerType === 'member' && members.map((m: any) => (
                                    <CommandItem
                                      key={m.id}
                                      value={m.lastName + " " + m.firstName}
                                      onSelect={() => form.setValue("payerId", m.id)}
                                    >
                                      <Check className={cn("mr-2 h-4 w-4", m.id === field.value ? "opacity-100" : "opacity-0")} />
                                      {m.lastName} {m.firstName}
                                    </CommandItem>
                                  ))}
                                  {payerType === 'society' && societies.map((s: any) => (
                                    <CommandItem
                                      key={s.id}
                                      value={s.businessName}
                                      onSelect={() => form.setValue("payerId", s.id)}
                                    >
                                      <Check className={cn("mr-2 h-4 w-4", s.id === field.value ? "opacity-100" : "opacity-0")} />
                                      {s.businessName}
                                    </CommandItem>
                                  ))}
                                  {payerType === 'external' && externalPayers.map((e: any) => (
                                    <CommandItem
                                      key={e.id}
                                      value={e.businessName}
                                      onSelect={() => form.setValue("payerId", e.id)}
                                    >
                                      <Check className={cn("mr-2 h-4 w-4", e.id === field.value ? "opacity-100" : "opacity-0")} />
                                      {e.businessName}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {payerType === 'external' && (
                  <Button type="button" variant="outline" onClick={() => setShowQuickCreate(!showQuickCreate)}>
                    {showQuickCreate ? "Annulla" : "+ Nuovo"}
                  </Button>
                )}
              </div>

              {showQuickCreate && payerType === 'external' && (
                <ExternalPayerQuickCreate 
                  onSuccess={(id) => {
                    queryClient.invalidateQueries({ queryKey: ["/api/external-payers"] });
                    form.setValue("payerId", id);
                    setShowQuickCreate(false);
                  }}
                  onCancel={() => setShowQuickCreate(false)}
                />
              )}
            </div>

            {/* SEZIONE 2: PARTECIPANTI */}
            <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm text-primary">2. Partecipanti (Ripartizione Importo)</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => appendParticipant({ memberId: 0, amount: 0 })}
                >
                  <Plus className="w-4 h-4 mr-2" /> Aggiungi Partecipante
                </Button>
              </div>

              {participantFields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-start bg-background p-3 rounded border">
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name={`participants.${index}.memberId`}
                      render={({ field: f }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Tesserato</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn("w-full justify-between", !f.value && "text-muted-foreground")}
                                >
                                  {f.value
                                    ? members.find((m: any) => m.id === f.value)?.lastName + " " + members.find((m: any) => m.id === f.value)?.firstName
                                    : "Seleziona..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                              <Command>
                                <CommandInput placeholder="Cerca..." />
                                <CommandList>
                                  <CommandEmpty>Nessun risultato trovato.</CommandEmpty>
                                  <CommandGroup>
                                    {members.map((m: any) => (
                                      <CommandItem
                                        key={m.id}
                                        value={m.lastName + " " + m.firstName}
                                        onSelect={() => form.setValue(`participants.${index}.memberId`, m.id)}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", m.id === f.value ? "opacity-100" : "opacity-0")} />
                                        {m.lastName} {m.firstName}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="w-32">
                    <FormField
                      control={form.control}
                      name={`participants.${index}.amount`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Quota (€)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              value={f.value} 
                              onChange={(e) => f.onChange(parseFloat(e.target.value) || 0)} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {participantFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-8 text-destructive"
                      onClick={() => removeParticipant(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {form.formState.errors.participants?.root && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.participants.root.message}</p>
              )}
            </div>

            {/* SEZIONE 3: DETTAGLI PAGAMENTO */}
            <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
              <h3 className="font-semibold text-sm text-primary">3. Dettagli Pagamento</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Totale (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Pagamento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Metodo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="contanti">Contanti</SelectItem>
                          <SelectItem value="bonifico">Bonifico</SelectItem>
                          <SelectItem value="pos">POS / Carta</SelectItem>
                          <SelectItem value="sdd">SDD / RID</SelectItem>
                          <SelectItem value="assegno">Assegno</SelectItem>
                          <SelectItem value="gift_card">Gift Card</SelectItem>
                          <SelectItem value="altro">Altro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {method === "gift_card" && (
                <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded border border-orange-200">
                  <FormField
                    control={form.control}
                    name="giftCardCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Codice Gift Card</FormLabel>
                        <FormControl>
                          <Input placeholder="Inserisci codice..." {...field} />
                        </FormControl>
                        {giftCardInfo && (
                          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                            <Info className="w-4 h-4" /> Saldo residuo: <strong>€ {giftCardInfo.balanceAmount}</strong>
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Causale</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Es. Pagamento rate corsi..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="p-3 bg-secondary/50 rounded-md flex items-center justify-between border">
                <div>
                  <p className="text-sm font-medium">Documento Atteso: 
                    <span className="ml-2 uppercase tracking-wider font-bold text-primary">
                      {activeDocType.replace("_", " ")}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">Dedotto automaticamente in base al soggetto pagatore.</p>
                </div>
                <FormField
                  control={form.control}
                  name="documentTypeOverride"
                  render={({ field }) => (
                    <FormItem className="w-48">
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Forza tipo..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Auto (default)</SelectItem>
                          <SelectItem value="ricevuta_istituzionale">Ricevuta Istituzionale</SelectItem>
                          <SelectItem value="fattura">Fattura</SelectItem>
                          <SelectItem value="booking_only">Senza Documento</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={onClose}>Annulla</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvataggio in corso..." : "Registra Pagamento"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
