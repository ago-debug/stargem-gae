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
import type { Payment, InsertPayment, Member, PaymentMethod } from "@shared/schema";

import { useLocation } from "wouter";

export default function Payments() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [resetCounter, setResetCounter] = useState(0);
  const [isSaveAndNew, setIsSaveAndNew] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");

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
      if (isSaveAndNew) {
        setEditingPayment(null);
        setSelectedItem(null);
        setResetCounter(prev => prev + 1);
        setAmount("");
        setDescription("");
        setIsSaveAndNew(false);
      } else {
        closeDialog();
      }
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
      if (isSaveAndNew) {
        setEditingPayment(null);
        setSelectedItem(null);
        setResetCounter(prev => prev + 1);
        setAmount("");
        setDescription("");
        setIsSaveAndNew(false);
      } else {
        closeDialog();
      }
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
    setSelectedType("");
    setMemberSearchQuery("");
    setSelectedItem(null);
    setAmount("");
    setDescription("");
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

    setAmount(payment.amount?.toString() || "");
    setDescription(payment.description || "");
    setSelectedType(payment.type || "");

    // Find and set selectedItem
    if (payment.enrollmentId) {
      setSelectedItem({ id: `enrollment-${payment.enrollmentId}`, dbId: payment.enrollmentId, type: 'course' });
    } else if (payment.workshopEnrollmentId) {
      setSelectedItem({ id: `workshop-${payment.workshopEnrollmentId}`, dbId: payment.workshopEnrollmentId, type: 'workshop' });
    } else if (payment.bookingId) {
      setSelectedItem({ id: `booking-${payment.bookingId}`, dbId: payment.bookingId, type: 'service_booking' });
    } else if (payment.membershipId) {
      setSelectedItem({ id: `membership-${payment.membershipId}`, dbId: payment.membershipId, type: 'membership' });
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const parseOptionalInt = (val: any) => {
      if (!val || val === "") return null;
      const parsed = parseInt(val);
      return isNaN(parsed) ? null : parsed;
    };

    const enteredAmount = parseFloat(amount);
    const remaining = selectedItem?.remaining || 0;
    const paymentMethod = formData.get("paymentMethod") as string;
    const paidDateVal = formData.get("paidDate");

    // Ensure status is mark as paid if a date is selected, otherwise keep old status or default to paid
    let status = editingPayment ? editingPayment.status : "paid";
    if (paidDateVal && paidDateVal !== "") {
      status = "paid";
    }

    // Strict Validation: Payment Method IS MANDATORY
    if (!paymentMethod) {
      toast({
        title: "Metodo di Pagamento Mancante",
        description: "Seleziona un metodo di pagamento per procedere.",
        variant: "destructive"
      });
      return;
    }

    // Strict Validation: Overpayment NOT allowed (Strict Check for ALL types of payments)
    // Convert to cents to avoid floating point issues
    const enteredCents = Math.round(enteredAmount * 100);
    const remainingCents = Math.round(remaining * 100);

    // Allow editing to same amount (if we are editing, we compare against new amount vs remaining)
    // Wait, 'remaining' calculated in 'items' loop excludes the current editing payment.
    // So 'remaining' is correct for comparison.

    if (selectedItem && enteredCents > remainingCents) {
      toast({
        title: "Importo non valido",
        description: `L'importo inserito (€${enteredAmount.toFixed(2)}) supera il residuo dovuto (€${remaining.toFixed(2)}). Differenza non ammessa.`,
        variant: "destructive"
      });
      return;
    }

    const data: InsertPayment = {
      memberId: parseOptionalInt(formData.get("memberId")),
      enrollmentId: parseOptionalInt(formData.get("enrollmentId")),
      workshopEnrollmentId: parseOptionalInt(formData.get("workshopEnrollmentId")),
      bookingId: parseOptionalInt(formData.get("bookingId")),
      membershipId: parseOptionalInt(formData.get("membershipId")),
      amount: (formData.get("amount") as string).replace(',', '.'),
      type: (formData.get("type") as string) || selectedType,
      description: formData.get("description") as string || null,
      dueDate: formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : null,
      paymentMethod: paymentMethod || null,
      paymentMethodId: paymentMethod ? (paymentMethods?.find(m => m.name === paymentMethod)?.id || null) : null,
      status: status,
      notes: formData.get("notes") as string || null,
      paidDate: paidDateVal ? new Date(paidDateVal as string) : null,
    };

    if (editingPayment) {
      updateMutation.mutate({ id: editingPayment.id, data });
    } else {
      createMutation.mutate(data);
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

      <Dialog open={isFormOpen} onOpenChange={(open) => {
        if (!open) closeDialog();
        else setIsFormOpen(open);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPayment ? "Modifica Pagamento" : "Nuovo Pagamento"}</DialogTitle>
            <DialogDescription>
              {editingPayment ? "Modifica i dettagli del pagamento" : "Registra un nuovo pagamento o quota"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="memberId">Cliente (opzionale)</Label>
                <input type="hidden" name="memberId" value={selectedMemberId} />
                <Popover open={memberSearchOpen} onOpenChange={setMemberSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={memberSearchOpen}
                      className="w-full justify-between font-normal h-12"
                      data-testid="select-member"
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
                            className="h-4 w-4 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMemberId("");
                              setSelectedMember(null);
                              setSelectedItem(null);
                              setAmount("");
                              setDescription("");
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
                        data-testid="input-search-member"
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
                                    setSelectedItem(null);
                                    setAmount("");
                                    setDescription("");
                                  }}
                                  data-testid={`member-option-${member.id}`}
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
            </div>

            {/* Item selection - Propose items based on member */}
            {selectedMemberId && (
              <div className="space-y-2">
                <Label>Cosa desideri pagare?</Label>
                <div className="grid grid-cols-1 gap-2 border rounded-md p-3 max-h-60 overflow-y-auto bg-muted/30">
                  {(() => {
                    const memberId = parseInt(selectedMemberId);
                    interface PayableItem {
                      id: string;
                      dbId: number;
                      type: string;
                      label: string;
                      total: number;
                      paid: number;
                      remaining: number;
                      movements: any[];
                    }
                    const items: PayableItem[] = [];

                    // 1. Courses
                    const memberEnrollments = enrollments?.filter(e => e.memberId === memberId) || [];
                    memberEnrollments.forEach(e => {
                      const course = courses?.find(c => c.id === e.courseId);
                      const totalPrice = parseFloat(course?.price || "0");
                      const allMovements = payments
                        ?.filter(p => p.enrollmentId === e.id)
                        .sort((a, b) => new Date(b.paidDate || b.dueDate || 0).getTime() - new Date(a.paidDate || a.dueDate || 0).getTime());

                      // For "alreadyPaid", we exclude the one we are CURRENTLY editing so the "remaining" is pre-this-payment
                      const alreadyPaid = allMovements
                        ?.filter(p => (p.status === 'paid' || p.status === 'completed') && p.id !== editingPayment?.id)
                        .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

                      const remaining = totalPrice - alreadyPaid;
                      items.push({
                        id: `enrollment-${e.id}`,
                        dbId: e.id,
                        type: 'course',
                        label: `${course?.name || "Corso"} (Scuola)`,
                        total: totalPrice,
                        paid: alreadyPaid,
                        remaining: remaining,
                        movements: allMovements || []
                      });
                    });

                    // 2. Workshops
                    const memberWorkshops = workshopEnrollments?.filter(e => e.memberId === memberId) || [];
                    memberWorkshops.forEach(e => {
                      const workshop = workshops?.find(w => w.id === e.workshopId);
                      const totalPrice = parseFloat(workshop?.price || "0");
                      const allMovements = payments
                        ?.filter(p => p.workshopEnrollmentId === e.id)
                        .sort((a, b) => new Date(b.paidDate || b.dueDate || 0).getTime() - new Date(a.paidDate || a.dueDate || 0).getTime());

                      const alreadyPaid = allMovements
                        ?.filter(p => (p.status === 'paid' || p.status === 'completed') && p.id !== editingPayment?.id)
                        .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

                      const remaining = totalPrice - alreadyPaid;
                      items.push({
                        id: `workshop-${e.id}`,
                        dbId: e.id,
                        type: 'workshop',
                        label: `${workshop?.title || "Workshop"} (Workshop)`,
                        total: totalPrice,
                        paid: alreadyPaid,
                        remaining: remaining,
                        movements: allMovements || []
                      });
                    });

                    // 3. Studio Bookings
                    const memberBookings = studioBookings?.filter(b => b.memberId === memberId) || [];
                    memberBookings.forEach(b => {
                      const totalPrice = parseFloat(b.amount || "0");
                      const allMovements = payments
                        ?.filter(p => p.bookingId === b.id)
                        .sort((a, b) => new Date(b.paidDate || b.dueDate || 0).getTime() - new Date(a.paidDate || a.dueDate || 0).getTime());

                      const alreadyPaid = allMovements
                        ?.filter(p => (p.status === 'paid' || p.status === 'completed') && p.id !== editingPayment?.id)
                        .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

                      const remaining = totalPrice - alreadyPaid;
                      items.push({
                        id: `booking-${b.id}`,
                        dbId: b.id,
                        type: 'service_booking',
                        label: `Prenotazione: ${b.title || "Affitto Sala"} (${new Date(b.bookingDate).toLocaleDateString('it-IT')})`,
                        total: totalPrice,
                        paid: alreadyPaid,
                        remaining: remaining,
                        movements: allMovements || []
                      });
                    });

                    // 4. Membership (Quota Tessera)
                    const memberMemberships = membershipsDataList?.filter(m => m.memberId === memberId) || [];
                    memberMemberships.forEach(m => {
                      const totalPrice = parseFloat(m.fee || "0");
                      const allMovements = payments
                        ?.filter(p => p.membershipId === m.id)
                        .sort((a, b) => new Date(b.paidDate || b.dueDate || 0).getTime() - new Date(a.paidDate || a.dueDate || 0).getTime());

                      const alreadyPaid = allMovements
                        ?.filter(p => (p.status === 'paid' || p.status === 'completed') && p.id !== editingPayment?.id)
                        .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

                      const remaining = totalPrice - alreadyPaid;
                      items.push({
                        id: `membership-${m.id}`,
                        dbId: m.id,
                        type: 'membership',
                        label: `Quota Tessera (${m.membershipNumber})`,
                        total: totalPrice,
                        paid: alreadyPaid,
                        remaining: remaining,
                        movements: allMovements || []
                      });
                    });

                    if (items.length === 0) {
                      return <p className="text-xs text-muted-foreground italic p-2">Nessun corso o servizio in sospeso trovato per questo cliente.</p>;
                    }

                    return items
                      .sort((a, b) => (b.remaining > 0 ? 1 : 0) - (a.remaining > 0 ? 1 : 0))
                      .map(item => (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (item.remaining <= 0) return;
                            setSelectedItem(item);
                            setSelectedType(item.type);
                            setAmount(item.remaining.toFixed(2));
                            setDescription(`Pagamento parziale/totale per ${item.label}`);
                          }}
                          className={cn(
                            "flex flex-col p-2.5 rounded-lg border-2 cursor-pointer transition-all relative",
                            selectedItem?.id === item.id
                              ? "bg-primary/5 border-primary ring-2 ring-primary/20 shadow-md"
                              : "bg-card border-border hover:border-primary/50 hover:bg-accent/50",
                            item.remaining <= 0 && "opacity-60 cursor-default bg-muted/20 border-dashed border-muted-foreground/30"
                          )}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm">{item.label}</span>
                            {item.remaining > 0 ? (
                              <Badge variant="destructive" className="font-bold">
                                Da pagare: €{item.remaining.toFixed(2)}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 font-bold">
                                PAGATO
                              </Badge>
                            )}
                          </div>
                          {item.movements && item.movements.length > 0 && (
                            <div className="mt-2 text-[10px] text-muted-foreground border-t pt-1 space-y-0.5">
                              {item.movements.map(m => (
                                <div key={m.id} className={cn(
                                  "flex justify-between items-center py-0.5 border-l-2 pl-2 transition-colors",
                                  m.id === editingPayment?.id
                                    ? "text-primary border-primary font-bold bg-primary/5 italic"
                                    : "border-transparent"
                                )}>
                                  <div className="flex items-baseline gap-1 overflow-hidden">
                                    <span className="opacity-70 shrink-0">
                                      {m.paidDate ? new Date(m.paidDate).toLocaleDateString('it-IT') : (m.dueDate ? `Scad. ${new Date(m.dueDate).toLocaleDateString('it-IT')}` : 'N/D')}-
                                    </span>
                                    <span className="truncate italic pr-2">
                                      {m.description || 'Pagamento'}
                                      {m.id === editingPayment?.id && " (In modifica)"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 text-foreground">
                                    {m.status !== 'paid' && m.status !== 'completed' && (
                                      <span className="text-[8px] font-bold uppercase text-rose-600">
                                        ({m.status})
                                      </span>
                                    )}
                                    <span className={cn("font-bold whitespace-nowrap", m.id === editingPayment?.id && "text-primary")}>
                                      €{parseFloat(m.amount).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ));
                  })()}
                </div>
                {selectedItem && (
                  <>
                    <input type="hidden" name="enrollmentId" value={selectedItem.type === 'course' ? selectedItem.dbId : ""} />
                    <input type="hidden" name="workshopEnrollmentId" value={selectedItem.type === 'workshop' ? selectedItem.dbId : ""} />
                    <input type="hidden" name="bookingId" value={selectedItem.type === 'service_booking' ? selectedItem.dbId : ""} />
                    <input type="hidden" name="membershipId" value={selectedItem.type === 'membership' ? selectedItem.dbId : ""} />
                  </>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Input
                id="description"
                name="description"
                placeholder="Es: Quota corso Yoga principianti"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                key={`description-${resetCounter}`}
                data-testid="input-description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Importo (€) *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  key={`amount-${resetCounter}`}
                  data-testid="input-amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo Pagamento *</Label>
                <Select
                  name="type"
                  value={selectedType}
                  onValueChange={setSelectedType}
                  key={`type-${resetCounter}`}
                >
                  <SelectTrigger data-testid="select-type">
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course">Abbonamento Corso</SelectItem>
                    <SelectItem value="membership">Quota Associativa/Tessera</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="service_booking">Servizio/Affitto</SelectItem>
                    <SelectItem value="other">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Data Scadenza</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  defaultValue={editingPayment?.dueDate ? new Date(editingPayment.dueDate).toISOString().split('T')[0] : ""}
                  key={`dueDate-${editingPayment?.id || 'new'}-${resetCounter}`}
                  data-testid="input-dueDate"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paidDate">Data e Ora Pagamento</Label>
                <Input
                  id="paidDate"
                  name="paidDate"
                  type="datetime-local"
                  defaultValue={editingPayment?.paidDate ? formatLocalISO(editingPayment.paidDate) : nowLocalISO}
                  key={`paidDate-${editingPayment?.id || 'new'}-${resetCounter}`}
                  data-testid="input-paidDate"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Metodo Pagamento</Label>
                <Select
                  name="paymentMethod"
                  defaultValue={editingPayment?.paymentMethod || ""}
                  key={`pm-${editingPayment?.id || 'new'}-${resetCounter}`}
                >
                  <SelectTrigger data-testid="select-paymentMethod">
                    <SelectValue placeholder="Seleziona metodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credito Interno">Credito Interno</SelectItem>
                    {paymentMethods?.map((method) => (
                      <SelectItem key={method.id} value={method.name}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Note</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={1}
                  defaultValue={editingPayment?.notes || ""}
                  key={`notes-${editingPayment?.id || 'new'}-${resetCounter}`}
                  data-testid="input-notes"
                  className="min-h-[40px]"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              {editingPayment && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingPayment(null);
                    setSelectedItem(null);
                    setResetCounter(prev => prev + 1);
                    setAmount("");
                    setDescription("");
                  }}
                  className="mr-auto text-xs"
                >
                  Svuota per nuovo
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                data-testid="button-cancel"
              >
                Annulla
              </Button>
              <Button
                type="submit"
                variant="secondary"
                onClick={() => setIsSaveAndNew(true)}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="gap-2"
              >
                {editingPayment ? "Salva e Aggiungi Altro" : "Registra e Nuovo"}
              </Button>
              <Button
                type="submit"
                onClick={() => setIsSaveAndNew(false)}
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-payment"
              >
                {editingPayment ? "Salva Modifiche" : "Registra Pagamento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
