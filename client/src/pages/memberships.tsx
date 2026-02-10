import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, IdCard, FileText, Building2, Check, ChevronsUpDown, UserPlus, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Membership, InsertMembership, MedicalCertificate, InsertMedicalCertificate, Member } from "@shared/schema";

export default function Memberships() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [membershipSearch, setMembershipSearch] = useState("");
  const [entityCardSearch, setEntityCardSearch] = useState("");
  const [certificateSearch, setCertificateSearch] = useState("");
  const [isMembershipFormOpen, setIsMembershipFormOpen] = useState(false);
  const [isCertificateFormOpen, setIsCertificateFormOpen] = useState(false);
  const [editingMembership, setEditingMembership] = useState<Membership | null>(null);
  const [editingCertificate, setEditingCertificate] = useState<MedicalCertificate | null>(null);
  
  const [membershipMemberOpen, setMembershipMemberOpen] = useState(false);
  const [membershipMemberSearch, setMembershipMemberSearch] = useState("");
  const [selectedMembershipMember, setSelectedMembershipMember] = useState<Member | null>(null);
  
  const [certMemberOpen, setCertMemberOpen] = useState(false);
  const [certMemberSearch, setCertMemberSearch] = useState("");
  const [selectedCertMember, setSelectedCertMember] = useState<Member | null>(null);

  const { sortConfig: sortConfig1, handleSort: handleSort1, sortItems: sortItems1, isSortedColumn: isSortedColumn1 } = useSortableTable<Membership>("member");
  const { sortConfig: sortConfig2, handleSort: handleSort2, sortItems: sortItems2, isSortedColumn: isSortedColumn2 } = useSortableTable<MedicalCertificate>("member");
  const { sortConfig: sortConfig3, handleSort: handleSort3, sortItems: sortItems3, isSortedColumn: isSortedColumn3 } = useSortableTable<Member>("member");

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
      issueDate: formData.get("issueDate") as string,
      expiryDate: formData.get("expiryDate") as string,
      type: formData.get("type") as string || null,
      fee: formData.get("fee") ? formData.get("fee") as string : null,
      status: "active",
    };

    createMembershipMutation.mutate(data);
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
      issueDate: formData.get("issueDate") as string,
      expiryDate: formData.get("expiryDate") as string,
      doctorName: formData.get("doctorName") as string || null,
      notes: formData.get("notes") as string || null,
      status: "valid",
    };

    createCertificateMutation.mutate(data);
  };

  const getMemberName = (item: any) => {
    if (item.memberFirstName && item.memberLastName) {
      return `${item.memberFirstName} ${item.memberLastName}`;
    }
    if (!item.memberId) return "-";
    const member = members?.find(m => m.id === item.memberId);
    return member ? `${member.firstName} ${member.lastName}` : "Sconosciuto";
  };

  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: "expired", label: "Scaduto", variant: "outline" as const };
    if (daysUntilExpiry <= 7) return { status: "expiring", label: "In Scadenza", variant: "outline" as const };
    return { status: "active", label: "Attivo", variant: "outline" as const };
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="icon-gold-bg rounded-md h-8 w-8 flex-shrink-0" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 text-white" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Tessere & Certificati Medici</h1>
            <p className="text-muted-foreground text-sm">Gestisci tessere associative e certificati medici</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="memberships" className="space-y-6">
        <TabsList>
          <TabsTrigger value="memberships" data-testid="tab-memberships">
            <IdCard className="w-4 h-4 mr-2" />
            Tessere Associative
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
              className="gold-3d-button"
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
                  placeholder="Cerca per nome, cognome o codice fiscale..."
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
                const filteredMemberships = memberships.filter((membership: any) => {
                  if (!membershipSearch || membershipSearch.length < 3) return true;
                  const searchLower = membershipSearch.toLowerCase();
                  const memberName = `${membership.memberFirstName || ""} ${membership.memberLastName || ""}`.toLowerCase();
                  const fiscalCode = membership.memberFiscalCode?.toLowerCase() || "";
                  return memberName.includes(searchLower) || fiscalCode.includes(searchLower);
                });

                if (filteredMemberships.length === 0) {
                  return (
                    <div className="text-center py-12 text-muted-foreground">
                      <IdCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Nessun risultato trovato</p>
                      <p className="text-sm">Prova con un altro termine di ricerca</p>
                    </div>
                  );
                }

                const getSortValue1 = (item: Membership, key: string) => {
                  switch (key) {
                    case "member": return getMemberName(item);
                    case "cardNumber": return item.membershipNumber;
                    case "barcode": return item.barcode;
                    case "type": return item.type || "";
                    case "expiry": return item.expiryDate;
                    case "status": return getExpiryStatus(item.expiryDate).label;
                    default: return "";
                  }
                };
                const sortedMemberships = sortItems1(filteredMemberships, getSortValue1);

                return (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead sortKey="member" currentSort={sortConfig1} onSort={handleSort1}>Partecipante</SortableTableHead>
                      <SortableTableHead sortKey="cardNumber" currentSort={sortConfig1} onSort={handleSort1}>N. Tessera</SortableTableHead>
                      <SortableTableHead sortKey="barcode" currentSort={sortConfig1} onSort={handleSort1}>Barcode</SortableTableHead>
                      <SortableTableHead sortKey="type" currentSort={sortConfig1} onSort={handleSort1}>Tipo</SortableTableHead>
                      <SortableTableHead sortKey="expiry" currentSort={sortConfig1} onSort={handleSort1}>Scadenza</SortableTableHead>
                      <SortableTableHead sortKey="status" currentSort={sortConfig1} onSort={handleSort1}>Stato</SortableTableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedMemberships.map((membership) => {
                      const expiryInfo = getExpiryStatus(membership.expiryDate);
                      return (
                        <TableRow key={membership.id} data-testid={`membership-row-${membership.id}`}>
                          <TableCell className={cn("font-medium", isSortedColumn1("member") && "sorted-column-cell")}>
                            {getMemberName(membership)}
                          </TableCell>
                          <TableCell className={isSortedColumn1("number") ? "sorted-column-cell" : undefined}>{membership.membershipNumber}</TableCell>
                          <TableCell className={cn("font-mono text-xs", isSortedColumn1("barcode") && "sorted-column-cell")}>{membership.barcode}</TableCell>
                          <TableCell className={isSortedColumn1("type") ? "sorted-column-cell" : undefined}>{membership.type || "-"}</TableCell>
                          <TableCell className={isSortedColumn1("expiry") ? "sorted-column-cell" : undefined}>{new Date(membership.expiryDate).toLocaleDateString('it-IT')}</TableCell>
                          <TableCell className={isSortedColumn1("status") ? "sorted-column-cell" : undefined}>
                            <Badge variant={expiryInfo.variant} className="bg-muted/50 border-amber-500/50 text-foreground">
                              {expiryInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Sei sicuro di voler eliminare questa tessera?")) {
                                  // Delete mutation here
                                }
                              }}
                              data-testid={`button-delete-membership-${membership.id}`}
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

        <TabsContent value="certificates" className="space-y-6">
          <div className="flex items-center justify-end">
            <Button 
              className="gold-3d-button"
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
                  placeholder="Cerca per nome, cognome o codice fiscale..."
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
                const filteredCertificates = certificates.filter((cert: any) => {
                  if (!certificateSearch || certificateSearch.length < 3) return true;
                  const searchLower = certificateSearch.toLowerCase();
                  const memberName = `${cert.memberFirstName || ""} ${cert.memberLastName || ""}`.toLowerCase();
                  const fiscalCode = cert.memberFiscalCode?.toLowerCase() || "";
                  return memberName.includes(searchLower) || fiscalCode.includes(searchLower);
                });

                if (filteredCertificates.length === 0) {
                  return (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Nessun risultato trovato</p>
                      <p className="text-sm">Prova con un altro termine di ricerca</p>
                    </div>
                  );
                }

                const getSortValue2 = (item: MedicalCertificate, key: string) => {
                  switch (key) {
                    case "member": return getMemberName(item);
                    case "doctor": return item.doctorName || "";
                    case "issueDate": return item.issueDate;
                    case "expiry": return item.expiryDate;
                    case "status": return getExpiryStatus(item.expiryDate).label;
                    default: return "";
                  }
                };
                const sortedCertificates = sortItems2(filteredCertificates, getSortValue2);

                return (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead sortKey="member" currentSort={sortConfig2} onSort={handleSort2}>Partecipante</SortableTableHead>
                      <SortableTableHead sortKey="doctor" currentSort={sortConfig2} onSort={handleSort2}>Medico</SortableTableHead>
                      <SortableTableHead sortKey="issueDate" currentSort={sortConfig2} onSort={handleSort2}>Data Rilascio</SortableTableHead>
                      <SortableTableHead sortKey="expiry" currentSort={sortConfig2} onSort={handleSort2}>Scadenza</SortableTableHead>
                      <SortableTableHead sortKey="status" currentSort={sortConfig2} onSort={handleSort2}>Stato</SortableTableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCertificates.map((cert) => {
                      const expiryInfo = getExpiryStatus(cert.expiryDate);
                      return (
                        <TableRow key={cert.id} data-testid={`certificate-row-${cert.id}`}>
                          <TableCell className={cn("font-medium", isSortedColumn2("member") && "sorted-column-cell")}>
                            {getMemberName(cert)}
                          </TableCell>
                          <TableCell className={isSortedColumn2("doctor") ? "sorted-column-cell" : undefined}>{cert.doctorName || "-"}</TableCell>
                          <TableCell className={isSortedColumn2("issueDate") ? "sorted-column-cell" : undefined}>{new Date(cert.issueDate).toLocaleDateString('it-IT')}</TableCell>
                          <TableCell className={isSortedColumn2("expiry") ? "sorted-column-cell" : undefined}>{new Date(cert.expiryDate).toLocaleDateString('it-IT')}</TableCell>
                          <TableCell className={isSortedColumn2("status") ? "sorted-column-cell" : undefined}>
                            <Badge variant={expiryInfo.variant} className="bg-muted/50 border-amber-500/50 text-foreground">
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
            <CardHeader>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca per nome, cognome o codice fiscale..."
                  value={entityCardSearch}
                  onChange={(e) => setEntityCardSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-entity-cards"
                />
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
                const filteredEntityCards = allEntityCardMembers.filter(m => {
                  if (!entityCardSearch || entityCardSearch.length < 3) return true;
                  const searchLower = entityCardSearch.toLowerCase();
                  return (
                    m.firstName?.toLowerCase().includes(searchLower) ||
                    m.lastName?.toLowerCase().includes(searchLower) ||
                    m.fiscalCode?.toLowerCase().includes(searchLower)
                  );
                });

                if (filteredEntityCards.length === 0) {
                  return (
                    <div className="text-center py-12 text-muted-foreground">
                      <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Nessuna tessera ente trovata</p>
                      <p className="text-sm">Le tessere ente vengono gestite nella scheda Anagrafica del partecipante</p>
                    </div>
                  );
                }

                const getSortValue3 = (item: Member, key: string) => {
                  switch (key) {
                    case "member": return `${item.firstName} ${item.lastName}`;
                    case "entityType": return item.entityCardType || "";
                    case "cardNumber": return item.entityCardNumber || "";
                    case "issueDate": return item.entityCardIssueDate || "";
                    case "expiry": return item.entityCardExpiryDate || "";
                    case "status": return item.entityCardExpiryDate ? getExpiryStatus(item.entityCardExpiryDate).label : "N/D";
                    default: return "";
                  }
                };
                const sortedEntityCards = sortItems3(filteredEntityCards, getSortValue3);

                return (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableTableHead sortKey="member" currentSort={sortConfig3} onSort={handleSort3}>Partecipante</SortableTableHead>
                        <SortableTableHead sortKey="entityType" currentSort={sortConfig3} onSort={handleSort3}>Tipo Ente</SortableTableHead>
                        <SortableTableHead sortKey="cardNumber" currentSort={sortConfig3} onSort={handleSort3}>Numero Tessera</SortableTableHead>
                        <SortableTableHead sortKey="issueDate" currentSort={sortConfig3} onSort={handleSort3}>Data Rilascio</SortableTableHead>
                        <SortableTableHead sortKey="expiry" currentSort={sortConfig3} onSort={handleSort3}>Scadenza</SortableTableHead>
                        <SortableTableHead sortKey="status" currentSort={sortConfig3} onSort={handleSort3}>Stato</SortableTableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedEntityCards.map((member) => {
                        const expiryInfo = member.entityCardExpiryDate 
                          ? getExpiryStatus(member.entityCardExpiryDate) 
                          : { status: "unknown", label: "N/D", variant: "secondary" as const };
                        return (
                          <TableRow key={member.id} data-testid={`entity-card-row-${member.id}`}>
                            <TableCell className={cn("font-medium", isSortedColumn3("member") && "sorted-column-cell")}>
                              {member.firstName} {member.lastName}
                            </TableCell>
                            <TableCell className={isSortedColumn3("type") ? "sorted-column-cell" : undefined}>
                              <Badge variant="outline">{member.entityCardType || "-"}</Badge>
                            </TableCell>
                            <TableCell className={cn("font-mono text-xs", isSortedColumn3("number") && "sorted-column-cell")}>{member.entityCardNumber || "-"}</TableCell>
                            <TableCell className={isSortedColumn3("issueDate") ? "sorted-column-cell" : undefined}>
                              {member.entityCardIssueDate 
                                ? new Date(member.entityCardIssueDate).toLocaleDateString('it-IT') 
                                : "-"}
                            </TableCell>
                            <TableCell className={isSortedColumn3("expiry") ? "sorted-column-cell" : undefined}>
                              {member.entityCardExpiryDate 
                                ? new Date(member.entityCardExpiryDate).toLocaleDateString('it-IT') 
                                : "-"}
                            </TableCell>
                            <TableCell className={isSortedColumn3("status") ? "sorted-column-cell" : undefined}>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuova Tessera Associativa</DialogTitle>
            <DialogDescription>Inserisci i dettagli della tessera</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMembershipSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Partecipante *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsMembershipFormOpen(false);
                    setLocation("/anagrafica?action=new");
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
                      ? `${selectedMembershipMember.firstName} ${selectedMembershipMember.lastName}`
                      : "Cerca partecipante (min. 3 caratteri)..."
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Cerca per nome, cognome o codice fiscale..." 
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
                <Label htmlFor="membershipNumber">Numero Tessera *</Label>
                <Input
                  id="membershipNumber"
                  name="membershipNumber"
                  required
                  data-testid="input-membershipNumber"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode *</Label>
                <Input
                  id="barcode"
                  name="barcode"
                  required
                  placeholder="Generato automaticamente se lasciato vuoto"
                  data-testid="input-barcode"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issueDate">Data Rilascio *</Label>
                <Input
                  id="issueDate"
                  name="issueDate"
                  type="date"
                  required
                  data-testid="input-issueDate"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">Data Scadenza *</Label>
                <Input
                  id="expiryDate"
                  name="expiryDate"
                  type="date"
                  required
                  data-testid="input-expiryDate"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo Tessera</Label>
                <Select name="type">
                  <SelectTrigger data-testid="select-type">
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annuale</SelectItem>
                    <SelectItem value="monthly">Mensile</SelectItem>
                    <SelectItem value="seasonal">Stagionale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fee">Quota (€)</Label>
                <Input
                  id="fee"
                  name="fee"
                  type="number"
                  step="0.01"
                  min="0"
                  data-testid="input-fee"
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
                className="gold-3d-button"
                disabled={createMembershipMutation.isPending}
                data-testid="button-submit-membership"
              >
                Crea Tessera
              </Button>
            </DialogFooter>
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
                      ? `${selectedCertMember.firstName} ${selectedCertMember.lastName}`
                      : "Cerca partecipante (min. 3 caratteri)..."
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Cerca per nome, cognome o codice fiscale..." 
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
                className="gold-3d-button"
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
