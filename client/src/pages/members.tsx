import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Plus, Search, Edit, Trash2, Users, GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Member, InsertMember } from "@shared/schema";

export default function Members() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showParentFields, setShowParentFields] = useState(false);
  const [hasMedicalCert, setHasMedicalCert] = useState(false);
  const [isEnrollmentDialogOpen, setIsEnrollmentDialogOpen] = useState(false);
  const [selectedMemberForEnrollment, setSelectedMemberForEnrollment] = useState<Member | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("none");

  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const { data: enrollments } = useQuery<any[]>({
    queryKey: ["/api/enrollments"],
  });

  const { data: courses } = useQuery<any[]>({
    queryKey: ["/api/courses"],
  });

  const { data: clientCategories } = useQuery<any[]>({
    queryKey: ["/api/client-categories"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertMember) => {
      await apiRequest("POST", "/api/members", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({ title: "Cliente creato con successo" });
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertMember }) => {
      await apiRequest("PATCH", `/api/members/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({ title: "Cliente aggiornato con successo" });
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/members/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({ title: "Cliente eliminato con successo" });
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
  };

  useEffect(() => {
    if (editingMember) {
      setHasMedicalCert(editingMember.hasMedicalCertificate || false);
      if (editingMember.dateOfBirth) {
        const age = calculateAge(editingMember.dateOfBirth);
        setShowParentFields(age < 18);
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: InsertMember = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      fiscalCode: formData.get("fiscalCode") as string || null,
      categoryId: (formData.get("categoryId") && formData.get("categoryId") !== "none") ? parseInt(formData.get("categoryId") as string) : null,
      dateOfBirth: formData.get("dateOfBirth") as string || null,
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

  const filteredMembers = members?.filter((member) =>
    `${member.firstName} ${member.lastName} ${member.email || ""} ${member.fiscalCode || ""}`.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getMemberEnrollments = (memberId: number) => {
    return enrollments?.filter(e => e.memberId === memberId).map(e => {
      const course = courses?.find(c => c.id === e.courseId);
      return course ? { id: course.id, name: course.name } : null;
    }).filter(Boolean) || [];
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Clienti/Anagrafiche</h1>
          <p className="text-muted-foreground">Anagrafica completa degli iscritti</p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          data-testid="button-add-member"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Cliente
        </Button>
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
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nessun iscritto trovato</p>
              <p className="text-sm">Inizia aggiungendo il primo iscritto</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome e Cognome</TableHead>
                    <TableHead>Codice Fiscale</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Tessera</TableHead>
                    <TableHead>Cert. Medico</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Corsi Attivi</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => {
                    const memberCourses = getMemberEnrollments(member.id);
                    return (
                      <TableRow key={member.id} data-testid={`member-row-${member.id}`}>
                        <TableCell className="font-medium">
                          {member.firstName} {member.lastName}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{member.fiscalCode || "-"}</TableCell>
                        <TableCell>{member.email || "-"}</TableCell>
                        <TableCell>{member.mobile || member.phone || "-"}</TableCell>
                        <TableCell>
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
                        <TableCell>
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
                        <TableCell>
                          <Badge variant={member.active ? "default" : "secondary"}>
                            {member.active ? "Attivo" : "Inattivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {memberCourses.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {memberCourses.slice(0, 2).map((course) => (
                                <Link key={course.id} href="/courses">
                                  <Badge variant="outline" className="text-xs cursor-pointer hover-elevate" data-testid={`badge-course-${course.id}`}>
                                    {course.name}
                                  </Badge>
                                </Link>
                              ))}
                              {memberCourses.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{memberCourses.length - 2} altri
                                </Badge>
                              )}
                            </div>
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
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingMember(member);
                                setSelectedCategoryId(member.categoryId?.toString() || "none");
                                setIsFormOpen(true);
                              }}
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
                    );
                  })}
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
            <DialogTitle>{editingMember ? "Modifica Cliente" : "Nuovo Cliente"}</DialogTitle>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fiscalCode">Codice Fiscale</Label>
                  <Input
                    id="fiscalCode"
                    name="fiscalCode"
                    defaultValue={editingMember?.fiscalCode || ""}
                    maxLength={16}
                    className="uppercase font-mono"
                    data-testid="input-fiscalCode"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Data di Nascita</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    defaultValue={editingMember?.dateOfBirth || ""}
                    onChange={(e) => handleDateOfBirthChange(e.target.value)}
                    data-testid="input-dateOfBirth"
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
                {editingMember ? "Salva Modifiche" : "Crea Cliente"}
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
