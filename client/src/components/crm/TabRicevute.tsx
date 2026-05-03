import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, Download, Banknote, CalendarDays, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCrmForm } from "@/components/crm/CrmFormContext";

export function TabRicevute() {
  const { selectedMemberId } = useCrmForm();

  const { data: memberPayments, isLoading } = useQuery<any[]>({
    queryKey: ["/api/payments", "member", selectedMemberId],
    queryFn: async () => {
      const params = new URLSearchParams({ page: "1", pageSize: "100", memberId: String(selectedMemberId) });
      const res = await fetch(`/api/payments?${params}`);
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error("Errore caricamento pagamenti");
      }
      const data = await res.json();
      return data.data || [];
    },
    enabled: !!selectedMemberId,
  });

  return (
    <Card id="ricevute" className="scroll-mt-32">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Receipt className="w-5 h-5 text-green-600" />
          Ricevute e Contabilità
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!selectedMemberId ? (
          <div className="text-center p-6 text-muted-foreground bg-muted/10 rounded-lg border border-dashed my-4">
            Salva o seleziona un partecipante per visualizzare le ricevute
          </div>
        ) : isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !memberPayments || memberPayments.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground bg-muted/10 rounded-lg border border-dashed my-4">
            Nessun pagamento registrato per questo utente.
          </div>
        ) : (
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data Pagamento</TableHead>
                  <TableHead>Causale (Riferimento)</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azione</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberPayments.map((payment) => {
                  const isTessera = payment.type === 'membership';
                  const hasReference = isTessera ? payment.membershipNumber : payment.courseName;
                  
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-muted-foreground" />
                          {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('it-IT') : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">{payment.description || "-"}</span>
                          <span className="text-xs text-muted-foreground">
                            {hasReference ? (
                              isTessera ? `Tessera N. ${hasReference}` : `Corso: ${hasReference}`
                            ) : "Nessun Riferimento Flat"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isTessera ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 uppercase tracking-widest text-[10px]">Quota Tessera</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-widest text-[10px]">Corso / Servizio</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-bold">
                        €{parseFloat(payment.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {payment.status === 'paid' || payment.status === 'completed' || payment.status === 'COMPLETED' ? (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">Pagato</Badge>
                        ) : (
                          <Badge variant="destructive">Da Pagare</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="gap-2" disabled={payment.status !== 'paid' && payment.status !== 'completed' && payment.status !== 'COMPLETED'}>
                          <Download className="w-4 h-4" /> PDF
                        </Button>
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
  );
}
