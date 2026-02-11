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
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  User, CreditCard, Gift, IdCard, FileText, Trophy, Users, Dumbbell, 
  BookOpen, Sun, Plus, Settings, Download, Upload, Save,
  Trash2, Search, ArrowLeft
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { Member, Attendance, Enrollment, MedicalCertificate, Membership } from "@shared/schema";

type MemberFormData = Partial<Omit<Member, "id" | "createdAt" | "updatedAt">>;

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
      toast({ title: isNewMember ? "Partecipante creato con successo" : "Dati salvati con successo" });
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
    if (expiry < now) return { status: "expired", label: "Scaduta", color: "bg-muted/50 border border-amber-500/50 text-foreground" };
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (expiry < thirtyDays) return { status: "expiring", label: "In Scadenza", color: "bg-muted/50 border border-amber-500/50 text-foreground" };
    return { status: "active", label: "Attiva", color: "bg-muted/50 border border-amber-500/50 text-foreground" };
  };

  const cardStatus = getCardStatus();
  const generatedMemberId = memberId ? String(memberId).padStart(7, '0') : "NUOVO";

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const navItems = [
    { id: "anagrafica", label: "Anagrafica", icon: User },
    { id: "pagamenti", label: "Pagamenti", icon: CreditCard },
    { id: "buoni", label: "Gift/Buono", icon: Gift },
    { id: "tessere", label: "Tessere", icon: IdCard },
    { id: "certificati", label: "Certificato Medico", icon: FileText },
    { id: "gare", label: "Gare", icon: Trophy },
    { id: "membership", label: "Membership", icon: Users },
    { id: "allenamenti", label: "Allenamenti", icon: Dumbbell },
    { id: "corsi", label: "Corsi", icon: BookOpen },
    { id: "vacanze", label: "Vacanze", icon: Sun },
  ];

  if (memberLoading && !isNewMember) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-testid="page-member-dashboard">
      <div className="border-b bg-muted/30 sticky top-0 z-10">
        <div className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="icon-gold-bg rounded-md h-8 w-8 flex-shrink-0" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 text-white" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Anagrafica</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Inserimento e interrogazione dati</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="text-xs h-8 bg-background" onClick={() => setIsGSheetsDialogOpen(true)} data-testid="button-gsheets">
                <Settings className="w-3 h-3 mr-1 sidebar-icon-gold" />
                GSheets
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8 bg-background" data-testid="button-esporta">
                <Upload className="w-3 h-3 mr-1 sidebar-icon-gold" />
                Esporta
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8 bg-background" onClick={() => setLocation("/importa")} data-testid="button-importa">
                <Download className="w-3 h-3 mr-1 sidebar-icon-gold" />
                Importa
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8 bg-background" onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-salva">
                <Save className="w-3 h-3 mr-1 sidebar-icon-gold" />
                Salva
              </Button>
              <Button size="sm" className="gold-3d-button" onClick={() => setLocation("/membro/nuovo")} data-testid="button-nuovo">
                <Plus className="w-4 h-4 mr-1" />
                Nuovo
              </Button>
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cerca partecipante..." 
              className="pl-10 bg-background"
              data-testid="input-search"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                size="sm"
                onClick={() => scrollToSection(item.id)}
                className="text-xs h-8 bg-background whitespace-nowrap flex-shrink-0"
                data-testid={`nav-${item.id}`}
              >
                <item.icon className="w-3 h-3 mr-1 sidebar-icon-gold" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">

        <Card id="anagrafica" className="scroll-mt-32">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 sidebar-icon-gold" />
              Anagrafica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>ID Partecipante</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">Auto</Badge>
                  <Input 
                    value={generatedMemberId}
                    readOnly
                    className="bg-amber-50/50 border-amber-200 font-mono dark:bg-amber-900/20 dark:border-amber-700"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        <Card id="pagamenti" className="scroll-mt-32">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5 sidebar-icon-gold" />
              Pagamenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Storico pagamenti per questo partecipante
            </p>
          </CardContent>
        </Card>

        <Card id="buoni" className="scroll-mt-32">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="w-5 h-5 sidebar-icon-gold" />
              Buoni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Buoni e voucher del partecipante
            </p>
          </CardContent>
        </Card>

        <Card id="tessere" className="scroll-mt-32">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <IdCard className="w-5 h-5 sidebar-icon-gold" />
              Tessere
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        <Card id="certificati" className="scroll-mt-32">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 sidebar-icon-gold" />
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

        <Card id="gare" className="scroll-mt-32">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="w-5 h-5 sidebar-icon-gold" />
              Gare
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Storico partecipazione gare
            </p>
          </CardContent>
        </Card>

        <Card id="membership" className="scroll-mt-32">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 sidebar-icon-gold" />
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

        <Card id="allenamenti" className="scroll-mt-32">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Dumbbell className="w-5 h-5 sidebar-icon-gold" />
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

        <Card id="corsi" className="scroll-mt-32">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5 sidebar-icon-gold" />
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
                          <Button variant="outline" size="icon" className="bg-white text-black border-foreground/20 hover:bg-gray-50 dark:bg-white dark:text-black dark:hover:bg-gray-100">
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

        <Card id="vacanze" className="scroll-mt-32">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sun className="w-5 h-5 sidebar-icon-gold" />
              Vacanze / Sospensioni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Periodi di sospensione e vacanze
            </p>
          </CardContent>
        </Card>

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