import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { validateFiscalCode, parseFiscalCode } from "@/lib/fiscalCodeUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { MemberSearch } from "@/components/ui/member-search";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  User, CreditCard, Gift, IdCard, FileText, Trophy, Users,
  Dumbbell, BookOpen, Sun, Plus, Settings, Download, Upload, Save,
  Search, MessageCircle, RotateCcw, ChevronUp, Building2, AlertTriangle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Member } from "@shared/schema";

interface DuplicateFiscalCode {
  fiscalCode: string;
  members: { id: number; firstName: string; lastName: string; }[];
}

interface MemberFormData {
  firstName?: string;
  lastName?: string;
  fiscalCode?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  // Indirizzo suddiviso
  streetAddress?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  // Card data
  cardNumber?: string;
  cardIssueDate?: string;
  cardExpiryDate?: string;
  // Entity card data (tessera ente)
  entityCardType?: string;
  entityCardNumber?: string;
  entityCardIssueDate?: string;
  entityCardExpiryDate?: string;
  notes?: string;
  categoryId?: number;
  subscriptionTypeId?: number;
  hasMedicalCertificate?: boolean;
  medicalCertificateExpiry?: string;
  active?: boolean;
  // Additional UI-only fields for display (not persisted)
  dataIscrizione?: string;
  primaIscrizione?: string;
  dataFineIscrizione?: string;
  chat?: string;
}

const GENDER_OPTIONS = [
  { id: "M", label: "Maschio" },
  { id: "F", label: "Femmina" },
];


export default function AnagraficaHome() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const memberIdFromUrl = urlParams.get('memberId');
  
  const [activeTab, setActiveTab] = useState("anagrafica");
  const [formData, setFormData] = useState<MemberFormData>({
    country: "Italia",
  });
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(
    memberIdFromUrl ? parseInt(memberIdFromUrl) : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Query for duplicate fiscal codes
  const { data: duplicateFiscalCodes } = useQuery<DuplicateFiscalCode[]>({
    queryKey: ["/api/members/duplicates"],
  });

  // Sync selectedMemberId with URL parameter changes
  useEffect(() => {
    if (memberIdFromUrl) {
      setSelectedMemberId(parseInt(memberIdFromUrl));
    }
  }, [memberIdFromUrl]);

  // Back to top scroll tracking
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    
    const handleScroll = () => {
      setShowBackToTop(content.scrollTop > 300);
    };
    
    content.addEventListener("scroll", handleScroll);
    return () => content.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const { data: clientCategories, isLoading: loadingCategories } = useQuery<any[]>({
    queryKey: ["/api/client-categories"],
  });

  const { data: subscriptionTypes, isLoading: loadingSubscriptionTypes } = useQuery<any[]>({
    queryKey: ["/api/subscription-types"],
  });

  const { data: selectedMember } = useQuery<Member>({
    queryKey: ["/api/members", selectedMemberId],
    queryFn: async () => {
      if (!selectedMemberId) return null;
      const res = await fetch(`/api/members/${selectedMemberId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch member");
      return res.json();
    },
    enabled: !!selectedMemberId,
  });

  useEffect(() => {
    if (selectedMember) {
      setFormData({
        firstName: selectedMember.firstName,
        lastName: selectedMember.lastName,
        fiscalCode: selectedMember.fiscalCode || "",
        dateOfBirth: selectedMember.dateOfBirth || "",
        placeOfBirth: selectedMember.placeOfBirth || "",
        gender: selectedMember.gender || "",
        email: selectedMember.email || "",
        phone: selectedMember.phone || "",
        mobile: selectedMember.mobile || "",
        streetAddress: selectedMember.streetAddress || "",
        city: selectedMember.city || "",
        province: selectedMember.province || "",
        postalCode: selectedMember.postalCode || "",
        country: selectedMember.country || "Italia",
        cardNumber: selectedMember.cardNumber || "",
        cardIssueDate: selectedMember.cardIssueDate || "",
        cardExpiryDate: selectedMember.cardExpiryDate || "",
        entityCardType: selectedMember.entityCardType || "",
        entityCardNumber: selectedMember.entityCardNumber || "",
        entityCardIssueDate: selectedMember.entityCardIssueDate || "",
        entityCardExpiryDate: selectedMember.entityCardExpiryDate || "",
        notes: selectedMember.notes || "",
        categoryId: selectedMember.categoryId || undefined,
        subscriptionTypeId: selectedMember.subscriptionTypeId || undefined,
        hasMedicalCertificate: selectedMember.hasMedicalCertificate || false,
        medicalCertificateExpiry: selectedMember.medicalCertificateExpiry || "",
        active: selectedMember.active !== false,
      });
    }
  }, [selectedMember]);

  const saveMutation = useMutation({
    mutationFn: async (data: MemberFormData) => {
      const { dataIscrizione, primaIscrizione, dataFineIscrizione, chat, ...apiData } = data;
      if (selectedMemberId) {
        return await apiRequest("PATCH", `/api/members/${selectedMemberId}`, apiData);
      } else {
        return await apiRequest("POST", "/api/members", apiData);
      }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/duplicates"] });
      toast({ title: selectedMemberId ? "Dati salvati con successo" : "Nuovo membro creato" });
      if (!selectedMemberId && data?.id) {
        setSelectedMemberId(data.id);
      }
    },
    onError: (error: any) => {
      // Check if error contains conflict information
      if (error.conflictWith) {
        toast({ 
          title: "Codice Fiscale Duplicato", 
          description: `Il codice fiscale è già utilizzato da: ${error.conflictWith.firstName} ${error.conflictWith.lastName}`,
          variant: "destructive" 
        });
      } else {
        toast({ title: "Errore", description: error.message, variant: "destructive" });
      }
    },
  });

  const handleSave = () => {
    const warnings: string[] = [];
    if (!formData.firstName?.trim()) warnings.push("Nome");
    if (!formData.lastName?.trim()) warnings.push("Cognome");
    
    if (warnings.length > 0) {
      toast({ 
        title: "Attenzione", 
        description: `Campi mancanti: ${warnings.join(", ")}. I dati saranno salvati comunque.`,
        variant: "default" 
      });
    }

    const normalizeEmpty = (val: string | undefined): string | undefined => {
      if (!val || val.trim() === "") return undefined;
      return val.trim();
    };

    const dataToSave: MemberFormData = {
      firstName: normalizeEmpty(formData.firstName) || "Sconosciuto",
      lastName: normalizeEmpty(formData.lastName) || "Sconosciuto",
      fiscalCode: normalizeEmpty(formData.fiscalCode),
      dateOfBirth: normalizeEmpty(formData.dateOfBirth),
      placeOfBirth: normalizeEmpty(formData.placeOfBirth),
      gender: normalizeEmpty(formData.gender),
      email: normalizeEmpty(formData.email),
      phone: normalizeEmpty(formData.phone),
      mobile: normalizeEmpty(formData.mobile),
      streetAddress: normalizeEmpty(formData.streetAddress),
      city: normalizeEmpty(formData.city),
      province: normalizeEmpty(formData.province),
      postalCode: normalizeEmpty(formData.postalCode),
      country: normalizeEmpty(formData.country) || "Italia",
      cardNumber: normalizeEmpty(formData.cardNumber),
      cardIssueDate: normalizeEmpty(formData.cardIssueDate),
      cardExpiryDate: normalizeEmpty(formData.cardExpiryDate),
      entityCardType: normalizeEmpty(formData.entityCardType),
      entityCardNumber: normalizeEmpty(formData.entityCardNumber),
      entityCardIssueDate: normalizeEmpty(formData.entityCardIssueDate),
      entityCardExpiryDate: normalizeEmpty(formData.entityCardExpiryDate),
      medicalCertificateExpiry: normalizeEmpty(formData.medicalCertificateExpiry),
      notes: normalizeEmpty(formData.notes),
      categoryId: formData.categoryId,
      subscriptionTypeId: formData.subscriptionTypeId,
      active: formData.active !== false,
      hasMedicalCertificate: formData.hasMedicalCertificate === true,
    };
    saveMutation.mutate(dataToSave);
  };

  const handleNew = () => {
    setSelectedMemberId(null);
    setFormData({ country: "Italia" });
    // Clear URL param when creating new member
    setLocation("/");
  };

  const handleMemberSelect = (member: Member) => {
    setSelectedMemberId(member.id);
    setLocation(`/?memberId=${member.id}`);
  };

  const handleAutocompleteSelect = (member: Member) => {
    setSelectedMemberId(member.id);
    setLocation(`/?memberId=${member.id}`);
    // Popola immediatamente tutti i campi del form
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
      streetAddress: member.streetAddress || "",
      city: member.city || "",
      province: member.province || "",
      postalCode: member.postalCode || "",
      country: member.country || "Italia",
      cardNumber: member.cardNumber || "",
      cardIssueDate: member.cardIssueDate || "",
      cardExpiryDate: member.cardExpiryDate || "",
      entityCardType: member.entityCardType || "",
      entityCardNumber: member.entityCardNumber || "",
      entityCardIssueDate: member.entityCardIssueDate || "",
      entityCardExpiryDate: member.entityCardExpiryDate || "",
      notes: member.notes || "",
      categoryId: member.categoryId || undefined,
      subscriptionTypeId: member.subscriptionTypeId || undefined,
      hasMedicalCertificate: member.hasMedicalCertificate || false,
      medicalCertificateExpiry: member.medicalCertificateExpiry || "",
      active: member.active !== false,
    });
  };

  const handleFiscalCodeChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setFormData(prev => ({ ...prev, fiscalCode: upperValue }));
    
    // Auto-fill data from fiscal code when complete
    if (upperValue.length === 16) {
      if (validateFiscalCode(upperValue)) {
        const parsed = parseFiscalCode(upperValue);
        if (parsed) {
          setFormData(prev => ({
            ...prev,
            fiscalCode: upperValue,
            dateOfBirth: parsed.dateOfBirth || prev.dateOfBirth,
            gender: parsed.gender || prev.gender,
            placeOfBirth: parsed.placeOfBirth || prev.placeOfBirth,
          }));
          toast({ title: "Codice fiscale valido", description: "Dati estratti automaticamente" });
        }
      }
    }
  };

  const getCardStatus = () => {
    if (!formData.cardExpiryDate) return null;
    const expiry = new Date(formData.cardExpiryDate);
    const now = new Date();
    if (expiry < now) return { status: "expired", label: "Scaduta", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" };
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (expiry < thirtyDays) return { status: "expiring", label: "In Scadenza", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" };
    return { status: "active", label: "Attiva", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" };
  };

  const cardStatus = getCardStatus();
  const generatedMemberId = selectedMemberId ? String(selectedMemberId).padStart(7, '0') : "0000001";

  const tabs = [
    { id: "anagrafica", label: "Anagrafica", icon: User },
    { id: "pagamenti", label: "Pagamenti", icon: CreditCard },
    { id: "buoni", label: "Buoni", icon: Gift },
    { id: "tessere", label: "Tessere", icon: IdCard },
    { id: "certificati", label: "Certificati", icon: FileText },
    { id: "gare", label: "Gare", icon: Trophy },
    { id: "membership", label: "Membership", icon: Users },
    { id: "allenamenti", label: "Allenamenti", icon: Dumbbell },
    { id: "corsi", label: "Corsi", icon: BookOpen },
    { id: "vacanze", label: "Vacanze", icon: Sun },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold" data-testid="text-page-title">Sistema di Gestione Anagrafica</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Inserimento e interrogazione dati</p>
              </div>
              {members && members.length > 0 && (
                <MemberSearch 
                  members={members} 
                  onSelect={handleMemberSelect}
                  placeholder="Cerca socio..."
                />
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-start lg:justify-end">
              <Button 
                variant="outline" 
                size="sm"
                data-testid="button-configure-gsheets"
                className="hidden sm:inline-flex"
              >
                <Settings className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">GSheets</span>
              </Button>
              <Button 
                variant="default" 
                size="sm"
                data-testid="button-export-gsheets"
                className="hidden sm:inline-flex"
              >
                <Upload className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Esporta</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation("/importa")}
                data-testid="button-import-gsheets"
              >
                <Download className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Importa</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSave}
                disabled={saveMutation.isPending}
                data-testid="button-save-local"
              >
                <Save className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Salva</span>
              </Button>
              {duplicateFiscalCodes && duplicateFiscalCodes.length > 0 && (
                <Button 
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDuplicatesModal(true)}
                  data-testid="button-duplicate-warning"
                >
                  <AlertTriangle className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Duplicati ({duplicateFiscalCodes.length})</span>
                </Button>
              )}
              <Button 
                size="sm"
                onClick={handleNew}
                data-testid="button-new-member"
              >
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Nuovo</span>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="overflow-x-auto -mx-4 px-4 pb-1">
              <TabsList className="h-auto gap-1 bg-transparent p-0 inline-flex min-w-max">
                {tabs.map(tab => (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className="data-[state=active]:bg-muted whitespace-nowrap text-xs sm:text-sm"
                    data-testid={`tab-${tab.id}`}
                  >
                    <tab.icon className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div ref={contentRef} className="flex-1 overflow-auto p-4 relative">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="anagrafica" className="mt-0">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5" />
                  Anagrafica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Row 1: ID, Cognome, Nome, Data Nascita */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>ID Membro</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700">Auto</Badge>
                      <Input 
                        value={generatedMemberId}
                        readOnly
                        className="bg-yellow-50 border-yellow-200 font-mono dark:bg-yellow-900/20 dark:border-yellow-700"
                        data-testid="input-member-id"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cognome *</Label>
                    <AutocompleteInput
                      value={formData.lastName || ""}
                      onChange={(v) => setFormData(prev => ({ ...prev, lastName: v }))}
                      onMemberSelect={handleAutocompleteSelect}
                      members={members || []}
                      field="lastName"
                      placeholder="Cognome"
                      data-testid="input-lastname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <AutocompleteInput
                      value={formData.firstName || ""}
                      onChange={(v) => setFormData(prev => ({ ...prev, firstName: v }))}
                      onMemberSelect={handleAutocompleteSelect}
                      members={members || []}
                      field="firstName"
                      placeholder="Nome"
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

                {/* Row 2: Luogo Nascita, Sesso, Data Iscrizione, Paese */}
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
                    <Label>Data Iscrizione</Label>
                    <Input 
                      type="date"
                      value={formData.dataIscrizione || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, dataIscrizione: e.target.value }))}
                      data-testid="input-registration-date"
                    />
                  </div>
                </div>

                {/* Row 3: Prima Iscrizione, Tipo Iscrizione, Tipologia Socio, Data Fine */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Prima Iscrizione</Label>
                    <Input 
                      type="date"
                      value={formData.primaIscrizione || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaIscrizione: e.target.value }))}
                      data-testid="input-first-registration"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo Iscrizione</Label>
                    <SearchableSelect
                      options={subscriptionTypes || []}
                      value={formData.subscriptionTypeId || null}
                      onChange={(v) => setFormData(prev => ({ ...prev, subscriptionTypeId: v || undefined }))}
                      placeholder="Cerca tipo (min 3 car.)..."
                      minSearchLength={3}
                      isLoading={loadingSubscriptionTypes}
                      allowCreate={true}
                      onCreateNew={async (name) => {
                        try {
                          await apiRequest("POST", "/api/subscription-types", { name });
                          queryClient.invalidateQueries({ queryKey: ["/api/subscription-types"] });
                          toast({ title: "Tipo iscrizione creato" });
                        } catch (error) {
                          toast({ title: "Errore nella creazione", variant: "destructive" });
                        }
                      }}
                      data-testid="select-subscription-type"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipologia Socio</Label>
                    <SearchableSelect
                      options={clientCategories || []}
                      value={formData.categoryId || null}
                      onChange={(v) => setFormData(prev => ({ ...prev, categoryId: v || undefined }))}
                      placeholder="Cerca tipologia (min 3 car.)..."
                      minSearchLength={3}
                      isLoading={loadingCategories}
                      allowCreate={true}
                      onCreateNew={async (name) => {
                        try {
                          await apiRequest("POST", "/api/client-categories", { name });
                          queryClient.invalidateQueries({ queryKey: ["/api/client-categories"] });
                          toast({ title: "Tipologia socio creata" });
                        } catch (error) {
                          toast({ title: "Errore nella creazione", variant: "destructive" });
                        }
                      }}
                      data-testid="select-category"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Fine Iscrizione</Label>
                    <Input 
                      type="date"
                      value={formData.dataFineIscrizione || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, dataFineIscrizione: e.target.value }))}
                      data-testid="input-membership-end"
                    />
                  </div>
                </div>

                {/* Row 4: Codice Fiscale, Email, Telefono, Cellulare */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Codice Fiscale</Label>
                    <AutocompleteInput
                      value={formData.fiscalCode || ""}
                      onChange={handleFiscalCodeChange}
                      onMemberSelect={handleAutocompleteSelect}
                      members={members || []}
                      field="fiscalCode"
                      placeholder="RSSMRA90A15F205X"
                      className="font-mono uppercase"
                      data-testid="input-fiscal-code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <AutocompleteInput
                      value={formData.email || ""}
                      onChange={(v) => setFormData(prev => ({ ...prev, email: v }))}
                      onMemberSelect={handleAutocompleteSelect}
                      members={members || []}
                      field="email"
                      placeholder="email@esempio.it"
                      data-testid="input-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefono</Label>
                    <AutocompleteInput
                      value={formData.phone || ""}
                      onChange={(v) => setFormData(prev => ({ ...prev, phone: v }))}
                      onMemberSelect={handleAutocompleteSelect}
                      members={members || []}
                      field="phone"
                      placeholder="+39 123 456 7890"
                      data-testid="input-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cellulare</Label>
                    <AutocompleteInput
                      value={formData.mobile || ""}
                      onChange={(v) => setFormData(prev => ({ ...prev, mobile: v }))}
                      onMemberSelect={handleAutocompleteSelect}
                      members={members || []}
                      field="mobile"
                      placeholder="+39 333 1234567"
                      data-testid="input-mobile"
                    />
                  </div>
                </div>

                {/* Row 5: Indirizzo suddiviso */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Via/Piazza</Label>
                    <Input 
                      placeholder="Via Roma, 123"
                      value={formData.streetAddress || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, streetAddress: e.target.value }))}
                      data-testid="input-street-address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Città</Label>
                    <LocationAutocomplete
                      value={formData.city || ""}
                      onChange={(v) => setFormData(prev => ({ ...prev, city: v }))}
                      onCitySelect={(city) => {
                        setFormData(prev => ({
                          ...prev,
                          city: city.name,
                          province: city.province?.code || prev.province || "",
                          postalCode: city.postalCode || prev.postalCode || "",
                        }));
                      }}
                      placeholder="Cerca città..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prov.</Label>
                    <Input 
                      placeholder="MI"
                      maxLength={2}
                      value={formData.province || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value.toUpperCase() }))}
                      data-testid="input-province"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CAP</Label>
                    <Input 
                      placeholder="20100"
                      maxLength={5}
                      value={formData.postalCode || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                      data-testid="input-postal-code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stato</Label>
                    <Input 
                      placeholder="Italia"
                      value={formData.country || "Italia"}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                      data-testid="input-country"
                    />
                  </div>
                </div>


                {/* Row 5: Rilascio Tessera, Numero Tessera, Scadenza Tessera, Stato Tessera */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Attiva</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Row 6: Note */}
                <div className="space-y-2">
                  <Label>Varie / Note</Label>
                  <Textarea 
                    placeholder="Note aggiuntive..."
                    value={formData.notes || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    data-testid="input-notes"
                  />
                </div>

                {/* Tasti azione */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleNew}
                    data-testid="button-clear-form"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Pulisci
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNew}
                    data-testid="button-new-form"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuovo
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    data-testid="button-save-form"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {selectedMemberId ? "Aggiorna" : "Salva"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tessere Tab */}
          <TabsContent value="tessere" className="mt-0">
            <div className="space-y-6">
              {/* Tessera Socio */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <IdCard className="w-5 h-5" />
                    Tessera Socio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Numero Tessera</Label>
                      <Input
                        id="cardNumber"
                        value={formData.cardNumber || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, cardNumber: e.target.value }))}
                        placeholder="2526XXXXXXX"
                        data-testid="input-card-number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardIssueDate">Data Rilascio</Label>
                      <Input
                        id="cardIssueDate"
                        type="date"
                        value={formData.cardIssueDate || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, cardIssueDate: e.target.value }))}
                        data-testid="input-card-issue-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardExpiryDate">Data Scadenza</Label>
                      <Input
                        id="cardExpiryDate"
                        type="date"
                        value={formData.cardExpiryDate || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, cardExpiryDate: e.target.value }))}
                        data-testid="input-card-expiry-date"
                      />
                    </div>
                  </div>
                  {cardStatus && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Stato:</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${cardStatus.color}`} data-testid="text-card-status">
                        {cardStatus.label}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tessera Ente */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="w-5 h-5" />
                    Tessera Ente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="entityCardType">Tipo Ente</Label>
                      <Select
                        value={formData.entityCardType || ""}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, entityCardType: value }))}
                      >
                        <SelectTrigger data-testid="select-entity-card-type">
                          <SelectValue placeholder="Seleziona ente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CSEN">CSEN</SelectItem>
                          <SelectItem value="ACSI">ACSI</SelectItem>
                          <SelectItem value="AICS">AICS</SelectItem>
                          <SelectItem value="UISP">UISP</SelectItem>
                          <SelectItem value="CSI">CSI</SelectItem>
                          <SelectItem value="ENDAS">ENDAS</SelectItem>
                          <SelectItem value="ASI">ASI</SelectItem>
                          <SelectItem value="MSP">MSP</SelectItem>
                          <SelectItem value="ALTRO">Altro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entityCardNumber">Numero Tessera Ente</Label>
                      <Input
                        id="entityCardNumber"
                        value={formData.entityCardNumber || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, entityCardNumber: e.target.value }))}
                        placeholder="Numero tessera"
                        data-testid="input-entity-card-number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entityCardIssueDate">Data Rilascio</Label>
                      <Input
                        id="entityCardIssueDate"
                        type="date"
                        value={formData.entityCardIssueDate || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, entityCardIssueDate: e.target.value }))}
                        data-testid="input-entity-card-issue-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entityCardExpiryDate">Data Scadenza</Label>
                      <Input
                        id="entityCardExpiryDate"
                        type="date"
                        value={formData.entityCardExpiryDate || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, entityCardExpiryDate: e.target.value }))}
                        data-testid="input-entity-card-expiry-date"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  data-testid="button-save-tessere"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {selectedMemberId ? "Salva Modifiche" : "Salva"}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Other tabs - placeholder content */}
          {tabs.filter(t => t.id !== "anagrafica" && t.id !== "tessere").map(tab => (
            <TabsContent key={tab.id} value={tab.id} className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Sezione {tab.label} - in fase di sviluppo</p>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Back to Top Button - Mobile only */}
        {showBackToTop && (
          <Button
            size="icon"
            className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg lg:hidden"
            onClick={scrollToTop}
            data-testid="button-back-to-top"
          >
            <ChevronUp className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Duplicate Fiscal Codes Modal */}
      <Dialog open={showDuplicatesModal} onOpenChange={setShowDuplicatesModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Codici Fiscali Duplicati
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              I seguenti codici fiscali sono presenti in più di un membro. Clicca sul nome per visualizzare e modificare il membro.
            </p>
            {duplicateFiscalCodes?.map((duplicate) => (
              <Card key={duplicate.fiscalCode} className="p-4">
                <div className="space-y-2">
                  <div className="font-mono text-sm font-medium bg-muted px-2 py-1 rounded inline-block">
                    {duplicate.fiscalCode}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {duplicate.members.map((member) => (
                      <Button
                        key={member.id}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowDuplicatesModal(false);
                          setSelectedMemberId(member.id);
                          setLocation(`/?memberId=${member.id}`);
                        }}
                        data-testid={`button-duplicate-member-${member.id}`}
                      >
                        {member.firstName} {member.lastName}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
