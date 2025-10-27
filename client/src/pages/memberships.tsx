import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, IdCard, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Membership, InsertMembership, MedicalCertificate, InsertMedicalCertificate, Member } from "@shared/schema";

export default function Memberships() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMembershipFormOpen, setIsMembershipFormOpen] = useState(false);
  const [isCertificateFormOpen, setIsCertificateFormOpen] = useState(false);
  const [editingMembership, setEditingMembership] = useState<Membership | null>(null);
  const [editingCertificate, setEditingCertificate] = useState<MedicalCertificate | null>(null);

  const { data: memberships, isLoading: membershipsLoading } = useQuery<Membership[]>({
    queryKey: ["/api/memberships"],
  });

  const { data: certificates, isLoading: certificatesLoading } = useQuery<MedicalCertificate[]>({
    queryKey: ["/api/medical-certificates"],
  });

  const { data: members } = useQuery<Member[]>({
    queryKey: ["/api/members"],
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
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleMembershipSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: InsertMembership = {
      memberId: parseInt(formData.get("memberId") as string),
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
    const formData = new FormData(e.currentTarget);
    const data: InsertMedicalCertificate = {
      memberId: parseInt(formData.get("memberId") as string),
      issueDate: formData.get("issueDate") as string,
      expiryDate: formData.get("expiryDate") as string,
      doctorName: formData.get("doctorName") as string || null,
      notes: formData.get("notes") as string || null,
      status: "valid",
    };

    createCertificateMutation.mutate(data);
  };

  const getMemberName = (memberId: number) => {
    const member = members?.find(m => m.id === memberId);
    return member ? `${member.firstName} ${member.lastName}` : "Sconosciuto";
  };

  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: "expired", label: "Scaduto", variant: "destructive" as const };
    if (daysUntilExpiry <= 7) return { status: "expiring", label: "In Scadenza", variant: "secondary" as const };
    return { status: "active", label: "Attivo", variant: "default" as const };
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Tessere & Certificati Medici</h1>
        <p className="text-muted-foreground">Gestisci tessere associative e certificati medici</p>
      </div>

      <Tabs defaultValue="memberships" className="space-y-6">
        <TabsList>
          <TabsTrigger value="memberships" data-testid="tab-memberships">
            <IdCard className="w-4 h-4 mr-2" />
            Tessere Associative
          </TabsTrigger>
          <TabsTrigger value="certificates" data-testid="tab-certificates">
            <FileText className="w-4 h-4 mr-2" />
            Certificati Medici
          </TabsTrigger>
        </TabsList>

        <TabsContent value="memberships" className="space-y-6">
          <div className="flex items-center justify-end">
            <Button 
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
                  placeholder="Cerca tessera..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>N. Tessera</TableHead>
                      <TableHead>Barcode</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Scadenza</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberships.map((membership) => {
                      const expiryInfo = getExpiryStatus(membership.expiryDate);
                      return (
                        <TableRow key={membership.id} data-testid={`membership-row-${membership.id}`}>
                          <TableCell className="font-medium">
                            {getMemberName(membership.memberId)}
                          </TableCell>
                          <TableCell>{membership.membershipNumber}</TableCell>
                          <TableCell className="font-mono text-xs">{membership.barcode}</TableCell>
                          <TableCell>{membership.type || "-"}</TableCell>
                          <TableCell>{new Date(membership.expiryDate).toLocaleDateString('it-IT')}</TableCell>
                          <TableCell>
                            <Badge variant={expiryInfo.variant}>
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-6">
          <div className="flex items-center justify-end">
            <Button 
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
            <CardContent className="pt-6">
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
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Medico</TableHead>
                      <TableHead>Data Rilascio</TableHead>
                      <TableHead>Scadenza</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates.map((cert) => {
                      const expiryInfo = getExpiryStatus(cert.expiryDate);
                      return (
                        <TableRow key={cert.id} data-testid={`certificate-row-${cert.id}`}>
                          <TableCell className="font-medium">
                            {getMemberName(cert.memberId)}
                          </TableCell>
                          <TableCell>{cert.doctorName || "-"}</TableCell>
                          <TableCell>{new Date(cert.issueDate).toLocaleDateString('it-IT')}</TableCell>
                          <TableCell>{new Date(cert.expiryDate).toLocaleDateString('it-IT')}</TableCell>
                          <TableCell>
                            <Badge variant={expiryInfo.variant}>
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
              )}
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
              <Label htmlFor="memberId">Cliente *</Label>
              <Select name="memberId" required>
                <SelectTrigger data-testid="select-member">
                  <SelectValue placeholder="Seleziona iscritto" />
                </SelectTrigger>
                <SelectContent>
                  {members?.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.firstName} {member.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="cert-memberId">Iscritto *</Label>
              <Select name="memberId" required>
                <SelectTrigger data-testid="select-cert-member">
                  <SelectValue placeholder="Seleziona iscritto" />
                </SelectTrigger>
                <SelectContent>
                  {members?.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.firstName} {member.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
