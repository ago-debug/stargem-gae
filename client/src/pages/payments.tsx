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
import { Plus, Search, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Payment, InsertPayment, Member } from "@shared/schema";

export default function Payments() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const { data: membersData } = useQuery<{ members: Member[], total: number }>({
    queryKey: ["/api/members"],
  });
  const members = membersData?.members || [];

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
      status: "pending",
      notes: formData.get("notes") as string || null,
    };

    createMutation.mutate(data);
  };

  const getMemberName = (memberId: number | null) => {
    if (!memberId) return "-";
    const member = members?.find(m => m.id === memberId);
    return member ? `${member.firstName} ${member.lastName}` : "Sconosciuto";
  };

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
        <Button 
          onClick={() => setIsFormOpen(true)}
          data-testid="button-add-payment"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Pagamento
        </Button>
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
          ) : !payments || payments.length === 0 ? (
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
                {payments.map((payment) => (
                  <TableRow key={payment.id} data-testid={`payment-row-${payment.id}`}>
                    <TableCell className="font-medium">
                      {getMemberName(payment.memberId)}
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) {
          setSelectedMemberId("");
          setSelectedType("");
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuovo Pagamento</DialogTitle>
            <DialogDescription>Registra un nuovo pagamento o quota</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="memberId">Cliente (opzionale)</Label>
              <Select 
                name="memberId" 
                value={selectedMemberId}
                onValueChange={setSelectedMemberId}
              >
                <SelectTrigger data-testid="select-member">
                  <SelectValue placeholder="Seleziona iscritto" />
                </SelectTrigger>
                <SelectContent>
                  {members?.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.firstName} {member.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                data-testid="input-notes"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                data-testid="button-cancel"
              >
                Annulla
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                data-testid="button-submit-payment"
              >
                Registra Pagamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
