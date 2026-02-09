import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useRoute, useLocation } from "wouter";
import { validateFiscalCode, parseFiscalCode } from "@/lib/fiscalCodeUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  User, CreditCard, Gift, IdCard, FileText, Trophy, Users, Dumbbell, 
  BookOpen, Sun, Plus, Settings, Download, Upload, Save, ChevronLeft,
  Trash2, Calendar, X
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { Member, Attendance, Enrollment, MedicalCertificate, Membership, InsertMember } from "@shared/schema";

// Form data aligns with InsertMember schema for type safety
type MemberFormData = Partial<InsertMember>;

const GENDER_OPTIONS = [
  { id: "M", label: "Maschio" },
  { id: "F", label: "Femmina" },
];

export default function MemberDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/membro/:id");
  const memberId = params?.id ? parseInt(params.id) : null;
  const isNewMember = params?.id === "nuovo";

  const [activeTab, setActiveTab] = useState("anagrafica");
  const [formData, setFormData] = useState<MemberFormData>({});
  const [isGSheetsDialogOpen, setIsGSheetsDialogOpen] = useState(false);
  const [gSheetsSpreadsheetId, setGSheetsSpreadsheetId] = useState("");

  const { data: member, isLoading: memberLoading } = useQuery<Member>({
    queryKey: ["/api/members", memberId],
    enabled: !!memberId && !isNewMember,
  });

  const { data: enrollments } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments"],
  });

  const { data: courses } = useQuery<any[]>({
    queryKey: ["/api/courses"],
  });

  const { data: attendances } = useQuery<Attendance[]>({
    queryKey: ["/api/attendances"],
  });

  const { data: memberships } = useQuery<Membership[]>({
    queryKey: ["/api/memberships"],
  });

  const { data: medicalCertificates } = useQuery<MedicalCertificate[]>({
    queryKey: ["/api/medical-certificates"],
  });

  const { data: clientCategories } = useQuery<any[]>({
    queryKey: ["/api/client-categories"],
  });

  useEffect(() => {
    if (member) {
      setFormData({
        firstName: member.firstName,
        lastName: member.lastName,
        fiscalCode: member.fiscalCode || "",
        dateOfBirth: member.dateOfBirth || "",
        placeOfBirth: member.placeOfBirth || "",
        gender: member.gender || "",
        email: member.email || "",
        phone: member.phone || "",
        mobile: member.mobile || "",
        address: member.address || "",
        cardNumber: member.cardNumber || "",
        cardIssueDate: member.cardIssueDate || "",
        cardExpiryDate: member.cardExpiryDate || "",
        notes: member.notes || "",
        categoryId: member.categoryId || undefined,
        hasMedicalCertificate: member.hasMedicalCertificate || false,
        medicalCertificateExpiry: member.medicalCertificateExpiry || "",
        active: member.active !== false,
      });
    }
  }, [member]);

  const saveMutation = useMutation({
    mutationFn: async (data: MemberFormData) => {
      if (isNewMember) {
        return await apiRequest("POST", "/api/members", data);
      } else {
        return await apiRequest("PATCH", `/api/members/${memberId}`, data);
      }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({ title: isNewMember ? "Membro creato con successo" : "Dati salvati con successo" });
      if (isNewMember && data?.id) {
        setLocation(`/membro/${data.id}`);
      }
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!formData.firstName || !formData.lastName) {
      toast({ title: "Errore", description: "Nome e Cognome sono obbligatori", variant: "destructive" });
      return;
    }
    // Ensure explicit defaults for boolean fields before save
    const dataToSave: MemberFormData = {
      ...formData,
      active: formData.active !== false,
      hasMedicalCertificate: formData.hasMedicalCertificate === true,
    };
    saveMutation.mutate(dataToSave);
  };

  const handleFiscalCodeChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setFormData(prev => ({ ...prev, fiscalCode: upperValue }));
    
    if (upperValue.length === 16) {
      if (validateFiscalCode(upperValue)) {
        const parsed = parseFiscalCode(upperValue);
        if (parsed) {
          setFormData(prev => ({
            ...prev,
            dateOfBirth: parsed.dateOfBirth,
            gender: parsed.gender,
            placeOfBirth: parsed.placeOfBirth || prev.placeOfBirth,
          }));
        }
      }
    }
  };

  const memberEnrollments = enrollments?.filter(e => e.memberId === memberId) || [];
  const memberAttendances = attendances?.filter(a => a.memberId === memberId) || [];
  const memberMemberships = memberships?.filter(m => m.memberId === memberId) || [];
  const memberCertificates = medicalCertificates?.filter(c => c.memberId === memberId) || [];

  const getCardStatus = () => {
    if (!formData.cardExpiryDate) return null;
    const expiry = new Date(formData.cardExpiryDate);
    const now = new Date();
    if (expiry < now) return { status: "expired", label: "Scaduta", color: "bg-red-100 text-red-800" };
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (expiry < thirtyDays) return { status: "expiring", label: "In Scadenza", color: "bg-yellow-100 text-yellow-800" };
    return { status: "active", label: "Attiva", color: "bg-green-100 text-green-800" };
  };

  const cardStatus = getCardStatus();
  const generatedMemberId = memberId ? String(memberId).padStart(7, '0') : "NUOVO";

  if (memberLoading && !isNewMember) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Sistema di Gestione Anagrafica</h1>
              <p className="text-sm text-muted-foreground">Inserimento e interrogazione dati</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsGSheetsDialogOpen(true)}
                data-testid="button-configure-gsheets"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configura GSheets
              </Button>
              <Button 
                variant="default" 
                size="sm"
                data-testid="button-export-gsheets"
              >
                <Upload className="w-4 h-4 mr-2" />
                Esporta su GSheets
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation("/importa")}
                data-testid="button-import-gsheets"
              >
                <Download className="w-4 h-4 mr-2" />
                Importa da GSheets
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSave}
                disabled={saveMutation.isPending}
                data-testid="button-save-local"
              >
                <Save className="w-4 h-4 mr-2" />
                Salva Locale
              </Button>
              <Button 
                size="sm"
                onClick={() => setLocation("/membro/nuovo")}
                data-testid="button-new-member"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuovo
              </Button>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-10 w-full h-auto">
              <TabsTrigger value="anagrafica" className="flex items-center gap-1 text-xs py-2" data-testid="tab-anagrafica">
                <User className="w-3 h-3" />
                Anagrafica
              </TabsTrigger>
              <TabsTrigger value="pagamenti" className="flex items-center gap-1 text-xs py-2" data-testid="tab-pagamenti">
                <CreditCard className="w-3 h-3" />
                Pagamenti
              </TabsTrigger>
              <TabsTrigger value="buoni" className="flex items-center gap-1 text-xs py-2" data-testid="tab-buoni">
                <Gift className="w-3 h-3" />
                Buoni
              </TabsTrigger>
              <TabsTrigger value="tessere" className="flex items-center gap-1 text-xs py-2" data-testid="tab-tessere">
                <IdCard className="w-3 h-3" />
                Tessere
              </TabsTrigger>
              <TabsTrigger value="certificati" className="flex items-center gap-1 text-xs py-2" data-testid="tab-certificati">
                <FileText className="w-3 h-3" />
                Certificati
              </TabsTrigger>
              <TabsTrigger value="gare" className="flex items-center gap-1 text-xs py-2" data-testid="tab-gare">
                <Trophy className="w-3 h-3" />
                Gare
              </TabsTrigger>
              <TabsTrigger value="membership" className="flex items-center gap-1 text-xs py-2" data-testid="tab-membership">
                <Users className="w-3 h-3" />
                Membership
              </TabsTrigger>
              <TabsTrigger value="allenamenti" className="flex items-center gap-1 text-xs py-2" data-testid="tab-allenamenti">
                <Dumbbell className="w-3 h-3" />
                Allenamenti/Affitti
              </TabsTrigger>
              <TabsTrigger value="corsi" className="flex items-center gap-1 text-xs py-2" data-testid="tab-corsi">
                <BookOpen className="w-3 h-3" />
                Corsi
              </TabsTrigger>
              <TabsTrigger value="vacanze" className="flex items-center gap-1 text-xs py-2" data-testid="tab-vacanze">
                <Sun className="w-3 h-3" />
                Vacanze
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="anagrafica" className="mt-0">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-purple-600">
                  <User className="w-5 h-5" />
                  Anagrafica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>ID Membro</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Auto</Badge>
                      <Input 
                        value={generatedMemberId}
                        readOnly
                        className="bg-yellow-50 border-yellow-200 font-mono"
                        data-testid="input-member-id"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cognome *</Label>
                    <Input 
                      placeholder="Cognome"
                      value={formData.lastName || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      data-testid="input-lastname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input 
                      placeholder="Nome"
                      value={formData.firstName || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      data-testid="input-firstname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data di Nascita</Label>
                    <Input 
                      type="date"
                      value={formData.dateOfBirth || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      data-testid="input-birthdate"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Luogo di Nascita</Label>
                    <Input 
                      placeholder="Città"
                      value={formData.placeOfBirth || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, placeOfBirth: e.target.value }))}
                      data-testid="input-birthplace"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sesso</Label>
                    <Select 
                      value={formData.gender || ""} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, gender: v }))}
                    >
                      <SelectTrigger data-testid="select-gender">
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map(opt => (
                          <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipologia Partecipante</Label>
                    <Select 
                      value={formData.categoryId?.toString() || ""} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, categoryId: v ? parseInt(v) : undefined }))}
                    >
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Seleziona" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientCategories?.map(cat => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Stato</Label>
                    <div className="h-9 flex items-center">
                      <Badge variant={formData.active !== false ? "default" : "secondary"}>
                        {formData.active !== false ? "Attivo" : "Inattivo"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      type="email"
                      placeholder="email@esempio.it"
                      value={formData.email || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      data-testid="input-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefono</Label>
                    <Input 
                      placeholder="+39 123 456 7890"
                      value={formData.phone || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      data-testid="input-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cellulare</Label>
                    <Input 
                      placeholder="+39 333 1234567"
                      value={formData.mobile || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                      data-testid="input-mobile"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Indirizzo</Label>
                    <Input 
                      placeholder="Via, n. civico, Città, CAP"
                      value={formData.address || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      data-testid="input-address"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Codice Fiscale</Label>
                    <Input 
                      placeholder="RSSMRA90A15F205X"
                      value={formData.fiscalCode || ""}
                      onChange={(e) => handleFiscalCodeChange(e.target.value)}
                      maxLength={16}
                      className="font-mono uppercase"
                      data-testid="input-fiscal-code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Certificato Medico</Label>
                    <div className="h-9 flex items-center">
                      <Badge variant={formData.hasMedicalCertificate ? "default" : "secondary"}>
                        {formData.hasMedicalCertificate ? "Presente" : "Assente"}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Scadenza Cert. Medico</Label>
                    <Input 
                      type="date"
                      value={formData.medicalCertificateExpiry || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, medicalCertificateExpiry: e.target.value }))}
                      data-testid="input-medical-expiry"
                    />
                  </div>
                  <div className="space-y-2"></div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Rilascio Tessera</Label>
                    <Input 
                      type="date"
                      value={formData.cardIssueDate || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, cardIssueDate: e.target.value }))}
                      data-testid="input-card-issue"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Numero Tessera</Label>
                    <Input 
                      placeholder="T-001234"
                      value={formData.cardNumber || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, cardNumber: e.target.value }))}
                      data-testid="input-card-number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Scadenza Tessera</Label>
                    <Input 
                      type="date"
                      value={formData.cardExpiryDate || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, cardExpiryDate: e.target.value }))}
                      data-testid="input-card-expiry"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stato Tessera</Label>
                    <div className="h-9 flex items-center">
                      {cardStatus ? (
                        <Badge className={cardStatus.color}>{cardStatus.label}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Non impostata</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Varie / Note</Label>
                  <Textarea 
                    placeholder="Note aggiuntive..."
                    value={formData.notes || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="min-h-24"
                    data-testid="input-notes"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pagamenti" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-purple-600">
                  <CreditCard className="w-5 h-5" />
                  Pagamenti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Storico pagamenti per questo membro
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="buoni" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-purple-600">
                  <Gift className="w-5 h-5" />
                  Buoni
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Buoni e voucher del membro
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tessere" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-purple-600">
                  <IdCard className="w-5 h-5" />
                  Tessere
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Numero Tessera</Label>
                    <Input 
                      value={formData.cardNumber || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, cardNumber: e.target.value }))}
                      data-testid="input-card-number-tab"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Rilascio</Label>
                    <Input 
                      type="date"
                      value={formData.cardIssueDate || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, cardIssueDate: e.target.value }))}
                      data-testid="input-card-issue-tab"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Scadenza</Label>
                    <Input 
                      type="date"
                      value={formData.cardExpiryDate || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, cardExpiryDate: e.target.value }))}
                      data-testid="input-card-expiry-tab"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stato</Label>
                    <div className="h-9 flex items-center">
                      {cardStatus ? (
                        <Badge className={cardStatus.color}>{cardStatus.label}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Non impostata</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certificati" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg text-purple-600">
                  <FileText className="w-5 h-5" />
                  Certificati Medici
                </CardTitle>
                <Button size="sm" data-testid="button-add-certificate">
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi
                </Button>
              </CardHeader>
              <CardContent>
                {memberCertificates.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nessun certificato medico registrato
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Data Rilascio</TableHead>
                        <TableHead>Data Scadenza</TableHead>
                        <TableHead>Stato</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memberCertificates.map((cert: any) => (
                        <TableRow key={cert.id}>
                          <TableCell>{cert.type || "Medico"}</TableCell>
                          <TableCell>{cert.issueDate ? format(new Date(cert.issueDate), "dd/MM/yyyy") : "-"}</TableCell>
                          <TableCell>{cert.expiryDate ? format(new Date(cert.expiryDate), "dd/MM/yyyy") : "-"}</TableCell>
                          <TableCell>
                            <Badge variant={new Date(cert.expiryDate) > new Date() ? "default" : "destructive"}>
                              {new Date(cert.expiryDate) > new Date() ? "Valido" : "Scaduto"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gare" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-purple-600">
                  <Trophy className="w-5 h-5" />
                  Gare
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Storico partecipazione gare
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="membership" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg text-purple-600">
                  <Users className="w-5 h-5" />
                  Membership
                </CardTitle>
                <Button size="sm" data-testid="button-add-membership">
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi
                </Button>
              </CardHeader>
              <CardContent>
                {memberMemberships.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nessuna membership attiva
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Inizio</TableHead>
                        <TableHead>Fine</TableHead>
                        <TableHead>Stato</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memberMemberships.map((membership: any) => (
                        <TableRow key={membership.id}>
                          <TableCell>{membership.type}</TableCell>
                          <TableCell>{membership.startDate ? format(new Date(membership.startDate), "dd/MM/yyyy") : "-"}</TableCell>
                          <TableCell>{membership.endDate ? format(new Date(membership.endDate), "dd/MM/yyyy") : "-"}</TableCell>
                          <TableCell>
                            <Badge variant={membership.status === "active" ? "default" : "secondary"}>
                              {membership.status === "active" ? "Attiva" : "Scaduta"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="allenamenti" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-purple-600">
                  <Dumbbell className="w-5 h-5" />
                  Allenamenti/Affitti / Presenze
                </CardTitle>
              </CardHeader>
              <CardContent>
                {memberAttendances.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nessuna presenza registrata
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Corso</TableHead>
                        <TableHead>Tipo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memberAttendances.slice(0, 20).map((attendance: any) => {
                        const course = courses?.find(c => c.id === attendance.courseId);
                        return (
                          <TableRow key={attendance.id}>
                            <TableCell>
                              {format(new Date(attendance.attendanceDate), "dd/MM/yyyy HH:mm", { locale: it })}
                            </TableCell>
                            <TableCell>{course?.name || "-"}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {attendance.type === 'manual' ? 'Manuale' : 
                                 attendance.type === 'barcode' ? 'Badge' : 'Auto'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="corsi" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg text-purple-600">
                  <BookOpen className="w-5 h-5" />
                  Corsi Iscritti
                </CardTitle>
                <Button size="sm" data-testid="button-add-course">
                  <Plus className="w-4 h-4 mr-2" />
                  Iscrivi a Corso
                </Button>
              </CardHeader>
              <CardContent>
                {memberEnrollments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nessun corso attivo
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Corso</TableHead>
                        <TableHead>Data Iscrizione</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memberEnrollments.map((enrollment: any) => {
                        const course = courses?.find(c => c.id === enrollment.courseId);
                        return (
                          <TableRow key={enrollment.id}>
                            <TableCell className="font-medium">{course?.name || "-"}</TableCell>
                            <TableCell>
                              {enrollment.startDate ? format(new Date(enrollment.startDate), "dd/MM/yyyy") : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={enrollment.status === "active" ? "default" : "secondary"}>
                                {enrollment.status === "active" ? "Attivo" : enrollment.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vacanze" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-purple-600">
                  <Sun className="w-5 h-5" />
                  Vacanze / Sospensioni
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Periodi di sospensione e vacanze
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isGSheetsDialogOpen} onOpenChange={setIsGSheetsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configura Google Sheets</DialogTitle>
            <DialogDescription>Collega un foglio Google per la sincronizzazione</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ID Foglio Google</Label>
              <Input 
                placeholder="1A2B3C4D5E6F7G8H9I0J..."
                value={gSheetsSpreadsheetId}
                onChange={(e) => setGSheetsSpreadsheetId(e.target.value)}
                data-testid="input-gsheets-id"
              />
              <p className="text-xs text-muted-foreground">
                L'ID si trova nell'URL: docs.google.com/spreadsheets/d/<strong>ID_FOGLIO</strong>/edit
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGSheetsDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={() => {
              toast({ title: "Configurazione salvata" });
              setIsGSheetsDialogOpen(false);
            }}>
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
