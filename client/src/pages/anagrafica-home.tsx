import { ExportWizard } from "@/components/ExportWizard";
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
  Search, MessageCircle, RotateCcw, ChevronUp, Building2, AlertTriangle,
  Smartphone, Trash2, Calendar
} from "lucide-react";
import { MembershipCard } from "@/components/membership-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Member, Instructor, Category, Studio } from "@shared/schema";
import { CourseSelector } from "@/components/course-selector";
import { useMemberStore } from "@/store/useMemberStore";
import { DuplicateMergeModal } from "@/components/duplicate-merge-modal";

// Interface removed, using any because schema now returns new type
type DuplicateFiscalCode = any;

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
  address?: string;
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
  // Foto
  photoUrl?: string | null;
  // Minor fields
  isMinor?: boolean;
  motherFirstName?: string | null;
  motherLastName?: string | null;
  motherFiscalCode?: string | null;
  motherEmail?: string | null;
  motherPhone?: string | null;
  motherMobile?: string | null;
  fatherFirstName?: string | null;
  fatherLastName?: string | null;
  fatherFiscalCode?: string | null;
  fatherEmail?: string | null;
  fatherPhone?: string | null;
  fatherMobile?: string | null;
  // Additional UI-only fields
  dataIscrizione?: string;
  primaIscrizione?: string;
  dataFineIscrizione?: string;
  chat?: string;
}

const formatForInput = (val: any) => {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

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
  const [selectedCourseToAdd, setSelectedCourseToAdd] = useState<string>("");
  const [selectedWorkshopToAdd, setSelectedWorkshopToAdd] = useState<string>("");
  const [formData, setFormData] = useState<MemberFormData>({
    country: "Italia",
  });

  const selectedMemberId = useMemberStore((state) => state.selectedMemberId);
  const setSelectedMemberId = useMemberStore((state) => state.setSelectedMemberId);

  // Set the store immediately if there's a URL parameter on first load
  useEffect(() => {
    if (memberIdFromUrl) {
      const id = parseInt(memberIdFromUrl);
      if (!isNaN(id) && id !== selectedMemberId) {
        setSelectedMemberId(id);
      }
    }
  }, [memberIdFromUrl, setSelectedMemberId]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [showNewPaymentDialog, setShowNewPaymentDialog] = useState(false);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [selectedMemberForCard, setSelectedMemberForCard] = useState<Member | null>(null);
  const [newPaymentType, setNewPaymentType] = useState("");
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  // Query for duplicate fiscal codes
  const { data: duplicateFiscalCodes } = useQuery<DuplicateFiscalCode[]>({
    queryKey: ["/api/members/duplicates"],
  });

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


  // Query per dati collegati al membro selezionato
  const { data: memberPayments, isLoading: loadingPayments, error: errorPayments } = useQuery<any[]>({
    queryKey: ["/api/payments", "member", selectedMemberId],
    queryFn: async () => {
      const res = await fetch(`/api/payments?memberId=${selectedMemberId}`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error("Errore caricamento pagamenti");
      }
      return res.json();
    },
    enabled: !!selectedMemberId,
  });

  const { data: memberEnrollments, isLoading: loadingEnrollments, error: errorEnrollments } = useQuery<any[]>({
    queryKey: ["/api/enrollments", "member", selectedMemberId],
    queryFn: async () => {
      const res = await fetch(`/api/enrollments?memberId=${selectedMemberId}`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error("Errore caricamento iscrizioni");
      }
      return res.json();
    },
    enabled: !!selectedMemberId,
  });

  const { data: courses } = useQuery<any[]>({
    queryKey: ["/api/courses"],
  });

  const { data: instructors } = useQuery<Instructor[]>({
    queryKey: ["/api/instructors"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: studios } = useQuery<Studio[]>({
    queryKey: ["/api/studios"],
  });

  const { data: workshops } = useQuery<any[]>({
    queryKey: ["/api/workshops"],
  });

  const { data: memberWorkshopEnrollments } = useQuery<any[]>({
    queryKey: ["/api/workshop-enrollments", "member", selectedMemberId],
    queryFn: async () => {
      if (!selectedMemberId) return [];
      const res = await fetch(`/api/workshop-enrollments?memberId=${selectedMemberId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedMemberId,
  });

  const { data: memberMemberships, isLoading: loadingMemberships, error: errorMemberships } = useQuery<any[]>({
    queryKey: ["/api/memberships", "member", selectedMemberId],
    queryFn: async () => {
      const res = await fetch(`/api/memberships?memberId=${selectedMemberId}`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error("Errore caricamento abbonamenti");
      }
      return res.json();
    },
    enabled: !!selectedMemberId,
  });

  const { data: memberCertificates, isLoading: loadingCertificates, error: errorCertificates } = useQuery<any[]>({
    queryKey: ["/api/medical-certificates", "member", selectedMemberId],
    queryFn: async () => {
      const res = await fetch(`/api/medical-certificates?memberId=${selectedMemberId}`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error("Errore caricamento certificati");
      }
      return res.json();
    },
    enabled: !!selectedMemberId,
  });

  const { data: memberAttendances, isLoading: loadingAttendances, error: errorAttendances } = useQuery<any[]>({
    queryKey: ["/api/attendances", "member", selectedMemberId],
    queryFn: async () => {
      const res = await fetch(`/api/attendances?memberId=${selectedMemberId}`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error("Errore caricamento presenze");
      }
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
        dateOfBirth: formatForInput(selectedMember.dateOfBirth),
        placeOfBirth: selectedMember.placeOfBirth || "",
        gender: selectedMember.gender || "",
        email: selectedMember.email || "",
        phone: selectedMember.phone || "",
        mobile: selectedMember.mobile || "",
        address: selectedMember.address || "",
        city: selectedMember.city || "",
        province: selectedMember.province || "",
        postalCode: selectedMember.postalCode || "",
        country: selectedMember.country || "Italia",
        cardNumber: selectedMember.cardNumber || "",
        cardIssueDate: formatForInput(selectedMember.cardIssueDate),
        cardExpiryDate: formatForInput(selectedMember.cardExpiryDate),
        entityCardType: selectedMember.entityCardType || "",
        entityCardNumber: selectedMember.entityCardNumber || "",
        entityCardIssueDate: formatForInput(selectedMember.entityCardIssueDate),
        entityCardExpiryDate: formatForInput(selectedMember.entityCardExpiryDate),
        notes: selectedMember.notes || "",
        categoryId: selectedMember.categoryId || undefined,
        subscriptionTypeId: selectedMember.subscriptionTypeId || undefined,
        hasMedicalCertificate: selectedMember.hasMedicalCertificate || false,
        medicalCertificateExpiry: formatForInput(selectedMember.medicalCertificateExpiry),
        active: selectedMember.active !== false,
        photoUrl: selectedMember.photoUrl || null,
        isMinor: selectedMember.isMinor || false,
        motherFirstName: selectedMember.motherFirstName || "",
        motherLastName: selectedMember.motherLastName || "",
        motherFiscalCode: selectedMember.motherFiscalCode || "",
        motherEmail: selectedMember.motherEmail || "",
        motherPhone: selectedMember.motherPhone || "",
        motherMobile: selectedMember.motherMobile || "",
        fatherFirstName: selectedMember.fatherFirstName || "",
        fatherLastName: selectedMember.fatherLastName || "",
        fatherFiscalCode: selectedMember.fatherFiscalCode || "",
        fatherEmail: selectedMember.fatherEmail || "",
        fatherPhone: selectedMember.fatherPhone || "",
        fatherMobile: selectedMember.fatherMobile || "",
      });
      // Ensure we are on the anagrafica tab when loading a member
      if (activeTab === "anagrafica" || activeTab === "") {
        setActiveTab("anagrafica");
      }
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
          description: `Il codice fiscale è già utilizzato da: ${error.conflictWith.lastName} ${error.conflictWith.firstName}`,
          variant: "destructive"
        });
      } else {
        toast({ title: "Errore", description: error.message, variant: "destructive" });
      }
    },
  });

  const addEnrollmentMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await apiRequest("POST", "/api/enrollments", {
        memberId: selectedMemberId,
        courseId,
        status: "active"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments", "member", selectedMemberId] });
      toast({ title: "Iscrizione corso aggiunta" });
      setSelectedCourseToAdd("");
    },
    onError: (error: any) => {
      toast({ title: "Errore iscrizione corso", description: error.message, variant: "destructive" });
    }
  });

  const removeEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      await apiRequest("DELETE", `/api/enrollments/${enrollmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments", "member", selectedMemberId] });
      toast({ title: "Iscrizione corso rimossa" });
    },
    onError: (error: any) => {
      toast({ title: "Errore rimozione corso", description: error.message, variant: "destructive" });
    }
  });

  const addWorkshopEnrollmentMutation = useMutation({
    mutationFn: async (workshopId: number) => {
      await apiRequest("POST", "/api/workshop-enrollments", { memberId: selectedMemberId, workshopId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshop-enrollments", "member", selectedMemberId] });
      toast({ title: "Iscrizione workshop aggiunta" });
      setSelectedWorkshopToAdd("");
    },
    onError: (error: any) => {
      toast({ title: "Errore iscrizione workshop", description: error.message, variant: "destructive" });
    }
  });

  const removeWorkshopEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      await apiRequest("DELETE", `/api/workshop-enrollments/${enrollmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshop-enrollments", "member", selectedMemberId] });
      toast({ title: "Iscrizione workshop rimossa" });
    },
    onError: (error: any) => {
      toast({ title: "Errore rimozione workshop", description: error.message, variant: "destructive" });
    }
  });

  // Query per metodi di pagamento
  const { data: paymentMethods } = useQuery<any[]>({
    queryKey: ["/api/payment-methods"],
  });

  // Mutation per creare pagamento
  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/payments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments", "member", selectedMemberId] });
      toast({ title: "Pagamento registrato con successo" });
      setShowNewPaymentDialog(false);
      setNewPaymentType("");
      setNewPaymentMethod("");
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleCreatePayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      memberId: selectedMemberId,
      amount: formData.get("amount") as string,
      type: formData.get("type") as string,
      description: formData.get("description") as string || null,
      dueDate: formData.get("dueDate") as string || null,
      paymentMethod: formData.get("paymentMethod") as string || null,
      paymentMethodId: paymentMethods?.find(m => m.name === formData.get("paymentMethod"))?.id || null,
      status: "pending",
      notes: formData.get("notes") as string || null,
    };
    createPaymentMutation.mutate(data);
  };

  const handleSave = () => {
    const errors: string[] = [];
    if (!formData.firstName?.trim()) errors.push("Nome");
    if (!formData.lastName?.trim()) errors.push("Cognome");
    if (!formData.fiscalCode?.trim()) errors.push("Codice Fiscale");
    if (!formData.email?.trim()) errors.push("Email");

    if (errors.length > 0) {
      toast({
        title: "Dati mancanti",
        description: `I seguenti campi sono obbligatori: ${errors.join(", ")}.`,
        variant: "destructive"
      });
      return;
    }

    if (formData.fiscalCode && formData.fiscalCode.trim().length !== 16) {
      toast({
        title: "Codice Fiscale non valido",
        description: "Il codice fiscale deve essere di 16 caratteri.",
        variant: "destructive"
      });
      return;
    }

    const normalizeEmpty = (val: string | null | undefined): string | undefined => {
      if (!val || (typeof val === 'string' && val.trim() === "")) return undefined;
      return typeof val === 'string' ? val.trim() : undefined;
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
      address: normalizeEmpty(formData.address),
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
      photoUrl: formData.photoUrl,
      isMinor: formData.isMinor === true,
      motherFirstName: normalizeEmpty(formData.motherFirstName),
      motherLastName: normalizeEmpty(formData.motherLastName),
      motherFiscalCode: normalizeEmpty(formData.motherFiscalCode),
      motherEmail: normalizeEmpty(formData.motherEmail),
      motherPhone: normalizeEmpty(formData.motherPhone),
      motherMobile: normalizeEmpty(formData.motherMobile),
      fatherFirstName: normalizeEmpty(formData.fatherFirstName),
      fatherLastName: normalizeEmpty(formData.fatherLastName),
      fatherFiscalCode: normalizeEmpty(formData.fatherFiscalCode),
      fatherEmail: normalizeEmpty(formData.fatherEmail),
      fatherPhone: normalizeEmpty(formData.fatherPhone),
      fatherMobile: normalizeEmpty(formData.fatherMobile),
    };
    saveMutation.mutate(dataToSave);
  };

  const handleNew = () => {
    setSelectedMemberId(null);
    setFormData({ country: "Italia" });
    // Clear URL param when creating new member
    setLocation("/maschera-input");
  };

  const handleMemberSelect = (member: Member) => {
    setSelectedMemberId(member.id);
    setLocation(`/maschera-input?memberId=${member.id}`);

    // Popola immediatamente tutti i campi del form
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      fiscalCode: member.fiscalCode || "",
      dateOfBirth: formatForInput(member.dateOfBirth),
      placeOfBirth: member.placeOfBirth || "",
      gender: member.gender || "",
      email: member.email || "",
      phone: member.phone || "",
      mobile: member.mobile || "",
      address: member.address || "",
      city: member.city || "",
      province: member.province || "",
      postalCode: member.postalCode || "",
      country: member.country || "Italia",
      cardNumber: member.cardNumber || "",
      cardIssueDate: formatForInput(member.cardIssueDate),
      cardExpiryDate: formatForInput(member.cardExpiryDate),
      entityCardType: member.entityCardType || "",
      entityCardNumber: member.entityCardNumber || "",
      entityCardIssueDate: formatForInput(member.entityCardIssueDate),
      entityCardExpiryDate: formatForInput(member.entityCardExpiryDate),
      notes: member.notes || "",
      categoryId: member.categoryId || undefined,
      subscriptionTypeId: member.subscriptionTypeId || undefined,
      hasMedicalCertificate: member.hasMedicalCertificate || false,
      medicalCertificateExpiry: formatForInput(member.medicalCertificateExpiry),
      active: member.active !== false,
      photoUrl: member.photoUrl || null,
      isMinor: member.isMinor || false,
      motherFirstName: member.motherFirstName || "",
      motherLastName: member.motherLastName || "",
      motherFiscalCode: member.motherFiscalCode || "",
      motherEmail: member.motherEmail || "",
      motherPhone: member.motherPhone || "",
      motherMobile: member.motherMobile || "",
      fatherFirstName: member.fatherFirstName || "",
      fatherLastName: member.fatherLastName || "",
      fatherFiscalCode: member.fatherFiscalCode || "",
      fatherEmail: member.fatherEmail || "",
      fatherPhone: member.fatherPhone || "",
      fatherMobile: member.fatherMobile || "",
    });
  };

  const handleAutocompleteSelect = handleMemberSelect;

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
    if (expiry < now) return { status: "expired", label: "Scaduta", color: "bg-destructive/100 text-destructive800 dark:bg-destructive/900/30 dark:text-destructive400" };
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (expiry < thirtyDays) return { status: "expiring", label: "In Scadenza", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" };
    return { status: "active", label: "Attiva", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" };
  };

  const cardStatus = getCardStatus();
  const generatedMemberId = selectedMemberId ? String(selectedMemberId).padStart(7, '0') : "0000001";

  const tabs = [
    { id: "anagrafica", label: "Anagrafica", icon: User },
    { id: "corsi", label: "Corsi", icon: BookOpen },
    { id: "workshop", label: "Workshop", icon: Calendar },
    { id: "pagamenti", label: "Pagamenti", icon: CreditCard },
    { id: "tessere", label: "Tessere", icon: IdCard },
    { id: "allenamenti", label: "Presenze", icon: Dumbbell },
    { id: "buoni", label: "Buoni", icon: Gift },
    { id: "certificati", label: "Certificati", icon: FileText },
    { id: "gare", label: "Gare", icon: Trophy },
    { id: "membership", label: "Membership", icon: Users },
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
              <MemberSearch
                onSelect={handleMemberSelect}
                placeholder="Cerca partecipante..."
                useServerSearch={true}
              />
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
              <div className="hidden lg:flex gap-2">
      <ExportWizard 
        filename="anagrafica_completa"
        title="Esporta Anagrafica"
        apiEndpoint="/api/export"
        apiParams={{ table: 'members' }}
        columns={[
              { key: 'id', label: 'ID Database', default: true },
          { key: 'lastName', label: 'Cognome', default: true },
          { key: 'firstName', label: 'Nome', default: true },
          { key: 'fiscalCode', label: 'Codice Fiscale', default: true },
          { key: 'email', label: 'Email', default: true },
          { key: 'phone', label: 'Telefono', default: true },
          { key: 'cardNumber', label: 'Tessera', default: true },
          { key: 'hasMedicalCertificate', label: 'Cert. Medico', default: true, type: 'boolean' },
          { key: 'dateOfBirth', label: 'Data di Nascita', type: 'date' },
          { key: 'placeOfBirth', label: 'Luogo Nascita' },
          { key: 'city', label: 'Città' },
          { key: 'province', label: 'Provincia' }
        ]}
      />
    </div>
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
            <Card key={selectedMemberId || 'new'}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5" />
                  Anagrafica
                </CardTitle>
                {selectedMember?.dataQualityFlag === 'mancano_dati_obbligatori' && (
                  <div className="bg-red-50 border-l-4 border-red-600 p-4 mt-4 rounded-md shadow-sm">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                      <div>
                        <span className="text-sm font-bold text-red-800 block">CF MANCANTE — Tessera non assegnabile</span>
                        <span className="text-xs text-red-700">Impossibile completare il tesseramento senza un Codice Fiscale valido.</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Foto Profilo */}
                <div className="flex flex-col items-center space-y-4 bg-muted/10 p-4 rounded-xl border border-dashed border-muted/50 mb-6">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-white shadow-sm">
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                        <User className="w-8 h-8 mb-1 opacity-40" />
                        <span className="text-[10px] uppercase font-bold tracking-tighter">Foto</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Label htmlFor="photo-upload-home" className="cursor-pointer bg-primary/10 text-primary px-3 py-1 rounded-md text-xs font-medium hover:bg-primary/20 transition-colors">
                      Carica Foto
                    </Label>
                    <Input
                      id="photo-upload-home"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 1024 * 1024) return toast({ title: "File troppo grande (max 1MB)", variant: "destructive" });
                          const reader = new FileReader();
                          reader.onloadend = () => setFormData(p => ({ ...p, photoUrl: reader.result as string }));
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {formData.photoUrl && (
                      <Button variant="ghost" size="sm" onClick={() => setFormData(p => ({ ...p, photoUrl: null }))} className="h-6 px-2 text-[10px] text-destructive">
                        Rimuovi
                      </Button>
                    )}
                  </div>
                </div>
                {/* Row 1: ID, Cognome, Nome, Data Nascita */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>ID Partecipante</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700">Auto</Badge>
                      <Input
                        value={generatedMemberId}
                        readOnly
                        className="bg-warning/50 border-warning200 font-mono dark:bg-warning/900/20 dark:border-warning700"
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
                      useServerSearch={true}
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
                      useServerSearch={true}
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
                    <Label>Tipologia Partecipante</Label>
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
                          toast({ title: "Tipologia partecipante creata" });
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
                    <Label>Codice Fiscale *</Label>
                    <Input
                      value={formData.fiscalCode || ""}
                      onChange={(e) => handleFiscalCodeChange(e.target.value)}
                      className="font-mono uppercase transition-all focus:ring-2 focus:ring-primary/20"
                      placeholder="Codice Fiscale"
                      maxLength={16}
                      data-testid="input-fiscalcode"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-3 w-4 h-4 text-muted-foreground opacity-50" />
                      <Input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-10 transition-all focus:ring-2 focus:ring-primary/20"
                        placeholder="email@esempio.com"
                        data-testid="input-email"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Telefono</Label>
                    <AutocompleteInput
                      value={formData.phone || ""}
                      onChange={(v) => setFormData(prev => ({ ...prev, phone: v }))}
                      onMemberSelect={handleAutocompleteSelect}
                      useServerSearch={true}
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
                      useServerSearch={true}
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
                      value={formData.address || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
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

                {/* Minorenne & Dati Genitori */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isMinorHome"
                      checked={formData.isMinor || false}
                      onChange={(e) => setFormData(p => ({ ...p, isMinor: e.target.checked }))}
                      className="w-4 h-4 rounded border-muted-foreground"
                    />
                    <Label htmlFor="isMinorHome" className="font-bold cursor-pointer">Partecipante Minorenne</Label>
                  </div>

                  {(formData.isMinor || (formData.dateOfBirth && (new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear() < 18))) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-4 rounded-lg border">
                      {/* Madre */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-primary border-b pb-1">Dati Madre</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Nome" value={formData.motherFirstName || ""} onChange={e => setFormData(p => ({ ...p, motherFirstName: e.target.value }))} />
                          <Input placeholder="Cognome" value={formData.motherLastName || ""} onChange={e => setFormData(p => ({ ...p, motherLastName: e.target.value }))} />
                        </div>
                        <Input placeholder="Codice Fiscale" className="font-mono uppercase" value={formData.motherFiscalCode || ""} onChange={e => setFormData(p => ({ ...p, motherFiscalCode: e.target.value.toUpperCase() }))} />
                        <Input placeholder="Email" value={formData.motherEmail || ""} onChange={e => setFormData(p => ({ ...p, motherEmail: e.target.value }))} />
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Telefono" value={formData.motherPhone || ""} onChange={e => setFormData(p => ({ ...p, motherPhone: e.target.value }))} />
                          <Input placeholder="Cellulare" value={formData.motherMobile || ""} onChange={e => setFormData(p => ({ ...p, motherMobile: e.target.value }))} />
                        </div>
                      </div>
                      {/* Padre */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-primary border-b pb-1">Dati Padre</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Nome" value={formData.fatherFirstName || ""} onChange={e => setFormData(p => ({ ...p, fatherFirstName: e.target.value }))} />
                          <Input placeholder="Cognome" value={formData.fatherLastName || ""} onChange={e => setFormData(p => ({ ...p, fatherLastName: e.target.value }))} />
                        </div>
                        <Input placeholder="Codice Fiscale" className="font-mono uppercase" value={formData.fatherFiscalCode || ""} onChange={e => setFormData(p => ({ ...p, fatherFiscalCode: e.target.value.toUpperCase() }))} />
                        <Input placeholder="Email" value={formData.fatherEmail || ""} onChange={e => setFormData(p => ({ ...p, fatherEmail: e.target.value }))} />
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Telefono" value={formData.fatherPhone || ""} onChange={e => setFormData(p => ({ ...p, fatherPhone: e.target.value }))} />
                          <Input placeholder="Cellulare" value={formData.fatherMobile || ""} onChange={e => setFormData(p => ({ ...p, fatherMobile: e.target.value }))} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Row 5: Rilascio Tessera */}
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
                    Tessera Partecipante
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Stato:</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${cardStatus.color}`} data-testid="text-card-status">
                          {cardStatus.label}
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#e11d48]/20 bg-[#e11d48]/5 hover:bg-[#e11d48]/10 text-primary font-bold"
                        onClick={() => {
                          if (selectedMember) {
                            setSelectedMemberForCard(selectedMember);
                            setIsCardDialogOpen(true);
                          } else {
                            toast({ title: "Seleziona un iscritto per generare la tessera", variant: "destructive" });
                          }
                        }}
                      >
                        <Smartphone className="w-4 h-4 mr-2" />
                        Card Digitale
                      </Button>
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entityCardIssueDate">Data Rilascio Ente</Label>
                      <Input
                        id="entityCardIssueDate"
                        type="date"
                        value={formData.entityCardIssueDate || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, entityCardIssueDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entityCardExpiryDate">Data Scadenza Ente</Label>
                      <Input
                        id="entityCardExpiryDate"
                        type="date"
                        value={formData.entityCardExpiryDate || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, entityCardExpiryDate: e.target.value }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Elenco Tessere Attive (da memberships) */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <IdCard className="w-5 h-5" />
                    Tessere (Gestione Tessere)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedMemberId ? (
                    <p className="text-sm text-muted-foreground">Seleziona un membro per visualizzare le tessere collegate</p>
                  ) : loadingMemberships ? (
                    <Skeleton className="h-16 w-full" />
                  ) : errorMemberships ? (
                    <p className="text-sm text-destructive">Errore nel caricamento delle tessere collegate</p>
                  ) : memberMemberships && memberMemberships.length > 0 ? (
                    <div className="space-y-2">
                      {memberMemberships.map((m: any) => (
                        <div key={m.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                          <div>
                            <p className="font-medium text-sm">
                              {m.membershipNumber} <span className="text-muted-foreground font-normal ml-2">{m.barcode && `(${m.barcode})`}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Dal {new Date(m.issueDate).toLocaleDateString('it-IT')} al {new Date(m.expiryDate).toLocaleDateString('it-IT')}
                              {m.type && ` - Tipo: ${m.type}`}
                            </p>
                          </div>
                          <Badge variant={m.status === 'active' && new Date(m.expiryDate) >= new Date() ? 'default' : 'secondary'}>
                            {m.status === 'active' && new Date(m.expiryDate) >= new Date() ? 'Attiva' : 'Scaduta/Inattiva'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Il partecipante non ha nessuna tessera registrata nel sistema (Gestione Tessere).</p>
                  )}
                </CardContent>
              </Card>
              {/* Actions */}
              <div className="flex justify-end gap-2 mt-6">
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

          {/* Tab Pagamenti */}
          <TabsContent value="pagamenti" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Pagamenti
                </CardTitle>
                {selectedMemberId && (
                  <Button
                    size="sm"
                    onClick={() => setShowNewPaymentDialog(true)}
                    data-testid="button-new-payment-member"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Nuovo Pagamento
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {!selectedMemberId ? (
                  <p className="text-muted-foreground">Seleziona un membro per visualizzare i pagamenti</p>
                ) : loadingPayments ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : errorPayments ? (
                  <p className="text-destructive">Errore nel caricamento dei pagamenti</p>
                ) : memberPayments && memberPayments.length > 0 ? (
                  <div className="space-y-2">
                    {memberPayments.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{p.description || p.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {p.dueDate} {p.paymentMethod && `• ${p.paymentMethod}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">€{p.amount}</p>
                          <Badge variant={p.status === 'paid' ? 'default' : p.status === 'overdue' ? 'destructive' : 'secondary'}>
                            {p.status === 'paid' ? 'Pagato' : p.status === 'overdue' ? 'Scaduto' : 'In Attesa'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nessun pagamento registrato</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Corsi */}
          <TabsContent value="corsi" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Corsi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedMemberId ? (
                  <p className="text-muted-foreground">Seleziona un membro per visualizzare i corsi</p>
                ) : (
                  <div className="space-y-8">
                    {/* Sezione Corsi Regolari */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg border-b pb-2">Corsi Regolari</h3>

                      <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-2">
                          <Label>Aggiungi Corso</Label>
                          <CourseSelector
                            courses={courses || []}
                            instructors={instructors || []}
                            categories={categories || []}
                            studios={studios || []}
                            selectedCourseId={selectedCourseToAdd}
                            onSelect={setSelectedCourseToAdd}
                            excludeCourseIds={memberEnrollments?.map((e: any) => e.courseId) || []}
                          />
                        </div>
                        <Button
                          onClick={() => {
                            if (selectedCourseToAdd) addEnrollmentMutation.mutate(parseInt(selectedCourseToAdd));
                          }}
                          disabled={!selectedCourseToAdd || addEnrollmentMutation.isPending}
                        >
                          <Plus className="w-4 h-4 mr-2" /> Aggiungi
                        </Button>
                      </div>

                      {loadingEnrollments ? (
                        <div className="space-y-2">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ) : memberEnrollments && memberEnrollments.length > 0 ? (
                        <div className="space-y-2">
                          {memberEnrollments.map((e: any) => {
                            const course = courses?.find((c: any) => c.id === e.courseId);
                            return (
                              <div key={e.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group">
                                <div>
                                  <p className="font-medium">{course?.name || 'Corso sconosciuto'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Iscritto il: {new Date(e.enrollmentDate).toLocaleDateString('it-IT')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={e.status === 'active' ? 'default' : 'secondary'}>
                                    {e.status === 'active' ? 'Attivo' : e.status}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      if (confirm("Rimuovere l'iscrizione a questo corso?")) {
                                        removeEnrollmentMutation.mutate(e.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Nessuna iscrizione attiva.</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Workshop */}
          <TabsContent value="workshop" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg text-purple-600">
                  <Calendar className="w-5 h-5" />
                  Workshop & Eventi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedMemberId ? (
                  <p className="text-muted-foreground text-center py-8">Seleziona un membro per gestire i workshop</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 space-y-2">
                        <Label>Aggiungi Workshop</Label>
                        <Select value={selectedWorkshopToAdd} onValueChange={setSelectedWorkshopToAdd}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona workshop da aggiungere..." />
                          </SelectTrigger>
                          <SelectContent>
                            {workshops?.filter(w => w.active && !memberWorkshopEnrollments?.some((e: any) => e.workshopId === w.id)).map((workshop: any) => (
                              <SelectItem key={workshop.id} value={workshop.id.toString()}>
                                {workshop.name} ({new Date(workshop.startDate).toLocaleDateString('it-IT')})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={() => {
                          if (selectedWorkshopToAdd) addWorkshopEnrollmentMutation.mutate(parseInt(selectedWorkshopToAdd));
                        }}
                        disabled={!selectedWorkshopToAdd || addWorkshopEnrollmentMutation.isPending}
                      >
                        <Plus className="w-4 h-4 mr-2" /> Aggiungi
                      </Button>
                    </div>

                    {memberWorkshopEnrollments && memberWorkshopEnrollments.length > 0 ? (
                      <div className="space-y-2">
                        {memberWorkshopEnrollments.map((e: any) => {
                          const workshop = workshops?.find((w: any) => w.id === e.workshopId);
                          return (
                            <div key={e.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group">
                              <div>
                                <p className="font-medium">{workshop?.name || 'Workshop sconosciuto'}</p>
                                <p className="text-xs text-muted-foreground">
                                  Data: {workshop?.startDate ? new Date(workshop.startDate).toLocaleDateString('it-IT') : '-'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                                  Iscritto
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    if (confirm("Rimuovere l'iscrizione a questo workshop?")) {
                                      removeWorkshopEnrollmentMutation.mutate(e.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Nessun workshop registrato.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Certificati */}
          <TabsContent value="certificati" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Certificati Medici
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedMemberId ? (
                  <p className="text-muted-foreground">Seleziona un membro per visualizzare i certificati</p>
                ) : loadingCertificates ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : errorCertificates ? (
                  <p className="text-destructive">Errore nel caricamento dei certificati</p>
                ) : memberCertificates && memberCertificates.length > 0 ? (
                  <div className="space-y-2">
                    {memberCertificates.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{c.type || 'Certificato Medico'}</p>
                          <p className="text-sm text-muted-foreground">Rilasciato: {c.issueDate}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">Scadenza: {c.expiryDate}</p>
                          <Badge variant={new Date(c.expiryDate) < new Date() ? 'destructive' : 'default'}>
                            {new Date(c.expiryDate) < new Date() ? 'Scaduto' : 'Valido'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">
                      {formData.hasMedicalCertificate
                        ? `Certificato presente - Scadenza: ${formData.medicalCertificateExpiry || 'Non specificata'}`
                        : 'Nessun certificato medico registrato'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Membership */}
          <TabsContent value="membership" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Abbonamenti
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedMemberId ? (
                  <p className="text-muted-foreground">Seleziona un membro per visualizzare gli abbonamenti</p>
                ) : loadingMemberships ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : errorMemberships ? (
                  <p className="text-destructive">Errore nel caricamento degli abbonamenti</p>
                ) : memberMemberships && memberMemberships.length > 0 ? (
                  <div className="space-y-2">
                    {memberMemberships.map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{m.type || 'Abbonamento'}</p>
                          <p className="text-sm text-muted-foreground">Dal {m.startDate} al {m.endDate}</p>
                        </div>
                        <Badge variant={m.status === 'active' ? 'default' : 'secondary'}>
                          {m.status === 'active' ? 'Attivo' : m.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nessun abbonamento registrato</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Allenamenti (Presenze) */}
          <TabsContent value="allenamenti" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5" />
                  Presenze
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedMemberId ? (
                  <p className="text-muted-foreground">Seleziona un membro per visualizzare le presenze</p>
                ) : loadingAttendances ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : errorAttendances ? (
                  <p className="text-destructive">Errore nel caricamento delle presenze</p>
                ) : memberAttendances && memberAttendances.length > 0 ? (
                  <div className="space-y-2">
                    {memberAttendances.slice(0, 20).map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{a.date}</p>
                          <p className="text-sm text-muted-foreground">{a.checkInTime} - {a.checkOutTime || 'In corso'}</p>
                        </div>
                        <Badge variant="default">Presente</Badge>
                      </div>
                    ))}
                    {memberAttendances.length > 20 && (
                      <p className="text-sm text-muted-foreground text-center">
                        ... e altre {memberAttendances.length - 20} presenze
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nessuna presenza registrata</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Buoni - Placeholder */}
          <TabsContent value="buoni" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Buoni
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Nessun buono registrato per questo membro</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Gare - Placeholder */}
          <TabsContent value="gare" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Gare
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Nessuna gara registrata per questo membro</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Vacanze - Placeholder */}
          <TabsContent value="vacanze" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="w-5 h-5" />
                  Vacanze
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Nessuna vacanza registrata per questo membro</p>
              </CardContent>
            </Card>
          </TabsContent>
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
      <DuplicateMergeModal 
        open={showDuplicatesModal} 
        onOpenChange={setShowDuplicatesModal} 
        duplicates={duplicateFiscalCodes || []} 
        onNavigateToMember={(id) => {
          setShowDuplicatesModal(false);
          setSelectedMemberId(id);
          setLocation(`/?memberId=${id}`);
        }} 
      />

      {/* New Payment Dialog */}
      <Dialog open={showNewPaymentDialog} onOpenChange={(open) => {
        setShowNewPaymentDialog(open);
        if (!open) {
          setNewPaymentType("");
          setNewPaymentMethod("");
        }
      }}>
        <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Nuovo Pagamento
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePayment} className="space-y-4">
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Cliente:</p>
              <p className="font-medium">{selectedMember?.lastName} {selectedMember?.firstName}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment-type">Tipo *</Label>
                <Select
                  name="type"
                  required
                  value={newPaymentType}
                  onValueChange={setNewPaymentType}
                >
                  <SelectTrigger data-testid="select-payment-type">
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
                <Label htmlFor="payment-amount">Importo (€) *</Label>
                <Input
                  id="payment-amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  data-testid="input-payment-amount"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-description">Descrizione</Label>
              <Input
                id="payment-description"
                name="description"
                placeholder="Es: Quota corso Yoga"
                data-testid="input-payment-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment-due-date">Data Scadenza</Label>
                <Input
                  id="payment-due-date"
                  name="dueDate"
                  type="date"
                  data-testid="input-payment-due-date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Metodo Pagamento</Label>
                <Select
                  name="paymentMethod"
                  value={newPaymentMethod}
                  onValueChange={setNewPaymentMethod}
                >
                  <SelectTrigger data-testid="select-payment-method">
                    <SelectValue placeholder="Seleziona metodo" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods?.map((method: any) => (
                      <SelectItem key={method.id} value={method.name}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-notes">Note</Label>
              <Textarea
                id="payment-notes"
                name="notes"
                placeholder="Note aggiuntive..."
                className="h-20"
                data-testid="input-payment-notes"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewPaymentDialog(false)}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={createPaymentMutation.isPending}
                data-testid="button-submit-payment"
              >
                {createPaymentMutation.isPending ? "Salvataggio..." : "Registra Pagamento"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Membership Card Dialog */}
      <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
        <DialogContent className="max-w-md bg-white border-2 max-h-[95vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4 mb-4">
            <DialogTitle className="text-2xl font-black italic tracking-tighter">Anteprima Card</DialogTitle>
          </DialogHeader>

          {selectedMemberForCard && (
            <MembershipCard member={selectedMemberForCard} />
          )}

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setIsCardDialogOpen(false)} className="w-full font-bold">
              CHIUDI
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
