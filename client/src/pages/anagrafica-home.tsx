import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  User, CreditCard, Gift, IdCard, FileText, Trophy, Users,
  Dumbbell, BookOpen, Sun, Plus, Settings, Download, Upload, Save,
  Search, MessageCircle, RotateCcw
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Member } from "@shared/schema";

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

  // Sync selectedMemberId with URL parameter changes
  useEffect(() => {
    if (memberIdFromUrl) {
      setSelectedMemberId(parseInt(memberIdFromUrl));
    }
  }, [memberIdFromUrl]);

  const { data: members } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const { data: clientCategories, isLoading: loadingCategories } = useQuery<any[]>({
    queryKey: ["/api/client-categories"],
  });

  const { data: subscriptionTypes, isLoading: loadingSubscriptionTypes } = useQuery<any[]>({
    queryKey: ["/api/subscription-types"],
  });

  const selectedMember = members?.find(m => m.id === selectedMemberId);

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
      toast({ title: selectedMemberId ? "Dati salvati con successo" : "Nuovo membro creato" });
      if (!selectedMemberId && data?.id) {
        setSelectedMemberId(data.id);
      }
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!formData.firstName || !formData.lastName) {
      toast({ title: "Errore", description: "Cognome e Nome sono obbligatori", variant: "destructive" });
      return;
    }
    const dataToSave: MemberFormData = {
      ...formData,
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
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-2">
              <div>
                <h1 className="text-2xl font-semibold" data-testid="text-page-title">Sistema di Gestione Anagrafica</h1>
                <p className="text-sm text-muted-foreground">Inserimento e interrogazione dati</p>
              </div>
              {members && members.length > 0 && (
                <MemberSearch 
                  members={members} 
                  onSelect={handleMemberSelect}
                  placeholder="Cerca socio per nome, cognome, CF, email, telefono..."
                />
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm"
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
                onClick={handleNew}
                data-testid="button-new-member"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuovo
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
              {tabs.map(tab => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="data-[state=active]:bg-muted"
                  data-testid={`tab-${tab.id}`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
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
                <div className="grid grid-cols-4 gap-4">
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
                    <Label>Data Iscrizione</Label>
                    <Input 
                      type="date"
                      value={formData.dataIscrizione || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, dataIscrizione: e.target.value }))}
                      data-testid="input-registration-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Paese/Nazione</Label>
                    <Input 
                      placeholder="Italia"
                      value={formData.paeseNazione || "Italia"}
                      onChange={(e) => setFormData(prev => ({ ...prev, paeseNazione: e.target.value }))}
                      data-testid="input-country"
                    />
                  </div>
                </div>

                {/* Row 3: Prima Iscrizione, Tipo Iscrizione, Tipologia Socio, Data Fine */}
                <div className="grid grid-cols-4 gap-4">
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
                <div className="grid grid-cols-4 gap-4">
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
                <div className="grid grid-cols-6 gap-4">
                  <div className="space-y-2 col-span-2">
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

                {/* Row Chat */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Chat</Label>
                    <Input 
                      placeholder="ID Chat"
                      value={formData.chat || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, chat: e.target.value }))}
                      data-testid="input-chat"
                    />
                  </div>
                </div>

                {/* Row 5: Rilascio Tessera, Numero Tessera, Scadenza Tessera, Stato Tessera */}
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

          {/* Other tabs - placeholder content */}
          {tabs.filter(t => t.id !== "anagrafica").map(tab => (
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
      </div>
    </div>
  );
}
