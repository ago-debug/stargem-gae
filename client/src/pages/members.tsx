import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link, useSearch, useLocation } from "wouter";
import { validateFiscalCode, parseFiscalCode, getPlaceName } from "@/lib/fiscalCodeUtils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, Users, GraduationCap, CreditCard, FileText, ChevronLeft, ChevronRight, Download, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Member, InsertMember, Attendance } from "@shared/schema";

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
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const initialSearch = urlParams.get('search') || "";
  
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
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
  const [courses, setCourses] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [memberWorkshopEnrollments, setMemberWorkshopEnrollments] = useState<any[]>([]);
  const [selectedWorkshopToAdd, setSelectedWorkshopToAdd] = useState<string>("");
  const [isMinorChecked, setIsMinorChecked] = useState(false);
  
  const dateOfBirthRef = useRef<HTMLInputElement>(null);
  const genderRef = useRef<HTMLSelectElement>(null);
  const placeOfBirthRef = useRef<HTMLInputElement>(null);

  const PAGE_SIZE = 50;
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const { data: membersData, isLoading } = useQuery<{ members: Member[]; total: number }>({
    queryKey: ["/api/members", { page: currentPage, pageSize: PAGE_SIZE, search: debouncedSearch }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: PAGE_SIZE.toString(),
        search: debouncedSearch,
      });
      const res = await fetch(`/api/members?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
  });

  const members = membersData?.members || [];
  const totalMembers = membersData?.total || 0;
  const totalPages = Math.ceil(totalMembers / PAGE_SIZE);

  const { sortConfig, handleSort, sortItems, isSortedColumn } = useSortableTable<Member>("name");

  const getSortValue = (member: Member, key: string) => {
    switch (key) {
      case "name": return `${member.firstName} ${member.lastName}`;
      case "fiscalCode": return member.fiscalCode;
      case "email": return member.email;
      case "phone": return member.phone;
      case "cardNumber": return member.cardNumber;
      case "medicalCert": return member.medicalCertificateExpiry;
      case "status": return member.active;
      case "courses": return null;
      default: return null;
    }
  };

  const sortedMembers = sortItems(members, getSortValue);

  const { data: clientCategories } = useQuery<any[]>({
    queryKey: ["/api/client-categories"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertMember) => {
      await apiRequest("POST", "/api/members", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/duplicates"] });
      toast({ title: "Partecipante creato con successo" });
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error: any) => {
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

  const updateMutation = useMutation<void, any, { id: number; data: Partial<InsertMember> }>({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertMember> }) => {
      await apiRequest("PATCH", `/api/members/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/duplicates"] });
      toast({ title: "Partecipante aggiornato con successo" });
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error: any) => {
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

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/members/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/duplicates"] });
      toast({ title: "Partecipante eliminato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const addEnrollmentMutation = useMutation({
    mutationFn: async (data: { memberId: number; courseId: number }) => {
      await apiRequest("POST", "/api/enrollments", data);
      return data.memberId;
    },
    onSuccess: async (memberId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      // Ricarica le iscrizioni locali
      const res = await fetch(`/api/enrollments?memberId=${memberId}`, { credentials: "include" });
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
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      // Ricarica le iscrizioni locali
      const res = await fetch(`/api/enrollments?memberId=${memberId}`, { credentials: "include" });
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
  };

  useEffect(() => {
    if (editingMember) {
      setHasMedicalCert(editingMember.hasMedicalCertificate || false);
      setIsMinorChecked(editingMember.isMinor || false);
      if (editingMember.dateOfBirth) {
        const age = calculateAge(editingMember.dateOfBirth);
        setShowParentFields(age < 18 || editingMember.isMinor || false);
      } else {
        setShowParentFields(editingMember.isMinor || false);
      }
    }
  }, [editingMember]);

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
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

  const handleFiscalCodeChange = (value: string) => {
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
        setAutoFilledData({
          dateOfBirth: parsed.dateOfBirth,
          gender: parsed.gender,
          placeOfBirth: getPlaceName(parsed.placeOfBirth || "") || parsed.placeOfBirth || ""
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
          placeOfBirthRef.current.value = getPlaceName(parsed.placeOfBirth || "") || parsed.placeOfBirth || "";
        }
        
        toast({
          title: "Dati estratti dal CF",
          description: `Data: ${new Date(parsed.dateOfBirth).toLocaleDateString('it-IT')}, Sesso: ${parsed.gender === 'M' ? 'Maschio' : 'Femmina'}`,
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
      active: true,
    };

    if (editingMember) {
      updateMutation.mutate({ id: editingMember.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const exportToCSV = () => {
    if (!members || members.length === 0) {
      toast({ title: "Nessun dato da esportare", variant: "destructive" });
      return;
    }
    
    const headers = ["ID", "Nome", "Cognome", "Codice Fiscale", "Data Nascita", "Luogo Nascita", "Sesso", "Email", "Telefono", "Cellulare", "Indirizzo", "Città", "Provincia", "CAP", "N. Tessera", "Scadenza Tessera", "Certificato Medico", "Scadenza Certificato", "Note", "Stato"];
    
    const rows = members.map(member => [
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
    link.download = `partecipanti_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Esportazione completata" });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="icon-gold-bg rounded-md h-8 w-8 flex-shrink-0" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 text-white" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Partecipanti/Anagrafiche</h1>
            <p className="text-muted-foreground text-sm">Anagrafica completa degli iscritti</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={exportToCSV}
            data-testid="button-export-csv"
          >
            <Download className="w-4 h-4 mr-2" />
            Esporta CSV
          </Button>
          <Button 
            className="gold-3d-button"
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            data-testid="button-add-member"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Partecipante
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome, cognome, CF o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-members"
              />
            </div>
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
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nessun iscritto trovato</p>
              <p className="text-sm">{debouncedSearch ? "Nessun risultato per la ricerca" : "Inizia aggiungendo il primo iscritto"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                <span>Totale: {totalMembers} partecipanti</span>
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
                    <SortableTableHead sortKey="name" currentSort={sortConfig} onSort={handleSort}>Nome e Cognome</SortableTableHead>
                    <SortableTableHead sortKey="fiscalCode" currentSort={sortConfig} onSort={handleSort}>Codice Fiscale</SortableTableHead>
                    <SortableTableHead sortKey="email" currentSort={sortConfig} onSort={handleSort}>Email</SortableTableHead>
                    <SortableTableHead sortKey="phone" currentSort={sortConfig} onSort={handleSort}>Mobile</SortableTableHead>
                    <SortableTableHead sortKey="cardNumber" currentSort={sortConfig} onSort={handleSort}>Tessera</SortableTableHead>
                    <SortableTableHead sortKey="medicalCert" currentSort={sortConfig} onSort={handleSort}>Cert. Medico</SortableTableHead>
                    <SortableTableHead sortKey="status" currentSort={sortConfig} onSort={handleSort}>Stato</SortableTableHead>
                    <SortableTableHead sortKey="courses" currentSort={sortConfig} onSort={() => {}} className="text-right">Corsi Attivi</SortableTableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMembers.map((member) => (
                      <TableRow key={member.id} data-testid={`member-row-${member.id}`}>
                        <TableCell className={isSortedColumn("name") ? "sorted-column-cell" : undefined}>
                          <span 
                            className="font-bold hover:underline cursor-pointer"
                            onClick={async () => {
                              try {
                                const [memberRes, enrollmentsRes, coursesRes, attendancesRes, workshopsRes, workshopEnrollmentsRes] = await Promise.all([
                                  fetch(`/api/members/${member.id}`, { credentials: "include" }),
                                  fetch(`/api/enrollments?memberId=${member.id}`, { credentials: "include" }),
                                  fetch(`/api/courses`, { credentials: "include" }),
                                  fetch(`/api/attendances/member/${member.id}`, { credentials: "include" }),
                                  fetch(`/api/workshops`, { credentials: "include" }),
                                  fetch(`/api/workshop-enrollments?memberId=${member.id}`, { credentials: "include" }),
                                ]);
                                if (memberRes.ok) {
                                  const fullMember = await memberRes.json();
                                  setEditingMember(fullMember);
                                  setHasMedicalCert(fullMember.hasMedicalCertificate || false);
                                  setIsMinorChecked(fullMember.isMinor || false);
                                  if (enrollmentsRes.ok) {
                                    setMemberEnrollments(await enrollmentsRes.json());
                                  }
                                  if (coursesRes.ok) {
                                    setCourses(await coursesRes.json());
                                  }
                                  if (attendancesRes.ok) {
                                    setAttendances(await attendancesRes.json());
                                  }
                                  if (workshopsRes.ok) {
                                    setWorkshops(await workshopsRes.json());
                                  }
                                  if (workshopEnrollmentsRes.ok) {
                                    setMemberWorkshopEnrollments(await workshopEnrollmentsRes.json());
                                  }
                                  setIsFormOpen(true);
                                }
                              } catch (e) {
                                console.error("Error loading member:", e);
                              }
                            }}
                            data-testid={`link-member-${member.id}`}
                          >
                            {member.firstName} {member.lastName}
                          </span>
                        </TableCell>
                        <TableCell className={cn("font-mono text-sm", isSortedColumn("fiscalCode") && "sorted-column-cell")}>{member.fiscalCode || "-"}</TableCell>
                        <TableCell className={isSortedColumn("email") ? "sorted-column-cell" : undefined}>{member.email || "-"}</TableCell>
                        <TableCell className={isSortedColumn("phone") ? "sorted-column-cell" : undefined}>{member.mobile || member.phone || "-"}</TableCell>
                        <TableCell className={isSortedColumn("cardNumber") ? "sorted-column-cell" : undefined}>
                          {member.cardNumber ? (
                            <div className="text-sm">
                              <div>{member.cardNumber}</div>
                              {member.cardExpiryDate && (
                                <div className="text-xs text-muted-foreground">
                                  Scad. {new Date(member.cardExpiryDate).toLocaleDateString('it-IT')}
                                </div>
                              )}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell className={isSortedColumn("medicalCert") ? "sorted-column-cell" : undefined}>
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
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className={isSortedColumn("status") ? "sorted-column-cell" : undefined}>
                          <Badge variant="outline" className="bg-muted/50 border-amber-500/50 text-foreground">
                            {member.active ? "Attivo" : "Inattivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className={isSortedColumn("courses") ? "sorted-column-cell" : undefined}>
                          {(member as any).activeCourseCount > 0 ? (
                            <Badge variant="outline" className="text-xs">
                              {(member as any).activeCourseCount} {(member as any).activeCourseCount === 1 ? "corso" : "corsi"}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Nessun corso</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedMemberForEnrollment(member);
                                setIsEnrollmentDialogOpen(true);
                              }}
                              data-testid={`button-enroll-member-${member.id}`}
                            >
                              <GraduationCap className="w-4 h-4 mr-2" />
                              Iscrizioni
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedMemberForMembership(member);
                                setIsMembershipDialogOpen(true);
                              }}
                              data-testid={`button-manage-membership-${member.id}`}
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Tessere
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setLocation(`/?memberId=${member.id}`)}
                              title="Apri in Anagrafica"
                              data-testid={`button-edit-member-${member.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Sei sicuro di voler eliminare questo iscritto?")) {
                                  deleteMutation.mutate(member.id);
                                }
                              }}
                              data-testid={`button-delete-member-${member.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
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
            <DialogTitle>{editingMember ? "Modifica Partecipante" : "Nuovo Partecipante"}</DialogTitle>
            <DialogDescription>
              Inserisci i dati anagrafici completi dell'iscritto
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                <Label htmlFor="categoryId">Categoria Partecipante (opzionale)</Label>
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
                      const renderCategories = (parentId: number | null = null, level: number = 0): any[] => {
                        const categories = clientCategories?.filter(cat => cat.parentId === parentId) || [];
                        return categories.flatMap((cat) => [
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {'\u00A0'.repeat(level * 4)}{cat.name}
                          </SelectItem>,
                          ...renderCategories(cat.id, level + 1)
                        ]);
                      };
                      return renderCategories();
                    })()}
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
                    defaultValue={editingMember?.dateOfBirth || ""}
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
                  <Label htmlFor="address">Indirizzo</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={editingMember?.address || ""}
                    data-testid="input-address"
                  />
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
                    defaultValue={editingMember?.cardIssueDate || ""}
                    data-testid="input-cardIssueDate"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardExpiryDate">Scadenza Tessera</Label>
                  <Input
                    id="cardExpiryDate"
                    name="cardExpiryDate"
                    type="date"
                    defaultValue={editingMember?.cardExpiryDate || ""}
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
                    defaultValue={editingMember?.medicalCertificateExpiry || ""}
                    data-testid="input-medicalCertificateExpiry"
                  />
                </div>
              )}
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
                className="gold-3d-button"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-member"
              >
                {editingMember ? "Salva Modifiche" : "Crea Partecipante"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
    queryKey: ["/api/enrollments"],
  });

  const { data: payments } = useQuery<any[]>({
    queryKey: ["/api/payments"],
  });

  const createEnrollmentMutation = useMutation({
    mutationFn: async (data: { memberId: number; courseId: number }) => {
      const result = await apiRequest("POST", "/api/enrollments", data);
      return result;
    },
    onSuccess: async (enrollment: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
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
            Gestione Iscrizioni - {member?.firstName} {member?.lastName}
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
                              <Badge variant="outline" className="text-xs bg-muted/50 border-amber-500/50 text-foreground">Pagato</Badge>
                            ) : enrollmentPayments.some(p => p.status === "overdue") ? (
                              <Badge variant="outline" className="text-xs bg-muted/50 border-amber-500/50 text-foreground">Scaduto</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-muted/50 border-amber-500/50 text-foreground">In sospeso</Badge>
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
            <h3 className="font-medium mb-3">Nuova Iscrizione</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="course">Corso *</Label>
                <select
                  id="course"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  data-testid="select-enrollment-course"
                >
                  <option value="">Seleziona un corso</option>
                  {availableCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name} {course.price ? `- €${course.price}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="courseFee">Quota Corso (€) *</Label>
                  <Input
                    id="courseFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={courseFee}
                    onChange={(e) => setCourseFee(e.target.value)}
                    data-testid="input-course-fee"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="membershipFee">Quota Tesseramento (€)</Label>
                  <Input
                    id="membershipFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={membershipFee}
                    onChange={(e) => setMembershipFee(e.target.value)}
                    disabled={!includeMembership}
                    data-testid="input-membership-fee"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeMembership"
                  checked={includeMembership}
                  onCheckedChange={(checked) => setIncludeMembership(checked as boolean)}
                  data-testid="checkbox-include-membership"
                />
                <Label htmlFor="includeMembership" className="cursor-pointer">
                  Includi quota tesseramento
                </Label>
              </div>
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
          <Button
            onClick={handleEnroll}
            disabled={!selectedCourseId || !courseFee || createEnrollmentMutation.isPending}
            data-testid="button-submit-enrollment"
          >
            Iscriviti al Corso
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
            Gestione Tessere e Certificati - {member?.firstName} {member?.lastName}
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
                size="sm"
                variant="outline"
                onClick={() => setIsAddingMembership(true)}
                data-testid="button-add-membership"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuova Tessera
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingMembership(membership)}
                          data-testid={`button-edit-membership-${membership.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
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

            {/* Membership Form */}
            {(isAddingMembership || editingMembership) && (
              <form onSubmit={handleSubmitMembership} className="mt-4 border rounded-md p-4 bg-muted/30 space-y-4">
                <h4 className="font-medium">{editingMembership ? "Modifica Tessera" : "Nuova Tessera"}</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="previousMembershipNumber">Tessera Precedente (opzionale)</Label>
                    <Input
                      id="previousMembershipNumber"
                      name="previousMembershipNumber"
                      defaultValue={editingMembership?.previousMembershipNumber || ""}
                      placeholder="es: 2526000123"
                      data-testid="input-previous-membership-number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fee">Quota (€)</Label>
                    <Input
                      id="fee"
                      name="fee"
                      type="number"
                      step="0.01"
                      defaultValue={editingMembership?.fee || "30.00"}
                      data-testid="input-membership-fee"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Data Rilascio *</Label>
                    <Input
                      id="issueDate"
                      name="issueDate"
                      type="date"
                      required
                      defaultValue={editingMembership?.issueDate || new Date().toISOString().split('T')[0]}
                      data-testid="input-membership-issue-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Data Scadenza *</Label>
                    <Input
                      id="expiryDate"
                      name="expiryDate"
                      type="date"
                      required
                      defaultValue={editingMembership?.expiryDate || ""}
                      data-testid="input-membership-expiry-date"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Stato</Label>
                    <Select name="status" defaultValue={editingMembership?.status || "active"}>
                      <SelectTrigger data-testid="select-membership-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Attiva</SelectItem>
                        <SelectItem value="expired">Scaduta</SelectItem>
                        <SelectItem value="suspended">Sospesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select name="type" defaultValue={editingMembership?.type || "annual"}>
                      <SelectTrigger data-testid="select-membership-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual">Annuale</SelectItem>
                        <SelectItem value="monthly">Mensile</SelectItem>
                        <SelectItem value="seasonal">Stagionale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddingMembership(false);
                      setEditingMembership(null);
                    }}
                    data-testid="button-cancel-membership"
                  >
                    Annulla
                  </Button>
                  <Button 
                    type="submit"
                    className="gold-3d-button"
                    disabled={createMembershipMutation.isPending || updateMembershipMutation.isPending}
                    data-testid="button-submit-membership"
                  >
                    {editingMembership ? "Salva Modifiche" : "Crea Tessera"}
                  </Button>
                </div>
              </form>
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
                size="sm"
                variant="outline"
                onClick={() => setIsAddingCertificate(true)}
                data-testid="button-add-certificate"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuovo Certificato
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingCertificate(cert)}
                          data-testid={`button-edit-certificate-${cert.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
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

            {/* Certificate Form */}
            {(isAddingCertificate || editingCertificate) && (
              <form onSubmit={handleSubmitCertificate} className="mt-4 border rounded-md p-4 bg-muted/30 space-y-4">
                <h4 className="font-medium">{editingCertificate ? "Modifica Certificato" : "Nuovo Certificato"}</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cert-issueDate">Data Rilascio *</Label>
                    <Input
                      id="cert-issueDate"
                      name="issueDate"
                      type="date"
                      required
                      defaultValue={editingCertificate?.issueDate || new Date().toISOString().split('T')[0]}
                      data-testid="input-certificate-issue-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cert-expiryDate">Data Scadenza *</Label>
                    <Input
                      id="cert-expiryDate"
                      name="expiryDate"
                      type="date"
                      required
                      defaultValue={editingCertificate?.expiryDate || ""}
                      data-testid="input-certificate-expiry-date"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="doctorName">Nome Medico</Label>
                    <Input
                      id="doctorName"
                      name="doctorName"
                      defaultValue={editingCertificate?.doctorName || ""}
                      placeholder="Dr. Mario Rossi"
                      data-testid="input-doctor-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cert-status">Stato</Label>
                    <Select name="status" defaultValue={editingCertificate?.status || "valid"}>
                      <SelectTrigger data-testid="select-certificate-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="valid">Valido</SelectItem>
                        <SelectItem value="expired">Scaduto</SelectItem>
                        <SelectItem value="pending">In attesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cert-notes">Note</Label>
                  <Textarea
                    id="cert-notes"
                    name="notes"
                    rows={2}
                    defaultValue={editingCertificate?.notes || ""}
                    placeholder="Note aggiuntive..."
                    data-testid="input-certificate-notes"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddingCertificate(false);
                      setEditingCertificate(null);
                    }}
                    data-testid="button-cancel-certificate"
                  >
                    Annulla
                  </Button>
                  <Button 
                    type="submit"
                    className="gold-3d-button"
                    disabled={createCertificateMutation.isPending || updateCertificateMutation.isPending}
                    data-testid="button-submit-certificate"
                  >
                    {editingCertificate ? "Salva Modifiche" : "Crea Certificato"}
                  </Button>
                </div>
              </form>
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

export { MembershipManagementDialog };
