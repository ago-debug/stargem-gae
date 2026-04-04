import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { cn } from "@/lib/utils";

export function SharedActivityLog({ hideTitle = false }: { hideTitle?: boolean }) {
  const { data: activityLogs, isLoading: logsLoading } = useQuery<any[]>({
    queryKey: ["/api/activity-logs"],
    refetchInterval: 30000,
  });

  const { sortConfig: scLog, handleSort: hsLog, sortItems: siLog, isSortedColumn: iscLog } = useSortableTable<any>("createdAt", "desc");
  const getSortValueLog = (log: any, key: string) => {
    switch (key) {
      case "createdAt": return new Date(log.createdAt).getTime();
      case "username": return log.user?.username || "";
      case "action": return log.action || "";
      case "entityType": return log.entityType || "";
      case "details": return log.details ? JSON.stringify(log.details) : "";
      default: return null;
    }
  };

  if (logsLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!hideTitle && <h3 className="text-lg font-medium">Cronologia Operazioni e Accessi</h3>}
      <div className="border rounded-md overflow-x-auto max-h-[60vh] overflow-y-auto">
        <Table>
          <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <TableRow>
              <SortableTableHead sortKey="createdAt" currentSort={scLog} onSort={hsLog}>Data/Ora</SortableTableHead>
              <SortableTableHead sortKey="username" currentSort={scLog} onSort={hsLog}>Utente</SortableTableHead>
              <SortableTableHead sortKey="action" currentSort={scLog} onSort={hsLog}>Operazione</SortableTableHead>
              <SortableTableHead sortKey="entityType" currentSort={scLog} onSort={hsLog}>Entità</SortableTableHead>
              <SortableTableHead sortKey="details" currentSort={scLog} onSort={hsLog}>Dettagli Info</SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {siLog(activityLogs || [], getSortValueLog).map((log: any) => (
              <TableRow key={log.id}>
                <TableCell className={cn("text-xs whitespace-nowrap", iscLog("createdAt") && "sorted-column-cell")}>
                  {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: it })}
                </TableCell>
                <TableCell className={cn("font-medium text-xs", iscLog("username") && "sorted-column-cell")}>
                  {log.user.username}
                </TableCell>
                <TableCell className={cn(iscLog("action") && "sorted-column-cell")}>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                    log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                      log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                        log.action === 'LOGIN' ? 'bg-emerald-100 text-emerald-700' :
                          log.action === 'LOGOUT' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                    }`}>
                    {log.action}
                  </span>
                </TableCell>
                <TableCell className={cn("text-xs uppercase", iscLog("entityType") && "sorted-column-cell")}>
                  {log.entityType || "-"}
                </TableCell>
                <TableCell className={cn("text-xs max-w-md truncate", iscLog("details") && "sorted-column-cell")}>
                  {log.action === "LOGOUT" && log.details?.durationMins !== undefined
                    ? `Sessione conclusa (durata: ${log.details.durationMins > 60 ? Math.floor(log.details.durationMins / 60) + 'h ' + (log.details.durationMins % 60) + 'm' : log.details.durationMins + 'm'})`
                    : log.action === "LOGIN"
                      ? `Ingresso nel sistema`
                      : log.details ? JSON.stringify(log.details) : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
