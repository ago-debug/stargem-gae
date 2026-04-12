import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QuoteListini from "@/pages/quote-listini";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface ListinoTabProps {
  seasonId: number | "active";
}

function BasePricesView({ seasonId }: { seasonId: number | "active" }) {
  const { data: catalog, isLoading, error } = useQuery({
    queryKey: ["/api/price-matrix/full-catalog", seasonId],
    queryFn: async () => {
      const res = await fetch(`/api/price-matrix/full-catalog?seasonId=${seasonId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    retry: 1
  });

  if (error) {
     return <div className="p-8 text-center text-slate-500">Endpoint /api/price-matrix/full-catalog non ancora disponibile o non implementato (404)</div>;
  }

  if (isLoading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  const currentMonthName = new Date().toLocaleString('it-IT', { month: 'long', year: 'numeric' });

  // Use dummy data if catalog is empty for visual prototype
  const displayData = catalog && catalog.length > 0 ? catalog : [
    { category: "Adulti", course1: 150, course2: 240, course3: 360, pack10: null },
    { category: "Bambini", course1: 70, course2: null, course3: null, pack10: null },
    { category: "Aerial", course1: 190, course2: null, course3: null, pack10: null },
    { category: "Privata sing.", course1: 55, course2: null, course3: null, pack10: 500 },
    { category: "Affitto 1+1", course1: "20/h", course2: null, course3: null, pack10: 150 },
  ];

  return (
    <div className="p-6">
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Categoria</TableHead>
              <TableHead>1 corso</TableHead>
              <TableHead>2 corsi</TableHead>
              <TableHead>3+ corsi</TableHead>
              <TableHead>Pack 10 / Extra</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((row: any, i: number) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{row.category}</TableCell>
                <TableCell>{row.course1 ? `${row.course1}€` : "—"}</TableCell>
                <TableCell>{row.course2 ? `${row.course2}€` : "—"}</TableCell>
                <TableCell>{row.course3 ? `${row.course3}€` : "—"}</TableCell>
                <TableCell>{row.pack10 ? `${row.pack10}€` : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-slate-500 mt-4 text-center italic">
        Prezzi aggiornati al mese di {currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)}
      </p>
    </div>
  );
}

export function ListinoTab({ seasonId }: ListinoTabProps) {
  const [selectedType, setSelectedType] = useState("adulti");
  const [viewMode, setViewMode] = useState<"mensile" | "base">("mensile");

  const activityTypes = [
    { value: "adulti", label: "Corsi Adulti" },
    { value: "bambini", label: "Bambini/Ragazzi" },
    { value: "aerial", label: "Discipline Aeree" },
    { value: "open", label: "Abbonamenti Open" },
    { value: "privata", label: "Lezioni Private" },
    { value: "affitto", label: "Affitti Sale" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100 p-1 rounded-md w-fit mx-auto mb-4">
        <Button 
          variant={viewMode === "mensile" ? "default" : "ghost"} 
          size="sm" 
          onClick={() => setViewMode("mensile")}
          className="rounded-sm"
        >
          Vista Mensile
        </Button>
        <Button 
          variant={viewMode === "base" ? "default" : "ghost"} 
          size="sm" 
          onClick={() => setViewMode("base")}
          className="rounded-sm"
        >
          Vista Prezzi Base
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center bg-slate-50 border-b pb-4">
          <div>
            <CardTitle className="text-xl">Listino Prezzi</CardTitle>
            <CardDescription>
              {viewMode === "mensile" 
                ? "Gestione quote mensili e calcolo automatico per lezioni."
                : "Catalogo base applicato come punto di partenza per il trimestre in corso."}
            </CardDescription>
          </div>
          {viewMode === "mensile" && (
            <div className="w-64">
               <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="bg-white font-semibold">
                     <SelectValue placeholder="Seleziona Categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                     {activityTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {viewMode === "mensile" ? (
             <QuoteListini activityType={selectedType} embeddedMode={true} seasonId={seasonId} />
          ) : (
             <BasePricesView seasonId={seasonId} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
