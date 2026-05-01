import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, Plus, History, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Season } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function ResetStagione() {
  const { toast } = useToast();
  const [resetForm, setResetForm] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: ""
  });

  const { data: seasons, isLoading: seasonsLoading } = useQuery<Season[]>({
    queryKey: ["/api/seasons"],
  });

  const activeSeason = seasons?.find(s => s.active);

  const resetMutation = useMutation({
    mutationFn: async (data: typeof resetForm) => {
      return await apiRequest("POST", "/api/seasons/reset", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      toast({
        title: "Stagione Resettata",
        description: "La nuova stagione è stata creata e quella precedente è stata archiviata.",
      });
      setResetForm({ name: "", description: "", startDate: "", endDate: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile resettare la stagione",
        variant: "destructive",
      });
    }
  });

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetForm.name || !resetForm.startDate || !resetForm.endDate) {
      toast({
        title: "Campi mancanti",
        description: "Inserisci nome, data inizio e fine per la nuova stagione.",
        variant: "destructive",
      });
      return;
    }

    if (confirm("Sei sicuro di voler resettare la stagione? Tutti i corsi e le presenze attuali verranno archiviati per fare spazio ai nuovi dati.")) {
      resetMutation.mutate(resetForm);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestione Stagioni</h1>
          <p className="text-muted-foreground">
            Gestisci l'archiviazione, il reset e lo storico delle stagioni sportive
          </p>
        </div>
        {activeSeason && (
          <Badge variant="outline" className="px-4 py-2 text-md border-primary text-primary">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Stagione Attiva: {activeSeason.name}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="reset" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="reset">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset & Nuova Stagione
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            Stagioni Passate
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reset" className="space-y-6 pt-4">
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="text-md font-medium">
              ATTENZIONE: Questa operazione archivierà i dati della stagione corrente.
              Tutti i corsi e le iscrizioni "attive" verranno spostati nell'archivio storico.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Configura Nuova Stagione</CardTitle>
              <CardDescription>
                Inserisci i dettagli per la stagione che sta per iniziare
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReset} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Stagione (es. 2025/2026)</Label>
                    <Input
                      id="name"
                      placeholder="Stagione 2025/2026"
                      value={resetForm.name}
                      onChange={e => setResetForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrizione</Label>
                    <Textarea
                      id="description"
                      placeholder="Note aggiuntive per questa stagione..."
                      className="min-h-[100px]"
                      value={resetForm.description}
                      onChange={e => setResetForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data Inizio Stagione</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={resetForm.startDate}
                      onChange={e => setResetForm(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data Fine Stagione</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={resetForm.endDate}
                      onChange={e => setResetForm(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button
                      type="submit"
                      className="w-full md:w-auto"
                      disabled={resetMutation.isPending}
                    >
                      {resetMutation.isPending ? (
                        "Esecuzione in corso..."
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Avvia Nuova Stagione
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Archivio Storico</CardTitle>
              <CardDescription>
                Elenco di tutte le stagioni archiviate e consultabili
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">Nome</th>
                      <th className="h-10 px-4 text-left font-medium">Periodo</th>
                      <th className="h-10 px-4 text-left font-medium">Stato</th>
                      <th className="h-10 px-4 text-right font-medium">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seasons?.map((s) => (
                      <tr key={s.id} className="border-b transition-colors hover:bg-muted/30">
                        <td className="p-4 font-medium">{s.name}</td>
                        <td className="p-4">
                          {format(new Date(s.startDate), "dd/MM/yyyy")} - {format(new Date(s.endDate), "dd/MM/yyyy")}
                        </td>
                        <td className="p-4">
                          {s.active ? (
                            <Badge className="bg-green-500">Attiva</Badge>
                          ) : (
                            <Badge variant="secondary">Archiviata</Badge>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => toast({ title: "In arrivo", description: "La consultazione filtrata per stagione sarà disponibile a breve." })}>
                            Sfoglia Dati
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {(!seasons || seasons.length === 0) && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          Nessuna stagione registrata nel sistema.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
