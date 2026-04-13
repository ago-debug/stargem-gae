import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ScanBarcode,
  CheckCircle,
  XCircle,
  Search,
  User,
  AlertTriangle,
  CreditCard,
  Calendar,
  GraduationCap,
  FileWarning,
  Clock,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Edit
} from "lucide-react";
import { useLocation } from "wouter";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { cn } from "@/lib/utils";
import type {
  AccessLog,
  InsertAccessLog,
  Member,
  Enrollment,
  
  Payment,
  Membership,
  MedicalCertificate,
  Course
} from "@shared/schema";

interface MemberSearchResult {
  member: Member;
  enrollments: Enrollment[];
  workshopEnrollments: any[];
  payments: Payment[];
  memberships: Membership[];
  medicalCertificates: MedicalCertificate[];
  anomalies: Anomaly[];
}

interface Anomaly {
  type: 'warning' | 'error';
  category: 'membership' | 'payment' | 'medical' | 'enrollment';
  message: string;
}

export default function AccessControl() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null);
  const [activeTab, setActiveTab] = useState("search");

  const { data: recentAccesses, isLoading: accessesLoading } = useQuery<AccessLog[]>({
    queryKey: ["/api/access-logs"],
  });

  const { data: searchMembersData, isLoading: searchLoading } = useQuery<{ members: Member[], total: number }>({
    queryKey: ["/api/members", "search", searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/members?search=${encodeURIComponent(searchQuery)}&pageSize=20`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
    enabled: searchQuery.length >= 3,
  });
  const filteredMembers = searchMembersData?.members?.slice(0, 10) || [];

  const { data: enrollments } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments?type=corsi"],
  });

  const { data: workshopEnrollments } = useQuery<any[]>({
    queryKey: ["/api/workshop-enrollments"],
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const { data: membershipsData } = useQuery<Membership[]>({
    queryKey: ["/api/memberships"],
  });

  const { data: medicalCerts } = useQuery<MedicalCertificate[]>({
    queryKey: ["/api/medical-certificates"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // @ts-ignore // TODO: STI-cleanup
  const { data: workshops } = useQuery<Workshop[]>({
    queryKey: ["/api/workshops"],
  });

  const getMemberDetails = (member: Member): MemberSearchResult => {
    const memberEnrollments = enrollments?.filter(e => e.memberId === member.id) || [];
    const members = workshopEnrollments?.filter(e => e.memberId === member.id) || [];
    const memberPayments = payments?.filter(p => p.memberId === member.id) || [];
    const memberMemberships = membershipsData?.filter(m => m.memberId === member.id) || [];
    const memberMedicalCerts = medicalCerts?.filter(c => c.memberId === member.id) || [];

    const anomalies: Anomaly[] = [];
    const today = new Date();

    const activeMembership = memberMemberships.find(m =>
      m.expiryDate && new Date(m.expiryDate) >= today
    );

    if (!activeMembership) {
      const expiredMembership = memberMemberships.find(m =>
        m.expiryDate && new Date(m.expiryDate) < today
      );
      if (expiredMembership) {
        anomalies.push({
          type: 'error',
          category: 'membership',
          message: `Tessera scaduta il ${new Date(expiredMembership.expiryDate!).toLocaleDateString('it-IT')}`
        });
      } else if (memberMemberships.length === 0) {
        anomalies.push({
          type: 'warning',
          category: 'membership',
          message: 'Nessuna tessera associata'
        });
      }
    } else {
      const daysUntilExpiry = Math.ceil((new Date(activeMembership.expiryDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 30) {
        anomalies.push({
          type: 'warning',
          category: 'membership',
          message: `Tessera in scadenza tra ${daysUntilExpiry} giorni`
        });
      }
    }

    const validMedicalCert = memberMedicalCerts.find(c =>
      c.expiryDate && new Date(c.expiryDate) >= today
    );

    if (!validMedicalCert) {
      const expiredCert = memberMedicalCerts.find(c =>
        c.expiryDate && new Date(c.expiryDate) < today
      );
      if (expiredCert) {
        anomalies.push({
          type: 'error',
          category: 'medical',
          message: `Certificato medico scaduto il ${new Date(expiredCert.expiryDate!).toLocaleDateString('it-IT')}`
        });
      } else if (memberMedicalCerts.length === 0) {
        anomalies.push({
          type: 'warning',
          category: 'medical',
          message: 'Nessun certificato medico registrato'
        });
      }
    } else {
      const daysUntilExpiry = Math.ceil((new Date(validMedicalCert.expiryDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 30) {
        anomalies.push({
          type: 'warning',
          category: 'medical',
          message: `Certificato medico in scadenza tra ${daysUntilExpiry} giorni`
        });
      }
    }

    const unpaidPayments = memberPayments.filter(p => p.status !== 'paid' && p.status !== 'completed');
    if (unpaidPayments.length > 0) {
      const totalUnpaid = unpaidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      anomalies.push({
        type: 'error',
        category: 'payment',
        message: `${unpaidPayments.length} pagamento/i in sospeso per €${totalUnpaid.toFixed(2)}`
      });
    }

    return {
      member,
      enrollments: memberEnrollments,
      workshopEnrollments: members,
      payments: memberPayments,
      memberships: memberMemberships,
      medicalCertificates: memberMedicalCerts,
      anomalies
    };
  };

  const handleSelectMember = (member: Member) => {
    const details = getMemberDetails(member);
    setSelectedMember(details);
    setSearchQuery("");
  };

  const scanMutation = useMutation({
    mutationFn: async (data: { barcode?: string; memberId?: number; courseId?: number; workshopId?: number }) => {
      const courses_ = courses || [];
      const workshops_ = workshops || [];
      const courseName = data.courseId ? courses_.find(c => c.id === data.courseId)?.name : undefined;
      const workshopName = data.workshopId ? workshops_.find(w => w.id === data.workshopId)?.name : undefined;

      let notes = '';
      if (courseName) notes = `Corso: ${courseName}`;
      if (workshopName) notes = `Workshop: ${workshopName}`;

      const accessData: InsertAccessLog = {
        barcode: data.barcode || `MANUAL-${data.memberId}`,
        memberId: data.memberId,
        accessType: "entry",
        notes: notes || undefined,
      };
      return await apiRequest("POST", "/api/access-logs", accessData);
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/access-logs"] });
      toast({
        title: "Accesso Registrato",
        description: response.memberName ? `Registrato accesso per ${response.memberName}` : "Accesso registrato con successo",
      });
      setBarcodeInput("");
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
      setBarcodeInput("");
    },
  });

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      scanMutation.mutate({ barcode: barcodeInput.trim() });
    }
  };

  const handleRegisterAccess = (courseId?: number, workshopId?: number) => {
    if (!selectedMember) return;
    scanMutation.mutate({
      memberId: selectedMember.member.id,
      courseId,
      workshopId
    });
  };

  const getCourseName = (courseId: number) => {
    return courses?.find(c => c.id === courseId)?.name || `Corso #${courseId}`;
  };

  const getWorkshopName = (workshopId: number) => {
    return workshops?.find(w => w.id === workshopId)?.name || `Workshop #${workshopId}`;
  };

  const hasErrors = selectedMember?.anomalies.some(a => a.type === 'error');
  const hasWarnings = selectedMember?.anomalies.some(a => a.type === 'warning');

  const { sortConfig, handleSort, sortItems, isSortedColumn } = useSortableTable<AccessLog>("accessTime");

  const getSortValue = (log: AccessLog, key: string) => {
    switch (key) {
      case "accessTime": return log.accessTime;
      case "name": return `${(log as any).memberLastName || ''} ${(log as any).memberFirstName || ''}`.trim();
      case "barcode": return log.barcode;
      case "type": return log.accessType;
      case "status": return log.membershipStatus;
      case "notes": return log.notes;
      default: return null;
    }
  };

  const sortedAccessLogs = sortItems(recentAccesses || [], getSortValue);

  return (
    <div className="p-6 md:p-8 space-y-6 mx-auto">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Controllo Accessi</h1>
        <p className="text-muted-foreground">Registra accessi tramite barcode o ricerca anagrafica</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="search" data-testid="tab-search">
            <Search className="w-4 h-4 mr-2" />
            Ricerca Anagrafica
          </TabsTrigger>
          <TabsTrigger value="barcode" data-testid="tab-barcode">
            <ScanBarcode className="w-4 h-4 mr-2" />
            Scanner Barcode
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Cerca Partecipante
                </CardTitle>
                <CardDescription>
                  Digita almeno 3 caratteri per cercare
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cognome, nome o codice fiscale..."
                    className="pl-10"
                    data-testid="input-member-search"
                  />
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>

                {searchQuery.length > 0 && searchQuery.length < 3 && (
                  <p className="text-sm text-muted-foreground">
                    Digita ancora {3 - searchQuery.length} caratteri...
                  </p>
                )}

                {filteredMembers.length > 0 && (
                  <ScrollArea className="h-[400px] border rounded-md">
                    <div className="p-2 space-y-1">
                      {filteredMembers.map((member) => {
                        const details = getMemberDetails(member);
                        const hasIssues = details.anomalies.some(a => a.type === 'error');

                        return (
                          <button
                            key={member.id}
                            onClick={() => handleSelectMember(member)}
                            className={`w-full text-left p-3 rounded-md hover-elevate ${selectedMember?.member.id === member.id
                              ? 'bg-primary/10 border border-primary/20'
                              : ''
                              }`}
                            data-testid={`member-result-${member.id}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {member.lastName} {member.firstName}
                                </p>
                                {member.fiscalCode && (
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {member.fiscalCode}
                                  </p>
                                )}
                              </div>
                              {hasIssues && (
                                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}

                {searchQuery.length >= 3 && searchLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                    <p>Ricerca in corso...</p>
                  </div>
                )}

                {searchQuery.length >= 3 && !searchLoading && filteredMembers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Nessun partecipante trovato</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              {selectedMember ? (
                <>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <User className="w-5 h-5" />
                          {selectedMember.member.lastName} {selectedMember.member.firstName}
                        </CardTitle>
                        {selectedMember.member.fiscalCode && (
                          <p className="text-sm text-muted-foreground font-mono mt-1">
                            CF: {selectedMember.member.fiscalCode}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {hasErrors ? (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            Anomalie
                          </Badge>
                        ) : hasWarnings ? (
                          <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            <AlertTriangle className="w-3 h-3" />
                            Avvisi
                          </Badge>
                        ) : (
                          <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <ShieldCheck className="w-3 h-3" />
                            Regolare
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`${window.location.pathname}?editMemberId=${selectedMember.member.id}`)}
                          className="flex items-center gap-1 border-primary/20 hover:bg-primary/5 text-primary"
                        >
                          <Edit className="w-3 h-3" />
                          Modifica
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {selectedMember.anomalies.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Segnalazioni
                        </h4>
                        <div className="space-y-2">
                          {selectedMember.anomalies.map((anomaly, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-md border ${anomaly.type === 'error'
                                ? 'bg-destructive/10 border-destructive/20 text-destructive'
                                : 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200'
                                }`}
                              data-testid={`anomaly-${idx}`}
                            >
                              <div className="flex items-center gap-2">
                                {anomaly.type === 'error' ? (
                                  <XCircle className="w-4 h-4 flex-shrink-0" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                )}
                                <span className="text-sm">{anomaly.message}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Dati Anagrafici
                        </h4>
                        <div className="text-sm space-y-2">
                          {selectedMember.member.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="w-4 h-4" />
                              {selectedMember.member.phone}
                            </div>
                          )}
                          {selectedMember.member.email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              {selectedMember.member.email}
                            </div>
                          )}
                          {selectedMember.member.city && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              {selectedMember.member.city}
                              {selectedMember.member.province && ` (${selectedMember.member.province})`}
                            </div>
                          )}
                          {selectedMember.member.dateOfBirth && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              Nato/a il {new Date(selectedMember.member.dateOfBirth).toLocaleDateString('it-IT')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Tessere e Pagamenti
                        </h4>
                        <div className="text-sm space-y-2">
                          {selectedMember.memberships.length > 0 ? (
                            selectedMember.memberships.slice(0, 2).map((m, idx) => {
                              const isExpired = m.expiryDate && new Date(m.expiryDate) < new Date();
                              return (
                                <div key={idx} className="flex items-center gap-2">
                                  <Badge variant={isExpired ? "destructive" : "default"} className="text-xs">
                                    {m.membershipNumber}
                                  </Badge>
                                  {m.expiryDate && (
                                    <span className={`text-xs ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
                                      Scade: {new Date(m.expiryDate).toLocaleDateString('it-IT')}
                                    </span>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-muted-foreground">Nessuna tessera</p>
                          )}

                          <div className="pt-2">
                            <p className="text-muted-foreground">
                              Pagamenti: {selectedMember.payments.filter(p => p.status === 'paid' || p.status === 'completed').length} completati
                              {selectedMember.payments.filter(p => p.status === 'pending').length > 0 && (
                                <span className="text-destructive">
                                  , {selectedMember.payments.filter(p => p.status !== 'paid' && p.status !== 'completed').length} in sospeso
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Corsi Iscritti ({selectedMember.enrollments.length})
                      </h4>
                      {selectedMember.enrollments.length > 0 ? (
                        <div className="grid gap-2">
                          {selectedMember.enrollments.map((enrollment) => (
                            <div
                              key={enrollment.id}
                              className="flex items-center justify-between p-3 border rounded-md"
                            >
                              <div>
                                <p className="font-medium">{getCourseName(enrollment.courseId)}</p>
                                <p className="text-xs text-muted-foreground">
                                  Iscritto il {enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleDateString('it-IT') : '-'}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleRegisterAccess(enrollment.courseId)}
                                disabled={scanMutation.isPending}
                                data-testid={`register-course-${enrollment.courseId}`}
                              >
                                <Clock className="w-4 h-4 mr-1" />
                                Registra
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nessun corso iscritto</p>
                      )}
                    </div>

                    {selectedMember.workshopEnrollments.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Workshop Iscritti ({selectedMember.workshopEnrollments.length})
                          </h4>
                          <div className="grid gap-2">
                            {selectedMember.workshopEnrollments.map((enrollment) => (
                              <div
                                key={enrollment.id}
                                className="flex items-center justify-between p-3 border rounded-md"
                              >
                                <div>
                                  <p className="font-medium">{getWorkshopName(enrollment.workshopId)}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Iscritto il {enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleDateString('it-IT') : '-'}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleRegisterAccess(undefined, enrollment.workshopId)}
                                  disabled={scanMutation.isPending}
                                  data-testid={`register-workshop-${enrollment.workshopId}`}
                                >
                                  <Clock className="w-4 h-4 mr-1" />
                                  Registra
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleRegisterAccess()}
                        disabled={scanMutation.isPending}
                        className="min-w-[200px]"
                        data-testid="button-register-general-access"
                      >
                        {scanMutation.isPending ? (
                          "Registrazione..."
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Registra Accesso Generico
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center min-h-[500px]">
                  <div className="text-center text-muted-foreground">
                    <User className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">Seleziona un partecipante</p>
                    <p className="text-sm">Cerca per cognome, nome o codice fiscale</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="barcode" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScanBarcode className="w-5 h-5" />
                  Scanner Barcode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleScan} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Scansiona o Inserisci Barcode</Label>
                    <Input
                      id="barcode"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="Scansiona barcode tessera..."
                      autoFocus
                      data-testid="input-barcode-scan"
                      className="text-lg h-12"
                    />
                    <p className="text-xs text-muted-foreground">
                      Posiziona il cursore nel campo e scansiona il barcode, oppure inseriscilo manualmente
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!barcodeInput.trim() || scanMutation.isPending}
                    data-testid="button-scan"
                  >
                    {scanMutation.isPending ? "Verifica in corso..." : "Verifica Accesso"}
                  </Button>
                </form>

                <div className="mt-6 p-6 border rounded-lg bg-muted/30 min-h-[200px] flex items-center justify-center">
                  {scanMutation.isPending ? (
                    <div className="text-center">
                      <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                      <p className="text-muted-foreground">Verifica in corso...</p>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <ScanBarcode className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p>In attesa di scansione</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistiche Oggi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-foreground">
                      {recentAccesses?.filter(a => {
                        const today = new Date().toDateString();
                        return new Date(a.accessTime).toDateString() === today;
                      }).length || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Accessi Totali</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-foreground">
                      {recentAccesses?.filter(a => {
                        const today = new Date().toDateString();
                        return new Date(a.accessTime).toDateString() === today && a.membershipStatus === 'active';
                      }).length || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Accessi Validi</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Ultimi Accessi</h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {recentAccesses?.slice(0, 10).map((access, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-md hover-elevate"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {new Date(access.accessTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {access.barcode}
                          </p>
                        </div>
                        {access.membershipStatus === 'active' ? (
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive flex-shrink-0 ml-2" />
                        )}
                      </div>
                    ))}
                    {(!recentAccesses || recentAccesses.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nessun accesso registrato oggi
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Registro Accessi</CardTitle>
        </CardHeader>
        <CardContent>
          {accessesLoading ? (
            <p className="text-center py-8 text-muted-foreground">Caricamento...</p>
          ) : !recentAccesses || recentAccesses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium mb-2">Nessun accesso registrato</p>
              <p className="text-sm">Gli accessi verranno visualizzati qui</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead sortKey="accessTime" currentSort={sortConfig} onSort={handleSort}>Data/Ora</SortableTableHead>
                  <SortableTableHead sortKey="name" currentSort={sortConfig} onSort={handleSort}>Cognome e Nome</SortableTableHead>
                  <SortableTableHead sortKey="barcode" currentSort={sortConfig} onSort={handleSort}>Barcode</SortableTableHead>
                  <SortableTableHead sortKey="type" currentSort={sortConfig} onSort={handleSort}>Tipo</SortableTableHead>
                  <SortableTableHead sortKey="status" currentSort={sortConfig} onSort={handleSort}>Stato Tessera</SortableTableHead>
                  <SortableTableHead sortKey="notes" currentSort={sortConfig} onSort={handleSort}>Note</SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAccessLogs.map((access, index) => (
                  <TableRow key={index} data-testid={`access-log-${index}`}>
                    <TableCell className={cn(isSortedColumn("accessTime") && "sorted-column-cell")}>
                      {new Date(access.accessTime).toLocaleString('it-IT')}
                    </TableCell>
                    <TableCell className={cn("font-medium", isSortedColumn("name") && "sorted-column-cell")}>
                      {(access as any).memberFirstName || (access as any).memberLastName
                        ? `${(access as any).memberLastName || ''} ${(access as any).memberFirstName || ''}`.trim()
                        : <span className="text-muted-foreground">-</span>
                      }
                    </TableCell>
                    <TableCell className={cn("font-mono text-xs", isSortedColumn("barcode") && "sorted-column-cell")}>{access.barcode}</TableCell>
                    <TableCell className={cn("capitalize", isSortedColumn("type") && "sorted-column-cell")}>{access.accessType}</TableCell>
                    <TableCell className={cn(isSortedColumn("status") && "sorted-column-cell")}>
                      <Badge variant={access.membershipStatus === 'active' ? 'default' : 'destructive'}>
                        {access.membershipStatus || 'Sconosciuto'}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn(isSortedColumn("notes") && "sorted-column-cell")}>{access.notes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div >
  );
}
