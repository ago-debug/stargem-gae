import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { cn } from "@/lib/utils";
import type { Member } from "@shared/schema";

export function TabTessereEnte() {
  const [entityCardSearch, setEntityCardSearch] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  const { data: entityCardMembers, isLoading: entityCardsLoading } = useQuery<Member[]>({
    queryKey: ["/api/members/entity-cards"],
  });

  const tsEntityCards = useSortableTable<Member>("member");

  const getExpiryStatus = (expiryDate: string | Date | null | undefined) => {
    if (!expiryDate) return { status: "unknown", label: "N/D", variant: "secondary" as const };
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return { status: "expired", label: "Scaduto", variant: "destructive" as const };
    if (daysUntilExpiry <= 7) return { status: "expiring", label: "In Scadenza", variant: "secondary" as const };
    return { status: "active", label: "Attivo", variant: "default" as const };
  };

  const getEntityCardSortValue = (member: Member, key: string) => {
    switch (key) {
      case "member": return `${member.lastName} ${member.firstName}`;
      case "type": return member.entityCardType;
      case "number": return member.entityCardNumber;
      case "issueDate": return member.entityCardIssueDate;
      case "expiryDate": return member.entityCardExpiryDate;
      case "status": return member.entityCardExpiryDate ? getExpiryStatus(member.entityCardExpiryDate).label : "";
      default: return null;
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative max-w-md flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per cognome, nome o codice fiscale..."
            value={entityCardSearch}
            onChange={(e) => setEntityCardSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
            <SelectTrigger className="w-[180px] shrink-0">
              <SelectValue placeholder="Tutti gli enti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli enti</SelectItem>
              {Array.from(new Set((entityCardMembers || []).map(m => m.entityCardType).filter(Boolean))).map(type => (
                <SelectItem key={type as string} value={type as string}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2 shrink-0">
            <Checkbox 
              id="show-only-active" 
              checked={showOnlyActive} 
              onCheckedChange={(checked) => setShowOnlyActive(checked === true)} 
            />
            <Label htmlFor="show-only-active" className="cursor-pointer">Solo tessere attive</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {entityCardsLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (() => {
          const allEntityCardMembers = entityCardMembers || [];
          const filteredEntityCardsRaw = allEntityCardMembers.filter(m => {
            if (entityTypeFilter !== "all" && m.entityCardType !== entityTypeFilter) return false;
            
            if (showOnlyActive) {
              const expiryInfo = m.entityCardExpiryDate ? getExpiryStatus(m.entityCardExpiryDate) : null;
              if (!expiryInfo || expiryInfo.status !== "active") return false;
            }

            if (!entityCardSearch || entityCardSearch.length < 3) return true;
            const searchLower = entityCardSearch.toLowerCase();
            return (
              m.firstName?.toLowerCase().includes(searchLower) ||
              m.lastName?.toLowerCase().includes(searchLower) ||
              m.fiscalCode?.toLowerCase().includes(searchLower)
            );
          });
          const filteredEntityCards = tsEntityCards.sortItems(filteredEntityCardsRaw, getEntityCardSortValue);

          if (filteredEntityCards.length === 0) {
            return (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Nessuna tessera ente trovata</p>
                <p className="text-sm">Le tessere ente vengono gestite nella scheda Anagrafica del partecipante</p>
              </div>
            );
          }

          return (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead sortKey="member" currentSort={tsEntityCards.sortConfig} onSort={tsEntityCards.handleSort}>Partecipante</SortableTableHead>
                  <SortableTableHead sortKey="type" currentSort={tsEntityCards.sortConfig} onSort={tsEntityCards.handleSort}>Tipo Ente</SortableTableHead>
                  <SortableTableHead sortKey="number" currentSort={tsEntityCards.sortConfig} onSort={tsEntityCards.handleSort}>Numero Tessera</SortableTableHead>
                  <SortableTableHead sortKey="issueDate" currentSort={tsEntityCards.sortConfig} onSort={tsEntityCards.handleSort}>Data Rilascio</SortableTableHead>
                  <SortableTableHead sortKey="expiryDate" currentSort={tsEntityCards.sortConfig} onSort={tsEntityCards.handleSort}>Scadenza</SortableTableHead>
                  <SortableTableHead sortKey="status" currentSort={tsEntityCards.sortConfig} onSort={tsEntityCards.handleSort}>Stato</SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntityCards.map((member) => {
                  const expiryInfo = member.entityCardExpiryDate
                    ? getExpiryStatus(member.entityCardExpiryDate)
                    : { status: "unknown", label: "N/D", variant: "secondary" as const };
                  return (
                    <TableRow key={member.id}>
                      <TableCell className={cn("font-medium", tsEntityCards.isSortedColumn("member") && "sorted-column-cell")}>
                        {member.lastName} {member.firstName}
                      </TableCell>
                      <TableCell className={cn(tsEntityCards.isSortedColumn("type") && "sorted-column-cell")}>
                        <Badge variant="outline">{member.entityCardType || "-"}</Badge>
                      </TableCell>
                      <TableCell className={cn("font-mono text-xs", tsEntityCards.isSortedColumn("number") && "sorted-column-cell")}>{member.entityCardNumber || "-"}</TableCell>
                      <TableCell className={cn(tsEntityCards.isSortedColumn("issueDate") && "sorted-column-cell")}>
                        {member.entityCardIssueDate
                          ? new Date(member.entityCardIssueDate).toLocaleDateString('it-IT')
                          : "-"}
                      </TableCell>
                      <TableCell className={cn(tsEntityCards.isSortedColumn("expiryDate") && "sorted-column-cell")}>
                        {member.entityCardExpiryDate
                          ? new Date(member.entityCardExpiryDate).toLocaleDateString('it-IT')
                          : "-"}
                      </TableCell>
                      <TableCell className={cn(tsEntityCards.isSortedColumn("status") && "sorted-column-cell")}>
                        <Badge variant={expiryInfo.variant}>
                          {expiryInfo.label}
                        </Badge>
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
  );
}
