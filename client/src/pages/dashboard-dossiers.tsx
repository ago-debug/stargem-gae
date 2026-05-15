import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Play, Trash2, Search, FileText, CheckCircle2, Clock 
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function DashboardDossiers() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");

  const { data: dossiers = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/dossiers'],
    // In un app reale filtreremmo lato server per user.id e status
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/dossiers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dossiers'] });
      toast({ title: "Pratica annullata" });
    }
  });

  const filteredDossiers = dossiers.filter((d: any) => 
    d.status !== 'completed' &&
    (search === "" || d.member_id?.toString().includes(search) || d.dossier_type.toLowerCase().includes(search.toLowerCase()))
  );

  const completedCount = dossiers.filter((d: any) => d.status === 'completed').length;
  const openCount = filteredDossiers.length;

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'in_compilazione': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">In Compilazione</Badge>;
      case 'bozza': return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Bozza</Badge>;
      case 'completata': return <Badge className="bg-green-100 text-green-800 border-green-300">Completata</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'iscrizione_corso': return 'Iscrizione Corso';
      case 'nuovo_iscritto': return 'Nuovo Iscritto';
      case 'rinnovo': return 'Rinnovo';
      case 'acquisto_carnet': return 'Acquisto Carnet';
      default: return type;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Pratiche</h1>
          <p className="text-muted-foreground">Gestisci le pratiche (dossiers) in corso o inizia una nuova procedura guidata.</p>
        </div>
        <Button size="lg" onClick={() => setLocation('/dossiers/nuovo')}>
          <PlusIcon className="w-5 h-5 mr-2" /> Nuova Pratica Guidata
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="flex items-center p-6 gap-4">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-full">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pratiche Aperte</p>
              <h3 className="text-2xl font-bold">{openCount}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6 gap-4">
            <div className="p-3 bg-green-100 text-green-700 rounded-full">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completate (mese)</p>
              <h3 className="text-2xl font-bold">{completedCount}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6 gap-4">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-full">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tempo medio</p>
              <h3 className="text-2xl font-bold">4.2 min</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Le tue pratiche in corso</CardTitle>
          <CardDescription>Pratiche salvate in bozza o interrotte</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per tipo o ID cliente..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Tipo Pratica</TableHead>
                  <TableHead>Cliente (Member ID)</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Ultima Modifica</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">Caricamento...</TableCell>
                  </TableRow>
                ) : filteredDossiers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      Nessuna pratica in corso trovata.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDossiers.map((dossier: any) => (
                    <TableRow key={dossier.id}>
                      <TableCell className="font-medium">#{dossier.id}</TableCell>
                      <TableCell>{getTypeLabel(dossier.dossier_type)}</TableCell>
                      <TableCell>{dossier.member_id || 'Nuovo Utente'}</TableCell>
                      <TableCell>{getStatusBadge(dossier.status)}</TableCell>
                      <TableCell>
                        {dossier.updated_at ? format(new Date(dossier.updated_at), 'dd MMM yyyy, HH:mm', { locale: it }) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => setLocation(`/dossiers/${dossier.id}/wizard`)}
                          >
                            <Play className="w-4 h-4 mr-1" /> Continua
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => {
                              if (confirm('Sei sicuro di voler annullare questa pratica? I dati non salvati andranno persi.')) {
                                deleteMutation.mutate(dossier.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PlusIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
