import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, IdCard, FileText, Building2, Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { cn } from "@/lib/utils";
import type { Membership, InsertMembership, MedicalCertificate, InsertMedicalCertificate, Member } from "@shared/schema";
import { useEffect } from "react";

export default function Memberships() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [membershipSearch, setMembershipSearch] = useState("");
  const [entityCardSearch, setEntityCardSearch] = useState("");
  const [certificateSearch, setCertificateSearch] = useState("");
  const [isMembershipFormOpen, setIsMembershipFormOpen] = useState(false);
  const [isCertificateFormOpen, setIsCertificateFormOpen] = useState(false);
  const [editingMembership, setEditingMembership] = useState<Membership | null>(null);
  const [editingCertificate, setEditingCertificate] = useState<MedicalCertificate | null>(null);

  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  const [membershipMemberOpen, setMembershipMemberOpen] = useState(false);
  const [membershipMemberSearch, setMembershipMemberSearch] = useState("");
  const [selectedMembershipMember, setSelectedMembershipMember] = useState<Member | null>(null);

  const [certMemberOpen, setCertMemberOpen] = useState(false);
  const [certMemberSearch, setCertMemberSearch] = useState("");
  const [selectedCertMember, setSelectedCertMember] = useState<Member | null>(null);

  const { data: memberships, isLoading: membershipsLoading } = useQuery<Membership[]>({
    queryKey: ["/api/memberships"],
  });

  const { data: certificates, isLoading: certificatesLoading } = useQuery<MedicalCertificate[]>({
    queryKey: ["/api/medical-certificates"],
  });

  const { data: membersData } = useQuery<{ members: Member[], total: number }>({
    queryKey: ["/api/members"],
  });
  const members = membersData?.members || [];

  const { data: entityCardMembers, isLoading: entityCardsLoading } = useQuery<Member[]>({
    queryKey: ["/api/members/entity-cards"],
  });

  const { data: membershipSearchResults } = useQuery<{ members: Member[], total: number }>({
    queryKey: ["/api/members", { search: membershipMemberSearch }],
    queryFn: async () => {
      const res = await fetch(`/api/members?search=${encodeURIComponent(membershipMemberSearch)}&pageSize=20`);
      return res.json();
    },
    enabled: membershipMemberSearch.length >= 3,
  });

  const { data: certSearchResults } = useQuery<{ members: Member[], total: number }>({
    queryKey: ["/api/members", { search: certMemberSearch }],
    queryFn: async () => {
      const res = await fetch(`/api/members?search=${encodeURIComponent(certMemberSearch)}&pageSize=20`);
      return res.json();
    },
    enabled: certMemberSearch.length >= 3,
  });

  // Intercept search parameters for external routing
  useEffect(() => {
    const urlParams = new URLSearchParams(searchString);
    const memberIdUrl = urlParams.get('memberId') || urlParams.get('memberid');
    const actionUrl = urlParams.get('action');
    const isNewTessera = urlParams.get('newTessera') === 'true';

    if ((actionUrl === 'new_membership' || isNewTessera) && memberIdUrl) {
      const id = parseInt(memberIdUrl);
      if (!isNaN(id)) {
        fetch(`/api/members/${id}`)
          .then(res => {
            if (res.ok) return res.json();
            throw new Error('Membro non passato o non trovato');
          })
          .then((member: Member) => {
            setSelectedMembershipMember(member);
            setIsMembershipFormOpen(true);
            setMembershipMemberSearch(`${member.lastName} ${member.firstName}`);
            // Pulisci l'URL per impedire riaperture successive e resta su /tessere
            setLocation('/tessere', { replace: true });
          })
          .catch(err => console.error("[AutoOpen Membership Modal]", err));
      }
    }
  }, [searchString, setLocation]);

  const tsMemberships = useSortableTable<any>("member");
  const getMembershipSortValue = (item: any, key: string) => {
    switch (key) {
      case "member": return getMemberName(item);
      case "membershipNumber": return item.membershipNumber;
      case "barcode": return item.barcode;
      case "type": return item.type;
      case "expiryDate": return item.expiryDate;
      case "paymentDate": return item.paymentDate;
      case "paymentStatus": {
        if (item.paymentStatus === 'paid') return 2;
        const isZeroFee = !item.fee || parseFloat(item.fee.toString()) === 0;
        const isActive = getExpiryStatus(item.expiryDate).variant === 'default';
        if (isZeroFee && isActive) return 1;
        return 0;
      }
      case "status": return getExpiryStatus(item.expiryDate).label;
      default: return null;
    }
  };

  const tsCertificates = useSortableTable<any>("member");
  const getCertificateSortValue = (item: any, key: string) => {
    switch (key) {
      case "member": return getMemberName(item);
      case "doctor": return item.doctorName;
      case "issueDate": return item.issueDate;
      case "expiryDate": return item.expiryDate;
      case "status": return getExpiryStatus(item.expiryDate).label;
      default: return null;
    }
  };

  const tsEntityCards = useSortableTable<Member>("member");
  const getEntityCardSortValue = (member: Member, key: string) => {
    switch (key) {
      case "member": return `${member.lastName} ${member.firstName}`;
      case "type": return member.entityCardType;
      case "number": return member.entityCardNumber;
      case "issueDate": return member.entityCardIssueDate;
      case "expiryDate": return member.entityCardExpiryDate;
      case "status": return member.entityCardExpiryDate ? getExpiryStatus(member.entityCardExpiryDate).label : "";
      default: return null;
    }
  };

  const createMembershipMutation = useMutation({
    mutationFn: async (data: InsertMembership) => {
      await apiRequest("POST", "/api/memberships", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memberships"] });
      toast({ title: "Tessera creata con successo" });
      setIsMembershipFormOpen(false);
      setEditingMembership(null);
      setSelectedMembershipMember(null);
      setMembershipMemberSearch("");
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMembershipMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/memberships/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memberships"] });
      toast({ title: "Tessera eliminata con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const createCertificateMutation = useMutation({
    mutationFn: async (data: InsertMedicalCertificate) => {
      await apiRequest("POST", "/api/medical-certificates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-certificates"] });
      toast({ title: "Certificato creato con successo" });
      setIsCertificateFormOpen(false);
      setEditingCertificate(null);
      setSelectedCertMember(null);
      setCertMemberSearch("");
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleMembershipSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMembershipMember) {
      toast({ title: "Errore", description: "Seleziona un partecipante", variant: "destructive" });
      return;
    }
    const formData = new FormData(e.currentTarget);
    const data: InsertMembership = {
      memberId: selectedMembershipMember.id,
      membershipNumber: formData.get("membershipNumber") as string,
      barcode: formData.get("barcode") as string,
      issueDate: new Date(),
      expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      type: "annual",
      fee: "25",
      status: "active",
    };

    // Aggiungo campi extra per il backend
    const extraData = {
      nuovoRinnovo: formData.get("renewalType") as string,
      entityCardNumber: formData.get("entityCardNumber") as string,
      entityCardExpiryDate: formData.get("entityCardExpiryDate") as string,
    };

    createMembershipMutation.mutate({ ...data, ...extraData } as any);
  };

  const handleCertificateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCertMember) {
      toast({ title: "Errore", description: "Seleziona un partecipante", variant: "destructive" });
      return;
    }
    const formData = new FormData(e.currentTarget);
    const data: InsertMedicalCertificate = {
      memberId: selectedCertMember.id,
      issueDate: new Date(formData.get("issueDate") as string),
      expiryDate: new Date(formData.get("expiryDate") as string),
      doctorName: formData.get("doctorName") as string || null,
      notes: formData.get("notes") as string || null,
      status: "valid",
    };

    createCertificateMutation.mutate(data);
  };

  const getMemberName = (item: any) => {
    if (item.memberFirstName && item.memberLastName) {
      return `${item.memberLastName} ${item.memberFirstName}`;
    }
    if (!item.memberId) return "-";
    const member = members?.find(m => m.id === item.memberId);
    return member ? `${member.lastName} ${member.firstName}` : "Sconosciuto";
  };

  const getExpiryStatus = (expiryDate: string | Date | null | undefined) => {
    if (!expiryDate) return { status: "unknown", label: "N/D", variant: "secondary" as const };
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return { status: "expired", label: "Scaduto", variant: "destructive" as const };
    if (daysUntilExpiry <= 7) return { status: "expiring", label: "In Scadenza", variant: "secondary" as const };
    return { status: "active", label: "Attivo", variant: "default" as const };
  };

  return (
    <div className="p-6 md:p-8 space-y-6 mx-auto">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Tessere & Certificati Medici</h1>
        <p className="text-muted-foreground">Gestisci tessere e certificati medici</p>
      </div>

      <Tabs defaultValue="memberships" className="space-y-6">
        <TabsList>
          <TabsTrigger value="memberships" data-testid="tab-memberships">
            <IdCard className="w-4 h-4 mr-2" />
            Tessere
          </TabsTrigger>
          <TabsTrigger value="entity-cards" data-testid="tab-entity-cards">
            <Building2 className="w-4 h-4 mr-2" />
            Tessere Ente
          </TabsTrigger>
          <TabsTrigger value="certificates" data-testid="tab-certificates">
            <FileText className="w-4 h-4 mr-2" />
            Certificati Medici
          </TabsTrigger>
        </TabsList>

        <TabsContent value="memberships" className="space-y-6">
          <div className="flex items-center justify-end">
            <Button
              onClick={() => {
                setEditingMembership(null);
                setIsMembershipFormOpen(true);
              }}
              data-testid="button-add-membership"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuova Tessera
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca per cognome, nome o codice fiscale..."
                  value={membershipSearch}
                  onChange={(e) => setMembershipSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-memberships"
                />
              </div>
            </CardHeader>
            <CardContent>
              {membershipsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !memberships || memberships.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <IdCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Nessuna tessera trovata</p>
                  <p className="text-sm">Inizia creando la prima tessera</p>
                </div>
              ) : (() => {
                const filteredMembershipsRaw = memberships.filter((membership: any) => {
                  if (!membershipSearch || membershipSearch.length < 3) return true;
                  const searchLower = membershipSearch.toLowerCase();
                  const memberName = `${membership.memberFirstName || ""} ${membership.memberLastName || ""}`.toLowerCase();
                  const fiscalCode = membership.memberFiscalCode?.toLowerCase() || "";
                  return memberName.includes(searchLower) || fiscalCode.includes(searchLower);
                });
                const filteredMemberships = tsMemberships.sortItems(filteredMembershipsRaw, getMembershipSortValue);

                if (filteredMemberships.length === 0) {
                  return (
                    <div className="text-center py-12 text-muted-foreground">
                      <IdCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Nessun risultato trovato</p>
                      <p className="text-sm">Prova con un altro termine di ricerca</p>
                    </div>
                  );
                }

                return (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableTableHead sortKey="member" currentSort={tsMemberships.sortConfig} onSort={tsMemberships.handleSort}>Partecipante</SortableTableHead>
                        <SortableTableHead sortKey="membershipNumber" currentSort={tsMemberships.sortConfig} onSort={tsMemberships.handleSort}>N. Tessera</SortableTableHead>
                        <SortableTableHead sortKey="barcode" currentSort={tsMemberships.sortConfig} onSort={tsMemberships.handleSort}>Barcode</SortableTableHead>
                        <SortableTableHead sortKey="type" currentSort={tsMemberships.sortConfig} onSort={tsMemberships.handleSort}>Tipo</SortableTableHead>
                        <SortableTableHead sortKey="expiryDate" currentSort={tsMemberships.sortConfig} onSort={tsMemberships.handleSort}>Scadenza</SortableTableHead>
                        <SortableTableHead sortKey="paymentDate" currentSort={tsMemberships.sortConfig} onSort={tsMemberships.handleSort}>Data Pagamento</SortableTableHead>
                        <SortableTableHead sortKey="paymentStatus" currentSort={tsMemberships.sortConfig} onSort={tsMemberships.handleSort}>Pagato</SortableTableHead>
                        <SortableTableHead sortKey="status" currentSort={tsMemberships.sortConfig} onSort={tsMemberships.handleSort}>Stato</SortableTableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMemberships.map((membership) => {
                        const expiryInfo = getExpiryStatus(membership.expiryDate);
                        
                        const getPaymentBadgeConfig = () => {
                          if (membership.paymentStatus === 'paid') {
                            return { className: 'bg-green-100 text-green-800 border-green-200', label: 'Saldato' };
                          }
                          const isZeroFee = !membership.fee || parseFloat(membership.fee.toString()) === 0;
                          if (isZeroFee && expiryInfo.variant === 'default') {
                            return { className: 'bg-slate-100 text-slate-800 border-slate-300', label: 'IMPORTA DATI DATABASE' };
                          }
                          return { className: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Da Saldare' };
                        };
                        const badgeConfig = getPaymentBadgeConfig();

                        return (
                          <TableRow 
                            key={membership.id} 
                            data-testid={`membership-row-${membership.id}`}
                            className="cursor-pointer hover:bg-amber-50/50 transition-colors"
                            onClick={() => {
                                const mem = membersData?.members?.find(m => m.id === membership.memberId);
                                if (mem) {
                                    setSelectedMembershipMember(mem);
                                    setEditingMembership(null);
                                    setMembershipMemberSearch(`${mem.lastName} ${mem.firstName}`);
                                    setIsMembershipFormOpen(true);
                                }
                            }}
                          >
                            <TableCell className={cn("font-medium", tsMemberships.isSortedColumn("member") && "sorted-column-cell")}>
                              {getMemberName(membership)}
                            </TableCell>
                            <TableCell className={cn(tsMemberships.isSortedColumn("membershipNumber") && "sorted-column-cell")}>{membership.membershipNumber}</TableCell>
                            <TableCell className={cn("font-mono text-xs", tsMemberships.isSortedColumn("barcode") && "sorted-column-cell")}>{membership.barcode}</TableCell>
                            <TableCell className={cn(tsMemberships.isSortedColumn("type") && "sorted-column-cell")}>{membership.type || "-"}</TableCell>
                            <TableCell className={cn(tsMemberships.isSortedColumn("expiryDate") && "sorted-column-cell")}>{new Date(membership.expiryDate).toLocaleDateString('it-IT')}</TableCell>
                            <TableCell className={cn(tsMemberships.isSortedColumn("paymentDate") && "sorted-column-cell")}>
                              {membership.paymentDate ? new Date(membership.paymentDate).toLocaleDateString('it-IT') : "-"}
                            </TableCell>
                            <TableCell className={cn(tsMemberships.isSortedColumn("paymentStatus") && "sorted-column-cell")}>
                              <Badge variant="outline" className={badgeConfig.className}>
                                {badgeConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell className={cn(tsMemberships.isSortedColumn("status") && "sorted-column-cell")}>
                              <Badge variant={expiryInfo.variant}>
                                {expiryInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const codice = prompt("ATTENZIONE: Eliminazione riga.\nQuesta operazione rimuoverà definitivamente la tessera.\nInserisci il codice di sicurezza per confermare:");
                                  if (codice === "1234") {
                                    deleteMembershipMutation.mutate(membership.id);
                                  } else if (codice !== null) {
                                    toast({ title: "Errore", description: "Codice di sicurezza errato.", variant: "destructive" });
                                  }
                                }}
                                data-testid={`button-delete-membership-${membership.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-600 transition-colors" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-6">
          <div className="flex items-center justify-end">
            <Button
              onClick={() => {
                setEditingCertificate(null);
                setIsCertificateFormOpen(true);
              }}
              data-testid="button-add-certificate"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuovo Certificato
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca per cognome, nome o codice fiscale..."
                  value={certificateSearch}
                  onChange={(e) => setCertificateSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-certificates"
                />
              </div>
            </CardHeader>
            <CardContent>
              {certificatesLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !certificates || certificates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Nessun certificato trovato</p>
                  <p className="text-sm">Inizia aggiungendo il primo certificato</p>
                </div>
              ) : (() => {
                const filteredCertificatesRaw = certificates.filter((cert: any) => {
                  if (!certificateSearch || certificateSearch.length < 3) return true;
                  const searchLower = certificateSearch.toLowerCase();
                  const memberName = `${cert.memberFirstName || ""} ${cert.memberLastName || ""}`.toLowerCase();
                  const fiscalCode = cert.memberFiscalCode?.toLowerCase() || "";
                  return memberName.includes(searchLower) || fiscalCode.includes(searchLower);
                });
                const filteredCertificates = tsCertificates.sortItems(filteredCertificatesRaw, getCertificateSortValue);

                if (filteredCertificates.length === 0) {
                  return (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Nessun risultato trovato</p>
                      <p className="text-sm">Prova con un altro termine di ricerca</p>
                    </div>
                  );
                }

                return (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableTableHead sortKey="member" currentSort={tsCertificates.sortConfig} onSort={tsCertificates.handleSort}>Partecipante</SortableTableHead>
                        <SortableTableHead sortKey="doctor" currentSort={tsCertificates.sortConfig} onSort={tsCertificates.handleSort}>Medico</SortableTableHead>
                        <SortableTableHead sortKey="issueDate" currentSort={tsCertificates.sortConfig} onSort={tsCertificates.handleSort}>Data Rilascio</SortableTableHead>
                        <SortableTableHead sortKey="expiryDate" currentSort={tsCertificates.sortConfig} onSort={tsCertificates.handleSort}>Scadenza</SortableTableHead>
                        <SortableTableHead sortKey="status" currentSort={tsCertificates.sortConfig} onSort={tsCertificates.handleSort}>Stato</SortableTableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCertificates.map((cert) => {
                        const expiryInfo = getExpiryStatus(cert.expiryDate);
                        return (
                          <TableRow key={cert.id} data-testid={`certificate-row-${cert.id}`}>
                            <TableCell className={cn("font-medium", tsCertificates.isSortedColumn("member") && "sorted-column-cell")}>
                              {getMemberName(cert)}
                            </TableCell>
                            <TableCell className={cn(tsCertificates.isSortedColumn("doctor") && "sorted-column-cell")}>{cert.doctorName || "-"}</TableCell>
                            <TableCell className={cn(tsCertificates.isSortedColumn("issueDate") && "sorted-column-cell")}>{new Date(cert.issueDate).toLocaleDateString('it-IT')}</TableCell>
                            <TableCell className={cn(tsCertificates.isSortedColumn("expiryDate") && "sorted-column-cell")}>{new Date(cert.expiryDate).toLocaleDateString('it-IT')}</TableCell>
                            <TableCell className={cn(tsCertificates.isSortedColumn("status") && "sorted-column-cell")}>
                              <Badge variant={expiryInfo.variant}>
                                {expiryInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm("Sei sicuro di voler eliminare questo certificato?")) {
                                    // Delete mutation here
                                  }
                                }}
                                data-testid={`button-delete-certificate-${cert.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entity-cards" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative max-w-md flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca per cognome, nome o codice fiscale..."
                  value={entityCardSearch}
                  onChange={(e) => setEntityCardSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-entity-cards"
                />
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                  <SelectTrigger className="w-[180px] shrink-0">
                    <SelectValue placeholder="Tutti gli enti" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli enti</SelectItem>
                    {Array.from(new Set((entityCardMembers || []).map(m => m.entityCardType).filter(Boolean))).map(type => (
                      <SelectItem key={type as string} value={type as string}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2 shrink-0">
                  <Checkbox 
                    id="show-only-active" 
                    checked={showOnlyActive} 
                    onCheckedChange={(checked) => setShowOnlyActive(checked === true)} 
                  />
                  <Label htmlFor="show-only-active" className="cursor-pointer">Solo tessere attive</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {entityCardsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (() => {
                const allEntityCardMembers = entityCardMembers || [];
                const filteredEntityCardsRaw = allEntityCardMembers.filter(m => {
                  if (entityTypeFilter !== "all" && m.entityCardType !== entityTypeFilter) return false;
                  
                  if (showOnlyActive) {
                    const expiryInfo = m.entityCardExpiryDate ? getExpiryStatus(m.entityCardExpiryDate) : null;
                    if (!expiryInfo || expiryInfo.status !== "active") return false;
                  }

                  if (!entityCardSearch || entityCardSearch.length < 3) return true;
                  const searchLower = entityCardSearch.toLowerCase();
                  return (
                    m.firstName?.toLowerCase().includes(searchLower) ||
                    m.lastName?.toLowerCase().includes(searchLower) ||
                    m.fiscalCode?.toLowerCase().includes(searchLower)
                  );
                });
                const filteredEntityCards = tsEntityCards.sortItems(filteredEntityCardsRaw, getEntityCardSortValue);

                if (filteredEntityCards.length === 0) {
                  return (
                    <div className="text-center py-12 text-muted-foreground">
                      <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Nessuna tessera ente trovata</p>
                      <p className="text-sm">Le tessere ente vengono gestite nella scheda Anagrafica del partecipante</p>
                    </div>
                  );
                }

                return (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableTableHead sortKey="member" currentSort={tsEntityCards.sortConfig} onSort={tsEntityCards.handleSort}>Partecipante</SortableTableHead>
                        <SortableTableHead sortKey="type" currentSort={tsEntityCards.sortConfig} onSort={tsEntityCards.handleSort}>Tipo Ente</SortableTableHead>
                        <SortableTableHead sortKey="number" currentSort={tsEntityCards.sortConfig} onSort={tsEntityCards.handleSort}>Numero Tessera</SortableTableHead>
                        <SortableTableHead sortKey="issueDate" currentSort={tsEntityCards.sortConfig} onSort={tsEntityCards.handleSort}>Data Rilascio</SortableTableHead>
                        <SortableTableHead sortKey="expiryDate" currentSort={tsEntityCards.sortConfig} onSort={tsEntityCards.handleSort}>Scadenza</SortableTableHead>
                        <SortableTableHead sortKey="status" currentSort={tsEntityCards.sortConfig} onSort={tsEntityCards.handleSort}>Stato</SortableTableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntityCards.map((member) => {
                        const expiryInfo = member.entityCardExpiryDate
                          ? getExpiryStatus(member.entityCardExpiryDate)
                          : { status: "unknown", label: "N/D", variant: "secondary" as const };
                        return (
                          <TableRow key={member.id} data-testid={`entity-card-row-${member.id}`}>
                            <TableCell className={cn("font-medium", tsEntityCards.isSortedColumn("member") && "sorted-column-cell")}>
                              {member.lastName} {member.firstName}
                            </TableCell>
                            <TableCell className={cn(tsEntityCards.isSortedColumn("type") && "sorted-column-cell")}>
                              <Badge variant="outline">{member.entityCardType || "-"}</Badge>
                            </TableCell>
                            <TableCell className={cn("font-mono text-xs", tsEntityCards.isSortedColumn("number") && "sorted-column-cell")}>{member.entityCardNumber || "-"}</TableCell>
                            <TableCell className={cn(tsEntityCards.isSortedColumn("issueDate") && "sorted-column-cell")}>
                              {member.entityCardIssueDate
                                ? new Date(member.entityCardIssueDate).toLocaleDateString('it-IT')
                                : "-"}
                            </TableCell>
                            <TableCell className={cn(tsEntityCards.isSortedColumn("expiryDate") && "sorted-column-cell")}>
                              {member.entityCardExpiryDate
                                ? new Date(member.entityCardExpiryDate).toLocaleDateString('it-IT')
                                : "-"}
                            </TableCell>
                            <TableCell className={cn(tsEntityCards.isSortedColumn("status") && "sorted-column-cell")}>
                              <Badge variant={expiryInfo.variant}>
                                {expiryInfo.label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Membership Form Dialog */}
      <Dialog open={isMembershipFormOpen} onOpenChange={setIsMembershipFormOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nuova Tessera</DialogTitle>
            <DialogDescription>Inserisci i dettagli della tessera generica</DialogDescription>
          </DialogHeader>
          <form key={selectedMembershipMember?.id || 'new'} onSubmit={handleMembershipSubmit} className="space-y-4">
            {(() => {
              let tessereMeta: any = null;
              if (selectedMembershipMember && selectedMembershipMember.tessereMetadata) {
                try {
                  tessereMeta = typeof selectedMembershipMember.tessereMetadata === 'string'
                    ? JSON.parse(selectedMembershipMember.tessereMetadata)
                    : selectedMembershipMember.tessereMetadata;
                } catch (e) {
                  console.error("Failed parsing tessereMetadata", e);
                }
              }

              // Incorporate actual memberships DB logic
              let latestMembership = null;
              if (selectedMembershipMember && memberships) {
                latestMembership = memberships
                  .filter(m => m.memberId === selectedMembershipMember.id)
                  .sort((a, b) => new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime())[0];
              }

              let defMembershipNum = latestMembership?.membershipNumber || tessereMeta?.numero || "";
              let defExpiryDate = latestMembership?.expiryDate
                ? new Date(latestMembership.expiryDate).toISOString().split('T')[0]
                : tessereMeta?.dataScad || "";

              // Only auto-calculate a future date if we have absolutely NO previous expiry date context
              if (!defExpiryDate && selectedMembershipMember && !latestMembership) {
                const nextYear = new Date().getFullYear() + 1;
                const month = String(new Date().getMonth() + 1).padStart(2,'0');
                defExpiryDate = `${nextYear}-${month}-01`;
              }
              if (!defMembershipNum && selectedMembershipMember && !latestMembership) {
                defMembershipNum = `2526-${String(selectedMembershipMember.id).padStart(6, '0')}`;
              }

              const defFee = latestMembership?.fee || tessereMeta?.quota || "25";
              const defPaymentDate = latestMembership?.issueDate 
                  ? new Date(latestMembership.issueDate).toISOString().split('T')[0]
                  : tessereMeta?.pagamento || new Date().toISOString().split('T')[0];
              const defRenewal = latestMembership ? "rinnovo" : (tessereMeta?.numero ? "rinnovo" : "nuovo");
              const defBarcode = latestMembership?.barcode || (defMembershipNum ? `T${defMembershipNum.replace('-', '')}` : "");
              
              const safeIsoDate = (val: any) => {
                if (!val) return "";
                const d = new Date(val);
                return isNaN(d.getTime()) ? "" : d.toISOString().split('T')[0];
              };

              const defEntityNum = latestMembership?.entityCardNumber || tessereMeta?.tesseraEnte || selectedMembershipMember?.entityCardNumber || (latestMembership ? "Libertas" : "");
              const defEntityExpiry = safeIsoDate(latestMembership?.entityCardExpiryDate) 
                                        || safeIsoDate(tessereMeta?.scadenzaTesseraEnte) 
                                        || safeIsoDate(selectedMembershipMember?.entityCardExpiryDate);

              return (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-3">
                        Partecipante *
                        {selectedMembershipMember && (
                          <Badge 
                            variant={(defExpiryDate && new Date(defExpiryDate).setHours(0,0,0,0) >= new Date().setHours(0,0,0,0)) ? 'default' : 'secondary'} 
                            className={(defExpiryDate && new Date(defExpiryDate).setHours(0,0,0,0) >= new Date().setHours(0,0,0,0)) ? "bg-green-50 text-green-700 hover:bg-green-50 border-green-300 pointer-events-none shadow-sm" : "bg-red-50 text-red-600 hover:bg-red-50 border-red-300 pointer-events-none shadow-sm"}
                          >
                            {defExpiryDate ? ((new Date(defExpiryDate).setHours(0,0,0,0) >= new Date().setHours(0,0,0,0)) ? 'Attiva' : 'Scaduta') : 'Nessuna'}
                          </Badge>
                        )}
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsMembershipFormOpen(false);
                          setLocation("/?action=new");
                        }}
                        data-testid="button-new-member-membership"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Nuovo Partecipante
                      </Button>
                    </div>
                    <Popover open={membershipMemberOpen} onOpenChange={setMembershipMemberOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={membershipMemberOpen}
                          className="w-full justify-between"
                          data-testid="select-member"
                        >
                          {selectedMembershipMember
                            ? `${selectedMembershipMember.lastName} ${selectedMembershipMember.firstName}`
                            : "Cerca partecipante (min. 3 caratteri)..."
                          }
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[300px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Cerca per cognome, nome o codice fiscale..."
                            value={membershipMemberSearch}
                            onValueChange={setMembershipMemberSearch}
                            data-testid="input-search-member-membership"
                          />
                          <CommandList>
                            {membershipMemberSearch.length < 3 ? (
                              <CommandEmpty>Digita almeno 3 caratteri per cercare</CommandEmpty>
                            ) : !membershipSearchResults?.members?.length ? (
                              <CommandEmpty>Nessun partecipante trovato</CommandEmpty>
                            ) : (
                              <CommandGroup>
                                {membershipSearchResults.members.map((member) => (
                                  <CommandItem
                                    key={member.id}
                                    value={member.id.toString()}
                                    onSelect={() => {
                                      setSelectedMembershipMember(member);
                                      setMembershipMemberOpen(false);
                                    }}
                                    data-testid={`member-option-${member.id}`}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedMembershipMember?.id === member.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium">{member.lastName} {member.firstName}</span>
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

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2 flex flex-col justify-end pb-1 pr-4">
                      <div className="flex items-center gap-4">
                        <Label className="text-muted-foreground">Quota (€)</Label>
                        <Button 
                          type="button" 
                          variant="default"
                          className="bg-warning text-warning-foreground hover:bg-warning/90 h-8 font-bold"
                          onClick={(e) => {
                            e.preventDefault();
                            if (selectedMembershipMember) {
                              setIsMembershipFormOpen(false);
                              // Route to Maschera Input with action=payment trigger for instant SPA transition
                              setLocation(`/?memberId=${selectedMembershipMember.id}&action=payment`);
                            } else {
                              toast({ title: "Attenzione", description: "Seleziona prima un partecipante", variant: "destructive" });
                            }
                          }}
                        >
                          Paga
                        </Button>
                      </div>
                    </div>



                    <div className="space-y-2">
                       <Label>Pagamento Tessera</Label>
                       <Input
                         type="date"
                         value={defPaymentDate}
                         disabled
                         readOnly
                         className="bg-muted text-muted-foreground opacity-100"
                       />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="renewalType">Nuovo o Rinnovo</Label>
                      <Select name="renewalType" defaultValue={defRenewal === "nuovo" ? "nuovo" : "rinnovo"}>
                        <SelectTrigger id="renewalType" data-testid="select-renewal-type">
                          <SelectValue placeholder="Seleziona..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nuovo">Nuovo</SelectItem>
                          <SelectItem value="rinnovo">Rinnovo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Data Scad. Quota Tessera</Label>
                      <Input
                        type="date"
                        value={defExpiryDate}
                        disabled
                        readOnly
                        className="bg-muted text-muted-foreground opacity-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="membershipNumber">N. Tessera *</Label>
                      <Input
                        id="membershipNumber"
                        name="membershipNumber"
                        placeholder="Inserisci numero"
                        defaultValue={defMembershipNum}
                        required
                        data-testid="input-membershipNumber"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barcode">Barcode *</Label>
                      <Input
                        id="barcode"
                        name="barcode"
                        placeholder="Generato automaticamente"
                        defaultValue={defBarcode}
                        data-testid="input-barcode"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entityCardNumber">Tessera Ente</Label>
                      <Input
                        id="entityCardNumber"
                        name="entityCardNumber"
                        placeholder="Se provvisto..."
                        defaultValue={defEntityNum}
                        data-testid="input-entityCardNumber"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entityCardExpiryDate">Scadenza Tessera Ente</Label>
                      <Input
                        id="entityCardExpiryDate"
                        name="entityCardExpiryDate"
                        type="date"
                        defaultValue={defEntityExpiry}
                        data-testid="input-entityCardExpiryDate"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsMembershipFormOpen(false)}
                      data-testid="button-cancel"
                    >
                      Annulla
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMembershipMutation.isPending}
                      data-testid="button-submit-membership"
                    >
                      Crea Tessera
                    </Button>
                  </DialogFooter>
                </>
              );
            })()}
          </form>
        </DialogContent>
      </Dialog>

      {/* Medical Certificate Form Dialog */}
      <Dialog open={isCertificateFormOpen} onOpenChange={setIsCertificateFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuovo Certificato Medico</DialogTitle>
            <DialogDescription>Inserisci i dettagli del certificato</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCertificateSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Partecipante *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsCertificateFormOpen(false);
                    setLocation("/anagrafica?action=new");
                  }}
                  data-testid="button-new-member-certificate"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Nuovo Partecipante
                </Button>
              </div>
              <Popover open={certMemberOpen} onOpenChange={setCertMemberOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={certMemberOpen}
                    className="w-full justify-between"
                    data-testid="select-cert-member"
                  >
                    {selectedCertMember
                      ? `${selectedCertMember.lastName} ${selectedCertMember.firstName}`
                      : "Cerca partecipante (min. 3 caratteri)..."
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[300px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Cerca per cognome, nome o codice fiscale..."
                      value={certMemberSearch}
                      onValueChange={setCertMemberSearch}
                      data-testid="input-search-member-certificate"
                    />
                    <CommandList>
                      {certMemberSearch.length < 3 ? (
                        <CommandEmpty>Digita almeno 3 caratteri per cercare</CommandEmpty>
                      ) : !certSearchResults?.members?.length ? (
                        <CommandEmpty>Nessun partecipante trovato</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {certSearchResults.members.map((member) => (
                            <CommandItem
                              key={member.id}
                              value={member.id.toString()}
                              onSelect={() => {
                                setSelectedCertMember(member);
                                setCertMemberOpen(false);
                              }}
                              data-testid={`cert-member-option-${member.id}`}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedCertMember?.id === member.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{member.lastName} {member.firstName}</span>
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
                <Label htmlFor="cert-issueDate">Data Rilascio *</Label>
                <Input
                  id="cert-issueDate"
                  name="issueDate"
                  type="date"
                  required
                  data-testid="input-cert-issueDate"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cert-expiryDate">Data Scadenza *</Label>
                <Input
                  id="cert-expiryDate"
                  name="expiryDate"
                  type="date"
                  required
                  data-testid="input-cert-expiryDate"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctorName">Nome Medico</Label>
              <Input
                id="doctorName"
                name="doctorName"
                data-testid="input-doctorName"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cert-notes">Note</Label>
              <Textarea
                id="cert-notes"
                name="notes"
                rows={3}
                data-testid="input-cert-notes"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCertificateFormOpen(false)}
                data-testid="button-cert-cancel"
              >
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={createCertificateMutation.isPending}
                data-testid="button-submit-certificate"
              >
                Crea Certificato
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
