import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableHeader } from "@/components/shared/SortableHeader";
import { useSortableList } from "@/hooks/useSortableList";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  CreditCard,
  Check,
  ChevronsUpDown,
  X,
  Edit,
  Download,
  Filter,
  User,
  Wallet,
} from "lucide-react";
import { ExportWizard } from "@/components/ExportWizard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type {
  Payment,
  InsertPayment,
  Member,
  PaymentMethod,
  Course,
} from "@shared/schema";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { useLocation, Link } from "wouter";
import { NuovoPagamentoModal } from "@/components/nuovo-pagamento-modal";
import { NuovoPagamentoModal as NuovoPagamentoModalMC3 } from "@/components/payments/NuovoPagamentoModal";
export default function Payments() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 50;
  const debouncedSearch = useDebounce(searchQuery, 500);

  const { data: paymentsResponse, isLoading } = useQuery<{
    data: Payment[];
    total: number;
  }>({
    queryKey: ["/api/payments", { page, pageSize, search: debouncedSearch }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/payments?${params}`);
      if (!res.ok) throw new Error("Errore fetch pagamenti");
      return res.json();
    },
  });

  const payments = paymentsResponse?.data || [];
  const totalPages = Math.ceil((paymentsResponse?.total || 0) / pageSize);

  const { data: membersData } = useQuery<{ members: Member[]; total: number }>({
    queryKey: ["/api/members"],
  });
  const members = membersData?.members || [];

  // Server-side search for member selector (min 3 chars)
  const { data: searchedMembersData } = useQuery<{
    members: Member[];
    total: number;
  }>({
    queryKey: [`/api/members?search=${encodeURIComponent(memberSearchQuery)}`],
    enabled: memberSearchQuery.length >= 3,
  });
  const searchedMembers = searchedMembersData?.members || [];

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
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
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
        paidDate: status === "paid" ? new Date() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({ title: "Stato pagamento aggiornato" });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<InsertPayment>;
    }) => {
      await apiRequest("PATCH", `/api/payments/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({ title: "Pagamento aggiornato con successo" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
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
      const member = members?.find((m) => m.id === payment.memberId);
      setSelectedMember(
        member ||
          ({
            id: payment.memberId,
            firstName: payment.memberFirstName || "",
            lastName: payment.memberLastName || "",
          } as Member),
      );
    }

    setIsFormOpen(true);
  };

  const getMemberName = (payment: any) => {
    if (payment.memberFirstName || payment.memberLastName) {
      return `${payment.memberLastName || ""} ${payment.memberFirstName || ""}`.trim();
    }
    if (!payment.memberId) return "-";
    const member = members?.find((m) => m.id === payment.memberId);
    return member ? `${member.lastName} ${member.firstName}` : "Sconosciuto";
  };

  const exportToCSV = () => {
    if (!payments || payments.length === 0) {
      toast({ title: "Nessun dato da esportare", variant: "destructive" });
      return;
    }
    const filteredData = showPendingOnly
      ? payments.filter((p) => p.status === "pending")
      : payments;

    const headers = [
      "ID",
      "Partecipante",
      "Tipo",
      "Descrizione",
      "Importo",
      "Scadenza",
      "Metodo",
      "Data Pagamento",
    ];
    const rows = filteredData.map((p) => [
      p.id,
      getMemberName(p),
      p.type || "",
      p.description || "",
      p.amount,
      p.dueDate ? new Date(p.dueDate).toLocaleDateString("it-IT") : "",
      p.paymentMethod || "",
      p.paidDate ? new Date(p.paidDate).toLocaleString("it-IT") : "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pagamenti_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Esportazione completata" });
  };

  const filteredPaymentsRaw = payments.filter((p) => {
    const matchesPending = !showPendingOnly || p.status === "pending";
    return matchesPending;
  });

  const getSortValue = (payment: Payment, key: string) => {
    switch (key) {
      case "member":
        return getMemberName(payment);
      case "type":
        return payment.type;
      case "description":
        return payment.description;
      case "amount":
        return parseFloat((payment.amount as string) || "0");
      case "dueDate":
        return payment.dueDate;
      case "paidDate":
        return payment.paidDate;
      case "paymentMethod":
        return payment.paymentMethod;
      default:
        return null;
    }
  };

  const {
    sortConfig,
    handleSort,
    sortedData: filteredPayments,
  } = useSortableList<Payment>(
    filteredPaymentsRaw,
    "dueDate",
    "desc",
    getSortValue,
  );

  const formatLocalISO = (date: Date | string | null | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };
  const nowLocalISO = formatLocalISO(new Date());

  return (
    <div className="mx-auto space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-2 text-3xl font-semibold text-foreground">
            Gestione Pagamenti
          </h1>
          <p className="text-muted-foreground">
            Traccia pagamenti, quote e incassi dei partecipanti
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={showPendingOnly ? "default" : "outline"}
            onClick={() => setShowPendingOnly(!showPendingOnly)}
            data-testid="button-filter-pending"
          >
            <Filter className="mr-2 size-4" />
            {showPendingOnly ? "Tutti" : "In Sospeso"}
          </Button>
          <ExportWizard
            filename="pagamenti"
            title="Esporta Pagamenti"
            apiEndpoint="/api/export"
            apiParams={{ table: "payments" }}
            columns={[
              { key: "id", label: "ID Database", default: true },
              { key: "lastName", label: "Cognome", default: true },
              { key: "firstName", label: "Nome", default: true },
              { key: "fiscalCode", label: "Codice Fiscale", default: true },
              { key: "amount", label: "Importo", default: true },
              { key: "paymentMethod", label: "Metodo", default: true },
              { key: "dueDate", label: "Data", default: true, type: "date" },
              { key: "operator", label: "Operatore", default: true },
              { key: "period", label: "Periodo", default: true },
              { key: "description", label: "Descrizione" },
              { key: "status", label: "Stato" },
            ]}
          />
          <Button
            data-testid="button-add-payment"
            className="gold-3d-button"
            onClick={() => setIsNewModalOpen(true)}
          >
            <Plus className="mr-2 size-4" />
            Nuovo Pagamento
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Totale Incassato</h3>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €
              {payments
                ?.filter((p) => p.status === "paid" || p.status === "completed")
                .reduce((sum, p) => sum + parseFloat(p.amount), 0)
                .toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">In Attesa</h3>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €
              {payments
                ?.filter((p) => p.status === "pending")
                .reduce((sum, p) => sum + parseFloat(p.amount), 0)
                .toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Scaduti</h3>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payments?.filter((p) => p.status === "overdue").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cerca pagamento per nome utente o descrizione..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
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
            <div className="m-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/50 px-4 py-16 text-center duration-500 animate-in fade-in zoom-in-95">
              <div className="mb-4 rounded-full bg-primary/5 p-4 shadow-sm ring-1 ring-primary/10">
                <CreditCard className="size-10 text-primary/60" />
              </div>
              <p className="mb-1 text-xl font-bold tracking-tight text-foreground">
                Nessun pagamento trovato
              </p>
              <p className="max-w-[280px] text-sm text-muted-foreground">
                Le tue liste d'attesa e transazioni appariranno qui. Inizia
                cliccando su "Nuovo Pagamento".
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader
                    column="member"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    Pagatore
                  </SortableHeader>
                  <TableHead>Partecipanti</TableHead>
                  <SortableHeader
                    column="type"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    Tipo
                  </SortableHeader>
                  <SortableHeader
                    column="description"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    Descrizione
                  </SortableHeader>
                  <SortableHeader
                    column="amount"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    Importo
                  </SortableHeader>
                  <SortableHeader
                    column="dueDate"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    Scadenza
                  </SortableHeader>
                  <SortableHeader
                    column="paidDate"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    Pagato il
                  </SortableHeader>
                  <SortableHeader
                    column="paymentMethod"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  >
                    Metodo
                  </SortableHeader>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow
                    key={payment.id}
                    data-testid={`payment-row-${payment.id}`}
                  >
                    <TableCell
                      className={cn(
                        "font-medium",
                        sortConfig?.field === "member" && "sorted-column-cell",
                      )}
                    >
                      <button
                        onClick={() =>
                          setLocation(
                            `${window.location.pathname}?editMemberId=${payment.memberId}`,
                          )
                        }
                        className="flex items-center gap-2 text-left text-primary hover:underline"
                        title="Modifica Utente"
                      >
                        <User className="size-3" />
                        {getMemberName(payment)}
                      </button>
                    </TableCell>
                    <TableCell>
                      {(payment as any).participants &&
                      (payment as any).participants.length > 0 ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex cursor-pointer -space-x-2">
                                {(payment as any).participants
                                  .slice(0, 3)
                                  .map((p: any, i: number) => (
                                    <Avatar
                                      key={i}
                                      className="size-8 border-2 border-background"
                                    >
                                      <AvatarFallback className="bg-primary/10 text-xxs">
                                        {p.memberLastName?.charAt(0) || "?"}
                                        {p.memberFirstName?.charAt(0) || "?"}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                {(payment as any).participants.length > 3 && (
                                  <div className="z-10 flex size-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xxs font-medium">
                                    +{(payment as any).participants.length - 3}
                                  </div>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1 text-xs">
                                {(payment as any).participants.map(
                                  (p: any, i: number) => (
                                    <div
                                      key={i}
                                      className="flex justify-between gap-4"
                                    >
                                      <span>
                                        {p.memberLastName || ""}{" "}
                                        {p.memberFirstName || ""}
                                      </span>
                                      <span className="font-semibold">
                                        €{p.amountAttributed || 0}
                                      </span>
                                    </div>
                                  ),
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "capitalize",
                        sortConfig?.field === "type" && "sorted-column-cell",
                      )}
                    >
                      {payment.type}
                    </TableCell>
                    <TableCell
                      className={cn(
                        sortConfig?.field === "description" &&
                          "sorted-column-cell",
                      )}
                    >
                      {payment.description || "-"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "font-medium",
                        sortConfig?.field === "amount" && "sorted-column-cell",
                      )}
                    >
                      €{payment.amount}
                    </TableCell>
                    <TableCell
                      className={cn(
                        sortConfig?.field === "dueDate" && "sorted-column-cell",
                      )}
                    >
                      {payment.dueDate
                        ? new Date(payment.dueDate).toLocaleDateString("it-IT")
                        : "-"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        sortConfig?.field === "paidDate" &&
                          "sorted-column-cell",
                      )}
                    >
                      {payment.paidDate
                        ? new Date(payment.paidDate).toLocaleString("it-IT", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "capitalize",
                        sortConfig?.field === "paymentMethod" &&
                          "sorted-column-cell",
                      )}
                    >
                      {payment.paymentMethod || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(payment)}
                          data-testid={`button-edit-payment-${payment.id}`}
                        >
                          <Edit className="size-4" />
                        </Button>
                        {payment.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(payment)}
                            data-testid={`button-pay-${payment.id}`}
                          >
                            Paga
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex justify-end">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={
                        page === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-4 text-sm">
                      Pagina {page} di {totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className={
                        page === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <NuovoPagamentoModal
        isOpen={isFormOpen}
        onClose={closeDialog}
        defaultMemberId={
          selectedMemberId ? parseInt(selectedMemberId) : undefined
        }
        editingPayment={editingPayment}
      />

      <NuovoPagamentoModalMC3
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        defaultMemberId={
          selectedMemberId ? parseInt(selectedMemberId) : undefined
        }
      />
    </div>
  );
}
