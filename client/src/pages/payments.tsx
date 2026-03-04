import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, CreditCard, Check, ChevronsUpDown, X, Edit, Download, Filter, User, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { Payment, InsertPayment, Member, PaymentMethod, Course } from "@shared/schema";

import { useLocation } from "wouter";
import { PaymentDialog, type PaymentData } from "@/components/payment-dialog";

export default function Payments() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const { data: membersData } = useQuery<{ members: Member[], total: number }>({
    queryKey: ["/api/members"],
  });
  const members = membersData?.members || [];

  // Server-side search for member selector (min 3 chars)
  const { data: searchedMembersData } = useQuery<{ members: Member[], total: number }>({
    queryKey: [`/api/members?search=${encodeURIComponent(memberSearchQuery)}`],
    enabled: memberSearchQuery.length >= 3,
  });
  const searchedMembers = searchedMembersData?.members || [];

  const { data: enrollments } = useQuery<any[]>({
    queryKey: ["/api/enrollments"],
  });

  const { data: courses } = useQuery<any[]>({
    queryKey: ["/api/courses"],
  });

  const { data: paymentMethods } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
  });

  const { data: workshopEnrollments } = useQuery<any[]>({
    queryKey: ["/api/workshop-enrollments"],
  });

  const { data: workshops } = useQuery<any[]>({
    queryKey: ["/api/workshops"],
  });

  const { data: studioBookings } = useQuery<any[]>({
    queryKey: ["/api/studio-bookings"],
  });

  const { data: membershipsDataList } = useQuery<any[]>({
    queryKey: ["/api/memberships"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertPayment) => {
      await apiRequest("POST", "/api/payments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({ title: "Pagamento registrato con successo" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PATCH", `/api/members/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/payments/${id}`, {
        status,
        paidDate: status === 'paid' ? new Date() : null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({ title: "Stato pagamento aggiornato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertPayment> }) => {
      await apiRequest("PATCH", `/api/payments/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({ title: "Pagamento aggiornato con successo" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const closeDialog = () => {
    setIsFormOpen(false);
    setEditingPayment(null);
    setSelectedMemberId("");
    setSelectedMember(null);
    setMemberSearchQuery("");
  };

  const openEditDialog = (payment: any) => {
    setEditingPayment(payment);
    setSelectedMemberId(payment.memberId?.toString() || "");
    if (payment.memberId) {
      const member = members?.find(m => m.id === payment.memberId);
      setSelectedMember(member || ({
        id: payment.memberId,
        firstName: payment.memberFirstName || "",
        lastName: payment.memberLastName || "",
      } as Member));
    }

    setIsFormOpen(true);
  };

  const getMemberName = (payment: any) => {
    if (payment.memberFirstName || payment.memberLastName) {
      return `${payment.memberFirstName || ''} ${payment.memberLastName || ''}`.trim();
    }
    if (!payment.memberId) return "-";
    const member = members?.find(m => m.id === payment.memberId);
    return member ? `${member.firstName} ${member.lastName}` : "Sconosciuto";
  };

  const getInitialPaymentData = (payment: Payment | null): PaymentData | null => {
    if (!payment) return null;
    return {
      attivita: payment.type || "",
      dettaglioId: payment.enrollmentId?.toString() || payment.workshopEnrollmentId?.toString() || payment.bookingId?.toString() || payment.membershipId?.toString() || "",
      dettaglioNome: "",
      enrollmentDetails: [],
      paymentNotes: payment.notes ? payment.notes.split(',') : [],
      quantita: 1,
      descrizioneQuota: payment.description || "",
      periodo: "",
      totaleQuota: Number(payment.amount),
      codiceSconto: payment.discountCode || "",
      valoreSconto: Number(payment.discountValue) || 0,
      percentualeSconto: 0,
      codiciPromo: "",
      valorePromo: 0,
      percentualePromo: 0,
      acconto: payment.status === 'paid' ? Number(payment.amount) : 0, // mock status per bypass
      dataPagamento: payment.paidDate ? new Date(payment.paidDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      saldoAnnuale: 0,
      numeroRicevute: 1,
      confermaBonifico: "",
      saldoTotale: payment.status === 'paid' ? 0 : Number(payment.amount)
    };
  };

  const exportToCSV = () => {
    if (!payments || payments.length === 0) {
      toast({ title: "Nessun dato da esportare", variant: "destructive" });
      return;
    }
    const filteredData = showPendingOnly
      ? payments.filter(p => p.status === 'pending')
      : payments;

    const headers = ["ID", "Cliente", "Tipo", "Descrizione", "Importo", "Scadenza", "Metodo", "Data Pagamento"];
    const rows = filteredData.map(p => [
      p.id,
      getMemberName(p),
      p.type || "",
      p.description || "",
      p.amount,
      p.dueDate ? new Date(p.dueDate).toLocaleDateString('it-IT') : "",
      p.paymentMethod || "",
      p.paidDate ? new Date(p.paidDate).toLocaleString('it-IT') : ""
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pagamenti_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Esportazione completata" });
  };

  const handleSavePaymentDialog = (pd: PaymentData) => {
    if (!selectedMemberId) {
      toast({ title: "Errore", description: "Seleziona un cliente (usa il pulsante in alto a sinistra del modale)", variant: "destructive" });
      return;
    }

    // Lo status è pending se saldoTotale > 0, oppure paid
    const isPending = (pd.saldoTotale || 0) > 0;

    // Map PaymentData back to InsertPayment
    // Assumiamo che il PaymentDialog emetti l'Attivita come 'type' (es. corsi, workshop, ecc)
    // Se c'era già un editingPayment, riciacciamo il suo id.
    const payload: Partial<InsertPayment> = {
      memberId: parseInt(selectedMemberId),
      amount: pd.totaleQuota.toString(),
      type: pd.attivita || "corsi",
      status: isPending ? "pending" : "paid",
      description: pd.descrizioneQuota,
      paidDate: pd.dataPagamento ? new Date(pd.dataPagamento) : new Date(),
      // Possiamo mappare le note joinate se paymentNotes sono state riempite
      notes: pd.paymentNotes?.length ? pd.paymentNotes.join(',') : null,
      discountCode: pd.codiceSconto || null,
      discountValue: pd.valoreSconto ? pd.valoreSconto.toString() : null,
    };

    // Routing corretto verso la ForeignKey basato sul Type (Attivita) se dettaglioId esiste
    if (pd.dettaglioId) {
      if (pd.attivita === 'corsi') payload.enrollmentId = parseInt(pd.dettaglioId);
      else if (pd.attivita === 'workshop') payload.workshopEnrollmentId = parseInt(pd.dettaglioId);
      else if (pd.attivita === 'tessere' || pd.attivita === 'membership') payload.membershipId = parseInt(pd.dettaglioId);
      else payload.bookingId = parseInt(pd.dettaglioId);
    }

    if (editingPayment) {
      updateMutation.mutate({ id: editingPayment.id, data: payload as Partial<InsertPayment> });
    } else {
      createMutation.mutate(payload as InsertPayment);
    }
  };

  const filteredPayments = payments?.filter(p => {
    const matchesSearch = !searchQuery ||
      getMemberName(p).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.type || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPending = !showPendingOnly || p.status === 'pending';
    return matchesSearch && matchesPending;
  });

  const formatLocalISO = (date: Date | string | null | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };
  const nowLocalISO = formatLocalISO(new Date());

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Gestione Pagamenti</h1>
          <p className="text-muted-foreground">Traccia pagamenti, quote e incassi</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={showPendingOnly ? "default" : "outline"}
            onClick={() => setShowPendingOnly(!showPendingOnly)}
            data-testid="button-filter-pending"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showPendingOnly ? "Tutti" : "In Sospeso"}
          </Button>
          <Button
            variant="outline"
            onClick={exportToCSV}
            data-testid="button-export-csv"
          >
            <Download className="w-4 h-4 mr-2" />
            Esporta CSV
          </Button>
          <Button
            onClick={() => {
              closeDialog();
              setIsFormOpen(true);
            }}
            data-testid="button-add-payment"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Pagamento
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Totale Incassato</h3>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{payments?.filter(p => p.status === 'paid' || p.status === 'completed').reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">In Attesa</h3>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{payments?.filter(p => p.status === 'pending').reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Scaduti</h3>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payments?.filter(p => p.status === 'overdue').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cerca pagamento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-payments"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !filteredPayments || filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nessun pagamento trovato</p>
              <p className="text-sm">Inizia registrando il primo pagamento</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrizione</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Scadenza</TableHead>
                  <TableHead>Pagato il</TableHead>
                  <TableHead>Metodo</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id} data-testid={`payment-row-${payment.id}`}>
                    <TableCell className="font-medium">
                      <button
                        onClick={() => setLocation(`${window.location.pathname}?editMemberId=${payment.memberId}`)}
                        className="flex items-center gap-2 hover:underline text-primary text-left"
                        title="Modifica Anagrafica"
                      >
                        <User className="w-3 h-3" />
                        {getMemberName(payment)}
                      </button>
                    </TableCell>
                    <TableCell className="capitalize">{payment.type}</TableCell>
                    <TableCell>{payment.description || "-"}</TableCell>
                    <TableCell className="font-medium">€{payment.amount}</TableCell>
                    <TableCell>
                      {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString('it-IT') : "-"}
                    </TableCell>
                    <TableCell>
                      {payment.paidDate ? new Date(payment.paidDate).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "-"}
                    </TableCell>
                    <TableCell className="capitalize">{payment.paymentMethod || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(payment)}
                          data-testid={`button-edit-payment-${payment.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {payment.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: payment.id, status: 'paid' })}
                            data-testid={`button-mark-paid-${payment.id}`}
                          >
                            Segna Pagato
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PaymentDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
          else setIsFormOpen(open);
        }}
        onSave={handleSavePaymentDialog}
        initialData={getInitialPaymentData(editingPayment)}
        corsiDB={courses?.map(c => ({ id: c.id, name: c.name, sku: c.sku || "", maxCapacity: c.maxCapacity || 0, currentEnrollment: c.currentEnrollment || 0 })) || []}
        categorieDB={[]}
        memberId={selectedMemberId ? parseInt(selectedMemberId) : undefined}
        memberSelector={
          <div className="space-y-2 px-4 pt-4 pb-2 bg-muted/30 rounded-lg mx-6 mt-4 border">
            <Label htmlFor="memberId" className="text-secondary-foreground font-bold text-sm">Cliente (obbligatorio per incassare pagamenti slegati)</Label>
            <Popover open={memberSearchOpen} onOpenChange={setMemberSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={memberSearchOpen}
                  className="w-full justify-between font-normal h-12 bg-background border shadow-sm"
                >
                  {selectedMember ? (
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="font-bold truncate">{selectedMember.firstName} {selectedMember.lastName}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{selectedMember.fiscalCode || 'No CF'}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Cerca per nome, cognome o CF...</span>
                  )}
                  <div className="flex items-center gap-1 shrink-0">
                    {selectedMemberId && (
                      <X
                        className="h-4 w-4 text-muted-foreground hover:text-foreground z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMemberId("");
                          setSelectedMember(null);
                        }}
                      />
                    )}
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[300px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Cerca cliente (min. 3 caratteri)..."
                    value={memberSearchQuery}
                    onValueChange={setMemberSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {memberSearchQuery.length < 3
                        ? "Inserisci almeno 3 caratteri per cercare"
                        : "Nessun cliente trovato"}
                    </CommandEmpty>
                    {memberSearchQuery.length >= 3 && (
                      <CommandGroup>
                        {searchedMembers
                          .slice(0, 20)
                          .map((member) => (
                            <CommandItem
                              key={member.id}
                              value={member.id.toString()}
                              onSelect={() => {
                                setSelectedMemberId(member.id.toString());
                                setSelectedMember(member);
                                setMemberSearchOpen(false);
                                setMemberSearchQuery("");
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedMemberId === member.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-bold">{member.firstName} {member.lastName}</span>
                                {member.fiscalCode && (
                                  <span className="text-[10px] text-muted-foreground">{member.fiscalCode}</span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        }
      />
    </div>
  );
}
