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
import { Plus, Search, CreditCard, Check, ChevronsUpDown, X, Edit, Download, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { Payment, InsertPayment, Member } from "@shared/schema";

export default function Payments() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [showPendingOnly, setShowPendingOnly] = useState(false);

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

  const createMutation = useMutation({
    mutationFn: async (data: InsertPayment) => {
      await apiRequest("POST", "/api/payments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({ title: "Pagamento registrato con successo" });
      setSelectedMemberId("");
      setSelectedType("");
      setIsFormOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/payments/${id}`, { status, paidDate: status === 'paid' ? new Date().toISOString().split('T')[0] : null });
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
    setSelectedType("");
    setMemberSearchQuery("");
  };

  const openEditDialog = (payment: Payment) => {
    setEditingPayment(payment);
    setSelectedMemberId(payment.memberId?.toString() || "");
    setSelectedType(payment.type || "");
    setIsFormOpen(true);
  };

  const getMemberName = (payment: any) => {
    if (payment.memberFirstName && payment.memberLastName) {
      return `${payment.memberFirstName} ${payment.memberLastName}`;
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
    
    const headers = ["ID", "Cliente", "Tipo", "Descrizione", "Importo", "Scadenza", "Metodo", "Stato", "Data Pagamento"];
    const rows = filteredData.map(p => [
      p.id,
      getMemberName(p),
      p.type || "",
      p.description || "",
      p.amount,
      p.dueDate ? new Date(p.dueDate).toLocaleDateString('it-IT') : "",
      p.paymentMethod || "",
      p.status,
      p.paidDate ? new Date(p.paidDate).toLocaleDateString('it-IT') : ""
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
    const data: InsertPayment = {
      memberId: formData.get("memberId") ? parseInt(formData.get("memberId") as string) : null,
      enrollmentId: formData.get("enrollmentId") ? parseInt(formData.get("enrollmentId") as string) : null,
      amount: formData.get("amount") as string,
      type: formData.get("type") as string,
      description: formData.get("description") as string || null,
      dueDate: formData.get("dueDate") as string || null,
      paymentMethod: formData.get("paymentMethod") as string || null,
      status: editingPayment ? (formData.get("status") as string || editingPayment.status) : "pending",
      notes: formData.get("notes") as string || null,
    };

    if (editingPayment) {
      updateMutation.mutate({ id: editingPayment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Filter payments based on search and pending filter
  const filteredPayments = payments?.filter(p => {
    const matchesSearch = !searchQuery || 
      getMemberName(p).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.type || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPending = !showPendingOnly || p.status === 'pending';
    return matchesSearch && matchesPending;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default">Pagato</Badge>;
      case 'pending':
        return <Badge variant="secondary">In Attesa</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Scaduto</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

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
            onClick={() => setIsFormOpen(true)}
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
              €{payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2) || '0.00'}
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
                  <TableHead>Metodo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id} data-testid={`payment-row-${payment.id}`}>
                    <TableCell className="font-medium">
                      {getMemberName(payment)}
                    </TableCell>
                    <TableCell className="capitalize">{payment.type}</TableCell>
                    <TableCell>{payment.description || "-"}</TableCell>
                    <TableCell className="font-medium">€{payment.amount}</TableCell>
                    <TableCell>
                      {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString('it-IT') : "-"}
                    </TableCell>
                    <TableCell className="capitalize">{payment.paymentMethod || "-"}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
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
            <div className="space-y-2">
              <Label htmlFor="memberId">Cliente (opzionale)</Label>
              <input type="hidden" name="memberId" value={selectedMemberId} />
              <Popover open={memberSearchOpen} onOpenChange={setMemberSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={memberSearchOpen}
                    className="w-full justify-between font-normal"
                    data-testid="select-member"
                  >
                    {selectedMemberId ? (
                      <span>
                        {members?.find(m => m.id.toString() === selectedMemberId)?.firstName}{' '}
                        {members?.find(m => m.id.toString() === selectedMemberId)?.lastName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Cerca per nome, cognome o CF...</span>
                    )}
                    <div className="flex items-center gap-1">
                      {selectedMemberId && (
                        <X
                          className="h-4 w-4 text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMemberId("");
                          }}
                        />
                      )}
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
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
                                  setMemberSearchOpen(false);
                                  setMemberSearchQuery("");
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
                                  <span className="font-medium">{member.firstName} {member.lastName}</span>
                                  {member.fiscalCode && (
                                    <span className="text-xs text-muted-foreground">{member.fiscalCode}</span>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select 
                  name="type" 
                  required
                  value={selectedType}
                  onValueChange={setSelectedType}
                >
                  <SelectTrigger data-testid="select-type">
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course">Corso</SelectItem>
                    <SelectItem value="membership">Tessera</SelectItem>
                    <SelectItem value="other">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Importo (€) *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={editingPayment?.amount || ""}
                  key={`amount-${editingPayment?.id || 'new'}`}
                  data-testid="input-amount"
                />
              </div>
            </div>

            {/* Enrollment selection - shown only for course/membership payments with member selected */}
            {selectedMemberId && (selectedType === 'course' || selectedType === 'membership') && (
              <div className="space-y-2">
                <Label htmlFor="enrollmentId">Iscrizione Collegata (opzionale)</Label>
                <Select name="enrollmentId">
                  <SelectTrigger data-testid="select-enrollment">
                    <SelectValue placeholder="Seleziona iscrizione" />
                  </SelectTrigger>
                  <SelectContent>
                    {enrollments
                      ?.filter(e => e.memberId === parseInt(selectedMemberId))
                      .map((enrollment) => {
                        const course = courses?.find(c => c.id === enrollment.courseId);
                        return (
                          <SelectItem key={enrollment.id} value={enrollment.id.toString()}>
                            {course?.name || "Corso sconosciuto"} - Iscrizione del{' '}
                            {new Date(enrollment.enrollmentDate).toLocaleDateString('it-IT')}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Collega questo pagamento a un'iscrizione specifica per un migliore tracking
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Input
                id="description"
                name="description"
                placeholder="Es: Quota corso Yoga principianti"
                defaultValue={editingPayment?.description || ""}
                key={`description-${editingPayment?.id || 'new'}`}
                data-testid="input-description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Data Scadenza</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  defaultValue={editingPayment?.dueDate?.split('T')[0] || ""}
                  key={`dueDate-${editingPayment?.id || 'new'}`}
                  data-testid="input-dueDate"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Metodo Pagamento</Label>
                <Select name="paymentMethod">
                  <SelectTrigger data-testid="select-paymentMethod">
                    <SelectValue placeholder="Seleziona metodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Contanti</SelectItem>
                    <SelectItem value="card">Carta/POS</SelectItem>
                    <SelectItem value="bank_transfer">Bonifico</SelectItem>
                    <SelectItem value="other">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editingPayment && (
              <div className="space-y-2">
                <Label htmlFor="status">Stato</Label>
                <Select name="status" defaultValue={editingPayment.status}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder="Seleziona stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">In Attesa</SelectItem>
                    <SelectItem value="paid">Pagato</SelectItem>
                    <SelectItem value="overdue">Scaduto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={editingPayment?.notes || ""}
                key={`notes-${editingPayment?.id || 'new'}`}
                data-testid="input-notes"
              />
            </div>

            <DialogFooter>
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
