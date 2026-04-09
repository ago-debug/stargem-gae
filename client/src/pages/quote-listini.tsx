import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { type CourseQuotesGrid } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, AlertCircle, RefreshCw, Loader2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Definiamo i 10 periodi di default come da struttura Excel (C-V = 20 colonne)
const PERIODS = [
    "Settembre", "Ottobre", "Novembre", "Dicembre",
    "Gennaio", "Febbraio", "Marzo", "Aprile",
    "Maggio", "Giugno"
];

const CATEGORY_COLORS: Record<string, string> = {
    "OPEN": "bg-green-100 text-green-800 border-green-300",
    "ADULTI": "bg-blue-100 text-blue-800 border-blue-300",
    "AEREAL": "bg-pink-100 text-pink-800 border-pink-300",
    "BAMBINI": "bg-orange-100 text-orange-800 border-orange-300",
    "TEEN": "bg-orange-100 text-orange-800 border-orange-300",
    "PROVE": "bg-gray-100 text-gray-800 border-gray-300",
    "DEFAULT": "bg-slate-100 text-slate-800 border-slate-300"
};

interface QuoteListiniProps {
    activityType?: string;
    embeddedMode?: boolean;
    seasonId?: number | "active";
}

export default function QuoteListini(props: QuoteListiniProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [, params] = useRoute("/quote-listini/:activityType");
    const activityType = props.activityType ?? params?.activityType ?? "corsi";

    // State to manage input values before they are saved to DB
    const [rows, setRows] = useState<CourseQuotesGrid[]>([]);
    const [isIterating, setIsIterating] = useState(false);

    // Query to fetch initial list data
    const { data: gridData = [], isLoading } = useQuery<CourseQuotesGrid[]>({
        queryKey: ["/api/course-quotes-grid", activityType, props.seasonId || "active"],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/course-quotes-grid?activityType=${activityType}&seasonId=${props.seasonId || "active"}`);
            return res;
        }
    });

    // Sync state with DB only when data is initially loaded or refreshed externally
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (!isLoading && !isInitialized) {
            if (gridData && gridData.length > 0) {
                // Ensure monthsData is properly parsed if it comes as a string from DB
                const parsedGridData = gridData.map(row => {
                    let parsedMonthsData = row.monthsData;
                    if (typeof parsedMonthsData === 'string') {
                        try {
                            // Sometime it might be double stringified due to previous bug
                            let unwrapped: any = parsedMonthsData;
                            while (typeof unwrapped === 'string') {
                                unwrapped = JSON.parse(unwrapped);
                            }

                            parsedMonthsData = unwrapped;
                        } catch (e) {
                            console.error("Failed to parse monthsData", e);
                            parsedMonthsData = PERIODS.reduce((acc, p) => ({ ...acc, [p]: { quota: null, lezioni: null } }), {});
                        }
                    }
                    return { ...row, monthsData: parsedMonthsData };
                });
                setRows(parsedGridData);
            } else if (!isIterating) {
                // Initialize with an empty row if DB is completely empty just to show the UI
                const newRows = [{
                    id: 0,
                    activityType,
                    category: "NUOVO",
                    description: "",
                    details: "",
                    corsiWeek: 1,
                    sortOrder: 1,
                    monthsData: PERIODS.reduce((acc, p) => ({ ...acc, [p]: { quota: null, lezioni: null } }), {})
                } as CourseQuotesGrid];
                setRows(newRows);
            }
            setIsInitialized(true);
        }
    }, [gridData, isLoading, isInitialized, isIterating, activityType]);

    // Bulk Upsert Mutation
    const saveMutation = useMutation({
        mutationFn: async (dataToSave: any[]) => {
            // Remove all IDs to allow clean bulk insert and auto-increment DB generation
            // Remove id, createdAt, updatedAt to ensure shape matching for Drizzle bulk insert
            const cleaned = dataToSave.map((r, i) => {
                const { id, createdAt, updatedAt, ...rest } = r as any;
                return {
                    ...rest,
                    activityType,
                    corsiWeek: typeof rest.corsiWeek === 'string' ? Number(rest.corsiWeek) : (rest.corsiWeek || 1),
                    sortOrder: typeof rest.sortOrder === 'string' ? Number(rest.sortOrder) : (rest.sortOrder ?? i),
                    category: rest.category || 'NUOVO',
                    description: rest.description || '',
                    details: rest.details || '',
                    monthsData: typeof rest.monthsData === 'string' ? JSON.parse(rest.monthsData) : rest.monthsData
                };
            });
            await apiRequest("POST", `/api/course-quotes-grid/bulk?activityType=${activityType}`, cleaned);
        },
        onSuccess: () => {
            toast({ title: "Salvato", description: "Griglia aggiornata con successo." });
            setIsInitialized(false); // Force re-sync with DB on next fetch
            queryClient.invalidateQueries({ queryKey: ["/api/course-quotes-grid", activityType] });
        },
        onError: (err) => {
            toast({ title: "Errore", description: "Impossibile salvare i dati.", variant: "destructive" });
        }
    });

    const handleCellChange = (rowIndex: number, month: string, field: 'quota' | 'lezioni', value: string) => {
        setRows((prev: CourseQuotesGrid[]) => {
            const next = [...prev];
            const val = value.replace(",", ".");
            const numVal = val === "" ? null : Number(val);

            const currentMonths = next[rowIndex].monthsData as Record<string, { quota: number | null, lezioni: number | null }>;
            next[rowIndex] = {
                ...next[rowIndex],
                monthsData: {
                    ...currentMonths,
                    [month]: {
                        ...currentMonths[month],
                        [field]: numVal
                    }
                }
            };
            return next;
        });
    };

    const handleChange = (rowIndex: number, field: keyof CourseQuotesGrid, value: string | number | null) => {
        setRows((prev: CourseQuotesGrid[]) => {
            const next = [...prev];
            (next[rowIndex] as any)[field] = value;
            return next;
        });
    };

    const addRow = () => {
        setRows((prev: CourseQuotesGrid[]) => [
            ...prev,
            {
                id: 0,
                activityType,
                category: "NUOVO",
                description: "",
                details: "",
                corsiWeek: 1,
                sortOrder: prev.length + 1,
                monthsData: PERIODS.reduce((acc, p) => ({ ...acc, [p]: { quota: null, lezioni: null } }), {})
            } as CourseQuotesGrid
        ]);
    };

    const removeRow = (rowIndex: number) => {
        if (confirm("Sei sicuro di voler eliminare questa riga? Il salvataggio renderà la modifica permanente.")) {
            setRows((prev: CourseQuotesGrid[]) => prev.filter((_, i) => i !== rowIndex));
        }
    };

    if (isLoading) {
        return <div className="p-8 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className={`flex flex-col ${props.embeddedMode ? 'h-[75vh] p-0' : 'h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8'} overflow-hidden bg-slate-50 relative`}>
            {!props.embeddedMode ? (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">
                            Quote e Agevolazioni Corsi
                        </h1>
                        <p className="text-sm text-slate-500">
                            Replica interattiva Q1C - Gestione Listini Mensili
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={addRow} className="shadow-sm">
                            + Aggiungi Riga
                        </Button>
                        <Button
                            onClick={() => saveMutation.mutate(rows)}
                            disabled={saveMutation.isPending}
                            className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white shadow-md border-0 ring-1 ring-amber-700/20"
                        >
                            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Salva Griglia
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-end mb-4 gap-2 shrink-0">
                    <Button variant="outline" onClick={addRow} className="shadow-sm">
                        + Aggiungi Riga
                    </Button>
                    <Button
                        onClick={() => saveMutation.mutate(rows)}
                        disabled={saveMutation.isPending}
                        className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white shadow-md border-0 ring-1 ring-amber-700/20"
                    >
                        {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salva Griglia
                    </Button>
                </div>
            )}

            <Alert className="mb-4 bg-amber-50 border-amber-200 shrink-0">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 font-semibold">ATTENZIONE</AlertTitle>
                <AlertDescription className="text-amber-700">
                    Tutte le quote indicate in questo listino sono calcolate <strong>SENZA i €25,00</strong> per Quota Tessera/Assicurazione.
                </AlertDescription>
            </Alert>

            {/* Scorrevole orizzontale e verticale */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-auto max-h-full">
                    <Table className="relative min-w-max text-xs sm:text-sm">
                        <TableHeader className="sticky top-0 z-20 bg-slate-100 outline outline-1 outline-slate-200">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="bg-slate-100 z-30 font-semibold min-w-24 border-r border-slate-200 sticky left-0">Categoria</TableHead>
                                <TableHead className="bg-slate-100 z-30 font-semibold min-w-48 border-r border-slate-200 sticky left-[96px]">Descrizione</TableHead>
                                <TableHead className="bg-slate-100 font-semibold min-w-48 border-r border-slate-200">Dettagli</TableHead>

                                {/* C-V: Colonne Mesi (2 colonne per ogni mese: Quota / Lezioni) */}
                                {PERIODS.map(p => (
                                    <TableHead key={`head-${p}`} colSpan={2} className="bg-slate-100 text-center font-bold border-r border-slate-200 border-b">
                                        {p}
                                    </TableHead>
                                ))}

                                <TableHead className="bg-slate-100 font-bold min-w-24 text-center border-r border-slate-200" rowSpan={2}>
                                    Corsi/Sett.<br /><span className="text-slate-500 font-normal">(Par. W)</span>
                                </TableHead>

                                {/* X-AG: Calcolo Costo per Corso (10 periodi) */}
                                {PERIODS.map(p => (
                                    <TableHead key={`calc-head-${p}`} className="bg-emerald-50 text-center font-bold text-emerald-800 border-r border-emerald-200">
                                        Costo / Corso<br /><span className="text-emerald-600/80 font-normal text-xs">{p}</span>
                                    </TableHead>
                                ))}
                                <TableHead className="bg-slate-100 text-center font-bold min-w-16">Azioni</TableHead>
                            </TableRow>

                            {/* Second Level Header for Quota / Lezioni */}
                            <TableRow className="hover:bg-transparent shadow-sm">
                                {/* Vuoti per le prime 3 colonne fisse che usano sticky in the first row implicitly (Wait, HTML table non gestisce bene rowSpan\colSpan con sticky left, per semplicità abbiamo un solo thead row o thead fix) */}
                                <TableHead className="bg-slate-100 z-30 border-r border-slate-200 sticky left-0 p-0 top-[40px]"></TableHead>
                                <TableHead className="bg-slate-100 z-30 border-r border-slate-200 sticky left-[96px] p-0 top-[40px]"></TableHead>
                                <TableHead className="bg-slate-100 border-r border-slate-200 top-[40px]"></TableHead>

                                {PERIODS.map(p => (
                                    <React.Fragment key={`subhead-${p}`}>
                                        <TableHead className="bg-slate-50 text-slate-600 text-center text-xs border-r border-slate-200 min-w-[80px] p-2 top-[40px]">Quota €</TableHead>
                                        <TableHead className="bg-slate-50 text-slate-600 text-center text-xs border-r border-slate-300 min-w-[70px] p-2 top-[40px]">n° Lez.</TableHead>
                                    </React.Fragment>
                                ))}

                                <TableHead className="bg-slate-100 border-r border-slate-200 top-[40px]"></TableHead>

                                {PERIODS.map(p => (
                                    <TableHead key={`calcr-${p}`} className="bg-emerald-50 border-r border-emerald-200 min-w-[90px] top-[40px]"></TableHead>
                                ))}
                                <TableHead className="bg-slate-100 top-[40px]"></TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {rows.map((row, rowIndex) => {
                                const monthsData = (row.monthsData || {}) as Record<string, { quota: number | null, lezioni: number | null }>;
                                const w = row.corsiWeek || 1;

                                // Extract category base for color
                                const catKey = Object.keys(CATEGORY_COLORS).find(k => row.category.toUpperCase().includes(k)) || "DEFAULT";
                                const colorClass = CATEGORY_COLORS[catKey];

                                return (
                                    <TableRow key={rowIndex} className="hover:bg-slate-50/50 group">
                                        <TableCell className="p-2 border-r border-slate-200 bg-white group-hover:bg-slate-50 sticky left-0 z-10 w-28">
                                            <Input
                                                value={row.category}
                                                onChange={(e) => handleChange(rowIndex, "category", e.target.value)}
                                                className={`h-8 font-semibold uppercase text-xs ${colorClass}`}
                                            />
                                        </TableCell>
                                        <TableCell className="p-2 border-r border-slate-200 bg-white group-hover:bg-slate-50 sticky left-[96px] z-10 w-56">
                                            <Input
                                                value={row.description}
                                                onChange={(e) => handleChange(rowIndex, "description", e.target.value)}
                                                className="h-8 text-sm font-medium"
                                                placeholder="es. 1 LEZIONE SETT."
                                            />
                                        </TableCell>
                                        <TableCell className="p-2 border-r border-slate-200 w-56">
                                            <Input
                                                value={row.details || ""}
                                                onChange={(e) => handleChange(rowIndex, "details", e.target.value)}
                                                className="h-8 text-xs text-slate-500"
                                                placeholder="(sconti, note, etc.)"
                                            />
                                        </TableCell>

                                        {/* Inputs per Quota e Num Lezioni mensili */}
                                        {PERIODS.map(p => {
                                            const mData = monthsData[p] || { quota: null, lezioni: null };
                                            return (
                                                <React.Fragment key={`input-${p}`}>
                                                    <TableCell className="p-1 border-r border-slate-200">
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            value={mData.quota ?? ""}
                                                            onChange={(e) => handleCellChange(rowIndex, p, "quota", e.target.value)}
                                                            className="h-8 text-right w-20 text-blue-700 font-medium"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="p-1 border-r border-slate-300">
                                                        <Input
                                                            type="number"
                                                            value={mData.lezioni ?? ""}
                                                            onChange={(e) => handleCellChange(rowIndex, p, "lezioni", e.target.value)}
                                                            className="h-8 text-right w-16 text-slate-600 bg-slate-50"
                                                        />
                                                    </TableCell>
                                                </React.Fragment>
                                            );
                                        })}

                                        <TableCell className="p-2 border-r border-slate-200 bg-slate-50">
                                            <Input
                                                type="number"
                                                value={row.corsiWeek ?? ""}
                                                onChange={(e) => handleChange(rowIndex, "corsiWeek", parseInt(e.target.value) || 1)}
                                                className="h-8 text-center font-bold bg-white"
                                            />
                                        </TableCell>

                                        {/* Calcoli Costo / Corso */}
                                        {PERIODS.map(p => {
                                            const mData = monthsData[p] || { quota: null };
                                            const quota = mData.quota;
                                            let costo = "-";
                                            if (quota !== null && quota !== undefined && w > 0) {
                                                costo = (quota / w).toFixed(2) + " €";
                                            }

                                            return (
                                                <TableCell key={`calcval-${p}`} className="p-2 border-r border-emerald-100 bg-emerald-50/30 text-right font-medium text-emerald-700">
                                                    {costo}
                                                </TableCell>
                                            );
                                        })}

                                        <TableCell className="p-2 text-center">
                                            <Button variant="ghost" size="icon" onClick={() => removeRow(rowIndex)} className="text-red-500 hover:bg-red-50 hover:text-red-700 h-8 w-8">
                                                <AlertCircle className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
