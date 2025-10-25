import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScanBarcode, CheckCircle, XCircle } from "lucide-react";
import type { AccessLog, InsertAccessLog } from "@shared/schema";

export default function AccessControl() {
  const { toast } = useToast();
  const [barcodeInput, setBarcodeInput] = useState("");

  const { data: recentAccesses, isLoading } = useQuery<AccessLog[]>({
    queryKey: ["/api/access-logs"],
  });

  const scanMutation = useMutation({
    mutationFn: async (barcode: string) => {
      const data: InsertAccessLog = {
        barcode,
        accessType: "entry",
      };
      return await apiRequest("POST", "/api/access-logs", data);
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/access-logs"] });
      if (response.valid) {
        toast({ 
          title: "Accesso Consentito",
          description: `Benvenuto ${response.memberName}`,
        });
      } else {
        toast({ 
          title: "Accesso Negato",
          description: response.reason || "Tessera non valida",
          variant: "destructive",
        });
      }
      setBarcodeInput("");
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
      setBarcodeInput("");
    },
  });

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      scanMutation.mutate(barcodeInput.trim());
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Controllo Accessi</h1>
        <p className="text-muted-foreground">Sistema di registrazione accessi tramite barcode</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanBarcode className="w-5 h-5" />
              Scanner Barcode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleScan} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="barcode">Scansiona o Inserisci Barcode</Label>
                <Input
                  id="barcode"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scansiona barcode tessera..."
                  autoFocus
                  data-testid="input-barcode-scan"
                  className="text-lg h-12"
                />
                <p className="text-xs text-muted-foreground">
                  Posiziona il cursore nel campo e scansiona il barcode, oppure inseriscilo manualmente
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={!barcodeInput.trim() || scanMutation.isPending}
                data-testid="button-scan"
              >
                {scanMutation.isPending ? "Verifica in corso..." : "Verifica Accesso"}
              </Button>
            </form>

            {/* Visual Feedback Area */}
            <div className="mt-6 p-6 border rounded-lg bg-muted/30 min-h-[200px] flex items-center justify-center">
              {scanMutation.isPending ? (
                <div className="text-center">
                  <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-muted-foreground">Verifica in corso...</p>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <ScanBarcode className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>In attesa di scansione</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today's Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiche Oggi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-foreground">
                  {recentAccesses?.filter(a => {
                    const today = new Date().toDateString();
                    return new Date(a.accessTime).toDateString() === today;
                  }).length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Accessi Totali</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-foreground">
                  {recentAccesses?.filter(a => {
                    const today = new Date().toDateString();
                    return new Date(a.accessTime).toDateString() === today && a.membershipStatus === 'active';
                  }).length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Accessi Validi</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Ultimi Accessi</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {recentAccesses?.slice(0, 10).map((access, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 rounded-md hover-elevate"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {new Date(access.accessTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {access.barcode}
                      </p>
                    </div>
                    {access.membershipStatus === 'active' ? (
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive flex-shrink-0 ml-2" />
                    )}
                  </div>
                ))}
                {(!recentAccesses || recentAccesses.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nessun accesso registrato oggi
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Access Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registro Accessi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Caricamento...</p>
          ) : !recentAccesses || recentAccesses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium mb-2">Nessun accesso registrato</p>
              <p className="text-sm">Gli accessi verranno visualizzati qui</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Ora</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Stato Tessera</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAccesses.map((access, index) => (
                  <TableRow key={index} data-testid={`access-log-${index}`}>
                    <TableCell>
                      {new Date(access.accessTime).toLocaleString('it-IT')}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{access.barcode}</TableCell>
                    <TableCell className="capitalize">{access.accessType}</TableCell>
                    <TableCell>
                      <Badge variant={access.membershipStatus === 'active' ? 'default' : 'destructive'}>
                        {access.membershipStatus || 'Sconosciuto'}
                      </Badge>
                    </TableCell>
                    <TableCell>{access.notes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
