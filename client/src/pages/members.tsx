import { useState, useEffect, useRef, useMemo, Fragment } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link, useSearch, useLocation } from "wouter";
import { validateFiscalCode, parseFiscalCode, getPlaceName } from "@/lib/fiscalCodeUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { hasWritePermission } from "@/App";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Search, Edit, Trash2, Users, GraduationCap, CreditCard, FileText, ChevronLeft, ChevronRight, ChevronUp, Download, Upload, Camera, Smartphone, Coins, AlertTriangle } from "lucide-react";
import { MembershipCard } from "@/components/membership-card";
import { Skeleton } from "@/components/ui/skeleton";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { cn } from "@/lib/utils";
import type { Member, InsertMember, Attendance } from "@shared/schema";
import { DuplicateMergeModal } from "@/components/duplicate-merge-modal";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Members() {
  const { toast } = useToast();
  const { user } = useAuth();
  const canWrite = hasWritePermission(user, "/anagrafica_a_lista");
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const initialSearch = urlParams.get('search') || "";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [stagioneFilter, setStagioneFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [hasMedicalCertFilter, setHasMedicalCertFilter] = useState("all");
  const [isMinorFilter, setIsMinorFilter] = useState("all");
  const [participantTypeFilter, setParticipantTypeFilter] = useState("all");
  const [hasCardFilter, setHasCardFilter] = useState("all");
  const [hasEntityCardFilter, setHasEntityCardFilter] = useState("all");
  const [hasEmailFilter, setHasEmailFilter] = useState("all");
  const [hasPhoneFilter, setHasPhoneFilter] = useState("all");
  const [missingFiscalCodeFilter, setMissingFiscalCodeFilter] = useState("all");
  const [issuesFilter, setIssuesFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);

  const [isShowingAll, setIsShowingAll] = useState(false);
  const previousFilters = useRef<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Merge state
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [mergeCandidates, setMergeCandidates] = useState<any[]>([]);
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [manualMergeMember1, setManualMergeMember1] = useState<any>(null);
  const [manualMergeMember2, setManualMergeMember2] = useState<any>(null);
  const [showParentFields, setShowParentFields] = useState(false);
  const [hasMedicalCert, setHasMedicalCert] = useState(false);
  const [isEnrollmentDialogOpen, setIsEnrollmentDialogOpen] = useState(false);
  const [selectedMemberForEnrollment, setSelectedMemberForEnrollment] = useState<Member | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("none");
  const [isMembershipDialogOpen, setIsMembershipDialogOpen] = useState(false);
  const [selectedMemberForMembership, setSelectedMemberForMembership] = useState<Member | null>(null);
  const [fiscalCodeError, setFiscalCodeError] = useState<string>("");
  const [autoFilledData, setAutoFilledData] = useState({ dateOfBirth: "", gender: "", placeOfBirth: "" });
  const [selectedCourseToAdd, setSelectedCourseToAdd] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState<string>("");
  const [attendanceTime, setAttendanceTime] = useState<string>("");
  const [selectedCourseForAttendance, setSelectedCourseForAttendance] = useState<string>("");
  const [memberEnrollments, setMemberEnrollments] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [memberWorkshopEnrollments, setMemberWorkshopEnrollments] = useState<any[]>([]);
  const [selectedWorkshopToAdd, setSelectedWorkshopToAdd] = useState<string>("");
  const [isMinorChecked, setIsMinorChecked] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [selectedMemberForCard, setSelectedMemberForCard] = useState<Member | null>(null);

  const dateOfBirthRef = useRef<HTMLInputElement>(null);
  const genderRef = useRef<HTMLSelectElement>(null);
  const placeOfBirthRef = useRef<HTMLInputElement>(null);

  const [pageSize, setPageSize] = useState<number>(() => {
    const saved = localStorage.getItem('anagrafica_page_size');
    return saved ? parseInt(saved, 10) : 50;
  });

  const handlePageSizeChange = (val: string) => {
    const size = parseInt(val, 10);
    setPageSize(size);
    localStorage.setItem('anagrafica_page_size', val);
    setCurrentPage(1);
  };

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);

    // If a specific filter is applied by the user while "isShowingAll" is true, turn it off.
    if (isShowingAll && (
      debouncedSearch !== "" || stagioneFilter !== "all" || statusFilter !== "all" || genderFilter !== "all" ||
      hasMedicalCertFilter !== "all" || isMinorFilter !== "all" || participantTypeFilter !== "all" ||
      hasCardFilter !== "all" || hasEntityCardFilter !== "all" || hasEmailFilter !== "all" ||
      hasPhoneFilter !== "all" || missingFiscalCodeFilter !== "all" || issuesFilter !== "all" || pageSize !== 50
    )) {
      setIsShowingAll(false);
    }
  }, [debouncedSearch, stagioneFilter, statusFilter, genderFilter, hasMedicalCertFilter, isMinorFilter, participantTypeFilter, hasCardFilter, hasEntityCardFilter, hasEmailFilter, hasPhoneFilter, missingFiscalCodeFilter, issuesFilter, pageSize]);

  const { data: membersData, isLoading } = useQuery<{ members: Member[]; total: number }>({
    queryKey: ["/api/members", { page: currentPage, pageSize: pageSize, search: debouncedSearch, season: stagioneFilter, status: statusFilter, gender: genderFilter, hasMedicalCert: hasMedicalCertFilter, isMinor: isMinorFilter, participantType: participantTypeFilter, hasCard: hasCardFilter, hasEntityCard: hasEntityCardFilter, hasEmail: hasEmailFilter, hasPhone: hasPhoneFilter, missingFiscalCode: missingFiscalCodeFilter, issuesFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        search: debouncedSearch,
        season: stagioneFilter,
        status: statusFilter,
        gender: genderFilter,
        hasMedicalCert: hasMedicalCertFilter,
        isMinor: isMinorFilter,
        participantType: participantTypeFilter,
        hasCard: hasCardFilter,
        hasEntityCard: hasEntityCardFilter,
        hasEmail: hasEmailFilter,
        hasPhone: hasPhoneFilter,
        missingFiscalCode: missingFiscalCodeFilter,
        issuesFilter: issuesFilter,
      });
      const res = await fetch(`/api/members?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
    // Keep previous data when fetching new pages/searches
    staleTime: 60000,
  });

  const { data: totalData } = useQuery<{ total: number }>({
    queryKey: ["/api/members/total"],
    queryFn: async () => {
      const res = await fetch("/api/members?page=1&pageSize=1", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch total members");
      return res.json();
    },
    staleTime: 300000,
  });

  const { data: missingDataCounts } = useQuery<{ missingFiscalCode: number; missingEmail: number; missingPhone: number }>({
    queryKey: ["/api/members/missing-data"],
    staleTime: 300000,
  });

  const { data: duplicateClusters } = useQuery<any[]>({
    queryKey: ["/api/members/duplicates"],
    staleTime: 300000,
  });

  const { data: counts } = useQuery({
    queryKey: ['/api/members/counts-by-type'],
    queryFn: () => fetch('/api/members/counts-by-type').then(r => r.json()),
    staleTime: 30000,
  });

  const membersRaw = useMemo(() => {
    return [...(membersData?.members || [])].sort((a, b) =>
      (a.lastName || (a as any).cognome || '').localeCompare(b.lastName || (b as any).cognome || '', 'it') ||
      (a.firstName || (a as any).nome || '').localeCompare(b.firstName || (b as any).nome || '', 'it')
    );
  }, [membersData?.members]);

  const { sortConfig, handleSort, sortItems, isSortedColumn } = useSortableTable<Member>("lastName");

  const getSortValue = (member: Member, key: string) => {
    switch (key) {
      case "lastName": return member.lastName;
      case "firstName": return member.firstName;
      case "fiscalCode": return member.fiscalCode;
      case "email": return member.email;
      case "mobile": return member.mobile || member.phone || "";
      case "cardNumber": return member.cardNumber;
      case "medicalCert": return member.hasMedicalCertificate ? (member.medicalCertificateExpiry || "9999-12-31") : "";
      case "status": return member.active ? 1 : 0;
      case "crm": return member.crmProfileScore || 0;
      case "coursesCount": return (member as any).activeCourseCount || 0;
      default: return null;
    }
  };

  const members = sortItems(membersRaw, getSortValue);
  const totalMembers = membersData?.total || 0;
  const totalPages = Math.ceil(totalMembers / pageSize);

  const { data: clientCategories } = useQuery<any[]>({
    queryKey: ["/api/client-categories"],
  });

  const { data: participantTypes } = useQuery<any[]>({
    queryKey: ["/api/participant-types"],
  });

  const { data: subscriptionTypes } = useQuery<any[]>({
    queryKey: ["/api/subscription-types"],
  });

  const { data: coursesData } = useQuery<any[]>({
    queryKey: ["/api/courses"],
  });

  const courses = coursesData || [];

  const createMutation = useMutation({
    mutationFn: async (data: InsertMember) => {
      await apiRequest("POST", "/api/members", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/duplicates"] });
      toast({ title: "Cliente creato con successo" });
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error: any) => {
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

  const updateMutation = useMutation<void, any, { id: number; data: Partial<InsertMember> }>({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertMember> }) => {
      await apiRequest("PATCH", `/api/members/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/duplicates"] });
      toast({ title: "Cliente aggiornato con successo" });
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error: any) => {
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

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/members/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/duplicates"] });
      toast({ title: "Cliente eliminato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  // mergeMutation in members.tsx was deleted since DuplicateMergeModal handles it internally now.

  const addEnrollmentMutation = useMutation({
    mutationFn: async (data: { memberId: number; courseId: number }) => {
      await apiRequest("POST", "/api/enrollments", {
        ...data,
        status: "active"
      });
      return data.memberId;
    },
    onSuccess: async (memberId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments?type=corsi"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      // Ricarica le iscrizioni locali
      const res = await fetch(`/api/enrollments?type=corsi&memberId=${memberId}`, { credentials: "include" });
      if (res.ok) {
        setMemberEnrollments(await res.json());
      }
      toast({ title: "Corso aggiunto con successo" });
      setSelectedCourseToAdd("");
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const removeEnrollmentMutation = useMutation({
    mutationFn: async (data: { enrollmentId: number; memberId: number }) => {
      await apiRequest("DELETE", `/api/enrollments/${data.enrollmentId}`, undefined);
      return data.memberId;
    },
    onSuccess: async (memberId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments?type=corsi"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      // Ricarica le iscrizioni locali
      const res = await fetch(`/api/enrollments?type=corsi&memberId=${memberId}`, { credentials: "include" });
      if (res.ok) {
        setMemberEnrollments(await res.json());
      }
      toast({ title: "Iscrizione rimossa con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const addAttendanceMutation = useMutation({
    mutationFn: async (data: { memberId: number; courseId?: number; enrollmentId?: number; attendanceDate: string; notes?: string }) => {
      await apiRequest("POST", "/api/attendances", { ...data, type: "manual" });
      return data.memberId;
    },
    onSuccess: async (memberId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendances"] });
      // Ricarica le presenze locali
      const res = await fetch(`/api/attendances/member/${memberId}`, { credentials: "include" });
      if (res.ok) {
        setAttendances(await res.json());
      }
      toast({ title: "Presenza registrata con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteAttendanceMutation = useMutation({
    mutationFn: async (data: { attendanceId: number; memberId: number }) => {
      await apiRequest("DELETE", `/api/attendances/${data.attendanceId}`, undefined);
      return data.memberId;
    },
    onSuccess: async (memberId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendances"] });
      // Ricarica le presenze locali
      const res = await fetch(`/api/attendances/member/${memberId}`, { credentials: "include" });
      if (res.ok) {
        setAttendances(await res.json());
      }
      toast({ title: "Presenza eliminata con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const addWorkshopEnrollmentMutation = useMutation({
    mutationFn: async (data: { memberId: number; workshopId: number }) => {
      await apiRequest("POST", "/api/workshop-enrollments", data);
      return data.memberId;
    },
    onSuccess: async (memberId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshop-enrollments"] });
      const res = await fetch(`/api/workshop-enrollments?memberId=${memberId}`, { credentials: "include" });
      if (res.ok) {
        setMemberWorkshopEnrollments(await res.json());
      }
      toast({ title: "Workshop aggiunto con successo" });
      setSelectedWorkshopToAdd("");
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const removeWorkshopEnrollmentMutation = useMutation({
    mutationFn: async (data: { enrollmentId: number; memberId: number }) => {
      await apiRequest("DELETE", `/api/workshop-enrollments/${data.enrollmentId}`, undefined);
      return data.memberId;
    },
    onSuccess: async (memberId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshop-enrollments"] });
      const res = await fetch(`/api/workshop-enrollments?memberId=${memberId}`, { credentials: "include" });
      if (res.ok) {
        setMemberWorkshopEnrollments(await res.json());
      }
      toast({ title: "Iscrizione workshop rimossa con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setEditingMember(null);
    setShowParentFields(false);
    setHasMedicalCert(false);
    setSelectedCategoryId("none");
    setFiscalCodeError("");
    setAutoFilledData({ dateOfBirth: "", gender: "", placeOfBirth: "" });
    setMemberWorkshopEnrollments([]);
    setSelectedWorkshopToAdd("");
    setIsMinorChecked(false);
    setPhotoPreview(null);
  };

  useEffect(() => {
    if (editingMember) {
      setHasMedicalCert(editingMember.hasMedicalCertificate || false);
      setIsMinorChecked(editingMember.isMinor || false);
      setPhotoPreview(editingMember.photoUrl || null);
      if (editingMember.dateOfBirth) {
        const dateStr = typeof editingMember.dateOfBirth === 'string' ? editingMember.dateOfBirth : new Date(editingMember.dateOfBirth).toISOString().split('T')[0];
        const age = calculateAge(dateStr);
        setShowParentFields(age < 18 || editingMember.isMinor || false);
      } else {
        setShowParentFields(editingMember.isMinor || false);
      }
    }
  }, [editingMember]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for base64
        toast({ title: "File troppo grande", description: "La foto deve essere inferiore a 1MB", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateAge = (dateOfBirthString: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirthString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleDateOfBirthChange = (date: string) => {
    if (date) {
      const age = calculateAge(date);
      setShowParentFields(age < 18);
    }
  };

  const handleFiscalCodeChange = async (value: string) => {
    const normalized = value.toUpperCase().trim();

    if (!normalized) {
      setFiscalCodeError("");
      setAutoFilledData({ dateOfBirth: "", gender: "", placeOfBirth: "" });
      return;
    }

    if (normalized.length === 16) {
      if (!validateFiscalCode(normalized)) {
        setFiscalCodeError("Codice fiscale non valido");
        return;
      }

      const parsed = parseFiscalCode(normalized);
      if (parsed) {
        setFiscalCodeError("");

        // Fetch city details from API
        let placeName = parsed.placeOfBirth || "";
        try {
          const response = await fetch(`/api/comuni/by-code/${parsed.placeOfBirth}`);
          if (response.ok) {
            const cityData = await response.json();
            placeName = cityData.name;
          }
        } catch (e) {
          console.error("Errore fetch comune:", e);
        }

        setAutoFilledData({
          dateOfBirth: parsed.dateOfBirth,
          gender: parsed.gender,
          placeOfBirth: placeName
        });

        // Auto-compila i campi
        if (dateOfBirthRef.current && !dateOfBirthRef.current.value) {
          dateOfBirthRef.current.value = parsed.dateOfBirth;
          handleDateOfBirthChange(parsed.dateOfBirth);
        }
        if (genderRef.current && !genderRef.current.value) {
          genderRef.current.value = parsed.gender;
        }
        if (placeOfBirthRef.current && !placeOfBirthRef.current.value) {
          placeOfBirthRef.current.value = placeName;
        }

        toast({
          title: "Dati estratti dal CF",
          description: `Data: ${new Date(parsed.dateOfBirth).toLocaleDateString('it-IT')}, Sesso: ${parsed.gender === 'M' ? 'Maschio' : 'Femmina'}, Luogo: ${placeName}`,
        });
      } else {
        setFiscalCodeError("Impossibile estrarre i dati dal codice fiscale");
      }
    } else if (normalized.length < 16) {
      setFiscalCodeError("");
      setAutoFilledData({ dateOfBirth: "", gender: "", placeOfBirth: "" });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: InsertMember = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      fiscalCode: formData.get("fiscalCode") as string || null,
      categoryId: (formData.get("categoryId") && formData.get("categoryId") !== "none") ? parseInt(formData.get("categoryId") as string) : null,
      dateOfBirth: formData.get("dateOfBirth") as string || null,
      placeOfBirth: formData.get("placeOfBirth") as string || null,
      gender: formData.get("gender") as string || null,
      email: formData.get("email") as string || null,
      phone: formData.get("phone") as string || null,
      mobile: formData.get("mobile") as string || null,

      // Dati tessera
      cardNumber: formData.get("cardNumber") as string || null,
      cardIssueDate: formData.get("cardIssueDate") as string || null,
      cardExpiryDate: formData.get("cardExpiryDate") as string || null,

      // Certificato medico
      hasMedicalCertificate: hasMedicalCert,
      medicalCertificateExpiry: hasMedicalCert ? (formData.get("medicalCertificateExpiry") as string || null) : null,

      // Flag minorenne
      isMinor: isMinorChecked,

      // Dati genitori
      motherFirstName: showParentFields ? (formData.get("motherFirstName") as string || null) : null,
      motherLastName: showParentFields ? (formData.get("motherLastName") as string || null) : null,
      motherFiscalCode: showParentFields ? (formData.get("motherFiscalCode") as string || null) : null,
      motherEmail: showParentFields ? (formData.get("motherEmail") as string || null) : null,
      motherPhone: showParentFields ? (formData.get("motherPhone") as string || null) : null,
      motherMobile: showParentFields ? (formData.get("motherMobile") as string || null) : null,

      fatherFirstName: showParentFields ? (formData.get("fatherFirstName") as string || null) : null,
      fatherLastName: showParentFields ? (formData.get("fatherLastName") as string || null) : null,
      fatherFiscalCode: showParentFields ? (formData.get("fatherFiscalCode") as string || null) : null,
      fatherEmail: showParentFields ? (formData.get("fatherEmail") as string || null) : null,
      fatherPhone: showParentFields ? (formData.get("fatherPhone") as string || null) : null,
      fatherMobile: showParentFields ? (formData.get("fatherMobile") as string || null) : null,

      address: formData.get("address") as string || null,
      notes: formData.get("notes") as string || null,
      photoUrl: photoPreview,
      active: true,
      subscriptionTypeId: (formData.get("subscriptionTypeId") && formData.get("subscriptionTypeId") !== "none") ? parseInt(formData.get("subscriptionTypeId") as string) : null,
      entityCardType: (formData.get("entityCardType") && formData.get("entityCardType") !== "none") ? formData.get("entityCardType") as string : null,
      entityCardNumber: formData.get("entityCardNumber") as string || null,
      entityCardIssueDate: formData.get("entityCardIssueDate") as string || null,
      entityCardExpiryDate: formData.get("entityCardExpiryDate") as string || null,
      streetAddress: formData.get("streetAddress") as string || null,
      city: formData.get("city") as string || null,
      province: formData.get("province") as string || null,
      postalCode: formData.get("postalCode") as string || null,
      country: formData.get("country") as string || "Italia",
    } as any;

    if (editingMember) {
      updateMutation.mutate({ id: editingMember.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getMissingData = (member: any) => {
    const missing: string[] = [];
    const isMinor = calculateAge(member.dateOfBirth) < 18;

    // Obligatory for ALL
    if (!member.lastName) missing.push("Cognome");
    if (!member.firstName) missing.push("Nome");
    if (!member.fiscalCode) missing.push("Codice Fiscale");
    if (!member.mobile && !member.phone) missing.push("Telefono/Cellulare");
    if (!member.email) missing.push("Email");

    if (isMinor) {
      if (!member.fatherFirstName && !member.motherFirstName) missing.push("Dati Genitore (Nome)");
      if (!member.fatherLastName && !member.motherLastName) missing.push("Dati Genitore (Cognome)");
    }

    // specific checks based on participantType
    const pTypes = member.participantType
      ? member.participantType.split(',').map((s: string) => s.trim().toUpperCase())
      : [];

    if (pTypes.some((t: string) => ['TESSERATO', 'PARTECIPANTE', 'INSEGNANTE', 'STAFF'].includes(t))) {
      if (!member.cardNumber) missing.push("Tessera");
      if (!member.hasMedicalCertificate) missing.push("Certificato Medico");
      if (!member.entityCardNumber) missing.push("Tessera Ente");
    }

    if (pTypes.includes('PARTECIPANTE')) {
      // Assuming these are tracked somehow, for now just placeholders or comments if not in schema
      // missing.push("Domanda di tesseramento", "Regolamento", "Privacy");
    }

    if (pTypes.includes('INSEGNANTE')) {
      if (!member.tesserinoTecnicoNumber) missing.push("Tesserino Tecnico");
    }

    return missing;
  };

  const exportToCSV = async () => {
    if (totalMembers === 0) {
      toast({ title: "Nessun dato da esportare", variant: "destructive" });
      return;
    }

    toast({ title: "Preparazione esportazione...", description: "Recupero tutti i record in corso. Attendi un istante." });

    try {
      // Fetch ALL matching members based on current filters, overriding pagination
      const params = new URLSearchParams({
        page: "1",
        pageSize: "999999", // get arbitrarily large amount to cover all
        search: debouncedSearch,
        status: statusFilter,
        gender: genderFilter,
        hasMedicalCert: hasMedicalCertFilter,
        isMinor: isMinorFilter,
        participantType: participantTypeFilter,
        hasCard: hasCardFilter,
        hasEntityCard: hasEntityCardFilter,
        hasEmail: hasEmailFilter,
        hasPhone: hasPhoneFilter,
        missingFiscalCode: missingFiscalCodeFilter,
        issuesFilter: issuesFilter,
      });

      const res = await fetch(`/api/members?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Errore nel recupero dati per l'esportazione");

      const data = await res.json();
      const allFilteredMembers: Member[] = data.members;

      if (!allFilteredMembers || allFilteredMembers.length === 0) {
        toast({ title: "Nessun dato da esportare", variant: "destructive" });
        return;
      }

      const headers = ["ID", "Nome", "Cognome", "Codice Fiscale", "Data Nascita", "Luogo Nascita", "Sesso", "Email", "Telefono", "Cellulare", "Indirizzo", "Città", "Provincia", "CAP", "N. Tessera", "Scadenza Tessera", "Certificato Medico", "Scadenza Certificato", "Note", "Stato"];

      const rows = allFilteredMembers.map(member => [
        member.id,
        member.firstName || "",
        member.lastName || "",
        member.fiscalCode || "",
        member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString('it-IT') : "",
        member.placeOfBirth || "",
        member.gender || "",
        member.email || "",
        member.phone || "",
        member.mobile || "",
        member.streetAddress || "",
        member.city || "",
        member.province || "",
        member.postalCode || "",
        member.cardNumber || "",
        member.cardExpiryDate ? new Date(member.cardExpiryDate).toLocaleDateString('it-IT') : "",
        member.hasMedicalCertificate ? "Sì" : "No",
        member.medicalCertificateExpiry ? new Date(member.medicalCertificateExpiry).toLocaleDateString('it-IT') : "",
        member.notes || "",
        member.active ? "Attivo" : "Inattivo"
      ]);

      const escapeCSV = (value: unknown) => {
        const str = String(value ?? "");
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csvContent = "\ufeff" + [headers.map(escapeCSV).join(","), ...rows.map(row => row.map(escapeCSV).join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `clienti_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: "Esportazione completata", description: `Esportati ${allFilteredMembers.length} record.` });

    } catch (err: any) {
      toast({ title: "Errore durante l'esportazione", description: err.message, variant: "destructive" });
    }
  };

  const toggleShowAll = () => {
    if (isShowingAll) {
      // Restore previous state if disabling
      if (previousFilters.current) {
        setSearchQuery(previousFilters.current.searchQuery);
        setStagioneFilter(previousFilters.current.stagioneFilter);
        setStatusFilter(previousFilters.current.statusFilter);
        setGenderFilter(previousFilters.current.genderFilter);
        setHasMedicalCertFilter(previousFilters.current.hasMedicalCertFilter);
        setIsMinorFilter(previousFilters.current.isMinorFilter);
        setParticipantTypeFilter(previousFilters.current.participantTypeFilter);
        setHasCardFilter(previousFilters.current.hasCardFilter);
        setHasEntityCardFilter(previousFilters.current.hasEntityCardFilter);
        setHasEmailFilter(previousFilters.current.hasEmailFilter);
        setHasPhoneFilter(previousFilters.current.hasPhoneFilter);
        setMissingFiscalCodeFilter(previousFilters.current.missingFiscalCodeFilter);
        setIssuesFilter(previousFilters.current.issuesFilter);
        setCurrentPage(previousFilters.current.currentPage);
      }
      setIsShowingAll(false);
    } else {
      // Save current state before clearing
      previousFilters.current = {
        searchQuery,
        stagioneFilter,
        statusFilter,
        genderFilter,
        hasMedicalCertFilter,
        isMinorFilter,
        participantTypeFilter,
        hasCardFilter,
        hasEntityCardFilter,
        hasEmailFilter,
        hasPhoneFilter,
        missingFiscalCodeFilter,
        issuesFilter,
        currentPage
      };

      // Clear all
      setSearchQuery("");
      setStagioneFilter("all");
      setStatusFilter("all");
      setGenderFilter("all");
      setHasMedicalCertFilter("all");
      setIsMinorFilter("all");
      setParticipantTypeFilter("all");
      setHasCardFilter("all");
      setHasEntityCardFilter("all");
      setHasEmailFilter("all");
      setHasPhoneFilter("all");
      setMissingFiscalCodeFilter("all");
      setIssuesFilter("all");
      setCurrentPage(1);

      setIsShowingAll(true);
    }
  };





  const toggleMemberSelection = (memberId: number) => {
    setSelectedMembers(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const toggleAllSelection = () => {
    if (selectedMembers.length === members.length && members.length > 0) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(members.map(m => m.id));
    }
  };



  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap bg-gradient-to-r from-slate-50 to-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] relative overflow-hidden mb-6">
        <div className="absolute top-0 right-[-5%] -mt-8 w-40 h-40 rounded-full bg-primary/5 blur-[40px] pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="hidden sm:flex bg-gradient-to-br from-primary/10 to-primary/5 p-3 rounded-xl border border-primary/10 shadow-inner">
            <Users className="w-8 h-8 text-primary drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">Anagrafica Generale</h1>
            <p className="text-sm font-medium text-slate-500">Gestisci partecipanti, staff e team con ricerca avanzata e filtri multidimensionali</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap relative z-10">
          <div className="flex items-center gap-2 mr-2">
            <Label className="text-sm text-slate-500 hidden sm:block">Per pagina:</Label>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[80px] h-9">
                <SelectValue placeholder="50" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation("/importa")}
            data-testid="button-import-csv"
          >
            <Download className="w-4 h-4 mr-2" />
            Importa CSV
          </Button>
          <Button
            variant="outline"
            onClick={exportToCSV}
            data-testid="button-export-csv"
          >
            <Upload className="w-4 h-4 mr-2" />
            Esporta CSV
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            data-testid="button-add-member"
            disabled={!canWrite}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuovo
          </Button>

          {duplicateClusters && duplicateClusters.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowDuplicatesModal(true)}
              className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Visualizza Duplicati ({duplicateClusters.length})
            </Button>
          )}
          {selectedMembers.length >= 2 && (
            <Button
              variant="default"
              className="bg-purple-600 hover:bg-purple-700"
              onClick={async () => {
                if (selectedMembers.length !== 2) {
                  toast({ title: "Attenzione", description: "Esattamente due anagrafiche devono essere selezionate per il merge visivo.", variant: "destructive" });
                  return;
                }
                setIsMergeDialogOpen(true);
                try {
                  const m1Req = await fetch(`/api/members/${selectedMembers[0]}`);
                  const m1 = await m1Req.json();
                  const m2Req = await fetch(`/api/members/${selectedMembers[1]}`);
                  const m2 = await m2Req.json();
                  setManualMergeMember1(m1);
                  setManualMergeMember2(m2);
                } catch (e) {
                  toast({ title: "Errore", description: "Impossibile recuperare i dati dei membri.", variant: "destructive" });
                  setIsMergeDialogOpen(false);
                }
              }}
              disabled={!canWrite}
            >
              <Users className="w-4 h-4 mr-2" />
              Unisci {selectedMembers.length} Selezionati
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca per cognome, nome, CF o email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-members"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? "bg-primary/10 text-primary border-primary/20" : ""}
                >
                  Filtri
                  {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronRight className="w-4 h-4 ml-2" />}
                </Button>
                <Button
                  variant={isShowingAll ? "default" : "secondary"}
                  onClick={toggleShowAll}
                  data-testid="button-show-all"
                  className={isShowingAll ? "bg-primary text-primary-foreground shadow-sm" : ""}
                >
                  Visualizza tutti
                </Button>
                {isLoading ? (
                  <Badge variant="outline" className="text-sm px-3 py-1.5 h-10 border-muted">
                    <span className="animate-pulse">Calcolo...</span>
                  </Badge>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm px-3 py-1.5 h-10 bg-muted/50 text-muted-foreground">
                      N. {totalMembers} Record Trovati
                    </Badge>
                    {counts && (
                      <div className="flex gap-2">
                        <span style={{ background: 'var(--color-background-info)', color: 'var(--color-text-info)', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500 }}>
                          Partecipanti: {counts.partecipanti?.toLocaleString('it') ?? 0}
                        </span>
                        <span style={{ background: 'var(--color-background-success)', color: 'var(--color-text-success)', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500 }}>
                          Staff: {counts.staff?.toLocaleString('it') ?? 0}
                        </span>
                        <span style={{ background: 'var(--color-background-warning)', color: 'var(--color-text-warning)', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500 }}>
                          Team: {counts.team?.toLocaleString('it') ?? 0}
                        </span>
                        {counts.medici > 0 && (
                          <span style={{ background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500 }}>
                            Medici: {counts.medici?.toLocaleString('it') ?? 0}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Stagione</Label>
                  <Select value={stagioneFilter} onValueChange={setStagioneFilter}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tutti" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte</SelectItem>
                      <SelectItem value="2024-2025">2024-2025</SelectItem>
                      <SelectItem value="2025-2026">2025-2026</SelectItem>
                      <SelectItem value="2026-2027">2026-2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Stato</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tutti" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="active">Attivi</SelectItem>
                      <SelectItem value="inactive">Inattivi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo Partecipante</Label>
                  <Select value={participantTypeFilter} onValueChange={setParticipantTypeFilter}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tutti" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      {participantTypes?.map((pt) => (
                        <SelectItem key={pt.id} value={pt.name}>
                          {pt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Certificato Medico</Label>
                  <Select value={hasMedicalCertFilter} onValueChange={setHasMedicalCertFilter}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tutti" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="yes">Presente</SelectItem>
                      <SelectItem value="no">Assente</SelectItem>
                      <SelectItem value="expired">Scaduto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Età</Label>
                  <Select value={isMinorFilter} onValueChange={setIsMinorFilter}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tutti" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="adult">Maggiorenni</SelectItem>
                      <SelectItem value="minor">Minorenni</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Sesso</Label>
                  <Select value={genderFilter} onValueChange={setGenderFilter}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tutti" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="M">Maschio</SelectItem>
                      <SelectItem value="F">Femmina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tessera Interna</Label>
                  <Select value={hasCardFilter} onValueChange={setHasCardFilter}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tutti" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="yes">Presente</SelectItem>
                      <SelectItem value="no">Assente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tessera Ente</Label>
                  <Select value={hasEntityCardFilter} onValueChange={setHasEntityCardFilter}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tutti" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="yes">Presente</SelectItem>
                      <SelectItem value="no">Assente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Allarmi Dati</Label>
                  <Select value={issuesFilter} onValueChange={setIssuesFilter}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tutti" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="with_issues">Problemi/Mancanti (⚠️)</SelectItem>
                      <SelectItem value="no_issues">Dati completi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 col-span-2 md:col-span-4 lg:col-span-2 flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-full text-muted-foreground"
                    onClick={() => {
                      setStatusFilter("all");
                      setGenderFilter("all");
                      setHasMedicalCertFilter("all");
                      setIsMinorFilter("all");
                      setParticipantTypeFilter("all");
                      setHasCardFilter("all");
                      setHasEntityCardFilter("all");
                      setHasEmailFilter("all");
                      setHasPhoneFilter("all");
                      setMissingFiscalCodeFilter("all");
                      setIssuesFilter("all");
                    }}
                  >
                    Resetta filtri
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl animate-in fade-in zoom-in-95 duration-500 m-4 flex flex-col items-center justify-center">
              <div className="bg-primary/5 p-4 rounded-full mb-4 ring-1 ring-primary/10 shadow-sm">
                <Users className="w-10 h-10 text-primary/60" />
              </div>
              <p className="text-xl font-bold tracking-tight text-slate-800 mb-1">Nessun iscritto trovato</p>
              <p className="text-sm text-slate-500 max-w-[280px]">Nessun risultato combacia con la tua ricerca attuale. Modifica i filtri o crea una nuova anagrafica.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                <span>Totale: {totalMembers} clienti</span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span>Pagina {currentPage} di {totalPages}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={members.length > 0 && selectedMembers.length === members.length}
                        onCheckedChange={toggleAllSelection}
                        aria-label="Seleziona tutti"
                      />
                    </TableHead>
                    <SortableTableHead sortKey="lastName" currentSort={sortConfig} onSort={handleSort}>Cognome</SortableTableHead>
                    <SortableTableHead sortKey="firstName" currentSort={sortConfig} onSort={handleSort}>Nome</SortableTableHead>
                    <SortableTableHead sortKey="fiscalCode" currentSort={sortConfig} onSort={handleSort}>Codice Fiscale</SortableTableHead>
                    <SortableTableHead sortKey="email" currentSort={sortConfig} onSort={handleSort}>Email</SortableTableHead>
                    <SortableTableHead sortKey="mobile" currentSort={sortConfig} onSort={handleSort}>Mobile</SortableTableHead>
                    <SortableTableHead sortKey="cardNumber" currentSort={sortConfig} onSort={handleSort}>Tessera</SortableTableHead>
                    <SortableTableHead sortKey="medicalCert" currentSort={sortConfig} onSort={handleSort}>Cert. Medico</SortableTableHead>
                    <SortableTableHead sortKey="crm" currentSort={sortConfig} onSort={handleSort}>Livello CRM</SortableTableHead>
                    <SortableTableHead sortKey="status" currentSort={sortConfig} onSort={handleSort}>Stato</SortableTableHead>
                    <TableHead className="w-10"></TableHead>
                    <SortableTableHead sortKey="coursesCount" currentSort={sortConfig} onSort={handleSort} className="text-right">Corsi Attivi</SortableTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <Fragment key={member.id}>
                      <TableRow 
                        data-testid={`member-row-${member.id}`} 
                        className="border-b-0 hover:bg-muted/10 cursor-pointer"
                        onClick={() => setLocation(`/maschera-input?memberId=${member.id}`)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedMembers.includes(member.id)}
                            onCheckedChange={() => toggleMemberSelection(member.id)}
                            aria-label={`Seleziona ${member.lastName} ${member.firstName}`}
                          />
                        </TableCell>
                        <TableCell className={cn(isSortedColumn("lastName") && "sorted-column-cell")}>
                          <div className="flex items-center gap-2">
                            <Link href={`/maschera-input?memberId=${member.id}`}>
                              <span
                                className="font-bold hover:underline cursor-pointer"
                                data-testid={`link-member-${member.id}`}
                              >
                                {member.lastName}
                              </span>
                            </Link>
                            {getMissingData(member).length > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertTriangle className="w-4 h-4 text-amber-500 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-sm border-amber-200 bg-amber-50 text-amber-900 shadow-sm p-3">
                                      <p className="font-semibold mb-1">Dati Mancanti ({getMissingData(member).length}):</p>
                                      <ul className="list-disc pl-4 space-y-0.5">
                                        {getMissingData(member).map((item, i) => (
                                          <li key={i}>{item}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={cn(isSortedColumn("firstName") && "sorted-column-cell")}>
                          <Link href={`/maschera-input?memberId=${member.id}`}>
                            <span className="hover:underline cursor-pointer font-bold">
                              {member.firstName}
                            </span>
                          </Link>
                        </TableCell>
                        <TableCell className={cn("font-mono text-sm", isSortedColumn("fiscalCode") && "sorted-column-cell")}>
                          {member.fiscalCode ? member.fiscalCode : (
                            <div className="flex items-center gap-1 text-red-500 font-bold text-xs" title="Manca Dato">
                              <AlertTriangle className="w-3 h-3 fill-red-500 text-white" />
                              <span>Manca Dato</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className={cn(isSortedColumn("email") && "sorted-column-cell")}>
                          {member.email ? member.email : (
                            <div className="flex items-center gap-1 text-red-500 font-bold text-xs" title="Manca Dato">
                              <AlertTriangle className="w-3 h-3 fill-red-500 text-white" />
                              <span>Manca Dato</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className={cn(isSortedColumn("mobile") && "sorted-column-cell")}>
                          {member.mobile || member.phone ? (member.mobile || member.phone) : (
                            <div className="flex items-center gap-1 text-red-500 font-bold text-xs" title="Manca Dato">
                              <AlertTriangle className="w-3 h-3 fill-red-500 text-white" />
                              <span>Manca Dato</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className={cn(isSortedColumn("cardNumber") && "sorted-column-cell")}>
                          {member.cardNumber ? (
                            <div className="text-sm">
                              <div>{member.cardNumber}</div>
                              {member.cardExpiryDate && (
                                <div className="text-xs text-muted-foreground">
                                  Scad. {new Date(member.cardExpiryDate).toLocaleDateString('it-IT')}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-red-500 font-bold text-xs" title="Manca Dato">
                              <AlertTriangle className="w-3 h-3 fill-red-500 text-white" />
                              <span>Manca Dato</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className={cn(isSortedColumn("medicalCert") && "sorted-column-cell")}>
                          {member.hasMedicalCertificate ? (
                            <Badge variant={
                              member.medicalCertificateExpiry && new Date(member.medicalCertificateExpiry) < new Date()
                                ? "destructive"
                                : "default"
                            }>
                              {member.medicalCertificateExpiry
                                ? new Date(member.medicalCertificateExpiry).toLocaleDateString('it-IT')
                                : "Presente"
                              }
                            </Badge>
                          ) : (
                            <div className="flex items-center gap-1 text-red-500 font-bold text-xs" title="Manca Dato">
                              <AlertTriangle className="w-3 h-3 fill-red-500 text-white" />
                              <span>Manca Dato</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className={cn(isSortedColumn("crm") && "sorted-column-cell")}>
                          {member.crmProfileLevel && member.crmProfileLevel !== "NONE" ? (
                            <Badge className={
                              member.crmProfileLevel === 'PLATINUM' ? 'bg-slate-900 border-slate-900 text-white' : 
                              member.crmProfileLevel === 'GOLD' ? 'bg-amber-500 border-amber-500 text-white' : 
                              'bg-slate-200 border-slate-300 text-slate-700 hover:bg-slate-300'
                            }>
                              {member.crmProfileLevel}
                            </Badge>
                          ) : <span className="text-muted-foreground text-xs font-mono">-</span>}
                        </TableCell>
                        <TableCell className={cn(isSortedColumn("status") && "sorted-column-cell")}>
                          <Badge variant={member.active ? "default" : "secondary"}>
                            {member.active ? "Attivo" : "Inattivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const missingData = getMissingData(member);
                            if (missingData.length > 0) {
                              return (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertTriangle className="w-5 h-5 text-warning-500 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-destructive text-destructive-foreground">
                                      <div className="font-semibold mb-1">Dati Obbligatori Mancanti:</div>
                                      <ul className="list-disc pl-4 text-xs">
                                        {missingData.map((item, idx) => (
                                          <li key={idx}>{item}</li>
                                        ))}
                                      </ul>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            }
                            return null;
                          })()}
                        </TableCell>
                        <TableCell className={cn("text-right", isSortedColumn("coursesCount") && "sorted-column-cell")}>
                          {(member as any).activeCourseCount > 0 ? (
                            <Badge variant="outline" className="text-xs">
                              {(member as any).activeCourseCount} {(member as any).activeCourseCount === 1 ? "corso" : "corsi"}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Nessun corso</span>
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/30 border-t-0 hover:bg-muted/40">
                        <TableCell colSpan={9} className="py-2 pl-4 md:pl-10">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground mr-2">Azioni rapide:</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedMemberForEnrollment(member);
                                setIsEnrollmentDialogOpen(true);
                              }}
                              className="h-8 px-3"
                              disabled={!canWrite}
                            >
                              <GraduationCap className="w-3.5 h-3.5 mr-2" />
                              Iscrizioni
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedMemberForMembership(member);
                                setIsMembershipDialogOpen(true);
                              }}
                              className="h-8 px-3"
                              disabled={!canWrite}
                            >
                              <CreditCard className="w-3.5 h-3.5 mr-2" />
                              Tessere
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/scheda-contabile?memberId=${member.id}`)}
                              className="h-8 px-3 text-orange-700 border-orange-200 hover:bg-orange-50"
                              disabled={!canWrite}
                              title="Scheda Contabile"
                            >
                              <Coins className="w-3.5 h-3.5 mr-2" />
                              Contabilità
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedMemberForCard(member);
                                setIsCardDialogOpen(true);
                              }}
                              className="h-8 px-3"
                              disabled={!canWrite}
                            >
                              <Smartphone className="w-3.5 h-3.5 mr-2" />
                              Card
                            </Button>

                            <div className="h-4 w-px bg-border mx-2 hidden md:block" />

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLocation(`/maschera-input?memberId=${member.id}`)}
                              className="h-8"
                              disabled={!canWrite}
                            >
                              <Edit className="w-3.5 h-3.5 mr-2" />
                              Modifica Completa
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm("Sei sicuro di voler eliminare questo iscritto?")) {
                                  deleteMutation.mutate(member.id);
                                }
                              }}
                              disabled={!canWrite}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMember ? "Modifica Cliente" : "Nuovo Partecipante"}</DialogTitle>
            <DialogDescription>
              Inserisci i dati anagrafici completi dell'iscritto
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Foto Profilo */}
            <div className="flex flex-col items-center space-y-4 bg-muted/20 p-6 rounded-xl border-2 border-dashed border-muted">
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted border-4 border-white shadow-lg">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Camera className="w-10 h-10 mb-1 opacity-40" />
                    <span className="text-[10px] uppercase font-bold tracking-tighter">Fototessera</span>
                  </div>
                )}
                {photoPreview && (
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white text-xs font-bold"
                  >
                    Rimuovi
                  </button>
                )}
              </div>
              <div className="flex flex-col items-center space-y-1">
                <Label htmlFor="photo-upload" className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                  Carica Foto
                </Label>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <p className="text-[10px] text-muted-foreground italic">Max 1MB, formato fototessera</p>

                {editingMember && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4 border-primary/20 hover:bg-primary/5"
                    onClick={() => {
                      setSelectedMemberForCard(editingMember);
                      setIsCardDialogOpen(true);
                    }}
                  >
                    <Smartphone className="w-4 h-4 mr-2 text-primary" />
                    Tessera Digitale
                  </Button>
                )}
              </div>
            </div>

            {/* Dati Anagrafici */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dati Anagrafici</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    defaultValue={editingMember?.firstName}
                    required
                    data-testid="input-firstname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Cognome *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    defaultValue={editingMember?.lastName}
                    required
                    data-testid="input-lastname"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Categoria Cliente (opzionale)</Label>
                <input type="hidden" name="categoryId" value={selectedCategoryId === "none" ? "" : selectedCategoryId} />
                <Select
                  value={selectedCategoryId}
                  onValueChange={setSelectedCategoryId}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Seleziona categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nessuna categoria</SelectItem>
                    {(() => {
                      const renderCategories = (parentId: number | null = null, level: number = 0, visitied = new Set()): any[] => {
                        const categories = clientCategories?.filter(cat => cat.parentId === parentId) || [];
                        return categories.flatMap((cat) => {
                          if (visitied.has(cat.id)) return []; // Safety against circular refs
                          visitied.add(cat.id);
                          return [
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {'\u00A0'.repeat(level * 4)}{cat.name}
                            </SelectItem>,
                            ...renderCategories(cat.id, level + 1, visitied)
                          ];
                        });
                      };
                      return renderCategories();
                    })()}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscriptionTypeId">Tipo Iscrizione</Label>
                <Select name="subscriptionTypeId" defaultValue={editingMember?.subscriptionTypeId?.toString() || "none"}>
                  <SelectTrigger><SelectValue placeholder="Seleziona tipo iscrizione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nessuno</SelectItem>
                    {subscriptionTypes?.map(st => (
                      <SelectItem key={st.id} value={st.id.toString()}>{st.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fiscalCode">Codice Fiscale</Label>
                <Input
                  id="fiscalCode"
                  name="fiscalCode"
                  defaultValue={editingMember?.fiscalCode || ""}
                  maxLength={16}
                  className={`uppercase font-mono ${fiscalCodeError ? 'border-destructive' : ''}`}
                  onChange={(e) => handleFiscalCodeChange(e.target.value)}
                  data-testid="input-fiscalCode"
                />
                {fiscalCodeError && (
                  <p className="text-xs text-destructive">{fiscalCodeError}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Data di Nascita</Label>
                  <Input
                    ref={dateOfBirthRef}
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    defaultValue={(editingMember?.dateOfBirth ? (typeof editingMember.dateOfBirth === 'string' ? editingMember.dateOfBirth : new Date(editingMember.dateOfBirth).toISOString().split('T')[0]) : "") as any}
                    onChange={(e) => handleDateOfBirthChange(e.target.value)}
                    data-testid="input-dateOfBirth"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Sesso</Label>
                  <select
                    ref={genderRef as any}
                    id="gender"
                    name="gender"
                    defaultValue={editingMember?.gender || ""}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    data-testid="select-gender"
                  >
                    <option value="">Seleziona</option>
                    <option value="M">Maschio</option>
                    <option value="F">Femmina</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placeOfBirth">Luogo di Nascita</Label>
                  <Input
                    ref={placeOfBirthRef}
                    id="placeOfBirth"
                    name="placeOfBirth"
                    defaultValue={editingMember?.placeOfBirth || ""}
                    data-testid="input-placeOfBirth"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Contatti */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contatti</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={editingMember?.email || ""}
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={editingMember?.phone || ""}
                    data-testid="input-phone"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile</Label>
                  <Input
                    id="mobile"
                    name="mobile"
                    defaultValue={editingMember?.mobile || ""}
                    data-testid="input-mobile"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Indirizzo Note</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={editingMember?.address || ""}
                    data-testid="input-address"
                    placeholder="Note aggiuntive indirizzo"
                  />
                </div>
              </div>

              {/* Indirizzo Dettagliato */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="streetAddress">Via/Piazza</Label>
                  <Input id="streetAddress" name="streetAddress" defaultValue={editingMember?.streetAddress || ""} placeholder="Es: Via Roma 1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Città</Label>
                  <Input id="city" name="city" defaultValue={editingMember?.city || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Provincia</Label>
                  <Input id="province" name="province" defaultValue={editingMember?.province || ""} maxLength={2} className="uppercase" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">CAP</Label>
                  <Input id="postalCode" name="postalCode" defaultValue={editingMember?.postalCode || ""} maxLength={5} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Stato</Label>
                  <Input id="country" name="country" defaultValue={editingMember?.country || "Italia"} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Dati Tessera */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dati Tessera</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Numero Tessera</Label>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    defaultValue={editingMember?.cardNumber || ""}
                    data-testid="input-cardNumber"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardIssueDate">Data Rilascio</Label>
                  <Input
                    id="cardIssueDate"
                    name="cardIssueDate"
                    type="date"
                    defaultValue={(editingMember?.cardIssueDate ? (typeof editingMember.cardIssueDate === 'string' ? editingMember.cardIssueDate : new Date(editingMember.cardIssueDate).toISOString().split('T')[0]) : "") as any}
                    data-testid="input-cardIssueDate"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardExpiryDate">Scadenza Tessera</Label>
                  <Input
                    id="cardExpiryDate"
                    name="cardExpiryDate"
                    type="date"
                    defaultValue={(editingMember?.cardExpiryDate ? (typeof editingMember.cardExpiryDate === 'string' ? editingMember.cardExpiryDate : new Date(editingMember.cardExpiryDate).toISOString().split('T')[0]) : "") as any}
                    data-testid="input-cardExpiryDate"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Minorenne */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isMinor"
                  checked={isMinorChecked}
                  onCheckedChange={(checked) => {
                    setIsMinorChecked(checked as boolean);
                    setShowParentFields(checked as boolean);
                  }}
                  data-testid="checkbox-isMinor"
                />
                <Label htmlFor="isMinor" className="text-lg font-semibold cursor-pointer">
                  Minorenne
                </Label>
              </div>
            </div>

            <Separator />

            {/* Certificato Medico */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasMedicalCertificate"
                  checked={hasMedicalCert}
                  onCheckedChange={(checked) => setHasMedicalCert(checked as boolean)}
                  data-testid="checkbox-hasMedicalCertificate"
                />
                <Label htmlFor="hasMedicalCertificate" className="text-lg font-semibold cursor-pointer">
                  Certificato Medico
                </Label>
              </div>

              {hasMedicalCert && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="medicalCertificateExpiry">Scadenza Certificato Medico</Label>
                  <Input
                    id="medicalCertificateExpiry"
                    name="medicalCertificateExpiry"
                    type="date"
                    defaultValue={(editingMember?.medicalCertificateExpiry ? (typeof editingMember.medicalCertificateExpiry === 'string' ? editingMember.medicalCertificateExpiry : new Date(editingMember.medicalCertificateExpiry).toISOString().split('T')[0]) : "") as any}
                    data-testid="input-medicalCertificateExpiry"
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Tessera Ente */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tessera Ente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entityCardType">Tipo Ente</Label>
                  <Select name="entityCardType" defaultValue={editingMember?.entityCardType || "none"}>
                    <SelectTrigger><SelectValue placeholder="Scegli Ente" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessuno / Altro</SelectItem>
                      <SelectItem value="CSEN">CSEN</SelectItem>
                      <SelectItem value="ACSI">ACSI</SelectItem>
                      <SelectItem value="AICS">AICS</SelectItem>
                      <SelectItem value="UISP">UISP</SelectItem>
                      <SelectItem value="ALTRO">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entityCardNumber">Numero Tessera Ente</Label>
                  <Input id="entityCardNumber" name="entityCardNumber" defaultValue={editingMember?.entityCardNumber || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entityCardIssueDate">Data Rilascio</Label>
                  <Input id="entityCardIssueDate" name="entityCardIssueDate" type="date" defaultValue={editingMember?.entityCardIssueDate ? (typeof editingMember.entityCardIssueDate === 'string' ? editingMember.entityCardIssueDate : new Date(editingMember.entityCardIssueDate).toISOString().split('T')[0]) : ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entityCardExpiryDate">Data Scadenza</Label>
                  <Input id="entityCardExpiryDate" name="entityCardExpiryDate" type="date" defaultValue={editingMember?.entityCardExpiryDate ? (typeof editingMember.entityCardExpiryDate === 'string' ? editingMember.entityCardExpiryDate : new Date(editingMember.entityCardExpiryDate).toISOString().split('T')[0]) : ""} />
                </div>
              </div>
            </div>

            {/* Dati Genitori (se minorenne) */}
            {showParentFields && (
              <>
                <Separator />
                <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold">Dati Genitori (Minorenne)</h3>

                  {/* Madre */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">Madre</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="motherFirstName">Nome Madre</Label>
                        <Input
                          id="motherFirstName"
                          name="motherFirstName"
                          defaultValue={editingMember?.motherFirstName || ""}
                          data-testid="input-motherFirstName"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="motherLastName">Cognome Madre</Label>
                        <Input
                          id="motherLastName"
                          name="motherLastName"
                          defaultValue={editingMember?.motherLastName || ""}
                          data-testid="input-motherLastName"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="motherFiscalCode">Codice Fiscale Madre</Label>
                        <Input
                          id="motherFiscalCode"
                          name="motherFiscalCode"
                          defaultValue={editingMember?.motherFiscalCode || ""}
                          maxLength={16}
                          className="uppercase font-mono"
                          data-testid="input-motherFiscalCode"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="motherEmail">Email Madre</Label>
                        <Input
                          id="motherEmail"
                          name="motherEmail"
                          type="email"
                          defaultValue={editingMember?.motherEmail || ""}
                          data-testid="input-motherEmail"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="motherPhone">Telefono Madre</Label>
                        <Input
                          id="motherPhone"
                          name="motherPhone"
                          defaultValue={editingMember?.motherPhone || ""}
                          data-testid="input-motherPhone"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="motherMobile">Mobile Madre</Label>
                        <Input
                          id="motherMobile"
                          name="motherMobile"
                          defaultValue={editingMember?.motherMobile || ""}
                          data-testid="input-motherMobile"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Padre */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">Padre</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fatherFirstName">Nome Padre</Label>
                        <Input
                          id="fatherFirstName"
                          name="fatherFirstName"
                          defaultValue={editingMember?.fatherFirstName || ""}
                          data-testid="input-fatherFirstName"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fatherLastName">Cognome Padre</Label>
                        <Input
                          id="fatherLastName"
                          name="fatherLastName"
                          defaultValue={editingMember?.fatherLastName || ""}
                          data-testid="input-fatherLastName"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fatherFiscalCode">Codice Fiscale Padre</Label>
                        <Input
                          id="fatherFiscalCode"
                          name="fatherFiscalCode"
                          defaultValue={editingMember?.fatherFiscalCode || ""}
                          maxLength={16}
                          className="uppercase font-mono"
                          data-testid="input-fatherFiscalCode"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fatherEmail">Email Padre</Label>
                        <Input
                          id="fatherEmail"
                          name="fatherEmail"
                          type="email"
                          defaultValue={editingMember?.fatherEmail || ""}
                          data-testid="input-fatherEmail"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fatherPhone">Telefono Padre</Label>
                        <Input
                          id="fatherPhone"
                          name="fatherPhone"
                          defaultValue={editingMember?.fatherPhone || ""}
                          data-testid="input-fatherPhone"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fatherMobile">Mobile Padre</Label>
                        <Input
                          id="fatherMobile"
                          name="fatherMobile"
                          defaultValue={editingMember?.fatherMobile || ""}
                          data-testid="input-fatherMobile"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Corsi Iscritti - Solo per membri esistenti */}
            {editingMember && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Corsi Iscritti</h3>
                    <Badge variant="secondary" data-testid="badge-enrolled-courses-count">
                      {memberEnrollments.length || 0} corsi
                    </Badge>
                  </div>

                  {/* Lista corsi iscritti */}
                  <div className="space-y-2">
                    {memberEnrollments.length === 0 ? (
                      <p className="text-sm text-muted-foreground" data-testid="text-no-enrollments">
                        Nessun corso iscritto
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {memberEnrollments
                          .map((enrollment) => {
                            const course = courses?.find(c => c.id === enrollment.courseId);
                            if (!course) return null;
                            return (
                              <div
                                key={enrollment.id}
                                className="flex items-center justify-between p-3 border rounded-md hover-elevate"
                                data-testid={`enrollment-item-${enrollment.id}`}
                              >
                                <div className="flex items-center gap-3">
                                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium" data-testid={`enrollment-course-name-${enrollment.id}`}>
                                      {course.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {course.sku}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    if (confirm(`Rimuovere l'iscrizione al corso "${course.name}"?`)) {
                                      removeEnrollmentMutation.mutate({
                                        enrollmentId: enrollment.id,
                                        memberId: editingMember!.id
                                      });
                                    }
                                  }}
                                  disabled={removeEnrollmentMutation.isPending}
                                  data-testid={`button-remove-enrollment-${enrollment.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* Aggiungi nuovo corso - max 6 corsi */}
                  {memberEnrollments.length >= 6 ? (
                    <p className="text-sm text-muted-foreground italic" data-testid="text-max-courses-reached">
                      Limite massimo di 6 corsi raggiunto
                    </p>
                  ) : (
                    <div className="flex gap-2">
                      <Select
                        value={selectedCourseToAdd}
                        onValueChange={setSelectedCourseToAdd}
                      >
                        <SelectTrigger className="flex-1" data-testid="select-add-course">
                          <SelectValue placeholder="Seleziona un corso da aggiungere" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses
                            ?.filter(c =>
                              c.active &&
                              !memberEnrollments.some(e => e.courseId === c.id)
                            )
                            .map(course => (
                              <SelectItem key={course.id} value={course.id.toString()}>
                                {course.name} ({course.sku})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        onClick={() => {
                          if (selectedCourseToAdd && editingMember) {
                            addEnrollmentMutation.mutate({
                              memberId: editingMember.id,
                              courseId: parseInt(selectedCourseToAdd)
                            });
                          }
                        }}
                        disabled={!selectedCourseToAdd || addEnrollmentMutation.isPending}
                        data-testid="button-add-course-to-member"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Aggiungi
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {memberEnrollments.length}/6 corsi
                  </p>
                </div>
              </>
            )}

            {/* Workshop Iscritti - Solo per membri esistenti */}
            {editingMember && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Workshop Iscritti</h3>
                    <Badge variant="secondary" data-testid="badge-enrolled-workshops-count">
                      {memberWorkshopEnrollments.length || 0} workshop
                    </Badge>
                  </div>

                  {/* Lista workshop iscritti */}
                  <div className="space-y-2">
                    {memberWorkshopEnrollments.length === 0 ? (
                      <p className="text-sm text-muted-foreground" data-testid="text-no-workshop-enrollments">
                        Nessun workshop iscritto
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {memberWorkshopEnrollments.map((enrollment) => {
                          const workshop = workshops?.find(w => w.id === enrollment.workshopId);
                          if (!workshop) return null;
                          return (
                            <div
                              key={enrollment.id}
                              className="flex items-center justify-between p-3 border rounded-md hover-elevate"
                              data-testid={`workshop-enrollment-item-${enrollment.id}`}
                            >
                              <div className="flex items-center gap-3">
                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium" data-testid={`workshop-enrollment-name-${enrollment.id}`}>
                                    {workshop.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {workshop.workshopDate ? new Date(workshop.workshopDate).toLocaleDateString('it-IT') : workshop.sku}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm(`Rimuovere l'iscrizione al workshop "${workshop.name}"?`)) {
                                    removeWorkshopEnrollmentMutation.mutate({
                                      enrollmentId: enrollment.id,
                                      memberId: editingMember!.id
                                    });
                                  }
                                }}
                                disabled={removeWorkshopEnrollmentMutation.isPending}
                                data-testid={`button-remove-workshop-enrollment-${enrollment.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Aggiungi nuovo workshop - max 6 workshop */}
                  {memberWorkshopEnrollments.length >= 6 ? (
                    <p className="text-sm text-muted-foreground italic" data-testid="text-max-workshops-reached">
                      Limite massimo di 6 workshop raggiunto
                    </p>
                  ) : (
                    <div className="flex gap-2">
                      <Select
                        value={selectedWorkshopToAdd}
                        onValueChange={setSelectedWorkshopToAdd}
                      >
                        <SelectTrigger className="flex-1" data-testid="select-add-workshop">
                          <SelectValue placeholder="Seleziona un workshop da aggiungere" />
                        </SelectTrigger>
                        <SelectContent>
                          {workshops
                            ?.filter(w =>
                              w.active &&
                              !memberWorkshopEnrollments.some(e => e.workshopId === w.id)
                            )
                            .map(workshop => (
                              <SelectItem key={workshop.id} value={workshop.id.toString()}>
                                {workshop.name} ({workshop.workshopDate ? new Date(workshop.workshopDate).toLocaleDateString('it-IT') : workshop.sku})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        onClick={() => {
                          if (selectedWorkshopToAdd && editingMember) {
                            addWorkshopEnrollmentMutation.mutate({
                              memberId: editingMember.id,
                              workshopId: parseInt(selectedWorkshopToAdd)
                            });
                          }
                        }}
                        disabled={!selectedWorkshopToAdd || addWorkshopEnrollmentMutation.isPending}
                        data-testid="button-add-workshop-to-member"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Aggiungi
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {memberWorkshopEnrollments.length}/6 workshop
                  </p>
                </div>
              </>
            )}

            {/* Presenze - Solo per membri esistenti */}
            {editingMember && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Presenze</h3>
                    <Badge variant="secondary" data-testid="badge-attendances-count">
                      {attendances.length || 0} presenze
                    </Badge>
                  </div>

                  {/* Form per registrare nuova presenza */}
                  <div className="space-y-3 p-4 border rounded-md bg-muted/50">
                    <h4 className="font-medium">Registra Nuova Presenza</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="attendanceDate">Data</Label>
                        <Input
                          id="attendanceDate"
                          type="date"
                          value={attendanceDate}
                          onChange={(e) => setAttendanceDate(e.target.value)}
                          data-testid="input-attendance-date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="attendanceTime">Ora</Label>
                        <Input
                          id="attendanceTime"
                          type="time"
                          value={attendanceTime}
                          onChange={(e) => setAttendanceTime(e.target.value)}
                          data-testid="input-attendance-time"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courseForAttendance">Corso (opzionale)</Label>
                      <Select
                        value={selectedCourseForAttendance}
                        onValueChange={setSelectedCourseForAttendance}
                      >
                        <SelectTrigger data-testid="select-attendance-course">
                          <SelectValue placeholder="Nessun corso specifico" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nessun corso</SelectItem>
                          {memberEnrollments
                            .map(enrollment => {
                              const course = courses?.find(c => c.id === enrollment.courseId);
                              return course ? (
                                <SelectItem key={course.id} value={enrollment.id.toString()}>
                                  {course.name}
                                </SelectItem>
                              ) : null;
                            })}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (!attendanceDate || !attendanceTime) {
                          toast({ title: "Errore", description: "Inserisci data e ora", variant: "destructive" });
                          return;
                        }

                        const enrollment = (selectedCourseForAttendance && selectedCourseForAttendance !== "none") ?
                          memberEnrollments.find(e => e.id === parseInt(selectedCourseForAttendance)) : undefined;

                        const attendanceData: any = {
                          memberId: editingMember.id,
                          attendanceDate: `${attendanceDate}T${attendanceTime}:00`,
                        };

                        // Only include courseId and enrollmentId if a valid enrollment is selected
                        if (enrollment) {
                          attendanceData.courseId = enrollment.courseId;
                          attendanceData.enrollmentId = enrollment.id;
                        }

                        addAttendanceMutation.mutate(attendanceData);
                        setAttendanceDate("");
                        setAttendanceTime("");
                        setSelectedCourseForAttendance("");
                      }}
                      disabled={!attendanceDate || !attendanceTime || addAttendanceMutation.isPending}
                      data-testid="button-add-attendance"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Registra Presenza
                    </Button>
                  </div>

                  {/* Lista presenze recenti */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Ultime 10 Presenze</h4>
                    {attendances.length === 0 ? (
                      <p className="text-sm text-muted-foreground" data-testid="text-no-attendances">
                        Nessuna presenza registrata
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {attendances
                          .slice(0, 10)
                          .map((attendance) => {
                            const course = attendance.courseId ? courses?.find(c => c.id === attendance.courseId) : null;
                            const attendanceDateTime = new Date(attendance.attendanceDate);
                            return (
                              <div
                                key={attendance.id}
                                className="flex items-center justify-between p-3 border rounded-md text-sm hover-elevate"
                                data-testid={`attendance-item-${attendance.id}`}
                              >
                                <div className="flex items-center gap-3">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">
                                      {attendanceDateTime.toLocaleDateString('it-IT', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                      })}
                                      {' '}
                                      {attendanceDateTime.toLocaleTimeString('it-IT', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                    {course && (
                                      <p className="text-xs text-muted-foreground">
                                        {course.name}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    if (confirm("Eliminare questa presenza?")) {
                                      deleteAttendanceMutation.mutate({
                                        attendanceId: attendance.id,
                                        memberId: editingMember!.id
                                      });
                                    }
                                  }}
                                  disabled={deleteAttendanceMutation.isPending}
                                  data-testid={`button-delete-attendance-${attendance.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={editingMember?.notes || ""}
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
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-member"
              >
                {editingMember ? "Salva Modifiche" : "Crea Partecipante"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Merge Duplicates Dialog replaces old dialog */}
      {isMergeDialogOpen && (
        <DuplicateMergeModal
          open={isMergeDialogOpen}
          onOpenChange={setIsMergeDialogOpen}
          member1={manualMergeMember1}
          member2={manualMergeMember2}
          onMergeComplete={() => {
            setIsMergeDialogOpen(false);
            setSelectedMembers([]);
            queryClient.invalidateQueries({ queryKey: ["/api/members"] });
          }}
        />
      )}

      {/* Enrollment Management Dialog */}
      <EnrollmentDialog
        member={selectedMemberForEnrollment}
        open={isEnrollmentDialogOpen}
        onOpenChange={setIsEnrollmentDialogOpen}
      />

      {/* Membership Management Dialog */}
      <MembershipManagementDialog
        member={selectedMemberForMembership}
        open={isMembershipDialogOpen}
        onOpenChange={setIsMembershipDialogOpen}
      />

      {/* Digital card dialog */}
      <MembershipCardDialog
        member={selectedMemberForCard}
        isOpen={isCardDialogOpen}
        onOpenChange={setIsCardDialogOpen}
      />

      {/* Report Duplicati Modal */}
      {showDuplicatesModal && duplicateClusters && (
        <Dialog open={showDuplicatesModal} onOpenChange={setShowDuplicatesModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="w-5 h-5" />
                Report Anagrafiche Duplicate
              </DialogTitle>
              <DialogDescription>
                Sistema di rilevamento duplicati. Si consiglia di unire le schede utilizzando la funzione "Unisci Selezionati".
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="bg-muted p-4 rounded-lg text-sm border">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Come risolvere
                </h4>
                <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                  <li>Cerca le anagrafiche elencate usando la barra di ricerca in Anagrafica a Lista</li>
                  <li>Seleziona le anagrafiche duplicate con le spunte a sinistra</li>
                  <li>Clicca sul pulsante viola "Unisci Selezionati" che comparirà in alto a destra</li>
                  <li>Scegli l'anagrafica da mantenere come principale, i dati delle altre verranno trasferiti su di essa</li>
                </ol>
              </div>

              <div className="space-y-4">
                {duplicateClusters.map((cluster: any, idx: number) => (
                  <Card key={idx} className="p-4 border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-900/10">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-sm font-medium bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded inline-block text-yellow-800 dark:text-yellow-400">
                          Match identificato: {cluster.fiscalCode}
                        </div>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 h-8"
                          onClick={() => {
                            const idsToMerge = cluster.members.map((m: any) => m.id);
                            setSelectedMembers(idsToMerge);
                            setMergeCandidates(cluster.members);
                            setShowDuplicatesModal(false);
                            setTimeout(() => setIsMergeDialogOpen(true), 100);
                          }}
                        >
                          <Users className="w-3.5 h-3.5 mr-1.5" />
                          Unisci questi {cluster.members.length}
                        </Button>
                      </div>
                      <div className="flex flex-col gap-2 mt-2">
                        {cluster.members.map((m: any) => (
                          <div key={m.id} className="flex items-center justify-between bg-background p-2 rounded border border-yellow-100 dark:border-yellow-900/20 text-sm shadow-sm">
                            <span className="font-medium text-foreground">{m.lastName} {m.firstName}</span>
                            <span className="text-muted-foreground text-xs">{m.email || 'Nessuna email'} • {m.fiscalCode || 'Nessun CF'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDuplicatesModal(false)}>Chiudi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Enrollment Management Component
function EnrollmentDialog({
  member,
  open,
  onOpenChange
}: {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [includeMembership, setIncludeMembership] = useState(true);
  const [courseFee, setCourseFee] = useState("");
  const [membershipFee, setMembershipFee] = useState("30.00");

  const { data: courses } = useQuery<any[]>({
    queryKey: ["/api/courses"],
  });

  const { data: enrollments } = useQuery<any[]>({
    queryKey: ["/api/enrollments?type=corsi"],
  });

  const { data: payments } = useQuery<any[]>({
    queryKey: ["/api/payments"],
  });

  const createEnrollmentMutation = useMutation({
    mutationFn: async (data: { memberId: number; courseId: number }) => {
      const result = await apiRequest("POST", "/api/enrollments", {
        ...data,
        status: "active"
      });
      return result;
    },
    onSuccess: async (enrollment: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments?type=corsi"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });

      // Create course payment
      if (courseFee && parseFloat(courseFee) > 0) {
        const course = courses?.find(c => c.id === enrollment.courseId);
        await apiRequest("POST", "/api/payments", {
          memberId: enrollment.memberId,
          enrollmentId: enrollment.id,
          amount: courseFee,
          type: "course",
          description: `Quota corso: ${course?.name || ""}`,
          status: "pending",
          dueDate: new Date().toISOString().split('T')[0],
        });
      }

      // Create membership payment
      if (includeMembership && membershipFee && parseFloat(membershipFee) > 0) {
        await apiRequest("POST", "/api/payments", {
          memberId: enrollment.memberId,
          enrollmentId: enrollment.id,
          amount: membershipFee,
          type: "membership",
          description: "Tesseramento annuale",
          status: "pending",
          dueDate: new Date().toISOString().split('T')[0],
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({ title: "Iscrizione creata con successo" });
      setSelectedCourseId("");
      setCourseFee("");
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      await apiRequest("DELETE", `/api/enrollments/${enrollmentId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments?type=corsi"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({ title: "Iscrizione eliminata" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleEnroll = () => {
    if (!member || !selectedCourseId) return;

    createEnrollmentMutation.mutate({
      memberId: member.id,
      courseId: parseInt(selectedCourseId),
    });
  };

  useEffect(() => {
    if (selectedCourseId) {
      const course = courses?.find(c => c.id === parseInt(selectedCourseId));
      if (course?.price) {
        setCourseFee(course.price);
      }
    }
  }, [selectedCourseId, courses]);

  const memberEnrollments = enrollments?.filter(e => e.memberId === member?.id) || [];
  const availableCourses = courses?.filter(c =>
    c.active && !memberEnrollments.some(e => e.courseId === c.id)
  ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Gestione Iscrizioni - {member?.lastName} {member?.firstName}
          </DialogTitle>
          <DialogDescription>
            Iscriviti a corsi e gestisci le quote di pagamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Enrollments */}
          <div>
            <h3 className="font-medium mb-3">Iscrizioni Attuali</h3>
            {memberEnrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessuna iscrizione attiva</p>
            ) : (
              <div className="space-y-3">
                {memberEnrollments.map((enrollment) => {
                  const course = courses?.find(c => c.id === enrollment.courseId);
                  const enrollmentPayments = payments?.filter(p => p.enrollmentId === enrollment.id) || [];
                  const totalPaid = enrollmentPayments
                    .filter(p => p.status === "paid")
                    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
                  const totalDue = enrollmentPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
                  const isPaid = totalPaid >= totalDue && totalDue > 0;

                  return (
                    <div
                      key={enrollment.id}
                      className="border rounded-md overflow-hidden"
                      data-testid={`enrollment-${enrollment.id}`}
                    >
                      <div className="flex items-center justify-between p-3 bg-muted/30">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{course?.name || "Corso sconosciuto"}</div>
                            {isPaid ? (
                              <Badge variant="default" className="text-xs">Pagato</Badge>
                            ) : enrollmentPayments.some(p => p.status === "overdue") ? (
                              <Badge variant="destructive" className="text-xs">Scaduto</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">In sospeso</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Iscritto il {new Date(enrollment.enrollmentDate).toLocaleDateString('it-IT')}
                            {enrollmentPayments.length > 0 && (
                              <span className="ml-3">
                                Pagato: €{totalPaid.toFixed(2)} / €{totalDue.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Vuoi eliminare questa iscrizione?")) {
                              deleteEnrollmentMutation.mutate(enrollment.id);
                            }
                          }}
                          data-testid={`button-delete-enrollment-${enrollment.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {enrollmentPayments.length > 0 && (
                        <div className="p-3 pt-2 space-y-2">
                          <div className="text-xs font-medium text-muted-foreground mb-2">Pagamenti:</div>
                          {enrollmentPayments.map((payment) => (
                            <div
                              key={payment.id}
                              className="flex items-center justify-between text-sm p-2 rounded bg-background"
                              data-testid={`payment-${payment.id}`}
                            >
                              <div className="flex-1">
                                <div className="font-medium">{payment.description}</div>
                                <div className="text-xs text-muted-foreground">
                                  Scadenza: {new Date(payment.dueDate).toLocaleDateString('it-IT')}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="font-medium">€{parseFloat(payment.amount).toFixed(2)}</div>
                                </div>
                                <Badge
                                  variant={
                                    payment.status === "paid" ? "default" :
                                      payment.status === "overdue" ? "destructive" :
                                        "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {payment.status === "paid" ? "Pagato" :
                                    payment.status === "overdue" ? "Scaduto" :
                                      "In sospeso"}
                                </Badge>
                                {payment.status !== "paid" && member && (
                                  <Button asChild size="sm" variant="outline" className="h-7 text-xs px-2 cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800">
                                    <Link href={`/?memberId=${member.id}&action=payment`}>Paga Ora</Link>
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* New Enrollment Form */}
          <div>
            <h3 className="font-medium mb-3">Nuova Iscrizione o Pagamento</h3>
            <div className="bg-muted/30 border rounded-md p-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Le nuove iscrizioni e i pagamenti vengono gestiti centralmente nella Maschera Input Generale per garantire il corretto processo di Checkout.
              </p>
              <Button asChild className="w-full sm:w-auto">
                <Link href={`/?memberId=${member?.id}`}>
                  Vai alla Maschera Input
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-enrollment"
          >
            Chiudi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Membership and Medical Certificates Management Component
function MembershipManagementDialog({
  member,
  open,
  onOpenChange
}: {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [isAddingMembership, setIsAddingMembership] = useState(false);
  const [editingMembership, setEditingMembership] = useState<any | null>(null);
  const [isAddingCertificate, setIsAddingCertificate] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<any | null>(null);

  const { data: memberships } = useQuery<any[]>({
    queryKey: ["/api/memberships"],
    enabled: !!member,
  });

  const { data: certificates } = useQuery<any[]>({
    queryKey: ["/api/medical-certificates"],
    enabled: !!member,
  });

  const memberMemberships = memberships?.filter(m => m.memberId === member?.id) || [];
  const memberCertificates = certificates?.filter(c => c.memberId === member?.id) || [];

  const createMembershipMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/memberships", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memberships"] });
      toast({ title: "Tessera creata con successo" });
      setIsAddingMembership(false);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMembershipMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PATCH", `/api/memberships/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memberships"] });
      toast({ title: "Tessera aggiornata" });
      setEditingMembership(null);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMembershipMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/memberships/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memberships"] });
      toast({ title: "Tessera eliminata" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const createCertificateMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/medical-certificates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-certificates"] });
      toast({ title: "Certificato creato con successo" });
      setIsAddingCertificate(false);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateCertificateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PATCH", `/api/medical-certificates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-certificates"] });
      toast({ title: "Certificato aggiornato" });
      setEditingCertificate(null);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteCertificateMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/medical-certificates/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-certificates"] });
      toast({ title: "Certificato eliminato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmitMembership = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!member) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      memberId: member.id,
      previousMembershipNumber: formData.get("previousMembershipNumber") as string || null,
      issueDate: formData.get("issueDate") as string,
      expiryDate: formData.get("expiryDate") as string,
      status: formData.get("status") as string || "active",
      type: formData.get("type") as string || null,
      fee: formData.get("fee") ? formData.get("fee") as string : null,
    };

    if (editingMembership) {
      updateMembershipMutation.mutate({ id: editingMembership.id, data });
    } else {
      createMembershipMutation.mutate(data);
    }
  };

  const handleSubmitCertificate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!member) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      memberId: member.id,
      issueDate: formData.get("issueDate") as string,
      expiryDate: formData.get("expiryDate") as string,
      doctorName: formData.get("doctorName") as string || null,
      notes: formData.get("notes") as string || null,
      status: formData.get("status") as string || "valid",
    };

    if (editingCertificate) {
      updateCertificateMutation.mutate({ id: editingCertificate.id, data });
    } else {
      createCertificateMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Gestione Tessere e Certificati - {member?.lastName} {member?.firstName}
          </DialogTitle>
          <DialogDescription>
            Gestisci tessere associative e certificati medici
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* TESSERE SECTION */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <h3 className="font-semibold">Tessere Associative</h3>
              </div>
              <Button
                asChild
                size="sm"
                variant="outline"
                data-testid="button-add-membership"
              >
                <Link href={`/?memberId=${member?.id}#tessere`}>
                  Rinnova / Gestisci Tessera
                </Link>
              </Button>
            </div>

            {memberMemberships.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 border rounded-md text-center">
                Nessuna tessera registrata
              </p>
            ) : (
              <div className="space-y-3">
                {memberMemberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="border rounded-md p-3"
                    data-testid={`membership-${membership.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{membership.membershipNumber}</span>
                          <Badge variant={
                            membership.status === "active" ? "default" :
                              membership.status === "expired" ? "destructive" :
                                "secondary"
                          } className="text-xs">
                            {membership.status === "active" ? "Attiva" :
                              membership.status === "expired" ? "Scaduta" :
                                "Sospesa"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Validità: {new Date(membership.issueDate).toLocaleDateString('it-IT')} - {new Date(membership.expiryDate).toLocaleDateString('it-IT')}
                        </div>
                        {membership.previousMembershipNumber && (
                          <div className="text-xs text-muted-foreground">
                            Tessera precedente: {membership.previousMembershipNumber}
                          </div>
                        )}
                        {membership.fee && (
                          <div className="text-sm">
                            Quota: €{parseFloat(membership.fee).toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Edit handled via maschera input */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Sei sicuro di voler eliminare questa tessera?")) {
                              deleteMembershipMutation.mutate(membership.id);
                            }
                          }}
                          data-testid={`button-delete-membership-${membership.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          <Separator />

          {/* CERTIFICATI MEDICI SECTION */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <h3 className="font-semibold">Certificati Medici</h3>
              </div>
              <Button
                asChild
                size="sm"
                variant="outline"
                data-testid="button-add-certificate"
              >
                <Link href={`/?memberId=${member?.id}#certificato`}>
                  Rinnova / Gestisci Certificato
                </Link>
              </Button>
            </div>

            {memberCertificates.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 border rounded-md text-center">
                Nessun certificato registrato
              </p>
            ) : (
              <div className="space-y-3">
                {memberCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="border rounded-md p-3"
                    data-testid={`certificate-${cert.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Certificato Medico</span>
                          <Badge variant={
                            cert.status === "valid" ? "default" :
                              cert.status === "expired" ? "destructive" :
                                "secondary"
                          } className="text-xs">
                            {cert.status === "valid" ? "Valido" :
                              cert.status === "expired" ? "Scaduto" :
                                "In attesa"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Validità: {new Date(cert.issueDate).toLocaleDateString('it-IT')} - {new Date(cert.expiryDate).toLocaleDateString('it-IT')}
                        </div>
                        {cert.doctorName && (
                          <div className="text-sm">
                            Medico: {cert.doctorName}
                          </div>
                        )}
                        {cert.notes && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Note: {cert.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Edit handled via maschera input */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Sei sicuro di voler eliminare questo certificato?")) {
                              deleteCertificateMutation.mutate(cert.id);
                            }
                          }}
                          data-testid={`button-delete-certificate-${cert.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-close-membership-dialog"
          >
            Chiudi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MembershipCardDialog({
  isOpen,
  onOpenChange,
  member
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
}) {
  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tessera Digitale</DialogTitle>
          <DialogDescription>
            Tessera di iscrizione per {member.lastName} {member.firstName}
          </DialogDescription>
        </DialogHeader>

        <MembershipCard member={member} />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Chiudi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { MembershipManagementDialog, MembershipCardDialog };
