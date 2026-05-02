import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, FileText, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import type { MedicalCertificate, Member } from "@shared/schema";

// TODO [FUTURE: MedGem Module]: I certificati medici attualmente vivono sotto l'hub GemPass.
// Come concordato, in futuro verranno sganciati e migrati in un nuovo spazio dedicato 
// alla sezione medica (MedGem) non appena questo modulo sarà progettato e costruito.
export function TabCertificati() {
  const { toast } = useToast();
  const [certPage, setCertPage] = useState(1);
  const pageSize = 50;
  const [certificateSearch, setCertificateSearch] = useState("");
  const debouncedCertificateSearch = useDebounce(certificateSearch, 500);

  const { data: certificatesResponse, isLoading: certificatesLoading } = useQuery<{data: MedicalCertificate[], total: number}>({
    queryKey: ["/api/medical-certificates", certPage, pageSize, debouncedCertificateSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(certPage), pageSize: String(pageSize) });
      if (debouncedCertificateSearch) params.set('search', debouncedCertificateSearch);
      const res = await fetch(`/api/medical-certificates?${params.toString()}`);
      if (!res.ok) throw new Error("Errore fetch certificati");
      return res.json();
    }
  });

  const certificates = certificatesResponse?.data || [];
  const certTotalPages = Math.ceil((certificatesResponse?.total || 0) / pageSize);

  const { data: membersData } = useQuery<{ members: Member[], total: number }>({
    queryKey: ["/api/members"],
  });
  const members = membersData?.members || [];

  const deleteCertificateMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/medical-certificates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-certificates"] });
      toast({ title: "Certificato eliminato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const tsCertificates = useSortableTable<any>("member");

  const getMemberName = (item: any) => {
    if (item.memberFirstName && item.memberLastName) {
      return `${item.memberLastName} ${item.memberFirstName}`;
    }
    if (!item.memberId) return "-";
    const member = members?.find(m => m.id === item.memberId);
    return member ? `${member.lastName} ${member.firstName}` : "Sconosciuto";
  };

  const getExpiryStatus = (expiryDate: string | Date | null | undefined) => {
    if (!expiryDate) return { status: "unknown", label: "N/D", variant: "secondary" as const };
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return { status: "expired", label: "Scaduto", variant: "destructive" as const };
    if (daysUntilExpiry <= 7) return { status: "expiring", label: "In Scadenza", variant: "secondary" as const };
    return { status: "active", label: "Attivo", variant: "default" as const };
  };

  const getCertificateSortValue = (item: any, key: string) => {
    switch (key) {
      case "member": return getMemberName(item);
      case "doctor": return item.doctorName;
      case "issueDate": return item.issueDate;
      case "expiryDate": return item.expiryDate;
      case "status": return getExpiryStatus(item.expiryDate).label;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => alert("Per aggiungere un certificato, utilizza la scheda Anagrafica dell'utente.")}>
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Certificato
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per cognome, nome o codice fiscale..."
              value={certificateSearch}
              onChange={(e) => {
                setCertificateSearch(e.target.value);
                setCertPage(1);
              }}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
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
          ) : (() => {
            const filteredCertificates = tsCertificates.sortItems(certificates, getCertificateSortValue);

            if (filteredCertificates.length === 0) {
              return (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Nessun risultato trovato</p>
                  <p className="text-sm">Prova con un altro termine di ricerca</p>
                </div>
              );
            }

            return (
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead sortKey="member" currentSort={tsCertificates.sortConfig} onSort={tsCertificates.handleSort}>Partecipante</SortableTableHead>
                    <SortableTableHead sortKey="doctor" currentSort={tsCertificates.sortConfig} onSort={tsCertificates.handleSort}>Medico</SortableTableHead>
                    <SortableTableHead sortKey="issueDate" currentSort={tsCertificates.sortConfig} onSort={tsCertificates.handleSort}>Data Rilascio</SortableTableHead>
                    <SortableTableHead sortKey="expiryDate" currentSort={tsCertificates.sortConfig} onSort={tsCertificates.handleSort}>Scadenza</SortableTableHead>
                    <SortableTableHead sortKey="status" currentSort={tsCertificates.sortConfig} onSort={tsCertificates.handleSort}>Stato</SortableTableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCertificates.map((cert) => {
                    const expiryInfo = getExpiryStatus(cert.expiryDate);
                    return (
                      <TableRow key={cert.id}>
                        <TableCell className={cn("font-medium", tsCertificates.isSortedColumn("member") && "sorted-column-cell")}>
                          {getMemberName(cert)}
                        </TableCell>
                        <TableCell className={cn(tsCertificates.isSortedColumn("doctor") && "sorted-column-cell")}>{cert.doctorName || "-"}</TableCell>
                        <TableCell className={cn(tsCertificates.isSortedColumn("issueDate") && "sorted-column-cell")}>{new Date(cert.issueDate).toLocaleDateString('it-IT')}</TableCell>
                        <TableCell className={cn(tsCertificates.isSortedColumn("expiryDate") && "sorted-column-cell")}>{new Date(cert.expiryDate).toLocaleDateString('it-IT')}</TableCell>
                        <TableCell className={cn(tsCertificates.isSortedColumn("status") && "sorted-column-cell")}>
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
                                deleteCertificateMutation.mutate(cert.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            );
          })()}
        </CardContent>
      </Card>
      
      {certTotalPages > 1 && (
        <div className="mt-4 flex justify-end">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCertPage(p => Math.max(1, p - 1))}
                  className={certPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="text-sm px-4">Pagina {certPage} di {certTotalPages}</span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCertPage(p => Math.min(certTotalPages, p + 1))}
                  className={certPage === certTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
