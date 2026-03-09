import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, AlertCircle, FileJson } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AuditLog {
    id: number;
    action: string;
    entityType: string;
    entityId: number;
    performedBy: string;
    details: string | null;
    createdAt: string;
}

export default function AuditLogsPage() {
    const { data: logs, isLoading } = useQuery<AuditLog[]>({
        queryKey: ["/api/audit-logs"],
    });

    const getEntityLabel = (type: string) => {
        switch (type) {
            case 'payments': return 'Pagamento';
            case 'enrollments': return 'Iscrizione';
            default: return type;
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-destructive/10 p-3 rounded-full">
                    <Trash2 className="w-6 h-6 text-destructive" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Storico Eliminazioni (Cestino)
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Visualizza il log di sicurezza delle eliminazioni effettuate nel gestionale.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Registro Eliminazioni Dati</CardTitle>
                    <CardDescription>
                        Mostra chi ha eliminato file o record sensibili per evitare perdite di dati.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Utente</TableHead>
                                    <TableHead>Oggetto</TableHead>
                                    <TableHead>Azione</TableHead>
                                    <TableHead className="text-right">Dati Originali</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            Caricamento storico...
                                        </TableCell>
                                    </TableRow>
                                ) : !logs || logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                                            Nessun record eliminato di cui si abbia traccia.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm", { locale: it })}
                                            </TableCell>
                                            <TableCell className="font-medium text-amber-600 dark:text-amber-500">
                                                {log.performedBy}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="font-mono bg-slate-50">
                                                        {getEntityLabel(log.entityType)} #{log.entityId}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">
                                                    {log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {log.details ? (
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 gap-2">
                                                                <FileJson className="w-4 h-4 text-primary" />
                                                                <span className="hidden sm:inline">Vedi Backup</span>
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                                            <DialogHeader>
                                                                <DialogTitle>Copia Dati: {getEntityLabel(log.entityType)} #{log.entityId}</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="bg-slate-950 p-4 rounded-lg mt-4 text-green-400 font-mono text-sm overflow-x-auto">
                                                                <pre>{JSON.stringify(JSON.parse(log.details), null, 2)}</pre>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">Non disp.</span>
                                                )}
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
