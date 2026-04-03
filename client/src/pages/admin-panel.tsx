import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Database, AlertTriangle, CheckCircle2, XCircle, Loader2, ShieldCheck, Terminal, Wallet, Plus, ExternalLink, Link2, Clock, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const WEEKDAYS = [
  { id: "LUN", label: "Lunedì" },
  { id: "MAR", label: "Martedì" },
  { id: "MER", label: "Mercoledì" },
  { id: "GIO", label: "Giovedì" },
  { id: "VEN", label: "Venerdì" },
  { id: "SAB", label: "Sabato" },
  { id: "DOM", label: "Domenica" },
];

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2).toString().padStart(2, "0");
  const min = (i % 2) === 0 ? "00" : "30";
  return `${hour}:${min}`;
});

export default function AdminPanel() {
    const { toast } = useToast();
    const [syncStatus, setSyncStatus] = useState<{
        success?: boolean;
        stdout?: string;
        stderr?: string;
        message?: string;
    } | null>(null);
    const [seedMethodsStatus, setSeedMethodsStatus] = useState<{
        success?: boolean;
        message?: string;
    } | null>(null);

    const [centerHours, setCenterHours] = useState<{ start: string, end: string, days: string[] }>({
        start: "07:30",
        end: "23:00",
        days: ["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"]
    });

    const { data: centerHoursConfig, isLoading: isLoadingHours } = useQuery({
        queryKey: ["/api/config/center-hours"],
    });

    useEffect(() => {
        if (centerHoursConfig) {
            const config = centerHoursConfig as any;
            if (config.start && config.end && Array.isArray(config.days)) {
                setCenterHours(config);
            }
        }
    }, [centerHoursConfig]);

    const saveCenterHoursMutation = useMutation({
        mutationFn: async (data: typeof centerHours) => {
            return await apiRequest("POST", "/api/config/center-hours", data);
        },
        onSuccess: () => {
            toast({ title: "Orari globali del centro aggiornati" });
            queryClient.invalidateQueries({ queryKey: ["/api/config/center-hours"] });
        },
        onError: (err: any) => {
            toast({ title: "Errore salvataggio orari", description: err.message, variant: "destructive" });
        }
    });

    const seedMethodsMutation = useMutation({
        mutationFn: async () => {
            return await apiRequest("POST", "/api/admin/seed-payment-methods");
        },
        onSuccess: (data) => {
            setSeedMethodsStatus(data);
            if (data.success) {
                toast({ title: "Metodi di pagamento inizializzati" });
            }
        },
        onError: (error: any) => {
            setSeedMethodsStatus({ success: false, message: error.message });
        }
    });

    const syncDbMutation = useMutation({
        mutationFn: async () => {
            return await apiRequest("POST", "/api/admin/db-sync");
        },
        onSuccess: (data) => {
            setSyncStatus(data);
            if (data.success) {
                toast({ title: "Database sincronizzato con successo" });
            } else {
                toast({
                    title: "Errore durante la sincronizzazione",
                    description: data.message || "Errore sconosciuto",
                    variant: "destructive"
                });
            }
        },
        onError: (error: any) => {
            setSyncStatus({ success: false, message: error.message });
            toast({
                title: "Errore di rete",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    const { data: googleStatus, refetch: refetchGoogleStatus } = useQuery<{ connected: boolean, method: string }>({
        queryKey: ["/api/auth/google/status"],
    });

    const googleLoginMutation = useMutation({
        mutationFn: async () => {
            return await apiRequest("GET", "/api/auth/google/url");
        },
        onSuccess: (data) => {
            if (data.url) {
                // Open in new window for standard OAuth flow
                window.open(data.url, 'google-auth', 'width=600,height=700');

                // Set up listener to refetch status when window closes (approximate)
                const timer = setInterval(() => {
                    refetchGoogleStatus();
                }, 3000);
                setTimeout(() => clearInterval(timer), 60000);
            }
        },
        onError: (err: any) => {
            toast({
                title: "Errore autenticazione",
                description: err.message,
                variant: "destructive"
            });
        }
    });

    return (
        <div className="p-6 md:p-8 space-y-6 mx-auto">
            <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="w-8 h-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-semibold text-foreground">Pannello Amministratore</h1>
                    <p className="text-muted-foreground">Strumenti tecnici e manutenzione del sistema</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-primary/20 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5 text-primary" />
                            Gestione Database
                        </CardTitle>
                        <CardDescription>
                            Aggiorna lo schema del database all'ultima versione disponibile.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
                            <div className="text-sm text-yellow-800">
                                <p className="font-semibold mb-1">Attenzione</p>
                                <p>Questa operazione sincronizza la struttura del database con il codice. Assicurati che non ci siano operazioni critiche in corso.</p>
                            </div>
                        </div>

                        <Button
                            onClick={() => syncDbMutation.mutate()}
                            disabled={syncDbMutation.isPending}
                            className="w-full sm:w-auto"
                            data-testid="button-sync-db"
                        >
                            {syncDbMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sincronizzazione in corso...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Controlla e Aggiorna DB
                                </>
                            )}
                        </Button>

                        {syncStatus && (
                            <div className={`mt-4 p-4 rounded-lg border ${syncStatus.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {syncStatus.success ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-600" />
                                    )}
                                    <span className={`font-semibold ${syncStatus.success ? 'text-green-800' : 'text-red-800'}`}>
                                        {syncStatus.success ? 'Operazione completata' : 'Operazione fallita'}
                                    </span>
                                </div>

                                {(syncStatus.stdout || syncStatus.stderr || syncStatus.message) && (
                                    <div className="mt-2 space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            <Terminal className="w-3 h-3" />
                                            Output console
                                        </div>
                                        <pre className="text-[10px] font-mono p-3 bg-slate-950 text-slate-50 rounded overflow-x-auto max-h-60">
                                            {syncStatus.stdout || ''}
                                            {syncStatus.stderr || ''}
                                            {syncStatus.message || ''}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-primary/20 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-primary" />
                            Inizializzazione Dati
                        </CardTitle>
                        <CardDescription>
                            Pre-popola le tabelle di sistema con i valori standard (Metodi di Pagamento, ecc.)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Se la tabella Metodi di Pagamento è vuota, usa questo pulsante per aggiungere automaticamente: Contanti, Bonifico, POS/Carta, Assegno.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => seedMethodsMutation.mutate()}
                            disabled={seedMethodsMutation.isPending}
                            className="w-full sm:w-auto"
                        >
                            {seedMethodsMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Inizializzazione...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Inizializza Metodi Pagamento
                                </>
                            )}
                        </Button>
                        {seedMethodsStatus && (
                            <div className={`mt-4 p-4 rounded-lg border ${seedMethodsStatus.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {seedMethodsStatus.success ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-600" />
                                    )}
                                    <span className={`font-semibold ${seedMethodsStatus.success ? 'text-green-800' : 'text-red-800'}`}>
                                        {seedMethodsStatus.success ? 'Operazione completata' : 'Operazione fallita'}
                                    </span>
                                </div>
                                {seedMethodsStatus.message && (
                                    <p className="text-sm text-muted-foreground">{seedMethodsStatus.message}</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-primary/20 shadow-sm border-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            Orari Globali del Centro
                        </CardTitle>
                        <CardDescription>
                            Imposta gli orari assoluti di apertura e chiusura. Questi sovrascriveranno i limiti delle singole sale e determineranno la griglia del Calendario e del Planning.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoadingHours ? (
                            <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Orario Apertura</label>
                                        <Select
                                            value={centerHours.start}
                                            onValueChange={(val) => setCenterHours({ ...centerHours, start: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TIME_SLOTS.map(t => <SelectItem key={`start-${t}`} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Orario Chiusura</label>
                                        <Select
                                            value={centerHours.end}
                                            onValueChange={(val) => setCenterHours({ ...centerHours, end: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TIME_SLOTS.map(t => <SelectItem key={`end-${t}`} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Giorni di Apertura Generale</label>
                                    <div className="flex flex-wrap gap-3 p-3 bg-muted/30 rounded-md border">
                                        {WEEKDAYS.map(day => (
                                            <div key={day.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`global-day-${day.id}`}
                                                    checked={centerHours.days.includes(day.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setCenterHours({ ...centerHours, days: [...centerHours.days, day.id] });
                                                        } else {
                                                            setCenterHours({ ...centerHours, days: centerHours.days.filter(d => d !== day.id) });
                                                        }
                                                    }}
                                                />
                                                <label htmlFor={`global-day-${day.id}`} className="text-sm leading-none font-medium cursor-pointer">
                                                    {day.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <Button
                                        onClick={() => saveCenterHoursMutation.mutate(centerHours)}
                                        disabled={saveCenterHoursMutation.isPending}
                                    >
                                        {saveCenterHoursMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Salva Impostazioni
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-primary/20 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19,4H18V2H16V4H8V2H6V4H5C3.89,4 3,4.9 3,6V20C3,21.1 3.89,22 5,22H19C20.11,22 21,21.1 21,20V6C21,4.9 20.11,4 19,4M19,20H5V10H19V20M19,8H5V6H19V8M7,12H12V17H7V12Z" />
                            </svg>
                            Integrazione Google Calendar
                        </CardTitle>
                        <CardDescription>
                            Sincronizza affitti e corsi con un calendario esterno.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-sm space-y-2">
                            <p className="font-medium">Stato Integrazione:</p>
                            <div className="flex items-center gap-2">
                                {googleStatus?.connected ? (
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                        <CheckCircle2 className="w-3 h-3 mr-1" /> Collegato
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-muted-foreground border-dashed">
                                        <XCircle className="w-3 h-3 mr-1" /> Non collegato
                                    </Badge>
                                )}
                                <span className="text-[10px] text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded font-medium">
                                    Metodo: {googleStatus?.method || 'Caricamento...'}
                                </span>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>Sync Automatico: <span className="text-green-600 font-semibold">Abilitato</span></li>
                                <li>Calendar ID: <code className="bg-muted px-1 rounded">{import.meta.env.VITE_GOOGLE_CALENDAR_ID || 'primary'}</code></li>
                            </ul>
                        </div>

                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <p className="text-xs text-blue-800 leading-relaxed">
                                <strong>Configurazione:</strong> Clicca su "Connetti Account" per scegliere l'account Google da utilizzare.
                                Assicurati di aver configurato <code>GOOGLE_CLIENT_ID</code> e <code>GOOGLE_CLIENT_SECRET</code> nel file <code>.env</code>.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant={googleStatus?.connected ? "outline" : "default"}
                                size="sm"
                                onClick={() => googleLoginMutation.mutate()}
                                disabled={googleLoginMutation.isPending}
                            >
                                {googleLoginMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Link2 className="w-4 h-4 mr-2" />}
                                {googleStatus?.connected ? "Cambia Account" : "Connetti Account"}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => refetchGoogleStatus()}>
                                Verifica Stato
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="opacity-60 cursor-not-allowed">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Terminal className="w-5 h-5" />
                            Log di Sistema
                        </CardTitle>
                        <CardDescription>
                            Visualizza gli ultimi log del server (Prossimamente)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-32 bg-muted rounded-md flex items-center justify-center italic text-muted-foreground">
                            Funzionalità in fase di sviluppo
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
